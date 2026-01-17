/**
 * 昵称设置组件
 * 用户首次使用时，叉叉询问昵称
 */

import React, { useState, useRef, useEffect } from 'react';
import { authApi, ttsApi } from '../services/api';
import { Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { decodeAudioData, playAudioBuffer } from '../services/audioService';

interface NicknameSetupProps {
  onComplete: (nickname: string) => void;
}

const NicknameSetup: React.FC<NicknameSetupProps> = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 初始化音频上下文并朗读欢迎语
  useEffect(() => {
    // 初始化 AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // 延迟朗读欢迎语
    const speakWelcome = async () => {
      try {
        const welcomeText = "你好呀！我是叉叉。在我们开始之前，告诉我你希望我怎么称呼你吧";
        const audioData = await ttsApi.synthesize(welcomeText);
        
        if (audioData && audioContextRef.current) {
          const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
          playAudioBuffer(audioBuffer, audioContextRef.current);
        }
      } catch (err) {
        console.error('TTS 播放失败:', err);
      }
    };

    // 延迟 800ms 后播放，让动画先完成
    const timer = setTimeout(() => {
      speakWelcome();
      inputRef.current?.focus();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 防抖检查昵称
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (!nickname.trim()) {
      setIsAvailable(null);
      setError(null);
      return;
    }

    if (nickname.trim().length > 20) {
      setError('昵称最多20个字符哦~');
      setIsAvailable(false);
      return;
    }

    setChecking(true);
    setError(null);
    setIsAvailable(null);

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await authApi.checkNickname(nickname.trim());
        if (result.success && result.data) {
          setIsAvailable(result.data.available);
          if (!result.data.available) {
            setError('这个昵称已经被别人用啦，换一个吧~');
          }
        }
      } catch {
        // 忽略检查错误
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [nickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError('请告诉我你的昵称~');
      return;
    }

    if (!isAvailable) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await authApi.setNickname(trimmedNickname);
      if (result.success) {
        onComplete(trimmedNickname);
      } else {
        setError(result.error || '设置昵称失败，请重试~');
      }
    } catch {
      setError('网络好像出了点问题，稍后再试试？');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景 */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'url("/images/background.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fdfcf8]/60 via-[#fdfcf8]/40 to-[#fdfcf8]/80" />

      {/* 主内容 */}
      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* 叉叉的问候 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-28 h-28 mb-5">
            <img src="/logo.webp" alt="叉叉" className="w-full h-full object-contain" />
          </div>
          
          {/* 对话气泡 */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-lg border border-white/50 mx-4">
            <div className="text-base text-[#5c4d43] font-medium leading-relaxed">
              你好呀！我是叉叉
            </div>
            <div className="text-sm text-[#8b7b6d] mt-1.5 leading-relaxed">
              在我们开始之前，告诉我你希望我怎么称呼你吧
            </div>
            {/* 气泡尾巴 */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white/95 rotate-45 border-l border-t border-white/50" />
          </div>
        </div>

        {/* 输入表单 */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 border border-white/50 mx-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入你的昵称..."
              maxLength={20}
              disabled={submitting}
              className={`
                w-full px-4 py-3 bg-[#f5f0e8] rounded-xl border-2 outline-none transition-all text-[#5c4d43] placeholder:text-[#a89b8c] text-base
                ${error ? 'border-red-300 focus:border-red-400' : isAvailable ? 'border-green-300 focus:border-green-400' : 'border-transparent focus:border-[#e6ddd0]'}
                ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            
            {/* 状态指示器 */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {checking && (
                <Loader2 className="w-5 h-5 text-[#a89b8c] animate-spin" />
              )}
              {!checking && isAvailable === true && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {!checking && isAvailable === false && (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-3 px-2 text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 字数提示 */}
          <div className="mt-2 px-2 text-xs text-[#a89b8c] text-right">
            {nickname.length}/20
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={submitting || checking || !nickname.trim() || !isAvailable}
            className={`
              w-full mt-3 py-3 rounded-xl font-medium text-base shadow-md transition-all flex items-center justify-center gap-2
              ${submitting || checking || !nickname.trim() || !isAvailable
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#8b7b6d] to-[#5c4d43] hover:from-[#7a6b5d] hover:to-[#4d3e35] text-white hover:shadow-lg active:scale-[0.98]'
              }
            `}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>认识中...</span>
              </>
            ) : (
              <>
                <span>就叫我这个吧！</span>
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* 底部提示 */}
        <p className="text-center text-[#a89b8c] text-xs mt-4 px-4">
          昵称是我认识你的方式，可以是真名、网名或任何你喜欢的称呼
        </p>
      </div>
    </div>
  );
};

export default NicknameSetup;
