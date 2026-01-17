
import React, { useState, useRef, useEffect } from 'react';
import { Mic2, Play, Square, Wand2, Sparkles, Check, Loader2, Music2, User, Plus, Trash2, Search } from 'lucide-react';
import { designVoice } from '../../services/minimaxService';
import { decodeAudioData, playAudioBuffer } from '../../services/audioService';
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

    // --- Creation State ---
    const [prompt, setPrompt] = useState('讲述悬疑故事的播音员，声音低沉富有磁性，语速时快时慢，营造紧张神秘的氛围。');
    const [previewText, setPreviewText] = useState('夜深了，古屋里只有他一人。窗外传来若有若无的脚步声...');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVoiceId, setGeneratedVoiceId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // --- Refs ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    // --- Effects ---
    useEffect(() => {
        const saved = localStorage.getItem('tata_custom_voices');
        if (saved) {
            setCustomVoices(JSON.parse(saved));
        }
    }, []);

    const saveCustomVoice = (voice: Voice) => {
        const newVoices = [voice, ...customVoices];
        setCustomVoices(newVoices);
        localStorage.setItem('tata_custom_voices', JSON.stringify(newVoices));
    };

    const deleteCustomVoice = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newVoices = customVoices.filter(v => v.id !== id);
        setCustomVoices(newVoices);
        localStorage.setItem('tata_custom_voices', JSON.stringify(newVoices));
    };

    // --- Handlers ---
    const handleGenerate = async () => {
        if (!prompt || !previewText) return;
        
        setIsGenerating(true);
        if (currentSourceRef.current) {
            currentSourceRef.current.stop();
            setIsPlaying(false);
        }

        try {
            const result = await designVoice(prompt, previewText);
            if (result) {
                setGeneratedVoiceId(result.voiceId);
                
                // Decode for preview
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const ctx = audioContextRef.current;
                const buffer = await decodeAudioData(result.audio, ctx);
                audioBufferRef.current = buffer;
                
                // Auto play
                playPreview();
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const playPreview = () => {
        if (!audioBufferRef.current || !audioContextRef.current) return;
        
        if (isPlaying && currentSourceRef.current) {
            currentSourceRef.current.stop();
            setIsPlaying(false);
            return;
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const source = playAudioBuffer(audioBufferRef.current, ctx, () => {
            setIsPlaying(false);
        });
        currentSourceRef.current = source;
        setIsPlaying(true);
    };

    const handleConfirmGeneration = () => {
        if (generatedVoiceId) {
            const newVoice: Voice = {
                id: generatedVoiceId,
                name: `自定义音色 ${customVoices.length + 1}`,
                category: 'custom',
                tags: ['自制']
            };
            saveCustomVoice(newVoice);
            onVoiceSelected(generatedVoiceId);
            setGeneratedVoiceId(null);
            setActiveTab('custom'); // Ensure we are on the custom tab to see the list
        }
    };

    const filteredPresetVoices = PRESET_VOICES.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.tags?.some(t => t.includes(searchTerm))
    );

    return (
        <div className="h-full flex flex-col font-sans text-gray-700 bg-white/40">
            {/* Header */}
            <div className="p-6 pb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Music2 className="text-pink-500 fill-pink-100" />
                    音色工坊
                </h2>
                <div className="flex bg-white/50 p-1 rounded-xl mt-4 border border-white/60 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('preset')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'preset' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        内置音色
                    </button>
                    <button 
                        onClick={() => setActiveTab('custom')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'custom' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        自定义
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input 
                                type="text" 
                                placeholder="搜索音色..." 
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 border border-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {filteredPresetVoices.map(voice => (
                                <div 
                                    key={voice.id}
                                    onClick={() => onVoiceSelected(voice.id)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${currentVoiceId === voice.id ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-white/40 border-transparent hover:bg-white/80'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentVoiceId === voice.id ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {voice.name[0]}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${currentVoiceId === voice.id ? 'text-pink-700' : 'text-gray-700'}`}>{voice.name}</p>
                                            <div className="flex gap-1 mt-0.5">
                                                {voice.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{tag}</span>
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
                    <div className="space-y-6">
                        {/* Saved Custom Voices */}
                        {customVoices.length > 0 && (
                             <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">我的音色库</h3>
                                {customVoices.map(voice => (
                                    <div 
                                        key={voice.id}
                                        onClick={() => onVoiceSelected(voice.id)}
                                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all group ${currentVoiceId === voice.id ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-white/40 border-transparent hover:bg-white/80'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white">
                                                <User size={14}/>
                                            </div>
                                            <p className={`text-sm font-bold ${currentVoiceId === voice.id ? 'text-pink-700' : 'text-gray-700'}`}>{voice.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentVoiceId === voice.id && <Check size={16} className="text-pink-500"/>}
                                            <button 
                                                onClick={(e) => deleteCustomVoice(voice.id, e)}
                                                className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Design Tool */}
                        <div className="bg-white/60 rounded-2xl p-4 border border-white/50 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Wand2 size={16} className="text-purple-500"/> 设计新音色
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Prompt 描述</label>
                                    <textarea 
                                        className="w-full h-24 p-3 rounded-xl bg-white border border-gray-100 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-xs resize-none transition-all"
                                        placeholder="例如：声音低沉富有磁性的中年男性，语气稳重..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">试听文本</label>
                                    <input 
                                        className="w-full p-3 rounded-xl bg-white border border-gray-100 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-xs"
                                        value={previewText}
                                        onChange={(e) => setPreviewText(e.target.value)}
                                    />
                                </div>

                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !prompt}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 text-sm
                                        ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 hover:-translate-y-0.5'}`}
                                >
                                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {isGenerating ? '正在生成...' : '生成试听'}
                                </button>
                            </div>

                            {/* Result Actions */}
                            {generatedVoiceId && (
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-300 animate-fade-in-up">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={playPreview}
                                            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5"
                                        >
                                            {isPlaying ? <Square size={12} fill="currentColor"/> : <Play size={12} fill="currentColor"/>}
                                            {isPlaying ? '停止' : '播放'}
                                        </button>
                                        <button 
                                            onClick={handleConfirmGeneration}
                                            className="flex-1 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-200"
                                        >
                                            <Plus size={14} /> 保存并使用
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoicePanel;
