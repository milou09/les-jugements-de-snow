import React, { useMemo, useState } from 'react';

export interface Glass {
  id: number;
  nom: string;
  prix_dm2: number;
  couleur: string;
  overlayColor: { r: number; g: number; b: number; a: number };
}

function hexToRgba(hex: string) {
  const c = hex.replace('#', '');
  const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.padEnd(6, '0');
  return {
    r: parseInt(f.slice(0, 2), 16),
    g: parseInt(f.slice(2, 4), 16),
    b: parseInt(f.slice(4, 6), 16),
    a: 0.7,
  };
}

function toSafeNumber(v: unknown, fb = 0): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isFinite(n) ? n : fb;
}

export function normalizeGlass(g: Partial<Glass> & Record<string, unknown>): Glass | null {
  if (!g || typeof g !== 'object') return null;
  const nom = typeof g.nom === 'string' ? g.nom : 'Verre sans nom';
  const couleur = typeof g.couleur === 'string' && g.couleur ? g.couleur : '#7dd3fc';
  const prix_dm2 = toSafeNumber(g.prix_dm2, 0);
  return {
    id: (g.id as number) ?? Date.now() + Math.floor(Math.random() * 1000),
    nom,
    prix_dm2,
    couleur,
    overlayColor: (g.overlayColor as Glass['overlayColor']) ?? hexToRgba(couleur),
  };
}

interface GlassLibraryProps {
  title: string;
  glasses: Glass[];
  emptyLabel?: string;
  onAdd?: (glass: Glass) => void;
  onDelete?: (id: number) => void;
  onAssignToProject?: (id: number) => void;
}

export default function GlassLibrary({
  title,
  glasses,
  emptyLabel = 'Aucun verre enregistré.',
  onAdd,
  onDelete,
  onAssignToProject,
}: GlassLibraryProps) {
  const [form, setForm] = useState({ nom: '', prix_dm2: '', couleur: '#7dd3fc' });
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glasses;
    return glasses.filter((g) => g.nom.toLowerCase().includes(q));
  }, [glasses, query]);

  const handleAdd = () => {
    if (!onAdd) return;
    const nom = form.nom.trim();
    const prix = toSafeNumber(form.prix_dm2, NaN);
    if (!nom || !isFinite(prix) || prix < 0) return;
    const glass = normalizeGlass({
      id: Date.now() + Math.floor(Math.random() * 1000),
      nom,
      prix_dm2: prix,
      couleur: form.couleur,
    });
    if (!glass) return;
    onAdd(glass);
    setForm({ nom: '', prix_dm2: '', couleur: '#7dd3fc' });
  };

  return (
    <div className="card mt3" style={{ marginBottom: '1rem' }}>
      <p className="ctitle">
        <span>🪟</span>{title}
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="inp mt2"
        placeholder="Rechercher un verre"
      />

      {onAdd && (
        <div className="sy mt3">
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
            className="inp"
            placeholder="Nom du verre"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={form.prix_dm2}
            onChange={(e) => setForm((p) => ({ ...p, prix_dm2: e.target.value }))}
            className="inp"
            placeholder="Prix au dm² (€)"
          />
          <div className="cpick">
            <input
              type="color"
              value={form.couleur}
              onChange={(e) => setForm((p) => ({ ...p, couleur: e.target.value }))}
            />
            <span className="tmu">{form.couleur}</span>
          </div>
          <button type="button" onClick={handleAdd} className="btn-g wfull">
            Ajouter un verre
          </button>
        </div>
      )}

      <div className="sys mt4">
        {filtered.length === 0 ? (
          <p className="tmu">{emptyLabel}</p>
        ) : (
          filtered.map((g) => (
            <div key={g.id} className="grow">
              <div className="fg">
                <span
                  className="cdot"
                  style={{ backgroundColor: g.couleur, width: '18px', height: '18px' }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: '.85rem', fontWeight: 500, color: '#2d2416' }}>
                    {g.nom}
                  </p>
                  <p style={{ margin: 0, fontSize: '.75rem', color: '#8a7050', fontStyle: 'italic' }}>
                    {g.prix_dm2.toFixed(2)} €/dm²
                  </p>
                </div>
              </div>
              <div className="fg">
                {onAssignToProject && (
                  <button type="button" onClick={() => onAssignToProject(g.id)} className="btn-g">
                    + Projet
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={() => onDelete(g.id)} className="btn-d">
                    Retirer
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
