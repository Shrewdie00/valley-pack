console.info("[SOCIETY] openShippingBin.js loaded");

BlockEvents.rightClicked(
  ["shippingbin:basic_shipping_bin", "shippingbin:smart_shipping_bin"],
  (e) => {
    const { player, server } = e;
    server.runCommandSilent(
      `playsound shippingbin:block.shippingbin.open block @a ${player.x} ${player.y} ${player.z}`
    );
  }
);
