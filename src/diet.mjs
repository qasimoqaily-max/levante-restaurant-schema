const schema = 'https://schema.org';
const diets = {
  vegan: { key: 'vegan', uri: `${schema}/VeganDiet` },
  vegetarian: { key: 'vegetarian', uri: `${schema}/VegetarianDiet` },
};


export function itemDiet(item) {
  if (item.diet === 'vegan') return diets.vegan;
  if (item.diet === 'vegetarian') return diets.vegetarian;
  return undefined;
}
