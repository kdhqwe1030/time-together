"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import {
  addMonths,
  buildHeatBuckets,
  getLegendSwatchStyle,
  getMonthDays,
  strengthFromCount,
  toKey,
} from "@/src/utils/calendarUtils";
import NamesTooltip from "../NamesTooltip";

type Props = {
  allowedKeys?: Set<string>;
  monthBounds?: { minMonth: Date; maxMonth: Date } | null;

  totalVoters: number; // event_voters 수
  heatByDateKey: Record<string, number>; // "YYYY-MM-DD" -> count
  votersByDateKey: Record<string, string[]>; // 추가: "YYYY-MM-DD" -> ["qwer", ...]
};

const ResultCalendarOne = ({
  allowedKeys,
  monthBounds,
  totalVoters,
  heatByDateKey,
  votersByDateKey,
}: Props) => {
  const heat = heatByDateKey ?? {};
  const denom = Math.max(totalVoters ?? 0, 1);

  const [month, setMonth] = useState(() => {
    if (monthBounds?.minMonth) return new Date(monthBounds.minMonth);
    const now = new Date();
    now.setDate(1);
    return now;
  });

  // monthBounds가 나중에 도착할 수도 있으니 한번 동기화(선택)
  useEffect(() => {
    if (!monthBounds?.minMonth) return;
    setMonth(new Date(monthBounds.minMonth));
  }, [monthBounds?.minMonth?.getTime()]);

  const { first, days } = useMemo(() => getMonthDays(month), [month]);
  const buckets = useMemo(() => buildHeatBuckets(totalVoters), [totalVoters]);

  const monthTitle = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth() + 1;
    return `${y}년 ${m}월`;
  }, [month]);

  const week = ["일", "월", "화", "수", "목", "금", "토"];

  const leadingBlanks = first.getDay();
  const cells: Array<Date | null> = useMemo(() => {
    const arr: Array<Date | null> = [];
    for (let i = 0; i < leadingBlanks; i++) arr.push(null);
    days.forEach((d) => arr.push(d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [leadingBlanks, days]);

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

  const [open, setOpen] = useState<null | {
    dateKey: string;
    anchor: HTMLElement;
  }>(null);

  const getCellStyleByCount = (
    count: number
  ): React.CSSProperties | undefined => {
    const strength = strengthFromCount(count, totalVoters);
    if (strength <= 0) return undefined;

    return {
      backgroundColor: `color-mix(in srgb, white ${
        (1 - strength) * 100
      }%, var(--primary) ${strength * 100}%)`,
      borderColor: `color-mix(in srgb, var(--border) 40%, var(--primary) 60%)`,
    };
  };

  const getTextClassByCount = (count: number) => {
    const strength = strengthFromCount(count, totalVoters);
    return strength >= 0.55 ? "text-white" : "text-text";
  };

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <>
      <section className="bg-surface p-4 rounded-2xl shadow shadow-black/10 mb-4 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-text font-medium text-sm">참여 현황</h1>

          {/* 범례 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {buckets.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 text-xs text-muted"
              >
                <span
                  className="h-3 w-3 rounded-sm border border-border"
                  style={
                    b.strength <= 0
                      ? undefined
                      : getLegendSwatchStyle(b.strength)
                  }
                />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="mt-2 bg-surface p-4 rounded-2xl shadow shadow-black/10">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-text font-semibold">전체 현황</h1>
          <span className="text-muted text-xs">
            날짜를 탭하면 가능한 사람 목록을 볼 수 있어요
          </span>
        </div>
        <section className="bg-surface p-4 rounded-2xl animate-fade-in">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {canPrev && (
                <button
                  type="button"
                  onClick={() => canPrev && setMonth((m) => addMonths(m, -1))}
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
                  onClick={() => canNext && setMonth((m) => addMonths(m, 1))}
                  className="h-8 w-8 rounded-lg border border-border text-muted flex justify-center items-center disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="다음 달"
                  disabled={!canNext}
                >
                  <IoIosArrowForward />
                </button>
              )}
            </div>
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
          <div className="grid grid-cols-7 gap-y-1 text-center touch-none select-none">
            {cells.map((d, i) => {
              if (!d) return <div key={`blank-${i}`} className="h-10" />;

              const key = toKey(d);
              const isAllowed = allowedKeys ? allowedKeys.has(key) : true;
              const count = isAllowed ? heat[key] ?? 0 : 0;
              const style = isAllowed ? getCellStyleByCount(count) : undefined;
              const names = isAllowed ? votersByDateKey?.[key] ?? [] : [];
              return (
                <div
                  ref={wrapRef}
                  key={key}
                  className="relative h-10 flex justify-center"
                >
                  <NamesTooltip
                    names={names}
                    headerText={`${names.length}명 참여`}
                    emptyText="아직 없음"
                  >
                    {({ toggle }) => (
                      <button
                        key={key}
                        type="button"
                        disabled={!isAllowed}
                        onClick={() => {
                          if (!isAllowed) return;
                          toggle();
                        }}
                        className={[
                          "h-10 mx-auto w-10 rounded-xl transition border",
                          "flex flex-col items-center justify-center",
                          isAllowed
                            ? `${getTextClassByCount(
                                count
                              )} border-border hover:scale-[1.02] active:scale-[0.98]`
                            : "text-muted/40 opacity-40 cursor-not-allowed border-border",
                        ].join(" ")}
                        style={style}
                        title={isAllowed ? `${count}명` : undefined}
                      >
                        <span className="text-sm leading-none">
                          {d.getDate()}
                        </span>
                        <span
                          className={[
                            "mt-0.5 text-[10px] leading-none",
                            getTextClassByCount(count) === "text-white"
                              ? "text-white/90"
                              : "text-muted",
                          ].join(" ")}
                        >
                          {count}/{totalVoters}
                        </span>
                      </button>
                    )}
                  </NamesTooltip>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
};

export default ResultCalendarOne;
