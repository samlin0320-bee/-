const astronomy = require('astronomy-engine');

const date = new Date('1978-03-20T19:15:00+08:00');
const time = new astronomy.AstroTime(date);

const vecJ2000 = astronomy.GeoVector(astronomy.Body.Sun, time, true);

const rotEqjToEqd = astronomy.Rotation_EQJ_EQD(time);
const vecEqd = astronomy.RotateVector(rotEqjToEqd, vecJ2000);

const rotEqdToEcl = astronomy.Rotation_EQD_ECL(time);
const vecEcl = astronomy.RotateVector(rotEqdToEcl, vecEqd);

let lon = Math.atan2(vecEcl.y, vecEcl.x) * 180 / Math.PI;
if (lon < 0) lon += 360;

console.log("True Tropical Longitude of Sun:", lon);

const baseJ2000 = 23.853056;
const year = date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365.25;
const ayanamsa = baseJ2000 + (year - 2000) * 0.0139697;
console.log("Sidereal Sun:", (lon - ayanamsa + 360) % 360);

const sunEclJ2000 = astronomy.Ecliptic(vecJ2000).elon;
console.log("J2000 Ecliptic Sun:", sunEclJ2000);
console.log("Current calculated Sidereal Sun:", (sunEclJ2000 - ayanamsa + 360) % 360);
