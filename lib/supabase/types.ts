export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      site_settings: {
        Row: { key: string; value: Json; is_public: boolean; updated_at: string };
        Insert: { key: string; value: Json; is_public?: boolean; updated_at?: string };
        Update: { key?: string; value?: Json; is_public?: boolean; updated_at?: string };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string; name: string; slug: string; description: string; display_order: number;
          is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name: string; slug: string; description?: string; display_order?: number;
          is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          name?: string; slug?: string; description?: string; display_order?: number;
          is_active?: boolean; updated_at?: string;
        };
        Relationships: [];
      };
      leaders: {
        Row: {
          id: string; name: string; slug: string; biography: string; image_url: string | null;
          role_id: string | null; display_order: number; is_active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name: string; slug: string; biography?: string; image_url?: string | null;
          role_id?: string | null; display_order?: number; is_active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: {
          name?: string; slug?: string; biography?: string; image_url?: string | null;
          role_id?: string | null; display_order?: number; is_active?: boolean; updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leaders_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          }
        ];
      };
      news: {
        Row: {
          id: string; title: string; slug: string; excerpt: string; content: string;
          is_published: boolean; published_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; title: string; slug: string; excerpt?: string; content?: string;
          is_published?: boolean; published_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          title?: string; slug?: string; excerpt?: string; content?: string;
          is_published?: boolean; published_at?: string | null; updated_at?: string;
        };
        Relationships: [];
      };
      constitution_articles: {
        Row: {
          id: string; article_number: number; title: string; content: string; display_order: number;
          is_published: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; article_number: number; title: string; content: string; display_order?: number;
          is_published?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          article_number?: number; title?: string; content?: string; display_order?: number;
          is_published?: boolean; updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Role = Database["public"]["Tables"]["roles"]["Row"];
export type Leader = Database["public"]["Tables"]["leaders"]["Row"];
export type NewsItem = Database["public"]["Tables"]["news"]["Row"];
export type ConstitutionArticle = Database["public"]["Tables"]["constitution_articles"]["Row"];
