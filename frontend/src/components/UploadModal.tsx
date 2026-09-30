import React, { useState } from 'react';
import { X, UploadCloud, Cloud, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { FileItem, Project, FileType, UserProfile } from '../types';
import { uploadToSupabase, isSupabaseConfigured } from '../lib/supabase';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  defaultProjectTitle?: string;
  currentUser?: UserProfile;
  onUpload: (newFile: FileItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  projects,
  defaultProjectTitle,
  currentUser,
  onUpload
}) => {
  const isSystemAdmin = String(currentUser?.role).toUpperCase() === 'ADMIN';
  const isSystemOwner = String(currentUser?.role).toUpperCase() === 'OWNER';

  // Dự án được phép upload: Admin/Owner hệ thống hoặc là Owner/Admin trong members của project
  const isProjectUploadAllowed = (projTitle: string) => {
    if (isSystemAdmin || isSystemOwner) return true;
    const proj = projects.find((p) => p.title === projTitle);
    if (!proj) return false;
    const member = proj.members?.find((m) =>
      (currentUser?.email && m.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && m.name?.toLowerCase() === currentUser.name.toLowerCase())
    );
    return member?.role === 'Owner' || member?.role === 'Admin';
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedProject, setSelectedProject] = useState(defaultProjectTitle || projects[0]?.title || 'Digital Marketing Campaign');

  const isSelectedProjectAllowed = isProjectUploadAllowed(selectedProject);

  React.useEffect(() => {
    if (defaultProjectTitle) {
      setSelectedProject(defaultProjectTitle);
    }
  }, [defaultProjectTitle, isOpen]);

  const [fileType, setFileType] = useState<FileType>('PDF');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    setErrorMessage(null);

    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) setFileType('PDF');
    else if (name.endsWith('.docx') || name.endsWith('.doc')) setFileType('Word');
    else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) setFileType('Excel');
    else if (name.endsWith('.pptx') || name.endsWith('.ppt')) setFileType('PowerPoint');
    else if (name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) setFileType('Image');
    else if (name.match(/\.(mp4|mov|avi|mkv)$/i)) setFileType('Video');
    else if (name.match(/\.(txt|md|json|log|xml)$/i)) setFileType('Text');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    if (!isSelectedProjectAllowed) {
      setErrorMessage(`Bạn không có quyền tải lên file vào dự án "${selectedProject}" (chỉ Owner hoặc Admin mới có quyền).`);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    let storageUrl = '';
    const fileSize = selectedFile ? selectedFile.size : 1887436; // 1.8 MB default

    try {
      // 1. Nếu đã cấu hình Supabase -> Upload file lên Supabase Storage bucket
      if (isSupabaseConfigured && selectedFile) {
        const uploadResult = await uploadToSupabase(selectedFile, 'documents');
        storageUrl = uploadResult.url;
      } else {
        storageUrl = `https://storage.kbase.team/files/${encodeURIComponent(fileName)}`;
      }

      // 2. Lưu metadata vào Database PostgreSQL qua Backend Spring Boot
      const matchedProj = projects.find((p) => p.title === selectedProject);
      const projId = matchedProj?.numericId || (matchedProj ? parseInt(matchedProj.id.replace('proj-', '')) : 1);

      const uploaderName = currentUser?.name || 'System Admin';
      const uploaderAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      const uploaderId = currentUser?.id && !isNaN(Number(currentUser.id)) ? parseInt(currentUser.id) : 1;

      await fetch('http://localhost:8080/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projId,
          fileName: fileName,
          fileType: fileType,
          fileSizeBytes: fileSize,
          storageUrl: storageUrl,
          uploadedBy: uploaderId,
          uploadedByName: uploaderName,
          uploadedByAvatar: uploaderAvatar
        })
      }).catch((err) => console.log('Backend not reachable, saved locally:', err));

      const newFileItem: FileItem = {
        id: `file-${Date.now()}`,
        name: fileName,
        size: formatFileSize(fileSize),
        type: fileType,
        project: selectedProject,
        projectId: projId,
        storageUrl: storageUrl,
        uploadedBy: {
          name: uploaderName,
          avatar: uploaderAvatar,
          initials: uploaderName.slice(0, 2).toUpperCase()
        },
        modified: 'Just now'
      };

      onUpload(newFileItem);
      setSelectedFile(null);
      setFileName('');
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Lỗi khi upload file lên Supabase Storage');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Upload New Document</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Status Banner */}
        <div className="mt-4 p-2.5 rounded-xl border flex items-center justify-between text-xs bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2">
            <Cloud className={`w-4 h-4 ${isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span className="font-medium text-slate-700">Storage Provider:</span>
            <span className="font-semibold text-slate-900">Supabase Storage</span>
          </div>
          {isSupabaseConfigured ? (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full flex items-center gap-1" title="Xem file frontend/.env để điền key">
              <AlertCircle className="w-3 h-3" />
              Cần điền key .env
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Drag and drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Drag and drop files here, or{' '}
              <label className="text-blue-600 hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports PDF, DOCX, XLSX, PPTX, MP4, PNG (Max 100MB)
            </p>
            {selectedFile && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-medium">
                <span>📎 {selectedFile.name}</span>
                <span className="text-blue-500 font-normal">({formatFileSize(selectedFile.size)})</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              File Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Strategy Review.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {projects.map((p) => {
                  const allowed = isProjectUploadAllowed(p.title);
                  return (
                    <option key={p.id} value={p.title}>
                      {p.title} {!allowed ? '(Chỉ xem - User)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                File Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="PDF">PDF Document</option>
                <option value="Word">Word Document (.docx)</option>
                <option value="Excel">Excel Spreadsheet</option>
                <option value="PowerPoint">PowerPoint Slide</option>
                <option value="Image">Image Asset</option>
                <option value="Video">Video Recording</option>
                <option value="Text">Text File (.txt, .md)</option>
              </select>
            </div>
          </div>

          {!isSelectedProjectAllowed && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Quyền User: Bạn bị cấm tải lên file vào dự án "{selectedProject}" (chỉ Owner hoặc Admin mới có quyền).</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !fileName.trim() || !isSelectedProjectAllowed}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading to Cloud...</span>
                </>
              ) : (
                <span>Upload Document</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
