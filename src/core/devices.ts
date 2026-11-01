/** Device presets in native pixels. `mobile` = portrait (height > width). */
export interface Device {
  id: string;
  name: string;
  /** Label for the sidebar select when `name` is too long to fit. */
  short?: string;
  w: number;
  h: number;
}

// iPhones share a handful of panel sizes, so presets are named by the models they cover
// (checked against Apple's tech specs, Nov 2026). Ids stay stable because they live in URLs.
export const DEVICES: Device[] = [
  { id: 'iphone-16', name: 'iPhone 15 / 16', w: 1179, h: 2556 },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro / 17 / 17 Pro / 18 Pro', short: 'iPhone 17 / 18 Pro', w: 1206, h: 2622 },
  { id: 'iphone-air', name: 'iPhone Air', w: 1260, h: 2736 },
  { id: 'iphone-16-plus', name: 'iPhone 15 Pro Max / 16 Plus', short: 'iPhone 16 Plus', w: 1290, h: 2796 },
  { id: 'iphone-16-pro-max', name: 'iPhone 16 / 17 / 18 Pro Max', short: 'iPhone 18 Pro Max', w: 1320, h: 2868 },
  { id: 'macbook-air-13', name: 'MacBook Air 13', w: 2560, h: 1664 },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14', w: 3024, h: 1964 },
  { id: 'macbook-pro-16', name: 'MacBook Pro 16', w: 3456, h: 2234 },
  { id: '4k', name: '4K 16:9', w: 3840, h: 2160 },
  { id: '5k', name: '5K 16:9', w: 5120, h: 2880 },
  { id: 'ultrawide', name: 'Ultrawide', w: 3440, h: 1440 },
];

export const isMobile = (w: number, h: number) => h > w;
