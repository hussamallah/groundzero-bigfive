"use client";
import { computeSignals, DomainMeans, CUTLINE_HIGH, CUTLINE_MEDMIN, CUTLINE_MEDMAX } from "@/lib/bigfive/signals";

type Level = 'High'|'Medium'|'Low';

function levelOf(v: number): Level {
  if (v >= CUTLINE_HIGH) return 'High';
  if (v >= CUTLINE_MEDMIN && v <= CUTLINE_MEDMAX) return 'Medium';
  return 'Low';
}

// Per-signal copy variants keyed by level
const signalCopy: Record<string, Partial<Record<Level, string>>> = {
  T: {
    High: 'Threat: Pain avoidance runs hot; you scan for risks first.',
    Medium: 'Threat: You notice risk and plan around it when needed.',
    Low: 'Threat: Signal stays low; you move without much caution.'
  },
  P: {
    High: 'Pursuit: Strong exploration/build drive; you move proactively.',
    Medium: 'Pursuit: Moderate; you move when the case is clear.',
    Low: 'Pursuit: Exploration lower; you hold back until safe.'
  },
  S: {
    High: 'Social Buffer: You bond and soothe easily; steadying in teams.',
    Medium: 'Social Buffer: Capacity to bond and soothe is moderate.',
    Low: 'Social Buffer: Buffer runs low; you self‑regulate more than co‑regulate.'
  },
  D: {
    High: 'Dominance/Drive: You push forward and assert control often.',
    Medium: 'Dominance/Drive: You can take charge when needed.',
    Low: 'Dominance/Drive: Low; you rarely push or direct others.'
  }
};

function lineFor(key: string, v: number): string {
  const lvl = levelOf(v);
  const map = signalCopy[key] || {};
  return map[lvl] || `${key}: ${lvl.toLowerCase()} level.`;
}

export default function LifeSignals({ means }: { means: DomainMeans }) {
  const s = computeSignals(means);
  // Show top 4 signals as per HTML spec
  const topSignals = [
    { key: 'T', value: s.T },
    { key: 'P', value: s.P }, 
    { key: 'S', value: s.S },
    { key: 'D', value: s.D }
  ];

  return (
    <div style={{
      background: '#1a1a1a',
      padding: '20px',
      borderRadius: '10px',
      margin: '20px 0'
    }}>
      <h2 style={{ marginTop: 0 }}>Life Signals Snapshot</h2>
      {topSignals.map(({ key, value }) => (
        <div key={key} style={{ margin: '10px 0' }}>
          <div>{lineFor(key, value)}</div>
          <div style={{
            background: '#333',
            borderRadius: '6px',
            overflow: 'hidden',
            height: '20px',
            marginTop: '5px'
          }}>
            <div style={{
              background: '#4cafef',
              height: '100%',
              width: `${Math.round(value * 100)}%`,
              textAlign: 'right',
              paddingRight: '5px',
              boxSizing: 'border-box',
              color: '#111',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: '20px'
            }}>
              {Math.round(value * 100)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
