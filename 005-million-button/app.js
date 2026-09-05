"use strict";
const QUESTIONS = [
  ["1年間、ラーメンが食べられない。", "カップ麺も、つけ麺も対象。うどんとそばはOK。"],
  ["1年間、SNSを見ることができない。", "投稿も閲覧も不可。電話と個別のメッセージは使えます。"],
  ["毎朝6時に起きる生活を、1年間続ける。", "休日も旅行中も。昼寝はしてOK。"],
  ["1年間、スマホの壁紙が自分の変顔になる。", "ロック画面もホーム画面も。写真は自分で選べます。"],
  ["1年間、旅行に行けなくなる。", "日帰りの観光も対象。通勤や帰省はOK。"],
  ["1年間、甘いお菓子を食べられない。", "ケーキもアイスもチョコも。果物は食べられます。"],
  ["1年間、動画を倍速で見られなくなる。", "すべて通常速度。早送りやスキップもできません。"],
  ["1年間、靴下が毎日左右ちがう柄になる。", "どちらも清潔で、履き心地は今のまま。"],
  ["1年間、エレベーターの中で小さく踊る。", "乗るたびに5秒。誰かが一緒でも踊ります。"],
  ["1年間、音楽を自分で選べなくなる。", "好きな時間に聴けますが、曲は毎回ランダムです。"],
  ["1年間、週末のどちらかが片づけの日になる。", "毎週4時間、家の整理整頓に使います。"],
  ["1年間、外食のメニューがくじ引きで決まる。", "店は選べます。アレルギーや食べられないものは除きます。"],
  ["1年間、毎日同じ色の服しか着られない。", "色は最初に選べます。服の形や素材は自由。"],
  ["1年間、ゲームができなくなる。", "スマホ・PC・家庭用ゲームが対象。ボードゲームはOK。"],
  ["1年間、会話の最初に「参上！」と言う。", "対面でも通話でも。仕事中も例外はありません。"],
  ["1年間、コーヒーも紅茶も飲めなくなる。", "カフェラテやミルクティーも対象。麦茶はOK。"],
  ["1年間、通販を使えなくなる。", "ネットで注文する買い物が対象。実店舗で買えます。"],
  ["1年間、毎晩日記を200文字書く。", "公開しなくてOK。書き忘れた分は翌日に追加します。"],
  ["1年間、写真に写ると必ずピースになる。", "集合写真でも証明写真でも、手が勝手にピースします。"],
  ["1年間、映画やドラマの結末を先に知ってしまう。", "見始める直前に結末が頭に浮かびます。"],
  ["1年間、誕生日以外はプレゼントを受け取れない。", "お土産や差し入れも対象。自分で買うのは自由です。"],
  ["1年間、寝る前の1時間はスマホを触れない。", "代わりに本を読んだり、音楽を聴いたりするのはOK。"],
  ["1年間、雨の日はカエル柄の傘を使う。", "かなり目立つ大きなカエル柄。雨はしっかり防げます。"],
  ["1年間、買った服を必ず店員さんに選んでもらう。", "予算とサイズは指定できます。デザインはおまかせ。"],
  ["1年間、毎月1回、人前で歌を披露する。", "友達3人以上の前で1曲。上手さは問いません。"],
  ["1年間、家のすべての時計が7分進む。", "スマホの時計も同じ。頭の中で計算するのはOK。"],
  ["1年間、ポテトの最後の1本を必ず譲る。", "ひとりで食べるときは、最後の1本だけ買った店に置いて帰ります。"],
  ["1年間、カラオケで同じ1曲しか歌えない。", "最初に1曲選べます。聴く曲は自由です。"],
  ["1年間、休みの日は必ず30分散歩する。", "雨の日は屋内でもOK。時間帯は自由です。"],
  ["1年間、すべての通知音が自分の声になる。", "「お知らせだよ！」と録音します。マナーモードは使えます。"]
];
const $ = (id) => document.getElementById(id);
const KEY = "million-button-v1-last";
let deck = [], answers = [], mode = "", phase = "home";
function show(name) { for (const id of ["home", "game", "result"]) $(id).hidden = id !== name; phase = name; }
function dateKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function seeded(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function start(daily = false) {
  const today = dateKey(); mode = daily ? `${today} 今日の10問` : "ランダム10問";
  const random = daily ? seeded(today) : Math.random;
  deck = QUESTIONS.map((_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  deck = deck.slice(0, 10); answers = []; $("share-status").textContent = ""; $("share-copy").hidden = true;
  show("game"); renderQuestion();
}
function renderQuestion() {
  phase = "game"; const q = QUESTIONS[deck[answers.length]];
  $("mode-label").textContent = mode; $("counter").textContent = `${String(answers.length + 1).padStart(2,"0")} / 10`;
  $("progress").value = answers.length; $("question").textContent = q[0]; $("detail").textContent = q[1];
  $("choices").hidden = false; $("decision").hidden = true;
  $("running-total").textContent = `${answers.filter(Boolean).length * 100}万円`;
  $("question").focus();
}
function choose(value) {
  if (phase !== "game") return;
  phase = "answered"; answers.push(value); $("choices").hidden = true; $("decision").hidden = false;
  $("progress").value = answers.length; $("running-total").textContent = `${answers.filter(Boolean).length * 100}万円`;
  $("decision-text").textContent = value ? "押した。仮想の100万円を獲得！" : "押さなかった。この日常は、譲れない。";
  $("next").textContent = answers.length === 10 ? "あなたの結果を見る →" : "次の条件へ →"; $("next").focus();
}
function result() {
  show("result"); const count = answers.filter(Boolean).length;
  const titles = count === 0 ? ["日常はプライスレス", "すべての条件にNO。今の暮らしを丸ごと大切にした10の選択。"] : count <= 3 ? ["譲れないものがある人", "お金より大切なものが、いくつもある。自分の基準を貫いた選択です。"] : count <= 6 ? ["ちょうどいい現実主義者", "条件を見て、受け入れるものを選ぶ。あなたなりのバランスが見えました。"] : count <= 9 ? ["変化を楽しむチャレンジャー", "少し変わった日常も、案外楽しめるかも。新しい暮らしに踏み出した選択です。"] : ["全部押す、覚悟の人", "10個の条件、すべて受け入れた。想像の中の新生活は、かなりにぎやかになりそう。"];
  $("total").textContent = (count * 100).toLocaleString("ja-JP"); $("yes-count").textContent = `${count} / 10`; $("no-count").textContent = `${10-count}個`;
  $("title").textContent = titles[0]; $("description").textContent = titles[1]; $("result-mode").textContent = mode;
  $("review").replaceChildren(); deck.forEach((id, i) => { const li = document.createElement("li"); li.textContent = QUESTIONS[id][0]; const label = document.createElement("strong"); label.textContent = answers[i] ? "押す · ＋100万円" : "押さない · 日常を守る"; li.append(label); $("review").append(li); });
  document.querySelector("details").open = false;
  try { localStorage.setItem(KEY, JSON.stringify({ count, title: titles[0] })); } catch { /* Private browsing may block storage. */ }
  $("result-title").focus();
}
function home() { show("home"); $("last").hidden = true; try { const last = JSON.parse(localStorage.getItem(KEY)); if (last && Number.isInteger(last.count) && last.count >= 0 && last.count <= 10 && typeof last.title === "string") { $("last").textContent = `前回：${last.count * 100}万円 ／ ${last.title}`; $("last").hidden = false; } } catch { /* Ignore invalid or unavailable storage. */ } }
async function share() {
  const text = `【100万円ボタン】10問中${answers.filter(Boolean).length}回押して、仮想の${$("total").textContent}万円！\n称号：${$("title").textContent}\n${mode}\nあなたなら、押す？ #100万円ボタン`;
  const url = /^https?:$/.test(location.protocol) && !["localhost", "127.0.0.1"].includes(location.hostname) ? location.href.split(/[?#]/)[0] : "";
  const full = text + (url ? `\n${url}` : "");
  try { if (navigator.share) { await navigator.share({ title: "100万円ボタン", text, ...(url ? { url } : {}) }); $("share-status").textContent = "共有しました。"; return; } } catch (error) { if (error.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(full); $("share-status").textContent = "結果をコピーしました。好きな場所に貼り付けてください。"; } catch { $("share-copy").hidden = false; $("share-copy").value = full; $("share-copy").select(); $("share-status").textContent = "下のテキストを選択してコピーしてください。"; }
}
$("start").onclick = () => start(); $("daily").onclick = () => start(true); $("again").onclick = () => start();
$("yes").onclick = () => choose(true); $("no").onclick = () => choose(false);
$("next").onclick = () => { if (phase !== "answered") return; answers.length === 10 ? result() : renderQuestion(); };
$("quit").onclick = () => { if (confirm("今回の回答をリセットして、トップに戻りますか？")) home(); };
$("home-button").onclick = home; $("share").onclick = share;
home();
