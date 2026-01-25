import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Key, LogOut, RefreshCw, Plus, Trash2, Search,
  ChevronLeft, ChevronRight, Copy, Check, AlertCircle
} from 'lucide-react';
import { 
  adminApi, AdminStats, InviteCode, AdminUser, Pagination 
} from '../services/api';

type TabType = 'stats' | 'invites' | 'users';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  
  return (
    <div 
      className="h-screen overflow-y-auto" 
      style={{ 
        background: 'var(--color-bg-base)',
        WebkitOverflowScrolling: 'touch', // iOS 滑动优化
        userSelect: 'text', // 允许文本选择
        WebkitUserSelect: 'text'
      }}
    >
      {/* Header */}
      <header className="glass-panel-strong border-b border-[#e6ddd0] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 
            className="text-xl font-bold text-[#5c4d43]"
            style={{ fontFamily: "'Ma Shan Zheng', 'Zhi Mang Xing', cursive" }}
          >
            叉叉管理后台
          </h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#8b7b6d] hover:text-[#5c4d43] transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4 pb-8">
        <div className="flex gap-2 mb-6">
          {[
            { id: 'stats' as TabType, icon: BarChart3, label: '数据统计' },
            { id: 'invites' as TabType, icon: Key, label: '邀请码管理' },
            { id: 'users' as TabType, icon: Users, label: '用户管理' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-[#5c4d43] text-white shadow-md'
                  : 'bg-white/60 text-[#8b7b6d] hover:bg-white/80'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-panel rounded-2xl p-6">
          {activeTab === 'stats' && <StatsPanel />}
          {activeTab === 'invites' && <InvitesPanel />}
          {activeTab === 'users' && <UsersPanel />}
        </div>
      </div>
    </div>
  );
};

// ==================== 数据统计面板 ====================

const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const result = await adminApi.getStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return <ErrorMessage message="加载统计数据失败" onRetry={fetchStats} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="总用户数" value={stats.users.total} subtitle={`今日 +${stats.users.today}`} />
        <StatCard title="邀请码" value={stats.inviteCodes.available} subtitle={`共 ${stats.inviteCodes.total} 个`} color="blue" />
        <StatCard title="待办事项" value={stats.todos.total} subtitle={`已完成 ${stats.todos.completed}`} color="green" />
        <StatCard title="对话消息" value={stats.chats.totalMessages} subtitle={`${stats.chats.totalSessions} 个会话`} color="purple" />
      </div>

      {/* Recent Users */}
      <div>
        <h3 className="text-lg font-medium text-[#5c4d43] mb-4">最近注册用户</h3>
        <div className="space-y-2">
          {stats.recentUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
              <div>
                <p className="font-medium text-[#5c4d43]">{user.name}</p>
                <p className="text-sm text-[#8b7b6d]">{user.email}</p>
              </div>
              <p className="text-xs text-[#a89b8c]">
                {new Date(user.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))}
          {stats.recentUsers.length === 0 && (
            <p className="text-center text-[#8b7b6d] py-4">暂无用户</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== 邀请码管理面板 ====================

const InvitesPanel: React.FC = () => {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'used' | 'available'>('all');
  const [generateCount, setGenerateCount] = useState(10);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchInviteCodes = async (page: number = 1) => {
    setLoading(true);
    const result = await adminApi.getInviteCodes({ page, pageSize: 20, status: filter });
    if (result.success && result.data) {
      setInviteCodes(result.data.inviteCodes);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInviteCodes();
  }, [filter]);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await adminApi.generateInviteCodes(generateCount);
    if (result.success) {
      fetchInviteCodes();
    }
    setGenerating(false);
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`确定删除邀请码 ${code} 吗？`)) return;
    await adminApi.deleteInviteCode(code);
    fetchInviteCodes(pagination?.page);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="flat-input py-2 px-3 text-sm"
          >
            <option value="all">全部</option>
            <option value="available">可用</option>
            <option value="used">已使用</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={generateCount}
            onChange={(e) => setGenerateCount(parseInt(e.target.value) || 10)}
            className="flat-input py-2 px-3 w-20 text-sm text-center"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl flat-btn-primary text-sm disabled:opacity-50"
          >
            {generating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            生成邀请码
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#e6ddd0]">
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">邀请码</th>
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">状态</th>
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">使用者</th>
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">创建时间</th>
                <th className="text-right py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {inviteCodes.map(code => (
                <tr key={code.code} className="border-b border-[#f0e9e0] hover:bg-white/30">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-[#5c4d43]">{code.code}</code>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="text-[#8b7b6d] hover:text-[#5c4d43]"
                      >
                        {copiedCode === code.code ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      code.used_by_email 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {code.used_by_email ? '已使用' : '可用'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-[#8b7b6d]">
                    {code.used_by_name || '-'}
                  </td>
                  <td className="py-3 px-2 text-[#a89b8c]">
                    {new Date(code.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleDelete(code.code)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {inviteCodes.length === 0 && (
            <p className="text-center text-[#8b7b6d] py-8">暂无邀请码</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={fetchInviteCodes}
        />
      )}
    </div>
  );
};

// ==================== 用户管理面板 ====================

const UsersPanel: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = async (page: number = 1) => {
    setLoading(true);
    const result = await adminApi.getUsers({ page, pageSize: 20, search });
    if (result.success && result.data) {
      setUsers(result.data.users);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`确定删除用户 ${user.name} (${user.email}) 吗？\n\n此操作将删除该用户的所有数据，无法恢复！`)) return;
    const result = await adminApi.deleteUser(user.id);
    if (result.success) {
      fetchUsers(pagination?.page);
    } else {
      alert(result.error || '删除失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7b6d]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flat-input pl-10 py-2.5 w-full"
            placeholder="搜索用户邮箱或昵称..."
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl flat-btn-primary text-sm">
          搜索
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[#e6ddd0]">
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">用户</th>
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">好感度</th>
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">待办</th>
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">消息</th>
                <th className="text-left py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">注册时间</th>
                <th className="text-right py-3 px-2 text-[#8b7b6d] font-medium whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[#f0e9e0] hover:bg-white/30">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-[#5c4d43]">{user.name}</p>
                      <p className="text-xs text-[#8b7b6d]">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-[#5c4d43]">
                      {user.affinity_level?.toUpperCase() || 'v1'} ({user.affinity_value || 50})
                    </span>
                  </td>
                  <td className="py-3 px-2 text-[#8b7b6d]">{user.todo_count}</td>
                  <td className="py-3 px-2 text-[#8b7b6d]">{user.message_count}</td>
                  <td className="py-3 px-2 text-[#a89b8c]">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <p className="text-center text-[#8b7b6d] py-8">暂无用户</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={fetchUsers}
        />
      )}
    </div>
  );
};

// ==================== 公共组件 ====================

const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  subtitle: string;
  color?: 'default' | 'blue' | 'green' | 'purple';
}> = ({ title, value, subtitle, color = 'default' }) => {
  const colors = {
    default: 'text-[#5c4d43]',
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="bg-white/50 rounded-xl p-4">
      <p className="text-sm text-[#8b7b6d] mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-[#a89b8c] mt-1">{subtitle}</p>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center py-12">
    <RefreshCw size={24} className="animate-spin text-[#8b7b6d]" />
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-[#8b7b6d]">
    <AlertCircle size={32} className="mb-2" />
    <p>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 text-sm text-[#5c4d43] hover:underline">
        重试
      </button>
    )}
  </div>
);

const PaginationControls: React.FC<{
  pagination: Pagination;
  onPageChange: (page: number) => void;
}> = ({ pagination, onPageChange }) => (
  <div className="flex items-center justify-between pt-4">
    <p className="text-sm text-[#8b7b6d]">
      共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page <= 1}
        className="p-2 rounded-lg bg-white/50 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        className="p-2 rounded-lg bg-white/50 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  </div>
);

export default AdminPanel;
