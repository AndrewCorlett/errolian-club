/**
 * Supabase Database Types
 * Auto-generated types for the Errolian Club database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types
export type UserRole = 'super-admin' | 'commodore' | 'officer' | 'member'
export type EventType = 'adventure' | 'meeting' | 'social' | 'training' | 'other'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type ItineraryType = 'travel' | 'accommodation' | 'activity' | 'meal' | 'other'
export type ExpenseCategory = 'accommodation' | 'food' | 'transport' | 'activities' | 'equipment' | 'other'
export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'settled'
export type DocumentType = 'pdf' | 'image' | 'video' | 'audio' | 'doc' | 'spreadsheet' | 'other'
export type DocumentStatus = 'pending' | 'approved' | 'rejected'
export type AvailabilityType = 'available' | 'busy' | 'tentative'

// Database interfaces
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: UserRole
          member_since: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          role?: UserRole
          member_since?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: UserRole
          member_since?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_availability: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string
          availability_type: AvailabilityType
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          end_date: string
          availability_type?: AvailabilityType
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_date?: string
          end_date?: string
          availability_type?: AvailabilityType
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          type: EventType
          status: EventStatus
          start_date: string
          end_date: string
          location: string | null
          max_participants: number | null
          created_by: string
          estimated_cost: number | null
          is_public: boolean
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: EventType
          status?: EventStatus
          start_date: string
          end_date: string
          location?: string | null
          max_participants?: number | null
          created_by: string
          estimated_cost?: number | null
          is_public?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: EventType
          status?: EventStatus
          start_date?: string
          end_date?: string
          location?: string | null
          max_participants?: number | null
          created_by?: string
          estimated_cost?: number | null
          is_public?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_participants: {
        Row: {
          event_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      itinerary_items: {
        Row: {
          id: string
          event_id: string
          type: ItineraryType
          title: string
          description: string | null
          start_time: string | null
          end_time: string | null
          location: string | null
          cost: number
          notes: string | null
          order_index: number
          type_specific_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          type: ItineraryType
          title: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          cost?: number
          notes?: string | null
          order_index?: number
          type_specific_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          type?: ItineraryType
          title?: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          cost?: number
          notes?: string | null
          order_index?: number
          type_specific_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          title: string
          description: string | null
          amount: number
          currency: string
          category: ExpenseCategory
          status: ExpenseStatus
          event_id: string | null
          paid_by: string
          receipt_url: string | null
          created_at: string
          updated_at: string
          settled_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          amount: number
          currency?: string
          category: ExpenseCategory
          status?: ExpenseStatus
          event_id?: string | null
          paid_by: string
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          settled_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          amount?: number
          currency?: string
          category?: ExpenseCategory
          status?: ExpenseStatus
          event_id?: string | null
          paid_by?: string
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          settled_at?: string | null
        }
      }
      expense_participants: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          share_amount: number
          is_paid: boolean
          paid_at: string | null
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          share_amount: number
          is_paid?: boolean
          paid_at?: string | null
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          share_amount?: number
          is_paid?: boolean
          paid_at?: string | null
        }
      }
      settlements: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          amount: number
          expense_ids: string[]
          is_settled: boolean
          created_at: string
          settled_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          amount: number
          expense_ids: string[]
          is_settled?: boolean
          created_at?: string
          settled_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          expense_ids?: string[]
          is_settled?: boolean
          created_at?: string
          settled_at?: string | null
        }
      }
      document_folders: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          created_by: string
          is_public: boolean
          color: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          created_by: string
          is_public?: boolean
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          created_by?: string
          is_public?: boolean
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          type: DocumentType
          size_bytes: number
          mime_type: string
          storage_path: string
          thumbnail_path: string | null
          folder_id: string | null
          uploaded_by: string
          status: DocumentStatus
          approved_by: string | null
          approved_at: string | null
          rejected_reason: string | null
          description: string | null
          tags: string[]
          is_public: boolean
          download_count: number
          version: number
          parent_document_id: string | null
          is_locked: boolean
          locked_by: string | null
          locked_at: string | null
          requires_signatures: boolean
          signatures: Json[]
          signature_deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: DocumentType
          size_bytes: number
          mime_type: string
          storage_path: string
          thumbnail_path?: string | null
          folder_id?: string | null
          uploaded_by: string
          status?: DocumentStatus
          approved_by?: string | null
          approved_at?: string | null
          rejected_reason?: string | null
          description?: string | null
          tags?: string[]
          is_public?: boolean
          download_count?: number
          version?: number
          parent_document_id?: string | null
          is_locked?: boolean
          locked_by?: string | null
          locked_at?: string | null
          requires_signatures?: boolean
          signatures?: Json[]
          signature_deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: DocumentType
          size_bytes?: number
          mime_type?: string
          storage_path?: string
          thumbnail_path?: string | null
          folder_id?: string | null
          uploaded_by?: string
          status?: DocumentStatus
          approved_by?: string | null
          approved_at?: string | null
          rejected_reason?: string | null
          description?: string | null
          tags?: string[]
          is_public?: boolean
          download_count?: number
          version?: number
          parent_document_id?: string | null
          is_locked?: boolean
          locked_by?: string | null
          locked_at?: string | null
          requires_signatures?: boolean
          signatures?: Json[]
          signature_deadline?: string | null
          created_at?: string
          updated_at?: string
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
      user_role_enum: UserRole
      availability_type_enum: AvailabilityType
      event_type_enum: EventType
      event_status_enum: EventStatus
      itinerary_type_enum: ItineraryType
      expense_category_enum: ExpenseCategory
      expense_status_enum: ExpenseStatus
      document_type_enum: DocumentType
      document_status_enum: DocumentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type exports
export type UserProfile = Tables<'user_profiles'>
export type UserAvailability = Tables<'user_availability'>
export type Event = Tables<'events'>
export type EventParticipant = Tables<'event_participants'>
export type ItineraryItem = Tables<'itinerary_items'>
export type Expense = Tables<'expenses'>
export type ExpenseParticipant = Tables<'expense_participants'>
export type Settlement = Tables<'settlements'>
export type DocumentFolder = Tables<'document_folders'>
export type Document = Tables<'documents'>

// Insert types
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type UserAvailabilityInsert = TablesInsert<'user_availability'>
export type EventInsert = TablesInsert<'events'>
export type EventParticipantInsert = TablesInsert<'event_participants'>
export type ItineraryItemInsert = TablesInsert<'itinerary_items'>
export type ExpenseInsert = TablesInsert<'expenses'>
export type ExpenseParticipantInsert = TablesInsert<'expense_participants'>
export type SettlementInsert = TablesInsert<'settlements'>
export type DocumentFolderInsert = TablesInsert<'document_folders'>
export type DocumentInsert = TablesInsert<'documents'>

// Update types
export type UserProfileUpdate = TablesUpdate<'user_profiles'>
export type UserAvailabilityUpdate = TablesUpdate<'user_availability'>
export type EventUpdate = TablesUpdate<'events'>
export type EventParticipantUpdate = TablesUpdate<'event_participants'>
export type ItineraryItemUpdate = TablesUpdate<'itinerary_items'>
export type ExpenseUpdate = TablesUpdate<'expenses'>
export type ExpenseParticipantUpdate = TablesUpdate<'expense_participants'>
export type SettlementUpdate = TablesUpdate<'settlements'>
export type DocumentFolderUpdate = TablesUpdate<'document_folders'>
export type DocumentUpdate = TablesUpdate<'documents'>

// Extended types with relationships
export interface EventWithDetails extends Event {
  participants?: UserProfile[]
  itinerary_items?: ItineraryItem[]
  creator?: UserProfile
  expenses?: Expense[]
}

export interface ExpenseWithDetails extends Expense {
  participants: (ExpenseParticipant & { user: UserProfile })[]
  paid_by_user?: UserProfile
  event?: Event
}

export interface UserWithRole extends UserProfile {
  permissions?: {
    canCreateEvents: boolean
    canEditAllEvents: boolean
    canDeleteAllEvents: boolean
    canApproveEvents: boolean
    canCreateExpenses: boolean
    canEditAllExpenses: boolean
    canDeleteAllExpenses: boolean
    canSettleExpenses: boolean
    canUploadDocuments: boolean
    canApproveDocuments: boolean
    canDeleteAllDocuments: boolean
    canManageFolders: boolean
    canInviteUsers: boolean
    canManageUserRoles: boolean
    canDeactivateUsers: boolean
    canModifySettings: boolean
    canViewAnalytics: boolean
    canExportData: boolean
  }
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Real-time payload types
export interface RealtimePayload<T> {
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: T
  old?: T
  schema: string
  table: string
}

// Database row type aliases (for compatibility with frontend interfaces)
export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type DocumentFolderRow = Database['public']['Tables']['document_folders']['Row']