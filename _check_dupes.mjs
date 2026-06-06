#!/usr/bin/env node
/**
 * 祝福牆「重複內容偵測」小工具
 *   用法：node _check_dupes.mjs
 *
 * 三層偵測（為什麼這樣設計見 skill gas-line-card-moderation「重複內容偵測」一節）：
 *   A. 文字完全相同（跨收件人）→ 整段照貼的誤送；自動排除「短通用語＋不同人」的巧合
 *   B. 同收件人＋模糊相似（Levenshtein ≥ 82%）→ 「改一個字/表情就重送」的微改重送
 *   ⚠️ 資料的 n 是「被祝福的畢業生(收件人)」非送出者 → 不可用「同名多次」當重複訊號
 *      （熱門孩子收到很多則不同祝福是正常的，會大量誤報）
 *
 * 只「列出疑似」不自動刪：要隱藏 → 試算表把該列「公開(F欄)」清空（審核是人的決定）。
 */
import { readFileSync } from "node:fs";

const THRESHOLD = 0.82; // 同收件人模糊相似門檻

// 從 script.js 取 GAS /exec endpoint（避免硬編、不漂移）
function getEndpoint() {
  const js = readFileSync(new URL("./script.js", import.meta.url), "utf8");
  const m = js.match(/RSVP_ENDPOINT\s*=\s*["']([^"']+)["']/);
  if (!m) throw new Error("找不到 script.js 裡的 RSVP_ENDPOINT");
  return m[1];
}

// 正規化：只留數字/英文字母/中日韓漢字（去標點、空白、emoji、全半形差異）
const strip = (s) => String(s || "").replace(/[^0-9a-z一-鿿]/giu, "");
const clip = (s, n) => { s = String(s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; };

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function sim(x, y) {
  const a = strip(x), b = strip(y);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const L = Math.max(a.length, b.length);
  if ((a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) >= 10) return 0.99; // 一則是另一則的子集
  return 1 - lev(a, b) / L;
}

const EP = getEndpoint();
const res = await fetch(EP + "?action=wishes&t=" + Date.now());
const data = await res.json();
const ws = (data && data.wishes) || [];
console.log(`\n掃描 ${ws.length} 則公開祝福……\n`);

// ── A. 文字完全相同（跨收件人；排除短通用語巧合）──
const exactG = {};
ws.forEach((w) => { const k = strip(w.m); if (k) (exactG[k] = exactG[k] || []).push(w); });
console.log("【A. 文字完全相同（整段照貼誤送）】");
let aHit = 0;
Object.values(exactG).filter((a) => a.length > 1).forEach((a) => {
  const m = a[0].m;
  const names = new Set(a.map((w) => strip(w.n)));
  const tgts = new Set(a.map((w) => strip(w.c)));
  const coincidence = strip(m).length < 12 && names.size === a.length && tgts.size === a.length;
  if (coincidence) return; // 短句＋全是不同人不同對象 → 巧合，不報
  aHit++;
  console.log(`  🔴 「${clip(m, 40)}」`);
  a.forEach((w) => console.log(`       列${w.r} | ${w.c} ${w.n} | ❤️${w.l || 0}`));
});
if (!aHit) console.log("  （無，或皆為不同人的通用短語）");

// ── B. 同收件人＋模糊相似（微改重送）──
console.log(`\n【B. 同收件人＋內容相似 ≥ ${Math.round(THRESHOLD * 100)}%（改字/表情後重送）】`);
const by = {};
ws.forEach((w) => { const k = strip(w.c) + "｜" + strip(w.n); (by[k] = by[k] || []).push(w); });
let bHit = 0;
Object.values(by).forEach((a) => {
  if (a.length < 2) return;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
    const s = sim(a[i].m, a[j].m);
    if (s < THRESHOLD) continue;
    bHit++;
    const keep = (a[i].l || 0) >= (a[j].l || 0) ? a[i] : a[j];
    const hide = keep === a[i] ? a[j] : a[i];
    console.log(`  🔴 相似 ${Math.round(s * 100)}% → ${a[i].c} ${a[i].n}`);
    console.log(`       留 列${keep.r} ❤️${keep.l || 0}：「${clip(keep.m, 44)}」`);
    console.log(`       隱 列${hide.r} ❤️${hide.l || 0}：「${clip(hide.m, 44)}」`);
  }
});
if (!bHit) console.log("  （無）");

console.log("\n提醒：n＝被祝福的畢業生(非送出者)，同一孩子收到多則不同祝福屬正常。");
console.log("要隱藏 → 試算表把該列「公開(F欄)」清空即可（本工具只偵測、不刪資料）。\n");
