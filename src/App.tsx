import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Category, GiveawayItem, GiveawayItemRow } from './types';
import { WOODSTOCK_CENTER, WOODSTOCK_BOUNDS } from './constants';
import { rowToItem } from './utils';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import GiveawayForm from './components/GiveawayForm';
import MobileBottomBar from './components/MobileBottomBar';
import PinDropBanner from './components/PinDropBanner';
import MarkerDragBanner from './components/MarkerDragBanner';
import MapClickHandler from './components/MapClickHandler';
import DraggableMarker from './components/DraggableMarker';
import LongPressMarker from './components/LongPressMarker';
import MapRefCapture from './components/MapRefCapture';
import AuthModal from './components/AuthModal';


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
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GiveawayItem | null>(null);

  const handleMoveStart = useCallback((id: string) => setMovingItemId(id), []);
  const handleMoveEnd = useCallback((id: string, lat: number, lng: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, lat, lng } : i));
    setMovingItemId(null);
    supabase.from('giveaway_items').update({ lat, lng }).eq('id', id);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const { data, error } = await supabase
      .from('giveaway_items')
      .delete()
      .eq('id', id)
      .select();
    if (error || !data || data.length === 0) {
      // Delete failed (likely RLS policy missing) — re-fetch to restore correct state
      const { data: freshData } = await supabase
        .from('giveaway_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (freshData) setItems(freshData.map(row => rowToItem(row as GiveawayItemRow)));
    }
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
    setEditingItem(null);
  };

  const startEditFlow = (item: GiveawayItem) => {
    setPlacingPin(false);
    setEditingItem(item);
    setNewPinLocation({ lat: item.lat, lng: item.lng });
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      locationDetails: item.locationDetails,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const requireAuth = (action: () => void) => {
    if (session) {
      action();
    } else {
      setShowAuthModal(true);
    }
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
        owner_id: session!.user.id,
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

  const updateItem = async () => {
    const errors: Record<string, boolean> = {};
    if (!formData.title.trim()) errors.title = true;
    if (!formData.description.trim()) errors.description = true;
    if (!formData.locationDetails.trim()) errors.locationDetails = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!newPinLocation || !editingItem) return;

    const updates = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      location_details: formData.locationDetails.trim(),
      lat: newPinLocation.lat,
      lng: newPinLocation.lng,
    };

    const { error } = await supabase
      .from('giveaway_items')
      .update(updates)
      .eq('id', editingItem.id);

    if (!error) {
      setItems(prev => prev.map(i =>
        i.id === editingItem.id
          ? { ...i, ...updates, locationDetails: updates.location_details }
          : i
      ));
      setShowForm(false);
      setNewPinLocation(null);
      setFormErrors({});
      setEditingItem(null);
    }
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
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'giveaway_items' }, (payload) => {
        const deletedId = (payload.old as { id: string }).id;
        setItems(prev => prev.filter(i => i.id !== deletedId));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'giveaway_items' }, (payload) => {
        const updated = rowToItem(payload.new as GiveawayItemRow);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuthModal(false);
    });

    return () => subscription.unsubscribe();
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
        .leaflet-control-attribution { background: rgba(255,255,255,0.6) !important; color: #9893a5; font-size: 10px; padding: 2px 6px !important; border-radius: 4px; }
        .leaflet-control-attribution a { color: #9893a5; }
        .leaflet-bottom.leaflet-right { bottom: 1.5rem; }
        @media (min-width: 768px) { .leaflet-bottom.leaflet-right { bottom: 0; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes markerPing { 0% { transform: scale(1); opacity: 0.35; } 75%, 100% { transform: scale(2.2); opacity: 0; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .marker-ping { animation: markerPing 1.4s cubic-bezier(0,0,0.2,1) infinite; }
      `}</style>


      <Navbar onStartAddFlow={() => requireAuth(startAddFlow)} session={session} onSignOut={() => supabase.auth.signOut()} onShowAuth={() => setShowAuthModal(true)} />


      <div className="flex flex-1 pt-16 md:pt-20 relative overflow-hidden">

        <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />


        {/* Map area — pb-20 on mobile to make room for bottom bar */}
        <main className="flex-1 relative bg-[#faf4ed] w-full z-0 pb-20 md:pb-0" style={{ minHeight: 0 }}>

          <MapContainer
            center={WOODSTOCK_CENTER}
            zoom={15}
            minZoom={14}
            maxZoom={18}
            maxBounds={WOODSTOCK_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <AttributionControl prefix={false} />
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
                onDelete={handleDelete}
                onEdit={startEditFlow}
                userId={session?.user.id ?? null}
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
                 <div onClick={() => requireAuth(startAddFlow)} className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 flex gap-4 items-center group cursor-pointer hover:bg-white transition-all hover:-translate-y-1 flex-1">
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
      {placingPin && <PinDropBanner onCancel={cancelAdd} />}

      {/* ===== Marker drag banner ===== */}
      {movingItemId && !placingPin && <MarkerDragBanner />}


      {/* ===== Form modal — fixed overlay, bottom sheet on mobile, centered on desktop ===== */}
      {showForm && newPinLocation && (
        <GiveawayForm
          formData={formData}
          formErrors={formErrors}
          titleInputRef={titleInputRef}
          onFormDataChange={setFormData}
          onFormErrorChange={setFormErrors}
          onRepositionPin={repositionPin}
          onCancel={cancelAdd}
          onSubmit={editingItem ? updateItem : submitItem}
          editItem={editingItem}
        />
      )}


      {/* ===== Mobile bottom tab bar — always visible ===== */}
      <MobileBottomBar onStartAddFlow={() => requireAuth(startAddFlow)} onRecentreMap={() => mapRef.current?.flyTo(WOODSTOCK_CENTER, 15, { duration: 0.5 })} session={session} onSignOut={() => supabase.auth.signOut()} onShowAuth={() => setShowAuthModal(true)} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
