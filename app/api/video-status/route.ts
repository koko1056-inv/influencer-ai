import { NextRequest, NextResponse } from "next/server";
import { checkVideoStatus, getOpenAIApiKey } from "@/lib/sora";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * ステータス確認のみ（軽量）。ダウンロードは /api/video-download で行う。
 */
export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get("video_id");

    if (!videoId) {
      return NextResponse.json(
        { error: "video_id は必須です" },
        { status: 400 }
      );
    }

    const apiKey = await getOpenAIApiKey();
    const result = await checkVideoStatus(videoId, apiKey);

    return NextResponse.json({
      status: result.status,
      progress: result.progress,
      video_url: null,
      error: result.error || null,
    });
  } catch (e: any) {
    console.error("動画ステータス確認エラー:", e);
    return NextResponse.json(
      { error: e.message || "ステータスの確認に失敗しました" },
      { status: 500 }
    );
  }
}
