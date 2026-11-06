// Valley: admin toolbox (spec 13, docs/decisions-ops.md). Everything is a /valley command; /valley menu shows a
// clickable list. Rules in startup_scripts/valley_ops_rules.js; the treasure item and XP hook in startup_scripts/valley_ops.js.
//   /valley announce now <text> | in <minutes> <text> | clear big title, top bar for 10 s, chat
//   /valley event criteria manual|treasure|delivery [item id] | start <minutes> <name> | stop
//                 save <preset> | load <preset> | presets
//   /valley score add <mc name> <n> | reset | show            sidebar ranking while an event runs
//   /valley treasure mark | clear                              points where treasure appears at event start
//   /valley delivery set                                        the block you look at becomes the delivery box
//   /valley reward <1|1-3|all> money <n> | item <id> <count> | title <id>   by the last event's ranking
//   /valley gather now | ask                                    pull everyone here / ask them (/모이기)
//   /valley buff <xp|sell|crops|luck|speed> <minutes> [strength] | stop <kind>
//   /valley shop on|off                                         event shop for players (/이벤트상점)
// State is one JSON string in the server's persistent data ("valleyOps").

const valleyOpsLoad = (server) => {
  let raw = String(server.persistentData.getString("valleyOps"));
  let s = raw ? JSON.parse(raw) : {};
  s.event = s.event || { criteria: "manual", deliveryItem: "", treasure: [] };
  s.scores = s.scores || {};
  s.names = s.names || {};
  s.buffs = s.buffs || {};
  s.notices = s.notices || [];
  s.presets = s.presets || {};
  return s;
};
const valleyOpsSave = (server, s) => server.persistentData.putString("valleyOps", JSON.stringify(s));
const valleyNow = () => Date.now();

// Buff strength now (1 when off). Also read by the startup XP hook and the market price.
global.valleyBuffValue = (kind) => {
  if (!Utils.server) return 1;
  let b = valleyOpsLoad(Utils.server).buffs[kind];
  return b && b.endsAt > valleyNow() ? b.value : 1;
};

const valleyJson = (text, color) => JSON.stringify({ text: text, color: color || "white" });

let valleyNoticeCount = 0; // each notice hides the bar 10 s later only if no newer notice came meanwhile
const valleyAnnounce = (server, text) => {
  let mine = ++valleyNoticeCount;
  server.runCommandSilent(`title @a times 10 60 20`);
  server.runCommandSilent(`title @a title ${valleyJson(text, "gold")}`);
  server.runCommandSilent(`bossbar add valley:notice ${valleyJson(text, "yellow")}`);
  server.runCommandSilent(`bossbar set valley:notice name ${valleyJson(text, "yellow")}`);
  server.runCommandSilent(`bossbar set valley:notice color yellow`);
  server.runCommandSilent(`bossbar set valley:notice players @a`);
  server.runCommandSilent(`bossbar set valley:notice visible true`);
  server.scheduleInTicks(200, () => {
    if (mine === valleyNoticeCount) server.runCommandSilent(`bossbar set valley:notice visible false`);
  });
  server.tell(Text.gold(`[공지] ${text}`));
};

// --- scores ---
const valleyScoreHolder = (nick) => String(nick).replace(/\s/g, "_");
const valleyScoreAdd = (server, player, n) => {
  let s = valleyOpsLoad(server);
  let id = String(player.uuid);
  s.scores[id] = (s.scores[id] || 0) + n;
  s.names[id] = valleyNickOf(player);
  valleyOpsSave(server, s);
  server.runCommandSilent(`scoreboard players set ${valleyScoreHolder(s.names[id])} valley_event ${s.scores[id]}`);
  return s.scores[id];
};
const valleyScoreReset = (server, title) => {
  server.runCommandSilent("scoreboard objectives remove valley_event");
  server.runCommandSilent(`scoreboard objectives add valley_event dummy ${valleyJson(title || "이벤트 점수", "gold")}`);
  let s = valleyOpsLoad(server);
  s.scores = {};
  s.names = {};
  valleyOpsSave(server, s);
};
const valleyRankingText = (s, max) => {
  let rows = global.valleyRanking(s.scores).slice(0, max);
  return rows.map((r) => `${r[2]}위 ${s.names[r[0]] || "?"} ${r[1]}점`);
};

// --- events ---
const valleyEventStart = (server, minutes, name) => {
  let s = valleyOpsLoad(server);
  if (s.event.active) return "이미 이벤트가 진행 중이에요 (/valley event stop)";
  valleyScoreReset(server, name);
  s = valleyOpsLoad(server);
  s.event.active = true;
  s.event.name = name;
  s.event.endsAt = valleyNow() + minutes * 60000;
  valleyOpsSave(server, s);
  server.runCommandSilent("scoreboard objectives setdisplay sidebar valley_event");
  server.runCommandSilent(`bossbar add valley:event ${valleyJson(name, "aqua")}`);
  server.runCommandSilent("bossbar set valley:event color blue");
  server.runCommandSilent(`bossbar set valley:event max ${minutes * 60}`);
  server.runCommandSilent("bossbar set valley:event players @a");
  server.runCommandSilent("bossbar set valley:event visible true");
  if (s.event.criteria === "treasure") {
    s.event.treasure.forEach((p) => {
      server.runCommandSilent(`execute in ${p[3]} run summon item ${p[0] + 0.5} ${p[1] + 0.5} ${p[2] + 0.5} {Item:{id:"society:valley_treasure",Count:1b},Tags:["valley_treasure"],PickupDelay:0,Age:-32768s}`);
    });
  }
  let how = { manual: "", treasure: " · 숨겨진 보물을 찾아요!", delivery: " · 납품 상자에 넣어요!" }[s.event.criteria] || "";
  valleyAnnounce(server, `이벤트 시작: ${name} (${minutes}분)${how}`);
  return null;
};

const valleyEventEnd = (server, early) => {
  let s = valleyOpsLoad(server);
  if (!s.event.active) return "진행 중인 이벤트가 없어요";
  s.event.active = false;
  valleyOpsSave(server, s);
  server.runCommandSilent("bossbar set valley:event visible false");
  server.runCommandSilent("kill @e[type=item,tag=valley_treasure]");
  valleyAnnounce(server, `이벤트 ${early ? "중단" : "끝"}: ${s.event.name}`);
  valleyRankingText(s, 5).forEach((line) => server.tell(Text.yellow(` ${line}`)));
  server.scheduleInTicks(600, () => {
    if (!valleyOpsLoad(server).event.active) server.runCommandSilent("scoreboard objectives setdisplay sidebar");
  });
  return null;
};

// --- rewards (online players of the last ranking) ---
const valleyReward = (server, rangeText, give) => {
  let range = global.valleyRankRange(rangeText);
  if (!range) return "순위는 1, 1-3, all 처럼 써요";
  let s = valleyOpsLoad(server);
  let given = [];
  let skipped = [];
  global.valleyRanking(s.scores).forEach((r) => {
    if (r[2] < range[0] || r[2] > range[1]) return;
    let player = server.playerList.getPlayer(ValleyMountUUID.fromString(r[0]));
    if (!player) {
      skipped.push(s.names[r[0]]);
      return;
    }
    give(player);
    given.push(s.names[r[0]]);
  });
  return `준 사람 ${given.length}명: ${given.join(", ")}${skipped.length ? ` / 접속 안 해서 못 준 사람: ${skipped.join(", ")}` : ""}`;
};

// --- buffs ---
const valleyBuffStart = (server, kind, minutes, value) => {
  let k = global.valleyBuffKinds[kind];
  let s = valleyOpsLoad(server);
  s.buffs[kind] = { value: value, endsAt: valleyNow() + minutes * 60000 };
  valleyOpsSave(server, s);
  if (kind === "crops") server.runCommandSilent(`gamerule randomTickSpeed ${Math.round(3 * value)}`);
  server.runCommandSilent(`bossbar add valley:buff_${kind} ${valleyJson(k.name, "green")}`);
  server.runCommandSilent(`bossbar set valley:buff_${kind} color green`);
  server.runCommandSilent(`bossbar set valley:buff_${kind} max ${minutes * 60}`);
  server.runCommandSilent(`bossbar set valley:buff_${kind} players @a`);
  server.runCommandSilent(`bossbar set valley:buff_${kind} visible true`);
  let strength = kind === "luck" || kind === "speed" ? `${value}단계` : `${value}배`;
  valleyAnnounce(server, `서버 버프 시작: ${k.name} ${strength} (${minutes}분)`);
};
const valleyBuffEnd = (server, kind) => {
  let s = valleyOpsLoad(server);
  if (!s.buffs[kind]) return;
  delete s.buffs[kind];
  valleyOpsSave(server, s);
  if (kind === "crops") server.runCommandSilent("gamerule randomTickSpeed 3");
  server.runCommandSilent(`bossbar remove valley:buff_${kind}`);
  server.tell(Text.gold(`[공지] 서버 버프 끝: ${global.valleyBuffKinds[kind].name}`));
};

// Every second: event and buff timers, scheduled notices, effect buffs.
ServerEvents.tick((e) => {
  if (e.server.tickCount % 20 !== 0) return;
  let server = e.server;
  let s = valleyOpsLoad(server);
  let now = valleyNow();
  if (s.event.active) {
    let left = s.event.endsAt - now;
    if (left <= 0) valleyEventEnd(server, false);
    else {
      server.runCommandSilent(`bossbar set valley:event name ${valleyJson(`${s.event.name} · 남은 시간 ${global.valleyFormatTime(left)}`, "aqua")}`);
      server.runCommandSilent(`bossbar set valley:event value ${Math.ceil(left / 1000)}`);
      server.runCommandSilent("bossbar set valley:event players @a");
    }
  }
  Object.keys(s.buffs).forEach((kind) => {
    let left = s.buffs[kind].endsAt - now;
    if (left <= 0) return valleyBuffEnd(server, kind);
    server.runCommandSilent(`bossbar set valley:buff_${kind} name ${valleyJson(`${global.valleyBuffKinds[kind].name} 버프 · ${global.valleyFormatTime(left)}`, "green")}`);
    server.runCommandSilent(`bossbar set valley:buff_${kind} value ${Math.ceil(left / 1000)}`);
    server.runCommandSilent(`bossbar set valley:buff_${kind} players @a`);
    if (server.tickCount % 200 === 0 && (kind === "luck" || kind === "speed")) {
      let effect = kind === "luck" ? "minecraft:luck" : "minecraft:speed";
      server.runCommandSilent(`effect give @a ${effect} 15 ${Math.max(0, Math.round(s.buffs[kind].value) - 1)} true`);
    }
  });
  let due = s.notices.filter((n) => n.at <= now);
  if (due.length) {
    s = valleyOpsLoad(server);
    s.notices = s.notices.filter((n) => n.at > now);
    valleyOpsSave(server, s);
    due.forEach((n) => valleyAnnounce(server, n.text));
  }
});

// Treasure: a point per piece, the item goes away.
ItemEvents.pickedUp("society:valley_treasure", (e) => {
  let server = e.player.server;
  let n = e.item.count;
  e.player.server.scheduleInTicks(1, () => server.runCommandSilent(`clear ${e.player.username} society:valley_treasure`));
  if (!valleyOpsLoad(server).event.active) return;
  let total = valleyScoreAdd(server, e.player, n);
  e.player.setStatusMessage(Text.gold(`보물 발견! ${total}점`));
});

// Delivery box: right-click it with items during a delivery event; the held stack scores and is taken.
BlockEvents.rightClicked((e) => {
  let s = valleyOpsLoad(e.server);
  let d = s.event.delivery;
  if (!d || e.block.x !== d[0] || e.block.y !== d[1] || e.block.z !== d[2] || String(e.level.dimension) !== d[3]) return;
  if (e.hand != "MAIN_HAND") return;
  if (!s.event.active || s.event.criteria !== "delivery") {
    e.player.setStatusMessage(Text.yellow("납품 이벤트 때 쓰는 상자예요"));
    e.cancel();
  }
  let item = e.player.mainHandItem;
  if (item.isEmpty() || (s.event.deliveryItem && String(item.id) !== s.event.deliveryItem)) {
    e.player.setStatusMessage(Text.yellow(s.event.deliveryItem ? `${s.event.deliveryItem} 을(를) 들고 눌러요` : "넣을 아이템을 손에 들고 눌러요"));
    e.cancel();
  }
  let n = item.count;
  item.shrink(n);
  let total = valleyScoreAdd(e.server, e.player, n);
  e.player.setStatusMessage(Text.gold(`${n}개 납품! ${total}점`));
  e.cancel();
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), true);
    return 1;
  };
  const say = (ctx, problem, ok) => reply(ctx, problem || ok);
  const W = (name) => Commands.argument(name, Arguments.WORD.create(e));
  const R = (name) => Commands.argument(name, Arguments.RESOURCE_LOCATION.create(e)); // item ids (a word can't hold ":")
  const I = (name) => Commands.argument(name, Arguments.INTEGER.create(e));
  const T = (name) => Commands.argument(name, Arguments.GREEDY_STRING.create(e));
  const w = (ctx, name) => String(Arguments.WORD.getResult(ctx, name));
  const r = (ctx, name) => String(Arguments.RESOURCE_LOCATION.getResult(ctx, name));
  const i = (ctx, name) => Arguments.INTEGER.getResult(ctx, name);
  const t = (ctx, name) => String(Arguments.GREEDY_STRING.getResult(ctx, name));
  const here = (ctx) => {
    let p = ctx.source.player;
    return p ? [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z), String(p.level.dimension)] : null;
  };
  const edit = (ctx, fn) => {
    let s = valleyOpsLoad(ctx.source.server);
    let text = fn(s);
    valleyOpsSave(ctx.source.server, s);
    return reply(ctx, text);
  };

  // Players: gather call and event shop.
  e.register(Commands.literal("모이기").executes((ctx) => {
    let p = ctx.source.player;
    let g = valleyOpsLoad(ctx.source.server).gather;
    if (!p || !g || g.until < valleyNow()) return reply(ctx, "지금은 모이라는 요청이 없어요");
    ctx.source.server.runCommandSilent(`execute in ${g.dim} run tp ${p.username} ${g.x} ${g.y} ${g.z}`);
    return 1;
  }));
  e.register(Commands.literal("이벤트상점").executes((ctx) => {
    let p = ctx.source.player;
    if (!p) return 0;
    if (!valleyOpsLoad(ctx.source.server).shop) return reply(ctx, "지금은 이벤트 상점이 닫혀 있어요");
    ctx.source.server.runCommandSilent(`openshop ${p.username} valley_event`);
    return 1;
  }));

  const menu = [
    ["공지", "/valley announce now "],
    ["예약 공지", "/valley announce in 10 "],
    ["이벤트 기준", "/valley event criteria "],
    ["이벤트 시작", "/valley event start 30 "],
    ["이벤트 중단", "/valley event stop"],
    ["점수 주기", "/valley score add "],
    ["보물 위치 찍기", "/valley treasure mark"],
    ["납품 상자 정하기", "/valley delivery set"],
    ["보상", "/valley reward 1 money "],
    ["모두 소환", "/valley gather now"],
    ["모이기 요청", "/valley gather ask"],
    ["서버 버프", "/valley buff sell 30"],
    ["이벤트 상점", "/valley shop on"],
    ["한정 탈것", "/valley mount limited "],
    ["이벤트 저장", "/valley event save "],
    ["부지", "/valley plot "],
    ["신청 확인", "/valley signup list"],
    ["무역상", "/valley trader "],
    ["빚·죽음 비용", "/valley death show"],
    ["칭호", "/valley title "],
    ["사용 제한 예외", "/kubejs stages add <이름> valley_restrict_bypass"],
  ];

  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(Commands.literal("menu").executes((ctx) => {
        let line = Text.gold("관리자 메뉴 (눌러서 채우기): ");
        menu.forEach((m) => line.append(Text.aqua(`[${m[0]}] `).clickSuggestCommand(m[1]).hover(m[1])));
        ctx.source.sendSuccess(line, false);
        return 1;
      }))
      .then(Commands.literal("announce")
        .then(Commands.literal("clear").executes((ctx) => edit(ctx, (s) => {
          let n = s.notices.length;
          s.notices = [];
          return `예약 공지 ${n}개를 지웠어요`;
        })))
        .then(Commands.literal("now").then(T("text").executes((ctx) => {
          valleyAnnounce(ctx.source.server, t(ctx, "text"));
          return 1;
        })))
        .then(Commands.literal("in").then(I("minutes").then(T("text").executes((ctx) =>
          edit(ctx, (s) => {
            s.notices.push({ at: valleyNow() + i(ctx, "minutes") * 60000, text: t(ctx, "text") });
            return `${i(ctx, "minutes")}분 뒤 공지 예약 (예약 ${s.notices.length}개)`;
          }))))))
      .then(Commands.literal("event")
        .then(Commands.literal("criteria")
          .then(Commands.literal("manual").executes((ctx) => edit(ctx, (s) => ((s.event.criteria = "manual"), "점수 기준: 관리자가 직접 (/valley score add)"))))
          .then(Commands.literal("treasure").executes((ctx) => edit(ctx, (s) => ((s.event.criteria = "treasure"), `점수 기준: 보물 찾기 (찍어 둔 곳 ${s.event.treasure.length}개)`))))
          .then(Commands.literal("delivery")
            .executes((ctx) => edit(ctx, (s) => ((s.event.criteria = "delivery"), (s.event.deliveryItem = ""), "점수 기준: 납품 (아무 아이템, 개수)")))
            .then(R("item").executes((ctx) => edit(ctx, (s) => ((s.event.criteria = "delivery"), (s.event.deliveryItem = r(ctx, "item")), `점수 기준: 납품 (${r(ctx, "item")} 개수)`))))))
        .then(Commands.literal("start").then(I("minutes").then(T("name").executes((ctx) =>
          say(ctx, valleyEventStart(ctx.source.server, i(ctx, "minutes"), t(ctx, "name")), "이벤트 시작")))))
        .then(Commands.literal("stop").executes((ctx) => say(ctx, valleyEventEnd(ctx.source.server, true), "이벤트 중단")))
        .then(Commands.literal("save").then(W("preset").executes((ctx) => edit(ctx, (s) => {
          s.presets[w(ctx, "preset")] = { criteria: s.event.criteria, deliveryItem: s.event.deliveryItem, delivery: s.event.delivery, treasure: s.event.treasure };
          return `이벤트 설정 저장: ${w(ctx, "preset")}`;
        }))))
        .then(Commands.literal("load").then(W("preset").executes((ctx) => edit(ctx, (s) => {
          let p = s.presets[w(ctx, "preset")];
          if (!p) return `없는 설정: ${w(ctx, "preset")}`;
          if (s.event.active) return "이벤트가 진행 중이라 불러올 수 없어요";
          Object.keys(p).forEach((k) => (s.event[k] = p[k]));
          return `불러옴: ${w(ctx, "preset")} (기준 ${p.criteria}, 보물 ${p.treasure.length}곳)`;
        }))))
        .then(Commands.literal("presets").executes((ctx) => reply(ctx, `저장된 설정: ${Object.keys(valleyOpsLoad(ctx.source.server).presets).join(", ") || "없음"}`))))
      .then(Commands.literal("score")
        .then(Commands.literal("add").then(W("who").then(I("n").executes((ctx) => {
          let p = ctx.source.server.getPlayer(w(ctx, "who"));
          if (!p) return reply(ctx, "접속 중인 플레이어만 돼요");
          return reply(ctx, `${valleyNickOf(p)} ${valleyScoreAdd(ctx.source.server, p, i(ctx, "n"))}점`);
        }))))
        .then(Commands.literal("reset").executes((ctx) => {
          valleyScoreReset(ctx.source.server, valleyOpsLoad(ctx.source.server).event.name);
          return reply(ctx, "점수를 지웠어요");
        }))
        .then(Commands.literal("show").executes((ctx) => reply(ctx, valleyRankingText(valleyOpsLoad(ctx.source.server), 20).join("\n") || "점수 없음"))))
      .then(Commands.literal("treasure")
        .then(Commands.literal("mark").executes((ctx) => edit(ctx, (s) => {
          let p = here(ctx);
          if (!p) return "서서 써야 해요";
          s.event.treasure.push(p);
          return `보물 위치 ${s.event.treasure.length}번: ${p[0]} ${p[1]} ${p[2]}`;
        })))
        .then(Commands.literal("clear").executes((ctx) => edit(ctx, (s) => ((s.event.treasure = []), "보물 위치를 모두 지웠어요")))))
      .then(Commands.literal("delivery").then(Commands.literal("set").executes((ctx) => edit(ctx, (s) => {
        let p = ctx.source.player;
        let hit = p ? p.rayTrace(6) : null;
        if (!hit || !hit.block) return "6칸 안의 블록(상자 등)을 바라보고 써요";
        s.event.delivery = [hit.block.x, hit.block.y, hit.block.z, String(p.level.dimension)];
        return `납품 상자: ${hit.block.id} ${hit.block.x} ${hit.block.y} ${hit.block.z}`;
      }))))
      .then(Commands.literal("reward").then(W("ranks")
        .then(Commands.literal("money").then(I("n").executes((ctx) =>
          reply(ctx, valleyReward(ctx.source.server, w(ctx, "ranks"), (p) => {
            global.valleyDeposit(p, i(ctx, "n"));
            p.tell(Text.gold(`이벤트 보상: ${global.formatPrice(i(ctx, "n"))}`));
          })))))
        .then(Commands.literal("item").then(R("id").then(I("count").executes((ctx) =>
          reply(ctx, valleyReward(ctx.source.server, w(ctx, "ranks"), (p) => {
            p.give(Item.of(r(ctx, "id"), i(ctx, "count")));
            p.tell(Text.gold("이벤트 보상을 받았어요!"));
          }))))))
        .then(Commands.literal("title").then(W("id").executes((ctx) =>
          reply(ctx, valleyReward(ctx.source.server, w(ctx, "ranks"), (p) => valleyTitleGive(p, w(ctx, "id")))))))))
      .then(Commands.literal("gather")
        .then(Commands.literal("now").executes((ctx) => {
          let p = here(ctx);
          if (!p) return reply(ctx, "서서 써야 해요");
          ctx.source.server.runCommandSilent(`execute in ${p[3]} run tp @a ${p[0]} ${p[1]} ${p[2]}`);
          return reply(ctx, "모두 불렀어요");
        }))
        .then(Commands.literal("ask").executes((ctx) => edit(ctx, (s) => {
          let p = here(ctx);
          if (!p) return "서서 써야 해요";
          s.gather = { x: p[0], y: p[1], z: p[2], dim: p[3], until: valleyNow() + 180000 };
          ctx.source.server.tell(Text.gold("[공지] 관리자가 모이자고 해요! ").append(Text.green("[모이기]").clickRunCommand("/모이기").hover("3분 안에 누르면 이동")));
          return "모이기 요청을 보냈어요 (3분)";
        }))))
      .then(Commands.literal("buff")
        .then(Commands.literal("stop").then(W("kind").executes((ctx) => {
          valleyBuffEnd(ctx.source.server, w(ctx, "kind"));
          return reply(ctx, "버프를 껐어요");
        })))
        .then(W("kind").then(I("minutes")
          .executes((ctx) => {
            let k = global.valleyBuffKinds[w(ctx, "kind")];
            if (!k) return reply(ctx, `버프 종류: ${Object.keys(global.valleyBuffKinds).join(", ")}`);
            valleyBuffStart(ctx.source.server, w(ctx, "kind"), i(ctx, "minutes"), k.value);
            return 1;
          })
          .then(Commands.argument("strength", Arguments.FLOAT.create(e)).executes((ctx) => {
            if (!global.valleyBuffKinds[w(ctx, "kind")]) return reply(ctx, `버프 종류: ${Object.keys(global.valleyBuffKinds).join(", ")}`);
            valleyBuffStart(ctx.source.server, w(ctx, "kind"), i(ctx, "minutes"), Arguments.FLOAT.getResult(ctx, "strength"));
            return 1;
          })))))
      .then(Commands.literal("shop")
        .then(Commands.literal("on").executes((ctx) => {
          edit(ctx, (s) => ((s.shop = true), "이벤트 상점을 열었어요"));
          ctx.source.server.tell(Text.gold("[공지] 이벤트 상점이 열렸어요! ").append(Text.green("[/이벤트상점]").clickRunCommand("/이벤트상점")));
          return 1;
        }))
        .then(Commands.literal("off").executes((ctx) => edit(ctx, (s) => ((s.shop = false), "이벤트 상점을 닫았어요")))))
  );
});
