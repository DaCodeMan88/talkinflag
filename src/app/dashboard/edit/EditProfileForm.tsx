"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PlayerFormData {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  bio: string;
  instagram: string;
  highlight_url: string;
  height_in: number | null;
  weight_lbs: number | null;
  wingspan_in: number | null;
  forty_yard: string;
  vertical_jump: number | null;
  years_active: number | null;
  occupation: string;
  education: string;
}

function heightFromInches(inches: number | null): { ft: string; in: string } {
  if (!inches) return { ft: "", in: "" };
  return { ft: String(Math.floor(inches / 12)), in: String(inches % 12) };
}

function inchesFromHeight(ft: string, inches: string): number | null {
  const f = parseInt(ft);
  const i = parseInt(inches);
  if (isNaN(f) || isNaN(i)) return null;
  const total = f * 12 + i;
  return total >= 48 && total <= 96 ? total : null;
}

export default function EditProfileForm({ player }: { player: PlayerFormData }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initHeight = heightFromInches(player.height_in);
  const [heightFt, setHeightFt] = useState(initHeight.ft);
  const [heightIn, setHeightIn] = useState(initHeight.in);

  const [bio, setBio] = useState(player.bio);
  const [instagram, setInstagram] = useState(player.instagram);
  const [highlightUrl, setHighlightUrl] = useState(player.highlight_url);
  const [weightLbs, setWeightLbs] = useState(player.weight_lbs ? String(player.weight_lbs) : "");
  const [wingspanIn, setWingspanIn] = useState(player.wingspan_in ? String(player.wingspan_in) : "");
  const [fortyYard, setFortyYard] = useState(player.forty_yard);
  const [verticalJump, setVerticalJump] = useState(player.vertical_jump ? String(player.vertical_jump) : "");
  const [yearsActive, setYearsActive] = useState(player.years_active ? String(player.years_active) : "");
  const [occupation, setOccupation] = useState(player.occupation);
  const [education, setEducation] = useState(player.education);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(player.photo_url);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPhotoError("Must be JPG, PNG or WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Must be under 5MB");
      return;
    }
    setPhotoError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    setPhotoUploading(true);
    const form = new FormData();
    form.append("photo", photoFile);
    const res = await fetch(`/api/players/${player.id}/photo`, { method: "POST", body: form });
    setPhotoUploading(false);
    if (!res.ok) {
      const { error } = await res.json();
      setPhotoError(error ?? "Upload failed");
      return null;
    }
    const { photo_url } = await res.json();
    return photo_url as string;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    // Upload photo first if changed
    if (photoFile) {
      const url = await uploadPhoto();
      if (!url) { setSaving(false); return; }
    }

    // Save profile fields
    const res = await fetch(`/api/players/${player.id}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio,
        instagram,
        highlight_url: highlightUrl,
        height_in: inchesFromHeight(heightFt, heightIn),
        weight_lbs: weightLbs ? parseInt(weightLbs) : null,
        wingspan_in: wingspanIn ? parseInt(wingspanIn) : null,
        forty_yard: fortyYard || null,
        vertical_jump: verticalJump ? parseInt(verticalJump) : null,
        years_active: yearsActive ? parseInt(yearsActive) : null,
        occupation,
        education,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
    } else {
      setSaved(true);
      setPhotoFile(null);
      router.refresh();
    }
  }

  const completionFields = [
    photoPreview,
    bio,
    instagram,
    highlightUrl,
    heightFt,
    weightLbs,
    fortyYard,
    occupation,
  ];
  const completionPct = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  return (
    <form onSubmit={handleSave} className="space-y-10" noValidate>

      {/* ── Progress ─────────────────────────────────────────────────── */}
      <div className="bg-[#0d0d0d] border border-brand-white/10 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display uppercase tracking-widest text-brand-white/40">
            Profile Complete
          </span>
          <span className="text-xs font-display text-brand-yellow">{completionPct}%</span>
        </div>
        <div className="h-1 bg-brand-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-yellow transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* ── Identity ─────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-white/10" />
          <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">
            Identity
          </span>
          <div className="h-px flex-1 bg-brand-white/10" />
        </div>

        {/* Photo */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 group focus:outline-none"
          >
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Profile photo"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-brand-yellow/10 border-2 border-brand-yellow/30 flex items-center justify-center">
                <span className="font-display text-2xl text-brand-yellow">
                  {player.first_name[0]}{player.last_name[0]}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <CameraIcon />
              <span className="text-[9px] font-display uppercase tracking-widest text-brand-white">
                Change
              </span>
            </div>
          </button>
          <div>
            <p className="text-brand-white/60 text-sm mb-1">Profile photo</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
            >
              {photoPreview ? "Change photo" : "Upload photo"}
            </button>
            <p className="text-brand-white/25 text-xs mt-1">JPG, PNG or WebP · max 5MB</p>
            {photoError && <p className="text-red-400 text-xs mt-1">{photoError}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 400))}
            rows={3}
            placeholder="A short bio about you and your flag football career..."
            className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors resize-none"
          />
          <p className="text-brand-white/20 text-xs text-right mt-1">{bio.length}/400</p>
        </div>

        {/* Instagram */}
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
            Instagram
          </label>
          <div className="flex items-center bg-[#111111] border border-brand-white/10 focus-within:border-brand-yellow/50 transition-colors">
            <span className="pl-4 text-brand-white/30 text-sm select-none">@</span>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
              placeholder="yourhandle"
              className="flex-1 bg-transparent text-brand-white placeholder-brand-white/20 px-2 py-3 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Highlight URL */}
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
            Highlight Video
          </label>
          <input
            type="url"
            value={highlightUrl}
            onChange={(e) => setHighlightUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or hudl.com link"
            className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
          />
        </div>
      </section>

      {/* ── Measurables ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-white/10" />
          <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">
            Measurables
          </span>
          <div className="h-px flex-1 bg-brand-white/10" />
        </div>
        <div className="bg-brand-yellow/5 border border-brand-yellow/15 px-4 py-3 text-brand-white/40 text-xs leading-relaxed">
          These appear on your public profile as <span className="text-brand-white/60">self-reported</span>.
          Once you submit for verification they can earn a <span className="text-brand-yellow">✓ Verified</span> badge.
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Height */}
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              Height
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="5"
                  min={4} max={7}
                  className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">ft</span>
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="8"
                  min={0} max={11}
                  className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">in</span>
              </div>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              Weight
            </label>
            <div className="relative">
              <input
                type="number"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                placeholder="145"
                min={80} max={400}
                className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">lbs</span>
            </div>
          </div>

          {/* Wingspan */}
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              Wingspan
            </label>
            <div className="relative">
              <input
                type="number"
                value={wingspanIn}
                onChange={(e) => setWingspanIn(e.target.value)}
                placeholder="68"
                min={48} max={108}
                className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">in</span>
            </div>
          </div>

          {/* 40-yard */}
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              40-Yard Dash
            </label>
            <div className="relative">
              <input
                type="number"
                value={fortyYard}
                onChange={(e) => setFortyYard(e.target.value)}
                placeholder="4.6"
                min={3.5} max={8}
                step={0.01}
                className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">sec</span>
            </div>
          </div>

          {/* Vertical */}
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              Vertical Jump
            </label>
            <div className="relative">
              <input
                type="number"
                value={verticalJump}
                onChange={(e) => setVerticalJump(e.target.value)}
                placeholder="28"
                min={10} max={60}
                className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">in</span>
            </div>
          </div>

          {/* Years active */}
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              Years Active
            </label>
            <div className="relative">
              <input
                type="number"
                value={yearsActive}
                onChange={(e) => setYearsActive(e.target.value)}
                placeholder="5"
                min={0} max={30}
                className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">yrs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Background ───────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-white/10" />
          <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">
            Background
          </span>
          <div className="h-px flex-1 bg-brand-white/10" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              Occupation
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value.slice(0, 100))}
              placeholder="e.g. Forensic Psychologist, Student, Coach..."
              className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
              Education
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value.slice(0, 100))}
              placeholder="e.g. University of Rome, Doctorate in Psychology..."
              className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ── Save ─────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-sm px-4 py-3 font-display uppercase tracking-widest">
            Profile saved!
          </div>
        )}
        <button
          type="submit"
          disabled={saving || photoUploading}
          className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-4 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {(saving || photoUploading) && (
            <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
