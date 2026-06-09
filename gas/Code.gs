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
var SITE_WALL_URL = 'https://cagoooo.github.io/smes-graduation-103/#rsvp'; // 前端祝福牆（審核頁「前往查看」用）
var SITE_PHOTO_URL = 'https://cagoooo.github.io/smes-graduation-103/photo.html'; // 打卡照顯示頁（公開，避開 GAS HtmlService 沙箱）
var HEADERS = ['送出時間', '班級', '畢業生姓名', '出席人數', '祝福悄悄話', '公開(填1或打勾)', '愛心'];
var LATEST_VIEW_NAME = '🆕 最新在最上'; // 唯讀檢視分頁：把「回條」新到舊鏡像顯示（不影響原分頁列序）

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else {
    // 既有試算表：補上缺的欄位標題（F 公開、G 愛心）
    if (!sh.getRange(1, 6).getValue()) sh.getRange(1, 6).setValue(HEADERS[5]).setFontWeight('bold');
    if (!sh.getRange(1, 7).getValue()) sh.getRange(1, 7).setValue(HEADERS[6]).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 建立／確保「🆕 最新在最上」唯讀檢視分頁。
 * - 用 QUERY 把「回條」整批「新到舊」鏡像顯示，並放到最左（第一個分頁）。
 * - 純公式鏡像 → 不改動「回條」任何一列的位置，審核按鈕／愛心的「列號」定位完全不受影響。
 * - 自我修復：缺了就補建；已存在就略過（不強制切換目前分頁，避免打斷正在編輯的老師）。
 * 回傳 'created' | 'exists' | 'error:...'
 */
function ensureLatestView_() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    if (ss.getSheetByName(LATEST_VIEW_NAME)) return 'exists';
    var v = ss.insertSheet(LATEST_VIEW_NAME, 0); // index 0 → 排到最左
    // setFormula 一律吃逗號語法（與試算表語系無關，避開分號 locale 雷）；
    // 第三個參數 1＝把「回條」第 1 列當標題帶出，其餘資料以 A 欄(送出時間)新到舊排序。
    v.getRange('A1').setFormula(
      "=QUERY('" + SHEET_NAME + "'!A:G,\"select * where A is not null order by A desc\",1)"
    );
    v.setFrozenRows(1);
    try {
      v.setColumnWidth(1, 150); // 送出時間
      v.setColumnWidth(5, 460); // 祝福悄悄話（加寬好讀）
      v.setTabColor('#0f9d58');
    } catch (e2) { /* 樣式失敗不影響功能 */ }
    return 'created';
  } catch (e) {
    return 'error:' + e;
  }
}

/** 【手動一次性】在 Apps Script 編輯器選此函數按「執行」，立刻建立「最新在最上」檢視分頁。 */
function setupLatestFirstView() {
  return ensureLatestView_();
}

function isPublic_(v) {
  var s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === '是' || s === 'v' || s === 'yes' || s === '✓' || s === '公開';
}

// 祝福牆愛心 +1（GET）。用 LockService 防多人同時按互相覆蓋；只允許對「已公開」祝福按。
function handleLike_(e) {
  try {
    var row = parseInt((e && e.parameter && e.parameter.row), 10);
    var sh = getSheet_();
    if (!(row >= 2 && row <= sh.getLastRow())) return json_({ ok: false, error: 'bad row' });
    if (!isPublic_(sh.getRange(row, 6).getValue())) return json_({ ok: false, error: 'not public' });
    var lock = LockService.getScriptLock();
    lock.waitLock(8000);
    var likes;
    try {
      var cell = sh.getRange(row, 7); // G 欄：愛心
      likes = Math.max(0, parseInt(cell.getValue(), 10) || 0) + 1;
      cell.setValue(likes);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, likes: likes });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ============================================================
 *  打卡機照片上傳（POST，Content-Type: text/plain 免 CORS preflight）
 *  - base64 jpeg → 存 Drive 資料夾（知道連結即可看）→ 回傳可掃 QR 的連結
 *  - 只給「掃 QR 帶走自己的照片」用；不公開、不上祝福牆（隱私）
 *  - 首次需在編輯器執行 authorize() 授權 Drive（見檔尾）
 * ============================================================ */
var PHOTO_FOLDER_NAME = '石門畢業典禮 · 打卡照';

function getPhotoFolder_() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty('PHOTO_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  p.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

/**
 * 【一次性・打卡機照片用】在編輯器選此函數按「執行」。
 * 因為會用到 DriveApp，第一次執行會「強制跳出 Drive 授權視窗」——選 ipad@ → 進階 → 允許。
 * 不包 try/catch：沒授權會直接報錯（這正是我們要的，逼出授權）；成功則回傳資料夾連結。
 */
function setupPhotos() {
  var folder = getPhotoFolder_();
  Logger.log('打卡照資料夾就緒：' + folder.getUrl());
  return '✅ 打卡照資料夾已就緒：' + folder.getUrl();
}

function handlePhotoUpload_(data) {
  try {
    var b64 = String(data.image || '').replace(/^data:image\/\w+;base64,/, '');
    if (!b64) return json_({ ok: false, error: 'no image' });
    if (b64.length > 9000000) return json_({ ok: false, error: 'image too large' }); // ~6.7MB 保護
    var bytes = Utilities.base64Decode(b64);
    var ts = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd_HHmmss');
    var file = getPhotoFolder_().createFile(Utilities.newBlob(bytes, 'image/jpeg', '畢業打卡_' + ts + '.jpg'));
    // ⚠️ 學校網域禁「對外公開分享」(setSharing ANYONE 會「存取遭拒」)，
    //    故照片保持私有，改由本 Web App 以擁有者身分「代理供圖」(action=pic)，繞過分享限制。
    var id = file.getId();
    // QR 指向我們自己 GitHub Pages 的 photo.html（公開、無沙箱），由它跟 GAS 要 base64 顯示
    return json_({ ok: true, id: id, view: SITE_PHOTO_URL + '?id=' + id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// 代理供圖（JSON）：photo.html 跨域 GET 此端點拿 base64 顯示（避開 GAS HtmlService 沙箱在學校網域對外不可用的問題）。
// 安全：只允許讀「打卡照資料夾」內的檔，避免被拿來讀任意 Drive 檔。
function handlePhotoData_(e) {
  var id = (e && e.parameter && e.parameter.id) || '';
  try {
    var file = DriveApp.getFileById(id);
    var fid = PropertiesService.getScriptProperties().getProperty('PHOTO_FOLDER_ID');
    var inFolder = false, ps = file.getParents();
    while (ps.hasNext()) { if (ps.next().getId() === fid) { inFolder = true; break; } }
    if (!inFolder) return json_({ ok: false, error: 'not found' });
    var blob = file.getBlob();
    return json_({ ok: true, img: 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(blob.getBytes()) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/**
 * 【選配】刪除超過 N 天的打卡照（隱私保存期限）。
 * 用法：編輯器設「時間驅動」每日觸發本函數即可自動清理。預設 30 天。
 */
function cleanupOldPhotos_() {
  var DAYS = 30;
  var cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  var it = getPhotoFolder_().getFiles();
  var n = 0;
  while (it.hasNext()) {
    var f = it.next();
    if (f.getDateCreated() < cutoff) { f.setTrashed(true); n++; }
  }
  return '已清理 ' + n + ' 張超過 ' + DAYS + ' 天的打卡照';
}

function doPost(e) {
  var klass = '', name = '', message = '';
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.action === 'photo') return handlePhotoUpload_(data); // 打卡機照片上傳 → 存 Drive 回傳連結
    name = (data.name || '').toString().trim().slice(0, 30);
    klass = (data['class'] || '').toString().trim().slice(0, 20);
    if (!name || !klass) return json_({ ok: false, error: 'missing required fields' });
    message = (data.message || '').toString().slice(0, 500); // 上限 500 字（須與前端 textarea maxlength 一致）
    var sh = getSheet_();
    sh.appendRow([
      new Date(),
      klass,
      name,
      (data.count || '').toString().slice(0, 20),
      message,
      '', // F 欄（公開）留空 → 預設不公開，待老師審核
      0   // G 欄（愛心）初始 0
    ]);
    var total = Math.max(0, sh.getLastRow() - 1); // 扣掉標題列
    notifyFreeNewWish_(klass, name, message, total); // best-effort 通知（Email 為主 + Google Chat 選配，避開 LINE 200/月 額度）
    ensureLatestView_(); // 自我修復：確保「最新在最上」檢視分頁存在（鏡像公式，不影響本列定位）
    return json_({ ok: true });
  } catch (err) {
    notifyFreeError_(String(err), klass, name);      // best-effort 失敗通知（Email / Chat）
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
        var vals = sh.getRange(2, 1, last - 1, 7).getValues(); // A..G
        for (var i = 0; i < vals.length; i++) {
          var r = vals[i];
          var msg = String(r[4] || '').trim();   // E 欄：祝福
          if (isPublic_(r[5]) && msg) {           // F 欄：公開
            wishes.push({
              c: String(r[1] || '').trim(),
              n: String(r[2] || '').trim(),
              m: msg,
              r: i + 2,                                 // 試算表列號（給愛心定位）
              l: Math.max(0, parseInt(r[6], 10) || 0)   // G 欄：愛心數
            });
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
  if (action === 'like') {
    return handleLike_(e); // 祝福牆愛心 +1
  }
  if (action === 'picdata') {
    return handlePhotoData_(e); // 打卡照 base64（photo.html 跨域取用顯示）
  }
  return json_({ ok: true, service: 'smes-grad-103-rsvp', latestView: ensureLatestView_() });
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

// 組 Flex bubble：giga 最寬卡 + 深色 header + 放大字級（手機/電腦都好讀）
// fields：[{icon,label,value, block?}]，block:true 的欄位改全寬堆疊 + 內容放大（長祝福用）
// actions：選填，footer 審核按鈕陣列 [{label, uri, primary, color}]
function buildFlex_(status, title, fields, actions) {
  var t = CARD_THEME_[status] || CARD_THEME_.success;
  var now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'MM/dd HH:mm');
  var header = [
    { type: 'text', text: t.icon, color: '#FFFFFF', size: 'xxl' },
    { type: 'text', text: title, color: '#FFFFFF', weight: 'bold', size: 'xl', wrap: true, margin: 'sm' },
    { type: 'text', text: '石門國小 畢業典禮網站', color: t.sub, size: 'md', margin: 'sm' }
  ];
  var body = fields.map(function (f) {
    if (f.block) {
      // 全寬堆疊：小標在上、內容放大全寬，長祝福不被擠壓
      return {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px',
        backgroundColor: '#F1F5F9', cornerRadius: '12px',
        contents: [
          { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
            { type: 'text', text: f.icon, size: 'md', flex: 0, color: '#475569' },
            { type: 'text', text: f.label, color: '#475569', size: 'sm', weight: 'bold', flex: 1, gravity: 'center' }
          ] },
          { type: 'text', text: f.value || '—', color: '#0F172A', size: 'lg', weight: 'bold', wrap: true }
        ]
      };
    }
    // 短欄位：水平排列，字級放大到 md，垂直置中
    return {
      type: 'box', layout: 'horizontal', spacing: 'md',
      contents: [
        { type: 'text', text: f.icon, size: 'md', flex: 0, color: '#475569', gravity: 'center' },
        { type: 'text', text: f.label, color: '#475569', size: 'md', flex: 4, weight: 'bold', gravity: 'center' },
        { type: 'text', text: f.value || '—', color: '#0F172A', size: 'md', flex: 7, wrap: true, weight: 'bold', gravity: 'center' }
      ]
    };
  });
  var footer = [];
  (actions || []).forEach(function (a) {
    var btn = { type: 'button', height: 'md', style: a.primary ? 'primary' : 'secondary',
      action: { type: 'uri', label: a.label, uri: a.uri } };
    if (a.color) btn.color = a.color;
    footer.push(btn);
  });
  footer.push({ type: 'text', text: now, color: '#94A3B8', size: 'sm', align: 'end', wrap: true, margin: 'md' });
  return {
    type: 'bubble', size: 'giga',
    header: { type: 'box', layout: 'vertical', backgroundColor: t.bg, paddingAll: '20px', spacing: 'none', contents: header },
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: body },
    footer: { type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'md', contents: footer }
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
      { icon: '💌', label: '祝福', value: clip_(message, 120), block: true },
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
      { icon: '💥', label: '錯誤', value: clip_(errMsg, 200), block: true }
    ];
    var code = pushLine_([{ type: 'flex', altText: '❌ 祝福寫入失敗', contents: buildFlex_('failed', '祝福寫入失敗', fields) }]);
    if (code !== -1 && code !== 200) {
      pushLine_([{ type: 'text', text: '❌ 祝福寫入失敗\n班級：' + (klass || '—') + '\n畢業生：' + (name || '—') + '\n錯誤：' + clip_(errMsg, 200) }]);
    }
  } catch (e) { /* best-effort */ }
}

/* ============================================================
 *  免費無上限通知管道（Email 為主 + Google Chat 選配）
 *  - 取代受 LINE 免費方案 200 則/月 額度限制的 push（畢典爆量時會用罄而靜默失敗）
 *  - Email 收件者：指令碼屬性 NOTIFY_EMAIL；未設定則自動寄給 web app 擁有者（阿凱老師）
 *  - Google Chat：設定指令碼屬性 GOOGLE_CHAT_WEBHOOK 後自動啟用（免費、無則數上限）
 * ============================================================ */
function notifyTargets_() {
  var p = PropertiesService.getScriptProperties();
  var email = (p.getProperty('NOTIFY_EMAIL') || '').trim();
  if (!email) { try { email = Session.getEffectiveUser().getEmail() || ''; } catch (e) {} }
  return { email: email, chat: (p.getProperty('GOOGLE_CHAT_WEBHOOK') || '').trim() };
}

function notifyFreeNewWish_(klass, name, message, total) {
  var row = total + 1;
  var t = notifyTargets_();
  var base = webAppUrl_(), k = encodeURIComponent(getModToken_());
  var approve = base ? base + '?action=moderate&row=' + row + '&v=1&k=' + k : '';
  var hide = base ? base + '?action=moderate&row=' + row + '&v=0&k=' + k : '';
  try {
    if (!t.chat && t.email) { // Google Chat 優先；沒設 webhook 才退回 Email
      var html =
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">' +
        '<div style="background:#065F46;color:#fff;padding:16px 20px">' +
        '<div style="font-size:20px;font-weight:bold">🎓 收到一則新的畢業祝福</div>' +
        '<div style="color:#A7F3D0;font-size:13px;margin-top:4px">石門國小 畢業典禮網站</div></div>' +
        '<div style="padding:18px 20px;color:#0f172a;font-size:15px;line-height:1.8">' +
        '<p><b>班級：</b>' + escHtml_(klass || '—') + '</p>' +
        '<p><b>畢業生：</b>' + escHtml_(name || '—') + '</p>' +
        '<p><b>祝福：</b><br>' + escHtml_(message || '—') + '</p>' +
        '<p style="color:#64748b;font-size:13px">累計第 ' + total + ' 則（待審核）</p>';
      if (approve) html +=
        '<div style="margin-top:14px">' +
        '<a href="' + approve + '" style="display:inline-block;background:#065F46;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;margin-right:8px">✅ 通過公開</a>' +
        '<a href="' + hide + '" style="display:inline-block;background:#e2e8f0;color:#0f172a;text-decoration:none;padding:10px 18px;border-radius:8px">🙈 維持隱藏</a></div>';
      html += '</div></div>';
      MailApp.sendEmail({
        to: t.email,
        subject: '🎓 新祝福｜' + (klass || '—') + ' ' + (name || '—'),
        htmlBody: html,
        body: '收到一則新的畢業祝福\n班級：' + (klass || '—') + '\n畢業生：' + (name || '—') + '\n祝福：' + (message || '—') + '\n累計第 ' + total + ' 則（待審核）' + textModerateLinks_(row),
        name: '石門畢典祝福通知'
      });
    }
  } catch (e) { /* best-effort */ }
  try {
    if (t.chat) {
      UrlFetchApp.fetch(t.chat, {
        method: 'post', contentType: 'application/json; charset=utf-8',
        payload: JSON.stringify(chatWishCard_(klass, name, message, total, row, approve, hide)),
        muteHttpExceptions: true
      });
    }
  } catch (e) { /* best-effort */ }
}

// 組 Google Chat 卡片（cardsV2）：含「✅ 通過公開 / 🙈 維持隱藏」可點按鈕，點了即更新試算表
function chatWishCard_(klass, name, message, total, row, approve, hide) {
  var widgets = [
    { decoratedText: { topLabel: '班級', text: (klass || '—'), wrapText: true } },
    { decoratedText: { topLabel: '畢業生', text: (name || '—'), wrapText: true } },
    { textParagraph: { text: '💌 ' + (message || '—') } },
    { decoratedText: { topLabel: '累計', text: '第 ' + total + ' 則（待審核）' } }
  ];
  var buttons = [];
  if (approve) buttons.push({ text: '✅ 通過公開', onClick: { openLink: { url: approve } } });
  if (hide) buttons.push({ text: '🙈 維持隱藏', onClick: { openLink: { url: hide } } });
  if (buttons.length) widgets.push({ buttonList: { buttons: buttons } });
  return {
    cardsV2: [{
      cardId: 'wish-' + row,
      card: {
        header: { title: '🎓 收到一則新的畢業祝福', subtitle: '石門國小 畢業典禮網站' },
        sections: [{ widgets: widgets }]
      }
    }]
  };
}

function notifyFreeError_(errMsg, klass, name) {
  try {
    var t = notifyTargets_();
    var line = '❌ 祝福寫入失敗\n班級：' + (klass || '—') + '\n畢業生：' + (name || '—') + '\n錯誤：' + clip_(errMsg, 200);
    if (!t.chat && t.email) MailApp.sendEmail({ to: t.email, subject: '❌ 畢典祝福寫入失敗', body: line, name: '石門畢典祝福通知' });
    if (t.chat) UrlFetchApp.fetch(t.chat, { method: 'post', contentType: 'application/json; charset=utf-8', payload: JSON.stringify({ text: line }), muteHttpExceptions: true });
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
    { icon: '💌', label: '祝福', value: '親愛的孩子，畢業快樂，前程似錦！（測試）', block: true },
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
  try {
    // getUrl() 從編輯器執行（如 testLineNotify）會回傳 /dev 測試網址，
    // 那網址只有開著編輯器的開發者能開，別人會看到「需要存取權」。
    // 一律改寫成公開的 /exec，確保 LINE 卡片按鈕在任何人手機上都能點。
    return (ScriptApp.getService().getUrl() || '').replace(/\/dev$/, '/exec');
  } catch (e) { return ''; }
}

function escHtml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 畢業典禮風格的審核結果頁（tone: 'ok' 綠光暈脈動 / 'mute' 灰靜止 / 'warn' 琥珀靜止）
function htmlPage_(emoji, title, sub, bodyHtml, tone) {
  var halo = (tone === 'mute' || tone === 'warn') ? tone : 'ok';
  var authorUrl = 'https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&nsn=16#a5';
  var html =
    '<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
    '<meta name="theme-color" content="#1d2a52">' +
    '<title>' + escHtml_(title) + '</title><style>' +
    '*{box-sizing:border-box;}' +
    // 矮視窗（LINE 內建瀏覽器頂部還有橫幅）用 margin:auto 置中，內容超高時可上下捲動不裁切
    'body{margin:0;min-height:100dvh;display:flex;padding:14px;-webkit-tap-highlight-color:transparent;' +
    'font-family:"Noto Sans TC",system-ui,-apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;' +
    'color:#fff;background:radial-gradient(120% 90% at 50% -10%,#3a4f9e 0%,#233268 42%,#16204a 76%,#101733 100%);}' +
    '.card{margin:auto;width:100%;max-width:560px;background:rgba(255,255,255,.06);' +
    'border:1px solid rgba(245,185,66,.32);border-radius:26px;padding:34px 26px 26px;text-align:center;' +
    'box-shadow:0 30px 70px rgba(0,0,0,.42);animation:rise .55s cubic-bezier(.2,.9,.25,1) both;}' +
    '.halo{position:relative;width:104px;height:104px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;}' +
    '.halo::before{content:"";position:absolute;inset:0;border-radius:50%;' +
    'background:radial-gradient(circle,rgba(110,231,183,.55),transparent 68%);animation:pulse 2.4s ease-in-out infinite;}' +
    '.halo.mute::before{background:radial-gradient(circle,rgba(148,163,184,.42),transparent 68%);animation:none;}' +
    '.halo.warn::before{background:radial-gradient(circle,rgba(248,180,80,.5),transparent 68%);animation:none;}' +
    '.emoji{font-size:3.9rem;line-height:1;position:relative;animation:pop .6s .1s cubic-bezier(.18,1.4,.4,1) both;}' +
    'h1{font-size:1.75rem;margin:2px 0 10px;font-weight:900;letter-spacing:.5px;}' +
    '.sub{color:#cdd6f4;font-size:1.08rem;line-height:1.8;margin:0 auto;max-width:30ch;}' +
    '.pill{display:inline-flex;align-items:center;gap:6px;margin:18px auto 0;padding:10px 20px;' +
    'border-radius:999px;font-weight:800;font-size:1.05rem;}' +
    '.pill.ok{background:rgba(16,185,129,.18);color:#6ee7b7;border:1px solid rgba(110,231,183,.45);}' +
    '.pill.mute{background:rgba(148,163,184,.16);color:#cbd5e1;border:1px solid rgba(203,213,225,.3);}' +
    '.quote{position:relative;background:rgba(0,0,0,.24);border-radius:18px;padding:20px 22px;text-align:left;' +
    'font-size:1.18rem;line-height:1.95;margin:18px 0 4px;border-left:5px solid #f5b942;}' +
    '.quote .who{color:#f5b942;font-weight:800;display:block;margin-bottom:9px;font-size:1.22rem;}' +
    '.quote .msg{color:#eef2ff;white-space:pre-wrap;word-break:break-word;}' +
    '.btns{display:flex;flex-direction:column;gap:13px;margin-top:22px;}' +
    'a.btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:17px 20px;border-radius:999px;' +
    'text-decoration:none;font-weight:800;font-size:1.15rem;transition:transform .14s ease,box-shadow .2s ease;}' +
    'a.btn:active{transform:scale(.97);}' +
    '.btn-go{background:linear-gradient(180deg,#ffd06b,#f5b942);color:#141d3b;box-shadow:0 12px 26px rgba(245,185,66,.4);}' +
    '.btn-alt{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.26);}' +
    '.btn-sheet{background:linear-gradient(180deg,#34d399,#0f9d58);color:#062a1c;box-shadow:0 10px 24px rgba(15,157,88,.36);}' +
    '.foot{margin-top:24px;font-size:.9rem;color:rgba(255,255,255,.5);line-height:1.75;}' +
    '.foot a{color:rgba(255,255,255,.72);text-decoration:none;border-bottom:1px dotted currentColor;}' +
    '.foot a:hover{color:#f5b942;border-bottom-color:#f5b942;}' +
    '.foot .heart{display:inline-block;margin:0 1px;filter:saturate(1.1);}' +
    '@keyframes rise{from{opacity:0;transform:translateY(16px) scale(.97);}to{opacity:1;transform:none;}}' +
    '@keyframes pop{0%{opacity:0;transform:scale(.4) rotate(-10deg);}60%{transform:scale(1.12);}100%{opacity:1;transform:none;}}' +
    '@keyframes pulse{0%,100%{transform:scale(.92);opacity:.7;}50%{transform:scale(1.08);opacity:1;}}' +
    '@media (prefers-reduced-motion:reduce){.card,.emoji{animation:none;}.halo::before{animation:none;}}' +
    '</style></head><body><div class="card">' +
    '<div class="halo ' + halo + '"><div class="emoji">' + emoji + '</div></div>' +
    '<h1>' + escHtml_(title) + '</h1>' +
    '<div class="sub">' + escHtml_(sub) + '</div>' +
    (bodyHtml || '') +
    '<div class="foot">石門國小 第103屆畢業典禮 · 祝福審核<br>' +
    'Made with <span class="heart" aria-label="愛心">❤️</span> by ' +
    '<a href="' + authorUrl + '" target="_blank" rel="noopener noreferrer">阿凱老師</a></div>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html)
    // ⚠️ GAS 把頁面包進 iframe，<head> 裡的 <meta viewport> 會被忽略，
    // 必須用 addMetaTag 注入到外層頁面，手機才會以裝置寬度排版（不然會用 980px 桌機寬再縮小→字超小）。
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle(title);
}

// 處理 LINE 卡片審核按鈕點擊（GET）→ 更新 F 欄並回結果頁
function handleModerate_(e) {
  var p = (e && e.parameter) || {};
  if (p.k !== getModToken_()) {
    return htmlPage_('🔒', '連結無效', '審核權杖不符，請從 LINE 通知卡片重新點按。', '', 'warn');
  }
  var row = parseInt(p.row, 10);
  var sh = getSheet_();
  if (!(row >= 2 && row <= sh.getLastRow())) {
    return htmlPage_('⚠️', '找不到這筆祝福', '可能已被刪除或列號變動，請改用試算表審核。', '', 'warn');
  }
  var makePublic = (p.v === '1');
  sh.getRange(row, 6).setValue(makePublic ? 1 : ''); // F 欄：公開
  SpreadsheetApp.flush();

  var klass = String(sh.getRange(row, 2).getValue() || '').trim();
  var name = String(sh.getRange(row, 3).getValue() || '').trim();
  var msg = String(sh.getRange(row, 5).getValue() || '').trim();
  var base = webAppUrl_();
  var k = encodeURIComponent(getModToken_());
  var toggleHide = base + '?action=moderate&row=' + row + '&v=0&k=' + k;
  var togglePub = base + '?action=moderate&row=' + row + '&v=1&k=' + k;
  // 直接 deep-link 跳到這筆祝福在「回條」分頁的那一列（手機點開 Sheets 即定位到該列）
  var sheetUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit#gid=' + sh.getSheetId() + '&range=A' + row;
  var sheetBtn = '<a class="btn btn-sheet" href="' + sheetUrl + '" target="_blank" rel="noopener noreferrer">📊 開啟試算表編輯／檢查</a>';
  var wallBtn = '<a class="btn btn-alt" href="' + SITE_WALL_URL + '" target="_blank" rel="noopener noreferrer">🔍 前往祝福牆查看</a>';
  var quote = '<div class="quote"><span class="who">' + escHtml_(klass) + '　' + escHtml_(name) +
    '</span><span class="msg">' + escHtml_(msg) + '</span></div>';

  if (makePublic) {
    var bodyPub = '<div class="pill ok">🟢 目前狀態：公開中</div>' + quote +
      '<div class="btns">' +
      '<a class="btn btn-go" href="' + SITE_WALL_URL + '" target="_blank" rel="noopener noreferrer">🔍 前往祝福牆查看</a>' +
      '<a class="btn btn-alt" href="' + toggleHide + '">🙈 改為維持隱藏</a>' +
      sheetBtn +
      '</div>';
    return htmlPage_('✅', '已公開到祝福牆', '這則祝福將顯示在網站祝福牆（約數分鐘內同步，家長重整即見）。', bodyPub, 'ok');
  }
  var bodyHide = '<div class="pill mute">🔒 目前狀態：隱藏中</div>' + quote +
    '<div class="btns">' +
    '<a class="btn btn-go" href="' + togglePub + '">✅ 改為通過公開</a>' +
    wallBtn +
    sheetBtn +
    '</div>';
  return htmlPage_('🙈', '已維持隱藏', '這則祝福不會顯示在網站祝福牆。', bodyHide, 'mute');
}

/**
 * 部署後若跳授權，請在編輯器選此函數按「執行」一次完成授權
 * （含試算表讀寫 + 對外連線 + Drive 三項權限）。順便初始化審核 token 與打卡照資料夾。
 * ⚠️ 新增 Drive（打卡機照片）後，授權完請到「部署 → 管理部署 → 編輯 → 版本：新版本」重新部署一次，
 *    clasp 部署不一定會綁進剛授權的新範圍（與 MailApp 同類雷）。/exec 網址不變。
 */
function authorize() {
  getSheet_();
  lineCreds_();
  getModToken_();
  try { getPhotoFolder_(); } catch (e) {} // 觸發 Drive 授權 + 預建「打卡照」資料夾
  return 'authorized';
}
