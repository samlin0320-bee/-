import React from 'react';
import { ChartData, getPlanetName, getZodiacName, getDignityName } from '../../utils/astrology';
import { getJaiminiKarakas, getArudhaPadas, calculateUpagrahas, getPlanetaryRelationships } from '../../utils/advancedCalculations';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabGrahas: React.FC<Props> = ({ data, modes }) => {
  const karakaMap = getJaiminiKarakas(data.planets);

  const planetsList = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">1. 行星 (Grahas)</h2>
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3">Planet</th>
              <th className="p-3">Role</th>
              <th className="p-3">Sign</th>
              <th className="p-3">Degree</th>
              <th className="p-3">Nakshatra</th>
              <th className="p-3">Pada</th>
              <th className="p-3">Retrograde</th>
              <th className="p-3">House</th>
              <th className="p-3">Dignity</th>
              <th className="p-3">Combust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {planetsList.map(pName => {
              const p = data.planets[pName];
              if (!p) return null;
              return (
                <tr key={pName} className="hover:bg-indigo-50/30">
                  <td className="p-3 font-bold text-indigo-700">{getPlanetName(pName, modes)}</td>
                  <td className="p-3 font-mono text-xs font-bold text-amber-600">{karakaMap[pName] || '-'}</td>
                  <td className="p-3">{getZodiacName(p.sign, modes)}</td>
                  <td className="p-3 font-mono">{p.degreeInSign.toFixed(2)}°</td>
                  <td className="p-3">{p.nakshatra.name}</td>
                  <td className="p-3 text-center">{p.nakshatra.pada}</td>
                  <td className="p-3 text-center">{p.isRetrograde ? 'R' : '-'}</td>
                  <td className="p-3 text-center">{p.house}</td>
                  <td className="p-3 text-xs">{getDignityName(p.dignity)}</td>
                  <td className="p-3 text-center">{p.isCombust ? 'Yes' : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
