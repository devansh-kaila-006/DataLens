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
      analysis_jobs: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          file_name: string
          file_size: number
          row_count: number | null
          column_count: number | null
          upload_timestamp: string
          processing_started_at: string | null
          processing_completed_at: string | null
          error_message: string | null
        }
        Insert: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          file_name: string
          file_size: number
          row_count?: number | null
          column_count?: number | null
          upload_timestamp?: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          file_name?: string
          file_size?: number
          row_count?: number | null
          column_count?: number | null
          upload_timestamp?: string
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
        }
      }
      analysis_results: {
        Row: {
          id: string
          job_id: string
          result_type: 'quality' | 'univariate' | 'correlation' | 'target' | 'ml_readiness'
          result_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          result_type: 'quality' | 'univariate' | 'correlation' | 'target' | 'ml_readiness'
          result_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          result_type?: 'quality' | 'univariate' | 'correlation' | 'target' | 'ml_readiness'
          result_data?: Json
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          job_id: string
          format: 'pdf' | 'html' | 'json'
          file_path: string
          status: 'generating' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          format: 'pdf' | 'html' | 'json'
          file_path: string
          status: 'generating' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          format?: 'pdf' | 'html' | 'json'
          file_path?: string
          status?: 'generating' | 'completed' | 'failed'
          created_at?: string
        }
      }
    }
  }
}

export type AnalysisJob = Database['public']['Tables']['analysis_jobs']['Row']
export type AnalysisResult = Database['public']['Tables']['analysis_results']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
