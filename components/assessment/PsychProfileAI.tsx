"use client";
import { useEffect, useState } from "react";
import { writePsychProfile } from "@/lib/services/writePsychProfile";
import { ProfileOutput } from "@/lib/logic/schema";

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

        const cacheKey = `gz_psych_profile_${hash}`;
        const lockKey = `gz_psych_profile_lock_${hash}`;
        const now = Date.now();
        const lockRaw = localStorage.getItem(lockKey);
        const lockIsFresh = !!lockRaw && now - Number(lockRaw) < 120000; // 2 minutes

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        }

        if (lockIsFresh) {
          // Another instance is generating; poll for cache instead of regenerating
          const start = Date.now();
          const maxWaitMs = 60000; // 60s
          const interval = setInterval(() => {
            const ready = localStorage.getItem(cacheKey);
            if (ready) {
              clearInterval(interval);
              setData(JSON.parse(ready));
              setLoading(false);
            } else if (Date.now() - start > maxWaitMs) {
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
          if (h) localStorage.removeItem(`gz_psych_profile_lock_${h}`);
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

  const s = data.sections;
  const hash = typeof window !== "undefined" ? localStorage.getItem("gz_full_hash") : "unknown";

  return (
    <section className="card mt16" style={{ maxWidth: "80ch", marginLeft: "auto", marginRight: "auto" }}>
      <h3>AI Psychological Profile</h3>
      
      <div style={{ marginTop: 24, fontSize: 14, lineHeight: 1.7, color: "#d6e5ff" }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#9aa3ad", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Core Orientation
        </h4>
        <p style={{ margin: 0 }}>{s.core}</p>

        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#9aa3ad", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Emotional Regulation
        </h4>
        <p style={{ margin: 0 }}>{s.emotion}</p>

        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#9aa3ad", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Social Style
        </h4>
        <p style={{ margin: 0 }}>{s.social}</p>

        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#9aa3ad", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Interpersonal Values
        </h4>
        <p style={{ margin: 0 }}>{s.values}</p>

        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#9aa3ad", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Cognitive Style
        </h4>
        <p style={{ margin: 0 }}>{s.cognition}</p>

        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#9aa3ad", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Motivational Drivers
        </h4>
        <p style={{ margin: 0 }}>{s.motivation}</p>

        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#9aa3ad", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Summary Pattern
        </h4>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: "#9aa3ad" }}>Strengths:</strong>
            <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
              {s.summary.strengths.map((str, i) => (
                <li key={i}>{str}</li>
              ))}
            </ul>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ color: "#9aa3ad" }}>Risks:</strong>
            <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
              {s.summary.risks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong style={{ color: "#9aa3ad" }}>Growth:</strong>
            <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
              {s.summary.growth.map((grow, i) => (
                <li key={i}>{grow}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <footer style={{ marginTop: 24, fontSize: 11, opacity: 0.5, color: "#9aa3ad" }}>
        suiteHash: {hash?.slice(0, 12)}...
      </footer>
    </section>
  );
}
