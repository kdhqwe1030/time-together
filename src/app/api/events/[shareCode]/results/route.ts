import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/src/lib/supabase/supabaseServer";

type ResultResponse = {
  ok: true;
  eventId: string;
  totalVoters: number; // 참여자 수(=event_voters 수)
  countsBySlot: Record<string, number>; // slotId -> count
  votersBySlot: Record<string, string[]>; // slotId -> ["도현", "철수"...]
  heatByDateKey: Record<string, number>; // "YYYY-MM-DD" -> count (DATE 모드에서 달력 칠하기용)
  votersByDateKey: Record<string, string[]>;
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ shareCode: string }> }
) {
  const supabase = createSupabaseServer();
  const { shareCode } = await ctx.params;

  // 1) event
  const { data: event, error: e1 } = await supabase
    .from("events")
    .select("id, mode")
    .eq("share_code", shareCode)
    .maybeSingle();

  if (e1 || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const eventId = event.id as string;

  // 2) slots (DATE 모드면 dateKey 매핑 필요)
  const { data: slots, error: e2 } = await supabase
    .from("event_slots")
    .select("id, slot_type, date")
    .eq("event_id", eventId);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const slotIdToDateKey = new Map<string, string>();
  for (const s of slots ?? []) {
    if (s.slot_type === "DATE" && s.date) {
      slotIdToDateKey.set(s.id as string, s.date as string);
    }
  }

  // 3) voters map (voter_id -> display_name)
  const { data: voters, error: e3 } = await supabase
    .from("event_voters")
    .select("id, display_name")
    .eq("event_id", eventId);

  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

  const voterNameById: Record<string, string> = {};
  for (const v of voters ?? []) voterNameById[v.id as string] = v.display_name;

  const totalVoters = (voters ?? []).length;

  // 4) votes
  const { data: votes, error: e4 } = await supabase
    .from("votes")
    .select("slot_id, voter_id")
    .eq("event_id", eventId);

  if (e4) return NextResponse.json({ error: e4.message }, { status: 500 });

  const countsBySlot: Record<string, number> = {};
  const votersBySlot: Record<string, string[]> = {};
  const heatByDateKey: Record<string, number> = {};
  const votersByDateKey: Record<string, string[]> = {};

  for (const v of votes ?? []) {
    const slotId = v.slot_id as string;
    const voterId = v.voter_id as string;
    const name = voterNameById[voterId] ?? "익명";

    countsBySlot[slotId] = (countsBySlot[slotId] ?? 0) + 1;

    if (!votersBySlot[slotId]) votersBySlot[slotId] = [];
    votersBySlot[slotId].push(name);

    const dateKey = slotIdToDateKey.get(slotId);
    if (dateKey) {
      heatByDateKey[dateKey] = (heatByDateKey[dateKey] ?? 0) + 1;

      // ✅ 추가: 날짜별 참여자 리스트
      if (!votersByDateKey[dateKey]) votersByDateKey[dateKey] = [];
      votersByDateKey[dateKey].push(name);
    }
  }

  const res: ResultResponse = {
    ok: true,
    eventId,
    totalVoters,
    countsBySlot,
    votersBySlot,
    heatByDateKey,
    votersByDateKey,
  };

  return NextResponse.json(res);
}
