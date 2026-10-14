export function normalizeHex(color?: string, fallback = "#03BF62"): string {
  if (!color || typeof color !== "string") return fallback;
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^([0-9a-fA-F]{3}){1,2}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  return fallback;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex);
  let clean = normalized.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function adjustColor(hex: string, amount: number): string {
  const normalized = normalizeHex(hex);
  let clean = normalized.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getRgbComponents(color?: string, fallback = "#03BF62"): { r: number; g: number; b: number } {
  const normalized = normalizeHex(color, fallback);
  let clean = normalized.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

