import { NextRequest, NextResponse } from "next/server";
import { checkVideoStatus, downloadAndUploadVideo, getOpenAIApiKey } from "@/lib/sora";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get("video_id");
    const postId = req.nextUrl.searchParams.get("post_id");

    if (!videoId) {
      return NextResponse.json(
        { error: "video_id は必須です" },
        { status: 400 }
      );
    }

    const apiKey = await getOpenAIApiKey();
    const result = await checkVideoStatus(videoId, apiKey);

    // 完了した場合、動画をダウンロード＆Supabaseにアップロード
    if (result.status === "completed") {
      try {
        const videoUrl = await downloadAndUploadVideo(videoId, apiKey);

        // post_idがあればDBを更新
        if (postId) {
          await supabase
            .from("posts")
            .update({ image_url: videoUrl })
            .eq("id", postId);
        }

        return NextResponse.json({
          status: "completed",
          video_url: videoUrl,
        });
      } catch (dlErr: any) {
        console.error("動画ダウンロードエラー:", dlErr);
        return NextResponse.json({
          status: "completed",
          video_url: null,
          error: `動画のダウンロードに失敗: ${dlErr.message}`,
        });
      }
    }

    return NextResponse.json({
      status: result.status,
      video_url: null,
    });
  } catch (e: any) {
    console.error("動画ステータス確認エラー:", e);
    return NextResponse.json(
      { error: e.message || "ステータスの確認に失敗しました" },
      { status: 500 }
    );
  }
}
