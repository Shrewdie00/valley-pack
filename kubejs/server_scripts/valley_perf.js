// Valley: per-player limits against lag (spec 14, docs/decisions-perf.md). Kinetic Create blocks (anything that
// rotates: shafts, cogs, motors, drills, ... and addon blocks of the same kind) are counted per player who placed
// them. Creative players are not counted. Force-loaded chunks are limited in FTB Chunks' config (9 per team).
//   /valley kinetic show <mc name> | reset <mc name> | limit <n>
// shortcut: blocks moved by contraptions or removed without a break event keep counting until /valley kinetic reset;
// add a recount over loaded chunks if counts drift in play.
const ValleyIRotate = Java.loadClass("com.simibubi.create.content.kinetics.base.IRotate");

const valleyKineticLimit = (server) =>
  server.persistentData.contains("valleyKineticLimit") ? server.persistentData.getInt("valleyKineticLimit") : 256;
const valleyKineticKey = (level, pos) => `${level.dimension}|${pos.x}|${pos.y}|${pos.z}`;
const valleyKineticTag = (server, name) => server.persistentData.getCompound(name);
const valleyKineticCount = (server, uuid) => valleyKineticTag(server, "valleyKineticCount").getInt(String(uuid));
const valleyKineticSetCount = (server, uuid, n) => {
  let counts = valleyKineticTag(server, "valleyKineticCount");
  counts.putInt(String(uuid), Math.max(0, n));
  server.persistentData.put("valleyKineticCount", counts);
};
const valleyIsKinetic = (block) => block.blockState.block instanceof ValleyIRotate;

BlockEvents.placed((e) => {
  let player = e.player;
  if (!player || player.isFake() || player.isCreative() || !valleyIsKinetic(e.block)) return;
  let server = e.server;
  let n = valleyKineticCount(server, player.uuid);
  let limit = valleyKineticLimit(server);
  if (n >= limit) {
    player.setStatusMessage(Text.red(`움직이는 Create 장치는 한 사람당 ${limit}개까지예요 (지금 ${n}개)`));
    e.cancel();
  }
  let owners = valleyKineticTag(server, "valleyKineticOwner");
  owners.putString(valleyKineticKey(e.level, e.block.pos), String(player.uuid));
  server.persistentData.put("valleyKineticOwner", owners);
  valleyKineticSetCount(server, player.uuid, n + 1);
  if (n + 1 >= limit - 16) player.setStatusMessage(Text.yellow(`움직이는 Create 장치 ${n + 1}/${limit}개`));
});

BlockEvents.broken((e) => {
  if (!valleyIsKinetic(e.block)) return;
  let server = e.server;
  let owners = valleyKineticTag(server, "valleyKineticOwner");
  let key = valleyKineticKey(e.level, e.block.pos);
  if (!owners.contains(key)) return;
  let uuid = owners.getString(key);
  owners.remove(key);
  server.persistentData.put("valleyKineticOwner", owners);
  valleyKineticSetCount(server, uuid, valleyKineticCount(server, uuid) - 1);
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), true);
    return 1;
  };
  const uuidOf = (ctx) => {
    let p = ctx.source.server.getPlayer(String(Arguments.WORD.getResult(ctx, "who")));
    return p ? p.uuid : null;
  };
  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(Commands.literal("kinetic")
        .then(Commands.literal("show").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
          let id = uuidOf(ctx);
          return reply(ctx, id ? `움직이는 Create 장치 ${valleyKineticCount(ctx.source.server, id)}/${valleyKineticLimit(ctx.source.server)}개` : "접속 중인 플레이어만 볼 수 있어요");
        })))
        .then(Commands.literal("reset").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
          let id = uuidOf(ctx);
          if (!id) return reply(ctx, "접속 중인 플레이어만 돼요");
          valleyKineticSetCount(ctx.source.server, id, 0);
          return reply(ctx, "장치 수를 0으로 했어요 (기록된 위치는 남아요)");
        })))
        .then(Commands.literal("limit").then(Commands.argument("n", Arguments.INTEGER.create(e)).executes((ctx) => {
          ctx.source.server.persistentData.putInt("valleyKineticLimit", Arguments.INTEGER.getResult(ctx, "n"));
          return reply(ctx, `움직이는 Create 장치 한도: ${Arguments.INTEGER.getResult(ctx, "n")}개`);
        }))))
  );
});
