import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from '@/components/ui/PinPad';
import { PinDisplay } from '@/components/ui/PinDisplay';
import { useAuthStore } from '@/stores/authStore';
import { fontSize, spacing, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SetPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { setPassword } = useAuthStore();
  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState(' ');

  const currentPin = step === 'first' ? firstPin : confirmPin;

  const handlePinPress = async (value: string) => {
    if (currentPin.length >= 4) return;

    const newPin = currentPin + value;

    if (step === 'first') {
      setFirstPin(newPin);

      if (newPin.length === 4) {
        setMessage('한번 더 입력하세요');
        setStep('confirm');
      }
    } else {
      setConfirmPin(newPin);

      if (newPin.length === 4) {
        if (newPin === firstPin) {
          setMessage('비밀번호 일치!');

          try {
            await setPassword(newPin);
            setTimeout(() => {
              router.back();
            }, 500);
          } catch (error) {
            setMessage('비밀번호 설정 실패');
            setFirstPin('');
            setConfirmPin('');
            setStep('first');
          }
        } else {
          setMessage('비밀번호가 일치하지 않습니다.');
          setFirstPin('');
          setConfirmPin('');
          setStep('first');
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>암호 설정</Text>

        <Text style={styles.message}>{message}</Text>

        <PinDisplay length={currentPin.length} />

        <PinPad onPress={handlePinPress} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    minHeight: 20,
  },
});
