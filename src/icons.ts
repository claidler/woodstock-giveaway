import L from 'leaflet';
import type { Category } from './types';
import { CATEGORY_STYLES } from './constants';

export const getIconForCategories = (categories: Category[]) => {
  const cats = categories.length > 0 ? categories : (['furniture'] as Category[]);
  const count = cats.length;
  const circleSize = 40;
  const overlap = 12;
  const totalWidth = circleSize + (count - 1) * (circleSize - overlap);

  const circles = cats.map((cat, i) => {
    const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.furniture;
    const left = i * (circleSize - overlap);
    const zIndex = count - i;
    return `<div style="position:absolute;left:${left}px;top:0;z-index:${zIndex};width:${circleSize}px;height:${circleSize}px;background:${s.bg};color:#faf4ed;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);">
      <span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1;">${s.icon}</span>
    </div>`;
  }).join('');

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div style="position:relative;width:${totalWidth}px;height:${circleSize}px;cursor:pointer;">${circles}</div>`,
    iconSize: [totalWidth, circleSize],
    iconAnchor: [totalWidth / 2, circleSize / 2],
    popupAnchor: [0, -(circleSize / 2)]
  });
};

export const getMovingIconForCategories = (categories: Category[]) => {
  const cat = categories[0] || 'furniture';
  const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.furniture;
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div style="position:relative;width:48px;height:48px;cursor:grab;">
        <div class="marker-ping" style="position:absolute;inset:0;background:${s.bg};border-radius:50%;opacity:0.35;"></div>
        <div style="position:relative;width:48px;height:48px;background:${s.bg};color:#faf4ed;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.3);border:3px solid white;transform:scale(1.1);">
          <span class="material-symbols-outlined" style="font-size:20px;font-variation-settings:'FILL' 1;">${s.icon}</span>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
};

export const getClusteredIconForCategories = (categories: Category[]) => {
  const cats = categories.length > 0 ? categories : (['furniture'] as Category[]);
  const count = cats.length;
  const containerSize = 48;
  const center = containerSize / 2;
  const sliceAngle = 360 / count;

  const gradientStops = cats.map((cat, i) => {
    const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.furniture;
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    return `${s.bg} ${start}deg ${end}deg`;
  }).join(', ');

  const hubSize = 26;

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div style="position:relative;width:${containerSize}px;height:${containerSize}px;cursor:pointer;">
      <div style="width:${containerSize}px;height:${containerSize}px;border-radius:50%;background:conic-gradient(${gradientStops});border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
        <div style="width:${hubSize}px;height:${hubSize}px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.15);">
          <span style="font-size:12px;font-weight:700;color:#575279;font-family:Inter,sans-serif;">${count}</span>
        </div>
      </div>
    </div>`,
    iconSize: [containerSize, containerSize],
    iconAnchor: [center, center],
    popupAnchor: [0, -center]
  });
};

export const dropPinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="relative -mt-10 -ml-5">
      <div class="w-10 h-10 bg-[#d7827e] text-[#faf4ed] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">add_location</span>
      </div>
      <div class="w-2 h-2 bg-[#d7827e] rounded-full mx-auto mt-0.5 opacity-40"></div>
    </div>
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
});
