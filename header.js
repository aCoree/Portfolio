document.addEventListener("DOMContentLoaded", function() {

    // ─── 0. ÜBERSETZUNGS-HELFER (siehe translations.js/i18n.js) ───
    // header.js baut Navigation/Footer/Suche/Mobile-Menü direkt in der
    // aktuell aktiven Sprache auf (statt per data-i18n nachträglich zu
    // übersetzen) – ein Sprachwechsel lädt die Seite deshalb bewusst neu
    // (siehe i18n.js: setLanguage()), statt dieses ganze, zustandsbehaftete
    // System live umzubauen. t(key, fallback) liefert die Übersetzung für
    // den aktuellen Sprachstand oder – falls translations.js/i18n.js aus
    // irgendeinem Grund fehlen oder der Key (noch) nicht existiert – den
    // übergebenen deutschen Fallback-Text, damit die Seite nie ohne Text
    // dasteht.
    function t(key, fallback) {
        if (!key) return fallback;
        if (window.i18n && typeof window.i18n.translate === 'function') {
            const value = window.i18n.translate(key);
            if (value !== undefined) return value;
        }
        return fallback;
    }

    const currentLang = (window.i18n && window.i18n.getCurrentLanguage) ? window.i18n.getCurrentLanguage() : 'de';
    const SUPPORTED_LANGS = (window.i18n && window.i18n.SUPPORTED) ? window.i18n.SUPPORTED : ['de', 'fr', 'en', 'it'];

    // ─── 0b. LEGO FAMILY STUDIO: SEITENSPEZIFISCHE YOUTUBE-/LOGO-OVERRIDES ───
    // Nur auf lego.html (body.lego-family-studio) sollen Header/Footer zum
    // "Lego Family Studio"-Kanal + Lego-Logo verlinken, sonst überall zum
    // normalen Aurelio-Zingarello-Kanal/-Logo.
    const isLegoPage = document.body.classList.contains('lego-family-studio');
    const youtubeUrl = isLegoPage ? 'https://www.youtube.com/@legofamilystudio' : 'https://www.youtube.com/@aureliozingarello';
    const logoSrc = isLegoPage ? 'images/logo-wide-lego.png' : 'images/logo-wide.png';
    const logoAlt = isLegoPage ? 'Lego Family Studio Logo' : 'Aurelio Zingarello Logo';

    // ─── 1. DYNAMISCHE CSS STYLES (FOOTER & AUTOMATISCHER STICKY FOOTER) ───
    const dynamicStyle = document.createElement('style');
    dynamicStyle.textContent = `
        /* ─── AUTOMATISCHER STICKY FOOTER FÜR ALLE SEITEN ─── */
        html, body {
            min-height: 100vh !important;
        }
        body {
            display: flex !important;
            flex-direction: column !important;
            margin: 0;
        }

        /* ─── FOOTER STYLES (SCHIEBT SICH AUTOMATISCH NACH UNTEN) ─── */
        .site-footer {
            position: relative;
            margin-top: auto !important; /* DAS SCHIEBT DEN FOOTER AN DEN BODEN */
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 22px 24px;
            width: 100%;
            box-sizing: border-box;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(0, 0, 0, 0.3);
        }
        .site-footer .footer-left,
        .site-footer .footer-right {
            flex: 1;
            display: flex;
            align-items: center;
        }
        .site-footer .footer-left {
            justify-content: flex-start;
        }
        .site-footer .footer-right {
            justify-content: flex-end;
        }
        .site-footer .footer-center {
            flex: 0 0 auto;
            text-align: center;
            color: #888;
            font-size: 0.85rem;
            padding: 0 15px;
        }
        /* Sprachumschalter im Footer existiert als ZWEI Instanzen im Markup
           (siehe footerHTML weiter unten), von denen per Breakpoint jeweils
           nur eine sichtbar ist – so bleibt jede Variante ein einfacher,
           normaler Teil ihres jeweiligen Flex-Kontexts (keine berechnete
           Positionierung nötig):
           - .lang-switcher--footer-desktop sitzt verschachtelt in
             .footer-right, direkt vor dem YouTube-Icon (>888px).
           - .lang-switcher--footer-mobile ist ein eigenständiges Element in
             derselben Zeile wie Logo + Icon (<=888px), per space-between
             automatisch mittig zwischen den beiden. */
        .site-footer .footer-lang-mobile {
            display: none;
        }
        .lang-switcher--footer-desktop {
            margin-right: 54px; /* ursprünglich 18px, jetzt verdreifacht */
        }
        @media (max-width: 888px) {
            .site-footer {
                flex-wrap: wrap;
                row-gap: 16px;
                padding: 20px 20px;
            }
            .site-footer .footer-left {
                order: 1;
                flex: 0 0 auto;
            }
            .site-footer .footer-lang-mobile {
                display: flex;
                order: 2;
                flex: 0 0 auto;
            }
            .site-footer .footer-right {
                order: 3;
                flex: 0 0 auto;
            }
            .lang-switcher--footer-desktop {
                display: none;
            }
            .site-footer .footer-center {
                order: 4;
                flex: 0 0 100%;
                padding: 0;
                font-size: 0.78rem;
            }
        }
    `;
    document.head.appendChild(dynamicStyle);

    // ─── 2. NAVIGATIONS-DATENSTRUKTUR ───
    // Zentrales Format für JEDEN Navigationseintrag (Main Header & Second Header,
    // Desktop & Mobile): { label, href } für einen einfachen Link, oder
    // { label, children: [{label, href}, ...] } für einen Eintrag mit Untermenü,
    // optional zusätzlich mit href kombinierbar. Diese eine Struktur steuert
    // sowohl die Desktop-Hover-Erweiterung als auch die mehrstufige Mobile-
    // Navigation – keine doppelte Pflege nötig.

    // Main-Header-Navigation (site-weit, bewusst zentral hier definiert statt
    // pro Seite dupliziert, da auf jeder Seite identisch).
    const mainNavItems = [
        { label: t('nav.home', 'Home'), href: 'index.html#home' },
        {
            label: t('nav.projects', 'Projekte'),
            href: 'projekte.html',
            children: [
                { label: t('nav.projectsAll', 'Alle Projekte'), href: 'projekte.html', emphasize: true },
                { label: 'RUN', href: 'run.html' },
                { label: 'Musik', href: 'musik.html' },
                { label: 'DJI Air 3S', href: 'drone.html' },
                { label: 'URBNVIBE', href: 'urbnvibe.html' },
                { label: 'LEGO FAMILY STUDIO', href: 'lego.html' }
            ]
        },
        {
            label: t('nav.about', 'Über mich'),
            href: 'index.html#ueber-mich',
            // Zusätzliche, nicht sichtbare Suchbegriffe (siehe buildSearchIndex/
            // scoreSearchEntry) – erlaubt z.B. "Aurelio", "Beruf" oder
            // "Mediamatiker" als Treffer für diesen Eintrag, ohne dass diese
            // Wörter im Label selbst stehen müssen.
            keywords: 'Aurelio Zingarello Beruf Mediamatiker Lehrjahr Filmmaker Filmemacher Schweiz Design Webentwicklung Kurzfilm Storys'
        },
        { label: t('nav.contact', 'Kontakt'), href: 'index.html#kontakt' }
    ];

    // Second-Header-Konfiguration der Seite (optional, siehe einzelne HTML-Dateien).
    const secondHeaderItems = Array.isArray(window.secondHeaderItems) ? window.secondHeaderItems : [];
    const hasSecondHeader = secondHeaderItems.length > 0;

    if (hasSecondHeader) {
        document.body.classList.add('has-second-header');
    }

    function hasChildren(item) {
        return Array.isArray(item.children) && item.children.length > 0;
    }

    // ─── ZENTRALER SUCH-INDEX (SEITENTITEL, PROJEKTE, NAVIGATION, UNTERSEITEN) ───
    // Baut sich in erster Linie aus der bereits vorhandenen zentralen
    // Navigations-Datenstruktur (mainNavItems) sowie den Second-Header-
    // Einträgen DIESER Seite (window.secondHeaderItems) auf – keine
    // doppelte Pflege der Haupt-Navigation nötig. Untermenü-/Video-
    // Einträge ANDERER Projektseiten sind zur Laufzeit auf dieser Seite
    // nicht verfügbar (jede Seite bringt nur ihre eigenen
    // window.secondHeaderItems mit, es gibt keinen Build-Schritt, der sie
    // vorab zusammenführen könnte). Diese kleine, bewusst zentrale Liste
    // spiegelt deshalb die jeweilige Seiten-Konfiguration, damit die Suche
    // auch von ANDEREN Seiten aus zu Unterseiten/Second-Header-Einträgen
    // führt. Bei Änderungen an den echten secondHeaderItems einer Seite
    // bitte diese Liste hier synchron halten.
    // Übersetzbare Kategorie-/Abschnittslabels werden über t() aufgelöst;
    // Eigennamen (Songtitel, Ortsnamen, Projektnamen wie "RUN"/"URBNVIBE")
    // bleiben bewusst unübersetzt (siehe Kommentar oben in translations.js).
    const runLabel = t('run.navBts', 'Behind the Scenes');
    const musikIntroLabel = t('musik.navIntro', 'Leidenschaft am Klavier');
    const musikVideosLabel = t('musik.navVideos', 'Klavier Videos');
    const droneVideosLabel = t('drone.navVideos', 'Drohnen Videos');
    const urbnvibeAboutLabel = t('urbnvibe.navAbout', 'Über URBNVIBE');
    const urbnvibeWorkLabel = t('urbnvibe.navWork', 'Arbeiten');
    const legoAboutLabel = t('lego.navAbout', 'Über den Kanal');
    const legoVideosLabel = t('lego.navVideos', 'Stop-Motion Videos');
    const legalLabel = t('nav.categoryLegal', 'Rechtliches');

    const crossPageSearchSections = [
        { label: t('run.navTrailer', 'Trailer'), href: 'run.html#trailer', category: 'RUN' },
        { label: t('run.navWholeFilm', 'Ganzer Film'), href: 'run.html#content', category: 'RUN' },
        { label: runLabel, href: 'bts.html', category: 'RUN', keywords: 'BTS' },
        { label: t('run.navGrading', 'Color Grading'), href: 'run.html#grading', category: 'RUN' },

        { label: musikIntroLabel, href: 'musik.html#musik-intro', category: 'Musik' },
        { label: musikVideosLabel, href: 'musik.html#song-force-theme', category: 'Musik' },
        { label: 'The Force Theme', href: 'musik.html#song-force-theme', category: musikVideosLabel },
        { label: 'Time - Inception', href: 'musik.html#song-inception', category: musikVideosLabel },
        { label: 'Interstellar', href: 'musik.html#song-interstellar', category: musikVideosLabel },
        { label: 'Pirates of the Caribbean', href: 'musik.html#song-pirates', category: musikVideosLabel },
        { label: 'Avengers Main Theme', href: 'musik.html#song-avengers', category: musikVideosLabel },
        { label: 'Top Gun: Maverick', href: 'musik.html#song-topgun', category: musikVideosLabel },
        { label: 'Victory', href: 'musik.html#song-victory', category: musikVideosLabel },
        { label: 'Wildflower', href: 'musik.html#song-wildflower', category: musikVideosLabel },
        { label: 'No Time To Die', href: 'musik.html#song-notimetodie', category: musikVideosLabel },
        { label: 'Experience', href: 'musik.html#song-experience', category: musikVideosLabel },
        { label: 'Sadness and Sorrow', href: 'musik.html#song-sadnessandsorrow', category: musikVideosLabel },
        { label: 'F1 - Main Theme', href: 'musik.html#song-f1', category: musikVideosLabel },
        { label: 'Remember - The Lion King', href: 'musik.html#song-remember', category: musikVideosLabel },
        { label: 'Bohemian Rhapsody', href: 'musik.html#song-bohemianrhapsody', category: musikVideosLabel },

        { label: droneVideosLabel, href: 'drone.html#video-muenchenbuchsee', category: 'DJI Air 3S' },
        { label: 'Münchenbuchsee', href: 'drone.html#video-muenchenbuchsee', category: droneVideosLabel },
        { label: 'Finsterhennen', href: 'drone.html#video-finsterhennen', category: droneVideosLabel },
        { label: 'Kerzers', href: 'drone.html#video-kerzers', category: droneVideosLabel },
        { label: 'Gümmenen', href: 'drone.html#video-guemmenen', category: droneVideosLabel },

        { label: urbnvibeAboutLabel, href: 'urbnvibe.html#intro-section', category: 'URBNVIBE' },
        { label: urbnvibeWorkLabel, href: 'urbnvibe.html#flyer-section', category: 'URBNVIBE' },
        { label: t('urbnvibe.navFlyer', 'Flyer'), href: 'urbnvibe.html#flyer-section', category: urbnvibeWorkLabel },
        { label: t('urbnvibe.navLogo', 'Logo'), href: 'urbnvibe.html#logo-section', category: urbnvibeWorkLabel },
        { label: t('urbnvibe.navAwareness', 'Awareness Video'), href: 'urbnvibe.html#awareness-video-section', category: urbnvibeWorkLabel },
        { label: t('urbnvibe.navCreatives', 'Creatives'), href: 'urbnvibe.html#creatives-section', category: urbnvibeWorkLabel },

        { label: legoAboutLabel, href: 'lego.html#content', category: 'LEGO FAMILY STUDIO' },
        { label: legoVideosLabel, href: 'lego.html#lego-video-corona', category: 'LEGO FAMILY STUDIO' },
        { label: 'Corona LEGO Time', href: 'lego.html#lego-video-corona', category: legoVideosLabel },
        { label: 'LEGO Street Race', href: 'lego.html#lego-video-street-race', category: legoVideosLabel },
        { label: 'LEGO Hairdresser', href: 'lego.html#lego-video-hairdresser', category: legoVideosLabel },

        { label: t('footer.impressum', 'Impressum'), href: 'impressum.html', category: legalLabel },
        { label: t('footer.datenschutz', 'Datenschutz'), href: 'datenschutz.html', category: legalLabel }
    ];

    const currentPageFile = window.location.pathname.split('/').pop() || 'index.html';

    // Wandelt seiteneigene "#anchor"-Hrefs (wie sie window.secondHeaderItems
    // pro Seite verwendet) in vollqualifizierte Links um, damit Suchtreffer
    // von JEDER Seite aus funktionieren und sich sauber mit
    // crossPageSearchSections deduplizieren lassen.
    function normalizeHref(href) {
        return href.charAt(0) === '#' ? currentPageFile + href : href;
    }

    function buildSearchIndex() {
        const index = [];
        const seen = new Set();

        function addEntry(label, href, category, keywords) {
            if (!label || !href) return;
            const key = label.toLowerCase() + '|' + href;
            if (seen.has(key)) return;
            seen.add(key);
            index.push({ label: label, href: href, category: category || '', keywords: (keywords || '').toLowerCase() });
        }

        mainNavItems.forEach(item => {
            if (item.href) addEntry(item.label, item.href, t('nav.categoryNavigation', 'Navigation'), item.keywords);
            if (hasChildren(item)) {
                item.children.forEach(child => addEntry(child.label, child.href, item.label, child.keywords));
            }
        });

        // Second-Header-Einträge DIESER Seite: direkt aus window.secondHeaderItems,
        // damit die Suche immer den aktuellsten Stand der Seite widerspiegelt.
        secondHeaderItems.forEach(item => {
            if (item.href) addEntry(item.label, normalizeHref(item.href), t('nav.categoryOnThisPage', 'Auf dieser Seite'));
            if (hasChildren(item)) {
                item.children.forEach(child => addEntry(child.label, normalizeHref(child.href), item.label));
            }
        });

        crossPageSearchSections.forEach(entry => addEntry(entry.label, entry.href, entry.category));

        return index;
    }

    const siteSearchIndex = buildSearchIndex();

    function scoreSearchEntry(entry, query) {
        const label = entry.label.toLowerCase();
        const category = entry.category.toLowerCase();
        if (label.startsWith(query)) return 0;
        if (label.includes(query)) return 1;
        // Unsichtbare Zusatzbegriffe (siehe z.B. "Über mich" in mainNavItems) –
        // erlauben Treffer über Inhalt/Kontext statt nur über den sichtbaren
        // Linktext, z.B. "Aurelio" oder "Mediamatiker" -> "Über mich".
        if (entry.keywords && entry.keywords.includes(query)) return 2;
        if (category.includes(query)) return 3;
        return -1;
    }

    function searchSite(query) {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return siteSearchIndex
            .map(entry => ({ entry: entry, score: scoreSearchEntry(entry, q) }))
            .filter(result => result.score >= 0)
            .sort((a, b) => a.score - b.score || a.entry.label.localeCompare(b.entry.label))
            .slice(0, 8)
            .map(result => result.entry);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    // ─── 3. MAIN NAV (DESKTOP): "PROJEKTE" MIT UNTERMENÜ ───
    function buildMainNavHTML() {
        return mainNavItems.map((item, index) => {
            if (hasChildren(item)) {
                return `<div class="nav-item has-submenu" data-nav-trigger data-nav-index="${index}">
                    <a href="${item.href}">${item.label} <i class="fa-solid fa-chevron-down nav-caret"></i></a>
                </div>`;
            }
            return `<a href="${item.href}">${item.label}</a>`;
        }).join('');
    }

    // ─── 4. SECOND HEADER (DESKTOP): LEISTE MIT TRIGGERN FÜR DIE HEADER-ERWEITERUNG ───
    function buildSecondNavbarHTML() {
        if (!hasSecondHeader) return '';

        const itemsHTML = secondHeaderItems.map((item, index) => {
            if (hasChildren(item)) {
                const triggerHTML = item.href
                    ? `<a href="${item.href}" class="second-navbar-link" aria-haspopup="true">${item.label} <i class="fa-solid fa-chevron-down second-navbar-caret"></i></a>`
                    : `<button type="button" class="second-navbar-link" aria-haspopup="true">${item.label} <i class="fa-solid fa-chevron-down second-navbar-caret"></i></button>`;

                return `<div class="second-navbar-item has-submenu" data-nav-trigger data-nav-index="${index}">${triggerHTML}</div>`;
            }

            return `<div class="second-navbar-item"><a href="${item.href || '#'}" class="second-navbar-link">${item.label}</a></div>`;
        }).join('');

        return `
        <!-- ─── SECOND HEADER ─── -->
        <nav class="second-navbar">
            <div class="second-navbar-inner">${itemsHTML}</div>
        </nav>
        <div class="nav-expand" id="secondNavExpand">
            <div class="nav-expand-inner" id="secondNavExpandInner"></div>
        </div>`;
    }

    // ─── 5. HEADER-GRUPPE (MAIN HEADER + OPTIONALER SECOND HEADER) & MOBILE MENU HTML ───
    const headerGroupHTML = `
    <!-- ─── HEADER-GRUPPE: STICKY-WRAPPER FÜR MAIN HEADER + SECOND HEADER ─── -->
    <div class="header-group" id="headerGroup">
        <!-- ─── NAVIGATIONBAR ─── -->
        <header class="navbar">
            <div class="nav-left">
                <a href="index.html#home" class="logo" id="navLogo">
                    <span class="logo-mark">
                        <img src="${logoSrc}" alt="${logoAlt}">
                    </span>
                </a>
                <!-- Ersetzt das Logo auf tieferen Mobile-Menü-Ebenen (siehe JS) -->
                <button type="button" class="mobile-back-arrow" id="mobileBackArrow" aria-label="${t('nav.ariaBack', 'Eine Ebene zurück')}">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
            </div>

            <nav class="nav-center">${buildMainNavHTML()}</nav>

            <div class="nav-right">
                <button type="button" class="nav-search-toggle" id="navSearchToggleDesktop" aria-label="${t('nav.ariaSearchOpen', 'Suche öffnen')}" aria-expanded="false">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
                <a href="${youtubeUrl}" target="_blank" class="social-icon"><i class="fa-brands fa-youtube"></i></a>
            </div>

            <!-- Lupe direkt neben dem Hamburger (nur Mobile, siehe header.css). -->
            <button type="button" class="nav-search-toggle nav-search-toggle--mobile" id="navSearchToggleMobile" aria-label="${t('nav.ariaSearchOpen', 'Suche öffnen')}" aria-expanded="false">
                <i class="fa-solid fa-magnifying-glass"></i>
            </button>

            <!-- Hamburger Button (nur Mobile) -->
            <button class="hamburger" id="hamburger" aria-label="${t('nav.ariaMenuOpen', 'Menü öffnen')}">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </header>

        <!-- Erweiterungsfläche für das "Projekte"-Untermenü: derselbe Header wächst
             hier nach unten, statt ein separates Popup zu öffnen. -->
        <div class="nav-expand" id="mainNavExpand">
            <div class="nav-expand-inner" id="mainNavExpandInner"></div>
        </div>

        <!-- Such-Panel: nutzt dieselbe nav-expand-Mechanik wie das Projekte-
             Untermenü (siehe header.css), damit sich die Suche optisch nahtlos
             in den Header einfügt. Wird sowohl von der Desktop- als auch von
             der Mobile-Lupe geöffnet. -->
        <div class="nav-expand" id="navSearchExpand">
            <div class="nav-expand-inner nav-search-inner" id="navSearchInner">
                <div class="nav-search-field">
                    <i class="fa-solid fa-magnifying-glass nav-search-field-icon"></i>
                    <input type="text" id="navSearchInput" class="nav-search-input" placeholder="${t('search.placeholder', 'Seiten &amp; Projekte durchsuchen…')}" autocomplete="off" aria-label="${t('search.placeholder', 'Seiten und Projekte durchsuchen')}">
                    <button type="button" class="nav-search-clear" id="navSearchClear" aria-label="${t('nav.ariaSearchClose', 'Suche schließen')}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="nav-search-divider"></div>
                <div class="nav-search-results" id="navSearchResults"></div>
            </div>
        </div>

        ${buildSecondNavbarHTML()}
    </div>

    <!-- Apple-artiger Hintergrund-Backdrop hinter geöffneten Submenus/der Suche.
         Bewusst AUSSERHALB von .header-group (siehe header.css: will-change auf
         .header-group würde sonst den Containing Block für dieses fixed-
         positionierte Element verändern). -->
    <div class="nav-backdrop" id="navBackdrop"></div>

    <!-- Mobile Menu Overlay: Inhalt wird von renderMobileLevel() dynamisch befüllt -->
    <div class="mobile-menu" id="mobileMenu">
        <div class="mobile-menu-levels" id="mobileMenuLevels"></div>
    </div>
    `;

    // ─── 6. SPRACHUMSCHALTER (DE/FR/EN/IT) ───
    // Ein und dieselbe kleine Pillen-Reihe wird sowohl im Footer (jede
    // Seite, Desktop UND Mobile) als auch in der obersten Ebene des
    // Mobile-Menüs eingesetzt (siehe buildLevelHTML) – nur mit jeweils
    // einer zusätzlichen Klasse für den Kontext. Der Klick selbst
    // passiert über Event-Delegation weiter unten (ein Listener pro
    // vorkommender .lang-switcher-Instanz), da mehrere Instanzen auf
    // derselben Seite existieren können.
    const LANG_LABELS = { de: 'DE', fr: 'FR', en: 'EN', it: 'IT' };

    function buildLangSwitcherHTML(extraClass) {
        const buttons = SUPPORTED_LANGS.map(code => {
            const activeClass = code === currentLang ? ' is-active' : '';
            return `<button type="button" class="lang-switcher-btn${activeClass}" data-lang="${code}">${LANG_LABELS[code] || code.toUpperCase()}</button>`;
        }).join('');
        return `<div class="lang-switcher${extraClass ? ' ' + extraClass : ''}" role="group" aria-label="${t('lang.ariaLabel', 'Sprache wählen')}">${buttons}</div>`;
    }

    function wireLangSwitchers(root) {
        (root || document).querySelectorAll('.lang-switcher-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.i18n) window.i18n.setLanguage(btn.dataset.lang);
            });
        });
    }

    // ─── 7. ORIGINAL FOOTER HTML ───
    const footerHTML = `
    <!-- ─── FOOTER ─── -->
    <footer class="site-footer">
        <div class="footer-left">
            <a href="index.html#home" class="logo">
                <span class="logo-mark">
                    <img src="${logoSrc}" alt="${logoAlt}">
                </span>
            </a>
        </div>
        <div class="footer-lang-mobile">
            ${buildLangSwitcherHTML('lang-switcher--footer-mobile')}
        </div>
        <div class="footer-center">
            <p style="margin: 0;">${t('footer.copyright', '© {year} Aurelio Zingarello. Alle Rechte vorbehalten.').replace('{year}', new Date().getFullYear())}</p>
            <div style="margin-top: 6px; font-size: 0.8rem;">
                <a href="impressum.html" style="color: #888; text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">${t('footer.impressum', 'Impressum')}</a>
                <span style="color: #555; margin: 0 6px;">·</span>
                <a href="datenschutz.html" style="color: #888; text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">${t('footer.datenschutz', 'Datenschutz')}</a>
            </div>
        </div>
        <div class="footer-right">
            ${buildLangSwitcherHTML('lang-switcher--footer-desktop')}
            <a href="${youtubeUrl}" target="_blank" class="social-icon" style="margin-right: 2px;"><i class="fa-brands fa-youtube"></i></a>
        </div>
    </footer>
    `;

    // ─── 8. ELEMENTE IN DEN DOM EINFÜGEN ───
    document.body.insertAdjacentHTML('afterbegin', headerGroupHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    wireLangSwitchers(document.querySelector('.site-footer'));

    // ─── 9. APPLE-ARTIGER HINTERGRUND-BACKDROP + GEMEINSAME PANEL-VERWALTUNG ───
    // Ein einzelnes, wiederverwendetes Backdrop-Element wird von mehreren
    // "Panels" geteilt (Main-Header-Untermenü, Second-Header-Untermenü,
    // Such-Panel). Ein einfacher Referenzzähler (statt eines simplen
    // Booleans) verhindert, dass ein Panel das Backdrop wegnimmt, während
    // ein anderes es eigentlich noch braucht. panelRegistry sorgt zusätzlich
    // dafür, dass immer nur EIN Panel gleichzeitig offen ist: sobald eines
    // öffnet, schliesst es automatisch alle anderen (z.B. Suche öffnen
    // schliesst ein offenes "Projekte"-Untermenü und umgekehrt).
    const navBackdrop = document.getElementById('navBackdrop');
    const headerGroup = document.getElementById('headerGroup');
    const openBackdropOwners = new Set();

    // Header + Second Header + Untermenü-/Such-Erweiterung sind immer voll
    // deckend (siehe --header-surface in header.css). Auf Video-Hero-Seiten
    // (body.transparent-header) ist der Header sonst transparent – die
    // Klasse .has-open-panel schaltet ihn dort NUR während ein Panel offen
    // ist zusätzlich auf die deckende Farbe um (siehe header.css), damit
    // niemals Seiteninhalt durch das geöffnete Menü hindurchscheint.
    function updateHeaderGroupPanelState() {
        if (headerGroup) headerGroup.classList.toggle('has-open-panel', openBackdropOwners.size > 0);
    }

    function showBackdrop(ownerId) {
        if (!navBackdrop) return;
        openBackdropOwners.add(ownerId);
        navBackdrop.classList.add('is-open');
        updateHeaderGroupPanelState();
    }

    function hideBackdrop(ownerId) {
        if (!navBackdrop) return;
        openBackdropOwners.delete(ownerId);
        if (openBackdropOwners.size === 0) navBackdrop.classList.remove('is-open');
        updateHeaderGroupPanelState();
    }

    const panelClosers = [];

    function registerPanelCloser(fn) {
        panelClosers.push(fn);
    }

    function closeOtherPanels(exceptFn) {
        panelClosers.forEach(fn => {
            if (fn !== exceptFn) fn();
        });
    }

    if (navBackdrop) {
        navBackdrop.addEventListener('click', () => closeOtherPanels(null));
    }

    // ─── 10. DESKTOP: HEADER-ERWEITERUNG BEI HOVER (PROJEKTE & SECOND-HEADER-EINTRÄGE) ───
    // Eine generische Steuerung für beide Stellen: Hover/Fokus auf einen Trigger
    // füllt die zugehörige Erweiterungsfläche mit den Kind-Links und lässt den
    // Header (dieselbe Hintergrundfläche) dafür nach unten wachsen. Synchron
    // dazu wird (über showBackdrop/hideBackdrop) der Hintergrund-Backdrop
    // ein-/ausgeblendet – beide Zustände werden hier an genau derselben
    // Stelle (openFor / die Close-Funktion) gemeinsam umgeschaltet, laufen
    // dadurch garantiert synchron.
    function setupSubmenuController(navRootEl, expandEl, expandInnerEl, itemsArray, options) {
        if (!navRootEl || !expandEl || !expandInnerEl) return;
        options = options || {};
        const secondNavbarEl = options.hideSecondNavbar ? document.querySelector('.second-navbar') : null;
        const backdropId = options.backdropId;

        let closeTimer = null;
        let activeTrigger = null;

        function openFor(triggerEl, item) {
            clearTimeout(closeTimer);
            closeOtherPanels(forceClose);
            if (activeTrigger && activeTrigger !== triggerEl) {
                activeTrigger.classList.remove('is-open');
            }
            activeTrigger = triggerEl;
            triggerEl.classList.add('is-open');
            expandInnerEl.innerHTML = item.children
                .map(child => `<a href="${child.href}" class="nav-expand-link${child.emphasize ? ' nav-expand-link--emphasize' : ''}">${child.label}</a>`)
                .join('');

            // Untermenü linksbündig direkt unter dem jeweiligen Trigger beginnen
            // lassen, statt es über die volle Header-Breite zu zentrieren.
            const triggerRect = triggerEl.getBoundingClientRect();
            const expandRect = expandEl.getBoundingClientRect();
            expandInnerEl.style.paddingLeft = Math.max(0, triggerRect.left - expandRect.left) + 'px';

            expandEl.classList.add('is-open');
            if (secondNavbarEl) secondNavbarEl.classList.add('is-hidden-by-submenu');
            if (backdropId) showBackdrop(backdropId);
        }

        function forceClose() {
            clearTimeout(closeTimer);
            expandEl.classList.remove('is-open');
            if (secondNavbarEl) secondNavbarEl.classList.remove('is-hidden-by-submenu');
            if (activeTrigger) {
                activeTrigger.classList.remove('is-open');
                activeTrigger = null;
            }
            if (backdropId) hideBackdrop(backdropId);
        }

        function scheduleClose() {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(forceClose, 150);
        }

        function cancelClose() {
            clearTimeout(closeTimer);
        }

        registerPanelCloser(forceClose);

        navRootEl.querySelectorAll('[data-nav-trigger]').forEach(trigger => {
            const item = itemsArray[Number(trigger.dataset.navIndex)];
            if (!item || !hasChildren(item)) return;

            trigger.addEventListener('mouseenter', () => openFor(trigger, item));
            trigger.addEventListener('mouseleave', scheduleClose);
            trigger.addEventListener('focusin', () => openFor(trigger, item));
            trigger.addEventListener('focusout', scheduleClose);
        });

        expandEl.addEventListener('mouseenter', cancelClose);
        expandEl.addEventListener('mouseleave', scheduleClose);
        expandEl.addEventListener('focusin', cancelClose);
        expandEl.addEventListener('focusout', scheduleClose);
    }

    // Nur das Main-Header-Untermenü blendet den Second Header aus (falls
    // vorhanden), solange es geöffnet ist – funktioniert automatisch für
    // jeden künftigen Main-Nav-Eintrag mit Untermenü, ohne Sonderfall.
    setupSubmenuController(
        document.querySelector('.nav-center'),
        document.getElementById('mainNavExpand'),
        document.getElementById('mainNavExpandInner'),
        mainNavItems,
        { hideSecondNavbar: true, backdropId: 'main-submenu' }
    );

    setupSubmenuController(
        document.querySelector('.second-navbar-inner'),
        document.getElementById('secondNavExpand'),
        document.getElementById('secondNavExpandInner'),
        secondHeaderItems,
        { backdropId: 'second-submenu' }
    );

    // ─── 11. SUCH-ERGEBNIS-RENDERING (GEMEINSAM FÜR DESKTOP + MOBILE) ───
    // Baut nur das HTML/den Ziel-Zustand (ob überhaupt etwas angezeigt
    // werden soll) – wird sowohl von der einfachen (Mobile) als auch der
    // animierten (Desktop, siehe animateSearchResultsInto) Variante
    // genutzt, keine doppelte Render-Logik.
    // Hebt den eingegebenen Suchbegriff INNERHALB des Labels optisch hervor
    // (z.B. "jekt" in "Projekte"), statt das Label nur unverändert
    // anzuzeigen – macht auf einen Blick klar, WARUM ein Ergebnis getroffen
    // hat. Kommt ein Treffer nur über Kategorie/Keywords zustande (das
    // Label selbst enthält den Begriff nicht), bleibt das Label schlicht
    // unhervorgehoben.
    function highlightMatch(label, query) {
        if (!query) return escapeHTML(label);
        const matchIndex = label.toLowerCase().indexOf(query.toLowerCase());
        if (matchIndex === -1) return escapeHTML(label);
        const before = label.slice(0, matchIndex);
        const match = label.slice(matchIndex, matchIndex + query.length);
        const after = label.slice(matchIndex + query.length);
        return `${escapeHTML(before)}<mark class="nav-search-highlight">${escapeHTML(match)}</mark>${escapeHTML(after)}`;
    }

    function buildSearchResultsMarkup(entries, query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return { html: '', shouldShow: false };
        if (!entries.length) {
            const noResultsText = t('search.noResults', 'Keine Treffer für „{query}“.').replace('{query}', escapeHTML(trimmedQuery));
            return {
                html: `<p class="nav-search-empty">${noResultsText}</p>`,
                shouldShow: true
            };
        }
        const html = entries.map(entry => `
            <a href="${entry.href}" class="nav-search-result">
                <span class="nav-search-result-label">${highlightMatch(entry.label, trimmedQuery)}</span>
                ${entry.category ? `<span class="nav-search-result-category">${escapeHTML(entry.category)}</span>` : ''}
            </a>
        `).join('');
        return { html, shouldShow: true };
    }

    // Einfache, instante Variante (bisheriges Verhalten) – genutzt vom
    // Mobile-Such-Panel, das ohnehin bereits innerhalb des scrollbaren
    // .mobile-menu-Overlays sitzt und keine eigene Höhen-Animation braucht.
    function renderSearchResultsInto(container, entries, query) {
        if (!container) return;
        const { html, shouldShow } = buildSearchResultsMarkup(entries, query);
        container.innerHTML = html;
        container.classList.toggle('has-results', shouldShow);
    }

    // Desktop-Variante: animiert JEDE Inhaltsänderung über die tatsächliche
    // Höhe (nicht nur das erste Öffnen mit leerem Feld) – Tippen, Löschen
    // oder ein Wechsel auf "keine Treffer" liefen vorher instant/sprunghaft,
    // weil .has-results (und damit die max-height-Transition in header.css)
    // nur beim ERSTEN Anzeigen/kompletten Leeren umgeschaltet wurde, nicht
    // bei einer Änderung INNERHALB des offenen Zustands. Hier wird die
    // Höhe stattdessen bei jeder Änderung explizit von der alten auf die
    // neue Content-Höhe animiert (klassische FLIP-Technik): alte Höhe
    // messen + fixieren + Reflow erzwingen, DANN erst den Inhalt
    // austauschen (nicht umgekehrt!) -> neue Höhe messen -> übergehen,
    // damit die CSS-Transition auf max-height (siehe .nav-search-results
    // in header.css) greift. Wichtig: das Fixieren MUSS vor dem
    // Inhaltswechsel passieren – sonst hat der Browser beim Locken schon
    // die neue (oft kürzere) Content-Höhe und es gibt nichts mehr, wovon
    // aus animiert werden könnte (z.B. beim Wechsel von "5 Treffer" zu
    // "AX – keine Treffer": beides shouldShow=true, aber deutlich
    // unterschiedliche Höhe).
    function animateSearchResultsInto(container, entries, query) {
        if (!container) return;
        const { html, shouldShow } = buildSearchResultsMarkup(entries, query);

        // 1. Alte Höhe fixieren, BEVOR der Inhalt sich ändert.
        const fromHeight = container.getBoundingClientRect().height;
        container.style.maxHeight = fromHeight + 'px';
        container.style.opacity = container.classList.contains('has-results') ? '1' : '0';
        void container.offsetHeight; // Reflow erzwingen

        // 2. Erst jetzt den Inhalt austauschen. Beim Schließen
        // (shouldShow=false) bewusst NICHT leeren – der bisherige Inhalt
        // bleibt sichtbar, während die Box kollabiert (siehe
        // transitionend-Listener unten), statt dass nur eine bereits
        // leere Fläche schrumpft.
        if (shouldShow) container.innerHTML = html;
        const targetHeight = shouldShow ? Math.min(container.scrollHeight, 320) : 0;

        // 3. Auf die neue Ziel-Höhe übergehen -> löst die Transition aus.
        container.classList.toggle('has-results', shouldShow);
        container.style.maxHeight = targetHeight + 'px';
        container.style.opacity = shouldShow ? '1' : '0';

        if (!shouldShow) {
            // Alten Inhalt erst entfernen, wenn die Höhen-Transition
            // wirklich vorbei ist: transitionend ist die exakte Quelle,
            // dazu ein Timeout als Sicherheitsnetz (z.B. falls der Tab im
            // Hintergrund läuft und CSS-Transitions/transitionend gedrosselt
            // werden) – was zuerst feuert, räumt auf.
            window.clearTimeout(container._collapseFallbackTimer);
            const cleanup = () => {
                container.removeEventListener('transitionend', onCollapseDone);
                window.clearTimeout(container._collapseFallbackTimer);
                if (!container.classList.contains('has-results')) container.innerHTML = '';
            };
            const onCollapseDone = (e) => {
                if (e.target !== container || e.propertyName !== 'max-height') return;
                cleanup();
            };
            container.addEventListener('transitionend', onCollapseDone);
            container._collapseFallbackTimer = window.setTimeout(cleanup, 400);
        }
    }

    // ─── 12. DESKTOP-SUCHFUNKTION ───
    // Nutzt dieselbe nav-expand-Wachstumsmechanik + denselben Backdrop wie
    // die Untermenüs oben (siehe panelRegistry), ist aber klick- statt
    // hover-gesteuert und bleibt offen, bis sie explizit geschlossen wird.
    // Nur die Desktop-Lupe (#navSearchToggleDesktop) steuert dieses Panel –
    // die Mobile-Lupe verwendet stattdessen das Mobile-Menu-Overlay direkt
    // (siehe Abschnitt 12), kein zweites Such-System.
    const navSearchExpand = document.getElementById('navSearchExpand');
    const navSearchInput = document.getElementById('navSearchInput');
    const navSearchResults = document.getElementById('navSearchResults');
    const navSearchClear = document.getElementById('navSearchClear');
    const navSearchToggleDesktop = document.getElementById('navSearchToggleDesktop');
    const searchSecondNavbarEl = document.querySelector('.second-navbar');

    let searchOpen = false;

    function setDesktopSearchToggleState(isOpen) {
        if (!navSearchToggleDesktop) return;
        navSearchToggleDesktop.classList.toggle('is-active', isOpen);
        navSearchToggleDesktop.setAttribute('aria-expanded', String(isOpen));
    }

    function forceCloseSearch() {
        if (!searchOpen || !navSearchExpand) return;
        searchOpen = false;
        navSearchExpand.classList.remove('is-open');
        if (searchSecondNavbarEl) searchSecondNavbarEl.classList.remove('is-hidden-by-submenu');
        hideBackdrop('search');
        setDesktopSearchToggleState(false);
        if (navSearchInput) navSearchInput.value = '';
        renderSearchResultsInto(navSearchResults, [], '');
    }

    function openSearchPanel() {
        if (!navSearchExpand || searchOpen) return;
        closeOtherPanels(forceCloseSearch);
        searchOpen = true;
        navSearchExpand.classList.add('is-open');
        if (searchSecondNavbarEl) searchSecondNavbarEl.classList.add('is-hidden-by-submenu');
        showBackdrop('search');
        setDesktopSearchToggleState(true);
        window.requestAnimationFrame(() => {
            if (navSearchInput) navSearchInput.focus();
        });
    }

    function toggleSearchPanel() {
        if (searchOpen) forceCloseSearch();
        else openSearchPanel();
    }

    registerPanelCloser(forceCloseSearch);

    if (navSearchToggleDesktop) {
        navSearchToggleDesktop.addEventListener('click', toggleSearchPanel);
    }

    if (navSearchClear) {
        navSearchClear.addEventListener('click', forceCloseSearch);
    }

    if (navSearchInput) {
        navSearchInput.addEventListener('input', () => {
            const query = navSearchInput.value;
            animateSearchResultsInto(navSearchResults, searchSite(query), query);
        });

        navSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                forceCloseSearch();
            } else if (e.key === 'Enter') {
                const firstResult = navSearchResults && navSearchResults.querySelector('.nav-search-result');
                if (firstResult) firstResult.click();
            }
        });
    }

    if (navSearchResults) {
        navSearchResults.addEventListener('click', (e) => {
            if (e.target.closest('.nav-search-result')) forceCloseSearch();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOpen) forceCloseSearch();
    });

    // ─── 13. MOBILE MENÜ: HAMBURGER + MEHRSTUFIGE NAVIGATION MIT ZURÜCK-PFEIL ───
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuLevels = document.getElementById('mobileMenuLevels');
    const mobileBackArrow = document.getElementById('mobileBackArrow');

    // navStack[0] ist immer die oberste Ebene (Main Links + Second-Header-Einträge).
    // Jeder Drill-down (Klick auf einen Eintrag mit Untermenü) legt eine weitere
    // Ebene oben drauf; der Zurück-Pfeil nimmt sie wieder herunter. Funktioniert
    // unabhängig davon, ob der Eintrag aus mainNavItems oder secondHeaderItems
    // stammt, und für beliebig viele Ebenen.
    let navStack = [];

    function topLevel() {
        return { items: secondHeaderItems, isTop: true };
    }

    function updateSubLevelState() {
        document.body.classList.toggle('mobile-submenu-open', navStack.length > 1);
    }

    function buildLevelHTML(level) {
        const mainLinksHTML = level.isTop
            ? `<nav class="mobile-nav">${mainNavItems.map((item, index) => {
                if (hasChildren(item)) {
                    return `<button type="button" class="mobile-nav-link mobile-nav-drill" data-main-index="${index}"><span>${item.label}</span><i class="fa-solid fa-chevron-right"></i></button>`;
                }
                return `<a href="${item.href}" class="mobile-nav-link">${item.label}</a>`;
            }).join('')}</nav>`
            : '';

        const itemLinksHTML = level.items.map((item, index) => {
            if (hasChildren(item)) {
                return `<button type="button" class="mobile-nav-link mobile-nav-drill" data-child-index="${index}"><span>${item.label}</span><i class="fa-solid fa-chevron-right"></i></button>`;
            }
            const emphasizeClass = item.emphasize ? ' mobile-nav-link--emphasize' : '';
            return `<a href="${item.href || '#'}" class="mobile-nav-link${emphasizeClass}">${item.label}</a>`;
        }).join('');

        const itemsNavHTML = level.items.length
            ? `<nav class="${level.isTop ? 'mobile-second-nav' : 'mobile-nav'}">${itemLinksHTML}</nav>`
            : '';

        const socialHTML = level.isTop
            ? `<div class="mobile-social"><a href="${youtubeUrl}" target="_blank" class="social-icon"><i class="fa-brands fa-youtube"></i></a></div>`
            : '';

        const langSwitcherHTML = level.isTop ? buildLangSwitcherHTML('lang-switcher--mobile-menu') : '';

        return `${mainLinksHTML}${itemsNavHTML}${socialHTML}${langSwitcherHTML}`;
    }

    function attachLevelHandlers(level, panelEl) {
        panelEl.querySelectorAll('.mobile-nav-drill[data-main-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = mainNavItems[Number(btn.dataset.mainIndex)];
                goForward(item.children);
            });
        });

        panelEl.querySelectorAll('.mobile-nav-drill[data-child-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = level.items[Number(btn.dataset.childIndex)];
                goForward(item.children);
            });
        });

        panelEl.querySelectorAll('a.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => closeMobileMenu());
        });

        wireLangSwitchers(panelEl);
    }

    // Lässt die Zeilen (Links/Drill-Buttons/Social-Icons) eines Panels
    // einzeln, nacheinander leicht von unten nach oben einblenden – der
    // "Apple-artige" saubere vertikale Aufbau. Rein index-basiert (kein
    // Bezug zu Text/Anzahl/Seite), funktioniert dadurch automatisch für
    // jede aktuelle und künftige Ebene, ohne Sonderfälle.
    function animatePanelRowsIn(panelEl) {
        const rows = panelEl.querySelectorAll('.mobile-nav-link, .mobile-nav-drill, .mobile-social, .mobile-search-field');
        rows.forEach((row, index) => {
            row.animate(
                [
                    { opacity: 0, transform: 'translateY(8px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                {
                    duration: 260,
                    delay: Math.min(index, 8) * 35,
                    easing: 'ease',
                    fill: 'both'
                }
            );
        });
    }

    // Tauscht das sichtbare Panel in .mobile-menu-levels gegen neuen HTML-
    // Inhalt aus – generischer Mechanismus, den sowohl die Nav-Ebenen
    // (renderMobileLevel) als auch das Mobile-Such-Panel (renderMobile
    // SearchPanel) nutzen, statt ein zweites Panel-System zu bauen.
    //
    // WICHTIG zur Position: .mobile-menu-levels (nicht das einzelne Panel)
    // hat in header.css einen FESTEN top-/left-/right-Wert – ein
    // konstanter Bezugspunkt, der nie von Inhalt, Textlänge, Anzahl
    // Einträgen oder der Höhe der vorherigen Ebene abhängt. Alle Panels
    // liegen zusätzlich per CSS Grid exakt in derselben Zelle übereinander
    // (grid-area: 1/1) statt sich gegenseitig im normalen Fluss zu
    // verschieben oder ihre Höhe per JS zu verwalten. Dadurch kann weder
    // eine horizontale Positionsänderung noch eine vertikale Startpunkt-
    // Verschiebung mehr auftreten – unabhängig davon, welches Panel
    // (Navigation ODER Suche) gerade angezeigt wird oder wie lang sein
    // Inhalt ist. instant=true (erstes Öffnen, egal ob per Hamburger oder
    // Lupe) baut das Panel sofort sauber auf; sonst (Ebenenwechsel bzw.
    // Wechsel zwischen Navigation/Suche bei bereits offenem Menü) wird
    // gekreuzblendet.
    function swapMobilePanel(html, attachFn, instant) {
        if (!mobileMenuLevels) return;

        // Der zuletzt eingefügte Panel ist immer das aktuell sichtbare (jedes
        // ältere ist ein Rest einer noch nicht abgeschlossenen vorherigen
        // Entfernung, z.B. bei sehr schnell aufeinanderfolgenden Klicks).
        const existingPanels = Array.from(mobileMenuLevels.querySelectorAll('.mobile-menu-panel'));
        const oldPanel = existingPanels[existingPanels.length - 1] || null;

        const newPanel = document.createElement('div');
        newPanel.className = 'mobile-menu-panel';
        newPanel.innerHTML = html;

        if (!oldPanel || instant) {
            // Erstes Öffnen: kein altes Panel zum Ausblenden, nur die neuen
            // Zeilen sauber von oben nach unten aufbauen lassen.
            mobileMenuLevels.innerHTML = '';
            mobileMenuLevels.appendChild(newPanel);
            if (attachFn) attachFn(newPanel);
            animatePanelRowsIn(newPanel);
            return;
        }

        // Selbstheilend: alles ausser dem aktuellen Panel sofort entfernen,
        // damit sich bei schnellem Klicken niemals Panels im DOM ansammeln.
        existingPanels.forEach(panel => {
            if (panel !== oldPanel) {
                panel.getAnimations().forEach(anim => anim.cancel());
                panel.remove();
            }
        });

        mobileMenuLevels.appendChild(newPanel);
        if (attachFn) attachFn(newPanel);
        animatePanelRowsIn(newPanel);

        // Altes Panel verlässt die sichtbare Fläche sauber (Fade + leichter
        // Zug nach oben) – unabhängig davon, ob es sich um einen Ebenen-
        // wechsel oder einen Wechsel Navigation↔Suche handelt.
        const oldAnimation = oldPanel.animate(
            [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-8px)' }
            ],
            { duration: 200, easing: 'ease', fill: 'both' }
        );

        oldAnimation.onfinish = () => {
            if (oldPanel.parentNode) oldPanel.parentNode.removeChild(oldPanel);
        };
    }

    // Rendert die aktuell oberste Nav-Ebene. direction ist 'forward'/'back'
    // beim Ebenenwechsel, null beim allerersten Öffnen.
    function renderMobileLevel(direction) {
        const level = navStack[navStack.length - 1];
        swapMobilePanel(buildLevelHTML(level), panelEl => attachLevelHandlers(level, panelEl), !direction);
    }

    function goForward(children) {
        navStack.push({ items: children, isTop: false });
        renderMobileLevel('forward');
        updateSubLevelState();
    }

    function goBack() {
        if (navStack.length <= 1) return;
        navStack.pop();
        renderMobileLevel('back');
        updateSubLevelState();
    }

    // ─── MOBILE SUCHE: NUTZT DASSELBE MOBILE-MENU-OVERLAY WIE DER HAMBURGER ───
    // Kein zweites Mobile-Navigationssystem: dieselbe .mobile-menu-Fläche
    // (Farbe/Blur/Abstände/Position), derselbe Hamburger-Button, der dabei
    // ebenfalls zu einem X wird, und dieselbe Panel-Crossfade-Mechanik wie
    // die Nav-Ebenen (swapMobilePanel) – nur der Panel-Inhalt ist die Suche
    // statt der Navigation. Kein eigenes X im Suchfeld: das X oben rechts
    // (der Hamburger-Button) schliesst immer den gesamten Zustand.
    const navSearchToggleMobile = document.getElementById('navSearchToggleMobile');
    let mobileMenuMode = null; // null | 'nav' | 'search'

    function setMobileSearchToggleState(isActive) {
        if (!navSearchToggleMobile) return;
        navSearchToggleMobile.classList.toggle('is-active', isActive);
        navSearchToggleMobile.setAttribute('aria-expanded', String(isActive));
    }

    function buildMobileSearchPanelHTML() {
        return `
            <div class="mobile-search-panel">
                <div class="mobile-search-field">
                    <i class="fa-solid fa-magnifying-glass mobile-search-field-icon"></i>
                    <input type="text" class="mobile-search-input" placeholder="${t('search.placeholder', 'Seiten &amp; Projekte durchsuchen…')}" autocomplete="off" aria-label="${t('search.placeholder', 'Seiten und Projekte durchsuchen')}">
                </div>
                <div class="mobile-search-divider"></div>
                <div class="mobile-search-results"></div>
            </div>
        `;
    }

    function attachMobileSearchHandlers(panelEl) {
        const input = panelEl.querySelector('.mobile-search-input');
        const results = panelEl.querySelector('.mobile-search-results');
        if (!input || !results) return;

        input.addEventListener('input', () => {
            renderSearchResultsInto(results, searchSite(input.value), input.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstResult = results.querySelector('.nav-search-result');
                if (firstResult) firstResult.click();
            }
        });

        results.addEventListener('click', (e) => {
            if (e.target.closest('.nav-search-result')) closeMobileMenu();
        });

        window.requestAnimationFrame(() => input.focus());
    }

    function renderMobileSearchPanel(instant) {
        swapMobilePanel(buildMobileSearchPanelHTML(), attachMobileSearchHandlers, instant);
    }

    // Öffnet das Mobile-Menu-Overlay im gegebenen Modus ('nav' oder
    // 'search') – exakt derselbe Zustand (Hamburger→X, .mobile-menu.open,
    // body.menu-open) für beide, nur der gerenderte Panel-Inhalt
    // unterscheidet sich.
    function openMobileOverlay(mode) {
        if (!hamburger || !mobileMenu) return;
        const wasOpen = hamburger.classList.contains('open');
        closeOtherPanels(null);
        hamburger.classList.add('open');
        mobileMenu.classList.add('open');
        document.body.classList.add('menu-open');
        mobileMenuMode = mode;
        setMobileSearchToggleState(mode === 'search');

        if (mode === 'search') {
            document.body.classList.remove('mobile-submenu-open');
            renderMobileSearchPanel(!wasOpen);
        } else {
            navStack = [topLevel()];
            renderMobileLevel(null);
            updateSubLevelState();
        }
    }

    function closeMobileMenu() {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.classList.remove('menu-open');
        document.body.classList.remove('mobile-submenu-open');
        mobileMenuMode = null;
        setMobileSearchToggleState(false);
    }

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            if (hamburger.classList.contains('open')) {
                closeMobileMenu();
                return;
            }
            openMobileOverlay('nav');
        });
    }

    if (navSearchToggleMobile) {
        navSearchToggleMobile.addEventListener('click', () => {
            const isOpen = hamburger.classList.contains('open');
            if (isOpen && mobileMenuMode === 'search') {
                closeMobileMenu();
                return;
            }
            openMobileOverlay('search');
        });
    }

    if (mobileBackArrow) {
        mobileBackArrow.addEventListener('click', goBack);
    }

    // ─── 15. AKTIVEN LINK AUTOMATISCH HERVORHEBEN ───
    const currentPath = window.location.pathname.split("/").pop();
    const allNavLinks = document.querySelectorAll('.nav-center a');

    allNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath && href === currentPath) {
            link.classList.add('active');
        } else if (!currentPath && href.includes('#home')) {
            link.classList.add('active');
        }
    });

    // ─── 16. SMART STICKY HEADER SCROLL-VERHALTEN ───
    // Schaltet nur die Klasse .nav-hidden auf der Header-Gruppe um. Main
    // Header und (falls vorhanden) Second Header sind Teil derselben
    // .header-group und verschwinden/erscheinen dadurch immer gemeinsam.
    // (headerGroup selbst ist bereits weiter oben in Abschnitt 8 deklariert.)
    let lastScrollY = window.scrollY;

    if (headerGroup) {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (document.body.classList.contains('menu-open')) {
                headerGroup.classList.remove('nav-hidden');
                return;
            }

            if (currentScrollY <= 0) {
                headerGroup.classList.remove('nav-hidden');
            }
            else if (currentScrollY > lastScrollY && currentScrollY > 60) {
                headerGroup.classList.add('nav-hidden');
                // Header (inkl. eines evtl. offenen Untermenüs/der Suche)
                // schiebt sich beim Scrollen weg – alle Panels + Backdrop
                // gleich mit schliessen, sonst bliebe der Hintergrund-
                // Backdrop ohne sichtbaren Auslöser stehen.
                closeOtherPanels(null);
            }
            else if (currentScrollY < lastScrollY) {
                headerGroup.classList.remove('nav-hidden');
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }
});
