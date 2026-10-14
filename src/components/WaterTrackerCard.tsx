import React, { useState } from 'react';
import { UserProfile, WaterReminderSettings } from '../types/nutrition';
import {
  Droplets,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Clock,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Check,
  Moon,
  Info,
  ExternalLink,
} from 'lucide-react';
import { waterSound } from '../utils/waterSound';

interface WaterTrackerCardProps {
  currentWaterMl: number;
  targetWaterMl: number;
  profile: UserProfile;
  onUpdateWater: (amountMl: number) => void;
  onResetWater: () => void;
  reminderSettings: WaterReminderSettings;
  onUpdateReminderSettings: (settings: Partial<WaterReminderSettings>) => void;
  secondsUntilNextReminder: number;
  onTriggerTestReminder: () => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  currentWaterMl,
  targetWaterMl,
  profile,
  onUpdateWater,
  onResetWater,
  reminderSettings,
  onUpdateReminderSettings,
  secondsUntilNextReminder,
  onTriggerTestReminder,
}) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );
  const [soundTestedFeedback, setSoundTestedFeedback] = useState<boolean>(false);

  const percentage = Math.min(150, Math.round((currentWaterMl / (targetWaterMl || 1)) * 100));
  const remainingMl = Math.max(0, targetWaterMl - currentWaterMl);

  const standardGlassMl = 250;
  const currentGlasses = (currentWaterMl / standardGlassMl).toFixed(1);
  const targetGlasses = (targetWaterMl / standardGlassMl).toFixed(1);

  // Activity bonus description
  const activityBonusMap: Record<string, { label: string; bonus: number }> = {
    sedentary: { label: 'นั่งทำงานเป็นหลัก', bonus: 0 },
    light: { label: 'ออกกำลังกายเบาๆ', bonus: 250 },
    moderate: { label: 'ออกกำลังกายปานกลาง', bonus: 500 },
    active: { label: 'ออกกำลังกายหนัก', bonus: 750 },
    very_active: { label: 'นักกีฬา / แรงงานหนัก', bonus: 1000 },
  };

  const activityInfo = activityBonusMap[profile.activityLevel] || { label: 'ปานกลาง', bonus: 500 };
  const baseWater = Math.round(profile.weightKg * 33);

  const handleAddWater = (ml: number) => {
    onUpdateWater(Math.max(0, currentWaterMl + ml));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ml = parseInt(customAmount);
    if (!isNaN(ml) && ml > 0) {
      handleAddWater(ml);
      setCustomAmount('');
      setShowCustomInput(false);
    }
  };

  const handleTestSound = () => {
    waterSound.playWaterChime();
    setSoundTestedFeedback(true);
    setTimeout(() => setSoundTestedFeedback(false), 2000);
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPermission('unsupported');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        onUpdateReminderSettings({ browserNotificationEnabled: true });
        new Notification('Nutri5: เปิดการแจ้งเตือนดื่มน้ำแล้ว 💧', {
          body: 'ระบบจะช่วยส่งการแจ้งเตือนเมื่อถึงเวลาจิบน้ำตามช่วงเวลาที่คุณเลือก',
          icon: '/favicon.ico',
        });
      } else {
        onUpdateReminderSettings({ browserNotificationEnabled: false });
      }
    } catch (err) {
      console.warn('Could not request notification permission', err);
    }
  };

  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return 'กำลังเตือน...';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} นาที`;
  };

  const INTERVAL_OPTIONS = [
    { label: '30 นาที', minutes: 30, desc: 'จิบบ่อยๆ สม่ำเสมอ' },
    { label: '45 นาที', minutes: 45, desc: 'สมดุลเหมาะกับการทำงาน' },
    { label: '1 ชม.', minutes: 60, desc: 'แนะนำมาตรฐานทั่วไป' },
    { label: '1.5 ชม.', minutes: 90, desc: 'สำหรับคนประชุมบ่อย' },
    { label: '2 ชม.', minutes: 120, desc: 'ดื่มแก้วใหญ่ครั้งละ 300-400 มล.' },
  ];

  return (
    <div className="wellness-card rounded-2xl p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-800/80 font-medium mb-1">
            <span>สมดุลของเหลวในร่างกาย</span>
            <span aria-hidden="true">·</span>
            <span>สูตรน้ำหนักตัว ({profile.weightKg} กก. × 33 มล.) + ระดับกิจกรรม ({activityInfo.label})</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5 text-sky-600" />
            </div>
            <span>บันทึกและระบบแจ้งเตือนการดื่มน้ำ (Hydration Tracker & Reminders)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {reminderSettings.enabled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              <span>แจ้งเตือนเปิดอยู่</span>
            </span>
          )}

          {currentWaterMl > 0 && (
            <button
              onClick={onResetWater}
              className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 transition-colors py-1 px-2.5 rounded-lg border border-neutral-200/80 hover:bg-neutral-50"
              title="รีเซ็ตยอดน้ำดื่มวันนี้เป็น 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตวันนี้</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Hydration Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Intake */}
        <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
          <span className="text-xs font-medium text-sky-800 block">
            ดื่มแล้ววันนี้ (Actual Intake)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-numbers text-sky-950">
              {currentWaterMl.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-sky-700">มล.</span>
          </div>
          <p className="mt-1 text-xs text-sky-700">
            เทียบเท่าประมาณ <strong className="font-mono-numbers">{currentGlasses}</strong> แก้ว (แก้ว 250 มล.)
          </p>
        </div>

        {/* Target Intake */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80">
          <span className="text-xs font-medium text-neutral-600 block">
            เป้าหมายที่ควรได้รับ (Daily Target)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-numbers text-neutral-900">
              {targetWaterMl.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-neutral-500">มล.</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            ฐานน้ำหนัก {baseWater} มล. + กิจกรรม {activityInfo.bonus > 0 ? `+${activityInfo.bonus} มล.` : '0 มล.'}
          </p>
        </div>

        {/* Status / Remaining */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-neutral-600 block">
              สถานะความคืบหน้า (Progress)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono-numbers text-neutral-900">
                {percentage}%
              </span>
              <span className="text-xs font-medium text-neutral-500">
                {remainingMl === 0 ? 'ครบเป้าหมาย 🎉' : `ขาดอีก ${remainingMl.toLocaleString()} มล.`}
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
            {currentWaterMl >= targetWaterMl ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ดื่มน้ำเพียงพอต่อความต้องการแล้ว</span>
              </>
            ) : (
              <span className="text-neutral-500">
                เป้าหมายทั้งหมด ~{targetGlasses} แก้ว/วัน
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar with Water Flow Visual */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-neutral-600">
          <span className="font-medium flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            แถบความคืบหน้าน้ำดื่มวันนี้
          </span>
          <span className="font-mono-numbers text-neutral-700">
            <strong>{currentWaterMl.toLocaleString()}</strong> / {targetWaterMl.toLocaleString()} มล.
          </span>
        </div>

        {/* Cylinder Progress Bar */}
        <div className="w-full bg-neutral-100 rounded-full h-4 overflow-hidden p-0.5 border border-neutral-200 shadow-inner relative">
          <div
            className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
              currentWaterMl >= targetWaterMl
                ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-500'
                : 'bg-gradient-to-r from-sky-400 to-sky-600'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          >
            {percentage >= 15 && (
              <span className="text-[10px] font-bold text-white font-mono-numbers drop-shadow-xs">
                {percentage}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Buttons Bar */}
      <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-sky-600" />
            กดบันทึกน้ำดื่มอย่างรวดเร็ว (Quick Log):
          </span>
          <span className="text-[11px] text-neutral-500">
            เลือกขนาดภาชนะเพื่อบันทึกทันที
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* +200 ml */}
          <button
            onClick={() => handleAddWater(200)}
            className="py-2.5 px-3 rounded-lg bg-white border border-neutral-200 hover:border-sky-300 hover:bg-sky-50/50 text-neutral-800 text-xs font-semibold transition-all shadow-2xs flex flex-col items-center justify-center gap-0.5 group"
          >
            <span className="text-sm font-bold text-sky-600 group-hover:scale-110 transition-transform">
              +200 ml
            </span>
            <span className="text-[10px] text-neutral-500 font-normal">แก้วเล็ก / ถ้วย</span>
          </button>

          {/* +250 ml */}
          <button
            onClick={() => handleAddWater(250)}
            className="py-2.5 px-3 rounded-lg bg-white border border-neutral-200 hover:border-sky-300 hover:bg-sky-50/50 text-neutral-800 text-xs font-semibold transition-all shadow-2xs flex flex-col items-center justify-center gap-0.5 group"
          >
            <span className="text-sm font-bold text-sky-600 group-hover:scale-110 transition-transform">
              +250 ml
            </span>
            <span className="text-[10px] text-neutral-500 font-normal">แก้วน้ำมาตรฐาน</span>
          </button>

          {/* +500 ml */}
          <button
            onClick={() => handleAddWater(500)}
            className="py-2.5 px-3 rounded-lg bg-white border border-neutral-200 hover:border-sky-300 hover:bg-sky-50/50 text-neutral-800 text-xs font-semibold transition-all shadow-2xs flex flex-col items-center justify-center gap-0.5 group"
          >
            <span className="text-sm font-bold text-sky-600 group-hover:scale-110 transition-transform">
              +500 ml
            </span>
            <span className="text-[10px] text-neutral-500 font-normal">กระบอกน้ำ / แก้วเก็บความเย็น</span>
          </button>

          {/* +600 ml */}
          <button
            onClick={() => handleAddWater(600)}
            className="py-2.5 px-3 rounded-lg bg-white border border-neutral-200 hover:border-sky-300 hover:bg-sky-50/50 text-neutral-800 text-xs font-semibold transition-all shadow-2xs flex flex-col items-center justify-center gap-0.5 group"
          >
            <span className="text-sm font-bold text-sky-600 group-hover:scale-110 transition-transform">
              +600 ml
            </span>
            <span className="text-[10px] text-neutral-500 font-normal">ขวดน้ำ 600 มล.</span>
          </button>

          {/* Custom ml button */}
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="py-2.5 px-3 rounded-lg bg-white border border-neutral-200 hover:border-sky-300 hover:bg-sky-50/50 text-neutral-800 text-xs font-semibold transition-all shadow-2xs flex flex-col items-center justify-center gap-0.5"
          >
            <span className="text-sm font-bold text-neutral-700">
              {showCustomInput ? 'ปิด' : 'กำหนดเอง'}
            </span>
            <span className="text-[10px] text-neutral-500 font-normal">ระบุมิลลิลิตร</span>
          </button>
        </div>

        {/* Custom ml Form */}
        {showCustomInput && (
          <form onSubmit={handleCustomSubmit} className="pt-2 flex items-center gap-2 max-w-sm">
            <input
              type="number"
              min="10"
              max="2000"
              step="50"
              placeholder="ระบุปริมาณ เช่น 350 มล."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono-numbers"
              autoFocus
            />
            <button
              type="submit"
              className="py-1.5 px-4 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors"
            >
              + บันทึก
            </button>
          </form>
        )}

        {/* Undo button */}
        {currentWaterMl > 0 && (
          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={() => handleAddWater(-250)}
              className="text-xs text-neutral-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              title="ลดยอดน้ำดื่มออก 250 มล."
            >
              <Minus className="w-3.5 h-3.5" />
              ลดยอดน้ำดื่มออก 250 มล. (หากกดเกิน)
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* NEW: DEDICATED WATER REMINDER PANEL (ระบบตั้งค่าการแจ้งเตือนดื่มน้ำ) */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/60 via-white to-blue-50/40 p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Top Control Bar with Toggle and Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              reminderSettings.enabled
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-neutral-200 text-neutral-500'
            }`}>
              {reminderSettings.enabled ? <BellRing className="w-5 h-5 animate-bounce" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">
                  ระบบแจ้งเตือนการดื่มน้ำ (Smart Hydration Reminder)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">
                  ใหม่
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                แจ้งเตือนให้จิบน้ำเป็นประจำ เพื่อให้ร่างกายไม่ขาดน้ำและทำงานได้อย่างเต็มที่
              </p>
            </div>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reminderSettings.enabled}
                onChange={(e) => onUpdateReminderSettings({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              <span className="ml-2.5 text-xs font-semibold text-neutral-800">
                {reminderSettings.enabled ? 'เปิดการแจ้งเตือน' : 'ปิดการแจ้งเตือน'}
              </span>
            </label>
          </div>
        </div>

        {reminderSettings.enabled ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Live Countdown & Test Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl p-3.5 border border-sky-100 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-sky-600 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    นับถอยหลังรอบเตือนถัดไป
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono-numbers text-sky-900">
                      {formatCountdown(secondsUntilNextReminder)}
                    </span>
                    <span className="text-[11px] text-sky-700 font-medium">
                      (เตือนทุก {reminderSettings.intervalMinutes} นาที)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action: Test Alert Button */}
              <button
                onClick={onTriggerTestReminder}
                className="py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 self-start sm:self-auto"
                title="ทดสอบดูหน้าต่างแจ้งเตือนและเสียงน้ำหยดทันที"
              >
                <Play className="w-3.5 h-3.5 text-sky-600 fill-sky-600" />
                <span>ทดสอบการแจ้งเตือนทันที</span>
              </button>
            </div>

            {/* Interval Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-800 block">
                ความถี่ในการแจ้งเตือน (Interval):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {INTERVAL_OPTIONS.map((opt) => {
                  const isSelected = reminderSettings.intervalMinutes === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      onClick={() => onUpdateReminderSettings({ intervalMinutes: opt.minutes })}
                      className={`py-2 px-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold block">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-[10px] block mt-0.5 truncate ${isSelected ? 'text-sky-100' : 'text-neutral-500'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Channels: Sound & Browser System Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Sound Alert Card */}
              <div className="bg-white rounded-xl p-3.5 border border-sky-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {reminderSettings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-sky-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className="text-xs font-bold text-neutral-800">
                      เสียงเตือนน้ำหยด (Water Drop Chime)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderSettings.soundEnabled}
                    onChange={(e) => onUpdateReminderSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-neutral-300 focus:ring-sky-500"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  ส่งเสียงระฆังน้ำหยดนุ่มนวลสังเคราะห์ด้วย Web Audio API เมื่อถึงเวลา
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleTestSound}
                    className="py-1 px-2.5 text-[11px] font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3 h-3 text-sky-600" />
                    <span>{soundTestedFeedback ? 'กำลังเล่นเสียง... 🎵' : 'ทดสอบเสียง'}</span>
                  </button>
                </div>
              </div>

              {/* Browser System Notification Card */}
              <div className="bg-white rounded-xl p-3.5 border border-sky-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-neutral-800">
                      การแจ้งเตือนของบราวเซอร์ (Desktop Alert)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderSettings.browserNotificationEnabled}
                    onChange={(e) => {
                      if (e.target.checked && browserPermission !== 'granted') {
                        handleRequestBrowserPermission();
                      } else {
                        onUpdateReminderSettings({ browserNotificationEnabled: e.target.checked });
                      }
                    }}
                    className="w-4 h-4 text-sky-600 rounded border-neutral-300 focus:ring-sky-500"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  ส่งการแจ้งเตือนป๊อปอัปแม้เปิดทำงานหน้าแท็บอื่น (เมื่อได้รับอนุญาต)
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {browserPermission === 'granted' ? (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      อนุญาตในบราวเซอร์แล้ว
                    </span>
                  ) : browserPermission === 'denied' ? (
                    <span className="text-[11px] text-rose-600 font-medium">
                      ถูกปิดกั้นในบราวเซอร์ (กรุณาอนุญาตในตั้งค่า)
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestBrowserPermission}
                      className="py-1 px-2.5 text-[11px] font-medium rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>ขอสิทธิ์การแจ้งเตือนบราวเซอร์</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quiet Hours (โหมดเงียบเวลานอน) */}
            <div className="bg-sky-50/40 rounded-xl p-3 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-sky-700 shrink-0" />
                <div>
                  <span className="font-bold text-neutral-800 block">
                    ช่วงเวลาพักผ่อน ไม่รบกวน (Quiet Hours: 22:00 - 07:00)
                  </span>
                  <span className="text-neutral-500 text-[11px]">
                    ระบบจะไม่ส่งเสียงและไม่แจ้งเตือนในช่วงเวลานี้ เพื่อให้คุณนอนหลับสนิท
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer select-none self-end sm:self-auto">
                <input
                  type="checkbox"
                  checked={reminderSettings.quietHoursEnabled}
                  onChange={(e) => onUpdateReminderSettings({ quietHoursEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 rounded-xl p-4 text-center border border-dashed border-neutral-300 text-xs text-neutral-500">
            <span>แตะสวิตช์ <strong>&quot;เปิดการแจ้งเตือน&quot;</strong> ด้านบน เพื่อให้ Nutri5 ช่วยส่งเสียงเตือนและนับเวลาถอยหลังการจิบน้ำระหว่างวัน</span>
          </div>
        )}
      </div>

      {/* Hydration Health Schedule Guide */}
      <div className="border border-sky-100 bg-sky-50/20 rounded-xl p-4 text-xs space-y-2">
        <span className="font-bold text-sky-900 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-sky-600" />
          ตารางเวลาการดื่มน้ำเพื่อสุขภาพที่มีประสิทธิภาพสูงสุด (Hydration Routine):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-neutral-700">
          <div className="bg-white p-2.5 rounded-lg border border-sky-100">
            <strong className="text-sky-800 block mb-0.5">1. หลังตื่นนอน (07:00 - 08:00)</strong>
            <span>ดื่ม 1-2 แก้ว กระตุ้นระบบขับถ่ายและปลุกอวัยวะภายใน</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-sky-100">
            <strong className="text-sky-800 block mb-0.5">2. ก่อนอาหาร 30 นาที</strong>
            <span>เตรียมระบบย่อยอาหาร หลีกเลี่ยงดื่มน้ำมากระหว่างกินข้าว</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-sky-100">
            <strong className="text-sky-800 block mb-0.5">3. ระหว่างวัน (จิบบ่อยๆ)</strong>
            <span>จิบทุก 45-60 นาที รักษาความชุ่มชื้น ลดอาการสมองล้า</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-sky-100">
            <strong className="text-sky-800 block mb-0.5">4. ก่อนนอน 1 ชม. (ไม่เกิน 1 แก้ว)</strong>
            <span>ป้องกันเลือดข้นขณะหลับ โดยไม่รบกวนการตื่นมาเข้าห้องน้ำ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
