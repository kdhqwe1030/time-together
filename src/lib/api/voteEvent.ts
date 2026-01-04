export type VoteCommitRequest = {
  voterToken: string;
  displayName: string;
  slotIds: string[];
};

export type VoteCommitResponse = {
  ok: true;
};

export async function commitVotes(shareCode: string, body: VoteCommitRequest) {
  const res = await fetch(`/api/events/${shareCode}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "투표 저장 실패");
  }

  return (await res.json()) as VoteCommitResponse;
}

export type VoteResultsResponse = {
  ok: true;
  eventId: string;
  totalVoters: number;
  countsBySlot: Record<string, number>;
  votersBySlot: Record<string, string[]>;
  heatByDateKey: Record<string, number>;
  votersByDateKey: Record<string, string[]>;
};

export async function fetchResults(shareCode: string) {
  const res = await fetch(`/api/events/${shareCode}/results`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "결과 불러오기 실패");
  }

  return (await res.json()) as VoteResultsResponse;
}
