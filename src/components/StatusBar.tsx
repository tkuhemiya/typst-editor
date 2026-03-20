import type { CompileStatus, SaveStatus } from "@/types/status";

interface StatusBarProps {
  saveStatus: SaveStatus;
  compileStatus: CompileStatus;
  roomId: string | null;
  userCount: number;
  connectionState?: string;
  recoveryNotice: string | null;
}

const pillClass = "rounded px-2 py-1 text-xs font-medium";

export default function StatusBar({
  saveStatus,
  compileStatus,
  roomId,
  userCount,
  connectionState,
  recoveryNotice,
}: StatusBarProps) {
  const saveClass =
    saveStatus.state === "error"
      ? "bg-red-500/20 text-red-200"
      : saveStatus.state === "saving"
        ? "bg-amber-500/20 text-amber-100"
        : "bg-emerald-500/20 text-emerald-100";

  const compileClass =
    compileStatus.state === "failed"
      ? "bg-red-500/20 text-red-200"
      : compileStatus.state === "compiling"
        ? "bg-sky-500/20 text-sky-100"
        : "bg-indigo-500/20 text-indigo-100";

  return (
    <header className="flex min-h-12 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100">
      <div className="flex items-center gap-2">
        <span className={`${pillClass} ${saveClass}`}>{saveStatus.message}</span>
        <span className={`${pillClass} ${compileClass}`}>{compileStatus.message}</span>
        {roomId ? (
          <span className={`${pillClass} bg-zinc-700 text-zinc-100`}>
            room {roomId} | peers {userCount} | {connectionState || "connecting"}
          </span>
        ) : null}
      </div>
      <div aria-live="polite" className="text-xs text-zinc-300">
        {recoveryNotice || "Ctrl/Cmd+1 editor | Ctrl/Cmd+2 preview"}
      </div>
    </header>
  );
}
