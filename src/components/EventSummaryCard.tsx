"use client";

import Tag from "./Tag";
import NamesTooltip from "./NamesTooltip";

type TopCandidate = {
  label: string; // "1월 8일 (수)" 형태
  count: number;
  voters: string[];
};

type Props = {
  title: string;
  periodLabel?: string; // "01.08 ~ 01.15 (8일)" 같은 형태, WEEKDAYTIME에서는 없음
  totalVoters: number;
  topCandidates?: TopCandidate[]; // 유력 후보 배열, WEEKDAYTIME에서는 없음
  showTop3?: boolean;
  tooManyTop?: boolean;
};

export default function EventSummaryCard({
  title,
  periodLabel,
  totalVoters,
  topCandidates = [],
  showTop3 = false,
  tooManyTop = false,
}: Props) {
  return (
    <section className="rounded-2xl shadow shadow-black/10 bg-surface p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* 제목 */}
          <div className="text-text font-semibold truncate">{title}</div>

          {/* 기간 (있을 때만) */}
          {periodLabel && (
            <div className="mt-1 text-sm text-muted">
              <span className="font-light text-text">{periodLabel}</span>
            </div>
          )}

          {/* 유력 후보 (조건부) */}
          {(showTop3 || tooManyTop || topCandidates.length > 0) && (
            <div className="mt-3 text-xs text-muted">
              {showTop3 && topCandidates.length > 0 ? (
                <>
                  유력 후보
                  <div className="flex gap-4 mt-1">
                    {topCandidates.map((item, idx) => (
                      <NamesTooltip
                        key={idx}
                        names={item.voters}
                        headerText=""
                        emptyText="아직 없음"
                      >
                        {({ toggle }) => (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={toggle}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") toggle();
                            }}
                            className={[
                              "px-3 py-2 border border-border rounded-xl bg-surface",
                              "flex flex-col items-center cursor-pointer select-none",
                              "hover:bg-surface/60 active:scale-[0.98] transition",
                            ].join(" ")}
                          >
                            <div className="font-medium text-text text-nowrap">
                              {item.label}
                            </div>

                            <div className="mt-0.5 text-xs text-muted">
                              <span className="text-primary/90 font-semibold">
                                {item.count}명
                              </span>{" "}
                              가능
                            </div>
                          </div>
                        )}
                      </NamesTooltip>
                    ))}
                  </div>
                </>
              ) : tooManyTop ? (
                <>상위 후보가 많아요. 달력에서 편한 날을 골라주세요 🤝</>
              ) : (
                <>아직 투표가 없어요. 가장 먼저 투표해보세요 🗳️</>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <Tag text={`참여자 ${totalVoters}명`} />
        </div>
      </div>
    </section>
  );
}
