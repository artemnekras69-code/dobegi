/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — вывески

   Пародийные бренды одного города. У каждой вывески своя форма, своя пара цветов,
   свой способ набрать название и одна маленькая шутка — но все они нарисованы
   одной рукой: те же рубленые формы, тот же контур, одно шрифтовое семейство.

   Вывеска рисуется в рамку w×h от левого верхнего угла и может чуть вылезать
   за неё (птица на краю, корона, стрелка компаса).

     K.sign(ctx, name, x, y, w, h, o)    вывеска-препятствие или надпись на борту (o.plain)
     K.fascia(ctx, name, x, y, w, h)     вывеска над витриной — фон, контур тонкий
     K.adSign(ctx, name, line, x, y, w, h)  рекламный плакат: бренд и строчка
     K.BRANDS[name]                      { cat, bg, fg, like, ads }
     K.brandsOf('bank', 'cafe')          названия по типам заведений

   Типы заведений (cat) — от них зависит витрина: grocery · alcohol · pvz · cafe ·
   fastfood · bank · pharmacy · retail · telecom · realty · developer.
   taxi · delivery · carsharing — не заведения: живут на бортах машин и на щитах.
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, mix } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors, ink = K.ink;

const WHITE = C.white, INK = C.ink, YEL = C.yellow;
const RED = '#D8412B', GREEN = '#3E8F56', DKGREEN = '#2B6243', BLUE = '#2F74C0';
const ORANGE = '#EC8A2D', PINK = '#E8508A', PURPLE = '#7A5BC0', MAGENTA = '#A23FA0', CREAM = C.cream, BROWN = '#7A4E30';

/* Кисть: одни и те же формы для вывески-препятствия (чёрный контур) и для фона (тонкий, в тон) */
function brush(k, mode) {
  const bg = mode === 'bg', plain = mode === 'plain';
  const tone = bg ? c => (c[0] === '#' ? mix(c, C.paper, 0.16) : c) : c => c;
  const lw = bg ? 1.2 : plain ? 0 : 2.2;
  const line = bg ? 'rgba(46,41,37,.5)' : INK, soft = bg || plain;
  return {
    k, bg, plain,
    /* форма с контуром */
    P(pts, fill, o) { return ink.poly(k, pts, Object.assign({ fill: tone(fill), lw, line, off: 0, j: soft ? 0.15 : 0.4, press: soft ? 0 : undefined }, o)); },
    /* плоская деталь */
    F(pts, fill) { return ink.poly(k, pts, { fill: tone(fill), lw: 0, off: 0, j: 0 }); },
    D(x, y, r, fill, o) { return ink.disc(k, x, y, r, Object.assign({ fill: tone(fill), lw, line, off: 0, press: soft ? 0 : undefined }, o)); },
    T(str, x, y, o) { return ink.text(k, str, x, y, Object.assign({}, o, { color: tone(o.color || WHITE) })); },
    R(x, y, w, h, fill) { k.fillStyle = tone(fill); k.fillRect(x, y, w, h); },
  };
}
const box = (w, h, cut) => cut ? [cut, 0, w - cut, 0, w, cut, w, h - cut, w - cut, h, cut, h, 0, h - cut, 0, cut] : [0, 0, w, 0, w, h, 0, h];

const B = {};
function def(name, o) { B[name] = Object.assign({ name, ads: [] }, o); }

/* ───────────────────────── ПРОДУКТЫ ───────────────────────── */
def('Шестёрочка', {       // на одну больше, чем нужно
  like: 'Пятёрочка', cat: 'grocery', bg: RED, fg: WHITE, ads: ['На одну больше', 'Цены как в прошлом году*'],
  draw(b, w, h) {
    b.P([h * 0.5, h * 0.06, w, h * 0.06, w, h * 0.94, h * 0.5, h * 0.94], RED);
    b.T('ШЕСТЁРОЧКА', h * 1.2 + (w - h * 1.3) / 2, h * 0.53, { size: h * 0.66, maxW: w - h * 1.5, skew: 0.12 });
    b.D(h * 0.58, h * 0.5, h * 0.62, GREEN, { n: 10 });
    b.T('6', h * 0.58, h * 0.55, { size: h * 0.98 });
    b.P([h * 0.92, -h * 0.14, h * 1.5, -h * 0.2, h * 1.46, h * 0.24, h * 0.9, h * 0.26], YEL, { lw: b.bg ? 0.8 : b.plain ? 0 : 1.4 });      // ценник «+1»
    b.T('+1', h * 1.19, h * 0.05, { size: h * 0.36, color: INK });
  },
});
def('Компас', {           // стрелка всегда показывает на скидку
  like: 'Магнит', cat: 'grocery', bg: WHITE, fg: RED, ads: ['Притягивает к кассе', 'Скидка там, где тебя нет'],
  draw(b, w, h) {
    b.P(box(w, h, h * 0.14), WHITE);
    b.R(0, h * 0.8, w, h * 0.2, RED);
    const cx = h * 0.66;
    b.T('КОМПАС', cx + h * 0.56 + (w - cx - h * 0.8) / 2, h * 0.44, { size: h * 0.7, maxW: w - cx - h * 0.9, color: RED });
    b.D(cx, h * 0.44, h * 0.5, WHITE, { n: 9 });
    b.F([cx - h * 0.1, h * 0.44, cx + h * 0.24, -h * 0.26, cx + h * 0.1, h * 0.44], RED);                    // стрелка вылезает за край
    b.F([cx - h * 0.1, h * 0.44, cx - h * 0.2, h * 0.9, cx + h * 0.1, h * 0.44], INK);
  },
});
def('Перекос', {          // вывеску повесили криво — и так сойдёт
  like: 'Перекрёсток', cat: 'grocery', bg: GREEN, fg: WHITE, ads: ['Всё чуть-чуть не так', 'Свежее. Было'],
  draw(b, w, h) {
    b.k.save();
    b.k.translate(w / 2, h / 2);
    b.k.rotate(-0.045);
    b.k.translate(-w / 2, -h / 2);
    b.P(box(w, h, 0), GREEN);
    const cx = h * 0.62, cy = h * 0.5, r = h * 0.22;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1]]) b.F([cx + dx * r * 0.1, cy + dy * r * 0.1, cx + dx * r * 1.5, cy + dy * r * 0.3, cx + dx * r * 1.5, cy + dy * r * 1.5, cx + dx * r * 0.3, cy + dy * r * 1.5], WHITE);
    b.F([cx + r * 0.3, cy + r * 0.5, cx + r * 1.9, cy + r * 1.3, cx + r * 1.1, cy + r * 2.4, cx + r * 0.1, cy + r * 1.4], WHITE);      // четвёртый лист отвалился
    const tx = h * 1.14, tw = w - tx - h * 0.2;
    'ПЕРЕКОС'.split('').forEach((ch, i) => b.T(ch, tx + tw * (i + 0.5) / 7, h * (0.4 + i * 0.03), { size: h * 0.7, maxW: tw / 7 }));
    b.k.restore();
  },
});
def('Пыжик', {            // птичка в пыжиковой шапке
  like: 'Чижик', cat: 'grocery', bg: YEL, fg: DKGREEN, ads: ['Цены не кусаются. Шапка — да'],
  draw(b, w, h) {
    b.P(box(w, h, h * 0.1), YEL);
    b.T('пыжик', w * 0.42, h * 0.5, { size: h * 0.84, maxW: w * 0.62, color: DKGREEN, font: FONT.text, weight: 800 });
    const x = w - h * 0.74, y = -h * 0.02, lw = b.bg ? 0.9 : b.plain ? 0 : 1.6;         // птица сидит на краю
    b.P([x - h * 0.3, y + h * 0.36, x - h * 0.24, y, x + h * 0.1, y - h * 0.12, x + h * 0.4, y + h * 0.06, x + h * 0.4, y + h * 0.36], GREEN, { lw });
    b.F([x + h * 0.4, y + h * 0.1, x + h * 0.62, y + h * 0.18, x + h * 0.4, y + h * 0.24], ORANGE);
    b.P([x - h * 0.34, y - h * 0.04, x - h * 0.3, y - h * 0.34, x + h * 0.3, y - h * 0.38, x + h * 0.36, y - h * 0.08], BROWN, { lw });   // шапка
    b.R(x + h * 0.16, y + h * 0.02, h * 0.08, h * 0.08, INK);
  },
});
def('ВкусВилли', {        // лист салата наколот на вилку
  like: 'ВкусВилл', cat: 'grocery', bg: WHITE, fg: GREEN, ads: ['Полезно. Дорого. Полезно', 'Без сахара и без сдачи'],
  draw(b, w, h) {
    b.P(box(w, h, h * 0.5), WHITE);
    b.T('ВкусВилли', w * 0.44, h * 0.52, { size: h * 0.7, maxW: w * 0.66, color: GREEN, font: FONT.text, weight: 800 });
    const x = w - h * 0.7;
    b.R(x - h * 0.03, h * 0.1, h * 0.06, h * 0.9, INK);                         // вилка
    for (const dx of [-0.16, 0, 0.16]) b.R(x + h * dx - h * 0.025, -h * 0.26, h * 0.05, h * 0.4, INK);
    b.R(x - h * 0.19, h * 0.08, h * 0.38, h * 0.06, INK);
    b.F([x - h * 0.34, h * 0.02, x - h * 0.1, -h * 0.3, x + h * 0.32, -h * 0.18, x + h * 0.2, h * 0.08], GREEN);
  },
});
def('Белое & Красное', {  // слова перепутали половины
  like: 'Красное & Белое', cat: 'alcohol', bg: RED, fg: WHITE, ads: ['До 23:00. После — как повезёт'],
  draw(b, w, h) {
    b.P(box(w, h, 0), WHITE);
    b.F([w / 2, 0, w, 0, w, h, w / 2, h], RED);
    const half = w / 2 - h * 0.5;
    b.T('БЕЛОЕ', half / 2 + h * 0.06, h * 0.53, { size: h * 0.64, maxW: half - h * 0.1, color: RED });
    b.T('КРАСНОЕ', w - half / 2 - h * 0.06, h * 0.53, { size: h * 0.64, maxW: half - h * 0.1 });
    const pts = [];                                                           // пробка с зубчиками
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = h * (i % 2 ? 0.5 : 0.62); pts.push(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    b.P(pts, INK, { lw: 0 });
    b.T('&', w / 2, h * 0.55, { size: h * 0.8 });
  },
});

/* ───────────────────────── ПУНКТЫ ВЫДАЧИ ───────────────────────── */
def('Дикие ягоды', {      // одну ягоду уже надкусили
  like: 'Wildberries', cat: 'pvz', bg: MAGENTA, fg: WHITE, ads: ['Очередь — тоже товар', 'Примерочная занята'],
  draw(b, w, h) {
    b.P(box(w, h, 0), PURPLE);
    b.F([0, 0, w * 0.62, 0, w * 0.38, h, 0, h], MAGENTA);
    const mark = w < h * 2.4, x = mark ? w / 2 : h * 0.62, r = h * 0.26;
    b.D(x - r * 0.7, h * 0.58, r, WHITE, { lw: 0, n: 8 });
    b.D(x + r * 0.8, h * 0.52, r, WHITE, { lw: 0, n: 8 });
    b.F([x + r * 1.1, h * 0.3, x + r * 1.9, h * 0.34, x + r * 1.7, h * 0.62], mark ? PURPLE : MAGENTA);       // укус
    b.F([x - r * 0.4, h * 0.3, x + r * 0.2, h * 0.06, x + r * 0.6, h * 0.3], '#CFE8B0');
    if (!mark) b.T('дикие ягоды', h * 1.14 + (w - h * 1.3) / 2, h * 0.53, { size: h * 0.6, maxW: w - h * 1.44, font: FONT.text, weight: 800 });
  },
});
def('СДАЙ', {             // посылку. Или квартиру
  like: 'СДЭК', cat: 'pvz', bg: GREEN, fg: WHITE, ads: ['Сдай посылку. И квартиру'],
  draw(b, w, h) {
    b.P([0, 0, w - h * 0.5, 0, w, h * 0.5, w - h * 0.5, h, 0, h], GREEN);         // стрелка-указатель
    b.T('СДАЙ', w * 0.52, h * 0.53, { size: h * 0.8, maxW: w * 0.5, skew: 0.2 });
    const x = h * 0.2, s = h * 0.56;
    b.F([x, h * 0.3, x + s * 0.5, h * 0.16, x + s, h * 0.3, x + s, h * 0.72, x + s * 0.5, h * 0.86, x, h * 0.72], WHITE);
    b.F([x + s * 0.5, h * 0.44, x + s, h * 0.3, x + s, h * 0.72, x + s * 0.5, h * 0.86], '#CFE8B0');
    b.R(x + s * 0.46, h * 0.44, s * 0.08, h * 0.42, GREEN);
  },
});
def('Обзвон', {           // пункт выдачи, из которого вам перезвонят
  like: 'Ozon', cat: 'pvz', bg: BLUE, fg: WHITE, ads: ['Вам перезвонят. Наверное'],
  draw(b, w, h) {
    b.P(box(w, h, h * 0.3), BLUE);
    b.T('ОБЗВОН', w * 0.56, h * 0.53, { size: h * 0.72, maxW: w * 0.62 });
    const x = h * 0.56;
    b.D(x, h * 0.5, h * 0.36, PINK, { lw: 0, n: 9 });
    b.F([x - h * 0.2, h * 0.3, x - h * 0.06, h * 0.26, x + h * 0.02, h * 0.42, x - h * 0.06, h * 0.5, x + h * 0.06, h * 0.62, x + h * 0.16, h * 0.56, x + h * 0.24, h * 0.7, x + h * 0.1, h * 0.78, x - h * 0.16, h * 0.56], WHITE);   // трубка
  },
});

/* ───────────────────────── ЕДА И КОФЕ ───────────────────────── */
def('Вкусно и запятая', { // точку так и не поставили
  like: 'Вкусно — и точка', cat: 'fastfood', bg: DKGREEN, fg: WHITE, ads: ['Продолжение следует,', 'Свободная касса,'],
  draw(b, w, h) {
    b.P(box(w, h, 0), DKGREEN);
    b.T('Вкусно — и запятая', h * 1.3 + (w - h * 1.5) / 2, h * 0.53, { size: h * 0.56, maxW: w - h * 1.6, font: FONT.text, weight: 800 });
    const x = h * 0.4;
    b.F([x, h * 0.2, x + h * 0.14, h * 0.2, x + h * 0.24, h * 0.72, x + h * 0.1, h * 0.72], ORANGE);          // две картошки
    b.F([x + h * 0.26, h * 0.14, x + h * 0.4, h * 0.14, x + h * 0.4, h * 0.72, x + h * 0.26, h * 0.72], ORANGE);
    b.P([x + h * 0.5, h * 0.5, x + h * 0.8, h * 0.5, x + h * 0.8, h * 0.84, x + h * 0.6, h * 1.22, x + h * 0.48, h * 1.12, x + h * 0.6, h * 0.84, x + h * 0.5, h * 0.84], YEL, { lw: b.bg ? 0.8 : b.plain ? 0 : 1.4 });   // запятая свисает
  },
});
def('Бургер Царь', {      // верхняя булка в шапке Мономаха
  like: 'Burger King', cat: 'fastfood', bg: CREAM, fg: RED, ads: ['Царский размер, холопская цена*'],
  draw(b, w, h) {
    const cx = w / 2, bw = Math.min(w, h * 3.4), x0 = cx - bw / 2, x1 = cx + bw / 2;
    b.P([x0 + h * 0.2, h * 0.34, x0 + h * 0.36, h * 0.06, x1 - h * 0.36, h * 0.06, x1 - h * 0.2, h * 0.34], ORANGE);
    b.P([x0 + h * 0.2, h * 0.7, x1 - h * 0.2, h * 0.7, x1 - h * 0.36, h * 0.98, x0 + h * 0.36, h * 0.98], ORANGE);
    b.P([x0, h * 0.32, x1, h * 0.32, x1, h * 0.72, x0, h * 0.72], CREAM);
    b.T('БУРГЕР ЦАРЬ', cx, h * 0.54, { size: h * 0.42, maxW: bw - h * 0.3, color: RED });
    // шапка Мономаха: мех, золото, крестик
    b.F([cx - h * 0.34, h * 0.06, cx - h * 0.24, -h * 0.22, cx, -h * 0.34, cx + h * 0.24, -h * 0.22, cx + h * 0.34, h * 0.06], YEL);
    b.R(cx - h * 0.4, -h * 0.02, h * 0.8, h * 0.12, BROWN);
    b.R(cx - h * 0.03, -h * 0.52, h * 0.06, h * 0.2, YEL); b.R(cx - h * 0.1, -h * 0.46, h * 0.2, h * 0.06, YEL);
  },
});
def('Додо Дом', {         // кусок пиццы вместо крыши
  like: 'Додо Пицца', cat: 'fastfood', bg: ORANGE, fg: WHITE, ads: ['Пицца за 30 минут. Квартира — никогда'],
  draw(b, w, h) {
    b.P(box(w, h, 0), ORANGE);
    b.T('ДОДО ДОМ', (w - h * 1.5) / 2, h * 0.54, { size: h * 0.7, maxW: w - h * 1.8 });
    const x = w - h * 0.76;
    b.P([x - h * 0.62, h * 0.3, x, -h * 0.4, x + h * 0.62, h * 0.3], YEL, { lw: b.bg ? 0.9 : b.plain ? 0 : 1.6 });       // крыша-пицца
    b.F([x - h * 0.2, h * 0.02, x - h * 0.06, -h * 0.06, x - h * 0.04, h * 0.12], RED);
    b.F([x + h * 0.14, h * 0.16, x + h * 0.3, h * 0.12, x + h * 0.24, h * 0.26], RED);
    b.R(x - h * 0.36, h * 0.3, h * 0.72, h * 0.56, WHITE);
    b.R(x - h * 0.1, h * 0.5, h * 0.2, h * 0.36, ORANGE);
  },
});
def('StarБакс', {         // в кружке вместо сирены — доллар
  like: 'Starbucks', cat: 'cafe', bg: DKGREEN, fg: WHITE, ads: ['Кофе по цене аренды', 'Имя на стакане — с ошибкой'],
  draw(b, w, h) {
    const r = h * 0.66, cx = r * 0.9;
    b.P([cx, h * 0.14, w, h * 0.14, w, h * 0.86, cx, h * 0.86], DKGREEN);
    b.T('StarБакс', cx + r + (w - cx - r) / 2 - h * 0.06, h * 0.52, { size: h * 0.56, maxW: w - cx - r - h * 0.2, font: FONT.text, weight: 800 });
    b.D(cx, h * 0.5, r, DKGREEN, { n: 12 });
    b.D(cx, h * 0.5, r * 0.72, WHITE, { lw: 0, n: 12 });
    b.T('$', cx, h * 0.54, { size: r * 1.2, color: DKGREEN });
    const s = h * 0.1;                                                         // звёздочка на ободке
    b.F([cx, h * 0.5 - r * 0.98, cx + s, h * 0.5 - r * 0.8, cx, h * 0.5 - r * 0.72, cx - s, h * 0.5 - r * 0.8], WHITE);
  },
});
def('Кофиксцен', {        // цена одна, но каждый день новая
  like: 'Cofix', cat: 'cafe', bg: '#B8322A', fg: WHITE, ads: ['Одна цена на всё. Сегодня — эта'],
  draw(b, w, h) {
    b.P(box(w, h, h * 0.18), '#B8322A');
    b.T('кофиксцен', w * 0.42, h * 0.5, { size: h * 0.74, maxW: w * 0.6, font: FONT.text, weight: 800 });
    const x = w - h * 0.8;
    b.P([x - h * 0.3, h * 0.04, x + h * 0.3, h * 0.04, x + h * 0.22, h * 0.84, x - h * 0.22, h * 0.84], WHITE, { lw: b.bg ? 0.9 : b.plain ? 0 : 1.5 });    // стакан
    b.R(x - h * 0.34, -h * 0.02, h * 0.68, h * 0.12, INK);
    b.T('60', x, h * 0.46, { size: h * 0.36, color: INK });
    b.R(x - h * 0.22, h * 0.42, h * 0.44, h * 0.06, RED);                      // цену зачеркнули
    b.F([x - h * 0.12, -h * 0.1, x - h * 0.04, -h * 0.3, x + h * 0.02, -h * 0.14, x + h * 0.1, -h * 0.36, x + h * 0.14, -h * 0.1], WHITE);   // пар
  },
});
def('Грабёж', {           // ресторан русской кухни и русских цен
  like: 'Грабли', cat: 'cafe', bg: DKGREEN, fg: CREAM, ads: ['Бизнес-ланч. Бизнеса не останется'],
  draw(b, w, h) {
    b.P(box(w, h, 0), DKGREEN);
    b.R(h * 0.12, h * 0.1, w - h * 0.24, h * 0.05, CREAM); b.R(h * 0.12, h * 0.85, w - h * 0.24, h * 0.05, CREAM);
    b.T('Грабёж', w * 0.44, h * 0.52, { size: h * 0.66, maxW: w * 0.6, color: CREAM, italic: true });
    const x = w - h * 0.8;                                                     // грабли торчат над вывеской
    b.R(x - h * 0.035, -h * 0.1, h * 0.07, h * 0.94, CREAM);
    b.R(x - h * 0.3, -h * 0.16, h * 0.6, h * 0.08, CREAM);
    for (let i = 0; i < 5; i++) b.R(x - h * 0.3 + i * h * 0.135, -h * 0.34, h * 0.05, h * 0.2, CREAM);
  },
});

/* ───────────────────────── НЕДВИЖИМОСТЬ ───────────────────────── */
def('АвиСдано', {         // поверх логотипа — штамп
  like: 'Авито', cat: 'realty', bg: WHITE, fg: INK, ads: ['Уже сдано', 'Агентам не звонить. Агент'],
  draw(b, w, h) {
    b.P(box(w, h, 0), WHITE);
    const x = h * 0.2;
    b.D(x + h * 0.2, h * 0.36, h * 0.2, BLUE, { lw: 0, n: 7 });
    b.D(x + h * 0.56, h * 0.3, h * 0.13, GREEN, { lw: 0, n: 7 });
    b.D(x + h * 0.2, h * 0.74, h * 0.12, RED, { lw: 0, n: 7 });
    b.D(x + h * 0.52, h * 0.66, h * 0.19, PURPLE, { lw: 0, n: 7 });
    b.T('АвиСдано', h * 1.0 + (w - h * 1.7) / 2, h * 0.56, { size: h * 0.62, maxW: w - h * 1.9, color: INK, font: FONT.text, weight: 800 });
    b.k.save();                                                                // штамп «СДАНО» в углу
    b.k.translate(w - h * 0.56, h * 0.34);
    b.k.rotate(-0.24);
    b.k.lineWidth = Math.max(0.7, h * 0.05); b.k.strokeStyle = RED;
    b.k.strokeRect(-h * 0.54, -h * 0.18, h * 1.08, h * 0.36);
    b.T('СДАНО', 0, h * 0.02, { size: h * 0.27, color: RED, maxW: h * 0.96 });
    b.k.restore();
  },
});
def('Домтык', {           // тык — и ты в ипотеке
  like: 'Домклик', cat: 'realty', bg: '#2E2925', fg: WHITE, ads: ['Тык — и в ипотеке', 'Ипотека 29,9%'],
  draw(b, w, h) {
    b.P([h * 0.7, h * 0.1, w, h * 0.1, w, h * 0.9, h * 0.7, h * 0.9], '#2E2925');
    b.T('ДОМТЫК', h * 1.4 + (w - h * 1.5) / 2, h * 0.53, { size: h * 0.62, maxW: w - h * 1.7 });
    b.P([0, h, 0, h * 0.34, h * 0.66, -h * 0.2, h * 1.32, h * 0.34, h * 1.32, h], '#8BC34A');         // домик
    b.F([h * 0.5, h * 0.3, h * 0.5, h * 0.84, h * 0.64, h * 0.7, h * 0.76, h * 0.94, h * 0.86, h * 0.88, h * 0.76, h * 0.64, h * 0.94, h * 0.62], INK);   // курсор
  },
});
def('ЦИАНЧИК', {          // маленький, но комиссия взрослая
  like: 'ЦИАН', cat: 'realty', bg: BLUE, fg: WHITE, ads: ['Актуально?', 'Фото соответствует*'],
  draw(b, w, h) {
    b.P(box(w, h, 0), BLUE);
    b.F([h * 0.2, h * 0.5, h * 0.62, h * 0.12, h * 1.04, h * 0.5, h * 0.9, h * 0.5, h * 0.62, h * 0.26, h * 0.34, h * 0.5], WHITE);       // крыша
    b.R(h * 0.34, h * 0.56, h * 0.56, h * 0.3, WHITE);
    b.T('ЦИАН', h * 1.2 + (w - h * 2.9) / 2, h * 0.54, { size: h * 0.74, maxW: w - h * 3 });
    b.k.save();                                                                // «ЧИК» — наклейка, прилепленная криво
    b.k.translate(w - h * 0.9, h * 0.5);
    b.k.rotate(-0.1);
    b.P([-h * 0.74, -h * 0.34, h * 0.74, -h * 0.34, h * 0.74, h * 0.36, -h * 0.74, h * 0.36], YEL, { lw: b.bg ? 0.8 : b.plain ? 0 : 1.4 });
    b.T('ЧИК', 0, h * 0.04, { size: h * 0.6, color: INK, maxW: h * 1.3 });
    b.k.restore();
  },
});
def('Пшик', {             // застройщик: сдача в четвёртом квартале какого-нибудь года
  like: 'ПИК', cat: 'developer', bg: ORANGE, fg: WHITE, ads: ['Сдача в IV квартале*', 'Вид на такой же дом'],
  draw(b, w, h) {
    b.P(box(w, h, 0), ORANGE);
    b.T('ПШИК', w * 0.4, h * 0.54, { size: h * 0.86, maxW: w * 0.56 });
    const x = w - h * 0.9;                                                     // облачко от баллончика
    b.F([x - h * 0.4, h * 0.56, x - h * 0.3, h * 0.26, x - h * 0.04, h * 0.3, x + h * 0.1, h * 0.12, x + h * 0.34, h * 0.26, x + h * 0.5, h * 0.5, x + h * 0.3, h * 0.72, x - h * 0.1, h * 0.76], WHITE);
  },
});

/* ───────────────────────── БАНКИ, СВЯЗЬ, АПТЕКА, ТОВАРЫ ───────────────────────── */
def('Съём', {             // галочка «одобрено» — только не тебе
  like: 'Сбер', cat: 'bank', bg: WHITE, fg: GREEN, ads: ['Ипотека от 29,9%', 'Вклад в хозяина квартиры'],
  draw(b, w, h) {
    b.P(box(w, h, 0), WHITE);
    const cx = h * 0.62;
    b.D(cx, h * 0.5, h * 0.38, GREEN, { lw: 0, n: 10 });
    b.F([cx - h * 0.22, h * 0.48, cx - h * 0.06, h * 0.64, cx + h * 0.34, h * 0.2, cx + h * 0.42, h * 0.3, cx - h * 0.06, h * 0.82, cx - h * 0.3, h * 0.58], WHITE);
    b.T('СЪЁМ', h * 1.14 + (w - h * 1.3) / 2, h * 0.54, { size: h * 0.74, maxW: w - h * 1.5, color: GREEN });
  },
});
def('Т-Залог', {
  like: 'Т-Банк', cat: 'bank', bg: YEL, fg: INK, ads: ['Залог 2 месяца', 'Кэшбэк мелочью'],
  draw(b, w, h) {
    b.P(box(w, h, 0), YEL);
    const x = h * 0.2;
    b.F([x, h * 0.14, x + h * 0.7, h * 0.14, x + h * 0.7, h * 0.56, x + h * 0.35, h * 0.9, x, h * 0.56], INK);        // щит
    b.T('Т', x + h * 0.35, h * 0.46, { size: h * 0.56, color: YEL });
    b.T('Т-ЗАЛОГ', h * 1.1 + (w - h * 1.2) / 2, h * 0.54, { size: h * 0.7, maxW: w - h * 1.4, color: INK });
  },
});
def('Аренда-Банк', {
  like: 'Альфа-Банк', cat: 'bank', bg: WHITE, fg: RED, ads: ['Рассрочка на залог', 'Кредит на комиссию'],
  draw(b, w, h) {
    b.P(box(w, h, 0), WHITE);
    b.T('А', h * 0.56, h * 0.44, { size: h * 0.86, color: RED });
    b.R(h * 0.26, h * 0.8, h * 0.6, h * 0.1, RED);
    b.T('Аренда-Банк', h * 1.1 + (w - h * 1.2) / 2, h * 0.53, { size: h * 0.56, maxW: w - h * 1.36, color: RED, font: FONT.text, weight: 800 });
  },
});
def('36,6 м²', {          // аптека размером со студию
  like: '36,6', cat: 'pharmacy', bg: GREEN, fg: WHITE, ads: ['Успокоительное — у кассы'],
  draw(b, w, h) {
    b.P(box(w, h, 0), GREEN);
    const x = h * 0.2, s = h * 0.62;
    b.R(x, h * 0.19, s, s, WHITE);
    b.R(x + s * 0.38, h * 0.19 + s * 0.14, s * 0.24, s * 0.72, GREEN);
    b.R(x + s * 0.14, h * 0.19 + s * 0.38, s * 0.72, s * 0.24, GREEN);
    b.T('36,6 м²', h * 1.0 + (w - h * 1.1) / 2, h * 0.54, { size: h * 0.74, maxW: w - h * 1.3 });
  },
});
def('Ипотекеа', {         // собери квартиру сам, плати тридцать лет
  like: 'IKEA', cat: 'retail', bg: BLUE, fg: YEL, ads: ['Собери сам. Плати 30 лет'],
  draw(b, w, h) {
    b.P(box(w, h, 0), BLUE);
    const pts = [];
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; pts.push(w / 2 + Math.cos(a) * (w / 2 - h * 0.14), h / 2 + Math.sin(a) * h * 0.4); }
    b.F(pts, YEL);
    b.T('ИПОТЕКЕА', w / 2, h * 0.54, { size: h * 0.62, maxW: w - h * 0.9, color: BLUE, font: FONT.wide, weight: 900 });
  },
});
def('Fix Rent', {         // ценник: всё по одной цене, и она не твоя
  like: 'Fix Price', cat: 'retail', bg: BLUE, fg: WHITE, ads: ['Всё по 99 000', 'Фиксированная. Пока'],
  draw(b, w, h) {
    b.P([h * 0.5, 0, w, 0, w, h, h * 0.5, h, 0, h * 0.5], BLUE);                // ценник с дыркой
    b.D(h * 0.52, h * 0.5, h * 0.13, WHITE, { lw: 0, n: 7 });
    const mid = h * 0.9 + (w - h) * 0.4;
    b.T('Fix', mid - h * 0.12, h * 0.53, { size: h * 0.76, maxW: (w - h) * 0.36, italic: true, align: 'right' });
    b.T('Rent', mid + h * 0.08, h * 0.53, { size: h * 0.76, maxW: (w - h) * 0.5, color: '#B6E04A', italic: true, align: 'left' });
  },
});
def('Мегаквартир', {      // мега — это про цену
  like: 'МегаФон', cat: 'telecom', bg: GREEN, fg: WHITE, ads: ['Евротрёшка 24 м²', 'Мегаскидка: 0%'],
  draw(b, w, h) {
    b.P(box(w, h, 0), GREEN);
    b.F([0, 0, h * 1.1, 0, h * 0.8, h, 0, h], PURPLE);
    b.D(h * 0.4, h * 0.5, h * 0.2, WHITE, { lw: 0, n: 7 });
    b.D(h * 0.72, h * 0.28, h * 0.09, WHITE, { lw: 0, n: 6 });
    b.D(h * 0.7, h * 0.74, h * 0.09, WHITE, { lw: 0, n: 6 });
    b.T('МегаКвартир', h * 1.2 + (w - h * 1.3) / 2, h * 0.53, { size: h * 0.58, maxW: w - h * 1.46, font: FONT.text, weight: 800 });
  },
});
def('Жилайн', {
  like: 'Билайн', cat: 'telecom', bg: '#2E2925', fg: YEL, ads: ['Безлимит на соседей', 'Ловит даже на кухне 4 м²'],
  draw(b, w, h) {
    b.P(box(w, h, 0), '#2E2925');
    const cx = h * 0.6, r = h * 0.38, p = b.D(cx, h * 0.5, r, YEL, { lw: 0, n: 10 });
    b.k.save();
    ink.trace(b.k, p, true);
    b.k.clip();
    b.k.fillStyle = INK;
    for (let i = 0; i < 3; i++) b.k.fillRect(cx - r, h * 0.5 - r + r * 0.28 + i * r * 0.62, r * 2, r * 0.3);
    b.k.restore();
    b.T('ЖИЛАЙН', h * 1.1 + (w - h * 1.2) / 2, h * 0.54, { size: h * 0.7, maxW: w - h * 1.4, color: YEL });
  },
});

/* ───────────────────────── НА КОЛЁСАХ ───────────────────────── */
def('ЯнЕдет', {           // водитель в пути 47 минут
  like: 'Яндекс Go', cat: 'taxi', bg: '#2E2925', fg: WHITE, ads: ['Водитель в пути 47 мин', '15 минут до метро*'],
  draw(b, w, h) {
    b.P(box(w, h, 0), '#2E2925');
    b.T('ЯнЕдет', w / 2, h * 0.46, { size: h * 0.72, maxW: w - h * 0.3, font: FONT.text, weight: 800 });
    b.k.fillStyle = YEL;
    for (let i = 0; i * h * 0.28 < w - h * 0.2; i += 2) b.k.fillRect(i * h * 0.28 + 1, h * 0.84, h * 0.28, h * 0.12);
  },
});
def('Самокатик', {        // привезём за 15 минут. Наверное
  like: 'Самокат', cat: 'delivery', bg: PINK, fg: WHITE, ads: ['15 минут. Наверное', 'Привезём даже залог'],
  draw(b, w, h) {
    b.P([h * 0.3, 0, w, 0, w - h * 0.3, h, 0, h], PINK);                          // плашка летит
    b.T('самокатик', w / 2, h * 0.5, { size: h * 0.72, maxW: w - h * 0.9, font: FONT.text, weight: 800, skew: 0.14 });
  },
});
def('ДелиКвартиру', {     // каршеринг: поминутная аренда всего
  like: 'Делимобиль', cat: 'carsharing', bg: WHITE, fg: GREEN, ads: ['Поминутная аренда комнаты'],
  draw(b, w, h) {
    b.P(box(w, h, 0), WHITE);
    b.T('Дели', w * 0.24, h * 0.53, { size: h * 0.7, maxW: w * 0.36, color: GREEN, font: FONT.text, weight: 800 });
    b.T('Квартиру', w * 0.68, h * 0.53, { size: h * 0.7, maxW: w * 0.56, color: INK, font: FONT.text, weight: 800 });
  },
});

/* ───────────────────────── ОТРИСОВКА ───────────────────────── */
function draw(k, name, x, y, w, h, mode) {
  const brand = B[name];
  k.save();
  k.translate(x, y);
  if (brand) brand.draw(brush(k, mode), w, h);
  else {                                                 // неизвестное название — просто табличка
    const b = brush(k, mode);
    b.P(box(w, h, 0), WHITE);
    b.T(String(name), w / 2, h * 0.53, { size: h * 0.6, maxW: w - h * 0.3, color: INK });
  }
  k.restore();
}

function sign(k, name, x, y, w, h, o) { draw(k, name, x, y, w, h, o && o.plain ? 'plain' : 'ink'); }

/* Вывеска над витриной: короткое название не растягивается на весь фасад */
function fascia(k, name, x, y, w, h) {
  const b = B[name], long = b && b.name.length > 9;
  const sw = Math.min(w, h * (long ? 6.4 : 4.6));
  k.fillStyle = 'rgba(23,19,15,.14)';                    // тёмная полоса фасада под вывеской
  k.fillRect(x, y + h * 0.36, w, h * 0.3);
  draw(k, name, x + (w - sw) / 2, y, sw, h, 'bg');
}

/* Рекламный плакат: бренд сверху, обещание крупно */
function ad(k, name, line, x, y, w, h) {
  const b = B[name] || { bg: WHITE, fg: INK };
  const tall = h > w * 0.9, dark = b.bg !== WHITE;
  k.fillStyle = mix(dark ? b.bg : C.white, C.paper, 0.14);
  k.fillRect(x, y, w, h);
  const sh = tall ? Math.min(h * 0.2, w * 0.3) : h * 0.3, sw = Math.min(w - 8, sh * 4.4);
  draw(k, name, x + (w - sw) / 2, y + (tall ? h * 0.1 : h * 0.12), sw, sh, 'bg');
  const lines = ink.wrap(line, tall ? 3 : 2), ly = y + (tall ? h * 0.62 : h * 0.7), size = tall ? w * 0.2 : h * 0.2;
  lines.forEach((l, i) => ink.text(k, l, x + w / 2, ly + (i - (lines.length - 1) / 2) * size * 1.06, { size, maxW: w - 8, color: dark ? C.white : C.ink2 }));
}

K.BRANDS = B;
K.sign = sign;
K.fascia = fascia;
K.adSign = ad;
K.brandsOf = (...cats) => Object.keys(B).filter(n => cats.includes(B[n].cat));

})(window.KTM = window.KTM || {});
