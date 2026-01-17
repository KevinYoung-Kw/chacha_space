
import React from 'react';
import { TarotResult } from '../../types';
import { Sparkles, Sun, AlertCircle, Heart, Star, Moon, Quote, Palette, Eye, Waves } from 'lucide-react';

interface DivinationPanelProps {
  result?: TarotResult;
}

const DivinationPanel: React.FC<DivinationPanelProps> = ({ result }) => {
  const data = result || {
    cards: [
      { position: '过去', name: 'The Sun', meaning: '喜悦、成功、庆祝和积极性。', type: 'positive', orientation: 'upright' },
      { position: '现在', name: 'Five of Wands', meaning: '避免冲突，尊重差异。', type: 'challenge', orientation: 'reversed' },
      { position: '未来', name: 'Queen of Cups', meaning: '同情、平静、舒适和直觉。', type: 'advice', orientation: 'upright' }
    ],
    analysis: "牌面显示你正从一段快乐时光过渡到学会优雅地处理小冲突的阶段，这将带来情感上的成熟。",
    advice: "今天相信你的直觉。以同理心而非逻辑去对待他人。"
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
           <Moon size={16} className="text-purple-500" />
           <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Star Whispers</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            今日神谕
        </h2>
        
        {/* Daily Luck Rating */}
        <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} className={`${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-[var(--color-bg-accent)]'}`} />
            ))}
            <span className="text-xs text-[var(--color-text-muted)] ml-2">运势良好</span>
        </div>
      </div>

      {/* Main Content Scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-5">
         
         {/* Advice Card */}
         <div className="bg-white/60 border border-[var(--color-border-subtle)] p-4 rounded-2xl">
             <Quote size={16} className="text-purple-400 mb-2" />
             <p className="text-sm text-[var(--color-text-primary)] font-medium leading-relaxed">
                "{data.advice}"
             </p>
         </div>

         {/* Energy Keywords */}
         <div className="flex gap-2">
            {[
              { name: '创造力', icon: <Palette size={12} className="text-amber-500" /> },
              { name: '直觉', icon: <Eye size={12} className="text-purple-500" /> },
              { name: '平静', icon: <Waves size={12} className="text-blue-500" /> }
            ].map((tag, i) => (
               <span key={i} className="px-3 py-1.5 bg-white/60 border border-[var(--color-border-subtle)] rounded-full text-xs text-[var(--color-text-secondary)] font-medium flex items-center gap-1.5">
                   {tag.icon}
                   {tag.name}
               </span>
            ))}
         </div>

         {/* The Spread (Card List) */}
         <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide px-1">牌阵解读</h3>
            
            {data.cards.map((card, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/60 border border-[var(--color-border-subtle)] p-4 rounded-2xl flex gap-4"
                >
                    {/* Card Icon */}
                    <div className={`w-12 h-16 rounded-xl flex items-center justify-center flex-shrink-0
                        ${idx === 0 ? 'bg-amber-50 text-amber-500' : 
                          idx === 1 ? 'bg-rose-50 text-rose-500' : 
                          'bg-blue-50 text-blue-500'}`}
                    >
                        {idx === 0 ? <Sun size={20} /> : 
                         idx === 1 ? <AlertCircle size={20} /> : 
                         <Heart size={20} />}
                    </div>
                    
                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full
                                ${idx === 0 ? 'bg-amber-100 text-amber-600' : 
                                  idx === 1 ? 'bg-rose-100 text-rose-600' : 
                                  'bg-blue-100 text-blue-600'}`}
                            >
                                {card.position}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-muted)] px-1.5 py-0.5 bg-[var(--color-bg-accent)] rounded">
                                {card.orientation === 'reversed' ? '逆位' : '正位'}
                            </span>
                        </div>
                        <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">{card.name}</h4>
                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                            {card.meaning}
                        </p>
                    </div>
                </div>
            ))}
         </div>

         {/* Footer */}
         <div className="text-center pt-2">
             <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest flex items-center justify-center gap-1">
               <Sparkles size={10} /> Mystic Tata
             </p>
         </div>

      </div>
    </div>
  );
};

export default DivinationPanel;
