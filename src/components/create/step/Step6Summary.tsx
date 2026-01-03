"use client";

import { useMemo } from "react";
import { useCreateStore } from "@/src/stores/createStore";
import CreateButton from "../ui/CreateButton";
import { useRouter } from "next/navigation";

const Step6Done = () => {
  const title = useCreateStore((s) => s.title);
  const meetingType = useCreateStore((s) => s.meetingType);

  const dates = useCreateStore((s) => s.selectedDates);
  const weekdays = useCreateStore((s) => s.selectedWeekdays);

  const minTime = useCreateStore((s) => s.minTime);
  const maxTime = useCreateStore((s) => s.maxTime);

  const shareCode = useCreateStore((s) => s.createdShareCode);
  const createdMode = useCreateStore((s) => s.createdMode);

  const typeLabel = useMemo(() => {
    if (meetingType === "ONE") return "한 번 만나는 일정";
    return "정기적으로 만나는 일정";
  }, [meetingType]);

  const selectionLabel = useMemo(() => {
    if (!createdMode) return "-";
    if (createdMode === "ONE_DATE" || createdMode === "ONE_DATETIME") {
      return `${dates.length}개 날짜 선택`;
    }
    // recurring
    const w = ["일", "월", "화", "수", "목", "금", "토"];
    return weekdays.length
      ? `${weekdays.map((d) => w[d]).join(" · ")} 선택`
      : "-";
  }, [createdMode, dates.length, weekdays]);

  const timeLabel = useMemo(() => {
    if (!createdMode) return "-";
    if (createdMode === "ONE_DATE" || createdMode === "REC_WEEKDAY")
      return "날짜만";
    return `${minTime} ~ ${maxTime}`;
  }, [createdMode, minTime, maxTime]);

  const shareUrl =
    typeof window !== "undefined" && shareCode
      ? `${window.location.origin}/e/${shareCode}`
      : "";

  const onShare = async () => {
    if (!shareCode) return;

    // 모바일이면 네이티브 공유 먼저 시도
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "모임 투표",
          url: shareUrl,
        });
        return;
      } catch {
        // 사용자가 취소해도 그냥 넘어감
      }
    }

    await navigator.clipboard.writeText(shareUrl);
  };

  const router = useRouter();

  const onGoVote = () => {
    if (!shareCode) return;
    router.replace(`/e/${shareCode}`);
  };
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center px-4 pt-10">
        <div className="text-4xl">🎉</div>
        <div className="mt-4 text-2xl font-extrabold text-text">
          모임이 생성되었어요!
        </div>

        {/* 요약 카드 */}
        <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-surface-1 p-5">
          <Row label="모임 이름" value={title || "-"} />
          <Row label="일정 형태" value={typeLabel} />
          <Row label="선택사항" value={selectionLabel} />
          <Row label="시간 설정" value={timeLabel} />
        </div>

        <div className="mt-10 w-full max-w-md grid gap-3">
          <CreateButton
            disabled={!shareCode}
            onClick={onGoVote}
            className={[
              "w-full rounded-xl py-4 font-semibold transition",
              "border border-border bg-surface text-text hover:bg-surface-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            투표 화면으로 이동하기
          </CreateButton>
          <button disabled={!shareCode} onClick={onShare}>
            링크 공유하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6Done;

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2">
    <div className="text-sm text-muted">{label}</div>
    <div className="text-sm font-semibold text-text">{value}</div>
  </div>
);
