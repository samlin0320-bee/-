const astronomy = require('astronomy-engine');
const date = new Date('1978-03-20T19:15:00+08:00');
const elon = astronomy.EclipticLongitude(astronomy.Body.Sun, date);
console.log("EclipticLongitude output:", elon);

// What if we use SearchSunLongitude?
console.log("SunPosition elon:", astronomy.Ecliptic(astronomy.GeoVector(astronomy.Body.Sun, new astronomy.AstroTime(date), true)).elon);
