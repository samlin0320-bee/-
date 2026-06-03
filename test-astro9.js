import Astronomy from 'astronomy-engine';

function findDate() {
  // We know Sun is around Aries 0.28 sidereal.
  // Aries 0.28 sidereal = Tropical ~ 24.28.
  // Sun is at Tropical 24.28 around April 14.
  // Let's search for the year where Sun is at Aries 0.28 sidereal on some date.
  // Actually, the user said "Aries 0.28" which is 0.466 degrees.
  // And it should be "Pisces 29.35", which is 359.583 degrees.
  // The difference is exactly 0.883 degrees.
  console.log("Difference:", 0.466 - 359.583 + 360);
}
findDate();
