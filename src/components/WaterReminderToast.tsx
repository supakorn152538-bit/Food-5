import React from 'react';
import { Droplets, Bell, Check, Clock, X, Volume2, Sparkles } from 'lucide-react';

interface WaterReminderToastProps {
  isOpen: boolean;
  onClose: () => void;
  onDrinkWater: (amountMl: number) => void;
  onSnooze: (minutes: number) => void;
  currentWaterMl: number;
  targetWaterMl: number;
}

export const WaterReminderToast: React.FC<WaterReminderToastProps> = ({
  isOpen,
  onClose,
  onDrinkWater,
  onSnooze,
  currentWaterMl,
  targetWaterMl,
}) => {
  if (!isOpen) return null;

  const percentage = Math.min(100, Math.round((currentWaterMl / (targetWaterMl || 1)) * 100));
  const remainingMl = Math.max(0, targetWaterMl - currentWaterMl);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full sm:w-[380px] bg-white rounded-2xl shadow-2xl border-2 border-sky-400 p-5 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
      style={{
        boxShadow: '0 20px 40px -10px rgba(2, 132, 199, 0.25), 0 8px 16px -6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Top row with icon, title, close */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-md animate-pulse">
              <Droplets className="w-6 h-6 fill-white/20" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
              <Bell className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>การแจ้งเตือนดื่มน้ำ</span>
            </div>
            <h3 className="text-base font-bold text-neutral-900 leading-tight">
              ถึงเวลาเติมความสดชื่นแล้ว! 💧
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-1 rounded-lg transition-colors"
          title="ปิดการแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message and hydration progress */}
      <div className="mt-3 bg-sky-50/70 rounded-xl p-3 border border-sky-100 text-xs text-sky-950">
        <p className="leading-relaxed">
          จิบน้ำสักแก้วเพื่อกระตุ้นระบบเผาผลาญ เพิ่มสมาธิ และช่วยให้ร่างกายสดชื่นตลอดวัน
        </p>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-sky-800 font-medium">
          <span>วันนี้ดื่มแล้ว: <strong className="font-mono-numbers">{currentWaterMl}</strong>/{targetWaterMl} มล.</span>
          <span className="font-mono-numbers font-bold text-sky-700">{percentage}%</span>
        </div>
        <div className="mt-1.5 w-full bg-sky-200/70 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {remainingMl > 0 && (
          <div className="mt-1 text-[10px] text-sky-700/80 text-right">
            ยังขาดอีก {remainingMl.toLocaleString()} มล. เพื่อให้ครบเป้าหมาย
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Quick Drink 250ml */}
          <button
            onClick={() => onDrinkWater(250)}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>ดื่ม 1 แก้ว (+250 มล.)</span>
          </button>

          {/* Quick Sip 100ml */}
          <button
            onClick={() => onDrinkWater(100)}
            className="py-2.5 px-3 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-semibold text-xs border border-sky-200 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
          >
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>จิบน้ำ (+100 มล.)</span>
          </button>
        </div>

        {/* Snooze & Dismiss */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <button
            onClick={() => onSnooze(10)}
            className="text-neutral-500 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-sky-50"
          >
            <Clock className="w-3 h-3" />
            <span>เลื่อนเตือนอีก 10 นาที</span>
          </button>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 font-medium px-2 py-1 transition-colors"
          >
            เตือนในรอบปกติ
          </button>
        </div>
      </div>
    </div>
  );
};
