export interface ApiUser {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OWNER' | 'USER' | string;
  avatarUrl?: string;
  authProvider?: 'LOCAL' | 'GOOGLE' | string;
  createdAt?: string;
}

export async function fetchUsersApi(): Promise<ApiUser[]> {
  try {
    const res = await fetch('http://localhost:8080/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return sample fallback if offline
    return [
      {
        id: 1,
        email: 'admin@kbase.team',
        fullName: 'System Admin',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-09-01T08:00:00'
      },
      {
        id: 2,
        email: 'owner@kbase.team',
        fullName: 'Alex Nguyen',
        role: 'OWNER',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-09-05T09:30:00'
      },
      {
        id: 3,
        email: 'user@kbase.team',
        fullName: 'Sarah Lee',
        role: 'USER',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-09-10T14:15:00'
      }
    ];
  }
}

export async function createUserApi(data: {
  fullName: string;
  email: string;
  role: string;
  password?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; data?: ApiUser; error?: string }> {
  try {
    const res = await fetch('http://localhost:8080/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to create user' };
    }
    const created = await res.json();
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function updateUserApi(
  id: number,
  data: {
    fullName?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
    password?: string;
  }
): Promise<{ success: boolean; data?: ApiUser; error?: string }> {
  try {
    const res = await fetch(`http://localhost:8080/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to update user' };
    }
    const updated = await res.json();
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export async function deleteUserApi(id: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:8080/api/users/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function syncGoogleUserApi(data: {
  email: string;
  fullName: string;
  avatarUrl?: string;
}): Promise<ApiUser | null> {
  try {
    const res = await fetch('http://localhost:8080/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, authProvider: 'GOOGLE' })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error syncing Google user:', error);
    return null;
  }
}
