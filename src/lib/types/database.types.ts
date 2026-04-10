export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          started_at: string | null
          ended_at: string | null
          status: "active" | "archived"
          hourly_rate: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          started_at?: string | null
          ended_at?: string | null
          status?: "active" | "archived"
          hourly_rate?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          started_at?: string | null
          ended_at?: string | null
          status?: "active" | "archived"
          hourly_rate?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          role: "admin" | "client"
          client_id: string | null
          created_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          role?: "admin" | "client"
          client_id?: string | null
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: "admin" | "client"
          client_id?: string | null
          created_at?: string
          last_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          client_id: string
          name: string
          quoted_cost: number | null
          projected_hours: number | null
          projected_rate: number | null
          status: "active" | "archived"
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          quoted_cost?: number | null
          projected_hours?: number | null
          projected_rate?: number | null
          status?: "active" | "archived"
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          quoted_cost?: number | null
          projected_hours?: number | null
          projected_rate?: number | null
          status?: "active" | "archived"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      time_entries: {
        Row: {
          id: string
          client_id: string
          project_id: string | null
          date: string
          description: string
          hours: number
          billable: boolean
          category:
            | "Project Work"
            | "Hourly Work"
            | "Admin"
            | "Account Management"
            | "Prospecting"
            | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          project_id?: string | null
          date: string
          description: string
          hours: number
          billable?: boolean
          category?:
            | "Project Work"
            | "Hourly Work"
            | "Admin"
            | "Account Management"
            | "Prospecting"
            | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          project_id?: string | null
          date?: string
          description?: string
          hours?: number
          billable?: boolean
          category?:
            | "Project Work"
            | "Hourly Work"
            | "Admin"
            | "Account Management"
            | "Prospecting"
            | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      billing_records: {
        Row: {
          id: string
          client_id: string
          month: string
          invoice_number: string | null
          so_number: string | null
          invoiced: boolean
          paid: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          month: string
          invoice_number?: string | null
          so_number?: string | null
          invoiced?: boolean
          paid?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          month?: string
          invoice_number?: string | null
          so_number?: string | null
          invoiced?: boolean
          paid?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      rate_history: {
        Row: {
          id: string
          client_id: string
          rate: number
          effective_from: string
          effective_to: string | null
        }
        Insert: {
          id?: string
          client_id: string
          rate: number
          effective_from: string
          effective_to?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          rate?: number
          effective_from?: string
          effective_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      client_ytd_summary: {
        Row: {
          id: string
          name: string
          status: "active" | "archived"
          started_at: string | null
          ended_at: string | null
          hourly_rate: number
          project_count: number
          ytd_hours: number
          ytd_revenue: number
        }
        Relationships: []
      }
      project_actuals: {
        Row: {
          id: string
          client_id: string
          client_name: string
          name: string
          quoted_cost: number | null
          projected_hours: number | null
          projected_rate: number | null
          status: "active" | "archived"
          created_at: string
          actual_hours: number
          actual_rate: number
        }
        Relationships: []
      }
    }
    Functions: {
      update_client_rate: {
        Args: {
          p_client_id: string
          p_new_rate: number
          p_effective_from?: string
        }
        Returns: undefined
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Client = Database["public"]["Tables"]["clients"]["Row"]
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"]
export type UserProfile = Database["public"]["Tables"]["users"]["Row"]
export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"]
export type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"]
export type BillingRecord = Database["public"]["Tables"]["billing_records"]["Row"]
export type RateHistory = Database["public"]["Tables"]["rate_history"]["Row"]
export type ClientYtdSummary = Database["public"]["Views"]["client_ytd_summary"]["Row"]
export type ProjectActuals = Database["public"]["Views"]["project_actuals"]["Row"]

export type TimeEntryCategory =
  | "Project Work"
  | "Hourly Work"
  | "Admin"
  | "Account Management"
  | "Prospecting"

export const TIME_ENTRY_CATEGORIES: TimeEntryCategory[] = [
  "Project Work",
  "Hourly Work",
  "Admin",
  "Account Management",
  "Prospecting",
]
