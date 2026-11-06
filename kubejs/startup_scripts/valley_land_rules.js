// Valley: farm plots (spec 4, docs/decisions-land.md). The farm world (overworld, flat) is a grid of 7x7-chunk
// cells centred on the town chunk. The town is the 3x3 cells in the middle; plots are the rings around it.
// A plot owns the middle 3x3 chunks of its cell, then 5x5 and 7x7 after expansion deeds.
global.valleyPlotCell = 7;
global.valleyPlotSizes = [3, 5, 7];
global.valleyPlotRingsOpen = 2; // rings 1+2 = 40 plots; /valley plot rings <n> overrides it per world

// Cells [x, z] of ring r (1 = next to the town), walking round the ring from the top-left corner.
global.valleyRingCells = (r) => {
  let n = r + 1;
  let out = [];
  for (let i = -n; i < n; i++) out.push([i, -n]);
  for (let i = -n; i < n; i++) out.push([n, i]);
  for (let i = n; i > -n; i--) out.push([i, n]);
  for (let i = n; i > -n; i--) out.push([-n, i]);
  return out;
};

// First free cell in rings 1..rings, or null. taken(key) -> boolean, key is "x,z".
global.valleyNextFreeCell = (rings, taken) => {
  for (let r = 1; r <= rings; r++) {
    let cells = global.valleyRingCells(r);
    for (let i = 0; i < cells.length; i++) {
      if (!taken(`${cells[i][0]},${cells[i][1]}`)) return cells[i];
    }
  }
  return null;
};

// Chunks [x, z] a plot owns at a level (0, 1, 2). townChunk = [x, z] of the town centre chunk.
global.valleyPlotChunks = (townChunk, cell, level) => {
  let half = (global.valleyPlotSizes[level] - 1) / 2;
  let cx = townChunk[0] + cell[0] * global.valleyPlotCell;
  let cz = townChunk[1] + cell[1] * global.valleyPlotCell;
  let out = [];
  for (let x = cx - half; x <= cx + half; x++) for (let z = cz - half; z <= cz + half; z++) out.push([x, z]);
  return out;
};

// Rough Stardew ground: what to put on a grass column, by weight; most columns stay empty.
global.valleyDebris = [
  ["minecraft:grass", 60],
  ["twigs:twig", 18],
  ["twigs:pebble", 18],
  ["minecraft:cobblestone", 8],
  ["minecraft:oak_sapling", 4],
  ["minecraft:oak_log", 4], // stump
];
global.valleyDebrisChance = 0.12;

// The debris block for a random roll pair (0..1, 0..1), or null for bare grass.
global.valleyDebrisFor = (roll, pick) => {
  if (roll >= global.valleyDebrisChance) return null;
  let total = global.valleyDebris.reduce((s, d) => s + d[1], 0);
  let at = pick * total;
  for (let i = 0; i < global.valleyDebris.length; i++) {
    at -= global.valleyDebris[i][1];
    if (at < 0) return global.valleyDebris[i][0];
  }
  return global.valleyDebris[global.valleyDebris.length - 1][0];
};
