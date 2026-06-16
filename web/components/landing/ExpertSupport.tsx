import { Section, Eyebrow, H, Sub } from "@/components/ui/Section";
import { TrendingUp, ChefHat, Headphones, Sparkles } from "lucide-react";

export function ExpertSupport() {
  const cards = [
    { i: TrendingUp, t: "Profitability Reviews" },
    { i: ChefHat, t: "Platform Guidance" },
    { i: Sparkles, t: "Growth Strategy" },
    { i: Headphones, t: "Account Support" },
  ];
  return (
    <Section data-testid="experts">
      <Eyebrow>04 — Humans in the loop</Eyebrow>
      <H>Software + restaurant expertise.</H>
      <Sub>Built by professionals who&apos;ve scaled restaurants on food delivery platforms.</Sub>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.t} className="bd-lift rounded-3xl border border-bd-border bg-white p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bd-tealDeep">
              <c.i size={18} className="text-bd-mint" aria-hidden />
            </span>
            <p className="mt-4 font-display text-base font-extrabold tracking-tight text-bd-tealDeep sm:text-lg">{c.t}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
