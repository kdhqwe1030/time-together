"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";

export type TimeValue = `${string}:${string}`; // "HH:MM"

interface TimeSelectItemProps {
  label: string; // 예: "시작 시간"
  value: TimeValue | null;
  onChange: (v: TimeValue) => void;

  // 옵션
  stepMinutes?: 5 | 10 | 15 | 30 | 60;
  min?: TimeValue; // 예: "09:00"
  max?: TimeValue; // 예: "18:00"
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toMinutes(v: TimeValue) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): TimeValue {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad2(h)}:${pad2(m)}` as TimeValue;
}

function makeTimeOptions({
  stepMinutes,
  min,
  max,
}: {
  stepMinutes: number;
  min: TimeValue;
  max: TimeValue;
}) {
  const start = toMinutes(min);
  const end = toMinutes(max);
  const out: TimeValue[] = [];

  for (let t = start; t <= end; t += stepMinutes) {
    out.push(fromMinutes(t));
  }
  return out;
}

// 표시용 (원하면 12시간제로 바꿔도 됨)
function formatKo(v: TimeValue) {
  const [hh, mm] = v.split(":").map(Number);
  const ap = hh < 12 ? "오전" : "오후";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${ap} ${h12}:${pad2(mm)}`;
}

export default function TimeSelectItem({
  label,
  value,
  onChange,
  stepMinutes = 30,
  min = "00:00",
  max = "23:30",
}: TimeSelectItemProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(
    () => makeTimeOptions({ stepMinutes, min, max }),
    [stepMinutes, min, max]
  );

  const selectedLabel = value ? formatKo(value) : "";

  // ESC 닫기 + 스크롤 잠금(모바일 시트)
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "w-full p-4 text-left bg-surface border border-border rounded-lg",
          "hover:border-primary hover:bg-bg active:border-primary active:bg-bg transition-all mb-4",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <div className="mt-1 text-sm">
            <span className={value ? "text-text" : "text-muted"}>
              {selectedLabel}
            </span>
          </div>

          <IoChevronDown className="text-muted" />
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onPointerDown={(e) => {
            if (
              sheetRef.current &&
              !sheetRef.current.contains(e.target as Node)
            )
              close();
          }}
        >
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* sheet */}
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-surface border border-border shadow-2xl"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-border mb-3" />
              <div className="flex items-center justify-between">
                <div className="text-text font-semibold">{label}</div>
                <button
                  type="button"
                  onClick={close}
                  className="text-sm text-muted hover:text-text"
                >
                  닫기
                </button>
              </div>
              <div className="mt-1 text-xs text-muted">
                {stepMinutes}분 단위로 선택할 수 있어요.
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-2 pb-4">
              {options.map((t) => {
                const isSelected = t === value;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onChange(t);
                      close();
                    }}
                    className={[
                      "w-full px-3 py-3 rounded-xl text-left transition",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-surface-2 text-text",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatKo(t)}</span>
                      <span
                        className={[
                          "text-xs",
                          isSelected ? "opacity-90" : "text-muted",
                        ].join(" ")}
                      >
                        {t}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
