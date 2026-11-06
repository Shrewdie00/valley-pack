// Valley: titles (spec 10). A player picks one owned title; it shows as "[title]" before their name on the
// nametag and Tab list (a vanilla team prefix, one team per player) and in chat (playerEvents/chatColors.js).
// Players:  /칭호            list my titles (click one to use it)
//           /칭호 사용 <id>   /칭호 끄기
// Admin:    /valley title list [player] | give <player> <id> | take <player> <id>
//           /valley title create <id> <color> <name> | delete <id>       (titles made in game, kept in the world)
// shortcut: give/take need the player online; queue grants for offline players if events need it.

const valleyTitleDef = (server, id) => {
  let fromList = global.valleyTitleList.find((t) => t.id === id);
  if (fromList) return fromList;
  let custom = server.persistentData.getCompound("valleyCustomTitles");
  if (!custom.contains(id)) return null;
  let parts = String(custom.getString(id)).split("|");
  return { id: id, color: parts[0], name: parts.slice(1).join("|"), how: "admin" };
};

const valleyTitleTeam = (player) => "vt_" + String(player.uuid).replace(/-/g, "").substring(0, 12);

// The selected title, or null.
const valleyTitleOf = (player) => {
  let id = String(player.persistentData.getString("valleyTitle"));
  return id ? valleyTitleDef(player.server, id) : null;
};

// Used by the pack's chat line (playerEvents/chatColors.js).
const valleyTitleChatFor = (player) => global.valleyTitleChat(valleyTitleOf(player));

const valleyTitleShow = (player) => {
  let server = player.server;
  let title = valleyTitleOf(player);
  let team = valleyTitleTeam(player);
  if (!title) {
    server.runCommandSilent(`team leave ${player.username}`);
  } else {
    server.runCommandSilent(`team add ${team}`);
    server.runCommandSilent(`team modify ${team} prefix ${global.valleyTitlePrefix(title)}`);
    server.runCommandSilent(`team join ${team} ${player.username}`);
  }
  ValleyNicknames.refresh(player); // the Tab name carries the title too
};

const valleyTitleGive = (player, id) => {
  let had = global.valleyTitleIds(player.persistentData.getString("valleyTitles"));
  if (had.indexOf(id) >= 0) return false;
  player.persistentData.putString("valleyTitles", global.valleyTitleAdd(player.persistentData.getString("valleyTitles"), id));
  let title = valleyTitleDef(player.server, id);
  player.tell(Text.gold(`새 칭호 [${title ? title.name : id}]를 얻었어요! /칭호 로 고를 수 있어요.`));
  return true;
};

const valleyTitleTake = (player, id) => {
  player.persistentData.putString("valleyTitles", global.valleyTitleRemove(player.persistentData.getString("valleyTitles"), id));
  if (String(player.persistentData.getString("valleyTitle")) === id) {
    player.persistentData.putString("valleyTitle", "");
    valleyTitleShow(player);
  }
};

const valleyTitleListText = (player) => {
  let ids = global.valleyTitleIds(player.persistentData.getString("valleyTitles"));
  if (ids.length === 0) return [Text.gray("가진 칭호가 없어요.")];
  let lines = [Text.gold("내 칭호 (누르면 사용):")];
  ids.forEach((id) => {
    let t = valleyTitleDef(player.server, id);
    if (t) lines.push(Text.of(` [${t.name}]`).color(t.color).clickRunCommand(`/칭호 사용 ${id}`).hover("이 칭호 쓰기"));
  });
  lines.push(Text.gray(" [끄기]").clickRunCommand("/칭호 끄기"));
  return lines;
};

PlayerEvents.loggedIn((e) => {
  let player = e.player;
  global.valleyTitleList.forEach((t) => {
    if (t.how === "join" || (t.stage && player.stages.has(t.stage))) valleyTitleGive(player, t.id);
  });
  valleyTitleShow(player);
});

// Stage titles (quest chapters): checked every 10 s, so they arrive a moment after the quest.
ServerEvents.tick((e) => {
  if (e.server.tickCount % 200 !== 100) return;
  e.server.players.forEach((player) => {
    global.valleyTitleList.forEach((t) => {
      if (t.stage && player.stages.has(t.stage)) valleyTitleGive(player, t.id);
    });
  });
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const listMine = (ctx) => {
    valleyTitleListText(ctx.source.player).forEach((line) => ctx.source.player.tell(line));
    return 1;
  };
  const playerTitles = Commands.literal("칭호")
    .executes(listMine)
    .then(Commands.literal("끄기").executes((ctx) => {
      ctx.source.player.persistentData.putString("valleyTitle", "");
      valleyTitleShow(ctx.source.player);
      ctx.source.player.tell(Text.gray("칭호를 껐어요."));
      return 1;
    }))
    .then(Commands.literal("사용").then(Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => {
      let player = ctx.source.player;
      let id = Arguments.WORD.getResult(ctx, "id");
      if (global.valleyTitleIds(player.persistentData.getString("valleyTitles")).indexOf(id) < 0 || !valleyTitleDef(player.server, id)) {
        player.tell(Text.red("그 칭호는 가지고 있지 않아요."));
        return 0;
      }
      player.persistentData.putString("valleyTitle", id);
      valleyTitleShow(player);
      player.tell(Text.gold(`칭호를 [${valleyTitleDef(player.server, id).name}]로 바꿨어요.`));
      return 1;
    })));
  e.register(playerTitles);
  e.register(Commands.literal("titles").executes(listMine));

  const target = (ctx) => {
    let player = ctx.source.server.getPlayer(Arguments.WORD.getResult(ctx, "who"));
    if (!player) ctx.source.sendFailure(Text.of("접속 중인 플레이어만 돼요"));
    return player;
  };
  const known = (ctx, id) => {
    if (valleyTitleDef(ctx.source.server, id)) return true;
    ctx.source.sendFailure(Text.of(`없는 칭호: ${id}`));
    return false;
  };
  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("title")
          .then(Commands.literal("list")
            .executes((ctx) => {
              let custom = ctx.source.server.persistentData.getCompound("valleyCustomTitles");
              let all = global.valleyTitleList.map((t) => `${t.id}=${t.name}(${t.how})`);
              custom.getAllKeys().forEach((k) => all.push(`${k}=${valleyTitleDef(ctx.source.server, String(k)).name}(admin)`));
              ctx.source.sendSuccess(Text.of(`칭호 ${all.length}개: ${all.join(", ")}`), false);
              return 1;
            })
            .then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
              let player = target(ctx);
              if (!player) return 0;
              ctx.source.sendSuccess(Text.of(`${player.username}: ${player.persistentData.getString("valleyTitles")} (사용 중: ${player.persistentData.getString("valleyTitle") || "없음"})`), false);
              return 1;
            })))
          .then(Commands.literal("give").then(Commands.argument("who", Arguments.WORD.create(e)).then(
            Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => {
              let player = target(ctx);
              let id = Arguments.WORD.getResult(ctx, "id");
              if (!player || !known(ctx, id)) return 0;
              valleyTitleGive(player, id);
              ctx.source.sendSuccess(Text.of(`${player.username}에게 ${id}`), true);
              return 1;
            }))))
          .then(Commands.literal("take").then(Commands.argument("who", Arguments.WORD.create(e)).then(
            Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => {
              let player = target(ctx);
              let id = Arguments.WORD.getResult(ctx, "id");
              if (!player) return 0;
              valleyTitleTake(player, id);
              ctx.source.sendSuccess(Text.of(`${player.username}에게서 ${id} 뺌`), true);
              return 1;
            }))))
          .then(Commands.literal("create").then(Commands.argument("id", Arguments.WORD.create(e)).then(
            Commands.argument("color", Arguments.WORD.create(e)).then(
              Commands.argument("name", Arguments.GREEDY_STRING.create(e)).executes((ctx) => {
                let id = Arguments.WORD.getResult(ctx, "id");
                let color = Arguments.WORD.getResult(ctx, "color");
                let name = Arguments.GREEDY_STRING.getResult(ctx, "name");
                if (!global.valleyTitleIdOk(id) || !global.valleyTitleColorCodes[color] || global.valleyTitleList.find((t) => t.id === id)) {
                  ctx.source.sendFailure(Text.of("id는 소문자·숫자·_ (목록 파일과 겹치면 안 됨), 색은 white gold green aqua 등"));
                  return 0;
                }
                let custom = ctx.source.server.persistentData.getCompound("valleyCustomTitles");
                custom.putString(id, `${color}|${name}`);
                ctx.source.server.persistentData.put("valleyCustomTitles", custom);
                ctx.source.sendSuccess(Text.of(`칭호 만듦: ${id} = [${name}]`), true);
                return 1;
              })))))
          .then(Commands.literal("delete").then(Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => {
            let custom = ctx.source.server.persistentData.getCompound("valleyCustomTitles");
            custom.remove(Arguments.WORD.getResult(ctx, "id"));
            ctx.source.server.persistentData.put("valleyCustomTitles", custom);
            ctx.source.sendSuccess(Text.of("지움 (이미 받은 사람 목록에는 남지만 보이지 않음)"), true);
            return 1;
          })))
      )
  );
});
