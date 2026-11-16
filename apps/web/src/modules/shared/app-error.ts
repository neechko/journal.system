export type AppErrorCode =
  | "DATABASE_NOT_CONFIGURED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_INTEGRITY_FAILURE"
  | "INVALID_STATE_TRANSITION"
  | "INVALID_STATE"
  | "SEARCH_INIT_FAILED";

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
