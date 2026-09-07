"use client";

const DARK_OVERRIDES = `
  .cc-light-wrap { color: #e4e4e7; }
  .cc-light-wrap input, .cc-light-wrap select, .cc-light-wrap textarea {
    background: #18181b !important; border-color: #3f3f46 !important; color: #e4e4e7 !important;
  }
  .cc-light-wrap input::placeholder, .cc-light-wrap textarea::placeholder { color: #71717a !important; }
  .cc-light-wrap .bg-white, .cc-light-wrap .bg-gray-50, .cc-light-wrap .bg-gray-100 {
    background: #18181b !important;
  }
  .cc-light-wrap .border-gray-200, .cc-light-wrap .border-gray-100, .cc-light-wrap .border-gray-300 {
    border-color: #3f3f46 !important;
  }
  .cc-light-wrap .text-black, .cc-light-wrap .text-gray-900, .cc-light-wrap .text-gray-800 {
    color: #e4e4e7 !important;
  }
  .cc-light-wrap .text-gray-600, .cc-light-wrap .text-gray-500, .cc-light-wrap .text-gray-700 {
    color: #a1a1aa !important;
  }
  .cc-light-wrap .text-gray-400, .cc-light-wrap .text-gray-300 {
    color: #71717a !important;
  }
  .cc-light-wrap .bg-gray-200, .cc-light-wrap .bg-gray-300 {
    background: #27272a !important;
  }
  .cc-light-wrap .hover\\:bg-gray-50:hover, .cc-light-wrap .hover\\:bg-gray-100:hover {
    background: #27272a !important;
  }
  .cc-light-wrap .shadow-sm, .cc-light-wrap .shadow, .cc-light-wrap .shadow-lg, .cc-light-wrap .shadow-xl {
    box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
  }
  .cc-light-wrap .ring-gray-200 { --tw-ring-color: #3f3f46 !important; }
  .cc-light-wrap .bg-blue-50 { background: rgba(59,130,246,0.1) !important; }
  .cc-light-wrap .bg-green-50 { background: rgba(34,197,94,0.1) !important; }
  .cc-light-wrap .bg-red-50 { background: rgba(239,68,68,0.1) !important; }
  .cc-light-wrap .bg-yellow-50 { background: rgba(234,179,8,0.1) !important; }
  .cc-light-wrap .bg-purple-50 { background: rgba(168,85,247,0.1) !important; }
  .cc-light-wrap .bg-orange-50 { background: rgba(249,115,22,0.1) !important; }
  .cc-light-wrap .border-blue-200 { border-color: rgba(59,130,246,0.3) !important; }
  .cc-light-wrap .border-green-200 { border-color: rgba(34,197,94,0.3) !important; }
  .cc-light-wrap .border-red-200 { border-color: rgba(239,68,68,0.3) !important; }
`;

export default function DarkWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="cc-light-wrap">
      <style>{DARK_OVERRIDES}</style>
      {children}
    </div>
  );
}
