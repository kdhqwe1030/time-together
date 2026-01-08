"use client";
import React, { useMemo, useRef, useState } from "react";
import TimeGridBase, { TimeGridBaseRenderArgs } from "./TimeGridBase";
import { EventMode, Slot } from "@/src/types/vote";

type Props = {
  eventMode: EventMode;
  slots: Slot[];
  selected: Set<string>;
  onSelectedChange: (selected: Set<string>) => void;
};

const makeSlotKey = (colKey: string, minute: number) => `${colKey}|${minute}`;

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

export default function VoteTimeGrid({
  eventMode,
  slots,
  selected,
  onSelectedChange,
}: Props) {
  // eventMode에 따라 동작 분기
  const isWeekdayMode = eventMode === "REC_WEEKDAYTIME";

  // 1) slotKey -> slotId
  const slotIdByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of slots) {
      if (s.start_min == null) continue;

      if (isWeekdayMode) {
        // WEEKDAYTIME: weekday 기반
        if (s.slot_type !== "WEEKDAYTIME") continue;
        if (s.weekday == null) continue;
        m.set(makeSlotKey(String(s.weekday), s.start_min), s.id);
      } else {
        // DATETIME: date 기반
        if (s.slot_type !== "DATETIME") continue;
        if (!s.date) continue;
        m.set(makeSlotKey(s.date, s.start_min), s.id);
      }
    }
    return m;
  }, [slots, isWeekdayMode]);

  // 2) minuteStart / minuteEnd 계산
  const { minuteStart, minuteEnd } = useMemo(() => {
    const targetType = isWeekdayMode ? "WEEKDAYTIME" : "DATETIME";
    const mins = slots
      .filter((s) => s.slot_type === targetType && s.start_min != null)
      .map((s) => s.start_min!);

    if (mins.length === 0) return { minuteStart: 0, minuteEnd: 1440 };

    const min = Math.min(...mins);
    const max = Math.max(...mins);
    return { minuteStart: min, minuteEnd: max + 15 };
  }, [slots, isWeekdayMode]);

  // 3) columns 생성
  const columns = useMemo(() => {
    if (isWeekdayMode) {
      // WEEKDAYTIME: 0~6 요일
      return Array.from({ length: 7 }, (_, w) => ({
        key: String(w),
        hdate: "",
        hday: WEEKDAY_LABEL[w] ?? String(w),
      }));
    } else {
      // DATETIME: unique한 날짜들 추출
      const dateSet = new Set<string>();
      for (const s of slots) {
        if (s.slot_type === "DATETIME" && s.date) {
          dateSet.add(s.date);
        }
      }
      const dates = Array.from(dateSet).sort();

      return dates.map((dateStr) => {
        // "2026-01-08" -> Date 객체
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekday = d.getDay(); // 0=일, 1=월...

        return {
          key: dateStr, // "2026-01-08"
          hdate: `${month}/${day}`,
          hday: WEEKDAY_LABEL[weekday] ?? String(weekday),
        };
      });
    }
  }, [slots, isWeekdayMode]);

  // ===== 선택 상태는 부모(TimeVote)에서 관리 =====
  const setSlot = (slotKey: string, makeSelected: boolean) => {
    const n = new Set(selected);
    if (makeSelected) n.add(slotKey);
    else n.delete(slotKey);
    onSelectedChange(n);
  };

  // (드래그 로직 그대로)
  const dragRef = useRef<{
    active: boolean;
    mode: "add" | "remove";
    lastKey: string | null;
  }>({
    active: false,
    mode: "add",
    lastKey: null,
  });
  const ignoreClickRef = useRef(false);

  const applyKey = (slotKey: string) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    if (drag.lastKey === slotKey) return;
    drag.lastKey = slotKey;
    setSlot(slotKey, drag.mode === "add");
  };

  const endDrag = () => {
    dragRef.current.active = false;
    dragRef.current.lastKey = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    e.preventDefault();
    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;
    const btn = el?.closest?.("[data-slot-key]") as HTMLElement | null;
    const key = btn?.dataset?.slotKey;
    if (key) applyKey(key);
  };

  // 선택된 개수 표시용
  const selectedCount = useMemo(() => {
    return Array.from(selected)
      .map((k) => slotIdByKey.get(k))
      .filter((v): v is string => !!v).length;
  }, [selected, slotIdByKey]);

  // 셀 렌더
  const renderCell = ({ colKey, minute }: TimeGridBaseRenderArgs) => {
    const slotKey = makeSlotKey(colKey, minute);
    const slotId = slotIdByKey.get(slotKey);
    const selectedThis = selected.has(slotKey);

    // 서버 슬롯이 없는 셀은 비활성(안 만들었으면 null일 수 있음)
    const disabled = !slotId;

    return (
      <button
        type="button"
        data-slot-key={slotKey}
        disabled={disabled}
        className={[
          "w-full h-full",
          disabled
            ? "bg-transparent"
            : selectedThis
            ? "bg-primary/70"
            : "bg-transparent hover:bg-surface-2",
          disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer",
        ].join(" ")}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          ignoreClickRef.current = true;

          const drag = dragRef.current;
          drag.active = true;
          drag.lastKey = null;
          drag.mode = selectedThis ? "remove" : "add";

          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          applyKey(slotKey);
        }}
        onClick={() => {
          if (disabled) return;
          if (ignoreClickRef.current) {
            ignoreClickRef.current = false;
            return;
          }
          setSlot(slotKey, !selectedThis);
        }}
      />
    );
  };

  return (
    <div
      className="touch-none select-none"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <TimeGridBase
        columns={columns}
        minuteStart={minuteStart}
        minuteEnd={minuteEnd}
        renderCell={renderCell}
        headerMode={eventMode}
      />

      {/* 디버그/확인용 */}
      <div className="mt-2 text-xs text-muted text-right">
        선택: {selectedCount}칸
      </div>
    </div>
  );
}
