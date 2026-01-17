
import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Zap, Star, Activity, Coffee, Music, Mic } from 'lucide-react';

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
        <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
             {/* Header */}
             <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Zap className="text-purple-500" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">能力开关</h2>
                        <p className="text-xs text-[var(--color-text-muted)]">自定义塔塔的助手技能</p>
                    </div>
                </div>
             </div>

             {/* Skills List */}
             <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-3">
                {skills.map(skill => (
                    <div 
                        key={skill.id} 
                        onClick={() => toggle(skill.id)}
                        className={`p-4 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between
                            ${skill.active 
                                ? 'bg-white/80 border-purple-200' 
                                : 'bg-white/40 border-[var(--color-border-subtle)] hover:bg-white/60'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors 
                                ${skill.active ? 'bg-purple-500 text-white' : 'bg-[var(--color-bg-accent)] text-[var(--color-text-muted)]'}`}
                            >
                                {skill.icon}
                            </div>
                            <div>
                                <h3 className={`font-semibold text-sm ${skill.active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                    {skill.name}
                                </h3>
                                <p className="text-[11px] text-[var(--color-text-muted)]">{skill.desc}</p>
                            </div>
                        </div>
                        
                        <div className={`transition-colors ${skill.active ? 'text-purple-500' : 'text-[var(--color-text-muted)]'}`}>
                            {skill.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </div>
                    </div>
                ))}
             </div>
             
             {/* Footer Prompt */}
             <div className="px-6 pb-6">
                <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[var(--color-bg-accent)] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Mic size={16} className="text-[var(--color-text-secondary)]"/>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">想学新技能？</p>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                试着对我说："记住，我想让你每天提醒我..."
                            </p>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
}

export default SkillsPanel;
