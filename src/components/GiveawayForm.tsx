import type { Category, GiveawayItem } from '../types';
import { categoryOptions } from '../constants';

interface GiveawayFormProps {
  formData: { title: string; description: string; category: Category; locationDetails: string };
  formErrors: Record<string, boolean>;
  titleInputRef: React.RefObject<HTMLInputElement>;
  onFormDataChange: (updater: (d: { title: string; description: string; category: Category; locationDetails: string }) => { title: string; description: string; category: Category; locationDetails: string }) => void;
  onFormErrorChange: (updater: (e: Record<string, boolean>) => Record<string, boolean>) => void;
  onRepositionPin: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  editItem?: GiveawayItem | null;
}

export default function GiveawayForm({
  formData, formErrors, titleInputRef,
  onFormDataChange, onFormErrorChange,
  onRepositionPin, onCancel, onSubmit, editItem,
}: GiveawayFormProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-[#575279]/20 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-[#fffaf3] w-full md:max-w-md md:mx-4 rounded-t-3xl md:rounded-3xl shadow-2xl border-t md:border border-[#ebe4df]/50 animate-slide-up max-h-[80vh] md:max-h-[85vh] flex flex-col">
        {/* Drag handle for mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#ebe4df]" />
        </div>

        {/* Header */}
        <div className="px-5 md:px-6 pt-2 md:pt-6 pb-3 md:pb-4 border-b border-[#ebe4df]/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-semibold text-[#575279]">
                {editItem ? 'Edit listing' : 'List your giveaway'}
              </h3>
              <p className="text-xs text-[#9893a5] mt-0.5">
                {editItem ? 'Update the details below.' : 'Fill in the details below.'}
              </p>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-full bg-[#f4ede8] flex items-center justify-center text-[#9893a5] hover:text-[#575279] hover:bg-[#ebe4df] active:scale-95 transition-all">
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
              onChange={e => { onFormDataChange(d => ({ ...d, title: e.target.value })); onFormErrorChange(e2 => ({ ...e2, title: false })); }}
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
              onChange={e => { onFormDataChange(d => ({ ...d, description: e.target.value })); onFormErrorChange(e2 => ({ ...e2, description: false })); }}
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
                  onClick={() => onFormDataChange(d => ({ ...d, category: cat.id }))}
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
              onChange={e => { onFormDataChange(d => ({ ...d, locationDetails: e.target.value })); onFormErrorChange(e2 => ({ ...e2, locationDetails: false })); }}
              className={`w-full bg-white border ${formErrors.locationDetails ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-base md:text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50`}
            />
            {formErrors.locationDetails && <p className="text-[11px] text-[#d7827e] mt-1">Please add a location hint</p>}
          </div>

          {/* Reposition pin */}
          <button
            onClick={onRepositionPin}
            className="flex items-center gap-2 text-xs text-[#9893a5] hover:text-[#d7827e] active:text-[#d7827e] transition-colors py-1"
          >
            <span className="material-symbols-outlined text-base">edit_location_alt</span>
            Drag the pin or tap here to reposition
          </button>
        </div>

        {/* Submit area */}
        <div className="bg-[#fffaf3] px-5 md:px-6 pt-3 pb-5 md:pb-5 border-t border-[#ebe4df]/50 flex-shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onSubmit}
            className="w-full bg-[#d7827e] text-[#faf4ed] py-3.5 rounded-xl font-serif font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {editItem ? 'Save changes' : 'List for neighbours'}
          </button>
        </div>
      </div>
    </div>
  );
}
