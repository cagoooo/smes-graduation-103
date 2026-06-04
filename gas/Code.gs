/**
 * 石門國小 第103屆畢業典禮 — 家長線上回條後端（Google Apps Script）
 *
 * 部署方式見同資料夾「部署說明.md」。
 * 本腳本「容器繫結」於一份 Google 試算表，家長送出的回條會寫進「回條」分頁。
 * 無任何金鑰／密碼，可公開。
 */
var SHEET_NAME = '回條';
var HEADERS = ['送出時間', '班級', '畢業生姓名', '出席人數', '祝福悄悄話'];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  // 健康檢查
  return json_({ ok: true, service: 'smes-grad-103-rsvp' });
}

/**
 * 部署後，請在編輯器選此函數按「執行」一次，完成讀寫試算表的授權。
 * （見部署說明.md 步驟 5）
 */
function authorize() {
  getSheet_();
  return 'authorized';
}
