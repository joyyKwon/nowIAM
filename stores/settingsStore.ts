import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const FIRST_DAY_KEY = 'nowiam_first_day';

interface SettingsState {
  firstDay: number; // 0 = 일요일 시작, 1 = 월요일 시작
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  setFirstDay: (day: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  firstDay: 0,
  isLoaded: false,

  loadSettings: async () => {
    const stored = await SecureStore.getItemAsync(FIRST_DAY_KEY);
    set({ firstDay: stored ? Number(stored) : 0, isLoaded: true });
  },

  setFirstDay: async (day: number) => {
    await SecureStore.setItemAsync(FIRST_DAY_KEY, String(day));
    set({ firstDay: day });
  },
}));
