"use client";
import { useEffect, useState } from "react";
import { writePsychProfile } from "@/lib/services/writePsychProfile";
import { ProfileOutput, ProfileSchema } from "@/lib/logic/schema";

export default function PsychProfileAI() {
  const [data, setData] = useState<ProfileOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generate() {
      try {
        const hash = typeof window !== "undefined" ? localStorage.getItem("gz_full_hash") : null;
        if (!hash) {
          setError("No results in localStorage");
          setLoading(false);
          return;
        }

        // Purge old v2 keys to prevent stale data showing extra lines
        try {
          localStorage.removeItem(`gz_psych_profile_v2_${hash}`);
          localStorage.removeItem(`gz_psych_profile_v2_lock_${hash}`);
          localStorage.removeItem(`gz_psych_profile_lock_${hash}`);
        } catch {}

        // v3 cache keys to enforce new 5-line Identity Mirror schema
        const cacheKey = `gz_psych_profile_v3_${hash}`;
        const lockKey = `gz_psych_profile_v3_lock_${hash}`;
        const now = Date.now();
        const lockRaw = localStorage.getItem(lockKey);
        const lockIsFresh = !!lockRaw && now - Number(lockRaw) < 120000; // 2 minutes

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const validated = ProfileSchema.safeParse(parsed);
            if (validated.success) {
              setData(validated.data);
              setLoading(false);
              return;
            }
          } catch {}
          // If cached is invalid, fall through to regenerate
        }

        if (lockIsFresh) {
          // Another instance is generating; poll for cache instead of regenerating
          const start = Date.now();
          const maxWaitMs = 60000; // 60s
          const interval = setInterval(() => {
            const ready = localStorage.getItem(cacheKey);
            if (ready) {
              try {
                const parsed = JSON.parse(ready);
                const validated = ProfileSchema.safeParse(parsed);
                if (validated.success) {
                  clearInterval(interval);
                  setData(validated.data);
                  setLoading(false);
                  return;
                }
              } catch {}
            }
            if (Date.now() - start > maxWaitMs) {
              clearInterval(interval);
              setError("Profile generation timed out");
              setLoading(false);
            }
          }, 500);
          return;
        }

        // Acquire lock
        try { localStorage.setItem(lockKey, String(now)); } catch {}

        const result = await writePsychProfile(async ({ system, user, temperature }) => {
          const res = await fetch("/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ system, user, temperature }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "LLM call failed");
          return json.text;
        });
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {}
        setData(result);
      } catch (e: any) {
        setError(e.message || "Failed to generate profile");
      } finally {
        setLoading(false);
        try {
          const h = localStorage.getItem("gz_full_hash");
          if (h) localStorage.removeItem(`gz_psych_profile_v3_lock_${h}`);
        } catch {}
      }
    }
    generate();
  }, []);

  if (loading) {
    return (
      <section className="card mt16">
        <h3>AI Psychological Profile</h3>
        <p className="muted">Generating your profile from localStorage data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card mt16">
        <h3>AI Psychological Profile</h3>
        <p style={{ color: "#ff7675" }}>Error: {error}</p>
      </section>
    );
  }

  if (!data) return null;

  const linesRaw = Array.isArray((data as any)?.lines) ? (data as any).lines as string[] : [];
  const lines = linesRaw.slice(0, 5);
  const hash = typeof window !== "undefined" ? localStorage.getItem("gz_full_hash") : "unknown";

  return (
    <section className="card mt16" style={{ maxWidth: "80ch", marginLeft: "auto", marginRight: "auto" }}>
      <h3>AI Psychological Profile</h3>
      
      <ol style={{ marginTop: 16, color: "#d6e5ff", fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
        {lines.map((l, i) => (
          <li key={i} style={{ margin: '6px 0' }}>{l}</li>
        ))}
      </ol>

      <footer style={{ marginTop: 24, fontSize: 11, opacity: 0.5, color: "#9aa3ad" }}>
        suiteHash: {hash?.slice(0, 12)}...
      </footer>
    </section>
  );
}
