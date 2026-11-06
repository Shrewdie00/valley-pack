// Valley: bet amounts for the slot machine and pig races (decision 14). Sneak + right-click opens the bet window
// (Valley Companion mod); the amount is remembered and every plain right-click bets it. No amount yet = window.
const ValleyBetUi = Java.loadClass("net.valley.companion.bet.BetUi");

// The remembered bet, or null after opening the bet window.
global.valleyBetOrAsk = (player, kind) => {
  let bet = player.persistentData.getInt(`valleyBet_${kind}`);
  if (!player.isCrouching() && bet >= global.valleyBetMin[kind]) return bet;
  ValleyBetUi.open(player, kind, global.valleyBetMin[kind], "");
  return null;
};

// /valleybet <slot|pig> <amount>: sent by the bet window as the player's own command.
ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  e.register(
    Commands.literal("valleybet").then(
      Commands.argument("kind", Arguments.WORD.create(e)).then(
        Commands.argument("amount", Arguments.INTEGER.create(e)).executes((ctx) => {
          let player = ctx.source.player;
          let kind = Arguments.WORD.getResult(ctx, "kind");
          let amount = Arguments.INTEGER.getResult(ctx, "amount");
          let min = global.valleyBetMin[kind];
          if (!player || !min) return 0;
          if (amount < min) {
            player.tell(Text.red(`판돈은 ${global.formatPrice(min)}원 이상이에요`));
            return 0;
          }
          player.persistentData.putInt(`valleyBet_${kind}`, amount);
          player.tell(Text.gold(`판돈을 ${global.formatPrice(amount)}원으로 정했어요. 우클릭하면 걸어요 (바꾸려면 웅크리고 우클릭).`));
          return 1;
        })
      )
    )
  );
});
