-- nowIAM 데이터베이스 스키마

-- 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE,
  email TEXT,
  auth_provider TEXT DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'apple', 'kakao', 'naver', 'anonymous')),
  name TEXT,
  birth TEXT,
  sex TEXT,
  about TEXT,
  profile_image TEXT,
  password TEXT, -- 4자리 PIN 암호 (해시 저장)
  password_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이메일/소셜 인증 컬럼 (신규 프로젝트는 위 CREATE TABLE에서 이미 반영되지만,
-- 기존 프로젝트에 적용할 때를 위해 별도로도 실행)
ALTER TABLE profiles ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- 게시물 테이블
-- 사진은 여러 장(post_images 테이블), 동영상은 1개(video_url) - 서로 배타적
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  video_url TEXT, -- media_type = 'video'일 때만 사용
  content TEXT,
  keywords TEXT[], -- 키워드 배열 (최대 10개)
  feeling INTEGER CHECK (feeling >= 0 AND feeling <= 10),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 프로젝트 마이그레이션: 단일 image_url을 post_images 테이블로 분리
-- (신규 프로젝트는 위 CREATE TABLE에서 이미 반영되어 있어 아래 두 줄은 실행할 필요 없음)
ALTER TABLE posts DROP COLUMN IF EXISTS image_url;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 게시물 사진 테이블 (게시물 1개당 최대 10장, 앱에서 제한)
CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_keywords ON posts USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

-- 프로필: 자신의 프로필만 읽기/수정 가능
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 게시물: 자신의 게시물만 읽기/수정/삭제 가능
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- 게시물 사진: 자신의 게시물에 딸린 사진만 읽기/수정/삭제 가능
DROP POLICY IF EXISTS "Users can view own post images" ON post_images;
CREATE POLICY "Users can view own post images"
  ON post_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_images.post_id AND posts.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own post images" ON post_images;
CREATE POLICY "Users can insert own post images"
  ON post_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_images.post_id AND posts.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own post images" ON post_images;
CREATE POLICY "Users can update own post images"
  ON post_images FOR UPDATE
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_images.post_id AND posts.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own post images" ON post_images;
CREATE POLICY "Users can delete own post images"
  ON post_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_images.post_id AND posts.user_id = auth.uid()));

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Storage 버킷 (프로필 사진, 게시물 사진/영상 업로드용)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read profiles bucket" ON storage.objects;
CREATE POLICY "Public read profiles bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Authenticated upload profiles bucket" ON storage.objects;
CREATE POLICY "Authenticated upload profiles bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update profiles bucket" ON storage.objects;
CREATE POLICY "Authenticated update profiles bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete profiles bucket" ON storage.objects;
CREATE POLICY "Authenticated delete profiles bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read posts bucket" ON storage.objects;
CREATE POLICY "Public read posts bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Authenticated upload posts bucket" ON storage.objects;
CREATE POLICY "Authenticated upload posts bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update posts bucket" ON storage.objects;
CREATE POLICY "Authenticated update posts bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'posts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete posts bucket" ON storage.objects;
CREATE POLICY "Authenticated delete posts bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'posts' AND auth.role() = 'authenticated');
