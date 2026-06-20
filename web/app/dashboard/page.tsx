"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calculator, Receipt, ChefHat, FileText, CalendarCheck2,
  TrendingUp, FileBarChart2, LogOut, ArrowRight, Plus, Trash2,
  Upload, CheckCircle2, Sparkles, X, ChevronDown, Store,
  ChevronLeft, ChevronRight, UserCircle, Ticket, Lock,
} from "lucide-react";
import { useAuth, Restaurant } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import axios from "axios";

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
    <p className="font-display text-base font-bold text-bd-tealDeep">{value}</p>
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
        <div className="mt-6 rounded-2xl border border-bd-border bg-bd-section p-6">
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
    <div className="rounded-2xl border border-bd-border bg-bd-section p-8 text-center">
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
          <div key={i} className="rounded-2xl border border-bd-border bg-bd-section p-5">
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
          <h3 className="font-display text-lg font-extrabold text-bd-tealDeep mb-1">Your Restaurants</h3>
          
          {user.restaurants && user.restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.restaurants.map((rest) => (
                <div key={rest.id} className="flex items-center gap-3 rounded-xl border border-bd-border p-3 bg-white/40">
                  <div className="h-8 w-8 rounded-lg bg-bd-mintMuted flex items-center justify-center text-bd-tealDeep shrink-0">
                    <Store size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-bd-tealDeep truncate">{rest.name}</p>
                    {rest.location && <p className="text-[10px] text-bd-inkSoft truncate mt-0.5">{rest.location}</p>}
                  </div>
                </div>
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
  { key: "soa", title: "Online SOA Decoder", desc: "Upload SOA, see net payout + hidden charges.", icon: FileText, C: SoaDecoder },
  { key: "appt", title: "Book Appointment", desc: "Schedule a session with a BizzDeck expert.", icon: CalendarCheck2, C: Appointment },
  { key: "grow", title: "Grow Your Business", desc: "Curated, high-impact tactics for restaurants.", icon: TrendingUp, C: Grow },
  { key: "report", title: "Business Report", desc: "Generate a board-ready performance report.", icon: FileBarChart2, C: Reports },
  { key: "tickets", title: "My Tickets", desc: "Track and manage your support tickets and requests.", icon: Ticket, C: MyTickets },
  { key: "profile", title: "My Profile", desc: "View and manage your account details.", icon: UserCircle, C: ProfileSection },
];
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [active, setActive] = useState("menu");
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

  const restaurantList = useMemo(() => {
    return user?.restaurants || [];
  }, [user]);

  useEffect(() => {
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
  }, [restaurantList, selectedRest]);

  const handleSelectRestaurant = (r: Restaurant) => {
    setSelectedRest(r);
    localStorage.setItem("selected_restaurant", JSON.stringify(r));
    setDropdownOpen(false);
  };

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
    if (!loading && user && isNoRestaurant) {
      if (active !== "tickets" && active !== "profile") {
        setActive("profile");
      }
    }
  }, [loading, user, isNoRestaurant, active]);

  if (loading || !user) {
    return <div className="flex min-h-[100svh] items-center justify-center bg-bd-bg"><div className="h-10 w-10 animate-spin rounded-full border-2 border-bd-border border-t-bd-teal" /></div>;
  }

  const Active = TOOLS.find(t => t.key === active)!;
  const ActiveC = Active.C;
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
          className={`flex flex-col gap-1.5 shrink-0 border border-bd-border bg-bd-section rounded-3xl p-4 shadow-sm transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "w-[80px]" : "w-[240px] sm:w-[280px]"
          }`}
        >
          <div className="flex items-center justify-between mb-5 border-b border-neutral-100/60 pb-3.5 px-1">
            {!sidebarCollapsed && <span className="text-xs font-bold uppercase tracking-wider text-bd-inkSoft">Menus</span>}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-xl bg-white border border-neutral-200/80 text-neutral-500 hover:text-neutral-950 shadow-sm hover:shadow transition duration-200 ${
                sidebarCollapsed ? "mx-auto" : ""
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
              const isLocked = t.locked || (isNoRestaurant && t.key !== "tickets" && t.key !== "profile");
              return (
                <button 
                  key={t.key} 
                  disabled={isLocked}
                  onClick={() => !isLocked && setActive(t.key)} 
                  data-testid={`tool-${t.key}`} 
                  className={`relative group flex items-center rounded-xl py-3 transition w-full text-[14px] ${
                    sidebarCollapsed ? "justify-center px-0" : "px-3.5 text-left"
                  } ${
                    isLocked
                      ? "opacity-50 cursor-not-allowed text-neutral-400"
                      : on 
                        ? "bg-white text-bd-tealDeep font-semibold shadow-sm border border-neutral-200/20" 
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                  title={sidebarCollapsed ? t.title : undefined}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${
                    isLocked 
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
                      {t.title} {t.locked ? "(Coming Soon)" : (isNoRestaurant && t.key !== "tickets" && t.key !== "profile") ? "(Locked)" : ""}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 rounded-3xl border border-bd-border bg-bd-section p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-bd-tealDeep sm:text-4xl">{Active.title}</h1>
            <p className="mt-1 text-sm text-bd-inkSoft">{Active.desc}</p>
          </div>
          <ActiveC />
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
    </div>
  );
}
