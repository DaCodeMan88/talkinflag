"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="newsletter" className="bg-[#111111] py-20 px-6" aria-label="Newsletter signup">
      <ScrollReveal direction="up">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-5xl uppercase text-brand-white">
          Stay in the Game
        </h2>
        <p className="mt-4 text-brand-white/60">
          Weekly flag football news, new episodes, player rankings, and event updates.
        </p>
        {status === "success" ? (
          <p className="mt-8 text-brand-yellow font-display text-lg uppercase tracking-widest" role="status">
            You&apos;re in. Welcome to the community.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex gap-3 max-w-sm mx-auto" aria-label="Newsletter signup form">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-brand-black border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              required
              aria-required="true"
            />
            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "..." : "Join"}
            </Button>
            {status === "error" && (
              <p className="sr-only" role="alert">Something went wrong. Please try again.</p>
            )}
          </form>
        )}
      </div>
      </ScrollReveal>
    </section>
  );
}
