"use client";
import { useEffect } from "react";

export default function IdentityMirror({ lines, onSeen }: { lines: string[]; onSeen?: () => void }) {
  // Use exactly 5 sentences as per HTML spec
  const defaultLines = [
    "You rely on self-efficacy and friendliness, which makes you quick to act and easy to connect with in most social settings.",
    "But your anxiety and anger often cut into progress, especially under pressure.", 
    "You show a mix of high assertiveness and low morality, which makes you decisive but resistant to rules or conventions.",
    "Others tend to see you as confident and expressive, but they may also notice sharp edges when cooperation is needed.",
    "Cards below break this into detail."
  ];
  
  const five = (lines && lines.length >= 5) ? lines.slice(0, 5) : defaultLines;
  
  useEffect(() => {
    if (onSeen) {
      const timer = setTimeout(onSeen, 1000); // Fire after 1s of viewing
      return () => clearTimeout(timer);
    }
  }, [onSeen]);
  
  return (
    <div style={{
      background: '#222',
      padding: '20px',
      borderRadius: '10px',
      margin: '20px 0'
    }}>
      <h2 style={{ marginTop: 0 }}>Identity Mirror</h2>
      {five.map((line, i) => (
        <p key={i} style={{ margin: '10px 0', lineHeight: 1.6 }}>{line}</p>
      ))}
    </div>
  );
}
