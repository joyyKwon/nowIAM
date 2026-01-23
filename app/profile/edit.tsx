import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { uploadFile, generateFileName } from '@/lib/storage';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();

  const [profileImage, setProfileImage] = useState(profile?.profileImage || '');
  const [name, setName] = useState(profile?.name || '');
  const [birth, setBirth] = useState(profile?.birth || '');
  const [sex, setSex] = useState(profile?.sex || '');
  const [about, setAbout] = useState(profile?.about || '');
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
    if (!profile) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      let imageUrl = profileImage;

      // 프로필 이미지가 변경되었으면 업로드
      if (profileImage && profileImage.startsWith('file://')) {
        const extension = profileImage.split('.').pop() || 'jpg';
        const fileName = generateFileName('profile', extension);

        const { url, error } = await uploadFile('profiles', fileName, profileImage, 'image/jpeg');

        if (error || !url) {
          throw new Error('이미지 업로드 실패');
        }

        imageUrl = url;
      }

      await updateProfile({
        profileImage: imageUrl,
        name: name.trim() || undefined,
        birth: birth.trim() || undefined,
        sex: sex.trim() || undefined,
        about: about.trim() || undefined,
      });

      Alert.alert('성공', '프로필이 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('오류', '프로필 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultProfileImage = 'https://via.placeholder.com/150';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 프로필 이미지 */}
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          <Image
            source={{ uri: profileImage || defaultProfileImage }}
            style={styles.image}
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>변경</Text>
          </View>
        </TouchableOpacity>

        {/* 이름 */}
        <View style={styles.section}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            placeholder="이름을 입력하세요"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 생년월일 */}
        <View style={styles.section}>
          <Text style={styles.label}>생년월일</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 1990-01-01"
            value={birth}
            onChangeText={setBirth}
          />
        </View>

        {/* 성별 */}
        <View style={styles.section}>
          <Text style={styles.label}>성별</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioButton, sex === '남' && styles.radioButtonActive]}
              onPress={() => setSex('남')}
            >
              <Text style={[styles.radioText, sex === '남' && styles.radioTextActive]}>
                남
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioButton, sex === '여' && styles.radioButtonActive]}
              onPress={() => setSex('여')}
            >
              <Text style={[styles.radioText, sex === '여' && styles.radioTextActive]}>
                여
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioButton, sex === '기타' && styles.radioButtonActive]}
              onPress={() => setSex('기타')}
            >
              <Text style={[styles.radioText, sex === '기타' && styles.radioTextActive]}>
                기타
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 자기소개 */}
        <View style={styles.section}>
          <Text style={styles.label}>너는 어떤 사람이야?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="자기소개를 작성해주세요"
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 저장 버튼 */}
        <Button
          title="저장"
          onPress={handleSubmit}
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: colors.border,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: borderRadius.full,
    borderBottomRightRadius: borderRadius.full,
  },
  imageOverlayText: {
    color: colors.background,
    fontSize: fontSize.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  radioButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  radioTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
});
