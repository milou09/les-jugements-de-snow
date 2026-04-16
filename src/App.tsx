import React, { useEffect, useRef, useState, useCallback } from 'react';
import Canvas from './components/Canvas';
import ZonePanel from './components/ZonePanel';
import GlassLibrary, { normalizeGlass } from './components/GlassLibrary';
import type { Glass } from './components/GlassLibrary';
import ResultScreen from './components/ResultScreen';
import { Acorn, WildFlower, PineBranch, LeafBranch } from './components/svg/Illustrations';
import { useZoom } from './hooks/useZoom';
import { detectZone } from './hooks/useZoneDetection';
import type { Zone } from './hooks/useZoneDetection';
import type { SnowMood } from './components/svg/Illustrations';
import {
  C_FUNNY, C_ABSURD, C_ROAST,
  getPriceCompliments, getColorCompliments,
} from './constants/compliments';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const MAX_WIDTH = 1000;
const GLASS_STORAGE_KEY = 'vitrail_tiffany_glasses_v2';
const PROJECTS_STORAGE_KEY = 'vitrail_tiffany_projects_v1';
type SavedProjectState = {
  imageSrc: string | null;
  zones: Zone[];
  scale: number | null;
  scaleLine: { x1: number; y1: number; x2: number; y2: number } | null;
  glasses: Glass[];
  copperPricePerMeter: string;
  solderPricePerMeter: string;
  laborHours: string;
  laborRate: string;
  pricingMode: string;
  customFormula: string;
};

type SavedProject = {
  id: string;
  name: string;
  savedAt: string;
  state: SavedProjectState;
};

function loadSavedProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSavedProjects(projects: SavedProject[]) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}
function toSafeNumber(v: unknown, fb = 0): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isFinite(n) ? n : fb;
}

function evalFormula(formula: string, vars: Record<string, number>): number {
  const tokenize = (f: string) => {
    const re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d*\.?\d+|[()+\-*/])\s*/g;
    const t: string[] = [];
    let m;
    let c = 0;
    while ((m = re.exec(f)) !== null) {
      t.push(m[1]);
      c += m[0].length;
    }
    if (c !== f.length) throw new Error('Formule invalide');
    return t;
  };
  const t = tokenize(formula);
  let i = 0;
  const expr = (): number => {
    let v = term();
    while (i < t.length && (t[i] === '+' || t[i] === '-')) {
      const op = t[i++];
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  };
  const term = (): number => {
    let v = factor();
    while (i < t.length && (t[i] === '*' || t[i] === '/')) {
      const op = t[i++];
      const r = factor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  const factor = (): number => {
    const tok = t[i];
    if (tok === '(') {
      i++;
      const v = expr();
      if (t[i] !== ')') throw new Error('Parenthèse manquante');
      i++;
      return v;
    }
    if (tok === '+' || tok === '-') {
      i++;
      const v = factor();
      return tok === '-' ? -v : v;
    }
    if (/^\d*\.?\d+$/.test(tok ?? '')) {
      i++;
      return parseFloat(tok);
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tok ?? '')) {
      i++;
      if (!(tok in vars)) throw new Error(`Variable inconnue : ${tok}`);
      return vars[tok];
    }
    throw new Error('Formule invalide');
  };
  const res = expr();
  if (i !== t.length || !isFinite(res)) throw new Error('Formule invalide');
  return res;
}

/* ─── CSS ──────────────────────────────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');`;

const CSS = `
*{box-sizing:border-box;}
html{-webkit-text-size-adjust:100%;}
body{margin:0;overscroll-behavior:none;}
button,input,select,textarea{touch-action:manipulation;}
.vr{min-height:100dvh;background:linear-gradient(160deg,#eee8d8 0%,#e8e0cc 40%,#ddd5c0 100%);font-family:'Lora',Georgia,serif;color:#2d2416;position:relative;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);}
.card{background:linear-gradient(135deg,rgba(255,253,245,0.92) 0%,rgba(245,240,225,0.88) 100%);border:1px solid rgba(139,105,20,0.18);border-radius:4px;padding:1.1rem;box-shadow:0 2px 12px rgba(80,60,20,0.10),inset 0 1px 0 rgba(255,255,255,0.6);position:relative;overflow:hidden;}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#7a9e52,#5c7a3e,#4a5e35);border-radius:4px 4px 0 0;opacity:0.7;}
.ctitle{font-family:'Playfair Display',Georgia,serif;font-size:0.78rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#4a5e35;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem;}
.inp{width:100%;background:rgba(255,253,245,0.8);border:1px solid rgba(139,105,20,0.25);border-radius:3px;padding:0.75rem;font-family:'Lora',Georgia,serif;font-size:16px;color:#2d2416;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none;}
.inp:focus{border-color:#7a9e52;box-shadow:0 0 0 2px rgba(122,158,82,0.15);}
.inp:disabled{opacity:.45;cursor:not-allowed;}
select.inp{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235c7a3e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .75rem center;padding-right:2.2rem;cursor:pointer;}
.btn-g{background:linear-gradient(135deg,#5c7a3e 0%,#4a6741 100%);color:#f5f0e8;border:none;border-radius:3px;padding:.8rem 1rem;min-height:48px;font-family:'Lora',Georgia,serif;font-size:.9rem;font-weight:500;cursor:pointer;box-shadow:0 2px 6px rgba(74,103,65,.3);transition:transform .1s,box-shadow .1s;-webkit-tap-highlight-color:transparent;}
.btn-g:active{transform:scale(.97);}
.btn-g:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.btn-w{background:linear-gradient(135deg,#6b4c1e 0%,#5a3e18 100%);color:#f5ead8;border:none;border-radius:3px;padding:.8rem 1rem;min-height:48px;font-family:'Lora',Georgia,serif;font-size:.9rem;font-weight:500;cursor:pointer;box-shadow:0 2px 6px rgba(90,62,24,.3);transition:transform .1s;-webkit-tap-highlight-color:transparent;}
.btn-w:active{transform:scale(.97);}
.btn-d{background:rgba(180,60,40,.08);color:#a03020;border:1px solid rgba(180,60,40,.2);border-radius:3px;padding:.6rem .9rem;min-height:44px;font-family:'Lora',Georgia,serif;font-size:.85rem;cursor:pointer;transition:background .2s;-webkit-tap-highlight-color:transparent;}
.btn-d:active{background:rgba(180,60,40,.18);}
.zone-row{display:flex;align-items:center;justify-content:space-between;background:rgba(245,240,225,.7);border:1px solid rgba(139,105,20,.12);border-radius:3px;padding:.7rem .75rem;min-height:52px;cursor:pointer;transition:background .15s;text-align:left;width:100%;-webkit-tap-highlight-color:transparent;}
.zone-row:active{background:rgba(122,158,82,.12);}
.zone-row.sel{background:rgba(122,158,82,.14);border-color:rgba(92,122,62,.35);}
.rlabel{display:flex;align-items:center;gap:.6rem;font-size:.9rem;cursor:pointer;color:#3a2e1a;padding:.35rem 0;min-height:44px;-webkit-tap-highlight-color:transparent;}
.rlabel input[type=radio]{accent-color:#5c7a3e;width:18px;height:18px;}
.divider{border:none;border-top:1px solid rgba(139,105,20,.15);margin:.6rem 0;}
.lbl{font-size:.8rem;color:#5a4a2a;margin-bottom:.3rem;display:block;font-style:italic;}
.warn{background:rgba(200,160,40,.1);border:1px solid rgba(200,160,40,.3);border-radius:3px;padding:.7rem .9rem;font-size:.85rem;color:#7a5c10;font-style:italic;}
.hdr-wrap{position:sticky;top:0;z-index:20;margin:0 -1rem;padding:0 1rem .6rem;background:linear-gradient(to bottom,rgba(238,232,216,.98) 85%,transparent);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding-top:max(.6rem,env(safe-area-inset-top));}
.hdr-inner{background:linear-gradient(135deg,rgba(74,103,65,.12) 0%,rgba(107,76,30,.08) 100%);border:1px solid rgba(139,105,20,.2);border-radius:4px;padding:.7rem 1rem;text-align:center;position:relative;overflow:hidden;}
.hdr-eye{font-size:.65rem;letter-spacing:.22em;text-transform:uppercase;color:#7a9e52;font-family:'Lora',serif;font-style:italic;}
.hdr-title{font-family:'Playfair Display',Georgia,serif;font-size:1.35rem;font-weight:600;color:#2d2416;margin:.1rem 0 0;line-height:1.2;}
.cdot{width:14px;height:14px;border-radius:50%;border:1px solid rgba(80,60,20,.2);flex-shrink:0;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;}
.mt2{margin-top:.5rem;}.mt3{margin-top:.75rem;}.mt4{margin-top:1rem;}
.sy>*+*{margin-top:.55rem;}.sys>*+*{margin-top:.4rem;}
.fb{display:flex;align-items:center;justify-content:space-between;}
.fg{display:flex;align-items:center;gap:.5rem;}
.tsm{font-size:.85rem;color:#5a4a2a;}
.tmu{font-size:.8rem;color:#8a7050;font-style:italic;}
.tbold{font-weight:600;}
.wfull{width:100%;}
.fl{display:flex;}.g2r{gap:.5rem;}
.err{color:#a03020;font-size:.85rem;}
.ok{font-size:.88rem;color:#3a2e1a;}
.okv{font-weight:600;color:#2d2416;}
.cwrap{border-radius:3px;overflow:hidden;background:#fff;box-shadow:inset 0 0 0 1px rgba(139,105,20,.15);position:relative;touch-action:none;user-select:none;-webkit-user-select:none;}
.cwrap canvas{display:block;width:100%;height:auto;transform-origin:0 0;will-change:transform;}
.zoom-badge{position:absolute;top:.4rem;right:.4rem;background:rgba(74,103,65,.75);color:#f5f0e8;font-size:.7rem;font-family:'Lora',serif;padding:.2rem .5rem;border-radius:20px;pointer-events:none;}
.ec{height:13rem;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(122,158,82,.05);border:1px dashed rgba(92,122,62,.3);border-radius:3px;color:#8a7050;font-style:italic;font-size:.88rem;gap:.5rem;}
.grow{display:flex;align-items:center;justify-content:space-between;background:rgba(245,240,225,.6);border:1px solid rgba(139,105,20,.1);border-radius:3px;padding:.6rem .75rem;min-height:52px;}
.rscreen{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:max(1.5rem,env(safe-area-inset-top)) 1rem max(1.5rem,env(safe-area-inset-bottom));background:linear-gradient(160deg,#eee8d8 0%,#e8e0cc 40%,#ddd5c0 100%);position:relative;}
.rcard{width:100%;max-width:26rem;background:linear-gradient(135deg,rgba(255,253,245,.95) 0%,rgba(245,240,225,.92) 100%);border:1px solid rgba(139,105,20,.2);border-radius:4px;padding:1.5rem;box-shadow:0 8px 32px rgba(80,60,20,.15);position:relative;z-index:1;}
.rcomp{background:rgba(122,158,82,.08);border:1px solid rgba(92,122,62,.15);border-radius:3px;padding:.75rem 1rem;font-style:italic;font-size:.9rem;color:#3a2e1a;text-align:center;margin-top:.75rem;}
.rprice{background:linear-gradient(135deg,#4a6741 0%,#3d5228 100%);border-radius:4px;padding:1rem 1.2rem;color:#f5f0e8;box-shadow:0 4px 16px rgba(61,82,40,.3);}
.cpick{display:flex;align-items:center;gap:.75rem;background:rgba(255,253,245,.8);border:1px solid rgba(139,105,20,.25);border-radius:3px;padding:.6rem .75rem;}
input[type=color]{width:2.8rem;height:2.2rem;border:1px solid rgba(139,105,20,.2);border-radius:3px;cursor:pointer;padding:.1rem;background:white;}
input[type=file]{font-family:'Lora',Georgia,serif;font-size:16px;color:#5a4a2a;width:100%;}
input[type=file]::file-selector-button{background:linear-gradient(135deg,rgba(122,158,82,.15),rgba(92,122,62,.1));border:1px solid rgba(92,122,62,.25);border-radius:3px;padding:.5rem .9rem;min-height:44px;font-family:'Lora',Georgia,serif;font-size:.85rem;color:#4a5e35;cursor:pointer;margin-right:.6rem;}
.bottom-spacer{height:max(2rem,env(safe-area-inset-bottom));}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.fi{animation:fadeIn .3s ease forwards;}
.app-shell{
  max-width:1500px;
  margin:0 auto;
  padding:1.25rem 1.25rem 0;
  position:relative;
  z-index:1;
}
.tabs-row{
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:.6rem;
}
.current-layout{display:block;}
.left-col,.right-col{display:block;}

@media (min-width:1100px){
  .current-layout{
    display:grid;
    grid-template-columns:minmax(0,2fr) minmax(380px,460px);
    gap:1rem;
    align-items:start;
  }

  .right-col{
    position:sticky;
    top:1rem;
  }
}
.workspace-layout{
  display:grid;
  grid-template-columns: 260px minmax(0,1fr) 360px;
  gap:1rem;
  align-items:start;
}

.left-col,.center-col,.right-col{
  min-width:0;
}

.center-top{
  display:flex;
  gap:.5rem;
  margin-bottom:.5rem;
}

.canvas-panel{
  height:calc(100vh - 260px);
  max-height:calc(100vh - 260px);
}

.center-col .card{
  height:100%;
  display:flex;
  flex-direction:column;
}

.center-col .cwrap{
  flex:1;
  min-height:0;
}
.cwrap{
  height:100%;
}

.cwrap canvas{
  width:100%;
  height:100%;
  object-fit:contain;
}
`;

/* ─── Parchment background ────────────────────────────────────────────────── */
const ParchmentBg = () => (
  <svg
    style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      opacity: 0.18,
    }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="noise">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.65"
        numOctaves="3"
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4" />
    <pattern
      id="woodgrain"
      x="0"
      y="0"
      width="200"
      height="40"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M0 20 Q50 15 100 20 Q150 25 200 20"
        stroke="#8B6914"
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M0 30 Q60 26 120 30 Q160 33 200 30"
        stroke="#8B6914"
        strokeWidth="0.3"
        fill="none"
        opacity="0.2"
      />
    </pattern>
    <rect width="100%" height="100%" fill="url(#woodgrain)" opacity="0.15" />
  </svg>
);

/* ─── App ──────────────────────────────────────────────────────────────────── */
export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const zoneCounterRef = useRef(0);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [baseImageData, setBaseImageData] = useState<ImageData | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [mode, setMode] = useState<'zone' | 'scale'>('zone');
  const [scale, setScale] = useState<number | null>(null);
  const [scaleLine, setScaleLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [isDrawingScale, setIsDrawingScale] = useState(false);
  const [scaleStart, setScaleStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedZoneIds, setSelectedZoneIds] = useState<number[]>([]);
  const [pendingScalePixels, setPendingScalePixels] = useState<number | null>(
    null
  );
  const [scaleInputCm, setScaleInputCm] = useState('');
  const [glasses, setGlasses] = useState<Glass[]>([]);
  const [copperPricePerMeter, setCopperPricePerMeter] = useState('');
  const [solderPricePerMeter, setSolderPricePerMeter] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [laborRate, setLaborRate] = useState('');
  const [pricingMode, setPricingMode] = useState('x2_materiaux');
  const [customFormula, setCustomFormula] = useState('(cost_total * 2.5) + 20');
  const [showResult, setShowResult] = useState(false);
  const [resultCompliment, setResultCompliment] = useState('');
  const [resultMood, setResultMood] = useState<SnowMood | null>(null);
  const [resultIsRoast, setResultIsRoast] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'saved' | 'bank'>(
    'current'
  );
  const [showZoneNumbers, setShowZoneNumbers] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  const {
    zoomLevel,
    onWrapTouchStart,
    onWrapTouchMove,
    onWrapTouchEnd,
    onDoubleTap,
    getCanvasXY,
  } = useZoom(canvasRef);

  // ── PWA meta tags ──
  useEffect(() => {
    let vp = document.querySelector('meta[name=viewport]');
    if (!vp) {
      vp = document.createElement('meta');
      (vp as HTMLMetaElement).name = 'viewport';
      document.head.appendChild(vp);
    }
    (vp as HTMLMetaElement).content =
  'width=device-width,initial-scale=1';
    const tags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Vitrail Tiffany' },
      { name: 'theme-color', content: '#eee8d8' },
    ];
    tags.forEach(({ name, content }) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const m = document.createElement('meta');
        m.name = name;
        m.content = content;
        document.head.appendChild(m);
      }
    });
  }, []);

  // ── Persist glasses ──
  useEffect(() => {
    try {
      const s = localStorage.getItem(GLASS_STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p))
          setGlasses(p.map(normalizeGlass).filter(Boolean) as Glass[]);
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(GLASS_STORAGE_KEY, JSON.stringify(glasses));
  }, [glasses]);
  useEffect(() => {
  setSavedProjects(loadSavedProjects());
}, []);

useEffect(() => {
  saveSavedProjects(savedProjects);
}, [savedProjects])

  // ── Load image ──
  useEffect(() => {
    if (!imageSrc) {
      setImageElement(null);
      setCanvasSize({ width: 0, height: 0 });
      setBaseImageData(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
      setImageElement(img);
      setCanvasSize({
        width: Math.round(img.width * ratio),
        height: Math.round(img.height * ratio),
      });
      setZones([]);
      setSelectedZoneIds([]);
      setScaleLine(null);
      setPendingScalePixels(null);
      setScaleInputCm('');
      setShowResult(false);
      zoneCounterRef.current = 0;
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Base image data ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement || !canvasSize.width) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(imageElement, 0, 0, canvasSize.width, canvasSize.height);
    setBaseImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }, [imageElement, canvasSize]);

  // ── Reset ──
  const reset = () => {
    setImageSrc(null);
    setImageElement(null);
    setCanvasSize({ width: 0, height: 0 });
    setBaseImageData(null);
    setZones([]);
    setMode('zone');
    setScale(null);
    setScaleLine(null);
    setIsDrawingScale(false);
    setScaleStart(null);
    setSelectedZoneIds([]);
    setPendingScalePixels(null);
    setScaleInputCm('');
    setCopperPricePerMeter('');
    setSolderPricePerMeter('');
    setLaborHours('');
    setLaborRate('');
    setPricingMode('x2_materiaux');
    setCustomFormula('(cost_total * 2.5) + 20');
    setShowResult(false);
    zoneCounterRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const c = canvasRef.current;
    if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  };

  // ── Image upload ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const collectCurrentProjectState = (): SavedProjectState => ({
  imageSrc,
  zones,
  scale,
  scaleLine,
  glasses,
  copperPricePerMeter,
  solderPricePerMeter,
  laborHours,
  laborRate,
  pricingMode,
  customFormula,
});

const applyProjectState = (state: SavedProjectState) => {
  setMode('zone');
  setSelectedZoneIds([]);
  setPendingScalePixels(null);
  setScaleInputCm('');
  setShowResult(false);

  setZones(state.zones || []);
  setScale(state.scale ?? null);
  setScaleLine(state.scaleLine ?? null);
  setGlasses((state.glasses || []).map(normalizeGlass).filter(Boolean) as Glass[]);
  setCopperPricePerMeter(state.copperPricePerMeter ?? '');
  setSolderPricePerMeter(state.solderPricePerMeter ?? '');
  setLaborHours(state.laborHours ?? '');
  setLaborRate(state.laborRate ?? '');
  setPricingMode(state.pricingMode ?? 'x2_materiaux');
  setCustomFormula(state.customFormula ?? '(cost_total * 2.5) + 20');

  zoneCounterRef.current = (state.zones || []).reduce(
    (m, z) => Math.max(m, z.id || 0),
    0
  );

  if (state.imageSrc) {
    setImageSrc(state.imageSrc);
  } else {
    setImageSrc(null);
    setImageElement(null);
    setCanvasSize({ width: 0, height: 0 });
    setBaseImageData(null);
  }
};

const saveProject = () => {
  const name = prompt('Nom du projet à sauvegarder ?');
  if (!name || !name.trim()) return;

  const project: SavedProject = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    savedAt: new Date().toISOString(),
    state: collectCurrentProjectState(),
  };

  setSavedProjects((prev) => [project, ...prev]);
};

const openSavedProject = (project: SavedProject) => {
  applyProjectState(project.state);
  setActiveTab('current');
};

const deleteSavedProject = (id: string) => {
  setSavedProjects((prev) => prev.filter((p) => p.id !== id));
};
  // ── Pointer coords ──
  const getXY = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      const wrap = canvasWrapRef.current;
      if (!canvas || !wrap) return { x: 0, y: 0 };
      const rect = wrap.getBoundingClientRect();
      return getCanvasXY(e.clientX, e.clientY, rect, canvas.width, rect.width);
    },
    [getCanvasXY]
  );

  // ── Canvas pointer events ──
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!baseImageData) return;
      const { x, y } = getXY(e);
      if (mode === 'scale') {
        setScaleStart({ x, y });
        setIsDrawingScale(true);
        setScaleLine({ x1: x, y1: y, x2: x, y2: y });
        return;
      }
      const ci = y * baseImageData.width + x;
      const existing = zones.find((z) => z.pixelSet.has(ci));
      if (existing) {
        setSelectedZoneIds((prev) =>
  prev.includes(existing.id)
    ? prev.filter((z) => z !== existing.id)
    : [...prev, existing.id]
);
        return;
      }
      const zone = detectZone(x, y, baseImageData, scale, zoneCounterRef);
      if (!zone) return;
      setZones((p) => [...p, zone]);
      setSelectedZoneIds((prev) => [...prev, zone.id]);
    },
    [baseImageData, mode, zones, scale, getXY]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (mode !== 'scale' || !isDrawingScale || !scaleStart) return;
      const { x, y } = getXY(e);
      setScaleLine({ x1: scaleStart.x, y1: scaleStart.y, x2: x, y2: y });
    },
    [mode, isDrawingScale, scaleStart, getXY]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (mode !== 'scale' || !isDrawingScale || !scaleStart) return;
      const { x, y } = getXY(e);
      const line = { x1: scaleStart.x, y1: scaleStart.y, x2: x, y2: y };
      setScaleLine(line);
      setIsDrawingScale(false);
      setScaleStart(null);
      const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
      if (len > 0) setPendingScalePixels(len);
    },
    [mode, isDrawingScale, scaleStart, getXY]
  );

  // ── Scale ──
  const handleSaveScale = () => {
    if (!pendingScalePixels || pendingScalePixels <= 0) return;
    const cm = toSafeNumber(scaleInputCm, NaN);
    if (!isFinite(cm) || cm <= 0) return;
    const ns = cm / pendingScalePixels;
    setScale(ns);
    setZones((prev) =>
      prev.map((z) => {
        const a = z.area_px * ns * ns;
        const gl = glasses.find((g) => g.id === z.glassId);
        const p = gl ? gl.prix_dm2 / 100 : 0;
        return { ...z, area_cm2: a, zone_cost: a * p };
      })
    );
    setMode('zone');
    setScaleInputCm('');
    setPendingScalePixels(null);
  };

  // ── Zone actions ──
const handleSelectZone = (id: number) => {
  setSelectedZoneIds((prev) =>
    prev.includes(id)
      ? prev.filter((z) => z !== id)
      : [...prev, id]
  );
};

  const handleDeleteZone = () => {
  if (selectedZoneIds.length === 0) return;
setZones((p) => p.filter((z) => !selectedZoneIds.includes(z.id)));
setSelectedZoneIds([]);
  };

  const handleAssignGlass = (glassId: string) => {
    const gl = glasses.find((g) => g.id === Number(glassId));
  if (!gl || selectedZoneIds.length === 0) return;
    setZones((p) =>
      p.map((z) => {
        if (!selectedZoneIds.includes(z.id)) return z;
        const a = z.area_cm2 ?? 0;
        const p2 = gl.prix_dm2 / 100;
        return {
          ...z,
          glassId: gl.id,
          color: gl.overlayColor,
          zone_cost: a * p2,
        };
      })
    );
  };

  // ── Costs ──
  const totalPerimPx = zones.reduce((s, z) => s + (z.perimeter_px || 0), 0);
  const copperCm = scale ? totalPerimPx * scale : 0;
  const copperM = copperCm / 100;
  const copperCost = copperM * toSafeNumber(copperPricePerMeter);
  const solderCost = copperM * toSafeNumber(solderPricePerMeter);
  const laborCost = toSafeNumber(laborHours) * toSafeNumber(laborRate);
  const glassCost = zones.reduce((s, z) => s + (z.zone_cost || 0), 0);
  const totalCost = glassCost + copperCost + solderCost + laborCost;
  const pVars = {
    cost_total: totalCost,
    glass_cost: glassCost,
    copper_cost: copperCost,
    solder_cost: solderCost,
    labor_cost: laborCost,
  };

  const finalPrice = (() => {
    try {
      switch (pricingMode) {
        case 'x2_materiaux':
          return {
            value: (glassCost + copperCost + solderCost) * 2,
            error: null,
          };
        case 'x2_plus_mo':
          return {
            value: (glassCost + copperCost + solderCost) * 2 + laborCost,
            error: null,
          };
        case 'x3_total':
          return { value: totalCost * 3, error: null };
        case 'marge_30':
          return { value: totalCost * 1.3, error: null };
        case 'custom':
          return { value: evalFormula(customFormula, pVars), error: null };
        default:
          return { value: totalCost, error: null };
      }
    } catch (err: any) {
      return { value: 0, error: err?.message ?? 'Erreur' };
    }
  })();

  // ── Result screen ──
  const openResult = (type: 'compliment' | 'roast') => {
    if (finalPrice.error) return;
    if (type === 'roast') {
      const pick = C_ROAST[Math.floor(Math.random() * C_ROAST.length)];
      setResultCompliment(pick.text);
      setResultMood(pick.mood as SnowMood);
      setResultIsRoast(true);
    } else {
      const pool = [
        ...C_FUNNY,
        ...C_ABSURD,
        ...getPriceCompliments(finalPrice.value),
        ...getColorCompliments(zones),
      ];
      setResultCompliment(
        pool[Math.floor(Math.random() * pool.length)] || 'Très joli travail.'
      );
      setResultMood(null);
      setResultIsRoast(false);
    }
    setShowResult(true);
  };

  if (showResult)
    return (
      <>
        <style>
          {FONTS}
          {CSS}
        </style>
        <ResultScreen
          isRoast={resultIsRoast}
          compliment={resultCompliment}
          mood={resultMood}
          costs={{
            glassCost,
            copperCost,
            solderCost,
            laborCost,
            totalCost,
            finalPrice: finalPrice.value,
          }}
          onBack={() => setShowResult(false)}
          onAgain={() => openResult(resultIsRoast ? 'roast' : 'compliment')}
        />
      </>
    );

  return (
    <div className="vr">
      <style>
        {FONTS}
        {CSS}
      </style>
      <ParchmentBg />
      <div className="app-shell">
        {/* Header */}
        <div className="hdr-wrap" style={{ paddingTop: '.75rem' }}>
          <div className="hdr-inner">
            <Acorn
              style={{
                position: 'absolute',
                top: '.4rem',
                left: '.8rem',
                width: '2rem',
                opacity: 0.35,
              }}
            />
            <WildFlower
              style={{
                position: 'absolute',
                top: '-.2rem',
                right: '.6rem',
                width: '2.5rem',
                opacity: 0.28,
                transform: 'scaleX(-1)',
              }}
            />
            <p className="hdr-eye">Atelier Vitrail</p>
            <h1 className="hdr-title">Calculateur Tiffany</h1>
          </div>
          <div className="mt2 tabs-row">
            <button
              type="button"
              className={activeTab === 'current' ? 'btn-g' : 'btn-w'}
              style={{ minHeight: '40px', padding: '.45rem .5rem', fontSize: '.75rem' }}
              onClick={() => setActiveTab('current')}
            >
              Projet en cours
            </button>
            <button
              type="button"
              className={activeTab === 'saved' ? 'btn-g' : 'btn-w'}
              style={{ minHeight: '48px', padding: '.65rem .9rem', fontSize: '.9rem' }}
              onClick={() => setActiveTab('saved')}
            >
              Projets sauvegardés
            </button>
            <button
              type="button"
              className={activeTab === 'bank' ? 'btn-g' : 'btn-w'}
              style={{ minHeight: '48px', padding: '.65rem .9rem', fontSize: '.9rem' }}
              onClick={() => setActiveTab('bank')}
            >
              Banque de verre
            </button>
          </div>
        </div>

     {activeTab === 'current' && (
  <div className="workspace-layout">
    <div className="left-col">
      <div className="card mt3">
        <p className="ctitle">
          <span>🌿</span>Image du patron
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      <div className="g2 mt3">
        <button type="button" onClick={reset} className="btn-w">
          Nouveau projet
        </button>
        <button type="button" onClick={saveProject} className="btn-g">
          Sauvegarder
        </button>
      </div>

      <div className="card mt3">
        <p className="ctitle">
          <span>🔧</span>Cuivre
        </p>
        <div className="sys tsm mt2">
          <div className="fb">
            <span>Périmètre total</span>
            <span>{totalPerimPx.toLocaleString()} px</span>
          </div>
          <div className="fb">
            <span>Longueur</span>
            <span>
              {scale ? `${copperCm.toFixed(2)} cm` : '— échelle manquante'}
            </span>
          </div>
        </div>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={copperPricePerMeter}
          onChange={(e) => setCopperPricePerMeter(e.target.value)}
          className="inp mt3"
          placeholder="Prix cuivre (€/m)"
        />
        <div className="fb tsm mt2">
          <span>Coût cuivre</span>
          <span className="tbold">{copperCost.toFixed(2)} €</span>
        </div>
      </div>

      <div className="card mt3">
        <p className="ctitle">
          <span>✦</span>Soudure
        </p>
        <p className="tsm mt2">
          Longueur : {scale ? `${copperCm.toFixed(2)} cm` : '— échelle manquante'}
        </p>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={solderPricePerMeter}
          onChange={(e) => setSolderPricePerMeter(e.target.value)}
          className="inp mt3"
          placeholder="Prix soudure (€/m)"
        />
        <div className="fb tsm mt2">
          <span>Coût soudure</span>
          <span className="tbold">{solderCost.toFixed(2)} €</span>
        </div>
      </div>

      <div className="card mt3">
        <p className="ctitle">
          <span>🕐</span>Main d'œuvre
        </p>
        <div className="g2 mt2">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={laborHours}
            onChange={(e) => setLaborHours(e.target.value)}
            className="inp"
            placeholder="Heures"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={laborRate}
            onChange={(e) => setLaborRate(e.target.value)}
            className="inp"
            placeholder="€/heure"
          />
        </div>
        <div className="fb tsm mt2">
          <span>Coût main d'œuvre</span>
          <span className="tbold">{laborCost.toFixed(2)} €</span>
        </div>
      </div>
    </div>

    <div className="center-col">
      <div className="center-top mt3">
        <button
          type="button"
          onClick={() => setMode((p) => (p === 'scale' ? 'zone' : 'scale'))}
          className="btn-g"
          style={{ flex: 1 }}
        >
          {mode === 'scale' ? '→ Zones' : '⟷ Échelle'}
        </button>

        <button
          type="button"
          onClick={() => setShowZoneNumbers((p) => !p)}
          className="btn-w"
          style={{ flex: 1 }}
        >
          {showZoneNumbers ? 'Masquer les numéros' : 'Afficher les numéros'}
        </button>
      </div>

      {(scale || mode === 'scale' || scaleLine || pendingScalePixels) && (
        <div className="card mt2 fi">
          <p className="ctitle">
            <span>📏</span>Échelle
          </p>
          {scale && (
            <p className="tsm">Enregistrée : {scale.toFixed(4)} cm/px</p>
          )}
          {!scale && mode === 'scale' && !pendingScalePixels && (
            <p className="tmu">
              Trace une ligne, puis saisis sa longueur réelle.
            </p>
          )}
          {pendingScalePixels && (
            <div className="sy mt2">
              <p className="tsm">
                Ligne : {pendingScalePixels.toFixed(1)} px
              </p>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={scaleInputCm}
                onChange={(e) => setScaleInputCm(e.target.value)}
                className="inp"
                placeholder="Longueur réelle (cm)"
              />
              <button
                type="button"
                onClick={handleSaveScale}
                className="btn-g wfull"
              >
                Enregistrer l'échelle
              </button>
            </div>
          )}
        </div>
      )}

      <div className="canvas-panel mt3">
  <div className="card">
        <Canvas
          imageSrc={imageSrc}
          imageElement={imageElement}
          canvasSize={canvasSize}
          showZoneNumbers={showZoneNumbers}
          baseImageData={baseImageData}
          zones={zones}
          selectedZoneIds={selectedZoneIds}
          scaleLine={scaleLine}
          mode={mode}
          zoomLevel={zoomLevel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWrapTouchStart={onWrapTouchStart}
          onWrapTouchMove={onWrapTouchMove}
          onWrapTouchEnd={onWrapTouchEnd}
          onDoubleTap={onDoubleTap}
          canvasRef={canvasRef}
          canvasWrapRef={canvasWrapRef}
        />
      </div>
    </div>

    <div className="right-col">
      <ZonePanel
        zones={zones}
        glasses={glasses}
        selectedZoneIds={selectedZoneIds}
        scale={scale}
        onSelectZone={handleSelectZone}
        onDeleteZone={handleDeleteZone}
        onAssignGlass={handleAssignGlass}
      />

      <div className="card mt3">
        <p className="ctitle">
          <span>🌱</span>Récapitulatif
        </p>
        <div className="sys mt2">
          {(
            [
              ['Verre', glassCost],
              ['Cuivre', copperCost],
              ['Soudure', solderCost],
              ["Main d'œuvre", laborCost],
            ] as [string, number][]
          ).map(([l, v]) => (
            <div key={l} className="fb tsm">
              <span>{l}</span>
              <span>{v.toFixed(2)} €</span>
            </div>
          ))}
          <div className="divider" />
          <div className="fb" style={{ fontSize: '.95rem', fontWeight: 600 }}>
            <span>Coût total</span>
            <span>{totalCost.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="card mt3">
        <p className="ctitle">
          <span>🍀</span>Formule de prix
        </p>
        <div className="sy mt2">
          {(
            [
              ['x2_materiaux', '×2 matériaux'],
              ['x2_plus_mo', '×2 matériaux + MO'],
              ['x3_total', '×3 total'],
              ['marge_30', 'Marge 30 %'],
              ['custom', 'Formule personnalisée'],
            ] as [string, string][]
          ).map(([v, l]) => (
            <label key={v} className="rlabel">
              <input
                type="radio"
                name="pm"
                checked={pricingMode === v}
                onChange={() => setPricingMode(v)}
              />
              <span>{l}</span>
            </label>
          ))}
        </div>
        <div className="mt3">
          <input
            type="text"
            value={customFormula}
            onChange={(e) => setCustomFormula(e.target.value)}
            className="inp"
            placeholder="(cost_total * 2.5) + 20"
            disabled={pricingMode !== 'custom'}
          />
          <p className="tmu mt2">
            Variables : cost_total · glass_cost · copper_cost · solder_cost · labor_cost
          </p>
        </div>
        <div
          style={{
            marginTop: '.75rem',
            background: 'rgba(245,240,225,.6)',
            border: '1px solid rgba(139,105,20,.12)',
            borderRadius: '3px',
            padding: '.65rem',
          }}
        >
          {finalPrice.error ? (
            <p className="err">Erreur : {finalPrice.error}</p>
          ) : (
            <p className="ok">
              Prix calculé : <span className="okv">{finalPrice.value.toFixed(2)} €</span>
            </p>
          )}
        </div>
        <div className="fl g2r mt3">
          <button
            type="button"
            onClick={() => openResult('compliment')}
            disabled={!!finalPrice.error}
            className="btn-g"
            style={{ flex: 1 }}
          >
            Calculer ✨
          </button>
          <button
            type="button"
            onClick={() => openResult('roast')}
            disabled={!!finalPrice.error}
            className="btn-w"
            style={{ flex: 1 }}
          >
            Roast 🔥
          </button>
        </div>
      </div>

      <GlassLibrary
        glasses={glasses}
        onAdd={(g) => setGlasses((p) => [...p, g])}
        onDelete={(id) => {
          setGlasses((p) => p.filter((g) => g.id !== id));
          setZones((p) =>
            p.map((z) =>
              z.glassId === id
                ? { ...z, glassId: null, color: null, zone_cost: 0 }
                : z
            )
          );
        }}
      />
    </div>
  </div>
)}
        {activeTab === 'saved' && (
  <div className="card mt3">
    <p className="ctitle">
      <span>🗂️</span>Projets sauvegardés
    </p>

    {savedProjects.length === 0 ? (
      <p className="tmu">Aucun projet sauvegardé.</p>
    ) : (
      <div className="sy">
        {savedProjects.map((project) => (
          <div key={project.id} className="grow">
            <div>
              <div className="tsm tbold">{project.name}</div>
              <div className="tmu">
                {new Date(project.savedAt).toLocaleString()}
              </div>
            </div>

            <div className="fg">
              <button
                type="button"
                className="btn-g"
                style={{ minHeight: '40px', padding: '.45rem .65rem' }}
                onClick={() => openSavedProject(project)}
              >
                Ouvrir
              </button>

              <button
                type="button"
                className="btn-d"
                style={{ minHeight: '40px', padding: '.45rem .65rem' }}
                onClick={() => deleteSavedProject(project.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {activeTab === 'bank' && (
          <div className="card mt3">
            <p className="ctitle">
              <span>🧪</span>Banque de verre
            </p>
            <p className="tmu">Cette section arrive bientôt.</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', opacity: 0.28, marginTop: '1rem' }}>
          <PineBranch style={{ width: '10rem', margin: '0 auto' }} />
        </div>
        <div className="bottom-spacer" />
      </div>
    </div>
  );
}
