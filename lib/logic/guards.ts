import { ProfileOutput } from "./schema";
import { GZFacts } from "../data/buildPayload";

export function enforceGuards(facts: GZFacts, out: ProfileOutput): ProfileOutput {
  const O = facts.domains.O, C = facts.domains.C, E = facts.domains.E, A = facts.domains.A, N = facts.domains.N;
  const s = out.sections as ProfileOutput["sections"];

  // 1) Emotion: if Anxiety or Vulnerability = High, forbid "pressure manageable"
  const highAnx = N.bucket["Anxiety"] === "High";
  const highVul = N.bucket["Vulnerability"] === "High";
  if (highAnx || highVul) {
    s.emotion = s.emotion.replace(/pressure (is|stays) manageable\.?/gi,
      "Stress reactivity is elevated; manage load and recovery deliberately.");
  }

  // 2) Values: if Cooperation = Low, forbid “cooperation is a strength”
  if (A.bucket["Cooperation"] === "Low") {
    s.values = s.values
      .replace(/cooperation (is )?(a )?strength\.?/gi, "")
      .trim();
    if (!/clarity|consensus/i.test(s.values)) {
      s.values = (s.values ? s.values + " " : "") +
        "You will not align for comfort alone; clarity beats consensus.";
    }
  }

  // 3) Social: if Gregariousness = Low, forbid “highly gregarious”
  if (E.bucket["Gregariousness"] === "Low") {
    s.social = s.social.replace(/high(ly)? gregarious\.?/gi, "You select rooms; large groups drain you.");
  }

  // 4) Summary corrections
  const addOnce = (arr: string[], item: string) => (arr.includes(item) ? arr : [...arr, item]);

  if (highAnx || highVul) {
    s.summary.risks = addOnce(s.summary.risks, "High anxiety or vulnerability");
  }
  if (C.bucket["Self-Discipline"] === "Low") {
    s.summary.risks = addOnce(s.summary.risks, "Low self-discipline");
  }
  if (C.bucket["Cautiousness"] === "Low") {
    s.summary.risks = addOnce(s.summary.risks, "Low cautiousness");
  }

  // Keep array sizes sane
  s.summary.risks = s.summary.risks.slice(0, 3);

  return out;
}


