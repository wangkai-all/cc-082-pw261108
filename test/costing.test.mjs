import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toNetGrams, toGrossGrams, availableUnits } from '../js/units.js';
import {
  batchUnitPrice,
  weightedUnitCost,
  resolveUnitCost,
  historicalUnitCost,
  costLine,
  costRecipe,
  marginOf,
  suggestSubstitution,
  DEFAULT_PRICING,
} from '../js/costing.js';
import { SEED } from '../js/data.js';

const ing = Object.fromEntries(SEED.ingredients.map((i) => [i.id, i]));
const batches = SEED.batches;

test('质量单位换算：kg ↔ g', () => {
  assert.equal(toNetGrams(ing.chicken_thigh, 0.18, 'kg'), 180);
  assert.equal(toNetGrams(ing.chicken_thigh, 180, 'g'), 180);
});

test('体积单位经密度换算：30ml 食用油 = 27.6g 净料', () => {
  assert.ok(Math.abs(toNetGrams(ing.oil, 30, 'ml') - 27.6) < 1e-9);
});

test('计数单位经单件净重换算：2 个鸡蛋 = 100g 净料', () => {
  assert.equal(toNetGrams(ing.egg, 2, '个'), 100);
});

test('无密度食材拒绝体积单位', () => {
  assert.throws(() => toNetGrams(ing.chicken_thigh, 100, 'ml'), /密度/);
});

test('包装规格参与换算：1 桶油(10L) = 9200g 毛料', () => {
  assert.equal(toGrossGrams(ing.oil, 1, '桶'), 9200);
  assert.equal(toGrossGrams(ing.egg, 2, '箱'), 30000);
});

test('批次折合单价：鸡蛋 b-egg-1 = 9 元/kg', () => {
  const b = batches.find((x) => x.id === 'b-egg-1');
  assert.ok(Math.abs(batchUnitPrice(ing.egg, b) * 1000 - 9) < 1e-9);
});

test('加权成本保留旧报价：鸡蛋三批加权 = 573 元 / 60kg', () => {
  const w = weightedUnitCost(ing.egg, batches);
  assert.ok(Math.abs(w * 1000 - 573 / 60) < 1e-9);
});

test('价格情景：最新批次价', () => {
  const { unitCost, source } = resolveUnitCost(ing.egg, batches, { mode: 'latest', batchPick: {}, priceAdjustPct: {} });
  assert.equal(source, 'latest');
  assert.ok(Math.abs(unitCost * 1000 - 10) < 1e-9); // b-egg-3: 150 元 / 15kg
});

test('价格情景：指定批次优先于加权', () => {
  const { unitCost, source } = resolveUnitCost(ing.egg, batches, {
    mode: 'weighted',
    batchPick: { egg: 'b-egg-1' },
    priceAdjustPct: {},
  });
  assert.equal(source, 'batch');
  assert.ok(Math.abs(unitCost * 1000 - 9) < 1e-9);
});

test('价格情景：模拟涨跌% 叠加在基准之上', () => {
  const { unitCost } = resolveUnitCost(ing.egg, batches, {
    mode: 'weighted',
    batchPick: {},
    priceAdjustPct: { egg: 10 },
  });
  assert.ok(Math.abs(unitCost * 1000 - (573 / 60) * 1.1) < 1e-9);
});

test('历史成本只取销售当日及之前的批次', () => {
  const aug = historicalUnitCost(ing.egg, batches, '2026-08-31');
  assert.ok(Math.abs(aug * 1000 - 9) < 1e-9); // 只有 b-egg-1
  const oct = historicalUnitCost(ing.egg, batches, '2026-10-31');
  assert.ok(Math.abs(oct * 1000 - (135 + 288) / 45) < 1e-9); // b-egg-1 + b-egg-2
});

test('单行成本：可食比例与损耗率参与计算', () => {
  // 鸡腿肉 180g 净料 ÷0.72 ÷0.97 ≈ 257.73g 毛料，按 20 元/kg
  const r = costLine(ing.chicken_thigh, { ingredientId: 'chicken_thigh', qty: 180, unit: 'g' }, 0.02);
  assert.ok(Math.abs(r.grossG - 180 / 0.72 / 0.97) < 1e-6);
  assert.ok(Math.abs(r.cost - (180 / 0.72 / 0.97) * 0.02) < 1e-6);
});

test('整份配方成本与毛利', () => {
  const ingById = ing;
  const version = SEED.recipes.find((r) => r.id === 'fried_rice').versions[0];
  const { total } = costRecipe(version, ingById, (i) => resolveUnitCost(i, batches, DEFAULT_PRICING).unitCost);
  assert.ok(total > 2 && total < 5, `蛋炒饭成本应在 2~5 元之间，实际 ${total}`);
  const m = marginOf(18, total);
  assert.ok(m.rate > 0.7 && m.rate < 0.9);
});

test('替换建议按净料克重锚定，不照搬原单位', () => {
  // 30ml 油 → 建议 27.6g（经密度），而非 30g
  const s = suggestSubstitution(ing.oil, { ingredientId: 'oil', qty: 30, unit: 'ml' }, ing.butter);
  assert.equal(s.unit, 'g');
  assert.ok(Math.abs(s.qty - 27.6) < 1e-9);
  // 3 个鸡蛋 → 150g，而非 3g
  const s2 = suggestSubstitution(ing.egg, { ingredientId: 'egg', qty: 3, unit: '个' }, ing.shiitake_fresh);
  assert.equal(s2.qty, 150);
});

test('可用单位随食材属性变化', () => {
  assert.deepEqual(availableUnits(ing.oil), ['g', 'kg', 'ml', 'L', '桶']);
  assert.deepEqual(availableUnits(ing.egg), ['g', 'kg', '个', '箱']);
  assert.deepEqual(availableUnits(ing.salt), ['g', 'kg', '袋']);
});

test('虚构数据自洽：所有配方行都能算出正成本', () => {
  for (const recipe of SEED.recipes) {
    for (const v of recipe.versions) {
      const { total } = costRecipe(v, ing, (i) => resolveUnitCost(i, batches, DEFAULT_PRICING).unitCost);
      assert.ok(total > 0, `${recipe.name} v${v.versionNo} 成本应大于 0`);
      assert.ok(total < v.price, `${recipe.name} v${v.versionNo} 成本 ${total.toFixed(2)} 应低于售价 ${v.price}`);
    }
  }
});

test('虚构数据自洽：历史销量引用的版本存在且时间合理', () => {
  const recipes = Object.fromEntries(SEED.recipes.map((r) => [r.id, r]));
  for (const s of SEED.sales) {
    const recipe = recipes[s.recipeId];
    const v = recipe.versions.find((x) => x.id === s.versionId);
    assert.ok(v, `销量 ${s.id} 引用的版本存在`);
    assert.ok(v.createdAt <= s.date, `销量 ${s.id} 的版本应早于销售日期`);
  }
});
