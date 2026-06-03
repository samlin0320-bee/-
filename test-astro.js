import Astronomy from 'astronomy-engine';
const { Body, AstroTime, GeoVector, Ecliptic, Equator } = Astronomy;

const date = new Date('1980-04-14T00:00:00Z');
const time = new AstroTime(date);

const vec1 = GeoVector(Body.Sun, time, true);
const ecl1 = Ecliptic(vec1);

const eq = Equator(Body.Sun, time, true, true, true);
const ecl2 = Ecliptic(eq.vec);

console.log("Method 1 (GeoVector):", ecl1.elon);
console.log("Method 2 (Equator of date):", ecl2.elon);
