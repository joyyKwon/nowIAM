import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';
import { uploadFile, uriToBlob, generateFileName } from '@/lib/storage';
import { getMediaType, validateKeywords } from '@/lib/utils';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function CreatePostScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { createPost } = usePostStore();

  const [imageUri, setImageUri] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [feeling, setFeeling] = useState(5);
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setMediaType(getMediaType(uri));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setMediaType('image');
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() === '') return;
    if (keywords.length >= 3) {
      Alert.alert('알림', '키워드는 최대 3개까지 추가할 수 있습니다.');
      return;
    }

    setKeywords([...keywords, newKeyword.trim()]);
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('알림', '사진 또는 동영상을 선택해주세요.');
      return;
    }

    if (!profile) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    if (keywords.length > 0 && !validateKeywords(keywords)) {
      Alert.alert('알림', '키워드는 최대 3개, 각 20자 이하로 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. 이미지/동영상 업로드
      const extension = imageUri.split('.').pop() || 'jpg';
      const fileName = generateFileName(profile.id, extension);
      const blob = await uriToBlob(imageUri);

      const { url, error } = await uploadFile('posts', fileName, blob);

      if (error || !url) {
        throw new Error('파일 업로드 실패');
      }

      // 2. 게시물 생성
      const post = await createPost(profile.id, {
        imageUrl: url,
        mediaType,
        content: content.trim() || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        feeling,
        location: location.trim() || undefined,
        isPublic,
      });

      if (!post) {
        throw new Error('게시물 생성 실패');
      }

      Alert.alert('성공', '게시물이 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('오류', '게시물 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 이미지/동영상 선택 */}
        <View style={styles.mediaContainer}>
          {imageUri ? (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: imageUri }} style={styles.media} />
              <TouchableOpacity style={styles.changeMediaButton} onPress={pickImage}>
                <Ionicons name="images" size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
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
          <Text style={styles.label}>키워드 (최대 3개)</Text>
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
          {keywords.length < 3 && (
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
          title="게시"
          onPress={handleSubmit}
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={!imageUri || isSubmitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
});
