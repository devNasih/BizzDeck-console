"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calculator, Receipt, ChefHat, FileText, CalendarCheck2,
  TrendingUp, FileBarChart2, LogOut, ArrowRight, Plus, Trash2,
  Sparkles, X, ChevronDown, Store,
  ChevronLeft, ChevronRight, UserCircle, Ticket, Lock,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuth, Restaurant } from "@/components/auth/AuthProvider";
import { getApiErrorMessage } from "@/lib/api";
import axios from "axios";
import { Toast } from "@/components/ui/Toast";

type Recipe = {
  id: string; name: string; serves: number;
  ingredients: { name: string; cost: number }[];
  per_serve_cost: number; suggested_price: number; target_margin_pct: number;
};


type Report = {
  summary: { gross_sales: number; net_payout: number; deductions: number; orders: number; avg_order_value: number; profit_margin_pct: number };
  top_items: { name: string; orders: number; revenue: number }[];
  recommendations: string[];
};

const Stat = ({
  label,
  value,
  accent,
  change,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  change?: { text: string; positive: boolean };
}) => (
  <div className={`rounded-xl p-2.5 ${accent ? "bg-bd-mint border border-bd-mint/10" : "border border-bd-border"} flex flex-col justify-between h-full`}>
    <div>
      <p className="overline text-[9px] text-bd-inkSoft">{label}</p>
      <p className="font-display text-base font-bold text-bd-tealDeep">{value}</p>
    </div>
    {change && (
      <span className={`text-[10px] font-bold mt-1 inline-block ${change.positive ? "text-emerald-600" : "text-red-500"}`}>
        {change.text}
      </span>
    )}
  </div>
);

/* 1 — Menu Price Calculator */
function MenuPriceCalc() {
  const [cost, setCost] = useState(80);
  const [overhead, setOverhead] = useState(15);
  const [margin, setMargin] = useState(65);
  const [tax, setTax] = useState(5);
  const totals = useMemo(() => {
    const a = cost * (1 + overhead / 100);
    const b = a / Math.max(0.01, 1 - margin / 100);
    const c = b * (1 + tax / 100);
    return { a, b, c };
  }, [cost, overhead, margin, tax]);
  const fields = [
    ["Raw cost (₹)", cost, setCost],
    ["Overhead %", overhead, setOverhead],
    ["Margin %", margin, setMargin],
    ["Tax %", tax, setTax],
  ] as const;
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2" data-testid="menu-calc">
      <div className="space-y-3">
        {fields.map(([l, v, s]) => (
          <label key={l} className="block">
            <span className="overline mb-1.5 block text-bd-inkSoft">{l}</span>
            <input type="number" value={v} onChange={(e) => s(parseFloat(e.target.value) || 0)} className="w-full rounded-xl border border-bd-border px-4 py-2.5 text-sm outline-none focus:border-bd-teal" />
          </label>
        ))}
      </div>
      <div className="rounded-2xl bg-bd-tealDeep p-6 text-white">
        <p className="overline text-bd-mint">Suggested selling price</p>
        <p className="font-display text-5xl font-extrabold tracking-tight">₹ {totals.c.toFixed(0)}</p>
        <p className="mt-1 text-xs text-white/60">Incl. {tax}% tax</p>
        <div className="mt-6 space-y-1.5 text-sm text-white/80">
          <Row k="Cost + overhead" v={`₹ ${totals.a.toFixed(2)}`} />
          <Row k="Pre-tax" v={`₹ ${totals.b.toFixed(2)}`} />
          <Row k="Margin captured" v={`${margin}%`} accent />
        </div>
      </div>
    </div>
  );
}
const Row = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
  <div className="flex justify-between"><span>{k}</span><span className={accent ? "text-bd-mint" : ""}>{v}</span></div>
);


/* 3 — Recipe Management */
function RecipeMgmt() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [name, setName] = useState("");
  const [serves, setServes] = useState(1);
  const [ings, setIngs] = useState<{ name: string; cost: number | string }[]>([{ name: "", cost: 0 }]);
  const [margin, setMargin] = useState(65);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bizzdeck_recipes");
      if (stored) setRecipes(JSON.parse(stored));
    } catch {
      // ignore local cache errors
    }
  }, []);

  const persistRecipes = (nextRecipes: Recipe[]) => {
    setRecipes(nextRecipes);
    try {
      localStorage.setItem("bizzdeck_recipes", JSON.stringify(nextRecipes));
    } catch {
      // ignore local cache errors
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const ingredients = ings.map(i => ({ name: i.name, cost: parseFloat(String(i.cost)) || 0 }));
      const totalCost = ingredients.reduce((sum, i) => sum + i.cost, 0);
      const safeServes = Number(serves) || 1;
      const perServeCost = totalCost / safeServes;
      const suggestedPrice = perServeCost / Math.max(0.01, 1 - margin / 100);
      const nextRecipe: Recipe = {
        id: `${Date.now()}`,
        name, serves: Number(serves) || 1,
        ingredients,
        per_serve_cost: Number(perServeCost.toFixed(2)),
        suggested_price: Number(suggestedPrice.toFixed(2)),
        target_margin_pct: margin,
      };
      persistRecipes([nextRecipe, ...recipes]);
      setName(""); setServes(1); setIngs([{ name: "", cost: 0 }]); setMargin(65);
    } finally { setBusy(false); }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5" data-testid="recipes">
      <form onSubmit={save} className="space-y-3 rounded-2xl border border-bd-border bg-bd-section p-5 lg:col-span-2">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Recipe name" className="w-full rounded-xl border border-bd-border px-3 py-2 text-sm outline-none focus:border-bd-teal" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="1" value={serves} onChange={(e) => setServes(parseInt(e.target.value) || 1)} placeholder="Serves" className="rounded-xl border border-bd-border px-3 py-2 text-sm outline-none" />
          <input type="number" value={margin} onChange={(e) => setMargin(parseFloat(e.target.value) || 0)} placeholder="Margin %" className="rounded-xl border border-bd-border px-3 py-2 text-sm outline-none" />
        </div>
        {ings.map((i, idx) => (
          <div key={idx} className="flex gap-2">
            <input value={i.name} onChange={(e) => setIngs(ings.map((x, j) => j === idx ? { ...x, name: e.target.value } : x))} placeholder="Ingredient" className="flex-1 rounded-xl border border-bd-border px-3 py-2 text-sm outline-none" />
            <input type="number" value={i.cost} onChange={(e) => setIngs(ings.map((x, j) => j === idx ? { ...x, cost: e.target.value } : x))} placeholder="₹" className="w-24 rounded-xl border border-bd-border px-3 py-2 text-sm outline-none" />
            <button type="button" onClick={() => setIngs(ings.filter((_, j) => j !== idx))} className="text-bd-inkSoft hover:text-red-600"><X size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={() => setIngs([...ings, { name: "", cost: 0 }])} className="inline-flex items-center gap-1 text-xs font-semibold text-bd-teal"><Plus size={12} /> Add ingredient</button>
        <button type="submit" disabled={busy} className="btn-teal w-full rounded-xl px-4 py-2.5 text-sm font-bold">{busy ? "Saving…" : "Save recipe"}</button>
      </form>
      <div className="space-y-3 lg:col-span-3">
        {recipes.length === 0 && <p className="rounded-2xl border border-dashed border-bd-border p-6 text-center text-sm text-bd-inkSoft">No recipes yet. Save your first one →</p>}
        {recipes.map((r) => (
          <div key={r.id} className="rounded-2xl border border-bd-border bg-bd-section p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-extrabold text-bd-tealDeep">{r.name}</p>
                <p className="text-xs text-bd-inkSoft">Serves {r.serves} · {r.ingredients?.length || 0} ingredients</p>
              </div>
              <button onClick={() => persistRecipes(recipes.filter((recipe) => recipe.id !== r.id))} className="text-bd-inkSoft hover:text-red-600"><Trash2 size={15} /></button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Stat label="Cost / serve" value={`₹ ${r.per_serve_cost}`} />
              <Stat label="Suggested" value={`₹ ${r.suggested_price?.toFixed(0)}`} />
              <Stat label="Margin" value={`${r.target_margin_pct}%`} accent />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 4 — SOA Analyser */
type AnalysisReport = {
  id: string | number;
  restaurantId?: number;
  aggregator?: "zomato" | "swiggy";
  month: string | number;
  year?: number;
  numberOfFiles?: number;
  filesHash?: string;
  numberOfOrders?: number;
  datesWithNoOrders?: string[];
  createdAt: string;
  zomatoAnalysis?: string;
  swiggyAnalysis?: string;
  calculatedSolution?: CalculatedSolution;
  calculatedTemplate?: CalculatedTemplate;
};

type PercentageComparison = {
  head?: string | null;
  zomato?: string | null;
  swiggy?: string | null;
  winner?: string | null;
};

type CompareData = {
  zomatoSales?: number | null;
  swiggySales?: number | null;
  zomatoPercentageOfTotalSales?: string | null;
  swiggyPercentageOfTotalSales?: string | null;
  percentages?: PercentageComparison[] | null;
};

type MonthwiseRef = {
  month: string | number;
  year?: number;
  zomatoAnalysis?: string | number | null;
  swiggyAnalysis?: string | number | null;
  total_sales?: number;
  overall?: {
    gross_sales?: number | string | null;
    net_deductions?: number | string | null;
    net_payout?: number | string | null;
  };
  zomatoProfitExceedsLimit?: boolean | null;
  zomatoProfitSuggestion?: string[] | null;
  swiggyProfitExceedsLimit?: boolean | null;
  swiggyProfitSuggestion?: string[] | null;
  profitExceedsLimit?: boolean;
  profitMessage?: string;
  percentageChangeFromLastMonth?: string | number | null;
  compare?: CompareData | null;
};

type OverallSales = {
  grossSales?: number | string | null;
  netDeductions?: number | string | null;
  netPayable?: number | string | null;
};

type SoaMonthOption = {
  value: string;
  label: string;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getReportMonthNumber(month: unknown, createdAt?: string): number {
  const num = Number(month);
  if (!Number.isNaN(num) && num >= 1 && num <= 12) return num;

  const str = String(month || "");
  const parsed = new Date(str);
  if (str.includes("-") && !Number.isNaN(parsed.getTime())) return parsed.getMonth() + 1;

  const lower = str.toLowerCase();
  const foundIndex = MONTH_NAMES.findIndex((name) => lower.includes(name.toLowerCase()) || lower.includes(name.slice(0, 3).toLowerCase()));
  if (foundIndex >= 0) return foundIndex + 1;

  if (createdAt) return new Date(createdAt).getMonth() + 1;
  return 0;
}

function getReportYear(report: AnalysisReport): number {
  if (report.year) return report.year;
  return 0;
}

function formatLatestAnalyticsLabel(month: unknown, year?: number): string {
  const monthNumber = getReportMonthNumber(month);
  const monthLabel = monthNumber >= 1 && monthNumber <= 12 ? MONTH_NAMES[monthNumber - 1] : String(month || "").trim();
  return monthLabel && year ? `Latest Analytics - ${monthLabel} ${year}` : "Latest Analytics";
}

function getLatestAnalyticsLabel(reports: AnalysisReport[], monthwiseReferences: MonthwiseRef[] = []): string {
  if (monthwiseReferences.length > 0) {
    const latestReference = monthwiseReferences[0];
    return formatLatestAnalyticsLabel(latestReference.month, latestReference.year);
  }

  if (reports.length === 0) return "Latest Analytics";

  const latest = reports.reduce((currentLatest, report) => {
    const currentScore = getReportYear(currentLatest) * 100 + getReportMonthNumber(currentLatest.month, currentLatest.createdAt);
    const reportScore = getReportYear(report) * 100 + getReportMonthNumber(report.month, report.createdAt);
    if (reportScore !== currentScore) return reportScore > currentScore ? report : currentLatest;

    const currentCreated = currentLatest.createdAt ? new Date(currentLatest.createdAt).getTime() : 0;
    const reportCreated = report.createdAt ? new Date(report.createdAt).getTime() : 0;
    return reportCreated > currentCreated ? report : currentLatest;
  }, reports[0]);

  const monthNumber = getReportMonthNumber(latest.month, latest.createdAt);
  const year = getReportYear(latest);
  return formatLatestAnalyticsLabel(monthNumber, year);
}

function getAnalysisIdForAggregator(reference: MonthwiseRef | undefined, selectedAggregator: "zomato" | "swiggy"): string {
  const id = selectedAggregator === "zomato" ? reference?.zomatoAnalysis : reference?.swiggyAnalysis;
  return id != null ? String(id) : "";
}

function getMonthOptionLabel(reference: MonthwiseRef): string {
  const monthNumber = getReportMonthNumber(reference.month);
  const monthLabel = monthNumber >= 1 && monthNumber <= 12 ? MONTH_NAMES[monthNumber - 1] : String(reference.month || "").trim();
  return monthLabel && reference.year ? `${monthLabel} ${reference.year}` : monthLabel || "Unknown Month";
}

function formatCompactAmount(amount: number | string | null | undefined): string {
  const numValue = Number.parseFloat(String(amount ?? 0)) || 0;

  if (numValue >= 10000000) {
    const crores = numValue / 10000000;
    return crores % 1 === 0 ? `${crores.toFixed(0)}Cr` : `${crores.toFixed(1)}Cr`;
  }

  if (numValue >= 100000) {
    const lakhs = numValue / 100000;
    return lakhs % 1 === 0 ? `${lakhs.toFixed(0)}L` : `${lakhs.toFixed(1)}L`;
  }

  if (numValue >= 1000) {
    const thousands = numValue / 1000;
    return thousands % 1 === 0 ? `${thousands.toFixed(0)}K` : `${thousands.toFixed(1)}K`;
  }

  return numValue.toFixed(0);
}

function getOverallSales(monthwiseReferences: MonthwiseRef[], data: unknown): OverallSales {
  const latestOverall = monthwiseReferences[0]?.overall;
  if (latestOverall) {
    return {
      grossSales: latestOverall.gross_sales ?? 0,
      netDeductions: latestOverall.net_deductions ?? 0,
      netPayable: latestOverall.net_payout ?? 0,
    };
  }

  const body = data as {
    data?: {
      monthwiseReferenceReports?: { overallSales?: OverallSales | null } | null;
    };
    monthwiseReferenceReports?: { overallSales?: OverallSales | null } | null;
  };

  return body?.data?.monthwiseReferenceReports?.overallSales || body?.monthwiseReferenceReports?.overallSales || {};
}

type TemplateNode = {
  value?: string | number | null;
  components?: string[];
  nested_components?: string[];
  simple_components?: string[];
  components_arithmetic_value?: string | number | null;
  [key: string]: unknown;
};

type CalculatedSolution = {
  profit?: { value?: string | number | null; message?: string; exceeds_limit?: boolean };
  suggession?: string[]; // Note: Spelt 'suggession' in backend API response
  online_sales?: { value?: string | number | null };
  actual_ads_spent?: { value?: string | number | null; message?: string };
  actual_commissions_tax_pg?: { value?: string | number | null; message?: string };
  online_net_difference_with_dine_in?: { value?: string | number | null; message?: string };
};

type CalculatedTemplate = Record<string, TemplateNode | string | number | null | undefined>;



const MOCK_ANALYSES: AnalysisReport[] = [
  { id: "report-june-2026", month: "June 2026", createdAt: "2026-06-20T10:00:00Z", zomatoAnalysis: "report-june-2026", swiggyAnalysis: "report-june-2026-swiggy" },
  { id: "report-may-2026", month: "May 2026", createdAt: "2026-05-18T10:00:00Z", zomatoAnalysis: "report-may-2026", swiggyAnalysis: "report-may-2026-swiggy" },
  { id: "report-april-2026", month: "April 2026", createdAt: "2026-04-15T10:00:00Z", zomatoAnalysis: "report-april-2026", swiggyAnalysis: "report-april-2026-swiggy" },
];

const MOCK_MONTHWISE: MonthwiseRef[] = [
  { month: "Jan 2026", total_sales: 85000 },
  { month: "Feb 2026", total_sales: 92000 },
  { month: "Mar 2026", total_sales: 110000 },
  { month: "Apr 2026", total_sales: 105000 },
  { month: "May 2026", total_sales: 125000 },
  { month: "Jun 2026", total_sales: 150000 },
];

const MOCK_DETAILS: Record<string, { calculatedTemplate: CalculatedTemplate }> = {
  "report-june-2026": {
    calculatedTemplate: {
      total_orders: {
        value: 152,
        total_delivered_orders: { value: 148 },
        total_incomplete_orders: { value: 4 },
      },
      gross_sales: {
        value: 150000,
        item_subtotal: { value: 140000 },
        packaging_charges: { value: 7000 },
        gst_collected_from_customers: { value: 3000 },
      },
      total_commisionable_value: {
        value: 150000,
        commisionable_subtotal: { value: 140000 },
        commisionable_packaging_charge: { value: 7000 },
        commisionable_gst_collected_from_customers: { value: 3000 },
      },
      net_deductions: {
        value: 55500,
        service_fee: {
          value: 33000,
          basic_service_fee: { value: 30000 },
          long_distance_fee: { value: 2000 },
          payment_gateway_fee: { value: 1000 },
        },
        taxes_on_service_fee: { value: 5940 },
        discounts: { value: 2000 },
        other_order_level_deductions: {
          value: 1560,
          customer_compensation: { value: 500 },
          rejection_penalty: { value: 1060 },
        },
        advertisements: {
          value: 10000,
          total_ads: { value: 8000 },
          total_dining_ads: { value: 2000 },
        },
        additional_tax_deductions: {
          value: 3000,
          tds: { value: 1500 },
          tcs: { value: 1500 },
        },
      },
      net_additions: {
        value: 12000,
        cancellation_refund: { value: 5000 },
        tips_for_kitchen_staff: { value: 2000 },
        tds_194h: { value: 1000 },
        gst_paid_by_restaurant: { value: 1500 },
        other_additions: {
          value: 2500,
          self_delivery_charge: { value: 1500 },
          brand_pack_subscription_fee: { value: 1000 },
        },
      },
      net_payout: {
        value: 106500,
        amount_settled: { value: 100000 },
        amount_pending: { value: 6500 },
      },
    },
  },
  "report-june-2026-swiggy": {
    calculatedTemplate: {
      total_orders: {
        value: 180,
        total_delivered_orders: { value: 172 },
        total_incomplete_orders: { value: 8 },
      },
      gross_sales: {
        value: 170000,
        item_subtotal: { value: 158000 },
        packaging_charges: { value: 8000 },
        gst_collected_from_customers: { value: 4000 },
      },
      total_commisionable_value: {
        value: 170000,
        commisionable_subtotal: { value: 158000 },
        commisionable_packaging_charge: { value: 8000 },
        commisionable_gst_collected_from_customers: { value: 4000 },
      },
      net_deductions: {
        value: 65900,
        service_fee: {
          value: 37400,
          basic_service_fee: { value: 34000 },
          long_distance_fee: { value: 2400 },
          payment_gateway_fee: { value: 1000 },
        },
        taxes_on_service_fee: { value: 6732 },
        discounts: { value: 3000 },
        other_order_level_deductions: {
          value: 2000,
          customer_compensation: { value: 800 },
          rejection_penalty: { value: 1200 },
        },
        advertisements: {
          value: 13000,
          total_ads: { value: 10000 },
          total_dining_ads: { value: 3000 },
        },
        additional_tax_deductions: {
          value: 3768,
          tds: { value: 1884 },
          tcs: { value: 1884 },
        },
      },
      net_additions: {
        value: 15000,
        cancellation_refund: { value: 6000 },
        tips_for_kitchen_staff: { value: 2500 },
        tds_194h: { value: 1200 },
        gst_paid_by_restaurant: { value: 1800 },
        other_additions: {
          value: 3500,
          self_delivery_charge: { value: 2000 },
          brand_pack_subscription_fee: { value: 1500 },
        },
      },
      net_payout: {
        value: 119100,
        amount_settled: { value: 110000 },
        amount_pending: { value: 9100 },
      },
    },
  },
  "report-may-2026": {
    calculatedTemplate: {
      total_orders: {
        value: 120,
        total_delivered_orders: { value: 115 },
        total_incomplete_orders: { value: 5 },
      },
      gross_sales: {
        value: 125000,
        item_subtotal: { value: 116000 },
        packaging_charges: { value: 6000 },
        gst_collected_from_customers: { value: 3000 },
      },
      total_commisionable_value: {
        value: 125000,
        commisionable_subtotal: { value: 116000 },
        commisionable_packaging_charge: { value: 6000 },
        commisionable_gst_collected_from_customers: { value: 3000 },
      },
      net_deductions: {
        value: 43750,
        service_fee: {
          value: 27500,
          basic_service_fee: { value: 25000 },
          long_distance_fee: { value: 1500 },
          payment_gateway_fee: { value: 1000 },
        },
        taxes_on_service_fee: { value: 4950 },
        discounts: { value: 1500 },
        other_order_level_deductions: {
          value: 800,
          customer_compensation: { value: 300 },
          rejection_penalty: { value: 500 },
        },
        advertisements: {
          value: 6500,
          total_ads: { value: 5000 },
          total_dining_ads: { value: 1500 },
        },
        additional_tax_deductions: {
          value: 2500,
          tds: { value: 1250 },
          tcs: { value: 1250 },
        },
      },
      net_additions: {
        value: 9000,
        cancellation_refund: { value: 4000 },
        tips_for_kitchen_staff: { value: 1500 },
        tds_194h: { value: 800 },
        gst_paid_by_restaurant: { value: 1000 },
        other_additions: {
          value: 1700,
          self_delivery_charge: { value: 1000 },
          brand_pack_subscription_fee: { value: 700 },
        },
      },
      net_payout: {
        value: 90250,
        amount_settled: { value: 85000 },
        amount_pending: { value: 5250 },
      },
    },
  },
  "report-may-2026-swiggy": {
    calculatedTemplate: {
      total_orders: {
        value: 130,
        total_delivered_orders: { value: 122 },
        total_incomplete_orders: { value: 8 },
      },
      gross_sales: {
        value: 135000,
        item_subtotal: { value: 125000 },
        packaging_charges: { value: 7000 },
        gst_collected_from_customers: { value: 3000 },
      },
      total_commisionable_value: {
        value: 135000,
        commisionable_subtotal: { value: 125000 },
        commisionable_packaging_charge: { value: 7000 },
        commisionable_gst_collected_from_customers: { value: 3000 },
      },
      net_deductions: {
        value: 51450,
        service_fee: {
          value: 29700,
          basic_service_fee: { value: 27000 },
          long_distance_fee: { value: 1700 },
          payment_gateway_fee: { value: 1000 },
        },
        taxes_on_service_fee: { value: 5346 },
        discounts: { value: 2000 },
        other_order_level_deductions: {
          value: 1000,
          customer_compensation: { value: 400 },
          rejection_penalty: { value: 600 },
        },
        advertisements: {
          value: 10000,
          total_ads: { value: 8000 },
          total_dining_ads: { value: 2000 },
        },
        additional_tax_deductions: {
          value: 3404,
          tds: { value: 1702 },
          tcs: { value: 1702 },
        },
      },
      net_additions: {
        value: 11000,
        cancellation_refund: { value: 4500 },
        tips_for_kitchen_staff: { value: 1800 },
        tds_194h: { value: 900 },
        gst_paid_by_restaurant: { value: 1200 },
        other_additions: {
          value: 2600,
          self_delivery_charge: { value: 1500 },
          brand_pack_subscription_fee: { value: 1100 },
        },
      },
      net_payout: {
        value: 94550,
        amount_settled: { value: 90000 },
        amount_pending: { value: 4550 },
      },
    },
  },
};



function ProfitLossIndicator({
  reference,
  aggregator,
}: {
  reference?: MonthwiseRef;
  aggregator: "zomato" | "swiggy";
}) {
  if (!reference) return null;

  const platformName = aggregator === "swiggy" ? "Swiggy" : "Zomato";
  const platformLogo = aggregator === "swiggy" ? "/assets/Swiggy_logo.png" : "/assets/Zomato_logo.png";
  const platformLossRisk = aggregator === "swiggy"
    ? reference.swiggyProfitExceedsLimit
    : reference.zomatoProfitExceedsLimit;
  const suggestions = aggregator === "swiggy"
    ? reference.swiggyProfitSuggestion
    : reference.zomatoProfitSuggestion;
  const isLossRisk = platformLossRisk ?? reference.profitExceedsLimit ?? false;
  const statusTitle = isLossRisk ? `${platformName} needs attention` : `${platformName} is profitable`;
  const statusMessage = isLossRisk
    ? reference.profitMessage || "Profitability needs improvement"
    : "Profit is within the healthy range for this platform.";

  return (
    <section className={`mx-auto w-full max-w-2xl rounded-2xl border p-4 ${isLossRisk
        ? "border-red-100 bg-red-50/60"
        : "border-emerald-100 bg-emerald-50/60"
      }`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
          <img
            src={platformLogo}
            alt={platformName}
            className={aggregator === "swiggy" ? "h-[82%] w-[82%] object-contain" : "h-full w-full object-contain"}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-xs font-black uppercase tracking-wider ${isLossRisk ? "text-red-700" : "text-emerald-700"
              }`}>
              {statusTitle}
            </p>
            <span className={`h-2 w-2 rounded-full ${isLossRisk ? "bg-red-500" : "bg-emerald-500"}`} />
          </div>
          <p className="mt-1 text-sm font-semibold text-bd-tealDeep">
            {statusMessage}
          </p>

          {suggestions && suggestions.length > 0 && (
            <div className="mt-3 rounded-xl border border-white/80 bg-white/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-bd-inkSoft">Suggestions</p>
              <ul className="mt-2 space-y-1.5">
                {suggestions.map((suggestion) => (
                  <li key={suggestion} className="flex gap-2 text-xs font-semibold leading-relaxed text-bd-tealDeep">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isLossRisk ? "bg-red-500" : "bg-emerald-500"}`} />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type ExpandableTilesProps = {
  title: string;
  totalAmount: string;
  data: {
    components: Record<string, unknown>[];
  };
  showRupeeIcon?: boolean;
  showPieChart?: boolean;
  pieColors?: string[];
  noNeedtoShowDots?: boolean;
};

function ExpandableTiles({
  title,
  totalAmount,
  data,
  showRupeeIcon = true,
  showPieChart = false,
  pieColors,
  noNeedtoShowDots = false,
}: ExpandableTilesProps) {
  const components = data?.components || [];
  const [expandedSubKeys, setExpandedSubKeys] = useState<Record<string, boolean>>({});

  const toggleSubKey = (key: string) => {
    setExpandedSubKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDisplayValue = (val: string | number | unknown) => {
    if (val == null) return "0";
    const strVal = String(val);
    const num = Number(strVal);
    if (isNaN(num)) return strVal;
    const formatted = num.toFixed(2);
    if (formatted.endsWith(".00")) return formatted.slice(0, -3);
    return formatted;
  };

  const colors = pieColors && pieColors.length > 0 ? pieColors : ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];
  const circ = 2 * Math.PI * 50; // ~314.16

  const parsedValues = components.map(c => {
    const key = Object.keys(c).find(k => k !== "splitups") || "";
    const valStr = key ? String(c[key] ?? "") : "";
    const val = Number(valStr.replace(/[^0-9.-]/g, ""));
    const splitups = c.splitups as Record<string, unknown>[] | undefined;
    return { key, val: isNaN(val) ? 0 : val, splitups };
  }).filter(item => item.key !== "");

  const sum = parsedValues.reduce((acc, curr) => acc + Math.abs(curr.val), 0);

  let accumulatedPercent = 0;
  const segments = parsedValues.map((item, idx) => {
    const percent = sum > 0 ? Math.abs(item.val) / sum : 0;
    const strokeDasharray = `${percent * circ} ${circ}`;
    const strokeDashoffset = -accumulatedPercent * circ;
    accumulatedPercent += percent;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      color: colors[idx % colors.length],
    };
  });

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-bd-border bg-white shadow-sm overflow-hidden animate-in fade-in duration-200">
      <div
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left border-b border-bd-border bg-neutral-50/10"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-bd-inkSoft">
          {title}
        </span>
        <span className="font-display text-lg font-black text-bd-tealDeep">
          {showRupeeIcon ? `₹ ${formatDisplayValue(totalAmount)}` : formatDisplayValue(totalAmount)}
        </span>
      </div>

      <div className="px-4 pb-3 pt-3 bg-neutral-50/30">
        {showPieChart && components.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
              <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                {segments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="80"
                    cy="80"
                    r="50"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
                <span className="text-[8px] uppercase tracking-wider text-bd-inkSoft font-bold">Total</span>
                <span className="font-display text-[10px] font-black text-bd-tealDeep truncate max-w-full">
                  {showRupeeIcon ? `₹${formatDisplayValue(totalAmount)}` : formatDisplayValue(totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              {segments.map((seg, idx) => {
                const hasSplitups = seg.splitups && seg.splitups.length > 0;
                const isSubExpanded = !!expandedSubKeys[seg.key];
                const splitupItems = hasSplitups ? Object.entries(seg.splitups![0]) : [];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-bd-section px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        {!noNeedtoShowDots && (
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        )}
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-bd-inkSoft">{seg.key}</span>
                          {hasSplitups && (
                            <button
                              type="button"
                              onClick={() => toggleSubKey(seg.key)}
                              className="p-0.5 rounded hover:bg-neutral-200/50 text-bd-inkSoft transition duration-150 flex items-center justify-center"
                              aria-label={`Toggle details for ${seg.key}`}
                            >
                              <ChevronDown
                                size={12}
                                className={`transform transition-transform duration-150 ${isSubExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-bd-tealDeep">
                        {showRupeeIcon ? `₹ ${formatDisplayValue(seg.val)}` : formatDisplayValue(seg.val)}
                      </span>
                    </div>

                    {hasSplitups && isSubExpanded && (
                      <div
                        className="pl-5 pr-2 py-1 space-y-1 border-l-2 border-dashed ml-3.5 animate-in slide-in-from-top-1 duration-150"
                        style={{ borderLeftColor: seg.color }}
                      >
                        {splitupItems.map(([subKey, subVal]) => (
                          <div key={subKey} className="flex justify-between items-center text-[10px] py-1 text-bd-inkSoft">
                            <span className="font-medium">{subKey}</span>
                            <span className="font-bold text-bd-tealDeep">
                              {showRupeeIcon ? `₹ ${formatDisplayValue(subVal)}` : formatDisplayValue(subVal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          components.length > 0 ? (
            <div className="space-y-2">
              {components.map((component, idx) => {
                const key = Object.keys(component).find(k => k !== "splitups")!;
                const value = component[key];
                const splitups = component.splitups as Record<string, unknown>[] | undefined;
                const hasSplitups = splitups && splitups.length > 0;
                const isSubExpanded = !!expandedSubKeys[key];
                const splitupItems = hasSplitups ? Object.entries(splitups![0]) : [];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-bd-section px-3 py-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-bd-inkSoft">{key}</span>
                        {hasSplitups && (
                          <button
                            type="button"
                            onClick={() => toggleSubKey(key)}
                            className="p-0.5 rounded hover:bg-neutral-200/50 text-bd-inkSoft transition duration-150 flex items-center justify-center"
                            aria-label={`Toggle details for ${key}`}
                          >
                            <ChevronDown
                              size={12}
                              className={`transform transition-transform duration-150 ${isSubExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                      <span className="font-black text-bd-tealDeep">
                        {showRupeeIcon ? `₹ ${formatDisplayValue(value)}` : formatDisplayValue(value)}
                      </span>
                    </div>

                    {hasSplitups && isSubExpanded && (
                      <div className="pl-5 pr-2 py-1 space-y-1 border-l-2 border-dashed border-neutral-200/60 ml-2.5 animate-in slide-in-from-top-1 duration-150">
                        {splitupItems.map(([subKey, subVal]) => (
                          <div key={subKey} className="flex justify-between items-center text-[10px] py-1 text-bd-inkSoft">
                            <span className="font-medium">{subKey}</span>
                            <span className="font-bold text-bd-tealDeep">
                              {showRupeeIcon ? `₹ ${formatDisplayValue(subVal)}` : formatDisplayValue(subVal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-semibold text-bd-inkSoft">No component breakup available.</p>
          )
        )}
      </div>
    </div>
  );
}

/* ── CompareGrossSaleCard ── */
function parsePercentageValue(value: string): number {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrencyAmount(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)} K`;
  return value.toFixed(2);
}

function CompareGrossSaleCard({ data }: { data?: MonthwiseRef | null }) {
  const compareData = data?.compare;
  const zomatoSales = compareData?.zomatoSales ?? 0;
  const swiggySales = compareData?.swiggySales ?? 0;
  const totalSales = data?.total_sales ?? (zomatoSales + swiggySales);

  const zomatoPercentString = compareData?.zomatoPercentageOfTotalSales ?? "0%";
  const swiggyPercentString = compareData?.swiggyPercentageOfTotalSales ?? "0%";

  let zomatoPercent = parsePercentageValue(zomatoPercentString);
  let swiggyPercent = parsePercentageValue(swiggyPercentString);

  // Ensure chart renders even with no data
  const effectiveZomatoPercent = (zomatoPercent === 0 && swiggyPercent === 0) ? 1 : zomatoPercent;
  const displayZomatoPercent = zomatoPercent; // keep original for label

  const percentageChange = data?.percentageChangeFromLastMonth;
  const isPositiveChange =
    percentageChange != null && !String(percentageChange).startsWith("-");

  const chartData = [
    { name: "Zomato", value: effectiveZomatoPercent },
    { name: "Swiggy", value: swiggyPercent || (effectiveZomatoPercent === 1 && zomatoPercent === 0 ? 0 : swiggyPercent) },
  ];

  const COLORS = ["#FF3054", "#E38827"];

  return (
    <div className="rounded-2xl bg-[#F8F9FA] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-black">Gross Sale</span>
        <span className="text-lg font-bold text-black">
          ₹ {formatCurrencyAmount(totalSales)}
        </span>
      </div>

      {/* Percentage change */}
      {percentageChange != null && (
        <div className={`mt-1 flex items-center text-xs font-semibold ${
          isPositiveChange ? "text-green-600" : "text-red-500"
        }`}>
          {isPositiveChange
            ? <ArrowUp size={14} className="mr-0.5" />
            : <ArrowDown size={14} className="mr-0.5" />}
          <span>{String(percentageChange)}</span>
        </div>
      )}

      {/* Donut Chart */}
      <div className="h-[200px] flex items-center justify-center mt-5 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center logos overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex gap-1">
            <img
              src="/assets/Zomato_logo.png"
              alt="Zomato"
              className="h-6 w-6 rounded-full object-contain border border-gray-200 bg-white"
            />
            <img
              src="/assets/Swiggy_logo.png"
              alt="Swiggy"
              className="h-6 w-6 rounded-full object-contain border border-gray-200 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 space-y-3">
        {/* Zomato row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#FF3054" }} />
            <span className="text-sm text-black font-normal">
              Zomato ( {zomatoPercentString} )
            </span>
          </div>
          <span className="text-sm font-semibold text-black">
            ₹ {formatCurrencyAmount(zomatoSales)}
          </span>
        </div>
        {/* Swiggy row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#E38827" }} />
            <span className="text-sm text-black font-normal">
              Swiggy ( {swiggyPercentString} )
            </span>
          </div>
          <span className="text-sm font-semibold text-black">
            ₹ {formatCurrencyAmount(swiggySales)}
          </span>
        </div>
      </div>
    </div>
  );
}


function CompareTable({
  aggregator,
  reference,
  monthwiseReferenceReports,
}: {
  aggregator?: "zomato" | "swiggy" | null;
  reference?: MonthwiseRef | null;
  monthwiseReferenceReports?: MonthwiseRef[];
}) {
  if (!reference?.compare?.percentages || reference.compare.percentages.length === 0) {
    return null;
  }

  const isZomato = aggregator?.toLowerCase() === "zomato";
  const isSwiggy = aggregator?.toLowerCase() === "swiggy";
  const isCompare = !aggregator;

  function calculatePercentageChange(
    reports: MonthwiseRef[] | undefined,
    current: MonthwiseRef,
    forZomato: boolean,
  ): string | null {
    if (!reports || reports.length === 0) return null;
    const currentMonthRaw = current.month;
    const currentYear = current.year;
    if (currentMonthRaw == null || currentYear == null) return null;

    const currentMonth = typeof currentMonthRaw === "number"
      ? currentMonthRaw
      : getReportMonthNumber(currentMonthRaw);
    if (!currentMonth) return null;

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = currentYear - 1;
    }

    const prevReport = reports.find((r) => {
      const rMonth = typeof r.month === "number" ? r.month : getReportMonthNumber(r.month);
      return rMonth === prevMonth && r.year === prevYear;
    });
    if (!prevReport) return null;

    const currentSales = forZomato ? current.compare?.zomatoSales : current.compare?.swiggySales;
    const prevSales = forZomato ? prevReport.compare?.zomatoSales : prevReport.compare?.swiggySales;

    if (currentSales == null || prevSales == null || prevSales === 0) return null;
    const change = ((currentSales - prevSales) / prevSales) * 100;
    return `${change.toFixed(2)}%`;
  }

  function buildRow(
    label: string,
    zomato: string,
    swiggy: string,
  ) {
    const head = label.toLowerCase().trim();
    const isSpecialHead =
      head.includes("profit") ||
      (head.includes("percentage change") && head.includes("last month"));

    const isZomatoNegative = isSpecialHead && zomato.trim().startsWith("-");
    const isSwiggyNegative = isSpecialHead && swiggy.trim().startsWith("-");

    return (
      <div key={label} className="contents">
        {/* Label cell */}
        <div className="my-1 rounded-lg bg-[#E9FBF0] px-3 py-3">
          <span className="text-[13px] font-medium leading-snug line-clamp-2">{label}</span>
        </div>
        {/* Zomato value cell */}
        {(isZomato || isCompare) && (
          <div className={`my-1 mx-1 rounded-lg px-3 py-3 flex items-center justify-center ${
            isZomatoNegative ? "bg-[#FDE8E8]" : "bg-[#E9FBF0]"
          }`}>
            <span className={`text-[13px] font-bold text-center ${
              isZomatoNegative ? "text-[#C81E1E]" : "text-[#006736]"
            }`}>{zomato}</span>
          </div>
        )}
        {/* Swiggy value cell */}
        {(isSwiggy || isCompare) && (
          <div className={`my-1 mx-1 rounded-lg px-3 py-3 flex items-center justify-center ${
            isSwiggyNegative ? "bg-[#FDE8E8]" : "bg-[#E9FBF0]"
          }`}>
            <span className={`text-[13px] font-bold text-center ${
              isSwiggyNegative ? "text-[#C81E1E]" : "text-[#006736]"
            }`}>{swiggy}</span>
          </div>
        )}
      </div>
    );
  }

  const colCount = 1 + (isZomato || isCompare ? 1 : 0) + (isSwiggy || isCompare ? 1 : 0);
  const gridClass = colCount === 3
    ? "grid-cols-[1.5fr_1fr_1fr]"
    : colCount === 2
    ? "grid-cols-[1.5fr_1fr]"
    : "grid-cols-1";

  return (
    <div className={`rounded-xl bg-[#F2F2F2] p-4 mt-5`}>
      <div className={`grid ${gridClass} gap-x-1`}>
        {/* Header row */}
        <div />
        {(isZomato || isCompare) && (
          <div className="flex justify-center py-2">
            <img src="/assets/Zomato_logo.png" alt="Zomato" className="h-10 w-10 rounded-full object-contain border border-gray-200 bg-white" />
          </div>
        )}
        {(isSwiggy || isCompare) && (
          <div className="flex justify-center py-2">
            <img src="/assets/Swiggy_logo.png" alt="Swiggy" className="h-10 w-10 rounded-full object-contain border border-gray-200 bg-white" />
          </div>
        )}

        {/* Data rows */}
        {reference.compare!.percentages!.map((e) => {
          let zomatoVal = e.zomato ?? "0.00%";
          let swiggyVal = e.swiggy ?? "0.00%";

          const head = e.head?.toLowerCase() ?? "";
          if (head.includes("percentage change") && head.includes("last month")) {
            if (!e.zomato || e.zomato === "0.00%" || e.zomato === "0" || e.zomato === "null") {
              if (!isCompare && isZomato) {
                zomatoVal = String(reference.percentageChangeFromLastMonth ?? zomatoVal);
              } else if (isCompare) {
                zomatoVal = calculatePercentageChange(monthwiseReferenceReports, reference, true) ?? zomatoVal;
              }
            }
            if (!e.swiggy || e.swiggy === "0.00%" || e.swiggy === "0" || e.swiggy === "null") {
              if (!isCompare && isSwiggy) {
                swiggyVal = String(reference.percentageChangeFromLastMonth ?? swiggyVal);
              } else if (isCompare) {
                swiggyVal = calculatePercentageChange(monthwiseReferenceReports, reference, false) ?? swiggyVal;
              }
            }
          }

          return buildRow(e.head ?? "", zomatoVal, swiggyVal);
        })}
      </div>
    </div>
  );
}

function SoaAnalyser({
  selectedRestaurant,
  onLatestAnalyticsLabel,
  selectedAnalysisId: externalSelectedAnalysisId,
  onSelectedAnalysisIdChange,
  onMonthOptionsChange,
}: {
  selectedRestaurant: Restaurant | null;
  onLatestAnalyticsLabel?: (label: string) => void;
  selectedAnalysisId?: string;
  onSelectedAnalysisIdChange?: (value: string) => void;
  onMonthOptionsChange?: (options: SoaMonthOption[]) => void;
}) {
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([]);
  const [monthwiseRef, setMonthwiseRef] = useState<MonthwiseRef[]>([]);
  const [overallSales, setOverallSales] = useState<OverallSales>({});
  const [selectedAnalysisId, setInternalSelectedAnalysisId] = useState<string>(externalSelectedAnalysisId || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [aggregator, setAggregator] = useState<"zomato" | "swiggy">("zomato");
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [details, setDetails] = useState<Partial<AnalysisReport> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  const setSelectedAnalysisId = useCallback((value: string) => {
    setInternalSelectedAnalysisId(value);
    onSelectedAnalysisIdChange?.(value);
  }, [onSelectedAnalysisIdChange]);

  useEffect(() => {
    if (externalSelectedAnalysisId !== undefined && externalSelectedAnalysisId !== selectedAnalysisId) {
      setInternalSelectedAnalysisId(externalSelectedAnalysisId);
    }
  }, [externalSelectedAnalysisId, selectedAnalysisId]);





  useEffect(() => {
    if (!selectedRestaurant?.id) {
      setAnalyses([]);
      setMonthwiseRef([]);
      setOverallSales({});
      setSelectedAnalysisId("");
      onLatestAnalyticsLabel?.("Latest Analytics");
      onMonthOptionsChange?.([]);
      return;
    }

    let activeRequest = true;

    const fetchOverall = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/v1/analysis", {
          timeout: 8000,
          params: {
            restaurant_id: selectedRestaurant.id,
            compare_info: true,
            overall_info: true,
            analysis_info: true,
          },
        });
        if (!activeRequest) return;

        const analysesList = data?.data?.analyses || data?.analyses || [];
        const monthwiseList = data?.data?.monthwiseReferenceReports || data?.monthwiseReferenceReports || data?.data?.monthwiseReference || data?.monthwiseReference || [];

        setAnalyses(analysesList);
        setMonthwiseRef(monthwiseList);
        setOverallSales(getOverallSales(monthwiseList, data));
        onLatestAnalyticsLabel?.(getLatestAnalyticsLabel(analysesList, monthwiseList));

        if (monthwiseList.length > 0) {
          const activeId = getAnalysisIdForAggregator(monthwiseList[0], "zomato");
          setSelectedAnalysisId(activeId);
        } else if (analysesList.length > 0) {
          const firstReport = analysesList[0];
          const activeId = String(firstReport.id);
          setSelectedAnalysisId(activeId);
        } else {
          loadMockData();
        }
      } catch (error) {
        if (!activeRequest) return;
        console.warn("Using mock analysis data:", getApiErrorMessage(error, "Analysis data is not available."));
        loadMockData();
      } finally {
        if (activeRequest) setLoading(false);
      }
    };

    const loadMockData = () => {
      setAnalyses(MOCK_ANALYSES);
      setMonthwiseRef(MOCK_MONTHWISE);
      setOverallSales({});
      onLatestAnalyticsLabel?.(getLatestAnalyticsLabel(MOCK_ANALYSES, MOCK_MONTHWISE));
      const activeId = getAnalysisIdForAggregator(MOCK_MONTHWISE[0], "zomato") || String(MOCK_ANALYSES[0].id);
      setSelectedAnalysisId(activeId);
    };

    fetchOverall();
    return () => {
      activeRequest = false;
    };
  }, [onLatestAnalyticsLabel, onMonthOptionsChange, selectedRestaurant?.id, setSelectedAnalysisId]);

  useEffect(() => {
    if (monthwiseRef.length === 0) return;
    onMonthOptionsChange?.(monthwiseRef.map((reference) => ({
      value: getAnalysisIdForAggregator(reference, aggregator),
      label: getMonthOptionLabel(reference),
    })).filter((option) => option.value));
    const activeId = getAnalysisIdForAggregator(monthwiseRef[0], aggregator);
    if (activeId) setSelectedAnalysisId(activeId);
  }, [aggregator, monthwiseRef, onMonthOptionsChange, setSelectedAnalysisId]);

  useEffect(() => {
    if (!selectedAnalysisId) {
      setDetails(null);
      return;
    }

    let activeRequest = true;

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const { data } = await axios.get(`/v1/analysis/${selectedAnalysisId}`, { timeout: 8000 });
        if (!activeRequest) return;
        const reportDetails = data?.data || data;
        setDetails(reportDetails);
      } catch (error) {
        if (!activeRequest) return;
        console.warn("Details fetching failed:", error);
        loadMockDetails();
      } finally {
        if (activeRequest) setDetailsLoading(false);
      }
    };

    const loadMockDetails = () => {
      const mockDet = MOCK_DETAILS[selectedAnalysisId] || MOCK_DETAILS["report-june-2026"];
      setDetails(mockDet || null);
    };

    fetchDetails();
    return () => {
      activeRequest = false;
    };
  }, [selectedAnalysisId]);

  const getNumberOfOrdersData = (totalOrdersNode: TemplateNode) => {
    const components: Record<string, unknown>[] = [];
    const addIfNotNull = (key: string, value: unknown) => {
      if (value != null) {
        components.push({ [key]: value });
      }
    };

    const deliveredNode = totalOrdersNode.total_delivered_orders as TemplateNode | undefined;
    const incompleteNode = totalOrdersNode.total_incomplete_orders as TemplateNode | undefined;

    addIfNotNull("Total Orders Delivered", deliveredNode?.value);
    addIfNotNull("Total Orders Cancelled/Rejected", incompleteNode?.value);

    return { components };
  };

  const getGrossSalesData = (grossSalesNode: TemplateNode) => {
    const components: Record<string, unknown>[] = [];
    const addIfNotNull = (key: string, value: unknown) => {
      if (value != null) {
        components.push({ [key]: value });
      }
    };

    const subtotalNode = grossSalesNode.item_subtotal as TemplateNode | undefined;
    const packagingNode = grossSalesNode.packaging_charges as TemplateNode | undefined;
    const gstNode = grossSalesNode.gst_collected_from_customers as TemplateNode | undefined;

    addIfNotNull("Item Subtotal", subtotalNode?.value);
    addIfNotNull("Packaging Charges", packagingNode?.value);
    addIfNotNull("GST from customers", gstNode?.value);

    return { components };
  };

  const getNetDeductionsData = (netDeductionsNode: TemplateNode, aggregatorName: string) => {
    const components: Record<string, unknown>[] = [];
    const buildSplitups = (items: Record<string, unknown>) => {
      const map: Record<string, unknown> = {};
      Object.entries(items).forEach(([key, value]) => {
        if (value != null) map[key] = value;
      });
      return Object.keys(map).length === 0 ? null : map;
    };

    const serviceFee = netDeductionsNode.service_fee as TemplateNode | undefined;
    const taxesOnServiceFee = netDeductionsNode.taxes_on_service_fee as TemplateNode | undefined;
    const discounts = netDeductionsNode.discounts as TemplateNode | undefined;
    const otherOrderLevelDeductions = netDeductionsNode.other_order_level_deductions as TemplateNode | undefined;
    const advertisements = netDeductionsNode.advertisements as TemplateNode | undefined;
    const additionalTaxDeductions = netDeductionsNode.additional_tax_deductions as TemplateNode | undefined;

    const serviceFeeSplitups = serviceFee ? buildSplitups({
      "Base Service Fee": (serviceFee.basic_service_fee as TemplateNode | undefined)?.value,
      "Long Distance Fee": (serviceFee.long_distance_fee as TemplateNode | undefined)?.value,
      "Payment Gateway": (serviceFee.payment_gateway_fee as TemplateNode | undefined)?.value,
      "Discount on long distance enablement fee": (serviceFee.discount_on_long_distance_enablement_fee as TemplateNode | undefined)?.value,
      "Discount on service fee due to 30% capping": (serviceFee.discount_on_service_fee_due_to_capping_30 as TemplateNode | undefined)?.value,
    }) : null;

    if (serviceFee?.value != null || serviceFeeSplitups) {
      components.push({
        "Service Fee": serviceFee?.value,
        ...(serviceFeeSplitups ? { splitups: [serviceFeeSplitups] } : {}),
      });
    }

    if (taxesOnServiceFee?.value != null) {
      components.push({ "Taxes on Service Fee": taxesOnServiceFee.value });
    }

    if (discounts?.value != null) {
      components.push({ "Discounts": discounts.value });
    }

    const otherDeductionsSplitups = otherOrderLevelDeductions ? buildSplitups({
      "Customer compensation": (otherOrderLevelDeductions.customer_compensation as TemplateNode | undefined)?.value,
      "Rejection penalty": (otherOrderLevelDeductions.rejection_penalty as TemplateNode | undefined)?.value,
      "Delivery charges recovery": (otherOrderLevelDeductions.delivery_charges_recovery as TemplateNode | undefined)?.value,
      "Credit note/ (Debit note) adjustment": (otherOrderLevelDeductions.credit_debit_note_adjustment as TemplateNode | undefined)?.value,
      "Promo recovery adjustment": (otherOrderLevelDeductions.promo_recovery_adjustment as TemplateNode | undefined)?.value,
      "Extra inventory ads (order level deduction)": (otherOrderLevelDeductions.extra_inventory_ads as TemplateNode | undefined)?.value,
      "Brand loyalty points redemption": (otherOrderLevelDeductions.brand_loyalty_points_redemption as TemplateNode | undefined)?.value,
      "Express order fee": (otherOrderLevelDeductions.express_order_fee as TemplateNode | undefined)?.value,
      "Amount received in cash (on self delivery orders)": (otherOrderLevelDeductions.amount_received_in_cash as TemplateNode | undefined)?.value,
      "Adjustments from previous period": (otherOrderLevelDeductions.adjustments_from_previous_period as TemplateNode | undefined)?.value,
    }) : null;

    if (otherOrderLevelDeductions?.value != null || otherDeductionsSplitups) {
      components.push({
        "Other order level deductions": otherOrderLevelDeductions?.value,
        ...(otherDeductionsSplitups ? { splitups: [otherDeductionsSplitups] } : {}),
      });
    }

    const adsSplitups = advertisements ? buildSplitups({
      "Total Ads (inc. 18% GST)": (advertisements.total_ads as TemplateNode | undefined)?.value,
      "Total Dining Ads (inc. 18% GST)": (advertisements.total_dining_ads as TemplateNode | undefined)?.value,
      "Other growth services": (advertisements.other_growth_services as TemplateNode | undefined)?.value ?? "0.0",
    }) : null;

    if (advertisements?.value != null || adsSplitups) {
      components.push({
        "Advertisement": advertisements?.value,
        ...(adsSplitups ? { splitups: [adsSplitups] } : {}),
      });
    }

    const addTaxSplitups = additionalTaxDeductions ? buildSplitups({
      "TDS 194O": (additionalTaxDeductions.tds as TemplateNode | undefined)?.value,
      "TCS": (additionalTaxDeductions.tcs as TemplateNode | undefined)?.value,
      [`5% GST collected & paid by ${aggregatorName}`]: (additionalTaxDeductions.gst_paid_by_aggregator as TemplateNode | undefined)?.value,
    }) : null;

    if (additionalTaxDeductions?.value != null || addTaxSplitups) {
      components.push({
        "Additional Tax Deductions": additionalTaxDeductions?.value,
        ...(addTaxSplitups ? { splitups: [addTaxSplitups] } : {}),
      });
    }

    return { components };
  };

  const getNetAdditionsData = (netAdditionsNode: TemplateNode) => {
    const components: Record<string, unknown>[] = [];
    const buildSplitups = (items: Record<string, unknown>) => {
      const map: Record<string, unknown> = {};
      Object.entries(items).forEach(([key, value]) => {
        if (value != null) map[key] = value;
      });
      return Object.keys(map).length === 0 ? null : map;
    };

    const cancellationRefund = netAdditionsNode.cancellation_refund as TemplateNode | undefined;
    const tipsForKitchenStaff = netAdditionsNode.tips_for_kitchen_staff as TemplateNode | undefined;
    const tds194H = netAdditionsNode.tds_194h as TemplateNode | undefined;
    const gstPaidByRestaurant = netAdditionsNode.gst_paid_by_restaurant as TemplateNode | undefined;
    const otherAdditions = netAdditionsNode.other_additions as TemplateNode | undefined;

    const addIfNotNull = (key: string, value: unknown) => {
      if (value != null) {
        components.push({ [key]: value });
      }
    };

    addIfNotNull("Cancellation refund for cancelled orders", cancellationRefund?.value);
    addIfNotNull("Tips for Kitchen Staff", tipsForKitchenStaff?.value);
    addIfNotNull("TDS 194 H and other Res id level additions", tds194H?.value);
    addIfNotNull("GST to be paid by Restaurant to govt", gstPaidByRestaurant?.value);

    const splitups = otherAdditions ? buildSplitups({
      "Delivery charge for restaurants on self logistics": (otherAdditions.self_delivery_charge as TemplateNode | undefined)?.value,
      "Brand pack subscription fee": (otherAdditions.brand_pack_subscription_fee as TemplateNode | undefined)?.value,
    }) : null;

    if (otherAdditions?.value != null || splitups) {
      components.push({
        "Others Additions": otherAdditions?.value,
        ...(splitups ? { splitups: [splitups] } : {}),
      });
    }

    return { components };
  };

  const getNetPayoutData = (netPayoutNode: TemplateNode) => {
    const components: Record<string, unknown>[] = [];
    const addIfNotNull = (key: string, value: unknown) => {
      if (value != null) {
        components.push({ [key]: value });
      }
    };

    const settledNode = netPayoutNode.amount_settled as TemplateNode | undefined;
    const pendingNode = netPayoutNode.amount_pending as TemplateNode | undefined;

    addIfNotNull("Amount Settled", settledNode?.value);
    addIfNotNull("Pending Amount", pendingNode?.value);

    return { components };
  };

  const getCommissionableValueData = (commissionableNode: TemplateNode) => {
    const components: Record<string, unknown>[] = [];
    const addIfNotNull = (key: string, value: unknown) => {
      if (value != null) {
        components.push({ [key]: value });
      }
    };

    const subtotalNode = commissionableNode.commisionable_subtotal as TemplateNode | undefined;
    const packagingNode = commissionableNode.commisionable_packaging_charge as TemplateNode | undefined;
    const gstNode = commissionableNode.commisionable_gst_collected_from_customers as TemplateNode | undefined;

    addIfNotNull("Commissionable Subtotal", subtotalNode?.value);
    addIfNotNull("Packaging Charge", packagingNode?.value);
    addIfNotNull("GST Collected", gstNode?.value);

    return { components };
  };

  const commissionablePieColors = ["#3b82f6", "#10b981", "#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b"];


  const selectedMonthReference = monthwiseRef.find((reference) => {
    return reference.zomatoAnalysis != null && String(reference.zomatoAnalysis) === selectedAnalysisId
      || reference.swiggyAnalysis != null && String(reference.swiggyAnalysis) === selectedAnalysisId;
  }) || monthwiseRef[0];
  const overallAnalyticsLogos = [
    selectedMonthReference?.zomatoAnalysis != null
      ? { src: "/assets/Zomato_logo.png", alt: "Zomato" }
      : null,
    selectedMonthReference?.swiggyAnalysis != null
      ? { src: "/assets/Swiggy_logo.png", alt: "Swiggy" }
      : null,
  ].filter(Boolean) as { src: string; alt: string }[];
  const hasSelectedSwiggyAnalysis = selectedMonthReference?.swiggyAnalysis != null;
  const hasSelectedZomatoAnalysis = selectedMonthReference?.zomatoAnalysis != null;

  const payoutData = details?.calculatedTemplate;
  const numberOfOrders = payoutData?.total_orders as TemplateNode | undefined;
  const grossSales = payoutData?.gross_sales as TemplateNode | undefined;
  const commissionableValue = payoutData?.total_commisionable_value as TemplateNode | undefined;
  const netDeductions = payoutData?.net_deductions as TemplateNode | undefined;
  const netAdditions = payoutData?.net_additions as TemplateNode | undefined;
  const netPayout = payoutData?.net_payout as TemplateNode | undefined;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" data-testid="soa-decode">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
      </div>
    );
  }

  if (!loading && analyses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-bd-border p-12 text-center" data-testid="soa-decode">
        <p className="font-display text-lg font-extrabold text-bd-tealDeep">No reports available</p>
        <p className="mt-1 text-sm text-bd-inkSoft">No performance analysis reports have been processed for this restaurant yet.</p>
      </div>
    );
  }

  return (
    <div data-testid="soa-decode" className="space-y-6">
      <section className="rounded-2xl border border-bd-border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-center">
          <div className="flex items-center justify-center gap-2.5">
            <h3 className="font-display text-sm font-bold text-bd-tealDeep">Overall Analytics</h3>
            {overallAnalyticsLogos.length > 0 && (
              <div className="relative h-8 w-10">
                {hasSelectedSwiggyAnalysis && (
                  <span className="absolute bottom-0 left-0 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-bd-border bg-white shadow-sm">
                    <img src="/assets/Swiggy_logo.png" alt="Swiggy" className="h-[82%] w-[82%] object-contain" />
                  </span>
                )}
                {hasSelectedZomatoAnalysis && (
                  <span
                    className="absolute top-0 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-bd-border bg-white shadow-sm"
                    style={{ left: hasSelectedSwiggyAnalysis ? 12 : 2 }}
                  >
                    <img src="/assets/Zomato_logo.png" alt="Zomato" className="h-full w-full object-contain" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-bd-border bg-bd-section px-3 py-2.5">
            <p className="overline text-[9px] text-bd-inkSoft">Gross Sales</p>
            <p className="mt-0.5 font-display text-lg font-black text-bd-tealDeep">
              ₹ {formatCompactAmount(overallSales.grossSales)}
            </p>
          </div>
          <div className="rounded-lg border border-bd-border bg-bd-section px-3 py-2.5">
            <p className="overline text-[9px] text-bd-inkSoft">Deductions</p>
            <p className="mt-0.5 font-display text-lg font-black text-bd-tealDeep">
              ₹ {formatCompactAmount(overallSales.netDeductions)}
            </p>
          </div>
          <div className="rounded-lg border border-bd-mint bg-bd-mint px-3 py-2.5">
            <p className="overline text-[9px] text-bd-tealDeep/70">Net Payout</p>
            <p className="mt-0.5 font-display text-lg font-black text-bd-tealDeep">
              ₹ {formatCompactAmount(overallSales.netPayable)}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-4 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => { setAggregator("swiggy"); setIsCompareMode(false); }}
          className={`flex h-12 min-w-40 items-center justify-center gap-2.5 rounded-full border px-4 text-xs font-bold transition duration-200 ${aggregator === "swiggy" && !isCompareMode
              ? "border-bd-tealDeep bg-bd-tealDeep text-white shadow-sm"
              : "border-bd-border bg-white text-bd-tealDeep hover:border-bd-teal"
            }`}
          aria-label="Show Swiggy analytics"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
            <img src="/assets/Swiggy_logo.png" alt="" className="h-[82%] w-[82%] object-contain" />
          </span>
          Swiggy
        </button>
        <button
          type="button"
          onClick={() => { setAggregator("zomato"); setIsCompareMode(false); }}
          className={`flex h-12 min-w-40 items-center justify-center gap-2.5 rounded-full border px-4 text-xs font-bold transition duration-200 ${aggregator === "zomato" && !isCompareMode
              ? "border-bd-tealDeep bg-bd-tealDeep text-white shadow-sm"
              : "border-bd-border bg-white text-bd-tealDeep hover:border-bd-teal"
            }`}
          aria-label="Show Zomato analytics"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
            <img src="/assets/Zomato_logo.png" alt="" className="h-full w-full object-contain" />
          </span>
          Zomato
        </button>
        <button
          type="button"
          onClick={() => setIsCompareMode((prev) => !prev)}
          className={`flex h-12 min-w-40 items-center justify-center rounded-full border px-4 text-xs font-bold transition duration-200 ${isCompareMode
            ? "border-bd-tealDeep bg-bd-tealDeep text-white shadow-sm"
            : "border-bd-border bg-white text-bd-tealDeep hover:border-bd-teal"
          }`}
          aria-label="Compare Zomato and Swiggy analytics"
        >
          Compare
        </button>
      </div>

      {!isCompareMode && (
        <ProfitLossIndicator reference={selectedMonthReference} aggregator={aggregator} />
      )}

      {detailsLoading && (
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
        </div>
      )}

      {isCompareMode && selectedMonthReference?.compare && (
        <div className="space-y-4">
          <CompareGrossSaleCard data={selectedMonthReference} />
          <CompareTable
            aggregator={null}
            reference={selectedMonthReference}
            monthwiseReferenceReports={monthwiseRef}
          />
        </div>
      )}

      {!detailsLoading && !isCompareMode && (numberOfOrders || grossSales || commissionableValue || netDeductions || netAdditions || netPayout) && (
        <div className="space-y-5">
          {numberOfOrders && (
            <ExpandableTiles
              title="Total Number of Orders"
              totalAmount={String(numberOfOrders.value ?? 0)}
              data={getNumberOfOrdersData(numberOfOrders)}
              showRupeeIcon={false}
            />
          )}

          {grossSales && (
            <ExpandableTiles
              title="Gross Sales"
              totalAmount={String(grossSales.value ?? 0)}
              data={getGrossSalesData(grossSales)}
              showRupeeIcon={true}
              showPieChart={true}
            />
          )}

          {commissionableValue && (
            <ExpandableTiles
              title="Commissionable Value"
              totalAmount={String(commissionableValue.value ?? 0)}
              data={getCommissionableValueData(commissionableValue)}
              showRupeeIcon={true}
              showPieChart={true}
              pieColors={commissionablePieColors}
              noNeedtoShowDots={true}
            />
          )}

          {netDeductions && (
            <ExpandableTiles
              title="Net Deductions"
              totalAmount={String(netDeductions.value ?? 0)}
              data={getNetDeductionsData(netDeductions, aggregator === "swiggy" ? "Swiggy" : "Zomato")}
              showRupeeIcon={true}
              showPieChart={true}
            />
          )}

          {netAdditions && (
            <ExpandableTiles
              title="Net Additions"
              totalAmount={String(netAdditions.value ?? 0)}
              data={getNetAdditionsData(netAdditions)}
              showRupeeIcon={true}
              showPieChart={true}
            />
          )}

          {netPayout && (
            <ExpandableTiles
              title="Net Payout"
              totalAmount={String(netPayout.value ?? 0)}
              data={getNetPayoutData(netPayout)}
              showRupeeIcon={true}
              showPieChart={true}
            />
          )}

          <CompareTable
            aggregator={aggregator}
            reference={selectedMonthReference}
            monthwiseReferenceReports={monthwiseRef}
          />
        </div>
      )}

    </div>
  );
}

// Removed Appointment component as requested. Booking is handled directly via meetingLink redirect.

/* 6 — Growth tips */
type KeyStrategy = {
  icon: string;
  strategy: string;
  description: string;
};

type Service = {
  id: number;
  name: string;
  overview: string;
  key_strategies: KeyStrategy[];
};

function Grow() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // Enquiry Form states
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [enquiryComments, setEnquiryComments] = useState("");
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let activeRequest = true;
    axios.get("/v1/callbacks/services")
      .then(({ data }) => {
        if (activeRequest && data && data.success) {
          setServices(data.data || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching services:", getApiErrorMessage(err, "Failed to fetch services."));
      })
      .finally(() => {
        if (activeRequest) {
          setLoading(false);
        }
      });

    return () => {
      activeRequest = false;
    };
  }, []);

  const handleSendEnquiry = async () => {
    if (selectedServiceIds.length === 0) return;
    setEnquirySubmitting(true);
    try {
      const { data } = await axios.post("/v1/callbacks", {
        serviceIds: selectedServiceIds,
        comments: enquiryComments.trim()
      });
      if (data && data.success) {
        setToast({ message: "Enquiry submitted successfully! Our team will contact you shortly.", type: "success" });
        setShowEnquiryModal(false);
        setSelectedServiceIds([]);
        setEnquiryComments("");
      } else {
        setToast({ message: "Failed to submit enquiry.", type: "error" });
      }
    } catch (err) {
      console.error("Failed to submit enquiry:", getApiErrorMessage(err, "Failed to submit enquiry. Please try again."));
      setToast({ message: getApiErrorMessage(err, "Failed to submit enquiry. Please try again."), type: "error" });
    } finally {
      setEnquirySubmitting(false);
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      setSelectedServiceIds([]);
      setShowEnquiryModal(true);
    };
    window.addEventListener("open-grow-enquiry", handleOpen);
    return () => {
      window.removeEventListener("open-grow-enquiry", handleOpen);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="grow">
        {[1, 2, 3].map((n) => (
          <div key={n} className="animate-pulse rounded-3xl border border-bd-border bg-bd-section p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-neutral-200" />
              <div className="h-5 w-20 rounded-full bg-neutral-200" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-3/4 rounded bg-neutral-200" />
              <div className="h-4 w-full rounded bg-neutral-200" />
              <div className="h-4 w-5/6 rounded bg-neutral-200" />
            </div>
            <div className="h-10 w-full rounded bg-neutral-200/50 pt-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="grow" className="space-y-6">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => setSelectedService(service)}
            className="group relative cursor-pointer flex flex-col justify-between rounded-3xl border border-bd-border bg-bd-section p-6 shadow-sm hover:shadow-md hover:border-bd-teal/20 transition duration-300 ease-in-out"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bd-mint/10 text-bd-teal">
                  <span className="material-icons select-none text-2xl">
                    {service.key_strategies?.[0]?.icon?.trim() || "trending_up"}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-display text-lg font-extrabold text-bd-tealDeep group-hover:text-bd-teal transition duration-200">
                  {service.name}
                </h4>
                <p className="mt-1.5 text-xs text-bd-inkSoft leading-relaxed line-clamp-3">
                  {service.overview}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100/60 flex items-center justify-between text-bd-teal">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedService(service);
                }}
                className="text-xs font-bold uppercase tracking-wider group-hover:text-bd-tealLight transition duration-200"
              >
                Know More
              </button>
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        ))}
      </div>

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center gap-2 text-bd-teal mb-1.5">
                <Sparkles size={16} className="fill-bd-mint text-bd-mint animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-bd-teal">Service Strategy Details</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-bd-tealDeep pr-8">{selectedService.name}</h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4 sm:p-5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Overview</h4>
                <p className="text-sm text-bd-inkSoft leading-relaxed font-medium">{selectedService.overview}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 px-1">Key Strategies</h4>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {selectedService.key_strategies.map((strat, sidx) => (
                    <div
                      key={sidx}
                      className="flex gap-3.5 p-4 rounded-2xl border border-bd-border bg-white hover:border-bd-teal/30 hover:shadow-sm transition duration-200"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bd-mint/10 text-bd-teal">
                        <span className="material-icons select-none text-2xl">
                          {strat.icon?.trim() || "star"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-display text-sm font-bold text-bd-tealDeep">{strat.strategy}</h5>
                        <p className="text-xs text-bd-inkSoft leading-relaxed">{strat.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedService(null)}
                className="rounded-full bg-bd-tealDeep hover:bg-bd-tealLight px-6 py-2.5 text-sm font-bold text-white shadow-sm transition"
              >
                Close
              </button>
            </div>
            <button
              onClick={() => setSelectedService(null)}
              className="absolute right-6 top-6 p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 border border-neutral-200/60 transition duration-200"
              aria-label="Close details"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Transparent Enquiry Popup Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/20 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-bd-tealDeep">How can we help?</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 px-1">
                  Select Services (Multiple)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {services.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <label
                        key={service.id}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition duration-200 ${isSelected
                            ? "bg-bd-mint/15 border-bd-teal text-bd-tealDeep font-bold"
                            : "bg-white/40 border-neutral-200/60 hover:bg-white/60 text-bd-inkSoft hover:text-neutral-900"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                            } else {
                              setSelectedServiceIds([...selectedServiceIds, service.id]);
                            }
                          }}
                          className="h-4 w-4 rounded border-neutral-300 text-bd-teal focus:ring-bd-teal"
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                  Additional Comments
                </label>
                <textarea
                  value={enquiryComments}
                  onChange={(e) => setEnquiryComments(e.target.value)}
                  placeholder="Tell us more about your restaurant's goals, current problems, or requirements..."
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-200 bg-white/40 p-4 text-sm text-bd-inkSoft outline-none focus:border-bd-teal focus:ring-1 focus:ring-bd-teal placeholder-neutral-400/80 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowEnquiryModal(false);
                  setSelectedServiceIds([]);
                  setEnquiryComments("");
                }}
                className="flex-1 rounded-full border border-neutral-200/80 bg-white/60 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEnquiry}
                disabled={enquirySubmitting || selectedServiceIds.length === 0}
                className="flex-1 rounded-full bg-bd-tealDeep hover:bg-bd-tealLight py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enquirySubmitting ? "Submitting..." : "Submit Enquiry"}
              </button>
            </div>
            <button
              onClick={() => {
                setShowEnquiryModal(false);
                setSelectedServiceIds([]);
                setEnquiryComments("");
              }}
              className="absolute right-6 top-6 p-2 rounded-xl bg-white/60 hover:bg-white/90 text-neutral-500 hover:text-neutral-900 border border-neutral-200/60 transition duration-200"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Enquiry outcome Notification Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

/* 7 — Reports */
function Reports() {
  const [r, setR] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState("last_30_days");
  const gen = async () => {
    setBusy(true);
    try {
      const periodMultiplier = period === "last_7_days" ? 0.28 : period === "last_90_days" ? 2.8 : 1;
      const grossSales = Math.round(186000 * periodMultiplier);
      const deductions = Math.round(grossSales * 0.34);
      const netPayout = grossSales - deductions;
      const orders = Math.max(1, Math.round(1240 * periodMultiplier));
      setR({
        summary: {
          gross_sales: grossSales,
          net_payout: netPayout,
          deductions,
          orders,
          avg_order_value: Math.round(grossSales / orders),
          profit_margin_pct: Number(((netPayout / grossSales) * 100).toFixed(1)),
        },
        top_items: [
          { name: "Chicken Biriyani", orders: Math.round(310 * periodMultiplier), revenue: Math.round(55800 * periodMultiplier) },
          { name: "Al Faham", orders: Math.round(220 * periodMultiplier), revenue: Math.round(48400 * periodMultiplier) },
          { name: "Porotta Combo", orders: Math.round(180 * periodMultiplier), revenue: Math.round(21600 * periodMultiplier) },
        ],
        recommendations: [
          "Review platform ads weekly and pause campaigns below target ROAS.",
          "Keep high-volume combos visible during dinner peak hours.",
          "Compare net payout against ingredient cost before increasing discounts.",
        ],
      });
    } finally { setBusy(false); }
  };
  return (
    <div data-testid="reports">
      <div className="flex flex-wrap items-center gap-3">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-bd-border px-3 py-2 text-sm outline-none">
          <option value="last_7_days">Last 7 days</option>
          <option value="last_30_days">Last 30 days</option>
          <option value="last_90_days">Last 90 days</option>
        </select>
        <button onClick={gen} disabled={busy} className="btn-teal inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold">{busy ? "Generating…" : "Generate report"}<ArrowRight size={15} /></button>
      </div>
      {r && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Gross" value={`₹ ${r.summary.gross_sales.toLocaleString("en-IN")}`} />
            <Stat label="Net" value={`₹ ${r.summary.net_payout.toLocaleString("en-IN")}`} accent />
            <Stat label="Orders" value={r.summary.orders} />
            <Stat label="AOV" value={`₹ ${r.summary.avg_order_value}`} />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-bd-border bg-bd-section p-5">
              <p className="overline mb-3 text-bd-inkSoft">Top items</p>
              <ul className="space-y-2 text-sm">
                {r.top_items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-bd-border pb-2 last:border-0">
                    <span className="text-bd-tealDeep">{it.name}</span>
                    <span className="text-bd-inkSoft">{it.orders} · ₹ {it.revenue.toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-bd-tealDeep p-5">
              <p className="overline mb-3 text-bd-mint">Recommendations</p>
              <ul className="space-y-2 text-sm text-white/85">
                {r.recommendations.map((x, i) => (<li key={i} className="flex items-start gap-2"><Sparkles size={14} className="mt-0.5 text-bd-mint" />{x}</li>))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 8 — User Profile Section */
function ProfileSection() {
  const { user, updateUser } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  // Initials for avatar
  const initials = user.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  return (
    <div className="space-y-6" data-testid="profile-section">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-bd-border pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-bd-tealDeep font-display text-2xl font-black text-bd-mint shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="font-display text-2xl font-black text-bd-tealDeep">{user.name}</h2>
          </div>
        </div>
        <div>
          <button
            onClick={() => {
              setEditName(user.name || "");
              setEditEmail(user.email || "");
              setShowEditProfile(true);
            }}
            className="btn-teal inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-sm"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <div className="rounded-2xl border border-bd-border bg-bd-section p-6 space-y-4 shadow-sm">
          <h3 className="font-display text-lg font-extrabold text-bd-tealDeep mb-1">Contact Information</h3>

          <div className="space-y-3.5">
            <div>
              <p className="overline text-[10px] tracking-wider text-bd-inkSoft">Full Name</p>
              <p className="text-sm font-semibold text-bd-tealDeep mt-0.5">{user.name}</p>
            </div>

            <div className="border-t border-neutral-100/60 pt-3">
              <p className="overline text-[10px] tracking-wider text-bd-inkSoft">Email Address</p>
              <p className="text-sm font-semibold text-bd-tealDeep mt-0.5">{user.email}</p>
            </div>

            <div className="border-t border-neutral-100/60 pt-3">
              <p className="overline text-[10px] tracking-wider text-bd-inkSoft">Phone Number</p>
              <p className="text-sm font-semibold text-bd-tealDeep mt-0.5">{user.phone || "Not Provided"}</p>
            </div>
          </div>
        </div>

        {/* Associated Restaurants */}
        <div className="rounded-2xl border border-bd-border bg-bd-section p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100/60 pb-3 mb-1">
            <h3 className="font-display text-lg font-extrabold text-bd-tealDeep">Your Restaurants</h3>
            {user.restaurants && user.restaurants.length > 0 && (
              <Link
                href="/dashboard/restaurants"
                className="text-xs font-bold text-bd-teal hover:underline flex items-center gap-1"
              >
                View All &rarr;
              </Link>
            )}
          </div>

          {user.restaurants && user.restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.restaurants.map((rest) => (
                <Link
                  key={rest.id}
                  href={`/dashboard/add-restaurant?id=${rest.id}`}
                  className="flex items-center gap-3 rounded-xl border border-bd-border p-3 bg-white/40 hover:bg-bd-mintMuted/30 hover:border-bd-teal/20 transition duration-200"
                >
                  <div className="h-8 w-8 rounded-lg bg-bd-mintMuted flex items-center justify-center text-bd-tealDeep shrink-0">
                    <Store size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-bd-tealDeep truncate">{rest.name}</p>
                    {rest.location && <p className="text-[10px] text-bd-inkSoft truncate mt-0.5">{rest.location}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-bd-border p-6 text-center text-xs text-bd-inkSoft">
              No restaurants linked to your account.
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {showEditProfile && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-bd-tealDeep">Edit Profile</h3>
              <p className="text-xs text-bd-inkSoft">Update your name and email address.</p>
            </div>

            <div className="space-y-3.5">
              <label className="block">
                <span className="overline text-[10px] text-bd-inkSoft mb-1.5 block">Full Name</span>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-bd-border px-3.5 py-2.5 text-xs outline-none focus:border-bd-teal"
                />
              </label>

              <label className="block">
                <span className="overline text-[10px] text-bd-inkSoft mb-1.5 block">Email Address</span>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-bd-border px-3.5 py-2.5 text-xs outline-none focus:border-bd-teal"
                />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="flex-1 rounded-full border border-neutral-200 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editName.trim() && editEmail.trim()) {
                    updateUser({ name: editName.trim(), email: editEmail.trim() });
                    setShowEditProfile(false);
                  }
                }}
                className="flex-1 rounded-full bg-bd-tealDeep text-white py-2.5 text-xs font-bold shadow-sm transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* 9 — Support Tickets Section */
/* 9 — My Tickets Section */
type CallbackService = {
  id: number;
  name: string;
  overview: string;
  key_strategies: unknown[];
};

type CallbackTicket = {
  id: number;
  status: "active" | "completed" | "cancelled" | "rejected";
  comments: string;
  createdAt: string;
  services: CallbackService[];
};

function MyTickets() {
  const [callbacks, setCallbacks] = useState<CallbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCallbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/v1/callbacks?active=true&completed=true&cancelled=true&rejected=false&limit=10");
      if (data && data.success) {
        setCallbacks(data.data || []);
      } else {
        setError("Failed to fetch tickets");
      }
    } catch (err) {
      console.error(err);
      const axiosError = err as { response?: { data?: { error?: string; message?: string } } };
      const errMsg = axiosError.response?.data?.error || axiosError.response?.data?.message || "Failed to load tickets. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallbacks();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled": return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <button
          onClick={fetchCallbacks}
          className="btn-teal mt-4 rounded-xl px-4 py-2 text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tickets-section">
      <div className="flex items-center justify-between border-b border-bd-border pb-4">
        <div>
          <h2 className="text-sm font-semibold text-bd-inkSoft">Track and manage your requests</h2>
        </div>
      </div>

      {callbacks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bd-border p-8 text-center text-sm text-bd-inkSoft">
          No callback tickets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {callbacks.map((t) => {
            const subject = t.services && t.services.length > 0
              ? t.services.map((s) => s.name).join(", ")
              : "Callback Request";

            return (
              <div
                key={t.id}
                className="bg-bd-section border border-bd-border p-5 rounded-2xl transition duration-200 hover:shadow-md hover:border-neutral-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-bd-inkSoft tracking-wider">Ticket ID: #{t.id}</span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusStyle(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-bd-tealDeep mt-1.5 line-clamp-2">{subject}</h4>
                  <p className="text-xs text-bd-inkSoft mt-1.5 line-clamp-3 italic">
                    &ldquo;{t.comments || "No comments provided."}&rdquo;
                  </p>
                  {t.services && t.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {t.services.map((s) => (
                        <span key={s.id} className="bg-bd-mint/20 text-bd-tealDeep text-[9px] font-medium px-2 py-0.5 rounded border border-bd-mint/30">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end text-[10px] text-bd-inkSoft mt-4 pt-2.5 border-t border-neutral-100/60">
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TOOLS = [
  { key: "menu", title: "Menu Price Calculator", desc: "Cost + overhead + margin → suggested price.", icon: Calculator, C: MenuPriceCalc },
  { key: "food", title: "Food Cost Calculator", desc: "Coming soon.", icon: Receipt, C: () => null, locked: true },
  { key: "recipe", title: "Recipe Management", desc: "Save recipes with auto-priced suggestions.", icon: ChefHat, C: RecipeMgmt },
  { key: "soa", title: "Financial Analytics", desc: "Latest Analytics", icon: FileText, C: SoaAnalyser },
  { key: "appt", title: "Book Appointment", desc: "Schedule a session with a BizzDeck expert.", icon: CalendarCheck2, C: () => null },
  { key: "grow", title: "Grow Your Business", desc: "Curated, high-impact tactics for restaurants.", icon: TrendingUp, C: Grow },
  { key: "report", title: "Business Report", desc: "Generate a board-ready performance report.", icon: FileBarChart2, C: Reports },
  { key: "tickets", title: "My Tickets", desc: "Track and manage your support tickets and requests.", icon: Ticket, C: MyTickets },
  { key: "profile", title: "My Profile", desc: "View and manage your account details.", icon: UserCircle, C: ProfileSection },
];
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [active, setActive] = useState("menu");
  const [latestAnalyticsLabel, setLatestAnalyticsLabel] = useState("Latest Analytics");
  const [soaMonthOptions, setSoaMonthOptions] = useState<SoaMonthOption[]>([]);
  const [soaSelectedAnalysisId, setSoaSelectedAnalysisId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selected_restaurant");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);


  const restaurantList = useMemo(() => {
    return user?.restaurants || [];
  }, [user]);

  useEffect(() => {
    if (loading || !user) return;

    if (restaurantList.length > 0) {
      if (!selectedRest || !restaurantList.some(r => r.id === selectedRest.id)) {
        const defaultRest = restaurantList[0];
        setSelectedRest(defaultRest);
        localStorage.setItem("selected_restaurant", JSON.stringify(defaultRest));
      }
    } else {
      setSelectedRest(null);
      localStorage.removeItem("selected_restaurant");
    }
  }, [loading, user, restaurantList, selectedRest]);

  const handleSelectRestaurant = (r: Restaurant) => {
    setSelectedRest(r);
    localStorage.setItem("selected_restaurant", JSON.stringify(r));
    setDropdownOpen(false);
  };

  const [selectedRestPlan, setSelectedRestPlan] = useState<string | null>(null);
  const [selectedRestMeetingLink, setSelectedRestMeetingLink] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !selectedRest?.id) {
      if (!selectedRest?.id) {
        setSelectedRestPlan(null);
        setSelectedRestMeetingLink(null);
      }
      return;
    }

    setSelectedRestPlan(selectedRest.plan || null);
    setSelectedRestMeetingLink(selectedRest.meetingLink || null);

    if (selectedRest.plan && selectedRest.meetingLink !== undefined) {
      return;
    }

    let activeRequest = true;

    axios.get(`/v1/restaurants/${selectedRest.id}`, { timeout: 6000 })
      .then((res) => {
        if (activeRequest && res.data?.success && res.data?.data) {
          const plan = res.data.data.plan || null;
          const meetingLink = res.data.data.meetingLink || null;
          setSelectedRestPlan(plan);
          setSelectedRestMeetingLink(meetingLink);
          setSelectedRest((current) => {
            if (!current || current.id !== selectedRest.id) return current;
            const next = { ...current, plan: plan || undefined, meetingLink: meetingLink || undefined };
            localStorage.setItem("selected_restaurant", JSON.stringify(next));
            return next;
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching restaurant details:", getApiErrorMessage(err, "Failed to fetch restaurant details."));
      });

    return () => {
      activeRequest = false;
    };
  }, [loading, user, selectedRest?.id, selectedRest?.plan, selectedRest?.meetingLink]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const isNoRestaurant = restaurantList.length === 0;

  useEffect(() => {
    if (!loading && user) {
      const isRestaurantPlanFree = selectedRestPlan === "free";
      if (isNoRestaurant || isRestaurantPlanFree) {
        if (active !== "tickets" && active !== "profile") {
          setActive("profile");
        }
      }
    }
  }, [loading, user, isNoRestaurant, selectedRestPlan, active]);

  if (loading || !user) {
    return <div className="flex min-h-[100svh] items-center justify-center bg-bd-bg"><div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" /></div>;
  }

  const Active = TOOLS.find(t => t.key === active)!;
  const ActiveC = Active.C;
  const activeDescription = active === "soa" ? latestAnalyticsLabel : Active.desc;
  return (
    <div className="min-h-screen bg-bd-bg" data-testid="dashboard">
      <header className="sticky top-0 z-40 bd-glass border-b border-white/10">
        <div className="w-full flex items-center justify-between px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center"><img src="/assets/White@4x.png" alt="BizzDeck Logo" className="h-8 object-contain" /></Link>

            {restaurantList && (
              restaurantList.length === 0 ? (
                <Link
                  href="/dashboard/add-restaurant"
                  className="flex items-center gap-1.5 rounded-full border border-bd-mint/30 bg-bd-mint/10 px-3 py-1.5 text-xs font-bold text-bd-mint transition hover:bg-bd-mint/20"
                >
                  <Plus size={13} />
                  <span>Add Restaurant</span>
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    <Store size={16} className="text-bd-mint" />
                    <span className="max-w-[140px] truncate">{selectedRest?.name || "Select Restaurant"}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-white/10 bg-bd-tealDeep p-1.5 shadow-xl z-50">
                      <div className="max-h-[240px] overflow-y-auto pr-0.5 space-y-0.5">
                        {restaurantList.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleSelectRestaurant(r)}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${selectedRest?.id === r.id
                                ? "bg-bd-mint text-bd-tealDeep font-bold"
                                : "text-white/80 hover:bg-white/5 hover:text-white"
                              }`}
                          >
                            <Store size={12} />
                            <div className="truncate">
                              <p className="font-semibold truncate">{r.name}</p>
                              {r.location && <p className="text-[10px] opacity-70 truncate">{r.location}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/10 mt-1.5 pt-1.5">
                        <Link
                          href="/dashboard/add-restaurant"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-bd-mint hover:bg-white/5 transition"
                        >
                          <Plus size={12} />
                          <span>Add Restaurant</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-white/80 sm:inline">{user.name} · {user.email}</span>
            <span className="rounded-full bg-bd-mint px-2.5 py-1 text-[10px] font-bold uppercase text-bd-tealDeep">{user.plan}</span>
            <button onClick={() => setShowSignOutConfirm(true)} className="btn-outline-light inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"><LogOut size={13} /> Sign out</button>
          </div>
        </div>
      </header>

      <div className="w-full flex px-6 lg:px-8 py-8 gap-6 items-start">
        {/* Collapsible Left Sidebar (Modern & Minimal Card Panel) */}
        <aside
          className={`flex flex-col gap-1.5 shrink-0 border border-bd-border bg-bd-section rounded-3xl p-4 shadow-sm transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-[80px]" : "w-[240px] sm:w-[280px]"
            }`}
        >
          <div className="flex items-center justify-between mb-5 border-b border-neutral-100/60 pb-3.5 px-1">
            {!sidebarCollapsed && <span className="text-xs font-bold uppercase tracking-wider text-bd-inkSoft">Menus</span>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-xl bg-white border border-neutral-200/80 text-neutral-500 hover:text-neutral-950 shadow-sm hover:shadow transition duration-200 ${sidebarCollapsed ? "mx-auto" : ""
                }`}
              title={sidebarCollapsed ? "Expand Tools" : "Collapse Tools"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} className="stroke-[2.5]" /> : <ChevronLeft size={18} className="stroke-[2.5]" />}
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const on = t.key === active;
              const isRestaurantPlanFree = selectedRestPlan === "free";
              const isLocked = t.locked ||
                (isNoRestaurant && t.key !== "tickets" && t.key !== "profile") ||
                (isRestaurantPlanFree && t.key !== "tickets" && t.key !== "profile");
              return (
                <button
                  key={t.key}
                  disabled={isLocked}
                  onClick={() => {
                    if (!isLocked) {
                      if (t.key === "appt") {
                        if (selectedRestMeetingLink) {
                          window.open(selectedRestMeetingLink, "_blank");
                        } else {
                          setToast({ message: "No meeting link available for this restaurant.", type: "error" });
                        }
                      } else {
                        setActive(t.key);
                      }
                    }
                  }}
                  data-testid={`tool-${t.key}`}
                  className={`relative group flex items-center rounded-xl py-3 transition w-full text-[14px] ${sidebarCollapsed ? "justify-center px-0" : "px-3.5 text-left"
                    } ${isLocked
                      ? "opacity-50 cursor-not-allowed text-neutral-400"
                      : on
                        ? "bg-white text-bd-tealDeep font-semibold shadow-sm border border-neutral-200/20"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  title={sidebarCollapsed ? t.title : undefined}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${isLocked
                      ? "text-neutral-400"
                      : on
                        ? "text-bd-tealDeep"
                        : "text-neutral-400 group-hover:text-neutral-700"
                    }`}>
                    {isLocked ? <Lock size={16} /> : <Icon size={19} />}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="font-medium ml-3 truncate transition-opacity duration-200 block flex-1">
                      {t.title}
                    </span>
                  )}
                  {!sidebarCollapsed && isLocked && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-neutral-100 border border-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      {t.locked ? "Coming Soon" : "Locked"}
                    </span>
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-[76px] z-50 scale-0 group-hover:scale-100 transition-all origin-left duration-200 bg-bd-tealDeep text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                      {t.title} {t.locked ? "(Coming Soon)" : (t.key !== "tickets" && t.key !== "profile" && (isNoRestaurant || isRestaurantPlanFree)) ? "(Locked)" : ""}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 rounded-3xl border border-bd-border bg-bd-section p-6 sm:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-bd-tealDeep sm:text-4xl">{Active.title}</h1>
              <p className="mt-1 text-sm text-bd-inkSoft">{activeDescription}</p>
            </div>
            {active === "grow" && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-grow-enquiry"));
                }}
                className="shrink-0 self-start sm:self-center rounded-full bg-bd-tealDeep hover:bg-bd-tealLight px-6 py-2.5 text-xs font-bold text-white shadow-sm transition whitespace-nowrap animate-in fade-in slide-in-from-right-4 duration-300"
              >
                Send Enquiry
              </button>
            )}
            {active === "soa" && soaMonthOptions.length > 0 && (
              <div className="w-full sm:w-72">
                <label htmlFor="soa-month-select" className="block text-xs font-bold text-bd-tealDeep uppercase tracking-wider mb-2">
                  Select Statement Month
                </label>
                <div className="relative">
                  <select
                    id="soa-month-select"
                    data-testid="soa-month-select"
                    value={soaSelectedAnalysisId}
                    onChange={(e) => setSoaSelectedAnalysisId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-bd-border bg-white pl-4 pr-10 py-2.5 text-sm font-semibold text-bd-tealDeep outline-none focus:border-bd-teal focus:ring-1 focus:ring-bd-teal transition duration-200"
                  >
                    {soaMonthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-bd-inkSoft">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <ActiveC
            selectedRestaurant={selectedRest}
            onLatestAnalyticsLabel={setLatestAnalyticsLabel}
            selectedAnalysisId={active === "soa" ? soaSelectedAnalysisId : undefined}
            onSelectedAnalysisIdChange={active === "soa" ? setSoaSelectedAnalysisId : undefined}
            onMonthOptionsChange={active === "soa" ? setSoaMonthOptions : undefined}
          />
        </main>
      </div>

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-bd-tealDeep">Sign Out</h3>
              <p className="mt-1.5 text-xs text-bd-inkSoft leading-relaxed">
                Are you sure you want to sign out? You will need to log in again to access your restaurant tools.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 rounded-full border border-neutral-200 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowSignOutConfirm(false);
                  await logout();
                  router.replace("/");
                }}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-sm transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
