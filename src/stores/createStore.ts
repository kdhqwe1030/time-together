import { create } from "zustand";

export type MeetingType = "ONE" | "RECURRING";
export type TimeValue = `${string}:${string}`;
export type Step = 1 | 2 | 3 | 4 | 5 | 6;

export type CreateMode =
  | "ONE_DATE"
  | "ONE_DATETIME"
  | "REC_WEEKDAY"
  | "REC_WEEKDAYTIME";

type State = {
  step: Step;

  meetingType: MeetingType | null;
  title: string;

  selectedDates: string[]; // YYYY-MM-DD
  selectedWeekdays: (0 | 1 | 2 | 3 | 4 | 5 | 6)[];

  // time
  minTime: TimeValue; // "09:00"
  maxTime: TimeValue; // "18:00"

  // 결과
  createdShareCode: string | null;

  // loading
  isLoading: boolean;

  // actions
  goTo: (s: Step) => void;
  next: () => void;
  back: () => void;

  setMeetingType: (t: MeetingType) => void;
  setTitle: (t: string) => void;

  setSelectedDates: (v: string[]) => void;
  setSelectedWeekdays: (v: (0 | 1 | 2 | 3 | 4 | 5 | 6)[]) => void;

  askTime: boolean;
  setAskTime: (v: boolean) => void;

  setTimeRange: (min: TimeValue, max: TimeValue) => void;

  createdMode: CreateMode | null;
  setCreatedMode: (m: CreateMode) => void;

  setCreatedShareCode: (code: string) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
};

export const useCreateStore = create<State>((set, get) => ({
  step: 1,

  meetingType: null,
  title: "",

  selectedDates: [],
  selectedWeekdays: [],

  askTime: false,

  minTime: "09:00",
  maxTime: "18:00",

  createdShareCode: null,

  isLoading: false,

  goTo: (s) => set({ step: s }),
  next: () => set((s) => ({ step: (s.step + 1) as Step })),
  back: () => set((s) => ({ step: Math.max(1, s.step - 1) as Step })),

  setMeetingType: (t) => set({ meetingType: t }),
  setTitle: (t) => set({ title: t }),

  setSelectedDates: (v) => set({ selectedDates: v }),
  setSelectedWeekdays: (v) => set({ selectedWeekdays: v }),

  setAskTime: (v) => set({ askTime: v }),

  setTimeRange: (min, max) => set({ minTime: min, maxTime: max }),

  createdMode: null,
  setCreatedMode: (m) => set({ createdMode: m }),

  setCreatedShareCode: (code) => set({ createdShareCode: code }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      step: 1,
      meetingType: null,
      title: "",
      selectedDates: [],
      selectedWeekdays: [],
      minTime: "09:00",
      maxTime: "18:00",
      createdShareCode: null,
      askTime: false,
      createdMode: null,
      isLoading: false,
    }),
}));
