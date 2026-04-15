import React, { useEffect, useRef, useState, useCallback } from 'react';
import Canvas from './components/Canvas';
import ZonePanel from './components/ZonePanel';
import GlassLibrary, { normalizeGlass } from './components/GlassLibrary';
import type { Glass } from './components/GlassLibrary';
import { Acorn, WildFlower, PineBranch } from './components/svg/Illustrations';
import { useZoom } from './hooks/useZoom';
import { detectZone } from './hooks/useZoneDetection';
import type { Zone } from './hooks/useZoneDetection';

const MAX_WIDTH = 1000;
const GLOBAL_GLASS_STORAGE_KEY = 'vitrail_tiffany_global_glasses_v3';
const PROJECTS_STORAGE_KEY = 'vitrail_tiffany_projects_v1';

type Tab = 'current' | 'saved' | 'bank';

interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  imageSrc: string | null;
  zones: Array<Omit<Zone, 'pixelSet'> & { pixelSet: number[] }>;
  projectGlasses: number[];
  scale: number | null;
  copperPricePerMeter: string;
  solderPricePerMeter: string;
  laborHours: string;
  laborRate: string;
}

function toSafeNumber(v: unknown, fb = 0): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isFinite(n) ? n : fb;
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');`;

const CSS = `
*{box-sizing:border-box;} body{margin:0;} .vr{min-height:100dvh;background:linear-gradient(160deg,#eee8d8 0%,#e8e0cc 40%,#ddd5c0 100%);font-family:'Lora',Georgia,serif;color:#2d2416;}
.card{background:linear-gradient(135deg,rgba(255,253,245,0.92) 0%,rgba(245,240,225,0.88) 100%);border:1px solid rgba(139,105,20,0.18);border-radius:4px;padding:1.1rem;box-shadow:0 2px 12px rgba(80,60,20,0.10);}
.ctitle{font-family:'Playfair Display',Georgia,serif;font-size:0.78rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#4a5e35;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem;}
.inp{width:100%;background:rgba(255,253,245,0.8);border:1px solid rgba(139,105,20,0.25);border-radius:3px;padding:0.75rem;font-size:16px;} .btn-g,.btn-w,.btn-d{border:none;border-radius:3px;padding:.7rem .9rem;cursor:pointer}
.btn-g{background:#4a6741;color:#f5f0e8;} .btn-w{background:#6b4c1e;color:#f5ead8;} .btn-d{background:rgba(180,60,40,.08);color:#a03020;border:1px solid rgba(180,60,40,.2);} 
.mt2{margin-top:.5rem}.mt3{margin-top:.75rem}.mt4{margin-top:1rem}.sys>*+*{margin-top:.4rem}.sy>*+*{margin-top:.55rem}
.fb{display:flex;justify-content:space-between;align-items:center}.fg{display:flex;align-items:center;gap:.5rem}.g2{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
.tsm{font-size:.85rem;color:#5a4a2a}.tmu{font-size:.8rem;color:#8a7050;font-style:italic}.tbold{font-weight:600}.wfull{width:100%}.fl{display:flex}.g2r{gap:.5rem}
.cdot{width:14px;height:14px;border-radius:50%;border:1px solid rgba(80,60,20,.2);display:inline-block}
.grow{display:flex;justify-content:space-between;align-items:center;background:rgba(245,240,225,.6);border:1px solid rgba(139,105,20,.1);border-radius:3px;padding:.6rem .75rem;}
.hdr-inner{background:linear-gradient(135deg,rgba(74,103,65,.12) 0%,rgba(107,76,30,.08) 100%);border:1px solid rgba(139,105,20,.2);border-radius:4px;padding:.7rem 1rem;text-align:center;position:relative;}
.hdr-eye{font-size:.65rem;letter-spacing:.22em;text-transform:uppercase;color:#7a9e52;font-style:italic;margin:0}.hdr-title{font-family:'Playfair Display',Georgia,serif;font-size:1.35rem;font-weight:600;margin:.1rem 0 0;}
.tabs{display:flex;gap:.5rem;}.tab-btn{flex:1;border:1px solid rgba(139,105,20,.25);background:rgba(255,253,245,.8);padding:.65rem .7rem;border-radius:4px;cursor:pointer}.tab-btn.active{background:#4a6741;color:#fff;border-color:#4a6741}
`;

function serializeZones(zones: Zone[]): SavedProject['zones'] {
  return zones.map((z) => ({ ...z, pixelSet: [...z.pixelSet] }));
}

function deserializeZones(zones: SavedProject['zones']): Zone[] {
  return zones.map((z) => ({ ...z, pixelSet: new Set(z.pixelSet) }));
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const zoneCounterRef = useRef(0);

  const [tab, setTab] = useState<Tab>('current');
  const [projectName, setProjectName] = useState('Projet sans nom');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [baseImageData, setBaseImageData] = useState<ImageData | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<number[]>([]);
  const [showZoneNumbers, setShowZoneNumbers] = useState(true);
  const [mode, setMode] = useState<'zone' | 'scale'>('zone');
  const [scale, setScale] = useState<number | null>(null);
  const [scaleLine, setScaleLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isDrawingScale, setIsDrawingScale] = useState(false);
  const [scaleStart, setScaleStart] = useState<{ x: number; y: number } | null>(null);
  const [pendingScalePixels, setPendingScalePixels] = useState<number | null>(null);
  const [scaleInputCm, setScaleInputCm] = useState('');

  const [globalGlasses, setGlobalGlasses] = useState<Glass[]>([]);
  const [projectGlassIds, setProjectGlassIds] = useState<number[]>([]);

  const [copperPricePerMeter, setCopperPricePerMeter] = useState('');
  const [solderPricePerMeter, setSolderPricePerMeter] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [laborRate, setLaborRate] = useState('');

  const {
    zoomLevel,
    onWrapTouchStart,
    onWrapTouchMove,
    onWrapTouchEnd,
    onDoubleTap,
    getCanvasXY,
  } = useZoom(canvasRef);

  const projectGlasses = globalGlasses.filter((g) => projectGlassIds.includes(g.id));

  useEffect(() => {
    try {
      const rawGlasses = localStorage.getItem(GLOBAL_GLASS_STORAGE_KEY);
      if (rawGlasses) {
        const parsed = JSON.parse(rawGlasses);
        if (Array.isArray(parsed)) {
          setGlobalGlasses(parsed.map(normalizeGlass).filter(Boolean) as Glass[]);
        }
      }
      const rawProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (rawProjects) {
        const parsed = JSON.parse(rawProjects);
        if (Array.isArray(parsed)) setSavedProjects(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(GLOBAL_GLASS_STORAGE_KEY, JSON.stringify(globalGlasses));
  }, [globalGlasses]);

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects));
  }, [savedProjects]);

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
      setCanvasSize({ width: Math.round(img.width * ratio), height: Math.round(img.height * ratio) });
      setScaleLine(null);
      setPendingScalePixels(null);
      setScaleInputCm('');
    };
    img.src = imageSrc;
  }, [imageSrc]);

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

  const resetProject = () => {
    setProjectName('Projet sans nom');
    setImageSrc(null);
    setZones([]);
    setSelectedZoneIds([]);
    setProjectGlassIds([]);
    setScale(null);
    setScaleLine(null);
    setScaleInputCm('');
    setPendingScalePixels(null);
    setCopperPricePerMeter('');
    setSolderPricePerMeter('');
    setLaborHours('');
    setLaborRate('');
    zoneCounterRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveCurrentProject = () => {
    const name = projectName.trim() || 'Projet sans nom';
    const payload: SavedProject = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      imageSrc,
      zones: serializeZones(zones),
      projectGlasses: projectGlassIds,
      scale,
      copperPricePerMeter,
      solderPricePerMeter,
      laborHours,
      laborRate,
    };
    setSavedProjects((prev) => [payload, ...prev]);
  };

  const loadProject = (p: SavedProject) => {
    setProjectName(p.name);
    setImageSrc(p.imageSrc);
    setZones(deserializeZones(p.zones));
    setSelectedZoneIds([]);
    setProjectGlassIds(p.projectGlasses);
    setScale(p.scale);
    setCopperPricePerMeter(p.copperPricePerMeter);
    setSolderPricePerMeter(p.solderPricePerMeter);
    setLaborHours(p.laborHours);
    setLaborRate(p.laborRate);
    zoneCounterRef.current = p.zones.length;
    setTab('current');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZones([]);
      setSelectedZoneIds([]);
      zoneCounterRef.current = 0;
    };
    reader.readAsDataURL(file);
  };

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
          prev.includes(existing.id) ? prev.filter((id) => id !== existing.id) : [...prev, existing.id]
        );
        return;
      }
      const zone = detectZone(x, y, baseImageData, scale, zoneCounterRef);
      if (!zone) return;
      setZones((p) => [...p, zone]);
      setSelectedZoneIds((p) => [...p, zone.id]);
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

  const handleSaveScale = () => {
    if (!pendingScalePixels || pendingScalePixels <= 0) return;
    const cm = toSafeNumber(scaleInputCm, NaN);
    if (!isFinite(cm) || cm <= 0) return;
    const ns = cm / pendingScalePixels;
    setScale(ns);
    setZones((prev) =>
      prev.map((z) => {
        const a = z.area_px * ns * ns;
        const gl = projectGlasses.find((g) => g.id === z.glassId);
        const p = gl ? gl.prix_dm2 / 100 : 0;
        return { ...z, area_cm2: a, zone_cost: a * p };
      })
    );
    setMode('zone');
    setScaleInputCm('');
    setPendingScalePixels(null);
  };

  const assignGlassToSelected = (glassId: string) => {
    const gl = projectGlasses.find((g) => g.id === Number(glassId));
    if (!gl || selectedZoneIds.length === 0) return;
    setZones((prev) =>
      prev.map((z) => {
        if (!selectedZoneIds.includes(z.id)) return z;
        const a = z.area_cm2 ?? 0;
        return { ...z, glassId: gl.id, color: gl.overlayColor, zone_cost: a * (gl.prix_dm2 / 100) };
      })
    );
  };

  const totalPerimPx = zones.reduce((s, z) => s + (z.perimeter_px || 0), 0);
  const copperCm = scale ? totalPerimPx * scale : 0;
  const copperM = copperCm / 100;
  const copperCost = copperM * toSafeNumber(copperPricePerMeter);
  const solderCost = copperM * toSafeNumber(solderPricePerMeter);
  const laborCost = toSafeNumber(laborHours) * toSafeNumber(laborRate);
  const glassCost = zones.reduce((s, z) => s + (z.zone_cost || 0), 0);
  const totalCost = glassCost + copperCost + solderCost + laborCost;

  return (
    <div className="vr">
      <style>{FONTS}{CSS}</style>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1rem', position: 'relative', zIndex: 1 }}>
        <div className="hdr-inner">
          <Acorn style={{ position: 'absolute', top: '.4rem', left: '.8rem', width: '2rem', opacity: 0.35 }} />
          <WildFlower style={{ position: 'absolute', top: '-.2rem', right: '.6rem', width: '2.5rem', opacity: 0.28, transform: 'scaleX(-1)' }} />
          <p className="hdr-eye">Atelier Vitrail</p>
          <h1 className="hdr-title">Calculateur Tiffany</h1>
        </div>

        <div className="tabs mt3">
          <button className={`tab-btn ${tab === 'current' ? 'active' : ''}`} onClick={() => setTab('current')}>Projet en cours</button>
          <button className={`tab-btn ${tab === 'saved' ? 'active' : ''}`} onClick={() => setTab('saved')}>Projets sauvegardés</button>
          <button className={`tab-btn ${tab === 'bank' ? 'active' : ''}`} onClick={() => setTab('bank')}>Banque de verre</button>
        </div>

        {tab === 'current' && (
          <>
            <div className="card mt3">
              <p className="ctitle"><span>📁</span>Projet en cours</p>
              <div className="g2 mt2">
                <input className="inp" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Nom du projet" />
                <button className="btn-g" onClick={saveCurrentProject}>Sauvegarder le projet</button>
              </div>
              <div className="g2 mt3">
                <button type="button" onClick={resetProject} className="btn-w">Nouveau projet</button>
                <button type="button" onClick={() => setMode((p) => (p === 'scale' ? 'zone' : 'scale'))} className="btn-g">{mode === 'scale' ? '→ Zones' : '⟷ Échelle'}</button>
              </div>
            </div>

            <div className="card mt4">
              <p className="ctitle"><span>🌿</span>Image du patron</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} />
              <label className="fg mt3" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={showZoneNumbers} onChange={(e) => setShowZoneNumbers(e.target.checked)} />
                <span className="tsm">Afficher les numéros de zone sur le dessin</span>
              </label>
            </div>

            <Canvas
              imageSrc={imageSrc}
              imageElement={imageElement}
              canvasSize={canvasSize}
              baseImageData={baseImageData}
              zones={zones}
              selectedZoneIds={selectedZoneIds}
              showZoneNumbers={showZoneNumbers}
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

            {(scale || mode === 'scale' || scaleLine || pendingScalePixels) && (
              <div className="card mt3">
                <p className="ctitle"><span>📏</span>Échelle</p>
                {scale && <p className="tsm">Enregistrée : {scale.toFixed(4)} cm/px</p>}
                {pendingScalePixels && (
                  <div className="sy mt2">
                    <p className="tsm">Ligne : {pendingScalePixels.toFixed(1)} px</p>
                    <input type="number" step="0.01" min="0" value={scaleInputCm} onChange={(e) => setScaleInputCm(e.target.value)} className="inp" placeholder="Longueur réelle (cm)" />
                    <button type="button" onClick={handleSaveScale} className="btn-g wfull">Enregistrer l'échelle</button>
                  </div>
                )}
              </div>
            )}

            <ZonePanel
              zones={zones}
              glasses={projectGlasses}
              selectedZoneIds={selectedZoneIds}
              scale={scale}
              onToggleZone={(id) => setSelectedZoneIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
              onClearSelection={() => setSelectedZoneIds([])}
              onDeleteSelectedZones={() => {
                setZones((p) => p.filter((z) => !selectedZoneIds.includes(z.id)));
                setSelectedZoneIds([]);
              }}
              onAssignGlassToSelected={assignGlassToSelected}
            />

            <GlassLibrary
              title="Banque de verre du projet"
              glasses={projectGlasses}
              onAdd={(g) => {
                setGlobalGlasses((p) => [...p, g]);
                setProjectGlassIds((p) => [...p, g.id]);
              }}
              onDelete={(id) => {
                setProjectGlassIds((p) => p.filter((gId) => gId !== id));
                setZones((p) => p.map((z) => (z.glassId === id ? { ...z, glassId: null, color: null, zone_cost: 0 } : z)));
              }}
              emptyLabel="Aucun verre dans ce projet."
            />

            <div className="card mt3">
              <p className="ctitle"><span>🌱</span>Récapitulatif</p>
              <div className="sys mt2 tsm">
                <div className="fb"><span>Verre</span><span>{glassCost.toFixed(2)} €</span></div>
                <div className="fb"><span>Cuivre</span><span>{copperCost.toFixed(2)} €</span></div>
                <div className="fb"><span>Soudure</span><span>{solderCost.toFixed(2)} €</span></div>
                <div className="fb"><span>Main d'œuvre</span><span>{laborCost.toFixed(2)} €</span></div>
                <div className="fb tbold"><span>Total</span><span>{totalCost.toFixed(2)} €</span></div>
              </div>
            </div>
          </>
        )}

        {tab === 'saved' && (
          <div className="card mt3">
            <p className="ctitle"><span>💾</span>Projets sauvegardés</p>
            <div className="sys mt3">
              {savedProjects.length === 0 && <p className="tmu">Aucun projet sauvegardé.</p>}
              {savedProjects.map((p) => (
                <div key={p.id} className="grow">
                  <div>
                    <p className="tsm tbold" style={{ margin: 0 }}>{p.name}</p>
                    <p className="tmu" style={{ margin: 0 }}>{new Date(p.savedAt).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="fg">
                    <button className="btn-g" onClick={() => loadProject(p)}>Ouvrir</button>
                    <button
                      className="btn-d"
                      onClick={() => {
                        if (window.confirm(`Supprimer définitivement « ${p.name} » ?`)) {
                          setSavedProjects((prev) => prev.filter((x) => x.id !== p.id));
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'bank' && (
          <>
            <GlassLibrary
              title="Banque de verre globale"
              glasses={globalGlasses}
              onAdd={(g) => setGlobalGlasses((p) => [...p, g])}
              onDelete={(id) => {
                setGlobalGlasses((p) => p.filter((g) => g.id !== id));
                setProjectGlassIds((p) => p.filter((gId) => gId !== id));
                setZones((p) => p.map((z) => (z.glassId === id ? { ...z, glassId: null, color: null, zone_cost: 0 } : z)));
              }}
              onAssignToProject={(id) => setProjectGlassIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
            />
            <div className="card mt3">
              <p className="tsm">Astuce : dans cette liste, utilise <b>+ Projet</b> pour ajouter un verre à la banque du projet en cours.</p>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', opacity: 0.28, marginTop: '1rem' }}>
          <PineBranch style={{ width: '10rem', margin: '0 auto' }} />
        </div>
      </div>
    </div>
  );
}
