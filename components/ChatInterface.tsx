
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isListening: boolean;
  onSendMessage: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isListening, 
  onSendMessage, 
  onStartListening,
  onStopListening,
  inputRef 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // 点击切换模式：第一次点击开始，第二次点击停止
  const handleVoiceButtonClick = () => {
    if (isListening) {
      // 正在录音，点击停止
      onStopListening();
    } else {
      // 未录音，点击开始
      onStartListening();
    }
  };

  return (
    <div className="w-full pointer-events-auto">
      {/* Combined Dialog Box - Glass morphism container */}
      <div className="chat-container glass-panel rounded-[1.8rem] overflow-hidden">
        {/* Dialog Display Area - Shows conversation with scrolling */}
        <div className="px-5 py-4 max-h-[180px] min-h-[80px] overflow-y-auto border-b border-[#e6ddd0]/40 scrollbar-custom">
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
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Text Input */}
          <div className="flex-1 h-[36px] relative">
              <input
                ref={inputRef}
                type="text"
                placeholder=""
                disabled={isListening}
                className={`w-full h-full px-3 bg-transparent rounded-full focus:outline-none text-sm font-medium placeholder-[#a89b8c] transition-opacity ${
                  isListening 
                    ? 'opacity-50 cursor-not-allowed text-[#8b7b6d]' 
                    : 'text-[#5c4d43]'
                }`}
                onKeyDown={handleKeyDown}
              />
          </div>

          {/* Voice Button */}
          <div className="relative flex items-center justify-center">
              {/* Active Listening Visual Effects */}
              {isListening && (
                  <>
                     <div className="absolute inset-0 bg-rose-400 rounded-full blur-md opacity-40 animate-pulse pointer-events-none"></div>
                     <div className="absolute inset-0 bg-rose-300 rounded-full animate-ping opacity-50 pointer-events-none"></div>
                     {/* 长期等待状态提示 */}
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-500 text-white text-[10px] px-2 py-1 rounded-full shadow-lg animate-bounce flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        正在倾听...
                     </div>
                  </>
              )}
              
              <button 
                  onClick={handleVoiceButtonClick}
                  className={`toolbar-btn w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 z-10 active:scale-95 select-none ${
                      isListening 
                      ? 'bg-rose-500 text-white scale-110 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                      : 'text-[#8b7b6d] hover:text-[#5c4d43] hover:bg-[#e6ddd0] cursor-pointer'
                  }`}
                  style={{ touchAction: 'none', userSelect: 'none' }}
                  title={isListening ? '点击停止录音' : '点击开始录音'}
              >
                  {isListening ? (
                    <div className="relative flex items-center justify-center">
                      <MicOff size={18} />
                      <span className="absolute -inset-1 rounded-full border-2 border-white/30 animate-ping"></span>
                    </div>
                  ) : <Mic size={18} />}
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
