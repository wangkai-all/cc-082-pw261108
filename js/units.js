// 单位体系：质量 / 体积 / 计数 / 包装规格，统一换算到「克」参与成本计算。
// 约定：
//  - 配方用量一律按「净料（可食部）」计；
//  - 采购批次按「毛料（采购状态）」计；
//  - 净料 → 毛料 通过 可食比例(yieldRate) 与 损耗率(lossRate) 桥接（见 costing.js）。

export const MASS_UNITS = { g: 1, kg: 1000 }; // 相对 g
export const VOLUME_UNITS = { ml: 1, L: 1000 }; // 相对 ml
export const COUNT_UNITS = ['个', '枚', '只', '片', '根'];

export const isMass = (u) => Object.prototype.hasOwnProperty.call(MASS_UNITS, u);
export const isVolume = (u) => Object.prototype.hasOwnProperty.call(VOLUME_UNITS, u);
export const isCount = (u) => COUNT_UNITS.includes(u);
export const isPack = (ing, u) => Boolean(ing.packageSpec) && ing.packageSpec.unit === u;

export function unitKind(ing, unit) {
  if (isMass(unit)) return 'mass';
  if (isVolume(unit)) return 'volume';
  if (isCount(unit)) return 'count';
  if (isPack(ing, unit)) return 'pack';
  return null;
}

/** 某食材在配方中可用的单位（按食材属性动态给出） */
export function availableUnits(ing) {
  const units = ['g', 'kg'];
  if (ing.density) units.push('ml', 'L');
  if (ing.pieceWeight) units.push('个');
  if (ing.packageSpec) units.push(ing.packageSpec.unit);
  return units;
}

/** 一个包装单位 = 多少毛料克 */
export function packToGrossGrams(ing) {
  const p = ing.packageSpec;
  if (!p) throw new Error(`${ing.name} 没有包装规格`);
  if (isMass(p.qtyUnit)) return p.qty * MASS_UNITS[p.qtyUnit];
  if (isVolume(p.qtyUnit)) {
    if (!ing.density) throw new Error(`${ing.name} 缺少密度(g/ml)，包装规格无法换算`);
    return p.qty * VOLUME_UNITS[p.qtyUnit] * ing.density;
  }
  throw new Error(`不支持的包装含量单位: ${p.qtyUnit}`);
}

/** 配方用量 → 净料克数（可食部） */
export function toNetGrams(ing, qty, unit) {
  const kind = unitKind(ing, unit);
  if (!kind) throw new Error(`${ing.name} 不支持单位「${unit}」`);
  switch (kind) {
    case 'mass':
      return qty * MASS_UNITS[unit];
    case 'volume':
      if (!ing.density) throw new Error(`${ing.name} 缺少密度(g/ml)，体积单位无法参与换算`);
      return qty * VOLUME_UNITS[unit] * ing.density;
    case 'count':
      if (!ing.pieceWeight) throw new Error(`${ing.name} 缺少单件净重(g)，无法按「${unit}」换算`);
      return qty * ing.pieceWeight;
    case 'pack': // 包装内是毛料，净料 = 毛料 × 可食比例
      return packToGrossGrams(ing) * qty * ing.yieldRate;
    default:
      throw new Error(`未知单位类型: ${kind}`);
  }
}

/** 采购数量 → 毛料克数（用于批次折合单价） */
export function toGrossGrams(ing, qty, unit) {
  const kind = unitKind(ing, unit);
  if (kind === 'mass') return qty * MASS_UNITS[unit];
  if (kind === 'volume') {
    if (!ing.density) throw new Error(`${ing.name} 缺少密度(g/ml)，体积单位无法参与换算`);
    return qty * VOLUME_UNITS[unit] * ing.density;
  }
  if (kind === 'pack') return packToGrossGrams(ing) * qty;
  throw new Error(`采购数量不支持单位「${unit}」，请按质量 / 体积 / 包装单位录入`);
}

/** 净料克数 → 指定单位的数量（换算建议/替换时用） */
export function fromNetGrams(ing, grams, unit) {
  const kind = unitKind(ing, unit);
  if (!kind) throw new Error(`${ing.name} 不支持单位「${unit}」`);
  switch (kind) {
    case 'mass':
      return grams / MASS_UNITS[unit];
    case 'volume':
      if (!ing.density) throw new Error(`${ing.name} 缺少密度(g/ml)，体积单位无法参与换算`);
      return grams / ing.density / VOLUME_UNITS[unit];
    case 'count':
      if (!ing.pieceWeight) throw new Error(`${ing.name} 缺少单件净重(g)，无法按「${unit}」换算`);
      return grams / ing.pieceWeight;
    case 'pack':
      return grams / (packToGrossGrams(ing) * ing.yieldRate);
    default:
      throw new Error(`未知单位类型: ${kind}`);
  }
}

/** 按单位选择合适的小数位 */
export function roundForUnit(qty, unit) {
  if (unit === 'kg' || unit === 'L') return Math.round(qty * 1000) / 1000;
  if (isCount(unit)) return Math.round(qty * 10) / 10;
  return Math.round(qty * 10) / 10;
}

export const round1 = (n) => Math.round(n * 10) / 10;
export const round2 = (n) => Math.round(n * 100) / 100;

export function fmtGrams(g) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${round1(g)} g`;
}
