"use client";
import { useEffect, useMemo, useState } from "react";
import { VoteInitialData, VoteResultsResponse } from "../types/vote";
import { loadIdentity, saveName } from "../lib/getCreateVoterToken";
import VoteTimeGrid from "./grid/VoteTimeGrid";
import ResultTimeGrid from "./grid/ResultTimeGrid";
import { MdMode } from "react-icons/md";
import CreateButton from "./create/ui/CreateButton";
import { fetchResults, commitVotes, fetchMyVotes } from "../lib/api/voteEvent";
import { createSupabaseBrowser } from "../lib/supabase/supabaseBrowser";
import { fmtMD, formatDateKeyKR } from "../utils/calendarUtils";
import EventSummaryCard from "./EventSummaryCard";

type Props = {
  shareCode: string;
  initial: VoteInitialData;
};

const TimeVote = ({ shareCode, initial }: Props) => {
  const supabase = useMemo(() => createSupabaseBrowser(), []); // realtime 구독용
  const [voterToken, setVoterToken] = useState<string>(""); //내 token

  const [mode, setMode] = useState(false); // 페이지 관련 상태 f:투표 t:결과
  const [name, setName] = useState(""); // 이름
  const [isMod, setIsMode] = useState(false); //이름 수정
  const [isError, setIsError] = useState(false);
  const [loading, setloading] = useState(false); // 결과보기 loading
  // VoteTimeGrid 선택 상태
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 결과 데이터
  const [results, setResults] = useState<VoteResultsResponse | null>(null);

  const MANY_TIE_THRESHOLD = 4; // 유력후보 관련 상수
  const info = initial.event; // 모임 정보

  //내가 이전에 접속했었는지
  useEffect(() => {
    const { voterToken, displayName } = loadIdentity(shareCode);

    setVoterToken(voterToken);
    setName(displayName);
    if (displayName !== "") setIsMode(true);
  }, [shareCode]);

  // 서버에서 내 투표 기록 불러오기 (OneDateVote와 동일)
  useEffect(() => {
    if (!shareCode) return;
    if (!voterToken) return;

    let alive = true;

    (async () => {
      try {
        const my = await fetchMyVotes(shareCode, voterToken);
        if (!alive) return;
        if (my.slotIds.length > 0) setMode(true);

        // 이름도 서버값으로 보강(로컬에 없을 때만)
        if ((!name || name.trim() === "") && my.displayName) {
          setName(my.displayName);
          setIsMode(true);
          saveName(shareCode, my.displayName); // 로컬에도 다시 저장
        }

        // slotIds -> slotKey로 복구
        const isWeekdayMode = initial.event.mode === "REC_WEEKDAYTIME";
        const makeSlotKey = (colKey: string, minute: number) =>
          `${colKey}|${minute}`;

        // slotId -> slotKey 역매핑 생성
        const slotKeyById = new Map<string, string>();
        for (const s of initial.slots) {
          if (s.start_min == null) continue;

          if (isWeekdayMode) {
            if (s.slot_type !== "WEEKDAYTIME") continue;
            if (s.weekday == null) continue;
            slotKeyById.set(s.id, makeSlotKey(String(s.weekday), s.start_min));
          } else {
            if (s.slot_type !== "DATETIME") continue;
            if (!s.date) continue;
            slotKeyById.set(s.id, makeSlotKey(s.date, s.start_min));
          }
        }

        // 선택 상태 복원
        const next = new Set<string>();
        for (const slotId of my.slotIds) {
          const slotKey = slotKeyById.get(slotId);
          if (slotKey) next.add(slotKey);
        }
        setSelected(next);
      } catch {
        // 조용히 무시(토스트 원하면 여기서)
      }
    })();

    return () => {
      alive = false;
    };
    // name은 의존성에 넣으면 name set 때문에 재호출될 수 있어서 의도적으로 제외
  }, [shareCode, voterToken, initial.slots, initial.event.mode]);

  // slotKey -> slotId 매핑 (VoteTimeGrid와 동일)
  const slotIdByKey = useMemo(() => {
    const m = new Map<string, string>();
    const makeSlotKey = (colKey: string, minute: number) =>
      `${colKey}|${minute}`;
    const isWeekdayMode = initial.event.mode === "REC_WEEKDAYTIME";

    for (const s of initial.slots) {
      if (s.start_min == null) continue;

      if (isWeekdayMode) {
        // WEEKDAYTIME: weekday 기반
        if (s.slot_type !== "WEEKDAYTIME") continue;
        if (s.weekday == null) continue;
        m.set(makeSlotKey(String(s.weekday), s.start_min), s.id);
      } else {
        // DATETIME: date 기반
        if (s.slot_type !== "DATETIME") continue;
        if (!s.date) continue;
        m.set(makeSlotKey(s.date, s.start_min), s.id);
      }
    }
    return m;
  }, [initial.slots, initial.event.mode]);

  // 선택된 slotIds 계산
  const selectedSlotIds = useMemo(() => {
    return Array.from(selected)
      .map((k) => slotIdByKey.get(k))
      .filter((v): v is string => !!v);
  }, [selected, slotIdByKey]);

  // 결과 첫 로드 + realtime refetch
  useEffect(() => {
    if (!mode) return; // 결과 모드일 때만

    let alive = true;
    let timer: any = null;

    const refetch = async () => {
      try {
        const r = await fetchResults(shareCode);
        if (alive) setResults(r);
      } catch {
        // 조용히 무시하거나 토스트
      }
    };

    refetch();

    // votes 변화 감지 → debounce 후 refetch
    const eventId = initial.event.id;
    const ch = supabase
      .channel(`results:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          clearTimeout(timer);
          timer = setTimeout(refetch, 150);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [mode, shareCode, supabase, initial.event.id]);

  // Summary 계산 (TimeVote는 유력 후보 없음)
  const summary = useMemo(() => {
    let periodLabel: string | null = null;

    if (initial.event.mode === "REC_WEEKDAYTIME") {
      // WEEKDAYTIME: 요일 나열
      const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];
      const weekdaySet = new Set<number>();

      for (const s of initial.slots) {
        if (s.slot_type === "WEEKDAYTIME" && s.weekday != null) {
          weekdaySet.add(s.weekday);
        }
      }

      const weekdays = Array.from(weekdaySet).sort();
      periodLabel =
        weekdays.length > 0
          ? weekdays.map((w) => WEEKDAY_LABEL[w]).join("· ")
          : null;
    } else {
      // ONE_DATETIME: 날짜 범위 표현
      // slots에서 unique 날짜 추출
      const dateSet = new Set<string>();
      for (const s of initial.slots) {
        if (s.slot_type === "DATETIME" && s.date) {
          dateSet.add(s.date);
        }
      }

      const dateKeys = Array.from(dateSet).sort();
      const start = dateKeys[0] ?? null;
      const end = dateKeys[dateKeys.length - 1] ?? null;

      const rangeDays =
        start && end
          ? Math.floor(
              (new Date(end).getTime() - new Date(start).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
          : 0;

      const allowedCount = dateKeys.length;

      periodLabel =
        start && end
          ? [
              `${fmtMD(start)} ~ ${fmtMD(end)}`,
              rangeDays === allowedCount
                ? `(${rangeDays}일)`
                : `(${rangeDays}일 중 ${allowedCount}일)`,
            ].join(" ")
          : null;
    }

    // TimeVote는 유력 후보 표시 안 함
    return {
      periodLabel,
      showTop3: false,
      tooManyTop: false,
      topCandidates: [],
    };
  }, [initial.slots, initial.event.mode]);

  return (
    <div className="p-4 pb-32 flex flex-col gap-4">
      {/* 모임 정보 카드 */}
      <EventSummaryCard
        title={info.title}
        periodLabel={summary?.periodLabel ?? undefined}
        totalVoters={results?.totalVoters ?? 0}
        topCandidates={summary?.topCandidates ?? []}
        showTop3={summary?.showTop3 ?? false}
        tooManyTop={summary?.tooManyTop ?? false}
      />

      {/* VoteTimeGrid (투표 모드) / ResultTimeGrid (결과 모드) */}
      <div className="mb-6">
        {!mode ? (
          <VoteTimeGrid
            eventMode={initial.event.mode}
            slots={initial.slots}
            selected={selected}
            onSelectedChange={setSelected}
            name={name}
            isMod={isMod}
            onNameChange={(e) => {
              setIsError(false);
              setName(e.target.value);
            }}
            onNameBlur={() => {
              setIsMode(true);
              saveName(shareCode, name);
            }}
            onChangeMode={() => setIsMode(false)}
          />
        ) : (
          <ResultTimeGrid
            eventMode={initial.event.mode}
            slots={initial.slots}
            countsBySlot={results?.countsBySlot ?? {}}
            votersBySlot={results?.votersBySlot ?? {}}
            totalVoters={results?.totalVoters ?? 0}
          />
        )}
      </div>
      {/* 하단 고정 버튼 영역 */}
      <div className="fixed bottom-0 left-0 right-0  from-bg via-bg to-bg/80 p-4 pb-6 z-50">
        <div className="mx-auto max-w-2xl ">
          {!mode ? (
            <div className="space-y-2">
              {isError && (
                <div
                  role="alert"
                  className="text-sm text-red-500 animate-fade-in-shake font-medium ml-1"
                >
                  {name.trim() === ""
                    ? "이름을 입력해주세요"
                    : "오류가 발생했습니다"}
                </div>
              )}

              <CreateButton
                className="py-3.5!"
                disabled={selectedSlotIds.length === 0 || loading}
                onClick={async () => {
                  if (name.trim() === "") {
                    setIsError(true);
                    return;
                  }
                  setIsError(false);
                  setloading(true);
                  try {
                    // API 요청
                    await commitVotes(shareCode, {
                      voterToken,
                      displayName: name.trim(),
                      slotIds: selectedSlotIds,
                    });

                    setMode(true);
                  } catch (e: any) {
                    setIsError(true);
                  } finally {
                    setloading(false);
                  }
                }}
              >
                {loading ? "저장 중..." : "결과보기"}
              </CreateButton>
            </div>
          ) : (
            <button
              onClick={() => setMode(!mode)}
              className={[
                "w-full rounded-xl px-6 py-3.5",
                "bg-linear-to-br from-[#faf8ff] to-[#f5f3ff]",
                "border border-[#e9d5ff]",
                "text-[15px] text-primary font-medium",
                "shadow-[0_2px_8px_rgba(99,102,241,0.1)]",
                "hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]",
                "hover:border-[#ddd6fe]",
                "hover:bg-linear-to-br hover:from-[#f5f3ff] hover:to-[#ede9fe]",
                "active:scale-[0.98]",
                "transition-all duration-200",
                "flex items-center justify-center gap-2",
              ].join(" ")}
            >
              <MdMode className="text-base" />내 일정 수정
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeVote;
