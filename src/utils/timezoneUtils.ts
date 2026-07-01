/**
 * Timezone and Daylight Saving Time (DST) automatic determination utilities.
 * Tailored beautifully for Taiwan, Hong Kong, China, USA, Europe, and other global regions,
 * referencing precise historical DST records for highest classical astrology calendar precision.
 */

interface DSTPeriod {
  startMonth: number; // 1-indexed
  startDay: number;
  endMonth: number;
  endDay: number;
}

// Precise historical DST databases
const TAIWAN_DST_RECORDS: Record<number, DSTPeriod> = {
  1945: { startMonth: 5, startDay: 1, endMonth: 8, endDay: 15 },
  1946: { startMonth: 5, startDay: 15, endMonth: 9, endDay: 30 },
  1947: { startMonth: 4, startDay: 15, endMonth: 10, endDay: 31 },
  1948: { startMonth: 5, startDay: 1, endMonth: 9, endDay: 30 },
  1949: { startMonth: 5, startDay: 1, endMonth: 9, endDay: 30 },
  1950: { startMonth: 5, startDay: 1, endMonth: 9, endDay: 30 },
  1951: { startMonth: 5, startDay: 1, endMonth: 9, endDay: 30 },
  1953: { startMonth: 4, startDay: 1, endMonth: 10, endDay: 31 },
  1954: { startMonth: 4, startDay: 1, endMonth: 10, endDay: 31 },
  1955: { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
  1956: { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
  1957: { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
  1958: { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
  1959: { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
  1960: { startMonth: 6, startDay: 1, endMonth: 9, endDay: 30 },
  1961: { startMonth: 6, startDay: 1, endMonth: 9, endDay: 30 },
  1974: { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
  1975: { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
  1979: { startMonth: 7, startDay: 1, endMonth: 9, endDay: 30 }
};

const HONGKONG_DST_RECORDS: Record<number, DSTPeriod> = {
  1941: { startMonth: 6, startDay: 15, endMonth: 9, endDay: 30 },
  1946: { startMonth: 4, startDay: 20, endMonth: 12, endDay: 1 },
  1947: { startMonth: 4, startDay: 13, endMonth: 12, endDay: 30 },
  1948: { startMonth: 5, startDay: 2, endMonth: 10, endDay: 31 },
  1949: { startMonth: 4, startDay: 3, endMonth: 10, endDay: 30 },
  1950: { startMonth: 4, startDay: 2, endMonth: 10, endDay: 29 },
  1951: { startMonth: 4, startDay: 1, endMonth: 10, endDay: 28 },
  1952: { startMonth: 4, startDay: 6, endMonth: 10, endDay: 25 },
  1953: { startMonth: 4, startDay: 5, endMonth: 11, endDay: 1 },
  1954: { startMonth: 3, startDay: 21, endMonth: 10, endDay: 31 },
  1955: { startMonth: 3, startDay: 20, endMonth: 11, endDay: 6 },
  1956: { startMonth: 3, startDay: 18, endMonth: 11, endDay: 4 },
  1957: { startMonth: 3, startDay: 24, endMonth: 11, endDay: 3 },
  1958: { startMonth: 3, startDay: 23, endMonth: 11, endDay: 2 },
  1959: { startMonth: 3, startDay: 22, endMonth: 11, endDay: 1 },
  1960: { startMonth: 3, startDay: 20, endMonth: 11, endDay: 6 },
  1961: { startMonth: 3, startDay: 19, endMonth: 11, endDay: 5 },
  1962: { startMonth: 3, startDay: 18, endMonth: 11, endDay: 4 },
  1963: { startMonth: 3, startDay: 17, endMonth: 11, endDay: 3 },
  1964: { startMonth: 3, startDay: 22, endMonth: 11, endDay: 1 },
  1965: { startMonth: 3, startDay: 21, endMonth: 10, endDay: 31 },
  1966: { startMonth: 4, startDay: 17, endMonth: 10, endDay: 16 },
  1967: { startMonth: 4, startDay: 16, endMonth: 10, endDay: 22 },
  1968: { startMonth: 4, startDay: 21, endMonth: 10, endDay: 20 },
  1969: { startMonth: 4, startDay: 20, endMonth: 10, endDay: 19 },
  1970: { startMonth: 4, startDay: 19, endMonth: 10, endDay: 18 },
  1971: { startMonth: 4, startDay: 18, endMonth: 10, endDay: 17 },
  1972: { startMonth: 4, startDay: 16, endMonth: 10, endDay: 15 },
  1973: { startMonth: 12, startDay: 30, endMonth: 12, endDay: 31 }, // actually lasted into 1974
  1974: { startMonth: 1, startDay: 1, endMonth: 10, endDay: 20 },
  1975: { startMonth: 4, startDay: 20, endMonth: 10, endDay: 19 },
  1976: { startMonth: 4, startDay: 18, endMonth: 10, endDay: 17 },
  1979: { startMonth: 5, startDay: 13, endMonth: 10, endDay: 21 }
};

const CHINA_DST_RECORDS: Record<number, DSTPeriod> = {
  1986: { startMonth: 5, startDay: 4, endMonth: 9, endDay: 14 },
  1987: { startMonth: 4, startDay: 12, endMonth: 9, endDay: 13 },
  1988: { startMonth: 4, startDay: 17, endMonth: 9, endDay: 11 },
  1989: { startMonth: 4, startDay: 16, endMonth: 9, endDay: 17 },
  1990: { startMonth: 4, startDay: 15, endMonth: 9, endDay: 16 },
  1991: { startMonth: 4, startDay: 14, endMonth: 9, endDay: 15 }
};

/**
 * Get N-th Sunday of a certain month and year.
 */
function getNthSunday(year: number, month: number, n: number): number {
  // Date-fns indexes months 0-11
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const temp = new Date(year, month - 1, d);
    if (temp.getMonth() !== month - 1) break;
    if (temp.getDay() === 0) { // Sunday
      count++;
      if (count === n) return d;
    }
  }
  return 1;
}

/**
 * Get Last Sunday of a certain month and year.
 */
function getLastSunday(year: number, month: number): number {
  for (let d = 31; d >= 1; d--) {
    const temp = new Date(year, month - 1, d);
    if (temp.getMonth() === month - 1 && temp.getDay() === 0) {
      return d;
    }
  }
  return 1;
}

/**
 * Automatically determine if Daylight Saving Time (DST) was active 
 * for a given date, time, latitude, and longitude.
 * 
 * @param dateStr Format 'YYYY-MM-DD'
 * @param timeStr Format 'HH:MM'
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @returns boolean True if DST is determined to be active; false otherwise.
 */
export function determineDST(
  dateStr: string,
  timeStr: string,
  lat: number,
  lng: number
): { isDST: boolean; timezone: string; region: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours] = timeStr.split(':').map(Number);

  // If input parameters are invalid, fall back safely
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { isDST: false, timezone: '8', region: '未知 (預設 GMT+8)' };
  }

  // 1. Check if Taiwan
  if (lat >= 21.8 && lat <= 26.5 && lng >= 119.3 && lng <= 122.5) {
    const record = TAIWAN_DST_RECORDS[year];
    if (record) {
      const active = isInsidePeriod(month, day, hours, record);
      return { isDST: active, timezone: '8', region: '台灣 (Taiwan / GMT+8)' };
    }
    return { isDST: false, timezone: '8', region: '台灣 (Taiwan / GMT+8)' };
  }

  // 2. Check if Hong Kong
  if (lat >= 22.0 && lat <= 22.6 && lng >= 113.7 && lng <= 114.6) {
    const record = HONGKONG_DST_RECORDS[year];
    if (record) {
      const active = isInsidePeriod(month, day, hours, record);
      return { isDST: active, timezone: '8', region: '香港 (Hong Kong / GMT+8)' };
    }
    return { isDST: false, timezone: '8', region: '香港 (Hong Kong / GMT+8)' };
  }

  // 3. Check if China (excluding TW & HK)
  if (lat >= 18.0 && lat <= 53.5 && lng >= 73.5 && lng <= 135.0) {
    const record = CHINA_DST_RECORDS[year];
    if (record) {
      const active = isInsidePeriod(month, day, hours, record);
      return { isDST: active, timezone: '8', region: '中國大陸 (China Mainland / GMT+8)' };
    }
    return { isDST: false, timezone: '8', region: '中國大陸 (China Mainland / GMT+8)' };
  }

  // 4. Check if USA / Canada Region (Roughly lng: -140 to -52, lat: 24 to 65)
  // Arizona (approx lat 31-37, lng -115 to -109) and Hawaii (approx lat 18-23, lng -160 to -154) do not observe DST.
  if (lng >= -140 && lng <= -52 && lat >= 24 && lat <= 65) {
    const isArizona = lat >= 31 && lat <= 37 && lng >= -115 && lng <= -109;
    const isHawaii = lat >= 18 && lat <= 23 && lng >= -160 && lng <= -154;

    if (isArizona || isHawaii) {
      const defaultTz = isHawaii ? '-10' : '-7';
      return { isDST: false, timezone: defaultTz, region: isHawaii ? '美國夏威夷 (Hawaii)' : '美國亞利桑那 (Arizona)' };
    }

    // Determine USA DST dates
    let startM = 4, startD = 1, endM = 10, endD = 31; // defaults
    if (year >= 2007) {
      // 2nd Sunday of March to 1st Sunday of November
      startM = 3;
      startD = getNthSunday(year, 3, 2);
      endM = 11;
      endD = getNthSunday(year, 11, 1);
    } else if (year >= 1987) {
      // 1st Sunday of April to last Sunday of October
      startM = 4;
      startD = getNthSunday(year, 4, 1);
      endM = 10;
      endD = getLastSunday(year, 10);
    } else {
      // Last Sunday of April to last Sunday of October
      startM = 4;
      startD = getLastSunday(year, 4);
      endM = 10;
      endD = getLastSunday(year, 10);
    }

    const active = isInsidePeriod(month, day, hours, { startMonth: startM, startDay: startD, endMonth: endM, endDay: endD });
    const estTz = Math.round(lng / 15.0).toString();
    return { isDST: active, timezone: estTz, region: `北美地區 (North America / GMT ${estTz})` };
  }

  // 5. Check if Europe (Roughly lng: -10 to 32, lat: 35 to 70)
  if (lng >= -10 && lng <= 32 && lat >= 35 && lat <= 70) {
    // Last Sunday of March to last Sunday of October
    const startD = getLastSunday(year, 3);
    const endD = getLastSunday(year, 10);
    const active = isInsidePeriod(month, day, hours, { startMonth: 3, startDay: startD, endMonth: 10, endDay: endD });
    const estTz = Math.round(lng / 15.0).toString();
    return { isDST: active, timezone: estTz, region: `歐洲地區 (Europe / GMT ${estTz})` };
  }

  // 6. Australia (Southern Hemisphere - NSW, Victoria, SA, Tasmania)
  if (lng >= 113.0 && lng <= 154.0 && lat >= -44.0 && lat <= -10.0) {
    // Queensland, WA and NT don't observe DST
    // QLD: lat > -29, lng > 138; WA: lng < 129
    const isQLDOrWAOrNT = (lat > -29 && lng > 138 && lng < 151) || lng < 129 || lat > -20;
    if (isQLDOrWAOrNT) {
      const estTz = Math.round(lng / 15.0).toString();
      return { isDST: false, timezone: estTz, region: `澳洲非DST區 (Australia Non-DST)` };
    }

    // DST starts first Sunday of October, ends first Sunday of April
    // Note: this spans across the new year!
    const startD = getNthSunday(year, 10, 1);
    const endD = getNthSunday(year, 4, 1);

    // active in Jan-Mar (before end) or Oct-Dec (after start)
    let active = false;
    if (month > 10 || month < 4) {
      active = true;
    } else if (month === 10) {
      active = day > startD || (day === startD && hours >= 2);
    } else if (month === 4) {
      active = day < endD || (day === endD && hours < 3);
    }

    const estTz = Math.round(lng / 15.0).toString();
    return { isDST: active, timezone: estTz, region: `澳洲DST地區 (Australia DST)` };
  }

  // Fallback Rule based on 15-degrees of longitude and standard client local timezone guess
  const estimatedTimezone = Math.round(lng / 15.0).toString();
  return { 
    isDST: false, 
    timezone: estimatedTimezone, 
    region: `國際其他地區 (GMT ${estimatedTimezone})` 
  };
}

/**
 * Checks if a specific day is inside the month/day range
 */
function isInsidePeriod(
  month: number,
  day: number,
  hour: number,
  period: DSTPeriod
): boolean {
  const { startMonth, startDay, endMonth, endDay } = period;

  if (month > startMonth && month < endMonth) {
    return true;
  }
  if (month === startMonth) {
    return day > startDay || (day === startDay && hour >= 2);
  }
  if (month === endMonth) {
    return day < endDay || (day === endDay && hour < 2);
  }
  return false;
}
