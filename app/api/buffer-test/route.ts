import { NextResponse } from "next/server";
import { testConnection, getOrganizations } from "@/lib/buffer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const result = await testConnection();
    // 全チャンネル詳細も返す
    let allChannels: { id: string; name: string; service: string; type: string }[] = [];
    try {
      const orgs = await getOrganizations();
      allChannels = orgs.flatMap((o) => o.channels);
    } catch {}

    return NextResponse.json({
      ...result,
      all_channels: allChannels,
      channel_count: allChannels.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { connected: false, error: e.message || "接続テスト失敗" },
      { status: 500 }
    );
  }
}
