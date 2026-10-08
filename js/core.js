/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — основа и сервисы

   Утилиты и всё, что позже заменится на сервер:
     storageService      где лежат рекорды и настройки (сейчас localStorage)
     analytics           события игры (сейчас — в память и в консоль при ?debug)
     leaderboardService  таблица лидеров (сейчас — демо-данные)
     platform            Telegram Mini App: экран, вибрация, пользователь
     share               «Поделиться результатом»
   ===================================================================== */
(function (K) {
'use strict';

const CONFIG = K.CONFIG, TEXTS = K.TEXTS;
const TAU = Math.PI * 2;

K.DEBUG = /[?&]debug\b/.test(location.search);
K.FONT = {
  display: '"Unbounded", "Arial Black", "Segoe UI", system-ui, sans-serif',
  text: '"Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

/* ───────────────────────────── УТИЛИТЫ ───────────────────────────── */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = (n, sep = ' ') => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  return b === 1 ? one : many;
};

/* Генератор случайных чисел с зерном: один seed — один и тот же уровень */
function makeRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (a, b) => a + (b - a) * next(),
    int: (a, b) => Math.floor(a + (b - a + 1) * next()),
    chance: p => next() < p,
    pick: arr => arr[Math.floor(next() * arr.length)],
    weighted(list) {            // list: [[значение, вес], ...]
      let total = 0;
      for (const item of list) total += item[1];
      let r = next() * total;
      for (const item of list) { r -= item[1]; if (r <= 0) return item[0]; }
      return list[list.length - 1][0];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
  };
}

function hash3(a, b, c) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const h = v => Math.round(v).toString(16).padStart(2, '0');
  return `#${h(lerp(A[0], B[0], t))}${h(lerp(A[1], B[1], t))}${h(lerp(A[2], B[2], t))}`;
}
const shade = (hex, t) => (t < 0 ? mix(hex, '#000000', -t) : mix(hex, '#FFFFFF', t));

/* Скругленный прямоугольник (ctx.roundRect есть не во всех WebView) */
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function dot(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
function poly(ctx, pts) {
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}
/* Косые полосы (ограждения, шлагбаумы). Рисовать после ctx.clip() по нужной форме */
function stripes(ctx, x, y, w, h, step, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let sx = x - h; sx < x + w; sx += step) {
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + step / 2, y + h);
    ctx.lineTo(sx + step / 2 + h, y);
    ctx.lineTo(sx + h, y);
    ctx.closePath();
  }
  ctx.fill();
}

/* Пул объектов: частицы и препятствия не создаются заново, а переиспользуются */
class Pool {
  constructor(create) { this.create = create; this.free = []; }
  get() { return this.free.pop() || this.create(); }
  put(item) { this.free.push(item); }
}

/* Скорость на заданной дистанции */
function speedAt(meters) {
  const S = CONFIG.speed;
  let prevM = 0, prevK = 0;
  for (const [m, k] of S.ramp) {
    if (meters <= m) return lerp(S.start, S.max, lerp(prevK, k, (meters - prevM) / (m - prevM)));
    prevM = m; prevK = k;
  }
  return S.max;
}

/* Уровень сложности 1–5 по дистанции */
function levelAt(meters) {
  const L = CONFIG.levels;
  let level = 1;
  for (let i = 1; i < L.length; i++) if (meters >= L[i]) level = i + 1;
  return level;
}

/* Когда прыжок с земли выше заданной высоты: t1 — на подъёме, t2 — на спуске, air — весь полёт */
function jumpTimes(height) {
  const P = CONFIG.player;
  const air = 2 * P.jumpVelocity / P.gravity;
  if (height <= 0) return { t1: 0, t2: air, air };
  const disc = P.jumpVelocity * P.jumpVelocity - 2 * P.gravity * height;
  if (disc <= 0) return null;
  const root = Math.sqrt(disc);
  return { t1: (P.jumpVelocity - root) / P.gravity, t2: (P.jumpVelocity + root) / P.gravity, air };
}

/* Сколько длится прыжок с крыши высотой height до земли */
function roofJumpTime(height) {
  const P = CONFIG.player;
  return (P.jumpVelocity + Math.sqrt(P.jumpVelocity * P.jumpVelocity + 2 * P.gravity * height)) / P.gravity;
}

K.util = { TAU, clamp, lerp, fmt, plural, makeRng, hash3, hexToRgb, mix, shade, rr, dot, poly, stripes, Pool, speedAt, levelAt, jumpTimes, roofJumpTime };

/* ───────────────────────────── ХРАНИЛИЩЕ ─────────────────────────────
   Игра читает и пишет только через storageService. Чтобы перейти с localStorage
   на сервер или Telegram CloudStorage, достаточно подменить adapter. */
const localAdapter = {
  read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } },
};

const defaults = () => ({
  v: 2,
  profile: { playerId: '', name: '', nameAsked: false },
  stats: {
    best: 0,                    // рекорд в очках
    bestDistance: 0,            // максимальная дистанция, м
    bestCombo: 0,               // лучшая серия квартир
    games: 0,
    totalApartments: 0,
    totalDistance: 0,
    lastScore: 0, lastDistance: 0,   // прошлая попытка — для сравнения на экране результата
  },
  settings: { sound: true, music: false, haptics: true },
  hints: { jump: 0, duck: 0, ducked: 0, card: 0, read: 0 },
  seen: {},                     // какие редкие объекты игрок уже встречал
  daily: { day: '', best: 0 },
});

const storageService = {
  adapter: localAdapter,
  key: CONFIG.storageKey,
  data: defaults(),

  setAdapter(adapter) { this.adapter = adapter; this.load(); },

  load() {
    const base = defaults();
    const saved = this.adapter.read(this.key);
    if (saved && typeof saved === 'object') {
      for (const section of ['profile', 'stats', 'settings', 'hints', 'seen', 'daily']) {
        if (saved[section] && typeof saved[section] === 'object') Object.assign(base[section], saved[section]);
      }
    } else {
      // перенос рекорда из первой версии игры
      const old = this.adapter.read(CONFIG.legacyStorageKey);
      if (old && typeof old === 'object') {
        base.stats.best = old.best || 0;
        base.stats.bestDistance = old.bestDistance || 0;
        base.stats.games = old.games || 0;
        base.stats.totalApartments = old.totalApartments || 0;
        if (typeof old.sound === 'boolean') base.settings.sound = old.sound;
        if (typeof old.music === 'boolean') base.settings.music = old.music;
      }
    }
    if (!base.profile.playerId) base.profile.playerId = 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    this.data = base;
    return base;
  },

  save() { return this.adapter.write(this.key, this.data); },

  get profile() { return this.data.profile; },
  get stats() { return this.data.stats; },
  get settings() { return this.data.settings; },

  /* Записывает забег, возвращает, побит ли рекорд */
  recordRun(result, dayKey) {
    const s = this.data.stats, d = this.data;
    const isRecord = result.score > s.best;
    result.previous = s.games > 0 && s.lastDistance > 0 ? { score: s.lastScore, distance: s.lastDistance } : null;
    s.games += 1;
    s.totalApartments += result.apartments;
    s.totalDistance += result.meters;
    s.best = Math.max(s.best, result.score);
    s.bestDistance = Math.max(s.bestDistance, result.meters);
    s.bestCombo = Math.max(s.bestCombo, result.bestCombo);
    s.lastScore = result.score;
    s.lastDistance = result.meters;
    if (d.daily.day !== dayKey) d.daily = { day: dayKey, best: 0 };
    d.daily.best = Math.max(d.daily.best, result.score);
    this.save();
    return isRecord;
  },
};

/* ───────────────────────────── АНАЛИТИКА ─────────────────────────────
   События: game_started, game_finished, new_record, apartment_collected,
   apartment_rejected, obstacle_hit, combo_started, leaderboard_opened, share_clicked.
   Пока никуда не отправляются. Подключить сервис: analytics.addSink(rec => …). */
const analytics = {
  buffer: [],
  sinks: [],
  addSink(fn) { this.sinks.push(fn); },
  track(event, props) {
    const rec = { event, props: props || {}, t: Date.now(), playerId: storageService.data.profile.playerId, v: K.VERSION };
    this.buffer.push(rec);
    if (this.buffer.length > 300) this.buffer.shift();
    for (const sink of this.sinks) { try { sink(rec); } catch (e) { /* аналитика не должна ломать игру */ } }
    if (K.DEBUG) console.debug('[analytics]', event, rec.props);
  },
};

/* ───────────────────────────── TELEGRAM ───────────────────────────── */
const platform = {
  tg: null,
  touched: false,               // было ли настоящее касание: до него браузер запрещает вибрацию
  startParam: '',               // параметр ссылки: результат друга, который бросил вызов
  backHandler: null,

  init() {
    try {
      const q = new URLSearchParams(location.search);
      this.startParam = q.get('startapp') || q.get('tgWebAppStartParam') || '';
    } catch (e) { /* старый браузер */ }
    this.attach();
  },

  /* Подключение к Telegram. Вызывается ещё раз, когда догрузится SDK */
  attach() {
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (this.tg || !tg || !tg.initData) return;      // вне Telegram initData пустая
      this.tg = tg;
      const atLeast = v => (tg.isVersionAtLeast ? tg.isVersionAtLeast(v) : false);
      tg.ready();
      tg.expand();
      if (atLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();   // свайп вниз не закрывает игру, а приседает
      if (atLeast('6.1')) { tg.setHeaderColor(CONFIG.colors.ink); tg.setBackgroundColor(CONFIG.colors.ink); }
      if (atLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor(CONFIG.colors.ink);
      if (CONFIG.telegram.fullscreen && atLeast('8.0') && tg.requestFullscreen && /^(android|ios)$/.test(tg.platform || '')) {
        try { tg.requestFullscreen(); } catch (e) { /* не страшно: останемся в обычном окне */ }
      }
      const relayout = () => window.dispatchEvent(new Event('resize'));
      if (tg.onEvent) {
        for (const ev of ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged']) tg.onEvent(ev, relayout);
        tg.onEvent('backButtonClicked', () => { if (this.backHandler) this.backHandler(); });
      }
      const param = tg.initDataUnsafe && tg.initDataUnsafe.start_param;
      if (param) this.startParam = param;
    } catch (e) { /* игра работает и без Telegram */ }
  },

  inTelegram() { return !!this.tg; },

  /* Пользователь Telegram: имя для таблицы и идентификаторы для будущего сервера */
  user() {
    try { return (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) || null; } catch (e) { return null; }
  },

  /* Кнопка «Назад» в шапке Telegram */
  setBack(handler) {
    this.backHandler = handler;
    try {
      const b = this.tg && this.tg.BackButton;
      if (b) { if (handler) b.show(); else b.hide(); }
    } catch (e) { /* ок */ }
  },

  haptic(kind) {
    if (!this.touched || !storageService.data.settings.haptics) return;
    try {
      const h = this.tg && this.tg.HapticFeedback;
      if (h) {
        if (kind === 'crash') h.notificationOccurred('error');
        else if (kind === 'collect') h.notificationOccurred('success');
        else if (kind === 'bad') h.notificationOccurred('warning');
        else h.impactOccurred('light');
      } else if (navigator.vibrate && kind !== 'jump' && kind !== 'duck') {
        navigator.vibrate(kind === 'crash' ? [30, 40, 70] : 16);
      }
    } catch (e) { /* нет вибрации — не страшно */ }
  },

  /* Вызов по ссылке вида …?startapp=r_4920_2841 → { score, meters } */
  challenge() {
    const m = /^r_(\d{1,7})_(\d{1,6})$/.exec(this.startParam || '');
    return m ? { score: +m[1], meters: +m[2] } : null;
  },
};

/* ───────────────────────────── ТАБЛИЦА ЛИДЕРОВ ─────────────────────────────
   Интерфейс, под который позже подключается сервер:
     top(limit)        → { rows, player, total }
     submit(entry)     → { rank }
     entryFor(result)  → запись игрока

   Запись: { playerId, telegramUserId, username, displayName, score, distance, createdAt }

   Сейчас isMock = true: соперники сгенерированы, настоящих игроков в таблице нет,
   кроме самого игрока. На экране таблицы об этом написано. */
const MOCK_NAMES = [
  'maxxxx', 'Катя', 'Dima', 'Саша', 'Настя', 'Гоша', 'Оля', 'kvartira_hunter', 'Лена', 'Тимур', 'Маша', 'andrey_msk',
  'Вика', 'Паша', 'Юля', 'sokol_live', 'Кирилл', 'Даша', 'Рома', 'Аня', 'nikita.k', 'Соня', 'Миша', 'Полина',
  'Влад', 'Ира', 'bez_komissii', 'Женя', 'Лёша', 'Таня', 'Игорь', 'Ксюша', 'patriki_boy', 'Никита', 'Лиза', 'Денис',
  'Алина', 'Серёжа', 'Вера', 'Ваня', 'euro_treshka', 'Кристина', 'Олег', 'Наташа', 'Стас', 'Диана', 'Матвей', 'Ева',
  'Глеб', 'Арина', 'Костя', 'Мила', 'Фёдор', 'Зоя', 'Марк', 'Яна', 'Лев', 'Ника', 'Егор', 'Варя', 'Тёма', 'Рита', 'Ян', 'Уля',
];

const leaderboardService = {
  isMock: CONFIG.leaderboard.mock,
  _mock: null,

  _entries() {
    if (this._mock) return this._mock;
    const rng = makeRng(77031), n = CONFIG.leaderboard.size, names = rng.shuffle(MOCK_NAMES), list = [];
    const now = Date.now();
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const score = Math.round((15600 * Math.pow(1 - t, 2.2) + 240 + rng.range(0, 160)) / 10) * 10;
      list.push({
        playerId: 'mock_' + i, telegramUserId: null, username: null,
        displayName: names[i % names.length],
        score, distance: Math.round(score * rng.range(0.42, 0.7)),
        createdAt: new Date(now - rng.range(0, 14) * 864e5).toISOString(),
        mock: true,
      });
    }
    this._mock = list.sort((a, b) => b.score - a.score);
    return this._mock;
  },

  /* Запись текущего игрока по его лучшему результату */
  entryFor(result) {
    const p = storageService.data.profile, s = storageService.data.stats, u = platform.user();
    return {
      playerId: p.playerId,
      telegramUserId: u ? u.id : null,
      username: u ? u.username || null : null,
      displayName: p.name || TEXTS.defaultName,
      score: result ? result.score : s.best,
      distance: result ? result.meters : s.bestDistance,
      createdAt: new Date().toISOString(),
    };
  },

  async top(limit) {
    const me = this.entryFor(null);
    const all = this._entries().slice();
    if (me.score > 0) all.push(Object.assign({ isPlayer: true }, me));
    all.sort((a, b) => b.score - a.score);
    all.forEach((e, i) => { e.rank = i + 1; });
    const player = all.find(e => e.isPlayer) || null;
    return { rows: all.slice(0, limit), player, total: all.length };
  },

  /* Позже: POST на сервер. Сейчас результат и так лежит в storageService */
  async submit(entry) {
    const better = this._entries().filter(e => e.score > entry.score).length;
    return { rank: better + 1 };
  },
};

/* «Квартира дня»: заготовка. Один seed на день — один уровень у всех игроков */
const daily = {
  dayKey() { return new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); },   // дата по Москве
  seed() { let h = 2166136261; for (const ch of this.dayKey()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; },
};

/* ───────────────────────────── ПОДЕЛИТЬСЯ ───────────────────────────── */
const share = {
  text(r) {
    const best = Math.max(storageService.data.stats.best, r.score);
    return `🔑 Я добежал до квартиры: ${fmt(r.meters, ' ')} м\n${fmt(r.score, ' ')} ${plural(r.score, 'очко', 'очка', 'очков')}\nМой рекорд: ${fmt(best, ' ')}\nА ты сколько продержишься?`;
  },

  baseUrl() {
    if (CONFIG.share.url) return CONFIG.share.url;
    return /^https?:$/.test(location.protocol) ? location.origin + location.pathname : '';
  },

  /* Ссылка с результатом: друг откроет игру и увидит, какой счёт надо побить */
  link(r) {
    const base = this.baseUrl();
    if (!base) return '';
    return `${base}${base.includes('?') ? '&' : '?'}startapp=r_${Math.round(r.score)}_${Math.round(r.meters)}`;
  },

  async copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* пробуем по-старому */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  },

  /* Пробует по очереди: Telegram → системное «Поделиться» → буфер обмена → ссылка t.me */
  async send(result) {
    const text = this.text(result), url = this.link(result);
    const tgLink = url ? `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` : '';
    if (platform.inTelegram() && tgLink) {
      try { platform.tg.openTelegramLink(tgLink); return 'telegram'; } catch (e) { /* дальше */ }
    }
    if (navigator.share) {
      try { await navigator.share(url ? { text, url } : { text }); return 'shared'; }
      catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
    }
    if (await this.copy(url ? `${text}\n${url}` : text)) return 'copied';
    if (tgLink) {
      try {
        const win = window.open(tgLink, '_blank');      // null — если браузер заблокировал окно
        if (win) { win.opener = null; return 'telegram'; }
      } catch (e) { /* дальше */ }
    }
    return 'failed';
  },
};

K.storage = storageService;
K.analytics = analytics;
K.platform = platform;
K.leaderboard = leaderboardService;
K.daily = daily;
K.share = share;

})(window.KTM = window.KTM || {});
