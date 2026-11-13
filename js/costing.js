// 成本计算引擎（纯函数，不依赖 DOM / 状态，可单测）
import { toNetGrams, toGrossGrams } from './units.js';

/** 价格情景：mode 加权/最新；batchPick 指定批次；priceAdjustPct 模拟涨跌% */
export const DEFAULT_PRICING = Object.freeze({ mode: 'weighted', batchPick: {}, priceAdjustPct: {} });

export const batchGrossGrams = (ing, batch) => toGrossGrams(ing, batch.qty, batch.unit);
/** 批次折合单价：元 / 毛料克 */
export const batchUnitPrice = (ing, batch) => batch.totalPrice / batchGrossGrams(ing, batch);

export function ingredientBatches(ing, batches) {
  return batches.filter((b) => b.ingredientId === ing.id);
}

/** 全部批次加权成本：元 / 毛料克 */
export function weightedUnitCost(ing, batches) {
  const list = ingredientBatches(ing, batches);
  const gross = list.reduce((s, b) => s + batchGrossGrams(ing, b), 0);
  if (!gross) return 0;
  return list.reduce((s, b) => s + b.totalPrice, 0) / gross;
}

export function latestBatch(ing, batches) {
  const list = ingredientBatches(ing, batches);
  if (!list.length) return null;
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
}

/**
 * 按价格情景解析食材单位成本。
 * 优先级：指定批次 > (加权 | 最新)，再叠加模拟涨跌%。
 * 返回 { unitCost, base, source, batch, adjustPct }，unitCost 单位：元 / 毛料克。
 */
export function resolveUnitCost(ing, batches, pricing = DEFAULT_PRICING) {
  let base = null;
  let source = pricing.mode === 'latest' ? 'latest' : 'weighted';
  let batch = null;

  const pickId = pricing.batchPick?.[ing.id];
  if (pickId) {
    batch = batches.find((b) => b.id === pickId && b.ingredientId === ing.id) || null;
    if (batch) {
      base = batchUnitPrice(ing, batch);
      source = 'batch';
    }
  }
  if (base == null) {
    if (pricing.mode === 'latest') {
      batch = latestBatch(ing, batches);
      base = batch ? batchUnitPrice(ing, batch) : 0;
    } else {
      base = weightedUnitCost(ing, batches);
    }
  }
  const adjustPct = Number(pricing.priceAdjustPct?.[ing.id] ?? 0) || 0;
  return { unitCost: base * (1 + adjustPct / 100), base, source, batch, adjustPct };
}

/** 历史成本：销售当日及之前批次的加权价（当日之前无批次则退化为全部批次） */
export function historicalUnitCost(ing, batches, asOfDate) {
  const all = ingredientBatches(ing, batches);
  const past = all.filter((b) => b.date <= asOfDate);
  const use = past.length ? past : all;
  const gross = use.reduce((s, b) => s + batchGrossGrams(ing, b), 0);
  if (!gross) return 0;
  return use.reduce((s, b) => s + b.totalPrice, 0) / gross;
}

export const effectiveLossRate = (ing, line) => line.lossRate ?? ing.lossRate ?? 0;

/** 单行配方成本：净料 → 毛料（÷可食比例 ÷(1-损耗率)）→ × 单位成本 */
export function costLine(ing, line, unitCostPerGrossG) {
  const netG = toNetGrams(ing, line.qty, line.unit);
  const lossRate = effectiveLossRate(ing, line);
  const grossG = netG / ing.yieldRate / (1 - lossRate);
  return { netG, grossG, lossRate, cost: grossG * unitCostPerGrossG };
}

/**
 * 整份配方成本。costOf(ing) → 元/毛料克。
 * 返回 { lines: [...含净料/毛料/小计], total }
 */
export function costRecipe(version, ingById, costOf) {
  const lines = version.lines.map((line) => {
    const ing = ingById[line.ingredientId];
    if (!ing) throw new Error(`配方引用了不存在的食材: ${line.ingredientId}`);
    const unitCost = costOf(ing);
    const r = costLine(ing, line, unitCost);
    return { ...line, name: ing.name, allergens: ing.allergens || [], unitCostPerGrossG: unitCost, ...r };
  });
  return { lines, total: lines.reduce((s, l) => s + l.cost, 0) };
}

export function marginOf(price, cost) {
  const profit = price - cost;
  return {
    profit,
    rate: price > 0 ? profit / price : 0,
    costRate: price > 0 ? cost / price : 0,
  };
}

/** 配方过敏原合集 */
export function recipeAllergens(version, ingById) {
  const set = new Set();
  for (const l of version.lines) {
    const ing = ingById[l.ingredientId];
    (ing?.allergens || []).forEach((a) => set.add(a));
  }
  return [...set];
}

/**
 * 食材替换的换算建议：以原行的「净料克重」为锚，默认 1:1 等净重替换。
 * 绝不把原单位数值直接照搬（ml≠g、个≠g、干货≠鲜货），
 * 界面需在此建议之上由用户确认换算比率与目标单位。
 */
export function suggestSubstitution(oldIng, oldLine, newIng) {
  const netG = toNetGrams(oldIng, oldLine.qty, oldLine.unit);
  void newIng;
  return { qty: Math.round(netG * 10) / 10, unit: 'g', netG };
}
