// src/types/vote.ts

export type EventMode = "ONE_DATE" | "ONE_DATETIME" | "REC_WEEKDAYTIME";

export type SlotType = "DATE" | "DATETIME" | "WEEKDAYTIME";

export type EventRow = {
  id: string;
  share_code: string;
  title: string;
  mode: EventMode;
  min_time_min: number | null;
  max_time_min: number | null;
  expires_at: string; // ISO string
};

export type Slot = {
  id: string;
  slot_type: SlotType;
  date: string | null; // "YYYY-MM-DD"
  weekday: number | null; // 0~6
  start_min: number | null; // 0~1440 (15분 단위), null 가능
};

export type VoteInitialData = {
  event: EventRow;
  slots: Slot[];
  counts: Record<string, number>; // slotId -> count
};

//api 관련 type
export type VoteCommitRequest = {
  voterToken: string;
  displayName: string;
  slotIds: string[];
};

export type VoteCommitResponse = {
  ok: true;
};

export type MyVotesResponse = {
  ok: true;
  eventId: string;
  voterId: string | null;
  displayName: string | null;
  slotIds: string[];
};

export type VoteResultsResponse = {
  ok: true;
  eventId: string;
  totalVoters: number;
  countsBySlot: Record<string, number>;
  votersBySlot: Record<string, string[]>;
  heatByDateKey: Record<string, number>;
  votersByDateKey: Record<string, string[]>;
};
