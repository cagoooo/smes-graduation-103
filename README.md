# 🎓 石門國小 第103屆畢業典禮宣傳網站

> 桃園市龍潭區石門國民小學・114 學年度第 103 屆畢業典禮
> **啟程・感恩・祝福**

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

- 📺 **線上直播**：https://www.youtube.com/live/OiJlVXOzM8U

## 技術

- 純靜態 HTML / CSS / JavaScript，無框架、零相依
- Mobile-first 響應式設計，適配手機 / 平板 / 桌機
- 支援 `prefers-reduced-motion` 與列印樣式
- 校徽 favicon、apple-touch-icon、PWA manifest
- 1200×630 社群分享 OG 圖（中文渲染進 PNG，LINE/FB 不會方框）
- Service Worker 離線快取 + 版本更新通知（偵測新版主動提示重整）
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
