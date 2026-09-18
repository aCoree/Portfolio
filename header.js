document.addEventListener("DOMContentLoaded", function() {

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
        @media (max-width: 640px) {
            .site-footer {
                flex-wrap: wrap;
                row-gap: 16px;
                padding: 20px 20px;
            }
            .site-footer .footer-left {
                order: 1;
                flex: 0 0 auto;
            }
            .site-footer .footer-right {
                order: 2;
                flex: 0 0 auto;
            }
            .site-footer .footer-center {
                order: 3;
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
        { label: 'Home', href: 'index.html#home' },
        {
            label: 'Projekte',
            href: 'projekte.html',
            children: [
                { label: 'Alle Projekte', href: 'projekte.html', emphasize: true },
                { label: 'RUN', href: 'run.html' },
                { label: 'Musik', href: 'musik.html' },
                { label: 'DJI Air 3S', href: 'drone.html' },
                { label: 'URBNVIBE', href: 'urbnvibe.html' },
                { label: 'LEGO FAMILY STUDIO', href: 'lego.html' }
            ]
        },
        { label: 'Über mich', href: 'index.html#ueber-mich' },
        { label: 'Kontakt', href: 'index.html#kontakt' }
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
                        <img src="images/logo-wide.png" alt="Aurelio Zingarello Logo">
                    </span>
                </a>
                <!-- Ersetzt das Logo auf tieferen Mobile-Menü-Ebenen (siehe JS) -->
                <button type="button" class="mobile-back-arrow" id="mobileBackArrow" aria-label="Eine Ebene zurück">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
            </div>

            <nav class="nav-center">${buildMainNavHTML()}</nav>

            <div class="nav-right">
                <a href="https://www.youtube.com/@aureliozingarello" target="_blank" class="social-icon"><i class="fa-brands fa-youtube"></i></a>
            </div>

            <!-- Hamburger Button (nur Mobile) -->
            <button class="hamburger" id="hamburger" aria-label="Menü öffnen">
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

        ${buildSecondNavbarHTML()}
    </div>

    <!-- Mobile Menu Overlay: Inhalt wird von renderMobileLevel() dynamisch befüllt -->
    <div class="mobile-menu" id="mobileMenu">
        <div class="mobile-menu-levels" id="mobileMenuLevels"></div>
    </div>
    `;

    // ─── 6. ORIGINAL FOOTER HTML ───
    const footerHTML = `
    <!-- ─── FOOTER ─── -->
    <footer class="site-footer">
        <div class="footer-left">
            <a href="index.html#home" class="logo">
                <span class="logo-mark">
                    <img src="images/logo-wide.png" alt="Aurelio Zingarello Logo">
                </span>
            </a>
        </div>
        <div class="footer-center">
            <p style="margin: 0;">&copy; 2026 Aurelio Zingarello. Alle Rechte vorbehalten.</p>
            <div style="margin-top: 6px; font-size: 0.8rem;">
                <a href="impressum.html" style="color: #888; text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">Impressum</a>
                <span style="color: #555; margin: 0 6px;">·</span>
                <a href="datenschutz.html" style="color: #888; text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">Datenschutz</a>
            </div>
        </div>
        <div class="footer-right">
            <a href="https://www.youtube.com/@aureliozingarello" target="_blank" class="social-icon" style="margin-right: 2px;"><i class="fa-brands fa-youtube"></i></a>
        </div>
    </footer>
    `;

    // ─── 7. ELEMENTE IN DEN DOM EINFÜGEN ───
    document.body.insertAdjacentHTML('afterbegin', headerGroupHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // ─── 8. DESKTOP: HEADER-ERWEITERUNG BEI HOVER (PROJEKTE & SECOND-HEADER-EINTRÄGE) ───
    // Eine generische Steuerung für beide Stellen: Hover/Fokus auf einen Trigger
    // füllt die zugehörige Erweiterungsfläche mit den Kind-Links und lässt den
    // Header (dieselbe Hintergrundfläche) dafür nach unten wachsen.
    function setupSubmenuController(navRootEl, expandEl, expandInnerEl, itemsArray, lineTargetEl) {
        if (!navRootEl || !expandEl || !expandInnerEl) return;

        let closeTimer = null;
        let activeTrigger = null;

        function openFor(triggerEl, item) {
            clearTimeout(closeTimer);
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
            if (lineTargetEl) lineTargetEl.classList.add('has-open-submenu');
        }

        function scheduleClose() {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => {
                expandEl.classList.remove('is-open');
                if (lineTargetEl) lineTargetEl.classList.remove('has-open-submenu');
                if (activeTrigger) {
                    activeTrigger.classList.remove('is-open');
                    activeTrigger = null;
                }
            }, 150);
        }

        function cancelClose() {
            clearTimeout(closeTimer);
        }

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

    setupSubmenuController(
        document.querySelector('.nav-center'),
        document.getElementById('mainNavExpand'),
        document.getElementById('mainNavExpandInner'),
        mainNavItems,
        document.querySelector('.navbar')
    );

    setupSubmenuController(
        document.querySelector('.second-navbar-inner'),
        document.getElementById('secondNavExpand'),
        document.getElementById('secondNavExpandInner'),
        secondHeaderItems
    );

    // ─── 9. MOBILE MENÜ: HAMBURGER + MEHRSTUFIGE NAVIGATION MIT ZURÜCK-PFEIL ───
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

    function closeMobileMenu() {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.classList.remove('menu-open');
        document.body.classList.remove('mobile-submenu-open');
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
            ? `<div class="mobile-social"><a href="https://www.youtube.com/@aureliozingarello" target="_blank" class="social-icon"><i class="fa-brands fa-youtube"></i></a></div>`
            : '';

        return `${mainLinksHTML}${itemsNavHTML}${socialHTML}`;
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
    }

    // Rendert die aktuell oberste Ebene. direction steuert die Übergangs-
    // Animation: 'forward' beim Reindrillen, 'back' beim Zurückgehen, null
    // beim allerersten Öffnen (kein Übergang nötig).
    function renderMobileLevel(direction) {
        if (!mobileMenuLevels) return;
        const level = navStack[navStack.length - 1];
        const html = buildLevelHTML(level);

        // Der zuletzt eingefügte Panel ist immer das aktuell sichtbare (jedes
        // ältere ist ein Rest einer noch nicht abgeschlossenen vorherigen
        // Entfernung, z.B. bei sehr schnell aufeinanderfolgenden Klicks).
        const existingPanels = Array.from(mobileMenuLevels.querySelectorAll('.mobile-menu-panel'));
        const oldPanel = existingPanels[existingPanels.length - 1] || null;

        const newPanel = document.createElement('div');
        newPanel.className = 'mobile-menu-panel';
        newPanel.innerHTML = html;

        if (!oldPanel || !direction) {
            mobileMenuLevels.innerHTML = '';
            mobileMenuLevels.appendChild(newPanel);
            attachLevelHandlers(level, newPanel);
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
        attachLevelHandlers(level, newPanel);

        // Web Animations API statt CSS-Klassen-Transition: Eine per Klasse +
        // erzwungenem Reflow/rAF ausgelöste CSS-Transition hängt davon ab,
        // dass der Browser die "Start"-Klasse tatsächlich in einem eigenen
        // Frame malt, bevor die "End"-Klasse gesetzt wird – je nach Geräte-/
        // Browser-Timing kann dieser Zwischenschritt übersprungen werden,
        // wodurch die Liste sichtbar an der falschen Position "aufsetzt"
        // (genau das gemeldete, unregelmässige Verrutschen). element.animate()
        // erhält die Start- und End-Keyframes dagegen atomar als eine
        // Animation und kann diesen Frame nie verlieren – dadurch bleibt der
        // linke Rand während der gesamten Animation garantiert stabil, egal
        // wie viele/lange Einträge eine Ebene hat oder wie breit der
        // Bildschirm ist.
        const distance = direction === 'forward' ? 24 : -24;
        const duration = 280;
        const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

        newPanel.animate(
            [
                { transform: `translateX(${distance}px)`, opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ],
            { duration, easing, fill: 'both' }
        );

        const oldAnimation = oldPanel.animate(
            [
                { transform: 'translateX(0)', opacity: 1 },
                { transform: `translateX(${-distance}px)`, opacity: 0 }
            ],
            { duration, easing, fill: 'both' }
        );

        oldAnimation.onfinish = () => {
            if (oldPanel.parentNode) oldPanel.parentNode.removeChild(oldPanel);
        };
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

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.contains('open');

            if (isOpen) {
                closeMobileMenu();
                return;
            }

            hamburger.classList.add('open');
            mobileMenu.classList.add('open');
            document.body.classList.add('menu-open');

            // Jedes Öffnen startet wieder auf der obersten Ebene.
            navStack = [topLevel()];
            renderMobileLevel(null);
            updateSubLevelState();
        });
    }

    if (mobileBackArrow) {
        mobileBackArrow.addEventListener('click', goBack);
    }

    // ─── 10. AKTIVEN LINK AUTOMATISCH HERVORHEBEN ───
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

    // ─── 11. SMART STICKY HEADER SCROLL-VERHALTEN ───
    // Schaltet nur die Klasse .nav-hidden auf der Header-Gruppe um. Was genau
    // dabei passiert (ganze Gruppe verschwindet vs. nur Main Header klappt weg
    // und der Second Header bleibt oben sichtbar), entscheidet ausschliesslich
    // das CSS anhand von body.has-second-header – hier ist keine Fallunter-
    // scheidung nötig.
    const headerGroup = document.getElementById('headerGroup');
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
            }
            else if (currentScrollY < lastScrollY) {
                headerGroup.classList.remove('nav-hidden');
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }
});
