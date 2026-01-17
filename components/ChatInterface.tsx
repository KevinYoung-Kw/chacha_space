
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Mic, MicOff, AlignLeft, Sparkles } from 'lucide-react';

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
  const suggestions = [
      "为什么是女仆的形象？",
      "塔塔几岁了？",
      "塔塔是AI吗？",
      "未来是什么样的呢？",
      "塔塔可以联网吗？",
      "塔塔有记忆能力吗？",
      "塔塔跟DeepSeek比谁更聪明？",
      "塔塔怎么那么可爱？？"
  ];

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
    <div className="w-full pointer-events-auto flex flex-col gap-3">
      {/* Suggestions Chips (Visible when idle or conversation is short) */}
      {messages.length < 5 && !isListening && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar mask-linear-fade">
             <div className="flex items-center justify-center bg-white/40 rounded-full w-8 h-8 flex-shrink-0 border border-white/50">
                <Sparkles size={14} className="text-purple-500"/>
             </div>
             {suggestions.map(s => (
                 <button 
                    key={s} 
                    onClick={() => onSendMessage(s)} 
                    className="whitespace-nowrap px-4 py-2 bg-white/60 hover:bg-white/90 backdrop-blur-md rounded-full text-xs font-medium text-gray-700 hover:text-purple-700 shadow-sm hover:shadow-md transition-all border border-white/50 hover:border-purple-200 active:scale-95"
                 >
                     {s}
                 </button>
             ))}
        </div>
      )}

      {/* Floating Control Bar Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-2 flex items-center gap-2 h-[72px] transition-all duration-300 hover:shadow-purple-200/50 hover:border-purple-100 relative z-10">
        
        {/* Left: Text Input */}
        <div className="flex-1 h-full relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <AlignLeft size={18} className="text-gray-400 group-focus-within:text-purple-400 transition-colors" />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Talk to Tata..."
              className="w-full h-full pl-11 pr-4 bg-transparent rounded-full focus:outline-none text-gray-700 font-medium placeholder-gray-400"
              onKeyDown={handleKeyDown}
            />
        </div>

        {/* Center: Microphone (Core Button) */}
        <div className="relative flex items-center justify-center">
            {/* Active Listening Visual Effects */}
            {isListening && (
                <>
                   {/* Deep Ambient Glow */}
                   <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-40 animate-pulse pointer-events-none"></div>
                   {/* Sharp Expanding Ripple */}
                   <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-60 pointer-events-none"></div>
                   {/* Secondary Delayed Ripple */}
                   <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-40 animation-delay-300 pointer-events-none"></div>
                </>
            )}
            
            <button 
                onClick={onToggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl z-10 active:scale-95 border-2 ${
                    isListening 
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 border-red-300 text-white scale-110 shadow-red-500/50' 
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 border-white/20 text-white shadow-purple-500/30 hover:scale-105 hover:shadow-purple-500/50'
                }`}
            >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
        </div>

        {/* Right: Send Button */}
        <button 
            onClick={handleSendClick}
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all active:scale-95 group"
        >
            <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>

      </div>
      
      <style>{`
        .animation-delay-300 {
            animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
