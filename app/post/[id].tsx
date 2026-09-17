import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_MARGIN = 16;
const MEDIA_WIDTH = SCREEN_WIDTH - MEDIA_MARGIN * 2;
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { usePostStore } from '@/stores/postStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, getFeelingEmoji } from '@/lib/utils';
import { spacing, fontSize, borderRadius, ThemeColors } from '@/constants/theme';
import { useThemeColors, useIsDarkMode } from '@/hooks/useThemeColors';
import { format } from 'date-fns';

export default function PostDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const isDarkMode = useIsDarkMode();
  const styles = createStyles(colors, isDarkMode);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { currentPost, fetchPostById, deletePost } = usePostStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPostById(id);
    }
  }, [id]);

  const handleEdit = () => {
    router.push(`/post/edit/${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      '게시물 삭제',
      '현재 글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deletePost(id);
              Alert.alert('성공', '게시물이 삭제되었습니다.', [
                {
                  text: '확인',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('오류', '게시물 삭제에 실패했습니다.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const headerTitle = currentPost
    ? format(new Date(currentPost.createdAt), 'yyyy-MM-dd')
    : '게시물';

  if (!currentPost) {
    return (
      <View style={styles.container}>
        <CustomHeader title="게시물" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title={headerTitle} />
      <ScrollView style={styles.scrollContent}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {profile?.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
          )}
          <View>
            <Text style={styles.userName}>{profile?.name || '이름 없음'}</Text>
            <Text style={styles.location}>{currentPost.location || ''}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => {
          Alert.alert(
            '메뉴',
            '',
            [
              { text: '수정', onPress: handleEdit },
              {
                text: '삭제',
                style: 'destructive',
                onPress: handleDelete,
              },
              { text: '취소', style: 'cancel' },
            ]
          );
        }}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 미디어 */}
      <View style={styles.mediaContainer}>
        {currentPost.mediaType === 'video' ? (
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: currentPost.videoUrl }}
              style={styles.media}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={64} color="white" />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / MEDIA_WIDTH);
                setActiveImageIndex(index);
              }}
            >
              {currentPost.imageUrls.map((url, index) => (
                <Image
                  key={url + index}
                  source={{ uri: url }}
                  style={[styles.media, { width: MEDIA_WIDTH }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {currentPost.imageUrls.length > 1 && (
              <View style={styles.galleryDots}>
                {currentPost.imageUrls.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.galleryDot,
                      index === activeImageIndex && styles.galleryDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* 내용 */}
      <View style={styles.content}>
        {/* 키워드 */}
        {currentPost.keywords && currentPost.keywords.length > 0 && (
          <View style={styles.keywordsContainer}>
            <Text style={styles.keywords}>
              {currentPost.keywords.map(k => `#${k}`).join(' ')}
            </Text>
          </View>
        )}

        {/* 본문 */}
        {currentPost.content && (
          <Text style={styles.text}>{currentPost.content}</Text>
        )}

        {/* 기분 */}
        {currentPost.feeling !== null && currentPost.feeling !== undefined && (
          <View style={styles.feelingContainer}>
            <Text style={styles.feelingEmoji}>
              {getFeelingEmoji(currentPost.feeling)}
            </Text>
            <Text style={styles.feelingText}>
              기분: {currentPost.feeling}/10
            </Text>
          </View>
        )}

        {/* 날짜 */}
        <Text style={styles.date}>
          {formatDate(currentPost.createdAt, 'full')}
        </Text>

        {/* 공개 여부 */}
        <View style={styles.publicContainer}>
          <Ionicons
            name={currentPost.isPublic ? 'globe-outline' : 'lock-closed-outline'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.publicText}>
            {currentPost.isPublic ? '공개' : '비공개'}
          </Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#2a2420' : '#fefaf7',
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  mediaContainer: {
    aspectRatio: 1,
    marginHorizontal: MEDIA_MARGIN,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  galleryDots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  galleryDotActive: {
    backgroundColor: colors.white,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    padding: spacing.xl,
  },
  keywordsContainer: {
    marginBottom: spacing.md,
  },
  keywords: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  text: {
    fontSize: fontSize.md,
    fontFamily: 'serif',
    color: colors.text,
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  feelingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  feelingEmoji: {
    fontSize: fontSize.xxl,
  },
  feelingText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  publicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  publicText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
