/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — графика игрового слоя

   Герой, препятствия и карточки квартир. Всё рисуется на холсте кодом,
   без картинок. Правило стиля: то, с чем игрок взаимодействует, — яркое
   и с тёмной обводкой; фон (city.js) — светлый и без обводки.

   Препятствия рисуются от левого нижнего угла, y вверх — минус.
   Размеры — как в каталоге (content.js): 33 юнита ≈ 1 метр.
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, clamp, lerp, fmt, rr, dot, poly, stripes } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors;

/* ───────────────────────────── ПОМОЩНИКИ ───────────────────────────── */
function outline(ctx, w) {
  ctx.lineWidth = w || 2.5;
  ctx.strokeStyle = C.ink;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}
/* Скруглённый блок с обводкой. top — координата верха (отрицательная) */
function block(ctx, x, top, w, h, r, fill, lw) {
  rr(ctx, x, top, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  outline(ctx, lw);
}
function wheel(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, TAU); ctx.fillStyle = '#9A9A9A'; ctx.fill();
}
function line(ctx, pts, w, color) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.lineWidth = w;
  ctx.strokeStyle = color || C.ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}
/* Надпись, которая сама уменьшается, чтобы влезть в maxW */
function label(ctx, str, x, y, maxW, size, color, weight, family, align) {
  let s = size;
  ctx.font = `${weight || 800} ${s}px ${family || FONT.display}`;
  const w = ctx.measureText(str).width;
  if (w > maxW) { s = Math.max(3, s * maxW / w); ctx.font = `${weight || 800} ${s}px ${family || FONT.display}`; }
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  return s;
}
/* Делит фразу на строки примерно равной длины */
function wrap(str, maxLines) {
  const words = String(str).split(' ');
  if (words.length <= 1 || maxLines <= 1) return [str];
  const target = Math.ceil(str.length / Math.min(maxLines, words.length));
  const out = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > target && out.length < maxLines - 1) { out.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}
function multiline(ctx, str, x, yCenter, maxW, size, color, maxLines, gap) {
  const ls = wrap(str, maxLines || 2), lh = size * (gap || 1.2);
  ls.forEach((l, i) => label(ctx, l, x, yCenter + (i - (ls.length - 1) / 2) * lh, maxW, size, color));
}
/* Сегмент руки или ноги: два звена от точки (x, y). Углы — от направления «вниз», вперёд — плюс */
function limb(ctx, x, y, a1, l1, a2, l2, width, color) {
  const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
  const ex = kx + Math.sin(a2) * l2, ey = ky + Math.cos(a2) * l2;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(kx, ky);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  return [ex, ey, a2];
}
/* Человек в полный рост (≈ 60 юнитов), стоит по центру cx. Возвращает высоту плеч */
function person(ctx, cx, o) {
  const top = o.top || C.ink2, legs = o.legs || C.ink, sway = o.sway || 0, step = o.step || 0;
  ctx.fillStyle = legs;
  ctx.fillRect(cx - 6 - step, -24, 5.5, 22);
  ctx.fillRect(cx + 1.5 + step, -24, 5.5, 22);
  rr(ctx, cx - 10.5 - step, -4.5, 10.5, 4.5, 2); ctx.fill();
  rr(ctx, cx - 2.5 + step, -4.5, 10.5, 4.5, 2); ctx.fill();
  rr(ctx, cx - 9.5, -46, 19, 24, 5);
  ctx.fillStyle = top;
  ctx.fill();
  ctx.fillStyle = o.skin || C.skin;
  ctx.beginPath();
  ctx.arc(cx, -54.5 + sway, 7.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = o.hair || C.ink;
  ctx.beginPath();
  ctx.arc(cx, -55.5 + sway, 7.7, Math.PI, TAU);
  ctx.closePath();
  ctx.fill();
  return -43;
}

const Art = {};

/* Ключ в духе логотипа: головка в начале координат, бородка вправо */
Art.key = function (ctx, s, color, withOutline) {
  ctx.beginPath();
  dot(ctx, 0, 0, s * 0.56);
  ctx.rect(s * 0.3, -s * 0.16, s * 1.15, s * 0.32);
  ctx.rect(s * 0.86, s * 0.1, s * 0.2, s * 0.34);
  ctx.rect(s * 1.2, s * 0.1, s * 0.2, s * 0.26);
  if (withOutline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.6, s * 0.3);
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(-s * 0.14, 0, s * 0.17, 0, TAU);
  ctx.fill();
};

function cardboard(ctx, x, w, h) {
  rr(ctx, x + 1.25, -h + 1.25, w - 2.5, h - 2.5, 3);
  ctx.fillStyle = C.kraft;
  ctx.fill();
  ctx.fillStyle = C.kraftLight;
  ctx.fillRect(x + w / 2 - 4, -h + 2.5, 8, h - 5);
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + 2.5, -h + 8.5, w - 5, 1.6);
  ctx.fillRect(x + 6, -11, 1.6, 6);
  ctx.fillRect(x + 10, -11, 1.6, 6);
  rr(ctx, x + 1.25, -h + 1.25, w - 2.5, h - 2.5, 3);
  outline(ctx);
}

/* Тросы, на которых висит всё, под чем надо пригибаться */
function ropes(ctx, x1, y1, x2, y2, spread) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x1 - (spread || 0), -900);
  ctx.moveTo(x2, y2); ctx.lineTo(x2 + (spread || 0), -900);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
}

/* Кузов легковой машины (140×48). Рисуется и как препятствие, и на эвакуаторе */
function carBody(ctx, color, glass) {
  ctx.beginPath();
  poly(ctx, [3, -8, 3, -20, 8, -27, 36, -31, 50, -46, 104, -46, 116, -33, 134, -31, 137, -24, 137, -8]);
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx);
  ctx.fillStyle = glass || '#CFE0E8';
  ctx.beginPath();
  poly(ctx, [41, -31.5, 52.5, -43, 75, -43, 75, -31.5]);
  poly(ctx, [79, -31.5, 79, -43, 102, -43, 110.5, -31.5]);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  line(ctx, [77, -31, 77, -11], 1.4);
  ctx.fillStyle = '#FFF3C4';
  rr(ctx, 4, -24.5, 5, 5, 1.5); ctx.fill();
  ctx.fillStyle = C.danger;
  rr(ctx, 132.5, -26, 4, 6, 1.5); ctx.fill();
  wheel(ctx, 30, -11, 11);
  wheel(ctx, 110, -11, 11);
}

/* ───────────────────────────── ПРЕПЯТСТВИЯ ───────────────────────────── */
const O = {};

O.cone = function (ctx) {
  rr(ctx, 0, -5, 22, 5, 1.5); ctx.fillStyle = C.ink; ctx.fill();
  ctx.save();
  ctx.beginPath();
  poly(ctx, [4, -4, 18, -4, 13, -27, 9, -27]);
  ctx.fillStyle = C.danger;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = C.white;
  ctx.fillRect(0, -18, 22, 5);
  ctx.restore();
  ctx.beginPath();
  poly(ctx, [4, -4, 18, -4, 13, -27, 9, -27]);
  outline(ctx);
};

O.box = function (ctx) { cardboard(ctx, 0, 34, 30); };

O.boxes = function (ctx) {
  cardboard(ctx, 0, 40, 32);
  ctx.save();
  ctx.translate(5, -31);
  ctx.rotate(-0.04);
  cardboard(ctx, 0, 31, 28);
  ctx.restore();
};

O.bags = function (ctx) {
  const bag = (x, w, h, fill) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x - 3, -h * 0.7, x + w * 0.25, -h, x + w / 2, -h);
    ctx.bezierCurveTo(x + w * 0.75, -h, x + w + 3, -h * 0.7, x + w, 0);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    outline(ctx);
    line(ctx, [x + w / 2 - 3, -h - 4, x + w / 2, -h, x + w / 2 + 4, -h - 3], 2.2);
    line(ctx, [x + w * 0.3, -h * 0.55, x + w * 0.4, -h * 0.3], 1.5, 'rgba(255,255,255,.35)');
  };
  bag(18, 22, 17, '#4A4A4A');
  bag(1, 23, 20, C.ink2);
};

O.suitcase = function (ctx) {
  line(ctx, [9, -32, 9, -43, 19, -43, 19, -32], 2.4);
  block(ctx, 2, -33, 24, 29, 4, '#4C9A9A');
  line(ctx, [8, -33, 8, -5], 1.4);
  line(ctx, [20, -33, 20, -5], 1.4);
  wheel(ctx, 7, -3, 3.2);
  wheel(ctx, 21, -3, 3.2);
};

O.aboard = function (ctx, o) {
  line(ctx, [5, -8, 2, -1], 2.6);
  line(ctx, [25, -8, 28, -1], 2.6);
  block(ctx, 2, -41, 26, 35, 2.5, C.white);
  ctx.fillStyle = C.danger;
  ctx.fillRect(3.5, -39.5, 23, 6);
  label(ctx, o.text || 'СДАМ', 15, -19, 21, 7, C.ink);
  ctx.fillStyle = '#B5B5B5';
  ctx.fillRect(7, -12, 16, 1.4);
};

O.washer = function (ctx) {
  block(ctx, 1, -31, 24, 30, 3, '#F1F1F1');
  line(ctx, [2.5, -25, 23.5, -25], 1.4);
  ctx.beginPath(); ctx.arc(13, -13, 7.5, 0, TAU); ctx.fillStyle = '#B9C9D1'; ctx.fill(); outline(ctx, 2);
  ctx.fillStyle = C.ink;
  ctx.beginPath(); dot(ctx, 6, -28, 1.2); dot(ctx, 20, -28, 1.6); ctx.fill();
};

O.bin = function (ctx) {
  ctx.beginPath();
  poly(ctx, [4, 0, 26, 0, 28.5, -35, 1.5, -35]);
  ctx.fillStyle = '#4A5B4E';
  ctx.fill();
  outline(ctx);
  line(ctx, [10, -31, 11, -4], 1.3, 'rgba(255,255,255,.25)');
  line(ctx, [20, -31, 19, -4], 1.3, 'rgba(255,255,255,.25)');
  block(ctx, 0, -41, 30, 7, 3, '#5F7364');
};

O.barrier = function (ctx, o) {
  ctx.beginPath();
  ctx.moveTo(10, -22); ctx.lineTo(5, -1.5);
  ctx.moveTo(10, -22); ctx.lineTo(15, -1.5);
  ctx.moveTo(42, -22); ctx.lineTo(37, -1.5);
  ctx.moveTo(42, -22); ctx.lineTo(47, -1.5);
  outline(ctx, 3);
  ctx.save();
  rr(ctx, 1.25, -37.5, 49.5, 17, 3);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.clip();
  stripes(ctx, 0, -38, 52, 18, 13, C.danger);
  ctx.restore();
  rr(ctx, 1.25, -37.5, 49.5, 17, 3);
  outline(ctx);
  ctx.fillStyle = Math.sin(o.t * 9) > 0 ? C.danger : '#8E2B22';
  ctx.beginPath();
  ctx.arc(9, -39.5, 3, 0, TAU);
  ctx.fill();
  outline(ctx, 1.5);
};

O.block = function (ctx) {
  ctx.beginPath();
  ctx.arc(16, -25, 4.2, Math.PI, 0);
  ctx.moveTo(52.2, -25);
  ctx.arc(48, -25, 4.2, 0, Math.PI, true);
  outline(ctx, 2.2);
  ctx.save();
  rr(ctx, 1.25, -27, 61.5, 25.75, 3);
  ctx.fillStyle = C.concrete;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = C.white;
  ctx.fillRect(0, -18, 64, 9);
  stripes(ctx, 0, -18, 64, 9, 12, C.danger);
  ctx.restore();
  rr(ctx, 1.25, -27, 61.5, 25.75, 3);
  outline(ctx);
};

O.terminal = function (ctx, o) {
  rr(ctx, 0, -4, 24, 4, 1.5); ctx.fillStyle = C.ink; ctx.fill();
  block(ctx, 2, -49, 20, 46, 3, '#5B7FA6');
  rr(ctx, 5, -45, 14, 11, 2);
  ctx.fillStyle = Math.sin(o.t * 4) > 0.6 ? '#FFF3C4' : '#DCE9F0';
  ctx.fill();
  outline(ctx, 1.4);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) dot(ctx, 8 + c * 4, -29 + r * 4, 1.1);
  ctx.fill();
  ctx.fillRect(6, -14, 12, 2);
};

O.contract = function (ctx) {
  ctx.save();
  ctx.translate(18, -2);
  ctx.rotate(-0.07);
  block(ctx, -14, -45, 28, 45, 2, C.white);
  label(ctx, 'ДОГОВОР', 0, -38, 24, 4.6, C.ink);
  ctx.fillStyle = '#B5B5B5';
  for (let i = 0; i < 6; i++) ctx.fillRect(-10, -32 + i * 4, i === 5 ? 12 : 20, 1.4);
  ctx.beginPath();
  ctx.arc(6, -7, 5, 0, TAU);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = C.danger;
  ctx.stroke();
  line(ctx, [-10, -5, -4, -8, -1, -5], 1.3, '#3E78B8');
  ctx.restore();
};

O.scooter = function (ctx) {
  line(ctx, [34, -8, 30, -41], 3.6);
  line(ctx, [25, -41, 35, -43], 3.6);
  block(ctx, 27.5, -31, 6.5, 14, 2, '#F2CF3B', 1.6);
  line(ctx, [8, -6.5, 31, -6.5], 5);
  wheel(ctx, 7, -5.5, 5.5);
  wheel(ctx, 36, -5.5, 5.5);
};

O.bike = function (ctx) {
  const ring = x => {
    ctx.beginPath(); ctx.arc(x, -13, 12, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
    ctx.lineWidth = 3.2; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, -13, 2, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
  };
  ring(14); ring(46);
  const frame = [14, -13, 26, -30, 42, -30, 46, -13, 42, -30, 31, -13, 14, -13, 31, -13, 26, -30];
  line(ctx, frame, 5);
  line(ctx, frame, 2.2, C.danger);
  line(ctx, [42, -30, 44, -38, 50, -38], 3);
  rr(ctx, 20, -35.5, 11, 4, 2); ctx.fillStyle = C.ink; ctx.fill();
  line(ctx, [26, -30, 25, -34], 3);
};

O.sofa = function (ctx) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(7, -4, 4, 4);
  ctx.fillRect(63, -4, 4, 4);
  block(ctx, 8, -33, 58, 16, 5, '#93A089');
  block(ctx, 5, -22, 64, 19, 5, '#A8B59A');
  line(ctx, [37, -21, 37, -5], 1.4);
  block(ctx, 0, -27, 12, 24, 5, '#B5C2A7');
  block(ctx, 62, -27, 12, 24, 5, '#B5C2A7');
};

O.bench = function (ctx) {
  line(ctx, [10, -22, 8, -1], 3.4);
  line(ctx, [60, -22, 62, -1], 3.4);
  line(ctx, [12, -33, 12, -22], 3);
  line(ctx, [58, -33, 58, -22], 3);
  block(ctx, 3, -34, 64, 6, 2.5, '#C79A63', 2);
  block(ctx, 1, -25, 68, 6.5, 2.5, '#D8B384', 2);
};

O.planter = function (ctx) {
  ctx.beginPath();
  dot(ctx, 14, -34, 9); dot(ctx, 28, -38, 11); dot(ctx, 42, -34, 9);
  outline(ctx, 4.4);
  ctx.fillStyle = '#7FA86A';
  ctx.fill();
  ctx.fillStyle = '#E3B5B0';
  ctx.beginPath(); dot(ctx, 20, -39, 2.6); dot(ctx, 35, -41, 2.6); dot(ctx, 44, -35, 2.2); ctx.fill();
  ctx.beginPath();
  poly(ctx, [4, -29, 52, -29, 47, -1.5, 9, -1.5]);
  ctx.fillStyle = C.concrete;
  ctx.fill();
  outline(ctx);
  line(ctx, [7, -22, 49, -22], 1.4, 'rgba(28,28,28,.3)');
};

O.dumpster = function (ctx) {
  wheel(ctx, 13, -3.5, 4);
  wheel(ctx, 55, -3.5, 4);
  ctx.beginPath();
  poly(ctx, [5, -4, 63, -4, 66.5, -39, 1.5, -39]);
  ctx.fillStyle = '#6E8F6A';
  ctx.fill();
  outline(ctx);
  for (const x of [18, 34, 50]) line(ctx, [x, -36, x, -7], 1.4, 'rgba(28,28,28,.35)');
  block(ctx, 0, -47, 68, 9, 3, '#5C7A58');
};

O.photographer = function (ctx, o) {
  line(ctx, [14, -34, 6, -1], 2.2);
  line(ctx, [14, -34, 14, -1], 2.2);
  line(ctx, [14, -34, 22, -1], 2.2);
  // фотограф присел за камерой
  ctx.fillStyle = C.ink;
  rr(ctx, 27, -20, 8, 20, 3); ctx.fill();
  rr(ctx, 37, -20, 8, 20, 3); ctx.fill();
  rr(ctx, 27, -42, 17, 24, 5); ctx.fillStyle = '#7A8CA3'; ctx.fill();
  ctx.beginPath(); ctx.arc(33, -47, 7, 0, TAU); ctx.fillStyle = C.skin; ctx.fill();
  ctx.beginPath(); ctx.arc(33.5, -48, 7.2, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill();
  line(ctx, [30, -36, 22, -40], 4.4, '#7A8CA3');
  // камера с широкоугольником
  rr(ctx, 7, -45, 16, 11, 2); ctx.fillStyle = C.ink; ctx.fill();
  ctx.beginPath();
  poly(ctx, [7, -43.5, 0.5, -47, 0.5, -32, 7, -35.5]);
  ctx.fillStyle = C.ink2;
  ctx.fill();
  outline(ctx, 1.6);
  if (Math.sin(o.t * 3.1) > 0.92) {       // вспышка
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.arc(15, -49, 6, 0, TAU); ctx.fill();
  }
};

O.realtor = function (ctx, o) {
  const sway = Math.sin(o.t * 5) * 0.6;
  person(ctx, 16, { top: C.ink2, sway });
  ctx.fillStyle = C.white;
  ctx.beginPath(); poly(ctx, [11.5, -46, 20, -46, 15.7, -35]); ctx.fill();
  ctx.fillStyle = C.danger;
  ctx.beginPath(); poly(ctx, [14.6, -45.5, 16.8, -45.5, 17.4, -38, 15.7, -35, 14, -38]); ctx.fill();
  block(ctx, 0.8, -40, 10, 14, 2, C.danger, 2);      // папка с договором
  line(ctx, [9.5, -43, 6.5, -33], 4.6, C.ink2);
  line(ctx, [24, -43, 28.5, -46.5, 23.5, -52.5 + sway], 4.6, C.ink2);
  rr(ctx, 21.5, -58 + sway, 4, 8.5, 1.2); ctx.fillStyle = C.ink; ctx.fill();
};

O.fridge = function (ctx) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(3, -2, 5, 2);
  ctx.fillRect(20, -2, 5, 2);
  block(ctx, 1, -63, 26, 62, 3, '#EEF1F3');
  line(ctx, [2.5, -41, 25.5, -41], 1.6);
  ctx.fillStyle = C.ink;
  rr(ctx, 20, -58, 2.6, 11, 1.2); ctx.fill();
  rr(ctx, 20, -37, 2.6, 13, 1.2); ctx.fill();
  ctx.fillStyle = C.danger;
  ctx.beginPath(); ctx.arc(9, -52, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = C.lime;
  ctx.fillRect(6, -34, 5, 4);
};

O.wardrobe = function (ctx) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(4, -3, 5, 3);
  ctx.fillRect(31, -3, 5, 3);
  block(ctx, 1, -64, 38, 61, 2, '#B98E62');
  block(ctx, 0, -68, 40, 5, 1.5, '#9C744C');
  line(ctx, [20, -62, 20, -5], 1.6);
  rr(ctx, 5, -58, 11, 22, 1.5); ctx.strokeStyle = 'rgba(28,28,28,.4)'; ctx.lineWidth = 1.2; ctx.stroke();
  rr(ctx, 24, -58, 11, 22, 1.5); ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath(); dot(ctx, 17, -32, 1.5); dot(ctx, 23, -32, 1.5); ctx.fill();
};

O.mattress = function (ctx) {
  ctx.save();
  ctx.beginPath();
  poly(ctx, [3, -1, 17, -1, 28, -64, 14, -64]);
  ctx.fillStyle = '#F3F0E6';
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = '#9FB6C9';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = -8; y > -64; y -= 9) { ctx.moveTo(0, y); ctx.lineTo(30, y - 2); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(190,150,90,.35)';
  ctx.beginPath(); ctx.ellipse(17, -30, 5, 7, 0.3, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.beginPath();
  poly(ctx, [3, -1, 17, -1, 28, -64, 14, -64]);
  outline(ctx);
};

O.fence = function (ctx) {
  ctx.fillStyle = '#B9B9B9';
  rr(ctx, 6, -7, 16, 7, 2); ctx.fill(); outline(ctx, 2);
  rr(ctx, 50, -7, 16, 7, 2); ctx.fill(); outline(ctx, 2);
  block(ctx, 1, -61, 70, 56, 2, '#6FA07A');
  ctx.fillStyle = C.white;
  ctx.fillRect(2.5, -47, 67, 26);
  multiline(ctx, 'БУДЕТ БИЗНЕС-КЛАСС', 36, -34, 60, 8, '#3C6B49', 2, 1.25);
  rr(ctx, 1, -61, 70, 56, 2);
  outline(ctx);
};

O.musician = function (ctx, o) {
  const sway = Math.sin(o.t * 4) * 0.8;
  block(ctx, 25, -15, 13, 15, 2, C.ink2, 2);
  ctx.beginPath(); ctx.arc(31.5, -7.5, 4, 0, TAU); ctx.fillStyle = '#8A8A8A'; ctx.fill();
  person(ctx, 14, { top: '#7A5C9A', sway });
  line(ctx, [3, -48, 17, -32], 2.4, '#7B4E2A');
  ctx.beginPath(); ctx.ellipse(17, -30, 8, 6.5, -0.5, 0, TAU); ctx.fillStyle = '#D29A52'; ctx.fill(); outline(ctx, 2);
  ctx.beginPath(); ctx.arc(17, -30, 2.2, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
  line(ctx, [21, -43, 14, -36 + sway], 4.4, '#7A5C9A');
  // ноты
  const ny = -66 - (o.t * 14 % 12);
  ctx.fillStyle = C.ink;
  ctx.globalAlpha = 1 - (o.t * 14 % 12) / 12;
  ctx.beginPath(); ctx.ellipse(27, ny, 2.6, 2, -0.4, 0, TAU); ctx.fill();
  ctx.fillRect(28.8, ny - 8, 1.3, 8);
  ctx.globalAlpha = 1;
};

O.janitor = function (ctx, o) {
  const sweep = Math.sin(o.t * 6) * 0.12;
  ctx.save();
  ctx.translate(14, -44);
  ctx.rotate(0.2 + sweep);
  line(ctx, [0, -6, -2, 40], 2.4, '#8A6F55');
  ctx.beginPath(); poly(ctx, [-8, 36, 4, 36, 6, 45, -11, 45]); ctx.fillStyle = C.kraft; ctx.fill(); outline(ctx, 2);
  ctx.restore();
  person(ctx, 24, { top: '#F08A3C', legs: '#3B4A63' });
  ctx.fillStyle = '#E9E9E9';
  ctx.fillRect(14.5, -38, 19, 3);
  ctx.fillRect(14.5, -31, 19, 3);
  line(ctx, [17, -43, 13, -34], 4.6, '#F08A3C');
  rr(ctx, 16.5, -64, 15, 5, 2.5); ctx.fillStyle = '#F08A3C'; ctx.fill();
};

const CAR_COLORS = ['#F4F4F4', '#C9584C', '#6E8FB0', '#C9CED3', '#3A3A3A', '#F2CF3B'];
O.car = function (ctx, o) {
  const kind = o.variant % CAR_COLORS.length, color = CAR_COLORS[kind];
  carBody(ctx, color, kind === 4 ? '#8FA3B0' : '#CFE0E8');
  if (kind === 5) {                       // такси «ЯнЕдет»
    ctx.fillStyle = C.ink;
    for (let i = 0; i < 8; i++) if (i % 2) ctx.fillRect(40 + i * 8, -30.5, 8, 4);
    label(ctx, 'ЯнЕдет', 77, -20, 44, 7.5, C.ink);
    block(ctx, 68, -52, 18, 6, 2, '#F2CF3B', 1.6);
  } else if (kind === 0) {                // каршеринг
    ctx.fillStyle = C.lime;
    ctx.fillRect(40, -30.5, 70, 3.5);
    label(ctx, 'каршеринг', 77, -20, 46, 6.5, C.ink, 700, FONT.text);
  }
  if (o.flag === 'cat') {                 // кот на капоте
    ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.ellipse(22, -36, 7, 6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(15.5, -42, 4.4, 0, TAU); ctx.fill();
    ctx.beginPath(); poly(ctx, [12, -44, 12.5, -49.5, 15.5, -45.5]); poly(ctx, [16, -45.5, 19, -49.5, 19.3, -44]); ctx.fill();
    line(ctx, [28, -33, 33, -37 + Math.sin(o.t * 3) * 2], 2.4);
    ctx.fillStyle = C.lime;
    ctx.beginPath(); dot(ctx, 14, -42.5, 0.9); dot(ctx, 17, -42.5, 0.9); ctx.fill();
  } else if (o.flag === 'hazard') {       // аварийка: «я на минутку»
    ctx.fillStyle = Math.sin(o.t * 10) > 0 ? '#FFB02E' : 'rgba(255,176,46,.25)';
    ctx.beginPath(); dot(ctx, 7, -17, 3.4); dot(ctx, 134, -18, 3.4); ctx.fill();
  }
};

O.gazelle = function (ctx, o) {
  ctx.fillStyle = C.ink2;
  ctx.fillRect(6, -18, 166, 7);
  // кабина — в дальнем конце
  ctx.beginPath();
  poly(ctx, [126, -13, 126, -60, 150, -60, 165, -41, 173.5, -37, 173.5, -13]);
  ctx.fillStyle = '#DDE3E8';
  ctx.fill();
  outline(ctx);
  ctx.beginPath();
  poly(ctx, [132, -56, 148, -56, 159.5, -41.5, 132, -41.5]);
  ctx.fillStyle = '#CFE0E8';
  ctx.fill();
  outline(ctx, 1.6);
  ctx.fillStyle = '#FFF3C4';
  rr(ctx, 168, -30, 5, 6, 1.5); ctx.fill();
  // будка
  block(ctx, 4, -76.5, 122, 62, 3, '#F4F4F4');
  const brand = K.BRANDS[o.text];
  if (brand) { ctx.fillStyle = brand.bg; ctx.fillRect(6, -62, 118, 28); }
  label(ctx, o.text || 'ПЕРЕЕЗДЫ', 65, -48, 104, 13, brand ? brand.fg : C.ink);
  ctx.fillStyle = C.danger;
  ctx.fillRect(5.5, -24, 119, 3);
  wheel(ctx, 34, -12, 12);
  wheel(ctx, 148, -12, 12);
};

O.towtruck = function (ctx, o) {
  ctx.fillStyle = C.ink2;
  ctx.fillRect(4, -30, 150, 8);
  ctx.fillRect(6, -22, 200, 6);
  ctx.save();
  ctx.translate(12, -30);
  ctx.scale(0.92, 0.92);
  carBody(ctx, '#C9CED3');
  ctx.restore();
  ctx.beginPath();
  poly(ctx, [156, -14, 156, -60, 184, -60, 199, -42, 209.5, -38, 209.5, -14]);
  ctx.fillStyle = '#F2A93B';
  ctx.fill();
  outline(ctx);
  ctx.beginPath();
  poly(ctx, [162, -56, 182, -56, 193.5, -42.5, 162, -42.5]);
  ctx.fillStyle = '#CFE0E8';
  ctx.fill();
  outline(ctx, 1.6);
  rr(ctx, 164, -66, 12, 6, 2);
  ctx.fillStyle = Math.sin(o.t * 12) > 0 ? '#FFB02E' : '#A8651A';
  ctx.fill();
  outline(ctx, 1.6);
  label(ctx, 'ЭВАКУАЦИЯ', 80, -18.6, 96, 5.6, C.white);
  wheel(ctx, 34, -12, 12);
  wheel(ctx, 122, -12, 12);
  wheel(ctx, 184, -12, 12);
};

O.dog = function (ctx, o) {
  const p = o.t * 17, bob = Math.sin(p * 2) * 0.9;
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  for (const [lx, ph] of [[15, 0], [20, Math.PI], [33, Math.PI * 0.5], [38, Math.PI * 1.5]]) {
    ctx.moveTo(lx, -11 + bob);
    ctx.lineTo(lx - Math.sin(p + ph) * 5, -1.7 - Math.max(0, Math.cos(p + ph)) * 3);
  }
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, -19 + bob);
  ctx.quadraticCurveTo(46, -22, 44.5, -28.5 + Math.sin(p) * 1.5);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  rr(ctx, 11, -23 + bob, 31, 13, 6.5); ctx.fill();
  ctx.beginPath(); dot(ctx, 10, -21.5 + bob, 7.5); ctx.fill();
  rr(ctx, -0.5, -22 + bob, 9, 6.5, 3); ctx.fill();
  ctx.beginPath(); poly(ctx, [9, -27.5 + bob, 16.5, -31 + bob, 16.5, -22 + bob]); ctx.fill();
  ctx.fillStyle = C.danger;
  ctx.fillRect(16, -26.5 + bob, 3, 10.5);
  ctx.fillStyle = C.white;
  ctx.beginPath(); ctx.arc(7.5, -23.5 + bob, 1.5, 0, TAU); ctx.fill();
};

O.courier = function (ctx, o) {
  // штрихи скорости за спиной
  ctx.strokeStyle = 'rgba(28,28,28,.3)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) { const y = -18 - i * 14, x = 46 + ((o.t * 90 + i * 13) % 16); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); }
  ctx.stroke();
  line(ctx, [11, -7, 14, -41], 3.2);
  line(ctx, [9, -41, 19, -42], 3.2);
  line(ctx, [8, -6, 34, -6], 4.6);
  wheel(ctx, 7, -5, 5);
  wheel(ctx, 37, -5, 5);
  ctx.fillStyle = C.ink;
  ctx.fillRect(20, -28, 5.5, 22);
  ctx.fillRect(27, -28, 5.5, 22);
  block(ctx, 28, -53, 17, 22, 3, '#F2CF3B', 2);   // термокороб
  label(ctx, 'ЯнЕдет', 36.5, -42, 14, 4.2, C.ink);
  ctx.save();
  ctx.translate(27, -28);
  ctx.rotate(-0.2);
  rr(ctx, -9, -22, 17, 23, 5); ctx.fillStyle = '#3B4A63'; ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(19, -55, 7, 0, TAU); ctx.fillStyle = C.skin; ctx.fill();
  ctx.beginPath(); ctx.arc(19.5, -56, 7.6, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); ctx.fillStyle = '#F2CF3B'; ctx.fill(); outline(ctx, 1.4);
  line(ctx, [23, -45, 15, -41], 4.4, '#3B4A63');
};

O.pvzman = function (ctx, o) {
  const step = Math.sin(o.t * 12) * 2.2;
  person(ctx, 26, { top: '#5E7B5C', legs: '#3B4A63', step });
  line(ctx, [20, -42, 12, -30], 4.6, '#5E7B5C');
  // стопка коробок выше головы
  cardboard(ctx, 0, 20, 16);
  ctx.save(); ctx.translate(0, -15 - 14); cardboard(ctx, 1, 18, 14.5); ctx.restore();
  ctx.save(); ctx.translate(0, -15 - 14 - 13.5); cardboard(ctx, 2, 17, 14); ctx.restore();
  ctx.save(); ctx.translate(0, -15 - 14 - 13.5 - 13); cardboard(ctx, 0.5, 18, 14); ctx.restore();
  ctx.save();
  ctx.translate(0, 0);
  ctx.fillStyle = '#8E3C8A';
  ctx.fillRect(3, -24.5, 14, 3);
  ctx.restore();
};

/* ── HIGH: всё, под чем нужно пригнуться. Нижний край — на высоте 38 ── */
O.sign = function (ctx, o) {
  ropes(ctx, 12, -66, 64, -66);
  const brand = K.BRANDS[o.text] || { bg: C.white, fg: C.ink };
  ctx.save();
  ctx.translate(38, -66);
  ctx.rotate(Math.sin(o.t * 2.2) * 0.025);
  block(ctx, -36, 0, 72, 27, 5, brand.bg);
  label(ctx, o.text || 'СДАЁТСЯ', 0, 13.5, 62, 9.5, brand.fg);
  ctx.restore();
};

O.pigeons = function (ctx, o) {
  const bird = (x, y, ph) => {
    const flap = Math.sin(o.t * 22 + ph);
    ctx.beginPath();
    poly(ctx, [x + 2, y - 2, x + 12, y - 2, x + 8, y - 2 - 11 * flap]);
    ctx.fillStyle = '#9AA3AE';
    ctx.fill();
    outline(ctx, 1.6);
    ctx.beginPath(); ctx.ellipse(x + 6, y, 8, 4.4, 0, 0, TAU); ctx.fillStyle = '#7F8995'; ctx.fill(); outline(ctx, 1.8);
    ctx.beginPath(); ctx.arc(x - 2.5, y - 2.5, 3.6, 0, TAU); ctx.fillStyle = '#7F8995'; ctx.fill(); outline(ctx, 1.8);
    line(ctx, [x - 6, y - 2.5, x - 8.5, y - 1.5], 1.8, '#E0733A');
    line(ctx, [x + 13, y, x + 18, y + 1], 2.4, '#7F8995');
  };
  bird(14, -50, 0);
  bird(34, -63, 1.7);
  bird(42, -46, 3.1);
};

O.gate = function (ctx) {
  // стойка стоит за дорожкой — она светлая и не мешает
  ctx.fillStyle = '#BFC3C8';
  rr(ctx, 116, -62, 13, 62, 2); ctx.fill();
  ctx.fillStyle = '#A9AEB4';
  ctx.fillRect(116, -40, 13, 4);
  ctx.save();
  rr(ctx, 0, -50, 124, 10.5, 3.5);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.clip();
  stripes(ctx, 0, -50, 124, 10.5, 16, C.danger);
  ctx.restore();
  rr(ctx, 0, -50, 124, 10.5, 3.5);
  outline(ctx);
};

O.beam = function (ctx, o) {
  ctx.save();
  ctx.translate(50, -110);
  ctx.rotate(Math.sin(o.t * 1.7) * 0.02);
  ctx.translate(-50, 110);
  ctx.beginPath();
  ctx.moveTo(22, -62); ctx.lineTo(50, -108);
  ctx.moveTo(78, -62); ctx.lineTo(50, -108);
  ctx.moveTo(50, -108); ctx.lineTo(50, -900);
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  block(ctx, 44, -114, 12, 9, 2, '#F2CF3B', 2);
  ctx.save();
  rr(ctx, 0, -62, 100, 23.5, 2.5);
  ctx.fillStyle = '#B5553C';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(0, -56, 100, 11.5);
  ctx.fillStyle = C.white;
  ctx.fillRect(0, -62, 12, 24);
  ctx.fillRect(88, -62, 12, 24);
  stripes(ctx, 0, -62, 12, 24, 9, C.danger);
  stripes(ctx, 88, -62, 12, 24, 9, C.danger);
  ctx.restore();
  rr(ctx, 0, -62, 100, 23.5, 2.5);
  outline(ctx);
  ctx.restore();
};

O.laundry = function (ctx, o) {
  // столбы за дорожкой
  ctx.fillStyle = '#C4C8CC';
  ctx.fillRect(-5, -92, 4, 92);
  ctx.fillRect(117, -90, 4, 90);
  ctx.beginPath();
  ctx.moveTo(-3, -88);
  ctx.quadraticCurveTo(58, -78, 119, -86);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  const w = Math.sin(o.t * 2.6) * 1.5;
  // простыня
  ctx.beginPath(); poly(ctx, [6, -85, 46, -82, 45 + w, -40, 8 + w, -42]); ctx.fillStyle = '#FAFAFA'; ctx.fill(); outline(ctx, 2);
  // футболка
  ctx.beginPath(); poly(ctx, [54, -82, 60, -82, 63, -79, 69, -79, 72, -82, 78, -82, 82, -74, 77, -71, 76 + w, -50, 56 + w, -50, 55, -71, 50, -74]);
  ctx.fillStyle = C.lime; ctx.fill(); outline(ctx, 2);
  // штаны
  ctx.beginPath(); poly(ctx, [88, -83, 110, -84, 111 + w, -39, 102 + w, -39, 99, -68, 97 + w, -39, 88 + w, -39]);
  ctx.fillStyle = '#6E8FB0'; ctx.fill(); outline(ctx, 2);
};

O.branch = function (ctx, o) {
  // ствол стоит за дорожкой
  ctx.fillStyle = '#C3B7A6';
  ctx.beginPath(); poly(ctx, [70, 0, 84, 0, 81, -190, 74, -190]); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(78, -86);
  ctx.quadraticCurveTo(50, -76, 8, -58);
  ctx.lineWidth = 9;
  ctx.strokeStyle = C.ink;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#8A6F55';
  ctx.stroke();
  const sway = Math.sin(o.t * 1.8) * 1.2;
  const blobs = [[16, -56, 17], [36, -66, 18], [58, -78, 19], [26, -84, 16], [48, -98, 17], [70, -104, 16], [12, -74, 12]];
  ctx.beginPath();
  for (const [x, y, r] of blobs) dot(ctx, x + sway, y, r);
  outline(ctx, 5);
  ctx.fillStyle = '#7FA86A';
  ctx.fill();
  ctx.fillStyle = '#93BA7D';
  ctx.beginPath(); dot(ctx, 30 + sway, -72, 9); dot(ctx, 54 + sway, -90, 8); ctx.fill();
};

O.banner = function (ctx, o) {
  ropes(ctx, 5, -84, 119, -84, 14);
  ctx.save();
  ctx.translate(62, -84);
  ctx.rotate(Math.sin(o.t * 2) * 0.012);
  block(ctx, -58, 0, 116, 45, 4, C.white);
  ctx.fillStyle = C.danger;
  ctx.fillRect(-56.5, 1.5, 113, 5.5);
  ctx.fillRect(-56.5, 38, 113, 5.5);
  multiline(ctx, o.text || 'УЖЕ СДАЛИ', 0, 22.5, 102, 13, C.ink, 2, 1.12);
  ctx.restore();
};

O.listing = function (ctx, o) {
  ropes(ctx, 14, -158, 94, -158, 4);
  ctx.save();
  ctx.translate(54, -158);
  ctx.rotate(Math.sin(o.t * 1.6) * 0.018);
  rr(ctx, -48, 5, 104, 118, 10); ctx.fillStyle = C.ink; ctx.fill();
  block(ctx, -52, 0, 104, 118, 10, C.white, 3);
  label(ctx, 'ЕВРОТРЁШКА', 0, 20, 88, 11, C.ink);
  label(ctx, '24 м²', 0, 46, 88, 21, C.ink, 900);
  label(ctx, '95 000 ₽', 0, 72, 88, 17, C.ink, 900);
  rr(ctx, -40, 88, 80, 19, 9.5); ctx.fillStyle = C.ink; ctx.fill();
  label(ctx, 'КОМИССИЯ 100%', 0, 98, 70, 8, C.white);
  ctx.restore();
};

/* ── Не убивают ── */
O.puddle = function (ctx, o) {
  ctx.beginPath(); ctx.ellipse(44, -1, 43, 4.2, 0, 0, TAU); ctx.fillStyle = '#9DBBCB'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#6F91A3'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.beginPath(); ctx.ellipse(30 + Math.sin(o.t * 2) * 3, -1.6, 9, 1.1, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(58, -0.6, 6, 0.9, 0, 0, TAU); ctx.fill();
};

O.keys = function (ctx, o) {
  const bob = Math.sin(o.t * 5) * 3;
  ctx.save();
  ctx.translate(13, -20 + bob);
  ctx.beginPath(); ctx.arc(0, -3, 22, 0, TAU); ctx.fillStyle = 'rgba(211,244,78,.28)'; ctx.fill();
  ctx.rotate(-0.5 + Math.sin(o.t * 3) * 0.2);
  Art.key(ctx, 9, C.lime, true);
  ctx.rotate(1.25);
  Art.key(ctx, 7.5, C.white, true);
  ctx.restore();
};

Art.obstacles = O;

/* Стрелка «вниз» под объектом, под которым нужно пригнуться (первые встречи) */
Art.duckCue = function (ctx, x, gy, t) {
  const bob = Math.sin(t * 9) * 2.5;
  ctx.save();
  ctx.translate(x, gy - 20 + bob);
  ctx.beginPath();
  poly(ctx, [-9, -8, 9, -8, 0, 4]);
  ctx.fillStyle = C.lime;
  ctx.fill();
  outline(ctx, 2.2);
  ctx.restore();
};

/* ───────────────────────────── ГЕРОЙ ─────────────────────────────
   Три позы: бег, прыжок, пригнувшись. p.air и p.duck (0…1) плавно их смешивают. */
function drawLeg(ctx, x, y, th, bend, len, color) {
  const [fx, fy, sa] = limb(ctx, x, y, th, len, th - bend, len, 6.2, color);
  ctx.save();
  ctx.translate(fx, fy);
  ctx.rotate(-sa);
  rr(ctx, -3.4, -2.6, 10.5, 5.6, 2.6);
  ctx.fillStyle = C.lime;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  ctx.restore();
}

Art.player = function (ctx, p, gy) {
  const P = CONFIG.player;
  ctx.save();
  ctx.translate(p.x + p.knock, gy - p.h);
  if (p.dead) {
    const k = Math.min(1, -p.rot / (Math.PI / 2));
    ctx.translate(-4 * k, -8 * k);
    ctx.rotate(p.rot);
  }
  ctx.scale(P.scale * (1 - p.sq * 0.55), P.scale * (1 + p.sq));

  const a = p.dead ? 1 : p.air;                 // 0 — на земле, 1 — в воздухе
  const d = p.dead ? 0 : p.duck;                // 0 — стоя, 1 — пригнувшись
  const u = p.dead ? 0.2 : clamp(0.5 + 0.5 * p.vy / P.jumpVelocity, 0, 1);   // 1 — взлёт, 0 — приземление
  const ph = p.phase;

  // бег
  const runTh = q => 0.82 * Math.sin(q), runBend = q => 0.2 + 1.05 * Math.max(0, Math.cos(q));
  // пригнувшись: колени согнуты, шаги короткие
  const duckTh = q => 0.75 + 0.5 * Math.sin(q), duckBend = q => 1.75 + 0.3 * Math.cos(q);
  const groundTh = q => lerp(runTh(q), duckTh(q), d), groundBend = q => lerp(runBend(q), duckBend(q), d);

  const legF = [lerp(groundTh(ph), lerp(0.5, 1.05, u), a), lerp(groundBend(ph), lerp(0.35, 1.5, u), a)];
  const legB = [lerp(groundTh(ph + Math.PI), lerp(-0.55, -0.15, u), a), lerp(groundBend(ph + Math.PI), lerp(0.6, 1.3, u), a)];
  const armRunF = lerp(-0.95 * Math.sin(ph), 1.5 + 0.15 * Math.sin(ph), d);
  const armRunB = lerp(0.95 * Math.sin(ph), 1.2 - 0.15 * Math.sin(ph), d);
  const armF = lerp(armRunF, lerp(0.9, 2.5, u), a);
  const armB = lerp(armRunB, lerp(-1.2, -0.4, u), a);
  const bob = p.onGround && !p.dead ? -Math.abs(Math.sin(ph)) * lerp(1.8, 0.8, d) : 0;
  const hipY = lerp(-21, -11.5, d * (1 - a)) + bob;
  const lean = lerp(0.14 + a * 0.05, 1.28, d * (1 - a));
  const shoulderX = lerp(3, 16, d * (1 - a)), shoulderY = hipY + lerp(-17, -5, d * (1 - a));

  // дальние рука и нога
  limb(ctx, shoulderX - 2, shoulderY, armB, 8.5, armB + 1.1, 8, 5, '#454545');
  drawLeg(ctx, -1.5, hipY, legB[0], legB[1], 10, '#454545');

  // корпус
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(lean);
  rr(ctx, -15.5, -19.5, 9.5, 15, 3.5);           // рюкзак
  ctx.fillStyle = C.lime;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  rr(ctx, -8, -22, 16, 24.5, 7);                 // худи
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-4.5, -22, 4.8, 0, TAU);               // капюшон
  ctx.fill();
  // голова: когда герой пригибается, она смотрит вперёд, а не в землю
  ctx.save();
  ctx.translate(1.5, -29.5);
  ctx.rotate(-lean * 0.72);
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.fillStyle = C.skin;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-0.3, -1.1, 8.3, Math.PI * 0.97, Math.PI * 2.03);    // шапка
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  if (p.dead) {
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(2.3, -0.1); ctx.lineTo(5.1, 2.7);
    ctx.moveTo(5.1, -0.1); ctx.lineTo(2.3, 2.7);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(3.9, 1.3, 1.15, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // ближние нога и рука (в руке ничего нет)
  drawLeg(ctx, 1.5, hipY, legF[0], legF[1], 10, C.ink2);
  limb(ctx, shoulderX, shoulderY, armF, 8.5, armF + 1.15, 8, 5.2, C.ink);
  ctx.restore();
};

/* ───────────────────────────── КАРТОЧКА КВАРТИРЫ ─────────────────────────────
   Все карточки выглядят одинаково: хорошую от плохой игрок отличает по цифрам.
   Рисуется от левого верхнего угла в «родном» размере 168×120. */
Art.card = function (ctx, a) {
  const W = 168, H = 120;
  rr(ctx, 4, 5, W, H, 15);
  ctx.fillStyle = C.ink;
  ctx.fill();
  rr(ctx, 0, 0, W, H, 15);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = C.ink;
  ctx.stroke();

  // заголовок
  label(ctx, a.title, 13, 20, W - 26, 11.5, C.muted, 800, FONT.display, 'left');

  // главное: метры и цена
  label(ctx, a.areaText, 13, 46.5, W - 26, 24, C.ink, 900, FONT.display, 'left');
  label(ctx, a.priceText, 13, 75.5, W - 26, 24, C.ink, 900, FONT.display, 'left');

  // метро и мелкая приписка
  ctx.beginPath();
  ctx.arc(21.5, 102, 8.5, 0, TAU);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = `900 9.5px ${FONT.display}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('М', 21.5, 102.7);
  ctx.font = `800 13px ${FONT.display}`;
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'left';
  ctx.fillText(a.metroText, 35, 102.5);
  if (a.data.note) {
    const used = 35 + ctx.measureText(a.metroText).width + 7;
    label(ctx, a.data.note, used, 103, W - used - 10, 10.5, C.muted, 700, FONT.text, 'left');
  }
};

K.Art = Art;

})(window.KTM = window.KTM || {});
