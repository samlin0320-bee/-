import React from 'react';
import { ChartData, getZodiacName } from '../../utils/astrology';
import { calculateUpagrahas } from '../../utils/advancedCalculations';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabUpagrahas: React.FC<Props> = ({ data, modes }) => {
  const sunLong = data.planets['Sun']?.longitude || 0;
  const shadowPoints = calculateUpagrahas(sunLong);

  const getSignAndDegree = (long: number) => {
    const sign = Math.floor(long / 30) + 1;
    const degree = long % 30;
    return { sign, degree };
  };

  const pointMeta: Record<string, { desc: string, nature: string }> = {
    Dhuma: { desc: '煙霧 (Smoke) - = Sun + 133°20\'', nature: '凶 (Malefic)' },
    Vyatipata: { desc: '災禍 (Disaster) - = 360° - Dhuma', nature: '凶 (Malefic)' },
    Parivesha: { desc: '光暈 (Halo) - = Vyatipata + 180°', nature: '凶 (Malefic)' },
    Indrachapa: { desc: '彩虹 (Rainbow) - = 360° - Parivesha', nature: '凶 (Malefic)' },
    Upaketu: { desc: '次計都 (Comet) - = Indrachapa + 16°40\'', nature: '凶 (Malefic)' },
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">2. 虛星 (Upagrahas)</h2>
      <p className="text-sm text-gray-600 mb-4">
        由數學公式從太陽位置推算出的無實體數學點，代表特定的凶性感應。
      </p>
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3">虛星 (Upagraha)</th>
              <th className="p-3">計算公式</th>
              <th className="p-3">性質</th>
              <th className="p-3">所在星座</th>
              <th className="p-3">精確度數</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(shadowPoints).map(([name, long]) => {
              const { sign, degree } = getSignAndDegree(long as number);
              const meta = pointMeta[name];
              return (
                <tr key={name} className="hover:bg-rose-50/30">
                  <td className="p-3 font-bold text-rose-700">{name}</td>
                  <td className="p-3 text-gray-600 text-xs">{meta.desc.split(' - ')[1]}</td>
                  <td className="p-3 text-rose-600 font-bold text-xs">{meta.nature}</td>
                  <td className="p-3 font-medium">{getZodiacName(sign, modes)}</td>
                  <td className="p-3 font-mono text-gray-600">{degree.toFixed(2)}°</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
