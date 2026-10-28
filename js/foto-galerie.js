/* ─────────────────────────────────────────────────────────────
   FOTO-GALERIE.JS – KATEGORIE-RASTER + MOTIV-SEITE
   ─────────────────────────────────────────────────────────────
   Liest window.FOTO_GALERIE (siehe foto-data.js) und baut zwei Dinge.
   Braucht js/foto-nav.js (window.FotoNav) – das ist auf allen Fotografie-
   Seiten ohnehin für den Header eingebunden:

   1) KATEGORIESEITE (wildlife.html, landschaften.html, …)
        <div class="photo-grid" data-foto-category="wildlife"></div>
      → pro Motiv eine quadratische Kachel mit Titel. Ein Klick führt auf
        motiv.html?k=wildlife&m=eisvogel.

   1b) DIREKTES MOSAIK (landschaften.html, portrait.html, streetfotografie.html)
        <div class="photo-mosaic" data-foto-mosaic="landschaften"></div>
      → zeigt ALLE Fotos der Kategorie (aller Motive aus foto-data.js)
        direkt im selben Mosaik wie die Motiv-Seite – keine Zwischenseite.

   2) MOTIV-SEITE (motiv.html, EINE Seite für alle Motive)
        <div class="photo-mosaic" data-foto-motiv></div>
      → liest k= und m= aus der Adresse, setzt Titel/Zurück-Link und zeigt
        alle Fotos des Motivs als Mosaik (siehe unten). Ein Klick öffnet die
        Lightbox (js/lightbox.js) mit allen Fotos dieses Motivs.

   FORMAT (hoch/quer): Fotos können in foto-data.js mit  format: 'hoch'  oder
   format: 'quer'  markiert werden – das Mosaik legt sie dann in Kacheln ihres
   Formats (Erklärung dort und bei planBlocks unten).
   ───────────────────────────────────────────────────────────── */
(function () {
    /* ─── HILFSFUNKTIONEN ─── */
    function translate(key, fallback) {
        return (window.i18n && window.i18n.translate && window.i18n.translate(key)) || fallback;
    }

    /* Titel, Adresse eines Motivs und Kategorie-Seiten kommen aus js/foto-nav.js
       (gleiche Logik wie im Header). */
    var pickTitle = window.FotoNav.pickTitle;
    var motifSlug = window.FotoNav.motifSlug;
    var categoryPage = window.FotoNav.categoryPage;

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

    /* Format eines Eintrags: { src: '…', format: 'hoch' }  oder  format: 'quer'.
       Liefert 'hoch' / 'quer' – ohne Angabe null (= Form egal, wie bisher
       automatisch). Zusätzlich verstanden: portrait/landscape (auch p/l, h/q). */
    function formatOf(motif, index) {
        var entry = (motif.images || []).filter(function (e) { return e && (typeof e === 'string' || e.src); })[index];
        var value = (entry && typeof entry === 'object') ? String(entry.format || '').toLowerCase() : '';
        if (value === 'hoch' || value === 'h' || value === 'portrait' || value === 'p') return 'hoch';
        if (value === 'quer' || value === 'q' || value === 'landscape' || value === 'l') return 'quer';
        return null;
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
            tile.href = window.FotoNav.motifHref(category, motif);
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

    /* ─── HOCH-/QUERFORMAT: WELCHE FORM HAT JEDE KACHEL? ───
       Jeder Block hat feste Kachelformen (z.B. links hoch, rechts quer). Aus
       dem Seitenverhältnis jeder Kachel (Breite/Höhe, berechnet aus den
       grow-Werten der Kisten) ergibt sich ihre Form: unter 0.95 = 'hoch',
       über 1.05 = 'quer', dazwischen 'egal'. Index = order der Kachel. */
    function tileShapes(block) {
        var shapes = [];
        (function walk(node, w, h) {
            if (!node.kids) {
                var ratio = w / h;
                shapes[node.order] = ratio < 0.95 ? 'hoch' : (ratio > 1.05 ? 'quer' : 'egal');
                return;
            }
            var total = node.kids.reduce(function (sum, kid) { return sum + kid.grow; }, 0);
            node.kids.forEach(function (kid) {
                var share = kid.grow / total;
                if (node.dir === 'row') walk(kid, w * share, h);
                else walk(kid, w, h * share);
            });
        })(block, block.aspect, 1);
        return shapes;
    }

    /* Ordnet die Bilder eines Blocks (6 oder weniger) den Kachelformen zu.
       formats[i] = 'hoch' | 'quer' | null für Bild i, shapes[k] = Form der
       Kachel k. Beginnt mit der normalen Reihenfolge und tauscht nur dort, wo
       ein Bild mit Angabe in der falschen Form liegt, mit dem nächstgelegenen
       passenden Partner – Bilder ohne Angabe passen überall. Rückgabe:
       slots[k] = Nummer des Bildes auf Kachel k. */
    function assignShapes(formats, shapes) {
        var slots = formats.map(function (_, i) { return i; });
        function fits(image, slot) {
            return !formats[image] || shapes[slot] === 'egal' || formats[image] === shapes[slot];
        }
        for (var pass = 0; pass < 20; pass++) {
            var swapped = false;
            for (var k = 0; k < slots.length; k++) {
                if (fits(slots[k], k)) continue;
                var best = -1, bestGain = 0, bestDistance = Infinity;
                for (var j = 0; j < slots.length; j++) {
                    if (j === k) continue;
                    var before = (fits(slots[k], k) ? 1 : 0) + (fits(slots[j], j) ? 1 : 0);
                    var after = (fits(slots[k], j) ? 1 : 0) + (fits(slots[j], k) ? 1 : 0);
                    var gain = after - before;
                    var distance = Math.abs(j - k);
                    if (gain > bestGain || (gain > 0 && gain === bestGain && distance < bestDistance)) {
                        best = j; bestGain = gain; bestDistance = distance;
                    }
                }
                if (best >= 0) {
                    var tmp = slots[k]; slots[k] = slots[best]; slots[best] = tmp;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        var misfits = 0;
        slots.forEach(function (image, k) { if (!fits(image, k)) misfits++; });
        return { slots: slots, misfits: misfits };
    }

    /* ─── ERSATZ: REIHEN MIT PASSENDER FORM ───
       Passen die Standard-Blöcke nicht zu den angegebenen Formaten (z.B.
       zwei Hochformat-Fotos, aber der Block hat nur eine hohe Kachel), wird
       dieser Block stattdessen aus Reihen gebaut: jedes Foto bekommt eine
       Kachel in SEINEM Format (hoch oder quer), die Reihen füllen die Breite
       (Handy: bis 2 Fotos pro Reihe, PC: bis 3). Das Raster bleibt
       vollständig – nur die Form der Kacheln folgt den Fotos. Reihen sind
       immer linksbündig (nie mittig). */
    var ROW_ASPECT = { hoch: 0.72, quer: 1.4 };  /* Breite/Höhe: zwischen 2:3 und 3:4 bzw. 4:3 und 3:2 */
    /* Eine Reihe wird nie höher als so viele px; sonst wird sie schmaler und
       beginnt links. Ein Foto allein: 720, mehrere nebeneinander: 920 – so
       füllen sie die Breite fast immer ganz, ein einzelnes Foto wird nicht riesig. */
    var ROW_MAX_HEIGHT_SINGLE = 720;
    var ROW_MAX_HEIGHT_MULTI = 920;

    function rowBlock(group, formats) {
        var total = 0;
        var tiles = group.map(function (image, order) {
            var aspect = ROW_ASPECT[formats[image]] || ROW_ASPECT.quer;
            total += aspect;
            return tile(Math.round(aspect * 1000), order);
        });
        var spec = block(total, row(1, tiles));
        spec.maxWidth = Math.round(total * (group.length > 1 ? ROW_MAX_HEIGHT_MULTI : ROW_MAX_HEIGHT_SINGLE));
        return spec;
    }

    /* Teilt die Bilder eines Blocks in möglichst wenige, ausgewogene Reihen.
       Mehrere Bilder teilen sich nur dann eine Reihe, wenn die Reihe dabei
       hoch genug bleibt (sonst würden Querformate winzig). */
    function packRows(formats, desktop) {
        var maxPerRow = desktop ? 3 : 2;
        var refWidth = desktop ? 1300 : 340;
        var minHeight = desktop ? 300 : 190;
        var best = [{ rows: 0, squares: 0, from: -1 }];

        for (var end = 1; end <= formats.length; end++) {
            for (var size = Math.min(maxPerRow, end); size >= 1; size--) {
                var start = end - size, sum = 0;
                for (var i = start; i < end; i++) sum += ROW_ASPECT[formats[i]] || ROW_ASPECT.quer;
                if (size > 1 && refWidth / sum < minHeight) continue;
                var candidate = { rows: best[start].rows + 1, squares: best[start].squares + size * size, from: start };
                var current = best[end];
                if (!current || candidate.rows < current.rows || (candidate.rows === current.rows && candidate.squares < current.squares)) {
                    best[end] = candidate;
                }
            }
        }

        var groups = [];
        for (var at = formats.length; at > 0; at = best[at].from) {
            var group = [];
            for (var n = best[at].from; n < at; n++) group.push(n);
            groups.unshift(group);
        }
        return groups;
    }

    var MOBILE_FULL = [M_GRID4, M_ROW2];
    var MOBILE_REST = { 1: [M_ROW1], 2: [M_ROW2], 3: [M_GRID3], 4: [M_GRID4], 5: [M_GRID4, M_ROW1] };
    var DESKTOP_FULL = [D_FULL];
    var DESKTOP_REST = { 1: [M_ROW1], 2: [M_ROW2], 3: [D_THREE], 4: [D_FOUR], 5: [D_FIVE] };

    /* Standard-Blöcke für n Bilder (je 6 = ein voller Block). */
    function standardBlocks(n, desktop) {
        if (n === 6) return desktop ? DESKTOP_FULL : MOBILE_FULL;
        return (desktop ? DESKTOP_REST : MOBILE_REST)[n] || [];
    }

    /* Plant das ganze Mosaik. Rückgabe: Liste von { spec, indices } – spec ist
       ein Block (siehe oben), indices[order] die Nummer des Fotos auf der
       Kachel mit dieser order.
       Jeweils 6 Fotos bilden einen Block (der letzte den Rest). Ohne Format-
       Angaben, oder wenn die Standard-Blöcke zu den Angaben passen (die Fotos
       werden dabei innerhalb des Blocks passend verteilt), bleibt alles wie
       gehabt; passen sie nicht, wird nur dieser Block aus Reihen gebaut. */
    function planBlocks(items, desktop) {
        var plan = [];
        for (var start = 0; start < items.length; start += 6) {
            var count = Math.min(6, items.length - start);
            var formats = items.slice(start, start + count).map(function (item) { return item.format || null; });

            var pieces = standardBlocks(count, desktop);
            var shapes = [];
            pieces.forEach(function (piece) { shapes = shapes.concat(tileShapes(piece)); });
            var result = assignShapes(formats, shapes);

            if (!result.misfits) {
                var offset = 0;
                pieces.forEach(function (piece) {
                    var size = countTiles(piece);
                    plan.push({
                        spec: piece,
                        indices: result.slots.slice(offset, offset + size).map(function (image) { return start + image; })
                    });
                    offset += size;
                });
            } else {
                packRows(formats, desktop).forEach(function (group) {
                    plan.push({
                        spec: rowBlock(group, formats),
                        indices: group.map(function (image) { return start + image; })
                    });
                });
            }
        }
        return plan;
    }

    /* Baut das Mosaik samt Lightbox. items: [{ src, alt, pos }] –
       identisch für Motiv-Seite und direkte Kategorie-Seiten. */
    function renderMosaic(host, items) {
        var lightbox = window.PhotoLightbox
            ? window.PhotoLightbox.init({ groups: [items.map(function (item) { return { src: item.src, alt: item.alt }; })] })
            : null;

        function renderNode(node, indices) {
            var el;
            if (node.kids) {
                el = document.createElement('div');
                el.className = 'photo-mosaic-node is-' + node.dir;
                node.kids.forEach(function (kid) { el.appendChild(renderNode(kid, indices)); });
            } else {
                var index = indices[node.order];
                var item = items[index];
                el = document.createElement('button');
                el.type = 'button';
                el.className = 'photo-grid-item photo-mosaic-item';
                var img = document.createElement('img');
                img.src = item.src;
                img.style.objectPosition = item.pos;
                img.alt = item.alt;
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
            planBlocks(items, !mobileQuery.matches).forEach(function (piece) {
                var el = renderNode(piece.spec, piece.indices);
                el.classList.add('photo-mosaic-block');
                el.style.flex = '0 0 auto';
                el.style.aspectRatio = String(piece.spec.aspect);
                if (piece.spec.maxWidth) {
                    /* Reihen aus wenigen Fotos nicht riesig ziehen: sie bleiben
                       schmaler und beginnen LINKS (bündig mit dem Titel). */
                    el.style.maxWidth = piece.spec.maxWidth + 'px';
                }
                host.appendChild(el);
            });
        }

        layout();
        if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', layout);
        else mobileQuery.addListener(layout);
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

        renderMosaic(host, images.map(function (src, index) {
            return { src: src, alt: alt, pos: focusOf(motif, index), format: formatOf(motif, index) };
        }));
    }

    /* ─── 3) KATEGORIE DIREKT ALS MOSAIK ───
       Alle Fotos aller Motive der Kategorie, in der Reihenfolge von
       foto-data.js, im gleichen Mosaik wie auf der Motiv-Seite. */
    function initCategoryMosaic(host) {
        var category = host.getAttribute('data-foto-mosaic');
        var motifs = (window.FOTO_GALERIE && window.FOTO_GALERIE[category]) || [];
        var alt = altText(translate('fotografie.cat' + capitalize(category), ''));
        var items = [];
        motifs.forEach(function (motif) {
            motifImages(motif).forEach(function (src, index) {
                items.push({ src: src, alt: alt, pos: focusOf(motif, index), format: formatOf(motif, index) });
            });
        });
        renderMosaic(host, items);
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function init() {
        var categoryGrid = document.querySelector('[data-foto-category]');
        if (categoryGrid) initCategory(categoryGrid);
        var motifHost = document.querySelector('[data-foto-motiv]');
        if (motifHost) initMotif(motifHost);
        var mosaicHost = document.querySelector('[data-foto-mosaic]');
        if (mosaicHost) initCategoryMosaic(mosaicHost);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
