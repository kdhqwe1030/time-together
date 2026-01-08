"use client";

import { EventMode } from "@/src/types/vote";
import React, { useMemo } from "react";

type HeaderMode = "REC_WEEKDAYTIME" | "ONE_DATETIME";

export type TimeGridColumn = {
  key: string; // "2026-01-21" 또는 "월"
  hdate: string; // "1/21"
  hday: string; // "수"
};

export type TimeGridBaseRenderArgs = {
  colKey: string;
  minute: number;
  colIndex: number;
  rowIndex: number;
};

export type TimeGridBaseProps = {
  columns: TimeGridColumn[];
  minuteStart: number;
  minuteEnd: number;
  renderCell: (args: TimeGridBaseRenderArgs) => React.ReactNode;
  headerMode: EventMode;
};

function fmtTime(minute: number) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TimeGridBase({
  columns,
  minuteStart,
  minuteEnd,
  renderCell,
  headerMode,
}: TimeGridBaseProps) {
  const step = 15;
  const rowHeightPx = 18;
  const minutes = useMemo(() => {
    const arr: number[] = [];
    for (let m = minuteStart; m < minuteEnd; m += step) arr.push(m);
    return arr;
  }, [minuteStart, minuteEnd, step]);

  const colCount = columns.length;

  // CSS grid template
  const gridTemplate = `40px repeat(${colCount},70px)`; // 왼쪽 시간 크기, repeat(개수, 열 가로 크기)

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* ===== Header ===== */}
          <div
            className="sticky top-0 z-30 bg-surface"
            style={{ paddingTop: 8, paddingBottom: 8 }}
          >
            <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
              {/* 시간축 자리 비워두기 */}
              <div />

              {columns.map((c) => {
                const dayColor =
                  c.hday === "토"
                    ? "text-blue-500"
                    : c.hday === "일"
                    ? "text-red-500"
                    : "text-muted";

                return (
                  <div key={c.key} className="text-center">
                    {headerMode === "REC_WEEKDAYTIME" ? (
                      <span
                        className={[
                          "text-sm font-semibold leading-none",
                          dayColor,
                        ].join(" ")}
                      >
                        {c.hday}요일
                      </span>
                    ) : (
                      <>
                        <span className="block text-sm font-semibold text-text leading-none">
                          {c.hdate}
                        </span>
                        <span
                          className={[
                            "block mt-1 text-xs leading-none",
                            dayColor,
                          ].join(" ")}
                        >
                          ({c.hday})
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== Body ===== */}
          <div
            className="grid mt-1 mb-4"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {/* 시간축 컬럼 */}
            <div className="border-r border-border sticky left-0 z-20 bg-surface">
              {minutes.map((m, rowIndex) => {
                const mod = m % 60;
                const isHour = mod === 0;
                const lastRow = rowIndex === minutes.length - 1;

                return (
                  <div
                    key={m}
                    className="relative text-xs text-muted"
                    style={{ height: rowHeightPx }}
                  >
                    {isHour && (
                      <div className="absolute top-1 right-1.5 -translate-y-1/2">
                        {fmtTime(m)}
                      </div>
                    )}
                    {lastRow && (
                      <div className="absolute bottom-0 right-2 translate-y-1/2">
                        {fmtTime(m + step)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 각 날짜별 컬럼 (하나의 큰 컨테이너) */}
            {columns.map((c, colIndex) => (
              <div
                key={c.key}
                className="border-r border-b border-border relative "
              >
                {minutes.map((m, rowIndex) => {
                  const mod = m % 60;
                  const isHour = mod === 0;
                  const isHalf = mod === 30;

                  // 1시간: 실선 / 30분: 점선 / 15분: 선 없음
                  const lineClass = isHour
                    ? "border-t border-border"
                    : isHalf
                    ? "border-t border-dashed border-border/50"
                    : "";

                  return (
                    <div
                      key={m}
                      className={["relative", "border-0", lineClass].join(" ")} // (가능)
                      style={{ height: rowHeightPx }}
                    >
                      {renderCell({
                        colKey: c.key,
                        minute: m,
                        colIndex,
                        rowIndex,
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
