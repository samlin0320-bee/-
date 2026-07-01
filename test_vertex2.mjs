import Astronomy from 'astronomy-engine';

const date = new Date('2000-01-01T12:00:00Z');
const lat = 51.5;
const lng = -0.1;

const time = new Astronomy.AstroTime(date);
const gmstHours = Astronomy.SiderealTime(time);
const lstHours = (gmstHours + lng / 15.0) % 24.0;
const lstDegrees = lstHours * 15.0;
const ramc = lstDegrees * (Math.PI / 180);
const eps = 23.4392911 * (Math.PI / 180); // OBLIQUITY
const latRad = lat * (Math.PI / 180);

const yVx = Math.cos(ramc + Math.PI) * Math.sin(latRad);
const xVx = -Math.sin(ramc + Math.PI) * Math.cos(eps) * Math.sin(latRad) - Math.cos(latRad) * Math.sin(eps);
let vxDeg = Math.atan2(yVx, xVx) * (180 / Math.PI);
if (vxDeg < 0) vxDeg += 360;

console.log("Vertex:", vxDeg);
