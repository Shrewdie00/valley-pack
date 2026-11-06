// Valley: the title list (spec 10). Edit here and run /reload; titles made in game with /valley title create are
// kept in the world instead.
//   id     lowercase letters, digits, _ (never change it once players own the title)
//   name   what shows in the brackets
//   color  Minecraft color name: white gray gold yellow green aqua blue light_purple red ...
//   how    how it is earned (shown in /칭호 목록): join, quest, codex, first, event, hidden, shop, admin
//   stage  (optional) given automatically when the player gets this stage
global.valleyTitleList = [
  { id: "newcomer", name: "새내기", color: "white", how: "join" },
  { id: "pioneer", name: "개척자", color: "green", how: "quest", stage: "abandoned_farm_complete" },
  { id: "engineer", name: "기계공", color: "yellow", how: "quest", stage: "boiler_room_complete" },
  { id: "patron", name: "후원자", color: "gold", how: "quest", stage: "vault_complete" },
  { id: "town_hero", name: "마을의 영웅", color: "light_purple", how: "quest", stage: "community_center_complete" },
];

// Codex titles (spec 11): a first discovery on the server, and 25/50/75/100% of each collection chapter.
global.valleyCodexChapters = {
  crops: "작물", fishing: "물고기", banners: "요리", drinks: "음료", minerals: "광물", gems: "보석",
  longwings: "나비", relics: "렐릭", artifacts: "아티팩트", slimes: "슬라임",
};
global.valleyCodexTiers = [
  [25, "입문", "white"],
  [50, "애호가", "green"],
  [75, "전문가", "aqua"],
  [100, "마스터", "light_purple"],
];
global.valleyTitleList.push({ id: "first_finder", name: "발견자", color: "gold", how: "first" });
Object.keys(global.valleyCodexChapters).forEach((chapter) => {
  global.valleyCodexTiers.forEach((tier) => {
    global.valleyTitleList.push({
      id: `codex_${chapter}_${tier[0]}`,
      name: `${global.valleyCodexChapters[chapter]} ${tier[1]}`,
      color: tier[2],
      how: "codex",
    });
  });
});

// Codex title ids a chapter earns at this completion percentage.
global.valleyCodexTitleIds = (chapter, percent) =>
  global.valleyCodexChapters[chapter]
    ? global.valleyCodexTiers.filter((t) => percent >= t[0]).map((t) => `codex_${chapter}_${t[0]}`)
    : [];
