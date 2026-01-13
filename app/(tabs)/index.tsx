import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { formatDate } from '@/lib/utils';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { posts } = usePostStore();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [postsOnDate, setPostsOnDate] = useState<any[]>([]);

  const getMarkedDates = () => {
    const marked: any = {};

    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const dateStr = date.toISOString().split('T')[0];

      marked[dateStr] = { marked: true, dotColor: colors.primary };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marked;
  };

  const handleDayPress = async (day: any) => {
    setSelectedDate(day.dateString);

    const date = new Date(day.dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dayNum = date.getDate();

    if (profile) {
      const result = await usePostStore.getState().getPostsByDate(profile.id, year, month, dayNum);
      setPostsOnDate(result);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={getMarkedDates()}
          theme={{
            todayTextColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            arrowColor: colors.primary,
          }}
        />
      </View>

      {selectedDate && (
        <View style={styles.postsContainer}>
          <Text style={styles.dateTitle}>
            {formatDate(selectedDate, 'short')}
          </Text>

          {postsOnDate.length === 0 ? (
            <Text style={styles.emptyText}>이 날짜에 게시물이 없습니다</Text>
          ) : (
            postsOnDate.map(post => (
              <TouchableOpacity
                key={post.id}
                style={styles.postItem}
                onPress={() => router.push(`/post/${post.id}`)}
              >
                <Text style={styles.postKeywords}>
                  {post.keywords?.map((k: string) => `#${k}`).join(' ') || ''}
                </Text>
                <Text style={styles.postContent} numberOfLines={2}>
                  {post.content}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendarContainer: {
    padding: spacing.md,
  },
  postsContainer: {
    padding: spacing.md,
  },
  dateTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  postItem: {
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  postKeywords: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  postContent: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});
