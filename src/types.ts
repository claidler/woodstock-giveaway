export type Category = 'furniture' | 'clothing' | 'entertainment' | 'pets' | 'kids';

export interface GiveawayItem {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: Category;
  timePosted: string;
  locationDetails: string;
}
