// Valley: land (spec 4, docs/decisions-land.md). Farm world = overworld (flat): town in the middle, plots in rings
// around it (valley_land_rules.js). Wild world = valley:wild (normal terrain), reached by the town gate.
//   /부지                              where my plot is
//   /valley plot give <player>         next free plot (claims 3x3 chunks for the player's team, rough ground)
//   /valley plot take <name>           unclaims and frees a plot
//   /valley plot list | rings <n> | auto on|off
//   /valley wild gate set | spawn set | go
// In the farm world nobody but admins builds outside claimed chunks; players can't claim or unclaim themselves
// (startup_scripts/valley_land.js).
const ValleyChunksAPI = Java.loadClass("dev.ftb.mods.ftbchunks.api.FTBChunksAPI");
const ValleyChunkDimPos = Java.loadClass("dev.ftb.mods.ftblibrary.math.ChunkDimPos");
const ValleyLandBlockPos = Java.loadClass("net.minecraft.core.BlockPos");
const ValleyLandTag = Java.loadClass("net.minecraft.nbt.CompoundTag");

const valleyChunkPos = (level, x, z) => new ValleyChunkDimPos(level, new ValleyLandBlockPos(x * 16, 0, z * 16));

const valleyTownChunk = (server) => {
  let town = server.persistentData.getCompound("valleyTown");
  if (!town.contains("x") || town.getString("dim") !== "minecraft:overworld") return null;
  return [Math.floor(town.getDouble("x")) >> 4, Math.floor(town.getDouble("z")) >> 4, Math.floor(town.getDouble("y"))];
};

const valleyPlots = (server) => server.persistentData.getCompound("valleyPlots");
const valleyPlotOf = (server, uuid) => {
  let plots = valleyPlots(server);
  return plots.contains(String(uuid)) ? plots.getCompound(String(uuid)) : null;
};
const valleyPlotSave = (server, uuid, plot) => {
  let plots = valleyPlots(server);
  if (plot) plots.put(String(uuid), plot);
  else plots.remove(String(uuid));
  server.persistentData.put("valleyPlots", plots);
};
const valleyCellOf = (plot) => plot.getString("cell").split(",").map(Number);
const valleyCellCentre = (town, cell) => [
  (town[0] + cell[0] * global.valleyPlotCell) * 16 + 8,
  (town[1] + cell[1] * global.valleyPlotCell) * 16 + 8,
];

// Rough ground on the grass of these chunks. Uses the town's height as the ground level (flat world).
const valleyRoughGround = (level, chunks, y) => {
  chunks.forEach((c) => {
    let cx = c[0];
    let cz = c[1];
    for (let x = cx * 16; x < cx * 16 + 16; x++) {
      for (let z = cz * 16; z < cz * 16 + 16; z++) {
        let id = global.valleyDebrisFor(Math.random(), Math.random());
        if (!id || level.getBlock(x, y - 1, z).id !== "minecraft:grass_block" || !level.getBlock(x, y, z).id.endsWith("air")) continue;
        level.getBlock(x, y, z).set(id);
      }
    }
  });
};

// Claims chunks for the player's team (the server source skips the player-claim block and the claim limit check
// still applies: 49 chunks is far below the 500 default).
const valleyClaim = (server, data, chunks) => {
  let level = server.overworld();
  let source = server.createCommandSourceStack();
  let failed = 0;
  chunks.forEach((c) => {
    if (!data.claim(source, valleyChunkPos(level, c[0], c[1]), false).isSuccess()) failed++;
  });
  return failed;
};

const valleyTeamData = (player) => ValleyChunksAPI.api().getManager().getOrCreateData(player);

const valleyPlotGive = (player) => {
  let server = player.server;
  let town = valleyTownChunk(server);
  if (!town) return "마을 위치를 먼저 정하세요 (농장 월드에서 /valley town set)";
  if (valleyPlotOf(server, player.uuid)) return `${player.username}님은 이미 부지가 있어요`;
  let plots = valleyPlots(server);
  let taken = {};
  plots.getAllKeys().forEach((k) => (taken[plots.getCompound(k).getString("cell")] = true));
  let rings = server.persistentData.contains("valleyPlotRings") ? server.persistentData.getInt("valleyPlotRings") : global.valleyPlotRingsOpen;
  let cell = global.valleyNextFreeCell(rings, (k) => taken[k] === true);
  if (!cell) return `빈 부지가 없어요. 고리를 늘리세요 (/valley plot rings ${rings + 1})`;

  let chunks = global.valleyPlotChunks(town, cell, 0);
  let failed = valleyClaim(server, valleyTeamData(player), chunks);
  valleyRoughGround(server.overworld(), chunks, town[2]);
  let plot = new ValleyLandTag();
  plot.putString("cell", `${cell[0]},${cell[1]}`);
  plot.putInt("level", 0);
  plot.putString("name", player.username);
  valleyPlotSave(server, player.uuid, plot);

  let centre = valleyCellCentre(town, cell);
  let x = centre[0];
  let z = centre[1];
  server.runCommandSilent(`execute in minecraft:overworld run spawnpoint ${player.username} ${x} ${town[2]} ${z}`);
  player.tell(Text.green(`부지를 받았어요! 위치: ${x}, ${z} (마을에서 걸어가세요). 이제 여기서 부활해요.`));
  return failed ? `부지 ${cell} 를 줬지만 ${failed}청크는 점유하지 못했어요` : `${player.username}님에게 부지 ${cell} 를 줬어요`;
};

// Deed: level 0 -> 1 (5x5) or 1 -> 2 (7x7).
const valleyPlotExpand = (player, toLevel) => {
  let server = player.server;
  let town = valleyTownChunk(server);
  let plot = valleyPlotOf(server, player.uuid);
  if (!town || !plot) return "부지가 있어야 쓸 수 있어요";
  if (plot.getInt("level") !== toLevel - 1) {
    return plot.getInt("level") >= toLevel ? "이미 이만큼 넓혔어요" : "5×5 확장권을 먼저 써야 해요";
  }
  let cell = valleyCellOf(plot);
  let before = {};
  global.valleyPlotChunks(town, cell, toLevel - 1).forEach((c) => (before[`${c[0]},${c[1]}`] = true));
  let added = global.valleyPlotChunks(town, cell, toLevel).filter((c) => !before[`${c[0]},${c[1]}`]);
  valleyClaim(server, valleyTeamData(player), added);
  valleyRoughGround(server.overworld(), added, town[2]);
  plot.putInt("level", toLevel);
  valleyPlotSave(server, player.uuid, plot);
  return null;
};

ItemEvents.rightClicked((e) => {
  let toLevel = { "society:plot_deed_5": 1, "society:plot_deed_7": 2 }[String(e.item.id)];
  if (!toLevel || valleyRestrictionOf(e.player, e.item.id)) return;
  let problem = valleyPlotExpand(e.player, toLevel);
  if (problem) {
    e.player.setStatusMessage(Text.red(problem));
    return;
  }
  let size = global.valleyPlotSizes[toLevel];
  e.player.tell(Text.green(`부지를 ${size}×${size}청크로 넓혔어요!`));
  if (!e.player.isCreative()) e.item.shrink(1);
});

// Farm world: building only inside claims (FTB Chunks then decides who). Interacting stays free (town shops).
// shortcut: only placing and breaking are checked; buckets and hoeing outside plots still work, block them too if
// players start messing up the town.
const valleyCanBuildHere = (player, level, pos) => {
  if (!player || player.hasPermissions(2) || String(level.dimension) !== "minecraft:overworld") return true;
  return ValleyChunksAPI.api().getManager().getChunk(new ValleyChunkDimPos(level, pos)) != null;
};
const valleyBuildRefuse = (e) => {
  e.player.setStatusMessage(Text.red("농장 월드에서는 내 부지 안에서만 지을 수 있어요"));
  e.cancel();
};
BlockEvents.placed((e) => {
  if (!valleyCanBuildHere(e.player, e.level, e.block.pos)) valleyBuildRefuse(e);
});
BlockEvents.broken((e) => {
  if (!valleyCanBuildHere(e.player, e.level, e.block.pos)) valleyBuildRefuse(e);
});

// /valley plot auto on: valley_signup.js gives the plot right after signing up.

// Wild gate: standing on the gate block in town sends you to the wild (return with the town return scroll).
const valleyToWild = (player) => {
  let spot = player.server.persistentData.getCompound("valleyWildSpawn");
  let x = spot.contains("x") ? spot.getInt("x") : 0;
  let z = spot.contains("z") ? spot.getInt("z") : 0;
  player.server.runCommandSilent(`execute in valley:wild run spreadplayers ${x} ${z} 0 24 false ${player.username}`);
  player.tell(Text.green("야생에 왔어요. 돌아갈 때는 마을 귀환 주문서를 쓰세요."));
};
ServerEvents.tick((e) => {
  if (e.server.tickCount % 10 !== 0) return;
  let gate = e.server.persistentData.getCompound("valleyWildGate");
  if (!gate.contains("x")) return;
  e.server.players.forEach((player) => {
    if (String(player.level.dimension) !== "minecraft:overworld") return;
    if (Math.abs(player.x - gate.getInt("x") - 0.5) < 1 && Math.abs(player.z - gate.getInt("z") - 0.5) < 1 && Math.abs(player.y - gate.getInt("y")) < 2) {
      valleyToWild(player);
    }
  });
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), true);
    return 1;
  };
  const here = (ctx, key) => {
    let player = ctx.source.player;
    if (!player) return 0;
    let tag = new ValleyLandTag();
    tag.putInt("x", Math.floor(player.x));
    tag.putInt("y", Math.floor(player.y));
    tag.putInt("z", Math.floor(player.z));
    ctx.source.server.persistentData.put(key, tag);
    return reply(ctx, `저장했어요: ${Math.floor(player.x)} ${Math.floor(player.y)} ${Math.floor(player.z)}`);
  };

  e.register(Commands.literal("부지").executes((ctx) => {
    let player = ctx.source.player;
    if (!player) return 0;
    let town = valleyTownChunk(ctx.source.server);
    let plot = valleyPlotOf(ctx.source.server, player.uuid);
    if (!town || !plot) return reply(ctx, "아직 부지가 없어요. 관리자에게 받으세요.");
    let centre = valleyCellCentre(town, valleyCellOf(plot));
    let x = centre[0];
    let z = centre[1];
    let size = global.valleyPlotSizes[plot.getInt("level")];
    return reply(ctx, `내 부지: 가운데 ${x}, ${z} / 크기 ${size}×${size}청크 (${size * 16}×${size * 16}칸)`);
  }));

  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("plot")
          .then(Commands.literal("give").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
            let player = ctx.source.server.getPlayer(Arguments.WORD.getResult(ctx, "who"));
            return reply(ctx, player ? valleyPlotGive(player) : "접속 중인 플레이어만 줄 수 있어요");
          })))
          .then(Commands.literal("take").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
            let server = ctx.source.server;
            let name = Arguments.WORD.getResult(ctx, "who");
            let town = valleyTownChunk(server);
            let plots = valleyPlots(server);
            let uuid = null;
            plots.getAllKeys().forEach((k) => {
              if (plots.getCompound(k).getString("name") === String(name)) uuid = k;
            });
            if (!uuid || !town) return reply(ctx, `${name}님의 부지가 없어요`);
            let plot = plots.getCompound(uuid);
            let manager = ValleyChunksAPI.api().getManager();
            let source = server.createCommandSourceStack();
            global.valleyPlotChunks(town, valleyCellOf(plot), plot.getInt("level")).forEach((c) => {
              let pos = valleyChunkPos(server.overworld(), c[0], c[1]);
              let claimed = manager.getChunk(pos);
              if (claimed) claimed.getTeamData().unclaim(source, pos, false);
            });
            valleyPlotSave(server, uuid, null);
            return reply(ctx, `${name}님의 부지 ${plot.getString("cell")} 를 비웠어요 (지은 것은 남아 있어요)`);
          })))
          .then(Commands.literal("list").executes((ctx) => {
            let plots = valleyPlots(ctx.source.server);
            let rows = [];
            plots.getAllKeys().forEach((k) => {
              let p = plots.getCompound(k);
              rows.push(`${p.getString("name")} ${p.getString("cell")} (${global.valleyPlotSizes[p.getInt("level")]}×)`);
            });
            return reply(ctx, `부지 ${rows.length}개: ${rows.join(", ")}`);
          }))
          .then(Commands.literal("rings").then(Commands.argument("n", Arguments.INTEGER.create(e)).executes((ctx) => {
            ctx.source.server.persistentData.putInt("valleyPlotRings", Arguments.INTEGER.getResult(ctx, "n"));
            return reply(ctx, `부지 고리 ${Arguments.INTEGER.getResult(ctx, "n")}개까지 열었어요`);
          })))
          .then(Commands.literal("auto")
            .then(Commands.literal("on").executes((ctx) => {
              ctx.source.server.persistentData.putBoolean("valleyPlotAuto", true);
              return reply(ctx, "신청을 마치면 부지를 자동으로 줘요");
            }))
            .then(Commands.literal("off").executes((ctx) => {
              ctx.source.server.persistentData.putBoolean("valleyPlotAuto", false);
              return reply(ctx, "부지 자동 배정을 껐어요");
            })))
      )
      .then(
        Commands.literal("wild")
          .then(Commands.literal("gate").then(Commands.literal("set").executes((ctx) => here(ctx, "valleyWildGate"))))
          .then(Commands.literal("spawn").then(Commands.literal("set").executes((ctx) => here(ctx, "valleyWildSpawn"))))
          .then(Commands.literal("go").executes((ctx) => {
            if (!ctx.source.player) return 0;
            valleyToWild(ctx.source.player);
            return 1;
          }))
      )
  );
});
