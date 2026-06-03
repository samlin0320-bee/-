const astronomy = require('astronomy-engine');

const date = new Date('1978-03-20T19:15:00+08:00'); // local time in Taiwan is +08:00, user prompt says 1978-03-20 / 19:15
const time = new astronomy.AstroTime(date);

const sunVec = astronomy.GeoVector(astronomy.Body.Sun, time, true);
const sunEcl = astronomy.Ecliptic(sunVec);

const j2000_elon = sunEcl.elon;
console.log("J2000 elon:", j2000_elon);

// Calculate Ayanamsa using existing logic
const year = date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365.25;
const baseJ2000 = 23.853056;
const ayanamsa = baseJ2000 + (year - 2000) * 0.0139697;
console.log("Current ayanamsa:", ayanamsa);
console.log("Current calculated Sidereal:", (j2000_elon - ayanamsa + 360) % 360);

// Correct calculation:
// true tropical longitude of date:
const eqDate = astronomy.Equator(astronomy.Body.Sun, time, new astronomy.Observer(0,0,0), true, true);
// Equator has a vec property? No, astronomy-engine doesn't provide easy Ecliptic of date.
// But we know Sidereal = Tropical Date - Ayanamsa Date = J2000_elon - Ayanamsa_J2000
const correctSidereal = (j2000_elon - baseJ2000 + 360) % 360;
console.log("Correct Sidereal (constant J2000 ayanamsa):", correctSidereal);
