"use client";

import React, { useMemo, useRef } from "react";

type Dow = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const WEEK: { key: Dow; label: string }[] = [
  { key: 0, label: "일" },
  { key: 1, label: "월" },
  { key: 2, label: "화" },
  { key: 3, label: "수" },
  { key: 4, label: "목" },
  { key: 5, label: "금" },
  { key: 6, label: "토" },
];

interface CalendarRecurringProps {
  selectedDays: Set<Dow>;
  onSetDay: (day: Dow, makeSelected: boolean) => void;
}

const CalendarRecurring = ({
  selectedDays,
  onSetDay,
}: CalendarRecurringProps) => {
  const isAllSelected = useMemo(
    () => WEEK.every(({ key }) => selectedDays.has(key)),
    [selectedDays]
  );

  const dragRef = useRef<{
    active: boolean;
    mode: "add" | "remove";
    lastKey: string | null;
    pointerId: number | null;
  }>({ active: false, mode: "add", lastKey: null, pointerId: null });

  const ignoreClickRef = useRef(false);

  const applyKey = (keyStr: string) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    if (drag.lastKey === keyStr) return;
    drag.lastKey = keyStr;

    const day = Number(keyStr) as Dow;
    onSetDay(day, drag.mode === "add");
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

    e.preventDefault();

    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;

    const key = el?.dataset?.dayKey;
    if (key) applyKey(key);
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface-1 p-4 mb-12">
      {/* 헤더 (전체 선택) */}
      <div className="flex items-center justify-between mb-6">
        <div className="font-semibold text-text">요일 선택</div>

        <button
          type="button"
          onClick={() => {
            for (const { key } of WEEK) onSetDay(key, !isAllSelected);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isAllSelected
              ? "bg-primary text-primary-foreground hover:bg-primary-hover"
              : "bg-surface border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          {isAllSelected ? "전체 해제" : "전체 선택"}
        </button>
      </div>

      {/* 요일 버튼들 */}
      <div
        className="grid grid-cols-7 gap-2 text-center touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        {WEEK.map(({ key, label }) => {
          const selectedThis = selectedDays.has(key);

          return (
            <button
              key={key}
              type="button"
              data-day-key={String(key)}
              onPointerDown={(e) => {
                e.preventDefault();
                ignoreClickRef.current = true;

                const drag = dragRef.current;
                drag.active = true;
                drag.pointerId = e.pointerId;
                drag.lastKey = null;

                // 시작 셀이 선택돼있으면 remove, 아니면 add
                drag.mode = selectedThis ? "remove" : "add";

                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

                applyKey(String(key));
              }}
              onPointerEnter={() => {
                applyKey(String(key));
              }}
              onClick={() => {
                // 포인터로 발생한 클릭이면 무시 (pointerdown에서 처리됨)
                if (ignoreClickRef.current) return;

                onSetDay(key, !selectedThis);
              }}
              className={[
                "h-10 w-full rounded-xl text-sm font-medium transition border",
                selectedThis
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-border hover:bg-surface-2",
                key === 0
                  ? selectedThis
                    ? ""
                    : "text-red-500"
                  : key === 6
                  ? selectedThis
                    ? ""
                    : "text-blue-500"
                  : selectedThis
                  ? ""
                  : "text-text",
              ].join(" ")}
              aria-pressed={selectedThis}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarRecurring;
