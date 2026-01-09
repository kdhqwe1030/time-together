"use client";
import React, { useMemo, useRef, useState, useCallback } from "react";
import TimeGridBase, { TimeGridBaseRenderArgs } from "./TimeGridBase";
import { EventMode, Slot } from "@/src/types/vote";
import NameSection from "../NameSection";

type Props = {
  eventMode: EventMode;
  slots: Slot[];
  selected: Set<string>;
  onSelectedChange: (selected: Set<string>) => void;
  // 이름 섹션 props
  name: string;
  isMod: boolean;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameBlur: () => void;
  onChangeMode: () => void;
};

const makeSlotKey = (colKey: string, minute: number) => `${colKey}|${minute}`;

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

export default function VoteTimeGrid({
  eventMode,
  slots,
  selected,
  onSelectedChange,
  name,
  isMod,
  onNameChange,
  onNameBlur,
  onChangeMode,
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
      // WEEKDAYTIME: slots에 실제 존재하는 weekday만 추출
      const weekdaySet = new Set<number>();
      for (const s of slots) {
        if (s.slot_type === "WEEKDAYTIME" && s.weekday != null) {
          weekdaySet.add(s.weekday);
        }
      }

      // 추출한 weekday를 정렬해서 columns 생성
      const weekdays = Array.from(weekdaySet).sort();
      return weekdays.map((w) => ({
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
  const setSlot = useCallback(
    (slotKey: string, makeSelected: boolean) => {
      const n = new Set(selected);
      if (makeSelected) n.add(slotKey);
      else n.delete(slotKey);
      onSelectedChange(n);
    },
    [selected, onSelectedChange]
  );

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

  // window 레벨 pointerMove/pointerUp 이벤트 (드래그 중일 때만)
  React.useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      const el = document.elementFromPoint(
        e.clientX,
        e.clientY
      ) as HTMLElement | null;
      const btn = el?.closest?.("[data-slot-key]") as HTMLElement | null;
      const key = btn?.dataset?.slotKey;
      if (key) {
        const drag = dragRef.current;
        if (drag.lastKey === key) return;
        drag.lastKey = key;
        setSlot(key, drag.mode === "add");
      }
    };

    const onPointerUp = () => {
      dragRef.current.active = false;
      dragRef.current.lastKey = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [setSlot]);

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
          "w-full h-full touch-none",
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
          e.stopPropagation();
          ignoreClickRef.current = true;

          const drag = dragRef.current;
          drag.active = true;
          drag.lastKey = slotKey;
          drag.mode = selectedThis ? "remove" : "add";

          // 즉시 적용
          setSlot(slotKey, drag.mode === "add");
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
    <>
      {/* 이름 입력 카드 */}
      <div className="mb-4">
        <NameSection
          isMod={isMod}
          name={name}
          onChange={onNameChange}
          onBlur={onNameBlur}
          changeMode={onChangeMode}
        />
      </div>

      {/* 시간 선택 */}
      <section className="bg-surface p-4 rounded-2xl shadow shadow-black/10 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-text font-semibold">시간 선택</h1>
          <span className="text-muted text-xs">
            가능한 시간대를 드래그해서 선택하세요 ⏰
          </span>
        </div>
        <div className="select-none">
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
      </section>
    </>
  );
}
