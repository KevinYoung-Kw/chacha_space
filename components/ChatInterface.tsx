
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Send, Mic, MicOff, AlertCircle } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isListening: boolean;
  onSendMessage: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isSpeaking?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isListening, 
  onSendMessage, 
  onStartListening,
  onStopListening,
  inputRef,
  isSpeaking = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [micError, setMicError] = useState<string>('');
  
  // 检查浏览器是否支持语音识别
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Auto scroll the message container only (avoid page scroll)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // 自动清除错误提示
  useEffect(() => {
    if (micError) {
      const timer = setTimeout(() => setMicError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [micError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputRef.current?.value) {
      onSendMessage(inputRef.current.value);
      inputRef.current.value = '';
    }
  };

  const handleSendClick = () => {
    if (inputRef.current?.value) {
        onSendMessage(inputRef.current.value);
        inputRef.current.value = '';
    }
  };

  // 简单直接的点击处理
  const handleVoiceButtonClick = async () => {
    setMicError('');

    if (!isSupported) {
      setMicError('浏览器不支持语音识别');
      return;
    }

    if (isListening) {
      // 正在录音，点击停止
      onStopListening();
    } else {
      // 未录音，先请求麦克风权限再开始
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        onStartListening();
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicError('请允许访问麦克风');
        } else if (err.name === 'NotFoundError') {
          setMicError('未检测到麦克风');
        } else {
          setMicError('无法启动录音');
        }
      }
    }
  };

  return (
    <div className="w-full pointer-events-auto">
      {/* Combined Dialog Box - Glass morphism container */}
      <div className="chat-container rounded-[1.8rem] overflow-hidden" style={{ 
        background: 'rgba(245, 240, 232, 0.15)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(230, 221, 208, 0.6)',
        boxShadow: '0 4px 20px rgba(92, 77, 67, 0.08)'
      }}>
        {/* Dialog Display Area - Shows conversation with scrolling */}
        <div
          ref={scrollContainerRef}
          className="px-5 py-4 max-h-[180px] min-h-[80px] overflow-y-auto border-b border-[#e6ddd0]/40 scrollbar-custom bg-transparent"
        >
          <div className="flex flex-col gap-3 text-sm">
            {messages.length === 0 ? (
              <div className="text-[#8b7b6d] text-center py-2 italic">
                和叉叉打个招呼吧～
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx} className="text-[#5c4d43] animate-fade-in-up">
                    <span className="font-semibold text-[#8b7b6d]">
                      {msg.role === 'user' ? '【我】' : '【叉叉】'}
                    </span>
                    <span>{msg.content}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Bar - Bottom section */}
        <div className="px-4 py-3 flex items-center gap-3 bg-transparent">
          {/* Text Input */}
          <div className="flex-1 h-[36px] relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={isListening ? "正在录音..." : "输入消息..."}
                disabled={isListening}
                className={`w-full h-full px-3 bg-transparent rounded-full focus:outline-none text-sm font-medium transition-all duration-300 ${
                  isListening 
                    ? 'opacity-50 cursor-not-allowed text-[#8b7b6d] placeholder-[#c5b9aa]' 
                    : 'text-[#5c4d43] placeholder-[#a89b8c] focus:bg-white/30'
                }`}
                onKeyDown={handleKeyDown}
              />
              {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <span className="w-1 h-1 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </div>
              )}
          </div>

          {/* Voice Button */}
          <div className="relative flex items-center justify-center">
              {/* 错误提示 */}
              {micError && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-fade-in z-20 pointer-events-none">
                    <AlertCircle size={12} />
                    {micError}
                  </div>
              )}

              {/* Active Listening Visual Effects */}
              {isListening && !micError && (
                  <>
                     <div className="absolute inset-0 bg-rose-400 rounded-full blur-md opacity-40 animate-pulse pointer-events-none"></div>
                     <div className="absolute inset-0 bg-rose-300 rounded-full animate-ping opacity-50 pointer-events-none"></div>
                  </>
              )}
              
              <button 
                  onClick={handleVoiceButtonClick}
                  disabled={!isSupported}
                  type="button"
                  className={`toolbar-btn w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 z-10 active:scale-95 select-none ${
                      !isSupported 
                      ? 'opacity-40 cursor-not-allowed text-gray-400'
                      : isListening 
                      ? 'bg-rose-500 text-white scale-110 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.5)] hover:bg-rose-600' 
                      : 'text-[#8b7b6d] hover:text-[#5c4d43] hover:bg-[#e6ddd0] cursor-pointer'
                  }`}
                  title={isListening ? '点击停止录音' : '点击开始录音'}
              >
                  {isListening ? (
                    <div className="relative flex items-center justify-center">
                      <MicOff size={18} className="drop-shadow-sm" />
                      <span className="absolute -inset-1 rounded-full border-2 border-white/30 animate-ping"></span>
                    </div>
                  ) : (
                    <Mic size={18} />
                  )}
              </button>
          </div>

          {/* Send Button */}
          <button 
              onClick={handleSendClick}
              disabled={isListening}
              className={`toolbar-btn w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                isListening
                  ? 'opacity-50 cursor-not-allowed text-[#8b7b6d]'
                  : 'text-[#8b7b6d] hover:text-[#5c4d43] hover:bg-[#e6ddd0] cursor-pointer'
              }`}
          >
              <Send size={18} />
          </button>
        </div>
      </div>
      
      <style>{`
        /* 自定义滚动条样式 */
        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(230, 221, 208, 0.5);
          border-radius: 2px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(230, 221, 208, 0.8);
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
