import React, { useState, useEffect } from 'react';
import { Wand2, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DrawingStyle, brainstormIdeas, refinePrompt } from '../services/gemini';

interface PromptInputProps {
  onGenerate: (prompt: string, style: DrawingStyle) => void;
  isGenerating: boolean;
  isPremium: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, isGenerating, isPremium }) => {
  const [prompt, setPrompt] = React.useState("");
  const [style, setStyle] = React.useState<DrawingStyle>("coloring-page");
  const [isRefining, setIsRefining] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const ideas = await brainstormIdeas();
    setSuggestions(ideas);
    setIsLoadingSuggestions(false);
  };

  const handleRefine = async () => {
    if (!prompt.trim() || isRefining) return;
    setIsRefining(true);
    const refined = await refinePrompt(prompt);
    setPrompt(refined);
    setIsRefining(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt, style);
      setPrompt("");
    }
  };

  const styles: { id: DrawingStyle; label: string; color: string; premium?: boolean }[] = [
    { id: 'coloring-page', label: 'Basic Outline', color: 'bg-green-300' },
    { id: 'cartoon', label: 'Classic Cartoon', color: 'bg-orange-300' },
    { id: 'educational-worksheet', label: 'Sheet (Trace)', color: 'bg-blue-300', premium: true },
    { id: 'thick-outline', label: 'For Toddlers', color: 'bg-yellow-300', premium: true },
    { id: 'advanced-detailed', label: 'Advanced Art', color: 'bg-purple-300', premium: true },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should we draw? (e.g. 'A friendly robot')"
            className="w-full px-8 py-6 pr-32 text-xl font-bold border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 placeholder:text-gray-400 transition-all group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefine}
              disabled={!prompt.trim() || isRefining}
              title="Refine with AI Magic"
              className="p-3 bg-yellow-300 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:translate-y-[2px] transition-all disabled:opacity-50"
            >
              <Zap size={20} className={isRefining ? 'animate-pulse' : ''} />
            </button>
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="p-4 bg-purple-500 text-white rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Sparkles size={24} />
                  </motion.div>
              ) : (
                <Wand2 size={24} />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {styles.map((s) => {
            const isLocked = s.premium && !isPremium;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => isLocked ? alert("Upgrade to unlock premium styles!") : setStyle(s.id)}
                className={`relative px-4 py-2 border-2 border-black rounded-2xl font-black text-xs transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 inline-flex items-center gap-2 ${
                  style === s.id 
                    ? `${s.color} translate-y-[2px] translate-x-[2px] shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]` 
                    : 'bg-white'
                } ${isLocked ? 'opacity-80 font-kids text-base' : ''}`}
              >
                <span className={isLocked ? 'blur-[1.5px]' : ''}>{s.label}</span>
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-2xl">
                    <Sparkles size={14} className="text-purple-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest opacity-60">
          <Sparkles size={16} />
          Need Inspiration?
          <button 
            onClick={fetchSuggestions}
            className="ml-2 p-1 hover:rotate-180 transition-transform duration-500"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <AnimatePresence mode="wait">
            {isLoadingSuggestions ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-bold text-gray-400"
              >
                Summoning ideas...
              </motion.div>
            ) : (
              suggestions.map((idea, i) => (
                <motion.button
                  key={idea}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setPrompt(idea)}
                  className="px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-full text-sm font-bold text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-all"
                >
                  {idea}
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
