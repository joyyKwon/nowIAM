import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const FIRST_DAY_KEY = 'nowiam_first_day';
const THEME_MODE_KEY = 'nowiam_theme_mode';
const NOTIFICATIONS_ENABLED_KEY = 'nowiam_notifications_enabled';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  firstDay: number; // 0 = 일요일 시작, 1 = 월요일 시작
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  setFirstDay: (day: number) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  firstDay: 0,
  themeMode: 'system',
  notificationsEnabled: false,
  isLoaded: false,

  loadSettings: async () => {
    const [storedFirstDay, storedThemeMode, storedNotificationsEnabled] = await Promise.all([
      SecureStore.getItemAsync(FIRST_DAY_KEY),
      SecureStore.getItemAsync(THEME_MODE_KEY),
      SecureStore.getItemAsync(NOTIFICATIONS_ENABLED_KEY),
    ]);

    set({
      firstDay: storedFirstDay ? Number(storedFirstDay) : 0,
      themeMode: (storedThemeMode as ThemeMode) || 'system',
      notificationsEnabled: storedNotificationsEnabled === 'true',
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

  setNotificationsEnabled: async (enabled: boolean) => {
    await SecureStore.setItemAsync(NOTIFICATIONS_ENABLED_KEY, String(enabled));
    set({ notificationsEnabled: enabled });
  },
}));
