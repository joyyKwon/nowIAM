import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, removePassword } = useAuthStore();
  const { posts, fetchPosts } = usePostStore();

  useEffect(() => {
    if (profile) {
      fetchPosts(profile.id);
    }
  }, [profile]);

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
          <Text style={styles.infoValue}>{profile?.name || '이름 없음'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>생년월일</Text>
          <Text style={styles.infoValue}>{profile?.birth || '미설정'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>성별</Text>
          <Text style={styles.infoValue}>{profile?.sex || '미설정'}</Text>
        </View>
      </View>

      <View style={styles.aboutContainer}>
        <Text style={styles.aboutTitle}>너는 어떤 사람이야?</Text>
        <Text style={styles.aboutText}>
          {profile?.about || '자기소개를 작성해주세요'}
        </Text>
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
    marginBottom: spacing.md,
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
