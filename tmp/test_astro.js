const astronomy = require('astronomy-engine');

const date = new Date('1978-03-20T19:15:00Z'); // Note: The prompt says 19:15, probably local time. Let's use UTC for test.
const time = new astronomy.AstroTime(date);

// J2000 Ecliptic
const sunVecJ2000 = astronomy.GeoVector(astronomy.Body.Sun, time, true);
const sunEclJ2000 = astronomy.Ecliptic(sunVecJ2000);
console.log("Sun J2000 Ecliptic:", sunEclJ2000.elon);

// Equator of Date -> Ecliptic of Date (Tropical)
const observer = new astronomy.Observer(0, 0, 0);
const sunEqDate = astronomy.Equator(astronomy.Body.Sun, time, observer, true, true);
// Does Ecliptic function accept Equator object? Let's try.
try {
  const sunEclDate = astronomy.Ecliptic(sunEqDate.vec); // Wait, Equator returns an Equator object which has ra, dec, vec
  console.log("Sun Tropical Ecliptic:", sunEclDate.elon);
} catch (e) {
  console.log("Error:", e.message);
}
