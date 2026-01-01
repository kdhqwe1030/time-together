"use client";

import { useState } from "react";
import { useCreateStore } from "@/src/stores/createStore";
import QuestionHeader from "../ui/QuestionHeader";
import CreateButton from "../ui/CreateButton";
import CalendarOne, { getMonthDays, toKey } from "./CalendarOne";
import CalendarRecurring from "./CalendarRecurring";

const Step3When = () => {
  const { next, meetingType } = useCreateStore();

  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedDays, setSelectedDays] = useState<
    Set<0 | 1 | 2 | 3 | 4 | 5 | 6>
  >(() => new Set());

  const setDay = (day: 0 | 1 | 2 | 3 | 4 | 5 | 6, makeSelected: boolean) => {
    setSelectedDays((prev) => {
      const n = new Set(prev);
      if (makeSelected) n.add(day);
      else n.delete(day);
      return n;
    });
  };

  const selectedDatesCount = selectedDates.size;
  const selectedDaysCount = selectedDays.size;

  // 강제 선택/해제(드래그용)
  const setDate = (key: string, makeSelected: boolean) => {
    setSelectedDates((prev) => {
      const n = new Set(prev);
      if (makeSelected) n.add(key);
      else n.delete(key);
      return n;
    });
  };

  const toggleAllInMonth = (month: Date, makeSelected: boolean) => {
    const { days } = getMonthDays(month);
    setSelectedDates((prev) => {
      const n = new Set(prev);
      for (const d of days) {
        const key = toKey(d);
        if (makeSelected) n.add(key);
        else n.delete(key);
      }
      return n;
    });
  };

  return (
    <div className="animate-fade-in">
      <QuestionHeader question="Q. 언제 만날 수 있나요?" />

      {meetingType === "ONE" ? (
        <>
          <div className="mt-3 text-sm text-muted">
            편한 날짜 체크해 주세요. 한 달 통째로는 ‘전체 선택’이 더 빨라요 ⚡️
          </div>
          <CalendarOne
            selected={selectedDates}
            onSetDate={setDate}
            onToggleAllInMonth={toggleAllInMonth}
          />

          <CreateButton
            disabled={selectedDatesCount === 0}
            onClick={() => {
              // TODO: zustand 저장
              // useCreateStore.getState().setSelectedDates([...selectedDates])
              next();
            }}
          >
            다음 ({selectedDatesCount}개 선택됨)
          </CreateButton>
        </>
      ) : (
        <>
          <div className="mt-3 text-sm text-muted">
            요일을 선택하거나, 드래그해서 여러 요일을 선택할 수 있어요 ✅
          </div>
          <CalendarRecurring selectedDays={selectedDays} onSetDay={setDay} />
          <CreateButton
            disabled={selectedDaysCount === 0}
            onClick={() => {
              // useCreateStore.getState().setSelectedDates([...selectedDates])
              next();
            }}
          >
            다음 (주 {selectedDaysCount}일 선택됨)
          </CreateButton>
        </>
      )}
    </div>
  );
};

export default Step3When;
