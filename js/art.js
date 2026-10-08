/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — герой, карточка квартиры и общие детали игрового слоя

   Всё рисуется кодом через «почерк» (ink.js). Иерархия на экране:
     герой       чёрный силуэт с бумажным ободком — самый контрастный объект в кадре;
     препятствия чёрный контур 2.6, плоская краска, нажим снизу и справа (art-obstacles.js);
     карточка    белый лист с лаймовой шапкой и отрывными хвостиками;
     фон         без чёрного: тонкие линии в тон стены или вовсе без контура (city.js).

   Анимация героя покадровая, как в старых аркадах: бег — 8 кадров, прыжок — 3 позы,
   приземление, присед — вход и 4 кадра шага, удар и падение. Между кадрами позы
   не сглаживаются — так движение получается резким и «нарисованным».
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, clamp, lerp, hash3 } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors, ink = K.ink;

/* ───────────────────────────── ПОМОЩНИКИ ─────────────────────────────
   S — форма с контуром, F — плоская деталь без контура, B — коробка, D — «круг», L — линия, T — надпись */
const S = (ctx, pts, fill, o) => ink.poly(ctx, pts, o ? Object.assign({ fill }, o) : { fill });
const F = (ctx, pts, fill) => ink.poly(ctx, pts, { fill, lw: 0, off: 0, j: 0.25 });
const B = (ctx, x, top, w, h, fill, o) => ink.box(ctx, x, top, w, h, o ? Object.assign({ fill }, o) : { fill });
const D = (ctx, x, y, r, fill, o) => ink.disc(ctx, x, y, r, o ? Object.assign({ fill }, o) : { fill });
const L = (ctx, pts, lw, color, o) => ink.line(ctx, pts, lw, color, o);
const T = ink.text;
const THIN = { lw: 1.5, off: 0, press: 0 };            // внутренняя деталь: тонкий контур, краска точно в линии
const MID = { lw: 2, off: 1.2 };

const Art = { S, F, B, D, L, T, THIN, MID };

/* Ключ в духе логотипа: головка в начале координат, бородка вправо */
Art.key = function (ctx, s, color, withOutline) {
  const head = [-s * 0.58, -s * 0.3, -s * 0.2, -s * 0.6, s * 0.3, -s * 0.5, s * 0.5, -s * 0.18,
    s * 1.5, -s * 0.18, s * 1.5, s * 0.46, s * 1.24, s * 0.46, s * 1.24, s * 0.2, s * 1.04, s * 0.2, s * 1.04, s * 0.5, s * 0.8, s * 0.5, s * 0.8, s * 0.2,
    s * 0.5, s * 0.2, s * 0.26, s * 0.56, -s * 0.24, s * 0.58, -s * 0.6, s * 0.24];
  ink.poly(ctx, head, { fill: color, lw: withOutline ? Math.max(1.4, s * 0.22) : 0, off: 0, j: 0, press: withOutline ? undefined : 0 });
  ctx.fillStyle = C.ink;
  ctx.fillRect(-s * 0.3, -s * 0.16, s * 0.3, s * 0.3);
};

/* Стрелка «вниз» под объектом, под которым нужно пригнуться (первые встречи). Дёргается, а не плавает */
Art.duckCue = function (ctx, x, gy, t) {
  const step = Math.floor(t * 6) % 2 ? 3 : 0;
  ctx.save();
  ctx.translate(x, gy - 22 + step);
  S(ctx, [-10, -9, -3.5, -9, -3.5, -17, 3.5, -17, 3.5, -9, 10, -9, 0, 4], C.lime, { lw: 2.2, off: 0 });
  ctx.restore();
};

/* ───────────────────────────── ГЕРОЙ ─────────────────────────────
   Большая голова, вихры назад, чёрное худи, лаймовый рюкзак, белые кроссовки.
   Точка отсчёта — ступни, y вверх — минус. Смотрит вправо. */
const BODY = { thigh: 11, shin: 11.5, torso: 15.5, upper: 8.5, fore: 8 };
const HALO = 1.5;                                        // бумажный ободок вокруг героя

/* Кадры бега. a — ведущая нога [бедро, голень], b — толчковая; углы от «вниз», вперёд — плюс.
   arm — плечо ближней руки (дальняя — в противофазе). up — таз в кадре полёта. */
const RUN = [
  { a: [0.88, 0.6], b: [-0.72, -1.4], lean: 0.32, arm: -1.05, toe: 0.4 },      // контакт: нога вынесена, пятка в землю
  { a: [0.84, -0.84], b: [-0.3, -1.8], lean: 0.38, arm: -0.6, toe: 0 },        // присел на опорной
  { a: [-0.1, -0.5], b: [0.55, -1.3], lean: 0.27, arm: 0.15, toe: 0 },         // пронос
  { a: [-0.66, -1.0], b: [1.12, -0.16], lean: 0.2, arm: 0.9, up: -25.5 },      // толчок и полёт
];
/* Пригнувшись: корпус почти лежит, шаг короткий */
const DUCK = [
  { a: [1.25, -0.5], b: [0.3, -1.9], lean: 1.32, hip: -11.5 },
  { a: [0.75, -1.35], b: [0.95, -1.15], lean: 1.26, hip: -10.5 },
];
const POSE = {
  duckIn: { n: [1.0, -0.9], f: [0.2, -1.5], lean: 0.85, hip: -15, an: [0.9, 2.2], af: [-0.6, 0.6] },
  // в воздухе ближняя рука уходит назад и не закрывает лицо, дальняя тянется вперёд из-за головы
  rise: { n: [1.2, -0.4], f: [-0.4, -1.0], lean: 0.12, hip: -24, an: [-0.9, -0.1], af: [2.3, 2.8] },
  apex: { n: [1.35, -0.7], f: [0.85, -1.05], lean: 0.24, hip: -22, an: [-1.7, -2.3], af: [1.6, 2.4] },
  fall: { n: [0.6, 0.28], f: [-0.2, -0.62], lean: 0.02, hip: -24.5, an: [-2.5, -2.95], af: [2.4, 2.9] },
  land: { n: [1.0, -1.0], f: [0.5, -1.5], lean: 0.52, hip: -14.5, an: [0.5, 1.5], af: [-0.9, 0.3] },
  hit: { n: [1.2, 0.9], f: [-1.0, -0.6], lean: -0.5, hip: -23, an: [-2.2, -2.7], af: [2.4, 2.0] },
  flop: { n: [1.1, 0.5], f: [0.6, 1.0], lean: -0.2, hip: -23, an: [-2.0, -2.5], af: [2.6, 2.9] },
};

/* Герой собирается из групп: дальняя рука, дальняя нога, корпус, голова, ближняя нога, ближняя рука.
   У каждой группы общий бумажный ободок — он отделяет её от фона и от остального тела,
   а внутри группы швов нет. */
function turn(pts, ox, oy, a) {
  const c = Math.cos(a), s = Math.sin(a), out = new Array(pts.length);
  for (let i = 0; i < pts.length; i += 2) { out[i] = ox + pts[i] * c - pts[i + 1] * s; out[i + 1] = oy + pts[i] * s + pts[i + 1] * c; }
  return out;
}
function group(ctx, pieces) {
  for (const q of pieces) q.p = ink.rough(q.pts, 0.35, q.seed);
  ctx.lineJoin = 'round';
  for (const q of pieces) {
    ink.trace(ctx, q.p, true);
    ink.setLine(ctx, (q.lw || 0) + HALO * 2, C.paper);
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  for (const q of pieces) {
    ink.trace(ctx, q.p, true);
    ctx.fillStyle = q.fill;
    ctx.fill();
    if (q.lw) { ink.setLine(ctx, q.lw, C.ink); ctx.stroke(); }
  }
}

function heroLeg(ctx, hx, hy, th, sh, fill, toe, seed) {
  const kx = hx + Math.sin(th) * BODY.thigh, ky = hy + Math.cos(th) * BODY.thigh;
  const fx = kx + Math.sin(sh) * BODY.shin, fy = ky + Math.cos(sh) * BODY.shin;
  const rot = toe === undefined ? -sh * 0.8 : -toe;
  group(ctx, [
    { pts: ink.wedge(hx, hy, 7.6, kx, ky, 6.2), fill, seed },
    { pts: ink.wedge(kx, ky, 6.2, fx, fy, 4.8), fill, seed: seed + 1 },
    // кроссовок: большой, белый
    { pts: turn([-4.6, -3.4, 2.6, -3.8, 9.8, 0.2, 10.4, 3.4, -5, 3.4], fx, fy, rot), fill: C.white, lw: 1.9, seed: seed + 2 },
  ]);
  // лаймовая подошва
  ink.poly(ctx, turn([-4.2, 1.5, 9.6, 1.5, 9.6, 2.9, -4.2, 2.9], fx, fy, rot), { fill: C.lime, lw: 0, off: 0, j: 0 });
}

function heroArm(ctx, sx, sy, up, fo, fill, seed) {
  const ex = sx + Math.sin(up) * BODY.upper, ey = sy + Math.cos(up) * BODY.upper;
  const hx = ex + Math.sin(fo) * BODY.fore, hy = ey + Math.cos(fo) * BODY.fore;
  group(ctx, [
    { pts: ink.wedge(sx, sy, 6, ex, ey, 5), fill, seed },
    { pts: ink.wedge(ex, ey, 5, hx, hy, 4.2), fill, seed: seed + 1 },
    { pts: [hx - 2.5, hy - 2.5, hx + 2.7, hy - 2.3, hx + 2.5, hy + 2.7, hx - 2.3, hy + 2.5], fill: C.skin, lw: 1.4, seed: seed + 2 },
  ]);
}

/* Одна поза: n/f — ближняя и дальняя нога, an/af — руки [плечо, предплечье] */
function heroPose(ctx, q, o) {
  o = o || {};
  const far = '#4B433B', hx = q.hx || 0, hy = q.hip;
  const sx = hx + Math.sin(q.lean) * BODY.torso, sy = hy - Math.cos(q.lean) * BODY.torso;

  heroArm(ctx, sx - 1, sy + 1.5, q.af[0], q.af[1], far, 40);
  heroLeg(ctx, hx - 1.2, hy, q.f[0], q.f[1], far, q.ftoe, 50);

  // корпус: рюкзак, худи, капюшон
  group(ctx, [
    { pts: turn([-17, -17.5, -7.5, -18.5, -7, -4, -16, -3], hx, hy, q.lean), fill: C.lime, lw: 2.2, seed: 10 },
    { pts: turn([-7.4, 2.5, 6.8, 2.5, 8.2, -8.5, 6.2, -17.5, -4.6, -18.6, -8.6, -10], hx, hy, q.lean), fill: C.ink, seed: 14 },
    { pts: turn([-9, -14, -5, -22, 2.5, -19.5, -1, -13], hx, hy, q.lean), fill: C.ink, seed: 18 },
  ]);
  ink.poly(ctx, turn([-16.2, -11.8, -7.8, -12.6, -7.8, -10.8, -16.2, -10], hx, hy, q.lean), { fill: C.ink, lw: 0, off: 0, j: 0 });

  // голова держится ровнее корпуса: герой смотрит вперёд
  const low = q.lean > 0.9;
  const tilt = q.lean * (low ? 0.22 : 0.45) + (q.head || 0);
  const cx = sx + Math.sin(q.lean) * 6.5 + 1.2, cy = sy - Math.cos(q.lean) * 6.5 - 4.5 + (low ? 3.5 : 0);
  const w = o.hair || 0;
  group(ctx, [
    { pts: turn([-8.2, -3.5, -5, -8.6, 4.2, -8.8, 8.6, -4.8, 8.4, -0.5, 10.8, 2, 7.8, 3.6, 7, 7.2, 2, 8.8, -5, 8.2, -8.6, 3.4], cx, cy, tilt), fill: C.skin, lw: 2.2, seed: 22 },
    // вихры: три клина назад, шевелятся от кадра к кадру
    { pts: turn([-9.4, 3.2, -14.5 - w, 1.2 + w, -10, -2.2, -15.5 - w, -6 - w, -9, -7, -11.5 - w * 0.6, -13 + w, -4, -11.2, 4.6, -11.4, 9.6, -6.6, 9, -3.4, 1, -3.8, -2.6, 2.2], cx, cy, tilt), fill: C.ink, seed: 26 },
  ]);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.fillStyle = C.ink;
  if (o.dead) {                                         // крестик вместо глаза и открытый рот
    ctx.save();
    ctx.translate(4.6, 0.4);
    ctx.rotate(0.78);
    ctx.fillRect(-3, -0.8, 6, 1.6);
    ctx.fillRect(-0.8, -3, 1.6, 6);
    ctx.restore();
    ctx.fillRect(4.6, 4.6, 3.2, 2.4);
  } else {
    ctx.fillRect(4, -1.6, 2, 3.8);
    if (o.wince) ctx.fillRect(2.6, -3.8, 5, 1.4);       // сведённая бровь, когда тяжело
  }
  ctx.restore();

  heroLeg(ctx, hx + 1.4, hy, q.n[0], q.n[1], C.ink, q.ntoe, 60);
  heroArm(ctx, sx + 0.5, sy + 1.5, q.an[0], q.an[1], C.ink, 70);
}

const legDrop = l => Math.cos(l[0]) * BODY.thigh + Math.cos(l[1]) * BODY.shin;

/* Поза по состоянию игрока. Возвращает объект для heroPose */
function heroFrame(p) {
  const P = CONFIG.player;
  if (p.dead) return p.deadT < 0.1 ? POSE.hit : POSE.flop;
  if (!p.onGround) {
    const u = p.vy / P.jumpVelocity;
    return u > 0.42 ? POSE.rise : u > -0.34 ? POSE.apex : POSE.fall;
  }
  if (p.crouch) {
    if (p.crouchAge < 0.05) return POSE.duckIn;
    const i = Math.floor(p.phase / (TAU / 4)) % 4, d = DUCK[i % 2], swap = i >= 2;
    const sw = i % 2 ? 0.25 : -0.25;
    return { n: swap ? d.b : d.a, f: swap ? d.a : d.b, lean: d.lean, hip: d.hip, an: [1.35 + sw, 2.3 + sw], af: [0.5 - sw, 1.7 - sw], ntoe: 0, ftoe: 0 };
  }
  if (p.landT < 0.075) return POSE.land;
  const i = Math.floor(p.phase / (TAU / 8)) % 8, r = RUN[i % 4], swap = i >= 4;
  const hip = r.up !== undefined ? r.up : -(legDrop(r.a) + 3.3);
  const armN = swap ? -r.arm : r.arm;
  const toeN = swap ? undefined : r.toe, toeF = swap ? r.toe : undefined;
  return {
    n: swap ? r.b : r.a, f: swap ? r.a : r.b, lean: r.lean, hip,
    an: [armN, armN + 1.5], af: [-armN, -armN + 1.5],
    ntoe: toeN === undefined ? undefined : toeN, ftoe: toeF === undefined ? undefined : toeF,
  };
}

Art.player = function (ctx, p, gy) {
  const P = CONFIG.player;
  ctx.save();
  ctx.translate(p.x + p.knock, gy - p.h);
  if (p.dead && p.deadT >= 0.1) {
    // кувырок назад по кадрам, а не плавным поворотом
    const rot = Math.round(p.rot / (Math.PI / 6)) * (Math.PI / 6), k = Math.min(1, -p.rot / (Math.PI / 2));
    ctx.translate(20 * k, -9 * k);                      // лежит головой назад, но не уезжает за край экрана
    ctx.rotate(rot);
  }
  ctx.scale(P.scale * (1 - p.sq * 0.6), P.scale * (1 + p.sq));
  const frame = heroFrame(p);
  const hair = p.dead ? 2.5 : !p.onGround ? (p.vy < 0 ? 3 : -1) : (Math.floor(p.phase / (TAU / 8)) % 2 ? 1.2 : 0);
  heroPose(ctx, frame, { dead: p.dead, hair, wince: p.crouch });
  ctx.restore();
};

/* Удар: колючая «звезда» в точке столкновения. k — 0…1, сколько прошло */
Art.impact = function (ctx, x, y, k) {
  const n = 9, big = 26 + k * 16, small = big * 0.52, pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = i / (n * 2) * TAU + 0.2, r = (i % 2 ? small : big) * (1 + ink.jit(7, i) * 0.16);
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.86);
  }
  ink.poly(ctx, pts, { fill: k < 0.45 ? C.white : C.yellow, lw: 2.6, off: 0, j: 0 });
};

/* Звёздочки над головой упавшего героя */
Art.dizzy = function (ctx, x, y, t) {
  const step = Math.floor(t * 8);
  for (let i = 0; i < 3; i++) {
    const a = (step * 0.5 + i * 2.1), sx = x + Math.cos(a) * 14, sy = y + Math.sin(a) * 4.5;
    const r = 4.2, pts = [];
    for (let j = 0; j < 8; j++) { const b = j / 8 * TAU + step * 0.4, rr = j % 2 ? r * 0.45 : r; pts.push(sx + Math.cos(b) * rr, sy + Math.sin(b) * rr); }
    ink.poly(ctx, pts, { fill: C.yellow, lw: 1.4, off: 0, j: 0, press: 0 });
  }
};

/* ───────────────────────────── КАРТОЧКА КВАРТИРЫ ─────────────────────────────
   Объявление с отрывными хвостиками. Все карточки одинаковые: хорошую от плохой игрок
   отличает только по цифрам. Рисуется от левого верхнего угла в размере 168×120. */
Art.card = function (ctx, a) {
  const W = 168, H = 102, seed = hash3(a.data.id | 0, a.data.area | 0, 3);
  // плоская тень: лист висит в воздухе
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(5, 6); ctx.lineTo(W + 5, 6); ctx.lineTo(W + 5, H + 6); ctx.lineTo(5, H + 6);
  ctx.closePath();
  ctx.fill();

  // хвостики с телефоном: пара уже оторвана
  const tabs = 7, tw = W / tabs;
  for (let i = 0; i < tabs; i++) {
    const torn = (seed >> i) % 5 === 0, len = torn ? 3 + (seed >> (i + 3)) % 4 : 17 - (i % 2);
    ink.poly(ctx, [i * tw + 0.6, H - 1, (i + 1) * tw - 0.6, H - 1, (i + 1) * tw - 0.8, H + len, i * tw + 0.8, H + len], { fill: C.white, lw: 1.6, off: 0, j: 0.35, press: 0 });
    if (!torn) { ctx.fillStyle = C.muted; ctx.fillRect(i * tw + tw / 2 - 1.2, H + 3, 1, 9); ctx.fillRect(i * tw + tw / 2 + 0.8, H + 3, 1, 9); }
  }

  ink.poly(ctx, [0, 0, W, 0, W, H, 0, H], { fill: C.white, lw: 3, off: 0, j: 0.5, seed: 5 });
  ctx.fillStyle = C.lime;
  ctx.fillRect(1.6, 1.6, W - 3.2, 24);
  ctx.fillStyle = C.ink;
  ctx.fillRect(1.5, 25.4, W - 3, 2.2);

  // шапка: что сдают и приписка
  T(ctx, a.title, 9, 14.2, { size: 19, maxW: a.data.note ? 86 : W - 18, align: 'left' });
  if (a.data.note) T(ctx, a.data.note, W - 8, 14.4, { size: 12.5, maxW: 66, align: 'right', font: FONT.text, weight: 700 });

  // главное: площадь и цена — самыми крупными цифрами
  T(ctx, a.areaText, 9, 47.5, { size: 37, maxW: 92, align: 'left' });
  ctx.fillStyle = C.ink;
  ctx.fillRect(108, 37.5, 19, 19);
  T(ctx, 'М', 117.5, 47.6, { size: 17, color: C.white });
  T(ctx, a.metroText, 131, 47.6, { size: 20, maxW: 31, align: 'left' });
  ctx.fillStyle = C.ink;
  ctx.fillRect(8, 64.6, W - 16, 1.4);
  T(ctx, a.priceText, 9, 84.5, { size: 37, maxW: W - 18, align: 'left' });
};

K.Art = Art;

})(window.KTM = window.KTM || {});
