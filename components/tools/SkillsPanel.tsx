
import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Zap, Star, Activity, Coffee, Mic, Music } from 'lucide-react';

const SkillsPanel: React.FC = () => {
    const [skills, setSkills] = useState([
        { id: 'weather', name: '早安播报', desc: '每天8:00播报天气与新闻', active: true, icon: <Zap size={18}/> },
        { id: 'fortune', name: '每日运势', desc: '基于星象的每日指引', active: true, icon: <Star size={18}/> },
        { id: 'focus', name: '专注模式', desc: '屏蔽闲聊，仅响应指令', active: false, icon: <Coffee size={18}/> },
        { id: 'health', name: '喝水提醒', desc: '每2小时提醒补水', active: false, icon: <Activity size={18}/> },
        { id: 'music', name: '环境白噪音', desc: '对话时播放背景音', active: false, icon: <Music size={18}/> },
    ]);

    const toggle = (id: string) => {
        setSkills(prev => prev.map(s => s.id === id ? {...s, active: !s.active} : s));
    };

    return (
        <div className="h-full flex flex-col font-sans text-gray-700">
             {/* Header */}
             <div className="p-6 pb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Zap className="text-purple-500 fill-purple-100" /> 
                    能力开关
                </h2>
                <p className="text-xs text-gray-500 mt-1 pl-1">自定义塔塔的助手技能</p>
             </div>

             {/* Skills List */}
             <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
                {skills.map(skill => (
                    <div 
                        key={skill.id} 
                        onClick={() => toggle(skill.id)}
                        className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between
                            ${skill.active 
                                ? 'bg-white/80 border-purple-200 shadow-md shadow-purple-100/50' 
                                : 'bg-white/40 border-white/50 hover:bg-white/60'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${skill.active ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {skill.icon}
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${skill.active ? 'text-gray-800' : 'text-gray-500'}`}>{skill.name}</h3>
                                <p className="text-[10px] text-gray-400 font-medium">{skill.desc}</p>
                            </div>
                        </div>
                        
                        <div className={`transition-colors ${skill.active ? 'text-purple-500' : 'text-gray-300'}`}>
                            {skill.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </div>
                    </div>
                ))}
             </div>
             
             {/* Footer Prompt */}
             <div className="p-6 pt-2">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
                    <div className="flex items-start gap-3 relative z-10">
                        <Mic size={20} className="mt-1 opacity-80"/>
                        <div>
                            <p className="text-xs font-bold opacity-80 uppercase mb-1">想学新技能？</p>
                            <p className="text-sm font-medium">试着对我说：<br/>"记住，我想让你每天提醒我..."</p>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
}

export default SkillsPanel;
