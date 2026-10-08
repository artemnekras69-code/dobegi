/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — игра

   Оглавление
     1. ParticleSystem   частицы (с пулом объектов)
     2. Player           бег, прыжок, пригнуться
     3. Obstacle, Apartment
     4. CollisionSystem
     5. ScoreSystem      очки и серия
     6. LevelGenerator   процедурный уровень без тупиков
     7. Game             цикл, ввод, состояния
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, clamp, lerp, fmt, makeRng, Pool, speedAt, levelAt, jumpTimes, roofJumpTime, rr, poly } = K.util;
const CONFIG = K.CONFIG, TEXTS = K.TEXTS, FONT = K.FONT, C = CONFIG.colors, Art = K.Art;
const STEP = 1 / 120;           // фиксированный шаг физики: одинаково на 60 и 120 Гц

/* ───────────────────────────── 1. PARTICLES ───────────────────────────── */
const PARTICLE = {
  x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 0.6, age: 0, size: 4, color: C.ink,
  shape: 'circle', rot: 0, vr: 0, alpha: 1, grow: 0, width: 3, world: true, floor: null, fade: true,
  text: '', outline: '', tx: 0, ty: 0, done: null,
};

class ParticleSystem {
  constructor() {
    this.items = [];
    this.pool = new Pool(() => ({}));
  }

  clear() {
    for (const p of this.items) this.pool.put(p);
    this.items.length = 0;
  }

  emit(props) {
    if (this.items.length > 260) this.pool.put(this.items.shift());
    this.items.push(Object.assign(this.pool.get(), PARTICLE, props));
  }

  update(dt, dx) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.age += dt;
      if (p.age >= p.life) {
        const done = p.done;
        items.splice(i, 1);
        this.pool.put(p);
        if (done) done();
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
        case 'circle': {                                 // рубленый осколок: пыль, брызги
          const r = p.size * (1 + k * p.grow), a = p.rot + p.x * 0.05;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) { const b = a + i * 1.257, rr = i % 2 ? r * 0.72 : r; if (i) ctx.lineTo(p.x + Math.cos(b) * rr, p.y + Math.sin(b) * rr); else ctx.moveTo(p.x + Math.cos(b) * rr, p.y + Math.sin(b) * rr); }
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'ring': {                                   // расходящиеся штрихи вместо кольца
          const r0 = p.size + k * p.grow * 0.55, r1 = p.size + k * p.grow;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.6, p.width * (1 - k));
          ctx.lineCap = 'butt';
          ctx.beginPath();
          for (let i = 0; i < 10; i++) { const b = i * 0.628 + 0.2; ctx.moveTo(p.x + Math.cos(b) * r0, p.y + Math.sin(b) * r0); ctx.lineTo(p.x + Math.cos(b) * r1, p.y + Math.sin(b) * r1); }
          ctx.stroke();
          break;
        }
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
          ctx.rotate(-0.06);
          ctx.font = `900 ${p.size * 1.25}px ${FONT.display}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'miter';
          ctx.miterLimit = 2.4;
          ctx.lineWidth = Math.max(3, p.size * 0.26);
          ctx.strokeStyle = p.outline || C.ink;
          ctx.strokeText(p.text, p.size * 0.07, p.size * 0.09);     // плашка-тень со сдвигом, как при печати
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

/* ───────────────────────────── 2. PLAYER ─────────────────────────────
   Три состояния: бег, прыжок, пригнувшись. Высота опоры (floor) приходит снаружи:
   0 — земля, больше нуля — крыша машины или блок, на который герой запрыгнул. */
class Player {
  constructor(game) {
    this.game = game;
    this.x = 100;
    this.reset();
  }

  reset() {
    this.h = 0;                 // высота ног над землёй
    this.vy = 0;
    this.onGround = true;
    this.buffer = 0;            // запомненный тап
    this.crouch = false;
    this.crouchT = 0;           // сколько ещё герой точно пригнут
    this.crouchHeld = false;    // палец или клавиша всё ещё держат
    this.crouchQueued = false;  // свайп был в воздухе — пригнётся при приземлении
    this.phase = 0;
    this.air = 0;               // 0 — на опоре, 1 — в воздухе (плавный переход позы)
    this.duck = 0;              // 0 — стоя, 1 — пригнувшись
    this.sq = 0;                // squash & stretch: пружина
    this.sqV = 0;
    this.dead = false;
    this.rot = 0;
    this.knock = 0;
    this.knockV = 0;
    this.jumps = 0;
    this.ducks = 0;
    this.floorNow = 0;          // высота опоры под ногами (для тени и пыли)
    this.landT = 9;             // сколько прошло после приземления — для кадра «присел»
    this.crouchAge = 0;         // сколько герой уже пригнут — для кадра входа
    this.deadT = 0;             // сколько прошло после удара
  }

  get hitW() { return this.crouch ? CONFIG.player.crouchWidth : CONFIG.player.hitWidth; }
  get hitH() { return this.crouch ? CONFIG.player.crouchHeight : CONFIG.player.hitHeight; }
  get hitLeft() { return this.x - this.hitW / 2; }
  get hitRight() { return this.x + this.hitW / 2; }

  /* Один тап — один прыжок */
  requestJump() { this.buffer = CONFIG.player.jumpBuffer; }

  /* Свайп вниз. На земле — пригнуться, в воздухе — быстро упасть и пригнуться при приземлении */
  requestCrouch(held) {
    this.crouchHeld = !!held;
    if (this.dead) return;
    if (this.onGround) this._startCrouch();
    else {
      this.vy = Math.min(this.vy, -CONFIG.player.fastFall);
      this.crouchQueued = true;
    }
  }

  releaseCrouch() { this.crouchHeld = false; }

  _startCrouch() {
    if (!this.crouch) { this.crouch = true; this.crouchAge = 0; this.ducks++; this.game.onCrouch(); }
    this.crouchT = CONFIG.player.crouchTime;
  }

  die() {
    this.dead = true;
    this.deadT = 0;
    this.crouch = false;
    this.onGround = false;
    this.vy = 430;
    this.sq = -0.3;             // в момент удара героя плющит
    this.knockV = -110;         // отбрасывает назад от препятствия
  }

  update(dt, speed, floor) {
    const P = CONFIG.player, g = this.game;

    if (this.dead) {
      this.deadT += dt;
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
      this.air = lerp(this.air, 1, 1 - Math.exp(-18 * dt));
      this._spring(dt);
      return;
    }

    this.buffer -= dt;
    this.landT += dt;
    if (this.crouch) this.crouchAge += dt;

    if (this.onGround) {
      if (floor > this.h + 0.01) { this.h = floor; this.sq = Math.min(this.sq, -0.1); }   // заскочил на ступеньку
      else if (floor < this.h - 0.01) { this.onGround = false; this.vy = 0; }             // опора кончилась — падаем
    }

    if (this.onGround && this.buffer > 0) {
      this.buffer = 0;
      this.onGround = false;
      this.vy = P.jumpVelocity;
      this.sq = 0.3;
      this.sqV = 0;
      this.crouch = false;
      this.crouchQueued = false;
      this.jumps++;
      g.onJump();
    }

    if (!this.onGround) {
      this.h += this.vy * dt - 0.5 * P.gravity * dt * dt;
      this.vy -= P.gravity * dt;
      if (this.h <= floor && this.vy <= 0) {
        this.h = floor;
        this.vy = 0;
        this.onGround = true;
        this.landT = 0;
        this.sq = -0.3;
        this.sqV = 0;
        g.onLand();
        if (this.crouchQueued || this.crouchHeld) this._startCrouch();
        this.crouchQueued = false;
      }
    } else {
      const before = this.phase;
      // цикл бега — 8 кадров: чем быстрее бег, тем чаще шаг, но кадры успевают читаться
      this.phase += dt * TAU * clamp(speed / 170, 2, 3.4) * (this.crouch ? 1.2 : 1);
      if (Math.floor(this.phase / Math.PI) !== Math.floor(before / Math.PI)) g.onStep();
    }

    if (this.crouch) {
      this.crouchT -= dt;
      if (this.crouchT <= 0 && !this.crouchHeld) this.crouch = false;
    }

    this.air = lerp(this.air, this.onGround ? 0 : 1, 1 - Math.exp(-18 * dt));
    this.duck = lerp(this.duck, this.crouch ? 1 : 0, 1 - Math.exp(-26 * dt));
    this._spring(dt);
  }

  _spring(dt) {
    this.sqV += (-380 * this.sq - 20 * this.sqV) * dt;
    this.sq += this.sqV * dt;
  }

  draw(ctx, gy) { Art.player(ctx, this, gy); }
}

/* ───────────────────────────── 3. OBSTACLE, APARTMENT ───────────────────────────── */
class Obstacle {
  init(def, x, opts) {
    this.def = def;
    this.x = x;                 // левый край картинки
    this.w = def.w;
    this.h = def.h;
    this.vx = def.vx || 0;
    this.t = 0;
    this.passed = false;
    this.used = false;          // лужа уже сработала, ключи уже подобраны
    this.variant = (opts && opts.variant) || 0;
    this.text = (opts && opts.text) || '';
    this.flag = (opts && opts.flag) || '';
    this.look = (opts && opts.look) || '';
    return this;
  }

  update(dt, dx) {
    this.x -= dx + this.vx * dt;
    this.t += dt;
  }

  draw(ctx, gy) {
    ctx.save();
    ctx.translate(this.x, gy);
    Art.shadowFor(ctx, this);
    Art.obstacles[this.def.id](ctx, this);
    ctx.restore();
  }
}

class Apartment {
  init(data, quality, event, x) {
    const A = CONFIG.apartments;
    this.data = data;
    this.quality = quality;     // great | good | bad | awful
    this.event = event;         // '' | 'vanish' | 'priceUp'
    this.x = x;
    this.w = A.width;
    this.h = A.height;
    this.price = data.price;
    this.pointsMul = 1;
    this.t = 0;
    this.shake = 0;
    this.bumped = false;
    this.missed = false;
    this.refreshTexts();
    return this;
  }

  get bottom() { return CONFIG.apartments.floatHeight; }
  get top() { return CONFIG.apartments.floatHeight + this.h; }
  get isGood() { return this.quality === 'good' || this.quality === 'great'; }
  get ppm() { return Math.round(this.price / this.data.area / 10) * 10; }

  refreshTexts() {
    const d = this.data;
    this.title = d.label || (d.rooms ? `${d.rooms}-КОМН.` : 'СТУДИЯ');
    this.areaText = `${d.area} м²`;
    this.priceText = `${fmt(this.price)} ₽`;
    this.metroText = `${d.distanceToMetro} мин`;
  }

  /* Короткое объяснение, почему квартира хорошая или плохая: так игрок учится читать карточки */
  reason() {
    const d = this.data;
    if (!this.isGood && d.distanceToMetro >= 15 && this.ppm < 2200) return `${d.distanceToMetro} мин до метро`;
    return `${fmt(this.ppm)} ₽ за метр`;
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
    ctx.scale(A.width / 168, A.height / 120);
    Art.card(ctx, this);
    ctx.restore();
  }
}

/* ───────────────────────────── 4. COLLISIONS ───────────────────────────── */
const CollisionSystem = {
  /* Обычное препятствие: зона [низ, верх]. Наземное — низ 0, висящее — низ 38 */
  hits(player, o) {
    const hit = o.def.hit;
    const x0 = o.x + hit[0], x1 = o.x + o.w - hit[0];
    return player.hitRight > x0 && player.hitLeft < x1 && player.h < hit[2] && player.h + player.hitH > hit[1];
  },

  /* Платформа (машина, блок). Возвращает 'crash', высоту опоры или 0.
     Если ноги ниже края не больше чем на stepUp — герой заскакивает наверх. */
  platform(player, o) {
    const stepUp = CONFIG.player.stepUp, px0 = player.hitLeft, px1 = player.hitRight;
    let floor = 0;
    for (const seg of o.def.profile) {
      if (px1 <= o.x + seg[0] || px0 >= o.x + seg[1]) continue;
      if (player.h >= seg[2] - stepUp) { if (seg[2] > floor) floor = seg[2]; }
      else return 'crash';
    }
    return floor;
  },

  apartment(player, a) {
    return player.hitLeft < a.x + a.w && player.hitRight > a.x && player.h + player.hitH > a.bottom && player.h < a.top;
  },
};

/* ───────────────────────────── 5. SCORE ───────────────────────────── */
class ScoreSystem {
  constructor() { this.reset(); }

  reset() {
    this.meters = 0;
    this.bonus = 0;
    this.apartments = 0;        // сколько хороших квартир снято
    this.streak = 0;            // хороших подряд
    this.bestStreak = 0;
  }

  get distancePoints() {
    const S = CONFIG.score;
    return Math.floor(this.meters / S.metersStep) * S.pointsPerStep;
  }
  get total() { return Math.max(0, this.distancePoints + this.bonus); }

  /* Множитель серии: 3 подряд — ×2, 5 — ×3, 10 — ×5 */
  get multiplier() {
    let m = 1;
    for (const [need, mult] of CONFIG.combo) if (this.streak >= need) m = mult;
    return m;
  }
  /* Сколько хороших квартир осталось до следующего множителя (0 — максимум) */
  get toNext() {
    for (const [need] of CONFIG.combo) if (this.streak < need) return need - this.streak;
    return 0;
  }

  add(points) {
    this.bonus += points;
    if (this.distancePoints + this.bonus < 0) this.bonus = -this.distancePoints;   // счёт не уходит в минус
  }
}

/* ───────────────────────────── 6. LEVEL GENERATOR ─────────────────────────────
   Уровень не хранится заранее. Генератор планирует объекты по одному и для каждого
   считает, когда он «доедет» до игрока (arriveAt — в юнитах пройденного пути).

   Чтобы не было непроходимых мест:
   1) объект берётся, только если при текущей скорости на него хватает времени:
      окно для прыжка или для «пригнись» не уже заданного минимума;
   2) следующий объект приезжает не раньше, чем игрок гарантированно закончит
      предыдущее действие (даже самое позднее) плюс запас на реакцию;
   3) квартиры ставятся отдельно от препятствий: любую можно пропустить, просто
      не прыгая, а хорошую — собрать и успеть к следующему препятствию.

   Комбинации (прыжок → пригнись → прыжок) — это те же объекты, только без
   случайной прибавки к промежутку: плотно, но по тем же правилам. */
function obstacleInfo(def, v) {
  const P = CONFIG.player, G = CONFIG.generator;
  const vrel = v + (def.vx || 0);
  const air = 2 * P.jumpVelocity / P.gravity;

  if (def.type === 'platform') {
    const first = def.profile[0], last = def.profile[def.profile.length - 1];
    const jt = jumpTimes(first[2] - P.stepUp + 3);
    if (!jt) return null;
    let maxTop = 0;
    for (const s of def.profile) maxTop = Math.max(maxTop, s[2]);
    const len = last[1] - first[0];
    return {
      lead: jt.t1, early: jt.t2, window: jt.t2 - jt.t1, min: G.minJumpWindow, ix: first[0],
      // позже всего игрок окажется на земле, если спрыгнет с дальнего края крыши
      release: arrive => arrive + (len + P.hitWidth) * v / vrel + v * roofJumpTime(maxTop),
    };
  }

  const ix = def.hit[0], len = def.w - ix * 2;

  if (def.type === 'duck') {
    const over = (len + P.crouchWidth) / vrel;
    const jt = def.hit[2] < 200 ? jumpTimes(def.hit[2] + 3) : null;     // тонкое можно и перепрыгнуть
    const jumpable = jt && (jt.t2 - jt.t1) > (len + P.hitWidth) / vrel;
    return {
      lead: G.duckLead, early: jumpable ? jt.t2 - (len + P.hitWidth) / vrel : 0, window: P.crouchTime - G.duckLead - over, min: G.minDuckWindow, ix,
      release: arrive => Math.max(arrive + (len + P.crouchWidth) * v / vrel, jumpable ? arrive + v * (jt.air - jt.t1) : 0),
    };
  }

  if (def.type === 'soft') return { lead: 0, early: air, window: 9, min: 0, ix, release: arrive => arrive + len + P.hitWidth + v * air };
  if (def.type === 'pickup') return { lead: 0, early: 0, window: 9, min: 0, ix, release: arrive => arrive };

  const jt = jumpTimes(def.hit[2] + 3);                // +3 — запас по высоте
  if (!jt) return null;
  return {
    lead: jt.t1, early: jt.t2 - (len + P.hitWidth) / vrel, window: (jt.t2 - jt.t1) - (len + P.hitWidth) / vrel, min: G.minJumpWindow, ix,
    release: arrive => arrive + v * (jt.air - jt.t1),
  };
}

class LevelGenerator {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.rng = makeRng(this.game.seed || 1);
    this.planned = [];          // запланировано, но ещё не на экране
    this.count = 0;
    this.sinceCard = 0;
    this.release = 0;           // точка пути, после которой игрок точно свободен
    this.horizon = 0;           // arriveAt последнего запланированного объекта
    this.history = [];          // последние объекты — чтобы не повторялись
    this.pattern = [];          // остаток текущей комбинации
    this.lastBad = false;
    this.cardEnd = -1e9;        // где кончается последняя квартира: прыжок через следующее препятствие её не заденет
    this.bonusGap = 0;          // разовая передышка (смена района)
  }

  breather(seconds) { this.bonusGap += seconds; }

  update() {
    const g = this.game, v = g.scrollSpeed;
    const edge = g.view.w + 60;                        // объекты появляются за правым краем
    const lookahead = edge - g.player.x - CONFIG.player.hitWidth / 2;
    let guard = 0;
    while (this.horizon < g.track + lookahead + v && guard++ < 20) this._planNext(lookahead);

    for (let i = this.planned.length - 1; i >= 0; i--) {
      const item = this.planned[i];
      const ratio = (v + item.vx) / v;                 // подвижные объекты сближаются быстрее мира
      const x = g.player.x + CONFIG.player.hitWidth / 2 + (item.arriveAt - g.track) * ratio;
      if (x <= edge + (item.kind === 'card' ? 0 : item.def.w * 0.2)) {
        this.planned.splice(i, 1);
        if (item.kind === 'card') g.spawnCard(item, x);
        else g.spawnObstacle(item, x - item.ix);
      }
    }
  }

  _planNext(lookahead) {
    const g = this.game, G = CONFIG.generator;
    const v = g.scrollSpeed, d = g.difficulty, level = g.level;
    const react = lerp(G.reaction[0], G.reaction[1], d);
    const item = this._choose(v, level);

    let extra;
    if (this.count < G.intro.length) extra = G.introGap;
    else if (item.tight) extra = this.rng.range(0, G.patternGap);
    else {
      extra = this.rng.range(0, lerp(G.extraGap[0], G.extraGap[1], d));
      if (this.rng.chance(G.breatherChance)) extra += G.breatherTime;
    }
    extra += this.bonusGap;
    this.bonusGap = 0;

    let earliest = this.count === 0
      ? g.track + Math.max(v * G.firstItemDelay, lookahead + 40)
      : this.release + v * (react + item.lead);
    // даже самый ранний прыжок через это препятствие начнётся, когда квартира уже позади:
    // плохую карточку нельзя зацепить случайно
    if (item.kind !== 'card') earliest = Math.max(earliest, this.cardEnd + v * item.early);
    item.arriveAt = earliest + v * extra;
    if (item.kind === 'card') this.cardEnd = item.arriveAt + CONFIG.apartments.width + CONFIG.player.hitWidth;
    this.release = Math.max(this.release, item.release(item.arriveAt));
    this.horizon = item.arriveAt;
    this.count++;
    this.planned.push(item);
  }

  /* Что ставить следующим: по сценарию вступления, по комбинации или случайно */
  _choose(v, level) {
    const G = CONFIG.generator, A = CONFIG.apartments;
    let want = G.intro[this.count], tight = false;

    if (!want) {
      if (!this.pattern.length && this.rng.chance(G.patternChance[level - 1])) this.pattern = this._makePattern(level);
      if (this.pattern.length) {
        const step = this.pattern.shift();
        want = step.kind;
        tight = step.tight;
      } else if (this.sinceCard >= A.minObstaclesBetween && (this.sinceCard >= A.maxObstaclesBetween || this.rng.chance(A.chance))) {
        want = 'card';
      }
    }

    if (want === 'card') {
      this.sinceCard = 0;
      const card = this._card(v, level, this.count < G.intro.length);
      card.tight = tight;
      return card;
    }
    const item = this._obstacle(v, level, want);
    item.tight = tight;
    if (item.def.type !== 'soft' && item.def.type !== 'pickup') this.sinceCard++;
    return item;
  }

  _makePattern(level) {
    const G = CONFIG.generator, maxLen = G.patternLength[level - 1];
    const len = this.rng.int(2, Math.max(2, maxLen));
    const steps = [];
    let hasCard = false;
    for (let i = 0; i < len; i++) {
      const kinds = [['jump', 5], ['duck', 3.2], ['platform', 1.1]];
      if (level >= 4 && !hasCard && this.sinceCard + i >= 2) kinds.push(['card', 2.4]);
      const prev = steps.length ? steps[steps.length - 1].kind : '';
      const kind = this.rng.weighted(kinds.map(([k, w]) => [k, k === prev ? w * 0.45 : w]));
      if (kind === 'card') hasCard = true;
      steps.push({ kind, tight: i > 0 });
    }
    return steps;
  }

  _eligible(def, v, level, meters, loc) {
    if (level < def.difficulty || meters < def.minimumDistance) return null;
    if (def.not && def.not.some(t => t === loc.id || loc.tags.includes(t))) return null;
    if (def.biome[0] !== 'any' && !def.biome.some(t => t === loc.id || loc.tags.includes(t))) return null;
    const info = obstacleInfo(def, v);
    if (!info || info.window < info.min) return null;
    return info;
  }

  _obstacle(v, level, want) {
    const g = this.game, G = CONFIG.generator, meters = g.score.meters, loc = g.locationAt(meters + 40);
    const pick = kind => {
      const list = [];
      for (const def of K.OBSTACLES) {
        if (kind === 'jump' && def.type !== 'jump' && def.type !== 'platform') continue;
        if (kind === 'platform' && def.type !== 'platform') continue;
        if (kind === 'duck' && def.type !== 'duck') continue;
        if (!kind && (def.type === 'soft' || def.type === 'pickup') && this.count < G.intro.length + 2) continue;
        const info = this._eligible(def, v, level, meters, loc);
        if (!info) continue;
        let w = G.rarity[def.rarity] || 1;
        if (this.history.includes(def.id)) w *= 0.2;
        list.push([{ def, info }, w]);
      }
      return list.length ? this.rng.weighted(list) : null;
    };
    let choice = pick(want) || pick('jump') || pick('');
    if (!choice) {                                     // запасной вариант: то, на что времени больше всего
      let best = null;
      for (const def of K.OBSTACLES) {
        if (def.type !== 'jump') continue;
        const info = obstacleInfo(def, v);
        if (info && (!best || info.window > best.info.window)) best = { def, info };
      }
      choice = best;
    }
    const def = choice.def;
    this.history.push(def.id);
    if (this.history.length > 3) this.history.shift();

    const opts = { variant: this.rng.int(0, 999), text: '', flag: '' };
    if (def.text === 'meme') opts.text = def.id === 'aboard' ? this.rng.pick(K.SHORT_MEMES) : this.rng.chance(0.4) ? 'УЖЕ СДАЛИ' : this.rng.pick(K.MEMES);
    else if (def.text === 'brand') opts.text = this.rng.pick(loc.brands);
    else if (def.text === 'van') opts.text = this.rng.pick(this.rng.chance(CONFIG.city.brandVans) ? K.VAN_BRANDS : K.VAN_PLAIN);
    if (def.id === 'car') {
      const r = this.rng.next();
      opts.flag = r < 0.07 ? 'cat' : r < 0.15 ? 'hazard' : '';
      // в дорогих районах машины дорогие, во дворах — «с дачи»
      opts.look = loc.tags.includes('premium') || loc.tags.includes('business') ? 'lux' : loc.tags.includes('yard') || loc.tags.includes('industrial') ? 'old' : '';
    }

    return { kind: 'obstacle', def, opts, vx: def.vx || 0, lead: choice.info.lead, early: choice.info.early, ix: choice.info.ix, release: choice.info.release };
  }

  _card(v, level, scripted) {
    const A = CONFIG.apartments, P = CONFIG.player, W = A.weights, meters = this.game.score.meters;
    const air = 2 * P.jumpVelocity / P.gravity;

    let quality = 'good';
    if (!(scripted && this.count < 3)) {               // самая первая квартира всегда хорошая
      const list = [['good', W.good], ['great', W.great]];
      if (meters >= A.badFrom) {
        const k = this.lastBad ? 0.5 : 1;              // три ловушки подряд — уже не смешно
        list.push(['bad', W.bad * k], ['awful', W.awful * k]);
      }
      quality = this.rng.weighted(list);
    }
    this.lastBad = quality === 'bad' || quality === 'awful';

    const all = K.listings();
    const tricky = meters >= A.trickyFrom;
    let pool = all.filter(a => a.quality === quality && (tricky || !a.tricky));
    if (!pool.length) pool = all.filter(a => a.quality === quality);
    if (!pool.length) pool = all;
    const data = pool.length ? this.rng.pick(pool)
      : { id: 'default', district: 'САО', metro: 'Сокол', rooms: 1, area: 38, price: 52000, commission: 0, distanceToMetro: 7, quality: 'good' };
    if (!pool.length || data.quality !== quality) quality = data.quality || 'good';

    let event = '';
    if (!scripted && !this.lastBad && meters >= A.eventFrom) {
      const r = this.rng.next();
      if (r < A.vanishChance) event = 'vanish';
      else if (r < A.vanishChance + A.priceUpChance) event = 'priceUp';
    }

    // чем выше уровень, тем плотнее за квартирой стоит препятствие: брать её становится рискованнее
    const risk = A.risk[level - 1];
    return {
      kind: 'card', data, quality, event, vx: 0, lead: 0,
      release: arrive => arrive + (1 - risk) * (A.width + P.hitWidth) + v * air,
    };
  }
}

/* ───────────────────────────── 7. GAME ───────────────────────────── */
class Game {
  constructor() {
    this.canvas = document.getElementById('stage');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.root = document.getElementById('app');

    this.storage = K.storage;
    this.audio = new K.AudioSystem(this.storage);
    this.particles = new ParticleSystem();
    this.score = new ScoreSystem();
    this.player = new Player(this);
    this.obstaclePool = new Pool(() => new Obstacle());
    this.cardPool = new Pool(() => new Apartment());

    this.view = { cw: 1, ch: 1, w: 600, h: 400, scale: 1, dpr: 1, groundY: 300, band: 100, speedFactor: 1, farScale: 1, maxBuildingH: 300 };
    this.state = 'menu';        // menu → playing ⇄ paused/countdown → dying → over
    this.manual = false;        // true — кадры двигает тест, а не requestAnimationFrame
    this.seed = 1;
    this.nextSeed = null;       // зерно следующего забега (тесты, «Квартира дня»)
    this.rng = makeRng(Date.now());
    this.obstacles = [];
    this.apartments = [];
    this.extras = [];           // пасхалки, которые ни на что не влияют
    this.impact = null;         // звезда в точке удара
    this.streaks = [];
    this.pointers = new Map();  // активные касания
    this.track = 0;             // пройденный путь в юнитах
    this.nominalSpeed = CONFIG.speed.start;
    this.scrollSpeed = 0;
    this.level = 1;
    this.plan = [];             // маршрут по районам: [{ from, to, loc }]
    this.planIndex = 0;
    this.preSwitched = false;
    this.stateTime = 0;
    this.countdown = 0;
    this.countdownT = 0;
    this.hitStop = 0;
    this.shake = 0;
    this.flash = 0;
    this.flashColor = '255,255,255';
    this.kick = 0;
    this.camY = 0;
    this.prevBest = this.storage.stats.best;
    this.recordBroken = false;
    this.nextJokeAt = 0;
    this.nextAgentAt = 0;
    this.overAt = 0;
    this.cause = '';
    this.result = null;
    this.discoveries = [];
    this.challenge = K.platform.challenge();
    this.acc = 0;
    this.last = performance.now();

    this._buildPlan();
    this.resize();
    this.world = new K.World(this);
    this.generator = new LevelGenerator(this);
    this.ui = new K.UI(this);
    this.resize();
    this.ui.showMenu();

    this._bindInput();
    this._frame = this._frame.bind(this);
    requestAnimationFrame(this._frame);
  }

  get difficulty() { const S = CONFIG.speed; return clamp((this.nominalSpeed - S.start) / (S.max - S.start), 0, 1); }

  /* ---------- Районы ---------- */
  _buildPlan() {
    const L = CONFIG.locations, all = K.LOCATIONS;
    const first = all.find(l => l.id === L.first) || all[0];
    const rest = this.rng.shuffle(all.filter(l => l !== first));
    this.planOrder = [first, ...rest];
    this.plan = [];
    this.planIndex = 0;
    this.preSwitched = false;
    this._extendPlan();
  }

  _extendPlan() {
    const L = CONFIG.locations;
    while (this.plan.length < this.planIndex + 3) {
      const i = this.plan.length;
      if (i >= this.planOrder.length && i % this.planOrder.length === 0) {
        // круг пройден — новый порядок, но без повтора района подряд
        const last = this.planOrder[this.planOrder.length - 1];
        let next = this.rng.shuffle(K.LOCATIONS);
        if (next[0] === last) next.push(next.shift());
        this.planOrder = this.planOrder.concat(next);
      }
      const from = i ? this.plan[i - 1].to : 0;
      this.plan.push({ from, to: from + Math.round(this.rng.range(L.length[0], L.length[1])), loc: this.planOrder[i] });
    }
  }

  get location() { return this.plan[this.planIndex].loc; }
  get nextLocation() { return this.plan[this.planIndex + 1] ? this.plan[this.planIndex + 1].loc : null; }
  get locationFrom() { return this.plan[this.planIndex].from; }
  get locationTo() { return this.plan[this.planIndex].to; }
  locationAt(meters) {
    for (let i = this.planIndex; i < this.plan.length; i++) if (meters < this.plan[i].to) return this.plan[i].loc;
    return this.plan[this.plan.length - 1].loc;
  }

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
      speedFactor: lerp(CONFIG.speed.narrowScreenFactor, 1, clamp((w - V.minWidth) / ((V.maxWidth - V.minWidth) || 1), 0, 1)),
      farScale: clamp(groundY / 330, 0.7, 2.2),     // на высоком экране силуэты крупнее: их видно над домами
      maxBuildingH: clamp(groundY * 0.6, 190, 400),
    };
    this.player.x = clamp(w * P.xRatio, P.xMin, P.xMax);
    if (this.world) {
      if (this.state === 'menu') this.world.reset(this.location);   // до старта просто строим город под новый размер
      else this.world.fill();
    }
    if (this.ui) this.ui.setSpotlight(this.player.x * scale, (groundY - 28) * scale);
  }

  /* ---------- Ввод ----------
     Тап — прыжок, свайп вниз — пригнуться, свайп вверх — прыжок.
     Чтобы отличить тап от свайпа, касание ждёт input.tapDelay секунд: если палец
     за это время не поехал вниз — это прыжок. */
  _bindInput() {
    const I = CONFIG.input;
    const isUi = e => e.target && e.target.closest && e.target.closest('button, a, input, .sheet');

    const down = e => {
      K.platform.touched = true;
      if (isUi(e)) return;
      if (e.cancelable) e.preventDefault();
      this.audio.unlock();
      if (this.state !== 'playing') return;
      if (e.pointerType === 'mouse') { if (e.button === 0) this.player.requestJump(); return; }
      const ptr = { x: e.clientX, y: e.clientY, acted: '', timer: 0 };
      ptr.timer = setTimeout(() => { if (!ptr.acted) { ptr.acted = 'jump'; if (this.state === 'playing') this.player.requestJump(); } }, I.tapDelay * 1000);
      this.pointers.set(e.pointerId, ptr);
    };
    const move = e => {
      const ptr = this.pointers.get(e.pointerId);
      if (!ptr || this.state !== 'playing') return;
      const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
      if (ptr.acted !== 'crouch' && dy > I.swipe && dy > Math.abs(dx)) {
        clearTimeout(ptr.timer);
        ptr.acted = 'crouch';
        this.player.requestCrouch(true);
      } else if (!ptr.acted && dy < -I.swipe && -dy > Math.abs(dx)) {
        clearTimeout(ptr.timer);
        ptr.acted = 'jump';
        this.player.requestJump();
      }
    };
    const up = e => {
      const ptr = this.pointers.get(e.pointerId);
      if (!ptr) return;
      clearTimeout(ptr.timer);
      this.pointers.delete(e.pointerId);
      if (!ptr.acted && this.state === 'playing') this.player.requestJump();
      if (ptr.acted === 'crouch') this.player.releaseCrouch();
    };

    if (window.PointerEvent) {
      this.root.addEventListener('pointerdown', down, { passive: false });
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    } else {
      // очень старые WebView без PointerEvent: только тап
      const tap = e => { K.platform.touched = true; if (isUi(e)) return; if (e.cancelable) e.preventDefault(); this.audio.unlock(); if (this.state === 'playing') this.player.requestJump(); };
      this.root.addEventListener('touchstart', tap, { passive: false });
      this.root.addEventListener('mousedown', tap);
    }
    this.root.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());

    document.addEventListener('keydown', e => {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;       // игрок вводит имя
      const jump = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
      const duck = e.code === 'ArrowDown' || e.code === 'KeyS';
      const pause = e.code === 'Escape' || e.code === 'KeyP';
      if (!jump && !duck && !pause && e.code !== 'Enter') return;
      e.preventDefault();
      K.platform.touched = true;
      if (e.repeat) return;                             // удержание клавиши не повторяет действие
      this.audio.unlock();
      if (pause) {
        if (this.state === 'playing' || this.state === 'countdown') this.pause();
        else if (this.state === 'paused') this.resume();
        return;
      }
      if (this.state === 'over') {
        if ((jump || e.code === 'Enter') && performance.now() - this.overAt > CONFIG.ui.restartGuard * 1000) this.restart();
        return;
      }
      if (this.state === 'menu') { if ((jump || e.code === 'Enter') && this.ui.screen === 'menu') this.play(); return; }
      if (this.state !== 'playing') return;
      if (jump) this.player.requestJump();
      else if (duck) this.player.requestCrouch(true);
    });
    document.addEventListener('keyup', e => {
      if (e.code === 'Space') e.preventDefault();
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.player.releaseCrouch();
    });

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(this.root);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state === 'playing' || this.state === 'countdown') this.pause();
        this.audio.suspend();
      } else {
        this.audio.resume();
        this.last = performance.now();
        this.acc = 0;
      }
    });
  }

  _dropPointers() {
    for (const ptr of this.pointers.values()) clearTimeout(ptr.timer);
    this.pointers.clear();
    this.player.releaseCrouch();
  }

  /* ---------- Состояния ---------- */
  play() {
    if (this.state !== 'menu') return;
    this.audio.unlock();
    this.audio.play('click');
    this._beginRun(false);
  }

  restart() {
    if (this.state !== 'over' && this.state !== 'paused') return;
    this.audio.unlock();
    this.audio.play('click');
    this._beginRun(true);
  }

  toMenu() {
    this.audio.play('click');
    this._clearRun();
    this.rng = makeRng(Date.now());
    this._buildPlan();
    this.world.reset(this.location);
    this.state = 'menu';
    this.ui.showMenu();
  }

  _clearRun() {
    for (const o of this.obstacles) this.obstaclePool.put(o);
    for (const a of this.apartments) this.cardPool.put(a);
    this.obstacles.length = 0;
    this.apartments.length = 0;
    this.extras.length = 0;
    this.impact = null;
    this.particles.clear();
    this.streaks.length = 0;
    this._dropPointers();
    this.score.reset();
    this.player.reset();
    this.hitStop = 0;
    this.shake = 0;
    this.flash = 0;
    this.kick = 0;
    this.camY = 0;
    this.result = null;
    this.ui.clearToasts();
    this.ui.clearHint();
  }

  _beginRun(fresh) {
    // Зерно уровня. Для «Квартиры дня» перед стартом задать game.nextSeed = KTM.daily.seed()
    this.seed = this.nextSeed != null ? this.nextSeed >>> 0 : (Date.now() ^ Math.floor(Math.random() * 0x7FFFFFFF)) >>> 0;
    this.nextSeed = null;
    this.rng = makeRng(this.seed ^ 0x9E3779B9);
    this._clearRun();
    this.track = 0;
    this.nominalSpeed = CONFIG.speed.start;
    this.scrollSpeed = this.nominalSpeed * this.view.speedFactor;
    this.level = 1;
    this.prevBest = this.storage.stats.best;
    this.recordBroken = false;
    this.discoveries = [];
    this.nextJokeAt = this.rng.range(CONFIG.ui.jokeEvery[0], CONFIG.ui.jokeEvery[1]) * 0.8;
    this.nextAgentAt = this.rng.range(700, 1300);
    const startLoc = this.location;
    this._buildPlan();
    if (fresh || this.location !== startLoc) this.world.reset(this.location);
    this.generator.reset();
    this.state = 'playing';
    this.ui.showGame(this.prevBest);
    if (this.storage.stats.games < CONFIG.ui.hintGames) this.ui.hint('jump', TEXTS.hintJump[this.ui.fineInput ? 1 : 0]);
    K.analytics.track('game_started', { seed: this.seed, games: this.storage.stats.games });
  }

  pause() {
    if (this.state !== 'playing' && this.state !== 'countdown') return;
    this.state = 'paused';
    this._dropPointers();
    this.ui.showPause(true);
  }

  /* После паузы — короткий отсчёт, чтобы не врезаться в первую же секунду */
  resume() {
    if (this.state !== 'paused') return;
    this.audio.play('click');
    this.ui.showPause(false);
    this.state = 'countdown';
    this.countdown = CONFIG.ui.resumeCountdown;
    this.countdownT = 0;
    this.ui.showCountdown(this.countdown);
    this.audio.play('tick');
    this.last = performance.now();
    this.acc = 0;
  }

  toggleSetting(key) {
    const s = this.storage.settings;
    s[key] = !s[key];
    this.storage.save();
    this.audio.unlock();
    this.audio.syncMusic();
    this.audio.play('click');
    this.ui.syncSettings();
  }

  setName(name) {
    const clean = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 16);
    this.storage.profile.name = clean || TEXTS.defaultName;
    this.storage.profile.nameAsked = true;
    this.storage.save();
    this.ui.syncProfile();
  }

  async share() {
    const result = this.result || { score: this.storage.stats.best, meters: this.storage.stats.bestDistance };
    this.audio.play('click');
    K.analytics.track('share_clicked', { score: result.score, meters: result.meters });
    const outcome = await K.share.send(result);
    if (outcome === 'copied') this.ui.setShareLabel(TEXTS.shareCopied);
    else if (outcome === 'failed') this.ui.setShareLabel(TEXTS.shareFailed);
    return outcome;
  }

  /* ---------- События героя ---------- */
  onJump() {
    this.audio.play('jump');
    K.platform.haptic('jump');
    this.dust(this.player.x - 6, 4);
    this.ui.clearHint('jump');
  }

  onLand() {
    this.audio.play('land');
    this.dust(this.player.x, 5);
  }

  onCrouch() {
    this.audio.play('duck');
    K.platform.haptic('duck');
    this.dust(this.player.x + 6, 3);
    this.ui.clearHint('duck');
  }

  onStep() {
    if (this.state === 'playing') this.dust(this.player.x - 12, 1, 0.5);
  }

  dust(x, n, alpha = 0.7) {
    const y = this.view.groundY - this.player.floorNow - 2;
    for (let i = 0; i < n; i++) {
      this.particles.emit({
        x: x + (Math.random() - 0.5) * 14, y,
        vx: -30 - Math.random() * 60, vy: -18 - Math.random() * 34,
        size: 2.4 + Math.random() * 2.8, grow: 1.1, life: 0.3 + Math.random() * 0.18,
        color: C.concrete, alpha, drag: 3, rot: Math.random() * 6,
      });
    }
  }

  /* ---------- Появление объектов ---------- */
  spawnObstacle(item, x) {
    const o = this.obstaclePool.get().init(item.def, x, item.opts);
    this.obstacles.push(o);
    const hints = this.storage.data.hints;
    if (item.def.type === 'duck' && hints.duck < 3) {
      hints.duck++;
      this.ui.hint('duck', TEXTS.hintDuck[this.ui.fineInput ? 1 : 0], 'good');
    }
    return o;
  }

  spawnCard(item, x) {
    const a = this.cardPool.get().init(item.data, item.quality, item.event, x);
    this.apartments.push(a);
    const hints = this.storage.data.hints;
    if (!a.isGood && hints.read < 2) { hints.read++; this.ui.hint('card', TEXTS.hintRead); }
    else if (a.isGood && hints.card < 2) { hints.card++; this.ui.hint('card', TEXTS.hintCard, 'good'); }
    return a;
  }

  /* ---------- Обновление ---------- */
  update(dt) {
    if (this.state === 'paused') return;
    if (this.state === 'countdown') { this._tickCountdown(dt); return; }
    if (this.hitStop > 0) { this.hitStop -= dt; return; }     // короткая заморозка в момент удара
    let dx = 0;

    if (this.state === 'menu') {
      this.scrollSpeed = CONFIG.speed.start * this.view.speedFactor * 0.6;
      dx = this.scrollSpeed * dt;
      this.player.update(dt, this.scrollSpeed, 0);
    } else if (this.state === 'playing') {
      this.nominalSpeed = speedAt(this.score.meters);
      this.level = levelAt(this.score.meters);
      this.scrollSpeed = this.nominalSpeed * this.view.speedFactor;
      dx = this.scrollSpeed * dt;
      this.track += dx;
      this.score.meters += this.nominalSpeed * dt / CONFIG.unitsPerMeter;
      this.generator.update();
      // сначала двигается герой — тап срабатывает в этом же шаге, — потом проверяются столкновения
      this.player.update(dt, this.scrollSpeed, this.player.floorNow);
      const floor = this._updateObstacles(dt, dx);
      if (this.state === 'playing') {
        this.player.floorNow = floor;
        this._updateApartments(dt, dx);
        this._updateProgress();
      }
    } else if (this.state === 'dying') {
      // мир замер, двигается только герой (и те, кто бежал сам)
      this.scrollSpeed = 0;
      this.player.update(dt, 0, 0);
      for (const o of this.obstacles) o.update(dt, 0);
      for (const a of this.apartments) a.update(dt, 0);
      this.stateTime += dt;
      if (this.stateTime >= CONFIG.ui.gameOverDelay) this._finish();
    } else {
      this.scrollSpeed = 0;
      this.player.update(dt, 0, 0);
    }

    this.world.update(dx, dt);
    this.particles.update(dt, dx);
    this._updateExtras(dt, dx);
    this._updateStreaks(dt, dx);
    if (this.impact) { this.impact.t += dt; if (this.impact.t > 0.2) this.impact = null; }
    this.shake = Math.max(0, this.shake - dt * 42);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.kick *= Math.exp(-7 * dt);
    this.camY = lerp(this.camY, this.player.dead ? 0 : this.player.h * 0.07, 1 - Math.exp(-10 * dt));
  }

  _tickCountdown(dt) {
    this.countdownT += dt;
    if (this.countdownT < CONFIG.ui.countdownStep) return;
    this.countdownT = 0;
    this.countdown--;
    if (this.countdown > 0) {
      this.ui.showCountdown(this.countdown);
      this.audio.play('tick');
    } else {
      this.ui.showCountdown(0);
      this.audio.play('go');
      this.state = 'playing';
    }
  }

  /* Двигает препятствия, проверяет столкновения, возвращает высоту опоры под героем */
  _updateObstacles(dt, dx) {
    const p = this.player;
    let floor = 0;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i], def = o.def;
      o.update(dt, dx);
      if (o.x + o.w < -120) { this.obstacles.splice(i, 1); this.obstaclePool.put(o); continue; }   // ушло за экран

      if (def.type === 'platform') {
        const res = CollisionSystem.platform(p, o);
        if (res === 'crash') { this._crash(o); return 0; }
        if (res > floor) floor = res;
      } else if (CollisionSystem.hits(p, o)) {
        if (def.type === 'soft') {
          if (!o.used && p.h < 2) { o.used = true; this._splash(o); }
        } else if (def.type === 'pickup') {
          if (!o.used) { this._pickup(o); this.obstacles.splice(i, 1); this.obstaclePool.put(o); continue; }
        } else { this._crash(o); return 0; }
      }

      if (!o.passed && o.x + o.w < p.hitLeft) { o.passed = true; this._onPassed(o); }
    }
    return floor;
  }

  /* Игрок благополучно миновал объект */
  _onPassed(o) {
    const def = o.def;
    if (def.type === 'duck') { this.ui.clearHint('duck'); this.storage.data.hints.ducked++; }
    if (def.score && !this.storage.data.seen[def.id]) {       // редкость, увиденная впервые
      this.storage.data.seen[def.id] = 1;
      this.discoveries.push(def.name);
      this.score.add(def.score);
      this.ui.toast({ title: `${TEXTS.discovery}: ${def.name.toLowerCase()}`, sub: `+${def.score}`, tone: 'event', ms: 2200, priority: 2 });
      this.audio.play('pickup');
    }
  }

  _splash(o) {
    const gy = this.view.groundY;
    this.audio.play('splash');
    for (let i = 0; i < 14; i++) {
      this.particles.emit({
        x: this.player.x + (Math.random() - 0.5) * 24, y: gy - 2,
        vx: (Math.random() - 0.3) * 220, vy: -120 - Math.random() * 220, g: 900,
        size: 2.5 + Math.random() * 3, life: 0.5, color: C.blue, rot: Math.random() * 6,
      });
    }
    if (this.ui.toastIdle) this.ui.toast({ title: TEXTS.puddle[0], sub: TEXTS.puddle[1], tone: 'info', ms: 1600, priority: 0 });
  }

  _pickup(o) {
    const gy = this.view.groundY, cx = o.x + o.w / 2, cy = gy - 22;
    o.used = true;
    this.score.add(CONFIG.score.keys);
    this.audio.play('pickup');
    K.platform.haptic('collect');
    this._burst(cx, cy, 10, [C.lime, C.white]);
    this.particles.emit({ shape: 'text', text: `+${CONFIG.score.keys}`, x: cx, y: cy - 16, vy: -70, drag: 2.2, life: 0.9, size: 18, color: C.lime });
    this.ui.toast({ title: TEXTS.keysFound, tone: 'good', ms: 1300, priority: 1, key: true });
    this.ui.bump(false);
  }

  _updateApartments(dt, dx) {
    const p = this.player, gy = this.view.groundY;
    for (let i = this.apartments.length - 1; i >= 0; i--) {
      const a = this.apartments[i];
      a.update(dt, dx);
      const gap = a.x - p.hitRight;
      let remove = false;

      // «Цена выросла»: дорожает на подходе, очков становится вдвое меньше
      if (a.event === 'priceUp' && !a.bumped && gap < 300) {
        a.bumped = true;
        a.price += 5000;
        a.pointsMul = 0.5;
        a.shake = 0.4;
        a.refreshTexts();
        this.ui.toast({ title: TEXTS.priceUp[0], sub: TEXTS.priceUp[1], tone: 'event', ms: 1900, priority: 2 });
        this.audio.play('vanish');
      }

      // «Уже сдали»: исчезает прямо перед игроком
      if (a.event === 'vanish' && gap < (p.onGround ? 40 : 120)) {
        const t = this.rng.pick(TEXTS.vanish);
        this.ui.toast({ title: t[0], sub: t[1], tone: 'event', ms: 2000, priority: 2 });
        this.audio.play('vanish');
        this._poof(a.x + a.w / 2, gy - a.bottom - a.h / 2);
        this.ui.clearHint('card');
        remove = true;
      } else if (CollisionSystem.apartment(p, a)) {
        this._collect(a);
        remove = true;
      } else if (!a.missed && a.x + a.w < p.hitLeft) {
        a.missed = true;
        this._rejected(a);
      }
      if (remove || a.x + a.w < -120) { this.apartments.splice(i, 1); this.cardPool.put(a); }
    }
  }

  _collect(a) {
    const gy = this.view.groundY, cx = a.x + a.w / 2, cy = gy - a.bottom - a.h / 2, s = this.score;
    this.ui.clearHint('card');

    if (!a.isGood) {
      const points = CONFIG.score[a.quality];
      const lost = s.multiplier > 1;
      s.add(points);
      s.streak = 0;
      this.ui.toast({ title: TEXTS.taken[a.quality], sub: lost ? `${a.reason()} · ${TEXTS.comboLost.toLowerCase()}` : a.reason(), tone: 'bad', ms: 1900, priority: 2 });
      this.ui.bump(true);
      this.audio.play('bad');
      K.platform.haptic('bad');
      this.flash = 0.4;
      this.flashColor = '255,77,61';
      this.shake = a.quality === 'awful' ? 9 : 6;
      this._burst(cx, cy, 14, [C.danger, C.ink]);
      this.particles.emit({ shape: 'text', text: `−${Math.abs(points)}`, x: cx, y: cy, vy: -70, drag: 2.2, life: 1, size: 24, color: C.danger, outline: C.white });
      K.analytics.track('apartment_collected', { id: a.data.id, quality: a.quality, points, combo: 0 });
      return;
    }

    const before = s.multiplier;
    s.streak++;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.apartments++;
    const mult = s.multiplier;
    const points = Math.round(CONFIG.score[a.quality] * a.pointsMul * mult / 10) * 10;
    s.add(points);
    const great = a.quality === 'great';

    if (mult > before) {                                 // серия выросла
      this.ui.toast({ title: `${TEXTS.combo} ×${mult}`, sub: a.reason(), tone: 'good', ms: 1700, priority: 2 });
      this.audio.play('combo', mult);
      K.analytics.track('combo_started', { multiplier: mult, streak: s.streak });
      this.flash = 0.3;
      this.flashColor = '211,244,78';
    } else {
      this.ui.toast({ title: TEXTS.collected[a.quality], sub: a.reason(), tone: 'good', ms: 1400, priority: 1, key: true });
      this.audio.play(great ? 'great' : 'good');
    }
    K.platform.haptic('collect');
    this.kick = great ? 12 : 7;
    this._burst(cx, cy, great ? 30 : 16, [C.lime, C.ink, C.white]);
    this.particles.emit({ shape: 'ring', x: cx, y: cy, size: 20, grow: great ? 120 : 80, width: 6, life: 0.45, color: C.lime });
    this.particles.emit({ shape: 'text', text: `+${points}`, x: cx, y: cy, vy: -80, drag: 2.2, life: 1, size: great || mult > 1 ? 30 : 24, color: C.lime });
    const sc = this.view.scale;
    this.particles.emit({                                 // ключ улетает в счёт
      shape: 'fly', x: cx, y: cy, tx: 60 / sc, ty: 62 / sc, life: 0.55, size: 12, color: C.lime, world: false, fade: false,
      done: () => this.ui.bump(false),
    });
    K.analytics.track('apartment_collected', { id: a.data.id, quality: a.quality, points, combo: mult });
  }

  /* Игрок пробежал мимо карточки: подсказываем, какой она была */
  _rejected(a) {
    const gy = this.view.groundY;
    this.ui.clearHint('card');
    const good = a.isGood;
    this.particles.emit({
      shape: 'text', text: this.rng.pick(good ? TEXTS.skippedGood : TEXTS.skippedBad),
      x: a.x + a.w / 2, y: gy - a.bottom - a.h / 2, vy: -34, drag: 1.5, life: 1.1, size: 13,
      color: good ? '#D9D9D9' : C.lime,
    });
    K.analytics.track('apartment_rejected', { id: a.data.id, quality: a.quality });
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

  /* Район, рекорд на ходу, шутки и пасхалки */
  _updateProgress() {
    const m = this.score.meters;

    // район: фасады нового начинают въезжать чуть раньше, чем сменится название
    if (!this.preSwitched && this.nextLocation && m >= this.locationTo - 35) {
      this.preSwitched = true;
      this.world.setLocation(this.nextLocation);
    }
    if (m >= this.locationTo) {
      this.planIndex++;
      this.preSwitched = false;
      this._extendPlan();
      const loc = this.location;
      this.world.setLocation(loc);
      this.generator.breather(CONFIG.generator.locationBreather);
      this.ui.toast({ title: loc.name, sub: loc.note, tone: 'district', ms: 2600, priority: 3 });
      this.audio.play('location');
      this.kick = 12;
    }

    const total = this.score.total;
    if (!this.recordBroken && this.prevBest > 0 && total > this.prevBest) {
      this.recordBroken = true;
      this.ui.toast({ title: `${TEXTS.record}! 🔥`, tone: 'good', ms: 2200, priority: 3 });
      this.audio.play('record');
      K.platform.haptic('collect');
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

    // пасхалка: агент бежит следом и предлагает «похожий вариант»
    if (m >= this.nextAgentAt) {
      this.nextAgentAt = m + this.rng.range(1400, 2400);
      this.extras.push({ kind: 'agent', x: -50, t: 0, life: 4.6, said: false });
    }
    // пасхалка: голубь на тротуаре, который улетает из-под ног
    if (this.rng.chance(0.0009)) this.extras.push({ kind: 'pigeon', x: this.view.w + 30, y: 0, t: 0, life: 30, fly: 0 });
    // бабушка на лавочке комментирует
    for (const it of this.world.props.items) {
      if (it.kind === 'granny' && !it.said && it.x + it.w / 2 < this.player.x + 60) {
        it.said = true;
        if (this.ui.toastIdle && this.rng.chance(0.75)) this.ui.toast({ title: this.rng.pick(TEXTS.granny), tone: 'info', ms: 1800, priority: 0 });
      }
    }
  }

  _updateExtras(dt, dx) {
    const p = this.player;
    for (let i = this.extras.length - 1; i >= 0; i--) {
      const e = this.extras[i];
      e.t += dt;
      if (e.kind === 'agent') {
        // подбегает сзади, держится пару секунд и отстаёт
        const target = e.t < e.life - 1.4 ? p.x - 92 : -90;
        e.x = lerp(e.x, target, 1 - Math.exp(-2.2 * dt));
        if (!e.said && e.t > 0.9 && this.state === 'playing') {
          e.said = true;
          if (this.ui.toastIdle) this.ui.toast({ title: this.rng.pick(TEXTS.agent), tone: 'info', ms: 2200, priority: 0 });
        }
      } else if (e.kind === 'pigeon') {
        e.x -= dx;
        if (!e.fly && e.x - p.x < 150) e.fly = 0.001;
        if (e.fly) { e.fly += dt; e.x -= 60 * dt; e.y += (120 + e.fly * 500) * dt; }
      }
      if (e.t > e.life || e.x < -140 || e.y > 700) this.extras.splice(i, 1);
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
    this.causeId = o.def.id;
    this._dropPointers();
    p.die();
    this.shake = 16;
    this.flash = 0.6;
    this.flashColor = '255,255,255';
    this.audio.play('crash');
    K.platform.haptic('crash');
    this.ui.clearHint();
    K.analytics.track('obstacle_hit', { id: o.def.id, size: o.def.size, meters: Math.floor(this.score.meters), level: this.level });

    const ix = p.hitRight, iy = gy - p.h - 24;
    this.impact = { x: ix + 4, y: iy - 6, t: 0 };
    this._burst(ix, iy, 14, [C.ink, C.danger, C.white]);
    this.particles.emit({ shape: 'ring', x: ix, y: iy, size: 14, grow: 70, width: 5, life: 0.35, color: C.ink });
  }

  _finish() {
    const s = this.score;
    const result = {
      score: s.total,
      meters: Math.floor(s.meters),
      apartments: s.apartments,
      bestCombo: s.bestStreak,
      cause: this.cause,
      causeId: this.causeId,
      headline: this.rng.pick(TEXTS.headlines),
      discoveries: this.discoveries.slice(),
      location: this.location.short,
      challenge: this.challenge,
    };
    result.isRecord = this.storage.recordRun(result, K.daily.dayKey());
    result.best = this.storage.stats.best;
    this.result = result;
    this.state = 'over';
    this.overAt = performance.now();
    this.ui.clearToasts();
    this.ui.setRecord(result.best, false);
    this.ui.showGameOver(result);
    if (result.isRecord) { this.audio.play('record'); K.platform.haptic('collect'); }
    K.analytics.track('game_finished', { score: result.score, meters: result.meters, apartments: result.apartments, bestCombo: result.bestCombo, cause: result.causeId, location: this.location.id });
    if (result.isRecord) K.analytics.track('new_record', { score: result.score, previous: this.prevBest });
    K.leaderboard.submit(K.leaderboard.entryFor(result));
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
    const ctx = this.ctx, v = this.view, k = v.scale * v.dpr, gy = v.groundY, p = this.player;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    this.world.drawSky(ctx);

    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(sx - this.kick, sy + this.camY);
    this.world.drawCity(ctx);
    this.world.drawGround(ctx);

    // скоростные штрихи
    if (this.streaks.length) {
      ctx.fillStyle = `rgba(28,28,28,${0.05 + this.difficulty * 0.07})`;
      ctx.beginPath();
      for (const s of this.streaks) ctx.rect(s.x, s.y, s.len, 1.6);
      ctx.fill();
    }

    for (const e of this.extras) this._drawExtra(ctx, e, gy);
    for (const a of this.apartments) a.draw(ctx, gy);
    const cue = this.storage.data.hints.ducked < 6 && this.state === 'playing';   // первые разы показываем стрелку «вниз»
    for (const o of this.obstacles) {
      o.draw(ctx, gy);
      if (cue && o.def.type === 'duck' && !o.passed) Art.duckCue(ctx, o.x + o.w / 2, gy, o.t);
    }

    // тень героя: на земле или на крыше, куда он запрыгнул
    const floor = p.dead ? 0 : (p.floorNow || 0);
    const sh = clamp(1 - (p.h - floor) / 190, 0.35, 1);
    const sw = (p.dead ? 30 : 15 + p.duck * 7) * sh, shx = p.x + p.knock - (p.dead ? 4 : 2);
    K.ink.shadow(ctx, shx - sw, shx + sw, gy - floor + 0.5, 4.5 * sh);
    p.draw(ctx, gy);
    if (p.dead && p.onGround) Art.dizzy(ctx, p.x + p.knock - 28, gy - 30, this.stateTime);
    if (this.impact) Art.impact(ctx, this.impact.x, this.impact.y, this.impact.t / 0.2);
    this.particles.draw(ctx);
    this.world.drawFore(ctx);

    if (K.DEBUG) this._drawDebug(ctx);
    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(${this.flashColor},${Math.min(0.75, this.flash)})`;
      ctx.fillRect(0, 0, v.w, v.h);
    }

    // бумажное зерно поверх всего: картинка перестаёт быть стерильной
    if (!this.grain) this.grain = ctx.createPattern(K.ink.grain(192, 0.03), 'repeat');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.grain;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ui.sync(this.score, Math.floor(this.score.meters));
  }

  _drawExtra(ctx, e, gy) {
    if (e.kind === 'agent') {
      // тот же риелтор, только развёрнут и бежит вприпрыжку
      ctx.save();
      ctx.translate(e.x + 16, gy - Math.abs(Math.sin(e.t * 13)) * 5);
      ctx.scale(-1, 1);
      ctx.translate(-16, 0);
      Art.obstacles.realtor(ctx, { t: e.t });
      ctx.restore();
    } else if (e.kind === 'pigeon') {
      const y = gy - 6 - e.y, up = e.fly ? Math.floor(e.t * 12) % 2 === 0 : false;
      const S = Art.S;
      S(ctx, [e.x - 6, y - 2, e.x + 4, y - 5, e.x + 12, y - 1, e.x + 8, y + 5, e.x - 4, y + 5], C.cool, { lw: 1.8, off: 0 });
      S(ctx, [e.x - 11, y - 3, e.x - 9, y - 8, e.x - 4, y - 7, e.x - 3, y - 2, e.x - 7, y], '#6F7A85', { lw: 1.6, off: 0 });
      if (e.fly) S(ctx, up ? [e.x - 2, y - 3, e.x + 7, y - 3, e.x + 4, y - 15] : [e.x - 2, y, e.x + 7, y, e.x + 5, y + 10], '#B6BEC4', { lw: 1.6, off: 0 });
      ctx.fillStyle = C.ink;
      ctx.fillRect(e.x - 9, y - 6, 1.4, 1.4);
    }
  }

  /* ?debug в адресе — показывает зоны столкновений */
  _drawDebug(ctx) {
    const gy = this.view.groundY, p = this.player;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00A2FF';
    ctx.strokeRect(p.hitLeft, gy - p.h - p.hitH, p.hitW, p.hitH);
    ctx.strokeStyle = '#FF00AA';
    for (const o of this.obstacles) {
      if (o.def.type === 'platform') for (const s of o.def.profile) ctx.strokeRect(o.x + s[0], gy - s[2], s[1] - s[0], s[2]);
      else { const h = o.def.hit; ctx.strokeRect(o.x + h[0], gy - Math.min(h[2], 400), o.w - h[0] * 2, Math.min(h[2], 400) - h[1]); }
    }
    ctx.strokeStyle = '#00B84A';
    for (const a of this.apartments) ctx.strokeRect(a.x, gy - a.top, a.w, a.h);
  }
}

/* ───────────────────────────── ЗАПУСК ───────────────────────────── */
/* Список квартир: сейчас из apartments.js, позже — объявления из канала */
K.listings = function () { return Array.isArray(window.APARTMENTS) ? window.APARTMENTS : []; };

function boot() {
  K.storage.load();
  K.platform.init();
  const sdk = document.getElementById('tg-sdk');
  if (sdk) sdk.addEventListener('load', () => { K.platform.attach(); if (K.game) K.game.onPlatformReady(); });

  const game = new Game();
  K.game = game;
  game.onPlatformReady();

  // шрифты для надписей на холсте; когда загрузятся — перерисовать вывески
  if (document.fonts && document.fonts.load) {
    const fonts = ['900 16px "Sofia Sans Extra Condensed"', 'italic 900 16px "Sofia Sans Extra Condensed"', '700 12px "Sofia Sans Condensed"', '800 12px "Sofia Sans Condensed"', '800 12px "Sofia Sans"', '900 12px "Sofia Sans"'];
    Promise.all(fonts.map(f => document.fonts.load(f, 'Район ₽ Rent').catch(() => {})))
      .then(() => game.world.invalidateSprites());
  }
}

/* Имя из Telegram, кнопка «Назад», вызов по ссылке */
Game.prototype.onPlatformReady = function () {
  const profile = this.storage.profile, user = K.platform.user();
  if (!profile.name && user && user.first_name) {
    profile.name = String(user.first_name).slice(0, 16);
    profile.nameAsked = true;
    this.storage.save();
  }
  this.challenge = K.platform.challenge();
  K.platform.setBack(null);
  this.ui.syncProfile();
  if (this.state === 'menu') this.ui.showMenu();
};

K.Game = Game;
K.LevelGenerator = LevelGenerator;
K.CollisionSystem = CollisionSystem;
K.obstacleInfo = obstacleInfo;
K.STEP = STEP;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})(window.KTM = window.KTM || {});
