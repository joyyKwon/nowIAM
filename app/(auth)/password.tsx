import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PinPad } from '@/components/ui/PinPad';
import { PinDisplay } from '@/components/ui/PinDisplay';
import { useAuthStore } from '@/stores/authStore';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function PasswordScreen() {
  const router = useRouter();
  const { checkPassword } = useAuthStore();
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState(' ');

  const handlePinPress = async (value: string) => {
    if (pin.length >= 4) return;

    const newPin = pin + value;
    setPin(newPin);

    if (newPin.length === 4) {
      const isValid = await checkPassword(newPin);

      if (isValid) {
        setMessage('암호 일치!');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      } else {
        setMessage('암호가 일치하지 않습니다.');
        setPin('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>암호 입력</Text>

        <Text style={styles.message}>{message}</Text>

        <PinDisplay length={pin.length} />

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
