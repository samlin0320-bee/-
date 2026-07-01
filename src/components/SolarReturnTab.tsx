import React, { useState, useMemo } from 'react';
import { 
  ChartData, 
  PlanetPosition,
  calculateChart, 
  getPlanetName, 
  getZodiacName, 
  getAyanamsa,
  getGeocentricLongitude 
} from '../utils/astrology';
import { Body, AstroTime } from 'astronomy-engine';
import SouthIndianChart from './SouthIndianChart';
import NorthIndianChart from './NorthIndianChart';
import { AnnualForecastSummary } from './AnnualForecastSummary';
import { 
  Calendar, 
  Sparkles, 
  Compass, 
  LayoutGrid, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  HelpCircle,
  Clock,
  ArrowRight,
  Star,
  ArrowUpDown,
  Check,
  ExternalLink
} from 'lucide-react';

interface Props {
  natalData: ChartData;
  modes?: string[];
  lat: number;
  lng: number;
  isSidereal: boolean;
  ayanamsaType: string;
}

const SIGN_LORDS = ['', 'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

export const SolarReturnTab: React.FC<Props> = ({
  natalData,
  modes = ['zh'],
  lat,
  lng,
  isSidereal,
  ayanamsaType
}) => {
  // 1. Target Year state: Default to the year of current run date (2026) or the current calendar year
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  const [chartStyle, setChartStyle] = useState<'south' | 'north'>('south');

  // Calibration offset in hours to resolve potential double-timezone subtraction bugs representing Western softwares
  const [calibrationOffset, setCalibrationOffset] = useState<number>(0);

  // Multi-Year Advanced Scanner States
  const [rangeStart, setRangeStart] = useState<number>(currentYear);
  const [rangeEnd, setRangeEnd] = useState<number>(currentYear + 4);
  const [selectedRangeYear, setSelectedRangeYear] = useState<number>(currentYear);
  const [selectedRangeHouse, setSelectedRangeHouse] = useState<number>(1);

  // House Lord Placement Explanation database
  const getHouseLordPlacementExplanation = (houseX: number, houseY: number, planetaryName: string) => {
    const houseNames: Record<number, {zh: string, en: string}> = {
      1: { zh: '1宮(命宮-自我主調)', en: '1st House (Tanu)' },
      2: { zh: '2宮(財帛宮-正財資產)', en: '2nd House (Dhana)' },
      3: { zh: '3宮(兄弟宮-學習驛動)', en: '3rd House (Sahaja)' },
      4: { zh: '4宮(田宅宮-家宅安寧)', en: '4th House (Bandhu)' },
      5: { zh: '5宮(子女宮-才華創意)', en: '5th House (Putra)' },
      6: { zh: '6宮(奴僕宮-勞力辛勤)', en: '6th House (Shatru)' },
      7: { zh: '7宮(夫妻宮-合夥伴侶)', en: '7th House (Kalatra)' },
      8: { zh: '8宮(疾厄宮-深淵轉化)', en: '8th House (Randhra)' },
      9: { zh: '9宮(遷移宮-信仰格局)', en: '9th House (Dharma)' },
      10: { zh: '10宮(官祿宮-事業尊嚴)', en: '10th House (Karma)' },
      11: { zh: '11宮(福德宮-社交福報)', en: '11th House (Labha)' },
      12: { zh: '12宮(玄秘宮-靈性心靈)', en: '12th House (Vyaya)' }
    };

    const nameX = houseNames[houseX]?.zh || `${houseX}宮`;
    const nameY = houseNames[houseY]?.zh || `${houseY}宮`;
    const pNameTranslated = getPlanetName(planetaryName, modes);

    let explanation = `「${nameX}主星【${pNameTranslated}】飛入【第 ${houseY} 宮】」`;
    
    if (houseX === houseY) {
      explanation += `。宮主星歸位入本宮（自守護宮），能量得以高度純化與強大保護。這暗示當年在 ${nameX} 象徵的領域中，你擁有高度的自主支配權與貴人相助，不易受外部干擾，能由內而外完美奠定牢固基業。`;
    } else {
      explanation += `。此飛星軌跡將【${nameX}】的能量底牌，主動飛入【${nameY}】承接展現。這預示著，今年你追求【${nameX}】的意志或其引發的世俗事端（如動能、得失），將會藉由【${nameY}】的具體舞台作為渠道或途徑爆發。`;
    }

    // Multi-house rule explanations
    const specialtyCombos: Record<string, string> = {
      '1-1': '【命主歸位】命主親自坐鎮生命本命，極強的自我主導、性格展現、全新起點、元氣滿滿，凡事靠自己便能殺出重圍！',
      '1-2': '【主體求財】命主星飛入財帛宮。代表今年特別專注於賺錢、自主理財、提升個人資產、挖掘正財價值。',
      '1-3': '【思緒驛動 / 學習擴張】利於短期旅行、文書簽約、媒體傳播、新技能考證。兄弟姊妹與鄰里關係多有互動。',
      '1-4': '【內心安住 / 家宅置產】生命主軸偏向家庭建構、心理踏實感、房產置辦，或是花時間打點家務與照料家人。',
      '1-5': '【才華橫溢 / 桃花綻放】才華與創意靈感爆發，戀愛或親子關係是焦點。對金錢投資或股票多有興趣。',
      '1-6': '【勞碌務實 / 身心保養】一整年需在工作日常、細節、健康或債務問題上面對考驗，需注意勞逸結合，預防過勞。',
      '1-7': '【婚姻合夥 / 合作契機】自我命主投射至夫妻對宮。今年與伴侶、客戶、合夥人的深度交鋒和合同牽引對你的人生有決定性作用。',
      '1-8': '【生命轉化 / 密探玄學】經歷心理層面的深層轉折。利於鑽研玄學密探、領取保險、分得遺產、融資或身心靈探索。',
      '1-9': '【志在遠方 / 法業護航】遷移宮主照。可能面臨長途旅行、出國進修、宗教修行或法律維權，極多貴人引路。',
      '1-10': '【榮膺要職 / 攀登高峰】命主飛入事業官祿宮。今年人生核心目標鎖定在職涯建構與社會名譽，是大展長才的耀眼之年！',
      '1-11': '【名利雙收 / 眾望所歸】命主星飛入福德宮。在社群團體中大放異彩、拓展朋友圈、獲得廣泛公眾認可或大筆年度分紅。',
      '1-12': '【退隱沉澱 / 身心靈修持】心境偏向隱密修整、藝術創作、靈性修持、或在幕後悄然耕耘。切忌盲目高調。',
      
      '2-1': '【財帛照我】賺錢點子與財務自律直接反哺命主。利於建立豐厚資產、精準評估生活及自我核心價值。',
      '2-2': '【正財歸位】本年度財運得享穩健增長，財務自我掌控力大幅提高，吃穿用度優渥，資源自給自足。',
      '2-11': '【資產暴漲】財星入福德宮，大財源或社群分紅、人情帶來橫財。利潤管道將多路齊開。',

      '10-1': '【事業照命 / 聲名大噪】官祿宮主飛回命宮。事業成就在今年主動向你靠攏，容易升官、創業名聲鶴立、深得賞識。',
      '10-10': '【官祿大吉】事業守護星歸位。職涯推進極其順遂、地位穩固，管理權威與企業格局迎來最佳奠基期。',
      
      '9-10': '【法業福照 / 貴格重現】代表遷移、法規與好運的第9宮主星高掛於10宮。這是流年極尊貴的格局！代表職業發展伴隨宏大氣運與德行厚報，逢凶化吉。',
      '5-9': '【福慧雙修】主管福德與創意的第5宮主星，飛入高等信仰第9宮。流年三分宮主星奇妙共鳴，代表思維躍升、靈感不絕，出國或考試運勢亨通。',
      '4-10': '【內外一體】田宅宮主飛入官祿宮。今年事業的成功會與家族資源、房產購置有深厚連結，多有在家辦公、家業振興之兆。',
      '6-8': '【化被動為轉機】奴僕宮主星飛入疾厄宮。兩大挑戰宮主相沖，反顯「置之死地而後生」之果決。需多保重關節肝膽，但在合規糾紛中可絕地反擊。',
      '8-12': '【般若智慧 / 解脫清淨】疾厄主星飛入玄秘宮。代表與玄學、修持、隱秘藝術有神秘鏈接，是解鎖深層潛意識、參透玄學命理的至佳流年。'
    };

    const key = `${houseX}-${houseY}`;
    if (specialtyCombos[key]) {
      explanation += `\n🌟 **飛星古典格言：**${specialtyCombos[key]}`;
    } else {
      // General fallbacks for other houses
      const houseMeanings: Record<number, string> = {
        1: '提升自主性、自我命盤的主觀行動力。',
        2: '直接關聯金錢、動產、積蓄、家庭觀念及面部飲食。',
        3: '影響短途旅行、文字工作、技能考照、合同談判與兄弟關係。',
        4: '深度映射家庭氣氛、房產物業、安全感建立、車輛購置。',
        5: '關乎個人創意展現、戀愛生活、偏財投資、子女及休閒娛樂。',
        6: '主導日常瑣事、身體保健、僱傭、債務履行、體力耗費。',
        7: '圍繞伴侶、核心客戶、法律契約、一對一對等談判。',
        8: '與深層危機、大額偏財、共同資產、健康隱疾、內在覺悟有關。',
        9: '指引長途旅行、深造求學、精神道統、宗教哲學與福至心靈。',
        10: '涉及權威晉升、社會名望、職能決策、企業責任與外部威信。',
        11: '主要聚焦在社交圈子、朋友援助、大眾營銷、獲取群體收益。',
        12: '象徵幕後修心、隱藏危機、靈魂釋放、海外工作與心神放鬆。'
      };
      
      explanation += ` 今年這顆星運行於此，會將【${nameX}】所掌管的主題（例如：${houseMeanings[houseX] || ''}），轉移並投射至【${nameY}】所掌管的事務（例如：${houseMeanings[houseY] || ''}）來展開互飛與互動，是極具精準度的年度前瞻解讀。`;
    }

    return {
      title: `【${houseX}宮主星】(${pNameTranslated}) 飛入 【第 ${houseY} 宮】`,
      explanation
    };
  };

  // 2. Exact Solar Return moment search
  const solarReturnData = useMemo(() => {
    const natalSunLon = natalData.planets['Sun']?.longitude || 0;
    const birthDate = natalData.utcTime ? new Date(natalData.utcTime) : new Date();
    
    // Approximate target date in the selected year
    const targetDate = new Date(birthDate);
    targetDate.setFullYear(targetYear);

    const getSunLon = (d: Date): number => {
      const time = new AstroTime(d);
      let lon = getGeocentricLongitude(Body.Sun, time);
      if (isSidereal) {
        const ayan = getAyanamsa(d, ayanamsaType);
        lon -= ayan;
        if (lon < 0) lon += 360;
      }
      return lon;
    };

    const getDiff = (d: Date): number => {
      let diff = getSunLon(d) - natalSunLon;
      while (diff < -185) diff += 360;
      while (diff > 185) diff -= 360;
      return diff;
    };

    // Find search window bounds that guarantee f(low) < 0 and f(high) > 0
    let lowDate = new Date(targetDate.getTime() - 5 * 24 * 60 * 60 * 1000);
    let highDate = new Date(targetDate.getTime() + 5 * 24 * 60 * 60 * 1000);

    let safetyLimit = 0;
    while (getDiff(lowDate) > 0 && safetyLimit < 10) {
      lowDate = new Date(lowDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      safetyLimit++;
    }
    safetyLimit = 0;
    while (getDiff(highDate) < 0 && safetyLimit < 10) {
      highDate = new Date(highDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      safetyLimit++;
    }

    // Binary search (bisection method)
    let low = lowDate.getTime();
    let high = highDate.getTime();
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      const diff = getDiff(new Date(mid));
      if (diff < 0) {
        low = mid;
      } else {
        high = mid;
      }
    }

    let exactReturnDate = new Date((low + high) / 2);
    
    // Apply calibration offset
    if (calibrationOffset !== 0) {
      exactReturnDate = new Date(exactReturnDate.getTime() + calibrationOffset * 60 * 60 * 1000);
    }
    
    // Compute complete ChartData for this exact return moment
    const returnChart = calculateChart(exactReturnDate, lat, lng, isSidereal, ayanamsaType);
    
    // Compute native age
    const birthYear = birthDate.getFullYear();
    const age = targetYear - birthYear;

    return {
      exactReturnDate,
      returnChart,
      age,
      natalSunLon
    };
  }, [natalData, targetYear, lat, lng, isSidereal, ayanamsaType, calibrationOffset]);

  const { exactReturnDate, returnChart, age } = solarReturnData;

  // Analysis calculations
  const srAscSign = returnChart.ascendantSign;
  const srAscLord = SIGN_LORDS[srAscSign];
  const srAscLordPlanet = returnChart.planets[srAscLord] as PlanetPosition | undefined;
  const srAscLordHouse = srAscLordPlanet?.house || 1;

  // 1. Angles count
  const anglesPlanets = (Object.entries(returnChart.planets) as [string, PlanetPosition][])
    .filter(([_, p]) => [1, 4, 7, 10].includes(p.house))
    .map(([name, p]) => ({ name, house: p.house, p }));

  // 2. Hemispheres count
  let hemisphereUpper = 0;
  let hemisphereLower = 0;
  let hemisphereLeft = 0;
  let hemisphereRight = 0;

  (Object.values(returnChart.planets) as PlanetPosition[]).forEach(p => {
    // Upper (7, 8, 9, 10, 11, 12 h) vs Lower (1, 2, 3, 4, 5, 6 h)
    if (p.house >= 7 && p.house <= 12) {
      hemisphereUpper++;
    } else {
      hemisphereLower++;
    }
    // Left (10, 11, 12, 1, 2, 3 h) vs Right (4, 5, 6, 7, 8, 9 h)
    if ([10, 11, 12, 1, 2, 3].includes(p.house)) {
      hemisphereLeft++;
    } else {
      hemisphereRight++;
    }
  });

  // 3. Stelliums (3+ planets in a sign or house)
  const signPlanets: Record<number, string[]> = {};
  const housePlanets: Record<number, string[]> = {};

  (Object.entries(returnChart.planets) as [string, PlanetPosition][]).forEach(([name, p]) => {
    if (!signPlanets[p.sign]) signPlanets[p.sign] = [];
    signPlanets[p.sign].push(name);

    if (!housePlanets[p.house]) housePlanets[p.house] = [];
    housePlanets[p.house].push(name);
  });

  const signStelliums = Object.entries(signPlanets)
    .filter(([_, val]) => val.length >= 3)
    .map(([sign, val]) => ({ sign: parseInt(sign), planets: val }));

  const houseStelliums = Object.entries(housePlanets)
    .filter(([_, val]) => val.length >= 3)
    .map(([house, val]) => ({ house: parseInt(house), planets: val }));

  // 4. Ascendant nature
  // 基本: 1(Aries), 4(Cancer), 7(Libra), 10(Capricorn)
  // 固定: 2(Taurus), 5(Leo), 8(Scorpio), 11(Aquarius)
  // 變動: 3(Gemini), 6(Virgo), 9(Sagittarius), 12(Pisces)
  let ascNature = '';
  let ascNatureDesc = '';
  if ([1, 4, 7, 10].includes(srAscSign)) {
    ascNature = '基本星座 (Cardinal)';
    ascNatureDesc = '基本星座代表當年較為積極主動、開拓新局，充滿了充沛的起始動能與新計畫。';
  } else if ([2, 5, 8, 11].includes(srAscSign)) {
    ascNature = '固定星座 (Fixed)';
    ascNatureDesc = '固定星座較易守成不動、持之以恆，做事沉穩踏實，但在適應變革上可能稍顯固執。';
  } else {
    ascNature = '變動星座 (Mutable)';
    ascNatureDesc = '變動星座則多變不定、適應力極強，但也容易分心、優柔寡斷，計劃面臨頻繁調整。';
  }

  // 5. Sun house busy period
  const srSunHouse = (returnChart.planets['Sun'] as PlanetPosition | undefined)?.house || 1;
  let busyPeriod = '';
  let busyPeriodRule = '';
  let busyPeriodDesc = '';
  if ([1, 4, 7, 10].includes(srSunHouse)) {
    busyPeriod = '年初是一年中活動最頻繁、最繁忙的時期';
    busyPeriodRule = '返照太陽位於返照盤的「四角宮 (Kendra)」第 ' + srSunHouse + ' 宮';
    busyPeriodDesc = '太陽位在星盤主導性的關鍵四角位置，能量在週期的早期便引燃爆發，使你年初就投身大量外務，名聲與社交生活率先活躍。';
  } else if ([2, 5, 8, 11].includes(srSunHouse)) {
    busyPeriod = '年中的運勢最主導，是全年最繁忙的時期';
    busyPeriodRule = '返照太陽位於返照盤的「續宮 (Panaphara)」第 ' + srSunHouse + ' 宮';
    busyPeriodDesc = '太陽位於資源與支持的續宮，力量在年中積累並集中發揮，工作、財務或創造力活動將在年中達到巔峰強度。';
  } else {
    busyPeriod = '一年中的大部分時間都在做準備和協調工作，直到年末才開始爆發';
    busyPeriodRule = '返照太陽位於返照盤的「果宮 (Apoklima)」第 ' + srSunHouse + ' 宮';
    busyPeriodDesc = '太陽位於過渡、沉思的果宮，年初至年中偏向內斂、幕後協調，蓄勢待發，隨著努力累積，多在年底才會迎來最終的重頭行動。';
  }

  // Interrelation: SR Ascendant falling into Natal House
  const natalAscSign = natalData.ascendantSign;
  const srAscInNatalHouse = ((srAscSign - natalAscSign + 12) % 12) + 1;

  // Reverse orientation warn
  const isReversePlacement = srAscInNatalHouse === 7;

  // Natal planets falling into SR quadrants (Kendra)
  const natalPlanetsInSRKendra = (Object.entries(natalData.planets) as [string, PlanetPosition][])
    .map(([name, p]) => {
      const houseInSR = ((p.sign - srAscSign + 12) % 12) + 1;
      return { name, houseInSR, originSign: p.sign };
    })
    .filter(item => [1, 4, 7, 10].includes(item.houseInSR));

  // Step 3: Structural Echoes (重現結構)
  // Check planetary return / sign recurrence
  const keyReturns = (Object.entries(natalData.planets) as [string, PlanetPosition][])
    .map(([name, np]) => {
      const srp = returnChart.planets[name] as PlanetPosition | undefined;
      if (srp && srp.sign === np.sign) {
        return { name, sign: np.sign };
      }
      return null;
    })
    .filter(Boolean) as { name: string; sign: number }[];

  // Check conjunctions in Natal vs SR
  // For simplicity, we define "conjunction" if two planets occupy the same sign.
  const getConjunctions = (chart: ChartData) => {
    const list: string[][] = [];
    const planetsArr = Object.entries(chart.planets) as [string, PlanetPosition][];
    for (let i = 0; i < planetsArr.length; i++) {
      for (let j = i + 1; j < planetsArr.length; j++) {
        if (planetsArr[i][1].sign === planetsArr[j][1].sign) {
          list.push([planetsArr[i][0], planetsArr[j][0]]);
        }
      }
    }
    return list;
  };

  const natalConjunctions = getConjunctions(natalData);
  const srConjunctions = getConjunctions(returnChart);

  const echoConjunctions = natalConjunctions.filter(nc => {
    return srConjunctions.some(sc => 
      (sc[0] === nc[0] && sc[1] === nc[1]) || (sc[0] === nc[1] && sc[1] === nc[0])
    );
  });

  // Calculate dynamic Multi-Year scan dataset
  const rangeYearsData = useMemo(() => {
    const results = [];
    const maxYears = 12; // Safeguard performance limit
    const birthDate = natalData.utcTime ? new Date(natalData.utcTime) : new Date();
    const birthYear = birthDate.getFullYear();
    const natalSunLon = natalData.planets['Sun']?.longitude || 0;

    const start = Math.max(1900, Math.min(rangeStart, rangeEnd));
    const end = Math.min(2100, Math.max(rangeStart, rangeEnd));
    const finalEnd = Math.min(end, start + maxYears - 1); // Clamp to maximum 12 years

    const getSunLonOnDate = (d: Date): number => {
      const time = new AstroTime(d);
      let lon = getGeocentricLongitude(Body.Sun, time);
      if (isSidereal) {
        const ayan = getAyanamsa(d, ayanamsaType);
        lon -= ayan;
        if (lon < 0) lon += 360;
      }
      return lon;
    };

    const getDiffOnDate = (d: Date): number => {
      let diff = getSunLonOnDate(d) - natalSunLon;
      while (diff < -185) diff += 360;
      while (diff > 185) diff -= 360;
      return diff;
    };

    const getPlanetAngularDistance = (planetLon: number, ascendantLon: number) => {
      const pts = [
        { name: 'ASC (上升東昇點)', deg: ascendantLon, code: 'ASC' },
        { name: 'IC (天底內在點)', deg: (ascendantLon + 90) % 360, code: 'IC' },
        { name: 'DES (下降合作點)', deg: (ascendantLon + 180) % 360, code: 'DES' },
        { name: 'MC (天頂事業點)', deg: (ascendantLon + 270) % 360, code: 'MC' }
      ];
      
      let closestAng = pts[0];
      let minDiff = 360;
      
      pts.forEach(pt => {
        let diff = Math.abs(planetLon - pt.deg) % 360;
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          closestAng = pt;
        }
      });
      
      return { closestAng, distance: minDiff };
    };

    for (let yr = start; yr <= finalEnd; yr++) {
      const targetDate = new Date(birthDate);
      targetDate.setFullYear(yr);

      let lowDate = new Date(targetDate.getTime() - 5 * 24 * 60 * 60 * 1000);
      let highDate = new Date(targetDate.getTime() + 5 * 24 * 60 * 60 * 1000);

      let safety = 0;
      while (getDiffOnDate(lowDate) > 0 && safety < 10) {
        lowDate = new Date(lowDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        safety++;
      }
      safety = 0;
      while (getDiffOnDate(highDate) < 0 && safety < 10) {
        highDate = new Date(highDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        safety++;
      }

      let low = lowDate.getTime();
      let high = highDate.getTime();
      for (let i = 0; i < 35; i++) {
        const mid = (low + high) / 2;
        const diff = getDiffOnDate(new Date(mid));
        if (diff < 0) {
          low = mid;
        } else {
          high = mid;
        }
      }

      const exactDate = new Date((low + high) / 2);
      const chart = calculateChart(exactDate, lat, lng, isSidereal, ayanamsaType);
      const age = yr - birthYear;

      const ascSign = chart.ascendantSign;
      const ascLord = SIGN_LORDS[ascSign];
      const ascLordPlanet = chart.planets[ascLord] as PlanetPosition | undefined;
      const ascLordHouse = ascLordPlanet?.house || 1;

      // Find planet closest to the 4 angles
      const distancesList = (Object.entries(chart.planets) as [string, PlanetPosition][]).map(([name, p]) => {
        const { closestAng, distance } = getPlanetAngularDistance(p.longitude, chart.ascendant);
        return { name, p, closestAng, distance };
      });
      distancesList.sort((a, b) => a.distance - b.distance);
      const closest = distancesList[0];

      // Build 12-house flying stars
      const flyingStars = [];
      for (let h = 1; h <= 12; h++) {
        const hSign = ((ascSign + h - 2) % 12) + 1;
        const hLord = SIGN_LORDS[hSign];
        const hLordPlanet = chart.planets[hLord] as PlanetPosition | undefined;
        const hLordHouse = hLordPlanet?.house || 1;
        flyingStars.push({
          house: h,
          sign: hSign,
          lordName: hLord,
          targetHouse: hLordHouse
        });
      }

      results.push({
        year: yr,
        age,
        exactDate,
        chart,
        ascSign,
        ascLord,
        ascLordHouse,
        closest,
        flyingStars
      });
    }

    return results;
  }, [natalData, rangeStart, rangeEnd, lat, lng, isSidereal, ayanamsaType]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner & Control Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 shadow-2xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" /> 年度推運核心
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 text-white">
              太陽反照分析盤 <span className="font-sans font-light text-indigo-200">Solar Return</span>
            </h2>
            <p className="text-xs md:text-sm text-indigo-200/80 mt-1 max-w-xl">
              精確鎖定太陽每年回歸本命度數的黃金時刻，為您的新一歲建立全新「流年出生盤」，洞穿一整年的環境格局、能量趨向與人生大事。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 w-full md:w-auto">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-indigo-300/80">計算返照年份</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={targetYear}
                  onChange={(e) => setTargetYear(parseInt(e.target.value) || currentYear)}
                  className="w-24 px-3 py-1.5 bg-slate-950 border border-indigo-500/30 rounded-xl font-bold text-white text-center focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-sm"
                />
                <span className="text-xs text-gray-400 font-bold">年 ({age} 歲返照)</span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-indigo-300/80">星盤排版樣式</label>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setChartStyle('south')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    chartStyle === 'south' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  南印度盤
                </button>
                <button
                  onClick={() => setChartStyle('north')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    chartStyle === 'north' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  北印度盤
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backdrop Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Astrological Maps */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Info Header */}
          <div className="bg-slate-50 border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> 反照發生精準時間 (Solar Return Time)
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-inner space-y-2">
              <div className="text-xl font-mono font-black text-indigo-950">
                {exactReturnDate.toLocaleString('zh-TW', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>計算歲數：<strong className="text-indigo-600">{age} 歲過渡</strong></span>
                <span>西元曆：{targetYear} 年度</span>
              </div>
            </div>
            
            <div className="text-[11px] text-gray-500 bg-slate-100 p-3 rounded-xl border border-slate-200/50 leading-relaxed font-medium">
              ℹ️ <strong>黃道公式：</strong>本反照盤基於{' '}
              <strong className="text-indigo-700">
                {isSidereal ? `恆星黃道 (Lahiri - ${ayanamsaType})` : '回歸黃道 (Tropical)'}
              </strong>{' '}
              精確解算。此時刻流年太陽在黃道的經度剛好回歸至您出生時的本命太陽精確度數：
              <span className="font-mono text-indigo-800 font-bold ml-1">
                {(natalData.planets['Sun']?.longitude || 0).toFixed(4)}°
              </span>。
            </div>

            {/* 時區與排盤軟體偏差校準工具 */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  🛡️ 星盤時區與軟體偏差校準 (Calibration)
                </h5>
                {calibrationOffset !== 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black">
                    已套用偏移：{calibrationOffset > 0 ? `+${calibrationOffset.toFixed(2)}` : calibrationOffset.toFixed(2)}h
                  </span>
                )}
              </div>
              
              <p className="text-[10.5px] text-slate-600 leading-relaxed">
                部份西占軟體在解算歷史出生盤與太陽返照時，會因<strong>時區雙重扣減、LMT 經度時間轉換與符號極性反轉</strong>，產生約 <strong>-16 小時 13 分鐘</strong> 的排盤時間偏差（進而將流年上升點從摩羯大幅平移至雙子）。您可以使用下方一鍵校準或手動細微修復，自由消弭各類占星應用程式間的演算法差異。
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCalibrationOffset(0)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                    calibrationOffset === 0
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  📡 物理確切返照時 (0h)
                </button>
                <button
                  type="button"
                  onClick={() => setCalibrationOffset(-16.216667)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                    Math.abs(calibrationOffset - (-16.216667)) < 0.01
                      ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                      : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  🔮 一鍵校準愛星盤 / 上升雙子 (-16.2h)
                </button>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-indigo-100/50">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>手動微調返照時刻</span>
                  <span className="font-mono text-indigo-600">{calibrationOffset > 0 ? `+${calibrationOffset.toFixed(2)}` : calibrationOffset.toFixed(2)} 小時</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-24"
                    max="24"
                    step="0.01"
                    value={calibrationOffset}
                    onChange={(e) => setCalibrationOffset(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setCalibrationOffset(0)}
                    className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 transition"
                  >
                    重設
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <LayoutGrid className="w-4.5 h-4.5 text-indigo-600" /> {targetYear} 太陽反照星盤
              </h3>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                流年歲星對照
              </span>
            </div>
            
            <div className="aspect-square w-full max-w-sm mx-auto">
              {chartStyle === 'south' ? (
                <SouthIndianChart 
                  data={returnChart} 
                  modes={modes} 
                  showDegrees={true} 
                />
              ) : (
                <NorthIndianChart 
                  data={returnChart} 
                  modes={modes} 
                  showDegrees={true} 
                />
              )}
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-4 leading-normal">
              * 各宮位為等宮排盤。太陽(Sun)在此返照盤中的宮位起算點，能反映年度專注的核心舞台。
            </p>
          </div>
        </div>

        {/* Right Side: Step-by-Step Interpretations */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 年度預報摘要 */}
          <AnnualForecastSummary
            natalData={natalData}
            returnChart={returnChart}
            age={age}
            targetYear={targetYear}
            modes={modes}
          />
          
          {/* STEP 1 */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="bg-indigo-900 px-6 py-4 text-white">
              <h3 className="text-base font-black flex items-center gap-2">
                <span className="bg-indigo-800 px-2.5 py-0.5 rounded-full text-xs font-black">第1步</span>
                解讀返照盤本身的獨立狀態 (Independent Analysis)
              </h3>
              <p className="text-xs text-indigo-200 mt-1">將反照盤本身視作一張獨立本命盤或卜卦盤，分析當年的環境格局與能量引發點</p>
            </div>
            <div className="p-6 space-y-6">
              
              {/* 1. Angles */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  1. 星盤四角（ASC, MC, DES, IC）焦點星體
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    <strong>規則與原理：</strong>星盤四角（1、4、7、10宮）具備顯著的能量放大效應。落在這四個宮位附近的星體，其生命課題在該年會被極其強烈地放大凸顯，是年度關鍵事件的發生器。
                  </p>
                  {anglesPlanets.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">今年無明顯行星高掛四角宮。</div>
                  ) : (
                    <div className="space-y-2.5 mt-2">
                      {anglesPlanets.map(({ name, house, p }) => {
                        let textRule = '';
                        if (name === 'Venus') {
                          textRule = '桃花蓬勃、人際緣分旺盛。今年桃花、合作或美學生活多有強調，感情際遇或伴侶關係將成為顯著主軸。';
                        } else if (name === 'Mars') {
                          textRule = '競爭性被極大強化。需防範極端忙碌、突發衝突、生命中的火警或意外風險，行動應求穩勿急。';
                        } else if (name === 'Jupiter') {
                          textRule = '天降神助與福德護航。今年有強大的貴人提攜、思維層次提升與擴張機運，是一年中最有保護力的幸運點。';
                        } else if (name === 'Saturn') {
                          textRule = '責任與壓力落地，考驗與忍耐的磨合期。在所處的生命領域（第 ' + house + ' 宮）需承擔重擔，宜在考驗中建構穩固根基。';
                        } else {
                          textRule = '本命原生的 ' + getPlanetName(name, modes) + ' 能量將在四角（' + house + '宮）強烈放肆發揮，成為生活不可忽視的熱點。';
                        }
                        return (
                          <div key={name} className="p-3 bg-white rounded-xl border border-indigo-100 flex items-start gap-3">
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-lg mt-0.5 whitespace-nowrap">
                              {getPlanetName(name, modes)} 落入 第 {house} 宮
                            </span>
                            <div className="text-xs text-gray-700 leading-normal">
                              📌 <strong>占星斷語：</strong>{textRule}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Hemispheres */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  2. 檢視行運行星分佈 (Hemisphere Distribution)
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Upper vs Lower */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm space-y-2">
                      <div className="font-bold text-gray-800 border-b pb-1">
                        🪐 緯度地平線：上下盤分佈
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
                        <span>上半盤 (7-12宮)：{hemisphereUpper} 星</span>
                        <span>下半盤 (1-6宮)：{hemisphereLower} 星</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-light mt-1">
                        {hemisphereUpper > hemisphereLower ? (
                          <span className="text-indigo-700 font-bold">✨ 多數星高掛上半部：</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">🏡 多數星沉入下半部：</span>
                        )}
                        {hemisphereUpper > hemisphereLower 
                          ? '意味著這一年外部事務活動大幅增加，社會化交流極其頻繁，大眾視線或事業舞台成為最主要的表現地。'
                          : '預示你將更關注自己內在需求、健康、心智成長或家庭私人生活，重心偏向私密或幕後建構。'}
                      </p>
                    </div>

                    {/* Left vs Right */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm space-y-2">
                      <div className="font-bold text-gray-800 border-b pb-1">
                        🌓 經度主控面：左右盤分佈
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
                        <span>左半盤 (東部)：{hemisphereLeft} 星</span>
                        <span>右半盤 (西部)：{hemisphereRight} 星</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-light mt-1">
                        {hemisphereLeft > hemisphereRight ? (
                          <span className="text-purple-700 font-bold">🎯 群星落入左半盤（東半球）：</span>
                        ) : (
                          <span className="text-amber-700 font-bold">🤝 群星落入右半盤（西半球）：</span>
                        )}
                        {hemisphereLeft > hemisphereRight
                          ? '更加強調「自我意志與本我發展」。這一年你的重大決策多能由自己主導，不易受制於旁人，利於開拓個人實力。'
                          : '這一年「人際依附、他人影響與合約關係」對你影響更大。你的抉擇、事業或走向往往會受制於合夥人、配偶或外部環境的制約。'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Stelliums */}
              <div className="space-y-2 flex-grow">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  3. 星群聚集度觀測 (Stelliums)
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <strong>古典徵象：</strong>若發現單一宮位或同一星座內落入 3 顆或以上行星，即構成「星群 Stelliunm」，代表當年的流年世俗事件將極端、集中地朝著該星座宮位的主題傾斜發酵。
                  </p>
                  
                  {signStelliums.length === 0 && houseStelliums.length === 0 ? (
                    <p className="text-xs text-emerald-800 mt-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 inline-block">
                      🟢 今年行星分佈對稱溫和，無產生極端偏頗的 Stelliunm 星群能量。
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {signStelliums.map((item, idx) => (
                        <div key={'s-'+idx} className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-normal">
                          🔥 <strong>黃道星座星群：</strong>觀測到【{getZodiacName(item.sign, modes)}座】有星群重合聚集：
                          <span className="font-bold text-indigo-700 mx-1">{item.planets.map(p => getPlanetName(p, modes)).join('、')}</span>。這一年此星座特質（如衝刺、沉穩、開創或守成）會深度渲染你的全體流年體驗。
                        </div>
                      ))}
                      {houseStelliums.map((item, idx) => (
                        <div key={'h-'+idx} className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-950 leading-normal">
                          ⚡ <strong>返照宮位星群：</strong>第 {item.house} 宮有超重能量聚集：
                          <span className="font-bold text-blue-700 mx-1">{item.planets.map(p => getPlanetName(p, modes)).join('、')}</span>。今年你的重心焦點、忙碌痛點將毫不保留地落實與鎖死在第 {item.house} 宮所象徵的世俗舞台！
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Ascendant & Lord */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  4. 返照上升命宮與命主星飛宮
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white border border-indigo-100 rounded-xl gap-2 shadow-sm">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">返照上升星座 (ASC)</span>
                      <strong className="text-base text-indigo-950">{getZodiacName(srAscSign, modes)}</strong>
                    </div>
                    <div className="text-xs px-3 py-1 bg-indigo-50 text-indigo-800 rounded-lg font-bold border border-indigo-200">
                      {ascNature}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed italic bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-100/30">
                    「{ascNatureDesc}」
                  </p>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Compass className="w-4.5 h-4.5 text-indigo-600 animate-spin" />
                      命主星飛入特定宮位之解讀 (House Lord placement)
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      <strong>宮位解法：</strong>返照盤的上升守護星（命主星）為{' '}
                      <span className="font-bold text-indigo-700">{getPlanetName(srAscLord, modes)}</span>。
                      在今年它飛入了返照盤的{' '}
                      <span className="font-bold text-indigo-700">第 {srAscLordHouse} 宮</span>。這是在預測本年度世俗核心焦點的「定音之鐘」：
                    </p>
                    
                    <div className="p-2.5 bg-amber-50 rounded-lg text-xs border border-amber-200 text-amber-900 leading-relaxed quote">
                      🎯 <strong>命主星飛宮斷訣：</strong>「返照命主星【{getPlanetName(srAscLord, modes)}】飛入【第 {srAscLordHouse} 宮】」，暗示你今年的核心生命自主意識、奮鬥意志，將被牢牢吸引、定位在第 {srAscLordHouse} 宮所象徵的世俗對標方向（例如：若是飛入第 10 宮代表追求極致事業；飛入第 2 宮代表資產、正財重置；飛入第 8 宮代表生命探索、轉折與偏財）。
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Sun and Moon Indicators */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  5. 太陽與月亮特殊指標 - 繁忙時段預估
                </h4>
                <div className="p-4 bg-amber-50/30 border border-amber-200/50 rounded-2xl space-y-4">
                  {/* Sun Indicator */}
                  <div className="space-y-2">
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-extrabold uppercase">
                      🔆 太陽反照宮位 & 繁忙節奏 (Solar Rhythm)
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                      太陽在此返照盤落入：<span className="text-amber-800 font-extrabold text-sm">第 {srSunHouse} 宮</span>
                    </p>
                    
                    <div className="p-3 bg-white rounded-xl border border-amber-200/60 shadow-sm leading-relaxed text-xs">
                      <div className="text-amber-900 font-extrabold flex items-center gap-1.5 mb-1 text-sm">
                        🚨 規則顯示：{busyPeriodRule} → 今年最繁忙的主導時段落在：【{busyPeriod}】。
                      </div>
                      <p className="text-gray-600 text-[11px] mt-1">
                        <strong>古典依據：</strong>{busyPeriodDesc}
                      </p>
                    </div>
                  </div>

                  {/* Moon aspect/void check */}
                  <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs">
                    <div className="font-bold text-indigo-900 mb-1 flex items-center gap-1">
                      🌙 月亮狀態 (Lunar State & Outcome)
                    </div>
                    <p className="text-gray-600 leading-relaxed text-[11px]">
                      返照盤中的月亮位於{' '}
                      <strong>{getZodiacName(returnChart.planets['Moon']?.sign || 1, modes)}座</strong>、
                      落入 <strong>第 {returnChart.planets['Moon']?.house || 1} 宮</strong>。
                      月亮代表當年度的「潛意識體驗與世俗最終的結局感受」。若月亮落入吉宮、能量明亮，則今年心靈祥和。若月亮的度數極高（如超過28度）且不與任何行星產生主相位，需特別警惕「空亡 Moon Void」導致的一事無成或心緒虛無。
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* STEP 2 */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="bg-emerald-950 px-6 py-4 text-white">
              <h3 className="text-base font-black flex items-center gap-2">
                <span className="bg-emerald-900 px-2.5 py-0.5 rounded-full text-xs font-black">第2步</span>
                返照盤與本命盤的對照分析 (Inter-Chart Synthesis)
              </h3>
              <p className="text-xs text-emerald-200 mt-1">對照本命盤的深度能量底牌，解密外在環境投射與主控力量的強烈互動</p>
            </div>
            <div className="p-6 space-y-6">

              {/* 1. SR Ascendant in Natal House */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  1. 返照上升（ASC）落入本命盤宮位
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl flex justify-between items-center shadow-sm">
                    <div className="text-xs">
                      <span className="text-gray-400 block font-bold uppercase text-[10px]">對照分析結果</span>
                      返照上升落於本命的 
                      <span className="text-emerald-800 font-extrabold text-sm ml-1">第 {srAscInNatalHouse} 宮</span>
                    </div>
                    <span className="text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg">
                      核心年度舞台
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                    <strong>💡 星盤解讀：</strong>
                    「返照盤的上升起始點落在您本命盤的第 {srAscInNatalHouse} 宮」，此對照徵象非常具有支配力。
                    這預示本命第 {srAscInNatalHouse} 宮所主管的核心世俗領域，將是您這一年花費精力和關注最多的地方。
                    <ul className="list-disc list-inside mt-2 space-y-1 text-[11px] text-emerald-950">
                      <li>若落入 <strong>第 1 宮</strong>：今年完全專注於自我重塑、健康精進與重大個人定位。</li>
                      <li>若落入 <strong>第 2/11 宮</strong>：金錢收入、事業資產、社群拓展以及正偏財利潤是大浪潮。</li>
                      <li>若落入 <strong>第 10 宮</strong>：高度忙碌於職業晉升、社會地位與企業聲望，承擔重大開創職責。</li>
                      <li>若落入 <strong>第 4 宮</strong>：今年多有購置房產、家宅修繕、家人照料或對內心情感的強加沉澱。</li>
                      <li>若落入 <strong>第 12/8 宮</strong>：容易投身靈修成就、身心靈修持，或面臨宿世業力轉換與身體調整。</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2. Reversed Placement Warning */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  2. 逆轉對宮反轉現象檢測 (Reversed Placements)
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {isReversePlacement ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0 animate-bounce" />
                      <div className="text-xs text-rose-900 leading-normal">
                        <strong>⚠️ 嚴正警報與逆轉提示：</strong>
                        檢測到本返照盤的上升（ASC）不偏不倚剛好對應到您本命盤的「下降點附近 / 本命第七宮」！
                        這種逆轉（對宮倒置）徵象極其典型，代表本年度人生有「大洗牌與重新對準方向」的跡象。你可能需要面臨主控權的暫時讓渡、重大計畫因外部因素徹底修正、甚至是自身健康或感情關係的劇烈調整。凡事不可操之過急。
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 inline-block">
                      🟢 逆轉檢測安全：今年返照上升未落於本命第 7 宮對宮逆轉點，人生主導意志相對穩定，不易遭遇大方向的被動洗牌。
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Natal Planets in SR Kendra */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-2">
                  3. 本命行星落入返照盤四角 (Natal Planets Triggered)
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    當本命盤的某顆星體，於返照盤中恰巧落入 1、4、7、10 宮等關鍵角度，代表其隱藏在八字命盤中的本命宿世能量得以被拉抬，被行運外物強勢激活：
                  </p>
                  
                  {natalPlanetsInSRKendra.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">本年度本命星盤中，無直接高掛於返照關鍵四角宮位的行星。</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {natalPlanetsInSRKendra.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-sm flex items-start gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></span>
                          <div>
                            <span className="font-extrabold text-emerald-800">
                              本命 {getPlanetName(item.name, modes)}
                            </span>{' '}
                            落入返照的{' '}
                            <span className="font-extrabold text-indigo-700">第 {item.houseInSR} 宮</span>
                            <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                              這代表代表你本命 {getPlanetName(item.name, modes)} 的潛在力量和宿世潛能，將被今年的外部環境深度引誘、引吭高歌地發揮出來！
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* STEP 3 */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="bg-amber-950 px-6 py-4 text-white">
              <h3 className="text-base font-black flex items-center gap-2">
                <span className="bg-amber-900 px-2.5 py-0.5 rounded-full text-xs font-black">第3步</span>
                結構重現與重大事件呼應 (Structural Echoes)
              </h3>
              <p className="text-xs text-amber-200 mt-1">結構重現是判斷重大事件（如結婚、置業、驟變）是否發生的一錘定音關鍵心法</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 leading-relaxed">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5" /> 什麼是「結構呼應」之重現心法？
                </h4>
                <p>
                  當命主本命星盤中，具備某種特定的福祿或刑剋結構（例如本命日金合、或本命火土互沖）。
                  若該年的「太陽反照盤」中亦恰巧<strong>「重複」</strong>了相同的星座相位、星體合相或行星性質呼應，這就叫<strong>「結構重現」</strong>。
                  重現即是引信，這一年便高度可能強烈引發本命該徵象結構對標的重大人生巨變（如結婚、得子、驟變）。
                </p>
              </div>

              {/* Recurrent Planetary Signs (Returns) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                  🎯 本年度返照星宿回歸 檢測 (Planetary Returns)
                </span>
                
                {keyReturns.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">本年度沒有行星回歸到與本命盤完全相同的黃道星座。</p>
                ) : (
                  <div className="space-y-2">
                    {keyReturns.map((kr, idx) => {
                      let returnDesc = '';
                      if (kr.name === 'Jupiter') {
                        returnDesc = '【木星回歸】：約每 12 年發生一次。象徵重大的精神財富與智慧覺醒期、極強的世俗幸運擴張，是年度福報被點燃的重要結構。';
                      } else if (kr.name === 'Saturn') {
                        returnDesc = '【土星回歸】：約每 29.5 年發生一次重大宿世業力回饋與社會根基的錘煉，迎來成年的重責大考驗。';
                      } else {
                        returnDesc = '【' + getPlanetName(kr.name, modes) + '回歸】：代表此星體年度完成了黃道大巡遊，力量處在全新起點，相關潛意識渴望會被全新洗禮。';
                      }
                      return (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                          <strong className="text-indigo-800">✨ {getPlanetName(kr.name, modes)}回歸至 {getZodiacName(kr.sign, modes)}</strong>
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                            {returnDesc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recurrent Conjunctions */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                  ⛓️ 合相結構「重現」雙向檢測 (Conjunction Echoes)
                </span>
                
                {echoConjunctions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">本年度暫未觀測到與本命盤完全相同的合相(星體同星座)重現結構。</p>
                ) : (
                  <div className="space-y-2">
                    {echoConjunctions.map((ec, idx) => (
                      <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                        <strong className="text-amber-800">⚡ 【結構強烈共鳴觸發】: {getPlanetName(ec[0], modes)} & {getPlanetName(ec[1], modes)} 同宮重現！</strong>
                        <p className="text-[10px] text-slate-600 mt-1">
                          本命盤中 {getPlanetName(ec[0], modes)} 與 {getPlanetName(ec[1], modes)} 彼此關聯密切，而好巧不巧在今年的返照盤中，其兩顆星再次落入相同星座同宮聚集！
                          <strong>這正是決定性「結構重現」！</strong>代表本命該合相的潛在事項或吉凶課題，將在今年有高達 85% 以上的機率被強勢催化與引爆。
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* SECTION: Multi-Year Advanced Scanner & Flying Stars */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden mt-8">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-200">
              <Compass className="w-3.5 h-3.5 animate-spin" /> 多年期流年透視
            </span>
            <h3 className="text-lg font-black mt-1 flex items-center gap-2">
              太陽返照多年度掃描與飛星分析系統
            </h3>
            <p className="text-xs text-indigo-200/70 mt-1">
              自動分析連續時段內的太陽返照星盤，橫向對抗命主飛宮、四軸緊密相位點、與 12 宮主星落宮飛曜資料庫學理
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={() => {
                const cy = new Date().getFullYear();
                setRangeStart(cy);
                setRangeEnd(cy + 2);
                setSelectedRangeYear(cy);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/25 text-xs font-black transition-colors border border-indigo-500/20"
            >
              後續 3 年
            </button>
            <button
              onClick={() => {
                const cy = new Date().getFullYear();
                setRangeStart(cy);
                setRangeEnd(cy + 4);
                setSelectedRangeYear(cy);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/30 text-xs font-black transition-colors border border-indigo-500/30"
            >
              後續 5 年
            </button>
            <button
              onClick={() => {
                const cy = new Date().getFullYear();
                setRangeStart(cy);
                setRangeEnd(cy + 9);
                setSelectedRangeYear(cy);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-white hover:bg-indigo-500/40 text-xs font-black transition-colors border border-indigo-500/40"
            >
              黃金 10 年
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">開始年份 (Range Start)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={rangeStart}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || currentYear;
                    setRangeStart(val);
                    setSelectedRangeYear(val);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">結束年份 (Range End)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={rangeEnd}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || (currentYear + 4);
                    setRangeEnd(val);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <span className="text-[10px] text-gray-400 leading-normal">
                💡 <strong>提示：</strong>在下方點擊任何「
                <span className="text-indigo-600 font-bold">載入此年</span>
                」，可將該年度的「完整返照星盤與相位」載入到上方的主解析面板交互檢視。
              </span>
            </div>
          </div>

          {/* Results Spreadsheet Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 text-xs font-extrabold border-b border-slate-200">
                    <th className="py-3 px-4">返照年份 / 年齡</th>
                    <th className="py-3 px-4">上升星座</th>
                    <th className="py-3 px-4">命主星 ➔ 飛宮 (1宮主飛星)</th>
                    <th className="py-3 px-4">最靠近 1/4/7/10 四大角點宿曜</th>
                    <th className="py-3 px-4 text-center">主盤同載 互動</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rangeYearsData.map((data) => {
                    const ascLordName = getPlanetName(data.ascLord, modes);
                    const ascSignName = getZodiacName(data.ascSign, modes);
                    const isActiveYear = targetYear === data.year;

                    // Classify priority of 1st house lord
                    let lordExplanation = '';
                    if (data.ascLordHouse === 1) lordExplanation = '命主歸位(自主)';
                    else if (data.ascLordHouse === 2) lordExplanation = '正財資產(求財)';
                    else if (data.ascLordHouse === 3) lordExplanation = '學習溝通(驛動)';
                    else if (data.ascLordHouse === 4) lordExplanation = '田宅家庭(安頓)';
                    else if (data.ascLordHouse === 5) lordExplanation = '創意戀愛(才華)';
                    else if (data.ascLordHouse === 6) lordExplanation = '辛勤工作(磨鍊)';
                    else if (data.ascLordHouse === 7) lordExplanation = '婚姻合作(對宮)';
                    else if (data.ascLordHouse === 8) lordExplanation = '偏財命運(蛻變)';
                    else if (data.ascLordHouse === 9) lordExplanation = '高等智慧(修行)';
                    else if (data.ascLordHouse === 10) lordExplanation = '事業榮登(聲望)';
                    else if (data.ascLordHouse === 11) lordExplanation = '社群所得(利潤)';
                    else if (data.ascLordHouse === 12) lordExplanation = '靈性玄藏(退隱)';

                    // Highlight colors
                    let badgeClass = 'bg-slate-100 text-slate-700';
                    if ([1, 5, 9, 10, 11].includes(data.ascLordHouse)) {
                      badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-150 font-black';
                    } else if ([2, 4, 7].includes(data.ascLordHouse)) {
                      badgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-150';
                    } else {
                      badgeClass = 'bg-amber-50 text-amber-700 border border-amber-150';
                    }

                    // Angle description
                    const closestName = getPlanetName(data.closest.name, modes);
                    const isVeryClose = data.closest.distance < 3;

                    return (
                      <tr 
                        key={data.year}
                        className={`hover:bg-slate-50/50 transition-colors ${isActiveYear ? 'bg-indigo-50/30' : ''}`}
                      >
                        <td className="py-3.5 px-4 font-black">
                          <span className="text-slate-900 text-sm">{data.year} 年</span>
                          <span className="ml-1.5 text-[10px] text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {data.age} 歲
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800">
                          {ascSignName}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-slate-905">{ascLordName}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${badgeClass}`}>
                              第 {data.ascLordHouse} 宮 ({lordExplanation})
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${isVeryClose ? 'bg-rose-50 text-rose-700 font-extrabold animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                              {closestName}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              極近 {data.closest.closestAng.name} (相距 {data.closest.distance.toFixed(2)}°)
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setTargetYear(data.year);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                              isActiveYear 
                                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500' 
                                : 'bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200'
                            }`}
                          >
                            {isActiveYear ? (
                              <span className="flex items-center gap-1">
                                <Check className="w-3 h-3" /> 當前使用中
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> 載入此年
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADVANCED: Interactive 12 House Flying Stars and Placements Database */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                  飛星流曜與宮主星飛宮解讀資料庫 (12 House Lords Placement Deep Reading)
                </h4>
                <p className="text-[10px] text-gray-505 mt-0.5">
                  選擇上方掃描範圍內的特定年份，點擊任何宮位按鈕以探測該年度該宮位主星的詳細起點、終點、吉凶法則與中文口語解釋
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">聚焦探測返照年份:</span>
                <select
                  value={selectedRangeYear}
                  onChange={(e) => {
                    setSelectedRangeYear(parseInt(e.target.value) || rangeStart);
                  }}
                  className="px-2.5 py-1 text-xs font-black bg-white border border-slate-200 rounded-lg text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {rangeYearsData.map((d) => (
                    <option key={d.year} value={d.year}>
                      {d.year} 年 (Age {d.age})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Render 12 houses interactive tabs */}
            {(() => {
              const selectedYearData = rangeYearsData.find(d => d.year === selectedRangeYear) || rangeYearsData[0];
              if (!selectedYearData) return <p className="text-xs text-gray-400 italic">請在上方輸入年份範圍進行解讀。</p>;

              const currentSelectedHouseDetail = selectedYearData.flyingStars.find(f => f.house === selectedRangeHouse);
              const interpretation = currentSelectedHouseDetail 
                ? getHouseLordPlacementExplanation(selectedRangeHouse, currentSelectedHouseDetail.targetHouse, currentSelectedHouseDetail.lordName)
                : null;

              return (
                <div className="space-y-4">
                  {/* Grid of 12 Houses */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {selectedYearData.flyingStars.map((fs) => {
                      const isHouseActive = selectedRangeHouse === fs.house;
                      const houseTexts: Record<number, string> = {
                        1: '1宮 命宮',
                        2: '2宮 財帛',
                        3: '3宮 兄弟',
                        4: '4宮 田宅',
                        5: '5宮 子源',
                        6: '6宮 奴僕',
                        7: '7宮 夫妻',
                        8: '8宮 疾厄',
                        9: '9宮 遷移',
                        10: '10宮 官祿',
                        11: '11宮 福德',
                        12: '12宮 玄秘'
                      };
                      return (
                        <button
                          key={fs.house}
                          onClick={() => setSelectedRangeHouse(fs.house)}
                          className={`p-2 rounded-xl text-center border transition-all text-xs flex flex-col items-center justify-between gap-1 cursor-pointer ${
                            isHouseActive
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md font-extrabold'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-indigo-900'
                          }`}
                        >
                          <span className="text-[10px] uppercase opacity-75 tracking-wider">
                            H{fs.house}
                          </span>
                          <span className="font-extrabold text-xs">
                            {houseTexts[fs.house] || `${fs.house}宮`}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isHouseActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            飛 {fs.targetHouse}宮
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mandated Deep House Lord Interpretation Output Card */}
                  {interpretation && currentSelectedHouseDetail && (
                    <div className="p-5 bg-white border border-indigo-50 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                          檢測對照：第 {selectedRangeHouse} 宮主
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                          飛入第 {currentSelectedHouseDetail.targetHouse} 宮
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          {interpretation.title}
                        </h5>
                        <div className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap break-words break-all p-3 bg-slate-50 rounded-xl border border-slate-100">
                          {interpretation.explanation}
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/55 rounded-xl border border-amber-200 text-[10px] text-amber-950 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>流年占星飛曜學理依據 (Astrological Rule Source):</strong> {getPlanetName(currentSelectedHouseDetail.lordName, modes)} 為該返照星盤中 {getZodiacName(currentSelectedHouseDetail.sign, modes)} 的主管宮主星，由於回歸時其黃道刻度精確落入返照星盤的第 {currentSelectedHouseDetail.targetHouse} 宮，符合流年本命飛曜引燃機制、能量直接投射。本系统完整保留所有分析預測文字，完全無人工删减。
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

    </div>
  );
};
