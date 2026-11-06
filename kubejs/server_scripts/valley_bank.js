// Valley: admin money tools and the balance HUD (spec 3.1, 13).
// /valley bank get|add|take <player name or UUID> [amount]
// Money items (society:money) never stay in a player's inventory: they are deposited the moment they arrive (one currency).
// On login the Curios bank_meter slot gets a Bank Meter so the balance shows on screen (only meters fit that slot, so overwriting is harmless).

const ValleyBankUUID = Java.loadClass("java.util.UUID");
const ValleyBankType = Java.loadClass("dev.ithundxr.createnumismatics.content.backend.BankAccount$Type");
const ValleyReason = Java.loadClass("dev.ithundxr.createnumismatics.content.backend.ReasonHolder");

const valleyBankUuid = (server, who) => {
  let player = server.getPlayer(who);
  if (player) return player.uuid;
  try {
    return ValleyBankUUID.fromString(who);
  } catch (err) {
    return null;
  }
};

const ValleyBankCurio = Java.loadClass("io.github.chakyl.numismaticsutils.utils.CurioUtils");

const valleyDepositCoins = (player) => {
  let inv = player.inventory;
  let total = 0;
  for (let i = 0; i < inv.getContainerSize(); i++) {
    let stack = inv.getItem(i);
    let account = ValleyBankCurio.getPersonalOrCurioAccount(player.level, player);
    let amount = global.valleyCoinDeposit(stack.id, stack.count, account ? account.getBalance() : 0);
    if (amount > 0 && ValleyBankCurio.depositIntoPersonalOrCurio(player.level, player, amount)) {
      inv.setItem(i, Item.empty);
      total += amount;
    }
  }
  if (total > 0) player.setStatusMessage(Text.gold(`+${global.formatPrice(total)}`));
};

PlayerEvents.inventoryChanged((e) => {
  if (global.valleyCoinValues[String(e.item.id)]) valleyDepositCoins(e.player);
});

PlayerEvents.loggedIn((e) => {
  valleyDepositCoins(e.player);
  e.server.runCommandSilent(`curios replace bank_meter 0 ${e.player.username} with numismatics_utils:bank_meter`);
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), true);
    return 1;
  };
  // Runs fn(ctx, uuid, amount) after resolving <who> and checking <amount> >= 1.
  const withAmount = (fn) => (ctx) => {
    let uuid = valleyBankUuid(ctx.source.server, Arguments.WORD.getResult(ctx, "who"));
    let amount = Arguments.INTEGER.getResult(ctx, "amount");
    if (!uuid) return reply(ctx, "Unknown player or UUID");
    if (amount < 1) return reply(ctx, "Amount must be at least 1");
    return fn(ctx, uuid, amount);
  };
  const amountArg = (fn) =>
    Commands.argument("who", Arguments.WORD.create(e)).then(
      Commands.argument("amount", Arguments.INTEGER.create(e)).executes(withAmount(fn))
    );
  e.register(
    // Every valley_*.js registers this root; Brigadier keeps the first .requires, so keep them all at 2.
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("bank")
          .then(
            Commands.literal("get").then(
              Commands.argument("who", Arguments.WORD.create(e)).executes((ctx) => {
                let uuid = valleyBankUuid(ctx.source.server, Arguments.WORD.getResult(ctx, "who"));
                if (!uuid) return reply(ctx, "Unknown player or UUID");
                let account = global.GLOBAL_BANK.getAccount(uuid);
                return reply(ctx, account ? `Bank ${uuid}: ${account.getBalance()}` : `Bank ${uuid}: no account`);
              })
            )
          )
          .then(
            Commands.literal("add").then(
              amountArg((ctx, uuid, amount) => {
                let account = global.GLOBAL_BANK.getOrCreateAccount(uuid, ValleyBankType.PLAYER);
                if (account.getBalance() + amount >= 2147483000) return reply(ctx, "Balance limit reached");
                account.deposit(amount);
                return reply(ctx, `Bank ${uuid}: ${account.getBalance()}`);
              })
            )
          )
          .then(
            Commands.literal("take").then(
              amountArg((ctx, uuid, amount) => {
                let account = global.GLOBAL_BANK.getAccount(uuid);
                if (!account || !account.deduct(amount, ValleyReason.IGNORED)) return reply(ctx, "Not enough");
                return reply(ctx, `Bank ${uuid}: ${account.getBalance()}`);
              })
            )
          )
      )
  );
});

// Balance advancements (decision 32): the old coin advancements unlock when the balance reaches these goals.
const valleyBalanceGoals = [
  [4096, "society:main/money/obtain_sun"],
  [32768, "society:main/money/obtain_neptunium_coin"],
  [262144, "society:main/money/obtain_ancient_coin"],
  [16777216, "society:main/money/obtain_prismatic_coin"],
];

ServerEvents.tick((e) => {
  if (e.server.tickCount % 200 !== 0) return;
  e.server.players.forEach((player) => {
    let account = ValleyBankCurio.getPersonalOrCurioAccount(player.level, player);
    if (!account) return;
    let balance = account.getBalance();
    let done = player.persistentData.getInt("valleyBalanceGoals");
    for (let i = done; i < valleyBalanceGoals.length && balance >= valleyBalanceGoals[i][0]; i++) {
      e.server.runCommandSilent(`advancement grant ${player.username} only ${valleyBalanceGoals[i][1]}`);
      player.persistentData.putInt("valleyBalanceGoals", i + 1);
    }
  });
});
