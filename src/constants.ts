import type { Category, GiveawayItem } from './types';

export const WOODSTOCK_CENTER: [number, number] = [51.847, -1.354];

export const mockItems: GiveawayItem[] = [
  {
    id: '1',
    title: 'Oak Writing Desk',
    description: 'Slightly worn but sturdy. Left it by the front gate.',
    lat: 51.848,
    lng: -1.352,
    category: 'furniture',
    timePosted: 'Available now',
    locationDetails: 'Near Blenheim Palace gates'
  },
  {
    id: '2',
    title: 'Toddler Clothes (Age 3-4)',
    description: 'Rafe outgrew these! Mostly winter coats and jumpers.',
    lat: 51.8465,
    lng: -1.356,
    category: 'kids',
    timePosted: '15m ago',
    locationDetails: 'Old Woodstock'
  },
  {
    id: '3',
    title: 'Box of 80s Slasher DVDs',
    description: 'Having a clear out. Includes some classics and Scream boxset.',
    lat: 51.845,
    lng: -1.353,
    category: 'entertainment',
    timePosted: '1h ago',
    locationDetails: 'Market Street'
  },
  {
    id: '4',
    title: 'Unused Dog Toys',
    description: 'Hobbes completely ignored these. Brand new.',
    lat: 51.8475,
    lng: -1.355,
    category: 'pets',
    timePosted: 'Just now',
    locationDetails: 'Park Street'
  },
  {
    id: '5',
    title: 'Vintage Knits & Sweaters',
    description: 'Assorted warm winter clothing.',
    lat: 51.849,
    lng: -1.351,
    category: 'clothing',
    timePosted: '2h ago',
    locationDetails: 'Hensington Road'
  }
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
