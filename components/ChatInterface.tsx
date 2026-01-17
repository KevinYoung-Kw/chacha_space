
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isListening: boolean;
  onSendMessage: (text: string) => void;
  onToggleListening: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isListening, 
  onSendMessage, 
  onToggleListening,
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
                className="w-full h-full px-3 bg-transparent rounded-full focus:outline-none text-[#5c4d43] text-sm font-medium placeholder-[#a89b8c]"
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
                  </>
              )}
              
              <button 
                  onClick={onToggleListening}
                  className={`toolbar-btn w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 z-10 active:scale-95 ${
                      isListening 
                      ? 'bg-rose-500 text-white scale-110' 
                      : 'text-[#8b7b6d] hover:text-[#5c4d43] hover:bg-[#e6ddd0]'
                  }`}
              >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
          </div>

          {/* Send Button */}
          <button 
              onClick={handleSendClick}
              className="toolbar-btn w-9 h-9 rounded-full text-[#8b7b6d] hover:text-[#5c4d43] hover:bg-[#e6ddd0] flex items-center justify-center transition-all active:scale-95"
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
