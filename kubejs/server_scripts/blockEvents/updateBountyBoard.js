console.info("[SOCIETY] updateBountyBoard.js loaded");

BlockEvents.rightClicked("bountiful:bountyboard", (e) => {
  const { level, block } = e;
  let seasonalBounties = ["summer", "spring", "autumn", "winter"];
  let blockNbt = block.getEntityData();
  const decrees = blockNbt.decree_inv.Items;
  let isSeasonal;
  let hasChanged;
  for (let index = 0; index < decrees.length; index++) {
    seasonalBounties.forEach((season) => {
      if (!isSeasonal)
        isSeasonal = decrees[index].tag["bountiful:decree_data"].toString().includes(season);
    });
    if (isSeasonal) {
      blockNbt.decree_inv.Items[index].tag["bountiful:decree_data"] = Object(
        `{"ids":["${global.getSeasonFromLevel(level)}"]}`
      );
      isSeasonal = false;
      hasChanged = true;
    }
  }
  if (hasChanged) {
    global.setBlockEntityData(block, blockNbt);
  }
});
