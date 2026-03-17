import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getOrganizations } from "@/lib/buffer";

export const dynamic = "force-dynamic";

// 初期データを一括取得（コールドスタート1回で済む）
export async function GET() {
  try {
    // 全クエリを並列実行
    const [
      accountsResult,
      postsResult,
      onboardingResult,
      geminiResult,
      bufferResult,
    ] = await Promise.all([
      // アカウント一覧
      supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false }),

      // 投稿一覧（image_url は大きいので thumbnail 用に短縮）
      supabase
        .from("posts")
        .select(
          "id, account_id, caption, image_url, theme, hashtags, status, scheduled_at, posted_at, created_at, accounts(id, name, platform, username)"
        )
        .order("created_at", { ascending: false })
        .limit(50),

      // オンボーディング状態
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "onboarding_completed")
        .limit(1),

      // Gemini APIキー確認
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "gemini_api_key")
        .limit(1),

      // Buffer プロファイル取得
      (async () => {
        try {
          const orgs = await getOrganizations();
          return orgs.flatMap((org) =>
            org.channels.map((ch) => ({
              id: ch.id,
              service: ch.service,
              service_username: ch.name,
              formatted_username: `${ch.name} (${ch.service})`,
            }))
          );
        } catch {
          return [];
        }
      })(),
    ]);

    const accounts = accountsResult.data || [];
    const posts = postsResult.data || [];

    const onboardingValue = onboardingResult.data?.[0]?.value;
    const onboardingCompleted =
      onboardingValue === true ||
      onboardingValue === "true" ||
      String(onboardingValue) === "true";

    const hasGemini = !!process.env.GEMINI_API_KEY;
    const geminiVal = geminiResult.data?.[0]?.value;
    const hasGeminiInDb = !!(
      geminiVal &&
      typeof geminiVal === "string" &&
      geminiVal.trim()
    );

    return NextResponse.json({
      accounts,
      posts,
      bufferProfiles: bufferResult,
      status: {
        onboarding_completed: onboardingCompleted,
        gemini_configured: hasGemini || hasGeminiInDb,
        buffer_configured: !!process.env.BUFFER_ACCESS_TOKEN,
        account_count: accounts.length,
      },
    });
  } catch (e: any) {
    console.error("Init API error:", e);
    return NextResponse.json(
      { error: e.message || "初期化に失敗しました" },
      { status: 500 }
    );
  }
}
