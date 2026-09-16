// 앱 테마 상수

export const lightColors = {
  primary: '#ea4c94', // pink (원본 테마)
  secondary: '#ef9ce8', // light pink (원본 테마)
  accent: '#d8758b', // soft pink (버튼/링크)
  link: '#3890ec', // blue (링크)
  background: '#ffffff',
  backgroundSecondary: '#fcfcfc', // light gray
  text: '#333333', // dark gray (원본)
  textSecondary: '#666666', // medium gray
  border: '#cccccc', // light gray border
  borderLight: '#bbbbbb',
  error: '#ef4444', // red-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  white: '#ffffff',
  overlay: 'rgba(255, 255, 255, 0.4)', // 반투명 흰색
};

export const darkColors = {
  primary: '#ea4c94', // 브랜드 핑크는 다크에서도 유지
  secondary: '#7a3b5e', // 핑크 배경은 다크에 맞게 톤다운
  accent: '#d8758b',
  link: '#5b9bea', // 다크 배경에서 살짝 밝게
  background: '#121212',
  backgroundSecondary: '#1e1e1e',
  text: '#f0f0f0',
  textSecondary: '#a0a0a0',
  border: '#3a3a3a',
  borderLight: '#4a4a4a',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
  white: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export type ThemeColors = typeof lightColors;

// 마이그레이션 중인 화면을 위한 기본값 (라이트 고정, 다크모드 미반영)
// 다크모드를 지원하려면 useThemeColors() 훅으로 받은 colors를 써야 함
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
