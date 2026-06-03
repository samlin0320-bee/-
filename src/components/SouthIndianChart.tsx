import React from 'react';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition, getElementColor, getFunctionalDignity, getFunctionalDignityColor, getFunctionalDignityHexColor } from '../utils/astrology';

interface Props {
  data: ChartData;
  modes?: string[];
  showDegrees?: boolean;
  selectedPlanet?: string | null;
  onPlanetClick?: (planetName: string) => void;
  referenceSign?: number;
}

const SouthIndianChart: React.FC<Props> = ({ data, modes = ['zh'], showDegrees = false, selectedPlanet = null, onPlanetClick, referenceSign }) => {
  const signPositions = [
    { sign: 12, row: 0, col: 0 },
    { sign: 1, row: 0, col: 1 },
    { sign: 2, row: 0, col: 2 },
    { sign: 3, row: 0, col: 3 },
    { sign: 11, row: 1, col: 0 },
    { sign: 4, row: 1, col: 3 },
    { sign: 10, row: 2, col: 0 },
    { sign: 5, row: 2, col: 3 },
    { sign: 9, row: 3, col: 0 },
    { sign: 8, row: 3, col: 1 },
    { sign: 7, row: 3, col: 2 },
    { sign: 6, row: 3, col: 3 },
  ];

  const getPlanetsInSign = (sign: number) => {
    const planets = (Object.values(data.planets) as PlanetPosition[]).filter(p => p.sign === sign);
    const isAscendant = data.ascendantSign === sign;
    return { planets, isAscendant };
  };

  const getHouseNumber = (sign: number) => {
    const ref = referenceSign || data.ascendantSign;
    return ((sign - ref + 12) % 12) + 1;
  };

  const getFontSize = (baseSize: number) => {
    if (modes.includes('symbol')) {
      if (modes.length === 1) return baseSize * 1.5;
      return baseSize * 1.2;
    }
    if (modes.length > 1) return baseSize * 0.8;
    return baseSize;
  };

  // Calculate aspects if a planet is selected
  const getAspectedSigns = () => {
    if (!selectedPlanet) return [];
    const planet = data.planets[selectedPlanet];
    if (!planet) return [];
    
    const sign = planet.sign;
    const aspects = [7]; // All planets aspect the 7th from themselves
    if (selectedPlanet === 'Mars') aspects.push(4, 8);
    if (selectedPlanet === 'Jupiter') aspects.push(5, 9);
    if (selectedPlanet === 'Saturn') aspects.push(3, 10);
    
    return aspects.map(a => ((sign + a - 2) % 12) + 1);
  };

  const aspectedSigns = getAspectedSigns();

  return (
    <div className="w-full max-w-md mx-auto aspect-square border-2 border-gray-800 relative bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Draw inner lines */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
        {Array.from({ length: 16 }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const isCenter = row > 0 && row < 3 && col > 0 && col < 3;
          
          if (isCenter) {
            if (row === 1 && col === 1) {
              return (
                <div key={i} className="col-span-2 row-span-2 flex items-center justify-center border border-gray-300 bg-gray-50">
                  <span className="text-xl font-bold text-gray-400">南印度盤</span>
                </div>
              );
            }
            return null; // Handled by col-span-2
          }

          const signPos = signPositions.find(p => p.row === row && p.col === col);
          const { planets, isAscendant } = signPos ? getPlanetsInSign(signPos.sign) : { planets: [], isAscendant: false };
          const houseNum = signPos ? getHouseNumber(signPos.sign) : 0;
          const bgColor = signPos ? getElementColor(signPos.sign) : '#ffffff';

          const isAspected = signPos && aspectedSigns.includes(signPos.sign);

          return (
            <div 
              key={i} 
              className={`border p-1.5 relative flex flex-col items-start justify-start overflow-hidden transition-colors duration-300 ${isAspected ? 'border-red-500 border-2' : 'border-gray-400'}`}
              style={{ backgroundColor: isAspected ? '#fee2e2' : bgColor }}
            >
              {signPos && (
                <div className="flex justify-between items-start w-full z-10">
                  <span className="font-bold text-gray-800" style={{ fontSize: `${getFontSize(12)}px` }}>
                    {getZodiacName(signPos.sign, modes)}
                    {isAspected && <span className="ml-1 w-2 h-2 inline-block bg-red-500 rounded-full"></span>}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-medium text-gray-600 bg-white/60 px-1 rounded">{houseNum}宮</span>
                    {data.sav && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-1 rounded border border-indigo-100" title="SAV 動態力場分數">
                        {data.sav[signPos.sign - 1]}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {isAscendant && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-900 opacity-10 text-4xl font-black transform -rotate-45">ASC</span>
                </div>
              )}

              <div className="mt-1 flex flex-wrap gap-1 z-10">
                {planets.map(p => {
                  const dignity = getFunctionalDignity(data.ascendantSign, p.name);
                  const is8thLord = p.name === data.houses[7].lord;
                  
                  let colorClass = selectedPlanet === p.name 
                    ? 'bg-indigo-600 text-white border-indigo-400 scale-110 z-20' 
                    : `bg-white/80 border-gray-200/50 hover:bg-indigo-50 ${getFunctionalDignityColor(dignity)}`;
                    
                  if (is8thLord && selectedPlanet !== p.name) {
                    colorClass = `bg-white/80 border-red-300 text-red-600 hover:bg-red-50`;
                  }

                  return (
                    <span 
                      key={p.name} 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPlanetClick) onPlanetClick(p.name);
                      }}
                      className={`font-medium border px-1 rounded shadow-sm transition-all cursor-pointer flex items-center gap-1 ${colorClass}`}
                      style={{ fontSize: `${getFontSize(9)}px` }}
                    >
                      {getPlanetName(p.name, modes)}
                      {showDegrees && <span className="opacity-70">{(p.degreeInSign).toFixed(1)}°</span>}
                      {p.isRetrograde && <span className="text-red-500">R</span>}
                      {/* Color indicator dot next to planet name */}
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getFunctionalDignityHexColor(dignity) }}></span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SouthIndianChart;
