/* ============================================================
   STARK & GRAY — interaction layer
   Smooth scroll (Lenis), nav state, reveals, marquee, form
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasLenis = typeof window.Lenis === 'function';

  /* ---------- 1. Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (hasLenis && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      anchors: false
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    document.documentElement.classList.add('lenis');
  }

  /* ---------- 2. Anchor navigation (works with or without Lenis) ---------- */
  var NAV_OFFSET = 68;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) {
        lenis.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.3 });
      } else {
        var y = target.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET;
        window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    });
  });

  /* ---------- 3. Nav scroll state ---------- */
  var nav = document.querySelector('.topnav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 12) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 4. Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.mobilemenu');
  function closeMenu() {
    if (!burger || !menu) return;
    burger.classList.remove('is-open');
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
  }

  /* ---------- 5. Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* stagger groups: children with [data-reveal] inside [data-stagger] */
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseInt(group.getAttribute('data-stagger'), 10) || 80;
    group.querySelectorAll('[data-reveal]').forEach(function (el, i) {
      el.style.setProperty('--d', (i * step) + 'ms');
    });
  });

  /* ---------- 6. Marquee: duplicate content for seamless loop ---------- */
  document.querySelectorAll('.marquee__track').forEach(function (track) {
    if (track.dataset.cloned) return;
    track.innerHTML += track.innerHTML;
    track.dataset.cloned = 'true';
  });

  /* ---------- 7. Rotating headline word ---------- */
  var rot = document.querySelector('.rot');
  if (rot && rot.dataset.words && !prefersReduced) {
    var words = rot.dataset.words.split(',').map(function (w) { return w.trim(); }).filter(Boolean);
    var interval = parseInt(rot.dataset.interval, 10) || 2600;
    var idx = 0;
    if (words.length > 1) {
      setInterval(function () {
        rot.classList.add('is-swap');
        window.setTimeout(function () {
          idx = (idx + 1) % words.length;
          rot.textContent = words[idx];
          rot.classList.remove('is-swap');
        }, 400);
      }, interval);
    }
  }

  /* ---------- 8. Scroll-spy: active nav link ---------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.navlinks a[href^="#"]'));
  var spy = [];
  spyLinks.forEach(function (a) {
    var target = document.querySelector(a.getAttribute('href'));
    if (target) spy.push({ a: a, s: target });
  });
  function runSpy() {
    if (!spy.length) return;
    var pos = window.scrollY + NAV_OFFSET + 80;
    var current = null;
    spy.forEach(function (t) { if (t.s.offsetTop <= pos) current = t.a; });
    spy.forEach(function (t) { t.a.classList.toggle('is-active', t.a === current); });
  }
  window.addEventListener('scroll', runSpy, { passive: true });
  runSpy();

  /* ---------- 9. Audit form → mailto (works on any static host) ---------- */
  var form = document.querySelector('.form');
  if (form) {
    var status = form.querySelector('.form__status');
    var val = function (sel) { var el = form.querySelector(sel); return el ? el.value.trim() : ''; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var name = val('#name');
      var email = val('#email');
      var business = val('#business');
      var leak = val('#leak');

      var subject = 'Automation audit request' + (business ? ' \u2014 ' + business : '');
      var body =
        'Name: ' + name + '\n' +
        'Business: ' + business + '\n' +
        'Email: ' + email + '\n\n' +
        'Where leads are leaking:\n' + leak + '\n';

      var mailto = 'mailto:hello@starkandgray.com' +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      window.location.href = mailto;

      if (status) {
        status.textContent = 'Opening your mail client' + (name ? ', ' + name.split(' ')[0] : '') +
          ' \u2014 your request is addressed to hello@starkandgray.com.';
        status.classList.add('is-visible');
      }
      form.reset();
    });
  }

  /* ---------- 8. Footer year ---------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
