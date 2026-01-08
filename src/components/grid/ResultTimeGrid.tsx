"use client";
import React, { useMemo } from "react";
import TimeGridBase, { TimeGridBaseRenderArgs } from "./TimeGridBase";
import { EventMode, Slot } from "@/src/types/vote";
import NamesTooltip from "../NamesTooltip";
import { strengthFromCount } from "@/src/utils/calendarUtils";

type Props = {
  eventMode: EventMode;
  slots: Slot[];
  countsBySlot: Record<string, number>;
  votersBySlot: Record<string, string[]>;
  totalVoters: number;
};

const makeSlotKey = (colKey: string, minute: number) => `${colKey}|${minute}`;

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

export default function ResultTimeGrid({
  eventMode,
  slots,
  countsBySlot,
  votersBySlot,
  totalVoters,
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

  // 4) 셀 스타일
  const getCellStyle = (count: number): React.CSSProperties | undefined => {
    const strength = strengthFromCount(count, totalVoters);
    if (strength <= 0) return undefined;

    return {
      backgroundColor: `color-mix(in srgb, white ${
        (1 - strength) * 100
      }%, var(--primary) ${strength * 100}%)`,
    };
  };

  // 7) 셀 렌더
  const renderCell = ({ colKey, minute }: TimeGridBaseRenderArgs) => {
    const slotKey = makeSlotKey(colKey, minute);
    const slotId = slotIdByKey.get(slotKey);

    // 슬롯이 없으면 빈 셀
    if (!slotId) {
      return (
        <div className="w-full h-full bg-transparent opacity-30 cursor-not-allowed" />
      );
    }

    const count = countsBySlot[slotId] ?? 0;
    const voters = votersBySlot[slotId] ?? [];
    const style = getCellStyle(count);

    return (
      <NamesTooltip
        names={voters}
        headerText={`${count}명 참여`}
        emptyText="아직 없음"
        className="absolute inset-0 flex"
      >
        {({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            className={[
              "w-full h-full",
              "transition-all",
              "hover:brightness-95 active:brightness-90",
              count > 0 ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
            style={style}
          />
        )}
      </NamesTooltip>
    );
  };

  return (
    <div className="touch-none select-none">
      <TimeGridBase
        columns={columns}
        minuteStart={minuteStart}
        minuteEnd={minuteEnd}
        renderCell={renderCell}
        headerMode={eventMode}
      />
    </div>
  );
}
