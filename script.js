/* =========================================================
   石門國小 第103屆畢業典禮 ・ 互動腳本
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 倒數計時：115年6月10日（2026/6/10）09:00 ---------- */
  var TARGET = new Date("2026-06-10T09:00:00+08:00").getTime();
  var elDays = document.getElementById("cd-days");
  var elHours = document.getElementById("cd-hours");
  var elMins = document.getElementById("cd-mins");
  var elSecs = document.getElementById("cd-secs");
  var cdLabel = document.querySelector(".countdown__label");

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function tickCountdown() {
    var now = Date.now();
    var diff = TARGET - now;

    if (diff <= 0) {
      if (elDays) elDays.textContent = "0";
      if (elHours) elHours.textContent = "00";
      if (elMins) elMins.textContent = "00";
      if (elSecs) elSecs.textContent = "00";
      if (cdLabel) cdLabel.textContent = "畢業典禮正在進行・祝福每位畢業生 🎓";
      return false;
    }

    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400);
    var hours = Math.floor((s % 86400) / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;

    if (elDays) elDays.textContent = String(days);
    if (elHours) elHours.textContent = pad(hours);
    if (elMins) elMins.textContent = pad(mins);
    if (elSecs) elSecs.textContent = pad(secs);
    return true;
  }

  if (elDays) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ---------- 捲動進場動畫 ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el, i) {
      // 同一容器內元素依序錯開
      el.style.transitionDelay = ((i % 6) * 60) + "ms";
      io.observe(el);
    });
  }

  /* ---------- 導覽列高亮目前區段 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 回到頂端按鈕 ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 600) toTop.classList.add("is-visible");
      else toTop.classList.remove("is-visible");
    }, { passive: true });
    // 用 JS 捲動，不依賴 href="#top" 錨點：導覽列為 sticky 永遠在視窗頂端，
    // 純錨點會被瀏覽器判定「目標已可見」而不捲動，重複點擊同一 hash 也會失效。
    function scrollToTop() {
      var se = document.scrollingElement || document.documentElement;
      // 標準平滑捲動（現代瀏覽器平滑、舊 Safari 自動即時）
      try {
        window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
      } catch (_) {
        window.scrollTo(0, 0);
      }
      // 保險：若環境的 window.scrollTo 失效，稍後直接歸零捲動容器
      setTimeout(function () {
        if ((se.scrollTop || 0) > 4 || (window.scrollY || 0) > 4) {
          se.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
        }
      }, reduceMotion ? 0 : 650);
    }
    toTop.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToTop();
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    });
  }

  /* ---------- 分享 / 複製連結（含 toast） ---------- */
  var SITE_URL = "https://cagoooo.github.io/smes-graduation-103/";
  var SHARE_TEXT = "石門國小 第103屆畢業典禮｜6/10（三）9:00 本校禮堂・啟程・感恩・祝福";
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2200);
  }
  function fallbackCopy() {
    try {
      var ta = document.createElement("textarea");
      ta.value = SITE_URL; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.top = "-1000px"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, ta.value.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(ok ? "✓ 已複製網址，貼上即可分享給親友" : "請長按網址手動複製：" + SITE_URL);
    } catch (_) { showToast("請長按網址手動複製：" + SITE_URL); }
  }
  function copyUrl() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SITE_URL).then(
        function () { showToast("✓ 已複製網址，貼上即可分享給親友"); },
        fallbackCopy
      );
    } else { fallbackCopy(); }
  }
  var shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      if (navigator.share) {
        navigator.share({ title: "石門國小 第103屆畢業典禮", text: SHARE_TEXT, url: SITE_URL }).catch(copyUrl);
      } else {
        copyUrl();
      }
    });
  }

  /* ---------- 日期感知直播按鈕（即將 / 直播中 / 回放） ---------- */
  (function () {
    var heroLive = document.querySelector(".btn--live");
    var navLive = document.querySelector(".nav__live");
    var ONAIR_START = new Date("2026-06-10T08:45:00+08:00").getTime();
    var ONAIR_END = new Date("2026-06-10T12:00:00+08:00").getTime();
    function setLabel(el, text) {
      if (!el) return;
      var dot = el.querySelector(".btn__live-dot");
      el.textContent = "";
      if (dot) el.appendChild(dot);
      el.appendChild(document.createTextNode(text));
    }
    function update() {
      var now = Date.now();
      if (now >= ONAIR_START && now < ONAIR_END) {
        if (heroLive) { heroLive.classList.remove("is-replay"); setLabel(heroLive, "直播進行中"); }
        if (navLive) { navLive.classList.remove("is-replay"); setLabel(navLive, "LIVE"); }
      } else if (now >= ONAIR_END) {
        if (heroLive) { heroLive.classList.add("is-replay"); setLabel(heroLive, "觀看典禮回放"); }
        if (navLive) { navLive.classList.add("is-replay"); setLabel(navLive, "回放"); }
      } else {
        if (heroLive) { heroLive.classList.remove("is-replay"); setLabel(heroLive, "觀看典禮直播"); }
        if (navLive) { navLive.classList.remove("is-replay"); setLabel(navLive, "LIVE"); }
      }
    }
    update();
    setInterval(update, 30000);
  })();

  /* ---------- 典禮當天：目前進行中的環節高亮 ---------- */
  (function () {
    var items = Array.prototype.slice.call(document.querySelectorAll(".timeline__item"));
    if (!items.length) return;
    var slots = items.map(function (it) {
      var node = it.querySelector(".timeline__time");
      var t = node ? node.textContent : "";
      var m = t.match(/(\d{1,2})\s*[:：]\s*(\d{2})/);
      var time = m ? new Date("2026-06-10T" + ("0" + m[1]).slice(-2) + ":" + m[2] + ":00+08:00").getTime() : null;
      return { el: it, time: time };
    }).filter(function (s) { return s.time; });
    if (!slots.length) return;
    var END = new Date("2026-06-10T12:00:00+08:00").getTime();
    function clearAll() {
      slots.forEach(function (s) {
        s.el.classList.remove("timeline__item--now");
        var b = s.el.querySelector(".timeline__now-badge");
        if (b) b.remove();
      });
    }
    function update() {
      var now = Date.now();
      clearAll();
      if (now < slots[0].time || now >= END) return; // 非典禮進行時段
      var current = null;
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].time <= now) current = slots[i]; else break;
      }
      if (!current) return;
      current.el.classList.add("timeline__item--now");
      var h3 = current.el.querySelector("h3");
      if (h3 && !h3.querySelector(".timeline__now-badge")) {
        var badge = document.createElement("span");
        badge.className = "timeline__now-badge";
        badge.textContent = "進行中";
        h3.appendChild(badge);
      }
    }
    update();
    setInterval(update, 30000);
  })();

  /* ---------- Hero 彩色紙花 ---------- */
  var confettiBox = document.querySelector(".hero__confetti");
  if (confettiBox && !reduceMotion) {
    var colors = ["#ff5e6c", "#ff9f43", "#ffd23f", "#2ecc71", "#45aaf2", "#7d5fff", "#ffffff"];
    var count = window.innerWidth < 600 ? 14 : 26;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var piece = document.createElement("span");
      var left = Math.random() * 100;
      var duration = 6 + Math.random() * 6;
      var delay = -Math.random() * 12;
      var size = 6 + Math.random() * 7;
      piece.style.left = left + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.width = size + "px";
      piece.style.height = (size * 1.5) + "px";
      piece.style.animationDuration = duration + "s";
      piece.style.animationDelay = delay + "s";
      if (Math.random() > 0.5) piece.style.borderRadius = "50%";
      frag.appendChild(piece);
    }
    confettiBox.appendChild(frag);
  }

  /* ---------- Service Worker 註冊 + 版本更新通知 ----------
     僅靠 SW 生命週期偵測（sw.js 內容變了才算更新），不比對任何硬寫版本號，
     徹底避免「APP_VERSION 漂移 / version.json 被 CDN 快取錯位」造成的誤判一直跳。 */
  if ("serviceWorker" in navigator) {
    var banner = document.getElementById("updateBanner");
    var updBtn = document.getElementById("updateBtn");
    var updClose = document.getElementById("updateClose");
    var bannerShown = false, refreshing = false, userInitiated = false;

    function dismissedThisSession() {
      try { return sessionStorage.getItem("swUpdateDismissed") === "1"; } catch (_) { return false; }
    }
    function showUpdateBanner() {
      if (bannerShown || !banner || dismissedThisSession()) return;
      bannerShown = true;
      banner.classList.add("is-visible");
    }
    function hideUpdateBanner() { if (banner) banner.classList.remove("is-visible"); }
    if (updClose) updClose.addEventListener("click", function () {
      hideUpdateBanner();
      try { sessionStorage.setItem("swUpdateDismissed", "1"); } catch (_) {} // 本次工作階段不再提示
    });

    // 只有使用者按「立即更新」觸發接管才重新整理（杜絕自動重整迴圈、首次安裝不重整）
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (refreshing || !userInitiated) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (reg) {
        // 進來就有等待中的新版（上次沒更新就離開）→ 提示一次
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner();

        // 偵測到全新 SW 安裝完成，且已有舊 controller（= 真的有更新，非首次安裝）→ 提示
        reg.addEventListener("updatefound", function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", function () {
            if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner();
          });
        });

        // 點「立即更新」→ 請等待中的 SW 立即接管；沒有等待中的就不動作（避免無謂 reload）
        if (updBtn) updBtn.addEventListener("click", function () {
          hideUpdateBanner();
          if (reg.waiting) {
            userInitiated = true;
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });

        // 回到分頁時最多每分鐘檢查一次是否有新版（sw.js 沒變就不會誤觸發）
        var lastCheck = 0;
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState !== "visible") return;
          var now = Date.now();
          if (now - lastCheck < 60000) return;
          lastCheck = now;
          reg.update().catch(function () {});
        });
      }).catch(function () {});
    });
  }
})();
