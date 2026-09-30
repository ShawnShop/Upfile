import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, FolderClosed } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsGrid } from './components/StatsGrid';
import { RecentProjects } from './components/RecentProjects';
import { RecentFiles } from './components/RecentFiles';
import { CreateProjectModal } from './components/CreateProjectModal';
import { UploadModal } from './components/UploadModal';
import { AIModal } from './components/AIModal';
import { LoginPage } from './components/LoginPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { ProjectsPage } from './components/ProjectsPage';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { InviteMemberModal } from './components/InviteMemberModal';
import { InviteAcceptPage } from './components/InviteAcceptPage';
import { FilePreviewModal } from './components/FilePreviewModal';
import { AdminPage } from './components/AdminPage';
import { fetchProjects, createProjectApi, deleteProjectApi, addProjectMemberApi } from './api/projects';
import { fetchDocuments, deleteDocumentApi } from './api/documents';
import { syncGoogleUserApi } from './api/users';
import { Project, FileItem, UserProfile, StatMetric, ProjectMember, UserRole } from './types';
import { supabase } from './lib/supabase';

// Component wrapper for /projects/:id route
function ProjectDetailRoute({
  projects,
  isLoading,
  currentUser,
  files,
  onOpenUpload,
  onOpenInvite,
  onDeleteFile,
  onDeleteProject,
  onSelectProject
}: {
  projects: Project[];
  isLoading: boolean;
  currentUser: UserProfile;
  files: FileItem[];
  onOpenUpload: () => void;
  onOpenInvite: () => void;
  onDeleteFile: (fileId: string, rawId?: number) => void;
  onDeleteProject: (projectId: string, numericId?: number) => void;
  onSelectProject: (proj: Project) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === id || (p.numericId && String(p.numericId) === id));

  useEffect(() => {
    if (project) {
      onSelectProject(project);
    }
  }, [project]);

  if (isLoading && !project) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center animate-in fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-xs text-slate-400">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <FolderClosed className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Project Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          The requested project does not exist or may have been removed.
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          Back to My Projects
        </button>
      </div>
    );
  }

  return (
    <ProjectDetailPage
      project={project}
      currentUser={currentUser}
      files={files}
      onBack={() => navigate('/projects')}
      onOpenUpload={onOpenUpload}
      onOpenInvite={onOpenInvite}
      onDeleteFile={onDeleteFile}
      onDeleteProject={(pId, numId) => {
        onDeleteProject(pId, numId);
        navigate('/projects');
      }}
    />
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current URL route belongs to the dedicated Admin Portal
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Dedicated Admin Authentication State
  const [adminUser, setAdminUser] = useState<UserProfile | null>(() => {
    const savedAdmin = localStorage.getItem('kbase_admin_user') || sessionStorage.getItem('kbase_admin_user');
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        if (parsed && String(parsed.role).toUpperCase() === 'ADMIN') return parsed;
      } catch {}
    }
    const savedUser = localStorage.getItem('kbase_user') || sessionStorage.getItem('kbase_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && String(parsed.role).toUpperCase() === 'ADMIN') return parsed;
      } catch {}
    }
    return {
      id: '2',
      email: 'admin',
      name: 'System Admin',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (localStorage.getItem('kbase_admin_auth') === 'true' || sessionStorage.getItem('kbase_admin_auth') === 'true') {
      return true;
    }
    const savedUser = localStorage.getItem('kbase_user') || sessionStorage.getItem('kbase_user');
    if ((localStorage.getItem('kbase_auth') === 'true' || sessionStorage.getItem('kbase_auth') === 'true') && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return String(parsed.role).toUpperCase() === 'ADMIN';
      } catch {}
    }
    return false;
  });

  // Regular User Workspace Authentication State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('kbase_user') || sessionStorage.getItem('kbase_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      id: '1',
      email: 'alex@kbase.team',
      name: 'Alex Nguyen',
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('kbase_auth') === 'true' || sessionStorage.getItem('kbase_auth') === 'true';
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tải dữ liệu thật từ SQL qua Backend API khi đăng nhập
  const loadData = async () => {
    setIsLoading(true);
    const activeProfile = user || adminUser;
    const activeName = activeProfile?.name || 'Administrator';
    const activeAvatar = activeProfile?.avatar || '';

    try {
      const pData = await fetchProjects(activeName, activeAvatar);
      if (pData.length > 0) setProjects(pData);

      const dData = await fetchDocuments(undefined, pData);
      if (dData.length > 0) setFiles(dData);
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động kiểm tra và đồng bộ vai trò mới nhất của tài khoản từ PostgreSQL
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      syncGoogleUserApi({
        email: user.email,
        fullName: user.name,
        avatarUrl: user.avatar
      }).then((synced) => {
        if (synced && synced.role) {
          const freshRole = synced.role.toUpperCase() as any;
          if (freshRole !== user.role || String(synced.id) !== user.id) {
            const updatedProfile: UserProfile = {
              ...user,
              id: String(synced.id),
              role: freshRole,
              name: synced.fullName || user.name,
              avatar: synced.avatarUrl || user.avatar
            };
            setUser(updatedProfile);
            localStorage.setItem('kbase_user', JSON.stringify(updatedProfile));
          }
        }
      });
    }
  }, [isAuthenticated, user?.email]);

  // Listen to Supabase OAuth (Google) authentication
  useEffect(() => {
    if (!supabase) return;

    const extractUserData = (gUser: any): UserProfile => {
      const meta = gUser.user_metadata || {};
      const identityData = gUser.identities?.[0]?.identity_data || {};
      const fullName = meta.full_name || meta.name || identityData.full_name || identityData.name || gUser.email?.split('@')[0] || 'Google User';
      const avatarUrl =
        meta.avatar_url ||
        meta.picture ||
        identityData.avatar_url ||
        identityData.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2563eb&color=fff`;

      return {
        id: gUser.id,
        email: gUser.email || '',
        name: fullName,
        role: 'USER',
        avatar: avatarUrl,
      };
    };

    // Check existing or returned OAuth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = extractUserData(session.user);
        setUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem('kbase_auth', 'true');
        localStorage.setItem('kbase_user', JSON.stringify(profile));

        // Tự động đồng bộ tài khoản Google vào PostgreSQL để Admin quản lý và lấy role chính xác
        if (profile.email) {
          syncGoogleUserApi({
            email: profile.email,
            fullName: profile.name,
            avatarUrl: profile.avatar
          }).then((synced) => {
            if (synced && synced.role) {
              const updatedProfile: UserProfile = {
                ...profile,
                id: String(synced.id),
                role: (synced.role || 'USER').toUpperCase() as any,
                name: synced.fullName || profile.name,
                avatar: synced.avatarUrl || profile.avatar
              };
              setUser(updatedProfile);
              localStorage.setItem('kbase_user', JSON.stringify(updatedProfile));
            }
          });
        }

        // Kiểm tra xem có lời mời dự án nào đang chờ sau khi đăng nhập không
        const pendingStr = localStorage.getItem('kbase_pending_invite');
        if (pendingStr) {
          try {
            const pending = JSON.parse(pendingStr);
            localStorage.removeItem('kbase_pending_invite');
            const destId = pending.projectId ? (String(pending.projectId).startsWith('proj-') ? pending.projectId : `proj-${pending.projectId}`) : '';
            if (pending.projectId) {
              const numId = parseInt(String(pending.projectId).replace('proj-', ''), 10);
              if (!isNaN(numId)) {
                addProjectMemberApi(numId, {
                  name: profile.name,
                  email: profile.email || `${profile.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                  role: pending.role || 'User',
                  avatar: profile.avatar
                }).then(() => {
                  fetchProjects(profile.name, profile.avatar).then(refreshed => {
                    if (refreshed.length > 0) setProjects(refreshed);
                  });
                });
              }
            }
            showToast(`Chào mừng bạn tham gia dự án "${pending.projectName}"!`);
            if (destId) {
              navigate(`/projects/${destId}`);
            }
          } catch {}
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const profile = extractUserData(session.user);
        setUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem('kbase_auth', 'true');
        localStorage.setItem('kbase_user', JSON.stringify(profile));

        // Tự động đồng bộ tài khoản Google vào PostgreSQL để Admin quản lý và lấy role chính xác
        if (profile.email) {
          syncGoogleUserApi({
            email: profile.email,
            fullName: profile.name,
            avatarUrl: profile.avatar
          }).then((synced) => {
            if (synced && synced.role) {
              const updatedProfile: UserProfile = {
                ...profile,
                id: String(synced.id),
                role: (synced.role || 'USER').toUpperCase() as any,
                name: synced.fullName || profile.name,
                avatar: synced.avatarUrl || profile.avatar
              };
              setUser(updatedProfile);
              localStorage.setItem('kbase_user', JSON.stringify(updatedProfile));
            }
          });
        }

        // Kiểm tra xem có lời mời dự án nào đang chờ sau khi đăng nhập không
        const pendingStr = localStorage.getItem('kbase_pending_invite');
        if (pendingStr) {
          try {
            const pending = JSON.parse(pendingStr);
            localStorage.removeItem('kbase_pending_invite');
            const destId = pending.projectId ? (String(pending.projectId).startsWith('proj-') ? pending.projectId : `proj-${pending.projectId}`) : '';
            if (pending.projectId) {
              const numId = parseInt(String(pending.projectId).replace('proj-', ''), 10);
              if (!isNaN(numId)) {
                addProjectMemberApi(numId, {
                  name: profile.name,
                  email: profile.email || `${profile.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                  role: pending.role || 'User',
                  avatar: profile.avatar
                }).then(() => {
                  fetchProjects(profile.name, profile.avatar).then(refreshed => {
                    if (refreshed.length > 0) setProjects(refreshed);
                  });
                });
              }
            }
            showToast(`Chào mừng bạn tham gia dự án "${pending.projectName}"!`);
            if (destId) {
              navigate(`/projects/${destId}`);
              return;
            }
          } catch {}
        }

        // Tuyệt đối không redirect về /dashboard nếu đang ở trang Admin hoặc route Admin
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin')) {
          return;
        }

        // Chỉ redirect về /dashboard khi người dùng vừa chủ động đăng nhập tại trang /login
        if (event === 'SIGNED_IN' && (currentPath === '/login' || currentPath === '/')) {
          showToast(`Welcome back, ${profile.name}!`);
          navigate('/dashboard');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated || isAdminAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isAdminAuthenticated]);

  // Đồng bộ số lượng file và dung lượng thực tế cho từng dự án dựa trên danh sách files
  const syncedProjects = useMemo(() => {
    return projects.map((p) => {
      const pFiles = files.filter(
        (f) => (p.numericId && f.projectId === p.numericId) || f.project === p.title
      );
      const actualCount = pFiles.length;

      // Tính tổng dung lượng thực tế của các file trong dự án
      let totalBytes = 0;
      pFiles.forEach((f) => {
        const sizeStr = f.size || '';
        const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB|B)/i);
        if (match) {
          const num = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === 'KB') totalBytes += num * 1024;
          else if (unit === 'MB') totalBytes += num * 1024 * 1024;
          else if (unit === 'GB') totalBytes += num * 1024 * 1024 * 1024;
          else totalBytes += num;
        }
      });

      let calculatedStorage = p.storageUsed;
      if (actualCount > 0 && totalBytes > 0) {
        if (totalBytes >= 1024 * 1024 * 1024) {
          calculatedStorage = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        } else if (totalBytes >= 1024 * 1024) {
          calculatedStorage = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        } else if (totalBytes >= 1024) {
          calculatedStorage = `${Math.round(totalBytes / 1024)} KB`;
        } else {
          calculatedStorage = `${totalBytes} B`;
        }
      } else if (actualCount === 0) {
        calculatedStorage = '0 B';
      }

      return {
        ...p,
        filesCount: actualCount,
        storageUsed: calculatedStorage
      };
    });
  }, [projects, files]);

  // Tổng dung lượng Cloud Storage của tất cả files
  const totalCloudStorageMB = useMemo(() => {
    let totalBytes = 0;
    files.forEach((f) => {
      const match = (f.size || '').match(/([\d.]+)\s*(KB|MB|GB|B)/i);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'KB') totalBytes += num * 1024;
        else if (unit === 'MB') totalBytes += num * 1024 * 1024;
        else if (unit === 'GB') totalBytes += num * 1024 * 1024 * 1024;
        else totalBytes += num;
      }
    });
    return totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : '84.5';
  }, [files]);

  const stats: StatMetric[] = [
    {
      id: '1',
      label: 'Total Projects',
      value: String(syncedProjects.length || 3),
      icon: 'folder'
    },
    {
      id: '2',
      label: 'Total Files',
      value: String(files.length || 0),
      icon: 'file'
    },
    {
      id: '3',
      label: 'Team Members',
      value: '4',
      icon: 'users'
    },
    {
      id: '4',
      label: 'Cloud Storage Used',
      value: totalCloudStorageMB,
      unit: 'MB',
      icon: 'storage',
      progress: Math.min(100, Math.round((parseFloat(totalCloudStorageMB) / 250) * 100))
    }
  ];

  const handleLogin = (authenticatedUser: UserProfile, remember: boolean) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    localStorage.setItem('kbase_last_portal', 'user');
    if (remember) {
      localStorage.setItem('kbase_auth', 'true');
      localStorage.setItem('kbase_user', JSON.stringify(authenticatedUser));
    } else {
      sessionStorage.setItem('kbase_auth', 'true');
    }
    showToast(`Welcome back, ${authenticatedUser.name}!`);
    navigate('/dashboard');
  };

  const handleAdminLogin = (authenticatedAdmin: UserProfile, remember: boolean) => {
    setAdminUser(authenticatedAdmin);
    setIsAdminAuthenticated(true);
    if (!isAuthenticated) {
      setUser(authenticatedAdmin);
      setIsAuthenticated(true);
    }
    // Luôn lưu vào localStorage để khi tắt tab mở lại vẫn giữ phiên đăng nhập Admin
    localStorage.setItem('kbase_admin_auth', 'true');
    localStorage.setItem('kbase_admin_user', JSON.stringify(authenticatedAdmin));
    localStorage.setItem('kbase_last_portal', 'admin');
    if (!remember) {
      sessionStorage.setItem('kbase_admin_auth', 'true');
    }
    showToast(`Administrator verified. Welcome, ${authenticatedAdmin.name}!`);
    navigate('/admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    localStorage.removeItem('kbase_admin_auth');
    localStorage.removeItem('kbase_admin_user');
    localStorage.removeItem('kbase_last_portal');
    sessionStorage.removeItem('kbase_admin_auth');
    sessionStorage.removeItem('kbase_admin_user');
    showToast('Signed out of Administrator Console.');
    navigate('/admin/login');
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setIsAuthenticated(false);
    localStorage.removeItem('kbase_auth');
    localStorage.removeItem('kbase_user');
    sessionStorage.removeItem('kbase_auth');
    showToast('Signed out successfully.');
    navigate('/login');
  };

  // Add project handler
  const handleCreateProject = async (newProjectData: Omit<Project, 'id' | 'updatedTime' | 'filesCount' | 'membersCount'>) => {
    if (String(user.role).toUpperCase() === 'USER') {
      showToast('Tài khoản quyền USER chỉ có quyền xem tài liệu và chat AI. Vui lòng liên hệ Admin để nâng cấp lên OWNER!');
      return;
    }

    const success = await createProjectApi({
      title: newProjectData.title,
      description: newProjectData.description,
      ownerId: user.id && !isNaN(Number(user.id)) ? parseInt(user.id) : 1
    });

    if (success) {
      const refreshed = await fetchProjects(user.name, user.avatar);
      if (refreshed.length > 0) {
        const created = refreshed.find(p => p.title === newProjectData.title);
        if (created?.numericId && user.email) {
          await addProjectMemberApi(created.numericId, {
            name: user.name,
            email: user.email,
            role: String(user.role).toUpperCase() === 'ADMIN' ? 'Admin' : 'Owner',
            avatar: user.avatar
          });
          const reRefreshed = await fetchProjects(user.name, user.avatar);
          if (reRefreshed.length > 0) {
            setProjects(reRefreshed);
          } else {
            setProjects(refreshed);
          }
        } else {
          setProjects(refreshed);
        }
      }
      showToast(`Project "${newProjectData.title}" created successfully!`);
    } else {
      showToast(`Failed to create project "${newProjectData.title}". Please try again!`);
    }
  };

  // Delete project handler
  const handleDeleteProject = async (projectId: string, numericId?: number) => {
    if (numericId) {
      await deleteProjectApi(numericId);
    }
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
    navigate('/projects');
    showToast('Project deleted successfully.');
  };

  // Add file handler
  const handleUploadFile = (newFile: FileItem) => {
    setFiles([newFile, ...files]);
    // update project filesCount locally
    setProjects((prev) =>
      prev.map((p) => {
        if (p.title === newFile.project || (selectedProject && p.id === selectedProject.id)) {
          return { ...p, filesCount: (p.filesCount || 0) + 1 };
        }
        return p;
      })
    );
    showToast(`Document "${newFile.name}" uploaded successfully!`);
  };

  // Delete file handler
  const handleDeleteFile = async (fileId: string, rawId?: number) => {
    if (rawId) {
      await deleteDocumentApi(rawId);
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('File removed successfully.');
  };

  // Invite member handler
  const handleInviteMember = async (newMember: ProjectMember) => {
    if (!selectedProject) return;

    if (selectedProject.numericId) {
      await addProjectMemberApi(selectedProject.numericId, {
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        avatar: newMember.avatar
      });
      const refreshed = await fetchProjects(user.name, user.avatar);
      if (refreshed.length > 0) {
        setProjects(refreshed);
        const updatedTarget = refreshed.find(p => p.id === selectedProject.id || p.numericId === selectedProject.numericId);
        if (updatedTarget) setSelectedProject(updatedTarget);
      }
    } else {
      const updatedMembers = [...(selectedProject.members || []), newMember];
      const updatedProj = {
        ...selectedProject,
        members: updatedMembers,
        membersCount: updatedMembers.length
      };

      setSelectedProject(updatedProj);
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? updatedProj : p))
      );
    }

    showToast(`Đã gửi email lời mời tới ${newMember.email}!`);
  };

  // Join project handler (from invite link / code)
  const handleJoinProject = async (projectId: string, role: UserRole, joiningUser: UserProfile) => {
    const cleanId = String(projectId).replace('proj-', '');
    const numId = parseInt(cleanId, 10);
    const targetProject = projects.find(
      (p) => (p.numericId && String(p.numericId) === cleanId) || p.id === projectId || p.id === `proj-${cleanId}`
    );

    const email = joiningUser.email || `${joiningUser.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

    if (!isNaN(numId)) {
      await addProjectMemberApi(numId, {
        name: joiningUser.name,
        email: email,
        role: role || 'User',
        avatar: joiningUser.avatar
      });
      const refreshed = await fetchProjects(user.name, user.avatar);
      if (refreshed.length > 0) {
        setProjects(refreshed);
        const updated = refreshed.find((p) => (p.numericId && p.numericId === numId) || p.id === projectId || p.id === `proj-${cleanId}`);
        if (updated) setSelectedProject(updated);
      }
    } else if (targetProject) {
      const alreadyMember = targetProject.members?.some(
        (m) => (joiningUser.email && m.email.toLowerCase() === joiningUser.email.toLowerCase()) || m.name === joiningUser.name
      );

      if (!alreadyMember) {
        const newMem: ProjectMember = {
          id: `mem-${Date.now()}`,
          name: joiningUser.name,
          email: email,
          role: role || 'User',
          avatar: joiningUser.avatar,
          joinedAt: 'Just now'
        };

        const updatedMembers = [...(targetProject.members || []), newMem];
        const updatedProj = {
          ...targetProject,
          members: updatedMembers,
          membersCount: updatedMembers.length
        };

        setSelectedProject(updatedProj);
        setProjects((prev) => prev.map((p) => (p.id === targetProject.id ? updatedProj : p)));
      }
    }
    showToast(`Chào mừng bạn gia nhập dự án "${targetProject?.title || 'KBase'}"!`);
  };

  // File action handler for RecentFiles
  const handleFileAction = (action: string, file: FileItem) => {
    if (action === 'delete') {
      handleDeleteFile(file.id, file.rawId);
    } else if (action === 'preview') {
      setPreviewFile(file);
    } else if (action === 'download') {
      if (file.storageUrl) {
        window.open(file.storageUrl, '_blank');
      } else {
        showToast(`Downloading "${file.name}"...`);
      }
    } else if (action === 'share') {
      showToast(`Link to "${file.name}" copied to clipboard!`);
    }
  };

  // Filter projects & files based on global search query
  const filteredProjects = syncedProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.uploadedBy.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========================================================
  // 1. DEDICATED ADMIN PORTAL (TRANG ADMIN RIÊNG BIỆT HOÀN TOÀN)
  // ========================================================
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#0B0F19]">
        <Routes>
          <Route
            path="/admin/login"
            element={
              isAdminAuthenticated && adminUser && String(adminUser.role).toUpperCase() === 'ADMIN' ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminLoginPage onAdminLogin={handleAdminLogin} />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAdminAuthenticated && adminUser && String(adminUser.role).toUpperCase() === 'ADMIN' ? (
                <AdminPage
                  currentUser={adminUser}
                  projects={syncedProjects}
                  files={files}
                  onDeleteFile={handleDeleteFile}
                  onDeleteProject={handleDeleteProject}
                  showToast={showToast}
                  onLogout={handleAdminLogout}
                />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-slate-700">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // ========================================================
  // 2. REGULAR USER AUTHENTICATION GATE
  // ========================================================
  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} initialMode="login" />} />
          <Route path="/register" element={<LoginPage onLogin={handleLogin} initialMode="register" />} />
          <Route
            path="/invite"
            element={
              <InviteAcceptPage
                currentUser={user}
                isAuthenticated={false}
                onJoinProject={handleJoinProject}
              />
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar navigation */}
      <Sidebar
        user={user}
        onOpenSearch={() => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          input?.focus();
        }}
        onOpenAI={() => setIsAIOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 px-8 lg:px-12 py-8 max-w-[1400px] w-full mx-auto">
          <Routes>
            {/* Redirect / to /admin if last active in admin, else /dashboard */}
            <Route
              path="/"
              element={
                localStorage.getItem('kbase_last_portal') === 'admin' &&
                (localStorage.getItem('kbase_admin_auth') === 'true' || sessionStorage.getItem('kbase_admin_auth') === 'true') ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />

            {/* TAB 1: DASHBOARD */}
            <Route
              path="/dashboard"
              element={
                <div className="space-y-8 animate-in fade-in duration-150">
                  {/* Welcome Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Good morning, {user.name.split(' ')[0]} <span className="text-2xl">👋</span>
                      </h1>
                      <p className="text-sm text-slate-500 mt-1">
                        Here's what's happening across your project knowledge base.
                      </p>
                    </div>

                    {/* Top Action Button */}
                    <div className="flex items-center gap-2.5 self-start sm:self-center">
                      <button
                        onClick={() => {
                          setSelectedProject(null);
                          setIsUploadOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Document</span>
                      </button>
                    </div>
                  </div>

                  {/* Stats Cards Grid */}
                  <StatsGrid stats={stats} />

                  {/* Recent Projects Section */}
                  <RecentProjects
                    projects={filteredProjects}
                    canCreateProject={String(user?.role).toUpperCase() === 'ADMIN' || String(user?.role).toUpperCase() === 'OWNER'}
                    onCreateProject={() => setIsCreateProjectOpen(true)}
                    onOpenProject={(project) => {
                      setSelectedProject(project);
                      navigate(`/projects/${project.id}`);
                    }}
                    onViewAll={() => {
                      setSelectedProject(null);
                      navigate('/projects');
                    }}
                  />

                  {/* Recent Files Section */}
                  <RecentFiles
                    files={filteredFiles}
                    onFileAction={handleFileAction}
                  />
                </div>
              }
            />

            {/* TAB 2: MY PROJECTS */}
            <Route
              path="/projects"
              element={
                <ProjectsPage
                  projects={filteredProjects}
                  currentUser={user}
                  onCreateProject={() => setIsCreateProjectOpen(true)}
                  onOpenProject={(project) => {
                    setSelectedProject(project);
                    navigate(`/projects/${project.id}`);
                  }}
                  onQuickUpload={(project) => {
                    setSelectedProject(project);
                    setIsUploadOpen(true);
                  }}
                  onDeleteProject={handleDeleteProject}
                />
              }
            />

            {/* TAB 3: PROJECT DETAIL */}
            <Route
              path="/projects/:id"
              element={
                <ProjectDetailRoute
                  projects={syncedProjects}
                  isLoading={isLoading}
                  currentUser={user}
                  files={files}
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onOpenInvite={() => setIsInviteOpen(true)}
                  onDeleteFile={handleDeleteFile}
                  onDeleteProject={handleDeleteProject}
                  onSelectProject={setSelectedProject}
                />
              }
            />

            {/* TAB 4: RECENT FILES */}
            <Route
              path="/recent"
              element={
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Files</h1>
                      <p className="text-xs text-slate-500 mt-1">
                        All documents uploaded across your projects ({files.length} items)
                      </p>
                    </div>
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload File</span>
                    </button>
                  </div>

                  <RecentFiles
                    files={filteredFiles}
                    onFileAction={handleFileAction}
                  />
                </div>
              }
            />

            {/* TAB 5: SETTINGS */}
            <Route
              path="/settings"
              element={
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm max-w-2xl animate-in fade-in duration-150">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Account Settings</h2>
                  <p className="text-xs text-slate-500 mb-6">Manage your credentials, roles, and connected storage</p>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
                        }}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{user.name}</h4>
                        <p className="text-slate-500">{user.email || 'admin@kbase.team'}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                          Role: {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <h5 className="font-semibold text-slate-800">Connected Services</h5>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Database</span>
                        <span className="font-semibold text-emerald-600">PostgreSQL (Connected)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>File Storage</span>
                        <span className="font-semibold text-emerald-600">Supabase Storage (Active)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>REST API & Docs</span>
                        <a href="http://localhost:8080/swagger-ui/index.html" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          Swagger UI (8080)
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            {/* TAB 6: INVITATION ACCEPT ROUTE */}
            <Route
              path="/invite"
              element={
                <InviteAcceptPage
                  currentUser={user}
                  isAuthenticated={true}
                  onJoinProject={handleJoinProject}
                />
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Interactive Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreate={handleCreateProject}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        projects={syncedProjects}
        defaultProjectTitle={selectedProject?.title}
        currentUser={user}
        onUpload={handleUploadFile}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={selectedProject?.numericId || selectedProject?.id}
        projectName={selectedProject?.title || 'Current Project'}
        inviterName={user.name}
        onInvite={handleInviteMember}
      />

      <AIModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
