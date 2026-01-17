import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Sparkles, Check, ChevronRight, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: '',
    gender: '',
    identity: '',
    expectations: ''
  });

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleSkip = () => {
    onComplete({
      name: '旅行者',
      gender: '保密',
      identity: '时空旅人',
      expectations: '希望能度过愉快的一天',
      onboardingComplete: true
    });
  };

  const handleComplete = () => {
    onComplete({
      name: data.name || '旅行者',
      gender: data.gender || '未知',
      identity: data.identity || '用户',
      expectations: data.expectations || '',
      onboardingComplete: true
    });
  };

  // Render content for specific steps
  const renderSlideContent = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center space-y-8">
            <div className="relative">
               <div className="w-24 h-24 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full animate-pulse flex items-center justify-center shadow-lg shadow-purple-200">
                  <Sparkles className="text-white w-10 h-10" />
               </div>
               <div className="absolute -inset-4 border border-purple-200 rounded-full opacity-50 animate-ping-slow"></div>
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">嗨，我是叉叉 ✨</h1>
                <p className="text-gray-500 mt-3 text-lg font-medium">来自2045年的AI极简主义整理师</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/60 text-sm text-gray-500 w-full max-w-xs text-left shadow-sm">
              <p className="mb-2 font-bold text-gray-700">即将开启的功能：</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full"/> 你的专属日程管家</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full"/> 情绪倾听与每日复盘</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-pink-400 rounded-full"/> 塔罗占卜与生活建议</li>
              </ul>
            </div>
            <button onClick={handleNext} className="w-full max-w-xs py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 font-medium shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
              开始同步 <ArrowRight size={18} />
            </button>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col h-full px-8 pt-10 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">建立连接</h2>
            <p className="text-gray-400 text-sm mb-8">为了更好的陪伴，我想先认识你。</p>
            
            <div className="space-y-6 flex-1">
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-purple-500 transition-colors">在这个时空怎么称呼你？</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all"
                  placeholder="请输入你的昵称"
                  value={data.name}
                  onChange={e => setData({...data, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">你的性别是？</label>
                <div className="grid grid-cols-3 gap-3">
                   {['男生', '女生', '保密'].map(g => (
                     <button 
                        key={g}
                        onClick={() => setData({...data, gender: g})}
                        className={`py-3 rounded-xl border font-medium transition-all ${data.gender === g ? 'bg-purple-100 border-purple-400 text-purple-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                     >
                        {g}
                     </button>
                   ))}
                </div>
              </div>
            </div>
            <button disabled={!data.name} onClick={handleNext} className="w-full py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex justify-between items-center px-6">
              <span>下一步</span> <ChevronRight size={18} />
            </button>
          </div>
        );
      case 2:
        return (
            <div className="flex flex-col h-full px-8 pt-10 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">深度校准</h2>
            <p className="text-gray-400 text-sm mb-8">让我更懂你的生活节奏。</p>

            <div className="space-y-6 flex-1">
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-purple-500 transition-colors">你现在的身份是？</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all"
                  placeholder="例如：学生、设计师、魔法师..."
                  value={data.identity}
                  onChange={e => setData({...data, identity: e.target.value})}
                />
              </div>
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-purple-500 transition-colors">对叉叉有什么期待？</label>
                <textarea 
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none h-32 resize-none transition-all"
                  placeholder="例如：希望能提醒我早睡，帮我记账，或者只是聊聊天..."
                  value={data.expectations}
                  onChange={e => setData({...data, expectations: e.target.value})}
                />
              </div>
            </div>
            <button onClick={handleNext} className="w-full py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium flex justify-between items-center px-6">
              <span>完成设置</span> <ChevronRight size={18} />
            </button>
          </div>
        );
      case 3:
        return (
           <div className="flex flex-col items-center justify-center h-full px-8 text-center space-y-6">
            <div className="relative mb-4">
               <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-100 animate-bounce-subtle">
                  <Check className="w-10 h-10" />
               </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800">时间线同步完成 ✓</h1>
            <p className="text-gray-500">叉叉已成功连接到你的时空坐标</p>
            
            {/* Summary Card Stack Visual */}
            <div className="w-full max-w-xs relative h-24 mt-4 perspective-1000">
                <div className="absolute inset-x-4 top-4 h-16 bg-white rounded-xl border border-gray-200 shadow-sm opacity-60 scale-90 -z-10 transform -translate-y-2"></div>
                <div className="absolute inset-x-2 top-2 h-16 bg-white rounded-xl border border-gray-200 shadow-sm opacity-80 scale-95 -z-10 transform -translate-y-1"></div>
                <div className="bg-white rounded-xl border border-purple-100 shadow-md p-4 flex items-center gap-4 text-left relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {data.name?.charAt(0) || '旅'}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{data.name}</p>
                        <p className="text-xs text-gray-400">{data.identity || '时空旅人'}</p>
                    </div>
                </div>
            </div>

            <div className="pt-8 w-full">
                 <button onClick={handleComplete} className="w-full max-w-xs mx-auto py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all font-bold tracking-wide">
                  进入系统
                </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full h-[600px] bg-white rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Skip Button */}
        {step < 3 && (
            <button 
                onClick={handleSkip}
                className="absolute top-6 right-6 z-20 text-gray-400 hover:text-purple-600 text-sm font-bold transition-colors px-3 py-1 rounded-full hover:bg-gray-50"
            >
                跳过
            </button>
        )}

        {/* Background Ambient Light */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-100/50 rounded-full filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/50 rounded-full filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        {/* Sliding Container */}
        <div 
            className="flex-1 flex transition-transform duration-700 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${step * 100}%)` }}
        >
            {[0, 1, 2, 3].map((index) => (
                <div key={index} className="w-full h-full flex-shrink-0 relative z-10">
                    {renderSlideContent(index)}
                </div>
            ))}
        </div>
        
        {/* Progress Indicator */}
        <div className="h-20 flex items-center justify-center relative z-10 bg-white/50 backdrop-blur-sm">
             <div className="flex gap-2">
                {[0, 1, 2, 3].map(i => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === step ? 'w-8 bg-purple-500' : 
                            i < step ? 'w-1.5 bg-purple-200' : 'w-1.5 bg-gray-200'
                        }`} 
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;