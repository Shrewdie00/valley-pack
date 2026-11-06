// Valley: bank helpers shared by startup (shipping bins) and server scripts (spec 3.1).

const ValleyUUID = Java.loadClass("java.util.UUID");

// The owner's Numismatics account, or null when the owner is not a UUID ("-1", empty) or has no account.
global.valleyOwnerAccount = (owner) => {
  try {
    return global.GLOBAL_BANK.getAccount(ValleyUUID.fromString(String(owner)));
  } catch (err) {
    return null;
  }
};

// The owner's account, created when missing; null when the owner is not a UUID (shipping bins, decision 15).
const ValleyAccountType = Java.loadClass("dev.ithundxr.createnumismatics.content.backend.BankAccount$Type");
global.valleyOwnerAccountOrCreate = (owner) => {
  try {
    return global.GLOBAL_BANK.getOrCreateAccount(ValleyUUID.fromString(String(owner)), ValleyAccountType.PLAYER);
  } catch (err) {
    return null;
  }
};

// A bin without a valid owner is not settled: it keeps its goods and the admin sees this in the server log.
global.valleyOwnerlessBin = (block) => {
  console.warn(`[Valley] shipping bin at ${block.x} ${block.y} ${block.z} has no owner; goods kept, not sold`);
};

// Money never stays an item: society:money (1 each) is deposited the moment it reaches an inventory (valley_bank.js).
const ValleyCurio = Java.loadClass("io.github.chakyl.numismaticsutils.utils.CurioUtils");

global.valleyCoinValues = {
  "society:money": 1,
};

// Amount to deposit for a stack, or 0 when it is not money or would pass Numismatics' balance limit.
global.valleyCoinDeposit = (itemId, count, balance) => {
  let value = global.valleyCoinValues[String(itemId)];
  if (!value) return 0;
  let amount = value * count;
  return balance + amount >= 2147483000 ? 0 : amount;
};

// Takes amount from the player's account, telling them when the balance is short.
global.valleyPay = (player, amount) => {
  if (ValleyCurio.deductFromPersonalOrCurio(player.level, player, amount)) return true;
  player.tell(Text.red(`잔액이 부족해요 (필요: ${global.formatPrice(amount)})`));
  return false;
};

global.valleyDeposit = (player, amount) => ValleyCurio.depositIntoPersonalOrCurio(player.level, player, amount);

// Bets come from the account (decision 14); the amount is typed in the bet window (valley_bets.js).
global.valleyBetMin = { slot: 1, pig: 512 };

// Special slot machine prizes by bet (decision 14): 4,096+ may win a prismatic shard (0.5%),
// 32,768+ wins one 10% of the time and may win "the red and the black" (5%, adventuring mastery).
global.valleySlotPrize = (bet) => {
  if (bet >= 32768) return { shard: 0.1, redBlack: 0.05 };
  if (bet >= 4096) return { shard: 0.005, redBlack: 0 };
  return { shard: 0, redBlack: 0 };
};
