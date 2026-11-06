// Valley: admin control of death fees and debts (spec 7).
// /valley death show | on | off | set <key> <value> | reset
// /valley debt get <who> | set <who> <amount> | clear <who>      (who = online player name or UUID)
// Settings live in the world (server.persistentData.valleyDeath); missing keys use valleyDeathDefaults.

global.valleyDeathConfig = (server) => {
  let saved = server.persistentData.getCompound("valleyDeath");
  let cfg = {};
  Object.keys(global.valleyDeathDefaults).forEach((k) => {
    cfg[k] = saved.contains(k) ? saved.getInt(k) : global.valleyDeathDefaults[k];
  });
  return cfg;
};

const valleyDeathSet = (server, key, value) => {
  let saved = server.persistentData.getCompound("valleyDeath");
  saved.putInt(key, value);
  server.persistentData.put("valleyDeath", saved);
};

const valleyDebtIndex = (server, uuid) => {
  if (!server.persistentData.debts) server.persistentData.debts = [];
  let debts = server.persistentData.debts;
  for (let i = 0; i < debts.length; i++) if (String(debts[i].uuid) === String(uuid)) return i;
  return -1;
};

const valleyDebtGet = (server, uuid) => {
  let i = valleyDebtIndex(server, uuid);
  return i < 0 ? 0 : Number(server.persistentData.debts[i].amount);
};

const valleyDebtSet = (server, uuid, amount) => {
  let i = valleyDebtIndex(server, uuid);
  if (i < 0) server.persistentData.debts.push({ uuid: String(uuid), amount: amount });
  else server.persistentData.debts[i].amount = amount;
};

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const show = (ctx) => {
    let cfg = global.valleyDeathConfig(ctx.source.server);
    ctx.source.sendSuccess(Text.of(`죽음 비용 ${cfg.enabled ? "켜짐" : "꺼짐"}: ` +
      Object.keys(cfg).filter((k) => k !== "enabled").map((k) => `${k}=${cfg[k]}`).join(", ")), false);
    return 1;
  };
  const who = (ctx) => {
    let uuid = valleyBankUuid(ctx.source.server, Arguments.WORD.getResult(ctx, "who"));
    if (!uuid) ctx.source.sendFailure(Text.of("그런 플레이어가 없어요 (접속 중인 이름이나 UUID)"));
    return uuid;
  };
  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("death")
          .then(Commands.literal("show").executes(show))
          .then(Commands.literal("on").executes((ctx) => { valleyDeathSet(ctx.source.server, "enabled", 1); return show(ctx); }))
          .then(Commands.literal("off").executes((ctx) => { valleyDeathSet(ctx.source.server, "enabled", 0); return show(ctx); }))
          .then(Commands.literal("reset").executes((ctx) => { ctx.source.server.persistentData.remove("valleyDeath"); return show(ctx); }))
          .then(
            Commands.literal("set").then(
              Commands.argument("key", Arguments.WORD.create(e)).then(
                Commands.argument("value", Arguments.INTEGER.create(e)).executes((ctx) => {
                  let key = Arguments.WORD.getResult(ctx, "key");
                  let value = Arguments.INTEGER.getResult(ctx, "value");
                  if (!(key in global.valleyDeathDefaults) || value < 0) {
                    ctx.source.sendFailure(Text.of(`키는 ${Object.keys(global.valleyDeathDefaults).join(", ")} 중 하나, 값은 0 이상`));
                    return 0;
                  }
                  valleyDeathSet(ctx.source.server, key, value);
                  return show(ctx);
                })
              )
            )
          )
      )
      .then(
        Commands.literal("debt")
          .then(Commands.literal("get").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
            let uuid = who(ctx);
            if (!uuid) return 0;
            ctx.source.sendSuccess(Text.of(`빚 ${uuid}: ${valleyDebtGet(ctx.source.server, uuid)}`), false);
            return 1;
          })))
          .then(Commands.literal("set").then(Commands.argument("who", Arguments.WORD.create(e)).then(
            Commands.argument("amount", Arguments.INTEGER.create(e)).executes((ctx) => {
              let uuid = who(ctx);
              let amount = Arguments.INTEGER.getResult(ctx, "amount");
              if (!uuid || amount < 0) return 0;
              valleyDebtSet(ctx.source.server, uuid, amount);
              ctx.source.sendSuccess(Text.of(`빚 ${uuid}: ${amount}`), true);
              return 1;
            })
          )))
          .then(Commands.literal("clear").then(Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
            let uuid = who(ctx);
            if (!uuid) return 0;
            valleyDebtSet(ctx.source.server, uuid, 0);
            ctx.source.sendSuccess(Text.of(`빚 ${uuid}: 0`), true);
            return 1;
          })))
      )
  );
});
