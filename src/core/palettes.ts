/** Typed view of src/palettes.json (the single source of truth for palettes). */
import data from '../palettes.json' with { type: 'json' };

export interface Palette {
  colors: string[];
  bg?: string;
  seed?: number;
  n?: number;
  [key: string]: unknown;
}

export const PALETTES = data as Record<string, Record<string, Palette>>;
