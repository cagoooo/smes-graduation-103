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
    { embed: "songEmbed", play: "songEmbedPlay", vid: "ZCV1j_9mW8A", title: "畢業歌〈風箏〉MV" }
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
      var filters = document.getElementById("wishFilters");
      if (!wall || !cards) return;
      var allWishes = [], curFilter = "全部", lastSeenMaxR = null;
      function maskName(n, c) {
        n = String(n || "").trim();
        // 僅「六年X班」畢業生需去識別化保護未成年隱私；師長 / 其他（校友、職員、家屬…）一律完整顯示
        if (String(c || "").indexOf("班") === -1) return n;
        if (n.length <= 1) return n;                    // 單字無從去識別化
        if (n.length === 2) return n.charAt(0) + "○";   // 兩字：遮末字（王○）
        return n.charAt(0) + new Array(n.length - 1).join("○") + n.charAt(n.length - 1); // 首+中遮+尾：王○明
      }
      function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
        });
      }
      function clip(s, n) { s = String(s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
      function likedSet() {
        try { return JSON.parse(localStorage.getItem("smes_liked") || "[]"); } catch (e) { return []; }
      }
      function hasLiked(r) { return likedSet().indexOf(r) !== -1; }
      function markLiked(r) {
        try { var a = likedSet(); if (a.indexOf(r) === -1) { a.push(r); localStorage.setItem("smes_liked", JSON.stringify(a)); } } catch (e) {}
      }
      function cardHTML(w) {
        var likeBtn = "";
        if (w.r) { // 後端有回列號才顯示愛心鈕（舊後端無 r → 優雅降級不顯示）
          var liked = hasLiked(w.r);
          likeBtn = '<button type="button" class="wish-like' + (liked ? " is-liked" : "") +
            '" data-row="' + w.r + '"' + (liked ? " disabled" : "") + ' aria-label="給這則祝福一個愛心">' +
            '<span class="wish-like__heart">❤️</span><span class="wish-like__n">' + (w.l || 0) + "</span></button>";
        }
        return '<div class="wish-card"><div class="wish-card__to">💛 給 ' +
          esc(w.c) + " " + esc(maskName(w.n, w.c)) + '</div><div class="wish-card__msg">' +
          esc(w.m) + "</div>" + likeBtn + "</div>";
      }
      var curPage = 0, PAGE_SIZE = 6; // 主頁祝福牆分頁，避免越拉越長
      function renderPager(totalPages) {
        var pager = document.getElementById("wishPager");
        if (!pager) return;
        if (totalPages <= 1) { pager.hidden = true; pager.innerHTML = ""; return; }
        pager.hidden = false;
        pager.innerHTML =
          '<button type="button" class="wish-pager__btn" data-dir="prev"' + (curPage <= 0 ? " disabled" : "") + ' aria-label="上一頁">‹ 上一頁</button>' +
          '<span class="wish-pager__info">第 ' + (curPage + 1) + ' / ' + totalPages + ' 頁</span>' +
          '<button type="button" class="wish-pager__btn" data-dir="next"' + (curPage >= totalPages - 1 ? " disabled" : "") + ' aria-label="下一頁">下一頁 ›</button>';
      }
      function renderCards() {
        var list = curFilter === "全部" ? allWishes.slice() : allWishes.filter(function (w) { return w.c === curFilter; });
        list.sort(function (a, b) { return (b.l || 0) - (a.l || 0); }); // 愛心多的排前面（熱門優先）
        var totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
        if (curPage >= totalPages) curPage = totalPages - 1;
        if (curPage < 0) curPage = 0;
        cards.innerHTML = list.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE).map(cardHTML).join("");
        renderPager(totalPages);
        if (count) {
          count.textContent = curFilter === "全部"
            ? "目前已有 " + allWishes.length + " 則祝福 💛"
            : curFilter + "：" + list.length + " 則（全校 " + allWishes.length + " 則）💛";
        }
      }
      function buildFilters() {
        if (!filters) return;
        var classes = [];
        allWishes.forEach(function (w) { var c = String(w.c || "").trim(); if (c && classes.indexOf(c) === -1) classes.push(c); });
        if (classes.length <= 1) { filters.hidden = true; filters.innerHTML = ""; return; } // 只有一個班就不顯示篩選
        classes.sort();
        var opts = ["全部"].concat(classes);
        filters.innerHTML = opts.map(function (c) {
          return '<button type="button" class="wish-chip' + (c === curFilter ? " is-active" : "") + '" data-class="' + esc(c) + '">' + esc(c) + "</button>";
        }).join("");
        filters.hidden = false;
      }
      if (filters) {
        filters.addEventListener("click", function (e) {
          var btn = e.target;
          if (!btn.classList || !btn.classList.contains("wish-chip")) return;
          curFilter = btn.getAttribute("data-class") || "全部";
          var bs = filters.querySelectorAll(".wish-chip");
          for (var i = 0; i < bs.length; i++) bs[i].classList.toggle("is-active", bs[i] === btn);
          curPage = 0; // 切班級回到第一頁
          renderCards();
        });
      }
      // 主頁祝福牆翻頁（左右切換，避免一次顯示全部越拉越長）
      var wishPagerEl = document.getElementById("wishPager");
      if (wishPagerEl) wishPagerEl.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest(".wish-pager__btn") : null;
        if (!b || b.disabled) return;
        curPage += (b.getAttribute("data-dir") === "next" ? 1 : -1);
        renderCards();
        var wall = document.getElementById("wishWall");
        if (wall) { try { wall.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {} }
      });
      // 飛心 + 數字彈跳動效（卡片牆與放大牆共用）
      var reduceM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function bumpNum(el) { if (reduceM || !el) return; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
      function flyHearts(btn) {
        if (reduceM) return;
        var layer = document.getElementById("fxLayer"); if (!layer) return;
        var rect = btn.getBoundingClientRect(), cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        for (var i = 0; i < 8; i++) {
          var h = document.createElement("span"); h.className = "flyheart"; h.textContent = "❤️";
          h.style.left = cx + "px"; h.style.top = cy + "px";
          h.style.setProperty("--dx", ((Math.random() * 2 - 1) * 120) + "px");
          h.style.setProperty("--dy", (-(80 + Math.random() * 130)) + "px");
          h.style.setProperty("--rot", ((Math.random() * 120 - 60)) + "deg");
          h.style.animationDelay = (Math.random() * 0.14).toFixed(2) + "s";
          layer.appendChild(h);
          (function (el) { setTimeout(function () { el.remove(); }, 1500); })(h);
        }
      }
      // 愛心點擊（document 委派，涵蓋卡片牆 + 放大牆）：樂觀 +1 + 飛心 + 數字彈跳
      document.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest(".wish-like") : null;
        if (!btn || btn.disabled) return;
        var r = parseInt(btn.getAttribute("data-row"), 10);
        if (!r || hasLiked(r)) return;
        markLiked(r);
        btn.classList.add("is-liked"); btn.disabled = true;
        var nEl = btn.querySelector(".wish-like__n");
        var cur = (parseInt(nEl.textContent, 10) || 0) + 1;
        nEl.textContent = cur; bumpNum(nEl); flyHearts(btn);
        for (var i = 0; i < allWishes.length; i++) if (allWishes[i].r === r) { allWishes[i].l = cur; break; }
        fetch(RSVP_ENDPOINT + "?action=like&row=" + r + "&t=" + Date.now())
          .then(function (res) { return res.json(); })
          .then(function (d) {
            if (d && d.ok && typeof d.likes === "number") {
              nEl.textContent = d.likes;
              for (var j = 0; j < allWishes.length; j++) if (allWishes[j].r === r) { allWishes[j].l = d.likes; break; }
            }
          })
          .catch(function () { /* 樂觀更新已生效，靜默 */ });
      });

      // ===== 完整祝福牆放大版（全螢幕沉浸瀏覽）=====
      var wallBox = document.getElementById("wallBox");
      var wallOpenBtn = document.getElementById("wallOpen");
      var wallCloseBtn = document.getElementById("wallClose");
      var wallGrid = document.getElementById("wallGrid");
      var wallCountEl = document.getElementById("wallCount");
      var wallFiltersEl = document.getElementById("wallFilters");
      var wallScroll = document.getElementById("wallScroll");
      var wallFilter = "全部";
      function renderWall() {
        if (!wallGrid) return;
        var list = wallFilter === "全部" ? allWishes.slice() : allWishes.filter(function (w) { return w.c === wallFilter; });
        list.sort(function (a, b) { return (b.l || 0) - (a.l || 0); });
        wallGrid.innerHTML = list.map(cardHTML).join("");
        if (wallCountEl) wallCountEl.textContent = wallFilter === "全部" ? "（" + allWishes.length + " 則）" : "（" + wallFilter + " " + list.length + " 則）";
      }
      function buildWallFilters() {
        if (!wallFiltersEl) return;
        var classes = [];
        allWishes.forEach(function (w) { var c = String(w.c || "").trim(); if (c && classes.indexOf(c) === -1) classes.push(c); });
        if (classes.length <= 1) { wallFiltersEl.hidden = true; wallFiltersEl.innerHTML = ""; return; }
        classes.sort();
        wallFiltersEl.innerHTML = ["全部"].concat(classes).map(function (c) {
          return '<button type="button" class="wall-chip' + (c === wallFilter ? " is-active" : "") + '" data-class="' + esc(c) + '">' + esc(c) + "</button>";
        }).join("");
        wallFiltersEl.hidden = false;
      }
      function openWall() {
        if (!wallBox) return;
        buildWallFilters(); renderWall();
        wallBox.hidden = false; wallBox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        if (wallScroll) wallScroll.scrollTop = 0;
      }
      function closeWall() {
        if (!wallBox) return;
        wallBox.hidden = true; wallBox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        renderCards(); // 同步放大牆按過的愛心回卡片牆
      }
      if (wallOpenBtn) wallOpenBtn.addEventListener("click", openWall);
      if (wallCloseBtn) wallCloseBtn.addEventListener("click", closeWall);
      if (wallBox) wallBox.addEventListener("click", function (e) { if (e.target === wallBox) closeWall(); });
      if (wallFiltersEl) wallFiltersEl.addEventListener("click", function (e) {
        var b = e.target;
        if (!b.classList || !b.classList.contains("wall-chip")) return;
        wallFilter = b.getAttribute("data-class") || "全部";
        var bs = wallFiltersEl.querySelectorAll(".wall-chip");
        for (var i = 0; i < bs.length; i++) bs[i].classList.toggle("is-active", bs[i] === b);
        renderWall();
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && wallBox && !wallBox.hidden) closeWall(); });
      // 新祝福即時通知 toast
      var newWishToast = document.getElementById("newWishToast");
      var newWishTimer = null;
      function showNewWishToast(n) {
        if (!newWishToast) return;
        var nEl = newWishToast.querySelector(".newwish-toast__n");
        if (nEl) nEl.textContent = n;
        newWishToast.hidden = false;
        requestAnimationFrame(function () { newWishToast.classList.add("show"); });
        clearTimeout(newWishTimer);
        newWishTimer = setTimeout(hideNewWishToast, 12000);
      }
      function hideNewWishToast() {
        if (!newWishToast) return;
        newWishToast.classList.remove("show");
        clearTimeout(newWishTimer);
        newWishTimer = setTimeout(function () { newWishToast.hidden = true; }, 400);
      }
      if (newWishToast) newWishToast.addEventListener("click", function () {
        hideNewWishToast();
        var t = document.getElementById("rsvp");
        if (t) { try { t.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {} }
      });
      function load() {
        fetch(RSVP_ENDPOINT + "?action=wishes&t=" + Date.now())
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var ws = (d && d.wishes) || [];
            if (!ws.length) { wall.hidden = true; if (ticker) ticker.hidden = true; return; }
            // 準即時通知：最新列號變大 = LINE 審核通過的新祝福進來 → 跳 toast（首次載入只設基準、不提示）
            var maxR = ws.reduce(function (m, w) { return Math.max(m, w.r || 0); }, 0);
            if (lastSeenMaxR !== null && maxR > lastSeenMaxR) {
              showNewWishToast(ws.filter(function (w) { return (w.r || 0) > lastSeenMaxR; }).length);
            }
            lastSeenMaxR = maxR;
            allWishes = ws;
            if (curFilter !== "全部" && !ws.some(function (w) { return w.c === curFilter; })) curFilter = "全部";
            buildFilters();
            renderCards();
            wall.hidden = false;
            if (wallOpenBtn) wallOpenBtn.hidden = false; // 有祝福才顯示「放大看完整祝福牆」
            if (wallBox && !wallBox.hidden) { buildWallFilters(); renderWall(); } // 放大牆開著時同步更新
            // 置頂跑馬燈：維持「全部」祝福（不受班級篩選影響）；祝福少時補滿、無縫循環、速度放慢
            if (ticker && tickerTrack) {
              var fresh = ws.slice().sort(function (a, b) { return (b.r || 0) - (a.r || 0); }); // 越新（列號越大）的祝福排越前面，剛留言的人很快看到自己
              var base = fresh.slice();
              while (base.length < 8) base = base.concat(fresh);
              var items = base.map(function (w) {
                return '<span class="tw">💛 <b>' + esc(w.c) + " " + esc(maskName(w.n, w.c)) + "</b> " + esc(clip(w.m, 38)) + "</span>";
              }).join("");
              tickerTrack.innerHTML = items + items;
              tickerTrack.style.animationDuration = Math.max(60, base.length * 9) + "s";
              ticker.hidden = false;
            }
          })
          .catch(function () { /* 抓不到就不顯示，靜默 */ });
      }
      load();
      setInterval(load, 25 * 1000);   // 25 秒背景輪詢，準即時偵測審核通過的新祝福
      window.addEventListener("focus", load);
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") load(); }); // 切回分頁立即檢查
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

    // 給師長祝福：選「感謝師長」→ 姓名欄改「老師姓名」並提示完整顯示（不去識別化）
    (function () {
      var clsSel = document.getElementById("rsvpClass");
      var nameLabel = document.getElementById("rsvpNameLabel");
      var nameInput = document.getElementById("rsvpName");
      if (!clsSel || !nameLabel || !nameInput) return;
      clsSel.addEventListener("change", function () {
        var teacher = /師長|老師/.test(clsSel.value);
        nameLabel.innerHTML = (teacher ? "老師姓名" : "畢業生姓名") + ' <span class="rsvp-req">*</span>';
        nameInput.placeholder = teacher ? "請填寫老師姓名（完整顯示，不遮字）" : "請填寫畢業生姓名";
      });
    })();

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

  /* ---------- 校歌重編版 BGM（主頁背景音樂・預設自動開啟 + 跨分頁互斥，避免與 stage 畢業歌雙軌） ----------
     預設 intentOn=true（開啟）：載入即嘗試自動播放；瀏覽器 autoplay 政策會擋帶聲音的自動播放，
     故在使用者第一個互動（點 / 滑 / 按鍵）瞬間補播；按一下按鈕即靜音。
     BroadcastChannel("smes-grad-bgm")：哪一頁開始播就廣播 "playing"，另一分頁收到即靜音
     （僅同瀏覽器跨分頁、不跨裝置，投影機端只開 stage 不受影響）。 */
  (function () {
    var audio = document.getElementById("schoolBgm");
    var btn = document.getElementById("bgmToggle");
    if (!audio || !btn) return;
    var ico = btn.querySelector(".bgm-toggle__ico");
    var fadeId = null, intentOn = true;          // 預設開啟播放
    var channel = ("BroadcastChannel" in window) ? new BroadcastChannel("smes-grad-bgm") : null;
    var VOL = 0.5;

    function fadeTo(target, ms, after) {
      if (fadeId) clearInterval(fadeId);
      var steps = Math.max(1, Math.round(ms / 50)), i = 0, from = audio.volume;
      fadeId = setInterval(function () {
        i++;
        audio.volume = Math.min(1, Math.max(0, from + (target - from) * i / steps));
        if (i >= steps) { clearInterval(fadeId); fadeId = null; if (after) after(); }
      }, 50);
    }
    function setBtn() {
      btn.classList.toggle("is-playing", intentOn);
      btn.setAttribute("aria-pressed", intentOn ? "true" : "false");
      if (ico) ico.textContent = intentOn ? "🔊" : "🔇";
    }
    function play(broadcast) {
      intentOn = true; setBtn();
      audio.volume = 0;
      audio.play().then(function () {
        fadeTo(VOL, 1600);
        if (broadcast && channel) channel.postMessage("playing");   // 真的播了才通知 stage 暫停
      }).catch(function () { /* autoplay 被擋，等首個互動補播 */ });
    }
    function mute() {
      intentOn = false; setBtn();
      if (!audio.paused) fadeTo(0, 500, function () { audio.pause(); });
    }
    btn.addEventListener("click", function () { if (intentOn) mute(); else play(true); });

    // 其他分頁（stage 按下開啟畢業歌）開始播 → 主頁校歌自動靜音，避免兩種音軌同時播
    if (channel) channel.onmessage = function (e) { if (e.data === "playing") mute(); };

    // 首個互動補播（autoplay 政策需使用者手勢；按到音樂鈕本身則交給 click 處理）
    function teardown() {
      ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { window.removeEventListener(ev, onGesture); });
    }
    function onGesture(e) {
      if (e && e.target && e.target.closest && e.target.closest("#bgmToggle")) { teardown(); return; }
      teardown();
      if (intentOn && audio.paused) play(true);
    }
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { window.addEventListener(ev, onGesture, { passive: true }); });

    // 預設開啟：顯示開啟狀態並先嘗試自動播放（被擋則等首個互動補播）
    setBtn();
    play(true);
  })();
})();
