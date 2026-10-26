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
      locations: {
        Row: {
          id: string
          name: string
          planetary_body: 'Earth' | 'Moon' | 'Mars'
          location_role: 'target' | 'candidate'
          latitude: number | null
          longitude: number | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          planetary_body: 'Earth' | 'Moon' | 'Mars'
          location_role: 'target' | 'candidate'
          latitude?: number | null
          longitude?: number | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          planetary_body?: 'Earth' | 'Moon' | 'Mars'
          location_role?: 'target' | 'candidate'
          latitude?: number | null
          longitude?: number | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      dataset_sources: {
        Row: {
          id: string
          title: string
          provider: string | null
          source_url: string | null
          dataset_version: string | null
          accessed_at: string | null
          processing_method: string | null
          limitations: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          provider?: string | null
          source_url?: string | null
          dataset_version?: string | null
          accessed_at?: string | null
          processing_method?: string | null
          limitations?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          provider?: string | null
          source_url?: string | null
          dataset_version?: string | null
          accessed_at?: string | null
          processing_method?: string | null
          limitations?: string | null
          created_at?: string
        }
        Relationships: []
      }
      environmental_features: {
        Row: {
          id: string
          location_id: string
          source_id: string | null
          feature_name: string
          value: number | null
          text_value: string | null
          unit: string | null
          measurement_period: string | null
          spatial_resolution: string | null
          quality_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          source_id?: string | null
          feature_name: string
          value?: number | null
          text_value?: string | null
          unit?: string | null
          measurement_period?: string | null
          spatial_resolution?: string | null
          quality_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          source_id?: string | null
          feature_name?: string
          value?: number | null
          text_value?: string | null
          unit?: string | null
          measurement_period?: string | null
          spatial_resolution?: string | null
          quality_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "environmental_features_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_features_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "dataset_sources"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
