// Predicate flags: pure code, deterministic
import { GZFacts } from "../data/buildPayload";

const hi = (x: number) => x >= 3.75;
const mid = (x: number) => x >= 3 && x < 3.75;
const lo = (x: number) => x < 3;

export function predicates(f: GZFacts) {
  const O = f.domains.O;
  const C = f.domains.C;
  const E = f.domains.E;
  const A = f.domains.A;
  const N = f.domains.N;
  
  return {
    O_high: hi(O.mean_raw),
    O_mid: mid(O.mean_raw),
    O_low: lo(O.mean_raw),
    
    C_high: C.mean_raw >= 3.6,
    C_mid: mid(C.mean_raw),
    C_low: lo(C.mean_raw),
    
    E_high: hi(E.mean_raw),
    E_mid: mid(E.mean_raw),
    E_low: lo(E.mean_raw),
    E_lowGregar: E.bucket["Gregariousness"] === "Low",
    
    A_high: hi(A.mean_raw),
    A_mid: mid(A.mean_raw),
    A_low: lo(A.mean_raw),
    A_lowCoop: A.bucket["Cooperation"] === "Low",
    A_highCoop: A.bucket["Cooperation"] === "High",
    
    N_high: hi(N.mean_raw),
    N_mid: mid(N.mean_raw),
    N_low: lo(N.mean_raw),
    N_lowAnx: N.bucket["Anxiety"] === "Low",
    N_highAnx: N.bucket["Anxiety"] === "High",
    N_highImmod: N.bucket["Immoderation"] === "High",
    N_lowImmod: N.bucket["Immoderation"] === "Low",
    
    // Combo patterns
    O_high_C_high: hi(O.mean_raw) && C.mean_raw >= 3.6,
    E_low_A_high: lo(E.mean_raw) && hi(A.mean_raw),
    E_high_A_low: hi(E.mean_raw) && lo(A.mean_raw),
  };
}
