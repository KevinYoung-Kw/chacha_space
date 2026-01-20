import React, { useState, useEffect } from 'react';
import { TodoItem, TodoCategory } from '../../types';
import { 
  CheckCircle2, Circle, Plus, Clock, X,
  ChevronDown, ChevronRight, AlertTriangle, Trash2,
  List, Briefcase, Heart, Code, PenTool, BookOpen, 
  Music, Gamepad2, Home, ShoppingCart
} from 'lucide-react';

interface TodoPanelProps {
  categories: TodoCategory[];
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onAddTodo?: (todo: { text: string; categoryId?: string; priority?: string; deadline?: string }) => void;
  onDelete?: (id: string) => void;
}

// Lucide 图标映射
const ICON_MAP: Record<string, any> = {
  List, Briefcase, Heart, Code, PenTool, BookOpen, 
  Music, Gamepad2, Home, ShoppingCart
};

const COLOR_MAP: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-green-500': '#22c55e',
  'bg-purple-500': '#a855f7',
  'bg-orange-500': '#f97316',
  'bg-red-500': '#ef4444',
  'bg-pink-500': '#ec4899',
  'bg-gray-500': '#6b7280',
};

const SOFT_BG_MAP: Record<string, string> = {
  'bg-blue-500': '#eff6ff',
  'bg-green-500': '#f0fdf4',
  'bg-purple-500': '#faf5ff',
  'bg-orange-500': '#fff7ed',
  'bg-red-500': '#fef2f2',
  'bg-pink-500': '#fdf2f8',
  'bg-gray-500': '#f9fafb',
};

const PRIORITIES = [
  { id: 'high', label: '高', color: 'bg-red-500' },
  { id: 'medium', label: '中', color: 'bg-yellow-500' },
  { id: 'low', label: '低', color: 'bg-gray-400' },
];

const TodoPanel: React.FC<TodoPanelProps> = ({ categories, todos, onToggle, onAddTodo, onDelete }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [newTodo, setNewTodo] = useState({
    text: '',
    categoryId: categories[0]?.id || '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    deadline: ''
  });

  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 当分类列表更新时，更新默认选中的分类
  useEffect(() => {
    if (selectedCategory !== 'all') {
      setNewTodo(prev => ({ ...prev, categoryId: selectedCategory }));
    } else if (categories.length > 0) {
      setNewTodo(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, selectedCategory]);

  // 计算每个分类的待办数量
  const categoriesWithCount = [
    { id: 'all', name: '全部', icon: 'List', color: 'bg-gray-500', count: todos.filter(t => !t.completed).length },
    ...categories.map(cat => ({
      ...cat,
      count: todos.filter(t => !t.completed && t.categoryId === cat.id).length
    }))
  ];

  // 调试：打印分类数据
  React.useEffect(() => {
    console.log('[TodoPanel] Categories:', categories.length, categories);
    console.log('[TodoPanel] CategoriesWithCount:', categoriesWithCount.length);
  }, [categories, categoriesWithCount.length]);

  // 根据选中的分类过滤待办
  const filteredTodos = selectedCategory === 'all' 
    ? todos 
    : todos.filter(t => t.categoryId === selectedCategory);

  // 分类待办
  const activeTodos = filteredTodos.filter(t => !t.completed);
  const completedTodos = filteredTodos.filter(t => t.completed);

  const currentCategory = categoriesWithCount.find(c => c.id === selectedCategory);
  const themeColor = currentCategory?.color || 'bg-gray-500';
  const themeHex = selectedCategory === 'all' ? 'var(--color-accent-rose)' : (COLOR_MAP[themeColor] || '#6b7280');
  const themeSoftBg = selectedCategory === 'all' ? '#f0f9ff' : (SOFT_BG_MAP[themeColor] || '#f9fafb');

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < -1) return { text: `逾期 ${Math.abs(days)} 天`, isOverdue: true };
    if (days === -1) return { text: '昨天', isOverdue: true };
    if (days === 0) return { text: '今天', isOverdue: diff < 0 };
    if (days === 1) return { text: '明天', isOverdue: false };
    if (days < 7) return { text: `${days} 天后`, isOverdue: false };
    return { 
      text: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }), 
      isOverdue: false 
    };
  };

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || List;
  };

  const handleSubmit = () => {
    if (!newTodo.text.trim()) return;
    
    onAddTodo?.({
      text: newTodo.text.trim(),
      categoryId: newTodo.categoryId || undefined,
      priority: newTodo.priority,
      deadline: newTodo.deadline || undefined
    });

    setNewTodo({ 
      text: '', 
      categoryId: categories[0]?.id || '', 
      priority: 'medium', 
      deadline: '' 
    });
    setShowCreateForm(false);
  };

  const TodoItemComponent = ({ todo, isCompleted = false }: { todo: TodoItem; isCompleted?: boolean }) => {
    const deadline = formatDeadline(todo.deadline);
    const Icon = todo.categoryIcon ? getIcon(todo.categoryIcon) : List;
    
    return (
      <div 
        className={`group flex items-start gap-3 py-3 px-4 transition-all duration-200 ${
          isCompleted ? 'opacity-50' : ''
        }`}
        style={{
          background: isCompleted ? 'transparent' : 'var(--glass-bg-strong)',
          borderRadius: 'var(--radius-lg)',
          border: isCompleted ? 'none' : '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          className="flex-shrink-0 mt-0.5 transition-all duration-200"
          style={{
            color: isCompleted 
              ? 'var(--color-text-secondary)' 
              : deadline?.isOverdue 
                ? 'var(--color-accent-rose)' 
                : 'var(--color-text-muted)'
          }}
        >
          {isCompleted ? (
            <CheckCircle2 size={24} />
          ) : (
            <Circle size={24} strokeWidth={2} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => onToggle(todo.id)}>
          <p className={`text-[15px] leading-snug transition-all ${isCompleted ? 'line-through' : ''}`}
             style={{ color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
            {todo.text}
          </p>
          
          {/* Meta info */}
          {!isCompleted && (deadline || todo.categoryName) && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Category tag */}
              {todo.categoryName && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: 'var(--color-bg-accent)',
                        color: 'var(--color-text-secondary)',
                        borderRadius: 'var(--radius-full)',
                      }}>
                  <Icon size={10} />
                  {todo.categoryName}
                </span>
              )}
              
              {/* Deadline */}
              {deadline && (
                <span className="flex items-center gap-1 text-xs"
                      style={{ 
                        color: deadline.isOverdue ? 'var(--color-accent-rose)' : 'var(--color-text-muted)',
                        fontWeight: deadline.isOverdue ? 500 : 400,
                      }}>
                  {deadline.isOverdue && <AlertTriangle size={11} />}
                  <Clock size={11} />
                  {deadline.text}
                </span>
              )}
              
              {/* Priority */}
              {todo.priority === 'high' && (
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-accent-rose)' }}>
                  高优先级
                </span>
              )}
            </div>
          )}
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo.id);
            }}
            className="flex-shrink-0 p-2 -mr-1 transition-all sm:opacity-0 sm:group-hover:opacity-100"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    );
  };

  // 移动端创建表单（内联展开）- 不阻塞切换面板
  const MobileCreateForm = () => (
    <div className="px-4 pb-3 animate-fade-in-up">
      <div className="mobile-panel" style={{ padding: '16px' }}>
        {/* 输入区域 */}
        <input
          type="text"
          placeholder="我要做什么..."
          value={newTodo.text}
          onChange={(e) => setNewTodo({ ...newTodo, text: e.target.value })}
          className="flat-input text-base mb-3"
          autoFocus
        />

        {/* 快捷操作 - 一行显示 */}
        <div className="flex items-center gap-2 mb-3">
          {/* 分类选择 - 简化版 */}
          {categories.length > 0 ? (
            <select
              value={newTodo.categoryId}
              onChange={(e) => setNewTodo({ ...newTodo, categoryId: e.target.value })}
              className="flat-input text-sm flex-1 py-2"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex-1 text-xs py-2 px-3" 
                 style={{ color: 'var(--color-text-muted)' }}>
              暂无分类
            </div>
          )}

          {/* 优先级选择 - 简化版 */}
          <select
            value={newTodo.priority}
            onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
            className="flat-input text-sm py-2"
            style={{ width: '90px' }}
          >
            {PRIORITIES.map(p => (
              <option key={p.id} value={p.id}>{p.label}优先级</option>
            ))}
          </select>
        </div>

        {/* 截止日期 - 可选 */}
        {newTodo.deadline || newTodo.text.trim() ? (
          <input
            ref={dateInputRef}
            type="datetime-local"
            value={newTodo.deadline}
            onChange={(e) => setNewTodo({ ...newTodo, deadline: e.target.value })}
            className="flat-input text-sm mb-3"
            placeholder="设置截止时间（可选）"
          />
        ) : null}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCreateForm(false);
              setNewTodo({ 
                text: '', 
                categoryId: categories[0]?.id || '', 
                priority: 'medium', 
                deadline: '' 
              });
            }}
            className="flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
            style={{
              background: 'var(--color-bg-base)',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newTodo.text.trim()}
            className="flex-1 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{
              borderRadius: 'var(--radius-lg)',
              background: newTodo.text.trim() ? 'var(--color-text-primary)' : 'var(--color-bg-accent)',
              color: newTodo.text.trim() ? 'white' : 'var(--color-text-muted)',
              cursor: newTodo.text.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={16} className="inline mr-1" />
            添加
          </button>
        </div>
      </div>
    </div>
  );

  // 移动端布局 - 扁平化设计
  if (isMobile) {
    return (
      <div className="h-full flex flex-col" style={{ background: 'var(--color-bg-warm)' }}>
        {/* 顶部分类滚动条 */}
        <div className="flex-shrink-0 glass-panel" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="mobile-toolbar py-3">
            {categoriesWithCount.map(cat => {
              const Icon = getIcon(cat.icon);
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flat-tag ${isSelected ? 'active' : ''}`}
                >
                  <Icon size={14} />
                  <span>{cat.name}</span>
                  {cat.count > 0 && (
                    <span className="text-[11px] px-1.5 rounded-full"
                          style={{ background: isSelected ? 'rgba(255,255,255,0.3)' : 'var(--color-bg-accent)' }}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 创建表单区域 - 内联展开，不阻塞切换 */}
        {showCreateForm && <MobileCreateForm />}

        {/* 待办列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
          {/* Active Todos */}
          {activeTodos.length > 0 && (
            <div className="space-y-2">
              {activeTodos.map(todo => (
                <div key={todo.id}>
                  <TodoItemComponent todo={todo} />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {activeTodos.length === 0 && !showCreateForm && (
            <div className="flex flex-col items-center justify-center py-16">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-bg-accent)' }}
              >
                <CheckCircle2 size={32} style={{ color: 'var(--color-text-secondary)' }} />
              </div>
              <p style={{ color: 'var(--color-text-secondary)' }}>暂无待办事项</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>点击下方按钮添加</p>
            </div>
          )}

          {/* Completed Section */}
          {completedTodos.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm font-medium mb-3 transition-all active:opacity-70"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showCompleted ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                已完成 ({completedTodos.length})
              </button>
              
              {showCompleted && (
                <div className="space-y-2 animate-fade-in-up">
                  {completedTodos.map(todo => (
                    <div key={todo.id}>
                      <TodoItemComponent todo={todo} isCompleted />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部添加按钮 - 简化版 */}
        <div className="flex-shrink-0 px-4 py-2 glass-panel safe-area-pb" 
             style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 font-medium transition-all active:scale-[0.98]"
              style={{
                background: 'var(--color-text-primary)',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              新建待办
            </button>
          ) : (
            <button
              onClick={() => setShowCreateForm(false)}
              className="w-full py-2.5 text-sm font-medium transition-all active:opacity-70"
              style={{
                color: 'var(--color-text-muted)',
              }}
            >
              收起
            </button>
          )}
        </div>
      </div>
    );
  }

  // 桌面端布局（保持原有设计）
  return (
    <div className="h-full flex" style={{ background: 'var(--color-bg-warm)' }}>
      <style>{`
        .deadline-input::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>
      {/* Left Sidebar - Category List */}
      <div className="w-44 min-w-[11rem] flex-shrink-0 glass-panel border-r overflow-y-auto no-scrollbar" 
           style={{ borderColor: 'var(--color-border-light)' }}>
        <div className="p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'var(--color-text-muted)' }}>
            列表
          </h2>
          <div className="space-y-1">
            {categoriesWithCount.map(cat => {
              const Icon = getIcon(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? 'toolbar-btn active'
                      : 'toolbar-btn'
                  }`}
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  <div className={`w-6 h-6 rounded-full ${cat.color} flex items-center justify-center shadow-sm transition-transform duration-200 ${
                    selectedCategory === cat.id ? 'scale-110' : ''
                  }`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className="flex-1 text-[14px] font-medium">{cat.name}</span>
                  {cat.count > 0 && (
                    <span className={`text-[12px] font-semibold px-1.5 py-0.5 rounded-full ${
                      selectedCategory === cat.id ? 'bg-white/30' : 'bg-transparent'
                    }`}
                         style={{ color: selectedCategory === cat.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight" 
                  style={{ color: 'var(--color-text-primary)' }}>
                {categoriesWithCount.find(c => c.id === selectedCategory)?.name || '全部'}
              </h1>
              <p className="text-[13px] mt-0.5" 
                 style={{ color: 'var(--color-text-secondary)' }}>
                {activeTodos.length} 个待办{completedTodos.length > 0 && ` · ${completedTodos.length} 个已完成`}
              </p>
            </div>
          </div>
        </div>

        {/* Add Button & Form */}
        <div className="px-5 pb-3">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 text-[15px] font-medium transition-all hover:scale-[1.02]"
              style={{ color: themeHex }}
            >
              <Plus size={18} strokeWidth={2.5} />
              新建待办
            </button>
          ) : (
            <div className="glass-panel-strong animate-fade-in-up p-4" 
                 style={{ 
                   borderRadius: 'var(--radius-lg)',
                   boxShadow: 'var(--shadow-soft)'
                 }}>
              <input
                type="text"
                placeholder="待办内容"
                value={newTodo.text}
                onChange={(e) => setNewTodo({ ...newTodo, text: e.target.value })}
                className="w-full text-[15px] bg-transparent border-none focus:outline-none placeholder:opacity-50"
                style={{ 
                  color: 'var(--color-text-primary)',
                  caretColor: themeHex
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              
              {/* Options Rows */}
              <div className="mt-4 space-y-3 pt-3" 
                   style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                {/* Row 1: Priority Selection */}
                <div className="flex items-center gap-3">
                  {/* Priority Selection */}
                  <div className="flex items-center gap-2 px-2 py-1.5 transition-all"
                       style={{ 
                         background: 'var(--color-bg-hover)',
                         borderRadius: 'var(--radius-md)',
                       }}>
                    <AlertTriangle size={14} style={{ color: 'var(--color-text-secondary)' }} />
                    <select
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
                      className="text-xs bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                      style={{ 
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}优先级</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Styled Deadline Selection */}
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="flex-1 flex items-center gap-2 pl-3 pr-1.5 py-2 transition-all hover:bg-white/60 hover:shadow-sm cursor-pointer group h-[52px]"
                    style={{ 
                      background: 'var(--color-bg-hover)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-subtle)'
                    }}>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-50"
                            style={{ color: 'var(--color-text-secondary)' }}>
                        设定截止时间
                      </span>
                      <input
                        ref={dateInputRef}
                        type="datetime-local"
                        value={newTodo.deadline}
                        onChange={(e) => setNewTodo({ ...newTodo, deadline: e.target.value })}
                        className="text-[13px] bg-transparent border-none focus:outline-none w-full font-medium deadline-input"
                        style={{ 
                          color: 'var(--color-text-primary)',
                          colorScheme: 'light',
                          height: '22px'
                        }}
                      />
                    </div>
                    <div className="flex-shrink-0 w-5 flex items-center justify-center">
                      {newTodo.deadline && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewTodo({ ...newTodo, deadline: '' });
                          }}
                          className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTodo({ 
                      text: '', 
                      categoryId: categories[0]?.id || '', 
                      priority: 'medium', 
                      deadline: '' 
                    });
                  }}
                  className="px-3 py-1.5 text-[13px] transition-all hover:scale-105"
                  style={{ 
                    color: 'var(--color-text-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!newTodo.text.trim()}
                  className="px-4 py-1.5 text-[13px] text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100"
                  style={{ 
                    background: themeHex,
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-soft)'
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Todo List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 no-scrollbar">
          {/* Active Todos */}
          {activeTodos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {activeTodos.map(todo => (
                  <React.Fragment key={todo.id}>
                    <TodoItemComponent todo={todo} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeTodos.length === 0 && !showCreateForm && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: themeSoftBg }}
              >
                <CheckCircle2 size={24} style={{ color: themeHex }} />
              </div>
              <p className="text-gray-500 text-[15px]">暂无待办事项</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-3 text-[13px] font-medium hover:opacity-80 transition-all"
                style={{ color: themeHex }}
              >
                创建第一个待办
              </button>
            </div>
          )}

          {/* Completed Section */}
          {completedTodos.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-1 text-gray-500 text-[13px] font-medium mb-2 hover:text-gray-700 transition-colors"
              >
                {showCompleted ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                已完成 ({completedTodos.length})
              </button>
              
              {showCompleted && (
                <div className="bg-white/60 rounded-xl overflow-hidden animate-fade-in-up">
                  <div className="divide-y divide-gray-100/50">
                    {completedTodos.map(todo => (
                      <React.Fragment key={todo.id}>
                        <TodoItemComponent todo={todo} isCompleted />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white/80 backdrop-blur-sm border-t border-gray-100">
          <div className="flex items-center justify-between text-[12px] text-gray-400">
            <span>
              {new Date().toLocaleDateString('zh-CN', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            {activeTodos.filter(t => formatDeadline(t.deadline)?.isOverdue).length > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertTriangle size={12} />
                {activeTodos.filter(t => formatDeadline(t.deadline)?.isOverdue).length} 个已逾期
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoPanel;
