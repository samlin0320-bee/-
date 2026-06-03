import React, { useState } from 'react';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition, getElementColor } from '../utils/astrology';

interface Props {
  data: ChartData;
  modes?: string[];
  showDegrees?: boolean;
  selectedPlanet?: string | null;
  onPlanetClick?: (planetName: string) => void;
}

const WesternChart: React.FC<Props> = ({ data, modes = ['zh'], showDegrees = false, selectedPlanet = null, onPlanetClick }) => {
  const [houseRefType, setHouseRefType] = useState<'planet' | 'sign'>('planet');
  const [houseRefValue, setHouseRefValue] = useState<string>('Ascendant');

  const radius = 48;
  const cx = 50;
  const cy = 50;

  let customFirstSign = 1;
  let referenceDegree = data.ascendant;
  
  if (houseRefType === 'planet') {
    if (houseRefValue === 'Ascendant') {
      customFirstSign = Math.floor(data.ascendant / 30) + 1;
      referenceDegree = data.ascendant;
    } else if (data.planets[houseRefValue]) {
      customFirstSign = data.planets[houseRefValue].sign;
      referenceDegree = data.planets[houseRefValue].longitude;
    }
  } else if (houseRefType === 'sign') {
    customFirstSign = parseInt(houseRefValue) || 1;
    referenceDegree = (customFirstSign - 1) * 30;
  }

  const getCoordinates = (degree: number, r: number) => {
    // Reference degree is at 9 o'clock (180 degrees in SVG)
    // Degrees increase counter-clockwise
    const angle = (180 + referenceDegree - degree) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getPiePath = (startDegree: number, endDegree: number, rInner: number, rOuter: number) => {
    const p1 = getCoordinates(startDegree, rOuter);
    const p2 = getCoordinates(endDegree, rOuter);
    const p3 = getCoordinates(endDegree, rInner);
    const p4 = getCoordinates(startDegree, rInner);
    
    // sweep-flag is 0 for counter-clockwise (since angle decreases)
    return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 0 1 ${p4.x} ${p4.y} Z`;
  };

  const getFontSize = (baseSize: number) => {
    if (modes.includes('symbol')) {
      if (modes.length === 1) return baseSize * 2;
      return baseSize * 1.4;
    }
    return baseSize;
  };

  const getAspectedSigns = (planetName: string, planetSign: number) => {
    if (planetName === 'Mars') return [(planetSign + 3) % 12 + 1, (planetSign + 6) % 12 + 1, (planetSign + 7) % 12 + 1]; // 4, 7, 8
    if (planetName === 'Saturn') return [(planetSign + 2) % 12 + 1, (planetSign + 6) % 12 + 1, (planetSign + 9) % 12 + 1]; // 3, 7, 10
    if (planetName === 'Venus') return [(planetSign + 1) % 12 + 1, (planetSign + 6) % 12 + 1]; // 2, 7
    if (planetName === 'Jupiter') return [(planetSign + 4) % 12 + 1, (planetSign + 6) % 12 + 1, (planetSign + 8) % 12 + 1]; // 5, 7, 9
    return [];
  };

  const getAspectColor = (planetName: string) => {
    if (planetName === 'Mars') return '#EF4444'; // Bright Red
    if (planetName === 'Saturn') return '#7F1D1D'; // Dark Red
    if (planetName === 'Venus') return '#22C55E'; // Green
    if (planetName === 'Jupiter') return '#EAB308'; // Yellow
    return null;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4 flex gap-2 justify-center bg-gray-50 p-2 rounded-lg border border-gray-200">
        <select 
          value={houseRefType} 
          onChange={e => {
            setHouseRefType(e.target.value as 'planet' | 'sign');
            setHouseRefValue(e.target.value === 'planet' ? 'Ascendant' : '1');
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="planet">以行星為第一宮</option>
          <option value="sign">以星座為第一宮</option>
        </select>
        
        {houseRefType === 'planet' ? (
          <select 
            value={houseRefValue} 
            onChange={e => setHouseRefValue(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Ascendant">上升點 (Ascendant)</option>
            {Object.keys(data.planets).map(p => (
              <option key={p} value={p}>{getPlanetName(p, modes)}</option>
            ))}
          </select>
        ) : (
          <select 
            value={houseRefValue} 
            onChange={e => setHouseRefValue(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={(i+1).toString()}>{getZodiacName(i+1, modes)}</option>
            ))}
          </select>
        )}
      </div>

      <div className="aspect-square relative bg-white border border-gray-200 rounded-full shadow-lg overflow-hidden p-1">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Outer Zodiac Ring */}
          {Array.from({ length: 12 }).map((_, i) => {
            const degree = i * 30;
            const sign = i + 1;
            const bgColor = getElementColor(sign);
            const path = getPiePath(degree, degree + 30, radius - 10, radius);
            
            let isAspected = false;
            let aspectColor: string | null = null;

            if (selectedPlanet) {
              const p = data.planets[selectedPlanet];
              if (p) {
                const aspectedSigns = getAspectedSigns(selectedPlanet, p.sign);
                if (aspectedSigns.includes(sign)) {
                  isAspected = true;
                  aspectColor = getAspectColor(selectedPlanet);
                }
              }
            }
            
            return (
              <g key={`sign-bg-${i}`}>
                <path 
                  d={path} 
                  fill={bgColor} 
                  stroke="#9CA3AF" 
                  strokeWidth="0.2" 
                />
                {isAspected && aspectColor && (
                  <path 
                    d={path} 
                    fill="none" 
                    stroke={aspectColor} 
                    strokeWidth="1.5" 
                  />
                )}
              </g>
            );
          })}

          {/* Sign Labels in Outer Ring */}
          {Array.from({ length: 12 }).map((_, i) => {
            const degree = i * 30;
            const sign = i + 1;
            const labelPos = getCoordinates(degree + 15, radius - 5);
            const savPos = getCoordinates(degree + 15, radius - 8);
            
            return (
              <g key={`sign-label-${i}`}>
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fontSize={getFontSize(3)}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill="#374151"
                  fontWeight="bold"
                  className="select-none cursor-default"
                >
                  {getZodiacName(sign, modes)}
                </text>
                {data.sav && (
                  <text
                    x={savPos.x}
                    y={savPos.y}
                    fontSize="2.5"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#4338CA"
                    fontWeight="bold"
                    opacity="0.8"
                    className="select-none cursor-default"
                  >
                    {data.sav[sign - 1]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Degree Ticks */}
          {Array.from({ length: 72 }).map((_, i) => {
            const degree = i * 5;
            const p1 = getCoordinates(degree, radius - 10);
            const p2 = getCoordinates(degree, radius - (i % 6 === 0 ? 13 : 11));
            return (
              <line 
                key={`tick-${i}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                stroke="#9CA3AF" 
                strokeWidth="0.2" 
              />
            );
          })}

          {/* House Lines (Equal Houses based on Fixed Aries) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const degree = i * 30;
            const p1 = getCoordinates(degree, radius - 10);
            const p2 = getCoordinates(degree, radius - 35);
            
            return (
              <g key={`house-${i}`}>
                <line 
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                  stroke="#D1D5DB" 
                  strokeWidth="0.2" 
                  strokeDasharray="1,1"
                />
                {/* House Numbers */}
                {(() => {
                  const sign = i + 1;
                  const customHouseNum = (sign - customFirstSign + 12) % 12 + 1;
                  
                  const numPos1 = getCoordinates(degree + 15, radius - 28);
                  const numPos2 = getCoordinates(degree + 15, radius - 33);
                  
                  return (
                    <g>
                      {/* Standard House Number (Gray) */}
                      <text
                        x={numPos1.x}
                        y={numPos1.y}
                        fontSize="2.5"
                        fill="#9CA3AF"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {sign}
                      </text>
                      {/* Custom House Number (Blue) */}
                      <text
                        x={numPos2.x}
                        y={numPos2.y}
                        fontSize="2.5"
                        fill="#4F46E5"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {customHouseNum}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* ASC and MC Markers */}
          {(() => {
            const ascPos = getCoordinates(data.ascendant, radius - 35);
            const ascLine = getCoordinates(data.ascendant, radius - 10);
            const mcPos = getCoordinates(data.midheaven || (data.ascendant + 270) % 360, radius - 35);
            const mcLine = getCoordinates(data.midheaven || (data.ascendant + 270) % 360, radius - 10);

            return (
              <g>
                <line x1={ascLine.x} y1={ascLine.y} x2={ascPos.x} y2={ascPos.y} stroke="#EF4444" strokeWidth="0.5" />
                <text x={getCoordinates(data.ascendant, radius - 38).x} y={getCoordinates(data.ascendant, radius - 38).y} fontSize="2.5" fill="#EF4444" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">ASC</text>
                
                <line x1={mcLine.x} y1={mcLine.y} x2={mcPos.x} y2={mcPos.y} stroke="#EF4444" strokeWidth="0.5" />
                <text x={getCoordinates(data.midheaven || (data.ascendant + 270) % 360, radius - 38).x} y={getCoordinates(data.midheaven || (data.ascendant + 270) % 360, radius - 38).y} fontSize="2.5" fill="#EF4444" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">MC</text>
              </g>
            );
          })()}

          {/* Inner Circle */}
          <circle cx={cx} cy={cy} r={radius - 35} fill="none" stroke="#E5E7EB" strokeWidth="0.5" />

          {/* Planets */}
          {(Object.values(data.planets) as PlanetPosition[]).map((p, i) => {
            const radialOffset = 15 + (i % 3) * 4;
            const pos = getCoordinates(p.longitude, radius - radialOffset);
            const lineInner = getCoordinates(p.longitude, radius - 10);
            const lineOuter = getCoordinates(p.longitude, radius - 13);

            return (
              <g 
                key={p.name} 
                className="group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPlanetClick) onPlanetClick(p.name);
                }}
                style={{ cursor: onPlanetClick ? 'pointer' : 'default' }}
              >
                {/* Connector line to sign ring */}
                <line 
                  x1={lineInner.x} y1={lineInner.y} 
                  x2={lineOuter.x} y2={lineOuter.y} 
                  stroke="#9CA3AF" strokeWidth="0.2" 
                />
                
                <circle 
                  cx={pos.x} cy={pos.y} 
                  r={selectedPlanet === p.name ? "2" : "1.2"} 
                  fill={selectedPlanet === p.name ? (getAspectColor(p.name) || "#4F46E5") : "white"} 
                  stroke={selectedPlanet === p.name ? "white" : (getAspectColor(p.name) || "#4F46E5")} 
                  strokeWidth="0.3" 
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  fontSize={selectedPlanet === p.name ? getFontSize(4) : getFontSize(2.8)}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={selectedPlanet === p.name ? "white" : "#1F2937"}
                  fontWeight="bold"
                  className="cursor-default select-none"
                >
                  {getPlanetName(p.name, modes)}
                </text>
                {showDegrees && (
                  <text
                    x={pos.x}
                    y={pos.y + 3.5}
                    fontSize="2"
                    fill="#6B7280"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {p.degreeInSign.toFixed(1)}°
                  </text>
                )}
                {p.isRetrograde && (
                  <text
                    x={pos.x + 2}
                    y={pos.y - 2}
                    fontSize="2"
                    fill="#EF4444"
                    fontWeight="bold"
                  >
                    R
                  </text>
                )}
                <title>{getPlanetName(p.name)}: {p.longitude.toFixed(2)}°</title>
              </g>
            );
          })}

        </svg>
      </div>
    </div>
  );
};

export default WesternChart;
