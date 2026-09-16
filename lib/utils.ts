import * as Crypto from 'expo-crypto';

/**
 * 날짜 포맷팅 함수
 */
export function formatDate(date: string | Date, format: 'full' | 'short' | 'time' = 'full'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDay = weekDays[d.getDay()];

  switch (format) {
    case 'short':
      return `${year}.${month}.${day}`;
    case 'time':
      return `${hours}:${minutes}`;
    case 'full':
    default:
      return `${year}.${month}.${day} ${weekDay} ${hours}:${minutes}`;
  }
}

/**
 * 4자리 PIN 해시 생성
 */
export async function hashPin(pin: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin
  );
  return digest;
}

/**
 * PIN 검증
 */
export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === hashedPin;
}

/**
 * UUID 생성 (기기 ID용)
 */
export async function generateDeviceId(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const hexString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hexString.slice(0, 8)}-${hexString.slice(8, 12)}-${hexString.slice(12, 16)}-${hexString.slice(16, 20)}-${hexString.slice(20, 32)}`;
}

/**
 * 키워드 유효성 검사
 */
export function validateKeywords(keywords: string[]): boolean {
  if (keywords.length > 3) return false;
  return keywords.every(k => k.length > 0 && k.length <= 20);
}

/**
 * 생년월일(YYYY-MM-DD) 유효성 검사 - 형식, 실존 날짜, 미래 날짜 여부 확인
 */
export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(uri: string): string {
  const parts = uri.split('.');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * 미디어 타입 판별
 */
export function getMediaType(uri: string): 'image' | 'video' {
  const ext = getFileExtension(uri);
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';

  return 'image'; // 기본값
}

/**
 * 게시물의 썸네일 URL (사진은 첫 번째 장, 동영상은 videoUrl)
 */
export function getPostThumbnail(post: {
  mediaType: 'image' | 'video';
  imageUrls?: string[];
  videoUrl?: string;
}): string | undefined {
  if (post.mediaType === 'video') return post.videoUrl;
  return post.imageUrls?.[0];
}

/**
 * 감정 점수를 이모지로 변환
 */
export function getFeelingEmoji(feeling: number): string {
  if (feeling <= 2) return '😢';
  if (feeling <= 4) return '😕';
  if (feeling <= 6) return '😐';
  if (feeling <= 8) return '🙂';
  return '😄';
}
