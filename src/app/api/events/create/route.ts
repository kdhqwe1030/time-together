import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/src/lib/supabase/supabaseServer";

type Mode = "ONE_DATE" | "ONE_DATETIME" | "REC_WEEKDAY" | "REC_WEEKDAYTIME";
type TimeValue = `${string}:${string}`;

function toMinutes(t: TimeValue) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function assert15Min(tMin: number) {
  return tMin % 15 === 0 && tMin >= 0 && tMin <= 1440;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    mode,
    dates = [],
    weekdays = [],
    minTime,
    maxTime,
  }: {
    title: string;
    mode: Mode;
    dates?: string[];
    weekdays?: number[];
    minTime?: TimeValue;
    maxTime?: TimeValue;
  } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  // mode별 입력 검증
  const needDates = mode === "ONE_DATE" || mode === "ONE_DATETIME";
  const needWeekdays = mode === "REC_WEEKDAY" || mode === "REC_WEEKDAYTIME";
  const needTime = mode === "ONE_DATETIME" || mode === "REC_WEEKDAYTIME";

  if (needDates && (!Array.isArray(dates) || dates.length === 0)) {
    return NextResponse.json({ error: "dates is required" }, { status: 400 });
  }
  if (needWeekdays && (!Array.isArray(weekdays) || weekdays.length === 0)) {
    return NextResponse.json(
      { error: "weekdays is required" },
      { status: 400 }
    );
  }
  if (needTime && (!minTime || !maxTime)) {
    return NextResponse.json(
      { error: "minTime/maxTime is required for this mode" },
      { status: 400 }
    );
  }

  let min_time_min: number | null = null;
  let max_time_min: number | null = null;

  if (needTime) {
    min_time_min = toMinutes(minTime as TimeValue);
    max_time_min = toMinutes(maxTime as TimeValue);

    if (!assert15Min(min_time_min) || !assert15Min(max_time_min)) {
      return NextResponse.json(
        {
          error:
            "minTime/maxTime must be 15-min aligned and between 00:00~24:00",
        },
        { status: 400 }
      );
    }
    if (max_time_min <= min_time_min) {
      return NextResponse.json(
        { error: "maxTime must be greater than minTime" },
        { status: 400 }
      );
    }
  }

  // 1) events 생성 (share_code는 DB default)
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .insert({
      title,
      mode,
      min_time_min,
      max_time_min,
      // expires_at은 default(now + 30 days) 사용
    })
    .select("id, share_code, mode, min_time_min, max_time_min, expires_at")
    .single();

  if (eventErr || !eventRow) {
    return NextResponse.json(
      { error: eventErr?.message ?? "Failed to create event" },
      { status: 500 }
    );
  }

  const eventId = eventRow.id as string;

  // 이후 단계 실패 시 롤백(삭제)할 수 있게 준비
  const rollback = async (reason: string) => {
    await supabase.from("events").delete().eq("id", eventId);
    return NextResponse.json({ error: reason }, { status: 500 });
  };

  // 2) 후보 저장 (dates/weekdays)
  if (needDates) {
    const rows = (dates as string[]).map((d) => ({
      event_id: eventId,
      date: d,
    }));
    const { error } = await supabase.from("event_dates").insert(rows);
    if (error)
      return rollback(`Failed to insert event_dates: ${error.message}`);
  }

  if (needWeekdays) {
    const rows = (weekdays as number[]).map((w) => ({
      event_id: eventId,
      weekday: w,
    }));
    const { error } = await supabase.from("event_weekdays").insert(rows);
    if (error)
      return rollback(`Failed to insert event_weekdays: ${error.message}`);
  }

  // 3) 슬롯 생성 (색칠 단위)
  const slots: any[] = [];

  if (mode === "ONE_DATE") {
    for (const d of dates) {
      slots.push({
        event_id: eventId,
        slot_type: "DATE",
        date: d,
      });
    }
  }

  if (mode === "ONE_DATETIME") {
    const start = min_time_min!;
    const end = max_time_min!;
    for (const d of dates) {
      for (let t = start; t < end; t += 15) {
        slots.push({
          event_id: eventId,
          slot_type: "DATETIME",
          date: d,
          start_min: t,
        });
      }
    }
  }

  if (mode === "REC_WEEKDAY") {
    for (const w of weekdays) {
      slots.push({
        event_id: eventId,
        slot_type: "WEEKDAY",
        weekday: w,
      });
    }
  }

  if (mode === "REC_WEEKDAYTIME") {
    const start = min_time_min!;
    const end = max_time_min!;
    for (const w of weekdays) {
      for (let t = start; t < end; t += 15) {
        slots.push({
          event_id: eventId,
          slot_type: "WEEKDAYTIME",
          weekday: w,
          start_min: t,
        });
      }
    }
  }

  // 슬롯이 너무 많아질 수 있으니(예: 날짜 많고 시간 범위 길면)
  // 일단 안전하게 chunk insert
  const CHUNK = 1000;
  for (let i = 0; i < slots.length; i += CHUNK) {
    const chunk = slots.slice(i, i + CHUNK);
    const { error } = await supabase.from("event_slots").insert(chunk);
    if (error)
      return rollback(`Failed to insert event_slots: ${error.message}`);
  }

  return NextResponse.json({
    ok: true,
    event: eventRow,
    // 링크용
    shareCode: eventRow.share_code,
    eventId,
    slotsCreated: slots.length,
  });
}
