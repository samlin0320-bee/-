const astronomy = require('astronomy-engine');

const date = new Date('1978-03-20T19:15:00+08:00');
const time = new astronomy.AstroTime(date);

const obs = new astronomy.Observer(0, 0, 0);

// Get true Equator of date
const eqDate = astronomy.Equator(astronomy.Body.Sun, time, obs, true, true);

// To get true ecliptic of date, we need the obliquity of date?
// astronomy-engine doesn't have a direct Equator of date to Ecliptic of date function exposed simply?
// Wait, we can get tropical ecliptic longitude of the sun using astronomy.SunPosition
const eclipDate = astronomy.SunPosition(time);
console.log("Sun Tropical Ecliptic Longitude (SunPosition):", eclipDate.elon);

// Calculate Ayanamsa using existing logic
const year = date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365.25;
const baseJ2000 = 23.853056;
const ayanamsa = baseJ2000 + (year - 2000) * 0.0139697;

console.log("Current ayanamsa:", ayanamsa);
console.log("True Sidereal using SunPosition (Tropical - Ayanamsa):", (eclipDate.elon - ayanamsa + 360) % 360);

// Moon
const moonEq = astronomy.Equator(astronomy.Body.Moon, time, obs, true, true);
console.log("Moon Equator RA:", moonEq.ra);

