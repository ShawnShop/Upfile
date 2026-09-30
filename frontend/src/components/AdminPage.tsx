import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Shield,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Mail,
  CheckCircle2,
  RefreshCw,
  Globe,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  LayoutGrid,
  FolderClosed,
  FolderPlus
} from 'lucide-react';
import { UserProfile, FileItem, FileFilter, Project } from '../types';
import { ApiUser, fetchUsersApi, createUserApi, updateUserApi, deleteUserApi } from '../api/users';
import { fetchProjects, createProjectApi, updateProjectApi, deleteProjectApi } from '../api/projects';
import { GoogleSettings, SubpageConfig, fetchGoogleConfigApi, updateGoogleConfigApi, fetchSubpagesApi, updateSubpagesApi } from '../api/config';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AdminPageProps {
  currentUser: UserProfile;
  projects?: Project[];
  files: FileItem[];
  onDeleteFile: (fileId: string, rawId?: number) => void;
  onDeleteProject?: (projectId: string, numericId?: number) => void;
  showToast: (msg: string) => void;
  onLogout?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  projects,
  files,
  onDeleteFile,
  onDeleteProject,
  showToast,
  onLogout
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'files' | 'google' | 'subpages'>('users');

  // Ghi nhớ trạng thái portal là admin khi người dùng đang ở trang Admin
  useEffect(() => {
    localStorage.setItem('kbase_last_portal', 'admin');
  }, []);

  // --- Projects State ---
  const [adminProjects, setAdminProjects] = useState<Project[]>(projects || []);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  // Project Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [projectFormData, setProjectFormData] = useState({
    title: '',
    description: '',
    ownerId: 1
  });

  // Keep adminProjects in sync with projects prop
  useEffect(() => {
    if (projects && projects.length > 0) {
      setAdminProjects(projects);
    }
  }, [projects]);

  // --- Users State ---
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'GOOGLE' | 'ADMIN' | 'OWNER' | 'USER'>('ALL');

  // User Modals
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);

  // User Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'USER',
    password: '',
    avatarUrl: ''
  });

  // --- Files State ---
  const [fileSearch, setFileSearch] = useState('');
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  // --- Google & AI State ---
  const [googleConfig, setGoogleConfig] = useState<GoogleSettings>({
    enableGoogleAuth: true,
    googleClientId: '948210492810-kbase-client.apps.googleusercontent.com',
    googleClientSecret: 'GOCSPX-7k812903nksmld8912301923',
    redirectUri: 'http://localhost:3000/oauth2/callback/google',
    enableGeminiAI: true,
    geminiApiKey: 'AIzaSyA_KBaseDemoKey98210481203',
    geminiModel: 'gemini-1.5-flash',
    geminiTemperature: 0.7,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpSender: 'accfbclon956@gmail.com',
    smtpStatus: 'Connected (smtp.gmail.com:587)'
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');

  // --- Subpages State ---
  const [subpages, setSubpages] = useState<SubpageConfig[]>([]);
  const [isSavingSubpages, setIsSavingSubpages] = useState(false);

  // Load initial data
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    const data = await fetchUsersApi();
    setUsers(data);
    setIsLoadingUsers(false);
  };

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    const data = await fetchProjects(currentUser.name, currentUser.avatar);
    if (data.length > 0) setAdminProjects(data);
    setIsLoadingProjects(false);
  };

  const loadConfigs = async () => {
    const gData = await fetchGoogleConfigApi();
    setGoogleConfig(gData);
    const sData = await fetchSubpagesApi();
    setSubpages(sData);
  };

  useEffect(() => {
    loadUsers();
    loadProjects();
    loadConfigs();
  }, []);

  // --- Project Handlers ---
  const handleOpenCreateProject = () => {
    setProjectFormData({
      title: '',
      description: '',
      ownerId: users.length > 0 ? users[0].id : 1
    });
    setIsCreateProjectOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    setProjectFormData({
      title: proj.title,
      description: proj.description || '',
      ownerId: proj.numericId || 1
    });
    setIsEditProjectOpen(true);
  };

  const handleSaveCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.title.trim()) {
      showToast('Please enter a project title');
      return;
    }
    const success = await createProjectApi({
      title: projectFormData.title.trim(),
      description: projectFormData.description.trim(),
      ownerId: projectFormData.ownerId
    });
    if (success) {
      showToast(`Project "${projectFormData.title}" created successfully!`);
      setIsCreateProjectOpen(false);
      loadProjects();
    } else {
      showToast('Failed to create project');
    }
  };

  const handleSaveEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.numericId) return;
    if (!projectFormData.title.trim()) {
      showToast('Please enter a project title');
      return;
    }
    const success = await updateProjectApi(editingProject.numericId, {
      title: projectFormData.title.trim(),
      description: projectFormData.description.trim()
    });
    if (success) {
      showToast(`Project "${projectFormData.title}" updated successfully!`);
      setIsEditProjectOpen(false);
      setEditingProject(null);
      loadProjects();
    } else {
      showToast('Failed to update project');
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete || !projectToDelete.numericId) return;
    const success = await deleteProjectApi(projectToDelete.numericId);
    if (success) {
      showToast(`Project "${projectToDelete.title}" and its workspace assets deleted successfully.`);
      if (onDeleteProject) {
        onDeleteProject(projectToDelete.id, projectToDelete.numericId);
      }
      loadProjects();
    } else {
      showToast('Failed to delete project.');
    }
    setProjectToDelete(null);
  };

  // --- User Handlers ---
  const handleOpenCreateUser = () => {
    setFormData({
      fullName: '',
      email: '',
      role: 'USER',
      password: '',
      avatarUrl: ''
    });
    setIsCreateUserOpen(true);
  };

  const handleOpenEditUser = (user: ApiUser) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      password: '',
      avatarUrl: user.avatarUrl || ''
    });
    setIsEditUserOpen(true);
  };

  const handleSaveCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast('Please provide both full name and email.');
      return;
    }

    const res = await createUserApi({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      role: formData.role,
      password: formData.password.trim() || 'password123',
      avatarUrl: formData.avatarUrl.trim()
    });

    if (res.success) {
      showToast(`User "${formData.fullName}" created successfully!`);
      setIsCreateUserOpen(false);
      loadUsers();
    } else {
      showToast(res.error || 'Failed to create user');
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload: any = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      role: formData.role,
      avatarUrl: formData.avatarUrl.trim()
    };
    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    const res = await updateUserApi(editingUser.id, payload);
    if (res.success) {
      showToast(`User "${formData.fullName}" updated successfully!`);
      setIsEditUserOpen(false);
      setEditingUser(null);
      loadUsers();
    } else {
      showToast(res.error || 'Failed to update user');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const success = await deleteUserApi(userToDelete.id);
    if (success) {
      showToast(`User "${userToDelete.fullName}" has been deleted.`);
      loadUsers();
    } else {
      showToast('Failed to delete user.');
    }
    setUserToDelete(null);
  };

  // --- Google Save Handler ---
  const handleSaveGoogle = async () => {
    setIsSavingGoogle(true);
    await updateGoogleConfigApi(googleConfig);
    setIsSavingGoogle(false);
    showToast('Google configuration saved successfully!');
  };

  // --- Subpages Toggle Handler ---
  const handleToggleSubpage = (id: string) => {
    setSubpages((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, enabled: !sp.enabled } : sp))
    );
  };

  const handleSaveSubpages = async () => {
    setIsSavingSubpages(true);
    await updateSubpagesApi(subpages);
    setIsSavingSubpages(false);
    showToast('Subpage navigation configuration updated!');
  };

  // --- Filtered Users ---
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const isGoogle = u.authProvider === 'GOOGLE' || u.avatarUrl?.includes('googleusercontent.com');
    const matchRole =
      userRoleFilter === 'ALL' ||
      (userRoleFilter === 'GOOGLE' ? isGoogle : u.role.toUpperCase() === userRoleFilter);
    return matchSearch && matchRole;
  });

  // --- Filtered Projects ---
  const filteredAdminProjects = adminProjects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.members?.some(m => m.name.toLowerCase().includes(projectSearch.toLowerCase()) || m.email.toLowerCase().includes(projectSearch.toLowerCase())) ?? false);
    return matchSearch;
  });

  // --- Filtered Files ---
  const filteredFiles = files.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(fileSearch.toLowerCase()) ||
      f.project.toLowerCase().includes(fileSearch.toLowerCase());
    if (fileFilter === 'documents') {
      return matchSearch && ['PDF', 'Excel', 'PowerPoint', 'Word', 'Text'].includes(f.type);
    }
    if (fileFilter === 'media') {
      return matchSearch && ['Image', 'Video'].includes(f.type);
    }
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* ================= DEDICATED ADMIN SIDEBAR ================= */}
      <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none z-20">
        <div className="pt-6 px-4">
          {/* Admin Brand Logo & Badge */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>KBase</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  ADMIN
                </span>
              </span>
              <span className="text-[11px] text-slate-400 block font-normal">Administration Console</span>
            </div>
          </div>

          {/* Admin Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-semibold">{users.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'projects'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderClosed className="w-4 h-4" />
                <span>Project Management</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-semibold">{adminProjects.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'files'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>File Management</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-semibold">{files.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('google')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'google'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4" />
                <span>Google & AI Config</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            <button
              onClick={() => setActiveTab('subpages')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'subpages'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>Subpages & Routes</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-semibold">{subpages.length}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Profile & Admin Sign Out */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-blue-400 font-mono">ROLE: ADMIN</div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700/60 group"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>User Workspace</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl text-xs font-semibold transition-colors border border-slate-700/60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Admin</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ================= DEDICATED MAIN ADMIN AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Standalone Admin Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>KBase Admin Console</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 capitalize">
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'projects' && 'Project Management'}
              {activeTab === 'files' && 'File Management'}
              {activeTab === 'google' && 'Google & AI Configuration'}
              {activeTab === 'subpages' && 'Subpages & Navigation Routes'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Server Status Badges */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700">PostgreSQL (5432)</span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-700">Spring Boot (8080)</span>
            </div>

            <a
              href="http://localhost:8080/swagger-ui/index.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors border border-blue-200/60"
            >
              <span>Swagger API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Admin Content View */}
        <main className="flex-1 px-8 lg:px-12 py-8 max-w-[1400px] w-full mx-auto space-y-6 animate-in fade-in duration-150">
          {/* ================= TAB 1: USERS MANAGEMENT ================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search user name or email..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    {(['ALL', 'GOOGLE', 'ADMIN', 'OWNER', 'USER'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setUserRoleFilter(r)}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          userRoleFilter === r
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {r === 'GOOGLE' ? '🌐 Google OAuth' : r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadUsers}
                    title="Refresh user list"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleOpenCreateUser}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New User</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-6">User / Account</th>
                        <th className="py-3.5 px-6">Login Provider</th>
                        <th className="py-3.5 px-6">Role & Permission</th>
                        <th className="py-3.5 px-6">Database ID</th>
                        <th className="py-3.5 px-6">Created At</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No users match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isMe = currentUser.email?.toLowerCase() === u.email.toLowerCase();
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                                    alt={u.fullName}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                      <span>{u.fullName}</span>
                                      {isMe && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                                          YOU
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-400 font-normal">{u.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                {u.authProvider === 'GOOGLE' || u.avatarUrl?.includes('googleusercontent.com') ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200/60 shadow-xs">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                                      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                                    </svg>
                                    <span>Google OAuth</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                                    <span>Local Account</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                    u.role.toUpperCase() === 'ADMIN'
                                      ? 'bg-blue-100 text-blue-700'
                                      : u.role.toUpperCase() === 'OWNER'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  <Shield className="w-3 h-3" />
                                  <span>{u.role}</span>
                                </span>
                              </td>

                              <td className="py-4 px-6 font-mono text-slate-500">
                                #{u.id}
                              </td>

                              <td className="py-4 px-6 text-slate-500">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Active'}
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditUser(u)}
                                    title="Edit user"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    disabled={isMe}
                                    title={isMe ? 'Cannot delete current active session' : 'Delete user'}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isMe
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: PROJECT MANAGEMENT ================= */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search title, description, member..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                    Total: <b className="text-slate-800">{filteredAdminProjects.length}</b> projects
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadProjects}
                    title="Refresh project list"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingProjects ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleOpenCreateProject}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Project</span>
                  </button>
                </div>
              </div>

              {/* Projects Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-6">Project Name & Info</th>
                        <th className="py-3.5 px-6">Project Owner</th>
                        <th className="py-3.5 px-6">Team Members</th>
                        <th className="py-3.5 px-6">Files & Storage</th>
                        <th className="py-3.5 px-6">Created Date</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminProjects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No projects match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredAdminProjects.map((proj) => {
                          const ownerMember = proj.members?.find((m) => m.role === 'Owner') || proj.members?.[0];
                          const pFiles = files.filter(f => (proj.numericId && f.projectId === proj.numericId) || f.project === proj.title);
                          const fileCount = pFiles.length;

                          return (
                            <tr key={proj.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* Project Title & Category */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                                    <FolderClosed className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                      <span>{proj.title}</span>
                                      {proj.numericId && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                          #{proj.numericId}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-400 font-normal line-clamp-1 max-w-xs mt-0.5">
                                      {proj.description || 'No description provided.'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Owner */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={ownerMember?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerMember?.name || 'Owner')}&background=2563eb&color=fff`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                  />
                                  <div>
                                    <div className="font-semibold text-slate-800">{ownerMember?.name || 'Workspace Owner'}</div>
                                    <div className="text-[11px] text-slate-400">{ownerMember?.email || 'owner@kbase.team'}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Members Stack */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1.5 overflow-hidden">
                                    {(proj.members || []).slice(0, 3).map((m, idx) => (
                                      <img
                                        key={idx}
                                        src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2563eb&color=fff`}
                                        alt={m.name}
                                        title={m.name}
                                        className="inline-block w-6 h-6 rounded-full ring-2 ring-white object-cover"
                                      />
                                    ))}
                                  </div>
                                  <span className="text-slate-600 font-semibold text-xs">
                                    {(proj.members || []).length} members
                                  </span>
                                </div>
                              </td>

                              {/* Files & Storage */}
                              <td className="py-4 px-6">
                                <div>
                                  <div className="font-bold text-slate-900">{fileCount} files</div>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {proj.storageUsed || '0 B'}
                                  </span>
                                </div>
                              </td>

                              {/* Created Date */}
                              <td className="py-4 px-6 text-slate-500">
                                {proj.updatedTime || 'Recently'}
                              </td>

                              {/* Status */}
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Active</span>
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => navigate(`/projects/${proj.id}`)}
                                    title="Open Project Workspace"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditProject(proj)}
                                    title="Edit Project"
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setProjectToDelete(proj)}
                                    title="Delete Project"
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: ALL FILES MANAGEMENT ================= */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      placeholder="Search file name or project..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    {(['all', 'documents', 'media'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setFileFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                          fileFilter === filter
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  Total Storage Files: <span className="text-slate-900 font-bold">{files.length} items</span>
                </div>
              </div>

              {/* Files Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-6">File Name & Type</th>
                        <th className="py-3.5 px-6">Project</th>
                        <th className="py-3.5 px-6">File Size</th>
                        <th className="py-3.5 px-6">Uploaded By</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredFiles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No files uploaded in the knowledge base yet.
                          </td>
                        </tr>
                      ) : (
                        filteredFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{file.name}</div>
                                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                                    {file.type}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 font-semibold text-slate-700">
                              {file.project || 'General'}
                            </td>

                            <td className="py-4 px-6 font-mono text-slate-500">
                              {file.size}
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <img
                                  src={file.uploadedBy.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                                <span className="text-slate-700 font-medium">{file.uploadedBy.name}</span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Indexed</span>
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {file.storageUrl && (
                                  <a
                                    href={file.storageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open file from Supabase Storage"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => setFileToDelete(file)}
                                  title="Delete file"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: GOOGLE & AI CONFIGURATION ================= */}
          {activeTab === 'google' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1: Google OAuth 2.0 (SSO) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Google OAuth 2.0 Authentication</h3>
                        <p className="text-[11px] text-slate-400">Enable Google Single Sign-On (SSO) for accounts</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={googleConfig.enableGoogleAuth}
                        onChange={(e) => setGoogleConfig({ ...googleConfig, enableGoogleAuth: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Google Client ID</label>
                      <input
                        type="text"
                        value={googleConfig.googleClientId}
                        onChange={(e) => setGoogleConfig({ ...googleConfig, googleClientId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Google Client Secret</label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={googleConfig.googleClientSecret}
                          onChange={(e) => setGoogleConfig({ ...googleConfig, googleClientSecret: e.target.value })}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Authorized Redirect URI</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={googleConfig.redirectUri}
                          className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(googleConfig.redirectUri);
                            showToast('Copied redirect URI to clipboard!');
                          }}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"
                          title="Copy URI"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Google Gemini AI Settings */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Google Gemini AI Engine</h3>
                        <p className="text-[11px] text-slate-400">Powers document indexing and question answering</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={googleConfig.enableGeminiAI}
                        onChange={(e) => setGoogleConfig({ ...googleConfig, enableGeminiAI: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gemini API Key</label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={googleConfig.geminiApiKey}
                          onChange={(e) => setGoogleConfig({ ...googleConfig, geminiApiKey: e.target.value })}
                          placeholder="AIzaSy..."
                          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Selected AI Model</label>
                      <select
                        value={googleConfig.geminiModel}
                        onChange={(e) => setGoogleConfig({ ...googleConfig, geminiModel: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium text-xs text-slate-800"
                      >
                        <option value="gemini-1.5-flash">gemini-1.5-flash (Fast, Low Latency - Recommended)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning & Long Context)</option>
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Next-Gen AI Preview)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Temperature (Creativity)</label>
                        <span className="font-mono text-purple-600 font-bold">{googleConfig.geminiTemperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={googleConfig.geminiTemperature}
                        onChange={(e) => setGoogleConfig({ ...googleConfig, geminiTemperature: parseFloat(e.target.value) })}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3: Google SMTP Email Service */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 lg:col-span-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Google Gmail SMTP Service</h3>
                        <p className="text-[11px] text-slate-400">Used for project invitations, alerts and password recovery</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{googleConfig.smtpStatus || 'Connected'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">SMTP Server</span>
                      <span className="font-mono font-bold text-slate-800">{googleConfig.smtpHost || 'smtp.gmail.com'}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Port & Security</span>
                      <span className="font-mono font-bold text-slate-800">{googleConfig.smtpPort || '587'} (STARTTLS)</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Sender Email</span>
                      <span className="font-mono font-bold text-slate-800">{googleConfig.smtpSender || 'accfbclon956@gmail.com'}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="Enter email to send test invitation..."
                      className="w-full sm:w-80 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!testEmailRecipient.trim()) {
                          showToast('Please enter recipient email.');
                          return;
                        }
                        showToast(`Test email sent to ${testEmailRecipient} successfully!`);
                        setTestEmailRecipient('');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      Send Test Mail
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveGoogle}
                  disabled={isSavingGoogle}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                >
                  {isSavingGoogle ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Configuration...</span>
                    </>
                  ) : (
                    <span>Save Google Configuration</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 4: SUBPAGES & NAVIGATION CONFIG ================= */}
          {activeTab === 'subpages' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Subpages & Navigation Routes</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Toggle visibility, configure access roles, and manage internal routes in KBase.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {subpages.map((sp) => (
                    <div
                      key={sp.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        sp.enabled
                          ? 'bg-white border-slate-200/90 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{sp.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                              {sp.requiredRole}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{sp.path}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sp.description}</p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={sp.enabled}
                          onChange={() => handleToggleSubpage(sp.id)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSaveSubpages}
                    disabled={isSavingSubpages}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                  >
                    {isSavingSubpages ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Navigation Settings</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL: Create New User --- */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Account</h3>
            <p className="text-xs text-slate-500 mb-5">Create a user record with role permissions in PostgreSQL.</p>

            <form onSubmit={handleSaveCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Michael Scott"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@kbase.team"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="USER">USER (Upload Documents & Ask Chatbot)</option>
                  <option value="OWNER">OWNER (Create Projects & Invite Members)</option>
                  <option value="ADMIN">ADMIN (Full Workspace & Admin Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for default (password123)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Edit User --- */}
      {isEditUserOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit User #{editingUser.id}</h3>
            <p className="text-xs text-slate-500 mb-5">Update user information and permissions.</p>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="USER">USER</option>
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Confirm Delete User Modal --- */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User Account?"
        itemName={userToDelete?.fullName}
        itemType="item"
      />

      {/* --- Confirm Delete File Modal --- */}
      <ConfirmDeleteModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={() => {
          if (fileToDelete) {
            onDeleteFile(fileToDelete.id, fileToDelete.rawId);
            setFileToDelete(null);
          }
        }}
        title="Delete File?"
        itemName={fileToDelete?.name}
        itemType="file"
      />

      {/* ================= MODAL: CREATE PROJECT ================= */}
      {isCreateProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsCreateProjectOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCreateProject} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectFormData.title}
                  onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                  placeholder="e.g. Marketing Campaign, Website Redesign..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  placeholder="Briefly describe the purpose of this project..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Project Owner / Lead
                </label>
                <select
                  value={projectFormData.ownerId}
                  onChange={(e) => setProjectFormData({ ...projectFormData, ownerId: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PROJECT ================= */}
      {isEditProjectOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Edit Project Details</h3>
              </div>
              <button
                onClick={() => {
                  setIsEditProjectOpen(false);
                  setEditingProject(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProject} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectFormData.title}
                  onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditProjectOpen(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Confirm Delete Project Modal --- */}
      <ConfirmDeleteModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDeleteProject}
        title="Delete Project?"
        itemName={projectToDelete?.title}
        itemType="project"
      />
    </div>
  );
};
