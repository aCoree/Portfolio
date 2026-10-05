/* ─────────────────────────────────────────────────────────────
   FOTO-DATA.JS – ALLE FOTOS DER FOTOGRAFIE-KATEGORIEN AN EINEM ORT
   ─────────────────────────────────────────────────────────────
   Aus dieser Datei baut foto-galerie.js automatisch:
     - wildlife.html / landschaften.html / portrait.html /
       streetfotografie.html: je eine quadratische Kachel pro MOTIV
       (z.B. pro Tierart) mit Titel
     - motiv.html: die Seite eines Motivs (z.B. "EISVOGEL") mit allen
       Fotos dieses Motivs in einem Mosaik-Raster + Grossansicht
   Die HTML-Seiten selbst musst du nie anfassen – auch keine neue
   Seite pro Tier anlegen: motiv.html wird für alle Motive verwendet.

   ▸ NEUES FOTO ZU EINEM BESTEHENDEN MOTIV (z.B. noch ein Eisvogel):
     Bild-Datei in den Ordner "fotografie/" legen und den Pfad einfach
     in die "images"-Liste des Motivs eintragen, z.B.
         images: ['fotografie/eisvogel.jpg', 'fotografie/eisvogel-2.jpg']
     Das erste Bild der Liste ist das Titelbild der Kachel.

   ▸ BILDAUSSCHNITT PRO FOTO (x / y):
     Statt nur dem Pfad kannst du bei jedem Foto angeben, welcher Teil in
     der Kachel sichtbar bleibt (wichtig bei Rule of Thirds, wenn das Motiv
     nicht in der Mitte ist):
         { src: 'fotografie/wildlife/eisvogel/eisvogel.jpg', x: 30, y: 20 }
       x: 0 = ganz links, 50 = Mitte (Standard), 100 = ganz rechts
       y: 0 = ganz oben,  50 = Mitte (Standard), 100 = ganz unten
     Kleineres x  → Kachel zeigt mehr vom linken Bildteil,
     grösseres x  → mehr vom rechten Teil. Bei y gleich mit oben/unten.
     Beide Angaben sind optional. Beim ERSTEN Foto eines Motivs gilt der
     Ausschnitt auch für die Kachel auf der Kategorieseite.
     In der Grossansicht (Lightbox) siehst du immer das ganze Bild.

   ▸ WIE DAS MOSAIK ENTSTEHT:
     Die Form jeder Kachel (hoch, quer, schmal, breit …) legt NUR die
     Position in der Liste fest – je 6 Bilder bilden einen Block (Handy:
     2 Spalten, PC: derselbe Block um 90° gedreht = 3 Spalten). Jedes Bild
     füllt seine Kachel immer komplett aus, zentriert; was überschaut,
     wird am Rand abgeschnitten (in der Grossansicht siehst du alles).
     Bei weniger als 6 (oder z.B. 8) Bildern füllt sich der letzte Block
     automatisch auf, ohne Lücken.

   ▸ NEUES MOTIV (z.B. ein neues Tier):
     Einen neuen Block { title: '...', images: ['...'] } in die Liste der
     Kategorie kopieren – die Kachel und die Motiv-Seite entstehen
     automatisch. Die Adresse der Motiv-Seite leitet sich vom deutschen
     Titel ab (Möwe → motiv.html?k=wildlife&m=moewe). Soll sie sich bei einer
     späteren Titel-Änderung nicht ändern, setze zusätzlich  id: 'moewe'.

   ▸ TITEL:
     Entweder ein einfacher Text  title: 'Eisvogel'  (in allen Sprachen
     gleich) oder pro Sprache  title: { de: 'Eisvogel', en: 'Kingfisher',
     fr: 'Martin-pêcheur', it: 'Martin pescatore' }.  Fehlt eine Sprache,
     wird der deutsche Titel genommen.

   ▸ REIHENFOLGE auf der Seite = Reihenfolge in dieser Datei.
   ───────────────────────────────────────────────────────────── */

/* Platzhalter-Hilfe: wiederholt ein Bild 6x (= ein ganzer Mosaik-Block),
   damit man sieht, wie ein Motiv mit mehreren Fotos aussieht. Sobald du
   echte Fotos hast, ersetzt du x6('fotografie/…') einfach durch eine
   normale Liste ['…', '…']. */
function x6(src) {
  return [src, src, src, src, src, src];
}

window.FOTO_GALERIE = {
  /* ─── WILDLIFE (wildlife.html) ─── */
  wildlife: [
    {
      title: {
        de: "Eisvogel",
        en: "Kingfisher",
        fr: "Martin-pêcheur",
        it: "Martin pescatore",
      },
      images: [
        { src: "fotografie/wildlife/eisvogel/eisvogel-1-lq.jpg", x: 50, y: 50 },
        { src: "fotografie/wildlife/eisvogel/eisvogel-2-lq.jpg", x: 50, y: 50 },
        { src: "fotografie/wildlife/eisvogel/eisvogel-3-lq.jpg", x: 50, y: 50 },
        { src: "fotografie/wildlife/eisvogel/eisvogel-4-lq.jpg", x: 50, y: 50 },
        { src: "fotografie/wildlife/eisvogel/eisvogel-5-lq.jpg", x: 50, y: 50 },
        { src: "fotografie/wildlife/eisvogel/eisvogel-6-lq.jpg", x: 22, y: 50 },
    
      ],
    },
    {
      title: { de: "Milan", en: "Kite", fr: "Milan", it: "Nibbio" },
      images: [
        "fotografie/wildlife/milan/milan.jpg", 
        "fotografie/wildlife/milan/milan-2.jpg"],
    },
    {
      title: { de: "Möwe", en: "Seagull", fr: "Mouette", it: "Gabbiano" },
      images: x6("fotografie/wildlife/möwe/möwe.jpg"),
    },
    {
      title: { de: "Star", en: "Starling", fr: "Étourneau", it: "Storno" },
      images: [
        "fotografie/wildlife/star/star-feigenbaum.jpg",
        "fotografie/wildlife/star/star-garten.jpg",
        "fotografie/wildlife/star/star-birke.jpg",
      ],
    },
    {
      title: {
        de: "Blaumeise",
        en: "Blue tit",
        fr: "Mésange bleue",
        it: "Cinciarella",
      },
      images: x6("fotografie/blaumeise01.png"),
    },
    {
      title: {
        de: "Kohlmeise",
        en: "Great tit",
        fr: "Mésange charbonnière",
        it: "Cinciallegra",
      },
      images: x6("fotografie/wildlife/kohlmeise01.png"),
    },
    {
      title: {
        de: "Hausrotschwanz",
        en: "Black Redstart",
        fr: "Rougequeue noir",
        it: "Codirosso spazzacamino",
      },
      images: x6("fotografie/wildlife/hausrotschwanz.png"),
    },
    /* ─── weitere Tiere hier einfügen ─── */
  ],

  /* ─── LANDSCHAFTEN (landschaften.html) ─── */
  landschaften: [
    {
      title: "Landschaft 1",
      images: x6("fotografie/kirche01.png"),
    },
    /* ─── weitere Motive hier einfügen ─── */
  ],

  /* ─── PORTRAIT (portrait.html) ─── */
  portrait: [
    {
      title: "Portrait 1",
      images: x6("fotografie/foto-shooting-2.png"),
    },
    {
      title: "Portrait 2",
      images: x6("fotografie/foto-shooting-67.png"),
    },
    /* ─── weitere Motive hier einfügen ─── */
  ],

  /* ─── STREETFOTOGRAFIE (streetfotografie.html) ─── */
  street: [
    {
      title: "Street 1",
      images: x6("fotografie/foto-shooting-1.png"),
    },
    /* ─── weitere Motive hier einfügen ─── */
  ],
};
