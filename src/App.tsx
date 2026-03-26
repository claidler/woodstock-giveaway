import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


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


const mockItems: GiveawayItem[] = [
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


const getIconForCategory = (category: Category) => {
  const styles = {
    furniture: { icon: 'chair', bg: 'bg-[#d7827e]' },
    clothing: { icon: 'apparel', bg: 'bg-[#907aa9]' },
    entertainment: { icon: 'movie', bg: 'bg-[#ea9d34]' },
    pets: { icon: 'pets', bg: 'bg-[#575279]' },
    kids: { icon: 'child_care', bg: 'bg-[#d7827e]' },
  };


  const style = styles[category] || styles.furniture;


  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative group cursor-pointer -mt-5 -ml-5">
        <div class="w-10 h-10 ${style.bg} text-[#faf4ed] rounded-full flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">${style.icon}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};


const dropPinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="relative -mt-10 -ml-5 animate-bounce">
      <div class="w-10 h-10 bg-[#d7827e] text-[#faf4ed] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">add_location</span>
      </div>
      <div class="w-2 h-2 bg-[#d7827e] rounded-full mx-auto mt-0.5 opacity-40"></div>
    </div>
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
});


function MapClickHandler({ active, onMapClick }: { active: boolean; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}


const categoryOptions: { id: Category; icon: string; label: string }[] = [
  { id: 'furniture', icon: 'chair', label: 'Furniture' },
  { id: 'clothing', icon: 'apparel', label: 'Clothing' },
  { id: 'entertainment', icon: 'movie', label: 'Media & Games' },
  { id: 'pets', icon: 'pets', label: 'Pets' },
  { id: 'kids', icon: 'child_care', label: 'Kids' },
];


export default function App() {
  const [items, setItems] = useState<GiveawayItem[]>(mockItems);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [placingPin, setPlacingPin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'furniture' as Category, locationDetails: '' });
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const titleInputRef = useRef<HTMLInputElement>(null);


  const startAddFlow = () => {
    setPlacingPin(true);
    setNewPinLocation(null);
    setShowForm(false);
    setFormData({ title: '', description: '', category: 'furniture', locationDetails: '' });
    setFormErrors({});
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!placingPin) return;
    setNewPinLocation({ lat, lng });
    setPlacingPin(false);
    setShowForm(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const cancelAdd = () => {
    setPlacingPin(false);
    setShowForm(false);
    setNewPinLocation(null);
    setFormErrors({});
  };

  const submitItem = () => {
    const errors: Record<string, boolean> = {};
    if (!formData.title.trim()) errors.title = true;
    if (!formData.description.trim()) errors.description = true;
    if (!formData.locationDetails.trim()) errors.locationDetails = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!newPinLocation) return;

    const newItem: GiveawayItem = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      lat: newPinLocation.lat,
      lng: newPinLocation.lng,
      category: formData.category,
      timePosted: 'Just now',
      locationDetails: formData.locationDetails.trim(),
    };
    setItems(prev => [newItem, ...prev]);
    setShowForm(false);
    setNewPinLocation(null);
    setFormErrors({});
  };


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


  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(item => item.category === activeCategory);


  return (
    <div className="bg-[#faf4ed] text-[#575279] overflow-hidden font-sans h-screen flex flex-col">
      <style>{`
        h1, h2, h3, h4, .font-serif { font-family: 'Noto Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .leaflet-popup-content-wrapper { background-color: #fffaf3; color: #575279; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .leaflet-popup-tip { background-color: #fffaf3; }
        .leaflet-container { font-family: 'Inter', sans-serif; }
        .leaflet-container.pin-drop-mode { cursor: crosshair !important; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>


      <nav className="fixed top-0 w-full z-50 bg-[#faf4ed]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-20 shadow-none border-b border-[#ebe4df]/50">
        <div className="flex items-center gap-12">
          <span className="text-2xl font-serif italic font-semibold text-[#d7827e] tracking-tight">The Woodstock Giveaway</span>
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


      <div className="flex flex-1 pt-20 relative overflow-hidden">
        
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


        <main className={`flex-1 relative bg-[#faf4ed] w-full z-0 ${placingPin ? '[&_.leaflet-container]:cursor-crosshair' : ''}`} style={{ minHeight: 0 }}>

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
            
            <MapClickHandler active={placingPin} onMapClick={handleMapClick} />

            {filteredItems.map(item => (
              <Marker
                key={item.id}
                position={[item.lat, item.lng]}
                icon={getIconForCategory(item.category)}
              >
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
              </Marker>
            ))}

            {newPinLocation && (
              <Marker position={[newPinLocation.lat, newPinLocation.lng]} icon={dropPinIcon} />
            )}
          </MapContainer>


          <div className="absolute top-6 right-6 z-10">
            <button className="bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-xl shadow-sm text-[#575279]/60 hover:text-[#d7827e] transition-colors">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>


          {/* Pin drop mode banner */}
          {placingPin && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 animate-slide-up">
              <div className="bg-[#d7827e] text-[#faf4ed] px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
                <span className="material-symbols-outlined animate-bounce">add_location</span>
                <span className="font-serif font-medium text-sm">Tap the map to drop your pin</span>
                <button onClick={cancelAdd} className="ml-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          )}


          {/* Add item form modal */}
          {showForm && newPinLocation && (
            <div className="absolute inset-0 z-20 flex items-end md:items-center justify-center animate-fade-in">
              <div className="absolute inset-0 bg-[#575279]/20 backdrop-blur-sm" onClick={cancelAdd} />
              <div className="relative bg-[#fffaf3] w-full max-w-md mx-4 mb-0 md:mb-0 rounded-t-3xl md:rounded-3xl shadow-2xl border border-[#ebe4df]/50 animate-slide-up max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#fffaf3] rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#ebe4df]/50 z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-serif font-semibold text-[#575279]">List your giveaway</h3>
                      <p className="text-xs text-[#9893a5] mt-0.5">Pin dropped — now add the details.</p>
                    </div>
                    <button onClick={cancelAdd} className="w-8 h-8 rounded-full bg-[#f4ede8] flex items-center justify-center text-[#9893a5] hover:text-[#575279] hover:bg-[#ebe4df] transition-all">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-2">What are you giving away?</label>
                    <input
                      ref={titleInputRef}
                      type="text"
                      placeholder="e.g. Oak Writing Desk"
                      value={formData.title}
                      onChange={e => { setFormData(d => ({ ...d, title: e.target.value })); setFormErrors(e2 => ({ ...e2, title: false })); }}
                      className={`w-full bg-white border ${formErrors.title ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-sm font-serif focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50`}
                    />
                    {formErrors.title && <p className="text-[11px] text-[#d7827e] mt-1">Please add a title</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-2">Description</label>
                    <textarea
                      placeholder="Condition, quantity, any notes for neighbours..."
                      rows={3}
                      value={formData.description}
                      onChange={e => { setFormData(d => ({ ...d, description: e.target.value })); setFormErrors(e2 => ({ ...e2, description: false })); }}
                      className={`w-full bg-white border ${formErrors.description ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50 resize-none`}
                    />
                    {formErrors.description && <p className="text-[11px] text-[#d7827e] mt-1">Please add a description</p>}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-2">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setFormData(d => ({ ...d, category: cat.id }))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all
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
                    <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-2">Location hint</label>
                    <input
                      type="text"
                      placeholder="e.g. By the front gate on Park Street"
                      value={formData.locationDetails}
                      onChange={e => { setFormData(d => ({ ...d, locationDetails: e.target.value })); setFormErrors(e2 => ({ ...e2, locationDetails: false })); }}
                      className={`w-full bg-white border ${formErrors.locationDetails ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50`}
                    />
                    {formErrors.locationDetails && <p className="text-[11px] text-[#d7827e] mt-1">Please add a location hint</p>}
                  </div>
                </div>

                {/* Submit */}
                <div className="sticky bottom-0 bg-[#fffaf3] px-6 py-5 border-t border-[#ebe4df]/50 rounded-b-3xl">
                  <button
                    onClick={submitItem}
                    className="w-full bg-[#d7827e] text-[#faf4ed] py-3.5 rounded-xl font-serif font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    List for neighbours
                  </button>
                  <button
                    onClick={cancelAdd}
                    className="w-full text-[#9893a5] py-2 mt-2 text-xs hover:text-[#575279] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Desktop add card */}
          {!placingPin && !showForm && (
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