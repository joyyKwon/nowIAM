import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import { generateDeviceId } from './utils';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

const DEVICE_ID_KEY = 'nowiam_device_id';

export type AuthProvider = 'google' | 'apple' | 'kakao' | 'naver';

/**
 * 기기 ID 가져오기 (없으면 생성)
 */
export async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = await generateDeviceId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * 익명 로그인
 */
export async function signInAnonymously() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Anonymous sign in error:', error);
    return { user: null, session: null, error: error as Error };
  }
}

/**
 * 현재 세션 가져오기
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return { session: data.session, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error: error as Error };
  }
}

/**
 * 로그아웃
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error as Error };
  }
}

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, session: null, error: error as Error };
  }
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error: error as Error };
  }
}

/**
 * 소셜 로그인 (OAuth)
 */
export async function signInWithOAuth(provider: AuthProvider) {
  try {
    const redirectUri = makeRedirectUri({
      scheme: 'nowiam',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        const params = new URL(result.url).searchParams;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          return { user: sessionData.user, session: sessionData.session, error: null };
        }
      }

      return { user: null, session: null, error: new Error('OAuth 인증이 취소되었습니다.') };
    }

    return { user: null, session: null, error: new Error('OAuth URL을 가져올 수 없습니다.') };
  } catch (error) {
    console.error('OAuth sign in error:', error);
    return { user: null, session: null, error: error as Error };
  }
}

/**
 * 비밀번호 재설정 이메일 전송
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: makeRedirectUri({
        scheme: 'nowiam',
        path: 'auth/reset-password',
      }),
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: error as Error };
  }
}
