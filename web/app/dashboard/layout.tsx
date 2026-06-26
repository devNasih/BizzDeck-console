import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your BizzDeck premium tools — calculators, SOA analyser, recipes, and reports.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
