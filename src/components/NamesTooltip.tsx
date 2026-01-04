"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  names: string[];
  headerText?: string; // 예: "2명 참여" / "2명 가능"
  emptyText?: string; // 예: "아직 없음"
  children: (args: {
    open: boolean;
    toggle: () => void;
    close: () => void;
  }) => React.ReactNode;
};

const NamesTooltip = ({
  names,
  headerText = "2명 가능",
  emptyText = "아직 없음",
  children,
}: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      {children({ open, toggle, close })}

      {open && (
        <div
          className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50
                     max-w-55
                     flex flex-col items-center text-nowrap
                     rounded-xl border border-border bg-surface p-3 shadow-lg"
        >
          {headerText !== "" && (
            <div className="text-xs text-muted mb-2">
              {headerText ?? `${names.length}명`}
            </div>
          )}

          <div className="max-h-32 overflow-auto text-sm text-text space-y-1">
            {names.length === 0 ? (
              <div className="text-muted">{emptyText}</div>
            ) : (
              names.map((n, idx) => <div key={`${n}-${idx}`}>{n}</div>)
            )}
          </div>

          {/* 꼬리 */}
          <div
            className="absolute left-1/2 -top-1 h-2 w-2 -translate-x-1/2 rotate-45
                       border-l border-t border-border bg-surface"
          />
        </div>
      )}
    </div>
  );
};
export default NamesTooltip;
