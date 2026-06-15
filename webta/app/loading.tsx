import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999]">
      <div className="h-full bg-orange-500 animate-pulse w-full origin-left scale-x-0 animate-[loading-bar_1.5s_ease-in-out_infinite]"></div>
      
      {/* Optional: Small floating indicator at bottom right if needed, but top bar is usually enough */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg border border-orange-100 rounded-full p-3 flex items-center justify-center pointer-events-none opacity-80 z-[9999]">
         <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: left; }
          50.1% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
      `}</style>
    </div>
  );
}
