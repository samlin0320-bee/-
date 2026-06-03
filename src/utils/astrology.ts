import { Body, AstroTime, GeoVector, GeoMoon, SunPosition, Ecliptic, SiderealTime } from 'astronomy-engine';

export interface NakshatraInfo {
  name: string;
  pada: number;
  lord: string;
  degree: number;
}

export interface PlanetPosition {
  name: string;
  longitude: number; // 0-360
  sign: number; // 1-12
  degreeInSign: number; // 0-30
  isRetrograde: boolean;
  nakshatra: NakshatraInfo;
  house: number;
  speed: number; // degrees per day
  isCombust: boolean;
  dignity: 'Exalted' | 'Debilitated' | 'Moolatrikona' | 'Own Sign' | 'Neutral' | 'Great Friend' | 'Friend' | 'Great Enemy' | 'Enemy';
  friendship: 'Great Friend' | 'Friend' | 'Neutral' | 'Enemy' | 'Great Enemy';
  avastha: 'Infant' | 'Youth' | 'Adult' | 'Old' | 'Dead';
  jaiminiKaraka?: string;
}

export interface DashaPeriod {
  planet: string;
  start: Date;
  end: Date;
  subPeriods?: DashaPeriod[];
  level: number;
}

export interface VargaChart {
  name: string;
  id: string;
  planets: Record<string, { sign: number; degreeInSign: number }>;
  ascendantSign: number;
}

export interface ShadbalaData {
  sthana: number;
  dig: number;
  kala: number;
  chesta: number;
  naisargika: number;
  drik: number;
  total: number;
  rupas: number;
}

export interface HouseData {
  number: number;
  sign: number;
  degree: number;
  longitude: number;
  nakshatra: NakshatraInfo;
  lord: string;
  planetsInHouse: string[];
  score: number;
}

export interface ChartData {
  ascendant: number;
  ascendantSign: number;
  planets: Record<string, PlanetPosition>;
  ayanamsa: number;
  vargas: VargaChart[];
  dashas: DashaPeriod[];
  yoginiDashas?: DashaPeriod[];
  charaDashas?: DashaPeriod[];
  shadbala?: Record<string, ShadbalaData>;
  houses: HouseData[];
  midheaven?: number;
  sav?: Record<number, number>;
  bav?: Record<string, number[]>;
  pav?: Record<string, Record<string, number[]>>;
  utcTime: string;
  arudhaLagna?: number;
  upapadaLagna?: number;
  bhriguBindu?: {
    longitude: number;
    sign: number;
    degreeInSign: number;
    house: number;
    nakshatra: NakshatraInfo;
    lord: string;
  };
}

export const ZODIAC_PROPERTIES: Record<number, { name: string; element: string; modality: string; gender: string; fertility: string; body: string }> = {
  1: { name: 'Aries', element: 'Fire', modality: 'Movable', gender: 'Male', fertility: 'Barren', body: 'Quadruped' },
  2: { name: 'Taurus', element: 'Earth', modality: 'Fixed', gender: 'Female', fertility: 'Semi-Fruitful', body: 'Quadruped' },
  3: { name: 'Gemini', element: 'Air', modality: 'Dual', gender: 'Male', fertility: 'Barren', body: 'Biped' },
  4: { name: 'Cancer', element: 'Water', modality: 'Movable', gender: 'Female', fertility: 'Fruitful', body: 'Multiped' },
  5: { name: 'Leo', element: 'Fire', modality: 'Fixed', gender: 'Male', fertility: 'Barren', body: 'Quadruped' },
  6: { name: 'Virgo', element: 'Earth', modality: 'Dual', gender: 'Female', fertility: 'Barren', body: 'Biped' },
  7: { name: 'Libra', element: 'Air', modality: 'Movable', gender: 'Male', fertility: 'Semi-Fruitful', body: 'Biped' },
  8: { name: 'Scorpio', element: 'Water', modality: 'Fixed', gender: 'Female', fertility: 'Fruitful', body: 'Multiped' },
  9: { name: 'Sagittarius', element: 'Fire', modality: 'Dual', gender: 'Male', fertility: 'Semi-Fruitful', body: 'Biped/Quadruped' },
  10: { name: 'Capricorn', element: 'Earth', modality: 'Movable', gender: 'Female', fertility: 'Semi-Fruitful', body: 'Quadruped/Water' },
  11: { name: 'Aquarius', element: 'Air', modality: 'Fixed', gender: 'Male', fertility: 'Semi-Fruitful', body: 'Biped' },
  12: { name: 'Pisces', element: 'Water', modality: 'Dual', gender: 'Female', fertility: 'Fruitful', body: 'Footless' }
};

export const PLANETARY_DIGNITIES: Record<string, { own: number[]; exaltation: number; exaltationDeg: number; debilitation: number; moola: number; moolaRange: [number, number] }> = {
  Sun: { own: [5], exaltation: 1, exaltationDeg: 10, debilitation: 7, moola: 5, moolaRange: [0, 20] },
  Moon: { own: [4], exaltation: 2, exaltationDeg: 3, debilitation: 8, moola: 2, moolaRange: [3, 30] },
  Mars: { own: [1, 8], exaltation: 10, exaltationDeg: 28, debilitation: 4, moola: 1, moolaRange: [0, 12] },
  Mercury: { own: [3, 6], exaltation: 6, exaltationDeg: 15, debilitation: 12, moola: 6, moolaRange: [15, 20] },
  Jupiter: { own: [9, 12], exaltation: 4, exaltationDeg: 5, debilitation: 10, moola: 9, moolaRange: [0, 10] },
  Venus: { own: [2, 7], exaltation: 12, exaltationDeg: 27, debilitation: 6, moola: 7, moolaRange: [0, 15] },
  Saturn: { own: [10, 11], exaltation: 7, exaltationDeg: 20, debilitation: 1, moola: 11, moolaRange: [0, 20] }
};

export const NATURAL_FRIENDSHIP: Record<string, { friends: string[]; enemies: string[]; neutral: string[] }> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutral: ['Mercury'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutral: ['Mars', 'Jupiter', 'Saturn'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutral: ['Saturn'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutral: ['Mars', 'Jupiter'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] }
};

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

const DASHA_YEARS: Record<string, number> = {
  'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7, 'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
};

const getNakshatra = (longitude: number): NakshatraInfo => {
  const totalMinutes = longitude * 60;
  const nakshatraSizeMinutes = 800; // 13°20'
  const nakshatraIndex = Math.floor(totalMinutes / nakshatraSizeMinutes) % 27;
  const elapsedInNakshatra = totalMinutes % nakshatraSizeMinutes;
  const pada = Math.floor(elapsedInNakshatra / 200) + 1;
  
  return {
    name: NAKSHATRAS[nakshatraIndex],
    pada,
    lord: NAKSHATRA_LORDS[nakshatraIndex % 9],
    degree: (elapsedInNakshatra / 60)
  };
};

const getAyanamsa = (date: Date, type: string = 'Lahiri') => {
  const year = date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365.25;
  
  // Base values at J2000.0
  let baseJ2000 = 23.853056; // Lahiri (Chitra Paksha)
  
  switch (type) {
    case 'FaganBradley':
      baseJ2000 = 24.736667; // 24°44'12"
      break;
    case 'Raman':
      baseJ2000 = 22.645556; // 22°38'44"
      break;
    case 'Krishnamurti':
      baseJ2000 = 23.766667; // 23°46'00"
      break;
    case 'Lahiri':
    default:
      baseJ2000 = 23.853056; // 23°51'11"
      break;
  }
  
  // Rate of precession is ~50.290966 arcsec/year = 0.0139697 degrees/year
  return baseJ2000 + (year - 2000) * 0.0139697;
};

const OBLIQUITY = 23.4392911; // J2000

const getAvastha = (degreeInSign: number, sign: number): 'Infant' | 'Youth' | 'Adult' | 'Old' | 'Dead' => {
  const isOdd = sign % 2 !== 0;
  if (degreeInSign < 6) return isOdd ? 'Infant' : 'Dead';
  if (degreeInSign < 12) return isOdd ? 'Youth' : 'Old';
  if (degreeInSign < 18) return 'Adult';
  if (degreeInSign < 24) return isOdd ? 'Old' : 'Youth';
  return isOdd ? 'Dead' : 'Infant';
};

const calculateAscendant = (date: Date, lat: number, lng: number): number => {
  const time = new AstroTime(date);
  const gmstHours = SiderealTime(time);
  const lstHours = (gmstHours + lng / 15.0) % 24.0;
  const lstDegrees = lstHours * 15.0;
  
  const ramc = lstDegrees * (Math.PI / 180);
  const eps = OBLIQUITY * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  const y = Math.cos(ramc);
  const x = -Math.sin(ramc) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
  let ascDeg = Math.atan2(y, x) * (180 / Math.PI);
  
  if (ascDeg < 0) ascDeg += 360;
  return ascDeg;
};

export const getGeocentricLongitude = (body: Body, time: AstroTime): number => {
  let vecJ2000;
  if (body === Body.Sun) {
    vecJ2000 = GeoVector(Body.Sun, time, true);
  } else if (body === Body.Moon) {
    vecJ2000 = GeoMoon(time);
  } else {
    vecJ2000 = GeoVector(body, time, true);
  }

  // Convert J2000 Equatorial to True Equator of Date
  const rotEqjToEqd = rotation_EQJ_EQD(time);
  const vecEqd = rotateVector(rotEqjToEqd, vecJ2000);

  // Convert True Equator of Date to True Ecliptic of Date
  const rotEqdToEcl = rotation_EQD_ECL(time);
  const vecEcl = rotateVector(rotEqdToEcl, vecEqd);

  // Derive longitude
  let lon = Math.atan2(vecEcl.y, vecEcl.x) * (180 / Math.PI);
  if (lon < 0) lon += 360;
  return lon;
};

// We need to import these functions from astronomy-engine. Let's make sure they are injected.
import { Rotation_EQJ_EQD, Rotation_EQD_ECL, RotateVector } from 'astronomy-engine';

const rotation_EQJ_EQD = Rotation_EQJ_EQD;
const rotation_EQD_ECL = Rotation_EQD_ECL;
const rotateVector = RotateVector;


const calculateVargaSign = (longitude: number, varga: number): number => {
  const sign = Math.floor(longitude / 30) + 1;
  const degreeInSign = longitude % 30;
  const isOdd = sign % 2 !== 0;
  const modality = sign % 3; // 1: Movable, 2: Fixed, 0: Dual
  const element = sign % 4; // 1: Fire, 2: Earth, 3: Air, 0: Water

  switch (varga) {
    case 2: // Hora
      if (isOdd) return degreeInSign < 15 ? 5 : 4;
      return degreeInSign < 15 ? 4 : 5;
    case 3: // Drekkana
      const d3Part = Math.floor(degreeInSign / 10);
      return ((sign - 1 + d3Part * 4) % 12) + 1;
    case 4: // Chaturthamsha
      const d4Part = Math.floor(degreeInSign / 7.5);
      return ((sign - 1 + d4Part * 3) % 12) + 1;
    case 7: // Saptamsha
      const d7Part = Math.floor(degreeInSign / (30 / 7));
      return isOdd ? ((sign - 1 + d7Part) % 12) + 1 : ((sign - 1 + 6 + d7Part) % 12) + 1;
    case 9: // Navamsa
      return (Math.floor((longitude * 9) / 30) % 12) + 1;
    case 10: // Dasamsa
      const d10Part = Math.floor(degreeInSign / 3);
      return isOdd ? ((sign - 1 + d10Part) % 12) + 1 : ((sign - 1 + 8 + d10Part) % 12) + 1;
    case 11: // Rudramsa
      const d11Part = Math.floor(degreeInSign / (30 / 11));
      if (isOdd) {
        // Odd signs: Count from Aries in reverse order
        return ((1 - 1 - d11Part + 12 * 11) % 12) + 1;
      } else {
        // Even signs: Count from Aries in direct order
        return ((1 - 1 + d11Part) % 12) + 1;
      }
    case 12: // Dwadasamsa
      const d12Part = Math.floor(degreeInSign / 2.5);
      return ((sign - 1 + d12Part) % 12) + 1;
    case 16: // Shodashamsha
      const d16Part = Math.floor(degreeInSign / (30 / 16));
      const d16Start = modality === 1 ? 1 : modality === 2 ? 5 : 9;
      return ((d16Start - 1 + d16Part) % 12) + 1;
    case 20: // Vimshamsha
      const d20Part = Math.floor(degreeInSign / 1.5);
      const d20Start = modality === 1 ? 1 : modality === 2 ? 9 : 5;
      return ((d20Start - 1 + d20Part) % 12) + 1;
    case 24: // Chaturvimshamsha
      const d24Part = Math.floor(degreeInSign / 1.25);
      const d24Start = isOdd ? 5 : 4;
      return ((d24Start - 1 + d24Part) % 12) + 1;
    case 27: // Saptavimshamsha
      const d27Part = Math.floor(degreeInSign / (30 / 27));
      const d27Start = element === 1 ? 1 : element === 2 ? 4 : element === 3 ? 7 : 10;
      return ((d27Start - 1 + d27Part) % 12) + 1;
    case 30: // Trimshamsha
      const deg = degreeInSign;
      if (isOdd) {
        if (deg < 5) return 1;
        if (deg < 10) return 11;
        if (deg < 18) return 9;
        if (deg < 25) return 3;
        return 7;
      } else {
        if (deg < 5) return 2;
        if (deg < 12) return 6;
        if (deg < 20) return 12;
        if (deg < 25) return 10;
        return 8;
      }
    case 40: // Khavedamsha
      const d40Part = Math.floor(degreeInSign / 0.75);
      const d40Start = isOdd ? 1 : 7;
      return ((d40Start - 1 + d40Part) % 12) + 1;
    case 45: // Akshavedamsha
      const d45Part = Math.floor(degreeInSign / (30 / 45));
      const d45Start = modality === 1 ? 1 : modality === 2 ? 5 : 9;
      return ((d45Start - 1 + d45Part) % 12) + 1;
    case 60: // Shashtiamsha
      const d60Part = Math.floor(degreeInSign * 2);
      return ((sign - 1 + d60Part) % 12) + 1;
    default:
      return (Math.floor((longitude * varga) / 30) % 12) + 1;
  }
};

const calculateVimshottariDashas = (moonLong: number, birthDate: Date): DashaPeriod[] => {
  const nakshatraSize = 360 / 27;
  const nakIndex = Math.floor(moonLong / nakshatraSize);
  const elapsedInNak = moonLong % nakshatraSize;
  const lordIndex = nakIndex % 9;
  
  const dashaSequence = [
    ...NAKSHATRA_LORDS.slice(lordIndex),
    ...NAKSHATRA_LORDS.slice(0, lordIndex)
  ];
  
  let currentDate = new Date(birthDate);
  
  // Calculate remaining time in first dasha
  const totalYears = DASHA_YEARS[NAKSHATRA_LORDS[lordIndex]];
  const elapsedFraction = elapsedInNak / nakshatraSize;
  const remainingYears = totalYears * (1 - elapsedFraction);
  
  // Shift birth date back to start of first dasha for easier calculation
  currentDate.setTime(currentDate.getTime() - (totalYears * elapsedFraction * 365.25 * 24 * 60 * 60 * 1000));

  const dashas: DashaPeriod[] = [];
  
  // Calculate 120 years of dashas (Mahadashas)
  let dashaPointer = lordIndex;
  
  for (let i = 0; i < 9; i++) {
    const planet = NAKSHATRA_LORDS[dashaPointer % 9];
    const years = DASHA_YEARS[planet];
    const startDate = new Date(currentDate);
    currentDate.setTime(currentDate.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
    const endDate = new Date(currentDate);
    
    // Sub-periods (Antardashas)
    const subPeriods: DashaPeriod[] = [];
    let subCurrentDate = new Date(startDate);
    for (let j = 0; j < 9; j++) {
      const subPlanet = NAKSHATRA_LORDS[(dashaPointer + j) % 9];
      const subYears = (years * DASHA_YEARS[subPlanet]) / 120;
      const subStart = new Date(subCurrentDate);
      subCurrentDate.setTime(subCurrentDate.getTime() + subYears * 365.25 * 24 * 60 * 60 * 1000);
      const subEnd = new Date(subCurrentDate);
      
      // Level 3 (Pratyantardashas)
      const pPeriods: DashaPeriod[] = [];
      let pCurrentDate = new Date(subStart);
      for (let k = 0; k < 9; k++) {
        const pPlanet = NAKSHATRA_LORDS[(dashaPointer + j + k) % 9];
        const pYears = (subYears * DASHA_YEARS[pPlanet]) / 120;
        const pStart = new Date(pCurrentDate);
        pCurrentDate.setTime(pCurrentDate.getTime() + pYears * 365.25 * 24 * 60 * 60 * 1000);
        const pEnd = new Date(pCurrentDate);
        
        // Level 4 (Sookshma Dashas)
        const sPeriods: DashaPeriod[] = [];
        let sCurrentDate = new Date(pStart);
        for (let l = 0; l < 9; l++) {
          const sPlanet = NAKSHATRA_LORDS[(dashaPointer + j + k + l) % 9];
          const sYears = (pYears * DASHA_YEARS[sPlanet]) / 120;
          const sStart = new Date(sCurrentDate);
          sCurrentDate.setTime(sCurrentDate.getTime() + sYears * 365.25 * 24 * 60 * 60 * 1000);
          const sEnd = new Date(sCurrentDate);
          sPeriods.push({ planet: sPlanet, start: sStart, end: sEnd, level: 4 });
        }

        pPeriods.push({ planet: pPlanet, start: pStart, end: pEnd, subPeriods: sPeriods, level: 3 });
      }

      subPeriods.push({ planet: subPlanet, start: subStart, end: subEnd, subPeriods: pPeriods, level: 2 });
    }

    dashas.push({ planet, start: startDate, end: endDate, subPeriods, level: 1 });
    dashaPointer++;
  }
  
  return dashas;
};

const SIGN_LORDS = ['', 'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

const NAISARGIKA_MAITRI: Record<string, Record<string, number>> = {
  Sun: { Moon: 1, Mars: 1, Jupiter: 1, Mercury: 0, Venus: -1, Saturn: -1, Rahu: -1, Ketu: -1 },
  Moon: { Sun: 1, Mercury: 1, Mars: 0, Jupiter: 0, Venus: 0, Saturn: 0, Rahu: -1, Ketu: -1 },
  Mars: { Sun: 1, Moon: 1, Jupiter: 1, Venus: 0, Saturn: 0, Mercury: -1, Rahu: -1, Ketu: 1 },
  Mercury: { Sun: 1, Venus: 1, Mars: 0, Jupiter: 0, Saturn: 0, Moon: -1, Rahu: 0, Ketu: 0 },
  Jupiter: { Sun: 1, Moon: 1, Mars: 1, Saturn: 0, Mercury: -1, Venus: -1, Rahu: 1, Ketu: 0 },
  Venus: { Mercury: 1, Saturn: 1, Mars: 0, Jupiter: 0, Sun: -1, Moon: -1, Rahu: 1, Ketu: 1 },
  Saturn: { Mercury: 1, Venus: 1, Jupiter: 0, Sun: -1, Moon: -1, Mars: -1, Rahu: 1, Ketu: -1 },
  Rahu: { Venus: 1, Saturn: 1, Mercury: 1, Jupiter: 0, Sun: -1, Moon: -1, Mars: -1, Ketu: -1 },
  Ketu: { Mars: 1, Venus: 1, Jupiter: 1, Mercury: 0, Sun: -1, Moon: -1, Saturn: -1, Rahu: -1 }
};

const getCompoundFriendship = (p1: string, p2: string, p1House: number, p2House: number): string => {
  if (p1 === p2) return 'Self';
  
  // Natural
  const natural = NAISARGIKA_MAITRI[p1]?.[p2] || 0;
  
  // Temporary
  const houseDiff = (p2House - p1House + 12) % 12;
  const temporary = [1, 2, 3, 9, 10, 11].includes(houseDiff) ? 1 : -1;
  
  const total = natural + temporary;
  if (total >= 2) return 'Great Friend';
  if (total === 1) return 'Friend';
  if (total === 0) return 'Neutral';
  if (total === -1) return 'Enemy';
  return 'Great Enemy';
};

const getDignity = (name: string, sign: number, degree: number): 'Exalted' | 'Debilitated' | 'Moolatrikona' | 'Own Sign' | 'Neutral' => {
  const exaltations: Record<string, { sign: number; deg: number }> = {
    Sun: { sign: 1, deg: 10 }, Moon: { sign: 2, deg: 3 }, Mars: { sign: 10, deg: 28 },
    Mercury: { sign: 6, deg: 15 }, Jupiter: { sign: 4, deg: 5 }, Venus: { sign: 12, deg: 27 }, Saturn: { sign: 7, deg: 20 },
    Rahu: { sign: 3, deg: 15 }, Ketu: { sign: 9, deg: 15 }
  };
  const moolatrikona: Record<string, { sign: number; start: number; end: number }> = {
    Sun: { sign: 5, start: 0, end: 20 }, Moon: { sign: 2, start: 3, end: 30 }, Mars: { sign: 1, start: 0, end: 12 },
    Mercury: { sign: 6, start: 15, end: 20 }, Jupiter: { sign: 9, start: 0, end: 10 }, Venus: { sign: 7, start: 0, end: 15 }, Saturn: { sign: 11, start: 0, end: 20 },
    Rahu: { sign: 6, start: 0, end: 30 }, Ketu: { sign: 12, start: 0, end: 30 }
  };
  const ownSigns: Record<string, number[]> = {
    Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
    Rahu: [6], Ketu: [12]
  };

  if (exaltations[name] && exaltations[name].sign === sign && degree <= exaltations[name].deg) return 'Exalted';
  const debSign = exaltations[name] ? ((exaltations[name].sign + 5) % 12) + 1 : -1;
  if (debSign === sign) return 'Debilitated';
  if (moolatrikona[name] && moolatrikona[name].sign === sign && degree >= moolatrikona[name].start && degree <= moolatrikona[name].end) return 'Moolatrikona';
  if (ownSigns[name]?.includes(sign)) return 'Own Sign';
  return 'Neutral';
};

const calculateYoginiDashas = (moonLong: number, birthDate: Date): DashaPeriod[] => {
  const YOGINI_LORDS = [
    { name: 'Sankata', years: 8 },
    { name: 'Mangala', years: 1 },
    { name: 'Pingala', years: 2 },
    { name: 'Dhanya', years: 3 },
    { name: 'Bhramari', years: 4 },
    { name: 'Bhadrika', years: 5 },
    { name: 'Ulka', years: 6 },
    { name: 'Siddha', years: 7 }
  ];
  
  const nakshatraExact = moonLong / (360 / 27);
  const nakshatraIndex = Math.floor(nakshatraExact); // 0 to 26
  const nakshatraNumber = nakshatraIndex + 1; // 1 to 27
  
  const yoginiIndex = (nakshatraNumber + 3) % 8;
  
  const fractionLeft = 1 - (nakshatraExact - nakshatraIndex);
  
  const dashas: DashaPeriod[] = [];
  let currentDate = new Date(birthDate);
  
  const firstLordYears = YOGINI_LORDS[yoginiIndex].years;
  currentDate.setTime(currentDate.getTime() - (firstLordYears * (1 - fractionLeft) * 365.25 * 24 * 60 * 60 * 1000));
  
  let pointer = yoginiIndex;
  // Calculate 3 cycles (108 years)
  for (let i = 0; i < 24; i++) {
    const lord = YOGINI_LORDS[pointer % 8];
    const startDate = new Date(currentDate);
    currentDate.setTime(currentDate.getTime() + lord.years * 365.25 * 24 * 60 * 60 * 1000);
    const endDate = new Date(currentDate);
    
    // Sub-periods (Antardashas)
    const subPeriods: DashaPeriod[] = [];
    let subDate = new Date(startDate);
    let subPointer = pointer;
    for (let j = 0; j < 8; j++) {
      const subLord = YOGINI_LORDS[subPointer % 8];
      const subYears = (lord.years * subLord.years) / 36;
      const subStartDate = new Date(subDate);
      subDate.setTime(subDate.getTime() + subYears * 365.25 * 24 * 60 * 60 * 1000);
      const subEndDate = new Date(subDate);
      
      subPeriods.push({
        planet: subLord.name,
        start: subStartDate,
        end: subEndDate,
        level: 2
      });
      subPointer++;
    }
    
    dashas.push({
      planet: lord.name,
      start: startDate,
      end: endDate,
      subPeriods,
      level: 1
    });
    
    pointer++;
  }
  
  return dashas;
};

const calculateCharaDashas = (ascendantSign: number, planets: Record<string, PlanetPosition>, birthDate: Date): DashaPeriod[] => {
  // Simplified Chara Dasha calculation
  const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const SIGN_LORDS: Record<number, string> = {
    1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
    7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter'
  };

  const dashas: DashaPeriod[] = [];
  let currentDate = new Date(birthDate);
  
  const isForward = ascendantSign % 2 !== 0;
  
  for (let i = 0; i < 12; i++) {
    const currentSign = isForward ? ((ascendantSign + i - 1) % 12) + 1 : ((ascendantSign - i + 11) % 12) + 1;
    const lord = SIGN_LORDS[currentSign];
    const lordPos = planets[lord];
    
    let years = 0;
    if (lordPos) {
      const lordSign = lordPos.sign;
      if (lordSign === currentSign) {
        years = 12;
      } else {
        const isSignForward = currentSign % 2 !== 0;
        if (isSignForward) {
          years = ((lordSign - currentSign + 12) % 12);
        } else {
          years = ((currentSign - lordSign + 12) % 12);
        }
        if (years === 0) years = 12;
      }
    } else {
      years = 10;
    }
    
    const startDate = new Date(currentDate);
    currentDate.setTime(currentDate.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
    const endDate = new Date(currentDate);
    
    const subPeriods: DashaPeriod[] = [];
    let subDate = new Date(startDate);
    const subMonths = years;
    
    for (let j = 0; j < 12; j++) {
      const subSign = isForward ? ((currentSign + j - 1) % 12) + 1 : ((currentSign - j + 11) % 12) + 1;
      const subStartDate = new Date(subDate);
      subDate.setMonth(subDate.getMonth() + subMonths);
      const subEndDate = new Date(subDate);
      
      subPeriods.push({
        planet: ZODIAC_SIGNS[subSign - 1],
        start: subStartDate,
        end: subEndDate,
        level: 2
      });
    }
    
    dashas.push({
      planet: ZODIAC_SIGNS[currentSign - 1],
      start: startDate,
      end: endDate,
      subPeriods,
      level: 1
    });
  }
  
  return dashas;
};

export const ASHTAKAVARGA_RULES: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [3, 4, 6, 10, 11, 12]
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Ascendant: [3, 6, 10, 11]
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 3, 6, 10, 11]
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 2, 4, 6, 8, 10, 11]
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Ascendant: [1, 2, 4, 5, 6, 7, 9, 10, 11]
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Ascendant: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Ascendant: [1, 3, 4, 6, 10, 11]
  }
};

export const calculatePAV = (planets: Record<string, PlanetPosition>, ascendantSign: number): Record<string, Record<string, number[]>> => {
  const pav: Record<string, Record<string, number[]>> = {};
  const refPositions: Record<string, number> = {
    Sun: planets['Sun']?.sign,
    Moon: planets['Moon']?.sign,
    Mars: planets['Mars']?.sign,
    Mercury: planets['Mercury']?.sign,
    Jupiter: planets['Jupiter']?.sign,
    Venus: planets['Venus']?.sign,
    Saturn: planets['Saturn']?.sign,
    Ascendant: ascendantSign
  };

  for (const [targetPlanet, rules] of Object.entries(ASHTAKAVARGA_RULES)) {
    pav[targetPlanet] = {};
    for (const [refPlanet, houses] of Object.entries(rules)) {
      const refSign = refPositions[refPlanet];
      const signBits = new Array(12).fill(0);
      if (refSign !== undefined) {
        houses.forEach(house => {
          const targetSignIndex = (refSign - 1 + house - 1) % 12;
          signBits[targetSignIndex] = 1;
        });
      }
      pav[targetPlanet][refPlanet] = signBits;
    }
  }
  return pav;
};

export const VEDHA_RULES: Record<string, Record<number, number>> = {
  Sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
  Moon: { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  Mars: { 3: 12, 6: 9, 11: 5 },
  Mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  Jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  Venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
  Saturn: { 3: 12, 6: 9, 11: 5 }
};

export const KAKSHYA_LORDS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Ascendant'];

export const getKakshyaIndex = (degreeInSign: number): number => {
  return Math.floor(degreeInSign / 3.75);
};

export const getKakshyaLord = (index: number): string => {
  return KAKSHYA_LORDS[index];
};

export const calculateBAV = (pav: Record<string, Record<string, number[]>>): Record<string, number[]> => {
  const bav: Record<string, number[]> = {};
  for (const [targetPlanet, refPlanets] of Object.entries(pav)) {
    bav[targetPlanet] = new Array(12).fill(0);
    for (const points of Object.values(refPlanets)) {
      for (let i = 0; i < 12; i++) {
        bav[targetPlanet][i] += points[i];
      }
    }
  }
  return bav;
};

export const calculateSAV = (planets: Record<string, PlanetPosition>, ascendantSign: number): number[] => {
  const sav = new Array(12).fill(0);
  const refPositions: Record<string, number> = {
    Sun: planets['Sun']?.sign,
    Moon: planets['Moon']?.sign,
    Mars: planets['Mars']?.sign,
    Mercury: planets['Mercury']?.sign,
    Jupiter: planets['Jupiter']?.sign,
    Venus: planets['Venus']?.sign,
    Saturn: planets['Saturn']?.sign,
    Ascendant: ascendantSign
  };

  for (const [targetPlanet, rules] of Object.entries(ASHTAKAVARGA_RULES)) {
    for (const [refPlanet, houses] of Object.entries(rules)) {
      const refSign = refPositions[refPlanet];
      if (refSign !== undefined) {
        houses.forEach(house => {
          const targetSignIndex = (refSign - 1 + house - 1) % 12;
          sav[targetSignIndex]++;
        });
      }
    }
  }
  return sav;
};

const calculateDignity = (planet: string, sign: number, degreeInSign: number): PlanetPosition['dignity'] => {
  const rules = PLANETARY_DIGNITIES[planet];
  if (!rules) return 'Neutral';

  if (sign === rules.exaltation) return 'Exalted';
  if (sign === rules.debilitation) return 'Debilitated';
  if (sign === rules.moola && degreeInSign >= rules.moolaRange[0] && degreeInSign <= rules.moolaRange[1]) return 'Moolatrikona';
  if (rules.own.includes(sign)) return 'Own Sign';
  
  return 'Neutral'; // Will be refined by compound friendship later
};

const calculateCompoundFriendship = (planet: string, sign: number, allPlanets: Record<string, any>): PlanetPosition['friendship'] => {
  const natural = NATURAL_FRIENDSHIP[planet];
  if (!natural) return 'Neutral';

  const signLord = SIGN_LORDS[sign];
  if (signLord === planet) return 'Neutral'; // Own sign

  const lordPos = allPlanets[signLord]?.house;
  const planetPos = allPlanets[planet]?.house;
  
  if (!lordPos || !planetPos) return 'Neutral';

  // Temporal Friendship: Planets in 2, 3, 4, 10, 11, 12 from each other are friends
  const distance = ((lordPos - planetPos + 12) % 12) + 1;
  const isTemporalFriend = [2, 3, 4, 10, 11, 12].includes(distance);

  const isNaturalFriend = natural.friends.includes(signLord);
  const isNaturalEnemy = natural.enemies.includes(signLord);

  if (isTemporalFriend && isNaturalFriend) return 'Great Friend';
  if (isTemporalFriend && !isNaturalFriend && !isNaturalEnemy) return 'Friend';
  if (!isTemporalFriend && isNaturalEnemy) return 'Great Enemy';
  if (!isTemporalFriend && !isNaturalFriend && !isNaturalEnemy) return 'Enemy';
  
  return 'Neutral';
};

export const calculateChart = (date: Date, lat: number, lng: number, isSidereal: boolean = true, ayanamsaType: string = 'Lahiri'): ChartData => {
  const time = new AstroTime(date);
  const ayanamsa = getAyanamsa(date, ayanamsaType);
  
  const bodies = [
    { key: 'Sun', body: Body.Sun },
    { key: 'Moon', body: Body.Moon },
    { key: 'Mars', body: Body.Mars },
    { key: 'Mercury', body: Body.Mercury },
    { key: 'Jupiter', body: Body.Jupiter },
    { key: 'Venus', body: Body.Venus },
    { key: 'Saturn', body: Body.Saturn },
    { key: 'Uranus', body: Body.Uranus },
    { key: 'Neptune', body: Body.Neptune },
    { key: 'Pluto', body: Body.Pluto },
  ];

  const planets: Record<string, PlanetPosition> = {};
  const ascendantRaw = calculateAscendant(date, lat, lng);
  let ascendant = ascendantRaw;
  if (isSidereal) {
    ascendant -= ayanamsa;
    if (ascendant < 0) ascendant += 360;
  }
  const ascendantSign = Math.floor(ascendant / 30) + 1;

  bodies.forEach(({ key, body }) => {
    let longitude = getGeocentricLongitude(body, time);
    
    if (isSidereal) {
      longitude -= ayanamsa;
      if (longitude < 0) longitude += 360;
    }

    const timeYesterday = new AstroTime(new Date(date.getTime() - 24 * 60 * 60 * 1000));
    let lonYesterday = getGeocentricLongitude(body, timeYesterday);
    if (isSidereal) {
      lonYesterday -= ayanamsa;
      if (lonYesterday < 0) lonYesterday += 360;
    }
    
    let diff = longitude - lonYesterday;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    const isRetrograde = diff < 0 && key !== 'Sun' && key !== 'Moon';
    
    // Combustion check
    const sunLong = getGeocentricLongitude(Body.Sun, time) - (isSidereal ? ayanamsa : 0);
    let distFromSun = Math.abs(longitude - sunLong);
    if (distFromSun > 180) distFromSun = 360 - distFromSun;
    const combustLimits: Record<string, number> = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
    const isCombust = key !== 'Sun' && distFromSun <= (combustLimits[key] || 0);

    planets[key] = {
      name: key,
      longitude,
      sign: Math.floor(longitude / 30) + 1,
      degreeInSign: longitude % 30,
      isRetrograde,
      nakshatra: getNakshatra(longitude),
      house: ((Math.floor(longitude / 30) + 1 - ascendantSign + 12) % 12) + 1,
      speed: diff,
      isCombust,
      dignity: calculateDignity(key, Math.floor(longitude / 30) + 1, longitude % 30),
      friendship: 'Neutral', // Calculated below
      avastha: getAvastha(longitude % 30, Math.floor(longitude / 30) + 1)
    };
  });

  // Rahu/Ketu
  const d = time.tt;
  let rahuLon = (125.04452 - 0.0529537648 * d) % 360;
  if (rahuLon < 0) rahuLon += 360;
  if (isSidereal) {
    rahuLon -= ayanamsa;
    if (rahuLon < 0) rahuLon += 360;
  }
  let ketuLon = (rahuLon + 180) % 360;

  planets['Rahu'] = {
    name: 'Rahu',
    longitude: rahuLon,
    sign: Math.floor(rahuLon / 30) + 1,
    degreeInSign: rahuLon % 30,
    isRetrograde: true,
    nakshatra: getNakshatra(rahuLon),
    house: ((Math.floor(rahuLon / 30) + 1 - ascendantSign + 12) % 12) + 1,
    speed: -0.05,
    isCombust: false,
    dignity: calculateDignity('Rahu', Math.floor(rahuLon / 30) + 1, rahuLon % 30),
    friendship: 'Neutral',
    avastha: getAvastha(rahuLon % 30, Math.floor(rahuLon / 30) + 1)
  };

  planets['Ketu'] = {
    name: 'Ketu',
    longitude: ketuLon,
    sign: Math.floor(ketuLon / 30) + 1,
    degreeInSign: ketuLon % 30,
    isRetrograde: true,
    nakshatra: getNakshatra(ketuLon),
    house: ((Math.floor(ketuLon / 30) + 1 - ascendantSign + 12) % 12) + 1,
    speed: -0.05,
    isCombust: false,
    dignity: calculateDignity('Ketu', Math.floor(ketuLon / 30) + 1, ketuLon % 30),
    friendship: 'Neutral',
    avastha: getAvastha(ketuLon % 30, Math.floor(ketuLon / 30) + 1)
  };

  // Calculate Compound Friendship
  Object.keys(planets).forEach(key => {
    if (key !== 'Rahu' && key !== 'Ketu' && !['Uranus', 'Neptune', 'Pluto'].includes(key)) {
      planets[key].friendship = calculateCompoundFriendship(key, planets[key].sign, planets);
      
      // Refine dignity based on compound friendship if it's currently Neutral
      if (planets[key].dignity === 'Neutral') {
        if (planets[key].friendship === 'Great Friend') planets[key].dignity = 'Great Friend' as any;
        else if (planets[key].friendship === 'Friend') planets[key].dignity = 'Friend' as any;
        else if (planets[key].friendship === 'Great Enemy') planets[key].dignity = 'Great Enemy' as any;
        else if (planets[key].friendship === 'Enemy') planets[key].dignity = 'Enemy' as any;
      }
    }
  });

  // Jaimini Karakas (7 Karakas)
  const jaiminiPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const sortedForJaimini = jaiminiPlanets
    .map(p => ({ name: p, degree: planets[p].degreeInSign }))
    .sort((a, b) => b.degree - a.degree);

  const karakaNames = ['AK', 'AMK', 'BK', 'MK', 'PK', 'GK', 'DK'];
  sortedForJaimini.forEach((p, i) => {
    if (i < 7) {
      planets[p.name].jaiminiKaraka = karakaNames[i];
    }
  });

  // Arudha Lagna (AL) and Upapada Lagna (UL)
  const getArudha = (startSign: number) => {
    const lord = SIGN_LORDS[startSign];
    const lordSign = planets[lord].sign;
    let distance = lordSign - startSign;
    if (distance < 0) distance += 12;
    
    let arudhaSign = (lordSign + distance) % 12;
    if (arudhaSign === 0) arudhaSign = 12;
    
    // Exceptions
    if (arudhaSign === startSign) arudhaSign = (startSign + 9) % 12 || 12; // 10th from it
    else if (arudhaSign === ((startSign + 6) % 12 || 12)) arudhaSign = (startSign + 3) % 12 || 12; // 4th from it
    
    return arudhaSign;
  };

  const arudhaLagna = getArudha(ascendantSign);
  const upapadaLagna = getArudha(ascendantSign === 1 ? 12 : ascendantSign - 1);

  // Vargas
  const vargaConfigs = [
    { id: 'D1', name: '本命盤 (Rashi)', factor: 1 },
    { id: 'D2', name: '財富盤 (Hora)', factor: 2 },
    { id: 'D3', name: '兄弟盤 (Drekkana)', factor: 3 },
    { id: 'D4', name: '田宅盤 (Chaturthamsa)', factor: 4 },
    { id: 'D7', name: '子女盤 (Saptamsa)', factor: 7 },
    { id: 'D9', name: '夫妻盤 (Navamsa)', factor: 9 },
    { id: 'D10', name: '事業盤 (Dasamsa)', factor: 10 },
    { id: 'D11', name: '災厄盤 (Rudramsa)', factor: 11 },
    { id: 'D12', name: '父母盤 (Dwadasamsa)', factor: 12 },
    { id: 'D16', name: '福德盤 (Shodasamsa)', factor: 16 },
    { id: 'D20', name: '精神盤 (Vimsamsa)', factor: 20 },
    { id: 'D24', name: '學問盤 (Chaturvimsamsa)', factor: 24 },
    { id: 'D27', name: '力量盤 (Saptavimsamsa)', factor: 27 },
    { id: 'D30', name: '災難盤 (Trimsamsa)', factor: 30 },
    { id: 'D40', name: '吉祥盤 (Khavedamsa)', factor: 40 },
    { id: 'D45', name: '性格盤 (Akshavedamsa)', factor: 45 },
    { id: 'D60', name: '因果盤 (Shashtyamsa)', factor: 60 },
  ];

  const vargas: VargaChart[] = vargaConfigs.map(config => {
    const vPlanets: Record<string, { sign: number; degreeInSign: number }> = {};
    Object.entries(planets).forEach(([name, p]) => {
      const sign = calculateVargaSign(p.longitude, config.factor);
      vPlanets[name] = { sign, degreeInSign: (p.longitude * config.factor) % 30 };
    });
    return {
      id: config.id,
      name: config.name,
      planets: vPlanets,
      ascendantSign: calculateVargaSign(ascendant, config.factor)
    };
  });

  // Dashas
  const dashas = calculateVimshottariDashas(planets['Moon'].longitude, date);
  const yoginiDashas = calculateYoginiDashas(planets['Moon'].longitude, date);
  const charaDashas = calculateCharaDashas(ascendantSign, planets, date);

  // Houses (Vedic often uses Whole Sign, but we'll provide cusps for Bhava Chalit)
  const houses: HouseData[] = Array.from({ length: 12 }).map((_, i) => {
    const houseSign = ((ascendantSign + i - 1) % 12) + 1;
    const houseLong = (houseSign - 1) * 30 + (ascendant % 30);
    
    // Find planets in this house
    const planetsInHouse = Object.values(planets)
      .filter(p => p.house === i + 1)
      .map(p => p.name);

    // Simple house score based on planets and lord
    let score = 50;
    planetsInHouse.forEach(pName => {
      const p = planets[pName];
      if (p.dignity === 'Exalted') score += 15;
      if (p.dignity === 'Debilitated') score -= 15;
      if (p.isRetrograde) score += 5;
    });

    return {
      number: i + 1,
      sign: houseSign,
      degree: ascendant % 30,
      longitude: houseLong % 360,
      nakshatra: getNakshatra(houseLong % 360),
      lord: SIGN_LORDS[houseSign],
      planetsInHouse,
      score
    };
  });

  // Structured Shadbala (More realistic calculations)
  const shadbala: Record<string, ShadbalaData> = {};
  const planetKeys = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  planetKeys.forEach(k => {
    const p = planets[k];
    
    // Sthana Bala (Position)
    let sthana = 60;
    if (p.dignity === 'Exalted') sthana += 60;
    if (p.dignity === 'Moolatrikona') sthana += 45;
    if (p.dignity === 'Own Sign') sthana += 30;
    if (p.dignity === 'Debilitated') sthana -= 30;
    
    // Dig Bala (Directional)
    let dig = 30;
    const digBalaHouses: Record<string, number> = { Jupiter: 1, Mercury: 1, Sun: 10, Mars: 10, Saturn: 7, Moon: 4, Venus: 4 };
    if (p.house === digBalaHouses[k]) dig += 30;
    
    // Kala Bala (Time)
    const isDay = date.getUTCHours() >= 6 && date.getUTCHours() < 18;
    let kala = 40;
    if (isDay && ['Sun', 'Jupiter', 'Venus'].includes(k)) kala += 20;
    if (!isDay && ['Moon', 'Mars', 'Saturn'].includes(k)) kala += 20;
    
    // Chesta Bala (Motion)
    let chesta = 50;
    if (p.isRetrograde) chesta += 30;
    
    // Naisargika Bala (Natural)
    const naisargikaWeights: Record<string, number> = { Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57 };
    const naisargika = naisargikaWeights[k] || 0;
    
    // Drik Bala (Aspect) - simplified
    const drik = 0; 

    const total = sthana + dig + kala + chesta + naisargika + drik;
    shadbala[k] = {
      sthana, dig, kala, chesta, naisargika, drik,
      total,
      rupas: total / 60
    };
  });

  const sav = calculateSAV(planets, ascendantSign);
  const pav = calculatePAV(planets, ascendantSign);
  const bav = calculateBAV(pav);

  // Bhrigu Bindu (Midpoint of Moon and Rahu)
  const bbLon = ((planets['Moon'].longitude + planets['Rahu'].longitude) / 2) % 360;
  const bbSign = Math.floor(bbLon / 30) + 1;
  const bbNak = getNakshatra(bbLon);
  const bbLord = SIGN_LORDS[bbSign];
  
  const bhriguBindu = {
    longitude: bbLon,
    sign: bbSign,
    degreeInSign: bbLon % 30,
    house: ((bbSign - ascendantSign + 12) % 12) + 1,
    nakshatra: bbNak,
    lord: bbLord
  };

  return {
    ascendant,
    ascendantSign,
    planets,
    ayanamsa: isSidereal ? ayanamsa : 0,
    vargas,
    dashas,
    yoginiDashas,
    charaDashas,
    shadbala,
    houses,
    midheaven: houses[9].longitude,
    sav,
    bav,
    pav,
    utcTime: date.toISOString(),
    arudhaLagna,
    upapadaLagna,
    bhriguBindu
  };
};

export const findNextSaturnTransitToNakshatra = (
  nakshatraIndex: number,
  currentDate: Date,
  isSidereal: boolean,
  ayanamsaType: string
): { start: Date; end: Date } | null => {
  const targetStart = nakshatraIndex * (360 / 27);
  const targetEnd = (nakshatraIndex + 1) * (360 / 27);

  let foundStart: Date | null = null;
  let foundEnd: Date | null = null;
  let isInside = false;

  // Search forward up to 35 years, step by 2 days
  for (let i = 0; i < 365 * 35; i += 2) {
    const checkDate = new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000);
    const time = new AstroTime(checkDate);
    let lon = getGeocentricLongitude(Body.Saturn, time);

    if (isSidereal) {
      const ayanamsa = getAyanamsa(checkDate, ayanamsaType);
      lon -= ayanamsa;
      if (lon < 0) lon += 360;
    }

    const insideNow = targetStart < targetEnd
      ? lon >= targetStart && lon < targetEnd
      : lon >= targetStart || lon < targetEnd;

    if (insideNow && !isInside) {
      if (!foundStart) foundStart = checkDate;
    } else if (!insideNow && isInside) {
      if (foundStart && !foundEnd) {
        foundEnd = checkDate;
        break;
      }
    }
    isInside = insideNow;
  }

  if (foundStart && foundEnd) {
    return { start: foundStart, end: foundEnd };
  }
  return null;
};

export const calculateGochar = (natalMoonSign: number, transitPlanets: Record<string, PlanetPosition>) => {
  const results: Record<string, { house: number; sign: number; result: string; description: string }> = {};
  
  Object.entries(transitPlanets).forEach(([name, p]) => {
    // Only calculate for major planets
    if (!['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].includes(name)) return;

    const houseFromMoon = ((p.sign - natalMoonSign + 12) % 12) + 1;
    
    // Basic Gochar Results (Simplified Parashara/Vedic principles)
    let result = "中性";
    let description = "穩定發展。";

    if (name === 'Jupiter') {
      if ([2, 5, 7, 9, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "貴人相助，財運與智慧提升。";
      } else {
        result = "凶";
        description = "支出增加，需注意健康。";
      }
    } else if (name === 'Saturn') {
      if ([3, 6, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "事業突破，克服困難。";
      } else if ([1, 2, 12].includes(houseFromMoon)) {
        result = "凶 (Sade Sati)";
        description = "壓力較大，需修心養性。";
      } else {
        result = "凶";
        description = "責任加重，進展緩慢。";
      }
    } else if (name === 'Mars') {
      if ([3, 6, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "勇往直前，競爭獲勝。";
      } else {
        result = "凶";
        description = "情緒波動，注意衝突。";
      }
    } else if (name === 'Sun') {
      if ([3, 6, 10, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "事業順利，獲得認可。";
      } else {
        result = "凶";
        description = "注意與長輩或上司的關係。";
      }
    } else if (name === 'Moon') {
      if ([1, 3, 6, 7, 10, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "心情愉悅，人際關係良好。";
      } else {
        result = "凶";
        description = "情緒起伏，注意內心平靜。";
      }
    } else if (name === 'Mercury') {
      if ([2, 4, 6, 8, 10, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "溝通順暢，學習能力強。";
      } else {
        result = "凶";
        description = "注意言語誤會，文書錯誤。";
      }
    } else if (name === 'Venus') {
      if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseFromMoon)) {
        result = "吉";
        description = "享受生活，感情甜蜜。";
      } else {
        result = "凶";
        description = "避免過度放縱，注意財務。";
      }
    } else if (name === 'Rahu') {
      if ([3, 6, 10, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "意外收穫，突破現狀。";
      } else {
        result = "凶";
        description = "內心焦慮，注意欺騙。";
      }
    } else if (name === 'Ketu') {
      if ([3, 6, 11].includes(houseFromMoon)) {
        result = "吉";
        description = "直覺敏銳，靈性提升。";
      } else {
        result = "凶";
        description = "感到孤立，注意意外。";
      }
    }

    results[name] = { house: houseFromMoon, sign: p.sign, result, description };
  });

  return results;
};

export const getFriendshipName = (friendship: string) => {
  const zh: Record<string, string> = {
    'Great Friend': '大友',
    'Friend': '朋友',
    'Neutral': '中性',
    'Enemy': '敵人',
    'Great Enemy': '大敵',
    'Self': '自己'
  };
  return zh[friendship] || friendship;
};

export const getDignityName = (dignity: string) => {
  const zh: Record<string, string> = {
    'Exalted': '廟旺',
    'Debilitated': '落陷',
    'Moolatrikona': '強力',
    'Own Sign': '本宮',
    'Neutral': '中性'
  };
  return zh[dignity] || dignity;
};

export const getPlanetProperties = (planetName: string) => {
  const properties: Record<string, { rules: number[], exalted: number, debilitated: number }> = {
    Sun: { rules: [5], exalted: 1, debilitated: 7 },
    Moon: { rules: [4], exalted: 2, debilitated: 8 },
    Mars: { rules: [1, 8], exalted: 10, debilitated: 4 },
    Mercury: { rules: [3, 6], exalted: 6, debilitated: 12 },
    Jupiter: { rules: [9, 12], exalted: 4, debilitated: 10 },
    Venus: { rules: [2, 7], exalted: 12, debilitated: 6 },
    Saturn: { rules: [10, 11], exalted: 7, debilitated: 1 },
    Rahu: { rules: [6], exalted: 3, debilitated: 9 },
    Ketu: { rules: [12], exalted: 9, debilitated: 3 },
    Uranus: { rules: [11], exalted: 8, debilitated: 2 },
    Neptune: { rules: [12], exalted: 4, debilitated: 10 },
    Pluto: { rules: [8], exalted: 1, debilitated: 7 }
  };
  return properties[planetName];
};

export const getZodiacName = (sign: number, modes: string[] = ['zh']) => {
  const zh = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];
  const en = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const enAbbr = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
  const sanskrit = ['Mesha', 'Vrisha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vruschikam', 'Dhanus', 'Makaram', 'Kumbham', 'Meenam'];
  const sansAhr = ['Mes', 'Vri', 'Mit', 'Kar', 'Sim', 'Kan', 'Tul', 'Vru', 'Dha', 'Mak', 'Kum', 'Mee'];
  const symbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  
  if (!modes || modes.length === 0) return zh[sign - 1];
  
  return modes.map(mode => {
    switch (mode) {
      case 'symbol': return symbols[sign - 1];
      case 'en': return en[sign - 1];
      case 'en-abbr': return enAbbr[sign - 1];
      case 'sanskrit': return sanskrit[sign - 1];
      case 'sanskrit-abbr': return sansAhr[sign - 1];
      case 'full-en': return `${en[sign - 1]}/${sanskrit[sign - 1]}`;
      default: return zh[sign - 1];
    }
  }).join(' ');
};

export type FunctionalDignity = 'Yogakaraka' | 'PureAuspicious' | 'Auspicious' | 'Malefic' | 'Killer' | 'Infectious' | 'Neutral';

export const getFunctionalDignity = (ascendantSign: number, planet: string): FunctionalDignity => {
  if (planet === 'Rahu' || planet === 'Ketu' || planet === 'Uranus' || planet === 'Neptune' || planet === 'Pluto' || planet === 'Ascendant') return 'Neutral';

  switch (ascendantSign) {
    case 1: // Aries
      if (planet === 'Sun' || planet === 'Moon') return 'PureAuspicious';
      if (planet === 'Jupiter') return 'Auspicious';
      if (planet === 'Saturn' || planet === 'Mercury') return 'Malefic';
      if (planet === 'Venus') return 'Killer';
      if (planet === 'Mars') return 'Infectious';
      break;
    case 2: // Taurus
      if (planet === 'Saturn') return 'Yogakaraka';
      if (planet === 'Sun') return 'Auspicious';
      if (planet === 'Jupiter' || planet === 'Moon' || planet === 'Venus') return 'Malefic';
      if (planet === 'Mars') return 'Killer';
      if (planet === 'Mercury') return 'Infectious';
      break;
    case 3: // Gemini
      if (planet === 'Mercury') return 'PureAuspicious';
      if (planet === 'Venus') return 'Auspicious';
      if (planet === 'Mars' || planet === 'Sun') return 'Malefic';
      if (planet === 'Moon') return 'Killer';
      if (planet === 'Jupiter' || planet === 'Saturn') return 'Neutral';
      break;
    case 4: // Cancer
      if (planet === 'Mars') return 'Yogakaraka';
      if (planet === 'Moon') return 'PureAuspicious';
      if (planet === 'Jupiter') return 'Auspicious';
      if (planet === 'Venus' || planet === 'Mercury') return 'Malefic';
      if (planet === 'Saturn' || planet === 'Sun') return 'Killer';
      break;
    case 5: // Leo
      if (planet === 'Mars') return 'Yogakaraka';
      if (planet === 'Sun') return 'PureAuspicious';
      if (planet === 'Saturn' || planet === 'Venus') return 'Malefic';
      if (planet === 'Jupiter' || planet === 'Moon') return 'Infectious';
      if (planet === 'Mercury') return 'Killer';
      break;
    case 6: // Virgo
      if (planet === 'Mercury') return 'PureAuspicious';
      if (planet === 'Venus' || planet === 'Sun') return 'Infectious';
      if (planet === 'Saturn' || planet === 'Mars' || planet === 'Moon') return 'Malefic';
      if (planet === 'Jupiter') return 'Killer';
      break;
    case 7: // Libra
      if (planet === 'Saturn') return 'Yogakaraka';
      if (planet === 'Venus' || planet === 'Mercury') return 'Infectious';
      if (planet === 'Mars') return 'Killer';
      if (planet === 'Jupiter' || planet === 'Sun') return 'Malefic';
      if (planet === 'Moon') return 'Auspicious';
      break;
    case 8: // Scorpio
      if (planet === 'Moon') return 'PureAuspicious';
      if (planet === 'Sun') return 'Auspicious';
      if (planet === 'Mars' || planet === 'Saturn' || planet === 'Mercury') return 'Malefic';
      if (planet === 'Jupiter' || planet === 'Venus') return 'Infectious';
      break;
    case 9: // Sagittarius
      if (planet === 'Jupiter' || planet === 'Sun') return 'PureAuspicious';
      if (planet === 'Mercury' || planet === 'Saturn') return 'Killer';
      if (planet === 'Mars' || planet === 'Moon') return 'Infectious';
      if (planet === 'Venus') return 'Malefic';
      break;
    case 10: // Capricorn
      if (planet === 'Venus') return 'Yogakaraka';
      if (planet === 'Saturn' || planet === 'Sun') return 'Infectious';
      if (planet === 'Mercury' || planet === 'Mars' || planet === 'Jupiter') return 'Malefic';
      if (planet === 'Moon') return 'Killer';
      break;
    case 11: // Aquarius
      if (planet === 'Venus') return 'Yogakaraka';
      if (planet === 'Saturn' || planet === 'Mercury') return 'Infectious';
      if (planet === 'Mars' || planet === 'Moon') return 'Malefic';
      if (planet === 'Jupiter' || planet === 'Sun') return 'Killer';
      break;
    case 12: // Pisces
      if (planet === 'Moon') return 'PureAuspicious';
      if (planet === 'Jupiter' || planet === 'Mercury') return 'Killer';
      if (planet === 'Mars') return 'Infectious';
      if (planet === 'Venus' || planet === 'Saturn' || planet === 'Sun') return 'Malefic';
      break;
  }
  return 'Neutral';
};

export const getFunctionalDignityColor = (dignity: FunctionalDignity): string => {
  switch (dignity) {
    case 'Yogakaraka': return 'text-purple-600 font-bold';
    case 'PureAuspicious': return 'text-blue-600 font-bold';
    case 'Auspicious': return 'text-green-600';
    case 'Malefic': return 'text-red-500';
    case 'Killer': return 'text-red-800 font-bold';
    case 'Infectious': return 'text-amber-500';
    case 'Neutral': return 'text-gray-500';
    default: return 'text-gray-700';
  }
};

export const getFunctionalDignityName = (dignity: FunctionalDignity): string => {
  switch (dignity) {
    case 'Yogakaraka': return '貴徵';
    case 'PureAuspicious': return '純清';
    case 'Auspicious': return '吉星';
    case 'Malefic': return '破格';
    case 'Killer': return '害格';
    case 'Infectious': return '感染';
    case 'Neutral': return '中性';
    default: return '';
  }
};

export const getFunctionalDignityHexColor = (dignity: FunctionalDignity): string => {
  switch (dignity) {
    case 'Yogakaraka': return '#9333ea'; // purple-600
    case 'PureAuspicious': return '#2563eb'; // blue-600
    case 'Auspicious': return '#16a34a'; // green-600
    case 'Malefic': return '#ef4444'; // red-500
    case 'Killer': return '#991b1b'; // red-800
    case 'Infectious': return '#f59e0b'; // amber-500
    case 'Neutral': return '#6b7280'; // gray-500
    default: return '#374151'; // gray-700
  }
};

export const getPlanetName = (name: string, modes: string[] = ['zh']) => {
  const zh: Record<string, string> = {
    Sun: '太陽', Moon: '太陰', Mars: '火星', Mercury: '水星', Jupiter: '木星',
    Venus: '金星', Saturn: '土星', Rahu: '羅睺', Ketu: '計都', Ascendant: '命宮',
    Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星'
  };
  const en: Record<string, string> = {
    Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter',
    Venus: 'Venus', Saturn: 'Saturn', Rahu: 'Rahu', Ketu: 'Ketu', Ascendant: 'Asc',
    Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto'
  };
  const enAbbr: Record<string, string> = {
    Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
    Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Ascendant: 'As',
    Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl'
  };
  const sanskrit: Record<string, string> = {
    Sun: 'Surya', Moon: 'Chandra', Mars: 'Mangala', Mercury: 'Budha', Jupiter: 'Guru',
    Venus: 'Shukra', Saturn: 'Sani', Rahu: 'Rahu', Ketu: 'Ketu', Ascendant: 'Lagna',
    Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto'
  };
  const sansAbbr: Record<string, string> = {
    Sun: 'Sur', Moon: 'Cha', Mars: 'Man', Mercury: 'Bud', Jupiter: 'Gur',
    Venus: 'Shu', Saturn: 'San', Rahu: 'Rah', Ketu: 'Ket', Ascendant: 'Lag',
    Uranus: 'Ura', Neptune: 'Nep', Pluto: 'Plu'
  };
  const symbols: Record<string, string> = {
    Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
    Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋', Ascendant: 'As',
    Uranus: '♅', Neptune: '♆', Pluto: '♇'
  };
  
  if (!modes || modes.length === 0) return zh[name] || name;

  return modes.map(mode => {
    switch (mode) {
      case 'symbol': return symbols[name] || name;
      case 'en': return en[name] || name;
      case 'en-abbr': return enAbbr[name] || name;
      case 'sanskrit': return sanskrit[name] || name;
      case 'sanskrit-abbr': return sansAbbr[name] || name;
      case 'full-en': return `${name}/${sanskrit[name] || name}`;
      default: return zh[name] || name;
    }
  }).join(' ');
};

export const getElementColor = (sign: number) => {
  const element = sign % 4;
  switch (element) {
    case 1: return '#fee2e2'; // Fire (Red)
    case 2: return '#fef3c7'; // Earth (Yellow)
    case 3: return '#dcfce7'; // Air (Green)
    case 0: return '#dbeafe'; // Water (Blue)
    default: return '#ffffff';
  }
};

