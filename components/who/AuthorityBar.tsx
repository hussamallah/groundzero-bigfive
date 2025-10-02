"use client";
import { useEffect, useState } from "react";

export default function AuthorityBar({ hash }: { hash: string }) {
  const [recent, setRecent] = useState<number>(2137);

  return (
    <div style={{
      background: '#000',
      padding: '10px',
      marginBottom: '20px',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#aaa'
    }}>
      Verified run · Hash: {hash.slice(0,6)} · {recent.toLocaleString()} people finished this week · Run locks at midnight
    </div>
  );
}
