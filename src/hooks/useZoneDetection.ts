const DARK_THRESHOLD = 90;
const COLOR_TOLERANCE = 35;

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Zone {
  id: number;
  label: string;
  pixelArray: number[];
  pixelSet: Set<number>;
  area_px: number;
  perimeter_px: number;
  area_cm2: number | null;
  color: RgbaColor | null;
  glassId: number | null;
  zone_cost: number;
}

const isDark = (r: number, g: number, b: number) =>
  r < DARK_THRESHOLD && g < DARK_THRESHOLD && b < DARK_THRESHOLD;

const inTolerance = (r: number, g: number, b: number, t: { r: number; g: number; b: number }) =>
  Math.abs(r - t.r) <= COLOR_TOLERANCE &&
  Math.abs(g - t.g) <= COLOR_TOLERANCE &&
  Math.abs(b - t.b) <= COLOR_TOLERANCE;

export function detectZone(
  sx: number,
  sy: number,
  imageData: ImageData,
  scale: number | null,
  zoneCounter: { current: number }
): Zone | null {
  const { width, height, data } = imageData;
  const si = (sy * width + sx) * 4;
  const sc = { r: data[si], g: data[si + 1], b: data[si + 2] };

  if (isDark(sc.r, sc.g, sc.b)) return null;

  const visited = new Uint8Array(width * height);
  const stack: [number, number][] = [[sx, sy]];
  const pixelArray: number[] = [];

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const pi = y * width + x;
    if (visited[pi]) continue;
    visited[pi] = 1;
    const off = pi * 4;
    const r = data[off], g = data[off + 1], b = data[off + 2];
    if (isDark(r, g, b)) continue;
    if (!inTolerance(r, g, b, sc)) continue;
    pixelArray.push(pi);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  if (!pixelArray.length) return null;

  const pixelSet = new Set(pixelArray);
  let perimeterPx = 0;

  for (const pi of pixelArray) {
    const x = pi % width;
    const y = Math.floor(pi / width);
    for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]] as [number,number][]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) { perimeterPx++; continue; }
      if (!pixelSet.has(ny * width + nx)) perimeterPx++;
    }
  }

  if (navigator.vibrate) navigator.vibrate(18);

  zoneCounter.current++;

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    label: `Zone ${zoneCounter.current}`,
    pixelArray,
    pixelSet,
    area_px: pixelArray.length,
    perimeter_px: perimeterPx,
    area_cm2: scale ? pixelArray.length * scale * scale : null,
    color: null,
    glassId: null,
    zone_cost: 0,
  };
}