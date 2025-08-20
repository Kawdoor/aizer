import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          accent_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          accent_color?: string | null;
        };
        Update: {
          display_name?: string | null;
          accent_color?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          owner_id: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          is_admin?: boolean;
        };
        Update: {
          is_admin?: boolean;
        };
      };
      spaces: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          description: string | null;
          photo_url: string | null;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          name: string;
          description?: string | null;
          photo_url?: string | null;
          parent_id?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          photo_url?: string | null;
          parent_id?: string | null;
        };
      };
      inventories: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          description: string | null;
          parent_space_id: string | null;
          parent_inventory_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          name: string;
          description?: string | null;
          parent_space_id?: string | null;
          parent_inventory_id?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          parent_space_id?: string | null;
          parent_inventory_id?: string | null;
        };
      };
      items: {
        Row: {
          id: string;
          group_id: string;
          inventory_id: string;
          name: string;
          quantity: number;
          description: string | null;
          photo_url: string | null;
          color: string | null;
          price: number | null;
          measures: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          inventory_id: string;
          name: string;
          quantity?: number;
          description?: string | null;
          photo_url?: string | null;
          color?: string | null;
          price?: number | null;
          measures?: any | null;
        };
        Update: {
          name?: string;
          quantity?: number;
          description?: string | null;
          photo_url?: string | null;
          color?: string | null;
          price?: number | null;
          measures?: any | null;
        };
      };
    };
  };
};