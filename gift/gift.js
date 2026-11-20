/* Gift reveal: "The Cabin in the Woods"
   Flow: date check -> secret word -> 3 rooms (3 keys) -> chest -> VIP ticket.
   Note: this is a static site, so the code and date check are client-side
   and are meant for fun, not security. */
(() => {
  'use strict';

  const CODE = 'princess';
  const OPEN_DATE = '2026-11-20';           // local date the gift is open
  const STORE_KEY = 'ashGift.stage.v1';     // -1 gate, 0-2 rooms, 3 chest, 4 reveal
  const LAUNCH_DAY = 27;                    // "Never Only Mine" drops Nov 27

  const $ = (s, r = document) => r.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preview = new URLSearchParams(location.search).has('preview');

  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  }

  /* ---------------- sound (Web Audio, created on first tap) ---------------- */
  let ac;
  function tone(freq, dur = 0.5, type = 'triangle', vol = 0.16, delay = 0) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = ac || new AC();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const fanfare = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.6, 'triangle', 0.18, i * 0.11));
  const buzz = () => tone(110, 0.3, 'sawtooth', 0.08);

  /* ---------------- screens + state ---------------- */
  const screens = ['closed', 'gate', 'game', 'reveal'];
  function show(name) {
    screens.forEach((s) => { $('#screen-' + s).hidden = s !== name; });
  }
  const getStage = () => {
    const n = parseInt(localStorage.getItem(STORE_KEY), 10);
    return Number.isInteger(n) && n >= -1 && n <= 4 ? n : -1;
  };
  let stage = -1;
  function setStage(n) {
    stage = n;
    try { localStorage.setItem(STORE_KEY, String(n)); } catch (_) { /* private mode */ }
  }
  const todayLocal = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  function shake(el) {
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  }

  /* ---------------- ambient fireflies ---------------- */
  function ambient() {
    const box = $('#ambient');
    for (let i = 0; i < 22; i++) {
      const f = h('i');
      f.style.cssText =
        `left:${Math.random() * 100}%;top:${Math.random() * 100}%;` +
        `--dx:${(Math.random() - 0.5) * 140}px;--dy:${(Math.random() - 0.5) * 140}px;` +
        `--d:${6 + Math.random() * 8}s;--delay:${-Math.random() * 10}s`;
      box.append(f);
    }
  }

  /* ---------------- logo (real image if present, else recreation) ---------------- */
  function mountLogo(slot) {
    const node = $('#tpl-logo').content.firstElementChild.cloneNode(true);
    slot.replaceChildren(node);
    const img = $('.hs-logo__img', node);
    const probe = new Image();
    probe.onload = () => { img.src = probe.src; img.hidden = false; $('.hs-logo__fallback', node).hidden = true; };
    probe.src = img.getAttribute('src');
  }

  /* ---------------- gate ---------------- */
  let wrong = 0;
  function initGate() {
    const form = $('#gateForm'), input = $('#codeInput'), msg = $('#gateMsg'), card = $('#gateCard');
    const quips = [
      'The door just giggled. Try again.',
      'Nope. A squirrel is watching you judge-y.',
      'So close. (It was not close.)',
      'The fireflies are rooting for you.',
    ];
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (val === CODE) {
        card.classList.add('is-open');
        msg.textContent = 'Click. The door creaks open…';
        fanfare();
        await wait(reduceMotion ? 100 : 1100);
        card.classList.remove('is-open');
        setStage(0);
        startGame();
      } else {
        buzz(); shake(card);
        msg.textContent = quips[wrong++ % quips.length];
        input.select();
      }
    });
    $('#gateHint').addEventListener('click', () => {
      msg.textContent = 'Hint: it\u2019s the password from the first program I ever wrote you.';
    });
  }

  /* ---------------- game scaffolding ---------------- */
  const rooms = [
    { name: 'Room 1 · The Mantel', hint: 'Press “Listen”, watch which pads glow, then tap the same order. Listen as many times as you like.' },
    { name: 'Room 2 · The Strongbox', hint: 'The note says the day after Thanksgiving. The new single is out in November. Peek at the main site if you need to.' },
    { name: 'Room 3 · The Meadow', hint: 'They blink and drift. Tap or click each glowing firefly until the jar is full.' },
    { name: 'The Treasure Chest', hint: 'You have everything you need. Press the big button.' },
  ];
  let cleanup = null;

  function updateKeys() {
    document.querySelectorAll('.keys__slot').forEach((el, i) => el.classList.toggle('is-found', i < Math.min(stage, 3)));
  }

  function startGame() {
    if (stage >= 4) return startReveal(false);
    show('game');
    renderStage();
  }

  function renderStage() {
    if (cleanup) { cleanup(); cleanup = null; }
    const box = $('#puzzle');
    box.replaceChildren();
    $('#hintText').textContent = '';
    $('#roomName').textContent = rooms[stage].name;
    updateKeys();
    const fn = [stageMusic, stageLock, stageFireflies, stageChest][stage];
    cleanup = fn(box) || null;
  }

  function solved(box, keyNumber) {
    fanfare();
    setStage(stage + 1);
    updateKeys();
    $('#hintText').textContent = '';
    box.replaceChildren(h('div', { class: 'found' },
      h('div', { class: 'found__key', 'aria-hidden': 'true' }, '🗝️'),
      h('h2', {}, `Key ${keyNumber} of 3 found!`),
      h('p', {}, keyNumber < 3 ? 'It clicks into your pocket. Another door is waiting.' : 'That is the last one. Something is rattling in the corner…'),
      h('button', { class: 'btn', type: 'button', onclick: renderStage }, 'Next room →')));
    $('.found .btn').focus();
  }

  /* ---------------- room 1: music box ---------------- */
  function stageMusic(box) {
    const notes = [261.63, 329.63, 392.0, 523.25];
    const colors = ['#e9c983', '#a9c0a3', '#e89aa8', '#8ec5e8'];
    const symbols = ['☀', '🌿', '♥', '❄'];
    const seq = [0, 2, 1, 3, 2];
    let input = [], busy = false, alive = true;

    const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' }, 'Tap Listen to hear the melody.');
    const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, seq.map(() => h('i')));
    const pads = notes.map((_, i) => {
      const b = h('button', { class: 'pad', type: 'button', 'aria-label': `Note ${i + 1}`, onclick: () => press(i) }, symbols[i]);
      b.style.setProperty('--c', colors[i]);
      return b;
    });
    const listen = h('button', { class: 'btn', type: 'button', onclick: demo }, '▶ Listen');

    const light = (i) => {
      tone(notes[i], 0.5);
      pads[i].classList.add('is-lit');
      setTimeout(() => pads[i].classList.remove('is-lit'), 320);
    };
    const paint = () => [...dots.children].forEach((d, k) => d.classList.toggle('on', k < input.length));

    async function demo() {
      if (busy) return;
      busy = true; input = []; paint(); listen.disabled = true;
      status.textContent = 'Listen closely…';
      await wait(300);
      for (const i of seq) { if (!alive) return; light(i); await wait(650); }
      busy = false; listen.disabled = false;
      status.textContent = 'Your turn. Play it back.';
    }

    function press(i) {
      if (busy) return;
      light(i);
      if (i !== seq[input.length]) {
        buzz(); shake(box); input = []; paint();
        status.textContent = 'Off-key! Hit Listen and try again.';
        return;
      }
      input.push(i); paint();
      if (input.length === seq.length) {
        busy = true;
        setTimeout(() => alive && solved(box, 1), 600);
      }
    }

    box.append(
      h('div', { class: 'scene', 'aria-hidden': 'true' }, '🎶'),
      h('h2', {}, 'The Silent Music Box'),
      h('p', {}, 'An old music box sits on the mantel. Its melody has gone quiet. Wake it up by playing the tune back.'),
      h('div', { class: 'pads' }, pads), dots, status, listen);
    return () => { alive = false; };
  }

  /* ---------------- room 2: dial lock ---------------- */
  function stageLock(box) {
    const vals = [0, 0];
    const outs = vals.map((_, i) => h('output', { 'aria-label': `Digit ${i + 1}` }, '0'));
    const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });

    const dial = (i) => h('div', { class: 'dial' },
      h('button', { type: 'button', 'aria-label': `Digit ${i + 1} up`, onclick: () => bump(i, 1) }, '▲'),
      outs[i],
      h('button', { type: 'button', 'aria-label': `Digit ${i + 1} down`, onclick: () => bump(i, -1) }, '▼'));

    function bump(i, d) {
      vals[i] = (vals[i] + d + 10) % 10;
      outs[i].textContent = vals[i];
      tone(300 + vals[i] * 20, 0.08, 'square', 0.05);
    }
    function tryLock() {
      if (vals[0] * 10 + vals[1] === LAUNCH_DAY) { solved(box, 2); return; }
      buzz(); shake(box);
      status.textContent = 'Clunk. The strongbox stays shut.';
    }

    box.append(
      h('div', { class: 'scene', 'aria-hidden': 'true' }, '📜'),
      h('h2', {}, 'The Strongbox'),
      h('div', { class: 'note' },
        h('p', {}, 'The day after Thanksgiving, Ashley’s next song steps out into the world. Dial the date.'),
        h('p', {}, h('a', { href: '../#music', target: '_blank', rel: 'noopener' }, 'psst… the main site knows'))),
      h('div', { class: 'lock' }, dial(0), dial(1), h('span', { class: 'lock__icon', 'aria-hidden': 'true' }, '🔐')),
      h('button', { class: 'btn', type: 'button', onclick: tryLock }, 'Try the lock'),
      status);
  }

  /* ---------------- room 3: catch the fireflies ---------------- */
  function stageFireflies(box) {
    const TOTAL = 7;
    let caught = 0, running = true;
    const counter = h('span', {}, `0 / ${TOTAL}`);
    const field = h('div', { class: 'meadow' });
    const flies = [];

    for (let i = 0; i < TOTAL; i++) {
      const el = h('button', { class: 'fly', type: 'button', 'aria-label': 'Catch firefly' });
      el.style.setProperty('--bd', `${-Math.random() * 1.8}s`);
      const f = { el, x: 10 + Math.random() * 80, y: 10 + Math.random() * 75, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.22, got: false };
      el.addEventListener('click', () => {
        if (f.got) return;
        f.got = true; caught++;
        el.classList.add('caught');
        tone(660 + caught * 90, 0.35, 'sine', 0.14);
        counter.textContent = `${caught} / ${TOTAL}`;
        if (caught === TOTAL) { running = false; setTimeout(() => solved(box, 3), 700); }
      });
      flies.push(f); field.append(el);
    }

    function frame() {
      if (!running || !field.isConnected) return;
      for (const f of flies) {
        if (f.got) continue;
        f.vx += (Math.random() - 0.5) * 0.04; f.vy += (Math.random() - 0.5) * 0.04;
        f.vx = Math.max(-0.35, Math.min(0.35, f.vx)); f.vy = Math.max(-0.28, Math.min(0.28, f.vy));
        f.x += f.vx; f.y += f.vy;
        if (f.x < 6 || f.x > 94) { f.vx *= -1; f.x = Math.max(6, Math.min(94, f.x)); }
        if (f.y < 8 || f.y > 90) { f.vy *= -1; f.y = Math.max(8, Math.min(90, f.y)); }
        f.el.style.left = f.x + '%'; f.el.style.top = f.y + '%';
      }
      requestAnimationFrame(frame);
    }
    flies.forEach((f) => { f.el.style.left = f.x + '%'; f.el.style.top = f.y + '%'; });

    box.append(
      h('div', { class: 'scene', 'aria-hidden': 'true' }, '🌙'),
      h('h2', {}, 'The Firefly Meadow'),
      h('p', {}, 'The last key is hiding in a jar of light. Catch every firefly to fill it.'),
      field,
      h('p', { class: 'jar', 'aria-live': 'polite' }, '🫙', counter));
    if (!reduceMotion) requestAnimationFrame(frame);
    return () => { running = false; };
  }

  /* ---------------- finale: chest ---------------- */
  function stageChest(box) {
    const chest = h('div', { class: 'chest', 'aria-hidden': 'true' }, '🎁');
    const btn = h('button', { class: 'btn', type: 'button' }, 'Turn all three keys');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      chest.classList.add('is-shaking');
      [0, 1, 2].forEach((i) => tone(220 + i * 110, 0.25, 'square', 0.07, i * 0.25));
      await wait(reduceMotion ? 100 : 1900);
      setStage(4);
      startReveal(true);
    });
    box.append(
      h('h2', {}, 'One last thing…'),
      h('p', {}, 'A chest in the corner has three keyholes. You know what to do.'),
      chest,
      h('div', { class: 'chest-keys', 'aria-hidden': 'true' }, '🗝️', '🗝️', '🗝️'),
      btn);
  }

  /* ---------------- reveal ---------------- */
  function startReveal(withConfetti) {
    show('reveal');
    mountLogo($('#logoSlot'));
    initTilt();
    if (withConfetti) { fanfare(); burst(); }
  }

  function initTilt() {
    const t = $('#ticket');
    if (t.dataset.tilt || reduceMotion) return;
    t.dataset.tilt = '1';
    const wrap = t.parentElement;
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      t.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`;
    });
    wrap.addEventListener('pointerleave', () => { t.style.transform = ''; });
  }

  /* ---------------- confetti ---------------- */
  function burst() {
    if (reduceMotion) return;
    const cv = $('#confetti'), ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ['#d9a441', '#e9c983', '#a9c0a3', '#e89aa8', '#8ec5e8', '#f4efe6'];
    const bits = Array.from({ length: 170 }, () => ({
      x: innerWidth / 2, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 3,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: colors[Math.floor(Math.random() * colors.length)], life: 0,
    }));
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = 0;
      for (const b of bits) {
        b.life++; b.vy += 0.28; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        if (b.y < innerHeight + 20 && b.life < 280) alive++;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
        ctx.fillStyle = b.c; ctx.globalAlpha = Math.max(0, 1 - b.life / 280);
        ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
      }
      if (alive) requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  /* ---------------- boot ---------------- */
  function boot() {
    ambient();
    initGate();

    $('#hintBtn').addEventListener('click', () => { $('#hintText').textContent = rooms[stage].hint; });
    $('#againBtn').addEventListener('click', () => { fanfare(); burst(); });

    if (!preview && todayLocal() !== OPEN_DATE) { show('closed'); return; }

    stage = getStage();
    if (stage === -1) { show('gate'); $('#codeInput').focus(); }
    else startGame();
  }

  boot();
})();
