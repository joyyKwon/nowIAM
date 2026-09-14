import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import { generateDeviceId } from './utils';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

const DEVICE_ID_KEY = 'nowiam_device_id';

export type AuthProvider = 'google' | 'apple' | 'kakao' | 'naver';

/**
 * Supabase 에러 메시지를 사용자에게 보여줄 한국어 메시지로 변환
 */
function translateAuthError(error: Error): Error {
  const message = error.message || '';

  if (/network|fetch/i.test(message)) {
    return new Error('네트워크 연결을 확인해주세요.');
  }
  if (/already registered|already exists|duplicate/i.test(message)) {
    return new Error('이미 가입된 이메일입니다.');
  }
  if (/invalid login credentials/i.test(message)) {
    return new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  if (/email not confirmed/i.test(message)) {
    return new Error('이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.');
  }
  if (/password should be at least/i.test(message)) {
    return new Error('비밀번호는 6자 이상이어야 합니다.');
  }
  if (/rate limit|too many requests/i.test(message)) {
    return new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
  }
  if (/user not found/i.test(message)) {
    return new Error('가입되지 않은 이메일입니다.');
  }

  return new Error(message || '알 수 없는 오류가 발생했습니다.');
}

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

    // 이메일 확인이 켜져 있으면 이미 가입된 이메일이어도 에러 없이
    // identities가 빈 배열인 유저가 반환된다 (이메일 열거 방지 동작)
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('이미 가입된 이메일입니다.');
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, session: null, error: translateAuthError(error as Error) };
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
    return { user: null, session: null, error: translateAuthError(error as Error) };
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
    return { user: null, session: null, error: translateAuthError(error as Error) };
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
    return { error: translateAuthError(error as Error) };
  }
}

/**
 * 비밀번호 재설정 메일의 딥링크 토큰으로 세션 설정
 */
export async function setSessionFromRecoveryTokens(accessToken: string, refreshToken: string) {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw error;

    return { session: data.session, error: null };
  } catch (error) {
    console.error('Set recovery session error:', error);
    return { session: null, error: error as Error };
  }
}

/**
 * 새 비밀번호로 변경 (재설정 세션 상태에서 호출)
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return { error: translateAuthError(error as Error) };
  }
}
