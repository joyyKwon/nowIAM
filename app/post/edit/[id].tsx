import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { CustomHeader } from '@/components/ui/CustomHeader';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { uploadFile, generateFileName } from '@/lib/storage';
import { getMediaType, validateKeywords } from '@/lib/utils';
import { MAX_POST_IMAGES, MAX_POST_KEYWORDS } from '@/types/models';
import { spacing, fontSize, borderRadius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function EditPostScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { currentPost, fetchPostById, updatePost } = usePostStore();

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [feeling, setFeeling] = useState(5);
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const addKeyword = () => {
    if (newKeyword.trim() === '') return;
    if (keywords.length >= MAX_POST_KEYWORDS) {
      Alert.alert('알림', `키워드는 최대 ${MAX_POST_KEYWORDS}개까지 추가할 수 있습니다.`);
      return;
    }

    setKeywords([...keywords, newKeyword.trim()]);
    setNewKeyword('');
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
      Alert.alert('알림', `키워드는 최대 ${MAX_POST_KEYWORDS}개, 각 20자 이하로 입력해주세요.`);
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
        <CustomHeader title="게시물 수정" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>게시물 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  const hasMedia = mediaType === 'video' ? !!videoUri : imageUris.length > 0;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="게시물 수정"
        headerLeft={
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.headerCancelText}>취소</Text>
          </TouchableOpacity>
        }
        headerRight={
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!hasMedia || isSubmitting}
            style={{ opacity: !hasMedia || isSubmitting ? 0.5 : 1 }}
          >
            <Text style={styles.headerSubmitText}>완료</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View style={styles.content}>
            {/* 이미지/동영상 선택 */}
        <View style={styles.mediaContainer}>
          {mediaType === 'video' && videoUri ? (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: videoUri }} style={styles.media} />
              <View style={styles.videoBadge}>
                <Ionicons name="play-circle" size={20} color={colors.background} />
              </View>
              <TouchableOpacity style={styles.changeMediaButton} onPress={pickImage}>
                <Ionicons name="images" size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
          ) : imageUris.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageStrip}>
              {imageUris.map((uri, index) => (
                <View key={uri + index} style={styles.imageThumbWrapper}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.background} />
                  </TouchableOpacity>
                </View>
              ))}
              {imageUris.length < MAX_POST_IMAGES && (
                <TouchableOpacity style={styles.addImageThumb} onPress={pickImage}>
                  <Ionicons name="add" size={32} color={colors.primary} />
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <View style={styles.mediaButtons}>
              <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                <Ionicons name="camera" size={48} color={colors.primary} />
                <Text style={styles.mediaButtonText}>사진 촬영</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                <Ionicons name="images" size={48} color={colors.primary} />
                <Text style={styles.mediaButtonText}>앨범 선택</Text>
              </TouchableOpacity>
            </View>
          )}
          {mediaType === 'image' && imageUris.length > 0 && (
            <Text style={styles.imageCountText}>{imageUris.length}/{MAX_POST_IMAGES}장</Text>
          )}
        </View>

        {/* 내용 */}
        <View style={styles.section}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={styles.textArea}
            placeholder="내용을 입력하세요"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 키워드 */}
        <View style={styles.section}>
          <Text style={styles.label}>키워드 (최대 {MAX_POST_KEYWORDS}개)</Text>
          <View style={styles.keywordsContainer}>
            {keywords.map((keyword, index) => (
              <TouchableOpacity
                key={index}
                style={styles.keywordChip}
                onPress={() => removeKeyword(index)}
              >
                <Text style={styles.keywordText}>#{keyword}</Text>
                <Ionicons name="close-circle" size={16} color={colors.background} />
              </TouchableOpacity>
            ))}
          </View>
          {keywords.length < MAX_POST_KEYWORDS && (
            <View style={styles.keywordInputContainer}>
              <TextInput
                style={styles.keywordInput}
                placeholder="키워드 입력"
                value={newKeyword}
                onChangeText={setNewKeyword}
                onSubmitEditing={addKeyword}
                maxLength={20}
              />
              <Button title="추가" onPress={addKeyword} size="sm" />
            </View>
          )}
        </View>

        {/* 기분 */}
        <View style={styles.section}>
          <Text style={styles.label}>기분 ({feeling}/10)</Text>
          <View style={styles.sliderContainer}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.sliderDot,
                  feeling === value && styles.sliderDotActive,
                ]}
                onPress={() => setFeeling(value)}
              />
            ))}
          </View>
        </View>

        {/* 위치 */}
        <View style={styles.section}>
          <Text style={styles.label}>위치</Text>
          <TextInput
            style={styles.input}
            placeholder="위치를 입력하세요"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* 공개 여부 */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>공개</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* 제출 버튼 */}
        <Button
          title="수정 완료"
          onPress={handleSubmit}
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={!hasMedia || isSubmitting}
        />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.xl,
  },
  mediaContainer: {
    marginBottom: spacing.xl,
  },
  mediaPreview: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  changeMediaButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  videoBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
    padding: 2,
  },
  imageStrip: {
    flexDirection: 'row',
  },
  imageThumbWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
  },
  addImageThumb: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageCountText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mediaButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  mediaButtonText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  keywordText: {
    fontSize: fontSize.sm,
    color: colors.background,
    fontWeight: '600',
  },
  keywordInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  keywordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
  },
  sliderDotActive: {
    backgroundColor: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  headerSubmitText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
});
