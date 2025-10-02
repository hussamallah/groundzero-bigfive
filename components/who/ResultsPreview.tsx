"use client";
import { useState, useEffect } from "react";
import { selectFiveCards, type FacetData, type SelectedCard } from "@/lib/bigfive/fiveCardSelector";

interface FacetCard {
  name: string;
  level: 'High' | 'Medium' | 'Low';
  stars: number;
  description: string;
}

export default function ResultsPreview({ 
  facetData, 
  onCardOpen, 
  onOfferSeen 
}: { 
  facetData?: FacetData[]; 
  onCardOpen?: (cardType: string) => void;
  onOfferSeen?: (offerType: 'override' | 'compat' | 'yvt') => void;
}) {
  const [viewedCards, setViewedCards] = useState<Set<string>>(new Set());
  const [ctaEnabled, setCTAEnabled] = useState(false);
  
  // Use deterministic 5-card selector if facetData provided
  const selectedCards = facetData ? selectFiveCards(facetData) : [];
  
  // Default fallback cards
  const defaultCards: SelectedCard[] = [
    {
      type: 'high',
      facet: 'Self-Efficacy',
      bucket: 'High',
      raw: 4.2,
      description: 'You have strong confidence in your ability to achieve goals.'
    },
    {
      type: 'low', 
      facet: 'Anxiety',
      bucket: 'High',
      raw: 4.1,
      description: 'You often worry and anticipate negative outcomes, which can drain energy.'
    },
    {
      type: 'conflict',
      facet: 'Assertiveness vs Anxiety',
      description: 'How can both be true? This tension creates interesting dynamics in your behavior.'
    },
    {
      type: 'social',
      facet: 'Cooperation', 
      bucket: 'Low',
      raw: 2.1,
      description: 'You resist going along with others when it conflicts with your own views.'
    },
    {
      type: 'values',
      facet: 'Morality',
      bucket: 'Low',
      raw: 2.3,
      description: 'You question or bend conventional rules and may prioritize clarity over consensus.'
    }
  ];

  const cards = selectedCards.length > 0 ? selectedCards : defaultCards;
  const lowMediumCount = cards.filter(c => c.bucket === 'Low' || c.bucket === 'Medium').length;
  const hasSocialTrait = cards.some(c => c.type === 'social');
  
  // CTA micro-delay per spec (M)
  useEffect(() => {
    const timer = setTimeout(() => setCTAEnabled(true), 700); // 600-900ms range
    return () => clearTimeout(timer);
  }, []);
  
  const handleCardClick = (card: SelectedCard, index: number) => {
    const cardKey = `${card.type}-${index}`;
    setViewedCards(prev => new Set([...prev, cardKey]));
    onCardOpen?.(card.type);
  };

  return (
    <div style={{
      background: '#222',
      padding: '20px', 
      borderRadius: '10px',
      margin: '20px 0'
    }}>
      <h2 style={{ marginTop: 0 }}>Full Results (Sample)</h2>
      
      {cards.map((card, i) => {
        const stars = card.raw ? Math.round(card.raw) : (card.bucket === 'High' ? 5 : card.bucket === 'Medium' ? 3 : 2);
        return (
          <div 
            key={i} 
            style={{
              background: '#333',
              borderRadius: '8px',
              padding: '15px',
              margin: '10px 0',
              cursor: 'pointer'
            }}
            onClick={() => handleCardClick(card, i)}
          >
            <strong>
              {card.facet} ▸ {card.bucket || 'Mixed'} {'★'.repeat(stars)}{'☆'.repeat(5-stars)}
            </strong>
            <p style={{ margin: '5px 0 0 0' }}>{card.description}</p>
          </div>
        );
      })}

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
              if (ctaEnabled) {
                // Freeze animations for 1.2s per spec (N)
                e.currentTarget.style.transition = 'none';
                setTimeout(() => {
                  e.currentTarget.style.transition = 'all 0.3s ease';
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
          <div style={{
            background: '#4cafef',
            color: '#111',
            padding: '10px',
            borderRadius: '6px', 
            textAlign: 'center',
            margin: '10px 0',
            cursor: 'pointer'
          }}>
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
        <div style={{
          background: '#4cafef',
          color: '#111',
          padding: '10px',
          borderRadius: '6px',
          textAlign: 'center',
          margin: '10px 0',
          cursor: 'pointer'
        }}>
          You vs Them — 3 cards for $1.50 · Fast side-by-side OCEAN view
        </div>
      </div>
    </div>
  );
}
