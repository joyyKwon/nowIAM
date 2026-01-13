# now I AM

**어제의 오늘은** - 일기/추억 저장 모바일 앱

기존 jQuery Mobile + Cordova 프로젝트를 React Native(Expo) + TypeScript로 현대화한 앱입니다.

## 주요 기능

- **게시물 관리**: 사진/동영상과 함께 일기 작성
- **키워드 태그**: 최대 3개의 키워드로 게시물 분류
- **기분 기록**: 0-10 점수로 하루의 기분 기록
- **위치 정보**: 게시물에 위치 정보 추가
- **캘린더 뷰**: 달력에서 날짜별 게시물 확인
- **암호 잠금**: 4자리 PIN으로 앱 보호
- **프로필 관리**: 사용자 정보 및 프로필 사진 관리

## 기술 스택

### Frontend
- **React Native**: 0.81.5
- **Expo**: ~54.0.31
- **TypeScript**: ~5.9.2
- **NativeWind**: ^4.2.1 (Tailwind CSS for React Native)

### Backend & Database
- **Supabase**: PostgreSQL 데이터베이스 및 Storage
- **Row Level Security (RLS)**: 사용자별 데이터 격리

### 상태 관리
- **Zustand**: ^5.0.10 (경량 상태 관리)

### 주요 라이브러리
- `expo-router`: 파일 기반 라우팅
- `expo-camera`: 카메라 촬영
- `expo-image-picker`: 사진/동영상 선택
- `expo-location`: 위치 정보
- `expo-secure-store`: 암호화된 저장소
- `react-native-calendars`: 달력 UI
- `date-fns`: 날짜 포맷팅

## 프로젝트 구조

```
nowiam-app/
├── app/                    # Expo Router 라우팅
│   ├── (auth)/            # 인증 관련 화면
│   │   ├── intro.tsx      # 시작 화면
│   │   ├── password.tsx   # 암호 입력
│   │   └── set-password.tsx # 암호 설정
│   ├── (tabs)/            # 메인 탭 화면
│   │   ├── index.tsx      # 홈(달력)
│   │   ├── photos.tsx     # 사진 그리드
│   │   └── profile.tsx    # 프로필
│   ├── post/              # 게시물 관련
│   │   ├── create.tsx     # 게시물 작성
│   │   └── [id].tsx       # 게시물 상세
│   └── profile/           # 프로필 관련
│       └── edit.tsx       # 프로필 수정
├── components/            # 재사용 컴포넌트
│   └── ui/
│       ├── Button.tsx
│       ├── PinPad.tsx
│       └── PinDisplay.tsx
├── lib/                   # 라이브러리 및 유틸리티
│   ├── supabase.ts       # Supabase 클라이언트
│   ├── auth.ts           # 인증 함수
│   ├── storage.ts        # 파일 업로드
│   └── utils.ts          # 유틸리티 함수
├── stores/               # Zustand 스토어
│   ├── authStore.ts      # 인증 상태
│   └── postStore.ts      # 게시물 상태
├── types/                # TypeScript 타입
│   ├── database.ts       # Supabase 타입
│   └── models.ts         # 앱 모델 타입
├── constants/            # 상수
│   └── theme.ts          # 테마 색상, 간격 등
└── supabase/             # Supabase 설정
    ├── schema.sql        # 데이터베이스 스키마
    └── README.md         # Supabase 설정 가이드
```

## 시작하기

### 1. 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Expo CLI
- Supabase 계정

### 2. 설치

```bash
cd nowiam-app
npm install
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Storage에서 `posts`, `profiles` 버킷 생성 (public)
4. Authentication > Settings에서 익명 로그인 활성화

### 4. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. 실행

```bash
# 개발 서버 시작
npm start

# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저
npm run web
```

## 데이터베이스 스키마

### profiles 테이블
- 사용자 프로필 정보
- 기기 ID 기반 익명 인증
- 4자리 PIN 암호 지원

### posts 테이블
- 게시물 정보
- 이미지/동영상 URL
- 키워드 배열 (최대 3개)
- 기분 점수 (0-10)
- 위치 정보 (텍스트, 위경도)
- 공개/비공개 설정

## 주요 기능 구현

### 인증 시스템
- Supabase 익명 인증 사용
- 기기 ID를 SecureStore에 저장
- 선택적 4자리 PIN 잠금

### 게시물 작성
- 카메라 촬영 또는 앨범에서 선택
- 사진/동영상 Supabase Storage 업로드
- 키워드, 기분, 위치 정보 추가

### 상태 관리
- Zustand로 전역 상태 관리
- authStore: 사용자 인증 상태
- postStore: 게시물 CRUD

## 기존 프로젝트와의 차이점

### 제거된 기능
- 지도 기능 (Google Maps API) - 추후 구현 가능
- 동영상 촬영 - 추후 구현 가능
- 위치 검색 기능 - 추후 구현 가능

### 개선된 점
- **타입 안정성**: TypeScript 사용
- **현대적 UI**: NativeWind(Tailwind)로 일관된 디자인
- **클라우드 백엔드**: Supabase로 데이터 백업
- **파일 기반 라우팅**: Expo Router로 직관적인 네비게이션
- **컴포넌트 재사용**: 모듈화된 UI 컴포넌트
- **보안**: RLS로 사용자별 데이터 격리

## 향후 개발 계획

- [ ] 지도 기능 추가 (react-native-maps)
- [ ] 동영상 촬영 기능
- [ ] 위치 자동 감지 및 검색
- [ ] 게시물 검색 기능
- [ ] 게시물 정렬 옵션 확장
- [ ] 다크 모드 지원
- [ ] 이미지 편집 기능
- [ ] 클라우드 동기화 표시
- [ ] 오프라인 모드 지원

## 라이센스

개인 프로젝트

## 개발자

학부 과제를 현대적으로 리메이크한 프로젝트입니다.
