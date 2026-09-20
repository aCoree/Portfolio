/* =====================================================================
   AZ-REVEAL – TRIGGER-SKRIPT (siehe az-reveal.css für die Optik)
   =====================================================================
   Beobachtet jedes Element mit der Klasse "az-reveal" per
   IntersectionObserver und fügt "az-reveal-visible" hinzu, sobald es in
   den sichtbaren Bereich scrollt (einmalig, danach nicht mehr
   beobachtet). Elemente, die beim Laden der Seite bereits im Viewport
   sind, werden sofort eingeblendet statt zu warten.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.az-reveal');
    if (!elements.length) return;

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('az-reveal-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            element.classList.add('az-reveal-visible');
        } else {
            revealObserver.observe(element);
        }
    });
});
