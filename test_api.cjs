const astronomy = require('astronomy-engine');

const date = new Date('1978-03-20T19:15:00+08:00');
const time = new astronomy.AstroTime(date);

const sunVecJ2000 = astronomy.GeoVector(astronomy.Body.Sun, time, true);
// Tropical Ecliptic Of Date:
// astronomy.Ecliptic is documented as purely J2000.
// But we can apply precession rotation matrix yourself? 
// Or does astronomy-engine have a built in way?
// Let's use precession vector!
const precVec = astronomy.Rotation_EQJ_EQD(time); // wait does this exist? No, let's look up astronomy-engine documentation for Equatorial of Date to Ecliptic.

// Can we just use the Equator object?
const obs = new astronomy.Observer(0, 0, 0);
const eqDate = astronomy.Equator(astronomy.Body.Sun, time, obs, true, true);
// RA and DEC are in eqDate.ra and eqDate.dec
// Let's manually convert RA and DEC to Ecliptic Longitude.
function raDecToEcliptic(raHours, decDegrees, time) {
    const ra = raHours * 15 * Math.PI / 180;
    const dec = decDegrees * Math.PI / 180;
    
    // Obliquity of ecliptic (approximate true obliquity)
    // Actually we can just use the j2000 obliquity if we are in J2000, but we have RA/DEC of date!
    // So we need Obliquity of Date.
    // Astronomy engine has: Ecliptic(vector). 
    // J2000 Ecliptic long = Ecliptic(vector).elon
    // astronomy-engine documentation has `StateVector` ?
}

// Let's read astronomy-engine's docs for rotation.
console.log(Object.keys(astronomy).filter(k => typeof astronomy[k] === 'function'));

