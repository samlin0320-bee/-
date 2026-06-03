import React from 'react';
import { ChartData, getPlanetName } from '../../utils/astrology';
import { getPlanetaryRelationships } from '../../utils/advancedCalculations';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabRelations: React.FC<Props> = ({ data, modes }) => {
  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">8. 敵友 (Planetary Relations)</h2>
      <p className="text-sm text-gray-600 mb-4">
        合成關係 (Panchadhavargiya) = 自然關係 (Naisargika) × 臨時關係 (Tatkalika)。
      </p>

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 text-left">行星 (Planet)</th>
              {planets.map(p => <th key={p} className="p-3 border-l text-xs font-bold">{getPlanetName(p, modes)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {planets.map(p1 => {
              const rels = getPlanetaryRelationships(p1, data.planets);
              return (
                <tr key={p1} className="hover:bg-indigo-50/30">
                  <td className="p-3 font-bold text-left text-gray-800 border-r bg-gray-50/50">{getPlanetName(p1, modes)}</td>
                  {planets.map(p2 => {
                    if (p1 === p2) return <td key={p2} className="p-3 border-l bg-gray-100/50 text-gray-400">-</td>;
                    const r = rels[p2];
                    if (!r) return <td key={p2} className="p-3 border-l">-</td>;
                    
                    let bg = 'bg-white';
                    let text = 'text-gray-600';
                    if (r.compound === 'Great Friend' || r.compound === 'Friend') {
                      bg = 'bg-green-50'; text = 'text-green-700';
                    } else if (r.compound === 'Great Enemy' || r.compound === 'Enemy') {
                      bg = 'bg-red-50'; text = 'text-red-700';
                    }

                    return (
                      <td key={p2} className={`p-2 border-l ${bg}`}>
                        <div className={`font-bold text-xs ${text}`}>{r.compound}</div>
                        <div className="text-[10px] text-gray-400 mt-1 opacity-70">
                          {r.natural[0]}/{r.temporary[0]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-4 text-xs text-gray-500">
        <div><span className="font-bold text-green-600">Great Friend / Friend</span>: 增益能量</div>
        <div><span className="font-bold text-gray-600">Neutral</span>: 中性</div>
        <div><span className="font-bold text-red-600">Great Enemy / Enemy</span>: 能量衝突</div>
        <div className="italic ml-4">小字為: 自然(N)/臨時(T)</div>
      </div>
    </div>
  );
};
