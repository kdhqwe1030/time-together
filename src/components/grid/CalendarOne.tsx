"use client";

import { addMonths, getMonthDays, toKey } from "@/src/utils/calendarUtils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

const CalendarOne = ({
  selected,
  onSetDate,
  allowedKeys,
  monthBounds,
  disablePast = false,
}: {
  selected: Set<string>;
  onSetDate: (key: string, makeSelected: boolean) => void;
  allowedKeys?: Set<string>;
  monthBounds?: { minMonth: Date; maxMonth: Date } | null;
  disablePast?: boolean;
}) => {
  const [month, setMonth] = useState(() => {
    // monthBounds가 있으면 선택 가능한 첫 달로 시작
    if (monthBounds) {
      return new Date(monthBounds.minMonth);
    }
    // 없으면 오늘 날짜 기준
    const now = new Date();
    now.setDate(1);
    return now;
  });

  // monthBounds가 변경되면 첫 달로 이동
  useEffect(() => {
    if (monthBounds) {
      setMonth(new Date(monthBounds.minMonth));
    }
  }, [monthBounds]);

  const { first, days } = useMemo(() => getMonthDays(month), [month]);

  // 달력 그리드: 일요일=0 ~ 토요일=6
  const leadingBlanks = first.getDay();
  const cells: Array<Date | null> = useMemo(() => {
    const arr: Array<Date | null> = [];
    for (let i = 0; i < leadingBlanks; i++) arr.push(null);
    days.forEach((d) => arr.push(d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [leadingBlanks, days]);

  // 오늘(로컬) key
  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // 이 함수 하나로 allowedKeys / disablePast 모두 통일 처리
  const isAllowedKey = (key: string) => {
    if (allowedKeys && !allowedKeys.has(key)) return false;
    if (disablePast && key < todayKey) return false; // YYYY-MM-DD는 문자열 비교 OK
    return true;
  };

  // 이번 달 “전체 선택” 상태인지 판단 (선택 가능한 날짜만 기준)
  const monthKeys = useMemo(() => {
    const keys = days.map(toKey);
    return keys.filter(isAllowedKey);
  }, [days, allowedKeys, disablePast, todayKey]);

  const isAllSelectedThisMonth = useMemo(() => {
    if (monthKeys.length === 0) return false;
    return monthKeys.every((k) => selected.has(k));
  }, [monthKeys, selected]);

  const monthTitle = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth() + 1;
    return `${y}년 ${m}월`;
  }, [month]);

  const week = ["일", "월", "화", "수", "목", "금", "토"];

  // 드래그 상태
  const dragRef = useRef<{
    active: boolean;
    mode: "add" | "remove";
    lastKey: string | null;
    pointerId: number | null;
  }>({ active: false, mode: "add", lastKey: null, pointerId: null });

  const ignoreClickRef = useRef(false);

  const applyKey = (key: string) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    if (drag.lastKey === key) return;
    if (!isAllowedKey(key)) return;

    drag.lastKey = key;
    onSetDate(key, drag.mode === "add");
  };

  const endDrag = () => {
    const drag = dragRef.current;
    drag.active = false;
    drag.lastKey = null;
    drag.pointerId = null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    e.preventDefault();

    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;
    const key = el?.dataset?.dateKey;
    if (key) applyKey(key);
  };

  const handlePointerUp = () => endDrag();
  const handlePointerCancel = () => endDrag();
  const handlePointerLeave = () => endDrag();

  const canPrev = useMemo(() => {
    if (!monthBounds) return true;
    const prev = addMonths(month, -1);
    return prev >= monthBounds.minMonth;
  }, [month, monthBounds]);

  const canNext = useMemo(() => {
    if (!monthBounds) return true;
    const next = addMonths(month, 1);
    return next <= monthBounds.maxMonth;
  }, [month, monthBounds]);

  return (
    <div className="bg-surface p-4 rounded-2xl bg-surface-1">
      {/* 헤더 (월 이동 + 전체 선택) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {canPrev && (
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="h-8 w-8 rounded-lg border border-border text-muted flex justify-center items-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="이전 달"
              disabled={!canPrev}
            >
              <IoIosArrowBack />
            </button>
          )}

          <div className="font-semibold text-text">{monthTitle}</div>

          {canNext && (
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="h-8 w-8 rounded-lg border border-border text-muted flex justify-center items-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="다음 달"
              disabled={!canNext}
            >
              <IoIosArrowForward />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const makeSelected = !isAllSelectedThisMonth;
            for (const k of monthKeys) onSetDate(k, makeSelected);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isAllSelectedThisMonth
              ? "bg-primary text-primary-foreground hover:bg-primary-hover"
              : "bg-surface border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          {isAllSelectedThisMonth ? "전체 해제" : "전체 선택"}
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 text-center text-xs font-medium mb-2">
        {week.map((w, idx) => (
          <div
            key={w}
            className={[
              "py-2",
              idx === 0
                ? "text-red-500"
                : idx === 6
                ? "text-blue-500"
                : "text-muted",
            ].join(" ")}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div
        className="grid grid-cols-7 gap-y-1 text-center touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={`blank-${i}`} className="h-10" />;

          const key = toKey(d);
          const isAllowed = isAllowedKey(key);
          const selectedThis = selected.has(key);

          const base = "h-10 mx-auto w-10 rounded-xl text-sm transition";
          const disabledCls = "text-muted/40 opacity-40 cursor-not-allowed";
          const selectedCls = "bg-primary text-primary-foreground";
          const normalCls = "hover:bg-surface-2 text-text";

          const cls = [
            base,
            !isAllowed ? disabledCls : selectedThis ? selectedCls : normalCls,
          ].join(" ");

          return (
            <button
              key={key}
              type="button"
              data-date-key={key}
              disabled={!isAllowed}
              onPointerDown={(e) => {
                if (!isAllowed) return;

                e.preventDefault();
                ignoreClickRef.current = true;

                const drag = dragRef.current;
                drag.active = true;
                drag.pointerId = e.pointerId;
                drag.lastKey = null;

                drag.mode = selectedThis ? "remove" : "add";
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

                applyKey(key);
              }}
              onPointerEnter={() => {
                // 마우스 드래그
                applyKey(key);
              }}
              onClick={() => {
                if (!isAllowed) return;
                if (ignoreClickRef.current) {
                  ignoreClickRef.current = false;
                  return;
                }

                onSetDate(key, !selectedThis);
              }}
              className={cls}
              aria-pressed={selectedThis}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarOne;
