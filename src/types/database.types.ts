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
      research_records: {
        Row: {
          id: string
          user_id: string
          record_id: string
          context_key: string
          candidate_id: string
          candidate_name: string
          target_id: string
          mission_profile_id: string
          active_revision_number: number
          active_snapshot_id: string
          active_snapshot: Json
          storage_mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          record_id: string
          context_key: string
          candidate_id: string
          candidate_name: string
          target_id: string
          mission_profile_id: string
          active_revision_number?: number
          active_snapshot_id: string
          active_snapshot: Json
          storage_mode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          record_id?: string
          context_key?: string
          candidate_id?: string
          candidate_name?: string
          target_id?: string
          mission_profile_id?: string
          active_revision_number?: number
          active_snapshot_id?: string
          active_snapshot?: Json
          storage_mode?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      research_assessment_revisions: {
        Row: {
          id: string
          user_id: string
          research_record_uuid: string
          record_id: string
          context_key: string
          revision_number: number
          label: string
          snapshot_id: string
          schema_version: string
          content_digest: string
          snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          research_record_uuid: string
          record_id: string
          context_key: string
          revision_number: number
          label: string
          snapshot_id: string
          schema_version?: string
          content_digest: string
          snapshot: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          research_record_uuid?: string
          record_id?: string
          context_key?: string
          revision_number?: number
          label?: string
          snapshot_id?: string
          schema_version?: string
          content_digest?: string
          snapshot?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_assessment_revisions_research_record_uuid_fkey"
            columns: ["research_record_uuid"]
            isOneToOne: false
            referencedRelation: "research_records"
            referencedColumns: ["id"]
          }
        ]
      }
      research_tasks: {
        Row: {
          id: string
          user_id: string
          research_record_uuid: string
          record_id: string
          task_id: string
          candidate_id: string
          title: string
          scientific_rationale: string
          related_gap: string
          driver_feature: string | null
          suggested_observation_method: string
          priority: 'critical' | 'high' | 'moderate'
          status:
            | 'identified'
            | 'evidence-review'
            | 'follow-up-planned'
            | 'observation-pending'
            | 'evidence-reviewed'
            | 'closed'
          observation_status: 'recommended-not-completed'
          owner: string | null
          notes: string | null
          source_reference: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          research_record_uuid: string
          record_id: string
          task_id: string
          candidate_id: string
          title: string
          scientific_rationale: string
          related_gap: string
          driver_feature?: string | null
          suggested_observation_method: string
          priority: 'critical' | 'high' | 'moderate'
          status?:
            | 'identified'
            | 'evidence-review'
            | 'follow-up-planned'
            | 'observation-pending'
            | 'evidence-reviewed'
            | 'closed'
          observation_status?: 'recommended-not-completed'
          owner?: string | null
          notes?: string | null
          source_reference?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          research_record_uuid?: string
          record_id?: string
          task_id?: string
          candidate_id?: string
          title?: string
          scientific_rationale?: string
          related_gap?: string
          driver_feature?: string | null
          suggested_observation_method?: string
          priority?: 'critical' | 'high' | 'moderate'
          status?:
            | 'identified'
            | 'evidence-review'
            | 'follow-up-planned'
            | 'observation-pending'
            | 'evidence-reviewed'
            | 'closed'
          observation_status?: 'recommended-not-completed'
          owner?: string | null
          notes?: string | null
          source_reference?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_tasks_research_record_uuid_fkey"
            columns: ["research_record_uuid"]
            isOneToOne: false
            referencedRelation: "research_records"
            referencedColumns: ["id"]
          }
        ]
      }
      research_notes: {
        Row: {
          id: string
          user_id: string
          research_record_uuid: string
          record_id: string
          note_id: string
          candidate_id: string
          title: string
          body: string
          author_role: 'user-authored-research-note'
          related_feature: string
          user_supplied_source_url: string | null
          linked_task_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          research_record_uuid: string
          record_id: string
          note_id: string
          candidate_id: string
          title: string
          body: string
          author_role?: 'user-authored-research-note'
          related_feature?: string
          user_supplied_source_url?: string | null
          linked_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          research_record_uuid?: string
          record_id?: string
          note_id?: string
          candidate_id?: string
          title?: string
          body?: string
          author_role?: 'user-authored-research-note'
          related_feature?: string
          user_supplied_source_url?: string | null
          linked_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_notes_research_record_uuid_fkey"
            columns: ["research_record_uuid"]
            isOneToOne: false
            referencedRelation: "research_records"
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
