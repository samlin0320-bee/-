import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const eqJ2000 = Astronomy.Equator(Astronomy.Body.Sun, time, new Astronomy.Observer(0, 0, 0), false, true);
const eqDate = Astronomy.Equator(Astronomy.Body.Sun, time, new Astronomy.Observer(0, 0, 0), true, true);

console.log("J2000 RA:", eqJ2000.ra, "Dec:", eqJ2000.dec);
console.log("Date RA:", eqDate.ra, "Dec:", eqDate.dec);

const vec = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
const ecl = Astronomy.Ecliptic(vec);
console.log("J2000 Ecliptic:", ecl.elon);
