import React from 'react';
import type { Zone } from '../hooks/useZoneDetection';

interface Glass { id: number; nom: string; prix_dm2: number; couleur: string; }

interface ZonePanelProps {
  zones: Zone[]; glasses: Glass[]; selectedZoneIds: number[];
  scale: number | null; onSelectZone: (id: number) => void;
  onDeleteZone: () => void; onAssignGlass: (glassId: string) => void;
}

export default function ZonePanel({ zones, glasses, selectedZoneIds, scale, onSelectZone, onDeleteZone, onAssignGlass }: ZonePanelProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const selectedZones = zones.filter((z) => selectedZoneIds.includes(z.id));
  const selectedZone = selectedZones[0] ?? null;
  const selectedGlass = selectedZones.length === 1 ? glasses.find((g) => g.id === selectedZones[0].glassId) ?? null : null;
  const totalSelectedAreaPx = selectedZones.reduce((s, z) => s + z.area_px, 0);
  const totalSelectedAreaCm2 = selectedZones.reduce((s, z) => s + (z.area_cm2 ?? 0), 0);
  const totalSelectedPerimPx = selectedZones.reduce((s, z) => s + z.perimeter_px, 0);
  const totalSelectedCost = selectedZones.reduce((s, z) => s + z.zone_cost, 0);

  return (
    <>
      {zones.length > 0 && (
        <div className="card fi">
          <button type="button" onClick={() => setIsOpen(p => !p)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: isOpen ? '.5rem' : 0 }}
          >
            <span className="ctitle" style={{ margin: 0 }}>
              <span>🍂</span>Zones — {zones.length}
            </span>
            <span className="tmu">{isOpen ? '▲' : '▼'}</span>
          </button>

          {isOpen && (
            <div className="stack-sm">
              {zones.map((zone) => {
                const zg = glasses.find((g) => g.id === zone.glassId);
                return (
                  <button key={zone.id} type="button"
                    className={'zone-row' + (selectedZoneIds.includes(zone.id) ? ' sel' : '')}
                    onClick={() => onSelectZone(zone.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span className="cdot" style={{ backgroundColor: zg ? zg.couleur : 'rgba(139,105,20,.1)' }} />
                      <div>
                        <span className="tsm tbold">{zone.label}</span>
                        {zg && <p className="tmu" style={{ margin: 0, fontSize: '.72rem' }}>{zg.nom}</p>}
                      </div>
                    </div>
                    <span className="tmu" style={{ fontSize: '.72rem' }}>
                      {zone.area_cm2 ? zone.area_cm2.toFixed(1) + ' cm²' : zone.area_px.toLocaleString() + ' px'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedZones.length > 0 && (
        <div className="card mt3 fi">
          <p className="ctitle">
            <span>✦</span>
            {selectedZones.length > 1 ? `${selectedZones.length} zones sélectionnées` : selectedZone?.label}
          </p>

          <div className="stack-sm tsm">
            <div className="row-between">
              <span>Surface</span>
              <span>
                {totalSelectedAreaPx.toLocaleString()} px
                {selectedZones.some(z => z.area_cm2 !== null) ? ` · ${totalSelectedAreaCm2.toFixed(2)} cm²` : ''}
              </span>
            </div>
            <div className="row-between">
              <span>Périmètre</span>
              <span>{totalSelectedPerimPx.toLocaleString()} px</span>
            </div>
            <div className="row-between">
              <span>Verre</span>
              <span>{selectedZones.length === 1 ? (selectedGlass ? selectedGlass.nom : '—') : 'Multi'}</span>
            </div>
            <div className="row-between">
              <span>Coût zone</span>
              <span className="tbold">{totalSelectedCost.toFixed(2)} €</span>
            </div>
          </div>

          <div className="mt3">
            <span className="lbl">Attribuer un verre</span>
            <select value={selectedZones.length === 1 ? selectedZone?.glassId ?? '' : ''} onChange={(e) => onAssignGlass(e.target.value)} className="inp">
              <option value="">— Choisir un verre —</option>
              {glasses.map((g) => (
                <option key={g.id} value={g.id}>{g.nom} — {g.prix_dm2.toFixed(2)} €/dm²</option>
              ))}
            </select>
          </div>

          <div className="mt3">
            <button type="button" onClick={onDeleteZone} className="btn btn-danger btn-sm">
              {selectedZones.length > 1 ? `Supprimer les ${selectedZones.length} zones` : 'Supprimer la zone'}
            </button>
          </div>
        </div>
      )}

      {zones.length > 0 && !scale && (
        <div className="warn mt3">
          ⚠ Aucune échelle définie — les coûts ne peuvent pas être calculés.
        </div>
      )}
    </>
  );
}
