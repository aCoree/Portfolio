document.addEventListener("DOMContentLoaded", function() {

    // ─── 1. DYNAMISCHE CSS STYLES (HEADER, FOOTER & AUTOMATISCHER STICKY FOOTER) ───
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

        /* ─── SMART STICKY HEADER STYLES ─── */
        .navbar {
            position: fixed !important;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
        }

        /* Klasse zum Verstecken des Headers beim Nach-unten-Scrollen */
        .navbar.nav-hidden {
            transform: translateY(-100%);
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

    // ─── 2. ORIGINAL HEADER & MOBILE MENU HTML ───
    const headerHTML = `
    <!-- ─── NAVIGATIONBAR ─── -->
    <header class="navbar">
        <div class="nav-left">
            <a href="index.html#home" class="logo">
                <span class="logo-mark">
                    <img src="images/logo-wide.png" alt="Aurelio Zingarello Logo">
                </span>
            </a>
        </div>
        
        <nav class="nav-center">
            <a href="index.html#home">HOME</a>
            <a href="projekte.html">PROJEKTE</a>
            <a href="index.html#ueber-mich">ÜBER MICH</a>
            <a href="index.html#kontakt">KONTAKT</a>
        </nav>
        
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

    <!-- Mobile Menu Overlay -->
    <div class="mobile-menu" id="mobileMenu">
        <nav class="mobile-nav">
            <a href="index.html#home" class="mobile-nav-link">Home</a>
            <a href="projekte.html" class="mobile-nav-link">Projekte</a>
            <a href="index.html#ueber-mich" class="mobile-nav-link">Über mich</a>
            <a href="index.html#kontakt" class="mobile-nav-link">Kontakt</a>
        </nav>
        <div class="mobile-social">
            <a href="https://www.youtube.com/@aureliozingarello" target="_blank" class="social-icon"><i class="fa-brands fa-youtube"></i></a>
        </div>
    </div>
    `;

    // ─── 3. ORIGINAL FOOTER HTML ───
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

    // ─── 4. ELEMENTE IN DEN DOM EINFÜGEN ───
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // ─── 5. HANDY-MENÜ STEUERUNG ───
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
            document.body.classList.toggle('menu-open');
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // ─── 6. AKTIVEN LINK AUTOMATISCH HERVORHEBEN ───
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

    // ─── 7. SMART STICKY HEADER SCROLL-VERHALTEN ───
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (document.body.classList.contains('menu-open')) {
                navbar.classList.remove('nav-hidden');
                return;
            }

            if (currentScrollY <= 0) {
                navbar.classList.remove('nav-hidden');
            } 
            else if (currentScrollY > lastScrollY && currentScrollY > 60) {
                navbar.classList.add('nav-hidden');
            } 
            else if (currentScrollY < lastScrollY) {
                navbar.classList.remove('nav-hidden');
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }
});