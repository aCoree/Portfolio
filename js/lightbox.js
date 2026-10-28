/* ─── GEMEINSAME GROSSANSICHT (LIGHTBOX) – BILDER & YOUTUBE-VIDEOS ───
   EINE Datei für alle Seiten (Fotografie-Kategorien, Behind the Scenes,
   URBNVIBE, …). Das Aussehen steht in css/lightbox.css. Das Overlay
   (Schliessen/Pfeile) baut dieses Skript selbst auf – es muss auf den
   Seiten KEIN Lightbox-HTML mehr stehen.

   ▸ NEUE SEITE MIT GROSSANSICHT (3 Schritte):
     1. In <head> (nach style.css/header.css, vor theme.css):
            <link rel="stylesheet" href="css/lightbox.css">
     2. Am Seitenende, nach translations.js/i18n.js:
            <script src="js/lightbox.js"></script>
     3. Bei jedem Bild, das gross anklickbar sein soll:
            <img src="…" alt="…" data-lightbox="meine-galerie">
        Alle Elemente mit demselben Namen bilden EINE Galerie (blättern,
        Miniatur-Leiste, Runterwischen zum Schliessen). Optional:
          data-lightbox-src="grosses-bild.jpg"  → zeigt in der Grossansicht
                                                   eine andere/grössere Datei
          data-lightbox-xl                      → Bild auf PC nochmals
                                                   grösser skalieren

   ▸ YOUTUBE-VIDEO IN DER GROSSANSICHT:
     Zusätzlich im <head> das Stylesheet des Play-Knopfs einbinden:
            <link rel="stylesheet" href="css/youtube.css">
        <div data-lightbox="meine-galerie" data-lightbox-youtube="VIDEO_ID"
             role="button" tabindex="0">
            <img src="vorschaubild.jpg" alt="…">
        </div>
     Das Vorschaubild (data-lightbox-poster oder das <img> darin) ist das
     "Bild" des Videos, der Play-Knopf wird automatisch daraufgesetzt (Look:
     css/youtube.css, wie bei allen YouTube-Videos der Seite). Der
     YouTube-Player wird erst nach dem Klick geladen, beim Weiterblättern
     stoppt das Video automatisch.

   ▸ PER SKRIPT (z.B. foto-galerie.js):
        var lb = PhotoLightbox.init({ groups: [[{ src, alt }, …], …] });
        lb.openGroup(gruppenIndex, bildIndex);
     Einträge: { src, alt }  oder  { youtube: 'VIDEO_ID', poster, alt }.

   Technik: Native CSS-Scroll-Snap-Galerie (ein Slide pro Bild, nebeneinander
   in einem scrollbaren Container) – exakt dasselbe Prinzip wie die
   Produktbild-Galerie bei Digitec und wie der "Meine Projekte"-Slider auf
   index.html (.apple-slider-track): Touch-Swipe und der 2-Finger-
   Trackpad-Swipe laufen komplett nativ über den Browser, dadurch butter-
   weich, immer zuverlässig wiederholbar und ohne eigene Zieh-Physik.
   Nur für die Maus (kein natives horizontales Wischen) wird das Scrollen
   per Klicken-&-Ziehen simuliert, genau wie beim Projekte-Slider.

   Zusätzlich: eine Miniatur-Leiste unten zum direkten Springen zwischen
   den Bildern, sowie Runterwischen/-ziehen zum Schliessen (Touch & Maus),
   analog zum Ein-/Ausblenden des Mobile-Menüs (siehe .photo-lightbox in
   css/lightbox.css). */
(function () {
    /* Übersetzung über i18n.js (falls geladen), sonst deutscher Fallback. */
    function t(key, fallback) {
        try {
            var value = window.i18n && window.i18n.translate && window.i18n.translate(key);
            if (value) return value;
        } catch (err) { /* i18n evtl. noch nicht bereit */ }
        return fallback;
    }

    function makeNavButton(className, id, iconClass, i18nKey, fallback) {
        var btn = document.createElement('button');
        btn.className = 'lightbox-nav-btn ' + className;
        btn.id = id;
        btn.type = 'button';
        btn.setAttribute('data-i18n-attr', 'aria-label:' + i18nKey);
        btn.setAttribute('aria-label', t(i18nKey, fallback));
        var icon = document.createElement('i');
        icon.className = iconClass;
        btn.appendChild(icon);
        return btn;
    }

    /* Das Overlay (Schliessen, Pfeile, Slide-Container) steht nicht mehr in
       jeder HTML-Seite, sondern wird hier EINMAL aufgebaut – gibt es auf
       einer Seite noch ein eigenes #photo-lightbox, wird dieses verwendet. */
    function ensureOverlay(opts) {
        var existing = document.getElementById(opts.overlayId);
        if (existing) return existing;

        var overlay = document.createElement('div');
        overlay.id = opts.overlayId;
        overlay.className = 'photo-lightbox';
        overlay.appendChild(makeNavButton('lightbox-close-btn', opts.closeId, 'fa-solid fa-xmark', 'lightbox.close', 'Schließen'));
        overlay.appendChild(makeNavButton('lightbox-prev-btn', opts.prevId, 'fa-solid fa-chevron-left', 'lightbox.prevImage', 'Vorheriges Bild'));
        var content = document.createElement('div');
        content.className = 'photo-lightbox-content';
        overlay.appendChild(content);
        overlay.appendChild(makeNavButton('lightbox-next-btn', opts.nextId, 'fa-solid fa-chevron-right', 'lightbox.nextImage', 'Nächstes Bild'));
        document.body.appendChild(overlay);
        return overlay;
    }

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
            /* Optional: Gruppen-Modus (siehe js/foto-galerie.js). Statt aller
               Bilder der Seite zeigt die Lightbox dann pro Aufruf von
               openGroup(gruppe) nur die Bilder EINER Gruppe, z.B. alle
               Fotos vom Eisvogel. Format: [[{src, alt}, ...], ...] */
            groups: null
        }, options || {});

        var overlay = ensureOverlay(opts);
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
        var videos = [];
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

            videos = [];
            slideImgs = list.map(function (entry, idx) {
                var slide = document.createElement('div');
                slide.className = 'photo-lightbox-slide';
                var img = document.createElement('img');
                img.alt = entry.alt || '';
                img.draggable = false;
                img.addEventListener('dragstart', function (e) { e.preventDefault(); });
                if (entry.youtube) {
                    slide.classList.add('is-video');
                    buildVideoSlide(entry, slide, img, idx);
                } else {
                    img.src = entry.src;
                    slide.appendChild(img);
                }
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
                    thumbImg.src = entry.youtube ? posterOf(entry) : entry.src;
                    thumbImg.alt = '';
                    thumbImg.draggable = false;
                    thumb.appendChild(thumbImg);
                    if (entry.youtube) {
                        var thumbPlay = document.createElement('span');
                        thumbPlay.className = 'lightbox-thumb-play';
                        thumbPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
                        thumb.appendChild(thumbPlay);
                    }
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

        function posterOf(entry) {
            return entry.poster || ('https://i.ytimg.com/vi/' + entry.youtube + '/hqdefault.jpg');
        }

        /* Video-Slide: erst nur Vorschaubild + Play-Knopf, der YouTube-
           Player (iframe) entsteht erst nach dem Klick – so lädt nichts von
           YouTube, solange niemand das Video startet. */
        function buildVideoSlide(entry, slide, poster, idx) {
            var box = document.createElement('div');
            box.className = 'lightbox-video';
            poster.className = 'lightbox-video-poster';
            poster.src = posterOf(entry);
            var start = document.createElement('button');
            start.type = 'button';
            start.className = 'yt-video-start';
            start.setAttribute('data-i18n-attr', 'aria-label:lightbox.playVideo');
            start.setAttribute('aria-label', t('lightbox.playVideo', 'Video abspielen'));
            start.innerHTML = '<span class="yt-play"></span>';
            box.appendChild(poster);
            box.appendChild(start);
            box.addEventListener('click', function (e) {
                e.stopPropagation();
                playVideo(idx);
            });
            slide.appendChild(box);
            videos[idx] = { box: box, id: entry.youtube, title: entry.alt || 'YouTube', iframe: null };
        }

        function playVideo(idx) {
            var video = videos[idx];
            if (!video || video.iframe) return;
            var iframe = document.createElement('iframe');
            iframe.className = 'lightbox-video-frame';
            iframe.src = 'https://www.youtube.com/embed/' + encodeURIComponent(video.id) + '?autoplay=1&rel=0&playsinline=1';
            iframe.title = video.title;
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            iframe.setAttribute('allowfullscreen', '');
            video.box.appendChild(iframe);
            video.box.classList.add('is-playing');
            video.iframe = iframe;
        }

        /* Entfernt den Player wieder (= Video stoppt, Vorschaubild kommt
           zurück). keepIdx: Slide, der gerade angezeigt wird und weiterläuft. */
        function stopVideos(keepIdx) {
            videos.forEach(function (video, idx) {
                if (!video || !video.iframe || idx === keepIdx) return;
                video.iframe.remove();
                video.iframe = null;
                video.box.classList.remove('is-playing');
            });
        }

        function updateThumbActive() {
            thumbs.forEach(function (thumb, idx) {
                thumb.classList.toggle('active', idx === currentIndex);
            });
            stopVideos(currentIndex);
        }

        function updateExtraLargeScale() {
            var active = window.innerWidth >= opts.extraLargeMinWidth;
            slideImgs.forEach(function (img, idx) {
                var entry = imageList[idx];
                var isXl = opts.extraLargeIndexes.indexOf(idx) !== -1 || (entry && entry.xl);
                if (isXl && !(entry && entry.youtube)) img.style.transform = active ? 'scale(' + opts.extraLargeScale + ')' : '';
            });
        }

        function goTo(idx, smooth) {
            if (!len) return;
            currentIndex = mod(idx, len);
            content.scrollTo({ left: currentIndex * content.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
            updateThumbActive();
        }

        var closeTimer = null;

        function open(index, autoplay) {
            clearTimeout(closeTimer);
            closeTimer = null;
            content.classList.remove('is-dragging');
            resetVerticalDragVisual(false);
            updateExtraLargeScale();
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            goTo(index, false);
            /* Wurde direkt auf ein Video geklickt, startet es sofort. */
            if (autoplay) playVideo(currentIndex);
        }

        function close() {
            clearTimeout(closeTimer);
            closeTimer = null;
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            resetVerticalDragVisual(false);
            stopVideos(-1);
        }

        /* Schliessen per Runterwischen: das Bild fährt von seiner aktuellen
           Position aus komplett nach UNTEN aus dem Bildschirm, der
           Hintergrund blendet dabei aus. Erst danach wird alles unsichtbar
           zurückgesetzt – früher wurde der Versatz sofort entfernt, wodurch
           das Bild beim Loslassen kurz wieder in der Mitte aufblitzte. */
        function slideClose() {
            if (!overlay.classList.contains('active') || closeTimer) return;
            content.style.transition = 'transform 0.28s cubic-bezier(0.4, 0, 1, 1)';
            content.style.transform = 'translateY(' + (window.innerHeight + 40) + 'px)';
            overlay.style.transition = 'opacity 0.28s ease';
            overlay.style.opacity = '0';
            closeTimer = setTimeout(function () {
                closeTimer = null;
                close();
            }, 290);
        }

        function navigate(direction) {
            goTo(currentIndex + direction, true);
        }

        buildGallery(imageList);

        /* Gruppen-Modus: Galerie der gewählten Gruppe neu aufbauen und
           öffnen. */
        function openGroup(groupIndex, imageIndex, autoplay) {
            var list = opts.groups && opts.groups[groupIndex];
            if (!list || !list.length) return;
            buildGallery(list);
            open(imageIndex || 0, autoplay);
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
        var lastDragDy = 0, lastDragT = 0, dragVelocity = 0;

        function applyVerticalDragVisual(dy) {
            if (closeTimer) return;
            var clamped = Math.max(0, dy);
            var now = performance.now();
            if (lastDragT) dragVelocity = (clamped - lastDragDy) / Math.max(1, now - lastDragT);
            lastDragDy = clamped;
            lastDragT = now;
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
            lastDragDy = 0;
            lastDragT = 0;
            dragVelocity = 0;
        }

        function finishVerticalDrag(dy) {
            /* weit genug gezogen ODER kurz, aber schnell nach unten gewischt */
            if (dy > 110 || (dy > 30 && dragVelocity > 0.6)) {
                slideClose();
            } else {
                resetVerticalDragVisual(true);
            }
        }

        /* ─── 2-FINGER-WISCHEN NACH UNTEN (Trackpad, z.B. Mac) ───
           Das Bild folgt den Fingern live nach unten und fährt bei genug
           Weg heraus; lässt man vorher los, schnappt es zurück. Horizontales
           2-Finger-Wischen bleibt unangetastet (blättert nativ). */
        var wheelAcc = 0, wheelTimer = null;

        function fingerDownSign(e) {
            var inverted = e.webkitDirectionInvertedFromDevice;
            if (typeof inverted === 'boolean') return inverted ? -1 : 1;
            return /Mac|iPhone|iPad/.test(navigator.platform || '') ? -1 : 1;
        }

        overlay.addEventListener('wheel', function (e) {
            if (!overlay.classList.contains('active') || e.ctrlKey) return;
            if (closeTimer) { e.preventDefault(); return; }
            var ady = Math.abs(e.deltaY), adx = Math.abs(e.deltaX);
            if (e.deltaMode !== 0 || ady <= adx) return;
            /* Klassisches Mausrad (feste Rastschritte) schliesst nicht. */
            if (adx === 0 && ady >= 100 && ady % 100 === 0 && wheelAcc === 0) return;

            e.preventDefault();
            wheelAcc = Math.max(0, wheelAcc + e.deltaY * fingerDownSign(e));
            applyVerticalDragVisual(wheelAcc);

            clearTimeout(wheelTimer);
            if (wheelAcc > 130) {
                wheelAcc = 0;
                slideClose();
                return;
            }
            wheelTimer = setTimeout(function () {
                wheelAcc = 0;
                if (!closeTimer) resetVerticalDragVisual(true);
            }, 150);
        }, { passive: false });

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
            if (e.target.tagName !== 'IMG' && !e.target.closest('.lightbox-video')) close();
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

    /* ─── AUTOMATISCHER START ÜBER data-lightbox ───
       Jedes Element mit  data-lightbox="name"  ist klickbar; alle mit
       demselben Namen bilden eine Galerie (Anleitung: ganz oben). */
    function entryFromElement(el) {
        var img = el.tagName === 'IMG' ? el : el.querySelector('img');
        var alt = (img && img.alt) || el.getAttribute('aria-label') || '';
        var youtube = el.getAttribute('data-lightbox-youtube');
        if (youtube) {
            return {
                youtube: youtube,
                poster: el.getAttribute('data-lightbox-poster') || (img && img.src) || '',
                alt: alt
            };
        }
        var src = el.getAttribute('data-lightbox-src') || (img && img.src);
        if (!src) return null;
        return { src: src, alt: alt, xl: el.hasAttribute('data-lightbox-xl') };
    }

    function autoInit() {
        var elements = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
        if (!elements.length) return null;

        var names = [];
        var groups = [];
        var bindings = [];
        elements.forEach(function (el) {
            var entry = entryFromElement(el);
            if (!entry) return;
            var name = el.getAttribute('data-lightbox') || 'default';
            var groupIndex = names.indexOf(name);
            if (groupIndex === -1) {
                groupIndex = names.length;
                names.push(name);
                groups.push([]);
            }
            groups[groupIndex].push(entry);
            if (entry.youtube && !el.querySelector('.yt-play')) {
                var play = document.createElement('span');
                play.className = 'yt-play';
                play.setAttribute('aria-hidden', 'true');
                el.appendChild(play);
            }
            bindings.push({ el: el, group: groupIndex, index: groups[groupIndex].length - 1, video: !!entry.youtube });
        });

        var lightbox = initPhotoLightbox({ groups: groups });
        if (!lightbox) return null;

        bindings.forEach(function (b) {
            function openThis() { lightbox.openGroup(b.group, b.index, b.video); }
            b.el.addEventListener('click', openThis);
            /* Elemente, die keine Links/Buttons sind (z.B. ein <div> mit
               Video-Vorschau), per Tastatur (Enter/Leertaste) bedienbar. */
            if (b.el.getAttribute('role') === 'button') {
                b.el.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openThis();
                    }
                });
            }
        });
        return lightbox;
    }

    window.PhotoLightbox = { init: initPhotoLightbox, auto: autoInit };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
})();
