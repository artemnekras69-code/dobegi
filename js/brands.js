/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — пародийные бренды и их вывески

   Каждая вывеска нарисована «под оригинал»: те же цвета, похожий шрифт,
   узнаваемый знак — но название подменено. like — на кого пародия.

   Поля бренда:
     like   оригинал (для справки)
     cat    тип заведения: от него зависит витрина
            grocery · alcohol · pvz · cafe · fastfood · bank · pharmacy ·
            retail · telecom · realty · developer · taxi
     bg     цвет вывески, fg — цвет текста на ней
     fmt    band — лента на всю ширину магазина, box — отдельный короб
     parts  из чего собрана вывеска: знак и надпись
     ads    рекламные строчки для щитов и остановок

   Добавить свой бренд: скопировать любую запись и поменять название и цвета.
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, rr, dot, poly, mix } = K.util;

/* Шрифты, похожие на фирменные. Подключаются в index.html */
const F = {
  unb: K.FONT.display,
  man: K.FONT.text,
  mont: '"Montserrat", "Arial Black", Arial, sans-serif',      // плотный гротеск
  nun: '"Nunito", "Arial Rounded MT Bold", Arial, sans-serif',  // скруглённый
  osw: '"Oswald", "Arial Narrow", Arial, sans-serif',           // узкий
  play: '"Playfair Display", Georgia, serif',                   // с засечками, курсив
  lob: '"Lobster", "Brush Script MT", cursive',                 // рукописный
};
K.SIGN_FONTS = ['900 20px "Montserrat"', '700 20px "Montserrat"', '900 20px "Nunito"', '600 20px "Oswald"', 'italic 700 20px "Playfair Display"', '400 20px "Lobster"'];

/* ───────────────────────────── ЗНАКИ ─────────────────────────────
   Рисуются вокруг начала координат, s — примерный диаметр. */
function word(k, str, size, color, family, weight, italic) {
  k.font = `${italic ? 'italic ' : ''}${weight || 800} ${size}px ${family}`;
  k.fillStyle = color;
  k.textAlign = 'center';
  k.textBaseline = 'middle';
  k.fillText(str, 0, 0);
}

const I = {
  six(k, s) {               // зелёная шестёрка-листок в белом круге
    k.fillStyle = '#FFFFFF';
    k.beginPath(); k.arc(0, 0, s * 0.5, 0, TAU); k.fill();
    k.save(); k.translate(-s * 0.02, s * 0.04); word(k, '6', s * 0.74, '#00923A', F.nun, 900); k.restore();
    k.fillStyle = '#5BBF2B';
    k.beginPath(); k.ellipse(s * 0.2, -s * 0.24, s * 0.16, s * 0.07, -0.7, 0, TAU); k.fill();
  },
  compass(k, s) {           // стрелка компаса в белом квадрате
    rr(k, -s * 0.46, -s * 0.46, s * 0.92, s * 0.92, s * 0.18);
    k.fillStyle = '#FFFFFF'; k.fill();
    k.fillStyle = '#E4002B';
    k.beginPath(); poly(k, [0, -s * 0.36, s * 0.13, 0, -s * 0.13, 0]); k.fill();
    k.fillStyle = '#1C1C1C';
    k.beginPath(); poly(k, [0, s * 0.36, s * 0.13, 0, -s * 0.13, 0]); k.fill();
  },
  clover(k, s) {            // клевер, слегка перекошенный
    k.save();
    k.rotate(0.3);
    k.fillStyle = '#B7E36A';
    k.beginPath();
    for (const [x, y] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) dot(k, x * s, y * s, s * 0.22);
    k.fill();
    k.fillRect(-s * 0.03, s * 0.2, s * 0.06, s * 0.3);
    k.restore();
  },
  bird(k, s) {              // зелёная птичка
    k.fillStyle = '#2E9E3F';
    k.beginPath(); k.arc(0, 0, s * 0.44, 0, TAU); k.fill();
    k.fillStyle = '#1F7A2E';
    k.beginPath(); k.ellipse(-s * 0.1, s * 0.1, s * 0.24, s * 0.14, 0.5, 0, TAU); k.fill();
    k.fillStyle = '#FF8A00';
    k.beginPath(); poly(k, [s * 0.36, -s * 0.08, s * 0.62, 0, s * 0.36, s * 0.1]); k.fill();
    k.fillStyle = '#FFFFFF';
    k.beginPath(); k.arc(s * 0.16, -s * 0.14, s * 0.09, 0, TAU); k.fill();
    k.fillStyle = '#1C1C1C';
    k.beginPath(); k.arc(s * 0.18, -s * 0.14, s * 0.045, 0, TAU); k.fill();
  },
  leaf(k, s) {
    k.fillStyle = '#B9F27C';
    k.beginPath(); k.ellipse(0, 0, s * 0.42, s * 0.2, -0.6, 0, TAU); k.fill();
  },
  comma(k, s) {             // две «картошки» и запятая вместо точки
    k.fillStyle = '#FFC72C';
    k.save(); k.rotate(-0.16); rr(k, -s * 0.34, -s * 0.44, s * 0.17, s * 0.84, s * 0.08); k.fill(); k.restore();
    k.save(); k.rotate(0.1); rr(k, -s * 0.08, -s * 0.44, s * 0.17, s * 0.84, s * 0.08); k.fill(); k.restore();
    k.fillStyle = '#FF6B00';
    k.beginPath(); k.arc(s * 0.32, s * 0.16, s * 0.17, 0, TAU); k.fill();
    k.beginPath(); poly(k, [s * 0.46, s * 0.2, s * 0.36, s * 0.52, s * 0.18, s * 0.26]); k.fill();
  },
  buns(k, s) {              // надпись между двумя булками
    k.fillStyle = '#FF8732';
    k.beginPath(); k.ellipse(0, -s * 0.2, s * 0.74, s * 0.34, 0, Math.PI, TAU); k.fill();
    rr(k, -s * 0.74, s * 0.24, s * 1.48, s * 0.2, s * 0.1); k.fill();
    k.save(); k.translate(0, -s * 0.06); word(k, 'BURGER', s * 0.24, '#D62300', F.nun, 900); k.restore();
    k.save(); k.translate(0, s * 0.14); word(k, 'ЦАРЬ', s * 0.24, '#D62300', F.nun, 900); k.restore();
  },
  roof(k, s) {              // крыша вместо птицы додо
    k.fillStyle = '#FFFFFF';
    k.beginPath(); poly(k, [-s * 0.46, s * 0.06, 0, -s * 0.36, s * 0.46, s * 0.06, s * 0.34, s * 0.06, 0, -s * 0.2, -s * 0.34, s * 0.06]); k.fill();
    k.fillRect(-s * 0.26, s * 0.04, s * 0.52, s * 0.3);
    k.fillRect(s * 0.2, -s * 0.36, s * 0.1, s * 0.24);
    k.fillStyle = '#FF6900';
    k.fillRect(-s * 0.07, s * 0.12, s * 0.14, s * 0.22);
  },
  star(k, s) {              // круглый зелёный знак со звездой
    k.fillStyle = '#00704A';
    k.beginPath(); k.arc(0, 0, s * 0.5, 0, TAU); k.fill();
    k.strokeStyle = '#FFFFFF';
    k.lineWidth = s * 0.045;
    k.beginPath(); k.arc(0, 0, s * 0.39, 0, TAU); k.stroke();
    k.fillStyle = '#FFFFFF';
    k.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.11 : s * 0.27;
      if (i) k.lineTo(Math.cos(a) * r, Math.sin(a) * r); else k.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    k.closePath(); k.fill();
  },
  fish(k, s) {
    k.fillStyle = '#FFD23F';
    k.beginPath(); k.ellipse(-s * 0.06, 0, s * 0.34, s * 0.2, 0, 0, TAU); k.fill();
    k.beginPath(); poly(k, [s * 0.2, 0, s * 0.46, -s * 0.2, s * 0.46, s * 0.2]); k.fill();
    k.fillStyle = '#1C1C1C';
    k.beginPath(); k.arc(-s * 0.22, -s * 0.04, s * 0.04, 0, TAU); k.fill();
  },
  plane(k, s) {             // бумажный самолётик
    k.fillStyle = '#FFFFFF';
    k.beginPath(); poly(k, [-s * 0.46, -s * 0.06, s * 0.46, -s * 0.32, s * 0.04, s * 0.36, -s * 0.06, s * 0.06]); k.fill();
    k.fillStyle = 'rgba(0,0,0,.18)';
    k.beginPath(); poly(k, [-s * 0.06, s * 0.06, s * 0.46, -s * 0.32, s * 0.04, s * 0.36]); k.fill();
  },
  megaDots(k, s) {          // три точки в круге
    k.fillStyle = '#FFFFFF';
    k.beginPath(); k.arc(0, 0, s * 0.46, 0, TAU); k.fill();
    k.fillStyle = '#731982';
    k.beginPath(); dot(k, -s * 0.2, s * 0.12, s * 0.09); dot(k, 0, -s * 0.14, s * 0.09); dot(k, s * 0.2, s * 0.12, s * 0.09); k.fill();
  },
  avito(k, s) {             // четыре цветных кружка
    k.fillStyle = '#00AAFF'; k.beginPath(); k.arc(s * 0.16, s * 0.14, s * 0.3, 0, TAU); k.fill();
    k.fillStyle = '#97CF26'; k.beginPath(); k.arc(-s * 0.24, -s * 0.16, s * 0.2, 0, TAU); k.fill();
    k.fillStyle = '#FF6163'; k.beginPath(); k.arc(s * 0.22, -s * 0.3, s * 0.13, 0, TAU); k.fill();
    k.fillStyle = '#A169F7'; k.beginPath(); k.arc(-s * 0.28, s * 0.24, s * 0.11, 0, TAU); k.fill();
  },
  houseTap(k, s) {          // домик и курсор-палец
    k.fillStyle = '#27AE60';
    k.beginPath(); poly(k, [-s * 0.42, 0, 0, -s * 0.4, s * 0.42, 0, s * 0.3, 0, s * 0.3, s * 0.38, -s * 0.3, s * 0.38, -s * 0.3, 0]); k.fill();
    k.fillStyle = '#F2994A';
    k.beginPath(); poly(k, [-s * 0.02, s * 0.02, s * 0.34, s * 0.2, s * 0.18, s * 0.26, s * 0.3, s * 0.46, s * 0.2, s * 0.5, s * 0.1, s * 0.3, -s * 0.02, s * 0.4]); k.fill();
  },
  roofs(k, s) {             // две крыши
    k.strokeStyle = '#FFFFFF';
    k.lineWidth = s * 0.13;
    k.lineJoin = 'round';
    k.lineCap = 'round';
    k.beginPath();
    k.moveTo(-s * 0.42, s * 0.22); k.lineTo(-s * 0.12, -s * 0.2); k.lineTo(s * 0.08, s * 0.06);
    k.moveTo(s * 0.02, -s * 0.02); k.lineTo(s * 0.2, -s * 0.28); k.lineTo(s * 0.44, s * 0.22);
    k.stroke();
  },
  speed(k, s) {             // штрихи скорости
    k.fillStyle = '#FFFFFF';
    for (let i = 0; i < 3; i++) { k.beginPath(); poly(k, [-s * 0.3 + i * s * 0.08, -s * 0.26 + i * s * 0.2, s * 0.3, -s * 0.26 + i * s * 0.2, s * 0.24, -s * 0.14 + i * s * 0.2, -s * 0.36 + i * s * 0.08, -s * 0.14 + i * s * 0.2]); k.fill(); }
  },
  flower(k, s) {            // жёлтый цветок
    k.fillStyle = '#FFD200';
    k.beginPath();
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; k.moveTo(Math.cos(a) * s * 0.3 + s * 0.14, Math.sin(a) * s * 0.3); k.arc(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3, s * 0.14, 0, TAU); }
    k.fill();
    k.fillStyle = '#003C96';
    k.beginPath(); k.arc(0, 0, s * 0.16, 0, TAU); k.fill();
  },
  redBird(k, s) {           // красно-зелёная птица
    k.fillStyle = '#E0001A';
    k.beginPath(); k.ellipse(0, s * 0.06, s * 0.38, s * 0.2, -0.5, 0, TAU); k.fill();
    k.beginPath(); poly(k, [-s * 0.4, s * 0.34, -s * 0.2, s * 0.02, -s * 0.02, s * 0.2]); k.fill();
    k.fillStyle = '#00A651';
    k.beginPath(); k.arc(s * 0.26, -s * 0.22, s * 0.13, 0, TAU); k.fill();
  },
  monogram(k, s) {          // красный квадрат с буквами
    rr(k, -s * 0.46, -s * 0.46, s * 0.92, s * 0.92, s * 0.1);
    k.fillStyle = '#D62B1F'; k.fill();
    word(k, 'АС', s * 0.48, '#FFFFFF', F.play, 700, true);
  },
  ring(k, s) {              // розовая точка-звонок
    k.fillStyle = '#F1117E';
    k.beginPath(); k.arc(0, 0, s * 0.3, 0, TAU); k.fill();
    k.fillStyle = '#FFFFFF';
    k.beginPath(); k.arc(0, 0, s * 0.11, 0, TAU); k.fill();
  },
  check(k, s) {             // зелёный круг с галочкой
    const g = k.createLinearGradient(-s * 0.5, s * 0.5, s * 0.5, -s * 0.5);
    g.addColorStop(0, '#F2E913'); g.addColorStop(0.35, '#21A038'); g.addColorStop(1, '#00C2FF');
    k.strokeStyle = g;
    k.lineWidth = s * 0.14;
    k.lineCap = 'round';
    k.lineJoin = 'round';
    k.beginPath(); k.arc(0, 0, s * 0.4, -0.5, TAU - 1.1); k.stroke();
    k.beginPath(); k.moveTo(-s * 0.2, -s * 0.02); k.lineTo(-s * 0.02, s * 0.16); k.lineTo(s * 0.42, -s * 0.3); k.stroke();
  },
  alfa(k, s) {              // красная «А» с чертой
    k.save(); k.translate(0, -s * 0.08); word(k, 'А', s * 0.86, '#EF3124', F.mont, 900); k.restore();
    k.fillStyle = '#EF3124';
    k.fillRect(-s * 0.3, s * 0.36, s * 0.6, s * 0.11);
  },
  shield(k, s) {            // щит с буквой Т
    k.fillStyle = '#1C1C1C';
    k.beginPath();
    k.moveTo(-s * 0.4, -s * 0.44); k.lineTo(s * 0.4, -s * 0.44); k.lineTo(s * 0.4, s * 0.06);
    k.quadraticCurveTo(s * 0.4, s * 0.4, 0, s * 0.5);
    k.quadraticCurveTo(-s * 0.4, s * 0.4, -s * 0.4, s * 0.06);
    k.closePath(); k.fill();
    k.save(); k.translate(0, -s * 0.02); word(k, 'Т', s * 0.56, '#FFDD2D', F.mont, 900); k.restore();
  },
  cross(k, s) {             // аптечный крест
    rr(k, -s * 0.46, -s * 0.46, s * 0.92, s * 0.92, s * 0.14);
    k.fillStyle = '#FFFFFF'; k.fill();
    k.fillStyle = '#00A651';
    k.fillRect(-s * 0.11, -s * 0.32, s * 0.22, s * 0.64);
    k.fillRect(-s * 0.32, -s * 0.11, s * 0.64, s * 0.22);
  },
  oval(k, s) {              // жёлтый овал с синими буквами
    k.fillStyle = '#FFDB00';
    k.beginPath(); k.ellipse(0, 0, s * 1.75, s * 0.5, 0, 0, TAU); k.fill();
    word(k, 'ИПОТЕКЕА', s * 0.5, '#0058A3', F.mont, 900);
  },
  ball(k, s) {              // полосатый шар
    k.save();
    k.beginPath(); k.arc(0, 0, s * 0.44, 0, TAU); k.clip();
    k.fillStyle = '#FFCC00'; k.fillRect(-s, -s, s * 2, s * 2);
    k.fillStyle = '#1C1C1C';
    for (let y = -0.44; y < 0.5; y += 0.3) k.fillRect(-s, y * s, s * 2, s * 0.15);
    k.restore();
    k.strokeStyle = '#1C1C1C'; k.lineWidth = s * 0.05;
    k.beginPath(); k.arc(0, 0, s * 0.44, 0, TAU); k.stroke();
  },
  spark(k, s) {             // четырёхлучевая звёздочка
    k.fillStyle = '#FFFFFF';
    k.beginPath(); poly(k, [0, -s * 0.44, s * 0.1, -s * 0.1, s * 0.44, 0, s * 0.1, s * 0.1, 0, s * 0.44, -s * 0.1, s * 0.1, -s * 0.44, 0, -s * 0.1, -s * 0.1]); k.fill();
  },
  checker(k, s) {           // шашечки такси
    k.fillStyle = '#1C1C1C';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) k.fillRect(-s * 0.44 + i * s * 0.22, -s * 0.22 + j * s * 0.22, s * 0.22, s * 0.22);
  },
};

/* ───────────────────────────── БРЕНДЫ ───────────────────────────── */
const B = {};
const def = (name, d) => { B[name] = Object.assign({ name, fmt: 'band', fg: '#FFFFFF', fill: 0.84, ads: [] }, d); };
const t = (str, f, s, c, w8, extra) => Object.assign({ t: str, f, s, c, w8: w8 || 800 }, extra);
const icon = (fn, w, is) => ({ i: fn, w: w || 0.9, is: is || 0.74 });
const gap = g => ({ gap: g === undefined ? 0.16 : g });

/* ── из списка заказчика ── */
def('Шестёрочка',       { like: 'Пятёрочка', cat: 'grocery', bg: '#E52322', parts: [icon(I.six, 0.9, 0.82), gap(), t('Шестёрочка', F.nun, 0.5, '#FFFFFF', 900)], ads: ['Выручает. Но не с арендой', 'Скидки до 6%'] });
def('Компас',           { like: 'Магнит', cat: 'grocery', bg: '#E4002B', parts: [icon(I.compass), gap(), t('КОМПАС', F.mont, 0.5, '#FFFFFF', 900)], ads: ['Всегда показывает на МКАД'] });
def('Перекос',          { like: 'Перекрёсток', cat: 'grocery', bg: '#00923F', parts: [icon(I.clover), gap(0.1), t('ПЕРЕКОС', F.mont, 0.46, '#FFFFFF', 900, { sk: 0.2 })], ads: ['Цены тоже перекосило'] });
def('Пыжик',            { like: 'Чижик', cat: 'grocery', bg: '#FFDD00', fg: '#1C1C1C', parts: [icon(I.bird), gap(), t('пыжик', F.nun, 0.6, '#1C1C1C', 900)], ads: ['Дёшево. Как в 2015-м*'] });
def('Дикие ягоды',      { like: 'Wildberries', cat: 'pvz', bg: '#A6189B', paint: ['#CB11AB', '#481173'], parts: [t('дикие ягоды', F.mont, 0.44, '#FFFFFF', 700)], ads: ['Пункт выдачи в твоём подъезде'] });
def('Белое & Красное',  { like: 'Красное & Белое', cat: 'alcohol', bg: '#D7141A', split: ['БЕЛОЕ', 'КРАСНОЕ'], ads: ['После просмотра квартиры — к нам'] });
def('ВкусДом',          { like: 'ВкусВилл', cat: 'grocery', bg: '#12A650', parts: [t('вкусдом', F.nun, 0.58, '#FFFFFF', 900), gap(0.1), icon(I.leaf, 0.6, 0.6)], ads: ['Полезно. Дорого. Рядом'] });
def('Fix Rent',         { like: 'Fix Price', cat: 'retail', bg: '#0A4EA2', parts: [t('Fix', F.mont, 0.56, '#FFFFFF', 900, { it: 1 }), gap(0.12), t('Rent', F.mont, 0.56, '#8DC63F', 900, { it: 1 })], ads: ['Всё по одной цене*', '*цена в договоре другая'] });
def('Вкусно и запятая', { like: 'Вкусно — и точка', cat: 'fastfood', bg: '#0B6B3A', parts: [icon(I.comma, 0.9, 0.8), gap(), t('Вкусно — и запятая', F.mont, 0.34, '#FFFFFF', 700)], ads: ['Продолжение следует,'] });
def('Burger Царь',      { like: 'Burger King', cat: 'fastfood', bg: '#F5EBDC', fg: '#D62300', parts: [icon(I.buns, 1.6, 0.92)], ads: ['Царский залог — у нас'] });
def('Додо Крыша',       { like: 'Додо Пицца', cat: 'fastfood', bg: '#FF6900', parts: [icon(I.roof), gap(), t('ДОДО КРЫША', F.nun, 0.46, '#FFFFFF', 900)], ads: ['Крыша над головой за 60 минут'] });
def('StarБакс',         { like: 'Starbucks', cat: 'cafe', bg: '#1E3932', parts: [icon(I.star, 1, 0.86), gap(), t('STARБАКС', F.mont, 0.36, '#FFFFFF', 700)], ads: ['Латте по цене коммуналки'] });
def('Cofish',           { like: 'Cofix', cat: 'cafe', bg: '#D0021B', parts: [t('cofish', F.lob, 0.66, '#FFFFFF', 400), gap(0.14), icon(I.fish, 0.8, 0.7)], ads: ['Кофе и рыба. Не спрашивай'] });
def('Самолёт',          { like: 'Самолёт', cat: 'developer', bg: '#1F6BFF', parts: [icon(I.plane), gap(), t('самолёт', F.mont, 0.5, '#FFFFFF', 700)], ads: ['ЖК «Взлётная полоса»', 'До метро — один перелёт'] });
def('Мегаквартир',      { like: 'МегаФон', cat: 'telecom', bg: '#00B956', parts: [icon(I.megaDots), gap(), t('Мега', F.mont, 0.48, '#FFFFFF', 900), t('Квартир', F.mont, 0.48, '#FFFFFF', 700)], ads: ['Евротрёшка 24 м²', 'Безлимит на соседей'] });
def('АвиСдано',         { like: 'Авито', cat: 'realty', bg: '#FFFFFF', fg: '#1C1C1C', parts: [icon(I.avito, 1), gap(0.1), t('АвиСдано', F.man, 0.5, '#1C1C1C', 800)], ads: ['Сдано. Ещё вчера', 'Собственник*'] });
def('Домтык',           { like: 'Домклик', cat: 'realty', bg: '#FFFFFF', fg: '#1C1C1C', parts: [icon(I.houseTap), gap(0.12), t('Дом', F.mont, 0.48, '#1C1C1C', 900), t('тык', F.mont, 0.48, '#27AE60', 900)], ads: ['Ипотека на 50 лет', 'Ремонт от застройщика'] });
def('ЦИРАН',            { like: 'ЦИАН', cat: 'realty', bg: '#0468FF', parts: [icon(I.roofs), gap(0.12), t('ЦИРАН', F.mont, 0.52, '#FFFFFF', 900)], ads: ['15 минут до метро*', 'Фото соответствует'] });
def('СДАЙ',             { like: 'СДЭК', cat: 'pvz', bg: '#1AB248', parts: [icon(I.speed, 0.8, 0.7), gap(0.06), t('СДАЙ', F.mont, 0.6, '#FFFFFF', 900, { it: 1 })], ads: ['Сдай уже', 'Агентам не звонить'] });
def('ЯнЕдет',           { like: 'Яндекс Go', cat: 'taxi', bg: '#FFDD2D', fg: '#1C1C1C', parts: [t('Я', F.man, 0.6, '#FC3F1D', 800), t('нЕдет', F.man, 0.6, '#1C1C1C', 800)], ads: ['Приедет. Когда-нибудь'] });

/* ── свои, в том же духе ── */
def('Рента',            { like: 'Лента', cat: 'grocery', bg: '#003C96', parts: [icon(I.flower), gap(), t('РЕНТА', F.osw, 0.62, '#FFFFFF', 600)], ads: ['Гипермаркет ежемесячных платежей'] });
def('Аванс',            { like: 'Ашан', cat: 'grocery', bg: '#FFFFFF', fg: '#E0001A', parts: [t('Аванс', F.nun, 0.6, '#E0001A', 900), gap(0.1), icon(I.redBird)], ads: ['Первый и последний месяц'] });
def('Азбука Съёма',     { like: 'Азбука Вкуса', cat: 'grocery', bg: '#00573A', parts: [icon(I.monogram), gap(), t('Азбука Съёма', F.play, 0.44, '#FFFFFF', 700, { it: 1 })], ads: ['А — аванс. Б — без животных'] });
def('Обзвон',           { like: 'Ozon', cat: 'pvz', bg: '#005BFF', parts: [t('ОБЗВОН', F.nun, 0.58, '#FFFFFF', 900), gap(0.1), icon(I.ring, 0.6, 0.6)], ads: ['Агент уже звонит', '«Актуально?»'] });
def('СамоСнял',         { like: 'Самокат', cat: 'pvz', bg: '#FF335F', parts: [t('самоснял', F.mont, 0.5, '#FFFFFF', 900)], ads: ['Без агента за 15 минут'] });
def('Съём',             { like: 'Сбер', cat: 'bank', bg: '#FFFFFF', fg: '#0B7A3B', parts: [icon(I.check), gap(), t('СЪЁМ', F.mont, 0.52, '#0B7A3B', 700)], ads: ['Вклад «Залог»: 0% годовых'] });
def('Аренда-Банк',      { like: 'Альфа-Банк', cat: 'bank', bg: '#FFFFFF', fg: '#EF3124', parts: [icon(I.alfa, 0.8, 0.8), gap(0.14), t('Аренда-Банк', F.mont, 0.42, '#EF3124', 700)], ads: ['Ипотека от 29,9%', 'Кэшбэк коммуналкой'] });
def('Т-Залог',          { like: 'Т-Банк', cat: 'bank', bg: '#FFDD2D', fg: '#1C1C1C', parts: [icon(I.shield, 0.8, 0.8), gap(), t('Т-ЗАЛОГ', F.mont, 0.46, '#1C1C1C', 900)], ads: ['Залог вернём. Наверное'] });
def('36,6 м²',          { like: '36,6', cat: 'pharmacy', bg: '#00A651', parts: [icon(I.cross), gap(), t('36,6 м²', F.nun, 0.56, '#FFFFFF', 900)], ads: ['Студия со здоровой атмосферой'] });
def('Ипотекеа',         { like: 'IKEA', cat: 'retail', bg: '#0058A3', parts: [icon(I.oval, 3.6, 0.84)], ads: ['Соберите сами. За 30 лет'] });
def("Л'Этаж",           { like: "Л'Этуаль", cat: 'retail', bg: '#141E4E', parts: [icon(I.spark, 0.6, 0.5), gap(0.1), t("Л'ЭТАЖ", F.play, 0.5, '#FFFFFF', 700, { it: 1 })], ads: ['Первый не предлагать'] });
def('Снимай-город',     { like: 'Читай-город', cat: 'retail', bg: '#1F4E9D', parts: [t('Снимай', F.nun, 0.5, '#FFFFFF', 900), t('-', F.nun, 0.5, '#FF4D3D', 900), t('город', F.nun, 0.5, '#FFFFFF', 900)], ads: ['Бестселлер: «Договор найма»'] });
def('Золотой Метр',     { like: 'Золотое Яблоко', cat: 'retail', bg: '#D4FF00', fg: '#1C1C1C', parts: [t('ЗОЛОТОЙ МЕТР', F.unb, 0.34, '#1C1C1C', 800)], ads: ['Цена за квадрат — в названии'] });
def('М².Видео',         { like: 'М.Видео', cat: 'retail', bg: '#E31235', parts: [t('М².Видео', F.mont, 0.52, '#FFFFFF', 900)], ads: ['Нам не всё равно, сколько метров'] });
def('Крошка Однушка',   { like: 'Крошка Картошка', cat: 'fastfood', bg: '#FFD21F', fg: '#2E8B37', parts: [t('Крошка', F.lob, 0.56, '#2E8B37', 400), gap(0.14), t('Однушка', F.lob, 0.56, '#D62B1F', 400)], ads: ['С начинкой из соседей'] });
def('Грабёж',           { like: 'Грабли', cat: 'cafe', bg: '#2F7D32', parts: [t('Грабёж', F.lob, 0.68, '#FFFFFF', 400)], ads: ['Средний чек — как аренда'] });
def('Ипотечница',       { like: 'Шоколадница', cat: 'cafe', bg: '#4E2A1E', parts: [t('Ипотечница', F.lob, 0.62, '#FFFFFF', 400)], ads: ['Блинчики под 18% годовых'] });
def("Rentic's",         { like: "Rostic's", cat: 'fastfood', bg: '#E4002B', parts: [t("Rentic's", F.lob, 0.68, '#FFFFFF', 400)], ads: ['Крылышки и крыша'] });
def('Жилайн',           { like: 'Билайн', cat: 'telecom', bg: '#FFCC00', fg: '#1C1C1C', parts: [icon(I.ball), gap(), t('жилайн', F.nun, 0.58, '#1C1C1C', 900)], ads: ['Жить на яркой стороне МКАДа'] });
def('Пшик',             { like: 'ПИК', cat: 'developer', bg: '#FF4F00', parts: [t('ПШИК', F.mont, 0.62, '#FFFFFF', 900)], ads: ['Доступное жильё*', 'Сдача в IV квартале 2019'] });
def('Долгострой',       { like: 'Донстрой', cat: 'developer', bg: '#14213D', fg: '#D8B36A', parts: [t('ДОЛГОСТРОЙ', F.mont, 0.42, '#D8B36A', 700)], ads: ['Будет бизнес-класс', 'Ключи — уже скоро. С 2017 года'] });
def('ДелиКвартиру',     { like: 'Делимобиль', cat: 'taxi', bg: '#FFFFFF', fg: '#1C1C1C', parts: [t('Дели', F.mont, 0.5, '#00A86B', 900), t('Квартиру', F.mont, 0.5, '#1C1C1C', 900)], ads: ['Поминутная аренда комнаты'] });

/* ───────────────────────────── ОТРИСОВКА ───────────────────────────── */
/* Собирает знак и надпись в одну строку и вписывает в прямоугольник w×h */
function lockup(k, w, h, parts, fill) {
  const widths = [];
  let total = 0;
  for (const p of parts) {
    let pw;
    if (p.t !== undefined) {
      k.font = `${p.it ? 'italic ' : ''}${p.w8} ${p.s * h}px ${p.f}`;
      pw = k.measureText(p.t).width;
    } else if (p.i) pw = p.w * h;
    else pw = p.gap * h;
    widths.push(pw);
    total += pw;
  }
  const sc = Math.min(1, (w * fill) / total);
  k.save();
  k.translate((w - total * sc) / 2, h / 2);
  k.scale(sc, sc);
  let x = 0;
  parts.forEach((p, i) => {
    if (p.t !== undefined) {
      k.save();
      k.translate(x, h * 0.02);
      if (p.sk) k.transform(1, 0, -p.sk, 1, 0, 0);
      k.font = `${p.it ? 'italic ' : ''}${p.w8} ${p.s * h}px ${p.f}`;
      k.fillStyle = p.c;
      k.textAlign = 'left';
      k.textBaseline = 'middle';
      k.fillText(p.t, 0, 0);
      k.restore();
    } else if (p.i) {
      k.save();
      k.translate(x + widths[i] / 2, 0);
      p.i(k, h * p.is);
      k.restore();
    }
    x += widths[i];
  });
  k.restore();
}

/* Рисует вывеску бренда в прямоугольнике (x, y, w, h): световой короб с фоном */
function sign(k, name, x, y, w, h, o) {
  const b = B[name];
  const radius = o && o.radius !== undefined ? o.radius : Math.min(4, h * 0.14);
  k.save();
  k.translate(x, y);
  if (!b) {                                    // не бренд, а просто надпись
    rr(k, 0, 0, w, h, radius);
    k.fillStyle = (o && o.bg) || '#FFFFFF';
    k.fill();
    lockup(k, w, h, [t(name, F.mont, 0.46, (o && o.fg) || '#1C1C1C', 900)], 0.84);
    k.restore();
    return;
  }
  rr(k, 0, 0, w, h, radius);
  if (b.paint) {
    const g = k.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, b.paint[0]); g.addColorStop(1, b.paint[1]);
    k.fillStyle = g;
  } else k.fillStyle = b.bg;
  k.fill();
  if (b.split) {                               // вывеска из двух половин
    k.save();
    rr(k, 0, 0, w, h, radius);
    k.clip();
    k.fillStyle = '#FFFFFF';
    k.fillRect(0, 0, w / 2, h);
    k.restore();
    const half = w / 2 - h * 0.34;                // место под амперсанд посередине
    lockup(k, half, h, [t(b.split[0], F.mont, 0.44, b.bg, 900)], 0.82);
    k.save(); k.translate(w - half, 0); lockup(k, half, h, [t(b.split[1], F.mont, 0.44, '#FFFFFF', 900)], 0.82); k.restore();
    k.beginPath(); k.arc(w / 2, h / 2, h * 0.3, 0, TAU);
    k.fillStyle = '#FFFFFF'; k.fill();
    k.save(); k.translate(w / 2, h / 2 + h * 0.02); word(k, '&', h * 0.42, b.bg, F.mont, 900); k.restore();
  } else {
    lockup(k, w, h, b.parts, b.fill);
  }
  if (b.bg === '#FFFFFF' || b.bg === '#F5EBDC') {      // светлый короб — тонкая рамка, чтобы не терялся на стене
    rr(k, 0.5, 0.5, w - 1, h - 1, radius);
    k.lineWidth = 1;
    k.strokeStyle = 'rgba(28,28,28,.22)';
    k.stroke();
  }
  k.restore();
}

/* Вывеска над магазином: лента на всю ширину или короб по центру */
function fascia(k, name, x, y, w, h) {
  const b = B[name];
  if (b && b.fmt === 'box') {
    const bw = Math.min(w, h * (b.ar || 4.5));
    sign(k, name, x + (w - bw) / 2, y, bw, h);
  } else sign(k, name, x, y, w, h, { radius: 2 });
  k.fillStyle = 'rgba(0,0,0,.14)';
  k.fillRect(x, y + h, w, 1.6);
}

/* Реклама на щите или остановке: бренд сверху, строчка снизу */
function ad(k, name, line, x, y, w, h) {
  const b = B[name] || { bg: '#FFFFFF', fg: '#1C1C1C' };
  k.save();
  rr(k, x, y, w, h, 4);
  k.fillStyle = b.bg;
  k.fill();
  k.clip();
  if (b.paint) {
    const g = k.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, b.paint[0]); g.addColorStop(1, b.paint[1]);
    k.fillStyle = g;
    k.fillRect(x, y, w, h);
  }
  k.restore();
  sign(k, name, x + w * 0.06, y + h * 0.08, w * 0.88, h * 0.5, { radius: 0 });
  k.save();
  k.translate(x, y + h * 0.56);
  lockup(k, w, h * 0.38, [t(line, F.man, 0.46, b.fg, 800)], 0.9);
  k.restore();
  if (b.bg === '#FFFFFF') { rr(k, x + 0.5, y + 0.5, w - 1, h - 1, 4); k.lineWidth = 1; k.strokeStyle = 'rgba(28,28,28,.22)'; k.stroke(); }
}

K.BRANDS = B;
K.SIGN_FONT = F;
K.sign = sign;
K.fascia = fascia;
K.adSign = ad;
K.brandsOf = (...cats) => Object.keys(B).filter(n => cats.includes(B[n].cat));

})(window.KTM = window.KTM || {});
