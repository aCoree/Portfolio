/* ─────────────────────────────────────────────────────────────
   FOTO-NAV.JS – SECOND HEADER ALLER FOTOGRAFIE-SEITEN
   ─────────────────────────────────────────────────────────────
   Legt window.secondHeaderItems fest (liest js/header.js) – für
   fotografie.html, wildlife.html, streetfotografie.html, landschaften.html,
   portrait.html und motiv.html. Der Header ist dadurch auf all diesen
   Seiten gleich und steht nur hier (nicht mehr als Kopie in jeder Seite).

   Ergebnis (PC: Leiste, Handy: Liste unter den Hauptlinks):
       Alle Fotos        → fotografie.html (Übersicht)
       Wildlife ▾        → wildlife.html; beim Drüberfahren (Handy: Antippen)
                           klappt eine Liste auf:
                              Alle Wildlife Fotos  → wildlife.html
                              Eisvogel, Milan, …   → motiv.html?k=wildlife&m=…
       Streetfotografie  → streetfotografie.html
       Landschaften      → landschaften.html
       Portrait          → portrait.html
   Die Motive der Liste kommen automatisch aus foto-data.js: neues Tier
   dort eintragen = es erscheint auch im Header.

   Einbindung: nach translations.js und i18n.js, nach foto-data.js und
   VOR header.js:
       <script src="js/foto-data.js"></script>
       <script src="js/foto-nav.js"></script>
       <script src="js/header.js"></script>

   Dieselben Hilfsfunktionen (Titel, Adresse eines Motivs) nutzt
   js/foto-galerie.js über window.FotoNav.
   ───────────────────────────────────────────────────────────── */
(function () {
    var MOTIV_PAGE = 'motiv.html';

    /* Kategorien in der Reihenfolge des Headers.
       motifs: true  = die Kategorieseite zeigt eine Kachel pro Motiv (eigene
                       Motiv-Seiten) → Untermenü "Alle … Fotos" + Motive.
                       Die übrigen zeigen alle Fotos direkt, brauchen keins.
                       (Soll eine weitere Kategorie ein Untermenü bekommen:
                       motifs: true setzen und allKey/all ergänzen.) */
    var CATEGORIES = [
        { key: 'wildlife', page: 'wildlife.html', navKey: 'fotografie.navWildlife', nav: 'Wildlife', motifs: true, allKey: 'fotografie.allWildlife', all: 'Alle Wildlife Fotos' },
        { key: 'street', page: 'streetfotografie.html', navKey: 'fotografie.navStreet', nav: 'Streetfotografie' },
        { key: 'landschaften', page: 'landschaften.html', navKey: 'fotografie.navLandschaften', nav: 'Landschaften' },
        { key: 'portrait', page: 'portrait.html', navKey: 'fotografie.navPortrait', nav: 'Portrait' }
    ];

    function currentLang() {
        return (window.i18n && window.i18n.getCurrentLanguage && window.i18n.getCurrentLanguage()) || 'de';
    }

    function translate(key, fallback) {
        return (window.i18n && window.i18n.translate && window.i18n.translate(key)) || fallback;
    }

    /* title: 'Eisvogel'  oder  { de: '…', en: '…', fr: '…', it: '…' } */
    function pickTitle(title) {
        if (title && typeof title === 'object') {
            return title[currentLang()] || title.de || title[Object.keys(title)[0]] || '';
        }
        return title || '';
    }

    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /* Eindeutige Kennung eines Motivs (für die Adresse): id, sonst der
       deutsche Titel. */
    function motifSlug(motif) {
        if (motif.id) return slugify(motif.id);
        var title = motif.title;
        return slugify(title && typeof title === 'object' ? (title.de || title[Object.keys(title)[0]]) : title);
    }

    function motifHref(category, motif) {
        return MOTIV_PAGE + '?k=' + encodeURIComponent(category) + '&m=' + encodeURIComponent(motifSlug(motif));
    }

    function categoryPage(category) {
        var match = CATEGORIES.filter(function (c) { return c.key === category; })[0];
        return match ? match.page : 'fotografie.html';
    }

    function hasImages(motif) {
        return (motif.images || []).some(function (entry) {
            return entry && (typeof entry === 'string' || entry.src);
        });
    }

    function buildItems() {
        var data = window.FOTO_GALERIE || {};

        var items = [
            { label: translate('fotografie.navAll', 'Alle Fotos'), href: 'fotografie.html', emphasize: true }
        ];

        CATEGORIES.forEach(function (category) {
            var item = { label: translate(category.navKey, category.nav), href: category.page };
            var motifs = category.motifs ? (data[category.key] || []).filter(hasImages) : [];

            if (motifs.length) {
                item.children = [
                    { label: translate(category.allKey, category.all), href: category.page, emphasize: true }
                ].concat(motifs.map(function (motif) {
                    return { label: pickTitle(motif.title), href: motifHref(category.key, motif) };
                }));
            }
            items.push(item);
        });

        return items;
    }

    window.FotoNav = {
        pickTitle: pickTitle,
        motifSlug: motifSlug,
        motifHref: motifHref,
        categoryPage: categoryPage
    };

    window.secondHeaderItems = buildItems();
})();
