# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성
1. https://supabase.com 에서 새 프로젝트 생성
2. 프로젝트 URL과 anon key 복사

## 2. 데이터베이스 스키마 적용
1. Supabase 대시보드 > SQL Editor 열기
2. `schema.sql` 파일 내용을 복사하여 실행
3. 테이블과 정책이 생성되었는지 확인

## 3. 스토리지 버킷 생성
1. Supabase 대시보드 > Storage 열기
2. 새 버킷 생성: `posts` (public)
3. 새 버킷 생성: `profiles` (public)

## 4. 환경 변수 설정
1. 프로젝트 루트에 `.env` 파일 생성
2. `.env.example` 파일 참고하여 값 입력

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. 익명 인증 활성화
1. Supabase 대시보드 > Authentication > Settings
2. "Enable anonymous sign-ins" 체크

이 앱은 기기별 익명 인증을 사용합니다.
