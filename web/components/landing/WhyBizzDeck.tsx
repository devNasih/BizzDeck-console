import { Section, Eyebrow, H } from "@/components/ui/Section";
import { Check } from "lucide-react";

export function WhyBizzDeck() {
  const items = [
    "Built for Indian restaurants",
    "Multi-outlet ready",
    "Profitability focused",
    "Expert support included",
  ];
  return (
    <Section theme="dark" data-testid="why">
      <Eyebrow dark>05 — Why bizzdeck</Eyebrow>
      <H dark>Why restaurant owners<br/>choose BizzDeck.</H>

      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bd-mint">
              <Check size={16} className="text-bd-tealDeep" strokeWidth={3} aria-hidden />
            </span>
            <span className="text-[15px] font-semibold text-white">{t}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
