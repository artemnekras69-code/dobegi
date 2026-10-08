/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — интерфейс поверх игрового поля

   Меню, пауза, результат, таблица лидеров, настройки, подсказки.
   Вся вёрстка — в index.html и style.css, здесь только поведение.
   ===================================================================== */
(function (K) {
'use strict';

const { fmt, plural, clamp } = K.util;
const CONFIG = K.CONFIG, TEXTS = K.TEXTS, C = CONFIG.colors;
const KEY_SVG = '<svg class="key" viewBox="0 0 48 48" aria-hidden="true"><use href="#i-key"/></svg>';

class UI {
  constructor(game) {
    const $ = id => document.getElementById(id);
    this.game = game;
    this.el = {
      hud: $('hud'), meters: $('hudMeters'), score: $('hudScore'), scoreLabel: $('hudScoreLabel'), scoreWrap: $('hudScoreWrap'),
      combo: $('hudCombo'), comboMult: $('hudComboMult'), comboNext: $('hudComboNext'),
      record: $('hudRecord'), recordLabel: $('hudRecordLabel'), best: $('hudBest'),
      toastSlot: $('toastSlot'), hint: $('hint'), countdown: $('countdown'),
      menuBest: $('menuBest'), menuName: $('menuName'), menuChallenge: $('menuChallenge'),
      nameInput: $('nameInput'), setNameValue: $('setNameValue'),
      setSound: $('setSound'), setMusic: $('setMusic'), setHaptics: $('setHaptics'), pauseSound: $('pauseSound'),
      leadersList: $('leadersList'), leadersYou: $('leadersYou'), leadersNote: $('leadersNote'),
      panel: $('overPanel'), head: $('overHead'), cause: $('overCause'), overMeters: $('overMeters'),
      overScore: $('overScore'), overScoreLabel: $('overScoreLabel'),
      overRecord: $('overRecord'), overRecordLabel: $('overRecordLabel'), overBest: $('overBest'),
      overCompare: $('overCompare'), overExtra: $('overExtra'), shareLabel: $('shareLabel'),
    };
    this.screens = {
      menu: $('screenMenu'), name: $('screenName'), howto: $('screenHowto'), settings: $('screenSettings'),
      leaders: $('screenLeaders'), pause: $('screenPause'), over: $('screenOver'),
    };
    this.screen = 'menu';       // какой экран сейчас поверх игры ('' — идёт забег)
    this.returnTo = 'menu';
    this.cache = { score: -1, meters: -1, best: -1, recordMode: '', streak: -1 };
    this.toastUntil = 0;
    this.toastPriority = 0;
    this.hintKind = '';
    this.hintQueued = null;
    this.fineInput = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

    const press = (id, fn) => {
      const el = typeof id === 'string' ? $(id) : id;
      el.addEventListener('click', e => { e.stopPropagation(); K.platform.touched = true; fn(); el.blur(); });
    };
    press('btnPlay', () => game.play());
    press('btnPause', () => game.pause());
    press('btnResume', () => game.resume());
    press('btnPauseRestart', () => game.restart());
    press('btnPauseMenu', () => game.toMenu());
    press('btnRetry', () => game.restart());
    press('btnOverMenu', () => game.toMenu());
    press('btnShare', () => game.share());
    press('btnLeaders', () => this.openLeaders());
    press('btnHowto', () => this.open('howto'));
    press('btnSettings', () => this.open('settings'));
    press('setSound', () => game.toggleSetting('sound'));
    press('setMusic', () => game.toggleSetting('music'));
    press('setHaptics', () => game.toggleSetting('haptics'));
    press('pauseSound', () => game.toggleSetting('sound'));
    press('setName', () => this.askName('settings'));
    press('btnNameOk', () => this.submitName(true));
    press('btnNameSkip', () => this.submitName(false));
    document.querySelectorAll('[data-back]').forEach(b => press(b, () => this.back()));
    this.el.nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.submitName(true); } });

    this.syncSettings();
    this.syncProfile();
  }

  /* ---------- Экраны ---------- */
  _show(name) {
    for (const key in this.screens) this.screens[key].hidden = key !== name;
    this.screen = name;
    this.el.hud.classList.toggle('is-hidden', name === 'menu' || name === 'name' || name === 'howto' || name === 'settings' || name === 'leaders');
    // кнопка «Назад» в шапке Telegram
    if (name === '') K.platform.setBack(() => this.game.pause());
    else if (name === 'pause') K.platform.setBack(() => this.game.resume());
    else if (name === 'over') K.platform.setBack(() => this.game.toMenu());
    else if (name === 'menu') K.platform.setBack(null);
    else K.platform.setBack(() => this.back());
  }

  open(name) {
    this.game.audio.unlock();
    this.game.audio.play('click');
    this.returnTo = 'menu';
    this._show(name);
  }

  back() {
    this.game.audio.play('click');
    this._show(this.returnTo);
    this.returnTo = 'menu';
  }

  showMenu() {
    const stats = this.game.storage.stats, profile = this.game.storage.profile, ch = this.game.challenge;
    this.el.menuBest.textContent = fmt(stats.best);
    this.el.menuChallenge.hidden = !ch;
    if (ch) this.el.menuChallenge.textContent = `${TEXTS.challenge.invite}: ${fmt(ch.score)} ${plural(ch.score, 'очко', 'очка', 'очков')}`;
    this.syncProfile();
    this.clearToasts();
    this.clearHint();
    this.showCountdown(0);
    this._show('menu');
    if (!profile.name && !profile.nameAsked) this.askName('menu');      // первый запуск в браузере
  }

  showGame(best) {
    this.cache.score = this.cache.meters = this.cache.streak = -1;
    this.setRecord(best, false);
    this._show('');
  }

  showPause(on) {
    if (on) { this.showCountdown(0); this._show('pause'); }
    else this._show('');
  }

  showCountdown(n) {
    const el = this.el.countdown;
    el.hidden = n <= 0;
    if (n > 0) {
      el.textContent = n;
      el.classList.remove('is-tick');
      void el.offsetWidth;
      el.classList.add('is-tick');
    }
  }

  /* ---------- Имя ---------- */
  askName(returnTo) {
    this.returnTo = returnTo;
    this.el.nameInput.value = this.game.storage.profile.name || '';
    this._show('name');
    if (returnTo === 'settings') setTimeout(() => { try { this.el.nameInput.focus(); } catch (e) { /* ок */ } }, 60);
  }

  submitName(save) {
    this.el.nameInput.blur();
    this.game.setName(save ? this.el.nameInput.value : this.game.storage.profile.name);
    this.back();
  }

  syncProfile() {
    const name = this.game.storage.profile.name;
    this.el.menuName.textContent = name ? `${name} · ` : '';
    this.el.setNameValue.textContent = name || TEXTS.defaultName;
  }

  syncSettings() {
    const s = this.game.storage.settings;
    const set = (el, on) => { el.setAttribute('aria-pressed', String(!!on)); el.querySelector('b').textContent = on ? 'ВКЛ' : 'ВЫКЛ'; };
    set(this.el.setSound, s.sound);
    set(this.el.setMusic, s.music);
    set(this.el.setHaptics, s.haptics);
    set(this.el.pauseSound, s.sound);
  }

  /* ---------- Таблица лидеров ---------- */
  async openLeaders() {
    this.open('leaders');
    K.analytics.track('leaderboard_opened', { best: this.game.storage.stats.best });
    const lb = K.leaderboard, show = CONFIG.leaderboard.show;
    const { rows, player, total } = await lb.top(show);
    const list = this.el.leadersList;
    list.textContent = '';
    const add = (e, gap) => {
      const li = document.createElement('li');
      li.className = 'leaders__row' + (e.isPlayer ? ' is-you' : '') + (gap ? ' is-gap' : '');
      const rank = document.createElement('span'); rank.className = 'leaders__rank'; rank.textContent = e.rank;
      const name = document.createElement('span'); name.className = 'leaders__name'; name.textContent = e.isPlayer ? `${e.displayName} — это ты` : e.displayName;
      const score = document.createElement('b'); score.textContent = fmt(e.score);
      li.append(rank, name, score);
      list.appendChild(li);
    };
    rows.forEach(e => add(e, false));
    if (player && player.rank > show) add(player, true);
    this.el.leadersYou.textContent = player
      ? `Ты сейчас #${player.rank} из ${total}`
      : 'Сыграй хотя бы раз — и попадёшь в таблицу';
    this.el.leadersNote.hidden = !lb.isMock;
  }

  /* ---------- Счёт ---------- */
  /* DOM трогаем, только когда число изменилось */
  sync(score, meters) {
    const c = this.cache, total = score.total;
    if (meters !== c.meters) { c.meters = meters; this.el.meters.textContent = fmt(meters); }
    if (total !== c.score) {
      c.score = total;
      this.el.score.textContent = fmt(total);
      this.el.scoreLabel.textContent = plural(total, 'очко', 'очка', 'очков');
    }
    if (score.streak !== c.streak) {
      c.streak = score.streak;
      const mult = score.multiplier, left = score.toNext;
      this.el.combo.hidden = score.streak < 1;
      this.el.combo.classList.toggle('is-on', mult > 1);
      this.el.comboMult.textContent = mult > 1 ? `×${mult}` : 'серия';
      this.el.comboNext.textContent = left ? `${score.streak}/${score.streak + left}` : 'макс';
    }
  }

  setRecord(best, isNew) {
    if (best !== this.cache.best) { this.cache.best = best; this.el.best.textContent = fmt(best); }
    const mode = isNew ? 'new' : best > 0 ? 'show' : 'hide';
    if (mode === this.cache.recordMode) return;
    this.cache.recordMode = mode;
    this.el.recordLabel.textContent = isNew ? TEXTS.record : 'Рекорд';
    this.el.record.classList.toggle('is-new', !!isNew);
    this.el.record.hidden = mode === 'hide';
  }

  bump(bad) {
    const el = this.el.scoreWrap, cls = bad ? 'is-hit' : 'is-bump';
    el.classList.remove('is-bump', 'is-hit');
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- Плашки и подсказки ---------- */
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

  /* Подсказка «тап — прыжок» самая важная: пока она на экране, остальные ждут своей очереди */
  hint(kind, text, tone = '') {
    if (kind && this.hintKind === 'jump' && kind !== 'jump') { this.hintQueued = [kind, text, tone]; return; }
    this.hintKind = kind;
    this.el.hint.hidden = !kind;
    if (kind) {
      this.el.hint.textContent = text;
      this.el.hint.className = `hint${tone ? ' hint--' + tone : ''}`;
    }
  }
  clearHint(kind) {
    if (!kind) { this.hintQueued = null; this.hint('', ''); return; }
    if (this.hintQueued && this.hintQueued[0] === kind) this.hintQueued = null;
    if (this.hintKind !== kind) return;
    const next = this.hintQueued;
    this.hintQueued = null;
    this.hintKind = '';
    if (next) this.hint(next[0], next[1], next[2]);
    else this.hint('', '');
  }

  setSpotlight(x, y) {
    this.screens.menu.style.setProperty('--px', `${x}px`);
    this.screens.menu.style.setProperty('--py', `${y}px`);
  }

  /* ---------- Результат ---------- */
  showGameOver(r) {
    const e = this.el;
    e.head.textContent = r.headline;
    e.cause.textContent = `«${r.cause}»`;
    e.overMeters.textContent = fmt(r.meters);
    e.overScore.textContent = fmt(r.score);
    e.overScoreLabel.textContent = plural(r.score, 'очко', 'очка', 'очков');
    e.overRecordLabel.textContent = r.isRecord ? `${TEXTS.record}! 🔥` : 'Рекорд';
    e.overBest.textContent = fmt(r.best);
    e.overBest.hidden = r.isRecord;
    e.overRecord.classList.toggle('is-new', r.isRecord);
    e.overRecord.querySelectorAll('.confetti').forEach(n => n.remove());

    // сравнение с прошлой попыткой
    let compare = '', tone = '';
    if (r.previous) {
      const diff = r.meters - r.previous.distance;
      if (diff > 0) { compare = `На ${fmt(diff)} м ${TEXTS.previous.better}`; tone = 'up'; }
      else if (diff < 0) compare = `${TEXTS.previous.worse[0].toUpperCase()}${TEXTS.previous.worse.slice(1)} ${fmt(-diff)} м`;
      else compare = 'Ровно как в прошлый раз';
    }
    e.overCompare.textContent = compare;
    e.overCompare.hidden = !compare;
    e.overCompare.className = `over__line${tone ? ' over__line--' + tone : ''}`;

    // квартиры, серия, редкости, вызов
    const parts = [];
    if (r.apartments > 0) parts.push(`${r.apartments} ${plural(r.apartments, 'квартира', 'квартиры', 'квартир')}`);
    if (r.bestCombo >= 3) parts.push(`серия ${r.bestCombo}`);
    if (r.discoveries.length) parts.push(`впервые: ${r.discoveries.join(', ').toLowerCase()}`);
    if (r.challenge) parts.push(r.score > r.challenge.score ? `${TEXTS.challenge.beaten.toLowerCase()} (${fmt(r.challenge.score)})` : `${TEXTS.challenge.left} ${fmt(r.challenge.score - r.score)}`);
    e.overExtra.textContent = parts.join(' · ');
    e.overExtra.hidden = !parts.length;

    e.shareLabel.textContent = 'Поделиться';
    e.panel.classList.remove('is-ready');
    this._show('over');
    this.screens.over.scrollTop = 0;
    setTimeout(() => e.panel.classList.add('is-ready'), CONFIG.ui.restartGuard * 1000);
    if (r.isRecord) this._confetti(e.overRecord);
  }

  _confetti(host) {
    const colors = [C.lime, C.ink, C.white, C.lime];
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('i');
      const a = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 110;
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

K.UI = UI;

})(window.KTM = window.KTM || {});
