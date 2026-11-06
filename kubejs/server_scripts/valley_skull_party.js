// Valley: party entry to the Skull Cavern (spec 5). Entering while someone from your FTB Teams party is already
// inside puts you next to them instead of at a fresh spot. Used by blockEvents/skullTeleporter.js.
const ValleyTeamsAPI = Java.loadClass("dev.ftb.mods.ftbteams.api.FTBTeamsAPI");

// A party member (not you) who is in the Skull Cavern right now, or null.
const valleySkullPartyMate = (player, server) => {
  let manager = ValleyTeamsAPI.api().getManager();
  let mate = null;
  server.players.forEach((p) => {
    if (!mate && String(p.uuid) !== String(player.uuid) && String(p.level.dimension) === "society:skull_cavern" &&
      manager.arePlayersInSameTeam(player.uuid, p.uuid)) mate = p;
  });
  return mate;
};
