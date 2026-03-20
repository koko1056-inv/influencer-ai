import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "@/lib/gemini";

export const maxDuration = 120;

export interface VideoAnalysis {
  scenes: {
    description: string;
    camera_movement: string;
    duration_hint: string;
  }[];
  overall_mood: string;
  color_palette: string;
  transitions: string;
  style: string;
  subject: string;
  recommended_prompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const { video_data, mime_type } = await req.json();

    if (!video_data) {
      return NextResponse.json(
        { error: "動画データが必要です" },
        { status: 400 }
      );
    }

    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    // base64データからプレフィックスを除去
    let base64Data = video_data;
    if (base64Data.startsWith("data:")) {
      base64Data = base64Data.split(",")[1];
    }

    const mimeType = mime_type || "video/mp4";

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-preview",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: `この動画を詳細に分析し、同じスタイルの動画をAI動画生成ツール（Sora）で再現するための構造化データを生成してください。

以下のJSON形式で出力してください（他の文字は不要）:

{
  "scenes": [
    {
      "description": "シーンの詳細な説明（被写体、背景、アクション、構図）",
      "camera_movement": "カメラワーク（パン、チルト、ズーム、固定、ドリーなど）",
      "duration_hint": "おおよその長さ（例: 2-3秒）"
    }
  ],
  "overall_mood": "動画全体の雰囲気やムード（例: 明るく活気がある、落ち着いたシネマティック）",
  "color_palette": "主要な色調やカラーグレーディング（例: 暖色系、ティール＆オレンジ、パステル）",
  "transitions": "シーン間の遷移方法（カット、フェード、スワイプなど）",
  "style": "映像スタイル（例: Vlog風、シネマティック、SNSリール風、ドキュメンタリー風）",
  "subject": "主な被写体や内容（例: 人物のファッション紹介、料理プロセス、風景）",
  "recommended_prompt": "この動画のスタイルを再現するためのSora用英語プロンプト（具体的で詳細に。カメラワーク、ライティング、雰囲気、被写体のアクションをすべて含める。200語程度）"
}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const text = result.response.text();
    const analysis = JSON.parse(text) as VideoAnalysis;

    return NextResponse.json({
      analysis,
      success: true,
    });
  } catch (e: any) {
    console.error("動画分析エラー:", e);
    return NextResponse.json(
      { error: e.message || "動画の分析に失敗しました" },
      { status: 500 }
    );
  }
}
