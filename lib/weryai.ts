import { supabase } from "./supabase";

const BASE_URL = "https://api.weryai.com";

/** Supabase app_settings → env変数 の順でWeryAI APIキーを取得 */
export async function getWeryAIApiKey(): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "weryai_api_key")
    .single();

  if (data?.value && typeof data.value === "string" && data.value.trim()) {
    return data.value.trim();
  }

  if (process.env.WERYAI_API_KEY) {
    return process.env.WERYAI_API_KEY;
  }

  throw new Error(
    "WeryAI API Keyが設定されていません。設定画面からAPIキーを入力してください。"
  );
}

/* ─── 利用可能モデル ─── */

export const TEXT_TO_VIDEO_MODELS = [
  { key: "KLING_V3_0_STA", name: "Kling 3.0 Standard", speed: "fast" },
  { key: "KLING_V3_0_PRO", name: "Kling 3.0 Pro", speed: "normal" },
  { key: "SEEDANCE_2_0", name: "Seedance 2.0", speed: "normal" },
  { key: "WERYAI_VIDEO_1_0", name: "WeryAI Video 1.0", speed: "fast" },
  { key: "VEO_3_1", name: "Veo 3.1", speed: "normal" },
  { key: "VEO_3_1_FAST", name: "Veo 3.1 Fast", speed: "fast" },
  { key: "SORA_2", name: "Sora 2", speed: "slow" },
  { key: "HAILUO_2_3_STA", name: "Hailuo 2.3 Standard", speed: "fast" },
  { key: "HAILUO_2_3_PRO", name: "Hailuo 2.3 Pro", speed: "normal" },
  { key: "WAN_2_6", name: "Wan 2.6", speed: "normal" },
  { key: "PIKA_2_2", name: "Pika 2.2", speed: "fast" },
  { key: "DOUBAO_1_5_PRO", name: "Seedance 1.5 Pro", speed: "normal" },
] as const;

export const IMAGE_TO_VIDEO_MODELS = [
  { key: "KLING_V3_0_STA", name: "Kling 3.0 Standard", speed: "fast" },
  { key: "KLING_V3_0_PRO", name: "Kling 3.0 Pro", speed: "normal" },
  { key: "SEEDANCE_2_0", name: "Seedance 2.0", speed: "normal" },
  { key: "WERYAI_VIDEO_1_0", name: "WeryAI Video 1.0", speed: "fast" },
  { key: "VEO_3_1", name: "Veo 3.1", speed: "normal" },
  { key: "SORA_2", name: "Sora 2", speed: "slow" },
  { key: "RUNWAY_4_5", name: "Runway Gen 4.5", speed: "normal" },
  { key: "HAILUO_2_3_STA", name: "Hailuo 2.3 Standard", speed: "fast" },
  { key: "HAILUO_2_3_PRO", name: "Hailuo 2.3 Pro", speed: "normal" },
  { key: "WAN_2_6", name: "Wan 2.6", speed: "normal" },
  { key: "PIKA_2_2", name: "Pika 2.2", speed: "fast" },
  { key: "KLING_O1", name: "Kling O1", speed: "slow" },
] as const;

/* ─── API呼び出しヘルパー ─── */

async function weryFetch<T>(
  path: string,
  apiKey: string,
  options?: { method?: string; body?: unknown }
): Promise<T> {
  // cache-busting for status polling (WeryAI CDN may cache GET responses)
  const url = options?.method === "GET" || !options?.method
    ? `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`
    : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store",
    },
    cache: "no-store",
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const json = await res.json();
  if (json.status !== 0 && json.status !== 200) {
    throw new Error(
      `WeryAI API Error (${json.status}): ${json.message || json.desc || "Unknown error"}`
    );
  }

  return json.data as T;
}

/* ─── Types ─── */

export interface WeryVideoResult {
  taskId: string;
  status: "waiting" | "processing" | "succeed" | "failed";
  videoUrl?: string;
  error?: string;
}

/* ─── Text-to-Video ─── */

export async function createTextToVideo(
  prompt: string,
  options?: {
    model?: string;
    aspectRatio?: string;
    duration?: number;
    generateAudio?: boolean;
    apiKey?: string;
  }
): Promise<{ taskId: string }> {
  const key = options?.apiKey || (await getWeryAIApiKey());

  const data = await weryFetch<{ task_id?: string; task_ids?: string[]; batch_id?: number }>(
    "/v1/generation/text-to-video",
    key,
    {
      method: "POST",
      body: {
        model: options?.model || "KLING_V3_0_STA",
        prompt,
        aspect_ratio: options?.aspectRatio || "9:16",
        duration: options?.duration || 5,
        generate_audio: options?.generateAudio ? "true" : "false",
        video_number: 1,
      },
    }
  );

  const taskId = data.task_id || data.task_ids?.[0];
  if (!taskId) throw new Error("WeryAI: task_id not found in response");
  return { taskId };
}

/* ─── Image-to-Video ─── */

export async function createImageToVideo(
  prompt: string,
  imageUrl: string,
  options?: {
    model?: string;
    aspectRatio?: string;
    duration?: number;
    generateAudio?: boolean;
    apiKey?: string;
  }
): Promise<{ taskId: string }> {
  const key = options?.apiKey || (await getWeryAIApiKey());

  const data = await weryFetch<{ task_id?: string; task_ids?: string[]; batch_id?: number }>(
    "/v1/generation/image-to-video",
    key,
    {
      method: "POST",
      body: {
        model: options?.model || "KLING_V3_0_STA",
        prompt,
        image: imageUrl,
        aspect_ratio: options?.aspectRatio || "9:16",
        duration: options?.duration || 5,
        generate_audio: options?.generateAudio ? "true" : "false",
        video_number: 1,
      },
    }
  );

  const taskId = data.task_id || data.task_ids?.[0];
  if (!taskId) throw new Error("WeryAI: task_id not found in response");
  return { taskId };
}

/* ─── ステータス確認 ─── */

export async function checkTaskStatus(
  taskId: string,
  apiKey?: string
): Promise<WeryVideoResult> {
  const key = apiKey || (await getWeryAIApiKey());

  const data = await weryFetch<{
    task_id: string;
    task_status: string;
    videos?: string[];
    msg?: string;
  }>(`/v1/generation/${taskId}/status`, key);

  return {
    taskId: data.task_id,
    status: data.task_status as WeryVideoResult["status"],
    videoUrl: data.videos?.[0],
    error: data.msg,
  };
}

/* ─── 動画をダウンロード＆Supabaseにアップロード ─── */

export async function downloadAndUploadWeryVideo(
  videoUrl: string
): Promise<string> {
  // CDNから動画をダウンロード
  const res = await fetch(videoUrl);
  if (!res.ok) {
    throw new Error(`動画ダウンロード失敗: HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
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

  const buffer = Buffer.concat(chunks, totalSize);
  console.log(`WeryAI動画ダウンロード完了: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

  // Supabase Storageにアップロード
  const fileName = `videos/weryai-${Date.now()}.mp4`;
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

/* ─── クレジット残高確認 ─── */

export async function getBalance(apiKey?: string): Promise<number> {
  const key = apiKey || (await getWeryAIApiKey());
  return await weryFetch<number>("/v1/generation/balance", key);
}
