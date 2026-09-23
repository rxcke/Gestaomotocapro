export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          expiration_date: string | null
          id: string
          motorcycle_id: string | null
          name: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          id?: string
          motorcycle_id?: string | null
          name: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          id?: string
          motorcycle_id?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          fuel_record_id: string | null
          group_name: string
          id: string
          maintenance_record_id: string | null
          motorcycle_id: string | null
          user_id: string
          work_session_id: string | null
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          fuel_record_id?: string | null
          group_name?: string
          id?: string
          maintenance_record_id?: string | null
          motorcycle_id?: string | null
          user_id: string
          work_session_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          fuel_record_id?: string | null
          group_name?: string
          id?: string
          maintenance_record_id?: string | null
          motorcycle_id?: string | null
          user_id?: string
          work_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_fuel_record_owner_fkey"
            columns: ["fuel_record_id", "user_id"]
            isOneToOne: false
            referencedRelation: "fuel_records"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "expenses_maintenance_record_owner_fkey"
            columns: ["maintenance_record_id", "user_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "expenses_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_session_fk"
            columns: ["work_session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_records: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          km: number | null
          liters: number | null
          motorcycle_id: string | null
          price_per_liter: number | null
          station: string | null
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          liters?: number | null
          motorcycle_id?: string | null
          price_per_liter?: number | null
          station?: string | null
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          liters?: number | null
          motorcycle_id?: string | null
          price_per_liter?: number | null
          station?: string | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_records_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          target_amount: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date?: string
          target_amount: number
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          target_amount?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          motorcycle_id: string | null
          time: string | null
          user_id: string
          work_session_id: string | null
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          motorcycle_id?: string | null
          time?: string | null
          user_id: string
          work_session_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          motorcycle_id?: string | null
          time?: string | null
          user_id?: string
          work_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incomes_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_session_fk"
            columns: ["work_session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          category: string
          cost: number
          created_at: string
          date: string
          description: string | null
          id: string
          km: number | null
          motorcycle_id: string | null
          next_date: string | null
          next_km: number | null
          user_id: string
          workshop: string | null
        }
        Insert: {
          category?: string
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          motorcycle_id?: string | null
          next_date?: string | null
          next_km?: number | null
          user_id: string
          workshop?: string | null
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          motorcycle_id?: string | null
          next_date?: string | null
          next_km?: number | null
          user_id?: string
          workshop?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          brand: string
          created_at: string
          current_km: number
          id: string
          is_active: boolean
          model: string
          photo_url: string | null
          plate: string | null
          purchase_date: string | null
          purchase_value: number | null
          user_id: string
          year: number | null
        }
        Insert: {
          brand: string
          created_at?: string
          current_km?: number
          id?: string
          is_active?: boolean
          model: string
          photo_url?: string | null
          plate?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          user_id: string
          year?: number | null
        }
        Update: {
          brand?: string
          created_at?: string
          current_km?: number
          id?: string
          is_active?: boolean
          model?: string
          photo_url?: string | null
          plate?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_professional: boolean
          name: string | null
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          usage_types: string[]
        }
        Insert: {
          auth_provider?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_professional?: boolean
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          usage_types?: string[]
        }
        Update: {
          auth_provider?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_professional?: boolean
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          usage_types?: string[]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cakto_offer_id: string | null
          cakto_product_id: string | null
          cakto_subscription_id: string | null
          cakto_transaction_id: string | null
          canceled_at: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          kiwify_product_id: string | null
          kiwify_subscription_id: string | null
          kiwify_transaction_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string
          provider_status: string
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cakto_offer_id?: string | null
          cakto_product_id?: string | null
          cakto_subscription_id?: string | null
          cakto_transaction_id?: string | null
          canceled_at?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          kiwify_product_id?: string | null
          kiwify_subscription_id?: string | null
          kiwify_transaction_id?: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider?: string
          provider_status?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cakto_offer_id?: string | null
          cakto_product_id?: string | null
          cakto_subscription_id?: string | null
          cakto_transaction_id?: string | null
          canceled_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          kiwify_product_id?: string | null
          kiwify_subscription_id?: string | null
          kiwify_transaction_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: string
          provider_status?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      work_sessions: {
        Row: {
          created_at: string
          end_km: number | null
          end_time: string | null
          id: string
          motorcycle_id: string | null
          net_profit: number
          start_km: number | null
          start_time: string
          total_expense: number
          total_income: number
          user_id: string
        }
        Insert: {
          created_at?: string
          end_km?: number | null
          end_time?: string | null
          id?: string
          motorcycle_id?: string | null
          net_profit?: number
          start_km?: number | null
          start_time?: string
          total_expense?: number
          total_income?: number
          user_id: string
        }
        Update: {
          created_at?: string
          end_km?: number | null
          end_time?: string | null
          id?: string
          motorcycle_id?: string | null
          net_profit?: number
          start_km?: number | null
          start_time?: string
          total_expense?: number
          total_income?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_sessions_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_cakto_subscription_event: {
        Args: {
          _buyer_email: string
          _canceled_at: string
          _event_id: string
          _event_type: string
          _expires_at: string
          _offer_id: string
          _payload: Json
          _plan: Database["public"]["Enums"]["subscription_plan"]
          _product_id: string
          _started_at: string
          _subscription_id: string
          _transaction_id: string
        }
        Returns: Json
      }
      process_kiwify_subscription_event: {
        Args: {
          _buyer_email: string
          _event_id: string
          _event_type: string
          _expires_at: string
          _payload: Json
          _plan: Database["public"]["Enums"]["subscription_plan"]
          _product_id: string
          _started_at: string
          _subscription_id: string
          _transaction_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_plan: "monthly" | "quarterly" | "annual"
      subscription_status:
        | "pending"
        | "active"
        | "canceled"
        | "expired"
        | "refunded"
        | "chargeback"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      subscription_plan: ["monthly", "quarterly", "annual"],
      subscription_status: [
        "pending",
        "active",
        "canceled",
        "expired",
        "refunded",
        "chargeback",
      ],
    },
  },
} as const
