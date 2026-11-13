// 页面入口：渲染 + 事件委托。计算逻辑全部在 costing.js / units.js。
import { availableUnits, fmtGrams, fromNetGrams, roundForUnit, toNetGrams } from './units.js';
import {
  resolveUnitCost, weightedUnitCost, latestBatch, batchUnitPrice,
  historicalUnitCost, costRecipe, marginOf, recipeAllergens, suggestSubstitution,
} from './costing.js';
import { store } from './store.js';

/* ---------------- 工具 ---------------- */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtMoney = (n) => (Number.isFinite(n) ? `¥${n.toFixed(2)}` : '—');
const fmtPerKg = (u) => `¥${(u * 1000).toFixed(2)}/kg`;
const fmtPct = (x) => `${(x * 100).toFixed(1)}%`;
const num = (v, fallback = NaN) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

function deltaHtml(d, { goodWhen = 'up', money = true, digits = 2, suffix = '' } = {}) {
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return '<span class="delta-flat">—</span>';
  const up = d > 0;
  const good = (up && goodWhen === 'up') || (!up && goodWhen === 'down');
  const cls = good ? 'delta-up-good' : 'delta-up-bad';
  const val = money ? `¥${Math.abs(d).toFixed(digits)}` : `${Math.abs(d).toFixed(digits)}${suffix}`;
  return `<span class="${cls}">${up ? '▲' : '▼'} ${val}</span>`;
}

/* ---------------- 数据取用 ---------------- */
const S = () => store.state;
const ingById = () => Object.fromEntries(S().ingredients.map((i) => [i.id, i]));
const recipeById = (id) => S().recipes.find((r) => r.id === id);
const currentVersion = (r) => r.versions.find((v) => v.id === r.currentVersionId);
const scenarioCostFn = () => (ing) => resolveUnitCost(ing, S().batches, S().pricing).unitCost;
const baselineCostFn = () => (ing) => weightedUnitCost(ing, S().batches);
const isBaseline = () => {
  const p = S().pricing;
  return p.mode === 'weighted' && !Object.keys(p.batchPick || {}).length && !Object.keys(p.priceAdjustPct || {}).length;
};
const SOURCE_LABEL = { weighted: '加权', latest: '最新批次', batch: '指定批次' };

function dishSummary(recipe, costFn) {
  const v = currentVersion(recipe);
  const cost = costRecipe(v, ingById(), costFn).total;
  return { version: v, cost, ...marginOf(v.price, cost) };
}

/* ---------------- 页面状态（不持久化） ---------------- */
const ui = {
  tab: 'menu',
  recipeId: null,
  viewVersionId: null,
  draft: null, // { price, lines:[{ingredientId, qty, unit}] }
  note: '',
  sub: null, // { lineIndex, newIngId, ratio, unit, qty, netG }
  expanded: new Set(),
  addLine: { ingId: '', qty: 100, unit: 'g' },
};

function resetDraft() {
  const v = recipeById(ui.recipeId).versions.find((x) => x.id === ui.viewVersionId);
  ui.draft = { price: v.price, lines: v.lines.map((l) => ({ ...l })) };
}

/* ---------------- 骨架 ---------------- */
function headerHtml() {
  const st = S();
  const sc = st.scenarios.find((s) => s.id === st.activeScenarioId);
  const modified = sc && JSON.stringify(st.pricing) !== JSON.stringify(sc.pricing);
  const options = st.scenarios
    .map((s) => `<option value="${s.id}" ${s.id === st.activeScenarioId ? 'selected' : ''}>${esc(s.name)}</option>`)
    .join('');
  return `
  <header class="app-header">
    <h1>🍳 ${esc(st.shopName)} · 配方成本试算</h1>
    <div class="spacer"></div>
    <div class="scenario-picker">
      <label for="scenario-select">价格情景</label>
      <select id="scenario-select" data-field="scenario-select">${options}</select>
      ${modified ? '<span class="modified-flag">● 已调整，未保存为情景</span>' : ''}
    </div>
    <button class="btn small" data-action="reset-data">重置示例数据</button>
  </header>`;
}

const TABS = [
  ['menu', '菜单试算'],
  ['ingredients', '食材与采购'],
  ['scenarios', '价格情景'],
  ['sales', '销售统计'],
];
const tabsHtml = () =>
  `<nav class="tabs">${TABS.map(
    ([id, name]) => `<button class="${ui.tab === id ? 'active' : ''}" data-action="tab" data-tab="${id}">${name}</button>`
  ).join('')}</nav>`;

/* ---------------- 菜单试算 ---------------- */
function menuHtml() {
  const st = S();
  const base = isBaseline();
  const rows = st.recipes.map((r) => {
    const cur = dishSummary(r, scenarioCostFn());
    const ref = dishSummary(r, baselineCostFn());
    return { r, cur, ref, dCost: cur.cost - ref.cost, dProfit: cur.profit - ref.profit };
  });
  const avg = (arr, f) => arr.reduce((s, x) => s + f(x), 0) / (arr.length || 1);
  const avgRate = avg(rows, (x) => x.cur.rate);
  const avgRateRef = avg(rows, (x) => x.ref.rate);

  const body = rows
    .map(
      ({ r, cur, dCost, dProfit }) => `
    <tr class="clickable" data-action="open-recipe" data-id="${r.id}">
      <td class="l"><strong>${esc(r.name)}</strong> <span class="muted">${esc(r.category)}</span></td>
      <td>v${cur.version.versionNo}</td>
      <td>${fmtMoney(cur.version.price)}</td>
      <td>${fmtMoney(cur.cost)}</td>
      <td>${fmtMoney(cur.profit)}</td>
      <td>${fmtPct(cur.rate)}</td>
      <td>${base ? '<span class="delta-flat">—</span>' : deltaHtml(dCost, { goodWhen: 'down' })}</td>
      <td>${base ? '<span class="delta-flat">—</span>' : deltaHtml(dProfit, { goodWhen: 'up' })}</td>
      <td><button class="btn small" data-action="open-recipe" data-id="${r.id}">试算 / 改版</button></td>
    </tr>`
    )
    .join('');

  return `
  <div class="stat-row">
    <div class="stat"><div class="label">在售菜品</div><div class="value">${rows.length}</div></div>
    <div class="stat"><div class="label">平均毛利率（当前情景）</div><div class="value">${fmtPct(avgRate)}</div></div>
    <div class="stat"><div class="label">较基准（加权成本）</div><div class="value">${
      base ? '<span class="delta-flat">—</span>' : deltaHtml(avgRate - avgRateRef, { money: false, digits: 1, suffix: 'pp' })
    }</div></div>
  </div>
  ${base ? '' : '<div class="notice">Δ 列 = 当前价格情景 相对「加权平均成本」基准的每份变化。切换顶部情景可对比食材价格波动对毛利的影响。</div>'}
  <div class="card">
    <table class="data">
      <thead><tr>
        <th class="l">菜品</th><th>版本</th><th>售价</th><th>每份成本</th><th>毛利</th><th>毛利率</th>
        <th>Δ成本</th><th>Δ毛利</th><th></th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>
  ${ui.recipeId ? detailHtml() : ''}`;
}

/* ---------------- 菜品明细 / 配方编辑 ---------------- */
function detailHtml() {
  const st = S();
  const ings = ingById();
  const recipe = recipeById(ui.recipeId);
  const v = recipe.versions.find((x) => x.id === ui.viewVersionId);
  const isCurrent = v.id === recipe.currentVersionId;
  const costFn = scenarioCostFn();

  const draftCost = costRecipe({ lines: ui.draft.lines }, ings, costFn);
  const draftMargin = marginOf(ui.draft.price, draftCost.total);
  const savedCost = costRecipe(v, ings, costFn);
  const savedMargin = marginOf(v.price, savedCost.total);

  const versionOptions = [...recipe.versions]
    .sort((a, b) => b.versionNo - a.versionNo)
    .map(
      (x) =>
        `<option value="${x.id}" ${x.id === v.id ? 'selected' : ''}>v${x.versionNo} · ${x.createdAt} · ${esc(x.note)}${
          x.id === recipe.currentVersionId ? '（在售）' : ''
        }</option>`
    )
    .join('');

  const lineRows = ui.draft.lines
    .map((line, i) => {
      const ing = ings[line.ingredientId];
      const c = draftCost.lines[i];
      const saved = v.lines[i];
      const changed = !saved || saved.ingredientId !== line.ingredientId || saved.qty !== line.qty || saved.unit !== line.unit;
      const units = availableUnits(ing)
        .map((u) => `<option value="${u}" ${u === line.unit ? 'selected' : ''}>${u}</option>`)
        .join('');
      return `
      <tr class="${changed ? 'line-changed' : ''}">
        <td class="l">${esc(ing.name)}${(ing.allergens || []).map((a) => ` <span class="badge allergen">${esc(a)}</span>`).join('')}</td>
        <td><input class="num line-qty" type="number" min="0" step="any" value="${line.qty}" data-field="line-qty" data-index="${i}"></td>
        <td><select data-field="line-unit" data-index="${i}">${units}</select></td>
        <td>${fmtGrams(c.netG)}</td>
        <td>${fmtGrams(c.grossG)}</td>
        <td title="可食比例 ${(ing.yieldRate * 100).toFixed(0)}% · 损耗 ${(c.lossRate * 100).toFixed(0)}%">${fmtPerKg(c.unitCostPerGrossG)}</td>
        <td>${fmtMoney(c.cost)}</td>
        <td>
          <button class="btn small" data-action="open-sub" data-index="${i}">替换</button>
          <button class="btn small danger" data-action="remove-line" data-index="${i}">删</button>
        </td>
      </tr>`;
    })
    .join('');

  const addIngOptions = ['<option value="">选择食材…</option>']
    .concat(
      st.ingredients.map(
        (ing) => `<option value="${ing.id}" ${ui.addLine.ingId === ing.id ? 'selected' : ''}>${esc(ing.name)}</option>`
      )
    )
    .join('');
  const addIng = ui.addLine.ingId ? ings[ui.addLine.ingId] : null;
  const addUnitOptions = addIng
    ? availableUnits(addIng)
        .map((u) => `<option value="${u}" ${u === ui.addLine.unit ? 'selected' : ''}>${u}</option>`)
        .join('')
    : '<option>g</option>';

  const allergens = recipeAllergens({ lines: ui.draft.lines }, ings);

  return `
  <div class="card" id="recipe-detail">
    <div class="detail-head">
      <h2>${esc(recipe.name)}</h2>
      <span class="badge ${isCurrent ? 'current' : 'old'}">${isCurrent ? '在售版本' : '历史版本'}</span>
      <div class="spacer" style="flex:1"></div>
      <label class="muted" for="version-select">查看版本</label>
      <select id="version-select" data-field="version-select">${versionOptions}</select>
      ${isCurrent ? '' : `<button class="btn small" data-action="version-set-current">设为在售版本</button>`}
      <button class="btn small" data-action="close-detail">收起</button>
    </div>
    <p class="hint">v${v.versionNo} · ${v.createdAt} · ${esc(v.note)}　｜　修改在下方草稿进行，保存后生成新版本，历史版本与历史销量不受影响。</p>

    <div class="row" style="margin:10px 0">
      <label>售价 <input class="price" type="number" min="0" step="0.5" value="${ui.draft.price}" data-field="draft-price"> 元</label>
      <span class="muted">已保存 v${v.versionNo}：售价 ${fmtMoney(v.price)} · 成本 ${fmtMoney(savedCost.total)} · 毛利率 ${fmtPct(savedMargin.rate)}</span>
    </div>

    <table class="data">
      <thead><tr>
        <th class="l">食材</th><th>用量（净料）</th><th>单位</th><th>净料</th><th>折算毛料</th><th>单位成本</th><th>小计</th><th></th>
      </tr></thead>
      <tbody>${lineRows}</tbody>
      <tfoot>
        <tr>
          <td class="l">合计（${ui.draft.lines.length} 种食材）</td><td></td><td></td><td></td><td></td><td></td>
          <td>${fmtMoney(draftCost.total)}</td><td></td>
        </tr>
      </tfoot>
    </table>

    <div class="row" style="margin-top:10px">
      <select data-field="add-line-ing">${addIngOptions}</select>
      <input class="num" type="number" min="0" step="any" value="${ui.addLine.qty}" data-field="add-line-qty">
      <select data-field="add-line-unit">${addUnitOptions}</select>
      <button class="btn small" data-action="add-line" ${addIng ? '' : 'disabled'}>添加食材行</button>
    </div>

    <div class="stat-row" style="margin-top:14px">
      <div class="stat"><div class="label">草稿成本 / 份</div><div class="value">${fmtMoney(draftCost.total)}</div></div>
      <div class="stat"><div class="label">草稿毛利</div><div class="value">${fmtMoney(draftMargin.profit)}</div></div>
      <div class="stat"><div class="label">草稿毛利率</div><div class="value">${fmtPct(draftMargin.rate)}</div></div>
      <div class="stat"><div class="label">较已保存版本</div><div class="value">${deltaHtml(draftMargin.profit - savedMargin.profit, { goodWhen: 'up' })}</div></div>
    </div>
    <div class="row">
      <span class="muted">过敏原合集：</span>
      ${allergens.length ? allergens.map((a) => `<span class="badge allergen">${esc(a)}</span>`).join('') : '<span class="muted">无</span>'}
    </div>

    <div class="row" style="margin-top:12px">
      <input style="flex:1;min-width:220px" placeholder="改版说明（如：花生换腰果，成本 +¥1.20）" value="${esc(ui.note)}" data-field="note-input">
      <button class="btn primary" data-action="save-version">保存为新版本</button>
      <button class="btn" data-action="discard-draft">放弃修改</button>
    </div>
  </div>`;
}

/* ---------------- 食材替换对照弹窗 ---------------- */
function subModalHtml() {
  const ings = ingById();
  const oldLine = ui.draft.lines[ui.sub.lineIndex];
  const oldIng = ings[oldLine.ingredientId];
  const newIng = ings[ui.sub.newIngId];

  const ingOptions = S().ingredients
    .filter((i) => i.id !== oldIng.id)
    .map((i) => `<option value="${i.id}" ${i.id === newIng.id ? 'selected' : ''}>${esc(i.name)}（${esc(i.category)}）</option>`)
    .join('');
  const unitOptions = availableUnits(newIng)
    .map((u) => `<option value="${u}" ${u === ui.sub.unit ? 'selected' : ''}>${u}</option>`)
    .join('');

  return `
  <div class="modal-overlay">
    <div class="modal">
      <h2>替换食材：${esc(oldIng.name)} → 新食材</h2>
      <p class="hint">替换不是按重量直接照搬：请先确认换算比率与目标单位（体积经密度、计数经单件净重、干货泡发需手动加大比率），系统再按净料 → 毛料 → 批次成本计算。</p>
      <div class="row" style="margin:10px 0">
        <label>新食材 <select id="sub-ing" data-field="sub-ing">${ingOptions}</select></label>
        <label>换算比率 <input class="num" id="sub-ratio" type="number" min="0" step="any" value="${ui.sub.ratio}" data-field="sub-ratio"></label>
        <label>目标单位 <select id="sub-unit" data-field="sub-unit">${unitOptions}</select></label>
        <label>新用量 <input class="num" id="sub-qty" type="number" min="0" step="any" value="${ui.sub.qty}" data-field="sub-qty"></label>
      </div>
      <p class="hint">比率含义：新食材净料克数 = 原净料 ${fmtGrams(ui.sub.netG)} × 比率。例：干香菇→鲜香菇约 1:5~1:6；油↔黄油等密度不同食材已按净重锚定。</p>
      <div class="compare">
        <div class="side">
          <h3>原：${esc(oldIng.name)}</h3>
          <dl class="kv">
            <dt>用量</dt><dd>${oldLine.qty} ${esc(oldLine.unit)}（净料 ${fmtGrams(ui.sub.netG)}）</dd>
            <dt>过敏原</dt><dd>${(oldIng.allergens || []).length ? oldIng.allergens.map((a) => `<span class="badge allergen">${esc(a)}</span>`).join('') : '无'}</dd>
            <dt>单份小计</dt><dd id="sub-old-cost"></dd>
          </dl>
        </div>
        <div class="side new">
          <h3>新：<span id="sub-new-name">${esc(newIng.name)}</span></h3>
          <dl class="kv">
            <dt>净料 / 毛料</dt><dd><span id="sub-new-net"></span> / <span id="sub-new-gross"></span></dd>
            <dt>单位成本</dt><dd id="sub-new-unitcost"></dd>
            <dt>单份小计</dt><dd id="sub-new-cost"></dd>
          </dl>
        </div>
      </div>
      <div class="row" id="sub-allergens"></div>
      <div class="stat-row">
        <div class="stat"><div class="label">该行成本变化</div><div class="value" id="sub-line-delta"></div></div>
        <div class="stat"><div class="label">新配方成本 / 份</div><div class="value" id="sub-total"></div></div>
        <div class="stat"><div class="label">新配方毛利率</div><div class="value" id="sub-margin"></div></div>
      </div>
      <div class="row" style="justify-content:flex-end">
        <button class="btn" data-action="sub-cancel">取消</button>
        <button class="btn primary" data-action="sub-apply">应用到草稿</button>
      </div>
    </div>
  </div>`;
}

/** 弹窗内联动预览：直接改 DOM，避免整页重绘丢失输入焦点 */
function updateSubPreview() {
  const ings = ingById();
  const oldLine = ui.draft.lines[ui.sub.lineIndex];
  const oldIng = ings[oldLine.ingredientId];
  const newIng = ings[ui.sub.newIngId];
  const costFn = scenarioCostFn();

  const oldCost = costRecipe({ lines: [oldLine] }, ings, costFn).total;
  const newLine = { ingredientId: newIng.id, qty: ui.sub.qty, unit: ui.sub.unit };
  let newCostRow;
  try {
    newCostRow = costRecipe({ lines: [newLine] }, ings, costFn).lines[0];
  } catch {
    return; // 输入中间态（如空值）不刷新
  }
  const draftTotal = costRecipe({ lines: ui.draft.lines }, ings, costFn).total;
  const newTotal = draftTotal - oldCost + newCostRow.cost;
  const m = marginOf(ui.draft.price, newTotal);

  const set = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };
  set('sub-old-cost', fmtMoney(oldCost));
  set('sub-new-net', fmtGrams(newCostRow.netG));
  set('sub-new-gross', fmtGrams(newCostRow.grossG));
  set('sub-new-unitcost', fmtPerKg(newCostRow.unitCostPerGrossG));
  set('sub-new-cost', fmtMoney(newCostRow.cost));
  set('sub-line-delta', deltaHtml(newCostRow.cost - oldCost, { goodWhen: 'down' }));
  set('sub-total', fmtMoney(newTotal));
  set('sub-margin', fmtPct(m.rate));

  const oldA = new Set(oldIng.allergens || []);
  const newA = new Set(newIng.allergens || []);
  const added = [...newA].filter((a) => !oldA.has(a));
  const removed = [...oldA].filter((a) => !newA.has(a));
  const kept = [...newA].filter((a) => oldA.has(a));
  const parts = ['<span class="muted">过敏原对照：</span>'];
  if (added.length) parts.push(`<span class="badge added">⚠ 新增 ${added.map(esc).join('、')}</span>`);
  if (removed.length) parts.push(`<span class="badge removed">✓ 移除 ${removed.map(esc).join('、')}</span>`);
  if (kept.length) parts.push(`<span class="badge allergen">保留 ${kept.map(esc).join('、')}</span>`);
  if (!added.length && !removed.length && !kept.length) parts.push('<span class="muted">均无过敏原</span>');
  if (added.length) parts.push('<span class="hint">新配方将新增过敏原，请同步更新菜单标识。</span>');
  set('sub-allergens', parts.join(''));
}

/* ---------------- 食材与采购 ---------------- */
function ingredientsHtml() {
  const st = S();
  const rows = st.ingredients
    .map((ing) => {
      const list = st.batches.filter((b) => b.ingredientId === ing.id);
      const w = weightedUnitCost(ing, st.batches);
      const lb = latestBatch(ing, st.batches);
      const latest = lb ? batchUnitPrice(ing, lb) : 0;
      const r = resolveUnitCost(ing, st.batches, st.pricing);
      const pack = ing.packageSpec ? `1${ing.packageSpec.unit} = ${ing.packageSpec.qty}${ing.packageSpec.qtyUnit}` : '—';
      const expanded = ui.expanded.has(ing.id);
      const src = SOURCE_LABEL[r.source] + (r.adjustPct ? ` ${r.adjustPct > 0 ? '+' : ''}${r.adjustPct}%` : '');
      return `
      <tr class="clickable" data-action="toggle-ing" data-id="${ing.id}">
        <td class="l"><strong>${esc(ing.name)}</strong></td>
        <td class="l">${esc(ing.category)}</td>
        <td class="l">${(ing.allergens || []).length ? ing.allergens.map((a) => `<span class="badge allergen">${esc(a)}</span>`).join('') : '<span class="muted">无</span>'}</td>
        <td>${pack}</td>
        <td>${fmtPct(ing.yieldRate)}</td>
        <td>${fmtPct(ing.lossRate || 0)}</td>
        <td>${fmtPerKg(w)}</td>
        <td>${fmtPerKg(latest)}</td>
        <td>${fmtPerKg(r.unitCost)} <span class="badge">${src}</span></td>
        <td>${list.length} 批 ${expanded ? '▴' : '▾'}</td>
      </tr>
      ${expanded ? `<tr><td colspan="10">${batchPanelHtml(ing, list)}</td></tr>` : ''}`;
    })
    .join('');

  return `
  <div class="notice">单位成本均为「元 / 毛料 kg」：包装规格先折算毛料克数（液体按密度），配方成本再除以可食比例与 (1-损耗率)。新批次只会追加，旧报价保留；「指定」可把某批价格用于当前试算。</div>
  <div class="card">
    <table class="data">
      <thead><tr>
        <th class="l">食材</th><th class="l">类别</th><th class="l">过敏原</th><th>包装规格</th>
        <th>可食比例</th><th>损耗率</th><th>加权价</th><th>最新价</th><th>情景价</th><th>批次</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function batchPanelHtml(ing, list) {
  const st = S();
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const picked = st.pricing.batchPick?.[ing.id];
  const rows = sorted
    .map((b, i) => {
      const unit = batchUnitPrice(ing, b);
      const prev = i > 0 ? batchUnitPrice(ing, sorted[i - 1]) : null;
      const trend =
        prev == null
          ? '<span class="delta-flat">—</span>'
          : unit > prev
            ? `<span class="trend-up">▲ +${((unit / prev - 1) * 100).toFixed(1)}%</span>`
            : unit < prev
              ? `<span class="trend-down">▼ ${((unit / prev - 1) * 100).toFixed(1)}%</span>`
              : '<span class="delta-flat">持平</span>';
      return `
      <tr>
        <td class="l">${b.date}</td>
        <td class="l">${esc(b.supplier || '')}</td>
        <td>${b.qty} ${esc(b.unit)}</td>
        <td>${fmtMoney(b.totalPrice)}</td>
        <td>${fmtPerKg(unit)}</td>
        <td>${trend}</td>
        <td class="l">${esc(b.note || '')}</td>
        <td><input type="radio" name="pick-${ing.id}" data-field="pick-batch" data-ing="${ing.id}" value="${b.id}" ${picked === b.id ? 'checked' : ''}></td>
      </tr>`;
    })
    .join('');

  const unitOptions = ['kg', 'g']
    .concat(ing.density ? ['L', 'ml'] : [])
    .concat(ing.packageSpec ? [ing.packageSpec.unit] : [])
    .map((u) => `<option value="${u}" ${ing.packageSpec && u === ing.packageSpec.unit ? 'selected' : ''}>${u}</option>`)
    .join('');

  return `
  <div class="batch-panel">
    <table class="data">
      <thead><tr>
        <th class="l">日期</th><th class="l">供应商</th><th>数量</th><th>总价</th><th>折合单价</th><th>较上一批</th><th class="l">备注</th><th>指定</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="batch-form">
      <strong>新增批次：</strong>
      <input type="date" id="bf-date-${ing.id}" value="${new Date().toISOString().slice(0, 10)}">
      <input class="num" type="number" min="0" step="any" placeholder="数量" id="bf-qty-${ing.id}">
      <select id="bf-unit-${ing.id}">${unitOptions}</select>
      <input class="num" type="number" min="0" step="any" placeholder="总价 ¥" id="bf-price-${ing.id}">
      <input placeholder="供应商" id="bf-supplier-${ing.id}">
      <input placeholder="备注（如：涨价）" id="bf-note-${ing.id}">
      <button class="btn small primary" data-action="add-batch" data-ing="${ing.id}">添加批次</button>
      ${picked ? `<button class="btn small" data-action="clear-pick" data-ing="${ing.id}">清除指定（回到${st.pricing.mode === 'latest' ? '最新' : '加权'}）</button>` : ''}
    </div>
  </div>`;
}

/* ---------------- 价格情景 ---------------- */
function scenariosHtml() {
  const st = S();
  const ings = ingById();

  const scRows = st.scenarios
    .map((s) => {
      const active = s.id === st.activeScenarioId;
      return `
      <tr>
        <td class="l"><input type="radio" name="sc-active" data-field="scenario-activate" value="${s.id}" ${active ? 'checked' : ''}></td>
        <td class="l">${esc(s.name)} ${s.builtin ? '<span class="badge">内置</span>' : ''}</td>
        <td class="l muted">${s.pricing.mode === 'latest' ? '最新批次' : '加权平均'}${Object.keys(s.pricing.batchPick || {}).length ? ' · 含指定批次' : ''}${
          Object.keys(s.pricing.priceAdjustPct || {}).length ? ' · 含模拟涨跌' : ''
        }</td>
        <td>${s.builtin ? '' : `<button class="btn small danger" data-action="scenario-delete" data-id="${s.id}">删除</button>`}</td>
      </tr>`;
    })
    .join('');

  const ingRows = st.ingredients
    .map((ing) => {
      const list = st.batches.filter((b) => b.ingredientId === ing.id);
      const w = weightedUnitCost(ing, st.batches);
      const pick = st.pricing.batchPick?.[ing.id] || '';
      const adj = st.pricing.priceAdjustPct?.[ing.id] ?? '';
      const batchOptions = ['<option value="">跟随模式</option>']
        .concat(
          [...list]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((b) => `<option value="${b.id}" ${pick === b.id ? 'selected' : ''}>${b.date} · ${fmtPerKg(batchUnitPrice(ing, b))}</option>`)
        )
        .join('');
      return `
      <tr>
        <td class="l">${esc(ing.name)}</td>
        <td>${fmtPerKg(w)}</td>
        <td><select data-field="pick-batch" data-ing="${ing.id}">${batchOptions}</select></td>
        <td><input class="num" style="width:64px" type="number" step="any" placeholder="0" value="${adj}" data-field="adjust-pct" data-ing="${ing.id}"> %</td>
      </tr>`;
    })
    .join('');

  return `
  <div class="grid-2">
    <div class="card">
      <h2>情景列表</h2>
      <table class="data">
        <thead><tr><th class="l"></th><th class="l">名称</th><th class="l">构成</th><th></th></tr></thead>
        <tbody>${scRows}</tbody>
      </table>
      <div class="row" style="margin-top:10px">
        <input style="flex:1" placeholder="新情景名称" id="saveas-name">
        <button class="btn small primary" data-action="scenario-save-as">将当前试算保存为情景</button>
      </div>
      <p class="hint">切换情景会把其价格设置载入当前试算；在右侧继续微调不会写回情景，需手动「保存为情景」。</p>
    </div>
    <div class="card">
      <h2>当前试算设置</h2>
      <div class="row" style="margin-bottom:8px">
        <label><input type="radio" name="pricing-mode" data-field="pricing-mode" value="weighted" ${st.pricing.mode !== 'latest' ? 'checked' : ''}> 加权平均成本</label>
        <label><input type="radio" name="pricing-mode" data-field="pricing-mode" value="latest" ${st.pricing.mode === 'latest' ? 'checked' : ''}> 最新批次价</label>
      </div>
      <table class="data">
        <thead><tr><th class="l">食材</th><th>加权价</th><th>指定批次（优先）</th><th>模拟涨跌</th></tr></thead>
        <tbody>${ingRows}</tbody>
      </table>
    </div>
  </div>
  ${impactHtml()}`;
}

/** 影响分析：图表 + 对照表 */
function impactHtml() {
  const st = S();
  const rows = st.recipes.map((r) => {
    const cur = dishSummary(r, scenarioCostFn());
    const ref = dishSummary(r, baselineCostFn());
    return { name: r.name, cur, ref };
  });
  const tableRows = rows
    .map(
      ({ name, cur, ref }) => `
    <tr>
      <td class="l">${esc(name)}</td>
      <td>${fmtMoney(ref.cost)}</td><td>${fmtMoney(cur.cost)}</td>
      <td>${deltaHtml(cur.cost - ref.cost, { goodWhen: 'down' })}</td>
      <td>${fmtPct(ref.rate)}</td><td>${fmtPct(cur.rate)}</td>
      <td>${deltaHtml((cur.rate - ref.rate) * 100, { money: false, digits: 1, suffix: 'pp' })}</td>
    </tr>`
    )
    .join('');

  return `
  <div class="card">
    <h2>情景影响：各菜品毛利率 基准 vs 当前情景</h2>
    <div class="chart-legend">
      <span class="key"><span class="swatch s1"></span>基准（加权平均成本）</span>
      <span class="key"><span class="swatch s2"></span>当前情景</span>
    </div>
    <div class="chart-wrap">
      ${marginChartSvg(rows)}
      <div class="chart-tip" id="chart-tip"></div>
    </div>
    <h3>对照表（与图表数据一致）</h3>
    <table class="data">
      <thead><tr>
        <th class="l">菜品</th><th>基准成本</th><th>情景成本</th><th>Δ成本</th>
        <th>基准毛利率</th><th>情景毛利率</th><th>Δ毛利率</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>`;
}

function barPath(x, y, w, h, r = 4) {
  const rr = Math.max(0, Math.min(r, w, h / 2));
  return `M${x},${y} h${w - rr} a${rr},${rr} 0 0 1 ${rr},${rr} v${h - 2 * rr} a${rr},${rr} 0 0 1 -${rr},${rr} h${-(w - rr)} z`;
}

function marginChartSvg(rows) {
  const labelW = 118;
  const plotW = 420;
  const rowH = 46;
  const barH = 14;
  const gap = 2;
  const topPad = 4;
  const axisH = 26;
  const W = labelW + plotW + 64;
  const H = topPad + rows.length * rowH + axisH;
  const x = (rate) => labelW + Math.max(0, Math.min(1, rate)) * plotW;

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (t) => `
    <line class="grid" x1="${x(t)}" y1="${topPad}" x2="${x(t)}" y2="${H - axisH}"></line>
    <text class="axis-text" x="${x(t)}" y="${H - 8}" text-anchor="middle">${Math.round(t * 100)}%</text>`
    )
    .join('');

  const body = rows
    .map(({ name, cur, ref }, i) => {
      const y0 = topPad + i * rowH + 5;
      const y1 = y0 + barH + gap;
      const tip = `${name}｜基准 ${fmtPct(ref.rate)}｜情景 ${fmtPct(cur.rate)}`;
      return `
      <text class="dish-text" x="${labelW - 10}" y="${y0 + barH}" text-anchor="end">${esc(name)}</text>
      <path class="s1" data-tip="${esc(tip)}" d="${barPath(x(0), y0, x(ref.rate) - x(0), barH)}"></path>
      <path class="s2" data-tip="${esc(tip)}" d="${barPath(x(0), y1, x(cur.rate) - x(0), barH)}"></path>
      <text class="val-text" x="${x(cur.rate) + 7}" y="${y1 + barH - 3}">${fmtPct(cur.rate)}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="各菜品毛利率：基准与当前情景对比">${grid}${body}</svg>`;
}

/* ---------------- 销售统计 ---------------- */
function salesHtml() {
  const st = S();
  const ings = ingById();
  let totQty = 0;
  let totRevenue = 0;
  let totProfit = 0;

  const rows = [...st.sales]
    .sort((a, b) => a.date.localeCompare(b.date) || a.recipeId.localeCompare(b.recipeId))
    .map((s) => {
      const recipe = recipeById(s.recipeId);
      const v = recipe.versions.find((x) => x.id === s.versionId);
      const cost = costRecipe(v, ings, (ing) => historicalUnitCost(ing, st.batches, s.date)).total;
      const m = marginOf(v.price, cost);
      const revenue = v.price * s.qty;
      const profit = m.profit * s.qty;
      totQty += s.qty;
      totRevenue += revenue;
      totProfit += profit;
      return `
      <tr>
        <td class="l">${s.date.slice(0, 7)}</td>
        <td class="l">${esc(recipe.name)}</td>
        <td>v${v.versionNo}</td>
        <td>${s.qty}</td>
        <td>${fmtMoney(v.price)}</td>
        <td>${fmtMoney(cost)}</td>
        <td>${fmtMoney(m.profit)}</td>
        <td>${fmtPct(m.rate)}</td>
        <td>${fmtMoney(revenue)}</td>
        <td>${fmtMoney(profit)}</td>
      </tr>`;
    })
    .join('');

  return `
  <div class="notice">历史销量按<b>销售时的配方版本</b>统计：单份成本 = 当时版本配方 × 销售当日及之前采购批次的加权价。配方改版只影响新版本，不回溯历史。</div>
  <div class="card">
    <table class="data">
      <thead><tr>
        <th class="l">月份</th><th class="l">菜品</th><th>配方版本</th><th>销量</th><th>当时售价</th>
        <th>单份成本</th><th>单份毛利</th><th>毛利率</th><th>营收</th><th>毛利合计</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td class="l">合计</td><td></td><td></td><td>${totQty}</td><td></td><td></td><td></td>
          <td>${totRevenue ? fmtPct(totProfit / totRevenue) : '—'}</td>
          <td>${fmtMoney(totRevenue)}</td><td>${fmtMoney(totProfit)}</td>
        </tr>
      </tfoot>
    </table>
  </div>`;
}

/* ---------------- 渲染 ---------------- */
function viewHtml() {
  switch (ui.tab) {
    case 'ingredients':
      return ingredientsHtml();
    case 'scenarios':
      return scenariosHtml();
    case 'sales':
      return salesHtml();
    default:
      return menuHtml();
  }
}

function render() {
  document.getElementById('app').innerHTML =
    headerHtml() + tabsHtml() + `<main>${viewHtml()}</main>` + (ui.sub ? subModalHtml() : '');
  if (ui.sub) updateSubPreview();
}

/* ---------------- 事件 ---------------- */
const app = document.getElementById('app');

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id, index, ing } = el.dataset;

  switch (action) {
    case 'tab':
      ui.tab = el.dataset.tab;
      ui.sub = null;
      break;
    case 'open-recipe':
      ui.recipeId = id;
      ui.viewVersionId = recipeById(id).currentVersionId;
      ui.note = '';
      ui.addLine = { ingId: '', qty: 100, unit: 'g' };
      resetDraft();
      break;
    case 'close-detail':
      ui.recipeId = null;
      ui.draft = null;
      break;
    case 'version-set-current':
      store.setCurrentVersion(ui.recipeId, ui.viewVersionId);
      return; // store 会触发 render
    case 'save-version': {
      const v = store.saveRecipeVersion(ui.recipeId, ui.draft, ui.note.trim());
      if (v) {
        ui.viewVersionId = v.id;
        ui.note = '';
        resetDraft();
      }
      break;
    }
    case 'discard-draft':
      resetDraft();
      ui.note = '';
      break;
    case 'add-line': {
      const { ingId, qty, unit } = ui.addLine;
      if (!ingId || !(qty > 0)) break;
      ui.draft.lines.push({ ingredientId: ingId, qty, unit });
      ui.addLine = { ingId: '', qty: 100, unit: 'g' };
      break;
    }
    case 'remove-line':
      ui.draft.lines.splice(Number(index), 1);
      break;
    case 'open-sub': {
      const i = Number(index);
      const line = ui.draft.lines[i];
      const ings = ingById();
      const oldIng = ings[line.ingredientId];
      const firstNew = S().ingredients.find((x) => x.id !== oldIng.id);
      const sug = suggestSubstitution(oldIng, line, firstNew);
      ui.sub = {
        lineIndex: i,
        newIngId: firstNew.id,
        ratio: 1,
        unit: 'g',
        qty: roundForUnit(sug.qty, 'g'),
        netG: sug.netG,
      };
      break;
    }
    case 'sub-cancel':
      ui.sub = null;
      break;
    case 'sub-apply': {
      const { lineIndex, newIngId, qty, unit } = ui.sub;
      if (qty > 0) ui.draft.lines[lineIndex] = { ingredientId: newIngId, qty, unit };
      ui.sub = null;
      break;
    }
    case 'toggle-ing':
      ui.expanded.has(id) ? ui.expanded.delete(id) : ui.expanded.add(id);
      break;
    case 'add-batch': {
      const qty = num(document.getElementById(`bf-qty-${ing}`)?.value);
      const totalPrice = num(document.getElementById(`bf-price-${ing}`)?.value);
      if (!(qty > 0) || !(totalPrice > 0)) {
        alert('请填写有效的数量与总价');
        return;
      }
      store.addBatch({
        ingredientId: ing,
        date: document.getElementById(`bf-date-${ing}`).value || new Date().toISOString().slice(0, 10),
        qty,
        unit: document.getElementById(`bf-unit-${ing}`).value,
        totalPrice,
        supplier: document.getElementById(`bf-supplier-${ing}`).value.trim(),
        note: document.getElementById(`bf-note-${ing}`).value.trim(),
      });
      return;
    }
    case 'clear-pick':
      store.updatePricing((p) => delete p.batchPick[ing]);
      return;
    case 'scenario-delete':
      if (confirm('删除该自定义情景？')) store.deleteScenario(id);
      return;
    case 'scenario-save-as': {
      const name = document.getElementById('saveas-name').value.trim() || `自定义情景 ${S().scenarios.length + 1}`;
      store.saveScenarioAs(name);
      return;
    }
    case 'reset-data':
      if (confirm('将清空本地全部修改，恢复内置虚构示例数据。确定？')) {
        ui.recipeId = null;
        ui.draft = null;
        ui.sub = null;
        ui.expanded.clear();
        store.reset();
      }
      return;
    default:
      break;
  }
  render();
});

app.addEventListener('change', (e) => {
  const el = e.target.closest('[data-field]');
  if (!el) return;
  const { field, index, ing } = el.dataset;
  const v = el.value;

  switch (field) {
    case 'scenario-select':
      store.setScenario(v);
      return;
    case 'scenario-activate':
      store.setScenario(v);
      return;
    case 'pricing-mode':
      store.updatePricing((p) => {
        p.mode = v;
      });
      return;
    case 'pick-batch':
      store.updatePricing((p) => {
        if (v) p.batchPick[ing] = v;
        else delete p.batchPick[ing];
      });
      return;
    case 'adjust-pct':
      store.updatePricing((p) => {
        const n = num(v);
        if (Number.isFinite(n) && n !== 0) p.priceAdjustPct[ing] = n;
        else delete p.priceAdjustPct[ing];
      });
      return;
    case 'version-select':
      ui.viewVersionId = v;
      resetDraft();
      break;
    case 'draft-price': {
      const n = num(v);
      if (Number.isFinite(n) && n >= 0) ui.draft.price = n;
      break;
    }
    case 'line-qty': {
      const n = num(v);
      if (Number.isFinite(n) && n >= 0) ui.draft.lines[Number(index)].qty = n;
      break;
    }
    case 'line-unit':
      ui.draft.lines[Number(index)].unit = v;
      break;
    case 'add-line-ing':
      ui.addLine.ingId = v;
      ui.addLine.unit = 'g';
      break;
    case 'add-line-qty': {
      const n = num(v);
      if (Number.isFinite(n)) ui.addLine.qty = n;
      return; // 不触发重绘，保持输入
    }
    case 'add-line-unit':
      ui.addLine.unit = v;
      return;
    case 'sub-ing': {
      ui.sub.newIngId = v;
      ui.sub.ratio = 1;
      ui.sub.unit = 'g';
      ui.sub.qty = roundForUnit(fromNetGrams(ingById()[v], ui.sub.netG, 'g'), 'g');
      break;
    }
    case 'sub-unit':
      ui.sub.unit = v;
      ui.sub.qty = roundForUnit(fromNetGrams(ingById()[ui.sub.newIngId], ui.sub.netG * ui.sub.ratio, v), v);
      break;
    default:
      return;
  }
  render();
});

app.addEventListener('input', (e) => {
  const el = e.target.closest('[data-field]');
  if (!el) return;
  const v = el.value;
  switch (el.dataset.field) {
    case 'note-input':
      ui.note = v;
      break;
    case 'sub-ratio': {
      const r = num(v);
      if (!(r > 0)) break;
      ui.sub.ratio = r;
      ui.sub.qty = roundForUnit(fromNetGrams(ingById()[ui.sub.newIngId], ui.sub.netG * r, ui.sub.unit), ui.sub.unit);
      const qtyEl = document.getElementById('sub-qty');
      if (qtyEl) qtyEl.value = ui.sub.qty;
      updateSubPreview();
      break;
    }
    case 'sub-qty': {
      const q = num(v);
      if (!(q > 0)) break;
      ui.sub.qty = q;
      const netG = toNetGrams(ingById()[ui.sub.newIngId], q, ui.sub.unit);
      ui.sub.ratio = Math.round((netG / ui.sub.netG) * 1000) / 1000;
      const ratioEl = document.getElementById('sub-ratio');
      if (ratioEl) ratioEl.value = ui.sub.ratio;
      updateSubPreview();
      break;
    }
    default:
  }
});

/* 图表悬浮提示 */
app.addEventListener('mousemove', (e) => {
  const tip = document.getElementById('chart-tip');
  if (!tip) return;
  const mark = e.target.closest('[data-tip]');
  if (!mark) {
    tip.style.display = 'none';
    return;
  }
  const wrap = tip.parentElement.getBoundingClientRect();
  tip.textContent = mark.dataset.tip;
  tip.style.display = 'block';
  tip.style.left = `${e.clientX - wrap.left + 12}px`;
  tip.style.top = `${e.clientY - wrap.top - 8}px`;
});
app.addEventListener('mouseleave', () => {
  const tip = document.getElementById('chart-tip');
  if (tip) tip.style.display = 'none';
});

store.subscribe(render);
render();
