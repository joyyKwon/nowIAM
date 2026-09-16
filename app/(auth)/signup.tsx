import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { uploadFile, generateFileName } from '@/lib/storage';
import { isValidBirthDate } from '@/lib/utils';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [sex, setSex] = useState<string>('');
  const [about, setAbout] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSignUp = async () => {
    // 유효성 검사
    if (!email || !password || !confirmPassword || !name) {
      Alert.alert('알림', '필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (birth && !isValidBirthDate(birth)) {
      Alert.alert('알림', '생년월일 형식이 올바르지 않습니다. (예: 2000-01-01)');
      return;
    }

    try {
      setIsSubmitting(true);

      let uploadedImageUrl: string | undefined;

      // 프로필 이미지 업로드
      if (profileImage) {
        const extension = profileImage.split('.').pop() || 'jpg';
        const fileName = `profile_${Date.now()}.${extension}`;
        const { url, error } = await uploadFile('profiles', fileName, profileImage, 'image/jpeg');

        if (error) {
          console.error('Profile image upload error:', error);
        } else if (url) {
          uploadedImageUrl = url;
        }
      }

      const result = await signUp(email, password, {
        name,
        birth: birth || undefined,
        sex: sex || undefined,
        about: about || undefined,
        profileImage: uploadedImageUrl,
      });

      if (!result.success) {
        Alert.alert('오류', result.error || '회원가입에 실패했습니다.');
        return;
      }

      Alert.alert('성공', '회원가입이 완료되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
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
            <Text style={styles.headerTitle}>회원가입</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 프로필 이미지 */}
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color={colors.textSecondary} />
                <Text style={styles.imageText}>프로필 사진</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 필수 항목 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>필수 항목</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일 *</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호 (6자 이상)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 확인 *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름 *</Text>
              <TextInput
                style={styles.input}
                placeholder="이름을 입력하세요"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* 선택 항목 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>선택 항목</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>생년월일</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={birth}
                onChangeText={setBirth}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>성별</Text>
              <View style={styles.sexButtons}>
                <TouchableOpacity
                  style={[styles.sexButton, sex === 'male' && styles.sexButtonActive]}
                  onPress={() => setSex('male')}
                >
                  <Text style={[styles.sexButtonText, sex === 'male' && styles.sexButtonTextActive]}>
                    남성
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sexButton, sex === 'female' && styles.sexButtonActive]}
                  onPress={() => setSex('female')}
                >
                  <Text style={[styles.sexButtonText, sex === 'female' && styles.sexButtonTextActive]}>
                    여성
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sexButton, sex === 'other' && styles.sexButtonActive]}
                  onPress={() => setSex('other')}
                >
                  <Text style={[styles.sexButtonText, sex === 'other' && styles.sexButtonTextActive]}>
                    기타
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>자기소개</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="자기소개를 입력하세요"
                value={about}
                onChangeText={setAbout}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* 가입 버튼 */}
          <Button
            title="가입하기"
            onPress={handleSignUp}
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          {/* 로그인 링크 */}
          <View style={styles.loginLink}>
            <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLinkText}>로그인</Text>
            </TouchableOpacity>
          </View>
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
  imageContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  eyeButton: {
    padding: spacing.md,
  },
  sexButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sexButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  sexButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sexButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  sexButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  loginText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  loginLinkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
});
