import React from 'react';
import { Folder, FileText, Users, HardDrive } from 'lucide-react';
import { StatMetric } from '../types';

interface StatsGridProps {
  stats: StatMetric[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'folder':
        return <Folder className="w-5 h-5 text-blue-600" />;
      case 'file':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'users':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'storage':
        return <HardDrive className="w-5 h-5 text-blue-600" />;
      default:
        return <Folder className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            {/* Soft blue icon wrapper */}
            <div className="w-11 h-11 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-600 mb-4">
              {getIcon(stat.icon)}
            </div>

            {/* Stat Value */}
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-base font-bold text-slate-800 ml-1">
                  {stat.unit}
                </span>
              )}
            </div>

            {/* Progress bar for storage card */}
            {stat.progress !== undefined && (
              <div className="mt-2.5 mb-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stat.progress}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Stat Label */}
          <div className="text-sm font-medium text-slate-500 mt-2">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
