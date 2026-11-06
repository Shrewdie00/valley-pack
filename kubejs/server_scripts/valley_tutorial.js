// Valley: town tutorial (docs/decisions-onboarding.md), started by valley_signup.js after signing up. Texts and
// rules in startup_scripts/valley_tutorial_rules.js. Progress is player data: valleyTutorial = step 1..8 (0 = not
// started, 9 = finished or skipped), valleyTutorialFarm = farming bits.
//   /튜토리얼            show the current step again
//   /튜토리얼 다음        next, on info steps (the chat [다음] button runs it)
//   /튜토리얼 건너뛰기    stop the tutorial (no reward)
const ValleySeasonHelper = Java.loadClass("sereneseasons.api.season.SeasonHelper");

const valleyTutorialStep = (player) => player.persistentData.getInt("valleyTutorial");

const valleyTutorialShow = (player) => {
  let step = valleyTutorialStep(player);
  if (step < 1 || step > global.valleyTutorialSteps.length) {
    player.paint({ valleyTutorial: { remove: true } });
    return;
  }
  player.paint({
    valleyTutorial: {
      type: "text",
      text: global.valleyTutorialHud(step, player.persistentData.getInt("valleyTutorialFarm")),
      x: 0, y: 4, alignX: "center", alignY: "top", color: "#FFFF55", shadow: true,
    },
  });
  let s = global.valleyTutorialSteps[step - 1];
  if (s.kind !== "info") return;
  s.lines.forEach((line) => player.tell(Text.aqua(line)));
  player.tell(Text.green("[다음]").clickRunCommand("/튜토리얼 다음").hover("눌러서 다음 단계로"));
};

global.valleyTutorialStart = (player) => {
  player.persistentData.putInt("valleyTutorial", 1);
  player.persistentData.putInt("valleyTutorialFarm", 0);
  player.tell(Text.gold("마을 튜토리얼을 시작해요! 화면 위의 '지금 할 일'을 따라 해 보세요. (/튜토리얼 건너뛰기)"));
  valleyTutorialShow(player);
};

// Seeds the market sells right now, read from its shop file (falls back to wheat seeds).
const valleyTutorialSeedsNow = (player) => {
  try {
    let shop = JsonIO.read("kubejs/data/society_trading/shops/market.json");
    let trades = [];
    shop.trades.forEach((t) => {
      let seasons = [];
      if (t.seasons_required) t.seasons_required.forEach((s) => seasons.push(String(s)));
      trades.push({ item: String(t.offer.item), seasons: seasons });
    });
    let sub = String(ValleySeasonHelper.getSeasonState(player.level).getSubSeason().name()).toLowerCase();
    let seeds = global.valleyTutorialSeeds(trades, sub, global.valleyTutorialReward.seedKinds);
    if (seeds.length) return seeds;
  } catch (err) {
    console.warn(`[Valley] tutorial seeds: ${err}`);
  }
  return ["minecraft:wheat_seeds"];
};

const valleyTutorialFinish = (player) => {
  let r = global.valleyTutorialReward;
  global.valleyDeposit(player, r.money);
  player.give(Item.of("society:town_return_scroll", r.scrolls));
  valleyTutorialSeedsNow(player).forEach((id) => player.give(Item.of(id, r.seedCount)));
  player.tell(Text.gold(`튜토리얼 완료! 보상: ${r.money}원, 마을 귀환 주문서 ${r.scrolls}장, 제철 씨앗. 즐거운 밸리 생활 되세요!`));
};

// Moves on from `from` (only if the player is on that step).
const valleyTutorialAdvance = (player, from) => {
  if (valleyTutorialStep(player) !== from) return;
  player.persistentData.putInt("valleyTutorial", from + 1);
  if (from + 1 > global.valleyTutorialSteps.length) valleyTutorialFinish(player);
  else player.tell(Text.green(`✔ ${from}단계 완료!`));
  valleyTutorialShow(player);
};

const valleyTutorialFarm = (player, bit) => {
  if (valleyTutorialStep(player) !== 3) return;
  let farm = player.persistentData.getInt("valleyTutorialFarm");
  if (farm & bit) return;
  farm |= bit;
  player.persistentData.putInt("valleyTutorialFarm", farm);
  if (farm === global.valleyFarmDone) valleyTutorialAdvance(player, 3);
  else valleyTutorialShow(player);
};

PlayerEvents.loggedIn((e) => valleyTutorialShow(e.player));

// 1: talk to a town NPC (same entity types as npcs/npcInteraction.js).
ItemEvents.entityInteracted((e) => {
  if (e.hand != "MAIN_HAND" || valleyTutorialStep(e.player) !== 1) return;
  if (["easy_npc:humanoid", "easy_npc:humanoid_slim"].indexOf(String(e.target.type)) >= 0) valleyTutorialAdvance(e.player, 1);
});

// 2: standing on my plot; 3: seeds in the inventory count as bought.
ServerEvents.tick((e) => {
  if (e.server.tickCount % 20 !== 10) return;
  e.server.players.forEach((player) => {
    let step = valleyTutorialStep(player);
    if (step === 2) {
      let town = valleyTownChunk(e.server);
      let plot = valleyPlotOf(e.server, player.uuid);
      if (!town || !plot || String(player.level.dimension) !== "minecraft:overworld") return;
      let cx = Math.floor(player.x) >> 4;
      let cz = Math.floor(player.z) >> 4;
      let mine = global.valleyPlotChunks(town, valleyCellOf(plot), plot.getInt("level")).some((c) => c[0] === cx && c[1] === cz);
      if (mine) valleyTutorialAdvance(player, 2);
    } else if (step === 3 && !(player.persistentData.getInt("valleyTutorialFarm") & 1)) {
      let hasSeeds = false;
      player.inventory.items.forEach((stack) => {
        if (String(stack.id).indexOf("seed") >= 0) hasSeeds = true;
      });
      if (hasSeeds) valleyTutorialFarm(player, 1);
    }
  });
});

BlockEvents.rightClicked((e) => {
  let player = e.player;
  let step = valleyTutorialStep(player);
  if (step !== 3 && step !== 5) return;
  let item = String(e.item.id);
  let block = String(e.block.id);
  if (step === 5) {
    if (block.indexOf("shipping_bin") >= 0) valleyTutorialAdvance(player, 5);
    return;
  }
  if (item.endsWith("_hoe") && ["minecraft:grass_block", "minecraft:dirt", "minecraft:coarse_dirt", "minecraft:dirt_path"].indexOf(block) >= 0) valleyTutorialFarm(player, 2);
  if (item.indexOf("watering_can") >= 0) valleyTutorialFarm(player, 8);
});

// 3: a seed placed on farmland.
BlockEvents.placed((e) => {
  if (!e.player || valleyTutorialStep(e.player) !== 3) return;
  if (String(e.block.down.id).indexOf("farmland") >= 0) valleyTutorialFarm(e.player, 4);
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands } = e;
  const self = (ctx, fn) => {
    let player = ctx.source.player;
    if (!player) return 0;
    fn(player);
    return 1;
  };
  e.register(
    Commands.literal("튜토리얼")
      .executes((ctx) => self(ctx, (p) => {
        if (valleyTutorialStep(p) < 1 || valleyTutorialStep(p) > global.valleyTutorialSteps.length) p.tell(Text.gray("진행 중인 튜토리얼이 없어요."));
        else valleyTutorialShow(p);
      }))
      .then(Commands.literal("다음").executes((ctx) => self(ctx, (p) => {
        let step = valleyTutorialStep(p);
        if (step >= 1 && step <= global.valleyTutorialSteps.length && global.valleyTutorialSteps[step - 1].kind === "info") valleyTutorialAdvance(p, step);
      })))
      .then(Commands.literal("건너뛰기").executes((ctx) => self(ctx, (p) => {
        if (valleyTutorialStep(p) < 1 || valleyTutorialStep(p) > global.valleyTutorialSteps.length) return;
        p.persistentData.putInt("valleyTutorial", global.valleyTutorialSteps.length + 1);
        valleyTutorialShow(p);
        p.tell(Text.gray("튜토리얼을 건너뛰었어요. (보상은 없어요)"));
      })))
  );
});
