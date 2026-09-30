import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, FolderGit2, Sparkles, Copy, Check } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface InviteAcceptPageProps {
  currentUser?: UserProfile;
  isAuthenticated: boolean;
  onJoinProject: (projectId: string, role: UserRole, user: UserProfile) => void | Promise<void>;
}

export const InviteAcceptPage: React.FC<InviteAcceptPageProps> = ({
  currentUser,
  isAuthenticated,
  onJoinProject
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || searchParams.get('name') || 'Dự án KBase';
  const role = (searchParams.get('role') as UserRole) || 'User';
  const inviter = searchParams.get('inviter') || 'Quản trị viên';
  const code = searchParams.get('code') || `KB-${projectName.toUpperCase().slice(0, 4)}-999`;

  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptInvite = async () => {
    if (!isAuthenticated || !currentUser) return;
    setIsProcessing(true);
    try {
      await onJoinProject(projectId, role, currentUser);
      navigate(projectId ? `/projects/${projectId}` : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tham gia dự án.');
      setIsProcessing(false);
    }
  };

  const handleGoogleSignInToJoin = async () => {
    if (!supabase) {
      setError('Hệ thống Supabase chưa được cấu hình.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Lưu thông tin lời mời để khi Google redirect về sẽ tự động nhận
    localStorage.setItem(
      'kbase_pending_invite',
      JSON.stringify({
        projectId,
        projectName,
        role,
        inviter,
        code
      })
    );

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href
        }
      });
      if (signInError) {
        setError(signInError.message);
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đăng nhập bằng Google.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v14h7V6H4zm9 0h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 2v12h5V8h-5z" />
          </svg>
        </div>
        <span className="text-2xl font-bold tracking-tight text-blue-600">KBase</span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.08)] p-7 sm:p-8 animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
            <FolderGit2 className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Lời mời tham gia nhóm dự án
          </span>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {projectName}
          </h1>

          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            <b className="text-slate-800">{inviter}</b> đã gửi lời mời bạn tham gia không gian lưu trữ và cộng tác dự án này trên KBase.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Project Invite Details Box */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Vai trò được cấp:</span>
            <span className="font-bold text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-100/80 uppercase text-[11px]">
              {role}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">Mã mời nhóm:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Sao chép mã mời"
                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isAuthenticated && currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-blue-200"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{currentUser.name}</div>
                <div className="text-[11px] text-blue-600 truncate">{currentUser.email || 'Đã đăng nhập'}</div>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            <button
              onClick={handleAcceptInvite}
              disabled={isProcessing}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Chấp nhận lời mời & Mở dự án</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignInToJoin}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 shadow-sm transition-all flex items-center justify-center gap-3 hover:border-slate-400 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isProcessing ? 'Đang chuyển hướng...' : 'Đăng nhập Google để vào nhóm'}</span>
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Nhấp để xác thực tài khoản Google của bạn và tự động tham gia nhóm dự án.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
