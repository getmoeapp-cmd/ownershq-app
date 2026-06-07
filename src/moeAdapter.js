// ═══════════════════════════════════════════════════════════════════════════════
// moeAdapter.js — Read MOE data from inside OwnersHQ
//
// MOE stores everything in the `moe_data` Supabase table keyed by:
//   - group_id  = the restaurant account
//   - data_key  = "inventory" | "priceHistory" | "history" | "stockSnapshots" | etc.
//   - data_value = the JSON blob for that key
//
// This adapter hides those internals so OwnersHQ can just call clean functions
// like getInventoryWithPrices(groupId). If MOE's data shape ever changes, only
// this file needs updating — every cost calculation in OwnersHQ keeps working.
//
// Usage:
//   import { getInventoryWithPrices, getRecentOrders, getWeeklyUsage } from './moeAdapter';
//   const items = await getInventoryWithPrices('tommys');
//   const sauce = items.find(i => i.name === 'Crushed Tomatoes');
//   const ouncesUsed = 6;
//   const dollarsPerOunce = sauce.pricePerPiece / sauce.piecesPerOunce; // if you store the conversion
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// Point this at the same Supabase project MOE uses
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsvlxosbbevzyvegbqry.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Low-level: read one key from moe_data ──────────────────────────────────────
const readMoeKey = async (groupId, dataKey, fallback = null) => {
  const { data, error } = await supabase
    .from('moe_data')
    .select('data_value')
    .eq('group_id', groupId)
    .eq('data_key', dataKey)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.data_value;
};

// ── Shape helpers (mirror MOE internals) ───────────────────────────────────────
// Inventory is sections: [{ section, items: [...] }]
const flatItems = (inventory) => {
  if (!Array.isArray(inventory)) return [];
  return inventory.flatMap(s => (s.items || []).map(i => ({ ...i, section: s.section })));
};

// priceHistory is keyed by itemId: { [itemId]: [{ price, perUnit, qty, unit, date, vendor, source }] }
// "perUnit" = price per INDIVIDUAL unit (e.g. per pack inside a case)
const latestPriceFor = (priceHistory, itemId) => {
  const entries = priceHistory?.[itemId];
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — what OwnersHQ calls
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get every inventory item for a restaurant, with current prices attached.
 * This is the bread-and-butter for cost calculations.
 *
 * Returns an array of:
 *   {
 *     id, name, section, vendor, orderUnit, upu,
 *     pricePerOrderUnit,   // e.g. $45 per case
 *     pricePerPiece,       // e.g. $11.25 per pack (case price / upu)
 *     priceUpdatedAt,      // ISO date of the last price update
 *     priceSource,         // "manual" | "order-review" | etc.
 *   }
 */
export const getInventoryWithPrices = async (groupId) => {
  const [inventory, priceHistory] = await Promise.all([
    readMoeKey(groupId, 'inventory', []),
    readMoeKey(groupId, 'priceHistory', {}),
  ]);
  return flatItems(inventory).map(item => {
    const upu = item.upu || 1;
    const latest = latestPriceFor(priceHistory, item.id);
    const pricePerPiece = latest?.perUnit ?? null;
    return {
      id: item.id,
      name: item.name,
      section: item.section,
      vendor: item.vendor || null,
      orderUnit: item.order_unit || null,
      upu,
      maxStock: item.max_stock || 0,
      pricePerPiece,
      pricePerOrderUnit: pricePerPiece !== null ? +(pricePerPiece * upu).toFixed(2) : null,
      priceUpdatedAt: latest?.date || null,
      priceSource: latest?.source || null,
    };
  });
};

/**
 * Get recent orders, optionally filtered by vendor or week count.
 * Useful for spend trends, vendor analysis, food cost %.
 *
 * Returns an array of:
 *   { id, vendor, date, weekNumber, year, totalItems, total, lines: [...] }
 */
export const getRecentOrders = async (groupId, { weeks = 4, vendor = null } = {}) => {
  const history = await readMoeKey(groupId, 'history', []);
  if (!Array.isArray(history)) return [];
  const cutoff = Date.now() - (weeks * 7 * 86400000);
  return history
    .filter(o => new Date(o.date).getTime() >= cutoff)
    .filter(o => !vendor || o.vendor === vendor)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Get the weekly usage breakdown for every item (last N weeks).
 * Computed the same way MOE Insights does it:
 *   usage = previous week's count + units received - this week's count
 *
 * Returns an array of:
 *   {
 *     itemId, name, section, orderUnit, upu,
 *     weeklyUsage: [{ weekKey, individualUnits, orderUnits }],
 *     avgPerWeek,    // in order units
 *     peakPerWeek,   // in order units
 *   }
 */
export const getWeeklyUsage = async (groupId, weeksBack = 4) => {
  const [inventory, snapshots, usageLog] = await Promise.all([
    readMoeKey(groupId, 'inventory', []),
    readMoeKey(groupId, 'stockSnapshots', {}),
    readMoeKey(groupId, 'usageLog', {}),
  ]);
  const items = flatItems(inventory);
  const snapWeeks = Object.keys(snapshots || {}).sort();

  // Units received for an item during a given week (from orders placed that week)
  const receivedUnitsFor = (itemId, weekKey, upu) => {
    let units = 0;
    const weekData = usageLog?.[weekKey] || {};
    Object.values(weekData).forEach(itemMap => {
      if (itemMap?.[itemId]) units += (itemMap[itemId].qty || 0) * upu;
    });
    return units;
  };

  return items.map(item => {
    const upu = item.upu || 1;
    const weeklyUsage = [];
    for (let i = 0; i < snapWeeks.length - 1; i++) {
      const wkA = snapWeeks[i], wkB = snapWeeks[i + 1];
      const startCount = snapshots[wkA]?.[item.id];
      const endCount = snapshots[wkB]?.[item.id];
      if (startCount === undefined || endCount === undefined) continue;
      const received = receivedUnitsFor(item.id, wkA, upu);
      const usageIndividuals = startCount + received - endCount;
      if (usageIndividuals < 0) continue;
      weeklyUsage.push({
        weekKey: wkB,
        individualUnits: usageIndividuals,
        orderUnits: +(usageIndividuals / upu).toFixed(2),
      });
    }
    const recent = weeklyUsage.slice(-weeksBack);
    const orderUnitValues = recent.map(w => w.orderUnits);
    const avgPerWeek = orderUnitValues.length
      ? +(orderUnitValues.reduce((a, b) => a + b, 0) / orderUnitValues.length).toFixed(2)
      : null;
    const peakPerWeek = orderUnitValues.length ? Math.max(...orderUnitValues) : null;
    return {
      itemId: item.id,
      name: item.name,
      section: item.section,
      orderUnit: item.order_unit,
      upu,
      weeklyUsage: recent,
      avgPerWeek,
      peakPerWeek,
    };
  });
};

/**
 * Convenience: cost a recipe.
 *
 * Pass a list of recipe lines: [{ itemId, quantityInPieces }]
 * Returns: { totalCost, perItem: [...], missingPrices: [...] }
 *
 * Note: "quantityInPieces" means individual units (packs, blocks, lbs, etc. —
 * whatever MOE's "piece" is for that item). OwnersHQ's recipe builder is
 * responsible for converting "4oz mozzarella" → "0.25 of a 1lb block" before
 * calling this. We keep this adapter focused on MOE data only.
 */
export const costRecipe = async (groupId, recipeLines) => {
  const items = await getInventoryWithPrices(groupId);
  const byId = Object.fromEntries(items.map(i => [i.id, i]));
  const perItem = [];
  const missingPrices = [];
  let totalCost = 0;
  for (const line of recipeLines) {
    const item = byId[line.itemId];
    if (!item) { missingPrices.push({ itemId: line.itemId, reason: 'item not found' }); continue; }
    if (item.pricePerPiece === null) { missingPrices.push({ itemId: line.itemId, name: item.name, reason: 'no price on file' }); continue; }
    const cost = +(item.pricePerPiece * line.quantityInPieces).toFixed(4);
    totalCost += cost;
    perItem.push({ itemId: item.id, name: item.name, quantity: line.quantityInPieces, unitPrice: item.pricePerPiece, cost });
  }
  return { totalCost: +totalCost.toFixed(2), perItem, missingPrices };
};
