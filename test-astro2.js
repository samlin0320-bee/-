import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const vec1 = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
const ecl1 = Astronomy.Ecliptic(vec1);

console.log("GeoVector elon:", ecl1.elon);

const eq = Astronomy.Equator(Astronomy.Body.Sun, time, true, true, true);
// eq has ra and dec, not vec?
console.log("Equator ra:", eq.ra, "dec:", eq.dec);

// How to get tropical longitude of date?
// Ecliptic(vec) assumes vec is J2000.
// If we want tropical of date, we need to precess it.
// Let's check Astronomy.Ecliptic documentation or similar.
