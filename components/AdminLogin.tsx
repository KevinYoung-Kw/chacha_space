import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { adminApi } from '../services/api';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await adminApi.login(email, password);
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-screen overflow-y-auto flex items-center justify-center p-4" 
      style={{ 
        background: 'var(--color-bg-base)',
        WebkitOverflowScrolling: 'touch' // iOS 滑动优化
      }}
    >
      <div className="w-full max-w-md glass-panel-strong rounded-3xl shadow-strong p-8 my-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--color-bg-warm)' }}
          >
            <Shield size={32} className="text-[#5c4d43]" />
          </div>
          <h1 
            className="text-2xl font-bold text-[#5c4d43] tracking-wide mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', 'Zhi Mang Xing', cursive" }}
          >
            管理后台
          </h1>
          <p className="text-sm text-[#8b7b6d]">叉叉的空间 · 管理员登录</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-shake">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#5c4d43] mb-2">管理员邮箱</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flat-input pl-11 py-3.5"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#5c4d43] mb-2">密码</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flat-input pl-11 pr-11 py-3.5"
                placeholder="输入密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7b6d] hover:text-[#5c4d43] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl flat-btn-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? '登录中...' : '登录管理后台'}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-sm text-[#8b7b6d] hover:text-[#5c4d43] transition-colors"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
