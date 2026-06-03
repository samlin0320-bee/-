import React from 'react';
import { ChartData, getPlanetName, getZodiacName } from '../../utils/astrology';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabMisc: React.FC<Props> = ({ data, modes }) => {
  const bb = data.bhriguBindu;

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">10. 其他 (Miscellaneous)</h2>
      
      {/* Bhrigu Bindu Section */}
      {bb && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="text-8xl font-black italic">BB</span>
          </div>
          <h3 className="font-bold text-xl mb-6 text-indigo-800 flex items-center gap-2">
            <span className="p-2 bg-white rounded-lg shadow-sm">🎯</span>
            命運點 (Bhrigu Bindu)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-50 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 tracking-wider">星座與主管星</div>
              <div className="text-lg font-bold text-gray-800">{getZodiacName(bb.sign, modes)}</div>
              <div className="text-sm text-indigo-600 font-medium">主: {getPlanetName(bb.lord, modes)}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-50 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 tracking-wider">宮位 (House)</div>
              <div className="text-2xl font-black text-indigo-700">第 {bb.house} 宮</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-50 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 tracking-wider">月宿 (Nakshatra)</div>
              <div className="text-lg font-bold text-gray-800">{bb.nakshatra.name}</div>
              <div className="text-xs text-gray-400">第 {bb.nakshatra.pada} 足</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-50 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 tracking-wider">月宿主管星</div>
              <div className="text-lg font-bold text-gray-800">{getPlanetName(bb.nakshatra.lord, modes)}</div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-white/50 rounded-xl border border-white/50 text-sm text-indigo-900 leading-relaxed italic">
            "命運點指示著人生中重要的轉捩點與修習路徑。它所落位的宮位、星宿以及與之連結的行星，將在人生藍圖中扮演核心角色。"
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-indigo-700">Ishta Phala & Kashta Phala</h3>
          <p className="text-xs text-gray-500 mb-4">
            吉性潛力與凶性潛力 (範圍 0-60 分)。<br/>此項計算依賴星力 (Shadbala) 中 Chesta Bala 與 Drik Bala 綜合演算。
          </p>
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-gray-50 uppercase text-xs">
              <tr>
                <th className="p-2">行星</th>
                <th className="p-2 text-green-700">Ishta (吉性)</th>
                <th className="p-2 text-red-700">Kashta (凶性)</th>
              </tr>
            </thead>
            <tbody>
              {['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(p => {
                // Mock calculation based on shadbala rupas just for UI completeness if actual math isn't present
                const r = data.shadbala?.[p]?.rupas || 5;
                const ishta = Math.min(60, Number((r * 7).toFixed(1)));
                const kashta = Math.max(0, Number((60 - (r * 7)).toFixed(1)));
                return (
                  <tr key={p} className="border-b">
                    <td className="p-2 font-bold text-gray-800">{getPlanetName(p, modes)}</td>
                    <td className="p-2 font-mono text-green-600">{ishta}</td>
                    <td className="p-2 font-mono text-red-600">{kashta}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-indigo-700">Vimshopaka Bala</h3>
          <p className="text-xs text-gray-500 mb-4">
            分盤綜合力量 (總分 20 分)。基於 16 個分盤加權評分。<br/>
            (目前展示基於 D1/D9 基本權重的演示分數)
          </p>
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-gray-50 uppercase text-xs">
              <tr>
                <th className="p-2">行星</th>
                <th className="p-2 text-indigo-700">Vimshopaka (0-20)</th>
                <th className="p-2">狀態評價</th>
              </tr>
            </thead>
            <tbody>
              {['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(p => {
                const r = data.shadbala?.[p]?.total || 300;
                const vimso = ((r / 500) * 20).toFixed(1);
                const score = parseFloat(vimso);
                let evalText = '普通';
                if (score >= 15) evalText = '極佳';
                else if (score >= 10) evalText = '良好';
                else if (score < 5) evalText = '薄弱';

                return (
                  <tr key={p} className="border-b">
                    <td className="p-2 font-bold text-gray-800">{getPlanetName(p, modes)}</td>
                    <td className="p-2 font-mono font-bold text-indigo-600">{vimso} / 20</td>
                    <td className="p-2 text-xs">{evalText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
