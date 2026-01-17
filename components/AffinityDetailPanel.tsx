/**
 * AffinityDetailPanel - 好感度详情面板
 * 
 * 显示好感度的详细信息和历史记录
 */

import React, { useMemo } from 'react';
import { Heart, TrendingUp, TrendingDown, X, Calendar, Activity } from 'lucide-react';
import { AffinityData, AffinityLevel } from '../types';
import { getAffinityStats, getLevelName, AFFINITY_LEVELS } from '../services/affinityService';
import { getAffinityCalculationDetails } from '../services/affinityValidator';
import AffinityIndicator from './AffinityIndicator';

interface AffinityDetailPanelProps {
  affinity: AffinityData;
  onClose: () => void;
}

const AffinityDetailPanel: React.FC<AffinityDetailPanelProps> = ({ affinity, onClose }) => {
  const stats = getAffinityStats(affinity);
  const calcDetails = getAffinityCalculationDetails(affinity);

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
    <div className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">好感度详情</h2>
            <p className="text-xs text-gray-500 mt-1">查看你的互动记录</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* 当前好感度卡片 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <AffinityIndicator affinity={affinity} showDetails={true} />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalGained}</div>
            <div className="text-xs text-gray-500 mt-1">总获得积分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalLost}</div>
            <div className="text-xs text-gray-500 mt-1">总减少积分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{affinity.value}</div>
            <div className="text-xs text-gray-500 mt-1">当前积分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{affinity.totalInteractions}</div>
            <div className="text-xs text-gray-500 mt-1">总互动次数</div>
          </div>
        </div>
        
        {/* 积分验证信息 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-semibold mb-2 text-blue-800">积分计算验证：</div>
            <div>当前积分：<span className="font-bold text-blue-700">{affinity.value}</span> / 1000</div>
            <div>当前等级：<span className="font-bold text-blue-700">{stats.level.toUpperCase()} · {getLevelName(stats.level)}</span></div>
            <div>等级范围：{calcDetails.levelRange.min} - {calcDetails.levelRange.max} 积分</div>
            <div>当前进度：{stats.progress}% （还需 {stats.nextLevelThreshold ? stats.nextLevelThreshold - affinity.value : 0} 积分升级）</div>
            <div className="pt-2 border-t border-blue-200 mt-2">
              <div className="text-[10px] text-gray-500">计算详情：</div>
              <div>历史记录总和：{calcDetails.historySum > 0 ? '+' : ''}{calcDetails.historySum}</div>
              <div>预期积分：{calcDetails.expectedValue}（初始50 + 历史变化）</div>
              {calcDetails.difference > 1 && (
                <div className="text-red-600 font-semibold">⚠️ 差异：{calcDetails.difference} 积分</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录 - 可滚动查看 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity size={16} />
          互动历史
        </h3>

        {Object.keys(groupedHistory).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Heart size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">还没有互动记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, events]) => (
              <div key={date} className="space-y-2">
                {/* 日期标题 */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">{date}</span>
                </div>

                {/* 事件列表 */}
                <div className="space-y-2">
                  {events.map((event, index) => {
                    const isPositive = event.change > 0;
                    return (
                      <div
                        key={`${event.timestamp}-${index}`}
                        className={`
                          flex items-center justify-between p-3 rounded-xl
                          ${isPositive 
                            ? 'bg-green-50 border border-green-100' 
                            : 'bg-red-50 border border-red-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* 图标 */}
                          <div className={`
                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                            ${isPositive ? 'bg-green-100' : 'bg-red-100'}
                          `}>
                            {isPositive ? (
                              <TrendingUp size={14} className="text-green-600" />
                            ) : (
                              <TrendingDown size={14} className="text-red-600" />
                            )}
                          </div>

                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {getActionTypeText(event.action)}
                              </span>
                              <span className={`
                                text-xs font-bold px-1.5 py-0.5 rounded
                                ${isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}
                              `}>
                                {isPositive ? '+' : ''}{event.change} 积分
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {event.reason}
                            </p>
                          </div>
                        </div>

                        {/* 时间 */}
                        <div className="flex-shrink-0 text-xs text-gray-400 ml-2">
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
