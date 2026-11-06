// Valley: daily crop growth rules (spec 2).
// 1. Out-of-season crops grow at half speed. Dew Drop grows crops once a day at 6 AM but skips any crop
//    Serene Seasons says is out of season (it ignores out_of_season_crop_behavior). So at the start of each
//    day, just before Dew Drop's growth, every watered out-of-season crop gets a 50% chance of one Dew Drop growth.
// 2. One growth per day. Dew Drop grows in the window dayTime 5..15 and re-checks every 10 ticks; Hourglass
//    slows the day so that window lasts ~21 ticks, and farmland that stays wet (sprinklers) grew 2-3 times.
//    We record ages at the start of the day and cut back anything that grew more than one pass after the window.
// shortcut: only crops placed by a player/deployer or added with /valley crops scan are tracked; scan an area if crops are pasted in.

const ValleyFertility = Java.loadClass("sereneseasons.init.ModFertility");
const ValleyDewSeason = Java.loadClass("cool.bot.dewdropfarmland.utils.SeasonUtils");
const ValleyDewCrops = Java.loadClass("cool.bot.dewdropfarmland.utils.CropHandlerUtils");
const ValleyBlockPos = Java.loadClass("net.minecraft.core.BlockPos");
const VALLEY_CROPS_KEY = "valleyTrackedCrops";
const VALLEY_GROWTH_WINDOW_END = 15; // Dew Drop dailyTimeMin 5 + its 10-tick window
let valleyLastDay = -1;
let valleyMorningAges = null; // key -> age at the start of today, until the growth window is over

const valleyTrackedCrops = (server) => {
  // getCompound returns a fresh, detached tag when missing, so attach it once.
  if (!server.persistentData.contains(VALLEY_CROPS_KEY)) server.persistentData.put(VALLEY_CROPS_KEY, server.persistentData.getCompound(VALLEY_CROPS_KEY));
  return server.persistentData.getCompound(VALLEY_CROPS_KEY);
};

const valleyTrackCrop = (server, block) => {
  if (!block.hasTag("minecraft:crops")) return false;
  valleyTrackedCrops(server).putByte(`${block.level.dimension} ${block.x} ${block.y} ${block.z}`, 1);
  return true;
};

// The crop block for a tracked key: "gone" if it should be forgotten, null if its chunk is not loaded
// (Dew Drop does not grow unloaded crops either, and loading them would lag).
const valleyTrackedBlock = (server, key) => {
  let [dim, x, y, z] = key.split(" ");
  let level = server.getLevel(dim);
  if (!level) return "gone";
  let pos = new ValleyBlockPos(Number(x), Number(y), Number(z));
  if (!level.isLoaded(pos)) return null;
  let block = level.getBlock(pos);
  return block.hasTag("minecraft:crops") ? block : "gone";
};

const valleyCropAge = (block) => {
  let age = block.properties.get("age");
  return age == null ? null : Number(age);
};

const valleyGrowOffseason = (block) => {
  let level = block.level;
  let pos = block.pos;
  if (ValleyFertility.isCropFertile(block.id, level, pos) || ValleyDewSeason.isGlassAboveBlock(level, pos)) return;
  let soil = block.down.properties.get("moisture");
  if (!soil || Number(soil) <= 0 || Math.random() >= 0.5) return;
  ValleyDewCrops.handleCropGrowth(block.blockState, level, pos, block.down.blockState, level.random);
};

const valleyStartOfDay = (server) => {
  let crops = valleyTrackedCrops(server);
  valleyMorningAges = new Map();
  crops.getAllKeys().toArray().forEach((key) => {
    let block = valleyTrackedBlock(server, key);
    if (block === "gone") crops.remove(key);
    if (!block || block === "gone") return;
    valleyGrowOffseason(block);
    let age = valleyCropAge(block.level.getBlock(block.pos));
    if (age != null) valleyMorningAges.set(key, age);
  });
};

const valleyEndOfGrowthWindow = (server) => {
  valleyMorningAges.forEach((morningAge, key) => {
    let block = valleyTrackedBlock(server, key);
    if (!block || block === "gone") return;
    let age = valleyCropAge(block);
    // One Dew Drop pass adds getFertilizerIncrease stages (1, or more on fertilized farmland at age 0).
    let allowed = morningAge + ValleyDewCrops.getFertilizerIncrease(morningAge, 99, block.down.blockState);
    if (age == null || age <= allowed) return;
    let props = block.properties;
    props.age = String(allowed);
    block.set(block.id, props);
  });
  valleyMorningAges = null;
};

BlockEvents.placed((e) => {
  valleyTrackCrop(e.server, e.block);
});

ServerEvents.tick((e) => {
  let dayTime = Number(e.server.overworld().getDayTime());
  let day = Math.floor(dayTime / 24000);
  // The first tick of a new day is before Dew Drop's growth at dayTime 5.
  if (valleyLastDay >= 0 && day > valleyLastDay) valleyStartOfDay(e.server);
  else if (valleyMorningAges && dayTime % 24000 >= VALLEY_GROWTH_WINDOW_END) valleyEndOfGrowthWindow(e.server);
  valleyLastDay = day;
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands } = e;
  e.register(
    // Every valley_*.js registers this root; Brigadier merges them but keeps the first .requires, so keep them all at 2.
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("crops").then(
          Commands.literal("scan").executes((ctx) => {
            // Track every crop within 16 blocks of the command position.
            const src = ctx.source;
            const level = src.level;
            const c = src.position;
            let found = 0;
            for (let x = -16; x <= 16; x++)
              for (let y = -16; y <= 16; y++)
                for (let z = -16; z <= 16; z++)
                  if (valleyTrackCrop(src.server, level.getBlock(Math.floor(c.x()) + x, Math.floor(c.y()) + y, Math.floor(c.z()) + z))) found++;
            src.sendSuccess(Text.of(`Tracked ${found} crops`), false);
            return 1;
          })
        )
      )
  );
});
