import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getGeminiApiKey } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron自動投稿の診断エンドポイント（認証不要・投稿はしない）
 * 各ステップの状態を確認してボトルネックを特定
 */
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // 1. auto_post_enabled チェック
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "auto_post_enabled")
      .single();
    diagnostics.auto_post_enabled = {
      raw_value: data?.value,
      type: typeof data?.value,
      is_enabled:
        data?.value === true ||
        data?.value === "true",
      error: error?.message || null,
    };
  } catch (e: any) {
    diagnostics.auto_post_enabled = { error: e.message };
  }

  // 2. auto_post_use_trends チェック
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "auto_post_use_trends")
      .single();
    diagnostics.auto_post_use_trends = {
      raw_value: data?.value,
      is_enabled:
        data?.value === true ||
        data?.value === "true",
    };
  } catch {
    diagnostics.auto_post_use_trends = { error: "not set" };
  }

  // 3. auto_post_themes チェック
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "auto_post_themes")
      .single();
    let themes: string[] = [];
    if (data?.value) {
      try {
        themes =
          typeof data.value === "string"
            ? JSON.parse(data.value)
            : data.value;
      } catch {}
    }
    diagnostics.auto_post_themes = {
      raw_value: data?.value,
      parsed_count: themes.length,
      themes,
    };
  } catch {
    diagnostics.auto_post_themes = { error: "not set", parsed_count: 0 };
  }

  // 4. Gemini APIキー
  try {
    const key = await getGeminiApiKey();
    diagnostics.gemini_api_key = {
      configured: !!key,
      prefix: key ? key.slice(0, 8) + "..." : null,
    };
  } catch (e: any) {
    diagnostics.gemini_api_key = { configured: false, error: e.message };
  }

  // 5. アクティブアカウント
  try {
    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("id, name, platform, buffer_profile_id, is_active")
      .eq("is_active", true);
    diagnostics.active_accounts = {
      count: accounts?.length || 0,
      accounts: (accounts || []).map((a) => ({
        name: a.name,
        platform: a.platform,
        buffer_profile_id: a.buffer_profile_id || "❌ 未設定",
        has_buffer_id: !!a.buffer_profile_id,
      })),
      error: error?.message || null,
    };
  } catch (e: any) {
    diagnostics.active_accounts = { error: e.message };
  }

  // 6. CRON_SECRET チェック
  diagnostics.cron_secret = {
    configured: !!process.env.CRON_SECRET,
    length: process.env.CRON_SECRET?.length || 0,
  };

  // 7. 最近の投稿
  try {
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("id, account_id, status, posted_at, theme, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    diagnostics.recent_posts = {
      count: recentPosts?.length || 0,
      posts: recentPosts || [],
    };
  } catch {
    diagnostics.recent_posts = { count: 0, error: "query failed" };
  }

  // 総合判定
  const autoEnabled = (diagnostics.auto_post_enabled as any)?.is_enabled;
  const hasAccounts = ((diagnostics.active_accounts as any)?.count || 0) > 0;
  const allHaveBuffer = ((diagnostics.active_accounts as any)?.accounts || []).every(
    (a: any) => a.has_buffer_id
  );
  const hasGemini = (diagnostics.gemini_api_key as any)?.configured;
  const hasCronSecret = (diagnostics.cron_secret as any)?.configured;

  diagnostics.overall = {
    ready: autoEnabled && hasAccounts && allHaveBuffer && hasGemini && hasCronSecret,
    checklist: {
      "auto_post_enabled": autoEnabled ? "✅" : "❌",
      "active_accounts_exist": hasAccounts ? "✅" : "❌",
      "all_accounts_have_buffer_id": allHaveBuffer ? "✅" : "❌",
      "gemini_api_key_set": hasGemini ? "✅" : "❌",
      "cron_secret_set": hasCronSecret ? "✅" : "❌",
    },
  };

  return NextResponse.json(diagnostics, {
    headers: { "Content-Type": "application/json" },
  });
}
