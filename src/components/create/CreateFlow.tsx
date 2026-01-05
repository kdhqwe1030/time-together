"use client";

import { useCreateStore } from "@/src/stores/createStore";
import { useMemo } from "react";
import Step1Type from "./step/Step1Type";
import Step2Title from "./step/Step2Title";
import Step3When from "./step/Step3When";
import Step4AskTime from "./step/Step4AskTime";
import Step5TimeRange from "./step/Step5TimeRange";
import BackButton from "./ui/BackButton";
import Step6Summary from "./step/Step6Summary";
import LoadingWrapper from "../LoadingWrapper";

const TOTAL_STEPS = 6;

export default function CreateFlow() {
  const step = useCreateStore((s) => s.step);
  const isLoading = useCreateStore((s) => s.isLoading);

  return (
    <div className="h-full bg-bg text-text relative">
      <LineProgress step={step} />
      <div className="mx-auto max-w-md px-4 pt-4 transition-all duration-300 ease-in-out">
        {step === 1 && <Step1Type />}
        {step === 2 && <Step2Title />}
        {step === 3 && <Step3When />}
        {step === 4 && <Step4AskTime />}
        {step === 5 && <Step5TimeRange />}
        {step === 6 && <Step6Summary />}
      </div>
      {step !== 1 && step !== 6 && <BackButton />}
      {isLoading && <LoadingWrapper />}
    </div>
  );
}

function LineProgress({ step }: { step: number }) {
  const percent = useMemo(() => {
    const clamped = Math.min(Math.max(step, 1), TOTAL_STEPS);
    return ((clamped - 1) / (TOTAL_STEPS - 1)) * 100;
  }, [step]);

  return (
    <div className="w-full h-1.5 rounded-full bg-border overflow">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
