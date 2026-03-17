import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: 投稿履歴を取得（account_id, status でフィルタ可能）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("account_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("posts")
      .select("*, accounts(id, name, platform, username)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "投稿の取得に失敗しました" },
      { status: 500 }
    );
  }
}
