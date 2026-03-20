import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearRecoveryDirty,
  markRecoveryDirty,
  storeBuffer,
  type StoredNoteRecord,
} from "@/store";
import type { SaveStatus } from "@/types/status";

const SAVE_DELAY_MS = 200;

const SAVED_STATUS: SaveStatus = { state: "saved", message: "Saved" };

interface UseSaveQueueArgs {
  initialState?: SaveStatus;
}

export function useSaveQueue({ initialState = SAVED_STATUS }: UseSaveQueueArgs = {}) {
  const [status, setStatus] = useState<SaveStatus>(initialState);
  const pendingValueRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const flush = useCallback(async () => {
    if (inFlightRef.current) return;
    const value = pendingValueRef.current;
    if (value === null) return;

    inFlightRef.current = true;
    setStatus({ state: "saving", message: "Saving..." });

    try {
      await storeBuffer(value);
      pendingValueRef.current = null;
      clearRecoveryDirty();
      setStatus(SAVED_STATUS);
    } catch (error) {
      console.error("Failed to persist buffer", error);
      setStatus({ state: "error", message: "Save failed" });
    } finally {
      inFlightRef.current = false;
      if (pendingValueRef.current !== null) {
        void flush();
      }
    }
  }, []);

  const schedule = useCallback(
    (value: string) => {
      pendingValueRef.current = value;
      markRecoveryDirty();
      setStatus({ state: "saving", message: "Saving..." });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, SAVE_DELAY_MS);
    },
    [flush]
  );

  const hydrateStatus = useCallback((note: StoredNoteRecord | null) => {
    if (!note) return;
    setStatus(SAVED_STATUS);
  }, []);

  useEffect(() => {
    const flushOnHidden = () => {
      if (document.visibilityState === "hidden") {
        void flush();
      }
    };
    const flushOnUnload = () => {
      void flush();
    };
    document.addEventListener("visibilitychange", flushOnHidden);
    window.addEventListener("beforeunload", flushOnUnload);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", flushOnHidden);
      window.removeEventListener("beforeunload", flushOnUnload);
    };
  }, [flush]);

  return { status, schedule, flush, hydrateStatus };
}
