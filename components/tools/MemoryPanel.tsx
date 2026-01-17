/**
 * MemoryPanel - 记忆面板
 * 
 * 展示叉叉的所思所想、记忆片段和心情状态
 */

import React, { useState, useEffect } from 'react';
import { Brain, Heart, Sparkles, Clock, X, MessageCircle, Smile, RefreshCw } from 'lucide-react';
import { memoryApi } from '../../services/api';

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

interface MemoryPanelProps {
  onClose: () => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ onClose }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentThought, setCurrentThought] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 根据最新记忆或时间生成当前思考
  const generateCurrentThought = (memoryList: Memory[]) => {
    const hour = new Date().getHours();
    
    // 如果有最近的记忆（5分钟内），基于最近记忆生成想法
    if (memoryList.length > 0) {
      const latestMemory = memoryList[0];
      const timeDiff = Date.now() - latestMemory.timestamp;
      
      if (timeDiff < 300000) { // 5分钟内
        if (latestMemory.type === 'interaction') {
          return '刚才和你的对话让我很开心';
        } else if (latestMemory.type === 'feeling') {
          return '回想起刚才的互动，心里暖暖的';
        } else if (latestMemory.type === 'observation') {
          return '我在回想刚才注意到的事情';
        }
      }
    }
    
    // 根据时间生成想法
    if (hour >= 6 && hour < 9) {
      return '早上好，新的一天开始了';
    } else if (hour >= 9 && hour < 12) {
      return '上午的时光总是特别有活力';
    } else if (hour >= 12 && hour < 14) {
      return '午后时光，要不要休息一下';
    } else if (hour >= 14 && hour < 18) {
      return '下午好，有什么我能帮到你的吗';
    } else if (hour >= 18 && hour < 22) {
      return '晚上好，今天过得怎么样';
    } else {
      return '夜深了，记得早点休息哦';
    }
  };

  // 加载记忆数据
  useEffect(() => {
    // 从后端API加载记忆数据
    const loadMemoriesData = async () => {
      try {
        setLoading(true);
        const result = await memoryApi.getList(1, 20);
        
        if (result.success && result.data) {
          console.log('[MemoryPanel] 📚 Loaded memories from backend:', result.data.total);
          
          // 将后端记忆转换为前端格式
          const frontendMemories: Memory[] = result.data.memories.map(m => ({
            id: m.id,
            content: m.content,
            type: typeToFrontend[m.type] || 'thought',
            timestamp: new Date(m.createdAt).getTime()
          }));
          
          setMemories(frontendMemories);
          setCurrentThought(generateCurrentThought(frontendMemories));
        } else {
          console.log('[MemoryPanel] ❌ No memories found or API error');
          setMemories([]);
          setCurrentThought(generateCurrentThought([]));
        }
      } catch (error) {
        console.error('[MemoryPanel] Failed to load memories:', error);
        setMemories([]);
        setCurrentThought(generateCurrentThought([]));
      } finally {
        setLoading(false);
      }
    };

    // 立即加载一次
    loadMemoriesData();

    // 定期刷新记忆和思考（每30秒检查一次新记忆）
    const interval = setInterval(() => {
      loadMemoriesData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getTypeIcon = (type: Memory['type']) => {
    switch (type) {
      case 'thought':
        return <Brain size={14} className="text-purple-500" />;
      case 'feeling':
        return <Heart size={14} className="text-pink-500" />;
      case 'interaction':
        return <MessageCircle size={14} className="text-blue-500" />;
      case 'observation':
        return <Sparkles size={14} className="text-amber-500" />;
    }
  };

  const getTypeLabel = (type: Memory['type']) => {
    switch (type) {
      case 'thought':
        return '想法';
      case 'feeling':
        return '感受';
      case 'interaction':
        return '互动';
      case 'observation':
        return '观察';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">叉叉的内心世界</h2>
            <p className="text-xs text-gray-500 mt-1">记录我们的点点滴滴</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* 当前想法卡片 */}
        <div className="glass-panel rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={18} className="text-purple-500" />
              <span className="text-sm font-semibold text-gray-700">现在的想法</span>
            </div>
            <p className="text-base text-gray-800 leading-relaxed animate-fade-in">
              {currentThought}
            </p>
          </div>
        </div>
      </div>

      {/* 记忆列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
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
            <p className="text-xs text-gray-400">
              和我互动时，我会自动记录重要的事情
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((memory, index) => (
              <div
                key={memory.id}
                className="glass-panel rounded-xl p-4 hover:shadow-md transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* 记忆头部 */}
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

                {/* 记忆内容 */}
                <p className="text-sm text-gray-700 leading-relaxed">
                  {memory.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer 提示 */}
      {memories.length > 0 && (
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
