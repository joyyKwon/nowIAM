// 앱에서 사용할 모델 타입 정의

export interface Profile {
  id: string;
  deviceId: string;
  name?: string | null;
  birth?: string | null;
  sex?: string | null;
  about?: string | null;
  profileImage?: string | null;
  password?: string | null;
  passwordEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
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
  imageUrl: string;
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
  imageUrl?: string;
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
