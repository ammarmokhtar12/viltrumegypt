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
    <div className="w-full max-w-sm mx-auto p-5 rounded-2xl bg-surface border border-border-light shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Ruler size={16} />
        </div>
        <h3 className="font-bold text-foreground">Smart Size Assistant</h3>
      </div>
      
      <p className="text-xs text-muted mb-5 leading-relaxed">
        Enter your weight and height and we'll recommend the best size for a perfect fit.
      </p>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Weight (KG)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75"
              className="w-full bg-background border border-border-light rounded-xl px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Height (CM)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 175"
              className="w-full bg-background border border-border-light rounded-xl px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <button
          onClick={calculateSize}
          className="w-full bg-foreground text-background font-bold text-sm py-3 rounded-xl hover:bg-foreground/90 transition-all active:scale-[0.98]"
        >
          Find My Size
        </button>
      </div>

      {result && result !== "error" && (
        <div className="mt-5 p-4 rounded-xl bg-background border border-primary/20 result-box">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted mb-1">Your perfect size is:</p>
              <p className="text-lg font-bold text-foreground font-display">{result}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border-light flex items-start gap-2">
            <AlertCircle className="text-orange-500 w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-orange-500/90 leading-relaxed font-medium">
              <span className="font-bold">Important Note:</span> This is a compression shirt, meaning it's designed to fit tightly and will reveal your body's details.
            </p>
          </div>
        </div>
      )}

      {result === "error" && (
        <p className="text-xs text-red-500 mt-4 text-center font-medium">
          Please enter valid weight and height.
        </p>
      )}
    </div>
  );
}
