/* ─────────────────────────────────────────────────────────────
   THEME.JS – HELL-/DUNKEL-MODUS FÜR DIE GANZE WEBSITE
   ─────────────────────────────────────────────────────────────
   Wird auf JEDER Seite ganz oben im <head> geladen (vor den Stylesheets),
   damit der gewählte Modus schon vor dem ersten Zeichnen gesetzt ist und
   die Seite nie kurz im falschen Modus aufblitzt.

   • Standard ist IMMER der dunkle Modus – egal, welche Einstellung das
     Gerät/der Browser hat. Nur wer den Button im Footer benutzt hat,
     bekommt (auf seinem Gerät) den gewählten Modus gemerkt.
   • Der Modus steht als  <html data-theme="dark|light">.  Das dunkle
     Design ist das normale Stylesheet der Seite (style.css, header.css,
     die <style>-Blöcke der Seiten) und wird vom Hell-Modus NICHT
     verändert; der Hell-Modus liegt komplett in theme.css und greift nur
     bei  html[data-theme="light"].
   • Der Button selbst (<button data-theme-toggle>) wird von header.js im
     Footer erzeugt; hier hängt nur der Klick dran (Event-Delegation, damit
     es auch für dynamisch eingefügte Buttons klappt).
   ───────────────────────────────────────────────────────────── */
(function () {
    var STORAGE_KEY = 'siteTheme';
    var root = document.documentElement;
    var listeners = [];

    function readStored() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
        } catch (err) {
            /* localStorage evtl. blockiert (privater Modus) → Standard */
            return 'dark';
        }
    }

    function getTheme() {
        return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    /* Beschriftung/Zustand aller Wechsel-Buttons nachführen. Der Button zeigt
       immer das Ziel an (im Dunkel-Modus: "zu Hell wechseln"). */
    function syncButtons() {
        var isLight = getTheme() === 'light';
        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            var label = btn.getAttribute(isLight ? 'data-label-dark' : 'data-label-light');
            if (label) {
                btn.setAttribute('aria-label', label);
                btn.setAttribute('title', label);
            }
            btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
        });
    }

    /* Weicher Wechsel: wo verfügbar als Überblendung der ganzen Seite
       (View-Transition-API), sonst ersatzweise über kurze Farb-Übergänge
       (.theme-fade, siehe theme.css). Wer "weniger Bewegung" eingestellt
       hat, bekommt den Wechsel direkt. */
    function runAnimated(change) {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { change(); return; }
        if (document.startViewTransition) {
            try { document.startViewTransition(change); return; } catch (err) { /* Fallback unten */ }
        }
        root.classList.add('theme-fade');
        change();
        clearTimeout(runAnimated.timer);
        runAnimated.timer = setTimeout(function () { root.classList.remove('theme-fade'); }, 650);
    }

    function setTheme(theme, persist) {
        theme = theme === 'light' ? 'light' : 'dark';
        var changed = getTheme() !== theme;
        if (persist !== false) {
            try { localStorage.setItem(STORAGE_KEY, theme); } catch (err) { /* privater Modus */ }
        }
        if (!changed) { syncButtons(); return; }
        runAnimated(function () {
            root.setAttribute('data-theme', theme);
            syncButtons();
            listeners.forEach(function (fn) {
                try { fn(theme); } catch (err) { /* ein Listener darf die anderen nicht blockieren */ }
            });
        });
    }

    /* Sofort beim Laden setzen (läuft im <head>, vor dem Rendern). */
    root.setAttribute('data-theme', readStored());

    window.azTheme = {
        get: getTheme,
        set: function (theme) { setTheme(theme, true); },
        toggle: function () { setTheme(getTheme() === 'light' ? 'dark' : 'light', true); },
        /* Vorübergehender Wechsel OHNE zu speichern (z.B. RUN: beim Trailer
           läuft die Seite dunkel) und Rückkehr zur gespeicherten Wahl. */
        temp: function (theme) { setTheme(theme, false); },
        restore: function () { setTheme(readStored(), false); },
        sync: syncButtons,
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); }
    };

    /* ─── HINWEIS VOR DEM WECHSEL ZUM HELLEN DESIGN ───
       Kleines Fenster mit kurzer Warnung (sehr hell, mehr Akkuverbrauch);
       erst nach "Wechseln" wird umgeschaltet, "Abbrechen"/Esc/Klick daneben
       lässt alles wie es ist. Zurück zum dunklen Design geht ohne Nachfrage.
       Texte kommen aus translations.js (theme.*), mit deutschem Fallback. */
    var dialog = null;

    function tr(key, fallback) {
        var value = window.i18n && window.i18n.translate && window.i18n.translate(key);
        return value || fallback;
    }

    function closeDialog() {
        if (!dialog) return;
        var el = dialog;
        dialog = null;
        document.removeEventListener('keydown', onDialogKey, true);
        el.classList.remove('is-open');
        setTimeout(function () { el.remove(); }, 200);
        if (el._opener && el._opener.focus) el._opener.focus();
    }

    function onDialogKey(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeDialog();
        } else if (e.key === 'Tab' && dialog) {
            var btns = dialog.querySelectorAll('button');
            var first = btns[0], last = btns[btns.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }

    function showLightWarning(opener) {
        if (dialog) return;
        var backdrop = document.createElement('div');
        backdrop.className = 'theme-dialog-backdrop';
        backdrop._opener = opener;
        backdrop.innerHTML =
            '<div class="theme-dialog" role="dialog" aria-modal="true" aria-labelledby="themeDialogTitle" aria-describedby="themeDialogText">' +
            '<h2 class="theme-dialog-title" id="themeDialogTitle"></h2>' +
            '<p class="theme-dialog-text" id="themeDialogText"></p>' +
            '<div class="theme-dialog-actions">' +
            '<button type="button" class="theme-dialog-btn" data-theme-cancel></button>' +
            '<button type="button" class="theme-dialog-btn theme-dialog-btn--primary" data-theme-confirm></button>' +
            '</div></div>';
        backdrop.querySelector('#themeDialogTitle').textContent = tr('theme.warnTitle', 'Helles Design');
        backdrop.querySelector('#themeDialogText').textContent = tr('theme.warnText', 'Das helle Design kann sehr hell wirken und braucht auf manchen Bildschirmen (z. B. OLED) mehr Akku. Trotzdem wechseln?');
        var cancelBtn = backdrop.querySelector('[data-theme-cancel]');
        var confirmBtn = backdrop.querySelector('[data-theme-confirm]');
        cancelBtn.textContent = tr('theme.cancel', 'Abbrechen');
        confirmBtn.textContent = tr('theme.confirm', 'Wechseln');

        cancelBtn.addEventListener('click', closeDialog);
        confirmBtn.addEventListener('click', function () {
            closeDialog();
            window.azTheme.set('light');
        });
        backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeDialog(); });

        document.body.appendChild(backdrop);
        dialog = backdrop;
        document.addEventListener('keydown', onDialogKey, true);
        /* nächster Frame, damit die Einblend-Animation läuft */
        requestAnimationFrame(function () {
            backdrop.classList.add('is-open');
            cancelBtn.focus();
        });
    }

    /* Klick auf irgendeinen Wechsel-Button. */
    document.addEventListener('click', function (event) {
        var btn = event.target.closest && event.target.closest('[data-theme-toggle]');
        if (!btn) return;
        event.preventDefault();
        if (getTheme() === 'dark') showLightWarning(btn);
        else window.azTheme.set('dark');
    });

    /* Wechsel in einem anderen Tab/Fenster übernehmen. */
    window.addEventListener('storage', function (event) {
        if (event.key !== STORAGE_KEY) return;
        setTheme(event.newValue === 'light' ? 'light' : 'dark', false);
    });

    /* ─── HEADER AUF DER STARTSEITE (nur Hell-Modus relevant) ───
       Auf index.html liegt der Header transparent über dem Hero-Video
       (body.transparent-header) und bleibt beim Scrollen sichtbar. Über dem
       Video braucht er weisse Schrift (wie im Dunkel-Modus), sobald darunter
       die hellen Abschnitte kommen aber dunkle Schrift + eine helle,
       leicht milchige Fläche. theme.css schaltet das über die Klasse
       .header-on-light um, die hier gesetzt wird, sobald der Hero-Bereich
       unter dem Header weggescrollt ist. Im Dunkel-Modus hat die Klasse
       keinerlei Wirkung. */
    document.addEventListener('DOMContentLoaded', function () {
        syncButtons();

        var body = document.body;
        if (!body.classList.contains('transparent-header')) return;
        var hero = document.getElementById('home');
        if (!hero) return;

        var ticking = false;
        function update() {
            ticking = false;
            var bar = document.querySelector('.navbar');
            var barHeight = bar ? bar.offsetHeight : 58;
            body.classList.toggle('header-on-light', hero.getBoundingClientRect().bottom <= barHeight);
        }
        function request() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }

        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', request);
        window.addEventListener('load', request);
        update();
    });
})();
