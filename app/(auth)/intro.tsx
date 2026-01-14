import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
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
      <ImageBackground
        source={require('@/assets/images/intro1.jpg')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>now I AM</Text>
          </View>
          <Text style={styles.loadingText}>로딩중...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/intro1.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>now I AM</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>시작하기</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  titleBox: {
    borderWidth: 1,
    borderColor: colors.white,
    paddingVertical: spacing.xl * 1.5,
    paddingHorizontal: spacing.xl * 2,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 4,
    textAlign: 'center',
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
  },
  startButton: {
    backgroundColor: colors.overlay,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.accent,
  },
});
