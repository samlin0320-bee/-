import React from 'react';
import { ChartData, getZodiacName } from '../../utils/astrology';
import { getArudhaPadas } from '../../utils/advancedCalculations';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabArudhaPadas: React.FC<Props> = ({ data, modes }) => {
  const padas = getArudhaPadas(data.houses, data.planets);

  const padaMeta: Record<number, { name: string, desc: string }> = {
    1: { name: 'AL (Arudha Lagna)', desc: '整體社會形象、他人眼中的你' },
    2: { name: 'A2 (Dhana Pada)', desc: '財富的外在顯現' },
    3: { name: 'A3 (Bhratri Pada)', desc: '技能/勇氣的世俗展現' },
    4: { name: 'A4 (Matri Pada)', desc: '家庭/房產的顯現' },
    5: { name: 'A5 (Putra Pada)', desc: '創造力/子女的顯現' },
    6: { name: 'A6 (Shatru Pada)', desc: '服務/競爭的顯現' },
    7: { name: 'A7 / DL (Dara Pada)', desc: '婚姻/合夥的顯現' },
    8: { name: 'A8 (Mrityu Pada)', desc: '祕密/轉化的顯現' },
    9: { name: 'A9 (Bhagya Pada)', desc: '宗教/運氣的顯現' },
    10: { name: 'A10 (Rajya Pada)', desc: '事業/名聲的顯現' },
    11: { name: 'A11 (Labha Pada)', desc: '收益/人際的顯現' },
    12: { name: 'UL (Upapada Lagna)', desc: '婚姻與配偶特質（最重要）' },
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">4. 映射 (Arudha Padas)</h2>
      <p className="text-sm text-gray-600 mb-4">
        依據當宮主星的跨距鏡射計算。Parashara 系統看內在命運，Arudha 看外在世界的實際「世俗顯現」。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(padas).map(([houseStr, sign]) => {
          const house = parseInt(houseStr);
          const meta = padaMeta[house];
          if (!meta) return null;
          
          const isLagna = house === 1 || house === 12;
          
          return (
            <div key={house} className={`p-4 rounded-xl border ${isLagna ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'} shadow-sm`}>
              <div className="flex justify-between items-start mb-2">
                <div className={`text-lg font-black ${isLagna ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {meta.name.split(' ')[0]}
                </div>
                <div className="px-2 py-1 bg-white rounded-md text-xs font-bold text-gray-700 border">
                  第 {house} 宮映射
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs text-gray-500 block mb-1">世俗意義</span>
                <span className="text-sm font-medium text-gray-800">{meta.desc}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 mr-2">落入星座:</span>
                <span className="font-bold text-indigo-600">{getZodiacName(sign, modes)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
