console.info("[SOCIETY] cancelTrophy.js loaded");

BlockEvents.rightClicked("trofers:large_pillar", (e) => {
  if (e.player.isFake()) e.cancel();
});
