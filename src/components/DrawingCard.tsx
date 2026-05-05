import React from 'react';
import { Download, Printer, Trash2, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { generatePDF, PageSize } from '../services/pdf';

interface DrawingCardProps {
  id: string;
  url: string;
  prompt: string;
  isPremium: boolean;
  onDelete: (id: string) => void;
}

export const DrawingCard: React.FC<DrawingCardProps> = ({ id, url, prompt, isPremium, onDelete }) => {
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [pageSize, setPageSize] = React.useState<PageSize>("a4");

  const handleDownload = async () => {
    if (pageSize === 'a3' && !isPremium) {
      alert("A3 sizes are for Premium users only!");
      return;
    }
    setIsPrinting(true);
    try {
      await generatePDF(url, prompt, pageSize, isPremium);
    } catch (error) {
      console.error(error);
      alert("Oops! Could not create PDF. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group"
    >
      <div className="aspect-[3/4] relative bg-gray-50 overflow-hidden">
        <img
          src={url}
          alt={prompt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => onDelete(id)}
            className="p-2 bg-white border-2 border-black rounded-full hover:bg-red-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Trash2 size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <h3 className="text-lg font-bold truncate capitalize" title={prompt}>
          {prompt}
        </h3>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as PageSize)}
            className="flex-1 px-3 py-2 border-2 border-black rounded-xl font-bold bg-yellow-50 focus:outline-none"
          >
            <option value="a4">PDF Size: A4</option>
            <option value="a3">PDF Size: A3 {!isPremium && '🔒'}</option>
          </select>
          
          <button
            onClick={handleDownload}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white font-black border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrinting ? "Working..." : (
              <>
                <Download size={18} />
                Print PDF
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
