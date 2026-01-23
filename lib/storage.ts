import { supabase } from './supabase';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * 파일을 Supabase Storage에 업로드
 */
export async function uploadFile(
  bucket: 'posts' | 'profiles',
  filePath: string,
  uri: string,
  contentType?: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // 파일을 base64로 읽기
    const file = new File(uri);
    const base64 = await file.base64();

    // base64를 ArrayBuffer로 변환
    const arrayBuffer = decode(base64);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: contentType || 'image/jpeg',
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
 * 파일명 생성 (타임스탬프 기반)
 */
export function generateFileName(prefix: string, extension: string): string {
  const timestamp = new Date().getTime();
  return `${prefix}_${timestamp}.${extension}`;
}
