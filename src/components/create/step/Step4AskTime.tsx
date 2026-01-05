"use client";

import { useState } from "react";
import { useCreateStore } from "@/src/stores/createStore";
import CreateItem from "../ui/CreateItem";
import QuestionHeader from "../ui/QuestionHeader";
import { createEvent } from "@/src/lib/api/createEventClient";
import type { CreateMode } from "@/src/stores/createStore";

const Step4AskTime = () => {
  const title = useCreateStore((s) => s.title);
  const dates = useCreateStore((s) => s.selectedDates);

  const goTo = useCreateStore((s) => s.goTo);
  const setCreatedShareCode = useCreateStore((s) => s.setCreatedShareCode);
  const setCreatedMode = useCreateStore((s) => s.setCreatedMode);
  const setIsLoading = useCreateStore((s) => s.setIsLoading);
  const isLoading = useCreateStore((s) => s.isLoading);

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

  return (
    <div className="animate-fade-in">
      <QuestionHeader question="Q. 시간까지 정할까요?" />
      <div>
        <CreateItem
          number={1}
          text="날짜만 받을래요"
          onClick={() => {
            if (isLoading) return;
            createAndGoDone("ONE_DATE", {
              title,
              mode: "ONE_DATE",
              dates,
            });
          }}
        />
        <CreateItem
          number={2}
          text="시간도 함께 정할래요"
          onClick={() => {
            if (isLoading) return;
            goTo(5);
          }}
        />
      </div>
    </div>
  );
};

export default Step4AskTime;
