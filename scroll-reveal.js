/* =====================================================================
   SCROLL REVEAL ANIMATION – wiederverwendbar für ALLE Unterseiten
   =====================================================================
   Einbindung: einfach diesen Link auf jeder Seite ergänzen:

       <script src="scroll-reveal.js"></script>

   Voraussetzung: style.css muss auf der Seite verlinkt sein, denn dort
   liegt das passende CSS ("section { opacity:0 ... }" /
   "section.active { opacity:1 ... }" – siehe Abschnitt
   "SCROLL FADE ANIMATION" in style.css).

   Das Script blendet jede <section> sanft ein, sobald sie beim Scrollen
   in den sichtbaren Bereich kommt (per IntersectionObserver). Sections,
   die beim Laden der Seite bereits im Viewport sind, werden sofort
   eingeblendet statt zu warten.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');

    if (!sections.length) return;

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    sections.forEach((section) => {
        const rect = section.getBoundingClientRect();

        // Bereits sichtbare Sections direkt beim Laden einblenden
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            section.classList.add('active');
        } else {
            revealObserver.observe(section);
        }
    });
});
