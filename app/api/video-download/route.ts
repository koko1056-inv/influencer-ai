import { NextRequest, NextResponse } from "next/server";
import { downloadAndUploadVideo, getOpenAIApiKey } from "@/lib/sora";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分 — 20秒動画のダウンロード＆アップロードに十分な時間

/**
 * 完成した動画をOpenAIからダウンロードしてSupabase Storageにアップロード。
 * video-status で completed を確認した後にフロントエンドから呼ばれる。
 */
export async function POST(req: NextRequest) {
  try {
    const { video_id, post_id } = await req.json();

    if (!video_id) {
      return NextResponse.json(
        { error: "video_id は必須です" },
        { status: 400 }
      );
    }

    const apiKey = await getOpenAIApiKey();
    const videoUrl = await downloadAndUploadVideo(video_id, apiKey);

    // post_idがあればDBを更新
    if (post_id) {
      await supabase
        .from("posts")
        .update({ image_url: videoUrl })
        .eq("id", post_id);
    }

    return NextResponse.json({
      status: "completed",
      video_url: videoUrl,
    });
  } catch (e: any) {
    console.error("動画ダウンロードエラー:", e);
    return NextResponse.json(
      { error: e.message || "動画のダウンロードに失敗しました" },
      { status: 500 }
    );
  }
}
