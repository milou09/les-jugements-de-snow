import React, { useEffect, useRef, useCallback } from 'react';
import { LeafBranch, WildFlower } from './svg/Illustrations';
import type { Zone } from '../hooks/useZoneDetection';

interface CanvasProps {
  showZoneNumbers: boolean;
  imageSrc: string | null;
  imageElement: HTMLImageElement | null;
  canvasSize: { width: number; height: number };
  baseImageData: ImageData | null;
  zones: Zone[];
  selectedZoneIds: number[];
  scaleLine: { x1: number; y1: number; x2: number; y2: number } | null;
  mode: 'zone' | 'scale';
  zoomLevel: number;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onWrapTouchStart: (e: React.TouchEvent, rect: DOMRect) => void;
  onWrapTouchMove: (e: React.TouchEvent, rect: DOMRect) => void;
  onWrapTouchEnd: (e: React.TouchEvent) => void;
  onDoubleTap: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasWrapRef: React.RefObject<HTMLDivElement>;
}

export default function Canvas({
  showZoneNumbers, imageSrc, imageElement, canvasSize, baseImageData,
  zones, selectedZoneIds, scaleLine, mode, zoomLevel,
  onPointerDown, onPointerMove, onPointerUp,
  onWrapTouchStart, onWrapTouchMove, onWrapTouchEnd, onDoubleTap,
  canvasRef, canvasWrapRef,
}: CanvasProps) {

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImageData) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(baseImageData, 0, 0);

    if (zones.length > 0) {
      const ov = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = ov.data;
      for (const zone of zones) {
        for (const pi of zone.pixelArray) {
          const off = pi * 4;
          if (zone.color) { d[off] = zone.color.r; d[off+1] = zone.color.g; d[off+2] = zone.color.b; d[off+3] = Math.round(zone.color.a * 255); }
          if (selectedZoneIds.includes(zone.id)) {
            d[off]   = Math.round(d[off]   * 0.75 + 16  * 0.25);
            d[off+1] = Math.round(d[off+1] * 0.75 + 185 * 0.25);
            d[off+2] = Math.round(d[off+2] * 0.75 + 129 * 0.25);
          }
        }
      }
      ctx.putImageData(ov, 0, 0);

      if (showZoneNumbers) {
        ctx.save();
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const zone of zones) {
          if (!zone.pixelArray?.length) continue;
          let sumX = 0, sumY = 0;
          for (const pi of zone.pixelArray) { sumX += pi % canvas.width; sumY += Math.floor(pi / canvas.width); }
          const x = sumX / zone.pixelArray.length, y = sumY / zone.pixelArray.length;
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillRect(x - 10, y - 10, 20, 20);
          ctx.fillStyle = '#2d2416';
          ctx.fillText(zone.label.replace(/\D+/g, '') || String(zone.id), x, y);
        }
        ctx.restore();
      }
    }

    if (scaleLine) {
      ctx.save();
      ctx.strokeStyle = '#5c7a3e'; ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.moveTo(scaleLine.x1, scaleLine.y1); ctx.lineTo(scaleLine.x2, scaleLine.y2); ctx.stroke();
      ctx.setLineDash([]);
      for (const [x, y] of [[scaleLine.x1, scaleLine.y1], [scaleLine.x2, scaleLine.y2]] as [number, number][]) {
        ctx.fillStyle = '#5c7a3e'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }, [baseImageData, zones, scaleLine, selectedZoneIds, showZoneNumbers, canvasRef]);

  useEffect(() => { redraw(); }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement || !canvasSize.width) return;
    canvas.width = canvasSize.width; canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    ctx.drawImage(imageElement, 0, 0, canvasSize.width, canvasSize.height);
  }, [imageElement, canvasSize, canvasRef]);

  if (!imageSrc) {
    return (
      <div className="canvas-empty" style={{ height: '100%' }}>
        <WildFlower style={{ width: '5rem', opacity: .35 }} />
        <span>Importe le patron de ton vitrail</span>
        <span style={{ fontSize: '.75rem', color: 'var(--ink-faint)' }}>PNG, JPG, WebP...</span>
      </div>
    );
  }

  return (
    <>
      <div
        ref={canvasWrapRef}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        onTouchStart={e => { const r = canvasWrapRef.current?.getBoundingClientRect(); if (r) onWrapTouchStart(e, r); }}
        onTouchMove={e => { const r = canvasWrapRef.current?.getBoundingClientRect(); if (r) onWrapTouchMove(e, r); }}
        onTouchEnd={onWrapTouchEnd}
        onClick={onDoubleTap}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ touchAction: 'none', cursor: mode === 'scale' ? 'crosshair' : 'pointer', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
        />
      </div>
      {zoomLevel > 1.05 && <div className="zoom-badge">×{zoomLevel.toFixed(1)}</div>}
      <div className="canvas-hint">
        {mode === 'scale' ? '✏️ Clique et glisse pour tracer une ligne' : '👆 Clique sur une zone pour la sélectionner'}
      </div>
    </>
  );
}
