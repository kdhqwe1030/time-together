import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/src/lib/supabase/supabaseServer";

type Body = {
  voterToken: string;
  displayName: string;
  slotIds: string[];
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ shareCode: string }> }
) {
  const supabase = createSupabaseServer();
  const { shareCode } = await ctx.params;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { voterToken, displayName, slotIds } = body;
  if (!voterToken)
    return NextResponse.json({ error: "voterToken required" }, { status: 400 });
  if (!displayName?.trim())
    return NextResponse.json(
      { error: "displayName required" },
      { status: 400 }
    );
  if (!Array.isArray(slotIds))
    return NextResponse.json({ error: "slotIds required" }, { status: 400 });

  // 1) event id
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("share_code", shareCode)
    .maybeSingle();
  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const eventId = event.id as string;

  // 2) voter upsert
  const { data: voter, error: e2 } = await supabase
    .from("event_voters")
    .upsert(
      {
        event_id: eventId,
        voter_token: voterToken,
        display_name: displayName.trim(),
      },
      { onConflict: "event_id,voter_token" }
    )
    .select("id")
    .single();

  if (e2 || !voter)
    return NextResponse.json(
      { error: e2?.message ?? "voter upsert failed" },
      { status: 500 }
    );
  const voterId = voter.id as string;

  // 3) 내 기존 투표 삭제
  const { error: dErr } = await supabase
    .from("votes")
    .delete()
    .eq("event_id", eventId)
    .eq("voter_id", voterId);

  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

  // 4) 새 투표 insert
  if (slotIds.length > 0) {
    const rows = slotIds.map((slotId) => ({
      event_id: eventId,
      voter_id: voterId,
      slot_id: slotId,
    }));
    const { error: iErr } = await supabase.from("votes").insert(rows);
    if (iErr)
      return NextResponse.json({ error: iErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
