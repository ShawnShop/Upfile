import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Video,
  File as FileGeneric,
  CheckCircle,
  Calendar,
  HardDrive,
  AlertCircle
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { FileItem } from '../types';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: FileItem | null;
  onClose: () => void;
}

/**
 * Trình render tài liệu Word (.docx) trực tiếp trên trình duyệt bằng docx-preview
 */
const DocxViewer: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải tệp từ lưu trữ.');
        return res.blob();
      })
      .then((blob) => {
        if (!isMounted || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        return renderAsync(blob, containerRef.current, undefined, {
          className: 'docx-rendered-doc',
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false
        });
      })
      .then(() => {
        if (isMounted) setLoading(false);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Lỗi hiển thị Word:', err);
          setError(err.message || 'Không thể render file Word trực tiếp.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className="w-full h-full flex flex-col items-center overflow-auto p-2 sm:p-6 bg-slate-100/80 rounded-xl relative min-h-[450px] max-h-[72vh]">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm z-10 rounded-xl">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-xs font-semibold text-slate-700">Đang đọc & hiển thị tài liệu Word trực tiếp...</p>
        </div>
      )}

      {error ? (
        <div className="my-auto p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">Không thể nạp trực tiếp tài liệu này</h4>
          <p className="text-xs text-slate-500 mb-5">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <a
              href={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Mở qua Google Docs
            </a>
            <a
              href={url}
              download={fileName}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Tải file về máy
            </a>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="bg-white shadow-[0_4px_25px_-5px_rgba(0,0,0,0.08)] p-6 sm:p-12 rounded-xl max-w-4xl w-full text-slate-800 leading-relaxed text-sm overflow-x-auto min-h-[500px]"
        />
      )}
    </div>
  );
};

/**
 * Trình đọc text, markdown, log, code trực tiếp
 */
const TextViewer: React.FC<{ url: string }> = ({ url }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-xs text-slate-500">Đang tải văn bản...</p>
      </div>
    );
  }

  return (
    <pre className="w-full max-h-[68vh] overflow-auto p-5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed select-text shadow-inner">
      {content}
    </pre>
  );
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  file,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const fileNameLower = (file.name || '').toLowerCase();
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileNameLower) || file.type === 'Image';
  const isDocx = /\.docx$/i.test(fileNameLower) || file.type === 'Word';
  const isPdf = /\.pdf$/i.test(fileNameLower) || (file.type === 'PDF' && !/\.(docx|doc|xlsx|xls|pptx|ppt|txt|md|jpg|jpeg|png|gif|mp4)$/i.test(fileNameLower));
  const isVideo = /\.(mp4|webm|mov|mkv|avi)$/i.test(fileNameLower) || file.type === 'Video';
  const isText = /\.(txt|md|json|log|xml|csv)$/i.test(fileNameLower) || file.type === 'Text';
  const isOtherOffice = /\.(pptx|ppt|xlsx|xls|doc)$/i.test(fileNameLower) || file.type === 'Excel' || file.type === 'PowerPoint';

  const getFileIcon = () => {
    switch (file.type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'Word':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'Excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'PowerPoint':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'Video':
        return <Video className="w-5 h-5 text-purple-500" />;
      default:
        return <FileGeneric className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleDownload = () => {
    if (file.storageUrl) {
      const a = document.createElement('a');
      a.href = file.storageUrl;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`Đang tải file ${file.name}...`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-md sm:max-w-xl">
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">
                  {file.type}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-slate-400" />
                  {file.size}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {file.modified}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {file.storageUrl && (
              <a
                href={file.storageUrl}
                target="_blank"
                rel="noreferrer"
                title="Mở liên kết gốc trong tab mới"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở tab mới</span>
              </a>
            )}

            <button
              onClick={handleDownload}
              title="Tải tệp xuống"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải về</span>
            </button>

            <button
              onClick={onClose}
              title="Đóng xem trước (Esc)"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-slate-950/5 p-3 sm:p-5 overflow-auto flex items-center justify-center min-h-[350px] max-h-[72vh]">
          {isImage && file.storageUrl ? (
            <div className="flex flex-col items-center justify-center max-w-full">
              <img
                src={file.storageUrl}
                alt={file.name}
                className="max-h-[66vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200/50 bg-white"
              />
            </div>
          ) : isDocx && file.storageUrl ? (
            <DocxViewer url={file.storageUrl} fileName={file.name} />
          ) : isPdf && file.storageUrl ? (
            <iframe
              src={file.storageUrl}
              title={file.name}
              className="w-full h-[68vh] rounded-xl bg-white border border-slate-200 shadow-sm"
            />
          ) : isVideo && file.storageUrl ? (
            <video
              src={file.storageUrl}
              controls
              autoPlay={false}
              className="max-h-[66vh] max-w-full rounded-xl shadow-lg bg-black"
            >
              Trình duyệt của bạn không hỗ trợ phát video này.
            </video>
          ) : isText && file.storageUrl ? (
            <TextViewer url={file.storageUrl} />
          ) : isOtherOffice && file.storageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.storageUrl)}&embedded=true`}
                title={file.name}
                className="w-full h-[62vh] rounded-xl bg-white border border-slate-200 shadow-sm"
              />
              <div className="text-center text-xs text-slate-500">
                Nếu khung không tự nạp, bạn có thể{' '}
                <a
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(file.storageUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold underline"
                >
                  mở qua Google Docs Viewer
                </a>{' '}
                hoặc bấm nút <strong>Tải về</strong> ở trên.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                {getFileIcon()}
              </div>
              <h4 className="text-base font-bold text-slate-800">{file.name}</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Định dạng <strong>{file.type}</strong> ({file.size}). File đã được lập chỉ mục an toàn trên hệ thống lưu trữ Cloud.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {file.storageUrl && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file xuống</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 border-t border-slate-200/80 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Người tải lên:</span>
            <div className="flex items-center gap-1.5">
              {file.uploadedBy.avatar ? (
                <img
                  src={file.uploadedBy.avatar}
                  alt={file.uploadedBy.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(file.uploadedBy.name)}&background=2563eb&color=fff`;
                  }}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                  {file.uploadedBy.initials || file.uploadedBy.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-slate-700">{file.uploadedBy.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>KBase Cloud Storage (Trực tiếp)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
