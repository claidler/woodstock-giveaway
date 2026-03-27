import type { GiveawayItem, GiveawayItemRow } from './types';

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function rowToItem(row: GiveawayItemRow): GiveawayItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    locationDetails: row.location_details,
    timePosted: formatRelativeTime(row.created_at),
  };
}
