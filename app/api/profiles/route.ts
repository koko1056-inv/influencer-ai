import { NextResponse } from "next/server";
import { getProfiles } from "@/lib/buffer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let bufferProfiles: any[] = [];
    try {
      bufferProfiles = await getProfiles();
    } catch (e) {
      console.error("Buffer profiles取得失敗:", e);
    }

    return NextResponse.json({ bufferProfiles });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "取得に失敗しました" },
      { status: 500 }
    );
  }
}
