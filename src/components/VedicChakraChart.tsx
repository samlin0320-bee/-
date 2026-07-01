import React from 'react';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition, getElementColor } from '../utils/astrology';

interface Props {
  data: ChartData;
  modes?: string[];
  showDegrees?: boolean;
  selectedPlanet?: string | null;
  onPlanetClick?: (planetName: string) => void;
  referenceSign?: number;
}

// Map the english abbreviations or chinese names
const SHORT_ZODIAC_LABELS: Record<number, { zh: string; en: string }> = {
  1: { zh: '牡羊', en: 'Ar' },
  2: { zh: '金牛', en: 'Ta' },
  3: { zh: '雙子', en: 'Ge' },
  4: { zh: '巨蟹', en: 'Cn' },
  5: { zh: '獅子', en: 'Le' },
  6: { zh: '處女', en: 'Vi' },
  7: { zh: '天秤', en: 'Li' },
  8: { zh: '天蠍', en: 'Sc' },
  9: { zh: '射手', en: 'Sg' },
  10: { zh: '摩羯', en: 'Cp' },
  11: { zh: '水瓶', en: 'Aq' },
  12: { zh: '雙魚', en: 'Pi' }
};

// Standard Vedic Planet short names for the circular layout
const PLANET_SHORT_NAMES: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mercury: 'Me',
  Venus: 'Ve',
  Mars: 'Ma',
  Jupiter: 'Jp',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
  Ascendant: 'As',
};

const VedicChakraChart: React.FC<Props> = ({
  data,
  modes = ['zh'],
  showDegrees = false,
  selectedPlanet = null,
  onPlanetClick,
  referenceSign
}) => {
  // Center is at (50, 50), Radius is 45.
  const cx = 50;
  const cy = 50;
  
  // We want to align the signs. By default, Aries (Sign 1) starts at top (270 degrees) and runs clockwise.
  // We can let the user specify referenceSign, which will rotate the chart.
  // If referenceSign is provided, we rotate so that referenceSign starts at 270 (top).
  const startSign = referenceSign || data.ascendantSign || 1;
  
  // Each sign is 30 degrees.
  // Calculate polar coordinates
  const getCoordinates = (angleDegrees: number, radius: number) => {
    // Convert to radians. Correct for SVG coordinates where 0 rad is at the 3 o'clock position.
    const angleRad = (angleDegrees * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad)
    };
  };

  // Map planets to their zodiac position (calculated in degrees from start sign)
  // For standard Lahiri longitudinal representation:
  // Each sign is 30 deg. Planet longitude is (sign - 1) * 30 + degreeInSign.
  const getPlanetAngle = (planetSign: number, degreeInSign: number) => {
    // Relative sign difference from startSign
    const diffSigns = (planetSign - startSign + 12) % 12;
    // 0 difference starts at 270 deg (top). Running clockwise, so we ADD degrees.
    const baseAngle = 270 + diffSigns * 30 + degreeInSign;
    return baseAngle % 360;
  };

  // Group planets by sign to make sure we don't overlap them
  const planetsBySign: Record<number, Array<{ name: string; p: PlanetPosition; angle: number }>> = {};
  
  // Also calculate for Ascendant as a pseudo-planet for plotting
  const allPlanetsToPlot = [
    ...Object.entries(data.planets).map(([name, p]) => ({ name, p: p as PlanetPosition })),
    { name: 'Ascendant', p: { name: 'Lagna', sign: data.ascendantSign, degreeInSign: data.ascendant % 30 } as any }
  ];

  allPlanetsToPlot.forEach(({ name, p }) => {
    if (!planetsBySign[p.sign]) {
      planetsBySign[p.sign] = [];
    }
    const angle = getPlanetAngle(p.sign, p.degreeInSign);
    planetsBySign[p.sign].push({ name, p, angle });
  });

  // Render sign partitions
  const sectors = Array.from({ length: 12 }, (_, i) => {
    const signNum = ((startSign + i - 1) % 12) + 1;
    const startAngle = 270 + i * 30;
    const endAngle = 300 + i * 30;
    const midAngle = startAngle + 15;
    
    // Outer arc points
    const outerRadius = 45;
    const innerRadius = 26;
    const textRadius = 38.5;
    const subTextRadius = 32.5;

    const pOuterStart = getCoordinates(startAngle, outerRadius);
    const pOuterEnd = getCoordinates(endAngle, outerRadius);
    const pInnerStart = getCoordinates(startAngle, innerRadius);
    const pInnerEnd = getCoordinates(endAngle, innerRadius);
    
    const labelPos = getCoordinates(midAngle, textRadius);
    const subLabelPos = getCoordinates(midAngle, subTextRadius);

    const elementColor = getElementColor(signNum);
    // Subtle pastel backgrounds
    const bgColors: Record<string, string> = {
      '#fee2e2': '#fef2f2', // Fire
      '#fef3c7': '#fffbeb', // Earth
      '#dcfce7': '#f0fdf4', // Air
      '#dbeafe': '#f0f7ff', // Water
    };
    const fillBg = bgColors[elementColor] || '#fafafa';

    const pathData = `
      M ${pOuterStart.x} ${pOuterStart.y}
      A ${outerRadius} ${outerRadius} 0 0 1 ${pOuterEnd.x} ${pOuterEnd.y}
      L ${pInnerEnd.x} ${pInnerEnd.y}
      A ${innerRadius} ${innerRadius} 0 0 0 ${pInnerStart.x} ${pInnerStart.y}
      Z
    `;

    return {
      signNum,
      pathData,
      fillBg,
      labelPos,
      subLabelPos,
      startAngle,
      endAngle,
      midAngle
    };
  });

  return (
    <div className="w-full max-w-md mx-auto aspect-square relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-3 select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm font-sans">
        
        {/* Draw each 30-degree sector background and borders */}
        {sectors.map((sec, index) => (
          <g key={sec.signNum} className="group transition-all duration-300">
            {/* Sector background */}
            <path
              d={sec.pathData}
              fill={sec.fillBg}
              stroke="#cbd5e1"
              strokeWidth="0.5"
              className="hover:fill-indigo-50/40 transition-colors"
            />
            
            {/* Divider lines radiating from inner circle to outer circle */}
            <line
              x1={getCoordinates(sec.startAngle, 26).x}
              y1={getCoordinates(sec.startAngle, 26).y}
              x2={getCoordinates(sec.startAngle, 45).x}
              y2={getCoordinates(sec.startAngle, 45).y}
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
            
            {/* Sign labels */}
            <text
              x={sec.labelPos.x}
              y={sec.labelPos.y}
              fontSize="3.2"
              fontWeight="bold"
              fill="#1e293b"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {modes.includes('zh') ? SHORT_ZODIAC_LABELS[sec.signNum].zh : SHORT_ZODIAC_LABELS[sec.signNum].en}
            </text>

            <text
              x={sec.subLabelPos.x}
              y={sec.subLabelPos.y}
              fontSize="2"
              fontWeight="medium"
              fill="#64748b"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {getZodiacName(sec.signNum, ['en-abbr'])}
            </text>

            {/* SAV points indicator if present */}
            {data.sav && (
              <text
                x={getCoordinates(sec.midAngle, 41.5).x}
                y={getCoordinates(sec.midAngle, 41.5).y}
                fontSize="2"
                fontWeight="extrabold"
                fill="#4338ca"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {data.sav[sec.signNum - 1]}
              </text>
            )}
          </g>
        ))}

        {/* Concentric helper circles */}
        {/* Outer frame */}
        <circle cx={cx} cy={cy} r="45" fill="none" stroke="#64748b" strokeWidth="1" />
        
        {/* Inner circle dividing the wheel & the center space */}
        <circle cx={cx} cy={cy} r="26" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.85" />
        <circle cx={cx} cy={cy} r="25.2" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        
        {/* Outer thin decor ring */}
        <circle cx={cx} cy={cy} r="46.5" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="1,1" />

        {/* Draw elegant centering sacred celestial OM ॐ path or styled SVG text */}
        <g transform="translate(50, 50)">
          {/* Base glow circle */}
          <circle cx="0" cy="0" r="13" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="0.75" />
          
          {/* Sanskrit/Vedic Style OM Symbol */}
          <text
            x="0"
            y="2"
            fontSize="15"
            fontFamily="sans-serif, system-ui"
            fill="#a855f7"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
            className="filter drop-shadow-[0_1px_1px_rgba(168,85,247,0.15)] pointer-events-none"
          >
            ॐ
          </text>
          
          <text
            x="0"
            y="8.5"
            fontSize="1.6"
            letterSpacing="0.4"
            fontWeight="extrabold"
            fill="#d8b4fe"
            textAnchor="middle"
            className="uppercase font-mono tracking-wider pointer-events-none"
          >
            Lahiri
          </text>
        </g>

        {/* Plot actual planets dynamic locations */}
        {Object.entries(planetsBySign).map(([signStr, planetsList]) => {
          const signNum = parseInt(signStr);
          
          // To prevent overlapping labels inside a single sign's 30 degree sector,
          // we space the planets evenly within the sector's width
          return planetsList.map(({ name, p, angle }, idx) => {
            const listSize = planetsList.length;
            
            // Adjust angle to distribute planets inside the 30deg sign sector
            // Left/Right margin of 4 degrees, space out the rest
            const startSecAngle = sectors.find(s => s.signNum === signNum)?.startAngle ?? angle;
            const sectorOffset = listSize > 1 
              ? 5 + (idx * (20 / (listSize - 1))) 
              : 15;
            
            const adjustedAngle = startSecAngle + sectorOffset;
            
            // Outer range radius of planets in the chart: 26 to 45. We place labels at radius ~ 33.
            // Wait, we can stagger radius to prevent horizontal clutter
            const staggerRadius = 26 + 10.5 + (idx % 2 === 0 ? 3 : -3);
            
            const coord = getCoordinates(adjustedAngle, staggerRadius);
            
            // Display tag like "Su 5°" or "As 22°"
            const label = PLANET_SHORT_NAMES[name] || name.substring(0, 2);
            const degreeVal = Math.floor(p.degreeInSign);
            const displayStr = `${label}${showDegrees ? `${degreeVal}°` : ''}`;
            const isRetro = p.isRetrograde ? 'ᶠ' : '';
            const isCom = p.isCombust ? 'ᶜ' : '';
            
            const isSelected = selectedPlanet === name;
            const elementColor = getElementColor(p.sign);
            
            // Text color based on element or selection
            const textColor = isSelected ? '#ef4444' : '#1e1b4b';
            const fontWeight = isSelected ? 'black' : 'bold';
            
            return (
              <g 
                key={name}
                className="cursor-pointer group/planet transition-all"
                onClick={() => onPlanetClick?.(name)}
              >
                {/* Connecting small pointer line to precise degree on inner circle boundary */}
                <line
                  x1={getCoordinates(adjustedAngle, 26).x}
                  y1={getCoordinates(adjustedAngle, 26).y}
                  x2={coord.x}
                  y2={coord.y}
                  stroke={isSelected ? '#ef4444' : '#94a3b8'}
                  strokeWidth={isSelected ? '0.65' : '0.35'}
                  strokeDasharray="1,1"
                />
                
                {/* Small indicator circle at the calculated position */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="2"
                  fill={isSelected ? '#fecaca' : '#f8fafc'}
                  stroke={isSelected ? '#ef4444' : '#475569'}
                  strokeWidth="0.45"
                  className="transition-colors group-hover/planet:fill-indigo-100"
                />
                
                {/* Label text */}
                <text
                  x={coord.x}
                  y={coord.y - (idx % 2 === 0 ? 3 : -3)}
                  fontSize="2.4"
                  fontWeight={fontWeight}
                  fill={textColor}
                  textAnchor="middle"
                  className="font-sans filter drop-shadow-[0_0.75px_1px_rgba(255,255,255,0.95)] transition-all"
                >
                  {displayStr}{isRetro}{isCom}
                </text>
              </g>
            );
          });
        })}

        {/* Display Lagna detail text in the top left */}
        <text
          x="4"
          y="6"
          fontSize="2.4"
          fontWeight="extrabold"
          fill="#334155"
          className="font-mono"
        >
          {modes.includes('zh') ? `命宮: ${getZodiacName(startSign, modes)}` : `Lagna: ${SHORT_ZODIAC_LABELS[startSign].en}`}
        </text>

        {/* Display degree of Ascendant in the top right */}
        <text
          x="96"
          y="6"
          fontSize="2.4"
          fontWeight="extrabold"
          fill="#334155"
          textAnchor="end"
          className="font-mono"
        >
          {`${Math.floor(data.ascendant % 30)}° ${getZodiacName(data.ascendantSign, ['en-abbr'])}`}
        </text>

      </svg>
    </div>
  );
};

export default VedicChakraChart;
