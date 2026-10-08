/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — город: особые места, улица и передний план

   SPECIAL   низкие и особые участки ближнего ряда: гаражи, заборы, пруд, набережная,
             павильон, арка ВДНХ, мост в Зарядье, ГЭС-2. Начало координат — левый нижний угол.
   PropArt   улица: деревья, фонари, остановки, заборчик, контейнерная площадка,
             теплотраса, прохожие. Начало координат — середина низа.
   Всё по правилам city-art.js: без чёрного, плоско, чуть криво.
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, hash3, mix, shade, poly } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors, ink = K.ink;
const { fr, fp, sl, H, crown, trunk } = K.CityArt;
const T = ink.text;
const LIT = '#F3DF9A';

/* Прохожий силуэтом: плоско, без лица. c1 — одежда, c2 — ноги */
function person(k, x, c1, c2, o) {
  o = o || {};
  const h = o.h || 58, s = h / 58;
  fp(k, c2, [x - 5 * s, 0, x - 4.4 * s, -25 * s, x + 4.4 * s, -25 * s, x + 5.6 * s, 0, x + 1.4 * s, 0, x, -18 * s, x - 1.4 * s, 0]);
  fp(k, c1, [x - 7.6 * s, -24 * s, x + 7.6 * s, -24 * s, x + 9 * s, -41 * s, x + 5 * s, -45 * s, x - 5 * s, -45 * s, x - 9 * s, -41 * s]);
  fp(k, o.skin || '#E3BFA0', [x - 5.6 * s, -46 * s, x - 6 * s, -53 * s, x - 3 * s, -58 * s, x + 3.4 * s, -58 * s, x + 6 * s, -53 * s, x + 5.4 * s, -46 * s]);
  fp(k, o.hair || c2, [x - 6.4 * s, -51 * s, x - 3.4 * s, -59 * s, x + 3.8 * s, -59 * s, x + 6.4 * s, -52 * s, x + 2 * s, -54.6 * s, x - 3 * s, -54 * s]);
}

/* Машина у обочины: это фон, поэтому плоская и без чёрного */
function parked(k, x, body, o) {
  o = o || {};
  const dark = shade(body, -0.22), tyre = '#4A443E';
  fp(k, body, [x - 68, -8, x - 68, -22, x - 62, -29, x - 34, -32, x - 20, -47, x + 34, -47, x + 46, -33, x + 64, -31, x + 68, -24, x + 68, -8]);
  fp(k, o.glass || '#A9BCC4', [x - 29, -32.5, x - 18, -44, x + 4, -44, x + 4, -32.5]);
  fp(k, o.glass || '#A9BCC4', [x + 8, -32.5, x + 8, -44, x + 32, -44, x + 41, -32.5]);
  fr(k, dark, x + 5.4, -32, 1.4, 22);
  fr(k, dark, x - 68, -13, 136, 5);
  for (const wx of [x - 40, x + 40]) { fp(k, tyre, [wx - 11, -8, wx - 8, -17, wx, -20, wx + 8, -17, wx + 11, -8, wx + 8, 0, wx - 8, 0]); fr(k, shade(body, 0.2), wx - 4, -12, 8, 8); }
  fr(k, LIT, x - 68, -27, 4, 5);
  fr(k, mix(C.danger, body, 0.3), x + 64, -28, 4, 6);
}

/* ───────────────────────────── ОСОБЫЕ УЧАСТКИ ───────────────────────────── */
const SPECIAL = {
  garages: {    // гаражный кооператив: каждый красил свой сам
    w: [300, 380], h: 110,
    draw(k, f) {
      const n = Math.round(f.w / 60), gw = f.w / n;
      const tones = [mix(C.brick, f.col.wall, 0.45), mix(C.green, f.col.wall, 0.5), mix(C.cool, f.col.wall, 0.4), mix(C.burgundy, f.col.wall, 0.55), mix(C.blue, f.col.wall, 0.5)];
      for (let i = 0; i < n; i++) {
        const x = i * gw, tone = tones[H(f.seed, i, 1, tones.length)], tilt = H(f.seed, i, 4, 5) - 2;
        fr(k, tone, x, -80, gw - 2, 80);
        fp(k, shade(tone, -0.2), [x - 2, -80 - tilt, x + gw, -80 + tilt, x + gw, -86 + tilt, x - 2, -86 - tilt]);     // крыша с уклоном
        fr(k, shade(tone, -0.1), x + 6, -66, gw - 14, 66);
        fr(k, shade(tone, -0.25), x + gw / 2 - 1.5, -66, 1.5, 66);
        fr(k, shade(tone, -0.4), x + gw / 2 + 3, -36, 4, 6);                                                             // замок
        if (H(f.seed, i, 2, 4) === 0) T(k, 'СДАМ', x + gw / 2, -50, { size: 15, maxW: gw - 22, color: shade(tone, 0.55) });
        else T(k, String(100 + H(f.seed, i, 3, 300)), x + gw / 2, -55, { size: 11, maxW: gw - 20, color: shade(tone, 0.4), font: FONT.text, weight: 800 });
        if (H(f.seed, i, 6, 3) === 0) fp(k, shade(tone, -0.3), [x + 8, -8, x + 16, -20, x + 22, -6]);                    // ржавчина
      }
      fr(k, f.col.line, f.w * 0.3, -104, 1.6, 20); fr(k, f.col.line, f.w * 0.3 - 6, -102, 13.6, 1.2);                    // антенна
    },
  },
  fence: {      // бетонный забор с ромбами и колючкой
    w: [280, 380], h: 110,
    draw(k, f) {
      const pw = 76, n = Math.ceil(f.w / pw), body = mix(C.concrete, f.col.wall, 0.3), dark = shade(body, -0.16);
      for (let i = 0; i < n; i++) {
        const x = i * pw;
        fr(k, body, x, -84, pw - 3, 84);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
          const cx = x + 20 + c * 34, cy = -62 + r * 36;
          fp(k, dark, [cx, cy - 14, cx + 13, cy, cx, cy + 14, cx - 13, cy]);
          fp(k, body, [cx, cy - 9, cx + 8, cy, cx, cy + 9, cx - 8, cy]);
        }
        fr(k, dark, x + pw - 3, -84, 3, 84);
      }
      k.strokeStyle = dark; k.lineWidth = 1.4;
      k.beginPath();
      for (let x = 0; x < f.w; x += 12) { k.moveTo(x, -88); k.lineTo(x + 6, -95); k.lineTo(x + 12, -88); }
      k.stroke();
      T(k, 'ЦСКА', f.w * 0.72, -30, { size: 20, maxW: 70, color: mix(C.burgundy, body, 0.35), skew: 0.2 });               // граффити
      if (f.ad) K.adSign(k, f.ad[0], f.ad[1], f.w * 0.18, -78, 150, 56);
    },
  },
  stroyka: {    // строительный забор, за ним каркас будущего дома и башенный кран
    w: [280, 360], h: 330,
    draw(k, f) {
      const frame = mix(C.concrete, f.col.wall, 0.4);
      k.fillStyle = frame;
      for (let x = 18; x < f.w - 10; x += 64) k.fillRect(x, -320, 9, 320);
      for (let y = -90; y > -330; y -= 58) k.fillRect(8, y, f.w - 16, 8);
      fr(k, shade(frame, -0.1), 26, -206, f.w * 0.5, 50);
      fr(k, mix(C.green, frame, 0.55), f.w * 0.5, -148, f.w * 0.38, 50);                                                   // зелёная сетка
      const pw = 62, n = Math.ceil(f.w / pw), g1 = mix(C.green, f.col.wall, 0.4);
      for (let i = 0; i < n; i++) fr(k, i % 2 ? g1 : C.white, i * pw, -86, pw - 2, 86);
      fr(k, shade(g1, -0.15), 0, -90, f.w, 5);
      fr(k, C.yellow, f.w * 0.06, -80, 26, 18);
      T(k, '!', f.w * 0.06 + 13, -70.6, { size: 14, color: C.ink2 });
      if (f.ad) K.adSign(k, f.ad[0], f.ad[1], f.w * 0.2, -82, f.w * 0.66, 64);
    },
  },
  parkFence: {  // ограда парка, за ней деревья
    w: [300, 400], h: 270,
    draw(k, f) {
      for (let i = 0; i < 4; i++) {
        const cx = 40 + i * (f.w - 80) / 3 + H(f.seed, i, 1, 30) - 15, top = 170 + H(f.seed, i, 2, 60);
        trunk(k, cx, top - 30, 11, shade(f.col.leaf2, -0.3));
        crown(k, cx, -top + 26, 56, 60, i % 2 ? f.col.leaf : f.col.leaf2, shade(i % 2 ? f.col.leaf : f.col.leaf2, 0.14), f.seed + i);
      }
      if (f.seed % 3 === 0) {                           // местами вместо решётки — стриженая изгородь
        fp(k, shade(f.col.leaf2, -0.08), [0, 0, 0, -36, 8, -42, f.w - 8, -42, f.w, -36, f.w, 0]);
        k.fillStyle = f.col.leaf;
        for (let x = 14; x < f.w - 10; x += 34) k.fillRect(x + H(f.seed, x, 3, 10), -44, 14, 5);
        return;
      }
      const iron = mix(C.ink2, f.col.wall, 0.5), stone = mix(C.concrete, f.col.wall, 0.3);
      for (let x = 0; x <= f.w; x += 100) { fr(k, stone, x - 7, -82, 14, 82); fp(k, shade(stone, -0.12), [x - 9, -82, x, -92, x + 9, -82]); }
      fr(k, iron, 0, -70, f.w, 3);
      fr(k, iron, 0, -16, f.w, 3);
      k.fillStyle = iron;
      for (let x = 6; x < f.w; x += 9) { k.fillRect(x, -76, 1.8, 76); k.beginPath(); poly(k, [x - 1.2, -76, x + 0.9, -82, x + 3, -76]); k.fill(); }
    },
  },
  pond: {       // Патриаршие: пруд, жёлтый павильон, липы
    w: [420, 460], h: 260,
    draw(k, f) {
      for (let i = 0; i < 5; i++) {
        const cx = 30 + i * (f.w - 60) / 4, top = 190 + H(f.seed, i, 2, 40);
        trunk(k, cx, top - 34, 11, shade(f.col.leaf2, -0.3));
        crown(k, cx, -top + 24, 54, 58, i % 2 ? f.col.leaf : f.col.leaf2, shade(f.col.leaf, 0.14), f.seed + i);
      }
      const px = f.w * 0.52, yel = mix(C.yellow, C.cream, 0.45);
      fr(k, yel, px, -150, 150, 110);
      fr(k, C.white, px - 6, -156, 162, 9);
      fp(k, C.white, [px + 30, -156, px + 75, -184, px + 120, -156]);
      for (let x = px + 10; x < px + 144; x += 22) fr(k, C.white, x, -147, 8, 107);
      for (let x = px + 22; x < px + 130; x += 22) fp(k, mix(C.burgundy, yel, 0.5), [x - 3, -56, x - 3, -96, x + 3, -104, x + 9, -96, x + 9, -56]);
      const water = mix(C.blue, C.paper, 0.35);
      fr(k, water, 0, -62, f.w, 34);
      k.fillStyle = C.white;
      for (let i = 0; i < 7; i++) k.fillRect(20 + H(f.seed, i, 5, f.w - 80), -56 + (i % 3) * 9, 34, 1.6);
      fp(k, C.white, [f.w * 0.2, -40, f.w * 0.2 + 6, -48, f.w * 0.2 + 16, -47, f.w * 0.2 + 20, -40]);                       // лебедь, куда без него
      fr(k, C.white, f.w * 0.2 + 15, -55, 2.4, 9);
      fr(k, mix(C.concrete, C.paper, 0.4), 0, -30, f.w, 30);
      const iron = mix(C.ink2, f.col.wall, 0.45);
      fr(k, iron, 0, -44, f.w, 2.5);
      k.fillStyle = iron;
      for (let x = 8; x < f.w; x += 16) k.fillRect(x, -44, 2, 16);
    },
  },
  embankment: { // набережная: гранитный парапет, река, речной трамвайчик, другой берег
    place: true,
    w: [320, 420], h: 160,
    draw(k, f) {
      const far = shade(f.col.far, -0.04), water = mix(C.blue, C.paper, 0.4), stone = mix(C.concrete, C.paper, 0.2);
      k.fillStyle = far;
      for (let i = 0, x = 0; x < f.w; i++) { const w = 30 + H(f.seed, i, 1, 40), h = 20 + H(f.seed, i, 2, 36); k.fillRect(x, -112 - h, w, h); x += w + 4; }
      fr(k, water, 0, -112, f.w, 62);
      k.fillStyle = C.white;
      for (let i = 0; i < 9; i++) k.fillRect(10 + H(f.seed, i, 5, f.w - 60), -104 + (i % 5) * 11, 40, 1.6);
      const bx = f.w * 0.42;                             // трамвайчик
      fp(k, C.white, [bx, -74, bx + 8, -66, bx + 92, -66, bx + 100, -78, bx + 78, -78, bx + 74, -88, bx + 24, -88, bx + 20, -78]);
      fr(k, mix(C.blue, C.ink2, 0.4), bx + 26, -85, 46, 5);
      fr(k, C.danger, bx + 6, -70, 90, 2);
      fr(k, stone, 0, -52, f.w, 52);
      fr(k, shade(stone, -0.12), 0, -56, f.w, 6);
      for (let x = 0; x < f.w; x += 70) { fr(k, shade(stone, -0.06), x, -64, 12, 64); fr(k, shade(stone, -0.18), x - 2, -66, 16, 3); }
      k.fillStyle = shade(stone, -0.1);
      for (let x = 30; x < f.w; x += 35) k.fillRect(x, -50, 1, 50);
    },
  },
  pavilion: {   // павильон ВДНХ вблизи: колоннада, ярусы, шпиль со звездой
    place: true,
    w: [300, 340], h: 330,
    draw(k, f) {
      const W = f.w, wall = f.col.wall, trim = f.col.trim, gold = mix(C.yellow, wall, 0.2), dark = f.col.dark;
      fr(k, wall, 0, -150, W, 150);
      fr(k, trim, -4, -158, W + 8, 10);
      fr(k, wall, W * 0.14, -214, W * 0.72, 58);
      fr(k, trim, W * 0.14 - 4, -220, W * 0.72 + 8, 8);
      fr(k, wall, W * 0.34, -262, W * 0.32, 44);
      fp(k, wall, [W * 0.44, -262, W * 0.56, -262, W * 0.5, -318]);
      fp(k, gold, [W * 0.5, -330, W * 0.5 + 6, -318, W * 0.5, -310, W * 0.5 - 6, -318]);
      for (let x = 14; x < W - 20; x += 30) { fr(k, trim, x, -146, 13, 140); fr(k, dark, x + 13, -146, 3, 140); fr(k, trim, x - 3, -150, 19, 6); }
      fr(k, f.col.deep, W * 0.42, -100, W * 0.16, 100);
      fr(k, f.col.glass, W * 0.42 + 4, -96, W * 0.16 - 8, 90);
      for (let x = W * 0.2; x < W * 0.8; x += 26) fp(k, f.col.glass, [x, -172, x, -196, x + 6, -204, x + 12, -196, x + 12, -172]);
      fr(k, gold, 0, -164, W, 3);
      T(k, 'ПАВИЛЬОН № ' + (1 + f.seed % 70), W / 2, -234, { size: 13, maxW: W * 0.28, color: dark });
      fr(k, dark, 0, -8, W, 8);
      sl(k, f.col.line, 1.4, [0.7, 0, 0.7, -150]);
    },
  },
  theatre: {    // театр: шесть колонн, фронтон, афиши
    w: [270, 300], h: 300,
    draw(k, f) {
      const W = f.w, wall = mix(C.yellow, C.cream, 0.55), trim = C.white, dark = shade(wall, -0.18);
      fr(k, wall, 0, -222, W, 222);
      fp(k, trim, [-8, -222, W / 2, -286, W + 8, -222]);
      fp(k, wall, [22, -226, W / 2, -272, W - 22, -226]);
      fr(k, trim, -8, -230, W + 16, 10);
      for (let i = 0; i < 6; i++) { const x = 16 + i * (W - 50) / 5; fr(k, trim, x, -218, 18, 204); fr(k, dark, x + 18, -218, 4, 204); fr(k, trim, x - 4, -222, 26, 7); fr(k, trim, x - 4, -20, 26, 8); }
      fr(k, shade(wall, -0.3), W * 0.4, -110, W * 0.2, 96);
      for (const x of [W * 0.2, W * 0.7]) { fr(k, C.white, x, -120, 30, 44); fr(k, C.burgundy, x + 2, -118, 26, 14); fr(k, C.muted, x + 4, -98, 20, 1.4); fr(k, C.muted, x + 4, -93, 14, 1.4); }
      T(k, 'ТЕАТР', W / 2, -246, { size: 20, maxW: W * 0.3, color: dark });
      fr(k, dark, -6, -14, W + 12, 14);
      fr(k, shade(dark, -0.1), -12, -6, W + 24, 6);
    },
  },
  wall: {       // стена с надписями на Арбате
    w: [220, 260], h: 150,
    draw(k, f) {
      const W = f.w, body = mix(C.concrete, C.cream, 0.4);
      fr(k, body, 0, -128, W, 128);
      fr(k, shade(body, -0.12), 0, -132, W, 5);
      fr(k, shade(body, -0.1), W - 8, -128, 8, 128);
      T(k, 'ЦОЙ ЖИВ', W * 0.36, -92, { size: 34, maxW: W * 0.56, color: C.ink2, skew: 0.12 });
      T(k, 'КИНО', W * 0.72, -52, { size: 30, maxW: W * 0.36, color: C.burgundy, skew: -0.08 });
      T(k, 'перемен!', W * 0.3, -36, { size: 18, maxW: W * 0.36, color: mix(C.ink2, body, 0.3), font: FONT.text, weight: 800, skew: 0.2 });
      fp(k, C.yellow, [W * 0.08, -18, W * 0.12, -30, W * 0.17, -22, W * 0.2, -32, W * 0.2, -14]);                          // цветы у стены
      fp(k, C.danger, [W * 0.84, -12, W * 0.87, -24, W * 0.92, -14]);
      k.fillStyle = shade(body, -0.14);
      for (let x = 40; x < W; x += 46) k.fillRect(x, -128, 1, 128);
    },
  },
  vdnhArch: {   // арка главного входа ВДНХ: шесть пилонов и колхозники со снопом
    w: [330, 330], h: 330,
    draw(k, f) {
      const W = f.w, wall = mix(C.cream, C.paper, 0.3), dark = shade(wall, -0.16), gold = mix(C.yellow, wall, 0.15);
      fr(k, wall, 0, -204, W, 40);
      fr(k, C.white, -6, -212, W + 12, 9);
      fr(k, wall, W * 0.3, -250, W * 0.4, 40);
      fr(k, C.white, W * 0.3 - 5, -256, W * 0.4 + 10, 7);
      for (let i = 0; i < 6; i++) { const x = 8 + i * (W - 44) / 5; fr(k, wall, x, -166, 28, 166); fr(k, dark, x + 28, -166, 5, 166); fr(k, C.white, x - 4, -170, 37, 7); fr(k, dark, x - 4, -10, 37, 10); }
      // скульптура: двое держат сноп над головой
      fp(k, gold, [W * 0.44, -256, W * 0.45, -292, W * 0.48, -298, W * 0.49, -256]);
      fp(k, gold, [W * 0.51, -256, W * 0.52, -298, W * 0.55, -292, W * 0.56, -256]);
      fp(k, gold, [W * 0.46, -296, W * 0.44, -318, W * 0.5, -328, W * 0.56, -318, W * 0.54, -296]);
      T(k, 'ВДНХ', W / 2, -230, { size: 22, maxW: W * 0.3, color: dark });
      fr(k, gold, 0, -166, W, 3);
    },
  },
  rocket: {     // ракета «Восток» на стапеле
    w: [130, 130], h: 330,
    draw(k, f) {
      const steel = mix(C.cool, C.paper, 0.3), white = C.white, dark = shade(steel, -0.2);
      fp(k, steel, [20, 0, 34, 0, 72, -150, 62, -156]);
      fp(k, steel, [96, 0, 110, 0, 72, -156, 62, -150]);
      fr(k, dark, 14, -8, 102, 8);
      fp(k, white, [56, -60, 56, -250, 65, -300, 74, -250, 74, -60]);
      fp(k, dark, [70, -60, 70, -250, 74, -250, 74, -60]);
      fp(k, mix(C.green, white, 0.4), [44, -60, 46, -150, 56, -176, 56, -60]);
      fp(k, mix(C.green, white, 0.4), [86, -60, 84, -150, 74, -176, 74, -60]);
      fp(k, C.danger, [56, -250, 65, -300, 74, -250]);
      fr(k, C.danger, 56, -130, 18, 4);
      T(k, 'СССР', 65, -200, { size: 9, maxW: 16, color: C.danger });
      fp(k, dark, [48, -60, 82, -60, 88, -44, 42, -44]);
    },
  },
  bridge: {     // Парящий мост в Зарядье: клин над рекой, стеклянные перила
    w: [430, 430], h: 200,
    draw(k, f) {
      const W = f.w, water = mix(C.blue, C.paper, 0.4), stone = mix(C.concrete, C.paper, 0.25), white = C.white;
      fr(k, water, 0, -70, W, 40);
      k.fillStyle = white;
      for (let i = 0; i < 8; i++) k.fillRect(14 + H(f.seed, i, 5, W - 70), -64 + (i % 4) * 9, 36, 1.6);
      for (let i = 0; i < 4; i++) { const cx = 60 + i * 100; trunk(k, cx, 60, 8, shade(f.col.leaf2, -0.3)); crown(k, cx, -84, 40, 34, f.col.leaf2, shade(f.col.leaf, 0.12), f.seed + i, 8); }
      fp(k, white, [10, -30, 60, -34, W / 2, -150, W - 60, -34, W - 10, -30, W - 10, -42, W - 64, -48, W / 2, -170, 64, -48, 10, -42]);
      fp(k, shade(white, -0.14), [60, -34, W / 2, -150, W - 60, -34, W - 70, -32, W / 2, -138, 70, -32]);
      k.fillStyle = mix(C.blue, white, 0.45);
      for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, x = 64 + (W / 2 - 64) * t, y = -48 - 122 * t; k.fillRect(x, y - 9, 16, 8); k.fillRect(W - x - 16, y - 9, 16, 8); }
      for (const [px, c] of [[W * 0.44, C.brick], [W * 0.5, C.cool], [W * 0.55, C.yellow]]) person(k, px, mix(c, white, 0.3), mix(C.ink2, white, 0.4), { h: 22 });   // люди на мосту — для масштаба
      fr(k, stone, 0, -30, W, 30);
      fr(k, shade(stone, -0.12), 0, -33, W, 4);
    },
  },
  ges2: {       // ГЭС-2: синие трубы, стеклянная крыша, кирпич
    w: [280, 280], h: 330,
    draw(k, f) {
      const W = f.w, pipe = mix('#2F74C0', C.paper, 0.2), brick = mix(C.brick, C.paper, 0.3), glass = mix(C.blue, C.paper, 0.4);
      for (let i = 0; i < 4; i++) { const x = 30 + i * 30; fp(k, pipe, [x, -110, x + 3, -318, x + 15, -318, x + 18, -110]); fr(k, shade(pipe, -0.18), x + 12, -318, 4, 208); fr(k, C.white, x + 2, -322, 14, 5); }
      fr(k, brick, 0, -120, W, 120);
      fp(k, glass, [0, -120, 30, -160, W - 30, -160, W, -120]);
      k.fillStyle = C.white;
      for (let x = 24; x < W - 20; x += 22) k.fillRect(x, -160, 1.6, 40);
      fr(k, C.white, 0, -124, W, 5);
      for (let x = 18; x < W - 30; x += 44) { fp(k, glass, [x, -20, x, -84, x + 5, -98, x + 21, -98, x + 26, -84, x + 26, -20]); fr(k, C.white, x + 12, -98, 1.6, 78); fr(k, C.white, x, -60, 26, 1.6); }
      fr(k, shade(brick, -0.16), 0, -12, W, 12);
      fr(k, shade(brick, -0.12), W - 9, -120, 9, 108);
      T(k, 'ГЭС-2', W - 46, -140, { size: 13, maxW: 40, color: C.white });
    },
  },
};

/* ───────────────────────────── УЛИЦА ─────────────────────────────
   Рисуются один раз во внеэкранный холст. h — высота картинки. */
const PropArt = {
  tree: {
    w: 110, h: 200,
    draw(k, it) {
      fp(k, it.trunk, [-5, 0, 5, 0, 3, -92, 12, -116, 8, -118, 0, -100, -10, -122, -13, -119, -3, -92]);
      crown(k, 2, -138, 50, 52, it.leaf, it.leaf2, it.seed);
    },
  },
  treeBig: {    // старая липа
    w: 150, h: 260,
    draw(k, it) {
      fp(k, it.trunk, [-8, 0, 9, 0, 6, -100, 24, -140, 18, -143, 2, -116, -18, -148, -23, -144, -6, -100]);
      crown(k, -26, -168, 46, 46, shade(it.leaf, -0.06), it.leaf, it.seed + 1, 8);
      crown(k, 30, -176, 50, 52, it.leaf, it.leaf2, it.seed + 2, 9);
      crown(k, 2, -206, 52, 44, it.leaf, it.leaf2, it.seed + 3, 9);
    },
  },
  poplar: {     // тополь: высокий и узкий
    w: 60, h: 280,
    draw(k, it) {
      trunk(k, 0, 90, 8, it.trunk);
      fp(k, it.leaf, [-18, -70, -22, -150, -12, -230, 0, -270, 12, -228, 22, -150, 18, -70, 0, -56]);
      fp(k, it.leaf2, [-14, -150, -8, -224, 0, -256, 2, -200, -4, -130]);
    },
  },
  birch: {      // берёза: белый ствол с чёрточками, редкая крона
    w: 96, h: 230,
    draw(k, it) {
      fp(k, '#E9E3D4', [-5, 0, 5, 0, 2.6, -150, -2.6, -150]);
      fp(k, '#E9E3D4', [1, -110, 22, -150, 19, -152, -1, -118]);
      k.fillStyle = it.ink;
      for (const [y, w] of [[-14, 6], [-38, 4], [-60, 7], [-86, 5], [-118, 4]]) k.fillRect(-4 + (y % 3), y, w, 2.4);
      crown(k, -10, -176, 34, 40, it.leaf2, shade(it.leaf2, 0.14), it.seed, 8);
      crown(k, 20, -166, 28, 30, it.leaf, it.leaf2, it.seed + 5, 7);
      k.fillStyle = it.leaf;
      for (let i = 0; i < 6; i++) k.fillRect(-34 + i * 11 + H(it.seed, i, 2, 5), -138 + H(it.seed, i, 3, 26), 5, 7);       // висячие ветки
    },
  },
  lamp: {       // современный московский фонарь: серая консоль
    w: 50, h: 250,
    draw(k, it) {
      fp(k, it.prop, [-3.5, 0, 3.5, 0, 2, -232, -2, -232]);
      fr(k, it.ink, -6, -10, 12, 10);
      fp(k, it.prop, [-2, -232, 30, -240, 30, -236, -2, -226]);
      fp(k, it.ink, [20, -241, 44, -243, 44, -236, 20, -234]);
      fr(k, LIT, 23, -235, 18, 2.6);
      if (it.note) { fr(k, C.white, -9, -92, 18, 22); fr(k, C.ink2, -7, -89, 14, 4.6); T(k, it.note, 0, -86.6, { size: 5.6, maxW: 13, color: C.white }); for (let i = 0; i < 5; i++) fr(k, C.white, -8.4 + i * 3.5, -70, 2.6, i === 1 ? 2 : 7); }
    },
  },
  lampOld: {    // фонарь-торшер в центре: два гранёных плафона
    w: 44, h: 170,
    draw(k, it) {
      fp(k, it.ink, [-7, 0, 7, 0, 4, -24, 2.6, -118, -2.6, -118, -4, -24]);
      fr(k, it.ink, -20, -122, 40, 3.4);
      for (const x of [-20, 20]) {
        fr(k, it.ink, x - 1, -128, 2, 8);
        fp(k, it.ink, [x - 9, -150, x + 9, -150, x + 6, -128, x - 6, -128]);
        fp(k, LIT, [x - 6.4, -147, x + 6.4, -147, x + 4.4, -131, x - 4.4, -131]);
        fp(k, it.ink, [x - 11, -150, x + 11, -150, x, -162]);
      }
    },
  },
  busstop: {    // остановка: стеклянный павильон, скамейка, знак «А»
    w: 170, h: 150,
    draw(k, it) {
      fr(k, 'rgba(255,253,246,.5)', -70, -82, 140, 76);
      fp(k, 'rgba(255,253,246,.6)', [-50, -6, -40, -6, -10, -82, -20, -82]);
      fr(k, it.ink, -76, -90, 152, 8);
      fr(k, it.ink, -70, -84, 4, 84); fr(k, it.ink, 66, -84, 4, 84); fr(k, it.ink, -2, -84, 3, 84);
      fr(k, it.ink, -56, -24, 70, 5); fr(k, it.ink, -50, -20, 4, 20); fr(k, it.ink, 4, -20, 4, 20);
      if (it.ad) K.adSign(k, it.ad[0], it.ad[1], 24, -78, 38, 66);
      else {
        fr(k, C.white, 24, -78, 38, 66);
        fr(k, it.ink, 29, -70, 28, 3);
        for (let y = -60; y < -20; y += 9) { fr(k, it.ink, 34, y, 22, 1.6); fr(k, [C.danger, C.blue, C.green][((y + 60) / 9) % 3 | 0], 28.6, y - 1, 3.6, 3.6); }
      }
      fr(k, it.ink, 84, -120, 3, 120);
      fr(k, C.yellow, 74, -146, 24, 24);
      T(k, 'А', 86, -133, { size: 22, color: C.ink2 });
      person(k, -34, mix(C.cool, C.paper, 0.2), it.ink, { h: 50 });
    },
  },
  kiosk: {      // ларёк с кофе или едой
    w: 120, loud: true, h: 120,
    draw(k, it) {
      const brand = K.BRANDS[it.brand] || { bg: it.ink, fg: C.white };
      const tone = brand.bg === C.white || brand.bg === '#FFFFFF' ? brand.fg : brand.bg;
      fr(k, C.white, -46, -84, 92, 84);
      fr(k, tone, -46, -14, 92, 14);
      fr(k, '#A9BCC4', -38, -62, 50, 34);
      fp(k, 'rgba(255,253,246,.5)', [-30, -28, -24, -28, -10, -62, -16, -62]);
      fr(k, it.ink, -40, -64, 54, 2.5); fr(k, it.ink, -40, -28, 54, 4); fr(k, it.ink, -14, -62, 2, 34);
      fr(k, it.ink, 20, -62, 20, 62);
      fr(k, '#A9BCC4', 23, -58, 14, 22);
      fp(k, tone, [-50, -76, 50, -76, 58, -64, -58, -64]);
      k.fillStyle = C.white;
      for (let x = -46; x < 50; x += 18) { k.beginPath(); poly(k, [x, -76, x + 9, -76, x + 10.5, -64, x + 0.5, -64]); k.fill(); }
      K.fascia(k, it.brand, -52, -104, 104, 26);
    },
  },
  metro: {      // вестибюль метро: стекло, козырёк и красная «М» на столбе
    w: 230, loud: true, h: 200,
    draw(k, it) {
      fr(k, 'rgba(255,253,246,.55)', -84, -92, 168, 92);
      k.fillStyle = it.ink;
      for (let x = -84; x <= 84; x += 28) k.fillRect(x - 2, -92, 4, 92);
      k.fillRect(-84, -60, 168, 3);
      fr(k, it.ink, -96, -108, 192, 18);
      T(k, 'МЕТРО', 0, -98.4, { size: 14, maxW: 90, color: C.white });
      fr(k, shade(it.ink, -0.25), -28, -70, 56, 70);
      fr(k, '#A9BCC4', -24, -66, 23, 62); fr(k, '#A9BCC4', 1, -66, 23, 62);
      fr(k, it.ink, 104, -150, 5, 150);
      fr(k, C.white, 84, -194, 45, 45);
      fp(k, mix(C.danger, C.paper, 0.1), [89, -155, 89, -188, 96, -188, 106.5, -170, 117, -188, 124, -188, 124, -155, 117, -155, 117, -176, 106.5, -158, 96, -176, 96, -155]);
      sl(k, it.ink, 1.6, [84, -194, 129, -194, 129, -149, 84, -149], true);
    },
  },
  billboard: {  // рекламный щит
    w: 230, loud: true, h: 210,
    draw(k, it) {
      fr(k, it.ink, -58, -96, 7, 96); fr(k, it.ink, 51, -96, 7, 96);
      fr(k, it.ink, -106, -204, 212, 112);
      K.adSign(k, it.ad[0], it.ad[1], -101, -199, 202, 102);
      fr(k, it.ink, -90, -210, 14, 6); fr(k, it.ink, 76, -210, 14, 6);                    // светильники сверху
    },
  },
  citylight: {  // сити-формат: реклама или риелторская мудрость
    w: 80, loud: true, h: 130,
    draw(k, it) {
      fr(k, it.ink, -4, -34, 8, 34);
      fr(k, it.ink, -30, -124, 60, 92);
      if (it.ad) K.adSign(k, it.ad[0], it.ad[1], -26, -120, 52, 84);
      else {
        fr(k, C.white, -26, -120, 52, 84);
        fr(k, C.danger, -26, -120, 52, 8);
        const ls = ink.wrap(it.meme, 3);
        ls.forEach((l, i) => T(k, l, 0, -78 + (i - (ls.length - 1) / 2) * 15, { size: 15, maxW: 46, color: C.ink2 }));
      }
    },
  },
  bench: {
    w: 90, h: 46,
    draw(k, it) {
      fr(k, it.ink, -34, -20, 4, 20); fr(k, it.ink, 30, -20, 4, 20);
      fr(k, it.ink, -32, -40, 3, 20); fr(k, it.ink, 29, -40, 3, 20);
      fr(k, it.prop, -38, -24, 76, 5);
      fr(k, it.prop, -36, -34, 72, 4); fr(k, it.prop, -36, -42, 72, 4);
    },
  },
  granny: {     // бабушка на лавочке: платок, сумка-тележка, всё видит
    w: 100, h: 70,
    draw(k, it) {
      fr(k, it.ink, -38, -20, 4, 20); fr(k, it.ink, 34, -20, 4, 20);
      fr(k, it.prop, -42, -24, 84, 5); fr(k, it.prop, -40, -36, 80, 4); fr(k, it.prop, -40, -44, 80, 4);
      const coat = mix(C.burgundy, C.paper, 0.35);
      fp(k, coat, [-12, -24, -14, -44, -8, -52, 6, -52, 12, -44, 14, -24]);
      fp(k, shade(coat, -0.2), [-10, -24, 8, -24, 10, -4, 4, -4, 3, -18, -3, -18, -4, -4, -10, -4]);
      fp(k, '#E3BFA0', [-6, -52, -6, -60, 6, -60, 6, -52]);
      fp(k, mix(C.yellow, C.paper, 0.3), [-9, -50, -9, -62, -2, -68, 5, -66, 9, -60, 9, -50, 5, -56, -5, -56]);      // платок
      fr(k, mix(C.blue, C.paper, 0.2), 20, -22, 14, 20);                                                                 // тележка
      fr(k, it.ink, 32, -40, 2, 20); fr(k, it.ink, 22, -4, 6, 4);
    },
  },
  playground: { // детская площадка: горка, качели, песочница-грибок
    w: 220, h: 120,
    draw(k, it) {
      const red = mix(C.danger, C.paper, 0.25), yel = mix(C.yellow, C.paper, 0.15), blue = mix(C.blue, C.paper, 0.1);
      fr(k, blue, -98, -96, 4, 96); fr(k, blue, -52, -96, 4, 96); fr(k, blue, -102, -100, 58, 5);
      fr(k, it.ink, -84, -96, 1.4, 64); fr(k, it.ink, -68, -96, 1.4, 64); fr(k, red, -88, -34, 24, 4);
      fr(k, yel, -30, -74, 4, 74); fr(k, yel, 6, -74, 4, 74); fr(k, red, -34, -78, 48, 6);
      fp(k, mix(C.green, C.paper, 0.2), [8, -72, 16, -72, 62, -6, 62, 0, 50, 0]);
      fp(k, red, [-34, -78, -10, -104, 14, -78]);
      for (let y = -62; y < -6; y += 12) fr(k, yel, -30, y, 8, 2.4);
      fr(k, it.prop, 72, -14, 30, 14);
      fr(k, yel, 85, -50, 4, 50);
      fp(k, red, [66, -50, 87, -70, 108, -50]);
      fr(k, C.white, 78, -60, 4, 4); fr(k, C.white, 92, -56, 4, 4);
    },
  },
  parkedCar: {
    w: 180, h: 56,
    draw(k, it) { parked(k, 0, it.car, it.lux ? { glass: '#6F7F88' } : null); },
  },
  parkedVan: {
    w: 210, h: 76,
    draw(k, it) {
      const tyre = '#4A443E';
      fp(k, it.car, [-88, -10, -88, -68, 36, -68, 36, -52, 60, -52, 76, -34, 86, -30, 86, -10]);
      fr(k, shade(it.car, -0.14), -88, -16, 174, 6);
      fp(k, '#A9BCC4', [42, -48, 58, -48, 70, -34, 42, -34]);
      fr(k, shade(it.car, -0.18), 36, -52, 1.6, 40);
      for (const wx of [-56, 56]) { fp(k, tyre, [wx - 12, -10, wx - 8, -20, wx, -22, wx + 8, -20, wx + 12, -10, wx + 8, 0, wx - 8, 0]); fr(k, shade(it.car, 0.2), wx - 4, -14, 8, 8); }
      T(k, 'ГРУЗОПЕРЕВОЗКИ', -26, -44, { size: 12, maxW: 104, color: shade(it.car, -0.4) });
      fr(k, LIT, 83, -28, 3, 6);
    },
  },
  fountain: {   // фонтан ВДНХ: чаша, золотые фигуры, струи
    w: 200, loud: true, h: 150,
    draw(k, it) {
      const stone = mix(C.concrete, C.paper, 0.3), gold = mix(C.yellow, C.paper, 0.15), water = mix(C.blue, C.paper, 0.3);
      fp(k, water, [-70, -26, -52, -110, -44, -110, -40, -26]);
      fp(k, water, [40, -26, 44, -110, 52, -110, 70, -26]);
      fp(k, water, [-8, -60, -3, -140, 3, -140, 8, -60]);
      fp(k, stone, [-90, 0, -96, -22, 96, -22, 90, 0]);
      fr(k, shade(stone, -0.12), -98, -28, 196, 7);
      fr(k, stone, -22, -58, 44, 32);
      for (const x of [-60, -34, 34, 60]) fp(k, gold, [x - 5, -28, x - 4, -48, x, -56, x + 4, -48, x + 5, -28]);
      fp(k, gold, [-8, -58, -6, -80, 0, -90, 6, -80, 8, -58]);
    },
  },
  flower: {     // клумба «Московское лето»: каждый год новая плитка вокруг
    w: 130, h: 34,
    draw(k, it) {
      fp(k, mix(C.concrete, C.paper, 0.25), [-58, 0, -62, -14, 62, -14, 58, 0]);
      fp(k, it.leaf, [-56, -14, -50, -22, 50, -22, 56, -14]);
      for (let i = 0; i < 11; i++) fr(k, [C.danger, C.yellow, C.white, mix(C.burgundy, C.paper, 0.2)][H(it.seed, i, 1, 4)], -50 + i * 9.4, -27 + H(it.seed, i, 2, 4), 5, 5);
    },
  },
  yardFence: {  // жёлто-зелёный заборчик: без него двор — не двор
    w: 200, h: 34,
    draw(k, it) {
      const yel = mix(C.yellow, C.paper, 0.12), grn = mix(C.green, C.paper, 0.1);
      for (let i = 0; i < 5; i++) {
        const x = -96 + i * 39, c = i % 2 ? yel : grn;
        fr(k, c, x, -28, 3, 28); fr(k, c, x + 34, -28, 3, 28);
        fr(k, c, x, -28, 37, 3); fr(k, c, x, -15, 37, 2.6);
        fp(k, c, [x + 3, -15, x + 18.5, -27, x + 34, -15, x + 30, -15, x + 18.5, -23.4, x + 7, -15]);
      }
    },
  },
  trashYard: {  // контейнерная площадка: профлист, баки, диван рядом
    w: 190, h: 76,
    draw(k, it) {
      const sheet = mix(C.green, C.paper, 0.35);
      fr(k, sheet, -86, -66, 150, 66);
      k.fillStyle = shade(sheet, -0.1);
      for (let x = -82; x < 62; x += 8) k.fillRect(x, -66, 1.4, 66);
      fr(k, shade(sheet, -0.2), -90, -70, 158, 5);
      for (const [x, c] of [[-66, mix('#3F74A6', C.paper, 0.25)], [-28, mix(C.cool, C.paper, 0.1)], [10, mix(C.cool, C.paper, 0.1)]]) {
        fr(k, c, x, -40, 32, 36);
        fp(k, shade(c, -0.14), [x - 2, -40, x, -46, x + 18, -49, x + 34, -46, x + 34, -40]);
        fr(k, it.ink, x + 4, -4, 5, 4); fr(k, it.ink, x + 23, -4, 5, 4);
      }
      fp(k, it.ink, [14, -47, 20, -58, 30, -56, 34, -47]);                                // пакет сверху
      fp(k, mix(C.brick, C.paper, 0.3), [66, 0, 66, -22, 72, -34, 94, -34, 94, -18, 90, 0]);   // выброшенное кресло
    },
  },
  crossSign: {  // знак «Пешеходный переход»
    w: 46, h: 160,
    draw(k, it) {
      fr(k, it.prop, -1.6, -150, 3.2, 150);
      fr(k, mix('#2F74C0', C.paper, 0.15), -17, -150, 34, 34);
      fp(k, C.white, [-11, -120, 0, -146, 11, -120]);
      fp(k, C.ink2, [-2, -124, -2, -134, 2, -134, 2, -124]);
      fr(k, C.ink2, -1.6, -139, 3.2, 3.2);
      fr(k, C.yellow, -17, -114, 34, 3);
    },
  },
  heatPipe: {   // теплотрасса: трубы в серебристой изоляции аркой над проездом
    w: 260, h: 150,
    draw(k, it) {
      const pipe = mix(C.cool, C.paper, 0.35), dark = shade(pipe, -0.16);
      for (const dy of [0, 16]) {
        fr(k, pipe, -130, -34 - dy, 62, 12);
        fr(k, pipe, -74, -132 - dy, 12, 110);
        fr(k, pipe, -74, -132 - dy, 148, 12);
        fr(k, pipe, 62, -132 - dy, 12, 110);
        fr(k, pipe, 62, -34 - dy, 68, 12);
        fr(k, dark, -130, -25 - dy, 62, 3); fr(k, dark, -74, -123 - dy, 148, 3); fr(k, dark, 62, -25 - dy, 68, 3);
        k.fillStyle = dark;
        for (let x = -120; x < -74; x += 18) k.fillRect(x, -34 - dy, 1.6, 12);
        for (let x = -60; x < 62; x += 20) k.fillRect(x, -132 - dy, 1.6, 12);
      }
      fr(k, it.ink, -112, -22, 5, 22); fr(k, it.ink, 100, -22, 5, 22);
      fp(k, mix(C.yellow, C.paper, 0.2), [-10, -150, 10, -150, 10, -136, -10, -136]);     // габаритный знак
      T(k, '3,5 м', 0, -142.6, { size: 9, color: C.ink2, maxW: 17 });
    },
  },
  tourists: {   // экскурсия: гид с флажком и группа с рюкзаками
    w: 130, h: 96,
    draw(k, it) {
      const cs = [mix(C.blue, C.paper, 0.25), mix(C.yellow, C.paper, 0.2), mix(C.brick, C.paper, 0.3), mix(C.green, C.paper, 0.25)];
      person(k, -44, cs[0], it.ink, { h: 54 });
      fr(k, it.ink, -37, -92, 1.6, 48);
      fp(k, mix(C.danger, C.paper, 0.15), [-35.4, -92, -18, -86, -35.4, -80]);
      for (let i = 0; i < 4; i++) { const x = -12 + i * 17; person(k, x, cs[(i + 1) % 4], shade(cs[(i + 2) % 4], -0.3), { h: 50 + (i % 2) * 4 }); if (i % 2) fr(k, shade(cs[(i + 1) % 4], -0.2), x + 5, -40, 8, 14); }
    },
  },
  artist: {     // арбатский художник: мольберт, табурет, готовые портреты
    w: 110, h: 86,
    draw(k, it) {
      sl(k, it.ink, 2, [-36, 0, -24, -70]); sl(k, it.ink, 2, [-12, 0, -24, -70]); sl(k, it.ink, 2, [-24, -70, -22, 0]);
      fr(k, C.white, -40, -66, 32, 40);
      fp(k, '#E3BFA0', [-30, -40, -31, -52, -24, -58, -18, -52, -19, -40]);
      fr(k, it.ink, -32, -58, 15, 5);
      person(k, 16, mix(C.burgundy, C.paper, 0.35), it.ink, { h: 54 });
      fp(k, it.ink, [8, -58, 14, -66, 26, -64, 24, -57]);                                  // берет
      for (const [x, c] of [[40, C.white], [48, mix(C.cream, C.paper, 0.2)]]) { fr(k, c, x, -30, 14, 20); fr(k, it.prop, x + 3, -26, 8, 9); }
    },
  },
  terrace: {    // летняя веранда ресторана: зонты, кадки, гости
    w: 210, h: 120,
    draw(k, it) {
      const wood = mix(C.kraft, C.paper, 0.3), cloth = mix(C.burgundy, C.paper, 0.3);
      fr(k, wood, -100, -8, 200, 8);
      for (const x of [-54, 46]) {
        fr(k, it.ink, x - 1.2, -100, 2.4, 92);
        fp(k, cloth, [x - 46, -92, x, -112, x + 46, -92, x + 40, -88, x - 40, -88]);
        fp(k, C.white, [x - 16, -92, x, -112, x + 16, -92, x + 13, -88, x - 13, -88]);
        fr(k, it.ink, x - 15, -34, 30, 2.6); fr(k, it.ink, x - 1.2, -34, 2.4, 26);
        person(k, x - 26, mix(C.cool, C.paper, 0.2), it.ink, { h: 46 });
        person(k, x + 26, mix(C.cream, C.paper, 0.1), it.ink, { h: 46 });
      }
      for (const x of [-98, 84]) { fr(k, mix(C.concrete, C.paper, 0.2), x, -26, 14, 18); fp(k, it.leaf, [x - 4, -26, x + 2, -44, x + 7, -36, x + 12, -46, x + 18, -26]); }
      k.fillStyle = it.ink;
      for (let x = -100; x < 100; x += 12) k.fillRect(x, -20, 1.4, 12);
      fr(k, it.ink, -100, -21, 200, 2);
    },
  },
  wirePoles: {  // воздушная линия во дворе: две бетонные опоры с подкосами, провода и голуби
    w: 380, h: 214,
    draw(k, it) {
      const X = 150, top = -204, wire = it.ink;
      for (const side of [-1, 1]) {
        const x = side * X;
        fp(k, it.trunk, [x - side * 34, 0, x - side * 28, 0, x + side * 1, -118, x - side * 3, -122]);    // подкос
        fp(k, it.trunk, [x - 4.5, 0, x + 4.5, 0, x + 2.6, top, x - 2.6, top]);                            // стойка
        fr(k, it.ink, x - 5.5, -12, 11, 12);
        fr(k, it.ink, x - 17, top + 9, 34, 3.2);                                                          // траверса
        for (const dx of [-14, 0, 14]) fr(k, C.white, x + dx - 1.6, top + 3, 3.2, 6);                     // изоляторы
      }
      fp(k, it.trunk, [X - 2, -168, X - 30, -176, X - 30, -172, X - 2, -162]);                            // светильник на опоре
      fp(k, it.ink, [X - 44, -178, X - 24, -177, X - 24, -171, X - 44, -172]);
      fr(k, LIT, X - 42, -172, 15, 2.4);
      k.strokeStyle = wire;
      k.lineWidth = 1.5;
      k.beginPath();
      [-14, 0, 14].forEach((dx, i) => { k.moveTo(-X + dx, top + 3); k.quadraticCurveTo(dx, top + 44 + i * 5, X + dx, top + 3); });
      k.stroke();
      // голуби сидят на среднем проводе: высоту берём с той же кривой
      const sag = t => top + 3 + 2 * t * (1 - t) * 41;
      for (const t of [0.34, 0.4, 0.61]) {
        const px = -X + 2 * X * t, y = sag(t);
        fp(k, it.ink, [px - 8, y, px - 3, y - 8, px + 5, y - 6.4, px + 11, y + 1.6]);
        fr(k, it.ink, px - 10, y - 12.4, 6, 6);
      }
    },
  },
  garlandLamps: { // флажки между двумя фонарями-торшерами: праздник у города всегда
    w: 290, h: 170,
    draw(k, it) {
      const X = 120;
      for (const x of [-X, X]) { k.save(); k.translate(x, 0); PropArt.lampOld.draw(k, it); k.restore(); }
      const y0 = -121, drop = 38;
      k.strokeStyle = it.ink;
      k.lineWidth = 1.4;
      k.beginPath();
      k.moveTo(-X + 2, y0);
      k.quadraticCurveTo(0, y0 + drop * 2, X - 2, y0);
      k.stroke();
      const tones = [mix(C.yellow, it.sky, 0.3), mix(C.danger, it.sky, 0.42), C.white, mix(C.blue, it.sky, 0.25)];
      for (let i = 1; i < 10; i++) {
        const t = i / 10, x = -X + 2 * X * t, y = y0 + 4 * t * (1 - t) * drop + 0.6;
        fp(k, tones[i % 4], [x - 5, y, x + 5, y, x + H(it.seed, i, 1, 3) - 1, y + 11]);
      }
    },
  },
  bollards: {   // гранитные шары и столбики: чтобы не парковались
    w: 150, h: 26,
    draw(k, it) {
      const stone = mix(C.concrete, C.paper, 0.25);
      for (let i = 0; i < 5; i++) { const x = -62 + i * 31; if (i % 2) fp(k, stone, [x - 8, 0, x - 10, -8, x - 6, -15, x + 6, -15, x + 10, -8, x + 8, 0]); else { fr(k, it.ink, x - 2.6, -24, 5.2, 24); fr(k, C.white, x - 2.6, -20, 5.2, 3); } }
    },
  },
};

/* ───────────────────────────── ПЕРЕДНИЙ ПЛАН ─────────────────────────────
   Ближе героя, но только над игровой зоной: провода, фонари на растяжках, гирлянды.
   y — координата от верха экрана, c — тёмный тон района. */
/* ───────────────────────────── ДОРОГА ─────────────────────────────
   Машины в нижней полосе — тёмные силуэты чуть светлее асфальта: это не препятствия. */
function drawTraffic(ctx, t) {
  const dir = t.v < 0 ? -1 : 1;                  // куда смотрит
  const body = t.color, glass = '#5B5650';
  ctx.save();
  ctx.translate(t.x, t.y);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.fillStyle = body;
  ctx.beginPath();
  if (t.kind === 'bus') poly(ctx, [-110, -8, -110, -58, -104, -64, 104, -64, 110, -54, 110, -8]);
  else if (t.kind === 'van') poly(ctx, [-70, -8, -70, -58, 34, -58, 34, -46, 54, -46, 66, -30, 70, -28, 70, -8]);
  else if (t.kind === 'courier') { poly(ctx, [-16, -8, -16, -14, 14, -14, 14, -8]); ctx.rect(-2, -44, 9, 30); ctx.rect(-14, -48, 15, 18); ctx.rect(-1, -56, 10, 10); }
  else poly(ctx, [-58, -8, -58, -20, -50, -25, -30, -27, -18, -40, 26, -40, 38, -28, 54, -26, 58, -20, 58, -8]);
  ctx.fill();
  ctx.fillStyle = glass;
  if (t.kind === 'bus') { for (let x = -98; x < 96; x += 28) ctx.fillRect(x, -56, 22, 18); }
  else if (t.kind === 'van') { ctx.beginPath(); poly(ctx, [40, -42, 52, -42, 62, -30, 40, -30]); ctx.fill(); }
  else if (t.kind === 'car' || t.kind === 'taxi') { ctx.beginPath(); poly(ctx, [-26, -28, -16, -37, 24, -37, 33, -28]); ctx.fill(); }
  ctx.fillStyle = '#14110E';
  const wheel = (x, r) => { ctx.beginPath(); poly(ctx, [x - r, -8, x - r * 0.7, -8 - r * 0.8, x, -8 - r, x + r * 0.7, -8 - r * 0.8, x + r, -8, x + r * 0.7, -8 + r * 0.8, x, -8 + r, x - r * 0.7, -8 + r * 0.8]); ctx.fill(); };
  if (t.kind === 'bus') { wheel(-72, 10); wheel(70, 10); }
  else if (t.kind === 'van') { wheel(-44, 9.5); wheel(46, 9.5); }
  else if (t.kind === 'courier') { wheel(-14, 5); wheel(13, 5); }
  else { wheel(-34, 9); wheel(34, 9); }
  if (t.kind === 'taxi') { ctx.fillStyle = C.yellow; ctx.fillRect(-8, -46, 16, 6); }
  if (t.kind === 'bus') { ctx.fillStyle = '#2F74C0'; ctx.fillRect(-110, -30, 220, 4); }
  if (t.kind !== 'courier') {
    const front = t.kind === 'bus' ? 110 : t.kind === 'van' ? 70 : 58;
    ctx.fillStyle = LIT;
    ctx.fillRect(front - 4, -23, 4, 5);
    ctx.fillStyle = C.danger;
    ctx.fillRect(-front, -23, 3, 5);
  }
  ctx.restore();
}

Object.assign(K.CityArt, { SPECIAL, PropArt, drawTraffic, person, parked });

})(window.KTM = window.KTM || {});
