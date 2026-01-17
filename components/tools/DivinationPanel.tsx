
import React, { useState, useEffect } from 'react';
import { TarotResult } from '../../types';
import { Sparkles, Sun, AlertCircle, Heart, Star, Moon, Quote, Palette, Eye, Waves, Lock } from 'lucide-react';

interface DivinationPanelProps {
  result?: TarotResult;
}

const DivinationPanel: React.FC<DivinationPanelProps> = ({ result }) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  const data = result || {
    cards: [
      { position: '过去', name: 'The Sun', meaning: '喜悦、成功、庆祝和积极性。', orientation: 'upright' },
      { position: '现在', name: 'Five of Wands', meaning: '避免冲突，尊重差异。', orientation: 'reversed' },
      { position: '未来', name: 'Queen of Cups', meaning: '同情、平静、舒适和直觉。', orientation: 'upright' }
    ],
    analysis: "牌面显示你正从一段快乐时光过渡到学会优雅地处理小冲突的阶段，这将带来情感上的成熟。",
    advice: "今天相信你的直觉。以同理心而非逻辑去对待他人。"
  };

  useEffect(() => {
    if (result) {
      setRevealedCount(0);
      setIsRevealing(true);
      
      const timer = setInterval(() => {
        setRevealedCount(prev => {
          if (prev >= data.cards.length) {
            clearInterval(timer);
            setIsRevealing(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);

      return () => clearInterval(timer);
    } else {
      // 默认数据直接显示
      setRevealedCount(data.cards.length);
    }
  }, [result]);

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
      <style>{`
        @keyframes card-flip-v {
          0% { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        .reveal-animation {
          animation: card-flip-v 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          backface-visibility: hidden;
        }
        .mystic-card-back {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
          position: relative;
          overflow: hidden;
        }
        .mystic-card-back::before {
          content: '';
          position: absolute;
          inset: 4px;
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 14px;
          pointer-events: none;
        }
        .mystic-card-back::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          animation: pulse-glow 3s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .floating {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      
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
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-6">
         
         {/* 1. The Spread (Card List) - Moved to Top */}
         <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide px-1">牌阵解读</h3>
            
            {data.cards.map((card, idx) => {
                const isRevealed = revealedCount > idx;
                
                return (
                    <div 
                      key={idx} 
                      className={`relative min-h-[110px] transition-all duration-500`}
                    >
                        {!isRevealed ? (
                            // Optimized Card Back
                            <div className="w-full h-[110px] mystic-card-back rounded-2xl flex items-center justify-center border border-indigo-900/50 shadow-xl floating">
                                {/* Inner Decorative Pattern */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                                     style={{ 
                                       backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h1v1H1V1z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
                                       backgroundSize: '10px 10px'
                                     }}>
                                </div>
                                
                                <div className="flex flex-col items-center gap-2 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
                                        <Sparkles size={24} className="text-amber-200/80 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] text-indigo-200/60 font-black uppercase tracking-[0.3em] mb-0.5">{card.position}</span>
                                        <div className="h-0.5 w-8 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"></div>
                                    </div>
                                </div>

                                {/* Corner Ornaments */}
                                <div className="absolute top-2 left-2 text-indigo-300/20"><Star size={10} /></div>
                                <div className="absolute top-2 right-2 text-indigo-300/20"><Star size={10} /></div>
                                <div className="absolute bottom-2 left-2 text-indigo-300/20"><Star size={10} /></div>
                                <div className="absolute bottom-2 right-2 text-indigo-300/20"><Star size={10} /></div>
                            </div>
                        ) : (
                            // Card Front
                            <div className="bg-white/60 border border-[var(--color-border-subtle)] p-4 rounded-2xl flex gap-4 reveal-animation shadow-sm h-[110px]">
                                {/* Card Icon */}
                                <div className={`w-14 h-full rounded-xl flex items-center justify-center flex-shrink-0
                                    ${idx === 0 ? 'bg-amber-50 text-amber-500' : 
                                      idx === 1 ? 'bg-rose-50 text-rose-500' : 
                                      'bg-blue-50 text-blue-500'}`}
                                >
                                    {idx === 0 ? <Sun size={24} /> : 
                                     idx === 1 ? <AlertCircle size={24} /> : 
                                     <Heart size={24} />}
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
                        )}
                    </div>
                );
            })}
         </div>

         {/* 2. Advice Card - Moved below cards */}
         <div className={`transition-all duration-700 ${revealedCount >= data.cards.length ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-white/60 border border-[var(--color-border-subtle)] p-4 rounded-2xl shadow-sm">
                <Quote size={16} className="text-purple-400 mb-2" />
                <p className="text-sm text-[var(--color-text-primary)] font-medium leading-relaxed">
                    "{data.advice}"
                </p>
            </div>
         </div>

         {/* 3. Energy Keywords */}
         <div className={`flex gap-2 transition-all duration-700 delay-300 ${revealedCount >= data.cards.length ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { name: '创造力', icon: <Palette size={12} className="text-amber-500" /> },
              { name: '直觉', icon: <Eye size={12} className="text-purple-500" /> },
              { name: '平静', icon: <Waves size={12} className="text-blue-500" /> }
            ].map((tag, i) => (
               <span key={i} className="px-3 py-1.5 bg-white/60 border border-[var(--color-border-subtle)] rounded-full text-xs text-[var(--color-text-secondary)] font-medium flex items-center gap-1.5 shadow-sm">
                   {tag.icon}
                   {tag.name}
               </span>
            ))}
         </div>

         {/* 4. Analysis Section */}
         {data.analysis && (
            <div className={`transition-all duration-1000 delay-500 ${revealedCount >= data.cards.length ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-purple-50/50 border border-purple-100/50 p-4 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Sparkles size={12} /> 深度解析
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed italic">
                        {data.analysis}
                    </p>
                </div>
            </div>
         )}

         {/* Footer */}
         <div className={`text-center pt-2 transition-opacity duration-1000 ${revealedCount >= data.cards.length ? 'opacity-100' : 'opacity-0'}`}>
             <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest flex items-center justify-center gap-1">
               <Sparkles size={10} /> Mystic Tata
             </p>
         </div>

      </div>
    </div>
  );
};

export default DivinationPanel;
