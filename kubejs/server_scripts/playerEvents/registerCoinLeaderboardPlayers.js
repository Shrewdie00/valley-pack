console.info("[SOCIETY] registerCoinLeaderboardPlayers.js loaded");

PlayerEvents.loggedIn((e) => {
  const { player, server } = e;
  let playerList = server.persistentData.playerList;

  if (playerList == null) {
    playerList = {};
  }
  playerList[player.uuid] = player.name.string;
  server.persistentData.playerList = playerList;
});
