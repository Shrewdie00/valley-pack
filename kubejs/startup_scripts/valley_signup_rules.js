// Valley: signup rules (docs/decisions-onboarding.md). Used by server_scripts/valley_signup.js.
// Plain old JS on purpose: KubeJS's Rhino may lack Array.from(string) and padStart.

global.valleyLobbyRadius = 20;

// Nickname as stored: trimmed, inner runs of spaces made one.
global.valleyCleanNick = (nick) => String(nick).trim().replace(/\s+/g, " ");

// Letters in a nickname, an emoji (surrogate pair) counting as one.
global.valleyNickLength = (nick) => nick.length - (nick.match(/[\uD800-\uDBFF]/g) || []).length;

// null when fine, else the problem to show in the form. nickTaken / idTaken(lowercased text) -> boolean.
global.valleySignupProblem = (twitter, nick, nickTaken, idTaken) => {
  if (!/^[A-Za-z0-9_]{1,15}$/.test(twitter)) return "트위터 아이디는 영문·숫자·_ 1~15자예요";
  if (nick.length < 1 || global.valleyNickLength(nick) > 16) return "닉네임은 1~16자예요";
  if (/[§&\u0000-\u001f\u007f]/.test(nick)) return "닉네임에 쓸 수 없는 글자가 있어요";
  if (nickTaken(nick.toLowerCase())) return "이미 누가 쓰는 닉네임이에요";
  if (idTaken(twitter.toLowerCase())) return "이미 신청한 트위터 아이디예요";
  return null;
};

// A code nobody has yet. random() -> 0..1, taken(code) -> boolean.
global.valleyMakeCode = (random, taken) => {
  for (let i = 0; i < 1000; i++) {
    let code = `VALLEY-${("000" + Math.floor(random() * 10000)).slice(-4)}`;
    if (!taken(code)) return code;
  }
  return null;
};
