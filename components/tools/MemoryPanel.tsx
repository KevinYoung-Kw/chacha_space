/**
 * MemoryPanel - 记忆面板（时光日历版）
 * 
 * 展示时光日历、每日信件、记忆片段
 * 支持日历视图和记忆列表两种模式
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, Heart, Sparkles, Clock, X, MessageCircle, Smile, RefreshCw,
  Calendar, ChevronLeft, ChevronRight, Mail, BookOpen,
  SmilePlus, Frown, Meh, PartyPopper, AlertCircle, CloudSun, Moon
} from 'lucide-react';
import { memoryApi, dailyApi, CalendarDay } from '../../services/api';
import PreferenceNotebook from '../PreferenceNotebook';

interface Memory {
  id: string;
  content: string;
  type: 'thought' | 'feeling' | 'interaction' | 'observation';
  timestamp: number;
}

// 后端记忆类型映射
const typeToFrontend: Record<string, Memory['type']> = {
  'fact': 'thought',
  'preference': 'feeling',
  'event': 'interaction',
  'relationship': 'observation'
};

// 心情图标组件
const MoodIcon: React.FC<{ mood: string; size?: number; className?: string }> = ({ 
  mood, 
  size = 14, 
  className = '' 
}) => {
  const iconProps = { size, className };
  
  switch (mood) {
    case 'happy':
      return <Smile {...iconProps} className={`text-amber-500 ${className}`} />;
    case 'sad':
      return <Frown {...iconProps} className={`text-blue-400 ${className}`} />;
    case 'neutral':
      return <Meh {...iconProps} className={`text-gray-400 ${className}`} />;
    case 'excited':
      return <PartyPopper {...iconProps} className={`text-pink-500 ${className}`} />;
    case 'anxious':
      return <AlertCircle {...iconProps} className={`text-orange-400 ${className}`} />;
    case 'peaceful':
      return <CloudSun {...iconProps} className={`text-sky-400 ${className}`} />;
    case 'tired':
      return <Moon {...iconProps} className={`text-indigo-400 ${className}`} />;
    default:
      return <Heart {...iconProps} className={`text-gray-300 ${className}`} />;
  }
};

interface MemoryPanelProps {
  onClose: () => void;
}

type TabType = 'calendar' | 'memories' | 'preferences';

const MemoryPanel: React.FC<MemoryPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 日历相关状态
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<{
    letter: any;
    messages: any[];
  } | null>(null);

  // 加载日历数据
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        const result = await dailyApi.getCalendar(currentMonth);
        if (result.success && result.data) {
          setCalendarData(result.data);
        }
      } catch (err) {
        console.error('[MemoryPanel] Failed to load calendar:', err);
      }
    };

    loadCalendarData();
  }, [currentMonth]);

  // 加载记忆数据
  useEffect(() => {
    const loadMemoriesData = async () => {
      try {
        setLoading(true);
        const result = await memoryApi.getList(1, 20);
        
        if (result.success && result.data) {
          const frontendMemories: Memory[] = result.data.memories.map(m => ({
            id: m.id,
            content: m.content,
            type: typeToFrontend[m.type] || 'thought',
            timestamp: new Date(m.createdAt).getTime()
          }));
          setMemories(frontendMemories);
        }
      } catch (error) {
        console.error('[MemoryPanel] Failed to load memories:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'memories') {
      loadMemoriesData();
    }
  }, [activeTab]);

  // 加载日期详情
  const loadDayDetail = async (date: string) => {
    try {
      const result = await dailyApi.getDayDetail(date);
      if (result.success && result.data) {
        setDayDetail(result.data);
        setSelectedDate(date);
      }
    } catch (err) {
      console.error('[MemoryPanel] Failed to load day detail:', err);
    }
  };

  // 生成日历网格
  const generateCalendarGrid = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const grid: (number | null)[] = [];
    
    // 填充上月空白
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }
    
    // 填充当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }

    return grid;
  };

  // 获取某天的数据
  const getDayData = (day: number) => {
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    return calendarData.find(d => d.date === dateStr);
  };

  // 切换月份
  const changeMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate(null);
    setDayDetail(null);
  };

  // 格式化月份显示
  const formatMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return `${year}年${month}月`;
  };

  const getTypeIcon = (type: Memory['type']) => {
    switch (type) {
      case 'thought': return <Brain size={14} className="text-purple-500" />;
      case 'feeling': return <Heart size={14} className="text-pink-500" />;
      case 'interaction': return <MessageCircle size={14} className="text-blue-500" />;
      case 'observation': return <Sparkles size={14} className="text-amber-500" />;
    }
  };

  const getTypeLabel = (type: Memory['type']) => {
    switch (type) {
      case 'thought': return '想法';
      case 'feeling': return '感受';
      case 'interaction': return '互动';
      case 'observation': return '观察';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) return `${Math.floor(hours / 24)}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50">
      {/* Header - 精简版 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Tab 切换 */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 flex-1">
            <button
              onClick={() => { setActiveTab('calendar'); setSelectedDate(null); setDayDetail(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'calendar' 
                  ? 'bg-white shadow-sm text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar size={12} />
              日历
            </button>
            <button
              onClick={() => setActiveTab('memories')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'memories' 
                  ? 'bg-white shadow-sm text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles size={12} />
              碎片
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'preferences' 
                  ? 'bg-white shadow-sm text-amber-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen size={12} />
              手账
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ml-2 flex-shrink-0"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'calendar' && (
          <div className="p-6">
            {selectedDate && dayDetail ? (
              // 日期详情视图
              <div className="animate-fade-in">
                <button
                  onClick={() => { setSelectedDate(null); setDayDetail(null); }}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
                >
                  <ChevronLeft size={16} />
                  返回日历
                </button>

                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {new Date(selectedDate).toLocaleDateString('zh-CN', { 
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
                  })}
                </h3>

                {/* 当日信件 */}
                {dayDetail.letter ? (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail size={18} className="text-purple-500" />
                      <span className="font-semibold text-purple-700">叉叉的信</span>
                      {dayDetail.letter.mood && (
                        <MoodIcon mood={dayDetail.letter.mood} size={18} />
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {dayDetail.letter.content}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-5 mb-4 text-center text-gray-400">
                    <Mail size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">这天没有信件</p>
                  </div>
                )}

                {/* 当日对话记录 */}
                {dayDetail.messages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">对话记录</span>
                      <span className="text-xs text-gray-400">({dayDetail.messages.length}条)</span>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {dayDetail.messages.map((msg: any, idx: number) => (
                        <div 
                          key={msg.id || idx}
                          className={`p-3 rounded-xl text-sm ${
                            msg.role === 'user' 
                              ? 'bg-blue-50 text-blue-800 ml-8' 
                              : 'bg-gray-100 text-gray-700 mr-8'
                          }`}
                        >
                          <span className="font-medium text-xs opacity-70">
                            {msg.role === 'user' ? '你' : '叉叉'}：
                          </span>
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 日历视图
              <div>
                {/* 月份导航 */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  >
                    <ChevronLeft size={18} className="text-gray-500" />
                  </button>
                  <span className="font-bold text-gray-800">{formatMonth()}</span>
                  <button
                    onClick={() => changeMonth(1)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  >
                    <ChevronRight size={18} className="text-gray-500" />
                  </button>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日历网格 */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarGrid().map((day, idx) => {
                    if (day === null) {
                      return <div key={idx} className="aspect-square" />;
                    }

                    const dayData = getDayData(day);
                    const isToday = (() => {
                      const today = new Date();
                      const [year, month] = currentMonth.split('-').map(Number);
                      return today.getFullYear() === year && 
                             today.getMonth() + 1 === month && 
                             today.getDate() === day;
                    })();

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                          loadDayDetail(dateStr);
                        }}
                        className={`
                          aspect-square rounded-xl flex flex-col items-center justify-center
                          transition-all hover:scale-105 relative
                          ${isToday ? 'ring-2 ring-purple-400 ring-offset-2' : ''}
                          ${dayData?.hasLetter ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'hover:bg-gray-50'}
                        `}
                        style={dayData?.emotionColor ? {
                          backgroundColor: `${dayData.emotionColor}20`
                        } : {}}
                      >
                        <span className={`text-sm ${isToday ? 'font-bold text-purple-600' : 'text-gray-700'}`}>
                          {day}
                        </span>
                        {dayData?.mood && (
                          <MoodIcon mood={dayData.mood} size={12} className="mt-0.5" />
                        )}
                        {dayData?.hasLetter && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 图例 */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    有信件
                  </span>
                  <span className="flex items-center gap-1">
                    <Smile size={14} className="text-amber-400" />
                    心情
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-700">记忆片段</h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <RefreshCw size={32} className="mx-auto mb-3 opacity-30 animate-spin" />
                <p className="text-sm">加载记忆中...</p>
              </div>
            ) : memories.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Brain size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-2">还没有记忆片段</p>
                <p className="text-xs">和我互动时，我会自动记录重要的事情</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((memory, index) => (
                  <div
                    key={memory.id}
                    className="glass-panel rounded-xl p-4 hover:shadow-md transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(memory.type)}
                        <span className="text-xs font-medium text-gray-600">
                          {getTypeLabel(memory.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{formatTime(memory.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {memory.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <PreferenceNotebook />
        )}
      </div>

      {/* Footer */}
      {activeTab === 'memories' && memories.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-t from-gray-50 to-transparent">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Smile size={14} />
            <span>共 {memories.length} 条记忆</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryPanel;
