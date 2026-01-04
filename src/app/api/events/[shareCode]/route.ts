import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/src/lib/supabase/supabaseServer";

type Slot = {
  id: string;
  slot_type: "DATE" | "DATETIME" | "WEEKDAY" | "WEEKDAYTIME";
  date: string | null;
  weekday: number | null;
  start_min: number | null;
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ shareCode: string }> }
) {
  const supabase = createSupabaseServer();
  const { shareCode } = await ctx.params;

  const voterToken = req.nextUrl.searchParams.get("voterToken"); // optional

  // 1) event
  const { data: event, error: e1 } = await supabase
    .from("events")
    .select(
      "id, share_code, title, mode, min_time_min, max_time_min, expires_at"
    )
    .eq("share_code", shareCode)
    .maybeSingle();

  if (e1 || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const eventId = event.id as string;

  // 2) slots
  const { data: slots, error: e2 } = await supabase
    .from("event_slots")
    .select("id, slot_type, date, weekday, start_min")
    .eq("event_id", eventId);

  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  // 3) votes (집계용) - MVP: 전체 읽고 서버에서 집계
  const { data: votes, error: e3 } = await supabase
    .from("votes")
    .select("slot_id, voter_id")
    .eq("event_id", eventId);

  if (e3) {
    return NextResponse.json({ error: e3.message }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const v of votes ?? []) {
    counts[v.slot_id] = (counts[v.slot_id] ?? 0) + 1;
  }

  // 4) voterId -> display_name 매핑(이름 표시용)
  const { data: voters, error: e4 } = await supabase
    .from("event_voters")
    .select("id, display_name")
    .eq("event_id", eventId);

  if (e4) {
    return NextResponse.json({ error: e4.message }, { status: 500 });
  }

  const voterMap: Record<string, string> = {};
  for (const v of voters ?? []) voterMap[v.id] = v.display_name;

  // 5) 내 투표
  let me: null | { voterId: string; displayName: string; mySlotIds: string[] } =
    null;

  if (voterToken) {
    const { data: voterRow } = await supabase
      .from("event_voters")
      .select("id, display_name")
      .eq("event_id", eventId)
      .eq("voter_token", voterToken)
      .maybeSingle();

    if (voterRow) {
      const myVoterId = voterRow.id as string;
      const mySlotIds = (votes ?? [])
        .filter((v) => v.voter_id === myVoterId)
        .map((v) => v.slot_id);

      me = {
        voterId: myVoterId,
        displayName: voterRow.display_name,
        mySlotIds,
      };
    }
  }

  return NextResponse.json({
    event,
    slots: (slots ?? []) as Slot[],
    counts,
    voterMap,
    me,
  });
}
