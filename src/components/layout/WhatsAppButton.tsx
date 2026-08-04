"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229";

  if (!visible) return null;

  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent("مرحبا، عايز أستفسر عن منتج من Viltrum")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[45] w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 transition-all hover:scale-110 active:scale-95 safe-bottom"
      aria-label="Chat on WhatsApp"
      style={{ animationDelay: "2s" }}
    >
      <MessageCircle size={26} fill="white" />
    </a>
  );
}
