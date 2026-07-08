/* =====================================================
   Kravets Legal — interactions
   Plain JS, no dependencies
   ===================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- поточний рік у футері ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- фон хедера при скролі ---------- */
  var header = document.getElementById('siteHeader');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- лінія прогресу скролу сторінки ---------- */
  var scrollBar = document.getElementById('scrollBar');
  function updateScrollBar() {
    if (!scrollBar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    p = p < 0 ? 0 : (p > 1 ? 1 : p);
    scrollBar.style.width = (p * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', updateScrollBar, { passive: true });
  window.addEventListener('resize', updateScrollBar, { passive: true });
  updateScrollBar();

  /* ---------- навігація: десктоп-скрол ↔ мобільний app-режим ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var screenIds = ['hero', 'practice', 'cases', 'advantages', 'reviews', 'contacts'];
  var screenEls = screenIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var spySections = ['practice', 'cases', 'advantages', 'reviews', 'contacts']
    .map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var headerH = 66;
  var appMQ = window.matchMedia('(max-width: 767px)'); /* app-режим лише телефони; планшет = звичайний лендінг */
  var appMode = false;
  var current = 'hero';

  function setNavActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-nav') === id);
    });
  }

  /* мобільний app-режим: показати один екран */
  function showScreen(id) {
    if (screenIds.indexOf(id) === -1) id = 'hero';
    current = id;
    screenEls.forEach(function (el) {
      var on = el.id === id;
      el.classList.toggle('is-screen-active', on);
      if (on) el.scrollTop = 0;
    });
    setNavActive(id);
  }

  /* десктопний scrollspy */
  function spy() {
    if (appMode || !spySections.length) return;
    var y = window.scrollY + headerH + 24;
    var id = '';
    for (var i = 0; i < spySections.length; i++) {
      if (spySections[i].offsetTop <= y) id = spySections[i].id;
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      id = spySections[spySections.length - 1].id;
    }
    setNavActive(id);
  }
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', spy, { passive: true });

  /* кліки по внутрішніх посиланнях (навігація, CTA, бренд, нижній бар) — делегування */
  function handleNavClick(e) {
    var t = e.target;
    var link = (t && t.closest) ? t.closest('a[href^="#"]') : null;
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href === '#') return;
    var id = href.slice(1);
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (appMode) {
      showScreen(id);
    } else {
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  document.addEventListener('click', handleNavClick);

  /* перемикання режимів десктоп/мобільний */
  function applyMode() {
    if (appMQ.matches) {
      appMode = true;
      document.body.classList.add('app');
      // у app-режимі контент показуємо одразу (без reveal-затримок)
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      showScreen(current);
    } else {
      appMode = false;
      document.body.classList.remove('app');
      screenEls.forEach(function (el) { el.classList.remove('is-screen-active'); });
      spy();
    }
  }
  if (appMQ.addEventListener) appMQ.addEventListener('change', applyMode);
  else if (appMQ.addListener) appMQ.addListener(applyMode);

  /* ---------- reveal-анімації при скролі ---------- */
  var revealTargets = document.querySelectorAll(
    '.section-head, .card, .tl-item, .why-item, .about-portrait, .about-body, .map-card, .contacts-form'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  // легкий стагер для карток усередині сітки
  document.querySelectorAll('.cards').forEach(function (grid) {
    Array.prototype.forEach.call(grid.children, function (card, i) {
      card.style.transitionDelay = (Math.min(i, 4) * 55) + 'ms';
    });
  });

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- vCard: «Додати контакт» ---------- */
  var addBtn = document.getElementById('addContact');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var vcf = [
        'BEGIN:VCARD', 'VERSION:3.0',
        'N:Кравець;Ярослав;;;',
        'FN:Ярослав Кравець',
        'TITLE:Адвокат',
        'ORG:Kravets Legal',
        'TEL;TYPE=CELL:+380442200110',
        'EMAIL:office@kravets-legal.ua',
        'URL:https://t.me/kravets_legal',
        'ADR;TYPE=WORK:;;вул. Володимирська 00;Київ;;;Україна',
        'NOTE:Адвокат для бізнесу в Києві. Податкові спори, кримінальний захист бізнесу, стягнення, субсидіарна відповідальність.',
        'END:VCARD'
      ].join('\r\n');
      var blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Yaroslav_Kravets.vcf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);

      // короткий візуальний відгук
      var original = addBtn.innerHTML;
      addBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-shield"/></svg> Контакт збережено';
      setTimeout(function () { addBtn.innerHTML = original; }, 1800);
    });
  }

  /* ---------- обробка форми без бекенду ---------- */
  var form = document.getElementById('leadForm');
  var success = document.getElementById('formSuccess');
  var resetBtn = document.getElementById('formReset');

  if (form) {
    // прибирати підсвітку помилки під час введення
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('invalid'); });
      el.addEventListener('change', function () { el.classList.remove('invalid'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = form.querySelectorAll('[required]');
      var ok = true;
      var firstBad = null;
      required.forEach(function (el) {
        var empty = !String(el.value).trim();
        el.classList.toggle('invalid', empty);
        if (empty && ok) { ok = false; firstBad = el; }
      });
      if (!ok) {
        if (firstBad && firstBad.focus) firstBad.focus();
        return;
      }
      // «надсилання» (демо): ховаємо форму, показуємо подяку
      form.setAttribute('hidden', '');
      if (success) {
        success.removeAttribute('hidden');
        success.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (success) success.setAttribute('hidden', '');
      if (form) {
        form.reset();
        form.removeAttribute('hidden');
        form.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
      }
    });
  }

  /* ---------- «Ситуації»: лінія таймлайну заповнюється при скролі ---------- */
  var tl = document.getElementById('casesTimeline');
  var tlFill = document.getElementById('tlFill');
  if (tl && tlFill) {
    var updateTl = function () {
      var r = tl.getBoundingClientRect();
      var anchor = window.innerHeight * 0.55;
      var p = (anchor - r.top) / (r.height || 1);
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      tlFill.style.height = (p * 100) + '%';
    };
    window.addEventListener('scroll', updateTl, { passive: true });
    window.addEventListener('resize', updateTl, { passive: true });
    // у мобільному app-режимі секція скролиться всередині себе
    var casesSec = document.getElementById('cases');
    if (casesSec) casesSec.addEventListener('scroll', updateTl, { passive: true });
    updateTl();
  }

  /* ---------- count-up для цифр довіри ---------- */
  (function () {
    var nums = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!nums.length) return;
    if (prefersReduced) { return; } // лишаємо фінальні значення з розмітки
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1100, t0 = null;
      var frame = function (ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(frame); else el.textContent = target + suffix;
      };
      requestAnimationFrame(frame);
    };
    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io2.unobserve(e.target); } });
      }, { threshold: 0.5 });
      nums.forEach(function (el) { io2.observe(el); });
    } else {
      nums.forEach(run);
    }
  })();

  /* ---------- відгуки: fade-слайдер (без горизонтального скролу) ---------- */
  var slider = document.getElementById('revSlider');
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.review'));
    var dotsWrap = document.getElementById('revDots');
    var idx = 0, timer = null;

    var dots = slides.map(function (_, i) {
      var d = document.createElement('button');
      d.className = 'slider-dot';
      d.type = 'button';
      d.setAttribute('aria-label', 'Відгук ' + (i + 1));
      d.addEventListener('click', function () { go(i, true); });
      if (dotsWrap) dotsWrap.appendChild(d);
      return d;
    });

    function go(n, manual) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
      if (manual) stop();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { if (prefersReduced) return; stop(); timer = setInterval(function () { go(idx + 1); }, 5500); }

    var prev = document.getElementById('revPrev');
    var next = document.getElementById('revNext');
    if (prev) prev.addEventListener('click', function () { go(idx - 1, true); });
    if (next) next.addEventListener('click', function () { go(idx + 1, true); });
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);

    go(0);
    start();
  }

  /* ---------- старт: визначити режим (десктоп-скрол / мобільний app) ---------- */
  applyMode();
})();
