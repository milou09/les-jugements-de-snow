import React from 'react';

// ─── Botanical illustrations ───────────────────────────────────────────────

export const LeafBranch = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 120 80" style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 70 Q30 40 60 20 Q90 5 110 10" stroke="#5c7a3e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M60 20 Q50 35 40 50" stroke="#5c7a3e" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
    <path d="M40 50 Q30 45 25 38 Q35 32 40 50Z" fill="#7a9e52" opacity="0.4"/>
    <path d="M75 25 Q65 38 55 50" stroke="#5c7a3e" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
    <path d="M55 50 Q44 46 38 38 Q50 30 55 50Z" fill="#7a9e52" opacity="0.4"/>
    <path d="M90 15 Q82 30 72 42" stroke="#5c7a3e" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
    <path d="M72 42 Q60 38 55 30 Q67 22 72 42Z" fill="#7a9e52" opacity="0.35"/>
    <path d="M30 58 Q22 52 18 44 Q28 40 30 58Z" fill="#7a9e52" opacity="0.3"/>
  </svg>
);

export const Fern = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 80 120" style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M40 115 Q40 60 40 10" stroke="#4a6741" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55"/>
    {[20,32,44,56,68,80,90,100].map((y, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const len = 12 + (i < 4 ? i * 3 : (7 - i) * 3);
      return (
        <g key={y}>
          <path d={`M40 ${y} Q${40+side*len*0.6} ${y-8} ${40+side*len} ${y-14}`} stroke="#4a6741" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
          <path d={`M${40+side*len} ${y-14} Q${40+side*(len-4)} ${y-10} ${40+side*len*0.6} ${y-8} Q${40+side*(len*0.6+3)} ${y-13} ${40+side*len} ${y-14}Z`} fill="#6b8f4a" opacity="0.3"/>
        </g>
      );
    })}
  </svg>
);

export const WildFlower = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 60 90" style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M30 85 Q30 50 30 30" stroke="#5c7a3e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M30 60 Q20 55 15 48 Q22 44 30 60Z" fill="#7a9e52" opacity="0.4"/>
    <path d="M30 50 Q40 45 45 38 Q38 34 30 50Z" fill="#7a9e52" opacity="0.4"/>
    <ellipse cx="30" cy="24" rx="7" ry="7" fill="#d4a853" opacity="0.7"/>
    {[0,51,102,153,204,255,306].map((deg, i) => (
      <ellipse key={i}
        cx={30 + Math.cos(deg * Math.PI / 180) * 13}
        cy={24 + Math.sin(deg * Math.PI / 180) * 13}
        rx="5" ry="3.5" fill="#e8c97a" opacity="0.55"
        transform={`rotate(${deg} ${30+Math.cos(deg*Math.PI/180)*13} ${24+Math.sin(deg*Math.PI/180)*13})`}
      />
    ))}
  </svg>
);

export const Acorn = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 40 50" style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="20" cy="19" rx="10" ry="7" fill="#8B6914" opacity="0.6"/>
    <path d="M10 19 Q10 36 20 38 Q30 36 30 19Z" fill="#a07830" opacity="0.55"/>
    <path d="M20 6 Q22 12 20 19" stroke="#5c7a3e" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M20 6 Q26 4 28 8 Q22 10 20 6Z" fill="#4a6741" opacity="0.5"/>
  </svg>
);

export const PineBranch = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 140 60" style={style} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5 50 Q40 30 80 25 Q110 22 135 20" stroke="#4a5e35" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55"/>
    {[15,30,45,60,75,90,105,120].map((x, i) => {
      const y = 50 - (x / 135) * 30 + Math.sin(i) * 2;
      const h = 8 + Math.sin(i * 0.8) * 3;
      return (
        <g key={x} opacity="0.45">
          <line x1={x} y1={y} x2={x-5} y2={y-h} stroke="#3d5228" strokeWidth="1"/>
          <line x1={x} y1={y} x2={x+3} y2={y-h+2} stroke="#3d5228" strokeWidth="1"/>
          <line x1={x} y1={y} x2={x-8} y2={y-h+4} stroke="#3d5228" strokeWidth="0.8"/>
          <line x1={x} y1={y} x2={x+6} y2={y-h+6} stroke="#3d5228" strokeWidth="0.8"/>
        </g>
      );
    })}
  </svg>
);

// ─── Happy cat ─────────────────────────────────────────────────────────────

export const HappyCat = () => (
  <svg viewBox="0 0 100 110" style={{width:"5.5rem",height:"5.5rem",margin:"0 auto",display:"block"}} xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="92" rx="20" ry="14" fill="#d4b896" stroke="#b89870" strokeWidth="0.6"/>
    <ellipse cx="50" cy="60" rx="26" ry="24" fill="#ddc4a0" stroke="#b89870" strokeWidth="0.8"/>
    <path d="M27 42 L20 20 L38 34Z" fill="#ddc4a0" stroke="#b89870" strokeWidth="0.7"/>
    <path d="M28 41 L22 24 L36 35Z" fill="#e8a0a0" opacity="0.5"/>
    <path d="M73 42 L80 20 L62 34Z" fill="#ddc4a0" stroke="#b89870" strokeWidth="0.7"/>
    <path d="M72 41 L78 24 L64 35Z" fill="#e8a0a0" opacity="0.5"/>
    <path d="M38 58 Q50 54 62 58" stroke="#b89870" strokeWidth="0.4" fill="none" opacity="0.4"/>
    <ellipse cx="50" cy="68" rx="11" ry="8" fill="#c8a880" stroke="#b89870" strokeWidth="0.4"/>
    <path d="M47 63 Q50 61 53 63 Q50 66 47 63Z" fill="#c06080"/>
    <path d="M34 56 Q39 52 44 56" stroke="#3a2a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M56 56 Q61 52 66 56" stroke="#3a2a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <line x1="20" y1="65" x2="39" y2="67" stroke="#8a7050" strokeWidth="0.6" opacity="0.6"/>
    <line x1="20" y1="68" x2="39" y2="68" stroke="#8a7050" strokeWidth="0.6" opacity="0.6"/>
    <line x1="20" y1="71" x2="39" y2="69" stroke="#8a7050" strokeWidth="0.6" opacity="0.6"/>
    <line x1="61" y1="67" x2="80" y2="65" stroke="#8a7050" strokeWidth="0.6" opacity="0.6"/>
    <line x1="61" y1="68" x2="80" y2="68" stroke="#8a7050" strokeWidth="0.6" opacity="0.6"/>
    <line x1="61" y1="69" x2="80" y2="71" stroke="#8a7050" strokeWidth="0.6" opacity="0.6"/>
    <path d="M45 72 Q50 76 55 72" stroke="#c06080" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M68 92 Q82 80 78 68 Q76 62 80 58" stroke="#b89870" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <ellipse cx="34" cy="68" rx="5" ry="3" fill="#e8a0a0" opacity="0.3"/>
    <ellipse cx="66" cy="68" rx="5" ry="3" fill="#e8a0a0" opacity="0.3"/>
  </svg>
);

// ─── Snow portraits ────────────────────────────────────────────────────────

const SnowBase = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 110" style={{ width:"5.5rem", height:"5.5rem", margin:"0 auto", display:"block", ...style }} xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="95" rx="22" ry="16" fill="#f0ece0" stroke="#ccc5a8" strokeWidth="0.6"/>
    <ellipse cx="50" cy="58" rx="28" ry="26" fill="#f5f0e0" stroke="#ccc5a8" strokeWidth="0.8"/>
    <path d="M24 44 Q14 18 26 12 Q34 20 32 40Z" fill="#ede8d5" stroke="#ccc5a8" strokeWidth="0.7"/>
    <path d="M25 42 Q17 22 27 16 Q32 23 31 39Z" fill="#d4b8a0" opacity="0.5"/>
    <path d="M76 44 Q86 18 74 12 Q66 20 68 40Z" fill="#ede8d5" stroke="#ccc5a8" strokeWidth="0.7"/>
    <path d="M75 42 Q83 22 73 16 Q68 23 69 39Z" fill="#d4b8a0" opacity="0.5"/>
    <ellipse cx="50" cy="68" rx="13" ry="9" fill="#e8e0c8" stroke="#ccc5a8" strokeWidth="0.5"/>
    <ellipse cx="50" cy="63" rx="5" ry="3.5" fill="#3a2a1a"/>
    <ellipse cx="48.5" cy="62" rx="1.5" ry="1" fill="#5a4a3a" opacity="0.5"/>
    <circle cx="50" cy="84" r="3" fill="none" stroke="#8B6914" strokeWidth="0.8"/>
    <text x="50" y="86" textAnchor="middle" fontSize="3.5" fill="#8B6914" fontFamily="serif">S</text>
    {children}
  </svg>
);

const MouthSmirk  = () => <path d="M44 74 Q50 76 54 73" stroke="#5a3a2a" strokeWidth="1.2" fill="none" strokeLinecap="round"/>;
const MouthFlat   = () => <path d="M44 74 Q50 74 56 74" stroke="#5a3a2a" strokeWidth="1.2" fill="none" strokeLinecap="round"/>;
const MouthFrown  = () => <path d="M44 75 Q50 72 56 75" stroke="#5a3a2a" strokeWidth="1.2" fill="none" strokeLinecap="round"/>;
const MouthOpen   = () => <><path d="M44 73 Q50 78 56 73" stroke="#5a3a2a" strokeWidth="1.2" fill="none" strokeLinecap="round"/><ellipse cx="50" cy="76" rx="4" ry="2.5" fill="#c08080" opacity="0.6"/></>;
const MouthTight  = () => <path d="M46 74 Q50 73 54 74" stroke="#5a3a2a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>;

const EyeHalf   = ({ x }: { x: number }) => <><ellipse cx={x} cy="54" rx="5" ry="2.5" fill="#2a1a0a"/><ellipse cx={x-1} cy="53.5" rx="1.2" ry="0.8" fill="#fff" opacity="0.4"/></>;
const EyeNormal = ({ x }: { x: number }) => <><ellipse cx={x} cy="54" rx="5" ry="5" fill="#2a1a0a"/><ellipse cx={x-1.5} cy="52.5" rx="1.8" ry="1.5" fill="#fff" opacity="0.5"/></>;
const EyeWide   = ({ x }: { x: number }) => <><ellipse cx={x} cy="54" rx="5.5" ry="6.5" fill="#2a1a0a"/><ellipse cx={x-1.5} cy="51.5" rx="2" ry="1.8" fill="#fff" opacity="0.55"/></>;
const EyeSquint = ({ x }: { x: number }) => <><ellipse cx={x} cy="54" rx="5" ry="1.8" fill="#2a1a0a"/><ellipse cx={x-1} cy="53.5" rx="1" ry="0.6" fill="#fff" opacity="0.4"/></>;
const EyeSide   = ({ x, dir }: { x: number; dir: number }) => <><ellipse cx={x+dir} cy="54" rx="5" ry="5" fill="#2a1a0a"/><ellipse cx={x+dir*2-1} cy="52.5" rx="1.8" ry="1.5" fill="#fff" opacity="0.5"/></>;

const BrowFlat   = ({ x }: { x: number }) => <path d={`M${x-5} 46 Q${x} 44 ${x+5} 46`} stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowUp     = ({ x }: { x: number }) => <path d={`M${x-5} 47 Q${x} 43 ${x+5} 46`} stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowDown   = ({ x }: { x: number }) => <path d={`M${x-5} 44 Q${x} 47 ${x+5} 45`} stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowAngryL = () => <path d="M28 44 Q33 47 38 46" stroke="#6a4a2a" strokeWidth="1.4" fill="none"/>;
const BrowAngryR = () => <path d="M62 46 Q67 47 72 44" stroke="#6a4a2a" strokeWidth="1.4" fill="none"/>;
const BrowSadL   = () => <path d="M28 46 Q33 43 38 46" stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowSadR   = () => <path d="M62 46 Q67 43 72 46" stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowHighL  = () => <path d="M28 42 Q33 40 38 42" stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowHighR  = () => <path d="M62 42 Q67 40 72 42" stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowOneL   = () => <path d="M28 43 Q33 46 38 44" stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;
const BrowOneR   = () => <path d="M62 44 Q67 41 72 43" stroke="#6a4a2a" strokeWidth="1.2" fill="none"/>;

export type SnowMood = 'bored'|'royal'|'disgusted'|'suspicious'|'shocked'|'skeptical'|'confused'|'judging'|'pitying'|'deadpan';

export const SnowPortrait = ({ mood }: { mood: SnowMood }) => {
  const faces: Record<SnowMood, React.ReactNode> = {
    bored:      <><BrowFlat x={33}/><BrowFlat x={67}/><EyeHalf x={33}/><EyeHalf x={67}/><MouthFlat/></>,
    royal:      <><BrowHighL/><BrowHighR/><EyeHalf x={33}/><EyeHalf x={67}/><MouthSmirk/></>,
    disgusted:  <><BrowAngryL/><BrowAngryR/><EyeSquint x={33}/><EyeSquint x={67}/><MouthFrown/></>,
    suspicious: <><BrowOneL/><BrowOneR/><EyeSquint x={33}/><EyeNormal x={67}/><MouthSmirk/></>,
    shocked:    <><BrowHighL/><BrowHighR/><EyeWide x={33}/><EyeWide x={67}/><MouthOpen/></>,
    skeptical:  <><BrowDown x={33}/><BrowDown x={67}/><EyeSquint x={33}/><EyeSquint x={67}/><MouthTight/></>,
    confused:   <><BrowUp x={33}/><BrowUp x={67}/><EyeSide x={33} dir={-1}/><EyeSide x={67} dir={1}/><MouthOpen/></>,
    judging:    <><BrowAngryL/><BrowHighR/><EyeNormal x={33}/><EyeSquint x={67}/><MouthFlat/></>,
    pitying:    <><BrowSadL/><BrowSadR/><EyeHalf x={33}/><EyeHalf x={67}/><MouthFrown/></>,
    deadpan:    <><BrowFlat x={33}/><BrowFlat x={67}/><EyeNormal x={33}/><EyeNormal x={67}/><MouthFlat/></>,
  };
  return (
    <SnowBase style={mood === 'royal' ? { transform: 'rotate(-8deg)' } : undefined}>
      {faces[mood] ?? faces.deadpan}
    </SnowBase>
  );
};