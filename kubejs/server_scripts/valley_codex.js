// Valley: the codex (spec 11) is the pack's collection quest chapters (crops, fish, cooking, ...): getting an
// item completes its quest. On top of that:
//  - the first time anyone on the server completes one, everyone is told, the finder is recorded, and the finder
//    gets the [발견자] title
//  - reaching 25/50/75/100% of a chapter gives that chapter's titles to the team members online
// /도감 최초  lists the server's first discoveries.
// shortcut: titles are only checked when a quest completes, so progress made before this script existed is not
// counted until the next completion in that chapter; fine for a fresh server.
const ValleyQuest = Java.loadClass("dev.ftb.mods.ftbquests.quest.Quest");

// The item a collection quest asks for (its first task), or null.
const valleyCodexItem = (quest) => {
  let tasks = quest.getTasksAsList();
  if (tasks.isEmpty()) return null;
  let task = tasks.get(0);
  return task.getItemStack ? String(task.getItemStack().id) : null;
};

FTBQuestsEvents.completed((e) => {
  let quest = e.object;
  if (!(quest instanceof ValleyQuest)) return;
  let chapter = String(quest.getChapter().getFilename());
  if (!global.valleyCodexChapters[chapter]) return;
  let server = e.server;
  let player = e.player;

  let firsts = server.persistentData.getCompound("valleyCodexFirsts");
  let key = String(quest.getCodeString());
  let item = valleyCodexItem(quest);
  if (player && item && !firsts.contains(key)) {
    firsts.putString(key, `${player.username}|${global.getDay(player.level)}|${chapter}|${item}`);
    server.persistentData.put("valleyCodexFirsts", firsts);
    server.tell(Text.gold(`★ ${valleyNickOf(player)}님이 서버에서 처음으로 `).append(Item.of(item).getHoverName()).append(Text.gold(` 을(를) 발견했어요!`)));
    valleyTitleGive(player, "first_finder");
  }

  let percent = e.data.getRelativeProgress(quest.getChapter());
  global.valleyCodexTitleIds(chapter, percent).forEach((id) => {
    e.onlineMembers.forEach((member) => valleyTitleGive(member, id));
  });
});

// Codex records (startup_scripts/valley_codex_rules.js): when a codex item lands in a player's inventory, keep the
// first day and the best quality. The codex items are the first-task items of the collection chapters' quests.
const ValleyServerQuestFile = Java.loadClass("dev.ftb.mods.ftbquests.quest.ServerQuestFile");
let valleyCodexItems = null; // item id -> chapter, built on first use
const valleyCodexItemMap = () => {
  if (valleyCodexItems) return valleyCodexItems;
  let map = {};
  ValleyServerQuestFile.INSTANCE.getAllChapters().forEach((chapter) => {
    let file = String(chapter.getFilename());
    if (!global.valleyCodexChapters[file]) return;
    chapter.getQuests().forEach((quest) => {
      let item = valleyCodexItem(quest);
      if (item) map[item] = file;
    });
  });
  valleyCodexItems = map;
  return map;
};

PlayerEvents.inventoryChanged((e) => {
  let item = e.item;
  if (!item || item.isEmpty()) return;
  let id = String(item.id);
  if (!valleyCodexItemMap()[id]) return;
  let quality = item.nbt && item.nbt.contains("quality_food") ? item.nbt.getCompound("quality_food").getInt("quality") : 0;
  let recs = e.player.persistentData.getCompound("valleyCodexRec");
  let next = global.valleyCodexRecordMerge(recs.contains(id) ? recs.getString(id) : "", global.getDay(e.player.level), Math.min(3, quality));
  if (!next) return;
  recs.putString(id, next);
  e.player.persistentData.put("valleyCodexRec", recs);
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands } = e;
  e.register(
    Commands.literal("도감").then(
      // /도감 기록: the held item's record, or counts per chapter.
      Commands.literal("기록").executes((ctx) => {
        let player = ctx.source.player;
        if (!player) return 0;
        let recs = player.persistentData.getCompound("valleyCodexRec");
        let held = player.mainHandItem;
        if (!held.isEmpty() && valleyCodexItemMap()[String(held.id)]) {
          let id = String(held.id);
          if (!recs.contains(id)) return ctx.source.sendSuccess(Text.gray("아직 기록이 없어요."), false), 1;
          let r = global.valleyCodexRecordRead(recs.getString(id));
          ctx.source.sendSuccess(held.getHoverName().copy().append(Text.gold(` · 처음 얻은 날 ${r.day}일째 · 최고 품질 ${global.valleyQualityNames[r.quality]}`)), false);
          return 1;
        }
        let map = valleyCodexItemMap();
        let total = {};
        let mine = {};
        Object.keys(map).forEach((id) => {
          total[map[id]] = (total[map[id]] || 0) + 1;
          if (recs.contains(id)) mine[map[id]] = (mine[map[id]] || 0) + 1;
        });
        let line = Text.gold("내 도감 기록: ");
        Object.keys(global.valleyCodexChapters).forEach((ch) => {
          if (total[ch]) line.append(Text.of(`${global.valleyCodexChapters[ch]} ${mine[ch] || 0}/${total[ch]}  `));
        });
        line.append(Text.of(`탈것 ${valleyMountsOwned(player).length}/${global.valleyMounts.length}`));
        ctx.source.sendSuccess(line, false);
        ctx.source.sendSuccess(Text.gray("도감 아이템을 손에 들고 /도감 기록 하면 그 아이템의 기록을 봐요."), false);
        return 1;
      })
    ).then(
      Commands.literal("최초").executes((ctx) => {
        let firsts = ctx.source.server.persistentData.getCompound("valleyCodexFirsts");
        let rows = [];
        firsts.getAllKeys().forEach((k) => rows.push(String(firsts.getString(k)).split("|")));
        rows.sort((a, b) => Number(b[1]) - Number(a[1]));
        let me = ctx.source.player ? ctx.source.player.username : "";
        let mine = rows.filter((r) => r[0] === String(me)).length;
        ctx.source.sendSuccess(Text.gold(`서버 최초 발견 ${rows.length}개 (내가 찾은 것 ${mine}개). 최근 10개:`), false);
        rows.slice(0, 10).forEach((r) => {
          ctx.source.sendSuccess(Text.gray(` ${r[1]}일째 ${r[0]} - `).append(Item.of(r[3]).getHoverName()), false);
        });
        return 1;
      })
    )
  );
});
