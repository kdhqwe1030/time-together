"use client";

import { useEffect, useMemo, useState } from "react";
import type { VoteInitialData } from "../types/vote";
import CalendarOne from "./grid/CalendarOne";
import { MdMode } from "react-icons/md";

import Tag from "./Tag";
import CreateButton from "./create/ui/CreateButton";
import ResultCalendarOne from "./grid/ResultCalendarOne";
import { loadIdentity, saveName } from "../lib/getCreateVoterToken";
import {
  commitVotes,
  fetchResults,
  VoteResultsResponse,
} from "../lib/api/voteEvent";
import { createSupabaseBrowser } from "../lib/supabase/supabaseBrowser";
import { getMonthDays, toKey } from "../utils/calendarUtils";

type Props = {
  shareCode: string;
  initial: VoteInitialData;
};

const VoteClient = ({ shareCode, initial }: Props) => {
  const [loading, setloading] = useState(false);
  const [mode, setMode] = useState(false); //f:투표 t:결과
  const [name, setName] = useState("");
  const [voterToken, setVoterToken] = useState<string>("");
  const [isMod, setIsMode] = useState(false);
  useEffect(() => {
    const { voterToken, displayName } = loadIdentity(shareCode);

    setVoterToken(voterToken);
    setName(displayName);
    if (displayName !== "") setIsMode(true);
  }, [shareCode]);

  const info = initial.event;
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    () => new Set()
  );

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

  const toggleAllInMonth = (month: Date, makeSelected: boolean) => {
    const { days } = getMonthDays(month);
    setSelectedDates((prev) => {
      const n = new Set(prev);
      for (const d of days) {
        const key = toKey(d);
        if (!allowedKeys.has(key)) continue; //slot 없는 날짜 제외
        if (makeSelected) n.add(key);
        else n.delete(key);
      }
      return n;
    });
  };
  const slotIdByDate = useMemo(() => {
    const m = new Map<string, string>(); // "YYYY-MM-DD" -> slot uuid
    for (const s of initial.slots) {
      if (s.slot_type === "DATE" && s.date) m.set(s.date, s.id);
    }
    return m;
  }, [initial.slots]);

  const selectedSlotIds = useMemo(() => {
    return [...selectedDates]
      .map((d) => slotIdByDate.get(d))
      .filter(Boolean) as string[];
  }, [selectedDates, slotIdByDate]);

  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [results, setResults] = useState<VoteResultsResponse | null>(null);

  // 결과 첫 로드 + realtime refetch
  useEffect(() => {
    if (!mode) return; // 결과 모드일 때만

    let alive = true;
    let timer: any = null;

    const refetch = async () => {
      try {
        const r = await fetchResults(shareCode);
        console.log(r);
        console.log(r);
        console.log(r);
        console.log(r);
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

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* 모임 정보 카드 */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-text font-semibold">{info.title}</div>
            <div className="mt-1 text-sm text-muted">
              링크 코드:{" "}
              <span className="font-medium text-text">{shareCode}</span>
            </div>
          </div>

          <div className="shrink-0 px-3 py-1 text-xs font-semibold text-text">
            <Tag text={`참여자 ${results?.totalVoters ?? 0}명`} />
          </div>
        </div>
      </section>
      {/* 이름 입력 카드 */}
      {!mode ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
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
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                setIsMode(true);
                saveName(shareCode, name);
              }}
            />
          ) : (
            <div className="mt-2 text-lg flex items-center gap-4">
              {name}{" "}
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
      <div className="mt-4 mb-6">
        {!mode ? (
          <div className="bg-surface p-4 rounded-2xl border border-border bg-surface-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-text font-semibold">날짜 선택</h1>
              <span className="text-muted text-xs">
                가능한 날짜를 드래그해서 선택하세요
              </span>
            </div>
            <CalendarOne
              selected={selectedDates}
              onSetDate={setDate}
              onToggleAllInMonth={toggleAllInMonth}
              allowedKeys={allowedKeys}
              monthBounds={monthBounds}
            />
            <div className="w-full flex justify-end mt-2 pr-2">
              <span className="text-xs text-muted">
                {selectedDates.size}일 선택
              </span>
            </div>
          </div>
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
      {!mode ? (
        <CreateButton
          disabled={selectedDates.size === 0 || loading}
          onClick={async () => {
            setloading(true);
            try {
              const res = await commitVotes(shareCode, {
                voterToken,
                displayName: name.trim(),
                slotIds: selectedSlotIds,
              });
              console.log(res);
              setMode(true);
              setloading(false);
            } catch (e: any) {
              alert(e.message ?? "오류 발생");
            }
          }}
        >
          결과보기
        </CreateButton>
      ) : (
        <button
          onClick={() => {
            setMode(!mode);
          }}
          className={[
            "w-full rounded-xl px-4 py-2.5",
            "bg-surface border border-border",
            "text-sm text-muted font-medium",
            "active:bg-gray-100",
            "transition-all duration-200",
            "flex items-center justify-center gap-2",
          ].join(" ")}
        >
          <MdMode className="text-base" />내 일정 수정
        </button>
      )}
    </div>
  );
};

export default VoteClient;
