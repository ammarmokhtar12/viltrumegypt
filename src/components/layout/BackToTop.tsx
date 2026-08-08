"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-22 right-6 z-[45] w-11 h-11 bg-surface border border-border-light text-muted hover:text-foreground rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
