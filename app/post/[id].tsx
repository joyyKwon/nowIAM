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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePostStore } from '@/stores/postStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, getFeelingEmoji } from '@/lib/utils';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { currentPost, fetchPostById, deletePost } = usePostStore();
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (!currentPost) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: profile?.profileImage || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
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
              source={{ uri: currentPost.imageUrl }}
              style={styles.media}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={64} color="white" />
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: currentPost.imageUrl }}
            style={styles.media}
            resizeMode="cover"
          />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.text,
    lineHeight: 24,
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
