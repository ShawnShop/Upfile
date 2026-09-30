/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
export const SUPABASE_BUCKET = env.VITE_SUPABASE_BUCKET || 'kbase-documents';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload file trực tiếp lên Supabase Storage bucket
 */
export async function uploadToSupabase(
  file: File,
  folder = 'documents'
): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào file .env');
  }

  // Chuẩn hóa tên file an toàn
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Lỗi khi upload lên Supabase Storage:', error);
    throw error;
  }

  // Lấy đường dẫn link tải/xem công khai (Public URL)
  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path
  };
}
