import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { isValidBirthDate } from '@/lib/utils';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

type EditableField = 'name' | 'birth' | 'sex' | 'about';

const SEX_LABELS: Record<string, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, removePassword, signOut, updateProfile } = useAuthStore();
  const { posts, fetchPosts } = usePostStore();
  const { firstDay, loadSettings, setFirstDay } = useSettingsStore();
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draftValue, setDraftValue] = useState('');

  useEffect(() => {
    if (profile) {
      fetchPosts(profile.id);
    }
  }, [profile]);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handlePasswordToggle = async (value: boolean) => {
    if (value) {
      router.push('/(auth)/set-password');
    } else {
      await removePassword();
    }
  };

  const startEdit = (field: EditableField, currentValue: string) => {
    setDraftValue(currentValue);
    setEditingField(field);
  };

  const saveEdit = async () => {
    const field = editingField;
    if (!field) return;

    if (field === 'birth' && draftValue && !isValidBirthDate(draftValue)) {
      Alert.alert('알림', '생년월일 형식이 올바르지 않습니다. (예: 2000-01-01)');
      return;
    }

    setEditingField(null);

    try {
      await updateProfile({ [field]: draftValue });
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

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/intro');
        },
      },
    ]);
  };

  const defaultProfileImage = 'https://via.placeholder.com/150';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileImageContainer}>
          <Image
            source={{ uri: profile?.profileImage || defaultProfileImage }}
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>게시물</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
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
      </View>

      <View style={styles.aboutContainer}>
        <Text style={styles.aboutTitle}>너는 어떤 사람이야?</Text>
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

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>설정</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>암호사용</Text>
          <Switch
            value={profile?.passwordEnabled || false}
            onValueChange={handlePasswordToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>월요일부터 시작</Text>
          <Switch
            value={firstDay === 1}
            onValueChange={(value) => setFirstDay(value ? 1 : 0)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
          <Text style={[styles.settingLabel, styles.logoutLabel]}>로그아웃</Text>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Ionicons name="create-outline" size={20} color={colors.background} />
        <Text style={styles.editButtonText}>프로필 수정</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileImageContainer: {
    marginRight: spacing.xl,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
  },
  statsContainer: {
    flex: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoContainer: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 26,
    marginBottom: spacing.sm + 2,
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
  aboutContainer: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aboutTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  aboutText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    minHeight: 80,
  },
  aboutInput: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  settingsContainer: {
    padding: spacing.xl,
  },
  settingsTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  logoutLabel: {
    color: colors.error,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    margin: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  editButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: '600',
  },
});
