import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generatePostText, getGeminiApiKey } from "@/lib/gemini";
import { generateVideoFull, getOpenAIApiKey } from "@/lib/sora";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { account_id, prompt, theme, model, size, seconds } = await req.json();

    if (!account_id) {
      return NextResponse.json(
        { error: "account_id は必須です" },
        { status: 400 }
      );
    }

    // APIキーを取得
    let geminiApiKey: string;
    try {
      geminiApiKey = await getGeminiApiKey();
    } catch {
      return NextResponse.json(
        { error: "Gemini API Keyが設定されていません。設定画面からAPIキーを入力してください。" },
        { status: 400 }
      );
    }

    let openaiApiKey: string;
    try {
      openaiApiKey = await getOpenAIApiKey();
    } catch {
      return NextResponse.json(
        { error: "OpenAI API Keyが設定されていません。設定画面からAPIキーを入力してください。" },
        { status: 400 }
      );
    }

    // アカウント取得
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", account_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: `アカウントが見つかりません: ${account_id}` },
        { status: 404 }
      );
    }

    const accountInfo = {
      name: account.name,
      persona: account.persona,
      tone: account.tone,
      target_audience: account.target_audience,
      avatar_url: account.avatar_url || null,
      character_voice: account.character_voice || "",
      writing_style: account.writing_style || "",
      expertise_areas: account.expertise_areas || "",
      affiliate_info: account.affiliate_info || "",
      cta_goal: account.cta_goal || "",
    };

    // 動画プロンプトとキャプションを決定
    let videoPrompt: string;
    let postText: string;

    if (prompt && !theme) {
      // promptが直接指定された場合はそのまま使う
      videoPrompt = prompt;
      // キャプションはGeminiで生成
      const content = await generatePostText(accountInfo, prompt, geminiApiKey);
      postText = content.post_text;
    } else {
      // themeからGeminiでキャプション＋画像プロンプトを生成し、画像プロンプトを動画プロンプトとして使う
      const content = await generatePostText(accountInfo, theme || "", geminiApiKey);
      postText = content.post_text;
      videoPrompt = content.image_prompt;
    }

    // Sora 2で動画生成（完了まで待機）
    const { videoUrl, videoId } = await generateVideoFull(videoPrompt, {
      model: model || "sora-2",
      size: size || "1080x1920",
      seconds: seconds || 8,
      apiKey: openaiApiKey,
    });

    // ハッシュタグを抽出
    const hashtagMatches = (postText || "").match(/#[\w\u3000-\u9FFF]+/g);
    const hashtags = hashtagMatches || [];

    // ドラフト投稿をSupabaseに保存（video URLをimage_urlフィールドに保存）
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        account_id,
        caption: postText,
        image_url: videoUrl,
        image_prompt: videoPrompt,
        theme: theme || null,
        hashtags,
        status: "draft",
      })
      .select()
      .single();

    if (postError) {
      console.error("投稿保存エラー:", postError);
    }

    return NextResponse.json({
      video_url: videoUrl,
      video_id: videoId,
      post_id: post?.id || null,
      post_text: postText,
      account_name: account.name,
    });
  } catch (e: any) {
    console.error("動画生成エラー:", e);
    const msg = e.message || "動画生成に失敗しました";
    const isKeyError = msg.includes("API_KEY_INVALID") || msg.includes("expired") || msg.includes("API key") || msg.includes("Incorrect API key");
    return NextResponse.json(
      { error: isKeyError ? "APIキーが無効です。設定画面で有効なキーを入力してください。" : msg },
      { status: isKeyError ? 400 : 500 }
    );
  }
}
