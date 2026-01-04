import {
  MyVotesResponse,
  VoteCommitRequest,
  VoteCommitResponse,
  VoteResultsResponse,
} from "@/src/types/vote";

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

export async function fetchMyVotes(shareCode: string, voterToken: string) {
  const res = await fetch(
    `/api/events/${shareCode}/my-votes?voterToken=${encodeURIComponent(
      voterToken
    )}`,
    { method: "GET", cache: "no-store" }
  );

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "내 투표 불러오기 실패");
  }

  return (await res.json()) as MyVotesResponse;
}
