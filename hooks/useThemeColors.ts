import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { lightColors, darkColors, ThemeColors } from '@/constants/theme';

/**
 * 현재 적용되어야 할 색상 팔레트를 반환
 * themeMode가 'system'이면 OS 설정을 따르고, 아니면 사용자가 고른 값을 그대로 씀
 */
export function useThemeColors(): ThemeColors {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const systemScheme = useColorScheme();

  const effectiveScheme = themeMode === 'system' ? systemScheme : themeMode;

  return effectiveScheme === 'dark' ? darkColors : lightColors;
}

export function useIsDarkMode(): boolean {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const systemScheme = useColorScheme();

  const effectiveScheme = themeMode === 'system' ? systemScheme : themeMode;
  return effectiveScheme === 'dark';
}
