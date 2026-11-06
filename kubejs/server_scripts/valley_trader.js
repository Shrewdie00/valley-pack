// Valley: wandering trader (spec 3.3, 13). Rules are in startup_scripts/valley_trader_rules.js.
// Every 2-4 days the trader stands at the town spot for one day and buys 3-5 crops at 1.5-2x their base value,
// with no quantity limit and no effect on the shipping bin market. Right-click with a stack to sell it,
// with an empty hand to see what it buys. State: server.persistentData.valleyTrader
//   spot {dim,x,y,z}, uuid (present while set), items (JSON [{item, mult}]), leaveDay, nextDay.

const ValleyTraderUUID = Java.loadClass("java.util.UUID");
const ValleyTraderCurio = Java.loadClass("io.github.chakyl.numismaticsutils.utils.CurioUtils");
const VALLEY_TRADER_TAG = "valley_trader";
let valleyTraderLastDay = -1;

const valleyTrader = () => {
  let data = Utils.server.persistentData;
  // getCompound returns a fresh, detached tag when missing, so attach it once.
  if (!data.contains("valleyTrader")) data.put("valleyTrader", data.getCompound("valleyTrader"));
  return data.getCompound("valleyTrader");
};

const valleyTraderDay = () => Math.floor(Number(Utils.server.overworld().getDayTime()) / 24000);
const valleyTraderItems = () => JSON.parse(String(valleyTrader().getString("items")) || "[]");
const valleyTraderPresent = () => valleyTrader().getString("uuid") != "";
const valleyTraderBase = (item) => {
  let trade = global.trades.get(item);
  return trade ? trade.value : 0;
};
const valleyTraderMult = (item) => {
  let found = valleyTraderItems().filter((p) => p.item == item)[0];
  return found ? found.mult : 0;
};
const valleyTraderQuote = (item, count) => {
  let mult = valleyTraderMult(item);
  return mult ? global.valleyTraderPayout(valleyTraderBase(item), mult, count) : 0;
};

// A random UUID as Minecraft's int-array NBT plus its string form (done in JS: Rhino loses Java long precision).
const valleyTraderNewUuid = () => {
  let ints = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 4294967296));
  let hex = ints.map((n) => ("00000000" + n.toString(16)).slice(-8)).join("");
  let text = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return { nbt: `[I;${ints.map((n) => (n > 2147483647 ? n - 4294967296 : n)).join(",")}]`, text: text };
};

const valleyTraderAnnounce = () => {
  let list = valleyTraderItems().map((p) => `${Item.of(p.item).hoverName.string} x${p.mult}`).join(", ");
  Utils.server.runCommandSilent(`title @a title {"text":"떠돌이 무역상이 왔어요!","color":"gold"}`);
  Utils.server.tell(Text.gold(`[떠돌이 무역상] 오늘 하루 마을 광장에서 삽니다: ${list}`));
};

const valleyTraderArrive = (day) => {
  let t = valleyTrader();
  let spot = t.getCompound("spot");
  let id = valleyTraderNewUuid();
  let pool = global.crops.map((c) => c.item).filter((item) => global.trades.has(item));
  t.putString("items", JSON.stringify(global.valleyTraderPick(pool, Math.random, global.valleyTraderDefaults)));
  t.putString("uuid", id.text);
  t.putInt("leaveDay", day + 1);
  Utils.server.runCommandSilent(
    `execute in ${spot.getString("dim")} run summon minecraft:wandering_trader ${spot.getDouble("x")} ${spot.getDouble("y")} ${spot.getDouble("z")} ` +
      `{UUID:${id.nbt},NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,DespawnDelay:0,Tags:["${VALLEY_TRADER_TAG}"],` +
      `Offers:{Recipes:[]},CustomName:'{"text":"떠돌이 무역상","color":"gold"}'}`
  );
  valleyTraderAnnounce();
};

const valleyTraderLeave = (day) => {
  let t = valleyTrader();
  if (valleyTraderPresent()) Utils.server.runCommandSilent(`kill ${t.getString("uuid")}`);
  t.putString("uuid", "");
  t.putString("items", "[]");
  t.putInt("nextDay", global.valleyTraderNextVisit(day, Math.random, global.valleyTraderDefaults));
};

ServerEvents.tick((e) => {
  let day = valleyTraderDay();
  if (valleyTraderLastDay >= 0 && day != valleyTraderLastDay) {
    let t = valleyTrader();
    let s = global.valleyTraderDefaults;
    // Also catches /time set backwards: stored days far ahead are pulled back to a normal stay or gap.
    if (!t.contains("nextDay") || t.getInt("nextDay") - day > s.maxGap) t.putInt("nextDay", global.valleyTraderNextVisit(day, Math.random, s));
    if (t.getInt("leaveDay") - day > 1) t.putInt("leaveDay", day + 1);
    if (valleyTraderPresent()) {
      if (day >= t.getInt("leaveDay")) valleyTraderLeave(day);
    } else if (t.contains("spot") && day >= t.getInt("nextDay")) valleyTraderArrive(day);
  }
  valleyTraderLastDay = day;
});

// A trader whose chunk was unloaded when it left comes back from disk later: drop it on load.
EntityEvents.spawned("minecraft:wandering_trader", (e) => {
  if (!e.entity.tags.contains(VALLEY_TRADER_TAG)) return;
  if (String(e.entity.uuid) != String(valleyTrader().getString("uuid"))) e.cancel();
});

const valleyTraderInteract = (e) => {
  if (e.hand != "MAIN_HAND") return;
  let player = e.player;
  let held = player.mainHandItem;
  let id = String(held.id);
  if (held.empty || !valleyTraderMult(id)) {
    let list = valleyTraderItems().map((p) => `${Item.of(p.item).hoverName.string} ${Math.round(valleyTraderBase(p.item) * p.mult)}`).join(", ");
    player.tell(Text.gold(`[떠돌이 무역상] 이것들을 삽니다(개당): ${list}`));
    return;
  }
  let count = held.count;
  let amount = valleyTraderQuote(id, count);
  if (!ValleyTraderCurio.depositIntoPersonalOrCurio(player.level, player, amount)) {
    player.tell(Text.red("[떠돌이 무역상] 계좌에 넣을 수 없어요."));
    return;
  }
  player.tell(Text.gold(`[떠돌이 무역상] ${held.hoverName.string} ${count}개를 ${amount}에 샀어요.`));
  held.count = 0;
};

ItemEvents.entityInteracted((e) => {
  if (!e.target.tags.contains(VALLEY_TRADER_TAG)) return;
  valleyTraderInteract(e);
  e.cancel(); // throws in KubeJS, so it must come last; always cancel so the trade screen never opens
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), true);
    return 1;
  };
  const item = () => Commands.argument("item", Arguments.RESOURCE_LOCATION.create(e));
  const itemOf = (ctx) => String(Arguments.RESOURCE_LOCATION.getResult(ctx, "item"));
  const setItems = (items) => valleyTrader().putString("items", JSON.stringify(items));
  e.register(
    // Every valley_*.js registers this root; Brigadier keeps the first .requires, so keep them all at 2.
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("trader")
          .then(
            Commands.literal("here").executes((ctx) => {
              let pos = ctx.source.position;
              let spot = valleyTrader().getCompound("spot");
              spot.putString("dim", String(ctx.source.level.dimension));
              spot.putDouble("x", pos.x());
              spot.putDouble("y", pos.y());
              spot.putDouble("z", pos.z());
              valleyTrader().put("spot", spot);
              // Keep the spot loaded so the day-start summon never lands in an unloaded chunk.
              ctx.source.server.runCommandSilent(`execute in ${spot.getString("dim")} run forceload add ${Math.floor(pos.x())} ${Math.floor(pos.z())}`);
              return reply(ctx, `Trader spot set to ${pos.x()} ${pos.y()} ${pos.z()}`);
            })
          )
          .then(
            Commands.literal("summon").executes((ctx) => {
              if (!valleyTrader().contains("spot")) return reply(ctx, "No trader spot. Use /valley trader here first.");
              if (valleyTraderPresent()) valleyTraderLeave(valleyTraderDay());
              valleyTraderArrive(valleyTraderDay());
              return reply(ctx, "Trader summoned");
            })
          )
          .then(
            Commands.literal("dismiss").executes((ctx) => {
              valleyTraderLeave(valleyTraderDay());
              return reply(ctx, `Trader dismissed, next visit day ${valleyTrader().getInt("nextDay")}`);
            })
          )
          .then(
            Commands.literal("set").then(
              item().then(
                Commands.argument("mult", Arguments.DOUBLE.create(e)).executes((ctx) => {
                  let id = itemOf(ctx);
                  let mult = Arguments.DOUBLE.getResult(ctx, "mult");
                  if (!global.trades.has(id)) return reply(ctx, `${id} has no shipping value`);
                  if (!(mult > 0)) return reply(ctx, "Multiplier must be above 0");
                  setItems(valleyTraderItems().filter((p) => p.item != id).concat([{ item: id, mult: mult }]));
                  return reply(ctx, `Trader buys ${id} x${mult}`);
                })
              )
            )
          )
          .then(
            Commands.literal("remove").then(
              item().executes((ctx) => {
                let id = itemOf(ctx);
                setItems(valleyTraderItems().filter((p) => p.item != id));
                return reply(ctx, `Trader no longer buys ${id}`);
              })
            )
          )
          .then(
            Commands.literal("quote").then(
              item().then(
                Commands.argument("count", Arguments.INTEGER.create(e)).executes((ctx) => {
                  let id = itemOf(ctx);
                  let count = Arguments.INTEGER.getResult(ctx, "count");
                  return reply(ctx, `Quote ${id} x${count} = ${valleyTraderQuote(id, count)}`);
                })
              )
            )
          )
          .then(
            Commands.literal("status").executes((ctx) => {
              let t = valleyTrader();
              let spot = t.contains("spot") ? t.getCompound("spot") : null;
              let items = valleyTraderItems().map((p) => `${p.item}*${p.mult}`).join(",");
              let where = spot ? `${spot.getDouble("x")} ${spot.getDouble("y")} ${spot.getDouble("z")}` : "none";
              return reply(
                ctx,
                `Trader: present=${valleyTraderPresent()} items=${items} leaveDay=${t.getInt("leaveDay")} nextDay=${t.getInt("nextDay")} spot=${where}`
              );
            })
          )
      )
  );
});
