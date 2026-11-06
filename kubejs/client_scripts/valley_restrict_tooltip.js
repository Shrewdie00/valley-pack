// Valley: show which skill tier a growth item needs (spec 12, valley_restrict_rules.js).
ItemEvents.tooltip((e) => {
  Object.keys(global.valleyRestricted).forEach((id) => {
    let rule = global.valleyRestricted[id];
    e.add(id, Text.gold(`필요: ${global.valleyTreeNames[rule[0]]} ${rule[1]}단 특성`));
  });
});
