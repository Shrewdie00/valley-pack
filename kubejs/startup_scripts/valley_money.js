// Valley: the one money item (docs/coin-inventory.md 7, 32). It never stays in an inventory: valley_bank.js
// deposits each one as 1 into the holder's account the moment it arrives. Loot tables use it where only items
// can be given (hunting contracts), and it serves as the money icon. Hidden from JEI.
StartupEvents.registry("item", (e) => {
  e.create("society:money").texture("society:item/money");
});

global.hiddenItems.push("society:money");
