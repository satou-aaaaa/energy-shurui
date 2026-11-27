// エネルギーの種類あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、札幌市教育委員会の中学3年理科 学習課題「エネルギー」「エネルギーの変換」・経済産業省 資源エネルギー庁のエネルギー教育の教材・広島大学附属中・高等学校の授業実践（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 1問は、身のまわりの場面や説明を読んで、エネルギーの種類（位置・運動・電気・熱・化学エネルギー）を選ぶ。正解したら2段目「どんなエネルギー？」を選ぶ。
// 光・音・弾性・核エネルギーは扱わない。発電のしくみは「発電のしくみくらべ」で扱う。
// 選び肢は、ほかの4つから選ぶ（やさしいは2つ、ふつう・むずかしいは3つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    sap1: ["札幌市教育委員会 中学3年理科 学習課題「エネルギー」", "https://www.city.sapporo.jp/kyoiku/shido/documents/2_3_4_24new.pdf"],
    sap2: ["札幌市教育委員会 中学3年理科 学習課題「エネルギーの変換」", "https://www.city.sapporo.jp/kyoiku/shido/documents/2_3_4_25new.pdf"],
    meti: ["経済産業省 資源エネルギー庁 エネルギー教育「エネルギーの変換」", "https://energy-kyoiku.meti.go.jp/assets/109/mt_energy_p36-37.pdf"],
    hiro: ["広島大学附属中・高等学校 授業実践「運動とエネルギー」", "https://www.hiroshima-u.ac.jp/system/files/145496/teachingplan2019_Part28.pdf"],
  };

  // 答えになる5つ
  const CLASSES = ["位置エネルギー", "運動エネルギー", "電気エネルギー", "熱エネルギー", "化学エネルギー"];

  // 2段目「どんなエネルギー？」の3つ
  const GROUPS = {
    rikigaku: { name: "力学的エネルギーのなかま", sub: "物体の高さや動きによる" },
    denryu: { name: "電流がもつもの", sub: "モーターを回したり電球を光らせたりできる" },
    busshitsu: { name: "物質や温度によるもの", sub: "化学反応や、ものの温度に関係する" },
  };
  // 何で決まる・何ができる（「なぜ」に出す。資源エネルギー庁の教材・広島大学附属の授業実践）
  const CATS = { takasa: "高さと質量で大きさが決まる", hayasa: "速さと質量で大きさが決まる", motor: "モーターを回したり電球を光らせたりできる", ondo: "ものの温度を上げることができる", hanno: "化学反応で熱や光・電気に変わることができる" };
  // 答えごとの決まり。2段目・何で決まる・決め手はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "位置エネルギー": { grp: "rikigaku", cat: "takasa", key: "高い位置にあるものは位置エネルギーをもっています。高い所にあるほど、重いほど大きくなります。" },
    "運動エネルギー": { grp: "rikigaku", cat: "hayasa", key: "動いているものは運動エネルギーをもち、他のものを動かしたり変形させたりできます。速いほど、質量が大きいほど大きくなります。" },
    "電気エネルギー": { grp: "denryu", cat: "motor", key: "電気エネルギーは、モーターを回したり、電球を光らせたりすることができます。" },
    "熱エネルギー": { grp: "busshitsu", cat: "ondo", key: "熱エネルギーは、ものの温度を上げることができます。" },
    "化学エネルギー": { grp: "busshitsu", cat: "hanno", key: "化学エネルギーは、化学反応によって熱や光、電気など他のエネルギーに変わることができます。" },
  };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  const MEDIA = ["理科室で", "理科の授業で", "実験ノートで", "家で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["実験した。", "理科の授業で。", "プリントの問題。", "身のまわりで。", "ノートより。"];

  // どれかを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　どのエネルギー？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類を作る。grp・cat・key は答えの決まり RULE から。clue は手がかりの文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("i_takai", 0, "位置エネルギー", "高い所のおもり", ["meti", "sap1"], "高さに注目しましょう。",
      "高い位置にあるものは位置エネルギーをもっていて、重力によって落下し、他のものを動かすことができます（資源エネルギー庁の教材）。札幌市の学習課題では、おもりを落としてくいを打ちこむ実験で調べます。",
      ["高い所に持ち上げたおもりがもっているエネルギー。手をはなすと落ちて、くいを打ちこめる。"]),
    K("u_ball", 0, "運動エネルギー", "転がるボール", ["meti"], "動いていることに注目しましょう。",
      "動いているものは運動エネルギーをもち、他のものを動かしたり、変形させたりすることができます（資源エネルギー庁の教材）。",
      ["転がっているボールがもっていて、ぶつかると他のものを動かしたり変形させたりできるエネルギー。"]),
    K("d_motor", 0, "電気エネルギー", "モーターや電球", ["meti"], "コンセントや電池から来るものです。",
      "電気エネルギーは、モーターを回したり、電球を光らせたりすることができます（資源エネルギー庁の教材）。",
      ["モーターを回したり、電球を光らせたりできるエネルギー。"]),
    K("n_ondo", 0, "熱エネルギー", "温度を上げる", ["meti"], "温かさに注目しましょう。",
      "熱エネルギーは、ものの温度を上げることができます（資源エネルギー庁の教材）。",
      ["ものの温度を上げることができるエネルギー。"]),
    K("k_gasoline", 0, "化学エネルギー", "ガソリン", ["meti"], "燃やす前の燃料がもっているものです。",
      "自動車は、ガソリンなどの化学エネルギーが燃焼によって熱エネルギーなどに変わり、ピストンを動かす運動エネルギーに変わって走ります（資源エネルギー庁の教材）。",
      ["燃やす前のガソリンがもっていて、燃焼によって熱などに変わるエネルギー。"]),
    // ---- ふつう ----
    K("i_omosa", 1, "位置エネルギー", "高さと重さで決まる", ["meti", "hiro"], "速さは関係ありません。",
      "同じ高さなら重いほど、同じ重さなら高い所にあるほど大きくなります（資源エネルギー庁の教材）。大きさは物体の高さと質量に比例します（広島大学附属の授業実践）。",
      ["同じ重さなら高い所にあるほど大きく、同じ高さなら重いほど大きいエネルギー。"]),
    K("u_hayasa", 1, "運動エネルギー", "速さと質量で決まる", ["meti", "sap1"], "高さは関係ありません。",
      "運動エネルギーは、速さや物体の質量によって大きさが変わります（資源エネルギー庁の教材・札幌市の学習課題）。",
      ["質量が同じなら速いほど、速さが同じなら質量が大きいほど大きいエネルギー。"]),
    K("d_iron", 1, "電気エネルギー", "アイロンのもと", ["sap2"], "変換のはじまりはどれか。",
      "アイロンは、電気エネルギーを熱エネルギーに変換しています（札幌市の学習課題）。",
      ["アイロンが熱くなるとき、もとになっている、コンセントから送られてくるエネルギー。"]),
    K("n_hakunetsu", 1, "熱エネルギー", "白熱電球が熱くなる", ["sap2"], "光以外に変わったものです。",
      "白熱電球は、100の電気エネルギーのうち10を光エネルギーに変え、残りの90は熱エネルギーなどになります（札幌市の学習課題）。",
      ["白熱電球を光らせると電球が熱くなった。光のほかに、いちばん多く変わったエネルギー。"]),
    K("k_hanno", 1, "化学エネルギー", "化学反応で変わる", ["meti"], "物質がもっているものです。",
      "化学エネルギーは、化学反応によって熱や光、電気など他のエネルギーに変わることができます（資源エネルギー庁の教材）。",
      ["物質の中にたくわえられていて、化学反応によって熱や光、電気などに変わることができるエネルギー。"]),
    // ---- むずかしい ----
    K("i_furiko", 2, "位置エネルギー", "振り子のいちばん高い所", ["hiro", "sap1"], "止まった瞬間は速さが0です。",
      "振り子では位置エネルギーと運動エネルギーが移り変わります（札幌市の学習課題）。いちばん高い所で止まった瞬間は、運動エネルギーが0で、位置エネルギーがいちばん大きくなります。",
      ["振り子のおもりが、いちばん高い所で一瞬止まったとき、いちばん大きくなっているエネルギー。"]),
    K("u_niji", 2, "運動エネルギー", "速さの2乗に比例", ["hiro"], "2乗に比例するのはどちらか。",
      "運動エネルギーの大きさは、物体の速さの2乗と質量に比例します（広島大学附属の授業実践）。",
      ["大きさが、物体の速さの2乗と質量に比例するエネルギー。"]),
    K("d_kouritsu", 2, "電気エネルギー", "変換効率のもと", ["sap2"], "100にあたるのはどれか。",
      "白熱電球は100の電気エネルギーを10の光エネルギーに、LED電球は同じ100で30の光エネルギーに変換できます。もとのエネルギーから目的のエネルギーに変換された割合を変換効率といいます（札幌市の学習課題）。",
      ["電球の変換効率をくらべるとき、白熱電球もLED電球も100として与える、もとのエネルギー。"]),
    K("n_masatsu", 2, "熱エネルギー", "自動車の摩擦と排気", ["meti"], "走ることには使われなかった分です。",
      "自動車では、燃焼でできたエネルギーの一部が、排気や摩擦によって熱エネルギーになって外へ出ていきます（資源エネルギー庁の教材）。エネルギーがすがたを変えるときは、一部が熱などのすがたで放出されることがあります。",
      ["自動車が走るとき、排気や摩擦によって、走ることに使われずに外へ出ていくエネルギー。"]),
    K("k_hatsunetsu", 2, "化学エネルギー", "発熱反応のもと", ["meti"], "反応の前の物質がもっていたものです。",
      "物質が化学変化を起こすとき、化学エネルギーが熱などに変わります。熱を出す化学変化を発熱反応といいます（資源エネルギー庁の教材）。",
      ["発熱反応で熱が出るとき、反応する前の物質がもっていたエネルギー。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "i_takai|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null; // 継承した constructor などは知らない種類として扱う（CodeRabbit 2026-11-17）
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const ENS = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = ENS; else root.ENS = ENS;
})(typeof self !== "undefined" ? self : this);
