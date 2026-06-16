import { ArrowUpRight, ArrowRight, Star, Store, TrendingUp } from "lucide-react";
import { Section, Eyebrow, Sub } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { KpiChart } from "@/components/animations/KpiChart";

export function Hero() {
  return (
    <Section theme="dark" data-testid="hero" className="bd-grain-dark pt-28 sm:pt-32">
      <div className="pointer-events-none absolute -left-32 top-10 -z-0 h-[360px] w-[360px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, hsl(150 100% 80% / 0.55), transparent 65%)" }} />
      <div className="pointer-events-none absolute -right-24 -top-20 -z-0 h-[320px] w-[320px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, hsl(150 100% 80% / 0.4), transparent 60%)" }} />

      <div className="relative">
        <Eyebrow dark>Built for Indian restaurants</Eyebrow>
        <h1 className="font-display text-[40px] font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-[78px]">
          Know exactly where your{" "}
          <span className="text-bd-mint">Swiggy &amp; Zomato</span> money goes.
        </h1>
        <Sub dark>Track sales, payouts, deductions and profitability across every outlet — in one place.</Sub>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Button href="/login?intent=soa" size="lg" variant="mint" data-testid="hero-analyze-btn">
            Analyze My SOA <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
          </Button>
          <Button href="/login?mode=register" size="lg" variant="outline-light" data-testid="hero-demo-btn">
            Book Demo <ArrowRight size={16} aria-hidden />
          </Button>
        </div>

        {/* Trust strip */}
        <div className="mt-10 grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {[
            { icon: Star, t: "4.9", s: "Rating" },
            { icon: Store, t: "Multi-outlet", s: "Ready" },
            { icon: TrendingUp, t: "Profit", s: "First" },
          ].map((b) => (
            <div key={b.s} className="rounded-2xl p-3 text-center">
              <b.icon size={18} className="mx-auto text-bd-mint" aria-hidden />
              <p className="mt-1 font-display text-base font-extrabold text-white sm:text-lg">{b.t}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/55">{b.s}</p>
            </div>
          ))}
        </div>

        {/* Hero KPI mock */}
        <div className="mt-7">
          <KpiChart variant="hero" />
        </div>
      </div>
    </Section>
  );
}
