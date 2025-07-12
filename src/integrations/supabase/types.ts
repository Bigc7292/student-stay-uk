export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      guides: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          guide_type: string
          helpful_votes: number | null
          id: string
          published_date: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          guide_type: string
          helpful_votes?: number | null
          id?: string
          published_date?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          guide_type?: string
          helpful_votes?: number | null
          id?: string
          published_date?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          postcode: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          postcode?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          postcode?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          available: boolean | null
          available_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          crime_rating: string | null
          crimes_per_thousand: number | null
          description: string | null
          full_address: string | null
          furnished: boolean | null
          id: string
          landlord_contact: string | null
          landlord_name: string | null
          landlord_verified: boolean | null
          location: string
          nearby_amenities: string | null
          postcode: string | null
          price: number
          price_type: string | null
          property_size: string | null
          property_type: string | null
          rightmove_id: string | null
          safety_score: number | null
          scraped_at: string | null
          source: string
          source_url: string | null
          title: string
          transport_links: string | null
          university_distance_miles: number | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          crime_rating?: string | null
          crimes_per_thousand?: number | null
          description?: string | null
          full_address?: string | null
          furnished?: boolean | null
          id?: string
          landlord_contact?: string | null
          landlord_name?: string | null
          landlord_verified?: boolean | null
          location: string
          nearby_amenities?: string | null
          postcode?: string | null
          price: number
          price_type?: string | null
          property_size?: string | null
          property_type?: string | null
          rightmove_id?: string | null
          safety_score?: number | null
          scraped_at?: string | null
          source: string
          source_url?: string | null
          title: string
          transport_links?: string | null
          university_distance_miles?: number | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          crime_rating?: string | null
          crimes_per_thousand?: number | null
          description?: string | null
          full_address?: string | null
          furnished?: boolean | null
          id?: string
          landlord_contact?: string | null
          landlord_name?: string | null
          landlord_verified?: boolean | null
          location?: string
          nearby_amenities?: string | null
          postcode?: string | null
          price?: number
          price_type?: string | null
          property_size?: string | null
          property_type?: string | null
          rightmove_id?: string | null
          safety_score?: number | null
          scraped_at?: string | null
          source?: string
          source_url?: string | null
          title?: string
          transport_links?: string | null
          university_distance_miles?: number | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_features: {
        Row: {
          created_at: string | null
          feature_name: string
          feature_value: string | null
          id: string
          property_id: string
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          feature_value?: string | null
          id?: string
          property_id: string
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          feature_value?: string | null
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_features_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          property_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          property_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_data: {
        Row: {
          created_at: string | null
          id: string
          processed: boolean | null
          raw_data: Json
          scraped_at: string | null
          source: string
          source_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          raw_data: Json
          scraped_at?: string | null
          source: string
          source_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          raw_data?: Json
          scraped_at?: string | null
          source?: string
          source_url?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          accommodation_info: string | null
          created_at: string | null
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          postcode: string | null
          rightmove_url: string | null
          student_population: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accommodation_info?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          postcode?: string | null
          rightmove_url?: string | null
          student_population?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accommodation_info?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          postcode?: string | null
          rightmove_url?: string | null
          student_population?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
