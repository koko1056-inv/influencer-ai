import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface PostData {
  text: string;
  sent_at: string | null;
  media_type?: string;
  impressions: number;
  reach?: number;
  views?: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  clicks?: number;
  engagement_rate: number;
  style_tags?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { platform, account_name } = await req.json();

    if (!platform || !["instagram", "linkedin"].includes(platform)) {
      return NextResponse.json(
        { error: "platform は instagram または linkedin を指定してください" },
        { status: 400 }
      );
    }

    // Fetch posts from the appropriate cache table
    const tableName =
      platform === "instagram"
        ? "instagram_posts_cache"
        : "linkedin_posts_cache";

    const { data: posts, error: dbError } = await supabase
      .from(tableName)
      .select("*")
      .order("sent_at", { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const allPosts: PostData[] = (posts || []).map((p: any) => ({
      text: p.text,
      sent_at: p.sent_at,
      media_type: p.media_type || undefined,
      impressions: p.impressions || 0,
      reach: p.reach || 0,
      views: p.views || 0,
      likes: p.likes || 0,
      comments: p.comments || 0,
      shares: p.shares || p.reshares || 0,
      saves: p.saves || 0,
      clicks: p.clicks || 0,
      engagement_rate: p.engagement_rate || 0,
      style_tags: p.style_tags || [],
    }));

    const postsWithData = allPosts.filter((p) => p.impressions > 0);

    if (postsWithData.length === 0) {
      return NextResponse.json(
        {
          error:
            "エンゲージメントデータが入力された投稿がありません。まず投稿のデータを入力してください。",
        },
        { status: 400 }
      );
    }

    // Compute aggregate stats
    const totalPosts = postsWithData.length;
    const avgImpressions =
      postsWithData.reduce((s, p) => s + p.impressions, 0) / totalPosts;
    const avgEngagement =
      postsWithData.reduce((s, p) => s + p.engagement_rate, 0) / totalPosts;
    const avgLikes =
      postsWithData.reduce((s, p) => s + p.likes, 0) / totalPosts;
    const avgComments =
      postsWithData.reduce((s, p) => s + p.comments, 0) / totalPosts;

    // Analyze posting times
    const postingHours: Record<number, { count: number; avgEng: number }> = {};
    const postingDays: Record<number, { count: number; avgEng: number }> = {};

    for (const p of postsWithData) {
      if (p.sent_at) {
        const d = new Date(p.sent_at);
        const hour = d.getHours();
        const day = d.getDay();

        if (!postingHours[hour])
          postingHours[hour] = { count: 0, avgEng: 0 };
        postingHours[hour].count++;
        postingHours[hour].avgEng += p.engagement_rate;

        if (!postingDays[day]) postingDays[day] = { count: 0, avgEng: 0 };
        postingDays[day].count++;
        postingDays[day].avgEng += p.engagement_rate;
      }
    }

    // Calculate averages
    for (const h of Object.keys(postingHours)) {
      const k = Number(h);
      postingHours[k].avgEng /= postingHours[k].count;
    }
    for (const d of Object.keys(postingDays)) {
      const k = Number(d);
      postingDays[k].avgEng /= postingDays[k].count;
    }

    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

    // Sort by engagement for top/bottom performers
    const sorted = [...postsWithData].sort(
      (a, b) => b.engagement_rate - a.engagement_rate
    );
    const topPosts = sorted.slice(0, 5);
    const worstPosts = sorted.slice(-3).reverse();

    // Media type breakdown (Instagram)
    let mediaBreakdown = "";
    if (platform === "instagram") {
      const byType: Record<string, { count: number; avgEng: number }> = {};
      for (const p of postsWithData) {
        const t = p.media_type || "image";
        if (!byType[t]) byType[t] = { count: 0, avgEng: 0 };
        byType[t].count++;
        byType[t].avgEng += p.engagement_rate;
      }
      for (const t of Object.keys(byType)) {
        byType[t].avgEng /= byType[t].count;
      }
      mediaBreakdown = Object.entries(byType)
        .map(
          ([type, data]) =>
            `  - ${type}: ${data.count}件, 平均ER ${data.avgEng.toFixed(1)}%`
        )
        .join("\n");
    }

    // Build the prompt
    const platformLabel =
      platform === "instagram" ? "Instagram" : "LinkedIn";

    const postsSummary = topPosts
      .map(
        (p, i) =>
          `${i + 1}. [ER ${p.engagement_rate.toFixed(1)}%] インプレ:${p.impressions} いいね:${p.likes} コメント:${p.comments}${p.saves ? ` 保存:${p.saves}` : ""}${p.media_type ? ` (${p.media_type})` : ""}\n   投稿日時: ${p.sent_at ? new Date(p.sent_at).toLocaleString("ja-JP") : "不明"}\n   内容: ${p.text.substring(0, 120)}...${p.style_tags?.length ? `\n   タグ: ${p.style_tags.join(", ")}` : ""}`
      )
      .join("\n\n");

    const worstSummary = worstPosts
      .map(
        (p, i) =>
          `${i + 1}. [ER ${p.engagement_rate.toFixed(1)}%] インプレ:${p.impressions} いいね:${p.likes} コメント:${p.comments}\n   内容: ${p.text.substring(0, 80)}...`
      )
      .join("\n");

    const timingData = Object.entries(postingHours)
      .sort((a, b) => b[1].avgEng - a[1].avgEng)
      .map(
        ([h, data]) =>
          `  ${h}時台: ${data.count}件投稿, 平均ER ${data.avgEng.toFixed(1)}%`
      )
      .join("\n");

    const dayData = Object.entries(postingDays)
      .sort((a, b) => b[1].avgEng - a[1].avgEng)
      .map(
        ([d, data]) =>
          `  ${dayNames[Number(d)]}曜日: ${data.count}件投稿, 平均ER ${data.avgEng.toFixed(1)}%`
      )
      .join("\n");

    const prompt = `あなたは${platformLabel}のSNSマーケティング専門のアナリストです。
以下のデータを分析して、具体的で実行可能な改善レポートを日本語で生成してください。

## アカウント情報
- プラットフォーム: ${platformLabel}
${account_name ? `- アカウント名: ${account_name}` : ""}
- 分析対象投稿数: ${totalPosts}件（データ入力済み）/ 全${allPosts.length}件

## 全体サマリー
- 平均インプレッション: ${avgImpressions.toFixed(0)}
- 平均エンゲージメント率: ${avgEngagement.toFixed(2)}%
- 平均いいね数: ${avgLikes.toFixed(1)}
- 平均コメント数: ${avgComments.toFixed(1)}
${platform === "instagram" ? `\n## メディアタイプ別\n${mediaBreakdown}` : ""}

## 投稿時間帯別パフォーマンス
${timingData || "（データ不足）"}

## 曜日別パフォーマンス
${dayData || "（データ不足）"}

## トップパフォーマンス投稿 (TOP ${topPosts.length})
${postsSummary}

## 低パフォーマンス投稿
${worstSummary}

---

以下の形式でレポートを生成してください。マークダウン形式で出力。各セクションは具体的な数値とアクションアイテムを含めてください。

## 📊 パフォーマンスサマリー
（全体の評価、業界平均との比較コメント）

## 🏆 成功パターン分析
（トップ投稿の共通点、なぜうまくいったか）

## ⏰ 最適な投稿タイミング
（具体的な曜日と時間帯の推奨、データに基づく根拠）

## 📝 コンテンツ戦略の提案
（今後どういう方向性の投稿を増やすべきか、5つの具体的なアイデア）

${platform === "instagram" ? "## 🎬 メディアフォーマット戦略\n（リール・カルーセル・画像のどれに注力すべきか）\n" : ""}
## 📈 改善アクションプラン
（今すぐ実行できる改善施策を優先度順に5つ）

## 💡 次の1週間でやるべきこと
（具体的な投稿プラン: いつ・何を・どの形式で）
`;

    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const report = result.response.text();

    return NextResponse.json({
      report,
      stats: {
        total_posts: allPosts.length,
        posts_with_data: totalPosts,
        avg_impressions: Math.round(avgImpressions),
        avg_engagement_rate: Number(avgEngagement.toFixed(2)),
        avg_likes: Number(avgLikes.toFixed(1)),
        avg_comments: Number(avgComments.toFixed(1)),
      },
    });
  } catch (e: any) {
    console.error("分析レポート生成エラー:", e);
    return NextResponse.json(
      { error: e.message || "レポート生成に失敗しました" },
      { status: 500 }
    );
  }
}
