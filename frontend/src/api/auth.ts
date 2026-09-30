import { UserProfile } from '../types';

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  token?: string;
}

const API_BASE_URL = 'http://localhost:8080/api';

export async function loginWithApi(identifier: string, pass: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: identifier,
        password: pass
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Incorrect account or password..'
      };
    }

    return {
      success: true,
      token: data.token,
      user: {
        id: String(data.id),
        email: data.email,
        name: data.name,
        role: data.role,
        avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      }
    };
  } catch {
    return {
      success: false,
      error: 'Cannot connect to Backend API (http://localhost:8080). Please start PostgreSQL & Spring Boot backend!'
    };
  }
}

export async function registerWithApi(fullName: string, email: string, pass: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName,
        email,
        password: pass
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Đăng ký không thành công. Vui lòng thử lại.'
      };
    }

    return {
      success: true,
      token: data.token,
      user: {
        id: String(data.id),
        email: data.email,
        name: data.name,
        role: data.role,
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=2563eb&color=fff`
      }
    };
  } catch {
    return {
      success: false,
      error: 'Không thể kết nối đến Backend API (http://localhost:8080). Hãy đảm bảo Backend đã khởi động!'
    };
  }
}
