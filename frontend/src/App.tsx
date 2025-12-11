import React, { useEffect, useMemo, useState } from 'react';
import {
  archiveTask,
  clearDatabase,
  createProject,
  createTask,
  deleteTask,
  fetchMe,
  listProjects,
  listTasks,
  login,
  logout,
  sendCode,
  Task,
  TaskStatus,
  updateTask,
  updateProfile,
  register,
} from './api';

const socialLinks = [
  { href: 'https://x.com/TKuuuabc', label: 'X', icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg' },
  { href: 'https://www.facebook.com/profile.php?id=100086606343235', label: 'Facebook', icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg' },
  { href: 'https://discord.com/channels/@me', label: 'Discord', icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg' },
  { href: 'https://im.qq.com/index/', label: 'QQ', icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tencentqq.svg' },
];

type Toast = { type: 'success' | 'error'; text: string } | null;

const statusOptions: TaskStatus[] = ['TODO', 'DOING', 'DONE'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

type TaskForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: typeof priorityOptions[number];
  dueAt: string;
  tags: string;
};

function formatDateTime(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export default function App() {
  const [projects, setProjects] = useState([] as { id: number; name: string }[]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ keyword: string; status?: TaskStatus }>({ keyword: '' });
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH'>('ALL');
  const [todayOnly, setTodayOnly] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM',
    dueAt: '',
    tags: '',
  });
  const [toast, setToast] = useState<Toast>(null);
  const [hoverSlice, setHoverSlice] = useState<'TODO' | 'DOING' | 'DONE' | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'board' | 'stats' | 'store'>('list');
  const [darkMode, setDarkMode] = useState(false);
  const [remindedIds, setRemindedIds] = useState<Set<number>>(new Set());
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [profile, setProfile] = useState({
    name: '普通用户',
    email: 'user@example.com',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=todo',
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nameDraft, setNameDraft] = useState('普通用户');
  const [emailCode, setEmailCode] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [codeSending, setCodeSending] = useState(false);

  const requireLogin = () => {
    if (!isLoggedIn) {
      setToast({ type: 'error', text: '请先登录后再执行操作' });
      setShowLogin(true);
      return false;
    }
    return true;
  };
  const products = [
    { id: 'free', name: 'Free', price: 0, desc: '基础功能，单人使用' },
    { id: 'plus', name: 'Plus', price: 29, desc: '高级筛选、通知、导出' },
    { id: 'pro', name: 'Pro', price: 299, desc: '团队协作、看板同步、无限项目' },
  ];
  const [selectedPlan, setSelectedPlan] = useState('free');

  const loadProjects = () => {
    listProjects()
      .then((data) => {
        setProjects(data);
        if (data.length) {
          setSelectedProject(data[0].id);
        }
      })
      .catch(() => setToast({ type: 'error', text: '项目加载失败，请登录后重试' }));
  };

  useEffect(() => {
    loadProjects();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    listTasks(selectedProject, {
      keyword: filters.keyword || undefined,
      status: filters.status,
      size: 200,
    })
      .then((page) => setTasks(page.content))
      .finally(() => setLoading(false));
  }, [selectedProject, filters]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.keyword && !(`${t.title} ${t.description ?? ''}`.toLowerCase().includes(filters.keyword.toLowerCase()))) {
        return false;
      }
      if (filters.status && t.status !== filters.status) return false;
      if (priorityFilter === 'HIGH' && !(t.priority === 'HIGH' || t.priority === 'CRITICAL')) return false;
      if (todayOnly) {
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dStr !== todayStr) return false;
      }
      return true;
    });
  }, [tasks, filters, priorityFilter, todayOnly, todayStr]);

  const stats = useMemo(() => {
    const base = tasks;
    const total = base.length;
    const todo = base.filter((t) => t.status === 'TODO').length;
    const doing = base.filter((t) => t.status === 'DOING').length;
    const done = base.filter((t) => t.status === 'DONE').length;
    const segments = total
      ? {
          todoPct: Math.round((todo / total) * 100),
          doingPct: Math.round((doing / total) * 100),
          donePct: Math.round((done / total) * 100),
        }
      : { todoPct: 0, doingPct: 0, donePct: 0 };
    return { total, todo, doing, done, ...segments };
  }, [tasks]);

  const segments = useMemo(
    () => [
      { key: 'TODO' as const, value: stats.todo, color: '#60a5fa', label: 'TODO 📝' },
      { key: 'DOING' as const, value: stats.doing, color: '#f59e0b', label: 'DOING 🚧' },
      { key: 'DONE' as const, value: stats.done, color: '#34d399', label: 'DONE ✅' },
    ],
    [stats]
  );

  const gaugePct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const statusGradient = useMemo(() => {
    if (!stats.total) return '#e2e8f0';
    let start = 0;
    const parts: string[] = [];
    segments.forEach((s) => {
      const pct = stats.total ? (s.value / stats.total) * 100 : 0;
      const end = start + pct;
      parts.push(`${s.color} ${start}% ${end}%`);
      start = end;
    });
    if (start < 100) parts.push(`#e2e8f0 ${start}% 100%`);
    return `conic-gradient(${parts.join(', ')})`;
  }, [segments, stats.total]);
  const overdueCount = useMemo(
    () =>
      filteredTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.status !== 'DONE').length,
    [filteredTasks]
  );
  const dueTodayCount = useMemo(
    () =>
      filteredTasks.filter((t) => {
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dStr === todayStr;
      }).length,
    [filteredTasks, todayStr]
  );
  const highCount = useMemo(
    () => filteredTasks.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL').length,
    [filteredTasks]
  );
  const priorityCounts = useMemo(() => {
    const base = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<typeof priorityOptions[number], number>;
    tasks.forEach((t) => {
      base[t.priority] = (base[t.priority] ?? 0) + 1;
    });
    return base;
  }, [tasks]);

  const tagHot = useMemo(() => {
    const counter: Record<string, number> = {};
    tasks.forEach((t) => {
      t.tags?.forEach((tag) => {
        counter[tag] = (counter[tag] ?? 0) + 1;
      });
    });
    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredTasks, tasks]);

  const creationTrend = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const value = tasks.filter((t) => (t.createdAt || '').startsWith(dayStr)).length;
      days.push({ label, value });
    }
    return days;
  }, [tasks]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.classList.toggle('theme-dark', darkMode);
  }, [darkMode]);

  // 初始尝试从 token 恢复登录态
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetchMe()
      .then((me) => {
        setIsLoggedIn(true);
        setProfile((p) => ({
          ...p,
          email: me.email,
          name: me.displayName,
          avatar: me.avatarUrl || p.avatar,
        }));
        setNameDraft(me.displayName);
      })
      .catch(() => {
        logout();
        setIsLoggedIn(false);
      });
  }, []);

  // 简易到期提醒
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const overdue = tasks.filter(
        (t) => t.dueAt && new Date(t.dueAt).getTime() <= now && t.status !== 'DONE' && !remindedIds.has(t.id)
      );
      if (overdue.length) {
        const next = new Set(remindedIds);
        overdue.forEach((t) => next.add(t.id));
        setRemindedIds(next);
        setToast({ type: 'error', text: `有 ${overdue.length} 个任务已到期` });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [tasks, remindedIds]);

  const handleCreateProject = async () => {
    if (!requireLogin()) return;
    if (!projectForm.name.trim()) return;
    try {
      const created = await createProject(projectForm);
      setProjects((prev) => [...prev, created]);
      setSelectedProject(created.id);
      setProjectForm({ name: '', description: '' });
      setToast({ type: 'success', text: '项目创建成功' });
    } catch (e) {
      setToast({ type: 'error', text: '项目创建失败，请重试' });
    }
  };

  const handleCreateTask = async () => {
    if (!requireLogin()) return;
    if (!selectedProject || !taskForm.title.trim()) return;
    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      status: taskForm.status,
      priority: taskForm.priority,
      dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : undefined,
      tags: taskForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      const created = await createTask(selectedProject, payload);
      setTasks((prev) => [created, ...prev]);
      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueAt: '', tags: '' });
      setToast({ type: 'success', text: '任务创建成功' });
    } catch (e) {
      setToast({ type: 'error', text: '任务创建失败，请检查后端或表单' });
    }
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    if (!requireLogin()) return;
    try {
      const updated = await updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setToast({ type: 'success', text: '状态已更新' });
    } catch (e) {
      setToast({ type: 'error', text: '更新失败，请重试' });
    }
  };

  const handleArchive = async (taskId: number) => {
    if (!requireLogin()) return;
    try {
      await archiveTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setToast({ type: 'success', text: '任务已归档' });
    } catch {
      setToast({ type: 'error', text: '归档失败，请重试' });
    }
  };

  const handlePriorityChange = async (taskId: number, priority: typeof priorityOptions[number]) => {
    if (!requireLogin()) return;
    try {
      const updated = await updateTask(taskId, { priority });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setToast({ type: 'success', text: '优先级已更新' });
    } catch {
      setToast({ type: 'error', text: '更新优先级失败，请重试' });
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!requireLogin()) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setToast({ type: 'success', text: '任务已删除' });
    } catch {
      setToast({ type: 'error', text: '删除失败，请重试' });
    }
  };

  const handleClearDb = async () => {
    if (!requireLogin()) return;
    if (!window.confirm('确定清空所有项目与任务吗？此操作不可恢复。')) return;
    try {
      await clearDatabase();
      setProjects([]);
      setTasks([]);
      setSelectedProject(null);
      setToast({ type: 'success', text: '数据库已清空' });
    } catch (e) {
      setToast({ type: 'error', text: '清空失败，请检查后端' });
    }
  };

  const handleCheckout = (productId: string, method: 'alipay' | 'visa' | 'btc' | 'eth') => {
    if (!requireLogin()) return;
    const label =
      method === 'alipay' ? '支付宝' : method === 'visa' ? 'VISA' : method === 'btc' ? 'BTC' : '以太坊';
    setToast({ type: 'success', text: `已选择 ${label} 支付 ${productId}，请在真实环境接入网关` });
  };

  const handleLogin = async () => {
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setToast({ type: 'error', text: '请输入邮箱和密码' });
      return;
    }
    try {
      const resp = await login({ email: loginForm.email, password: loginForm.password });
      setIsLoggedIn(true);
      setShowLogin(false);
      setProfile((p) => ({
        ...p,
        email: resp.user.email,
        name: resp.user.displayName,
        avatar: resp.user.avatarUrl || p.avatar,
      }));
      setNameDraft(resp.user.displayName);
      setToast({ type: 'success', text: `已登录：${resp.user.email}` });
      loadProjects();
    } catch (e) {
      setToast({ type: 'error', text: '登录失败，请检查账号密码或后端' });
    }
  };

  const handleRegister = async () => {
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setToast({ type: 'error', text: '请输入邮箱和密码' });
      return;
    }
    if (confirmPwd !== loginForm.password) {
      setToast({ type: 'error', text: '两次密码不一致' });
      return;
    }
    if (!emailCode.trim()) {
      setToast({ type: 'error', text: '请输入邮箱验证码' });
      return;
    }
    try {
      await register({ email: loginForm.email, password: loginForm.password, code: emailCode });
      setToast({ type: 'success', text: '注册成功，请登录' });
      setLoginMode('login');
      setEmailCode('');
      setConfirmPwd('');
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.response?.data?.error ||
        (e as any)?.message ||
        '注册失败，检查邮箱是否已存在或后端错误';
      setToast({ type: 'error', text: msg });
    }
  };

  const handleSaveProfile = () => {
    if (!requireLogin()) return;
    if (!window.confirm('确认更新用户名与头像？')) return;
    updateProfile({ displayName: nameDraft, avatarUrl: profile.avatar })
      .then((user) => {
        setProfile((p) => ({ ...p, name: user.displayName, avatar: user.avatarUrl || p.avatar }));
        setToast({ type: 'success', text: '账号信息已更新' });
      })
      .catch(() => setToast({ type: 'error', text: '保存失败，请检查后端' }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireLogin()) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatar: reader.result as string }));
      setToast({ type: 'success', text: '头像已更新（本地预览）' });
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setToast({ type: 'success', text: '已退出登录' });
  };

  const renderFilters = (
    <section className={`card glass ${activeView === 'board' ? 'wide' : ''}`}>
      <div className="section-head">
        <div>
          <p className="eyebrow">筛选</p>
          <h3>快速定位任务</h3>
        </div>
      </div>
      <div className="form-row">
        <input
          placeholder="关键词筛选"
          value={filters.keyword}
          onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
        />
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as TaskStatus | undefined }))}
        >
          <option value="">全部状态</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="chips">
        <button
          type="button"
          className={`chip ${priorityFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setPriorityFilter('ALL')}
        >
          全部优先级
        </button>
        <button
          type="button"
          className={`chip ${priorityFilter === 'HIGH' ? 'active' : ''}`}
          onClick={() => setPriorityFilter('HIGH')}
        >
          只看高/紧急
        </button>
        <button
          type="button"
          className={`chip ${todayOnly ? 'active' : ''}`}
          onClick={() => setTodayOnly((v) => !v)}
        >
          {todayOnly ? '关闭今日到期' : '今日到期'}
        </button>
        <button
          type="button"
          className="chip ghost"
          onClick={() => {
            setFilters({ keyword: '', status: undefined });
            setPriorityFilter('ALL');
            setTodayOnly(false);
          }}
        >
          重置筛选
        </button>
      </div>
    </section>
  );

  const renderProjectCard = (
    <section className="card glass">
      <div className="section-head">
        <div>
          <p className="eyebrow">项目</p>
        </div>
      </div>
      <div className="form-row">
        <input
          placeholder="项目名称"
          value={projectForm.name}
          onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          placeholder="描述 (可选)"
          value={projectForm.description}
          onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
        />
        <button className="primary" onClick={handleCreateProject}>
          创建项目
        </button>
      </div>
    </section>
  );

  const renderStatsCard = null; // no single stats card; replaced by dashboard

  const renderQuickCreate = (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">新建任务</p>
          <h3>快速录入</h3>
        </div>
        <div className="small">选择的项目：{selectedProject ?? '未选择'}</div>
      </div>
      <div className="form-row">
        <input
          placeholder="标题（必填）"
          value={taskForm.title}
          onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
        />
        <input
          placeholder="描述 / 验收标准（可选）"
          value={taskForm.description}
          onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
        />
        <select
          value={taskForm.status}
          onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={taskForm.priority}
          onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value as TaskForm['priority'] }))}
        >
          {priorityOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          step="1"
          value={taskForm.dueAt}
          onChange={(e) => setTaskForm((f) => ({ ...f, dueAt: e.target.value }))}
        />
        <button
          className="secondary"
          type="button"
          onClick={() => {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const mi = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setTaskForm((f) => ({ ...f, dueAt: `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}` }));
          }}
        >
          当前时间
        </button>
        <input
          placeholder="标签，逗号分隔（例：前端, 登录）"
          value={taskForm.tags}
          onChange={(e) => setTaskForm((f) => ({ ...f, tags: e.target.value }))}
        />
        <button className="primary" onClick={handleCreateTask} disabled={!selectedProject}>
          创建任务
        </button>
      </div>
    </section>
  );

  const renderAccountCard = (
    <section className="card account-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">账号</p>
          <h3>账号信息</h3>
        </div>
        <div className="account-actions">
          {!isLoggedIn && (
            <button className="secondary" type="button" onClick={() => setShowLogin(true)}>
              去登录
            </button>
          )}
          {isLoggedIn && (
            <button className="secondary" type="button" onClick={handleLogout}>
              退出登录
            </button>
          )}
        </div>
      </div>
      <div className="account-body">
        <div className="avatar" style={{ backgroundImage: `url(${profile.avatar})` }} />
        <div className="small muted">当前会员：{selectedPlan.toUpperCase()}</div>
        <div className="form-row">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="用户名"
            disabled={!isLoggedIn}
          />
          <div className="email-line">邮箱：{profile.email}</div>
        </div>
        <div className="chips">
          <button
            className="chip"
            type="button"
          onClick={() =>
              setProfile((p) => ({
                ...p,
                avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${Date.now()}`,
              }))
            }
            disabled={!isLoggedIn}
          >
            随机头像
          </button>
          <label className="chip upload">
            选择头像
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={!isLoggedIn} hidden />
          </label>
          <button className="chip ghost" type="button" onClick={handleSaveProfile}>
            保存
          </button>
          {!isLoggedIn && <span className="small">未登录：信息不可修改</span>}
        </div>
      </div>
    </section>
  );

  const renderTable = (
    <section className="card wide">
      <div className="section-head">
        <h3>任务列表</h3>
        {loading && <span className="small">加载中...</span>}
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>完成</th>
              <th>标题</th>
              <th>状态</th>
              <th>优先级</th>
              <th>截止</th>
              <th>标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={task.status === 'DONE'}
                    onChange={(e) => handleStatusChange(task.id, e.target.checked ? 'DONE' : 'TODO')}
                  />
                </td>
                <td>
                  <div className="task-title">{task.title}</div>
                  <div className="small">{task.description}</div>
                </td>
                <td>
                  <span className={`badge status-${task.status}`}>{task.status}</span>
                </td>
                <td>
                  <select
                    value={task.priority}
                    onChange={(e) => handlePriorityChange(task.id, e.target.value as typeof priorityOptions[number])}
                    disabled={!isLoggedIn}
                  >
                    {priorityOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{formatDateTime(task.dueAt)}</td>
                <td>
                  {task.tags?.map((t) => (
                    <span key={t} className="tag-chip">
                      {t}
                    </span>
                  ))}
                </td>
                <td>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button className="secondary" onClick={() => handleArchive(task.id)}>
                    归档
                  </button>
                  <button className="secondary danger" onClick={() => handleDelete(task.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {!filteredTasks.length && (
              <tr>
                <td colSpan={7} className="small">
                  暂无任务
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderBoard = (
    <section className="card wide">
      <div className="section-head">
        <h3>看板视图</h3>
        {loading && <span className="small">加载中...</span>}
      </div>
      <div className="board">
        {statusOptions.map((s) => (
          <div key={s} className="board-column">
            <div className="board-head">
              <span>{s}</span>
              <span className="pill">{filteredTasks.filter((t) => t.status === s).length}</span>
            </div>
            <div className="board-list">
              {filteredTasks
                .filter((t) => t.status === s)
                .map((task) => (
                  <div key={task.id} className="card shadow-sm">
                    <div className="task-title">{task.title}</div>
                    <div className="small">{task.description}</div>
                    <div className="badge subtle">{task.priority}</div>
                    <div className="small">{formatDateTime(task.dueAt)}</div>
                    <div className="board-actions">
                      <button className="secondary" onClick={() => handleStatusChange(task.id, 'DONE')} disabled={!isLoggedIn}>
                        完成✓
                      </button>
                      <select
                        value={task.priority}
                        onChange={(e) => handlePriorityChange(task.id, e.target.value as typeof priorityOptions[number])}
                        disabled={!isLoggedIn}
                      >
                        {priorityOptions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      >
                        {statusOptions.map((s2) => (
                          <option key={s2} value={s2}>
                            {s2}
                          </option>
                        ))}
                      </select>
                      <button className="secondary danger" onClick={() => handleDelete(task.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderStatsView = (
    <section className="card dashboard full">
      <div className="dashboard-head">
        <div className="dash-title">
          <div className="icon-cube" />
          <div>
            <p className="eyebrow">产品运营数据分析</p>
            <h2>数据概览</h2>
          </div>
        </div>
      </div>

      <div className="top-cards colorful">
        <div className="tile gradient-blue">
          <p className="tile-label">总任务</p>
          <h3 className="tile-value">{stats.total}</h3>
          <div className="tile-bar"><div style={{ width: '68%' }} /></div>
        </div>
        <div className="tile gradient-purple">
          <p className="tile-label">已完成</p>
          <h3 className="tile-value">{stats.done}</h3>
          <div className="tile-bar"><div style={{ width: `${gaugePct}%` }} /></div>
        </div>
        <div className="tile gradient-orange">
          <p className="tile-label">进行中</p>
          <h3 className="tile-value">{stats.doing}</h3>
          <div className="tile-bar"><div style={{ width: '70%' }} /></div>
        </div>
        <div className="tile gradient-green">
          <p className="tile-label">高/紧急</p>
          <h3 className="tile-value">{highCount}</h3>
          <div className="tile-bar"><div style={{ width: '70%' }} /></div>
        </div>
      </div>

      <div className="dash-grid-2">
        <div className="card mini viz-card">
          <div className="section-head">
            <h4>状态占比</h4>
          </div>
          <div className="donut unified" style={{ background: statusGradient }}>
            <div className="donut-center">
              <div className="value">{gaugePct}%</div>
              <div className="label">完成率</div>
            </div>
          </div>
          <div className="donut-hint">
            {hoverSlice
              ? `${segments.find((s) => s.key === hoverSlice)?.label}：${segments.find((s) => s.key === hoverSlice)?.value ?? 0} 个`
              : '悬停查看详情，点击筛选'}
          </div>
          <div className="legend grid-2">
            {segments.map((s) => (
              <div
                key={s.key}
                className={`legend-row ${filters.status === s.key ? 'active' : ''}`}
                onMouseEnter={() => setHoverSlice(s.key)}
                onMouseLeave={() => setHoverSlice(null)}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    status: f.status === s.key ? undefined : s.key,
                  }))
                }
              >
                <span className="dot" style={{ background: s.color }} />
                {s.label} {s.value}
              </div>
            ))}
          </div>
        </div>

        <div className="card mini viz-card">
          <div className="section-head">
            <h4>状态分布</h4>
          </div>
          <div className="bars animated">
            {segments.map((s) => {
              const pct = stats.total ? Math.round((s.value / stats.total) * 100) : 0;
              return (
                <div key={s.key} className="bar-row">
                  <div className="bar-label">{s.label}</div>
                  <div className="bar-track">
                    <div className="bar-fill bar-anim" style={{ width: `${pct}%`, background: s.color }}>
                      <span>{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card mini viz-card">
          <div className="section-head">
            <h4>优先级堆叠</h4>
          </div>
          <div className="stack-bar glow">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => {
              const val = priorityCounts[p];
              const pct = stats.total ? Math.round((val / stats.total) * 100) : 0;
              const color =
                p === 'CRITICAL' ? '#ef4444' : p === 'HIGH' ? '#f97316' : p === 'MEDIUM' ? '#6366f1' : '#22c55e';
              return (
                <div key={p} className="stack-seg bar-anim" style={{ width: `${pct}%`, background: color }}>
                  {val > 0 && <span>{p} {pct}%</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card mini viz-card">
          <div className="section-head">
            <h4>今日/超期</h4>
          </div>
          <div className="metric-pair">
            <div>
              <p className="label">今日到期</p>
              <p className="value accent-blue">{dueTodayCount}</p>
            </div>
            <div>
              <p className="label">超期</p>
              <p className="value" style={{ color: '#ef4444' }}>{overdueCount}</p>
            </div>
          </div>
          <div className="bars animated">
            {[dueTodayCount, overdueCount].map((v, i) => (
              <div key={i} className="bar-row">
                <div className="bar-label">{i === 0 ? '今日' : '超期'}</div>
                <div className="bar-track">
                  <div className="bar-fill bar-anim" style={{ width: `${Math.min(100, v * 20)}%`, background: i === 0 ? '#2563eb' : '#ef4444' }}>
                    <span>{v}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card mini viz-card">
          <div className="section-head">
            <h4>7日创建趋势</h4>
          </div>
          <div className="trend-bars">
            {(() => {
              const max = Math.max(...creationTrend.map((x) => x.value), 1);
              return creationTrend.map((d) => {
                const height = (d.value / max) * 100;
                return (
                  <div key={d.label} className="trend-bar" title={`${d.label} 新建 ${d.value} 个`}>
                    <div className="trend-fill" style={{ height: `${height}%` }} />
                    <span className="trend-label">{d.label}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="card mini viz-card">
          <div className="section-head">
            <h4>标签热度 Top6</h4>
          </div>
          {tagHot.length === 0 && <div className="small">暂无标签数据</div>}
          <div className="bars animated">
            {tagHot.map(([tag, cnt]) => {
              const pct = stats.total ? Math.round((cnt / stats.total) * 100) : 0;
              return (
                <div key={tag} className="bar-row">
                  <div className="bar-label">#{tag}</div>
                  <div className="bar-track">
                    <div className="bar-fill bar-anim" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)' }}>
                      <span>{cnt} 个</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );

  const renderStore = (
    <section className="card wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">没良心商店</p>
          <h3>升级与支持</h3>
        </div>
        <div className="small">支持支付宝 / VISA / BTC / ETH（演示）</div>
      </div>
      <div className="pricing-grid">
        {products.map((p) => (
          <div
            key={p.id}
            className={`pricing-card ${selectedPlan === p.id ? 'active' : ''}`}
            onClick={() => setSelectedPlan(p.id)}
          >
            <div className="pricing-title">
              <div className="name">{p.name}</div>
              {selectedPlan === p.id && <span className="pill small-pill">已选择</span>}
            </div>
            <div className="pricing-desc">{p.desc}</div>
            <div className="pricing-price">US${p.price}</div>
            {(p.id === 'plus' || p.id === 'pro') && <div className="small muted align-end">每个月</div>}
            <div className="pricing-divider" />
            <div className="store-pay vertical">
              <button className="pay alipay" onClick={() => handleCheckout(p.id, 'alipay')}>支付宝</button>
              <button className="pay visa" onClick={() => handleCheckout(p.id, 'visa')}>VISA</button>
              <button className="pay btc" onClick={() => handleCheckout(p.id, 'btc')}>BTC</button>
              <button className="pay eth" onClick={() => handleCheckout(p.id, 'eth')}>ETH</button>
            </div>
          </div>
        ))}
      </div>
      <div className="small">提示：支付仅为前端演示，需接入真实网关后才能完成。</div>
    </section>
  );

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="logo">TODO 清单</div>
          <nav className="nav">
            <button className={`nav-btn ${activeView === 'list' ? 'active' : ''}`} onClick={() => setActiveView('list')}>
              列表视图
            </button>
            <button className={`nav-btn ${activeView === 'board' ? 'active' : ''}`} onClick={() => setActiveView('board')}>
              看板视图
            </button>
            <button className={`nav-btn ${activeView === 'stats' ? 'active' : ''}`} onClick={() => setActiveView('stats')}>
              数据概览
            </button>
            <button className={`nav-btn ${activeView === 'store' ? 'active' : ''}`} onClick={() => setActiveView('store')}>
              没良心商店
            </button>
          </nav>
          <div className="sidebar-footer">
            <button className="nav-btn ghost" onClick={() => setDarkMode((v) => !v)}>
              {darkMode ? '切换亮色' : '切换暗色'}
            </button>
          <button className="nav-btn danger" onClick={handleClearDb}>
            清空数据库
          </button>
          </div>
        </aside>
        <div className="app">
          {toast && (
            <div className={`toast ${toast.type}`}>
              {toast.type === 'success' ? '✅' : '⚠️'} {toast.text}
            </div>
          )}
          <header className="hero">
            <div>
              <p className="eyebrow">Project Workspace</p>
              <h1>TODO 清单</h1>
              <p className="sub">按项目管理任务，快速筛选、更新状态、查看进度。</p>
            </div>
            <div className="hero-actions">
              <select
                value={selectedProject ?? ''}
                onChange={(e) => setSelectedProject(Number(e.target.value))}
              >
                <option value="" disabled>
                  选择项目
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button className="primary" onClick={() => setSelectedProject(projects[0]?.id ?? null)} disabled={!projects.length}>
                回到首个项目
              </button>
            </div>
          </header>

          <div className="grid">
            {activeView === 'list' && (
              <>
                {renderProjectCard}
                {renderStatsCard}
                {renderQuickCreate}
                {renderAccountCard}
                {renderTable}
              </>
            )}

            {activeView === 'board' && (
              <>
                {renderFilters}
                {renderBoard}
              </>
            )}

            {activeView === 'stats' && renderStatsView}

            {activeView === 'store' && renderStore}
          </div>
        </div>
      </div>

      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{loginMode === 'login' ? '账号登录' : '注册账号'}</h3>
            <input
              placeholder="邮箱"
              value={loginForm.email}
              onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              type="password"
              placeholder="密码"
              value={loginForm.password}
              onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
            />
            {loginMode === 'register' && (
              <input
                type="password"
                placeholder="确认密码"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
            )}
            {loginMode === 'register' && (
              <>
                <div className="form-row">
                  <input
                    placeholder="邮箱验证码"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                  <button
                    className="secondary"
                    type="button"
                    disabled={codeSending || !loginForm.email.trim()}
                    onClick={async () => {
                      if (!loginForm.email.trim()) {
                        setToast({ type: 'error', text: '请先填写邮箱' });
                        return;
                      }
                      try {
                        setCodeSending(true);
                        console.log('sending code to', loginForm.email);
                        await sendCode(loginForm.email);
                        setToast({ type: 'success', text: '验证码已发送到邮箱' });
                      } catch (err) {
                        console.error('send code failed', err);
                        setToast({ type: 'error', text: '发送失败，请检查后端邮件配置' });
                      } finally {
                        setCodeSending(false);
                      }
                    }}
                  >
                    {codeSending ? '发送中...' : '发送验证码'}
                  </button>
                </div>
              </>
            )}
            <div className="chips">
              <button
                className={`chip ${loginMode === 'login' ? 'active' : ''}`}
                type="button"
                onClick={() => setLoginMode('login')}
              >
                登录
              </button>
              <button
                className={`chip ${loginMode === 'register' ? 'active' : ''}`}
                type="button"
                onClick={() => setLoginMode('register')}
              >
                注册
              </button>
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowLogin(false)}>取消</button>
              {loginMode === 'login' ? (
                <button className="primary" onClick={handleLogin}>登录</button>
              ) : (
                <button className="primary" onClick={handleRegister}>注册</button>
              )}
            </div>
            <p className="small">使用后端 JWT 登录，注册成功后再登录。</p>
          </div>
        </div>
      )}
      <div className="social-dock">
        {socialLinks.map((s) => (
          <a key={s.href} href={s.href} target="_blank" rel="noreferrer" title={s.label}>
            <img src={s.icon} alt={s.label} />
          </a>
        ))}
      </div>
    </>
  );
}
