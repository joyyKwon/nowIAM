import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { colors, spacing, fontSize } from '@/constants/theme';

const { width } = Dimensions.get('window');
const itemSize = (width - spacing.md * 4) / 3;

export default function PhotosScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { posts, fetchPosts, isLoading } = usePostStore();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (profile) {
      fetchPosts(profile.id, sortOrder);
    }
  }, [profile, sortOrder]);

  const handleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleAddPost = () => {
    router.push('/post/create');
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      {item.mediaType === 'video' ? (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={32} color="white" />
        </View>
      ) : null}
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSort} style={styles.sortButton}>
          <Text style={styles.sortText}>
            {sortOrder === 'desc' ? '최신순' : '오래된순'}
          </Text>
          <Ionicons name="swap-vertical" size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleAddPost} style={styles.addButton}>
          <Ionicons name="camera" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {posts.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
          <Text style={styles.emptySubtext}>첫 게시물을 작성해보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  addButton: {
    padding: spacing.xs,
  },
  grid: {
    padding: spacing.md,
  },
  imageContainer: {
    width: itemSize,
    height: itemSize,
    margin: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
    zIndex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
