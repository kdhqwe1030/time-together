"use client";

import React, { useMemo, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

const CalendarOne = ({
  selected,
  onSetDate,
  onToggleAllInMonth,
  allowedKeys,
  monthBounds,
}: {
  selected: Set<string>;
  onSetDate: (key: string, makeSelected: boolean) => void;
  onToggleAllInMonth: (month: Date, makeSelected: boolean) => void;
  allowedKeys?: Set<string>;
  monthBounds?: { minMonth: Date; maxMonth: Date } | null;
}) => {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    now.setDate(1);
    return now;
  });

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

  // 이번 달이 “전체 선택” 상태인지 판단
  const monthKeys = useMemo(() => days.map(toKey), [days]);
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

  const applyKey = (key: string) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    if (drag.lastKey === key) return;
    drag.lastKey = key;
    onSetDate(key, drag.mode === "add");
  };

  const endDrag = () => {
    const drag = dragRef.current;
    drag.active = false;
    drag.lastKey = null;
    drag.pointerId = null;

    setTimeout(() => {
      ignoreClickRef.current = false;
    }, 0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    // 모바일 터치 드래그에서 스크롤/줌 방지
    e.preventDefault();

    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;

    const key = el?.dataset?.dateKey;
    if (key) applyKey(key);
  };
  const ignoreClickRef = useRef(false);

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
              className="h-8 w-8 rounded-lg border border-border text-muted flex justify-center items-center  disabled:opacity-40 disabled:cursor-not-allowed"
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
          onClick={() => onToggleAllInMonth(month, !isAllSelectedThisMonth)}
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
          const isAllowed = allowedKeys?.has(key);
          const selectedThis = selected.has(key);
          const dow = d.getDay();
          return (
            <button
              key={key}
              type="button"
              data-date-key={key}
              disabled={!isAllowed}
              onPointerDown={(e) => {
                e.preventDefault();
                ignoreClickRef.current = true;
                const drag = dragRef.current;
                drag.active = true;
                drag.pointerId = e.pointerId;
                drag.lastKey = null;

                // 시작 셀이 선택돼있으면 remove, 아니면 add
                drag.mode = selectedThis ? "remove" : "add";

                // 포인터 캡처
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

                // 시작 셀 즉시 적용
                applyKey(key);
              }}
              onPointerEnter={() => {
                // 마우스 드래그에선 enter가 자연스러움
                applyKey(key);
              }}
              onClick={() => {
                // 포인터로 발생한 클릭이면 무시 (이미 pointerdown에서 처리됨)
                if (ignoreClickRef.current) return;

                // "탭/클릭" 토글
                onSetDate(key, !selectedThis);
              }}
              className={[
                "h-10 mx-auto w-10 rounded-xl text-sm transition",
                !isAllowed
                  ? "text-muted/40 opacity-40 cursor-not-allowed"
                  : selectedThis
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-surface-2",
                dow === 0 || dow === 6
                  ? selectedThis
                    ? ""
                    : "text-error"
                  : selectedThis
                  ? ""
                  : "text-text",
              ].join(" ")}
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

function addMonths(base: Date, delta: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + delta);
  d.setDate(1);
  return d;
}
export function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function getMonthDays(month: Date) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const days: Date[] = [];
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(y, m, i));
  }
  return { first, days };
}
