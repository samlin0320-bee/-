import React from 'react';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition, getElementColor, getFunctionalDignity, getFunctionalDignityHexColor } from '../utils/astrology';

interface Props {
  data: ChartData;
  modes?: string[];
  showDegrees?: boolean;
  selectedPlanet?: string | null;
  onPlanetClick?: (planetName: string) => void;
  referenceSign?: number;
}

const NorthIndianChart: React.FC<Props> = ({ data, modes = ['zh'], showDegrees = false, selectedPlanet = null, onPlanetClick, referenceSign }) => {
  const houses = [
    { id: 1, points: "50,0 25,25 50,50 75,25", textPos: { x: 50, y: 25 } },
    { id: 2, points: "0,0 25,25 50,0", textPos: { x: 25, y: 12 } },
    { id: 3, points: "0,0 0,50 25,25", textPos: { x: 12, y: 25 } },
    { id: 4, points: "0,50 25,75 50,50 25,25", textPos: { x: 25, y: 50 } },
    { id: 5, points: "0,50 0,100 25,75", textPos: { x: 12, y: 75 } },
    { id: 6, points: "0,100 50,100 25,75", textPos: { x: 25, y: 88 } },
    { id: 7, points: "50,100 75,75 50,50 25,75", textPos: { x: 50, y: 75 } },
    { id: 8, points: "100,100 75,75 50,100", textPos: { x: 75, y: 88 } },
    { id: 9, points: "100,50 100,100 75,75", textPos: { x: 88, y: 75 } },
    { id: 10, points: "100,50 75,25 50,50 75,75", textPos: { x: 75, y: 50 } },
    { id: 11, points: "100,0 75,25 100,50", textPos: { x: 88, y: 25 } },
    { id: 12, points: "50,0 75,25 100,0", textPos: { x: 75, y: 12 } },
  ];

  const getPlanetsInHouse = (house: number) => {
    // In North Indian chart, House 1 is always the reference sign (usually Ascendant).
    const ref = referenceSign || data.ascendantSign;
    const sign = ((ref + house - 2) % 12) + 1;
    const planets = (Object.values(data.planets) as PlanetPosition[]).filter(p => p.sign === sign);
    return { planets, sign };
  };

  const getFontSize = (baseSize: number) => {
    if (modes.includes('symbol')) {
      if (modes.length === 1) return baseSize * 1.5;
      return baseSize * 1.2;
    }
    // If multiple modes are selected (e.g., zh + en), make font smaller to fit
    if (modes.length > 1) return baseSize * 0.7;
    return baseSize * 0.8; // Reduced base size to prevent overflow
  };

  // Calculate aspects if a planet is selected
  const getAspectedHouses = () => {
    if (!selectedPlanet) return [];
    const planet = data.planets[selectedPlanet];
    if (!planet) return [];
    
    // Find which house (1-12 in this chart's layout) the planet is in
    const ref = referenceSign || data.ascendantSign;
    const planetHouseInChart = ((planet.sign - ref + 12) % 12) + 1;
    
    const aspects = [7]; // All planets aspect the 7th from themselves
    if (selectedPlanet === 'Mars') aspects.push(4, 8);
    if (selectedPlanet === 'Jupiter') aspects.push(5, 9);
    if (selectedPlanet === 'Saturn') aspects.push(3, 10);
    
    return aspects.map(a => ((planetHouseInChart + a - 2) % 12) + 1);
  };

  const aspectedHouses = getAspectedHouses();

  return (
    <div className="w-full max-w-md mx-auto aspect-square relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-2">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
        {/* Draw Houses */}
        {houses.map((house) => {
          const { planets, sign } = getPlanetsInHouse(house.id);
          const bgColor = getElementColor(sign);

          return (
            <g key={house.id}>
              <polygon
                points={house.points}
                fill={bgColor}
                stroke={aspectedHouses.includes(house.id) ? "#EF4444" : "#9CA3AF"}
                strokeWidth={aspectedHouses.includes(house.id) ? "1.5" : "0.5"}
                className="transition-colors duration-300"
              />
              
              {/* Aspect Indicator */}
              {aspectedHouses.includes(house.id) && (
                <circle cx={house.textPos.x} cy={house.textPos.y - 12} r="1.5" fill="#EF4444" opacity="0.8" />
              )}
              
              {/* House & Sign Info */}
              <text x={house.textPos.x} y={house.textPos.y - 8} fontSize="3.5" fill="#6B7280" textAnchor="middle" fontWeight="500">
                {house.id}宮
              </text>
              <text x={house.textPos.x} y={house.textPos.y - 3} fontSize={getFontSize(4.5)} fill="#374151" textAnchor="middle" fontWeight="bold">
                {getZodiacName(sign, modes)}
              </text>
              {data.sav && (
                <text x={house.textPos.x + 12} y={house.textPos.y - 6} fontSize="3.5" fill="#4338CA" textAnchor="middle" fontWeight="bold" opacity="0.8">
                  {data.sav[sign - 1]}
                </text>
              )}

              {/* Planets */}
              {planets.map((p, i) => {
                const dignity = getFunctionalDignity(data.ascendantSign, p.name);
                const color = selectedPlanet === p.name ? "#4F46E5" : getFunctionalDignityHexColor(dignity);
                const is8thLord = p.name === data.houses[7].lord;
                const displayColor = is8thLord ? "#EF4444" : color; // Highlight 8th lord in red

                return (
                  <g key={p.name} onClick={(e) => {
                    e.stopPropagation();
                    if (onPlanetClick) onPlanetClick(p.name);
                  }} style={{ cursor: onPlanetClick ? 'pointer' : 'default' }}>
                    <text
                      x={house.textPos.x}
                      y={house.textPos.y + 3 + i * (getFontSize(4.5))}
                      fontSize={selectedPlanet === p.name ? getFontSize(4.5) : getFontSize(4.0)}
                      fill={displayColor}
                      textAnchor="middle"
                      fontWeight={selectedPlanet === p.name ? "bold" : "500"}
                    >
                      {getPlanetName(p.name, modes)}
                      {showDegrees && ` ${p.degreeInSign.toFixed(1)}°`}
                      {p.isRetrograde ? ' (R)' : ''}
                    </text>
                    {/* Color indicator dot next to planet name */}
                    <circle 
                      cx={house.textPos.x - 12} 
                      cy={house.textPos.y + 2 + i * (getFontSize(4.5))} 
                      r="1.5" 
                      fill={color} 
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
        
        {/* Ascendant Marker */}
        <text x="50" y="45" fontSize="3" fill="#9CA3AF" textAnchor="middle" opacity="0.6">
          ASC
        </text>
      </svg>
    </div>
  );
};

export default NorthIndianChart;
