"use client";

import { useEffect, useMemo, useState } from "react";
import type { VoteInitialData, VoteResultsResponse } from "../types/vote";
import CalendarOne from "./grid/CalendarOne";
import { MdMode } from "react-icons/md";

import Tag from "./Tag";
import CreateButton from "./create/ui/CreateButton";
import ResultCalendarOne from "./grid/ResultCalendarOne";
import { loadIdentity, saveName } from "../lib/getCreateVoterToken";
import { commitVotes, fetchMyVotes, fetchResults } from "../lib/api/voteEvent";
import { createSupabaseBrowser } from "../lib/supabase/supabaseBrowser";
import { fmtMD, formatDateKeyKR } from "../utils/calendarUtils";
import NamesTooltip from "./NamesTooltip";

type Props = {
  shareCode: string;
  initial: VoteInitialData;
};

const OneDateVote = ({ shareCode, initial }: Props) => {
  const supabase = useMemo(() => createSupabaseBrowser(), []); //realitime구독을 위한 supabse brower용

  const [voterToken, setVoterToken] = useState<string>(""); //내 token
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    () => new Set()
  ); //선택 날짜
  const [mode, setMode] = useState(false); // 페이지 관련 상태 f:투표 t:결과
  const [name, setName] = useState(""); // 이름
  const [isMod, setIsMode] = useState(false); //이름 수정
  const [results, setResults] = useState<VoteResultsResponse | null>(null); //모임 정보에서의 유력후보 결과
  const [loading, setloading] = useState(false); // 결과보기 loading
  const [isError, setIsError] = useState(false);

  const info = initial.event; //모임 정보를 위한 데이터
  const MANY_TIE_THRESHOLD = 4; // 유력후보 관련 상수
  //달력 선택 관련 props로 전달해줄 함수
  const setDate = (key: string, makeSelected: boolean) => {
    setSelectedDates((prev) => {
      const n = new Set(prev);
      if (makeSelected) n.add(key);
      else n.delete(key);
      return n;
    });
  };
  const allowedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const slot of initial.slots) {
      if (slot.slot_type === "DATE" && slot.date) s.add(slot.date);
    }
    return s;
  }, [initial.slots]);
  const monthBounds = useMemo(() => {
    const dates = [...allowedKeys].map((k) => new Date(k + "T00:00:00"));
    if (dates.length === 0) return null;

    let min = dates[0];
    let max = dates[0];

    for (const d of dates) {
      if (d < min) min = d;
      if (d > max) max = d;
    }

    // 월의 1일로 정규화
    const minMonth = new Date(min.getFullYear(), min.getMonth(), 1);
    const maxMonth = new Date(max.getFullYear(), max.getMonth(), 1);

    return { minMonth, maxMonth };
  }, [allowedKeys]);

  const slotIdByDate = useMemo(() => {
    const m = new Map<string, string>(); // "YYYY-MM-DD" -> slot uuid
    for (const s of initial.slots) {
      if (s.slot_type === "DATE" && s.date) m.set(s.date, s.id);
    }
    return m;
  }, [initial.slots]);
  const dateBySlotId = useMemo(() => {
    const m = new Map<string, string>(); // slot uuid -> "YYYY-MM-DD"
    for (const s of initial.slots) {
      if (s.slot_type === "DATE" && s.date) m.set(s.id, s.date);
    }
    return m;
  }, [initial.slots]);
  const selectedSlotIds = useMemo(() => {
    return [...selectedDates]
      .map((d) => slotIdByDate.get(d))
      .filter(Boolean) as string[];
  }, [selectedDates, slotIdByDate]);

  useEffect(() => {
    if (!shareCode) return;
    if (!voterToken) return;

    let alive = true;

    (async () => {
      try {
        const my = await fetchMyVotes(shareCode, voterToken);
        if (!alive) return;
        if (my.slotIds.length > 0) setMode(true);

        //  이름도 서버값으로 보강(로컬에 없을 때만)
        if ((!name || name.trim() === "") && my.displayName) {
          setName(my.displayName);
          setIsMode(true);
          saveName(shareCode, my.displayName); // 로컬에도 다시 저장
        }

        // slotIds -> dateKey로 복구
        const next = new Set<string>();
        for (const slotId of my.slotIds) {
          const dateKey = dateBySlotId.get(slotId);
          if (dateKey) next.add(dateKey);
        }
        setSelectedDates(next);
      } catch {
        // 조용히 무시(토스트 원하면 여기서)
      }
    })();

    return () => {
      alive = false;
    };
    // name은 의존성에 넣으면 name set 때문에 재호출될 수 있어서 의도적으로 제외하는 편이 깔끔함
  }, [shareCode, voterToken, dateBySlotId]);

  //내가 이전에 접속했었는지
  useEffect(() => {
    const { voterToken, displayName } = loadIdentity(shareCode);

    setVoterToken(voterToken);
    setName(displayName);
    if (displayName !== "") setIsMode(true);
  }, [shareCode]);

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

  const summary = useMemo(() => {
    const heat = results?.heatByDateKey ?? {};

    // 기간 표기: allowedKeys 기반
    const dateKeys = (allowedKeys ? Array.from(allowedKeys) : Object.keys(heat))
      .filter(Boolean)
      .sort();

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

    const periodLabel =
      start && end
        ? [
            `${fmtMD(start)} ~ ${fmtMD(end)}`,
            rangeDays === allowedCount
              ? `(${rangeDays}일)`
              : `(${rangeDays}일 중 ${allowedCount}일)`,
          ].join(" ")
        : null;

    // ---- 유력 후보: "랭크 그룹" 방식 ----
    // count별로 날짜 그룹핑 (0명은 후보에서 제외)
    const byCount = new Map<number, string[]>();
    for (const k of dateKeys) {
      const c = heat[k] ?? 0;
      if (c <= 0) continue;
      const arr = byCount.get(c) ?? [];
      arr.push(k);
      byCount.set(c, arr);
    }

    const countsDesc = Array.from(byCount.keys()).sort((a, b) => b - a);

    // 아직 투표가 없으면 후보 없음
    if (countsDesc.length === 0) {
      return {
        periodLabel,
        showTop3: false,
        tooManyTop: false,
        top3: [] as string[],
      };
    }

    // 1등 동점이 너무 많으면 → "상위 후보가 많아요"
    const topCount = countsDesc[0];
    const topDates = (byCount.get(topCount) ?? []).slice().sort();
    const tooManyTop = topDates.length >= MANY_TIE_THRESHOLD;

    if (tooManyTop) {
      return {
        periodLabel,
        showTop3: false,
        tooManyTop: true,
        top3: [] as string[],
      };
    }

    // 랭크 그룹을 통째로 채우되, 3개를 넘기면 그 랭크는 버리고 종료
    const picked: string[] = [];
    for (const c of countsDesc) {
      const group = (byCount.get(c) ?? []).slice().sort();
      if (picked.length + group.length > 3) break; //  2등/3등이 너무 많으면 여기서 컷
      picked.push(...group);
      if (picked.length === 3) break;
    }

    return {
      periodLabel,
      showTop3: picked.length > 0,
      tooManyTop: false,
      top3: picked,
    };
  }, [results?.heatByDateKey, allowedKeys]);

  return (
    <div className="p-4 pb-32 flex flex-col gap-4">
      {/* 모임 정보 카드 */}
      <section className="rounded-2xl shadow shadow-black/10 bg-surface p-4 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* 제목 */}
            <div className="text-text font-semibold truncate">{info.title}</div>

            {/* 기간 (필수) */}
            <div className="mt-1 text-sm text-muted">
              <span className="font-light text-text">
                {summary.periodLabel ?? "-"}
              </span>
            </div>

            {/* 유력 후보(조건부) */}
            <div className="mt-3 text-xs text-muted">
              {summary.showTop3 ? (
                <>
                  유력 후보
                  <div className="flex gap-4 mt-1">
                    {summary.top3.map((item) => {
                      const count = results?.heatByDateKey?.[item] ?? 0; // 이 날짜 가능한 사람 수
                      const names = results?.votersByDateKey?.[item] ?? []; //툴팁을 위한 이름
                      return (
                        <NamesTooltip
                          key={item}
                          names={names}
                          headerText=""
                          emptyText="아직 없음"
                        >
                          {({ toggle }) => (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={toggle}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  toggle();
                              }}
                              className={[
                                "px-3 py-2 border border-border rounded-xl bg-surface",
                                "flex flex-col items-center cursor-pointer select-none",
                                "hover:bg-surface/60 active:scale-[0.98] transition",
                              ].join(" ")}
                            >
                              <div className="font-medium text-text text-nowrap">
                                {formatDateKeyKR(item)}
                              </div>

                              <div className="mt-0.5 text-xs text-muted">
                                <span className="text-primary/90 font-semibold">
                                  {count}명
                                </span>{" "}
                                가능
                              </div>
                            </div>
                          )}
                        </NamesTooltip>
                      );
                    })}
                  </div>
                </>
              ) : summary.tooManyTop ? (
                <>상위 후보가 많아요. 달력에서 편한 날을 골라주세요 🤝</>
              ) : (
                <>아직 투표가 없어요. 가장 먼저 투표해보세요 🗳️</>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <Tag text={`참여자 ${results?.totalVoters ?? 0}명`} />
          </div>
        </div>
      </section>

      {/* 이름 입력 카드 */}
      {!mode ? (
        <section className="rounded-2xl shadow shadow-black/10 bg-surface p-4 animate-fade-in">
          <div className="text-sm font-semibold text-text">이름</div>
          {!isMod ? (
            <input
              placeholder="이름을 입력하세요"
              className={[
                "mt-2 w-full rounded-xl border border-border bg-surface px-3 py-3",
                "text-text placeholder:text-muted outline-none",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
              ].join(" ")}
              value={name}
              onChange={(e) => {
                setIsError(false);
                setName(e.target.value);
              }}
              onBlur={() => {
                setIsMode(true);
                saveName(shareCode, name);
              }}
            />
          ) : (
            <div className="mt-2 text-lg flex items-center gap-4">
              {name}
              <MdMode
                className="text-primary"
                onClick={() => setIsMode(false)}
              />
            </div>
          )}
        </section>
      ) : (
        <></>
      )}
      <div className="mb-6">
        {!mode ? (
          <section className="bg-surface p-4 rounded-2xl shadow shadow-black/10 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-text font-semibold">날짜 선택</h1>
              <span className="text-muted text-xs">
                가능한 날짜를 드래그해서 선택하세요
              </span>
            </div>
            <CalendarOne
              selected={selectedDates}
              onSetDate={setDate}
              allowedKeys={allowedKeys}
              monthBounds={monthBounds}
            />
            <div className="w-full flex justify-end mt-2 pr-2">
              <span className="text-xs text-muted">
                {selectedDates.size}일 선택
              </span>
            </div>
          </section>
        ) : (
          <ResultCalendarOne
            allowedKeys={allowedKeys}
            monthBounds={monthBounds}
            heatByDateKey={results?.heatByDateKey ?? {}}
            totalVoters={results?.totalVoters ?? 0}
            votersByDateKey={results?.votersByDateKey ?? {}}
          />
        )}
      </div>
      {/* 하단 고정 버튼 영역 */}
      <div className="fixed bottom-0 left-0 right-0  from-bg via-bg to-bg/80 p-4 pb-6 z-10">
        <div className="mx-auto max-w-3xl">
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
                disabled={selectedDates.size === 0 || loading}
                onClick={async () => {
                  if (name.trim() === "") {
                    setIsError(true);
                    return;
                  }
                  setIsError(false);
                  setloading(true);
                  try {
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

export default OneDateVote;
