import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export interface AccountForGeneration {
  name: string;
  persona: string;
  tone: string;
  target_audience: string;
  avatar_url?: string | null;
}

export interface GeneratedContent {
  post_text: string;
  image_prompt: string;
}

/** Supabase app_settings → env変数 の順でAPIキーを取得 */
export async function getGeminiApiKey(): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "gemini_api_key")
    .single();

  if (data?.value && typeof data.value === "string" && data.value.trim()) {
    return data.value.trim();
  }

  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  throw new Error(
    "Gemini API Keyが設定されていません。設定画面からAPIキーを入力してください。"
  );
}

function createGenAI(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * テキスト生成
 * referenceImageUrl: 商品画像などの参照画像（テキスト生成にも反映）
 */
export async function generatePostText(
  account: AccountForGeneration,
  theme: string = "",
  apiKey?: string,
  referenceImageUrl?: string | null
): Promise<GeneratedContent> {
  const key = apiKey || (await getGeminiApiKey());
  const genAI = createGenAI(key);

  const hasReference = !!referenceImageUrl;

  const systemPrompt = `あなたは「${account.name}」というSNSインフルエンサーです。
以下のペルソナ設定に従って、本人が書いたような自然で魅力的なSNS投稿を作成してください。

【ペルソナ設定】
${account.persona}

【トーン】
${account.tone}

【ターゲット層】
${account.target_audience}

【絶対ルール】
- この1回のリクエストで指定されたテーマ「だけ」に基づいて生成してください
- 過去のテーマや別の話題を一切混ぜないでください
- 投稿テキストはSNSに適した長さ（280文字以内）にしてください
- ハッシュタグを2〜5個含めてください
- 絵文字を適度に使用してください
- 宣伝っぽくならず、自然な語りにしてください
- 毎回新鮮で独立した投稿を生成してください`;

  const hasAvatar = !!account.avatar_url;

  // 参照画像（商品画像）があるかどうかでコンテキストを変える
  let imageContext = "";
  if (hasAvatar && hasReference) {
    imageContext = `

【重要：商品画像が添付されています】
添付された商品画像をよく観察し、この商品の特徴（形状、色、ブランド感、用途）を把握してください。
投稿テキストには、この商品を実際に使った感想やおすすめポイントを自然に書いてください。
画像生成プロンプトには「このインフルエンサーがこの商品を手に持っている/使っている/紹介している」シーンを具体的に描写してください。
本人の外見的特徴も反映した画像プロンプトにしてください。`;
  } else if (hasReference) {
    imageContext = `

【重要：商品画像が添付されています】
添付された商品画像をよく観察し、この商品の特徴（形状、色、ブランド感、用途）を把握してください。
投稿テキストには、この商品を実際に使った感想やおすすめポイントを自然に書いてください。
画像生成プロンプトには「人物がこの商品を手に持っている/使っている/紹介している」シーンを具体的に描写してください。`;
  } else if (hasAvatar) {
    imageContext = `

【重要】このインフルエンサーの参考画像が設定されています。画像生成プロンプトには、この人物の外見的特徴（髪型、雰囲気、ファッションスタイルなど）を反映してください。本人が写っているような自然な投稿画像を想定してプロンプトを書いてください。`;
  }

  const themeText = theme || "日常の出来事や最近のトレンドから自由に";
  const userPrompt = `===== 今回の生成リクエスト =====
これは独立した1回のリクエストです。以下の情報「だけ」を使って投稿を生成してください。

【今回のテーマ】: ${themeText}

このテーマに基づいてSNS投稿を作成してください。
また、この投稿に添える画像を生成するための英語の画像生成プロンプトも作成してください。
画像プロンプトは具体的で詳細に（スタイル、色合い、構図、雰囲気を含めて）記述してください。${imageContext}

投稿テキストと画像プロンプトの両方に、上記テーマの内容を必ず具体的に反映してください。
テーマが指定されている場合は、そのテーマに沿った投稿と画像にしてください。
他のテーマや過去の内容を絶対に混ぜないでください。

以下のJSON形式で出力してください（他の文字は不要）:
{"post_text": "投稿テキスト", "image_prompt": "英語の画像生成プロンプト"}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    systemInstruction: systemPrompt,
  });

  // マルチモーダルパーツ構築
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // アバター画像
  if (hasAvatar && account.avatar_url) {
    const avatarData = await fetchImageAsBase64(account.avatar_url);
    if (avatarData) {
      parts.push(
        { text: "【インフルエンサー本人の参考画像】この人物の外見やスタイルを画像生成プロンプトに反映してください：" },
        { inlineData: { mimeType: avatarData.mimeType, data: avatarData.base64 } }
      );
    }
  }

  // 参照画像（商品画像）
  if (hasReference && referenceImageUrl) {
    const refData = await fetchImageAsBase64(referenceImageUrl);
    if (refData) {
      parts.push(
        { text: "【商品/参照画像】この商品の特徴を把握し、投稿テキストと画像プロンプトに反映してください。インフルエンサーがこの商品を使っている様子を生成してください：" },
        { inlineData: { mimeType: refData.mimeType, data: refData.base64 } }
      );
    }
  }

  parts.push({ text: userPrompt });

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.9,
    },
  });

  const text = result.response.text();
  return JSON.parse(text) as GeneratedContent;
}

/**
 * 画像生成
 * referenceImageUrl: 商品画像（この商品を使っているシーンを生成）
 */
export async function generateImage(
  account: AccountForGeneration,
  imagePrompt: string,
  apiKey?: string,
  referenceImageUrl?: string | null
): Promise<string | null> {
  const key = apiKey || (await getGeminiApiKey());
  const genAI = createGenAI(key);

  const hasAvatar = !!account.avatar_url;
  const hasReference = !!referenceImageUrl;

  let fullPrompt: string;
  if (hasAvatar && hasReference) {
    fullPrompt = `TASK: Generate a social media photo of this influencer using/holding/featuring the product shown in the reference image.

INSTRUCTIONS:
- Photo 1 (PERSON): Use this as the person's appearance reference. The generated person should look like this.
- Photo 2 (PRODUCT): This is the product. The person should be holding, using, or naturally interacting with THIS EXACT product.
- Scene description: ${imagePrompt}
- The person should be naturally using or showcasing the product in a real-life setting.
- Make it look like a genuine influencer Instagram post — not an advertisement.
- Photorealistic, high quality, natural lighting, vibrant colors.
- The product must be clearly visible and recognizable in the image.`;
  } else if (hasAvatar) {
    fullPrompt = `Using the reference photo of this person as a visual guide, generate a new social media post image: ${imagePrompt}.
The generated image should feature a person who looks similar to the reference photo (same general appearance, style, and vibe).
Make it photorealistic, vibrant, and eye-catching — suitable for an influencer's Instagram post.
IMPORTANT: Create a NEW scene based on the prompt, but keep the person's appearance consistent with the reference.`;
  } else if (hasReference) {
    fullPrompt = `TASK: Generate a social media photo featuring the product shown in the reference image.

INSTRUCTIONS:
- The reference image shows a PRODUCT. Generate a scene where a person is using/holding/featuring this exact product.
- Scene description: ${imagePrompt}
- The product must be clearly visible and recognizable.
- Make it look like a genuine influencer post — natural, not an advertisement.
- Photorealistic, high quality, natural lighting, vibrant colors.`;
  } else {
    fullPrompt = `Generate a high-quality, visually appealing social media image: ${imagePrompt}.
The image should be photorealistic and suitable for an influencer's social media post.
Make it vibrant and eye-catching.`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-image-preview",
    });

    // マルチモーダル: アバター画像 + 商品画像 + テキストプロンプト
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (hasAvatar && account.avatar_url) {
      const avatarData = await fetchImageAsBase64(account.avatar_url);
      if (avatarData) {
        parts.push(
          { text: "Photo 1 (PERSON reference — generate a person who looks like this):" },
          { inlineData: { mimeType: avatarData.mimeType, data: avatarData.base64 } }
        );
      }
    }

    if (hasReference && referenceImageUrl) {
      const refData = await fetchImageAsBase64(referenceImageUrl);
      if (refData) {
        parts.push(
          { text: "Photo 2 (PRODUCT reference — the person should be using/holding/featuring THIS product):" },
          { inlineData: { mimeType: refData.mimeType, data: refData.base64 } }
        );
      }
    }

    parts.push({ text: fullPrompt });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        // @ts-ignore - responseModalities is supported but not in types yet
        responseModalities: ["image", "text"],
      },
    });

    const responseParts = result.response.candidates?.[0]?.content?.parts || [];
    for (const part of responseParts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.warn(`[${account.name}] 画像生成: レスポンスに画像データなし`);
    return null;
  } catch (e) {
    console.error(`[${account.name}] 画像生成失敗:`, e);
    return null;
  }
}

/** 複数画像を生成（最大5枚） */
export async function generateMultipleImages(
  account: AccountForGeneration,
  imagePrompt: string,
  count: number = 1,
  apiKey?: string,
  referenceImageUrl?: string | null
): Promise<string[]> {
  const safeCount = Math.min(Math.max(count, 1), 5);
  const results: string[] = [];

  for (let i = 0; i < safeCount; i++) {
    try {
      // バリエーションプロンプトを追加（2枚目以降）
      const variationSuffix = i > 0
        ? ` (Variation ${i + 1}: Use a completely different composition, camera angle, pose, and background setting while keeping the same person and product.)`
        : "";
      const result = await generateImage(
        account,
        imagePrompt + variationSuffix,
        apiKey,
        referenceImageUrl
      );
      if (result) {
        results.push(result);
      }
    } catch (e) {
      console.error(`[${account.name}] 画像生成 ${i + 1}/${safeCount} 失敗:`, e);
    }
  }

  return results;
}

/** URLまたはdata URLから画像をbase64で取得 */
async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    // data URL の場合はそのまま分解
    if (url.startsWith("data:")) {
      const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64: match[2] };
      }
      return null;
    }

    // Supabase Storage URL やその他のURLからfetch
    const res = await fetch(url);
    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return { base64, mimeType: contentType };
  } catch (e) {
    console.error("画像取得失敗:", e);
    return null;
  }
}
