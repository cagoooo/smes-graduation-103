# 🎓 石門國小 第103屆畢業典禮宣傳網站

> 桃園市龍潭區石門國民小學・114 學年度第 103 屆畢業典禮
> **啟程・感恩・祝福**

> 📌 **目前版本：v1.24.0**（依據 `version.json`）

一個專為畢業典禮製作的響應式（RWD）宣傳單頁網站，給全校師生與畢業生家長瀏覽。

🌐 **線上網址**：https://cagoooo.github.io/smes-graduation-103/

---

## 典禮資訊

- **日期**：中華民國 115 年 6 月 10 日（星期三）
- **時間**：上午 9:00 典禮開始
- **地點**：本校禮堂
- **對象**：畢業班師生、全體教職員工、貴賓及畢業生家長

## 網站內容

- 🎓 Hero 主視覺 + 典禮倒數計時
- 📋 典禮資訊（日期／時間／地點／對象）
- 💛 活動意義
- 📅 畢業週活動一覽（畢業考 → 兩次預演 → 典禮）
- ⏱️ 典禮當天完整流程時間軸
- 🌈 校園巡禮路線
- 👨‍👩‍👧‍👦 給家長的溫馨提醒

- 📺 **典禮直播回放**：https://www.youtube.com/live/OiJlVXOzM8U
- 🎬 **祝福影片大集錦**（師長＋六年級各班祝福，附中文 CC 字幕與章節）：https://youtu.be/-vhVoyd8fUs

## 技術

- 純靜態 HTML / CSS / JavaScript，無框架、零相依
- Mobile-first 響應式設計，適配手機 / 平板 / 桌機
- 支援 `prefers-reduced-motion` 與列印樣式
- 校徽 favicon、apple-touch-icon、PWA manifest
- 1200×630 社群分享 OG 圖（中文渲染進 PNG，LINE/FB 不會方框）
- Service Worker 離線快取 + 版本更新通知（純生命週期偵測，偵測新版主動提示重整）
- 加入行事曆（.ics）、一鍵分享（LINE / Facebook / 複製連結 / 原生分享）
- QR Code 宣傳海報（`assets/qr-poster.png`，可列印張貼）
- 日期感知直播按鈕（賽前 → 直播中 → 回放自動切換）+ 典禮當天流程即時高亮
- schema.org Event 結構化資料（Google 活動卡片 / SEO）
- 部署於 GitHub Pages

## 版本維護（更新內容後如何讓使用者收到新版）

每次改完內容要上線時，**先升版再 push**，使用者就會收到「立即更新」提示：

```powershell
# 1. 升版（會同步更新 index.html / sw.js / version.json 內所有版本號）
.\bump-version.ps1 1.2.0
# 2. 推上 GitHub（GitHub Pages 自動部署）
git add -A; git commit -m "bump v1.2.0"; git push
```

> 版本號目前散落在 3 個檔案（`styles.css?v=` / `script.js?v=` / `og:image?v=` / `sw.js` 的 `BUILD_VERSION` / `version.json`），`bump-version.ps1` 會一次全部更新，避免版本漂移。

---

Made with ❤️ by [阿凱老師](https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&nsn=16#a5)

---

<!-- BEGIN:PROJECT_GUIDE -->
## 專案導覽

🎓 桃園市龍潭區石門國民小學 114學年度第103屆畢業典禮宣傳網站（RWD 響應式）

- 專案定位：教育科技／教學支援專案
- Repository：`cagoooo/smes-graduation-103`
- 可見性：公開
- 主要技術：HTML
- 線上入口：<https://cagoooo.github.io/smes-graduation-103/>

### 可以怎麼應用

- 教師備課、課堂示範與學生自主練習
- 依年級、領域或校本課程替換內容，建立可重複使用的教學版本
- 作為教育科技活動、學習成效觀察或 AI 輔助教學的原型

這些是依目前專案定位整理的延伸方向，不代表所有情境都已內建完成；實作前請先確認現有功能與資料格式。

### 技術與專案結構

- `README.md`
- `apple-touch-icon.png`
- `index.html`

檔案結構會隨版本演進；若本節與程式碼不一致，以目前預設分支的原始碼為準。

### 本機執行

這是可直接由瀏覽器載入的靜態網站。可用任一靜態檔案伺服器預覽，例如：
```bash
python -m http.server 8000
```
接著開啟 `http://localhost:8000`。請避免直接以 `file://` 測試需要模組、請求或 Service Worker 的功能。

### 給 AI Agent 的接手指南

1. 先閱讀本 README、`AGENTS.md`（若有）、套件腳本與部署設定。
2. 先辨識教材、題庫、提示詞或設定資料的單一來源，避免只改畫面上的副本。
3. 調整內容時維持適齡、可讀性、無障礙與個資保護。
4. 修改後驗證教師操作流程、學生操作流程，以及桌機、平板、手機的可用性。
5. 不要捏造尚未存在的功能；README 與實作有落差時，應同時更新文件。
6. 提交前只納入本次任務檔案，並記錄實際執行過的驗證。

### 安全與資料注意事項

- 不要提交 `.env`、服務帳號、API 金鑰、token、學生個資或正式環境匯出資料。
- 使用 Firebase、Supabase、Google API 或其他雲端服務時，請建立自己的測試專案並套用最小權限。
- 若要公開衍生作品，請先確認程式碼、圖片、音訊、字型與教材內容的授權。

### 貢獻與客製化

歡迎依教學現場、活動或工作流程需求進行 fork／客製化。建議在變更說明中交代使用情境、主要修改、測試方式，以及是否影響資料格式或部署設定。
<!-- END:PROJECT_GUIDE -->
