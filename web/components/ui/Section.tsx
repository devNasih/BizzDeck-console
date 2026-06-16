import { cn } from "@/lib/utils";

type SectionProps = {
  theme?: "light" | "dark" | "mint";
  className?: string;
  id?: string;
  children: React.ReactNode;
  "data-testid"?: string;
  full?: boolean; // min-h-screen on mobile
};

export function Section({ theme = "light", className, id, children, full = true, ...rest }: SectionProps) {
  const themes = {
    light: "bg-bd-bg text-bd-ink",
    dark: "bg-bd-tealDeep text-white",
    mint: "bg-bd-mintMuted text-bd-ink",
  } as const;
  return (
    <section
      id={id}
      {...rest}
      className={cn(
        "relative overflow-hidden px-5 py-16 sm:py-24 lg:py-28",
        full && "flex min-h-[100svh] flex-col justify-center sm:min-h-0",
        themes[theme],
        className,
      )}
    >
      <div className="relative z-10 mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={cn("overline mb-3", dark ? "text-bd-mint" : "text-bd-teal")}>{children}</p>;
}

export function H({ children, dark, className }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <h2
      className={cn(
        "font-display font-black leading-[1.04] tracking-tight text-[34px] sm:text-5xl lg:text-[60px]",
        dark ? "text-white" : "text-bd-tealDeep",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Sub({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={cn("mt-4 max-w-xl text-[15px] leading-relaxed sm:text-[17px]", dark ? "text-white/70" : "text-bd-inkSoft")}>
      {children}
    </p>
  );
}
