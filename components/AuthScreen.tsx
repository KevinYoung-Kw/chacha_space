/**
 * 登录/注册页面组件
 */

import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Sparkles, User, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表单数据
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // 登录
        const result = await authApi.login(email, password);
        if (result.success && result.data) {
          onAuthSuccess(result.data.user);
        } else {
          setError(result.error || '登录失败');
        }
      } else {
        // 注册
        if (!name || name.trim().length === 0) {
          setError('请输入昵称');
          setLoading(false);
          return;
        }
        const result = await authApi.register({
          email,
          password,
          name: name.trim(),
        });
        if (result.success && result.data) {
          onAuthSuccess(result.data.user);
        } else {
          setError(result.error || '注册失败');
        }
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcf8] via-[#f5f0e8] to-[#ebe4d8] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)`
        }}
      />
      
      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#5c4d43] mb-2">叉叉助手</h1>
          <p className="text-[#8b7b6d]">来自2045年的AI伙伴</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/50">
          {/* Tabs */}
          <div className="flex mb-6 bg-[#f5f0e8] rounded-full p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-white shadow-md text-[#5c4d43]' 
                  : 'text-[#8b7b6d] hover:text-[#5c4d43]'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-white shadow-md text-[#5c4d43]' 
                  : 'text-[#8b7b6d] hover:text-[#5c4d43]'
              }`}
            >
              注册
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a89b8c]" />
              <input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-[#f5f0e8] rounded-xl border-2 border-transparent focus:border-purple-300 focus:bg-white outline-none transition-all text-[#5c4d43] placeholder:text-[#a89b8c]"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a89b8c]" />
              <input
                type="password"
                placeholder="密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-3.5 bg-[#f5f0e8] rounded-xl border-2 border-transparent focus:border-purple-300 focus:bg-white outline-none transition-all text-[#5c4d43] placeholder:text-[#a89b8c]"
              />
            </div>

            {/* Name (Register only) */}
            {!isLogin && (
              <div className="relative animate-fade-in">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a89b8c]" />
                <input
                  type="text"
                  placeholder="你的昵称（必填）"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#f5f0e8] rounded-xl border-2 border-transparent focus:border-purple-300 focus:bg-white outline-none transition-all text-[#5c4d43] placeholder:text-[#a89b8c]"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? '登录' : '注册'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Account Hint */}
          <div className="mt-6 text-center text-sm text-[#a89b8c]">
            <p>首次使用？直接注册一个新账号吧！</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#a89b8c] text-sm mt-6">
          © 2026 叉叉助手 · 用科技让生活更有温度
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
