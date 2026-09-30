import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Video,
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  Share2
} from 'lucide-react';
import { FileItem, FileFilter } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RecentFilesProps {
  files: FileItem[];
  onFileAction?: (action: string, file: FileItem) => void;
}

export const RecentFiles: React.FC<RecentFilesProps> = ({
  files,
  onFileAction
}) => {
  const [filter, setFilter] = useState<FileFilter>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  // Filter logic
  const filteredFiles = files.filter((file) => {
    if (filter === 'documents') {
      return ['PDF', 'Word', 'Text', 'Excel', 'PowerPoint'].includes(file.type);
    }
    if (filter === 'media') {
      return ['Image', 'Video'].includes(file.type);
    }
    return true;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'Word':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'Excel':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        );
      case 'PowerPoint':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Presentation className="w-5 h-5" />
          </div>
        );
      case 'Image':
        return (
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
        );
      case 'Video':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Video className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PDF':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
            PDF
          </span>
        );
      case 'Word':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
            Word
          </span>
        );
      case 'Excel':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
            Excel
          </span>
        );
      case 'PowerPoint':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
            PowerPoint
          </span>
        );
      case 'Image':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-600 border border-sky-100">
            Image
          </span>
        );
      case 'Video':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-600 border border-cyan-100">
            Video
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="mt-9 mb-12">
      {/* Section Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Recent Files
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick access to the latest synchronized documents and assets.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Files
          </button>
          <button
            onClick={() => setFilter('documents')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'documents'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setFilter('media')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'media'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Media
          </button>
        </div>
      </div>

      {/* Modern Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-6 font-medium">File Name</th>
                <th className="py-3.5 px-6 font-medium">Type</th>
                <th className="py-3.5 px-6 font-medium">Project</th>
                <th className="py-3.5 px-6 font-medium">Uploaded By</th>
                <th className="py-3.5 px-6 font-medium">Modified</th>
                <th className="py-3.5 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No files found in this category.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* File Name & Size */}
                    <td
                      className="py-3.5 px-6 cursor-pointer"
                      onClick={() => onFileAction?.('preview', file)}
                      title="Nhấp để xem trước file"
                    >
                      <div className="flex items-center gap-3.5">
                        {getFileIcon(file.type)}
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>{file.name}</span>
                            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {file.size}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* File Type Badge */}
                    <td className="py-3.5 px-6">
                      {getTypeBadge(file.type)}
                    </td>

                    {/* Project Name */}
                    <td className="py-3.5 px-6 text-slate-600 text-sm">
                      {file.project}
                    </td>

                    {/* Uploaded By */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        {file.uploadedBy.avatar ? (
                          <img
                            src={file.uploadedBy.avatar}
                            alt={file.uploadedBy.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(file.uploadedBy.name)}&background=2563eb&color=fff`;
                            }}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              file.uploadedBy.initialsBg || 'bg-slate-100'
                            } ${file.uploadedBy.initialsColor || 'text-slate-700'}`}
                          >
                            {file.uploadedBy.initials}
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          {file.uploadedBy.name}
                        </span>
                      </div>
                    </td>

                    {/* Modified */}
                    <td className="py-3.5 px-6 text-sm text-slate-500">
                      {file.modified}
                    </td>

                    {/* Action menu */}
                    <td className="py-3.5 px-6 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === file.id ? null : file.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors inline-flex"
                        title="Actions"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === file.id && (
                        <div
                          className="absolute right-6 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-left animate-in fade-in duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onFileAction?.('preview', file);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            Preview File
                          </button>
                          <button
                            onClick={() => {
                              onFileAction?.('download', file);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Download className="w-4 h-4 text-slate-400" />
                            Download
                          </button>
                          <button
                            onClick={() => {
                              onFileAction?.('share', file);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Share2 className="w-4 h-4 text-slate-400" />
                            Share Link
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            onClick={() => {
                              setFileToDelete(file);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={() => {
          if (fileToDelete) {
            onFileAction?.('delete', fileToDelete);
            setFileToDelete(null);
          }
        }}
        itemName={fileToDelete?.name}
        itemType="file"
      />
    </div>
  );
};
