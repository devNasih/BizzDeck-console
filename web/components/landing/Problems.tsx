import { ShieldAlert, Store, EyeOff, LineChart } from "lucide-react";
import { Section, Eyebrow, H, Sub } from "@/components/ui/Section";

export function Problems() {
  const tiles = [
    { icon: ShieldAlert, t: "Hidden Charges", d: "Buried in SOA files." },
    { icon: Store, t: "Multiple Outlets", d: "Five tabs, one mess." },
    { icon: EyeOff, t: "Poor Visibility", d: "Late, partial reports." },
    { icon: LineChart, t: "Profit Confusion", d: "Sales ≠ profit." },
  ];
  return (
    <Section data-testid="problems">
      <Eyebrow>01 — The mess</Eyebrow>
      <H>Restaurant data is messy.</H>
      <Sub>BizzDeck turns chaos into clarity in minutes.</Sub>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.t} className="bd-lift rounded-3xl border border-bd-border bg-white p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bd-mintMuted">
              <t.icon size={18} className="text-bd-tealDeep" aria-hidden />
            </span>
            <p className="mt-4 font-display text-lg font-extrabold tracking-tight text-bd-tealDeep">{t.t}</p>
            <p className="mt-1 text-[13px] text-bd-inkSoft">{t.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
