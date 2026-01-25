import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminPage from './AdminPage';

// 简单的路由：根据 URL 路径决定渲染哪个页面
const Router: React.FC = () => {
  const path = window.location.pathname;
  
  // /admin 路径显示管理后台
  if (path === '/admin' || path.startsWith('/admin/')) {
    return <AdminPage />;
  }
  
  // 其他路径显示主应用
  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);