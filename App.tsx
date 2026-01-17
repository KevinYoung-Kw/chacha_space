
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AssistantState, Message, TodoItem, TodoCategory, WeatherData, TarotResult, WaterRecord, CalorieRecord, SleepRecord, ExerciseRecord } from './types';
import VideoAvatar, { VideoAvatarRef } from './components/VideoAvatar';
import ChatInterface from './components/ChatInterface';
import AuthScreen from './components/AuthScreen';
import WeatherPanel from './components/tools/WeatherPanel';
import DivinationPanel from './components/tools/DivinationPanel';
import HealthPanel from './components/tools/HealthPanel';
import TodoPanel from './components/tools/TodoPanel';
import SkillsPanel from './components/tools/SkillsPanel';
// import VoicePanel from './components/tools/VoicePanel'; // 已移除音色选择功能
import WatchaPanel from './components/tools/WatchaPanel';
import { createCustomConfig } from './config/characterConfig';
import { api, authApi, chatApi, categoryApi, healthApi, todoApi, weatherApi, ttsApi } from './services/api';
import { decodeAudioData, playAudioBuffer } from './services/audioService';
import { CloudSun, Sparkles, Mic2, Activity, CheckSquare, Zap, ChevronUp, ChevronDown, LogOut } from 'lucide-react';

// Panel Types - 统一管理，所有面板都在右侧显示
type ActivePanelType = 'none' | 'weather' | 'fortune' | 'health' | 'todo' | 'skills' | 'watcha';

// 用户信息类型
interface UserProfile {
  id: string;
  username: string;
  name: string;
  gender?: string;
  identity?: string;
  expectations?: string;
}

const App: React.FC = () => {
  // --- 认证状态 ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Panel States - 统一管理
  const [activePanel, setActivePanel] = useState<ActivePanelType>('none');
  
  // Voice State - 固定使用 Korean_ThoughtfulWoman
  const currentVoiceId = 'Korean_ThoughtfulWoman';
  
  // Micro-interaction State
  const [hasNewTodo, setHasNewTodo] = useState(false);
  
  // 响应式屏幕大小检测
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [state, setState] = useState<AssistantState>(AssistantState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  
  // Data States
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Health Data State
  const [healthData, setHealthData] = useState<{
      water: WaterRecord;
      calories: CalorieRecord;
      sleep: SleepRecord;
      exercise: ExerciseRecord;
  }>({
      water: { current: 0, goal: 2000, history: [] },
      calories: { current: 0, goal: 2200, macros: { protein: 0, carbs: 0, fat: 0 }, history: [] },
      sleep: { current: 0, goal: 8, history: [] },
      exercise: { current: 0, goal: 60, history: [] }
  });

  // Mock Data
  const [tarot, setTarot] = useState<TarotResult | undefined>(undefined);

  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const weatherFetchedRef = useRef<boolean>(false);
  const videoAvatarRef = useRef<VideoAvatarRef>(null);

  // --- 检查认证状态 ---
  useEffect(() => {
    const checkAuth = async () => {
      if (authApi.isAuthenticated()) {
        const storedUser = authApi.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          // 加载用户数据
          loadUserData();
        } else {
          // Token 存在但没有用户信息，尝试获取
          const result = await authApi.getProfile();
          if (result.success && result.data) {
            setUser(result.data);
            loadUserData();
          }
        }
      }
      setAuthChecked(true);
    };
    checkAuth();

    // 监听未授权事件
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // --- 加载用户数据 ---
  const loadUserData = async () => {
    // 加载分类
    const categoriesResult = await categoryApi.getList();
    if (categoriesResult.success && categoriesResult.data) {
      setCategories(categoriesResult.data);
    }

    // 加载待办（包括已完成的）
    const todosResult = await todoApi.getList(true);
    if (todosResult.success && todosResult.data) {
      setTodos(todosResult.data);
    }

    // 加载健康数据
    const healthResult = await healthApi.getSummary();
    if (healthResult.success && healthResult.data) {
      setHealthData({
        water: healthResult.data.water,
        calories: {
          ...healthResult.data.calories,
          // 确保 macros 字段存在，后端暂时没有提供这个数据
          macros: healthResult.data.calories.macros || { protein: 0, carbs: 0, fat: 0 }
        },
        sleep: healthResult.data.sleep,
        exercise: healthResult.data.exercise
      });
    }
  };

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
      // 使用后端 TTS API
      const audioBufferData = await ttsApi.synthesize(text, currentVoiceId);
      
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
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN'; 
        utterance.onend = () => setState(AssistantState.IDLE);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error('[TTS] Error:', e);
      setState(AssistantState.IDLE);
    }
  };

  // --- 发送消息到后端 ---
  const processInput = async (text: string) => {
    addMessage('user', text);
    setState(AssistantState.THINKING);

    try {
      const result = await chatApi.sendMessage(text);
      
      if (result.success && result.data) {
        const { content, actions } = result.data;
        
        // 处理后端返回的动作
        for (const action of actions) {
          switch (action.type) {
            case 'openPanel':
              setActivePanel(action.data as ActivePanelType);
              break;
            case 'setWeather':
              setWeather(action.data);
              setActivePanel('weather');
              break;
            case 'setTarot':
              setTarot(action.data);
              setActivePanel('fortune');
              break;
            case 'updateHealth':
              if (action.data.water) {
        setHealthData(prev => ({
          ...prev,
                  water: { ...prev.water, current: action.data.water.current }
                }));
              }
              break;
          }
        }

        // 如果有待办相关操作，刷新待办列表
        if (actions.some(a => a.type === 'openPanel' && a.data === 'todo')) {
          const todosResult = await todoApi.getList(true);
          if (todosResult.success && todosResult.data) {
            setTodos(todosResult.data);
            setHasNewTodo(true);
            setTimeout(() => setHasNewTodo(false), 2000);
          }
        }

        addMessage('assistant', content);
        setState(AssistantState.SPEAKING);
        await speak(content);
      } else {
        const errorMsg = result.error || '抱歉，时间线出了点小波动~';
        addMessage('assistant', errorMsg);
        setState(AssistantState.IDLE);
      }
    } catch (error) {
      console.error('[Chat] Error:', error);
      addMessage('assistant', '网络连接不稳定，请稍后再试~');
      setState(AssistantState.IDLE);
    }
  };

  // 已移除音色选择功能

  const handleAddWater = async () => {
    const result = await healthApi.addWater(250);
    if (result.success && result.data) {
      setHealthData(prev => ({
          ...prev,
        water: { ...prev.water, current: result.data.current }
      }));
      speak("咕嘟咕嘟，补充水分啦！");
      setState(AssistantState.SPEAKING);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setMessages([]);
    setTodos([]);
  };

  // --- 获取天气 ---
  useEffect(() => {
    if (!user || weatherFetchedRef.current) return;
     weatherFetchedRef.current = true;

     const fetchWeather = async () => {
      // 尝试使用浏览器定位
         if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
                 async (position) => {
                     const { latitude, longitude } = position.coords;
            const result = await weatherApi.getByLocation(latitude, longitude);
            if (result.success && result.data) {
              setWeather(result.data);
            }
                 }, 
          async () => {
            // 定位失败，使用自动获取
            const result = await weatherApi.getAuto();
            if (result.success && result.data) {
              setWeather(result.data);
            }
                 }
             );
         } else {
        const result = await weatherApi.getAuto();
        if (result.success && result.data) {
          setWeather(result.data);
        }
         }
     };
     fetchWeather();
  }, [user]);

  // --- 语音识别设置 ---
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

  // 缓存视频人物配置
  const characterConfig = useMemo(() => createCustomConfig(), []);

  // --- 监听屏幕大小变化 ---
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // --- 面板联动逻辑 ---
  useEffect(() => {
    if (!videoAvatarRef.current) return;

    if (activePanel !== 'none') {
      videoAvatarRef.current.focusRight();
    } else {
      videoAvatarRef.current.focusCenter();
    }
  }, [activePanel]);

  // --- 语音状态联动 ---
  useEffect(() => {
    if (!videoAvatarRef.current) return;

    if (state === AssistantState.SPEAKING) {
      videoAvatarRef.current.playAction('speaking');
    } else if (state === AssistantState.THINKING) {
      videoAvatarRef.current.playAction('thinking');
    }
  }, [state]);

  // --- 登录成功回调 ---
  const handleAuthSuccess = (userData: UserProfile) => {
    setUser(userData);
    loadUserData();
    // 欢迎消息
    const intro = `嗨！${userData.name}，很高兴遇见你！我是叉叉，来自2045年的你亲手创造的AI助手～让我们一起把生活整理得井井有条吧！`;
    addMessage('assistant', intro);
    speak(intro);
  };

  // --- 等待认证检查完成 ---
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <div className="animate-pulse text-[#8b7b6d]">加载中...</div>
      </div>
    );
  }

  // --- 未登录显示登录页面 ---
  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // 判断是否有面板打开
  const hasPanelOpen = activePanel !== 'none';

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
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fdfcf8]/30 pointer-events-none"></div>

        {/* 用户信息和登出按钮 */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <span className="text-sm text-[#8b7b6d]">
            你好，{user.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/60 hover:bg-white/80 transition-all"
            title="登出"
          >
            <LogOut size={18} className="text-[#8b7b6d]" />
          </button>
        </div>

        {/* === 主布局容器 === */}
        <div className="relative h-full w-full flex">
          
          {/* --- 左侧工具栏区域 --- */}
          <div className="flex-shrink-0 flex items-center justify-center z-30 w-16 sm:w-20 md:w-24 transition-all duration-500">
            <ScrollableToolbar 
              activePanel={activePanel} 
              setActivePanel={setActivePanel} 
              hasNewTodo={hasNewTodo} 
              videoAvatarRef={videoAvatarRef} 
            />
          </div>

          {/* --- 中间区域：叉叉 + 对话框 --- */}
          <div className={`
            flex flex-col items-center justify-center relative z-10
            transition-all duration-500 ease-out
            ${hasPanelOpen ? 'flex-[0.55] min-w-0' : 'flex-1'}
          `}>
            {/* Speech Bubble */}
            <div className="w-full max-w-sm md:max-w-md lg:max-w-lg h-20 md:h-28 flex items-end justify-center mb-2 px-4 pointer-events-none">
                {state === AssistantState.SPEAKING && latestResponse && (
                <div className="bg-white/90 backdrop-blur-md border border-purple-100 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl rounded-bl-none shadow-xl text-xs sm:text-sm md:text-base font-medium text-gray-700 animate-fade-in-up relative max-w-full text-center">
                        {latestResponse}
                  <div className="absolute -bottom-2 left-4 md:left-6 w-3 md:w-4 h-3 md:h-4 bg-white/90 border-b border-r border-purple-100 transform rotate-45"></div>
                    </div>
                )}
             </div>

            {/* Character */}
            <div 
              className={`
                w-full flex items-center justify-center relative pointer-events-auto 
                transition-all duration-500 ease-out
                h-[40vh] sm:h-[45vh] md:h-[55vh] lg:h-[60vh]
                mt-16 sm:mt-18 md:mt-20 lg:mt-24
                ${hasPanelOpen ? 'max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg' : 'max-w-sm md:max-w-md lg:max-w-lg'}
              `}
              style={{
                transform: hasPanelOpen 
                  ? (isSmallScreen ? 'scale(1.375)' : 'scale(1.265)') 
                  : (isSmallScreen ? 'scale(1.25)' : 'scale(1.15)'),
                transformOrigin: 'center bottom'
              }}
            >
                  <VideoAvatar 
                    ref={videoAvatarRef}
                    config={characterConfig}
                    className="h-full w-full"
                    autoPlay={true}
                debug={false}
                    onStateChange={(event) => {
                  console.log('[App] Character state:', event.currentState);
                    }}
                  />
        </div>

            {/* Chat Interface */}
            <div className={`
              w-full mt-auto px-3 md:px-4 pb-4 md:pb-6
              ${hasPanelOpen ? 'max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl' : 'max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl'}
            `}>
              <ChatInterface 
                messages={messages}
                isListening={isListening}
                onSendMessage={processInput}
                onToggleListening={toggleListening}
                inputRef={inputRef}
              />
            </div>
            </div>

          {/* --- 右侧面板区域 --- */}
          <div className={`
            flex items-center justify-start z-30 pr-3 sm:pr-4 md:pr-6
            transition-all duration-500 ease-out overflow-hidden
            ${hasPanelOpen 
              ? 'flex-[0.45] min-w-0 opacity-100' 
              : 'w-0 flex-none opacity-0 pointer-events-none'
            }
          `}>
            {hasPanelOpen && (
              <div className="w-full h-[88vh] max-h-[750px] animate-slide-in-right">
                <div className="h-full rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-hidden glass-panel-strong border border-white/50">
                  {activePanel === 'weather' && (
                             weather ? <WeatherPanel weather={weather} /> 
                             : <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full gap-2">
                                 <span>正在校准时间线...</span>
                               </div>
                        )}
                  {activePanel === 'health' && (
                            <HealthPanel 
                                {...healthData}
                                onAddWater={handleAddWater}
                            />
                        )}
                  {activePanel === 'fortune' && <DivinationPanel result={tarot} />}
                  {activePanel === 'todo' && (
                    <TodoPanel 
                      categories={categories}
                      todos={todos} 
                      onToggle={async (id) => {
                        await todoApi.toggle(id);
                        const result = await todoApi.getList(true); // 获取包括已完成的
                        if (result.success && result.data) {
                          setTodos(result.data);
                        }
                    }}
                      onAddTodo={async (todo) => {
                        const result = await todoApi.create(todo);
                        if (result.success) {
                          const listResult = await todoApi.getList(true);
                          if (listResult.success && listResult.data) {
                            setTodos(listResult.data);
                          }
                        }
                      }}
                      onDelete={async (id) => {
                        await todoApi.delete(id);
                        const result = await todoApi.getList(true);
                        if (result.success && result.data) {
                          setTodos(result.data);
                        }
                      }}
                            />
                        )}
                  {activePanel === 'skills' && <SkillsPanel />}
                  {activePanel === 'watcha' && <WatchaPanel />}
                    </div>
                </div>
            )}
          </div>
        </div>
    </div>
  );
};

// Scrollable Toolbar Component
const ScrollableToolbar = ({ 
  activePanel, 
  setActivePanel, 
  hasNewTodo,
  videoAvatarRef 
}: { 
  activePanel: ActivePanelType;
  setActivePanel: (panel: ActivePanelType) => void;
  hasNewTodo: boolean;
  videoAvatarRef: React.RefObject<VideoAvatarRef | null>;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toolRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowTopFade(scrollTop > 5);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - 5);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    return () => container.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    if (activePanel === 'none') return;
    
    const container = scrollContainerRef.current;
    const toolElement = toolRefs.current.get(activePanel);
    
    if (container && toolElement) {
      const containerRect = container.getBoundingClientRect();
      const toolRect = toolElement.getBoundingClientRect();
      
      const isAbove = toolRect.top < containerRect.top;
      const isBelow = toolRect.bottom > containerRect.bottom;
      
      if (isAbove || isBelow) {
        const scrollTarget = toolElement.offsetTop - container.clientHeight / 2 + toolElement.clientHeight / 2;
        container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
      }
    }
  }, [activePanel]);

  const scrollUp = () => {
    scrollContainerRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  };

  const scrollDown = () => {
    scrollContainerRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
  };

  const togglePanel = (panel: ActivePanelType) => {
    const newState = activePanel === panel ? 'none' : panel;
    setActivePanel(newState);
    
    if (panel === 'todo' && newState === 'todo') {
      videoAvatarRef.current?.playAction('wave');
    }
  };

  const tools = [
    { id: 'health' as const, icon: <Activity size={22} />, label: '健康' },
    { id: 'weather' as const, icon: <CloudSun size={22} />, label: '天气' },
    { id: 'fortune' as const, icon: <Sparkles size={22} />, label: '占卜' },
    { id: 'todo' as const, icon: <CheckSquare size={22} />, label: '待办', notification: hasNewTodo },
    { id: 'skills' as const, icon: <Zap size={22} />, label: '技能' },
    { id: 'watcha' as const, icon: <img src="/watcha.svg" alt="Watcha" className="w-5 h-5" style={{ filter: activePanel === 'watcha' ? 'none' : 'opacity(0.6)' }} />, label: 'Watcha' },
  ];

  return (
    <div className="relative flex flex-col items-center h-full max-h-[85vh]">
      {/* Top Scroll Button */}
      <div 
        className={`flex-shrink-0 mb-1 sm:mb-2 transition-all duration-300 ${
          showTopFade ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 mb-0'
        }`}
      >
        <button
          onClick={scrollUp}
          className="p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 group"
          aria-label="向上滚动"
        >
          <ChevronUp size={14} className="sm:w-4 sm:h-4 text-[#8b7b6d] group-hover:text-[#5c4d43] transition-colors" />
        </button>
      </div>

      {/* Scrollable Tools Container */}
      <div 
        ref={scrollContainerRef}
        className="flex flex-col gap-1 sm:gap-2 flex-1 overflow-y-auto no-scrollbar py-1"
      >
        {tools.map((tool) => (
          <div 
            key={tool.id} 
            ref={(el) => { if (el) toolRefs.current.set(tool.id, el); }}
          >
            <ToolbarIcon
              icon={tool.icon}
              active={activePanel === tool.id}
              onClick={() => togglePanel(tool.id)}
              label={tool.label}
              notification={tool.notification}
            />
          </div>
        ))}
        </div>
        
      {/* Bottom Scroll Button */}
      <div 
        className={`flex-shrink-0 mt-1 sm:mt-2 transition-all duration-300 ${
          showBottomFade ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 mt-0'
        }`}
      >
        <button
          onClick={scrollDown}
          className="p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 group"
          aria-label="向下滚动"
        >
          <ChevronDown size={14} className="sm:w-4 sm:h-4 text-[#8b7b6d] group-hover:text-[#5c4d43] transition-colors" />
        </button>
      </div>
    </div>
  );
};

// Toolbar Icon Component
const ToolbarIcon = ({ icon, active, onClick, label, notification }: { 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void, 
  label: string, 
  notification?: boolean
}) => (
    <div className="relative group flex flex-col items-center">
        <button 
            onClick={onClick}
            className={`
              toolbar-btn flex items-center justify-center transition-all duration-300
              w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
              rounded-xl sm:rounded-2xl
              ${active ? 'active bg-white/90 shadow-lg scale-105' : 'hover:bg-white/60'}
              ${notification ? 'animate-shake' : ''}
            `}
        >
            <span className="scale-75 sm:scale-90 md:scale-100">
            {icon}
            </span>
            {notification && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-[#f5f0e8] shadow-sm animate-pulse"></span>
            )}
        </button>
        <span className={`
          toolbar-label mt-0.5 sm:mt-1 font-medium transition-colors
          text-[10px] sm:text-xs
          ${active ? 'text-[#5c4d43]' : 'text-[#a89b8c]'}
        `}>
            {label}
        </span>
    </div>
);

export default App;
