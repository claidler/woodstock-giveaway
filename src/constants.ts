import type { Category } from './types';

export const WOODSTOCK_CENTER: [number, number] = [51.847, -1.354];

export const CATEGORY_STYLES: Record<Category, { icon: string; bg: string }> = {
  furniture: { icon: 'chair', bg: '#d7827e' },
  clothing: { icon: 'apparel', bg: '#907aa9' },
  entertainment: { icon: 'movie', bg: '#ea9d34' },
  pets: { icon: 'pets', bg: '#286983' },
  kids: { icon: 'child_care', bg: '#b4637a' },
  garden: { icon: 'yard', bg: '#56949f' },
  books: { icon: 'menu_book', bg: '#797593' },
  kitchen: { icon: 'cooking', bg: '#575279' },
};

export const categoryOptions: { id: Category; icon: string; label: string }[] = [
  { id: 'furniture', icon: 'chair', label: 'Furniture' },
  { id: 'clothing', icon: 'apparel', label: 'Clothing' },
  { id: 'entertainment', icon: 'movie', label: 'Media & Games' },
  { id: 'pets', icon: 'pets', label: 'Pets' },
  { id: 'kids', icon: 'child_care', label: 'Kids' },
  { id: 'garden', icon: 'yard', label: 'Garden' },
  { id: 'books', icon: 'menu_book', label: 'Books' },
  { id: 'kitchen', icon: 'cooking', label: 'Kitchen' },
];
