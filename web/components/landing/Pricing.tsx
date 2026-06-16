"use client";

import { useState } from "react";
import { Section, Eyebrow, H } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

const PLANS = [
  {
    name: "Lite",
    price: "₹999",
    cycle: "/mo",
    highlight: false,
    features: ["SOA Insights", "Monthly Review", "Dashboard Access"],
  },
  {
    name: "Plus",
    price: "₹2,499",
    cycle: "/mo",
    highlight: true,
    features: ["Weekly Strategy Call", "Growth Insights", "Guided Support"],
  },
  {
    name: "Pro",
    price: "₹3,499",
    cycle: "/mo",
    highlight: false,
    features: ["Dedicated Support", "Platform Coordination", "Strategic Reviews"],
  },
];

export function Pricing() {
  const [openIdx, setOpenIdx] = useState<number | null>(1);

  return (
    <Section data-testid="pricing" id="pricing">
      <Eyebrow>06 — Pricing</Eyebrow>
      <H>Simple plans.<br/>Pick yours.</H>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PLANS.map((p, i) => {
          const open = openIdx === i;
          return (
            <div
              key={p.name}
              data-testid={`pricing-card-${p.name.toLowerCase()}`}
              className={`bd-lift relative flex flex-col rounded-3xl p-5 sm:p-6 ${
                p.highlight ? "bg-bd-tealDeep text-white sm:scale-[1.03]" : "border border-bd-border bg-white"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 right-5 rounded-full bg-bd-mint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bd-tealDeep">
                  Most popular
                </span>
              )}
              <p className={`overline ${p.highlight ? "text-bd-mint" : "text-bd-teal"}`}>BizzDeck</p>
              <p className={`mt-1 font-display text-2xl font-black tracking-tight ${p.highlight ? "" : "text-bd-tealDeep"}`}>{p.name}</p>
              <p className={`mt-3 font-display text-4xl font-black tracking-tight ${p.highlight ? "" : "text-bd-tealDeep"}`}>
                {p.price}
                <span className={`text-base font-bold ${p.highlight ? "text-white/60" : "text-bd-inkSoft"}`}>{p.cycle}</span>
              </p>

              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className={`mt-3 inline-flex items-center gap-1 text-[12px] font-semibold ${
                  p.highlight ? "text-bd-mint" : "text-bd-teal"
                }`}
                aria-expanded={open}
                data-testid={`pricing-toggle-${p.name.toLowerCase()}`}
              >
                {open ? "Hide" : "What's included"}{" "}
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>

              {open && (
                <ul className="mt-3 space-y-2">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-[13px] sm:text-sm ${p.highlight ? "text-white/85" : "text-bd-ink"}`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          p.highlight ? "bg-bd-mint" : "bg-bd-tealDeep"
                        }`}
                      >
                        <Check
                          size={10}
                          strokeWidth={3}
                          className={p.highlight ? "text-bd-tealDeep" : "text-white"}
                        />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <Button
                href="/login?mode=register"
                size="md"
                variant={p.highlight ? "mint" : "teal"}
                className="mt-5"
                data-testid={`pricing-${p.name.toLowerCase()}-cta`}
              >
                Get Started <ChevronRight size={14} aria-hidden />
              </Button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
