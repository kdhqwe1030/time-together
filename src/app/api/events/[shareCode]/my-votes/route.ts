import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/src/lib/supabase/supabaseServer";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ shareCode: string }> }
) {
  const supabase = createSupabaseServer();
  const { shareCode } = await ctx.params;

  const voterToken = req.nextUrl.searchParams.get("voterToken")?.trim();
  if (!voterToken) {
    return NextResponse.json(
      { ok: false, error: "voterToken is required" },
      { status: 400 }
    );
  }

  // 1) 이벤트 찾기
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("share_code", shareCode)
    .maybeSingle();

  if (eventErr) {
    return NextResponse.json(
      { ok: false, error: "Failed to load event", details: eventErr.message },
      { status: 500 }
    );
  }
  if (!eventRow?.id) {
    return NextResponse.json(
      { ok: false, error: "Invalid shareCode" },
      { status: 404 }
    );
  }

  // 2) voter_token -> voter_id 찾기
  const { data: voterRow, error: voterErr } = await supabase
    .from("event_voters")
    .select("id")
    .eq("event_id", eventRow.id)
    .eq("voter_token", voterToken)
    .maybeSingle();

  if (voterErr) {
    return NextResponse.json(
      { ok: false, error: "Failed to load voter", details: voterErr.message },
      { status: 500 }
    );
  }

  // 아직 투표/등록 안 한 토큰이면 빈 배열 반환(정상 케이스)
  if (!voterRow?.id) {
    return NextResponse.json(
      { ok: true, eventId: eventRow.id, voterId: null, slotIds: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // 3) votes에서 slot_id들 찾기
  const { data: voteRows, error: votesErr } = await supabase
    .from("votes")
    .select("slot_id")
    .eq("event_id", eventRow.id)
    .eq("voter_id", voterRow.id);

  if (votesErr) {
    return NextResponse.json(
      { ok: false, error: "Failed to load votes", details: votesErr.message },
      { status: 500 }
    );
  }

  const slotIds = (voteRows ?? [])
    .map((r) => r.slot_id)
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  return NextResponse.json(
    { ok: true, eventId: eventRow.id, voterId: voterRow.id, slotIds },
    { headers: { "Cache-Control": "no-store" } }
  );
}
