import L from 'leaflet';
import type { Category } from './types';
import { CATEGORY_STYLES } from './constants';

export const getIconForCategory = (category: Category) => {
  const s = CATEGORY_STYLES[category] || CATEGORY_STYLES.furniture;
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative group cursor-pointer -mt-5 -ml-5">
        <div class="w-10 h-10 text-[#faf4ed] rounded-full flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-transform" style="background:${s.bg};">
            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">${s.icon}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

export const getMovingIconForCategory = (category: Category) => {
  const s = CATEGORY_STYLES[category] || CATEGORY_STYLES.furniture;
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div style="position:relative;width:48px;height:48px;margin-top:-24px;margin-left:-24px;cursor:grab;">
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
