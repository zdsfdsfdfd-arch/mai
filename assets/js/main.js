/* ==========================================================================
   ФБСР — общие скрипты: навигация, hero-параллакс, появление блоков,
   счётчики, фильтры списков, табы, поиск (⌘K), демо-формы.
   Без зависимостей.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Навигация ---------- */
  function initNav() {
    var burger = $(".burger"), nav = $("#nav");
    if (burger && nav) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("is-locked", open);
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth > 1000 && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
          document.body.classList.remove("is-locked");
        }
      });
    }
    // подсветка активного пункта
    var path = location.pathname.split("/").pop() || "index.html";
    $$(".nav__link").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path) { a.classList.add("is-active"); a.setAttribute("aria-current", "page"); }
    });
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Hero: сцена в движении ---------- */
  function initHero() {
    var hero = $(".hero");
    if (!hero || reduceMotion) return;
    var layers = $$("[data-parallax]", hero);
    if (!layers.length) return;
    var mx = 0, my = 0, ticking = false;

    function render() {
      ticking = false;
      var rect = hero.getBoundingClientRect();
      var progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
      layers.forEach(function (el) {
        var sy = parseFloat(el.getAttribute("data-parallax")) || 0;      // смещение по скроллу
        var mm = parseFloat(el.getAttribute("data-mouse")) || 0;         // реакция на мышь
        var x = mx * mm, y = progress * sy + my * mm * 0.6;
        var s = el.hasAttribute("data-scale") ? 1 + progress * parseFloat(el.getAttribute("data-scale")) : 1;
        el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) scale(" + s.toFixed(3) + ")";
      });
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    if (window.matchMedia("(hover: hover)").matches) {
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
        request();
      });
      hero.addEventListener("mouseleave", function () { mx = 0; my = 0; request(); });
    }
    render();
  }

  /* ---------- Бегущая строка: дублируем содержимое ---------- */
  function initTicker() {
    $$(".ticker__track").forEach(function (track) {
      track.innerHTML += track.innerHTML;
    });
  }

  /* ---------- Появление блоков ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 80) + "ms";
      io.observe(el);
    });
  }

  /* ---------- Счётчики ---------- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;
    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) { el.textContent = target.toLocaleString("ru-RU") + suffix; return; }
      var start = null, dur = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("ru-RU") + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Фильтры списков ----------
     <div data-filters-for="list"> содержит .chip[data-key][data-value], select[data-key], input[data-key="q"]
     <div id="list" data-filterable> содержит [data-item] с data-<key>="..." и data-q="текст для поиска"
  ------------------------------------------ */
  function initFilters() {
    $$("[data-filters-for]").forEach(function (panel) {
      var list = document.getElementById(panel.getAttribute("data-filters-for"));
      if (!list) return;
      var items = $$("[data-item]", list);
      var empty = $(".empty", list.parentNode) || null;
      var state = {};
      var counter = panel.querySelector("[data-filter-count]") || (panel.closest("section") || document).querySelector("[data-filter-count]");

      function applyFilters() {
        var shown = 0;
        items.forEach(function (it) {
          var ok = Object.keys(state).every(function (key) {
            var val = state[key];
            if (!val || val === "*") return true;
            if (key === "q") {
              var hay = (it.getAttribute("data-q") || it.textContent).toLowerCase();
              return hay.indexOf(val.toLowerCase().trim()) !== -1;
            }
            var attr = (it.getAttribute("data-" + key) || "").split(/\s+/);
            return attr.indexOf(val) !== -1;
          });
          it.classList.toggle("is-hidden", !ok);
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
        if (counter) counter.textContent = shown;
      }

      $$(".chip[data-key]", panel).forEach(function (chip) {
        chip.addEventListener("click", function () {
          var key = chip.getAttribute("data-key");
          $$('.chip[data-key="' + key + '"]', panel).forEach(function (c) { c.classList.remove("is-active"); });
          chip.classList.add("is-active");
          state[key] = chip.getAttribute("data-value");
          applyFilters();
        });
      });
      $$("select[data-key]", panel).forEach(function (sel) {
        sel.addEventListener("change", function () { state[sel.getAttribute("data-key")] = sel.value; applyFilters(); });
      });
      $$("input[data-key]", panel).forEach(function (inp) {
        inp.addEventListener("input", function () { state[inp.getAttribute("data-key")] = inp.value; applyFilters(); });
      });
      applyFilters();
    });
  }

  /* ---------- Табы ---------- */
  function initTabs() {
    $$("[role=tablist]").forEach(function (list) {
      var tabs = $$("[role=tab]", list);
      function activate(tab) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", on ? "true" : "false");
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { activate(t); });
        t.addEventListener("keydown", function (e) {
          var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          var next = tabs[(i + dir + tabs.length) % tabs.length];
          next.focus(); activate(next);
        });
      });
      var initial = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
      if (initial) activate(initial);
    });
  }

  /* ---------- Поиск ⌘K ---------- */
  function initSearch() {
    var modal = $("#search-modal");
    if (!modal) return;
    var input = $(".search__input", modal), results = $(".search__results", modal);
    var index = window.FBSR_SEARCH_INDEX || [];
    var active = -1, lastFocus = null;

    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function mark(text, q) {
      if (!q) return esc(text);
      var i = text.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) return esc(text);
      return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
    }
    function render(q) {
      q = (q || "").trim();
      var hits = index.filter(function (it) {
        if (!q) return !!it.top;
        var hay = (it.title + " " + (it.text || "") + " " + (it.tags || "")).toLowerCase();
        return hay.indexOf(q.toLowerCase()) !== -1;
      }).slice(0, 12);
      active = -1;
      if (!hits.length) {
        results.innerHTML = '<div class="search__empty">Ничего не найдено по запросу «' + esc(q) + '»</div>';
        return;
      }
      results.innerHTML = '<div class="search__group mono dim">' + (q ? "Результаты" : "Разделы") + "</div>" +
        hits.map(function (it) {
          return '<a class="search__item" href="' + esc(it.url) + '"><b>' + mark(it.title, q) + "</b><span>" + esc(it.section || "") + (it.text ? " · " + mark(it.text, q) : "") + "</span></a>";
        }).join("");
    }
    function open() {
      lastFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.removeAttribute("hidden");
      document.body.classList.add("is-locked");
      input.value = ""; render("");
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("hidden", "");
      document.body.classList.remove("is-locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $$("[data-search-open]").forEach(function (b) { b.addEventListener("click", open); });
    $$("[data-search-close]", modal).forEach(function (b) { b.addEventListener("click", close); });
    input.addEventListener("input", function () { render(input.value); });
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); modal.classList.contains("is-open") ? close() : open(); return; }
      if (!modal.classList.contains("is-open")) return;
      var items = $$(".search__item", results);
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach(function (it, i) { it.classList.toggle("is-active", i === active); });
        items[active].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && active >= 0 && items[active]) {
        items[active].click();
      }
    });
  }

  /* ---------- Демо-формы (без бэкенда) ---------- */
  function initForms() {
    $$("form[data-demo-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var ok = $(".form__ok", form.parentNode);
        form.hidden = true;
        if (ok) { ok.hidden = false; ok.focus && ok.focus(); }
      });
    });
  }

  function init() {
    initNav(); initHero(); initTicker(); initReveal(); initCounters(); initFilters(); initTabs(); initSearch(); initForms();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
