"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TrackType = "answer" | "back" | "resume" | "checkpoint";
type TrackPayload = {
  itemIndex?: number;
  itemId?: string;
  answeredCount?: number;
  correct?: boolean;
};

/**
 * Fire-and-forget funnel telemetry for an assessment run. Creates one session
 * on mount (guarded against StrictMode double-invoke) and reports lightweight
 * events. Every network call swallows its errors — telemetry must never throw
 * into the quiz UX.
 */
export function useAssessmentSession(opts: {
  kind: "eval" | "iq";
  subjectKey: string;
  totalItems: number;
  enabled: boolean;
  /**
   * When a session was already created server-side, pass its id here. The hook
   * then adopts it (so the SAME nonce is used for display and scoring) and does
   * NOT create a second session — it just returns a working `track`.
   */
  existingSessionId?: string | null;
}): {
  sessionId: string | null;
  track: (type: TrackType, payload?: TrackPayload) => void;
} {
  const { kind, subjectKey, totalItems, enabled, existingSessionId } = opts;

  const [sessionId, setSessionId] = useState<string | null>(existingSessionId ?? null);
  const startedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(existingSessionId ?? null);
  const lastItemAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    lastItemAtRef.current = Date.now();
    // A server-provided session id short-circuits creation: adopt it and skip
    // the POST so we never spin up a duplicate session (or a mismatched nonce).
    if (existingSessionId) {
      sessionIdRef.current = existingSessionId;
      setSessionId(existingSessionId);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/assessments/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, subjectKey, totalItems }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (typeof json.sessionId === "string") {
          sessionIdRef.current = json.sessionId;
          setSessionId(json.sessionId);
        }
      } catch {
        /* telemetry is best-effort */
      }
    })();
    // Intentionally only keyed on `enabled`: the session must be created once
    // and must not be recreated if totalItems (or other opts) change later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const track = useCallback((type: TrackType, payload?: TrackPayload) => {
    const id = sessionIdRef.current;
    if (!id) return;
    const now = Date.now();
    const msOnItem = type === "answer" ? now - lastItemAtRef.current : undefined;
    if (type === "answer") lastItemAtRef.current = now;
    try {
      fetch("/api/assessments/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, type, ...payload, msOnItem }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* telemetry is best-effort */
    }
  }, []);

  return { sessionId, track };
}
