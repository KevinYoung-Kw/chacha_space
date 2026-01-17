
import React from 'react';
import { TodoItem } from '../../types';
import { CheckCircle, Circle, Briefcase, Heart, Code, PenTool, Layout, Calendar, Flame, Plus, PartyPopper, Sparkles } from 'lucide-react';

interface TodoPanelProps {
  todos: TodoItem[];
  onToggle: (id: string) => void;
}

const TodoPanel: React.FC<TodoPanelProps> = ({ todos, onToggle }) => {
  
  const getCategoryIcon = (cat?: string) => {
      switch(cat) {
          case 'health': return <Heart size={14} className="text-pink-500" />;
          case 'work': return <Briefcase size={14} className="text-blue-500" />;
          case 'dev': return <Code size={14} className="text-purple-500" />;
          case 'content': return <PenTool size={14} className="text-orange-500" />;
          default: return <Layout size={14} className="text-gray-400" />;
      }
  };

  const highPriorityTodos = todos.filter(t => !t.completed && t.priority === 'high');
  const otherTodos = todos.filter(t => t.priority !== 'high' || t.completed);

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
       
       {/* Header Section - 苹果风格简洁头部 */}
       <div className="px-6 pt-6 pb-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">待办事项</h2>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium mt-1 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button className="w-9 h-9 bg-[var(--color-accent-rose)] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95">
                    <Plus size={18} strokeWidth={2.5} />
                </button>
            </div>
       </div>

       {/* Category Pills - 简化的分类标签 */}
       <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
           {['全部', '健康', '工作', '开发'].map((c, i) => (
               <button 
                 key={c} 
                 className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap
                   ${i === 0 
                     ? 'bg-[var(--color-text-primary)] text-white' 
                     : 'bg-[var(--color-bg-accent)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                   }`}
               >
                   {c}
               </button>
           ))}
       </div>

       {/* Task List */}
       <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-5">
           
           {/* High Priority Section */}
           {highPriorityTodos.length > 0 && (
               <div>
                   <h3 className="text-xs font-semibold text-[var(--color-accent-rose)] uppercase tracking-wide mb-3 flex items-center gap-1.5 px-1">
                       <Flame size={12} /> 紧急
                   </h3>
                   <div className="space-y-2">
                       {highPriorityTodos.map(t => (
                           <div 
                             key={t.id} 
                             onClick={() => onToggle(t.id)} 
                             className="group flex items-center gap-3 p-4 rounded-2xl bg-white/60 border border-[var(--color-border-subtle)] hover:bg-white/80 transition-colors cursor-pointer"
                           >
                                <div className="text-[var(--color-accent-rose)] group-hover:scale-110 transition-transform">
                                    <Circle size={22} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-[var(--color-text-primary)] block truncate">{t.text}</span>
                                    {t.category && (
                                        <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] mt-1">
                                            {getCategoryIcon(t.category)} {t.category}
                                        </span>
                                    )}
                                </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {/* Normal List */}
           <div>
               <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3 px-1">任务列表</h3>
               <div className="space-y-2">
                   {otherTodos.map(todo => (
                       <div 
                         key={todo.id} 
                         onClick={() => onToggle(todo.id)} 
                         className={`group flex items-center gap-3 p-4 rounded-2xl transition-colors cursor-pointer
                           ${todo.completed 
                             ? 'bg-transparent opacity-50' 
                             : 'bg-white/60 border border-[var(--color-border-subtle)] hover:bg-white/80'
                           }`}
                       >
                           <div className={`transition-colors ${todo.completed ? 'text-green-500' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-rose)]'}`}>
                                {todo.completed 
                                  ? <CheckCircle size={22} className="fill-current" /> 
                                  : <Circle size={22} strokeWidth={2} />
                                }
                           </div>
                           <div className="flex-1 min-w-0">
                               <p className={`text-sm font-medium transition-all truncate ${todo.completed ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                                 {todo.text}
                               </p>
                           </div>
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {getCategoryIcon(todo.category)}
                           </div>
                       </div>
                   ))}
                   {todos.length === 0 && (
                       <div className="text-center py-12 text-[var(--color-text-muted)] text-sm flex flex-col items-center gap-2">
                           <PartyPopper size={24} className="text-[var(--color-accent-rose-light)]" />
                           <span>所有任务已完成</span>
                       </div>
                   )}
               </div>
           </div>

       </div>
    </div>
  );
};

export default TodoPanel;
