"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calculator, Receipt, ChefHat, FileText, CalendarCheck2,
  TrendingUp, FileBarChart2, LogOut, ArrowRight, Plus, Trash2,
  Upload, CheckCircle2, Sparkles, X, ChevronDown, Store,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth, Restaurant } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";

type Recipe = {
  id: string; name: string; serves: number;
  ingredients: { name: string; cost: number }[];
  per_serve_cost: number; suggested_price: number; target_margin_pct: number;
};

type SoaDecode = {
  id: string; filename: string;
  gross_sales: number; commission: number; advertising: number; taxes: number;
  net_payout: number; margin_pct: number; insights: string[];
};

type Tip = { title: string; category: string; impact: string; detail: string };

type Report = {
  summary: { gross_sales: number; net_payout: number; deductions: number; orders: number; avg_order_value: number; profit_margin_pct: number };
  top_items: { name: string; orders: number; revenue: number }[];
  recommendations: string[];
};

const Stat = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) => (
  <div className={`rounded-xl p-2 ${accent ? "bg-bd-mint" : "border border-bd-border"}`}>
    <p className="overline text-[9px] text-bd-inkSoft">{label}</p>
    <p className="font-display text-base font-extrabold text-bd-tealDeep">{value}</p>
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
        <p className="font-display text-5xl font-black tracking-tight">₹ {totals.c.toFixed(0)}</p>
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

/* 2 — Food Cost Calculator */
function FoodCostCalc() {
  const [items, setItems] = useState([
    { name: "", price: 0 },
  ]);
  const [sell, setSell] = useState(0);
  const total = items.reduce((s, i) => s + (parseFloat(String(i.price)) || 0), 0);
  const margin = sell > 0 ? ((sell - total) / sell) * 100 : 0;
  return (
    <div data-testid="food-calc">
      <div className="overflow-hidden rounded-2xl border border-bd-border">
        <table className="w-full text-sm">
          <thead className="bg-bd-mintMuted text-left text-[11px] uppercase tracking-wider text-bd-inkSoft">
            <tr><th className="px-3 py-2">Ingredient</th><th className="px-3 py-2">Cost (₹)</th><th /></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-bd-border">
                <td className="px-3 py-2"><input className="w-full bg-transparent outline-none" value={it.name} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></td>
                <td className="px-3 py-2"><input type="number" className="w-24 bg-transparent outline-none" value={it.price} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, price: parseFloat(e.target.value) || 0 } : x))} /></td>
                <td className="px-3 py-2 text-right"><button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-bd-inkSoft hover:text-red-600"><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => setItems([...items, { name: "", price: 0 }])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-bd-teal"><Plus size={14} /> Add ingredient</button>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-bd-border bg-white p-4">
          <p className="overline text-bd-inkSoft">Cost</p>
          <p className="font-display text-2xl font-extrabold text-bd-tealDeep">₹ {total.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-bd-mintMuted p-4">
          <span className="overline mb-1 block text-bd-teal">Selling price</span>
          <input type="number" value={sell} onChange={(e) => setSell(parseFloat(e.target.value) || 0)} className="w-full bg-transparent font-display text-2xl font-extrabold text-bd-tealDeep outline-none" />
        </div>
        <div className="rounded-2xl bg-bd-tealDeep p-4 text-white">
          <p className="overline text-bd-mint">Margin</p>
          <p className="font-display text-2xl font-extrabold">{margin.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

/* 3 — Recipe Management */
function RecipeMgmt() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [name, setName] = useState("");
  const [serves, setServes] = useState(1);
  const [ings, setIngs] = useState<{ name: string; cost: number | string }[]>([{ name: "", cost: 0 }]);
  const [margin, setMargin] = useState(65);
  const [busy, setBusy] = useState(false);

  const load = async () => { try { const { data } = await api.get("/premium/recipes"); setRecipes(data.recipes || []); } catch { /* ignore */ } };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post("/premium/recipes", {
        name, serves: Number(serves) || 1,
        ingredients: ings.map(i => ({ name: i.name, cost: parseFloat(String(i.cost)) || 0 })),
        target_margin_pct: margin,
      });
      setName(""); setServes(1); setIngs([{ name: "", cost: 0 }]); setMargin(65);
      await load();
    } finally { setBusy(false); }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5" data-testid="recipes">
      <form onSubmit={save} className="space-y-3 rounded-2xl border border-bd-border bg-white p-5 lg:col-span-2">
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
          <div key={r.id} className="rounded-2xl border border-bd-border bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-extrabold text-bd-tealDeep">{r.name}</p>
                <p className="text-xs text-bd-inkSoft">Serves {r.serves} · {r.ingredients?.length || 0} ingredients</p>
              </div>
              <button onClick={async () => { await api.delete(`/premium/recipes/${r.id}`); await load(); }} className="text-bd-inkSoft hover:text-red-600"><Trash2 size={15} /></button>
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

/* 4 — SOA Decoder */
function SoaDecoder() {
  const [r, setR] = useState<SoaDecode | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const onFile = async (f: File) => {
    setBusy(true); setErr("");
    try {
      const form = new FormData(); form.append("file", f);
      const { data } = await api.post("/premium/soa/decode", form);
      setR(data.decode);
    } catch { setErr("Could not decode that file. Try PDF, XLS or CSV."); }
    finally { setBusy(false); }
  };
  return (
    <div data-testid="soa-decode">
      <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-bd-teal/40 p-8 text-center hover:bg-bd-mintMuted/40">
        <input type="file" className="hidden" accept=".pdf,.csv,.xls,.xlsx" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <Upload size={28} className="mx-auto text-bd-teal" />
        <p className="mt-3 font-display text-lg font-extrabold text-bd-tealDeep">{busy ? "Decoding…" : "Drop or click to upload SOA"}</p>
        <p className="mt-1 text-xs text-bd-inkSoft">PDF · CSV · XLS — up to 25 MB</p>
      </label>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      {r && (
        <div className="mt-6 rounded-2xl border border-bd-border bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="overline text-bd-teal">{r.filename}</p>
              <p className="font-display text-3xl font-black text-bd-tealDeep">Net ₹ {r.net_payout.toLocaleString("en-IN")}</p>
            </div>
            <span className="rounded-full bg-bd-mint px-3 py-1 text-xs font-bold text-bd-tealDeep">Margin {r.margin_pct}%</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Gross" value={`₹ ${r.gross_sales.toLocaleString("en-IN")}`} />
            <Stat label="Commission" value={`₹ ${r.commission.toLocaleString("en-IN")}`} />
            <Stat label="Ads" value={`₹ ${r.advertising.toLocaleString("en-IN")}`} />
            <Stat label="Taxes" value={`₹ ${r.taxes.toLocaleString("en-IN")}`} />
          </div>
          <ul className="mt-5 space-y-2">
            {r.insights.map((t, i) => (<li key={i} className="flex items-start gap-2 text-sm"><Sparkles size={14} className="mt-0.5 text-bd-teal" />{t}</li>))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* 5 — Appointments */
function Appointment() {
  const [form, setForm] = useState({ topic: "Profitability review", date: "", notes: "", contact: "" });
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await api.post("/premium/appointments", form); setOk(true); } finally { setBusy(false); } };
  if (ok) return (
    <div className="rounded-2xl border border-bd-border bg-white p-8 text-center">
      <CheckCircle2 size={36} className="mx-auto text-bd-teal" />
      <p className="mt-3 font-display text-2xl font-extrabold text-bd-tealDeep">You&apos;re booked</p>
      <p className="mt-1 text-sm text-bd-inkSoft">An expert will confirm your slot on {form.date}.</p>
      <button onClick={() => { setOk(false); setForm({ topic: "Profitability review", date: "", notes: "", contact: "" }); }} className="mt-4 text-sm font-semibold text-bd-teal">Book another →</button>
    </div>
  );
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="appt">
      <label className="block sm:col-span-2"><span className="overline mb-1.5 block text-bd-inkSoft">Topic</span>
        <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="w-full rounded-xl border border-bd-border px-3 py-2.5 text-sm outline-none">
          {["Profitability review", "Menu reversal session", "Marketing & ads", "GST & compliance", "ORM & reputation"].map(t => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="block"><span className="overline mb-1.5 block text-bd-inkSoft">Preferred date</span>
        <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-bd-border px-3 py-2.5 text-sm outline-none" />
      </label>
      <label className="block"><span className="overline mb-1.5 block text-bd-inkSoft">Contact</span>
        <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full rounded-xl border border-bd-border px-3 py-2.5 text-sm outline-none" />
      </label>
      <label className="block sm:col-span-2"><span className="overline mb-1.5 block text-bd-inkSoft">Notes</span>
        <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-bd-border px-3 py-2.5 text-sm outline-none" />
      </label>
      <button type="submit" disabled={busy} className="btn-teal inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold sm:col-span-2">{busy ? "Booking…" : "Book appointment"}<ArrowRight size={15} /></button>
    </form>
  );
}

/* 6 — Growth tips */
function Grow() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [filter, setFilter] = useState("All");
  useEffect(() => { api.get("/premium/growth-tips").then(({ data }) => setTips(data.tips || [])); }, []);
  const cats = ["All", ...Array.from(new Set(tips.map(t => t.category)))];
  const filtered = filter === "All" ? tips : tips.filter(t => t.category === filter);
  return (
    <div data-testid="grow">
      <div className="mb-4 flex flex-wrap gap-2">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === c ? "bg-bd-tealDeep text-white" : "border-bd-border text-bd-inkSoft"}`}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((t, i) => (
          <div key={i} className="rounded-2xl border border-bd-border bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="overline text-bd-teal">{t.category}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-bd-tealDeep ${t.impact === "High" ? "bg-bd-mint" : "bg-bd-mintMuted"}`}>{t.impact}</span>
            </div>
            <p className="mt-3 font-display text-lg font-extrabold text-bd-tealDeep">{t.title}</p>
            <p className="mt-1 text-sm text-bd-inkSoft">{t.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 7 — Reports */
function Reports() {
  const [r, setR] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState("last_30_days");
  const gen = async () => { setBusy(true); try { const { data } = await api.post("/premium/reports/generate", { period }); setR(data.report); } finally { setBusy(false); } };
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
            <div className="rounded-2xl border border-bd-border bg-white p-5">
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

const TOOLS = [
  { key: "menu", title: "Menu Price Calculator", desc: "Cost + overhead + margin → suggested price.", icon: Calculator, C: MenuPriceCalc },
  { key: "food", title: "Food Cost Calculator", desc: "Track ingredient costs vs selling price.", icon: Receipt, C: FoodCostCalc },
  { key: "recipe", title: "Recipe Management", desc: "Save recipes with auto-priced suggestions.", icon: ChefHat, C: RecipeMgmt },
  { key: "soa", title: "Online SOA Decoder", desc: "Upload SOA, see net payout + hidden charges.", icon: FileText, C: SoaDecoder },
  { key: "appt", title: "Book Appointment", desc: "Schedule a session with a BizzDeck expert.", icon: CalendarCheck2, C: Appointment },
  { key: "grow", title: "Grow Your Business", desc: "Curated, high-impact tactics for restaurants.", icon: TrendingUp, C: Grow },
  { key: "report", title: "Business Report", desc: "Generate a board-ready performance report.", icon: FileBarChart2, C: Reports },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [active, setActive] = useState("menu");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const restaurantList = useMemo(() => {
    return user?.restaurants || [];
  }, [user]);

  useEffect(() => {
    if (restaurantList.length > 0 && !selectedRest) {
      setSelectedRest(restaurantList[0]);
    }
  }, [restaurantList, selectedRest]);

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

  if (loading || !user) {
    return <div className="flex min-h-[100svh] items-center justify-center bg-bd-bg"><div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" /></div>;
  }

  const Active = TOOLS.find(t => t.key === active)!;
  const ActiveC = Active.C;

  return (
    <div className="min-h-screen bg-bd-bg" data-testid="dashboard">
      <header className="sticky top-0 z-40 bd-glass border-b border-white/10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2"><Logo light /></Link>
            
            {restaurantList && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  <Store size={14} className="text-bd-mint" />
                  <span className="max-w-[120px] truncate">{selectedRest?.name || "Select Restaurant"}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-white/10 bg-bd-tealDeep p-1.5 shadow-xl z-50">
                    {restaurantList.length === 0 ? (
                      <div className="p-3 text-center text-xs text-white/60">No restaurants available</div>
                    ) : (
                      restaurantList.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setSelectedRest(r);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                            selectedRest?.id === r.id
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
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-white/80 sm:inline">{user.name} · {user.email}</span>
            <span className="rounded-full bg-bd-mint px-2.5 py-1 text-[10px] font-bold uppercase text-bd-tealDeep">{user.plan}</span>
            <button onClick={async () => { await logout(); router.replace("/"); }} className="btn-outline-light inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"><LogOut size={13} /> Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-1.5">
          <p className="overline mb-3 px-2 text-bd-inkSoft">Premium tools</p>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const on = t.key === active;
            return (
              <button key={t.key} onClick={() => setActive(t.key)} data-testid={`tool-${t.key}`} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${on ? "bg-bd-tealDeep text-white" : "text-bd-ink hover:bg-white"}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${on ? "bg-bd-mint" : "bg-bd-mintMuted"}`}>
                  <Icon size={15} className="text-bd-tealDeep" />
                </span>
                <span className="font-semibold">{t.title}</span>
              </button>
            );
          })}
        </aside>
        <main className="rounded-3xl border border-bd-border bg-white p-6 sm:p-8">
          <div className="mb-6">
            <p className="overline text-bd-teal">Premium</p>
            <h1 className="font-display text-3xl font-black tracking-tight text-bd-tealDeep sm:text-4xl">{Active.title}</h1>
            <p className="mt-1 text-sm text-bd-inkSoft">{Active.desc}</p>
          </div>
          <ActiveC />
        </main>
      </div>
    </div>
  );
}
