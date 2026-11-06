// Valley: growth items need a skill tree tier to place, use or mine with (spec 12, rules in valley_restrict_rules.js).
// Free for creative mode, machines (fake players) and anyone with the stage valley_restrict_bypass
// (admin: /kubejs stages add <player> valley_restrict_bypass).
const valleyRestrictionOf = (player, itemId) => {
  if (!player || player.isFake() || player.isCreative() || player.stages.has("valley_restrict_bypass")) return null;
  return global.valleyRestrictionFor(itemId, (stage) => player.stages.has(stage));
};

const valleyRestrictRefuse = (player, rule) => player.setStatusMessage(Text.red(global.valleyRestrictionText(rule)));

// Tier tags (valley_tier_<tree>_<n>) for checks done in Java, e.g. big barn blueprints (valley mod
// land/BlueprintGuard). Refreshed every 10 s.
ServerEvents.tick((e) => {
  if (e.server.tickCount % 200 !== 150) return;
  e.server.players.forEach((player) => {
    Object.keys(global.valleyPerkTiers).forEach((tree) => {
      [1, 2, 3].forEach((tier) => {
        let tag = `valley_tier_${tree}_${tier}`;
        let has = global.valleyTierReached(tree, tier, (stage) => player.stages.has(stage));
        if (has) player.addTag(tag);
        else player.removeTag(tag);
      });
    });
  });
});

ItemEvents.rightClicked((e) => {
  let rule = valleyRestrictionOf(e.player, e.item.id);
  if (!rule) return;
  valleyRestrictRefuse(e.player, rule);
  e.cancel();
});

BlockEvents.rightClicked((e) => {
  let rule = valleyRestrictionOf(e.player, e.item.id);
  if (!rule) return;
  valleyRestrictRefuse(e.player, rule);
  e.cancel();
});

BlockEvents.placed((e) => {
  if (!e.player) return;
  let rule = valleyRestrictionOf(e.player, e.block.id);
  if (!rule) return;
  valleyRestrictRefuse(e.player, rule);
  e.cancel();
});

BlockEvents.broken((e) => {
  let rule = valleyRestrictionOf(e.player, e.player.mainHandItem.id);
  if (!rule) return;
  valleyRestrictRefuse(e.player, rule);
  e.cancel();
});
