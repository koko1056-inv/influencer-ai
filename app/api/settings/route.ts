import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: 全設定を取得
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) throw error;

    // key-value のオブジェクト形式に変換
    const settings: Record<string, unknown> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({ settings, raw: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "設定の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 設定を更新（upsert）
export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json(
        { error: "key は必須です" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("app_settings")
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ setting: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "設定の保存に失敗しました" },
      { status: 500 }
    );
  }
}
