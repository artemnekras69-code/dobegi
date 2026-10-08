/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — город

   Четыре плана за спиной героя и один перед ним:
     дальний    силуэты (Сити, Кремль, Останкино…)        параллакс 0.06
     средний    дома целиком                               параллакс 0.22
     фасады     первые этажи, магазины, вывески            параллакс 0.5
     улица      деревья, фонари, остановки, метро          параллакс 0.72
     дорога     машины в нижней полосе — перед героем, но ниже игровой дорожки

   Всё, что здесь, — светлое и без обводки: это фон. Яркое и обведённое —
   только то, с чем игрок взаимодействует (art.js).
   Размеры настоящие: герой 58 юнитов, этаж ≈ 60–80, фонарь ≈ 235.
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, clamp, lerp, fmt, makeRng, hash3, mix, shade, rr, dot, poly } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors;

function fitFont(k, str, maxW, size, weight, family) {
  let s = size;
  k.font = `${weight || 800} ${s}px ${family || FONT.display}`;
  const w = k.measureText(str).width;
  if (w > maxW) { s = Math.max(3, s * maxW / w); k.font = `${weight || 800} ${s}px ${family || FONT.display}`; }
  return s;
}
function text(k, str, x, y, maxW, size, color, weight, family) {
  fitFont(k, str, maxW, size, weight, family);
  k.fillStyle = color;
  k.textAlign = 'center';
  k.textBaseline = 'middle';
  k.fillText(str, x, y);
}
/* Цвет вывески: фирменный, но приглушённый, чтобы не спорил с игрой */
const soft = (hex, wall) => mix(hex, wall || '#E6E6E6', 0.22);

/* ───────────────────────────── ДАЛЬНИЙ ПЛАН ─────────────────────────────
   Силуэты одним цветом. draw(ctx) добавляет фигуры в текущий контур. */
const FarArt = {
  blocks: {
    w: 220,
    draw(ctx, it) {
      for (let i = 0, x = 0; i < 7; i++) {
        const w = 22 + (hash3(it.seed, i, 1) % 18), h = 46 + (hash3(it.seed, i, 2) % 86);
        ctx.rect(x, -h, w, h);
        x += w + 3 + (hash3(it.seed, i, 3) % 8);
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
  chimneys: {       // ТЭЦ: трубы и градирня
    w: 190,
    draw(ctx) {
      poly(ctx, [20, 0, 26, -150, 34, -150, 40, 0]);
      poly(ctx, [68, 0, 73, -118, 80, -118, 85, 0]);
      poly(ctx, [112, 0, 119, -172, 128, -172, 135, 0]);
      poly(ctx, [146, 0, 153, -42, 151, -66, 181, -66, 179, -42, 186, 0]);
      dot(ctx, 34, -160, 9); dot(ctx, 44, -170, 12); dot(ctx, 58, -178, 10);
      dot(ctx, 170, -74, 10); dot(ctx, 182, -84, 13);
      ctx.rect(0, -30, 60, 30);
    },
  },
  kremlin: {        // стена, Спасская башня, колокольня Ивана Великого
    w: 300,
    draw(ctx) {
      ctx.rect(0, -40, 300, 40);
      for (let x = 2; x < 298; x += 11) ctx.rect(x, -47, 6, 7);
      ctx.rect(120, -92, 34, 92); ctx.rect(125, -122, 24, 30);
      poly(ctx, [125, -122, 149, -122, 137, -172]);
      poly(ctx, [137, -184, 141, -176, 137, -170, 133, -176]);
      ctx.rect(30, -70, 22, 70); poly(ctx, [29, -70, 53, -70, 41, -106]);
      ctx.rect(244, -64, 20, 64); poly(ctx, [243, -64, 265, -64, 254, -96]);
      ctx.rect(190, -128, 14, 128); dot(ctx, 197, -135, 9); ctx.rect(196.2, -156, 1.6, 14);
    },
  },
  basil: {          // купола собора Василия Блаженного
    w: 110,
    draw(ctx) {
      ctx.rect(4, -40, 102, 40);
      poly(ctx, [44, 0, 44, -82, 55, -132, 66, -82, 66, 0]);
      dot(ctx, 55, -138, 5); ctx.rect(54.3, -152, 1.4, 10);
      for (const [x, h] of [[8, 58], [26, 74], [70, 74], [88, 58]]) {
        ctx.rect(x, -h, 14, h);
        dot(ctx, x + 7, -h - 8, 9.5);
        poly(ctx, [x + 2, -h - 14, x + 12, -h - 14, x + 7, -h - 27]);
      }
    },
  },
  hhs: {            // Храм Христа Спасителя
    w: 170, scale: 1.15,
    draw(ctx) {
      ctx.rect(22, -70, 126, 70);
      ctx.rect(58, -104, 54, 34);
      ctx.moveTo(115, -104); ctx.arc(85, -104, 30, 0, Math.PI, true); ctx.closePath();
      poly(ctx, [78, -132, 92, -132, 85, -150]);
      ctx.rect(84, -164, 2, 14); ctx.rect(81, -160, 8, 2);
      for (const x of [18, 128]) { ctx.rect(x, -92, 24, 22); dot(ctx, x + 12, -96, 11.5); ctx.rect(x + 11.2, -116, 1.6, 10); }
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
      ctx.beginPath(); ctx.arc(75, -88, 70, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.moveTo(75, -88); ctx.lineTo(75 + Math.cos(a) * 70, -88 + Math.sin(a) * 70); }
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(75, -88); ctx.lineTo(44, 0); ctx.moveTo(75, -88); ctx.lineTo(106, 0); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; dot(ctx, 75 + Math.cos(a) * 70, -88 + Math.sin(a) * 70, 5); }
      ctx.fill();
    },
  },
};

/* ───────────────────────────── СРЕДНИЙ ПЛАН: ДОМА ЦЕЛИКОМ ─────────────────────────────
   Рисуются один раз во внеэкранный холст. Начало координат — левый нижний угол. */
function winGrid(k, b, x, top, w, h, cw, ch, gx, gy, litPct) {
  const cols = Math.max(1, Math.floor((w + gx) / (cw + gx))), rows = Math.max(1, Math.floor((h + gy) / (ch + gy)));
  const ox = x + (w - (cols * (cw + gx) - gx)) / 2;
  const pct = litPct === undefined ? b.litPct : litPct, lit = [];
  k.fillStyle = b.win;
  k.beginPath();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = ox + c * (cw + gx), wy = top + r * (ch + gy);
      if (hash3(b.seed, r, c) % 100 < pct) lit.push(wx, wy);
      else k.rect(wx, wy, cw, ch);
    }
  }
  k.fill();
  if (lit.length) {
    k.fillStyle = b.lit;
    k.beginPath();
    for (let i = 0; i < lit.length; i += 2) k.rect(lit[i], lit[i + 1], cw, ch);
    k.fill();
  }
}

const BackArt = {
  panel: {
    dims: r => ({ w: r.range(110, 170), h: r.range(0.42, 0.62), extra: 24 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h, b.w, b.h);
      k.fillRect(b.w * 0.14, -b.h - 7, 18, 7);
      k.fillRect(b.w * 0.62, -b.h - 5, 24, 5);
      k.fillRect(b.w * 0.62 + 11, -b.h - 22, 1.6, 17);
      winGrid(k, b, 9, -b.h + 11, b.w - 18, b.h - 20, 7, 8, 6, 8);
    },
  },
  panelTall: {
    dims: r => ({ w: r.range(76, 104), h: r.range(0.62, 0.84), extra: 24 }),
    draw(k, b) { BackArt.panel.draw(k, b); },
  },
  khrush: {
    dims: r => ({ w: r.range(170, 250), h: r.range(0.2, 0.26), extra: 12, minH: 66 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h, b.w, b.h);
      k.beginPath();
      poly(k, [-3, -b.h, 8, -b.h - 9, b.w - 8, -b.h - 9, b.w + 3, -b.h]);
      k.fill();
      winGrid(k, b, 10, -b.h + 9, b.w - 20, b.h - 26, 8, 8, 9, 7);
      k.fillStyle = b.win;
      for (let x = 24; x < b.w - 20; x += 62) k.fillRect(x, -13, 9, 13);
    },
  },
  tower: {
    dims: r => ({ w: r.range(70, 100), h: r.range(0.7, 1), extra: 34 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h, b.w, b.h);
      k.fillRect(b.w * 0.25, -b.h - 10, b.w * 0.5, 10);
      k.fillRect(b.w / 2 - 1, -b.h - 32, 2, 22);
      winGrid(k, b, 7, -b.h + 9, b.w - 14, b.h - 16, 5, 9, 4, 6);
    },
  },
  site: {       // стройка с краном
    dims: r => ({ w: r.range(96, 124), h: r.range(0.45, 0.68), extra: 70 }),
    draw(k, b) {
      const solid = b.h * 0.55;
      k.fillStyle = b.body;
      k.fillRect(0, -solid, b.w, solid);
      winGrid(k, b, 8, -solid + 9, b.w - 16, solid - 14, 7, 8, 6, 8, 0);
      for (let y = -solid; y > -b.h; y -= 16) k.fillRect(0, y - 2.5, b.w, 2.5);
      for (let x = 0; x <= b.w - 3; x += (b.w - 3) / 4) k.fillRect(x, -b.h, 3, b.h - solid);
      const mx = b.w * 0.72;
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
      k.beginPath();
      poly(k, [b.w * 0.42, -top, b.w * 0.58, -top, b.w * 0.5, -top - b.h * 0.26]);
      k.fill();
      k.fillRect(b.w / 2 - 1, -top - b.h * 0.3, 2, b.h * 0.1);
      winGrid(k, b, 8, -t1 + 10, b.w - 16, t1 - 16, 6, 9, 6, 7);
      winGrid(k, b, b.w * 0.2 + 7, -t1 - t2 + 8, b.w * 0.6 - 14, t2 - 10, 6, 9, 6, 7);
      winGrid(k, b, b.w * 0.34 + 6, -top + 7, b.w * 0.32 - 12, t3 - 9, 5, 8, 5, 6);
    },
  },
  old: {        // старый дом с мансардой
    dims: r => ({ w: r.range(124, 190), h: r.range(0.28, 0.4), extra: 30, minH: 84 }),
    draw(k, b) {
      k.fillStyle = b.dark;
      k.beginPath();
      poly(k, [0, -b.h, 9, -b.h - 15, b.w - 9, -b.h - 15, b.w, -b.h]);
      k.fill();
      k.fillRect(b.w * 0.2, -b.h - 25, 8, 12);
      k.fillRect(b.w * 0.7, -b.h - 23, 8, 10);
      k.fillStyle = b.body;
      k.fillRect(0, -b.h, b.w, b.h);
      k.fillStyle = b.dark;
      k.fillRect(-2, -b.h - 1, b.w + 4, 3.5);
      k.fillRect(0, -26, b.w, 2);
      winGrid(k, b, 10, -b.h + 11, b.w - 20, b.h - 42, 6, 12, 9, 9);
      k.fillStyle = b.win;
      for (let x = 12; x < b.w - 16; x += 22) { k.beginPath(); k.arc(x + 5, -14, 5, Math.PI, 0); k.rect(x, -14, 10, 14); k.fill(); }
    },
  },
  glass: {      // стеклянная башня
    dims: r => ({ w: r.range(64, 96), h: r.range(0.76, 1.05), extra: 30 }),
    draw(k, b) {
      const slant = 22 * (b.seed % 2 ? 1 : -1);
      const yl = -b.h + Math.max(0, slant), yr = -b.h + Math.max(0, -slant);
      k.fillStyle = b.body;
      k.beginPath();
      poly(k, [0, 0, 0, yl, b.w, yr, b.w, 0]);
      k.fill();
      k.fillRect(b.w * (slant > 0 ? 0.82 : 0.14), -b.h - 26, 1.8, 28);
      k.fillStyle = b.win;
      k.beginPath();
      for (let y = -b.h + 34; y < -8; y += 9) k.rect(5, y, b.w - 10, 4);
      k.fill();
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
      k.beginPath();
      for (let y = -b.h + 20; y < -10; y += 11) k.rect(kind === 1 ? 9 : 5, y, b.w - (kind === 1 ? 18 : 10), 5);
      k.fill();
      k.fillStyle = b.body;
      for (let x = b.w * 0.25; x < b.w; x += b.w * 0.25) k.fillRect(x - 1, -b.h, 2, b.h);
    },
  },
  newblock: {   // новый жилой комплекс
    dims: r => ({ w: r.range(96, 150), h: r.range(0.6, 0.95), extra: 20 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h, b.w * 0.62, b.h);
      k.fillRect(b.w * 0.62, -b.h * 0.82, b.w * 0.38, b.h * 0.82);
      k.fillStyle = b.accent;
      k.fillRect(b.w * 0.26, -b.h, 7, b.h);
      k.fillRect(b.w * 0.8, -b.h * 0.82, 6, b.h * 0.82);
      k.fillStyle = b.body;
      k.fillRect(b.w * 0.1, -b.h - 8, 20, 8);
      winGrid(k, b, 7, -b.h + 10, b.w * 0.62 - 14, b.h - 18, 8, 9, 5, 7);
      winGrid(k, b, b.w * 0.62 + 6, -b.h * 0.82 + 10, b.w * 0.38 - 12, b.h * 0.82 - 18, 8, 9, 5, 7);
    },
  },
  factory: {    // промзона: шедовая крыша, труба и буквы на корпусе
    dims: r => ({ w: r.range(200, 280), h: r.range(0.24, 0.32), extra: 110, minH: 76 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h, b.w, b.h);
      k.beginPath();
      for (let x = 0; x < b.w - 20; x += 34) poly(k, [x, -b.h, x, -b.h - 16, x + 34, -b.h]);
      k.fill();
      k.beginPath();
      poly(k, [b.w * 0.8, -b.h, b.w * 0.8 + 4, -b.h - 100, b.w * 0.8 + 13, -b.h - 100, b.w * 0.8 + 17, -b.h]);
      k.fill();
      k.fillStyle = b.dark;
      k.fillRect(b.w * 0.8 + 4.5, -b.h - 92, 8, 6);
      k.fillRect(b.w * 0.8 + 5.2, -b.h - 76, 6.6, 6);
      winGrid(k, b, 10, -b.h + 12, b.w - 20, b.h - 36, 16, 12, 6, 8, 4);
      if (b.seed % 2 === 0) { k.fillStyle = b.dark; k.fillRect(b.w * 0.16, -b.h + 8, b.w * 0.44, 15); text(k, 'МОСКВИЧ', b.w * 0.38, -b.h + 16, b.w * 0.4, 10, b.body); }
    },
  },
  pavilionBack: {   // павильон ВДНХ: колоннада, ярусы, шпиль со звездой
    dims: r => ({ w: r.range(150, 200), h: r.range(0.36, 0.46), extra: 130, minH: 100 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h * 0.7, b.w, b.h * 0.7);
      k.fillRect(b.w * 0.16, -b.h, b.w * 0.68, b.h * 0.34);
      k.fillRect(b.w * 0.34, -b.h - 30, b.w * 0.32, 32);
      k.fillRect(b.w * 0.43, -b.h - 56, b.w * 0.14, 28);
      k.beginPath();
      poly(k, [b.w * 0.46, -b.h - 56, b.w * 0.54, -b.h - 56, b.w * 0.5, -b.h - 110]);
      k.fill();
      k.fillStyle = '#D9C27A';
      k.beginPath();
      poly(k, [b.w * 0.5, -b.h - 124, b.w * 0.5 + 5, -b.h - 113, b.w * 0.5, -b.h - 106, b.w * 0.5 - 5, -b.h - 113]);
      k.fill();
      k.fillStyle = b.win;
      for (let x = 10; x < b.w - 10; x += 16) k.fillRect(x, -b.h * 0.62, 6, b.h * 0.62);
      k.fillStyle = b.body;
      k.fillRect(0, -10, b.w, 10);
    },
  },
  church: {
    dims: r => ({ w: r.range(74, 100), h: r.range(0.26, 0.34), extra: 120, minH: 80 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(b.w * 0.2, -b.h, b.w * 0.8, b.h);
      k.fillRect(b.w * 0.48, -b.h - 26, b.w * 0.3, 26);
      k.fillRect(0, -b.h - 40, b.w * 0.26, b.h + 40);
      k.beginPath();
      poly(k, [0, -b.h - 40, b.w * 0.26, -b.h - 40, b.w * 0.13, -b.h - 84]);
      k.fill();
      k.fillStyle = '#D9C27A';
      k.beginPath();
      dot(k, b.w * 0.63, -b.h - 36, 13);
      poly(k, [b.w * 0.63 - 6, -b.h - 45, b.w * 0.63 + 6, -b.h - 45, b.w * 0.63, -b.h - 62]);
      k.fill();
      k.fillRect(b.w * 0.63 - 0.8, -b.h - 74, 1.6, 13);
      k.fillRect(b.w * 0.13 - 0.8, -b.h - 96, 1.6, 13);
      k.fillStyle = b.win;
      for (let x = b.w * 0.3; x < b.w - 12; x += 18) { k.beginPath(); k.arc(x + 4, -b.h * 0.5, 4, Math.PI, 0); k.rect(x, -b.h * 0.5, 8, 16); k.fill(); }
    },
  },
};

/* ───────────────────────────── ФАСАДЫ ─────────────────────────────
   Ближний ряд домов в настоящем масштабе: первый этаж с магазинами и вывесками. */
const STYLES = {
  panel:      { w: [230, 330], floors: [5, 7],  floorH: 60, groundH: 66,  bayW: 46, win: 'panel',  ground: 'plain', roof: 'flat' },
  panelShop:  { w: [240, 340], floors: [5, 7],  floorH: 60, groundH: 90,  bayW: 46, win: 'panel',  ground: 'shop',  roof: 'flat' },
  khrush:     { w: [250, 340], floors: [4, 4],  floorH: 56, groundH: 60,  bayW: 42, win: 'rect',   ground: 'plain', roof: 'hip' },
  stalin:     { w: [240, 320], floors: [4, 6],  floorH: 72, groundH: 98,  bayW: 54, win: 'tall',   ground: 'rust',  roof: 'cornice', pilasters: true },
  stalinShop: { w: [240, 320], floors: [4, 6],  floorH: 72, groundH: 100, bayW: 54, win: 'tall',   ground: 'shop',  roof: 'cornice', pilasters: true },
  old:        { w: [190, 270], floors: [1, 3],  floorH: 80, groundH: 92,  bayW: 50, win: 'arched', ground: 'plain', roof: 'mansard', bands: true },
  oldShop:    { w: [190, 270], floors: [1, 3],  floorH: 80, groundH: 100, bayW: 50, win: 'arched', ground: 'shop',  roof: 'mansard', bands: true },
  glass:      { w: [210, 300], floors: [8, 12], floorH: 54, groundH: 112, bayW: 40, win: 'strip',  ground: 'lobby', roof: 'none' },
  newbuild:   { w: [220, 300], floors: [6, 9],  floorH: 62, groundH: 86,  bayW: 50, win: 'modern', ground: 'plain', roof: 'flat' },
  newShop:    { w: [220, 300], floors: [6, 9],  floorH: 62, groundH: 100, bayW: 50, win: 'modern', ground: 'shop',  roof: 'flat' },
};

function drawWindow(k, type, cx, y0, bw, fH, col, h, fl, b) {
  const lit = h % 100 < 9;
  const glass = lit ? col.lit : col.glass;
  if (type === 'rect' || type === 'panel') {
    const ww = bw * (type === 'panel' ? 0.56 : 0.5), wh = fH * 0.5, x = cx - ww / 2, y = y0 - fH * 0.24 - wh;
    if (type === 'panel' && (h >> 8) % 3 === 0) {       // балкон
      k.fillStyle = col.dark;
      k.fillRect(cx - bw * 0.42, y0 - fH * 0.5, bw * 0.84, fH * 0.34);
      k.fillStyle = col.trim;
      k.fillRect(cx - bw * 0.42, y0 - fH * 0.5, bw * 0.84, 2.5);
    }
    k.fillStyle = glass;
    k.fillRect(x, y, ww, wh);
    k.fillStyle = col.wall;
    k.fillRect(cx - 0.8, y, 1.6, wh);
  } else if (type === 'tall') {
    const ww = bw * 0.42, wh = fH * 0.62, x = cx - ww / 2, y = y0 - fH * 0.2 - wh;
    k.fillStyle = col.trim;
    k.fillRect(x - 3.5, y - 3.5, ww + 7, wh + 7);
    k.fillRect(x - 6, y + wh + 2, ww + 12, 3.5);
    k.fillStyle = glass;
    k.fillRect(x, y, ww, wh);
    k.fillStyle = col.trim;
    k.fillRect(cx - 1, y, 2, wh);
    k.fillRect(x, y + wh * 0.3, ww, 2);
    if (fl === 1 && b % 3 === 1) {                      // балкон с балясинами
      k.fillRect(x - 9, y + wh - 4, ww + 18, 4);
      for (let bx = x - 8; bx < x + ww + 8; bx += 5) k.fillRect(bx, y + wh - 16, 2, 13);
      k.fillRect(x - 9, y + wh - 18, ww + 18, 3);
    }
  } else if (type === 'arched') {
    const ww = bw * 0.44, wh = fH * 0.46, x = cx - ww / 2, y = y0 - fH * 0.2 - wh;
    k.fillStyle = col.trim;
    k.beginPath(); k.arc(cx, y, ww / 2 + 4, Math.PI, 0); k.rect(x - 4, y, ww + 8, wh + 3); k.fill();
    k.fillRect(x - 7, y + wh + 2, ww + 14, 3.5);
    k.fillStyle = glass;
    k.beginPath(); k.arc(cx, y, ww / 2, Math.PI, 0); k.rect(x, y, ww, wh); k.fill();
    k.fillStyle = col.trim;
    k.fillRect(cx - 1, y - ww / 2, 2, wh + ww / 2);
    k.fillRect(x, y, ww, 2);
  } else if (type === 'modern') {
    const ww = bw * 0.6, wh = fH * 0.62, x = cx - ww / 2, y = y0 - fH * 0.18 - wh;
    if ((h >> 6) % 4 === 0) { k.fillStyle = col.accent; k.fillRect(cx - bw / 2, y0 - fH, bw, fH); }
    k.fillStyle = col.dark;
    k.fillRect(x - 1.5, y - 1.5, ww + 3, wh + 3);
    k.fillStyle = glass;
    k.fillRect(x, y, ww, wh);
    k.fillStyle = col.dark;
    k.fillRect(x + ww * 0.62, y, 1.5, wh);
  }
}

function drawSignBoard(k, name, cx, yTop, maxW, wall, height) {
  const brand = K.BRANDS[name] || { bg: '#FFFFFF', fg: C.ink };
  const hgt = height || 26;
  k.font = `800 14px ${FONT.display}`;
  const w = clamp(k.measureText(name).width + 30, 84, maxW);
  rr(k, cx - w / 2, yTop, w, hgt, 5);
  k.fillStyle = soft(brand.bg, wall);
  k.fill();
  text(k, name, cx, yTop + hgt / 2 + 0.5, w - 16, 14, soft(brand.fg, brand.bg));
  return w;
}

function drawGroundFloor(k, f, bays, bw, pad) {
  const st = f.style, col = f.col, W = f.w, gH = st.groundH;
  if (st.ground === 'shop') {
    k.fillStyle = col.base;
    k.fillRect(0, -gH, W, gH);
    k.fillStyle = col.glass;
    k.fillRect(pad, -(gH - 36), W - pad * 2, gH - 45);
    k.fillStyle = col.base;
    for (let b = 1; b < bays; b++) k.fillRect(pad + b * bw - 2, -(gH - 36), 4, gH - 45);
    // дверь
    const db = 1 + (f.seed % Math.max(1, bays - 2));
    k.fillStyle = col.dark;
    k.fillRect(pad + db * bw + bw * 0.2, -68, bw * 0.6, 60);
    k.fillStyle = col.glass;
    k.fillRect(pad + db * bw + bw * 0.2 + 4, -64, bw * 0.6 - 8, 40);
    k.fillStyle = col.dark;
    k.fillRect(0, -9, W, 9);
    // вывески
    const names = f.brands;
    if (names.length === 1) drawSignBoard(k, names[0], W / 2, -(gH - 5), W - pad * 2 - 10, col.wall);
    else { drawSignBoard(k, names[0], W * 0.27, -(gH - 5), W * 0.46, col.wall); drawSignBoard(k, names[1], W * 0.74, -(gH - 5), W * 0.44, col.wall); }
  } else if (st.ground === 'rust') {
    k.fillStyle = col.base;
    k.fillRect(0, -gH, W, gH);
    k.fillStyle = col.dark;
    for (let y = -gH + 14; y < -6; y += 14) k.fillRect(0, y, W, 1.4);
    const arch = f.seed % 5 < 3;
    for (let b = 0; b < bays; b++) {
      const cx = pad + (b + 0.5) * bw;
      if (arch && b === Math.floor(bays / 2)) {       // арка во двор
        k.fillStyle = col.deep;
        k.beginPath(); k.arc(cx, -52, 30, Math.PI, 0); k.rect(cx - 30, -52, 60, 52); k.fill();
        k.fillStyle = col.dark;
        for (let x = cx - 24; x <= cx + 24; x += 8) k.fillRect(x - 0.8, -76, 1.6, 76);
      } else {
        k.fillStyle = col.trim;
        k.fillRect(cx - bw * 0.23 - 3, -(gH - 20) - 3, bw * 0.46 + 6, gH * 0.5 + 6);
        k.fillStyle = col.glass;
        k.fillRect(cx - bw * 0.23, -(gH - 20), bw * 0.46, gH * 0.5);
      }
    }
    k.fillStyle = col.dark;
    k.fillRect(0, -9, W, 9);
  } else if (st.ground === 'lobby') {
    k.fillStyle = col.glass;
    k.fillRect(0, -gH, W, gH);
    k.fillStyle = col.trim;
    for (let x = 0; x <= W; x += bw * 2) k.fillRect(x - 4, -gH, 8, gH);
    k.fillRect(0, -gH, W, 7);
    k.fillStyle = col.dark;
    k.fillRect(W * 0.28, -72, W * 0.44, 6);
    k.fillRect(W * 0.42, -66, W * 0.16, 66);
    k.fillStyle = col.glass;
    k.fillRect(W * 0.42 + 4, -62, W * 0.16 - 8, 56);
    k.fillStyle = col.dark;
    k.fillRect(0, -7, W, 7);
    if (f.brands.length) drawSignBoard(k, f.brands[0], W * 0.5, -(gH - 12), W * 0.5, col.glass, 24);
  } else {
    k.fillStyle = col.base;
    k.fillRect(0, -gH, W, gH);
    for (let b = 0; b < bays; b++) {
      const cx = pad + (b + 0.5) * bw;
      if (b % 3 === 1) {                               // подъезд с козырьком
        k.fillStyle = col.dark;
        k.fillRect(cx - 13, -56, 26, 56);
        k.fillRect(cx - 20, -62, 40, 5);
        k.fillStyle = col.glass;
        k.fillRect(cx - 9, -52, 18, 22);
      } else {
        k.fillStyle = col.glass;
        k.fillRect(cx - bw * 0.26, -(gH - 14), bw * 0.52, gH * 0.42);
      }
    }
    k.fillStyle = col.dark;
    k.fillRect(0, -10, W, 10);
  }
}

function drawRoof(k, f, top) {
  const st = f.style, col = f.col, W = f.w;
  if (st.roof === 'flat') {
    k.fillStyle = col.trim;
    k.fillRect(-2, top - 6, W + 4, 6);
    k.fillStyle = col.wall;
    k.fillRect(W * 0.2, top - 20, 26, 14);
  } else if (st.roof === 'hip') {
    k.fillStyle = col.roof;
    k.beginPath(); poly(k, [-4, top, 10, top - 16, W - 10, top - 16, W + 4, top]); k.fill();
  } else if (st.roof === 'cornice') {
    k.fillStyle = col.trim;
    k.fillRect(-5, top - 9, W + 10, 9);
    k.fillStyle = col.wall;
    k.fillRect(8, top - 24, W - 16, 15);
  } else if (st.roof === 'mansard') {
    k.fillStyle = col.roof;
    k.beginPath(); poly(k, [0, top, 9, top - 32, W - 9, top - 32, W, top]); k.fill();
    k.fillRect(W * 0.22, top - 46, 10, 16);
    k.fillStyle = col.trim;
    k.fillRect(-3, top - 4, W + 6, 5);
    for (let x = 34; x < W - 40; x += 62) { k.fillStyle = col.trim; k.fillRect(x - 2, top - 26, 22, 22); k.fillStyle = col.glass; k.fillRect(x + 1, top - 23, 16, 17); }
  }
}

function drawFacade(k, f) {
  const st = f.style, W = f.w, col = f.col, gH = st.groundH, fH = st.floorH, floors = f.floors;
  const top = -(gH + floors * fH);
  k.fillStyle = col.wall;
  k.fillRect(0, top, W, -top);
  const pad = 14, bays = Math.max(2, Math.round((W - pad * 2) / st.bayW)), bw = (W - pad * 2) / bays;

  for (let fl = 0; fl < floors; fl++) {
    const y0 = -(gH + fl * fH);
    if (st.win === 'strip') {                           // стеклянный пояс на весь этаж
      k.fillStyle = (hash3(f.seed, fl, 5) % 100 < 8) ? col.lit : col.glass;
      k.fillRect(6, y0 - fH * 0.8, W - 12, fH * 0.6);
      k.fillStyle = col.wall;
      for (let x = pad; x < W - pad; x += bw / 2) k.fillRect(x, y0 - fH * 0.8, 1.6, fH * 0.6);
    } else {
      for (let b = 0; b < bays; b++) drawWindow(k, st.win, pad + (b + 0.5) * bw, y0, bw, fH, col, hash3(f.seed, fl, b), fl, b);
    }
    if (st.bands) { k.fillStyle = col.trim; k.fillRect(0, y0 - 3.5, W, 3.5); }
    if (st.win === 'panel') { k.fillStyle = col.dark; k.fillRect(0, y0 - 1, W, 1); }
  }
  if (st.win === 'panel') { k.fillStyle = col.dark; for (let b = 0; b <= bays; b++) k.fillRect(pad + b * bw - 0.5, top, 1, -top - gH); }
  if (st.pilasters) { k.fillStyle = col.trim; for (let b = 0; b <= bays; b += 2) k.fillRect(pad + b * bw - 3.5, top, 7, -top - gH); }
  drawGroundFloor(k, f, bays, bw, pad);
  drawRoof(k, f, top);

  // табличка с названием улицы
  if (f.plate) {
    const y = -(gH + 16);
    rr(k, 14, y, 86, 15, 3);
    k.fillStyle = '#F4F6F8';
    k.fill();
    text(k, f.plate, 57, y + 8, 78, 7.5, '#5E6B78', 800, FONT.text);
  }
}

/* Низкие и особые участки ближнего ряда. draw(k, f): начало координат — левый нижний угол */
const SPECIAL = {
  garages: {
    w: [300, 380], h: 100,
    draw(k, f) {
      const n = Math.round(f.w / 60), gw = f.w / n, tones = ['#B9A99A', '#A9B5A6', '#B6B9BD', '#C2A593'];
      for (let i = 0; i < n; i++) {
        const x = i * gw, tone = tones[hash3(f.seed, i, 1) % tones.length];
        k.fillStyle = tone;
        k.fillRect(x, -80, gw - 2, 80);
        k.fillStyle = shade(tone, -0.12);
        k.fillRect(x + 6, -66, gw - 14, 66);
        k.fillStyle = shade(tone, -0.2);
        k.fillRect(x + gw / 2 - 1.5, -66, 1.5, 66);
        k.fillRect(x - 2, -86, gw + 2, 7);
        if (hash3(f.seed, i, 2) % 4 === 0) text(k, 'СДАМ', x + gw / 2, -36, gw - 20, 11, shade(tone, 0.5));
        else text(k, String(100 + hash3(f.seed, i, 3) % 300), x + gw / 2, -56, gw - 20, 8, shade(tone, 0.35), 700, FONT.text);
      }
    },
  },
  fence: {      // бетонный забор промзоны
    w: [280, 380], h: 110,
    draw(k, f) {
      const pw = 76, n = Math.ceil(f.w / pw);
      for (let i = 0; i < n; i++) {
        const x = i * pw;
        k.fillStyle = '#C9C9C6';
        k.fillRect(x, -84, pw - 3, 84);
        k.strokeStyle = '#B4B4B0';
        k.lineWidth = 2;
        k.beginPath();
        for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
          const cx = x + 20 + c * 34, cy = -62 + r * 36;
          k.moveTo(cx, cy - 14); k.lineTo(cx + 13, cy); k.lineTo(cx, cy + 14); k.lineTo(cx - 13, cy); k.closePath();
        }
        k.stroke();
      }
      k.strokeStyle = '#A9A9A5';
      k.lineWidth = 1.5;
      k.beginPath();
      for (let x = 0; x < f.w; x += 12) { k.moveTo(x, -90); k.lineTo(x + 6, -96); k.lineTo(x + 12, -90); }
      k.stroke();
      const ad = f.ad;
      if (ad) {
        const brand = K.BRANDS[ad[0]];
        rr(k, f.w * 0.3, -70, 130, 48, 4);
        k.fillStyle = soft(brand.bg, '#C9C9C6');
        k.fill();
        text(k, ad[0], f.w * 0.3 + 65, -55, 116, 13, soft(brand.fg, brand.bg));
        text(k, ad[1], f.w * 0.3 + 65, -36, 116, 9, soft(brand.fg, brand.bg), 700, FONT.text);
      }
    },
  },
  stroyka: {    // строительный забор, за ним каркас будущего дома
    w: [280, 360], h: 330,
    draw(k, f) {
      k.fillStyle = '#D2D5D8';
      for (let x = 18; x < f.w - 10; x += 64) k.fillRect(x, -320, 9, 320);
      for (let y = -90; y > -330; y -= 58) k.fillRect(8, y, f.w - 16, 8);
      k.fillStyle = '#E2E4E6';
      k.fillRect(26, -206, f.w * 0.5, 50);
      const pw = 62, n = Math.ceil(f.w / pw);
      for (let i = 0; i < n; i++) {
        k.fillStyle = i % 2 ? '#A9C7B0' : '#F1F3F1';
        k.fillRect(i * pw, -86, pw - 2, 86);
      }
      k.fillStyle = '#8FB39A';
      k.fillRect(0, -90, f.w, 5);
      const brand = K.BRANDS[f.brands[0]] || K.BRANDS['Мегаквартир'];
      rr(k, f.w * 0.16, -76, f.w * 0.68, 56, 4);
      k.fillStyle = soft(brand.bg, '#DADADA');
      k.fill();
      text(k, f.brands[0] || 'Мегаквартир', f.w * 0.5, -58, f.w * 0.6, 15, soft(brand.fg, brand.bg));
      text(k, 'БУДЕТ БИЗНЕС-КЛАСС', f.w * 0.5, -36, f.w * 0.6, 9.5, soft(brand.fg, brand.bg), 700, FONT.text);
    },
  },
  parkFence: {  // ограда парка, за ней деревья
    w: [300, 400], h: 260,
    draw(k, f) {
      for (let i = 0; i < 4; i++) {
        const cx = 40 + i * (f.w - 80) / 3 + (hash3(f.seed, i, 1) % 30) - 15, top = 170 + hash3(f.seed, i, 2) % 60;
        k.fillStyle = shade(f.col.leaf2, -0.08);
        k.fillRect(cx - 5, -100, 10, 100);
        k.fillStyle = i % 2 ? f.col.leaf : f.col.leaf2;
        k.beginPath(); dot(k, cx, -top + 20, 52); dot(k, cx - 34, -top + 62, 40); dot(k, cx + 36, -top + 58, 42); k.fill();
      }
      k.fillStyle = '#C9CCC8';
      for (let x = 0; x <= f.w; x += 100) k.fillRect(x - 7, -82, 14, 82);
      k.fillStyle = '#9FA5A2';
      k.fillRect(0, -70, f.w, 3);
      k.fillRect(0, -16, f.w, 3);
      for (let x = 6; x < f.w; x += 9) k.fillRect(x, -76, 1.8, 76);
    },
  },
  pond: {       // Патриаршие: пруд, жёлтый павильон, деревья
    w: [420, 460], h: 250,
    draw(k, f) {
      for (let i = 0; i < 5; i++) {
        const cx = 30 + i * (f.w - 60) / 4, top = 190 + hash3(f.seed, i, 2) % 40;
        k.fillStyle = shade(f.col.leaf2, -0.08);
        k.fillRect(cx - 5, -120, 10, 120);
        k.fillStyle = i % 2 ? f.col.leaf : f.col.leaf2;
        k.beginPath(); dot(k, cx, -top + 20, 50); dot(k, cx - 32, -top + 58, 38); dot(k, cx + 34, -top + 56, 40); k.fill();
      }
      // павильон
      const px = f.w * 0.52;
      k.fillStyle = '#E9D79A';
      k.fillRect(px, -150, 150, 110);
      k.fillStyle = '#F7F1DC';
      k.fillRect(px - 6, -156, 162, 9);
      k.beginPath(); poly(k, [px + 30, -156, px + 75, -182, px + 120, -156]); k.fill();
      for (let x = px + 10; x < px + 144; x += 22) k.fillRect(x, -147, 8, 107);
      k.fillStyle = '#C9B46E';
      for (let x = px + 22; x < px + 130; x += 22) { k.beginPath(); k.arc(x + 3, -96, 6, Math.PI, 0); k.rect(x - 3, -96, 12, 40); k.fill(); }
      // вода и берег
      k.fillStyle = '#C3D6DC';
      k.fillRect(0, -62, f.w, 34);
      k.fillStyle = 'rgba(255,255,255,.55)';
      for (let i = 0; i < 7; i++) k.fillRect(20 + (hash3(f.seed, i, 5) % (f.w - 80)), -56 + (i % 3) * 9, 34, 1.6);
      k.fillStyle = '#D9D4C5';
      k.fillRect(0, -30, f.w, 30);
      k.fillStyle = '#9FA5A2';
      k.fillRect(0, -44, f.w, 2.5);
      for (let x = 8; x < f.w; x += 16) k.fillRect(x, -44, 2, 16);
    },
  },
  embankment: { // набережная: парапет, река, другой берег
    w: [320, 420], h: 150,
    draw(k, f) {
      k.fillStyle = shade(f.col.far, -0.03);
      for (let i = 0, x = 0; x < f.w; i++) { const w = 30 + hash3(f.seed, i, 1) % 40, h = 20 + hash3(f.seed, i, 2) % 36; k.fillRect(x, -112 - h, w, h); x += w + 4; }
      k.fillStyle = '#C7D7DE';
      k.fillRect(0, -112, f.w, 62);
      k.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 9; i++) k.fillRect(10 + (hash3(f.seed, i, 5) % (f.w - 60)), -104 + (i % 5) * 11, 40, 1.6);
      k.fillStyle = '#CFCFCB';
      k.fillRect(0, -52, f.w, 52);
      k.fillStyle = '#BDBDB8';
      k.fillRect(0, -56, f.w, 6);
      for (let x = 0; x < f.w; x += 70) k.fillRect(x, -62, 12, 62);
    },
  },
  pavilion: {   // павильон ВДНХ вблизи
    w: [300, 340], h: 330,
    draw(k, f) {
      const W = f.w;
      k.fillStyle = '#EFEBDD';
      k.fillRect(0, -190, W, 190);
      k.fillStyle = '#E3DDCB';
      k.fillRect(20, -168, W - 40, 150);
      k.fillStyle = '#F8F5EA';
      for (let x = 14; x < W - 20; x += (W - 46) / 7) { k.fillRect(x, -176, 18, 176); k.fillRect(x - 4, -182, 26, 8); k.fillRect(x - 3, -10, 24, 10); }
      k.fillRect(-6, -206, W + 12, 22);
      k.fillStyle = '#EFEBDD';
      k.fillRect(W * 0.18, -246, W * 0.64, 42);
      k.fillRect(W * 0.36, -280, W * 0.28, 36);
      k.beginPath(); poly(k, [W * 0.46, -280, W * 0.54, -280, W * 0.5, -330]); k.fill();
      k.fillStyle = '#D9C27A';
      k.fillRect(W * 0.18, -206, W * 0.64, 4);
      k.beginPath(); dot(k, W * 0.5, -224, 13); k.fill();
      k.fillStyle = '#C8C2AE';
      k.fillRect(W * 0.42, -110, W * 0.16, 110);
    },
  },
  theatre: {    // театр с колоннами
    w: [270, 300], h: 290,
    draw(k, f) {
      const W = f.w;
      k.fillStyle = f.col.wall;
      k.fillRect(0, -210, W, 210);
      k.fillStyle = f.col.trim;
      k.fillRect(-4, -222, W + 8, 14);
      k.beginPath(); poly(k, [10, -222, W / 2, -272, W - 10, -222]); k.fill();
      for (let x = 22; x < W - 30; x += (W - 62) / 5) { k.fillRect(x, -208, 18, 208); k.fillRect(x - 4, -208, 26, 8); }
      k.fillStyle = f.col.dark;
      k.fillRect(W * 0.3, -150, W * 0.4, 20);
      text(k, 'ТЕАТР', W / 2, -139.5, W * 0.36, 13, f.col.trim);
      k.fillStyle = f.col.deep;
      for (const x of [W * 0.24, W * 0.5, W * 0.76]) k.fillRect(x - 16, -74, 32, 74);
      k.fillStyle = f.col.dark;
      k.fillRect(0, -9, W, 9);
    },
  },
  wall: {       // стена с надписями
    w: [220, 260], h: 150,
    draw(k, f) {
      k.fillStyle = '#CFC6B8';
      k.fillRect(0, -132, f.w, 132);
      k.fillStyle = '#B9B0A2';
      k.fillRect(0, -136, f.w, 6);
      const marks = [['ЦОЙ ЖИВ', 0.3, -92, 20, '#4A4A4A', -0.05], ['КИНО', 0.74, -98, 16, '#8A3B36', 0.06], ['перемен!', 0.62, -52, 13, '#3B5A7A', -0.04], ['45', 0.16, -44, 15, '#5E7B5C', 0.08], ['сдам', 0.84, -30, 9, '#6B5A7A', 0]];
      for (const [t, px, y, size, color, rot] of marks) {
        k.save();
        k.translate(f.w * px, y);
        k.rotate(rot);
        k.globalAlpha = 0.75;
        text(k, t, 0, 0, f.w * 0.44, size, color, 800, FONT.text);
        k.restore();
      }
      k.globalAlpha = 1;
    },
  },
  /* ── достопримечательности: встают в ряд один раз при входе в район ── */
  vdnhArch: {   // арка главного входа ВДНХ
    w: [330, 330], h: 320,
    draw(k, f) {
      const W = f.w;
      k.fillStyle = '#EFEBDD';
      k.fillRect(0, -200, W, 60);
      for (const x of [0, 62, 124, W - 186, W - 124, W - 62]) k.fillRect(x, -200, 62 - 26, 200);
      k.fillStyle = '#F8F5EA';
      k.fillRect(-6, -212, W + 12, 14);
      k.fillRect(-4, -146, W + 8, 8);
      k.fillStyle = '#EFEBDD';
      k.fillRect(W * 0.3, -246, W * 0.4, 36);
      k.fillStyle = '#D9C27A';
      k.fillRect(W * 0.3, -214, W * 0.4, 4);
      // тракторист и колхозница со снопом
      k.fillRect(W * 0.5 - 13, -282, 9, 36);
      k.fillRect(W * 0.5 + 4, -282, 9, 36);
      k.beginPath(); dot(k, W * 0.5 - 8.5, -288, 6); dot(k, W * 0.5 + 8.5, -288, 6); dot(k, W * 0.5, -306, 11); k.fill();
      k.fillRect(W * 0.5 - 1.5, -300, 3, 22);
    },
  },
  rocket: {     // ракета «Восток»
    w: [130, 130], h: 320,
    draw(k, f) {
      k.fillStyle = '#C9CCC8';
      k.beginPath(); poly(k, [20, 0, 34, 0, 70, -150, 60, -154]); k.fill();
      k.fillRect(10, -14, 70, 14);
      k.save();
      k.translate(74, -150);
      k.rotate(0.3);
      k.fillStyle = '#F2F2EE';
      k.beginPath(); poly(k, [-9, 0, 9, 0, 9, -110, 0, -150, -9, -110]); k.fill();
      k.fillStyle = '#DADAD4';
      k.beginPath(); poly(k, [-22, 0, -9, 0, -9, -70, -15, -84]); poly(k, [22, 0, 9, 0, 9, -70, 15, -84]); k.fill();
      k.fillStyle = '#C9584C';
      k.fillRect(-9, -98, 18, 5);
      k.restore();
    },
  },
  bridge: {     // Парящий мост в Зарядье
    w: [430, 430], h: 190,
    draw(k, f) {
      const W = f.w;
      for (let i = 0; i < 4; i++) {
        const cx = 30 + i * 110;
        k.fillStyle = i % 2 ? f.col.leaf : f.col.leaf2;
        k.beginPath(); dot(k, cx, -64, 40); dot(k, cx + 40, -52, 30); k.fill();
      }
      k.fillStyle = '#E4E6E8';
      k.beginPath();
      poly(k, [0, -40, W * 0.5, -150, W, -40, W, -30, W * 0.5, -134, 0, -30]);
      k.fill();
      k.fillStyle = '#C9D3D9';
      k.beginPath(); poly(k, [0, -40, W * 0.5, -150, W, -40, W, -44, W * 0.5, -162, 0, -44]); k.fill();
      k.fillStyle = '#D5D8DA';
      k.fillRect(0, -30, W, 30);
    },
  },
  ges2: {       // ГЭС-2: синие трубы
    w: [280, 280], h: 320,
    draw(k, f) {
      k.fillStyle = '#E4E1D8';
      k.fillRect(0, -130, 280, 130);
      k.beginPath(); poly(k, [0, -130, 60, -168, 220, -168, 280, -130]); k.fill();
      k.fillStyle = '#C3D0DB';
      k.fillRect(22, -150, 236, 120);
      k.fillStyle = '#E4E1D8';
      for (let x = 22; x < 258; x += 24) k.fillRect(x - 1.5, -150, 3, 120);
      k.fillRect(22, -92, 236, 3);
      k.fillStyle = '#7F9FC4';
      for (let i = 0; i < 4; i++) { k.fillRect(56 + i * 46, -318, 16, 152); k.fillRect(53 + i * 46, -322, 22, 6); }
      k.fillStyle = '#D6D2C8';
      k.fillRect(0, -10, 280, 10);
    },
  },
};

/* ───────────────────────────── УЛИЦА ─────────────────────────────
   Рисуются от середины основания. it.prop — серый цвет района, it.leaf — зелень. */
function crown(ctx, it, blobs) {
  ctx.fillStyle = it.leaf;
  ctx.beginPath();
  for (const [x, y, r] of blobs) dot(ctx, x, y, r);
  ctx.fill();
  ctx.fillStyle = it.leaf2;
  ctx.beginPath();
  for (let i = 0; i < blobs.length; i += 2) dot(ctx, blobs[i][0] + 8, blobs[i][1] + 10, blobs[i][2] * 0.6);
  ctx.fill();
}

const PropArt = {
  tree: {
    w: 110,
    draw(ctx, it) {
      ctx.fillStyle = it.trunk;
      ctx.beginPath(); poly(ctx, [-5, 0, 5, 0, 3.5, -110, -3.5, -110]); ctx.fill();
      crown(ctx, it, [[0, -150, 46], [-32, -116, 34], [34, -120, 36], [4, -108, 30]]);
    },
  },
  treeBig: {
    w: 150,
    draw(ctx, it) {
      ctx.fillStyle = it.trunk;
      ctx.beginPath(); poly(ctx, [-7, 0, 7, 0, 5, -140, -5, -140]); ctx.fill();
      ctx.beginPath(); poly(ctx, [0, -90, 3, -96, 36, -138, 32, -140]); poly(ctx, [0, -104, -3, -110, -34, -150, -30, -152]); ctx.fill();
      crown(ctx, it, [[0, -200, 60], [-48, -156, 44], [50, -160, 46], [-10, -138, 40], [26, -226, 34]]);
    },
  },
  poplar: {
    w: 60,
    draw(ctx, it) {
      ctx.fillStyle = it.trunk;
      ctx.fillRect(-3, -40, 6, 40);
      ctx.fillStyle = it.leaf;
      ctx.beginPath(); ctx.ellipse(0, -138, 24, 108, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = it.leaf2;
      ctx.beginPath(); ctx.ellipse(6, -126, 12, 76, 0, 0, TAU); ctx.fill();
    },
  },
  lamp: {
    w: 50,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.beginPath(); poly(ctx, [-3.5, 0, 3.5, 0, 2, -232, -2, -232]); ctx.fill();
      ctx.fillRect(-6, -10, 12, 10);
      ctx.fillRect(-2, -234, 34, 3.5);
      rr(ctx, 22, -234, 22, 8, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillRect(25, -227, 16, 2.5);
    },
  },
  lampOld: {    // арбатский фонарь
    w: 44,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.beginPath(); poly(ctx, [-6, 0, 6, 0, 2.5, -24, 2.5, -118, -2.5, -118, -2.5, -24]); ctx.fill();
      ctx.fillRect(-20, -120, 40, 3.5);
      for (const x of [-20, 20]) {
        ctx.fillStyle = it.prop;
        ctx.fillRect(x - 1.5, -128, 3, 9);
        ctx.beginPath(); poly(ctx, [x - 8, -150, x + 8, -150, x + 5.5, -128, x - 5.5, -128]); ctx.fill();
        ctx.beginPath(); poly(ctx, [x - 10, -150, x + 10, -150, x, -161]); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); poly(ctx, [x - 5.5, -147, x + 5.5, -147, x + 3.8, -131, x - 3.8, -131]); ctx.fill();
      }
    },
  },
  busstop: {
    w: 170,
    draw(ctx, it) {
      ctx.fillStyle = 'rgba(255,255,255,.42)';
      ctx.fillRect(-70, -82, 140, 76);
      ctx.fillStyle = it.prop;
      ctx.fillRect(-76, -90, 152, 8);
      ctx.fillRect(-70, -84, 4, 84);
      ctx.fillRect(66, -84, 4, 84);
      ctx.fillRect(-2, -84, 3, 84);
      ctx.fillRect(-56, -24, 70, 5);
      ctx.fillRect(-50, -20, 4, 20);
      ctx.fillRect(4, -20, 4, 20);
      // рекламная панель сбоку
      rr(ctx, 24, -78, 38, 66, 3); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
      text(ctx, it.text[0], 43, -52, 32, 6.5, it.ink);
      text(ctx, it.text[1], 43, -40, 32, 4.6, it.ink, 700, FONT.text);
      // знак остановки
      ctx.fillStyle = it.prop;
      ctx.fillRect(84, -120, 3, 120);
      rr(ctx, 74, -146, 24, 24, 4); ctx.fill();
      text(ctx, 'А', 86, -133.5, 18, 14, '#FFFFFF', 900);
    },
  },
  kiosk: {
    w: 120,
    draw(ctx, it) {
      const brand = K.BRANDS[it.brand] || { bg: it.prop, fg: '#FFFFFF' };
      rr(ctx, -46, -84, 92, 84, 5); ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.fill();
      ctx.fillStyle = it.prop;
      ctx.fillRect(-46, -12, 92, 12);
      ctx.fillStyle = 'rgba(185,205,214,.9)';
      ctx.fillRect(-36, -62, 46, 32);
      ctx.fillStyle = it.prop;
      ctx.fillRect(18, -62, 20, 62);
      ctx.fillRect(-40, -28, 54, 4);
      ctx.fillStyle = soft(brand.bg);
      rr(ctx, -52, -100, 104, 22, 5); ctx.fill();
      text(ctx, it.brand, 0, -88.5, 92, 12, soft(brand.fg, brand.bg));
      ctx.beginPath(); poly(ctx, [-52, -78, 52, -78, 58, -68, -58, -68]); ctx.fillStyle = soft(brand.bg); ctx.fill();
    },
  },
  metro: {      // вестибюль метро в настоящую величину
    w: 230,
    draw(ctx, it) {
      ctx.fillStyle = 'rgba(205,220,228,.78)';
      ctx.fillRect(-84, -92, 168, 92);
      ctx.fillStyle = it.prop;
      for (let x = -84; x <= 84; x += 28) ctx.fillRect(x - 2, -92, 4, 92);
      ctx.fillRect(-84, -60, 168, 3);
      rr(ctx, -96, -108, 192, 18, 5); ctx.fill();
      text(ctx, 'МЕТРО', 0, -98.5, 90, 10.5, '#FFFFFF');
      ctx.fillStyle = shade(it.prop, -0.18);
      ctx.fillRect(-28, -70, 56, 70);
      ctx.fillStyle = 'rgba(205,220,228,.9)';
      ctx.fillRect(-24, -66, 23, 62);
      ctx.fillRect(1, -66, 23, 62);
      // буква М на столбе
      ctx.fillStyle = it.prop;
      ctx.fillRect(104, -150, 5, 150);
      ctx.beginPath(); ctx.arc(106.5, -172, 24, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#E6A69C'; ctx.stroke();
      text(ctx, 'М', 106.5, -170, 34, 26, '#E08A7E', 900);
    },
  },
  billboard: {
    w: 230,
    draw(ctx, it) {
      const brand = K.BRANDS[it.text[0]] || { bg: '#FFFFFF', fg: C.ink };
      ctx.fillStyle = it.prop;
      ctx.fillRect(-58, -96, 7, 96);
      ctx.fillRect(51, -96, 7, 96);
      rr(ctx, -104, -200, 208, 108, 6); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = it.prop; ctx.stroke();
      rr(ctx, -96, -192, 192, 40, 4); ctx.fillStyle = soft(brand.bg); ctx.fill();
      text(ctx, it.text[0], 0, -171.5, 176, 21, soft(brand.fg, brand.bg));
      text(ctx, it.text[1], 0, -124, 184, 15, it.ink, 800, FONT.text);
    },
  },
  citylight: {  // сити-формат с объявлением
    w: 80,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-4, -34, 8, 34);
      rr(ctx, -30, -122, 60, 90, 5); ctx.fill();
      rr(ctx, -25, -117, 50, 80, 3); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fill();
      const ls = it.meme.split(' ');
      const mid = Math.ceil(ls.length / 2);
      text(ctx, ls.slice(0, mid).join(' '), 0, -86, 44, 9, it.ink);
      if (ls.length > 1) text(ctx, ls.slice(mid).join(' '), 0, -72, 44, 9, it.ink);
      ctx.fillStyle = it.prop;
      ctx.fillRect(-18, -56, 36, 2);
    },
  },
  bench: {
    w: 90,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-34, -17, 68, 4.5);
      ctx.fillRect(-34, -34, 68, 4.5);
      ctx.fillRect(-34, -26, 68, 3);
      ctx.fillRect(-28, -34, 4, 34);
      ctx.fillRect(24, -34, 4, 34);
    },
  },
  granny: {     // бабушка на лавочке
    w: 100,
    draw(ctx, it) {
      PropArt.bench.draw(ctx, it);
      ctx.fillStyle = '#B9A6B4';
      rr(ctx, -12, -44, 22, 30, 7); ctx.fill();
      ctx.fillRect(-6, -17, 20, 6);
      ctx.fillRect(9, -17, 6, 17);
      ctx.fillStyle = '#E8C9A8';
      ctx.beginPath(); ctx.arc(0, -52, 7.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#D9B3B0';
      ctx.beginPath(); ctx.arc(-0.5, -53.5, 8.6, Math.PI * 0.85, Math.PI * 2.15); ctx.closePath(); ctx.fill();
      ctx.beginPath(); poly(ctx, [-7, -48, -11, -40, -4, -44]); ctx.fill();
      ctx.fillStyle = it.prop;
      ctx.fillRect(18, -40, 2.5, 40);
    },
  },
  playground: { // детская площадка: горка и качели
    w: 220,
    draw(ctx, it) {
      ctx.strokeStyle = it.prop;
      ctx.lineCap = 'round';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-96, 0); ctx.lineTo(-80, -86); ctx.lineTo(-20, -86); ctx.lineTo(-4, 0);
      ctx.moveTo(-80, -86); ctx.lineTo(-66, 0);
      ctx.moveTo(-20, -86); ctx.lineTo(-34, 0);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-60, -86); ctx.lineTo(-58, -28); ctx.moveTo(-44, -86); ctx.lineTo(-42, -28);
      ctx.stroke();
      ctx.fillStyle = '#D9B3A6';
      ctx.fillRect(-64, -30, 28, 5);
      // горка
      ctx.fillStyle = it.prop;
      ctx.fillRect(30, -70, 5, 70);
      ctx.fillRect(56, -70, 5, 70);
      ctx.fillRect(26, -74, 40, 6);
      for (let y = -14; y > -70; y -= 14) ctx.fillRect(30, y, 30, 3);
      ctx.beginPath(); poly(ctx, [60, -70, 68, -70, 112, -6, 112, 0, 100, 0]); ctx.fillStyle = '#C9D8B0'; ctx.fill();
      ctx.beginPath(); poly(ctx, [24, -74, 46, -100, 68, -74]); ctx.fillStyle = '#D9B3A6'; ctx.fill();
    },
  },
  parkedCar: {  // машина у обочины: светлая, без обводки — это фон
    w: 180,
    draw(ctx, it) {
      ctx.fillStyle = it.car;
      ctx.beginPath();
      poly(ctx, [-70, -8, -70, -22, -64, -29, -34, -33, -20, -48, 36, -48, 48, -35, 66, -33, 70, -26, 70, -8]);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); poly(ctx, [-29, -33.5, -17.5, -45, 5, -45, 5, -33.5]); poly(ctx, [9, -33.5, 9, -45, 34, -45, 42.5, -33.5]); ctx.fill();
      ctx.fillStyle = shade(it.car, -0.22);
      ctx.beginPath(); dot(ctx, -42, -11, 11); dot(ctx, 40, -11, 11); ctx.fill();
    },
  },
  parkedVan: {
    w: 210,
    draw(ctx, it) {
      ctx.fillStyle = it.car;
      ctx.fillRect(-88, -78, 124, 64);
      ctx.beginPath(); poly(ctx, [38, -14, 38, -62, 62, -62, 78, -42, 88, -38, 88, -14]); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); poly(ctx, [44, -58, 60, -58, 72, -43, 44, -43]); ctx.fill();
      ctx.fillStyle = shade(it.car, -0.22);
      ctx.fillRect(-86, -20, 172, 6);
      ctx.beginPath(); dot(ctx, -58, -12, 12); dot(ctx, 60, -12, 12); ctx.fill();
    },
  },
  fountain: {
    w: 200,
    draw(ctx, it) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const dx of [-46, -24, 0, 24, 46]) { ctx.moveTo(dx * 0.3, -40); ctx.quadraticCurveTo(dx * 0.7, -110 + Math.abs(dx) * 0.6, dx, -30); }
      ctx.stroke();
      ctx.fillStyle = '#D9C27A';
      ctx.fillRect(-10, -56, 20, 30);
      ctx.beginPath(); ctx.arc(0, -60, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#C7D7DE';
      ctx.fillRect(-78, -26, 156, 10);
      ctx.fillStyle = '#E3DFD2';
      rr(ctx, -84, -20, 168, 20, 5); ctx.fill();
    },
  },
  flower: {     // клумба
    w: 130,
    draw(ctx, it) {
      ctx.fillStyle = '#D6D2C6';
      rr(ctx, -52, -16, 104, 16, 5); ctx.fill();
      ctx.fillStyle = it.leaf;
      ctx.beginPath(); for (let x = -44; x <= 44; x += 11) dot(ctx, x, -18, 8); ctx.fill();
      ctx.fillStyle = '#E3B5B0';
      ctx.beginPath(); for (let x = -40; x <= 44; x += 14) dot(ctx, x, -23, 3.4); ctx.fill();
      ctx.fillStyle = '#EBD9A0';
      ctx.beginPath(); for (let x = -33; x <= 40; x += 14) dot(ctx, x, -20, 3); ctx.fill();
    },
  },
};

/* Машины на дороге в нижней полосе: тёмные силуэты с огнями */
function drawTraffic(ctx, t) {
  const dir = t.v < 0 ? -1 : 1;                  // куда смотрит
  ctx.save();
  ctx.translate(t.x, t.y);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.fillStyle = t.color;
  ctx.beginPath();
  if (t.kind === 'bus') {
    rr(ctx, -110, -62, 220, 54, 8);
  } else if (t.kind === 'van') {
    poly(ctx, [-70, -8, -70, -58, 34, -58, 34, -46, 54, -46, 66, -30, 70, -28, 70, -8]);
  } else if (t.kind === 'courier') {
    poly(ctx, [-16, -8, -16, -14, 14, -14, 14, -8]);
    ctx.rect(-2, -44, 9, 30); ctx.rect(-14, -46, 14, 16);
    dot(ctx, 3, -50, 6);
  } else {
    poly(ctx, [-58, -8, -58, -20, -50, -25, -30, -27, -18, -40, 26, -40, 38, -28, 54, -26, 58, -20, 58, -8]);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  if (t.kind === 'bus') { for (let x = -98; x < 96; x += 28) ctx.fillRect(x, -54, 22, 18); }
  else if (t.kind === 'car' || t.kind === 'taxi') { ctx.beginPath(); poly(ctx, [-26, -28, -16, -37, 24, -37, 33, -28]); ctx.fill(); }
  ctx.fillStyle = '#0E0E0E';
  ctx.beginPath();
  if (t.kind === 'bus') { dot(ctx, -72, -8, 10); dot(ctx, 70, -8, 10); }
  else if (t.kind === 'van') { dot(ctx, -44, -8, 9.5); dot(ctx, 46, -8, 9.5); }
  else if (t.kind === 'courier') { dot(ctx, -14, -6, 5); dot(ctx, 13, -6, 5); }
  else { dot(ctx, -34, -8, 9); dot(ctx, 34, -8, 9); }
  ctx.fill();
  if (t.kind === 'taxi') { ctx.fillStyle = '#F2CF3B'; ctx.fillRect(-8, -45, 16, 5); }
  if (t.kind !== 'courier') {
    const front = t.kind === 'bus' ? 110 : t.kind === 'van' ? 70 : 58;
    ctx.fillStyle = 'rgba(255,243,196,.9)';
    ctx.fillRect(front - 3, -22, 3, 5);
    ctx.fillStyle = 'rgba(255,77,61,.85)';
    ctx.fillRect(-front, -22, 3, 5);
  }
  ctx.restore();
}

/* ───────────────────────────── МИР ───────────────────────────── */
const PARALLAX = { far: 0.06, back: 0.22, front: 0.5, props: 0.72 };

class World {
  constructor(game) {
    this.game = game;
    this.reset(K.LOCATIONS[0]);
  }

  reset(loc) {
    this.rng = makeRng(20261009);
    this.loc = loc;
    this.prevLoc = loc;
    this.skyT = 1;
    this.groundOffset = 0;
    this.time = 0;
    this.farSets = [this._newSet(loc, 1)];
    this.backSets = [this._newSet(loc, 1)];
    this.front = { items: [], cursor: -40 };
    this.props = { items: [], cursor: 60 };
    this.frontQueue = [];
    this.brandBag = [];
    this.lastStyle = '';
    this.lastProp = '';
    this.clouds = [];
    for (let i = 0; i < 7; i++) this.clouds.push({ x: this.rng.range(0, 1500), y: this.rng.range(0.1, 0.62), w: this.rng.range(60, 130) });
    this.traffic = [];
    this.plane = null;
    this.fill();
  }

  _newSet(loc, alpha) { return { loc, items: [], cursor: -80, alpha, target: 1 }; }

  /* Смена района: даль и дома растворяются в новые, фасады и улица въезжают справа */
  setLocation(loc) {
    if (loc === this.loc) return;
    this.prevLoc = this.loc;
    this.loc = loc;
    this.skyT = 0;
    for (const sets of [this.farSets, this.backSets]) {
      for (const s of sets) s.target = 0;
      sets.unshift(this._newSet(loc, 0));
      if (sets.length > 3) sets.length = 3;
    }
    this.frontQueue = (loc.landmarks || []).slice();
    this.brandBag = [];
    this.fill();
  }

  /* После загрузки шрифтов вывески надо перерисовать */
  invalidateSprites() {
    for (const s of this.backSets) for (const b of s.items) b.sprite = null;
    for (const f of this.front.items) f.sprite = null;
  }

  fill() {
    const edge = this.game.view.w + 300;
    for (const s of this.farSets) if (s.target === 1) while (s.cursor < edge) { const it = this._makeFar(s, s.cursor); s.items.push(it); s.cursor += it.advance; }
    for (const s of this.backSets) if (s.target === 1) while (s.cursor < edge) { const it = this._makeBack(s, s.cursor); s.items.push(it); s.cursor += it.advance; }
    while (this.front.cursor < edge) { const it = this._makeFront(this.front.cursor); this.front.items.push(it); this.front.cursor += it.advance; }
    while (this.props.cursor < edge) { const it = this._makeProp(this.props.cursor); this.props.items.push(it); this.props.cursor += it.advance; }
  }

  update(dx, dt) {
    this.time += dt;
    const scroll = (items, d, margin) => {
      for (const it of items) it.x -= d;
      while (items.length && items[0].x + items[0].w < -margin) items.shift();     // ушло за экран — удаляем
    };
    for (const sets of [this.farSets, this.backSets]) {
      const par = sets === this.farSets ? PARALLAX.far : PARALLAX.back;
      for (let i = sets.length - 1; i >= 0; i--) {
        const s = sets[i];
        s.cursor -= dx * par;
        scroll(s.items, dx * par, 160);
        s.alpha = clamp(s.alpha + (s.target ? dt / 1.5 : -dt / 1.5), 0, 1);
        if (!s.target && s.alpha <= 0) sets.splice(i, 1);
      }
    }
    this.front.cursor -= dx * PARALLAX.front;
    scroll(this.front.items, dx * PARALLAX.front, 80);
    this.props.cursor -= dx * PARALLAX.props;
    scroll(this.props.items, dx * PARALLAX.props, 140);
    this.fill();

    for (const c of this.clouds) {
      c.x -= dx * 0.02 + 5 * dt;
      if (c.x + c.w < -20) c.x += Math.max(1500, this.game.view.w + 300);
    }
    this.groundOffset += dx;
    if (this.skyT < 1) this.skyT = Math.min(1, this.skyT + dt / 1.6);
    this._updateTraffic(dt);
    this._updatePlane(dt);
  }

  _makeFar(set, x) {
    const kind = this.rng.weighted(set.loc.far), art = FarArt[kind];
    const s = this.game.view.farScale * this.rng.range(0.88, 1.05) * (art.scale || 1);
    const w = art.w * s;
    return { x, kind, w, s, seed: this.rng.int(0, 99999), advance: w + this.rng.range(90, 260) };
  }

  _makeBack(set, x) {
    const L = set.loc.back, r = this.rng;
    const kind = r.weighted(L.kinds), dims = BackArt[kind].dims(r);
    const maxH = this.game.view.maxBuildingH;
    const body = r.pick(L.colors);
    const h = Math.max(dims.minH || 0, dims.h * maxH);
    return {
      x, kind, w: Math.round(dims.w), h: Math.round(h),
      extra: dims.extra + (dims.spire ? h * dims.spire : 0) + 4,
      seed: r.int(0, 99999),
      body, dark: shade(body, -0.09), accent: mix(body, '#D2A583', 0.45), win: L.win, lit: L.lit, litPct: 11,
      advance: dims.w + r.range(-8, 34),
      sprite: null, ps: 0, draw: BackArt[kind].draw,
    };
  }

  _nextBrand(loc) {
    if (!this.brandBag.length) this.brandBag = this.rng.shuffle(loc.brands);
    return this.brandBag.pop();
  }

  _makeFront(x) {
    const loc = this.loc, r = this.rng, F = loc.front;
    let id = this.frontQueue.shift();
    if (!id) {
      id = r.weighted(F.styles);
      if (SPECIAL[id] && id === this.lastStyle) id = r.weighted(F.styles);      // два пруда подряд не нужны
    }
    this.lastStyle = id;
    const wall = r.pick(F.walls);
    const col = {
      wall, trim: F.trim, glass: F.glass, roof: F.roof, lit: mix(F.glass, '#FFF6D6', 0.6),
      base: shade(wall, -0.05), dark: shade(wall, -0.16), deep: shade(wall, -0.3), accent: mix(wall, '#D2A583', 0.5),
      leaf: loc.foliage[0], leaf2: loc.foliage[1], far: loc.farColor,
    };
    const item = { x, seed: r.int(0, 99999), col, sprite: null, ps: 0, brands: [] };
    const sp = SPECIAL[id];
    if (sp) {
      item.w = Math.round(r.range(sp.w[0], sp.w[1]));
      item.h = sp.h;
      item.draw = sp.draw;
      if (id === 'stroyka') item.brands = [this._pickBrand(loc, ['Мегаквартир', 'Самолёт', 'Домтык'])];
      if (id === 'fence' && r.chance(0.7)) item.ad = r.pick(K.ADS);
      item.advance = item.w + r.range(6, 30);
    } else {
      const st = STYLES[id];
      item.style = st;
      item.w = Math.round(r.range(st.w[0], st.w[1]));
      const maxFloors = Math.max(1, Math.ceil((this.game.view.groundY + 70 - st.groundH) / st.floorH));
      item.floors = Math.min(r.int(st.floors[0], st.floors[1]), maxFloors);
      item.h = st.groundH + item.floors * st.floorH + 50;
      item.draw = drawFacade;
      if (st.ground === 'shop') { item.brands = [this._nextBrand(loc)]; if (item.w > 285 && r.chance(0.55)) item.brands.push(this._nextBrand(loc)); }
      else if (st.ground === 'lobby' && r.chance(0.5)) item.brands = [this._nextBrand(loc)];
      if (r.chance(0.3)) item.plate = loc.street;
      item.advance = item.w + r.range(-2, 22);
    }
    return item;
  }

  _pickBrand(loc, preferred) {
    const local = preferred.filter(b => loc.brands.includes(b));
    return this.rng.pick(local.length ? local : preferred);
  }

  _makeProp(x) {
    const loc = this.loc, r = this.rng;
    let kind = r.weighted(loc.props);
    if (kind === this.lastProp && PropArt[kind].w > 100) kind = r.weighted(loc.props);
    this.lastProp = kind;
    const s = r.range(0.94, 1.1), prop = shade(loc.farColor, -0.2);
    const item = {
      x, kind, s, w: PropArt[kind].w * s,
      prop, trunk: mix(prop, '#B49A80', 0.5), leaf: loc.foliage[0], leaf2: loc.foliage[1],
      ink: shade(prop, -0.3), car: r.pick(['#DADDE0', '#D3D6CE', '#D8CFC4', '#CBD3DA', '#C9C9C9']),
    };
    if (kind === 'kiosk') item.brand = this._pickBrand(loc, ['StarБакс', 'Cofish', 'Додо Крыша', 'Вкусно и запятая', 'Burger Царь', 'Пыжик']);
    if (kind === 'billboard' || kind === 'busstop') item.text = r.pick(K.ADS);
    if (kind === 'citylight') item.meme = r.pick(K.MEMES);
    item.advance = item.w + r.range(110, 300);
    return item;
  }

  /* Дорога: машины едут в обе стороны независимо от героя */
  _updateTraffic(dt) {
    const g = this.game, v = g.view, lanes = v.band >= 290 ? 2 : v.band >= 200 ? 1 : 0;
    if (!lanes) { this.traffic.length = 0; return; }
    const scroll = g.scrollSpeed;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      t.x += (t.v - scroll) * dt;
      if (t.x < -320 || t.x > v.w + 320 || t.lane >= lanes) this.traffic.splice(i, 1);
    }
    const want = lanes * 2;
    if (this.traffic.length < want && this.rng.chance(dt * 1.6)) {
      const lane = this.rng.int(0, lanes - 1);
      if (this.traffic.some(t => t.lane === lane && (t.x < -80 || t.x > v.w + 80))) return;
      const vv = lane === 0 ? this.rng.range(140, 460) : -this.rng.range(180, 320);
      const fromLeft = vv - scroll > 0;
      this.traffic.push({
        kind: this.rng.weighted(this.loc.traffic), lane, v: vv,
        x: fromLeft ? -260 : v.w + 260, y: 0,
        color: this.rng.pick(['#2A2A2A', '#303030', '#353535', '#2E3338']),
      });
    }
  }

  /* Самолёт над Соколом */
  _updatePlane(dt) {
    if (this.plane) {
      this.plane.x += 46 * dt;
      if (this.plane.x > this.game.view.w + 200) this.plane = null;
    } else if (this.loc.skyFx === 'plane' && this.rng.chance(dt * 0.12)) {
      this.plane = { x: -120, y: this.rng.range(0.12, 0.3) };
    }
  }

  drawSky(ctx) {
    const v = this.game.view, t = this.skyT, a = this.prevLoc.sky, b = this.loc.sky;
    const grad = ctx.createLinearGradient(0, 0, 0, v.groundY);
    grad.addColorStop(0, t >= 1 ? b[0] : mix(a[0], b[0], t));
    grad.addColorStop(1, t >= 1 ? b[1] : mix(a[1], b[1], t));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, v.w, v.h);

    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.9;
    for (const c of this.clouds) {
      const y = v.groundY * c.y * 0.6 + 30, h = c.w * 0.26;
      rr(ctx, c.x, y, c.w, h, h / 2);
      ctx.fill();
      ctx.beginPath();
      dot(ctx, c.x + c.w * 0.38, y + h * 0.12, h * 0.55);
      dot(ctx, c.x + c.w * 0.62, y + h * 0.32, h * 0.4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.plane) {
      const px = this.plane.x, py = v.groundY * this.plane.y + 20;
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(px - 120, py + 14); ctx.lineTo(px - 8, py + 2); ctx.stroke();
      ctx.fillStyle = this.loc.farColor;
      ctx.beginPath();
      poly(ctx, [px - 14, py + 2, px + 16, py - 5, px + 22, py - 7, px + 20, py - 3, px - 10, py + 6]);
      poly(ctx, [px - 2, py + 1, px - 10, py - 9, px - 5, py - 9, px + 8, py - 2]);
      poly(ctx, [px - 12, py + 3, px - 18, py - 4, px - 14, py - 4, px - 7, py + 3]);
      ctx.fill();
    }
  }

  _sprite(it, ps, pad) {
    const cw = Math.ceil((it.w + pad * 2) * ps), ch = Math.ceil((it.h + (it.extra || 0)) * ps);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const k = canvas.getContext('2d');
    k.scale(ps, ps);
    k.translate(pad, it.h + (it.extra || 0));
    it.draw(k, it);
    it.sprite = canvas;
    it.ps = ps;
    it.sw = cw / ps;
    it.sh = ch / ps;
    it.pad = pad;
  }

  drawCity(ctx) {
    const v = this.game.view, gy = v.groundY;
    const ps = Math.min(2, v.scale * v.dpr), snap = x => Math.round(x * ps) / ps;

    // дальний план
    for (let i = this.farSets.length - 1; i >= 0; i--) {
      const set = this.farSets[i];
      if (set.alpha <= 0) continue;
      ctx.globalAlpha = set.alpha;
      const color = set.loc.farColor;
      ctx.fillStyle = color;
      for (const it of set.items) {
        if (it.x > v.w + 20) continue;
        ctx.save();
        ctx.translate(it.x, gy);
        ctx.scale(it.s, it.s);
        const art = FarArt[it.kind];
        if (art.own) art.draw(ctx, it, color);
        else { ctx.beginPath(); art.draw(ctx, it); ctx.fill(); }
        ctx.restore();
      }
    }

    // дома целиком
    for (let i = this.backSets.length - 1; i >= 0; i--) {
      const set = this.backSets[i];
      if (set.alpha <= 0) continue;
      ctx.globalAlpha = set.alpha;
      for (const b of set.items) {
        if (b.x > v.w + 20) continue;
        if (!b.sprite || b.ps !== ps) this._sprite(b, ps, 6);
        ctx.drawImage(b.sprite, snap(b.x - b.pad), gy - b.h - b.extra, b.sw, b.sh);
      }
    }
    ctx.globalAlpha = 1;

    // фасады
    for (const f of this.front.items) {
      if (f.x > v.w + 20) continue;
      if (!f.sprite || f.ps !== ps) this._sprite(f, ps, 8);
      ctx.drawImage(f.sprite, snap(f.x - f.pad), gy - f.h, f.sw, f.sh);
    }

    // дымка: фон за игровой дорожкой чуть светлее, чтобы препятствия не терялись
    const sky = this.skyT >= 1 ? this.loc.sky[1] : mix(this.prevLoc.sky[1], this.loc.sky[1], this.skyT);
    const [r, g, b] = K.util.hexToRgb(sky);
    const haze = ctx.createLinearGradient(0, gy - 260, 0, gy);
    haze.addColorStop(0, `rgba(${r},${g},${b},0)`);
    haze.addColorStop(1, `rgba(${r},${g},${b},0.42)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, gy - 260, v.w, 260);

    // улица
    for (const it of this.props.items) {
      if (it.x > v.w + 40) continue;
      ctx.save();
      ctx.translate(it.x + it.w / 2, gy);
      ctx.scale(it.s, it.s);
      PropArt[it.kind].draw(ctx, it);
      ctx.restore();
    }
  }

  drawGround(ctx) {
    const g = this.game, v = g.view, gy = v.groundY, x0 = -60, W = v.w + 120;

    // тротуар
    ctx.fillStyle = C.sidewalk;
    ctx.fillRect(x0, gy, W, 14);
    ctx.fillStyle = C.sidewalkJoint;
    ctx.beginPath();
    for (let x = -(this.groundOffset % 46) - 46; x < v.w + 46; x += 46) ctx.rect(x, gy + 2, 1.5, 12);
    ctx.fill();

    // асфальт и линия земли
    ctx.fillStyle = C.ink;
    ctx.fillRect(x0, gy + 14, W, v.h - gy + 80);
    ctx.fillRect(x0, gy, W, 2.5);

    const lanes = v.band >= 290 ? 2 : v.band >= 200 ? 1 : 0;
    const dash = y => {
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.beginPath();
      for (let x = -(this.groundOffset % 78) - 78; x < v.w + 78; x += 78) ctx.rect(x, y, 36, 3.5);
      ctx.fill();
    };
    if (lanes === 0) dash(gy + 32);
    else {
      // машины на дороге: перед героем, но ниже игровой дорожки
      for (const t of this.traffic) { t.y = gy + 14 + 66 + t.lane * 70; drawTraffic(ctx, t); }
      if (lanes === 2) dash(gy + 14 + 74);
      ctx.fillStyle = 'rgba(255,255,255,.1)';
      ctx.fillRect(x0, gy + 14 + lanes * 72 + 6, W, 2.5);
    }
    this._drawBand(ctx, lanes);
  }

  /* Нижняя полоса: район и сколько осталось до следующего */
  _drawBand(ctx, lanes) {
    const g = this.game, v = g.view, gy = v.groundY;
    const loc = g.location, next = g.nextLocation, m = g.score.meters;
    const span = g.locationTo - g.locationFrom;
    const prog = span > 0 ? clamp((m - g.locationFrom) / span, 0, 1) : 0;
    const pad = 18, maxW = v.w - pad * 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (v.band >= 200) {
      const top = gy + 14 + lanes * 72 + 18;
      ctx.fillStyle = '#8C8C8C';
      ctx.font = `700 12px ${FONT.text}`;
      ctx.fillText('РАЙОН', pad, top + 12);

      let size = Math.min(34, v.w * 0.062);
      ctx.font = `900 ${size}px ${FONT.display}`;
      const tw = ctx.measureText(loc.name).width;
      if (tw > maxW) { size *= maxW / tw; ctx.font = `900 ${size}px ${FONT.display}`; }
      ctx.fillStyle = C.lime;
      ctx.fillText(loc.name, pad, top + 22 + size);

      const by = top + 38 + size;
      rr(ctx, pad, by, maxW, 7, 3.5);
      ctx.fillStyle = C.ink2;
      ctx.fill();
      if (prog > 0.012) { rr(ctx, pad, by, maxW * prog, 7, 3.5); ctx.fillStyle = C.lime; ctx.fill(); }
      ctx.fillStyle = '#8C8C8C';
      ctx.font = `700 12px ${FONT.text}`;
      if (next) ctx.fillText(`дальше — ${next.short} · ${fmt(Math.max(0, Math.ceil(g.locationTo - m)))} м`, pad, by + 26);

      if (v.h - (by + 26) > 64) {
        ctx.fillStyle = '#3F3F3F';
        ctx.font = `900 13px ${FONT.display}`;
        ctx.fillText('KEYSTOMOSCOW', pad, v.h - 30);
      }
    } else {
      ctx.fillStyle = C.lime;
      ctx.font = `800 10px ${FONT.display}`;
      ctx.fillText(loc.name, pad, gy + 59);
      const bx = pad + ctx.measureText(loc.name).width + 14, bw = v.w - bx - pad;
      if (bw > 60) {
        rr(ctx, bx, gy + 51, bw, 5, 2.5);
        ctx.fillStyle = C.ink2;
        ctx.fill();
        if (prog > 0.012) { rr(ctx, bx, gy + 51, bw * prog, 5, 2.5); ctx.fillStyle = C.lime; ctx.fill(); }
      }
    }
  }
}

K.World = World;
K.CityArt = { FarArt, BackArt, STYLES, SPECIAL, PropArt };

})(window.KTM = window.KTM || {});
