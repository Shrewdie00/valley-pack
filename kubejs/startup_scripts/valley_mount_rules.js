// Valley: mount gacha (spec 9.2, docs/decisions-mounts.md). Edit this file and /reload to change mounts, rates and
// prices. Used by server_scripts/valley_mount.js. Phase 1: vanilla horse-family bodies; the legendary is a stand-in
// until Dragon Mounts (phase 2).

// grade: draw rate (%), speed (x average horse), duplicate shards, exchange cost in shards.
global.valleyMountGrades = {
  common: { name: "일반", rate: 60, speed: 1.3, shard: 1, cost: 10, color: "white" },
  rare: { name: "레어", rate: 28, speed: 1.4, shard: 3, cost: 30, color: "aqua" },
  epic: { name: "희귀", rate: 10, speed: 1.5, shard: 10, cost: 100, color: "light_purple" },
  legendary: { name: "전설", rate: 2, speed: 1.6, shard: 40, cost: 400, color: "gold" },
};
global.valleyMountGradeOrder = ["common", "rare", "epic", "legendary"];

global.valleyGachaPrice = { one: 2000, ten: 18000 };
global.valleyGachaPity = 80; // a legendary at the latest on this draw

// Horse looks: variant = color + 256 * markings.
// colors: 0 white, 1 creamy, 2 chestnut, 3 brown, 4 black, 5 gray, 6 dark brown
// markings: 0 none, 1 white stockings, 2 white field, 3 white dots, 4 black dots
// abilities: jump (high jump), swim (floats and swims), glide (falls slowly), glow (outline)
// limited: only in the draw while an admin turns it on (/valley mount limited <id> on)
global.valleyMounts = [
  { id: "brown_pony", grade: "common", name: "갈색 조랑말", entity: "minecraft:horse", variant: 3 },
  { id: "chestnut", grade: "common", name: "밤색 말", entity: "minecraft:horse", variant: 2 },
  { id: "creamy", grade: "common", name: "크림 말", entity: "minecraft:horse", variant: 1 },
  { id: "gray", grade: "common", name: "회색 말", entity: "minecraft:horse", variant: 5 },
  { id: "dark_brown", grade: "common", name: "흑갈색 말", entity: "minecraft:horse", variant: 6 },
  { id: "white_socks", grade: "common", name: "하얀 양말 말", entity: "minecraft:horse", variant: 2 + 256 * 1 },
  { id: "spotted", grade: "common", name: "얼룩 말", entity: "minecraft:horse", variant: 3 + 256 * 3 },
  { id: "dalmatian", grade: "common", name: "검은 점 흰말", entity: "minecraft:horse", variant: 0 + 256 * 4 },
  { id: "donkey", grade: "common", name: "들판 당나귀", entity: "minecraft:donkey" },
  { id: "mule", grade: "common", name: "튼튼한 노새", entity: "minecraft:mule" },

  { id: "white", grade: "rare", name: "백마", entity: "minecraft:horse", variant: 0, abilities: ["jump"] },
  { id: "black", grade: "rare", name: "흑마", entity: "minecraft:horse", variant: 4, abilities: ["jump"] },
  { id: "night_sky", grade: "rare", name: "밤하늘 말", entity: "minecraft:horse", variant: 4 + 256 * 3, abilities: ["jump"] },
  { id: "silver_mane", grade: "rare", name: "은빛 갈기", entity: "minecraft:horse", variant: 5 + 256 * 2, abilities: ["jump"] },
  { id: "cream_star", grade: "rare", name: "크림 별무늬", entity: "minecraft:horse", variant: 1 + 256 * 3, abilities: ["jump"] },
  { id: "river_mule", grade: "rare", name: "개울 노새", entity: "minecraft:mule", abilities: ["jump"] },

  { id: "cloud", grade: "epic", name: "구름 말", entity: "minecraft:horse", variant: 0 + 256 * 2, abilities: ["glide", "jump"] },
  { id: "shadow", grade: "epic", name: "그림자 말", entity: "minecraft:horse", variant: 4 + 256 * 2, abilities: ["glide", "jump"] },
  { id: "zombie", grade: "epic", name: "좀비말", entity: "minecraft:zombie_horse", abilities: ["glide", "swim"] },
  { id: "skeleton", grade: "epic", name: "해골말", entity: "minecraft:skeleton_horse", abilities: ["glide", "swim"] },

  { id: "glowing_skeleton", grade: "epic", name: "빛나는 해골말", entity: "minecraft:skeleton_horse", abilities: ["glide", "jump", "swim", "glow"] },

  // Mythic Mounts (horse-based, so the same summon works). Ground and climbing ones are rare/epic, swimmers epic,
  // flyers legendary (spec: only legendaries fly). Their own abilities come with the body.
  { id: "dire_wolf", grade: "rare", name: "다이어울프", entity: "mythicmounts:direwolf" },
  { id: "courier_bird", grade: "rare", name: "배달새", entity: "mythicmounts:courierbird" },
  { id: "riding_lizard", grade: "rare", name: "승용 도마뱀", entity: "mythicmounts:ridinglizard" },
  { id: "geckotoa", grade: "rare", name: "왕 게코토아", entity: "mythicmounts:geckotoalizard" },
  { id: "nightmare", grade: "epic", name: "나이트메어", entity: "mythicmounts:nightmare", abilities: ["jump"] },
  { id: "acencia", grade: "epic", name: "아센시아 (벽 타기)", entity: "mythicmounts:acencia" },
  { id: "archelon", grade: "epic", name: "아르켈론 (바다거북)", entity: "mythicmounts:archelon" },
  { id: "nudibranch", grade: "epic", name: "왕 갯민숭달팽이", entity: "mythicmounts:nudibranch" },

  { id: "dragon", grade: "legendary", name: "용", entity: "mythicmounts:dragon" },
  { id: "firebird", grade: "legendary", name: "불새 자르프타크", entity: "mythicmounts:firebird" },
  { id: "griffon", grade: "legendary", name: "그리폰", entity: "mythicmounts:griffon" },
  { id: "colelytra", grade: "legendary", name: "콜엘리트라", entity: "mythicmounts:colelytra" },
  { id: "moth", grade: "legendary", name: "왕 나방", entity: "mythicmounts:moth" },
  { id: "nether_bat", grade: "legendary", name: "네더 박쥐", entity: "mythicmounts:netherbat" },

  { id: "maple", grade: "rare", name: "단풍 말 (가을 한정)", entity: "minecraft:horse", variant: 2 + 256 * 2, abilities: ["jump"], limited: true },
];

// Flying mounts (spec 9.2: limited flight): highest y per world, top horizontal speed in blocks per tick, and no
// flying over the town (they sink to the ground there). Applied on the rider's client (valley mod MountClient).
global.valleyMountFlyers = ["mythicmounts:dragon", "mythicmounts:firebird", "mythicmounts:griffon", "mythicmounts:colelytra", "mythicmounts:moth", "mythicmounts:netherbat"];
global.valleyFlyCeiling = { "minecraft:overworld": 130, "valley:wild": 200 };
global.valleyFlyCeilingDefault = 200;
global.valleyFlyMaxSpeed = 0.9;

// The town's block box [minX, minZ, maxX, maxZ] from its centre chunk: the middle 3x3 plot cells (valley_land_rules.js).
global.valleyTownBox = (townChunk) => {
  let r = global.valleyPlotCell + (global.valleyPlotCell - 1) / 2; // 7 + 3 chunks from the centre chunk
  return [(townChunk[0] - r) * 16, (townChunk[1] - r) * 16, (townChunk[0] + r) * 16 + 15, (townChunk[1] + r) * 16 + 15];
};

global.valleyMountById = (id) => global.valleyMounts.filter((m) => m.id === id)[0] || null;

// Mounts that can come out of a draw for a grade. limitedOn(id) -> boolean.
global.valleyMountPool = (grade, limitedOn) =>
  global.valleyMounts.filter((m) => m.grade === grade && (!m.limited || limitedOn(m.id)));

// One draw. rng() -> 0..1 (called twice), pity = draws since the last legendary.
// Returns { grade, id, pity } with the new pity count.
global.valleyGachaRoll = (rng, pity, limitedOn) => {
  let grade = "legendary";
  if (pity + 1 < global.valleyGachaPity) {
    let at = rng() * 100;
    let order = global.valleyMountGradeOrder;
    grade = order[order.length - 1];
    for (let i = 0; i < order.length; i++) {
      at -= global.valleyMountGrades[order[i]].rate;
      if (at < 0) {
        grade = order[i];
        break;
      }
    }
  } else rng();
  let pool = global.valleyMountPool(grade, limitedOn);
  let mount = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  return { grade: grade, id: mount.id, pity: grade === "legendary" ? 0 : pity + 1 };
};

// What the attribute values become for a mount.
global.valleyMountStats = (mount) => {
  let abilities = mount.abilities || [];
  return {
    speed: 0.225 * global.valleyMountGrades[mount.grade].speed,
    jump: abilities.indexOf("jump") >= 0 ? 1.0 : 0.7,
  };
};
