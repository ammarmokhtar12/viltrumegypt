"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function TextReveal({ children, className = "", delay = 0 }: TextRevealProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current) return;
    const elements = container.current.children;

    gsap.fromTo(
      elements,
      { y: 100, opacity: 0, rotateZ: 5 },
      {
        y: 0,
        opacity: 1,
        rotateZ: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.1,
        delay,
        scrollTrigger: {
          trigger: container.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, { scope: container });

  return (
    <div className={`overflow-hidden ${className}`} ref={container}>
      {children}
    </div>
  );
}
