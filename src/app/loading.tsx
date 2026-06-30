export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white">
      {/* Logo */}
      <div className="flex flex-col items-center gap-8">
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-[pulse_1.8s_ease-in-out_infinite]"
        >
          <rect width="52" height="52" rx="10" fill="#111" />
          <text
            x="50%"
            y="54%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            letterSpacing="2"
          >
            V
          </text>
        </svg>

        <div className="flex flex-col items-center gap-3">
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#111",
            }}
          >
            VILTRUM EGYPT
          </span>

          {/* Animated bar */}
          <div className="w-32 h-[1.5px] bg-gray-100 overflow-hidden rounded-full">
            <div
              className="h-full bg-gray-900 rounded-full"
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
