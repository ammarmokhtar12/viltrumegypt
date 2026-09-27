"use client";

import { useState } from "react";
import { Ruler, CheckCircle2, AlertCircle } from "lucide-react";
import gsap from "gsap";

export default function SizeRecommender() {
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);

  const calculateSize = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      setResult("error");
      return;
    }

    let recommended = "";

    // AI Logic as requested
    if (w >= 50 && w <= 63 && h <= 170) {
      recommended = "Medium (M)";
    } else if (w > 63 && w <= 73 && h >= 170 && h <= 180) {
      recommended = "Large (L)";
    } else if (w > 73 && w <= 85) {
      recommended = "X-Large (XL)";
    } else if (w > 85 && w <= 95) {
      recommended = "2X-Large (2XL)";
    } else {
      // Fallbacks
      if (w < 50) recommended = "Small (S)";
      else if (w > 95) recommended = "3X-Large (3XL)";
      else {
        // Fallback for weird combinations not covered by the exact rules
        if (w <= 63) recommended = "Medium (M)";
        else if (w <= 73) recommended = "Large (L)";
        else recommended = "X-Large (XL)";
      }
    }

    setResult(recommended);

    // Simple animation for the result
    setTimeout(() => {
      gsap.fromTo(
        ".result-box",
        { opacity: 0, y: 10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
      );
    }, 50);
  };

  return (
    <div className="w-full p-4 rounded-xl bg-surface border border-border-light shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Ruler size={12} />
          </div>
          <h3 className="font-bold text-foreground text-xs">Smart Size Assistant</h3>
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-end">
        <div className="flex-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-muted block mb-1">Weight (KG)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 75"
            className="w-full bg-background border border-border-light rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-muted block mb-1">Height (CM)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 175"
            className="w-full bg-background border border-border-light rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <button
          onClick={calculateSize}
          className="bg-foreground text-background font-bold text-xs px-4 py-2 h-[34px] rounded-lg hover:bg-foreground/90 transition-all active:scale-[0.98] whitespace-nowrap"
        >
          Find Size
        </button>
      </div>

      {result && result !== "error" && (
        <div className="mt-2 p-3 rounded-lg bg-background border border-primary/20 result-box flex items-center gap-3">
          <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-muted leading-tight">Your perfect size is:</p>
            <p className="text-sm font-bold text-foreground font-display leading-tight">{result}</p>
          </div>
        </div>
      )}

      {result === "error" && (
        <p className="text-[10px] text-red-500 mt-1 font-medium">
          Please enter valid weight and height.
        </p>
      )}
    </div>
  );
}
