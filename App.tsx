
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, Message, TodoItem, WeatherData, UserProfile, TarotResult, WaterRecord, CalorieRecord, SleepRecord, ExerciseRecord } from './types';
import Avatar from './components/Avatar';
import ChatInterface from './components/ChatInterface';
import Onboarding from './components/Onboarding';
import WeatherPanel from './components/tools/WeatherPanel';
import DivinationPanel from './components/tools/DivinationPanel';
import HealthPanel from './components/tools/HealthPanel';
import TodoPanel from './components/tools/TodoPanel';
import SkillsPanel from './components/tools/SkillsPanel';
import VoicePanel from './components/tools/VoicePanel';
import { generateAssistantResponse } from './services/geminiService';
import { generateSpeech } from './services/minimaxService';
import { decodeAudioData, playAudioBuffer } from './services/audioService';
import { getWeatherByLocation, getWeatherByIP } from './services/weatherService';
import { CloudSun, Sparkles, Notebook, Zap, Settings, X, Bell, Clock, Mic2, Activity, CheckSquare, Calendar, Image, Phone } from 'lucide-react';

// Panel Types
type LeftPanelType = 'none' | 'info_weather' | 'info_fortune' | 'info_health';
type RightPanelType = 'none' | 'prod_todo' | 'prod_skills' | 'prod_voice';

const App: React.FC = () => {
  // --- State ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Panel States
  const [leftPanel, setLeftPanel] = useState<LeftPanelType>('none');
  const [rightPanel, setRightPanel] = useState<RightPanelType>('none');
  
  // Voice State
  const [currentVoiceId, setCurrentVoiceId] = useState<string>('female-shaonv');
  
  // Micro-interaction State
  const [hasNewTodo, setHasNewTodo] = useState(false);

  const [state, setState] = useState<AssistantState>(AssistantState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  
  // Data States
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: '跟塔塔打个招呼', completed: false, priority: 'high', category: 'work' },
  ]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Health Data State
  const [healthData, setHealthData] = useState<{
      water: WaterRecord;
      calories: CalorieRecord;
      sleep: SleepRecord;
      exercise: ExerciseRecord;
  }>({
      water: { current: 1200, goal: 2000, history: [] },
      calories: { current: 1450, goal: 2200, macros: { protein: 90, carbs: 180, fat: 55 }, history: [] },
      sleep: { current: 7.5, goal: 8, history: [{day: 'Mon', hours: 7}, {day: 'Tue', hours: 6.5}, {day: 'Wed', hours: 8}, {day: 'Thu', hours: 7.5}] },
      exercise: { current: 45, goal: 60, history: [{day: 'Mon', minutes: 30}, {day: 'Tue', minutes: 60}, {day: 'Wed', minutes: 45}, {day: 'Thu', minutes: 45}] }
  });

  // Mock Data
  const [tarot, setTarot] = useState<TarotResult | undefined>(undefined);

  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const weatherFetchedRef = useRef<boolean>(false); // 防止重复请求天气数据

  // --- Helpers ---
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now()
    }]);
    if (role === 'assistant') {
        setLatestResponse(content);
    }
  };

  const speak = async (text: string) => {
    try {
      // Pass the currentVoiceId to the service
      const audioBufferData = await generateSpeech(text, currentVoiceId);
      
      if (audioBufferData) {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const buffer = await decodeAudioData(audioBufferData, ctx);
        playAudioBuffer(buffer, ctx, () => {
            setState(AssistantState.IDLE);
        });
      } else {
        // Fallback
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN'; 
        utterance.onend = () => setState(AssistantState.IDLE);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      setState(AssistantState.IDLE);
    }
  };

  const processInput = async (text: string) => {
    addMessage('user', text);
    setState(AssistantState.THINKING);

    const actions = {
      onAddTodo: (text: string) => {
        setTodos(prev => {
            setHasNewTodo(true);
            setTimeout(() => setHasNewTodo(false), 2000);
            return [...prev, { id: Date.now().toString(), text, completed: false, priority: 'medium' }];
        });
        setRightPanel('prod_todo'); // Auto-open todo panel
      },
      onSetWeather: (data: WeatherData) => {
        setWeather(data);
        setLeftPanel('info_weather'); // Auto-open weather panel
      }
    };

    const responseText = await generateAssistantResponse(
        messages, 
        text, 
        { todos, weather },
        actions
    );

    addMessage('assistant', responseText);
    setState(AssistantState.SPEAKING);
    await speak(responseText);
  };

  const handleVoiceSelected = (voiceId: string) => {
      setCurrentVoiceId(voiceId);
      // Give simple feedback
      speak("你喜欢这个新声音吗？");
      setState(AssistantState.SPEAKING);
  };

  const handleAddWater = () => {
      setHealthData(prev => ({
          ...prev,
          water: { ...prev.water, current: prev.water.current + 250 }
      }));
      speak("咕嘟咕嘟，补充水分啦！");
      setState(AssistantState.SPEAKING);
  };

  // --- Setup ---
  useEffect(() => {
     const saved = localStorage.getItem('tata_profile');
     if (saved) setUserProfile(JSON.parse(saved));

     // 防止 React StrictMode 双重调用导致的重复请求
     if (weatherFetchedRef.current) return;
     weatherFetchedRef.current = true;

     const fetchWeather = async () => {
         // 优先使用浏览器精确定位（避免 IP API 限流）
         if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
                 async (position) => {
                     const { latitude, longitude } = position.coords;
                     const w = await getWeatherByLocation(latitude, longitude);
                     if (w) setWeather(w);
                 }, 
                 async (err) => {
                     console.warn("Geolocation permission denied, trying IP-based location", err);
                     // 仅在地理定位失败时才使用 IP API（降低请求频率）
                     const ipWeatherData = await getWeatherByIP();
                     if (ipWeatherData) setWeather(ipWeatherData);
                 }
             );
         } else {
             // 浏览器不支持地理定位时才使用 IP API
             const ipWeatherData = await getWeatherByIP();
             if (ipWeatherData) setWeather(ipWeatherData);
         }
     };
     fetchWeather();
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'zh-CN';
      recognition.onstart = () => { setIsListening(true); setState(AssistantState.LISTENING); };
      recognition.onend = () => { setIsListening(false); if (state === AssistantState.LISTENING) setState(AssistantState.IDLE); };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) processInput(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, [state]);

  const toggleListening = useCallback(() => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  }, [isListening]);

  const handleOnboardingComplete = (profile: UserProfile) => {
      setUserProfile(profile);
      localStorage.setItem('tata_profile', JSON.stringify(profile));
      const intro = `很高兴遇见你，${profile.name}。我是 塔塔。`;
      addMessage('assistant', intro);
      speak(intro);
  };

  if (!userProfile) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="fixed inset-0 bg-[#fdfcf8] text-[#5c4d43] font-sans overflow-hidden selection:bg-[#e6dec8]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            backgroundImage: 'url("/images/background.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
        {/* Subtle overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fdfcf8]/30 pointer-events-none"></div>

        {/* --- Center Stage (40-50% width) --- */}
        <div className="absolute inset-x-0 top-0 bottom-32 flex flex-col items-center justify-center z-10 pointer-events-none">
             
             {/* Speech Bubble Area */}
             <div className="w-full max-w-md h-32 flex items-end justify-center mb-4 px-6">
                {state === AssistantState.SPEAKING && latestResponse && (
                    <div className="bg-white/90 backdrop-blur-md border border-purple-100 px-6 py-4 rounded-3xl rounded-bl-none shadow-xl text-sm md:text-base font-medium text-gray-700 animate-fade-in-up relative max-w-full text-center">
                        {latestResponse}
                        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white/90 border-b border-r border-purple-100 transform rotate-45"></div>
                    </div>
                )}
             </div>

             {/* Character */}
             <div className="w-full max-w-lg h-[50vh] md:h-[60vh] flex items-center justify-center relative">
                 <Avatar state={state} mode="full" className="h-full w-auto object-contain drop-shadow-2xl" />
             </div>
        </div>

        {/* --- Left Panel (Information Board) --- */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-row items-center gap-4">
            {/* Icons Column - Styled like image */}
            <div className="flex flex-col gap-3">
                <ToolbarIcon 
                    icon={<CheckSquare size={22} />} 
                    active={leftPanel === 'info_health'} 
                    onClick={() => setLeftPanel(leftPanel === 'info_health' ? 'none' : 'info_health')}
                    label="待办"
                />
                <ToolbarIcon 
                    icon={<Calendar size={22} />} 
                    active={leftPanel === 'info_weather'} 
                    onClick={() => setLeftPanel(leftPanel === 'info_weather' ? 'none' : 'info_weather')}
                    label="日程"
                />
                <ToolbarIcon 
                    icon={<CloudSun size={22} />} 
                    active={false} 
                    onClick={() => {}}
                    label="天气"
                />
                <ToolbarIcon 
                    icon={<Zap size={22} />} 
                    active={leftPanel === 'info_fortune'} 
                    onClick={() => setLeftPanel(leftPanel === 'info_fortune' ? 'none' : 'info_fortune')}
                    label="技能"
                />
            </div>

            {/* Slide-out Content Card */}
            {leftPanel !== 'none' && (
                <div className="w-[26rem] h-[600px] animate-slide-in-left">
                    <div className="h-full rounded-[2.5rem] shadow-2xl overflow-hidden glass-panel-strong border border-white/50">
                        {leftPanel === 'info_weather' && (
                             weather ? <WeatherPanel weather={weather} /> 
                             : <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full gap-2">
                                 <Clock className="animate-spin text-gray-300"/>
                                 <span>正在校准时间线...</span>
                               </div>
                        )}
                        {leftPanel === 'info_health' && (
                            <HealthPanel 
                                {...healthData}
                                onAddWater={handleAddWater}
                            />
                        )}
                        {leftPanel === 'info_fortune' && <DivinationPanel result={tarot} />}
                    </div>
                </div>
            )}
        </div>

        {/* --- Right Panel (Productivity Center) --- */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-row-reverse items-center gap-4">
            {/* Icons Column - Styled like image */}
            <div className="flex flex-col gap-3">
                <ToolbarIcon 
                    icon={<Notebook size={22} />} 
                    active={rightPanel === 'prod_todo'} 
                    onClick={() => setRightPanel(rightPanel === 'prod_todo' ? 'none' : 'prod_todo')}
                    label="笔记"
                    notification={hasNewTodo}
                    position="right"
                />
                <ToolbarIcon 
                    icon={<Image size={22} />} 
                    active={false} 
                    onClick={() => {}}
                    label="相册"
                    position="right"
                />
                <ToolbarIcon 
                    icon={<Activity size={22} />} 
                    active={rightPanel === 'prod_skills'} 
                    onClick={() => setRightPanel(rightPanel === 'prod_skills' ? 'none' : 'prod_skills')}
                    label="活动"
                    position="right"
                />
                <ToolbarIcon 
                    icon={<Settings size={22} />} 
                    active={rightPanel === 'prod_voice'} 
                    onClick={() => setRightPanel(rightPanel === 'prod_voice' ? 'none' : 'prod_voice')}
                    label="设置"
                    position="right"
                />
            </div>

            {/* Slide-out Content Card */}
            {rightPanel !== 'none' && (
                <div className="w-[26rem] h-[600px] animate-slide-in-right">
                    <div className="h-full rounded-[2.5rem] shadow-2xl overflow-hidden glass-panel-strong border border-white/50">
                        {rightPanel === 'prod_todo' && (
                            <TodoPanel 
                                todos={todos} 
                                onToggle={(id) => setTodos(prev => prev.map(t => t.id === id ? {...t, completed: !t.completed} : t))} 
                            />
                        )}
                        {rightPanel === 'prod_skills' && <SkillsPanel />}
                        {rightPanel === 'prod_voice' && (
                            <VoicePanel 
                                currentVoiceId={currentVoiceId}
                                onVoiceSelected={handleVoiceSelected} 
                            />
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* --- Bottom Control Bar --- */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-40">
            <ChatInterface 
                messages={messages}
                isListening={isListening}
                onSendMessage={processInput}
                onToggleListening={toggleListening}
                inputRef={inputRef}
            />
        </div>
        
        {/* Global styles now loaded from /styles/main.css */}
    </div>
  );
};

// Helper Component for Toolbar Icons (styled like the reference image)
const ToolbarIcon = ({ icon, active, onClick, label, notification, position = 'left' }: { 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void, 
  label: string, 
  notification?: boolean,
  position?: 'left' | 'right'
}) => (
    <div className="relative group flex flex-col items-center">
        <button 
            onClick={onClick}
            className={`toolbar-btn w-12 h-12 rounded-xl flex items-center justify-center ${
              active ? 'active' : ''
            } ${notification ? 'animate-shake' : ''}`}
        >
            {icon}
            {notification && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#f5f0e8] shadow-sm"></span>
            )}
        </button>
        {/* Label below icon */}
        <span className={`toolbar-label ${active ? 'active' : ''}`}>
            {label}
        </span>
    </div>
);

// Legacy GlassIcon (kept for compatibility)
const GlassIcon = ({ icon, active, onClick, label, notification }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string, notification?: boolean }) => (
    <div className="relative group">
        <button 
            onClick={onClick}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 glass-icon ${active ? '!bg-white/90 !shadow-lg text-purple-600 scale-105' : 'text-gray-600'} ${notification ? 'animate-shake' : ''}`}
        >
            {icon}
            {notification && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
            )}
        </button>
        {/* Tooltip Label */}
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-800/90 backdrop-blur text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap pointer-events-none shadow-xl">
            {label}
            {/* Little arrow pointing left */}
            <span className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-gray-800/90"></span>
        </span>
    </div>
);

export default App;
