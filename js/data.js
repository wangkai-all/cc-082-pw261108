// 本地虚构数据：「知味小厨」的菜单、食材、采购批次、销量与价格情景。
// 所有公司与供应商均为虚构。日期集中在 2026-08 ~ 2026-11。

export const SEED = {
  shopName: '知味小厨',

  // yieldRate 可食比例（毛料→净料）；lossRate 加工损耗率；
  // density g/ml；pieceWeight 单个净重 g；packageSpec 包装规格。
  ingredients: [
    { id: 'chicken_breast', name: '鸡胸肉', category: '禽肉', allergens: [], yieldRate: 0.9, lossRate: 0.03, packageSpec: { unit: '箱', qty: 10, qtyUnit: 'kg' } },
    { id: 'chicken_thigh', name: '鸡腿肉(带骨)', category: '禽肉', allergens: [], yieldRate: 0.72, lossRate: 0.03, packageSpec: { unit: '箱', qty: 10, qtyUnit: 'kg' } },
    { id: 'beef_brisket', name: '牛腩', category: '畜肉', allergens: [], yieldRate: 0.85, lossRate: 0.05, packageSpec: { unit: '箱', qty: 20, qtyUnit: 'kg' } },
    { id: 'tofu_firm', name: '北豆腐', category: '豆制品', allergens: ['大豆'], yieldRate: 0.98, lossRate: 0.02, packageSpec: { unit: '板', qty: 2.5, qtyUnit: 'kg' } },
    { id: 'egg', name: '鸡蛋', category: '蛋奶', allergens: ['蛋类'], yieldRate: 0.88, lossRate: 0.02, pieceWeight: 50, packageSpec: { unit: '箱', qty: 15, qtyUnit: 'kg' } },
    { id: 'rice', name: '大米', category: '粮油', allergens: [], yieldRate: 1, lossRate: 0.01, packageSpec: { unit: '袋', qty: 25, qtyUnit: 'kg' } },
    { id: 'tomato', name: '番茄', category: '蔬菜', allergens: [], yieldRate: 0.92, lossRate: 0.02, packageSpec: { unit: '箱', qty: 10, qtyUnit: 'kg' } },
    { id: 'broccoli', name: '西兰花', category: '蔬菜', allergens: [], yieldRate: 0.8, lossRate: 0.02, packageSpec: { unit: '箱', qty: 8, qtyUnit: 'kg' } },
    { id: 'potato', name: '土豆', category: '蔬菜', allergens: [], yieldRate: 0.85, lossRate: 0.02, packageSpec: { unit: '袋', qty: 20, qtyUnit: 'kg' } },
    { id: 'shiitake_dried', name: '干香菇', category: '菌菇', allergens: [], yieldRate: 1, lossRate: 0, packageSpec: { unit: '包', qty: 1, qtyUnit: 'kg' } },
    { id: 'shiitake_fresh', name: '鲜香菇', category: '菌菇', allergens: [], yieldRate: 0.9, lossRate: 0.02, packageSpec: { unit: '盒', qty: 2, qtyUnit: 'kg' } },
    { id: 'peanut', name: '花生仁', category: '坚果', allergens: ['花生'], yieldRate: 1, lossRate: 0.02, packageSpec: { unit: '袋', qty: 5, qtyUnit: 'kg' } },
    { id: 'cashew', name: '腰果', category: '坚果', allergens: ['坚果'], yieldRate: 1, lossRate: 0.02, packageSpec: { unit: '袋', qty: 5, qtyUnit: 'kg' } },
    { id: 'oil', name: '食用油', category: '粮油', allergens: [], yieldRate: 1, lossRate: 0, density: 0.92, packageSpec: { unit: '桶', qty: 10, qtyUnit: 'L' } },
    { id: 'butter', name: '黄油', category: '蛋奶', allergens: ['乳'], yieldRate: 1, lossRate: 0, packageSpec: { unit: '箱', qty: 5, qtyUnit: 'kg' } },
    { id: 'soy_sauce', name: '生抽', category: '调味', allergens: ['大豆', '麸质'], yieldRate: 1, lossRate: 0, density: 1.15, packageSpec: { unit: '桶', qty: 5, qtyUnit: 'L' } },
    { id: 'doubanjiang', name: '豆瓣酱', category: '调味', allergens: ['大豆', '麸质'], yieldRate: 1, lossRate: 0, packageSpec: { unit: '桶', qty: 5, qtyUnit: 'kg' } },
    { id: 'dried_chili', name: '干辣椒', category: '调味', allergens: [], yieldRate: 0.95, lossRate: 0, packageSpec: { unit: '袋', qty: 1, qtyUnit: 'kg' } },
    { id: 'szechuan_pepper', name: '花椒', category: '调味', allergens: [], yieldRate: 1, lossRate: 0, packageSpec: { unit: '袋', qty: 0.5, qtyUnit: 'kg' } },
    { id: 'garlic', name: '大蒜', category: '蔬菜', allergens: [], yieldRate: 0.85, lossRate: 0.01, packageSpec: { unit: '袋', qty: 5, qtyUnit: 'kg' } },
    { id: 'ginger', name: '生姜', category: '蔬菜', allergens: [], yieldRate: 0.9, lossRate: 0, packageSpec: { unit: '袋', qty: 2, qtyUnit: 'kg' } },
    { id: 'scallion', name: '小葱', category: '蔬菜', allergens: [], yieldRate: 0.8, lossRate: 0.01, packageSpec: { unit: '箱', qty: 2, qtyUnit: 'kg' } },
    { id: 'sugar', name: '白糖', category: '调味', allergens: [], yieldRate: 1, lossRate: 0, packageSpec: { unit: '袋', qty: 25, qtyUnit: 'kg' } },
    { id: 'vinegar', name: '米醋', category: '调味', allergens: [], yieldRate: 1, lossRate: 0, density: 1.01, packageSpec: { unit: '瓶', qty: 0.5, qtyUnit: 'L' } },
    { id: 'starch', name: '玉米淀粉', category: '调味', allergens: [], yieldRate: 1, lossRate: 0, packageSpec: { unit: '袋', qty: 2, qtyUnit: 'kg' } },
    { id: 'salt', name: '食盐', category: '调味', allergens: [], yieldRate: 1, lossRate: 0, packageSpec: { unit: '袋', qty: 1, qtyUnit: 'kg' } },
  ],

  // 采购批次：价格变化只新增批次，旧报价保留。
  batches: [
    { id: 'b-cbr-1', ingredientId: 'chicken_breast', date: '2026-08-05', qty: 1, unit: '箱', totalPrice: 170, supplier: '蜀香食材配送' },
    { id: 'b-cbr-2', ingredientId: 'chicken_breast', date: '2026-10-15', qty: 1, unit: '箱', totalPrice: 160, supplier: '蜀香食材配送', note: '促销降价' },

    { id: 'b-ct-1', ingredientId: 'chicken_thigh', date: '2026-08-05', qty: 2, unit: '箱', totalPrice: 360, supplier: '蜀香食材配送' },
    { id: 'b-ct-2', ingredientId: 'chicken_thigh', date: '2026-09-10', qty: 2, unit: '箱', totalPrice: 390, supplier: '蜀香食材配送' },
    { id: 'b-ct-3', ingredientId: 'chicken_thigh', date: '2026-11-02', qty: 3, unit: '箱', totalPrice: 630, supplier: '鲜味来供应链', note: '换供应商，涨价' },

    { id: 'b-bf-1', ingredientId: 'beef_brisket', date: '2026-08-20', qty: 1, unit: '箱', totalPrice: 1100, supplier: '鲜味来供应链' },
    { id: 'b-bf-2', ingredientId: 'beef_brisket', date: '2026-10-28', qty: 1, unit: '箱', totalPrice: 1160, supplier: '鲜味来供应链' },

    { id: 'b-tf-1', ingredientId: 'tofu_firm', date: '2026-11-01', qty: 10, unit: '板', totalPrice: 100, supplier: '老王豆腐坊' },
    { id: 'b-tf-2', ingredientId: 'tofu_firm', date: '2026-11-12', qty: 10, unit: '板', totalPrice: 105, supplier: '老王豆腐坊' },

    { id: 'b-egg-1', ingredientId: 'egg', date: '2026-08-01', qty: 1, unit: '箱', totalPrice: 135, supplier: '绿源农贸' },
    { id: 'b-egg-2', ingredientId: 'egg', date: '2026-09-15', qty: 2, unit: '箱', totalPrice: 288, supplier: '绿源农贸' },
    { id: 'b-egg-3', ingredientId: 'egg', date: '2026-11-10', qty: 1, unit: '箱', totalPrice: 150, supplier: '绿源农贸', note: '蛋价上行' },

    { id: 'b-rice-1', ingredientId: 'rice', date: '2026-07-20', qty: 2, unit: '袋', totalPrice: 400, supplier: '万家福粮油' },

    { id: 'b-tom-1', ingredientId: 'tomato', date: '2026-08-12', qty: 1, unit: '箱', totalPrice: 60, supplier: '绿源农贸' },
    { id: 'b-tom-2', ingredientId: 'tomato', date: '2026-11-05', qty: 1, unit: '箱', totalPrice: 80, supplier: '绿源农贸', note: '秋冬季涨价' },

    { id: 'b-bro-1', ingredientId: 'broccoli', date: '2026-08-12', qty: 1, unit: '箱', totalPrice: 72, supplier: '绿源农贸' },
    { id: 'b-bro-2', ingredientId: 'broccoli', date: '2026-11-05', qty: 1, unit: '箱', totalPrice: 64, supplier: '绿源农贸', note: '本地菜上市，回落' },

    { id: 'b-pot-1', ingredientId: 'potato', date: '2026-09-01', qty: 1, unit: '袋', totalPrice: 70, supplier: '绿源农贸' },

    { id: 'b-sd-1', ingredientId: 'shiitake_dried', date: '2026-09-01', qty: 2, unit: '包', totalPrice: 180, supplier: '山里红干货' },

    { id: 'b-sf-1', ingredientId: 'shiitake_fresh', date: '2026-10-20', qty: 1, unit: '盒', totalPrice: 36, supplier: '绿源农贸' },
    { id: 'b-sf-2', ingredientId: 'shiitake_fresh', date: '2026-11-08', qty: 1, unit: '盒', totalPrice: 32, supplier: '绿源农贸' },

    { id: 'b-pea-1', ingredientId: 'peanut', date: '2026-08-10', qty: 1, unit: '袋', totalPrice: 90, supplier: '万家福粮油' },
    { id: 'b-pea-2', ingredientId: 'peanut', date: '2026-11-01', qty: 1, unit: '袋', totalPrice: 100, supplier: '万家福粮油', note: '新季花生涨价' },

    { id: 'b-cas-1', ingredientId: 'cashew', date: '2026-10-01', qty: 1, unit: '袋', totalPrice: 350, supplier: '鲜味来供应链' },

    { id: 'b-oil-1', ingredientId: 'oil', date: '2026-08-01', qty: 2, unit: '桶', totalPrice: 260, supplier: '万家福粮油' },
    { id: 'b-oil-2', ingredientId: 'oil', date: '2026-10-25', qty: 2, unit: '桶', totalPrice: 280, supplier: '万家福粮油' },

    { id: 'b-but-1', ingredientId: 'butter', date: '2026-09-10', qty: 1, unit: '箱', totalPrice: 320, supplier: '鲜味来供应链' },

    { id: 'b-ss-1', ingredientId: 'soy_sauce', date: '2026-08-01', qty: 2, unit: '桶', totalPrice: 110, supplier: '川味调料行' },
    { id: 'b-db-1', ingredientId: 'doubanjiang', date: '2026-08-01', qty: 1, unit: '桶', totalPrice: 75, supplier: '川味调料行' },
    { id: 'b-dc-1', ingredientId: 'dried_chili', date: '2026-08-15', qty: 1, unit: '袋', totalPrice: 40, supplier: '川味调料行' },
    { id: 'b-sp-1', ingredientId: 'szechuan_pepper', date: '2026-08-15', qty: 1, unit: '袋', totalPrice: 60, supplier: '川味调料行' },

    { id: 'b-gar-1', ingredientId: 'garlic', date: '2026-09-01', qty: 1, unit: '袋', totalPrice: 40, supplier: '绿源农贸' },
    { id: 'b-gar-2', ingredientId: 'garlic', date: '2026-11-03', qty: 1, unit: '袋', totalPrice: 45, supplier: '绿源农贸' },

    { id: 'b-gin-1', ingredientId: 'ginger', date: '2026-09-01', qty: 1, unit: '袋', totalPrice: 16, supplier: '绿源农贸' },
    { id: 'b-sca-1', ingredientId: 'scallion', date: '2026-10-01', qty: 1, unit: '箱', totalPrice: 12, supplier: '绿源农贸' },
    { id: 'b-sug-1', ingredientId: 'sugar', date: '2026-08-01', qty: 1, unit: '袋', totalPrice: 150, supplier: '万家福粮油' },
    { id: 'b-vin-1', ingredientId: 'vinegar', date: '2026-08-01', qty: 4, unit: '瓶', totalPrice: 24, supplier: '川味调料行' },
    { id: 'b-st-1', ingredientId: 'starch', date: '2026-08-01', qty: 1, unit: '袋', totalPrice: 12, supplier: '万家福粮油' },
    { id: 'b-sal-1', ingredientId: 'salt', date: '2026-08-01', qty: 1, unit: '袋', totalPrice: 2, supplier: '万家福粮油' },
  ],

  // 配方：versions 只增不改；currentVersionId 指向在售版本。
  recipes: [
    {
      id: 'gongbao', name: '宫保鸡丁', category: '热菜', currentVersionId: 'gongbao-v2',
      versions: [
        {
          id: 'gongbao-v1', versionNo: 1, createdAt: '2026-08-01', price: 36, note: '初始配方',
          lines: [
            { ingredientId: 'chicken_breast', qty: 200, unit: 'g' },
            { ingredientId: 'peanut', qty: 30, unit: 'g' },
            { ingredientId: 'dried_chili', qty: 6, unit: 'g' },
            { ingredientId: 'szechuan_pepper', qty: 2, unit: 'g' },
            { ingredientId: 'scallion', qty: 25, unit: 'g' },
            { ingredientId: 'ginger', qty: 5, unit: 'g' },
            { ingredientId: 'garlic', qty: 10, unit: 'g' },
            { ingredientId: 'soy_sauce', qty: 15, unit: 'ml' },
            { ingredientId: 'vinegar', qty: 10, unit: 'ml' },
            { ingredientId: 'sugar', qty: 10, unit: 'g' },
            { ingredientId: 'starch', qty: 5, unit: 'g' },
            { ingredientId: 'oil', qty: 30, unit: 'ml' },
            { ingredientId: 'salt', qty: 1, unit: 'g' },
          ],
        },
        {
          id: 'gongbao-v2', versionNo: 2, createdAt: '2026-10-08', price: 38, note: '鸡胸肉改鸡腿肉，口感更嫩；售价上调 2 元',
          lines: [
            { ingredientId: 'chicken_thigh', qty: 180, unit: 'g' },
            { ingredientId: 'peanut', qty: 30, unit: 'g' },
            { ingredientId: 'dried_chili', qty: 6, unit: 'g' },
            { ingredientId: 'szechuan_pepper', qty: 2, unit: 'g' },
            { ingredientId: 'scallion', qty: 25, unit: 'g' },
            { ingredientId: 'ginger', qty: 5, unit: 'g' },
            { ingredientId: 'garlic', qty: 10, unit: 'g' },
            { ingredientId: 'soy_sauce', qty: 15, unit: 'ml' },
            { ingredientId: 'vinegar', qty: 10, unit: 'ml' },
            { ingredientId: 'sugar', qty: 10, unit: 'g' },
            { ingredientId: 'starch', qty: 5, unit: 'g' },
            { ingredientId: 'oil', qty: 30, unit: 'ml' },
            { ingredientId: 'salt', qty: 1, unit: 'g' },
          ],
        },
      ],
    },
    {
      id: 'mapo', name: '麻婆豆腐', category: '热菜', currentVersionId: 'mapo-v1',
      versions: [
        {
          id: 'mapo-v1', versionNo: 1, createdAt: '2026-08-01', price: 28, note: '初始配方',
          lines: [
            { ingredientId: 'tofu_firm', qty: 300, unit: 'g' },
            { ingredientId: 'beef_brisket', qty: 50, unit: 'g' },
            { ingredientId: 'doubanjiang', qty: 25, unit: 'g' },
            { ingredientId: 'szechuan_pepper', qty: 2, unit: 'g' },
            { ingredientId: 'garlic', qty: 10, unit: 'g' },
            { ingredientId: 'ginger', qty: 5, unit: 'g' },
            { ingredientId: 'soy_sauce', qty: 10, unit: 'ml' },
            { ingredientId: 'oil', qty: 25, unit: 'ml' },
            { ingredientId: 'starch', qty: 3, unit: 'g' },
            { ingredientId: 'scallion', qty: 10, unit: 'g' },
          ],
        },
      ],
    },
    {
      id: 'beef_tomato', name: '番茄炖牛腩', category: '热菜', currentVersionId: 'beef_tomato-v2',
      versions: [
        {
          id: 'beef_tomato-v1', versionNo: 1, createdAt: '2026-09-01', price: 56, note: '初始配方',
          lines: [
            { ingredientId: 'beef_brisket', qty: 250, unit: 'g' },
            { ingredientId: 'tomato', qty: 200, unit: 'g' },
            { ingredientId: 'potato', qty: 100, unit: 'g' },
            { ingredientId: 'ginger', qty: 5, unit: 'g' },
            { ingredientId: 'soy_sauce', qty: 20, unit: 'ml' },
            { ingredientId: 'sugar', qty: 10, unit: 'g' },
            { ingredientId: 'oil', qty: 20, unit: 'ml' },
            { ingredientId: 'salt', qty: 2, unit: 'g' },
          ],
        },
        {
          id: 'beef_tomato-v2', versionNo: 2, createdAt: '2026-11-06', price: 58, note: '番茄涨价：番茄减量 200→160g，售价上调 2 元',
          lines: [
            { ingredientId: 'beef_brisket', qty: 250, unit: 'g' },
            { ingredientId: 'tomato', qty: 160, unit: 'g' },
            { ingredientId: 'potato', qty: 100, unit: 'g' },
            { ingredientId: 'ginger', qty: 5, unit: 'g' },
            { ingredientId: 'soy_sauce', qty: 20, unit: 'ml' },
            { ingredientId: 'sugar', qty: 10, unit: 'g' },
            { ingredientId: 'oil', qty: 20, unit: 'ml' },
            { ingredientId: 'salt', qty: 2, unit: 'g' },
          ],
        },
      ],
    },
    {
      id: 'broccoli_garlic', name: '蒜蓉西兰花', category: '素菜', currentVersionId: 'broccoli_garlic-v1',
      versions: [
        {
          id: 'broccoli_garlic-v1', versionNo: 1, createdAt: '2026-08-01', price: 22, note: '初始配方',
          lines: [
            { ingredientId: 'broccoli', qty: 250, unit: 'g' },
            { ingredientId: 'garlic', qty: 25, unit: 'g' },
            { ingredientId: 'oil', qty: 20, unit: 'ml' },
            { ingredientId: 'salt', qty: 2, unit: 'g' },
          ],
        },
      ],
    },
    {
      id: 'fried_rice', name: '蛋炒饭', category: '主食', currentVersionId: 'fried_rice-v1',
      versions: [
        {
          id: 'fried_rice-v1', versionNo: 1, createdAt: '2026-08-01', price: 18, note: '初始配方（大米按生米净料计）',
          lines: [
            { ingredientId: 'rice', qty: 180, unit: 'g' },
            { ingredientId: 'egg', qty: 2, unit: '个' },
            { ingredientId: 'scallion', qty: 15, unit: 'g' },
            { ingredientId: 'oil', qty: 25, unit: 'ml' },
            { ingredientId: 'soy_sauce', qty: 8, unit: 'ml' },
            { ingredientId: 'salt', qty: 1, unit: 'g' },
          ],
        },
      ],
    },
    {
      id: 'mushroom_egg', name: '鲜香菇炒蛋', category: '热菜', currentVersionId: 'mushroom_egg-v1',
      versions: [
        {
          id: 'mushroom_egg-v1', versionNo: 1, createdAt: '2026-10-15', price: 26, note: '初始配方',
          lines: [
            { ingredientId: 'shiitake_fresh', qty: 150, unit: 'g' },
            { ingredientId: 'egg', qty: 3, unit: '个' },
            { ingredientId: 'scallion', qty: 10, unit: 'g' },
            { ingredientId: 'oil', qty: 25, unit: 'ml' },
            { ingredientId: 'salt', qty: 2, unit: 'g' },
          ],
        },
      ],
    },
  ],

  // 销量记录（按月汇总）：配方版本按销售时锁定，改版不影响历史。
  sales: [
    { id: 's-01', date: '2026-08-31', recipeId: 'gongbao', versionId: 'gongbao-v1', qty: 320 },
    { id: 's-02', date: '2026-09-30', recipeId: 'gongbao', versionId: 'gongbao-v1', qty: 295 },
    { id: 's-03', date: '2026-10-31', recipeId: 'gongbao', versionId: 'gongbao-v2', qty: 280 },
    { id: 's-04', date: '2026-11-30', recipeId: 'gongbao', versionId: 'gongbao-v2', qty: 265 },
    { id: 's-05', date: '2026-08-31', recipeId: 'mapo', versionId: 'mapo-v1', qty: 410 },
    { id: 's-06', date: '2026-09-30', recipeId: 'mapo', versionId: 'mapo-v1', qty: 395 },
    { id: 's-07', date: '2026-10-31', recipeId: 'mapo', versionId: 'mapo-v1', qty: 420 },
    { id: 's-08', date: '2026-11-30', recipeId: 'mapo', versionId: 'mapo-v1', qty: 380 },
    { id: 's-09', date: '2026-09-30', recipeId: 'beef_tomato', versionId: 'beef_tomato-v1', qty: 150 },
    { id: 's-10', date: '2026-10-31', recipeId: 'beef_tomato', versionId: 'beef_tomato-v1', qty: 165 },
    { id: 's-11', date: '2026-11-30', recipeId: 'beef_tomato', versionId: 'beef_tomato-v2', qty: 140 },
    { id: 's-12', date: '2026-08-31', recipeId: 'broccoli_garlic', versionId: 'broccoli_garlic-v1', qty: 210 },
    { id: 's-13', date: '2026-09-30', recipeId: 'broccoli_garlic', versionId: 'broccoli_garlic-v1', qty: 225 },
    { id: 's-14', date: '2026-10-31', recipeId: 'broccoli_garlic', versionId: 'broccoli_garlic-v1', qty: 205 },
    { id: 's-15', date: '2026-11-30', recipeId: 'broccoli_garlic', versionId: 'broccoli_garlic-v1', qty: 190 },
    { id: 's-16', date: '2026-08-31', recipeId: 'fried_rice', versionId: 'fried_rice-v1', qty: 520 },
    { id: 's-17', date: '2026-09-30', recipeId: 'fried_rice', versionId: 'fried_rice-v1', qty: 540 },
    { id: 's-18', date: '2026-10-31', recipeId: 'fried_rice', versionId: 'fried_rice-v1', qty: 510 },
    { id: 's-19', date: '2026-11-30', recipeId: 'fried_rice', versionId: 'fried_rice-v1', qty: 495 },
    { id: 's-20', date: '2026-10-31', recipeId: 'mushroom_egg', versionId: 'mushroom_egg-v1', qty: 130 },
    { id: 's-21', date: '2026-11-30', recipeId: 'mushroom_egg', versionId: 'mushroom_egg-v1', qty: 145 },
  ],

  // 价格情景：pricing = { mode, batchPick, priceAdjustPct }
  scenarios: [
    {
      id: 'sc-weighted', name: '加权平均成本（基准）', builtin: true,
      pricing: { mode: 'weighted', batchPick: {}, priceAdjustPct: {} },
    },
    {
      id: 'sc-latest', name: '最新采购价', builtin: true,
      pricing: { mode: 'latest', batchPick: {}, priceAdjustPct: {} },
    },
    {
      id: 'sc-egg-lock', name: '鸡蛋锁定老批次',
      pricing: { mode: 'weighted', batchPick: { egg: 'b-egg-1' }, priceAdjustPct: {} },
    },
    {
      id: 'sc-cny', name: '春节涨价模拟',
      pricing: {
        mode: 'weighted', batchPick: {},
        priceAdjustPct: { chicken_thigh: 15, chicken_breast: 15, beef_brisket: 20, egg: 10, tomato: 10 },
      },
    },
  ],
};
