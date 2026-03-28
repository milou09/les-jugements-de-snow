import React from 'react';
import { HappyCat, SnowPortrait, LeafBranch, WildFlower, Fern } from './svg/Illustrations';
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
        <WildFlower style={{ position:"absolute", top:"6%", left:"5%", width:"4rem", opacity:0.28, transform:"rotate(-15deg)" }}/>
        <Fern style={{ position:"absolute", bottom:"8%", right:"4%", width:"3rem", opacity:0.22, transform:"rotate(10deg)" }}/>

        <div className="rcard fi">
          <LeafBranch style={{ position:"absolute", top:"-0.5rem", right:"-0.5rem", width:"6rem", opacity:0.18, transform:"rotate(20deg)" }}/>

          {/* Portrait */}
          <div style={{ marginBottom:".5rem" }}>
            {isRoast && mood
              ? <SnowPortrait mood={mood}/>
              : <HappyCat/>
            }
            {isRoast && (
              <p style={{ textAlign:"center", fontSize:".68rem", color:"#8a7050", fontStyle:"italic", margin:".2rem 0 0" }}>
                Snow a un avis.
              </p>
            )}
          </div>

          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", textAlign:"center", margin:"0 0 .25rem", color:"#2d2416" }}>
            {isRoast ? "Le verdict de Snow" : "Résultat final"}
          </h2>

          <div className="rcomp">{compliment}</div>

          {/* Cost breakdown */}
          <div style={{ marginTop:"1rem", background:"rgba(245,240,225,.6)", border:"1px solid rgba(139,105,20,.12)", borderRadius:"3px", padding:".75rem" }}>
            {([
              ["🌿 Verre",       glassCost],
              ["🔧 Cuivre",      copperCost],
              ["✦ Soudure",      solderCost],
              ["🕐 Main d'œuvre", laborCost],
            ] as [string, number][]).map(([label, val]) => (
              <div key={label} className="fb tsm" style={{ padding:".25rem 0" }}>
                <span>{label}</span>
                <span>{val.toFixed(2)} €</span>
              </div>
            ))}
            <div className="divider"/>
            <div className="fb" style={{ fontWeight:600, fontSize:".9rem" }}>
              <span>Coût total</span>
              <span>{totalCost.toFixed(2)} €</span>
            </div>
          </div>

          {/* Final price */}
          <div className="rprice mt3">
            <div className="fb" style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem" }}>
              <span>Prix final</span>
              <span>{finalPrice.toFixed(2)} €</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="fl g2r mt4">
            <button type="button" onClick={onBack}
              style={{ flex:1, background:"rgba(245,240,225,.8)", border:"1px solid rgba(139,105,20,.2)", borderRadius:"3px", padding:".65rem", fontFamily:"'Lora',serif", fontSize:".85rem", cursor:"pointer", color:"#3a2e1a", minHeight:"48px" }}>
              ← Retour
            </button>
            <button type="button" onClick={onAgain}
              className={isRoast ? "btn-w" : "btn-g"} style={{ flex:1 }}>
              {isRoast ? "Snow re-juge 🔥" : "Nouveau ✨"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}