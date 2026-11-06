// Valley: the town tutorial after signing up (docs/decisions-onboarding.md). server_scripts/valley_tutorial.js
// tracks progress; this file is the text and the rules. kind "do" steps finish by doing it, "info" by [다음].
// Keys are the pack defaults (configureddefaults/options.txt): skills K, quests `, map M.
global.valleyTutorialSteps = [
  { kind: "do", hud: "마을 둘러보기: 상점 NPC에게 말을 걸어 보세요" },
  { kind: "do", hud: "내 부지로 걸어가 보세요 (/부지 로 위치 보기)" },
  { kind: "do", hud: "농사 기초" },
  {
    kind: "info",
    hud: "하루와 계절 (채팅의 [다음])",
    lines: [
      "하루는 30분이에요. 작물은 매일 아침 6시에 자라요.",
      "계절은 봄·여름·가을·겨울이 돌아가요. 제철이 아닌 작물은 느리게 자라고 싸게 팔려요.",
    ],
  },
  { kind: "do", hud: "출하상자를 열어 작물을 넣어 보세요" },
  {
    kind: "info",
    hud: "돈 (채팅의 [다음])",
    lines: [
      "출하상자에 넣은 것은 다음 날 아침에 팔려서 계좌로 들어와요. 잔액은 화면에 보여요.",
      "상점에서는 계좌에서 바로 내요. 친구에게는 웅크리고 빈손으로 서로 우클릭하면 거래 창, 은행 단말기로 송금도 돼요.",
    ],
  },
  {
    kind: "info",
    hud: "기술 트리 (채팅의 [다음])",
    lines: ["K 키로 기술 트리를 열어요. 농사·축산·낚시·채광·모험을 하면 점수가 쌓이고, 특성을 찍으면 좋은 도구를 쓸 수 있어요."],
  },
  {
    kind: "info",
    hud: "커뮤니티 센터와 도감 (채팅의 [다음])",
    lines: ["` 키(숫자 1 왼쪽)로 퀘스트 책을 열면 커뮤니티 센터와 도감이 있어요. M 키는 지도예요. 서버에서 처음 찾은 물건은 모두에게 알려져요!"],
  },
];

// Farming sub-steps (step 3), done in any order: bits of a number.
global.valleyFarmParts = [
  [1, "씨앗 사기"],
  [2, "흙 갈기"],
  [4, "심기"],
  [8, "물 주기"],
];
global.valleyFarmDone = 15;

// The line shown at the top of the screen for a step (1..8) and farming bits.
global.valleyTutorialHud = (step, farm) => {
  let s = global.valleyTutorialSteps[step - 1];
  let text = s.hud;
  if (step === 3) {
    text += ": " + global.valleyFarmParts.map((p) => `${(farm & p[0]) ? "✔" : "□"} ${p[1]}`).join("  ");
  }
  return `지금 할 일 (${step}/${global.valleyTutorialSteps.length}) ${text}`;
};

// Reward for finishing (not for skipping).
global.valleyTutorialReward = { money: 1000, scrolls: 3, seedKinds: 3, seedCount: 8 };

// Up to n seed items the market sells in this sub season ("early_spring"...). trades = [{item, seasons}].
global.valleyTutorialSeeds = (trades, subSeason, n) => {
  let out = [];
  trades.forEach((t) => {
    if (out.length >= n || String(t.item).indexOf("seed") < 0) return;
    if (t.seasons && t.seasons.length && t.seasons.indexOf(subSeason) < 0) return;
    if (out.indexOf(t.item) < 0) out.push(t.item);
  });
  return out;
};
