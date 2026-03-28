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
  owner_id: string;
}

export interface GiveawayItemRow {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: Category;
  location_details: string;
  created_at: string;
  owner_id: string;
}
