export interface DraftSubmissionActionState {
  status: "idle" | "error";
  message: string;
}

export const initialDraftSubmissionActionState: DraftSubmissionActionState = {
  status: "idle",
  message: "",
};
