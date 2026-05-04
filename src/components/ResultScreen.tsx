import React from 'react';
import MiaPortrait from './MiaPortrait';
import { SnowPortrait, LeafBranch, WildFlower, Fern } from './svg/Illustrations';
import type { SnowMood } from './svg/Illustrations';

interface CostSummary {
  glassCost: number;
  copperCost: number;
  solderCost: number;
  laborCost: number;
  totalCost: number;
  finalPrice: number;
}

interface ResultScreenProps {
  isRoast: boolean;
  compliment: string;
  mood: SnowMood | null;
  costs: CostSummary;
  onBack: () => void;
  onAgain: () => void;
}

export default function ResultScreen({
  isRoast,
  compliment,
  mood,
  costs,
  onBack,
  onAgain,
}: ResultScreenProps) {
  const { glassCost, copperCost, solderCost, laborCost, totalCost, finalPrice } = costs;

  return (
    <div className="vr">
      <div className="rscreen">
        <WildFlower
          style={{
            position: 'absolute',
            top: '6%',
            left: '5%',
            width: '4rem',
            opacity: 0.25,
            transform: 'rotate(-15deg)',
          }}
        />
        <Fern
          style={{
            position: 'absolute',
            bottom: '8%',
            right: '4%',
            width: '3rem',
            opacity: 0.2,
            transform: 'rotate(10deg)',
          }}
        />

        <div className="rcard fi">
          <LeafBranch
            style={{
              position: 'absolute',
              top: '-.5rem',
              right: '-.5rem',
              width: '6rem',
              opacity: 0.15,
              transform: 'rotate(20deg)',
            }}
          />

          <div style={{ marginBottom: '.5rem' }}>
            {isRoast && mood ? <SnowPortrait mood={mood} /> : <MiaPortrait size={190} />}
            {isRoast ? (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '.68rem',
                  color: 'var(--ink-faint)',
                  fontStyle: 'italic',
                  margin: '.2rem 0 0',
                }}
              >
                Snow a un avis.
              </p>
            ) : (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '.68rem',
                  color: 'var(--ink-faint)',
                  fontStyle: 'italic',
                  margin: '.2rem 0 0',
                }}
              >
                Mia est là pour valider le résultat.
              </p>
            )}
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: '1.4rem',
              textAlign: 'center',
              margin: '0 0 .25rem',
              color: 'var(--ink)',
            }}
          >
            {isRoast ? 'Le verdict de Snow' : 'Résultat final'}
          </h2>

          <div className="rcomp">{compliment}</div>

          <div
            style={{
              marginTop: '1rem',
              background: 'rgba(245,240,225,.6)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '.75rem',
            }}
          >
            {([
              ['🌿 Verre', glassCost],
              ['🔧 Cuivre', copperCost],
              ['✦ Soudure', solderCost],
              ["🕐 Main d'œuvre", laborCost],
            ] as [string, number][]).map(([label, val]) => (
              <div key={label} className="cost-row" style={{ padding: '.2rem 0' }}>
                <span>{label}</span>
                <span>{val.toFixed(2)} €</span>
              </div>
            ))}

            <div className="cost-total">
              <span>Coût total</span>
              <span>{totalCost.toFixed(2)} €</span>
            </div>
          </div>

          <div className="price-box">
            <div
              className="row-between"
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: '1.1rem',
              }}
            >
              <span>Prix final</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {finalPrice.toFixed(2)} €
              </span>
            </div>
          </div>

          <div className="g2 mt3">
            <button
              type="button"
              onClick={onBack}
              style={{
                flex: 1,
                background: 'rgba(245,240,225,.8)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '.65rem',
                fontFamily: "'Lora',serif",
                fontSize: '.85rem',
                cursor: 'pointer',
                color: 'var(--ink-mid)',
                minHeight: '44px',
              }}
            >
              ← Retour
            </button>

            <button
              type="button"
              onClick={onAgain}
              className={isRoast ? 'btn btn-w' : 'btn btn-g'}
              style={{ flex: 1 }}
            >
              {isRoast ? 'Snow re-juge 🔥' : 'Nouveau ✨'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
