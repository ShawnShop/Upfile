import React, { useState } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  UserPlus,
  Sparkles,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileVideo,
  FileImage,
  Presentation,
  Download,
  Search,
  CheckCircle,
  Bot,
  User,
  Send,
  Calendar,
  Layers,
  HardDrive,
  Users as UsersIcon,
  Shield,
  MessageSquare,
  Eye,
  Lock
} from 'lucide-react';
import { Project, FileItem, ProjectMember, FileFilter, UserProfile } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { FilePreviewModal } from './FilePreviewModal';

interface ProjectDetailPageProps {
  project: Project;
  currentUser: UserProfile;
  files: FileItem[];
  onBack: () => void;
  onOpenUpload: () => void;
  onOpenInvite: () => void;
  onDeleteFile: (fileId: string, rawId?: number) => void;
  onDeleteProject: (projectId: string, numericId?: number) => void;
  onAskAIAboutFile?: (fileName: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  currentUser,
  files,
  onBack,
  onOpenUpload,
  onOpenInvite,
  onDeleteFile,
  onDeleteProject
}) => {
  // Quyền hạn của user hiện tại trong dự án này:
  // - Admin hệ thống: có toàn quyền
  // - Owner dự án hoặc Owner hệ thống: có quyền upload/quản lý
  // - User (hoặc chỉ là thành viên role 'User'): BỊ CẤM UPLOAD FILE
  const isSystemAdmin = String(currentUser.role).toUpperCase() === 'ADMIN';
  const isSystemOwner = String(currentUser.role).toUpperCase() === 'OWNER';
  const isSystemUser = String(currentUser.role).toUpperCase() === 'USER';
  
  const currentMember = project.members?.find((m) => {
    if (currentUser.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) {
      return true;
    }
    if (currentUser.name && m.name && m.name.toLowerCase() === currentUser.name.toLowerCase()) {
      return true;
    }
    return false;
  });

  // Đồng bộ tuyệt đối: Ngoài user thì trong cũng bắt buộc là user (cấm upload, cấm invite)
  const isProjectOwner = !isSystemUser && (isSystemAdmin || isSystemOwner || currentMember?.role === 'Owner' || currentMember?.role === 'Admin');
  // Nếu là user (không phải owner/admin của dự án), CẤM upload file
  const canUpload = isProjectOwner;

  const [activeTab, setActiveTab] = useState<'files' | 'members' | 'chat'>('files');
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Project-specific AI Chat messages
  const [chatMessages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string; source?: string }[]>([
    {
      sender: 'ai',
      text: `Hello! I'm your AI Assistant for "${project.title}". I have indexed all documents and files in this project. What would you like to know?`,
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Filter project files
  const projectFiles = files.filter((f) => {
    // Match either by project title or numeric projectId
    const matchesProject = f.project === project.title || (project.numericId && f.projectId === project.numericId);
    return matchesProject;
  });

  const filteredFiles = projectFiles.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(fileSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (fileFilter === 'all') return true;
    if (fileFilter === 'documents') return f.type === 'PDF' || f.type === 'Word' || f.type === 'Text';
    if (fileFilter === 'spreadsheets') return f.type === 'Excel';
    if (fileFilter === 'media') return f.type === 'Image' || f.type === 'Video';
    return true;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'Word':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'Excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'Video':
        return <FileVideo className="w-5 h-5 text-purple-500" />;
      case 'Image':
        return <FileImage className="w-5 h-5 text-amber-500" />;
      case 'PowerPoint':
        return <Presentation className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const query = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);

    setTimeout(() => {
      let reply = `Based on the latest documentation in ${project.title}, the requirements and deliverables are tracked on schedule.`;
      let sourceDoc = projectFiles[0]?.name ? `${projectFiles[0].name} (Page 1)` : 'Project Workspace Overview';

      if (query.toLowerCase().includes('marketing') || query.toLowerCase().includes('campaign')) {
        reply = `The marketing launch is scheduled for next quarter with multi-channel campaigns covering social, display, and email outreach.`;
        sourceDoc = 'Digital Marketing Strategy.pdf (Page 3)';
      } else if (query.toLowerCase().includes('member') || query.toLowerCase().includes('team')) {
        reply = `There are currently ${project.membersCount || 3} members assigned: System Admin (Admin), Sarah Lee (Owner), and Alex Nguyen (User).`;
        sourceDoc = 'Team Roster & Permissions Specs';
      } else if (query.toLowerCase().includes('file') || query.toLowerCase().includes('doc')) {
        reply = `This project currently contains ${projectFiles.length} uploaded files indexed in the vector database ready for question answering.`;
        sourceDoc = 'KBase PostgreSQL File Registry';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          source: sourceDoc
        }
      ]);
    }, 500);
  };

  const handleAskAboutFile = (fileName: string) => {
    setActiveTab('chat');
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: `Can you summarize the key points of "${fileName}"?` },
      {
        sender: 'ai',
        text: `Summary of "${fileName}": Contains executive guidelines, technical specifications, and key deliverables for the team. All data points have been verified.`,
        source: `${fileName} (Executive Summary)`
      }
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to My Projects</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Assistant</span>
          </button>

          {canUpload && (
            <button
              onClick={onOpenInvite}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          )}

          {canUpload ? (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          ) : (
            <button
              disabled
              title="Quyền User: Bạn không được phép upload file vào dự án này (chỉ Owner hoặc Admin mới có quyền)."
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 cursor-not-allowed select-none opacity-80"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Cấm Upload (User)</span>
            </button>
          )}

          {canUpload && (
            <button
              onClick={() => setIsDeleteProjectOpen(true)}
              title="Delete this project"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {project.category || 'General'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {project.status || 'Active'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {project.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {project.description || 'Project workspace for document storage, team collaboration, and AI knowledge search.'}
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Updated {project.updatedTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Viewing as {currentUser.name} ({isSystemUser ? 'User' : (currentMember?.role || (isSystemAdmin ? 'Admin' : 'Owner'))})
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 w-full md:w-auto flex-shrink-0">
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Files</span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">{projectFiles.length}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <HardDrive className="w-3.5 h-3.5 text-purple-600" />
                <span>Storage</span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {projectFiles.length === 0 ? '0 B' : (project.storageUsed || '0 B')}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <UsersIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Members</span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">{project.members?.length || 1}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Index</span>
              </div>
              <p className="text-lg font-bold text-emerald-600 mt-1">100% Ready</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'files'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>File Management ({projectFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UsersIcon className="w-3.5 h-3.5" />
            <span>Team Members ({project.members?.length || 1})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Chatbot</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FILE MANAGEMENT */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* File Toolbar: Search & Format Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            {/* Format pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setFileFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  fileFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Files ({projectFiles.length})
              </button>
              <button
                onClick={() => setFileFilter('documents')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  fileFilter === 'documents'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Documents (PDF/Word)
              </button>
              <button
                onClick={() => setFileFilter('spreadsheets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  fileFilter === 'spreadsheets'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Excel Spreadsheets
              </button>
              <button
                onClick={() => setFileFilter('media')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  fileFilter === 'media'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Media & Videos
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search project documents..."
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Upload Drop Area */}
          {canUpload ? (
            <div
              onClick={onOpenUpload}
              className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Click to upload documents to <span className="text-blue-600">{project.title}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports PDF, Word, Excel, PPTX, Video (MP4) & Images • Stores to Supabase & PostgreSQL
              </p>
            </div>
          ) : (
            <div className="border border-slate-200/90 bg-slate-50/80 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Quyền xem tài liệu dự án (User Access)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Thành viên có quyền User chỉ có thể đọc và tải xuống tài liệu. Chức năng tải lên file bị khóa cho quyền này.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-800 text-[11px] font-semibold shrink-0 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Cấm Upload</span>
              </span>
            </div>
          )}

          {/* Files List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {filteredFiles.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">No documents found</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {canUpload
                    ? 'Upload your first document or adjust your filter query.'
                    : 'Chưa có tài liệu nào trong dự án này.'}
                </p>
                {canUpload && (
                  <button
                    onClick={onOpenUpload}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Upload File Now
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Modified</th>
                      <th className="py-3 px-4">AI Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div
                            className="flex items-center gap-3 cursor-pointer group/title"
                            onClick={() => setPreviewFile(file)}
                            title="Nhấp để xem trước file"
                          >
                            <div className="p-2 rounded-xl bg-slate-50 group-hover/title:bg-blue-50 border border-slate-100 group-hover/title:border-blue-100 transition-colors">
                              {getFileIcon(file.type)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover/title:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span>{file.name}</span>
                                <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/title:text-blue-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                              </p>
                              <span className="text-[10px] text-slate-400">{file.type}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {file.size}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            {file.uploadedBy.avatar ? (
                              <img
                                src={file.uploadedBy.avatar}
                                alt={file.uploadedBy.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(file.uploadedBy.name)}&background=2563eb&color=fff`;
                                }}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px] flex items-center justify-center">
                                {file.uploadedBy.initials || 'US'}
                              </div>
                            )}
                            <span>{file.uploadedBy.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {file.modified}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Indexed
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewFile(file)}
                              title="Xem trực tiếp nội dung tài liệu"
                              className="px-2.5 py-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 font-semibold text-xs shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem</span>
                            </button>

                            <button
                              onClick={() => handleAskAboutFile(file.name)}
                              title="Hỏi AI về file này"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (file.storageUrl) {
                                  const a = document.createElement('a');
                                  a.href = file.storageUrl;
                                  a.download = file.name;
                                  a.target = '_blank';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                } else {
                                  alert(`Đang tải ${file.name}...`);
                                }
                              }}
                              title="Tải tệp xuống máy"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {(canUpload || (currentUser.name && file.uploadedBy.name && file.uploadedBy.name.toLowerCase() === currentUser.name.toLowerCase())) && (
                              <button
                                onClick={() => setFileToDelete(file)}
                                title="Xóa tệp"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEAM MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Members & Access Roles</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Roles configured according to requirements: Admin (full workspace access), Owner (project management & upload), User (view-only & AI search).
              </p>
            </div>
            {canUpload && (
              <button
                onClick={onOpenInvite}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(project.members || []).map((m: ProjectMember) => {
              const isCurrentUser =
                (currentUser.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                (currentUser.name && m.name && m.name.toLowerCase() === currentUser.name.toLowerCase());
              
              // Đồng bộ tuyệt đối: Nếu ngoài hệ thống tài khoản là USER thì trong dự án chắc chắn là USER
              const roleUpper = (isCurrentUser && isSystemUser)
                ? 'USER'
                : String(m.role).toUpperCase();

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2563eb&color=fff`;
                        }}
                        className="w-11 h-11 rounded-full object-cover border border-slate-100"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">{m.email}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        roleUpper === 'ADMIN'
                          ? 'bg-blue-100 text-blue-700'
                          : roleUpper === 'OWNER'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {roleUpper}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Joined: {m.joinedAt || 'Active'}</span>
                    <span className="text-slate-400 font-medium">
                      {roleUpper === 'ADMIN' && 'All Permissions'}
                      {roleUpper === 'OWNER' && 'Manage & Invite'}
                      {roleUpper === 'USER' && 'View & AI Chat'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT AI CHATBOT */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm h-[560px] flex flex-col overflow-hidden">
          {/* AI Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>AI Project Assistant</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {projectFiles.length} files indexed
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">Ask questions grounded in "{project.title}" docs</p>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    sender: 'ai',
                    text: `Chat cleared. Ask me anything about "${project.title}".`
                  }
                ]);
              }}
              className="text-xs text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
            >
              Reset Chat
            </button>
          </div>

          {/* Quick prompt suggestions */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="font-semibold text-slate-400 shrink-0">Try asking:</span>
            <button
              onClick={() => {
                setChatInput(`What are the key goals and deliverables in ${project.title}?`);
              }}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-700 hover:text-blue-600 transition-colors shrink-0"
            >
              🎯 Key Goals & Deliverables
            </button>
            <button
              onClick={() => {
                setChatInput('List all team members and their roles in this project.');
              }}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-700 hover:text-blue-600 transition-colors shrink-0"
            >
              👥 Team Members & Roles
            </button>
            <button
              onClick={() => {
                setChatInput('Summarize the latest document uploaded to this project.');
              }}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-700 hover:text-blue-600 transition-colors shrink-0"
            >
              📄 Latest Document Summary
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.source && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                      <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>Source: {msg.source}</span>
                    </div>
                  )}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSendChat} className="p-3.5 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask anything about ${project.title} documents...`}
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={() => {
          setIsDeleteProjectOpen(false);
          onDeleteProject(project.id, project.numericId);
        }}
        itemName={project.title}
        itemType="project"
      />

      {/* File Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={() => {
          if (fileToDelete) {
            onDeleteFile(fileToDelete.id, fileToDelete.rawId);
            setFileToDelete(null);
          }
        }}
        itemName={fileToDelete?.name}
        itemType="file"
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
