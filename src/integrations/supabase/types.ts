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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          class_id: string | null
          created_at: string | null
          department_id: string | null
          id: string
          is_deleted: boolean | null
          is_urgent: boolean | null
          teacher_id: string | null
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibilite"] | null
        }
        Insert: {
          body: string
          class_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_urgent?: boolean | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibilite"] | null
        }
        Update: {
          body?: string
          class_id?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_urgent?: boolean | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibilite"] | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          feedback: string | null
          file_urls: string[] | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          status: Database["public"]["Enums"]["submit_status"] | null
          student_id: string | null
          submitted_at: string | null
          text_answer: string | null
        }
        Insert: {
          assignment_id?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["submit_status"] | null
          student_id?: string | null
          submitted_at?: string | null
          text_answer?: string | null
        }
        Update: {
          assignment_id?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["submit_status"] | null
          student_id?: string | null
          submitted_at?: string | null
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string
          due_at: string | null
          id: string
          is_deleted: boolean | null
          is_published: boolean | null
          teacher_id: string | null
          title: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description: string
          due_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_published?: boolean | null
          teacher_id?: string | null
          title: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string
          due_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_published?: boolean | null
          teacher_id?: string | null
          title?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit: {
        Row: {
          action: string | null
          changed_at: string | null
          changed_by: string | null
          id: number
          new_values: Json | null
          old_values: Json | null
          row_id: string
          table_name: string
        }
        Insert: {
          action?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      campuses: {
        Row: {
          id: string
          is_active: boolean | null
          name: string
          timezone: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name: string
          timezone?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name?: string
          timezone?: string | null
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          id: string
          last_read: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          last_read?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          last_read?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          class_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_archived: boolean | null
          name: string | null
          type: Database["public"]["Enums"]["room_type"]
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string | null
          type: Database["public"]["Enums"]["room_type"]
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string | null
          type?: Database["public"]["Enums"]["room_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string | null
          enrolled_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          class_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          class_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          code: string
          created_at: string | null
          credits: number | null
          department_id: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          max_students: number | null
          name: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          max_students?: number | null
          name: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          max_students?: number | null
          name?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          campus_id: string | null
          code: string
          id: string
          name: string
        }
        Insert: {
          campus_id?: string | null
          code: string
          id?: string
          name: string
        }
        Update: {
          campus_id?: string | null
          code?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          class_id: string | null
          file_size: number | null
          file_url: string
          id: string
          is_hidden: boolean | null
          mime_type: string | null
          name: string
          uploaded_at: string | null
          uploader_id: string | null
        }
        Insert: {
          class_id?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_hidden?: boolean | null
          mime_type?: string | null
          name: string
          uploaded_at?: string | null
          uploader_id?: string | null
        }
        Update: {
          class_id?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_hidden?: boolean | null
          mime_type?: string | null
          name?: string
          uploaded_at?: string | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          file_url: string | null
          id: string
          is_deleted: boolean | null
          msg_type: Database["public"]["Enums"]["msg_type"] | null
          room_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          msg_type?: Database["public"]["Enums"]["msg_type"] | null
          room_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          msg_type?: Database["public"]["Enums"]["msg_type"] | null
          room_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          class_id: string | null
          content: string
          created_at: string | null
          id: string
          image_urls: string[] | null
          is_deleted: boolean | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          class_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_deleted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          class_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_deleted?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          enrollment_year: number | null
          full_name: string | null
          id: string
          level: string | null
          major: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          enrollment_year?: number | null
          full_name?: string | null
          id: string
          level?: string | null
          major?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          enrollment_year?: number | null
          full_name?: string | null
          id?: string
          level?: string | null
          major?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id: string
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sync_audit: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: string
          message: string | null
          operation: string | null
          payload: Json | null
          status: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          operation?: string | null
          payload?: Json | null
          status?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          operation?: string | null
          payload?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      test_user_registration: {
        Args: {
          test_email: string
          test_full_name?: string
          test_role?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      msg_type: "text" | "file" | "image" | "system"
      room_type: "direct" | "class" | "group"
      submit_status: "draft" | "submitted" | "graded" | "returned"
      user_role: "student" | "teacher"
      visibilite: "public" | "department" | "class" | "private"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["student", "teacher", "admin"],
      msg_type: ["text", "file", "image", "system"],
      room_type: ["direct", "class", "group"],
      submit_status: ["draft", "submitted", "graded", "returned"],
      user_role: ["student", "teacher"],
      visibilite: ["public", "department", "class", "private"],
    },
  },
} as const
