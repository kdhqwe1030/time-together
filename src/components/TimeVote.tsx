"use client";
import { useEffect, useMemo, useState } from "react";
import { VoteInitialData, VoteResultsResponse } from "../types/vote";
import NameSection from "./NameSection";
import { loadIdentity, saveName } from "../lib/getCreateVoterToken";
import VoteTimeGrid from "./grid/VoteTimeGrid";
import ResultTimeGrid from "./grid/ResultTimeGrid";
import { MdMode } from "react-icons/md";
import CreateButton from "./create/ui/CreateButton";
import { fetchResults, commitVotes } from "../lib/api/voteEvent";
import { createSupabaseBrowser } from "../lib/supabase/supabaseBrowser";
import { buildHeatBuckets, getLegendSwatchStyle } from "../utils/calendarUtils";

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

  //내가 이전에 접속했었는지
  useEffect(() => {
    const { voterToken, displayName } = loadIdentity(shareCode);

    setVoterToken(voterToken);
    setName(displayName);
    if (displayName !== "") setIsMode(true);
  }, [shareCode]);

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

  // 범례 생성
  const buckets = useMemo(
    () => buildHeatBuckets(results?.totalVoters ?? 0),
    [results?.totalVoters]
  );

  return (
    <div className="p-4 pb-32 flex flex-col gap-4">
      {/* 참여 현황 섹션 (결과 모드일 때만) */}
      {mode && (
        <section className="bg-surface p-4 rounded-2xl shadow shadow-black/10 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-text font-medium text-sm">참여 현황</h1>

            {/* 범례 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {buckets.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 text-xs text-muted"
                >
                  <span
                    className="h-3 w-3 rounded-sm border border-border"
                    style={
                      b.strength <= 0
                        ? undefined
                        : getLegendSwatchStyle(b.strength)
                    }
                  />
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 이름 입력 카드 */}
      {!mode ? (
        <NameSection
          isMod={isMod}
          name={name}
          onChange={(e) => {
            setIsError(false);
            setName(e.target.value);
          }}
          onBlur={() => {
            setIsMode(true);
            saveName(shareCode, name);
          }}
          changeMode={() => setIsMode(false)}
        />
      ) : (
        <></>
      )}
      <div className="mb-6">
        {!mode ? (
          <section className="bg-surface p-4 rounded-2xl shadow shadow-black/10 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-text font-semibold">시간 선택</h1>
              <span className="text-muted text-xs">
                가능한 시간대를 드래그해서 선택하세요 ⏰
              </span>
            </div>
            <VoteTimeGrid
              eventMode={initial.event.mode}
              slots={initial.slots}
              selected={selected}
              onSelectedChange={setSelected}
            />
          </section>
        ) : (
          <section className="bg-surface p-4 rounded-2xl shadow shadow-black/10 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-text font-semibold">참여 현황</h1>
              <span className="text-muted text-xs">
                시간을 탭하면 가능한 사람 목록을 볼 수 있어요
              </span>
            </div>
            <ResultTimeGrid
              eventMode={initial.event.mode}
              slots={initial.slots}
              countsBySlot={results?.countsBySlot ?? {}}
              votersBySlot={results?.votersBySlot ?? {}}
              totalVoters={results?.totalVoters ?? 0}
            />
          </section>
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
