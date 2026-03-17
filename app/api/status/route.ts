import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasBuffer = !!process.env.BUFFER_ACCESS_TOKEN;
    const hasCron = !!process.env.CRON_SECRET;

    // アカウント数を取得（countの代わりにselectしてlength）
    const { data: accounts, error: countError } = await supabase
      .from("accounts")
      .select("id");

    if (countError) {
      console.error("アカウント数取得エラー:", countError);
    }

    const accountCount = accounts?.length || 0;

    // オンボーディング状態を取得
    const { data: onboardingRows } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "onboarding_completed")
      .limit(1);

    const onboardingValue = onboardingRows?.[0]?.value;
    const onboardingCompleted = onboardingValue === true || onboardingValue === "true" || String(onboardingValue) === "true";

    // Gemini APIキーがapp_settingsにあるかも確認
    const { data: geminiSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "gemini_api_key")
      .single();

    const hasGeminiInDb = !!(geminiSetting?.value && typeof geminiSetting.value === "string" && geminiSetting.value.trim());

    return NextResponse.json({
      gemini_configured: hasGemini || hasGeminiInDb,
      buffer_configured: hasBuffer,
      cron_configured: hasCron,
      account_count: accountCount,
      onboarding_completed: onboardingCompleted,
      setup_complete: (hasGemini || hasGeminiInDb) && accountCount > 0,
    });
  } catch (e: any) {
    console.error("ステータスAPI エラー:", e);
    return NextResponse.json(
      { error: e.message || "ステータス取得に失敗しました" },
      { status: 500 }
    );
  }
}
