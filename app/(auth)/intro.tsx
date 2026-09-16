import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors, fontSize, spacing } from '@/constants/theme';

const INTRO_GRADIENT_COLORS = ['#88A8E4', '#B7B9DE', '#F7C1CB', '#FDBBBB'] as const;
const INTRO_GRADIENT_LOCATIONS = [0, 0.3, 0.6, 1] as const;

export default function IntroScreen() {
  const router = useRouter();
  const { initialize, isLoading, isAuthenticated, profile } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && profile) {
        // 이미 인증된 사용자는 탭으로 이동
        router.replace('/(tabs)');
      } else if (profile?.passwordEnabled) {
        // 앱 잠금이 설정된 경우
        router.replace('/(auth)/password');
      }
      // 그 외의 경우 인트로 화면 유지 (로그인/회원가입 선택)
    }
  }, [isLoading, isAuthenticated, profile]);

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={INTRO_GRADIENT_COLORS}
        locations={INTRO_GRADIENT_LOCATIONS}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>nowIAM</Text>
          </View>
          <Text style={styles.loadingText}>로딩중...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={INTRO_GRADIENT_COLORS}
      locations={INTRO_GRADIENT_LOCATIONS}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.titleBox}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>nowIAM</Text>
        </View>
        <Text style={styles.subtitle}>나의 일상을 기록하다</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text style={styles.signupButtonText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  titleBox: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.white,
    paddingVertical: spacing.xl * 1.5,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.white,
    marginTop: spacing.xl,
    opacity: 0.8,
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.white,
    marginTop: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: spacing.xl,
    marginTop: 128,
    gap: spacing.md,
  },
  loginButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  signupButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  signupButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
});
