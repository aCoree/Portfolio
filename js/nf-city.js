/* NEON FRONTIER – Skyline-Generator (zeichnet Neon-Stadt-Silhouetten in ein <canvas>).
   Wird auf neonfrontier.html für Hero und Fahrzeug-Szene benutzt. Alles ist
   "seeded": gleicher Seed = immer dieselbe Stadt (kein Flackern beim Neuladen). */
(function () {
  "use strict";

  function rng(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const WINDOW_COLORS = ["#7ee8ff", "#7ee8ff", "#7ee8ff", "#ff3da8", "#ffd24a", "#ffffff"];
  const LAYERS = {
    far:  { min: 26, max: 64,  hmin: 0.16, hmax: 0.52, top: "#101c3a", bottom: "#070d1c", edge: "rgba(126,232,255,.30)", win: 0.13, ww: 2.4, wh: 3.2, gx: 6, gy: 8,  wa: 0.55, signs: 0 },
    mid:  { min: 44, max: 104, hmin: 0.22, hmax: 0.72, top: "#0c1530", bottom: "#050a16", edge: "rgba(126,232,255,.45)", win: 0.17, ww: 3.4, wh: 4.4, gx: 8, gy: 11, wa: 0.8,  signs: 0.12 },
    near: { min: 70, max: 170, hmin: 0.26, hmax: 0.95, top: "#070c1c", bottom: "#030610", edge: "rgba(255,61,168,.55)", win: 0.2,  ww: 5,   wh: 7,   gx: 12, gy: 16, wa: 1,    signs: 0.22 },
  };

  function draw(canvas, opt) {
    opt = opt || {};
    const L = LAYERS[opt.layer] || LAYERS.mid;
    const w = (canvas.width = opt.w || 1600);
    const h = (canvas.height = opt.h || 500);
    const x = canvas.getContext("2d");
    const R = rng(opt.seed || 7);
    x.clearRect(0, 0, w, h);

    let cx = -30;
    while (cx < w + 30) {
      const bw = L.min + R() * (L.max - L.min);
      const bh = h * (L.hmin + R() * (L.hmax - L.hmin));
      const by = h - bh;

      // Körper
      const g = x.createLinearGradient(0, by, 0, h);
      g.addColorStop(0, L.top);
      g.addColorStop(1, L.bottom);
      x.fillStyle = g;
      x.fillRect(cx, by, bw, bh + 2);
      // Dachkante
      x.fillStyle = L.edge;
      x.fillRect(cx, by, bw, 1.6);
      x.fillRect(cx, by, 1.2, bh * 0.35);
      // Stufe / Antenne
      if (R() < 0.45) {
        const sw = bw * (0.3 + R() * 0.35), sh = 6 + R() * 22;
        x.fillStyle = L.top;
        x.fillRect(cx + (bw - sw) / 2, by - sh, sw, sh);
        x.fillStyle = L.edge;
        x.fillRect(cx + (bw - sw) / 2, by - sh, sw, 1.4);
      }
      if (R() < 0.35) {
        const ax = cx + bw * (0.3 + R() * 0.4), ah = 12 + R() * 34;
        x.fillStyle = "rgba(143,166,196,.55)";
        x.fillRect(ax, by - ah, 1.4, ah);
        x.fillStyle = R() < 0.5 ? "#ff3da8" : "#ff4d6a";
        x.shadowColor = x.fillStyle; x.shadowBlur = 8;
        x.fillRect(ax - 1, by - ah - 2, 3.4, 3.4);
        x.shadowBlur = 0;
      }
      // Fenster
      const cols = Math.max(1, Math.floor((bw - 6) / L.gx));
      const rows = Math.max(1, Math.floor((bh - 10) / L.gy));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (R() > L.win) continue;
          const col = WINDOW_COLORS[(R() * WINDOW_COLORS.length) | 0];
          x.globalAlpha = L.wa * (0.35 + R() * 0.65);
          x.fillStyle = col;
          if (opt.layer === "near" && R() < 0.12) { x.shadowColor = col; x.shadowBlur = 10; }
          x.fillRect(cx + 4 + c * L.gx, by + 8 + r * L.gy, L.ww, L.wh);
          x.shadowBlur = 0;
        }
      }
      x.globalAlpha = 1;
      // Neon-Schild
      if (L.signs && R() < L.signs && bh > h * 0.3) {
        const sx = cx + 4 + R() * Math.max(2, bw - 22), sy = by + 14 + R() * bh * 0.4;
        const sc = R() < 0.5 ? "#ff3da8" : R() < 0.5 ? "#7ee8ff" : "#ffd24a";
        x.shadowColor = sc; x.shadowBlur = 16;
        x.fillStyle = sc;
        if (R() < 0.5) x.fillRect(sx, sy, 3, 22 + R() * 30); else x.fillRect(sx, sy, 16 + R() * 26, 3);
        x.shadowBlur = 0;
      }
      cx += bw + (R() < 0.3 ? R() * 12 : 0);
    }
    // Dunst am Boden der Schicht (verschmilzt mit dem Horizont)
    const f = x.createLinearGradient(0, h * 0.55, 0, h);
    f.addColorStop(0, "rgba(120,20,110,0)");
    f.addColorStop(1, opt.layer === "near" ? "rgba(74,18,80,.55)" : "rgba(120,30,120,.45)");
    x.fillStyle = f;
    x.fillRect(0, h * 0.55, w, h * 0.45);
    return canvas;
  }

  window.NFCity = { draw: draw, rng: rng };
})();
