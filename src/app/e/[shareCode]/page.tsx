export const dynamic = "force-dynamic";
export const revalidate = 0;

import OneDateVote from "@/src/components/page/OneDateVote";
import TimeVote from "@/src/components/page/TimeVote";
import { createSupabaseServer } from "@/src/lib/supabase/supabaseServer";

type EventRow = {
  id: string;
  share_code: string;
  title: string;
  mode: "ONE_DATE" | "ONE_DATETIME" | "REC_WEEKDAYTIME";
  min_time_min: number | null;
  max_time_min: number | null;
  expires_at: string;
};

type Slot = {
  id: string;
  slot_type: "DATE" | "DATETIME" | "WEEKDAYTIME";
  date: string | null;
  weekday: number | null;
  start_min: number | null;
};

export type VoteInitialData = {
  event: EventRow;
  slots: Slot[];
  counts: Record<string, number>;
};

async function getInitialData(
  shareCode: string
): Promise<VoteInitialData | null> {
  const supabase = createSupabaseServer();

  // 1) event
  const { data: event, error: e1 } = await supabase
    .from("events")
    .select(
      "id, share_code, title, mode, min_time_min, max_time_min, expires_at"
    )
    .eq("share_code", shareCode)
    .maybeSingle();

  if (e1 || !event) return null;

  const eventId = event.id as string;

  // 2) slots
  const { data: slots, error: e2 } = await supabase
    .from("event_slots")
    .select("id, slot_type, date, weekday, start_min")
    .eq("event_id", eventId);

  if (e2) throw new Error(e2.message);

  // 3) counts (집계)
  const { data: votes, error: e3 } = await supabase
    .from("votes")
    .select("slot_id")
    .eq("event_id", eventId);

  if (e3) throw new Error(e3.message);

  const counts: Record<string, number> = {};
  for (const v of votes ?? []) {
    counts[v.slot_id] = (counts[v.slot_id] ?? 0) + 1;
  }

  return {
    event: event as EventRow,
    slots: (slots ?? []) as Slot[],
    counts,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}) {
  const { shareCode } = await params;

  const initial = await getInitialData(shareCode);

  if (!initial) {
    return (
      <div className="p-6 text-muted">
        존재하지 않는 모임이거나 만료되었어요.
      </div>
    );
  }

  return initial.event.mode === "ONE_DATE" ? (
    <OneDateVote shareCode={shareCode} initial={initial} />
  ) : (
    <TimeVote shareCode={shareCode} initial={initial} />
  );
}
