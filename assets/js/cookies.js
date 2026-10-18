/* ==========================================================================
   ФБСР — менеджер согласий на cookie.
   - Категории: «необходимые» (всегда), «аналитические» (Яндекс.Метрика).
   - Согласие хранится в first-party cookie `fbsr_consent` (365 дней) + localStorage.
   - Счётчик аналитики подключается ТОЛЬКО после согласия пользователя.
   - Публичный API: window.FBSRConsent.get() / .open() / .revoke()
   ========================================================================== */
(function () {
  "use strict";

  var NAME = "fbsr_consent";
  var VERSION = 1;          // при изменении текста политики — увеличить, баннер покажется заново
  var DAYS = 365;
  var cfg = window.FBSR_CONFIG || {};
  var analyticsLoaded = false;

  /* ---------- хранение ---------- */
  function readCookie() {
    var m = document.cookie.match(new RegExp("(?:^|; )" + NAME + "=([^;]*)"));
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
  }
  function writeCookie(obj) {
    var val = encodeURIComponent(JSON.stringify(obj));
    var secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = NAME + "=" + val + "; path=/; max-age=" + (DAYS * 86400) + "; SameSite=Lax" + secure;
    try { localStorage.setItem(NAME, JSON.stringify(obj)); } catch (e) { /* приватный режим */ }
  }
  function clearCookie() {
    document.cookie = NAME + "=; path=/; max-age=0; SameSite=Lax";
    try { localStorage.removeItem(NAME); } catch (e) { /* ignore */ }
  }
  function getConsent() {
    var c = readCookie();
    if (!c) {
      try { c = JSON.parse(localStorage.getItem(NAME) || "null"); } catch (e) { c = null; }
    }
    if (!c || c.v !== VERSION) return null;
    return c;
  }

  /* ---------- аналитика (Яндекс.Метрика) ---------- */
  function loadAnalytics() {
    if (analyticsLoaded || !cfg.metrikaId) return;
    analyticsLoaded = true;
    // Стандартный код счётчика Яндекс.Метрики, вызывается только после согласия.
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(cfg.metrikaId, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: !!cfg.metrikaWebvisor
    });
  }

  function apply(consent) {
    document.documentElement.setAttribute("data-consent-analytics", consent.analytics ? "1" : "0");
    if (consent.analytics) loadAnalytics();
    try {
      document.dispatchEvent(new CustomEvent("fbsr:consent", { detail: consent }));
    } catch (e) { /* старые браузеры */ }
  }

  /* ---------- баннер ---------- */
  var banner, analyticsToggle;

  function show(settingsMode) {
    if (!banner) return;
    var current = getConsent();
    if (analyticsToggle) analyticsToggle.checked = current ? !!current.analytics : false;
    banner.classList.toggle("is-settings", !!settingsMode);
    banner.classList.add("is-visible");
    banner.removeAttribute("hidden");
    requestAnimationFrame(function () { banner.classList.add("is-shown"); });
  }
  function hide() {
    if (!banner) return;
    banner.classList.remove("is-shown");
    setTimeout(function () {
      banner.classList.remove("is-visible", "is-settings");
      banner.setAttribute("hidden", "");
    }, 350);
  }
  function save(analytics) {
    var consent = { v: VERSION, ts: new Date().toISOString(), necessary: true, analytics: !!analytics };
    writeCookie(consent);
    apply(consent);
    hide();
  }

  function init() {
    banner = document.getElementById("cookie-banner");
    if (!banner) return;
    analyticsToggle = banner.querySelector("#cookie-analytics");

    banner.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cookie]");
      if (!btn) return;
      switch (btn.getAttribute("data-cookie")) {
        case "accept-all": save(true); break;
        case "necessary": save(false); break;
        case "settings": banner.classList.add("is-settings"); break;
        case "save": save(analyticsToggle && analyticsToggle.checked); break;
      }
    });

    // Кнопка «Настройки cookie» в подвале (и любая другая с data-cookie-open)
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-cookie-open]");
      if (!t) return;
      e.preventDefault();
      show(true);
    });

    var consent = getConsent();
    if (consent) {
      apply(consent);
    } else {
      setTimeout(function () { show(false); }, 700);
    }
  }

  window.FBSRConsent = {
    get: getConsent,
    open: function () { show(true); },
    revoke: function () { clearCookie(); show(false); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
