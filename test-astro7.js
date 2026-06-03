import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const eqDate = Astronomy.Equator(Astronomy.Body.Sun, time, new Astronomy.Observer(0, 0, 0), true, true);
const ra = eqDate.ra * 15;
const dec = eqDate.dec;

const T = (time.tt - 0) / 36525;
const eps = 23.4392911 - 0.0130042 * T;

const rad = Math.PI / 180;
const sinEps = Math.sin(eps * rad);
const cosEps = Math.cos(eps * rad);
const sinRa = Math.sin(ra * rad);
const cosRa = Math.cos(ra * rad);
const tanDec = Math.tan(dec * rad);

const y = sinRa * cosEps + tanDec * sinEps;
const x = cosRa;
let lon = Math.atan2(y, x) / rad;
if (lon < 0) lon += 360;

console.log("Tropical Longitude of date:", lon);

const eqJ2000 = Astronomy.Equator(Astronomy.Body.Sun, time, new Astronomy.Observer(0, 0, 0), false, true);
const raJ = eqJ2000.ra * 15;
const decJ = eqJ2000.dec;
const epsJ = 23.4392911;
const yJ = Math.sin(raJ * rad) * Math.cos(epsJ * rad) + Math.tan(decJ * rad) * Math.sin(epsJ * rad);
const xJ = Math.cos(raJ * rad);
let lonJ = Math.atan2(yJ, xJ) / rad;
if (lonJ < 0) lonJ += 360;

console.log("J2000 Ecliptic Longitude:", lonJ);
