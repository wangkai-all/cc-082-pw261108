import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';
import { costRecipe, resolveUnitCost, historicalUnitCost } from '../js/costing.js';

const ingById = (st) => Object.fromEntries(st.ingredients.map((i) => [i.id, i]));

test('配方改版只新增版本：历史版本不变，销量仍指向旧版本', () => {
  const store = createStore();
  const before = store.state.recipes.find((r) => r.id === 'gongbao');
  const v1Snapshot = JSON.stringify(before.versions[0]);
  const versionCount = before.versions.length;

  const draft = { price: 40, lines: before.versions[1].lines.map((l) => ({ ...l })) };
  draft.lines[0] = { ingredientId: 'chicken_thigh', qty: 200, unit: 'g' };
  const v = store.saveRecipeVersion('gongbao', draft, '加量测试');

  const after = store.state.recipes.find((r) => r.id === 'gongbao');
  assert.equal(after.versions.length, versionCount + 1);
  assert.equal(JSON.stringify(after.versions[0]), v1Snapshot, '历史版本内容不变');
  assert.equal(after.currentVersionId, v.id, '新版本成为在售版本');
  assert.ok(store.state.sales.filter((s) => s.recipeId === 'gongbao').every((s) => s.versionId !== v.id), '历史销量仍锁定旧版本');
});

test('切换情景载入价格设置；微调不写回情景', () => {
  const store = createStore();
  store.setScenario('sc-latest');
  assert.equal(store.state.pricing.mode, 'latest');

  store.updatePricing((p) => {
    p.priceAdjustPct.egg = 10;
  });
  const sc = store.state.scenarios.find((s) => s.id === 'sc-latest');
  assert.deepEqual(sc.pricing.priceAdjustPct, {}, '情景本体不被微调污染');

  store.setScenario('sc-weighted');
  assert.deepEqual(store.state.pricing, { mode: 'weighted', batchPick: {}, priceAdjustPct: {} });
});

test('新增批次保留旧报价，加权价随之变化；可指定旧批次', () => {
  const store = createStore();
  const ings = ingById(store.state);
  const before = resolveUnitCost(ings.egg, store.state.batches, store.state.pricing).unitCost;

  store.addBatch({ ingredientId: 'egg', date: '2026-11-13', qty: 1, unit: '箱', totalPrice: 180, supplier: '测试供应商' });
  const st = store.state;
  const eggBatches = st.batches.filter((b) => b.ingredientId === 'egg');
  assert.equal(eggBatches.length, 4, '旧批次全部保留');
  const after = resolveUnitCost(ings.egg, st.batches, st.pricing).unitCost;
  assert.ok(after > before, '高价新批次拉高加权成本');

  store.updatePricing((p) => {
    p.batchPick.egg = 'b-egg-1';
  });
  const picked = resolveUnitCost(ings.egg, store.state.batches, store.state.pricing);
  assert.equal(picked.source, 'batch');
  assert.ok(Math.abs(picked.unitCost * 1000 - 9) < 1e-9, '指定批次用旧报价 9 元/kg');
});

test('历史销量：同一菜品不同月份锁定不同配方版本', () => {
  const store = createStore();
  const st = store.state;
  const ings = ingById(st);
  const sales = st.sales.filter((s) => s.recipeId === 'gongbao');
  const recipe = st.recipes.find((r) => r.id === 'gongbao');

  const aug = sales.find((s) => s.date === '2026-08-31');
  const oct = sales.find((s) => s.date === '2026-10-31');
  const vAug = recipe.versions.find((v) => v.id === aug.versionId);
  const vOct = recipe.versions.find((v) => v.id === oct.versionId);
  assert.ok(vAug.lines.some((l) => l.ingredientId === 'chicken_breast'), '8 月仍是鸡胸肉配方');
  assert.ok(vOct.lines.some((l) => l.ingredientId === 'chicken_thigh'), '10 月已是鸡腿肉配方');

  // 历史成本用当时批次：8 月鸡蛋只有 9 元/kg 的老批次
  const eggCostAug = historicalUnitCost(ings.egg, st.batches, aug.date);
  assert.ok(Math.abs(eggCostAug * 1000 - 9) < 1e-9);

  // 两个版本都能独立算出成本（统计可用）
  for (const v of [vAug, vOct]) {
    const { total } = costRecipe(v, ings, (ing) => historicalUnitCost(ing, st.batches, '2026-10-31'));
    assert.ok(total > 0);
  }
});
