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
  progress: number;
  error?: string;
}

/**
 * Sora 2で動画を生成（非同期ジョブ開始）
 */
export async function createVideo(
  prompt: string,
  options?: {
    model?: "sora-2" | "sora-2-pro";
    size?: "1280x720" | "720x1280" | "1024x1792" | "1792x1024";
    seconds?: 4 | 8 | 12;
    apiKey?: string;
  }
): Promise<{ videoId: string; status: string }> {
  const key = options?.apiKey || (await getOpenAIApiKey());
  const openai = new OpenAI({ apiKey: key });

  const video = await openai.videos.create({
    model: options?.model || "sora-2",
    prompt,
    size: options?.size || "720x1280",
    seconds: String(options?.seconds || 8) as "4" | "8" | "12",
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
    progress: video.progress ?? 0,
    error: video.error?.message,
  };
}

/**
 * 完成した動画をダウンロードしてSupabase Storageにアップロード。
 * ストリーミングでチャンクずつ読み取りメモリ使用量を抑制。
 */
export async function downloadAndUploadVideo(
  videoId: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || (await getOpenAIApiKey());
  const openai = new OpenAI({ apiKey: key });

  // OpenAIから動画をストリーミングダウンロード
  const response = await openai.videos.downloadContent(videoId);

  // ReadableStream → チャンクを収集（Supabase StorageはBufferが必要）
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("動画のダウンロードストリームを取得できませんでした");
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalSize += value.length;
  }

  // チャンクを結合（全体をarrayBufferで一括読みするより制御しやすい）
  const buffer = Buffer.concat(chunks, totalSize);
  console.log(`動画ダウンロード完了: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

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

