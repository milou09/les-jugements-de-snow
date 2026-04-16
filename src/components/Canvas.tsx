import React, { useEffect, useRef, useCallback } from 'react';
import { LeafBranch } from './svg/Illustrations';
import type { Zone } from '../hooks/useZoneDetection';

interface CanvasProps {
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
  imageSrc,
  imageElement,
  canvasSize,
  baseImageData,
  zones,
  selectedZoneIds,
  scaleLine,
  mode,
  zoomLevel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWrapTouchStart,
  onWrapTouchMove,
  onWrapTouchEnd,
  onDoubleTap,
  canvasRef,
  canvasWrapRef,
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

          if (zone.color) {
            d[off]   = zone.color.r;
            d[off+1] = zone.color.g;
            d[off+2] = zone.color.b;
            d[off+3] = Math.round(zone.color.a * 255);
          }

          if (selectedZoneIds.includes(zone.id)) {
            d[off]   = Math.round(d[off]   * 0.75 + 16  * 0.25);
            d[off+1] = Math.round(d[off+1] * 0.75 + 185 * 0.25);
            d[off+2] = Math.round(d[off+2] * 0.75 + 129 * 0.25);
          }
        }
      }

      ctx.putImageData(ov, 0, 0);
    }

    if (scaleLine) {
      ctx.save();
      ctx.strokeStyle = '#5c7a3e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(scaleLine.x1, scaleLine.y1);
      ctx.lineTo(scaleLine.x2, scaleLine.y2);
      ctx.stroke();

      for (const [x, y] of [[scaleLine.x1, scaleLine.y1], [scaleLine.x2, scaleLine.y2]] as [number, number][]) {
        ctx.fillStyle = '#5c7a3e';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }, [baseImageData, zones, scaleLine, selectedZoneIds, canvasRef]);

  useEffect(() => { redraw(); }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement || !canvasSize.width) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(imageElement, 0, 0, canvasSize.width, canvasSize.height);
  }, [imageElement, canvasSize, canvasRef]);

  return (
    <div className="card mt3">
      {imageSrc ? (
        <>
          <div
            ref={canvasWrapRef}
            className="cwrap"
            onTouchStart={e => {
              const rect = canvasWrapRef.current?.getBoundingClientRect();
              if (rect) onWrapTouchStart(e, rect);
            }}
            onTouchMove={e => {
              const rect = canvasWrapRef.current?.getBoundingClientRect();
              if (rect) onWrapTouchMove(e, rect);
            }}
            onTouchEnd={onWrapTouchEnd}
            onClick={onDoubleTap}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{
                touchAction: 'none',
                cursor: mode === 'scale' ? 'crosshair' : 'pointer',
              }}
            />
            {zoomLevel > 1.05 && (
              <div className="zoom-badge">×{zoomLevel.toFixed(1)}</div>
            )}
          </div>

          <p className="tmu mt2" style={{ textAlign: 'center' }}>
            {mode === 'scale'
              ? '✏️ Trace une ligne de référence'
              : zoomLevel > 1.05
                ? '👆 Clique · 🤏 Pince pour zoomer · Double-tap pour réinitialiser'
                : '👆 Clique · 🤏 Pince pour zoomer'}
          </p>
        </>
      ) : (
        <div className="ec">
          <LeafBranch style={{ width: '6rem', opacity: .4 }}/>
          <span>Importe le patron de ton vitrail</span>
        </div>
      )}
    </div>
  );
}
