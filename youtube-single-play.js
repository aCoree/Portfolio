/* =====================================================================
   YOUTUBE: IMMER NUR EIN VIDEO GLEICHZEITIG ABSPIELEN
   =====================================================================
   Einbindung: einfach diesen Link auf jeder Seite mit YouTube-Embeds
   ergänzen (Video-Iframes brauchen "?enablejsapi=1" in ihrer src, sonst
   kann dieses Skript sie nicht per postMessage steuern):

       <script src="youtube-single-play.js"></script>

   Nutzt die offizielle YouTube IFrame Player API: sobald ein Video zu
   spielen beginnt, werden alle anderen auf der Seite automatisch
   pausiert – sowohl am Desktop als auch mobil.
   ===================================================================== */

(function () {
    function init() {
        const iframes = Array.from(document.querySelectorAll('iframe[src*="youtube.com/embed"]'));
        if (!iframes.length) return;

        iframes.forEach((iframe, index) => {
            if (!iframe.id) iframe.id = 'yt-single-play-' + index;
        });

        function loadIframeApi() {
            return new Promise((resolve) => {
                if (window.YT && window.YT.Player) {
                    resolve(window.YT);
                    return;
                }
                const previousCallback = window.onYouTubeIframeAPIReady;
                window.onYouTubeIframeAPIReady = function () {
                    if (typeof previousCallback === 'function') previousCallback();
                    resolve(window.YT);
                };
                if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                    const tag = document.createElement('script');
                    tag.src = 'https://www.youtube.com/iframe_api';
                    document.head.appendChild(tag);
                }
            });
        }

        loadIframeApi().then((YT) => {
            const players = [];

            function pauseOthers(activePlayer) {
                players.forEach((player) => {
                    if (player === activePlayer || typeof player.pauseVideo !== 'function') return;
                    try {
                        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                            player.pauseVideo();
                        }
                    } catch (e) {
                        /* Player noch nicht bereit – ignorieren. */
                    }
                });
            }

            iframes.forEach((iframe) => {
                const player = new YT.Player(iframe.id, {
                    events: {
                        onStateChange: function (event) {
                            if (event.data === YT.PlayerState.PLAYING) {
                                pauseOthers(event.target);
                            }
                        }
                    }
                });
                players.push(player);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
