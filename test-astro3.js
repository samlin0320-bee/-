import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const vec1 = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
const ecl1 = Astronomy.Ecliptic(vec1);

console.log("GeoVector J2000 elon:", ecl1.elon);

const sunPos = Astronomy.SunPosition(time);
console.log("SunPosition elon:", sunPos.elon);

// Let's check Moon
const moonPos = Astronomy.GeoMoon(time);
const eclMoon = Astronomy.Ecliptic(moonPos);
console.log("Moon J2000 elon:", eclMoon.elon);

// How to get precession?
const precessed = Astronomy.Precess(vec1, time);
// Wait, Precess is not a function maybe? Let's try.
