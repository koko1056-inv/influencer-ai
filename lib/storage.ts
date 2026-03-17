import { supabase } from "./supabase";

const BUCKET = "post-images";

/**
 * base64データURLをSupabase Storageにアップロードし、公開URLを返す
 */
export async function uploadImageFromBase64(
  dataUrl: string,
  fileName?: string
): Promise<string | null> {
  try {
    // data:image/png;base64,XXXXX → バイナリに変換
    const match = dataUrl.match(/^data:(image\/(\w+));base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const ext = match[2] === "jpeg" ? "jpg" : match[2];
    const base64Data = match[3];

    // base64 → Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // ファイル名を生成
    const name =
      fileName || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const filePath = `${name}.${ext}`;

    // Supabase Storageにアップロード
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return publicUrl;
  } catch (e) {
    console.error("Image upload failed:", e);
    return null;
  }
}
