import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Palette, Printer, Heart, ExternalLink, Brush, Eraser, Star, Sparkles } from 'lucide-react';
import { DrawingCard } from './components/DrawingCard';
import { PromptInput } from './components/PromptInput';
import { PricingModal } from './components/PricingModal';
import { generateDrawing, DrawingStyle } from './services/gemini';

interface Drawing {
  id: string;
  url: string;
  prompt: string;
  style: DrawingStyle;
  createdAt: number;
}

const FREE_LIMIT = 2;

export default function App() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Premium and Usage States
  const [isPremium, setIsPremium] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [showPricing, setShowPricing] = useState(false);

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem('doodle_drawings');
    const savedPremium = localStorage.getItem('doodle_premium') === 'true';
    const savedUsage = JSON.parse(localStorage.getItem('doodle_usage') || '{"count": 0, "date": ""}');
    
    // Reset usage if it's a new day
    const today = new Date().toDateString();
    if (today !== savedUsage.date) {
      setDailyUsage(0);
    } else {
      setDailyUsage(savedUsage.count);
    }

    if (saved) {
      try {
        setDrawings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load drawings", e);
      }
    }
    setIsPremium(savedPremium);
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem('doodle_drawings', JSON.stringify(drawings));
    localStorage.setItem('doodle_premium', String(isPremium));
    localStorage.setItem('doodle_usage', JSON.stringify({
      count: dailyUsage,
      date: new Date().toDateString()
    }));
  }, [drawings, isPremium, dailyUsage]);

  const handleGenerate = async (prompt: string, style: DrawingStyle) => {
    // Check Limits
    if (!isPremium && dailyUsage >= FREE_LIMIT) {
      setShowPricing(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateDrawing(prompt, style);
      const newDrawing: Drawing = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        prompt,
        style,
        createdAt: Date.now(),
      };
      
      setDrawings(prev => [newDrawing, ...prev]);
      setDailyUsage(prev => prev + 1);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
      });
    } catch (err) {
      setError("The magic didn't work this time. Let's try another prompt!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const priceId = plan === 'monthly' ? import.meta.env.VITE_MONTHLY_PRICE_ID : import.meta.env.VITE_YEARLY_PRICE_ID;
      
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: window.location.origin + "?payment=success",
          cancelUrl: window.location.origin,
        }),
      });

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error(error);
      alert("Checkout failed. Please try again.");
    }
  };

  // Mock successful payment for demo purposes if URL has query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setIsPremium(true);
      confetti({ particleCount: 200, spread: 100 });
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleDelete = (id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FFFBEA] text-black font-sans selection:bg-purple-300">
      <AnimatePresence>
        {showPricing && (
          <PricingModal 
            onClose={() => setShowPricing(false)} 
            onUpgrade={handleUpgrade}
          />
        )}
      </AnimatePresence>

      <header className="p-8 pb-12 max-w-7xl mx-auto text-center space-y-4">
        <div className="flex justify-center gap-4 mb-4">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-4 px-6 py-2 bg-white border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {isPremium ? (
              <div className="flex items-center gap-2 text-purple-600 font-black">
                <Star className="fill-purple-600" size={18} /> PREMIUM ACCOUNT
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Printer size={16} /> 
                <span className="font-bold text-sm uppercase tracking-widest">
                  Daily Usage: {dailyUsage} / {FREE_LIMIT}
                </span>
              </div>
            )}
          </motion.div>
          {!isPremium && (
            <button 
              onClick={() => setShowPricing(true)}
              className="px-6 py-2 bg-purple-500 text-white font-black border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-400 transition-all flex items-center gap-2"
            >
              <Sparkles size={16} /> Upgrade
            </button>
          )}
        </div>

        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="text-6xl md:text-8xl font-black tracking-tighter"
        >
          Doodle<span className="text-purple-500">PDF</span>
        </motion.h1>
        
        <p className="text-xl font-bold opacity-70 max-w-xl mx-auto">
          Turn any idea into a printable coloring page! <br />
          Perfect for schools, rainy days, and mini artists.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24 space-y-16">
        <section className="bg-white p-8 md:p-12 border-4 border-black rounded-[40px] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-black italic">Start Your Creation!</h2>
            <PromptInput 
              onGenerate={handleGenerate} 
              isGenerating={isGenerating} 
              isPremium={isPremium}
            />
            
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 font-bold"
              >
                {error}
              </motion.p>
            )}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black">Your Gallery</h2>
            {drawings.length > 0 && (
              <button 
                onClick={() => { if(confirm("Clear all drawings?")) setDrawings([]); }}
                className="text-sm font-bold underline hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {drawings.length === 0 ? (
            <div className="text-center py-20 bg-gray-100/50 border-4 border-dashed border-gray-300 rounded-[40px]">
              <p className="text-2xl font-bold text-gray-400">No drawings yet. Time to invent something fun!</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {drawings.map((drawing) => (
                  <DrawingCard
                    key={drawing.id}
                    {...drawing}
                    isPremium={isPremium}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      <footer className="p-12 text-center border-t-4 border-black bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-black text-lg">Made with 🎨 for little explorers.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowPricing(true)}
              className="p-3 bg-blue-100 border-2 border-black rounded-xl hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Heart className={`text-red-400 ${isPremium ? 'fill-red-400' : ''}`} />
            </button>
            <a 
              href="https://ai.studio" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-yellow-300 font-black border-2 border-black rounded-xl hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Powered by Google AI <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

