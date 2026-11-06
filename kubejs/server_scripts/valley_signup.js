// Valley: first join (docs/decisions-onboarding.md). Until signed up a player waits in the lobby with the signup
// window (valley mod, signup/SignupScreen). Signing up gives a code to DM the admin, sends them to town, and gives a
// plot when /valley plot auto is on. Rules in startup_scripts/valley_signup_rules.js.
//   /가입                                   form, or my code once signed up
//   /valley lobby set                       where new players wait
//   /valley signup list [all] | verify <mc name> | rename <mc name> <nickname> | cancel <mc name>
const ValleySignupUi = Java.loadClass("net.valley.companion.signup.SignupUi");
const ValleyNicknames = Java.loadClass("net.valley.companion.names.Nicknames");
const ValleyUUID = Java.loadClass("java.util.UUID");

const valleySignups = (server) => server.persistentData.getCompound("valleySignups");
const valleySignupOf = (server, uuid) => {
  let all = valleySignups(server);
  return all.contains(String(uuid)) ? all.getCompound(String(uuid)) : null;
};
// Saving also updates the nickname shown everywhere (valley mod, names/Nicknames).
const valleySignupSave = (server, uuid, rec) => {
  let all = valleySignups(server);
  if (rec) all.put(String(uuid), rec);
  else all.remove(String(uuid));
  server.persistentData.put("valleySignups", all);
  ValleyNicknames.set(server, ValleyUUID.fromString(String(uuid)), rec ? rec.getString("nick") : "", rec ? rec.getString("twitter") : "");
};

// The name to show other players: nickname once signed up, else the Minecraft name.
const valleyNickOf = (player) => {
  let rec = valleySignupOf(player.server, player.uuid);
  return rec ? String(rec.getString("nick")) : String(player.username);
};

ServerEvents.loaded((e) => {
  let all = valleySignups(e.server);
  all.getAllKeys().forEach((k) => {
    ValleyNicknames.set(e.server, ValleyUUID.fromString(String(k)), all.getCompound(k).getString("nick"), all.getCompound(k).getString("twitter"));
  });
});
// [uuid, record] by Minecraft name, or null.
const valleySignupFind = (server, mcName) => {
  let all = valleySignups(server);
  let found = null;
  all.getAllKeys().forEach((k) => {
    if (String(all.getCompound(k).getString("mc")).toLowerCase() === String(mcName).toLowerCase()) found = [k, all.getCompound(k)];
  });
  return found;
};
// The form's problem for this id and nickname, ignoring the record of skipUuid (for rename).
const valleySignupCheck = (server, twitter, nick, skipUuid) => {
  let all = valleySignups(server);
  let nicks = {};
  let ids = {};
  all.getAllKeys().forEach((k) => {
    if (String(k) === String(skipUuid)) return;
    nicks[String(all.getCompound(k).getString("nick")).toLowerCase()] = true;
    ids[String(all.getCompound(k).getString("twitter")).toLowerCase()] = true;
  });
  return global.valleySignupProblem(twitter, nick, (n) => nicks[n] === true, (i) => ids[i] === true);
};

const valleyToLobby = (player) => {
  let lobby = player.server.persistentData.getCompound("valleyLobby");
  if (!lobby.contains("x")) return;
  player.server.runCommandSilent(`execute in minecraft:overworld run tp ${player.username} ${lobby.getDouble("x")} ${lobby.getDouble("y")} ${lobby.getDouble("z")}`);
};

PlayerEvents.loggedIn((e) => {
  let player = e.player;
  let rec = valleySignupOf(e.server, player.uuid);
  if (rec) {
    if (rec.getString("mc") !== String(player.username)) {
      rec.putString("mc", player.username);
      valleySignupSave(e.server, player.uuid, rec);
    }
    return;
  }
  valleyToLobby(player);
  player.tell(Text.gold("밸리에 오신 걸 환영해요!"));
  player.tell(Text.yellow("신청 창에 트위터 아이디와 닉네임을 적으면 마을로 갈 수 있어요. 창이 없으면 /가입"));
  e.server.scheduleInTicks(40, () => {
    if (player.connection && !valleySignupOf(e.server, player.uuid)) ValleySignupUi.form(player, "");
  });
});

// Not signed up: stay in the lobby (admins may roam).
ServerEvents.tick((e) => {
  if (e.server.tickCount % 20 !== 5) return;
  let lobby = e.server.persistentData.getCompound("valleyLobby");
  if (!lobby.contains("x")) return;
  let r = global.valleyLobbyRadius;
  e.server.players.forEach((player) => {
    if (player.hasPermissions(2) || valleySignupOf(e.server, player.uuid)) return;
    let dx = player.x - lobby.getDouble("x");
    let dz = player.z - lobby.getDouble("z");
    if (String(player.level.dimension) !== "minecraft:overworld" || dx * dx + dz * dz > r * r) valleyToLobby(player);
  });
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), false);
    return 1;
  };

  // Sent by the signup window as the player's own command.
  e.register(Commands.literal("valleysignup").then(Commands.argument("twitter", Arguments.WORD.create(e)).then(
    Commands.argument("nickname", Arguments.GREEDY_STRING.create(e)).executes((ctx) => {
      let player = ctx.source.player;
      let server = ctx.source.server;
      if (!player) return 0;
      if (valleySignupOf(server, player.uuid)) return reply(ctx, "이미 신청했어요 (/가입 으로 코드 보기)");
      let twitter = String(Arguments.WORD.getResult(ctx, "twitter"));
      let nick = global.valleyCleanNick(Arguments.GREEDY_STRING.getResult(ctx, "nickname"));
      let problem = valleySignupCheck(server, twitter, nick, null);
      if (problem) {
        ValleySignupUi.form(player, problem);
        return 0;
      }
      let codes = {};
      let all = valleySignups(server);
      all.getAllKeys().forEach((k) => (codes[all.getCompound(k).getString("code")] = true));
      let code = global.valleyMakeCode(Math.random, (c) => codes[c] === true);
      let rec = new ValleyLandTag();
      rec.putString("mc", player.username);
      rec.putString("twitter", twitter);
      rec.putString("nick", nick);
      rec.putString("code", code);
      rec.putBoolean("verified", false);
      rec.putInt("day", global.getDay(player.level));
      valleySignupSave(server, player.uuid, rec);
      console.info(`[Valley] signup ${player.username} @${twitter} ${nick} ${code}`);

      ValleySignupUi.done(player, code);
      player.tell(Text.green(`신청됐어요! 확인 코드 ${code} 를 관리자 트위터 계정으로 DM 보내 주세요.`));
      global.valleyTownTeleport(player);
      if (server.persistentData.getBoolean("valleyPlotAuto")) console.info(`[Valley] auto plot: ${valleyPlotGive(player)}`);
      global.valleyTutorialStart(player);
      return 1;
    }))));

  e.register(Commands.literal("가입").executes((ctx) => {
    let player = ctx.source.player;
    if (!player) return 0;
    let rec = valleySignupOf(ctx.source.server, player.uuid);
    if (!rec) {
      ValleySignupUi.form(player, "");
      return 1;
    }
    return reply(ctx, `@${rec.getString("twitter")} / ${rec.getString("nick")} / 코드 ${rec.getString("code")} / ${rec.getBoolean("verified") ? "확인 완료" : "관리자 확인 전 (코드를 DM 보내 주세요)"}`);
  }));

  const list = (ctx, everyone) => {
    let all = valleySignups(ctx.source.server);
    let rows = [];
    all.getAllKeys().forEach((k) => {
      let r = all.getCompound(k);
      if (everyone || !r.getBoolean("verified")) {
        rows.push(`${r.getString("mc")} @${r.getString("twitter")} ${r.getString("nick")} ${r.getString("code")}${r.getBoolean("verified") ? " ✔" : ""}`);
      }
    });
    reply(ctx, `${everyone ? "전체" : "확인 전"} ${rows.length}명`);
    rows.forEach((row) => reply(ctx, ` ${row}`));
    return 1;
  };

  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(Commands.literal("lobby").then(Commands.literal("set").executes((ctx) => {
        let player = ctx.source.player;
        if (!player || String(player.level.dimension) !== "minecraft:overworld") return reply(ctx, "농장 월드에서 서서 쓰세요");
        let tag = new ValleyLandTag();
        tag.putDouble("x", player.x);
        tag.putDouble("y", player.y);
        tag.putDouble("z", player.z);
        ctx.source.server.persistentData.put("valleyLobby", tag);
        return reply(ctx, `대기실: ${Math.floor(player.x)} ${Math.floor(player.y)} ${Math.floor(player.z)} (반경 ${global.valleyLobbyRadius}칸)`);
      })))
      .then(
        Commands.literal("signup")
          .then(Commands.literal("list").executes((ctx) => list(ctx, false)).then(Commands.literal("all").executes((ctx) => list(ctx, true))))
          .then(Commands.literal("verify").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
            let found = valleySignupFind(ctx.source.server, Arguments.WORD.getResult(ctx, "who"));
            if (!found) return reply(ctx, "그 이름의 신청이 없어요");
            found[1].putBoolean("verified", true);
            valleySignupSave(ctx.source.server, found[0], found[1]);
            return reply(ctx, `${found[1].getString("mc")} 확인 완료`);
          })))
          .then(Commands.literal("rename").then(Commands.argument("who", Arguments.WORD.create(e)).then(
            Commands.argument("nickname", Arguments.GREEDY_STRING.create(e)).executes((ctx) => {
              let server = ctx.source.server;
              let found = valleySignupFind(server, Arguments.WORD.getResult(ctx, "who"));
              if (!found) return reply(ctx, "그 이름의 신청이 없어요");
              let nick = global.valleyCleanNick(Arguments.GREEDY_STRING.getResult(ctx, "nickname"));
              let problem = valleySignupCheck(server, found[1].getString("twitter"), nick, found[0]);
              if (problem) return reply(ctx, problem);
              found[1].putString("nick", nick);
              valleySignupSave(server, found[0], found[1]);
              return reply(ctx, `${found[1].getString("mc")} 닉네임: ${nick}`);
            }))))
          .then(Commands.literal("cancel").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
            let server = ctx.source.server;
            let found = valleySignupFind(server, Arguments.WORD.getResult(ctx, "who"));
            if (!found) return reply(ctx, "그 이름의 신청이 없어요");
            valleySignupSave(server, found[0], null);
            let player = server.getPlayer(found[1].getString("mc"));
            if (player) {
              valleyToLobby(player);
              player.tell(Text.yellow("신청이 취소됐어요. 다시 신청해 주세요."));
              ValleySignupUi.form(player, "");
            }
            return reply(ctx, `${found[1].getString("mc")} 신청 취소 (부지는 그대로, 필요하면 /valley plot take)`);
          })))
      )
  );
});
