/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — препятствия

   Каждое рисуется от левого нижнего угла, y вверх — минус. Размеры — как в каталоге
   (content.js): 33 юнита ≈ 1 метр. Правила те же, что в ink.js: силуэт читается
   сам по себе, контур 2.6 с нажимом, плоская краска, детали — тонкой линией.
   У вещи должен быть характер: вмятина, скотч, наклейка, потёртость — но одна-две,
   не больше. Всё, что стоит ЗА дорожкой (столбы, стойки, стволы), рисуется
   светлым и без чёрного контура: в это нельзя врезаться.
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, clamp, hash3 } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors, ink = K.ink, Art = K.Art;
const { S, F, B, D, L, T, THIN, MID } = Art;

const BACK = '#B9B2A4', BACK2 = '#A39B8D';             // то, что стоит за дорожкой
const GLASS = '#A9C6D6', RUBBER = '#211D1A', STEEL = '#8E969B';
const O = {};

/* ───────────────────────────── ДЕТАЛИ ───────────────────────────── */
function wheel(ctx, x, y, r, hub) {
  D(ctx, x, y, r, RUBBER, { lw: 1.6, off: 0, press: 0 });
  D(ctx, x, y, r * 0.46, hub || C.concrete, { lw: 1.2, off: 0, press: 0, n: 6 });
}

/* Бело-красная лента или доска: полосы режутся по форме */
function hazard(ctx, pts, step, a, b, lw) {
  const p = ink.poly(ctx, pts, { fill: a || C.white, lw: 0, off: 0 });
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
  ctx.save();
  ink.trace(ctx, p, true);
  ctx.clip();
  ctx.fillStyle = b || C.danger;
  ctx.beginPath();
  const h = y1 - y0;
  for (let sx = x0 - h; sx < x1; sx += step) { ctx.moveTo(sx, y1); ctx.lineTo(sx + step / 2, y1); ctx.lineTo(sx + step / 2 + h, y0); ctx.lineTo(sx + h, y0); ctx.closePath(); }
  ctx.fill();
  ctx.restore();
  ink.trace(ctx, p, true);
  ink.setLine(ctx, lw || ink.lw, C.ink);
  ctx.stroke();
  ink.trace(ctx, p, true, 0.6, 0.9);
  ctx.lineWidth = (lw || ink.lw) * 0.5;
  ctx.stroke();
}

/* Картонная коробка: скотч, стрелки «верх», мятый угол */
function carton(ctx, x, w, h, mark) {
  S(ctx, [x, 0, x + 0.5, -h + 1.5, x + w * 0.5, -h, x + w - 1, -h + 2.5, x + w, 0], C.kraft);
  F(ctx, [x + w * 0.42, -h + 1, x + w * 0.58, -h + 1, x + w * 0.57, -1.5, x + w * 0.43, -1.5], C.kraftLight);
  L(ctx, [x + 2, -h * 0.68, x + w - 2, -h * 0.66], 1.3, C.ink, { j: 0.3 });
  if (mark) T(ctx, mark, x + w * 0.5, -h * 0.34, { size: Math.min(8.5, h * 0.3), maxW: w - 8, font: FONT.text, weight: 800 });
  else {                                               // стрелки «не кантовать»
    for (const ax of [x + w * 0.18, x + w * 0.3]) { ctx.fillStyle = C.ink; ctx.fillRect(ax - 0.7, -h * 0.5, 1.4, h * 0.3); F(ctx, [ax - 2.6, -h * 0.46, ax, -h * 0.6, ax + 2.6, -h * 0.46], C.ink); }
  }
}

/* Прохожий ростом около 62. cx — центр. Большая голова, плечи шире бёдер.
   o: coat, legs, skin, hair(cb), step (−1…1), lean, noArms, hat(cb) */
function figure(ctx, cx, o) {
  o = o || {};
  const step = o.step || 0, ly = -26, coat = o.coat || C.cool, legs = o.legs || C.ink2;
  // ноги и ботинки
  S(ctx, ink.wedge(cx - 3.5, ly, 6.5, cx - 4 - step * 5, -3, 5), legs, { lw: 2, off: 0 });
  S(ctx, ink.wedge(cx + 3.5, ly, 6.5, cx + 4 + step * 5, -3, 5), legs, { lw: 2, off: 0 });
  S(ctx, [cx - 8 - step * 5, -3.6, cx - 1 - step * 5, -4, cx + 2.5 - step * 5, 0, cx - 8.5 - step * 5, 0], RUBBER, { lw: 1.4, off: 0, press: 0 });
  S(ctx, [cx + 0.5 + step * 5, -3.6, cx + 7.5 + step * 5, -4, cx + 11 + step * 5, 0, cx + step * 5, 0], RUBBER, { lw: 1.4, off: 0, press: 0 });
  // корпус: трапеция
  S(ctx, [cx - 8.5, ly + 1, cx + 8.5, ly + 1, cx + 10.5, -44, cx + 6, -47.5, cx - 6.5, -47.5, cx - 10.5, -43.5], coat, { lw: 2.4 });
  if (o.body) o.body(ctx, cx);
  // голова
  const hy = -54.5 + (o.sway || 0);
  S(ctx, [cx - 7.5, hy - 3, cx - 4.5, hy - 7.6, cx + 4, hy - 7.8, cx + 7.8, hy - 3.6, cx + 7.4, hy + 3.4, cx + 3.4, hy + 7.4, cx - 4.4, hy + 7, cx - 7.8, hy + 3], o.skin || C.skin, { lw: 2.1, off: 1.2 });
  if (o.hair) o.hair(ctx, cx, hy);
  else F(ctx, [cx - 8.4, hy + 1, cx - 8.2, hy - 4, cx - 4.6, hy - 8.8, cx + 4.4, hy - 9, cx + 8.4, hy - 4.2, cx + 8.2, hy - 1.6, cx - 3, hy - 2.4], C.ink);
  ctx.fillStyle = C.ink;
  const face = o.face === undefined ? -1 : o.face;       // куда смотрит: −1 — на героя (влево)
  ctx.fillRect(cx + face * 3.6 - 0.9, hy - 0.6, 1.8, 3.2);
  return hy;
}
const arm = (ctx, x1, y1, x2, y2, fill, w) => S(ctx, ink.wedge(x1, y1, w || 5.4, x2, y2, (w || 5.4) * 0.8), fill, { lw: 1.9, off: 0 });
const hand = (ctx, x, y, skin) => S(ctx, [x - 2.4, y - 2.4, x + 2.4, y - 2.2, x + 2.2, y + 2.4, x - 2.2, y + 2.2], skin || C.skin, { lw: 1.3, off: 0, press: 0, j: 0.2 });

Art.wheel = wheel;
Art.figure = figure;
Art.hazard = hazard;

/* ───────────────────────────── S: МЕЛОЧЬ ПОД НОГАМИ ───────────────────────────── */
/* Конус: стоит криво, подошва шире, одна полоса стёрлась */
O.cone = function (ctx) {
  S(ctx, [0.5, 0, 0, -3.6, 5, -5, 18.5, -4.6, 21.5, -3, 21, 0], RUBBER, { lw: 1.6, off: 0 });
  S(ctx, [5, -4.2, 18, -4, 14.8, -26.6, 10.6, -27.4], C.danger);
  F(ctx, [6.9, -12, 16.6, -11.4, 15.9, -16.6, 7.8, -17.2], C.white);
  F(ctx, [9.2, -20.6, 13.2, -20.4, 13.4, -22.6, 10.4, -23], C.white);
  L(ctx, [7.6, -7.2, 10.4, -9.4], 1.1, C.burgundy, { j: 0 });
  L(ctx, [9.6, -6.4, 11.8, -8.2], 1.1, C.burgundy, { j: 0 });
};

O.box = function (ctx) {
  carton(ctx, 1, 32, 28);
  S(ctx, [3, -27.5, 12, -33.5, 15, -28.5], C.kraftLight, MID);                 // клапан торчит
  B(ctx, 20, -13, 10, 8, C.white, { lw: 1.2, off: 0, press: 0 });               // наклейка со штрихкодом
  ctx.fillStyle = C.ink;
  for (let i = 0; i < 4; i++) ctx.fillRect(21.6 + i * 2, -11.4, i % 2 ? 0.8 : 1.3, 4.8);
};

/* Коробки для переезда: подписаны фломастером, верхняя съехала */
O.boxes = function (ctx, o) {
  carton(ctx, 1, 38, 22, 'КНИГИ');
  ctx.save();
  ctx.translate(4, -21.5);
  carton(ctx, 0, 34, 20, o.variant % 2 ? 'ПОСУДА' : 'КУХНЯ');
  ctx.translate(-2, -19.5);
  ctx.rotate(-0.09);
  carton(ctx, 3, 28, 17, 'РАЗНОЕ');
  ctx.restore();
};

/* Мусорные пакеты: чёрные с ушками и один синий */
O.bags = function (ctx) {
  const bag = (x, w, h, fill) => {
    S(ctx, [x, 0, x - 1.5, -h * 0.5, x + w * 0.22, -h * 0.92, x + w * 0.42, -h, x + w * 0.62, -h * 0.95, x + w + 1.5, -h * 0.55, x + w, 0], fill);
    S(ctx, [x + w * 0.36, -h + 1, x + w * 0.28, -h - 5.5, x + w * 0.46, -h - 2.4, x + w * 0.62, -h - 5, x + w * 0.56, -h + 1], fill, { lw: 1.8, off: 0 });
    F(ctx, [x + w * 0.22, -h * 0.66, x + w * 0.36, -h * 0.74, x + w * 0.3, -h * 0.32], 'rgba(255,253,246,.28)');
  };
  bag(19, 21, 15, '#3E5E7A');
  bag(1, 23, 18.5, C.ink2);
};

/* Чемодан туриста: ручка выдвинута, бирка «MOW» */
O.suitcase = function (ctx) {
  L(ctx, [9.5, -32, 9.5, -43.4, 19.5, -43.4, 19.5, -32], 2.2, C.ink);
  S(ctx, [2.5, -4, 3, -32.5, 25, -33, 25.8, -4.5], C.blue, { cut: 2 });
  for (const x of [8, 14, 20]) L(ctx, [x, -30, x + 0.3, -7], 1.3, C.ink, { j: 0.2 });
  S(ctx, [20, -30, 27.5, -28, 26.4, -20.5, 19, -22.5], C.white, THIN);
  T(ctx, 'MOW', 23.3, -25.3, { size: 4.6, maxW: 6.4 });
  wheel(ctx, 7, -2.8, 3);
  wheel(ctx, 21.5, -2.8, 3);
};

/* Штендер: две створки домиком, мелом по чёрному */
O.aboard = function (ctx, o) {
  S(ctx, [21, -40.5, 27.6, -39, 29, -0.5, 25, 0], C.warm, { lw: 2, off: 0 });
  S(ctx, [2, -1, 5, -41, 23.5, -41.5, 24.5, -1], C.ink2, { off: 0 });
  S(ctx, [5.6, -6, 7.6, -37.5, 21.4, -37.8, 21.2, -6.2], '#2F3A33', { lw: 0, off: 0 });
  T(ctx, o.text || 'СДАМ', 14, -27, { size: 9.5, maxW: 13.5, color: C.white });
  L(ctx, [8.4, -18.5, 20, -18.8], 1.2, C.white, { j: 0.3 });
  T(ctx, '₽', 14.2, -12, { size: 7.5, color: C.yellow });
  L(ctx, [3, -1, 1, 0], 2.2, C.ink);
};

/* Стиралка на выброс: люк нараспашку, носок забыли */
O.washer = function (ctx) {
  ctx.save();
  ctx.translate(13, 0);
  ctx.rotate(0.05);
  ctx.translate(-13, 0);
  B(ctx, 1.5, -30.5, 23, 30, C.white, { cut: 1.5 });
  L(ctx, [2.5, -24.6, 23.5, -25], 1.3, C.ink, { j: 0.2 });
  D(ctx, 12, -13, 7.6, C.ink2, { lw: 1.6, off: 0, press: 0 });
  S(ctx, [17, -19.5, 24.5, -21.5, 25.8, -6.8, 18.2, -5.2], GLASS, { lw: 1.6, off: 0 });      // открытый люк
  S(ctx, [8.5, -13.5, 12.5, -13.8, 13.4, -5.6, 16.6, -4, 15.8, -1.6, 9.4, -2.4], C.danger, { lw: 1.4, off: 0, press: 0 });   // носок
  ctx.fillStyle = C.ink;
  ctx.fillRect(5, -28.6, 2.2, 2.2); ctx.fillRect(9, -28.6, 2.2, 2.2);
  F(ctx, [16.5, -29, 22, -29, 22, -26.6, 16.5, -26.6], C.cool);
  F(ctx, [2.5, -4.5, 6.5, -2, 2.6, -1.4], C.brick);                              // ржавчина
  ctx.restore();
};

/* ───────────────────────────── M: СРЕДНИЕ ───────────────────────────── */
/* Урна-качалка: ведро на двух стойках, мусор уже не помещается */
O.bin = function (ctx) {
  L(ctx, [4, 0, 4.6, -33], 3, C.ink);
  L(ctx, [26, 0, 25.4, -33], 3, C.ink);
  S(ctx, [10, -34.5, 14, -41.5, 19.5, -38, 22.5, -41, 21, -33.5], C.white, THIN);          // скомканная бумага
  S(ctx, [6.5, -31, 23.5, -31.4, 21.4, -8, 8.8, -7.6], '#55605A');
  B(ctx, 4.2, -35.4, 21.6, 5.4, '#6B7870', { lw: 2, off: 1 });
  L(ctx, [11.2, -27, 11.8, -11], 1.2, C.ink, { j: 0.2 });
  L(ctx, [18.6, -27, 18.2, -11], 1.2, C.ink, { j: 0.2 });
  F(ctx, [1, -1.6, 7.4, -1.6, 7.4, 0, 1, 0], C.ink);
  F(ctx, [22.6, -1.6, 29, -1.6, 29, 0, 22.6, 0], C.ink);
};

/* Водоналивные блоки: красный и белый, как на любом ремонте дороги */
O.barrier = function (ctx, o) {
  const blockAt = (x, fill) => {
    S(ctx, [x, 0, x + 0.5, -10, x + 4, -13, x + 4.6, -32, x + 9, -36.6, x + 18, -36.6, x + 22.4, -32, x + 23, -13, x + 26.5, -10, x + 27, 0], fill);
    L(ctx, [x + 9.4, -31, x + 9.8, -15], 1.3, C.ink, { j: 0.2 });
    L(ctx, [x + 17.6, -31, x + 17.2, -15], 1.3, C.ink, { j: 0.2 });
    F(ctx, [x + 5, -4.4, x + 10.5, -4.4, x + 10.5, -1, x + 5, -1], C.ink);
    F(ctx, [x + 16.5, -4.4, x + 22, -4.4, x + 22, -1, x + 16.5, -1], C.ink);
  };
  blockAt(25, C.white);
  blockAt(0, C.danger);
  F(ctx, [4.8, -27.5, 8, -30.4, 8.2, -20.5, 5, -19], 'rgba(255,253,246,.4)');
  // мигалка
  S(ctx, [9, -36.5, 9.6, -42, 17.4, -42, 18, -36.5], Math.sin(o.t * 9) > 0 ? C.yellow : C.brick, { lw: 1.8, off: 0 });
};

/* Бетонный блок с монтажными петлями: краска облезла, угол отбит */
O.block = function (ctx) {
  L(ctx, [12, -26, 13, -31, 19, -31, 20, -26], 2, C.ink2);
  L(ctx, [44, -26, 45, -31, 51, -31, 52, -26], 2, C.ink2);
  S(ctx, [2, -1, 1.5, -26.5, 57, -27.4, 62.5, -23.5, 62, -1], C.concrete);
  hazard(ctx, [3, -10.5, 61, -10.8, 61, -19, 3, -18.6], 11, C.yellow, C.ink, 1.3);
  F(ctx, [30, -18.8, 41, -19, 39.6, -14.5, 33, -15.6, 31, -11.5, 29.4, -10.6], C.concrete);                // краска слезла
  F(ctx, [6, -24.6, 9, -24.6, 9, -22.2, 6, -22.2], C.warm);
  F(ctx, [20, -6.6, 24, -6.8, 23.6, -4.4, 20.4, -4.2], C.warm);
  F(ctx, [46, -7.4, 49, -7.6, 49, -5, 46.4, -4.8], C.warm);
};

/* Паркомат: синий столбик с экраном и солнечной панелью */
O.terminal = function (ctx, o) {
  S(ctx, [0.5, 0, 1.5, -4, 22.5, -4, 23.5, 0], C.ink2, { lw: 1.6, off: 0 });
  B(ctx, 3.4, -41.5, 17.2, 38, '#3D6EA5', { cut: 1.5 });
  S(ctx, [0, -44, 22, -50, 23.2, -46.6, 1.2, -40.6], C.ink2, { lw: 1.8, off: 0 });               // солнечная панель
  L(ctx, [7.5, -45, 8.4, -42.6], 1, C.cool, { j: 0 });
  L(ctx, [14.5, -46.8, 15.4, -44.4], 1, C.cool, { j: 0 });
  B(ctx, 6, -37, 12, 8.6, Math.sin(o.t * 4) > 0.6 ? C.yellow : C.paper, THIN);
  B(ctx, 6.2, -25.6, 11.6, 11.6, C.white, THIN);
  T(ctx, 'P', 12, -19.5, { size: 11, color: '#3D6EA5' });
  ctx.fillStyle = C.ink;
  ctx.fillRect(7, -10.4, 10, 1.8);
  ctx.fillRect(7, -7, 6, 1.4);
};

/* Договор аренды: лист в рост человека, печать и пункт мелким шрифтом */
O.contract = function (ctx) {
  ctx.save();
  ctx.translate(18, -1);
  ctx.rotate(-0.07);
  S(ctx, [-14.5, -1, -15, -44, 6.5, -45, 14.5, -37.5, 15, -0.5], C.white);
  S(ctx, [6.5, -45, 7.4, -37, 14.5, -37.5], C.cream, THIN);
  T(ctx, 'ДОГОВОР', -3.6, -37.6, { size: 7.6, maxW: 19 });
  ctx.fillStyle = C.muted;
  for (let i = 0; i < 4; i++) ctx.fillRect(-11.4, -31 + i * 4.2, i === 3 ? 13 : 22.5, 1.3);
  F(ctx, [-11.6, -13.4, 9.6, -13.8, 9.6, -9.4, -11.6, -9], C.yellow);
  T(ctx, 'п. 7.3  +1 комиссия', -1, -11.3, { size: 4.4, maxW: 20, font: FONT.text, weight: 800 });
  D(ctx, 5.6, -19.6, 5.6, 'rgba(232,69,44,.16)', { lw: 1.3, off: 0, press: 0, line: C.danger, n: 9 });
  D(ctx, 5.6, -19.6, 3, 'rgba(232,69,44,0)', { lw: 0.9, off: 0, press: 0, line: C.danger, n: 7 });
  L(ctx, [-11, -4.4, -6.5, -6.6, -3.6, -3.6, 0.6, -6.4], 1.2, C.ink, { j: 0 });                 // подпись
  ctx.restore();
};

/* Прокатный самокат. lean — как стоит; brand — цвет проката */
function kick(ctx, x, color, lean) {
  ctx.save();
  ctx.translate(x, 0);
  // дека, переднее колесо справа
  S(ctx, [-13, -7.8, 7, -7.6, 9.2, -5.4, -13.6, -5.2], C.ink2, { lw: 1.8, off: 0 });
  S(ctx, [-12.4, -9.2, 3.4, -9.2, 4.2, -7.6, -12.8, -7.6], color, { lw: 1.2, off: 0, press: 0 });
  wheel(ctx, -13, -4.4, 4.4);
  wheel(ctx, 11.4, -4.4, 4.4);
  // рулевая стойка
  const tx = 9 + (lean || 0) * 30, ty = -43;
  S(ctx, ink.wedge(10.6, -6, 3.6, tx, ty, 3), color, { lw: 1.7, off: 0 });
  L(ctx, [tx - 5.5, ty + 0.6, tx + 5, ty - 0.8], 3, C.ink, { j: 0 });
  S(ctx, [tx - 2.2, ty - 4.6, tx + 2.6, ty - 4.8, tx + 2.8, ty - 1.4, tx - 2, ty - 1.2], C.ink2, { lw: 1, off: 0, press: 0 });   // экранчик
  ctx.restore();
}
const KICK_COLORS = ['#F0BE2E', '#7A5BC0', '#E8452C'];

/* Самокат бросили посреди тротуара: лежит на боку, колесо в воздухе */
O.scooter = function (ctx, o) {
  const col = KICK_COLORS[o.variant % KICK_COLORS.length];
  S(ctx, [3, -3.4, 5, -7.2, 34, -9.4, 36.6, -6, 35, -2.6], C.ink2, { lw: 1.8, off: 0 });        // дека плашмя
  S(ctx, [7, -6.8, 31, -8.8, 31.6, -6.4, 7.6, -4.4], col, { lw: 1.2, off: 0, press: 0 });
  wheel(ctx, 4.6, -5, 4.6);
  S(ctx, ink.wedge(35, -6.4, 3.8, 54, -15.5, 3), col, { lw: 1.7, off: 0 });                      // стойка наискось
  L(ctx, [51, -22.6, 57.6, -8.6], 3, C.ink, { j: 0 });                                           // руль
  D(ctx, 39.4, -13.4, 4.6, RUBBER, { lw: 1.6, off: 0, press: 0, sy: 0.62 });                     // переднее колесо торчит
  D(ctx, 39.4, -13.4, 2, C.concrete, { lw: 1, off: 0, press: 0, sy: 0.62, n: 6 });
};

/* Стоянка самокатов: разметка, знак и четыре самоката вповалку — один уже лёг на соседа */
O.scooters = function (ctx, o) {
  // знак парковки на стойке — за дорожкой
  F(ctx, [91.4, 0, 93.8, 0, 93.6, -70, 91.6, -70], BACK);
  B(ctx, 84.6, -84, 16, 16, '#3D6EA5', { lw: 0, off: 0 });
  T(ctx, 'P', 92.6, -75.6, { size: 13, color: C.white });
  // разметка на плитке
  F(ctx, [2, -0.4, 94, -0.4, 96, 1.6, 0, 1.6], C.white);
  kick(ctx, 20, KICK_COLORS[(o.variant + 1) % 3], 0.05);
  kick(ctx, 40, KICK_COLORS[o.variant % 3], -0.03);
  kick(ctx, 59, KICK_COLORS[(o.variant + 2) % 3], 0.09);
  ctx.save();
  ctx.translate(77, 0);
  ctx.rotate(-0.24);                                     // последний завалился
  kick(ctx, 0, KICK_COLORS[o.variant % 3], 0);
  ctx.restore();
};

/* Городской прокат: велосипед у стойки */
O.bike = function (ctx) {
  F(ctx, [27.4, 0, 30.6, 0, 30.4, -36, 27.6, -36], BACK2);
  B(ctx, 24.5, -40, 9, 9, BACK, { lw: 0, off: 0 });
  D(ctx, 12, -11.5, 11.2, 'rgba(0,0,0,0)', { lw: 2.6, off: 0, press: 0, n: 12 });
  D(ctx, 48, -11.5, 11.2, 'rgba(0,0,0,0)', { lw: 2.6, off: 0, press: 0, n: 12 });
  D(ctx, 12, -11.5, 1.8, C.ink, { lw: 0, off: 0 });
  D(ctx, 48, -11.5, 1.8, C.ink, { lw: 0, off: 0 });
  L(ctx, [12, -11.5, 24.5, -27, 41.5, -27, 29.5, -11.5, 12, -11.5], 3, C.danger, { j: 0.2 });
  L(ctx, [29.5, -11.5, 22.5, -30], 3, C.danger, { j: 0 });
  L(ctx, [41.5, -27, 48, -11.5], 3, C.danger, { j: 0 });
  L(ctx, [41.5, -27, 39.6, -35.4, 45.6, -37.6], 2.4, C.ink, { j: 0 });
  S(ctx, [17.6, -32.6, 27.6, -32.8, 26.2, -29.8, 18.8, -29.6], C.ink, { lw: 1, off: 0, press: 0 });   // седло
  S(ctx, [43.6, -33, 55, -33.4, 54, -24.6, 44.4, -24.4], C.cool, { lw: 1.6, off: 0 });                // корзина
  ink.hatch(ctx, 44.6, -32.4, 9.6, 7.6, 2.6, C.ink, 0.7);
  S(ctx, [3.5, -24.4, 20.5, -25.6, 21, -22.6, 4.5, -21.6], C.white, { lw: 1.2, off: 0, press: 0 });   // крыло с номером
};

/* Диван на выброс: полосатый, продавленный, с пружиной */
O.sofa = function (ctx) {
  L(ctx, [9, 0, 9.4, -6], 3.4, C.ink);
  L(ctx, [65, 0, 64.6, -6], 3.4, C.ink);
  S(ctx, [9, -22, 10.5, -33.4, 63.5, -33, 65, -22], C.brick);
  for (let x = 16; x < 62; x += 7.6) F(ctx, [x, -32.4, x + 2.8, -32.4, x + 2.6, -22.6, x + 0.2, -22.6], C.cream);
  S(ctx, [1.5, -5, 2.5, -26, 11.5, -27.4, 12.5, -5], C.burgundy);
  S(ctx, [61.5, -5, 62.5, -27, 71.5, -25.6, 72.5, -5], C.burgundy);
  S(ctx, [11.5, -5.5, 12, -17, 36, -15.4, 62, -17.4, 62.5, -5.5], C.cream);                           // продавленное сиденье
  L(ctx, [37, -16, 37.4, -6], 1.4, C.ink, { j: 0 });
  L(ctx, [47, -17, 49.4, -21.4, 45.8, -22.8, 49, -26.4, 46.4, -28.6], 1.5, C.ink2, { j: 0 });          // пружина
  S(ctx, [17, -31, 30, -31.6, 30.6, -24.6, 17.6, -24], C.white, THIN);
  T(ctx, 'ДАРОМ', 23.8, -27.7, { size: 5.6, maxW: 11.5 });
};

/* Парковая скамейка: чугунные боковины, зелёные рейки, забытый стаканчик */
O.bench = function (ctx) {
  for (const x of [8, 60]) {
    L(ctx, [x - 4, 0, x - 1.5, -12, x + 1.6, -22, x - 1, -33.5], 3.2, C.ink);
    L(ctx, [x + 5, 0, x + 2, -12], 3.2, C.ink);
  }
  for (const y of [-33, -27.4]) B(ctx, 4.5, y, 61, 4, C.green, { lw: 1.7, off: 0.9 });
  B(ctx, 2.5, -22.4, 65, 4.6, C.green, { lw: 2, off: 1 });
  B(ctx, 2, -17.4, 66, 3, '#587548', { lw: 1.6, off: 0 });
  S(ctx, [45.5, -22.6, 46.4, -30, 52, -30, 52.8, -22.6], C.white, THIN);                              // стаканчик
  F(ctx, [46, -27.4, 52.4, -27.4, 52.6, -25.4, 45.8, -25.4], C.brick);
};

/* Гранитный вазон: тяжёлый, со сколом, и туя, которую пора поливать */
O.planter = function (ctx) {
  S(ctx, [20, -28, 22.5, -35.5, 26, -30.5, 28.5, -40.5, 31.5, -31.5, 35, -37, 36.5, -28], C.green, { lw: 2, off: 1.1 });
  S(ctx, [3.5, -28.5, 52.5, -28.5, 49, -1, 7, -1], C.concrete);
  S(ctx, [1.5, -28, 2, -22.6, 54, -22.6, 54.5, -28], '#A8A092', { lw: 2, off: 0 });
  F(ctx, [42, -17, 47.5, -17.6, 46.4, -11.5, 43.4, -9.6], C.warm);                                    // скол
  L(ctx, [12, -18, 12.6, -5], 1.2, C.warm, { j: 0 });
  L(ctx, [28, -19, 28, -4.6], 1.2, C.warm, { j: 0 });
};

/* Евроконтейнер: крышка горбом, пакет не влез, колёсики */
O.dumpster = function (ctx, o) {
  const blue = o.variant % 3 === 0, body = blue ? '#3F74A6' : '#5E6A66', lid = blue ? '#345F88' : '#4A5451';
  wheel(ctx, 12, -3.4, 3.4);
  wheel(ctx, 56, -3.4, 3.4);
  S(ctx, [6, -6, 4.5, -36, 63.5, -36, 62, -6], body);
  S(ctx, [36, -35, 39, -45.4, 47, -47.4, 52, -41.4, 51, -35], C.ink2, { lw: 1.8, off: 0 });           // пакет торчит
  S(ctx, [2.5, -35.5, 4, -42, 30, -45.8, 64, -43, 65.5, -35.5], lid);
  L(ctx, [4, -29.4, 64, -29.4], 1.4, C.ink, { j: 0.3 });
  for (const x of [20, 34, 48]) L(ctx, [x, -27, x + 0.3, -9], 1.2, C.ink, { j: 0.2 });
  B(ctx, 9, -24, 9, 11, C.white, THIN);
  T(ctx, blue ? '♻' : '!', 13.5, -18.4, { size: 8, color: blue ? '#3F74A6' : C.danger, font: FONT.text });
  F(ctx, [52, -14, 60, -16, 59, -9.6, 53, -8.8], 'rgba(23,19,15,.2)');                                // вмятина
};

/* Поддон с плиткой: перекладывают. Опять */
O.tiles = function (ctx) {
  B(ctx, 1.5, -5, 41, 4.4, C.kraft, { lw: 1.7, off: 0 });
  for (const x of [5, 20, 35]) F(ctx, [x, -1.4, x + 4, -1.4, x + 4, 0, x, 0], C.ink2);
  for (let r = 0; r < 4; r++) B(ctx, 3 + (r % 2) * 1.6, -11.4 - r * 5.4, 37 - (r === 3 ? 12 : 0), 5.6, r % 2 ? '#A9A398' : C.concrete, { lw: 1.6, off: 0.8 });
  S(ctx, [29.5, -22.2, 31.5, -27.6, 37, -26, 35.4, -21], C.concrete, { lw: 1.6, off: 0 });           // одна плитка криво
  hazard(ctx, [0.5, -13.4, 43.5, -15.6, 43.5, -12, 0.5, -9.8], 7, C.white, C.danger, 1.2);
};

/* ───────────────────────────── L: МЕБЕЛЬ НА ВЫНОС ───────────────────────────── */
/* Холодильник «ЗИЛ»: перевязан верёвкой, дверца отходит, магнитики на месте */
O.fridge = function (ctx) {
  ctx.save();
  ctx.translate(14, 0);
  ctx.rotate(-0.045);
  ctx.translate(-14, 0);
  S(ctx, [2, -1.5, 2.5, -58, 5.5, -62.5, 22.5, -62.8, 25.8, -58, 26.5, -1.5], C.cream, { cut: 0 });
  L(ctx, [3, -42, 26, -42.6], 1.6, C.ink, { j: 0.2 });
  S(ctx, [20, -55.6, 22.6, -55.6, 22.6, -46.5, 20, -46.5], C.steel || STEEL, { lw: 1.2, off: 0, press: 0 });
  S(ctx, [20, -38.5, 22.6, -38.5, 22.6, -27, 20, -27], STEEL, { lw: 1.2, off: 0, press: 0 });
  T(ctx, 'ЗИЛ', 10.5, -51.4, { size: 6.4, color: C.burgundy, maxW: 11, skew: 0.2 });
  F(ctx, [6, -35, 10, -35.4, 10, -31.4, 6, -31], C.danger);                                           // магнитики
  F(ctx, [12, -31, 15.6, -31, 15.6, -27.6, 12, -27.6], C.yellow);
  F(ctx, [7, -25.4, 10.4, -25.8, 10.6, -22.8, 7, -22.4], C.blue);
  L(ctx, [1.4, -21, 27.4, -18.6], 1.5, C.kraft, { j: 0.2 });                                          // верёвка
  L(ctx, [1.6, -46.5, 27, -49], 1.5, C.kraft, { j: 0.2 });
  F(ctx, [3.5, -6.5, 9, -4, 3.6, -2.6], C.brick);
  ctx.restore();
};

/* Шкаф от «стенки»: полировка, зеркало, дверца нараспашку */
O.wardrobe = function (ctx) {
  S(ctx, [2, -1, 2.5, -66, 37.5, -66.6, 38, -1], '#8A5A3A');
  S(ctx, [0.5, -66, 1, -69.4, 39, -69.8, 39.5, -66], '#6E452A', { lw: 1.8, off: 0 });
  L(ctx, [20, -65, 20.2, -3], 1.4, C.ink, { j: 0.2 });
  S(ctx, [5.5, -61, 16.5, -61.4, 16.8, -20, 5.8, -19.6], GLASS, THIN);                                // зеркало
  F(ctx, [7.4, -58, 10.4, -58.2, 8, -42, 7.2, -42], C.white);
  F(ctx, [12, -40, 14.6, -40.4, 12.6, -26, 11.4, -26], C.white);
  S(ctx, [37, -65.5, 44, -61, 44.2, -6.5, 37.4, -2], '#7A4E30', { lw: 2, off: 0 });                   // открытая дверца
  ctx.fillStyle = C.yellow;
  ctx.fillRect(22.4, -36, 1.8, 6);
  L(ctx, [24, -58, 34, -58.6], 1.4, C.ink2, { j: 0 });                                                // штанга и плечики
  L(ctx, [29, -58.4, 29, -55, 25, -50, 33, -50, 29, -55], 1.2, C.ink2, { j: 0 });
  F(ctx, [3, -4.4, 37, -4.6, 37, -1.6, 3, -1.4], '#5B3922');
};

/* Матрас: стоит, прогнулся, полоски и пятно, о котором лучше не знать */
O.mattress = function (ctx) {
  S(ctx, [5, -1, 2.5, -30, 6, -62, 11, -65.4, 25, -64.6, 27.5, -34, 25.6, -1.5], C.cream);
  ctx.save();
  ink.trace(ctx, [6.4, -2.4, 4, -30, 7.4, -61, 11.4, -63.6, 23.6, -63, 26, -34, 24.2, -3], true);
  ctx.clip();
  ctx.fillStyle = C.blue;
  for (let x = 4; x < 30; x += 5.4) ctx.fillRect(x, -66, 1.8, 66);
  ctx.restore();
  D(ctx, 16, -24, 5.4, 'rgba(154,143,130,.55)', { lw: 0, off: 0, n: 7, j: 0.2 });
  L(ctx, [3, -44.6, 27.4, -46.4], 1.6, C.kraft, { j: 0.2 });
  L(ctx, [3.6, -15, 26.6, -13.4], 1.6, C.kraft, { j: 0.2 });
  for (const y of [-56, -36, -8]) { ctx.fillStyle = C.ink; ctx.fillRect(14.4, y, 2, 2); }
};

/* Строительный забор: сетка на бетонных пятках, зелёная сетка-затенёнка и табличка */
O.fence = function (ctx) {
  for (const x of [3, 53]) S(ctx, [x, 0, x + 1.5, -5.6, x + 14.5, -5.6, x + 16, 0], C.concrete, { lw: 1.7, off: 0 });
  S(ctx, [5, -5, 5.5, -57.6, 66.5, -58.2, 67, -5], '#7FA08A', { lw: 2.4 });
  ink.hatch(ctx, 6.4, -56.4, 59.4, 50, 6.4, 'rgba(23,19,15,.26)', 0.8, 1);
  ink.hatch(ctx, 6.4, -56.4, 59.4, 50, 6.4, 'rgba(23,19,15,.26)', 0.8, -1);
  for (const x of [5.2, 35.6, 66.8]) L(ctx, [x, -3.6, x + 0.2, -60.4], 2.4, C.ink, { j: 0.2 });
  S(ctx, [40, -40.5, 62.5, -42, 63, -27, 40.5, -25.6], C.yellow, { lw: 1.8, off: 1 });
  T(ctx, 'ПРОХОДА', 51.6, -37.6, { size: 5.6, maxW: 19 });
  T(ctx, 'НЕТ', 51.8, -31.2, { size: 7, maxW: 19 });
  F(ctx, [8, -19, 20, -22, 22, -10, 9.6, -8], '#6F8E7A');                                             // дыра в сетке
};

/* ───────────────────────────── НЕ УБИВАЮТ ───────────────────────────── */
O.puddle = function (ctx, o) {
  ink.poly(ctx, [1, -0.4, 14, -3.4, 40, -4.2, 66, -3.2, 86.5, -1.2, 80, 1.8, 46, 2.6, 12, 2], { fill: C.blue, lw: 1.5, off: 0, press: 0, line: '#4E7C9C' });
  const s = Math.floor(o.t * 4) % 2;
  F(ctx, [20 + s * 3, -1.8, 38 + s * 3, -2.2, 37 + s * 3, -1, 21 + s * 3, -0.6], C.white);
  F(ctx, [52, 0.2, 63, 0, 62.4, 1, 52.6, 1.2], C.white);
  S(ctx, [66, -2.6, 72.6, -3.6, 73.6, -1, 67, 0], C.yellow, { lw: 1, off: 0, press: 0 });             // лист плавает
};

O.keys = function (ctx, o) {
  const step = Math.floor(o.t * 6) % 4, bob = [0, -2.5, -4, -2.5][step];
  ctx.save();
  ctx.translate(13, -20 + bob);
  // лучи вместо свечения
  ctx.save();
  ctx.rotate(step * 0.4);
  ctx.fillStyle = C.lime;
  for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.fillRect(15, -1.3, 7, 2.6); }
  ctx.restore();
  ctx.rotate(-0.5);
  Art.key(ctx, 9, C.lime, true);
  ctx.rotate(1.2);
  Art.key(ctx, 7.5, C.white, true);
  ctx.restore();
};

/* ───────────────────────────── ЛЮДИ И ЗВЕРИ ───────────────────────────── */
const ORANGE = '#EC8A2D';

/* Риелтор: пиджак, красный галстук, улыбка во все зубы, телефон у уха и ключи на пальце */
O.realtor = function (ctx, o) {
  const swing = Math.floor(o.t * 5) % 2 ? 1.6 : -1.2;
  arm(ctx, 23, -43, 27.5, -53, '#2F4A6C');
  figure(ctx, 16, {
    coat: '#2F4A6C', legs: C.ink2,
    body(c, cx) {
      F(c, [cx - 3.6, -47, cx + 3.6, -47, cx, -37], C.white);
      F(c, [cx - 1.5, -46, cx + 1.5, -46, cx + 1.9, -34, cx, -31.6, cx - 1.9, -34], C.danger);
    },
    hair(c, cx, hy) { F(c, [cx - 8.2, hy - 1, cx - 8, hy - 5, cx - 4.4, hy - 9, cx + 5, hy - 9.4, cx + 8.4, hy - 5, cx + 4, hy - 5.6, cx - 5, hy - 4.4], C.ink); },
  });
  ctx.fillStyle = C.white;                               // улыбка
  ctx.fillRect(9.4, -51.4, 7.6, 3);
  ctx.fillStyle = C.ink;
  ctx.fillRect(9.4, -51.4, 7.6, 0.8); ctx.fillRect(11.6, -51.4, 0.7, 3); ctx.fillRect(14, -51.4, 0.7, 3);
  B(ctx, 24.6, -60.5, 4.6, 8.6, C.ink, { lw: 0, off: 0 });                      // телефон
  arm(ctx, 9, -43, 2.5, -34, '#2F4A6C');
  hand(ctx, 2.5, -33.4);
  ctx.save();
  ctx.translate(2.5, -31);
  ctx.rotate(1.3 + swing * 0.12);
  Art.key(ctx, 4.6, C.lime, true);
  ctx.restore();
};

/* Фотограф: штатив, широкоугольник, вспышка. «Фото соответствует» */
O.photographer = function (ctx, o) {
  const flash = (o.t % 1.6) < 0.12;
  L(ctx, [14, -34, 4, 0], 2.4, C.ink);
  L(ctx, [14, -34, 24, 0], 2.4, C.ink);
  L(ctx, [14, -34, 14.6, -2], 2, C.ink2);
  // фотограф согнулся к видоискателю
  S(ctx, ink.wedge(34, -24, 6.6, 31, -3, 5), C.ink2, { lw: 2, off: 0 });
  S(ctx, ink.wedge(39, -24, 6.6, 42, -3, 5), C.ink2, { lw: 2, off: 0 });
  S(ctx, [27, -3.6, 34, -4, 35, 0, 26.6, 0], RUBBER, { lw: 1.4, off: 0, press: 0 });
  S(ctx, [39, -3.6, 45.4, -4, 46, 0, 38.6, 0], RUBBER, { lw: 1.4, off: 0, press: 0 });
  S(ctx, [30.5, -22, 43, -22.4, 42, -34, 31, -43, 22.6, -38.6, 25, -30], C.green);
  arm(ctx, 26, -37.6, 20, -42, C.green);
  S(ctx, [22.4, -45.6, 25.6, -51.4, 33, -51.2, 36.2, -46, 34.4, -40.4, 26.6, -39.4], C.skin, { lw: 2.1, off: 1.2 });
  F(ctx, [24.6, -47, 26, -52.4, 33.6, -52.4, 36.8, -47, 30, -48.4], C.ink);
  // камера
  B(ctx, 9, -46.5, 14, 11, C.ink2, { lw: 2, off: 0, cut: 1.2 });
  S(ctx, [1.5, -44.6, 9.4, -43.6, 9.4, -37.6, 1.5, -36.6], C.ink, { lw: 1.6, off: 0 });
  F(ctx, [0.4, -43.6, 2.4, -43.6, 2.4, -37.6, 0.4, -37.6], GLASS);
  B(ctx, 12.4, -51.4, 6.6, 5, flash ? C.white : C.concrete, THIN);
  if (flash) { ctx.fillStyle = C.white; for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(15.6, -49); ctx.rotate(-2.8 + i * 0.55); ctx.fillRect(7, -1, 9, 2); ctx.restore(); } }
};

/* Уличный музыкант: косуха, гитара, чехол с мелочью и комбик */
O.musician = function (ctx, o) {
  const sway = Math.floor(o.t * 4) % 2 ? 0.8 : -0.8;
  B(ctx, 27.5, -15, 10, 14.4, C.ink2, { lw: 1.8, off: 0 });
  ink.hatch(ctx, 29, -13.6, 7, 8, 2.2, C.warm, 0.7);
  figure(ctx, 15, {
    coat: C.ink, legs: '#3E5E7A', sway,
    hair(c, cx, hy) { F(c, [cx - 9, hy + 9, cx - 8.6, hy - 4, cx - 4.6, hy - 9, cx + 4.6, hy - 9, cx + 8.8, hy - 4, cx + 9.2, hy + 9, cx + 5.4, hy + 2, cx + 4, hy - 3.4, cx - 4, hy - 3, cx - 5.6, hy + 2], C.ink); },
  });
  // гитара наискось
  S(ctx, [5, -27, 3.6, -36, 9.5, -39.6, 17, -37, 19, -28.6, 13, -23.4], C.brick, { lw: 2, off: 1 });
  D(ctx, 11.6, -31.4, 2.6, C.ink, { lw: 0, off: 0, n: 7 });
  S(ctx, ink.wedge(16.5, -35, 3.2, 31, -49, 2.6), C.kraft, { lw: 1.6, off: 0 });
  B(ctx, 29.6, -53, 5, 5, C.ink2, { lw: 1.2, off: 0, press: 0 });
  arm(ctx, 22.6, -43, 26, -46.4, C.ink);
  hand(ctx, 26.4, -47);
  hand(ctx, 12.4 + sway, -31);
  // чехол с мелочью
  S(ctx, [-1, 0, 0, -3.4, 13, -3.6, 14, 0], C.burgundy, { lw: 1.5, off: 0 });
  F(ctx, [3, -2.6, 5, -2.6, 5, -1.2, 3, -1.2], C.yellow);
  F(ctx, [8, -2.4, 10, -2.4, 10, -1, 8, -1], C.yellow);
};

/* Дворник: оранжевый жилет, метла из прутьев. Метёт, не глядя */
O.janitor = function (ctx, o) {
  const sweep = Math.floor(o.t * 5) % 2 ? 3 : -2;
  L(ctx, [26, -46, 6 + sweep, -8], 2.4, C.kraft, { j: 0 });
  S(ctx, [0.5 + sweep, -1, 3.5 + sweep, -10, 9 + sweep, -10.6, 13 + sweep, -1], C.kraftLight, { lw: 1.7, off: 0 });
  for (let i = 0; i < 4; i++) L(ctx, [4.4 + i * 1.6 + sweep, -9.4, 2 + i * 3 + sweep, -1.4], 0.9, C.ink2, { j: 0 });
  figure(ctx, 25, {
    coat: ORANGE, legs: '#3E5E7A',
    body(c, cx) {
      F(c, [cx - 9.6, -35, cx + 9.6, -35, cx + 9.4, -32.4, cx - 9.4, -32.4], C.white);
      F(c, [cx - 9.6, -29, cx + 9, -29, cx + 8.8, -26.8, cx - 9, -26.8], C.white);
    },
    hair(c, cx, hy) {
      F(c, [cx - 8.4, hy - 2.4, cx - 6, hy - 9.4, cx + 6, hy - 9.6, cx + 8.4, hy - 2.6], '#3E5E7A');
      F(c, [cx - 13, hy - 2.6, cx + 8.6, hy - 3, cx + 8.6, hy - 1, cx - 13, hy - 0.6], '#3E5E7A');
    },
  });
  arm(ctx, 17, -43, 14, -30, ORANGE);
  hand(ctx, 13.6, -29.4);
  arm(ctx, 31, -43, 24.4, -40, ORANGE);
  hand(ctx, 23.6, -39.6);
};

/* Такса на поводке: длинная, низкая и уверена, что это её двор */
O.dog = function (ctx, o) {
  const f = Math.floor(o.t * 9) % 2;
  L(ctx, [30, -18, 46, -28 + f * 2], 1.5, C.danger, { j: 0 });
  const leg = (x, back) => S(ctx, ink.wedge(x, -9, 4.4, x + (back ? (f ? 4 : -3) : (f ? -4 : 3)), -1, 3.4), '#8A4B2C', { lw: 1.6, off: 0 });
  leg(33, true); leg(13, false);
  S(ctx, [9.5, -9, 9, -17.6, 14, -20.6, 36, -19.8, 40, -15, 38, -8.6], C.brick);
  leg(37, true); leg(17, false);
  S(ctx, [38.6, -16.6, 44.4, -23 - f * 2, 45.6, -20.4 - f * 2, 40.4, -14], C.brick, { lw: 1.6, off: 0 });       // хвост
  S(ctx, [0.5, -17.6, 2, -21.6, 9, -25.6, 14.6, -22.4, 13.6, -15.4, 6, -14.4], C.brick);                        // голова
  S(ctx, [9, -25, 13.4, -26.4, 15.4, -17 + f * 1.5, 11.6, -15.4], '#7A3F26', { lw: 1.6, off: 0 });              // ухо хлопает
  ctx.fillStyle = C.ink;
  ctx.fillRect(5.4, -22, 1.8, 2);
  F(ctx, [-0.2, -18.6, 2.2, -19.4, 2, -16.6, 0, -16.4], C.ink);
  F(ctx, [27.4, -19.8, 30, -19.8, 30, -16, 27.4, -16], C.danger);                                               // ошейник
};

/* Курьер на самокате: едет навстречу, термокороб выше головы */
O.courier = function (ctx, o) {
  const pink = o.variant % 3 === 0, coat = pink ? '#E8508A' : C.yellow, brand = pink ? 'Самокатик' : 'ЯнЕдет';
  // штрихи скорости
  ctx.fillStyle = C.ink;
  for (let i = 0; i < 3; i++) { const y = -16 - i * 15, x = 48 + ((Math.floor(o.t * 12) + i * 2) % 3) * 5; ctx.fillRect(x, y, 9 - i * 2, 1.4); }
  // самокат
  S(ctx, [8, -7.6, 34, -7.8, 36.4, -5.2, 7.4, -5], C.ink2, { lw: 1.8, off: 0 });
  wheel(ctx, 7, -4.6, 4.6);
  wheel(ctx, 37, -4.6, 4.6);
  S(ctx, ink.wedge(10, -7, 3.4, 12.6, -41, 2.8), C.ink2, { lw: 1.6, off: 0 });
  L(ctx, [7, -41.6, 18, -40.6], 3, C.ink, { j: 0 });
  // короб на спине
  S(ctx, [27, -33, 27.5, -57, 45.5, -57.6, 46, -33.6], coat);
  if (K.sign) K.sign(ctx, brand, 28.6, -53, 16, 9, { plain: true });
  // тело: согнулся вперёд
  S(ctx, ink.wedge(26, -27, 6.4, 24, -8, 5), C.ink2, { lw: 2, off: 0 });
  S(ctx, ink.wedge(30, -27, 6.4, 30.6, -8, 5), C.ink2, { lw: 2, off: 0 });
  S(ctx, [22.5, -25, 32.5, -25.4, 31.6, -38, 24.4, -46.6, 15.6, -43.4, 18, -34], coat);
  arm(ctx, 19.6, -41.6, 13.6, -40.4, coat);
  hand(ctx, 13, -40.4);
  S(ctx, [11.5, -51, 14.6, -57.4, 23, -57.6, 26.4, -52, 24.6, -46, 15.4, -45], C.skin, { lw: 2.1, off: 1.2 });
  S(ctx, [10.6, -53, 14.4, -59.6, 23.4, -59.8, 27.4, -53.4, 22, -54.6, 15, -54.4], C.ink2, { lw: 1.7, off: 0 });    // шлем
  ctx.fillStyle = C.ink;
  ctx.fillRect(14.6, -51.4, 1.8, 3);
};

/* Человек из ПВЗ: из-за коробок видны только ноги и макушка */
O.pvzman = function (ctx, o) {
  const f = Math.floor(o.t * 6) % 2, st = f ? 4 : -3;
  S(ctx, ink.wedge(22.5, -26, 6.5, 22 - st, -3, 5), '#3E5E7A', { lw: 2, off: 0 });
  S(ctx, ink.wedge(29.5, -26, 6.5, 30 + st, -3, 5), '#3E5E7A', { lw: 2, off: 0 });
  S(ctx, [17 - st, -3.6, 24.6 - st, -4, 25 - st, 0, 16.6 - st, 0], RUBBER, { lw: 1.4, off: 0, press: 0 });
  S(ctx, [26 + st, -3.6, 33.6 + st, -4, 34 + st, 0, 25.6 + st, 0], RUBBER, { lw: 1.4, off: 0, press: 0 });
  S(ctx, [18, -25, 34.5, -25, 35.6, -44, 30, -47.6, 20, -47], '#7A5BC0', { lw: 2.4 });
  S(ctx, [22, -52, 24, -60.4, 31, -60.6, 33.6, -53], C.ink, { lw: 1.6, off: 0 });                    // макушка
  // фирменный пакет на локте
  S(ctx, [29, -22, 28, -36, 39.5, -37, 39, -21], '#A23FA0', { lw: 2, off: 1 });
  if (K.sign) K.sign(ctx, 'Дикие ягоды', 29.6, -33, 9, 7, { plain: true, mark: true });
  // башня коробок
  ctx.save();
  ctx.translate(0, -24 + (f ? 0.8 : 0));
  carton(ctx, 1, 22, 15);
  ctx.translate(1.4, -14.4); carton(ctx, 0, 19, 13);
  ctx.translate(-1.6, -12.6); ctx.rotate(0.05); carton(ctx, 1.6, 18, 12);
  ctx.translate(2.4, -11.6); ctx.rotate(-0.1); carton(ctx, 0, 15, 10);
  ctx.restore();
  arm(ctx, 21, -43, 13, -27, '#7A5BC0');
  hand(ctx, 12.6, -26);
};

/* Робот-доставщик: шесть колёс, флажок и два очень серьёзных глаза */
O.rover = function (ctx, o) {
  const f = Math.floor(o.t * 8) % 2;
  L(ctx, [29, -27, 31, -47], 1.4, C.ink, { j: 0 });
  S(ctx, f ? [31, -47.4, 38.6, -45.4, 31, -42] : [31, -47.4, 38, -47.6, 31, -42.6], ORANGE, { lw: 1.4, off: 0, press: 0 });
  for (const x of [8, 18.6, 29]) wheel(ctx, x, -4.4, 4.4);
  S(ctx, [3, -7.6, 2.4, -22, 6.6, -28.6, 31.6, -29, 34.6, -23, 34, -7.4], C.white);
  S(ctx, [2.6, -21.6, 6.8, -28.4, 31.4, -28.8, 34.4, -23], C.yellow, { lw: 1.6, off: 0 });           // крышка
  S(ctx, [1.6, -19.6, 15, -19.8, 15.6, -11.4, 2, -11.2], C.ink, { lw: 1.4, off: 0 });                // «лицо»
  ctx.fillStyle = (o.t % 2.4) < 0.14 ? C.ink : C.lime;
  ctx.fillRect(4.4, -17.6, 3, 4); ctx.fillRect(10.4, -17.6, 3, 4);
  T(ctx, '24', 25, -15, { size: 7.5, maxW: 12 });
  F(ctx, [18, -10.4, 32.6, -10.6, 32.6, -8.8, 18, -8.6], C.concrete);
};

/* Голуби: трое, летят в лицо. Они тут прописаны */
O.pigeons = function (ctx, o) {
  const bird = (x, y, ph) => {
    const up = (Math.floor(o.t * 10 + ph) % 2) === 0;
    S(ctx, [x + 13, y - 1, x + 20, y - 3.4, x + 19.4, y + 1.6, x + 13, y + 2], '#6F7A85', { lw: 1.5, off: 0 });               // хвост
    S(ctx, [x - 2, y - 1.6, x + 4, y - 4.6, x + 13, y - 2.6, x + 14.4, y + 2, x + 6, y + 4.6, x - 1, y + 2.6], '#8D9AA3', { lw: 2, off: 1 });
    S(ctx, up ? [x + 3, y - 3, x + 12, y - 2.6, x + 9, y - 15, x + 4.6, y - 11] : [x + 3, y, x + 12, y + 0.4, x + 10, y + 11, x + 5, y + 8], '#B6BEC4', { lw: 1.8, off: 0 });
    S(ctx, [x - 6.4, y - 2.4, x - 4.4, y - 6.4, x - 0.4, y - 6, x + 1, y - 1.6, x - 3, y + 0.6], '#6F7A85', { lw: 1.7, off: 0 });  // голова
    F(ctx, [x - 2.4, y - 1.6, x + 1.6, y - 2.6, x + 2, y + 0.6, x - 1.6, y + 1.6], C.green);                                     // зелёная шея
    F(ctx, [x - 9.4, y - 2.8, x - 6.2, y - 3.6, x - 6.2, y - 1.6], ORANGE);
    ctx.fillStyle = C.ink;
    ctx.fillRect(x - 4.6, y - 4.6, 1.5, 1.5);
  };
  bird(14, -49, 0);
  bird(33, -64, 1);
  bird(36, -47, 0.5);
};

/* ───────────────────────────── ТРАНСПОРТ ─────────────────────────────
   На всё это можно запрыгнуть и пробежать по крыше. */
function glass(ctx, pts) {
  const p = S(ctx, pts, GLASS, { lw: 1.6, off: 0, press: 0 });
  ctx.save();
  ink.trace(ctx, p, true);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,253,246,.6)';
  const x = p[0], y = p[1];
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 30); ctx.lineTo(x + 9, y + 30); ctx.lineTo(x + 23, y - 20); ctx.lineTo(x + 19, y - 20); ctx.closePath();
  ctx.moveTo(x + 12, y + 30); ctx.lineTo(x + 13.6, y + 30); ctx.lineTo(x + 27.6, y - 20); ctx.lineTo(x + 26, y - 20); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* Легковая машина 140×48: капот слева, багажник справа. look — характер машины */
function sedan(ctx, o, look) {
  const old = look === 'old', lux = look === 'lux', taxi = look === 'taxi', share = look === 'share';
  const plain = ['#E9E2D0', C.cool, '#3E5E7A', C.concrete];
  const oldC = [C.brick, C.cream, '#6E8F9B'];
  const color = taxi ? C.yellow : share ? C.white : lux ? C.ink : old ? oldC[o.variant % 3] : plain[o.variant % plain.length];
  const body = old
    ? [2.5, -9, 2.5, -24, 6, -30.4, 37, -31, 42.5, -46.6, 105.5, -46.6, 111, -32.6, 135, -32.4, 137.5, -26, 137.5, -9]
    : [3, -8, 3, -21, 7.6, -28.4, 36, -31, 49.6, -46.6, 103.6, -46.6, 115, -33.4, 134, -31.6, 137.6, -24.6, 137.6, -8];
  if (old) {                                             // багажник на крыше: едут с дачи
    L(ctx, [52, -46.6, 52, -50.6], 1.8, C.ink, { j: 0 }); L(ctx, [96, -46.6, 96, -50.6], 1.8, C.ink, { j: 0 });
    L(ctx, [48, -50.6, 100, -50.8], 2, C.ink, { j: 0 });
  }
  wheel(ctx, 30, -10.6, 10.8, lux ? C.concrete : old ? C.cream : C.concrete);
  wheel(ctx, 110, -10.6, 10.8, lux ? C.concrete : old ? C.cream : C.concrete);
  S(ctx, body, color, lux ? { paper: '#5A534B' } : undefined);
  // колёсные арки
  F(ctx, [17, -8, 18.6, -19, 24.6, -23.4, 35.4, -23.4, 41.4, -19, 43, -8], RUBBER);
  F(ctx, [97, -8, 98.6, -19, 104.6, -23.4, 115.4, -23.4, 121.4, -19, 123, -8], RUBBER);
  wheel(ctx, 30, -10.6, 10.8, lux ? '#C9CED1' : C.concrete);
  wheel(ctx, 110, -10.6, 10.8, lux ? '#C9CED1' : C.concrete);
  // стёкла
  if (old) { glass(ctx, [44.5, -32, 47.6, -43.6, 74, -43.6, 74, -32]); glass(ctx, [78, -32, 78, -43.6, 103.4, -43.6, 107.6, -32]); }
  else { glass(ctx, [41.6, -31.6, 52.6, -43.6, 75, -43.6, 75, -31.6]); glass(ctx, [79, -31.6, 79, -43.6, 101.6, -43.6, 110.6, -31.6]); }
  if (lux) { F(ctx, [42.6, -32.4, 53, -43, 74.4, -43, 74.4, -32.4], '#3A4650'); F(ctx, [79.6, -32.4, 79.6, -43, 101.2, -43, 109.4, -32.4], '#3A4650'); }
  const mark = lux ? C.concrete : C.ink;
  L(ctx, [77, -31, 77.2, -11], 1.3, mark, { j: 0.2 });
  ctx.fillStyle = mark;
  ctx.fillRect(66, -27, 6, 1.6); ctx.fillRect(100, -27, 6, 1.6);
  // фары, бампер
  S(ctx, [3.6, -26, 9.6, -27.4, 9.6, -21.6, 3.6, -21], C.cream, { lw: 1.3, off: 0, press: 0 });
  S(ctx, [132, -29, 137, -27.6, 137, -21.6, 132, -22], C.danger, { lw: 1.3, off: 0, press: 0 });
  F(ctx, [2, -13.4, 16, -13.4, 16, -9, 2, -9], old ? C.concrete : RUBBER);
  F(ctx, [124, -13.4, 138.4, -13.4, 138.4, -9, 124, -9], old ? C.concrete : RUBBER);
  if (lux) L(ctx, [10, -20.6, 130, -20.2], 1.2, C.concrete, { j: 0 });
  if (old) {                                             // грязь по порогам
    F(ctx, [44, -9, 46, -14, 52, -12.6, 58, -15, 64, -12, 96, -12.6, 96, -9], C.warm);
  }
  if (taxi) {
    for (let i = 0; i < 14; i++) if (i % 2) F(ctx, [8 + i * 9, -19.6, 17 + i * 9, -19.6, 17 + i * 9, -16, 8 + i * 9, -16], C.ink);
    B(ctx, 67, -53.4, 20, 7, C.yellow, { lw: 1.6, off: 0 });
    T(ctx, 'ТАКСИ', 77, -49.6, { size: 5.4, maxW: 17 });
    if (K.sign) K.sign(ctx, 'ЯнЕдет', 48, -30.4, 26, 9, { plain: true });
  } else if (share) {
    F(ctx, [6, -18, 136, -17, 136, -13.6, 6, -14.6], C.green);
    if (K.sign) K.sign(ctx, 'ДелиКвартиру', 80, -30.6, 34, 10, { plain: true });
  }
}
Art.sedan = sedan;

O.car = function (ctx, o) {
  // обычные машины — почти все; такси и каршеринг — изредка; район подсказывает характер
  const roll = o.variant % 16;
  const look = roll === 15 ? 'taxi' : roll === 14 ? 'share' : o.look === 'lux' && roll % 3 ? 'lux' : o.look === 'old' && roll % 4 ? 'old' : '';
  sedan(ctx, o, look);
  if (o.flag === 'cat') {                                // кот на капоте
    S(ctx, [13, -30, 14, -36, 20, -38.4, 30, -36.6, 31, -30.6], C.ink, { lw: 0, off: 0 });
    S(ctx, [10.4, -35.6, 10.6, -44.4, 13.4, -41.4, 17, -41.6, 19.6, -44.6, 20, -36], C.ink, { lw: 0, off: 0 });
    L(ctx, [30, -32, 35, -36 + (Math.floor(o.t * 3) % 2) * 3], 2, C.ink, { j: 0 });
    ctx.fillStyle = C.lime;
    ctx.fillRect(12.6, -39.4, 1.6, 1.6); ctx.fillRect(16, -39.4, 1.6, 1.6);
  } else if (o.flag === 'hazard') {                       // аварийка: «я на минутку»
    const on = Math.floor(o.t * 3.4) % 2;
    ctx.fillStyle = on ? C.yellow : C.brick;
    ctx.fillRect(2, -20.4, 4, 4); ctx.fillRect(134.6, -20.4, 4, 4);
  }
};

/* Газель с тентом: кабина справа, кузов выше кабины, на борту — трафарет */
O.gazelle = function (ctx, o) {
  F(ctx, [8, -19, 172, -19, 172, -12, 8, -12], C.ink2);
  wheel(ctx, 40, -10, 10, C.white);
  wheel(ctx, 148, -10, 10, C.white);
  F(ctx, [60, -19, 92, -19, 90, -9, 62, -9], RUBBER);                                                // бак и запаска
  // кабина
  S(ctx, [125, -14, 125, -60.6, 150, -60.6, 165.4, -41, 173.6, -36.6, 174, -14], C.white);
  glass(ctx, [131.6, -42, 131.6, -56.6, 148, -56.6, 159.6, -42]);
  L(ctx, [130, -38, 130.2, -17], 1.3, C.ink, { j: 0.2 });
  ctx.fillStyle = C.ink;
  ctx.fillRect(134, -35, 6, 1.6);
  S(ctx, [167, -32.6, 173, -31.6, 173, -25, 167, -25.6], C.cream, { lw: 1.3, off: 0, press: 0 });
  F(ctx, [160, -19.6, 175.6, -19.6, 175.6, -13.6, 160, -13.6], RUBBER);
  S(ctx, [158.6, -47, 163, -49.6, 164, -43, 159.6, -41.6], C.ink2, { lw: 1.2, off: 0, press: 0 });   // зеркало
  // кузов
  const brand = K.BRANDS && K.BRANDS[o.text];
  if (brand) {
    S(ctx, [4, -15, 4.5, -76.4, 124, -76.8, 124.5, -15], C.white);
    K.sign(ctx, o.text, 12, -60, 104, 26, { plain: true });
  } else {
    S(ctx, [4, -15, 5, -72, 9.6, -76.6, 119, -77, 124, -72.4, 124.5, -15], '#4E78A3');              // синий тент
    for (const x of [34, 64, 94]) L(ctx, [x, -75, x + 0.4, -17], 1.2, '#34587E', { j: 0.3 });
    F(ctx, [5.6, -24, 123.6, -24, 123.6, -21.6, 5.6, -21.6], '#34587E');
    for (let x = 10; x < 122; x += 8) { ctx.fillStyle = C.paper; ctx.fillRect(x, -20.4, 1.6, 4); }   // шнуровка
    T(ctx, o.text || 'ПЕРЕЕЗДЫ', 64, -55, { size: 22, maxW: 104, color: C.white });
    T(ctx, 'квартирные · 24/7', 64, -38, { size: 9.5, maxW: 90, color: C.white, font: FONT.text, weight: 700 });
    S(ctx, [98, -70, 112, -71, 113, -60, 99, -59], '#6B8FB3', { lw: 1.2, off: 0, press: 0 });         // заплатка
  }
  F(ctx, [4, -18.6, 20, -18.6, 20, -12, 4, -12], C.danger);
};

/* Эвакуатор: жёлто-зелёная полоса, маячок, чья-то машина на платформе */
O.towtruck = function (ctx, o) {
  wheel(ctx, 40, -10, 10, C.white);
  wheel(ctx, 64, -10, 10, C.white);
  wheel(ctx, 184, -10, 10, C.white);
  // платформа
  S(ctx, [3, -21, 4, -28.6, 152, -29, 152, -21], C.ink2, { lw: 2, off: 0 });
  hazard(ctx, [5, -26.6, 150, -27, 150, -22.4, 5, -22], 9, C.yellow, C.ink, 1.1);
  F(ctx, [10, -21, 150, -21, 150, -13, 10, -13], RUBBER);
  // машина сверху
  ctx.save();
  ctx.translate(12, -27.6);
  ctx.scale(0.94, 0.94);
  sedan(ctx, { variant: o.variant, t: o.t }, o.variant % 2 ? 'lux' : '');
  ctx.restore();
  L(ctx, [22, -30, 30, -38], 1.6, C.yellow, { j: 0 });                                                // стяжки
  L(ctx, [128, -30, 120, -38], 1.6, C.yellow, { j: 0 });
  // кабина
  S(ctx, [153, -13, 153, -60.4, 184, -60.4, 200, -42, 208.6, -38, 209, -13], C.white);
  glass(ctx, [160, -43, 160, -56.6, 182, -56.6, 194, -43]);
  F(ctx, [153.6, -34, 208, -33.4, 208, -29, 153.6, -29.6], C.green);
  F(ctx, [153.6, -29, 208, -28.4, 208, -25.6, 153.6, -26.2], C.yellow);
  T(ctx, 'ЭВАКУАЦИЯ', 176, -19.6, { size: 6.4, maxW: 40 });
  S(ctx, [201, -34, 208, -33, 208, -26.6, 201, -27.4], C.cream, { lw: 1.3, off: 0, press: 0 });
  const on = Math.floor(o.t * 6) % 2;
  B(ctx, 164, -66.4, 9, 6, on ? ORANGE : C.brick, { lw: 1.6, off: 0 });
  B(ctx, 175, -66.4, 9, 6, on ? C.brick : ORANGE, { lw: 1.6, off: 0 });
};

/* Электробус: синий, длинный, с ящиками батарей на крыше. По крыше можно бежать */
O.ebus = function (ctx, o) {
  const BLUE = '#2F74C0', NAVY = '#1F4F8A';
  wheel(ctx, 58, -11.4, 11.6, C.white);
  wheel(ctx, 228, -11.4, 11.6, C.white);
  wheel(ctx, 254, -11.4, 11.6, C.white);
  // батареи на крыше
  S(ctx, [40, -91, 41, -100.4, 150, -100.6, 151, -91], C.white, { lw: 2, off: 1 });
  S(ctx, [176, -91, 177, -100.4, 262, -100.6, 263, -91], C.white, { lw: 2, off: 1 });
  for (const x of [68, 96, 124, 204, 232]) L(ctx, [x, -99, x, -92.4], 1.1, C.cool, { j: 0 });
  // кузов: перёд слева
  S(ctx, [6, -13, 6, -70, 12, -88.6, 22, -92.4, 290, -92.6, 294.4, -88, 294.6, -13], BLUE);
  F(ctx, [8, -30, 293, -29.4, 293, -15, 8, -15], NAVY);
  F(ctx, [8, -37, 293, -36.4, 293, -33.4, 8, -34], C.white);
  // арки
  F(ctx, [43, -13, 45, -24.6, 51, -28, 65, -28, 71, -24.6, 73, -13], RUBBER);
  F(ctx, [213, -13, 215, -24.6, 221, -28, 261, -28, 267, -24.6, 269, -13], RUBBER);
  wheel(ctx, 58, -11.4, 11.6, C.white);
  wheel(ctx, 228, -11.4, 11.6, C.white);
  wheel(ctx, 254, -11.4, 11.6, C.white);
  // лобовое и маршрут
  glass(ctx, [8.6, -42, 9, -68, 14.6, -84, 30, -84, 30, -42]);
  B(ctx, 12, -90.6, 24, 6.6, C.ink, { lw: 0, off: 0 });
  T(ctx, 'м7', 24, -87, { size: 6.6, color: C.yellow, maxW: 20 });
  // окна салона с пассажирами
  const win = (x, w) => {
    glass(ctx, [x, -44, x, -80, x + w, -80, x + w, -44]);
    const n = Math.max(1, Math.round(w / 15));
    for (let i = 0; i < n; i++) {
      const px = x + 6 + i * (w - 10) / n + (hash3(x, i, 3) % 4), ph = 10 + hash3(x, i, 5) % 7;
      if (hash3(x, i, 9) % 3 === 0) continue;
      F(ctx, [px, -44.8, px + 1, -44.8 - ph + 4, px + 3, -44.8 - ph, px + 7, -44.8 - ph, px + 9, -44.8 - ph + 4, px + 10, -44.8], NAVY);
    }
  };
  win(62, 44); win(138, 38); win(206, 52);
  // двери
  const door = x => {
    S(ctx, [x, -16, x, -82, x + 26, -82, x + 26, -16], NAVY, { lw: 1.8, off: 0 });
    F(ctx, [x + 2.6, -46, x + 2.6, -78.6, x + 11.6, -78.6, x + 11.6, -46], GLASS);
    F(ctx, [x + 14.4, -46, x + 14.4, -78.6, x + 23.4, -78.6, x + 23.4, -46], GLASS);
    L(ctx, [x + 13, -81, x + 13, -17], 1.2, C.ink, { j: 0 });
  };
  door(33); door(109); door(179); door(262);
  T(ctx, 'электробус', 172, -23, { size: 12, maxW: 70, color: C.white, font: FONT.wide, weight: 800 });
  S(ctx, [7, -27.6, 13, -28.6, 13.4, -21, 7, -20.4], C.cream, { lw: 1.3, off: 0, press: 0 });
  S(ctx, [2, -64, 7, -66, 7, -56, 2.6, -55], C.ink2, { lw: 1.2, off: 0, press: 0 });                  // зеркало-ухо
  F(ctx, [4, -16.6, 22, -16.6, 22, -12, 4, -12], RUBBER);
};

/* ───────────────────────────── НАД ГОЛОВОЙ ─────────────────────────────
   Нижний край — на высоте 38: под этим пригибаются. Опоры стоят за дорожкой. */
const post = (ctx, x, top, w) => { F(ctx, [x, 0, x + (w || 5), 0, x + (w || 5) - 0.6, top, x + 0.6, top], BACK); F(ctx, [x - 2, 0, x + (w || 5) + 2, 0, x + (w || 5) + 1, -6, x - 1, -6], BACK2); };

/* Вывеска на кронштейне: световой короб висит на цепях над тротуаром */
O.bracket = function (ctx, o) {
  post(ctx, 92, -130, 6);
  L(ctx, [2, -86, 96, -86.4], 3.4, C.ink2, { j: 0.2 });
  L(ctx, [96, -62, 72, -86], 2.4, C.ink2, { j: 0 });
  ctx.save();
  ctx.translate(44, -84);
  ctx.rotate((Math.floor(o.t * 3) % 2 ? 1 : -1) * 0.012);
  L(ctx, [-32, 0, -32, 16], 1.5, C.ink, { j: 0 });
  L(ctx, [32, 0, 32, 16], 1.5, C.ink, { j: 0 });
  if (K.sign) K.sign(ctx, o.text || 'Шестёрочка', -42, 16, 84, 30);
  ctx.restore();
};

/* Шлагбаум: стрела в красную полоску, тумба и табличка для чужих */
O.gate = function (ctx, o) {
  F(ctx, [114, 0, 130, 0, 129, -60, 115, -60], BACK);
  F(ctx, [114.6, -44, 129.4, -44, 129.4, -40, 114.6, -40], BACK2);
  F(ctx, [118, -66.6, 126, -66.6, 126, -60, 118, -60], (Math.floor(o.t * 2.4) % 2) ? C.yellow : BACK2);
  hazard(ctx, [0.6, -50, 124, -50.6, 124, -40.4, 1, -39.6], 15, C.white, C.danger);
  S(ctx, [122, -53, 136, -53, 136, -37.6, 122, -37.6], C.ink2, { lw: 2, off: 0 });                    // противовес
  S(ctx, [34, -63.6, 78, -64.4, 78.4, -52.4, 34.4, -51.6], C.white, { lw: 1.7, off: 0.9 });
  T(ctx, 'ТОЛЬКО ДЛЯ ЖИЛЬЦОВ', 56.2, -57.8, { size: 6.2, maxW: 39 });
};

/* Двутавр на стропах: кран где-то наверху, монтажник где-то в телефоне */
O.beam = function (ctx, o) {
  ctx.save();
  ctx.translate(50, -112);
  ctx.rotate((Math.floor(o.t * 2.4) % 2 ? 1 : -1) * 0.016);
  ctx.translate(-50, 112);
  L(ctx, [50, -108, 50, -900], 1.8, C.ink, { j: 0 });
  L(ctx, [20, -62, 50, -108, 80, -62], 1.6, C.ink, { j: 0 });
  S(ctx, [43.6, -106, 44.6, -116, 55.4, -116, 56.4, -106], C.yellow, { lw: 1.8, off: 0 });
  S(ctx, [0.6, -62.6, 99.4, -63, 99.4, -38.6, 0.6, -38.2], C.brick);
  F(ctx, [1.6, -57.4, 98.4, -57.8, 98.4, -44, 1.6, -43.6], '#93412D');                               // стенка двутавра в тени
  for (const x of [14, 34, 66, 86]) { ctx.fillStyle = C.ink; ctx.fillRect(x, -61, 1.8, 1.8); ctx.fillRect(x, -41.6, 1.8, 1.8); }
  T(ctx, '№7', 50, -50.6, { size: 9, color: C.paper, maxW: 20 });
  hazard(ctx, [1, -62.6, 11, -62.6, 11, -38.4, 1, -38.4], 6.4, C.white, C.danger, 1.2);
  hazard(ctx, [89, -62.8, 99, -62.8, 99, -38.6, 89, -38.6], 6.4, C.white, C.danger, 1.2);
  ctx.restore();
};

/* Дворовая сушилка: простыня, тельняшка и чьи-то треники */
O.laundry = function (ctx, o) {
  post(ctx, -6, -94, 4);
  post(ctx, 117, -92, 4);
  F(ctx, [-12, -94.6, 4, -94.6, 4, -92, -12, -92], BACK);
  F(ctx, [111, -92.6, 127, -92.6, 127, -90, 111, -90], BACK);
  L(ctx, [-4, -89, 30, -84.6, 62, -83, 92, -84.6, 119, -88], 1.4, C.ink, { j: 0 });
  const w = Math.floor(o.t * 3) % 2 ? 1.6 : 0;
  S(ctx, [6, -86.4, 45, -83.4, 44 + w, -40, 26, -41.6 + w, 8 + w, -40.4], C.white, { lw: 2, off: 1.2 });       // простыня
  L(ctx, [20, -84, 20.6 + w * 0.5, -44], 1, C.concrete, { j: 0 });
  // тельняшка
  const tee = [53, -83, 59, -83.4, 62, -80.4, 68, -80.2, 71, -83, 77.4, -83, 82, -74.4, 77.4, -71, 76.4 + w, -50, 56 + w, -50, 55.4, -71, 49.6, -74.6];
  const tp = S(ctx, tee, C.white, { lw: 2, off: 0 });
  ctx.save();
  ink.trace(ctx, tp, true);
  ctx.clip();
  ctx.fillStyle = '#2F4A6C';
  for (let y = -80; y < -50; y += 5.6) ctx.fillRect(48, y, 36, 2.4);
  ctx.restore();
  ink.trace(ctx, tp, true); ink.setLine(ctx, 2, C.ink); ctx.stroke();
  S(ctx, [88, -84.4, 110, -86, 111 + w, -39.6, 102.4 + w, -39.4, 99.4, -68, 97 + w, -39.4, 88.4 + w, -39.6], C.ink2, { lw: 2, off: 0 });   // треники
  F(ctx, [108.6, -84, 110, -84.4, 110.6 + w, -41, 109.4 + w, -41], C.white);
  for (const x of [8, 43, 54, 76, 90, 108]) { ctx.fillStyle = C.kraft; ctx.fillRect(x, -88.6, 2, 5); }           // прищепки
};

/* Берёза нависла над тротуаром: ствол стоит за дорожкой, а плакучие ветки висят прямо на пути */
O.branch = function (ctx, o) {
  // ствол — фон: белый с чёрточками
  F(ctx, [70, 0, 84, 0, 82, -90, 80.6, -196, 75, -196, 73, -90], '#DED7C7');
  for (const [y, w] of [[-18, 6], [-44, 4], [-70, 7], [-128, 5], [-160, 4]]) F(ctx, [72 + (y % 3), y, 72 + w + (y % 3), y - 1, 72 + w, y + 3, 73, y + 3.6], BACK2);
  const sway = Math.floor(o.t * 2.5) % 2 ? 1.6 : 0;
  // крона над суком: зубчатый край, как у вырезанной из бумаги листвы
  S(ctx, [4, -92, 9, -101, 6, -106, 15, -108, 16, -116, 26, -113, 31, -121, 40, -116, 48, -123, 55, -116, 64, -119, 68, -110, 77, -110, 78, -100, 86, -96, 80, -90, 70, -93, 58, -88, 44, -92, 30, -87, 16, -90], '#5C7C4C', { lw: 2.6 });
  F(ctx, [16, -104, 24, -110, 34, -106, 28, -99], '#7E9E69');
  F(ctx, [44, -112, 54, -113, 60, -105, 50, -103], '#7E9E69');
  // сук
  S(ctx, [82, -104, 78, -93, 50, -88, 22, -84, 5, -86, 6, -91, 22, -90, 50, -95, 76, -103], '#4A3A2E', { lw: 2, off: 0 });
  // плакучие ветки с листьями
  const twig = (x, len, k) => {
    const sx = sway * k, y0 = -87, y1 = y0 + len;
    L(ctx, [x, y0, x + sx * 0.5, y0 + len * 0.5, x + sx, y1], 1.5, '#4A3A2E', { j: 0 });
    const n = Math.floor(len / 8.4);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.7) / n, lx = x + sx * t, ly = y0 + len * t, side = i % 2 ? 1 : -1;
      S(ctx, [lx, ly - 1.4, lx + side * 4.6, ly - 0.2, lx + side * 6.6, ly + 4.4, lx + side * 1.4, ly + 3.6], (i + Math.round(x)) % 3 ? C.green : '#8FAE78', { lw: 1.3, off: 0, press: 0, j: 0.2 });
    }
    S(ctx, [x + sx - 2.4, y1 - 0.6, x + sx + 2.6, y1 - 0.4, x + sx + 0.4, y1 + 5.6], (Math.round(x) % 4) ? C.green : C.yellow, { lw: 1.3, off: 0, press: 0, j: 0.2 });
  };
  twig(10, 41, 1); twig(21, 34, 0.7); twig(32, 43, 1.1); twig(43, 36, 0.8); twig(54, 42, 1); twig(64, 33, 0.6); twig(73, 40, 0.9);
};

/* Растяжка между столбами: ткань провисла, люверсы, буквы по трафарету */
O.banner = function (ctx, o) {
  post(ctx, -17, -126, 5);
  post(ctx, 134, -126, 5);
  const w = Math.floor(o.t * 3) % 2 ? 1.5 : 0;
  L(ctx, [-13, -118, 5, -84], 1.3, C.ink, { j: 0 }); L(ctx, [-13, -58, 5, -41], 1.3, C.ink, { j: 0 });
  L(ctx, [137, -118, 119, -84], 1.3, C.ink, { j: 0 }); L(ctx, [137, -58, 119, -41], 1.3, C.ink, { j: 0 });
  S(ctx, [4, -85, 34, -82.4 + w, 62, -84, 92, -82.4 - w, 120, -85, 119.4, -40, 92, -41.6 + w, 62, -39.6, 32, -41.6 - w, 4.6, -39.6], C.white);
  F(ctx, [5.6, -83, 34, -80.6 + w, 62, -82.2, 92, -80.6 - w, 118.4, -83, 118.4, -77.6, 92, -75.4 - w, 62, -77, 34, -75.4 + w, 5.6, -77.6], C.danger);
  const lines = ink.wrap(o.text || 'УЖЕ СДАЛИ', 2);
  lines.forEach((l, i) => T(ctx, l, 62, -59.4 + (i - (lines.length - 1) / 2) * 15, { size: lines.length > 1 ? 15.5 : 22, maxW: 104 }));
  ctx.fillStyle = C.ink;
  for (const [x, y] of [[8, -80], [116, -80], [8, -44.6], [116, -44.6]]) ctx.fillRect(x - 1, y - 1, 2.2, 2.2);
};

/* Огромное объявление с отрывными хвостиками: скотч по углам, пара хвостиков уже оторвана */
O.listing = function (ctx, o) {
  post(ctx, -15, -180, 6);
  post(ctx, 115, -180, 6);
  F(ctx, [-16, -181, 122, -181, 122, -175, -16, -175], BACK);
  ctx.save();
  ctx.translate(54, -176);
  ctx.rotate((Math.floor(o.t * 2.4) % 2 ? 1 : -1) * 0.012);
  L(ctx, [-34, 0, -34, 17], 1.5, C.ink, { j: 0 });
  L(ctx, [38, 0, 38, 17], 1.5, C.ink, { j: 0 });
  // хвостики
  for (let i = 0; i < 8; i++) {
    const x = -50 + i * 13, torn = i === 2 || i === 5, len = torn ? 4 + i : 21;
    ink.poly(ctx, [x + 0.4, 116, x + 12.6, 116, x + 12.4, 116 + len, x + 0.6, 116 + len], { fill: C.white, lw: 1.5, off: 0, press: 0, j: 0.3 });
    if (!torn) { ctx.fillStyle = C.muted; ctx.fillRect(x + 4.2, 120, 1, 13); ctx.fillRect(x + 7, 120, 1, 13); }
  }
  S(ctx, [-51, 17, 55, 16, 55.6, 117, -50.6, 117.6], C.white, { lw: 3 });
  F(ctx, [-49.4, 18.6, 54, 17.6, 54, 37, -49.4, 38], C.ink);
  T(ctx, 'СДАЁТСЯ', 2, 28, { size: 16, color: C.white, maxW: 92 });
  T(ctx, 'ЕВРОТРЁШКА', 2, 50, { size: 15, maxW: 94 });
  T(ctx, '24 м²', 2, 70.5, { size: 26, maxW: 94 });
  T(ctx, '95 000 ₽', 2, 93, { size: 22, maxW: 94 });
  T(ctx, 'комиссия 100% · торг в бо́льшую сторону', 2, 109.6, { size: 5.6, maxW: 96, font: FONT.text, weight: 700, color: C.muted });
  for (const [x, y, r] of [[-51, 17, 0.7], [55, 16, -0.7]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); F(ctx, [-7, -2.6, 7, -2.6, 7, 2.6, -7, 2.6], 'rgba(224,190,139,.85)'); ctx.restore(); }
  ctx.restore();
};

/* Знак «Остановка запрещена» с табличкой про эвакуатор. Висит низко, как и всё в центре */
O.roadsign = function (ctx) {
  post(ctx, 40, -150, 5);
  F(ctx, [14, -74, 44, -74, 44, -71, 14, -71], BACK2);
  D(ctx, 21, -76, 19.4, C.danger, { n: 14, j: 0.03 });
  D(ctx, 21, -76, 14.4, '#2F74C0', { lw: 0, off: 0, n: 14, j: 0.03 });
  ctx.save();
  ctx.translate(21, -76);
  ctx.rotate(0.78);
  ctx.fillStyle = C.danger;
  ctx.fillRect(-15, -2.4, 30, 4.8);
  ctx.fillRect(-2.4, -15, 4.8, 30);
  ctx.restore();
  S(ctx, [2.6, -55.6, 39.4, -56, 39.6, -38.6, 2.8, -38.2], C.white, { lw: 2.2, off: 1 });
  // эвакуатор на табличке
  F(ctx, [7, -44.6, 30, -44.6, 30, -42.4, 7, -42.4], C.ink);
  F(ctx, [24, -44.6, 24, -51, 29.4, -51, 33, -47, 35, -46.4, 35, -42.4, 24, -42.4], C.ink);
  F(ctx, [8, -45.6, 9, -49, 12.6, -51.4, 18, -51.4, 20.6, -49, 22, -45.6], C.ink);
  for (const x of [11, 19, 30]) D(ctx, x, -42, 2.2, C.ink, { lw: 0, off: 0, n: 6 });
  L(ctx, [22, -46, 14, -53], 1.2, C.ink, { j: 0 });
};

Art.obstacles = O;

/* Плоская тень под препятствием — только у того, что стоит на земле */
Art.shadowFor = function (ctx, o) {
  const d = o.def;
  if (d.type === 'jump') ink.shadow(ctx, d.hit[0] - 3, d.w - d.hit[0] + 1, 0.5, 4.5);
  else if (d.type === 'platform') ink.shadow(ctx, d.profile[0][0] - 3, d.profile[d.profile.length - 1][1], 0.5, 5.5);
};

})(window.KTM = window.KTM || {});
