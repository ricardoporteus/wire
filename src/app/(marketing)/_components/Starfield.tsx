"use client";

import { useEffect, useRef } from "react";

/** Drifting particle field for the dark hero. Canvas-based, motion-safe. */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const hero = c.parentElement;
    if (!ctx || !hero) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    type Star = { x: number; y: number; r: number; base: number; tw: number; tp: number; vy: number; vx: number; col: string; glow: boolean };
    let stars: Star[] = [];

    function build() {
      W = hero!.clientWidth; H = hero!.clientHeight;
      c!.width = W * dpr; c!.height = H * dpr; c!.style.width = W + "px"; c!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(30, Math.min(120, Math.round((W * H) / 9000)));
      stars = [];
      for (let i = 0; i < n; i++) {
        const a = Math.random() < 0.12;
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: a ? Math.random() * 1.3 + 1 : Math.random() * 1 + 0.3,
          base: Math.random() * 0.5 + 0.2, tw: Math.random() * 0.018 + 0.004, tp: Math.random() * 6.28,
          vy: Math.random() * 0.09 + 0.02, vx: (Math.random() - 0.5) * 0.04,
          col: a ? (Math.random() < 0.5 ? "219,254,122" : "169,219,255") : "255,255,255", glow: a,
        });
      }
    }
    function frame() {
      ctx!.clearRect(0, 0, W, H);
      for (const s of stars) {
        let al = s.base;
        if (!reduce) {
          s.tp += s.tw; al = s.base * (Math.sin(s.tp) * 0.35 + 0.65);
          s.y += s.vy; s.x += s.vx;
          if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
          if (s.x < -2) s.x = W + 2; else if (s.x > W + 2) s.x = -2;
        }
        ctx!.beginPath();
        ctx!.shadowBlur = s.glow ? 8 : 0;
        if (s.glow) ctx!.shadowColor = "rgba(" + s.col + "," + al + ")";
        ctx!.fillStyle = "rgba(" + s.col + "," + al + ")";
        ctx!.arc(s.x, s.y, s.r, 0, 6.28); ctx!.fill();
      }
      ctx!.shadowBlur = 0;
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    build(); frame();
    let rz: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { cancelAnimationFrame(raf); build(); frame(); }, 150); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}
