export type Category = 'furniture' | 'clothing' | 'entertainment' | 'pets' | 'kids' | 'garden' | 'books' | 'kitchen';

export interface GiveawayItem {
  id: string;
  description: string;
  lat: number;
  lng: number;
  categories: Category[];
  locationDetails: string;
  timePosted: string;
  owner_id: string;
}

export interface GiveawayItemRow {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  location_details: string;
  created_at: string;
  owner_id: string;
}
