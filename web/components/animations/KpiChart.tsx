"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight KPI / chart visual:
 * - When scrolled into view, runs a single rAF-driven animation (no Framer Motion).
 * - Respects prefers-reduced-motion.
 * - One animation pass (not infinite) for performance.
 */
type Props = {
  variant?: "hero" | "outlets" | "soa";
  className?: string;
};

const POINTS = [10, 22, 18, 30, 24, 38, 32, 48, 40, 60, 52, 75, 64, 92];

export function KpiChart({ variant = "hero", className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [orders, setOrders] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setProgress(1);
      setOrders(1284);
      setRevenue(482610);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && progress === 0) {
            const start = performance.now();
            const dur = 1400;
            const tOrders = 1284, tRev = 482610;
            const tick = (t: number) => {
              const p = Math.min(1, (t - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              setProgress(eased);
              setOrders(Math.round(tOrders * eased));
              setRevenue(Math.round(tRev * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.35 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [progress]);

  const W = 460, H = 140;
  const step = W / (POINTS.length - 1);
  const max = Math.max(...POINTS);
  const path = POINTS.map((v, i) => {
    const x = i * step;
    const y = H - (v / max) * H * progress;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;
  const lastX = (POINTS.length - 1) * step;
  const lastY = H - (POINTS[POINTS.length - 1] / max) * H * progress;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-3xl border border-bd-border bg-white p-4 shadow-[0_30px_60px_-30px_rgba(0,77,77,0.25)] sm:p-6 ${className ?? ""}`}
      data-testid="kpi-chart"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="overline text-bd-teal">{variant === "soa" ? "SOA · last 14 days" : "Live · last 14 days"}</p>
          <p className="mt-1 font-display text-2xl font-black tabular-nums text-bd-tealDeep sm:text-3xl">
            ₹ {revenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-bd-inkSoft">
            {orders.toLocaleString("en-IN")} orders · +18.4%
          </p>
        </div>
        <span className="rounded-full bg-bd-mint px-2.5 py-1 text-[10px] font-bold text-bd-tealDeep">
          +18.4%
        </span>
      </div>

      <div className="relative mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full overflow-visible sm:h-36" aria-hidden>
          <defs>
            <linearGradient id="bd-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(150 100% 60%)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="hsl(150 100% 60%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line key={p} x1="0" x2={W} y1={H * p} y2={H * p} stroke="hsl(185 20% 90%)" />
          ))}
          <path d={area} fill="url(#bd-area)" />
          <path
            d={path}
            fill="none"
            stroke="hsl(185 100% 15%)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {progress > 0.1 && (
            <>
              <circle cx={lastX} cy={lastY} r="11" fill="hsl(150 100% 80%)" opacity="0.5" />
              <circle cx={lastX} cy={lastY} r="5" fill="hsl(185 100% 15%)" />
            </>
          )}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Zomato" value="₹ 2.1L" />
        <Stat label="Swiggy" value="₹ 2.7L" />
        <Stat label="Net margin" value="26.7%" accent />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-2 ${accent ? "bg-bd-mint" : "border border-bd-border"}`}>
      <p className="overline text-[9px] text-bd-inkSoft">{label}</p>
      <p className="font-display text-base font-extrabold text-bd-tealDeep">{value}</p>
    </div>
  );
}
