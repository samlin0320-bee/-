import { calculateChart } from 'celestine';
try {
  const d = new Date('2000-01-01T12:00:00Z');
  const c = calculateChart({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    latitude: 0,
    longitude: 0,
    timezone: 0
  }, { includeAsteroids: true, includeLots: true });
  console.log(c.planets.filter(p => p.name === 'Chiron').map(p => p.longitude));
} catch(e) {
  console.log(e);
}
