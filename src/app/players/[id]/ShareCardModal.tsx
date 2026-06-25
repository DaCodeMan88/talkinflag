"use client";

import { useState } from "react";

type Props = {
  playerId: string;
  playerName: string;
  position: string | null;
  school: string | null;
  gradYear: number | null;
  rankNational: number | null;
  photoUrl: string | null;
  heightIn: number | null;
  weightLbs: number | null;
  level: string | null;
  verifiedStatKeys: string[];
  fortyYard: string | null;
  verticalJump: string | null;
};

// card width constraint — imperial only (dual-unit strings overflow the fixed card)
function formatHeightImperial(h: number): string {
  const ft = Math.floor(h / 12);
  const inch = h % 12;
  return `${ft}'${inch}"`;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none">
      <span className="text-white/70 text-sm">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: "40px",
          height: "22px",
          borderRadius: "11px",
          backgroundColor: checked ? "#FDDD58" : "rgba(255,255,255,0.15)",
          position: "relative",
          cursor: "pointer",
          transition: "background-color 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "21px" : "3px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: checked ? "#000000" : "rgba(255,255,255,0.5)",
            transition: "left 0.2s",
          }}
        />
      </div>
    </label>
  );
}

function LockedToggle({ label, reason }: { label: string; reason: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.4 }} title={reason}>
      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", letterSpacing: "0.05em" }}>LOCKED</span>
        <div style={{ width: "40px", height: "22px", borderRadius: "11px", backgroundColor: "rgba(255,255,255,0.1)", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: "3px", left: "3px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>
    </div>
  );
}

export default function ShareCardModal(props: Props) {
  const { playerId, playerName, position, school, gradYear, rankNational, photoUrl, heightIn, weightLbs, level, verifiedStatKeys, fortyYard, verticalJump } = props;

  const isHeightVerified = verifiedStatKeys.includes("height_in");
  const isWeightVerified = verifiedStatKeys.includes("weight_lbs");
  const isFortyVerified = verifiedStatKeys.includes("forty_yard");
  const isVerticalVerified = verifiedStatKeys.includes("vertical_jump");

  const [open, setOpen] = useState(false);
  const [showPhoto, setShowPhoto] = useState(!!photoUrl);
  const [showSchool, setShowSchool] = useState(true);
  const [showClassYear, setShowClassYear] = useState(true);
  const [showRank, setShowRank] = useState(!!rankNational);
  const [showHeight, setShowHeight] = useState(isHeightVerified);
  const [showWeight, setShowWeight] = useState(isWeightVerified);
  const [showForty, setShowForty] = useState(isFortyVerified);
  const [showVertical, setShowVertical] = useState(isVerticalVerified);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const initials = playerName
    .split(" ")
    .map((n) => n[0] ?? "")
    .slice(0, 2)
    .join("");

  const levelFormatted = level
    ? level.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const statsRow = [
    // card width constraint — imperial only
    showHeight && heightIn ? formatHeightImperial(heightIn) : null,
    showWeight && weightLbs ? `${weightLbs} lbs` : null,
    showForty && fortyYard ? `${fortyYard}s 40yd` : null,
    showVertical && verticalJump ? `${verticalJump} vert` : null,
  ].filter(Boolean).join("  ·  ");

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyEmbed() {
    const embedUrl = `https://talkinflag.com/players/${playerId}/embed`;
    const snippet = `<iframe src="${embedUrl}" width="400" height="240" frameborder="0" style="border:none;overflow:hidden" scrolling="no" title="${playerName} | Talkin Flag"></iframe>`;
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    });
  }

  return (
    <>
      {/* Floating share button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#FDDD58",
          color: "#000000",
          border: "none",
          padding: "12px 20px",
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          cursor: "pointer",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 24px rgba(253,221,88,0.3)",
        }}
      >
        ↗ Share Card
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              display: "flex",
              gap: "32px",
              padding: "32px",
              position: "relative",
              maxWidth: "820px",
              width: "100%",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                backgroundColor: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                fontSize: "20px",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            {/* Left: Card preview */}
            <div style={{ flexShrink: 0 }}>
              {/* 500x263 — half of 1000x526 (16:9-ish) */}
              <div
                style={{
                  width: "500px",
                  height: "263px",
                  backgroundColor: "#000000",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  fontFamily: "sans-serif",
                }}
              >
                {/* Yellow top border */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", backgroundColor: "#FDDD58" }} />

                {/* Left accent */}
                <div style={{ position: "absolute", left: "30px", top: "24px", bottom: "24px", width: "2px", backgroundColor: "#FDDD58" }} />

                {/* Grid lines */}
                <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.03 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, borderRight: "1px solid #FDDD58" }} />
                  ))}
                </div>

                {/* Yellow glow */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-50px",
                    right: "-50px",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    backgroundColor: "#FDDD58",
                    opacity: 0.07,
                  }}
                />

                {/* Text column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "28px 20px 28px 44px",
                    width: showPhoto && photoUrl ? "310px" : "460px",
                    height: "100%",
                    justifyContent: "space-between",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#FDDD58" }} />
                      <span style={{ color: "#FDDD58", fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
                        TALKIN FLAG
                      </span>
                    </div>
                    {showRank && rankNational && (
                      <div
                        style={{
                          backgroundColor: "#FDDD58",
                          color: "#000000",
                          fontSize: "10px",
                          fontWeight: 900,
                          letterSpacing: "0.05em",
                          padding: "3px 8px",
                        }}
                      >
                        #{rankNational} NATIONALLY
                      </div>
                    )}
                  </div>

                  {/* Name + badges */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: playerName.length > 20 ? "26px" : "32px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: 1.0,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {playerName}
                    </span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      {position && (
                        <div
                          style={{
                            backgroundColor: "#FDDD58",
                            color: "#000000",
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            padding: "2px 8px",
                            textTransform: "uppercase",
                          }}
                        >
                          {position}
                        </div>
                      )}
                      {levelFormatted && (
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {levelFormatted}
                        </span>
                      )}
                    </div>
                    {showSchool && school && (
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {school}
                      </span>
                    )}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      {showClassYear && gradYear && (
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          Class of {gradYear}
                        </span>
                      )}
                      {statsRow && (
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {statsRow}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Watermark */}
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                    talkinflag.com/players
                  </span>
                </div>

                {/* Photo column */}
                {showPhoto && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "190px",
                      height: "100%",
                      position: "absolute",
                      right: 0,
                      top: 0,
                    }}
                  >
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={playerName}
                        style={{
                          width: "120px",
                          height: "120px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid #FDDD58",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "120px",
                          height: "120px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(253,221,88,0.15)",
                          border: "3px solid #FDDD58",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ color: "#FDDD58", fontSize: "30px", fontWeight: 900 }}>{initials}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Note below card */}
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "10px", textAlign: "center" }}>
                Screenshot this card to share on Instagram
              </p>
            </div>

            {/* Right: Controls */}
            <div style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h2 style={{ color: "#FDDD58", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", margin: 0, marginBottom: "16px" }}>
                  Customize Your Card
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <Toggle label="Show Photo" checked={showPhoto} onChange={setShowPhoto} />
                  <Toggle label="Show School" checked={showSchool} onChange={setShowSchool} />
                  <Toggle label="Show Class Year" checked={showClassYear} onChange={setShowClassYear} />
                  <Toggle label="Show National Rank" checked={showRank} onChange={setShowRank} />
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", marginTop: "14px" }}>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px 0" }}>
                    Verified Stats
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {isHeightVerified
                      ? <Toggle label="Height" checked={showHeight} onChange={setShowHeight} />
                      : <LockedToggle label="Height" reason="Submit and get height verified to unlock" />
                    }
                    {isWeightVerified
                      ? <Toggle label="Weight" checked={showWeight} onChange={setShowWeight} />
                      : <LockedToggle label="Weight" reason="Submit and get weight verified to unlock" />
                    }
                    {isFortyVerified
                      ? <Toggle label="40-Yd Dash" checked={showForty} onChange={setShowForty} />
                      : <LockedToggle label="40-Yd Dash" reason="Submit and get 40-yard verified to unlock" />
                    }
                    {isVerticalVerified
                      ? <Toggle label="Vertical Jump" checked={showVertical} onChange={setShowVertical} />
                      : <LockedToggle label="Vertical Jump" reason="Submit and get vertical jump verified to unlock" />
                    }
                  </div>
                  {(!isHeightVerified || !isWeightVerified || !isFortyVerified || !isVerticalVerified) && (
                    <p style={{ color: "rgba(253,221,88,0.5)", fontSize: "10px", marginTop: "8px" }}>
                      🔒 Verify more stats to unlock all toggles →{" "}
                      <a href="/dashboard/verify" style={{ color: "#FDDD58", textDecoration: "underline" }}>Get verified</a>
                    </p>
                  )}
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Copy profile link */}
                <button
                  onClick={handleCopy}
                  style={{
                    backgroundColor: copied ? "rgba(253,221,88,0.15)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${copied ? "#FDDD58" : "rgba(255,255,255,0.15)"}`,
                    color: copied ? "#FDDD58" : "rgba(255,255,255,0.8)",
                    padding: "10px 16px",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s",
                    width: "100%",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy Profile Link"}
                </button>

                {/* Share on X */}
                <a
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Check out ${playerName}${position ? ` (${position})` : ""} on @TalkinFlagShow 🏈`)}&url=${encodeURIComponent(`https://talkinflag.com/players/${playerId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: "#000",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "10px 16px",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    textDecoration: "none",
                    width: "100%",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 1200 1227" fill="currentColor">
                    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
                  </svg>
                  Share on X
                </a>

                {/* Share on LinkedIn */}
                <button
                  onClick={() => {
                    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://talkinflag.com/players/${playerId}`)}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: "#0A66C2",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 16px",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Share on LinkedIn
                </button>

                {/* Copy embed code */}
                <button
                  onClick={handleCopyEmbed}
                  style={{
                    backgroundColor: copiedEmbed ? "rgba(253,221,88,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${copiedEmbed ? "#FDDD58" : "rgba(255,255,255,0.1)"}`,
                    color: copiedEmbed ? "#FDDD58" : "rgba(255,255,255,0.5)",
                    padding: "10px 16px",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s",
                    width: "100%",
                  }}
                >
                  {copiedEmbed ? "✓ Embed Code Copied!" : "Copy Embed Code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
