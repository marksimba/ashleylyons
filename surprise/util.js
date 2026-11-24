/* Shared helpers for the /surprise page. Exposes window.SUR. */
(() => {
  'use strict';
  const SUR = (window.SUR = { games: [] });

  SUR.$ = (s, r = document) => r.querySelector(s);
  SUR.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  SUR.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  SUR.h = function h(tag, attrs = {}, ...kids) {
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
  };

  /* lowercase letters and digits only, so "Pleasant Springs!" == "pleasantsprings" */
  SUR.norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

  SUR.shake = (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

  /* deterministic RNG so puzzles are the same every time */
  SUR.rng = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------------- sound ---------------- */
  let ac;
  SUR.tone = (freq, dur = 0.4, type = 'triangle', vol = 0.15, delay = 0) => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ac = ac || new AC();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (_) { /* audio is optional */ }
  };
  SUR.fanfare = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => SUR.tone(f, 0.6, 'triangle', 0.17, i * 0.11));
  SUR.buzz = () => SUR.tone(110, 0.3, 'sawtooth', 0.07);
  SUR.blip = (n = 0) => SUR.tone(440 + n * 60, 0.12, 'sine', 0.1);

  /* ---------------- confetti ---------------- */
  SUR.burst = () => {
    if (SUR.reduceMotion) return;
    const cv = SUR.$('#confetti'), ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#d9a441', '#e9c983', '#a9c0a3', '#e89aa8', '#8ec5e8', '#f4efe6'];
    const bits = Array.from({ length: 190 }, () => ({
      x: innerWidth / 2, y: innerHeight * 0.4,
      vx: (Math.random() - 0.5) * 17, vy: -Math.random() * 15 - 3,
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
  };

  /* ---------------- a piece of the invitation (3 cols x 4 rows) ---------------- */
  SUR.piece = (i) => {
    const el = SUR.h('div', { class: 'piece' });
    el.style.backgroundPosition = `${(i % 3) * 50}% ${Math.floor(i / 3) * (100 / 3)}%`;
    return el;
  };
})();
