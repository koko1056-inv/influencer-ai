import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com";

async function getBufferToken(): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "buffer_api_key")
    .limit(1);
  if (data?.[0]?.value) return String(data[0].value);
  return process.env.BUFFER_ACCESS_TOKEN || "";
}

async function bufferGraphql(query: string) {
  const token = await getBufferToken();
  const res = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  return res.json();
}

// GET: Fetch LinkedIn posts + analytics
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (action === "sync") {
    // Sync LinkedIn posts from Buffer
    try {
      // Get org ID
      const orgData = await bufferGraphql(`{
        account {
          organizations { id }
        }
      }`);
      const orgId = orgData.data?.account?.organizations?.[0]?.id;
      if (!orgId) {
        return NextResponse.json({ error: "Organization not found" }, { status: 400 });
      }

      // Fetch sent LinkedIn posts
      const postsData = await bufferGraphql(`{
        posts(input: { organizationId: "${orgId}", filter: { status: [sent] } }, first: 50) {
          edges {
            node {
              id text sentAt channelService
            }
          }
        }
      }`);

      const allPosts = postsData.data?.posts?.edges || [];
      const linkedinPosts = allPosts
        .map((e: any) => e.node)
        .filter((p: any) => p.channelService === "linkedin");

      // Upsert into linkedin_posts_cache
      let synced = 0;
      for (const post of linkedinPosts) {
        const { error } = await supabase
          .from("linkedin_posts_cache")
          .upsert({
            buffer_post_id: post.id,
            text: post.text,
            sent_at: post.sentAt,
            channel_service: post.channelService,
          }, { onConflict: "buffer_post_id" });
        if (!error) synced++;
      }

      return NextResponse.json({
        synced,
        total_linkedin: linkedinPosts.length,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "posts") {
    // Get all cached LinkedIn posts with engagement data
    const { data, error } = await supabase
      .from("linkedin_posts_cache")
      .select("*")
      .order("sent_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ posts: data || [] });
  }

  if (action === "insights") {
    // Get top performing posts and generate insights
    const { data: posts } = await supabase
      .from("linkedin_posts_cache")
      .select("*")
      .order("engagement_rate", { ascending: false });

    const allPosts = posts || [];
    const topPerformers = allPosts.filter((p) => p.engagement_rate > 0).slice(0, 5);
    const avgEngagement = allPosts.length > 0
      ? allPosts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / allPosts.length
      : 0;
    const totalImpressions = allPosts.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalEngagements = allPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);

    // Analyze style patterns of top performers
    const topTexts = topPerformers.map((p) => p.text).join("\n---\n");

    return NextResponse.json({
      total_posts: allPosts.length,
      posts_with_data: allPosts.filter((p) => p.impressions > 0).length,
      avg_engagement_rate: avgEngagement.toFixed(2),
      total_impressions: totalImpressions,
      total_engagements: totalEngagements,
      top_performers: topPerformers.map((p) => ({
        id: p.id,
        text: p.text.substring(0, 100) + (p.text.length > 100 ? "..." : ""),
        impressions: p.impressions,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        engagement_rate: p.engagement_rate,
        sent_at: p.sent_at,
        style_tags: p.style_tags,
      })),
      top_texts_for_ai: topTexts,
      all_posts_for_ai: allPosts.map((p) => p.text).join("\n---\n"),
    });
  }

  return NextResponse.json({ error: "action parameter required (sync, posts, insights)" }, { status: 400 });
}

// POST: Update engagement data for a post
export async function POST(req: NextRequest) {
  try {
    const { id, impressions, views, likes, comments, shares, clicks, style_tags, is_top_performer } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const engagement_total = (likes || 0) + (comments || 0) + (shares || 0) + (clicks || 0);
    const engagement_rate = impressions > 0 ? (engagement_total / impressions) * 100 : 0;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (impressions !== undefined) updateData.impressions = impressions;
    if (views !== undefined) updateData.views = views;
    if (likes !== undefined) updateData.likes = likes;
    if (comments !== undefined) updateData.comments = comments;
    if (shares !== undefined) updateData.shares = shares;
    if (clicks !== undefined) updateData.clicks = clicks;
    if (style_tags !== undefined) updateData.style_tags = style_tags;
    if (is_top_performer !== undefined) updateData.is_top_performer = is_top_performer;
    updateData.engagement_rate = engagement_rate;

    const { error } = await supabase
      .from("linkedin_posts_cache")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, engagement_rate });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
