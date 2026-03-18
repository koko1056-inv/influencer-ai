import { NextRequest, NextResponse } from "next/server";
import { generateLinkedInPost, generateImage, getGeminiApiKey } from "@/lib/gemini";
import { uploadImageFromBase64 } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

/** 過去投稿の分析コンテキストを取得 */
async function getPastPostsContext(): Promise<string> {
  // トップパフォーマー（エンゲージメントデータあり）
  const { data: topPosts } = await supabase
    .from("linkedin_posts_cache")
    .select("text, impressions, likes, comments, shares, engagement_rate, style_tags")
    .gt("engagement_rate", 0)
    .order("engagement_rate", { ascending: false })
    .limit(5);

  // 全投稿（スタイル参照用）
  const { data: allPosts } = await supabase
    .from("linkedin_posts_cache")
    .select("text, sent_at")
    .order("sent_at", { ascending: false })
    .limit(15);

  if (!allPosts || allPosts.length === 0) return "";

  let context = "\n\n【過去のLinkedIn投稿の分析データ】\n";

  if (topPosts && topPosts.length > 0) {
    context += "\n■ エンゲージメントが高かった投稿TOP:\n";
    topPosts.forEach((p, i) => {
      context += `\n${i + 1}. エンゲージメント率: ${p.engagement_rate}% (👍${p.likes} 💬${p.comments} 🔄${p.shares} 👀${p.impressions})\n`;
      context += `スタイルタグ: ${(p.style_tags || []).join(", ") || "未分類"}\n`;
      context += `内容: ${p.text.substring(0, 200)}...\n`;
    });

    context += `\n■ 高エンゲージメント投稿の共通パターンを分析し、同じ要素を新しい投稿にも取り入れてください：`;
    context += `\n- 冒頭のフック（質問？大胆な主張？データ？）`;
    context += `\n- 文体（短文か長文か、絵文字の使い方）`;
    context += `\n- 構成（箇条書き？ストーリー形式？Before/After？）`;
    context += `\n- CTA（コメント誘導？シェア誘導？）\n`;
  }

  // 最近の投稿スタイルを参照
  context += "\n■ 最近の投稿スタイル（文体や雰囲気を維持してください）:\n";
  allPosts.slice(0, 5).forEach((p, i) => {
    context += `\n--- 投稿${i + 1} ---\n${p.text.substring(0, 300)}${p.text.length > 300 ? "..." : ""}\n`;
  });

  return context;
}

export async function POST(req: NextRequest) {
  try {
    const { topic, style, reference_image, use_past_data } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: "トピックは必須です" },
        { status: 400 }
      );
    }

    let apiKey: string;
    try {
      apiKey = await getGeminiApiKey();
    } catch {
      return NextResponse.json(
        { error: "Gemini API Keyが設定されていません。設定画面からAPIキーを入力してください。" },
        { status: 400 }
      );
    }

    // 過去投稿の分析コンテキスト（デフォルトで有効）
    let pastContext = "";
    if (use_past_data !== false) {
      try {
        pastContext = await getPastPostsContext();
      } catch (e) {
        console.error("過去投稿取得エラー:", e);
      }
    }

    // LinkedIn投稿テキスト生成（過去データコンテキスト付き）
    const topicWithContext = pastContext
      ? `${topic}\n${pastContext}`
      : topic;

    const content = await generateLinkedInPost(
      topicWithContext,
      style || "thought_leadership",
      apiKey,
      reference_image || null
    );

    // 画像生成（1枚）
    let imageData: string | null = null;
    let imageUrl: string | null = null;

    try {
      const accountForImage = {
        name: "心夢 松尾",
        persona: "AI・テクノロジー分野のビジネスリーダー",
        tone: "professional",
        target_audience: "ビジネスプロフェッショナル",
      };
      imageData = await generateImage(
        accountForImage,
        content.image_prompt,
        apiKey,
        reference_image || null
      );

      if (imageData) {
        imageUrl = await uploadImageFromBase64(imageData);
      }
    } catch (e) {
      console.error("LinkedIn画像生成エラー:", e);
    }

    // ハッシュタグを抽出
    const hashtagMatches = (content.post_text || "").match(/#[\w\u3000-\u9FFF]+/g);
    const hashtags = hashtagMatches || [];

    // LinkedInアカウントを探す（なければnull）
    const { data: linkedinAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("platform", "linkedin")
      .limit(1)
      .single();

    // ドラフト投稿を保存
    const { data: post } = await supabase
      .from("posts")
      .insert({
        account_id: linkedinAccount?.id || null,
        caption: content.post_text,
        image_url: imageUrl || imageData || null,
        image_prompt: content.image_prompt,
        theme: topic,
        hashtags,
        status: "draft",
      })
      .select()
      .single();

    return NextResponse.json({
      post_text: content.post_text,
      headline: content.headline,
      image_prompt: content.image_prompt,
      image_data: imageData,
      image_url: imageUrl,
      post_id: post?.id || null,
      used_past_data: !!pastContext,
    });
  } catch (e: any) {
    console.error("LinkedIn生成エラー:", e);
    const msg = e.message || "生成に失敗しました";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
