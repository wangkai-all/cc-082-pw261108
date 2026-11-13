// 应用状态：数据 + 当前价格情景。localStorage 持久化，Node 环境退化为内存。
import { SEED } from './data.js';
import { DEFAULT_PRICING } from './costing.js';

const KEY = 'recipe-costing-v1';
const clone = (x) => JSON.parse(JSON.stringify(x));

const storage =
  typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

function seedState() {
  return {
    shopName: SEED.shopName,
    ingredients: clone(SEED.ingredients),
    batches: clone(SEED.batches),
    recipes: clone(SEED.recipes),
    sales: clone(SEED.sales),
    scenarios: clone(SEED.scenarios),
    activeScenarioId: 'sc-weighted',
    pricing: clone(DEFAULT_PRICING),
  };
}

function load() {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.recipes && s.ingredients ? s : null;
  } catch {
    return null;
  }
}

let idSeq = 1;
export const genId = (prefix) => `${prefix}-${Date.now().toString(36)}-${idSeq++}`;

export function createStore() {
  let state = load() || seedState();
  const listeners = new Set();

  const save = () => storage.setItem(KEY, JSON.stringify(state));
  const emit = () => {
    save();
    listeners.forEach((fn) => fn(state));
  };

  return {
    get state() {
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** 切换价格情景：把情景的 pricing 载入当前试算 */
    setScenario(id) {
      const sc = state.scenarios.find((s) => s.id === id);
      if (!sc) return;
      state.activeScenarioId = id;
      state.pricing = clone(sc.pricing);
      emit();
    },
    /** 直接修改当前试算价格（不自动写回情景） */
    updatePricing(mutator) {
      mutator(state.pricing);
      emit();
    },
    saveScenarioAs(name) {
      const sc = { id: genId('sc'), name, pricing: clone(state.pricing) };
      state.scenarios.push(sc);
      state.activeScenarioId = sc.id;
      emit();
      return sc;
    },
    deleteScenario(id) {
      const sc = state.scenarios.find((s) => s.id === id);
      if (!sc || sc.builtin) return;
      state.scenarios = state.scenarios.filter((s) => s.id !== id);
      if (state.activeScenarioId === id) {
        state.activeScenarioId = 'sc-weighted';
        state.pricing = clone(DEFAULT_PRICING);
      }
      emit();
    },

    /** 新增采购批次（旧报价保留） */
    addBatch(batch) {
      state.batches.push({ id: genId('b'), ...batch });
      emit();
    },

    /** 配方改版：只新增版本，历史版本与历史销量不受影响 */
    saveRecipeVersion(recipeId, versionDraft, note) {
      const recipe = state.recipes.find((r) => r.id === recipeId);
      if (!recipe) return null;
      const versionNo = Math.max(...recipe.versions.map((v) => v.versionNo)) + 1;
      const version = {
        id: genId(`${recipeId}-v`),
        versionNo,
        createdAt: new Date().toISOString().slice(0, 10),
        price: versionDraft.price,
        note: note || `第 ${versionNo} 版`,
        lines: clone(versionDraft.lines),
      };
      recipe.versions.push(version);
      recipe.currentVersionId = version.id;
      emit();
      return version;
    },
    setCurrentVersion(recipeId, versionId) {
      const recipe = state.recipes.find((r) => r.id === recipeId);
      if (recipe && recipe.versions.some((v) => v.id === versionId)) {
        recipe.currentVersionId = versionId;
        emit();
      }
    },

    reset() {
      state = seedState();
      emit();
    },
  };
}

export const store = createStore();
