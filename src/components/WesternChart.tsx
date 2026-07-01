import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition } from '../utils/astrology';

interface Props {
  data: ChartData;
  modes?: string[];
  showDegrees?: boolean;
  selectedPlanet?: string | null;
  onPlanetClick?: (planetName: string) => void;
}

// Crisp, standard astrological symbols
export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  Ascendant: 'ASC',
  Midheaven: 'MC'
};

export const ZODIAC_SYMBOLS: Record<number, string> = {
  1: '♈',
  2: '♉',
  3: '♊',
  4: '♋',
  5: '♌',
  6: '♍',
  7: '♎',
  8: '♏',
  9: '♐',
  10: '♑',
  11: '♒',
  12: '♓'
};

interface Aspect {
  p1: string;
  p2: string;
  type: 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition';
  angle: number;
  orb: number;
  isHarmonious: boolean;
  color: string;
  symbol: string;
  labelZh: string;
}

export type ThemeType = 'cosmic' | 'cyber' | 'vintage';

interface ThemePreset {
  bg: string;
  wheelBg: string;
  gridLine: string;
  textPrimary: string;
  textSecondary: string;
  borderAccent: string;
  centerRing: string;
  elementColors: Record<number, string>;
  aspectColors: { Conjunction: string; Sextile: string; Square: string; Trine: string; Opposition: string };
  glowEffect: string;
}

const THEME_PRESETS: Record<ThemeType, ThemePreset> = {
  cosmic: {
    bg: 'bg-slate-950 text-slate-100',
    wheelBg: 'from-slate-950 via-slate-900 to-black',
    gridLine: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    borderAccent: '#6366F1',
    centerRing: '#0F172A',
    elementColors: {
      1: '#FEE2E2', // Fire - soft pastel red
      2: '#FEF3C7', // Earth - soft pastel amber
      3: '#ECFDF5', // Air - soft pastel emerald
      4: '#EFF6FF', // Water - soft pastel blue
    },
    aspectColors: {
      Conjunction: '#FCD34D',
      Sextile: '#10B981',
      Square: '#EF4444',
      Trine: '#3B82F6',
      Opposition: '#A855F7'
    },
    glowEffect: 'shadow-[0_0_25px_rgba(99,102,241,0.25)]'
  },
  cyber: {
    bg: 'bg-zinc-950 text-emerald-400',
    wheelBg: 'from-zinc-950 via-black to-zinc-900',
    gridLine: '#27272A',
    textPrimary: '#34D399',
    textSecondary: '#A1A1AA',
    borderAccent: '#EC4899',
    centerRing: '#09090B',
    elementColors: {
      1: '#EF4444', // Cyber Red
      2: '#F59E0B', // Cyber Amber
      3: '#10B981', // Cyber Green
      4: '#06B6D4', // Cyber Cyan
    },
    aspectColors: {
      Conjunction: '#FBBF24',
      Sextile: '#059669',
      Square: '#DC2626',
      Trine: '#2563EB',
      Opposition: '#D946EF'
    },
    glowEffect: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]'
  },
  vintage: {
    bg: 'bg-[#F4EFEB] text-stone-900',
    wheelBg: 'from-[#FAF6F0] via-[#F4EFEB] to-[#EBE4DC]',
    gridLine: '#D1C7BD',
    textPrimary: '#292524',
    textSecondary: '#57534E',
    borderAccent: '#854D0E',
    centerRing: '#EAE0D5',
    elementColors: {
      1: '#FCA5A5', // Warm Red
      2: '#FDE047', // Warm Gold
      3: '#86EFAC', // Warm Moss
      4: '#93C5FD', // Warm Ocean
    },
    aspectColors: {
      Conjunction: '#D97706',
      Sextile: '#047857',
      Square: '#B91C1C',
      Trine: '#1D4ED8',
      Opposition: '#6B21A8'
    },
    glowEffect: 'shadow-[0_4px_24px_rgba(120,53,4,0.15)]'
  }
};

const WesternChart: React.FC<Props> = ({ 
  data, 
  modes = ['zh'], 
  showDegrees = false, 
  selectedPlanet = null, 
  onPlanetClick 
}) => {
  const [theme, setTheme] = useState<ThemeType>('cosmic');
  const [houseRefType, setHouseRefType] = useState<'planet' | 'sign'>('planet');
  const [houseRefValue, setHouseRefValue] = useState<string>('Ascendant');
  const [activeAspectFilter, setActiveAspectFilter] = useState<'all' | 'harmonious' | 'challenging'>('all');
  const [localHoveredPlanet, setLocalHoveredPlanet] = useState<string | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<Aspect | null>(null);
  const [selectedHouseFocus, setSelectedHouseFocus] = useState<number | null>(null);

  const presets = THEME_PRESETS[theme];

  // SVG Dimension Constants
  const radius = 48;
  const cx = 50;
  const cy = 50;

  // Determine Rotation / First House Cusp reference
  let referenceDegree = data.ascendant;
  if (houseRefType === 'planet') {
    if (houseRefValue === 'Ascendant') {
      referenceDegree = data.ascendant;
    } else if (data.planets[houseRefValue]) {
      referenceDegree = data.planets[houseRefValue].longitude;
    }
  } else if (houseRefType === 'sign') {
    const sVal = parseInt(houseRefValue) || 1;
    referenceDegree = (sVal - 1) * 30;
  }

  // 1. D3 Angular Scales
  // Standard Western chart: ASC is at 180° (9 o'clock) and increases COUNTER-CLOCKWISE
  const angleScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 360])
      .range([Math.PI, -Math.PI]); // standard counter-clockwise polar conversion helper
  }, []);

  // Trigonometry Coordinate Mapper backed by D3 scales
  const getCoordinatesData = (degree: number, r: number) => {
    // Offset by referenceDegree to keep first house horizontal
    const relativeDeg = (degree - referenceDegree + 360) % 360;
    const rad = angleScale(relativeDeg);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Convert element type helper
  const getZodiacElementIndex = (sign: number): number => {
    // 1=Aries (Fire), 2=Taurus (Earth), 3=Gemini (Air), 4=Cancer (Water), etc.
    const rem = sign % 4;
    return rem === 0 ? 4 : rem;
  };

  // 2. D3 Arc generator for Zodiac ring segment blocks
  const zodiacArc = useMemo(() => {
    return d3.arc<any>()
      .innerRadius(radius - 6.5)
      .outerRadius(radius)
      .padAngle(0.015);
  }, []);

  // Standard Astrological Aspect Calculations using memoized D3 analysis constraints
  const aspectsList = useMemo<Aspect[]>(() => {
    const planetsKeys = Object.keys(data.planets).filter(k => k !== 'Ketu'); // Ketu is opposition to Rahu, avoid duplicate spam
    const results: Aspect[] = [];

    const aspectDefs = [
      { type: 'Conjunction', angle: 0, maxOrb: 8, isHarmonious: true, color: presets.aspectColors.Conjunction, symbol: '☌', labelZh: '合相 (0°)' },
      { type: 'Sextile', angle: 60, maxOrb: 6, isHarmonious: true, color: presets.aspectColors.Sextile, symbol: '⚹', labelZh: '六合 (60°)' },
      { type: 'Square', angle: 90, maxOrb: 8, isHarmonious: false, color: presets.aspectColors.Square, symbol: '☐', labelZh: '刑相 (90°)' },
      { type: 'Trine', angle: 120, maxOrb: 8, isHarmonious: true, color: presets.aspectColors.Trine, symbol: '△', labelZh: '三合 (120°)' },
      { type: 'Opposition', angle: 180, maxOrb: 8, isHarmonious: false, color: presets.aspectColors.Opposition, symbol: '☍', labelZh: '衝相 (180°)' },
    ];

    for (let i = 0; i < planetsKeys.length; i++) {
      for (let j = i + 1; j < planetsKeys.length; j++) {
        const p1Name = planetsKeys[i];
        const p2Name = planetsKeys[j];
        const p1 = data.planets[p1Name];
        const p2 = data.planets[p2Name];
        if (!p1 || !p2) continue;

        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const def of aspectDefs) {
          const orb = Math.abs(diff - def.angle);
          if (orb <= def.maxOrb) {
            results.push({
              p1: p1Name,
              p2: p2Name,
              type: def.type as any,
              angle: def.angle,
              orb: parseFloat(orb.toFixed(2)),
              isHarmonious: def.isHarmonious,
              color: def.color,
              symbol: def.symbol,
              labelZh: def.labelZh
            });
            break; 
          }
        }
      }
    }
    return results;
  }, [data.planets, theme, presets]);

  // Filter aspects based on active tab
  const filteredAspects = useMemo(() => {
    return aspectsList.filter(asp => {
      if (activeAspectFilter === 'harmonious') return asp.isHarmonious;
      if (activeAspectFilter === 'challenging') return !asp.isHarmonious;
      return true;
    });
  }, [aspectsList, activeAspectFilter]);

  const getPlanetSymbol = (name: string) => PLANET_SYMBOLS[name] || name;

  // Active highlighted planet
  const targetFocusPlanet = selectedPlanet || localHoveredPlanet;

  // Determine planets residing in each house for the focused house details tab
  const houseOccupantsList = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const houseNum = i + 1;
      const occupants: PlanetPosition[] = [];
      
      (Object.values(data.planets) as PlanetPosition[]).forEach(p => {
        // Find which house the planet falls into based on standard whole signs relative to Ascendant
        // Whole signs house system fits Lahiri planetary configurations best
        const relativeDegree = (p.longitude - data.ascendant + 360) % 360;
        const planetHouse = Math.floor(relativeDegree / 30) + 1;
        if (planetHouse === houseNum) {
          occupants.push(p);
        }
      });
      return occupants;
    });
  }, [data.planets, data.ascendant]);

  // Hovered or focused house theme indicators
  const houseAttributesMap: Record<number, { name: string; keyword: string; element: string }> = {
    1: { name: '命宮 (Self / Lagna)', keyword: '自我認同、氣質外貌、生命原力', element: '火' },
    2: { name: '財帛宮 (Wealth)', keyword: '個人資產、價值觀、原生家庭口福', element: '土' },
    3: { name: '兄弟宮 (Siblings/Communication)', keyword: '手足、心智思維、短途出行、寫作能力', element: '風' },
    4: { name: '田宅宮 (Home)', keyword: '家庭、房產載具、內在安全感、母親', element: '水' },
    5: { name: '子女宮 (Creativity/Children)', keyword: '戀愛喜好、創意才華、投資玄宿、孕育', element: '火' },
    6: { name: '奴僕宮 (Health/Service)', keyword: '身體健康、工作義務、生活習慣、恩家', element: '土' },
    7: { name: '夫妻宮 (Partnership)', keyword: '婚姻契約、一對一對話、商業合夥、明敵', element: '風' },
    8: { name: '疾厄宮 (Transformation/Death)', keyword: '深層危機、玄秘金融、疾痛、生死涅槃', element: '水' },
    9: { name: '遷移宮 (Philosophy)', keyword: '高等教育、長途旅行、宗教信仰、父親、靈性', element: '火' },
    10: { name: '官祿宮 (Career)', keyword: '公眾名望、事業成就、社會責任、主管權威', element: '土' },
    11: { name: '福德宮 (Social Network)', keyword: '社交群體、大眾影響、利潤偏財、願景理想', element: '風' },
    12: { name: '玄秘宮 (Subconscious/Spirit)', keyword: '潛意識、靈魂救贖、睡眠隔離、玄學消融', element: '水' }
  };

  return (
    <div className={`w-full space-y-6 p-1 rounded-3xl transition-all duration-500 ${presets.bg}`}>
      
      {/* 🚀 Beautiful Top Interactive Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping" />
            <h3 className="text-base font-black tracking-tight flex items-center gap-1.5 uppercase">
              🌌 恆星制西洋交互黃道盤 (Interstellar Western Astrolabe)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            搭載 D3 軌意映射，支援三款定製化主題：古典、賽博、極光。完美支持手勢懸停
          </p>
        </div>

        {/* Theme and Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Theme switcher */}
          <div className="bg-black/50 p-1 rounded-xl border border-white/10 flex text-[10px] items-center">
            {(['cosmic', 'cyber', 'vintage'] as ThemeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 rounded-lg font-black transition-all uppercase ${
                  theme === t 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'cosmic' ? '🌌 極光' : t === 'cyber' ? '⚡ 賽博' : '📜 古典'}
              </button>
            ))}
          </div>

          <div className="flex text-xs">
            <select 
              value={houseRefType} 
              onChange={e => {
                setHouseRefType(e.target.value as 'planet' | 'sign');
                setHouseRefValue(e.target.value === 'planet' ? 'Ascendant' : '1');
              }}
              className="border border-white/10 rounded-xl px-2.5 py-1.5 text-xs bg-slate-950 text-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
            >
              <option value="planet">以星曜起第一宮 (Dynamic Planet)</option>
              <option value="sign">以星座起第一宮 (Sign Cusps)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Astrological Circle Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: SVG ASTROLABE (Takes 7 Cols on Desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          <div className={`relative w-full max-w-[460px] aspect-square rounded-full p-3 transition-all duration-1000 ${presets.glowEffect} ${theme === 'vintage' ? 'bg-[#FAF6F0]' : 'bg-black'} border border-white/5 flex items-center justify-center p-4 overflow-hidden`}>
            
            {/* Subtle Starry Background for Astronomical aesthetic */}
            {theme !== 'vintage' && (
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-black pointer-events-none" />
            )}

            <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 select-none">
              
              {/* Central Cosmic Ambient Lighting Definitions */}
              <defs>
                <radialGradient id="centralAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={theme === 'cyber' ? '#10B981' : '#6366F1'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <filter id="beautyGlow">
                  <feGaussianBlur stdDeviation="0.4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Central Dynamic Light glow */}
              <circle cx={cx} cy={cy} r={radius - 12} fill="url(#centralAura)" />

              {/* 1. D3 ARC DRIVEN OUTER ZODIAC SIGN RING SEGMENTS */}
              {Array.from({ length: 12 }).map((_, i) => {
                const startDeg = i * 30;
                const endDeg = startDeg + 30;
                const signNum = i + 1;
                const elementIdx = getZodiacElementIndex(signNum);
                const blockBgColor = presets.elementColors[elementIdx as 1|2|3|4] || '#ffffff';

                // We compute the angles relative to referenceDegree
                const relativeStart = (startDeg - referenceDegree + 360) % 360;
                const relativeEnd = (endDeg - referenceDegree + 360) % 360;

                // Let's use D3 scale to map relative angles to polar radians
                const startAngleRad = angleScale(relativeStart);
                const endAngleRad = angleScale(relativeEnd);

                const arcPath = d3.arc<any, any>()({
                  innerRadius: radius - 6.5,
                  outerRadius: radius,
                  startAngle: Math.PI / 2 - startAngleRad, // transform standard polar radian to D3 clock radian
                  endAngle: Math.PI / 2 - endAngleRad,
                });

                return (
                  <path
                    key={`zodiac-arc-${i}`}
                    d={arcPath || ''}
                    transform={`translate(${cx}, ${cy})`}
                    fill={blockBgColor}
                    stroke={presets.gridLine}
                    strokeWidth="0.15"
                    opacity={theme === 'vintage' ? '0.9' : '0.22'}
                    className="transition-all duration-500 cursor-pointer hover:opacity-40"
                  />
                );
              })}

              {/* Outer boundary circular ring */}
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke={presets.gridLine} strokeWidth="0.3" />
              <circle cx={cx} cy={cy} r={radius - 6.5} fill="none" stroke={presets.gridLine} strokeWidth="0.2" />

              {/* Precise 360-degree ticks inside outer ring */}
              {Array.from({ length: 120 }).map((_, i) => {
                const deg = i * 3;
                const isSignificant = i % 10 === 0;
                const isFive = i % 5 === 0;
                const size = isSignificant ? 2.5 : (isFive ? 1.6 : 1.0);
                const p1 = getCoordinatesData(deg, radius - 6.5);
                const p2 = getCoordinatesData(deg, radius - 6.5 - size);
                
                return (
                  <line
                    key={`fine-tick-${i}`}
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={isSignificant ? presets.borderAccent : presets.gridLine}
                    strokeWidth={isSignificant ? "0.22" : "0.08"}
                    opacity={isSignificant ? "0.8" : "0.35"}
                  />
                );
              })}

              {/* 2. Zodiac Unicode Symbols & Labels centered inside the D3 arcs */}
              {Array.from({ length: 12 }).map((_, i) => {
                const centerDeg = i * 30 + 15;
                const signNum = i + 1;
                const labelPos = getCoordinatesData(centerDeg, radius - 3.2);

                return (
                  <g key={`sign-symbols-${i}`} className="pointer-events-none">
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fontSize="2.8"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill={theme === 'vintage' ? '#1C1917' : presets.textPrimary}
                      fontWeight="black"
                      opacity="0.95"
                    >
                      {ZODIAC_SYMBOLS[signNum]}
                    </text>
                  </g>
                );
              })}

              {/* 3. House Segment divisions (Extending from central hub to outer ring) */}
              {Array.from({ length: 12 }).map((_, i) => {
                const cuspOffset = i * 30;
                const cuspDegree = data.ascendant + cuspOffset;
                const p1 = getCoordinatesData(cuspDegree, radius - 6.5);
                const p2 = getCoordinatesData(cuspDegree, radius - 35);
                
                const isAngleHouse = i === 0 || i === 3 || i === 6 || i === 9; // ASC, IC, DSC, MC
                const isFocus = selectedHouseFocus === (i + 1);

                return (
                  <g key={`cusp-ray-${i}`}>
                    <line 
                      x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                      stroke={isFocus ? '#EC4899' : (isAngleHouse ? presets.borderAccent : presets.gridLine)} 
                      strokeWidth={isFocus ? '0.6' : (isAngleHouse ? '0.35' : '0.12')} 
                      strokeDasharray={isAngleHouse ? 'none' : '0.5,0.8'}
                      opacity={isAngleHouse ? '0.85' : '0.4'}
                      className="transition-all duration-300"
                    />

                    {/* Interactive House click overlay zones */}
                    {(() => {
                      const zoneMid = cuspDegree + 15;
                      const cInner = getCoordinatesData(zoneMid, radius - 31);

                      return (
                        <g 
                          className="cursor-pointer"
                          onClick={() => setSelectedHouseFocus(selectedHouseFocus === i + 1 ? null : i + 1)}
                        >
                          {/* Invisible circular trigger backing */}
                          <circle 
                            cx={cInner.x} cy={cInner.y} r="3" 
                            fill={isFocus ? presets.borderAccent : 'transparent'} 
                            opacity="0.15" 
                            className="hover:fill-indigo-500/10 transition-colors"
                          />
                          <text
                            x={cInner.x}
                            y={cInner.y}
                            fontSize="2.1"
                            fill={isFocus ? '#EC4899' : (isAngleHouse ? presets.borderAccent : presets.textSecondary)}
                            fontWeight="black"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="transition-all duration-200"
                          >
                            {i + 1}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* 4. Aspect Lines Interconnecting Network */}
              <g>
                {aspectsList.map((asp, index) => {
                  const p1 = data.planets[asp.p1];
                  const p2 = data.planets[asp.p2];
                  if (!p1 || !p2) return null;

                  const c1 = getCoordinatesData(p1.longitude, radius - 9.5);
                  const c2 = getCoordinatesData(p2.longitude, radius - 9.5);

                  let isHighlighted = false;
                  let isDimmed = false;

                  if (targetFocusPlanet) {
                    if (asp.p1 === targetFocusPlanet || asp.p2 === targetFocusPlanet) {
                      isHighlighted = true;
                    } else {
                      isDimmed = true;
                    }
                  }

                  if (hoveredAspect) {
                    if (asp.p1 === hoveredAspect.p1 && asp.p2 === hoveredAspect.p2) {
                      isHighlighted = true;
                    } else {
                      isDimmed = true;
                    }
                  }

                  const activeColor = asp.color;
                  const strokeWidth = isHighlighted ? "0.65" : "0.18";
                  const strokeOpacity = isHighlighted ? "1" : (isDimmed ? "0.04" : "0.45");

                  return (
                    <g key={`asp-ray-${index}`} className="transition-all duration-300">
                      {/* Interactive glowing stroke backing */}
                      {isHighlighted && (
                        <line
                          x1={c1.x} y1={c1.y}
                          x2={c2.x} y2={c2.y}
                          stroke={activeColor}
                          strokeWidth="1.2"
                          opacity="0.3"
                          filter="url(#beautyGlow)"
                        />
                      )}
                      
                      <line
                        x1={c1.x} y1={c1.y}
                        x2={c2.x} y2={c2.y}
                        stroke={activeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={asp.type === 'Sextile' || asp.type === 'Opposition' ? '0.8,0.8' : 'none'}
                        opacity={strokeOpacity}
                        className="transition-all"
                      />

                      {/* Invisible wider mouse catcher target line */}
                      <line
                        x1={c1.x} y1={c1.y}
                        x2={c2.x} y2={c2.y}
                        stroke="transparent"
                        strokeWidth="1.8"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredAspect(asp)}
                        onMouseLeave={() => setHoveredAspect(null)}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Central Dynamic decorative Astrolabe Mandala to complete the cosmic alignment */}
              <circle cx={cx} cy={cy} r={radius - 36} fill={presets.centerRing} stroke={presets.gridLine} strokeWidth="0.2" />
              <circle cx={cx} cy={cy} r={radius - 40} fill="none" stroke={presets.borderAccent} strokeDasharray="0.3, 0.6" strokeWidth="0.1" opacity="0.5" />
              <circle cx={cx} cy={cy} r="1.8" fill={presets.borderAccent} opacity="0.3" />
              <circle cx={cx} cy={cy} r="0.6" fill="#F8FAFC" />

              {/* ASC & MC Pointer overlay lines on the canvas */}
              {(() => {
                const ascC1 = getCoordinatesData(data.ascendant, radius - 6.5);
                const ascC2 = getCoordinatesData(data.ascendant, radius - 41);
                const mcC1 = getCoordinatesData(data.midheaven || (data.ascendant + 270) % 360, radius - 6.5);
                const mcC2 = getCoordinatesData(data.midheaven || (data.ascendant + 270) % 360, radius - 41);

                return (
                  <g className="pointer-events-none">
                    {/* ASC pointer */}
                    <line x1={ascC1.x} y1={ascC1.y} x2={ascC2.x} y2={ascC2.y} stroke="#EF4444" strokeWidth="0.4" />
                    <text x={getCoordinatesData(data.ascendant, radius - 43).x} y={getCoordinatesData(data.ascendant, radius - 43).y} fontSize="2.2" fill="#EF4444" fontWeight="black" textAnchor="middle" alignmentBaseline="middle">ASC</text>

                    {/* MC pointer */}
                    <line x1={mcC1.x} y1={mcC1.y} x2={mcC2.x} y2={mcC2.y} stroke="#10B981" strokeWidth="0.4" />
                    <text x={getCoordinatesData(data.midheaven || (data.ascendant + 270) % 360, radius - 43).x} y={getCoordinatesData(data.midheaven || (data.ascendant + 270) % 360, radius - 43).y} fontSize="2.2" fill="#10B981" fontWeight="black" textAnchor="middle" alignmentBaseline="middle">MC</text>
                  </g>
                );
              })()}

              {/* 5. Draw Planet Nodes / Symbols in Inner Orbits */}
              {(Object.values(data.planets) as PlanetPosition[]).map((p, i) => {
                const planetC = data.planets[p.name];
                if (!planetC) return null;

                // Stagger layouts nicely in 3 distinct nested orbits to strictly avoid overlapping labels
                const staggeringOffset = (i % 3) * 3.2;
                const radialOrbit = radius - 11.5 - staggeringOffset;
                const pos = getCoordinatesData(p.longitude, radialOrbit);
                const outerRingEdge = getCoordinatesData(p.longitude, radius - 6.5);

                const isHighlighted = selectedPlanet === p.name || localHoveredPlanet === p.name;
                const hasAspectMatch = hoveredAspect && (hoveredAspect.p1 === p.name || hoveredAspect.p2 === p.name);

                return (
                  <g 
                    key={`planet-${p.name}`} 
                    className="cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPlanetClick) onPlanetClick(p.name);
                    }}
                    onMouseEnter={() => setLocalHoveredPlanet(p.name)}
                    onMouseLeave={() => setLocalHoveredPlanet(null)}
                  >
                    {/* Anchor link line from external zodiac slice edge */}
                    <line 
                      x1={outerRingEdge.x} y1={outerRingEdge.y}
                      x2={pos.x} y2={pos.y}
                      stroke={isHighlighted ? '#EF4444' : presets.gridLine}
                      strokeWidth="0.1"
                      strokeDasharray="0.3,0.3"
                      opacity={(isHighlighted || hasAspectMatch) ? "1" : "0.3"}
                    />

                    {/* Spot beacon with Framer Motion entry glow */}
                    <circle 
                      cx={pos.x} cy={pos.y}
                      r={isHighlighted ? "1.5" : "0.9"}
                      fill={(isHighlighted || hasAspectMatch) ? "#EF4444" : presets.borderAccent}
                      stroke="#FFFFFF"
                      strokeWidth={isHighlighted ? "0.3" : "0.15"}
                      className="transition-all duration-300"
                    />

                    {/* Astrological glyph symbol */}
                    <text
                      x={pos.x}
                      y={pos.y - 2.0}
                      fontSize={(isHighlighted || hasAspectMatch) ? "2.6" : "1.8"}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill={(isHighlighted || hasAspectMatch) ? "#EF4444" : presets.textPrimary}
                      fontWeight="black"
                      className="font-mono transition-all duration-300"
                    >
                      {getPlanetSymbol(p.name)}
                    </text>

                    {/* Alphabet abbr label */}
                    <text
                      x={pos.x}
                      y={pos.y + 2.5}
                      fontSize="1.1"
                      textAnchor="middle"
                      fill={(isHighlighted || hasAspectMatch) ? "#EF4444" : presets.textSecondary}
                      fontWeight="bold"
                    >
                      {getPlanetName(p.name, ['en-abbr'])}
                    </text>

                    {/* Longitude numeric minutes overlay */}
                    {showDegrees && (
                      <text
                        x={pos.x}
                        y={pos.y + 3.8}
                        fontSize="0.95"
                        fill="#38BDF8"
                        textAnchor="middle"
                        fontWeight="semibold"
                      >
                        {p.degreeInSign.toFixed(0)}°
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip overlay bubble */}
            <AnimatePresence>
              {hoveredAspect && (
                <motion.div 
                  initial={{ opacity: 0, y: 12, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 12, x: '-50%' }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 px-3.5 py-1.5 rounded-full text-[11px] font-black text-slate-100 shadow-xl flex items-center gap-2.5"
                >
                  <span style={{ color: hoveredAspect.color }} className="text-sm">{hoveredAspect.symbol}</span>
                  <span>
                    {getPlanetName(hoveredAspect.p1, modes)} 
                    <span className="text-indigo-400 font-extrabold mx-1">{hoveredAspect.labelZh}</span> 
                    {getPlanetName(hoveredAspect.p2, modes)}
                  </span>
                  <span className="bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] text-indigo-300 font-mono">
                    差 {hoveredAspect.orb}°
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right column: Dynamic interactive panels deck (Takes 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Dashboard A: House Residing Explorer Triggered by wheel clicking */}
          <div className="bg-black/20 rounded-2xl border border-white/5 p-4 space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2">
              <span>🏠</span> 宮位精算儀表板 (House Focus Deck)
            </h4>
            
            <p className="text-[11px] text-slate-400">
              請點擊星盤上的數字 1-12 來切換選定的宮位：
            </p>

            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 12 }).map((_, i) => {
                const hNum = i + 1;
                const hasPlanets = houseOccupantsList[i].length > 0;
                const isSelected = selectedHouseFocus === hNum;

                return (
                  <button
                    key={`house-btn-${hNum}`}
                    onClick={() => setSelectedHouseFocus(isSelected ? null : hNum)}
                    className={`w-7 h-7 text-xs font-black rounded-lg transition-all flex items-center justify-center relative ${
                      isSelected 
                      ? 'bg-indigo-600 text-white shadow-lg scale-110 border border-indigo-400/30' 
                      : (hasPlanets ? 'bg-slate-800/80 text-indigo-200 border border-indigo-500/20' : 'bg-slate-900/40 text-slate-500 border border-white/5')
                    }`}
                  >
                    {hNum}
                    {hasPlanets && !isSelected && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-pink-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Displaying focused house variables */}
            {selectedHouseFocus !== null ? (
              <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-3.5 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black text-indigo-300">
                    🏷️ {houseAttributesMap[selectedHouseFocus].name}
                  </h5>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                    主司元素: {houseAttributesMap[selectedHouseFocus].element}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                  📌 {houseAttributesMap[selectedHouseFocus].keyword}
                </p>

                {/* Residing planets detail list */}
                <div className="border-t border-white/5 pt-2.5 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    落入星曜 ({houseOccupantsList[selectedHouseFocus - 1].length}):
                  </p>
                  {houseOccupantsList[selectedHouseFocus - 1].length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">空宮 (無生星落入，需參考宮主星飛宮位置)</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      {houseOccupantsList[selectedHouseFocus - 1].map((p, idx) => (
                        <div 
                          key={`occ-${idx}`} 
                          onClick={() => {
                            if (onPlanetClick) onPlanetClick(p.name);
                          }}
                          className="bg-slate-900/60 hover:bg-slate-900 px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between border border-white/5 cursor-pointer"
                        >
                          <span className="font-bold flex items-center gap-1">
                            <span>{PLANET_SYMBOLS[p.name]}</span>
                            {getPlanetName(p.name, modes)}
                          </span>
                          <span className="font-mono text-cyan-400 font-extrabold text-[10px]">
                            {getZodiacName(p.zodiacSign, modes)} / {p.degreeInSign.toFixed(2)}°
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/20 border border-dashed border-white/5 rounded-xl p-4 text-center text-[11px] text-slate-500 font-bold">
                💡 提示：點擊數字宮位，立即可視化獲取對應落宮與星曜飛宮解讀
              </div>
            )}
          </div>

          {/* Dashboard B: Aspect Explorer with search and analysis */}
          <div className="bg-black/20 rounded-2xl border border-white/5 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2">
                <span>🕸️</span> 關鍵相位精算排行榜 (Major Aspects)
              </h4>

              {/* Filtering selector tabs */}
              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[9px] w-fit">
                <button
                  onClick={() => setActiveAspectFilter('all')}
                  className={`px-2 py-1 rounded font-bold uppercase transition-all ${
                    activeAspectFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  全部 ({aspectsList.length})
                </button>
                <button
                  onClick={() => setActiveAspectFilter('harmonious')}
                  className={`px-2 py-1 rounded font-bold uppercase transition-all ${
                    activeAspectFilter === 'harmonious' ? 'bg-emerald-600/90 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  吉 ({aspectsList.filter(a => a.isHarmonious).length})
                </button>
                <button
                  onClick={() => setActiveAspectFilter('challenging')}
                  className={`px-2 py-1 rounded font-bold uppercase transition-all ${
                    activeAspectFilter === 'challenging' ? 'bg-red-600/90 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  凶 ({aspectsList.filter(a => !a.isHarmonious).length})
                </button>
              </div>
            </div>

            {filteredAspects.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-bold border border-dashed border-white/5 rounded-xl">
                📭 當前分類沒有顯著主要相位
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {filteredAspects.map((asp, i) => {
                  const isFocused = targetFocusPlanet === asp.p1 || targetFocusPlanet === asp.p2;

                  return (
                    <div
                      key={`aspect-chord-${i}`}
                      onClick={() => {
                        if (onPlanetClick) onPlanetClick(asp.p1);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group/asp ${
                        isFocused 
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20' 
                        : 'bg-slate-950/60 border-white/5 hover:border-indigo-500/20 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          style={{ backgroundColor: `${asp.color}15`, borderColor: asp.color }}
                          className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0"
                        >
                          <span style={{ color: asp.color }} className="text-xs font-black font-mono">
                            {asp.symbol}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-100 flex items-center gap-1.5 truncate">
                            <span>{PLANET_SYMBOLS[asp.p1]}</span>
                            <span className="text-indigo-300 font-bold">{getPlanetName(asp.p1, modes)}</span> 
                            <span className="text-slate-400 font-medium mx-0.5">{asp.labelZh}</span> 
                            <span>{PLANET_SYMBOLS[asp.p2]}</span>
                            <span className="text-indigo-300 font-bold">{getPlanetName(asp.p2, modes)}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate italic">
                            {getInterpretationSnippet(asp.p1, asp.p2, asp.type)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold font-mono text-emerald-400">
                          容許 {asp.orb.toFixed(2)}°
                        </p>
                        <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-md mt-1 scale-90 origin-right ${
                          asp.isHarmonious 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {asp.isHarmonious ? '吉' : '凶'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Precise astrological interpretations snippets
function getInterpretationSnippet(p1: string, p2: string, type: string): string {
  const map: Record<string, string> = {
    'Sun-Moon-Conjunction': '「新月之合」意志與情緒深刻合一，能量內斂。',
    'Sun-Moon-Trine': '身心協調，理性與感性相得益彰，人緣與健康運極佳。',
    'Sun-Moon-Square': '內在矛盾重重，自我意志與情緒安全感難以調和。',
    'Sun-Moon-Opposition': '「滿月之衝」內在張力極大，容易在關係中尋求平衡。',
    'Mars-Saturn-Conjunction': '「冰與火之歌」行動受阻，意志被紀律壓制。',
    'Mars-Saturn-Square': '極易生怒、遭挫、骨骼受損或突發矛盾受困。',
    'Mars-Saturn-Opposition': '頑固對立，脾氣硬朗，常有外部不可抗力形成考驗。',
    'Venus-Jupiter-Conjunction': '「大吉之星曜」超級好運、財運與感情貴人運臨門。',
    'Venus-Jupiter-Trine': '金錢富足度、審美、藝術素雅極具才華。',
    'Venus-Jupiter-Square': '容易奢侈、放縱享受，過度樂觀帶來決策失誤。',
    'Mercury-Mars-Square': '言語如飛刀，思維極敏銳但急躁，注意口角外傷。',
    'Mercury-Mars-Conjunction': '雄辯、邏輯強大、思維極具侵略與行動性。',
    'Jupiter-Saturn-Conjunction': '印占大運「命運重整期」，擴張與收縮取得神韻平衡。'
  };

  const key1 = `${p1}-${p2}-${type}`;
  const key2 = `${p2}-${p1}-${type}`;

  if (map[key1]) return map[key1];
  if (map[key2]) return map[key2];

  if (type === 'Conjunction') return '兩星能量重疊，形成全新的綜合生命力量點。';
  if (type === 'Trine') return '兩星氣磁相通，呈現不費吹灰之力的流暢天賦與吉曜。';
  if (type === 'Square') return '兩星陷入嚴正刑剋，激發劇烈挑戰，是靈魂成長的必經考驗。';
  if (type === 'Sextile') return '兩星互吐芳華，蘊含著被忽視的機緣與後天開拓力。';
  if (type === 'Opposition') return '兩星隔宮對立，能量在兩個極端拉扯，需經由對立取得整合。';

  return '兩星磁感交互作用中，命運推力隨期爆發。';
}

export default WesternChart;
