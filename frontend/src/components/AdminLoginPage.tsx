import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, AlertTriangle, KeyRound, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithApi } from '../api/auth';

interface AdminLoginPageProps {
  onAdminLogin: (user: UserProfile, remember: boolean) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAdminLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = email.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter your administrator username or email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);

    // Call backend login API
    const apiResult = await loginWithApi(cleanInput, password);
    setIsLoading(false);

    if (apiResult.success && apiResult.user) {
      // STRICT ROLE VERIFICATION: Only ADMIN allowed in this portal!
      const userRole = String(apiResult.user.role).toUpperCase();
      if (userRole !== 'ADMIN') {
        setErrorMessage(
          `Access Denied: Account "${apiResult.user.name}" has role [${userRole}]. Only System Administrators can access this console.`
        );
        return;
      }

      onAdminLogin(apiResult.user, rememberMe);
      return;
    }

    setErrorMessage(apiResult.error || 'Invalid administrator credentials. Access denied.');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand & Security Tag */}
      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-blue-500/20">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl font-bold tracking-tight text-white">KBase</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Admin Portal
          </span>
        </div>
        <p className="text-xs text-slate-400">Restricted System Administration Console</p>
      </div>

      {/* Admin Login Card */}
      <div className="w-full max-w-[440px] bg-[#111827]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-8 sm:p-9 relative z-10">
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Admin Authentication</h2>
            <p className="text-xs text-slate-400 mt-0.5">Please verify administrative credentials</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Email or Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Account / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin username or email"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono text-xs"
              />
            </div>
          </div>

          {/* Admin Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Admin Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span className="text-xs text-slate-400">Remember session</span>
            </label>
          </div>

          {/* Submit Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Sign In as Administrator</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Return to regular user workspace login */}
        <div className="mt-8 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to User Workspace Sign In</span>
          </button>
        </div>
      </div>

      {/* Security Disclaimer Footer */}
      <div className="mt-8 text-center text-slate-500 text-[11px] relative z-10 max-w-sm">
        Protected by KBase System Security. All administrative activities and IP addresses are monitored and logged.
      </div>
    </div>
  );
};
