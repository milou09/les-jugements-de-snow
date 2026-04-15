import React from 'react';
import type { Zone } from '../hooks/useZoneDetection';

interface Glass {
  id: number;
  nom: string;
  prix_dm2: number;
  couleur: string;
}

interface ZonePanelProps {
  zones: Zone[];
  glasses: Glass[];
  selectedZoneIds: number[];
  scale: number | null;
  onToggleZone: (id: number) => void;
  onClearSelection: () => void;
  onDeleteSelectedZones: () => void;
  onAssignGlassToSelected: (glassId: string) => void;
}

export default function ZonePanel({
  zones,
  glasses,
  selectedZoneIds,
  scale,
  onToggleZone,
  onClearSelection,
  onDeleteSelectedZones,
  onAssignGlassToSelected,
}: ZonePanelProps) {
  const selectedZones = zones.filter((z) => selectedZoneIds.includes(z.id));
  const selectedZone = selectedZones[0] ?? null;
  const selectedGlass = selectedZone
    ? glasses.find((g) => g.id === selectedZone.glassId) ?? null
    : null;

  return (
    <>
      {zones.length > 0 && (
        <div className="card mt3 fi">
          <p className="ctitle">
            <span>🍂</span>Zones — {zones.length}
          </p>

          <details className="mt2" open>
            <summary className="tsm" style={{ cursor: 'pointer' }}>
              Liste des zones ({selectedZoneIds.length} sélectionnée(s))
            </summary>
            <div className="sys mt2">
              {zones.map((zone) => {
                const zg = glasses.find((g) => g.id === zone.glassId);
                return (
                  <label key={zone.id} className="grow" style={{ cursor: 'pointer' }}>
                    <div className="fg">
                      <input
                        type="checkbox"
                        checked={selectedZoneIds.includes(zone.id)}
                        onChange={() => onToggleZone(zone.id)}
                      />
                      <span
                        className="cdot"
                        style={{ backgroundColor: zg ? zg.couleur : 'rgba(139,105,20,.1)' }}
                      />
                      <div>
                        <span className="tsm tbold" style={{ color: '#2d2416' }}>
                          {zone.label}
                        </span>
                        {zg && (
                          <p className="tmu" style={{ margin: 0, fontSize: '.75rem' }}>
                            {zg.nom}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="tmu">{zone.area_px.toLocaleString()} px</span>
                  </label>
                );
              })}
            </div>
          </details>

          <div className="mt3">
            <span className="lbl">Attribuer un verre à la sélection</span>
            <select
              value=""
              onChange={(e) => onAssignGlassToSelected(e.target.value)}
              className="inp"
              disabled={selectedZoneIds.length === 0}
            >
              <option value="">— Choisir un verre —</option>
              {glasses.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom} — {g.prix_dm2.toFixed(2)} €/dm²
                </option>
              ))}
            </select>
          </div>

          <div className="fl g2r mt3">
            <button
              type="button"
              onClick={onClearSelection}
              className="btn-w"
              style={{ flex: 1 }}
            >
              Vider sélection
            </button>
            <button
              type="button"
              onClick={onDeleteSelectedZones}
              className="btn-d"
              style={{ flex: 1 }}
              disabled={selectedZoneIds.length === 0}
            >
              Supprimer sélection
            </button>
          </div>
        </div>
      )}

      {selectedZone && (
        <div className="card mt3 fi">
          <p className="ctitle">
            <span>✦</span>Détail {selectedZone.label}
          </p>
          <div className="sys tsm">
            <div className="fb">
              <span>Surface</span>
              <span>
                {selectedZone.area_px.toLocaleString()} px
                {selectedZone.area_cm2 !== null ? ` · ${selectedZone.area_cm2.toFixed(2)} cm²` : ''}
              </span>
            </div>
            <div className="fb">
              <span>Périmètre</span>
              <span>{selectedZone.perimeter_px.toLocaleString()} px</span>
            </div>
            <div className="fb">
              <span>Verre</span>
              <span>{selectedGlass ? selectedGlass.nom : '—'}</span>
            </div>
            <div className="fb">
              <span>Coût zone</span>
              <span className="tbold">{selectedZone.zone_cost.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}

      {zones.length > 0 && !scale && (
        <div className="warn mt3">⚠ Aucune échelle — les coûts ne peuvent pas être calculés.</div>
      )}
    </>
  );
}
