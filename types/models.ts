// 앱에서 사용할 모델 타입 정의

export interface Profile {
  id: string;
  deviceId?: string;
  email?: string | null;
  name?: string | null;
  birth?: string | null;
  sex?: string | null;
  about?: string | null;
  profileImage?: string | null;
  password?: string | null;
  passwordEnabled: boolean;
  authProvider?: 'email' | 'google' | 'apple' | 'kakao' | 'naver' | 'anonymous';
  createdAt: string;
  updatedAt: string;
}

export const MAX_POST_IMAGES = 10;

export interface Post {
  id: string;
  userId: string;
  imageUrls: string[]; // mediaType = 'image'일 때, 최대 MAX_POST_IMAGES장
  videoUrl?: string; // mediaType = 'video'일 때
  mediaType: 'image' | 'video';
  content?: string;
  keywords?: string[];
  feeling?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  imageUrls?: string[];
  videoUrl?: string;
  mediaType: 'image' | 'video';
  content?: string;
  keywords?: string[];
  feeling?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  isPublic?: boolean;
}

export interface UpdatePostInput {
  imageUrls?: string[];
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  content?: string;
  keywords?: string[];
  feeling?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  isPublic?: boolean;
}

export interface UpdateProfileInput {
  name?: string;
  birth?: string;
  sex?: string;
  about?: string;
  profileImage?: string;
  password?: string;
  passwordEnabled?: boolean;
}
