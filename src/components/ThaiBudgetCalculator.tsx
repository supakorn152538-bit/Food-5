import React, { useState, useEffect } from 'react';
import {
  MarketIngredient,
  THAI_MARKET_INGREDIENTS,
} from '../data/thaiMarketData';
import {
  MarketPricesMap,
  loadMarketPrices,
  saveMarketPrices,
  simulateDailyPriceFluctuation,
  calculateBasketTotal,
  autoFitBasketToBudget,
  convertBasketToGroceryItems,
  LOCAL_STORAGE_SAVED_BUDGET,
  LOCAL_STORAGE_SAVED_BASKET,
} from '../utils/thaiBudgetCalculator';
import { GroceryItem } from '../types/nutrition';
import {
  Coins,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  Copy,
  Check,
  Edit2,
  RotateCcw,
  Info,
  Calendar,
  Utensils,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ThaiBudgetCalculatorProps {
  onExportToGrocery: (items: GroceryItem[]) => void;
  onSwitchToGroceryTab: () => void;
}

export const ThaiBudgetCalculator: React.FC<ThaiBudgetCalculatorProps> = ({
  onExportToGrocery,
  onSwitchToGroceryTab,
}) => {
  // User input budget (default 1,000 THB)
  const [budget, setBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SAVED_BUDGET);
      if (saved) return parseInt(saved) || 1000;
    } catch (e) {}
    return 1000;
  });

  // Current market prices (supports daily custom edits & sync)
  const [prices, setPrices] = useState<MarketPricesMap>(() => loadMarketPrices());

  // Basket quantities { [ingredientId]: quantity }
  const [basket, setBasket] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SAVED_BASKET);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return autoFitBasketToBudget(1000, loadMarketPrices());
  });

  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const [isEditingPrices, setIsEditingPrices] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Save budget and basket to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_BUDGET, budget.toString());
    } catch (e) {}
  }, [budget]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_BASKET, JSON.stringify(basket));
    } catch (e) {}
  }, [basket]);

  // Derived metrics
  const { totalCost, groupTotals, totalItemsCount } = calculateBasketTotal(basket, prices);
  const diff = totalCost - budget;
  const isWithinTolerance = Math.abs(diff) <= 50;
  const dailyAverageCost = Math.round(totalCost / 7);
  const mealAverageCost = Math.round(totalCost / 21); // 21 main meals in 7 days

  const BUDGET_PRESETS = [600, 800, 1000, 1200, 1500, 2000];

  const handleBudgetChange = (newBudget: number) => {
    const val = Math.max(300, Math.min(10000, newBudget));
    setBudget(val);
  };

  const handleAutoFit = () => {
    const newBasket = autoFitBasketToBudget(budget, prices);
    setBasket(newBasket);
    showFeedback(`✨ จัดชุดวัตถุดิบ 7 วันอัตโนมัติให้พอดีงบ ${budget.toLocaleString()} บาท (±50฿) เรียบร้อยแล้ว`);
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    const item = THAI_MARKET_INGREDIENTS.find((i) => i.id === id);
    if (!item) return;
    const current = basket[id] || 0;
    const updated = Math.max(0, Math.min(item.maxQty, Math.round((current + delta) * 10) / 10));
    setBasket((prev) => ({
      ...prev,
      [id]: updated,
    }));
  };

  const handleSimulateDailyPrices = () => {
    const { newPrices, updatedCount } = simulateDailyPriceFluctuation(prices);
    setPrices(newPrices);
    showFeedback(`🔄 อัปเดตดัชนีราคาตลาดสดวันนี้แล้ว (${updatedCount} รายการมีการปรับตามกลไกตลาด)`);
  };

  const handleResetToDefaultPrices = () => {
    const defaults: MarketPricesMap = {};
    THAI_MARKET_INGREDIENTS.forEach((item) => {
      defaults[item.id] = item.defaultPrice;
    });
    setPrices(defaults);
    saveMarketPrices(defaults);
    showFeedback('↺ คืนค่าราคากลางตลาดสดมาตรฐานเรียบร้อยแล้ว');
  };

  const handleSaveItemPrice = (id: string) => {
    const val = parseFloat(editPriceValue);
    if (!isNaN(val) && val > 0) {
      const updated = { ...prices, [id]: Math.round(val) };
      setPrices(updated);
      saveMarketPrices(updated);
      setEditingItemId(null);
      showFeedback(`บันทึกราคาใหม่ของ ${THAI_MARKET_INGREDIENTS.find((i) => i.id === id)?.name} เป็น ${Math.round(val)} บาทแล้ว`);
    }
  };

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleExportToGroceryChecklist = () => {
    const groceryItems = convertBasketToGroceryItems(basket, prices);
    onExportToGrocery(groceryItems);
    showFeedback(`🛒 นำรายการซื้อวัตถุดิบ ${groceryItems.length} รายการไปยังเช็คลิสต์แล้ว`);
    onSwitchToGroceryTab();
  };

  const handleCopySummaryText = () => {
    let text = `🛒 สรุปรายการของที่ซื้อได้ใน 7 วัน (งบประมาณ ${budget.toLocaleString()} บาท)\n`;
    text += `💰 ยอดรวมจริง: ${totalCost.toLocaleString()} บาท (เฉลี่ย ${dailyAverageCost} บาท/วัน · มื้อละ ${mealAverageCost} บาท)\n`;
    text += `⚖️ ส่วนต่างงบ: ${diff === 0 ? 'พอดีเป๊ะ' : diff > 0 ? `+${diff} บาท` : `${diff} บาท`} (เกณฑ์บวกลบไม่เกิน 50 บาท)\n\n`;

    const groups = [
      { id: 'group1', label: 'หมู่ 1: โปรตีน' },
      { id: 'group2', label: 'หมู่ 2: คาร์โบไฮเดรต' },
      { id: 'group3', label: 'หมู่ 3: ผักสด & สมุนไพร' },
      { id: 'group4', label: 'หมู่ 4: ผลไม้สด' },
      { id: 'group5', label: 'หมู่ 5: ไขมันดี & เครื่องปรุง' },
    ];

    groups.forEach((g) => {
      const items = THAI_MARKET_INGREDIENTS.filter(
        (i) => i.foodGroupId === g.id && (basket[i.id] || 0) > 0
      );
      if (items.length > 0) {
        text += `📂 ${g.label} (${(groupTotals[g.id] || 0).toLocaleString()} ฿):\n`;
        items.forEach((item) => {
          const qty = basket[item.id] || 0;
          const price = prices[item.id] || item.defaultPrice;
          text += `  • ${item.name} x ${qty} ${item.unit} = ${Math.round(qty * price)} ฿\n`;
        });
        text += '\n';
      }
    });

    navigator.clipboard?.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const filteredIngredients = THAI_MARKET_INGREDIENTS.filter((item) => {
    if (activeGroupFilter === 'all') return true;
    if (activeGroupFilter === 'selected_only') return (basket[item.id] || 0) > 0;
    return item.foodGroupId === activeGroupFilter;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {statusFeedback && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200 border border-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{statusFeedback}</span>
          </div>
        </div>
      )}

      {/* Top Banner: Budget Input & Live Target Tolerance Gauge */}
      <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold mb-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>เครื่องมือคำนวณงบประมาณอาหาร 7 วัน ตามกลไกตลาดไทย (Thai Market Food Budget)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              มีงบเท่านี้ ซื้ออะไรได้บ้างใน 7 วัน ครบ 5 หมู่
            </h3>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
              คำนวณสำรับวัตถุดิบสดให้ได้คุณค่าอาหารครบ 5 หมู่ตามหลักโภชนาการ อิงราคาตลาดสดไทย (กรมการค้าภายใน / ตลาดไท) บวกลบไม่เกิน 50 บาทจากงบที่ระบุ พร้อมอัปเดตราคารายวันได้ตลอด
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col items-start lg:items-end gap-2">
            <span className="text-[11px] font-semibold text-neutral-500">
              งบประมาณยอดนิยมต่อสัปดาห์:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    handleBudgetChange(p);
                    const newB = autoFitBasketToBudget(p, prices);
                    setBasket(newB);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                    budget === p
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                  }`}
                >
                  {p.toLocaleString()}฿
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Input & Calculation Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Input field */}
          <div className="md:col-span-4 bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs">
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              ระบุจำนวนเงินงบประมาณ (บาท / 7 วัน):
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-base font-bold text-neutral-400">฿</span>
              <input
                type="number"
                min="300"
                max="10000"
                step="50"
                value={budget}
                onChange={(e) => handleBudgetChange(parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-16 py-2 text-xl font-bold font-mono-numbers text-neutral-900 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 text-xs font-semibold text-neutral-500">บาท</span>
            </div>
            <span className="text-[10px] text-neutral-500 block mt-1">
              ช่วงเป้าหมาย (±50฿): <strong className="font-mono-numbers text-neutral-800">{(budget - 50).toLocaleString()} - {(budget + 50).toLocaleString()} ฿</strong>
            </span>
          </div>

          {/* Actual Cost & Tolerance Gauge */}
          <div className="md:col-span-5 bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">
                ยอดรวมวัตถุดิบในตะกร้า 7 วัน:
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isWithinTolerance
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : diff > 50
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isWithinTolerance ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>อยู่ในเกณฑ์เป๊ะ (± 50฿)</span>
                  </>
                ) : diff > 50 ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>เกินงบ +{diff}฿</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 text-amber-600" />
                    <span>เหลืองบอีก {Math.abs(diff)}฿</span>
                  </>
                )}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono-numbers text-neutral-900">
                {totalCost.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-neutral-500">บาท</span>
              <span className="text-xs text-neutral-500 ml-2">
                (ส่วนต่าง: <strong className={`font-mono-numbers ${diff === 0 ? 'text-emerald-700' : diff > 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {diff > 0 ? `+${diff}` : diff}
                </strong> บาท)
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
              <span>เฉลี่ยวันละ: <strong className="font-mono-numbers text-neutral-800">{dailyAverageCost}</strong> ฿</span>
              <span>เฉลี่ย 21 มื้อหลัก: <strong className="font-mono-numbers text-neutral-800">{mealAverageCost}</strong> ฿/มื้อ</span>
            </div>
          </div>

          {/* Quick Auto-Fit Action Button */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <button
              onClick={handleAutoFit}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              title="จัดของครบ 5 หมู่ให้ยอดรวมตกอยู่ในช่วง ±50 บาท อัตโนมัติ"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>✨ จัดชุดให้พอดีงบ (Auto-Fit)</span>
            </button>

            <button
              onClick={handleCopySummaryText}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกรายการแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>คัดลอกสรุปรายการ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5-Food-Group Budget Allocation Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs text-neutral-600">
            <span className="font-semibold text-neutral-800">
              สัดส่วนการใช้งบประมาณตามอาหาร 5 หมู่:
            </span>
            <span className="text-[11px] text-neutral-500">
              โปรตีน {Math.round(((groupTotals.group1 || 0) / (totalCost || 1)) * 100)}% ·
              คาร์บ {Math.round(((groupTotals.group2 || 0) / (totalCost || 1)) * 100)}% ·
              ผัก {Math.round(((groupTotals.group3 || 0) / (totalCost || 1)) * 100)}% ·
              ผลไม้ {Math.round(((groupTotals.group4 || 0) / (totalCost || 1)) * 100)}% ·
              ไขมัน {Math.round(((groupTotals.group5 || 0) / (totalCost || 1)) * 100)}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full overflow-hidden bg-neutral-200 flex shadow-inner">
            <div
              style={{ width: `${((groupTotals.group1 || 0) / (totalCost || 1)) * 100}%` }}
              className="bg-rose-500 transition-all duration-300"
              title={`โปรตีน: ${(groupTotals.group1 || 0).toLocaleString()} ฿`}
            />
            <div
              style={{ width: `${((groupTotals.group2 || 0) / (totalCost || 1)) * 100}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`คาร์โบไฮเดรต: ${(groupTotals.group2 || 0).toLocaleString()} ฿`}
            />
            <div
              style={{ width: `${((groupTotals.group3 || 0) / (totalCost || 1)) * 100}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`ผักสด & สมุนไพร: ${(groupTotals.group3 || 0).toLocaleString()} ฿`}
            />
            <div
              style={{ width: `${((groupTotals.group4 || 0) / (totalCost || 1)) * 100}%` }}
              className="bg-purple-500 transition-all duration-300"
              title={`ผลไม้สด: ${(groupTotals.group4 || 0).toLocaleString()} ฿`}
            />
            <div
              style={{ width: `${((groupTotals.group5 || 0) / (totalCost || 1)) * 100}%` }}
              className="bg-sky-500 transition-all duration-300"
              title={`ไขมันดี & เครื่องปรุง: ${(groupTotals.group5 || 0).toLocaleString()} ฿`}
            />
          </div>
        </div>
      </div>

      {/* Daily Market Price Update Controls Bar */}
      <div className="wellness-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-neutral-200/90 bg-neutral-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900">
                กลไกตลาดสดไทย & อัปเดตราคารายวัน
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 font-semibold">
                อิงตลาดไท / กรมการค้าภายใน
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              คุณสามารถแก้ไขราคาของแต่ละวัตถุดิบตามตลาดแถวบ้าน หรือกดจำลองความผันผวนราคาตลาดสดได้ตลอดเวลา
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Simulate Daily Price Sync */}
          <button
            onClick={handleSimulateDailyPrices}
            className="py-1.5 px-3 rounded-lg bg-white border border-neutral-300 hover:border-amber-400 hover:bg-amber-50/50 text-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="จำลองดัชนีราคาตลาดสดประจำวันตามผลผลิตจริง (ผันผวน ±3% ถึง 10%)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            <span>🔄 อัปเดตราคาตลาดวันนี้</span>
          </button>

          {/* Reset standard */}
          <button
            onClick={handleResetToDefaultPrices}
            className="py-1.5 px-2.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 text-xs transition-colors"
            title="คืนค่าเป็นราคากลางมาตรฐาน"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle inline edit mode */}
          <button
            onClick={() => setIsEditingPrices(!isEditingPrices)}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isEditingPrices
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <Edit2 className="w-3 h-3" />
            <span>{isEditingPrices ? 'เสร็จสิ้นการแก้ราคา' : 'แก้ไขราคารายวัน'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Food Group */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
        <button
          onClick={() => setActiveGroupFilter('all')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeGroupFilter === 'all'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          วัตถุดิบทั้งหมด ({THAI_MARKET_INGREDIENTS.length})
        </button>
        <button
          onClick={() => setActiveGroupFilter('selected_only')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeGroupFilter === 'selected_only'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          ในตะกร้า 7 วัน ({totalItemsCount})
        </button>
        <button
          onClick={() => setActiveGroupFilter('group1')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeGroupFilter === 'group1'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          หมู่ 1: โปรตีน
        </button>
        <button
          onClick={() => setActiveGroupFilter('group2')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeGroupFilter === 'group2'
              ? 'bg-white text-amber-800 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          หมู่ 2: คาร์บ
        </button>
        <button
          onClick={() => setActiveGroupFilter('group3')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeGroupFilter === 'group3'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          หมู่ 3: ผักสด
        </button>
        <button
          onClick={() => setActiveGroupFilter('group4')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeGroupFilter === 'group4'
              ? 'bg-white text-purple-800 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          หมู่ 4: ผลไม้
        </button>
        <button
          onClick={() => setActiveGroupFilter('group5')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeGroupFilter === 'group5'
              ? 'bg-white text-sky-800 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          หมู่ 5: ไขมันดี
        </button>
      </div>

      {/* Grid of Thai Market Ingredients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredIngredients.map((item) => {
          const qty = basket[item.id] || 0;
          const currentPrice = prices[item.id] || item.defaultPrice;
          const subtotal = Math.round(qty * currentPrice);
          const isSelected = qty > 0;
          const isCustomPrice = currentPrice !== item.defaultPrice;

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-400/40'
                  : 'bg-white/80 border-neutral-200/90 hover:border-neutral-300'
              }`}
            >
              <div>
                {/* Header item row with category tag & price */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-1 ${
                      item.foodGroupId === 'group1'
                        ? 'bg-rose-100 text-rose-800'
                        : item.foodGroupId === 'group2'
                        ? 'bg-amber-100 text-amber-800'
                        : item.foodGroupId === 'group3'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.foodGroupId === 'group4'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {item.foodGroupLabel}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900 leading-snug">
                      {item.name}
                    </h4>
                  </div>

                  {/* Unit price with live edit trigger */}
                  <div className="text-right shrink-0">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          className="w-14 px-1 py-0.5 text-xs font-bold border border-amber-400 rounded focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveItemPrice(item.id)}
                          className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold"
                        >
                          บันทึก
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (isEditingPrices) {
                            setEditingItemId(item.id);
                            setEditPriceValue(currentPrice.toString());
                          }
                        }}
                        className={`group cursor-pointer ${isEditingPrices ? 'ring-1 ring-amber-300 rounded px-1' : ''}`}
                        title={isEditingPrices ? 'คลิกเพื่อแก้ไขราคารายวัน' : undefined}
                      >
                        <span className="text-sm font-bold font-mono-numbers text-neutral-900 block">
                          {currentPrice} ฿
                        </span>
                        <span className="text-[10px] text-neutral-500 block -mt-0.5">
                          / {item.unit}
                          {isCustomPrice && (
                            <span className="text-amber-600 font-semibold ml-1">*ปรับ</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nutritional highlight & shelf life */}
                <p className="mt-2 text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                  {item.nutritionalHighlight}
                </p>
                <div className="mt-1 text-[10px] text-neutral-400">
                  🧊 {item.shelfLife}
                </div>
              </div>

              {/* Bottom Quantity Stepper & Subtotal */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                {/* Stepper buttons */}
                <div className="flex items-center gap-1.5 bg-neutral-100 rounded-lg p-0.5">
                  <button
                    onClick={() => handleUpdateItemQty(item.id, -item.step)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-md bg-white text-neutral-700 hover:text-rose-600 disabled:opacity-40 disabled:hover:text-neutral-700 shadow-2xs flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-12 text-center text-xs font-bold font-mono-numbers text-neutral-900">
                    {qty}
                  </span>

                  <button
                    onClick={() => handleUpdateItemQty(item.id, item.step)}
                    disabled={qty >= item.maxQty}
                    className="w-7 h-7 rounded-md bg-white text-neutral-700 hover:text-emerald-700 disabled:opacity-40 shadow-2xs flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">รวม</span>
                  <span className={`text-sm font-bold font-mono-numbers ${isSelected ? 'text-emerald-700' : 'text-neutral-400'}`}>
                    {subtotal.toLocaleString()} ฿
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Action Bar (Export to Grocery Checklist) */}
      <div className="sticky bottom-4 z-20 wellness-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-emerald-500/80 bg-white/95 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-900">
                พร้อมไปจ่ายตลาด: ในตะกร้ามี {totalItemsCount} รายการ
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isWithinTolerance
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isWithinTolerance ? 'งบพอดีเป๊ะ (±50฿)' : diff > 0 ? `เกินงบ ${diff}฿` : `เหลืองบ ${Math.abs(diff)}฿`}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              ยอดรวมทั้งหมด <strong className="font-mono-numbers text-neutral-900 text-sm">{totalCost.toLocaleString()} บาท</strong> สำหรับรับประทานคนเดียว 7 วัน ครบ 5 หมู่
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportToGroceryChecklist}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>นำไปใส่ในเช็คลิสต์ซื้อของ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
