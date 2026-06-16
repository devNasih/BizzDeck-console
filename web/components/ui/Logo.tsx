export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2" data-testid="brand-logo">
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-bd-mint">
        <span
          className="absolute inset-0 rounded-md bg-bd-tealDeep"
          style={{ clipPath: "polygon(0 0, 60% 0, 0 60%)" }}
        />
        <span className="relative font-display font-black text-[13px] text-bd-tealDeep">B</span>
      </span>
      <span className={`font-display text-[18px] font-extrabold tracking-tight ${light ? "text-white" : "text-bd-tealDeep"}`}>
        bizz<span className="text-bd-mint">deck</span>
      </span>
    </div>
  );
}
