
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AssistantState, Message, TodoItem, TodoCategory, WeatherData, TarotResult, WaterRecord, CalorieRecord, SleepRecord, ExerciseRecord, AffinityData, AffinityEvent } from './types';
import VideoAvatar, { VideoAvatarRef } from './components/VideoAvatar';
import ChatInterface from './components/ChatInterface';
import NicknameSetup from './components/NicknameSetup';
import WeatherPanel from './components/tools/WeatherPanel';
import DivinationPanel from './components/tools/DivinationPanel';
import HealthPanel from './components/tools/HealthPanel';
import TodoPanel from './components/tools/TodoPanel';
import SkillsPanel from './components/tools/SkillsPanel';
import AnimationPanel from './components/tools/AnimationPanel';
import MemoryPanel from './components/tools/MemoryPanel';
// import VoicePanel from './components/tools/VoicePanel'; // 已移除音色选择功能
import WatchaPanel from './components/tools/WatchaPanel';
import AffinityIndicator from './components/AffinityIndicator';
import AffinityToast from './components/AffinityToast';
import AffinityDetailPanel from './components/AffinityDetailPanel';
import FloatingAffinityHint from './components/FloatingAffinityHint';
import { createEmotionalConfig } from './config/characterConfig';
import { api, authApi, chatApi, categoryApi, healthApi, todoApi, weatherApi, ttsApi, emotionApi } from './services/api';
import { decodeAudioData, playAudioBuffer } from './services/audioService';
import { loadAffinityData, updateAffinity, getAffinityLevel, saveAffinityData } from './services/affinityService';
// 记忆功能已由后端AI自动处理，前端不再主动生成记忆
import { CloudSun, Sparkles, Mic2, Activity, CheckSquare, Zap, ChevronUp, ChevronDown, LogOut, Film, Brain, Music, VolumeX } from 'lucide-react';

// Panel Types - 统一管理，所有面板都在右侧显示
type ActivePanelType = 'none' | 'bgm' | 'weather' | 'fortune' | 'health' | 'todo' | 'skills' | 'memory' | 'watcha' | 'animation' | 'affinity';

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
  const [needsNickname, setNeedsNickname] = useState(false);
  
  // Panel States - 统一管理
  const [activePanel, setActivePanel] = useState<ActivePanelType>('none');
  
  // Voice State - 固定使用 Korean_ThoughtfulWoman
  const currentVoiceId = 'Korean_ThoughtfulWoman';

  // 动作语音文本映射（不超过10个字，具有互动性）
  const actionVoiceMap: Record<string, string> = {
    // 待机动作
    'idle_alt': '我在等你呢',
    'idle_1': '随时为你服务',
    'idle_3': '我准备好啦',
    'listening_v2': '我在认真听你说',
    
    // 正面情绪
    'happy': '和你在一起好开心',
    'excited': '太棒了',
    'jump': '好开心呀',
    'wave': '你好呀',
    'nod': '我同意你的想法',
    
    // 负面情绪
    'crying': '需要你安慰我',
    'shy': '有点不好意思',
    'scared': '我好害怕',
    'angry': '你惹我生气了',
    'angry_cross': '我真的很生气',
    'rage': '气死我了',
    'disapprove': '我不认可这个',
    'shouting': '你听到了吗',
    
    // 活动状态
    'sleeping': '我要去睡觉了',
    'singing': '为你唱首歌',
    'listening': '音乐真好听',
    'listening_music': '一起听音乐吧',
    'phone': '让我看看手机',
    'check_phone': '看看有什么消息',
    'notes': '让我记下来',
    
    // 交互动作
    'speaking': '我想对你说',
    'thinking': '让我想想',
  };
  
  // Micro-interaction State
  const [hasNewTodo, setHasNewTodo] = useState(false);
  
  // 响应式屏幕大小检测
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

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

  // 好感度系统
  const [affinity, setAffinity] = useState<AffinityData>({
    value: 50,
    level: 'v1',
    lastInteraction: Date.now(),
    totalInteractions: 0,
    history: [],
  });
  const lastDailyChatRef = useRef<string>(''); // 记录上次每日首次对话的日期
  const [affinityToast, setAffinityToast] = useState<AffinityEvent | null>(null); // 好感度变化提示
  const [floatingHints, setFloatingHints] = useState<Array<{ id: string; event: AffinityEvent; side: 'left' | 'right'; offset: number }>>([]); // 浮动提示列表
  
  // 从后端加载好感度数据
  useEffect(() => {
    if (user) {
      loadAffinityData().then(data => {
        setAffinity(data);
      });
    }
  }, [user]);

  // 显示好感度变化提示的辅助函数
  const showAffinityChange = (event: AffinityEvent) => {
    // 显示Toast提示
    setAffinityToast(event);
    
    // 添加浮动提示（随机左右侧和位置）
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const offset = Math.random() * 30; // 0-30%的随机偏移
    const id = `hint-${Date.now()}-${Math.random()}`;
    
    setFloatingHints(prev => [...prev, { id, event, side, offset }]);
    
    // 3.5秒后自动移除（动画3秒 + 0.5秒缓冲）
    setTimeout(() => {
      setFloatingHints(prev => prev.filter(h => h.id !== id));
    }, 3500);
  };

  const applyAffinityChange = async (actionType: Parameters<typeof updateAffinity>[0]) => {
    const { data: newAffinity, emotion } = await updateAffinity(actionType);
    setAffinity(newAffinity);
    if (newAffinity.history.length > 0) {
      const lastEvent = newAffinity.history[newAffinity.history.length - 1];
      showAffinityChange(lastEvent);
    }
    if (emotion && videoAvatarRef.current) {
      videoAvatarRef.current.playAction(emotion);
    }
    // 记忆由后端AI自动生成
  };

  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null); // 当前播放的音频源
  const inputRef = useRef<HTMLInputElement>(null);
  const weatherFetchedRef = useRef<boolean>(false);
  const videoAvatarRef = useRef<VideoAvatarRef>(null);
  const videoErrorCountRef = useRef<number>(0);
  const clickCountRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // BGM 播放状态
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);

  // 初始化 BGM
  useEffect(() => {
    if (!bgmAudioRef.current) {
      const audio = new Audio('/bgm/Nintendo Sound Team - Welcome Horizons.mp3');
      audio.loop = true;
      audio.volume = 0.15; // 设置音量为15%
      bgmAudioRef.current = audio;
    }

    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, []);

  // 音量淡入淡出函数
  const fadeVolume = useCallback((targetVolume: number, duration: number = 500) => {
    const audio = bgmAudioRef.current;
    if (!audio) return;

    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 20;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
      } else {
        audio.volume = startVolume + (volumeDiff * currentStep / steps);
      }
    }, stepDuration);
  }, []);

  // 监听叉叉说话状态，自动调整 BGM 音量
  useEffect(() => {
    if (!isBgmPlaying) return;

    if (state === AssistantState.SPEAKING) {
      // 叉叉开始说话，降低音量到 5%
      fadeVolume(0.05, 300);
    } else {
      // 叉叉说话结束，恢复音量到 15%
      fadeVolume(0.15, 500);
    }
  }, [state, isBgmPlaying, fadeVolume]);

  // 切换 BGM 播放状态
  const toggleBgm = useCallback(() => {
    if (!bgmAudioRef.current) return;

    if (isBgmPlaying) {
      bgmAudioRef.current.pause();
      setIsBgmPlaying(false);
    } else {
      bgmAudioRef.current.play().catch((err) => {
        console.error('BGM 播放失败:', err);
      });
      setIsBgmPlaying(true);
    }
  }, [isBgmPlaying]);

  // 点击叉叉的互动
  const handleAvatarClick = useCallback(async () => {
    const now = Date.now();
    
    // 重置点击计数（如果距离上次点击超过5秒）
    if (now - lastClickTimeRef.current > 5000) {
      clickCountRef.current = 0;
    }
    
    lastClickTimeRef.current = now;
    clickCountRef.current += 1;
    
    // 根据点击次数选择不同的动画和语音
    const interactionMap = [
      { animation: 'happy', text: '嗨嗨，我在这儿呢' },
      { animation: 'wave', text: '怎么啦' },
      { animation: 'excited', text: '有什么想聊的吗' },
      { animation: 'jump', text: '我超开心的' },
      { animation: 'shy', text: '别一直戳我啦' },
      { animation: 'disapprove', text: '够了够了，我很忙的' },
    ];
    
    const index = Math.min(clickCountRef.current - 1, interactionMap.length - 1);
    const interaction = interactionMap[index];
    
    // 播放动画
    if (videoAvatarRef.current) {
      videoAvatarRef.current.playAction(interaction.animation);
      videoAvatarRef.current.resetActivityTimer();
    }
    
    // 播放语音
    try {
      if (audioContextRef.current) {
        const audioData = await api.tts.synthesize(interaction.text);
        if (audioData) {
          const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
          playAudioBuffer(audioBuffer, audioContextRef.current);
        }
      }
    } catch (err) {
      console.error('点击互动 TTS 失败:', err);
    }
  }, []);

  // --- 检查认证状态 ---
  useEffect(() => {
    const checkAuth = async () => {
      // 使用快速登录（基于设备ID）
      const result = await authApi.quickLogin();
      
      if (result.success && result.data) {
        setUser(result.data.user);
        
        // 检查是否需要设置昵称
        if (result.data.needsNickname) {
          setNeedsNickname(true);
        } else {
          // 加载用户数据
          loadUserData();
        }
      }
      setAuthChecked(true);
    };
    checkAuth();

    // 监听未授权事件
    const handleUnauthorized = async () => {
      // 重新尝试快速登录
      const result = await authApi.quickLogin();
      if (result.success && result.data) {
        setUser(result.data.user);
        if (result.data.needsNickname) {
          setNeedsNickname(true);
        }
      }
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

  // 停止当前播放的音频
  const stopCurrentAudio = useCallback(() => {
    // 停止 Web Audio API 音频
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
      } catch (e) {
        // 忽略已经停止的音频源错误
      }
      currentAudioSourceRef.current = null;
    }
    // 停止浏览器原生 TTS
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = async (text: string) => {
    try {
      // 先停止之前正在播放的音频（打断功能）
      stopCurrentAudio();
      
      // 使用后端 TTS API
      const audioBufferData = await ttsApi.synthesize(text, currentVoiceId);
      
      if (audioBufferData) {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const buffer = await decodeAudioData(audioBufferData, ctx);
        const source = playAudioBuffer(buffer, ctx, () => {
            currentAudioSourceRef.current = null;
            setState(AssistantState.IDLE);
        });
        // 保存当前音频源引用，以便后续可以停止
        currentAudioSourceRef.current = source;
      } else {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN'; 
        utterance.onend = () => setState(AssistantState.IDLE);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      currentAudioSourceRef.current = null;
      setState(AssistantState.IDLE);
    }
  };

  // --- 发送消息到后端 ---
  const processInput = async (text: string) => {
    // 立即停止当前正在播放的音频（用户打断）
    stopCurrentAudio();
    
    addMessage('user', text);
    setState(AssistantState.THINKING);
    
    // 重置活动计时器（用户有交互）
    videoAvatarRef.current?.playAction('listening_v2');

    const today = new Date().toDateString();
    if (lastDailyChatRef.current !== today) {
      lastDailyChatRef.current = today;
      await applyAffinityChange('daily_chat');
    }

    try {
      // 并行请求：发送消息 + 检测情绪
      const [chatResult, emotionResult] = await Promise.all([
        chatApi.sendMessage(text),
        emotionApi.detect(text)
      ]);
      
      if (chatResult.success && chatResult.data) {
        const { content, actions } = chatResult.data;
        
        // 处理后端返回的动作
        for (const action of actions) {
          switch (action.type) {
            case 'openPanel':
              setActivePanel(action.data as ActivePanelType);
              break;
            case 'setWeather':
              setWeather(action.data);
              setActivePanel('weather');
              await applyAffinityChange('weather_check');
              break;
            case 'setTarot':
              setTarot(action.data);
              setActivePanel('fortune');
              await applyAffinityChange('fortune_draw');
              break;
            case 'updateHealth':
              if (action.data.water) {
                setHealthData(prev => ({
                  ...prev,
                  water: { ...prev.water, current: action.data.water.current }
                }));
                await applyAffinityChange('health_water');
              }
              break;
            default:
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
        
        // 记忆由后端AI自动生成，无需前端处理
        
        // 根据情绪检测结果播放对应动画
        if (emotionResult.success && emotionResult.data) {
          const { action: emotionAction } = emotionResult.data;
          // 如果是正面或负面情绪，播放对应动画；否则播放说话动画
          if (emotionAction && emotionAction !== 'listening_v2' && emotionAction !== 'nod') {
            videoAvatarRef.current?.playAction(emotionAction);
          } else {
            videoAvatarRef.current?.playAction('speaking');
          }
        } else {
          // 默认播放说话动画
          videoAvatarRef.current?.playAction('speaking');
        }
        
        await speak(content);
      } else {
        const errorMsg = chatResult.error || '抱歉，时间线出了点小波动~';
        addMessage('assistant', errorMsg);
        videoAvatarRef.current?.playAction('shy'); // 出错时播放害羞动画
        setState(AssistantState.IDLE);
      }
    } catch (error) {
      console.error('[Chat] Error:', error);
      addMessage('assistant', '网络连接不稳定，请稍后再试~');
      videoAvatarRef.current?.playAction('scared'); // 网络错误时播放害怕动画
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
      await applyAffinityChange('health_water');
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

  // --- 语音识别设置（使用后端 API）---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionActiveRef = useRef(false);

  const startListening = useCallback(async () => {
    if (recognitionActiveRef.current) {
      return;
    }

    try {
      console.log('[Voice] 请求麦克风权限...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('[Voice] ✅ 开始录音');
      recognitionActiveRef.current = true;
      setIsListening(true);
      setState(AssistantState.LISTENING);
      
      audioChunksRef.current = [];
      
      // 使用 MediaRecorder 录音
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('[Voice] 录音结束，处理音频...');
        recognitionActiveRef.current = false;
        setIsListening(false);
        setState((prev) => prev === AssistantState.LISTENING ? AssistantState.IDLE : prev);
        
        // 停止音频流
        stream.getTracks().forEach(track => track.stop());
        
        // 合并音频数据
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('[Voice] 音频大小:', (audioBlob.size / 1024).toFixed(2), 'KB');
        
        if (audioBlob.size < 1000) {
          console.warn('[Voice] ⚠️ 录音时间太短');
          return;
        }
        
        // 发送到后端识别
        try {
          console.log('[Voice] 发送到后端识别...');
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch('http://localhost:3001/api/speech-to-text', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          if (!response.ok) {
            throw new Error('识别失败');
          }
          
          const data = await response.json();
          const text = data.text?.trim();
          
          if (text && inputRef.current) {
            const currentValue = inputRef.current.value || '';
            const newValue = currentValue ? `${currentValue} ${text}` : text;
            inputRef.current.value = newValue;
            console.log('[Voice] ✅ 识别结果:', text);
            inputRef.current.focus();
          } else {
            console.warn('[Voice] ⚠️ 未识别到文字');
          }
        } catch (error) {
          console.error('[Voice] 识别错误:', error);
        }
      };
      
      mediaRecorder.start();
      console.log('[Voice] 录音中...');
      
    } catch (error: any) {
      console.error('[Voice] 启动失败:', error);
      recognitionActiveRef.current = false;
      setIsListening(false);
      setState((prev) => prev === AssistantState.LISTENING ? AssistantState.IDLE : prev);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && recognitionActiveRef.current) {
      console.log('[Voice] 停止录音');
      mediaRecorderRef.current.stop();
    }
  }, []);

  // 缓存视频人物配置（避免每次渲染都重新创建）
  // 使用带有情绪动作的配置，支持好感度系统
  const characterConfig = useMemo(() => createEmotionalConfig(), []);

  // --- 监听屏幕大小变化 ---
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // 手机端
      setIsSmallScreen(width < 768); // 小屏幕（平板竖屏）
      setIsLargeScreen(width >= 1280); // 大屏幕
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // --- 视频错误恢复机制 ---
  useEffect(() => {
    const errorTimestamps = new Map<HTMLVideoElement, number[]>();
    
    const handleVideoError = (event: Event) => {
      const target = event.target as HTMLVideoElement;
      if (target && target.tagName === 'VIDEO') {
        const now = Date.now();
        
        // 获取此视频元素的错误时间戳列表
        if (!errorTimestamps.has(target)) {
          errorTimestamps.set(target, []);
        }
        const timestamps = errorTimestamps.get(target)!;
        
        // 清理10秒前的错误记录
        const recentTimestamps = timestamps.filter(t => now - t < 10000);
        recentTimestamps.push(now);
        errorTimestamps.set(target, recentTimestamps);
        
        videoErrorCountRef.current += 1;
        console.error('[App] Video error detected, count:', videoErrorCountRef.current, 'recent errors:', recentTimestamps.length);
        
        // 如果10秒内错误次数超过3次，说明是同一个视频反复失败，停止重试
        if (recentTimestamps.length > 3) {
          console.error('[App] Same video failed multiple times, stopping retry');
          return;
        }
        
        // 如果总错误次数不超过3次，尝试重新加载
        if (videoErrorCountRef.current <= 3) {
          console.warn('[App] Attempting to recover from video error...');
          // 不要重新加载，让状态机处理回退
        } else {
          console.error('[App] Too many video errors, please refresh the page');
        }
      }
    };

    // 重置错误计数器（每分钟）
    const resetErrorCount = setInterval(() => {
      if (videoErrorCountRef.current > 0) {
        console.log('[App] Resetting video error count');
        videoErrorCountRef.current = 0;
        errorTimestamps.clear();
      }
    }, 60000);

    // 全局监听video错误（使用捕获阶段）
    document.addEventListener('error', handleVideoError, true);

    return () => {
      document.removeEventListener('error', handleVideoError, true);
      clearInterval(resetErrorCount);
    };
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
  // 注意：speaking 动画现在由 processInput 中根据情绪检测结果控制
  // 这里只处理 thinking 状态
  useEffect(() => {
    if (!videoAvatarRef.current) return;

    if (state === AssistantState.THINKING) {
      videoAvatarRef.current.playAction('thinking');
    }
  }, [state]);

  // --- 昵称设置完成回调 ---
  const handleNicknameComplete = (nickname: string) => {
    // 更新用户信息
    setUser(prev => prev ? { ...prev, name: nickname } : null);
    setNeedsNickname(false);
    // 加载用户数据
    loadUserData();
    // 欢迎消息
    const intro = `欢迎来到我的小小空间～我是叉叉，你的AI助手～让我们一起把生活整理得井井有条吧！`;
    addMessage('assistant', intro);
    speak(intro);
    videoAvatarRef.current?.playAction('wave');
  };

  // --- 等待认证检查完成 ---
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <div className="animate-pulse text-[#8b7b6d]">加载中...</div>
      </div>
    );
  }

  // --- 需要设置昵称 ---
  if (needsNickname) {
    return <NicknameSetup onComplete={handleNicknameComplete} />;
  }

  // --- 用户未正常加载（极端情况）---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-[#8b7b6d] mb-4">连接中...</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 判断是否有面板打开
  const hasPanelOpen = activePanel !== 'none';

  // 渲染面板内容（避免代码重复）
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'weather':
        return weather ? <WeatherPanel weather={weather} /> 
          : <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full gap-2">
              <span>正在校准时间线...</span>
            </div>;
      case 'health':
        return <HealthPanel {...healthData} onAddWater={handleAddWater} />;
      case 'fortune':
        return <DivinationPanel result={tarot} />;
      case 'todo':
        return (
          <TodoPanel 
            categories={categories}
            todos={todos} 
            onToggle={async (id) => {
              const previousTodo = todos.find(todo => todo.id === id);
              await todoApi.toggle(id);
              const result = await todoApi.getList(true);
              if (result.success && result.data) {
                setTodos(result.data);
                const updatedTodo = result.data.find(todo => todo.id === id);
                if (previousTodo && updatedTodo && !previousTodo.completed && updatedTodo.completed) {
                  await applyAffinityChange('todo_complete');
                }
              }
            }}
            onAddTodo={async (todo) => {
              const result = await todoApi.create(todo);
              if (result.success) {
                const listResult = await todoApi.getList(true);
                if (listResult.success && listResult.data) {
                  setTodos(listResult.data);
                }
                await applyAffinityChange('todo_add');
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
        );
      case 'skills':
        return <SkillsPanel />;
      case 'watcha':
        return <WatchaPanel />;
      case 'animation':
        return (
          <AnimationPanel 
            onPlayAnimation={(actionName) => {
              videoAvatarRef.current?.playAction(actionName);
              const voiceText = actionVoiceMap[actionName];
              if (voiceText) {
                speak(voiceText);
              }
            }}
            affinity={affinity}
          />
        );
      case 'memory':
        return <MemoryPanel onClose={() => setActivePanel('none')} />;
      case 'affinity':
        return <AffinityDetailPanel affinity={affinity} onClose={() => setActivePanel('none')} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-[#fdfcf8] text-[#5c4d43] font-sans overflow-hidden selection:bg-[#e6dec8]"
      style={{ height: '100dvh', width: '100vw' }}
    >
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

        {/* Logo - 左上角 */}
        <div className="absolute top-4 left-4 sm:left-6 z-50">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#5c4d43] tracking-wide" style={{ fontFamily: "'Ma Shan Zheng', 'Zhi Mang Xing', cursive" }}>
            叉叉的空间
          </h1>
        </div>

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

        {/* 版本号 - 右下角 */}
        <div className="absolute bottom-4 right-6 z-50">
          <div className="text-[10px] sm:text-[11px] text-[#a89b8c] font-mono opacity-60 hover:opacity-100 transition-opacity">
            v1.0.0
          </div>
        </div>

        {/* === 主布局容器 === */}
        <div className="relative h-full w-full flex flex-col sm:flex-row">
          
          {/* --- 左侧工具栏区域 (仅桌面端显示) --- */}
          <div className="hidden sm:flex flex-shrink-0 items-center justify-center z-30 w-16 sm:w-20 md:w-24 lg:w-28 transition-all duration-500 overflow-visible">
            <ScrollableToolbar 
              activePanel={activePanel} 
              setActivePanel={setActivePanel} 
              hasNewTodo={hasNewTodo} 
              videoAvatarRef={videoAvatarRef}
              affinity={affinity}
              setAffinity={setAffinity}
              isMobile={false}
              isBgmPlaying={isBgmPlaying}
              onToggleBgm={toggleBgm}
            />
          </div>

          {/* --- 中间区域：叉叉 + 对话框（绝对定位，互不干扰） --- */}
          <div className={`
            relative z-10 flex-1 min-w-0
            transition-all duration-500 ease-in-out
          `}>
            {/* Speech Bubble - 绝对定位在叉叉上方 */}
            <div className={`
              absolute left-0 right-0 w-full flex items-end justify-center mb-2 px-3 sm:px-4 pointer-events-none mx-auto z-20
              ${isMobile 
                ? 'top-4 max-w-[85%] h-16' 
                : 'top-20 max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl h-20 md:h-28'}
            `}>
                {state === AssistantState.SPEAKING && latestResponse && (
                <div className={`
                  bg-white/90 backdrop-blur-md border border-purple-100 shadow-xl font-medium text-gray-700 animate-fade-in-up relative max-w-full text-center
                  ${isMobile 
                    ? 'px-3 py-2 rounded-xl rounded-bl-none text-xs' 
                    : 'px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl rounded-bl-none text-xs sm:text-sm md:text-base'}
                `}>
                        {latestResponse}
                  <div className={`
                    absolute bg-white/90 border-b border-r border-purple-100 transform rotate-45
                    ${isMobile ? '-bottom-1.5 left-3 w-2.5 h-2.5' : '-bottom-2 left-4 md:left-6 w-3 md:w-4 h-3 md:h-4'}
                  `}></div>
                    </div>
                )}
             </div>

            {/* Character - 绝对定位居中 */}
            <div 
              className={`
                absolute flex items-center justify-center pointer-events-auto 
                transition-all duration-500 ease-out
                ${isMobile 
                  ? 'top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[38vh] w-[280px]' 
                  : `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                     h-[40vh] sm:h-[45vh] md:h-[55vh] lg:h-[60vh] xl:h-[65vh] 2xl:h-[70vh]
                     ${hasPanelOpen 
                       ? 'w-[280px] sm:w-[340px] md:w-[400px] lg:w-[460px] xl:w-[500px]' 
                       : 'w-[340px] sm:w-[400px] md:w-[460px] lg:w-[520px] xl:w-[580px] 2xl:w-[640px]'}`
                }
              `}
              style={{
                transform: isMobile 
                  ? 'translate(-50%, -50%) scale(1.3)' 
                  : isSmallScreen 
                    ? 'translate(-50%, -50%) scale(1.45)' 
                    : isLargeScreen 
                      ? 'translate(-50%, -50%) scale(1.5)' 
                      : 'translate(-50%, -50%) scale(1.35)',
                transformOrigin: 'center center'
              }}
            >
                  <div 
                    className="h-full w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
                    onClick={handleAvatarClick}
                    title="点击和叉叉互动"
                  >
                    <VideoAvatar 
                      ref={videoAvatarRef}
                      config={characterConfig}
                      className="h-full w-full"
                      autoPlay={true}
                      debug={false}
                    />
                  </div>

                  {/* 好感度变化提示 - 字幕风格，位于叉叉中间区域 */}
                  {affinityToast && (
                    <AffinityToast
                      event={affinityToast}
                      onClose={() => setAffinityToast(null)}
                    />
                  )}
        </div>

            {/* Chat Interface - 绝对定位在底部 */}
            <div className={`
              absolute left-0 right-0 w-full mx-auto
              ${isMobile 
                ? 'bottom-[72px] px-3 pb-2 max-w-full' 
                : `bottom-0 px-3 md:px-4 pb-4 md:pb-6 
                   ${hasPanelOpen 
                     ? 'max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl' 
                     : 'max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl'}`
              }
            `}>
              <ChatInterface 
                messages={messages}
                isListening={isListening}
                isSpeaking={state === AssistantState.SPEAKING}
                onSendMessage={processInput}
                onStartListening={startListening}
                onStopListening={stopListening}
                inputRef={inputRef}
              />
            </div>
            </div>

          {/* --- 右侧面板区域 (仅桌面端显示) --- */}
          <div className={`
            hidden sm:flex items-center justify-start z-30 
            transition-all duration-500 ease-in-out
            ${hasPanelOpen 
              ? 'w-[380px] sm:w-[440px] md:w-[480px] lg:w-[520px] xl:w-[560px] 2xl:w-[600px] opacity-100 pr-5 sm:pr-6 md:pr-8 lg:pr-10' 
              : 'w-0 opacity-0 pointer-events-none pr-0'
            }
          `} style={{ overflow: 'hidden' }}>
            {hasPanelOpen && (
              <div className={`
                w-[360px] sm:w-[420px] md:w-[460px] lg:w-[500px] xl:w-[540px] 2xl:w-[580px] 
                h-[84vh] max-h-[800px] xl:max-h-[880px] 2xl:max-h-[960px]
                flex-shrink-0 transition-all duration-500 ease-out
                ${hasPanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}
              `}>
                <div className="h-full w-full rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-hidden glass-panel-strong border border-white/50 shadow-strong">
                  {renderPanelContent()}
                </div>
              </div>
            )}
          </div>

          {/* --- 手机端底部工具栏 --- */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 z-40">
              <MobileToolbar 
                activePanel={activePanel} 
                setActivePanel={setActivePanel} 
                hasNewTodo={hasNewTodo} 
                videoAvatarRef={videoAvatarRef}
                affinity={affinity}
                setAffinity={setAffinity}
              />
            </div>
          )}

          {/* --- 手机端全屏面板 --- */}
          {isMobile && hasPanelOpen && (
            <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-fade-in">
              <div 
                className="absolute inset-x-0 bottom-0 top-16 bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden"
                style={{ maxHeight: 'calc(100vh - 4rem)' }}
              >
                {/* 关闭按钮 */}
                <button 
                  onClick={() => setActivePanel('none')}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <span className="text-lg">×</span>
                </button>
                <div className="h-full overflow-auto">
                  {renderPanelContent()}
                </div>
              </div>
            </div>
          )}
        </div>

     </div>
    );
  };

// 工具栏通用 props
interface ToolbarProps {
  activePanel: ActivePanelType;
  setActivePanel: (panel: ActivePanelType) => void;
  hasNewTodo: boolean;
  videoAvatarRef: React.RefObject<VideoAvatarRef | null>;
  affinity: AffinityData;
  setAffinity: (affinity: AffinityData) => void;
  isMobile?: boolean;
  isBgmPlaying?: boolean;
  onToggleBgm?: () => void;
}

// 手机端底部工具栏
const MobileToolbar: React.FC<ToolbarProps> = ({ 
  activePanel, 
  setActivePanel, 
  hasNewTodo,
  videoAvatarRef,
  affinity,
  setAffinity
}) => {
  // 获取当前好感度等级数字（v1 = 1, v2 = 2, ...）
  const affinityLevelNum = parseInt(affinity.level.replace('v', '')) || 1;

  const togglePanel = (panel: ActivePanelType) => {
    const newState = activePanel === panel ? 'none' : panel;
    setActivePanel(newState);
    
    // 隐藏测试功能：打开 Watcha 面板时提升 5 级好感度
    if (panel === 'watcha' && newState === 'watcha') {
      const currentValue = affinity.value;
      const targetValue = Math.min(1000, currentValue + 500);
      const newAffinity = {
        ...affinity,
        value: targetValue,
        level: getAffinityLevel(targetValue),
        lastInteraction: Date.now(),
      };
      setAffinity(newAffinity);
      saveAffinityData(newAffinity);
      videoAvatarRef.current?.playAction('excited');
    }
    
    if (panel === 'todo' && newState === 'todo') {
      videoAvatarRef.current?.playAction('wave');
    }
  };

  // 手机端显示的核心工具（精简版）
  const tools = [
    { id: 'health' as const, icon: <Activity size={20} />, label: '健康' },
    { id: 'todo' as const, icon: <CheckSquare size={20} />, label: '待办', notification: hasNewTodo },
    { id: 'fortune' as const, icon: <Sparkles size={20} />, label: '占卜' },
    { id: 'weather' as const, icon: <CloudSun size={20} />, label: '天气' },
    { id: 'affinity' as const, icon: <AffinityIndicator variant="toolbar" affinity={affinity} />, label: '好感度' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => togglePanel(tool.id)}
            className={`
              relative flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200
              ${activePanel === tool.id 
                ? 'bg-[#e6ddd0] text-[#5c4d43]' 
                : 'text-[#8b7b6d] active:bg-gray-100'}
            `}
          >
            <span className="relative">
              {tool.icon}
              {tool.notification && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              )}
            </span>
            <span className="text-[10px] mt-0.5 font-medium">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Scrollable Toolbar Component (桌面端)
const ScrollableToolbar: React.FC<ToolbarProps> = ({ 
  activePanel, 
  setActivePanel, 
  hasNewTodo,
  videoAvatarRef,
  affinity,
  setAffinity,
  isMobile = false,
  isBgmPlaying = false,
  onToggleBgm
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
    // BGM 按钮特殊处理 - 不触发面板，只切换音乐
      if (panel === 'bgm') {
      if (onToggleBgm) {
        onToggleBgm();
      }
      return;
    }
    
    const newState = activePanel === panel ? 'none' : panel;
    setActivePanel(newState);
    
    // 隐藏测试功能：打开 Watcha 面板时提升 5 级好感度
    if (panel === 'watcha' && newState === 'watcha') {
      const currentValue = affinity.value;
      const targetValue = Math.min(1000, currentValue + 500); // 每级100分，5级=500分
      const newAffinity = {
        ...affinity,
        value: targetValue,
        level: getAffinityLevel(targetValue),
        lastInteraction: Date.now(),
      };
      setAffinity(newAffinity);
      saveAffinityData(newAffinity);
      videoAvatarRef.current?.playAction('excited');
      console.log(`[测试] Watcha 按钮：好感度 ${currentValue} -> ${targetValue} (${affinity.level} -> ${newAffinity.level})`);
    }
    
    if (panel === 'todo' && newState === 'todo') {
      videoAvatarRef.current?.playAction('wave');
    }
  };

  // 获取当前好感度等级数字（v1 = 1, v2 = 2, ...）
  const affinityLevelNum = parseInt(affinity.level.replace('v', '')) || 1;

  const tools = [
    // BGM 按钮 - 放在最前面
    { 
      id: 'bgm' as const, 
      icon: isBgmPlaying ? <Music size={22} /> : <VolumeX size={22} />, 
      label: '音乐',
      isBgmButton: true
    },
    { id: 'health' as const, icon: <Activity size={22} />, label: '健康' },
    { id: 'weather' as const, icon: <CloudSun size={22} />, label: '天气' },
    { id: 'fortune' as const, icon: <Sparkles size={22} />, label: '占卜' },
    { id: 'todo' as const, icon: <CheckSquare size={22} />, label: '待办', notification: hasNewTodo },
    { id: 'skills' as const, icon: <Zap size={22} />, label: '技能' },
    { 
      id: 'memory' as const, 
      icon: <Brain size={22} />, 
      label: '记忆',
      requiredLevel: 2,
      lockedMessage: '需要好感度满 2 级'
    },
    { id: 'affinity' as const, icon: <AffinityIndicator variant="toolbar" affinity={affinity} />, label: '好感度' },
    { id: 'watcha' as const, icon: <img src="/watcha.svg" alt="Watcha" className="w-5 h-5 pointer-events-none" style={{ filter: activePanel === 'watcha' ? 'none' : 'opacity(0.6)' }} />, label: 'Watcha' },
    { 
      id: 'animation' as const, 
      icon: <Film size={22} />, 
      label: '动作',
      requiredLevel: 3,
      lockedMessage: '需要好感度满 3 级'
    },
  ];

  return (
    <div className="relative flex flex-col items-center h-full max-h-[85vh] overflow-visible">
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
        className="flex flex-col gap-1 sm:gap-2 flex-1 overflow-y-auto overflow-x-visible no-scrollbar py-1"
      >
        {tools.map((tool) => {
          const isLocked = tool.requiredLevel ? affinityLevelNum < tool.requiredLevel : false;
          const isBgmTool = (tool as any).isBgmButton;
          // BGM 按钮不参与面板激活状态，只显示播放状态
          const isActive = isBgmTool ? isBgmPlaying : activePanel === tool.id;
          
          return (
            <div 
              key={tool.id} 
              ref={(el) => { if (el) toolRefs.current.set(tool.id, el); }}
              className="overflow-visible"
            >
              <ToolbarIcon
                icon={tool.icon}
                active={isActive}
                onClick={() => togglePanel(tool.id)}
                label={tool.label}
                notification={tool.notification}
                locked={isLocked}
                lockedMessage={tool.lockedMessage}
              />
            </div>
          );
        })}
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
const ToolbarIcon = ({ icon, active, onClick, label, notification, locked, lockedMessage }: { 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void, 
  label: string, 
  notification?: boolean,
  locked?: boolean,
  lockedMessage?: string
}) => (
    <div className="relative flex flex-col items-center overflow-visible icon-container">
        <button 
            onClick={locked ? undefined : onClick}
            className={`
              toolbar-btn flex items-center justify-center transition-all duration-300
              w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
              rounded-xl sm:rounded-2xl
              ${locked 
                ? 'opacity-40 cursor-not-allowed grayscale' 
                : active 
                  ? 'active bg-white/90 shadow-lg scale-105' 
                  : 'hover:bg-white/60 cursor-pointer'}
              ${notification ? 'animate-shake' : ''}
            `}
        >
            <span className="scale-75 sm:scale-90 md:scale-100">
            {icon}
            </span>
            {notification && !locked && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-[#f5f0e8] shadow-sm animate-pulse"></span>
            )}
        </button>
        <span className={`
          toolbar-label mt-0.5 sm:mt-1 font-medium transition-colors
          text-[10px] sm:text-xs
          ${locked ? 'text-[#c4b8a8]' : active ? 'text-[#5c4d43]' : 'text-[#a89b8c]'}
        `}>
            {label}
        </span>
        {/* 锁定提示气泡 - 显示在右侧 */}
        {locked && lockedMessage && (
            <div className="locked-tooltip absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-800/95 text-white text-xs rounded-lg whitespace-nowrap opacity-0 transition-opacity duration-200 pointer-events-none shadow-lg" style={{ zIndex: 9999 }}>
              {lockedMessage}
              {/* 左侧箭头 */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800/95"></div>
            </div>
        )}
    </div>
);

// 添加CSS样式到head
if (typeof document !== 'undefined' && !document.getElementById('toolbar-icon-styles')) {
  const style = document.createElement('style');
  style.id = 'toolbar-icon-styles';
  style.textContent = `
    .icon-container:hover .locked-tooltip {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

export default App;
