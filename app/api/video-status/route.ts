import { NextRequest, NextResponse } from "next/server";
import { checkTaskStatus, getWeryAIApiKey } from "@/lib/weryai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * WeryAI タスクステータス確認（軽量）。ダウンロードは /api/video-download で行う。
 */
export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get("task_id");

    if (!taskId) {
      return NextResponse.json(
        { error: "task_id は必須です" },
        { status: 400 }
      );
    }

    const apiKey = await getWeryAIApiKey();
    console.log(`video-status: taskId=${taskId}, apiKey=${apiKey.substring(0, 10)}...`);
    const result = await checkTaskStatus(taskId, apiKey);
    console.log(`video-status: result=${JSON.stringify(result)}`);

    return NextResponse.json({
      status: result.status,
      video_url: result.videoUrl || null,
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
