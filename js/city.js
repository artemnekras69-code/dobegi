/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — город: мир вокруг дорожки

   Собирает и двигает слои, рисует небо, землю и нижнюю полосу с названием района.
   Как выглядят дома и улица — в city-art.js и city-props.js.

   Что за чем стоит (от дальнего к ближнему):
     небо          плоский цвет, растр у горизонта, ступенчатые облака
     дальний план  силуэты одним цветом                       параллакс 0.06
     средний       дома целиком                               0.22
     фасады        первые этажи, магазины, объявления          0.5
     улица         деревья, фонари, столбы с проводами        0.72
     дорожка       герой, препятствия, карточки — рисует game.js
     дорога        ближе всех: машины в нижней полосе, разметка, люки
   ===================================================================== */
(function (K) {
'use strict';

const { TAU, clamp, lerp, fmt, makeRng, hash3, mix, shade, poly } = K.util;
const CONFIG = K.CONFIG, FONT = K.FONT, C = CONFIG.colors, ink = K.ink;
const { FarArt, BackArt, STYLES, SPECIAL, PropArt, drawFacade, drawTraffic, fr, fp } = K.CityArt;
const T = ink.text;
const LIT = '#F3DF9A';

/* Пересчёт весов района: «громкое» встречается реже, обычное занимает освободившееся место.
   k(id) — какую долю от прежней оставить (1 — не трогать). */
function rebalance(list, k) {
  const keep = list.map(([id]) => k(id));
  let total = 0, plain = 0, loud = 0;
  list.forEach(([, w], i) => { total += w; if (keep[i] === 1) plain += w; else loud += w * keep[i]; });
  if (!plain || plain === total) return list;
  const grow = (total - loud) / plain;
  return list.map(([id, w], i) => [id, keep[i] === 1 ? w * grow : w * keep[i]]);
}

const PARALLAX = { far: 0.06, back: 0.22, front: 0.5, props: 0.72 };

class World {
  constructor(game) {
    this.game = game;
    this.strips = {};           // растровая полоса неба: по одной на район и размер экрана
    this.reset(K.LOCATIONS[0]);
  }

  reset(loc) {
    this.rng = makeRng(20261009);
    this.loc = loc;
    this.prevLoc = loc;
    this.skyT = 1;
    this.groundOffset = 0;
    this.time = 0;
    this.skyTurn = {};
    this.farSets = [this._newSet(loc, 1, true)];
    this.backSets = [this._newSet(loc, 1)];
    this.front = { items: [], cursor: -40 };
    this.props = { items: [], cursor: 60 };
    this.decals = { items: [], cursor: 300 };
    this.mix = this._tune(loc);
    this.frontQueue = [];
    this.markTurn = {};
    this.brandBag = [];
    this.lastStyle = '';
    this.lastProp = '';
    this.clouds = [];
    for (let i = 0; i < 6; i++) this.clouds.push({ x: this.rng.range(0, 1500), y: this.rng.range(0.08, 0.5), w: this.rng.range(70, 140), seed: this.rng.int(0, 999) });
    this.traffic = [];
    this.plane = null;
    this.fill();
  }

  _newSet(loc, alpha, far) {
    const set = { loc, mix: this._tune(loc), items: [], cursor: -80, alpha, target: 1, n: 0, mark: '' };
    // знаковый силуэт виден не в каждый заход в район, и каждый раз — следующий по списку
    const sky = loc.skyline || [];
    if (far && sky.length && this.rng.chance(CONFIG.city.skylineChance)) {
      const turn = this.skyTurn[loc.id] || 0;
      this.skyTurn[loc.id] = turn + 1;
      set.mark = sky[turn % sky.length];
    }
    return set;
  }

  /* Веса района с поправкой на CONFIG.city: магазины, знаковые места и реклама — реже, обычная застройка — чаще */
  _tune(loc) {
    const c = CONFIG.city;
    return {
      front: rebalance(loc.front.styles, id => STYLES[id] ? (STYLES[id].ground === 'shop' ? c.shopHouses : 1) : (SPECIAL[id].place ? c.places : 1)),
      back: rebalance(loc.back.kinds, id => BackArt[id].place ? c.placesBack : 1),
      props: rebalance(loc.props, id => PropArt[id].loud ? c.street : 1),
    };
  }

  /* Смена района: даль и дома растворяются в новые, фасады и улица въезжают справа */
  setLocation(loc) {
    if (loc === this.loc) return;
    this.prevLoc = this.loc;
    this.loc = loc;
    this.skyT = 0;
    for (const sets of [this.farSets, this.backSets]) {
      for (const s of sets) s.target = 0;
      sets.unshift(this._newSet(loc, 0, sets === this.farSets));
      if (sets.length > 3) sets.length = 3;
    }
    this.mix = this._tune(loc);
    // главное место района встречается не в каждый заход, каждый раз следующее по списку,
    // и стоит не у самой границы, а через пару обычных домов
    const marks = loc.landmarks || [];
    this.frontQueue = [];
    if (marks.length && this.rng.chance(CONFIG.city.landmarkChance)) {
      const turn = this.markTurn[loc.id] || 0;
      this.markTurn[loc.id] = turn + 1;
      this.frontQueue.push({ id: marks[turn % marks.length], wait: this.rng.int(2, 3) });
    }
    this.brandBag = [];
    this.fill();
  }

  /* После загрузки шрифтов надписи надо перерисовать */
  invalidateSprites() {
    for (const s of this.backSets) for (const b of s.items) b.sprite = null;
    for (const f of this.front.items) f.sprite = null;
    for (const p of this.props.items) p.sprite = null;
  }

  fill() {
    const edge = this.game.view.w + 300;
    for (const s of this.farSets) if (s.target === 1) while (s.cursor < edge) { const it = this._makeFar(s, s.cursor); s.items.push(it); s.cursor += it.advance; }
    for (const s of this.backSets) if (s.target === 1) while (s.cursor < edge) { const it = this._makeBack(s, s.cursor); s.items.push(it); s.cursor += it.advance; }
    while (this.front.cursor < edge) { const it = this._makeFront(this.front.cursor); this.front.items.push(it); this.front.cursor += it.advance; }
    while (this.props.cursor < edge) { const it = this._makeProp(this.props.cursor); this.props.items.push(it); this.props.cursor += it.advance; }
    while (this.decals.cursor < edge) { const it = this._makeDecal(this.decals.cursor); this.decals.items.push(it); this.decals.cursor += it.advance; }
  }

  update(dx, dt) {
    this.time += dt;
    const scroll = (items, d, margin) => {
      for (const it of items) it.x -= d;
      while (items.length && items[0].x + items[0].w < -margin) items.shift();     // ушло за экран — удаляем
    };
    for (const sets of [this.farSets, this.backSets]) {
      const par = sets === this.farSets ? PARALLAX.far : PARALLAX.back;
      for (let i = sets.length - 1; i >= 0; i--) {
        const s = sets[i];
        s.cursor -= dx * par;
        scroll(s.items, dx * par, 160);
        s.alpha = clamp(s.alpha + (s.target ? dt / 1.5 : -dt / 1.5), 0, 1);
        if (!s.target && s.alpha <= 0) sets.splice(i, 1);
      }
    }
    for (const [layer, par, margin] of [[this.front, PARALLAX.front, 80], [this.props, PARALLAX.props, 180], [this.decals, 1, 60]]) {
      layer.cursor -= dx * par;
      scroll(layer.items, dx * par, margin);
    }
    this.fill();

    for (const c of this.clouds) {
      c.x -= dx * 0.02 + 5 * dt;
      if (c.x + c.w < -20) c.x += Math.max(1500, this.game.view.w + 300);
    }
    this.groundOffset += dx;
    if (this.skyT < 1) this.skyT = Math.min(1, this.skyT + dt / 1.6);
    this._updateTraffic(dt);
    this._updatePlane(dt);
  }

  /* Вдали — рядовая застройка; знаковый силуэт, если он выпал, стоит вторым — в кадре, но один */
  _makeFar(set, x) {
    const kind = set.mark && set.n === 1 ? set.mark : this.rng.weighted(set.loc.far);
    set.n++;
    const art = FarArt[kind];
    const s = this.game.view.farScale * this.rng.range(0.88, 1.05) * (art.scale || 1);
    const w = art.w * s;
    return { x, kind, w, s, seed: this.rng.int(0, 99999), advance: w + this.rng.range(90, 260) };
  }

  _makeBack(set, x) {
    const L = set.loc.back, r = this.rng;
    const kind = r.weighted(set.mix.back), dims = BackArt[kind].dims(r);
    const maxH = this.game.view.maxBuildingH;
    const body = r.pick(L.colors);
    const h = Math.max(dims.minH || 0, dims.h * maxH);
    return {
      x, kind, w: Math.round(dims.w), h: Math.round(h),
      extra: dims.extra + (dims.spire ? h * dims.spire : 0) + 4,
      seed: r.int(0, 99999),
      body, dark: shade(body, -0.1), accent: mix(body, set.loc.accent || C.brick, 0.4), win: L.win, lit: L.lit || LIT, litPct: 9,
      gold: mix(C.yellow, body, 0.25),
      advance: dims.w + r.range(-8, 34),
      sprite: null, ps: 0, draw: BackArt[kind].draw,
    };
  }

  _nextBrand(loc) {
    if (!this.brandBag.length) this.brandBag = this.rng.shuffle(loc.brands);
    return this.brandBag.pop();
  }

  _makeFront(x) {
    const loc = this.loc, r = this.rng, F = loc.front, c = CONFIG.city;
    let id = '';
    const next = this.frontQueue[0];
    if (next && --next.wait <= 0) id = this.frontQueue.shift().id;
    if (!id) {
      id = r.weighted(this.mix.front);
      // магазины и заметные места не стоят подряд: между ними обычные дома
      const loud = k => !!((STYLES[k] && STYLES[k].ground === 'shop') || (SPECIAL[k] && SPECIAL[k].place));
      if (loud(id) && loud(this.lastStyle)) {
        const plain = this.mix.front.filter(([k]) => !loud(k));
        if (plain.length) id = r.weighted(plain);
      }
    }
    this.lastStyle = id;
    const wall = r.pick(F.walls);
    const col = {
      wall, trim: F.trim, glass: F.glass, roof: F.roof, lit: LIT,
      base: shade(wall, -0.05), dark: shade(wall, -0.14), deep: mix(shade(wall, -0.5), C.ink2, 0.3), accent: mix(wall, loc.accent || C.brick, 0.5),
      line: shade(wall, -0.26), shadow: 'rgba(23,19,15,.08)', curtain: mix(wall, C.white, 0.62), sash: mix(F.glass, C.white, 0.45), frame: F.trim,
      leaf: loc.foliage[0], leaf2: loc.foliage[1], far: loc.farColor,
    };
    const item = { x, seed: r.int(0, 99999), col, sprite: null, ps: 0, brands: [] };
    const sp = SPECIAL[id];
    if (sp) {
      item.w = Math.round(r.range(sp.w[0], sp.w[1]));
      item.h = sp.h;
      item.draw = sp.draw;
      if (id === 'stroyka' && r.chance(c.adChance)) item.ad = this._pickAd(loc, ['developer']);
      if (id === 'fence' && r.chance(c.adChance)) item.ad = this._pickAd(loc);
      item.advance = item.w + r.range(6, 30);
    } else {
      const st = STYLES[id];
      item.style = st;
      item.w = Math.round(r.range(st.w[0], st.w[1]));
      const maxFloors = Math.max(1, Math.ceil((this.game.view.groundY + 70 - st.groundH) / st.floorH));
      item.floors = Math.min(r.int(st.floors[0], st.floors[1]), maxFloors);
      item.h = st.groundH + item.floors * st.floorH + 50;
      item.draw = drawFacade;
      if (st.ground === 'shop') this._shopUnits(loc, item);
      else if (st.ground === 'lobby' && r.chance(c.adChance)) item.brands = [this._pickBrand(loc, K.brandsOf('bank', 'cafe', 'telecom'))];
      if (r.chance(0.3)) item.plate = loc.street;
      // объявления живут на стенах: лист с хвостиками у подъезда или растяжка на фасаде
      const bays = Math.max(2, Math.round((item.w - 28) / st.bayW)), bw = (item.w - 28) / bays;
      if ((st.ground === 'plain' || st.ground === 'rust') && bays > 3 && r.chance(c.notices)) {
        const free = [];
        for (let b = 0; b < bays; b++) if (b % 3 !== 1 && b !== Math.floor(bays / 2)) free.push(b);
        const bay = r.pick(free);
        const h = Math.min(62, st.groundH - 12), w = Math.min(48, bw * 0.96);
        item.notice = { bay, x: 14 + (bay + 0.5) * bw - w / 2, w, h, lines: r.pick(K.NOTICES) };
      } else if (st.win !== 'strip' && item.floors > 1 && r.chance(c.banners)) {
        const w = Math.min(item.w - 40, r.range(120, 170)), warm = r.chance(0.5);
        item.banner = { x: r.range(20, item.w - w - 20), w, text: r.pick(K.BANNERS), bg: warm ? C.yellow : C.white, fg: warm ? C.ink2 : C.danger };
      }
      item.advance = item.w + r.range(-2, 22);
    }
    return item;
  }

  _pickBrand(loc, preferred) {
    const local = preferred.filter(b => loc.brands.includes(b));
    return this.rng.pick(local.length ? local : preferred);
  }

  /* Заведения на первом этаже: супермаркету нужно больше места, ПВЗ — меньше.
     Занимают часть этажа у одного из краёв или посередине, остальное — обычный жилой дом */
  _shopUnits(loc, item) {
    const need = { grocery: 168, alcohol: 132, pvz: 92, cafe: 132, fastfood: 146, bank: 132, pharmacy: 110, retail: 150, telecom: 100, realty: 118, developer: 132 };
    const r = this.rng, width = item.w - 10, units = [];
    const count = r.int(CONFIG.city.shopsInHouse[0], CONFIG.city.shopsInHouse[1]);
    let left = width, guard = 0;
    while (left >= 86 && units.length < count && guard++ < 12) {
      const name = this._nextBrand(loc), b = K.BRANDS[name];
      if (!b || !need[b.cat]) continue;                 // такси и доставка — не магазины
      const w = Math.min(left, need[b.cat] * r.range(0.94, 1.1));
      units.push({ name, w: Math.round(w) });
      left -= w + 5;
    }
    if (!units.length) { units.push({ name: loc.brands[0], w: Math.round(Math.min(width, 150)) }); left = width - units[0].w - 5; }
    left = Math.max(0, left + 5);
    if (left < 64) { units[units.length - 1].w += Math.round(left); left = 0; }     // на обычное окно места не осталось
    item.units = units;
    item.shopX = 5 + Math.round(r.pick([0, left, left / 2]));
  }

  /* Реклама для щита: [бренд, строчка]. cats — только такие типы брендов */
  _pickAd(loc, cats) {
    let pool = K.brandsOf.apply(null, cats || ['realty', 'developer', 'bank', 'telecom', 'taxi', 'delivery']).filter(n => K.BRANDS[n].ads.length);
    if (!cats) pool = pool.concat(loc.brands.filter(n => K.BRANDS[n] && K.BRANDS[n].ads.length));
    const name = this.rng.pick(pool);
    return [name, this.rng.pick(K.BRANDS[name].ads)];
  }

  _makeProp(x) {
    const loc = this.loc, r = this.rng;
    let kind = r.weighted(this.mix.props);
    if (kind === this.lastProp && PropArt[kind].w > 100) kind = r.weighted(this.mix.props);
    this.lastProp = kind;
    const art = PropArt[kind];
    const s = r.range(0.94, 1.1), prop = mix(C.warm, loc.sky, 0.45);
    const cars = [C.concrete, C.cool, C.cream, mix(C.brick, C.paper, 0.3), mix(C.blue, C.paper, 0.25), C.white];
    const lux = loc.tags.includes('premium') || loc.tags.includes('business');
    const item = {
      x, kind, s, w: art.w * s, h: (art.h + 8) * s, seed: r.int(0, 99999), sprite: null, ps: 0,
      prop, sky: loc.sky, trunk: mix(C.ink2, loc.sky, 0.5), leaf: loc.foliage[0], leaf2: loc.foliage[1],
      ink: mix(C.ink2, loc.sky, 0.38), car: lux && r.chance(0.6) ? mix(C.ink2, loc.sky, 0.4) : mix(r.pick(cars), loc.sky, 0.42), lux,
      draw(k, it) { k.translate(it.w / 2, 0); k.scale(it.s, it.s); art.draw(k, it); },
    };
    if (kind === 'kiosk') item.brand = this._pickBrand(loc, K.brandsOf('cafe', 'fastfood'));
    if (kind === 'billboard' || (kind === 'busstop' && r.chance(CONFIG.city.adChance))) item.ad = this._pickAd(loc);
    if (kind === 'citylight') { if (r.chance(0.5)) item.ad = this._pickAd(loc); else item.meme = r.pick(K.MEMES); }
    if (kind === 'lamp' && r.chance(CONFIG.city.notes)) item.note = r.pick(['СДАМ', 'СНИМУ', 'КУПЛЮ', 'СДАМ']);
    item.advance = item.w + r.range(110, 300);
    return item;
  }

  /* То, что нарисовано на дороге: «зебра», люки, буква «А» на выделенной полосе, заплатки */
  _makeDecal(x) {
    const r = this.rng;
    const kind = r.weighted([['manhole', 4], ['patch', 3], ['zebra', 1.4], ['busA', 1.2], ['grate', 2]]);
    const w = { manhole: 30, patch: 90, zebra: 132, busA: 70, grate: 26 }[kind];
    return { x, kind, w, seed: r.int(0, 999), advance: w + r.range(240, 620) };
  }

  /* Дорога: машины едут в обе стороны независимо от героя */
  _updateTraffic(dt) {
    const g = this.game, v = g.view, lanes = v.band >= 290 ? 2 : v.band >= 200 ? 1 : 0;
    if (!lanes) { this.traffic.length = 0; return; }
    const scroll = g.scrollSpeed;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      t.x += (t.v - scroll) * dt;
      if (t.x < -320 || t.x > v.w + 320 || t.lane >= lanes) this.traffic.splice(i, 1);
    }
    const want = lanes * 2;
    if (this.traffic.length < want && this.rng.chance(dt * 1.6)) {
      const lane = this.rng.int(0, lanes - 1);
      if (this.traffic.some(t => t.lane === lane && (t.x < -80 || t.x > v.w + 80))) return;
      const vv = lane === 0 ? this.rng.range(140, 460) : -this.rng.range(180, 320);
      const fromLeft = vv - scroll > 0;
      this.traffic.push({
        kind: this.rng.weighted(this.loc.traffic), lane, v: vv,
        x: fromLeft ? -260 : v.w + 260, y: 0,
        color: this.rng.pick(['#3D3833', '#443E38', '#4A443D', '#3A3B3D']),
      });
    }
  }

  /* Самолёт над Соколом */
  _updatePlane(dt) {
    if (this.plane) {
      this.plane.x += 46 * dt;
      if (this.plane.x > this.game.view.w + 200) this.plane = null;
    } else if (this.loc.skyFx === 'plane' && this.rng.chance(dt * 0.12)) {
      this.plane = { x: -120, y: this.rng.range(0.12, 0.3) };
    }
  }

  /* Растр у горизонта: точки тем крупнее, чем ближе к земле. Рисуется один раз на район */
  _strip(loc, ps) {
    const key = `${loc.id}:${ps}`;
    if (this.strips[key]) return this.strips[key];
    const tile = 240, h = 170, gap = 10;
    const c = document.createElement('canvas');
    c.width = Math.ceil(tile * ps);
    c.height = Math.ceil(h * ps);
    const k = c.getContext('2d');
    k.scale(ps, ps);
    const rows = Math.floor(h / (gap * 0.86));
    ink.dots(k, 0, 0, tile, h, gap, 3.3, loc.dots || mix(loc.sky, loc.farColor, 0.55), (row, r) => r * Math.pow(row / rows, 1.5));
    c.tile = tile; c.h = h;
    this.strips[key] = c;
    return c;
  }
  _drawStrip(ctx, strip, y, alpha) {
    const v = this.game.view;
    ctx.globalAlpha = alpha;
    for (let x = 0; x < v.w; x += strip.tile) ctx.drawImage(strip, x, y, strip.tile, strip.h);
    ctx.globalAlpha = 1;
  }

  drawSky(ctx) {
    const v = this.game.view, t = this.skyT, a = this.prevLoc, b = this.loc, gy = v.groundY;
    const ps = Math.min(2, v.scale * v.dpr);
    ctx.fillStyle = t >= 1 ? b.sky : mix(a.sky, b.sky, t);
    ctx.fillRect(0, 0, v.w, v.h);
    if (t < 1) this._drawStrip(ctx, this._strip(a, ps), gy - 170, 1 - t);
    this._drawStrip(ctx, this._strip(b, ps), gy - 170, t);

    // облака ступеньками: три плашки друг на друге
    for (const c of this.clouds) {
      const y = v.groundY * c.y * 0.6 + 34, h = c.w * 0.1, s = c.seed;
      ctx.fillStyle = C.white;
      ctx.fillRect(c.x, y, c.w, h);
      ctx.fillRect(c.x + c.w * (0.14 + (s % 5) * 0.02), y - h, c.w * 0.56, h + 1);
      ctx.fillRect(c.x + c.w * (0.3 + (s % 3) * 0.04), y - h * 2, c.w * 0.26, h + 1);
      ctx.fillStyle = mix(b.sky, b.farColor, 0.5);
      ctx.fillRect(c.x + c.w * 0.06, y + h, c.w * 0.86, 2);
    }

    if (this.plane) {
      const px = this.plane.x, py = v.groundY * this.plane.y + 20;
      ctx.fillStyle = C.white;
      ctx.fillRect(px - 120, py + 2, 108, 2.4);
      ctx.fillStyle = mix(C.ink2, b.sky, 0.45);
      ctx.beginPath();
      poly(ctx, [px - 14, py + 2, px + 16, py - 5, px + 22, py - 7, px + 20, py - 3, px - 10, py + 6]);
      poly(ctx, [px - 2, py + 1, px - 10, py - 9, px - 5, py - 9, px + 8, py - 2]);
      poly(ctx, [px - 12, py + 3, px - 18, py - 4, px - 14, py - 4, px - 7, py + 3]);
      ctx.fill();
    }
  }

  _sprite(it, ps, pad) {
    const cw = Math.ceil((it.w + pad * 2) * ps), ch = Math.ceil((it.h + (it.extra || 0)) * ps);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const k = canvas.getContext('2d');
    k.scale(ps, ps);
    k.translate(pad, it.h + (it.extra || 0));
    if (it.style) k.transform(1, 0, ((it.seed % 7) - 3) * 0.0022, 1, 0, 0);       // дома стоят чуть криво, каждый по-своему
    it.draw(k, it);
    it.sprite = canvas;
    it.ps = ps;
    it.sw = cw / ps;
    it.sh = ch / ps;
    it.pad = pad;
  }

  drawCity(ctx) {
    const v = this.game.view, gy = v.groundY;
    const ps = Math.min(2, v.scale * v.dpr), snap = x => Math.round(x * ps) / ps;

    // дальний план
    for (let i = this.farSets.length - 1; i >= 0; i--) {
      const set = this.farSets[i];
      if (set.alpha <= 0) continue;
      ctx.globalAlpha = set.alpha;
      const color = set.loc.farColor;
      ctx.fillStyle = color;
      for (const it of set.items) {
        if (it.x > v.w + 20) continue;
        ctx.save();
        ctx.translate(it.x, gy);
        ctx.scale(it.s, it.s);
        const art = FarArt[it.kind];
        if (art.own) art.draw(ctx, it, color);
        else { ctx.beginPath(); art.draw(ctx, it); ctx.fill(); }
        ctx.restore();
      }
    }

    // Дома, фасады и улица рисуются один раз во внеэкранный холст. То, что ещё за краем экрана,
    // готовим заранее и не больше одного за кадр — чтобы не было рывков.
    let budget = 1;
    const ready = (it, pad) => {
      if (it.sprite && it.ps === ps) return true;
      if (it.x > v.w + 20) { if (budget > 0) { budget--; this._sprite(it, ps, pad); } return false; }
      this._sprite(it, ps, pad);
      return true;
    };

    // дома целиком
    for (let i = this.backSets.length - 1; i >= 0; i--) {
      const set = this.backSets[i];
      if (set.alpha <= 0) continue;
      ctx.globalAlpha = set.alpha;
      for (const b of set.items) {
        if (!ready(b, 6) || b.x > v.w + 20) continue;
        ctx.drawImage(b.sprite, snap(b.x - b.pad), gy - b.h - b.extra, b.sw, b.sh);
      }
    }
    ctx.globalAlpha = 1;

    // провода между крышами
    const wire = mix(C.ink2, this.loc.sky, 0.55);
    ctx.strokeStyle = wire;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i + 1 < this.front.items.length; i++) {
      const a = this.front.items[i], b = this.front.items[i + 1];
      if (!a.style || !b.style || a.x > v.w) continue;
      const ya = gy - (a.h - 50), yb = gy - (b.h - 50), x0 = a.x + a.w - 24, x1 = b.x + 26;
      ctx.moveTo(x0, ya - 4);
      ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(ya, yb) + 16, x1, yb - 4);
      if ((a.seed + b.seed) % 2) { ctx.moveTo(x0 - 14, ya - 2); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(ya, yb) + 28, x1 + 20, yb - 2); }
    }
    ctx.stroke();

    // фасады
    for (const f of this.front.items) {
      if (!ready(f, 8) || f.x > v.w + 20) continue;
      ctx.drawImage(f.sprite, snap(f.x - f.pad), gy - f.h, f.sw, f.sh);
    }

    // улица
    for (const it of this.props.items) {
      if (!ready(it, 40) || it.x > v.w + 60) continue;
      ctx.drawImage(it.sprite, snap(it.x - it.pad), gy - it.h, it.sw, it.sh);
    }
  }

  drawGround(ctx) {
    const g = this.game, v = g.view, gy = v.groundY, x0 = -60, W = v.w + 120, off = this.groundOffset;

    // тротуар: плитка в два ряда со смещением
    ctx.fillStyle = C.sidewalk;
    ctx.fillRect(x0, gy, W, 14);
    ctx.fillStyle = C.sidewalkJoint;
    ctx.fillRect(x0, gy + 7, W, 1);
    ctx.beginPath();
    for (let x = -(off % 23) - 23; x < v.w + 23; x += 23) { ctx.rect(x, gy + 2, 1, 5); ctx.rect(x + 11.5, gy + 8, 1, 6); }
    ctx.fill();

    // бордюр, асфальт и линия земли
    ctx.fillStyle = C.asphalt;
    ctx.fillRect(x0, gy + 14, W, v.h - gy + 80);
    ctx.fillStyle = '#8F887B';
    ctx.fillRect(x0, gy + 14, W, 4);
    ctx.fillStyle = C.ink;
    ctx.fillRect(x0, gy, W, 2.6);

    const lanes = v.band >= 290 ? 2 : v.band >= 200 ? 1 : 0;
    const mark = '#57514A';
    const dash = y => {
      ctx.fillStyle = mark;
      ctx.beginPath();
      for (let x = -(off % 78) - 78; x < v.w + 78; x += 78) ctx.rect(x, y, 36, 3.5);
      ctx.fill();
    };
    if (lanes === 0) dash(gy + 34);
    else {
      this._drawDecals(ctx, gy + 18, lanes * 72 - 6);
      // машины на дороге: перед героем, но ниже игровой дорожки
      for (const t of this.traffic) { t.y = gy + 14 + 66 + t.lane * 70; drawTraffic(ctx, t); }
      if (lanes === 2) dash(gy + 14 + 74);
      ctx.fillStyle = mark;
      ctx.fillRect(x0, gy + 14 + lanes * 72 + 6, W, 2.5);
    }
    this._drawBand(ctx, lanes);
  }

  _drawDecals(ctx, top, h) {
    const v = this.game.view;
    for (const d of this.decals.items) {
      if (d.x > v.w + 10) continue;
      const x = d.x;
      if (d.kind === 'manhole') {
        ctx.fillStyle = '#3A3530';
        ctx.beginPath(); poly(ctx, [x, top + 16, x + 7, top + 11, x + 23, top + 11, x + 30, top + 16, x + 23, top + 21, x + 7, top + 21]); ctx.fill();
        ctx.fillStyle = '#211D1A';
        ctx.fillRect(x + 8, top + 15, 14, 1.4); ctx.fillRect(x + 11, top + 17.6, 8, 1.2);
      } else if (d.kind === 'grate') {
        ctx.fillStyle = '#211D1A';
        ctx.fillRect(x, top + 1, 26, 7);
        ctx.fillStyle = '#4A443D';
        for (let i = 0; i < 5; i++) ctx.fillRect(x + 2 + i * 5, top + 2, 2, 5);
      } else if (d.kind === 'patch') {                  // заплатка: асфальт положили поверх плитки, потом наоборот
        ctx.fillStyle = '#24211E';
        ctx.beginPath(); poly(ctx, [x, top + 12, x + 12, top + 6, x + 74, top + 8, x + 90, top + 20, x + 80, top + 34, x + 16, top + 36]); ctx.fill();
      } else if (d.kind === 'zebra') {                  // жёлто-белая «зебра»
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#B9A04A' : '#B8B2A6'; ctx.beginPath(); poly(ctx, [x + i * 22, top + 4, x + i * 22 + 13, top + 4, x + i * 22 + 9, top + h - 4, x + i * 22 - 4, top + h - 4]); ctx.fill(); }
      } else if (d.kind === 'busA') {                   // выделенная полоса
        ctx.fillStyle = '#B9A04A';
        ctx.beginPath(); poly(ctx, [x, top + 46, x + 20, top + 12, x + 32, top + 12, x + 52, top + 46, x + 42, top + 46, x + 38, top + 38, x + 14, top + 38, x + 10, top + 46]); ctx.fill();
        ctx.fillStyle = C.asphalt;
        ctx.beginPath(); poly(ctx, [x + 18, top + 31, x + 26, top + 19, x + 34, top + 31]); ctx.fill();
      }
    }
  }

  /* Нижняя полоса: район и сколько осталось до следующего */
  _drawBand(ctx, lanes) {
    const g = this.game, v = g.view, gy = v.groundY;
    const loc = g.location, next = g.nextLocation, m = g.score.meters;
    const span = g.locationTo - g.locationFrom;
    const prog = span > 0 ? clamp((m - g.locationFrom) / span, 0, 1) : 0;
    const pad = 18, maxW = v.w - pad * 2, mute = '#8F887B';

    if (v.band >= 200) {
      const top = gy + 14 + lanes * 72 + 18;
      T(ctx, 'РАЙОН', pad, top + 8, { size: 15, color: mute, align: 'left', weight: 800 });
      const size = T(ctx, loc.name, pad, top + 40, { size: Math.min(54, v.w * 0.105), maxW, color: C.lime, align: 'left' });
      // шкала района: деления вместо скруглённой полоски
      const by = top + 44 + size * 0.5, n = Math.max(12, Math.round(maxW / 16)), sw = maxW / n;
      for (let i = 0; i < n; i++) { ctx.fillStyle = (i + 0.5) / n <= prog ? C.lime : '#4A443D'; ctx.fillRect(pad + i * sw, by, sw - 3, 8); }
      if (next) T(ctx, `дальше — ${next.short} · ${fmt(Math.max(0, Math.ceil(g.locationTo - m)))} м`, pad, by + 23, { size: 15, color: mute, align: 'left', font: FONT.text, weight: 700 });
      if (v.h - (by + 26) > 64) T(ctx, 'KEYSTOMOSCOW', pad, v.h - 30, { size: 17, color: '#4A443D', align: 'left' });
    } else {
      T(ctx, loc.name, pad, gy + 56, { size: 17, color: C.lime, align: 'left' });
      const bx = pad + ctx.measureText(loc.name).width + 14, bw = v.w - bx - pad;
      if (bw > 60) {
        const n = Math.max(8, Math.round(bw / 14)), sw = bw / n;
        for (let i = 0; i < n; i++) { ctx.fillStyle = (i + 0.5) / n <= prog ? C.lime : '#4A443D'; ctx.fillRect(bx + i * sw, gy + 52, sw - 2.5, 6); }
      }
    }
  }
}

K.World = World;
K.PARALLAX = PARALLAX;

})(window.KTM = window.KTM || {});
