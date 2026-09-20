/* ─────────────────────────────────────────────────────────────
   I18N.JS – Zentrale Mehrsprachigkeits-Engine (DE/FR/EN/IT)
   Liest window.SITE_TRANSLATIONS (siehe translations.js) und ersetzt
   den Text aller Elemente mit [data-i18n]/[data-i18n-html]/[data-i18n-attr]
   im gesamten Dokument. Läuft unabhängig von header.js, wird von diesem
   aber nach dem Einfügen von Header/Footer/Mobile-Menü erneut aufgerufen
   (siehe header.js, ganz am Ende von DOMContentLoaded), damit auch das
   dynamisch erzeugte Markup übersetzt wird – ein einziger, immer gleicher
   Mechanismus für statischen UND dynamischen Seiteninhalt.
   ───────────────────────────────────────────────────────────── */

(function () {
    var SUPPORTED = ['de', 'fr', 'en', 'it'];
    var DEFAULT_LANG = 'de';
    var STORAGE_KEY = 'siteLang';

    var listeners = [];

    function getDict(lang) {
        return (window.SITE_TRANSLATIONS && window.SITE_TRANSLATIONS[lang]) || {};
    }

    // Löst "nav.home" gegen {nav: {home: "..."}} auf.
    function resolveKey(dict, key) {
        var parts = key.split('.');
        var current = dict;
        for (var i = 0; i < parts.length; i++) {
            if (current == null || typeof current !== 'object') return undefined;
            current = current[parts[i]];
        }
        return typeof current === 'string' ? current : undefined;
    }

    function translate(key) {
        var lang = getCurrentLanguage();
        var value = resolveKey(getDict(lang), key);
        if (value !== undefined) return value;
        // Fallback auf Deutsch, falls in der Zielsprache (noch) keine
        // Übersetzung für diesen Key existiert – nie ein leerer String.
        return resolveKey(getDict(DEFAULT_LANG), key);
    }

    function detectBrowserLanguage() {
        var browserLangs = navigator.languages || [navigator.language || navigator.userLanguage || ''];
        for (var i = 0; i < browserLangs.length; i++) {
            var code = String(browserLangs[i] || '').slice(0, 2).toLowerCase();
            if (SUPPORTED.indexOf(code) !== -1) return code;
        }
        return DEFAULT_LANG;
    }

    function getCurrentLanguage() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
        } catch (err) { /* localStorage evtl. blockiert (private mode) */ }
        return detectBrowserLanguage();
    }

    function applyTranslations() {
        var lang = getCurrentLanguage();
        var dict = getDict(lang);
        var fallbackDict = getDict(DEFAULT_LANG);
        document.documentElement.setAttribute('lang', lang);

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var value = resolveKey(dict, key);
            if (value === undefined) value = resolveKey(fallbackDict, key);
            if (value !== undefined) el.textContent = value;
        });

        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            var value = resolveKey(dict, key);
            if (value === undefined) value = resolveKey(fallbackDict, key);
            if (value !== undefined) el.innerHTML = value;
        });

        // data-i18n-attr="placeholder:contact.namePlaceholder|title:foo.bar"
        document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
            el.getAttribute('data-i18n-attr').split('|').forEach(function (pair) {
                var split = pair.split(':');
                var attr = split[0];
                var key = split[1];
                if (!attr || !key) return;
                var value = resolveKey(dict, key);
                if (value === undefined) value = resolveKey(fallbackDict, key);
                if (value !== undefined) el.setAttribute(attr, value);
            });
        });

        document.querySelectorAll('[data-i18n-title]').forEach(function () {
            var key = document.documentElement.getAttribute('data-i18n-title');
            if (!key) return;
            var value = resolveKey(dict, key);
            if (value === undefined) value = resolveKey(fallbackDict, key);
            if (value !== undefined) document.title = value;
        });

        listeners.forEach(function (fn) {
            try { fn(lang); } catch (err) { /* ein fehlerhafter Listener darf die anderen nicht blockieren */ }
        });
    }

    // header.js baut Navigation/Footer/Suche direkt in der aktuell aktiven
    // Sprache auf (siehe t()-Aufrufe dort) – bei einem Sprachwechsel wird die
    // Seite deshalb bewusst einmal neu geladen, statt zu versuchen, das
    // komplexe, zustandsbehaftete Header-/Mobile-Menü-System live umzubauen
    // (offene Untermenüs, Mobile-Navigations-Stack, Such-Index, aktive
    // Links, ...). Das ist unauffällig (der Header ist ohnehin die erste
    // sichtbare Sache) und deutlich robuster als ein Live-Update.
    function setLanguage(lang) {
        if (SUPPORTED.indexOf(lang) === -1) return;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (err) { /* private mode */ }
        window.location.reload();
    }

    function onChange(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    window.i18n = {
        SUPPORTED: SUPPORTED,
        DEFAULT_LANG: DEFAULT_LANG,
        translate: translate,
        t: translate,
        getCurrentLanguage: getCurrentLanguage,
        setLanguage: setLanguage,
        applyTranslations: applyTranslations,
        onChange: onChange
    };

    document.addEventListener('DOMContentLoaded', applyTranslations);
})();
