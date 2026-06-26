import { Section, Eyebrow, H, Sub } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { KpiChart } from "@/components/animations/KpiChart";
import { Upload, ArrowUpRight, IndianRupee, Minus, BarChart3 } from "lucide-react";

export function SoaSection() {
  return (
    <Section theme="mint" data-testid="soa">
      <Eyebrow>03 — Analyser</Eyebrow>
      <H>Upload SOA.<br/>Get answers.</H>
      <Sub>Instantly understand revenue, deductions, payouts and profitability.</Sub>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Upload area */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border-2 border-dashed border-bd-teal/40 bg-white/70 p-7 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bd-tealDeep">
                <Upload size={20} className="text-bd-mint" aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight text-bd-tealDeep">Drop SOA here</p>
                <p className="text-[12px] text-bd-inkSoft">PDF · XLS · CSV — up to 25 MB</p>
              </div>
            </div>

            <Button href="/login?intent=soa" variant="teal" size="md" className="mt-5 w-full" data-testid="soa-upload-btn">
              Upload &amp; Analyze <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden />
            </Button>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Mini label="Revenue" value="₹ 4.8L" icon={IndianRupee} />
              <Mini label="Deductions" value="₹ 0.7L" icon={Minus} />
              <Mini label="Net" value="₹ 4.1L" icon={BarChart3} />
            </div>
          </div>
        </div>

        {/* Trend graph */}
        <div className="lg:col-span-3">
          <KpiChart variant="soa" />
        </div>
      </div>
    </Section>
  );
}

function Mini({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }> }) {
  return (
    <div className="rounded-xl border border-bd-border bg-white p-2">
      <Icon size={12} className="mx-auto text-bd-teal" aria-hidden />
      <p className="overline mt-1 text-[9px] text-bd-inkSoft">{label}</p>
      <p className="font-display text-sm font-extrabold text-bd-tealDeep">{value}</p>
    </div>
  );
}
