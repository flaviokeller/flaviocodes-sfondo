/**
 * Mock iOS lock screen drawn over mobile previews, to check composition against the
 * Dynamic Island, date/clock and bottom controls. Geometry is in points; all preset
 * iPhones are @3x, so points = pixels / 3. Approximate, not a pixel-exact Apple asset.
 */
export function lockScreenSvg(w: number, h: number, date = new Date()): string {
  const W = w / 3, H = h / 3, cx = W / 2;
  const day = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const button = (x: number) =>
    `<circle cx="${x}" cy="${H - 88}" r="25" fill="#000" fill-opacity="0.28"/>`;
  return `<svg class="overlay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
  <rect x="${cx - 62.5}" y="11" width="125" height="37" rx="18.5" fill="#000"/>
  <g fill="#fff" fill-opacity="0.92" font-family="-apple-system, 'SF Pro Display', system-ui, sans-serif" text-anchor="middle">
    <text x="${cx}" y="92" font-size="21" font-weight="600">${day}</text>
    <text x="${cx}" y="188" font-size="100" font-weight="700" letter-spacing="-2">9:41</text>
  </g>
  ${button(70)}${button(W - 70)}
  <rect x="${cx - 67}" y="${H - 13}" width="134" height="5" rx="2.5" fill="#fff" fill-opacity="0.85"/>
</svg>`;
}

/** Corner radius of the screen as a fraction of its width (~55pt on a 402pt-wide iPhone). */
export const SCREEN_RADIUS = 55 / 402;
