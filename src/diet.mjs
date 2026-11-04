const schema = 'https://schema.org';
const diets = {
  vegan: { key: 'vegan', uri: `${schema}/VeganDiet` },
  vegetarian: { key: 'vegetarian', uri: `${schema}/VegetarianDiet` },
  halal: { key: 'halal', uri: `${schema}/HalalDiet` },
};

// Exact meat/poultry IDs approved by the owner on 2026-11-04.
// Do not infer halal status for unlisted items or override vegan/vegetarian diets.
const halalItemIds = new Set([
  'kebbeh', 'arays-lahmeh', 'lamb-soup', 'chicken-salad', 'chicken-tajine',
  'lamb-tajine', 'kafta-mishwiyeh', 'shish-taouk', 'mix-grill', 'lahmeh-mishwiyeh',
]);

export function itemDiet(item) {
  if (item.diet === 'vegan') return diets.vegan;
  if (item.diet === 'vegetarian') return diets.vegetarian;
  if (item.diet === 'none' && halalItemIds.has(item.id)) return diets.halal;
  return undefined;
}
