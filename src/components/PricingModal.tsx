import React from 'react';
import { motion } from 'motion/react';
import { X, Check, Star, Zap, Heart } from 'lucide-react';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: (plan: 'monthly' | 'yearly') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-4 border-black rounded-[40px] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full p-8 md:p-12 relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={32} />
        </button>

        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-yellow-300 border-2 border-black rounded-full text-xs font-black uppercase tracking-widest">
            <Heart size={14} className="fill-red-500 text-red-500" />
            Best for Parents & Teachers
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic">Upgrade DoodlePDF</h2>
          <p className="text-xl font-bold text-gray-500">
            Unlock the full creative power for your kids!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Features */}
          <div className="space-y-8">
            <h3 className="text-2xl font-black">Why GO PREMIUM?</h3>
            <ul className="space-y-4">
              {[
                "Unlimited Daily Drawings",
                "High-Resolution Print Files",
                "No Watermarks on PDFs",
                "Premium Styles (A3, Toddler, Advanced)",
                "Priority Generation Speed"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-4 font-bold text-lg">
                  <div className="bg-green-100 p-1 rounded-full border-2 border-black">
                    <Check size={20} className="text-green-600" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Plans */}
          <div className="space-y-6">
            {/* Monthly */}
            <div className="p-6 border-4 border-black rounded-3xl space-y-4 hover:bg-blue-50 transition-colors group relative">
              <div className="flex justify-between items-center">
                <span className="font-black text-2xl group-hover:text-blue-600">Monthly</span>
                <span className="text-2xl font-black">€5<span className="text-sm">/mo</span></span>
              </div>
              <button 
                onClick={() => onUpgrade('monthly')}
                className="w-full py-4 bg-white border-2 border-black rounded-2xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 hover:text-white transition-all transform hover:-translate-y-1"
              >
                Go Monthly
              </button>
            </div>

            {/* Yearly */}
            <div className="p-6 border-4 border-black rounded-3xl space-y-4 bg-yellow-50 relative overflow-hidden group">
              <div className="absolute top-2 right-2 bg-purple-500 text-white px-3 py-1 border-2 border-black rounded-full text-[10px] font-black rotate-12">
                BEST DEAL!
              </div>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="font-black text-2xl block">Yearly</span>
                  <span className="text-green-600 font-bold text-sm">Save €10 (2 months free)</span>
                </div>
                <span className="text-2xl font-black">€50<span className="text-sm">/yr</span></span>
              </div>
              <button 
                onClick={() => onUpgrade('yearly')}
                className="w-full py-4 bg-purple-500 text-white border-2 border-black rounded-2xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-400 hover:translate-x-[2px] transition-all"
              >
                Go Yearly
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm font-bold text-gray-400 flex items-center justify-center gap-2">
          <Zap size={16} /> Instant activation. Secure payments by Stripe.
        </div>
      </motion.div>
    </div>
  );
};
