import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createVideoPost } from "@/lib/buffer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { post_id, video_url } = await req.json();

    if (!post_id || !video_url) {
      return NextResponse.json(
        { error: "post_id と video_url は必須です" },
        { status: 400 }
      );
    }

    // 投稿とアカウント情報を取得
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

    // Buffer経由で動画投稿
    const result = await createVideoPost(
      account.buffer_profile_id,
      post.caption,
      video_url
    );

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
      buffer_response: result,
    });
  } catch (e: any) {
    console.error("動画投稿エラー:", e);
    return NextResponse.json(
      { error: e.message || "動画投稿に失敗しました" },
      { status: 500 }
    );
  }
}
