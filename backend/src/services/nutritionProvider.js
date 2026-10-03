'use strict';
const prisma = require('../lib/prisma');
const { unitToGrams, macrosForGrams } = require('../utils/macroUtils');
const { REFERENCE_FOODS } = require('../data/referenceFoods');

function refFoodToPublic(rf) {
  return {
    id: rf.id,
    name: rf.name,
    category: rf.cat || 'General',
    isCustom: false,
    isProduct: false,
    nutrients: {
      calories: rf.per100.cal,
      proteinG: rf.per100.p,
      carbsG: rf.per100.c,
      fatG: rf.per100.f,
      fibreG: rf.per100.fib,
      sugarG: rf.per100.sug || 0,
      satFatG: rf.per100.sat || 0,
      sodiumMg: rf.per100.sod || 0,
    },
    servings: rf.serving ? [rf.serving] : [{ qty: 100, unit: 'g', grams: 100, label: '100g' }],
  };
}

/**
 * NutritionProvider — the ONLY place route/service code should look up food
 * nutrition. Today this is backed by the internal `foods` table (seeded from
 * src/data/referenceFoods.js), but the interface is deliberately narrow so a
 * licensed external API (USDA FoodData Central, Edamam, Nutritionix) can be
 * dropped in later as a second implementation without touching callers:
 *
 *   class EdamamNutritionProvider { async search(q, userId) {...} async getById(id) {...} }
 *
 * and swapping the export at the bottom of this file.
 */
class InternalNutritionProvider {
  /** Full-text-ish search across the internal DB plus this user's custom
   * foods/products. Case-insensitive substring match, capped at 25 results. */
  async search(query, userId) {
    try {
      const where = {
        name: { contains: query, mode: 'insensitive' },
        OR: [{ isCustom: false }, ...(userId ? [{ ownerUserId: userId }] : [])],
      };
      const foods = await prisma.food.findMany({
        where,
        include: { nutrients: true, servings: true },
        take: 25,
        orderBy: { name: 'asc' },
      });
      if (foods && foods.length > 0) return foods.map(toPublicFood);
    } catch (err) {
      // Fallback to embedded reference foods if DB query fails
    }
    const qLower = (query || '').toLowerCase().trim();
    return REFERENCE_FOODS
      .filter((f) => !qLower || f.name.toLowerCase().includes(qLower) || (f.cat && f.cat.toLowerCase().includes(qLower)))
      .slice(0, 25)
      .map(refFoodToPublic);
  }

  async getById(foodId) {
    try {
      const food = await prisma.food.findUnique({
        where: { id: foodId },
        include: { nutrients: true, servings: true },
      });
      if (food) return toPublicFood(food);
    } catch (err) {
      // Fallback to reference foods
    }
    const ref = REFERENCE_FOODS.find((f) => f.id === foodId);
    return ref ? refFoodToPublic(ref) : null;
  }

  /** Compute absolute macros for `qty` of `unit` of a food. `unit` may be
   * 'g', 'ml', 'serving', 'piece', or any FoodServing.unit on the food. */
  async computeMacros(foodId, qty, unit) {
    const food = await this.getById(foodId);
    if (!food) return null;
    const serving = food.servings[0] || null;
    const grams = unitToGrams(serving, qty, unit);
    return macrosForGrams(food.nutrients, grams);
  }

  /** Every custom food (manual entries + saved label-scan products) this
   * user owns — for list screens that need everything, not a search term. */
  async listCustom(userId) {
    if (!userId) return [];
    const foods = await prisma.food.findMany({
      where: { isCustom: true, ownerUserId: userId },
      include: { nutrients: true, servings: true },
      orderBy: { createdAt: 'desc' },
    });
    return foods.map(toPublicFood);
  }

  /** Create a user-owned custom food (manual entry or a saved OCR product). */
  async createCustomFood(userId, { name, category, isProduct, serving, nutrientsPer100 }) {
    const food = await prisma.food.create({
      data: {
        name,
        category: category || 'Custom',
        isCustom: true,
        isProduct: !!isProduct,
        ownerUserId: userId,
        nutrients: { create: nutrientsPer100 },
        servings: { create: [serving] },
      },
      include: { nutrients: true, servings: true },
    });
    await prisma.customFood.create({ data: { userId, foodId: food.id, isProduct: !!isProduct } });
    return toPublicFood(food);
  }
}

function toPublicFood(food) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    isCustom: food.isCustom,
    isProduct: food.isProduct,
    nutrients: food.nutrients
      ? {
          calories: food.nutrients.calories,
          proteinG: food.nutrients.proteinG,
          carbsG: food.nutrients.carbsG,
          fatG: food.nutrients.fatG,
          fibreG: food.nutrients.fibreG,
          sugarG: food.nutrients.sugarG,
          satFatG: food.nutrients.satFatG,
          sodiumMg: food.nutrients.sodiumMg,
        }
      : null,
    servings: food.servings.map((s) => ({ qty: s.qty, unit: s.unit, grams: s.grams, label: s.label })),
  };
}

module.exports = new InternalNutritionProvider();
