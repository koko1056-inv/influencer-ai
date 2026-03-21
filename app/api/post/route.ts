import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generatePostText } from "@/lib/gemini";
import { createPost, createImagePost } from "@/lib/buffer";
import { uploadImageFromBase64 } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { post_id, account_id, text, theme, scheduled_at, image_urls } =
      await req.json();

    // post_id が指定されている場合: 既存の投稿を公開
    if (post_id) {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("*, accounts(*)")
        .eq("id", post_id)
        .single();

      if (postError || !post) {
        return NextResponse.json(
          { error: `投稿が見つかりません: ${post_id}` },
          { status: 404 }
        );
      }

      const account = post.accounts;
      if (!account?.buffer_profile_id) {
        return NextResponse.json(
          { error: "BufferチャンネルIDが設定されていません" },
          { status: 400 }
        );
      }

      // 画像URLリストの構築
      const finalImageUrls: string[] = [];

      // リクエストから渡された画像URLリスト（フロントエンドから複数画像を送信）
      if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
        for (const url of image_urls) {
          if (url.startsWith("data:")) {
            const uploaded = await uploadImageFromBase64(url);
            if (uploaded) finalImageUrls.push(uploaded);
          } else {
            finalImageUrls.push(url);
          }
        }
      } else {
        // フォールバック: DBの画像URL
        let imageUrl = post.image_url;
        if (imageUrl && imageUrl.startsWith("data:")) {
          const uploaded = await uploadImageFromBase64(imageUrl);
          if (uploaded) {
            imageUrl = uploaded;
            await supabase.from("posts").update({ image_url: uploaded }).eq("id", post_id);
          }
        }
        if (imageUrl && !imageUrl.startsWith("data:")) {
          finalImageUrls.push(imageUrl);
        }
      }

      // Buffer投稿
      let result;
      if (finalImageUrls.length > 0) {
        result = await createImagePost(
          account.buffer_profile_id,
          post.caption,
          finalImageUrls,
          scheduled_at
        );
      } else {
        result = await createPost(
          account.buffer_profile_id,
          post.caption,
          scheduled_at
        );
      }

      // 投稿ステータスを更新
      await supabase
        .from("posts")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
          buffer_post_id: result.postId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post_id);

      return NextResponse.json({
        success: result.success,
        account_name: account.name,
        post_text: post.caption,
        post_id: post.id,
        image_count: finalImageUrls.length,
        buffer_response: result,
      });
    }

    // account_id + text の場合: 新規投稿
    if (!account_id) {
      return NextResponse.json(
        { error: "post_id または account_id は必須です" },
        { status: 400 }
      );
    }

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

    if (!account.buffer_profile_id) {
      return NextResponse.json(
        { error: "BufferチャンネルIDが設定されていません" },
        { status: 400 }
      );
    }

    // テキストが指定されていなければ自動生成
    let postText = text;
    if (!postText) {
      const content = await generatePostText(
        {
          name: account.name,
          persona: account.persona,
          tone: account.tone,
          target_audience: account.target_audience,
        },
        theme || ""
      );
      postText = content.post_text;
    }

    // Buffer投稿
    const result = await createPost(
      account.buffer_profile_id,
      postText,
      scheduled_at
    );

    // 投稿をSupabaseに記録
    const { data: savedPost } = await supabase
      .from("posts")
      .insert({
        account_id,
        caption: postText,
        status: "posted",
        posted_at: new Date().toISOString(),
        buffer_post_id: result.postId || null,
      })
      .select()
      .single();

    return NextResponse.json({
      success: result.success,
      account_name: account.name,
      post_text: postText,
      post_id: savedPost?.id || null,
      buffer_response: result,
    });
  } catch (e: any) {
    console.error("投稿エラー:", e);
    return NextResponse.json(
      { error: e.message || "投稿に失敗しました" },
      { status: 500 }
    );
  }
}
