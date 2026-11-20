/* =====================================================================
   NEON FRONTIER – Scroll-Erlebnis (neonfrontier.html)
   • Jede Szene (.nf-scene) ist hoch und hat darin eine "klebende" Bühne
     (.nf-stage). Dieses Skript rechnet pro Szene den Fortschritt p (0 → 1)
     aus und schreibt ihn als CSS-Variable --p; das CSS und die kleinen
     Szenen-Funktionen unten machen daraus Bewegung.
   • Alles Weitere: HUD (Zone, Rundenzeit, Fortschritt), Kapitel-Leiste,
     Fadenkreuz, Partikel, Einblend-Effekte, Zahlen, Text-Scramble.
   • "Weniger Bewegung" (prefers-reduced-motion): kein Scrubbing, keine
     Partikel, alles sofort sichtbar.
   ===================================================================== */
(function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  const pad = (n, l) => String(n).padStart(l || 2, "0");
  const body = document.body;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia && matchMedia("(hover: none), (pointer: coarse)").matches;
  const tr = (key, fb) => {
    try { const v = window.i18n && window.i18n.translate("neonfrontier." + key); return v || fb || ""; } catch (e) { return fb || ""; }
  };

  /* ───────── Höhe von Header + Second-Header → --nf-hdr ───────── */
  function measureHeader() {
    // Layout-Höhe (nicht die aktuelle Position): der Header blendet beim Scrollen aus, die Bühne soll trotzdem immer gleich weit unten beginnen
    let b = 0;
    [$(".navbar"), $(".second-navbar")].forEach((el) => { if (el && el.offsetHeight > 10) b += el.offsetHeight; });
    if (b > 40 && b < 220) body.style.setProperty("--nf-hdr", Math.round(b) + "px");
  }

  /* ───────── Skylines in die Canvas-Ebenen zeichnen ───────── */
  function drawCities() {
    if (!window.NFCity) return;
    $$("canvas[data-city]").forEach((c) => {
      const wide = c.hasAttribute("data-wide");
      window.NFCity.draw(c, { layer: c.dataset.city, seed: +c.dataset.seed || 7, w: wide ? 3200 : 1600, h: 500 });
    });
  }

  /* ───────── Kapitel, HUD, Kapitel-Leiste ───────── */
  const chapters = $$("main > section[data-hud]").map((el, i) => ({ el, i, id: el.id, key: el.dataset.hud, accent: el.dataset.accent || "#7ee8ff", top: 0, bottom: 0 }));
  const rail = $("[data-rail]");
  const hudZone = $("[data-hud-zone]");
  const hudName = $("[data-hud-name]");
  const hudClock = $("[data-hud-clock]");
  const progressBar = $(".nf-progress i");
  let curChapter = -1;
  let accentOverride = null;

  function chapterName(c) { return tr(c.key, c.key); }
  function buildRail() {
    if (!rail) return;
    rail.innerHTML = "";
    chapters.forEach((c) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + c.id;
      a.setAttribute("aria-label", chapterName(c));
      a.innerHTML = "<span>" + chapterName(c) + "</span>";
      li.appendChild(a);
      rail.appendChild(li);
      c.rail = a;
    });
  }
  function setAccent(color) {
    if (body._acc !== color) { body._acc = color; body.style.setProperty("--nf-accent", color); }
  }
  function setChapter(i) {
    if (i === curChapter) return;
    curChapter = i;
    const c = chapters[i];
    if (!c) return;
    if (hudZone) hudZone.textContent = tr("hudZone", "Zone").toUpperCase() + " " + pad(i);
    if (hudName) hudName.textContent = "· " + chapterName(c).toUpperCase();
    chapters.forEach((x) => x.rail && x.rail.classList.toggle("is-on", x === c));
    accentOverride = null;
    setAccent(c.accent);
    body.dataset.nfChapter = c.id;
  }

  /* ───────── Szenen ───────── */
  const scenes = $$(".nf-scene").map((el) => ({ el, type: el.dataset.scene, p: -1, top: 0, h: 0, stageH: 0, fn: null, idx: -2 }));
  const byType = {};
  scenes.forEach((s) => (byType[s.type] = s));

  function measure() {
    const sy = window.scrollY, vh = window.innerHeight;
    scenes.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + sy; s.h = r.height;
      const st = $(".nf-stage", s.el);
      s.stageH = st ? st.getBoundingClientRect().height : vh;
    });
    chapters.forEach((c) => { const r = c.el.getBoundingClientRect(); c.top = r.top + sy; c.bottom = r.bottom + sy; });
    const tl = $("[data-timeline]");
    if (tl) { const r = tl.getBoundingClientRect(); tl._top = r.top + sy; tl._h = r.height; }
    if (byType.arsenal) { const t = $("[data-track]"); byType.arsenal.maxX = Math.max(0, t.scrollWidth - window.innerWidth + 40); }
    docH = document.documentElement.scrollHeight;
    measureHeader();
  }
  let docH = 0;

  /* ---- Hero ---- */
  const heroStage = $(".nf-hero-stage");
  let heroP = 0, mx = 0, tmx = 0;
  if (byType.hero) byType.hero.fn = (p) => { heroP = p; };

  /* ---- Neon Junction (Karte) ---- */
  (function junction() {
    const s = byType.junction; if (!s) return;
    const steps = $$("[data-steps] .nf-step", s.el);
    const dots = $$("[data-dots] i", s.el);
    const cam = $("[data-cam]", s.el);
    const pin = $("[data-pin]", s.el);
    const zones = $$("[data-z]", s.el);
    const labels = $$("[data-lz]", s.el);
    const grid = $("[data-grid]", s.el);
    const NS = "http://www.w3.org/2000/svg";
    // Raster + Bäume (nur Deko, deterministisch)
    for (let v = -40; v <= 640; v += 40) {
      const a = document.createElementNS(NS, "line"); a.setAttribute("x1", v); a.setAttribute("x2", v); a.setAttribute("y1", -20); a.setAttribute("y2", 620); grid.appendChild(a);
      const b = document.createElementNS(NS, "line"); b.setAttribute("y1", v); b.setAttribute("y2", v); b.setAttribute("x1", -40); b.setAttribute("x2", 660); grid.appendChild(b);
    }
    const trees = $("[data-trees]", s.el);
    const R = window.NFCity ? window.NFCity.rng(5) : Math.random;
    function forest(x0, y0, w, h, n) { for (let i = 0; i < n; i++) { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", x0 + R() * w); c.setAttribute("cy", y0 + R() * h); c.setAttribute("r", 3 + R() * 4); trees.appendChild(c); } }
    forest(-20, 222, 86, 126, 34); forest(138, 270, 84, 74, 12); forest(372, 530, 120, 40, 10);
    // Zug auf dem Bahnring
    const railPath = $("#nfRail", s.el), train = $("[data-train]", s.el);
    const L = railPath.getTotalLength();
    const cars = [];
    for (let i = 0; i < 6; i++) { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", i === 0 ? 5.5 : 4); c.setAttribute("opacity", i === 0 ? 1 : 0.85 - i * 0.1); train.appendChild(c); cars.push(c); }
    s.trainTick = (t) => {
      const base = ((t * 0.00006) % 1) * L;
      cars.forEach((c, i) => { const pt = railPath.getPointAtLength(((base - i * 11) % L + L) % L); c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); });
    };
    s.trainTick(0);

    s.fn = (p) => {
      const n = steps.length;
      const idx = p < 0.05 ? -1 : Math.min(n - 1, Math.floor(((p - 0.05) / 0.93) * n));
      if (idx === s.idx) return;
      s.idx = idx;
      steps.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      dots.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      zones.forEach((el) => el.classList.toggle("is-on", +el.dataset.z === idx));
      labels.forEach((el) => el.classList.toggle("is-on", +el.dataset.lz === idx));
      if (idx < 0) {
        cam.style.transform = "translate(0px,0px) scale(1)";
        pin.classList.remove("is-on");
        accentOverride = null; setAccent(chapters.find((c) => c.el === s.el).accent);
      } else {
        const f = steps[idx].dataset.focus.split(",").map(Number);
        cam.style.transform = "translate(" + (300 - f[0] * f[2]) + "px," + (300 - f[1] * f[2]) + "px) scale(" + f[2] + ")";
        pin.setAttribute("cx", f[0]); pin.setAttribute("cy", f[1]); pin.classList.add("is-on");
        accentOverride = steps[idx].dataset.color; setAccent(accentOverride);
      }
    };
  })();

  /* ---- Fahrzeuge ---- */
  if (byType.ride) byType.ride.fn = (p, s) => {
    const nitro = clamp((p - 0.42) / 0.22);
    s.el.style.setProperty("--rx", (-p * 5600).toFixed(1) + "px");
    s.el.style.setProperty("--nitro", nitro.toFixed(3));
    s.el.style.setProperty("--bob", (Math.sin(p * 90) * 1.6 * (0.4 + nitro)).toFixed(2));
  };

  /* ---- Arsenal (horizontal) ---- */
  if (byType.arsenal) byType.arsenal.fn = (p, s) => { s.el.style.setProperty("--tx", (-p * (s.maxX || 0)).toFixed(1)); };

  /* ---- Looks ---- */
  (function looks() {
    const s = byType.looks; if (!s) return;
    const skins = $$(".nf-skin", s.el), infos = $$(".nf-sinfo", s.el), thumbs = $("[data-thumbs]", s.el);
    skins.forEach((sk, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", infos[i] ? $("h3", infos[i]).textContent : "Skin " + (i + 1));
      b.innerHTML = '<img alt="" src="' + $("img", sk).getAttribute("src") + '" loading="lazy">';
      b.addEventListener("click", () => {   // Klick = zu diesem Skin scrollen
        const target = s.top + ((i + 0.5) / skins.length) * (s.h - s.stageH);
        window.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
      });
      thumbs.appendChild(b);
    });
    const tbs = $$("button", thumbs);
    s.fn = (p) => {
      const n = skins.length, idx = Math.min(n - 1, Math.floor(p * n * 0.999));
      if (idx === s.idx) return;
      s.idx = idx;
      skins.forEach((el, i) => { el.classList.toggle("is-on", i === idx); el.classList.toggle("is-past", i < idx); });
      infos.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      tbs.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      accentOverride = skins[idx].dataset.accent; setAccent(accentOverride);
    };
  })();

  /* ---- Making-of: Konzept → Blender → Spiel ---- */
  (function forge() {
    const s = byType.forge; if (!s) return;
    const steps = $$("[data-fsteps] li", s.el), badge = $("[data-fbadge]", s.el);
    s.fn = (p) => {
      const w2 = clamp((p - 0.18) / 0.26), w3 = clamp((p - 0.56) / 0.26);
      s.el.style.setProperty("--w2", (w2 * 100).toFixed(1) + "%");
      s.el.style.setProperty("--w3", (w3 * 100).toFixed(1) + "%");
      const moving2 = w2 > 0 && w2 < 1, moving3 = w3 > 0 && w3 < 1;
      s.el.style.setProperty("--ex", (moving3 ? w3 * 100 : w2 * 100).toFixed(1) + "%");
      s.el.style.setProperty("--eo", moving2 || moving3 ? "1" : "0");
      const idx = p < 0.33 ? 0 : p < 0.7 ? 1 : 2;
      if (idx !== s.idx) {
        s.idx = idx;
        steps.forEach((el, i) => el.classList.toggle("is-on", i === idx));
        if (badge) badge.textContent = pad(idx + 1) + " · " + $("h3", steps[idx]).textContent;
      }
    };
  })();

  /* ---- Ränge ---- */
  (function ranks() {
    const s = byType.ranks; if (!s) return;
    const items = $$(".nf-rank", s.el), infos = $$(".nf-rinfo", s.el);
    s.fn = (p) => {
      const n = items.length, idx = Math.min(n - 1, Math.floor(clamp(p * 1.08) * n * 0.999));
      if (idx === s.idx) return;
      s.idx = idx;
      items.forEach((el, i) => { el.classList.toggle("is-on", i === idx); el.classList.toggle("is-reached", i < idx); });
      infos.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      accentOverride = items[idx].dataset.accent; setAccent(accentOverride);
    };
  })();

  /* ───────── Scroll-Update ───────── */
  const timeline = $("[data-timeline]");
  let ticking = false, lastY = window.scrollY, scrollVel = 0;
  function update() {
    ticking = false;
    const sy = window.scrollY, vh = window.innerHeight;
    scrollVel += (sy - lastY - scrollVel) * 0.3; lastY = sy;

    scenes.forEach((s) => {
      const p = clamp((sy - s.top) / Math.max(1, s.h - s.stageH));
      if (Math.abs(p - s.p) > 0.0003) {
        s.p = p;
        s.el.style.setProperty("--p", p.toFixed(4));
        if (s.fn) s.fn(p, s);
      }
    });
    // aktives Kapitel (Mittellinie des Bildschirms)
    const mid = sy + vh * 0.5;
    let ci = 0;
    chapters.forEach((c, i) => { if (mid >= c.top) ci = i; });
    setChapter(ci);
    if (accentOverride) setAccent(accentOverride);
    // HUD
    const total = Math.max(1, docH - vh), tp = clamp(sy / total);
    if (progressBar) progressBar.style.transform = "scaleX(" + tp.toFixed(4) + ")";
    if (hudClock) { const sec = Math.round(tp * 270); hudClock.textContent = pad(Math.floor(sec / 60)) + ":" + pad(sec % 60); }
    // Zeitleiste
    if (timeline && timeline._h) timeline.style.setProperty("--tl", clamp((sy + vh * 0.62 - timeline._top) / timeline._h).toFixed(4));
  }
  function requestUpdate() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  /* ───────── Einblenden, Scramble, Zahlen ───────── */
  $$(".nf-r").forEach((el) => { if (el.dataset.d) el.style.setProperty("--d", el.dataset.d); });
  function scramble(el) {
    if (reduce || el._sc) return; el._sc = true;
    const nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) if (n.nodeValue.trim()) nodes.push([n, n.nodeValue]);
    const total = nodes.reduce((a, x) => a + x[1].length, 0), CH = "01<>/\\#$%&=+-_", frames = 22;
    let f = 0;
    const iv = setInterval(() => {
      f++; const reveal = Math.floor((total * f) / frames); let k = 0;
      nodes.forEach(([node, orig]) => { let out = ""; for (const c of orig) { out += k < reveal || c === " " ? c : CH[(Math.random() * CH.length) | 0]; k++; } node.nodeValue = out; });
      if (f >= frames) { clearInterval(iv); nodes.forEach(([node, orig]) => (node.nodeValue = orig)); }
    }, 34);
  }
  function countUp(el) {
    if (el._cu) return; el._cu = true;
    const to = +el.dataset.count || 0;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1500;
    (function step(t) { const k = clamp((t - t0) / dur); el.textContent = Math.round((1 - Math.pow(1 - k, 3)) * to); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("is-in");
        if (el.hasAttribute("data-scramble")) scramble(el);
        if (el.hasAttribute("data-count")) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    $$(".nf-r, [data-scramble], [data-count]").forEach((el) => io.observe(el));
  } else {
    $$(".nf-r").forEach((el) => el.classList.add("is-in"));
  }

  /* ───────── Fadenkreuz + Treffer-Marker (nur Maus) ───────── */
  const cross = $(".nf-cross");
  let cx = -100, cy = -100, tx = -100, ty = -100;
  if (cross && !coarse && !reduce) {
    body.classList.add("nf-has-cross");
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      const inMain = !!(e.target.closest && e.target.closest("main"));
      cross.classList.toggle("is-on", inMain);
      cross.classList.toggle("is-hot", !!(e.target.closest && e.target.closest("a,button")));
      if (heroStage) tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    }, { passive: true });
    document.addEventListener("pointerleave", () => cross.classList.remove("is-on"));
    window.addEventListener("pointerdown", (e) => {
      if (!(e.target.closest && e.target.closest("main"))) return;
      const h = document.createElement("div"); h.className = "nf-hit"; h.style.left = e.clientX + "px"; h.style.top = e.clientY + "px";
      document.body.appendChild(h); setTimeout(() => h.remove(), 480);
    });
  } else if (heroStage && !coarse) {
    window.addEventListener("pointermove", (e) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; }, { passive: true });
  }

  /* ───────── Partikel-Ebene ───────── */
  const fx = $("#nf-fx");
  const fxc = fx && fx.getContext("2d");
  let FW = 0, FH = 0, parts = [], streaks = [], nextStreak = 0;
  const COLS = ["126,232,255", "126,232,255", "255,61,168", "255,210,74", "255,255,255"];
  function fxResize() {
    if (!fx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    FW = fx.width = Math.round(window.innerWidth * dpr); FH = fx.height = Math.round(window.innerHeight * dpr);
    const n = coarse ? 26 : 64;
    parts = Array.from({ length: n }, () => ({ x: Math.random() * FW, y: Math.random() * FH, z: 0.2 + Math.random() * 0.8, c: COLS[(Math.random() * COLS.length) | 0], r: (0.6 + Math.random() * 1.8) * dpr }));
  }
  function fxFrame(t) {
    if (!fxc || !FW || !FH || !window.innerWidth) return;
    fxc.clearRect(0, 0, FW, FH);
    fxc.globalCompositeOperation = "lighter";
    const dpr = FW / window.innerWidth;
    parts.forEach((p) => {
      p.y -= (0.12 + p.z * 0.3) * dpr + scrollVel * p.z * 0.5 * dpr;
      p.x += Math.sin(t * 0.0004 + p.z * 9) * 0.15 * dpr;
      if (p.y < -10) { p.y = FH + 10; p.x = Math.random() * FW; } else if (p.y > FH + 10) { p.y = -10; p.x = Math.random() * FW; }
      fxc.fillStyle = "rgba(" + p.c + "," + (0.25 + p.z * 0.45) + ")";
      fxc.shadowColor = "rgba(" + p.c + ",0.9)"; fxc.shadowBlur = 8 * dpr;
      fxc.beginPath(); fxc.arc(p.x, p.y, p.r, 0, 6.283); fxc.fill();
    });
    fxc.shadowBlur = 0;
    if (t > nextStreak) { nextStreak = t + 2600 + Math.random() * 3800; streaks.push({ x: Math.random() * FW, y: -20, l: 90 + Math.random() * 160, v: (10 + Math.random() * 14) * dpr, c: Math.random() < 0.5 ? "255,61,168" : "126,232,255" }); }
    streaks = streaks.filter((s) => s.y < FH + 200);
    streaks.forEach((s) => {
      s.y += s.v; s.x += s.v * 0.18;
      const g = fxc.createLinearGradient(s.x, s.y, s.x - s.l * 0.18, s.y - s.l);
      g.addColorStop(0, "rgba(" + s.c + ",.9)"); g.addColorStop(1, "rgba(" + s.c + ",0)");
      fxc.strokeStyle = g; fxc.lineWidth = 2 * dpr; fxc.beginPath(); fxc.moveTo(s.x, s.y); fxc.lineTo(s.x - s.l * 0.18, s.y - s.l); fxc.stroke();
    });
    fxc.globalCompositeOperation = "source-over";
  }

  /* ───────── Dauer-Animation (Partikel, Zug, Fadenkreuz, Hero-Parallax) ───────── */
  let running = true, hudTop = -1;
  function followHeader() {   // HUD klebt unter dem Header und rutscht mit, wenn dieser beim Scrollen ausblendet
    let b = 0;
    [$(".second-navbar"), $(".navbar")].forEach((el) => { if (el) { const r = el.getBoundingClientRect(); if (r.height > 10) b = Math.max(b, r.bottom); } });
    b = Math.round(clamp(b, 0, 220));
    if (Math.abs(b - hudTop) >= 1) { hudTop = b; body.style.setProperty("--nf-hud-top", b + "px"); }
  }
  function loop(t) {
    if (!running) return;
    followHeader();
    // Fadenkreuz weich nachführen
    if (cross && body.classList.contains("nf-has-cross")) {
      cx += (tx - cx) * 0.35; cy += (ty - cy) * 0.35;
      cross.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    }
    // Hero: Maus-Parallax + Boden-Drift (nur solange sichtbar)
    if (heroStage && window.scrollY < window.innerHeight * 2.4) {
      mx += (tmx - mx) * 0.06;
      heroStage.style.setProperty("--mx", mx.toFixed(3));
      heroStage.style.setProperty("--gy", ((t * 0.045 + heroP * 2600) % 90).toFixed(1) + "px");
    }
    // Zug auf der Karte
    const j = byType.junction;
    if (j && j.trainTick && window.scrollY > j.top - window.innerHeight && window.scrollY < j.top + j.h) j.trainTick(t);
    // Partikel
    if (!reduce) fxFrame(t);
    requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(loop);
  });

  /* ───────── Start ───────── */
  function init() {
    drawCities();
    buildRail();
    measure();
    fxResize();
    update();
    if (!reduce) requestAnimationFrame(loop);
    else heroStage && heroStage.style.setProperty("--gy", "0px");
    window.addEventListener("scroll", requestUpdate, { passive: true });
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { measure(); fxResize(); update(); }, 120); });
    if ("ResizeObserver" in window) { let ro = 0; new ResizeObserver(() => { clearTimeout(ro); ro = setTimeout(() => { measure(); update(); }, 150); }).observe(document.body); }
    window.addEventListener("load", () => { measure(); update(); setTimeout(() => { measure(); update(); }, 600); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); update(); });
  }
  init();
})();
