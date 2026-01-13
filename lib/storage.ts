import { supabase } from './supabase';

/**
 * 파일을 Supabase Storage에 업로드
 */
export async function uploadFile(
  bucket: 'posts' | 'profiles',
  filePath: string,
  file: Blob | File,
  contentType?: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('File upload error:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Supabase Storage에서 파일 삭제
 */
export async function deleteFile(
  bucket: 'posts' | 'profiles',
  filePath: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('File delete error:', error);
    return { error: error as Error };
  }
}

/**
 * 로컬 파일 URI에서 Blob 생성 (React Native용)
 */
export async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

/**
 * 파일명 생성 (타임스탬프 기반)
 */
export function generateFileName(prefix: string, extension: string): string {
  const timestamp = new Date().getTime();
  return `${prefix}_${timestamp}.${extension}`;
}
