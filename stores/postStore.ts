import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Post, CreatePostInput, UpdatePostInput } from '@/types/models';

interface PostState {
  posts: Post[];
  isLoading: boolean;
  currentPost: Post | null;

  // Actions
  fetchPosts: (userId: string, sortOrder?: 'asc' | 'desc') => Promise<void>;
  fetchPostById: (postId: string) => Promise<void>;
  createPost: (userId: string, input: CreatePostInput) => Promise<Post | null>;
  updatePost: (postId: string, input: UpdatePostInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  searchPosts: (userId: string, keyword: string) => Promise<Post[]>;
  getPostsByDate: (userId: string, year: number, month: number, day: number) => Promise<Post[]>;
  setCurrentPost: (post: Post | null) => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  currentPost: null,

  fetchPosts: async (userId: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    try {
      set({ isLoading: true });
      console.log('Fetching posts for user:', userId);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: sortOrder === 'asc' }) as any;

      console.log('Fetch posts result:', { data, error });

      if (error) throw error;

      const posts: Post[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        imageUrl: p.image_url,
        mediaType: p.media_type,
        content: p.content,
        keywords: p.keywords,
        feeling: p.feeling,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        isPublic: p.is_public,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

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
        .select('*')
        .eq('id', postId)
        .single() as any;

      if (error) throw error;

      if (data) {
        const post: Post = {
          id: data.id,
          userId: data.user_id,
          imageUrl: data.image_url,
          mediaType: data.media_type,
          content: data.content,
          keywords: data.keywords,
          feeling: data.feeling,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          isPublic: data.is_public,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        set({ currentPost: post });
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
          image_url: input.imageUrl,
          media_type: input.mediaType,
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

      if (data) {
        const newPost: Post = {
          id: data.id,
          userId: data.user_id,
          imageUrl: data.image_url,
          mediaType: data.media_type,
          content: data.content,
          keywords: data.keywords,
          feeling: data.feeling,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          isPublic: data.is_public,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        set(state => ({ posts: [newPost, ...state.posts] }));
        return newPost;
      }

      return null;
    } catch (error) {
      console.error('Create post error:', error);
      return null;
    }
  },

  updatePost: async (postId: string, input: UpdatePostInput) => {
    try {
      const dbInput: any = {};
      if (input.imageUrl !== undefined) dbInput.image_url = input.imageUrl;
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

      if (data) {
        const updatedPost: Post = {
          id: data.id,
          userId: data.user_id,
          imageUrl: data.image_url,
          mediaType: data.media_type,
          content: data.content,
          keywords: data.keywords,
          feeling: data.feeling,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          isPublic: data.is_public,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        set(state => ({
          posts: state.posts.map(p => p.id === postId ? updatedPost : p),
          currentPost: state.currentPost?.id === postId ? updatedPost : state.currentPost,
        }));
      }
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

  searchPosts: async (userId: string, keyword: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .contains('keywords', [keyword])
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        imageUrl: p.image_url,
        mediaType: p.media_type,
        content: p.content,
        keywords: p.keywords,
        feeling: p.feeling,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        isPublic: p.is_public,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
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
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        imageUrl: p.image_url,
        mediaType: p.media_type,
        content: p.content,
        keywords: p.keywords,
        feeling: p.feeling,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        isPublic: p.is_public,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
    } catch (error) {
      console.error('Get posts by date error:', error);
      return [];
    }
  },

  setCurrentPost: (post: Post | null) => {
    set({ currentPost: post });
  },
}));
