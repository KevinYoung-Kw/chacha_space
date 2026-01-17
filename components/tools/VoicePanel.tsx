
import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Sparkles, Check, Music2, User, Trash2, Search } from 'lucide-react';
import { Voice } from '../../types';

// Curated list of high-quality MiniMax voices
const PRESET_VOICES: Voice[] = [
    { id: 'female-shaonv', name: '少女音色', category: 'preset', language: '中文', tags: ['甜美', '可爱', '推荐'] },
    { id: 'female-yujie', name: '御姐音色', category: 'preset', language: '中文', tags: ['成熟', '冷艳'] },
    { id: 'female-chengshu', name: '成熟女性', category: 'preset', language: '中文', tags: ['知性', '温暖'] },
    { id: 'female-tianmei', name: '甜美女性', category: 'preset', language: '中文', tags: ['亲切', '温柔'] },
    { id: 'male-qn-qingse', name: '青涩青年', category: 'preset', language: '中文', tags: ['少年', '活力'] },
    { id: 'male-qn-jingying', name: '精英青年', category: 'preset', language: '中文', tags: ['商务', '沉稳'] },
    { id: 'male-qn-badao', name: '霸道总裁', category: 'preset', language: '中文', tags: ['磁性', '有力'] },
    { id: 'male-qn-daxuesheng', name: '大学生', category: 'preset', language: '中文', tags: ['阳光', '开朗'] },
    { id: 'presenter_female', name: '新闻女声', category: 'preset', language: '中文', tags: ['播音', '专业'] },
    { id: 'presenter_male', name: '新闻男声', category: 'preset', language: '中文', tags: ['播音', '磁性'] },
    { id: 'audiobook_female', name: '有声书女', category: 'preset', language: '中文', tags: ['讲述', '情感'] },
    { id: 'audiobook_male', name: '有声书男', category: 'preset', language: '中文', tags: ['讲述', '深情'] },
    { id: 'bluetooth_female_siri', name: '智能助手', category: 'preset', language: '中文', tags: ['机械', '冷静'] },
    { id: 'santa_claus', name: '圣诞老人', category: 'preset', language: '中文', tags: ['特色', '趣味'] },
    { id: 'boy_cute', name: '可爱男童', category: 'preset', language: '中文', tags: ['儿童', '萌娃'] },
    { id: 'girl_cute', name: '萌萌女童', category: 'preset', language: '中文', tags: ['儿童', '可爱'] },
];

interface VoicePanelProps {
    currentVoiceId?: string;
    onVoiceSelected: (voiceId: string) => void;
}

const VoicePanel: React.FC<VoicePanelProps> = ({ currentVoiceId, onVoiceSelected }) => {
    // --- Tabs ---
    const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

    // --- Data ---
    const [customVoices, setCustomVoices] = useState<Voice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Effects ---
    useEffect(() => {
        const saved = localStorage.getItem('tata_custom_voices');
        if (saved) {
            setCustomVoices(JSON.parse(saved));
        }
    }, []);

    const deleteCustomVoice = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newVoices = customVoices.filter(v => v.id !== id);
        setCustomVoices(newVoices);
        localStorage.setItem('tata_custom_voices', JSON.stringify(newVoices));
    };

    const filteredPresetVoices = PRESET_VOICES.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.tags?.some(t => t.includes(searchTerm))
    );

    return (
        <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <Music2 className="text-pink-500" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">音色工坊</h2>
                        <p className="text-xs text-[var(--color-text-muted)]">选择专属音色</p>
                    </div>
                </div>
                
                {/* Tab Switcher */}
                <div className="flex bg-[var(--color-bg-accent)] p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('preset')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'preset' ? 'bg-white text-pink-600' : 'text-[var(--color-text-muted)]'}`}
                    >
                        内置音色
                    </button>
                    <button 
                        onClick={() => setActiveTab('custom')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'custom' ? 'bg-white text-pink-600' : 'text-[var(--color-text-muted)]'}`}
                    >
                        我的收藏
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                
                {/* --- Preset Tab --- */}
                {activeTab === 'preset' && (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16}/>
                            <input 
                                type="text" 
                                placeholder="搜索音色..." 
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 border border-[var(--color-border-subtle)] text-sm focus:outline-none focus:border-pink-300 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            {filteredPresetVoices.map(voice => (
                                <div 
                                    key={voice.id}
                                    onClick={() => onVoiceSelected(voice.id)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors 
                                        ${currentVoiceId === voice.id 
                                            ? 'bg-pink-50 border-pink-200' 
                                            : 'bg-white/40 border-[var(--color-border-subtle)] hover:bg-white/60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold 
                                            ${currentVoiceId === voice.id ? 'bg-pink-500 text-white' : 'bg-[var(--color-bg-accent)] text-[var(--color-text-muted)]'}`}
                                        >
                                            {voice.name[0]}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${currentVoiceId === voice.id ? 'text-pink-700' : 'text-[var(--color-text-primary)]'}`}>
                                                {voice.name}
                                            </p>
                                            <div className="flex gap-1 mt-0.5">
                                                {voice.tags?.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[var(--color-bg-accent)] rounded text-[var(--color-text-muted)]">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {currentVoiceId === voice.id && <Check size={16} className="text-pink-500"/>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Custom Tab --- */}
                {activeTab === 'custom' && (
                    <div className="space-y-5">
                        {/* Saved Custom Voices */}
                        {customVoices.length > 0 ? (
                             <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide px-1">我的收藏</h3>
                                {customVoices.map(voice => (
                                    <div 
                                        key={voice.id}
                                        onClick={() => onVoiceSelected(voice.id)}
                                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors group
                                            ${currentVoiceId === voice.id 
                                                ? 'bg-pink-50 border-pink-200' 
                                                : 'bg-white/40 border-[var(--color-border-subtle)] hover:bg-white/60'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white">
                                                <User size={14}/>
                                            </div>
                                            <p className={`text-sm font-semibold ${currentVoiceId === voice.id ? 'text-pink-700' : 'text-[var(--color-text-primary)]'}`}>
                                                {voice.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentVoiceId === voice.id && <Check size={16} className="text-pink-500"/>}
                                            <button 
                                                onClick={(e) => deleteCustomVoice(voice.id, e)}
                                                className="p-1.5 hover:bg-rose-100 rounded text-[var(--color-text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-[var(--color-bg-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="text-[var(--color-text-muted)]" size={24} />
                                </div>
                                <p className="text-sm text-[var(--color-text-muted)]">暂无收藏的音色</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">在内置音色中选择你喜欢的音色吧</p>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoicePanel;
