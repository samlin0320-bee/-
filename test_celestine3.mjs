import { calculateChart } from 'celestine';
const chart = calculateChart({
  date: new Date('2000-01-01T12:00:00Z'),
  latitude: 51.5,
  longitude: -0.1,
  houseSystem: 'placidus'
});
console.log(Object.keys(chart.positions));
console.log(chart.positions.Chiron);
