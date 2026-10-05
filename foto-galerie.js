/* ─────────────────────────────────────────────────────────────
   FOTO-GALERIE.JS – KATEGORIE-RASTER + MOTIV-SEITE
   ─────────────────────────────────────────────────────────────
   Liest window.FOTO_GALERIE (siehe foto-data.js) und baut zwei Dinge:

   1) KATEGORIESEITE (wildlife.html, landschaften.html, …)
        <div class="photo-grid" data-foto-category="wildlife"></div>
      → pro Motiv eine quadratische Kachel mit Titel. Ein Klick führt auf
        motiv.html?k=wildlife&m=eisvogel.

   2) MOTIV-SEITE (motiv.html, EINE Seite für alle Motive)
        <div class="photo-mosaic" data-foto-motiv></div>
      → liest k= und m= aus der Adresse, setzt Titel/Zurück-Link und zeigt
        alle Fotos des Motivs als Mosaik (siehe unten). Ein Klick öffnet die
        Lightbox (photo-lightbox.js) mit allen Fotos dieses Motivs.
   ───────────────────────────────────────────────────────────── */
(function () {
    var MOTIV_PAGE = 'motiv.html';

    /* ─── HILFSFUNKTIONEN ─── */
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

    /* Bild-Eintrag: 'pfad.jpg' (oder { src: 'pfad.jpg' }) */
    function motifImages(motif) {
        return (motif.images || []).map(function (entry) {
            return typeof entry === 'string' ? entry : (entry && entry.src);
        }).filter(Boolean);
    }

    /* Bildausschnitt eines Eintrags: { src: '…', x: 30, y: 20 }.
       x: 0 = Bild ganz links ausrichten, 100 = ganz rechts (Standard 50 = Mitte)
       y: 0 = ganz oben, 100 = ganz unten (Standard 50 = Mitte) */
    function focusOf(motif, index) {
        var entry = (motif.images || []).filter(function (e) { return e && (typeof e === 'string' || e.src); })[index];
        var pct = function (v) { return (typeof v === 'number' && isFinite(v)) ? Math.max(0, Math.min(100, v)) : 50; };
        return (entry && typeof entry === 'object')
            ? pct(entry.x) + '% ' + pct(entry.y) + '%'
            : '50% 50%';
    }

    function altText(title) {
        var base = translate('fotografie.imageAlt', 'Fotografie von Aurelio Zingarello');
        return title ? title + ' – ' + base : base;
    }

    /* ─── TITEL IMMER AUF EINER ZEILE ───
       Passt ein Titel in seiner Kachel nicht in eine Zeile (z.B. "MÉSANGE
       CHARBONNIÈRE" im 2-Spalten-Raster), wird nur seine Schrift so weit
       verkleinert, dass er genau reinpasst – nie ein Umbruch. */
    function fitTitle(label) {
        var text = label.firstElementChild;
        if (!text) return;
        label.style.fontSize = '';
        var cs = getComputedStyle(label);
        var available = label.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (available <= 0) return;
        for (var i = 0; i < 6; i++) {
            var width = text.getBoundingClientRect().width;
            if (width <= available) break;
            var size = parseFloat(getComputedStyle(label).fontSize);
            label.style.fontSize = (size * available / width - 0.25) + 'px';
        }
    }

    function fitAllTitles(root) {
        root.querySelectorAll('.photo-grid-title').forEach(fitTitle);
    }

    function keepTitlesFitted(root) {
        fitAllTitles(root);
        /* Schrift (Barlow Condensed) lädt asynchron – danach neu messen. */
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitAllTitles(root); });
        window.addEventListener('load', function () { fitAllTitles(root); });
        var timer = null;
        window.addEventListener('resize', function () {
            clearTimeout(timer);
            timer = setTimeout(function () { fitAllTitles(root); }, 80);
        });
    }

    /* ─── 1) KATEGORIESEITE ─── */
    function initCategory(grid) {
        var category = grid.getAttribute('data-foto-category');
        var motifs = (window.FOTO_GALERIE && window.FOTO_GALERIE[category]) || [];

        grid.textContent = '';
        motifs.forEach(function (motif) {
            var images = motifImages(motif);
            if (!images.length) return;

            var title = pickTitle(motif.title);
            var alt = altText(title);

            var tile = document.createElement('a');
            tile.className = 'photo-grid-item photo-grid-motif';
            tile.href = MOTIV_PAGE + '?k=' + encodeURIComponent(category) + '&m=' + encodeURIComponent(motifSlug(motif));
            if (title) tile.setAttribute('aria-label', title);

            var img = document.createElement('img');
            img.src = images[0];
            img.style.objectPosition = focusOf(motif, 0);
            img.alt = alt;
            img.loading = 'lazy';
            tile.appendChild(img);

            if (title) {
                var label = document.createElement('span');
                label.className = 'photo-grid-title';
                var text = document.createElement('span');
                text.className = 'photo-grid-title-text';
                text.textContent = title;
                label.appendChild(text);
                tile.appendChild(label);
            }

            grid.appendChild(tile);
        });

        keepTitlesFitted(grid);
    }

    /* ─── 2) MOTIV-SEITE: MOSAIK ───
       Vorlage ist ein 6er-Block aus 2 Spalten (Handy):
           ┌────┬────┐   oben: links Hochformat über Querformat,
           │ ho │ qu │          rechts Querformat über Hochformat
           │    ├────┤
           ├────┤ ho │   unten: breites Querformat + schmales Hochformat
           │ qu │    │          über die volle Breite
           ├────┴─┬──┤
           │ breit│sch│
           └──────┴──┘
       Am PC (3 Spalten) ist es derselbe Block um 90° gedreht. Die Form einer
       Kachel hängt nur von ihrer Position in der Liste ab; jedes Bild füllt
       seine Kachel komplett aus, zentriert (object-fit: cover). Mehr als 6
       Bilder → weitere Blöcke darunter; ein unvollständiger letzter Block
       (1–5 Bilder) wird ohne Lücken aufgefüllt.

       Beschreibung eines Blocks: Kisten (row/col) enthalten Kacheln; die Zahl
       "grow" ist die relative Grösse in Laufrichtung (aus dem Entwurf
       übernommen), "order" die Position der Kachel im Block (0 = erstes
       Bild des Blocks). aspect = Breite/Höhe des ganzen Blocks. */
    function row(grow, kids) { return { dir: 'row', grow: grow, kids: kids }; }
    function col(grow, kids) { return { dir: 'col', grow: grow, kids: kids }; }
    function tile(grow, order) { return { grow: grow, order: order }; }
    function block(aspect, node) { node.aspect = aspect; return node; }

    /* Handy – 2 Spalten */
    var M_GRID4 = block(934 / 911, row(1, [
        col(1, [tile(608, 0), tile(276, 2)]),
        col(1, [tile(277, 1), tile(607, 3)])
    ]));
    var M_ROW2 = block(934 / 451, row(1, [tile(607, 0), tile(289, 1)]));
    var M_ROW1 = block(16 / 9, row(1, [tile(1, 0)]));
    var M_GRID3 = block(934 / 608, row(1, [
        col(1, [tile(1, 0)]),
        col(1, [tile(1, 1), tile(1, 2)])
    ]));

    /* PC – 3 Spalten: der 6er-Block um 90° gedreht (+ Füll-Varianten) */
    function desktopBlock(rowsRight, leftBottomOrder) {
        return block(1389 / 934, row(1, [
            col(451, [tile(607, 0), tile(289, leftBottomOrder)]),
            col(911, rowsRight)
        ]));
    }
    var D_FULL = desktopBlock([
        row(451, [tile(276, 1), tile(608, 2)]),
        row(451, [tile(607, 4), tile(277, 5)])
    ], 3);
    var D_FIVE = desktopBlock([
        row(451, [tile(276, 1), tile(608, 2)]),
        row(451, [tile(1, 4)])
    ], 3);
    var D_FOUR = desktopBlock([
        row(451, [tile(1, 1)]),
        row(451, [tile(1, 3)])
    ], 2);
    var D_THREE = block(4, row(1, [tile(1, 0), tile(1, 1), tile(1, 2)]));

    var MOBILE_FULL = [M_GRID4, M_ROW2];
    var MOBILE_REST = { 1: [M_ROW1], 2: [M_ROW2], 3: [M_GRID3], 4: [M_GRID4], 5: [M_GRID4, M_ROW1] };
    var DESKTOP_FULL = [D_FULL];
    var DESKTOP_REST = { 1: [M_ROW1], 2: [M_ROW2], 3: [D_THREE], 4: [D_FOUR], 5: [D_FIVE] };

    function countTiles(node) {
        return node.kids ? node.kids.reduce(function (sum, kid) { return sum + countTiles(kid); }, 0) : 1;
    }

    /* Liste der Blöcke für n Bilder (je 6 = ein voller Block). */
    function planBlocks(n, desktop) {
        var full = desktop ? DESKTOP_FULL : MOBILE_FULL;
        var rest = desktop ? DESKTOP_REST : MOBILE_REST;
        var plan = [];
        for (var i = 0; i < Math.floor(n / 6); i++) plan = plan.concat(full);
        if (n % 6) plan = plan.concat(rest[n % 6]);
        return plan;
    }

    function initMotif(host) {
        var params = new URLSearchParams(window.location.search);
        var category = params.get('k') || '';
        var slug = params.get('m') || '';
        var motifs = (window.FOTO_GALERIE && window.FOTO_GALERIE[category]) || [];
        var motif = motifs.filter(function (m) { return motifSlug(m) === slug; })[0];

        if (!motif) {
            /* Unbekannte Adresse → zurück zur Kategorie bzw. Übersicht. */
            window.location.replace(motifs.length ? categoryPage(category) : 'fotografie.html');
            return;
        }

        var title = pickTitle(motif.title);
        var alt = altText(title);
        var images = motifImages(motif);

        var heading = document.getElementById('foto-motiv-title');
        if (heading) heading.textContent = title;
        document.title = title + ' | Aurelio Zingarello';

        var back = document.getElementById('foto-motiv-back');
        if (back) {
            back.href = categoryPage(category);
            var backLabel = back.querySelector('[data-foto-back-label]');
            if (backLabel) backLabel.textContent = translate('fotografie.cat' + capitalize(category), '');
        }

        var lightbox = window.PhotoLightbox
            ? window.PhotoLightbox.init({ groups: [images.map(function (src) { return { src: src, alt: alt }; })] })
            : null;

        function renderNode(node, base) {
            var el;
            if (node.kids) {
                el = document.createElement('div');
                el.className = 'photo-mosaic-node is-' + node.dir;
                node.kids.forEach(function (kid) { el.appendChild(renderNode(kid, base)); });
            } else {
                var index = base + node.order;
                el = document.createElement('button');
                el.type = 'button';
                el.className = 'photo-grid-item photo-mosaic-item';
                var img = document.createElement('img');
                img.src = images[index];
                img.style.objectPosition = focusOf(motif, index);
                img.alt = alt;
                img.draggable = false;
                img.loading = 'lazy';
                el.appendChild(img);
                if (lightbox) el.addEventListener('click', function () { lightbox.openGroup(0, index); });
            }
            el.style.flex = node.grow + ' 1 0px';
            return el;
        }

        var mobileQuery = window.matchMedia('(max-width: 640px)');

        function layout() {
            host.textContent = '';
            var base = 0;
            planBlocks(images.length, !mobileQuery.matches).forEach(function (spec) {
                var el = renderNode(spec, base);
                el.classList.add('photo-mosaic-block');
                el.style.flex = '0 0 auto';
                el.style.aspectRatio = String(spec.aspect);
                host.appendChild(el);
                base += countTiles(spec);
            });
        }

        layout();
        if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', layout);
        else mobileQuery.addListener(layout);
    }

    function categoryPage(category) {
        return { wildlife: 'wildlife.html', landschaften: 'landschaften.html', portrait: 'portrait.html', street: 'streetfotografie.html' }[category] || 'fotografie.html';
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function init() {
        var categoryGrid = document.querySelector('[data-foto-category]');
        if (categoryGrid) initCategory(categoryGrid);
        var motifHost = document.querySelector('[data-foto-motiv]');
        if (motifHost) initMotif(motifHost);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
