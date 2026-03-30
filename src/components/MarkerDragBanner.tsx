export default function MarkerDragBanner() {
  return (
    <div className="fixed bottom-24 md:bottom-auto md:top-28 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[60] animate-slide-up flex justify-center pointer-events-none">
      <div className="bg-[#575279] text-[#f9f5ea] px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3">
        <span className="material-symbols-outlined text-xl flex-shrink-0">open_with</span>
        <span className="font-serif font-medium text-sm">Hold &amp; drag to reposition</span>
      </div>
    </div>
  );
}
