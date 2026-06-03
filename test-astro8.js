import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const vec = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
const ecl = Astronomy.Ecliptic(vec);
console.log("Astronomy.Ecliptic(GeoVector):", ecl.elon);

const eqJ2000 = Astronomy.Equator(Astronomy.Body.Sun, time, new Astronomy.Observer(0, 0, 0), false, true);
const raJ = eqJ2000.ra * 15;
const decJ = eqJ2000.dec;

const T = (time.tt - 0) / 36525;
const eps = 23.4392911 - 0.0130042 * T;

const rad = Math.PI / 180;
const y = Math.sin(raJ * rad) * Math.cos(eps * rad) + Math.tan(decJ * rad) * Math.sin(eps * rad);
const x = Math.cos(raJ * rad);
let lon = Math.atan2(y, x) / rad;
if (lon < 0) lon += 360;

console.log("Manual Ecliptic(J2000 RA/Dec, eps_date):", lon);
