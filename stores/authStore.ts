import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/models';
import { getOrCreateDeviceId, signInAnonymously } from '@/lib/auth';
import { hashPin, verifyPin } from '@/lib/utils';

interface AuthState {
  user: any | null | undefined;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  checkPassword: (pin: string) => Promise<boolean>;
  setPassword: (pin: string) => Promise<void>;
  removePassword: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ isLoading: true });

      // 1. 기기 ID 가져오기
      const deviceId = await getOrCreateDeviceId();

      // 2. Supabase 세션 확인
      const { data: { session } } = await supabase.auth.getSession();

      let user = session?.user;

      // 3. 세션이 없으면 익명 로그인
      if (!user) {
        const { user: newUser, error } = await signInAnonymously();
        if (error) throw error;
        user = newUser || undefined;
      }

      if (!user) throw new Error('Failed to authenticate');

      // 4. 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('device_id', deviceId)
        .single() as any;

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // 5. 프로필이 없으면 생성
      if (!profile) {
        const newProfile = {
          id: user.id,
          device_id: deviceId,
          password_enabled: false,
        };

        const { data, error } = await supabase
          .from('profiles')
          .insert(newProfile as any)
          .select()
          .single() as any;

        if (error) throw error;

        set({
          user,
          profile: data ? {
            id: data.id,
            deviceId: data.device_id,
            name: data.name,
            birth: data.birth,
            sex: data.sex,
            about: data.about,
            profileImage: data.profile_image,
            password: data.password,
            passwordEnabled: data.password_enabled,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          } : null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user,
          profile: {
            id: profile.id,
            deviceId: profile.device_id,
            name: profile.name,
            birth: profile.birth,
            sex: profile.sex,
            about: profile.about,
            profileImage: profile.profile_image,
            password: profile.password,
            passwordEnabled: profile.password_enabled,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          },
          isAuthenticated: !profile.password_enabled,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Initialize error:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  checkPassword: async (pin: string) => {
    const { profile } = get();
    if (!profile || !profile.password) return false;

    const isValid = await verifyPin(pin, profile.password);
    if (isValid) {
      set({ isAuthenticated: true });
    }
    return isValid;
  },

  setPassword: async (pin: string) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const hashedPin = await hashPin(pin);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        password: hashedPin,
        password_enabled: true,
      } as any)
      .eq('id', user.id)
      .select()
      .single() as any;

    if (error) throw error;

    if (data) {
      set({
        profile: {
          ...profile,
          password: data.password,
          passwordEnabled: data.password_enabled,
        },
      });
    }
  },

  removePassword: async () => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        password: null,
        password_enabled: false,
      } as any)
      .eq('id', user.id)
      .select()
      .single() as any;

    if (error) throw error;

    if (data) {
      set({
        profile: {
          ...profile,
          password: null,
          passwordEnabled: false,
        },
      });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name || null;
    if (updates.birth !== undefined) dbUpdates.birth = updates.birth || null;
    if (updates.sex !== undefined) dbUpdates.sex = updates.sex || null;
    if (updates.about !== undefined) dbUpdates.about = updates.about || null;
    if (updates.profileImage !== undefined) dbUpdates.profile_image = updates.profileImage || null;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates as any)
      .eq('id', user.id)
      .select()
      .single() as any;

    if (error) throw error;

    if (data) {
      set({
        profile: {
          ...profile,
          ...updates,
        },
      });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
    });
  },
}));
