import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/models';
import {
  getOrCreateDeviceId,
  signUpWithEmail,
  signInWithEmail,
  signInWithOAuth,
  AuthProvider,
} from '@/lib/auth';
import { hashPin, verifyPin } from '@/lib/utils';

interface AuthState {
  user: any | null | undefined;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;

  // Actions
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, profileData: { name: string; birth?: string; sex?: string; about?: string; profileImage?: string }) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithProvider: (provider: AuthProvider) => Promise<{ success: boolean; error?: string; needsProfile?: boolean }>;
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
  isNewUser: true,

  initialize: async () => {
    try {
      set({ isLoading: true });

      // 1. Supabase 세션 확인
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // 세션이 없으면 로그인/회원가입이 필요
        set({ isLoading: false, isAuthenticated: false, isNewUser: true });
        return;
      }

      const user = session.user;

      // 2. 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as any;

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profile) {
        // 프로필이 없으면 신규 사용자로 처리 (소셜 로그인 후 프로필 생성 필요)
        set({
          user,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          isNewUser: true,
        });
        return;
      }

      set({
        user,
        profile: {
          id: profile.id,
          deviceId: profile.device_id,
          email: profile.email,
          name: profile.name,
          birth: profile.birth,
          sex: profile.sex,
          about: profile.about,
          profileImage: profile.profile_image,
          password: profile.password,
          passwordEnabled: profile.password_enabled,
          authProvider: profile.auth_provider,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
        isAuthenticated: !profile.password_enabled,
        isLoading: false,
        isNewUser: false,
      });
    } catch (error) {
      console.error('Initialize error:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as any;

    if (error || !profile) return;

    set({
      profile: {
        id: profile.id,
        deviceId: profile.device_id,
        email: profile.email,
        name: profile.name,
        birth: profile.birth,
        sex: profile.sex,
        about: profile.about,
        profileImage: profile.profile_image,
        password: profile.password,
        passwordEnabled: profile.password_enabled,
        authProvider: profile.auth_provider,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
    });
  },

  signUp: async (email, password, profileData) => {
    try {
      set({ isLoading: true });

      // 1. Supabase Auth 회원가입
      const { user, error } = await signUpWithEmail(email, password);

      if (error) {
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      if (!user) {
        set({ isLoading: false });
        return { success: false, error: '회원가입에 실패했습니다.' };
      }

      // 2. 프로필 생성
      const deviceId = await getOrCreateDeviceId();
      const newProfile = {
        id: user.id,
        device_id: deviceId,
        email: email,
        name: profileData.name,
        birth: profileData.birth || null,
        sex: profileData.sex || null,
        about: profileData.about || null,
        profile_image: profileData.profileImage || null,
        password_enabled: false,
        auth_provider: 'email',
      };

      const { data: createdProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(newProfile as any)
        .select()
        .single() as any;

      if (profileError) {
        console.error('Profile creation error:', profileError);
        set({ isLoading: false });
        return { success: false, error: '프로필 생성에 실패했습니다.' };
      }

      set({
        user,
        profile: {
          id: createdProfile.id,
          deviceId: createdProfile.device_id,
          email: createdProfile.email,
          name: createdProfile.name,
          birth: createdProfile.birth,
          sex: createdProfile.sex,
          about: createdProfile.about,
          profileImage: createdProfile.profile_image,
          password: createdProfile.password,
          passwordEnabled: createdProfile.password_enabled,
          authProvider: createdProfile.auth_provider,
          createdAt: createdProfile.created_at,
          updatedAt: createdProfile.updated_at,
        },
        isAuthenticated: true,
        isLoading: false,
        isNewUser: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      set({ isLoading: false });
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true });

      const { user, error } = await signInWithEmail(email, password);

      if (error) {
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      if (!user) {
        set({ isLoading: false });
        return { success: false, error: '로그인에 실패했습니다.' };
      }

      // 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as any;

      if (profileError) {
        set({ isLoading: false });
        return { success: false, error: '프로필을 불러올 수 없습니다.' };
      }

      set({
        user,
        profile: {
          id: profile.id,
          deviceId: profile.device_id,
          email: profile.email,
          name: profile.name,
          birth: profile.birth,
          sex: profile.sex,
          about: profile.about,
          profileImage: profile.profile_image,
          password: profile.password,
          passwordEnabled: profile.password_enabled,
          authProvider: profile.auth_provider,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
        isAuthenticated: !profile.password_enabled,
        isLoading: false,
        isNewUser: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      set({ isLoading: false });
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  },

  signInWithProvider: async (provider) => {
    try {
      set({ isLoading: true });

      const { user, error } = await signInWithOAuth(provider);

      if (error) {
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      if (!user) {
        set({ isLoading: false });
        return { success: false, error: '소셜 로그인에 실패했습니다.' };
      }

      // 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as any;

      if (profileError && profileError.code !== 'PGRST116') {
        set({ isLoading: false });
        return { success: false, error: '프로필을 불러올 수 없습니다.' };
      }

      if (!profile) {
        // 프로필이 없으면 추가 정보 입력이 필요
        set({
          user,
          profile: null,
          isLoading: false,
          isNewUser: true,
        });
        return { success: true, needsProfile: true };
      }

      set({
        user,
        profile: {
          id: profile.id,
          deviceId: profile.device_id,
          email: profile.email,
          name: profile.name,
          birth: profile.birth,
          sex: profile.sex,
          about: profile.about,
          profileImage: profile.profile_image,
          password: profile.password,
          passwordEnabled: profile.password_enabled,
          authProvider: profile.auth_provider,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
        isAuthenticated: !profile.password_enabled,
        isLoading: false,
        isNewUser: false,
      });

      return { success: true };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      set({ isLoading: false });
      return { success: false, error: '소셜 로그인 중 오류가 발생했습니다.' };
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
