/* ─────────────────────────────────────────────────────────────
   FOTO-NAV.JS – SECOND HEADER ALLER FOTOGRAFIE-SEITEN
   ─────────────────────────────────────────────────────────────
   Legt window.secondHeaderItems fest (liest js/header.js) – für
   fotografie.html, wildlife.html, streetfotografie.html, landschaften.html,
   portrait.html, weitere.html und motiv.html. Der Header ist dadurch auf all diesen
   Seiten gleich und steht nur hier (nicht mehr als Kopie in jeder Seite).

   Ergebnis (PC: Leiste, Handy: Liste unter den Hauptlinks):
       Alle Fotos        → fotografie.html (Übersicht)
       Wildlife ▾        → wildlife.html; beim Drüberfahren (Handy: Antippen)
                           klappt eine Liste auf:
                              Alle Wildlife Fotos  → wildlife.html
                              Eisvogel, Milan, …   → motiv.html?k=wildlife&m=…
                              Weitere Tiere        → motiv.html?k=wildlife&m=weitere-tiere
                                                     (alle Tiere mit nur einem Foto)
       Streetfotografie  → streetfotografie.html
       Landschaften      → landschaften.html
       Portrait          → portrait.html
       Weitere           → weitere.html
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
    /* collect: Motive mit nur EINEM Foto bekommen keine eigene Kachel, sondern
                 landen zusammen auf einer Sammel-Seite (motiv.html?k=…&m=<id>),
                 z.B. "Weitere Tiere" bei Wildlife. */
    var CATEGORIES = [
        { key: 'wildlife', page: 'wildlife.html', navKey: 'fotografie.navWildlife', nav: 'Wildlife', motifs: true, allKey: 'fotografie.allWildlife', all: 'Alle Wildlife Fotos',
          collect: { id: 'weitere-tiere', titleKey: 'fotografie.moreAnimals', title: 'Weitere Tiere' } },
        { key: 'street', page: 'streetfotografie.html', navKey: 'fotografie.navStreet', nav: 'Streetfotografie' },
        { key: 'landschaften', page: 'landschaften.html', navKey: 'fotografie.navLandschaften', nav: 'Landschaften' },
        { key: 'portrait', page: 'portrait.html', navKey: 'fotografie.navPortrait', nav: 'Portrait' },
        { key: 'weitere', page: 'weitere.html', navKey: 'fotografie.navWeitere', nav: 'Weitere' }
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

    function validImages(motif) {
        return (motif.images || []).filter(function (entry) {
            return entry && (typeof entry === 'string' || entry.src);
        });
    }

    function hasImages(motif) {
        return validImages(motif).length > 0;
    }

    /* Motive einer Kategorie, aufgeteilt in
         tiles:      Motive mit eigener Kachel/Seite (mehrere Fotos)
         collection: Sammel-Motiv mit allen Einzelfotos (oder null) –
                     { id, title, images, members: [die Einzelfoto-Motive] }
         singles:    die Einzelfoto-Motive selbst
       Ohne "collect" in CATEGORIES bekommt jedes Motiv eine Kachel. */
    function splitMotifs(categoryKey) {
        var data = window.FOTO_GALERIE || {};
        var motifs = (data[categoryKey] || []).filter(hasImages);
        var category = CATEGORIES.filter(function (c) { return c.key === categoryKey; })[0];
        if (!category || !category.collect) return { tiles: motifs, collection: null, singles: [] };

        var tiles = [];
        var singles = [];
        motifs.forEach(function (motif) {
            (validImages(motif).length === 1 ? singles : tiles).push(motif);
        });
        if (!singles.length) return { tiles: motifs, collection: null, singles: [] };

        return {
            tiles: tiles,
            singles: singles,
            collection: {
                id: category.collect.id,
                title: translate(category.collect.titleKey, category.collect.title),
                members: singles,
                images: singles.reduce(function (all, motif) { return all.concat(validImages(motif)); }, [])
            }
        };
    }

    function buildItems() {
        var items = [
            { label: translate('fotografie.navAll', 'Alle Fotos'), href: 'fotografie.html', emphasize: true }
        ];

        CATEGORIES.forEach(function (category) {
            var item = { label: translate(category.navKey, category.nav), href: category.page };
            var motifs = [];
            if (category.motifs) {
                var split = splitMotifs(category.key);
                motifs = split.collection ? split.tiles.concat([split.collection]) : split.tiles;
            }

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
        categoryPage: categoryPage,
        splitMotifs: splitMotifs
    };

    /* sitemap.html braucht nur die Hilfsfunktionen, keinen Second Header:
       dort wird das Skript mit data-no-header eingebunden. */
    var script = document.currentScript;
    if (!(script && script.hasAttribute('data-no-header'))) {
        window.secondHeaderItems = buildItems();
    }
})();
