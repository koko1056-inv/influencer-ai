import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { generatePostText, generateImage, getGeminiApiKey } from "@/lib/gemini";
import { createPost, createImagePost } from "@/lib/buffer";
import { uploadImageFromBase64 } from "@/lib/storage";

export const maxDuration = 300;

/** アカウントのペルソナからトレンドテーマを取得 */
async function fetchTrendThemeForAccount(
  persona: string,
  targetAudience: string,
  apiKey: string
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // @ts-ignore
      tools: [{ google_search: {} }],
    });

    const prompt = `You are a social media content strategist. Search the web for what's trending RIGHT NOW that would be relevant for an influencer with this profile:

Persona: ${persona}
Target audience: ${targetAudience}

Search for the latest trending topics, viral content, and current events related to this persona's niche.

Return ONLY a single Japanese sentence describing the best trending topic to post about right now. This will be used directly as a post theme.
Do NOT return JSON, bullet points, or explanations. Just one sentence in Japanese.
Example: "最近話題の〇〇を実際に試してみた感想"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // 改行や余分なフォーマットを除去
    return text.split("\n")[0].replace(/^["'*\-•]/, "").trim();
  } catch (e) {
    console.error("トレンドテーマ取得失敗:", e);
    return "";
  }
}

export async function GET(req: NextRequest) {
  // Vercel Cron の認証チェック
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 自動投稿が有効か確認
  const { data: autoPostSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "auto_post_enabled")
    .single();

  if (!autoPostSetting?.value || autoPostSetting.value === "false" || autoPostSetting.value === false) {
    return NextResponse.json({ message: "自動投稿は無効です", skipped: true });
  }

  // トレンド自動取得が有効か確認
  const { data: trendAutoSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "auto_post_use_trends")
    .single();
  const useTrends = trendAutoSetting?.value === true || trendAutoSetting?.value === "true";

  // APIキーを事前に取得
  let apiKey: string;
  try {
    apiKey = await getGeminiApiKey();
  } catch {
    return NextResponse.json(
      { error: "Gemini API Keyが設定されていません" },
      { status: 500 }
    );
  }

  // アクティブなアカウントを取得
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true);

  if (error || !accounts) {
    return NextResponse.json(
      { error: "アカウント取得に失敗しました" },
      { status: 500 }
    );
  }

  // テーマリストを取得（設定されている場合）
  const { data: themesSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "auto_post_themes")
    .single();

  let themes: string[] = [];
  if (themesSetting?.value) {
    try {
      themes = typeof themesSetting.value === "string"
        ? JSON.parse(themesSetting.value)
        : themesSetting.value;
    } catch {
      themes = [];
    }
  }

  const results: { name: string; success: boolean; theme?: string; source?: string; error?: string }[] = [];

  for (const account of accounts) {
    if (!account.buffer_profile_id) {
      results.push({
        name: account.name,
        success: false,
        error: "Buffer Profile ID未設定",
      });
      continue;
    }

    try {
      const accountInfo = {
        name: account.name,
        persona: account.persona,
        tone: account.tone,
        target_audience: account.target_audience,
        avatar_url: account.avatar_url || null,
      };

      // テーマ決定: トレンド自動取得 → 手動テーマリスト → 空（AI自動）
      let selectedTheme = "";
      let themeSource = "AI自動";

      if (useTrends) {
        // リアルタイムトレンドからテーマ取得
        selectedTheme = await fetchTrendThemeForAccount(
          account.persona || "",
          account.target_audience || "",
          apiKey
        );
        if (selectedTheme) {
          themeSource = "トレンド";
        }
      }

      // トレンド取得失敗 or トレンド無効の場合、手動テーマリストから
      if (!selectedTheme && themes.length > 0) {
        selectedTheme = themes[Math.floor(Math.random() * themes.length)];
        themeSource = "テーマリスト";
      }

      const content = await generatePostText(accountInfo, selectedTheme, apiKey);

      // 画像生成 → Storageにアップロード
      let imageData: string | null = null;
      let imageUrl: string | null = null;
      try {
        imageData = await generateImage(accountInfo, content.image_prompt, apiKey);
        if (imageData) {
          imageUrl = await uploadImageFromBase64(imageData);
        }
      } catch {
        // 画像生成失敗はスキップ
      }

      // Buffer投稿（画像URLがある場合は画像付き）
      let bufferResult;
      if (imageUrl) {
        bufferResult = await createImagePost(
          account.buffer_profile_id,
          content.post_text,
          imageUrl
        );
      } else {
        bufferResult = await createPost(
          account.buffer_profile_id,
          content.post_text
        );
      }

      // ハッシュタグを抽出
      const hashtagMatches = content.post_text.match(/#[\w\u3000-\u9FFF]+/g);

      // 投稿をSupabaseに記録
      await supabase.from("posts").insert({
        account_id: account.id,
        caption: content.post_text,
        image_url: imageUrl || imageData,
        image_prompt: content.image_prompt,
        theme: selectedTheme || null,
        hashtags: hashtagMatches || [],
        status: bufferResult.success ? "posted" : "failed",
        posted_at: bufferResult.success ? new Date().toISOString() : null,
        buffer_post_id: bufferResult.postId || null,
      });

      results.push({
        name: account.name,
        success: !!bufferResult.success,
        theme: selectedTheme || "自動",
        source: themeSource,
      });
    } catch (e: any) {
      results.push({ name: account.name, success: false, error: e.message });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `Cron実行完了: ${successCount}/${accounts.length} アカウント成功`
  );

  return NextResponse.json({ results, total: accounts.length, successCount });
}
