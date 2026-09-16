import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { getPostThumbnail } from '@/lib/utils';
import { colors, fontSize, spacing, borderRadius } from '@/constants/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { searchPosts } = usePostStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 탭 전환 시 초기화
  useFocusEffect(
    useCallback(() => {
      return () => {
        // 화면을 벗어날 때 초기화
        setSearchQuery('');
        setSearchResults([]);
        setSuggestions([]);
        setShowSuggestions(false);
        setHasSearched(false);
      };
    }, [])
  );

  // 실시간 검색 (debounce 적용)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (profile && searchQuery.trim()) {
        const results = await searchPosts(profile.id, searchQuery.trim());
        setSuggestions(results.slice(0, 5)); // 최대 5개만 표시
        setShowSuggestions(true);
      }
    }, 300); // 300ms 딜레이

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, profile]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !profile) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    Keyboard.dismiss();
    setShowSuggestions(false);
    setIsSearching(true);
    setHasSearched(true);

    const results = await searchPosts(profile.id, searchQuery.trim());
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSuggestion = (item: any) => {
    setShowSuggestions(false);
    Keyboard.dismiss();
    router.push(`/post/${item.id}`);
  };

  const renderResultItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <Image
        source={{ uri: getPostThumbnail(item) }}
        style={styles.resultImage}
        resizeMode="cover"
      />
      <View style={styles.resultContent}>
        {item.keywords && item.keywords.length > 0 && (
          <Text style={styles.resultKeywords}>
            {item.keywords.map((k: string) => `#${k}`).join(' ')}
          </Text>
        )}
        {item.content && (
          <Text style={styles.resultText} numberOfLines={2}>
            {item.content}
          </Text>
        )}
        <Text style={styles.resultDate}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 검색 입력창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="키워드 또는 내용 검색"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 자동완성 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item)}
            >
              <Image
                source={{ uri: getPostThumbnail(item) }}
                style={styles.suggestionImage}
                resizeMode="cover"
              />
              <View style={styles.suggestionContent}>
                {item.keywords && item.keywords.length > 0 && (
                  <Text style={styles.suggestionKeywords} numberOfLines={1}>
                    {item.keywords.map((k: string) => `#${k}`).join(' ')}
                  </Text>
                )}
                {item.content && (
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {item.content}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 검색 결과 */}
      {!hasSearched ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.border} />
          <Text style={styles.emptyText}>검색어를 입력하세요</Text>
          <Text style={styles.emptySubtext}>
            키워드(레이블) 또는 내용으로 검색할 수 있습니다
          </Text>
        </View>
      ) : isSearching ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색 중...</Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.border} />
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          <Text style={styles.emptySubtext}>
            다른 검색어로 시도해보세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderResultItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
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
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSize.md,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  suggestionKeywords: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  suggestionText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: 2,
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
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  resultsList: {
    padding: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  resultImage: {
    width: 80,
    height: 80,
  },
  resultContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  resultKeywords: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  resultText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
