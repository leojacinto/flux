// Line-art octopus: a triangulated mesh head and ladder-mesh tentacles, plus
// googly eyes. Pure geometry, no DOM, so it renders the same on server and client.
// Local box is 200 x 270. The head mesh is fixed per seed; tentacles take a
// phase so they can sway without changing their topology.
import {Delaunay} from 'd3-delaunay';
import {rng} from './game.js';

const HEAD = {x: 100, y: 78, r: 60};
const ROWS = 11;
const MAX_EDGE = 34;

// Root x positions under the head, outermost first, and how far each one swings out.
const ROOTS = [
  {x: 58, spread: -46, curl: -1},
  {x: 76, spread: -24, curl: -1},
  {x: 92, spread: -8, curl: 1},
  {x: 108, spread: 8, curl: -1},
  {x: 124, spread: 24, curl: 1},
  {x: 142, spread: 46, curl: 1}
];

const bezier = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  ];
};

// Left and right rails of one tentacle. Row 0 sits inside the head mesh.
const tentacleRails = (root, phase, index) => {
  const sway = Math.sin(phase + index * 1.3) * 7;
  const outer = Math.abs(root.spread) > 30;
  const p0 = [root.x, 132];
  const p1 = [root.x + root.spread * 0.15, 178];
  const p2 = [root.x + root.spread * 1.0 + sway * 0.6, 222];
  const p3 = [root.x + root.spread * 1.15 + root.curl * 24 + sway, outer ? 226 : 258 - Math.abs(root.spread) * 0.3];
  const left = [];
  const right = [];
  for (let i = 0; i < ROWS; i++) {
    const t = i / (ROWS - 1);
    const c = bezier(p0, p1, p2, p3, t);
    const n = bezier(p0, p1, p2, p3, Math.min(1, t + 0.02));
    const dx = n[0] - c[0];
    const dy = n[1] - c[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = 9 * (1 - t) ** 0.8 + 1.5;
    left.push([c[0] - (dy / len) * w, c[1] + (dx / len) * w]);
    right.push([c[0] + (dy / len) * w, c[1] - (dx / len) * w]);
  }
  return {left, right};
};

const insideHead = (x, y, pad = 0) => Math.hypot(x - HEAD.x, y - HEAD.y) <= HEAD.r + pad;

// Fixed head mesh for a seed: rim, inner ring, scattered interior points and the
// tentacle root row, Delaunay triangulated once and trimmed to the head shape.
// Triangles are stored as point indexes so each frame can move the points.
const headMesh = seed => {
  const rand = rng(seed);
  const pts = [];
  const ring = (count, scale, jitter) => {
    for (let i = 0; i < count; i++) {
      const a = ((i + (scale < 1 ? 0.5 : 0)) / count) * Math.PI * 2 + (rand() - 0.5) * jitter;
      const r = HEAD.r * scale * (1 + (rand() - 0.5) * 0.04);
      pts.push([HEAD.x + Math.cos(a) * r, HEAD.y + Math.sin(a) * r]);
    }
  };
  ring(26, 1, 0.1);
  const rimCount = pts.length;
  ring(16, 0.66, 0.25);
  for (let tries = 0; pts.length < rimCount + 30 && tries < 3000; tries++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * HEAD.r * 0.85;
    const p = [HEAD.x + Math.cos(a) * r, HEAD.y + Math.sin(a) * r];
    if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 15)) pts.push(p);
  }
  const fixedFrom = pts.length;
  ROOTS.forEach((root, i) => {
    const {left, right} = tentacleRails(root, 0, i);
    pts.push(left[0], right[0]);
  });
  const tri = Delaunay.from(pts).triangles;
  const triangles = [];
  for (let i = 0; i < tri.length; i += 3) {
    const idx = [tri[i], tri[i + 1], tri[i + 2]];
    const t = idx.map(k => pts[k]);
    const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
    const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    const longest = Math.max(
      Math.hypot(t[0][0] - t[1][0], t[0][1] - t[1][1]),
      Math.hypot(t[1][0] - t[2][0], t[1][1] - t[2][1]),
      Math.hypot(t[2][0] - t[0][0], t[2][1] - t[0][1])
    );
    if (longest > MAX_EDGE) continue;
    if (!insideHead(cx, cy, 2) && cy < HEAD.y) continue;
    if (!insideHead(cx, cy, 2) && (cy > 140 || cx < 50 || cx > 150)) continue;
    triangles.push(idx);
  }
  const grey = pts.map(() => rand() < 0.28);
  return {pts, triangles, grey, rimCount, fixedFrom};
};

const meshCache = new Map();

// Each head node drifts on its own slow loop so the mesh lines stretch and
// breathe. Rim nodes move less to keep the outline round; root nodes stay put
// so the head stays joined to the tentacles.
const drift = (head, phase) =>
  head.pts.map((p, i) => {
    if (i >= head.fixedFrom) return p;
    const amp = i < head.rimCount ? 1.2 : 3;
    return [p[0] + Math.sin(phase * 1.7 + i * 2.1) * amp, p[1] + Math.cos(phase * 1.3 + i * 1.7) * amp];
  });

// Full octopus for one frame. `phase` drives the mesh drift and tentacle sway,
// `look` (-1..1) moves the pupils.
export const octopus = ({seed = 7, phase = 0, look = 0} = {}) => {
  if (!meshCache.has(seed)) meshCache.set(seed, headMesh(seed));
  const head = meshCache.get(seed);
  const pts = drift(head, phase);
  const edges = new Map();
  const addEdge = (a, b, w) => {
    const key = a[0] < b[0] ? `${a}|${b}` : `${b}|${a}`;
    if (!edges.has(key)) edges.set(key, [a[0], a[1], b[0], b[1], w]);
  };
  const fills = head.triangles.map(idx => idx.map(k => pts[k]));
  fills.forEach(t => {
    addEdge(t[0], t[1], 1);
    addEdge(t[1], t[2], 1);
    addEdge(t[2], t[0], 1);
  });
  const nodes = pts.map((p, i) => ({x: p[0], y: p[1], grey: head.grey[i]}));
  ROOTS.forEach((root, ti) => {
    const {left, right} = tentacleRails(root, phase, ti);
    for (let i = 1; i < ROWS; i++) {
      addEdge(left[i - 1], left[i], 1.2);
      addEdge(right[i - 1], right[i], 1.2);
      addEdge(left[i], right[i], 0.8);
      if (i % 2) addEdge(left[i - 1], right[i], 0.6);
      else addEdge(right[i - 1], left[i], 0.6);
      fills.push([left[i - 1], right[i - 1], right[i], left[i]]);
      nodes.push({x: left[i][0], y: left[i][1], grey: (i + ti) % 3 === 0});
      nodes.push({x: right[i][0], y: right[i][1], grey: (i + ti) % 4 === 0});
    }
    // Tentacle tip.
    nodes.push({x: (left[ROWS - 1][0] + right[ROWS - 1][0]) / 2, y: (left[ROWS - 1][1] + right[ROWS - 1][1]) / 2, grey: false, tip: true});
  });
  const p = look * 4;
  return {
    edges: [...edges.values()],
    nodes,
    fills,
    eyes: [
      {x: 78, y: 80, r: 16, px: 78 + p, py: 84},
      {x: 122, y: 80, r: 16, px: 122 + p, py: 84}
    ]
  };
};
