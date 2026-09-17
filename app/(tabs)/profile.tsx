import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { requestNotificationPermission, refreshReminderSchedule } from '@/lib/notifications';
import { spacing, fontSize, borderRadius, ThemeColors } from '@/constants/theme';
import { useThemeColors, useIsDarkMode } from '@/hooks/useThemeColors';
import { ThemeMode } from '@/stores/settingsStore';

const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  system: '시스템',
  light: '라이트',
  dark: '다크',
};

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const isDarkMode = useIsDarkMode();
  const styles = createStyles(colors, isDarkMode);
  const { profile, removePassword, signOut, refreshProfile, deleteAccount } = useAuthStore();
  const { posts, fetchPosts } = usePostStore();
  const {
    firstDay,
    themeMode,
    notificationsEnabled,
    loadSettings,
    setFirstDay,
    setThemeMode,
    setNotificationsEnabled,
  } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchPosts(profile.id);
    }
  }, [profile]);

  useEffect(() => {
    loadSettings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    if (profile) {
      await fetchPosts(profile.id);
    }
    setRefreshing(false);
  };

  const handlePasswordToggle = async (value: boolean) => {
    if (value) {
      router.push('/(auth)/set-password');
    } else {
      await removePassword();
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('알림 권한 필요', '기기 설정에서 알림 권한을 허용해주세요.');
        return;
      }
    }

    await setNotificationsEnabled(value);
    await refreshReminderSchedule(value, posts);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 계정과 모든 게시물이 영구적으로 삭제되며 복구할 수 없습니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (!result.success) {
              Alert.alert('오류', result.error || '계정 삭제에 실패했습니다.');
              return;
            }
            router.replace('/(auth)/intro');
          },
        },
      ]
    );
  };

  const recordedDays = new Set(
    posts.map((post) => new Date(post.createdAt).toISOString().split('T')[0])
  ).size;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingSub}>좋은 하루예요</Text>
        <Text style={styles.greetingName}>
          {profile?.name ? `${profile.name}님` : '이름을 설정해주세요'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.summaryCard}
        activeOpacity={0.85}
        onPress={() => router.push('/profile/info')}
      >
        <View style={styles.summaryTopRow}>
          <View style={styles.profileImageContainer}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={30} color={colors.textSecondary} />
              </View>
            )}
          </View>

          <View style={styles.summaryTextGroup}>
            <Text style={styles.summaryAbout} numberOfLines={2}>
              {profile?.about || '자기소개를 작성해주세요'}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{recordedDays}</Text>
          <Text style={styles.statLabel}>기록일</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>일기</Text>
        </View>
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>설정</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={styles.settingLabel}>암호사용</Text>
            </View>
            <Switch
              value={profile?.passwordEnabled || false}
              onValueChange={handlePasswordToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.settingLabel}>월요일부터 시작</Text>
            </View>
            <Switch
              value={firstDay === 1}
              onValueChange={(value) => setFirstDay(value ? 1 : 0)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              <Text style={styles.settingLabel}>일기 리마인더 알림</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
              <Text style={styles.settingLabel}>화면 테마</Text>
            </View>
            <View style={styles.sexInlineButtons}>
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.sexInlineButton, themeMode === mode && styles.sexInlineButtonActive]}
                  onPress={() => setThemeMode(mode)}
                >
                  <Text
                    style={[
                      styles.sexInlineButtonText,
                      themeMode === mode && styles.sexInlineButtonTextActive,
                    ]}
                  >
                    {THEME_MODE_LABELS[mode]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <TouchableOpacity style={[styles.settingRow, styles.settingRowLast]} onPress={handleLogout}>
            <View style={styles.settingLabelGroup}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={[styles.settingLabel, styles.logoutLabel]}>로그아웃</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteAccountLink} onPress={handleDeleteAccount} hitSlop={8}>
          <Text style={styles.deleteAccountLinkText}>회원 탈퇴</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  greeting: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  greetingSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  greetingName: {
    fontSize: fontSize.xl,
    fontWeight: '500',
    color: colors.text,
  },
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.full,
  },
  profileImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryAbout: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#3a2b14' : '#FAEEDA',
  },
  statNumber: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: isDarkMode ? '#FAC775' : '#633806',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: isDarkMode ? '#EF9F27' : '#854F0B',
    marginTop: 2,
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
  settingsContainer: {
    padding: spacing.xl,
  },
  settingsTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  logoutLabel: {
    color: colors.error,
  },
  deleteAccountLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  deleteAccountLinkText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
