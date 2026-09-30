import React, { useState } from 'react';
import { X, UserPlus, Shield, UserCheck, AlertCircle, Link2, Copy, Check } from 'lucide-react';
import { ProjectMember, UserRole } from '../types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string | number;
  projectName: string;
  inviterName?: string;
  onInvite: (member: ProjectMember) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  inviterName,
  onInvite
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('User');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  // Mã mời và link mời riêng biệt cho dự án này
  const cleanSlug = projectName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'TEAM';
  const numId = projectId ? String(projectId).replace('proj-', '') : '1';
  const inviteCode = `KB-${cleanSlug}-${numId}`;
  const inviteLink = `${window.location.origin}/invite?projectId=${numId}&projectName=${encodeURIComponent(projectName)}&code=${inviteCode}&role=${role}&inviter=${encodeURIComponent(inviterName || 'Nam Huy')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError('Vui lòng điền họ tên và email hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      // Gửi email lời mời thực tế qua Google SMTP với link và mã mời cụ thể
      await fetch('http://localhost:8080/api/projects/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanName,
          role: role,
          projectName: projectName,
          inviterName: inviterName || 'Quản trị viên',
          inviteUrl: inviteLink,
          inviteCode: inviteCode
        })
      });
    } catch (err: any) {
      console.warn('Lỗi gửi mail lời mời:', err);
    }

    const newMember: ProjectMember = {
      id: `mem-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563eb&color=fff`,
      joinedAt: 'Just now'
    };

    onInvite(newMember);
    setIsSubmitting(false);
    setName('');
    setEmail('');
    setRole('User');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Invite Team Member</h3>
              <p className="text-xs text-slate-400">Add to <span className="font-medium text-slate-700">{projectName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Shareable Invite Link & Code Card */}
        <div className="mt-4 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Link mời tham gia trực tiếp</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
              Mã: {inviteCode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none select-all truncate font-mono"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs ${
                linkCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {linkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Bạn có thể copy link này gửi trực tiếp qua Zalo, Messenger để người khác bấm vào là vào ngay nhóm!
          </p>
        </div>

        {/* Form gửi email */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2">Hoặc gửi lời mời qua Email:</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              required
              placeholder="e.g. David Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ Email người nhận
            </label>
            <input
              type="email"
              required
              placeholder="david.miller@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Vai trò & Quyền hạn
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('Admin')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'Admin'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Full control</p>
              </button>

              <button
                type="button"
                onClick={() => setRole('Owner')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'Owner'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Owner</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Manage project</p>
              </button>

              <button
                type="button"
                onClick={() => setRole('User')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'User'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>User</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">View & AI Chat</p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi mail...' : 'Gửi email thư mời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
