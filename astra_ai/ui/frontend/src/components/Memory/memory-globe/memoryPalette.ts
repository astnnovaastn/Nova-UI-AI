/** Bounded, stable Canvas shades from Nova's shared category palette metadata.
 * Conversion matrices: https://bottosson.github.io/posts/oklab/
 * Hue interpolation: CSS color-mix(in oklch), shorter hue.
 */
export const MEMORY_BASES = { blue:'#5b8def',gray_blue:'#8b95a7',red:'#d9544f',green:'#6fcf7f',violet:'#9b6bff',pink:'#ffb3c1',deep_red:'#8f1d2c',deep_violet:'#5a3aa8' } as const;
export const MEMORY_HIGHLIGHT = '#DCD7CE';
export type ColorFamily = keyof typeof MEMORY_BASES;
export interface CategoryPalette { family?: string; blend_percent?: number; base?: string; blend_with?: string }
const families: ColorFamily[] = ['blue','gray_blue','red','green','violet','pink','deep_red','deep_violet'];
const blends = [0, .08, .0914, .1029, .1143, .1257, .1371, .1486, .16];
const aliases:Record<string,ColorFamily>={orange:'pink',deep_blue:'gray_blue',yellow:'green'};
export const stableColorHash = (id: string) => { let h = 2166136261; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
type Triple = [number, number, number];
const linear = (v: number) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
const srgb = (v: number) => Math.max(0, Math.min(1, v <= .0031308 ? v * 12.92 : 1.055 * Math.max(0, v) ** (1 / 2.4) - .055));
function lch(hex: string): Triple {
  const n = parseInt(hex.slice(1), 16), r = linear((n >> 16) / 255), g = linear(((n >> 8) & 255) / 255), b = linear((n & 255) / 255);
  const l = Math.cbrt(.4122214708*r + .5363325363*g + .0514459929*b), m = Math.cbrt(.2119034982*r + .6806995451*g + .1073969566*b), s = Math.cbrt(.0883024619*r + .2817188376*g + .6299787005*b);
  const L = .2104542553*l + .793617785*m - .0040720468*s, a = 1.9779984951*l - 2.428592205*m + .4505937099*s, B = .0259040371*l + .7827717662*m - .808675766*s;
  return [L, Math.hypot(a, B), Math.atan2(B, a)];
}
function hex([L, C, h]: Triple): string {
  const a = C * Math.cos(h), b = C * Math.sin(h), l = (L + .3963377774*a + .2158037573*b)**3, m = (L - .1055613458*a - .0638541728*b)**3, s = (L - .0894841775*a - 1.291485548*b)**3;
  const channels = [4.0767416621*l - 3.3077115913*m + .2309699292*s, -1.2684380046*l + 2.6097574011*m - .3413193965*s, -.0041960863*l - .7034186147*m + 1.707614701*s];
  return '#' + channels.map(v => Math.round(srgb(v)*255).toString(16).padStart(2, '0')).join('');
}
export function mixOklch(a: string, b: string, t: number): string {
  const A = lch(a), B = lch(b), amount = Math.max(0, Math.min(1, t)), delta = ((B[2] - A[2] + 3*Math.PI) % (2*Math.PI)) - Math.PI;
  return hex([A[0] + (B[0]-A[0])*amount, A[1] + (B[1]-A[1])*amount, A[2] + delta*amount]);
}
export const MEMORY_SHADES = families.flatMap(f => blends.map(t => {const c=lch(MEMORY_BASES[f]);c[0]+=t*.18;c[1]*=1-t*.2;return hex(c);}));
export function categoryColorIndex(id: string, palette?: CategoryPalette): number {
  const base = id.split('#')[0], hash = stableColorHash(base);
  const supplied=aliases[palette?.family||'']||palette?.family;
  let family = families.includes(supplied as ColorFamily) ? supplied as ColorFamily : undefined;
  if (!family) family = /identity|knowledge|research|expertise|user.message/i.test(base) ? 'blue' : /session|conversation|chat|trace|message|task|project|action/i.test(base) ? 'pink' : /pattern|connection|relationship|privacy|media|rule|instruction/i.test(base) ? 'violet' : /state|activity|system|management/i.test(base) ? 'red' : (['blue','gray_blue','red','green','violet','pink','deep_red','deep_violet'] as ColorFamily[])[hash % 8];
  const value = Number(palette?.blend_percent), amount = Number.isFinite(value) ? Math.max(.08, Math.min(.16, value/100)) : blends[1 + (hash >>> 4) % (blends.length-1)];
  let shade = 1; for (let i=2; i<blends.length; i++) if (Math.abs(blends[i]-amount) < Math.abs(blends[shade]-amount)) shade = i;
  return families.indexOf(family)*blends.length + shade;
}
export function contrastShades(light: boolean): string[] {
  return MEMORY_SHADES.map((color,index) => {const c=lch(color),soft=Math.floor(index/9)===5;c[0]=light?Math.min(.50,c[0]):Math.max(.40,Math.min(soft?.82:.76,c[0]));return hex(c);});
}
export function colorRgb(hex: string): string { const n=parseInt(hex.slice(1),16); return `${n>>16},${(n>>8)&255},${n&255}`; }
