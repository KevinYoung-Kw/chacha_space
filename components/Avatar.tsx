
import React from 'react';
import { AssistantState } from '../types';
import { Volume2, Cloud, Sparkles, Ear } from 'lucide-react';

interface AvatarProps {
  state: AssistantState;
  className?: string;
  mode?: 'circle' | 'full'; 
}

const Avatar: React.FC<AvatarProps> = ({ state, className, mode = 'full' }) => {
  
  // Animation states for the image itself
  const getImageStyle = () => {
      switch (state) {
        case AssistantState.SPEAKING: return 'animate-breathe origin-bottom'; // Breathing animation anchored at bottom
        case AssistantState.THINKING: return 'animate-pulse';
        case AssistantState.HAPPY: return 'scale-105 transition-transform duration-500';
        case AssistantState.LISTENING: return 'animate-float-slow'; // Gentle floating when listening/idle
        case AssistantState.IDLE: return 'animate-float-slow';
        default: return 'transition-transform duration-500';
      }
  };

  const getStateIcon = () => {
    switch (state) {
      case AssistantState.SPEAKING: return <Volume2 size={20} className="text-purple-500 animate-pulse" />;
      case AssistantState.THINKING: return <Cloud size={20} className="text-blue-400 animate-bounce" />;
      case AssistantState.HAPPY: return <Sparkles size={20} className="text-yellow-400 animate-spin" />;
      case AssistantState.LISTENING: return <Ear size={20} className="text-green-400" />;
      default: return null;
    }
  };

  const styleTag = (
    <style>{`
        @keyframes breathe {
            0%, 100% { transform: scale(1) translateY(0); }
            50% { transform: scale(1.03) translateY(-4px); }
        }
        @keyframes float-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }
        .animate-breathe {
            animation: breathe 2.5s ease-in-out infinite;
            will-change: transform;
        }
        .animate-float-slow {
            animation: float-slow 6s ease-in-out infinite;
            will-change: transform;
        }
    `}</style>
  );

  // Full Body Mode
  if (mode === 'full') {
      return (
          <div className={`relative flex items-center justify-center transition-all duration-300 ${className || "h-[60vh] w-full"}`}>
              {styleTag}
              {/* Character Image - using object-contain to show full body */}
              <img 
                  src="/images/character.png" 
                  onError={(e) => {
                      // Fallback if local image fails
                      e.currentTarget.src = "https://api.dicebear.com/9.x/avataaars/svg?seed=Tata&top=longHair&hairColor=e8e8e8&clothing=collarAndSweater&eyes=happy&mouth=smile&style=transparent";
                  }}
                  alt="Tata Virtual Assistant Full Body"
                  className={`max-h-full max-w-full object-contain drop-shadow-2xl z-10 ${getImageStyle()}`}
              />
              
              {/* Optional Status Icon Bubble near head */}
              {getStateIcon() && (
                  <div className="absolute top-10 right-1/3 bg-white/80 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center shadow-sm z-20">
                      {getStateIcon()}
                  </div>
              )}
          </div>
      );
  }

  // Legacy Circle Mode
  const containerClasses = className || "w-48 h-48 md:w-64 md:h-64";
  return (
    <div className="relative flex flex-col items-center justify-center transition-all duration-300">
        {styleTag}
        <div className={`relative ${containerClasses} rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 z-10`}>
            <img 
                src="tata_avatar.png"
                onError={(e) => {
                    e.currentTarget.src = "https://api.dicebear.com/9.x/avataaars/svg?seed=Tata&top=longHair&hairColor=e8e8e8&clothing=collarAndSweater&eyes=happy&mouth=smile";
                }}
                alt="Tata Virtual Assistant Portrait"
                className={`w-full h-full object-cover object-top ${getImageStyle()}`}
            />
        </div>
    </div>
  );
};

export default Avatar;
