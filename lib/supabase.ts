import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/* ─── DB Types ─── */
export interface DBAccount {
  id: string;
  name: string;
  platform: "instagram" | "twitter" | "tiktok" | "facebook";
  username: string;
  persona: string;
  tone: string;
  target_audience: string;
  posting_frequency: string;
  avatar_url: string | null;
  buffer_profile_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBPost {
  id: string;
  account_id: string;
  caption: string;
  image_url: string | null;
  image_prompt: string | null;
  theme: string | null;
  hashtags: string[];
  status: "draft" | "scheduled" | "posted" | "failed";
  scheduled_at: string | null;
  posted_at: string | null;
  buffer_post_id: string | null;
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  created_at: string;
  updated_at: string;
}

export interface DBTemplate {
  id: string;
  account_id: string | null;
  name: string;
  caption_template: string;
  image_style: string | null;
  hashtags: string[];
  is_global: boolean;
  created_at: string;
}

export interface DBAppSetting {
  id: string;
  key: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}
