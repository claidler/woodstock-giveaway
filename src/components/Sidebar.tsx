import type { Category } from '../types';

interface SidebarProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  return (
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
              onClick={() => onCategoryChange(cat.id as Category | 'all')}
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
  );
}
