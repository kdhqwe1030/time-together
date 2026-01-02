import type { CreateMode, TimeValue } from "@/src/stores/createStore";

type Payload = {
  title: string;
  mode: CreateMode;
  dates?: string[];
  weekdays?: number[];
  minTime?: TimeValue;
  maxTime?: TimeValue;
};

export async function createEvent(payload: Payload) {
  console.log("모임 생성 api 전달", payload);
  const res = await fetch("/api/events/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  console.log("모임 생성 api 응답", json);

  if (!res.ok) {
    throw new Error(json?.error ?? "create event failed");
  }

  return json as {
    ok: true;
    shareCode: string;
    eventId: string;
    slotsCreated: number;
    event: any;
  };
}
