"use client";

import { useMemo, useState } from "react";
import QuestionHeader from "../ui/QuestionHeader";
import TimeSelectItem, { TimeValue } from "../ui/TimeSelectItem";
import CreateButton from "../ui/CreateButton";
import { useCreateStore } from "@/src/stores/createStore";
import { createEvent } from "@/src/lib/api/createEventClient";
import type { CreateMode } from "@/src/stores/createStore";

const toMin = (t: TimeValue) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (x: number): TimeValue => {
  const h = Math.floor(x / 60);
  const m = x % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}` as TimeValue;
};
const ceilToStep = (mins: number, step: number) =>
  Math.ceil(mins / step) * step;

const Step5TimeRange = () => {
  const stepMinutes = 15;

  const meetingType = useCreateStore((s) => s.meetingType);
  const title = useCreateStore((s) => s.title);
  const dates = useCreateStore((s) => s.selectedDates);
  const weekdays = useCreateStore((s) => s.selectedWeekdays);

  const goTo = useCreateStore((s) => s.goTo);
  const setTimeRange = useCreateStore((s) => s.setTimeRange);
  const setCreatedShareCode = useCreateStore((s) => s.setCreatedShareCode);
  const setCreatedMode = useCreateStore((s) => s.setCreatedMode);
  const setIsLoading = useCreateStore((s) => s.setIsLoading);
  const isLoading = useCreateStore((s) => s.isLoading);

  const [startTime, setStartTime] = useState<TimeValue>("09:00");
  const [endTime, setEndTime] = useState<TimeValue>("18:00");

  const endMin = useMemo(() => {
    const s = toMin(startTime);
    return fromMin(ceilToStep(s + stepMinutes, stepMinutes));
  }, [startTime]);

  const handleStartChange = (t: TimeValue) => {
    setStartTime(t);
    if (toMin(endTime) <= toMin(t)) setEndTime(endMin);
  };

  const handleEndChange = (t: TimeValue) => {
    if (toMin(t) <= toMin(startTime)) return;
    setEndTime(t);
  };

  const createAndGoDone = async (mode: CreateMode, payload: any) => {
    setIsLoading(true);
    try {
      const r = await createEvent(payload);
      setCreatedShareCode(r.shareCode);
      setCreatedMode(mode);
      goTo(6);
    } catch (e: any) {
      alert(e.message ?? "생성 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const onCreate = async () => {
    setTimeRange(startTime, endTime);

    if (meetingType === "ONE") {
      await createAndGoDone("ONE_DATETIME", {
        title,
        mode: "ONE_DATETIME",
        dates,
        minTime: startTime,
        maxTime: endTime,
      });
      return;
    }

    // ✅ 정기는 무조건 시간 포함
    await createAndGoDone("REC_WEEKDAYTIME", {
      title,
      mode: "REC_WEEKDAYTIME",
      weekdays,
      minTime: startTime,
      maxTime: endTime,
    });
  };

  return (
    <div className="animate-fade-in">
      <QuestionHeader question="Q. 가능한 시간대를 알려주세요" />

      <div className="mt-3 text-sm text-muted">
        가능한 시간 범위를 선택해 주세요. (15분 단위)
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-text font-semibold">시간 범위</div>
          <div className="text-sm text-muted">
            {startTime} ~ {endTime}
          </div>
        </div>

        <div className="grid gap-3">
          <TimeSelectItem
            label="시작 시간"
            value={startTime}
            onChange={handleStartChange}
            min="06:00"
            max="23:45"
            stepMinutes={stepMinutes}
          />
          <TimeSelectItem
            label="종료 시간"
            value={endTime}
            onChange={handleEndChange}
            min={endMin}
            max="24:00"
            stepMinutes={stepMinutes}
          />
        </div>
      </div>

      <CreateButton onClick={onCreate} disabled={isLoading}>
        {isLoading ? "생성 중..." : "모임 일정 생성하기"}
      </CreateButton>
    </div>
  );
};

export default Step5TimeRange;
