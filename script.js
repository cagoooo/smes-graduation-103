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

  /* ---------- 導覽列手機漢堡選單 ---------- */
  (function () {
    var nav = document.getElementById("top");
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!nav || !toggle || !links) return;
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
    }
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains("is-open"));
    });
    links.addEventListener("click", function (e) { if (e.target.tagName === "A") setOpen(false); });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  })();

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

  /* ---------- YouTube facade：點擊才載入 iframe（省效能 / 隱私），直播 + 畢業歌共用 ---------- */
  [
    { embed: "liveEmbed", play: "liveEmbedPlay", vid: "OiJlVXOzM8U", title: "石門國小第103屆畢業典禮直播" },
    { embed: "songEmbed", play: "songEmbedPlay", vid: "7BaXaZErzcU", title: "畢業歌〈啟程〉MV" }
  ].forEach(function (c) {
    var embed = document.getElementById(c.embed);
    var play = document.getElementById(c.play);
    if (!embed || !play) return;
    play.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + c.vid + "?autoplay=1&rel=0";
      iframe.title = c.title;
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      embed.innerHTML = "";
      embed.appendChild(iframe);
    });
  });

  /* ---------- 日期感知直播狀態（按鈕 + 站內直播區） ---------- */
  (function () {
    var heroLive = document.querySelector(".btn--live");
    var navLive = document.querySelector(".nav__live");
    var liveBadge = document.getElementById("liveBadge");
    var liveStatusText = document.getElementById("liveStatusText");
    var ONAIR_START = new Date("2026-06-10T08:45:00+08:00").getTime();
    var ONAIR_END = new Date("2026-06-10T12:00:00+08:00").getTime();
    function setLabel(el, text) {
      if (!el) return;
      var dot = el.querySelector(".btn__live-dot");
      el.textContent = "";
      if (dot) el.appendChild(dot);
      el.appendChild(document.createTextNode(text));
    }
    function setLive(heroText, navText, replay, badge, status) {
      if (heroLive) { heroLive.classList.toggle("is-replay", replay); setLabel(heroLive, heroText); }
      if (navLive) { navLive.classList.toggle("is-replay", replay); setLabel(navLive, navText); }
      if (liveBadge) { liveBadge.classList.toggle("is-replay", replay); liveBadge.textContent = badge; }
      if (liveStatusText) liveStatusText.textContent = status;
    }
    function update() {
      var now = Date.now();
      if (now >= ONAIR_START && now < ONAIR_END) {
        setLive("直播進行中", "LIVE", false, "LIVE 直播中", "典禮正在直播中 — 點擊畫面即可觀看");
      } else if (now >= ONAIR_END) {
        setLive("觀看典禮回放", "回放", true, "回放", "典禮已圓滿結束 — 點擊畫面觀看完整回放");
      } else {
        setLive("觀看典禮直播", "LIVE", false, "直播", "典禮直播・6月10日（三）上午 9:00 準時上線");
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

  /* ---------- 校園平面圖放大檢視（lightbox） ---------- */
  (function () {
    var openBtn = document.getElementById("campusMapOpen");
    var box = document.getElementById("lightbox");
    var closeBtn = document.getElementById("lightboxClose");
    if (!openBtn || !box) return;
    function open() { box.hidden = false; document.body.style.overflow = "hidden"; }
    function close() { box.hidden = true; document.body.style.overflow = ""; }
    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box || (e.target.className && String(e.target.className).indexOf("lightbox__scroll") !== -1)) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  })();

  /* ---------- 家長線上回條（送出至 Google Apps Script） ---------- */
  (function () {
    // ⬇️ GAS Web App /exec 網址（家長回條寫入 Google 試算表）
    var RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbyQ49Y_tAxh4dBmyK0Rwcb-apR1tShdNpLTPRCKClbyVGQtSX9-atoNDzvCNiucx2NX/exec";

    /* ---- 畢業祝福牆：抓取已公開祝福，渲染置頂跑馬燈 + 卡片牆 ---- */
    (function () {
      var ticker = document.getElementById("topTicker");
      var tickerTrack = document.getElementById("topTickerTrack");
      var wall = document.getElementById("wishWall");
      var cards = document.getElementById("wishCards");
      var count = document.getElementById("wishCount");
      if (!wall || !cards) return;
      function maskName(n) {
        n = String(n || "").trim();
        if (n.length <= 2) return n; // 1~2 字完整顯示（如 王明）
        return n.charAt(0) + new Array(n.length - 1).join("○") + n.charAt(n.length - 1); // 首+中遮+尾：王○明
      }
      function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
        });
      }
      function clip(s, n) { s = String(s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
      function load() {
        fetch(RSVP_ENDPOINT + "?action=wishes&t=" + Date.now())
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var ws = (d && d.wishes) || [];
            if (!ws.length) { wall.hidden = true; if (ticker) ticker.hidden = true; return; }
            cards.innerHTML = ws.map(function (w) {
              return '<div class="wish-card"><div class="wish-card__to">💛 給 ' +
                esc(w.c) + " " + esc(maskName(w.n)) + '</div><div class="wish-card__msg">' +
                esc(w.m) + "</div></div>";
            }).join("");
            if (count) count.textContent = "目前已有 " + ws.length + " 則祝福 💛";
            wall.hidden = false;
            // 置頂跑馬燈：祝福少時補滿、複製一份無縫循環、速度放慢
            if (ticker && tickerTrack) {
              var base = ws.slice();
              while (base.length < 8) base = base.concat(ws);
              var items = base.map(function (w) {
                return '<span class="tw">💛 <b>' + esc(w.c) + " " + esc(maskName(w.n)) + "</b> " + esc(clip(w.m, 38)) + "</span>";
              }).join("");
              tickerTrack.innerHTML = items + items;
              tickerTrack.style.animationDuration = Math.max(60, base.length * 9) + "s";
              ticker.hidden = false;
            }
          })
          .catch(function () { /* 抓不到就不顯示，靜默 */ });
      }
      load();
      setInterval(load, 3 * 60 * 1000);
      window.addEventListener("focus", load);
    })();

    var form = document.getElementById("rsvpForm");
    var pending = document.getElementById("rsvpPending");
    var done = document.getElementById("rsvpDone");
    if (!form) return;

    var ready = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(RSVP_ENDPOINT);
    if (!ready) return; // 端點未設定 → 維持「即將開放」提示

    if (pending) pending.hidden = true;
    form.hidden = false;
    var submit = document.getElementById("rsvpSubmit");

    function finish() {
      form.hidden = true;
      if (done) {
        done.hidden = false;
        try { done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); } catch (_) {}
      }
    }

    var again = document.getElementById("rsvpAgain");
    if (again) again.addEventListener("click", function () {
      form.reset();
      if (done) done.hidden = true;
      form.hidden = false;
      submit.disabled = false; submit.textContent = "送出祝福";
      try { form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); } catch (_) {}
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var payload = JSON.stringify({
        class: document.getElementById("rsvpClass").value,
        name: document.getElementById("rsvpName").value.trim(),
        message: document.getElementById("rsvpMsg").value.trim()
      });
      submit.disabled = true; submit.textContent = "送出中…";
      // GAS Web App 的跨網域回應會經 302 轉址，瀏覽器難以讀取；
      // 採 no-cors 送出（fire-and-forget，text/plain 為簡單請求、不觸發 preflight）。
      var settled = false;
      function ok() { if (settled) return; settled = true; finish(); }
      function fail() {
        if (settled) return; settled = true;
        submit.disabled = false; submit.textContent = "送出回條";
        if (typeof showToast === "function") showToast("送出失敗，請稍後再試或洽詢學校");
      }
      var guard = setTimeout(ok, 10000); // 安全網：避免卡住（no-cors 讀不到回應）
      fetch(RSVP_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload
      }).then(function () { clearTimeout(guard); ok(); })
        .catch(function () { clearTimeout(guard); fail(); });
    });
  })();

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
