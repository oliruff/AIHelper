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
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          settings: Json
          created_at: string
          updated_at: string
          is_public: boolean
          deployment_data: Json
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          settings?: Json
          created_at?: string
          updated_at?: string
          is_public?: boolean
          deployment_data?: Json
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
          is_public?: boolean
          deployment_data?: Json
        }
      }
      code_generations: {
        Row: {
          id: string
          project_id: string | null
          user_id: string | null
          prompt: string
          model: string
          response: Json
          performance_metrics: Json
          created_at: string
          context: Json
          attribution: string[]
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          prompt: string
          model: string
          response: Json
          performance_metrics?: Json
          created_at?: string
          context?: Json
          attribution?: string[]
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          prompt?: string
          model?: string
          response?: Json
          performance_metrics?: Json
          created_at?: string
          context?: Json
          attribution?: string[]
        }
      }
      technical_docs: {
        Row: {
          id: string
          title: string
          content: string
          embedding: number[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          embedding: number[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          embedding?: number[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      collaboration_sessions: {
        Row: {
          id: string
          project_id: string | null
          started_at: string
          ended_at: string | null
          participants: Json
          session_data: Json
        }
        Insert: {
          id?: string
          project_id?: string | null
          started_at?: string
          ended_at?: string | null
          participants?: Json
          session_data?: Json
        }
        Update: {
          id?: string
          project_id?: string | null
          started_at?: string
          ended_at?: string | null
          participants?: Json
          session_data?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_technical_docs: {
        Args: {
          query_embedding: number[]
          similarity_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}