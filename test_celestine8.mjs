import { calculateChart } from 'celestine';
try {
  const c = calculateChart({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, latitude: 0, longitude: 0, timezone: 0 }, { includeAsteroids: true, includeLots: true });
  console.log(c.angles);
} catch(e) {
  console.log(e);
}
