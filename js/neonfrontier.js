/* =====================================================================
   NEON FRONTIER – Scroll-Erlebnis (neonfrontier.html)  ·  v2

   Prinzip (Leistung zuerst):
   • Alles, was kontinuierlich mit dem Scrollen mitläuft, ist eine CSS-Scroll-
     Animation (siehe css/neonfrontier.css) – dafür braucht dieses Skript
     NICHTS pro Frame zu tun.
   • Dieses Skript macht nur die "diskreten" Dinge: welcher Kartenpunkt / Skin /
     Rang gerade aktiv ist (Klassen umschalten, nur wenn sich etwas ändert),
     HUD-Kapitelname, Einblenden, Zahlen hochzählen.
   • Die zwei kleinen Dauer-Animationen (Staub im Hero, Zug auf der Karte)
     laufen nur, solange ihr Bereich im Bild ist.
   • Ohne Scroll-Animationen im Browser (animation-timeline) setzt das Skript
     ersatzweise --p pro Szene; das CSS zeigt dann dieselben Keyframes.
   ===================================================================== */
(function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  const body = document.body;
  const reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const coarse = !!(window.matchMedia && matchMedia("(hover: none), (pointer: coarse)").matches);
  // ?fb=1 erzwingt den Ersatzweg (zum Testen); ohne Browser-Unterstützung greift er automatisch
  const FB = /[?&]fb=1\b/.test(location.search);
  const SDA = !FB && !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: view()"));
  if (FB) document.documentElement.classList.add("nf-fb");
  const tr = (key, fb) => {
    try { const v = window.i18n && window.i18n.translate("neonfrontier." + key); return v || fb || ""; } catch (e) { return fb || ""; }
  };

  /* ───────── Header-Höhe (Layout-Höhe, einmalig) ───────── */
  function measureHeader() {
    let b = 0;
    [$(".navbar"), $(".second-navbar")].forEach((el) => { if (el && el.offsetHeight > 10) b += el.offsetHeight; });
    if (b > 40 && b < 220) body.style.setProperty("--nf-hdr", b + "px");
  }

  /* ───────── Skylines zeichnen (Hero sofort, Fahrzeug-Szene erst kurz vor Gebrauch) ───────── */
  function drawCities(root) {
    if (!window.NFCity || !root) return;
    $$("canvas[data-city]", root).forEach((c) => {
      if (c._drawn) return; c._drawn = true;
      window.NFCity.draw(c, { layer: c.dataset.city, seed: +c.dataset.seed || 7, w: c.hasAttribute("data-wide") ? 3200 : 1600, h: 500 });
    });
  }

  /* ───────── Kapitel, HUD, Kapitel-Leiste ───────── */
  const hud = $(".nf-hud");
  const rail = $("[data-rail]");
  const hudName = $("[data-hud-name]");
  const chapters = $$("main > section").map((el) => ({ el, id: el.id, key: el.dataset.hud || "", text: el.dataset.hudText || "", accent: el.dataset.accent || "#7ee8ff", top: 0, bottom: 0, accentNow: null }));
  let cur = -1;
  const chapterName = (c) => (c.key ? tr(c.key, c.text) : c.text);
  function buildRail() {
    if (!rail) return;
    rail.innerHTML = "";
    chapters.forEach((c) => {
      const li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + c.id; a.setAttribute("aria-label", chapterName(c));
      a.innerHTML = "<span>" + chapterName(c) + "</span>";
      li.appendChild(a); rail.appendChild(li); c.rail = a;
    });
  }
  function applyAccent(color, section) {
    [hud, rail, section].forEach((el) => { if (el && el._acc !== color) { el._acc = color; el.style.setProperty("--nf-accent", color); } });
  }
  function setChapter(i) {
    if (i === cur) return;
    cur = i;
    const c = chapters[i]; if (!c) return;
    if (hudName) hudName.textContent = chapterName(c).toUpperCase();
    chapters.forEach((x) => x.rail && x.rail.classList.toggle("is-on", x === c));
    applyAccent(c.accentNow || c.accent, c.el);
  }
  // eine Szene meldet "ihre" aktuelle Farbe (Kartenpunkt, Skin, Rang)
  function sceneAccent(sceneEl, color) {
    const c = chapters.find((x) => x.el === sceneEl); if (!c) return;
    c.accentNow = color;
    if (chapters[cur] === c) applyAccent(color || c.accent, c.el);
  }

  /* ───────── Szenen ───────── */
  const scenes = $$(".nf-scene").map((el) => ({ el, id: el.id, top: 0, h: 0, stageH: 0, idx: -2, p: -1, fn: null }));
  const S = {}; scenes.forEach((s) => (S[s.id] = s));
  const ANIM = ["boot", "fahrzeuge", "arsenal"]; // laufen per CSS (Fallback: --p)
  let docH = 0;

  function measure() {
    const sy = window.scrollY, vh = window.innerHeight;
    scenes.forEach((s) => {
      const r = s.el.getBoundingClientRect(); s.top = r.top + sy; s.h = r.height;
      const st = $(".nf-stage", s.el); s.stageH = st ? st.offsetHeight : vh;
    });
    chapters.forEach((c) => { const r = c.el.getBoundingClientRect(); c.top = r.top + sy; c.bottom = r.bottom + sy; });
    docH = document.documentElement.scrollHeight;
    measureHeader();
  }

  /* ---- Neon Junction: Kartenkamera ---- */
  const junction = (function () {
    const s = S.junction; if (!s) return null;
    const steps = $$("[data-steps] .nf-step", s.el), dots = $$("[data-dots] i", s.el);
    const cam = $("[data-cam]", s.el), pin = $("[data-pin]", s.el);
    const zones = $$("[data-z]", s.el), labels = $$("[data-lz]", s.el);
    const NS = "http://www.w3.org/2000/svg";
    // Raster (ein einziger Pfad) + Bäume
    let d = ""; for (let v = -40; v <= 640; v += 40) d += "M" + v + " -20V620M-40 " + v + "H660";
    $("[data-grid]", s.el).setAttribute("d", d);
    const R = window.NFCity ? window.NFCity.rng(5) : Math.random, trees = $("[data-trees]", s.el);
    [[-20, 222, 86, 126, 18], [138, 270, 84, 74, 7], [372, 530, 120, 40, 6]].forEach(([x0, y0, w, h, n]) => {
      for (let i = 0; i < n; i++) { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", (x0 + R() * w).toFixed(1)); c.setAttribute("cy", (y0 + R() * h).toFixed(1)); c.setAttribute("r", (3 + R() * 4).toFixed(1)); trees.appendChild(c); }
    });
    // Zug auf dem Bahnring (6 Punkte, nur animiert, solange die Karte im Bild ist)
    const rp = $("#nfRail", s.el), tg = $("[data-train]", s.el), L = rp.getTotalLength(), cars = [];
    for (let i = 0; i < 6; i++) { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", i === 0 ? 5.5 : 4); c.setAttribute("opacity", (i === 0 ? 1 : 0.85 - i * 0.1).toFixed(2)); tg.appendChild(c); cars.push(c); }
    function train(t) {
      const base = ((t * 0.00006) % 1) * L;
      cars.forEach((c, i) => { const pt = rp.getPointAtLength((((base - i * 11) % L) + L) % L); c.setAttribute("cx", pt.x.toFixed(1)); c.setAttribute("cy", pt.y.toFixed(1)); });
    }
    train(0);
    s.fn = (p) => {
      const n = steps.length, idx = p < 0.04 ? -1 : Math.min(n - 1, Math.floor(((p - 0.04) / 0.95) * n));
      if (idx === s.idx) return;
      s.idx = idx;
      steps.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      dots.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      zones.forEach((el) => el.classList.toggle("is-on", +el.dataset.z === idx));
      labels.forEach((el) => el.classList.toggle("is-on", +el.dataset.lz === idx));
      if (idx < 0) { cam.style.transform = "translate(0px,0px) scale(1)"; pin.classList.remove("is-on"); sceneAccent(s.el, null); }
      else {
        const f = steps[idx].dataset.focus.split(",").map(Number);
        cam.style.transform = "translate(" + (300 - f[0] * f[2]) + "px," + (300 - f[1] * f[2]) + "px) scale(" + f[2] + ")";
        pin.setAttribute("cx", f[0]); pin.setAttribute("cy", f[1]); pin.classList.add("is-on");
        sceneAccent(s.el, steps[idx].dataset.color);
      }
    };
    return { train };
  })();

  /* ---- Looks ---- */
  (function () {
    const s = S.looks; if (!s) return;
    const skins = $$(".nf-skin", s.el), infos = $$(".nf-sinfo", s.el), box = $("[data-thumbs]", s.el);
    skins.forEach((sk, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", infos[i] ? $("h3", infos[i]).textContent : "Skin " + (i + 1));
      b.innerHTML = '<img alt="" src="' + $("img", sk).getAttribute("src") + '" loading="lazy" decoding="async">';
      b.addEventListener("click", () => window.scrollTo({ top: s.top + ((i + 0.5) / skins.length) * (s.h - s.stageH), behavior: reduce ? "auto" : "smooth" }));
      box.appendChild(b);
    });
    const tbs = $$("button", box);
    s.fn = (p) => {
      const n = skins.length, idx = Math.min(n - 1, Math.floor(p * n * 0.999));
      if (idx === s.idx) return;
      s.idx = idx;
      skins.forEach((el, i) => { el.classList.toggle("is-on", i === idx); el.classList.toggle("is-past", i < idx); });
      infos.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      tbs.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      sceneAccent(s.el, skins[idx].dataset.accent);
    };
  })();

  /* ---- Ränge ---- */
  (function () {
    const s = S.ranks; if (!s) return;
    const items = $$(".nf-rank", s.el), infos = $$(".nf-rinfo", s.el);
    s.fn = (p) => {
      const n = items.length, idx = Math.min(n - 1, Math.floor(clamp(p * 1.08) * n * 0.999));
      if (idx === s.idx) return;
      s.idx = idx;
      items.forEach((el, i) => { el.classList.toggle("is-on", i === idx); el.classList.toggle("is-reached", i < idx); });
      infos.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      sceneAccent(s.el, items[idx].dataset.accent);
    };
  })();

  const discrete = scenes.filter((s) => s.fn);

  /* ───────── Scroll-Update (leicht: nur lesen, nur bei Änderung schreiben) ───────── */
  const bar = $(".nf-progress i");
  let ticking = false;
  function update() {
    ticking = false;
    const sy = window.scrollY, vh = window.innerHeight;
    if (!SDA) {   // Ersatzweg ohne Scroll-Animationen im Browser
      ANIM.forEach((id) => {
        const s = S[id]; if (!s) return;
        const p = clamp((sy - s.top) / Math.max(1, s.h - s.stageH));
        if (Math.abs(p - s.p) > 0.0005) { s.p = p; s.el.style.setProperty("--p", p.toFixed(4)); }
      });
      if (bar) bar.style.transform = "scaleX(" + clamp(sy / Math.max(1, docH - vh)).toFixed(4) + ")";
    }
    const mid = sy + vh * 0.5;
    let ci = 0; chapters.forEach((c, i) => { if (mid >= c.top) ci = i; });
    setChapter(ci);
    discrete.forEach((s) => {
      if (sy > s.top - vh && sy < s.top + s.h) s.fn(clamp((sy - s.top) / Math.max(1, s.h - s.stageH)));
    });
  }
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  /* ───────── Einblenden + Zahlen ───────── */
  $$(".nf-r").forEach((el) => { if (el.dataset.d) el.style.setProperty("--d", el.dataset.d); });
  function countUp(el) {
    if (el._cu) return; el._cu = true;
    const to = +el.dataset.count || 0;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now();
    (function step(t) { const k = clamp((t - t0) / 1300); el.textContent = Math.round((1 - Math.pow(1 - k, 3)) * to); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      if (e.target.hasAttribute("data-count")) countUp(e.target);
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$(".nf-r, [data-count]").forEach((el) => io.observe(el));
  } else $$(".nf-r").forEach((el) => el.classList.add("is-in"));

  /* ───────── Dauer-Animationen: nur solange sichtbar ───────── */
  const dust = $("[data-dust]"), dctx = dust && dust.getContext("2d");
  let heroVis = true, juncVis = false, raf = 0, lastTrain = 0, DW = 0, DH = 0, parts = [];
  const sprites = [];
  function makeSprites() {
    ["126,232,255", "255,61,168", "255,255,255"].forEach((c) => {
      const s = document.createElement("canvas"); s.width = s.height = 24; const x = s.getContext("2d");
      const g = x.createRadialGradient(12, 12, 0, 12, 12, 12); g.addColorStop(0, "rgba(" + c + ",1)"); g.addColorStop(0.35, "rgba(" + c + ",.45)"); g.addColorStop(1, "rgba(" + c + ",0)");
      x.fillStyle = g; x.fillRect(0, 0, 24, 24); sprites.push(s);
    });
  }
  function dustResize() {
    if (!dust) return;
    DW = dust.width = dust.clientWidth || window.innerWidth; DH = dust.height = dust.clientHeight || window.innerHeight;
    const n = coarse ? 18 : 30;
    parts = Array.from({ length: n }, () => ({ x: Math.random() * DW, y: Math.random() * DH, z: 0.3 + Math.random() * 0.7, c: (Math.random() * 3) | 0, s: 5 + Math.random() * 9 }));
  }
  function dustFrame() {
    if (!dctx || !DW) return;
    dctx.clearRect(0, 0, DW, DH);
    parts.forEach((p) => {
      p.y -= 0.12 + p.z * 0.3; if (p.y < -12) { p.y = DH + 12; p.x = Math.random() * DW; }
      dctx.globalAlpha = 0.25 + p.z * 0.5; dctx.drawImage(sprites[p.c], p.x, p.y, p.s * p.z + 4, p.s * p.z + 4);
    });
    dctx.globalAlpha = 1;
  }
  function loop(t) {
    raf = 0;
    if (document.hidden || (!heroVis && !juncVis)) return;
    if (heroVis && !reduce) dustFrame();
    if (juncVis && junction && t - lastTrain > 32) { lastTrain = t; junction.train(t); }
    raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };
  if ("IntersectionObserver" in window) {
    const vis = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.target.id === "boot") heroVis = e.isIntersecting;
      if (e.target.id === "junction") juncVis = e.isIntersecting;
      if (e.target.id === "fahrzeuge" && e.isIntersecting) drawCities(e.target);
      kick();
    }), { rootMargin: "30% 0px 30% 0px" });
    ["boot", "junction", "fahrzeuge"].forEach((id) => { const el = document.getElementById(id); if (el) vis.observe(el); });
  }
  document.addEventListener("visibilitychange", kick);

  /* ───────── Maus-Parallax im Hero (nur bei Mausbewegung) + Treffer-Marker ───────── */
  const par = $("[data-par]");
  if (par && !coarse && !reduce) {
    let pr = 0, px = 0, py = 0;
    window.addEventListener("pointermove", (e) => {
      if (!heroVis) return;
      px = (e.clientX / window.innerWidth - 0.5) * 2; py = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!pr) pr = requestAnimationFrame(() => { pr = 0; par.style.transform = "translate3d(" + (px * -12).toFixed(1) + "px," + (py * -6).toFixed(1) + "px,0)"; });
    }, { passive: true });
  }
  if (!coarse && !reduce) {
    window.addEventListener("pointerdown", (e) => {
      if (!(e.target.closest && e.target.closest("main"))) return;
      const h = document.createElement("div"); h.className = "nf-hit"; h.style.left = e.clientX + "px"; h.style.top = e.clientY + "px";
      document.body.appendChild(h); setTimeout(() => h.remove(), 440);
    });
  }

  /* ───────── Start ───────── */
  function init() {
    measureHeader();
    makeSprites();
    drawCities($("#boot"));
    buildRail();
    measure();
    dustResize();
    update();
    kick();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { measure(); dustResize(); update(); }, 150); });
    const main = $("main");
    if (main && "ResizeObserver" in window) { let ro = 0; new ResizeObserver(() => { clearTimeout(ro); ro = setTimeout(() => { measure(); update(); }, 200); }).observe(main); }
    window.addEventListener("load", () => { measure(); update(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); update(); });
  }
  init();
})();
