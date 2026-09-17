import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuthStore } from '@/stores/authStore';
import { isValidBirthDate, normalizeBirthDate } from '@/lib/utils';
import { uploadFile, generateFileName } from '@/lib/storage';
import { spacing, fontSize, borderRadius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

type EditableField = 'name' | 'birth' | 'sex' | 'about';

const SEX_LABELS: Record<string, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
};

export default function ProfileInfoScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { profile, updateProfile } = useAuthStore();
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleProfileImagePress = () => {
    if (!profile?.profileImage) {
      handlePickProfileImage();
      return;
    }

    Alert.alert('프로필 사진', undefined, [
      { text: '사진 변경', onPress: handlePickProfileImage },
      { text: '기본 이미지로 변경', style: 'destructive', onPress: handleRemoveProfileImage },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handleRemoveProfileImage = async () => {
    try {
      setIsUploadingImage(true);
      await updateProfile({ profileImage: '' });
    } catch (error) {
      console.error('Remove profile image error:', error);
      Alert.alert('오류', '프로필 사진 삭제에 실패했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePickProfileImage = async () => {
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

    if (result.canceled || !result.assets[0]) return;

    try {
      setIsUploadingImage(true);
      const uri = result.assets[0].uri;
      const extension = uri.split('.').pop() || 'jpg';
      const fileName = generateFileName('profile', extension);

      const { url, error } = await uploadFile('profiles', fileName, uri, 'image/jpeg');
      if (error || !url) throw new Error('이미지 업로드 실패');

      await updateProfile({ profileImage: url });
    } catch (error) {
      console.error('Update profile image error:', error);
      Alert.alert('오류', '프로필 사진 변경에 실패했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const startEdit = (field: EditableField, currentValue: string) => {
    setDraftValue(currentValue);
    setEditingField(field);
  };

  const saveEdit = async () => {
    const field = editingField;
    if (!field) return;

    let valueToSave = draftValue;

    if (field === 'birth' && draftValue) {
      valueToSave = normalizeBirthDate(draftValue);
      if (!isValidBirthDate(valueToSave)) {
        Alert.alert('알림', '생년월일 형식이 올바르지 않습니다. (예: 2000-01-01)');
        return;
      }
    }

    setEditingField(null);

    try {
      await updateProfile({ [field]: valueToSave });
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('오류', '수정 중 오류가 발생했습니다.');
    }
  };

  const handleSelectSex = async (sex: string) => {
    setEditingField(null);

    try {
      await updateProfile({ sex });
    } catch (error) {
      console.error('Update sex error:', error);
      Alert.alert('오류', '수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={profile?.name ? `${profile.name}님의 정보` : '내 정보'} />
      <ScrollView style={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleProfileImagePress} disabled={isUploadingImage}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="add" size={18} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이름</Text>
            {editingField === 'name' ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={draftValue}
                  onChangeText={setDraftValue}
                  onSubmitEditing={saveEdit}
                  onBlur={saveEdit}
                  autoFocus
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={saveEdit} hitSlop={8}>
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => startEdit('name', profile?.name || '')}>
                <Text style={styles.infoValue}>{profile?.name || '이름 없음'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>생년월일</Text>
            {editingField === 'birth' ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={draftValue}
                  onChangeText={setDraftValue}
                  onSubmitEditing={saveEdit}
                  onBlur={saveEdit}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  autoFocus
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={saveEdit} hitSlop={8}>
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => startEdit('birth', profile?.birth || '')}>
                <Text style={styles.infoValue}>{profile?.birth || '미설정'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>성별</Text>
            {editingField === 'sex' ? (
              <View style={styles.sexInlineButtons}>
                {(['male', 'female', 'other'] as const).map((sex) => (
                  <TouchableOpacity
                    key={sex}
                    style={[
                      styles.sexInlineButton,
                      profile?.sex === sex && styles.sexInlineButtonActive,
                    ]}
                    onPress={() => handleSelectSex(sex)}
                  >
                    <Text
                      style={[
                        styles.sexInlineButtonText,
                        profile?.sex === sex && styles.sexInlineButtonTextActive,
                      ]}
                    >
                      {SEX_LABELS[sex]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingField('sex')}>
                <Text style={styles.infoValue}>
                  {profile?.sex ? SEX_LABELS[profile.sex] || profile.sex : '미설정'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>이메일</Text>
            <Text style={styles.infoValueDisabled}>{profile?.email || '미등록'}</Text>
          </View>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>소개</Text>
          {editingField === 'about' ? (
            <TextInput
              style={styles.aboutInput}
              value={draftValue}
              onChangeText={setDraftValue}
              onBlur={saveEdit}
              multiline
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => startEdit('about', profile?.about || '')}>
              <Text style={styles.aboutText}>
                {profile?.about || '자기소개를 작성해주세요'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  infoCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 26,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  infoValueDisabled: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  aboutCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  aboutTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  aboutText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    minHeight: 44,
  },
  aboutInput: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    minHeight: 44,
    padding: 0,
    textAlignVertical: 'top',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editInput: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    minWidth: 120,
    textAlign: 'right',
    padding: 0,
  },
  sexInlineButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sexInlineButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sexInlineButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sexInlineButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sexInlineButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});
