console.info("[SOCIETY] disableQuarkMysticalFlowers.js loaded");

BlockEvents.rightClicked((e) => {
  if (e.block.hasTag("botania:mystical_flowers")) {
    e.cancel();
  }
});
BlockEvents.rightClicked((e) => {
  if (
    e.block.hasTag("dewdrop:waterable") &&
    e.level.getBlock(e.block.getPos().above()).hasTag("botania:mystical_flowers")
  ) {
    e.cancel();
  }
});
