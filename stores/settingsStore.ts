import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const FIRST_DAY_KEY = 'nowiam_first_day';
const THEME_MODE_KEY = 'nowiam_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  firstDay: number; // 0 = 일요일 시작, 1 = 월요일 시작
  themeMode: ThemeMode;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  setFirstDay: (day: number) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  firstDay: 0,
  themeMode: 'system',
  isLoaded: false,

  loadSettings: async () => {
    const [storedFirstDay, storedThemeMode] = await Promise.all([
      SecureStore.getItemAsync(FIRST_DAY_KEY),
      SecureStore.getItemAsync(THEME_MODE_KEY),
    ]);

    set({
      firstDay: storedFirstDay ? Number(storedFirstDay) : 0,
      themeMode: (storedThemeMode as ThemeMode) || 'system',
      isLoaded: true,
    });
  },

  setFirstDay: async (day: number) => {
    await SecureStore.setItemAsync(FIRST_DAY_KEY, String(day));
    set({ firstDay: day });
  },

  setThemeMode: async (mode: ThemeMode) => {
    await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
    set({ themeMode: mode });
  },
}));
