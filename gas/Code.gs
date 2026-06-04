/**
 * 石門國小 第103屆畢業典禮 — 家長祝福後端（Google Apps Script）
 *
 * - doPost                : 家長送出祝福 → 寫入「回條」分頁（F 欄「公開」預設空白＝尚未公開）
 * - doGet?action=wishes   : 回傳「已公開」的祝福（給前端祝福牆顯示）
 * - doGet（無參數）        : 健康檢查
 *
 * 【審核方式】打開試算表「回條」分頁，在某一列的「公開」欄(F)填 1（或打勾），
 *   該則祝福就會出現在前端祝福牆；清空則隱藏。無需密碼，安全又簡單。
 *
 * 無任何金鑰／密碼，可公開。
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
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var name = (data.name || '').toString().trim().slice(0, 30);
    var klass = (data['class'] || '').toString().trim().slice(0, 20);
    if (!name || !klass) return json_({ ok: false, error: 'missing required fields' });
    getSheet_().appendRow([
      new Date(),
      klass,
      name,
      (data.count || '').toString().slice(0, 20),
      (data.message || '').toString().slice(0, 300)
      // F 欄（公開）留空 → 預設不公開，待老師審核
    ]);
    return json_({ ok: true });
  } catch (err) {
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
  return json_({ ok: true, service: 'smes-grad-103-rsvp' });
}

/**
 * 部署後若跳授權，請在編輯器選此函數按「執行」一次完成授權。
 */
function authorize() {
  getSheet_();
  return 'authorized';
}
