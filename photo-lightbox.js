/* ─── GEMEINSAME BILD-LIGHTBOX ───
   Wird von der Fotografie-Galerie (landschaften/portrait/wildlife/
   streetfotografie) UND von bts.html genutzt.

   Native CSS-Scroll-Snap-Galerie (ein Slide pro Bild, nebeneinander in
   einem scrollbaren Container) – exakt dasselbe Prinzip wie die
   Produktbild-Galerie bei Digitec und wie der "Meine Projekte"-Slider
   auf index.html (.apple-slider-track): Touch-Swipe und der 2-Finger-
   Trackpad-Swipe laufen komplett nativ über den Browser, dadurch butter-
   weich, immer zuverlässig wiederholbar und ohne eigene Zieh-Physik.
   Nur für die Maus (kein natives horizontales Wischen) wird das Scrollen
   per Klicken-&-Ziehen simuliert, genau wie beim Projekte-Slider.

   Zusätzlich: eine Miniatur-Leiste unten zum direkten Springen zwischen
   den Bildern, sowie Runterwischen/-ziehen zum Schliessen (Touch & Maus),
   analog zum Ein-/Ausblenden des Mobile-Menüs (siehe .photo-lightbox in
   style.css).

   Zwei Modi:
   - Standard (bts.html): alle Bilder der Seite bilden EINE Galerie.
   - Gruppen-Modus (Fotografie-Kategorien, siehe foto-galerie.js): pro Motiv
     (z.B. "Eisvogel") eine eigene Galerie; init() liefert dafür
     { openGroup(gruppenIndex) } zurück. */
(function () {
    function initPhotoLightbox(options) {
        var opts = Object.assign({
            itemSelector: '.photo-grid .photo-grid-item img',
            overlayId: 'photo-lightbox',
            prevId: 'lightbox-prev',
            nextId: 'lightbox-next',
            closeId: 'lightbox-close',
            extraLargeIndexes: [],
            extraLargeScale: 1.18,
            extraLargeMinWidth: 900,
            /* Optional: Gruppen-Modus (siehe foto-galerie.js). Statt aller
               Bilder der Seite zeigt die Lightbox dann pro Aufruf von
               openGroup(gruppe) nur die Bilder EINER Gruppe, z.B. alle
               Fotos vom Eisvogel. Format: [[{src, alt}, ...], ...] */
            groups: null
        }, options || {});

        var overlay = document.getElementById(opts.overlayId);
        var prevBtn = document.getElementById(opts.prevId);
        var nextBtn = document.getElementById(opts.nextId);
        var closeBtn = document.getElementById(opts.closeId);
        var content = overlay ? overlay.querySelector('.photo-lightbox-content') : null;
        if (!overlay || !content) return null;

        var items = [];
        var imageList = [];
        if (!opts.groups) {
            items = Array.from(document.querySelectorAll(opts.itemSelector));
            if (!items.length) return null;
            imageList = items.map(function (item) { return { src: item.src, alt: item.alt || '' }; });
        }

        var len = 0;
        var currentIndex = 0;
        var slideImgs = [];
        var thumbs = [];
        var thumbsRow = null;

        function mod(n, m) { return ((n % m) + m) % m; }

        /* Baut Slides + Miniatur-Leiste für eine Bilderliste auf – einmalig
           beim Start (Standard-Modus) bzw. bei jedem Öffnen einer Gruppe
           (Gruppen-Modus). Alte Slides/Miniaturen werden dabei ersetzt. */
        function buildGallery(list) {
            imageList = list;
            len = list.length;
            content.textContent = '';
            if (thumbsRow) { thumbsRow.remove(); thumbsRow = null; }
            thumbs = [];

            slideImgs = list.map(function (entry) {
                var slide = document.createElement('div');
                slide.className = 'photo-lightbox-slide';
                var img = document.createElement('img');
                img.src = entry.src;
                img.alt = entry.alt || '';
                img.draggable = false;
                img.addEventListener('dragstart', function (e) { e.preventDefault(); });
                slide.appendChild(img);
                content.appendChild(slide);
                return img;
            });

            /* Miniatur-Leiste nur ab 2 Bildern sinnvoll; bei nur einem Bild
               werden zusätzlich die Pfeile ausgeblendet (.is-single). */
            overlay.classList.toggle('has-thumbs', len > 1);
            overlay.classList.toggle('is-single', len <= 1);
            if (len > 1) {
                thumbsRow = document.createElement('div');
                thumbsRow.className = 'lightbox-thumbs';
                list.forEach(function (entry, idx) {
                    var thumb = document.createElement('button');
                    thumb.type = 'button';
                    thumb.className = 'lightbox-thumb';
                    var thumbImg = document.createElement('img');
                    thumbImg.src = entry.src;
                    thumbImg.alt = '';
                    thumbImg.draggable = false;
                    thumb.appendChild(thumbImg);
                    thumb.addEventListener('click', function (e) {
                        e.stopPropagation();
                        goTo(idx, true);
                    });
                    thumbsRow.appendChild(thumb);
                    thumbs.push(thumb);
                });
                overlay.appendChild(thumbsRow);
            }
            updateExtraLargeScale();
        }

        function updateThumbActive() {
            thumbs.forEach(function (thumb, idx) {
                thumb.classList.toggle('active', idx === currentIndex);
            });
        }

        function updateExtraLargeScale() {
            var active = window.innerWidth >= opts.extraLargeMinWidth;
            opts.extraLargeIndexes.forEach(function (idx) {
                var img = slideImgs[idx];
                if (img) img.style.transform = active ? 'scale(' + opts.extraLargeScale + ')' : '';
            });
        }

        function goTo(idx, smooth) {
            if (!len) return;
            currentIndex = mod(idx, len);
            content.scrollTo({ left: currentIndex * content.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
            updateThumbActive();
        }

        function open(index) {
            content.classList.remove('is-dragging');
            resetVerticalDragVisual(false);
            updateExtraLargeScale();
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            goTo(index, false);
        }

        function close() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            resetVerticalDragVisual(false);
        }

        function navigate(direction) {
            goTo(currentIndex + direction, true);
        }

        buildGallery(imageList);

        /* Gruppen-Modus: Galerie der gewählten Gruppe neu aufbauen und
           öffnen. */
        function openGroup(groupIndex, imageIndex) {
            var list = opts.groups && opts.groups[groupIndex];
            if (!list || !list.length) return;
            buildGallery(list);
            open(imageIndex || 0);
        }

        items.forEach(function (img, idx) {
            img.addEventListener('click', function () { open(idx); });
        });

        if (closeBtn) closeBtn.addEventListener('click', close);
        if (nextBtn) {
            nextBtn.addEventListener('click', function (e) { e.stopPropagation(); navigate(1); });
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', function (e) { e.stopPropagation(); navigate(-1); });
        }

        document.addEventListener('keydown', function (e) {
            if (!overlay.classList.contains('active')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') navigate(1);
            else if (e.key === 'ArrowLeft') navigate(-1);
        });

        window.addEventListener('resize', function () {
            updateExtraLargeScale();
            if (overlay.classList.contains('active')) goTo(currentIndex, false);
        });

        /* Aktuellen Index nach einer nativen Touch-/Trackpad-Swipe-Geste
           nachführen, sobald das Scrollen zur Ruhe gekommen ist – nötig,
           damit Pfeile/Tastatur/Miniaturen danach vom richtigen Bild aus
           weitermachen. */
        var scrollSettleTimer = null;
        function syncIndexFromScroll() {
            var w = content.clientWidth;
            if (!w) return;
            currentIndex = mod(Math.round(content.scrollLeft / w), len);
            updateThumbActive();
        }
        content.addEventListener('scroll', function () {
            clearTimeout(scrollSettleTimer);
            scrollSettleTimer = setTimeout(syncIndexFromScroll, 120);
        }, { passive: true });

        /* ─── RUNTERZIEHEN ZUM SCHLIESSEN (Touch & Maus) ───
           content wird beim Runterziehen live mitgezogen und der
           Hintergrund blendet dabei aus; über einer Mindest-Distanz
           schliesst es beim Loslassen, sonst schnappt es zurück. */
        function applyVerticalDragVisual(dy) {
            var clamped = Math.max(0, dy);
            content.style.transition = 'none';
            content.style.transform = clamped ? 'translateY(' + clamped + 'px)' : '';
            overlay.style.transition = 'none';
            overlay.style.opacity = String(Math.max(0.4, 1 - clamped / 400));
        }

        function resetVerticalDragVisual(animate) {
            content.style.transition = animate ? 'transform 0.25s ease' : '';
            overlay.style.transition = animate ? 'opacity 0.25s ease' : '';
            content.style.transform = '';
            overlay.style.opacity = '';
        }

        function finishVerticalDrag(dy) {
            if (dy > 110) {
                close();
            } else {
                resetVerticalDragVisual(true);
            }
        }

        /* ─── KLICKEN & ZIEHEN MIT DER MAUS (horizontal = blättern,
           vertikal nach unten = schliessen) ─── */
        var pointerActive = false, dragAxis = null, dragMoved = false;
        var dragStartX = 0, dragStartY = 0, dragStartScrollLeft = 0, activePointerId = null;

        content.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'mouse') return;
            pointerActive = true;
            dragAxis = null;
            dragMoved = false;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartScrollLeft = content.scrollLeft;
            activePointerId = e.pointerId;
        });

        content.addEventListener('pointermove', function (e) {
            if (!pointerActive) return;
            var dx = e.clientX - dragStartX;
            var dy = e.clientY - dragStartY;

            if (dragAxis === null) {
                if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) return;
                dragAxis = (Math.abs(dy) > Math.abs(dx) && dy > 0) ? 'vertical' : 'horizontal';
                dragMoved = true;
                if (dragAxis === 'horizontal') {
                    content.classList.add('is-dragging');
                    if (content.setPointerCapture) {
                        try { content.setPointerCapture(activePointerId); } catch (err) { }
                    }
                }
            }

            if (dragAxis === 'horizontal') {
                /* scrollTo({behavior:'instant'}) statt direkter .scrollLeft-
                   Zuweisung: Letztere wird von manchen Browsern bei
                   aktivem scroll-snap (selbst mit scroll-snap-type:none
                   auf dem aktuellen Element) unzuverlässig sofort wieder
                   verworfen, scrollTo() dagegen zuverlässig übernommen. */
                content.scrollTo({ left: dragStartScrollLeft - dx, behavior: 'instant' });
            } else {
                applyVerticalDragVisual(dy);
            }
        });

        function endDrag(e) {
            if (!pointerActive) return;
            pointerActive = false;

            if (dragAxis === 'horizontal') {
                content.classList.remove('is-dragging');
                if (content.releasePointerCapture && activePointerId !== null) {
                    try { content.releasePointerCapture(activePointerId); } catch (err) { }
                }
                syncIndexFromScroll();
                goTo(currentIndex, true);
            } else if (dragAxis === 'vertical') {
                finishVerticalDrag(e && typeof e.clientY === 'number' ? e.clientY - dragStartY : 0);
            }

            dragAxis = null;
            activePointerId = null;
        }

        content.addEventListener('pointerup', endDrag);
        content.addEventListener('pointercancel', function () {
            if (!pointerActive) return;
            pointerActive = false;
            content.classList.remove('is-dragging');
            resetVerticalDragVisual(true);
            dragAxis = null;
            activePointerId = null;
        });
        content.addEventListener('pointerleave', function (e) { if (pointerActive) endDrag(e); });

        /* Tap/Klick auf den Hintergrund (nicht aufs Bild) schliesst die
           Lightbox; nach einem Drag wird dieser Klick unterdrückt. */
        content.addEventListener('click', function (e) {
            if (dragMoved) {
                dragMoved = false;
                return;
            }
            if (e.target.tagName !== 'IMG') close();
        });

        /* ─── RUNTERWISCHEN ZUM SCHLIESSEN AUF TOUCH-GERÄTEN ───
           Läuft komplett separat vom nativen horizontalen Scroll-Snap
           (siehe CSS) – nur die vertikale Komponente wird hier
           ausgewertet, die horizontale Wisch-Geste bleibt unangetastet
           nativ (kein preventDefault, rein passiv). */
        var touchStartX = 0, touchStartY = 0, touchActive = false, touchAxis = null;

        content.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) return;
            touchActive = true;
            touchAxis = null;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        content.addEventListener('touchmove', function (e) {
            if (!touchActive) return;
            var dx = e.touches[0].clientX - touchStartX;
            var dy = e.touches[0].clientY - touchStartY;

            if (touchAxis === null) {
                if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
                touchAxis = (Math.abs(dy) > Math.abs(dx) && dy > 0) ? 'vertical' : 'horizontal';
                /* Verhindert, dass ein nachträgliches synthetisches
                   'click' (ohne echtes natives Scrollen, da nichts
                   vertikal zu scrollen gibt) die Lightbox fälschlich
                   über den Hintergrund-Tap-Handler schliesst. */
                dragMoved = true;
            }

            if (touchAxis === 'vertical') {
                applyVerticalDragVisual(dy);
            }
        }, { passive: true });

        content.addEventListener('touchend', function (e) {
            if (!touchActive) return;
            touchActive = false;
            if (touchAxis === 'vertical') {
                finishVerticalDrag(e.changedTouches[0].clientY - touchStartY);
            }
            touchAxis = null;
        }, { passive: true });

        content.addEventListener('touchcancel', function () {
            touchActive = false;
            if (touchAxis === 'vertical') resetVerticalDragVisual(true);
            touchAxis = null;
        }, { passive: true });

        return { openGroup: openGroup, close: close };
    }

    window.PhotoLightbox = { init: initPhotoLightbox };
})();
