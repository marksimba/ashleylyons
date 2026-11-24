/* Twelve Years, Twelve Doors: flow, room data, memory cards, final jigsaw.
   Static site: the date window and the secret word are client-side and for fun, not security. */
(() => {
  'use strict';
  const { $, h, wait, shake, tone, fanfare, buzz, blip, burst, piece, reduceMotion } = window.SUR;
  const games = window.SUR.games;

  const CODE = 'princess';
  const OPEN_FROM = '2026-11-23';   // inclusive, local date
  const OPEN_TO = '2026-11-28';     // inclusive (RSVP day)
  const STORE_KEY = 'ashAnniv.v1';  // {s: -1 gate | 0 intro | 1-12 rooms | 13 jigsaw | 14 reveal, d: room solved}
  const preview = new URLSearchParams(location.search).has('preview');

  /* ---------------- room data ---------------- */
  const ROOMS = [
    { year: 2014, tag: 'December 13, 2014', title: 'Day One', alt: 'Our wedding day, cutting the cake',
      big: 'We met, and then we got married. Efficient.',
      joke: 'Our first football game together was BYU vs. Texas. Something rustled in a bush, I jumped in front to protect you, and it was a squirrel.',
      song: ['Valentine', 'Martina McBride'],
      hint: 'Type the name of the team BYU played.' },
    { year: 2015, tag: 'Year 1', title: 'Pleasant Springs', alt: 'The two of us outside a temple',
      big: 'Our first apartment of our own, Pleasant Springs, and our first dog, Lulu.',
      joke: 'I gained a lot of weight eating snacks at work.',
      song: ['Love Like Crazy', 'Lee Brice'],
      hint: 'Slide the wheel slowly. Once real words appear, stop. The answer is two words.' },
    { year: 2016, tag: 'Year 2', title: 'The Humming Townhouse', alt: 'The two of us with a newborn',
      big: 'Duane was born, and we moved into the Provo townhouse (2836 was part of the address).',
      joke: 'Duane hummed himself to sleep every night.',
      song: ['Perfect', 'Ed Sheeran'],
      hint: 'Green dots mean a right digit in the right spot. Gold means a right digit in the wrong spot. Use each guess to rule digits out.' },
    { year: 2017, tag: 'Year 3', title: 'Sand in the Camera', alt: 'The two of us dressed up with a temple model behind us',
      big: 'We went to Hawai’i, and we ate at The Roof.',
      joke: 'Duane fell in the sand right when we tried to take the picture.',
      song: ['Something Just Like This', 'The Chainsmokers & Coldplay'],
      hint: 'Do the edges first. Look at the two faces and put them together.' },
    { year: 2018, tag: 'Year 4', title: 'Caught on Camera', alt: 'The two of us with two little boys',
      big: 'Andy was born, and we moved to Santaquin (689 was part of the address).',
      joke: 'We got on TV, and they recorded me saying stuff I did not know they were recording me for.',
      song: ['If You Love Her', 'Forest Blakk'],
      hint: 'Four words, and it is what you say about someone you adore. Vowels first.' },
    { year: 2019, tag: 'Year 5', title: 'The Surprise Trip', alt: 'The two of us at a BYU game with two little boys',
      big: 'I graduated college, we got Paka the cat, and I surprised you with a birthday trip to Disneyland.',
      joke: 'A cap, a cat, and a castle. Not a bad year.',
      song: ['Blessings', 'Florida Georgia Line'],
      hint: 'The eight pairs are a cap, a cat, a castle, a cake, a mouse, a plane, a gift and a crown.' },
    { year: 2020, tag: 'Year 6', title: 'Ute Stampede', alt: 'A cheek-kiss selfie of the two of us',
      big: 'Cody was born. We went to the Ute Stampede and to Maui, and we had kittens twice.',
      joke: 'I do not like a football team with the Ute mascot, but I love the Ute Stampede Rodeo.',
      song: ['Thinking ’Bout You', 'Dustin Lynch'],
      hint: 'Tap right as the gold line enters the green. The zone shrinks and the bar speeds up each hit.' },
    { year: 2021, tag: 'Year 7', title: 'Heads Carolina, Tails California', alt: 'The two of us in matching masks',
      big: 'Brigham was born and we moved to North Carolina. We got in a Dude Perfect video.',
      joke: 'You threw up when we landed in North Carolina.',
      song: ['Heads Carolina, Tails California', 'Jo Dee Messina'],
      hint: 'Short? Add power or angle. Long? Back off. The third shot needs a high arc to clear the barn.' },
    { year: 2022, tag: 'Year 8', title: 'Slippery Tires', alt: 'The two of us in front of a temple',
      big: 'I started working at Disney, and we explored all over North Carolina.',
      joke: 'The tires on the van we borrowed were not great to drive in the snow.',
      song: ['The Rest of Our Life', 'Tim McGraw & Faith Hill'],
      hint: 'You must stop against a tree to turn. Work backward from the castle: what would stop you right next to it?' },
    { year: 2023, tag: 'Year 9', title: 'Please Don’t Get Air', alt: 'The two of us at Mount Rushmore',
      big: 'Kirk was born, and Brigham got stitches this year.',
      joke: 'We accidentally got air in our van on our road trip.',
      song: ['Growing Old With You', 'Restless Road'],
      hint: 'You have plenty of time now. Drive, then let go early. Braking takes a moment, so start slowing well before each ⚠️ and keep your speed under the gold line.' },
    { year: 2024, tag: 'Year 10', title: 'Windy at the Statue', alt: 'The Statue of Liberty with the two of us at its base',
      big: 'Duane was baptized, and we took a trip to New York City.',
      joke: 'It was super duper windy at the Statue of Liberty. And I did not get us public transportation, so you walked around the city while pregnant.',
      song: ['New York City', 'Owl City'],
      hint: 'The words are Liberty, Baptism, Windy, NewYork (one word), Walking and Duane. Some run backward or diagonally.' },
    { year: 2025, tag: 'Year 11', title: 'Light Up the Homestead', alt: 'The two of us smiling in front of a temple',
      big: 'Ephraim was born, the boys won the flag football championship, and we finally got all the land we wanted. Our homestead.',
      joke: 'Six boys, one homestead, zero quiet moments.',
      song: ['Cowboy Take Me Away', 'The Chicks'],
      hint: 'Work from the top row down. To fix a dark light in one row, press the light directly below it.' },
    { year: 2026, tag: 'Year 12', title: 'Check-In, Please', alt: 'A selfie of the two of us',
      big: 'We traveled a ton, and we flew in a helicopter.',
      joke: 'The boys thought staying in a hotel was free.',
      song: ['Faithfully', 'Journey'],
      hint: 'Start with the row, column or box that has the most symbols already filled in.' },
  ];

  /* ---------------- screens + state ---------------- */
  const screens = ['closed', 'gate', 'game', 'jig', 'reveal'];
  const show = (n) => screens.forEach((s) => { $('#screen-' + s).hidden = s !== n; });

  let state = { s: -1, d: false };
  const load = () => {
    try {
      const o = JSON.parse(localStorage.getItem(STORE_KEY));
      if (o && Number.isInteger(o.s) && o.s >= -1 && o.s <= 14) return { s: o.s, d: !!o.d };
    } catch (_) { /* ignore */ }
    return { s: -1, d: false };
  };
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* private mode */ } };
  const today = () => new Date().toLocaleDateString('en-CA');

  /* ---------------- ambient fireflies ---------------- */
  (function ambient() {
    const box = $('#ambient');
    for (let i = 0; i < 20; i++) {
      const f = h('i');
      f.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--dx:${(Math.random() - 0.5) * 140}px;--dy:${(Math.random() - 0.5) * 140}px;--d:${6 + Math.random() * 8}s;--delay:${-Math.random() * 10}s`;
      box.append(f);
    }
  })();

  /* ---------------- gate ---------------- */
  let wrong = 0;
  function initGate() {
    const form = $('#gateForm'), input = $('#codeInput'), msg = $('#gateMsg'), card = $('#gateCard');
    const quips = ['The door giggled. Try again.', 'Nope. Twelve years and that is your guess?', 'So close. (It was not close.)', 'The fireflies are rooting for you.'];
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (input.value.trim().toLowerCase() === CODE) {
        card.classList.add('is-open'); msg.textContent = 'Click. The first door creaks open…'; fanfare();
        await wait(reduceMotion ? 100 : 1100);
        card.classList.remove('is-open');
        state = { s: 0, d: false }; save(); start();
      } else { buzz(); shake(card); msg.textContent = quips[wrong++ % quips.length]; input.select(); }
    });
    $('#gateHint').addEventListener('click', () => { msg.textContent = 'Hint: it’s the password from the first program I ever wrote you.'; });
  }

  /* ---------------- progress strip ---------------- */
  const collected = () => (state.s >= 13 ? 12 : state.s >= 1 ? state.s - 1 + (state.d ? 1 : 0) : 0);
  function paintPieces() {
    const ol = $('#pieces'), n = collected();
    if (!ol.children.length) for (let i = 0; i < 12; i++) ol.append(h('li'));
    [...ol.children].forEach((li, i) => {
      const on = i < n;
      if (on && !li.firstChild) li.append(piece(i));
      if (!on) li.replaceChildren();
      li.classList.toggle('on', on);
    });
    $('#pieceCount').textContent = `${n} / 12 pieces`;
  }

  /* ---------------- rooms ---------------- */
  let cleanup = null;
  const box = () => $('#puzzle');

  function renderRoom() {
    if (cleanup) { try { cleanup(); } catch (_) { /* ignore */ } cleanup = null; }
    const r = ROOMS[state.s];
    $('#roomName').textContent = state.s === 0 ? `Bonus Room · ${r.year}` : `Room ${state.s} · ${r.year}`;
    $('#hintText').textContent = '';
    paintPieces();
    box().replaceChildren();
    if (state.d) { showMemory(); return; }
    let once = false;
    const win = () => { if (once) return; once = true; solved(); };
    cleanup = games[state.s](box(), win) || null;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function solved() {
    fanfare(); state.d = true; save(); paintPieces();
    if (cleanup) { try { cleanup(); } catch (_) { /* ignore */ } cleanup = null; }
    showMemory();
  }

  function showMemory() {
    const i = state.s, r = ROOMS[i];
    const last = i === 12;
    $('#hintText').textContent = '';
    box().replaceChildren(h('div', { class: 'memory' },
      h('div', { class: 'photo-frame' }, h('img', { src: `img/${r.year}.jpg`, alt: r.alt })),
      h('p', { class: 'eyebrow' }, `${r.year} · ${r.tag}`),
      h('h2', {}, r.title),
      h('p', {}, r.big),
      h('p', {}, r.joke),
      h('p', { class: 'song' }, `🎵 ${r.song[0]}, ${r.song[1]}`),
      i >= 1
        ? h('div', { class: 'earned' }, h('span', { class: 'piece-wrap', style: 'display:block;width:38px;height:43px;border-radius:5px;overflow:hidden;border:2px solid var(--gold);box-shadow:0 0 16px rgba(233,201,131,.7)' }, piece(i - 1)), h('span', {}, `Puzzle piece ${i} of 12`))
        : h('div', { class: 'earned' }, h('span', {}, '🗝️ Bonus room cleared. The puzzle board is yours.')),
      h('button', { class: 'btn', type: 'button', id: 'nextBtn', onclick: next }, last ? 'Build the invitation →' : 'Next room →')));
    $('#nextBtn').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function next() {
    state = { s: state.s + 1, d: false }; save();
    if (state.s >= 13) startJig(); else renderRoom();
  }

  /* ---------------- final jigsaw ---------------- */
  const COLS = 3, ROWS = 4, TOTAL = 12;
  let board = [], sel = -1, jigDone = false;
  function startJig() {
    show('jig'); paintPieces(); jigDone = false; sel = -1;
    $('#jigStatus').textContent = ''; $('#jigHintText').textContent = '';
    do { board = Array.from({ length: TOTAL }, (_, i) => i).sort(() => Math.random() - 0.5); } while (board.every((v, i) => v === i) || board.filter((v, i) => v === i).length > 2);
    paintJig();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function paintJig() {
    const jig = $('#jig');
    if (jig.children.length !== TOTAL) {
      jig.replaceChildren(...Array.from({ length: TOTAL }, (_, pos) => h('button', { type: 'button', onclick: () => pick(pos) })));
    }
    [...jig.children].forEach((b, pos) => {
      const p = board[pos];
      b.style.backgroundPosition = `${(p % COLS) * 50}% ${Math.floor(p / COLS) * (100 / 3)}%`;
      b.classList.toggle('sel', pos === sel);
      b.classList.toggle('ok', p === pos);
      b.setAttribute('aria-label', `Position ${pos + 1}${p === pos ? ', correct' : ''}`);
    });
    const right = board.filter((p, pos) => p === pos).length;
    $('#jigStatus').textContent = jigDone ? '' : `${right} of 12 in place`;
  }
  async function pick(pos) {
    if (jigDone) return;
    if (sel < 0) { sel = pos; blip(0); paintJig(); return; }
    if (sel === pos) { sel = -1; paintJig(); return; }
    [board[sel], board[pos]] = [board[pos], board[sel]]; sel = -1; blip(3); paintJig();
    if (board.every((p, i) => p === i)) {
      jigDone = true; fanfare(); burst();
      $('#jigStatus').textContent = 'It fits. Look at that…';
      await wait(reduceMotion ? 200 : 1800);
      state = { s: 14, d: false }; save(); startReveal(true);
    }
  }
  /* The invitation is only attached to the page once she reaches the reveal,
     so link previews and scrapers never see it in the page's HTML. */
  function attachInvitation() {
    const img = $('#inviteImg');
    if (img.getAttribute('src')) return;
    img.alt = 'Invitation. You’re invited, Ashley Lyons. December 4, 2026, 7:00 PM. Privette Hill Prom. RSVP by November 28, 2026.';
    img.src = 'img/invitation.jpg';
    const save = $('#saveInvite'); save.href = 'img/invitation.jpg'; save.download = 'Ash-invitation.jpg';
  }
  function startReveal(withConfetti) {
    attachInvitation();
    show('reveal'); paintPieces();
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (withConfetti) { fanfare(); burst(); }
  }

  /* ---------------- boot ---------------- */
  function start() {
    if (state.s === -1) { show('gate'); $('#codeInput').focus({ preventScroll: true }); return; }
    if (state.s >= 14) { startReveal(false); return; }
    if (state.s === 13) { startJig(); return; }
    show('game'); renderRoom();
  }

  function boot() {
    initGate();
    $('#hintBtn').addEventListener('click', () => { const r = ROOMS[state.s]; if (r && !state.d) $('#hintText').textContent = window.SUR.hintNow || r.hint; });
    $('#peekBtn').addEventListener('click', async () => { const j = $('#jig'); j.classList.add('peek'); await wait(1500); j.classList.remove('peek'); });
    $('#jigHint').addEventListener('click', () => { $('#jigHintText').textContent = 'The flower corners belong in the four corners. “You’re Invited” sits across the top, and the date is near the middle.'; });
    $('#againBtn').addEventListener('click', () => { fanfare(); burst(); });

    if (!preview) {
      const t = today();
      if (t < OPEN_FROM || t > OPEN_TO) {
        $('#closedTitle').textContent = t < OPEN_FROM ? 'These doors open soon.' : 'These doors have closed.';
        $('#closedText').textContent = t < OPEN_FROM ? 'Come back on November 23.' : 'RSVP day has passed. The house is quiet now.';
        show('closed'); return;
      }
    }
    state = load(); start();
  }
  boot();
})();
