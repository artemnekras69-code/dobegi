/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — город: как он нарисован

   Фон — это печать вторым, более светлым прогоном: те же краски, что в игровом
   слое, но разбавленные бумагой, без чёрного и почти без контура. Глубина
   набирается плоскими тенями (правый бок дома темнее), а не градиентами.
   Геометрия нарочно неровная: дома чуть завалены, окна стоят не по линейке.

   Москву делают мелочи: кондиционеры, тарелки, застеклённые как попало лоджии,
   открытые форточки, домофоны, объявления с хвостиками, заборчик во дворе,
   теплотрасса аркой, плитка, люки и жёлто-белая «зебра».

   Слои (рисует city.js):
     дальний    силуэты одним цветом                       параллакс 0.06
     средний    дома целиком                               0.22
     фасады     первые этажи в настоящем масштабе          0.5
     улица      деревья, фонари, остановки                 0.72
     передний   провода, фонари на растяжках, ветки        1.35
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, clamp, hash3, mix, shade, poly } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors, ink = K.ink;
const T = ink.text;
const LIT = '#F3DF9A';                                   // свет в окне

const fr = (k, c, x, y, w, h) => { k.fillStyle = c; k.fillRect(x, y, w, h); };
const fp = (k, c, pts) => { k.fillStyle = c; k.beginPath(); poly(k, pts); k.fill(); };
function sl(k, c, lw, pts, close) {
  k.beginPath();
  k.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) k.lineTo(pts[i], pts[i + 1]);
  if (close) k.closePath();
  k.lineWidth = lw; k.strokeStyle = c; k.lineJoin = 'miter'; k.lineCap = 'butt';
  k.stroke();
}
const H = (seed, a, b, m) => hash3(seed, a, b) % m;

/* Крона, вырезанная ножницами: многоугольник, светлая грань слева сверху, тёмная — справа снизу */
function crown(k, cx, cy, rx, ry, c1, c2, seed, n) {
  n = n || 9;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + (H(seed, i, 1, 40) - 20) / 100, r = 0.82 + H(seed, i, 2, 34) / 100;
    pts.push(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r);
  }
  fp(k, c1, pts);
  fp(k, c2, [cx - rx * 0.62, cy - ry * 0.1, cx - rx * 0.3, cy - ry * 0.66, cx + rx * 0.2, cy - ry * 0.72, cx + rx * 0.05, cy - ry * 0.2, cx - rx * 0.3, cy + ry * 0.1]);
  fp(k, shade(c1, -0.1), [cx + rx * 0.15, cy + ry * 0.3, cx + rx * 0.7, cy + ry * 0.05, cx + rx * 0.62, cy + ry * 0.5, cx + rx * 0.1, cy + ry * 0.74]);
}
function trunk(k, x, h, w, c) {
  fp(k, c, [x - w / 2, 0, x + w / 2, 0, x + w * 0.3, -h, x - w * 0.3, -h]);
}

/* ───────────────────────────── ДАЛЬНИЙ ПЛАН ─────────────────────────────
   Силуэты одним цветом. draw(ctx) добавляет фигуры в текущий контур. */
const FarArt = {
  blocks: {
    w: 220,
    draw(ctx, it) {
      for (let i = 0, x = 0; i < 7; i++) {
        const w = 22 + H(it.seed, i, 1, 18), h = 46 + H(it.seed, i, 2, 86);
        ctx.rect(x, -h, w, h);
        if (H(it.seed, i, 4, 3) === 0) ctx.rect(x + w * 0.3, -h - 6, 7, 6);
        x += w + 3 + H(it.seed, i, 3, 8);
      }
    },
  },
  roofs: {          // рядовая застройка центра: низкие дома, скаты крыш, трубы
    w: 240,
    draw(ctx, it) {
      for (let i = 0, x = 0; i < 6; i++) {
        const w = 30 + H(it.seed, i, 1, 22), h = 30 + H(it.seed, i, 2, 34);
        ctx.rect(x, -h, w, h);
        poly(ctx, [x - 2, -h, x + w * 0.5, -h - 9 - H(it.seed, i, 4, 8), x + w + 2, -h]);
        if (H(it.seed, i, 3, 3) === 0) ctx.rect(x + w * 0.64, -h - 17, 5, 14);
        x += w + 2 + H(it.seed, i, 5, 6);
      }
    },
  },
  treeline: {       // кромка парка
    w: 260,
    draw(ctx, it) {
      for (let i = 0; i < 9; i++) {
        const x = i * 29 - 4, h = 34 + H(it.seed, i, 1, 26);
        poly(ctx, [x, 0, x + 3, -h * 0.6, x + 12, -h, x + 24, -h * 0.9, x + 33, -h * 0.5, x + 34, 0]);
      }
    },
  },
  cranes: {
    w: 170,
    draw(ctx) {
      ctx.rect(40, -160, 3, 160); ctx.rect(8, -160, 104, 2.6); ctx.rect(8, -160, 13, 11); ctx.rect(92, -158, 1, 34); ctx.rect(88, -126, 9, 6);
      ctx.rect(128, -112, 2.6, 112); ctx.rect(96, -112, 74, 2.2); ctx.rect(156, -112, 11, 9);
      ctx.rect(0, -44, 70, 44); ctx.rect(84, -62, 40, 62);
    },
  },
  chimneys: {       // ТЭЦ: трубы и градирня
    w: 190,
    draw(ctx) {
      poly(ctx, [20, 0, 26, -150, 34, -150, 40, 0]);
      poly(ctx, [68, 0, 73, -118, 80, -118, 85, 0]);
      poly(ctx, [112, 0, 119, -172, 128, -172, 135, 0]);
      poly(ctx, [146, 0, 153, -42, 151, -66, 181, -66, 179, -42, 186, 0]);
      poly(ctx, [28, -152, 36, -166, 52, -170, 66, -184, 60, -168, 44, -158]);      // дым клином
      poly(ctx, [160, -68, 170, -82, 190, -86, 178, -72]);
      ctx.rect(0, -30, 60, 30);
    },
  },
  ostankino: {      // Останкинская башня
    w: 40, scale: 1.25,
    draw(ctx) {
      poly(ctx, [6, 0, 16, -62, 17.5, -176, 22.5, -176, 24, -62, 34, 0]);
      ctx.rect(13, -196, 14, 22);
      ctx.rect(15, -214, 10, 18);
      ctx.rect(18.8, -300, 2.4, 90);
    },
  },
  city: {           // Москва-Сити
    w: 260,
    draw(ctx) {
      ctx.rect(-8, -26, 268, 26);
      poly(ctx, [0, 0, 0, -118, 26, -128, 26, 0]);
      poly(ctx, [34, 0, 34, -190, 50, -236, 64, -196, 64, 0]);
      ctx.rect(49, -266, 2, 32);
      poly(ctx, [70, 0, 70, -148, 81, -176, 92, -148, 92, 0]);
      ctx.rect(100, -150, 30, 150); ctx.rect(104, -178, 22, 30); ctx.rect(108, -198, 14, 22);
      poly(ctx, [138, 0, 143, -62, 136, -122, 146, -152, 164, -152, 158, -122, 166, -62, 160, 0]);
      poly(ctx, [172, 0, 172, -158, 196, -172, 196, 0]);
      ctx.rect(204, -138, 18, 138); ctx.rect(226, -164, 20, 164); ctx.rect(230, -172, 12, 10);
    },
  },
  vysotka: {        // сталинская высотка
    w: 140,
    draw(ctx) {
      poly(ctx, [0, 0, 0, -50, 24, -50, 24, -80, 46, -80, 46, -130, 58, -130, 58, -165, 66, -180, 70, -232,
                 74, -180, 82, -165, 82, -130, 94, -130, 94, -80, 116, -80, 116, -50, 140, -50, 140, 0]);
    },
  },
  kremlin: {        // стена, Спасская башня, колокольня Ивана Великого
    w: 300,
    draw(ctx) {
      ctx.rect(0, -40, 300, 40);
      for (let x = 2; x < 298; x += 11) poly(ctx, [x, -40, x, -48, x + 3, -45, x + 6, -48, x + 6, -40]);     // зубцы «ласточкин хвост»
      ctx.rect(120, -92, 34, 92); ctx.rect(125, -122, 24, 30);
      poly(ctx, [125, -122, 149, -122, 137, -172]);
      poly(ctx, [137, -186, 141.5, -178, 137, -170, 132.5, -178]);
      ctx.rect(30, -70, 22, 70); poly(ctx, [29, -70, 53, -70, 41, -106]);
      ctx.rect(244, -64, 20, 64); poly(ctx, [243, -64, 265, -64, 254, -96]);
      ctx.rect(190, -128, 14, 128); poly(ctx, [188, -128, 190, -138, 197, -146, 204, -138, 206, -128]); ctx.rect(196.2, -160, 1.6, 15);
    },
  },
  basil: {          // купола собора Василия Блаженного
    w: 110,
    draw(ctx) {
      ctx.rect(4, -40, 102, 40);
      poly(ctx, [44, 0, 44, -82, 55, -132, 66, -82, 66, 0]);
      poly(ctx, [50, -134, 55, -144, 60, -134, 55, -128]); ctx.rect(54.3, -156, 1.4, 12);
      for (const [x, h] of [[8, 58], [26, 74], [70, 74], [88, 58]]) {
        ctx.rect(x, -h, 14, h);
        poly(ctx, [x - 2, -h - 4, x + 1, -h - 15, x + 7, -h - 27, x + 13, -h - 15, x + 16, -h - 4, x + 12, -h, x + 2, -h]);      // луковка
      }
    },
  },
  hhs: {            // Храм Христа Спасителя
    w: 170, scale: 1.15,
    draw(ctx) {
      ctx.rect(22, -70, 126, 70);
      ctx.rect(58, -104, 54, 34);
      poly(ctx, [55, -104, 58, -122, 70, -134, 85, -138, 100, -134, 112, -122, 115, -104]);
      poly(ctx, [78, -136, 92, -136, 85, -154]);
      ctx.rect(84, -168, 2, 14); ctx.rect(81, -164, 8, 2);
      for (const x of [18, 128]) { ctx.rect(x, -92, 24, 22); poly(ctx, [x, -92, x + 3, -102, x + 12, -108, x + 21, -102, x + 24, -92]); ctx.rect(x + 11.2, -118, 1.6, 10); }
    },
  },
  shater: {         // шатровая церковь в Коломенском
    w: 60,
    draw(ctx) {
      ctx.rect(0, -30, 60, 30);
      poly(ctx, [14, 0, 14, -72, 20, -80, 30, -172, 40, -80, 46, -72, 46, 0]);
      ctx.rect(29.2, -186, 1.6, 14); ctx.rect(26.5, -182, 7, 1.6);
    },
  },
  luzhniki: {       // чаша стадиона
    w: 240,
    draw(ctx) {
      poly(ctx, [0, 0, 8, -34, 40, -48, 200, -48, 232, -34, 240, 0]);
      for (const x of [30, 210]) { ctx.rect(x, -92, 2.4, 46); ctx.rect(x - 7, -96, 16, 6); }
    },
  },
  rechnoy: {        // Северный речной вокзал со шпилем
    w: 200,
    draw(ctx) {
      ctx.rect(0, -30, 200, 30);
      ctx.rect(70, -46, 60, 16);
      ctx.rect(88, -78, 24, 34);
      poly(ctx, [94, -78, 106, -78, 100, -156]);
      poly(ctx, [100, -168, 104, -160, 100, -154, 96, -160]);
    },
  },
  ferris: {         // колесо обозрения
    w: 150, own: true,
    draw(ctx, it, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, x = 75 + Math.cos(a) * 70, y = -88 + Math.sin(a) * 70; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.moveTo(75, -88); ctx.lineTo(75 + Math.cos(a) * 70, -88 + Math.sin(a) * 70); }
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(75, -88); ctx.lineTo(44, 0); ctx.moveTo(75, -88); ctx.lineTo(106, 0); ctx.stroke();
      ctx.fillStyle = color;
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.fillRect(75 + Math.cos(a) * 70 - 5, -88 + Math.sin(a) * 70 - 4, 10, 8); }
    },
  },
};

/* ───────────────────────────── СРЕДНИЙ ПЛАН: ДОМА ЦЕЛИКОМ ─────────────────────────────
   Рисуются один раз во внеэкранный холст. Начало координат — левый нижний угол.
   Окна трёх тонов: обычные, светящиеся и тёмные (открытые). */
function winGrid(k, b, x, top, w, h, cw, ch, gx, gy, litPct) {
  const cols = Math.max(1, Math.floor((w + gx) / (cw + gx))), rows = Math.max(1, Math.floor((h + gy) / (ch + gy)));
  const ox = x + (w - (cols * (cw + gx) - gx)) / 2;
  const pct = litPct === undefined ? b.litPct : litPct;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = H(b.seed, r, c, 100), jx = (H(b.seed, r + 50, c, 3) - 1) * 0.5;
      k.fillStyle = v < pct ? b.lit : v > 88 ? b.dark : b.win;
      k.fillRect(ox + c * (cw + gx) + jx, top + r * (ch + gy), cw, ch);
    }
  }
}
/* Хлам на крыше: антенны, тарелка, будка лифта */
function roofJunk(k, b, y, x0, x1) {
  k.fillStyle = b.body;
  const n = 1 + H(b.seed, 7, 7, 3);
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (0.15 + 0.3 * i + H(b.seed, i, 9, 10) / 100), kind = H(b.seed, i, 11, 3);
    if (kind === 0) { k.fillRect(x, y - 20, 1.4, 20); k.fillRect(x - 4, y - 18, 9.4, 1.2); k.fillRect(x - 2.6, y - 14, 6.6, 1.2); }
    else if (kind === 1) { k.fillRect(x, y - 8, 16, 8); k.fillRect(x + 3, y - 12, 5, 4); }
    else { k.beginPath(); poly(k, [x, y - 4, x + 3, y - 11, x + 10, y - 12, x + 9, y - 5, x + 5, y]); k.fill(); k.fillRect(x + 4, y - 4, 1.4, 4); }
  }
}

const BackArt = {
  panel: {
    dims: r => ({ w: r.range(110, 170), h: r.range(0.42, 0.62), extra: 24 }),
    draw(k, b) {
      fr(k, b.body, 0, -b.h, b.w, b.h);
      fr(k, b.dark, b.w - 7, -b.h, 7, b.h);                                         // теневой бок
      roofJunk(k, b, -b.h, 6, b.w - 20);
      winGrid(k, b, 9, -b.h + 11, b.w - 24, b.h - 20, 7, 8, 6, 8);
    },
  },
  panelTall: {
    dims: r => ({ w: r.range(76, 104), h: r.range(0.62, 0.84), extra: 24 }),
    draw(k, b) { BackArt.panel.draw(k, b); },
  },
  khrush: {
    dims: r => ({ w: r.range(170, 250), h: r.range(0.2, 0.26), extra: 22, minH: 66 }),
    draw(k, b) {
      fr(k, b.body, 0, -b.h, b.w, b.h);
      fp(k, b.dark, [-3, -b.h, 8, -b.h - 9, b.w - 8, -b.h - 9, b.w + 3, -b.h]);
      roofJunk(k, b, -b.h - 9, 12, b.w - 30);
      winGrid(k, b, 10, -b.h + 9, b.w - 20, b.h - 26, 8, 8, 9, 7);
      for (let x = 24; x < b.w - 20; x += 62) fr(k, b.win, x, -13, 9, 13);
    },
  },
  tower: {
    dims: r => ({ w: r.range(70, 100), h: r.range(0.7, 1), extra: 34 }),
    draw(k, b) {
      fr(k, b.body, 0, -b.h, b.w, b.h);
      fr(k, b.dark, b.w - 6, -b.h, 6, b.h);
      fr(k, b.body, b.w * 0.25, -b.h - 10, b.w * 0.5, 10);
      fr(k, b.body, b.w / 2 - 1, -b.h - 32, 2, 22);
      winGrid(k, b, 7, -b.h + 9, b.w - 20, b.h - 16, 5, 9, 4, 6);
    },
  },
  site: {       // стройка с краном
    dims: r => ({ w: r.range(96, 124), h: r.range(0.45, 0.68), extra: 70 }),
    draw(k, b) {
      const solid = b.h * 0.55;
      fr(k, b.body, 0, -solid, b.w, solid);
      winGrid(k, b, 8, -solid + 9, b.w - 16, solid - 14, 7, 8, 6, 8, 0);
      k.fillStyle = b.body;
      for (let y = -solid; y > -b.h; y -= 16) k.fillRect(0, y - 2.5, b.w, 2.5);
      for (let x = 0; x <= b.w - 3; x += (b.w - 3) / 4) k.fillRect(x, -b.h, 3, b.h - solid);
      const mx = b.w * 0.72;
      k.fillStyle = b.accent;
      k.fillRect(mx, -b.h - 62, 3.5, b.h + 62);
      k.fillRect(b.w * 0.06, -b.h - 60, b.w * 0.94, 3);
      k.fillRect(mx + 8, -b.h - 60, 14, 11);
      k.fillRect(b.w * 0.2, -b.h - 57, 1.2, 30);
      k.fillRect(b.w * 0.2 - 4, -b.h - 28, 9, 6);
    },
  },
  stalin: {     // сталинская высотка
    dims: r => ({ w: r.range(124, 156), h: r.range(0.62, 0.78), extra: 0, spire: 0.32 }),
    draw(k, b) {
      const t1 = b.h * 0.56, t2 = b.h * 0.26, t3 = b.h * 0.18, top = t1 + t2 + t3;
      k.fillStyle = b.body;
      k.fillRect(0, -t1, b.w, t1);
      k.fillRect(b.w * 0.2, -t1 - t2, b.w * 0.6, t2);
      k.fillRect(b.w * 0.34, -top, b.w * 0.32, t3);
      k.fillRect(2, -t1 - 14, 12, 14);
      k.fillRect(b.w - 14, -t1 - 14, 12, 14);
      fp(k, b.body, [b.w * 0.42, -top, b.w * 0.58, -top, b.w * 0.5, -top - b.h * 0.26]);
      k.fillRect(b.w / 2 - 1, -top - b.h * 0.3, 2, b.h * 0.1);
      fr(k, b.dark, b.w - 7, -t1, 7, t1);
      winGrid(k, b, 8, -t1 + 10, b.w - 22, t1 - 16, 6, 9, 6, 7);
      winGrid(k, b, b.w * 0.2 + 7, -t1 - t2 + 8, b.w * 0.6 - 14, t2 - 10, 6, 9, 6, 7);
      winGrid(k, b, b.w * 0.34 + 6, -top + 7, b.w * 0.32 - 12, t3 - 9, 5, 8, 5, 6);
    },
  },
  old: {        // старый дом с мансардой
    dims: r => ({ w: r.range(124, 190), h: r.range(0.28, 0.4), extra: 30, minH: 84 }),
    draw(k, b) {
      fp(k, b.dark, [0, -b.h, 9, -b.h - 15, b.w - 9, -b.h - 15, b.w, -b.h]);
      fr(k, b.dark, b.w * 0.2, -b.h - 25, 8, 12);
      fr(k, b.dark, b.w * 0.7, -b.h - 23, 8, 10);
      fr(k, b.body, 0, -b.h, b.w, b.h);
      fr(k, b.dark, -2, -b.h - 1, b.w + 4, 3.5);
      fr(k, b.dark, 0, -26, b.w, 2);
      winGrid(k, b, 10, -b.h + 11, b.w - 20, b.h - 42, 6, 12, 9, 9);
      for (let x = 12; x < b.w - 16; x += 22) fp(k, b.win, [x, 0, x, -14, x + 2, -18, x + 8, -18, x + 10, -14, x + 10, 0]);
    },
  },
  glass: {      // стеклянная башня
    dims: r => ({ w: r.range(64, 96), h: r.range(0.76, 1.05), extra: 30 }),
    draw(k, b) {
      const slant = 22 * (b.seed % 2 ? 1 : -1);
      const yl = -b.h + Math.max(0, slant), yr = -b.h + Math.max(0, -slant);
      fp(k, b.body, [0, 0, 0, yl, b.w, yr, b.w, 0]);
      fr(k, b.body, b.w * (slant > 0 ? 0.82 : 0.14), -b.h - 26, 1.8, 28);
      k.fillStyle = b.win;
      for (let y = -b.h + 34; y < -8; y += 9) k.fillRect(5, y, b.w - 10, 4);
      fp(k, b.lit, [b.w * 0.2, -b.h * 0.2, b.w * 0.34, -b.h * 0.2, b.w * 0.7, -b.h * 0.7, b.w * 0.56, -b.h * 0.7]);      // блик полосой
    },
  },
  cityTower: {  // башни Сити вблизи: уходят за верх экрана
    dims: r => ({ w: r.range(90, 140), h: r.range(1.25, 2.1), extra: 40 }),
    draw(k, b) {
      const kind = b.seed % 3;
      k.fillStyle = b.body;
      k.beginPath();
      if (kind === 0) poly(k, [0, 0, 0, -b.h + 50, b.w, -b.h, b.w, 0]);
      else if (kind === 1) poly(k, [6, 0, 0, -b.h * 0.5, 8, -b.h, b.w - 8, -b.h, b.w, -b.h * 0.5, b.w - 6, 0]);
      else { k.rect(0, -b.h * 0.72, b.w, b.h * 0.72); k.rect(b.w * 0.14, -b.h * 0.88, b.w * 0.72, b.h * 0.2); k.rect(b.w * 0.3, -b.h, b.w * 0.4, b.h * 0.14); }
      k.fill();
      k.fillStyle = b.win;
      for (let y = -b.h + 20; y < -10; y += 11) k.fillRect(kind === 1 ? 9 : 5, y, b.w - (kind === 1 ? 18 : 10), 5);
      k.fillStyle = b.body;
      for (let x = b.w * 0.25; x < b.w; x += b.w * 0.25) k.fillRect(x - 1, -b.h, 2, b.h);
      fp(k, b.lit, [b.w * 0.12, -b.h * 0.1, b.w * 0.26, -b.h * 0.1, b.w * 0.74, -b.h * 0.62, b.w * 0.6, -b.h * 0.62]);     // отражение неба
    },
  },
  newblock: {   // новый жилой комплекс
    dims: r => ({ w: r.range(96, 150), h: r.range(0.6, 0.95), extra: 20 }),
    draw(k, b) {
      fr(k, b.body, 0, -b.h, b.w * 0.62, b.h);
      fr(k, b.body, b.w * 0.62, -b.h * 0.82, b.w * 0.38, b.h * 0.82);
      fr(k, b.accent, b.w * 0.26, -b.h, 7, b.h);
      fr(k, b.accent, b.w * 0.8, -b.h * 0.82, 6, b.h * 0.82);
      fr(k, b.body, b.w * 0.1, -b.h - 8, 20, 8);
      winGrid(k, b, 7, -b.h + 10, b.w * 0.62 - 14, b.h - 18, 8, 9, 5, 7);
      winGrid(k, b, b.w * 0.62 + 6, -b.h * 0.82 + 10, b.w * 0.38 - 12, b.h * 0.82 - 18, 8, 9, 5, 7);
    },
  },
  factory: {    // промзона: шедовая крыша, труба и буквы на корпусе
    dims: r => ({ w: r.range(200, 280), h: r.range(0.24, 0.32), extra: 110, minH: 76 }),
    draw(k, b) {
      fr(k, b.body, 0, -b.h, b.w, b.h);
      k.beginPath();
      for (let x = 0; x < b.w - 20; x += 34) poly(k, [x, -b.h, x, -b.h - 16, x + 34, -b.h]);
      k.fill();
      fp(k, b.accent, [b.w * 0.8, -b.h, b.w * 0.8 + 4, -b.h - 100, b.w * 0.8 + 13, -b.h - 100, b.w * 0.8 + 17, -b.h]);
      fr(k, b.lit, b.w * 0.8 + 4.5, -b.h - 92, 8, 6);
      fr(k, b.lit, b.w * 0.8 + 5.2, -b.h - 76, 6.6, 6);
      winGrid(k, b, 10, -b.h + 12, b.w - 20, b.h - 36, 16, 12, 6, 8, 4);
      if (b.seed % 2 === 0) { fr(k, b.dark, b.w * 0.16, -b.h + 8, b.w * 0.44, 15); T(k, 'МОСКВИЧ', b.w * 0.38, -b.h + 16, { size: 12, maxW: b.w * 0.4, color: b.body }); }
    },
  },
  pavilionBack: {   // павильон ВДНХ: колоннада, ярусы, шпиль со звездой
    place: true,
    dims: r => ({ w: r.range(150, 200), h: r.range(0.36, 0.46), extra: 130, minH: 100 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h * 0.7, b.w, b.h * 0.7);
      k.fillRect(b.w * 0.16, -b.h, b.w * 0.68, b.h * 0.34);
      k.fillRect(b.w * 0.34, -b.h - 30, b.w * 0.32, 32);
      k.fillRect(b.w * 0.43, -b.h - 56, b.w * 0.14, 28);
      fp(k, b.body, [b.w * 0.46, -b.h - 56, b.w * 0.54, -b.h - 56, b.w * 0.5, -b.h - 110]);
      fp(k, b.gold, [b.w * 0.5, -b.h - 124, b.w * 0.5 + 5, -b.h - 113, b.w * 0.5, -b.h - 106, b.w * 0.5 - 5, -b.h - 113]);
      k.fillStyle = b.win;
      for (let x = 10; x < b.w - 10; x += 16) k.fillRect(x, -b.h * 0.62, 6, b.h * 0.62);
      fr(k, b.body, 0, -10, b.w, 10);
    },
  },
  church: {
    place: true,
    dims: r => ({ w: r.range(74, 100), h: r.range(0.26, 0.34), extra: 120, minH: 80 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(b.w * 0.2, -b.h, b.w * 0.8, b.h);
      k.fillRect(b.w * 0.48, -b.h - 26, b.w * 0.3, 26);
      k.fillRect(0, -b.h - 40, b.w * 0.26, b.h + 40);
      fp(k, b.body, [0, -b.h - 40, b.w * 0.26, -b.h - 40, b.w * 0.13, -b.h - 84]);
      const cx = b.w * 0.63, cy = -b.h - 26;
      fp(k, b.gold, [cx - 9, cy, cx - 13, cy - 9, cx - 9, cy - 19, cx, cy - 36, cx + 9, cy - 19, cx + 13, cy - 9, cx + 9, cy]);
      fr(k, b.gold, cx - 0.8, cy - 48, 1.6, 13);
      fr(k, b.gold, b.w * 0.13 - 0.8, -b.h - 96, 1.6, 13);
      for (let x = b.w * 0.3; x < b.w - 12; x += 18) fp(k, b.win, [x, -b.h * 0.5 + 16, x, -b.h * 0.5, x + 4, -b.h * 0.5 - 5, x + 8, -b.h * 0.5, x + 8, -b.h * 0.5 + 16]);
    },
  },
};

/* ───────────────────────────── ФАСАДЫ ─────────────────────────────
   Ближний ряд домов в настоящем масштабе. */
const STYLES = {
  // ac — доля окон с кондиционером (%), pipes — водосточные трубы, brick — кирпичная кладка
  panel:      { w: [230, 330], floors: [5, 7],  floorH: 60, groundH: 66,  bayW: 46, win: 'panel',  ground: 'plain', roof: 'flat', ac: 16, dish: 5 },
  panelShop:  { w: [250, 340], floors: [5, 7],  floorH: 60, groundH: 96,  bayW: 46, win: 'panel',  ground: 'shop',  roof: 'flat', ac: 16, dish: 5 },
  khrush:     { w: [250, 340], floors: [4, 4],  floorH: 56, groundH: 60,  bayW: 42, win: 'rect',   ground: 'plain', roof: 'hip', ac: 12, pipes: true, brick: true, dish: 7 },
  stalin:     { w: [240, 320], floors: [4, 6],  floorH: 72, groundH: 98,  bayW: 54, win: 'tall',   ground: 'rust',  roof: 'cornice', pilasters: true, ac: 7, pipes: true },
  stalinShop: { w: [250, 330], floors: [4, 6],  floorH: 72, groundH: 104, bayW: 54, win: 'tall',   ground: 'shop',  roof: 'cornice', pilasters: true, ac: 7, pipes: true },
  old:        { w: [190, 270], floors: [1, 3],  floorH: 80, groundH: 92,  bayW: 50, win: 'arched', ground: 'plain', roof: 'mansard', bands: true, pipes: true },
  oldShop:    { w: [200, 280], floors: [1, 3],  floorH: 80, groundH: 104, bayW: 50, win: 'arched', ground: 'shop',  roof: 'mansard', bands: true, pipes: true },
  glass:      { w: [210, 300], floors: [8, 12], floorH: 54, groundH: 112, bayW: 40, win: 'strip',  ground: 'lobby', roof: 'none' },
  newbuild:   { w: [220, 300], floors: [6, 9],  floorH: 62, groundH: 86,  bayW: 50, win: 'modern', ground: 'plain', roof: 'flat', ac: 4 },
  newShop:    { w: [230, 310], floors: [6, 9],  floorH: 62, groundH: 104, bayW: 50, win: 'modern', ground: 'shop',  roof: 'flat', ac: 4 },
};

/* Стекло с тем, что за ним: шторы, открытая створка, свет, цветок */
function pane(k, x, y, w, h, col, v) {
  const lit = v % 100 < 8;
  fr(k, lit ? col.lit : col.glass, x, y, w, h);
  const m = (v >> 7) % 100;
  if (lit) return;
  if (m < 16) {                                        // шторы
    fp(k, col.curtain, [x, y, x + w * 0.44, y, x + w * 0.12, y + h, x, y + h]);
    fp(k, col.curtain, [x + w, y, x + w * 0.56, y, x + w * 0.88, y + h, x + w, y + h]);
  } else if (m < 27) {                                 // створка нараспашку
    fr(k, col.deep, x + w * 0.5, y, w * 0.5, h);
    fp(k, col.sash, [x + w * 0.5, y, x + w * 0.82, y + 2.4, x + w * 0.82, y + h - 1.4, x + w * 0.5, y + h]);
  } else if (m < 35) {                                 // тюль до половины
    fr(k, col.curtain, x, y, w, h * 0.42);
  } else if (m < 42) {                                 // цветок на подоконнике
    fp(k, col.leaf, [x + w * 0.2, y + h, x + w * 0.24, y + h * 0.6, x + w * 0.36, y + h * 0.72, x + w * 0.42, y + h * 0.5, x + w * 0.5, y + h * 0.76, x + w * 0.56, y + h]);
  } else if (m < 47) {                                 // окно заложили фанерой
    fr(k, col.dark, x, y, w, h);
  }
}

function drawWindow(k, type, cx, y0, bw, fH, col, h, fl, b) {
  const jx = ((h >> 3) % 3 - 1) * 0.6, jy = ((h >> 5) % 3 - 1) * 0.5;
  cx += jx;
  if (type === 'rect' || type === 'panel') {
    const ww = bw * (type === 'panel' ? 0.56 : 0.5), wh = fH * 0.5, x = cx - ww / 2, y = y0 - fH * 0.24 - wh + jy;
    const balcony = type === 'panel' && (h >> 8) % 3 === 0;
    if (balcony && (h >> 12) % 3) {                     // лоджия застеклена: каждый стеклил как мог
      const tones = [col.trim, col.curtain, mix(col.wall, C.blue, 0.25), mix(col.wall, C.brick, 0.22)], tone = tones[(h >> 14) % 4];
      fr(k, tone, cx - bw * 0.44, y0 - fH * 0.86, bw * 0.88, fH * 0.7);
      pane(k, cx - bw * 0.4, y0 - fH * 0.82, bw * 0.8, fH * 0.36, col, h >> 2);
      fr(k, tone, cx - bw * 0.14, y0 - fH * 0.82, 1.6, fH * 0.36);
      fr(k, tone, cx + bw * 0.13, y0 - fH * 0.82, 1.6, fH * 0.36);
      sl(k, col.line, 1, [cx - bw * 0.44, y0 - fH * 0.86, cx + bw * 0.44, y0 - fH * 0.86, cx + bw * 0.44, y0 - fH * 0.16, cx - bw * 0.44, y0 - fH * 0.16], true);
      return;
    }
    pane(k, x, y, ww, wh, col, h);
    fr(k, col.frame, cx - 0.8, y, 1.6, wh);
    if (type === 'rect') fr(k, col.frame, x, y + wh * 0.3, ww * 0.5, 1.3);          // форточка
    sl(k, col.line, 1, [x, y, x + ww, y, x + ww, y + wh, x, y + wh], true);
    if (balcony) {                                      // открытый балкон: решётка и то, что на нём хранят
      const bx = cx - bw * 0.42, by = y0 - fH * 0.5, bwid = bw * 0.84, bh = fH * 0.34;
      const stuff = (h >> 16) % 4;
      if (stuff === 0) { fr(k, col.curtain, bx + 5, by - 9, 7, 9); fr(k, mix(col.wall, C.brick, 0.4), bx + 14, by - 12, 6, 12); }   // бельё
      else if (stuff === 1) sl(k, col.line, 1.4, [bx + bwid * 0.3, by - 2, bx + bwid * 0.36, by - 13, bx + bwid * 0.6, by - 13, bx + bwid * 0.66, by - 2]);  // велосипед
      fr(k, col.dark, bx, by, bwid, bh);
      fr(k, col.trim, bx, by, bwid, 2.4);
      k.fillStyle = col.line;
      for (let rx = bx + 4; rx < bx + bwid - 2; rx += 5) k.fillRect(rx, by + 2.4, 1, bh - 2.4);
    }
  } else if (type === 'tall') {
    const ww = bw * 0.42, wh = fH * 0.62, x = cx - ww / 2, y = y0 - fH * 0.2 - wh + jy;
    fr(k, col.trim, x - 3.5, y - 3.5, ww + 7, wh + 7);
    fr(k, col.trim, x - 6, y + wh + 2, ww + 12, 3.5);
    if (fl % 2 === 0) fp(k, col.trim, [x - 5, y - 3.5, cx, y - 10, x + ww + 5, y - 3.5]);              // сандрик
    pane(k, x, y, ww, wh, col, h);
    fr(k, col.trim, cx - 1, y, 2, wh);
    fr(k, col.trim, x, y + wh * 0.3, ww, 2);
    if (fl === 1 && b % 3 === 1) {                      // балкон с балясинами
      fr(k, col.trim, x - 9, y + wh - 4, ww + 18, 4);
      k.fillStyle = col.trim;
      for (let bx = x - 8; bx < x + ww + 8; bx += 5) k.fillRect(bx, y + wh - 16, 2, 13);
      fr(k, col.trim, x - 9, y + wh - 18, ww + 18, 3);
    }
  } else if (type === 'arched') {
    const ww = bw * 0.44, wh = fH * 0.46, x = cx - ww / 2, y = y0 - fH * 0.2 - wh + jy, r = ww / 2;
    fp(k, col.trim, [x - 4, y + wh + 3, x - 4, y, x - 2, y - r * 0.6, cx - r * 0.5, y - r - 2, cx + r * 0.5, y - r - 2, x + ww + 2, y - r * 0.6, x + ww + 4, y, x + ww + 4, y + wh + 3]);
    fr(k, col.trim, x - 7, y + wh + 2, ww + 14, 3.5);
    pane(k, x, y, ww, wh, col, h);
    fp(k, (h % 100 < 8) ? col.lit : col.glass, [x, y, x + 1.4, y - r * 0.5, cx - r * 0.4, y - r + 1.4, cx + r * 0.4, y - r + 1.4, x + ww - 1.4, y - r * 0.5, x + ww, y]);
    fr(k, col.trim, cx - 1, y - r + 1, 2, wh + r - 1);
    fr(k, col.trim, x, y, ww, 2);
  } else if (type === 'modern') {
    const ww = bw * 0.6, wh = fH * 0.62, x = cx - ww / 2, y = y0 - fH * 0.18 - wh;
    if ((h >> 6) % 4 === 0) fr(k, col.accent, cx - bw / 2 - jx, y0 - fH, bw, fH);
    fr(k, col.deep, x - 1.5, y - 1.5, ww + 3, wh + 3);
    pane(k, x, y, ww, wh, col, h);
    fr(k, col.deep, x + ww * 0.62, y, 1.5, wh);
    if ((h >> 10) % 5 === 0) { fr(k, col.deep, x - 3, y + wh - 1, ww + 6, 2); k.fillStyle = col.line; for (let rx = x - 2; rx < x + ww + 3; rx += 4) k.fillRect(rx, y + wh - 13, 1, 12); fr(k, col.line, x - 3, y + wh - 14, ww + 6, 1.6); }   // французский балкон
  }
}

/* Объявление с хвостиками: бумага, скотч, крупное слово и приписка мелко */
function notice(k, x, y, w, h, lines, seed) {
  k.save();
  k.translate(x + w / 2, y + h / 2);
  k.rotate(((seed % 7) - 3) * 0.012);
  k.translate(-w / 2, -h / 2);
  const body = h * 0.8, n = Math.max(4, Math.round(w / 9)), tw = w / n;
  for (let i = 0; i < n; i++) {
    const torn = H(seed, i, 3, 4) === 0;
    fr(k, C.white, i * tw + 0.5, body, tw - 1, torn ? 2 + H(seed, i, 5, 3) : h - body);
  }
  fr(k, C.white, 0, 0, w, body);
  fr(k, C.ink2, 0, 0, w, body * 0.26);
  T(k, lines[0], w / 2, body * 0.14, { size: body * 0.2, maxW: w - 6, color: C.white });
  T(k, lines[1], w / 2, body * 0.46, { size: body * 0.26, maxW: w - 6, color: C.ink2 });
  if (lines[2]) T(k, lines[2], w / 2, body * 0.7, { size: body * 0.15, maxW: w - 6, color: C.ink2, font: FONT.text, weight: 800 });
  if (lines[3]) T(k, lines[3], w / 2, body * 0.87, { size: body * 0.1, maxW: w - 6, color: C.muted, font: FONT.text, weight: 700 });
  sl(k, 'rgba(46,41,37,.45)', 1, [0, 0, w, 0, w, body, 0, body], true);
  fp(k, 'rgba(224,190,139,.9)', [-4, -3, 7, -5, 8, 2, -3, 4]);                                           // скотч
  fp(k, 'rgba(224,190,139,.9)', [w - 7, -5, w + 4, -3, w + 3, 4, w - 8, 2]);
  k.restore();
}

/* Одно заведение на первом этаже: вывеска, витрина, дверь */
function shopWindow(k, cat, b, x, y, w, h, seed, col) {
  if (w < 10) return;
  const tone = b.bg === '#FFFFFF' || b.bg === C.white ? b.fg : b.bg;
  if (cat === 'grocery') {                              // ценники-плакаты в окне
    for (let i = 0, px = x + 4; px + 16 < x + w; i++, px += 24) {
      const c = i % 2 ? C.yellow : tone;
      fr(k, c, px, y + 8, 18, h * 0.5);
      T(k, i % 2 ? '−30%' : 'АКЦИЯ', px + 9, y + 8 + h * 0.2, { size: 7, maxW: 15, color: i % 2 ? C.ink : C.white });
      fr(k, i % 2 ? C.ink : C.white, px + 3, y + 8 + h * 0.36, 12, 1.6);
    }
  } else if (cat === 'alcohol') {                       // окна заклеены
    fr(k, mix(tone, col.glass, 0.25), x, y, w, h);
    for (let px = x + 5; px + 4 < x + w; px += 9) fp(k, 'rgba(255,253,246,.5)', [px, y + h - 6, px, y + h * 0.5, px + 1.2, y + h * 0.3, px + 2.8, y + h * 0.3, px + 4, y + h * 0.5, px + 4, y + h - 6]);
  } else if (cat === 'pvz') {                           // коробки до потолка и «пункт выдачи»
    for (let i = 0, px = x + 3; px + 13 < x + w; i++, px += 15) for (let j = 0; j < 2 + (H(seed, i, 2, 2)); j++) { fr(k, j % 2 ? C.kraftLight : C.kraft, px, y + h - 12 - j * 12, 13, 11); fr(k, C.kraftLight, px + 5.5, y + h - 12 - j * 12, 2, 11); }
    fr(k, tone, x + 2, y + 4, Math.min(w - 4, 54), 12);
    T(k, 'ПУНКТ ВЫДАЧИ', x + 2 + Math.min(w - 4, 54) / 2, y + 10.4, { size: 8, maxW: Math.min(w - 8, 50), color: C.white });
  } else if (cat === 'cafe' || cat === 'fastfood') {    // столик, люди силуэтом, меню на стекле
    const base = y + h;
    for (let px = x + 10; px + 22 < x + w; px += 36) {
      fr(k, col.deep, px + 6, base - 20, 12, 2); fr(k, col.deep, px + 11, base - 20, 2, 20);
      fp(k, col.deep, [px - 4, base, px - 3, base - 22, px + 2, base - 30, px + 6, base - 22, px + 5, base]);
      fp(k, col.deep, [px + 19, base, px + 20, base - 20, px + 24, base - 28, px + 29, base - 20, px + 28, base]);
    }
    fr(k, C.ink2, x + w - 20, y + 6, 15, 22);
    k.fillStyle = C.white;
    for (let i = 0; i < 4; i++) k.fillRect(x + w - 17, y + 10 + i * 4.4, 9 - (i % 2) * 3, 1.3);
  } else if (cat === 'bank') {                          // банкомат светится
    fr(k, col.deep, x + 6, y + h - 46, 22, 46);
    fr(k, tone, x + 6, y + h - 46, 22, 8);
    fr(k, LIT, x + 9, y + h - 34, 16, 11);
    fr(k, C.concrete, x + 9, y + h - 19, 16, 3);
    T(k, '24', x + 17, y + h - 8, { size: 8, color: C.white });
  } else if (cat === 'pharmacy') {                      // крест и полки
    fr(k, tone, x + 5, y + 6, 18, 18);
    fr(k, C.white, x + 12, y + 9, 4, 12); fr(k, C.white, x + 8, y + 13, 12, 4);
    for (let sy = y + h * 0.56; sy < y + h - 6; sy += 13) { fr(k, C.white, x + 3, sy + 8, w - 6, 1.6); for (let i = 0, px = x + 5; px + 5 < x + w; i++, px += 8) fr(k, [C.blue, C.white, C.green, C.yellow][H(seed, i, sy | 0, 4)], px, sy, 5, 8); }
  } else if (cat === 'realty') {                        // листы с квартирами в три ряда
    for (let r = 0; r < 3; r++) for (let i = 0, px = x + 4; px + 12 < x + w; i++, px += 15) {
      fr(k, C.white, px, y + 5 + r * 19, 12, 16);
      fr(k, H(seed, r, i, 4) === 0 ? C.danger : tone, px + 1.6, y + 6.6 + r * 19, 8.8, 5);
      fr(k, C.muted, px + 1.6, y + 14 + r * 19, 8.8, 1); fr(k, C.muted, px + 1.6, y + 17 + r * 19, 6, 1);
    }
  } else if (cat === 'telecom') {                       // телефоны на подставках
    for (let px = x + 7; px + 8 < x + w; px += 16) { fr(k, C.white, px - 2, y + h - 18, 12, 18); fr(k, C.ink2, px, y + h - 34, 8, 15); fr(k, tone, px + 1, y + h - 32.6, 6, 10); }
  } else if (cat === 'developer') {                     // макет квартала
    fr(k, C.white, x + 4, y + h - 14, w - 8, 14);
    for (let i = 0, px = x + 8; px + 9 < x + w - 4; i++, px += 13) { const bh = 14 + H(seed, i, 7, 20); fr(k, i % 3 ? col.wall : tone, px, y + h - 14 - bh, 9, bh); }
  } else {                                              // полки с товаром
    for (let sy = y + 10; sy < y + h - 10; sy += 17) {
      fr(k, C.white, x + 3, sy + 11, w - 6, 1.8);
      for (let i = 0, px = x + 5; px + 6 < x + w; i++, px += 9) fr(k, [tone, C.white, mix(tone, C.white, 0.5), C.yellow][H(seed, i, sy | 0, 4)], px, sy + 2, 6, 9);
    }
  }
}

function shopUnit(k, x, w, gH, name, col, seed) {
  const b = K.BRANDS[name] || { name, cat: 'retail', bg: C.white, fg: C.ink };
  const cat = b.cat, top = -gH;
  const fh = Math.min(30, Math.max(22, w * 0.19));                  // высота вывески
  const gx = x + 6, gw = w - 12, gTop = top + fh + 10, gh = -9 - gTop;
  const frame = col.deep;

  fr(k, col.glass, gx, gTop, gw, gh);
  // дверь: у супермаркета — раздвижная по центру, у остальных — сбоку
  const dw = Math.min(cat === 'grocery' ? 46 : 36, gw * 0.46), dh = Math.min(66, gh - 3);
  const center = cat === 'grocery' || cat === 'fastfood';
  const dx = center ? gx + gw / 2 - dw / 2 : (seed % 2 ? gx + 4 : gx + gw - dw - 4);
  shopWindow(k, cat, b, gx, gTop, dx - gx - 3, gh, seed, col);
  shopWindow(k, cat, b, dx + dw + 3, gTop, gx + gw - dx - dw - 3, gh, seed + 3, col);
  // блики на стекле: две жёсткие полосы
  fp(k, 'rgba(255,253,246,.34)', [gx + gw * 0.08, gTop + gh, gx + gw * 0.14, gTop + gh, gx + gw * 0.3, gTop, gx + gw * 0.24, gTop]);
  fp(k, 'rgba(255,253,246,.34)', [gx + gw * 0.17, gTop + gh, gx + gw * 0.19, gTop + gh, gx + gw * 0.35, gTop, gx + gw * 0.33, gTop]);
  // рамы и дверь
  sl(k, frame, 2.2, [gx, gTop, gx + gw, gTop, gx + gw, gTop + gh, gx, gTop + gh], true);
  fr(k, frame, dx - 3, -9 - dh - 3, dw + 6, dh + 3);
  fr(k, mix(col.glass, C.white, 0.3), dx, -9 - dh, dw, dh);
  if (center) fr(k, frame, dx + dw / 2 - 1, -9 - dh, 2, dh);
  else fr(k, frame, dx + (seed % 2 ? dw - 6 : 3), -9 - dh * 0.55, 2.5, 12);
  if (cat === 'cafe') {                                             // маркиза в фирменный цвет
    const tone = b.bg === C.white || b.bg === '#FFFFFF' ? b.fg : b.bg;
    fp(k, tone, [gx - 3, gTop - 2, gx + gw + 3, gTop - 2, gx + gw + 7, gTop + 10, gx - 7, gTop + 10]);
    k.fillStyle = C.white;
    for (let sx = gx; sx < gx + gw; sx += 16) k.fillRect(sx, gTop - 2, 8, 12);
  }
  // цоколь и ступенька
  fr(k, col.dark, x, -9, w, 9);
  fr(k, col.trim, dx - 6, -5, dw + 12, 5);
  K.fascia(k, name, x + 2, top + 5, w - 4, fh);
}

/* Подъезд: козырёк, железная дверь, домофон, лавочка для объявлений */
function entrance(k, cx, col, seed) {
  fr(k, col.deep, cx - 14, -58, 28, 58);
  fr(k, col.dark, cx - 22, -64, 44, 6);
  fr(k, col.line, cx - 22, -58.6, 44, 1.4);
  fr(k, mix(col.deep, C.brick, 0.35), cx - 11, -54, 22, 54);          // дверь
  fr(k, col.glass, cx - 7, -50, 8, 16);
  fr(k, C.ink2, cx + 4, -34, 4, 7);                                    // домофон
  fr(k, LIT, cx + 5, -33, 2, 2);
  if (seed % 3 === 0) { fr(k, C.white, cx - 9, -30, 7, 9); fr(k, C.white, cx - 9, -19, 6, 7); }                     // бумажки на двери
}

function drawGroundFloor(k, f, bays, bw, pad) {
  const st = f.style, col = f.col, W = f.w, gH = st.groundH;
  if (st.ground === 'shop') {
    // заведения занимают часть первого этажа, остальное — обычные окна и подъезд
    fr(k, col.base, 0, -gH, W, gH);
    if (st.pilasters) { k.fillStyle = col.dark; for (let y = -gH + 14; y < -6; y += 14) k.fillRect(0, y, W, 1.4); }
    fr(k, col.dark, 0, -9, W, 9);
    const x0 = f.shopX, x1 = x0 + f.units.reduce((sum, u) => sum + u.w + 5, -5);
    const free = [];
    for (let b = 0; b < bays; b++) { const cx = pad + (b + 0.5) * bw; if (cx + bw * 0.4 < x0 || cx - bw * 0.4 > x1) free.push(cx); }
    const door = free.length > 1 ? free[x0 > W - x1 ? free.length - 2 : 1] : 0;      // подъезд — через окно от магазина
    for (const cx of free) {
      if (cx === door) entrance(k, cx, col, f.seed);
      else {
        const ww = bw * 0.5, wh = gH * 0.44, wy = -(gH - 16);
        if (st.pilasters || st.bands) fr(k, col.trim, cx - ww / 2 - 3, wy - 3, ww + 6, wh + 6);
        pane(k, cx - ww / 2, wy, ww, wh, col, hash3(f.seed, 77, cx | 0));
        sl(k, col.line, 1, [cx - ww / 2, wy, cx + ww / 2, wy, cx + ww / 2, wy + wh, cx - ww / 2, wy + wh], true);
      }
    }
    let x = x0;
    for (const u of f.units) { shopUnit(k, x, u.w, gH, u.name, col, f.seed + Math.round(x)); x += u.w + 5; }
  } else if (st.ground === 'rust') {
    fr(k, col.base, 0, -gH, W, gH);
    k.fillStyle = col.dark;
    for (let y = -gH + 14; y < -6; y += 14) k.fillRect(0, y, W, 1.4);
    const arch = f.seed % 5 < 3;
    for (let b = 0; b < bays; b++) {
      const cx = pad + (b + 0.5) * bw;
      if (f.notice && f.notice.bay === b) continue;   // здесь висит объявление
      if (arch && b === Math.floor(bays / 2)) {       // арка во двор с решёткой
        fp(k, col.deep, [cx - 30, 0, cx - 30, -52, cx - 24, -70, cx - 10, -81, cx + 10, -81, cx + 24, -70, cx + 30, -52, cx + 30, 0]);
        k.fillStyle = col.dark;
        for (let x = cx - 24; x <= cx + 24; x += 8) k.fillRect(x - 0.8, -74, 1.6, 74);
        fr(k, col.dark, cx - 28, -40, 56, 1.6);
      } else {
        fr(k, col.trim, cx - bw * 0.23 - 3, -(gH - 20) - 3, bw * 0.46 + 6, gH * 0.5 + 6);
        pane(k, cx - bw * 0.23, -(gH - 20), bw * 0.46, gH * 0.5, col, hash3(f.seed, 78, b));
      }
    }
    fr(k, col.dark, 0, -9, W, 9);
  } else if (st.ground === 'lobby') {
    fr(k, col.glass, 0, -gH, W, gH);
    k.fillStyle = col.trim;
    for (let x = 0; x <= W; x += bw * 2) k.fillRect(x - 4, -gH, 8, gH);
    k.fillRect(0, -gH, W, 7);
    fp(k, 'rgba(255,253,246,.3)', [W * 0.1, 0, W * 0.16, 0, W * 0.34, -gH, W * 0.28, -gH]);
    fr(k, col.deep, W * 0.28, -72, W * 0.44, 6);
    fr(k, col.deep, W * 0.42, -66, W * 0.16, 66);
    fr(k, mix(col.glass, C.white, 0.3), W * 0.42 + 4, -62, W * 0.16 - 8, 56);
    fr(k, col.deep, W * 0.5 - 1, -62, 2, 56);
    fr(k, col.dark, 0, -7, W, 7);
    if (f.brands.length) K.fascia(k, f.brands[0], W * 0.5 - 64, -(gH - 14), 128, 27);
  } else {
    fr(k, col.base, 0, -gH, W, gH);
    for (let b = 0; b < bays; b++) {
      const cx = pad + (b + 0.5) * bw;
      if (f.notice && f.notice.bay === b) continue;   // здесь висит объявление
      if (b % 3 === 1) entrance(k, cx, col, f.seed + b);
      else {
        const ww = bw * 0.52, wh = gH * 0.42, wy = -(gH - 14);
        pane(k, cx - ww / 2, wy, ww, wh, col, hash3(f.seed, 79, b));
        sl(k, col.line, 1, [cx - ww / 2, wy, cx + ww / 2, wy, cx + ww / 2, wy + wh, cx - ww / 2, wy + wh], true);
        if (H(f.seed, b, 31, 5) === 0) { k.fillStyle = col.line; for (let x = cx - ww / 2; x <= cx + ww / 2; x += 4) k.fillRect(x, wy, 1, wh); fr(k, col.line, cx - ww / 2, wy + wh * 0.5, ww, 1); }   // решётка на окне первого этажа
      }
    }
    fr(k, col.dark, 0, -10, W, 10);
  }
  if (f.notice) {                                       // объявление на стене: часть мира, а не интерфейс
    const n = f.notice;
    notice(k, n.x, -gH + (gH - n.h) * 0.42, n.w, n.h, n.lines, f.seed);
  }
}

function drawRoof(k, f, top) {
  const st = f.style, col = f.col, W = f.w;
  if (st.roof === 'flat') {
    fr(k, col.trim, -2, top - 6, W + 4, 6);
    fr(k, col.wall, W * 0.2, top - 20, 26, 14);
    fr(k, col.dark, W * 0.2 + 20, top - 20, 6, 14);
    // антенны и тарелка
    fr(k, col.line, W * 0.62, top - 30, 1.6, 24); fr(k, col.line, W * 0.62 - 5, top - 28, 11.6, 1.2); fr(k, col.line, W * 0.62 - 3, top - 23, 7.6, 1.2);
    if (f.seed % 2) fp(k, col.trim, [W * 0.78, top - 6, W * 0.8, top - 16, W * 0.86, top - 18, W * 0.85, top - 9]);
  } else if (st.roof === 'hip') {
    fp(k, col.roof, [-4, top, 10, top - 16, W - 10, top - 16, W + 4, top]);
    fr(k, col.dark, W * 0.3, top - 24, 9, 12);
    fr(k, col.line, W * 0.7, top - 34, 1.6, 20); fr(k, col.line, W * 0.7 - 5, top - 32, 11.6, 1.2);
  } else if (st.roof === 'cornice') {
    fr(k, col.trim, -5, top - 9, W + 10, 9);
    fr(k, col.wall, 8, top - 24, W - 16, 15);
    fr(k, col.trim, 8, top - 26, W - 16, 2.4);
  } else if (st.roof === 'mansard') {
    fp(k, col.roof, [0, top, 9, top - 32, W - 9, top - 32, W, top]);
    fr(k, col.roof, W * 0.22, top - 46, 10, 16);
    fr(k, col.trim, -3, top - 4, W + 6, 5);
    for (let x = 34; x < W - 40; x += 62) { fr(k, col.trim, x - 2, top - 26, 22, 22); fr(k, col.glass, x + 1, top - 23, 16, 17); fr(k, col.trim, x + 8.2, top - 23, 1.6, 17); }
  }
}

function drawFacade(k, f) {
  const st = f.style, W = f.w, col = f.col, gH = st.groundH, fH = st.floorH, floors = f.floors;
  const top = -(gH + floors * fH);
  fr(k, col.wall, 0, top, W, -top);
  const pad = 14, bays = Math.max(2, Math.round((W - pad * 2) / st.bayW)), bw = (W - pad * 2) / bays;

  for (let fl = 0; fl < floors; fl++) {
    const y0 = -(gH + fl * fH);
    if (st.win === 'strip') {                           // стеклянный пояс на весь этаж
      fr(k, (H(f.seed, fl, 5, 100) < 8) ? col.lit : col.glass, 6, y0 - fH * 0.8, W - 12, fH * 0.6);
      k.fillStyle = col.wall;
      for (let x = pad; x < W - pad; x += bw / 2) k.fillRect(x, y0 - fH * 0.8, 1.6, fH * 0.6);
    } else {
      for (let b = 0; b < bays; b++) drawWindow(k, st.win, pad + (b + 0.5) * bw, y0, bw, fH, col, hash3(f.seed, fl, b), fl, b);
    }
    if (st.bands) fr(k, col.trim, 0, y0 - 3.5, W, 3.5);
    if (st.win === 'panel') fr(k, col.line, 0, y0 - 1, W, 1);
  }
  if (st.win === 'strip') fp(k, 'rgba(255,253,246,.22)', [W * 0.16, -gH, W * 0.3, -gH, W * 0.72, top, W * 0.58, top]);        // отражение неба в стекле
  if (st.win === 'panel') { k.fillStyle = col.line; for (let b = 0; b <= bays; b++) k.fillRect(pad + b * bw - 0.5, top, 1, -top - gH); }
  if (st.pilasters) { k.fillStyle = col.trim; for (let b = 0; b <= bays; b += 2) k.fillRect(pad + b * bw - 3.5, top, 7, -top - gH); }
  if (st.brick) {                                       // кирпичная кладка
    k.fillStyle = col.line;
    for (let y = top + 5; y < -gH; y += 6) k.fillRect(0, y, W, 0.7);
  }
  if (st.ac) {                                          // кондиционеры под окнами
    for (let fl = 0; fl < floors; fl++) for (let b = 0; b < bays; b++) {
      if (H(f.seed, fl + 40, b, 100) >= st.ac) continue;
      const ax = pad + (b + 0.5) * bw + bw * 0.14, ay = -(gH + fl * fH) - fH * 0.2;
      fr(k, C.white, ax, ay, 13, 8.5);
      fr(k, col.line, ax + 1.6, ay + 1.6, 6, 5.4);
      fr(k, col.line, ax + 9, ay + 2, 2.6, 1); fr(k, col.line, ax + 9, ay + 4, 2.6, 1);
      fr(k, col.line, ax + 5, ay + 8.5, 1, 9);                                    // подтёк и трубка
    }
  }
  if (st.dish) {                                        // спутниковые тарелки
    for (let fl = 1; fl < floors; fl++) for (let b = 0; b < bays; b++) {
      if (H(f.seed, fl + 80, b, 100) >= st.dish) continue;
      const dx = pad + (b + 0.5) * bw - bw * 0.42, dy = -(gH + fl * fH) - fH * 0.56;
      fp(k, col.trim, [dx, dy + 4, dx + 2, dy - 4, dx + 9, dy - 6, dx + 10, dy + 2, dx + 5, dy + 6]);
      fr(k, col.line, dx + 4, dy - 1, 6, 1);
    }
  }
  if (f.banner) {                                       // растяжка «АРЕНДА» на фасаде
    const bn = f.banner, by = -(gH + fH * 1.02);
    fr(k, bn.bg, bn.x, by, bn.w, 24);
    fr(k, bn.fg, bn.x, by, bn.w, 2.4); fr(k, bn.fg, bn.x, by + 21.6, bn.w, 2.4);
    T(k, bn.text, bn.x + bn.w / 2, by + 12.6, { size: 15, maxW: bn.w - 12, color: bn.fg });
  }
  if (st.pipes) {                                       // водосточные трубы
    k.fillStyle = col.line;
    for (const px of [4, W - 8]) {
      k.fillRect(px, top + 2, 3.2, -top - 12);
      k.fillRect(px - 1.5, top, 6.2, 5);
      k.fillRect(px - 0.8, -(gH + fH), 4.8, 2);
      k.beginPath(); poly(k, [px, -10, px + 3.2, -10, px + 8, -4, px + 5, -4]); k.fill();
    }
  }
  if (st.roof === 'cornice') {                          // кронштейны под карнизом
    k.fillStyle = col.trim;
    for (let x = 6; x < W - 6; x += 13) k.fillRect(x, top, 5, 5);
  }
  // теневой бок: правый край дома темнее — плоская тень вместо градиента
  fr(k, col.shadow, W - 9, top, 9, -top);
  drawGroundFloor(k, f, bays, bw, pad);
  drawRoof(k, f, top);
  sl(k, col.line, 1.4, [0.7, 0, 0.7, top, W - 0.7, top, W - 0.7, 0]);
  if (f.plate) {                                        // адресная табличка
    const cx = Math.min(W - 46, Math.max(46, W * 0.24));
    fr(k, '#2F4A6C', cx - 40, -gH - 15, 80, 13);
    fr(k, C.white, cx - 40, -gH - 15, 80, 1.2); fr(k, C.white, cx - 40, -gH - 3.2, 80, 1.2);
    T(k, f.plate, cx, -gH - 8.2, { size: 9.5, maxW: 72, color: C.white, font: FONT.text, weight: 700 });
  }
}

K.CityArt = { fr, fp, sl, H, crown, trunk, FarArt, BackArt, STYLES, drawFacade, notice, winGrid };

})(window.KTM = window.KTM || {});
