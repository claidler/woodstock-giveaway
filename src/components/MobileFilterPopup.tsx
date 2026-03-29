import { useState } from 'react';
import type { Category } from '../types';
import { categoryOptions, CATEGORY_STYLES } from '../constants';

interface MobileFilterPopupProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function MobileFilterPopup({ activeCategory, onCategoryChange }: MobileFilterPopupProps) {
  const [open, setOpen] = useState(false);
  const allFilters = [{ id: 'all' as const, icon: 'map', label: 'All Items' }, ...categoryOptions];
  const hasFilter = activeCategory !== 'all';

  return (
    <div className="md:hidden absolute top-4 right-16 z-10">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`bg-white/90 backdrop-blur-md w-11 h-11 flex items-center justify-center rounded-xl shadow-sm transition-colors relative ${
          hasFilter ? 'text-[#d7827e]' : 'text-[#575279]/60'
        }`}
      >
        <span className="material-symbols-outlined" style={hasFilter ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          filter_alt
        </span>
        {hasFilter && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#d7827e] border-2 border-white" />
        )}
      </button>

      {/* Popup overlay + panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-13 z-50 bg-[#faf4ed] rounded-2xl shadow-xl border border-[#ebe4df] p-4 w-64 animate-fade-in">
            <h3 className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest mb-3 px-1">Filter by Tag</h3>
            <div className="grid grid-cols-3 gap-2">
              {allFilters.map((cat) => {
                const isActive = activeCategory === cat.id;
                const catColour = cat.id !== 'all' ? CATEGORY_STYLES[cat.id as Category].bg : '#d7827e';
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      onCategoryChange(cat.id as Category | 'all');
                      setOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1
                      ${isActive
                        ? 'bg-white shadow-sm'
                        : 'bg-white/40 border-transparent active:bg-white'}`}
                    style={isActive ? { borderColor: `${catColour}40` } : undefined}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1", color: isActive ? catColour : '#9893a5' }}
                    >
                      {cat.icon}
                    </span>
                    <span className="text-[10px] font-medium opacity-80">{cat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
