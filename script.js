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
  var screenIds = ['hero', 'practice', 'about', 'reviews', 'contacts'];
  var screenEls = screenIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var spySections = screenEls;
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
    var id = spySections[0].id;
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

  /* ---------- розкриття карток: відкрита завжди рівно одна ---------- */
  document.addEventListener('click', function (e) {
    var head = e.target.closest ? e.target.closest('.exp-head') : null;
    if (!head) return;
    var item = head.parentElement;
    var willOpen = !item.classList.contains('is-open');

    document.querySelectorAll('.is-open').forEach(function (el) {
      el.classList.remove('is-open');
      var h = el.querySelector('.exp-head');
      if (h) h.setAttribute('aria-expanded', 'false');
    });

    if (willOpen) {
      item.classList.add('is-open');
      head.setAttribute('aria-expanded', 'true');
    }
  });

  /* ---------- «Подзвонити» → меню вибору застосунку ---------- */
  var callBtn = document.getElementById('callBtn');
  var callMenu = document.getElementById('callMenu');
  if (callBtn && callMenu) {
    var closeCall = function () {
      callMenu.hidden = true;
      callBtn.setAttribute('aria-expanded', 'false');
    };
    var openCall = function () {
      callMenu.hidden = false;
      callBtn.setAttribute('aria-expanded', 'true');
    };

    callBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (callMenu.hidden) openCall(); else closeCall();
    });

    // пункт обрано → системний застосунок відкриється сам, меню ховаємо
    callMenu.addEventListener('click', function (e) {
      if (e.target.closest('.call-item')) closeCall();
    });

    document.addEventListener('click', function (e) {
      if (!callMenu.hidden && !e.target.closest('#callDd')) closeCall();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !callMenu.hidden) { closeCall(); callBtn.focus(); }
    });
  }

  /* ---------- мапа: маршрут до офісу в рідному застосунку ----------
     Початкову точку не вказуємо — застосунок сам підставляє поточне
     місцеположення, тож дозвіл на геолокацію в браузері не потрібен. */
  var mapEmbed = document.getElementById('mapEmbed');
  var mapOpen = document.getElementById('mapOpen');
  if (mapEmbed && mapOpen) {
    var dest = mapEmbed.getAttribute('data-lat') + ',' + mapEmbed.getAttribute('data-lng');
    var ua = navigator.userAgent;
    // iPadOS 13+ прикидається Mac — відрізняємо за наявністю тачскріна
    var isIOS = /iPad|iPhone|iPod/i.test(ua) ||
                (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    // без saddr Apple Maps бере поточне місце; dirflg=d — маршрут авто
    var appleDir = 'https://maps.apple.com/?daddr=' + dest + '&dirflg=d';
    // app link: Android і iOS віддають його застосунку Google Maps, десктоп — вебу
    var googleDir = 'https://www.google.com/maps/dir/?api=1&destination=' + dest +
                    '&travelmode=driving';

    mapOpen.addEventListener('click', function () {
      if (isIOS) window.location.href = appleDir;
      else if (/Android/i.test(ua)) window.location.href = googleDir;
      else window.open(googleDir, '_blank', 'noopener');
    });
  }

  /* ---------- reveal-анімації при скролі ---------- */
  var revealTargets = document.querySelectorAll(
    '.section-head, .card, .tl-item, .portrait-card, .about-body, .contacts-form'
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

  /* ---------- vCard: «Додати в контакти» ---------- */
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

      // короткий візуальний відгук (міняємо лише підпис, іконку не чіпаємо)
      var label = addBtn.querySelector('span');
      if (!label) return;
      var original = label.innerHTML;
      label.textContent = 'Збережено';
      setTimeout(function () { label.innerHTML = original; }, 1800);
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
    var practiceSec = document.getElementById('practice');
    if (practiceSec) practiceSec.addEventListener('scroll', updateTl, { passive: true });
    updateTl();
  }

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
