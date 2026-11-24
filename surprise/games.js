/* The 13 games: index 0 = 2014 intro room, 1..12 = 2015..2026.
   Each game is (box, win) => optional cleanup(). Call win() once when solved. */
(() => {
  'use strict';
  const { h, wait, norm, shake, rng, tone, buzz, blip, reduceMotion } = window.SUR;
  const G = window.SUR.games;

  const head = (emoji, title, text) => [
    h('div', { class: 'scene', 'aria-hidden': 'true' }, emoji),
    h('h2', {}, title),
    h('p', { class: 'lead' }, text),
  ];
  const statusEl = (txt = '') => h('p', { class: 'status', role: 'status', 'aria-live': 'polite' }, txt);
  const answerRow = (placeholder, onSubmit, label = 'Answer') => {
    const input = h('input', { type: 'text', placeholder, 'aria-label': label, autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false' });
    const form = h('form', { class: 'answer', onsubmit: (e) => { e.preventDefault(); onSubmit(input.value, input); } },
      input, h('button', { class: 'btn', type: 'submit' }, 'Check'));
    return { form, input };
  };

  /* ================= 0 · 2014 intro: trivia + a rustling bush ================= */
  G[0] = (box, win) => {
    let alive = true, timer = null;
    const status = statusEl();

    const stepTrivia = () => {
      box.replaceChildren(
        h('div', { class: 'photo-frame' }, h('img', { src: 'img/2014.jpg', alt: 'The two of you on your wedding day, cutting the cake', width: 1000, height: 664 })),
        h('h2', {}, 'Day One'),
        h('p', { class: 'lead' }, 'December 13, 2014. You said yes, and then you sat down to watch your very first football game together. BYU was playing…'),
        (() => {
          const { form } = answerRow('who?', (v, input) => {
            const n = norm(v);
            if (n.includes('texas') || n.includes('longhorn')) { blip(3); stepBush(); }
            else { buzz(); shake(box); status.textContent = 'Wrong team. Hook ’em… no wait, that is the right one. Try again.'; input.select(); }
          }, 'Opponent');
          return form;
        })(), status);
    };

    const stepBush = () => {
      const NEED = 6;
      let streak = 0, target = -1, round = 0, running = false;
      const bushes = Array.from({ length: 6 }, (_, i) => h('button', { class: 'bush', type: 'button', 'aria-label': `Bush ${i + 1}`, onclick: () => tap(i) }, '🌳'));
      const msg = statusEl('Something is rustling. Jump in front of the right bush to protect her!');
      const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, Array.from({ length: NEED }, () => h('i')));
      const paint = () => [...dots.children].forEach((d, k) => d.classList.toggle('on', k < streak));
      const clear = () => bushes.forEach((b) => b.classList.remove('rustle', 'safe', 'squirrel'));

      const next = () => {
        if (!alive) return;
        clear();
        let t; do { t = Math.floor(Math.random() * bushes.length); } while (t === target);
        target = t; running = true;
        bushes[t].classList.add('rustle');
        tone(180 + Math.random() * 60, 0.25, 'sawtooth', 0.04);
        timer = setTimeout(() => miss('Too slow! The rustling got away.'), Math.max(950, 2000 - round * 170));
      };
      const miss = (text) => {
        if (!running) return;
        running = false; clearTimeout(timer);
        buzz(); shake(box); streak = 0; round = 0; paint(); msg.textContent = text;
        setTimeout(next, 1100);
      };
      const tap = (i) => {
        if (!running) return;
        if (i !== target) { miss('Wrong bush! Protect her from the right one.'); return; }
        running = false; clearTimeout(timer);
        streak++; round++; paint(); blip(streak);
        clear();
        if (streak >= NEED) {
          bushes[i].classList.add('squirrel');
          msg.textContent = 'It was… a squirrel. A very brave protector, and a very scared squirrel.';
          setTimeout(() => alive && win(), 1700);
        } else {
          bushes[i].classList.add('safe');
          msg.textContent = `Safe! ${NEED - streak} more to go.`;
          setTimeout(next, 450);
        }
      };

      box.replaceChildren(...head('🌳', 'Rustle in the Bushes', 'Hear that? Tap the bush that is shaking before it gets away. Do it six times in a row.'),
        h('div', { class: 'bushes' }, bushes), dots, msg);
      setTimeout(next, 900);
    };

    stepTrivia();
    return () => { alive = false; clearTimeout(timer); };
  };

  /* ================= 1 · 2015: caesar decoder (Pleasant Springs) ================= */
  G[1] = (box, win) => {
    const SHIFT = 7;
    const plain = 'TWO WORDS. THE FIRST IS ANOTHER WORD FOR NICE. THE SECOND IS THE SEASON AFTER WINTER, PLURAL. LULU LIVED THERE TOO.';
    const rot = (s, k) => s.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k + 26) % 26) + 65));
    const cipher = rot(plain, SHIFT);
    const out = h('p', { class: 'cipher cipher--out' }, cipher);
    const val = h('output', {}, '0');
    const slider = h('input', { type: 'range', min: 0, max: 25, value: 0, 'aria-label': 'Decoder wheel shift', oninput: () => { val.textContent = slider.value; out.textContent = rot(cipher, -slider.value); } });
    const status = statusEl();
    const { form } = answerRow('name of our first apartment', (v, input) => {
      const n = norm(v);
      if (n.includes('pleasantspring')) { win(); }
      else { buzz(); shake(box); status.textContent = 'Not quite. Turn the wheel until the message makes sense.'; input.select(); }
    }, 'Apartment name');
    box.append(...head('🔐', 'The Year-One Cipher', 'A coded note from your first year. Turn the wheel until it reads like English, then answer what it asks.'),
      h('p', { class: 'cipher' }, cipher),
      h('div', { class: 'shiftbar' }, h('span', { class: 'small' }, 'Wheel'), slider, val),
      out, form, status);
  };

  /* ================= 2 · 2016: mastermind (2836) ================= */
  G[2] = (box, win) => {
    const SECRET = '2836', MAX = 10;
    let cur = '', list = [];
    const status = statusEl('Crack the four-digit number on the Provo townhouse.');
    const entry = h('div', { class: 'entry' }, [0, 1, 2, 3].map(() => h('span')));
    const guesses = h('div', { class: 'guesses', 'aria-label': 'Previous guesses' });
    const paint = () => [...entry.children].forEach((s, i) => { s.textContent = cur[i] || ''; });
    const score = (g) => {
      let gr = 0; const a = [], b = [];
      for (let i = 0; i < 4; i++) { if (g[i] === SECRET[i]) gr++; else { a.push(g[i]); b.push(SECRET[i]); } }
      let ye = 0; for (const d of a) { const k = b.indexOf(d); if (k >= 0) { ye++; b.splice(k, 1); } }
      return [gr, ye];
    };
    const submit = () => {
      if (cur.length < 4) { status.textContent = 'Four digits, please.'; return; }
      const [gr, ye] = score(cur);
      list.push([cur, gr, ye]);
      if (gr === 4) { blip(5); win(); return; }
      guesses.append(h('div', { class: 'guess' }, h('b', {}, cur),
        h('span', { 'aria-label': `${gr} right place, ${ye} wrong place` },
          ...Array.from({ length: gr }, () => h('i', { class: 'peg g' })), ...Array.from({ length: ye }, () => h('i', { class: 'peg y' })),
          ...Array.from({ length: 4 - gr - ye }, () => h('i', { class: 'peg n' })))));
      cur = ''; paint();
      if (list.length >= MAX) {
        buzz(); shake(box); list = []; guesses.replaceChildren();
        status.textContent = 'Out of guesses. Duane hummed a lullaby and the board reset. Try again!';
      } else status.textContent = `${MAX - list.length} guesses left. Green = right digit, right spot. Gold = right digit, wrong spot.`;
    };
    const pad = h('div', { class: 'numpad' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) =>
      h('button', { class: 'kb', type: 'button', onclick: () => { if (cur.length < 4) { cur += d; paint(); blip(d); } } }, String(d))));
    box.append(...head('🏡', 'The Humming Townhouse', 'Duane was born, and he hummed every night before he fell asleep. Your new Provo townhouse has a number on the door. Crack the code.'),
      guesses, entry, pad,
      h('div', { class: 'keys-row' },
        h('button', { class: 'kb', type: 'button', onclick: () => { cur = cur.slice(0, -1); paint(); } }, '⌫'),
        h('button', { class: 'btn', type: 'button', onclick: submit }, 'Try it')),
      status);
  };

  /* ================= 3 · 2017: sliding photo puzzle ================= */
  G[3] = (box, win) => {
    const N = 3, BLANK = N * N - 1;
    const r = rng(2017);
    const arr = Array.from({ length: N * N }, (_, i) => i);
    let b = BLANK, last = -1;
    const nbrs = (p) => { const x = p % N, y = Math.floor(p / N), o = []; if (x > 0) o.push(p - 1); if (x < N - 1) o.push(p + 1); if (y > 0) o.push(p - N); if (y < N - 1) o.push(p + N); return o; };
    for (let k = 0; k < 140; k++) { const c = nbrs(b).filter((p) => p !== last); const p = c[Math.floor(r() * c.length)]; [arr[b], arr[p]] = [arr[p], arr[b]]; last = b; b = p; }
    while (arr.every((v, i) => v === i)) { const c = nbrs(b).filter((p) => p !== last); const p = c[0]; [arr[b], arr[p]] = [arr[p], arr[b]]; last = b; b = p; }
    let moves = 0, done = false;
    const holder = h('div', { class: 'slide' }); holder.style.aspectRatio = '3 / 4';
    const tiles = Array.from({ length: N * N }, (_, id) => {
      const t = h('button', { type: 'button', 'aria-label': id === BLANK ? 'Empty space' : `Tile ${id + 1}`, onclick: () => press(id) });
      const cx = id % N, cy = Math.floor(id / N);
      t.style.width = `${100 / N}%`; t.style.height = `${100 / N}%`;
      t.style.backgroundImage = 'url(img/2017.jpg)'; t.style.backgroundSize = `${N * 100}% ${N * 100}%`;
      t.style.backgroundPosition = `${(cx / (N - 1)) * 100}% ${(cy / (N - 1)) * 100}%`;
      if (id === BLANK) t.classList.add('blank');
      holder.append(t); return t;
    });
    const mv = h('p', { class: 'moves' }, 'Moves: 0');
    const layout = () => arr.forEach((id, pos) => { tiles[id].style.left = `${(pos % N) * (100 / N)}%`; tiles[id].style.top = `${Math.floor(pos / N) * (100 / N)}%`; });
    function press(id) {
      if (done) return;
      const pos = arr.indexOf(id), bp = arr.indexOf(BLANK);
      if (!nbrs(pos).includes(bp)) { return; }
      arr[pos] = BLANK; arr[bp] = id; moves++; mv.textContent = `Moves: ${moves}`; blip(moves % 6); layout();
      if (arr.every((v, i) => v === i)) { done = true; tiles[BLANK].classList.remove('blank'); setTimeout(win, 1200); }
    }
    layout();
    box.append(...head('📸', 'Sand in the Camera', 'In Hawai’i you tried to take a perfect picture, and Duane fell in the sand. The photo got scrambled. Slide the tiles back into place.'), holder, mv);
  };

  /* ================= 4 · 2018: hangman (song) ================= */
  G[4] = (box, win) => {
    const PHRASE = 'IF YOU LOVE HER', LIVES = 6;
    let used = new Set(), lives = LIVES, over = false;
    const status = statusEl('Name the song of 2018. Andy arrived, and the TV cameras were secretly recording.');
    const phrase = h('div', { class: 'phrase' }), life = h('p', { class: 'lives', 'aria-live': 'polite' });
    const kbd = h('div', { class: 'keys-row' });
    const keyBtns = {};
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') { keyBtns[c] = h('button', { class: 'kb', type: 'button', onclick: () => guess(c) }, c); kbd.append(keyBtns[c]); }
    const paint = () => {
      phrase.replaceChildren(...PHRASE.split(' ').map((w) => h('div', { class: 'word' }, [...w].map((c) => h('span', {}, used.has(c) ? c : '')))));
      life.textContent = '❤️'.repeat(lives) + '🖤'.repeat(LIVES - lives);
    };
    function guess(c) {
      if (over || used.has(c)) return;
      used.add(c); keyBtns[c].disabled = true;
      if (PHRASE.includes(c)) { keyBtns[c].classList.add('good'); blip(2); } else { keyBtns[c].classList.add('bad'); lives--; buzz(); }
      paint();
      if ([...PHRASE].filter((x) => x !== ' ').every((x) => used.has(x))) { over = true; blip(6); setTimeout(win, 900); }
      else if (lives <= 0) {
        over = true; status.textContent = 'Out of hearts! The cameras reset. Try again.';
        setTimeout(() => { used = new Set(); lives = LIVES; over = false; Object.values(keyBtns).forEach((k) => { k.disabled = false; k.className = 'kb'; }); paint(); }, 1400);
      }
    }
    const onKey = (e) => { if (/^[a-z]$/i.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey && !/input|textarea/i.test(e.target.tagName)) guess(e.key.toUpperCase()); };
    document.addEventListener('keydown', onKey);
    paint();
    box.append(...head('📺', 'You Were On Air', 'You said some things on camera and had no idea they were recording. Guess the title of this year’s song before your hearts run out.'), phrase, life, kbd, status);
    return () => document.removeEventListener('keydown', onKey);
  };

  /* ================= 5 · 2019: memory match ================= */
  G[5] = (box, win) => {
    const ICONS = ['🎓', '🐱', '🏰', '🎂', '🐭', '✈️', '🎁', '👑'], LIMIT = 18;
    let deck, open = [], moves = 0, lock = false, matched = 0, alive = true;
    const grid = h('div', { class: 'cards' }), mv = h('p', { class: 'moves' }), status = statusEl();
    const deal = () => {
      deck = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5); open = []; moves = 0; matched = 0; lock = false;
      grid.replaceChildren(...deck.map((ic, i) => h('button', { class: 'mcard', type: 'button', 'aria-label': 'Hidden card', onclick: () => flip(i) }, ic)));
      mv.textContent = `Moves: 0 / ${LIMIT}`;
    };
    function flip(i) {
      const c = grid.children[i];
      if (lock || c.classList.contains('up') || c.classList.contains('done')) return;
      c.classList.add('up'); blip(open.length); open.push(i);
      if (open.length < 2) return;
      moves++; mv.textContent = `Moves: ${moves} / ${LIMIT}`; lock = true;
      const [a, b] = open; open = [];
      if (deck[a] === deck[b]) {
        grid.children[a].classList.replace('up', 'done'); grid.children[b].classList.replace('up', 'done'); matched++; lock = false;
        if (matched === ICONS.length) { status.textContent = 'Every pair found!'; setTimeout(() => alive && win(), 900); }
      } else setTimeout(() => {
        grid.children[a].classList.remove('up'); grid.children[b].classList.remove('up'); lock = false;
        if (moves >= LIMIT) { buzz(); shake(box); status.textContent = 'Out of moves! Shuffling a fresh deck.'; setTimeout(() => alive && deal(), 900); }
      }, 750);
    }
    deal();
    box.append(...head('🏰', 'The Surprise Trip', 'You graduated, you got a cat named Paka, and you secretly booked Ashley a birthday trip to Disneyland. Match all eight pairs in 18 moves.'), grid, mv, status);
    return () => { alive = false; };
  };

  /* ================= 6 · 2020: rodeo timing ================= */
  G[6] = (box, win) => {
    const NEED = 5; let hits = 0, zw = 26, zl = 40, speed = 0.55, t0 = performance.now(), pos = 0, alive = true, raf;
    const zone = h('div', { class: 'rodeo__zone' }), cur = h('div', { class: 'rodeo__cur' });
    const bar = h('div', { class: 'rodeo' }, zone, cur);
    const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, Array.from({ length: NEED }, () => h('i' )));
    const status = statusEl('Stop the bar in the green zone. Five perfect holds in a row.');
    const place = () => { zl = 4 + Math.random() * (92 - zw); zone.style.left = `${zl}%`; zone.style.width = `${zw}%`; [...dots.children].forEach((d, k) => d.classList.toggle('on', k < hits)); };
    const loop = (t) => {
      if (!alive) return;
      const p = ((t - t0) / 1000 * speed) % 2; pos = (p > 1 ? 2 - p : p) * 100;
      cur.style.left = `${pos}%`; raf = requestAnimationFrame(loop);
    };
    const hold = () => {
      if (!alive) return;
      if (pos >= zl && pos <= zl + zw) {
        hits++; zw = Math.max(9, zw - 3.6); speed += 0.14; blip(hits);
        if (hits >= NEED) { alive = false; cancelAnimationFrame(raf); [...dots.children].forEach((d) => d.classList.add('on')); status.textContent = 'Eight seconds… and then some. Yee-haw!'; setTimeout(win, 900); return; }
        status.textContent = ['Nice hold!', 'Steady…', 'Still on!', 'One more push!'][Math.min(hits - 1, 3)];
      } else { hits = 0; zw = 26; speed = 0.55; buzz(); shake(bar); status.textContent = 'Bucked off! Back to the start.'; }
      place();
    };
    const onKey = (e) => { if (e.code === 'Space' && !/input|textarea|button/i.test(e.target.tagName)) { e.preventDefault(); hold(); } };
    document.addEventListener('keydown', onKey);
    place(); t0 = performance.now(); raf = requestAnimationFrame(loop);
    box.append(...head('🤠', 'Ute Stampede', 'Cody was born, you hated the Ute mascot, and yet you loved the Ute Stampede Rodeo. Hold on to that bull.'),
      bar, dots, h('button', { class: 'btn bigbtn', type: 'button', onclick: hold }, 'Hold on!'), status);
    return () => { alive = false; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
  };

  /* ================= 7 · 2021: Dude Perfect trick shot ================= */
  const SHOT = { W: 600, H: 300, GROUND: 275, X0: 40, K: 0.14, GRAV: 0.25, CUP_HALF: 24, CUP_H: 34 };
  const SHOT_ROUNDS = [
    { cup: 360, wall: null, text: 'Warm-up. Nothing but net… or cup.' },
    { cup: 500, wall: null, text: 'A little farther. Aim and throw.' },
    { cup: 530, wall: { x: 250, w: 16, h: 170 }, text: 'Now with a barn in the way!' },
  ];
  function simulateShot(angleDeg, power, rd) {
    const { W, GROUND, X0, K, GRAV, CUP_HALF, CUP_H } = SHOT;
    const a = (angleDeg * Math.PI) / 180, v = power * K, pts = [];
    let hit = false, prev = GROUND;
    const cupY = GROUND - CUP_H;
    for (let t = 0; t < 900; t += 0.5) {
      const x = X0 + v * Math.cos(a) * t, y = GROUND - (v * Math.sin(a) * t - 0.5 * GRAV * t * t);
      if (rd.wall && x >= rd.wall.x && x <= rd.wall.x + rd.wall.w && y >= GROUND - rd.wall.h) { pts.push([x, y]); break; }
      const vy = v * Math.sin(a) - GRAV * t;
      if (vy < 0 && t > 1 && prev < cupY && y >= cupY && Math.abs(x - rd.cup) <= CUP_HALF) { pts.push([x, cupY]); hit = true; break; }
      pts.push([x, y]); prev = y;
      if (y >= GROUND && t > 1) break;
      if (x > W + 60) break;
    }
    return { pts, hit };
  }
  window.SUR.simulateShot = simulateShot; window.SUR.SHOT_ROUNDS = SHOT_ROUNDS; window.SUR.SHOT = SHOT;

  G[7] = (box, win) => {
    const { W, H, GROUND, X0, CUP_HALF, CUP_H } = SHOT, rounds = SHOT_ROUNDS, simulate = simulateShot;
    let round = 0, raf = null, trail = [], ball = null, busy = false, alive = true;
    const cv = h('canvas', { class: 'shot', width: W, height: H, role: 'img', 'aria-label': 'Trick shot court' });
    const ctx = cv.getContext('2d');
    const angle = h('input', { type: 'range', min: 15, max: 80, value: 45, 'aria-label': 'Angle', oninput: () => { aOut.textContent = angle.value + '°'; } });
    const power = h('input', { type: 'range', min: 30, max: 100, value: 60, 'aria-label': 'Power', oninput: () => { pOut.textContent = power.value; } });
    const aOut = h('output', {}, '45°'), pOut = h('output', {}, '60');
    const status = statusEl(rounds[0].text), dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, rounds.map(() => h('i')));
    const throwBtn = h('button', { class: 'btn', type: 'button', onclick: fire }, 'Throw!');

    function draw() {
      const rd = rounds[round];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1b3b2a'; ctx.fillRect(0, GROUND, W, H - GROUND);
      if (rd.wall) { ctx.fillStyle = '#8a3b2a'; ctx.fillRect(rd.wall.x, GROUND - rd.wall.h, rd.wall.w, rd.wall.h); ctx.font = '34px sans-serif'; ctx.fillText('🏚️', rd.wall.x - 10, GROUND - rd.wall.h - 4); }
      ctx.fillStyle = '#e9c983'; ctx.beginPath();
      ctx.moveTo(rd.cup - CUP_HALF, GROUND - CUP_H); ctx.lineTo(rd.cup + CUP_HALF, GROUND - CUP_H); ctx.lineTo(rd.cup + CUP_HALF - 8, GROUND); ctx.lineTo(rd.cup - CUP_HALF + 8, GROUND); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '42px sans-serif'; ctx.fillText('🧑', X0 - 36, GROUND + 2);
      if (trail.length) { ctx.fillStyle = 'rgba(233,201,131,0.5)'; trail.forEach((p, i) => { if (i % 6 === 0) { ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, 7); ctx.fill(); } }); }
      if (ball) { ctx.font = '34px sans-serif'; ctx.fillText('🏀', ball[0] - 17, ball[1] + 12); }
    }
    function fire() {
      if (busy || !alive) return;
      busy = true; throwBtn.disabled = true;
      const res = simulate(+angle.value, +power.value, rounds[round]);
      trail = []; let i = 0; tone(300, 0.15, 'square', 0.05);
      const step = () => {
        if (!alive) return;
        for (let k = 0; k < 3 && i < res.pts.length; k++, i++) { ball = res.pts[i]; trail.push(ball); }
        draw();
        if (i < res.pts.length) { raf = requestAnimationFrame(step); return; }
        busy = false; throwBtn.disabled = false;
        if (res.hit) {
          round++; blip(round * 2); [...dots.children].forEach((d, k) => d.classList.toggle('on', k < round));
          if (round >= rounds.length) { status.textContent = 'Heads Carolina! Trick shot champion. Dude Perfect would be proud.'; setTimeout(() => alive && win(), 1100); return; }
          status.textContent = 'Swish! ' + rounds[round].text; trail = []; ball = null; draw();
        } else {
          buzz(); const end = res.pts[res.pts.length - 1][0], c = rounds[round].cup;
          status.textContent = end < c - CUP_HALF ? 'Short. More power or a higher angle.' : end > c + CUP_HALF ? 'Long. Ease off the power.' : 'Rim out! So close. Nudge it.';
        }
      };
      raf = requestAnimationFrame(step);
    }
    draw();
    box.append(...head('🏀', 'Heads Carolina, Tails California', 'Brigham was born, you moved to North Carolina, and you ended up in a Dude Perfect video. Make three trick shots.'),
      cv, dots,
      h('div', { class: 'sliders' }, h('label', {}, 'Angle', angle, aOut), h('label', {}, 'Power', power, pOut)),
      throwBtn, status);
    return () => { alive = false; cancelAnimationFrame(raf); };
  };

  /* ================= 8 · 2022: ice maze (the snowy van) ================= */
  const ICE = ['.##..#..', '#...#...', '..#..#..', '.#.#...#', '..#.....', '....#...', '....#...', '...#..##'];
  window.SUR.ice = ICE;
  G[8] = (box, win) => {
    const N = 8, goal = [7, 0], start = [0, 7];
    let p = [...start], moves = 0, done = false;
    const cells = [];
    const grid = h('div', { class: 'ice', role: 'application', 'aria-label': 'Ice grid. Use arrow keys or swipe to slide the van.' });
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const c = h('div', { class: ICE[y][x] === '#' ? 'rock' : (x === goal[0] && y === goal[1] ? 'goal' : '') });
      if (ICE[y][x] === '#') c.textContent = '🌲';
      cells.push(c); grid.append(c);
    }
    const mv = h('p', { class: 'moves' });
    const status = statusEl('The tires are bald. The van slides until it hits a tree or the edge.');
    const paint = () => {
      cells.forEach((c, i) => { const x = i % N, y = Math.floor(i / N); if (ICE[y][x] !== '#') c.textContent = (x === goal[0] && y === goal[1]) ? '🏰' : ''; });
      cells[p[1] * N + p[0]].textContent = '🚐'; mv.textContent = `Slides: ${moves}`;
    };
    function slide(dx, dy) {
      if (done) return;
      let [cx, cy] = p;
      for (;;) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || ICE[ny][nx] === '#') break;
        cx = nx; cy = ny; if (cx === goal[0] && cy === goal[1]) break;
      }
      if (cx === p[0] && cy === p[1]) { buzz(); return; }
      p = [cx, cy]; moves++; blip(moves % 7); paint();
      if (cx === goal[0] && cy === goal[1]) { done = true; status.textContent = 'Castle reached. Disney wanted you on the team.'; setTimeout(win, 1100); }
    }
    const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const onKey = (e) => { const d = dirs[e.key]; if (d && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); slide(...d); } };
    document.addEventListener('keydown', onKey);
    let sx, sy;
    grid.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    grid.addEventListener('pointerup', (e) => {
      if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      Math.abs(dx) > Math.abs(dy) ? slide(Math.sign(dx), 0) : slide(0, Math.sign(dy));
    });
    const btn = (cls, label, ch, d) => h('button', { class: cls, type: 'button', 'aria-label': label, onclick: () => slide(...d) }, ch);
    paint();
    box.append(...head('🚐', 'Slippery Tires', 'Disney hired you, you explored all over North Carolina, and the borrowed van had terrible snow tires. Slide to the castle. Swipe, tap the arrows, or use your keyboard.'),
      grid, h('div', { class: 'dpad' }, btn('up', 'Up', '▲', [0, -1]), btn('left', 'Left', '◀', [-1, 0]), btn('down', 'Down', '▼', [0, 1]), btn('right', 'Right', '▶', [1, 0])),
      mv, h('button', { class: 'linkbtn', type: 'button', onclick: () => { p = [...start]; moves = 0; done = false; paint(); } }, 'Reset the van'), status);
    return () => document.removeEventListener('keydown', onKey);
  };

  /* ================= 9 · 2023: six boys, scrambled ================= */
  G[9] = (box, win) => {
    const BOYS = [['Duane', 2016], ['Andy', 2018], ['Cody', 2020], ['Brigham', 2021], ['Kirk', 2023], ['Ephraim', 2025]];
    const r = rng(2023);
    const scramble = (w) => { let s; let n = 0; do { s = [...w.toUpperCase()].sort(() => r() - 0.5).join(''); n++; } while (s === w.toUpperCase() && n < 20); return s; };
    const bank = BOYS.map(([n]) => scramble(n)).sort(() => r() - 0.5);
    const status = statusEl();
    const inputs = BOYS.map(([name]) => {
      const el = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', 'aria-label': 'Name' });
      el.addEventListener('input', () => { el.classList.toggle('ok', norm(el.value) === norm(name)); check(); });
      return el;
    });
    inputs.forEach((el, i) => el.setAttribute('aria-label', `Boy born in ${BOYS[i][1]}`));
    let finished = false;
    function check() {
      const n = inputs.filter((el, i) => norm(el.value) === norm(BOYS[i][0])).length;
      status.textContent = `${n} of 6 placed`;
      if (n === 6 && !finished) { finished = true; blip(6); setTimeout(win, 900); }
    }
    box.append(...head('👨‍👦‍👦', 'Stitches and Scrambles', 'Kirk was born, Brigham got stitches, and the van got air on the road trip. Meanwhile, your six boys’ names have been scrambled. Unscramble them and write each name next to the year he was born.'),
      h('div', { class: 'bank', 'aria-label': 'Scrambled names' }, bank.map((s) => h('span', {}, s))),
      h('div', { class: 'rows' }, BOYS.map(([, y], i) => h('label', {}, String(y), inputs[i]))), status);
  };

  /* ================= 10 · 2024: word search ================= */
  const WORDS = ['LIBERTY', 'BAPTISM', 'WINDY', 'NEWYORK', 'WALKING', 'DUANE'];
  function buildSearch() {
    const N = 9, r = rng(2024), g = Array.from({ length: N }, () => Array(N).fill(''));
    const DIRS = [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]];
    for (const w of WORDS) {
      let placed = false;
      for (let tries = 0; tries < 800 && !placed; tries++) {
        const [dx, dy] = DIRS[Math.floor(r() * DIRS.length)], x = Math.floor(r() * N), y = Math.floor(r() * N);
        const ex = x + dx * (w.length - 1), ey = y + dy * (w.length - 1);
        if (ex < 0 || ey < 0 || ex >= N || ey >= N) continue;
        let ok = true; for (let i = 0; i < w.length; i++) { const c = g[y + dy * i][x + dx * i]; if (c && c !== w[i]) { ok = false; break; } }
        if (!ok) continue;
        for (let i = 0; i < w.length; i++) g[y + dy * i][x + dx * i] = w[i];
        placed = true;
      }
      if (!placed) throw new Error('wordsearch placement failed for ' + w);
    }
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x]) g[y][x] = A[Math.floor(r() * 26)];
    return g;
  }
  window.SUR.buildSearch = buildSearch; window.SUR.WORDS = WORDS;
  G[10] = (box, win) => {
    const N = 9, g = buildSearch(), found = new Set();
    let start = null;
    const btns = [];
    const list = h('div', { class: 'wlist', 'aria-label': 'Words to find' });
    const status = statusEl('Tap the first letter of a word, then the last letter. Words can run backwards and diagonally.');
    const paintList = () => list.replaceChildren(...WORDS.map((w) => (found.has(w) ? h('s', {}, w) : h('span', {}, w))));
    const grid = h('div', { class: 'ws' });
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const b = h('button', { type: 'button', 'aria-label': `${g[y][x]} row ${y + 1} column ${x + 1}`, onclick: () => tap(x, y) }, g[y][x]);
      btns.push(b); grid.append(b);
    }
    function line(a, b) {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.max(Math.abs(dx), Math.abs(dy));
      if (len === 0 || !(dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy))) return null;
      const sx = Math.sign(dx), sy = Math.sign(dy), cells = [];
      for (let i = 0; i <= len; i++) cells.push([a[0] + sx * i, a[1] + sy * i]);
      return cells;
    }
    function tap(x, y) {
      if (start && start[0] === x && start[1] === y) { btns[y * N + x].classList.remove('start'); start = null; return; }
      if (!start) { start = [x, y]; btns[y * N + x].classList.add('start'); blip(0); return; }
      const cells = line(start, [x, y]);
      btns[start[1] * N + start[0]].classList.remove('start');
      start = null;
      if (!cells) { buzz(); start = [x, y]; btns[y * N + x].classList.add('start'); return; }
      const str = cells.map(([cx, cy]) => g[cy][cx]).join(''), rev = [...str].reverse().join('');
      const w = WORDS.find((q) => q === str || q === rev);
      if (w && !found.has(w)) {
        found.add(w); cells.forEach(([cx, cy]) => btns[cy * N + cx].classList.add('found')); blip(found.size + 2); paintList();
        status.textContent = `Found ${w}! ${WORDS.length - found.size} to go.`;
        if (found.size === WORDS.length) setTimeout(win, 900);
      } else { buzz(); status.textContent = 'Not a word on the list. Try again.'; }
    }
    paintList();
    box.append(...head('🗽', 'Windy at the Statue', 'Duane was baptized, and then you all took a trip to New York where it was very windy and Ashley walked everywhere. Find the six words.'), grid, list, status);
  };

  /* ================= 11 · 2025: lights out ================= */
  window.SUR.LIGHTS_PRESSES = [[1, 0], [3, 1], [0, 2], [2, 2], [4, 3], [1, 4], [3, 4], [1, 1]];
  G[11] = (box, win) => {
    const N = 5; let board, moves = 0, done = false;
    const toggle = (b, x, y) => { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) b[ny * N + nx] = !b[ny * N + nx]; } };
    const fresh = () => { const b = Array(N * N).fill(true); window.SUR.LIGHTS_PRESSES.forEach(([x, y]) => toggle(b, x, y)); return b; };
    board = fresh();
    const grid = h('div', { class: 'lights' }), mv = h('p', { class: 'moves' }), status = statusEl('Pressing a light flips it and its four neighbors. Get every light on.');
    const btns = board.map((_, i) => { const b = h('button', { type: 'button', 'aria-label': `Light ${i + 1}`, onclick: () => press(i) }); grid.append(b); return b; });
    const paint = () => { btns.forEach((b, i) => { b.classList.toggle('on', board[i]); b.setAttribute('aria-pressed', String(board[i])); }); mv.textContent = `Presses: ${moves}`; };
    function press(i) {
      if (done) return;
      toggle(board, i % N, Math.floor(i / N)); moves++; blip(moves % 8); paint();
      if (board.every(Boolean)) { done = true; status.textContent = 'The whole homestead is glowing.'; setTimeout(win, 1100); }
    }
    paint();
    box.append(...head('🌾', 'Light Up the Homestead', 'Ephraim was born, the boys won the flag football championship, and you finally got all the land you wanted. Switch on every light across the homestead.'),
      grid, mv, h('button', { class: 'linkbtn', type: 'button', onclick: () => { board = fresh(); moves = 0; paint(); } }, 'Start over'), status);
  };

  /* ================= 12 · 2026: 6x6 sudoku with travel icons ================= */
  window.SUR.SUDOKU = { puz: '005002000004004200030040026000053600', sol: '345162612354564213231546126435453621' };
  G[12] = (box, win) => {
    const SYM = ['🚁', '✈️', '🚗', '🏨', '🧳', '🌴'];
    const { puz, sol } = window.SUR.SUDOKU;
    const vals = [...puz].map(Number); let sel = -1, done = false;
    const grid = h('div', { class: 'sudo', role: 'grid', 'aria-label': 'Six by six puzzle' }), status = statusEl('Every row, column, and 2×3 box needs each symbol exactly once.');
    const cells = vals.map((v, i) => {
      const c = h('button', { type: 'button', 'aria-label': `Row ${Math.floor(i / 6) + 1}, column ${(i % 6) + 1}`, onclick: () => { if (!done && !puz[i].match(/[1-6]/)) { sel = i; paint(); } } });
      if (i % 6 === 2) c.classList.add('cb'); if (Math.floor(i / 6) % 2 === 1 && Math.floor(i / 6) < 5) c.classList.add('rb');
      grid.append(c); return c;
    });
    const clash = (i) => {
      const v = vals[i]; if (!v) return false; const r = Math.floor(i / 6), c = i % 6;
      for (let k = 0; k < 6; k++) { if (k !== c && vals[r * 6 + k] === v) return true; if (k !== r && vals[k * 6 + c] === v) return true; }
      const br = Math.floor(r / 2) * 2, bc = Math.floor(c / 3) * 3;
      for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) { const j = (br + y) * 6 + bc + x; if (j !== i && vals[j] === v) return true; }
      return false;
    };
    function paint() {
      cells.forEach((c, i) => { c.textContent = vals[i] ? SYM[vals[i] - 1] : ''; c.classList.toggle('given', /[1-6]/.test(puz[i])); c.classList.toggle('sel', i === sel); c.classList.toggle('clash', clash(i)); });
    }
    function put(v) {
      if (sel < 0 || done) { status.textContent = 'Tap an empty square first.'; return; }
      vals[sel] = v; blip(v); paint();
      if (vals.every((x) => x) && vals.every((x, i) => !clash(i))) { done = true; sel = -1; paint(); status.textContent = 'Checked in. Rooms are not free, boys.'; setTimeout(win, 1200); }
    }
    const pad = h('div', { class: 'symrow' }, SYM.map((s, i) => h('button', { class: 'kb', type: 'button', 'aria-label': `Symbol ${i + 1}`, onclick: () => put(i + 1) }, s)),
      h('button', { class: 'kb', type: 'button', 'aria-label': 'Erase', onclick: () => put(0) }, '⌫'));
    paint();
    box.append(...head('🚁', 'Check-In, Please', 'You traveled a ton and flew in a helicopter, and the boys decided a hotel room must be free. Fill the hotel’s key-card grid.'), grid, pad, status);
  };
})();
