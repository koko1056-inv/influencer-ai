import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CATEGORY_MAP: Record<string, { ja: string; keywords: string }> = {
  beauty: {
    ja: "美容・コスメ",
    keywords: "beauty, skincare, cosmetics, makeup, K-beauty",
  },
  fashion: {
    ja: "ファッション",
    keywords: "fashion, style, outfits, clothing trends, streetwear",
  },
  food: {
    ja: "グルメ・料理",
    keywords: "food, restaurants, cooking, recipes, food trends, cafes",
  },
  fitness: {
    ja: "フィットネス・健康",
    keywords: "fitness, workout, health, wellness, yoga, gym",
  },
  tech: {
    ja: "テクノロジー",
    keywords: "technology, gadgets, AI, apps, smartphones, tech trends",
  },
  travel: {
    ja: "旅行",
    keywords: "travel, destinations, hotels, tourism, travel tips",
  },
  lifestyle: {
    ja: "ライフスタイル",
    keywords: "lifestyle, home decor, self-care, productivity, daily routine",
  },
  entertainment: {
    ja: "エンタメ",
    keywords: "entertainment, movies, music, anime, games, streaming",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { category, custom_query } = await req.json();

    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    // カテゴリ情報
    const catInfo = CATEGORY_MAP[category] || null;
    const searchContext = custom_query
      ? custom_query
      : catInfo
        ? catInfo.keywords
        : "general social media trends";

    const categoryLabel = custom_query
      ? custom_query
      : catInfo
        ? catInfo.ja
        : "一般";

    // Gemini でリアルタイムトレンドを検索・分析
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // @ts-ignore - tools with google_search is supported
      tools: [{ google_search: {} }],
    });

    const prompt = `You are a social media trend analyst. Search the web for the latest trending topics and viral content related to: ${searchContext}

Focus on:
- What's trending RIGHT NOW on social media (Instagram, TikTok, X/Twitter)
- Recent viral topics, products, events in this category
- Seasonal or timely content ideas
- Trending hashtags
- Find the SOURCE URL for each trend (article, social post, news, etc.)

For each trend, also provide an "image_keywords" field: 2-3 English keywords (comma-separated) that best represent the visual concept of this trend. These will be used to find a stock photo. Be specific (e.g. "matcha latte cafe", "AI robot hand", "spring cherry blossom tokyo").

Return EXACTLY this JSON format (no other text):
{
  "trends": [
    {
      "title": "トレンドのタイトル（日本語）",
      "description": "なぜこれがトレンドなのか、投稿にどう活かせるかの説明（日本語、2-3文）",
      "hashtags": ["#ハッシュタグ1", "#ハッシュタグ2"],
      "post_theme": "このトレンドを使ったSNS投稿のテーマ案（日本語、1文）",
      "source": "情報源やプラットフォーム名",
      "source_url": "https://参照元のURL",
      "image_keywords": "english, keywords, here"
    }
  ]
}

Return 5-8 trending topics. All text fields in Japanese (except image_keywords which must be in English). Make each one actionable as an Instagram post theme.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSONを抽出（Markdownコードブロックに包まれている場合に対応）
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    const directMatch = jsonStr.match(/\{[\s\S]*"trends"[\s\S]*\}/);
    if (directMatch) {
      jsonStr = directMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("トレンドJSON解析失敗:", text.slice(0, 500));
      parsed = {
        trends: [
          {
            title: "トレンド取得に失敗しました",
            description: "もう一度お試しください。カスタムキーワードを入力すると精度が上がります。",
            hashtags: [],
            post_theme: "",
            source: "",
            source_url: "",
            image_url: "",
          },
        ],
      };
    }

    // グラウンディングメタデータからソースURLを補完
    const groundingMeta = result.response.candidates?.[0]?.groundingMetadata;
    const searchQueries = groundingMeta?.webSearchQueries || [];
    // @ts-ignore
    const groundingChunks = groundingMeta?.groundingChunks || [];
    // @ts-ignore
    const sourceUrls: string[] = groundingChunks
      // @ts-ignore
      .filter((c: any) => c.web?.uri)
      // @ts-ignore
      .map((c: any) => c.web.uri);

    // トレンドにsource_urlがなければグラウンディングから補完 + image_urlを生成
    if (parsed.trends) {
      parsed.trends = parsed.trends.map((t: any, i: number) => {
        // Unsplash Source APIでキーワードベースの画像URLを生成
        const keywords = (t.image_keywords || t.title || "")
          .replace(/[^\w\s,]/g, "")
          .trim();
        const imageQuery = keywords.split(/[\s,]+/).slice(0, 3).join(",");
        const imageUrl = imageQuery
          ? `https://loremflickr.com/800/600/${encodeURIComponent(imageQuery)}`
          : "";

        return {
          title: t.title,
          description: t.description,
          hashtags: t.hashtags || [],
          post_theme: t.post_theme || "",
          source: t.source || "",
          source_url: t.source_url || sourceUrls[i] || "",
          image_url: imageUrl,
          image_keywords: t.image_keywords || "",
        };
      });
    }

    return NextResponse.json({
      category: categoryLabel,
      trends: parsed.trends || [],
      search_queries: searchQueries,
      source_urls: sourceUrls,
      fetched_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("トレンド取得エラー:", e);
    return NextResponse.json(
      { error: e.message || "トレンド取得に失敗しました" },
      { status: 500 }
    );
  }
}
