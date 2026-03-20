export type SaveState = "idle" | "saving" | "saved" | "error";

export interface SaveStatus {
  state: SaveState;
  message: string;
}

export type CompileState = "idle" | "compiling" | "compiled" | "failed";

export interface CompileStatus {
  state: CompileState;
  message: string;
  lastDurationMs?: number;
}
