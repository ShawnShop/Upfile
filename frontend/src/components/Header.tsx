import React, { useState } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  searchQuery,
  setSearchQuery
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const notifications = [
    {
      id: 1,
      title: 'Marketing Plan.pdf uploaded',
      desc: 'Alex Nguyen added a new document to Digital Marketing Campaign',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      title: 'Website Redesign updated',
      desc: 'Sarah Lee modified Presentation.pptx',
      time: 'Yesterday',
      unread: true
    },
    {
      id: 3,
      title: 'New Member Joined',
      desc: 'Minh Tran accepted your invitation to Product Research',
      time: '3 days ago',
      unread: false
    }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Search Input Bar */}
      <div className="relative w-full max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects, files and knowledge..."
          className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) setHasUnread(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">Mark all as read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Circular Avatar */}
        <div className="cursor-pointer group">
          <img
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
            }}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 ring-2 ring-transparent group-hover:ring-blue-100 transition-all"
          />
        </div>
      </div>
    </header>
  );
};
