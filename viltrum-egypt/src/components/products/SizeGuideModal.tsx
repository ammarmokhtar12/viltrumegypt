"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isOpen) {
      // Unhide container
      gsap.set(containerRef.current, { display: "flex", autoAlpha: 1 });
      
      const tl = gsap.timeline();

      // 1. Fade in overlay
      tl.to(overlayRef.current, {
        autoAlpha: 1,
        backdropFilter: "blur(12px)",
        duration: 0.4,
        ease: "power2.out",
      });

      // 2. "Box opening" animation for the modal
      // We start it folded and rotated
      gsap.set(modalRef.current, {
        scale: 0.5,
        rotationX: 80,
        y: 100,
        transformPerspective: 1000,
        opacity: 0,
      });

      tl.to(
        modalRef.current,
        {
          scale: 1,
          rotationX: 0,
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.5)", // gives it a nice bounce like opening a lid
        },
        "-=0.2"
      );

      // 3. Staggered reveal of content inside
      tl.fromTo(
        contentRef.current?.children ? Array.from(contentRef.current.children) : [],
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
        },
        "-=0.4"
      );
    } else {
      // Close animation
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(containerRef.current, { display: "none" });
        },
      });

      tl.to(modalRef.current, {
        scale: 0.8,
        rotationX: -20,
        y: 50,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });

      tl.to(
        overlayRef.current,
        {
          autoAlpha: 0,
          backdropFilter: "blur(0px)",
          duration: 0.3,
          ease: "power2.in",
        },
        "-=0.2"
      );
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 items-center justify-center hidden"
      style={{ perspective: "1200px" }}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-background/80 opacity-0"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl px-4 pointer-events-none"
      >
        {/* Premium Box Design */}
        <div className="bg-surface border border-border-light shadow-2xl rounded-3xl overflow-hidden pointer-events-auto luxury-shadow">
          
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-border-light bg-background/50 backdrop-blur-md">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">
                Measurement Guide
              </p>
              <h3 className="text-xl font-bold font-display tracking-tight text-foreground">
                Viltrum Fit Chart
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border-light text-muted hover:text-foreground hover:bg-background transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Body */}
          <div ref={contentRef} className="p-8 space-y-6">
            <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-border-light bg-background shadow-inner">
              {/* Replace '/size-chart.png' with actual image later if needed, but it should be available now */}
              <Image
                src="/size-chart.png"
                alt="Viltrum Size Chart"
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border-light shadow-sm">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p className="text-sm font-medium text-secondary leading-relaxed">
                For the best fit, lay a similar garment flat and measure from armpit to armpit for width, and from collar to bottom hem for length. Compression fit is designed to be tight; if you prefer a relaxed feel, consider sizing up.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
