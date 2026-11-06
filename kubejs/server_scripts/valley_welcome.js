// Valley: what the deleted welcome quest chapter used to do (decision 8): server game rules and the map stage.
ServerEvents.loaded((e) => {
  ["doPatrolSpawning false", "keepInventory true", "doInsomnia false", "randomTickSpeed 3"].forEach((rule) =>
    e.server.runCommandSilent(`gamerule ${rule}`)
  );
});

// Every town NPC is open from the start: no invitations (docs/decisions-onboarding.md, town NPCs).
const valleyTownNpcs = ["market", "blacksmith", "shepherd", "fisher", "banker", "librarian", "witch", "trader", "carpenter"];

PlayerEvents.loggedIn((e) => {
  e.player.stages.add("ftbchunks_mapping");
  valleyTownNpcs.forEach((npc) => e.player.stages.add(`invited_${npc}`));
});
