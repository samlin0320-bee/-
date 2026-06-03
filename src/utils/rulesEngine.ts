import { ChartData, PlanetPosition, getPlanetName } from './astrology';

export interface RuleResult {
  name: string;
  description: string;
  isFormed: boolean;
  strength?: number;
}

export const ASCENDANT_PROPERTIES: Record<number, {
  benefics: string[];
  malefics: string[];
  yogaKaraka: string[];
  marakas: string[];
  neutral: string[];
}> = {
  1: { // Aries
    benefics: ['Sun', 'Jupiter'],
    malefics: ['Mercury', 'Venus', 'Saturn'],
    yogaKaraka: [],
    marakas: ['Venus', 'Mercury'],
    neutral: ['Moon', 'Mars']
  },
  2: { // Taurus
    benefics: ['Saturn', 'Mercury', 'Sun'],
    malefics: ['Jupiter', 'Moon', 'Venus'],
    yogaKaraka: ['Saturn'],
    marakas: ['Jupiter', 'Venus', 'Moon'],
    neutral: ['Mars']
  },
  3: { // Gemini
    benefics: ['Venus'],
    malefics: ['Mars', 'Jupiter', 'Sun'],
    yogaKaraka: [],
    marakas: ['Mars', 'Jupiter'],
    neutral: ['Mercury', 'Moon', 'Saturn']
  },
  4: { // Cancer
    benefics: ['Jupiter', 'Mars'],
    malefics: ['Venus', 'Mercury'],
    yogaKaraka: ['Mars'],
    marakas: ['Venus', 'Mercury'],
    neutral: ['Moon', 'Sun', 'Saturn']
  },
  5: { // Leo
    benefics: ['Mars', 'Jupiter'],
    malefics: ['Mercury', 'Venus'],
    yogaKaraka: ['Mars'],
    marakas: ['Venus', 'Mercury'],
    neutral: ['Sun', 'Moon', 'Saturn']
  },
  6: { // Virgo
    benefics: ['Venus', 'Mercury'],
    malefics: ['Mars', 'Jupiter', 'Moon'],
    yogaKaraka: [],
    marakas: ['Mars', 'Jupiter'],
    neutral: ['Sun', 'Saturn']
  },
  7: { // Libra
    benefics: ['Saturn', 'Mercury', 'Venus'],
    malefics: ['Sun', 'Jupiter', 'Mars'],
    yogaKaraka: ['Saturn'],
    marakas: ['Jupiter', 'Sun', 'Mars'],
    neutral: ['Moon']
  },
  8: { // Scorpio
    benefics: ['Moon', 'Jupiter', 'Sun'],
    malefics: ['Mercury', 'Venus', 'Saturn'],
    yogaKaraka: [],
    marakas: ['Venus', 'Mercury'],
    neutral: ['Mars']
  },
  9: { // Sagittarius
    benefics: ['Sun', 'Mars'],
    malefics: ['Venus', 'Mercury', 'Saturn'],
    yogaKaraka: [],
    marakas: ['Venus', 'Mercury'],
    neutral: ['Jupiter', 'Moon']
  },
  10: { // Capricorn
    benefics: ['Venus', 'Mercury', 'Saturn'],
    malefics: ['Mars', 'Jupiter', 'Moon'],
    yogaKaraka: ['Venus'],
    marakas: ['Mars', 'Jupiter'],
    neutral: ['Sun']
  },
  11: { // Aquarius
    benefics: ['Venus', 'Mars', 'Saturn'],
    malefics: ['Jupiter', 'Moon', 'Sun'],
    yogaKaraka: ['Venus'],
    marakas: ['Jupiter', 'Moon'],
    neutral: ['Mercury']
  },
  12: { // Pisces
    benefics: ['Moon', 'Mars'],
    malefics: ['Sun', 'Venus', 'Mercury', 'Saturn'],
    yogaKaraka: [],
    marakas: ['Venus', 'Mercury', 'Sun'],
    neutral: ['Jupiter']
  }
};

export const KAKSHYA_LORDS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Ascendant'];

export const getKakshyaLord = (longitude: number): string => {
  const degreeInSign = longitude % 30;
  const kakshyaIndex = Math.floor(degreeInSign / 3.75);
  return KAKSHYA_LORDS[kakshyaIndex];
};

export const checkSadeSati = (natalMoonSign: number, transitSaturnSign: number): { isSadeSati: boolean; phase: string } => {
  const diff = (transitSaturnSign - natalMoonSign + 12) % 12;
  if (diff === 11) return { isSadeSati: true, phase: '第一階段 (12宮)' };
  if (diff === 0) return { isSadeSati: true, phase: '第二階段 (1宮)' };
  if (diff === 1) return { isSadeSati: true, phase: '第三階段 (2宮)' };
  return { isSadeSati: false, phase: '' };
};

export const checkPanchaMahapurushaYogas = (data: ChartData): RuleResult[] => {
  const results: RuleResult[] = [];
  const planets = data.planets;
  const kendras = [1, 4, 7, 10];

  // Bhadra Yoga (Mercury)
  if (planets['Mercury']) {
    const p = planets['Mercury'];
    if (kendras.includes(p.house) && (p.dignity === 'Exalted' || p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona')) {
      results.push({
        name: '水星得地格 (Bhadra Yoga)',
        description: '水星入四正宮且得地（本垣、根垣或躍升）。主聰明絕頂、口才佳、壽命長、富貴。',
        isFormed: true
      });
    }
  }

  // Malavya Yoga (Venus)
  if (planets['Venus']) {
    const p = planets['Venus'];
    if (kendras.includes(p.house) && (p.dignity === 'Exalted' || p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona')) {
      results.push({
        name: '金星得地格 (Malavya Yoga)',
        description: '金星入四正宮且得地。主容貌姣好、具藝術才華、婚姻美滿、享受物質生活。',
        isFormed: true
      });
    }
  }

  // Ruchaka Yoga (Mars)
  if (planets['Mars']) {
    const p = planets['Mars'];
    if (kendras.includes(p.house) && (p.dignity === 'Exalted' || p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona')) {
      results.push({
        name: '火星得地格 (Ruchaka Yoga)',
        description: '火星入四正宮且得地。主勇敢、具領導力、軍警將才、能克服敵人。',
        isFormed: true
      });
    }
  }

  // Hamsa Yoga (Jupiter)
  if (planets['Jupiter']) {
    const p = planets['Jupiter'];
    if (kendras.includes(p.house) && (p.dignity === 'Exalted' || p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona')) {
      results.push({
        name: '木星得地格 (Hamsa Yoga)',
        description: '木星入四正宮且得地。主受人尊敬、具高尚道德、智慧深廣、生活富足。',
        isFormed: true
      });
    }
  }

  // Sasa Yoga (Saturn)
  if (planets['Saturn']) {
    const p = planets['Saturn'];
    if (kendras.includes(p.house) && (p.dignity === 'Exalted' || p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona')) {
      results.push({
        name: '土星得地格 (Sasa Yoga)',
        description: '土星入四正宮且得地。主堅忍不拔、具群眾魅力、可能成為地方領袖或政治家。',
        isFormed: true
      });
    }
  }

  return results;
};

// Jaimini Aspect Logic
const isJaiminiAspect = (sign1: number, sign2: number): boolean => {
  const isMovable1 = [1, 4, 7, 10].includes(sign1);
  const isFixed1 = [2, 5, 8, 11].includes(sign1);
  const isDual1 = [3, 6, 9, 12].includes(sign1);

  const isMovable2 = [1, 4, 7, 10].includes(sign2);
  const isFixed2 = [2, 5, 8, 11].includes(sign2);
  const isDual2 = [3, 6, 9, 12].includes(sign2);

  if (isMovable1 && isFixed2) {
    // Movable aspects all Fixed except the adjacent forward one
    const adjacentForward = (sign1 % 12) + 1;
    return sign2 !== adjacentForward;
  }
  if (isFixed1 && isMovable2) {
    // Fixed aspects all Movable except the adjacent backward one
    const adjacentBackward = sign1 === 1 ? 12 : sign1 - 1;
    return sign2 !== adjacentBackward;
  }
  if (isDual1 && isDual2) {
    // Dual aspects all other Dual signs
    return sign1 !== sign2;
  }
  return false;
};

export const checkJaiminiYogas = (data: ChartData): RuleResult[] => {
  const results: RuleResult[] = [];
  const planets = data.planets;
  
  // Find Karakas
  let ak = '', amk = '', pk = '', dk = '';
  Object.values(planets).forEach(p => {
    if (p.jaiminiKaraka === 'AK') ak = p.name;
    if (p.jaiminiKaraka === 'AMK') amk = p.name;
    if (p.jaiminiKaraka === 'PK') pk = p.name;
    if (p.jaiminiKaraka === 'DK') dk = p.name;
  });

  const lord5 = data.houses[4].lord;

  // Helper to check connection (conjunction or Jaimini aspect)
  const isConnected = (p1: string, p2: string) => {
    if (!p1 || !p2 || !planets[p1] || !planets[p2]) return false;
    const sign1 = planets[p1].sign;
    const sign2 = planets[p2].sign;
    return sign1 === sign2 || isJaiminiAspect(sign1, sign2);
  };

  // 1. Jaimini Raj Yogas
  let rajYogaCount = 0;
  const rajPairs = [
    [ak, amk], [ak, pk], [ak, dk], [ak, lord5],
    [amk, pk], [amk, dk], [amk, lord5],
    [pk, dk], [pk, lord5], [dk, lord5]
  ];

  rajPairs.forEach(([p1, p2]) => {
    if (isConnected(p1, p2)) rajYogaCount++;
  });

  if (rajYogaCount > 0) {
    results.push({
      name: '賈米尼貴格 (Jaimini Raj Yoga)',
      description: `AK, AMK, PK, DK 或 5宮主之間產生了 ${rajYogaCount} 組交感。主帶來權力、晉升與社會地位。`,
      isFormed: true
    });
  }

  // 2. Moon + Venus Raj Yoga
  if (isConnected('Moon', 'Venus')) {
    results.push({
      name: '太陰金星貴格 (Moon-Venus Raj Yoga)',
      description: '月亮與金星同宮或互相交感，形成強大的貴格，主富貴與名望。',
      isFormed: true
    });
  }

  return results;
};

export const checkDhanaYogas = (data: ChartData): RuleResult[] => {
  const results: RuleResult[] = [];
  const planets = data.planets;
  const houses = data.houses;

  // 1. 2nd Lord in 11th or 11th Lord in 2nd
  const lord2 = houses[1].lord;
  const lord11 = houses[10].lord;
  if (planets[lord2]?.house === 11 || planets[lord11]?.house === 2) {
    results.push({
      name: 'Dhana Yoga (2-11)',
      description: '2宮主入11宮或11宮主入2宮：財帛與事業財聯動，巨富之兆。',
      isFormed: true
    });
  }

  // 2. 1st, 2nd, 5th, 9th, 11th Lords connection
  const dhanaLords = [houses[0].lord, houses[1].lord, houses[4].lord, houses[8].lord, houses[10].lord];
  let connections = 0;
  dhanaLords.forEach(l1 => {
    dhanaLords.forEach(l2 => {
      if (l1 === l2) return;
      if (planets[l1]?.house === planets[l2]?.house) connections++;
    });
  });

  if (connections >= 2) {
    results.push({
      name: 'Multiple Dhana Connections',
      description: '多個財宮主星（1, 2, 5, 9, 11）互相交感，財運亨通。',
      isFormed: true
    });
  }

  // 3. Specific Ascendant Rules from PDF 4
  const ascSign = data.ascendantSign;
  
  // Taurus (2)
  if (ascSign === 2) {
    if (planets['Mercury']?.sign === 2 && planets['Moon']?.house === 7 && planets['Mars']?.house === 7) {
      results.push({
        name: 'Taurus Wealth Yoga',
        description: '酉命水守本垣，月火衝照：金命財格。',
        isFormed: true
      });
    }
  }

  return results;
};

export const checkGeneralYogas = (data: ChartData): RuleResult[] => {
  const results: RuleResult[] = [];
  const planets = data.planets;
  const houses = data.houses;

  // Helper to get planets in a specific sign
  const getPlanetsInSign = (sign: number): string[] => {
    return Object.values(planets).filter(p => p.sign === sign).map(p => p.name);
  };

  // BudhaAditya
  if (planets['Sun']?.sign === planets['Mercury']?.sign) {
    results.push({
      name: '日水瑜伽 (BudhaAditya)',
      description: '太阳与水星同宫。思维清晰、表达突出，学习与名望机会较多。',
      isFormed: true
    });
  }

  // Sunapha
  if (planets['Moon']) {
    const moon2ndSign = (planets['Moon'].sign % 12) + 1;
    const planetsInMoon2nd = getPlanetsInSign(moon2ndSign).filter(p => p !== 'Sun' && p !== 'Rahu' && p !== 'Ketu');
    if (planetsInMoon2nd.length > 0) {
      results.push({
        name: '苏那法瑜伽 (Sunapha)',
        description: '除太阳外有行星位于月亮2宫。聪慧、有资源整合能力，常带来名望与财富机会。',
        isFormed: true
      });
    }
  }

  // Veshi, Voshi, Ubhayachari
  if (planets['Sun']) {
    const sun2ndSign = (planets['Sun'].sign % 12) + 1;
    const sun12thSign = planets['Sun'].sign === 1 ? 12 : planets['Sun'].sign - 1;
    
    const planetsInSun2nd = getPlanetsInSign(sun2ndSign).filter(p => p !== 'Moon' && p !== 'Rahu' && p !== 'Ketu');
    const planetsInSun12th = getPlanetsInSign(sun12thSign).filter(p => p !== 'Moon' && p !== 'Rahu' && p !== 'Ketu');

    if (planetsInSun2nd.length > 0 && planetsInSun12th.length > 0) {
      results.push({
        name: '乌巴亚查里瑜伽 (Ubhayachari)',
        description: '除月亮外有行星同时位于太阳2宫与12宫。兼具进取与审慎，较能在资源与机会间取得平衡。',
        isFormed: true
      });
    } else if (planetsInSun2nd.length > 0) {
      results.push({
        name: '维希瑜伽 (Veshi)',
        description: '除月亮外有行星位于太阳2宫。目标意识与执行度较高，重视现实成果。',
        isFormed: true
      });
    } else if (planetsInSun12th.length > 0) {
      results.push({
        name: '沃希瑜伽 (Voshi)',
        description: '除月亮外有行星位于太阳12宫。偏内敛与自省，适合幕后深耕与长期规划。',
        isFormed: true
      });
    }
  }

  // Yogakaraka
  const ascSign = data.ascendantSign;
  const ascProps = ASCENDANT_PROPERTIES[ascSign];
  if (ascProps && ascProps.yogaKaraka.length > 0) {
    results.push({
      name: '瑜伽卡拉卡 (Yogakaraka)',
      description: `同一行星同时主宰角宫与三角宫 (${ascProps.yogaKaraka.join(', ')})。关键主星具综合增益，做事更易形成结果。`,
      isFormed: true
    });
  }

  // RajaYogaGeneric
  const kendraLords = [houses[0].lord, houses[3].lord, houses[6].lord, houses[9].lord];
  const trikonaLords = [houses[0].lord, houses[4].lord, houses[8].lord];
  let rajaYogaFormed = false;
  
  for (const kl of kendraLords) {
    for (const tl of trikonaLords) {
      if (kl !== tl && planets[kl]?.sign === planets[tl]?.sign) {
        rajaYogaFormed = true;
        break;
      }
    }
    if (rajaYogaFormed) break;
  }

  if (rajaYogaFormed) {
    results.push({
      name: '王瑜伽 泛化 (RajaYogaGeneric)',
      description: '角宫主与三角宫主同宫。责任感与上进心较强，容易在事业路径上取得阶段性成就。',
      isFormed: true
    });
  }

  // Pasha
  const sevenPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const occupiedSigns = new Set(sevenPlanets.map(p => planets[p]?.sign).filter(s => s !== undefined));
  if (occupiedSigns.size === 5) {
    results.push({
      name: '帕沙瑜伽 (Pasha)',
      description: '七主星分布在5个星座。社交与关系网络活跃，易承担更多人事牵連。',
      isFormed: true
    });
  }

  // Mala
  const benefics = ['Jupiter', 'Venus', 'Mercury', 'Moon']; 
  let beneficsInKendra = true;
  for (const b of benefics) {
    if (planets[b] && ![1, 4, 7, 10].includes(planets[b].house)) {
      beneficsInKendra = false;
      break;
    }
  }
  if (beneficsInKendra) {
    results.push({
      name: '玛拉瑜伽 (Mala)',
      description: '吉星集中在角宫。整体偏吉，生活舒适度与支持度较高。',
      isFormed: true
    });
  }

  return results;
};

export interface TransitInterpretation {
  category: string;
  rule: string;
  result: string;
  isPositive: boolean;
  priority: number;
}

export const getTransitInterpretations = (natalData: ChartData, transitData: ChartData, modes: string[] = ['zh']): TransitInterpretation[] => {
  const interpretations: TransitInterpretation[] = [];
  const natalPlanets = natalData.planets;
  const transitPlanets = transitData.planets;
  const natalAsc = natalData.ascendantSign;
  const natalHouses = natalData.houses;
  const natalMoonSign = natalPlanets['Moon']?.sign;

  const checkAspect = (transitSign: number, targetSign: number, planet: string): boolean => {
    const diff = (targetSign - transitSign + 12) % 12;
    if (diff === 0) return true; // Conjunction
    const aspectMap: Record<string, number[]> = {
      Jupiter: [4, 6, 8], // 5, 7, 9
      Rahu: [4, 6, 8],
      Ketu: [4, 6, 8],
      Saturn: [2, 6, 9], // 3, 7, 10
      Mars: [3, 6, 7],   // 4, 7, 8
      Sun: [6],
      Moon: [6],
      Mercury: [6],
      Venus: [6]
    };
    return (aspectMap[planet] || [6]).includes(diff);
  };

  const checkHouseFromMoon = (transitSign: number, natalMoonSign: number): number => {
    return ((transitSign - natalMoonSign + 12) % 12) + 1;
  };

  // 1. Career (事業與成就)
  const lord10 = natalHouses[9].lord;
  const sign10 = natalHouses[9].sign;
  if (checkAspect(transitPlanets['Jupiter'].sign, sign10, 'Jupiter') || (lord10 && checkAspect(transitPlanets['Jupiter'].sign, natalPlanets[lord10].sign, 'Jupiter'))) {
    interpretations.push({
      category: '事業運勢',
      rule: '流年木星感應 10 宮或 10 宮主',
      result: '事業迎來擴張與貴人相助期，適合爭取晉升或開啟新計畫。',
      isPositive: true,
      priority: 1
    });
  }
  if (checkAspect(transitPlanets['Saturn'].sign, sign10, 'Saturn')) {
    interpretations.push({
      category: '事業運勢',
      rule: '流年土星感應 10 宮',
      result: '面臨重大責任與磨練，但也奠定了長期成功的基礎。',
      isPositive: true,
      priority: 8
    });
  }

  // 2. Wealth (財富與資源)
  const lord2 = natalHouses[1].lord;
  if (checkAspect(transitPlanets['Jupiter'].sign, natalHouses[1].sign, 'Jupiter') || (lord2 && checkAspect(transitPlanets['Jupiter'].sign, natalPlanets[lord2].sign, 'Jupiter'))) {
    interpretations.push({
      category: '財富運勢',
      rule: '流年木星感應 2 宮系列',
      result: '財務狀況有望改善，儲蓄增加或獲得新的收入來源。',
      isPositive: true,
      priority: 2
    });
  }

  // 3. Relationships (感情與社交)
  const lord7 = natalHouses[6].lord;
  if (checkAspect(transitPlanets['Jupiter'].sign, natalHouses[6].sign, 'Jupiter') || (lord7 && checkAspect(transitPlanets['Jupiter'].sign, natalPlanets[lord7].sign, 'Jupiter'))) {
    interpretations.push({
      category: '感情社交',
      rule: '流年木星感應 7 宮系列',
      result: '利於婚姻、合作與伴侶關係。單身者有望進入穩定關係。',
      isPositive: true,
      priority: 3
    });
  }

  // 4. Human Harmony / "人和" (人際關係與支持)
  // Rule A: Jupiter aspecting Lagna or Lagna Lord
  const lord1 = natalHouses[0].lord;
  if (lord1 && (checkAspect(transitPlanets['Jupiter'].sign, natalAsc, 'Jupiter') || checkAspect(transitPlanets['Jupiter'].sign, natalPlanets[lord1].sign, 'Jupiter'))) {
    interpretations.push({
      category: '人和條件',
      rule: '木星感應命宮或命主星',
      result: '個人魅力提升，深獲他人信任，是建立人脈與獲取支持的黃金期。',
      isPositive: true,
      priority: 0
    });
  }

  // Rule B: Jupiter from Moon
  const jupFromMoon = checkHouseFromMoon(transitPlanets['Jupiter'].sign, natalMoonSign);
  if ([2, 5, 7, 9, 11].includes(jupFromMoon)) {
    interpretations.push({
      category: '人和條件',
      rule: `流年木星位於月亮起算第 ${jupFromMoon} 宮`,
      result: '傳統大吉之位。人際關係極佳，心願易遂，各方助力湧入。',
      isPositive: true,
      priority: 1
    });
  }

  // Rule C: Sun in Upachaya from Moon (3, 6, 10, 11)
  const sunFromMoon = checkHouseFromMoon(transitPlanets['Sun'].sign, natalMoonSign);
  if ([3, 6, 10, 11].includes(sunFromMoon)) {
    interpretations.push({
      category: '人和條件',
      rule: `流年太陽位於月亮起算第 ${sunFromMoon} 宮`,
      result: '權威與能量展現期。社交場合中更具發言權，利於推廣個人想法。',
      isPositive: true,
      priority: 5
    });
  }

  // Rule D: Venus in favorable positions from Moon
  const venFromMoon = checkHouseFromMoon(transitPlanets['Venus'].sign, natalMoonSign);
  if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(venFromMoon)) {
    interpretations.push({
      category: '人和條件',
      rule: `流年金星位於月亮起算第 ${venFromMoon} 宮`,
      result: '情感與親和力窗口。適合修補關係、進行浪漫約會或藝術性社交。',
      isPositive: true,
      priority: 6
    });
  }

  // Rule E: Mars in Upachaya from Moon (3, 6, 11)
  const marsFromMoon = checkHouseFromMoon(transitPlanets['Mars'].sign, natalMoonSign);
  if ([3, 6, 11].includes(marsFromMoon)) {
    interpretations.push({
      category: '人和條件',
      rule: `流年火星位於月亮起算第 ${marsFromMoon} 宮`,
      result: '行動力獲得大眾認可，競爭中能贏得他人的尊重與支持。',
      isPositive: true,
      priority: 11
    });
  }

  // Rule F: Mercury in 2, 4, 6, 8, 10, 11 from Moon
  const merFromMoon = checkHouseFromMoon(transitPlanets['Mercury'].sign, natalMoonSign);
  if ([2, 4, 6, 8, 10, 11].includes(merFromMoon)) {
    interpretations.push({
      category: '人和條件',
      rule: `流年水星位於月亮起算第 ${merFromMoon} 宮`,
      result: '溝通順暢，適合簽署合約、拜訪客戶或進行深入的商業談判。',
      isPositive: true,
      priority: 7
    });
  }

  // Rule G: Saturn in 3, 6, 11 from Moon
  const satFromMoon = checkHouseFromMoon(transitPlanets['Saturn'].sign, natalMoonSign);
  if ([3, 6, 11].includes(satFromMoon)) {
    interpretations.push({
      category: '人和條件',
      rule: `流年土星位於月亮起算第 ${satFromMoon} 宮`,
      result: '穩定的社會支持與長輩緣。此時期的努力能換來長期穩健的人脈資產。',
      isPositive: true,
      priority: 12
    });
  }

  // 5. Planetary Connections (合相感應)
  const slowPlanets = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Rahu', 'Ketu'];
  const personalPoints = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Ascendant'];

  slowPlanets.forEach(slow => {
    const tp = transitPlanets[slow];
    if (!tp) return;
    
    personalPoints.forEach(point => {
      let natalSign: number;
      let natalName: string;

      if (point === 'Ascendant') {
        natalSign = natalAsc;
        natalName = '命宮';
      } else {
        const np = natalPlanets[point];
        if (!np) return;
        natalSign = np.sign;
        natalName = getPlanetName(point, modes);
      }

      if (tp.sign === natalSign) {
        const isJup = slow === 'Jupiter';
        interpretations.push({
          category: '天人感應',
          rule: `流年${getPlanetName(slow, modes)}合相本命${natalName}`,
          result: isJup 
            ? `帶來擴張與恩典。在此${natalName}代表的領域中，您將獲得顯著的支持與好運，事半功倍。`
            : `深刻的轉化與考驗。必須以務實冷靜的態度處理${natalName}相關事務，注意長輩或權威人士的壓力。`,
          isPositive: isJup || (slow === 'Uranus') || (slow === 'Venus' && isJup), // Simplified
          priority: isJup ? 2 : 13
        });
      }
    });
  });

  // 6. Challenges (健康與阻礙)
  const dushanthanas = [6, 8, 12];
  const satFromAsc = ((transitPlanets['Saturn'].sign - natalAsc + 12) % 12) + 1;
  if (dushanthanas.includes(satFromAsc)) {
    interpretations.push({
      category: '健康阻礙',
      rule: `流年土星入命宮第 ${satFromAsc} 宮`,
      result: '需注意慢性疾病復發或突發阻礙，此時期應以保守防禦為主。',
      isPositive: false,
      priority: 10
    });
  }
  
  // Sade Sati Check
  const diffSatMoon = (transitPlanets['Saturn'].sign - natalMoonSign + 12) % 12;
  if (diffSatMoon === 11 || diffSatMoon === 0 || diffSatMoon === 1) {
    interpretations.push({
      category: '重大人力考驗',
      rule: '薩德薩提 (Sade Sati) 時期',
      result: '正處於著名的土星回歸月亮期。情緒與壓力較大，需謹慎面對家庭與職責變遷。',
      isPositive: false,
      priority: 15
    });
  }
  
  // Outer Planets (Modern impacts)
  if (transitPlanets['Uranus'] && natalPlanets['Sun'] && (transitPlanets['Uranus'].sign === natalPlanets['Sun'].sign)) {
    interpretations.push({
      category: '生命轉折',
      rule: '天王星合相本命太陽',
      result: '個人意志與生活軌跡將經歷突如其來的徹底變革與覺醒。',
      isPositive: true,
      priority: 7
    });
  }

  return interpretations.sort((a, b) => a.priority - b.priority);
};
