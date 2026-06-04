/**
 * 石門國小 第103屆畢業典禮 — 家長祝福後端（Google Apps Script）
 *
 * - doPost                : 家長送出祝福 → 寫入「回條」分頁（F 欄「公開」預設空白＝尚未公開）
 *                           寫入後自動推播 LINE 通知給管理員（阿凱老師）
 * - doGet?action=wishes   : 回傳「已公開」的祝福（給前端祝福牆顯示）
 * - doGet（無參數）        : 健康檢查
 *
 * 【審核方式】打開試算表「回條」分頁，在某一列的「公開」欄(F)填 1（或打勾），
 *   該則祝福就會出現在前端祝福牆；清空則隱藏。無需密碼，安全又簡單。
 *
 * 【LINE 通知】Token / userId 存在「指令碼屬性」(Script Properties)，不寫進程式碼。
 *   設定方式見檔案最下方 setupLineNotify() 的說明，或 gas/部署說明.md。
 *
 * 本檔不含任何金鑰／密碼，可公開。
 */
var SHEET_ID = '1Y0R7ypyhFtHg1O_P9CHp7MM7_3GZ_WpOr3t1dHNNceg';
var SHEET_NAME = '回條';
var HEADERS = ['送出時間', '班級', '畢業生姓名', '出席人數', '祝福悄悄話', '公開(填1或打勾)'];

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else if (!sh.getRange(1, 6).getValue()) {
    // 既有試算表：補上「公開」欄標題(F)
    sh.getRange(1, 6).setValue(HEADERS[5]).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isPublic_(v) {
  var s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === '是' || s === 'v' || s === 'yes' || s === '✓' || s === '公開';
}

function doPost(e) {
  var klass = '', name = '', message = '';
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    name = (data.name || '').toString().trim().slice(0, 30);
    klass = (data['class'] || '').toString().trim().slice(0, 20);
    if (!name || !klass) return json_({ ok: false, error: 'missing required fields' });
    message = (data.message || '').toString().slice(0, 300);
    var sh = getSheet_();
    sh.appendRow([
      new Date(),
      klass,
      name,
      (data.count || '').toString().slice(0, 20),
      message
      // F 欄（公開）留空 → 預設不公開，待老師審核
    ]);
    var total = Math.max(0, sh.getLastRow() - 1); // 扣掉標題列
    notifyNewWish_(klass, name, message, total);  // best-effort LINE 通知（成功）
    return json_({ ok: true });
  } catch (err) {
    notifyError_(String(err), klass, name);        // best-effort LINE 通知（失敗）
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'wishes') {
    try {
      var sh = getSheet_();
      var last = sh.getLastRow();
      var wishes = [];
      if (last >= 2) {
        var vals = sh.getRange(2, 1, last - 1, 6).getValues(); // A..F
        for (var i = 0; i < vals.length; i++) {
          var r = vals[i];
          var msg = String(r[4] || '').trim();   // E 欄：祝福
          if (isPublic_(r[5]) && msg) {           // F 欄：公開
            wishes.push({ c: String(r[1] || '').trim(), n: String(r[2] || '').trim(), m: msg });
          }
        }
      }
      return json_({ ok: true, wishes: wishes });
    } catch (err) {
      return json_({ ok: false, error: String(err), wishes: [] });
    }
  }
  if (action === 'moderate') {
    return handleModerate_(e); // LINE 卡片按鈕審核 → 回傳 HTML 結果頁
  }
  return json_({ ok: true, service: 'smes-grad-103-rsvp' });
}

/* ============================================================
 *  LINE 通知（純 Push 模式）
 *  - 憑證讀自「指令碼屬性」：LINE_CHANNEL_ACCESS_TOKEN / LINE_ADMIN_USER_ID
 *  - 未設定憑證時自動跳過，不影響祝福寫入
 *  - Flex 卡片失敗時自動退回純文字
 * ============================================================ */
var LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push';

function lineCreds_() {
  var p = PropertiesService.getScriptProperties();
  return {
    token: (p.getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '').trim(),
    userId: (p.getProperty('LINE_ADMIN_USER_ID') || '').trim()
  };
}

// 回傳 HTTP 狀態碼；未設定憑證回 -1
function pushLine_(messages) {
  var c = lineCreds_();
  if (!c.token || !c.userId) return -1;
  var res = UrlFetchApp.fetch(LINE_PUSH_API, {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + c.token },
    payload: JSON.stringify({ to: c.userId, messages: messages }),
    muteHttpExceptions: true
  });
  return res.getResponseCode();
}

function clip_(s, n) {
  s = String(s || '').trim();
  if (!s) return '（無內容）';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// 卡片配色（深色 -800 級 + 白字，對比 ≥5:1，LINE App 內標題清晰）
var CARD_THEME_ = {
  success: { bg: '#065F46', sub: '#A7F3D0', icon: '✅' },
  failed:  { bg: '#991B1B', sub: '#FECACA', icon: '❌' }
};

// 組 Flex bubble：mega 寬卡 + 深色 header + emoji 獨立欄位（避免中文 label 被截）
// actions：選填，footer 審核按鈕陣列 [{label, uri, primary, color}]
function buildFlex_(status, title, fields, actions) {
  var t = CARD_THEME_[status] || CARD_THEME_.success;
  var now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'MM/dd HH:mm');
  var header = [
    { type: 'text', text: t.icon, color: '#FFFFFF', size: 'xl' },
    { type: 'text', text: title, color: '#FFFFFF', weight: 'bold', size: 'lg', wrap: true, margin: 'sm' },
    { type: 'text', text: '石門國小 畢業典禮網站', color: t.sub, size: 'sm', margin: 'xs' }
  ];
  var body = fields.map(function (f) {
    return {
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: f.icon, size: 'sm', flex: 0, color: '#64748B' },
        { type: 'text', text: f.label, color: '#64748B', size: 'sm', flex: 3, weight: 'bold' },
        { type: 'text', text: f.value || '—', color: '#0F172A', size: 'sm', flex: 6, wrap: true }
      ]
    };
  });
  var footer = [];
  (actions || []).forEach(function (a) {
    var btn = { type: 'button', height: 'sm', style: a.primary ? 'primary' : 'secondary',
      action: { type: 'uri', label: a.label, uri: a.uri } };
    if (a.color) btn.color = a.color;
    footer.push(btn);
  });
  footer.push({ type: 'text', text: now, color: '#94A3B8', size: 'xs', align: 'end', wrap: true, margin: 'md' });
  return {
    type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: t.bg, paddingAll: '16px', spacing: 'none', contents: header },
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '16px', contents: body },
    footer: { type: 'box', layout: 'vertical', paddingAll: '12px', spacing: 'sm', contents: footer }
  };
}

// 新祝福寫入成功 → 推綠色卡片（含「通過公開 / 維持隱藏」審核按鈕）
function notifyNewWish_(klass, name, message, total) {
  try {
    var row = total + 1; // 對應試算表列號（標題列在第 1 列）
    var title = '收到一則新的畢業祝福';
    var fields = [
      { icon: '🎓', label: '班級', value: klass || '—' },
      { icon: '👤', label: '畢業生', value: name || '—' },
      { icon: '💌', label: '祝福', value: clip_(message, 120) },
      { icon: '📊', label: '累計', value: '第 ' + total + ' 則（待審核）' }
    ];
    var alt = '✅ 收到新祝福：' + (klass || '') + ' ' + (name || '');
    var code = pushLine_([{ type: 'flex', altText: alt, contents: buildFlex_('success', title, fields, moderateActions_(row)) }]);
    if (code !== -1 && code !== 200) {
      pushLine_([{ type: 'text', text:
        '✅ ' + title +
        '\n班級：' + (klass || '—') +
        '\n畢業生：' + (name || '—') +
        '\n祝福：' + clip_(message, 120) +
        '\n累計：第 ' + total + ' 則（待審核）' +
        textModerateLinks_(row) }]);
    }
  } catch (e) { /* best-effort，推播失敗不影響主流程 */ }
}

// 祝福寫入失敗 → 推紅色卡片
function notifyError_(errMsg, klass, name) {
  try {
    var fields = [
      { icon: '🎓', label: '班級', value: klass || '—' },
      { icon: '👤', label: '畢業生', value: name || '—' },
      { icon: '💥', label: '錯誤', value: clip_(errMsg, 200) }
    ];
    var code = pushLine_([{ type: 'flex', altText: '❌ 祝福寫入失敗', contents: buildFlex_('failed', '祝福寫入失敗', fields) }]);
    if (code !== -1 && code !== 200) {
      pushLine_([{ type: 'text', text: '❌ 祝福寫入失敗\n班級：' + (klass || '—') + '\n畢業生：' + (name || '—') + '\n錯誤：' + clip_(errMsg, 200) }]);
    }
  } catch (e) { /* best-effort */ }
}

/**
 * 【一次性】設定 LINE 憑證到指令碼屬性。
 * 用法：
 *   1) 把下面兩個空字串填入你的 LINE Channel Access Token 與 userId
 *   2) 上方函數下拉選 setupLineNotify → 按「執行」（會要求授權，選你的帳號 → 進階 → 允許）
 *   3) 執行成功後，務必把兩個值改回空字串（避免憑證留在程式碼）
 * 替代法：直接在「專案設定（齒輪）→ 指令碼屬性」手動新增
 *         LINE_CHANNEL_ACCESS_TOKEN 與 LINE_ADMIN_USER_ID 兩個屬性，就不必用本函數。
 */
function setupLineNotify() {
  var TOKEN = '';   // ← 貼上 Channel Access Token（執行後請清空）
  var USER_ID = ''; // ← 貼上你的 LINE userId（執行後請清空）
  if (!TOKEN || !USER_ID) {
    throw new Error('請先在 setupLineNotify() 內填入 TOKEN 與 USER_ID 再執行');
  }
  PropertiesService.getScriptProperties().setProperties({
    LINE_CHANNEL_ACCESS_TOKEN: TOKEN,
    LINE_ADMIN_USER_ID: USER_ID
  });
  return 'LINE 憑證已寫入指令碼屬性，請把上面兩個值清空';
}

/**
 * 設定好憑證後，可執行本函數送一張測試卡片到你的 LINE，確認通知正常。
 * 本函數會「明確回報」結果（不像正式通知會靜默失敗），方便診斷：
 *   - 未設定憑證    → 直接丟錯，提醒你去設指令碼屬性
 *   - 未授權對外連線 → 執行前會跳出授權要求（選帳號 → 進階 → 允許）
 *   - 成功         → 執行記錄顯示「LINE 推播成功（HTTP 200）」且手機收到卡片
 */
function testLineNotify() {
  var c = lineCreds_();
  if (!c.token) throw new Error('尚未設定指令碼屬性 LINE_CHANNEL_ACCESS_TOKEN');
  if (!c.userId) throw new Error('尚未設定指令碼屬性 LINE_ADMIN_USER_ID');
  var sh = getSheet_();
  var total = Math.max(1, sh.getLastRow() - 1); // 以最後一列當測試對象（審核按鈕會指向它）
  var fields = [
    { icon: '🎓', label: '班級', value: '六年甲班' },
    { icon: '👤', label: '畢業生', value: '王小明' },
    { icon: '💌', label: '祝福', value: '親愛的孩子，畢業快樂，前程似錦！（測試）' },
    { icon: '📊', label: '累計', value: '第 ' + total + ' 則（測試）' }
  ];
  var code = pushLine_([{ type: 'flex', altText: '✅ LINE 通知測試', contents: buildFlex_('success', '收到一則新的畢業祝福', fields, moderateActions_(total + 1)) }]);
  Logger.log('LINE push HTTP status = ' + code);
  if (code !== 200) {
    throw new Error('LINE 推播失敗，HTTP ' + code + '（請檢查 Token / userId 是否正確）');
  }
  return 'LINE 推播成功（HTTP 200），請查看手機 LINE（卡片下方有審核按鈕）';
}

/* ============================================================
 *  LINE 卡片按鈕審核（方案 A：點按鈕開審核小頁，免 webhook）
 *  - 卡片按鈕帶 row + 安全 token(k)，點擊開本頁直接更新 F 欄「公開」
 *  - token 首次自動生成並存於指令碼屬性 MOD_TOKEN（零設定）
 * ============================================================ */
function getModToken_() {
  var p = PropertiesService.getScriptProperties();
  var t = p.getProperty('MOD_TOKEN');
  if (!t) { t = Utilities.getUuid(); p.setProperty('MOD_TOKEN', t); }
  return t;
}

// 組審核按鈕（給 Flex footer）；拿不到 Web App 網址就回空陣列（安全降級）
function moderateActions_(row) {
  var base = webAppUrl_();
  if (!base || !(row >= 2)) return [];
  var k = encodeURIComponent(getModToken_());
  return [
    { label: '✅ 通過公開', primary: true, color: '#065F46', uri: base + '?action=moderate&row=' + row + '&v=1&k=' + k },
    { label: '🙈 維持隱藏', primary: false, uri: base + '?action=moderate&row=' + row + '&v=0&k=' + k }
  ];
}

// 純文字 fallback 用的審核連結
function textModerateLinks_(row) {
  var base = webAppUrl_();
  if (!base || !(row >= 2)) return '';
  var k = encodeURIComponent(getModToken_());
  return '\n\n✅ 通過公開：' + base + '?action=moderate&row=' + row + '&v=1&k=' + k +
         '\n🙈 維持隱藏：' + base + '?action=moderate&row=' + row + '&v=0&k=' + k;
}

function webAppUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function escHtml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 畢業典禮風格的審核結果頁
function htmlPage_(emoji, title, sub, bodyHtml) {
  var html =
    '<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + escHtml_(title) + '</title><style>' +
    'body{margin:0;font-family:"Noto Sans TC",system-ui,"Microsoft JhengHei",sans-serif;' +
    'background:linear-gradient(160deg,#141d3b,#283a72);color:#fff;min-height:100vh;' +
    'display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;}' +
    '.card{background:rgba(255,255,255,.06);border:1px solid rgba(245,185,66,.35);' +
    'border-radius:20px;padding:32px 26px;max-width:420px;width:100%;text-align:center;' +
    'box-shadow:0 24px 60px rgba(0,0,0,.35);}' +
    '.emoji{font-size:3rem;line-height:1;margin-bottom:10px;}' +
    'h1{font-size:1.35rem;margin:0 0 6px;}' +
    '.sub{color:#cdd6f4;font-size:.95rem;margin-bottom:8px;line-height:1.6;}' +
    '.quote{background:rgba(0,0,0,.22);border-radius:14px;padding:16px 18px;text-align:left;' +
    'font-size:.95rem;line-height:1.75;margin:18px 0;}' +
    '.quote b{color:#f5b942;}' +
    '.btns{display:flex;flex-direction:column;gap:10px;margin-top:8px;}' +
    'a.btn{display:block;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:700;}' +
    '.btn-go{background:#f5b942;color:#141d3b;}' +
    '.btn-alt{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.28);}' +
    '.foot{margin-top:18px;font-size:.8rem;color:rgba(255,255,255,.55);}' +
    '</style></head><body><div class="card">' +
    '<div class="emoji">' + emoji + '</div>' +
    '<h1>' + escHtml_(title) + '</h1>' +
    '<div class="sub">' + escHtml_(sub) + '</div>' +
    (bodyHtml || '') +
    '<div class="foot">石門國小 第103屆畢業典禮 · 祝福審核</div>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle(title);
}

// 處理 LINE 卡片審核按鈕點擊（GET）→ 更新 F 欄並回結果頁
function handleModerate_(e) {
  var p = (e && e.parameter) || {};
  if (p.k !== getModToken_()) {
    return htmlPage_('🔒', '連結無效', '審核權杖不符，請從 LINE 通知卡片重新點按。', '');
  }
  var row = parseInt(p.row, 10);
  var sh = getSheet_();
  if (!(row >= 2 && row <= sh.getLastRow())) {
    return htmlPage_('⚠️', '找不到這筆祝福', '可能已被刪除或列號變動，請改用試算表審核。', '');
  }
  var makePublic = (p.v === '1');
  sh.getRange(row, 6).setValue(makePublic ? 1 : ''); // F 欄：公開
  SpreadsheetApp.flush();

  var klass = String(sh.getRange(row, 2).getValue() || '').trim();
  var name = String(sh.getRange(row, 3).getValue() || '').trim();
  var msg = String(sh.getRange(row, 5).getValue() || '').trim();
  var base = webAppUrl_();
  var k = encodeURIComponent(getModToken_());
  var quote = '<div class="quote"><b>' + escHtml_(klass) + '　' + escHtml_(name) + '</b><br>' + escHtml_(msg) + '</div>';

  if (makePublic) {
    return htmlPage_('✅', '已公開到祝福牆', '這則祝福將顯示在網站祝福牆（約數分鐘內同步，家長重整即見）。', quote +
      '<div class="btns"><a class="btn btn-alt" href="' + base + '?action=moderate&row=' + row + '&v=0&k=' + k + '">改為維持隱藏</a></div>');
  }
  return htmlPage_('🙈', '已維持隱藏', '這則祝福不會顯示在網站祝福牆。', quote +
    '<div class="btns"><a class="btn btn-go" href="' + base + '?action=moderate&row=' + row + '&v=1&k=' + k + '">改為通過公開</a></div>');
}

/**
 * 部署後若跳授權，請在編輯器選此函數按「執行」一次完成授權
 * （含試算表讀寫 + 對外連線兩項權限）。順便初始化審核 token。
 */
function authorize() {
  getSheet_();
  lineCreds_();
  getModToken_();
  return 'authorized';
}
