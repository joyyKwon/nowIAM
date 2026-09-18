import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PanResponder,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { uploadFile, generateFileName } from '@/lib/storage';
import { getMediaType, validateKeywords, formatDate, getFeelingEmoji } from '@/lib/utils';
import { MAX_POST_IMAGES, MAX_POST_KEYWORDS } from '@/types/models';
import { spacing, fontSize, borderRadius, ThemeColors } from '@/constants/theme';
import { useThemeColors, useIsDarkMode } from '@/hooks/useThemeColors';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

// 캘린더 무드 히트맵과 동일한 골드/앰버 계열
const MOOD_GRADIENT: [string, string] = ['#E9BF7A', '#FAB52D'];

export default function EditPostScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const isDarkMode = useIsDarkMode();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, isDarkMode);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { currentPost, fetchPostById, updatePost } = usePostStore();

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [feeling, setFeeling] = useState(5);
  const [location, setLocation] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const moodTrackRef = useRef<View>(null);
  const moodTrackLayout = useRef({ pageX: 0, width: 0 });

  const updateFeelingFromPageX = (pageX: number) => {
    const { pageX: trackX, width } = moodTrackLayout.current;
    if (width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (pageX - trackX) / width));
    setFeeling(Math.round(ratio * 10));
  };

  const moodPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => updateFeelingFromPageX(evt.nativeEvent.pageX),
      onPanResponderMove: (evt) => updateFeelingFromPageX(evt.nativeEvent.pageX),
    })
  ).current;

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      await fetchPostById(id);
    } catch (error) {
      console.error('Load post error:', error);
      Alert.alert('오류', '게시물을 불러올 수 없습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentPost && currentPost.id === id) {
      setMediaType(currentPost.mediaType || 'image');
      setImageUris(currentPost.imageUrls || []);
      setVideoUri(currentPost.videoUrl || '');
      setContent(currentPost.content || '');
      setKeywords(currentPost.keywords || []);
      setFeeling(currentPost.feeling ?? 5);
      setLocation(currentPost.location || '');
      if (currentPost.location && currentPost.latitude != null && currentPost.longitude != null) {
        setLocationData({
          latitude: currentPost.latitude,
          longitude: currentPost.longitude,
          address: currentPost.location,
        });
      }
      setIsPublic(currentPost.isPublic ?? true);
    }
  }, [currentPost]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: MAX_POST_IMAGES,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    const hasVideo = result.assets.some(a => getMediaType(a.uri) === 'video');
    const hasImage = result.assets.some(a => getMediaType(a.uri) === 'image');

    if (hasVideo && hasImage) {
      Alert.alert('알림', '사진과 동영상은 함께 선택할 수 없습니다.');
      return;
    }

    if (hasVideo) {
      if (result.assets.length > 1) {
        Alert.alert('알림', '동영상은 1개만 선택할 수 있습니다.');
        return;
      }
      setMediaType('video');
      setVideoUri(result.assets[0].uri);
      setImageUris([]);
      return;
    }

    const newUris = result.assets.map(a => a.uri);
    setMediaType('image');
    setVideoUri('');
    setImageUris(prev => {
      const combined = [...prev, ...newUris];
      if (combined.length > MAX_POST_IMAGES) {
        Alert.alert('알림', `사진은 최대 ${MAX_POST_IMAGES}장까지 추가할 수 있습니다.`);
        return combined.slice(0, MAX_POST_IMAGES);
      }
      return combined;
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    if (mediaType === 'image' && imageUris.length >= MAX_POST_IMAGES) {
      Alert.alert('알림', `사진은 최대 ${MAX_POST_IMAGES}장까지 추가할 수 있습니다.`);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaType('image');
      setVideoUri('');
      setImageUris(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const handlePickMedia = () => {
    Alert.alert('미디어 추가', undefined, [
      { text: '사진 촬영', onPress: takePhoto },
      { text: '앨범 선택', onPress: pickImage },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const addKeyword = () => {
    if (newKeyword.trim() === '') {
      setIsAddingKeyword(false);
      return;
    }
    if (keywords.length >= MAX_POST_KEYWORDS) {
      Alert.alert('알림', `태그는 최대 ${MAX_POST_KEYWORDS}개까지 추가할 수 있습니다.`);
      setIsAddingKeyword(false);
      return;
    }

    setKeywords([...keywords, newKeyword.trim()]);
    setNewKeyword('');
    setIsAddingKeyword(false);
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const hasMedia = mediaType === 'video' ? !!videoUri : imageUris.length > 0;

    if (!hasMedia) {
      Alert.alert('알림', '사진 또는 동영상을 선택해주세요.');
      return;
    }

    if (!profile) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    if (keywords.length > 0 && !validateKeywords(keywords)) {
      Alert.alert('알림', `태그는 최대 ${MAX_POST_KEYWORDS}개, 각 20자 이하로 입력해주세요.`);
      return;
    }

    try {
      setIsSubmitting(true);

      // 로컬 파일(file://, ph:// 등)만 새로 업로드, 이미 올라간 URL(http)은 그대로 사용
      let finalImageUrls: string[] = [];
      let finalVideoUrl: string | undefined;

      if (mediaType === 'video') {
        if (videoUri.startsWith('http')) {
          finalVideoUrl = videoUri;
        } else {
          const extension = videoUri.split('.').pop() || 'mp4';
          const fileName = generateFileName(profile.id, extension);
          const { url, error } = await uploadFile('posts', fileName, videoUri, 'video/mp4');

          if (error || !url) {
            throw new Error('파일 업로드 실패');
          }
          finalVideoUrl = url;
        }
      } else {
        for (const uri of imageUris) {
          if (uri.startsWith('http')) {
            finalImageUrls.push(uri);
            continue;
          }

          const extension = uri.split('.').pop() || 'jpg';
          const fileName = generateFileName(profile.id, extension);
          const { url, error } = await uploadFile('posts', fileName, uri, 'image/jpeg');

          if (error || !url) {
            throw new Error('파일 업로드 실패');
          }
          finalImageUrls.push(url);
        }
      }

      // 게시물 업데이트
      await updatePost(id, {
        imageUrls: mediaType === 'image' ? finalImageUrls : [],
        videoUrl: mediaType === 'video' ? finalVideoUrl : undefined,
        mediaType,
        content: content.trim() || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        feeling,
        location: location.trim() || undefined,
        isPublic,
      });

      Alert.alert('성공', '게시물이 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Update post error:', error);
      Alert.alert('오류', '게시물 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>게시물 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  const hasMedia = mediaType === 'video' ? !!videoUri : imageUris.length > 0;
  const canSubmit = hasMedia && !isSubmitting;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerSide}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerDateText}>
          {currentPost ? formatDate(currentPost.createdAt, 'short') : ''}
        </Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.headerSubmitButton, !canSubmit && styles.headerSubmitButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.headerSubmitText}>완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* 미디어 */}
          {mediaType === 'video' && videoUri ? (
            <View style={styles.heroContainer}>
              <Image source={{ uri: videoUri }} style={styles.hero} />
              <View style={styles.videoBadge}>
                <Ionicons name="play-circle" size={20} color={colors.white} />
              </View>
              <TouchableOpacity style={styles.changeMediaButton} onPress={pickImage}>
                <Ionicons name="images" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : imageUris.length > 0 ? (
            <>
              <View style={styles.heroContainer}>
                <Image source={{ uri: imageUris[0] }} style={styles.hero} />
                {imageUris.length > 1 && (
                  <View style={styles.heroCountBadge}>
                    <Text style={styles.heroCountText}>1/{imageUris.length}</Text>
                  </View>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbStrip}
                contentContainerStyle={styles.thumbStripContent}
              >
                {imageUris.map((uri, index) => (
                  <View key={uri + index} style={styles.thumbWrapper}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumb, index === 0 && styles.thumbActive]}
                    />
                    <TouchableOpacity
                      style={styles.removeThumbButton}
                      onPress={() => removeImage(index)}
                      hitSlop={4}
                    >
                      <Ionicons name="close" size={11} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                {imageUris.length < MAX_POST_IMAGES && (
                  <TouchableOpacity style={styles.addThumb} onPress={pickImage}>
                    <Ionicons name="add" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </>
          ) : (
            <TouchableOpacity style={styles.mediaEmpty} onPress={handlePickMedia} activeOpacity={0.8}>
              <View style={styles.mediaEmptyButton}>
                <Ionicons name="add" size={26} color={colors.textSecondary} />
              </View>
              <Text style={styles.mediaEmptyPrompt}>오늘의 순간을 담아보세요</Text>
            </TouchableOpacity>
          )}

          {/* 본문 */}
          <TextInput
            style={styles.textArea}
            placeholder="오늘 하루는 어땠나요?"
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
          />

          {/* 기분 */}
          <View style={styles.moodRow}>
            <Text style={styles.moodEmojiEdge}>{getFeelingEmoji(0)}</Text>
            <View
              ref={moodTrackRef}
              style={styles.moodTrackWrapper}
              onLayout={() => {
                moodTrackRef.current?.measure((x, y, width, height, pageX) => {
                  moodTrackLayout.current = { pageX, width };
                });
              }}
              {...moodPanResponder.panHandlers}
            >
              <LinearGradient
                colors={MOOD_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.moodTrack}
              />
              <View style={[styles.moodThumb, { left: `${(feeling / 10) * 100}%` }]} />
            </View>
            <Text style={styles.moodEmojiEdge}>{getFeelingEmoji(10)}</Text>
          </View>

          {/* 태그 */}
          <View style={styles.keywordsContainer}>
            {keywords.map((keyword, index) => (
              <TouchableOpacity
                key={index}
                style={styles.keywordChip}
                onPress={() => removeKeyword(index)}
              >
                <Text style={styles.keywordText}>#{keyword}</Text>
                <Ionicons name="close" size={12} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
            {keywords.length < MAX_POST_KEYWORDS && (
              isAddingKeyword ? (
                <TextInput
                  style={styles.keywordInput}
                  placeholder="태그"
                  placeholderTextColor={colors.textSecondary}
                  value={newKeyword}
                  onChangeText={setNewKeyword}
                  onSubmitEditing={addKeyword}
                  onBlur={addKeyword}
                  maxLength={20}
                  autoFocus
                  returnKeyType="done"
                />
              ) : (
                <TouchableOpacity style={styles.addKeywordChip} onPress={() => setIsAddingKeyword(true)}>
                  <Text style={styles.addKeywordText}>+ 태그</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* 위치 / 공개 여부 */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.toolbarRow}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons
                name={location ? 'location' : 'location-outline'}
                size={17}
                color={location ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.toolbarRowText, location && styles.toolbarTextActive]}
                numberOfLines={1}
              >
                {location || '위치 추가'}
              </Text>
              {location ? (
                <TouchableOpacity
                  onPress={() => {
                    setLocation('');
                    setLocationData(null);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            <View style={[styles.toolbarRow, styles.toolbarRowLast]}>
              <Ionicons
                name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                size={17}
                color={colors.textSecondary}
              />
              <Text style={styles.toolbarRowText}>{isPublic ? '공개' : '비공개'}</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          <LocationPicker
            visible={showLocationPicker}
            onClose={() => setShowLocationPicker(false)}
            onSelectLocation={(data) => {
              setLocationData(data);
              setLocation(data.address);
            }}
            initialLocation={locationData || undefined}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#2a2420' : '#fefaf7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerSide: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerCancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  headerDateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  headerSubmitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    minWidth: 56,
    alignItems: 'center',
  },
  headerSubmitButtonDisabled: {
    opacity: 0.4,
  },
  headerSubmitText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: '600',
  },
  heroContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: isDarkMode ? '#352b22' : '#f5ebe0',
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  heroCountBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  heroCountText: {
    fontSize: fontSize.xs,
    color: colors.white,
  },
  videoBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: borderRadius.full,
    padding: 2,
  },
  changeMediaButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  thumbStrip: {
    marginTop: spacing.sm,
  },
  thumbStripContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  thumbWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    opacity: 0.55,
  },
  thumbActive: {
    opacity: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  removeThumbButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmpty: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#352b22' : '#f5ebe0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mediaEmptyButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: isDarkMode ? '#2a2420' : '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmptyPrompt: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  textArea: {
    padding: spacing.lg,
    fontSize: fontSize.md,
    fontFamily: 'serif',
    lineHeight: 24,
    color: colors.text,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  moodEmojiEdge: {
    fontSize: fontSize.md,
  },
  moodTrackWrapper: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  moodTrack: {
    height: 5,
    borderRadius: 3,
  },
  moodThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: '#FAB52D',
    marginLeft: -9,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#352b22' : '#f5ebe0',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  keywordText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  addKeywordChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  addKeywordText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  keywordInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontSize: fontSize.xs,
    color: colors.text,
    minWidth: 80,
  },
  toolbar: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  toolbarRowLast: {
    borderBottomWidth: 0,
  },
  toolbarRowText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  toolbarTextActive: {
    color: colors.text,
  },
});
