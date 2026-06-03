import { ChartData, PlanetPosition } from './astrology';

// Jaimini Karakas
export const getJaiminiKarakas = (planets: Record<string, PlanetPosition>) => {
  const pList = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'];
  
  const degrees = pList.map(name => {
    let rawDeg = planets[name]?.degreeInSign || 0;
    if (name === 'Rahu') rawDeg = 30 - rawDeg; // Rahu is retrograde, measured from end of sign
    return { name, rawDeg };
  });

  degrees.sort((a, b) => b.rawDeg - a.rawDeg);

  const roles = ['AK', 'AmK', 'BK', 'MK', 'PiK', 'PK', 'GK', 'DK'];
  const karakaMap: Record<string, string> = {};
  
  degrees.forEach((p, idx) => {
    if (idx < roles.length) {
      karakaMap[p.name] = roles[idx];
    }
  });

  return karakaMap;
};

// Upagrahas (Shadow Planets)
export const calculateUpagrahas = (sunLongitude: number) => {
  const dhuma = (sunLongitude + 133.333333) % 360;
  const vyatipata = (360 - dhuma) % 360;
  const parivesha = (vyatipata + 180) % 360;
  const indrachapa = (360 - parivesha) % 360;
  const upaketu = (indrachapa + 16.666667) % 360;

  return {
    Dhuma: dhuma,
    Vyatipata: vyatipata,
    Parivesha: parivesha,
    Indrachapa: indrachapa,
    Upaketu: upaketu
  };
};

// Natural Relationships
const naturalRelationsMap: Record<string, { friends: string[], neutral: string[], enemies: string[] }> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], neutral: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], neutral: ['Venus', 'Mars', 'Jupiter', 'Saturn'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], neutral: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutral: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutral: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], neutral: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};

export const getPlanetaryRelationships = (planet: string, planets: Record<string, PlanetPosition>) => {
  if (!naturalRelationsMap[planet]) return { natural: 'Neutral', temporary: 'Neutral', compound: 'Neutral' };
  
  const rels = {};
  const ptPos = planets[planet];

  // We could calculate per-planet relations here, but usually it returns a map for all other planets
  const results: Record<string, any> = {};
  const otherPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  
  for (const other of otherPlanets) {
    if (other === planet) continue;
    
    // Natural
    let natural = 'Neutral';
    if (naturalRelationsMap[planet].friends.includes(other)) natural = 'Friend';
    if (naturalRelationsMap[planet].enemies.includes(other)) natural = 'Enemy';

    // Temporary (Tatkalika) - 2, 3, 4, 10, 11, 12 from planet are temporary friends. 1, 5, 6, 7, 8, 9 are enemies.
    const dist = ((planets[other].sign - ptPos.sign + 12) % 12) + 1;
    const tempFriendHouses = [2, 3, 4, 10, 11, 12];
    const temporary = tempFriendHouses.includes(dist) ? 'Friend' : 'Enemy';

    // Compound (Panchadhavargiya)
    let compound = 'Neutral';
    if (natural === 'Friend' && temporary === 'Friend') compound = 'Great Friend';
    else if (natural === 'Friend' && temporary === 'Enemy') compound = 'Neutral';
    else if (natural === 'Enemy' && temporary === 'Friend') compound = 'Neutral';
    else if (natural === 'Enemy' && temporary === 'Enemy') compound = 'Great Enemy';
    else if (natural === 'Neutral' && temporary === 'Friend') compound = 'Friend';
    else if (natural === 'Neutral' && temporary === 'Enemy') compound = 'Enemy';

    results[other] = { natural, temporary, compound };
  }

  return results;
};

// Arudha Padas
export const getArudhaPadas = (houses: any[], planets: Record<string, PlanetPosition>) => {
  // Arudha Pada for each house (A1 - A12)
  const padas: Record<number, number> = {};
  
  for (let i = 1; i <= 12; i++) {
    const houseData = houses[i - 1]; // 0-indexed array
    const lordName = houseData.lord;
    
    if (lordName && planets[lordName]) {
      const lordSign = planets[lordName].sign;
      const rasiSign = houseData.sign;
      
      const distance = ((lordSign - rasiSign + 12) % 12); // steps forward (0 means same sign)
      let padaSign = ((lordSign + distance - 1) % 12) + 1;
      
      // Exception Rules
      if (padaSign === rasiSign) {
        padaSign = ((padaSign + 9) % 12) + 1; // shift to 10th
      } else if (padaSign === ((rasiSign + 6) % 12) + 1) {
        padaSign = ((padaSign + 3) % 12) + 1; // shift to 4th
      }
      
      padas[i] = padaSign;
    }
  }
  
  return padas; // padas[1] is AL, padas[12] is UL
};
