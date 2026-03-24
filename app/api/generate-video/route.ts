import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generatePostText, getGeminiApiKey } from "@/lib/gemini";
import { createTextToVideo, createImageToVideo, getWeryAIApiKey } from "@/lib/weryai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const {
      account_id,
      prompt,
      theme,
      model,
      aspect_ratio,
      duration,
      generate_audio,
      reference_image,
      video_analysis,
    } = await req.json();

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

    let weryaiApiKey: string;
    try {
      weryaiApiKey = await getWeryAIApiKey();
    } catch {
      return NextResponse.json(
        { error: "WeryAI API Keyが設定されていません。設定画面からAPIキーを入力してください。" },
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
      reference_accounts: account.reference_accounts || "",
      reference_posts: account.reference_posts || "",
    };

    // 動画プロンプトとキャプションを生成
    let videoPrompt: string;
    let postText: string;

    try {
      if (prompt && !theme) {
        videoPrompt = prompt;
        const content = await generatePostText(accountInfo, prompt, geminiApiKey, reference_image || null);
        postText = content.post_text;
      } else {
        const content = await generatePostText(accountInfo, theme || "", geminiApiKey, reference_image || null);
        postText = content.post_text;
        videoPrompt = content.image_prompt;
      }
    } catch (geminiErr: any) {
      console.error("Geminiテキスト生成エラー:", geminiErr);
      return NextResponse.json(
        { error: `テキスト生成に失敗しました: ${geminiErr.message || "Gemini APIエラー"}` },
        { status: 500 }
      );
    }

    // 動画分析データがある場合、プロンプトを強化
    if (video_analysis?.recommended_prompt) {
      const analysisContext = [
        `REFERENCE VIDEO STYLE: ${video_analysis.recommended_prompt}`,
        video_analysis.style ? `STYLE: ${video_analysis.style}` : "",
        video_analysis.overall_mood ? `MOOD: ${video_analysis.overall_mood}` : "",
        video_analysis.color_palette ? `COLORS: ${video_analysis.color_palette}` : "",
        video_analysis.transitions ? `TRANSITIONS: ${video_analysis.transitions}` : "",
        video_analysis.scenes?.length ? `SCENE FLOW: ${video_analysis.scenes.map((s: any) => `[${s.camera_movement}] ${s.description}`).join(" → ")}` : "",
      ].filter(Boolean).join("\n");

      videoPrompt = `${analysisContext}\n\nNow create a NEW video with the same style/mood/technique but with this content:\n${videoPrompt}`;
    }

    // WeryAI でジョブを作成（完了を待たずにすぐ返す）
    let taskId: string;

    if (reference_image) {
      // 参照画像がある場合はImage-to-Video
      const result = await createImageToVideo(videoPrompt, reference_image, {
        model: model || "KLING_V3_0_STA",
        aspectRatio: aspect_ratio || "9:16",
        duration: duration || 5,
        generateAudio: generate_audio || false,
        apiKey: weryaiApiKey,
      });
      taskId = result.taskId;
    } else {
      // テキストのみの場合はText-to-Video
      const result = await createTextToVideo(videoPrompt, {
        model: model || "KLING_V3_0_STA",
        aspectRatio: aspect_ratio || "9:16",
        duration: duration || 5,
        generateAudio: generate_audio || false,
        apiKey: weryaiApiKey,
      });
      taskId = result.taskId;
    }

    // ハッシュタグを抽出
    const hashtagMatches = (postText || "").match(/#[\w\u3000-\u9FFF]+/g);
    const hashtags = hashtagMatches || [];

    // ドラフト投稿をSupabaseに保存
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        account_id,
        caption: postText,
        image_url: null,
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
      task_id: taskId,
      post_id: post?.id || null,
      post_text: postText,
      account_name: account.name,
    });
  } catch (e: any) {
    console.error("動画生成エラー:", e);
    const msg = e.message || "動画生成に失敗しました";
    const isKeyError = msg.includes("API") && (msg.includes("key") || msg.includes("Key") || msg.includes("401"));
    return NextResponse.json(
      { error: isKeyError ? "APIキーが無効です。設定画面で有効なキーを入力してください。" : msg },
      { status: isKeyError ? 400 : 500 }
    );
  }
}
