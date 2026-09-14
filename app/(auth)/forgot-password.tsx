import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/lib/auth';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await resetPassword(email);

      if (error) {
        Alert.alert('오류', error.message || '재설정 이메일 전송에 실패했습니다.');
        return;
      }

      setIsSent(true);
    } catch (error) {
      console.error('Send reset email error:', error);
      Alert.alert('오류', '재설정 이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>비밀번호 찾기</Text>
            <View style={styles.placeholder} />
          </View>

          {isSent ? (
            <View style={styles.sentContainer}>
              <Ionicons name="mail-outline" size={48} color={colors.primary} />
              <Text style={styles.sentTitle}>이메일을 확인해주세요</Text>
              <Text style={styles.sentDescription}>
                {email}(으)로 비밀번호 재설정 링크를 보냈습니다.{'\n'}
                메일에 포함된 링크를 눌러 새 비밀번호를 설정하세요.
              </Text>

              <Button
                title="로그인으로 돌아가기"
                onPress={() => router.replace('/(auth)/login')}
                size="lg"
                fullWidth
              />
            </View>
          ) : (
            <>
              <View style={styles.introContainer}>
                <Text style={styles.introTitle}>비밀번호를 잊으셨나요?</Text>
                <Text style={styles.introDescription}>
                  가입 시 사용한 이메일을 입력하시면{'\n'}비밀번호 재설정 링크를 보내드립니다.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>이메일</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Button
                  title="재설정 이메일 보내기"
                  onPress={handleSendResetEmail}
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  introContainer: {
    marginVertical: spacing.xl,
  },
  introTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  introDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sentContainer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    gap: spacing.md,
  },
  sentTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  sentDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
});
