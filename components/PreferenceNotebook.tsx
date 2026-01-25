/**
 * PreferenceNotebook - 偏好手账组件
 * 
 * 展示从记忆中提取的用户画像
 * 允许用户查看、编辑、删除偏好信息
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Utensils, Ban, CalendarHeart, Heart, MoreHorizontal,
  Edit2, Trash2, Check, RefreshCw
} from 'lucide-react';
import { memoryApi } from '../services/api';

// 偏好分类
type PreferenceCategory = 'nickname' | 'food' | 'taboo' | 'anniversary' | 'hobby' | 'other';

interface Preference {
  id: string;
  category: PreferenceCategory;
  content: string;
  memoryId?: string;
  isEditing?: boolean;
}

// 分类配置
const categoryConfig: Record<PreferenceCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  nickname: {
    label: '称呼',
    icon: <User size={16} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  food: {
    label: '饮食',
    icon: <Utensils size={16} />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  taboo: {
    label: '忌讳',
    icon: <Ban size={16} />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  anniversary: {
    label: '纪念日',
    icon: <CalendarHeart size={16} />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  hobby: {
    label: '喜好',
    icon: <Heart size={16} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  other: {
    label: '其他',
    icon: <MoreHorizontal size={16} />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

// 从记忆内容推断分类
function inferCategory(content: string): PreferenceCategory {
  const lowerContent = content.toLowerCase();
  
  if (/叫我|称呼|名字|昵称/.test(lowerContent)) return 'nickname';
  if (/喜欢吃|爱吃|不吃|过敏|饮食|食物/.test(lowerContent)) return 'food';
  if (/不喜欢|讨厌|害怕|忌讳|禁忌/.test(lowerContent)) return 'taboo';
  if (/生日|纪念日|周年|节日/.test(lowerContent)) return 'anniversary';
  if (/喜欢|爱好|兴趣|热爱/.test(lowerContent)) return 'hobby';
  
  return 'other';
}

const PreferenceNotebook: React.FC = () => {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<PreferenceCategory | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // 从记忆中加载偏好
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const result = await memoryApi.getList(1, 50);
        
        if (result.success && result.data) {
          // 从记忆中提取偏好类的内容
          const prefs: Preference[] = result.data.memories
            .filter(m => m.type === 'preference' || m.type === 'fact')
            .map(m => ({
              id: m.id,
              category: inferCategory(m.content),
              content: m.content,
              memoryId: m.id,
            }));
          
          setPreferences(prefs);
        }
      } catch (err) {
        console.error('[PreferenceNotebook] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // 开始编辑
  const startEditing = (pref: Preference) => {
    setEditingId(pref.id);
    setEditContent(pref.content);
  };

  // 保存编辑
  const saveEdit = async (id: string) => {
    // TODO: 调用后端 API 更新记忆
    setPreferences(prev => 
      prev.map(p => p.id === id ? { ...p, content: editContent } : p)
    );
    setEditingId(null);
    setEditContent('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // 删除偏好
  const deletePref = async (id: string) => {
    try {
      await memoryApi.delete(id);
      setPreferences(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('[PreferenceNotebook] Failed to delete:', err);
    }
  };

  // 过滤偏好
  const filteredPreferences = activeCategory === 'all' 
    ? preferences 
    : preferences.filter(p => p.category === activeCategory);

  // 按分类分组统计
  const categoryCounts = preferences.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col">
      {/* 分类筛选 - 简化版，直接在 MemoryPanel 的 tab 下显示 */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部 ({preferences.length})
          </button>
          {(Object.keys(categoryConfig) as PreferenceCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                activeCategory === cat
                  ? `${categoryConfig[cat].bgColor} ${categoryConfig[cat].color}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoryConfig[cat].icon}
              {categoryConfig[cat].label}
              {categoryCounts[cat] ? ` (${categoryCounts[cat]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw size={32} className="mx-auto mb-3 opacity-30 animate-spin" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : filteredPreferences.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Heart size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-2">还没有记录</p>
            <p className="text-xs">和叉叉聊天时，她会自动记住你的喜好</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPreferences.map((pref, index) => {
              const config = categoryConfig[pref.category];
              const isEditing = editingId === pref.id;

              return (
                <div
                  key={pref.id}
                  className={`
                    rounded-xl p-4 border transition-all duration-300 animate-fade-in
                    ${isEditing ? 'ring-2 ring-amber-400' : 'hover:shadow-md'}
                    ${config.bgColor} border-${config.color.replace('text-', '')}/20
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 头部 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 ${config.color}`}>
                      {config.icon}
                      <span className="text-xs font-medium">{config.label}</span>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(pref)}
                          className="p-1.5 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deletePref(pref.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => saveEdit(pref.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1"
                        >
                          <Check size={12} />
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {pref.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default PreferenceNotebook;
