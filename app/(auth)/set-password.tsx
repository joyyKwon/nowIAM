import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PinPad } from '@/components/ui/PinPad';
import { PinDisplay } from '@/components/ui/PinDisplay';
import { useAuthStore } from '@/stores/authStore';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function SetPasswordScreen() {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>암호 설정</Text>

        <Text style={styles.message}>{message}</Text>

        <PinDisplay length={currentPin.length} />

        <PinPad onPress={handlePinPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
