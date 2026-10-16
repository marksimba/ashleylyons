/* =========================================================
   Ashley Lyons — site interactivity (vanilla JS)
   Progressive enhancement: page works without this file.
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Dynamic year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header + mobile nav ---------- */
  const header = $("#siteHeader");
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");

  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && navMenu) {
    const closeMenu = () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    };
    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("a", navMenu).forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Hero parallax ---------- */
  if (!prefersReduced) {
    const back = $(".hero__hills--back");
    const mid = $(".hero__hills--mid");
    const sun = $(".hero__sun");
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            if (back) back.style.transform = `translateY(${y * 0.15}px)`;
            if (mid) mid.style.transform = `translateY(${y * 0.08}px)`;
            if (sun) sun.style.transform = `translate(-50%, calc(-50% + ${y * 0.25}px))`;
          }
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* =======================================================
     DATA
     (Tour / gallery / store removed — brand-new artist.)
     ======================================================= */


  /* =======================================================
     UPCOMING SINGLE — countdown + 30s preview
     Edit RELEASE_DATE and the preview melody below.
     ======================================================= */
  const upcoming = $("#upcoming");
  if (upcoming) {
    // ---- Release date ----
    // Midnight (00:00) local to each viewer on October 17, 2026.
    // Note: month is 0-indexed, so 9 = October. No time args = local midnight.
    const RELEASE_DATE = new Date(2026, 9, 17, 0, 0, 0);

    const dateEl = $("#releaseDate");
    const cdDays = $("#cdDays"), cdHours = $("#cdHours"), cdMins = $("#cdMins"), cdSecs = $("#cdSecs");

    if (dateEl) {
      dateEl.textContent =
        "Releases " +
        RELEASE_DATE.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }

    const pad = (n) => String(n).padStart(2, "0");
    let cdTimer = null;
    let released = false;

    // Preview override: /release path or ?preview=released forces the released
    // view so the artist can see it before the real release date.
    const params = new URLSearchParams(location.search);
    const forcePreview =
      params.get("preview") === "released" ||
      /\/release\/?$/.test(location.pathname);

    const streamLinks = $("#streamLinks");

    const setReleased = (isPreview) => {
      if (released) return;
      released = true;
      upcoming.classList.add("is-released");

      const badge = $(".upcoming__badge", upcoming);
      if (badge) badge.textContent = isPreview ? "Preview · Out Now" : "Out Now";

      const eyebrow = $(".upcoming__eyebrow", upcoming);
      if (eyebrow) eyebrow.textContent = "Debut Single · Out Now";
      const sub = $(".upcoming__sub", upcoming);
      if (sub) sub.textContent = "Available now on all streaming platforms.";

      if (dateEl) dateEl.textContent = isPreview
        ? "Preview mode — this is how the page will look on release day."
        : "";

      if (streamLinks) streamLinks.hidden = false;

      // Hero pill → "Out Now"
      const heroPill = document.querySelector(".hero__eyebrow");
      if (heroPill) {
        heroPill.innerHTML = 'Debut Single · <span class="hero__eyebrow-cue">Out now · Listen &darr;</span>';
        heroPill.setAttribute("aria-label", "Debut single out now — listen");
      }

      if (cdTimer) clearInterval(cdTimer);

      // Celebrate! (one-time confetti burst)
      if (!prefersReduced) celebrate();
    };

    const celebrate = () => {
      const colors = ["#d9a441", "#e9c983", "#6e1f2e", "#a84a5c", "#f4efe6"];
      const count = 90;
      for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "confetti-piece";
        p.style.left = Math.random() * 100 + "vw";
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.opacity = "1";
        if (Math.random() > 0.5) p.style.borderRadius = "50%";
        const dur = 2.5 + Math.random() * 2;
        const delay = Math.random() * 0.6;
        p.style.animation = `confettiFall ${dur}s linear ${delay}s forwards`;
        p.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), (dur + delay) * 1000 + 100);
      }
    };

    const renderCountdown = () => {
      const diff = RELEASE_DATE - new Date();
      if (diff <= 0) {
        setReleased(false);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (cdDays) cdDays.textContent = pad(d);
      if (cdHours) cdHours.textContent = pad(h);
      if (cdMins) cdMins.textContent = pad(m);
      if (cdSecs) cdSecs.textContent = pad(s);
    };

    if (forcePreview) {
      setReleased(true);
    } else {
      renderCountdown();
      cdTimer = setInterval(renderCountdown, 1000);
    }

    // ---- 30-second preview (real audio clip) ----
    // Clip: assets/preview.mp3 (30s from 0:39 of the full mix, with fades).
    const previewBtn = $("#previewBtn");
    const previewIcon = $("#previewIcon");
    const previewLabel = $("#previewLabel");
    const previewFill = $("#previewFill");
    const previewAudio = $("#previewAudio");

    if (previewBtn && previewAudio) {
      const setPlayingUI = (on) => {
        previewBtn.classList.toggle("is-playing", on);
        if (previewIcon) previewIcon.innerHTML = on ? "&#9208;" : "&#9654;"; // pause / play
        if (previewLabel) previewLabel.textContent = on ? "Pause preview" : "Play preview";
      };

      previewBtn.addEventListener("click", () => {
        if (previewAudio.paused) previewAudio.play();
        else previewAudio.pause();
      });

      previewAudio.addEventListener("play", () => setPlayingUI(true));
      previewAudio.addEventListener("pause", () => setPlayingUI(false));
      previewAudio.addEventListener("timeupdate", () => {
        if (previewFill && previewAudio.duration) {
          previewFill.style.width = (previewAudio.currentTime / previewAudio.duration) * 100 + "%";
        }
      });
      previewAudio.addEventListener("ended", () => {
        setPlayingUI(false);
        if (previewFill) previewFill.style.width = "0%";
        previewAudio.currentTime = 0;
      });
      previewAudio.addEventListener("error", () => {
        if (previewLabel) previewLabel.textContent = "Preview unavailable";
        previewBtn.disabled = true;
      });
    }
  }

  /* =======================================================
     NEWSLETTER (removed)
     ======================================================= */
})();
