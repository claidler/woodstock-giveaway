interface PinDropBannerProps {
  onCancel: () => void;
}

export default function PinDropBanner({ onCancel }: PinDropBannerProps) {
  return (
    <div className="fixed bottom-24 md:bottom-auto md:top-28 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[60] animate-slide-up flex justify-center">
      <div className="bg-[#bd5f5f] text-[#f9f5ea] px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3">
        <span className="material-symbols-outlined text-xl flex-shrink-0">add_location</span>
        <span className="font-serif font-medium text-sm">Tap the map to drop your pin</span>
        <button onClick={onCancel} className="ml-1 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 active:bg-white/40 transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
