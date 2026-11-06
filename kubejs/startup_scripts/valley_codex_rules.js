// Valley: codex records (spec 11). Per player and codex item: the day it was first had and the best quality seen
// (Quality Food levels 0 none, 1 iron, 2 gold, 3 diamond). Stored as "day|quality". Used by server_scripts/valley_codex.js.
// Fish size is not recorded: Aquaculture's fish weight is off in this pack (weighted fish would not stack).
global.valleyQualityNames = ["보통", "철", "금", "다이아"];

// The new record string, or null when nothing changed.
global.valleyCodexRecordMerge = (prev, day, quality) => {
  if (!prev) return `${day}|${quality}`;
  let parts = String(prev).split("|");
  let best = Number(parts[1]) || 0;
  return quality > best ? `${parts[0]}|${quality}` : null;
};

// "day|quality" -> { day, quality }
global.valleyCodexRecordRead = (rec) => {
  let parts = String(rec).split("|");
  return { day: Number(parts[0]) || 0, quality: Number(parts[1]) || 0 };
};
