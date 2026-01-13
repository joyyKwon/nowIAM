export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          device_id: string
          name: string | null
          birth: string | null
          sex: string | null
          about: string | null
          profile_image: string | null
          password: string | null
          password_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          device_id: string
          name?: string | null
          birth?: string | null
          sex?: string | null
          about?: string | null
          profile_image?: string | null
          password?: string | null
          password_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          name?: string | null
          birth?: string | null
          sex?: string | null
          about?: string | null
          profile_image?: string | null
          password?: string | null
          password_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          image_url: string
          media_type: 'image' | 'video'
          content: string | null
          keywords: string[] | null
          feeling: number | null
          location: string | null
          latitude: number | null
          longitude: number | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          media_type: 'image' | 'video'
          content?: string | null
          keywords?: string[] | null
          feeling?: number | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          media_type?: 'image' | 'video'
          content?: string | null
          keywords?: string[] | null
          feeling?: number | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
