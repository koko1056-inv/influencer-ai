import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// base64アバターをSupabase Storageにアップロード → URL返却
async function uploadAvatarIfBase64(avatarUrl: string | null, accountId: string): Promise<string | null> {
  if (!avatarUrl || !avatarUrl.startsWith("data:")) return avatarUrl;

  const match = avatarUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return avatarUrl;

  const mimeType = match[1];
  const base64 = match[2];
  const ext = mimeType.split("/")[1] || "png";
  const buffer = Buffer.from(base64, "base64");
  const fileName = `avatars/${accountId || randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(fileName, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    console.error("Avatar upload error:", error);
    return avatarUrl;
  }

  const { data: pubUrl } = supabase.storage
    .from("post-images")
    .getPublicUrl(fileName);

  return pubUrl.publicUrl;
}

// GET: 全アカウント取得
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: アカウント追加/更新
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "name は必須です" },
        { status: 400 }
      );
    }

    // 新規作成時に重複チェック
    if (!body.id && body.username) {
      const { data: existing } = await supabase
        .from("accounts")
        .select("id")
        .eq("username", body.username)
        .eq("platform", body.platform || "instagram")
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: `このアカウント（@${body.username} / ${body.platform || "instagram"}）は既に登録されています` },
          { status: 409 }
        );
      }
    }

    // base64アバターをStorageにアップロード
    const avatarUrl = await uploadAvatarIfBase64(body.avatar_url || null, body.id || randomUUID());

    // id があれば更新、なければ新規作成
    if (body.id) {
      const { data, error } = await supabase
        .from("accounts")
        .update({
          name: body.name,
          platform: body.platform || "instagram",
          username: body.username || "",
          persona: body.persona || "",
          tone: body.tone || "",
          target_audience: body.target_audience || "",
          posting_frequency: body.posting_frequency || "",
          avatar_url: avatarUrl,
          buffer_profile_id: body.buffer_profile_id || null,
          is_active: body.is_active !== false,
          character_voice: body.character_voice || "",
          writing_style: body.writing_style || "",
          expertise_areas: body.expertise_areas || "",
          affiliate_info: body.affiliate_info || "",
          cta_goal: body.cta_goal || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ account: data });
    } else {
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          name: body.name,
          platform: body.platform || "instagram",
          username: body.username || "",
          persona: body.persona || "",
          tone: body.tone || "",
          target_audience: body.target_audience || "",
          posting_frequency: body.posting_frequency || "",
          avatar_url: avatarUrl,
          buffer_profile_id: body.buffer_profile_id || null,
          is_active: body.is_active !== false,
          character_voice: body.character_voice || "",
          writing_style: body.writing_style || "",
          expertise_areas: body.expertise_areas || "",
          affiliate_info: body.affiliate_info || "",
          cta_goal: body.cta_goal || "",
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ account: data }, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "保存に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: アカウント削除
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "削除に失敗しました" },
      { status: 500 }
    );
  }
}
