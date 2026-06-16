import { Section, Eyebrow, H, Sub } from "@/components/ui/Section";
import { Star, MessageSquare, IndianRupee, TrendingUp, BarChart3 } from "lucide-react";

export function DashboardPreview() {
  const outlets = [
    { n: "Indiranagar", v: "₹ 1.8L", r: 4.7, t: "+11%" },
    { n: "Koramangala", v: "₹ 2.4L", r: 4.6, t: "+8%" },
    { n: "HSR Layout", v: "₹ 1.6L", r: 4.8, t: "+14%" },
  ];
  const pills = [
    { i: IndianRupee, t: "Revenue" },
    { i: TrendingUp, t: "Profitability" },
    { i: Star, t: "Ratings" },
    { i: MessageSquare, t: "Complaints" },
    { i: BarChart3, t: "Outlet compare" },
  ];
  return (
    <Section theme="dark" data-testid="dashboard-preview">
      <Eyebrow dark>02 — The control room</Eyebrow>
      <H dark>One dashboard.<br/>Every outlet.</H>
      <Sub dark>Track every restaurant from one screen — across Zomato &amp; Swiggy.</Sub>

      {/* Pills row */}
      <div className="mt-7 flex flex-wrap gap-2">
        {pills.map((p) => (
          <span key={p.t} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/85">
            <p.i size={12} className="text-bd-mint" aria-hidden /> {p.t}
          </span>
        ))}
      </div>

      {/* Outlet performance cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {outlets.map((o) => (
          <div key={o.n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <p className="overline text-bd-mint">{o.n}</p>
            <p className="mt-2 font-display text-2xl font-black text-white sm:text-3xl">{o.v}</p>
            <div className="mt-1 flex items-center justify-between text-[12px] text-white/70">
              <span>★ {o.r}</span>
              <span className="font-semibold text-bd-mint">{o.t}</span>
            </div>
            {/* tiny bar viz */}
            <div className="mt-4 flex h-12 items-end gap-1">
              {[40, 55, 48, 70, 62, 80, 92].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i > 4 ? "hsl(150 100% 80%)" : "rgba(255,255,255,0.18)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Gross sales · MTD", v: "₹ 38.6L" },
          { k: "Net payout", v: "₹ 26.2L" },
          { k: "Avg margin", v: "27.4%" },
          { k: "Orders", v: "12,840" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="overline text-white/55">{s.k}</p>
            <p className="mt-1 font-display text-lg font-extrabold text-white">{s.v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
