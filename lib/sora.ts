import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

/** Supabase app_settings → env変数 の順でAPIキーを取得 */
export async function getOpenAIApiKey(): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "openai_api_key")
    .single();

  if (data?.value && typeof data.value === "string" && data.value.trim()) {
    return data.value.trim();
  }

  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  throw new Error(
    "OpenAI API Keyが設定されていません。設定画面からAPIキーを入力してください。"
  );
}

export interface VideoGenerationResult {
  status: "completed" | "failed" | "in_progress" | "queued";
  videoId: string;
  progress?: number;
  downloadUrl?: string;
  error?: string;
}

/**
 * Sora 2で動画を生成（非同期ジョブ開始）
 */
export async function createVideo(
  prompt: string,
  options?: {
    model?: "sora-2" | "sora-2-pro";
    size?: "1280x720" | "720x1280";
    seconds?: 8 | 20;
    apiKey?: string;
  }
): Promise<{ videoId: string; status: string }> {
  const key = options?.apiKey || (await getOpenAIApiKey());
  const openai = new OpenAI({ apiKey: key });

  const video = await openai.videos.create({
    model: options?.model || "sora-2",
    prompt,
    size: options?.size || "720x1280",
    // @ts-expect-error - seconds accepts string
    seconds: String(options?.seconds || 8),
  });

  return {
    videoId: video.id,
    status: video.status as string,
  };
}

/**
 * 動画のステータスを確認
 */
export async function checkVideoStatus(
  videoId: string,
  apiKey?: string
): Promise<VideoGenerationResult> {
  const key = apiKey || (await getOpenAIApiKey());
  const openai = new OpenAI({ apiKey: key });

  const video = await openai.videos.retrieve(videoId);

  return {
    status: video.status as VideoGenerationResult["status"],
    videoId: video.id,
  };
}

/**
 * 完成した動画をダウンロードしてSupabase Storageにアップロード
 */
export async function downloadAndUploadVideo(
  videoId: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || (await getOpenAIApiKey());
  const openai = new OpenAI({ apiKey: key });

  // OpenAIから動画をダウンロード
  const response = await openai.videos.downloadContent(videoId);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Supabase Storageにアップロード
  const fileName = `videos/${videoId}-${Date.now()}.mp4`;
  const { error } = await supabase.storage
    .from("post-images")
    .upload(fileName, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    throw new Error(`動画のアップロードに失敗: ${error.message}`);
  }

  const { data: pubUrl } = supabase.storage
    .from("post-images")
    .getPublicUrl(fileName);

  return pubUrl.publicUrl;
}

/**
 * 動画生成＆ポーリング＆ダウンロードをまとめて実行
 */
export async function generateVideoFull(
  prompt: string,
  options?: {
    model?: "sora-2" | "sora-2-pro";
    size?: "1280x720" | "720x1280";
    seconds?: 8 | 20;
    apiKey?: string;
  }
): Promise<{ videoUrl: string; videoId: string }> {
  const key = options?.apiKey || (await getOpenAIApiKey());
  const openai = new OpenAI({ apiKey: key });

  // ジョブ作成（Sora APIはprompt文字列を使用）
  const job = await openai.videos.create({
    model: options?.model || "sora-2",
    prompt,
    size: options?.size || "720x1280",
    // @ts-expect-error - seconds accepts string
    seconds: String(options?.seconds || 8),
  });

  // ポーリングで完了を待機（最大5分）
  const maxWait = 300_000;
  const interval = 5_000;
  let elapsed = 0;
  let video = job;

  while (elapsed < maxWait) {
    if (video.status === "completed" || video.status === "failed") break;
    await new Promise((r) => setTimeout(r, interval));
    elapsed += interval;
    video = await openai.videos.retrieve(job.id);
  }

  if (video.status !== "completed") {
    throw new Error(`動画生成失敗: ステータス=${video.status}`);
  }

  // ダウンロード＆アップロード
  const videoUrl = await downloadAndUploadVideo(video.id, key);

  return { videoUrl, videoId: video.id };
}
