import type { LatLng } from '@/types';

/**
 * Simple Web-Mercator projection used by our lightweight in-browser map.
 * Converts lat/lng to a normalized world coordinate [0,1] then to pixels at a
 * given zoom level (Google-style tile math).
 */
const TILE_SIZE = 256;

export function project(latLng: LatLng): { x: number; y: number } {
  const sinY = Math.min(Math.max(Math.sin((latLng.lat * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: TILE_SIZE * (0.5 + latLng.lng / 360),
    y: TILE_SIZE * (0.5 - Math.log((1 + sinY) / (1 - sinY)) / (4 * Math.PI)),
  };
}

export function unproject(point: { x: number; y: number }): LatLng {
  const lng = (point.x / TILE_SIZE - 0.5) * 360;
  const n = Math.PI - (2 * Math.PI * point.y) / TILE_SIZE;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

export function latLngToPixel(
  latLng: LatLng,
  center: LatLng,
  zoom: number,
  viewport: { width: number; height: number }
): { x: number; y: number } {
  const scale = Math.pow(2, zoom);
  const worldPoint = project(latLng);
  const centerPoint = project(center);
  return {
    x: (worldPoint.x - centerPoint.x) * scale + viewport.width / 2,
    y: (worldPoint.y - centerPoint.y) * scale + viewport.height / 2,
  };
}

export function pixelToLatLng(
  pixel: { x: number; y: number },
  center: LatLng,
  zoom: number,
  viewport: { width: number; height: number }
): LatLng {
  const scale = Math.pow(2, zoom);
  const centerPoint = project(center);
  const worldPoint = {
    x: centerPoint.x + (pixel.x - viewport.width / 2) / scale,
    y: centerPoint.y + (pixel.y - viewport.height / 2) / scale,
  };
  return unproject(worldPoint);
}
