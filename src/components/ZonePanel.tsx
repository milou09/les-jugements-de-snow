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
  onSelectZone: (id: number) => void;
  onDeleteZone: () => void;
  onAssignGlass: (glassId: string) => void;
}

export default function ZonePanel({
  zones,
  glasses,
  selectedZoneIds,
  scale,
  onSelectZone,
  onDeleteZone,
  onAssignGlass,
}: ZonePanelProps) {

  const selectedZone = zones.find(z => selectedZoneIds.includes(z.id)) ?? null;

  const selectedGlass = selectedZone
    ? glasses.find(g => g.id === selectedZone.glassId) ?? null
    : null;

  return (
    <>
      {/* Zone list */}
      {zones.length > 0 && (
        <div className="card mt3 fi">
          <p className="ctitle"><span>🍂</span>Zones — {zones.length}</p>
          <div className="sys mt2">
            {zones.map(zone => {
              const zg = glasses.find(g => g.id === zone.glassId);
              return (
                <button
                  key={zone.id}
                  type="button"
                  className={`zone-row${selectedZoneIds.includes(zone.id) ? ' sel' : ''}`}
                  onClick={() => onSelectZone(zone.id)}
                >
                  <div className="fg">
                    <span
                      className="cdot"
                      style={{ backgroundColor: zg ? zg.couleur : 'rgba(139,105,20,.1)' }}
                    />
                    <div>
                      <span className="tsm tbold" style={{ color:'#2d2416' }}>{zone.label}</span>
                      {zg && (
                        <p className="tmu" style={{ margin:0, fontSize:'.75rem' }}>{zg.nom}</p>
                      )}
                    </div>
                  </div>
                  <span className="tmu">{zone.area_px.toLocaleString()} px</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected zone detail (on garde une seule pour l’UI) */}
      {selectedZone && (
        <div className="card mt3 fi">
          <p className="ctitle"><span>✦</span>{selectedZone.label}</p>
          <div className="sys tsm">
            <div className="fb">
              <span>Surface</span>
              <span>
                {selectedZone.area_px.toLocaleString()} px
                {selectedZone.area_cm2 !== null
                  ? ` · ${selectedZone.area_cm2.toFixed(2)} cm²`
                  : ''}
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

          {/* Assign glass */}
          <div className="mt3">
            <span className="lbl">Attribuer un verre</span>
            <select
              value={selectedZone.glassId ?? ''}
              onChange={e => onAssignGlass(e.target.value)}
              className="inp"
            >
              <option value="">— Choisir un verre —</option>
              {glasses.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nom} — {g.prix_dm2.toFixed(2)} €/dm²
                </option>
              ))}
            </select>
          </div>

          {/* Delete */}
          <div className="mt3">
            <button type="button" onClick={onDeleteZone} className="btn-d">
              Supprimer la zone
            </button>
          </div>
        </div>
      )}

      {/* No scale warning */}
      {zones.length > 0 && !scale && (
        <div className="warn mt3">
          ⚠ Aucune échelle — les coûts ne peuvent pas être calculés.
        </div>
      )}
    </>
  );
}
