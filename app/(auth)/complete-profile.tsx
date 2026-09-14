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
import { supabase } from '@/lib/supabase';
import { getOrCreateDeviceId } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [sex, setSex] = useState<string>('');
  const [about, setAbout] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
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

      // 프로필 생성
      const deviceId = await getOrCreateDeviceId();
      const newProfile = {
        id: user.id,
        device_id: deviceId,
        email: user.email,
        name,
        birth: birth || null,
        sex: sex || null,
        about: about || null,
        profile_image: uploadedImageUrl || null,
        password_enabled: false,
        auth_provider: user.app_metadata?.provider || 'oauth',
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(newProfile as any);

      if (profileError) {
        throw profileError;
      }

      // 앱으로 이동
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Complete profile error:', error);
      Alert.alert('오류', '프로필 생성 중 오류가 발생했습니다.');
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
            <Text style={styles.headerTitle}>프로필 설정</Text>
            <Text style={styles.headerSubtitle}>서비스 이용을 위해 프로필을 완성해주세요.</Text>
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

          {/* 입력 폼 */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름 *</Text>
              <TextInput
                style={styles.input}
                placeholder="이름을 입력하세요"
                value={name}
                onChangeText={setName}
              />
            </View>

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

          {/* 완료 버튼 */}
          <Button
            title="시작하기"
            onPress={handleSubmit}
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || !name}
          />
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
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
});
