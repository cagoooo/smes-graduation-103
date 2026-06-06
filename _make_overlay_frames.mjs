// 畢業典禮直播・導播機「中央全透明 overlay 外框」產生器
// 輸出 1920x1080 SVG → (由 chrome headless 透明截圖成 PNG)
// 中央完全 alpha=0，只有四邊 / 角落 / 上下有美化外框，疊在現場畫面上美化取景。
import fs from 'fs';

const W = 1920, H = 1080;
const OUT = 'overlay-frames';
fs.mkdirSync(OUT, { recursive: true });

const SCHOOL = '桃園市龍潭區石門國民小學';
const SCHOOL_SHORT = '石門國小';
const EVENT = '114學年度第103屆 畢業典禮';
const EVENT_SHORT = '114畢業典禮';
const YEAR_EN = 'CLASS OF 2026';

// 校徽 base64（優化版 240KB）
const logoB64 = fs.readFileSync('assets/logo.png').toString('base64');
const LOGO = `data:image/png;base64,${logoB64}`;

const CN = `'Microsoft JhengHei','Microsoft JhengHei UI',sans-serif`;
const SERIF = `Georgia,'Times New Roman',serif`;

// 小型決定論 RNG（紙花位置每次一致）
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const diamond = (cx, cy, r, fill) =>
  `<path d="M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z" fill="${fill}"/>`;

const leaf = (x, y, deg, ry, rx, fill) =>
  `<ellipse rx="${rx}" ry="${ry}" fill="${fill}" transform="translate(${x},${y}) rotate(${deg})"/>`;

// 四角擺放：原點在外框角點，圖形畫在 +x,+y 象限，用 scale 翻轉鏡像到四角
function corners(inset, localSvg, which = 'all') {
  const t = [
    `translate(${inset},${inset}) scale(1,1)`,         // 左上
    `translate(${W - inset},${inset}) scale(-1,1)`,     // 右上
    `translate(${inset},${H - inset}) scale(1,-1)`,     // 左下
    `translate(${W - inset},${H - inset}) scale(-1,-1)`,// 右下
  ];
  const use = which === 'top' ? t.slice(0, 2) : t;   // 導師版下排放人像，省略下方角飾
  return use.map(tr => `<g transform="${tr}">${localSvg}</g>`).join('');
}

// 優雅金色捲角（兩條平行貝茲弧 + 寶石 + 細絲）
function scrollCorner(fill, fine) {
  let s = '';
  s += diamond(20, 20, 12, fill);
  s += `<path d="M16,176 C16,86 78,26 178,18" stroke="${fill}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M36,172 C36,100 92,46 176,40" stroke="${fine}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  // 沿弧的細葉
  s += leaf(70, 70, -45, 16, 5.5, fill);
  s += leaf(104, 50, -58, 14, 5, fill);
  s += leaf(140, 38, -68, 12, 4.5, fill);
  s += leaf(50, 104, -32, 14, 5, fill);
  s += leaf(38, 140, -22, 12, 4.5, fill);
  // 末端小寶石
  s += diamond(178, 18, 6, fill) + diamond(18, 178, 6, fill);
  return s;
}

// 學院風 art-deco 角（嵌套直角 + 寶石 + 放射）
function decoCorner(fill, fine) {
  let s = '';
  s += `<path d="M8,168 L8,8 L168,8" stroke="${fill}" stroke-width="3.6" fill="none"/>`;
  s += `<path d="M26,120 L26,26 L120,26" stroke="${fine}" stroke-width="1.6" fill="none"/>`;
  s += `<path d="M44,44 L44,92 M44,44 L92,44" stroke="${fine}" stroke-width="1.4"/>`;
  s += diamond(44, 44, 9, fill);
  s += diamond(8, 168, 6, fill) + diamond(168, 8, 6, fill);
  return s;
}

// 桂冠半環（底部中央，左右對稱）
function laurel(cx, cy, fill, scale = 1) {
  let s = `<g transform="translate(${cx},${cy}) scale(${scale})">`;
  for (const dir of [-1, 1]) {
    s += `<g transform="scale(${dir},1)">`;
    s += `<path d="M0,46 C56,46 96,16 110,-44" stroke="${fill}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const pts = [[18, 44, 30], [40, 40, 18], [62, 30, 4], [82, 14, -10], [96, -8, -26], [104, -32, -40]];
    for (const [x, y, deg] of pts) s += leaf(x, y, deg, 13, 5, fill);
    s += `</g>`;
  }
  return s + `</g>`;
}

// 簡易方帽（畢業帽）
function mortarboard(cx, cy, sc, fill, tassel) {
  return `<g transform="translate(${cx},${cy}) scale(${sc})">
    <path d="M0,-10 L40,4 L0,18 L-40,4 Z" fill="${fill}"/>
    <path d="M-22,9 L-22,24 C-22,33 22,33 22,24 L22,9 L0,18 Z" fill="${fill}" opacity="0.85"/>
    <line x1="40" y1="4" x2="44" y2="30" stroke="${tassel}" stroke-width="2.4"/>
    <circle cx="44" cy="34" r="5" fill="${tassel}"/>
  </g>`;
}

// 置中銘牌（校徽 + 校名 + 活動名）
function plaque({ fillBg, stroke, c1, c2, logo = true, title = EVENT, sub = SCHOOL }) {
  const bw = 760, bh = 96, bx = (W - bw) / 2, by = 30;
  let s = `<g filter="url(#soft)">
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="20" fill="${fillBg}" stroke="${stroke}" stroke-width="1.6"/>
    <rect x="${bx + 8}" y="${by + 8}" width="${bw - 16}" height="${bh - 16}" rx="14" fill="none" stroke="${stroke}" stroke-width="0.8" opacity="0.55"/>
  </g>`;
  let tx = bx + 50;
  if (logo) { s += `<image href="${LOGO}" x="${bx + 26}" y="${by + 18}" width="60" height="60"/>`; tx = bx + 104; }
  s += `<text x="${tx}" y="${by + 40}" font-family="${CN}" font-size="24" fill="${c2}" letter-spacing="1">${sub}</text>`;
  s += `<text x="${tx}" y="${by + 78}" font-family="${CN}" font-size="40" font-weight="700" fill="${c1}" letter-spacing="2">${title}</text>`;
  // 右側小帽飾
  s += mortarboard(bx + bw - 56, by + bh / 2, 0.7, c1, stroke);
  return s;
}

// 底部祝賀
function bottomGreeting(big, en, cFill, cEn) {
  const cx = W / 2, y = 952;
  let s = `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${CN}" font-size="44" font-weight="700" fill="${cFill}" letter-spacing="14">${big}</text>`;
  // 飾線：短線 — 寶石 — 短線
  s += `<line x1="${cx - 250}" y1="${y + 34}" x2="${cx - 30}" y2="${y + 34}" stroke="${cFill}" stroke-width="1.4"/>`;
  s += `<line x1="${cx + 30}" y1="${y + 34}" x2="${cx + 250}" y2="${y + 34}" stroke="${cFill}" stroke-width="1.4"/>`;
  s += diamond(cx, y + 34, 7, cFill);
  if (en) s += `<text x="${cx}" y="${y + 64}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="22" fill="${cEn}" letter-spacing="5">${en}</text>`;
  return s;
}

// 底部祝賀「膠囊」：有底色、貼齊最底線（導師版用，字疊在現場畫面上也看得清楚）
function greetingPill(innerFn, pillFill, pillStroke, inset, pw = 372) {
  const cx = W / 2, ph = 66, yB = H - inset - 6, py = yB - ph;
  let s = `<g filter="url(#soft)"><rect x="${cx - pw / 2}" y="${py}" width="${pw}" height="${ph}" rx="${ph / 2}" fill="${pillFill}" stroke="${pillStroke}" stroke-width="2"/></g>`;
  s += innerFn(cx, py + ph / 2 + 15);
  return s;
}

// 邊緣紙花（只灑在四邊帶狀區，中央淨空）
function confettiEdges(palette, seed) {
  const r = rng(seed);
  const band = 168; // 距邊界範圍
  let s = '';
  for (let i = 0; i < 90; i++) {
    let x, y;
    const edge = i % 4;
    if (edge === 0) { x = r() * W; y = r() * band; }
    else if (edge === 1) { x = r() * W; y = H - r() * band; }
    else if (edge === 2) { x = r() * band; y = band + r() * (H - 2 * band); }
    else { x = W - r() * band; y = band + r() * (H - 2 * band); }
    const c = palette[(r() * palette.length) | 0];
    const sz = 8 + r() * 12;
    if (r() < 0.5) {
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${sz.toFixed(1)}" height="${(sz * 1.6).toFixed(1)}" fill="${c}" opacity="0.92" transform="rotate(${(r() * 360).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    } else {
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(sz / 2).toFixed(1)}" fill="${c}" opacity="0.9"/>`;
    }
  }
  return s;
}

// 右下角小標籤（極簡款用）
function cornerTag({ fillBg, stroke, cText }) {
  const tw = 360, th = 64, tx = W - tw - 56, ty = H - th - 48;
  return `<g filter="url(#soft)">
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="16" fill="${fillBg}" stroke="${stroke}" stroke-width="1.2"/>
    <image href="${LOGO}" x="${tx + 14}" y="${ty + 8}" width="48" height="48"/>
    <text x="${tx + 74}" y="${ty + 40}" font-family="${CN}" font-size="26" font-weight="700" fill="${cText}" letter-spacing="1">${SCHOOL_SHORT} · ${EVENT_SHORT}</text>
  </g>`;
}

function border(inset, gap, sw1, sw2, stroke, rx) {
  return `
    <rect x="${inset}" y="${inset}" width="${W - 2 * inset}" height="${H - 2 * inset}" rx="${rx}" fill="none" stroke="${stroke}" stroke-width="${sw1}"/>
    <rect x="${inset + gap}" y="${inset + gap}" width="${W - 2 * (inset + gap)}" height="${H - 2 * (inset + gap)}" rx="${Math.max(0, rx - 6)}" fill="none" stroke="${stroke}" stroke-width="${sw2}"/>`;
}

const DEFS = `
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3cf"/><stop offset="0.28" stop-color="#f1cf80"/>
      <stop offset="0.5" stop-color="#c79a45"/><stop offset="0.72" stop-color="#f1cf80"/>
      <stop offset="1" stop-color="#a07a2c"/>
    </linearGradient>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff5e6c"/><stop offset="0.2" stop-color="#ff9f43"/>
      <stop offset="0.4" stop-color="#ffd23f"/><stop offset="0.6" stop-color="#2ecc71"/>
      <stop offset="0.8" stop-color="#45aaf2"/><stop offset="1" stop-color="#7d5fff"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.45"/>
    </filter>
    <filter id="outline" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#140d02" flood-opacity="0.9"/>
    </filter>
    <filter id="textsh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#000" flood-opacity="0.7"/>
    </filter>
  </defs>`;

// 給亮/暗畫面都讀得到：金件加深色外光暈
const outlined = (svg) => `<g filter="url(#outline)">${svg}</g>`;

// ───────── 四種主題 ─────────
function themeGoldRoyal(teacher = false) {
  const G = 'url(#gold)', GS = '#caa14a';
  const INSET = 28;  // 外框更往外擴，中央留白更大
  let s = DEFS;
  s += outlined(border(INSET, 14, 3, 1.4, G, 18) + corners(INSET, scrollCorner(G, GS), teacher ? 'top' : 'all'));
  s += plaque({ fillBg: 'rgba(12,22,46,0.84)', stroke: G, c1: '#fff7e4', c2: '#ecd9a6' });
  if (teacher) {
    s += greetingPill((cx, by2) => `<text x="${cx}" y="${by2}" text-anchor="middle" font-family="${CN}" font-size="40" font-weight="700" fill="${G}" letter-spacing="12">畢 業 快 樂</text>`, 'rgba(12,22,46,0.86)', G, INSET);
  } else {
    s += outlined(bottomGreeting('畢 業 快 樂', 'CONGRATULATIONS · ' + YEAR_EN, G, '#ecd9a6'));
  }
  return s;
}

function themeNavyAcademic() {
  const G = 'url(#gold)', GS = '#caa14a';
  let s = DEFS;
  s += outlined(border(50, 14, 3.2, 1.3, G, 6) + corners(50, decoCorner(G, GS)));
  s += plaque({ fillBg: 'rgba(8,16,40,0.9)', stroke: G, c1: '#f5e6b8', c2: '#cdb887', title: EVENT, sub: SCHOOL });
  // 底部桂冠環抱方帽 + 年度
  let bot = laurel(W / 2, 1002, G, 1.55);
  bot += mortarboard(W / 2, 940, 1.3, G, '#caa14a');
  bot += `<text x="${W / 2}" y="1058" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="26" fill="#f0dca2" letter-spacing="6">${YEAR_EN}</text>`;
  s += outlined(bot);
  return s;
}

function themeConfettiJoy(teacher = false) {
  const pal = ['#ff5e6c', '#ff9f43', '#ffd23f', '#2ecc71', '#45aaf2', '#7d5fff'];
  let s = DEFS;
  s += confettiEdges(pal, 20260606);
  // 彩虹外框 + 內白虛線
  const INSET = 28;  // 外框更往外擴，中央留白更大
  s += `<rect x="${INSET}" y="${INSET}" width="${W - 2 * INSET}" height="${H - 2 * INSET}" rx="24" fill="none" stroke="url(#rainbow)" stroke-width="7"/>`;
  s += `<rect x="${INSET + 16}" y="${INSET + 16}" width="${W - 2 * (INSET + 16)}" height="${H - 2 * (INSET + 16)}" rx="16" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="2 12" opacity="0.85"/>`;
  // 角落小帽（彩色）
  s += corners(INSET + 18, mortarboard(70, 70, 0.85, '#ffd23f', '#ff5e6c'), teacher ? 'top' : 'all');
  // 白色置中銘牌
  const bw = 720, bh = 100, bx = (W - bw) / 2, by = 30;
  s += `<g filter="url(#soft)"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="50" fill="rgba(255,255,255,0.94)" stroke="url(#rainbow)" stroke-width="3"/></g>`;
  s += `<image href="${LOGO}" x="${bx + 26}" y="${by + 20}" width="60" height="60"/>`;
  s += `<text x="${bx + 104}" y="${by + 44}" font-family="${CN}" font-size="22" fill="#5566aa" font-weight="700">${SCHOOL_SHORT}・${EVENT}</text>`;
  s += `<text x="${bx + 104}" y="${by + 84}" font-family="${CN}" font-size="40" font-weight="700" fill="#ff5e6c">畢業快樂 <tspan fill="#45aaf2">GRADUATION</tspan> <tspan fill="#2ecc71">2026</tspan></text>`;
  // 底部祝賀
  if (teacher) {
    s += greetingPill((cx, by2) => `<text x="${cx}" y="${by2}" text-anchor="middle" font-family="${CN}" font-size="40" font-weight="700" letter-spacing="12"><tspan fill="#ff5e6c">鵬</tspan><tspan fill="#ff9f43">程</tspan><tspan fill="#2ecc71">萬</tspan><tspan fill="#45aaf2">里</tspan></text>`, 'rgba(255,255,255,0.95)', 'url(#rainbow)', INSET);
  } else {
    const cx = W / 2, y = 966;
    let bot = `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${CN}" font-size="44" font-weight="700" letter-spacing="12"><tspan fill="#ff5e6c">鵬</tspan><tspan fill="#ff9f43">程</tspan><tspan fill="#2ecc71">萬</tspan><tspan fill="#45aaf2">里</tspan></text>`;
    bot += `<text x="${cx}" y="${y + 42}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="24" fill="#ffffff" letter-spacing="5">${YEAR_EN}</text>`;
    s += `<g filter="url(#textsh)">${bot}</g>`;
  }
  return s;
}

function themeMinimalClean() {
  const G = 'url(#gold)';
  let s = DEFS;
  let fr = `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="16" fill="none" stroke="${G}" stroke-width="2.6"/>`;
  fr += `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" rx="10" fill="none" stroke="${G}" stroke-width="0.9" opacity="0.7"/>`;
  // 四角小寶石飾
  fr += corners(40, `${diamond(34, 34, 9, G)}<line x1="34" y1="14" x2="34" y2="54" stroke="${G}" stroke-width="1"/><line x1="14" y1="34" x2="54" y2="34" stroke="${G}" stroke-width="1"/>`);
  s += outlined(fr);
  // 右下小標籤
  s += cornerTag({ fillBg: 'rgba(12,22,46,0.82)', stroke: G, cText: '#f3e3b6' });
  return s;
}

const THEMES = [
  ['01_gold_royal', themeGoldRoyal],
  ['02_confetti_joy', themeConfettiJoy],
  ['03_navy_academic', themeNavyAcademic],
  ['04_minimal_clean', themeMinimalClean],
  // 導師版底框（拿掉底部英文小字 + 省略下方角飾，騰出下排放六位導師人像）
  ['01_gold_royal_tbase', () => themeGoldRoyal(true)],
  ['02_confetti_joy_tbase', () => themeConfettiJoy(true)],
];

for (const [name, fn] of THEMES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${fn()}</svg>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent;width:${W}px;height:${H}px;overflow:hidden}
    svg{display:block}
  </style></head><body>${svg}</body></html>`;
  fs.writeFileSync(`${OUT}/${name}.html`, html);
  console.log('wrote', `${OUT}/${name}.html`);
}
console.log('DONE');
