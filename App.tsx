
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AssistantState, Message, TodoItem, WeatherData, UserProfile, TarotResult, WaterRecord, CalorieRecord, SleepRecord, ExerciseRecord } from './types';
import VideoAvatar, { VideoAvatarRef } from './components/VideoAvatar';
import ChatInterface from './components/ChatInterface';
import Onboarding from './components/Onboarding';
import WeatherPanel from './components/tools/WeatherPanel';
import DivinationPanel from './components/tools/DivinationPanel';
import HealthPanel from './components/tools/HealthPanel';
import TodoPanel from './components/tools/TodoPanel';
import SkillsPanel from './components/tools/SkillsPanel';
import VoicePanel from './components/tools/VoicePanel';
import WatchaPanel from './components/tools/WatchaPanel';
import { generateAssistantResponse, AgentActions, HealthData } from './services/geminiService';
import { generateSpeech } from './services/minimaxService';
import { decodeAudioData, playAudioBuffer } from './services/audioService';
import { getWeatherByLocation, getWeatherByIP } from './services/weatherService';
import { createCustomConfig } from './config/characterConfig';
import { CloudSun, Sparkles, Notebook, Zap, Settings, X, Bell, Clock, Mic2, Activity, CheckSquare, Calendar, Image, Phone, Globe } from 'lucide-react';

// 塔罗牌数据库
const TAROT_CARDS = [
  { name: '愚者', upright: '新的开始、冒险、纯真', reversed: '鲁莽、冒险过度' },
  { name: '魔术师', upright: '创造力、技能、意志力', reversed: '欺骗、能力不足' },
  { name: '女祭司', upright: '直觉、神秘、内在智慧', reversed: '隐藏的信息、不信任直觉' },
  { name: '皇后', upright: '丰盛、母性、创造', reversed: '依赖、创造力受阻' },
  { name: '皇帝', upright: '权威、结构、领导力', reversed: '专制、缺乏纪律' },
  { name: '教皇', upright: '传统、指导、信仰', reversed: '打破常规、个人信念' },
  { name: '恋人', upright: '爱情、和谐、选择', reversed: '不和谐、价值观冲突' },
  { name: '战车', upright: '胜利、决心、控制', reversed: '缺乏方向、失控' },
  { name: '力量', upright: '勇气、内在力量、耐心', reversed: '自我怀疑、软弱' },
  { name: '隐士', upright: '内省、寻求、指引', reversed: '孤立、逃避' },
  { name: '命运之轮', upright: '好运、命运、转折点', reversed: '厄运、抗拒改变' },
  { name: '正义', upright: '公平、真相、因果', reversed: '不公、逃避责任' },
  { name: '倒吊人', upright: '牺牲、新视角、等待', reversed: '拖延、无谓牺牲' },
  { name: '死神', upright: '结束、转变、新生', reversed: '抗拒改变、停滞' },
  { name: '节制', upright: '平衡、耐心、目的', reversed: '失衡、过度' },
  { name: '恶魔', upright: '束缚、物质主义、诱惑', reversed: '解脱、恢复控制' },
  { name: '塔', upright: '突变、启示、觉醒', reversed: '逃避灾难、恐惧改变' },
  { name: '星星', upright: '希望、灵感、宁静', reversed: '失望、缺乏信心' },
  { name: '月亮', upright: '直觉、潜意识、幻象', reversed: '困惑消散、面对恐惧' },
  { name: '太阳', upright: '快乐、成功、活力', reversed: '暂时挫折、缺乏热情' },
  { name: '审判', upright: '觉醒、重生、内在召唤', reversed: '自我怀疑、逃避召唤' },
  { name: '世界', upright: '完成、整合、成就', reversed: '不完整、缺乏closure' },
];

// Panel Types
type LeftPanelType = 'none' | 'info_weather' | 'info_fortune' | 'info_health';
type RightPanelType = 'none' | 'prod_todo' | 'prod_skills' | 'prod_voice' | 'prod_watcha';

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
    { id: '1', text: '跟叉叉打个招呼', completed: false, priority: 'high', category: 'work' },
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
  const videoAvatarRef = useRef<VideoAvatarRef>(null); // 视频人物状态机引用

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

  // 生成塔罗牌占卜结果
  const generateTarotReading = (question: string): TarotResult => {
    // 随机抽取3张牌
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    const drawnCards = shuffled.slice(0, 3).map((card, index) => {
      const isReversed = Math.random() > 0.6;
      const positions = ['过去', '现在', '未来'];
      return {
        name: card.name,
        position: positions[index],
        meaning: isReversed ? card.reversed : card.upright,
        orientation: (isReversed ? 'reversed' : 'upright') as 'upright' | 'reversed'
      };
    });

    // 生成分析
    const analysis = `关于「${question}」的占卜显示：
${drawnCards[0].name}代表你的过去，暗示${drawnCards[0].meaning}；
${drawnCards[1].name}象征当下的状态，意味着${drawnCards[1].meaning}；
${drawnCards[2].name}指向未来的可能，预示${drawnCards[2].meaning}。`;

    const advice = drawnCards[2].orientation === 'upright' 
      ? '整体来看运势不错，继续保持积极的心态吧！'
      : '可能会遇到一些挑战，但这也是成长的机会哦~';

    return {
      type: 'tarot',
      cards: drawnCards,
      analysis,
      advice
    };
  };

  const processInput = async (text: string) => {
    addMessage('user', text);
    setState(AssistantState.THINKING);

    // 完整的 Agent Actions
    const actions: AgentActions = {
      // --- 待办事项 ---
      onAddTodo: (todoText: string, priority?: string, category?: string) => {
        setTodos(prev => {
          setHasNewTodo(true);
          setTimeout(() => setHasNewTodo(false), 2000);
          return [...prev, { 
            id: Date.now().toString(), 
            text: todoText, 
            completed: false, 
            priority: (priority as 'high' | 'medium' | 'low') || 'medium',
            category: category as 'health' | 'work' | 'dev' | 'content' | undefined
          }];
        });
        setRightPanel('prod_todo');
      },
      
      onToggleTodo: (searchText: string): boolean => {
        let found = false;
        setTodos(prev => prev.map(t => {
          if (t.text.includes(searchText)) {
            found = true;
            return { ...t, completed: !t.completed };
          }
          return t;
        }));
        if (found) setRightPanel('prod_todo');
        return found;
      },
      
      onDeleteTodo: (searchText: string): boolean => {
        let found = false;
        setTodos(prev => {
          const newTodos = prev.filter(t => {
            if (t.text.includes(searchText)) {
              found = true;
              return false;
            }
            return true;
          });
          return newTodos;
        });
        return found;
      },

      // --- 天气 ---
      onSetWeather: (data: WeatherData) => {
        setWeather(data);
        setLeftPanel('info_weather');
      },

      // --- 健康追踪 ---
      onAddWater: (amount?: number) => {
        const addAmount = amount || 250;
        setHealthData(prev => ({
          ...prev,
          water: { 
            ...prev.water, 
            current: prev.water.current + addAmount,
            history: [...prev.water.history, { 
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), 
              amount: addAmount, 
              type: '水' 
            }]
          }
        }));
        setLeftPanel('info_health');
      },
      
      onGetHealthStatus: (): HealthData => {
        return healthData;
      },

      // --- 占卜 ---
      onDrawTarot: (question?: string): TarotResult => {
        const result = generateTarotReading(question || '今日运势');
        setTarot(result);
        setLeftPanel('info_fortune');
        return result;
      },

      // --- 面板控制 ---
      onOpenPanel: (panel: string) => {
        switch (panel) {
          case 'weather':
            setLeftPanel('info_weather');
            break;
          case 'health':
            setLeftPanel('info_health');
            break;
          case 'fortune':
            setLeftPanel('info_fortune');
            break;
          case 'todo':
            setRightPanel('prod_todo');
            break;
          case 'skills':
            setRightPanel('prod_skills');
            break;
          case 'voice':
            setRightPanel('prod_voice');
            break;
          case 'watcha':
            setRightPanel('prod_watcha');
            break;
        }
      }
    };

    const responseText = await generateAssistantResponse(
      messages, 
      text, 
      { 
        todos, 
        weather,
        healthData,
        userName: userProfile?.name
      },
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
     const saved = localStorage.getItem('chacha_profile');
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
      localStorage.setItem('chacha_profile', JSON.stringify(profile));
      const intro = `嗨！${profile.name}，很高兴遇见你！我是叉叉，来自2045年的你亲手创造的AI助手～让我们一起把生活整理得井井有条吧！`;
      addMessage('assistant', intro);
      speak(intro);
  };

  // 缓存视频人物配置（避免每次渲染都重新创建）
  const characterConfig = useMemo(() => createCustomConfig(), []);

  // --- 面板联动逻辑：根据面板状态控制视频人物朝向 ---
  useEffect(() => {
    if (!videoAvatarRef.current) return;

    // 优先级：左面板 > 右面板 > 无面板（中间）
    if (leftPanel !== 'none') {
      videoAvatarRef.current.focusLeft();
    } else if (rightPanel !== 'none') {
      videoAvatarRef.current.focusRight();
    } else {
      videoAvatarRef.current.focusCenter();
    }
  }, [leftPanel, rightPanel]);

  // --- 语音状态联动：说话时播放对应动作 ---
  useEffect(() => {
    if (!videoAvatarRef.current) return;

    if (state === AssistantState.SPEAKING) {
      videoAvatarRef.current.playAction('speaking');
    } else if (state === AssistantState.THINKING) {
      videoAvatarRef.current.playAction('thinking');
    }
  }, [state]);

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

              {/* Character - 使用视频状态机驱动的人物 */}
              <div className="w-full max-w-lg h-[50vh] md:h-[60vh] flex items-center justify-center relative pointer-events-auto">
                  <VideoAvatar 
                    ref={videoAvatarRef}
                    config={characterConfig}
                    className="h-full w-full"
                    autoPlay={true}
                    debug={true}
                    onStateChange={(event) => {
                      console.log('[App] Character state:', event.currentState, 'previous:', event.previousState);
                    }}
                  />
              </div>
        </div>

        {/* --- Left Panel (Information Board) --- */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-row items-center gap-4">
            {/* Icons Column - Styled like image */}
            <div className="flex flex-col gap-3">
                <ToolbarIcon 
                    icon={<Activity size={22} />} 
                    active={leftPanel === 'info_health'} 
                    onClick={() => setLeftPanel(leftPanel === 'info_health' ? 'none' : 'info_health')}
                    label="健康"
                />
                <ToolbarIcon 
                    icon={<CloudSun size={22} />} 
                    active={leftPanel === 'info_weather'} 
                    onClick={() => setLeftPanel(leftPanel === 'info_weather' ? 'none' : 'info_weather')}
                    label="天气"
                />
                <ToolbarIcon 
                    icon={<Sparkles size={22} />} 
                    active={leftPanel === 'info_fortune'} 
                    onClick={() => setLeftPanel(leftPanel === 'info_fortune' ? 'none' : 'info_fortune')}
                    label="占卜"
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
                    icon={<CheckSquare size={22} />} 
                    active={rightPanel === 'prod_todo'} 
                    onClick={() => {
                        const newState = rightPanel === 'prod_todo' ? 'none' : 'prod_todo';
                        console.log('[App] 待办按钮点击 - 新状态:', newState);
                        setRightPanel(newState);
                        // 打开待办面板时播放动作
                        if (newState === 'prod_todo') {
                            console.log('[App] 尝试播放 wave 动作, videoAvatarRef:', videoAvatarRef.current);
                            if (videoAvatarRef.current) {
                                videoAvatarRef.current.playAction('wave');
                                console.log('[App] playAction("wave") 已调用');
                            } else {
                                console.error('[App] videoAvatarRef.current 为 null!');
                            }
                        }
                    }}
                    label="待办"
                    notification={hasNewTodo}
                    position="right"
                />
                <ToolbarIcon 
                    icon={<Zap size={22} />} 
                    active={rightPanel === 'prod_skills'} 
                    onClick={() => setRightPanel(rightPanel === 'prod_skills' ? 'none' : 'prod_skills')}
                    label="技能"
                    position="right"
                />
                <ToolbarIcon 
                    icon={<Mic2 size={22} />} 
                    active={rightPanel === 'prod_voice'} 
                    onClick={() => setRightPanel(rightPanel === 'prod_voice' ? 'none' : 'prod_voice')}
                    label="声音"
                    position="right"
                />
                <ToolbarIcon 
                    icon={
                        <img 
                            src="/watcha.svg" 
                            alt="Watcha" 
                            className="w-5 h-5"
                            style={{ filter: rightPanel === 'prod_watcha' ? 'none' : 'opacity(0.6)' }}
                        />
                    } 
                    active={rightPanel === 'prod_watcha'} 
                    onClick={() => setRightPanel(rightPanel === 'prod_watcha' ? 'none' : 'prod_watcha')}
                    label="Watcha"
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
                        {rightPanel === 'prod_watcha' && <WatchaPanel />}
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
