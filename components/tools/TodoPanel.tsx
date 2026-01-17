
import React from 'react';
import { TodoItem } from '../../types';
import { CheckCircle, Circle, Briefcase, Heart, Code, PenTool, Layout, Calendar, Flame, Sparkles, Plus } from 'lucide-react';

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
    <div className="bg-white rounded-[2rem] shadow-xl border border-white/20 overflow-hidden font-sans h-full flex flex-col relative bg-gradient-to-br from-white to-gray-50">
       
       {/* Header Section */}
       <div className="p-8 pb-4">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">待办事项</h2>
                    <p className="text-sm text-gray-400 font-medium mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95">
                    <Plus size={20} />
                </button>
            </div>
       </div>

       {/* Category Pills */}
       <div className="px-8 pb-6 flex gap-3 overflow-x-auto no-scrollbar">
           {['全部', '健康', '工作', '开发'].map((c, i) => (
               <button key={c} className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${i===0 ? 'bg-gray-900 text-white shadow-gray-200' : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300 hover:text-gray-700'}`}>
                   {c}
               </button>
           ))}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-6">
           
           {/* AI Suggestion Box */}
           <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-violet-200 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-violet-100">
                        <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                        <h4 className="font-bold text-xs uppercase tracking-wider">AI 智能规划</h4>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-white/95">
                        早晨是效率高峰期，建议在11:00前优先完成 <span className="font-bold text-white underline decoration-yellow-400 decoration-2 underline-offset-2">代码开发</span> 任务。下午碎片时间可以处理账号优化。
                    </p>
                </div>
           </div>

           {/* High Priority Section */}
           {highPriorityTodos.length > 0 && (
               <div>
                   <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 pl-1">
                       <Flame size={14} fill="currentColor" /> 紧急任务
                   </h3>
                   <div className="space-y-3">
                       {highPriorityTodos.map(t => (
                           <div key={t.id} onClick={() => onToggle(t.id)} className="group relative bg-white border border-red-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                <div className="flex items-center gap-3">
                                    <div className="text-red-500 group-hover:scale-110 transition-transform">
                                        <Circle size={22} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-base font-bold text-gray-800">{t.text}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 ml-9">
                                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md uppercase">High Priority</span>
                                    {t.category && (
                                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
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
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">常规任务</h3>
               <div className="space-y-2">
                   {otherTodos.map(todo => (
                       <div key={todo.id} onClick={() => onToggle(todo.id)} className={`group flex items-center p-4 rounded-2xl transition-all cursor-pointer border ${todo.completed ? 'bg-gray-50 border-transparent opacity-60' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
                           <div className={`mr-4 transition-colors ${todo.completed ? 'text-green-500' : 'text-gray-300 group-hover:text-violet-500'}`}>
                                {todo.completed ? <CheckCircle size={22} fill="currentColor" className="text-green-500 bg-white rounded-full" /> : <Circle size={22} strokeWidth={2} />}
                           </div>
                           <div className="flex-1">
                               <p className={`text-sm font-medium transition-all ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.text}</p>
                           </div>
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {getCategoryIcon(todo.category)}
                           </div>
                       </div>
                   ))}
                   {todos.length === 0 && (
                       <div className="text-center py-10 text-gray-400 text-sm">
                           🎉 所有任务已完成
                       </div>
                   )}
               </div>
           </div>

       </div>
    </div>
  );
};

export default TodoPanel;
