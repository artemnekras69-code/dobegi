/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — аркада для Telegram-канала KeysToMoscow

   Оглавление
     1. CONFIG            весь баланс, размеры и цвета — менять здесь
     2. TEXTS             все надписи и шутки
     3. Утилиты
     4. Storage           рекорды в localStorage
     5. Platform          Telegram WebApp, вибрация
     6. Services          заготовки: рейтинг, «Квартира дня», объявления
     7. Share             «Поделиться рекордом»
     8. AudioSystem       звуки через Web Audio API
     9. ParticleSystem
    10. Art               ключ, препятствия, карточка квартиры
    11. Player
    12. Obstacle, Apartment
    13. CollisionSystem
    14. ScoreSystem
    15. LevelGenerator    процедурная генерация без тупиков
    16. Background        Москва с параллаксом
    17. UI
    18. Game
   ===================================================================== */
(() => {
'use strict';

/* ───────────────────────────── 1. CONFIG ───────────────────────────── */
const CONFIG = {
  /* Экран. Мир измеряется в «юнитах». На телефоне по ширине видно 520 юнитов,
     на большом экране — до 900. 10 юнитов = 1 метр дистанции. */
  view: { minWidth: 520, maxWidth: 900, minHeight: 360, sceneHeight: 700, minBand: 70, maxBandRatio: 0.36, maxDpr: 2 },
  unitsPerMeter: 10,

  /* Скорость, юнитов в секунду */
  speed: {
    start: 290,                 // стартовая
    max: 650,                   // максимальная
    // Ускорение: [дистанция в метрах, доля пути от start до max]. Между точками — плавно.
    ramp: [[500, 0.17], [1500, 0.39], [3000, 0.61], [5000, 0.81], [10000, 1]],
    narrowScreenFactor: 0.8,    // на узком экране обзор меньше, поэтому мир едет медленнее
  },

  /* Игрок и прыжок */
  player: {
    xRatio: 0.16, xMin: 64, xMax: 150,   // где стоит на экране
    scale: 1,                            // размер спрайта
    hitWidth: 24, hitHeight: 48,         // зона столкновений (меньше спрайта — так честнее)
    gravity: 2700,                       // гравитация
    jumpVelocity: 840,                   // сила прыжка
    jumpBuffer: 0.13,                    // сек: тап чуть раньше приземления всё равно сработает
  },

  /* Генератор уровня */
  generator: {
    firstItemDelay: 2.1,        // сек спокойного бега до первого препятствия
    reaction: [0.52, 0.24],     // сек запаса между объектами: в начале → на максимальной скорости
    extraGap: [1.15, 0.42],     // сек случайной прибавки к промежутку: в начале → на максимуме
    breatherChance: 0.08,       // шанс длинной передышки
    breatherTime: 0.8,          // сек
    minJumpWindow: 0.17,        // сек: препятствие появляется, только если окно для прыжка не уже
    intro: ['box', 'apartment', 'barrier', 'box', 'cash'],   // первые объекты всегда одни и те же
    introGap: 0.35,             // сек прибавки между ними: ровный, предсказуемый ритм
  },

  /* Препятствия. w/h — размер, from — с какой дистанции (м), weight — частота.
     vx — собственная скорость навстречу игроку. */
  obstacles: [
    { id: 'box',       w: 38, h: 34, from: 0,    weight: 10, messages: ['Переезд. Опять. Третий раз за год', 'Коробки прошлого жильца. Хозяин просил не трогать'] },
    { id: 'barrier',   w: 52, h: 42, from: 0,    weight: 10, messages: ['Хозяин решил сделать ремонт за твой счёт'] },
    { id: 'cash',      w: 44, h: 46, from: 120,  weight: 9,  messages: ['+100% комиссии'] },
    { id: 'vacuum',    w: 46, h: 38, from: 220,  weight: 6,  messages: ['Клининг перед выездом — тоже за твой счёт'] },
    { id: 'block',     w: 64, h: 30, from: 350,  weight: 7,  messages: ['Вид из окна: стройка до 2031 года'] },
    { id: 'realtor',   w: 32, h: 64, from: 450,  weight: 8,  inset: [6, 6], messages: ['А комиссия 100%', 'Агент: «Эта ушла, но есть похожая. Дороже»'] },
    { id: 'boxStack',  w: 40, h: 62, from: 600,  weight: 6,  messages: ['Переезд. Опять. Третий раз за год'] },
    { id: 'dog',       w: 46, h: 30, from: 700,  weight: 6,  vx: 90, inset: [6, 6], messages: ['С животными нельзя. Это собака хозяина'] },
    { id: 'turnstile', w: 48, h: 47, from: 800,  weight: 7,  messages: ['До метро 7 минут. Ты не успел', 'Турникет закрылся. На «Тройке» пусто'] },
    { id: 'boxPair',   w: 72, h: 36, from: 1300, weight: 5,  messages: ['Коробки прошлого жильца. Хозяин просил не трогать'] },
  ],
  obstacleInset: [5, 5],        // на сколько зона столкновения меньше картинки: по бокам и сверху

  /* Квартиры */
  apartments: {
    width: 150, height: 104,    // размер карточки
    floatHeight: 70,            // высота нижнего края над землёй: стоя не задеть, в прыжке — собрать
    minObstaclesBetween: 4,     // минимум препятствий между квартирами
    maxObstaclesBetween: 9,     // максимум
    chance: 0.28,               // шанс квартиры после минимума
    badFrom: 300,               // с какой дистанции появляются плохие объявления (м)
    jackpotFrom: 800,           // с какой — джекпоты
    eventFrom: 600,             // с какой — «собственник передумал» и «цена выросла»
    vanishChance: 0.09,
    priceUpChance: 0.09,
    weights: { common: 50, good: 26, rare: 9, jackpot: 3, bad: 22 },
  },

  /* Очки */
  score: {
    metersStep: 10, pointsPerStep: 10,   // каждые 10 метров +10 очков
    common: 100, good: 250, rare: 500, jackpot: 1000, bad: -300,
  },

  /* Районы: фон меняется по дистанции */
  districts: [
    { id: 'sleep',   from: 0,     name: 'СПАЛЬНЫЙ РАЙОН',      short: 'Спальный',  note: '',
      sky: ['#F7F7F7', '#ECEEF0'], cloud: '#FFFFFF', far: '#E3E5E8', back: '#D9DCE0', front: '#CACED4', win: '#B7BCC4', lit: '#FFFFFF', prop: '#AEB3BB', leaf: '#C4CFB5' },
    { id: 'dense',   from: 1000,  name: 'ПЛОТНАЯ ЗАСТРОЙКА',   short: 'Плотная застройка', note: 'дома ближе, цены выше',
      sky: ['#F5F6F8', '#E4E7EC'], cloud: '#FFFFFF', far: '#DBDEE3', back: '#CDD1D7', front: '#BDC2C9', win: '#A7ADB6', lit: '#FFFFFF', prop: '#A3A9B2', leaf: '#BDC9AD' },
    { id: 'center',  from: 2500,  name: 'ЦЕНТР МОСКВЫ',        short: 'Центр',     note: 'здесь даже студия — 120 000 ₽',
      sky: ['#FAF6EC', '#EFE7D6'], cloud: '#FFFFFF', far: '#E2D9C7', back: '#D8CDB8', front: '#CBBEA5', win: '#B1A287', lit: '#FFF6D6', prop: '#B0A38A', leaf: '#C2CAA3' },
    { id: 'premium', from: 5000,  name: 'ПРЕМИАЛЬНАЯ МОСКВА',  short: 'Премиум',   note: 'залог — как первый взнос по ипотеке',
      sky: ['#F6F9EA', '#E5EDC2'], cloud: '#FFFFFF', far: '#D3DCB4', back: '#CBD0D7', front: '#B8BFC8', win: '#9DA5B0', lit: '#D3F44E', prop: '#A2A9B3', leaf: '#BBCA95' },
    { id: 'absurd',  from: 10000, name: 'ЗОНА ПЕНТХАУСОВ',     short: 'Пентхаусы', note: 'дальше только пентхаусы', toast: 'ТЫ ЗАШЁЛ СЛИШКОМ ДАЛЕКО',
      sky: ['#D3F44E', '#E7FA9E'], cloud: '#FFFFFF', far: '#C0E233', back: '#FFFFFF', front: '#F4F4F4', win: '#DCE6B4', lit: '#D3F44E', prop: '#FFFFFF', leaf: '#AFD228' },
  ],

  /* Цвета. Первые пять — из брендбука KeysToMoscow */
  colors: {
    ink: '#1C1C1C', ink2: '#323232', paper: '#F7F7F7', white: '#FFFFFF', lime: '#D3F44E',
    danger: '#FF4D3D',          // всё плохое: препятствия, комиссия, плохие объявления
    dangerSoft: '#FFEFEC',
    skin: '#F2C6A0',
    kraft: '#D8B384', kraftLight: '#EBD2AC',
    concrete: '#C9C9C9',
    sidewalk: '#E3E3E3', sidewalkJoint: '#CDCDCD',
    muted: '#6F6F6F',
  },

  /* Интерфейс */
  ui: {
    autoStartDelay: 1.8,        // сек до автостарта с первого экрана
    gameOverDelay: 1.05,        // сек анимации падения до экрана «Тебя опередили»
    restartGuard: 0.4,          // сек, пока кнопки на экране конца игры не нажимаются (защита от случайного тапа)
    jokeEvery: [450, 800],      // раз в сколько метров появляется фоновая шутка
    hintGames: 3,               // сколько первых партий показывать подсказки
  },

  /* «Ты лучше, чем N% игроков». Пока сервера нет — это локальная оценка по формуле:
     N = 100 * (1 - exp(-(очки / scale) ^ power)). С рейтингом заменится на реальные данные. */
  percentile: { scale: 5200, power: 0.9 },

  audio: { volume: 0.9, musicVolume: 0.45, bpm: 118 },

  /* Ссылка на игру для кнопки «Поделиться»: Mini App в Telegram. Пусто — возьмётся адрес страницы. */
  share: { url: 'https://t.me/KeysToGameBot/run' },

  storageKey: 'ktm.runner.v1',
};

/* ───────────────────────────── 2. TEXTS ───────────────────────────── */
const TEXTS = {
  headlines: ['Тебя опередили', 'Тебя опередили', 'Квартира ушла', 'Не в этот раз'],
  collected: 'Квартира снята',
  jackpot: 'Джекпот! Квартира снята',
  hot: 'ГОРЯЧИЙ ВАРИАНТ',
  record: 'Новый рекорд! 🔥',
  bad: [['Ты попался', 'комиссия 100%'], ['За это ты ещё и комиссию заплатишь', '']],
  vanish: [['Уже сдали', 'собственник передумал'], ['Квартиру сняли', 'за 4 минуты до тебя'], ['Собственник не отвечает', 'был в сети вчера']],
  priceUp: ['Цена выросла на 5 000 ₽', 'пока ты бежал'],
  missed: [['Квартиру уже сняли', ''], ['Ушла другому', 'он просто прыгнул']],
  jokes: [
    ['Агент пишет: «Актуально?»', ''],
    ['Фото сделаны в 2017 году', ''],
    ['До метро 7 минут', 'на машине в 03:40'],
    ['Собственник перестал отвечать', ''],
    ['Залог — два месяца', 'и последний месяц вперёд'],
    ['Просмотр сегодня в 14:00', 'вместе с одиннадцатью другими'],
    ['Евроремонт', '2004 года'],
    ['Тихие соседи', 'перфоратор с 9:00'],
    ['Счётчики оплачиваются отдельно', ''],
    ['С животными нельзя', 'с детьми тоже. и с гостями'],
  ],
  hintJump: ['Тапни — прыжок', 'Пробел — прыжок'],
  hintFlat: 'Прыгни в карточку — сними квартиру',
  hintBad: 'Комиссия 100% — беги мимо',
  kiosks: ['ШАУРМА', 'ЦВЕТЫ 24', 'КЛЮЧИ', 'КОФЕ', 'АПТЕКА', 'ПРОДУКТЫ'],
  billboards: [['СДАЁТСЯ', 'без комиссии*'], ['ЕВРОРЕМОНТ', '2004 года'], ['ДО МЕТРО', '7 минут*'], ['ФОТО', '2017 года'], ['АКТУАЛЬНО?', 'звоните'], ['УЮТНАЯ', 'студия 11 м²'], ['БЕЗ ЗАЛОГА*', '*с залогом']],
  billboardsAbsurd: [['ПЕНТХАУС', '2 000 000 ₽/мес'], ['КОМИССИЯ', 'всего 300%'], ['ВИД НА ВИД', 'из окна в окно']],
};

/* ───────────────────────────── 3. УТИЛИТЫ ───────────────────────────── */
const TAU = Math.PI * 2;
const DEBUG = /[?&]debug\b/.test(location.search);
const FONT = {
  display: '"Unbounded", "Arial Black", "Segoe UI", system-ui, sans-serif',
  text: '"Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};
const C = CONFIG.colors;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = (n, sep = ' ') => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  return b === 1 ? one : many;
};

/* Генератор случайных чисел с зерном: один и тот же seed даёт один и тот же уровень */
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
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
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

/* Когда прыжок выше заданной высоты: t1 — на подъёме, t2 — на спуске, air — весь полёт */
function jumpTimes(height) {
  const P = CONFIG.player;
  const disc = P.jumpVelocity * P.jumpVelocity - 2 * P.gravity * height;
  if (disc <= 0) return null;
  const root = Math.sqrt(disc);
  return { t1: (P.jumpVelocity - root) / P.gravity, t2: (P.jumpVelocity + root) / P.gravity, air: 2 * P.jumpVelocity / P.gravity };
}

/* ───────────────────────────── 4. STORAGE ───────────────────────────── */
class Storage {
  constructor(key) {
    this.key = key;
    this.data = {
      best: 0,                  // лучший результат в очках
      bestDistance: 0,          // максимальная дистанция, м
      bestApartments: 0,        // максимум квартир за забег
      totalApartments: 0,       // всего собрано квартир
      games: 0,                 // сыграно партий
      sound: true,
      music: false,             // музыка по умолчанию выключена
      hints: { flat: 0, bad: 0 },
      daily: { day: '', best: 0 },
    };
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      if (raw && typeof raw === 'object') {
        Object.assign(this.data, raw);
        this.data.hints = Object.assign({ flat: 0, bad: 0 }, raw.hints);
        this.data.daily = Object.assign({ day: '', best: 0 }, raw.daily);
      }
    } catch (e) { /* хранилище недоступно — играем без сохранения */ }
  }

  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* не страшно */ }
  }

  /* Записывает забег, возвращает, побит ли рекорд */
  recordRun(result, dayKey) {
    const d = this.data;
    const isRecord = result.score > d.best;
    d.games += 1;
    d.totalApartments += result.apartments;
    d.best = Math.max(d.best, result.score);
    d.bestDistance = Math.max(d.bestDistance, result.meters);
    d.bestApartments = Math.max(d.bestApartments, result.apartments);
    if (d.daily.day !== dayKey) d.daily = { day: dayKey, best: 0 };
    d.daily.best = Math.max(d.daily.best, result.score);
    this.save();
    return isRecord;
  }
}

/* ───────────────────────────── 5. PLATFORM ───────────────────────────── */
const Platform = {
  tg: null,
  touched: false,               // было ли настоящее касание: до него браузер запрещает вибрацию

  init() {
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (this.tg || !tg || !tg.initData) return;      // вне Telegram initData пустая
      this.tg = tg;
      const atLeast = v => (tg.isVersionAtLeast ? tg.isVersionAtLeast(v) : false);
      tg.ready();
      tg.expand();
      if (atLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();   // свайп вниз не закрывает игру
      if (atLeast('6.1')) { tg.setHeaderColor(C.ink); tg.setBackgroundColor(C.ink); }
      if (tg.onEvent) tg.onEvent('viewportChanged', () => window.dispatchEvent(new Event('resize')));
    } catch (e) { /* игра работает и без Telegram */ }
  },

  inTelegram() { return !!this.tg; },

  /* Пользователь Telegram: пригодится для рейтинга */
  user() {
    try { return (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) || null; } catch (e) { return null; }
  },

  haptic(kind) {
    if (!this.touched) return;
    try {
      const h = this.tg && this.tg.HapticFeedback;
      if (h) {
        if (kind === 'crash') h.notificationOccurred('error');
        else if (kind === 'collect') h.notificationOccurred('success');
        else h.impactOccurred('light');
      } else if (navigator.vibrate && kind !== 'jump') {
        navigator.vibrate(kind === 'crash' ? [30, 40, 70] : 16);
      }
    } catch (e) { /* нет вибрации — не страшно */ }
  },
};

/* ───────────────────────────── 6. SERVICES ─────────────────────────────
   Сейчас всё локально. Здесь появятся запросы к серверу:
   глобальный рейтинг, «Квартира дня», реальные объявления из канала. */
const Services = {
  listings: {
    all() { return Array.isArray(window.APARTMENTS) ? window.APARTMENTS : []; },
  },

  leaderboard: {
    /* Оценка по формуле. Позже — доля игроков с результатом ниже, с сервера */
    percentile(score) {
      const P = CONFIG.percentile;
      return clamp(Math.round(100 * (1 - Math.exp(-Math.pow(score / P.scale, P.power)))), 1, 99);
    },
    /* Позже: отправка результата вместе с Platform.user().id */
    async submit(result) { return result; },
  },

  daily: {
    dayKey() { return new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); },   // дата по Москве
    /* Зерно дня: если передать его в игру (game.seed), у всех будет один и тот же уровень */
    seed() { let h = 2166136261; for (const ch of this.dayKey()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; },
    featured() { const list = Services.listings.all(); return list.length ? list[this.seed() % list.length] : null; },
    /* Позже: общий рекорд дня с сервера. Пока — свой лучший результат за сегодня */
    async record(storage) { const d = storage.data.daily; return d.day === this.dayKey() ? d.best : 0; },
  },
};

/* ───────────────────────────── 7. SHARE ───────────────────────────── */
const Share = {
  text(r) {
    const meters = `${fmt(r.meters, ' ')} ${plural(r.meters, 'метр', 'метра', 'метров')}`;
    const flats = r.apartments > 0
      ? `Собрал ${r.apartments} ${plural(r.apartments, 'квартиру', 'квартиры', 'квартир')} и обошёл ${r.percentile}% игроков.`
      : `Не снял ни одной квартиры, но обошёл ${r.percentile}% игроков.`;
    return `🔑 Я пробежал ${meters} в «Добеги до квартиры».\n${flats}\nА ты сколько продержишься?`;
  },

  url() {
    if (CONFIG.share.url) return CONFIG.share.url;
    return /^https?:$/.test(location.protocol) ? location.origin + location.pathname : '';
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
    const text = this.text(result), url = this.url();
    const tgLink = url ? `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` : '';
    if (Platform.inTelegram() && tgLink) {
      try { Platform.tg.openTelegramLink(tgLink); return 'telegram'; } catch (e) { /* дальше */ }
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

/* ───────────────────────────── 8. AUDIO ───────────────────────────── */
const MUSIC = {
  // Петля из 16 восьмых: бас и редкая мелодия. 0 — пауза.
  bass: [110, 0, 110, 164.81, 110, 0, 130.81, 146.83, 87.31, 0, 87.31, 130.81, 98, 0, 98, 146.83],
  lead: [659.25, 0, 0, 587.33, 0, 523.25, 0, 0, 440, 0, 523.25, 0, 587.33, 0, 0, 0,
         659.25, 0, 0, 783.99, 0, 659.25, 0, 0, 523.25, 0, 440, 0, 392, 0, 0, 0],
};

/* Все звуки синтезируются на лету, без аудиофайлов */
const SOUNDS = {
  jump(a) { a.tone({ freq: 360, to: 640, dur: 0.13, vol: 0.16 }); },
  land(a) { a.noise({ dur: 0.05, vol: 0.05, from: 500, to: 180 }); },
  collect(a) {
    a.tone({ freq: 784, dur: 0.08, vol: 0.16 });
    a.tone({ freq: 1175, dur: 0.16, vol: 0.16, delay: 0.07 });
  },
  bonus(a) {
    [784, 988, 1175, 1568].forEach((f, i) => a.tone({ freq: f, dur: i === 3 ? 0.28 : 0.09, vol: 0.15, delay: i * 0.07 }));
    a.tone({ freq: 3136, type: 'sine', dur: 0.3, vol: 0.05, delay: 0.24 });
  },
  bad(a) {
    a.tone({ freq: 196, to: 98, type: 'sawtooth', dur: 0.24, vol: 0.13 });
    a.tone({ freq: 147, to: 73, type: 'square', dur: 0.26, vol: 0.07, delay: 0.09 });
  },
  vanish(a) { a.tone({ freq: 720, to: 260, type: 'sine', dur: 0.2, vol: 0.12 }); },
  crash(a) {
    a.noise({ dur: 0.3, vol: 0.34, from: 1800, to: 110 });
    a.tone({ freq: 150, to: 44, type: 'sine', dur: 0.32, vol: 0.32 });
  },
  record(a) {
    [523, 659, 784, 1047, 1319].forEach((f, i) => a.tone({ freq: f, dur: i === 4 ? 0.4 : 0.1, vol: 0.15, delay: i * 0.085 }));
    a.tone({ freq: 1047, dur: 0.4, vol: 0.08, delay: 0.34 });
  },
  district(a) { a.noise({ dur: 0.35, vol: 0.06, from: 300, to: 3000 }); a.tone({ freq: 440, to: 660, dur: 0.22, vol: 0.08, delay: 0.05 }); },
  click(a) { a.tone({ freq: 520, type: 'square', dur: 0.04, vol: 0.05 }); },
};

class AudioSystem {
  constructor(storage) {
    this.storage = storage;
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.noiseBuffer = null;
    this.musicTimer = null;
    this.step = 0;
    this.nextTime = 0;
  }

  /* Браузеры разрешают звук только после первого касания — вызывается из обработчика ввода */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = CONFIG.audio.volume;
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = CONFIG.audio.musicVolume;
        this.musicBus.connect(this.master);
        const len = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, len, len);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.syncMusic();
    } catch (e) { /* без звука */ }
  }

  suspend() { try { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); } catch (e) { /* ок */ } }
  resume() { try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { /* ок */ } }

  tone({ freq, to = 0, type = 'triangle', dur = 0.1, vol = 0.15, delay = 0, out = null }) {
    const c = this.ctx, t = c.currentTime + delay;
    const osc = c.createOscillator(), gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(out || this.master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  noise({ dur = 0.2, vol = 0.2, from = 1200, to = 200, delay = 0, out = null }) {
    const c = this.ctx, t = c.currentTime + delay;
    const src = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    src.buffer = this.noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out || this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.03);
  }

  play(name) {
    if (!this.storage.data.sound || !this.ctx) return;
    try { SOUNDS[name](this); } catch (e) { /* без звука */ }
  }

  /* Музыка: простой шаговый секвенсор */
  syncMusic() {
    const on = this.storage.data.music && this.ctx;
    if (on && !this.musicTimer) {
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.musicTimer = setInterval(() => this._schedule(), 40);
    } else if (!on && this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  _schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const stepDur = 60 / CONFIG.audio.bpm / 2;
    if (this.nextTime < c.currentTime) this.nextTime = c.currentTime + 0.05;   // вкладка спала
    try {
      while (this.nextTime < c.currentTime + 0.14) {
        const delay = this.nextTime - c.currentTime;
        const bass = MUSIC.bass[this.step % 16], lead = MUSIC.lead[this.step % 32];
        if (bass) this.tone({ freq: bass, dur: stepDur * 0.92, vol: 0.2, delay, out: this.musicBus });
        if (lead) this.tone({ freq: lead, type: 'square', dur: stepDur * 0.8, vol: 0.035, delay, out: this.musicBus });
        if (this.step % 2 === 1) this.noise({ dur: 0.03, vol: 0.05, from: 9000, to: 5000, delay, out: this.musicBus });
        this.nextTime += stepDur;
        this.step++;
      }
    } catch (e) { /* без музыки */ }
  }
}

/* ───────────────────────────── 9. PARTICLES ───────────────────────────── */
class ParticleSystem {
  constructor() { this.items = []; }
  clear() { this.items.length = 0; }

  emit(p) {
    if (this.items.length > 240) this.items.shift();
    this.items.push(Object.assign({
      x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 0.6, age: 0, size: 4, color: C.ink,
      shape: 'circle', rot: 0, vr: 0, alpha: 1, grow: 0, width: 3, world: true, floor: null, fade: true,
    }, p));
  }

  update(dt, dx) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.age += dt;
      if (p.age >= p.life) {
        if (p.done) p.done();
        items.splice(i, 1);
        continue;
      }
      if (p.shape === 'fly') continue;                 // летит по своей траектории
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      p.vy += p.g * dt;
      p.x += p.vx * dt - (p.world ? dx : 0);
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.floor !== null && p.y > p.floor) { p.y = p.floor; p.vy *= -0.42; p.vx *= 0.7; p.vr *= 0.6; }
    }
  }

  draw(ctx) {
    for (const p of this.items) {
      const k = p.age / p.life;
      ctx.globalAlpha = clamp((p.fade ? 1 - k * k : 1) * p.alpha, 0, 1);
      switch (p.shape) {
        case 'circle':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + k * p.grow), 0, TAU);
          ctx.fill();
          break;
        case 'ring':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.5, p.width * (1 - k));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + k * p.grow, 0, TAU);
          ctx.stroke();
          break;
        case 'rect':
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
          ctx.restore();
          break;
        case 'key':
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          Art.key(ctx, p.size, p.color, true);
          ctx.restore();
          break;
        case 'fly': {
          const e = k * k * (3 - 2 * k);
          const x = lerp(p.x, p.tx, e), y = lerp(p.y, p.ty, e) - Math.sin(Math.PI * k) * 46;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(k * 7);
          Art.key(ctx, p.size * (1 - k * 0.35), p.color, true);
          ctx.restore();
          break;
        }
        case 'text': {
          const pop = 1 + 0.5 * Math.max(0, 1 - k * 7);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(pop, pop);
          ctx.font = `900 ${p.size}px ${FONT.display}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 5;
          ctx.strokeStyle = p.outline || C.ink;
          ctx.strokeText(p.text, 0, 0);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, 0, 0);
          ctx.restore();
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

/* ───────────────────────────── 10. ART ───────────────────────────── */
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

const Art = {
  /* Ключ в духе логотипа: головка в начале координат, бородка вправо */
  key(ctx, s, color, outline) {
    ctx.beginPath();
    dot(ctx, 0, 0, s * 0.56);
    ctx.rect(s * 0.3, -s * 0.16, s * 1.15, s * 0.32);
    ctx.rect(s * 0.86, s * 0.1, s * 0.2, s * 0.34);
    ctx.rect(s * 1.2, s * 0.1, s * 0.2, s * 0.26);
    if (outline) {
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
  },

  cardboard(ctx, x, w, h) {
    ctx.lineJoin = 'round';
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
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  },
};

/* Препятствия. Каждое рисуется от левого нижнего угла, y вверх — минус.
   size — «родной» размер рисунка; реальный задаётся в CONFIG.obstacles. */
const ObstacleArt = {
  box: { size: [38, 34], draw(ctx) { Art.cardboard(ctx, 0, 38, 34); } },

  boxStack: {
    size: [40, 62],
    draw(ctx) {
      Art.cardboard(ctx, 0, 40, 34);
      ctx.save();
      ctx.translate(5, -33);
      ctx.rotate(-0.04);
      Art.cardboard(ctx, 0, 31, 28);
      ctx.restore();
    },
  },

  boxPair: { size: [72, 36], draw(ctx) { Art.cardboard(ctx, 0, 37, 36); Art.cardboard(ctx, 38, 34, 29); } },

  barrier: {
    size: [52, 42],
    draw(ctx, o) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, -22); ctx.lineTo(5, -1.5);
      ctx.moveTo(10, -22); ctx.lineTo(15, -1.5);
      ctx.moveTo(42, -22); ctx.lineTo(37, -1.5);
      ctx.moveTo(42, -22); ctx.lineTo(47, -1.5);
      ctx.stroke();
      ctx.save();
      rr(ctx, 1.25, -37.5, 49.5, 17, 3);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.clip();
      stripes(ctx, 0, -38, 52, 18, 13, C.danger);
      ctx.restore();
      rr(ctx, 1.25, -37.5, 49.5, 17, 3);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = Math.sin(o.t * 9) > 0 ? C.danger : '#8E2B22';
      ctx.beginPath();
      ctx.arc(9, -39.5, 3, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },

  cash: {
    size: [44, 46],
    draw(ctx) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 4; i++) {
        rr(ctx, 1.2 + (i % 2) * 2.5, -i * 6 - 8.2, 39, 7.4, 2);
        ctx.fillStyle = i % 2 ? '#ECECEC' : C.white;
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = C.danger;
      ctx.fillRect(18, -25, 8, 23.6);
      ctx.beginPath();
      ctx.arc(22, -33, 12, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.font = `900 14px ${FONT.display}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₽', 22, -32.2);
    },
  },

  vacuum: {
    size: [46, 38],
    draw(ctx) {
      ctx.strokeStyle = C.ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(25, -19);
      ctx.bezierCurveTo(23, -42, 12, -41, 9, -30);
      ctx.stroke();
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(9, -30);
      ctx.lineTo(6, -5);
      ctx.stroke();
      rr(ctx, 0.5, -6, 14, 6, 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
      rr(ctx, 16, -22.5, 29, 18.5, 8);
      ctx.fillStyle = C.danger;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.stroke();
      rr(ctx, 30, -18, 10, 4, 2);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(37, -6.2, 6, 0, TAU);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(37, -6.2, 2, 0, TAU);
      ctx.fillStyle = '#8A8A8A';
      ctx.fill();
    },
  },

  dog: {
    size: [46, 30],
    draw(ctx, o) {
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
      rr(ctx, 11, -23 + bob, 31, 13, 6.5);
      ctx.fill();
      ctx.beginPath();
      dot(ctx, 10, -21.5 + bob, 7.5);
      ctx.fill();
      rr(ctx, -0.5, -22 + bob, 9, 6.5, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9, -27.5 + bob);
      ctx.lineTo(16.5, -31 + bob);
      ctx.lineTo(16.5, -22 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.danger;
      ctx.fillRect(16, -26.5 + bob, 3, 10.5);
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.arc(7.5, -23.5 + bob, 1.5, 0, TAU);
      ctx.fill();
    },
  },

  realtor: {
    size: [32, 64],
    draw(ctx, o) {
      const sway = Math.sin(o.t * 5) * 0.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = C.ink;
      ctx.fillRect(10, -24, 5.5, 22);
      ctx.fillRect(17.5, -24, 5.5, 22);
      rr(ctx, 5.5, -4.5, 10.5, 4.5, 2); ctx.fill();
      rr(ctx, 13.5, -4.5, 10.5, 4.5, 2); ctx.fill();
      rr(ctx, 7, -46, 19, 24, 5);
      ctx.fillStyle = C.ink2;
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.beginPath();
      poly(ctx, [11.5, -46, 20, -46, 15.7, -35]);
      ctx.fill();
      ctx.fillStyle = C.danger;
      ctx.beginPath();
      poly(ctx, [14.6, -45.5, 16.8, -45.5, 17.4, -38, 15.7, -35, 14, -38]);
      ctx.fill();
      // папка с договором — со стороны игрока
      rr(ctx, 0.8, -40, 10, 14, 2);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(9.5, -43); ctx.lineTo(6.5, -33);
      ctx.stroke();
      // голова
      ctx.fillStyle = C.skin;
      ctx.beginPath();
      ctx.arc(16, -54.5 + sway, 7.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(16, -55.5 + sway, 7.7, Math.PI, TAU);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12.5, -53.5 + sway, 1, 0, TAU);
      ctx.fill();
      // рука с телефоном
      ctx.beginPath();
      ctx.moveTo(24, -43); ctx.lineTo(28.5, -46.5); ctx.lineTo(23.5, -52.5 + sway);
      ctx.stroke();
      rr(ctx, 21.5, -58 + sway, 4, 8.5, 1.2);
      ctx.fill();
    },
  },

  turnstile: {
    size: [48, 47],
    draw(ctx, o) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(5, -41, 38, 3);
      ctx.fillStyle = C.ink2;
      rr(ctx, 0, -40, 12, 40, 3); ctx.fill();
      rr(ctx, 36, -40, 12, 40, 3); ctx.fill();
      ctx.fillStyle = C.danger;
      rr(ctx, 12.5, -32, 10.5, 20, 2); ctx.fill();
      rr(ctx, 25, -32, 10.5, 20, 2); ctx.fill();
      ctx.globalAlpha = Math.sin(o.t * 8) > 0 ? 1 : 0.35;
      ctx.beginPath();
      dot(ctx, 6, -31, 2.2);
      dot(ctx, 42, -31, 2.2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(24, -39, 8, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.ink;
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.font = `900 9px ${FONT.display}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('М', 24, -38.4);
    },
  },

  block: {
    size: [64, 30],
    draw(ctx) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(16, -25, 4.2, Math.PI, 0);
      ctx.moveTo(52.2, -25);
      ctx.arc(48, -25, 4.2, 0, Math.PI, true);
      ctx.stroke();
      ctx.save();
      rr(ctx, 1.25, -25.5, 61.5, 24.25, 3);
      ctx.fillStyle = C.concrete;
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = C.white;
      ctx.fillRect(0, -17, 64, 9);
      stripes(ctx, 0, -17, 64, 9, 12, C.danger);
      ctx.restore();
      rr(ctx, 1.25, -25.5, 61.5, 24.25, 3);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    },
  },
};

/* Оформление карточек по типам */
const CARD_STYLES = {
  common:  { bg: C.white,      fg: C.ink,   sub: C.muted,   price: C.ink,    border: C.ink,    shadow: C.ink,    badge: C.ink,    badgeKey: C.lime },
  good:    { bg: C.white,      fg: C.ink,   sub: C.muted,   price: C.ink,    border: C.ink,    shadow: C.ink,    badge: C.lime,   badgeKey: C.ink },
  rare:    { bg: C.ink,        fg: C.white, sub: '#A9A9A9', price: C.lime,   border: C.ink,    shadow: C.lime,   badge: C.lime,   badgeKey: C.ink },
  jackpot: { bg: C.lime,       fg: C.ink,   sub: '#4B5714', price: C.ink,    border: C.ink,    shadow: C.ink,    badge: C.ink,    badgeKey: C.lime },
  bad:     { bg: C.dangerSoft, fg: C.ink,   sub: C.muted,   price: C.danger, border: C.danger, shadow: C.danger, badge: C.danger, badgeKey: C.white },
};

/* Карточка квартиры. Рисуется от левого верхнего угла в «родном» размере 150×104 */
function drawApartmentCard(ctx, a) {
  const W = 150, H = 104, st = CARD_STYLES[a.tier];
  rr(ctx, 4, 5, W, H, 14);
  ctx.fillStyle = st.shadow;
  ctx.fill();
  rr(ctx, 0, 0, W, H, 14);
  ctx.fillStyle = st.bg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = st.border;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = st.fg;
  ctx.font = `800 13px ${FONT.display}`;
  ctx.fillText(a.title, 12, 25);
  ctx.fillStyle = st.sub;
  ctx.font = `700 10.5px ${FONT.text}`;
  ctx.fillText(a.subtitle, 12, 40, W - 24);
  ctx.fillStyle = st.price;
  ctx.font = `900 17px ${FONT.display}`;
  ctx.fillText(a.priceText, 12, 64, W - 22);

  // плашка про комиссию
  const pill = a.pill;
  ctx.font = `800 8px ${FONT.display}`;
  const pw = Math.min(W - 22, ctx.measureText(pill.text).width + 16);
  rr(ctx, 11, 74, pw, 19, 9.5);
  ctx.fillStyle = pill.bg;
  ctx.fill();
  if (pill.stroke) { ctx.lineWidth = 1.5; ctx.strokeStyle = pill.stroke; ctx.stroke(); }
  ctx.fillStyle = pill.fg;
  ctx.textBaseline = 'middle';
  ctx.fillText(pill.text, 19, 84, pw - 14);

  // значок в углу: ключ у хороших, «!» у плохих
  ctx.beginPath();
  ctx.arc(W - 9, 9, 12.5, 0, TAU);
  ctx.fillStyle = st.badge;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = a.tier === 'bad' ? C.danger : C.ink;
  ctx.stroke();
  if (a.tier === 'bad') {
    ctx.fillStyle = C.white;
    ctx.font = `900 15px ${FONT.display}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', W - 9, 9.8);
  } else {
    ctx.save();
    ctx.translate(W - 12.5, 12.5);
    ctx.rotate(-0.78);
    Art.key(ctx, 7.5, st.badgeKey, false);
    ctx.beginPath();
    ctx.arc(-7.5 * 0.14, 0, 7.5 * 0.17, 0, TAU);
    ctx.fillStyle = st.badge;
    ctx.fill();
    ctx.restore();
  }
}

/* ───────────────────────────── 11. PLAYER ───────────────────────────── */
class Player {
  constructor(game) {
    this.game = game;
    this.x = 100;
    this.reset();
  }

  reset() {
    this.h = 0;                 // высота над землёй
    this.vy = 0;
    this.onGround = true;
    this.buffer = 0;            // запомненный тап
    this.phase = 0;             // фаза бега
    this.air = 0;               // 0 — бег, 1 — прыжок (плавный переход позы)
    this.sq = 0;                // squash & stretch: пружина
    this.sqV = 0;
    this.dead = false;
    this.rot = 0;
    this.knock = 0;
    this.knockV = 0;
    this.jumps = 0;
  }

  get hit() { const P = CONFIG.player; return { x: this.x - P.hitWidth / 2, w: P.hitWidth, h: P.hitHeight }; }
  get hitLeft() { return this.x - CONFIG.player.hitWidth / 2; }
  get hitRight() { return this.x + CONFIG.player.hitWidth / 2; }

  /* Один тап — один прыжок */
  requestJump() { this.buffer = CONFIG.player.jumpBuffer; }

  die() {
    this.dead = true;
    this.onGround = false;
    this.vy = 430;
    this.sq = 0.18;
    this.knockV = -150;         // отбрасывает назад от препятствия
  }

  update(dt, speed) {
    const P = CONFIG.player, g = this.game;

    if (this.dead) {
      this.knock += this.knockV * dt;
      this.knockV *= Math.exp(-4.5 * dt);
      if (!this.onGround) {
        this.h += this.vy * dt - 0.5 * P.gravity * dt * dt;
        this.vy -= P.gravity * dt;
        this.rot = Math.max(-Math.PI / 2, this.rot - 6.5 * dt);
        if (this.h <= 0) {
          this.h = 0;
          if (this.vy < -280) { this.vy = -this.vy * 0.3; this.sq = -0.2; g.dust(this.x + this.knock - 16, 5); }
          else { this.vy = 0; this.onGround = true; this.rot = -Math.PI / 2; }
        }
      }
      this._spring(dt);
      return;
    }

    this.buffer -= dt;
    if (this.onGround && this.buffer > 0) {
      this.buffer = 0;
      this.onGround = false;
      this.vy = P.jumpVelocity;
      this.sq = 0.22;
      this.sqV = 0;
      this.jumps++;
      g.onJump();
    }

    if (!this.onGround) {
      this.h += this.vy * dt - 0.5 * P.gravity * dt * dt;
      this.vy -= P.gravity * dt;
      if (this.h <= 0) {
        this.h = 0;
        this.vy = 0;
        this.onGround = true;
        this.sq = -0.24;
        this.sqV = 0;
        g.onLand();
      }
    } else {
      const before = this.phase;
      this.phase += dt * TAU * clamp(speed / 95, 2.3, 4.4);
      if (Math.floor(this.phase / Math.PI) !== Math.floor(before / Math.PI)) g.onStep();
    }

    this.air = lerp(this.air, this.onGround ? 0 : 1, 1 - Math.exp(-18 * dt));
    this._spring(dt);
  }

  _spring(dt) {
    this.sqV += (-380 * this.sq - 20 * this.sqV) * dt;
    this.sq += this.sqV * dt;
  }

  _leg(ctx, x, y, th, bend, color) {
    const [fx, fy, sa] = limb(ctx, x, y, th, 10, th - bend, 10, 6.2, color);
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

  draw(ctx, gy) {
    const P = CONFIG.player;
    ctx.save();
    ctx.translate(this.x + this.knock, gy - this.h);
    if (this.dead) {
      const k = Math.min(1, -this.rot / (Math.PI / 2));
      ctx.translate(-4 * k, -8 * k);
      ctx.rotate(this.rot);
    }
    ctx.scale(P.scale * (1 - this.sq * 0.55), P.scale * (1 + this.sq));

    // поза: смесь бега и прыжка. u: 1 — взлёт, 0.5 — вершина, 0 — приземление
    const a = this.dead ? 1 : this.air;
    const u = this.dead ? 0.2 : clamp(0.5 + 0.5 * this.vy / P.jumpVelocity, 0, 1);
    const ph = this.phase;
    const runTh = p => 0.82 * Math.sin(p);
    const runBend = p => 0.2 + 1.05 * Math.max(0, Math.cos(p));
    const legF = [lerp(runTh(ph), lerp(0.5, 1.05, u), a), lerp(runBend(ph), lerp(0.35, 1.5, u), a)];
    const legB = [lerp(runTh(ph + Math.PI), lerp(-0.55, -0.15, u), a), lerp(runBend(ph + Math.PI), lerp(0.6, 1.3, u), a)];
    const armF = lerp(-0.95 * Math.sin(ph), lerp(0.9, 2.5, u), a);
    const armB = lerp(0.95 * Math.sin(ph), lerp(-1.2, -0.4, u), a);
    const bob = this.onGround && !this.dead ? -Math.abs(Math.sin(ph)) * 1.8 : 0;
    const hipY = -22 + bob;

    // дальние рука и нога
    limb(ctx, 1, hipY - 17, armB, 8.5, armB + 1.1, 8, 5, '#454545');
    this._leg(ctx, -1.5, hipY, legB[0], legB[1], '#454545');

    // корпус с наклоном вперёд
    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(0.14 + a * 0.05);
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
    ctx.beginPath();
    ctx.arc(1.5, -29.5, 8, 0, TAU);                // голова
    ctx.fillStyle = C.skin;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1.2, -30.6, 8.3, Math.PI * 0.97, Math.PI * 2.03);   // шапка
    ctx.closePath();
    ctx.fillStyle = C.ink;
    ctx.fill();
    if (this.dead) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(3.8, -29.6); ctx.lineTo(6.6, -26.8);
      ctx.moveTo(6.6, -29.6); ctx.lineTo(3.8, -26.8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(5.4, -28.2, 1.15, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // ближние нога и рука
    this._leg(ctx, 1.5, hipY, legF[0], legF[1], C.ink2);
    const [hx, hy] = limb(ctx, 3, hipY - 17, armF, 8.5, armF + 1.15, 8, 5.2, C.ink);

    // связка ключей в руке
    if (!this.dead) {
      ctx.save();
      ctx.translate(hx, hy + 1);
      ctx.rotate(Math.PI / 2 + Math.sin(ph + 1) * 0.5 - a * 0.5);
      ctx.translate(3, 0);
      Art.key(ctx, 5, C.lime, true);
      ctx.restore();
    }
    ctx.restore();
  }
}

/* ───────────────────────────── 12. OBSTACLE, APARTMENT ───────────────────────────── */
function obstacleHitSize(def) {
  const inset = def.inset || CONFIG.obstacleInset;
  return { w: def.w - inset[0] * 2, h: def.h - inset[1], ix: inset[0] };
}

class Obstacle {
  constructor(def, x) {
    this.def = def;
    this.x = x;                 // левый край картинки
    this.w = def.w;
    this.h = def.h;
    this.vx = def.vx || 0;
    this.t = 0;
    this.passed = false;
    this.hitSize = obstacleHitSize(def);
  }

  get hit() { return { x: this.x + this.hitSize.ix, w: this.hitSize.w, h: this.hitSize.h }; }

  update(dt, dx) {
    this.x -= dx + this.vx * dt;
    this.t += dt;
  }

  draw(ctx, gy) {
    const art = ObstacleArt[this.def.id];
    ctx.fillStyle = 'rgba(28,28,28,.13)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.w / 2, gy + 2, this.w * 0.56, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(this.x, gy);
    ctx.scale(this.w / art.size[0], this.h / art.size[1]);
    art.draw(ctx, this);
    ctx.restore();
  }
}

class Apartment {
  constructor(data, tier, event, x) {
    const A = CONFIG.apartments;
    this.data = data;
    this.tier = tier;           // common | good | rare | jackpot | bad
    this.event = event;         // '' | 'vanish' | 'priceUp'
    this.x = x;
    this.w = A.width;
    this.h = A.height;
    this.price = data.price;
    this.points = CONFIG.score[tier];
    this.t = 0;
    this.shake = 0;
    this.bumped = false;
    this.collected = false;
    this.gone = false;
    this.missed = false;
    this.refreshTexts();
  }

  get bottom() { return CONFIG.apartments.floatHeight; }
  get top() { return CONFIG.apartments.floatHeight + this.h; }

  refreshTexts() {
    const d = this.data;
    this.title = `${d.rooms ? d.rooms + '-К' : 'СТУДИЯ'} · ${d.area} м²`;
    this.subtitle = `м. ${d.metro} · ${d.distanceToMetro} мин`;
    this.priceText = `${fmt(this.price)} ₽`;
    if (d.commission <= 0) this.pill = { text: 'БЕЗ КОМИССИИ', bg: this.tier === 'jackpot' ? C.ink : C.lime, fg: this.tier === 'jackpot' ? C.lime : C.ink, stroke: this.tier === 'rare' || this.tier === 'jackpot' ? '' : C.ink };
    else if (this.tier === 'bad') this.pill = { text: `КОМИССИЯ ${d.commission}%`, bg: C.danger, fg: C.white, stroke: '' };
    else this.pill = { text: `КОМИССИЯ ${d.commission}%`, bg: '#EDEDED', fg: C.ink, stroke: '' };
  }

  update(dt, dx) {
    this.x -= dx;
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
  }

  draw(ctx, gy) {
    const A = CONFIG.apartments, bob = Math.sin(this.t * 3.2) * 3;
    const jitter = this.shake > 0 ? Math.sin(this.t * 70) * 4 * (this.shake / 0.4) : 0;
    ctx.save();
    ctx.translate(this.x + jitter, gy - this.top + bob);
    ctx.scale(A.width / 150, A.height / 104);

    if (this.tier === 'jackpot') {
      // лучи и подпись «горячий вариант»
      ctx.save();
      ctx.translate(75, 52);
      ctx.rotate(this.t * 0.9);
      ctx.fillStyle = 'rgba(211,244,78,.55)';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a0 = (i / 10) * TAU, a1 = a0 + TAU / 20;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * 118, Math.sin(a0) * 118);
        ctx.lineTo(Math.cos(a1) * 118, Math.sin(a1) * 118);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }
    if (this.tier === 'bad') {
      ctx.translate(75, 52);
      ctx.rotate(Math.sin(this.t * 2.4) * 0.035 - 0.03);
      ctx.translate(-75, -52);
    }

    drawApartmentCard(ctx, this);

    if (this.tier === 'jackpot') {
      ctx.save();
      ctx.translate(75, -15);
      ctx.rotate(-0.045);
      const s = 1 + Math.sin(this.t * 8) * 0.04;
      ctx.scale(s, s);
      ctx.font = `800 9px ${FONT.display}`;
      const tw = ctx.measureText(TEXTS.hot).width + 34;
      rr(ctx, -tw / 2, -11, tw, 22, 11);
      ctx.fillStyle = C.ink;
      ctx.fill();
      // огонёк
      ctx.fillStyle = C.danger;
      ctx.beginPath();
      ctx.moveTo(-tw / 2 + 14, -6.5);
      ctx.bezierCurveTo(-tw / 2 + 20, -1, -tw / 2 + 19, 6, -tw / 2 + 14, 6);
      ctx.bezierCurveTo(-tw / 2 + 8, 6, -tw / 2 + 8, 0, -tw / 2 + 11.5, -2);
      ctx.bezierCurveTo(-tw / 2 + 12, -4, -tw / 2 + 13, -5, -tw / 2 + 14, -6.5);
      ctx.fill();
      ctx.fillStyle = C.lime;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(TEXTS.hot, -tw / 2 + 24, 0.6);
      ctx.restore();
    }
    ctx.restore();
  }
}

/* ───────────────────────────── 13. COLLISIONS ───────────────────────────── */
const CollisionSystem = {
  /* Препятствие стоит на земле: задет, если пересеклись по горизонтали и ноги ниже его верха */
  obstacle(player, o) {
    const p = player.hit, h = o.hit;
    return p.x < h.x + h.w && p.x + p.w > h.x && player.h < h.h;
  },
  /* Карточка висит в воздухе */
  apartment(player, a) {
    const p = player.hit;
    return p.x < a.x + a.w && p.x + p.w > a.x && player.h + p.h > a.bottom && player.h < a.top;
  },
};

/* ───────────────────────────── 14. SCORE ───────────────────────────── */
class ScoreSystem {
  constructor() { this.reset(); }
  reset() {
    this.meters = 0;
    this.bonus = 0;
    this.apartments = 0;
  }
  get distancePoints() {
    const S = CONFIG.score;
    return Math.floor(this.meters / S.metersStep) * S.pointsPerStep;
  }
  get total() { return Math.max(0, this.distancePoints + this.bonus); }
  add(points) {
    this.bonus += points;
    if (this.distancePoints + this.bonus < 0) this.bonus = -this.distancePoints;   // счёт не уходит в минус
  }
}

/* ───────────────────────────── 15. LEVEL GENERATOR ─────────────────────────────
   Уровень не хранится заранее. Генератор планирует объекты по одному и для каждого
   считает, в какой момент он «доедет» до игрока (arriveAt — в юнитах пройденного пути).

   Чтобы не было непроходимых мест:
   1) препятствие берётся, только если при текущей скорости окно для прыжка
      не уже generator.minJumpWindow;
   2) следующий объект приезжает не раньше, чем игрок гарантированно приземлится
      после предыдущего прыжка (даже самого позднего) плюс запас на реакцию;
   3) квартиры считаются так же, поэтому плохую всегда можно пробежать по земле. */
class LevelGenerator {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.rng = makeRng(this.game.seed || 1);
    this.planned = [];          // запланировано, но ещё не на экране
    this.count = 0;
    this.sinceApartment = 0;
    this.release = 0;           // точка пути, после которой игрок точно на земле
    this.horizon = 0;           // arriveAt последнего запланированного объекта
    this.lastId = '';
    this.lastTier = '';
  }

  /* Окно для прыжка через препятствие при скорости v */
  static jumpInfo(def, v) {
    const hit = obstacleHitSize(def);
    const times = jumpTimes(hit.h + 3);               // +3 — запас по высоте
    if (!times) return null;
    const vrel = v + (def.vx || 0);
    return { t1: times.t1, window: times.t2 - times.t1 - (hit.w + CONFIG.player.hitWidth) / vrel };
  }

  update() {
    const g = this.game, v = g.scrollSpeed;
    const edge = g.view.w + 50;                       // объекты появляются за правым краем
    const lookahead = edge - g.player.hitRight;
    while (this.horizon < g.track + lookahead + v) this._planNext(lookahead);

    for (let i = this.planned.length - 1; i >= 0; i--) {
      const item = this.planned[i];
      const ratio = (v + item.vx) / v;                // собака сближается быстрее мира
      const x = g.player.hitRight + (item.arriveAt - g.track) * ratio;
      if (x <= edge) {
        this.planned.splice(i, 1);
        if (item.kind === 'obstacle') g.spawnObstacle(item.def, x - obstacleHitSize(item.def).ix);
        else g.spawnApartment(item.data, item.tier, item.event, x);
      }
    }
  }

  _planNext(lookahead) {
    const g = this.game, G = CONFIG.generator, P = CONFIG.player, A = CONFIG.apartments;
    const v = g.scrollSpeed, d = g.difficulty;
    const air = 2 * P.jumpVelocity / P.gravity;
    const react = lerp(G.reaction[0], G.reaction[1], d);
    const intro = this.count < G.intro.length;
    let extra = this.rng.range(0, lerp(G.extraGap[0], G.extraGap[1], d));
    if (intro) extra = G.introGap;                    // первые объекты идут в ровном ритме
    else if (this.rng.chance(G.breatherChance)) extra += G.breatherTime;

    const item = this._choose(v);
    const earliest = this.count === 0
      ? g.track + Math.max(v * G.firstItemDelay, lookahead + 40)
      : this.release + v * (react + item.t1);
    item.arriveAt = earliest + v * extra;

    // после этого объекта игрок на земле не позже чем:
    this.release = item.kind === 'obstacle'
      ? item.arriveAt + v * (air - item.t1)
      : item.arriveAt + A.width + P.hitWidth + v * air;
    this.horizon = item.arriveAt;
    this.count++;
    this.planned.push(item);
  }

  _choose(v) {
    const G = CONFIG.generator, A = CONFIG.apartments, meters = this.game.score.meters;
    const scripted = G.intro[this.count];
    let wantApartment;
    if (scripted) wantApartment = scripted === 'apartment';
    else if (this.sinceApartment < A.minObstaclesBetween) wantApartment = false;
    else wantApartment = this.sinceApartment >= A.maxObstaclesBetween || this.rng.chance(A.chance);

    if (wantApartment) {
      this.sinceApartment = 0;
      return this._apartment(meters, !!scripted);
    }
    this.sinceApartment++;
    return this._obstacle(v, meters, scripted);
  }

  _obstacle(v, meters, scripted) {
    const G = CONFIG.generator, list = [];
    for (const def of CONFIG.obstacles) {
      if (scripted ? def.id !== scripted : meters < def.from) continue;
      const info = LevelGenerator.jumpInfo(def, v);
      if (!info || info.window < G.minJumpWindow) continue;
      list.push([{ def, info }, def.weight * (def.id === this.lastId ? 0.35 : 1)]);
    }
    let choice;
    if (list.length) choice = this.rng.weighted(list);
    else {
      // запасной вариант: препятствие с самым широким окном
      let best = null;
      for (const def of CONFIG.obstacles) {
        const info = LevelGenerator.jumpInfo(def, v);
        if (info && (!best || info.window > best.info.window)) best = { def, info };
      }
      choice = best;
    }
    this.lastId = choice.def.id;
    return { kind: 'obstacle', def: choice.def, vx: choice.def.vx || 0, t1: choice.info.t1 };
  }

  _apartment(meters, scripted) {
    const A = CONFIG.apartments, W = A.weights;
    let tier = 'good';
    if (!scripted) {
      const tiers = [['common', W.common], ['good', W.good], ['rare', W.rare]];
      if (meters >= A.jackpotFrom) tiers.push(['jackpot', W.jackpot * (meters >= 5000 ? 2 : 1)]);
      if (meters >= A.badFrom) tiers.push(['bad', W.bad * (this.lastTier === 'bad' ? 0.4 : 1)]);
      tier = this.rng.weighted(tiers);
    }
    this.lastTier = tier;

    const all = Services.listings.all();
    let pool = all.filter(a => (tier === 'bad' ? a.quality === 'bad' : a.quality !== 'bad' && a.rarity === tier));
    if (!pool.length) pool = all.filter(a => (tier === 'bad') === (a.quality === 'bad'));
    if (!pool.length) pool = all;
    const data = pool.length ? this.rng.pick(pool)
      : { id: 'default', district: 'САО', metro: 'Сокол', rooms: 1, area: 38, price: 65000, commission: 0, distanceToMetro: 7, quality: 'good', rarity: 'good' };

    let event = '';
    if (!scripted && tier !== 'bad' && tier !== 'jackpot' && meters >= A.eventFrom) {
      const r = this.rng.next();
      if (r < A.vanishChance) event = 'vanish';
      else if (r < A.vanishChance + A.priceUpChance) event = 'priceUp';
    }
    return { kind: 'apartment', data, tier, event, vx: 0, t1: 0 };
  }
}

/* ───────────────────────────── 16. BACKGROUND ─────────────────────────────
   Четыре слоя с параллаксом: дальние силуэты, два ряда домов, улица. */
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

/* Дома. Рисуются от левого нижнего угла, y вверх — минус. extra — сколько торчит над крышей */
const BuildingArt = {
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
    draw(k, b) { BuildingArt.panel.draw(k, b); },
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
  site: {     // стройка с краном
    dims: r => ({ w: r.range(96, 124), h: r.range(0.45, 0.68), extra: 70 }),
    draw(k, b) {
      const solid = b.h * 0.55;
      k.fillStyle = b.body;
      k.fillRect(0, -solid, b.w, solid);
      winGrid(k, b, 8, -solid + 9, b.w - 16, solid - 14, 7, 8, 6, 8, 0);
      // каркас недостроенных этажей
      for (let y = -solid; y > -b.h; y -= 16) k.fillRect(0, y - 2.5, b.w, 2.5);
      for (let x = 0; x <= b.w - 3; x += (b.w - 3) / 4) k.fillRect(x, -b.h, 3, b.h - solid);
      // кран
      const mx = b.w * 0.72;
      k.fillRect(mx, -b.h - 62, 3.5, b.h + 62);
      k.fillRect(b.w * 0.06, -b.h - 60, b.w * 0.94, 3);
      k.fillRect(mx + 8, -b.h - 60, 14, 11);
      k.fillRect(b.w * 0.2, -b.h - 57, 1.2, 30);
      k.fillRect(b.w * 0.2 - 4, -b.h - 28, 9, 6);
    },
  },
  stalin: {   // сталинская высотка
    dims: r => ({ w: r.range(124, 156), h: r.range(0.62, 0.78), extra: 0, spire: 0.32 }),
    draw(k, b) {
      const t1 = b.h * 0.56, t2 = b.h * 0.26, t3 = b.h * 0.18, top = t1 + t2 + t3;
      k.fillStyle = b.body;
      k.fillRect(0, -t1, b.w, t1);
      k.fillRect(b.w * 0.2, -t1 - t2, b.w * 0.6, t2);
      k.fillRect(b.w * 0.34, -top, b.w * 0.32, t3);
      k.fillRect(2, -t1 - 14, 12, 14);
      k.fillRect(b.w - 14, -t1 - 14, 12, 14);
      k.fillRect(b.w * 0.2 + 2, -t1 - t2 - 9, 8, 9);
      k.fillRect(b.w * 0.8 - 10, -t1 - t2 - 9, 8, 9);
      k.beginPath();
      poly(k, [b.w * 0.42, -top, b.w * 0.58, -top, b.w * 0.5, -top - b.h * 0.26]);
      k.fill();
      k.fillRect(b.w / 2 - 1, -top - b.h * 0.3, 2, b.h * 0.1);
      winGrid(k, b, 8, -t1 + 10, b.w - 16, t1 - 16, 6, 9, 6, 7);
      winGrid(k, b, b.w * 0.2 + 7, -t1 - t2 + 8, b.w * 0.6 - 14, t2 - 10, 6, 9, 6, 7);
      winGrid(k, b, b.w * 0.34 + 6, -top + 7, b.w * 0.32 - 12, t3 - 9, 5, 8, 5, 6);
    },
  },
  old: {      // доходный дом с мансардой
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
  glass: {    // стеклянная башня
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
      k.fillStyle = b.lit;      // освещённые этажи и пентхаус наверху
      k.beginPath();
      k.rect(5, -b.h + 25, b.w - 10, 5);
      for (let y = -b.h + 34, i = 0; y < -8; y += 9, i++) {
        if (hash3(b.seed, i, 7) % 100 < b.litPct) k.rect(5 + (hash3(b.seed, i, 3) % 3) * (b.w - 10) / 4, y, (b.w - 10) / 3, 4);
      }
      k.fill();
    },
  },
  glassWide: {
    dims: r => ({ w: r.range(120, 160), h: r.range(0.45, 0.6), extra: 34 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(0, -b.h, b.w, b.h);
      k.fillRect(b.w * 0.3, -b.h - 22, b.w * 0.5, 22);
      k.fillStyle = b.lit;
      k.fillRect(b.w * 0.3 + 5, -b.h - 17, b.w * 0.5 - 10, 10);
      k.fillStyle = b.win;
      k.beginPath();
      for (let y = -b.h + 10; y < -8; y += 9) k.rect(6, y, b.w - 12, 4);
      k.fill();
      k.fillStyle = b.lit;
      k.beginPath();
      for (let y = -b.h + 10, i = 0; y < -8; y += 9, i++) {
        if (hash3(b.seed, i, 5) % 100 < b.litPct) k.rect(6 + (hash3(b.seed, i, 9) % 4) * (b.w - 12) / 5, y, (b.w - 12) / 4, 4);
      }
      k.fill();
    },
  },
  penthouse: {  // абсурдный режим: гигантские пентхаусы
    dims: r => ({ w: r.range(150, 230), h: r.range(1.15, 1.7), extra: 80 }),
    draw(k, b) {
      k.fillStyle = b.body;
      k.fillRect(b.w * 0.12, -b.h, b.w * 0.76, b.h);
      winGrid(k, b, b.w * 0.12 + 12, -b.h + 80, b.w * 0.76 - 24, b.h - 96, 13, 16, 11, 13, 22);
      // сам пентхаус
      k.fillStyle = C.ink;
      k.fillRect(0, -b.h - 8, b.w, 66);
      k.fillStyle = b.lit;
      k.fillRect(8, -b.h, b.w - 16, 50);
      k.fillStyle = C.ink;
      for (let x = 8; x < b.w - 8; x += (b.w - 16) / 5) k.fillRect(x - 1.5, -b.h, 3, 50);
      // пальма на крыше
      const px = b.w * 0.74, py = -b.h - 8;
      k.fillRect(px - 2, py - 34, 4, 34);
      k.beginPath();
      for (const a of [-2.8, -2.2, -1.57, -0.95, -0.35]) {
        k.moveTo(px, py - 34);
        k.quadraticCurveTo(px + Math.cos(a) * 20, py - 34 + Math.sin(a) * 26, px + Math.cos(a) * 34, py - 34 + Math.sin(a) * 12 + 10);
        k.quadraticCurveTo(px + Math.cos(a) * 18, py - 34 + Math.sin(a) * 14, px, py - 34);
      }
      k.fill();
    },
  },
};

const BUILDING_MIX = {
  sleep:   [['panel', 5], ['khrush', 3], ['panelTall', 3]],
  dense:   [['tower', 5], ['panelTall', 3], ['panel', 2], ['site', 2.4]],
  center:  [['stalin', 2.4], ['old', 6], ['tower', 1]],
  premium: [['glass', 6], ['glassWide', 3], ['old', 1]],
  absurd:  [['penthouse', 5], ['glass', 2]],
};

/* Дальние силуэты */
const FarArt = {
  city: {       // Москва-Сити
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
  ostankino: {  // Останкинская башня
    w: 40,
    draw(ctx) {
      poly(ctx, [6, 0, 16, -62, 17.5, -176, 22.5, -176, 24, -62, 34, 0]);
      ctx.rect(13, -196, 14, 22);
      ctx.rect(15, -214, 10, 18);
      ctx.rect(18.8, -300, 2.4, 90);
    },
  },
  mgu: {        // сталинская высотка вдали
    w: 140,
    draw(ctx) {
      poly(ctx, [0, 0, 0, -50, 24, -50, 24, -80, 46, -80, 46, -130, 58, -130, 58, -165, 66, -180, 70, -232,
                 74, -180, 82, -165, 82, -130, 94, -130, 94, -80, 116, -80, 116, -50, 140, -50, 140, 0]);
    },
  },
  cranes: {     // краны
    w: 170,
    draw(ctx) {
      ctx.rect(40, -160, 3, 160); ctx.rect(8, -160, 104, 2.6); ctx.rect(8, -160, 13, 11); ctx.rect(92, -158, 1, 34); ctx.rect(88, -126, 9, 6);
      ctx.rect(128, -112, 2.6, 112); ctx.rect(96, -112, 74, 2.2); ctx.rect(156, -112, 11, 9);
      ctx.rect(0, -44, 70, 44); ctx.rect(84, -62, 40, 62);
    },
  },
  blocks: {     // безымянные кварталы
    w: 220,
    draw(ctx, it) {
      for (let i = 0, x = 0; i < 7; i++) {
        const w = 22 + (hash3(it.seed, i, 1) % 18), h = 46 + (hash3(it.seed, i, 2) % 86);
        ctx.rect(x, -h, w, h);
        x += w + 3 + (hash3(it.seed, i, 3) % 8);
      }
    },
  },
};

const FAR_MIX = {
  sleep:   [['blocks', 4], ['cranes', 2], ['ostankino', 1.2], ['city', 0.6]],
  dense:   [['cranes', 3], ['blocks', 3], ['city', 1.4], ['ostankino', 1]],
  center:  [['city', 4], ['mgu', 2.5], ['blocks', 1]],
  premium: [['city', 5], ['mgu', 1.2]],
  absurd:  [['city', 4], ['mgu', 2]],
};

/* Улица: деревья, фонари, ларьки. Рисуются от середины основания */
const PropArt = {
  tree: {
    w: 44,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-2, -24, 4, 24);
      ctx.fillStyle = it.leaf;
      ctx.beginPath();
      dot(ctx, 0, -40, 17); dot(ctx, -11, -30, 11); dot(ctx, 11, -31, 12);
      ctx.fill();
      ctx.fillStyle = it.leaf2;
      ctx.beginPath();
      dot(ctx, 5, -35, 8);
      ctx.fill();
    },
  },
  poplar: {
    w: 26,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-1.5, -18, 3, 18);
      ctx.fillStyle = it.leaf;
      ctx.beginPath();
      ctx.ellipse(0, -48, 11, 34, 0, 0, TAU);
      ctx.fill();
    },
  },
  palm: {
    w: 50,
    draw(ctx, it) {
      ctx.strokeStyle = it.prop === '#FFFFFF' ? C.ink : it.prop;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(6, -30, 0, -58);
      ctx.stroke();
      ctx.fillStyle = it.leaf;
      ctx.beginPath();
      for (const a of [-2.9, -2.3, -1.57, -0.85, -0.25]) {
        ctx.moveTo(0, -58);
        ctx.quadraticCurveTo(Math.cos(a) * 20, -58 + Math.sin(a) * 24, Math.cos(a) * 34, -58 + Math.sin(a) * 10 + 12);
        ctx.quadraticCurveTo(Math.cos(a) * 16, -58 + Math.sin(a) * 12, 0, -58);
      }
      ctx.fill();
    },
  },
  lamp: {
    w: 30,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-1.5, -94, 3, 94);
      ctx.fillRect(-3, -5, 6, 5);
      ctx.fillRect(-1.5, -94, 19, 2.6);
      rr(ctx, 12, -94, 13, 5.5, 2.5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillRect(14, -89.5, 9, 2);
    },
  },
  metro: {
    w: 30,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-1.5, -62, 3, 62);
      ctx.beginPath();
      ctx.arc(0, -74, 13, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = it.prop;
      ctx.stroke();
      ctx.fillStyle = '#EDA59C';
      ctx.font = `900 14px ${FONT.display}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('М', 0, -73);
    },
  },
  kiosk: {
    w: 72,
    draw(ctx, it) {
      rr(ctx, -32, -42, 64, 42, 4);
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = it.prop;
      ctx.stroke();
      ctx.fillStyle = it.prop;
      ctx.fillRect(-36, -50, 72, 12);
      ctx.fillRect(-24, -30, 30, 16);
      ctx.fillRect(12, -30, 12, 30);
      ctx.fillStyle = C.white;
      ctx.font = `800 7px ${FONT.display}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.text, 0, -43.6, 66);
    },
  },
  billboard: {
    w: 110,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-24, -36, 3, 36);
      ctx.fillRect(21, -36, 3, 36);
      rr(ctx, -54, -90, 108, 56, 6);
      ctx.fillStyle = 'rgba(255,255,255,.86)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = it.prop;
      ctx.stroke();
      ctx.fillStyle = it.ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 10px ${FONT.display}`;
      ctx.fillText(it.text[0], 0, -68, 98);
      ctx.font = `700 9px ${FONT.text}`;
      ctx.fillText(it.text[1], 0, -53, 98);
    },
  },
  bench: {
    w: 44,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-19, -13, 38, 3.4);
      ctx.fillRect(-19, -23, 38, 3.4);
      ctx.fillRect(-15, -23, 2.6, 23);
      ctx.fillRect(12.4, -23, 2.6, 23);
    },
  },
  swing: {      // качели во дворе
    w: 60,
    draw(ctx, it) {
      ctx.strokeStyle = it.prop;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-26, 0); ctx.lineTo(-18, -46); ctx.lineTo(18, -46); ctx.lineTo(26, 0);
      ctx.moveTo(-18, -46); ctx.lineTo(-10, 0);
      ctx.moveTo(18, -46); ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, -46); ctx.lineTo(-3, -14);
      ctx.moveTo(5, -46); ctx.lineTo(7, -14);
      ctx.stroke();
      ctx.fillStyle = it.prop;
      ctx.fillRect(-5, -15, 14, 3);
    },
  },
  busstop: {
    w: 84,
    draw(ctx, it) {
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.fillRect(-34, -48, 68, 44);
      ctx.fillStyle = it.prop;
      ctx.fillRect(-38, -54, 76, 5);
      ctx.fillRect(-34, -50, 2.6, 50);
      ctx.fillRect(31.4, -50, 2.6, 50);
      ctx.fillRect(-22, -15, 44, 3);
      rr(ctx, 38, -78, 16, 16, 3);
      ctx.fill();
      ctx.fillRect(45, -62, 2.2, 62);
      ctx.fillStyle = C.white;
      ctx.font = `900 9px ${FONT.display}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('А', 46, -69.4);
    },
  },
  fence: {
    w: 90,
    draw(ctx, it) {
      ctx.fillStyle = it.prop;
      ctx.fillRect(-45, -20, 90, 2.4);
      ctx.fillRect(-45, -9, 90, 2.4);
      for (let x = -45; x <= 43; x += 11) ctx.fillRect(x, -24, 2.4, 24);
    },
  },
};

const PROP_MIX = {
  sleep:   [['tree', 5], ['poplar', 2], ['lamp', 3], ['bench', 2], ['swing', 2], ['kiosk', 1.5], ['billboard', 1.3], ['fence', 1.5], ['busstop', 1]],
  dense:   [['lamp', 4], ['tree', 3], ['metro', 2], ['kiosk', 2.5], ['billboard', 2], ['busstop', 2]],
  center:  [['lamp', 5], ['tree', 3.5], ['metro', 1.4], ['billboard', 1.5], ['bench', 1.5]],
  premium: [['lamp', 4], ['poplar', 3], ['tree', 2], ['billboard', 2], ['metro', 1]],
  absurd:  [['palm', 5], ['lamp', 2], ['billboard', 3]],
};

class Background {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.rng = makeRng(20261008);
    this.pal = this.palFrom = CONFIG.districts[0];
    this.palT = 1;
    this.groundOffset = 0;
    this.layers = [
      { id: 'far',   parallax: 0.05, items: [], cursor: -60, make: x => this._makeFar(x) },
      { id: 'back',  parallax: 0.13, items: [], cursor: -40, make: x => this._makeBuilding(x, 'back') },
      { id: 'front', parallax: 0.26, items: [], cursor: -20, make: x => this._makeBuilding(x, 'front') },
      { id: 'near',  parallax: 0.58, items: [], cursor: 40,  make: x => this._makeProp(x) },
    ];
    this.clouds = [];
    for (let i = 0; i < 7; i++) this.clouds.push({ x: this.rng.range(0, 1500), y: this.rng.range(0.1, 0.62), w: this.rng.range(60, 130) });
    this.fill();
  }

  /* Плавная смена палитры неба при входе в новый район */
  setDistrict(index) {
    this.palFrom = this.pal;
    this.pal = CONFIG.districts[index];
    this.palT = 0;
  }

  color(key, i) {
    const a = i === undefined ? this.palFrom[key] : this.palFrom[key][i];
    const b = i === undefined ? this.pal[key] : this.pal[key][i];
    return this.palT >= 1 || a === b ? b : mix(a, b, this.palT);
  }

  fill() {
    const edge = this.game.view.w + 280;
    for (const L of this.layers) {
      while (L.cursor < edge) {
        const item = L.make(L.cursor);
        L.items.push(item);
        L.cursor += item.advance;
      }
    }
  }

  update(dx, dt) {
    for (const L of this.layers) {
      const d = dx * L.parallax;
      L.cursor -= d;
      for (const item of L.items) item.x -= d;
      while (L.items.length && L.items[0].x + L.items[0].w < -140) L.items.shift();   // ушло за экран — удаляем
    }
    this.fill();
    for (const c of this.clouds) {
      c.x -= dx * 0.02 + 5 * dt;
      if (c.x + c.w < -20) c.x += Math.max(1500, this.game.view.w + 300);
    }
    this.groundOffset += dx;
    if (this.palT < 1) this.palT = Math.min(1, this.palT + dt / 2.5);
  }

  _makeFar(x) {
    const d = this.game.district, kind = this.rng.weighted(FAR_MIX[d.id]);
    const s = this.game.view.farScale * this.rng.range(0.85, 1.05);
    const w = FarArt[kind].w * s;
    return { x, kind, w, s, seed: this.rng.int(0, 99999), advance: w + this.rng.range(110, 300) };
  }

  _makeBuilding(x, row) {
    const d = this.game.district, r = this.rng;
    const kind = r.weighted(BUILDING_MIX[d.id]);
    const dims = BuildingArt[kind].dims(r);
    const maxH = this.game.view.maxBuildingH * (row === 'back' ? 1.14 : 0.86);
    const body = row === 'back' ? d.back : d.front;
    const h = Math.max(dims.minH || 0, dims.h * maxH);
    return {
      x, kind, row,
      w: Math.round(dims.w), h: Math.round(h),
      extra: dims.extra + (dims.spire ? h * dims.spire : 0) + 4,
      seed: r.int(0, 99999),
      body, dark: shade(body, -0.09), win: d.win, lit: d.lit,
      litPct: d.id === 'premium' ? 26 : d.id === 'absurd' ? 30 : 12,
      advance: dims.w + (row === 'back' ? r.range(-12, 18) : r.range(-4, 44)),
      sprite: null, ps: 0,
    };
  }

  _makeProp(x) {
    const d = this.game.district, r = this.rng;
    const kind = r.weighted(PROP_MIX[d.id]);
    const s = r.range(0.92, 1.18);
    const item = {
      x, kind, s, w: PropArt[kind].w * s,
      prop: d.prop, leaf: d.leaf, leaf2: shade(d.leaf, -0.07),
      ink: d.id === 'absurd' ? C.ink : shade(d.prop, -0.28),
    };
    if (kind === 'kiosk') item.text = r.pick(TEXTS.kiosks);
    if (kind === 'billboard') item.text = r.pick(d.id === 'absurd' ? TEXTS.billboardsAbsurd : TEXTS.billboards);
    item.advance = item.w + r.range(90, 230);
    return item;
  }

  /* Дом рисуется один раз во внеэкранный холст и дальше выводится картинкой — так быстрее на телефонах */
  _sprite(b, ps) {
    const pad = 6;
    const cw = Math.ceil((b.w + pad * 2) * ps), ch = Math.ceil((b.h + b.extra) * ps);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const k = canvas.getContext('2d');
    k.scale(ps, ps);
    k.translate(pad, b.h + b.extra);
    BuildingArt[b.kind].draw(k, b);
    b.sprite = canvas;
    b.ps = ps;
    b.sw = cw / ps;
    b.sh = ch / ps;
    b.pad = pad;
  }

  drawSky(ctx) {
    const v = this.game.view;
    const grad = ctx.createLinearGradient(0, 0, 0, v.groundY);
    grad.addColorStop(0, this.color('sky', 0));
    grad.addColorStop(1, this.color('sky', 1));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, v.w, v.h);

    ctx.fillStyle = this.color('cloud');
    ctx.globalAlpha = 0.9;
    for (const c of this.clouds) {
      const y = v.groundY * c.y * 0.7 + 30, h = c.w * 0.26;
      rr(ctx, c.x, y, c.w, h, h / 2);
      ctx.fill();
      ctx.beginPath();
      dot(ctx, c.x + c.w * 0.38, y + h * 0.12, h * 0.55);
      dot(ctx, c.x + c.w * 0.62, y + h * 0.32, h * 0.4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawCity(ctx) {
    const v = this.game.view, gy = v.groundY;
    const ps = Math.min(2, v.scale * v.dpr), snap = x => Math.round(x * ps) / ps;

    // дальние силуэты
    ctx.fillStyle = this.color('far');
    for (const it of this.layers[0].items) {
      if (it.x > v.w + 20) continue;
      ctx.save();
      ctx.translate(it.x, gy);
      ctx.scale(it.s, it.s);
      ctx.beginPath();
      FarArt[it.kind].draw(ctx, it);
      ctx.fill();
      ctx.restore();
    }

    // дома
    for (let i = 1; i <= 2; i++) {
      for (const b of this.layers[i].items) {
        if (b.x > v.w + 20) continue;
        if (!b.sprite || b.ps !== ps) this._sprite(b, ps);
        ctx.drawImage(b.sprite, snap(b.x - b.pad), gy - b.h - b.extra, b.sw, b.sh);
      }
    }

    // улица
    for (const it of this.layers[3].items) {
      if (it.x - it.w > v.w + 20) continue;
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

    // разметка: бежит со скоростью мира и даёт ощущение скорости
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath();
    for (let x = -(this.groundOffset % 78) - 78; x < v.w + 78; x += 78) ctx.rect(x, gy + 32, 36, 3.5);
    ctx.fill();

    this._drawBand(ctx);
  }

  /* Нижняя полоса: район и сколько осталось до следующего */
  _drawBand(ctx) {
    const g = this.game, v = g.view, gy = v.groundY, D = CONFIG.districts;
    const d = g.district, next = D[g.districtIndex + 1], m = g.score.meters;
    const prog = next ? clamp((m - d.from) / (next.from - d.from), 0, 1) : 1;
    const pad = 18, maxW = v.w - pad * 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (v.band >= 190) {
      const top = gy + 62;
      ctx.fillStyle = '#8C8C8C';
      ctx.font = `700 12px ${FONT.text}`;
      ctx.fillText(`РАЙОН ${g.districtIndex + 1} ИЗ ${D.length}`, pad, top + 10);

      let size = Math.min(34, v.w * 0.062);
      ctx.font = `900 ${size}px ${FONT.display}`;
      const tw = ctx.measureText(d.name).width;
      if (tw > maxW) { size *= maxW / tw; ctx.font = `900 ${size}px ${FONT.display}`; }
      ctx.fillStyle = C.lime;
      ctx.fillText(d.name, pad, top + 20 + size);

      const by = top + 36 + size;
      rr(ctx, pad, by, maxW, 7, 3.5);
      ctx.fillStyle = C.ink2;
      ctx.fill();
      if (prog > 0.012) { rr(ctx, pad, by, maxW * prog, 7, 3.5); ctx.fillStyle = C.lime; ctx.fill(); }
      ctx.fillStyle = '#8C8C8C';
      ctx.font = `700 12px ${FONT.text}`;
      ctx.fillText(next ? `до района «${next.short}» — ${fmt(Math.max(0, Math.ceil(next.from - m)))} м` : 'дальше только рекорды', pad, by + 26);

      if (v.band >= 270) {
        ctx.fillStyle = '#3F3F3F';
        ctx.font = `900 13px ${FONT.display}`;
        ctx.fillText('KEYSTOMOSCOW', pad, v.h - 30);
      }
    } else {
      ctx.fillStyle = C.lime;
      ctx.font = `800 10px ${FONT.display}`;
      ctx.fillText(d.name, pad, gy + 59);
      const bx = pad + ctx.measureText(d.name).width + 14, bw = v.w - bx - pad;
      if (bw > 60) {
        rr(ctx, bx, gy + 51, bw, 5, 2.5);
        ctx.fillStyle = C.ink2;
        ctx.fill();
        if (prog > 0.012) { rr(ctx, bx, gy + 51, bw * prog, 5, 2.5); ctx.fillStyle = C.lime; ctx.fill(); }
      }
    }
  }
}

/* ───────────────────────────── 17. UI ───────────────────────────── */
const KEY_SVG = '<svg class="key" viewBox="0 0 48 48" aria-hidden="true"><use href="#i-key"/></svg>';

class UI {
  constructor(game) {
    const $ = id => document.getElementById(id);
    this.game = game;
    this.el = {
      hud: $('hud'), score: $('hudScore'), meters: $('hudMeters'), flats: $('hudFlats'),
      record: $('hudRecord'), recordLabel: $('hudRecordLabel'), best: $('hudBest'),
      btnSound: $('btnSound'), btnMusic: $('btnMusic'),
      toastSlot: $('toastSlot'), hint: $('hint'),
      start: $('startScreen'), startTimer: $('startTimer'), startRecord: $('startRecord'), startBest: $('startBest'),
      pause: $('pauseScreen'),
      over: $('overScreen'), panel: $('overPanel'), head: $('overHead'), cause: $('overCause'),
      overMeters: $('overMeters'), overFlats: $('overFlats'), overFlatsLabel: $('overFlatsLabel'),
      overScore: $('overScore'), overScoreLabel: $('overScoreLabel'),
      overRecord: $('overRecord'), overRecordLabel: $('overRecordLabel'), overBest: $('overBest'),
      rank: $('overRank'), rankBar: $('overRankBar'),
      btnRetry: $('btnRetry'), btnShare: $('btnShare'), shareLabel: $('shareLabel'),
    };
    this.cache = { score: -1, meters: -1, flats: -1, best: -1, recordMode: '' };
    this.toastUntil = 0;
    this.toastPriority = 0;
    this.hintKind = '';
    this.startTimer = 0;
    this.fineInput = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

    const press = (el, fn) => el.addEventListener('click', e => { e.stopPropagation(); fn(); el.blur(); });
    press(this.el.btnSound, () => game.toggleSound());
    press(this.el.btnMusic, () => game.toggleMusic());
    press(this.el.btnRetry, () => game.restart());
    press(this.el.btnShare, () => game.share());
  }

  /* Счёт: DOM трогаем, только когда число изменилось */
  sync(score, meters, flats) {
    const c = this.cache;
    if (score !== c.score) { c.score = score; this.el.score.textContent = fmt(score); }
    if (meters !== c.meters) { c.meters = meters; this.el.meters.textContent = `${fmt(meters)} м`; }
    if (flats !== c.flats) { c.flats = flats; this.el.flats.textContent = flats; }
  }

  setRecord(best, isNew) {
    if (best !== this.cache.best) { this.cache.best = best; this.el.best.textContent = fmt(best); }
    const mode = isNew ? 'new' : best > 0 ? 'show' : 'hide';
    if (mode === this.cache.recordMode) return;
    this.cache.recordMode = mode;
    this.el.recordLabel.textContent = isNew ? 'Новый рекорд' : 'Рекорд';
    this.el.record.classList.toggle('is-new', !!isNew);
    this.el.record.hidden = mode === 'hide';
  }

  bump(bad) {
    const el = this.el.score, cls = bad ? 'is-hit' : 'is-bump';
    el.classList.remove('is-bump', 'is-hit');
    void el.offsetWidth;
    el.classList.add(cls);
  }

  setSoundButtons(sound, music) {
    this.el.btnSound.setAttribute('aria-pressed', String(sound));
    this.el.btnMusic.setAttribute('aria-pressed', String(music));
  }

  /* tone: good | bad | info | event | district. Шутки (priority 0) не перебивают важное */
  toast({ title, sub = '', tone = 'good', ms = 1500, priority = 1, key = false }) {
    const now = performance.now();
    if (now < this.toastUntil && priority < this.toastPriority) return false;
    this.toastUntil = now + ms;
    this.toastPriority = priority;
    const el = document.createElement('div');
    el.className = `toast toast--${tone}`;
    el.style.animationDuration = `${ms}ms`;
    el.innerHTML = `<span>${title}${key ? KEY_SVG : ''}</span>${sub ? `<small>${sub}</small>` : ''}`;
    this.el.toastSlot.textContent = '';
    this.el.toastSlot.appendChild(el);
    return true;
  }
  get toastIdle() { return performance.now() > this.toastUntil + 500; }
  clearToasts() { this.el.toastSlot.textContent = ''; this.toastUntil = 0; }

  hint(kind, text, tone = '') {
    this.hintKind = kind;
    this.el.hint.hidden = !kind;
    if (kind) {
      this.el.hint.textContent = text;
      this.el.hint.className = `hint${tone ? ' hint--' + tone : ''}`;
    }
  }
  clearHint(kind) { if (!kind || this.hintKind === kind) this.hint('', ''); }

  /* auto: true — с таймером автостарта, false — ждём тапа */
  showStart(best, auto) {
    clearTimeout(this.startTimer);
    this.el.hud.classList.add('is-dim');
    this.el.start.hidden = false;
    this.el.start.classList.remove('is-leaving');
    this.el.startTimer.parentNode.hidden = !auto;
    this.el.startRecord.hidden = best <= 0;
    this.el.startBest.textContent = fmt(best);
  }
  setStartProgress(p) { this.el.startTimer.style.transform = `scaleX(${clamp(p, 0, 1)})`; }
  setSpotlight(x, y) {
    this.el.start.style.setProperty('--px', `${x}px`);
    this.el.start.style.setProperty('--py', `${y}px`);
  }
  hideStart() {
    this.el.hud.classList.remove('is-dim');
    this.el.start.classList.add('is-leaving');
    this.startTimer = setTimeout(() => { this.el.start.hidden = true; }, 340);
  }

  showPause(on) { this.el.pause.hidden = !on; }

  showGameOver(r) {
    const e = this.el;
    e.head.textContent = r.headline;
    e.cause.textContent = `«${r.cause}»`;
    e.overMeters.textContent = fmt(r.meters);
    e.overFlats.textContent = r.apartments;
    e.overFlatsLabel.textContent = plural(r.apartments, 'квартира снята', 'квартиры сняты', 'квартир снято');
    e.overScore.textContent = fmt(r.score);
    e.overScoreLabel.textContent = plural(r.score, 'очко', 'очка', 'очков');
    e.overRecordLabel.textContent = r.isRecord ? TEXTS.record : 'Твой рекорд';
    e.overBest.textContent = fmt(r.best);
    e.overBest.hidden = r.isRecord;
    e.overRecord.classList.toggle('is-new', r.isRecord);
    e.overRecord.querySelectorAll('.confetti').forEach(n => n.remove());
    e.rank.textContent = `${r.percentile}%`;
    e.rankBar.style.width = '0%';
    e.shareLabel.textContent = 'Поделиться рекордом';
    e.panel.classList.remove('is-ready');
    e.over.hidden = false;
    e.over.scrollTop = 0;
    requestAnimationFrame(() => { e.rankBar.style.width = `${r.percentile}%`; });
    setTimeout(() => e.panel.classList.add('is-ready'), CONFIG.ui.restartGuard * 1000);
    if (r.isRecord) this._confetti(e.overRecord);
  }
  hideGameOver() { this.el.over.hidden = true; }

  _confetti(host) {
    const colors = [C.lime, C.ink, C.white, C.lime];
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('i');
      const a = Math.random() * TAU, dist = 70 + Math.random() * 110;
      s.className = 'confetti';
      s.style.background = colors[i % colors.length];
      s.style.setProperty('--dx', `${Math.cos(a) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(a) * dist * 0.8 - 30}px`);
      s.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
      s.style.animationDelay = `${Math.random() * 0.12}s`;
      host.appendChild(s);
    }
  }

  setShareLabel(text) { this.el.shareLabel.textContent = text; }
}

/* ───────────────────────────── 18. GAME ───────────────────────────── */
const STEP = 1 / 120;           // фиксированный шаг физики: одинаково на 60 и 120 Гц

class Game {
  constructor() {
    this.canvas = document.getElementById('stage');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.root = document.getElementById('app');

    this.storage = new Storage(CONFIG.storageKey);
    this.audio = new AudioSystem(this.storage);
    this.particles = new ParticleSystem();
    this.score = new ScoreSystem();
    this.player = new Player(this);

    this.view = { cw: 1, ch: 1, w: 600, h: 400, scale: 1, dpr: 1, groundY: 300, band: 100, speedFactor: 1, farScale: 1, maxBuildingH: 300 };
    this.state = 'ready';       // ready → playing → dying → over; paused — когда вкладку свернули
    this.manual = false;        // true — кадры двигает тест, а не requestAnimationFrame
    this.seed = 1;
    this.nextSeed = null;
    this.rng = makeRng(Date.now());
    this.obstacles = [];
    this.apartments = [];
    this.streaks = [];
    this.track = 0;             // пройденный путь в юнитах
    this.nominalSpeed = CONFIG.speed.start;
    this.scrollSpeed = 0;
    this.districtIndex = 0;
    this.readyTime = 0;
    this.autoStart = true;      // первый экран сам запускает игру через ui.autoStartDelay
    this.stateTime = 0;
    this.hitStop = 0;
    this.shake = 0;
    this.flash = 0;
    this.flashColor = '255,255,255';
    this.kick = 0;
    this.camY = 0;
    this.prevBest = this.storage.data.best;
    this.recordBroken = false;
    this.nextJokeAt = 0;
    this.overAt = 0;
    this.cause = '';
    this.result = null;
    this.acc = 0;
    this.last = performance.now();

    this.resize();
    this.background = new Background(this);
    this.generator = new LevelGenerator(this);
    this.ui = new UI(this);
    this.ui.setSoundButtons(this.storage.data.sound, this.storage.data.music);
    this.ui.setRecord(this.storage.data.best, false);
    this.ui.showStart(this.storage.data.best, true);
    this.resize();

    this._bindInput();
    this._frame = this._frame.bind(this);
    requestAnimationFrame(this._frame);
  }

  get district() { return CONFIG.districts[this.districtIndex]; }
  get difficulty() { const S = CONFIG.speed; return clamp((this.nominalSpeed - S.start) / (S.max - S.start), 0, 1); }

  /* ---------- Экран ---------- */
  resize() {
    const V = CONFIG.view, P = CONFIG.player;
    const rect = this.root.getBoundingClientRect();
    const cw = Math.max(1, rect.width), ch = Math.max(1, rect.height);
    let scale = cw / clamp(cw, V.minWidth, V.maxWidth);
    if (ch / scale < V.minHeight) scale = ch / V.minHeight;
    const w = cw / scale, h = ch / scale;
    const band = clamp(h - V.sceneHeight, V.minBand, h * V.maxBandRatio);
    const dpr = Math.min(window.devicePixelRatio || 1, V.maxDpr);
    const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) { this.canvas.width = pw; this.canvas.height = ph; }
    const groundY = Math.round(h - band);
    this.view = {
      cw, ch, w, h, scale, dpr, band, groundY,
      speedFactor: lerp(CONFIG.speed.narrowScreenFactor, 1, clamp((w - V.minWidth) / (V.maxWidth - V.minWidth), 0, 1)),
      farScale: clamp(groundY / 560, 0.55, 1.15),
      maxBuildingH: clamp(groundY * 0.66, 190, 430),
    };
    this.player.x = clamp(w * P.xRatio, P.xMin, P.xMax);
    if (this.background) {
      if (this.state === 'ready') this.background.reset();   // до старта просто строим город под новый размер
      else this.background.fill();
    }
    if (this.ui) this.ui.setSpotlight(this.player.x * scale, (groundY - 28) * scale);
  }

  /* ---------- Ввод ---------- */
  _bindInput() {
    const onPress = e => {
      Platform.touched = true;
      if (e.target && e.target.closest && e.target.closest('button, a')) return;
      if (e.cancelable) e.preventDefault();
      this.press();
    };
    if (window.PointerEvent) {
      this.root.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button === 0) onPress(e); }, { passive: false });
    } else {
      this.root.addEventListener('touchstart', onPress, { passive: false });
      this.root.addEventListener('mousedown', onPress);
    }
    this.root.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());

    document.addEventListener('keydown', e => {
      const jump = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
      if (!jump && e.code !== 'Enter') return;
      e.preventDefault();
      Platform.touched = true;
      if (e.repeat) return;                             // удержание клавиши не прыгает повторно
      if (this.state === 'over') {
        if (performance.now() - this.overAt > CONFIG.ui.restartGuard * 1000) this.restart();
        return;
      }
      if (jump) this.press();
    });
    document.addEventListener('keyup', e => { if (e.code === 'Space') e.preventDefault(); });

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(this.root);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state === 'playing') this.pause();
        this.audio.suspend();
      } else {
        this.audio.resume();
        this.last = performance.now();
        this.acc = 0;
      }
    });
  }

  /* Единственное действие игрока: тап, клик, пробел */
  press() {
    this.audio.unlock();
    if (this.state === 'ready') this.start();
    else if (this.state === 'playing') this.player.requestJump();
    else if (this.state === 'paused') this.resume();
    // dying и over: игнорируем, перезапуск — кнопкой
  }

  /* ---------- Состояния ---------- */
  start() {
    if (this.state !== 'ready') return;
    this.ui.hideStart();
    this._beginRun(false);
  }

  restart() {
    if (this.state !== 'over') return;
    this.audio.unlock();
    this.audio.play('click');
    this.ui.hideGameOver();
    this._beginRun(true);
  }

  _beginRun(fresh) {
    // Зерно уровня. Для «Квартиры дня» перед стартом задать game.nextSeed = Services.daily.seed()
    this.seed = this.nextSeed != null ? this.nextSeed >>> 0 : (Date.now() ^ Math.floor(Math.random() * 0x7FFFFFFF)) >>> 0;
    this.nextSeed = null;
    this.rng = makeRng(this.seed ^ 0x9E3779B9);
    this.score.reset();
    this.player.reset();
    this.obstacles.length = 0;
    this.apartments.length = 0;
    this.particles.clear();
    this.streaks.length = 0;
    this.track = 0;
    this.nominalSpeed = CONFIG.speed.start;
    this.scrollSpeed = this.nominalSpeed * this.view.speedFactor;
    this.districtIndex = 0;
    this.hitStop = 0;
    this.shake = 0;
    this.flash = 0;
    this.kick = 0;
    this.camY = 0;
    this.prevBest = this.storage.data.best;
    this.recordBroken = false;
    this.nextJokeAt = this.rng.range(CONFIG.ui.jokeEvery[0], CONFIG.ui.jokeEvery[1]) * 0.7;
    this.result = null;
    if (fresh) this.background.reset();
    this.generator.reset();
    this.state = 'playing';
    this.ui.clearToasts();
    this.ui.setRecord(this.prevBest, false);
    if (this.storage.data.games < CONFIG.ui.hintGames) this.ui.hint('jump', TEXTS.hintJump[this.ui.fineInput ? 1 : 0]);
    else this.ui.clearHint();
  }

  pause() {
    this.state = 'paused';
    this.ui.showPause(true);
  }

  resume() {
    this.state = 'playing';
    this.ui.showPause(false);
    this.last = performance.now();
    this.acc = 0;
  }

  toggleSound() {
    const d = this.storage.data;
    d.sound = !d.sound;
    this.storage.save();
    this.audio.unlock();
    this.audio.play('click');
    this.ui.setSoundButtons(d.sound, d.music);
  }

  toggleMusic() {
    const d = this.storage.data;
    d.music = !d.music;
    this.storage.save();
    this.audio.unlock();
    this.audio.syncMusic();
    this.ui.setSoundButtons(d.sound, d.music);
  }

  async share() {
    if (!this.result) return;
    this.audio.play('click');
    const outcome = await Share.send(this.result);
    if (outcome === 'copied') this.ui.setShareLabel('Скопировано — вставь в Telegram');
    else if (outcome === 'failed') this.ui.setShareLabel('Не получилось поделиться');
    return outcome;
  }

  /* ---------- События игрока ---------- */
  onJump() {
    this.audio.play('jump');
    Platform.haptic('jump');
    this.dust(this.player.x - 6, 4);
    this.ui.clearHint('jump');
  }

  onLand() {
    this.audio.play('land');
    this.dust(this.player.x, 5);
  }

  onStep() {
    if (this.state === 'playing') this.dust(this.player.x - 12, 1, 0.5);
  }

  dust(x, n, alpha = 0.7) {
    const gy = this.view.groundY;
    for (let i = 0; i < n; i++) {
      this.particles.emit({
        x: x + (Math.random() - 0.5) * 14, y: gy - 2,
        vx: -30 - Math.random() * 60, vy: -18 - Math.random() * 34,
        size: 2 + Math.random() * 2.6, grow: 1.4, life: 0.32 + Math.random() * 0.2,
        color: '#BDBDBD', alpha, drag: 3,
      });
    }
  }

  spawnObstacle(def, x) { this.obstacles.push(new Obstacle(def, x)); }

  spawnApartment(data, tier, event, x) {
    this.apartments.push(new Apartment(data, tier, event, x));
    const hints = this.storage.data.hints, max = 2;
    if (tier === 'bad' && hints.bad < max) { hints.bad++; this.ui.hint('bad', TEXTS.hintBad, 'bad'); }
    else if (tier !== 'bad' && hints.flat < max) { hints.flat++; this.ui.hint('flat', TEXTS.hintFlat, 'good'); }
  }

  /* ---------- Обновление ---------- */
  update(dt) {
    if (this.state === 'paused') return;
    if (this.hitStop > 0) { this.hitStop -= dt; return; }     // короткая заморозка в момент удара
    let dx = 0;

    if (this.state === 'ready') {
      this.scrollSpeed = CONFIG.speed.start * this.view.speedFactor * 0.6;
      dx = this.scrollSpeed * dt;
      this.player.update(dt, this.scrollSpeed);
      if (this.autoStart) {
        this.readyTime += dt;
        this.ui.setStartProgress(this.readyTime / CONFIG.ui.autoStartDelay);
        if (this.readyTime >= CONFIG.ui.autoStartDelay) this.start();
      }
    } else if (this.state === 'playing') {
      this.nominalSpeed = speedAt(this.score.meters);
      this.scrollSpeed = this.nominalSpeed * this.view.speedFactor;
      dx = this.scrollSpeed * dt;
      this.track += dx;
      this.score.meters += this.nominalSpeed * dt / CONFIG.unitsPerMeter;
      this.player.update(dt, this.scrollSpeed);
      this.generator.update();
      this._updateApartments(dt, dx);
      this._updateObstacles(dt, dx);
      if (this.state === 'playing') this._updateProgress();
    } else if (this.state === 'dying') {
      // мир замер, двигается только герой (и собака — она бежит дальше)
      this.player.update(dt, 0);
      for (const o of this.obstacles) o.update(dt, 0);
      for (const a of this.apartments) a.update(dt, 0);
      this.stateTime += dt;
      if (this.stateTime >= CONFIG.ui.gameOverDelay) this._finish();
    } else {
      this.player.update(dt, 0);
    }

    this.background.update(dx, dt);
    this.particles.update(dt, dx);
    this._updateStreaks(dt, dx);
    this.shake = Math.max(0, this.shake - dt * 42);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.kick *= Math.exp(-7 * dt);
    this.camY = lerp(this.camY, this.player.dead ? 0 : this.player.h * 0.07, 1 - Math.exp(-10 * dt));
  }

  _updateObstacles(dt, dx) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.update(dt, dx);
      if (o.x + o.w < -90) { this.obstacles.splice(i, 1); continue; }     // ушло за экран
      if (CollisionSystem.obstacle(this.player, o)) { this._crash(o); return; }
      if (!o.passed && o.x + o.w < this.player.hitLeft) o.passed = true;
    }
  }

  _updateApartments(dt, dx) {
    const p = this.player, gy = this.view.groundY;
    for (let i = this.apartments.length - 1; i >= 0; i--) {
      const a = this.apartments[i];
      a.update(dt, dx);
      const gap = a.x - p.hitRight;

      // «Цена выросла»: дорожает на подходе, очков становится меньше
      if (a.event === 'priceUp' && !a.bumped && gap < 300) {
        a.bumped = true;
        a.price += 5000;
        a.points = Math.max(50, Math.round(a.points / 2 / 50) * 50);
        a.shake = 0.4;
        a.refreshTexts();
        this.ui.toast({ title: TEXTS.priceUp[0], sub: TEXTS.priceUp[1], tone: 'event', ms: 1900, priority: 2 });
        this.audio.play('vanish');
      }

      // «Собственник передумал»: исчезает прямо перед игроком
      if (a.event === 'vanish' && gap < (p.onGround ? 40 : 120)) {
        const t = this.rng.pick(TEXTS.vanish);
        this.ui.toast({ title: t[0], sub: t[1], tone: 'event', ms: 2000, priority: 2 });
        this.audio.play('vanish');
        this._poof(a.x + a.w / 2, gy - a.bottom - a.h / 2);
        this.ui.clearHint('flat');
        this.apartments.splice(i, 1);
        continue;
      }

      if (CollisionSystem.apartment(p, a)) {
        this._collect(a);
        this.apartments.splice(i, 1);
        continue;
      }

      if (!a.missed && a.x + a.w < p.hitLeft) {
        a.missed = true;
        this.ui.clearHint(a.tier === 'bad' ? 'bad' : 'flat');
        if (a.tier !== 'bad' && this.rng.chance(0.4)) {
          const t = this.rng.pick(TEXTS.missed);
          this.ui.toast({ title: t[0], sub: t[1], tone: 'info', ms: 1600, priority: 1 });
        }
      }
      if (a.x + a.w < -90) this.apartments.splice(i, 1);
    }
  }

  _collect(a) {
    const gy = this.view.groundY, cx = a.x + a.w / 2, cy = gy - a.bottom - a.h / 2;
    if (a.tier === 'bad') {
      this.score.add(a.points);
      const t = this.rng.pick(TEXTS.bad);
      this.ui.toast({ title: t[0], sub: t[1], tone: 'bad', ms: 1700, priority: 2 });
      this.ui.clearHint('bad');
      this.ui.bump(true);
      this.audio.play('bad');
      Platform.haptic('crash');
      this.flash = 0.4;
      this.flashColor = '255,77,61';
      this.shake = 7;
      this._burst(cx, cy, 14, [C.danger, C.ink]);
      this.particles.emit({ shape: 'text', text: `−${Math.abs(a.points)}`, x: cx, y: cy, vy: -70, drag: 2.2, life: 1, size: 22, color: C.danger, outline: C.white });
      return;
    }

    this.score.add(a.points);
    this.score.apartments++;
    const big = a.tier === 'jackpot' || a.tier === 'rare';
    this.ui.toast({ title: a.tier === 'jackpot' ? TEXTS.jackpot : TEXTS.collected, tone: 'good', ms: 1300, priority: 1, key: true });
    this.ui.clearHint('flat');
    this.audio.play(big ? 'bonus' : 'collect');
    Platform.haptic('collect');
    this.kick = big ? 12 : 7;
    this._burst(cx, cy, big ? 30 : 16, [C.lime, C.ink, C.white]);
    this.particles.emit({ shape: 'ring', x: cx, y: cy, size: 20, grow: big ? 120 : 80, width: 6, life: 0.45, color: C.lime });
    this.particles.emit({ shape: 'text', text: `+${a.points}`, x: cx, y: cy, vy: -80, drag: 2.2, life: 1, size: big ? 30 : 24, color: C.lime });
    // ключ улетает в счёт
    const s = this.view.scale;
    this.particles.emit({
      shape: 'fly', x: cx, y: cy, tx: 60 / s, ty: 62 / s, life: 0.55, size: 12, color: C.lime, world: false, fade: false,
      done: () => this.ui.bump(false),
    });
    if (a.tier === 'jackpot') { this.flash = 0.35; this.flashColor = '211,244,78'; }
  }

  _burst(x, y, n, colors) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * TAU, sp = 90 + Math.random() * 260;
      this.particles.emit({
        shape: i % 3 ? 'rect' : 'circle', x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 60, g: 700, drag: 1.6,
        size: 4 + Math.random() * 5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16,
        life: 0.5 + Math.random() * 0.35, color: colors[i % colors.length],
      });
    }
  }

  _poof(x, y) {
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * TAU, sp = 40 + Math.random() * 120;
      this.particles.emit({ x: x + Math.cos(ang) * 30, y: y + Math.sin(ang) * 20, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, drag: 3, size: 6 + Math.random() * 8, grow: 1.2, life: 0.5, color: '#CFCFCF', alpha: 0.85 });
    }
  }

  _confetti() {
    const colors = [C.lime, C.ink, C.white];
    for (let i = 0; i < 46; i++) {
      this.particles.emit({
        shape: 'rect', world: false, x: Math.random() * this.view.w, y: -10 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 200, g: 260,
        size: 6 + Math.random() * 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14,
        life: 1.6 + Math.random() * 0.8, color: colors[i % 3],
      });
    }
  }

  /* Район, рекорд на ходу, фоновые шутки */
  _updateProgress() {
    const m = this.score.meters, D = CONFIG.districts;

    let idx = this.districtIndex;
    while (idx + 1 < D.length && m >= D[idx + 1].from) idx++;
    if (idx !== this.districtIndex) {
      this.districtIndex = idx;
      this.background.setDistrict(idx);
      this.ui.toast({ title: D[idx].toast || D[idx].name, sub: D[idx].note, tone: 'district', ms: 2600, priority: 3 });
      this.audio.play('district');
      this.kick = 12;
    }

    const total = this.score.total;
    if (!this.recordBroken && this.prevBest > 0 && total > this.prevBest) {
      this.recordBroken = true;
      this.ui.toast({ title: TEXTS.record, tone: 'good', ms: 2200, priority: 3 });
      this.audio.play('record');
      Platform.haptic('collect');
      this._confetti();
    }
    if (this.recordBroken) this.ui.setRecord(total, true);

    if (m >= this.nextJokeAt) {
      if (this.ui.toastIdle) {
        const j = this.rng.pick(TEXTS.jokes);
        this.ui.toast({ title: j[0], sub: j[1], tone: 'info', ms: 2400, priority: 0 });
        this.nextJokeAt = m + this.rng.range(CONFIG.ui.jokeEvery[0], CONFIG.ui.jokeEvery[1]);
      } else {
        this.nextJokeAt = m + 60;
      }
    }
  }

  _updateStreaks(dt, dx) {
    const want = this.state === 'playing' ? Math.round(this.difficulty * 8) : 0;
    const v = this.view;
    const fresh = anywhere => ({ x: anywhere ? Math.random() * v.w : v.w + Math.random() * 200, y: v.groundY - 16 - Math.random() * 230, len: 40 + Math.random() * 90 });
    while (this.streaks.length < want) this.streaks.push(fresh(true));
    if (this.streaks.length > want) this.streaks.length = want;
    for (const s of this.streaks) {
      s.x -= dx * 1.9 + 240 * dt;
      if (s.x + s.len < 0) Object.assign(s, fresh(false));
    }
  }

  /* ---------- Конец забега ---------- */
  _crash(o) {
    const p = this.player, gy = this.view.groundY;
    this.state = 'dying';
    this.stateTime = 0;
    this.hitStop = 0.085;
    this.scrollSpeed = 0;
    this.cause = this.rng.pick(o.def.messages);
    p.die();
    this.shake = 16;
    this.flash = 0.6;
    this.flashColor = '255,255,255';
    this.audio.play('crash');
    Platform.haptic('crash');
    this.ui.clearHint();

    const ix = p.hitRight, iy = gy - p.h - 24;
    this._burst(ix, iy, 12, [C.ink, C.danger, C.white]);
    this.particles.emit({ shape: 'ring', x: ix, y: iy, size: 8, grow: 70, width: 5, life: 0.35, color: C.ink });
    for (let i = 0; i < 3; i++) {       // ключи вылетают из рук
      this.particles.emit({
        shape: 'key', x: p.x + 6, y: iy - 6, vx: -40 + i * 130 + Math.random() * 60, vy: -360 - Math.random() * 160, g: 1500,
        rot: Math.random() * TAU, vr: 10 + Math.random() * 12, size: 9, color: C.lime, life: 1.5, floor: gy - 5, fade: false,
      });
    }
  }

  /* Игрок ни разу не тапнул (например, отвлёкся во время автостарта):
     забег не считаем и возвращаемся на первый экран — уже без автостарта */
  _backToStart() {
    this.state = 'ready';
    this.autoStart = false;
    this.score.reset();
    this.player.reset();
    this.obstacles.length = 0;
    this.apartments.length = 0;
    this.particles.clear();
    this.streaks.length = 0;
    this.districtIndex = 0;
    this.result = null;
    this.background.reset();
    this.ui.clearToasts();
    this.ui.clearHint();
    this.ui.showStart(this.storage.data.best, false);
  }

  _finish() {
    if (this.player.jumps === 0) { this._backToStart(); return; }
    const s = this.score;
    const result = {
      score: s.total,
      meters: Math.floor(s.meters),
      apartments: s.apartments,
      cause: this.cause,
      headline: this.rng.pick(TEXTS.headlines),
      percentile: Services.leaderboard.percentile(s.total),
      user: Platform.user(),
    };
    result.isRecord = this.storage.recordRun(result, Services.daily.dayKey());
    result.best = this.storage.data.best;
    this.result = result;
    this.state = 'over';
    this.overAt = performance.now();
    this.ui.clearToasts();
    this.ui.setRecord(result.best, false);
    this.ui.showGameOver(result);
    if (result.isRecord) { this.audio.play('record'); Platform.haptic('collect'); }
    Services.leaderboard.submit(result);
  }

  /* ---------- Кадр ---------- */
  _frame(now) {
    requestAnimationFrame(this._frame);
    if (this.manual) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!(dt > 0)) return;
    if (dt > 0.1) dt = 0.1;                              // вкладка была неактивна
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < 14) { this.update(STEP); this.acc -= STEP; steps++; }
    if (steps === 14) this.acc = 0;
    this.render();
  }

  render() {
    const ctx = this.ctx, v = this.view, k = v.scale * v.dpr, gy = v.groundY;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    this.background.drawSky(ctx);

    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(sx - this.kick, sy + this.camY);
    this.background.drawCity(ctx);
    this.background.drawGround(ctx);

    // скоростные штрихи
    if (this.streaks.length) {
      ctx.fillStyle = `rgba(28,28,28,${0.05 + this.difficulty * 0.07})`;
      ctx.beginPath();
      for (const s of this.streaks) ctx.rect(s.x, s.y, s.len, 1.6);
      ctx.fill();
    }

    for (const a of this.apartments) a.draw(ctx, gy);
    for (const o of this.obstacles) o.draw(ctx, gy);

    // тень героя
    const sh = clamp(1 - this.player.h / 190, 0.35, 1);
    ctx.fillStyle = 'rgba(28,28,28,.16)';
    ctx.beginPath();
    ctx.ellipse(this.player.x + this.player.knock - (this.player.dead ? 22 : 0), gy + 2, (this.player.dead ? 30 : 16) * sh, 3.6 * sh, 0, 0, TAU);
    ctx.fill();
    this.player.draw(ctx, gy);
    this.particles.draw(ctx);

    if (DEBUG) this._drawDebug(ctx);
    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(${this.flashColor},${Math.min(0.75, this.flash)})`;
      ctx.fillRect(0, 0, v.w, v.h);
    }

    this.ui.sync(this.score.total, Math.floor(this.score.meters), this.score.apartments);
  }

  /* ?debug в адресе — показывает зоны столкновений */
  _drawDebug(ctx) {
    const gy = this.view.groundY, p = this.player, ph = p.hit;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00A2FF';
    ctx.strokeRect(ph.x, gy - p.h - ph.h, ph.w, ph.h);
    ctx.strokeStyle = '#FF00AA';
    for (const o of this.obstacles) { const h = o.hit; ctx.strokeRect(h.x, gy - h.h, h.w, h.h); }
    ctx.strokeStyle = '#00B84A';
    for (const a of this.apartments) ctx.strokeRect(a.x, gy - a.top, a.w, a.h);
  }
}

/* ───────────────────────────── ЗАПУСК ───────────────────────────── */
function boot() {
  Platform.init();
  const sdk = document.getElementById('tg-sdk');
  if (sdk) sdk.addEventListener('load', () => Platform.init());

  const game = new Game();

  // подгружаем шрифты для надписей на холсте (если не загрузятся — останутся системные)
  if (document.fonts && document.fonts.load) {
    ['900 16px "Unbounded"', '800 16px "Unbounded"', '700 12px "Manrope"'].forEach(f => document.fonts.load(f, 'Район ₽').catch(() => {}));
  }

  // для отладки и будущих расширений
  window.KTM = { game, CONFIG, TEXTS, Services, Platform, Share, LevelGenerator, CollisionSystem, speedAt, jumpTimes, STEP };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
