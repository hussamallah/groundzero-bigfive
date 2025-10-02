"use client";
import { useState, useEffect } from "react";
import { selectFiveCards, type FacetData } from "@/lib/bigfive/fiveCardSelector";
import { DOMAINS, FACET_DESCRIPTIONS, FACET_INTERPRETATIONS, canonicalFacets } from "@/lib/bigfive/constants";
import { getFacetScoreLevel } from "@/lib/bigfive/format";

type DomainKey = keyof typeof DOMAINS;

interface Props {
  data: Array<{domain: DomainKey; payload: any}>;
  onCardOpen?: (cardType: string) => void;
  onOfferSeen?: (offerType: 'override' | 'compat' | 'yvt') => void;
}

export default function FiveCardResults({ data, onCardOpen, onOfferSeen }: Props) {
  const [viewedCards, setViewedCards] = useState<Set<string>>(new Set());
  const [ctaEnabled, setCTAEnabled] = useState(false);
  
  // Convert data to FacetData format for selector
  const facetData: FacetData[] = [];
  for (const result of data) {
    const domain = result.domain;
    const payload = result.payload;
    const facets = canonicalFacets(domain);
    
    for (const facet of facets) {
      const raw = payload?.phase2?.A_raw?.[facet] || 3;
      const bucket = payload?.final?.bucket?.[facet] || 'Medium';
      facetData.push({ domain, facet, raw, bucket });
    }
  }
  
  // Get the deterministic 5 cards
  const selectedCards = selectFiveCards(facetData);
  
  // CTA micro-delay per spec (M)
  useEffect(() => {
    const timer = setTimeout(() => setCTAEnabled(true), 700);
    return () => clearTimeout(timer);
  }, []);
  
  const handleCardClick = (cardIndex: number, cardType: string) => {
    const cardKey = `${cardType}-${cardIndex}`;
    setViewedCards(prev => new Set([...prev, cardKey]));
    onCardOpen?.(cardType);
  };
  
  // Check offer conditions
  const lowMediumCount = selectedCards.filter(c => c.bucket === 'Low' || c.bucket === 'Medium').length;
  const hasSocialTrait = selectedCards.some(c => c.type === 'social');
  
  return (
    <div style={{
      background: '#222',
      padding: '20px',
      borderRadius: '10px',
      margin: '20px 0'
    }}>
      <h2 style={{ marginTop: 0 }}>Results Preview (5 Key Cards)</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
        {selectedCards.map((card, i) => {
          const stars = card.raw ? Math.round(card.raw) : (card.bucket === 'High' ? 5 : card.bucket === 'Medium' ? 3 : 2);
          const full = Array.from({length: Math.max(0, Math.min(5, stars))});
          const empty = Array.from({length: Math.max(0, 5 - stars)});
          const cls = card.bucket?.toLowerCase() || 'medium';
          
          // Find the domain and payload for this facet to get interpretation
          let interpretation = card.description;
          if (card.domain && card.facet && card.type !== 'conflict') {
            const domainResult = data.find(d => d.domain === card.domain);
            if (domainResult) {
              const facetScoreLevel = getFacetScoreLevel(card.raw || 3);
              const interp = (FACET_INTERPRETATIONS as any)[card.domain]?.[card.facet]?.[facetScoreLevel];
              if (interp) interpretation = interp;
            }
          }
          
          return (
            <div
              key={i}
              className="card"
              style={{
                background: '#333',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                border: card.type === 'conflict' ? '1px solid #f39c12' : undefined
              }}
              onClick={() => handleCardClick(i, card.type)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px' }}>{card.facet}</strong>
                {card.bucket && <div className={`badge ${cls}`}>{card.bucket}</div>}
              </div>
              
              {card.type !== 'conflict' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  {full.map((_, idx) => (
                    <span key={`fs-${idx}`} style={{ color: '#f1c40f', fontSize: '16px' }}>★</span>
                  ))}
                  {empty.map((_, idx) => (
                    <span key={`es-${idx}`} style={{ color: '#2a2f38', fontSize: '16px' }}>☆</span>
                  ))}
                </div>
              )}
              
              <p style={{ 
                margin: 0, 
                fontSize: '13px', 
                lineHeight: 1.4, 
                color: '#d6e5ff',
                fontStyle: card.type === 'conflict' ? 'italic' : 'normal'
              }}>
                {card.type === 'conflict' && <strong>How can both be true? </strong>}
                {interpretation}
              </p>
              
              {card.type === 'conflict' && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  background: '#2c1810', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#f39c12'
                }}>
                  This tension creates interesting dynamics in your behavior patterns.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Override offer after 2+ low/medium cards */}
      {lowMediumCount >= 2 && (
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '10px',
          margin: '20px 0'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#ccc',
            margin: '10px 0'
          }}>
            "First card paid for itself on day 2." – Sara, PM
          </div>
          <div 
            style={{
              background: ctaEnabled ? '#4cafef' : '#666',
              color: '#111',
              padding: '10px',
              borderRadius: '6px',
              textAlign: 'center',
              margin: '10px 0',
              cursor: ctaEnabled ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              if (ctaEnabled) {
                onOfferSeen?.('override');
              }
            }}
            onMouseEnter={(e) => {
              if (ctaEnabled && e.currentTarget) {
                // Freeze animations for 1.2s per spec (N)
                e.currentTarget.style.transition = 'none';
                setTimeout(() => {
                  if (e.currentTarget) {
                    e.currentTarget.style.transition = 'all 0.3s ease';
                  }
                }, 1200);
              }
            }}
          >
            Override Premium — $7 · Turn weak spots into levers
          </div>
        </div>
      )}

      {/* Compatibility offer after social traits */}
      {hasSocialTrait && (
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '10px',
          margin: '20px 0'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#ccc',
            margin: '10px 0'
          }}>
            "Made sense of our differences instantly." – Omar & Lina
          </div>
          <div 
            style={{
              background: ctaEnabled ? '#4cafef' : '#666',
              color: '#111',
              padding: '10px',
              borderRadius: '6px',
              textAlign: 'center',
              margin: '10px 0',
              cursor: ctaEnabled ? 'pointer' : 'not-allowed'
            }}
            onClick={() => {
              if (ctaEnabled) {
                onOfferSeen?.('compat');
              }
            }}
          >
            Compatibility — 3 cards for $1.50 · See real alignment & friction
          </div>
        </div>
      )}

      {/* Final You vs Them offer */}
      <div style={{
        background: '#1a1a1a',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <div style={{
          fontSize: '13px',
          color: '#ccc',
          margin: '10px 0'
        }}>
          "Clear picture in 30 seconds." – Alex, Designer
        </div>
        <div 
          style={{
            background: ctaEnabled ? '#4cafef' : '#666',
            color: '#111',
            padding: '10px',
            borderRadius: '6px',
            textAlign: 'center',
            margin: '10px 0',
            cursor: ctaEnabled ? 'pointer' : 'not-allowed'
          }}
          onClick={() => {
            if (ctaEnabled) {
              onOfferSeen?.('yvt');
            }
          }}
        >
          You vs Them — 3 cards for $1.50 · Fast side-by-side OCEAN view
        </div>
      </div>
    </div>
  );
}
