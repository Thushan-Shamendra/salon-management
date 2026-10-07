export interface CropTarget {
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  zoom: number; // 1 to 3
}

export interface CropSettings {
  home: CropTarget;
  gallery: CropTarget;
  featured: CropTarget;
}

export type ICropTarget = CropTarget;
export type ICropSettings = CropSettings;
export type CropPosition = CropTarget;

export const DEFAULT_CROP_TARGET: CropTarget = { x: 50, y: 50, zoom: 1 };

export const DEFAULT_CROP_SETTINGS: CropSettings = {
  home: { x: 50, y: 50, zoom: 1 },
  gallery: { x: 50, y: 50, zoom: 1 },
  featured: { x: 50, y: 50, zoom: 1 },
};

export function normalizeCropTarget(
  raw?: Partial<CropTarget> | null,
  fallback = DEFAULT_CROP_TARGET
): CropTarget {
  return {
    x: typeof raw?.x === "number" ? Math.max(0, Math.min(100, Math.round(raw.x))) : fallback.x,
    y: typeof raw?.y === "number" ? Math.max(0, Math.min(100, Math.round(raw.y))) : fallback.y,
    zoom: typeof raw?.zoom === "number" ? Math.max(1, Math.min(3, Number(raw.zoom.toFixed(2)))) : fallback.zoom,
  };
}

export function normalizeCropSettings(
  raw?: {
    cropSettings?: Partial<Record<"home" | "gallery" | "featured", Partial<CropTarget>>> | null;
    cropPosition?: Partial<CropTarget> | null;
  } | null
): CropSettings {
  const fallbackTarget = raw?.cropPosition ? normalizeCropTarget(raw.cropPosition) : DEFAULT_CROP_TARGET;
  const cs = raw?.cropSettings;
  return {
    home: normalizeCropTarget(cs?.home, fallbackTarget),
    gallery: normalizeCropTarget(cs?.gallery, fallbackTarget),
    featured: normalizeCropTarget(cs?.featured, fallbackTarget),
  };
}
