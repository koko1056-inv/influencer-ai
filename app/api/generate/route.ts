import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generatePostText, generateMultipleImages, getGeminiApiKey } from "@/lib/gemini";
import { uploadImageFromBase64 } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { account_id, theme, image_count, reference_image } = await req.json();

    if (!account_id) {
      return NextResponse.json(
        { error: "account_id は必須です" },
        { status: 400 }
      );
    }

    // APIキーをSupabase/envから取得
    let apiKey: string;
    try {
      apiKey = await getGeminiApiKey();
    } catch {
      return NextResponse.json(
        { error: "Gemini API Keyが設定されていません。設定画面からAPIキーを入力してください。" },
        { status: 400 }
      );
    }

    // Supabaseからアカウント取得
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

    // アカウント情報（アバター含む）
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

    // テキスト生成（参照画像も渡してキャプションにも商品情報を反映）
    const content = await generatePostText(accountInfo, theme || "", apiKey, reference_image || null);

    // 複数画像生成（最大5枚、0の場合はスキップ）
    const requestedCount = image_count === 0 ? 0 : Math.min(Math.max(image_count || 1, 1), 5);
    const imageResults: string[] = [];
    const imageUrls: string[] = [];

    if (requestedCount > 0) {
      try {
        const generatedImages = await generateMultipleImages(
          accountInfo,
          content.image_prompt,
          requestedCount,
          apiKey,
          reference_image || null
        );

        // 各画像をSupabase Storageにアップロード
        for (const imageData of generatedImages) {
          imageResults.push(imageData);
          try {
            const url = await uploadImageFromBase64(imageData);
            if (url) {
              imageUrls.push(url);
            }
          } catch (e) {
            console.error("画像アップロードエラー:", e);
          }
        }

        console.log(`画像生成完了: ${imageResults.length}/${requestedCount}枚`);
      } catch (e) {
        console.error("画像生成スキップ:", e);
      }
    } else {
      console.log("テキストのみ生成（画像生成スキップ）");
    }

    // ハッシュタグを抽出
    const hashtagMatches = (content.post_text || "").match(/#[\w\u3000-\u9FFF]+/g);
    const hashtags = hashtagMatches || [];

    // ドラフト投稿をSupabaseに保存（最初の画像をメインとして保存）
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        account_id,
        caption: content.post_text,
        image_url: imageUrls[0] || imageResults[0] || null,
        image_prompt: content.image_prompt,
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
      account_id,
      account_name: account.name,
      post_text: content.post_text,
      image_prompt: content.image_prompt,
      // 後方互換: 最初の画像
      image_data: imageResults[0] || null,
      image_url: imageUrls[0] || null,
      // 複数画像
      images: imageResults,
      image_urls: imageUrls,
      image_count: imageResults.length,
      post_id: post?.id || null,
    });
  } catch (e: any) {
    console.error("生成エラー:", e);
    const msg = e.message || "生成に失敗しました";
    const isKeyError = msg.includes("API_KEY_INVALID") || msg.includes("expired") || msg.includes("API key");
    return NextResponse.json(
      { error: isKeyError ? "Gemini API Keyが無効です。設定画面で有効なキーを入力してください。" : msg },
      { status: isKeyError ? 400 : 500 }
    );
  }
}
