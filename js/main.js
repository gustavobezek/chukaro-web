/* ============================================================
   CHUKARO — Aplicación principal
   Estado (semilla + localStorage), i18n ES/EN/ZH, render de
   secciones y carrusel, mini reels con play on hover, lightbox,
   C del logo en 3D con menú que sale desde la C, HUD de timecode,
   cortes de navegación, cursor de enfoque y waveform del footer.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'chukaro_site_data_v1';
  var LANG_KEY = 'chukaro_lang';
  var FPS = 24;                 // fps del "reel" de la línea de tiempo
  var REEL_SECONDS = 150;       // duración simulada del reel de la página

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ============================================================
     ESTADO
     ============================================================ */
  var state = loadState();
  var lang = loadLang();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === window.CHUKARO_SEED.version) return parsed;
      }
    } catch (e) { /* localStorage no disponible */ }
    return JSON.parse(JSON.stringify(window.CHUKARO_SEED));
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function loadLang() {
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    if (stored && window.CHUKARO_I18N.strings[stored]) return stored;
    var q = new URLSearchParams(window.location.search).get('lang');
    if (q && window.CHUKARO_I18N.strings[q]) return q;
    var nav = (navigator.language || 'es').toLowerCase();
    if (nav.indexOf('zh') === 0) return 'zh';
    if (nav.indexOf('en') === 0) return 'en';
    return window.CHUKARO_I18N.defaultLang;
  }

  function t(key) { return window.CHUKARO_I18N.t(lang, key); }

  function visibleSections() {
    return state.sections.filter(function (s) { return s.visible; });
  }
  function visibleVideos(section) {
    return (section.videos || []).filter(function (v) { return v.visible !== false; });
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function fmtDuration(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var mm = (h && m < 10 ? '0' : '') + m;
    return (h ? h + ':' : '') + mm + ':' + (s < 10 ? '0' : '') + s;
  }
  function isoDuration(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return 'PT' + (h ? h + 'H' : '') + (m ? m + 'M' : '') + (s ? s + 'S' : '') || 'PT0S';
  }
  function frames(progress) {
    var total = Math.round(REEL_SECONDS * FPS * Math.min(1, Math.max(0, progress)));
    var f = total % FPS, t2 = Math.floor(total / FPS);
    var s = t2 % 60, m = Math.floor(t2 / 60) % 60, h = Math.floor(t2 / 3600);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(h) + ':' + p(m) + ':' + p(s) + ':' + p(f);
  }
  function parseVimeo(input) {
    if (!input) return null;
    input = String(input).trim();
    var m = input.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
    if (m) return m[1];
    if (/^\d{6,12}$/.test(input)) return input;
    return null;
  }
  function vimeoThumb(id) {
    // Placeholder confiable mientras el usuario carga el video en Vimeo
    return 'https://i.vimeocdn.com/video/2214065090-587a0c5e62b4ec75e5850d7755006a3790b3558074736851655d1e9b72ff65c6-d_640';
  }
  function vimeoUrl(id) { return 'https://vimeo.com/' + id; }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ============================================================
     i18n
     ============================================================ */
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh' : lang;
    document.body.setAttribute('data-lang', lang);

    $$('[data-i18n]').forEach(function (node) {
      var key = node.getAttribute('data-i18n');
      var val = t(key);
      if (val && val !== key) node.textContent = val;
    });

    // metadatos SEO
    setMeta('metaDescription', 'content', t('meta.description'));
    setMeta('metaKeywords', 'content', t('meta.keywords'));
    setMeta('ogTitle', 'content', t('meta.ogTitle'));
    setMeta('ogDescription', 'content', t('meta.ogDescription'));
    setMeta('twTitle', 'content', t('meta.ogTitle'));
    setMeta('twDescription', 'content', t('meta.ogDescription'));
    document.title = t('meta.title');

    // idioma activo en botones
    $$('[data-lang-set]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang-set') === lang);
    });

    // URL con ?lang= (hreflang vivo)
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url.toString());
    } catch (e) { /* ignore */ }

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }

    // marquee
    var mq = t('marquee.items') + ' ';
    var repeated = new Array(5).join(mq);
    $('#marqueeA').textContent = repeated;
    $('#marqueeB').textContent = repeated;

    // contacto
    $('#contactMail').textContent = state.settings.email;
    $('#contactMail').href = 'mailto:' + state.settings.email;
    $('#contactLocation').textContent = state.settings.location;
    if (state.settings.instagram) {
      $('#contactIgBlock').hidden = false;
      $('#contactIg').href = state.settings.instagram;
    }
  }
  function setMeta(id, attr, val) {
    var n = document.getElementById(id);
    if (n && val) n.setAttribute(attr, val);
  }

  function setLang(next) {
    if (!window.CHUKARO_I18N.strings[next]) return;
    lang = next;
    applyLang();
    renderAll();
  }

  /* ============================================================
     TARJETAS DE VIDEO (compartidas: carrusel y grillas)
     ============================================================ */
  var CORNERS = '<span class="frame-mark frame-mark--tl"></span>' +
    '<span class="frame-mark frame-mark--tr"></span>' +
    '<span class="frame-mark frame-mark--bl"></span>' +
    '<span class="frame-mark frame-mark--br"></span>';

  function buildCard(video, section, listKey) {
    var card = el('article', 'work-card reveal');
    card.setAttribute('data-cursor', 'play');
    card.setAttribute('data-vid', video.id);
    card.setAttribute('data-list', listKey);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', (t('section.open') || 'Ver') + ': ' + video.title);

    var media = el('div', 'work-media');
    media.innerHTML =
      '<img src="' + esc(video.thumb) + '" alt="' + esc(video.title) + ' — CHUKARO ' + esc(t('section.' + section.id + '.title')) + '" loading="lazy" decoding="async">' +
      CORNERS +
      '<span class="work-play" aria-hidden="true"></span>' +
      '<span class="work-rec" aria-hidden="true">REC</span>' +
      '<span class="work-dur">' + fmtDuration(video.duration) + '</span>';
    card.appendChild(media);

    var info = el('div', 'work-info');
    info.innerHTML =
      '<span class="work-tag">' + esc(t('section.' + section.id + '.title')) + ' · ' + esc(section.num) + '</span>' +
      '<h3 class="work-title">' + esc(video.title) + '</h3>' +
      (video.desc ? '<p class="work-desc">' + esc(video.desc) + '</p>' : '');
    card.appendChild(info);

    attachHoverPlay(card, video);
    card.addEventListener('click', function () { openLightbox(listKey, indexOfInList(listKey, video.id)); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(listKey, indexOfInList(listKey, video.id)); }
    });
    return card;
  }

  /* --- Mini reel: reproduce al pasar el mouse, pausa al salir --- */
  function attachHoverPlay(card, video) {
    if (!canHover) return;
    var media = $('.work-media', card);
    var iframe = null;
    var created = false;

    card.addEventListener('pointerenter', function () {
      if (!created) {
        created = true;
        iframe = document.createElement('iframe');
        iframe.src = 'https://player.vimeo.com/video/' + video.id +
          '?background=1&autoplay=1&loop=1&muted=1&dnt=1&playsinline=1&title=0&byline=0&portrait=0';
        iframe.title = video.title;
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        iframe.setAttribute('loading', 'lazy');
        media.appendChild(iframe);
      } else if (iframe) {
        post(iframe, 'play');
      }
      card.classList.add('playing');
    });

    card.addEventListener('pointerleave', function () {
      card.classList.remove('playing');
      if (iframe) post(iframe, 'pause');
    });
  }
  function post(iframe, method) {
    try { iframe.contentWindow.postMessage(JSON.stringify({ method: method }), '*'); } catch (e) { /* ignore */ }
  }

  /* ============================================================
     LISTAS (para el lightbox)
     ============================================================ */
  var lists = {};
  function indexOfInList(listKey, vid) {
    var l = lists[listKey] || [];
    for (var i = 0; i < l.length; i++) if (String(l[i].id) === String(vid)) return i;
    return 0;
  }

  /* ============================================================
     RENDER: SECCIONES + CARRUSEL + CHUB + SCRUBBER + JSON-LD
     ============================================================ */
  function renderAll() {
    lists = {};
    renderSections();
    renderCarousel();
    renderChubMenu();
    renderScrubMarkers();
    renderLd();
    observeReveals();
    syncUiVisibility();
  }

  function renderSections() {
    var root = $('#sectionsRoot');
    root.innerHTML = '';
    var secs = visibleSections();

    secs.forEach(function (section, idx) {
      var key = 'sec-' + section.id;
      var vids = visibleVideos(section);
      lists[key] = vids;

      var sec = el('section', 'work-section');
      sec.id = key;
      sec.setAttribute('data-section', section.id);
      sec.setAttribute('aria-label', t('section.' + section.id + '.title'));

      var head = el('header', 'section-head');
      head.innerHTML =
        '<div class="section-head-left">' +
          '<span class="section-eyebrow">' + esc(t('section.clip')) + ' ' + esc(section.num || pad(idx + 1)) + '</span>' +
          '<h2 class="section-title wipe glitch" data-text="' + esc(t('section.' + section.id + '.title')) + '">' +
            esc(t('section.' + section.id + '.title')) +
            '<span class="section-count">' + vids.length + ' ' + esc(t('section.worksCount')) + '</span>' +
          '</h2>' +
          '<p class="section-tag">' + esc(t('section.' + section.id + '.tag')) + '</p>' +
        '</div>';
      sec.appendChild(head);

      if (vids.length) {
        var grid = el('div', 'grid');
        vids.forEach(function (v) { grid.appendChild(buildCard(v, section, key)); });
        sec.appendChild(grid);
      } else {
        sec.appendChild(el('div', 'section-empty', esc(t('section.empty'))));
      }

      var foot = el('div', 'section-foot');
      foot.innerHTML = '<a class="ghost-btn" href="' + state.vimeoUser + '" target="_blank" rel="noopener" data-cursor="link">' +
        '<span>' + esc(t('section.viewAll')) + '</span>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 L17 7 M9 7 H17 V15" fill="none" stroke="currentColor" stroke-width="2"/></svg>' +
        '</a>';
      sec.appendChild(foot);

      root.appendChild(sec);
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function featuredList() {
    var out = [];
    visibleSections().forEach(function (section) {
      visibleVideos(section).forEach(function (v) {
        if (v.featured) out.push({ video: v, section: section });
      });
    });
    if (!out.length) {
      visibleSections().forEach(function (section) {
        var v = visibleVideos(section)[0];
        if (v) out.push({ video: v, section: section });
      });
    }
    return out;
  }

  function renderCarousel() {
    var car = $('#carousel');
    car.innerHTML = '';
    var feat = featuredList();
    lists['featured'] = feat.map(function (x) { return x.video; });
    feat.forEach(function (x) {
      car.appendChild(buildCard(x.video, x.section, 'featured'));
    });
    var prog = $('#carProgress');
    if (prog) prog.style.width = feat.length > 3 ? '34%' : '100%';
  }

  /* --- C en 3D: capas de extrusión --- */
  function buildChub() {
    var host = $('#chub3d');
    if (!host) return;
    var LAYERS = 12;
    var frag = document.createDocumentFragment();
    for (var i = LAYERS; i >= 1; i--) {
      var shade = Math.round(6 + (1 - i / LAYERS) * 52);
      var layer = el('div', 'chub-layer');
      layer.style.transform = 'translateZ(' + (-i * 3.2) + 'px)';
      layer.innerHTML = '<svg viewBox="0 0 624 671" aria-hidden="true"><g fill="rgb(' + shade + ',' + shade + ',' + shade + ')">' +
        '<path d="M201 0 H615 C621 0 624 4 624 10 V161 C624 168 621 171 614 171 H160 C154 171 152 173 152 178 V289 C152 296 151 298 146 302 L10 385 C4 389 0 387 0 380 V168 C0 162 2 158 7 154 L192 4 C195 1 198 0 201 0 Z"/>' +
        '<path d="M72 444 H208 L292 508 C295 510 298 510 302 510 H615 C621 510 624 513 624 519 V558 C624 564 622 567 617 571 L492 667 C488 670 486 671 480 671 H72 C65 671 63 667 63 660 V454 C63 447 66 444 72 444 Z"/>' +
        '</g></svg>';
      frag.appendChild(layer);
    }
    var face = el('div', 'chub-face');
    face.innerHTML = '<svg viewBox="0 0 624 671" aria-hidden="true">' +
      '<use class="sym-top" href="#mk-sym-top"/>' +
      '<use class="sym-bottom" href="#mk-sym-bottom"/>' +
      '</svg>';
    frag.appendChild(face);
    host.appendChild(frag);

    // menú de secciones al lado de la C
    var menu = el('div', 'chub-menu');
    menu.id = 'chubMenu';
    var chub = $('#chub');
    chub.appendChild(menu);
  }

  function renderChubMenu() {
    var menu = $('#chubMenu');
    if (!menu) return;
    menu.innerHTML = '';
    var secs = visibleSections();
    secs.forEach(function (section) {
      var vids = visibleVideos(section);
      var chip = el('a', 'chip');
      chip.href = '#sec-' + section.id;
      chip.setAttribute('data-nav', '');
      chip.setAttribute('data-cursor', 'link');
      chip.innerHTML =
        '<span class="chip-num">' + esc(section.num) + '</span>' +
        '<span class="chip-title">' + esc(t('section.' + section.id + '.title')) + '</span>' +
        '<span class="chip-count">' + pad(vids.length) + '</span>' +
        (vids[0] ? '<img class="chip-thumb" src="' + esc(vids[0].thumb) + '" alt="" loading="lazy" aria-hidden="true">' : '');
      menu.appendChild(chip);
    });
    if (!secs.length) {
      var fallback = el('a', 'chip');
      fallback.href = '#trabajos';
      fallback.setAttribute('data-nav', '');
      fallback.innerHTML = '<span class="chip-num">00</span><span class="chip-title">' + esc(t('nav.work')) + '</span>';
      menu.appendChild(fallback);
    }
  }

  function renderScrubMarkers() {
    var wrap = $('#scrubMarkers');
    if (!wrap) return;
    wrap.innerHTML = '';
    var docH = Math.max(1, document.body.scrollHeight - window.innerHeight);
    var targets = [{ id: 'inicio', label: 'Inicio' }]
      .concat(visibleSections().map(function (s) { return { id: 'sec-' + s.id, label: t('section.' + s.id + '.title') }; }))
      .concat(state.ui.estudio ? [{ id: 'estudio', label: t('nav.studio') }] : [])
      .concat(state.ui.contacto ? [{ id: 'contacto', label: t('nav.contact') }] : []);
    targets.forEach(function (tg) {
      var node = document.getElementById(tg.id);
      if (!node) return;
      var top = node.getBoundingClientRect().top + window.scrollY;
      var pos = Math.min(100, Math.max(0, (top / docH) * 100));
      var m = el('button', 'scrub-marker');
      m.style.left = pos + '%';
      m.title = tg.label;
      m.setAttribute('aria-label', 'Ir a ' + tg.label);
      m.addEventListener('click', function () { cutTo(tg.id); });
      wrap.appendChild(m);
    });
  }

  function syncUiVisibility() {
    var est = $('#estudio'), con = $('#contacto'), reelSec = $('#trabajos');
    if (est) est.hidden = !state.ui.estudio;
    if (con) con.hidden = !state.ui.contacto;
    if (reelSec) reelSec.hidden = !state.ui.reel;
  }

  /* --- JSON-LD ampliado para buscadores e IA --- */
  function renderLd() {
    try {
      var items = [];
      var pos = 1;
      visibleSections().forEach(function (section) {
        visibleVideos(section).forEach(function (v) {
          items.push({
            '@type': 'ListItem',
            position: pos++,
            item: {
              '@type': 'VideoObject',
              name: v.title,
              description: v.desc || (v.title + ' — ' + t('section.' + section.id + '.title') + ' · CHUKARO'),
              thumbnailUrl: [v.thumb],
              duration: isoDuration(v.duration),
              uploadDate: '2026-10-19',
              embedUrl: 'https://player.vimeo.com/video/' + v.id,
              url: vimeoUrl(v.id),
              creator: { '@id': 'https://www.chukaro.com/#organization' },
              genre: t('section.' + section.id + '.title')
            }
          });
        });
      });
      var node = document.getElementById('ldVideos');
      if (node) node.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'CHUKARO — Trabajos de postproducción',
        numberOfItems: items.length,
        itemListElement: items
      });
    } catch (e) { /* ignore */ }
  }

  /* ============================================================
     NAV CON CORTE + REVELADOS
     ============================================================ */
  function cutTo(id) {
    var target = document.getElementById(id);
    if (!target) return;
    if (target.closest('[hidden]')) return;
    var cut = $('#cut');
    var docH = Math.max(1, document.body.scrollHeight - window.innerHeight);
    var top = target.getBoundingClientRect().top + window.scrollY;
    $('#cutTc').textContent = frames(top / docH);
    if (window.ChukaroFX) window.ChukaroFX.flash();

    if (reduced) {
      instantScrollTo(top);
      return;
    }
    cut.classList.add('on');
    setTimeout(function () {
      instantScrollTo(top);
      setTimeout(function () { cut.classList.remove('on'); }, 110);
    }, 130);
  }

  function instantScrollTo(top) {
    // salto real (el CSS "scroll-behavior: smooth" no debe frenar el corte)
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, top);
    root.style.scrollBehavior = prev;
  }

  document.addEventListener('click', function (e) {
    var nav = e.target.closest('a[data-nav]');
    if (!nav) return;
    var href = nav.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    e.preventDefault();
    closeChub();
    cutTo(href.slice(1));
  });

  var revealObs = null;
  function observeReveals() {
    if (revealObs) revealObs.disconnect();
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal, .wipe').forEach(function (n) { revealObs.observe(n); });
  }

  /* Nav activa */
  function initActiveNav() {
    var map = [
      { id: 'trabajos', link: '.main-nav a[href="#trabajos"]' },
      { id: 'estudio', link: '.main-nav a[href="#estudio"]' },
      { id: 'contacto', link: '.main-nav a[href="#contacto"]' }
    ];
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var found = map.filter(function (m) { return m.id === en.target.id; })[0];
        if (!found) return;
        var a = $(found.link);
        if (a) a.classList.toggle('active', en.isIntersecting && en.intersectionRatio > 0.12);
      });
    }, { threshold: [0, 0.12, 0.5] });
    map.forEach(function (m) {
      var node = document.getElementById(m.id);
      if (node) obs.observe(node);
    });
  }

  /* ============================================================
     C EN 3D — sigue al mouse y despliega el menú
     ============================================================ */
  var chubState = { rx: 0, ry: 0, trx: 0, try_: 0, open: false, hoverTimer: null };

  function initChub() {
    var chub = $('#chub');
    var host = $('#chub3d');
    if (!chub || !host) return;

    window.addEventListener('mousemove', function (e) {
      var r = chub.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var dx = (e.clientX - cx) / Math.max(200, window.innerWidth * 0.5);
      var dy = (e.clientY - cy) / Math.max(200, window.innerHeight * 0.5);
      chubState.try_ = Math.max(-1, Math.min(1, dx)) * 26;   // rotación Y
      chubState.trx = Math.max(-1, Math.min(1, -dy)) * 20;   // rotación X
    }, { passive: true });

    function tickChub(t) {
      var idleY = reduced ? 0 : Math.sin(t / 1500) * 2.4;
      var idleX = reduced ? 0 : Math.cos(t / 1900) * 1.8;
      chubState.rx += (chubState.trx + idleX - chubState.rx) * 0.07;
      chubState.ry += (chubState.try_ + idleY - chubState.ry) * 0.07;
      host.style.transform = 'rotateX(' + chubState.rx.toFixed(2) + 'deg) rotateY(' + chubState.ry.toFixed(2) + 'deg)';
      requestAnimationFrame(tickChub);
    }
    requestAnimationFrame(tickChub);

    function openChub() {
      chubState.open = true;
      chub.classList.add('open');
      host.setAttribute('aria-expanded', 'true');
    }
    window.closeChub = function () {
      chubState.open = false;
      chub.classList.remove('open');
      host.setAttribute('aria-expanded', 'false');
    };

    chub.addEventListener('pointerenter', function () {
      if (!canHover) return;
      clearTimeout(chubState.hoverTimer);
      chubState.hoverTimer = setTimeout(openChub, 140);
    });
    chub.addEventListener('pointerleave', function () {
      if (!canHover) return;
      clearTimeout(chubState.hoverTimer);
      chubState.hoverTimer = setTimeout(function () { window.closeChub(); }, 260);
    });
    host.addEventListener('click', function () {
      if (chubState.open) window.closeChub(); else openChub();
    });
    host.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (chubState.open) window.closeChub(); else openChub(); }
      if (e.key === 'Escape') window.closeChub();
    });
  }
  function closeChub() { if (window.closeChub) window.closeChub(); }

  /* ============================================================
     CARRUSEL: drag, flechas y progreso
     ============================================================ */
  function initCarousel() {
    var car = $('#carousel');
    var down = false, startX = 0, startScroll = 0, moved = 0;

    car.addEventListener('pointerdown', function (e) {
      down = true; moved = 0;
      startX = e.clientX; startScroll = car.scrollLeft;
      car.classList.add('dragging');
      car.setPointerCapture(e.pointerId);
    });
    car.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      car.scrollLeft = startScroll - dx;
    });
    function up(e) {
      if (!down) return;
      down = false;
      car.classList.remove('dragging');
      try { car.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    car.addEventListener('pointerup', up);
    car.addEventListener('pointercancel', up);

    function step(dir) {
      var card = $('.work-card', car);
      var w = card ? card.getBoundingClientRect().width + 22 : 340;
      car.scrollBy({ left: dir * w, behavior: reduced ? 'auto' : 'smooth' });
    }
    $('#carPrev').addEventListener('click', function () { step(-1); });
    $('#carNext').addEventListener('click', function () { step(1); });

    car.addEventListener('scroll', function () {
      var max = Math.max(1, car.scrollWidth - car.clientWidth);
      var p = car.scrollLeft / max;
      var prog = $('#carProgress');
      if (prog) {
        var w = 20 + p * 80;
        prog.style.width = w + '%';
      }
    }, { passive: true });

    // rueda horizontal
    car.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;
      var max = car.scrollWidth - car.clientWidth;
      var atEdge = (e.deltaY < 0 && car.scrollLeft <= 0) || (e.deltaY > 0 && car.scrollLeft >= max - 1);
      if (atEdge) return; // dejar pasar el scroll vertical en los bordes
      e.preventDefault();
      car.scrollLeft += e.deltaY;
    }, { passive: false });
  }

  /* ============================================================
     LIGHTBOX (estilo sala de edición)
     ============================================================ */
  var lb = { open: false, listKey: null, index: 0 };

  function openLightbox(listKey, index) {
    var list = lists[listKey] || [];
    if (!list.length) return;
    lb.open = true;
    lb.listKey = listKey;
    lb.index = Math.min(list.length - 1, Math.max(0, index || 0));
    paintLightbox();
    var box = $('#lightbox');
    box.classList.add('open');
    box.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    pauseAllHover();
    $('.lb-close').focus();
  }

  function paintLightbox() {
    var list = lists[lb.listKey] || [];
    var video = list[lb.index];
    if (!video) return;
    var section = findSectionOfVideo(video);
    $('#lbSection').textContent = section ? t('section.' + section.id + '.title') : 'CHUKARO';
    $('#lbTitle').textContent = video.title;
    $('#lbDesc').textContent = video.desc || '';
    $('#lbDuration').textContent = fmtDuration(video.duration);
    $('#lbVimeoLink').href = vimeoUrl(video.id);
    var player = $('#lbPlayer');
    player.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.src = 'https://player.vimeo.com/video/' + video.id +
      '?autoplay=1&dnt=1&playsinline=1&title=0&byline=0&portrait=0&color=ffffff';
    iframe.title = video.title;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    player.appendChild(iframe);
    var multi = list.length > 1;
    $('#lbPrev').style.display = multi ? '' : 'none';
    $('#lbNext').style.display = multi ? '' : 'none';
  }

  function findSectionOfVideo(video) {
    var found = null;
    state.sections.forEach(function (s) {
      (s.videos || []).forEach(function (v) { if (v.id === video.id) found = s; });
    });
    return found;
  }

  function closeLightbox() {
    if (!lb.open) return;
    lb.open = false;
    var box = $('#lightbox');
    box.classList.remove('open');
    box.setAttribute('aria-hidden', 'true');
    $('#lbPlayer').innerHTML = ''; // detiene el video
    document.body.classList.remove('no-scroll');
  }

  function stepLightbox(dir) {
    var list = lists[lb.listKey] || [];
    if (!list.length) return;
    lb.index = (lb.index + dir + list.length) % list.length;
    paintLightbox();
  }

  function initLightbox() {
    $$('[data-lb-close]').forEach(function (n) { n.addEventListener('click', closeLightbox); });
    $('#lbPrev').addEventListener('click', function () { stepLightbox(-1); });
    $('#lbNext').addEventListener('click', function () { stepLightbox(1); });
    document.addEventListener('keydown', function (e) {
      if (!lb.open) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
    // swipe táctil
    var sx = 0;
    var frame = $('.lb-frame');
    frame.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    frame.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 70) stepLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function pauseAllHover() {
    $$('.work-card.playing').forEach(function (c) {
      c.classList.remove('playing');
      var f = $('iframe', c);
      if (f) post(f, 'pause');
    });
  }

  /* ============================================================
     HUD: TIMECODE, SCRUBBER, HEADER, MARQUEE, WAVEFORM
     ============================================================ */
  var hud = { lastY: window.scrollY, vel: 0, mqX: 0 };

  function initHud() {
    var marquee = $('#marqueeTrack');
    var scrubFill = $('#scrubFill');
    var scrubHead = $('#scrubHead');
    var scrubTc = $('#scrubTc');
    var footerTc = $('#footerTc');
    var header = $('#siteHeader');
    var wave = $('#waveform');
    var wctx = wave ? wave.getContext('2d') : null;
    var BARS = 96;
    var phases = [];
    for (var i = 0; i < BARS; i++) phases.push(Math.random() * Math.PI * 2);

    function resizeWave() {
      if (!wave) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      wave.width = Math.floor(wave.clientWidth * dpr);
      wave.height = Math.floor(wave.clientHeight * dpr);
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', function () { resizeWave(); renderScrubMarkers(); }, { passive: true });

    var last = performance.now();
    function tick(now) {
      var dt = Math.min(64, now - last) / 1000;
      last = now;

      var y = window.scrollY || 0;
      var vel = (y - hud.lastY) / Math.max(0.0001, dt); // px/s
      hud.lastY = y;
      hud.vel += (vel - hud.vel) * 0.12;

      var docH = Math.max(1, document.body.scrollHeight - window.innerHeight);
      var prog = Math.min(1, Math.max(0, y / docH));

      // header
      header.classList.toggle('scrolled', y > 40);

      // scrubber
      if (scrubFill) scrubFill.style.width = (prog * 100).toFixed(2) + '%';
      if (scrubHead) scrubHead.style.left = (prog * 100).toFixed(2) + '%';
      var tc = frames(prog);
      if (scrubTc) scrubTc.textContent = 'TC ' + tc;
      if (footerTc) footerTc.textContent = 'TC ' + tc;

      // marquee: se mueve solo y acelera con el scroll (efecto scrub)
      if (marquee && !reduced) {
        var base = 46;
        var boost = Math.min(560, Math.abs(hud.vel) * 0.55);
        hud.mqX -= (base + boost) * dt;
        var half = marquee.scrollWidth / 2;
        if (half > 0 && -hud.mqX >= half) hud.mqX += half;
        marquee.style.transform = 'translate3d(' + hud.mqX.toFixed(2) + 'px,0,0)';
      }

      // waveform del footer
      if (wctx && wave.clientWidth) {
        var w = wave.clientWidth, h = wave.clientHeight;
        wctx.clearRect(0, 0, w, h);
        var bw = w / BARS;
        var energy = Math.min(1, Math.abs(hud.vel) / 900);
        wctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (var b = 0; b < BARS; b++) {
          phases[b] += dt * (1.2 + energy * 5);
          var amp = (0.16 + 0.84 * Math.abs(Math.sin(phases[b]) * Math.sin(phases[b] * 0.37)));
          var bh = Math.max(1.5, amp * (h * 0.42) * (0.35 + energy * 0.9));
          wctx.fillRect(b * bw + 1, (h - bh) / 2, Math.max(1, bw - 2.4), bh);
        }
      }

      requestAnimationFrame(tick);
    }
    resizeWave();
    requestAnimationFrame(tick);
  }

  /* ============================================================
     CURSOR DE ENFOQUE
     ============================================================ */
  function initCursor() {
    if (!canHover) return;
    var cur = $('#cursor');
    var label = $('#cursorLabel');
    var x = -100, y = -100, tx = -100, ty = -100;

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cur.classList.add('visible');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cur.classList.remove('visible'); });

    function tick() {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cur.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    document.addEventListener('pointerover', function (e) {
      var play = e.target.closest('[data-cursor="play"], .work-card');
      var link = e.target.closest('[data-cursor="link"], a, button');
      var menu = e.target.closest('[data-cursor="menu"]');
      cur.classList.toggle('is-play', !!play);
      cur.classList.toggle('is-link', !play && (!!link || !!menu));
      label.textContent = play ? t('cursor.play') : '';
    });
  }

  /* ============================================================
     HERO REEL + BOTÓN REEL + LOADER
     ============================================================ */
  function initHero() {
    $('#playReelBtn').addEventListener('click', function () {
      lists['featured'] = lists['featured'] || featuredList().map(function (x) { return x.video; });
      var hero = state.heroVideo;
      var list = lists['featured'];
      var idx = 0;
      for (var i = 0; i < list.length; i++) if (list[i].id === hero.id) idx = i;
      if (!list.length) { window.open(vimeoUrl(hero.id), '_blank', 'noopener'); return; }
      openLightbox('featured', idx);
    });
  }

  function runLoader() {
    var fill = $('#loaderFill');
    var pct = $('#loaderPct');
    var loader = $('#loader');
    var p = 0;
    var started = performance.now();
    var loaded = document.readyState === 'complete';

    window.addEventListener('load', function () { loaded = true; });

    // setInterval en lugar de rAF: el progreso no se congela en
    // pestañas de segundo plano ni en entornos sin composición
    var timer = setInterval(step, 40);
    function step() {
      var now = performance.now();
      var target = loaded ? 100 : 92;
      p += (target - p) * 0.09 + Math.random() * 1.4;
      p = Math.min(target, p);
      fill.style.width = p.toFixed(0) + '%';
      pct.textContent = (p < 10 ? '0' : '') + p.toFixed(0) + '%';

      var enoughTime = now - started > 1150;
      // red de seguridad: recursos de terceros (Vimeo/fuentes) no deben
      // demorar la entrada del sitio más de 4,5 s
      if (now - started > 4500) loaded = true;
      if (p > 99.2 && loaded && enoughTime) {
        clearInterval(timer);
        fill.style.width = '100%';
        pct.textContent = '100%';
        finish();
      }
    }

    function finish() {
      $('#loaderLabel').textContent = t('loader.ready');
      setTimeout(function () {
        loader.classList.add('done');
        document.body.classList.remove('intro');
        document.body.classList.add('loaded');
        // recién ahora cargamos el reel de fondo (evita doble descarga)
        var iframe = $('#heroReel');
        iframe.src = 'https://player.vimeo.com/video/' + state.heroVideo.id +
          '?background=1&autoplay=1&loop=1&muted=1&dnt=1&playsinline=1&title=0&byline=0&portrait=0';
        setTimeout(function () { renderScrubMarkers(); }, 600);
      }, 340);
    }

    document.body.classList.add('intro');
    step();
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    $('#year').textContent = new Date().getFullYear();
    applyLang();
    buildChub();
    renderAll();
    initChub();
    initCarousel();
    initLightbox();
    initHud();
    initCursor();
    initHero();
    initActiveNav();
    runLoader();

    // botones de idioma
    $$('[data-lang-set]').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-set')); });
    });

    // recalcular marcadores cuando el layout cambia (imágenes cargadas)
    window.addEventListener('load', function () { setTimeout(renderScrubMarkers, 400); });
  }

  /* API para admin.js */
  window.CHUKARO_APP = {
    getState: function () { return state; },
    setState: function (next) { state = next; saveState(); },
    save: saveState,
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      state = JSON.parse(JSON.stringify(window.CHUKARO_SEED));
      saveState();
    },
    render: renderAll,
    applyLang: applyLang,
    t: t,
    getLang: function () { return lang; },
    fmtDuration: fmtDuration,
    parseVimeo: parseVimeo,
    vimeoThumb: vimeoThumb,
    el: el,
    esc: esc,
    visibleVideos: visibleVideos,
    toast: function (msg) {
      var n = $('.admin-toast');
      if (!n) {
        n = el('div', 'admin-toast');
        document.body.appendChild(n);
      }
      n.textContent = msg;
      n.classList.add('show');
      clearTimeout(n._timer);
      n._timer = setTimeout(function () { n.classList.remove('show'); }, 1900);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
