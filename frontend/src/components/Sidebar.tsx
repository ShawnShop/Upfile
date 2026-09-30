import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  FolderClosed,
  Clock,
  Search,
  Sparkles,
  Settings,
  ChevronsUpDown,
  LogOut,
  User
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  user: UserProfile;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenSearch?: () => void;
  onOpenAI?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onOpenSearch,
  onOpenAI,
  onLogout
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Determine active item based on current URL path
  const path = location.pathname;
  let currentActive = 'dashboard';
  if (path.startsWith('/projects')) {
    currentActive = 'projects';
  } else if (path.startsWith('/recent')) {
    currentActive = 'recent';
  } else if (path.startsWith('/settings')) {
    currentActive = 'settings';
  } else if (path === '/' || path.startsWith('/dashboard')) {
    currentActive = 'dashboard';
  }

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    path?: string;
    badge?: string;
    action?: () => void;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
    { id: 'projects', label: 'My Projects', icon: FolderClosed, path: '/projects' },
    { id: 'recent', label: 'Recent Files', icon: Clock, path: '/recent' },
    { id: 'search', label: 'Search', icon: Search, action: onOpenSearch },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, action: onOpenAI },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 select-none z-20">
      {/* Top Branding & Navigation */}
      <div className="pt-6 px-4">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-3 mb-8 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v14h7V6H4zm9 0h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 2v12h5V8h-5z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-600 flex items-center gap-0.5">
            KBase
          </span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActive === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-4 border-t border-slate-100 relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
              }}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 ring-2 ring-transparent group-hover:ring-blue-100 transition-all"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">
                {user.name}
              </div>
              <div className="text-xs text-slate-400 capitalize">
                {user.role}
              </div>
            </div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0 ml-1" />
        </button>

        {/* Profile Dropdown Popup */}
        {showProfileMenu && (
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-500">Signed in as</p>
              <p className="text-xs font-semibold text-slate-800 truncate">{user.email || 'user@kbase.team'}</p>
            </div>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <User className="w-4 h-4 text-slate-400" />
              View Profile
            </button>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Account Settings
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => {
                setShowProfileMenu(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
