const astronomy = require('astronomy-engine');

const date = new Date('1978-03-20T19:15:00+08:00');
const time = new astronomy.AstroTime(date);

const vecJ2000 = astronomy.GeoVector(astronomy.Body.Sun, time, true);

// 1. EQJ to EQD (J2000 equator to Equator of Date)
const rotEqjToEqd = astronomy.Rotation_EQJ_EQD(time);
const vecEqd = astronomy.RotateVector(rotEqjToEqd, vecJ2000);

// 2. EQD to ECL (Equator of Date to Ecliptic of Date)
const rotEqdToEcl = astronomy.Rotation_EQD_ECL(time);
const vecEcl = astronomy.RotateVector(rotEqdToEcl, vecEqd);

// 3. Vector to Spherical (Longitude, Latitude, Distance)
const sph = astronomy.Spherical(vecEcl);
console.log("True Tropical Longitude of Sun:", sph.lon);

const baseJ2000 = 23.853056;
const year = date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365.25;
const ayanamsa = baseJ2000 + (year - 2000) * 0.0139697;
console.log("Sidereal Sun:", (sph.lon - ayanamsa + 360) % 360);

// J2000 Ecliptic Longitude (the current logic)
const sunEclJ2000 = astronomy.Ecliptic(vecJ2000).elon;
console.log("J2000 Ecliptic Sun:", sunEclJ2000);
console.log("Current calculated Sidereal Sun:", (sunEclJ2000 - ayanamsa + 360) % 360);
