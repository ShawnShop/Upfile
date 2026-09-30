import { FileItem, FileType } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export async function fetchDocuments(
  projectId?: number,
  projectsList?: { numericId?: number; id: string; title: string }[]
): Promise<FileItem[]> {
  try {
    const url = projectId ? `${API_BASE_URL}/documents?projectId=${projectId}` : `${API_BASE_URL}/documents`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d: any) => {
      let projectTitle = '';
      if (projectsList && projectsList.length > 0) {
        const found = projectsList.find(
          (p) => p.numericId === d.projectId || p.id === `proj-${d.projectId}` || p.id === String(d.projectId)
        );
        if (found) projectTitle = found.title;
      }
      if (!projectTitle) {
        projectTitle =
          d.projectId === 1
            ? 'Digital Marketing Campaign'
            : d.projectId === 2
            ? 'Website Redesign'
            : d.projectId === 3
            ? 'Product Research'
            : `Project #${d.projectId}`;
      }

      const fName = (d.fileName || '').toLowerCase();
      let detectedType: FileType = (d.fileType as FileType) || 'PDF';
      if (fName.endsWith('.docx') || fName.endsWith('.doc')) {
        detectedType = 'Word';
      } else if (fName.endsWith('.pdf')) {
        detectedType = 'PDF';
      } else if (fName.endsWith('.xlsx') || fName.endsWith('.xls') || fName.endsWith('.csv')) {
        detectedType = 'Excel';
      } else if (fName.endsWith('.pptx') || fName.endsWith('.ppt')) {
        detectedType = 'PowerPoint';
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fName)) {
        detectedType = 'Image';
      } else if (/\.(mp4|webm|mov|mkv|avi)$/i.test(fName)) {
        detectedType = 'Video';
      } else if (/\.(txt|md|json|log|xml)$/i.test(fName)) {
        detectedType = 'Text';
      }

      return {
        id: `file-${d.id}`,
        rawId: d.id,
        name: d.fileName,
        size: formatBytes(d.fileSizeBytes),
        type: detectedType,
        project: projectTitle,
        projectId: d.projectId,
        storageUrl: d.storageUrl,
        uploadedBy: {
          name: d.uploadedByName || (d.uploadedBy === 1 ? 'System Admin' : d.uploadedBy === 2 ? 'Sarah Lee' : 'Alex Nguyen'),
          avatar:
            d.uploadedByAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(d.uploadedByName || 'User')}&background=2563eb&color=fff`,
          initials: (d.uploadedByName || (d.uploadedBy === 1 ? 'SA' : d.uploadedBy === 2 ? 'SL' : 'AN')).slice(0, 2).toUpperCase(),
          initialsBg: 'bg-blue-100',
          initialsColor: 'text-blue-700'
        },
        modified: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recently',
        status: 'Indexed'
      };
    });
  } catch (err) {
    console.error('Failed to fetch documents from backend:', err);
    return [];
  }
}

export async function deleteDocumentApi(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

