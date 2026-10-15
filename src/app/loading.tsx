import BatLogo from "@/components/ui/BatLogo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0a0a0a]">
      {/* Batman Logo Loader */}
      <div className="flex flex-col items-center gap-7">
        <div className="relative flex items-center justify-center">
          {/* Ambient glow */}
          <div className="absolute inset-0 -m-5 rounded-full bg-amber-400/15 blur-2xl animate-pulse" />

          {/* Bat symbol with glow & pulse animation */}
          <div className="w-24 h-12 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.7)] animate-[pulse_1.5s_ease-in-out_infinite]">
            <BatLogo className="w-full h-full" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#f0f0f0",
            }}
          >
            VILTRUM EGYPT
          </span>

          {/* Animated loading bar */}
          <div className="w-32 h-[1.5px] bg-zinc-800 overflow-hidden rounded-full">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{
                animation: "loading-bar 1.4s ease-in-out infinite",
                width: "40%",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
