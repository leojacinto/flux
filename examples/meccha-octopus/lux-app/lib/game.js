// Pure game logic for Meccha Octopus. No DOM, no network, so it renders and
// tests the same on server and client.

// Survive when a XOR b equals x AND y.
export const survives = (x, y, a, b) => (a ^ b) === (x & y);

// A classical octopus sees one bit and has four moves.
export const MOVES = [
  {id: 'camo', label: 'Always camo', fn: () => 0},
  {id: 'bold', label: 'Always bold', fn: () => 1},
  {id: 'copy', label: 'Copy the light', fn: light => light},
  {id: 'flip', label: 'Flip the light', fn: light => 1 - light}
];

// 16 strategies: Octo A's move by Octo B's move. Each wins exactly 75% or 25%.
export const strategyId = (iA, iB) => `${MOVES[iA].id}+${MOVES[iB].id}`;

export const play = (iA, iB, x, y) => {
  const a = MOVES[iA].fn(x);
  const b = MOVES[iB].fn(y);
  return {a, b, win: survives(x, y, a, b)};
};

// Exact win rate over the four light settings.
export const exactRate = (iA, iB) => {
  let wins = 0;
  for (const x of [0, 1]) {
    for (const y of [0, 1]) wins += play(iA, iB, x, y).win ? 1 : 0;
  }
  return wins / 4;
};

// Small seeded generator so a match is repeatable and both teams see the same lights.
export const rng = seed => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
};

// Reads the shot pool: sets["x,y"] is "ab ab ab ...". Wraps at the end.
export const makeInk = pool => {
  const cursor = {};
  const sets = {};
  for (const [k, v] of Object.entries(pool?.sets || {})) sets[k] = v.split(' ');
  return (x, y) => {
    const key = `${x},${y}`;
    const list = sets[key];
    if (!list?.length) return null;
    const i = cursor[key] || 0;
    cursor[key] = i + 1;
    const token = list[i % list.length];
    return {a: Number(token[0]), b: Number(token[1]), idx: i % list.length};
  };
};

export const CLASSICAL_CEILING = 0.75;
export const QUANTUM_CEILING = Math.cos(Math.PI / 8) ** 2;

// Pre-written taunt bands, picked by code from the final rate.
export const tauntBand = rate => {
  if (rate >= 0.7) return 'top';
  if (rate >= 0.45) return 'mid';
  return 'low';
};
