// Valley: mount gacha (spec 9.2, docs/decisions-mounts.md). Mounts, rates and prices: startup_scripts/valley_mount_rules.js.
// The stable NPC opens the dialog valley_stable, whose options run /valleygacha @p <1|10|list|shop> with raised
// permission. The N key (valley mod) runs /valleymount: summon the main mount and ride it, or send it back.
// Getting off sends it back too (startup_scripts/valley_travel.js).
//   /탈것 | /탈것 대표 <id> | /탈것 즐겨찾기 <id> | /탈것 교환 <id>     (N held: radial menu of favourites)
//   /valley stable set                     the Easy NPC nearest to you becomes the stable NPC
//   /valley mount give <mc name> <id> | shards <mc name> <n> | limited <id> on|off
// Player data: valleyMounts "id,id", valleyMountMain, valleyMountShards, valleyGachaPity, valleyGachaFreeUsed,
// valleyMountEntity (uuid of the summoned one).
const ValleyMountSync = Java.loadClass("net.valley.companion.mount.MountSync");
const ValleyMountUUID = Java.loadClass("java.util.UUID");

const valleyMountsOwned = (player) => {
  let s = String(player.persistentData.getString("valleyMounts"));
  return s ? s.split(",") : [];
};
const valleyMountAdd = (player, id) => {
  let owned = valleyMountsOwned(player);
  if (owned.indexOf(id) >= 0) return false;
  owned.push(id);
  player.persistentData.putString("valleyMounts", owned.join(","));
  if (!player.persistentData.getString("valleyMountMain")) player.persistentData.putString("valleyMountMain", id);
  return true;
};
// Radial menu (N held): favourites, or the first 12 owned; the main mount first.
const valleyMountFavorites = (player) => {
  let s = String(player.persistentData.getString("valleyMountFavs"));
  let owned = valleyMountsOwned(player);
  return (s ? s.split(",") : []).filter((id) => owned.indexOf(id) >= 0);
};
const valleyMountMenuIds = (player) => {
  let favs = valleyMountFavorites(player);
  let ids = (favs.length ? favs : valleyMountsOwned(player)).filter((id) => global.valleyMountById(id)).slice(0, 12);
  let main = String(player.persistentData.getString("valleyMountMain"));
  if (ids.indexOf(main) > 0) ids = [main].concat(ids.filter((id) => id !== main));
  return ids;
};
const valleyGradeRgb = { common: 0xffffff, rare: 0x55ffff, epic: 0xff55ff, legendary: 0xffaa00 };

const valleyMountLimitedOn = (server) => (id) => server.persistentData.getCompound("valleyMountLimited").getBoolean(id);
const valleyGradeText = (grade) => {
  let g = global.valleyMountGrades[grade];
  return Text.of(`[${g.name}]`).color(g.color);
};
const valleyMountText = (m) => valleyGradeText(m.grade).append(Text.of(` ${m.name}`).color(global.valleyMountGrades[m.grade].color));

// The summoned mount, if it still exists.
const valleyMountCurrent = (player) => {
  let id = String(player.persistentData.getString("valleyMountEntity"));
  if (!id) return null;
  let found = null;
  player.server.allLevels.forEach((level) => {
    if (!found) found = level.getEntity(ValleyMountUUID.fromString(id));
  });
  return found;
};

const valleyMountDismiss = (player) => {
  let mount = valleyMountCurrent(player);
  if (player.vehicle && player.vehicle.tags.contains("valley_mount")) player.stopRiding();
  if (mount) mount.discard();
  player.persistentData.putString("valleyMountEntity", "");
};

const valleyMountSummon = (player) => {
  if (String(player.level.dimension) === "society:skull_cavern") return "해골 동굴에서는 탈것을 부를 수 없어요";
  let owned = valleyMountsOwned(player);
  if (!owned.length) return "아직 탈것이 없어요. 마을 마구간에서 뽑아 보세요";
  let id = String(player.persistentData.getString("valleyMountMain")) || owned[0];
  let m = global.valleyMountById(id) || global.valleyMountById(owned[0]);
  if (!m) return "탈것 정보를 찾을 수 없어요 (관리자에게 알려 주세요)";
  valleyMountDismiss(player);

  let abilities = m.abilities || [];
  let entity = valleyMountCreate(player.level, m, player.x, player.y, player.z);
  entity.persistentData.putString("valleyOwner", String(player.uuid));
  entity.spawn();
  player.persistentData.putString("valleyMountEntity", String(entity.uuid));
  player.startRiding(entity, true);
  let flags = (abilities.indexOf("swim") >= 0 ? ValleyMountSync.SWIM : 0) | (abilities.indexOf("glide") >= 0 ? ValleyMountSync.GLIDE : 0);
  if (global.valleyMountFlyers.indexOf(m.entity) < 0) {
    ValleyMountSync.abilities(player, entity, flags);
    return null;
  }
  let dim = String(player.level.dimension);
  let ceiling = global.valleyFlyCeiling[dim] !== undefined ? global.valleyFlyCeiling[dim] : global.valleyFlyCeilingDefault;
  let town = dim === "minecraft:overworld" ? valleyTownChunk(player.server) : null;
  let box = town ? global.valleyTownBox(town) : [0, 0, 0, 0];
  ValleyMountSync.flyer(player, entity, flags | (town ? ValleyMountSync.TOWN : 0), ceiling, Math.round(global.valleyFlyMaxSpeed * 100), box[0], box[1], box[2], box[3]);
  return null;
};

// The mount entity, not yet spawned.
const valleyMountCreate = (level, m, x, y, z) => {
  let stats = global.valleyMountStats(m);
  let abilities = m.abilities || [];
  let entity = level.createEntity(m.entity);
  let nbt = {
    Tame: true,
    SaddleItem: { id: "minecraft:saddle", Count: 1 },
    Invulnerable: true,
    PersistenceRequired: false,
    Tags: ["valley_mount"],
    CustomName: JSON.stringify({ text: m.name, color: global.valleyMountGrades[m.grade].color }),
    Attributes: [
      { Name: "minecraft:generic.movement_speed", Base: stats.speed },
      { Name: "minecraft:horse.jump_strength", Base: stats.jump },
    ],
  };
  if (m.variant !== undefined) nbt.Variant = m.variant;
  if (abilities.indexOf("glow") >= 0) nbt.Glowing = true;
  entity.mergeNbt(nbt);
  entity.setPosition(x, y, z);
  entity.persistentData.putString("valleyMount", m.id);
  entity.persistentData.putBoolean("valleyGlide", abilities.indexOf("glide") >= 0);
  return entity;
};

// Draws: count 1 or 10. Returns false when not paid.
const valleyGachaDraw = (player, count) => {
  let free = count === 1 && !player.persistentData.getBoolean("valleyGachaFreeUsed");
  let price = free ? 0 : count === 10 ? global.valleyGachaPrice.ten : global.valleyGachaPrice.one * count;
  if (price > 0 && !global.valleyPay(player, price)) return false;
  if (free) player.persistentData.putBoolean("valleyGachaFreeUsed", true);

  let pity = player.persistentData.getInt("valleyGachaPity");
  let best = 0;
  let order = global.valleyMountGradeOrder;
  player.tell(Text.gold(`── 마구간 뽑기 ${count}회${free ? " (첫 뽑기 무료!)" : ` (${global.formatPrice(price)})`} ──`));
  for (let i = 0; i < count; i++) {
    let r = global.valleyGachaRoll(Math.random, pity, valleyMountLimitedOn(player.server));
    pity = r.pity;
    best = Math.max(best, order.indexOf(r.grade));
    let m = global.valleyMountById(r.id);
    let line = Text.of(" ").append(valleyMountText(m));
    if (valleyMountAdd(player, m.id)) line.append(Text.green(" NEW!"));
    else {
      let shards = global.valleyMountGrades[m.grade].shard;
      player.persistentData.putInt("valleyMountShards", player.persistentData.getInt("valleyMountShards") + shards);
      line.append(Text.gray(` (이미 있어서 조각 ${shards}개)`));
    }
    player.tell(line);
    if (r.grade === "legendary") {
      player.server.tell(Text.gold(`★ ${valleyNickOf(player)}님이 전설 탈것 `).append(valleyMountText(m)).append(Text.gold(" 을(를) 뽑았어요!")));
    }
  }
  player.persistentData.putInt("valleyGachaPity", pity);
  player.tell(Text.gray(`조각 ${player.persistentData.getInt("valleyMountShards")}개 · 전설까지 최대 ${global.valleyGachaPity - pity}회 · N 키로 타기`));
  let top = global.valleyMountGrades[order[best]];
  player.server.runCommandSilent(`title ${player.username} title ${JSON.stringify({ text: top.name + "!", color: top.color })}`);
  player.server.runCommandSilent(`playsound ${best >= 3 ? "minecraft:ui.toast.challenge_complete" : "minecraft:entity.player.levelup"} master ${player.username}`);
  return true;
};

const valleyMountList = (player) => {
  let owned = valleyMountsOwned(player);
  let main = String(player.persistentData.getString("valleyMountMain"));
  player.tell(Text.gold(`내 탈것 ${owned.length}종 · 조각 ${player.persistentData.getInt("valleyMountShards")}개 · 전설까지 최대 ${global.valleyGachaPity - player.persistentData.getInt("valleyGachaPity")}회`));
  owned.forEach((id) => {
    let m = global.valleyMountById(id);
    if (!m) return;
    let line = Text.of(" ").append(valleyMountText(m));
    if (id === main) line.append(Text.green(" (대표)"));
    else line.append(Text.of(" ")).append(Text.aqua("[대표로]").clickRunCommand(`/탈것 대표 ${id}`).hover("N 키로 부를 탈것"));
    let fav = valleyMountFavorites(player).indexOf(id) >= 0;
    line.append(Text.of(" ")).append((fav ? Text.gold("[★]") : Text.gray("[☆]")).clickRunCommand(`/탈것 즐겨찾기 ${id}`).hover("N 키를 꾹 누르면 나오는 메뉴에 넣기/빼기"));
    player.tell(line);
  });
  if (!owned.length) player.tell(Text.gray(" 아직 없어요. 마을 마구간에서 뽑아 보세요."));
};

const valleyMountShop = (player) => {
  let owned = valleyMountsOwned(player);
  let shards = player.persistentData.getInt("valleyMountShards");
  let on = valleyMountLimitedOn(player.server);
  player.tell(Text.gold(`조각 교환 (내 조각 ${shards}개)`));
  global.valleyMounts.forEach((m) => {
    if (owned.indexOf(m.id) >= 0 || (m.limited && !on(m.id))) return;
    let cost = global.valleyMountGrades[m.grade].cost;
    let line = Text.of(" ").append(valleyMountText(m)).append(Text.gray(` 조각 ${cost}개 `));
    if (shards >= cost) line.append(Text.green("[교환]").clickRunCommand(`/탈것 교환 ${m.id}`).hover("조각으로 바꾸기"));
    player.tell(line);
  });
};

const valleyMountExchange = (player, id) => {
  let m = global.valleyMountById(id);
  if (!m || (m.limited && !valleyMountLimitedOn(player.server)(id))) return "지금은 바꿀 수 없는 탈것이에요";
  if (valleyMountsOwned(player).indexOf(id) >= 0) return "이미 가진 탈것이에요";
  let cost = global.valleyMountGrades[m.grade].cost;
  let shards = player.persistentData.getInt("valleyMountShards");
  if (shards < cost) return `조각이 모자라요 (${shards}/${cost})`;
  player.persistentData.putInt("valleyMountShards", shards - cost);
  valleyMountAdd(player, id);
  player.tell(Text.green("교환했어요: ").append(valleyMountText(m)));
  return null;
};

// Glide: no fall damage for the gliding mount and its rider. Leftover mounts (nobody riding) go away.
ServerEvents.tick((e) => {
  if (e.server.tickCount % 5 === 0) {
    e.server.players.forEach((player) => {
      let v = player.vehicle;
      if (v && v.tags.contains("valley_mount") && v.persistentData.getBoolean("valleyGlide")) {
        v.fallDistance = 0;
        player.fallDistance = 0;
      }
    });
  }
  if (e.server.tickCount % 200 !== 30) return;
  e.server.allLevels.forEach((level) => {
    level.getEntities().forEach((en) => {
      if (en.tags.contains("valley_mount") && en.passengers.isEmpty()) en.discard();
    });
  });
});

PlayerEvents.loggedOut((e) => valleyMountDismiss(e.player));

// The stable NPC opens the gacha dialog (the pack's NPC handler skips it, npcs/npcInteraction.js).
ItemEvents.entityInteracted((e) => {
  if (e.hand != "MAIN_HAND" || !e.target.tags.contains("valley_stable")) return;
  e.server.runCommandSilent(`dialog ${e.player.getUuid()} show ${e.player.username} valley_stable`);
  e.cancel();
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const self = (ctx, fn) => {
    let player = ctx.source.player;
    if (!player) return 0;
    let problem = fn(player);
    if (problem) player.tell(Text.red(problem));
    return problem ? 0 : 1;
  };
  const byName = (ctx, name) => ctx.source.server.getPlayer(name);

  const toggle = (p) => {
    if (p.vehicle && p.vehicle.tags.contains("valley_mount")) {
      valleyMountDismiss(p);
      return null;
    }
    return valleyMountSummon(p);
  };
  // Sent by the N key: short press toggles, holding asks for the radial menu, a pick makes it main and rides it.
  e.register(Commands.literal("valleymount").executes((ctx) => self(ctx, toggle))
    .then(Commands.literal("menu").executes((ctx) => self(ctx, (p) => {
      let ids = valleyMountMenuIds(p);
      let ms = ids.map((id) => global.valleyMountById(id));
      ValleyMountSync.menu(p, ids, ms.map((m) => m.name), ms.map((m) => valleyGradeRgb[m.grade]));
      return null;
    })))
    .then(Commands.literal("pick").then(Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => self(ctx, (p) => {
      let id = String(Arguments.WORD.getResult(ctx, "id"));
      if (valleyMountsOwned(p).indexOf(id) < 0) return "가지고 있지 않은 탈것이에요";
      p.persistentData.putString("valleyMountMain", id);
      valleyMountDismiss(p);
      return valleyMountSummon(p);
    })))));

  e.register(
    Commands.literal("탈것")
      .executes((ctx) => self(ctx, (p) => valleyMountList(p)))
      .then(Commands.literal("대표").then(Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => self(ctx, (p) => {
        let id = String(Arguments.WORD.getResult(ctx, "id"));
        if (valleyMountsOwned(p).indexOf(id) < 0) return "가지고 있지 않은 탈것이에요";
        p.persistentData.putString("valleyMountMain", id);
        p.tell(Text.green("대표 탈것: ").append(valleyMountText(global.valleyMountById(id))));
        return null;
      }))))
      .then(Commands.literal("즐겨찾기").then(Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => self(ctx, (p) => {
        let id = String(Arguments.WORD.getResult(ctx, "id"));
        if (valleyMountsOwned(p).indexOf(id) < 0) return "가지고 있지 않은 탈것이에요";
        let favs = valleyMountFavorites(p);
        let at = favs.indexOf(id);
        if (at >= 0) favs.splice(at, 1);
        else if (favs.length >= 12) return "즐겨찾기는 12개까지예요";
        else favs.push(id);
        p.persistentData.putString("valleyMountFavs", favs.join(","));
        p.tell(Text.green(at >= 0 ? "즐겨찾기에서 뺐어요: " : "즐겨찾기에 넣었어요: ").append(valleyMountText(global.valleyMountById(id))));
        return null;
      }))))
      .then(Commands.literal("교환").then(Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) =>
        self(ctx, (p) => valleyMountExchange(p, String(Arguments.WORD.getResult(ctx, "id")))))))
  );

  // From the stable dialog (raised permission): the player's own action.
  e.register(
    Commands.literal("valleygacha")
      .requires((src) => src.hasPermission(2))
      .then(Commands.argument("who", Arguments.PLAYER.create(e)).then(Commands.argument("what", Arguments.WORD.create(e)).executes((ctx) => {
        let player = Arguments.PLAYER.getResult(ctx, "who");
        let what = String(Arguments.WORD.getResult(ctx, "what"));
        if (what === "1" || what === "10") valleyGachaDraw(player, Number(what));
        else if (what === "list") valleyMountList(player);
        else if (what === "shop") valleyMountShop(player);
        return 1;
      })))
  );

  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), true);
    return 1;
  };
  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(Commands.literal("stable").then(Commands.literal("set").executes((ctx) => {
        let player = ctx.source.player;
        if (!player) return 0;
        let nearest = null;
        let best = 36;
        player.level.getEntities().forEach((en) => {
          if (String(en.type).indexOf("easy_npc:") !== 0) return;
          let d = en.distanceToSqr(player);
          if (d < best) {
            best = d;
            nearest = en;
          }
        });
        if (!nearest) return reply(ctx, "6칸 안에 Easy NPC가 없어요");
        nearest.addTag("valley_stable");
        return reply(ctx, "이 NPC가 마구간 담당이 됐어요 (우클릭하면 뽑기)");
      })))
      .then(
        Commands.literal("mount")
          .then(Commands.literal("give").then(Commands.argument("who", Arguments.WORD.create(e)).then(Commands.argument("id", Arguments.WORD.create(e)).executes((ctx) => {
            let p = byName(ctx, Arguments.WORD.getResult(ctx, "who"));
            let id = String(Arguments.WORD.getResult(ctx, "id"));
            if (!p) return reply(ctx, "접속 중인 플레이어만 줄 수 있어요");
            if (!global.valleyMountById(id)) return reply(ctx, `없는 탈것 id: ${id}`);
            return reply(ctx, valleyMountAdd(p, id) ? `${p.username}에게 ${id}` : "이미 가지고 있어요");
          }))))
          .then(Commands.literal("shards").then(Commands.argument("who", Arguments.WORD.create(e)).then(Commands.argument("n", Arguments.INTEGER.create(e)).executes((ctx) => {
            let p = byName(ctx, Arguments.WORD.getResult(ctx, "who"));
            if (!p) return reply(ctx, "접속 중인 플레이어만 줄 수 있어요");
            let n = p.persistentData.getInt("valleyMountShards") + Arguments.INTEGER.getResult(ctx, "n");
            p.persistentData.putInt("valleyMountShards", Math.max(0, n));
            return reply(ctx, `${p.username} 조각 ${Math.max(0, n)}개`);
          }))))
          .then(Commands.literal("limited").then(Commands.argument("id", Arguments.WORD.create(e)).then(Commands.argument("state", Arguments.WORD.create(e)).executes((ctx) => {
            let id = String(Arguments.WORD.getResult(ctx, "id"));
            let m = global.valleyMountById(id);
            if (!m || !m.limited) return reply(ctx, `기간 한정 탈것이 아니에요: ${id}`);
            let on = String(Arguments.WORD.getResult(ctx, "state")) === "on";
            let tag = ctx.source.server.persistentData.getCompound("valleyMountLimited");
            tag.putBoolean(id, on);
            ctx.source.server.persistentData.put("valleyMountLimited", tag);
            if (on) ctx.source.server.tell(Text.gold("마구간에 기간 한정 탈것이 들어왔어요: ").append(valleyMountText(m)));
            return reply(ctx, `${id} ${on ? "켬" : "끔"}`);
          }))))
      )
  );
});
