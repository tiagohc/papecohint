export type LevelInfo = {
  level: number;
  pointsIntoLevel: number;
  pointsToNextLevel: number;
  progress: number; // 0..1
};

// Define quanto pontos precisam para subir do nível N para N+1.
// Aqui a curva aumenta a cada nível (cada nível exige mais pontos que o anterior).
export function pointsForNextLevel(level: number) {
  // Nível 1→2: 100, 2→3: 200, 3→4: 350, 4→5: 550, 5→6: 800...
  // Fórmula: 100 * nível^1.5 (arredondado a dezenas)
  return Math.round(100 * Math.pow(level, 1.5) / 10) * 10;
}

export function getLevelFromPoints(totalPoints: number): LevelInfo {
  let level = 1;
  let remaining = totalPoints;

  while (true) {
    const needed = pointsForNextLevel(level);
    if (remaining < needed) break;

    remaining -= needed;
    level += 1;
  }

  const pointsToNextLevel = pointsForNextLevel(level);

  return {
    level,
    pointsIntoLevel: remaining,
    pointsToNextLevel,
    progress: pointsToNextLevel > 0 ? remaining / pointsToNextLevel : 0,
  };
}

export function carbonSavedFromPoints(points: number) {
  // ~20g de CO₂ por ponto (missão de transporte público = ~50pts = ~1kg CO₂)
  return points * 0.02;
}

export function niceNumber(value: number) {
  return Number(value.toFixed(1));
}
