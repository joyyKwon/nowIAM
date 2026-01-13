import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function IntroScreen() {
  const router = useRouter();
  const { initialize, isLoading, isAuthenticated, profile } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else if (profile?.passwordEnabled) {
        router.replace('/(auth)/password');
      }
    }
  }, [isLoading, isAuthenticated, profile]);

  const handleStart = async () => {
    if (profile?.passwordEnabled) {
      router.push('/(auth)/password');
    } else {
      router.replace('/(tabs)');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>now I AM</Text>
        <Text style={styles.subtitle}>로딩중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>now I AM</Text>
        <Text style={styles.subtitle}>어제의 오늘은</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="시작하기"
          onPress={handleStart}
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: spacing.xl,
  },
});
