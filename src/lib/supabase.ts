import { createClient } from "@supabase/supabase-js";

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Developer guard: if the project wasn't configured with real env vars,
// network requests will fail with "TypeError: Failed to fetch" in the browser.
// Log a clear message so it's easy to spot in logs/console.
if (
  supabaseUrl.includes("placeholder.supabase") ||
  supabaseUrl.includes("placeholder.supabase.co") ||
  supabaseAnonKey === "placeholder-key"
) {
  // eslint-disable-next-line no-console
  console.error(
    "Supabase client appears to be using placeholder environment variables.\n" +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (or Vercel project settings).\n" +
      `Current VITE_SUPABASE_URL=${supabaseUrl} VITE_SUPABASE_ANON_KEY=${supabaseAnonKey.slice(0,6)}...`
  );
}

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
