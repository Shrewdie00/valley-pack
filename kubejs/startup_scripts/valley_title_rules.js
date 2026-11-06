// Valley: titles shown before the name on the nametag, Tab list and chat (spec 10).

// Minecraft color names and their § codes (titles use these names).
global.valleyTitleColorCodes = {
  black: "0", dark_blue: "1", dark_green: "2", dark_aqua: "3", dark_red: "4", dark_purple: "5", gold: "6", gray: "7",
  dark_gray: "8", blue: "9", green: "a", aqua: "b", red: "c", light_purple: "d", yellow: "e", white: "f",
};

global.valleyTitleIdOk = (id) => /^[a-z0-9_]{1,32}$/.test(String(id));

// Team prefix (JSON text): "[title] " with gray brackets.
global.valleyTitlePrefix = (title) =>
  JSON.stringify([
    { text: "[", color: "gray" },
    { text: title.name, color: global.valleyTitleColorCodes[title.color] ? title.color : "gold" },
    { text: "] ", color: "gray" },
  ]);

// The same for the pack's chat line, which uses & codes: "&7[&6title&7] ".
global.valleyTitleChat = (title) =>
  title ? `&7[&${global.valleyTitleColorCodes[title.color] || "6"}${title.name}&7] ` : "";

// Owned title ids are kept as one comma-separated string in player data.
global.valleyTitleIds = (saved) => String(saved || "").split(",").filter((id) => id.length > 0);
global.valleyTitleAdd = (saved, id) => {
  let ids = global.valleyTitleIds(saved);
  if (ids.indexOf(id) < 0) ids.push(id);
  return ids.join(",");
};
global.valleyTitleRemove = (saved, id) => global.valleyTitleIds(saved).filter((x) => x !== id).join(",");
