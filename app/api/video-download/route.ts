import { NextRequest, NextResponse } from "next/server";
import { downloadAndUploadWeryVideo } from "@/lib/weryai";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分 — 動画のダウンロード＆アップロードに十分な時間

/**
 * WeryAI CDNから動画をダウンロードしてSupabase Storageにアップロード。
 * video-status で succeed + video_url を確認した後にフロントエンドから呼ばれる。
 */
export async function POST(req: NextRequest) {
  try {
    const { video_url, post_id } = await req.json();

    if (!video_url) {
      return NextResponse.json(
        { error: "video_url は必須です" },
        { status: 400 }
      );
    }

    const uploadedUrl = await downloadAndUploadWeryVideo(video_url);

    // post_idがあればDBを更新
    if (post_id) {
      await supabase
        .from("posts")
        .update({ image_url: uploadedUrl })
        .eq("id", post_id);
    }

    return NextResponse.json({
      status: "completed",
      video_url: uploadedUrl,
    });
  } catch (e: any) {
    console.error("動画ダウンロードエラー:", e);
    return NextResponse.json(
      { error: e.message || "動画のダウンロードに失敗しました" },
      { status: 500 }
    );
  }
}
