"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Card-route URL (including query params) that renders the PNG. */
  imageUrl: string;
  /** Download filename, e.g. "talkin-flag-card.png". */
  fileName: string;
  /** Title passed to the native share sheet. */
  shareTitle: string;
};

/**
 * Share/download a server-rendered PNG card.
 *
 * iOS user-gesture rule: navigator.share() must run synchronously inside the
 * click's transient activation — an `await fetch()` before it silently kills
 * the share sheet on iOS Safari. So we PRE-FETCH the blob whenever `imageUrl`
 * changes (debounced) and cache a File in state; the click handler then calls
 * share()/download from the cached file with no awaits.
 */
export default function ImageShareButtons({ imageUrl, fileName, shareTitle }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canFileShare, setCanFileShare] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const reqId = useRef(0);

  // Feature-detect file sharing (desktop browsers mostly can't → show Download only).
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.canShare) return;
    try {
      const probe = new File([new Blob()], fileName, { type: "image/png" });
      setCanFileShare(navigator.canShare({ files: [probe] }));
    } catch {
      setCanFileShare(false);
    }
  }, [fileName]);

  // Pre-fetch the PNG blob whenever the URL changes (debounced ~400ms).
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(false);
    setFile(null);

    const t = setTimeout(() => {
      fetch(imageUrl)
        .then((r) => {
          if (!r.ok) throw new Error(`card ${r.status}`);
          return r.blob();
        })
        .then((blob) => {
          if (id !== reqId.current) return; // superseded by a newer request
          setFile(new File([blob], fileName, { type: "image/png" }));
          setLoading(false);
        })
        .catch(() => {
          if (id !== reqId.current) return;
          setError(true);
          setLoading(false);
        });
    }, 400);

    return () => clearTimeout(t);
  }, [imageUrl, fileName, retryTick]);

  function handleShare() {
    if (!file) return;
    // Synchronous — no awaits before share(), or iOS drops the gesture.
    navigator.share({ files: [file], title: shareTitle }).catch(() => {
      /* user cancelled — no-op */
    });
  }

  function handleDownload() {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const busy = loading || !file;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {canFileShare && (
        <button
          onClick={handleShare}
          disabled={busy}
          style={{
            backgroundColor: "#FDDD58",
            border: "none",
            color: "#000000",
            padding: "12px 16px",
            fontSize: "13px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            cursor: busy ? "wait" : "pointer",
            fontWeight: 700,
            width: "100%",
            opacity: busy ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          {busy ? "Preparing image…" : "↗ Share Image"}
        </button>
      )}

      <button
        onClick={error ? () => setRetryTick((n) => n + 1) : handleDownload}
        disabled={loading}
        style={{
          backgroundColor: canFileShare ? "rgba(255,255,255,0.08)" : "#FDDD58",
          border: canFileShare ? "1px solid rgba(255,255,255,0.15)" : "none",
          color: canFileShare ? "rgba(255,255,255,0.85)" : "#000000",
          padding: "12px 16px",
          fontSize: "13px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          cursor: busy ? "wait" : "pointer",
          fontWeight: canFileShare ? 600 : 700,
          width: "100%",
          opacity: busy ? 0.6 : 1,
          fontFamily: "inherit",
        }}
      >
        {busy && !error ? "Preparing image…" : error ? "Retry" : "↓ Download Card"}
      </button>

      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", lineHeight: 1.4, margin: 0 }}>
        On mobile, pick Instagram in the share sheet to post to your feed or story.
      </p>
    </div>
  );
}
