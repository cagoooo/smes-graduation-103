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

    // 桌機：連結太多放不下時，滑鼠滾輪可左右捲動，兩側加漸層提示「還有更多」
    function updateNavFade() {
      var max = links.scrollWidth - links.clientWidth;
      if (max <= 2) { links.classList.remove("fade-left", "fade-right"); return; }
      links.classList.toggle("fade-left", links.scrollLeft > 4);
      links.classList.toggle("fade-right", links.scrollLeft < max - 4);
    }
    links.addEventListener("wheel", function (e) {
      if (links.scrollWidth <= links.clientWidth + 2) return;     // 放得下就不攔截
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;        // 觸控板本就橫向捲 → 放行
      e.preventDefault();
      links.scrollLeft += (e.deltaY || e.deltaX);
      updateNavFade();
    }, { passive: false });
    links.addEventListener("scroll", updateNavFade, { passive: true });
    window.addEventListener("resize", updateNavFade);
    updateNavFade();
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
    { embed: "songEmbed", play: "songEmbedPlay", vid: "ZCV1j_9mW8A", title: "畢業歌〈風箏〉MV" },
    { embed: "blessEmbed", play: "blessEmbedPlay", vid: "-vhVoyd8fUs", title: "2026畢業典禮祝福影片大集錦" }
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
      var allWishes = [], curFilter = "全部", curSearch = "", lastSeenMaxR = null;

      // 從 wish.html 連結進來會帶 #wishform，目的地是「也為畢業生留下祝福」輸入區。
      // 但祝福牆卡片是非同步載入的，瀏覽器的錨點跳轉發生在卡片長出來之前 → 表單被擠到下方，
      // 使用者落點變成牆中間還要往下滑。於是在牆首次渲染、版面穩定後，補捲一次到表單（一次性，不影響之後的輪詢）。
      var formScrollPending = (location.hash === "#wishform");
      function correctFormScroll() {
        if (!formScrollPending) return;
        formScrollPending = false; // 一次性：之後的 25 秒背景輪詢不再干擾使用者捲動
        var target = document.getElementById("wishform");
        if (!target) return;
        // 即時定位（非平滑）：表單在長頁最底，平滑捲 ~14000px 既慢、又會被卡片/圖片載入位移打斷而失敗；
        // 從 wish.html 連結落地本來就該「直接到表單」。多排幾次涵蓋卡片 / 圖片 / 字型陸續載入造成的高度位移。
        function go() {
          try { target.scrollIntoView({ behavior: "instant", block: "start" }); }
          catch (_) { try { target.scrollIntoView(); } catch (e) {} }
        }
        go();
        requestAnimationFrame(go);
        setTimeout(go, 300);
        setTimeout(go, 800);
      }
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
      // 祝福搜尋比對：班級／畢業生全名／祝福內容（含即可，大小寫不敏感）。比對全名但顯示仍遮罩，家長用孩子全名找得到。
      function matchSearch(w, q) {
        q = String(q || "").trim().toLowerCase();
        if (!q) return true;
        return String(w.c || "").toLowerCase().indexOf(q) !== -1
          || String(w.n || "").toLowerCase().indexOf(q) !== -1
          || String(w.m || "").toLowerCase().indexOf(q) !== -1;
      }
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
      var cardsTimers = [];
      function clearCardsTimers() { cardsTimers.forEach(clearTimeout); cardsTimers = []; }
      function clearCardsAnim() { cards.classList.remove("is-leaving", "is-entering", "lv-next", "lv-prev", "en-next", "en-prev"); }
      // anim: "next" / "prev"（換頁，方向感知滑動）/ "fade"（切班級，淡入）/ 不傳 = 瞬間（初始載入、背景輪詢、放大牆同步）
      function renderCards(anim) {
        var reduceMo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var list = curFilter === "全部" ? allWishes.slice() : allWishes.filter(function (w) { return w.c === curFilter; });
        if (curSearch) list = list.filter(function (w) { return matchSearch(w, curSearch); }); // 搜尋：班級／姓名／關鍵字
        list.sort(function (a, b) { return (b.l || 0) - (a.l || 0); }); // 愛心多的排前面（熱門優先）
        var totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
        if (curPage >= totalPages) curPage = totalPages - 1;
        if (curPage < 0) curPage = 0;
        var html = list.length
          ? list.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE).map(cardHTML).join("")
          : '<p class="wishwall__empty">😢 找不到符合「' + esc(curSearch) + '」的祝福<br>換個關鍵字，或用孩子的<b>全名</b>再試試看</p>';
        var countText = curSearch
          ? "🔍 找到 " + list.length + " 則符合「" + curSearch + "」的祝福"
          : (curFilter === "全部"
            ? "目前已有 " + allWishes.length + " 則祝福 💛"
            : curFilter + "：" + list.length + " 則（全校 " + allWishes.length + " 則）💛");
        function commit() {
          cards.innerHTML = html;
          if (count) count.textContent = countText;
          renderPager(totalPages);
        }
        // 沒指定轉場、或關閉動效、或目前無卡片可淡出 → 直接換
        if (!anim || reduceMo || !cards.children.length) { clearCardsTimers(); clearCardsAnim(); commit(); return; }
        clearCardsTimers();
        // (1) 舊頁淡出滑走
        cards.classList.remove("is-entering", "en-next", "en-prev");
        cards.classList.add("is-leaving");
        if (anim === "next") cards.classList.add("lv-next");
        else if (anim === "prev") cards.classList.add("lv-prev");
        // (2) 換內容 → 新卡片交錯滑入
        cardsTimers.push(setTimeout(function () {
          cards.classList.remove("is-leaving", "lv-next", "lv-prev");
          commit();
          void cards.offsetWidth; // 強制 reflow，動畫從頭播
          cards.classList.add("is-entering");
          if (anim === "next") cards.classList.add("en-next");
          else if (anim === "prev") cards.classList.add("en-prev");
          // (3) 進場結束清掉狀態 class，避免影響 hover / 後續渲染
          cardsTimers.push(setTimeout(clearCardsAnim, 900));
        }, 210));
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
          renderCards("fade");
        });
      }
      // 祝福搜尋（班級／姓名／關鍵字）：即時過濾卡片牆，與班級篩選可疊加
      var searchInput = document.getElementById("wishSearchInput");
      var searchClear = document.getElementById("wishSearchClear");
      function applySearch(q) {
        curSearch = String(q || "").trim();
        if (searchClear) searchClear.hidden = !curSearch;
        curPage = 0;
        renderCards("fade");
      }
      if (searchInput) searchInput.addEventListener("input", function () { applySearch(searchInput.value); });
      if (searchClear) searchClear.addEventListener("click", function () {
        if (searchInput) { searchInput.value = ""; searchInput.focus(); }
        applySearch("");
      });
      // 主頁祝福牆翻頁（左右切換，避免一次顯示全部越拉越長）
      var wishPagerEl = document.getElementById("wishPager");
      if (wishPagerEl) wishPagerEl.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest(".wish-pager__btn") : null;
        if (!b || b.disabled) return;
        var dir = b.getAttribute("data-dir") === "next" ? "next" : "prev";
        curPage += (dir === "next" ? 1 : -1);
        renderCards(dir);
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
      var wallFilter = "全部", wallAnimTimer = null;

      // 放大牆「自動緩捲」：開牆後緩緩往下走，讓人不用滑也能看完所有祝福；
      // 使用者一捲動/觸碰/按方向鍵就暫停，閒置幾秒後自動恢復；捲到底停一下再平滑回頂循環；尊重 prefers-reduced-motion。
      var WALL_PXPS = 30, WALL_START_DELAY_MS = 1200, WALL_END_PAUSE_MS = 2600, WALL_IDLE_MS = 4000;
      var wallAuto = { on: false, raf: null, timer: null, lastTs: null, carry: 0 };
      function wallReduce() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
      function wallClearTimers() {
        if (wallAuto.raf) { cancelAnimationFrame(wallAuto.raf); wallAuto.raf = null; }
        if (wallAuto.timer) { clearTimeout(wallAuto.timer); wallAuto.timer = null; }
      }
      function wallKick(delay) { // delay 毫秒後（重新）開始往下緩捲
        wallClearTimers(); wallAuto.lastTs = null; wallAuto.carry = 0;
        wallAuto.timer = setTimeout(function () { wallAuto.raf = requestAnimationFrame(wallStep); }, delay);
      }
      function wallStep(ts) {
        if (!wallAuto.on || !wallScroll) { wallAuto.raf = null; return; }
        if (wallAuto.lastTs == null) wallAuto.lastTs = ts;
        var dt = ts - wallAuto.lastTs; wallAuto.lastTs = ts;
        var max = wallScroll.scrollHeight - wallScroll.clientHeight;
        if (max <= 1) { wallAuto.carry = 0; wallAuto.raf = requestAnimationFrame(wallStep); return; } // 內容還沒溢出 → 等
        wallAuto.carry += WALL_PXPS * dt / 1000; // 用時間差累積，確保不同更新率下速度一致
        var px = Math.floor(wallAuto.carry);
        if (px > 0) {
          wallAuto.carry -= px;
          if (wallScroll.scrollTop >= max - 1) { // 到底 → 停一下 → 平滑回頂 → 續捲
            wallClearTimers();
            wallAuto.timer = setTimeout(function () {
              if (!wallAuto.on) return;
              try { wallScroll.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) { wallScroll.scrollTop = 0; }
              wallKick(1000);
            }, WALL_END_PAUSE_MS);
            return;
          }
          wallScroll.scrollTop += px; // 直接設 scrollTop＝即時（不受 CSS scroll-behavior 影響），小步累積成緩捲
        }
        wallAuto.raf = requestAnimationFrame(wallStep);
      }
      function wallAutoStart() { if (!wallScroll || wallReduce()) return; wallAuto.on = true; wallKick(WALL_START_DELAY_MS); }
      function wallAutoStop() { wallAuto.on = false; wallClearTimers(); }
      function wallAutoBump() { if (wallAuto.on) wallKick(WALL_IDLE_MS); } // 使用者操作 → 暫停，閒置後恢復

      // animate=true（切班級）→ 卡片交錯淡入進場；不傳 = 瞬間（開牆、背景輪詢同步）
      function renderWall(animate) {
        if (!wallGrid) return;
        var list = wallFilter === "全部" ? allWishes.slice() : allWishes.filter(function (w) { return w.c === wallFilter; });
        list.sort(function (a, b) { return (b.l || 0) - (a.l || 0); });
        wallGrid.innerHTML = list.map(cardHTML).join("");
        if (wallCountEl) wallCountEl.textContent = wallFilter === "全部" ? "（" + allWishes.length + " 則）" : "（" + wallFilter + " " + list.length + " 則）";
        var reduceMo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        clearTimeout(wallAnimTimer);
        wallGrid.classList.remove("is-entering");
        if (animate && !reduceMo) {
          void wallGrid.offsetWidth; // 強制 reflow，動畫從頭播
          wallGrid.classList.add("is-entering");
          wallAnimTimer = setTimeout(function () { wallGrid.classList.remove("is-entering"); }, 1000);
        }
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
        wallAutoStart(); // 開牆後自動緩緩往下捲
      }
      function closeWall() {
        if (!wallBox) return;
        wallAutoStop();
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
        renderWall(true);
        // 切標籤後絲滑捲回最上面，從第一張卡片開始閱讀（關動效時直接歸零）
        if (wallScroll) {
          var reduceMo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (reduceMo) { wallScroll.scrollTop = 0; }
          else { try { wallScroll.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) { wallScroll.scrollTop = 0; } }
        }
        wallAutoBump(); // 切班級後暫停自動捲，閒置後再從頂端續捲
      });
      // 使用者一捲動 / 觸碰 / 拖曳 → 暫停自動緩捲（不監聽 scroll 事件，否則自動捲自己會觸發成無限暫停）
      if (wallScroll) ["wheel", "touchstart", "pointerdown", "mousedown"].forEach(function (ev) {
        wallScroll.addEventListener(ev, wallAutoBump, { passive: true });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && wallBox && !wallBox.hidden) { closeWall(); return; }
        if (wallBox && !wallBox.hidden &&
          ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"].indexOf(e.key) !== -1) wallAutoBump();
      });
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

      // ===== 祝福成果專區（#wishes）：數據儀表板 + 各班熱度 + 精選輪播 =====
      // 各班專屬色（對應 Hero 紙花彩虹色），師長金、其他石板灰
      var CLASS_COLOR = {
        "六年1班": "#ff5e6c", "六年2班": "#ff9f43", "六年3班": "#ffc94d",
        "六年4班": "#2ecc71", "六年5班": "#45aaf2", "六年6班": "#9d7bff",
        "師長": "#f5b942", "其他": "#9aa7c2"
      };
      function classColor(c) { return CLASS_COLOR[c] || "#9aa7c2"; }
      var sc = {
        section: document.getElementById("wishes"),
        statGrid: document.getElementById("wstatGrid"),
        heatList: document.getElementById("wheatList"),
        featStage: document.getElementById("wfeatStage"),
        featNav: document.getElementById("wfeatNav"),
        featDots: document.getElementById("wfeatDots"),
        featPrev: document.getElementById("wfeatPrev"),
        featNext: document.getElementById("wfeatNext"),
        openWall: document.getElementById("showcaseOpenWall"),
        allN: document.getElementById("showcaseAllN"),
        live: document.getElementById("wlive")
      };
      var scReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var scState = { visible: false, dataReady: false, animated: false, stats: null, heatSig: "", featSig: "", lastTotal: null, lastHearts: null };

      // 數字滾動到目標值（easeOutCubic + 千分位）
      function countUp(el, target) {
        if (!el) return;
        target = Math.max(0, target || 0);
        if (scReduce) { el.textContent = target.toLocaleString(); return; }
        var dur = 1300, t0 = null;
        function step(ts) {
          if (t0 == null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString();
        }
        requestAnimationFrame(step);
      }

      function computeStats(ws) {
        var groups = {}, hearts = 0, maxlen = 0;
        ws.forEach(function (w) {
          var c = String(w.c || "").trim() || "其他";
          groups[c] = (groups[c] || 0) + 1;
          hearts += Math.max(0, parseInt(w.l, 10) || 0);
          maxlen = Math.max(maxlen, String(w.m || "").length);
        });
        return { total: ws.length, hearts: hearts, groups: Object.keys(groups).length, maxlen: maxlen, byGroup: groups };
      }

      function animateShowcaseIn() {
        if (scState.animated || !scState.stats) return;
        scState.animated = true;
        var s = scState.stats;
        if (sc.statGrid) {
          var nums = sc.statGrid.querySelectorAll(".wstat__num");
          for (var i = 0; i < nums.length; i++) countUp(nums[i], s[nums[i].getAttribute("data-stat")] || 0);
        }
        if (sc.heatList) {
          var fills = sc.heatList.querySelectorAll(".wheat__fill");
          for (var j = 0; j < fills.length; j++) (function (el) {
            var w = el.getAttribute("data-w") || "0";
            if (scReduce) el.style.width = w + "%";
            else requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.width = w + "%"; }); });
          })(fills[j]);
        }
      }
      function maybeAnimateShowcase() { if (scState.visible && scState.dataReady) animateShowcaseIn(); }

      function renderHeat(s) {
        if (!sc.heatList) return;
        var entries = Object.keys(s.byGroup).map(function (k) { return [k, s.byGroup[k]]; });
        entries.sort(function (a, b) { return b[1] - a[1]; });
        var sig = entries.map(function (e) { return e[0] + ":" + e[1]; }).join("|");
        if (sig === scState.heatSig) return; // 沒變不重繪，避免每次輪詢重置動畫
        scState.heatSig = sig;
        var max = entries.length ? entries[0][1] : 1;
        sc.heatList.innerHTML = entries.map(function (e) {
          var name = e[0], n = e[1], pct = Math.max(3, Math.round(n / max * 100));
          var wNow = scState.animated ? "width:" + pct + "%;" : "";
          return '<li class="wheat__row">' +
            '<span class="wheat__name">' + esc(name) + '</span>' +
            '<span class="wheat__track"><span class="wheat__fill" data-w="' + pct + '" style="background:' + classColor(name) + ';' + wNow + '"></span></span>' +
            '<span class="wheat__n">' + n + '<small> 則</small></span></li>';
        }).join("");
      }

      // 精選輪播
      var featCards = [], featIdx = 0, featTimer = null;
      function showFeat(i) {
        if (!featCards.length || !sc.featStage) return;
        featIdx = (i + featCards.length) % featCards.length;
        var cards = sc.featStage.querySelectorAll(".wfeat__card");
        var dots = sc.featDots ? sc.featDots.querySelectorAll(".wfeat__dot") : [];
        for (var k = 0; k < cards.length; k++) cards[k].classList.toggle("is-active", k === featIdx);
        for (var d = 0; d < dots.length; d++) dots[d].classList.toggle("is-active", d === featIdx);
      }
      function stopFeatAuto() { if (featTimer) { clearInterval(featTimer); featTimer = null; } }
      function startFeatAuto() { stopFeatAuto(); if (scReduce || featCards.length <= 1) return; featTimer = setInterval(function () { showFeat(featIdx + 1); }, 5500); }
      function renderFeat(ws) {
        if (!sc.featStage) return;
        var top = ws.slice().filter(function (w) { return String(w.m || "").trim(); })
          .sort(function (a, b) { return (b.l || 0) - (a.l || 0); });
        var seen = {}, picked = [];
        for (var i = 0; i < top.length && picked.length < 6; i++) {
          var key = String(top[i].m).slice(0, 40);
          if (seen[key]) continue; seen[key] = 1; picked.push(top[i]);
        }
        var sig = picked.map(function (w) { return (w.r || "") + "/" + (w.l || 0); }).join("|");
        if (sig === scState.featSig) return; // 名單沒變不重建，不打斷輪播
        scState.featSig = sig;
        if (!picked.length) { sc.featStage.innerHTML = '<p class="wfeat__loading">祝福即將精選呈現…</p>'; return; }
        featCards = picked;
        sc.featStage.innerHTML = picked.map(function (w, k) {
          var len = String(w.m || "").length;
          var lenCls = len > 150 ? " len-xl" : len > 70 ? " len-l" : "";
          return '<figure class="wfeat__card' + (k === 0 ? " is-active" : "") + lenCls + '">' +
            '<blockquote class="wfeat__quote">' + esc(w.m) + '</blockquote>' +
            '<figcaption class="wfeat__meta">' +
            '<span class="wfeat__to">💛 給 ' + esc(w.c) + " " + esc(maskName(w.n, w.c)) + '</span>' +
            ((w.l || 0) > 0 ? '<span class="wfeat__likes">❤️ ' + w.l + '</span>' : '') +
            '</figcaption></figure>';
        }).join("");
        if (sc.featDots) sc.featDots.innerHTML = picked.map(function (w, k) {
          return '<button type="button" class="wfeat__dot' + (k === 0 ? " is-active" : "") + '" data-i="' + k + '" aria-label="第 ' + (k + 1) + ' 則精選祝福"></button>';
        }).join("");
        if (sc.featNav) sc.featNav.hidden = picked.length <= 1;
        featIdx = 0;
        startFeatAuto();
      }

      function renderShowcase(ws) {
        if (!sc.section) return;
        var s = computeStats(ws);
        scState.stats = s;
        // 偵測到數字變動（新祝福／新愛心）→ 即時標示亮一下（首次載入不亮）
        if (sc.live && scState.lastTotal !== null && (s.total !== scState.lastTotal || s.hearts !== scState.lastHearts)) {
          sc.live.classList.remove("is-bump"); void sc.live.offsetWidth; sc.live.classList.add("is-bump");
        }
        scState.lastTotal = s.total; scState.lastHearts = s.hearts;
        if (sc.allN) sc.allN.textContent = s.total;
        if (sc.statGrid && scState.animated) { // 已滾動過 → 後續輪詢直接更新數字（不重新滾動）
          var nums = sc.statGrid.querySelectorAll(".wstat__num");
          for (var i = 0; i < nums.length; i++) nums[i].textContent = (s[nums[i].getAttribute("data-stat")] || 0).toLocaleString();
        }
        renderHeat(s);
        renderFeat(ws);
        scState.dataReady = true;
        maybeAnimateShowcase();
      }

      // 輪播控制：箭頭 / 圓點 / hover 暫停
      if (sc.featPrev) sc.featPrev.addEventListener("click", function () { showFeat(featIdx - 1); startFeatAuto(); });
      if (sc.featNext) sc.featNext.addEventListener("click", function () { showFeat(featIdx + 1); startFeatAuto(); });
      if (sc.featDots) sc.featDots.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest(".wfeat__dot") : null;
        if (!b) return; showFeat(parseInt(b.getAttribute("data-i"), 10) || 0); startFeatAuto();
      });
      if (sc.featStage) {
        sc.featStage.addEventListener("mouseenter", stopFeatAuto);
        sc.featStage.addEventListener("mouseleave", startFeatAuto);
      }
      // 「看全部 N 則祝福」→ 開啟沉浸式放大牆 overlay
      if (sc.openWall) sc.openWall.addEventListener("click", openWall);
      // 成果專區「想找自己孩子的祝福？」→ 捲到祝福牆搜尋框並聚焦
      var showcaseFind = document.getElementById("showcaseFind");
      if (showcaseFind) showcaseFind.addEventListener("click", function () {
        var box = document.querySelector(".wishsearch");
        if (box) { try { box.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {} }
        if (searchInput) setTimeout(function () { try { searchInput.focus({ preventScroll: true }); } catch (_) { searchInput.focus(); } }, 480);
      });
      // 捲到專區 → 觸發一次數字滾動 + 長條填充
      if (sc.section) {
        if (scReduce || !("IntersectionObserver" in window)) { scState.visible = true; maybeAnimateShowcase(); }
        else {
          var scIo = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) if (entries[i].isIntersecting) { scState.visible = true; maybeAnimateShowcase(); scIo.disconnect(); break; }
          }, { threshold: 0.2 });
          scIo.observe(sc.section);
        }
      }

      function load() {
        fetch(RSVP_ENDPOINT + "?action=wishes&t=" + Date.now())
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var ws = (d && d.wishes) || [];
            if (!ws.length) { wall.hidden = true; if (ticker) ticker.hidden = true; correctFormScroll(); return; }
            // 準即時通知：最新列號變大 = LINE 審核通過的新祝福進來 → 跳 toast（首次載入只設基準、不提示）
            var maxR = ws.reduce(function (m, w) { return Math.max(m, w.r || 0); }, 0);
            if (lastSeenMaxR !== null && maxR > lastSeenMaxR) {
              showNewWishToast(ws.filter(function (w) { return (w.r || 0) > lastSeenMaxR; }).length);
            }
            lastSeenMaxR = maxR;
            allWishes = ws;
            renderShowcase(ws); // 祝福成果專區：數據儀表板 + 各班熱度 + 精選輪播（依即時資料）
            if (curFilter !== "全部" && !ws.some(function (w) { return w.c === curFilter; })) curFilter = "全部";
            buildFilters();
            renderCards();
            wall.hidden = false;
            correctFormScroll(); // 牆已渲染、版面穩定 → 若是從 wish.html(#wishform) 進來，補捲到表單
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
          .catch(function () { correctFormScroll(); /* 抓不到就不顯示，靜默（仍補捲到表單） */ });
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
      document.body.classList.add("has-update-banner");
      // 依 banner 實際高度，把左下角「校歌重編版」鈕抬到 banner 上方避免重疊（手機限定，由 CSS media query 套用）
      requestAnimationFrame(function () {
        var h = banner.offsetHeight || 0;
        if (h) document.documentElement.style.setProperty("--bgm-lift", (h + 24) + "px");
      });
    }
    function hideUpdateBanner() {
      if (banner) banner.classList.remove("is-visible");
      document.body.classList.remove("has-update-banner");
    }
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

  /* ---------- 校歌重編版 BGM（主頁背景音樂・預設關閉，按鈕才播 + 跨分頁互斥，避免與 stage 畢業歌雙軌） ----------
     預設 intentOn=false（關閉）：進頁面不自動播放，按下「校歌重編版」按鈕才開始播（淡入）；再按一下淡出靜音。
     BroadcastChannel("smes-grad-bgm")：哪一頁開始播就廣播 "playing"，另一分頁收到即靜音
     （僅同瀏覽器跨分頁、不跨裝置，投影機端只開 stage 不受影響）。 */
  (function () {
    var audio = document.getElementById("schoolBgm");
    var btn = document.getElementById("bgmToggle");
    if (!audio || !btn) return;
    var ico = btn.querySelector(".bgm-toggle__ico");
    var fadeId = null, intentOn = false;         // 預設關閉：進頁面不自動播放，按下按鈕才播
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

    // 預設關閉：只顯示關閉狀態，不自動播放、不在首次互動補播；使用者按下按鈕才播放
    setBtn();
  })();
})();
