import React, { useState } from 'react';
import {
  FolderPlus,
  FolderClosed,
  Search,
  FileText,
  ChevronRight,
  HardDrive,
  Layers,
  Sparkles,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Project, UserProfile } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ProjectsPageProps {
  projects: Project[];
  currentUser?: UserProfile;
  onCreateProject: () => void;
  onOpenProject: (project: Project) => void;
  onQuickUpload: (project: Project) => void;
  onDeleteProject: (projectId: string, numericId?: number) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  currentUser,
  onCreateProject,
  onOpenProject,
  onQuickUpload,
  onDeleteProject
}) => {
  const isSystemAdmin = String(currentUser?.role).toUpperCase() === 'ADMIN';
  const isSystemOwner = String(currentUser?.role).toUpperCase() === 'OWNER';
  const canCreateProject = isSystemAdmin || isSystemOwner;

  const canUploadProject = (proj: Project) => {
    if (isSystemAdmin || isSystemOwner) return true;
    const member = proj.members?.find((m) =>
      (currentUser?.email && m.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && m.name?.toLowerCase() === currentUser.name.toLowerCase())
    );
    return member?.role === 'Owner' || member?.role === 'Admin';
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'In Progress' | 'Review'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'files'>('newest');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const categories = ['All', 'Marketing', 'Product Design', 'Research & AI', 'Engineering'];

  const getProjectIcon = () => {
    return (
      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <FolderClosed className="w-5 h-5" />
      </div>
    );
  };

  // Filter & Search
  let filtered = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'files') return (b.filesCount || 0) - (a.filesCount || 0);
    return 0; // default newest
  });

  return (
    <div className="space-y-7 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Projects
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {projects.length} Workspaces
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize documents, collaborate with team members, and explore AI knowledge bases.
          </p>
        </div>

        {canCreateProject && (
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all self-start sm:self-center"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Projects</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{projects.length}</p>
          <span className="text-[11px] text-emerald-600 font-medium">PostgreSQL synced</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Workspaces</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {projects.filter((p) => p.status !== 'Archived').length}
          </p>
          <span className="text-[11px] text-slate-400">Collaborative</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Storage Used</span>
            <HardDrive className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">84.5 MB</p>
          <span className="text-[11px] text-slate-400">Supabase Bucket</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AI Knowledge</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">Ready</p>
          <span className="text-[11px] text-slate-400">Context Search</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(['All', 'Active', 'In Progress', 'Review'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {status} {status === 'All' ? `(${projects.length})` : ''}
            </button>
          ))}
        </div>

        {/* Search & Category / Sort */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="newest">Newest</option>
            <option value="title">Title (A-Z)</option>
            <option value="files">Most Files</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new project workspace.
          </p>
          <button
            onClick={onCreateProject}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Create New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between group cursor-pointer relative"
              onClick={() => onOpenProject(project)}
            >
              <div>
                {/* Top badges & Icon */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  {getProjectIcon()}

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {project.category || 'General'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {project.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                  {project.description}
                </p>

                {/* Team member avatars */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {(project.members || []).slice(0, 3).map((m, i) => (
                      <img
                        key={i}
                        src={m.avatar}
                        alt={m.name}
                        title={`${m.name} (${m.role})`}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2563eb&color=fff`;
                        }}
                        className="inline-block w-6 h-6 rounded-full ring-2 ring-white object-cover"
                      />
                    ))}
                    {(project.members?.length || 3) > 3 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px] flex items-center justify-center ring-2 ring-white">
                        +{(project.members?.length || 3) - 3}
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {project.updatedTime}
                  </span>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {project.filesCount} files
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    {project.storageUsed || '18 MB'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {canUploadProject(project) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickUpload(project);
                      }}
                      title="Upload document to this project"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                    </button>
                  )}

                  {canUploadProject(project) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                      }}
                      title="Delete project"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform ml-1">
                    <span>Open</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Project Deletion */}
      <ConfirmDeleteModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            onDeleteProject(projectToDelete.id, projectToDelete.numericId);
            setProjectToDelete(null);
          }
        }}
        itemName={projectToDelete?.title}
        itemType="project"
      />
    </div>
  );
};
