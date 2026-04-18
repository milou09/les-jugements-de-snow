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
  const f =
    c.length === 3
      ? c.split('').map((x) => x + x).join('')
      : c.padEnd(6, '0');

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

export function normalizeGlass(
  g: Partial<Glass> & Record<string, unknown>
): Glass | null {
  if (!g || typeof g !== 'object') return null;

  const nom = typeof g.nom === 'string' ? g.nom : 'Verre sans nom';
  const couleur =
    typeof g.couleur === 'string' && g.couleur ? g.couleur : '#7dd3fc';
  const prix_dm2 = toSafeNumber(g.prix_dm2, 0);

  return {
    id: (g.id as number) ?? Date.now() + Math.floor(Math.random() * 1000),
    nom,
    prix_dm2,
    couleur,
    overlayColor:
      (g.overlayColor as Glass['overlayColor']) ?? hexToRgba(couleur),
  };
}

interface GlassLibraryProps {
  glasses: Glass[];
  onAdd: (g: Glass) => void;
  onDelete: (id: number) => void;
  onAddToProject?: (g: Glass) => void;
}

export default function GlassLibrary({
  glasses,
  onAdd,
  onDelete,
  onAddToProject,
}: GlassLibraryProps) {
  const [form, setForm] = useState({
    nom: '',
    prix_dm2: '',
    couleur: '#7dd3fc',
  });
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const handleAdd = () => {
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
    setForm({
      nom: '',
      prix_dm2: '',
      couleur: '#7dd3fc',
    });
  };

  const filteredGlasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return glasses;

    return glasses.filter((g) =>
      g.nom.toLowerCase().includes(q)
    );
  }, [glasses, search]);

  return (
    <div className="card mt3">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: isOpen ? '.65rem' : 0,
        }}
      >
        <span className="ctitle" style={{ margin: 0 }}>
          <span>🪟</span>
          Bibliothèque de verres {glasses.length > 0 && `(${glasses.length})`}
        </span>
        <span className="tmu">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="stack-sm">
            <input
              type="text"
              value={form.nom}
              onChange={(e) =>
                setForm((p) => ({ ...p, nom: e.target.value }))
              }
              className="inp"
              placeholder="Nom du verre"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />

            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.prix_dm2}
              onChange={(e) =>
                setForm((p) => ({ ...p, prix_dm2: e.target.value }))
              }
              className="inp"
              placeholder="Prix au dm² (€)"
            />

            <div className="cpick">
              <input
                type="color"
                value={form.couleur}
                onChange={(e) =>
                  setForm((p) => ({ ...p, couleur: e.target.value }))
                }
              />
              <span className="tmu">{form.couleur}</span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="btn btn-g w-full"
            >
              + Ajouter
            </button>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inp"
              placeholder="Rechercher un verre..."
            />
          </div>

          {filteredGlasses.length > 0 && (
            <div className="stack-sm mt3">
              {filteredGlasses.map((g) => (
                <div key={g.id} className="glass-row">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.5rem',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: g.couleur,
                        border: '1px solid rgba(80,60,20,.2)',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '.83rem',
                          fontWeight: 500,
                          color: 'var(--ink-mid)',
                        }}
                      >
                        {g.nom}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '.73rem',
                          color: 'var(--ink-faint)',
                          fontStyle: 'italic',
                        }}
                      >
                        {g.prix_dm2.toFixed(2)} €/dm²
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '.35rem' }}>
                    {onAddToProject && (
                      <button
                        type="button"
                        onClick={() => onAddToProject(g)}
                        className="btn btn-ghost btn-sm"
                      >
                        ➕ Projet
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDelete(g.id)}
                      className="btn btn-danger btn-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {glasses.length > 0 && filteredGlasses.length === 0 && (
            <p className="tmu mt2">Aucun verre trouvé.</p>
          )}

          {glasses.length === 0 && (
            <p className="tmu mt2">Aucun verre enregistré.</p>
          )}
        </>
      )}
    </div>
  );
}
