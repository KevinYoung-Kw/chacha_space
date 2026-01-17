
import React from 'react';
import { TarotResult } from '../../types';
import { Sparkles, Sun, AlertCircle, Heart, Star, Moon, Quote, ArrowDown } from 'lucide-react';

interface DivinationPanelProps {
  result?: TarotResult;
}

const DivinationPanel: React.FC<DivinationPanelProps> = ({ result }) => {
  const data = result || {
    cards: [
      { position: 'Past', name: 'The Sun', meaning: 'Joy, success, celebration, and positivity.', type: 'positive', orientation: 'upright' },
      { position: 'Present', name: 'Five of Wands', meaning: 'Avoiding conflict, respecting differences.', type: 'challenge', orientation: 'reversed' },
      { position: 'Future', name: 'Queen of Cups', meaning: 'Compassion, calm, comfort, and intuition.', type: 'advice', orientation: 'upright' }
    ],
    analysis: "The cards suggest a transition from a period of great joy into a time where you are learning to manage minor conflicts with grace, leading to emotional maturity.",
    advice: "Trust your intuition today. Approach others with empathy rather than logic."
  };

  return (
    <div className="bg-[#0f0c29] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden font-sans h-full flex flex-col relative text-white selection:bg-purple-500/30">
      
      {/* Background Ambience */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0f0c29] to-[#0f0c29] animate-spin-slow-reverse pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 pt-6 pb-2 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.2)] mb-2">
           <Moon size={12} className="text-purple-300" />
           <span className="text-[10px] font-bold tracking-[0.2em] text-purple-200 uppercase">Star Whispers</span>
           <Sparkles size={12} className="text-purple-300" />
        </div>
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-100 via-white to-purple-100 tracking-wide drop-shadow-sm mb-2">
            今日神谕
        </h2>
        
        {/* Daily Luck Rating */}
        <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} className={`${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} drop-shadow-md`} />
            ))}
        </div>
      </div>

      {/* Main Content Scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8 space-y-6 relative z-10">
         
         {/* Advice Card */}
         <div className="relative mt-1 group">
             <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur opacity-20 group-hover:opacity-30 transition-opacity rounded-2xl"></div>
             <div className="relative bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm text-center">
                 <Quote size={16} className="mx-auto text-purple-400 mb-2 opacity-50" />
                 <p className="text-sm text-purple-50 font-medium leading-relaxed italic font-serif">
                    "{data.advice}"
                 </p>
             </div>
         </div>

         {/* Energy Keywords */}
         <div className="flex justify-center gap-2">
            {['创造力 ✨', '直觉 🔮', '平静 🌊'].map((tag, i) => (
               <span key={i} className="px-2.5 py-1 bg-purple-900/40 border border-purple-500/20 rounded-lg text-[10px] text-purple-200 font-bold tracking-wide">
                   {tag}
               </span>
            ))}
         </div>

         {/* The Spread (Vertical Timeline) */}
         <div className="relative pt-2 pl-2">
            {/* Continuous Timeline Line */}
            <div className="absolute left-[3.25rem] top-6 bottom-12 w-0.5 bg-gradient-to-b from-purple-500/30 via-purple-500/10 to-transparent z-0"></div>

            <div className="space-y-6">
                {data.cards.map((card, idx) => (
                    <div key={idx} className="relative z-10 flex gap-4 group">
                        
                        {/* Time Label */}
                        <div className="w-20 text-right pt-2 flex flex-col items-end flex-shrink-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1 shadow-sm
                                ${idx === 0 ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 
                                  idx === 1 ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 
                                  'bg-blue-500/20 text-blue-200 border border-blue-500/30'}`}>
                                {card.position}
                            </span>
                        </div>

                        {/* Card Visual Node */}
                        <div className="relative">
                            <div className="w-3 h-3 bg-[#0f0c29] border-2 border-purple-400 rounded-full mt-2.5 relative z-10 group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        </div>

                        {/* Card Detail */}
                        <div className="flex-1 bg-[#1a163a] border border-white/10 p-3 rounded-xl hover:border-purple-500/40 transition-all shadow-lg hover:shadow-purple-900/20 group-hover:-translate-y-1 duration-300">
                            <div className="flex items-start gap-3">
                                {/* Mini Card Icon */}
                                <div className={`w-10 h-14 rounded border border-white/20 flex items-center justify-center shadow-inner flex-shrink-0
                                    ${idx === 0 ? 'bg-amber-900/40' : idx === 1 ? 'bg-red-900/40' : 'bg-blue-900/40'}`}>
                                    {idx === 0 ? <Sun size={16} className="text-amber-200"/> : 
                                     idx === 1 ? <AlertCircle size={16} className="text-red-200"/> : 
                                     <Heart size={16} className="text-blue-200"/>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-sm text-white">{card.name}</h3>
                                        <span className="text-[9px] text-gray-400 border border-white/10 px-1 rounded bg-white/5">
                                            {card.orientation === 'reversed' ? '逆' : '正'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        {card.meaning}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
         
         <div className="text-center pt-4 pb-2">
             <div className="inline-block p-2 rounded-full bg-white/5 border border-white/5">
                <ArrowDown size={14} className="text-purple-500/50 animate-bounce" />
             </div>
             <p className="text-[9px] text-purple-400/30 uppercase tracking-[0.3em] mt-2">Mystic Tata</p>
         </div>

      </div>
    </div>
  );
};

export default DivinationPanel;
