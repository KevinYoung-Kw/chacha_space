import React, { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { adminApi } from './services/api';

/**
 * 管理员页面
 * 独立的 /admin 路由页面
 */
const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      if (adminApi.isAuthenticated()) {
        // 验证 token 是否有效
        const result = await adminApi.getStats();
        setIsAuthenticated(result.success);
        if (!result.success) {
          adminApi.logout();
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // 登录成功
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // 退出登录
  const handleLogout = () => {
    adminApi.logout();
    setIsAuthenticated(false);
  };

  // 加载中
  if (isAuthenticated === null) {
    return (
      <div 
        className="h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-base)' }}
      >
        <div className="text-[#8b7b6d]">加载中...</div>
      </div>
    );
  }

  // 未登录 - 显示登录页面
  if (!isAuthenticated) {
    return <AdminLogin onSuccess={handleLoginSuccess} />;
  }

  // 已登录 - 显示管理面板
  return <AdminPanel onLogout={handleLogout} />;
};

export default AdminPage;
