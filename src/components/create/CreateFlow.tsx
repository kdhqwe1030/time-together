"use client";

import { useCreateStore } from "@/src/stores/createStore";
import { useMemo } from "react";

const TOTAL_STEPS = 5;

export default function CreateFlow() {
  const step = useCreateStore((s) => s.step);

  return (
    <div className="min-h-dvh bg-bg text-text">
      <LineProgress step={step} />
      <div className="mx-auto max-w-md px-4 pt-4"></div>
    </div>
  );
}
function LineProgress({ step }: { step: number }) {
  const percent = useMemo(() => {
    const clamped = Math.min(Math.max(step, 1), TOTAL_STEPS);
    return ((clamped - 1) / (TOTAL_STEPS - 1)) * 100;
  }, [step]);

  return (
    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
