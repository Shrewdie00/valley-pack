// Valley: a price placeholder (society:money with NBT valley_price, e.g. in the farm market) shows its price.
ItemEvents.tooltip((e) => {
  e.addAdvanced("society:money", (item, advanced, text) => {
    if (item.nbt && item.nbt.valley_price) text.add(1, Text.gold(`가격: ${global.formatPrice(item.nbt.valley_price)}원 (계좌에서)`));
  });
});
