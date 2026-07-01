import React, { useMemo } from 'react';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition, getElementColor, getFunctionalDignity, getFunctionalDignityHexColor } from '../utils/astrology';

interface Props {
  data: ChartData;
  modes?: string[];
  showDegrees?: boolean;
  selectedPlanet?: string | null;
  onPlanetClick?: (planetName: string) => void;
  referenceSign?: number;
}

export const CircularVedicChart: React.FC<Props> = ({
  data,
  modes = ['zh'],
  showDegrees = false,
  selectedPlanet = null,
  onPlanetClick,
  referenceSign
}) => {
  const cx = 100;
  const cy = 100;
  const rOuter = 85;
  const rZodiac = 70;
  const rInner = 55;

  const ascSign = data.ascendantSign;
  const ref = referenceSign || ascSign;

  // Fire/Earth/Air/Water soft backgrounds
  const elementColors: Record<number, string> = {
    1: '#fef2f2', // Fire - soft red
    2: '#fefbeb', // Earth - soft amber
    3: '#f0fdf4', // Air - soft green
    4: '#eff6ff', // Water - soft blue
  };

  const getElementIndex = (sign: number): number => {
    const rem = sign % 4;
    return rem === 0 ? 4 : rem;
  };

  // Group planets by sign
  const planetsBySign = useMemo(() => {
    const groups: Record<number, PlanetPosition[]> = {};
    for (let i = 1; i <= 12; i++) {
      groups[i] = [];
    }
    (Object.values(data.planets) as PlanetPosition[]).forEach(p => {
      if (groups[p.sign]) {
        groups[p.sign].push(p);
      }
    });
    return groups;
  }, [data]);

  // Coordinates helper
  // In Vedic circular, 0 degrees of Aries is at the top (90° offset) or we can orient Ascendant at the left (9 o'clock).
  // Let's place Aries (Sign 1) at 0° relative (right side) and increase counter-clockwise, or place the reference sign (ASC) at the left (180°).
  // Placing the reference sign (ASC) at the left (180°) is very intuitive and aligned with Western wheel orientation, which is common in circular Vedic representations.
  const getCoordinates = (sign: number, degree: number, radius: number) => {
    // Relative sign difference from reference sign
    const signDiff = (sign - ref + 12) % 12;
    const totalDegrees = signDiff * 30 + degree;
    
    // ASC at left (180 degrees / Math.PI rad) and goes counter-clockwise
    const angleRad = Math.PI - (totalDegrees * Math.PI) / 180;
    
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  };

  // Draw aspect lines if a planet is selected
  const aspectLines = useMemo(() => {
    if (!selectedPlanet) return [];
    const p1 = data.planets[selectedPlanet];
    if (!p1) return [];

    const aspects = [7]; // All planets aspect 7th
    if (selectedPlanet === 'Mars') aspects.push(4, 8);
    if (selectedPlanet === 'Jupiter') aspects.push(5, 9);
    if (selectedPlanet === 'Saturn') aspects.push(3, 10);

    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    const startCoord = getCoordinates(p1.sign, p1.degreeInSign, rInner - 12);

    aspects.forEach(a => {
      const targetSign = ((p1.sign + a - 2) % 12) + 1;
      const targetPlanets = planetsBySign[targetSign] || [];
      
      if (targetPlanets.length > 0) {
        // Line to first planet in that sign
        const p2 = targetPlanets[0];
        const endCoord = getCoordinates(p2.sign, p2.degreeInSign, rInner - 12);
        lines.push({
          x1: startCoord.x,
          y1: startCoord.y,
          x2: endCoord.x,
          y2: endCoord.y,
          color: '#ef4444'
        });
      } else {
        // Line to center of the target sign
        const endCoord = getCoordinates(targetSign, 15, rInner - 5);
        lines.push({
          x1: startCoord.x,
          y1: startCoord.y,
          x2: endCoord.x,
          y2: endCoord.y,
          color: '#fca5a5'
        });
      }
    });

    return lines;
  }, [selectedPlanet, data, planetsBySign, ref]);

  return (
    <div className="w-full max-w-md mx-auto aspect-square relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-2">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </radialGradient>
        </defs>

        {/* Center disk */}
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#wheelGlow)" stroke="#e2e8f0" strokeWidth="0.5" />

        {/* Draw 12 sectors with soft backgrounds */}
        {Array.from({ length: 12 }).map((_, i) => {
          const sign = ((ref + i - 1) % 12) + 1;
          const elem = getElementIndex(sign);
          const startAngle = 180 - i * 30; // Starts from 180° (left) and goes counter-clockwise
          const endAngle = startAngle - 30;
          
          const radStart = (startAngle * Math.PI) / 180;
          const radEnd = (endAngle * Math.PI) / 180;

          const xStartOuter = cx + rOuter * Math.cos(radStart);
          const yStartOuter = cy + rOuter * Math.sin(radStart);
          const xEndOuter = cx + rOuter * Math.cos(radEnd);
          const yEndOuter = cy + rOuter * Math.sin(radEnd);

          const xStartInner = cx + rInner * Math.cos(radStart);
          const yStartInner = cy + rInner * Math.sin(radStart);
          const xEndInner = cx + rInner * Math.cos(radEnd);
          const yEndInner = cy + rInner * Math.sin(radEnd);

          // Sector path
          const pathData = `
            M ${xStartInner} ${yStartInner}
            L ${xStartOuter} ${yStartOuter}
            A ${rOuter} ${rOuter} 0 0 1 ${xEndOuter} ${yEndOuter}
            L ${xEndInner} ${yEndInner}
            A ${rInner} ${rInner} 0 0 0 ${xStartInner} ${yStartInner}
            Z
          `;

          // Mid-angle for text
          const midRad = ((startAngle - 15) * Math.PI) / 180;
          const xLabel = cx + rZodiac * Math.cos(midRad);
          const yLabel = cy + rZodiac * Math.sin(midRad);

          return (
            <g key={i}>
              <path
                d={pathData}
                fill={elementColors[elem]}
                stroke="#cbd5e1"
                strokeWidth="0.5"
              />
              {/* Divider lines between signs */}
              <line
                x1={cx + rInner * Math.cos(radStart)}
                y1={cy + rInner * Math.sin(radStart)}
                x2={cx + rOuter * Math.cos(radStart)}
                y2={cy + rOuter * Math.sin(radStart)}
                stroke="#cbd5e1"
                strokeWidth="0.5"
              />
              {/* Sign label */}
              <text
                x={xLabel}
                y={yLabel + 1.5}
                fontSize="5"
                fontWeight="bold"
                fill="#334155"
                textAnchor="middle"
              >
                {getZodiacName(sign, modes)}
              </text>
              {/* House number inner label */}
              <text
                x={cx + (rInner + 4) * Math.cos(midRad)}
                y={cy + (rInner + 4) * Math.sin(midRad) + 1}
                fontSize="4"
                fill="#64748b"
                textAnchor="middle"
                opacity="0.8"
              >
                {i + 1}宮
              </text>
            </g>
          );
        })}

        {/* Draw Inner Grid Ring */}
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#94a3b8" strokeWidth="0.75" />
        <circle cx={cx} cy={cy} r={rInner - 15} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />

        {/* Reference / ASC Line */}
        <line
          x1={cx - rOuter}
          y1={cy}
          x2={cx - rInner + 15}
          y2={cy}
          stroke="#4f46e5"
          strokeWidth="1.5"
          strokeDasharray="1.5 1.5"
        />
        <text x={cx - rOuter + 8} y={cy - 2} fontSize="4" fill="#4f46e5" fontWeight="bold" textAnchor="start">
          ASC 命宮
        </text>

        {/* Draw Aspect Lines */}
        {aspectLines.map((line, idx) => (
          <line
            key={idx}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth="1"
            strokeDasharray="2 1.5"
          />
        ))}

        {/* Draw Planets inside the ring */}
        {(Object.entries(planetsBySign) as [string, PlanetPosition[]][]).map(([signStr, group]) => {
          const sign = parseInt(signStr);
          if (group.length === 0) return null;

          return (
            <g key={sign}>
              {group.map((p, idx) => {
                const dignity = getFunctionalDignity(ascSign, p.name);
                const color = getFunctionalDignityHexColor(dignity);

                // Space planets within the 30-degree sector
                // Base degree inside the sign + stagger offset if multiple planets are in the same sign
                const step = 30 / (group.length + 1);
                const planetDegree = step * (idx + 1);

                // Planet node placement radius
                // Stagger radii to avoid collisions in highly crowded houses
                const radiusStagger = group.length > 2 && idx % 2 === 1 ? rInner - 11 : rInner - 6;

                const coord = getCoordinates(sign, planetDegree, radiusStagger);

                const isSelected = selectedPlanet === p.name;
                const is8thLord = p.name === data.houses[7].lord;

                return (
                  <g
                    key={p.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPlanetClick) onPlanetClick(p.name);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Planet background bubble */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="4.5"
                      fill={isSelected ? '#4f46e5' : '#ffffff'}
                      stroke={is8thLord ? '#ef4444' : isSelected ? '#312e81' : color}
                      strokeWidth={isSelected || is8thLord ? '1' : '0.5'}
                      className="transition-all duration-300 hover:scale-110"
                    />
                    {/* Planet abbreviation text */}
                    <text
                      x={coord.x}
                      y={coord.y + 1.2}
                      fontSize="3.2"
                      fontWeight="bold"
                      fill={isSelected ? '#ffffff' : is8thLord ? '#b91c1c' : '#1e293b'}
                      textAnchor="middle"
                    >
                      {getPlanetName(p.name, ['en']).substring(0, 2)}
                    </text>
                    {/* Small dot for dignity status */}
                    <circle
                      cx={coord.x + 3.2}
                      cy={coord.y - 3.2}
                      r="1"
                      fill={color}
                    />
                    {/* Retrograde mark */}
                    {p.isRetrograde && (
                      <text
                        x={coord.x - 3.2}
                        y={coord.y + 3.5}
                        fontSize="2.5"
                        fill="#ef4444"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        R
                      </text>
                    )}
                    {/* Mini degree display if showDegrees is true */}
                    {showDegrees && (
                      <text
                        x={coord.x}
                        y={coord.y + 7.5}
                        fontSize="2.5"
                        fill="#475569"
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        {p.degreeInSign.toFixed(0)}°
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Center label circle */}
        <circle cx={cx} cy={cy} r={rInner - 24} fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
        <text x={cx} y={cy - 2} fontSize="4.5" fontWeight="bold" fill="#4f46e5" textAnchor="middle">
          {data.id || 'D1'}
        </text>
        <text x={cx} y={cy + 3} fontSize="3" fill="#64748b" textAnchor="middle">
          {data.name?.split(' ')[0]}
        </text>
      </svg>
    </div>
  );
};
