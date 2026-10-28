/* =====================================================================
   YOUTUBE-VIDEOS: VORSCHAUBILD + PLAY-KNOPF, PLAYER ERST NACH DEM KLICK
   =====================================================================
   Jedes YouTube-Video der Seite wird zuerst nur als Vorschaubild mit
   Glas-Play-Knopf gezeigt. Der YouTube-Player (iframe) entsteht erst,
   wenn jemand klickt – bis dahin lädt nichts von YouTube und die Seite
   bleibt schnell. Es läuft immer nur EIN Video gleichzeitig: startet ein
   neues, geht das vorherige zurück zum Vorschaubild.

   Aussehen (Knopf, Ecken …): css/youtube.css

   EINBINDUNG
       <link rel="stylesheet" href="css/youtube.css">
       <script src="js/youtube.js"></script>

   VIDEO EINTRAGEN (innerhalb eines Rahmens mit Seitenverhältnis 16:9,
   z.B. <div class="musik-video">, den die Seite selbst gestaltet):
       <div class="yt-video" data-youtube="VIDEO_ID"
            data-title="Name des Videos" data-poster="images/yt-VIDEO_ID.jpg"></div>

     data-youtube  die ID aus dem YouTube-Link (youtube.com/watch?v=VIDEO_ID).
                   Solange hier etwas anderes als eine echte ID steht
                   (z.B. PASTE_VIDEO_ID_HIER), bleibt die Box gedämpft und
                   nicht klickbar.
     data-title    Name für Screenreader und den Player.
                   Alternativ data-title-i18n="schluessel" für eine
                   Übersetzung aus translations.js.
     data-poster   (optional) eigenes Vorschaubild. Ohne Angabe wird das
                   YouTube-Vorschaubild geladen (i.ytimg.com). Ein eigenes
                   Bild aus images/ ist schneller und lädt nichts von Google.
   ===================================================================== */

(function () {
    var ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

    function t(key, fallback) {
        return (window.i18n && window.i18n.translate && window.i18n.translate(key)) || fallback;
    }

    function titleOf(box) {
        var key = box.getAttribute('data-title-i18n');
        var title = box.getAttribute('data-title') || 'YouTube';
        return key ? t(key, title) : title;
    }

    function posterSrc(box, id) {
        return box.getAttribute('data-poster') || ('https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg');
    }

    function build(box) {
        var id = box.getAttribute('data-youtube') || '';
        var valid = ID_PATTERN.test(id);

        if (valid) {
            var poster = document.createElement('img');
            poster.className = 'yt-video-poster';
            poster.alt = '';
            poster.loading = 'lazy';
            poster.decoding = 'async';
            poster.draggable = false;
            /* Fehlt die HD-Version des YouTube-Bildes, die kleinere nehmen. */
            poster.addEventListener('error', function fallback() {
                poster.removeEventListener('error', fallback);
                poster.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
            });
            poster.src = posterSrc(box, id);
            box.appendChild(poster);
        } else {
            box.classList.add('is-empty');
        }

        var start = document.createElement('button');
        start.type = 'button';
        start.className = 'yt-video-start';
        start.innerHTML = '<span class="yt-play"></span>';
        if (valid) {
            start.setAttribute('aria-label', t('lightbox.playVideo', 'Video abspielen') + ': ' + titleOf(box));
            start.addEventListener('click', function () { play(box); });
        } else {
            start.disabled = true;
            start.tabIndex = -1;
            start.setAttribute('aria-hidden', 'true');
        }
        box.appendChild(start);
    }

    function play(box) {
        if (box.classList.contains('is-playing')) return;

        /* Immer nur ein Video: alle anderen zurück zum Vorschaubild. */
        Array.prototype.forEach.call(document.querySelectorAll('.yt-video.is-playing'), stop);

        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + encodeURIComponent(box.getAttribute('data-youtube')) +
            '?autoplay=1&rel=0&playsinline=1';
        iframe.title = titleOf(box);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        box.appendChild(iframe);
        box.classList.add('is-playing');
    }

    function stop(box) {
        var iframe = box.querySelector('iframe');
        if (iframe) iframe.remove();
        box.classList.remove('is-playing');
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('.yt-video[data-youtube]'), build);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
