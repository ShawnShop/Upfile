export type FileType = 'PDF' | 'Excel' | 'PowerPoint' | 'Image' | 'Video' | 'Word' | 'Text';

export type UserRole = 'Admin' | 'Owner' | 'User';

export interface UserProfile {
  id?: string;
  email?: string;
  name: string;
  role: UserRole | string;
  avatar: string;
}

export interface StatMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  icon: 'folder' | 'file' | 'users' | 'storage';
  progress?: number;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  joinedAt?: string;
}

export interface Project {
  id: string;
  numericId?: number;
  title: string;
  description: string;
  category?: string;
  status?: 'Active' | 'In Progress' | 'Review' | 'Archived';
  storageUsed?: string;
  updatedTime: string;
  filesCount: number;
  membersCount: number;
  members?: ProjectMember[];
  iconType: 'megaphone' | 'code' | 'lightbulb';
  theme: 'blue' | 'green' | 'purple' | 'amber';
}

export interface FileItem {
  id: string;
  rawId?: number;
  name: string;
  size: string;
  type: FileType;
  project: string;
  projectId?: number;
  storageUrl?: string;
  uploadedBy: {
    name: string;
    avatar?: string;
    initials?: string;
    initialsBg?: string;
    initialsColor?: string;
  };
  modified: string;
  status?: 'Ready' | 'Processing' | 'Indexed';
}

export type FileFilter = 'all' | 'documents' | 'media' | 'spreadsheets';

