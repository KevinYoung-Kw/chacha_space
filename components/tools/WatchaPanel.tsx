
import React from 'react';
import { ExternalLink } from 'lucide-react';

const WatchaPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
      
      {/* Header Section */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <img src="/watcha.svg" alt="Watcha" className="w-8 h-8" />
            Watcha
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">探索更多精彩内容</p>
        </div>
        <a 
          href="https://watcha.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 bg-white/60 hover:bg-white/80 border border-[var(--color-border-subtle)] rounded-lg text-xs font-medium text-[var(--color-text-secondary)] transition-colors"
        >
          <ExternalLink size={14} />
          <span>新窗口打开</span>
        </a>
      </div>

      {/* iframe Content */}
      <div className="flex-1 overflow-hidden px-6 pb-6 pt-4">
        <div className="h-full bg-white border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden shadow-sm">
          <iframe 
            src="https://watcha.cn/" 
            className="w-full h-full"
            title="Watcha"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default WatchaPanel;
