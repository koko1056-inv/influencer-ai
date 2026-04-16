import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

// GET: Fetch Instagram posts + analytics
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (action === "sync") {
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

      // Fetch sent Instagram posts
      const postsData = await bufferGraphql(`{
        posts(input: { organizationId: "${orgId}", filter: { status: [sent] } }, first: 100) {
          edges {
            node {
              id text sentAt channelService
              assets { id mimeType }
            }
          }
        }
      }`);

      const allPosts = postsData.data?.posts?.edges || [];
      const instagramPosts = allPosts
        .map((e: any) => e.node)
        .filter((p: any) => p.channelService === "instagram");

      // Upsert into instagram_posts_cache
      let synced = 0;
      for (const post of instagramPosts) {
        const hasVideo = post.assets?.some((a: any) =>
          a.mimeType?.startsWith("video/")
        );
        const { error } = await supabase
          .from("instagram_posts_cache")
          .upsert(
            {
              buffer_post_id: post.id,
              text: post.text || "",
              sent_at: post.sentAt,
              channel_service: "instagram",
              media_type: hasVideo ? "reel" : "image",
            },
            { onConflict: "buffer_post_id" }
          );
        if (!error) synced++;
      }

      return NextResponse.json({
        synced,
        total_instagram: instagramPosts.length,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "posts") {
    const { data, error } = await supabase
      .from("instagram_posts_cache")
      .select("*")
      .order("sent_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ posts: data || [] });
  }

  if (action === "insights") {
    const { data: posts } = await supabase
      .from("instagram_posts_cache")
      .select("*")
      .order("engagement_rate", { ascending: false });

    const allPosts = posts || [];
    const topPerformers = allPosts
      .filter((p) => p.engagement_rate > 0)
      .slice(0, 5);
    const avgEngagement =
      allPosts.length > 0
        ? allPosts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) /
          allPosts.length
        : 0;
    const totalReach = allPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
    const totalImpressions = allPosts.reduce(
      (sum, p) => sum + (p.impressions || 0),
      0
    );
    const totalEngagements = allPosts.reduce(
      (sum, p) =>
        sum +
        (p.likes || 0) +
        (p.comments || 0) +
        (p.shares || 0) +
        (p.saves || 0),
      0
    );

    // Analyze media type performance
    const reels = allPosts.filter((p) => p.media_type === "reel");
    const images = allPosts.filter((p) => p.media_type === "image");
    const carousels = allPosts.filter((p) => p.media_type === "carousel");

    const avgByType = (arr: typeof allPosts) =>
      arr.length > 0
        ? arr.reduce((s, p) => s + (p.engagement_rate || 0), 0) / arr.length
        : 0;

    return NextResponse.json({
      total_posts: allPosts.length,
      posts_with_data: allPosts.filter((p) => p.impressions > 0).length,
      avg_engagement_rate: avgEngagement.toFixed(2),
      total_reach: totalReach,
      total_impressions: totalImpressions,
      total_engagements: totalEngagements,
      media_breakdown: {
        reels: {
          count: reels.length,
          avg_engagement: avgByType(reels).toFixed(2),
        },
        images: {
          count: images.length,
          avg_engagement: avgByType(images).toFixed(2),
        },
        carousels: {
          count: carousels.length,
          avg_engagement: avgByType(carousels).toFixed(2),
        },
      },
      top_performers: topPerformers.map((p) => ({
        id: p.id,
        text: p.text.substring(0, 100) + (p.text.length > 100 ? "..." : ""),
        media_type: p.media_type,
        impressions: p.impressions,
        reach: p.reach,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        engagement_rate: p.engagement_rate,
        sent_at: p.sent_at,
        style_tags: p.style_tags,
      })),
    });
  }

  return NextResponse.json(
    { error: "action parameter required (sync, posts, insights)" },
    { status: 400 }
  );
}

// POST: Update engagement data for a post
export async function POST(req: NextRequest) {
  try {
    const {
      id,
      impressions,
      reach,
      views,
      likes,
      comments,
      shares,
      saves,
      media_type,
      style_tags,
      is_top_performer,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const engagement_total =
      (likes || 0) + (comments || 0) + (shares || 0) + (saves || 0);
    const effectiveReach = reach || impressions || 0;
    const engagement_rate =
      effectiveReach > 0 ? (engagement_total / effectiveReach) * 100 : 0;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      engagement_rate,
    };
    if (impressions !== undefined) updateData.impressions = impressions;
    if (reach !== undefined) updateData.reach = reach;
    if (views !== undefined) updateData.views = views;
    if (likes !== undefined) updateData.likes = likes;
    if (comments !== undefined) updateData.comments = comments;
    if (shares !== undefined) updateData.shares = shares;
    if (saves !== undefined) updateData.saves = saves;
    if (media_type !== undefined) updateData.media_type = media_type;
    if (style_tags !== undefined) updateData.style_tags = style_tags;
    if (is_top_performer !== undefined)
      updateData.is_top_performer = is_top_performer;

    const { error } = await supabase
      .from("instagram_posts_cache")
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
