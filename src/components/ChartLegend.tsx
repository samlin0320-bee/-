import React from 'react';
import { Shield, ShieldAlert, Star, Crown, Info, Zap } from 'lucide-react';

export const ChartLegend: React.FC = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
        <Info className="w-4 h-4 text-indigo-500" /> 圖表標示說明 (Chart Legend)
      </h4>
      
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-bold text-gray-600">吉星 (Benefics)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-[10px] font-bold text-gray-600">凶星 (Malefics)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-[10px] font-bold text-gray-600">中性 (Neutral)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-[10px] font-bold text-gray-600">大吉 (Yoga Karaka)</span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-black text-indigo-600 min-w-[30px] mt-0.5">數字:</span>
          <p className="text-[9px] text-gray-500 leading-tight">宮位內顯示的小數字（1-12）代表該宮位所在的「星座編號」（1: 牡羊, 2: 金牛...）。</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-black text-indigo-600 min-w-[30px] mt-0.5">(R):</span>
          <p className="text-[9px] text-gray-500 leading-tight">代表行星處於「逆行」狀態 (Retrograde)。</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-black text-indigo-600 min-w-[30px] mt-0.5">顏色:</span>
          <p className="text-[9px] text-gray-500 leading-tight">行星名稱顏色代表其對於「該上升命宮」的吉凶性質 (Functional Dignity)。</p>
        </div>
      </div>

      <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 mt-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="w-3 h-3 text-indigo-500" />
          <span className="text-[10px] font-black text-indigo-800">快速提示 (Quick Tip)</span>
        </div>
        <p className="text-[9px] text-indigo-700 leading-relaxed italic">
          「點擊星盤中的行星名稱，可以觸發相位引動路徑，快速觀察該星曜對哪些宮位產生映射影響。」
        </p>
      </div>
    </div>
  );
};

export default ChartLegend;
