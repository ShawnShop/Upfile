export interface GoogleSettings {
  enableGoogleAuth: boolean;
  googleClientId: string;
  googleClientSecret: string;
  redirectUri: string;
  enableGeminiAI: boolean;
  geminiApiKey: string;
  geminiModel: string;
  geminiTemperature: number;
  smtpHost?: string;
  smtpPort?: string;
  smtpSender?: string;
  smtpStatus?: string;
}

export interface SubpageConfig {
  id: string;
  title: string;
  path: string;
  icon: string;
  description: string;
  enabled: boolean;
  requiredRole: 'ALL' | 'USER' | 'OWNER' | 'ADMIN';
}

export async function fetchGoogleConfigApi(): Promise<GoogleSettings> {
  try {
    const res = await fetch('http://localhost:8080/api/config/google');
    if (!res.ok) throw new Error('Failed to fetch google config');
    return await res.json();
  } catch (error) {
    console.error('Error fetching google config:', error);
    return {
      enableGoogleAuth: true,
      googleClientId: '948210492810-kbase-client.apps.googleusercontent.com',
      googleClientSecret: 'GOCSPX-****************************',
      redirectUri: 'http://localhost:3000/oauth2/callback/google',
      enableGeminiAI: true,
      geminiApiKey: 'AIzaSy********************************',
      geminiModel: 'gemini-1.5-flash',
      geminiTemperature: 0.7,
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpSender: 'accfbclon956@gmail.com',
      smtpStatus: 'Connected (smtp.gmail.com:587)'
    };
  }
}

export async function updateGoogleConfigApi(config: Partial<GoogleSettings>): Promise<GoogleSettings> {
  try {
    const res = await fetch('http://localhost:8080/api/config/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update google config');
    return await res.json();
  } catch (error) {
    console.error('Error updating google config:', error);
    return config as GoogleSettings;
  }
}

export async function fetchSubpagesApi(): Promise<SubpageConfig[]> {
  try {
    const res = await fetch('http://localhost:8080/api/config/subpages');
    if (!res.ok) throw new Error('Failed to fetch subpages');
    return await res.json();
  } catch (error) {
    console.error('Error fetching subpages:', error);
    return [
      { id: 'dashboard', title: 'Dashboard', path: '/dashboard', icon: 'LayoutGrid', description: 'Tổng quan KPI, thống kê dự án và tài liệu', enabled: true, requiredRole: 'ALL' },
      { id: 'projects', title: 'My Projects', path: '/projects', icon: 'FolderClosed', description: 'Quản lý và cộng tác dự án nhóm', enabled: true, requiredRole: 'ALL' },
      { id: 'project-detail', title: 'Project Details', path: '/projects/:id', icon: 'FileText', description: 'Chi tiết tài liệu, thành viên và chatbot', enabled: true, requiredRole: 'ALL' },
      { id: 'recent', title: 'Recent Files', path: '/recent', icon: 'Clock', description: 'Toàn bộ tài liệu gần đây trong kho lưu trữ', enabled: true, requiredRole: 'ALL' },
      { id: 'ai-chat', title: 'AI Assistant', path: '/ai', icon: 'Sparkles', description: 'Trợ lý hỏi đáp tài liệu thông minh', enabled: true, requiredRole: 'ALL' },
      { id: 'admin', title: 'Admin Portal', path: '/admin', icon: 'Shield', description: 'Quản trị người dùng, tệp tin và cấu hình hệ thống', enabled: true, requiredRole: 'ADMIN' },
      { id: 'swagger', title: 'API Documentation', path: 'http://localhost:8080/swagger-ui/index.html', icon: 'ExternalLink', description: 'Swagger UI thử nghiệm các REST API', enabled: true, requiredRole: 'ADMIN' },
      { id: 'settings', title: 'Account Settings', path: '/settings', icon: 'Settings', description: 'Cài đặt tài khoản cá nhân & tích hợp', enabled: true, requiredRole: 'ALL' }
    ];
  }
}

export async function updateSubpagesApi(subpages: SubpageConfig[]): Promise<SubpageConfig[]> {
  try {
    const res = await fetch('http://localhost:8080/api/config/subpages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subpages)
    });
    if (!res.ok) throw new Error('Failed to update subpages');
    return await res.json();
  } catch (error) {
    console.error('Error updating subpages:', error);
    return subpages;
  }
}
