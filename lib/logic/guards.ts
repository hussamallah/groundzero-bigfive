import { ProfileOutput } from "./schema";
import { GZFacts } from "../data/buildPayload";

export function enforceGuards(facts: GZFacts, out: ProfileOutput): ProfileOutput {
  // New format: out.lines (8–10)
  let lines = Array.isArray((out as any).lines) ? [...(out as any).lines] : [];

  const O = facts.domains.O, C = facts.domains.C, E = facts.domains.E, A = facts.domains.A, N = facts.domains.N;
  const has = (text: string) => lines.some(l => l.toLowerCase().includes(text.toLowerCase()));
  const addOnce = (text: string) => { if (!has(text)) lines.push(text); };
  const replaceOrAddAt = (idx: number, text: string) => {
    if (idx >= 0 && idx < lines.length) lines[idx] = text; else lines.push(text);
  };

  // Ensure fixed ending cues
  const endCue = "Start now. One tap.";
  const noiseCue = "We cleared the noise. Here’s the next move.";
  if (!has(noiseCue)) lines.push(noiseCue);
  if (!has(endCue)) lines.push(endCue);

  // Pressure line requirement
  const highAnx = N.bucket["Anxiety"] === "High";
  const highAng = N.bucket["Anger"] === "High";
  if (highAnx || highAng) {
    const pressureLine = "Static and slow rules flip your stress switch.";
    // Ensure exactly one pressure line present
    const isPressure = (l: string) => /stress|pressure/i.test(l);
    const existing = lines.filter(isPressure);
    if (existing.length === 0) {
      // Place before the two fixed endings if possible
      const insertIdx = Math.max(0, lines.length - 2);
      lines.splice(insertIdx, 0, pressureLine);
    } else if (existing.length > 1) {
      // Keep the first, remove the rest
      let kept = false;
      lines = lines.filter(l => {
        if (!isPressure(l)) return true;
        if (!kept) { kept = true; return true; }
        return false;
      });
    }
  }

  // Own-read line when Cooperation or Morality Low
  if (A.bucket["Cooperation"] === "Low" || A.bucket["Morality"] === "Low") {
    addOnce("You trust your own read more than group talk.");
  }

  // Finish line when Self-Efficacy High
  if (C.bucket["Self-Efficacy"] === "High") {
    addOnce("You want one target, one finish, proof in hand.");
  }

  // Direct push lead when Assertiveness High and Friendliness High (make it first)
  if (E.bucket["Assertiveness"] === "High" && E.bucket["Friendliness"] === "High") {
    const lead = "You move first. Direct push is your default.";
    if (!has(lead)) lines.unshift(lead);
  }

  // Visuals / clear path when Imagination or Artistic Interests High
  if (O.bucket["Imagination"] === "High" || O.bucket["Artistic Interests"] === "High") {
    addOnce("You see the path when the picture is clear.");
  }

  // Trim to 10 max and ensure at least 8 by prioritizing core cues
  // Priority: lead, speed/finish, pressure, own-read, visuals, noiseCue, endCue
  const priorityOrder = [
    "You move first. Direct push is your default.",
    "You want one target, one finish, proof in hand.",
    "Static and slow rules flip your stress switch.",
    "You trust your own read more than group talk.",
    "You see the path when the picture is clear.",
    noiseCue,
    endCue,
  ];
  // Deduplicate while keeping order
  const seen = new Set<string>();
  lines = lines.filter(l => { const k = l.trim(); if (seen.has(k)) return false; seen.add(k); return true; });
  // If over 10, keep priority lines then fill remaining in original order
  if (lines.length > 10) {
    const mustKeep = lines.filter(l => priorityOrder.includes(l));
    const others = lines.filter(l => !priorityOrder.includes(l));
    lines = mustKeep.concat(others).slice(0, 10);
  }
  // If under 8, duplicate neutral cues (avoid infinite loop)
  while (lines.length < 8) {
    lines.splice(Math.max(0, lines.length - 1), 0, "You work best with clear ownership.");
    if (lines.length >= 8) break;
  }
  // Ensure last line is the end cue
  if (lines[lines.length - 1] !== endCue) {
    // Remove any existing endCue and push it
    lines = lines.filter(l => l !== endCue);
    lines.push(endCue);
  }

  return { lines } as ProfileOutput;
}


