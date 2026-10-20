/* ============================================================
   CHUKARO — Panel de administración
   - Ocultar / mostrar secciones del sitio (VFX, Motion, Edición, IA…)
   - Ocultar / mostrar bloques generales (carrusel, estudio, contacto)
   - Agregar, editar, reordenar y borrar videos con descripciones
   - Exportar / importar JSON y restaurar la semilla original
   Los cambios viven en localStorage (ver main.js).
   ============================================================ */
(function () {
  'use strict';

  var APP = window.CHUKARO_APP;
  if (!APP) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var t = APP.t, el = APP.el, esc = APP.esc;

  var panel = $('#adminPanel');
  var toggle = $('#adminToggle');
  var body = $('#adminBody');
  var open = false;
  var activeTab = null;   // id de sección activa en el gestor de videos
  var editing = null;     // {sectionId, videoId} | null (alta nueva)
  var dirtyForm = false;

  /* ---------------- abrir / cerrar ---------------- */
  function setOpen(next) {
    open = next;
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { render(); }
  }
  toggle.addEventListener('click', function () { setOpen(!open); });
  $('#adminClose').addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setOpen(false);
  });

  /* ---------------- utilidades ---------------- */
  function state() { return APP.getState(); }
  function findSection(id) {
    var out = null;
    state().sections.forEach(function (s) { if (s.id === id) out = s; });
    return out;
  }
  function findVideo(section, vid) {
    var out = null;
    (section.videos || []).forEach(function (v) { if (String(v.id) === String(vid)) out = v; });
    return out;
  }
  function commit(message) {
    APP.save();
    APP.render();
    render();
    if (message) APP.toast(message);
  }

  /* ---------------- render del panel ---------------- */
  function render() {
    var s = state();
    body.innerHTML = '';

    if (!activeTab || !findSection(activeTab)) {
      activeTab = s.sections.length ? s.sections[0].id : null;
    }

    body.appendChild(secBlock(t('admin.sections'), t('admin.sectionsHint'), renderSectionToggles()));
    body.appendChild(secBlock(t('admin.ui'), null, renderUiToggles()));
    body.appendChild(secBlock(t('admin.videos'), null, renderVideoManager()));
    body.appendChild(secBlock(t('admin.data'), null, renderDataTools()));
    body.appendChild(note(t('admin.storageNote')));
  }

  function secBlock(title, hint, content) {
    var b = el('div', 'admin-sec');
    b.appendChild(el('h3', 'admin-sec-title', esc(title)));
    if (hint) b.appendChild(el('p', 'admin-hint', esc(hint)));
    b.appendChild(content);
    return b;
  }
  function note(txt) {
    var n = el('p', 'admin-note', esc(txt));
    n.style.borderBottom = '0';
    return n;
  }

  /* --- visibilidad de secciones --- */
  function renderSectionToggles() {
    var wrap = el('div');
    state().sections.forEach(function (section) {
      var row = el('div', 'admin-row' + (section.visible ? '' : ' off'));
      row.innerHTML =
        '<div class="admin-row-name">' + esc(APP.t('section.' + section.id + '.title')) +
        '<small>' + esc(section.id.toUpperCase()) + ' · ' + APP.visibleVideos(section).length + ' ' + esc(t('section.worksCount')) + '</small></div>';
      row.appendChild(makeSwitch(section.visible, function (on) {
        section.visible = on;
        commit(APP.t('admin.saved'));
      }));
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* --- bloques generales --- */
  function renderUiToggles() {
    var s = state();
    var wrap = el('div');
    [
      { key: 'reel', label: t('admin.uiReel') },
      { key: 'estudio', label: t('admin.uiStudio') },
      { key: 'contacto', label: t('admin.uiContact') }
    ].forEach(function (item) {
      var row = el('div', 'admin-row' + (s.ui[item.key] ? '' : ' off'));
      row.innerHTML = '<div class="admin-row-name">' + esc(item.label) + '</div>';
      row.appendChild(makeSwitch(!!s.ui[item.key], function (on) {
        s.ui[item.key] = on;
        commit(t('admin.saved'));
      }));
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* --- gestor de videos --- */
  function renderVideoManager() {
    var wrap = el('div');
    var s = state();

    // pestañas por sección
    var tabs = el('div', 'admin-tabs');
    s.sections.forEach(function (section) {
      var b = el('button', 'admin-tab' + (section.id === activeTab ? ' active' : ''),
        esc(APP.t('section.' + section.id + '.title')));
      b.addEventListener('click', function () {
        activeTab = section.id;
        editing = null;
        dirtyForm = false;
        render();
      });
      tabs.appendChild(b);
    });
    wrap.appendChild(tabs);

    var section = findSection(activeTab);
    if (!section) return wrap;

    // lista de videos de la sección
    (section.videos || []).forEach(function (video, i) {
      var row = el('div', 'admin-row' + (video.visible === false ? ' off' : ''));
      var img = el('img', 'admin-thumb');
      img.src = video.thumb;
      img.alt = '';
      img.loading = 'lazy';
      row.appendChild(img);

      var name = el('div', 'admin-row-name');
      name.innerHTML = esc(video.title) + '<small>' + esc(APP.fmtDuration(video.duration)) +
        (video.featured ? ' · ★ ' + esc(t('reel.eyebrow')) : '') + '</small>';
      row.appendChild(name);

      row.appendChild(makeSwitch(video.visible !== false, function (on) {
        video.visible = on;
        commit(t('admin.saved'));
      }, video.visible !== false));

      row.appendChild(miniBtn('↑', t('admin.moveUp'), function () {
        if (i > 0) {
          var arr = section.videos;
          var tmp = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = tmp;
          commit(t('admin.saved'));
        }
      }));
      row.appendChild(miniBtn('↓', t('admin.moveDown'), function () {
        var arr = section.videos;
        if (i < arr.length - 1) {
          var tmp = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = tmp;
          commit(t('admin.saved'));
        }
      }));
      row.appendChild(miniBtn('✎', t('admin.editVideo'), function () {
        editing = { sectionId: section.id, videoId: video.id };
        dirtyForm = false;
        render();
        var f = $('.admin-form', body);
        if (f) f.scrollIntoView({ block: 'nearest' });
      }));
      row.appendChild(miniBtn('✕', t('admin.delete'), function () {
        if (confirm(t('admin.deleteConfirm'))) {
          section.videos = section.videos.filter(function (v) { return v !== video; });
          if (editing && editing.videoId === video.id) editing = null;
          commit(t('admin.saved'));
        }
      }, true));

      wrap.appendChild(row);
    });

    if (!(section.videos || []).length) {
      wrap.appendChild(note(t('section.empty')));
    }

    wrap.appendChild(renderForm(section));
    return wrap;
  }

  function miniBtn(text, label, onClick, danger) {
    var b = el('button', 'mini-btn' + (danger ? ' danger' : ''), text);
    b.title = label;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', onClick);
    return b;
  }

  function makeSwitch(checked, onChange, initial) {
    var lab = el('label', 'switch');
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!checked;
    lab.appendChild(input);
    lab.appendChild(el('span', 'switch-track'));
    input.addEventListener('change', function () { onChange(input.checked); });
    return lab;
  }

  /* --- formulario agregar / editar video --- */
  function renderForm(section) {
    var editingVideo = editing && editing.sectionId === section.id ? findVideo(section, editing.videoId) : null;

    var form = el('form', 'admin-form');
    form.setAttribute('novalidate', '');

    var titleValue = editingVideo ? editingVideo.title : '';
    var descValue = editingVideo ? (editingVideo.desc || '') : '';
    var urlValue = editingVideo ? ('https://vimeo.com/' + editingVideo.id) : '';
    var featuredValue = editingVideo ? !!editingVideo.featured : false;

    form.innerHTML =
      '<h4 class="admin-sec-title" style="margin:0 0 4px">' +
        esc(editingVideo ? t('admin.editVideo') : t('admin.addVideo')) + ' — ' +
        esc(APP.t('section.' + section.id + '.title')) +
      '</h4>' +
      '<div><label for="fUrl">' + esc(t('admin.fieldUrl')) + '</label>' +
      '<input type="text" id="fUrl" placeholder="https://vimeo.com/123456789" value="' + esc(urlValue) + '" autocomplete="off"></div>' +
      '<div><label for="fTitle">' + esc(t('admin.fieldTitle')) + '</label>' +
      '<input type="text" id="fTitle" placeholder="NIKE — Campaña 2026" value="' + esc(titleValue) + '" autocomplete="off"></div>' +
      '<div><label for="fDesc">' + esc(t('admin.fieldDesc')) + '</label>' +
      '<textarea id="fDesc" placeholder="Edición, composición y etalonaje del spot.">' + esc(descValue) + '</textarea></div>' +
      '<label class="admin-check"><input type="checkbox" id="fFeatured"' + (featuredValue ? ' checked' : '') + '> ' +
        esc(t('admin.fieldFeatured')) + '</label>' +
      '<div class="admin-actions">' +
        '<button type="submit" class="admin-btn primary">' + esc(t('admin.save')) + '</button>' +
        (editingVideo ? '<button type="button" class="admin-btn" id="fCancel">' + esc(t('admin.cancel')) + '</button>' : '') +
      '</div>';

    var cancel = $('#fCancel', form);
    if (cancel) cancel.addEventListener('click', function () { editing = null; render(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = $('#fUrl', form).value.trim();
      var title = $('#fTitle', form).value.trim();
      var desc = $('#fDesc', form).value.trim();
      var featured = $('#fFeatured', form).checked;

      var vid = APP.parseVimeo(url);
      if (!vid || !title) {
        APP.toast(t('admin.emptyVideo'));
        return;
      }

      var targetSection = section;
      // si el video ya existe en otra sección, lo movemos a esta
      state().sections.forEach(function (s2) {
        var found = findVideo(s2, vid);
        if (found && s2 !== targetSection) {
          s2.videos = s2.videos.filter(function (v) { return v !== found; });
          if (editing && editing.videoId === found.id) editing = null;
        }
      });

      var existing = editingVideo || findVideo(targetSection, vid);
      if (existing) {
        existing.id = vid;
        existing.title = title;
        existing.desc = desc;
        existing.featured = featured;
        existing.visible = existing.visible !== false;
      } else {
        targetSection.videos.unshift({
          id: vid,
          title: title,
          duration: 0,
          thumb: APP.vimeoThumb(vid),
          desc: desc,
          featured: featured,
          visible: true
        });
      }
      editing = null;
      commit(t('admin.saved'));
      fetchDuration(vid, targetSection.id);
    });

    return form;
  }

  /* --- duración real vía oEmbed (opcional, silencioso) --- */
  function fetchDuration(vid, sectionId) {
    try {
      fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent('https://vimeo.com/' + vid))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var section = findSection(sectionId);
          if (!section || !data) return;
          var video = findVideo(section, vid);
          if (video && data.duration) {
            video.duration = data.duration;
            if (data.thumbnail_url) video.thumb = data.thumbnail_url;
            APP.save();
            APP.render();
            render();
          }
        })
        .catch(function () { /* sin conexión: queda duration 0 y el usuario lo edita */ });
    } catch (e) { /* ignore */ }
  }

  /* --- datos: exportar / importar / reset --- */
  function renderDataTools() {
    var wrap = el('div');

    var exportBtn = el('button', 'admin-btn', esc(t('admin.export')));
    exportBtn.style.width = '100%';
    exportBtn.style.marginBottom = '10px';
    exportBtn.addEventListener('click', function () {
      var data = JSON.stringify(state(), null, 2);
      var blob = new Blob([data], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'chukaro-site-data.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    });
    wrap.appendChild(exportBtn);

    var file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.style.display = 'none';
    wrap.appendChild(file);

    var importBtn = el('button', 'admin-btn', esc(t('admin.import')));
    importBtn.style.width = '100%';
    importBtn.style.marginBottom = '10px';
    importBtn.addEventListener('click', function () { file.click(); });
    wrap.appendChild(importBtn);

    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          if (!parsed || !Array.isArray(parsed.sections)) throw new Error('formato');
          parsed.version = window.CHUKARO_SEED.version;
          APP.setState(parsed);
          editing = null;
          commit(t('admin.saved'));
        } catch (err) {
          APP.toast(t('admin.invalidUrl'));
        }
      };
      reader.readAsText(f);
      file.value = '';
    });

    var resetBtn = el('button', 'admin-btn', esc(t('admin.reset')));
    resetBtn.style.width = '100%';
    resetBtn.addEventListener('click', function () {
      if (confirm(t('admin.resetConfirm'))) {
        APP.reset();
        editing = null;
        activeTab = null;
        commit(t('admin.saved'));
      }
    });
    wrap.appendChild(resetBtn);

    return wrap;
  }

  // el panel se re-sincroniza si el estado cambia desde la app
  APP.onExternalChange = render;
})();
