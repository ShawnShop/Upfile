import { Project, ProjectMember } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const DEFAULT_MEMBERS: ProjectMember[] = [
  {
    id: 'mem-1',
    name: 'System Admin',
    email: 'admin@kbase.team',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedAt: 'Jan 2026'
  },
  {
    id: 'mem-2',
    name: 'Sarah Lee',
    email: 'sarah.lee@kbase.team',
    role: 'Owner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedAt: 'Feb 2026'
  },
  {
    id: 'mem-3',
    name: 'Alex Nguyen',
    email: 'alex.nguyen@kbase.team',
    role: 'User',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedAt: 'Mar 2026'
  }
];

export async function fetchProjects(_currentUserName?: string, _currentUserAvatar?: string): Promise<Project[]> {
  try {
    const [projRes, memRes, userRes] = await Promise.all([
      fetch(`${API_BASE_URL}/projects`),
      fetch(`${API_BASE_URL}/projects/members`).catch(() => null),
      fetch(`${API_BASE_URL}/users`).catch(() => null)
    ]);

    if (!projRes.ok) return [];
    const data = await projRes.json();

    let allDbMembers: any[] = [];
    if (memRes && memRes.ok) {
      allDbMembers = await memRes.json().catch(() => []);
    }

    let allUsers: any[] = [];
    if (userRes && userRes.ok) {
      allUsers = await userRes.json().catch(() => []);
    }

    return data.map((p: any) => {
      const isSample = p.id <= 3;

      // Tìm các thành viên thực tế trong PostgreSQL thuộc về project này
      const dbMembersForProj = allDbMembers.filter((m: any) => m.projectId === p.id);

      let projectMembers: ProjectMember[] = [];
      if (dbMembersForProj.length > 0) {
        projectMembers = dbMembersForProj.map((m: any) => {
          const matchedUser = allUsers.find(
            (u: any) => u.email && m.email && u.email.trim().toLowerCase() === m.email.trim().toLowerCase()
          );

          let resolvedRole = m.role || 'User';
          if (matchedUser && matchedUser.role) {
            const sysRole = String(matchedUser.role).toUpperCase();
            if (sysRole === 'ADMIN') resolvedRole = 'Admin';
            else if (sysRole === 'OWNER') resolvedRole = 'Owner';
            else resolvedRole = 'User';
          }

          return {
            id: `mem-${m.id}`,
            name: matchedUser?.fullName || m.name,
            email: m.email,
            role: resolvedRole,
            avatar: matchedUser?.avatarUrl || m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2563eb&color=fff`,
            joinedAt: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Recently'
          };
        });

        // Nếu là sample project (1, 2, 3), bổ sung các default members nếu chưa có trong DB
        if (isSample) {
          DEFAULT_MEMBERS.forEach(dm => {
            if (!projectMembers.some(pm => pm.email.toLowerCase() === dm.email.toLowerCase())) {
              projectMembers.push(dm);
            }
          });
        }
      } else if (isSample) {
        projectMembers = [...DEFAULT_MEMBERS];
      } else {
        projectMembers = [];
      }

      // File counts and storage:
      const filesCount = isSample ? (p.id === 1 ? 2 : p.id === 2 ? 3 : 1) : 0;
      const storageUsed = isSample ? (p.id === 1 ? '3.8 MB' : p.id === 2 ? '156.4 MB' : '860 KB') : '0 B';

      return {
        id: `proj-${p.id}`,
        numericId: p.id,
        title: p.title,
        description: p.description || 'Project workspace for team documents and collaboration.',
        category: 'General',
        status: 'Active',
        storageUsed: storageUsed,
        updatedTime: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Just now',
        filesCount: filesCount,
        membersCount: projectMembers.length,
        members: projectMembers,
        iconType: 'megaphone',
        theme: 'blue'
      };
    });
  } catch (err) {
    console.error('Failed to fetch projects from backend:', err);
    return [];
  }
}

export async function addProjectMemberApi(
  projectId: number,
  member: { name: string; email: string; role: string; avatar?: string }
): Promise<ProjectMember | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: projectId,
        name: member.name,
        email: member.email,
        role: member.role,
        avatarUrl: member.avatar
      })
    });
    if (!res.ok) return null;
    const m = await res.json();
    return {
      id: `mem-${m.id}`,
      name: m.name,
      email: m.email,
      role: m.role || 'User',
      avatar: m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2563eb&color=fff`,
      joinedAt: 'Just now'
    };
  } catch (err) {
    console.warn('Lỗi khi lưu thành viên vào backend:', err);
    return null;
  }
}

export async function createProjectApi(newProject: { title: string; description: string; ownerId?: number }): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateProjectApi(
  id: number,
  updatedData: { title?: string; description?: string; ownerId?: number }
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteProjectApi(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

