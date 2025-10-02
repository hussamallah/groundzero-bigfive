"use client";
import { useCallback } from "react";

export type TelemetryEvent = 
  | "view_who"
  | "mirror_seen" 
  | "signals_seen"
  | "preview_card_open"
  | "offer_seen_override"
  | "offer_seen_compat" 
  | "offer_seen_yvt"
  | "cta_hover"
  | "cta_click"
  | "export"
  | "share";

export interface TelemetryProps {
  hash: string;
  dwell_ms?: number;
  scroll_depth?: number;
  offer_position_index?: number;
  card_type?: string;
  [key: string]: any;
}

export function useTelemetry(hash: string) {
  const send = useCallback((event: TelemetryEvent, props: Partial<TelemetryProps> = {}) => {
    try {
      const payload = {
        event,
        hash,
        timestamp: Date.now(),
        ...props
      };
      
      // For now, just console.debug - replace with your analytics service
      console.debug('[telemetry]', payload);
      
      // Example integrations:
      // gtag('event', event, payload);
      // analytics.track(event, payload);
      // fetch('/api/telemetry', { method: 'POST', body: JSON.stringify(payload) });
      
    } catch (error) {
      console.warn('Telemetry error:', error);
    }
  }, [hash]);
  
  return { send };
}
