import type { Category } from './types';

export const WOODSTOCK_CENTER: [number, number] = [51.847, -1.354];

export const WOODSTOCK_BOUNDS: [[number, number], [number, number]] = [
  [51.835, -1.375], // southwest corner
  [51.860, -1.330], // northeast corner
];

export const CATEGORY_STYLES: Record<Category, { icon: string; bg: string }> = {
  furniture: { icon: 'chair', bg: '#d7827e' },
  clothing: { icon: 'apparel', bg: '#907aa9' },
  entertainment: { icon: 'movie', bg: '#ea9d34' },
  pets: { icon: 'pets', bg: '#575279' },
  kids: { icon: 'child_care', bg: '#d7827e' },
};

export const categoryOptions: { id: Category; icon: string; label: string }[] = [
  { id: 'furniture', icon: 'chair', label: 'Furniture' },
  { id: 'clothing', icon: 'apparel', label: 'Clothing' },
  { id: 'entertainment', icon: 'movie', label: 'Media & Games' },
  { id: 'pets', icon: 'pets', label: 'Pets' },
  { id: 'kids', icon: 'child_care', label: 'Kids' },
];
