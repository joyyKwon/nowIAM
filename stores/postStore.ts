import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Post, CreatePostInput, UpdatePostInput } from '@/types/models';
import { useSettingsStore } from '@/stores/settingsStore';
import { refreshReminderSchedule } from '@/lib/notifications';

const POST_SELECT = '*, post_images(image_url, position)';

function mapPost(row: any): Post {
  const images = (row.post_images || [])
    .slice()
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => img.image_url);

  return {
    id: row.id,
    userId: row.user_id,
    imageUrls: images,
    videoUrl: row.video_url ?? undefined,
    mediaType: row.media_type,
    content: row.content,
    keywords: row.keywords,
    feeling: row.feeling,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface PostState {
  posts: Post[];
  isLoading: boolean;
  currentPost: Post | null;
  popularTags: string[];

  // Actions
  fetchPosts: (userId: string, sortOrder?: 'asc' | 'desc') => Promise<void>;
  fetchPostById: (postId: string) => Promise<void>;
  createPost: (userId: string, input: CreatePostInput) => Promise<Post | null>;
  updatePost: (postId: string, input: UpdatePostInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  searchPosts: (userId: string, keyword: string) => Promise<Post[]>;
  getPostsByDate: (userId: string, year: number, month: number, day: number) => Promise<Post[]>;
  fetchPopularTags: () => Promise<void>;
  setCurrentPost: (post: Post | null) => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  currentPost: null,
  popularTags: [],

  fetchPosts: async (userId: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: sortOrder === 'asc' }) as any;

      if (error) throw error;

      const posts: Post[] = (data || []).map(mapPost);

      set({ posts, isLoading: false });
    } catch (error) {
      console.error('Fetch posts error:', error);
      set({ isLoading: false });
    }
  },

  fetchPostById: async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('id', postId)
        .single() as any;

      if (error) throw error;

      if (data) {
        set({ currentPost: mapPost(data) });
      }
    } catch (error) {
      console.error('Fetch post error:', error);
    }
  },

  createPost: async (userId: string, input: CreatePostInput) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          media_type: input.mediaType,
          video_url: input.mediaType === 'video' ? input.videoUrl : undefined,
          content: input.content,
          keywords: input.keywords,
          feeling: input.feeling,
          location: input.location,
          latitude: input.latitude,
          longitude: input.longitude,
          is_public: input.isPublic ?? true,
        } as any)
        .select()
        .single() as any;

      if (error) throw error;
      if (!data) return null;

      if (input.mediaType === 'image' && input.imageUrls?.length) {
        const rows = input.imageUrls.map((url, index) => ({
          post_id: data.id,
          image_url: url,
          position: index,
        }));

        const { error: imagesError } = await supabase.from('post_images').insert(rows as any);
        if (imagesError) throw imagesError;
      }

      const newPost = mapPost({ ...data, post_images: [] });
      newPost.imageUrls = input.mediaType === 'image' ? (input.imageUrls ?? []) : [];

      set(state => ({ posts: [newPost, ...state.posts] }));

      const { notificationsEnabled } = useSettingsStore.getState();
      refreshReminderSchedule(notificationsEnabled, get().posts).catch(() => {});

      return newPost;
    } catch (error) {
      console.error('Create post error:', error);
      return null;
    }
  },

  updatePost: async (postId: string, input: UpdatePostInput) => {
    try {
      const dbInput: any = {};
      if (input.videoUrl !== undefined) dbInput.video_url = input.videoUrl;
      if (input.mediaType !== undefined) dbInput.media_type = input.mediaType;
      if (input.content !== undefined) dbInput.content = input.content;
      if (input.keywords !== undefined) dbInput.keywords = input.keywords;
      if (input.feeling !== undefined) dbInput.feeling = input.feeling;
      if (input.location !== undefined) dbInput.location = input.location;
      if (input.latitude !== undefined) dbInput.latitude = input.latitude;
      if (input.longitude !== undefined) dbInput.longitude = input.longitude;
      if (input.isPublic !== undefined) dbInput.is_public = input.isPublic;

      const { data, error } = await supabase
        .from('posts')
        .update(dbInput as any)
        .eq('id', postId)
        .select()
        .single() as any;

      if (error) throw error;
      if (!data) return;

      if (input.imageUrls !== undefined) {
        const { error: deleteError } = await supabase
          .from('post_images')
          .delete()
          .eq('post_id', postId);
        if (deleteError) throw deleteError;

        if (input.imageUrls.length) {
          const rows = input.imageUrls.map((url, index) => ({
            post_id: postId,
            image_url: url,
            position: index,
          }));
          const { error: insertError } = await supabase.from('post_images').insert(rows as any);
          if (insertError) throw insertError;
        }
      }

      const updatedPost = mapPost({ ...data, post_images: [] });
      updatedPost.imageUrls =
        input.imageUrls !== undefined
          ? input.imageUrls
          : get().posts.find(p => p.id === postId)?.imageUrls ?? [];

      set(state => ({
        posts: state.posts.map(p => p.id === postId ? updatedPost : p),
        currentPost: state.currentPost?.id === postId ? updatedPost : state.currentPost,
      }));
    } catch (error) {
      console.error('Update post error:', error);
    }
  },

  deletePost: async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      set(state => ({
        posts: state.posts.filter(p => p.id !== postId),
        currentPost: state.currentPost?.id === postId ? null : state.currentPost,
      }));
    } catch (error) {
      console.error('Delete post error:', error);
    }
  },

  searchPosts: async (userId: string, query: string) => {
    try {
      // 키워드와 내용에서 검색
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('user_id', userId)
        .or(`content.ilike.%${query}%,keywords.cs.{${query}}`)
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      return (data || []).map(mapPost);
    } catch (error) {
      console.error('Search posts error:', error);
      return [];
    }
  },

  getPostsByDate: async (userId: string, year: number, month: number, day: number) => {
    try {
      const startDate = new Date(year, month - 1, day, 0, 0, 0);
      const endDate = new Date(year, month - 1, day, 23, 59, 59);

      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      return (data || []).map(mapPost);
    } catch (error) {
      console.error('Get posts by date error:', error);
      return [];
    }
  },

  fetchPopularTags: async () => {
    try {
      const { data, error } = await supabase.rpc('get_popular_tags', { tag_limit: 30 });
      if (error) throw error;
      set({ popularTags: (data || []).map((row: any) => row.tag) });
    } catch (error) {
      console.error('Fetch popular tags error:', error);
    }
  },

  setCurrentPost: (post: Post | null) => {
    set({ currentPost: post });
  },
}));
