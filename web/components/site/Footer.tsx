/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

export function Footer() {
  const cols = [
    { h: "Product", l: [["Dashboard", "/dashboard"], ["SOA Decoder", "/dashboard"], ["Pricing", "/#pricing"]] },
    { h: "Company", l: [["Privacy", "/privacy"], ["Contact", "mailto:hello@bizzdeck.com"]] },
  ];
  return (
    <footer className="bg-bd-tealDeep border-t border-white/10">
      <div className="mx-auto max-w-[1180px] px-5 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2">
            <img src="/assets/White@4x.png" alt="BizzDeck Logo" className="h-8 object-contain" />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              Smart insights for restaurants across India.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <p className="overline mb-3 text-white/40">{c.h}</p>
              <ul className="space-y-2">
                {c.l.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/75 hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">© {new Date().getFullYear()} BizzDeck. All rights reserved.</p>
          <p className="text-xs text-white/45">Made for restaurateurs · India</p>
        </div>
      </div>
      <div aria-hidden className="select-none overflow-hidden">
        <p className="text-center font-display text-[22vw] font-black uppercase leading-[0.85] tracking-[-0.05em] text-white/[0.04]">
          bizzdeck
        </p>
      </div>
    </footer>
  );
}
