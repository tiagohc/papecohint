export type LevelInfo = {
  level: number;
  pointsIntoLevel: number;
  pointsToNextLevel: number;
  progress: number; // 0..1
};

// Define quanto pontos precisam para subir do nível N para N+1.
// Aqui a curva aumenta a cada nível (cada nível exige mais pontos que o anterior).
export function pointsForNextLevel(level: number) {
  // Ex: nível 1 requer 100, nível 2 requer 200, nível 3 requer 300 etc.
  // Total de pontos para atingir o nível N+1 = 100 * N.
  return 100 * level;
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
  // Exemplo simples: cada 10 pontos equivale a 1 kg de CO₂ evitado.
  return points / 10;
}

export function niceNumber(value: number) {
  return Number(value.toFixed(1));
}
