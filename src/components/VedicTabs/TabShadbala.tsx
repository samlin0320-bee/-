import React from 'react';
import { ChartData, getPlanetName } from '../../utils/astrology';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabShadbala: React.FC<Props> = ({ data, modes }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">6. 星力 (Shadbala / Six-fold Strength)</h2>
      <p className="text-sm text-gray-600 mb-4">
        六力加總評估，達標 (ratio &gt; 1.0) 代表強力的行星，在大運期間能有效兌現吉果。
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
              <th className="p-3 border-r font-bold">行星</th>
              <th className="p-3 border-r">位置力 (Sthana)</th>
              <th className="p-3 border-r">方位力 (Dig)</th>
              <th className="p-3 border-r">時間力 (Kala)</th>
              <th className="p-3 border-r">運動力 (Chesta)</th>
              <th className="p-3 border-r">自然力 (Naisargika)</th>
              <th className="p-3 border-r">相位力 (Drik)</th>
              <th className="p-3 border-r font-bold bg-amber-50">總分 (Total)</th>
              <th className="p-3 border-r font-bold bg-amber-100 text-amber-800">Rupas</th>
              <th className="p-3 font-bold text-center">排名</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.shadbala || {}).map(([name, stat]: [string, any]) => (
              <tr key={name} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3 border-r font-bold text-indigo-700">{getPlanetName(name, modes)}</td>
                <td className="p-3 border-r font-mono text-gray-600 text-right">{stat.sthana.toFixed(2)}</td>
                <td className="p-3 border-r font-mono text-gray-600 text-right">{stat.dig.toFixed(2)}</td>
                <td className="p-3 border-r font-mono text-gray-600 text-right">{stat.kala.toFixed(2)}</td>
                <td className="p-3 border-r font-mono text-gray-600 text-right">{stat.chesta.toFixed(2)}</td>
                <td className="p-3 border-r font-mono text-gray-600 text-right">{stat.naisargika.toFixed(2)}</td>
                <td className="p-3 border-r font-mono text-gray-600 text-right">{stat.drik.toFixed(2)}</td>
                <td className="p-3 border-r font-bold font-mono bg-amber-50/50 text-right">{stat.total.toFixed(2)}</td>
                <td className="p-3 font-bold font-mono bg-amber-100/50 text-amber-700 text-right">{stat.rupas.toFixed(2)}</td>
                <td className="p-3 font-bold text-center text-gray-700 text-lg">
                  {Object.values(data.shadbala || {}).filter((d: any) => d.rupas > stat.rupas).length + 1}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-6 mt-4 p-4 bg-gray-50 rounded-lg text-xs list-disc border">
        <div>
          <span className="font-bold text-gray-800">最低需求值 (Rupas):</span><br/>
          Su: 5.0 | Mo: 6.0 | Ma: 5.0 | Me: 7.0<br/>
          Ju: 6.5 | Ve: 5.5 | Sa: 5.0
        </div>
      </div>
    </div>
  );
};
