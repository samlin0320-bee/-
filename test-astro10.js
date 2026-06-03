import Astronomy from 'astronomy-engine';

const date = new Date('1980-04-14T00:00:00Z');
const time = new Astronomy.AstroTime(date);

const vec = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
const ecl = Astronomy.Ecliptic(vec);
console.log("Ecliptic(vec):", ecl.elon);

// What if we change the time of the vector?
const vec2 = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
vec2.t = new Astronomy.AstroTime(new Date('2000-01-01T12:00:00Z'));
const ecl2 = Astronomy.Ecliptic(vec2);
console.log("Ecliptic(vec2 with J2000 time):", ecl2.elon);
