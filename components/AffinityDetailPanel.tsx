/**
 * AffinityDetailPanel - 好感度详情面板
 * 
 * 显示好感度的详细信息和历史记录
 */

import React, { useMemo } from 'react';
import { Heart, TrendingUp, TrendingDown, X, Calendar, Activity } from 'lucide-react';
import { AffinityData } from '../types';
import AffinityIndicator from './AffinityIndicator';

interface AffinityDetailPanelProps {
  affinity: AffinityData;
  onClose: () => void;
}

const AffinityDetailPanel: React.FC<AffinityDetailPanelProps> = ({ affinity, onClose }) => {
  // 按日期分组历史记录
  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof affinity.history> = {};
    
    affinity.history
      .slice()
      .reverse() // 最新的在前
      .forEach(event => {
        const date = new Date(event.timestamp).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(event);
      });
    
    return groups;
  }, [affinity.history]);

  // 统计信息
  const totalGained = useMemo(() => {
    return affinity.history
      .filter(e => e.change > 0)
      .reduce((sum, e) => sum + e.change, 0);
  }, [affinity.history]);

  const totalLost = useMemo(() => {
    return Math.abs(affinity.history
      .filter(e => e.change < 0)
      .reduce((sum, e) => sum + e.change, 0));
  }, [affinity.history]);

  // 等级文本已通过getLevelName获取

  const getActionTypeText = (action: string): string => {
    const actionMap: Record<string, string> = {
      'todo_complete': '完成待办',
      'todo_add': '添加待办',
      'health_water': '记录喝水',
      'health_goal': '完成健康目标',
      'weather_check': '查询天气',
      'fortune_draw': '占卜',
      'daily_chat': '每日对话',
      'positive_reply': '积极反馈',
      'negative_reply': '负面反馈',
      'no_interaction': '长时间未互动',
    };
    return actionMap[action] || action;
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">好感度详情</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">查看你的互动记录</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* 当前好感度卡片 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-[var(--color-border-subtle)] shadow-sm">
          <AffinityIndicator affinity={affinity} showDetails={true} />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="px-6 py-4 border-b border-[var(--color-border-subtle)]">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-500">{totalGained}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">总获得</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{totalLost}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">总减少</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{affinity.value}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">当前积分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text-secondary)]">{affinity.totalInteractions}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">互动次数</div>
          </div>
        </div>
      </div>

      {/* 历史记录 - 可滚动查看 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-4 flex items-center gap-2">
          <Activity size={14} className="text-rose-400" />
          互动历史
        </h3>

        {Object.keys(groupedHistory).length === 0 ? (
          <div className="text-center py-12">
            <Heart size={32} className="mx-auto mb-2 text-[var(--color-text-muted)] opacity-20" />
            <p className="text-sm text-[var(--color-text-muted)]">还没有互动记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedHistory).map(([date, events]) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Calendar size={12} className="text-[var(--color-text-muted)]" />
                  <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{date}</span>
                </div>
                
                <div className="space-y-2">
                  {events.map((event, index) => {
                    const isPositive = event.change > 0;
                    return (
                      <div
                        key={`${event.timestamp}-${index}`}
                        className={`
                          flex items-center justify-between p-3 rounded-xl border transition-all
                          ${isPositive 
                            ? 'bg-white/40 border-rose-100/50' 
                            : 'bg-black/5 border-transparent opacity-80'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* 图标 */}
                          <div className={`
                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                            ${isPositive ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-500'}
                          `}>
                            {isPositive ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                          </div>

                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {getActionTypeText(event.action)}
                              </span>
                              <span className={`
                                text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                ${isPositive ? 'text-rose-600 bg-rose-50' : 'text-gray-600 bg-gray-100'}
                              `}>
                                {isPositive ? '+' : ''}{event.change}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                              {event.reason}
                            </p>
                          </div>
                        </div>

                        {/* 时间 */}
                        <div className="flex-shrink-0 text-[10px] text-[var(--color-text-muted)] font-medium ml-2">
                          {new Date(event.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AffinityDetailPanel;
