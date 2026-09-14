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

## 5. 이메일/소셜 인증 설정
이 앱은 이메일/비밀번호 로그인과 소셜 로그인(Google, Apple, Kakao, Naver)을 사용합니다.

1. Supabase 대시보드 > Authentication > URL Configuration
   - Redirect URLs에 `nowiam://auth/callback`, `nowiam://auth/reset-password` 추가
2. Supabase 대시보드 > Authentication > Providers
   - Email: 기본 활성화되어 있음 (비밀번호 재설정 메일 발송에 사용)
   - Google / Apple / Kakao / Naver: 각 제공자 콘솔에서 OAuth 클라이언트를 만들고 여기에 Client ID/Secret 등록
     - Kakao, Naver는 Supabase 기본 제공자 목록에 없으므로 "Custom OAuth Provider" 또는 별도 연동 방식 확인 필요
