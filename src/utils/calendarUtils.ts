export function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function addMonths(base: Date, delta: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + delta);
  d.setDate(1);
  return d;
}

export function getMonthDays(month: Date) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const days: Date[] = [];
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(y, m, i));
  }
  return { first, days };
}

export type HeatBucket = {
  min: number;
  max: number;
  strength: number;
  label: string;
};
export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function strengthForRatio(r: number) {
  // 0명은 색 없음
  if (r <= 0) return 0;
  // 최소 가시성 + 참여율에 따라 진해짐 (1이면 완전 진함)
  return clamp(0.15 + 0.85 * r, 0, 1);
}

// total 대비(비율)로 범례 구간을 만들고,
// 각 구간 색 진하기(strength)는 "그 구간의 상한 참여율(max/total)"로 계산
export function buildHeatBuckets(total: number): HeatBucket[] {
  const t = Math.max(total, 1);

  // 작은 인원은 그냥 1명 단위가 보기 좋음
  if (t <= 5) {
    return Array.from({ length: t + 1 }, (_, c) => ({
      min: c,
      max: c,
      strength: strengthForRatio(c / t),
      label: `${c}/${t}명`,
    }));
  }

  // 6~7명은 스샷 느낌 유지: 0, 1, 2-3, 4-5, (6), (7)
  if (t <= 7) {
    const ranges: Array<[number, number]> =
      t === 6
        ? [
            [0, 0],
            [1, 1],
            [2, 3],
            [4, 5],
            [6, 6],
          ]
        : [
            [0, 0],
            [1, 1],
            [2, 3],
            [4, 5],
            [6, 6],
            [7, 7],
          ];

    return ranges.map(([min, max]) => ({
      min,
      max,
      strength: strengthForRatio(max / t), // ✅ 구간 상한 참여율
      label: min === max ? `${min}/${t}명` : `${min}-${max}/${t}명`,
    }));
  }

  // 8명 이상은 total 대비 비율로 자동 구간화
  // 대략: 0, 1, 2~30%, 31~60%, 61~(t-1), t
  const b1 = 1;
  const b2 = Math.max(2, Math.floor(t * 0.3));
  const b3 = Math.max(b2 + 1, Math.floor(t * 0.6));
  const b4 = t - 1;

  const raw: Array<[number, number]> = [
    [0, 0],
    [1, 1],
    [2, b2],
    [b2 + 1, b3],
    [b3 + 1, b4],
    [t, t],
  ];

  const out: HeatBucket[] = [];
  for (const [min0, max0] of raw) {
    const min = clampInt(min0, 0, t);
    const max = clampInt(max0, 0, t);
    if (min > max) continue;

    out.push({
      min,
      max,
      strength: strengthForRatio(max / t), // 구간 상한 참여율
      label: min === max ? `${min}/${t}명` : `${min}-${max}/${t}명`,
    });
  }

  // label 중복 제거(혹시 모를 엣지)
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x.label) ? false : seen.add(x.label)));
}

export function strengthFromCount(count: number, total: number) {
  const t = Math.max(total, 1);
  const c = clampInt(count, 0, t);
  const buckets = buildHeatBuckets(t);
  const found = buckets.find((b) => c >= b.min && c <= b.max);
  return found?.strength ?? strengthForRatio(c / t);
}

// 범례 색칠용(셀과 동일한 방식)
export function getLegendSwatchStyle(strength: number): React.CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, white ${
      (1 - strength) * 100
    }%, var(--primary) ${strength * 100}%)`,
  };
}

export function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

//2026-01-05 -> 1월 5일(월)로 변경
export function formatDateKeyKR(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = week[d.getDay()];
  return `${m}월 ${day}일 (${w})`;
}
