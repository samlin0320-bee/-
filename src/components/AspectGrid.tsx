import React from 'react';
import { ChartData, getPlanetName, PlanetPosition } from '../utils/astrology';

interface Props {
  natalData: ChartData;
  transitData?: ChartData;
  modes?: string[];
}

const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8, symbol: '☌', color: '#EF4444' },
  { name: 'Opposition', angle: 180, orb: 8, symbol: '☍', color: '#EF4444' },
  { name: 'Trine', angle: 120, orb: 8, symbol: '△', color: '#22C55E' },
  { name: 'Square', angle: 90, orb: 8, symbol: '□', color: '#EF4444' },
  { name: 'Sextile', angle: 60, orb: 6, symbol: '⚹', color: '#3B82F6' },
];

const getAspect = (p1: number, p2: number) => {
  let diff = Math.abs(p1 - p2);
  if (diff > 180) diff = 360 - diff;

  for (const aspect of ASPECTS) {
    if (Math.abs(diff - aspect.angle) <= aspect.orb) {
      return { ...aspect, diff: Math.abs(diff - aspect.angle) };
    }
  }
  return null;
};

const AspectGrid: React.FC<Props> = ({ natalData, transitData, modes = ['zh'] }) => {
  const [highlightedPlanet, setHighlightedPlanet] = React.useState<string | null>(null);
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta', 'Fortune', 'Spirit', 'Vertex', 'Ascendant', 'Midheaven'];
  
  // Filter out planets that might not exist in the data
  const validNatalPlanets = planets.filter(p => p === 'Ascendant' || p === 'Midheaven' || natalData.planets[p]);
  const validTransitPlanets = transitData ? planets.filter(p => transitData.planets[p]) : validNatalPlanets;

  const getPlanetLong = (data: ChartData, planetName: string) => {
    if (planetName === 'Ascendant') return data.ascendant;
    if (planetName === 'Midheaven') return data.midheaven || (data.ascendant + 270) % 360;
    return data.planets[planetName]?.longitude || 0;
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-indigo-600">⚹</span> 
        {transitData ? '本命星與運行星相位表 (Natal vs Transit)' : '本命星相位表 (Natal Aspects)'}
      </h3>
      
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="overflow-x-auto flex-1 w-full max-w-full">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-200 p-2 bg-gray-50 text-gray-500 font-medium">
                  {transitData ? '本命 \\ 運行' : ''}
                </th>
                {validTransitPlanets.map(tp => (
                  <th 
                    key={`th-${tp}`} 
                    className={`border border-gray-200 p-2 bg-gray-50 font-bold text-gray-700 text-center cursor-pointer transition-colors hover:bg-indigo-50 ${highlightedPlanet === tp ? 'bg-indigo-100 text-indigo-700 ring-2 ring-inset ring-indigo-500' : ''}`}
                    onClick={() => setHighlightedPlanet(highlightedPlanet === tp ? null : tp)}
                  >
                    {getPlanetName(tp, modes)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validNatalPlanets.map((np, i) => (
                <tr key={`tr-${np}`}>
                  <th 
                    className={`border border-gray-200 p-2 bg-gray-50 font-bold text-gray-700 text-left whitespace-nowrap cursor-pointer transition-colors hover:bg-indigo-50 ${highlightedPlanet === np ? 'bg-indigo-100 text-indigo-700 ring-2 ring-inset ring-indigo-500' : ''}`}
                    onClick={() => setHighlightedPlanet(highlightedPlanet === np ? null : np)}
                  >
                    {getPlanetName(np, modes)}
                  </th>
                  {validTransitPlanets.map((tp, j) => {
                    // For natal-only grid, only show lower triangle
                    if (!transitData && j >= i) {
                      return <td key={`td-${np}-${tp}`} className="border border-gray-200 p-2 bg-gray-50/50"></td>;
                    }

                    const nLong = getPlanetLong(natalData, np);
                    const tLong = getPlanetLong(transitData || natalData, tp);
                    const aspect = getAspect(nLong, tLong);
                    
                    const isHighlighted = highlightedPlanet === np || highlightedPlanet === tp;

                    return (
                      <td 
                        key={`td-${np}-${tp}`} 
                        className={`border border-gray-200 p-2 text-center h-12 w-12 relative transition-all duration-300 ${isHighlighted ? 'bg-indigo-50/50 z-10' : ''}`}
                      >
                        {aspect && (
                          <div 
                            className={`flex flex-col items-center justify-center transform transition-transform ${isHighlighted ? 'scale-125' : 'opacity-40'}`} 
                            style={{ opacity: highlightedPlanet ? (isHighlighted ? 1 : 0.2) : 1 }}
                            title={`${aspect.name} (誤差 ${aspect.diff.toFixed(1)}°)`}
                          >
                            <span className="text-lg font-bold leading-none" style={{ color: aspect.color }}>
                              {aspect.symbol}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-1">
                              {aspect.diff.toFixed(1)}°
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 參考圖片 Reference Image */}
        <div className="w-full xl:w-80 flex-shrink-0 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <h4 className="text-sm font-bold text-gray-700 mb-2">相位與宮位參考</h4>
          <img 
            src="https://storage.googleapis.com/aistudio-artifacts-public/2e90fbbd-0dc6-4e5a-bb48-9366df02a243.png" 
            alt="宮相一體參考" 
            className="w-full h-auto object-contain rounded-lg border border-gray-200 bg-white"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
        <div className="font-bold text-gray-700">圖例：</div>
        {ASPECTS.map(a => (
          <div key={a.name} className="flex items-center gap-1">
            <span className="text-base font-bold" style={{ color: a.color }}>{a.symbol}</span>
            <span>{a.name === 'Conjunction' ? '合相(0°)' : a.name === 'Opposition' ? '對分相(180°)' : a.name === 'Trine' ? '三分相(120°)' : a.name === 'Square' ? '四分相(90°)' : '六分相(60°)'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AspectGrid;
