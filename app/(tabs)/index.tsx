import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatDate, getPostThumbnail } from '@/lib/utils';
import { CalendarDay } from '@/components/ui/CalendarDay';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_PADDING = spacing.xs;
const itemSize = (width - GRID_PADDING * 2 - GRID_GAP * 2 * 3) / 3;

type ViewMode = 'grid' | 'list' | 'calendar';

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { posts, fetchPosts, isLoading } = usePostStore();
  const { firstDay, loadSettings } = useSettingsStore();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [postsOnDate, setPostsOnDate] = useState<any[]>([]);
  const [hasSelectedBefore, setHasSelectedBefore] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchPosts(profile.id, sortOrder);
    }
  }, [profile, sortOrder]);

  // 달력 모드로 전환 시 오늘 날짜 자동 선택 (첫 번째 접근 시에만)
  useEffect(() => {
    if (viewMode === 'calendar' && !hasSelectedBefore) {
      const today = getTodayString();
      handleDayPress({ dateString: today });
      setHasSelectedBefore(true);
    }
  }, [viewMode]);

  const handleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleAddPost = () => {
    router.push('/post/create');
  };

  const renderGridItem = ({ item }: any) => {
    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => router.push(`/post/${item.id}`)}
      >
        <Image
          source={{ uri: getPostThumbnail(item) }}
          style={styles.image}
          resizeMode="cover"
        />
        {item.mediaType === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={32} color="white" />
          </View>
        )}
        {item.mediaType === 'image' && item.imageUrls?.length > 1 && (
          <View style={styles.multiImageBadge}>
            <Ionicons name="copy-outline" size={14} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: any) => {
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => router.push(`/post/${item.id}`)}
      >
        <Image
          source={{ uri: getPostThumbnail(item) }}
          style={styles.listImage}
          resizeMode="cover"
        />
        <View style={styles.listContent}>
          <Text style={styles.listDate}>
            {new Date(item.createdAt).toLocaleDateString('ko-KR')}
          </Text>
          {item.content && (
            <Text style={styles.listText} numberOfLines={2}>
              {item.content}
            </Text>
          )}
          {item.keywords && item.keywords.length > 0 && (
            <View style={styles.listKeywords}>
              {item.keywords.map((keyword: string, index: number) => (
                <Text key={index} style={styles.listKeyword}>
                  #{keyword}
                </Text>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getMarkedDates = () => {
    const marked: any = {};
    posts.forEach((post) => {
      const date = new Date(post.createdAt).toISOString().split('T')[0];
      marked[date] = {
        marked: true,
        dotColor: colors.primary,
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.primary,
        customStyles: {
          text: {
            fontWeight: 'bold',
          },
        },
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

  const goToToday = () => {
    const today = getTodayString();
    handleDayPress({ dateString: today });
  };

  const isToday = selectedDate === getTodayString();

  const openMonthPicker = () => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    setPickerYear(base.getFullYear());
    setShowMonthPicker(true);
  };

  const handleSelectMonth = (month: number) => {
    setShowMonthPicker(false);
    const dateString = `${pickerYear}-${String(month).padStart(2, '0')}-01`;
    handleDayPress({ dateString });
  };

  const getMonthTitle = () => {
    const base = new Date(selectedDate || getTodayString());
    return `${base.getFullYear()}년 ${base.getMonth() + 1}월`;
  };

  const renderContent = () => {
    if (posts.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
          <Text style={styles.emptySubtext}>첫 게시물을 작성해보세요!</Text>
        </View>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <FlatList
            key="grid"
            data={posts}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
          />
        );
      case 'list':
        return (
          <FlatList
            key="list"
            data={posts}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        );
      case 'calendar':
        return (
          <View style={{ flex: 1 }}>
            <ScrollView>
              <View style={styles.calendarContainer}>
                <Calendar
                  key={`${selectedDate}-${firstDay}`}
                  current={selectedDate || getTodayString()}
                  markedDates={getMarkedDates()}
                  markingType="custom"
                  dayComponent={CalendarDay}
                  firstDay={firstDay}
                  onDayPress={handleDayPress}
                  customHeaderTitle={
                    <TouchableOpacity style={styles.monthTitleButton} onPress={openMonthPicker}>
                      <Text style={styles.monthTitleText}>{getMonthTitle()}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.text} />
                    </TouchableOpacity>
                  }
                  theme={{
                    backgroundColor: colors.background,
                    calendarBackground: colors.background,
                    textSectionTitleColor: colors.textSecondary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: colors.background,
                    todayTextColor: colors.primary,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.border,
                    dotColor: colors.primary,
                    monthTextColor: colors.text,
                    arrowColor: colors.primary,
                    // textDayFontWeight: '400',
                    // textMonthFontWeight: 'bold',
                    // textDayHeaderFontWeight: '600',
                  }}
                />
              </View>

              {selectedDate && (
                <View style={styles.calendarPostsContainer}>
                  <Text style={styles.calendarDateTitle}>
                    {formatDate(selectedDate, 'short')}
                  </Text>

                  {postsOnDate.length === 0 ? (
                    <Text style={styles.calendarEmptyText}>이 날짜에 게시물이 없습니다</Text>
                  ) : (
                    postsOnDate.map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        style={styles.calendarPostItem}
                        onPress={() => router.push(`/post/${post.id}`)}
                      >
                        <Image
                          source={{ uri: getPostThumbnail(post) }}
                          style={styles.calendarPostImage}
                          resizeMode="cover"
                        />
                        <View style={styles.calendarPostContent}>
                          <Text style={styles.calendarPostKeywords}>
                            {post.keywords?.map((k: string) => `#${k}`).join(' ') || ''}
                          </Text>
                          <Text style={styles.calendarPostText} numberOfLines={2}>
                            {post.content}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </ScrollView>

            {/* 오늘 버튼 (오늘이 아닌 경우에만 표시) */}
            {!isToday && (
              <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
                <Text style={styles.todayButtonText}>오늘</Text>
              </TouchableOpacity>
            )}

            <Modal
              visible={showMonthPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowMonthPicker(false)}
            >
              <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowMonthPicker(false)}
              >
                <TouchableOpacity style={styles.pickerCard} activeOpacity={1}>
                  <View style={styles.pickerYearRow}>
                    <TouchableOpacity onPress={() => setPickerYear((y) => y - 1)}>
                      <Ionicons name="chevron-back" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.pickerYearText}>{pickerYear}년</Text>
                    <TouchableOpacity onPress={() => setPickerYear((y) => y + 1)}>
                      <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerMonthGrid}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const base = new Date(selectedDate || getTodayString());
                      const isCurrent = pickerYear === base.getFullYear() && month === base.getMonth() + 1;
                      return (
                        <TouchableOpacity
                          key={month}
                          style={[styles.pickerMonthCell, isCurrent && styles.pickerMonthCellActive]}
                          onPress={() => handleSelectMonth(month)}
                        >
                          <Text
                            style={[
                              styles.pickerMonthText,
                              isCurrent && styles.pickerMonthTextActive,
                            ]}
                          >
                            {month}월
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* 보기 모드 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'grid' && styles.tabActive]}
          onPress={() => setViewMode('grid')}
        >
          <Ionicons
            name="grid-outline"
            size={20}
            color={viewMode === 'grid' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, viewMode === 'grid' && styles.tabTextActive]}>
            사진
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'list' && styles.tabActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons
            name="list-outline"
            size={20}
            color={viewMode === 'list' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, viewMode === 'list' && styles.tabTextActive]}>
            리스트
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'calendar' && styles.tabActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={viewMode === 'calendar' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, viewMode === 'calendar' && styles.tabTextActive]}>
            달력
          </Text>
        </TouchableOpacity>
      </View>

      {/* 헤더 (사진/리스트 모드에서만 표시) */}
      {viewMode !== 'calendar' && (
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
      )}

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
    padding: GRID_PADDING,
  },
  imageContainer: {
    width: itemSize,
    height: itemSize,
    margin: GRID_GAP,
    backgroundColor: colors.backgroundSecondary,
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
  multiImageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
  },
  listContainer: {
    padding: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden',
  },
  listImage: {
    width: 100,
    height: 100,
  },
  listContent: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  listDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  listText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  listKeyword: {
    fontSize: fontSize.xs,
    color: colors.primary,
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
  calendarContainer: {
    padding: spacing.sm,
  },
  calendarPostsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  calendarDateTitle: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
  },
  calendarEmptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  calendarPostItem: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: spacing.xs,
  },
  calendarPostImage: {
    width: 60,
    height: 60,
  },
  calendarPostContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  calendarPostKeywords: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  calendarPostText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  todayButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  todayButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  monthTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
  },
  monthTitleText: {
    fontSize: fontSize.md,
    fontWeight: '300',
    color: colors.text,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCard: {
    width: '85%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  pickerYearRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  pickerYearText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  pickerMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerMonthCell: {
    width: '33.33%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerMonthCellActive: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  pickerMonthText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  pickerMonthTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});
