"use client";

import { useState } from "react";
import { useCreateStore } from "@/src/stores/createStore";
import QuestionHeader from "../ui/QuestionHeader";
import CreateButton from "../ui/CreateButton";
import CalendarOne, { getMonthDays, toKey } from "../../grid/CalendarOne";
import CalendarRecurring from "../../grid/CalendarRecurring";
import { createEvent } from "@/src/lib/api/createEventClient";
import type { CreateMode } from "@/src/stores/createStore";

const Step3When = () => {
  const title = useCreateStore((s) => s.title);
  const meetingType = useCreateStore((s) => s.meetingType);
  const goTo = useCreateStore((s) => s.goTo);

  const setSelectedDatesStore = useCreateStore((s) => s.setSelectedDates);
  const setSelectedWeekdaysStore = useCreateStore((s) => s.setSelectedWeekdays);

  const setCreatedShareCode = useCreateStore((s) => s.setCreatedShareCode);
  const setCreatedMode = useCreateStore((s) => s.setCreatedMode);

  const [loading, setLoading] = useState(false);

  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedDays, setSelectedDays] = useState<
    Set<0 | 1 | 2 | 3 | 4 | 5 | 6>
  >(() => new Set());

  const selectedDatesCount = selectedDates.size;
  const selectedDaysCount = selectedDays.size;

  const setDay = (day: 0 | 1 | 2 | 3 | 4 | 5 | 6, makeSelected: boolean) => {
    setSelectedDays((prev) => {
      const n = new Set(prev);
      if (makeSelected) n.add(day);
      else n.delete(day);
      return n;
    });
  };

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

  const createAndGoDone = async (mode: CreateMode, payload: any) => {
    setLoading(true);
    try {
      const r = await createEvent(payload);
      setCreatedShareCode(r.shareCode);
      setCreatedMode(mode);
      goTo(6);
    } catch (e: any) {
      alert(e.message ?? "생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const onNextOne = async () => {
    const datesArr = [...selectedDates];
    setSelectedDatesStore(datesArr);

    // 14일 이상이면 Step3에서 바로 생성 (날짜만)
    if (datesArr.length >= 14) {
      await createAndGoDone("ONE_DATE", {
        title,
        mode: "ONE_DATE",
        dates: datesArr,
      });
      return;
    }

    //  14일 미만이면 Step4로 (시간 받을지)
    goTo(4);
  };

  const onNextRecurring = () => {
    const daysArr = [...selectedDays];
    setSelectedWeekdaysStore(daysArr);
    //  정기는 무조건 시간까지 → Step5로
    goTo(5);
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
            disabled={selectedDatesCount === 0 || loading}
            onClick={onNextOne}
          >
            {loading ? "생성 중..." : `다음 (${selectedDatesCount}개 선택됨)`}
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
            onClick={onNextRecurring}
          >
            다음 (주 {selectedDaysCount}일 선택됨)
          </CreateButton>
        </>
      )}
    </div>
  );
};

export default Step3When;
