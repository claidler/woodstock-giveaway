interface MobileBottomBarProps {
  onStartAddFlow: () => void;
  onRecentreMap: () => void;
}

export default function MobileBottomBar({ onStartAddFlow, onRecentreMap }: MobileBottomBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf4ed]/95 backdrop-blur-md h-20 border-t border-[#ebe4df] flex justify-around items-center px-6 z-50">
      <button onClick={onRecentreMap} className="flex flex-col items-center gap-1.5 text-[#d7827e]">
        <span className="material-symbols-outlined">map</span>
        <span className="text-[9px] font-semibold tracking-wider uppercase">Map</span>
      </button>
      <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
        <span className="material-symbols-outlined">format_list_bulleted</span>
        <span className="text-[9px] font-semibold tracking-wider uppercase">List</span>
      </a>
      <div onClick={onStartAddFlow} className="w-14 h-14 bg-[#d7827e] rounded-full -mt-12 flex items-center justify-center text-[#faf4ed] shadow-xl ring-4 ring-[#faf4ed] cursor-pointer active:scale-90 transition-transform">
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
  );
}
