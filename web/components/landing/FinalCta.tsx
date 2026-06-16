import { Section, Eyebrow, H } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight, ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <Section theme="dark" data-testid="final-cta" className="bd-grain-dark text-center">
      <div className="pointer-events-none absolute -bottom-20 left-1/2 -z-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, hsl(150 100% 80% / 0.65), transparent 65%)" }} />

      <div className="mx-auto max-w-3xl">
        <Eyebrow dark>Ready when you are</Eyebrow>
        <H dark>
          Run your restaurant on{" "}
          <em className="not-italic text-bd-mint">real insight.</em>
        </H>

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Button href="/login?intent=soa" size="lg" variant="mint" data-testid="final-analyze-btn">
            Analyze My SOA <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
          </Button>
          <Button href="/login?mode=register" size="lg" variant="outline-light" data-testid="final-demo-btn">
            Book Demo <ArrowRight size={16} aria-hidden />
          </Button>
        </div>
      </div>
    </Section>
  );
}
