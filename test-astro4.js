import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const vec1 = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
const ecl1 = Astronomy.Ecliptic(vec1);

console.log("GeoVector J2000 elon:", ecl1.elon);

// Equator of date
const eq = Astronomy.Equator(Astronomy.Body.Sun, time, Astronomy.MakeObserver(0, 0, 0), true, true);
console.log("Equator of date ra:", eq.ra, "dec:", eq.dec);

// Convert Equator of date to Ecliptic of date
// We can use Astronomy.RotationMatrix?
// Actually, Astronomy.Equator returns an Equatorial object.
// Ecliptic longitude of date can be found using the obliquity of date.
// But wait, astronomy-engine has `Astronomy.EclipticLongitude`? No.
// Let's look at the source or docs for astronomy-engine.
// Is there a way to get ecliptic coordinates of date?
// Astronomy.SunPosition(time) returns J2000 ecliptic coordinates?
// Let's check Astronomy.Ecliptic(eq.vec) - wait, eq doesn't have vec.
