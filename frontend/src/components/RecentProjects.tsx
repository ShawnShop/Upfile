import React from 'react';
import {
  FolderClosed,
  FileText,
  Users,
  ChevronRight,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Project } from '../types';

interface RecentProjectsProps {
  projects: Project[];
  canCreateProject?: boolean;
  onCreateProject: () => void;
  onOpenProject: (project: Project) => void;
  onViewAll: () => void;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  canCreateProject = true,
  onCreateProject,
  onOpenProject,
  onViewAll
}) => {
  const getProjectIcon = () => {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
        <FolderClosed className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="mt-9">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Recent Projects
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Active ({projects.length})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onViewAll}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {canCreateProject && (
            <button
              onClick={onCreateProject}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            onClick={() => onOpenProject(project)}
          >
            <div>
              {/* Header: Icon & Time */}
              <div className="flex items-start justify-between mb-4">
                {getProjectIcon()}
                <span className="text-xs font-medium text-slate-400">
                  {project.updatedTime}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                {project.description}
              </p>
            </div>

            {/* Card Footer: Metadata & Open Link */}
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{project.filesCount} files</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{project.membersCount} members</span>
                </div>
              </div>

              <div className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Open</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
