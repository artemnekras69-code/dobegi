/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — почерк

   Одна художественная система на всю игру: «московская трафаретная аркада».
     · плоские заливки ограниченной палитрой — никаких градиентов и мягких теней;
     · форма вырезана как из бумаги: углы, скосы, чуть кривые стороны, без круглых «таблеток»;
     · контур неровный: снизу и справа линия толще (нажим), толщина зависит от роли —
       герой 3.4, препятствия 2.6, карточки 3, фон тоньше 1.4 или без контура;
     · краска «не попадает» в контур, как при трафаретной печати: заливка сдвинута
       вправо-вниз, слева сверху остаётся полоска бумаги;
     · тон набирается штриховкой и растром, а не прозрачностью.
   Всё рисование в art.js, city.js и brands.js идёт через эти функции.
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, hash3 } = K.util;
const C = K.CONFIG.colors, FONT = K.FONT;

const ink = {
  lw: 2.6,        // толщина контура игрового объекта
  off: 2.1,       // сдвиг краски относительно контура
  wobble: 0.55,   // на сколько юнитов «гуляют» вершины
};

/* Случайное −1…1, одно и то же для одной вершины: линия не дрожит от кадра к кадру */
const jit = (seed, i) => (hash3(seed, i, 911) % 2001) / 1000 - 1;

function seedOf(pts) {
  let s = pts.length * 131;
  for (let i = 0; i < pts.length; i++) s = (Math.imul(s, 31) + Math.round(pts[i] * 2)) | 0;
  return s;
}

function rough(pts, amp, seed) {
  const out = new Array(pts.length);
  for (let i = 0; i < pts.length; i += 2) {
    out[i] = pts[i] + jit(seed, i) * amp;
    out[i + 1] = pts[i + 1] + jit(seed, i + 1) * amp;
  }
  return out;
}

function trace(ctx, p, close, dx, dy) {
  dx = dx || 0; dy = dy || 0;
  ctx.beginPath();
  ctx.moveTo(p[0] + dx, p[1] + dy);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] + dx, p[i + 1] + dy);
  if (close) ctx.closePath();
}

function setLine(ctx, lw, color, cap) {
  ctx.lineWidth = lw;
  ctx.strokeStyle = color || C.ink;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 2.6;
  ctx.lineCap = cap || 'butt';
}

/* Замкнутая форма. pts — [x, y, x, y…]
   o.fill   цвет заливки            o.line   цвет контура (по умолчанию чёрный)
   o.lw     толщина контура, 0 — без контура
   o.off    сдвиг краски, 0 — краска точно в контуре (фон, мелочь)
   o.j      неровность вершин        o.seed   зерно неровности (для анимированных форм)
   o.press  0 — без нажима */
ink.poly = function (ctx, pts, o) {
  o = o || {};
  const j = o.j === undefined ? ink.wobble : o.j;
  const p = j ? rough(pts, j, o.seed === undefined ? seedOf(pts) : o.seed) : pts;
  const lw = o.lw === undefined ? ink.lw : o.lw;
  if (o.fill) {
    const off = o.off === undefined ? (lw ? ink.off : 0) : o.off;
    if (off) {
      trace(ctx, p, true);
      ctx.fillStyle = o.paper || C.paper;
      ctx.fill();
    }
    trace(ctx, p, true, off, off);
    ctx.fillStyle = o.fill;
    ctx.fill();
  }
  if (lw) {
    trace(ctx, p, true);
    setLine(ctx, lw, o.line);
    ctx.stroke();
    if (o.press !== 0) {                              // нажим: снизу и справа линия толще
      trace(ctx, p, true, lw * 0.24, lw * 0.34);
      ctx.lineWidth = lw * 0.5;
      ctx.stroke();
    }
  }
  return p;
};

/* Четырёхугольник. top — координата верха. o.cut — срезанные углы, o.lean — завал верха вбок */
ink.box = function (ctx, x, top, w, h, o) {
  o = o || {};
  const c = Math.min(o.cut || 0, w / 2, h / 2), l = o.lean || 0, b = top + h;
  const pts = c
    ? [x + c + l, top, x + w - c + l, top, x + w + l, top + c, x + w, b - c, x + w - c, b, x + c, b, x, b - c, x + l, top + c]
    : [x + l, top, x + w + l, top, x + w, b, x, b];
  return ink.poly(ctx, pts, o);
};

/* Круг, вырезанный ножницами: многоугольник с неровным радиусом */
ink.disc = function (ctx, cx, cy, r, o) {
  o = o || {};
  const n = o.n || Math.max(7, Math.min(16, Math.round(r * 0.7 + 6)));
  const seed = o.seed === undefined ? (Math.round(cx * 3) * 73 + Math.round(cy * 3) * 19 + Math.round(r * 5)) | 0 : o.seed;
  const amp = o.j === undefined ? 0.07 : o.j, rot = o.rot === undefined ? jit(seed, 99) : o.rot;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + i / n * TAU, rr = r * (1 + jit(seed, i) * amp);
    pts.push(cx + Math.cos(a) * rr * (o.sx || 1), cy + Math.sin(a) * rr * (o.sy || 1));
  }
  return ink.poly(ctx, pts, Object.assign({}, o, { j: 0 }));
};

/* Ломаная линия с нажимом */
ink.line = function (ctx, pts, lw, color, o) {
  o = o || {};
  const j = o.j === undefined ? ink.wobble * 0.6 : o.j;
  const p = j ? rough(pts, j, o.seed === undefined ? seedOf(pts) : o.seed) : pts;
  trace(ctx, p, false);
  setLine(ctx, lw || ink.lw, color, o.cap);
  ctx.stroke();
  if (o.press) {
    trace(ctx, p, false, lw * 0.22, lw * 0.3);
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();
  }
  return p;
};

/* Звено руки или ноги: клин от (x1, y1) шириной w1 к (x2, y2) шириной w2 */
ink.wedge = function (x1, y1, w1, x2, y2, w2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  return [x1 + nx * w1 / 2, y1 + ny * w1 / 2, x2 + nx * w2 / 2, y2 + ny * w2 / 2, x2 - nx * w2 / 2, y2 - ny * w2 / 2, x1 - nx * w1 / 2, y1 - ny * w1 / 2];
};

/* Косая штриховка в прямоугольнике: тень или стекло. dir: 1 — «/», −1 — «\» */
ink.hatch = function (ctx, x, y, w, h, gap, color, lw, dir) {
  ctx.beginPath();
  for (let s = gap * 0.5; s < w + h; s += gap) {
    // отрезок x' + y' = s внутри прямоугольника
    const x0 = Math.min(s, w), y0 = s - x0, y1 = Math.min(s, h), x1 = s - y1;
    if (dir === -1) { ctx.moveTo(x + w - x0, y + y0); ctx.lineTo(x + w - x1, y + y1); }
    else { ctx.moveTo(x + x0, y + y0); ctx.lineTo(x + x1, y + y1); }
  }
  setLine(ctx, lw || 1, color);
  ctx.stroke();
};

/* Растр: точки в шахматном порядке. grow(row) может менять размер по рядам */
ink.dots = function (ctx, x, y, w, h, gap, r, color, grow) {
  ctx.fillStyle = color;
  ctx.beginPath();
  let row = 0;
  for (let yy = y + gap / 2; yy < y + h; yy += gap * 0.86, row++) {
    const rr = grow ? grow(row, r) : r;
    if (rr < 0.15) continue;
    for (let xx = x + (row % 2 ? gap / 2 : 0); xx < x + w + gap; xx += gap) { ctx.moveTo(xx + rr, yy); ctx.arc(xx, yy, rr, 0, TAU); }
  }
  ctx.fill();
};

/* Плоская тень на тротуаре: без размытия, просто тёмная плашка со скосом */
ink.shadow = function (ctx, x0, x1, y, depth) {
  const d = depth || 5;
  ctx.fillStyle = 'rgba(23,19,15,.2)';
  ctx.beginPath();
  ctx.moveTo(x0 + 2, y); ctx.lineTo(x1 + 3, y); ctx.lineTo(x1 + 3 + d * 1.6, y + d); ctx.lineTo(x0 + 2 + d * 1.6, y + d);
  ctx.closePath();
  ctx.fill();
};

/* Надпись, которая сама ужимается до maxW.
   o: size, maxW, color, weight, font, align, base, skew (наклон), shadow (цвет подложки), sx (растяжение по ширине) */
ink.text = function (ctx, str, x, y, o) {
  o = o || {};
  const family = o.font || FONT.display, weight = o.weight || 900;
  let size = o.size || 12;
  const sx = o.sx || 1;
  ctx.font = `${o.italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
  if (o.maxW) {
    const w = ctx.measureText(str).width * sx;
    if (w > o.maxW) { size = Math.max(3, size * o.maxW / w); ctx.font = `${o.italic ? 'italic ' : ''}${weight} ${size}px ${family}`; }
  }
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'middle';
  if (sx !== 1 || o.skew) {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(sx, 0, -(o.skew || 0), 1, 0, 0);
    if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(str, size * 0.07 / sx, size * 0.08); }
    ctx.fillStyle = o.color || C.ink;
    ctx.fillText(str, 0, 0);
    ctx.restore();
  } else {
    if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(str, x + size * 0.07, y + size * 0.08); }
    ctx.fillStyle = o.color || C.ink;
    ctx.fillText(str, x, y);
  }
  return size;
};

/* Делит фразу на строки примерно равной длины */
ink.wrap = function (str, maxLines) {
  const words = String(str).split(' ');
  if (words.length <= 1 || maxLines <= 1) return [String(str)];
  const target = Math.ceil(str.length / Math.min(maxLines, words.length));
  const out = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > target && out.length < maxLines - 1) { out.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
};

/* Бумажное зерно: плитка с тёмными и светлыми крапинками. Кладётся поверх всей картинки */
ink.grain = function (size, density) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const k = c.getContext('2d');
  const n = Math.round(size * size * (density || 0.05));
  for (let i = 0; i < n; i++) {
    const x = hash3(i, 1, 5) % size, y = hash3(i, 2, 5) % size, v = hash3(i, 3, 5) % 100;
    k.fillStyle = v < 62 ? `rgba(23,19,15,${0.05 + (v % 7) * 0.012})` : `rgba(255,250,235,${0.07 + (v % 5) * 0.02})`;
    const s = v % 9 === 0 ? 2 : 1;
    k.fillRect(x, y, s, s);
  }
  return c;
};

ink.jit = jit;
ink.rough = rough;
ink.trace = trace;
ink.setLine = setLine;
K.ink = ink;

})(window.KTM = window.KTM || {});
