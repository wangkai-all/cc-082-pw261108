// 冒烟测试：用最小 DOM 桩驱动 app.js，走通四个页签 + 菜品详情 + 替换弹窗的渲染。
import { test } from 'node:test';
import assert from 'node:assert/strict';

const listeners = {};
const appEl = {
  innerHTML: '',
  addEventListener(type, fn) {
    listeners[type] = fn;
  },
};
const elements = new Map([['app', appEl]]);
globalThis.document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', value: '' });
    return elements.get(id);
  },
};

await import('../js/app.js');

const html = () => appEl.innerHTML;
const click = (dataset) => listeners.click({ target: { closest: () => ({ dataset }) } });
const change = (dataset, value) => listeners.change({ target: { closest: () => ({ dataset, value }) } });

test('首屏：菜单试算', () => {
  assert.ok(html().includes('宫保鸡丁'));
  assert.ok(html().includes('scenario-select'));
  assert.ok(html().includes('加权平均成本'));
});

test('菜品详情：版本、用量编辑、替换入口', () => {
  click({ action: 'open-recipe', id: 'gongbao' });
  assert.ok(html().includes('保存为新版本'), '有改版按钮');
  assert.ok(html().includes('替换'), '每行有替换按钮');
  assert.ok(html().includes('鸡腿肉'), '当前版本用鸡腿肉');
  assert.ok(html().includes('version-select'), '可切换查看版本');
});

test('替换弹窗：对照单位、过敏原与成本', () => {
  click({ action: 'open-sub', index: '1' }); // 花生仁 行
  assert.ok(html().includes('换算比率'), '要求确认换算比率而非直接按重量换算');
  assert.ok(html().includes('过敏原对照') || html().includes('sub-allergens'), '有过敏原对照区');
  assert.ok(html().includes('modal-overlay'));
  // 换成腰果（过敏原 花生→坚果）
  change({ field: 'sub-ing' }, 'cashew');
  assert.ok(html().includes('腰果'));
  click({ action: 'sub-apply' });
  assert.ok(!html().includes('modal-overlay'), '应用后关闭弹窗');
  assert.ok(html().includes('腰果'), '草稿行已替换为腰果');
  click({ action: 'discard-draft' });
  click({ action: 'close-detail' });
});

test('食材与采购页签：批次与折合单价', () => {
  click({ action: 'tab', tab: 'ingredients' });
  assert.ok(html().includes('可食比例'));
  assert.ok(html().includes('损耗率'));
  click({ action: 'toggle-ing', id: 'egg' });
  assert.ok(html().includes('b-egg-1') || html().includes('2026-08-01'), '展开显示历史批次（旧报价保留）');
  assert.ok(html().includes('新增批次'), '可追加批次');
});

test('价格情景页签：情景列表、试算设置、影响图表', () => {
  click({ action: 'tab', tab: 'scenarios' });
  assert.ok(html().includes('春节涨价模拟'), '含预置情景');
  assert.ok(html().includes('<svg'), '含毛利对比图表');
  assert.ok(html().includes('对照表'), '图表配表格视图');
});

test('切换情景后菜单页显示毛利变化', () => {
  change({ field: 'scenario-select' }, 'sc-cny');
  click({ action: 'tab', tab: 'menu' });
  assert.ok(html().includes('Δ'), '出现相对基准的变化列');
  assert.ok(html().includes('▲'), '成本上涨有方向指示');
});

test('销售统计页签：历史按销售时配方版本', () => {
  click({ action: 'tab', tab: 'sales' });
  assert.ok(html().includes('销售时的配方版本'));
  assert.ok(html().includes('v1') && html().includes('v2'), '同一菜品历史含多版本');
  assert.ok(html().includes('合计'));
});
