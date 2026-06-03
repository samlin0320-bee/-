import React from 'react';
import { ChartData, getPlanetName, getZodiacName, VEDHA_RULES, PlanetPosition } from '../utils/astrology';
import { GOCHARA_DATA } from '../constants/gochara';

interface Props {
  natalData: ChartData;
  transitData: ChartData;
  modes?: string[];
}

const GocharaReport: React.FC<Props> = ({ natalData, transitData, modes = ['zh'] }) => {
  const natalMoonSign = natalData.planets['Moon']?.sign;
  if (!natalMoonSign) return null;

  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-blue-600">🚀</span> 流年過運 (Gochara) 分析
        </h2>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          以月亮星座為第一宮起算
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-blue-900">
        <p className="mb-2"><strong>過運法則：</strong>在印度占星中，流年行星相對於「本命月亮」所在的宮位，決定了該時段的吉凶。</p>
        <p className="text-sm">注意：如果流年行星被「Vedha (阻礙)」星阻擋，則吉凶力量會被抵消。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {planets.map(pName => {
          const tp = transitData.planets[pName];
          if (!tp) return null;

          const houseFromMoon = ((tp.sign - natalMoonSign + 12) % 12) + 1;
          const effects = GOCHARA_DATA[pName] || [];
          const currentEffect = effects.find(e => e.house === houseFromMoon);
          
          // Vedha Check
          const vedhaPoint = VEDHA_RULES[pName]?.[houseFromMoon];
          let isBlocked = false;
          let blockerPlanet = '';

          if (vedhaPoint) {
            const vedhaSign = ((natalMoonSign - 1 + vedhaPoint - 1) % 12) + 1;
            // Check if any OTHER transit planet is in the vedha sign
            // Exception: Sun/Saturn and Moon/Mercury don't block each other in some traditions, but we'll use standard rules
            for (const [otherP, otherPos] of Object.entries(transitData.planets) as [string, PlanetPosition][]) {
              if (otherP !== pName && otherPos.sign === vedhaSign) {
                isBlocked = true;
                blockerPlanet = otherP;
                break;
              }
            }
          }

          return (
            <div key={pName} className={`p-6 rounded-xl border shadow-sm transition-all hover:shadow-md ${currentEffect?.result === 'Auspicious' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner ${currentEffect?.result === 'Auspicious' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {getPlanetName(pName, modes).substring(0, 1)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{getPlanetName(pName, modes)} 過運</h4>
                    <p className="text-xs text-gray-500">
                      位於本命月亮第 {houseFromMoon} 宮 ({getZodiacName(tp.sign, modes)})
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentEffect?.result === 'Auspicious' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {currentEffect?.result === 'Auspicious' ? '吉 (Auspicious)' : '凶 (Malefic)'}
                </div>
              </div>

              <div className="bg-white/80 p-4 rounded-lg border border-white/50 mb-4">
                <div className="text-sm font-semibold text-gray-500 mb-1">觸發條件 (Rule Matched):</div>
                <div className="text-sm bg-blue-50 text-blue-800 p-2 rounded border border-blue-100 mb-3">
                  流年 {getPlanetName(pName, modes)} 進入 本命月亮 ({getZodiacName(natalMoonSign, modes)}) 起算的第 <strong>{houseFromMoon}</strong> 宮
                </div>
                <div className="text-sm font-semibold text-gray-500 mb-1">判定說明 (Explanation):</div>
                <p className="text-gray-800 font-medium">{currentEffect?.description || '無特定描述'}</p>
              </div>

              {vedhaPoint && (
                <div className={`text-xs p-3 rounded-lg border ${isBlocked ? 'bg-amber-100 border-amber-200 text-amber-900' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">Vedha (阻礙點):</span>
                    <span>月亮起算第 {vedhaPoint} 宮 ({getZodiacName(((natalMoonSign - 1 + vedhaPoint - 1) % 12) + 1, modes)})</span>
                  </div>
                  {isBlocked ? (
                    <div className="flex items-center gap-1 font-bold text-amber-700">
                      <span>⚠️ 被 {getPlanetName(blockerPlanet, modes)} 阻礙！力量抵消。</span>
                    </div>
                  ) : (
                    <div className="text-gray-400">當前無行星落入此點，力量正常發揮。</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">過運吉凶速查表 (月亮起算)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-2">行星</th>
                {Array.from({ length: 12 }).map((_, i) => (
                  <th key={i} className="border border-gray-200 p-2 w-10">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planets.map(p => (
                <tr key={p}>
                  <td className="border border-gray-200 p-2 font-bold">{getPlanetName(p, modes)}</td>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const house = i + 1;
                    const effect = GOCHARA_DATA[p]?.find(e => e.house === house);
                    return (
                      <td key={i} className={`border border-gray-200 p-2 text-center ${effect?.result === 'Auspicious' ? 'bg-green-100 text-green-700 font-bold' : ''}`}>
                        {effect?.result === 'Auspicious' ? '●' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-gray-500 italic">● 代表該宮位為吉。其餘宮位通常視為凶或中性。</p>
      </div>
    </div>
  );
};

export default GocharaReport;
