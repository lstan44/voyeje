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
      incidents: {
        Row: {
          id: string
          type: string
          description: string | null
          location: { type: "Point"; coordinates: [number, number] }
          location_zone: string
          timestamp: string
          severity: string
          verified: boolean
          still_here_count: number
          no_longer_here_count: number
          reporter_id: string
          anonymous: boolean
          created_at: string
          slug: string
        }
        Insert: {
          id?: string
          type: string
          description?: string | null
          location: { type: "Point"; coordinates: [number, number] }
          location_zone: string
          timestamp: string
          severity: string
          verified?: boolean
          still_here_count?: number
          no_longer_here_count?: number
          reporter_id: string
          anonymous: boolean
          created_at?: string
          slug?: string
        }
        Update: {
          id?: string
          type?: string
          description?: string | null
          location?: { type: "Point"; coordinates: [number, number] }
          location_zone?: string
          timestamp?: string
          severity?: string
          verified?: boolean
          still_here_count?: number
          no_longer_here_count?: number
          reporter_id?: string
          anonymous?: boolean
          created_at?: string
          slug?: string
        }
      }
      incident_media: {
        Row: {
          id: string
          incident_id: string
          type: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          incident_id: string
          type: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          incident_id?: string
          type?: string
          url?: string
          created_at?: string
        }
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
  }
}