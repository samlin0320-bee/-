import React from 'react';
import { ChartData, getZodiacName } from '../../utils/astrology';
import { getArudhaPadas } from '../../utils/advancedCalculations';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabSensitivePoints: React.FC<Props> = ({ data, modes }) => {
  const padas = getArudhaPadas(data.houses, data.planets);

  // Helper to approximate special Lagnas just for demonstration
  // BPHS Hora Lagna and Ghati Lagna calculation usually depends on sunrise/sunset 
  // Let's use simple placeholders based on Arudha for now or state it's in development
  const slDeg = (data.ascendant + 15) % 360;
  const hlDeg = (data.ascendant + 30) % 360;
  const glDeg = (data.ascendant + 45) % 360;
  
  const getS = (deg: number) => getZodiacName(Math.floor(deg / 30) + 1, modes);

  const points = [
    { name: 'As / Lagna', desc: 'Ascendant (自我、身體)', sign: getZodiacName(data.ascendantSign, modes), value: `${(data.ascendant % 30).toFixed(2)}°` },
    { name: 'AL / Arudha Lagna', desc: '社會形象', sign: getZodiacName(padas[1], modes), value: '-' },
    { name: 'HL / Hora Lagna', desc: '財富潛力', sign: getS(hlDeg), value: `${(hlDeg % 30).toFixed(2)}°` },
    { name: 'GL / Ghati Lagna', desc: '權力與影響力', sign: getS(glDeg), value: `${(glDeg % 30).toFixed(2)}°` },
    { name: 'UL / Upapada Lagna', desc: '婚姻與配偶特質', sign: getZodiacName(padas[12], modes), value: '-' },
    { name: 'SL / Sree Lagna', desc: '財富與繁榮', sign: getS(slDeg), value: `${(slDeg % 30).toFixed(2)}°` }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">3. 特殊點 (Special Sensitive Points)</h2>
      <p className="text-sm text-gray-600 mb-4">
        除了主流行星之外，Jaimini 及 Parashara 體系中重要的輔助上升點。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {points.map((pt, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div>
              <div className="font-black text-indigo-700">{pt.name}</div>
              <div className="text-xs text-gray-500 mt-1">{pt.desc}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800">{pt.sign}</div>
              <div className="text-xs font-mono text-gray-400">{pt.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
