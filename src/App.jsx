import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ─────────────────────────────────────────
const SUPABASE_URL = "https://fsvlxosbbevzyvegbqry.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdmx4b3NiYmV2enl2ZWdicXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzQ2MjgsImV4cCI6MjA4OTA1MDYyOH0.AcnnB4QecNHEu3-N_VS6aPHrpt9kq464arjNc2DNugU";
const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

// Read from moe_data table
const sbRead = async (groupId, dataKey) => {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/moe_data?group_id=eq.${groupId}&data_key=eq.${dataKey}&select=data_value`, { headers: SB_HEADERS });
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows.length) return null;
    let val = rows[0].data_value;
    if (typeof val === "string") try { val = JSON.parse(val); } catch {}
    return val;
  } catch { return null; }
};

// Write to moe_data table (upsert)
const sbWrite = async (groupId, dataKey, dataValue) => {
  try {
    const existing = await fetch(`${SUPABASE_URL}/rest/v1/moe_data?group_id=eq.${groupId}&data_key=eq.${dataKey}&select=id`, { headers: SB_HEADERS });
    const rows = await existing.json();
    const body = { group_id: groupId, data_key: dataKey, data_value: JSON.stringify(dataValue), updated_at: new Date().toISOString() };
    if (rows && rows.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/moe_data?id=eq.${rows[0].id}`, { method: "PATCH", headers: SB_HEADERS, body: JSON.stringify(body) });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/moe_data`, { method: "POST", headers: SB_HEADERS, body: JSON.stringify(body) });
    }
    return true;
  } catch { return false; }
};

// ─── ICON SYSTEM ─────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    "grid": <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    "package": <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    "utensils": <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>,
    "clipboard": <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
    "calculator": <><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="11" x2="8" y2="11.01"/><line x1="12" y1="11" x2="12" y2="11.01"/><line x1="16" y1="11" x2="16" y2="11.01"/><line x1="8" y1="15" x2="8" y2="15.01"/><line x1="12" y1="15" x2="12" y2="15.01"/><line x1="8" y1="19" x2="8" y2="19.01"/><line x1="12" y1="19" x2="12" y2="19.01"/></>,
    "users": <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    "settings": <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    "bell": <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    "search": <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    "trending-up": <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    "arrow-right": <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    "logout": <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    "menu": <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  };
  return <svg {...s}>{paths[name]}</svg>;
};

// ─── OWNERSHQ BADGE LOGO ─────────────────────────────────────
const OwnersHQLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="46" cy="50" r="44" fill="none" stroke="#00e5ff" strokeWidth="3"/>
    <circle cx="46" cy="50" r="38" fill="none" stroke="#00e5ff" strokeWidth="0.5" opacity="0.2"/>
    <rect x="16" y="44" width="8" height="30" rx="3" fill="#00e5ff" opacity="0.35"/>
    <rect x="28" y="32" width="8" height="42" rx="3" fill="#00e5ff" opacity="0.55"/>
    <rect x="40" y="20" width="8" height="54" rx="3" fill="#00e5ff"/>
    <rect x="52" y="36" width="8" height="38" rx="3" fill="#00e5ff" opacity="0.6"/>
    <rect x="64" y="42" width="8" height="32" rx="3" fill="#00e5ff" opacity="0.35"/>
    <line x1="90" y1="50" x2="100" y2="50" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round"/>
    <line x1="95" y1="50" x2="95" y2="58" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// ─── NAV CONFIG ──────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Command Center", icon: "grid", section: "main" },
  { id: "moe", label: "MOE Inventory", icon: "package", section: "tools", status: "active" },
  { id: "menu", label: "Menu Builder", icon: "utensils", section: "tools", status: "active" },
  { id: "recipes", label: "Recipe Cards", icon: "clipboard", section: "tools", status: "active" },
  { id: "costing", label: "Prep & Menu Costing", icon: "calculator", section: "tools", status: "active" },
  { id: "staff", label: "Staff & Prep Log", icon: "users", section: "tools", status: "active" },
  { id: "pnl", label: "P&L Reports", icon: "trending-up", section: "tools", status: "active" },
  { id: "settings", label: "Settings", icon: "settings", section: "bottom" },
];

// ─── KPI CARD ────────────────────────────────────────────────
const KPICard = ({ icon, label, sublabel, value, subvalue, accent, delay = 0 }) => {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? `linear-gradient(135deg, ${accent}08 0%, ${accent}03 100%)` : "rgba(255,255,255,0.02)",
      border: `1px solid ${h ? accent + "25" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 14, padding: "20px 22px", transition: "all 0.3s ease",
      transform: h ? "translateY(-1px)" : "none", animation: `slideUp 0.45s ease ${delay}s both`, cursor: "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: accent, letterSpacing: 0.4 }}>{label}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{sublabel}</div>
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: "var(--primary)", letterSpacing: -0.8, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{subvalue}</div>
    </div>
  );
};

// ─── MODULE CARD ─────────────────────────────────────────────
const ModuleCard = ({ icon, name, desc, status, accent, onClick, delay = 0 }) => {
  const [h, setH] = useState(false);
  const statusMap = {
    healthy: { bg: "rgba(0,229,160,0.1)", color: "#00e5a0", text: "Healthy" },
    warning: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", text: "Needs Attention" },
  };
  const st = statusMap[status] || statusMap.healthy;
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      all: "unset", cursor: "pointer", display: "block", width: "100%",
      background: h ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
      border: `1px solid ${h ? accent + "30" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 14, padding: "20px 22px", transition: "all 0.3s ease",
      animation: `slideUp 0.45s ease ${delay}s both`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: accent + "10", border: `1px solid ${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
          <Icon name={icon} size={20} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, letterSpacing: 0.3 }}>{st.text}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--primary)", marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 12, fontWeight: 600, color: accent, opacity: h ? 1 : 0.6, transition: "opacity 0.2s" }}>
        Open <Icon name="arrow-right" size={14} />
      </div>
    </button>
  );
};

// ─── ACTIVITY FEED ───────────────────────────────────────────
const activities = [
  { dot: "#f59e0b", text: "Mozzarella inventory below reorder point — 12 lbs remaining", time: "2m ago" },
  { dot: "#00e5ff", text: "New catering inquiry: 5 trays Baked Ziti for Saturday", time: "18m ago" },
  { dot: "#00e5a0", text: "AM prep log submitted — all items completed", time: "1h ago" },
  { dot: "#a78bfa", text: "Spring Veggie Pizza added to Menu Builder", time: "3h ago" },
  { dot: "#60a5fa", text: "Weekly food cost report: 28.4% average", time: "5h ago" },
  { dot: "#00e5a0", text: "Recipe card created: Vodka Sauce (batch)", time: "8h ago" },
];

// ─── PLACEHOLDER VIEW ────────────────────────────────────────
const ModulePlaceholder = ({ mod }) => {
  const accents = { moe: "#00e5ff", menu: "#a78bfa", recipes: "#00e5a0", costing: "#f59e0b", staff: "#60a5fa", pnl: "#f472b6", settings: "#94a3b8" };
  const descs = {
    moe: "Track inventory levels, manage suppliers, automate ordering, and reduce waste across your kitchen.",
    menu: "Build your menu with categories, items, descriptions, pricing, and modifiers. Publish changes instantly.",
    recipes: "Create detailed recipe cards with ingredients, portions, step-by-step prep instructions, and photos.",
    costing: "Prep item and menu item food cost analysis, margins, and pricing optimization.",
    staff: "Manage prep logs, shift handoffs, task assignments, and team communication in one place.",
    pnl: "Weekly and monthly profit & loss reporting — revenue, COGS, labor, and operating expenses.",
    settings: "Account details, billing, team members, integrations, and notification preferences.",
  };
  const accent = accents[mod.id] || "#00e5ff";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, animation: "fadeIn 0.4s ease" }}>
      <div style={{ width: 72, height: 72, borderRadius: 18, background: accent + "08", border: `1px solid ${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, marginBottom: 20 }}>
        <Icon name={mod.icon} size={28} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)", marginBottom: 6 }}>{mod.label}</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", maxWidth: 380, lineHeight: 1.6 }}>{descs[mod.id]}</p>
      <button style={{
        marginTop: 24, padding: "10px 24px", borderRadius: 10, background: accent, color: "#080c16", border: "none",
        fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: `0 4px 20px ${accent}30`,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
      >Coming Soon</button>
    </div>
  );
};

// ─── INITIAL MENU DATA ───────────────────────────────────────
const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Appetizers", items: [
    { id: "item-1", name: "Garlic Knots", description: "House-made knots brushed with garlic butter and parsley", price: "6.99", foodCost: "1.10", ingredients: "dough, garlic, butter, parsley, parmesan", eightySixed: false, allergens: ["V"], seasonal: false, photo: null, modifiers: [], priceHistory: [{ price: "5.99", date: "2024-08" }, { price: "6.49", date: "2024-12" }, { price: "6.99", date: "2025-03" }] },
    { id: "item-2", name: "Fried Calamari", description: "", price: "12.99", foodCost: "3.50", ingredients: "calamari, flour, marinara", eightySixed: false, allergens: [], seasonal: false, photo: null, modifiers: [{ id: "m1", group: "Sauce", options: [{ name: "Marinara", upcharge: "" }, { name: "Fra Diavolo", upcharge: "1.00" }] }], priceHistory: [{ price: "11.99", date: "2024-06" }, { price: "12.99", date: "2025-01" }] },
  ]},
  { id: "cat-2", name: "Pizzas", items: [
    { id: "item-3", name: "Margherita", description: "San Marzano tomato sauce, fresh mozzarella, basil", price: "16.99", foodCost: "3.80", ingredients: "dough, san marzano tomatoes, fresh mozzarella, basil, olive oil", eightySixed: false, allergens: ["V"], seasonal: false, photo: null, modifiers: [{ id: "m2", group: "Size", options: [{ name: "Personal 10\"", upcharge: "" }, { name: "Large 18\"", upcharge: "6.00" }] }, { id: "m3", group: "Toppings", options: [{ name: "Pepperoni", upcharge: "2.50" }, { name: "Sausage", upcharge: "2.50" }, { name: "Mushrooms", upcharge: "2.00" }, { name: "Extra Cheese", upcharge: "2.00" }] }], priceHistory: [{ price: "14.99", date: "2024-01" }, { price: "15.99", date: "2024-09" }, { price: "16.99", date: "2025-02" }] },
    { id: "item-4", name: "Vodka Pie", description: "", price: "19.99", foodCost: "4.60", ingredients: "dough, vodka sauce, mozzarella, fresh ricotta, basil", eightySixed: false, allergens: [], seasonal: false, photo: null, modifiers: [{ id: "m4", group: "Size", options: [{ name: "Personal 10\"", upcharge: "" }, { name: "Large 18\"", upcharge: "6.00" }] }], priceHistory: [{ price: "18.99", date: "2024-06" }, { price: "19.99", date: "2025-01" }] },
  ]},
  { id: "cat-3", name: "Entrees", items: [] },
  { id: "cat-4", name: "Desserts", items: [] },
];

// ─── MOE INVENTORY (Mocked — will connect to live Supabase API) ──
const MOE_INVENTORY_MOCK = [
  { id: "ing-1", name: "Pizza Dough (ball)", vendor: "Sysco", purchasePrice: "24.99", unitsPerCase: 48, unitType: "each", costPerUnit: "0.52", category: "Dough", stock: 120, reorderAt: 40, source: "moe" },
  { id: "ing-2", name: "Mozzarella (shredded)", vendor: "Sysco", purchasePrice: "42.00", unitsPerCase: 4, unitType: "lb", costPerUnit: "0.66", category: "Dairy", stock: 28, reorderAt: 15, source: "moe" },
  { id: "ing-3", name: "San Marzano Tomatoes", vendor: "Sysco", purchasePrice: "21.48", unitsPerCase: 6, unitType: "28oz can", costPerUnit: "0.13", category: "Canned", stock: 18, reorderAt: 6, source: "moe" },
  { id: "ing-4", name: "Fresh Mozzarella", vendor: "Local Dairy", purchasePrice: "40.93", unitsPerCase: 1, unitType: "lb", costPerUnit: "2.56", category: "Dairy", stock: 12, reorderAt: 8, source: "moe" },
  { id: "ing-5", name: "Basil (fresh)", vendor: "Produce Co", purchasePrice: "15.95", unitsPerCase: 10, unitType: "bunch", costPerUnit: "1.60", category: "Produce", stock: 6, reorderAt: 3, source: "moe" },
  { id: "ing-6", name: "Extra Virgin Olive Oil", vendor: "Sysco", purchasePrice: "99.48", unitsPerCase: 6, unitType: "gallon", costPerUnit: "0.13", category: "Oils", stock: 4, reorderAt: 2, source: "moe" },
  { id: "ing-7", name: "Garlic (peeled)", vendor: "Sysco", purchasePrice: "27.87", unitsPerCase: 10, unitType: "lb", costPerUnit: "0.17", category: "Produce", stock: 15, reorderAt: 5, source: "moe" },
  { id: "ing-8", name: "Butter", vendor: "Sysco", purchasePrice: "68.69", unitsPerCase: 12, unitType: "lb", costPerUnit: "0.36", category: "Dairy", stock: 24, reorderAt: 8, source: "moe" },
  { id: "ing-9", name: "Parmesan (grated)", vendor: "Sysco", purchasePrice: "30.08", unitsPerCase: 10, unitType: "lb", costPerUnit: "0.19", category: "Dairy", stock: 10, reorderAt: 4, source: "moe" },
  { id: "ing-10", name: "Calamari (tubes & tentacles)", vendor: "Seafood Dist", purchasePrice: "63.49", unitsPerCase: 5.8, unitType: "lb", costPerUnit: "0.68", category: "Seafood", stock: 8, reorderAt: 5, source: "moe" },
  { id: "ing-11", name: "All Purpose Flour", vendor: "Sysco", purchasePrice: "25.98", unitsPerCase: 6, unitType: "5lb bag", costPerUnit: "0.14", category: "Dry Goods", stock: 30, reorderAt: 10, source: "moe" },
  { id: "ing-12", name: "Marinara Sauce", vendor: "Sysco", purchasePrice: "25.98", unitsPerCase: 6, unitType: "28oz can", costPerUnit: "0.15", category: "Canned", stock: 14, reorderAt: 6, source: "moe" },
  { id: "ing-13", name: "Vodka Sauce", vendor: "Sysco", purchasePrice: "32.00", unitsPerCase: 6, unitType: "28oz can", costPerUnit: "0.19", category: "Canned", stock: 10, reorderAt: 4, source: "moe" },
  { id: "ing-14", name: "Fresh Ricotta", vendor: "Local Dairy", purchasePrice: "25.00", unitsPerCase: 1, unitType: "3lb tub", costPerUnit: "0.52", category: "Dairy", stock: 6, reorderAt: 3, source: "moe" },
  { id: "ing-15", name: "Parsley (fresh)", vendor: "Produce Co", purchasePrice: "15.95", unitsPerCase: 10, unitType: "bunch", costPerUnit: "1.60", category: "Produce", stock: 5, reorderAt: 3, source: "moe" },
];

// Prep Items: batch recipes made from raw ingredients (e.g. pizza sauce, garlic butter)
const INITIAL_PREP_ITEMS = [
  { id: "prep-1", name: "Pizza Sauce (batch)", servingSize: 4, servingSizeUnit: "oz", totalServings: 12, ingredients: [
    { ingredientId: "ing-3", qty: 6, unit: "cans", note: "crushed by hand" },
    { ingredientId: "ing-6", qty: 2, unit: "oz", note: "" },
    { ingredientId: "ing-7", qty: 3, unit: "oz", note: "minced" },
  ], steps: ["Heat olive oil in large pot", "Sauté garlic until golden", "Add crushed San Marzano, season with salt", "Simmer 30 min on low, stir occasionally"] },
  { id: "prep-2", name: "Garlic Butter", servingSize: 1, servingSizeUnit: "oz", totalServings: 24, ingredients: [
    { ingredientId: "ing-8", qty: 24, unit: "oz", note: "softened" },
    { ingredientId: "ing-7", qty: 4, unit: "oz", note: "minced fine" },
    { ingredientId: "ing-15", qty: 2, unit: "oz", note: "chopped" },
  ], steps: ["Melt butter on low heat", "Add minced garlic, cook 2 min", "Stir in parsley, remove from heat", "Keep warm for service"] },
  { id: "prep-3", name: "Vodka Sauce (batch)", servingSize: 4, servingSizeUnit: "oz", totalServings: 10, ingredients: [
    { ingredientId: "ing-13", qty: 4, unit: "cans", note: "" },
    { ingredientId: "ing-6", qty: 2, unit: "oz", note: "" },
    { ingredientId: "ing-7", qty: 2, unit: "oz", note: "minced" },
    { ingredientId: "ing-14", qty: 8, unit: "oz", note: "stirred in at end" },
  ], steps: ["Heat olive oil, sauté garlic", "Add vodka sauce, simmer 15 min", "Stir in ricotta off heat", "Season to taste"] },
];

// Menu Recipes: final dishes that use prep items AND/OR raw ingredients
const INITIAL_RECIPES = [
  { id: "rec-1", name: "Garlic Knots (6pc)", menuItemId: "item-1", servings: 1, ingredients: [
    { type: "ingredient", refId: "ing-1", qty: 0.5, unit: "each", note: "half a dough ball" },
    { type: "prep", refId: "prep-2", qty: 1, unit: "serving", note: "garlic butter toss" },
    { type: "ingredient", refId: "ing-9", qty: 0.5, unit: "oz", note: "dusted on top" },
  ], steps: ["Portion dough into 6 pieces", "Tie each piece into a knot", "Bake at 475°F for 8-10 min", "Toss in garlic butter, top with parm"] },
  { id: "rec-2", name: "Margherita Pizza", menuItemId: "item-3", servings: 1, ingredients: [
    { type: "ingredient", refId: "ing-1", qty: 1, unit: "each", note: "" },
    { type: "prep", refId: "prep-1", qty: 1, unit: "serving", note: "pizza sauce" },
    { type: "ingredient", refId: "ing-4", qty: 4, unit: "oz", note: "sliced" },
    { type: "ingredient", refId: "ing-5", qty: 0.25, unit: "oz", note: "fresh leaves" },
    { type: "ingredient", refId: "ing-6", qty: 0.5, unit: "oz", note: "drizzle" },
  ], steps: ["Stretch dough to 18\"", "Spread pizza sauce", "Lay fresh mozz slices", "Bake at 550°F for 6-8 min", "Top with basil and olive oil"] },
  { id: "rec-3", name: "Vodka Pie", menuItemId: "item-4", servings: 1, ingredients: [
    { type: "ingredient", refId: "ing-1", qty: 1, unit: "each", note: "" },
    { type: "prep", refId: "prep-3", qty: 1, unit: "serving", note: "vodka sauce" },
    { type: "ingredient", refId: "ing-2", qty: 6, unit: "oz", note: "shredded" },
    { type: "ingredient", refId: "ing-14", qty: 3, unit: "oz", note: "dollops" },
    { type: "ingredient", refId: "ing-5", qty: 0.25, unit: "oz", note: "garnish" },
  ], steps: ["Stretch dough to 18\"", "Spread vodka sauce", "Top with shredded mozz and ricotta dollops", "Bake at 550°F for 6-8 min", "Garnish with basil"] },
];
const ALLERGENS = ["GF", "V", "VG", "DF", "NF"];
const ALLERGEN_LABELS = { GF: "Gluten-Free", V: "Vegetarian", VG: "Vegan", DF: "Dairy-Free", NF: "Nut-Free" };
const ALLERGEN_COLORS = { GF: "#f59e0b", V: "#00e5a0", VG: "#00e5a0", DF: "#60a5fa", NF: "#f472b6" };

function MenuBuilder({ categories, setCategories }) {
  const [selectedCat, setSelectedCat] = useState("cat-1");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", ingredients: "", foodCost: "" });
  const [aiLoading, setAiLoading] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [uploadMode, setUploadMode] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [extractedMenu, setExtractedMenu] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [autoGenForm, setAutoGenForm] = useState({ cuisine: "Italian-American", concept: "Neighborhood pizzeria, family-friendly, classic with modern twists", size: "medium (4-5 categories)" });
  const [editTab, setEditTab] = useState("details");
  const [showPreview, setShowPreview] = useState(false);
  const [menuStyle, setMenuStyle] = useState("classic"); // classic | modern | minimal

  const currentCat = categories.find(c => c.id === selectedCat);

  // ── AI ──
  const callAI = async (prompt, key, mt = 1000) => {
    setAiLoading(p => ({ ...p, [key]: true }));
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: mt, messages: [{ role: "user", content: prompt }] }) });
      const d = await r.json(); setAiSuggestions(p => ({ ...p, [key]: (d.content?.map(b => b.type === "text" ? b.text : "").join("") || "").trim() }));
    } catch { setAiSuggestions(p => ({ ...p, [key]: "Error. Try again." })); }
    setAiLoading(p => ({ ...p, [key]: false }));
  };

  // ── Upload ──
  const handleMenuUpload = async (file) => {
    setAiLoading(p => ({ ...p, upload: true })); setUploadMode(true); setExtractedMenu(null);
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      const isPdf = file.type === "application/pdf";
      const content = [{ type: isPdf ? "document" : "image", source: { type: "base64", media_type: isPdf ? "application/pdf" : file.type, data: b64 } }, { type: "text", text: `Extract ALL menu items. Organize into categories. For each: name, description ("" if none), price (numbers only, "" if none). ONLY valid JSON: {"categories":[{"name":"...","items":[{"name":"...","description":"...","price":"..."}]}]}` }];
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content }] }) });
      const d = await r.json(); const t = d.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
      setExtractedMenu(JSON.parse(t.replace(/```json|```/g, "").trim()));
    } catch { setExtractedMenu({ error: "Could not extract. Try a clearer image or PDF." }); }
    setAiLoading(p => ({ ...p, upload: false }));
  };
  const importExtractedMenu = () => {
    if (!extractedMenu?.categories) return;
    const nc = extractedMenu.categories.map((c, ci) => ({ id: `ci-${Date.now()}-${ci}`, name: c.name, items: c.items.map((it, ii) => ({ id: `ii-${Date.now()}-${ci}-${ii}`, name: it.name, description: it.description || "", price: it.price || "", foodCost: "", ingredients: "", eightySixed: false, allergens: [], seasonal: false, photo: null, modifiers: [], priceHistory: it.price ? [{ price: it.price, date: new Date().toISOString().slice(0, 7) }] : [] })) }));
    setCategories(p => [...p, ...nc]); setExtractedMenu(null); setUploadMode(false); setUploadPreview(null);
    if (nc.length) setSelectedCat(nc[0].id);
  };

  // ── AI Features ──
  const generateDescription = (item) => callAI(`Menu copywriter for Italian-American pizzeria in Queens NYC. Short appetizing description (1-2 sentences, under 20 words) for: ${item.name}. Ingredients: ${item.ingredients || "not specified"}. Category: ${currentCat?.name}. Just the description, no quotes.`, `desc-${item.id}`);
  const suggestPrice = (item) => callAI(`Optimal menu price for ${item.name} at Italian-American pizzeria in Queens NYC. Food Cost: $${item.foodCost || "?"}. Target 28-32%. ONLY: {"price":"17.99","reasoning":"reason"} No markdown.`, `price-${item.id}`);
  const suggestNames = (item) => callAI(`3 creative names for ${item.name} (${item.ingredients || ""}). NYC Italian-American vibe. ONLY: [{"name":"...","why":"reason"}] No markdown.`, `names-${item.id}`);
  const suggestPlacement = () => { const all = categories.flatMap(c => c.items.filter(i => !i.eightySixed).map(i => `- ${i.name} (${c.name}) Cost:$${i.foodCost||"?"} Price:$${i.price||"?"}`)).join("\n"); callAI(`Menu engineering: rank items by optimal placement. High-margin in "sweet spots". Items:\n${all}\nPlain text by category, 2-3 sentences each.`, "placement"); };

  // ── Phase 2 AI ──
  const bulkDescriptions = async () => {
    const itemsNeed = categories.flatMap(c => c.items.filter(i => !i.description && !i.eightySixed).map(i => ({ ...i, catName: c.name })));
    if (!itemsNeed.length) { setAiSuggestions(p => ({ ...p, bulk: "All items already have descriptions!" })); return; }
    setAiLoading(p => ({ ...p, bulk: true }));
    try {
      const list = itemsNeed.map(i => `- ID:${i.id} | Name:${i.name} | Category:${i.catName} | Ingredients:${i.ingredients || "not specified"}`).join("\n");
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: `Menu copywriter for Italian-American pizzeria in Queens NYC. Write short appetizing descriptions (1-2 sentences, under 20 words each) for ALL these items. Respond ONLY with JSON array: [{"id":"item-id","description":"..."}]. No markdown.\n\nItems:\n${list}` }] }) });
      const d = await r.json(); const t = (d.content?.map(b => b.type === "text" ? b.text : "").join("") || "").trim();
      const descs = JSON.parse(t.replace(/```json|```/g, "").trim());
      setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => { const m = descs.find(d => d.id === i.id); return m ? { ...i, description: m.description } : i; }) })));
      setAiSuggestions(p => ({ ...p, bulk: `Generated descriptions for ${descs.length} items.` }));
    } catch { setAiSuggestions(p => ({ ...p, bulk: "Error. Try again." })); }
    setAiLoading(p => ({ ...p, bulk: false }));
  };
  const menuAudit = () => { const all = categories.flatMap(c => c.items.filter(i => !i.eightySixed).map(i => `- ${i.name} (${c.name}) | Desc: "${i.description || "MISSING"}" | Price: $${i.price || "MISSING"} | Cost: $${i.foodCost || "MISSING"}`)).join("\n"); callAI(`Menu psychology consultant. Audit this menu. Check: missing descriptions, weak names, pricing issues (too round, items too close in price), missing costs, rename opportunities. Sections: CRITICAL, WARNING, TIPS. Be specific, name items.\n\nItems:\n${all}`, "audit", 2000); };
  const competitorPricing = () => { const all = categories.flatMap(c => c.items.filter(i => !i.eightySixed && i.price).map(i => `- ${i.name} ($${i.price}) [${c.name}]`)).join("\n"); callAI(`Compare these prices to typical Italian-American pizzeria in Queens/Brooklyn NYC (2024-2025). For each: LOW, FAIR, or HIGH. ONLY JSON: [{"name":"...","currentPrice":"...","marketRange":"low - high","verdict":"LOW|FAIR|HIGH","suggestion":"note"}]. No markdown.\n\nItems:\n${all}`, "competitor", 2000); };
  const autoGenerateMenu = () => { setAiSuggestions(p => ({ ...p, autogenPrompt: true })); };
  const executeAutoGenerate = (cuisine, concept, size) => { callAI(`Generate complete ${size} menu for ${cuisine} restaurant. Concept: ${concept}. ONLY JSON: {"categories":[{"name":"...","items":[{"name":"Creative Name","description":"1-2 sentences","price":"15.99","ingredients":"key ingredients"}]}]}. 3-6 items per category. Realistic Queens/Brooklyn NYC prices. No markdown.`, "autogen", 3000); };

  // ── CRUD ──
  const updateItem = (id, f, v) => setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === id ? { ...i, [f]: v } : i) })));
  const addCategory = () => { if (!newCatName.trim()) return; const id = `c-${Date.now()}`; setCategories(p => [...p, { id, name: newCatName.trim(), items: [] }]); setNewCatName(""); setShowAddCat(false); setSelectedCat(id); };
  const deleteCategory = (id) => { setCategories(p => p.filter(c => c.id !== id)); if (selectedCat === id) { const rest = categories.filter(c => c.id !== id); setSelectedCat(rest[0]?.id || ""); } };
  const addNewItem = () => { if (!newItem.name.trim()) return; const id = `i-${Date.now()}`; setCategories(cs => cs.map(c => c.id === selectedCat ? { ...c, items: [...c.items, { id, name: newItem.name, description: "", price: "", foodCost: newItem.foodCost, ingredients: newItem.ingredients, eightySixed: false, allergens: [], seasonal: false, photo: null, modifiers: [], priceHistory: [] }] } : c)); setNewItem({ name: "", ingredients: "", foodCost: "" }); setShowAddItem(false); setSelectedItem(id); };
  const deleteItem = (id) => { setCategories(cs => cs.map(c => ({ ...c, items: c.items.filter(i => i.id !== id) }))); if (selectedItem === id) setSelectedItem(null); };
  const applyAi = (id, f, v) => { updateItem(id, f, v); setAiSuggestions(p => { const n = { ...p }; delete n[`${f === "description" ? "desc" : f === "price" ? "price" : "names"}-${id}`]; return n; }); };
  const toggle86 = (id) => setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === id ? { ...i, eightySixed: !i.eightySixed } : i) })));
  const toggleAllergen = (id, tag) => setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => { if (i.id !== id) return i; const has = (i.allergens||[]).includes(tag); return { ...i, allergens: has ? i.allergens.filter(a => a !== tag) : [...(i.allergens||[]), tag] }; }) })));
  const handleDrop = (targetId) => { if (!dragItem || dragItem === targetId) { setDragItem(null); return; } setCategories(cs => cs.map(c => { if (c.id !== selectedCat) return c; const items = [...c.items]; const fi = items.findIndex(i => i.id === dragItem); const ti = items.findIndex(i => i.id === targetId); if (fi < 0 || ti < 0) return c; const [m] = items.splice(fi, 1); items.splice(ti, 0, m); return { ...c, items }; })); setDragItem(null); };
  const moveItemTo = (id, catId) => { let mv = null; setCategories(cs => { const up = cs.map(c => { const f = c.items.find(i => i.id === id); if (f) mv = f; return { ...c, items: c.items.filter(i => i.id !== id) }; }); return up.map(c => c.id === catId && mv ? { ...c, items: [...c.items, mv] } : c); }); setCtxMenu(null); };
  const duplicateItemTo = (id, catId) => { let src = null; categories.forEach(c => { const f = c.items.find(i => i.id === id); if (f) src = f; }); if (!src) return; setCategories(cs => cs.map(c => c.id === catId ? { ...c, items: [...c.items, { ...src, id: `d-${Date.now()}` }] } : c)); setCtxMenu(null); };

  // ── Phase 3: Modifiers ──
  const addModifierGroup = (itemId) => {
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === itemId ? { ...i, modifiers: [...(i.modifiers||[]), { id: `mg-${Date.now()}`, group: "", options: [{ name: "", upcharge: "" }] }] } : i) })));
  };
  const updateModifierGroup = (itemId, modId, field, value) => {
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === itemId ? { ...i, modifiers: (i.modifiers||[]).map(m => m.id === modId ? { ...m, [field]: value } : m) } : i) })));
  };
  const deleteModifierGroup = (itemId, modId) => {
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === itemId ? { ...i, modifiers: (i.modifiers||[]).filter(m => m.id !== modId) } : i) })));
  };
  const addModifierOption = (itemId, modId) => {
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === itemId ? { ...i, modifiers: (i.modifiers||[]).map(m => m.id === modId ? { ...m, options: [...m.options, { name: "", upcharge: "" }] } : m) } : i) })));
  };
  const updateModifierOption = (itemId, modId, optIdx, field, value) => {
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === itemId ? { ...i, modifiers: (i.modifiers||[]).map(m => m.id === modId ? { ...m, options: m.options.map((o, oi) => oi === optIdx ? { ...o, [field]: value } : o) } : m) } : i) })));
  };
  const deleteModifierOption = (itemId, modId, optIdx) => {
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => i.id === itemId ? { ...i, modifiers: (i.modifiers||[]).map(m => m.id === modId ? { ...m, options: m.options.filter((_, oi) => oi !== optIdx) } : m) } : i) })));
  };

  // ── Phase 3: Price History ──
  const logPriceChange = (itemId, newPrice) => {
    const dateStr = new Date().toISOString().slice(0, 7);
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => {
      if (i.id !== itemId) return i;
      const hist = [...(i.priceHistory || [])];
      if (hist.length === 0 || hist[hist.length - 1].price !== newPrice) {
        hist.push({ price: newPrice, date: dateStr });
      }
      return { ...i, price: newPrice, priceHistory: hist };
    }) })));
  };

  // ── Phase 3: Photo ──
  const handlePhotoUpload = (itemId, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateItem(itemId, "photo", url);
  };

  // ── Styles ──
  const IS = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "var(--primary)", fontSize: 13, fontFamily: "inherit", outline: "none" };
  const BS = (c) => ({ padding: "7px 14px", borderRadius: 8, border: "none", background: c, color: "#080c16", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });
  const AI = { padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 };
  const CMI = { all: "unset", cursor: "pointer", display: "block", width: "100%", padding: "7px 12px", borderRadius: 6, fontSize: 12, color: "var(--secondary)", transition: "background 0.15s" };
  const TAB = (active) => ({ all: "unset", cursor: "pointer", padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: "inherit", background: active ? "rgba(0,229,255,0.1)" : "transparent", color: active ? "#00e5ff" : "var(--muted)", border: active ? "1px solid rgba(0,229,255,0.2)" : "1px solid transparent", transition: "all 0.2s" });

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }} onClick={() => ctxMenu && setCtxMenu(null)}>
      {/* ── TOP BAR ──────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label style={{ ...AI, padding: "8px 14px", fontSize: 12, cursor: "pointer", background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.3)", color: "#00e5ff" }}>
            <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null); handleMenuUpload(f); } e.target.value = ""; }} />
            {aiLoading.upload ? "Extracting..." : "📄 Upload Menu"}
          </label>
          <button onClick={bulkDescriptions} disabled={aiLoading.bulk} style={{ ...AI, padding: "8px 14px", fontSize: 12 }}>{aiLoading.bulk ? "Writing..." : "✨ Bulk Descriptions"}</button>
          <button onClick={menuAudit} disabled={aiLoading.audit} style={{ ...AI, padding: "8px 14px", fontSize: 12 }}>{aiLoading.audit ? "Auditing..." : "🔍 Menu Audit"}</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={competitorPricing} disabled={aiLoading.competitor} style={{ ...AI, padding: "8px 14px", fontSize: 12 }}>{aiLoading.competitor ? "Comparing..." : "💲 Competitor Pricing"}</button>
          <button onClick={autoGenerateMenu} style={{ ...AI, padding: "8px 14px", fontSize: 12, background: "rgba(0,229,160,0.08)", borderColor: "rgba(0,229,160,0.3)", color: "#00e5a0" }}>🧠 Auto-Generate Menu</button>
          <button onClick={suggestPlacement} disabled={aiLoading.placement} style={{ ...AI, padding: "8px 14px", fontSize: 12 }}>{aiLoading.placement ? "..." : "📐 Placement"}</button>
          <button onClick={() => setShowPreview(true)} style={{ ...AI, padding: "8px 14px", fontSize: 12, background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" }}>👁 Preview & Export</button>
        </div>
      </div>

      {/* ── MENU PREVIEW MODAL ───────────── */}
      {showPreview && <MenuPreview categories={categories} menuStyle={menuStyle} setMenuStyle={setMenuStyle} onClose={() => setShowPreview(false)} />}

      {/* ── AI RESULT PANELS (same as Phase 2) ── */}
      {aiSuggestions.bulk && <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 12, padding: "14px 20px", marginBottom: 14, animation: "slideUp 0.3s ease" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa" }}>✨ Bulk Descriptions</span><button onClick={() => setAiSuggestions(p => { const n = { ...p }; delete n.bulk; return n; })} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>dismiss</button></div><p style={{ fontSize: 12.5, color: "var(--secondary)", marginTop: 6 }}>{aiSuggestions.bulk}</p></div>}
      {aiSuggestions.audit && <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 14, animation: "slideUp 0.3s ease" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>🔍 Menu Audit</span><button onClick={() => setAiSuggestions(p => { const n = { ...p }; delete n.audit; return n; })} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>dismiss</button></div><p style={{ fontSize: 12.5, color: "var(--secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiSuggestions.audit}</p></div>}
      {aiSuggestions.competitor && <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 14, animation: "slideUp 0.3s ease" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa" }}>💲 Competitor Pricing</span><button onClick={() => setAiSuggestions(p => { const n = { ...p }; delete n.competitor; return n; })} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>dismiss</button></div>{(() => { try { const items = JSON.parse(aiSuggestions.competitor.replace(/```json|```/g, "").trim()); const vc = { LOW: "#00e5a0", FAIR: "#60a5fa", HIGH: "#f59e0b" }; return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{items.map((it, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}><span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--primary)", flex: 1 }}>{it.name}</span><span style={{ fontSize: 12, color: "var(--muted)" }}>${it.currentPrice}</span><span style={{ fontSize: 11, color: "var(--muted)" }}>{it.marketRange}</span><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: (vc[it.verdict] || "#888") + "15", color: vc[it.verdict] || "#888" }}>{it.verdict}</span><span style={{ fontSize: 11, color: "var(--secondary)", maxWidth: 180 }}>{it.suggestion}</span></div>)}</div>; } catch { return <p style={{ fontSize: 12.5, color: "var(--secondary)", whiteSpace: "pre-wrap" }}>{aiSuggestions.competitor}</p>; } })()}</div>}
      {aiSuggestions.autogenPrompt && !aiSuggestions.autogen && <div style={{ background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 14, padding: "20px 24px", marginBottom: 14, animation: "slideUp 0.3s ease" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><span style={{ fontSize: 14, fontWeight: 600, color: "#00e5a0" }}>🧠 Auto-Generate Menu</span><button onClick={() => setAiSuggestions(p => { const n = { ...p }; delete n.autogenPrompt; return n; })} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>close</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}><div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Cuisine</label><input value={autoGenForm.cuisine} onChange={e => setAutoGenForm(p => ({ ...p, cuisine: e.target.value }))} style={IS}/></div><div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Concept</label><input value={autoGenForm.concept} onChange={e => setAutoGenForm(p => ({ ...p, concept: e.target.value }))} style={IS}/></div><div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Size</label><select value={autoGenForm.size} onChange={e => setAutoGenForm(p => ({ ...p, size: e.target.value }))} style={{ ...IS, cursor: "pointer" }}><option value="small (2-3 categories)">Small</option><option value="medium (4-5 categories)">Medium</option><option value="large (6-8 categories)">Large</option></select></div></div><button onClick={() => { executeAutoGenerate(autoGenForm.cuisine, autoGenForm.concept, autoGenForm.size); setAiSuggestions(p => { const n = { ...p }; delete n.autogenPrompt; return n; }); }} style={{ ...BS("#00e5a0"), padding: "10px 24px", fontSize: 13 }}>Generate Full Menu</button></div>}
      {aiLoading.autogen && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0", marginBottom: 14 }}><div style={{ width: 20, height: 20, border: "2px solid rgba(0,229,160,0.2)", borderTop: "2px solid #00e5a0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/><span style={{ fontSize: 13, color: "var(--secondary)" }}>Building your menu...</span></div>}
      {aiSuggestions.autogen && <div style={{ background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 14, padding: "20px 24px", marginBottom: 14, animation: "slideUp 0.3s ease" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 14, fontWeight: 600, color: "#00e5a0" }}>🧠 Generated Menu</span><button onClick={() => setAiSuggestions(p => { const n = { ...p }; delete n.autogen; return n; })} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>dismiss</button></div>{(() => { try { const menu = JSON.parse(aiSuggestions.autogen.replace(/```json|```/g, "").trim()); const tot = menu.categories.reduce((s, c) => s + c.items.length, 0); const mkCats = () => menu.categories.map((c, ci) => ({ id: `ag-${Date.now()}-${ci}`, name: c.name, items: c.items.map((it, ii) => ({ id: `agi-${Date.now()}-${ci}-${ii}`, name: it.name, description: it.description || "", price: it.price || "", foodCost: "", ingredients: it.ingredients || "", eightySixed: false, allergens: [], seasonal: false, photo: null, modifiers: [], priceHistory: it.price ? [{ price: it.price, date: new Date().toISOString().slice(0, 7) }] : [] })) })); return <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{menu.categories.length} categories, {tot} items</div><div style={{ maxHeight: 280, overflow: "auto", marginBottom: 16 }}>{menu.categories.map((c, ci) => <div key={ci} style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: "#00e5a0", marginBottom: 4, textTransform: "uppercase" }}>{c.name}</div>{c.items.map((it, ii) => <div key={ii} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><span style={{ flex: 1, fontSize: 12.5, color: "var(--secondary)" }}>{it.name}</span><span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--primary)" }}>${it.price}</span></div>)}</div>)}</div><div style={{ display: "flex", gap: 10 }}><button onClick={() => { setCategories(mkCats()); setAiSuggestions(p => { const n = { ...p }; delete n.autogen; return n; }); setSelectedCat(mkCats()[0]?.id); }} style={{ ...BS("#00e5a0"), padding: "10px 20px", fontSize: 13 }}>Replace Menu</button><button onClick={() => { const nc = mkCats(); setCategories(p => [...p, ...nc]); setAiSuggestions(p => { const n = { ...p }; delete n.autogen; return n; }); setSelectedCat(nc[0]?.id); }} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(0,229,160,0.3)", background: "transparent", color: "#00e5a0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add to Existing</button></div></div>; } catch { return <p style={{ fontSize: 12.5, color: "var(--secondary)", whiteSpace: "pre-wrap" }}>{aiSuggestions.autogen}</p>; } })()}</div>}
      {uploadMode && <div style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: 14, padding: "20px 24px", marginBottom: 20, animation: "slideUp 0.3s ease" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><span style={{ fontSize: 14, fontWeight: 600, color: "#00e5ff" }}>📄 Menu Upload</span><button onClick={() => { setUploadMode(false); setExtractedMenu(null); setUploadPreview(null); }} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>close</button></div>{aiLoading.upload && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}><div style={{ width: 20, height: 20, border: "2px solid rgba(0,229,255,0.2)", borderTop: "2px solid #00e5ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/><span style={{ fontSize: 13, color: "var(--secondary)" }}>Reading menu...</span><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}{uploadPreview && !aiLoading.upload && <img src={uploadPreview} alt="" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, border: "1px solid var(--border)", objectFit: "contain", marginBottom: 14 }}/>}{extractedMenu?.error && <div style={{ color: "#ef4444", fontSize: 13 }}>{extractedMenu.error}</div>}{extractedMenu?.categories && <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Found {extractedMenu.categories.length} categories, {extractedMenu.categories.reduce((s,c)=>s+c.items.length,0)} items</div><div style={{ maxHeight: 280, overflow: "auto", marginBottom: 16 }}>{extractedMenu.categories.map((c,i)=><div key={i} style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:"#00e5ff",marginBottom:4,textTransform:"uppercase"}}>{c.name}</div>{c.items.map((it,j)=><div key={j} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{flex:1,fontSize:12.5,color:"var(--secondary)"}}>{it.name}</span><span style={{fontSize:12.5,fontWeight:600,color:it.price?"var(--primary)":"var(--muted)"}}>{it.price?`$${it.price}`:"—"}</span></div>)}</div>)}</div><div style={{display:"flex",gap:10}}><button onClick={importExtractedMenu} style={BS("#00e5ff")}>Import All</button><button onClick={()=>{setUploadMode(false);setExtractedMenu(null);setUploadPreview(null)}} style={{...BS("transparent"),color:"var(--muted)",border:"1px solid var(--border)"}}>Cancel</button></div></div>}</div>}
      {aiSuggestions.placement && <div style={{background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:20,animation:"slideUp 0.3s ease"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:"#a78bfa"}}>✨ Placement Strategy</span><button onClick={()=>setAiSuggestions(p=>{const n={...p};delete n.placement;return n})} style={{all:"unset",cursor:"pointer",color:"var(--muted)",fontSize:12}}>dismiss</button></div><p style={{fontSize:12.5,color:"var(--secondary)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{aiSuggestions.placement}</p></div>}

      {/* ── MAIN GRID ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, minHeight: 500 }}>
        {/* Categories */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>Categories</span><button onClick={() => setShowAddCat(true)} style={{ all: "unset", cursor: "pointer", color: "#00e5ff", fontSize: 18, lineHeight: 1 }}>+</button></div>
          {showAddCat && <div style={{ marginBottom: 10 }}><input value={newCatName} onChange={e=>setNewCatName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()} placeholder="Category name..." style={{...IS,padding:"8px 12px",fontSize:12,marginBottom:6}} autoFocus/><div style={{display:"flex",gap:6}}><button onClick={addCategory} style={BS("#00e5ff")}>Add</button><button onClick={()=>{setShowAddCat(false);setNewCatName("")}} style={{...BS("transparent"),color:"var(--muted)",border:"1px solid var(--border)"}}>Cancel</button></div></div>}
          {categories.map(cat => <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}><button onClick={() => { setSelectedCat(cat.id); setSelectedItem(null); }} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, padding: "10px 12px", borderRadius: 8, background: selectedCat===cat.id?"rgba(0,229,255,0.08)":"transparent", color: selectedCat===cat.id?"#00e5ff":"var(--secondary)", fontSize: 13, fontWeight: selectedCat===cat.id?600:400 }}><span>{cat.name}</span><span style={{ fontSize: 11, color: "var(--muted)" }}>{cat.items.length}</span></button>{categories.length > 1 && <button onClick={() => deleteCategory(cat.id)} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 13, opacity: 0.3 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>×</button>}</div>)}
        </div>

        {/* Items */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><h3 style={{ fontSize: 16, fontWeight: 600 }}>{currentCat?.name || "Select a category"}</h3>{currentCat && <button onClick={() => setShowAddItem(true)} style={BS("#00e5ff")}>+ Add Item</button>}</div>
          {showAddItem && <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 10, marginBottom: 10 }}><input value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="Item name..." style={IS} autoFocus/><input value={newItem.ingredients} onChange={e=>setNewItem(p=>({...p,ingredients:e.target.value}))} placeholder="Ingredients..." style={IS}/><input value={newItem.foodCost} onChange={e=>setNewItem(p=>({...p,foodCost:e.target.value}))} placeholder="Cost $" style={IS}/></div><div style={{display:"flex",gap:8}}><button onClick={addNewItem} style={BS("#00e5ff")}>Add Item</button><button onClick={()=>{setShowAddItem(false);setNewItem({name:"",ingredients:"",foodCost:""})}} style={{...BS("transparent"),color:"var(--muted)",border:"1px solid var(--border)"}}>Cancel</button></div></div>}
          {currentCat?.items.length===0&&!showAddItem&&<div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)",fontSize:13}}>No items yet.</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {currentCat?.items.map(item => (
              <div key={item.id} draggable onDragStart={()=>setDragItem(item.id)} onDragOver={e=>{e.preventDefault()}} onDrop={()=>handleDrop(item.id)} onDragEnd={()=>setDragItem(null)}
                style={{ background: item.eightySixed?"rgba(239,68,68,0.04)":selectedItem===item.id?"rgba(167,139,250,0.04)":"var(--surface)", border:`1px solid ${item.eightySixed?"rgba(239,68,68,0.15)":selectedItem===item.id?"rgba(167,139,250,0.2)":"var(--border)"}`, borderRadius: 12, overflow: "hidden", transition: "all 0.2s", opacity: dragItem===item.id?0.5:item.eightySixed?0.6:1, cursor: "grab" }}>

                {/* Item Row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                  <span style={{ color: "var(--muted)", fontSize: 14, cursor: "grab", userSelect: "none", opacity: 0.3 }}>⠿</span>
                  {/* Photo thumbnail */}
                  {item.photo && <img src={item.photo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}/>}
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setSelectedItem(selectedItem===item.id?null:item.id); setEditTab("details"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)", textDecoration: item.eightySixed?"line-through":"none" }}>{item.name}</span>
                      {item.eightySixed&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:"rgba(239,68,68,0.15)",color:"#ef4444"}}>86'd</span>}
                      {item.seasonal&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:"rgba(245,158,11,0.15)",color:"#f59e0b"}}>SEASONAL</span>}
                      {(item.allergens||[]).map(a=><span key={a} style={{fontSize:9,fontWeight:700,padding:"2px 5px",borderRadius:4,background:(ALLERGEN_COLORS[a]||"#888")+"15",color:ALLERGEN_COLORS[a]}}>{a}</span>)}
                      {(item.modifiers||[]).length > 0 && <span style={{fontSize:9,fontWeight:600,padding:"2px 5px",borderRadius:4,background:"rgba(96,165,250,0.12)",color:"#60a5fa"}}>{item.modifiers.length} mod{item.modifiers.length>1?"s":""}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{item.description || "No description"}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.price?"var(--primary)":"var(--muted)" }}>{item.price?`$${item.price}`:"—"}</div>
                    {item.foodCost&&item.price&&<div style={{fontSize:10,color:parseFloat(item.foodCost)/parseFloat(item.price)*100<=32?"#00e5a0":"#f59e0b"}}>{(parseFloat(item.foodCost)/parseFloat(item.price)*100).toFixed(1)}%</div>}
                  </div>
                  <button onClick={e=>{e.stopPropagation();setCtxMenu(ctxMenu===item.id?null:item.id)}} style={{all:"unset",cursor:"pointer",color:"var(--muted)",fontSize:18,padding:"0 4px",opacity:0.5}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}>⋮</button>
                </div>

                {/* Context Menu */}
                {ctxMenu===item.id&&<div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:6,margin:"0 16px 12px",animation:"slideUp 0.15s ease"}}>
                  <button onClick={()=>{toggle86(item.id);setCtxMenu(null)}} style={{...CMI,color:item.eightySixed?"#00e5a0":"#ef4444"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{item.eightySixed?"✓ Available":"✕ 86 Item"}</button>
                  <button onClick={()=>{updateItem(item.id,"seasonal",!item.seasonal);setCtxMenu(null)}} style={CMI} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{item.seasonal?"Remove Seasonal":"Mark Seasonal"}</button>
                  <div style={{height:1,background:"var(--border)",margin:"4px 0"}}/>
                  <div style={{padding:"4px 12px",fontSize:10,color:"var(--muted)",fontWeight:600,textTransform:"uppercase"}}>Move to</div>
                  {categories.filter(c=>c.id!==selectedCat).map(c=><button key={c.id} onClick={()=>moveItemTo(item.id,c.id)} style={CMI} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>→ {c.name}</button>)}
                  <div style={{height:1,background:"var(--border)",margin:"4px 0"}}/>
                  <div style={{padding:"4px 12px",fontSize:10,color:"var(--muted)",fontWeight:600,textTransform:"uppercase"}}>Duplicate to</div>
                  {categories.map(c=><button key={c.id} onClick={()=>duplicateItemTo(item.id,c.id)} style={CMI} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>⊕ {c.name}</button>)}
                  <div style={{height:1,background:"var(--border)",margin:"4px 0"}}/>
                  <button onClick={()=>{deleteItem(item.id);setCtxMenu(null)}} style={{...CMI,color:"#ef4444"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.06)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Delete</button>
                </div>}

                {/* ── EXPANDED EDITOR WITH TABS ──── */}
                {selectedItem===item.id&&<div style={{padding:"0 16px 16px",borderTop:"1px solid var(--border)",animation:"slideUp 0.25s ease"}}>
                  {/* Tab bar */}
                  <div style={{ display: "flex", gap: 6, padding: "12px 0 14px", borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
                    <button onClick={()=>setEditTab("details")} style={TAB(editTab==="details")}>Details & AI</button>
                    <button onClick={()=>setEditTab("modifiers")} style={TAB(editTab==="modifiers")}>Modifiers {(item.modifiers||[]).length > 0 ? `(${item.modifiers.length})` : ""}</button>
                    <button onClick={()=>setEditTab("history")} style={TAB(editTab==="history")}>Price History</button>
                  </div>

                  {/* ── TAB: Details ──────────── */}
                  {editTab==="details"&&<div>
                    {/* Photo upload */}
                    <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                      <div>
                        {item.photo ? <div style={{ position: "relative" }}><img src={item.photo} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)" }}/><button onClick={()=>updateItem(item.id,"photo",null)} style={{ all: "unset", cursor: "pointer", position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div>
                          : <label style={{ width: 80, height: 80, borderRadius: 10, border: "1px dashed rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, color: "var(--muted)", gap: 4, transition: "border-color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(0,229,255,0.4)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}><input type="file" accept="image/*" style={{ display: "none" }} onChange={e=>handlePhotoUpload(item.id,e.target.files?.[0])}/><span style={{ fontSize: 20 }}>📷</span>Photo</label>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Item Name</label>
                        <input value={item.name} onChange={e=>updateItem(item.id,"name",e.target.value)} style={{...IS,marginBottom:8}}/>
                        <label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Ingredients</label>
                        <input value={item.ingredients} onChange={e=>updateItem(item.id,"ingredients",e.target.value)} placeholder="e.g. dough, mozzarella, basil..." style={IS}/>
                      </div>
                    </div>

                    <label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Allergen Tags</label>
                    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>{ALLERGENS.map(tag=>{const on=(item.allergens||[]).includes(tag);return<button key={tag} onClick={()=>toggleAllergen(item.id,tag)} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${on?ALLERGEN_COLORS[tag]+"50":"rgba(255,255,255,0.1)"}`,background:on?ALLERGEN_COLORS[tag]+"15":"transparent",color:on?ALLERGEN_COLORS[tag]:"var(--muted)"}}>{tag}</button>})}</div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <div><label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Food Cost ($)</label><input value={item.foodCost} onChange={e=>updateItem(item.id,"foodCost",e.target.value)} placeholder="0.00" style={IS}/></div>
                      <div><label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Menu Price ($)</label><div style={{display:"flex",gap:8}}><input value={item.price} onChange={e=>updateItem(item.id,"price",e.target.value)} onBlur={e=>{if(e.target.value && e.target.value !== item.price) logPriceChange(item.id, e.target.value)}} placeholder="0.00" style={{...IS,flex:1}}/><button onClick={()=>suggestPrice(item)} disabled={aiLoading[`price-${item.id}`]} style={AI}>{aiLoading[`price-${item.id}`]?"...":"✨ Price"}</button></div></div>
                    </div>
                    {aiSuggestions[`price-${item.id}`]&&<AiBox label="Suggested Price" onDismiss={()=>setAiSuggestions(p=>{const n={...p};delete n[`price-${item.id}`];return n})}>{(()=>{try{const d=JSON.parse(aiSuggestions[`price-${item.id}`]);return<div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20,fontWeight:700,color:"#a78bfa"}}>${d.price}</span><span style={{fontSize:12,color:"var(--secondary)",flex:1}}>{d.reasoning}</span><button onClick={()=>{applyAi(item.id,"price",d.price);logPriceChange(item.id,d.price)}} style={BS("#a78bfa")}>Apply</button></div>}catch{return<span style={{fontSize:12,color:"var(--secondary)"}}>{aiSuggestions[`price-${item.id}`]}</span>}})()}</AiBox>}

                    <label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:6}}>Description</label>
                    <div style={{display:"flex",gap:8,marginBottom:6}}><textarea value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)} placeholder="Describe this dish..." rows={2} style={{...IS,resize:"vertical",flex:1}}/><button onClick={()=>generateDescription(item)} disabled={aiLoading[`desc-${item.id}`]} style={{...AI,alignSelf:"flex-start",whiteSpace:"nowrap"}}>{aiLoading[`desc-${item.id}`]?"...":"✨ Write"}</button></div>
                    {aiSuggestions[`desc-${item.id}`]&&<AiBox label="Description" onDismiss={()=>setAiSuggestions(p=>{const n={...p};delete n[`desc-${item.id}`];return n})}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:12.5,color:"var(--secondary)",flex:1,fontStyle:"italic"}}>"{aiSuggestions[`desc-${item.id}`]}"</span><button onClick={()=>applyAi(item.id,"description",aiSuggestions[`desc-${item.id}`])} style={BS("#a78bfa")}>Apply</button></div></AiBox>}
                    <div style={{marginTop:12}}><button onClick={()=>suggestNames(item)} disabled={aiLoading[`names-${item.id}`]} style={AI}>{aiLoading[`names-${item.id}`]?"...":"✨ Suggest Names"}</button></div>
                    {aiSuggestions[`names-${item.id}`]&&<AiBox label="Name Ideas" onDismiss={()=>setAiSuggestions(p=>{const n={...p};delete n[`names-${item.id}`];return n})}>{(()=>{try{const ns=JSON.parse(aiSuggestions[`names-${item.id}`]);return<div style={{display:"flex",flexDirection:"column",gap:6}}>{ns.map((n,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:13,fontWeight:600,color:"var(--primary)",minWidth:130}}>{n.name}</span><span style={{fontSize:11,color:"var(--muted)",flex:1}}>{n.why}</span><button onClick={()=>applyAi(item.id,"name",n.name)} style={{...BS("#a78bfa"),padding:"4px 10px",fontSize:11}}>Use</button></div>)}</div>}catch{return<span style={{fontSize:12,color:"var(--secondary)"}}>{aiSuggestions[`names-${item.id}`]}</span>}})()}</AiBox>}
                  </div>}

                  {/* ── TAB: Modifiers ────────── */}
                  {editTab==="modifiers"&&<div>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Add size options, toppings, sauces, and other add-ons with upcharges.</p>
                    {(item.modifiers||[]).map(mod => (
                      <div key={mod.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <input value={mod.group} onChange={e=>updateModifierGroup(item.id,mod.id,"group",e.target.value)} placeholder="Group name (e.g. Size, Toppings, Sauce)" style={{ ...IS, flex: 1, fontWeight: 600 }}/>
                          <button onClick={()=>deleteModifierGroup(item.id,mod.id)} style={{ all: "unset", cursor: "pointer", color: "#ef4444", fontSize: 12, opacity: 0.6 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>Remove</button>
                        </div>
                        {mod.options.map((opt, oi) => (
                          <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                            <input value={opt.name} onChange={e=>updateModifierOption(item.id,mod.id,oi,"name",e.target.value)} placeholder="Option name" style={{ ...IS, flex: 1 }}/>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>+$</span>
                              <input value={opt.upcharge} onChange={e=>updateModifierOption(item.id,mod.id,oi,"upcharge",e.target.value)} placeholder="0.00" style={{ ...IS, width: 70 }}/>
                            </div>
                            {mod.options.length > 1 && <button onClick={()=>deleteModifierOption(item.id,mod.id,oi)} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 14, opacity: 0.4 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.4}>×</button>}
                          </div>
                        ))}
                        <button onClick={()=>addModifierOption(item.id,mod.id)} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#00e5ff", marginTop: 4 }}>+ Add option</button>
                      </div>
                    ))}
                    <button onClick={()=>addModifierGroup(item.id)} style={{ ...BS("#00e5ff"), marginTop: 4 }}>+ Add Modifier Group</button>
                  </div>}

                  {/* ── TAB: Price History ────── */}
                  {editTab==="history"&&<div>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Track how this item's price has changed over time.</p>
                    {(item.priceHistory||[]).length === 0 ? <div style={{ fontSize: 12, color: "var(--muted)", padding: "20px 0", textAlign: "center" }}>No price history yet. Price changes are logged automatically.</div>
                    : <div>
                      {/* Simple bar visualization */}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16, height: 100, padding: "0 10px" }}>
                        {(item.priceHistory||[]).map((h, i) => {
                          const prices = item.priceHistory.map(p => parseFloat(p.price));
                          const max = Math.max(...prices);
                          const min = Math.min(...prices) * 0.8;
                          const pct = max > min ? ((parseFloat(h.price) - min) / (max - min)) * 100 : 50;
                          const isLatest = i === item.priceHistory.length - 1;
                          return <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isLatest ? "#00e5ff" : "var(--secondary)" }}>${h.price}</span>
                            <div style={{ width: "100%", height: `${Math.max(pct, 10)}%`, borderRadius: "4px 4px 0 0", background: isLatest ? "#00e5ff" : "rgba(0,229,255,0.2)", transition: "height 0.3s" }}/>
                            <span style={{ fontSize: 9, color: "var(--muted)" }}>{h.date}</span>
                          </div>;
                        })}
                      </div>
                      {/* Table */}
                      <div style={{ borderTop: "1px solid var(--border)" }}>
                        {[...(item.priceHistory||[])].reverse().map((h, i) => {
                          const prev = item.priceHistory[item.priceHistory.length - 1 - i - 1];
                          const change = prev ? (parseFloat(h.price) - parseFloat(prev.price)).toFixed(2) : null;
                          return <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)", width: 60 }}>{h.date}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>${h.price}</span>
                            {change !== null && <span style={{ fontSize: 11, color: parseFloat(change) > 0 ? "#f59e0b" : "#00e5a0" }}>{parseFloat(change) > 0 ? "+" : ""}{change}</span>}
                            {i === 0 && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(0,229,255,0.12)", color: "#00e5ff" }}>CURRENT</span>}
                          </div>;
                        })}
                      </div>
                    </div>}
                  </div>}
                </div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RECIPE CARDS MODULE ─────────────────────────────────────
// ─── RECIPE CARDS MODULE (Kitchen Reference — No Pricing) ────
function RecipeCards({ ingredients, prepItems, setPrepItems, recipes, setRecipes, categories }) {
  const [view, setView] = useState("menu");
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLink, setAddLink] = useState("");

  const allMenuItems = categories.flatMap(c => c.items.map(i => ({ ...i, catName: c.name })));
  const IS = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "var(--primary)", fontSize: 13, fontFamily: "inherit", outline: "none" };
  const BS = (c) => ({ padding: "7px 14px", borderRadius: 8, border: "none", background: c, color: "#080c16", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });
  const VTAB = (active, color = "#00e5a0") => ({ all: "unset", cursor: "pointer", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: active ? color + "15" : "rgba(255,255,255,0.03)", color: active ? color : "var(--muted)", border: active ? `1px solid ${color}30` : "1px solid var(--border)" });

  const printRecipe = (recipe, type) => {
    const ingList = type === "prep"
      ? recipe.ingredients.map(ri => { const ing = ingredients.find(i => i.id === ri.ingredientId); return { name: ing?.name || "?", qty: ri.qty, unit: ri.unit || ing?.unitType || "", note: ri.note || "" }; })
      : recipe.ingredients.map(ri => {
          if (ri.type === "ingredient") { const ing = ingredients.find(i => i.id === ri.refId); return { name: ing?.name || "?", qty: ri.qty, unit: ing?.unitType || "", note: ri.note || "" }; }
          if (ri.type === "prep") { const p = prepItems.find(pp => pp.id === ri.refId); return { name: p?.name || "?", qty: ri.qty, unit: "serving", note: ri.note || "", isPrep: true }; }
          return { name: "?", qty: 0, unit: "", note: "" };
        });
    const sInfo = type === "prep" ? `<p style="color:#666;font-size:13px;margin:4px 0 16px;">Serving Size: ${recipe.servingSize} ${recipe.servingSizeUnit} | Total Servings: ${recipe.totalServings}</p>` : "";
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${recipe.name}</title><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1a1a1a}@media print{body{padding:20px}}h1{font-size:28px;font-weight:700;margin-bottom:4px;border-bottom:3px solid #1a1a1a;padding-bottom:8px}.badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:#f0f0f0;color:#666;margin-left:8px;text-transform:uppercase}h2{font-size:16px;font-weight:700;margin:20px 0 10px;text-transform:uppercase;letter-spacing:1px;color:#333}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888;padding:8px 12px;border-bottom:2px solid #ddd}td{padding:8px 12px;border-bottom:1px solid #eee;font-size:14px}td.qty{font-weight:600;width:60px}td.unit{color:#666;width:80px}td.note{color:#999;font-size:12px;font-style:italic}.prep-badge{font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:#f3f0ff;color:#7c3aed;margin-right:6px}ol{padding-left:24px}ol li{padding:8px 0;font-size:14px;line-height:1.6;border-bottom:1px solid #f5f5f5}ol li:last-child{border-bottom:none}.footer{margin-top:30px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#aaa}</style></head><body><h1>${recipe.name}<span class="badge">${type==="prep"?"Prep Item":"Menu Item"}</span></h1>${sInfo}<h2>Ingredients</h2><table><thead><tr><th>Qty</th><th>Unit</th><th>Ingredient</th><th>Notes</th></tr></thead><tbody>${ingList.map(i=>`<tr><td class="qty">${i.qty}</td><td class="unit">${i.unit}</td><td>${i.isPrep?'<span class="prep-badge">PREP</span>':''}${i.name}</td><td class="note">${i.note}</td></tr>`).join("")}</tbody></table>${recipe.steps?.length?`<h2>Prep Steps</h2><ol>${recipe.steps.map(s=>`<li>${s}</li>`).join("")}</ol>`:""}<div class="footer">OwnersHQ Recipe Card — ${new Date().toLocaleDateString()}</div><script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  };

  // CRUD
  const addPrepItem = () => { if (!addName.trim()) return; const id = `prep-${Date.now()}`; setPrepItems(p => [...p, { id, name: addName, servingSize: 0, servingSizeUnit: "oz", totalServings: 1, ingredients: [], steps: [] }]); setAddName(""); setShowAdd(false); setSelectedId(id); };
  const addMenuRecipe = () => { if (!addName.trim()) return; const id = `rec-${Date.now()}`; setRecipes(p => [...p, { id, name: addName, menuItemId: addLink || "", servings: 1, ingredients: [], steps: [] }]); setAddName(""); setAddLink(""); setShowAdd(false); setSelectedId(id); };
  const updatePrepField = (id, f, v) => setPrepItems(ps => ps.map(p => p.id === id ? { ...p, [f]: v } : p));
  const addPrepIng = (id) => setPrepItems(ps => ps.map(p => p.id === id ? { ...p, ingredients: [...p.ingredients, { ingredientId: "", qty: 0, unit: "oz", note: "" }] } : p));
  const updatePrepIng = (pid, idx, f, v) => setPrepItems(ps => ps.map(p => p.id === pid ? { ...p, ingredients: p.ingredients.map((ri, i) => i === idx ? { ...ri, [f]: v } : ri) } : p));
  const delPrepIng = (pid, idx) => setPrepItems(ps => ps.map(p => p.id === pid ? { ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) } : p));
  const addPrepStep = (id) => setPrepItems(ps => ps.map(p => p.id === id ? { ...p, steps: [...p.steps, ""] } : p));
  const updatePrepStep = (pid, idx, v) => setPrepItems(ps => ps.map(p => p.id === pid ? { ...p, steps: p.steps.map((s, i) => i === idx ? v : s) } : p));
  const delPrepStep = (pid, idx) => setPrepItems(ps => ps.map(p => p.id === pid ? { ...p, steps: p.steps.filter((_, i) => i !== idx) } : p));
  const delPrep = (id) => { setPrepItems(ps => ps.filter(p => p.id !== id)); if (selectedId === id) setSelectedId(null); };
  const addRecRow = (rid, type) => setRecipes(rs => rs.map(r => r.id === rid ? { ...r, ingredients: [...r.ingredients, { type, refId: "", qty: 0, unit: type === "prep" ? "serving" : "oz", note: "" }] } : r));
  const updateRecRow = (rid, idx, f, v) => setRecipes(rs => rs.map(r => r.id === rid ? { ...r, ingredients: r.ingredients.map((ri, i) => i === idx ? { ...ri, [f]: v } : ri) } : r));
  const delRecRow = (rid, idx) => setRecipes(rs => rs.map(r => r.id === rid ? { ...r, ingredients: r.ingredients.filter((_, i) => i !== idx) } : r));
  const addRecStep = (rid) => setRecipes(rs => rs.map(r => r.id === rid ? { ...r, steps: [...r.steps, ""] } : r));
  const updateRecStep = (rid, idx, v) => setRecipes(rs => rs.map(r => r.id === rid ? { ...r, steps: r.steps.map((s, i) => i === idx ? v : s) } : r));
  const delRecStep = (rid, idx) => setRecipes(rs => rs.map(r => r.id === rid ? { ...r, steps: r.steps.filter((_, i) => i !== idx) } : r));
  const delRecipe = (id) => { setRecipes(rs => rs.filter(r => r.id !== id)); if (selectedId === id) setSelectedId(null); };

  const currentPrep = prepItems.find(p => p.id === selectedId);
  const currentRecipe = recipes.find(r => r.id === selectedId);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setView("menu"); setSelectedId(null); }} style={VTAB(view === "menu", "#00e5ff")}>Menu Recipes ({recipes.length})</button>
          <button onClick={() => { setView("prep"); setSelectedId(null); }} style={VTAB(view === "prep", "#a78bfa")}>Prep Recipes ({prepItems.length})</button>
        </div>
        <button onClick={() => setShowAdd(true)} style={BS("#00e5a0")}>+ New {view === "prep" ? "Prep" : "Menu"} Recipe</button>
      </div>

      {showAdd && <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: view === "menu" ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 10 }}>
          <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Recipe name..." style={IS} autoFocus/>
          {view === "menu" && <select value={addLink} onChange={e => setAddLink(e.target.value)} style={{ ...IS, cursor: "pointer" }}><option value="">Link to menu item...</option>{allMenuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}</select>}
        </div>
        <div style={{ display: "flex", gap: 8 }}><button onClick={view === "prep" ? addPrepItem : addMenuRecipe} style={BS("#00e5a0")}>Create</button><button onClick={() => { setShowAdd(false); setAddName(""); }} style={{ ...BS("transparent"), color: "var(--muted)", border: "1px solid var(--border)" }}>Cancel</button></div>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, minHeight: 400 }}>
        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {view === "prep" && prepItems.map(p => <button key={p.id} onClick={() => setSelectedId(p.id)} style={{ all: "unset", cursor: "pointer", padding: "14px 16px", borderRadius: 12, background: selectedId === p.id ? "rgba(167,139,250,0.06)" : "var(--surface)", border: `1px solid ${selectedId === p.id ? "rgba(167,139,250,0.2)" : "var(--border)"}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>{p.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{p.ingredients.length} ingredients · {p.steps.length} steps · {p.totalServings} srv × {p.servingSize}{p.servingSizeUnit}</div>
          </button>)}
          {view === "menu" && recipes.map(r => { const mi = allMenuItems.find(m => m.id === r.menuItemId); return <button key={r.id} onClick={() => setSelectedId(r.id)} style={{ all: "unset", cursor: "pointer", padding: "14px 16px", borderRadius: 12, background: selectedId === r.id ? "rgba(0,229,255,0.06)" : "var(--surface)", border: `1px solid ${selectedId === r.id ? "rgba(0,229,255,0.2)" : "var(--border)"}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{r.ingredients.length} ingredients · {r.steps.length} steps{mi && <span> · <span style={{ color: "#00e5ff" }}>{mi.name}</span></span>}</div>
          </button>; })}
          {((view === "prep" && !prepItems.length) || (view === "menu" && !recipes.length)) && <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No recipes yet.</div>}
        </div>

        {/* Detail — PREP */}
        {view === "prep" && currentPrep ? <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <input value={currentPrep.name} onChange={e => updatePrepField(currentPrep.id, "name", e.target.value)} style={{ ...IS, fontSize: 18, fontWeight: 700, padding: "8px 0", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", borderRadius: 0, width: "100%" }}/>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <div><span style={{ fontSize: 10, color: "var(--muted)" }}>Serving Size</span><div style={{ display: "flex", gap: 4 }}><input value={currentPrep.servingSize} onChange={e => updatePrepField(currentPrep.id, "servingSize", e.target.value)} style={{ ...IS, padding: "4px 8px", width: 50, fontSize: 12 }}/><select value={currentPrep.servingSizeUnit} onChange={e => updatePrepField(currentPrep.id, "servingSizeUnit", e.target.value)} style={{ ...IS, padding: "4px 8px", width: 60, fontSize: 12 }}><option>oz</option><option>cups</option><option>each</option><option>lb</option></select></div></div>
                <div><span style={{ fontSize: 10, color: "var(--muted)" }}>Total Servings</span><input value={currentPrep.totalServings} onChange={e => updatePrepField(currentPrep.id, "totalServings", parseFloat(e.target.value) || 0)} style={{ ...IS, padding: "4px 8px", width: 60, fontSize: 12 }}/></div>
              </div>
            </div>
            <button onClick={() => printRecipe(currentPrep, "prep")} style={{ ...BS("#f59e0b"), display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>🖨 Print</button>
          </div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Ingredients</h4>
          {currentPrep.ingredients.map((ri, idx) => { const ing = ingredients.find(i => i.id === ri.ingredientId); return <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 60px 1fr 30px", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <select value={ri.ingredientId} onChange={e => updatePrepIng(currentPrep.id, idx, "ingredientId", e.target.value)} style={{ ...IS, padding: "6px 10px", fontSize: 12 }}><option value="">Select...</option>{ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
            <input value={ri.qty} onChange={e => updatePrepIng(currentPrep.id, idx, "qty", e.target.value)} placeholder="Qty" type="number" step="0.1" style={{ ...IS, padding: "6px 10px", fontSize: 12 }}/>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{ing?.unitType || "unit"}</span>
            <input value={ri.note} onChange={e => updatePrepIng(currentPrep.id, idx, "note", e.target.value)} placeholder="Notes..." style={{ ...IS, padding: "6px 10px", fontSize: 11 }}/>
            <button onClick={() => delPrepIng(currentPrep.id, idx)} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 14, opacity: 0.3 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>×</button>
          </div>; })}
          <button onClick={() => addPrepIng(currentPrep.id)} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#00e5a0", marginBottom: 16, display: "block" }}>+ Add ingredient</button>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Prep Steps</h4>
          {currentPrep.steps.map((s, idx) => <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", width: 24, textAlign: "right", fontWeight: 600 }}>{idx+1}.</span>
            <input value={s} onChange={e => updatePrepStep(currentPrep.id, idx, e.target.value)} style={{ ...IS, padding: "8px 12px", fontSize: 13, flex: 1 }}/>
            <button onClick={() => delPrepStep(currentPrep.id, idx)} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 14, opacity: 0.3 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>×</button>
          </div>)}
          <button onClick={() => addPrepStep(currentPrep.id)} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#00e5a0", marginBottom: 16, display: "block" }}>+ Add step</button>
          <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)" }}><button onClick={() => delPrep(currentPrep.id)} style={{ ...BS("transparent"), color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Delete</button></div>
        </div>

        /* Detail — MENU */
        : view === "menu" && currentRecipe ? <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <input value={currentRecipe.name} onChange={e => setRecipes(rs => rs.map(r => r.id === currentRecipe.id ? { ...r, name: e.target.value } : r))} style={{ ...IS, fontSize: 18, fontWeight: 700, padding: "8px 0", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", borderRadius: 0, width: "100%" }}/>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Linked to:</span>
                <select value={currentRecipe.menuItemId} onChange={e => setRecipes(rs => rs.map(r => r.id === currentRecipe.id ? { ...r, menuItemId: e.target.value } : r))} style={{ ...IS, padding: "4px 8px", fontSize: 11, width: "auto" }}><option value="">None</option>{allMenuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}</select>
              </div>
            </div>
            <button onClick={() => printRecipe(currentRecipe, "menu")} style={{ ...BS("#f59e0b"), display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>🖨 Print</button>
          </div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Ingredients</h4>
          {currentRecipe.ingredients.map((ri, idx) => { const isP = ri.type === "prep"; return <div key={idx} style={{ display: "grid", gridTemplateColumns: "60px 1fr 70px 50px 1fr 30px", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 6px", borderRadius: 4, textAlign: "center", background: isP ? "rgba(167,139,250,0.12)" : "rgba(0,229,255,0.1)", color: isP ? "#a78bfa" : "#00e5ff" }}>{isP ? "PREP" : "RAW"}</span>
            {isP ? <select value={ri.refId} onChange={e => updateRecRow(currentRecipe.id, idx, "refId", e.target.value)} style={{ ...IS, padding: "6px 10px", fontSize: 12 }}><option value="">Select prep...</option>{prepItems.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              : <select value={ri.refId} onChange={e => updateRecRow(currentRecipe.id, idx, "refId", e.target.value)} style={{ ...IS, padding: "6px 10px", fontSize: 12 }}><option value="">Select ingredient...</option>{ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>}
            <input value={ri.qty} onChange={e => updateRecRow(currentRecipe.id, idx, "qty", e.target.value)} placeholder="Qty" type="number" step="0.1" style={{ ...IS, padding: "6px 10px", fontSize: 12 }}/>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{isP ? "srv" : (ingredients.find(i => i.id === ri.refId)?.unitType || "unit")}</span>
            <input value={ri.note} onChange={e => updateRecRow(currentRecipe.id, idx, "note", e.target.value)} placeholder="Notes..." style={{ ...IS, padding: "6px 10px", fontSize: 11 }}/>
            <button onClick={() => delRecRow(currentRecipe.id, idx)} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 14, opacity: 0.3 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>×</button>
          </div>; })}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><button onClick={() => addRecRow(currentRecipe.id, "ingredient")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#00e5ff" }}>+ Raw Ingredient</button><span style={{ color: "var(--muted)" }}>·</span><button onClick={() => addRecRow(currentRecipe.id, "prep")} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#a78bfa" }}>+ Prep Item</button></div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Prep Steps</h4>
          {currentRecipe.steps.map((s, idx) => <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", width: 24, textAlign: "right", fontWeight: 600 }}>{idx+1}.</span>
            <input value={s} onChange={e => updateRecStep(currentRecipe.id, idx, e.target.value)} style={{ ...IS, padding: "8px 12px", fontSize: 13, flex: 1 }}/>
            <button onClick={() => delRecStep(currentRecipe.id, idx)} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 14, opacity: 0.3 }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>×</button>
          </div>)}
          <button onClick={() => addRecStep(currentRecipe.id)} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#00e5a0", marginBottom: 16, display: "block" }}>+ Add step</button>
          <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)" }}><button onClick={() => delRecipe(currentRecipe.id)} style={{ ...BS("transparent"), color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Delete</button></div>
        </div>

        : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>Select a recipe or create a new one.</div>}
      </div>
    </div>
  );
}

// ─── PREP & MENU COSTING MODULE ──────────────────────────────
function PrepCosting({ categories, setCategories, ingredients, setIngredients, prepItems, setPrepItems, recipes, setRecipes }) {
  const [view, setView] = useState("products"); // products | prep | menu | overview
  const [aiLoading, setAiLoading] = useState({});
  const [aiResult, setAiResult] = useState(null);
  const [targetFoodCost, setTargetFoodCost] = useState(30);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedPrep, setSelectedPrep] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [prodSearch, setProdSearch] = useState("");

  const allMenuItems = categories.flatMap(c => c.items.map(i => ({ ...i, catName: c.name })));
  const IS = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "var(--primary)", fontSize: 13, fontFamily: "inherit", outline: "none" };
  const BS = (c) => ({ padding: "7px 14px", borderRadius: 8, border: "none", background: c, color: "#080c16", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });
  const VTAB = (active, color = "#f59e0b") => ({ all: "unset", cursor: "pointer", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: active ? color + "15" : "rgba(255,255,255,0.03)", color: active ? color : "var(--muted)", border: active ? `1px solid ${color}30` : "1px solid var(--border)" });

  // ── Cost calculations ──
  const getPrepBatchCost = (prep) => prep.ingredients.reduce((s, ri) => {
    const ing = ingredients.find(i => i.id === ri.ingredientId);
    return s + (ing && ri.qty ? parseFloat(ing.costPerUnit || 0) * parseFloat(ri.qty) : 0);
  }, 0);
  const getPrepCostPerServing = (prep) => { const t = getPrepBatchCost(prep); return prep.totalServings > 0 ? t / prep.totalServings : t; };

  const getMenuRecipeCost = (recipe) => recipe.ingredients.reduce((s, ri) => {
    if (ri.type === "ingredient") { const ing = ingredients.find(i => i.id === ri.refId); return s + (ing && ri.qty ? parseFloat(ing.costPerUnit || 0) * parseFloat(ri.qty) : 0); }
    if (ri.type === "prep") { const prep = prepItems.find(p => p.id === ri.refId); return s + (prep ? getPrepCostPerServing(prep) * (parseFloat(ri.qty) || 1) : 0); }
    return s;
  }, 0);

  // AI price adjustments
  const aiPriceAdjust = async () => {
    setAiLoading(p => ({ ...p, adjust: true }));
    const items = recipes.filter(r => r.menuItemId).map(r => {
      const mi = allMenuItems.find(m => m.id === r.menuItemId);
      const cost = getMenuRecipeCost(r);
      return mi && mi.price ? `- ${r.name} | Cost: $${cost.toFixed(2)} | Price: $${mi.price} | %: ${(cost/parseFloat(mi.price)*100).toFixed(1)}%` : null;
    }).filter(Boolean).join("\n");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: `Restaurant pricing consultant. Target food cost: ${targetFoodCost}%. Suggest price adjustments for items outside ${targetFoodCost-2}%-${targetFoodCost+2}%. Items:\n${items}\nONLY JSON: [{"name":"...","currentPrice":"...","suggestedPrice":"...","currentPct":"...","newPct":"...","action":"raise|lower|keep","reason":"brief"}]. No markdown.` }] }) });
      const d = await r.json(); const t = (d.content?.map(b => b.type === "text" ? b.text : "").join("") || "").trim();
      setAiResult(JSON.parse(t.replace(/```json|```/g, "").trim()));
    } catch { setAiResult("error"); }
    setAiLoading(p => ({ ...p, adjust: false }));
  };

  const applyPrice = (name, newPrice) => {
    const recipe = recipes.find(r => r.name === name);
    if (!recipe?.menuItemId) return;
    const dt = new Date().toISOString().slice(0, 7);
    setCategories(cs => cs.map(c => ({ ...c, items: c.items.map(i => { if (i.id !== recipe.menuItemId) return i; const h = [...(i.priceHistory||[])]; h.push({ price: newPrice, date: dt }); return { ...i, price: newPrice, priceHistory: h }; }) })));
    setAiResult(prev => Array.isArray(prev) ? prev.map(r => r.name === name ? { ...r, applied: true } : r) : prev);
  };

  const statusColor = (pct) => pct <= targetFoodCost + 2 ? "#00e5a0" : pct <= targetFoodCost + 5 ? "#f59e0b" : "#ef4444";

  // ── Overview stats ──
  const menuWithCosts = recipes.filter(r => r.menuItemId).map(r => {
    const mi = allMenuItems.find(m => m.id === r.menuItemId);
    const cost = getMenuRecipeCost(r);
    return mi && mi.price ? { name: r.name, cost, price: parseFloat(mi.price), pct: cost / parseFloat(mi.price) * 100, profit: parseFloat(mi.price) - cost, catName: mi.catName } : null;
  }).filter(Boolean);
  const avgPct = menuWithCosts.length ? menuWithCosts.reduce((s, i) => s + i.pct, 0) / menuWithCosts.length : 0;
  const totalRev = menuWithCosts.reduce((s, i) => s + i.price, 0);
  const totalCost = menuWithCosts.reduce((s, i) => s + i.cost, 0);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* View tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView("products")} style={VTAB(view === "products")}>Master Product List ({ingredients.length})</button>
          <button onClick={() => setView("prep")} style={VTAB(view === "prep", "#a78bfa")}>Prep Item Costing ({prepItems.length})</button>
          <button onClick={() => setView("menu")} style={VTAB(view === "menu", "#00e5ff")}>Menu Item Costing ({recipes.length})</button>
          <button onClick={() => setView("overview")} style={VTAB(view === "overview", "#00e5a0")}>Overview</button>
        </div>
      </div>

      {/* ═══ MASTER PRODUCT LIST ═══ */}
      {view === "products" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(0,229,255,0.1)", color: "#00e5ff" }}>SYNCED FROM MOE</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Item, vendor, case count, and pricing from MOE. Only conversion field is editable here.</span>
          </div>
          <input value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Search..." style={{ ...IS, width: 200, padding: "8px 14px" }}/>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 90px 80px 70px 70px 80px 80px 80px", gap: 6, padding: "10px 16px", borderBottom: "1px solid var(--border)", minWidth: 800 }}>
            {["Usage Section", "Item Description", "Vendor", "Purchase $", "# Per Case", "Size Desc", "Item Cost", "Conv to Oz", "$/Oz/Unit"].map(h => <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</span>)}
          </div>
          {ingredients.filter(i => !prodSearch || i.name.toLowerCase().includes(prodSearch.toLowerCase()) || (i.category||"").toLowerCase().includes(prodSearch.toLowerCase())).map((ing, i, arr) => (
            <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 90px 80px 70px 70px 80px 80px 80px", gap: 6, padding: "8px 16px", alignItems: "center", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", minWidth: 800 }}>
              <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 500 }}>{ing.category || "—"}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--primary)" }}>{ing.name}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{ing.vendor}</span>
              {/* Purchase Price — from MOE */}
              <span style={{ fontSize: 12, color: "var(--secondary)" }}>${ing.purchasePrice || "—"}</span>
              <span style={{ fontSize: 12, color: "var(--secondary)" }}>{ing.unitsPerCase || "—"}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{ing.unitType}</span>
              {/* Item Cost (calculated) */}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>{ing.purchasePrice && ing.unitsPerCase ? `$${(parseFloat(ing.purchasePrice)).toFixed(2)}` : "—"}</span>
              {/* Conv to Oz - editable */}
              {editingCell === `${ing.id}-conv` ?
                <input value={ing.convToOz || ""} onChange={e => setIngredients(is => is.map(ii => ii.id === ing.id ? { ...ii, convToOz: e.target.value } : ii))} onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)} autoFocus style={{ ...IS, padding: "4px 6px", fontSize: 11, width: "100%" }}/> :
                <span onClick={() => setEditingCell(`${ing.id}-conv`)} style={{ fontSize: 12, color: "var(--secondary)", cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.15)" }}>{ing.convToOz || "—"}</span>
              }
              {/* Cost per oz/unit */}
              <span style={{ fontSize: 12, fontWeight: 700, color: "#00e5a0" }}>${ing.costPerUnit || "—"}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>All product data synced from MOE — item, vendor, case count, and pricing. Click the Conversion field to set oz/unit conversions for costing. To update prices or add items, use MOE.</p>
      </>}

      {/* ═══ PREP ITEM COSTING ═══ */}
      {view === "prep" && <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minHeight: 400 }}>
          {/* Prep item list */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--primary)" }}>Prep Items</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {prepItems.map(p => {
                const batchCost = getPrepBatchCost(p);
                const perServing = getPrepCostPerServing(p);
                return (
                  <button key={p.id} onClick={() => setSelectedPrep(p.id)} style={{
                    all: "unset", cursor: "pointer", padding: "14px 16px", borderRadius: 12,
                    background: selectedPrep === p.id ? "rgba(167,139,250,0.06)" : "var(--surface)",
                    border: `1px solid ${selectedPrep === p.id ? "rgba(167,139,250,0.2)" : "var(--border)"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>{p.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>${batchCost.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.ingredients.length} ingredients · {p.totalServings} servings × {p.servingSize}{p.servingSizeUnit}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#00e5a0" }}>${perServing.toFixed(2)}/srv</span>
                    </div>
                  </button>
                );
              })}
              {prepItems.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>No prep items. Create them in Recipe Cards.</div>}
            </div>
          </div>

          {/* Prep detail */}
          {selectedPrep && (() => {
            const p = prepItems.find(pp => pp.id === selectedPrep);
            if (!p) return null;
            const batchCost = getPrepBatchCost(p);
            const perServing = getPrepCostPerServing(p);
            return (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</h3>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Batch Cost</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>${batchCost.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Serving Size</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>{p.servingSize} {p.servingSizeUnit}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Servings</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>{p.totalServings}</div>
                  </div>
                  <div style={{ background: "rgba(0,229,160,0.05)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Cost Per Serving</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#00e5a0" }}>${perServing.toFixed(2)}</div>
                  </div>
                </div>
                {/* Ingredient breakdown */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Ingredient Breakdown</div>
                {p.ingredients.map((ri, i) => {
                  const ing = ingredients.find(ii => ii.id === ri.ingredientId);
                  const cost = ing && ri.qty ? parseFloat(ing.costPerUnit || 0) * parseFloat(ri.qty) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < p.ingredients.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                      <span style={{ flex: 1, fontSize: 12.5, color: "var(--secondary)" }}>{ing?.name || "Unknown"}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{ri.qty} {ri.unit}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>@ ${ing?.costPerUnit || "?"}/{ing?.unitType || "unit"}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", minWidth: 60, textAlign: "right" }}>${cost.toFixed(2)}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Total: ${batchCost.toFixed(2)}</span>
                </div>
              </div>
            );
          })()}
          {!selectedPrep && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>Select a prep item to see cost breakdown.</div>}
        </div>
      </>}

      {/* ═══ MENU ITEM COSTING ═══ */}
      {view === "menu" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Target: {targetFoodCost}%</span>
            <input type="range" min="20" max="40" value={targetFoodCost} onChange={e => setTargetFoodCost(parseInt(e.target.value))} style={{ width: 100 }}/>
          </div>
          <button onClick={aiPriceAdjust} disabled={aiLoading.adjust} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{aiLoading.adjust ? "Analyzing..." : "✨ AI Price Adjustments"}</button>
        </div>

        {/* AI Results */}
        {Array.isArray(aiResult) && <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa" }}>✨ AI Price Adjustments</span><button onClick={() => setAiResult(null)} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>dismiss</button></div>
          {aiResult.filter(r => r.action !== "keep").map((r, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--primary)" }}>{r.name}</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>${r.currentPrice} → </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.action === "raise" ? "#f59e0b" : "#00e5a0" }}>${r.suggestedPrice}</span>
            <span style={{ fontSize: 11, color: "var(--secondary)", maxWidth: 160 }}>{r.reason}</span>
            {r.applied ? <span style={{ fontSize: 10, fontWeight: 700, color: "#00e5a0", padding: "2px 8px", borderRadius: 4, background: "rgba(0,229,160,0.12)" }}>Applied</span>
              : <button onClick={() => applyPrice(r.name, r.suggestedPrice)} style={{ ...BS("#a78bfa"), padding: "4px 12px", fontSize: 11 }}>Apply</button>}
          </div>)}
          {aiResult.filter(r => r.action !== "keep").length === 0 && <p style={{ fontSize: 12.5, color: "var(--secondary)" }}>All items within target. No changes needed.</p>}
        </div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* All menu items from Menu Builder */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>FROM MENU BUILDER</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{allMenuItems.filter(mi => !mi.eightySixed).length} active items</span>
            </div>
            {categories.map(cat => {
              const activeItems = cat.items.filter(i => !i.eightySixed);
              if (!activeItems.length) return null;
              return (
                <div key={cat.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", padding: "4px 0", marginBottom: 4 }}>{cat.name}</div>
                  {activeItems.map(mi => {
                    const recipe = recipes.find(r => r.menuItemId === mi.id);
                    const cost = recipe ? getMenuRecipeCost(recipe) : null;
                    const pct = cost !== null && mi.price ? cost / parseFloat(mi.price) * 100 : null;
                    const isSelected = recipe && selectedMenu === recipe.id;
                    return (
                      <button key={mi.id} onClick={() => recipe && setSelectedMenu(recipe.id)} style={{
                        all: "unset", cursor: recipe ? "pointer" : "default", width: "100%", padding: "12px 14px", borderRadius: 10, marginBottom: 4,
                        background: isSelected ? "rgba(0,229,255,0.06)" : "var(--surface)",
                        border: `1px solid ${isSelected ? "rgba(0,229,255,0.2)" : "var(--border)"}`,
                        opacity: recipe ? 1 : 0.7,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{mi.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {!recipe && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>NEEDS RECIPE</span>}
                            {pct !== null && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: statusColor(pct) + "15", color: statusColor(pct) }}>{pct.toFixed(1)}%</span>}
                            {cost !== null ? <span style={{ fontSize: 13, fontWeight: 700, color: "#00e5ff" }}>${cost.toFixed(2)}</span> : <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                          {recipe ? `Price: $${mi.price || "?"} · Profit: $${mi.price ? (parseFloat(mi.price) - cost).toFixed(2) : "?"}` : "Create a recipe in Recipe Cards to see costing"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Menu recipe detail */}
          {selectedMenu && (() => {
            const r = recipes.find(rr => rr.id === selectedMenu);
            if (!r) return null;
            const cost = getMenuRecipeCost(r);
            const mi = allMenuItems.find(m => m.id === r.menuItemId);
            const pct = mi && mi.price ? cost / parseFloat(mi.price) * 100 : null;
            return (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{r.name}</h3>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Plate Cost</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#00e5ff" }}>${cost.toFixed(2)}</div>
                  </div>
                </div>
                {mi && mi.price && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Menu Price</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>${mi.price}</div>
                  </div>
                  <div style={{ background: statusColor(pct) + "08", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Food Cost %</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: statusColor(pct) }}>{pct.toFixed(1)}%</div>
                  </div>
                  <div style={{ background: "rgba(0,229,160,0.05)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Profit</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#00e5a0" }}>${(parseFloat(mi.price) - cost).toFixed(2)}</div>
                  </div>
                </div>}
                {/* Ingredient breakdown */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Cost Breakdown</div>
                {r.ingredients.map((ri, i) => {
                  let name = "Unknown", lineCost = 0, detail = "";
                  if (ri.type === "ingredient") {
                    const ing = ingredients.find(ii => ii.id === ri.refId);
                    name = ing?.name || "Unknown";
                    lineCost = ing && ri.qty ? parseFloat(ing.costPerUnit || 0) * parseFloat(ri.qty) : 0;
                    detail = `${ri.qty} ${ing?.unitType || "unit"} @ $${ing?.costPerUnit || "?"}`;
                  } else if (ri.type === "prep") {
                    const prep = prepItems.find(pp => pp.id === ri.refId);
                    name = prep ? `${prep.name}` : "Unknown prep";
                    lineCost = prep ? getPrepCostPerServing(prep) * (parseFloat(ri.qty) || 1) : 0;
                    detail = `${ri.qty || 1} serving @ $${prep ? getPrepCostPerServing(prep).toFixed(2) : "?"}`;
                  }
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < r.ingredients.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                      {ri.type === "prep" && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>PREP</span>}
                      <span style={{ flex: 1, fontSize: 12.5, color: "var(--secondary)" }}>{name}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{detail}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#00e5ff", minWidth: 60, textAlign: "right" }}>${lineCost.toFixed(2)}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#00e5ff" }}>Total Plate Cost: ${cost.toFixed(2)}</span>
                </div>
              </div>
            );
          })()}
          {!selectedMenu && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>Select a menu item to see cost breakdown.</div>}
        </div>
      </>}

      {/* ═══ OVERVIEW ═══ */}
      {view === "overview" && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Avg Food Cost %</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: statusColor(avgPct), lineHeight: 1 }}>{avgPct.toFixed(1)}%</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Target: {targetFoodCost}%</div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginTop: 8 }}><div style={{ height: "100%", borderRadius: 2, background: statusColor(avgPct), width: `${Math.min(avgPct / 50 * 100, 100)}%` }}/></div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Total Menu Revenue</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)", lineHeight: 1 }}>${totalRev.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{menuWithCosts.length} costed items</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Total Food Cost</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>${totalCost.toFixed(2)}</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Gross Profit</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#00e5a0", lineHeight: 1 }}>${(totalRev - totalCost).toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Margin: {totalRev > 0 ? ((totalRev - totalCost) / totalRev * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        {/* All items table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 80px 80px", gap: 8, padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
            {["Item", "Category", "Plate Cost", "Price", "Cost %", "Profit"].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</span>)}
          </div>
          {menuWithCosts.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 80px 80px", gap: 8, padding: "10px 20px", borderBottom: i < menuWithCosts.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--primary)" }}>{item.name}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.catName}</span>
              <span style={{ fontSize: 12, color: "var(--secondary)" }}>${item.cost.toFixed(2)}</span>
              <span style={{ fontSize: 12, color: "var(--secondary)" }}>${item.price.toFixed(2)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(item.pct) }}>{item.pct.toFixed(1)}%</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#00e5a0" }}>${item.profit.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

// ─── MOE INVENTORY MODULE ────────────────────────────────────
// ─── MOE INVENTORY MODULE (Owner View) ──────────────────────
function MoeModule({ ingredients, setIngredients, moeStatus }) {
  const [view, setView] = useState("inventory"); // inventory | orders | history | backend
  const [inventory, setInventory] = useState([]);
  const [stock, setStock] = useState({});
  const [vendors, setVendors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [search, setSearch] = useState("");

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(""), 2000); };

  // ── Load all MOE data from Supabase ──
  useEffect(() => {
    const load = async () => {
      const [inv, st, vd, hi] = await Promise.all([
        sbRead("tommys", "added"),
        sbRead("tommys", "stock"),
        sbRead("tommys", "vendors"),
        sbRead("tommys", "history"),
      ]);

      // Parse inventory from "added" format: { "section": [items] }
      if (inv && typeof inv === "object") {
        const sections = Object.entries(inv).map(([section, items]) => ({
          section,
          items: Array.isArray(items) ? items.map(i => ({ ...i, id: i.id || Date.now() + Math.random() })) : [],
        })).filter(s => s.items.length > 0);
        setInventory(sections);
      }
      setStock(st || {});
      setVendors(vd || []);
      setHistory(hi || []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Save helpers ──
  const saveStock = async (newStock) => { setStock(newStock); await sbWrite("tommys", "stock", newStock); };
  const saveHistory = async (newHist) => { setHistory(newHist); await sbWrite("tommys", "history", newHist); };
  const saveInventory = async (newInv) => {
    setInventory(newInv);
    // Convert back to "added" format for Supabase
    const added = {};
    newInv.forEach(s => { added[s.section] = s.items; });
    await sbWrite("tommys", "added", added);
  };

  // ── Stock helpers ──
  const updateStock = (id, val) => {
    const n = parseInt(val);
    const newStock = { ...stock, [id]: isNaN(n) ? 0 : Math.max(0, n) };
    setStock(newStock);
    saveStock(newStock);
  };

  const getStatus = (item, s) => {
    if (s >= (item.max_stock || 10)) return { label: "FULL", color: "#16a34a", bg: "rgba(22,163,106,0.1)" };
    if (s >= (item.reorder || 1)) return { label: "OK", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
    if (s > 0) return { label: "LOW", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    return { label: "EMPTY", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  };

  const calcOrderQty = (item, s) => {
    if (s >= (item.reorder || 1)) return 0;
    return Math.ceil(Math.max(0, (item.max_stock || 10) - s) / Math.max(1, item.upu || 1));
  };

  // ── Flat items list ──
  const allItems = inventory.flatMap(s => s.items.map(i => ({ ...i, section: s.section })));
  const lowStockItems = allItems.filter(i => (stock[i.id] ?? 0) <= (i.reorder || 1));

  // ── Submit order for a vendor ──
  const submitOrder = (vendorName) => {
    const vendorItems = allItems.filter(i => (i.vendor || i.supplier || "").trim().toLowerCase() === vendorName.toLowerCase());
    const orderLines = vendorItems.map(item => ({
      id: item.id, name: item.name, section: item.section,
      order_unit: item.order_unit, vendor: vendorName,
      qty: calcOrderQty(item, stock[item.id] ?? 0),
      currentStock: stock[item.id] ?? 0,
    })).filter(l => l.qty > 0);
    if (orderLines.length === 0) return;

    const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const getWeekNumber = () => { const d = new Date(); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil((((d - ys) / 86400000) + 1) / 7); };

    const entry = {
      id: `ord_${Date.now()}`, vendor: vendorName,
      weekNumber: getWeekNumber(), year: new Date().getFullYear(),
      day: DAYS[new Date().getDay()], date: new Date().toISOString(),
      lines: orderLines, totalItems: orderLines.length, orderedBy: "Owner",
    };
    const newHist = [entry, ...history];
    saveHistory(newHist);

    // Reset stock for this vendor's items
    const newStock = { ...stock };
    vendorItems.forEach(item => { newStock[item.id] = 0; });
    saveStock(newStock);
    showFlash(`✓ ${vendorName} order submitted`);
  };

  // ── Print order PDF ──
  const printOrderPDF = (entry) => {
    const rows = entry.lines.filter(i => i.qty > 0).map(item =>
      `<tr><td>${item.name}</td><td style="text-align:center">${(item.section || "").replace(/[^\w\s\-&]/g,"").trim()}</td><td style="text-align:center;font-weight:700">${item.qty} ${item.order_unit}</td></tr>`
    ).join("");
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${entry.vendor} — WK${entry.weekNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#111;max-width:700px;margin:0 auto}h1{font-size:20px;margin:0 0 4px}.biz{font-size:24px;font-weight:900;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px}.vendor{font-size:22px;font-weight:700;color:#444;margin:0 0 6px}.meta{color:#666;font-size:12px;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #e5e7eb}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#1e293b;color:#fff;padding:10px 14px;text-align:left}td{padding:10px 14px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f9fafb}.footer{margin-top:20px;color:#999;font-size:11px;border-top:1px solid #e5e7eb;padding-top:12px}@media print{body{padding:16px}}</style></head><body>
      <div class="biz">Tommy's Pizza</div>
      <div class="vendor">${entry.vendor}</div>
      <h1>Order — Week ${entry.weekNumber}</h1>
      <div class="meta">${entry.day} · ${new Date(entry.date).toLocaleDateString()} · ${entry.totalItems} items · Ordered by: ${entry.orderedBy || "Owner"}</div>
      <table><thead><tr><th>Item</th><th style="text-align:center">Location</th><th style="text-align:center">Qty to Order</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">MOE · Make Ordering Easy · Printed ${new Date().toLocaleDateString()}</div>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  };

  // Styles
  const IS = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#f0f2f5", fontSize: 13, fontFamily: "inherit", outline: "none" };
  const VTAB = (active, color = "#00e5ff") => ({ all: "unset", cursor: "pointer", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: active ? color + "15" : "rgba(255,255,255,0.03)", color: active ? color : "rgba(255,255,255,0.35)", border: active ? `1px solid ${color}30` : "1px solid rgba(255,255,255,0.06)" });

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Loading MOE data from Supabase...</div>;

  const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date().getDay();
  const todayVendors = vendors.filter(v => v.orderDays && v.orderDays.includes(today));

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Tabs + flash */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView("inventory")} style={VTAB(view === "inventory")}>Inventory</button>
          <button onClick={() => setView("orders")} style={VTAB(view === "orders", "#f59e0b")}>
            Orders{todayVendors.length > 0 ? ` (${todayVendors.length} today)` : ""}
          </button>
          <button onClick={() => setView("history")} style={VTAB(view === "history", "#a78bfa")}>History ({history.length})</button>
          <button onClick={() => setView("backend")} style={VTAB(view === "backend", "#60a5fa")}>Backend</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {flash && <span style={{ fontSize: 12, fontWeight: 600, color: "#00e5a0", padding: "4px 10px", borderRadius: 6, background: "rgba(0,229,160,0.1)" }}>{flash}</span>}
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: moeStatus === "connected" ? "rgba(0,229,160,0.1)" : "rgba(245,158,11,0.1)", color: moeStatus === "connected" ? "#00e5a0" : "#f59e0b" }}>
            {moeStatus === "connected" ? "LIVE" : "MOCK"}
          </span>
        </div>
      </div>

      {/* ═══ INVENTORY VIEW ═══ */}
      {view === "inventory" && <>
        {/* Order day alert */}
        {todayVendors.length > 0 && (
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div>
              <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: 14 }}>Order day! {todayVendors.map(v => v.name).join(", ")}</div>
              <div style={{ color: "rgba(245,158,11,0.6)", fontSize: 12 }}>Count stock, then go to Orders to submit</div>
            </div>
          </div>
        )}

        {/* Low stock alert */}
        {lowStockItems.length > 0 && (
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>⚠ {lowStockItems.length} items below reorder point</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {lowStockItems.slice(0, 12).map(i => <span key={i.id} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{i.name} ({stock[i.id] ?? 0})</span>)}
            </div>
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ ...IS, padding: "10px 16px", fontSize: 14, maxWidth: 400, marginBottom: 16 }}/>

        {/* Sections */}
        {inventory.map(section => {
          const sectionItems = section.items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
          if (sectionItems.length === 0) return null;
          return (
            <div key={section.section} style={{ marginBottom: 16 }}>
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "8px 16px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase" }}>{section.section}</span>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                {sectionItems.map((item, idx) => {
                  const s = stock[item.id] ?? 0;
                  const status = getStatus(item, s);
                  const orderQty = calcOrderQty(item, s);
                  return (
                    <div key={item.id} style={{ padding: "10px 14px", background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                          <span style={{ color: "#f0f2f5", fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                          {(item.vendor || item.supplier) && <span style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 6px", color: "rgba(255,255,255,0.35)", fontSize: 9 }}>{item.vendor || item.supplier}</span>}
                        </div>
                        <span style={{ background: status.bg, color: status.color, borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 600 }}>{status.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>Stock</span>
                          <button onClick={() => updateStock(item.id, Math.max(0, s - 1))} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <input type="number" value={s} min={0} onChange={e => updateStock(item.id, e.target.value === "" ? 0 : e.target.value)} onFocus={e => e.target.select()}
                            style={{ width: 52, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 6, color: "#f0f2f5", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none" }}/>
                          <button onClick={() => updateStock(item.id, s + 1)} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                        {orderQty > 0 && <span style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>Order {orderQty} {item.order_unit}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {inventory.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>No inventory data. Check MOE connection.</div>}
      </>}

      {/* ═══ ORDERS VIEW ═══ */}
      {view === "orders" && <>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Orders — {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][today]}</h3>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>{todayVendors.length} vendor{todayVendors.length !== 1 ? "s" : ""} ordering today</p>

        {vendors.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>No vendors configured. Set up vendors in the MOE app.</div>}

        {vendors.map(vendor => {
          const vendorItems = allItems.filter(i => (i.vendor || i.supplier || "").trim().toLowerCase() === vendor.name.toLowerCase());
          const orderLines = vendorItems.map(item => ({
            ...item, qty: calcOrderQty(item, stock[item.id] ?? 0), currentStock: stock[item.id] ?? 0,
          }));
          const needsOrder = orderLines.filter(l => l.qty > 0);
          const isToday = vendor.orderDays && vendor.orderDays.includes(today);

          return (
            <div key={vendor.id || vendor.name} style={{ marginBottom: 20 }}>
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>📦 {vendor.name}</span>
                    {isToday && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>TODAY</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {vendorItems.length} items · {needsOrder.length} to order · Orders on {(vendor.orderDays || []).map(d => DAYS_SHORT[d]).join(", ")}
                  </div>
                </div>
                {needsOrder.length > 0 && (
                  <button onClick={() => submitOrder(vendor.name)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#f0f2f5", color: "#080c16", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Submit Order</button>
                )}
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                {needsOrder.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>✅ All stocked up</div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px", padding: "6px 16px", background: "rgba(0,0,0,0.2)" }}>
                      {["Item", "Stock", "Status", "Order"].map(h => <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</span>)}
                    </div>
                    {needsOrder.map((item, idx) => {
                      const status = getStatus(item, item.currentStock);
                      return (
                        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px", padding: "10px 16px", alignItems: "center", background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#f0f2f5" }}>{item.name}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{(item.section || "").replace(/[^\w\s\-&]/g, "").trim()} · {item.order_unit}</div>
                          </div>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{item.currentStock} / {item.max_stock || 10}</span>
                          <span style={{ background: status.bg, color: status.color, borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{status.label}</span>
                          <span style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", borderRadius: 7, padding: "4px 10px", fontSize: 13, fontWeight: 700 }}>{item.qty} {item.order_unit}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </>}

      {/* ═══ HISTORY VIEW ═══ */}
      {view === "history" && <>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Order History</h3>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>Past orders by week</p>

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>No orders yet. Submit an order from the Orders tab.</div>
        ) : (() => {
          // Group by week
          const byWeek = {};
          history.forEach(e => {
            const key = `${e.year}-WK${String(e.weekNumber).padStart(2, "0")}`;
            if (!byWeek[key]) byWeek[key] = [];
            byWeek[key].push(e);
          });
          return Object.entries(byWeek).sort((a, b) => b[0].localeCompare(a[0])).map(([weekKey, entries]) => (
            <div key={weekKey} style={{ marginBottom: 16 }}>
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{weekKey}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{entries.length} order{entries.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                {entries.map((entry, idx) => (
                  <div key={entry.id} style={{ padding: "12px 16px", background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.03)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f2f5" }}>
                        {entry.type === "quick" ? "⚡" : "📦"} {entry.vendor}
                        {entry.type === "quick" && <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(0,229,255,0.1)", color: "#00e5ff" }}>QUICK</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                        {entry.day} · {new Date(entry.date).toLocaleDateString()} · {entry.totalItems} item{entry.totalItems !== 1 ? "s" : ""}
                        {entry.orderedBy ? ` · ${entry.orderedBy}` : ""}
                      </div>
                    </div>
                    <button onClick={() => printOrderPDF(entry)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={e => e.currentTarget.style.color = "#f0f2f5"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>🖨 PDF</button>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </>}

      {/* ═══ BACKEND VIEW ═══ */}
      {view === "backend" && <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Backend — Edit Items</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Click any cell to edit. Changes save to MOE automatically.</p>
          </div>
        </div>

        {inventory.map(section => (
          <div key={section.section} style={{ marginBottom: 16 }}>
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase" }}>{section.section}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{section.items.length} items</span>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 60px 70px 70px", padding: "6px 14px", background: "rgba(0,0,0,0.2)", minWidth: 600 }}>
                {["Item", "Vendor", "Unit", "UPU", "Max", "Reorder"].map(h => <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</span>)}
              </div>
              {section.items.map((item, idx) => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 60px 70px 70px", padding: "8px 14px", alignItems: "center", background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.03)", minWidth: 600 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#f0f2f5" }}>{item.name}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.vendor || item.supplier || "—"}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.order_unit}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.upu || 1}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.max_stock || 10}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.reorder || 1}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}

// ─── P&L REPORTS MODULE ──────────────────────────────────────
function PnLReports() {
  const [period, setPeriod] = useState("weekly");
  const [selectedWeek, setSelectedWeek] = useState("2025-W14");
  const [selectedMonth, setSelectedMonth] = useState("2025-03");
  const [selectedDay, setSelectedDay] = useState("2025-04-05");

  // Fully dynamic — every section is an array of { id, name, amount, freq }
  const [sections, setSections] = useState({
    revenue: [
      { id: "r1", name: "Food Sales", amount: "12450", freq: "weekly" },
      { id: "r2", name: "Beverage Sales", amount: "3200", freq: "weekly" },
      { id: "r3", name: "Catering", amount: "1800", freq: "weekly" },
      { id: "r4", name: "Other", amount: "350", freq: "weekly" },
    ],
    cogs: [
      { id: "c1", name: "Food Cost", amount: "3890", freq: "weekly" },
      { id: "c2", name: "Beverage Cost", amount: "820", freq: "weekly" },
      { id: "c3", name: "Paper & Supplies", amount: "310", freq: "weekly" },
    ],
    labor: [
      { id: "l1", name: "Salary / Management", amount: "4200", freq: "monthly" },
      { id: "l2", name: "Hourly Wages", amount: "2800", freq: "weekly" },
      { id: "l3", name: "Payroll Tax", amount: "630", freq: "monthly" },
      { id: "l4", name: "Benefits", amount: "420", freq: "monthly" },
    ],
    operating: [
      { id: "o1", name: "Rent", amount: "3500", freq: "monthly" },
      { id: "o2", name: "Insurance", amount: "450", freq: "monthly" },
      { id: "o3", name: "Marketing / Ads", amount: "500", freq: "monthly" },
      { id: "o4", name: "Repairs & Maintenance", amount: "200", freq: "monthly" },
      { id: "o5", name: "Supplies", amount: "320", freq: "monthly" },
      { id: "o6", name: "Tech / Software", amount: "150", freq: "monthly" },
      { id: "o7", name: "Miscellaneous", amount: "180", freq: "monthly" },
    ],
    utilities: [
      { id: "u1", name: "Electric", amount: "280", freq: "monthly" },
      { id: "u2", name: "Gas", amount: "150", freq: "monthly" },
      { id: "u3", name: "Water", amount: "85", freq: "monthly" },
      { id: "u4", name: "Phone / Internet", amount: "120", freq: "monthly" },
      { id: "u5", name: "Garbage / Waste", amount: "45", freq: "monthly" },
    ],
  });
  const [adding, setAdding] = useState(null);
  const [newName, setNewName] = useState("");
  const [editingName, setEditingName] = useState(null);
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"
  const [loaded, setLoaded] = useState(false);

  // Load P&L data from Supabase on mount
  useEffect(() => {
    const load = async () => {
      const saved = await sbRead("tommys", "pnl_data");
      if (saved && saved.revenue) {
        setSections(saved);
      }
      setLoaded(true);
    };
    load();
  }, []);

  // Auto-save to Supabase when sections change (debounced)
  useEffect(() => {
    if (!loaded) return; // don't save on initial load
    const timeout = setTimeout(async () => {
      setSaveStatus("saving");
      const ok = await sbWrite("tommys", "pnl_data", sections);
      setSaveStatus(ok ? "saved" : "error");
      setTimeout(() => setSaveStatus(""), 2000);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [sections, loaded]);

  // Conversion
  const toMultiplier = (fromFreq) => {
    const conv = {
      daily:   { daily: 1, weekly: 1/7, monthly: 1/30.44, annual: 1/365 },
      weekly:  { daily: 7, weekly: 1, monthly: 7/30.44, annual: 7/365 },
      monthly: { daily: 30.44, weekly: 30.44/7, monthly: 1, annual: 1/12 },
      annual:  { daily: 365, weekly: 365/7, monthly: 12, annual: 1 },
    };
    return conv[period]?.[fromFreq] || 1;
  };
  const convert = (amount, freq) => (parseFloat(amount) || 0) * toMultiplier(freq);

  // CRUD
  const updateItem = (section, id, field, value) => setSections(s => ({ ...s, [section]: s[section].map(i => i.id === id ? { ...i, [field]: value } : i) }));
  const deleteItem = (section, id) => setSections(s => ({ ...s, [section]: s[section].filter(i => i.id !== id) }));
  const addItem = (section) => {
    if (!newName.trim()) return;
    const id = `${section[0]}${Date.now()}`;
    const freq = ["revenue", "cogs"].includes(section) ? "weekly" : "monthly";
    setSections(s => ({ ...s, [section]: [...s[section], { id, name: newName.trim(), amount: "0", freq }] }));
    setNewName(""); setAdding(null);
  };

  // Totals
  const sectionTotal = (key) => sections[key].reduce((s, i) => s + convert(i.amount, i.freq), 0);
  const totalRevenue = sectionTotal("revenue");
  const totalCogs = sectionTotal("cogs");
  const grossProfit = totalRevenue - totalCogs;
  const totalLabor = sectionTotal("labor");
  const totalUtilities = sectionTotal("utilities");
  const totalOperating = sectionTotal("operating") + totalUtilities;
  const netProfit = grossProfit - totalLabor - totalOperating;
  const pct = (v) => totalRevenue > 0 ? (v / totalRevenue * 100).toFixed(1) : "0.0";
  const periodLabel = period === "daily" ? "/day" : period === "weekly" ? "/wk" : period === "monthly" ? "/mo" : "/yr";

  // Styles
  const IS = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#f0f2f5", fontSize: 13, fontFamily: "inherit", outline: "none", textAlign: "right" };
  const FREQ = { padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "#1a1f33", color: "#f0f2f5", fontSize: 10, fontFamily: "inherit", outline: "none", cursor: "pointer" };
  const VTAB = (active) => ({ all: "unset", cursor: "pointer", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: active ? "rgba(244,114,182,0.1)" : "rgba(255,255,255,0.03)", color: active ? "#f472b6" : "rgba(255,255,255,0.35)", border: active ? "1px solid rgba(244,114,182,0.2)" : "1px solid rgba(255,255,255,0.06)" });
  const optStyle = { background: "#1a1f33", color: "#f0f2f5" };

  const FreqSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={FREQ}>
      <option value="weekly" style={optStyle}>wk</option>
      <option value="monthly" style={optStyle}>mo</option>
      <option value="annual" style={optStyle}>yr</option>
    </select>
  );

  // Render a section
  const renderSection = (key, label, color) => {
    const items = sections[key];
    const total = key === "operating" ? totalOperating : sectionTotal(key);
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 4px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
          <button onClick={() => { setAdding(adding === key ? null : key); setNewName(""); }} style={{ all: "unset", cursor: "pointer", fontSize: 11, color: "#00e5a0", fontFamily: "inherit" }}>{adding === key ? "cancel" : "+ Add"}</button>
        </div>
        {adding === key && (
          <div style={{ display: "flex", gap: 8, marginBottom: 6, paddingLeft: 16 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem(key)} placeholder={`New ${label.toLowerCase()} item...`} style={{ ...IS, textAlign: "left", flex: 1, padding: "6px 10px", fontSize: 12 }} autoFocus/>
            <button onClick={() => addItem(key)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#00e5a0", color: "#080c16", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
          </div>
        )}
        {items.map(item => {
          const converted = convert(item.amount, item.freq);
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 60px 70px 60px 24px", gap: 6, alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              {editingName === item.id ? (
                <input defaultValue={item.name} onBlur={e => { updateItem(key, item.id, "name", e.target.value); setEditingName(null); }} onKeyDown={e => { if (e.key === "Enter") { updateItem(key, item.id, "name", e.target.value); setEditingName(null); } }} style={{ ...IS, textAlign: "left", padding: "4px 8px", fontSize: 12, paddingLeft: 16 }} autoFocus/>
              ) : (
                <span onClick={() => setEditingName(item.id)} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", paddingLeft: 16, cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.1)" }}>{item.name}</span>
              )}
              <input defaultValue={item.amount} onBlur={e => updateItem(key, item.id, "amount", e.target.value)} style={IS}/>
              <FreqSelect value={item.freq} onChange={e => updateItem(key, item.id, "freq", e.target.value)}/>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "right" }}>${converted.toFixed(0)}{periodLabel}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "right" }}>{pct(converted)}%</span>
              <button onClick={() => deleteItem(key, item.id)} style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center" }} onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}>×</button>
            </div>
          );
        })}
        {key !== "operating" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 60px 70px 60px 24px", gap: 6, alignItems: "center", padding: "10px 0", borderTop: "2px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: color || "#f0f2f5" }}>Total {label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: color || "#f0f2f5", textAlign: "right" }}>${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span></span>
            <span style={{ fontSize: 11, color: color || "rgba(255,255,255,0.35)", textAlign: "right" }}>{periodLabel}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: color || "rgba(255,255,255,0.35)", textAlign: "right" }}>{pct(total)}%</span>
            <span></span>
          </div>
        )}
      </>
    );
  };

  // Print
  const printPnL = () => {
    const periodStr = period === "daily" ? selectedDay : period === "weekly" ? `Week ${selectedWeek}` : selectedMonth;
    const printSection = (items, label) => items.map(i => `<tr><td style="padding-left:16px">${i.name}</td><td>$${convert(i.amount, i.freq).toFixed(2)}</td><td>${pct(convert(i.amount, i.freq))}%</td></tr>`).join("") + `<tr class="subtotal"><td>Total ${label}</td><td>$${items.reduce((s,i)=>s+convert(i.amount,i.freq),0).toFixed(2)}</td><td>${pct(items.reduce((s,i)=>s+convert(i.amount,i.freq),0))}%</td></tr>`;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>P&L - ${periodStr}</title><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1a1a1a}h1{font-size:24px;font-weight:700;margin-bottom:4px}h2{font-size:14px;font-weight:700;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px;color:#333;border-bottom:2px solid #ddd;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:8px}td{padding:5px 8px;font-size:13px;border-bottom:1px solid #f0f0f0}td:nth-child(2),td:nth-child(3){text-align:right;width:100px}tr.total td{font-weight:700;border-top:2px solid #333;font-size:14px}tr.subtotal td{font-weight:600;background:#f8f8f8}tr.net td{font-size:16px;font-weight:700}.pos{color:#16a34a}.neg{color:#dc2626}.footer{margin-top:30px;border-top:1px solid #ddd;padding-top:12px;font-size:11px;color:#aaa}@media print{body{padding:20px}}</style></head><body>
    <h1>Profit & Loss Statement</h1><p style="color:#666;margin-bottom:20px">${periodStr} (${period}) — OwnersHQ</p>
    <h2>Revenue</h2><table>${printSection(sections.revenue, "Revenue")}</table>
    <h2>Cost of Goods Sold</h2><table>${printSection(sections.cogs, "COGS")}</table>
    <table><tr class="total"><td>Gross Profit</td><td>$${grossProfit.toFixed(2)}</td><td>${pct(grossProfit)}%</td></tr></table>
    <h2>Labor</h2><table>${printSection(sections.labor, "Labor")}</table>
    <h2>Operating Expenses</h2><table>${sections.operating.map(i => `<tr><td style="padding-left:16px">${i.name}</td><td>$${convert(i.amount, i.freq).toFixed(2)}</td><td>${pct(convert(i.amount, i.freq))}%</td></tr>`).join("")}${sections.utilities.map(u => `<tr><td style="padding-left:32px;color:#666">↳ ${u.name}</td><td>$${convert(u.amount,u.freq).toFixed(2)}</td><td>${pct(convert(u.amount,u.freq))}%</td></tr>`).join("")}<tr><td style="padding-left:16px;font-weight:600">Utilities Total</td><td style="font-weight:600">$${totalUtilities.toFixed(2)}</td><td>${pct(totalUtilities)}%</td></tr><tr class="subtotal"><td>Total Operating</td><td>$${totalOperating.toFixed(2)}</td><td>${pct(totalOperating)}%</td></tr></table>
    <table><tr class="net"><td>Net Profit</td><td class="${netProfit>=0?'pos':'neg'}">$${netProfit.toFixed(2)}</td><td class="${netProfit>=0?'pos':'neg'}">${pct(netProfit)}%</td></tr></table>
    <div class="footer">OwnersHQ P&L Report — ${new Date().toLocaleDateString()}</div><script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Period selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPeriod("daily")} style={VTAB(period === "daily")}>Daily</button>
          <button onClick={() => setPeriod("weekly")} style={VTAB(period === "weekly")}>Weekly</button>
          <button onClick={() => setPeriod("monthly")} style={VTAB(period === "monthly")}>Monthly</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {period === "daily" && <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={{ ...IS, textAlign: "left", width: 160 }}/>}
          {period === "weekly" && <input type="week" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={{ ...IS, textAlign: "left", width: 160 }}/>}
          {period === "monthly" && <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...IS, textAlign: "left", width: 160 }}/>}
          <button onClick={printPnL} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#f472b6", color: "#080c16", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🖨 Print P&L</button>
          {saveStatus && <span style={{ fontSize: 11, fontWeight: 600, color: saveStatus === "saved" ? "#00e5a0" : saveStatus === "error" ? "#ef4444" : "rgba(255,255,255,0.4)", padding: "4px 10px", borderRadius: 6, background: saveStatus === "saved" ? "rgba(0,229,160,0.1)" : saveStatus === "error" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)" }}>{saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save failed"}</span>}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Revenue", value: totalRevenue, color: "#f0f2f5" },
          { label: "COGS", value: totalCogs, color: "#f59e0b" },
          { label: "Gross Profit", value: grossProfit, color: grossProfit >= 0 ? "#00e5a0" : "#ef4444" },
          { label: "Labor", value: totalLabor, color: "#60a5fa" },
          { label: "Operating", value: totalOperating, color: "#a78bfa" },
          { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "#00e5a0" : "#ef4444" },
        ].map((c, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1 }}>${c.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{pct(c.value)}% of revenue · {periodLabel}</div>
          </div>
        ))}
      </div>

      {/* P&L Detail */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 24px" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 60px 70px 60px 24px", gap: 6, padding: "0 0 8px", borderBottom: "2px solid rgba(255,255,255,0.1)", marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5, textTransform: "uppercase" }}>Category</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5, textTransform: "uppercase", textAlign: "right" }}>Amount</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5, textTransform: "uppercase" }}>Freq</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5, textTransform: "uppercase", textAlign: "right" }}>{period}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5, textTransform: "uppercase", textAlign: "right" }}>%</span>
          <span></span>
        </div>

        {/* Revenue */}
        {renderSection("revenue", "Revenue", "#f472b6")}

        {/* COGS */}
        {renderSection("cogs", "Cost of Goods Sold", "#f59e0b")}

        {/* Gross Profit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 60px 70px 60px 24px", gap: 6, alignItems: "center", padding: "12px 0", borderTop: "2px solid rgba(255,255,255,0.1)", borderBottom: "2px solid rgba(255,255,255,0.1)", margin: "4px 0" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: grossProfit >= 0 ? "#00e5a0" : "#ef4444" }}>GROSS PROFIT</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: grossProfit >= 0 ? "#00e5a0" : "#ef4444", textAlign: "right" }}>${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          <span></span>
          <span style={{ fontSize: 11, color: grossProfit >= 0 ? "#00e5a0" : "#ef4444", textAlign: "right" }}>{periodLabel}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: grossProfit >= 0 ? "#00e5a0" : "#ef4444", textAlign: "right" }}>{pct(grossProfit)}%</span>
          <span></span>
        </div>

        {/* Labor */}
        {renderSection("labor", "Labor", "#60a5fa")}

        {/* Operating */}
        {renderSection("operating", "Operating Expenses", "#a78bfa")}

        {/* Utilities sub-section inside Operating */}
        <div style={{ padding: "4px 0 4px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", letterSpacing: 0.5 }}>UTILITIES — ${totalUtilities.toFixed(0)}{periodLabel} ({pct(totalUtilities)}%)</span>
            <button onClick={() => { setAdding(adding === "utilities" ? null : "utilities"); setNewName(""); }} style={{ all: "unset", cursor: "pointer", fontSize: 11, color: "#00e5a0", fontFamily: "inherit" }}>{adding === "utilities" ? "cancel" : "+ Add"}</button>
          </div>
          {adding === "utilities" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 6, paddingLeft: 12 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem("utilities")} placeholder="Utility name..." style={{ ...IS, textAlign: "left", flex: 1, padding: "6px 10px", fontSize: 12 }} autoFocus/>
              <button onClick={() => addItem("utilities")} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#00e5a0", color: "#080c16", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
            </div>
          )}
          {sections.utilities.map(u => {
            const converted = convert(u.amount, u.freq);
            return (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 70px 60px 24px", gap: 6, alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                {editingName === u.id ? (
                  <input defaultValue={u.name} onBlur={e => { updateItem("utilities", u.id, "name", e.target.value); setEditingName(null); }} onKeyDown={e => { if (e.key === "Enter") { updateItem("utilities", u.id, "name", e.target.value); setEditingName(null); }}} style={{ ...IS, textAlign: "left", padding: "4px 8px", fontSize: 11, paddingLeft: 12 }} autoFocus/>
                ) : (
                  <span onClick={() => setEditingName(u.id)} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", paddingLeft: 12, cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>{u.name}</span>
                )}
                <input defaultValue={u.amount} onBlur={e => updateItem("utilities", u.id, "amount", e.target.value)} style={{ ...IS, padding: "6px 10px", fontSize: 12 }}/>
                <FreqSelect value={u.freq} onChange={e => updateItem("utilities", u.id, "freq", e.target.value)}/>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "right" }}>${converted.toFixed(0)}{periodLabel}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "right" }}>{pct(converted)}%</span>
                <button onClick={() => deleteItem("utilities", u.id)} style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center" }} onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}>×</button>
              </div>
            );
          })}
        </div>

        {/* Total Operating (includes utilities) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 60px 70px 60px 24px", gap: 6, alignItems: "center", padding: "10px 0", borderTop: "2px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>Total Operating</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", textAlign: "right" }}>${totalOperating.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          <span></span>
          <span style={{ fontSize: 11, color: "#a78bfa", textAlign: "right" }}>{periodLabel}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", textAlign: "right" }}>{pct(totalOperating)}%</span>
          <span></span>
        </div>

        {/* Net Profit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 60px 70px 60px 24px", gap: 6, alignItems: "center", padding: "14px 0", borderTop: "3px solid rgba(255,255,255,0.15)", marginTop: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: netProfit >= 0 ? "#00e5a0" : "#ef4444" }}>NET PROFIT</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: netProfit >= 0 ? "#00e5a0" : "#ef4444", textAlign: "right" }}>${netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          <span></span>
          <span style={{ fontSize: 12, color: netProfit >= 0 ? "#00e5a0" : "#ef4444", textAlign: "right" }}>{periodLabel}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: netProfit >= 0 ? "#00e5a0" : "#ef4444", textAlign: "right" }}>{pct(netProfit)}%</span>
          <span></span>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 12 }}>Click any name to rename it. All amounts auto-convert to the selected period view.</p>
    </div>
  );
}

// ─── MENU PREVIEW & EXPORT ───────────────────────────────────
function MenuPreview({ categories, menuStyle, setMenuStyle, onClose }) {
  const printRef = { current: null };
  const activeCats = categories.filter(c => c.items.some(i => !i.eightySixed));

  const exportPDF = () => {
    const el = document.getElementById("menu-preview-content");
    if (!el) return;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>Menu</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=Courier+Prime&display=swap');
      body { margin: 0; padding: 0; background: #fff; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const styles = {
    classic: {
      bg: "#faf7f2", headerFont: "'Playfair Display', serif", bodyFont: "'DM Sans', sans-serif",
      catColor: "#2c1810", itemColor: "#1a1a1a", descColor: "#6b5e52", priceColor: "#2c1810",
      divider: "#d4c5b5", accent: "#8b6914",
    },
    modern: {
      bg: "#0c1022", headerFont: "'DM Sans', sans-serif", bodyFont: "'DM Sans', sans-serif",
      catColor: "#00e5ff", itemColor: "#f0f2f5", descColor: "#8a8f9e", priceColor: "#00e5ff",
      divider: "#1a1f33", accent: "#00e5ff",
    },
    minimal: {
      bg: "#ffffff", headerFont: "'DM Sans', sans-serif", bodyFont: "'DM Sans', sans-serif",
      catColor: "#111111", itemColor: "#111111", descColor: "#777777", priceColor: "#111111",
      divider: "#e5e5e5", accent: "#111111",
    },
  };
  const s = styles[menuStyle];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "90%", maxWidth: 700, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--primary)" }}>Menu Preview</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["classic", "modern", "minimal"].map(st => (
                <button key={st} onClick={() => setMenuStyle(st)} style={{
                  all: "unset", cursor: "pointer", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: menuStyle === st ? "rgba(0,229,255,0.1)" : "transparent",
                  color: menuStyle === st ? "#00e5ff" : "var(--muted)",
                  border: menuStyle === st ? "1px solid rgba(0,229,255,0.2)" : "1px solid transparent",
                  textTransform: "capitalize",
                }}>{st}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportPDF} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#080c16", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Print / Export PDF</button>
            <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "var(--muted)", fontSize: 18 }}>×</button>
          </div>
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div id="menu-preview-content" style={{
            background: s.bg, borderRadius: 12, padding: "48px 40px", fontFamily: s.bodyFont,
            minHeight: 500, border: menuStyle === "modern" ? "1px solid #1a1f33" : "1px solid #e0d8ce",
          }}>
            {/* Restaurant name */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h1 style={{ fontFamily: s.headerFont, fontSize: 32, fontWeight: 700, color: s.catColor, margin: 0, letterSpacing: menuStyle === "classic" ? 2 : 0 }}>Tommy's Pizza</h1>
              <div style={{ width: 60, height: 2, background: s.accent, margin: "12px auto", borderRadius: 1 }}/>
              <p style={{ fontFamily: s.bodyFont, fontSize: 12, color: s.descColor, margin: 0, letterSpacing: 1 }}>EST. 1967 — SOUTH RICHMOND HILL, QUEENS</p>
            </div>

            {activeCats.map((cat, ci) => {
              const activeItems = cat.items.filter(i => !i.eightySixed);
              if (!activeItems.length) return null;
              return (
                <div key={cat.id} style={{ marginBottom: 32 }}>
                  {/* Category header */}
                  <div style={{ textAlign: menuStyle === "minimal" ? "left" : "center", marginBottom: 16 }}>
                    <h2 style={{ fontFamily: s.headerFont, fontSize: menuStyle === "classic" ? 22 : 18, fontWeight: menuStyle === "minimal" ? 600 : 700, color: s.catColor, margin: 0, textTransform: menuStyle === "modern" ? "uppercase" : "none", letterSpacing: menuStyle === "modern" ? 3 : menuStyle === "classic" ? 1 : 0 }}>{cat.name}</h2>
                    {menuStyle !== "minimal" && <div style={{ width: 40, height: 1, background: s.divider, margin: menuStyle === "modern" ? "8px 0" : "8px auto", borderRadius: 1 }}/>}
                  </div>

                  {activeItems.map((item, ii) => (
                    <div key={item.id} style={{ marginBottom: menuStyle === "classic" ? 14 : 12, paddingBottom: menuStyle === "minimal" ? 12 : 0, borderBottom: menuStyle === "minimal" && ii < activeItems.length - 1 ? `1px solid ${s.divider}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flex: 1 }}>
                          <span style={{ fontFamily: menuStyle === "classic" ? s.headerFont : s.bodyFont, fontSize: menuStyle === "classic" ? 16 : 14, fontWeight: 600, color: s.itemColor }}>{item.name}</span>
                          {(item.allergens || []).length > 0 && <span style={{ fontSize: 10, color: s.descColor }}>({item.allergens.join(", ")})</span>}
                          {item.seasonal && <span style={{ fontSize: 9, fontWeight: 700, color: s.accent, textTransform: "uppercase" }}>seasonal</span>}
                          {menuStyle === "classic" && <span style={{ flex: 1, borderBottom: `1px dotted ${s.divider}`, minWidth: 20, marginBottom: 3 }}/>}
                        </div>
                        <span style={{ fontFamily: menuStyle === "classic" ? "'Courier Prime', monospace" : s.bodyFont, fontSize: menuStyle === "classic" ? 15 : 14, fontWeight: 600, color: s.priceColor, flexShrink: 0 }}>{item.price ? `$${item.price}` : ""}</span>
                      </div>
                      {item.description && <p style={{ fontSize: 12, color: s.descColor, margin: "3px 0 0", lineHeight: 1.5, fontStyle: menuStyle === "classic" ? "italic" : "normal" }}>{item.description}</p>}
                      {(item.modifiers || []).length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          {item.modifiers.map(mod => (
                            <span key={mod.id} style={{ fontSize: 10, color: s.descColor }}>
                              {mod.group}: {mod.options.filter(o => o.name).map(o => `${o.name}${o.upcharge ? ` +$${o.upcharge}` : ""}`).join(" · ")}
                              {"  "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${s.divider}` }}>
              <p style={{ fontSize: 10, color: s.descColor, margin: 0 }}>Consuming raw or undercooked meats, poultry, seafood, shellfish, or eggs may increase your risk of foodborne illness.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiBox({ label, children, onDismiss }) {
  return <div style={{background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:12,marginTop:8,animation:"slideUp 0.25s ease"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,fontWeight:600,color:"#a78bfa"}}>✨ {label}</span><button onClick={onDismiss} style={{all:"unset",cursor:"pointer",color:"var(--muted)",fontSize:11}}>dismiss</button></div>{children}</div>;
}

// ─── SIDEBAR NAV ITEM ────────────────────────────────────────
function NavItem({ item, active, setActive, collapsed }) {
  const [h, setH] = useState(false);
  const isActive = active === item.id;
  const isMuted = item.id === "logout";
  return (
    <button onClick={() => item.id !== "logout" && setActive(item.id)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%",
      padding: collapsed ? "9px 0" : "9px 12px", justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: 10, background: isActive ? "rgba(0,229,255,0.08)" : h ? "rgba(255,255,255,0.03)" : "transparent",
      color: isActive ? "#00e5ff" : isMuted ? "var(--muted)" : "var(--secondary)",
      fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "all 0.2s",
      borderLeft: collapsed ? "none" : isActive ? "3px solid #00e5ff" : "3px solid transparent", marginBottom: 2,
    }} title={collapsed ? item.label : undefined}>
      <span style={{ display: "flex", flexShrink: 0 }}><Icon name={item.icon} size={17} /></span>
      {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
      {!collapsed && item.status && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00e5a0", marginLeft: "auto", flexShrink: 0 }}/>}
    </button>
  );
}

// ─── SIDEBAR CONTENT ─────────────────────────────────────────
function SidebarContent({ collapsed, setCollapsed, active, setActive }) {
  const tools = NAV.filter(n => n.section === "tools");
  const bottom = NAV.filter(n => n.section === "bottom");
  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
        padding: collapsed ? "20px 0" : "20px 16px",
        cursor: "pointer", transition: "padding 0.3s", justifyContent: collapsed ? "center" : "flex-start",
      }} onClick={() => setCollapsed(!collapsed)}>
        <OwnersHQLogo size={collapsed ? 32 : 38} />
        {!collapsed && (
          <div style={{ animation: "fadeIn 0.25s ease", overflow: "hidden" }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#00e5ff", letterSpacing: 1.2 }}>OwnersHQ</div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: -1 }}>Restaurant Platform</div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: collapsed ? "0 8px" : "0 12px", overflow: "hidden" }}>
        {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 1.5, textTransform: "uppercase", padding: "0 12px", marginBottom: 6 }}>Dashboard</div>}
        <NavItem item={NAV[0]} active={active} setActive={setActive} collapsed={collapsed} />
        <div style={{ height: 8 }}/>
        {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 1.5, textTransform: "uppercase", padding: "0 12px", marginBottom: 6, marginTop: 4 }}>Tools</div>}
        {tools.map(item => <NavItem key={item.id} item={item} active={active} setActive={setActive} collapsed={collapsed} />)}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: collapsed ? "12px 8px" : "12px" }}>
        {bottom.map(item => <NavItem key={item.id} item={item} active={active} setActive={setActive} collapsed={collapsed} />)}
        <NavItem item={{ id: "logout", label: "Sign Out", icon: "logout", section: "bottom" }} active="" setActive={() => {}} collapsed={collapsed} />
      </div>
    </>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function OwnersHQDashboard() {
  const [active, setActive] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [ingredients, setIngredients] = useState(MOE_INVENTORY_MOCK);
  const [prepItems, setPrepItems] = useState(INITIAL_PREP_ITEMS);
  const [recipes, setRecipes] = useState(INITIAL_RECIPES);
  const [moeStatus, setMoeStatus] = useState("loading"); // loading | connected | fallback

  // Load MOE inventory from Supabase on mount
  useEffect(() => {
    setMounted(true);
    const loadMoe = async () => {
      try {
        const addedData = await sbRead("tommys", "added");
        const stockData = await sbRead("tommys", "stock");
        const itemData = await sbRead("tommys", "itemdata");
        
        if (addedData && typeof addedData === "object") {
          const parsed = [];
          // addedData is organized by section name, each containing an array of items
          Object.entries(addedData).forEach(([sectionName, items]) => {
            if (Array.isArray(items)) {
              items.forEach(item => {
                if (!item || !item.name) return;
                // Get any overrides from itemdata
                const overrides = itemData?.[String(item.id)] || {};
                const stockLevel = stockData?.[String(item.id)] ?? 0;
                parsed.push({
                  id: `moe-${item.id}`,
                  name: item.name,
                  vendor: overrides.supplier || item.supplier || "",
                  purchasePrice: String(item.price || item.purchasePrice || "0"),
                  unitsPerCase: item.upu || overrides.upu || 1,
                  unitType: item.order_unit || overrides.order_unit || "each",
                  costPerUnit: String(item.costPerUnit || "0"),
                  category: sectionName.replace(/[\u{1F300}-\u{1FAD6}]/gu, "").trim(),
                  stock: typeof stockLevel === "object" ? stockLevel.qty || 0 : stockLevel,
                  reorderAt: overrides.reorder || item.reorder || 5,
                  maxStock: overrides.max_stock || item.max_stock || 10,
                  hidden: overrides._hidden || false,
                  source: "moe",
                });
              });
            }
          });
          if (parsed.length > 0) {
            setIngredients(parsed.filter(i => !i.hidden));
            setMoeStatus("connected");
            console.log(`MOE: Loaded ${parsed.length} items from Supabase`);
          } else {
            setMoeStatus("fallback");
            console.log("MOE: No items found in added data, using mock");
          }
        } else {
          setMoeStatus("fallback");
          console.log("MOE: Could not read added data, using mock");
        }
      } catch (e) {
        setMoeStatus("fallback");
        console.log("MOE: Connection error, using mock", e);
      }
    };
    loadMoe();
  }, []);
  const currentMod = NAV.find(n => n.id === active);

  return (
    <div style={{
      "--primary": "#f0f2f5", "--secondary": "rgba(255,255,255,0.65)", "--muted": "rgba(255,255,255,0.35)",
      "--border": "rgba(255,255,255,0.06)", "--surface": "#0c1022", "--bg": "#080c16",
      display: "flex", minHeight: "100vh", fontFamily: "'Outfit', 'DM Sans', sans-serif",
      background: "var(--bg)", color: "var(--primary)", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideX { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        @media (max-width: 768px) { .sidebar-d { display: none !important; } .mob-btn { display: flex !important; } }
        @media (min-width: 769px) { .mob-btn { display: none !important; } .mob-overlay { display: none !important; } }
      `}</style>

      {/* Sidebar Desktop */}
      <nav className="sidebar-d" style={{
        width: collapsed ? 72 : 248, background: "var(--surface)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0, overflow: "hidden", zIndex: 20,
      }}>
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} active={active} setActive={setActive} />
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mob-overlay" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }} onClick={() => setMobileOpen(false)}>
          <nav style={{ width: 260, height: "100%", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", animation: "slideX 0.25s ease" }} onClick={e => e.stopPropagation()}>
            <SidebarContent collapsed={false} setCollapsed={() => {}} active={active} setActive={(id) => { setActive(id); setMobileOpen(false); }} />
          </nav>
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Top Bar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", height: 60, flexShrink: 0, borderBottom: "1px solid var(--border)", background: "var(--surface)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="mob-btn" onClick={() => setMobileOpen(true)} style={{ all: "unset", cursor: "pointer", color: "var(--secondary)", display: "none", alignItems: "center" }}>
              <Icon name="menu" size={22} />
            </button>
            <span style={{ fontSize: 18 }}>🏪</span>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Tommy's Pizza</span>
              <span style={{ fontSize: 9, marginLeft: 8, padding: "2px 7px", borderRadius: 5, background: "rgba(0,229,160,0.12)", color: "#00e5a0", fontWeight: 700, letterSpacing: 0.5, verticalAlign: "middle" }}>PRO</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[["search"], ["bell"]].map(([ic], i) => (
              <button key={i} style={{
                all: "unset", cursor: "pointer", position: "relative", width: 36, height: 36, borderRadius: 10,
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)",
              }}>
                <Icon name={ic} size={16} />
                {ic === "bell" && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "2px solid var(--surface)" }}/>}
              </button>
            ))}
            <div style={{
              width: 36, height: 36, borderRadius: 10, marginLeft: 4,
              background: "linear-gradient(135deg, #00e5ff, #00b8d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, color: "#080c16", cursor: "pointer",
            }}>R</div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
          <div style={{ marginBottom: 28, animation: "slideX 0.35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3 }}>{currentMod?.label || "Overview"}</h1>
              {moeStatus === "connected" && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(0,229,160,0.1)", color: "#00e5a0", letterSpacing: 0.5 }}>MOE CONNECTED</span>}
              {moeStatus === "fallback" && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(245,158,11,0.1)", color: "#f59e0b", letterSpacing: 0.5 }}>MOE MOCK DATA</span>}
              {moeStatus === "loading" && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>CONNECTING...</span>}
            </div>
            {active === "overview" && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Business health, action items, and what's happening across your restaurant.</p>}
          </div>

          {active === "overview" && mounted && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>

              {/* ── BUSINESS HEALTH SCORES ──────────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Food Cost", value: "28.4%", target: "Target: 28-32%", pct: 72, color: "#00e5a0", status: "good" },
                  { label: "Labor Cost", value: "31.2%", target: "Target: 25-30%", pct: 55, color: "#f59e0b", status: "warn" },
                  { label: "Avg Ticket", value: "$16.04", target: "+$1.20 vs last month", pct: 80, color: "#00e5ff", status: "good" },
                  { label: "Waste", value: "$142", target: "This week", pct: 35, color: "#a78bfa", status: "good" },
                  { label: "ROAS", value: "0.5x", target: "Target: 3.0x", pct: 17, color: "#f472b6", status: "bad" },
                ].map((h, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                    borderRadius: 14, padding: "18px 20px",
                    animation: `slideUp 0.45s ease ${0.05 + i * 0.05}s both`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--secondary)" }}>{h.label}</span>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: h.status === "good" ? "#00e5a0" : h.status === "warn" ? "#f59e0b" : "#ef4444",
                      }}/>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--primary)", letterSpacing: -0.5, lineHeight: 1 }}>{h.value}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, marginBottom: 10 }}>{h.target}</div>
                    {/* Progress bar */}
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{
                        height: "100%", borderRadius: 2, background: h.color, width: `${h.pct}%`,
                        transition: "width 1s ease",
                      }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── ACTION ITEMS + ACTIVITY (side by side) ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* Action Items */}
                <div style={{
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px",
                  animation: "slideUp 0.5s ease 0.3s both",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Needs Attention</h3>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      background: "rgba(239,68,68,0.12)", color: "#ef4444",
                    }}>5 items</span>
                  </div>
                  {[
                    { icon: "package", text: "Mozzarella below reorder point — 12 lbs left", priority: "high", module: "moe", accent: "#ef4444" },
                    { icon: "calculator", text: "Labor cost running 1.2% over target this week", priority: "medium", module: "costing", accent: "#f59e0b" },
                    { icon: "clipboard", text: "3 recipe cards missing cost data", priority: "medium", module: "recipes", accent: "#f59e0b" },
                    { icon: "users", text: "PM prep log not submitted — close of shift", priority: "high", module: "staff", accent: "#ef4444" },
                    { icon: "utensils", text: "Spring menu prices need final review", priority: "low", module: "menu", accent: "#60a5fa" },
                  ].map((item, i) => (
                    <div key={i}
                      onClick={() => setActive(item.module)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "11px 0", cursor: "pointer",
                        borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: item.accent + "12", display: "flex", alignItems: "center", justifyContent: "center",
                        color: item.accent, flexShrink: 0,
                      }}>
                        <Icon name={item.icon} size={14} />
                      </div>
                      <span style={{ flex: 1, fontSize: 12.5, color: "var(--secondary)", lineHeight: 1.4 }}>{item.text}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                        background: item.accent + "15", color: item.accent, textTransform: "uppercase", letterSpacing: 0.5,
                      }}>{item.priority}</span>
                    </div>
                  ))}
                </div>

                {/* Activity Feed */}
                <div style={{
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px",
                  animation: "slideUp 0.5s ease 0.35s both",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Activity Feed</h3>
                    <span style={{ fontSize: 11, color: "#00e5ff", fontWeight: 600, cursor: "pointer" }}>View all</span>
                  </div>
                  {[
                    { dot: "#00e5ff", icon: "package", text: "Sysco order placed — $847.20", time: "12m ago" },
                    { dot: "#00e5a0", icon: "users", text: "AM prep log submitted by Maria", time: "1h ago" },
                    { dot: "#a78bfa", icon: "utensils", text: "Spring Veggie Pizza added to menu", time: "3h ago" },
                    { dot: "#f59e0b", icon: "calculator", text: "Weekly food cost report generated: 28.4%", time: "5h ago" },
                    { dot: "#00e5a0", icon: "clipboard", text: "Vodka Sauce batch recipe created", time: "8h ago" },
                    { dot: "#60a5fa", icon: "users", text: "PM shift schedule updated", time: "12h ago" },
                    { dot: "#00e5ff", icon: "package", text: "Flour inventory auto-counted", time: "1d ago" },
                  ].map((a, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                      borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: a.dot + "12", display: "flex", alignItems: "center", justifyContent: "center",
                        color: a.dot, flexShrink: 0,
                      }}>
                        <Icon name={a.icon} size={12} />
                      </div>
                      <span style={{ flex: 1, fontSize: 12, color: "var(--secondary)", lineHeight: 1.4 }}>{a.text}</span>
                      <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "menu" && <MenuBuilder categories={categories} setCategories={setCategories} />}
          {active === "recipes" && <RecipeCards ingredients={ingredients} setIngredients={setIngredients} prepItems={prepItems} setPrepItems={setPrepItems} recipes={recipes} setRecipes={setRecipes} categories={categories} setCategories={setCategories} />}
          {active === "costing" && <PrepCosting categories={categories} setCategories={setCategories} ingredients={ingredients} setIngredients={setIngredients} prepItems={prepItems} setPrepItems={setPrepItems} recipes={recipes} setRecipes={setRecipes} />}
          {active === "pnl" && <PnLReports />}
          {active === "moe" && <MoeModule ingredients={ingredients} setIngredients={setIngredients} moeStatus={moeStatus} />}
          {active !== "overview" && active !== "menu" && active !== "costing" && active !== "recipes" && active !== "pnl" && active !== "moe" && currentMod && <ModulePlaceholder mod={currentMod} />}
        </div>
      </main>
    </div>
  );
}
