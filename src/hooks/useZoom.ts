import { useRef, useState, useCallback } from 'react';

export interface ZoomState {
  scale: number;
  tx: number;
  ty: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function useZoom(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const zoomRef = useRef<ZoomState>({ scale: 1, tx: 0, ty: 0 });
  const pinchRef = useRef<any>(null);
  const lastTapRef = useRef(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const applyZoom = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { scale, tx, ty } = zoomRef.current;
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    canvas.style.transformOrigin = '0 0';
  }, [canvasRef]);

  const resetZoom = useCallback(() => {
    zoomRef.current = { scale: 1, tx: 0, ty: 0 };
    applyZoom();
    setZoomLevel(1);
  }, [applyZoom]);

  const getPinchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const getPinchCenter = (touches: React.TouchList, rect: DOMRect) => ({
    cx: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
    cy: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
  });

  const onWrapTouchStart = useCallback((e: React.TouchEvent, wrapRect: DOMRect) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchRef.current = {
        dist: getPinchDist(e.touches),
        ...getPinchCenter(e.touches, wrapRect),
        startScale: zoomRef.current.scale,
        startTx: zoomRef.current.tx,
        startTy: zoomRef.current.ty,
      };
    }
  }, []);

  const onWrapTouchMove = useCallback((e: React.TouchEvent, wrapRect: DOMRect) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const newDist = getPinchDist(e.touches);
      const { cx, cy } = getPinchCenter(e.touches, wrapRect);
      const ratio = newDist / pinchRef.current.dist;
      const newScale = clamp(pinchRef.current.startScale * ratio, MIN_ZOOM, MAX_ZOOM);
      const { startTx, startTy, cx: ocx, cy: ocy } = pinchRef.current;
      const tx = cx - (ocx - startTx) * (newScale / pinchRef.current.startScale);
      const ty = cy - (ocy - startTy) * (newScale / pinchRef.current.startScale);
      zoomRef.current = { scale: newScale, tx, ty };
      applyZoom();
      setZoomLevel(Math.round(newScale * 10) / 10);
    }
  }, [applyZoom]);

  const onWrapTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  }, []);

  const onDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) resetZoom();
    lastTapRef.current = now;
  }, [resetZoom]);

  // Convert screen coords → canvas pixel coords accounting for zoom/pan
  const getCanvasXY = useCallback((
    clientX: number,
    clientY: number,
    wrapRect: DOMRect,
    canvasNativeWidth: number,
    canvasDisplayWidth: number
  ) => {
    const { scale, tx, ty } = zoomRef.current;
    const rx = (clientX - wrapRect.left - tx) / scale;
    const ry = (clientY - wrapRect.top  - ty) / scale;
    const pixelRatio = canvasNativeWidth / (canvasDisplayWidth / scale);
    return {
      x: Math.floor(rx * pixelRatio),
      y: Math.floor(ry * pixelRatio),
    };
  }, []);

  return {
    zoomRef,
    zoomLevel,
    applyZoom,
    resetZoom,
    onWrapTouchStart,
    onWrapTouchMove,
    onWrapTouchEnd,
    onDoubleTap,
    getCanvasXY,
  };
}