import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const vec1 = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
const ecl1 = Astronomy.Ecliptic(vec1);

console.log("J2000 Ecliptic Longitude:", ecl1.elon);

// Let's get Tropical Longitude of date using Equator
const eq = Astronomy.Equator(Astronomy.Body.Sun, time, new Astronomy.Observer(0, 0, 0), true, true);
// eq.ra is in hours (0-24), eq.dec is in degrees
const ra = eq.ra * 15; // degrees
const dec = eq.dec;

// Obliquity of date
// Formula for obliquity of date (approximate):
const T = (time.tt - 0) / 36525; // centuries since J2000
const eps = 23.4392911 - 0.0130042 * T;

// Convert RA/Dec to Ecliptic Longitude
const rad = Math.PI / 180;
const sinEps = Math.sin(eps * rad);
const cosEps = Math.cos(eps * rad);
const sinRa = Math.sin(ra * rad);
const cosRa = Math.cos(ra * rad);
const sinDec = Math.sin(dec * rad);
const cosDec = Math.cos(dec * rad);

const y = sinRa * cosEps + (sinDec / cosDec) * sinEps;
const x = cosRa;
let lon = Math.atan2(y, x) / rad;
if (lon < 0) lon += 360;

console.log("Tropical Longitude of date:", lon);

// Ayanamsa of date
const year = date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365.25;
const ayanamsa = 23.853056 + (year - 2000) * 0.0139697;
console.log("Ayanamsa of date:", ayanamsa);

console.log("Sidereal (Tropical - Ayanamsa):", lon - ayanamsa);
console.log("Sidereal (J2000 - Ayanamsa_J2000):", ecl1.elon - 23.853056);
