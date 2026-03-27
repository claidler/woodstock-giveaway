import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from './supabaseClient';


type Category = 'furniture' | 'clothing' | 'entertainment' | 'pets' | 'kids';


interface GiveawayItem {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: Category;
  timePosted: string;
  locationDetails: string;
}


const WOODSTOCK_CENTER: [number, number] = [51.847, -1.354];


interface GiveawayItemRow {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: Category;
  location_details: string;
  created_at: string;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function rowToItem(row: GiveawayItemRow): GiveawayItem {
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


const CATEGORY_STYLES: Record<Category, { icon: string; bg: string }> = {
  furniture: { icon: 'chair', bg: '#d7827e' },
  clothing: { icon: 'apparel', bg: '#907aa9' },
  entertainment: { icon: 'movie', bg: '#ea9d34' },
  pets: { icon: 'pets', bg: '#575279' },
  kids: { icon: 'child_care', bg: '#d7827e' },
};


const getIconForCategory = (category: Category) => {
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


const getMovingIconForCategory = (category: Category) => {
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


const dropPinIcon = L.divIcon({
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


function MapClickHandler({ active, onMapClick, movingItemId, onCancelMove }: {
  active: boolean;
  onMapClick: (lat: number, lng: number) => void;
  movingItemId: string | null;
  onCancelMove: () => void;
}) {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      } else if (movingItemId) {
        onCancelMove();
      }
    },
  });
  return null;
}


function DraggableMarker({ position, onDragEnd }: { position: [number, number]; onDragEnd: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const pos = marker.getLatLng();
        onDragEnd(pos.lat, pos.lng);
      }
    },
  }), [onDragEnd]);

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={dropPinIcon}
    />
  );
}


function MapRefCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}


function LongPressMarker({
  item, isMoving, mapRef, onMoveStart, onMoveEnd,
}: {
  item: GiveawayItem;
  isMoving: boolean;
  mapRef: React.MutableRefObject<L.Map | null>;
  onMoveStart: (id: string) => void;
  onMoveEnd: (id: string, lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;

    let startX = 0, startY = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const THRESHOLD_SQ = 100;

    const cancelTimer = () => {
      if (timer !== null) { clearTimeout(timer); timer = null; }
    };

    const startDrag = () => {
      timer = null;
      if (dragging.current) return;
      dragging.current = true;
      onMoveStart(item.id);
      mapRef.current?.dragging.disable();

      const getLL = (clientX: number, clientY: number) => {
        const map = mapRef.current;
        if (!map) return null;
        const r = map.getContainer().getBoundingClientRect();
        return map.containerPointToLatLng([clientX - r.left, clientY - r.top]);
      };

      const endDrag = () => {
        dragging.current = false;
        mapRef.current?.dragging.enable();
        const ll = markerRef.current?.getLatLng();
        if (ll) onMoveEnd(item.id, ll.lat, ll.lng);
        document.removeEventListener('touchmove', onDocTouch as EventListener, true);
        document.removeEventListener('touchend', endDrag);
        document.removeEventListener('mousemove', onDocMouse);
        document.removeEventListener('mouseup', endDrag);
      };

      const onDocTouch = (e: TouchEvent) => {
        e.preventDefault();
        const ll = getLL(e.touches[0].clientX, e.touches[0].clientY);
        if (ll) markerRef.current?.setLatLng(ll);
      };
      const onDocMouse = (e: MouseEvent) => {
        const ll = getLL(e.clientX, e.clientY);
        if (ll) markerRef.current?.setLatLng(ll);
      };

      document.addEventListener('touchmove', onDocTouch as EventListener, { passive: false, capture: true });
      document.addEventListener('touchend', endDrag);
      document.addEventListener('mousemove', onDocMouse);
      document.addEventListener('mouseup', endDrag);
    };

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      timer = setTimeout(startDrag, 600);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (dragging.current) return;
      const dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
      if (dx * dx + dy * dy > THRESHOLD_SQ) cancelTimer();
    };
    const onTouchEnd = () => cancelTimer();
    const onContextMenu = (e: Event) => e.preventDefault();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      startX = e.clientX; startY = e.clientY;
      timer = setTimeout(startDrag, 600);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (dx * dx + dy * dy > THRESHOLD_SQ) cancelTimer();
    };
    const onMouseUp = () => cancelTimer();

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelTimer();
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
    };
  }, [item.id, isMoving]); // re-run when icon changes so we reattach to new element

  return (
    <Marker
      ref={markerRef}
      position={[item.lat, item.lng]}
      icon={isMoving ? getMovingIconForCategory(item.category) : getIconForCategory(item.category)}
    >
      {!isMoving && (
        <Popup className="custom-popup">
          <div className="p-1 min-w-[200px]">
            <span className="text-[9px] font-bold text-[#d7827e] uppercase tracking-widest block mb-1">
              {item.category}
            </span>
            <h4 className="text-base font-serif font-semibold mb-1 leading-tight">{item.title}</h4>
            <p className="text-xs text-[#575279]/80 mb-3">{item.description}</p>
            <div className="flex justify-between items-center text-[10px] text-[#9893a5] border-t border-[#ebe4df] pt-2">
              <span className="italic">{item.locationDetails}</span>
              <span>{item.timePosted}</span>
            </div>
          </div>
        </Popup>
      )}
    </Marker>
  );
}


const categoryOptions: { id: Category; icon: string; label: string }[] = [
  { id: 'furniture', icon: 'chair', label: 'Furniture' },
  { id: 'clothing', icon: 'apparel', label: 'Clothing' },
  { id: 'entertainment', icon: 'movie', label: 'Media & Games' },
  { id: 'pets', icon: 'pets', label: 'Pets' },
  { id: 'kids', icon: 'child_care', label: 'Kids' },
];


export default function App() {
  const [items, setItems] = useState<GiveawayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  // Flow states: idle -> placingPin -> formOpen (with pin on map, draggable)
  const [placingPin, setPlacingPin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'furniture' as Category, locationDetails: '' });
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const handleMoveStart = useCallback((id: string) => setMovingItemId(id), []);
  const handleMoveEnd = useCallback((id: string, lat: number, lng: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, lat, lng } : i));
    setMovingItemId(null);
    supabase.from('giveaway_items').update({ lat, lng }).eq('id', id);
  }, []);


  const startAddFlow = () => {
    setPlacingPin(true);
    setNewPinLocation(null);
    setShowForm(false);
    setFormData({ title: '', description: '', category: 'furniture', locationDetails: '' });
    setFormErrors({});
  };

  const handleMapClick = (lat: number, lng: number) => {
    setNewPinLocation({ lat, lng });
    setPlacingPin(false);
    setShowForm(true);
    setTimeout(() => titleInputRef.current?.focus(), 300);
  };

  const handlePinDrag = (lat: number, lng: number) => {
    setNewPinLocation({ lat, lng });
  };

  const repositionPin = () => {
    setShowForm(false);
    setPlacingPin(true);
    // Keep newPinLocation so the marker stays visible while repositioning
  };

  const cancelAdd = () => {
    setPlacingPin(false);
    setShowForm(false);
    setNewPinLocation(null);
    setFormErrors({});
  };

  const submitItem = async () => {
    const errors: Record<string, boolean> = {};
    if (!formData.title.trim()) errors.title = true;
    if (!formData.description.trim()) errors.description = true;
    if (!formData.locationDetails.trim()) errors.locationDetails = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!newPinLocation) return;

    const { data, error } = await supabase
      .from('giveaway_items')
      .insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        lat: newPinLocation.lat,
        lng: newPinLocation.lng,
        category: formData.category,
        location_details: formData.locationDetails.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setItems(prev => [rowToItem(data as GiveawayItemRow), ...prev]);
    }
    setShowForm(false);
    setNewPinLocation(null);
    setFormErrors({});
  };


  useEffect(() => {
    supabase
      .from('giveaway_items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setItems(data.map(row => rowToItem(row as GiveawayItemRow)));
        setIsLoading(false);
      });

    const channel = supabase
      .channel('giveaway_items_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'giveaway_items' }, (payload) => {
        setItems(prev => {
          const newItem = rowToItem(payload.new as GiveawayItemRow);
          // Avoid duplicates (our own insert is already added optimistically)
          if (prev.some(i => i.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);


  useEffect(() => {
    const links = [
      'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
    ];

    links.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);


  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMovingItemId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(item => item.category === activeCategory);

  const isAddFlow = placingPin || showForm;

  return (
    <div className="bg-[#faf4ed] text-[#575279] overflow-hidden font-sans h-screen flex flex-col touch-manipulation">
      <style>{`
        html, body, #root { touch-action: manipulation; overscroll-behavior: none; }
        h1, h2, h3, h4, .font-serif { font-family: 'Noto Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .leaflet-popup-content-wrapper { background-color: #fffaf3; color: #575279; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .leaflet-popup-tip { background-color: #fffaf3; }
        .leaflet-container { font-family: 'Inter', sans-serif; touch-action: pan-x pan-y; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes markerPing { 0% { transform: scale(1); opacity: 0.35; } 75%, 100% { transform: scale(2.2); opacity: 0; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .marker-ping { animation: markerPing 1.4s cubic-bezier(0,0,0.2,1) infinite; }
      `}</style>


      <nav className="fixed top-0 w-full z-50 bg-[#faf4ed]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-16 md:h-20 shadow-none border-b border-[#ebe4df]/50">
        <div className="flex items-center gap-12">
          <span className="text-lg md:text-2xl font-serif italic font-semibold text-[#d7827e] tracking-tight">The Woodstock Giveaway</span>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#" className="text-[#d7827e] border-b border-[#d7827e] pb-1 font-serif font-medium tracking-tight">Woodstock Map</a>
            <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">My Street</a>
            <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">Community Rules</a>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={startAddFlow} className="hidden md:block bg-[#d7827e] text-[#faf4ed] px-6 py-2 rounded-lg font-serif font-medium text-sm hover:opacity-90 active:scale-95 transition-all">
            List Your Giveaway
          </button>
          <div className="flex items-center gap-4 text-[#575279]/70">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#d7827e] transition-colors">notifications</span>
            <div className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df] overflow-hidden cursor-pointer bg-[#907aa9] flex items-center justify-center text-[#faf4ed]">
              <span className="font-serif font-semibold">C</span>
            </div>
          </div>
        </div>
      </nav>


      <div className="flex flex-1 pt-16 md:pt-20 relative overflow-hidden">

        <aside className="hidden md:flex flex-col w-80 bg-[#f4ede8] p-8 gap-8 z-40 border-r border-[#ebe4df] overflow-y-auto">
          <div>
            <h2 className="text-2xl font-serif font-semibold tracking-tight">Woodstock Clearout</h2>
            <p className="text-[10px] text-[#9893a5] uppercase tracking-[0.2em] mt-2">Local Neighborhood Echo</p>
          </div>

          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9893a5]/60 text-lg">search</span>
            <input
              type="text"
              placeholder="Search items..."
              className="w-full bg-white/50 border border-[#ebe4df] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/60"
            />
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest mb-4 px-1">Filter by Tag</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'all', icon: 'map', label: 'All Items' },
                { id: 'furniture', icon: 'chair', label: 'Furniture' },
                { id: 'clothing', icon: 'apparel', label: 'Clothing' },
                { id: 'entertainment', icon: 'movie', label: 'Media & Games' },
              ].map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as Category | 'all')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-2
                    ${activeCategory === cat.id
                      ? 'bg-white border-[#d7827e]/30 shadow-sm'
                      : 'bg-white/40 border-transparent hover:bg-white hover:border-[#d7827e]/20'}`}
                >
                  <span className={`material-symbols-outlined ${activeCategory === cat.id ? 'text-[#d7827e]' : 'text-[#9893a5]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {cat.icon}
                  </span>
                  <span className="text-[11px] font-medium opacity-80">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
             <div className="bg-[#fffaf3] p-5 rounded-2xl shadow-sm border border-white/50">
               <h4 className="font-serif font-semibold text-sm mb-2">Woodstock Rules</h4>
               <p className="text-xs text-[#9893a5] leading-relaxed">Please only take items if you genuinely need them. Don't block pavements, and if your items aren't taken by Sunday evening, please bring them back inside.</p>
             </div>
          </div>
        </aside>


        {/* Map area — pb-20 on mobile to make room for bottom bar */}
        <main className="flex-1 relative bg-[#faf4ed] w-full z-0 pb-20 md:pb-0" style={{ minHeight: 0 }}>

          <MapContainer
            center={WOODSTOCK_CENTER}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            <MapRefCapture mapRef={mapRef} />
            <MapClickHandler active={placingPin} onMapClick={handleMapClick} movingItemId={movingItemId} onCancelMove={() => setMovingItemId(null)} />

            {filteredItems.map(item => (
              <LongPressMarker
                key={item.id}
                item={item}
                isMoving={movingItemId === item.id}
                mapRef={mapRef}
                onMoveStart={handleMoveStart}
                onMoveEnd={handleMoveEnd}
              />
            ))}

            {newPinLocation && (
              <DraggableMarker
                position={[newPinLocation.lat, newPinLocation.lng]}
                onDragEnd={handlePinDrag}
              />
            )}
          </MapContainer>


          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#faf4ed]/60 backdrop-blur-sm">
              <div className="bg-white/95 rounded-2xl shadow-sm border border-[#ebe4df] px-6 py-4 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-[#d7827e] border-t-transparent animate-spin" />
                <span className="font-serif text-sm text-[#575279]">Loading items…</span>
              </div>
            </div>
          )}

          <div className="absolute top-4 right-4 z-10">
            <button className="bg-white/90 backdrop-blur-md w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-xl shadow-sm text-[#575279]/60 hover:text-[#d7827e] transition-colors">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>




          {/* Desktop add card */}
          {!isAddFlow && (
            <div className="hidden md:flex absolute bottom-8 left-8 right-8 z-10 pointer-events-none justify-between items-end gap-10">
              <div className="w-full max-w-2xl flex gap-6 pointer-events-auto">
                 <div onClick={startAddFlow} className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 flex gap-4 items-center group cursor-pointer hover:bg-white transition-all hover:-translate-y-1 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-[#f4ede8] flex items-center justify-center text-[#d7827e] flex-shrink-0 group-hover:bg-[#d7827e] group-hover:text-[#faf4ed] transition-colors">
                      <span className="material-symbols-outlined text-3xl">add_box</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-serif font-semibold">Leaving something out?</h4>
                      <p className="text-xs text-[#9893a5] mt-0.5">Drop a pin to let neighbours know.</p>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>


      {/* ===== Pin drop banner — sits above bottom bar on mobile ===== */}
      {placingPin && (
        <div className="fixed bottom-24 md:bottom-auto md:top-28 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[60] animate-slide-up flex justify-center">
          <div className="bg-[#d7827e] text-[#faf4ed] px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-xl flex-shrink-0">add_location</span>
            <span className="font-serif font-medium text-sm">Tap the map to drop your pin</span>
            <button onClick={cancelAdd} className="ml-1 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 active:bg-white/40 transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== Marker drag banner ===== */}
      {movingItemId && !placingPin && (
        <div className="fixed bottom-24 md:bottom-auto md:top-28 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[60] animate-slide-up flex justify-center pointer-events-none">
          <div className="bg-[#575279] text-[#faf4ed] px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-xl flex-shrink-0">open_with</span>
            <span className="font-serif font-medium text-sm">Hold &amp; drag to reposition</span>
          </div>
        </div>
      )}


      {/* ===== Form modal — fixed overlay, bottom sheet on mobile, centered on desktop ===== */}
      {showForm && newPinLocation && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-[#575279]/20 backdrop-blur-sm" onClick={cancelAdd} />

          <div className="relative bg-[#fffaf3] w-full md:max-w-md md:mx-4 rounded-t-3xl md:rounded-3xl shadow-2xl border-t md:border border-[#ebe4df]/50 animate-slide-up max-h-[80vh] md:max-h-[85vh] flex flex-col">
            {/* Drag handle for mobile */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#ebe4df]" />
            </div>

            {/* Header */}
            <div className="px-5 md:px-6 pt-2 md:pt-6 pb-3 md:pb-4 border-b border-[#ebe4df]/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-[#575279]">List your giveaway</h3>
                  <p className="text-xs text-[#9893a5] mt-0.5">Fill in the details below.</p>
                </div>
                <button onClick={cancelAdd} className="w-8 h-8 rounded-full bg-[#f4ede8] flex items-center justify-center text-[#9893a5] hover:text-[#575279] hover:bg-[#ebe4df] active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
              {/* Title */}
              <div>
                <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-1.5">What are you giving away?</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  placeholder="e.g. Oak Writing Desk"
                  value={formData.title}
                  onChange={e => { setFormData(d => ({ ...d, title: e.target.value })); setFormErrors(e2 => ({ ...e2, title: false })); }}
                  className={`w-full bg-white border ${formErrors.title ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-base md:text-sm font-serif focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50`}
                />
                {formErrors.title && <p className="text-[11px] text-[#d7827e] mt-1">Please add a title</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-1.5">Description</label>
                <textarea
                  placeholder="Condition, quantity, any notes for neighbours..."
                  rows={2}
                  value={formData.description}
                  onChange={e => { setFormData(d => ({ ...d, description: e.target.value })); setFormErrors(e2 => ({ ...e2, description: false })); }}
                  className={`w-full bg-white border ${formErrors.description ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-base md:text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50 resize-none`}
                />
                {formErrors.description && <p className="text-[11px] text-[#d7827e] mt-1">Please add a description</p>}
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData(d => ({ ...d, category: cat.id }))}
                      className={`flex items-center gap-1.5 px-3 py-2.5 md:py-2 rounded-xl border text-xs font-medium transition-all active:scale-95
                        ${formData.category === cat.id
                          ? 'bg-[#d7827e] text-[#faf4ed] border-[#d7827e] shadow-sm'
                          : 'bg-white border-[#ebe4df] text-[#575279]/70 hover:border-[#d7827e]/30 hover:text-[#575279]'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location details */}
              <div>
                <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-1.5">Location hint</label>
                <input
                  type="text"
                  placeholder="e.g. By the front gate on Park Street"
                  value={formData.locationDetails}
                  onChange={e => { setFormData(d => ({ ...d, locationDetails: e.target.value })); setFormErrors(e2 => ({ ...e2, locationDetails: false })); }}
                  className={`w-full bg-white border ${formErrors.locationDetails ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-base md:text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50`}
                />
                {formErrors.locationDetails && <p className="text-[11px] text-[#d7827e] mt-1">Please add a location hint</p>}
              </div>

              {/* Reposition pin */}
              <button
                onClick={repositionPin}
                className="flex items-center gap-2 text-xs text-[#9893a5] hover:text-[#d7827e] active:text-[#d7827e] transition-colors py-1"
              >
                <span className="material-symbols-outlined text-base">edit_location_alt</span>
                Drag the pin or tap here to reposition
              </button>
            </div>

            {/* Submit area */}
            <div className="bg-[#fffaf3] px-5 md:px-6 pt-3 pb-5 md:pb-5 border-t border-[#ebe4df]/50 flex-shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button
                onClick={submitItem}
                className="w-full bg-[#d7827e] text-[#faf4ed] py-3.5 rounded-xl font-serif font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                List for neighbours
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ===== Mobile bottom tab bar — always visible ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf4ed]/95 backdrop-blur-md h-20 border-t border-[#ebe4df] flex justify-around items-center px-6 z-50">
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#d7827e]">
          <span className="material-symbols-outlined">map</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">Map</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">format_list_bulleted</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">List</span>
        </a>
        <div onClick={startAddFlow} className="w-14 h-14 bg-[#d7827e] rounded-full -mt-12 flex items-center justify-center text-[#faf4ed] shadow-xl ring-4 ring-[#faf4ed] cursor-pointer active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl">add</span>
        </div>
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">bookmark</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">Saved</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">You</span>
        </a>
      </div>
    </div>
  );
}
