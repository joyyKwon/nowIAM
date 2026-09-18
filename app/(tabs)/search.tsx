import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { getPostThumbnail } from '@/lib/utils';
import { fontSize, spacing, borderRadius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

const { width } = Dimensions.get('window');
const GRID_GAP = 6;
const GRID_PADDING = spacing.xs;
const itemSize = (width - GRID_PADDING * 2 - GRID_GAP * 2 * 3) / 3;
const MAX_RECENT_SEARCHES = 8;

export default function SearchScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { profile } = useAuthStore();
  const { posts, searchPosts, popularTags, fetchPopularTags } = usePostStore();
  const inputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 탭 전환 시 검색 상태 초기화 (최근 검색어는 세션 동안 유지)
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
      };
    }, [])
  );

  // 전체 유저의 인기 태그 (공개 게시물 기준) 자동완성 후보로 한 번 불러오기
  useEffect(() => {
    fetchPopularTags();
  }, []);

  // 내 게시물에 달린 모든 태그 (자동완성 후보)
  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => p.keywords || []))),
    [posts]
  );

  // 입력한 문자로 "시작하는" 단어만 자동완성으로 제공 (포털 검색어 자동완성 방식)
  // 내가 실제로 쓴 태그를 먼저 보여주고, 전체 유저 인기 태그로 채움
  const suggestionWords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const ownMatches = allTags
      .filter((tag) => tag.toLowerCase().startsWith(query))
      .map((word) => ({ word, isOwn: true }));

    const ownSet = new Set(allTags);
    const popularMatches = popularTags
      .filter((word) => !ownSet.has(word) && word.toLowerCase().startsWith(query))
      .map((word) => ({ word, isOwn: false }));

    return [...ownMatches, ...popularMatches].slice(0, 8);
  }, [allTags, popularTags, searchQuery]);

  const showSuggestions = isFocused && suggestionWords.length > 0;

  const runSearch = async (query: string) => {
    if (!query.trim() || !profile) return;

    Keyboard.dismiss();
    setIsFocused(false);
    setIsSearching(true);
    setHasSearched(true);

    const results = await searchPosts(profile.id, query.trim());
    setSearchResults(results);
    setIsSearching(false);

    const trimmed = query.trim();
    setRecentSearches(prev => [trimmed, ...prev.filter(q => q !== trimmed)].slice(0, MAX_RECENT_SEARCHES));
  };

  const handleSearch = () => runSearch(searchQuery);

  const handleSelectRecent = (query: string) => {
    setSearchQuery(query);
    runSearch(query);
  };

  const handleRemoveRecent = (query: string) => {
    setRecentSearches(prev => prev.filter(q => q !== query));
  };

  const handleCancel = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleSelectSuggestionWord = (word: string) => {
    setSearchQuery(word);
    runSearch(word);
  };

  const renderResultItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <Image
        source={{ uri: getPostThumbnail(item) }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      {item.mediaType === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={28} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const showCancelButton = isFocused || searchQuery.length > 0;

  return (
    <View style={styles.container}>
      {/* 검색 입력창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="태그 또는 내용 검색"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {showCancelButton && (
          <TouchableOpacity onPress={handleCancel} hitSlop={8}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 자동완성 (포털 검색처럼 단어만 제공) */}
      {showSuggestions && (
        <View style={styles.suggestionsCard}>
          {suggestionWords.map(({ word, isOwn }, index) => (
            <TouchableOpacity
              key={word}
              style={[
                styles.suggestionItem,
                index === suggestionWords.length - 1 && styles.suggestionItemLast,
              ]}
              onPress={() => handleSelectSuggestionWord(word)}
            >
              <Ionicons name="search" size={15} color={colors.textSecondary} />
              <Text style={styles.suggestionWordText} numberOfLines={1}>
                <Text style={styles.suggestionWordMatch}>
                  {word.slice(0, searchQuery.trim().length)}
                </Text>
                {word.slice(searchQuery.trim().length)}
              </Text>
              {!isOwn && (
                <View style={styles.suggestionBadge}>
                  <Text style={styles.suggestionBadgeText}>인기</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 검색 전 / 결과 없음 / 결과 그리드 */}
      {showSuggestions ? null : !hasSearched ? (
        <View style={styles.beforeSearchContainer}>
          {recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>최근 검색</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])} hitSlop={8}>
                  <Text style={styles.recentClearAll}>전체 삭제</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentChips}>
                {recentSearches.map((query) => (
                  <TouchableOpacity
                    key={query}
                    style={styles.recentChip}
                    onPress={() => handleSelectRecent(query)}
                  >
                    <Text style={styles.recentChipText}>{query}</Text>
                    <TouchableOpacity onPress={() => handleRemoveRecent(query)} hitSlop={8}>
                      <Ionicons name="close" size={13} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <Text style={styles.beforeSearchPrompt}>태그나 내용으로 기록을 찾아보세요</Text>
        </View>
      ) : isSearching ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색 중...</Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={40} color={colors.border} />
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          <Text style={styles.emptySubtext}>
            다른 검색어로 시도해보세요
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultCountText}>결과 {searchResults.length}개</Text>
          <FlatList
            data={searchResults}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.resultsGrid}
          />
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSize.sm,
    color: colors.text,
  },
  cancelText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  suggestionsCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 0.5,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionWordText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  suggestionWordMatch: {
    color: colors.text,
    fontWeight: '600',
  },
  suggestionBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  suggestionBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  beforeSearchContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  recentClearAll: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  recentChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  beforeSearchPrompt: {
    fontSize: fontSize.sm,
    color: colors.border,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  resultCountText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md + GRID_PADDING,
    paddingTop: spacing.sm,
  },
  resultsGrid: {
    padding: GRID_PADDING,
  },
  gridItem: {
    width: itemSize,
    height: itemSize,
    margin: GRID_GAP,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
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
  },
});
