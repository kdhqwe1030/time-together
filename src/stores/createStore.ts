import { create } from "zustand";

type Step = 1 | 2 | 3 | 4 | 5;

type MeetingType = "ONE" | "RECURRING";

type CreateState = {
  step: Step;

  meetingType: MeetingType | null;
  title: string;
  withTime: boolean | null;

  next: () => void;
  back: () => void;

  setMeetingType: (v: MeetingType) => void;
  setTitle: (v: string) => void;
  setWithTime: (v: boolean) => void;

  reset: () => void;
};

export const useCreateStore = create<CreateState>((set, get) => ({
  step: 1,

  meetingType: null,
  title: "",
  withTime: null,

  next: () => set({ step: Math.min(get().step + 1, 5) as Step }),
  back: () => set({ step: Math.max(get().step - 1, 1) as Step }),

  setMeetingType: (v) => set({ meetingType: v }),
  setTitle: (v) => set({ title: v }),
  setWithTime: (v) => set({ withTime: v }),

  reset: () =>
    set({
      step: 1,
      meetingType: null,
      title: "",
      withTime: null,
    }),
}));
