import React, { useEffect, useRef, useState, useCallback } from 'react';
import './styles.css';
import Canvas from './components/Canvas';
import ZonePanel from './components/ZonePanel';
import GlassLibrary, { normalizeGlass } from './components/GlassLibrary';
import type { Glass } from './components/GlassLibrary';
import ResultScreen from './components/ResultScreen';
import { Acorn, WildFlower, PineBranch, SnowPortrait } from './components/svg/Illustrations';
import { useZoom } from './hooks/useZoom';
import { detectZone } from './hooks/useZoneDetection';
import './animations.css';
import type { Zone } from './hooks/useZoneDetection';
import type { SnowMood } from './components/svg/Illustrations';
import {
  C_FUNNY, C_ABSURD, C_ROAST,
  getPriceCompliments, getColorCompliments,
} from './constants/compliments';

const MAX_WIDTH = 1000;
const GLASS_STORAGE_KEY = 'vitrail_tiffany_glasses_v2';
const PROJECTS_STORAGE_KEY = 'vitrail_tiffany_projects_v1';

type SavedProjectState = {
  imageSrc: string | null; zones: Zone[]; scale: number | null;
  scaleLine: { x1: number; y1: number; x2: number; y2: number } | null;
  projectGlasses: Glass[]; copperPricePerMeter: string; solderPricePerMeter: string;
  laborHours: string; laborRate: string; pricingMode: string; customFormula: string;
};
type SavedProject = { id: string; name: string; savedAt: string; state: SavedProjectState; };

function loadSavedProjects(): SavedProject[] {
  try { const raw = localStorage.getItem(PROJECTS_STORAGE_KEY); if (!raw) return []; const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}
function saveSavedProjects(projects: SavedProject[]) { localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects)); }
function toSafeNumber(v: unknown, fb = 0): number { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : fb; }

function evalFormula(formula: string, vars: Record<string, number>): number {
  const tokenize = (f: string) => { const re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d*\.?\d+|[()+\-*/])\s*/g; const t: string[] = []; let m; let c = 0; while ((m = re.exec(f)) !== null) { t.push(m[1]); c += m[0].length; } if (c !== f.length) throw new Error('Formule invalide'); return t; };
  const t = tokenize(formula); let i = 0;
  const expr = (): number => { let v = term(); while (i < t.length && (t[i] === '+' || t[i] === '-')) { const op = t[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; };
  const term = (): number => { let v = factor(); while (i < t.length && (t[i] === '*' || t[i] === '/')) { const op = t[i++]; const r = factor(); v = op === '*' ? v * r : v / r; } return v; };
  const factor = (): number => {
    const tok = t[i];
    if (tok === '(') { i++; const v = expr(); if (t[i] !== ')') throw new Error('Parenthese manquante'); i++; return v; }
    if (tok === '+' || tok === '-') { i++; const v = factor(); return tok === '-' ? -v : v; }
    if (/^\d*\.?\d+$/.test(tok ?? '')) { i++; return parseFloat(tok); }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tok ?? '')) { i++; if (!(tok in vars)) throw new Error('Variable inconnue: ' + tok); return vars[tok]; }
    throw new Error('Formule invalide');
  };
  const res = expr(); if (i !== t.length || !isFinite(res)) throw new Error('Formule invalide'); return res;
}

const ParchmentBg = () => (
  <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.14 }} xmlns="http://www.w3.org/2000/svg">
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4" />
    <pattern id="woodgrain" x="0" y="0" width="200" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q50 15 100 20 Q150 25 200 20" stroke="#8B6914" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M0 30 Q60 26 120 30 Q160 33 200 30" stroke="#8B6914" strokeWidth="0.3" fill="none" opacity="0.2" />
    </pattern>
    <rect width="100%" height="100%" fill="url(#woodgrain)" opacity="0.15" />
  </svg>
);

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const zoneCounterRef = useRef(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [baseImageData, setBaseImageData] = useState<ImageData | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [mode, setMode] = useState<'zone' | 'scale'>('zone');
  const [scale, setScale] = useState<number | null>(null);
  const [scaleLine, setScaleLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isDrawingScale, setIsDrawingScale] = useState(false);
  const [scaleStart, setScaleStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedZoneIds, setSelectedZoneIds] = useState<number[]>([]);
  const [pendingScalePixels, setPendingScalePixels] = useState<number | null>(null);
  const [scaleInputCm, setScaleInputCm] = useState('');
  const [globalGlasses, setGlobalGlasses] = useState<Glass[]>([]);
const [projectGlasses, setProjectGlasses] = useState<Glass[]>([]);
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
  const [activeTab, setActiveTab] = useState<'current' | 'saved' | 'bank'>('current');
  const [showZoneNumbers, setShowZoneNumbers] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showSnowWarning, setShowSnowWarning] = useState(false);
const [pendingDeleteGlassId, setPendingDeleteGlassId] = useState<number | null>(null);

  const { zoomLevel, onWrapTouchStart, onWrapTouchMove, onWrapTouchEnd, onDoubleTap, getCanvasXY } = useZoom(canvasRef);

  useEffect(() => { try { const s = localStorage.getItem(GLASS_STORAGE_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setGlobalGlasses(p.map(normalizeGlass).filter(Boolean) as Glass[]); } } catch {} }, []);
  useEffect(() => { localStorage.setItem(GLASS_STORAGE_KEY, JSON.stringify(globalGlasses)); }, [globalGlasses]);
  useEffect(() => { setSavedProjects(loadSavedProjects()); }, []);
  useEffect(() => { saveSavedProjects(savedProjects); }, [savedProjects]);

  useEffect(() => {
    if (!imageSrc) { setImageElement(null); setCanvasSize({ width: 0, height: 0 }); setBaseImageData(null); return; }
    const img = new Image();
    img.onload = () => {
  const ratio = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
  setImageElement(img);
  setCanvasSize({
    width: Math.round(img.width * ratio),
    height: Math.round(img.height * ratio),
  });
};
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
  if (activeTab !== 'current') return;

  const canvas = canvasRef.current;
  if (!canvas || !imageElement || !canvasSize.width) return;

  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.drawImage(imageElement, 0, 0, canvasSize.width, canvasSize.height);
  setBaseImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
}, [imageElement, canvasSize, activeTab]);


  // ── Redraw canvas (surbrillance, numéros, ligne d'échelle) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImageData) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Restaurer l'image de base
    ctx.putImageData(baseImageData, 0, 0);

    // Appliquer couleurs et surbrillance des zones
    if (zones.length > 0) {
      const ov = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = ov.data;
      for (const zone of zones) {
        for (const pi of zone.pixelArray) {
          const off = pi * 4;
          if (zone.color) {
            d[off]   = zone.color.r;
            d[off+1] = zone.color.g;
            d[off+2] = zone.color.b;
            d[off+3] = Math.round(zone.color.a * 255);
          }
          if (selectedZoneIds.includes(zone.id)) {
            d[off]   = Math.round(d[off]   * 0.65 + 16  * 0.35);
            d[off+1] = Math.round(d[off+1] * 0.65 + 185 * 0.35);
            d[off+2] = Math.round(d[off+2] * 0.65 + 129 * 0.35);
          }
        }
      }
      ctx.putImageData(ov, 0, 0);

      // Numéros de zones
      if (showZoneNumbers) {
        ctx.save();
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const zone of zones) {
          if (!zone.pixelArray?.length) continue;
          let sumX = 0, sumY = 0;
          for (const pi of zone.pixelArray) {
            sumX += pi % canvas.width;
            sumY += Math.floor(pi / canvas.width);
          }
          const x = sumX / zone.pixelArray.length;
          const y = sumY / zone.pixelArray.length;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(x - 11, y - 10, 22, 20);
          ctx.fillStyle = '#1e1810';
          ctx.fillText(zone.label.replace(/\D+/g, '') || String(zone.id), x, y);
        }
        ctx.restore();
      }
    }

    // Ligne d'échelle
    if (scaleLine) {
      ctx.save();
      ctx.strokeStyle = '#5c7a3e';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(scaleLine.x1, scaleLine.y1);
      ctx.lineTo(scaleLine.x2, scaleLine.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const [x, y] of [[scaleLine.x1, scaleLine.y1], [scaleLine.x2, scaleLine.y2]] as [number, number][]) {
        ctx.fillStyle = '#5c7a3e';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }, [baseImageData, zones, selectedZoneIds, showZoneNumbers, scaleLine, activeTab]);

  const reset = () => {
    setImageSrc(null); setImageElement(null); setCanvasSize({ width: 0, height: 0 }); setBaseImageData(null);
    setZones([]); setMode('zone'); setScale(null); setScaleLine(null); setIsDrawingScale(false); setScaleStart(null);
    setSelectedZoneIds([]); setPendingScalePixels(null); setScaleInputCm(''); setCopperPricePerMeter('');
    setSolderPricePerMeter(''); setLaborHours(''); setLaborRate(''); setPricingMode('x2_materiaux');
    setCustomFormula('(cost_total * 2.5) + 20'); setShowResult(false); zoneCounterRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const c = canvasRef.current; if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => { setImageSrc(reader.result as string); }; reader.readAsDataURL(file);
  };

  const collectCurrentProjectState = (): SavedProjectState => ({ imageSrc, zones, scale, scaleLine, projectGlasses, copperPricePerMeter, solderPricePerMeter, laborHours, laborRate, pricingMode, customFormula });

  const applyProjectState = (state: SavedProjectState) => {
    setMode('zone'); setSelectedZoneIds([]); setPendingScalePixels(null); setScaleInputCm(''); setShowResult(false);
    setZones(state.zones || []); setScale(state.scale ?? null); setScaleLine(state.scaleLine ?? null);
setProjectGlasses(((state.projectGlasses || state.glasses || []) as any[]).map(normalizeGlass).filter(Boolean) as Glass[]);
    setCopperPricePerMeter(state.copperPricePerMeter ?? ''); setSolderPricePerMeter(state.solderPricePerMeter ?? '');
    setLaborHours(state.laborHours ?? ''); setLaborRate(state.laborRate ?? '');
    setPricingMode(state.pricingMode ?? 'x2_materiaux'); setCustomFormula(state.customFormula ?? '(cost_total * 2.5) + 20');
    zoneCounterRef.current = (state.zones || []).reduce((m, z) => Math.max(m, z.id || 0), 0);
    if (state.imageSrc) { setImageSrc(state.imageSrc); }
    else { setImageSrc(null); setImageElement(null); setCanvasSize({ width: 0, height: 0 }); setBaseImageData(null); }
  };

  const saveProject = () => {
    const name = prompt('Nom du projet ?'); if (!name?.trim()) return;
    setSavedProjects((prev) => [{ id: Date.now() + '_' + Math.random().toString(36).slice(2,8), name: name.trim(), savedAt: new Date().toISOString(), state: collectCurrentProjectState() }, ...prev]);
  };

  const openSavedProject = (p: SavedProject) => { applyProjectState(p.state); setActiveTab('current'); };
  const deleteSavedProject = (id: string) => { setSavedProjects((prev) => prev.filter((p) => p.id !== id)); };

  const getXY = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 };
    // Sans zoom desktop : pas de CSS transform sur le canvas.
    // On utilise directement le rect du canvas comme référence.
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!baseImageData) return; const { x, y } = getXY(e);
    if (mode === 'scale') { setScaleStart({ x, y }); setIsDrawingScale(true); setScaleLine({ x1: x, y1: y, x2: x, y2: y }); return; }
    const ci = y * baseImageData.width + x;
    const existing = zones.find((z) => z.pixelSet.has(ci));
    if (existing) { setSelectedZoneIds((prev) => prev.includes(existing.id) ? prev.filter((z) => z !== existing.id) : [...prev, existing.id]); return; }
    const zone = detectZone(x, y, baseImageData, scale, zoneCounterRef); if (!zone) return;
    setZones((p) => [...p, zone]); setSelectedZoneIds((prev) => [...prev, zone.id]);
  }, [baseImageData, mode, zones, scale, getXY]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'scale' || !isDrawingScale || !scaleStart) return;
    const { x, y } = getXY(e); setScaleLine({ x1: scaleStart.x, y1: scaleStart.y, x2: x, y2: y });
  }, [mode, isDrawingScale, scaleStart, getXY]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'scale' || !isDrawingScale || !scaleStart) return;
    const { x, y } = getXY(e); const line = { x1: scaleStart.x, y1: scaleStart.y, x2: x, y2: y };
    setScaleLine(line); setIsDrawingScale(false); setScaleStart(null);
    const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1); if (len > 0) setPendingScalePixels(len);
  }, [mode, isDrawingScale, scaleStart, getXY]);

  const handleSaveScale = () => {
    if (!pendingScalePixels || pendingScalePixels <= 0) return;
    const cm = toSafeNumber(scaleInputCm, NaN); if (!isFinite(cm) || cm <= 0) return;
    const ns = cm / pendingScalePixels; setScale(ns);
    setZones((prev) => prev.map((z) => { const a = z.area_px * ns * ns; const gl = glasses.find((g) => g.id === z.glassId); const p = gl ? gl.prix_dm2 / 100 : 0; return { ...z, area_cm2: a, zone_cost: a * p }; }));
    setMode('zone'); setScaleInputCm(''); setPendingScalePixels(null);
  };

  const handleSelectZone = (id: number) => { setSelectedZoneIds((prev) => prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]); };
  const handleDeleteZone = () => { if (!selectedZoneIds.length) return; setZones((p) => p.filter((z) => !selectedZoneIds.includes(z.id))); setSelectedZoneIds([]); };
  const handleAssignGlass = (glassId: string) => {
  const gl = projectGlasses.find((g) => g.id === Number(glassId)); if (!gl || !selectedZoneIds.length) return;
    setZones((p) => p.map((z) => { if (!selectedZoneIds.includes(z.id)) return z; const a = z.area_cm2 ?? 0; return { ...z, glassId: gl.id, color: gl.overlayColor, zone_cost: a * (gl.prix_dm2 / 100) }; }));
    setSelectedZoneIds([]);
  };

  const totalPerimPx = zones.reduce((s, z) => s + (z.perimeter_px || 0), 0);
  const copperCm = scale ? totalPerimPx * scale : 0; const copperM = copperCm / 100;
  const copperCost = copperM * toSafeNumber(copperPricePerMeter);
  const solderCost = copperM * toSafeNumber(solderPricePerMeter);
  const laborCost = toSafeNumber(laborHours) * toSafeNumber(laborRate);
  const glassCost = zones.reduce((s, z) => s + (z.zone_cost || 0), 0);
  const totalCost = glassCost + copperCost + solderCost + laborCost;
  const pVars = { cost_total: totalCost, glass_cost: glassCost, copper_cost: copperCost, solder_cost: solderCost, labor_cost: laborCost };

  const finalPrice = (() => {
    try {
      switch (pricingMode) {
        case 'x2_materiaux': return { value: (glassCost + copperCost + solderCost) * 2, error: null };
        case 'x2_plus_mo':   return { value: (glassCost + copperCost + solderCost) * 2 + laborCost, error: null };
        case 'x3_total':     return { value: totalCost * 3, error: null };
        case 'marge_30':     return { value: totalCost * 1.3, error: null };
        case 'custom':       return { value: evalFormula(customFormula, pVars), error: null };
        default:             return { value: totalCost, error: null };
      }
    } catch (err: any) { return { value: 0, error: err?.message ?? 'Erreur' }; }
  })();

  const openResult = (type: 'compliment' | 'roast') => {
    if (finalPrice.error) return;
    if (type === 'roast') { const pick = C_ROAST[Math.floor(Math.random() * C_ROAST.length)]; setResultCompliment(pick.text); setResultMood(pick.mood as SnowMood); setResultIsRoast(true); }
    else { const pool = [...C_FUNNY, ...C_ABSURD, ...getPriceCompliments(finalPrice.value), ...getColorCompliments(zones)]; setResultCompliment(pool[Math.floor(Math.random() * pool.length)] || 'Tres joli travail.'); setResultMood(null); setResultIsRoast(false); }
    setShowResult(true);
  };

  if (showResult)
    return <ResultScreen isRoast={resultIsRoast} compliment={resultCompliment} mood={resultMood} costs={{ glassCost, copperCost, solderCost, laborCost, totalCost, finalPrice: finalPrice.value }} onBack={() => setShowResult(false)} onAgain={() => openResult(resultIsRoast ? 'roast' : 'compliment')} />;

  return (
    <div className="vr">
      <ParchmentBg />

      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo-wrap">
              <Acorn style={{ width: '1.1rem', opacity: 0.9, filter: 'brightness(10)' }} />
            </div>
            <div>
              <p className="header-eyebrow">Atelier Vitrail</p>
              <h1 className="header-title">Calculateur Tiffany</h1>
            </div>
          </div>

          <nav className="header-tabs">
            {(['current', 'saved', 'bank'] as const).map((tab) => (
              <button key={tab} type="button" className={'tab-btn' + (activeTab === tab ? ' active' : '')} onClick={() => setActiveTab(tab)}>
                {tab === 'current' ? '🌿 Projet en cours' : tab === 'saved' ? '🗂 Sauvegardés' : '🪟 Banque de verre'}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button type="button" onClick={reset} className="btn btn-ghost btn-sm">↺ Nouveau</button>
            <button type="button" onClick={saveProject} className="btn btn-g btn-sm">💾 Sauvegarder</button>
          </div>
        </div>
      </header>

      {activeTab === 'current' && (
        <div className="workspace" style={{ position: 'relative', zIndex: 1 }}>

          <aside className="sidebar">
            <div className="card">
              <p className="ctitle"><span>🌿</span> Patron</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="card">
              <p className="ctitle"><span>🔧</span> Cuivre</p>
              <div className="stack-sm tsm mt2">
                <div className="row-between"><span>Perimetre total</span><span>{totalPerimPx.toLocaleString()} px</span></div>
                <div className="row-between"><span>Longueur</span><span>{scale ? (copperCm.toFixed(1) + ' cm') : <i style={{ color: 'var(--ink-faint)' }}>echelle manquante</i>}</span></div>
              </div>
              <input type="number" inputMode="decimal" step="0.01" min="0" value={copperPricePerMeter} onChange={(e) => setCopperPricePerMeter(e.target.value)} className="inp mt3" placeholder="Prix cuivre (euros/m)" />
              <div className="row-between tsm mt2"><span>Cout cuivre</span><span className="tbold">{copperCost.toFixed(2)} euros</span></div>
            </div>

            <div className="card">
              <p className="ctitle"><span>✦</span> Soudure</p>
              <input type="number" inputMode="decimal" step="0.01" min="0" value={solderPricePerMeter} onChange={(e) => setSolderPricePerMeter(e.target.value)} className="inp mt2" placeholder="Prix soudure (euros/m)" />
              <div className="row-between tsm mt2"><span>Cout soudure</span><span className="tbold">{solderCost.toFixed(2)} euros</span></div>
            </div>

            <div className="card">
              <p className="ctitle"><span>🕐</span> Main d&apos;œuvre</p>
              <div className="g2 mt2">
                <input type="number" inputMode="decimal" step="0.1" min="0" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} className="inp" placeholder="Heures" />
                <input type="number" inputMode="decimal" step="0.01" min="0" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} className="inp" placeholder="euros/heure" />
              </div>
              <div className="row-between tsm mt2"><span>Cout MO</span><span className="tbold">{laborCost.toFixed(2)} euros</span></div>
            </div>

            <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '1.5rem' }}>
              <PineBranch style={{ width: '8rem', margin: '0 auto' }} />
            </div>
          </aside>

          <main className="center-col">
            <div className="center-toolbar">
              <button type="button" className={'btn ' + (mode === 'scale' ? 'btn-w' : 'btn-ghost')} onClick={() => setMode((p) => (p === 'scale' ? 'zone' : 'scale'))}>
                {mode === 'scale' ? "Terminer l'échelle" : "Définir l'échelle"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowZoneNumbers((p) => !p)}>
                {showZoneNumbers ? '# Masquer n°' : '# Afficher n°'}
              </button>
              {scale && <span className="mode-badge">Echelle : {scale.toFixed(4)} cm/px</span>}
            </div>

            {(mode === 'scale' || pendingScalePixels) && (
              <div className="scale-bar fi">
                <span style={{ fontSize: '.8rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  {pendingScalePixels ? 'Ligne : ' + pendingScalePixels.toFixed(1) + ' px' : 'Trace une ligne de reference'}
                </span>
                {pendingScalePixels && (
                  <>
                    <input type="number" inputMode="decimal" step="0.01" min="0" value={scaleInputCm} onChange={(e) => setScaleInputCm(e.target.value)} className="inp" placeholder="Longueur reelle (cm)" style={{ flex: 1, maxWidth: 180 }} autoFocus />
                    <button type="button" onClick={handleSaveScale} className="btn btn-g">Enregistrer</button>
                    <button type="button" onClick={() => { setPendingScalePixels(null); setScaleInputCm(''); }} className="btn btn-ghost">Annuler</button>
                  </>
                )}
              </div>
            )}

            <div className={'canvas-area' + (mode === 'scale' ? ' mode-scale' : '')}>
              {imageSrc ? (
                <>
                  <div ref={canvasWrapRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onTouchStart={e => { const r = canvasWrapRef.current?.getBoundingClientRect(); if (r) onWrapTouchStart(e, r); }}
                    onTouchMove={e => { const r = canvasWrapRef.current?.getBoundingClientRect(); if (r) onWrapTouchMove(e, r); }}
                    onTouchEnd={onWrapTouchEnd} onClick={onDoubleTap}
                  >
                    <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                      style={{ touchAction: 'none', cursor: mode === 'scale' ? 'crosshair' : 'pointer', maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
                  </div>
                  {zoomLevel > 1.05 && <div className="zoom-badge">x{zoomLevel.toFixed(1)}</div>}
                  <div className="canvas-hint">
                    {mode === 'scale' ? 'Clique et glisse pour tracer une ligne de reference' : 'Clique sur une zone pour la selectionner'}
                  </div>
                </>
              ) : (
                <div className="canvas-empty">
                  <WildFlower style={{ width: '5rem', opacity: .35 }} />
                  <span>Importe le patron de ton vitrail</span>
                  <span style={{ fontSize: '.75rem' }}>PNG, JPG, WebP...</span>
                </div>
              )}
            </div>
          </main>

          <aside className="sidebar sidebar-right">
            <ZonePanel
  zones={zones}
  glasses={projectGlasses}
  selectedZoneIds={selectedZoneIds}
  scale={scale}
  onSelectZone={handleSelectZone}
  onDeleteZone={handleDeleteZone}
  onAssignGlass={handleAssignGlass}
/>

            <div className="card mt3">
              <p className="ctitle"><span>🌱</span> Recapitulatif</p>
              <div className="mt2">
                {([['Verre', glassCost], ['Cuivre', copperCost], ['Soudure', solderCost], ["Main d'oeuvre", laborCost]] as [string, number][]).map(([l, v]) => (
                  <div key={l} className="cost-row"><span className="tsm">{l}</span><span className="tsm">{v.toFixed(2)} euros</span></div>
                ))}
                <div className="cost-total"><span>Cout total</span><span>{totalCost.toFixed(2)} euros</span></div>
              </div>
            </div>

            <div className="card mt3">
              <p className="ctitle"><span>🍀</span> Formule de prix</p>
              <div className="stack-sm mt2">
                {([['x2_materiaux', 'x2 materiaux'], ['x2_plus_mo', 'x2 materiaux + MO'], ['x3_total', 'x3 total'], ['marge_30', 'Marge 30 %'], ['custom', 'Formule personnalisee']] as [string, string][]).map(([v, l]) => (
                  <label key={v} className="rlabel"><input type="radio" name="pm" checked={pricingMode === v} onChange={() => setPricingMode(v)} /><span>{l}</span></label>
                ))}
              </div>
              <div className="mt3">
                <input type="text" value={customFormula} onChange={(e) => setCustomFormula(e.target.value)} className="inp" placeholder="(cost_total * 2.5) + 20" disabled={pricingMode !== 'custom'} />
                <p className="tmu mt1">Variables : cost_total, glass_cost, copper_cost, solder_cost, labor_cost</p>
              </div>
              {finalPrice.error
                ? <p className="err mt2">Erreur : {finalPrice.error}</p>
                : <div className="price-box"><div className="row-between" style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem' }}><span>Prix final</span><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{finalPrice.value.toFixed(2)} euros</span></div></div>
              }
              <div className="g2 mt3">
                <button type="button" onClick={() => openResult('compliment')} disabled={!!finalPrice.error} className="btn btn-g">Calculer</button>
                <button type="button" onClick={() => openResult('roast')} disabled={!!finalPrice.error} className="btn btn-w">Roast</button>
              </div>
            </div>

            <GlassLibrary
  glasses={projectGlasses}
  onAdd={(g) => setProjectGlasses((p) => [...p, g])}
  onDelete={(id) => {
    setProjectGlasses((p) => p.filter((g) => g.id !== id));
    setZones((p) =>
      p.map((z) =>
        z.glassId === id
          ? { ...z, glassId: null, color: null, zone_cost: 0 }
          : z
      )
    );
  }}
  onAddToProject={(g) => {
    if (globalGlasses.some((x) => x.id === g.id)) return;
    setGlobalGlasses((p) => [...p, g]);
  }}
/>
            <div style={{ height: '1.5rem' }} />
          </aside>
        </div>
      )}

      {activeTab === 'saved' && (
        <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
          <div className="card">
            <p className="ctitle"><span>🗂️</span> Projets sauvegardes</p>
            {savedProjects.length === 0
              ? <p className="tmu mt2">Aucun projet sauvegardé pour l&apos;instant.</p>
              : <div className="stack mt2">{savedProjects.map((project) => (
                <div key={project.id} className="project-row">
                  <div><div className="tsm tbold">{project.name}</div><div className="tmu">{new Date(project.savedAt).toLocaleString('fr-FR')}</div></div>
                  <div className="row gap-sm">
                    <button type="button" className="btn btn-g btn-sm" onClick={() => openSavedProject(project)}>Ouvrir</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteSavedProject(project.id)}>Supprimer</button>
                  </div>
                </div>
              ))}</div>
            }
          </div>
        </div>
      )}

     {activeTab === 'bank' && (
  <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
    <GlassLibrary
      glasses={globalGlasses}
      onAdd={(g) => setGlobalGlasses((p) => [...p, g])}
      onDelete={(id) => {
        const usedInProject = projectGlasses.some((g) => g.id === id);

        if (usedInProject) {
          setPendingDeleteGlassId(id);
          setShowSnowWarning(true);
          return;
        }

        setGlobalGlasses((p) => p.filter((g) => g.id !== id));
      }}
      onAddToProject={(g) => {
        if (projectGlasses.some((x) => x.id === g.id)) return;
        setProjectGlasses((p) => [...p, g]);
      }}
      projectGlassIds={projectGlasses.map((g) => g.id)}
    />
  </div>
)}

{showSnowWarning && (
  <div
    className="snow-warning-overlay"
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(30,24,16,.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}
  >
<div
  className="card"
  style={{
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        boxShadow: '0 12px 40px rgba(30,20,10,.22)',
      }}
    >
     <div style={{ marginBottom: '.75rem' }}>
  <SnowPortrait mood="judging" />
  <p className="tmu snow-warning-text" style={{ fontSize: '.95rem', color: 'var(--ink-mid)', fontStyle: 'normal', lineHeight: 1.5, marginTop: '.5rem' }}>
    Ce verre est utilisé dans ton projet. Tu veux vraiment le supprimer de la banque ?
  </p>
</div>

      <div className="g2 mt3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setShowSnowWarning(false);
            setPendingDeleteGlassId(null);
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (pendingDeleteGlassId !== null) {
              setGlobalGlasses((p) =>
                p.filter((g) => g.id !== pendingDeleteGlassId)
              );
            }
            setShowSnowWarning(false);
            setPendingDeleteGlassId(null);
          }}
        >
          Supprimer
        </button>
      </div>
    </div>
  </div>
)}
</div>
);
}
