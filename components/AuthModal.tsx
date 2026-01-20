import React, { useState } from 'react';
import { Mail, Lock, User, Key, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (token: string, user: any) => void;
}

type TabType = 'register' | 'login';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<TabType>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    name: '',
    inviteCode: '',
  });

  // 登录表单
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // 邀请码验证状态
  const [inviteStatus, setInviteStatus] = useState<{
    checking: boolean;
    valid: boolean | null;
    message: string;
  }>({
    checking: false,
    valid: null,
    message: '',
  });

  // 邀请码验证防抖
  const checkInviteCode = async (code: string) => {
    if (!code || code.trim().length === 0) {
      setInviteStatus({ checking: false, valid: null, message: '' });
      return;
    }

    setInviteStatus({ checking: true, valid: null, message: '' });

    try {
      const response = await fetch('/api/auth/check-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setInviteStatus({
          checking: false,
          valid: result.data.valid,
          message: result.data.message,
        });
      }
    } catch (err) {
      setInviteStatus({
        checking: false,
        valid: false,
        message: '验证失败',
      });
    }
  };

  // 注册处理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // 保存 token
        localStorage.setItem('chacha_token', result.data.token);
        onSuccess(result.data.token, result.data.user);
      } else {
        setError(result.error || '注册失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // 保存 token
        localStorage.setItem('chacha_token', result.data.token);
        onSuccess(result.data.token, result.data.user);
      } else {
        setError(result.error || '登录失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto glass-panel-strong rounded-3xl shadow-strong animate-slide-in-left">
        {/* Logo & Title */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 text-center">
          <h1 
            className="text-2xl sm:text-3xl font-bold text-[#5c4d43] tracking-wide mb-1 sm:mb-2" 
            style={{ fontFamily: "'Ma Shan Zheng', 'Zhi Mang Xing', cursive" }}
          >
            叉叉的空间
          </h1>
          <p className="text-xs sm:text-sm text-[#8b7b6d]">欢迎来到温暖的小世界</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 px-6 sm:px-8 mb-4 sm:mb-6">
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${
              activeTab === 'register'
                ? 'bg-[#5c4d43] text-white shadow-md'
                : 'bg-white/60 text-[#8b7b6d] hover:bg-white/80'
            }`}
          >
            注册
          </button>
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${
              activeTab === 'login'
                ? 'bg-[#5c4d43] text-white shadow-md'
                : 'bg-white/60 text-[#8b7b6d] hover:bg-white/80'
            }`}
          >
            登录
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 sm:mx-8 mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm animate-shake">
            {error}
          </div>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-3 sm:space-y-4 animate-fade-in">
            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#5c4d43] mb-1.5 sm:mb-2">邮箱</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="flat-input pl-9 sm:pl-11 py-2.5 sm:py-3.5 text-sm sm:text-base"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#5c4d43] mb-1.5 sm:mb-2">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="flat-input pl-9 sm:pl-11 pr-9 sm:pr-11 py-2.5 sm:py-3.5 text-sm sm:text-base"
                  placeholder="至少6位密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#8b7b6d] hover:text-[#5c4d43] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#5c4d43] mb-1.5 sm:mb-2">昵称</label>
              <div className="relative">
                <User size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="flat-input pl-9 sm:pl-11 py-2.5 sm:py-3.5 text-sm sm:text-base"
                  placeholder="给自己起个好听的名字"
                />
              </div>
            </div>

            {/* Invite Code */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#5c4d43] mb-1.5 sm:mb-2">邀请码</label>
              <div className="relative">
                <Key size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
                <input
                  type="text"
                  required
                  value={registerForm.inviteCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setRegisterForm({ ...registerForm, inviteCode: code });
                    // 防抖检查
                    setTimeout(() => checkInviteCode(code), 500);
                  }}
                  className="flat-input pl-9 sm:pl-11 pr-9 sm:pr-11 py-2.5 sm:py-3.5 text-sm sm:text-base"
                  placeholder="8位邀请码"
                  maxLength={8}
                />
                {inviteStatus.checking && (
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#8b7b6d] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!inviteStatus.checking && inviteStatus.valid !== null && (
                  <div className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base ${inviteStatus.valid ? 'text-green-500' : 'text-red-500'}`}>
                    {inviteStatus.valid ? '✓' : '✗'}
                  </div>
                )}
              </div>
              {inviteStatus.message && !inviteStatus.checking && (
                <p className={`text-[10px] sm:text-xs mt-1 ${inviteStatus.valid ? 'text-green-600' : 'text-red-600'}`}>
                  {inviteStatus.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || inviteStatus.valid === false}
              className="w-full py-3 sm:py-4 rounded-xl flat-btn-primary font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '开始探索'}
            </button>
          </form>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-3 sm:space-y-4 animate-fade-in">
            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#5c4d43] mb-1.5 sm:mb-2">邮箱</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="flat-input pl-9 sm:pl-11 py-2.5 sm:py-3.5 text-sm sm:text-base"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#5c4d43] mb-1.5 sm:mb-2">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="flat-input pl-9 sm:pl-11 pr-9 sm:pr-11 py-2.5 sm:py-3.5 text-sm sm:text-base"
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#8b7b6d] hover:text-[#5c4d43] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-4 rounded-xl flat-btn-primary font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '进入空间'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="px-6 sm:px-8 pb-4 sm:pb-6 text-center text-[10px] sm:text-xs text-[#a89b8c]">
          {activeTab === 'register' ? (
            <p>注册即表示您同意我们的服务条款</p>
          ) : (
            <p>还没有账号？切换到注册标签页</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
