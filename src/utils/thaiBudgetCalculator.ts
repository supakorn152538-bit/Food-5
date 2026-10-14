import { MarketIngredient, THAI_MARKET_INGREDIENTS } from '../data/thaiMarketData';
import { GroceryItem } from '../types/nutrition';

export interface BasketItem {
  ingredientId: string;
  quantity: number;
}

export type MarketPricesMap = Record<string, number>;

export const LOCAL_STORAGE_MARKET_PRICES = 'nutri5_thai_market_prices';
export const LOCAL_STORAGE_SAVED_BUDGET = 'nutri5_weekly_food_budget';
export const LOCAL_STORAGE_SAVED_BASKET = 'nutri5_weekly_food_basket';

/**
 * Load market prices with fallback to default benchmark prices
 */
export function loadMarketPrices(): MarketPricesMap {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MARKET_PRICES);
    if (saved) {
      const parsed = JSON.parse(saved);
      const res: MarketPricesMap = {};
      THAI_MARKET_INGREDIENTS.forEach((item) => {
        res[item.id] = typeof parsed[item.id] === 'number' && parsed[item.id] > 0 ? parsed[item.id] : item.defaultPrice;
      });
      return res;
    }
  } catch (e) {}

  const res: MarketPricesMap = {};
  THAI_MARKET_INGREDIENTS.forEach((item) => {
    res[item.id] = item.defaultPrice;
  });
  return res;
}

/**
 * Save updated market prices to localStorage
 */
export function saveMarketPrices(prices: MarketPricesMap): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MARKET_PRICES, JSON.stringify(prices));
  } catch (e) {}
}

/**
 * Simulate daily market price fluctuation (ดัชนีราคาตลาดสดวันนี้)
 * Changes fluctuate realistically within ±3% to ±10% based on Thai agricultural market realities
 */
export function simulateDailyPriceFluctuation(currentPrices: MarketPricesMap): {
  newPrices: MarketPricesMap;
  updatedCount: number;
} {
  const newPrices: MarketPricesMap = { ...currentPrices };
  let updatedCount = 0;

  THAI_MARKET_INGREDIENTS.forEach((item) => {
    // Produce (veggies/fruits) have higher seasonal swings, grains and oil have lower swings
    let maxDeltaPct = 0.06; // 6%
    if (item.category === 'produce' || item.category === 'fruit') {
      maxDeltaPct = 0.10; // 10%
    } else if (item.category === 'grain_carb' || item.category === 'pantry_oil') {
      maxDeltaPct = 0.04; // 4%
    }

    // Random fluctuation between -maxDeltaPct and +maxDeltaPct
    const factor = 1 + (Math.random() * (maxDeltaPct * 2) - maxDeltaPct);
    const calculated = Math.round(item.defaultPrice * factor);
    // Don't deviate crazily from base price (0.75x to 1.35x)
    const clamped = Math.max(Math.round(item.defaultPrice * 0.75), Math.min(Math.round(item.defaultPrice * 1.35), calculated));

    if (clamped !== newPrices[item.id]) {
      newPrices[item.id] = clamped;
      updatedCount++;
    }
  });

  saveMarketPrices(newPrices);
  return { newPrices, updatedCount };
}

/**
 * Calculate total basket cost
 */
export function calculateBasketTotal(
  basket: Record<string, number>,
  prices: MarketPricesMap
): {
  totalCost: number;
  groupTotals: Record<string, number>;
  totalItemsCount: number;
} {
  let totalCost = 0;
  const groupTotals: Record<string, number> = {
    group1: 0,
    group2: 0,
    group3: 0,
    group4: 0,
    group5: 0,
  };
  let totalItemsCount = 0;

  THAI_MARKET_INGREDIENTS.forEach((item) => {
    const qty = basket[item.id] || 0;
    if (qty > 0) {
      const price = prices[item.id] || item.defaultPrice;
      const subtotal = Math.round(qty * price);
      totalCost += subtotal;
      groupTotals[item.foodGroupId] = (groupTotals[item.foodGroupId] || 0) + subtotal;
      totalItemsCount += 1;
    }
  });

  return { totalCost, groupTotals, totalItemsCount };
}

/**
 * Auto-fit a 7-day 5-food-groups basket to the target budget within ±50 THB tolerance window!
 */
export function autoFitBasketToBudget(
  targetBudget: number,
  prices: MarketPricesMap
): Record<string, number> {
  const basket: Record<string, number> = {};

  // Step 1: Base nutritional foundation that guarantees all 5 food groups for 7 days
  basket['m_egg_30'] = 1;         // 30 eggs (20-30 eggs for 7 days)
  basket['m_chicken_breast'] = 1.0; // 1.0 kg chicken breast
  basket['m_tofu_firm'] = 1;      // 1 pack firm tofu
  basket['m_brown_rice'] = 1;     // 2 kg brown rice (serves 7-10 days)
  basket['m_cabbage'] = 1;        // 1 head cabbage
  basket['m_morning_glory'] = 1;  // 1 bunch morning glory
  basket['m_carrots'] = 1;        // 1 pack carrots
  basket['m_banana'] = 1;         // 1 bunch bananas
  basket['m_guava'] = 1;          // 1 kg guavas
  basket['m_rice_bran_oil'] = 0.5;// Half bottle oil

  // Calculate current baseline
  let currentTotal = calculateBasketTotal(basket, prices).totalCost;

  // If budget is higher, progressively scale and add variety
  if (targetBudget >= 800) {
    basket['m_chicken_breast'] = 1.5;
    basket['m_sweet_potato'] = 1.0;
    basket['m_chinese_cabbage'] = 1;
    basket['m_thai_herbs_set'] = 1;
    basket['m_soy_milk'] = 1;
  }

  if (targetBudget >= 1000) {
    basket['m_pork_tenderloin'] = 0.5;
    basket['m_broccoli'] = 1;
    basket['m_mushrooms'] = 1;
    basket['m_whole_wheat_bread'] = 1;
    basket['m_healthy_nuts'] = 1;
  }

  if (targetBudget >= 1200) {
    basket['m_fish_tilapia'] = 1;
    basket['m_papaya_or_orange'] = 1;
    basket['m_mushrooms'] = 2;
  }

  if (targetBudget >= 1400) {
    basket['m_chicken_breast'] = 2.0;
    basket['m_pork_tenderloin'] = 1.0;
    basket['m_apples_pack'] = 1;
    basket['m_rolled_oats'] = 1;
  }

  if (targetBudget >= 1700) {
    basket['m_salmon_fillet'] = 1;
    basket['m_fish_tilapia'] = 2;
    basket['m_broccoli'] = 2;
  }

  // Fine-tuning loop to reach within [targetBudget - 50, targetBudget + 50]
  const tolerance = 50;
  const minTarget = targetBudget - tolerance;
  const maxTarget = targetBudget + tolerance;

  // Candidates for incremental adjustments (from flexible to luxury)
  const adjustablesUp = [
    { id: 'm_chicken_breast', delta: 0.5 },
    { id: 'm_mushrooms', delta: 1 },
    { id: 'm_broccoli', delta: 1 },
    { id: 'm_fish_tilapia', delta: 1 },
    { id: 'm_healthy_nuts', delta: 1 },
    { id: 'm_pork_tenderloin', delta: 0.5 },
    { id: 'm_papaya_or_orange', delta: 1 },
    { id: 'm_whole_wheat_bread', delta: 1 },
    { id: 'm_sweet_potato', delta: 0.5 },
    { id: 'm_salmon_fillet', delta: 1 },
  ];

  const adjustablesDown = [
    { id: 'm_salmon_fillet', delta: -1 },
    { id: 'm_pork_tenderloin', delta: -0.5 },
    { id: 'm_fish_tilapia', delta: -1 },
    { id: 'm_apples_pack', delta: -1 },
    { id: 'm_healthy_nuts', delta: -1 },
    { id: 'm_whole_wheat_bread', delta: -1 },
    { id: 'm_broccoli', delta: -1 },
    { id: 'm_sweet_potato', delta: -0.5 },
    { id: 'm_soy_milk', delta: -1 },
    { id: 'm_chicken_breast', delta: -0.5 },
    { id: 'm_mushrooms', delta: -1 },
    { id: 'm_guava', delta: -1 },
  ];

  let iterations = 0;
  while (iterations < 25) {
    iterations++;
    const currentCost = calculateBasketTotal(basket, prices).totalCost;

    if (currentCost >= minTarget && currentCost <= maxTarget) {
      break; // Perfectly within ±50 THB!
    }

    if (currentCost < minTarget) {
      // Need to add items
      let added = false;
      for (const adj of adjustablesUp) {
        const itemInfo = THAI_MARKET_INGREDIENTS.find((i) => i.id === adj.id);
        if (!itemInfo) continue;
        const currentQty = basket[adj.id] || 0;
        const newQty = currentQty + adj.delta;
        if (newQty <= itemInfo.maxQty) {
          const costDiff = adj.delta * (prices[adj.id] || itemInfo.defaultPrice);
          if (currentCost + costDiff <= maxTarget + 30) {
            basket[adj.id] = newQty;
            added = true;
            break;
          }
        }
      }
      if (!added) break;
    } else if (currentCost > maxTarget) {
      // Need to reduce items
      let reduced = false;
      for (const adj of adjustablesDown) {
        const itemInfo = THAI_MARKET_INGREDIENTS.find((i) => i.id === adj.id);
        if (!itemInfo) continue;
        const currentQty = basket[adj.id] || 0;
        const newQty = currentQty + adj.delta;
        if (newQty >= 0) {
          basket[adj.id] = newQty;
          reduced = true;
          break;
        }
      }
      if (!reduced) break;
    }
  }

  return basket;
}

/**
 * Convert market basket items to GroceryItem list for direct checklist integration
 */
export function convertBasketToGroceryItems(
  basket: Record<string, number>,
  prices: MarketPricesMap
): GroceryItem[] {
  const result: GroceryItem[] = [];

  THAI_MARKET_INGREDIENTS.forEach((item) => {
    const qty = basket[item.id] || 0;
    if (qty > 0) {
      const price = prices[item.id] || item.defaultPrice;
      const subtotal = Math.round(qty * price);
      result.push({
        id: `mkt_${item.id}`,
        name: `${item.name} (${subtotal} ฿)`,
        category: item.category,
        categoryLabel: item.foodGroupLabel,
        quantityEst: `${qty} ${item.unit}`,
        sourceMeals: ['คำนวณจากงบประมาณตลาดไทย 7 วัน'],
        checked: false,
      });
    }
  });

  return result;
}
