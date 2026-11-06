// Valley: what players may ride (docs/decisions-travel.md T3-T6). Used by valley_travel.js.

// T5/T4/T6: players may not ride living animals, Create trains, cars or sailing ships. Vanilla boats, minecarts
// and Create seats are not living, so they stay rideable. Creative mode (admins) is never blocked.
global.valleyMountAllow = ["liltractor:liltractor"]; // gacha mounts (9.2) go here too
global.valleyMountBlock = ["create:carriage_contraption", "automobility:automobile"];

global.valleyMountBlocked = (vehicleType, isLiving) => {
  let type = String(vehicleType);
  if (global.valleyMountAllow.indexOf(type) >= 0) return false;
  return isLiving || global.valleyMountBlock.indexOf(type) >= 0 || type.startsWith("smallships:");
};
