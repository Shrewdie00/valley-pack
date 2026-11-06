// Valley: admin toolbox rules (spec 13, docs/decisions-ops.md). Used by server_scripts/valley_ops.js.

// Server-wide buffs: name, default strength (multiplier, or effect level for luck/speed).
global.valleyBuffKinds = {
  xp: { name: "경험치", value: 2 },
  sell: { name: "판매가", value: 1.5 },
  crops: { name: "작물 성장", value: 2 },
  luck: { name: "낚시 운", value: 1 },
  speed: { name: "이동 속도", value: 1 },
};

// Remaining time as m:ss or h:mm:ss.
global.valleyFormatTime = (ms) => {
  let s = Math.max(0, Math.ceil(ms / 1000));
  let h = Math.floor(s / 3600);
  let m = Math.floor((s % 3600) / 60);
  let sec = ("0" + (s % 60)).slice(-2);
  return h > 0 ? `${h}:${("0" + m).slice(-2)}:${sec}` : `${m}:${sec}`;
};

// "1" -> [1, 1], "1-3" -> [1, 3], "all" -> [1, Infinity], else null.
global.valleyRankRange = (text) => {
  text = String(text);
  if (text === "all") return [1, Infinity];
  let m = /^(\d+)(?:-(\d+))?$/.exec(text);
  if (!m) return null;
  let from = Number(m[1]);
  let to = m[2] ? Number(m[2]) : from;
  return from >= 1 && to >= from ? [from, to] : null;
};

// scores = {key: points} -> [[key, points, rank], ...] best first; ties share a rank (1, 1, 3).
global.valleyRanking = (scores) => {
  let rows = Object.keys(scores).map((k) => [k, scores[k]]);
  rows.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  let out = [];
  rows.forEach((r, i) => out.push([r[0], r[1], i > 0 && r[1] === rows[i - 1][1] ? out[i - 1][2] : i + 1]));
  return out;
};
