"use client";

import { useState } from "react";

type Props = {
  coachId: string;
  coachName: string;
  team: string;
  level: string;
  title: string | null;
  yearsCoaching: number | null;
  wins: number | null;
  losses: number | null;
  philosophy: string | null;
  bio: string | null;
};

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
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
    <div style={{ opacity: 0.4 }}>
      <div className="flex items-center justify-between select-none">
        <span className="text-white/70 text-sm">{label}</span>
        <div
          style={{
            width: "40px",
            height: "22px",
            borderRadius: "11px",
            backgroundColor: "rgba(255,255,255,0.15)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "3px",
              left: "3px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.5)",
            }}
          />
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "4px" }}>
        {reason}
      </p>
    </div>
  );
}

export default function CoachShareCard(props: Props) {
  const { coachId, coachName, team, level, title, yearsCoaching, wins, losses, philosophy } = props;

  const [open, setOpen] = useState(false);
  const [showRecord, setShowRecord] = useState(wins !== null);
  const [showYears, setShowYears] = useState(yearsCoaching !== null);
  const [showPhilosophy, setShowPhilosophy] = useState(!!philosophy);
  const [copied, setCopied] = useState(false);

  const levelFormatted = level
    ? level.replaceAll("_", " ").toUpperCase()
    : null;

  const record =
    wins !== null && losses !== null
      ? `${wins}W — ${losses}L`
      : wins !== null
      ? `${wins}W`
      : null;

  const truncatedPhilosophy =
    philosophy && philosophy.length > 80
      ? philosophy.slice(0, 77) + "…"
      : philosophy;

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/coaches/${coachId}`
      : `https://talkinflag.com/coaches/${coachId}`;

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
      "_blank"
    );
  }

  return (
    <>
      {/* Floating share button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
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
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#FDDD58",
                  }}
                />

                {/* Left accent */}
                <div
                  style={{
                    position: "absolute",
                    left: "30px",
                    top: "24px",
                    bottom: "24px",
                    width: "2px",
                    backgroundColor: "#FDDD58",
                  }}
                />

                {/* Grid lines */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    opacity: 0.03,
                  }}
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ flex: 1, borderRight: "1px solid #FDDD58" }}
                    />
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
                    padding: "20px 20px 20px 44px",
                    width: "460px",
                    height: "100%",
                    justifyContent: "space-between",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {/* Top row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          backgroundColor: "#FDDD58",
                        }}
                      />
                      <span
                        style={{
                          color: "#FDDD58",
                          fontSize: "8px",
                          letterSpacing: "0.3em",
                          textTransform: "uppercase",
                        }}
                      >
                        TALKIN FLAG
                      </span>
                    </div>
                    {levelFormatted && (
                      <div
                        style={{
                          backgroundColor: "#FDDD58",
                          color: "#000000",
                          fontSize: "9px",
                          fontWeight: 900,
                          letterSpacing: "0.05em",
                          padding: "3px 8px",
                          textTransform: "uppercase",
                        }}
                      >
                        {levelFormatted}
                      </div>
                    )}
                  </div>

                  {/* Name + title + team */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: "5px" }}
                  >
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: coachName.length > 20 ? "26px" : "32px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: 1.0,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {coachName}
                    </span>
                    {title && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {title}
                      </span>
                    )}
                    <span
                      style={{
                        color: "#FDDD58",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                      }}
                    >
                      {team}
                    </span>

                    {/* Stats row */}
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                        marginTop: "2px",
                      }}
                    >
                      {showRecord && record && (
                        <span
                          style={{
                            color: "#FFFFFF",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {record}
                        </span>
                      )}
                      {showYears && yearsCoaching !== null && (
                        <span
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "9px",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {yearsCoaching} YRS COACHING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: philosophy + watermark */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                    }}
                  >
                    {showPhilosophy && truncatedPhilosophy ? (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.45)",
                          fontSize: "8px",
                          fontStyle: "italic",
                          maxWidth: "300px",
                          lineHeight: 1.4,
                          letterSpacing: "0.02em",
                        }}
                      >
                        &ldquo;{truncatedPhilosophy}&rdquo;
                      </span>
                    ) : (
                      <span />
                    )}
                    <span
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        fontSize: "7px",
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        flexShrink: 0,
                      }}
                    >
                      talkinflag.com
                    </span>
                  </div>
                </div>
              </div>

              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "11px",
                  marginTop: "10px",
                  textAlign: "center",
                }}
              >
                Screenshot this card to share on Instagram
              </p>
            </div>

            {/* Right: Controls */}
            <div
              style={{
                width: "240px",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    color: "#FDDD58",
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    margin: 0,
                    marginBottom: "16px",
                  }}
                >
                  Customize Your Card
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {wins !== null ? (
                    <Toggle
                      label="Show Record"
                      checked={showRecord}
                      onChange={setShowRecord}
                    />
                  ) : (
                    <LockedToggle
                      label="Show Record"
                      reason="Add your record in your profile to unlock"
                    />
                  )}

                  {yearsCoaching !== null ? (
                    <Toggle
                      label="Show Years Coaching"
                      checked={showYears}
                      onChange={setShowYears}
                    />
                  ) : (
                    <LockedToggle
                      label="Show Years Coaching"
                      reason="Add years coaching in your profile to unlock"
                    />
                  )}

                  {philosophy ? (
                    <Toggle
                      label="Show Philosophy"
                      checked={showPhilosophy}
                      onChange={setShowPhilosophy}
                    />
                  ) : (
                    <LockedToggle
                      label="Show Philosophy"
                      reason="Add a coaching philosophy to unlock"
                    />
                  )}
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  paddingTop: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  onClick={handleCopy}
                  style={{
                    backgroundColor: copied
                      ? "rgba(253,221,88,0.15)"
                      : "rgba(255,255,255,0.08)",
                    border: `1px solid ${copied ? "#FDDD58" : "rgba(255,255,255,0.15)"}`,
                    color: copied ? "#FDDD58" : "rgba(255,255,255,0.8)",
                    padding: "10px 16px",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy Profile Link"}
                </button>

                <button
                  onClick={handleLinkedIn}
                  style={{
                    backgroundColor: "#0A66C2",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "10px 16px",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Share on LinkedIn
                </button>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "rgba(253,221,88,0.6)",
                    fontSize: "10px",
                    textAlign: "center",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  View Public Profile →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
