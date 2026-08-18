/* ============================================================
   Reely Links — Tableau de bord (gestion multi-clients)
   ============================================================ */
(function () {
  'use strict';

  var D = null;
  var TAB = 'links';

  function P() { return (D && D.active) ? D.profiles[D.active] : null; }

  var saveTimer = null;
  function persist() {
    postPreview();
    var prof = P(); if (!prof) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      window.Store.saveProfile(prof).catch(function (err) {
        toast('Sauvegarde impossible : ' + (err && err.message || 'erreur réseau'), true);
      });
    }, 500);
  }

  /* ---------- Utilitaires DOM ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(h) { var d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; }
  function ico(n, s) { return ICONS.svg(n, s || 20); }
  function hostOf(u) { try { return new URL(/^https?:/.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, ''); } catch (e) { return u || ''; } }

  /** Valide puis téléverse une image dans le stockage Supabase, renvoie l'URL publique. */
  function uploadImage(file, prefix) {
    if (!file.type || file.type.indexOf('image/') !== 0) return Promise.reject(new Error('Choisissez un fichier image.'));
    if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('Image trop lourde (5 Mo max).'));
    var prof = P(); if (!prof || !prof.id) return Promise.reject(new Error('Enregistrez d’abord le profil.'));
    return window.Store.uploadFile(prof.id, file, prefix);
  }

  function toast(msg, isError) {
    var host = $('.toast-host') || (function () { var h = el('<div class="toast-host"></div>'); document.body.appendChild(h); return h; })();
    var t = el('<div class="toast">' + ico(isError ? 'close' : 'check', 18) + '<span>' + esc(msg) + '</span></div>');
    if (isError) t.style.background = 'var(--error)';
    host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 250); }, 2400);
  }

  function modal(title, body, footer) {
    var back = el('<div class="modal-back"><div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><h2>' + esc(title) + '</h2>' +
      '<button class="btn-icon" data-close aria-label="Fermer">' + ico('close') + '</button></div>' +
      '<div class="modal-body"></div><div class="modal-foot">' + (footer || '') + '</div></div></div>');
    $('.modal-body', back).innerHTML = body;
    document.body.appendChild(back);
    function close() { back.remove(); document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    back.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', key);
    var f = back.querySelector('input,select,textarea,button:not([data-close])');
    if (f) setTimeout(function () { f.focus(); }, 40);
    return { node: back, close: close };
  }

  function confirmBox(title, text, onYes, danger) {
    var m = modal(title, '<p class="t-body">' + esc(text) + '</p>',
      '<span class="spacer"></span><button class="btn btn-quiet btn-sm" data-close>Annuler</button>' +
      '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + ' btn-sm" data-yes>Confirmer</button>');
    $('[data-yes]', m.node).onclick = function () { m.close(); onYes(); };
  }

  /* ---------- Aperçu ---------- */
  function publicUrl() {
    var p = P(); if (!p) return '';
    return location.href.replace(/admin\.html.*$/, '') + 'index.html?u=' + p.slug;
  }
  var previewSlug = null;
  function postPreview() {
    var p = P(); if (!p) return;
    var f = $('#preview'); if (!f) return;
    try { f.contentWindow.postMessage({ type: 'reely-preview-update', profile: p }, '*'); } catch (e) {}
  }
  function refreshPreview() {
    var p = P(); var f = $('#preview');
    if (!p) { if (f) f.removeAttribute('src'); $('#publicUrl').textContent = ''; return; }
    if (previewSlug !== p.slug) {
      previewSlug = p.slug;
      f.src = 'index.html?u=' + encodeURIComponent(p.slug) + '&preview=1';
      f.onload = postPreview;
    } else {
      postPreview();
    }
    $('#publicUrl').textContent = '…/index.html?u=' + p.slug;
  }

  /* ============================================================
     Onglet LIENS
     ============================================================ */
  function tabLinks() {
    var st = window.Store.statsFor(P().id);
    var links = P().links;
    var live = links.filter(function (l) { return l.type !== 'header' && window.Store.isLive(l); }).length;
    var hidden = links.filter(function (l) { return l.type !== 'header' && !window.Store.isLive(l); }).length;
    var ctr = st.views ? Math.round(st.clicks / st.views * 100) : 0;

    var html =
      '<div class="stat-row">' +
        stat('Vues', st.views, 'tous visiteurs confondus') +
        stat('Clics', st.clicks, '') +
        stat('Taux de clic', ctr + '%', '') +
        stat('Liens en ligne', live, hidden ? hidden + ' masqué(s)' : 'tous visibles') +
      '</div>' +
      '<div class="section-head">' +
        '<h2>' + ico('link', 19) + ' Mes liens</h2>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn-quiet btn-sm" id="addHeader">' + ico('heading', 18) + 'Intertitre</button>' +
      '</div>';

    if (!links.length) {
      html += '<div class="empty"><p>Aucun lien pour l’instant.</p><p class="hint" style="margin-top:6px">Cliquez sur « Ajouter un lien » pour commencer.</p></div>';
    } else {
      html += '<div class="rows" id="rows">' + links.map(rowHtml).join('') + '</div>';
    }
    html += '<div class="callout" style="margin-top:20px">' + ico('sparkle', 19) +
      '<span>Glissez les poignées pour réordonner. Un lien <b>mis en avant</b> apparaît en grand en haut de page — n’en gardez qu’un seul actif à la fois.</span></div>';
    return html;

    function stat(label, val, sub) {
      return '<div class="stat"><span>' + label + '</span><b>' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
    }
  }

  function rowHtml(l) {
    var st = window.Store.statsFor(P().id);
    if (l.type === 'header') {
      return '<div class="row is-header" data-id="' + esc(l.id) + '" draggable="false">' +
        '<span class="row-handle" draggable="true">' + ico('drag', 18) + '</span>' +
        '<span class="row-ico">' + ico('heading', 20) + '</span>' +
        '<span class="row-body"><span class="row-title">' + esc(l.title) + '<span class="tag-mini">Intertitre</span></span></span>' +
        '<span class="row-actions">' +
          '<button class="btn-icon" data-act="edit" aria-label="Modifier">' + ico('edit', 19) + '</button>' +
          '<button class="btn-icon" data-act="del" aria-label="Supprimer">' + ico('trash', 19) + '</button>' +
        '</span></div>';
    }
    var g = ICONS.guess(l.url);
    var iconName = l.icon || g.icon;
    var brand = l.brand || ICONS.brandColor(iconName) || g.brand;
    var tags = '';
    if (l.featured) tags += '<span class="tag-mini">Mis en avant</span>';
    if (l.badge) tags += '<span class="tag-mini ok">' + esc(l.badge) + '</span>';
    if (l.type === 'embed') tags += '<span class="tag-mini">Intégration</span>';
    var sched = l.schedule || {};
    if (sched.start || sched.end) {
      tags += '<span class="tag-mini ' + (window.Store.isLive(l) ? 'ok' : 'warn') + '">' +
        (window.Store.isLive(l) ? 'Programmé' : 'Hors période') + '</span>';
    }
    var clicks = st.links[l.id] || 0;

    return '<div class="row' + (l.visible ? '' : ' is-hidden') + '" data-id="' + esc(l.id) + '">' +
      '<span class="row-handle" draggable="true" title="Déplacer">' + ico('drag', 18) + '</span>' +
      '<span class="row-ico"' + (brand ? ' style="--brand:' + brand + '"' : '') + '>' +
        (/^https?:\/\//.test(iconName) ? '<img src="' + esc(iconName) + '" alt="">' : ico(iconName, 20)) + '</span>' +
      '<span class="row-body">' +
        '<span class="row-title truncate">' + esc(l.title || 'Sans titre') + tags + '</span>' +
        '<span class="row-url truncate">' + esc(hostOf(l.url)) + '</span>' +
      '</span>' +
      '<span class="row-actions">' +
        '<span class="row-clicks">' + ico('chart', 13) + clicks + '</span>' +
        '<label class="switch" title="Afficher / masquer"><input type="checkbox" data-act="vis"' + (l.visible ? ' checked' : '') + '><span></span></label>' +
        '<button class="btn-icon" data-act="edit" aria-label="Modifier">' + ico('edit', 19) + '</button>' +
        '<button class="btn-icon" data-act="del" aria-label="Supprimer">' + ico('trash', 19) + '</button>' +
      '</span></div>';
  }

  /* ---------- Édition d'un lien ---------- */
  function editLink(id) {
    var isNew = !id;
    var l = isNew
      ? { id: window.Store.uid('l'), type: 'link', title: '', subtitle: '', url: '', icon: '', brand: null, featured: false, visible: true, badge: '', image: '', showTitle: true, schedule: { start: '', end: '' }, clicks: 0 }
      : JSON.parse(JSON.stringify(P().links.filter(function (x) { return x.id === id; })[0]));

    var body =
      '<div class="stack">' +
        '<div class="field"><label for="f-url">Adresse du lien</label>' +
          '<input class="input" id="f-url" placeholder="https://instagram.com/moncompte" value="' + esc(l.url) + '">' +
          '<span class="hint">Collez l’URL : l’icône et la couleur de marque sont détectées automatiquement.</span></div>' +
        '<div class="field"><label for="f-title">Titre</label>' +
          '<input class="input" id="f-title" placeholder="Réserver un appel" value="' + esc(l.title) + '"></div>' +
        '<div class="field"><label for="f-sub">Sous-titre <span class="hint">(facultatif)</span></label>' +
          '<input class="input" id="f-sub" placeholder="20 min pour cadrer votre projet" value="' + esc(l.subtitle || '') + '"></div>' +
        '<div class="grid2">' +
          '<div class="field"><label for="f-badge">Pastille <span class="hint">(facultatif)</span></label>' +
            '<input class="input" id="f-badge" placeholder="Nouveau · Gratuit · Dernières places" value="' + esc(l.badge || '') + '"></div>' +
          '<div class="field"><label for="f-type">Type</label><select class="select" id="f-type">' +
            '<option value="link"' + (l.type === 'link' ? ' selected' : '') + '>Lien classique</option>' +
            '<option value="embed"' + (l.type === 'embed' ? ' selected' : '') + '>Intégration (YouTube / Spotify)</option>' +
          '</select></div>' +
        '</div>' +
        '<div class="field"><label>Icône</label><div class="icon-grid" id="f-icons"></div></div>' +
        '<div class="field"><label>Photo <span class="hint">(facultatif — remplace la ligne classique par une grande vignette photo, idéal pour un bien immobilier)</span></label>' +
          '<div class="inline" style="align-items:center;flex-wrap:wrap">' +
            '<span id="f-imgPreview" style="width:64px;height:48px;border-radius:10px;overflow:hidden;flex:none;background:var(--surface-container);display:grid;place-items:center;color:var(--tertiary)">' +
              (l.image ? '<img src="' + esc(l.image) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : ico('camera', 20)) +
            '</span>' +
            '<button class="btn btn-ghost btn-sm" type="button" id="f-imgUpload">' + ico('upload', 16) + 'Choisir une photo</button>' +
            '<button class="btn btn-quiet btn-sm" type="button" id="f-imgClear">Retirer</button>' +
            '<input type="file" id="f-imgFile" accept="image/*" hidden>' +
          '</div></div>' +
        '<div class="row-toggle" id="f-showTitleRow"><div><p>Afficher le titre sur la photo</p><small>Superpose le titre et le sous-titre en bas de la photo. Désactivez pour une photo seule.</small></div>' +
          '<label class="switch"><input type="checkbox" id="f-showTitle"' + (l.showTitle !== false ? ' checked' : '') + '><span></span></label></div>' +
        '<div class="grid2">' +
          '<div class="field"><label for="f-start">Publier à partir du</label><input class="input" id="f-start" type="datetime-local" value="' + esc((l.schedule && l.schedule.start) || '') + '"></div>' +
          '<div class="field"><label for="f-end">Retirer le</label><input class="input" id="f-end" type="datetime-local" value="' + esc((l.schedule && l.schedule.end) || '') + '"></div>' +
        '</div>' +
        '<div class="row-toggle"><div><p>Mettre en avant</p><small>Carte colorée pleine largeur, en haut de la liste.</small></div>' +
          '<label class="switch"><input type="checkbox" id="f-feat"' + (l.featured ? ' checked' : '') + '><span></span></label></div>' +
        '<div class="row-toggle"><div><p>Visible</p><small>Décochez pour préparer un lien sans le publier.</small></div>' +
          '<label class="switch"><input type="checkbox" id="f-vis"' + (l.visible ? ' checked' : '') + '><span></span></label></div>' +
      '</div>';

    var m = modal(isNew ? 'Ajouter un lien' : 'Modifier le lien', body,
      '<span class="spacer"></span><button class="btn btn-quiet btn-sm" data-close>Annuler</button>' +
      '<button class="btn btn-primary btn-sm" data-save>' + ico('check', 18) + 'Enregistrer</button>');

    var chosen = l.icon || '';
    var grid = $('#f-icons', m.node);
    function paintIcons() {
      grid.innerHTML = ICONS.names().map(function (n) {
        return '<button type="button" data-i="' + n + '" class="' + (n === chosen ? 'is-on' : '') + '" title="' + n + '">' + ico(n, 19) + '</button>';
      }).join('');
    }
    paintIcons();
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return;
      chosen = b.getAttribute('data-i'); paintIcons();
    });

    $('#f-url', m.node).addEventListener('input', function () {
      if (chosen) return;
      var g = ICONS.guess(this.value);
      chosen = g.icon; paintIcons(); chosen = '';
      grid.querySelector('[data-i="' + g.icon + '"]').classList.add('is-on');
    });

    var imgUpload = $('#f-imgUpload', m.node), imgFile = $('#f-imgFile', m.node), imgClear = $('#f-imgClear', m.node), imgPreview = $('#f-imgPreview', m.node);
    imgUpload.onclick = function () { imgFile.click(); };
    imgFile.onchange = function () {
      var file = imgFile.files[0]; if (!file) return;
      imgUpload.disabled = true; imgUpload.textContent = 'Envoi…';
      uploadImage(file, 'link').then(function (url) {
        l.image = url;
        imgPreview.innerHTML = '<img src="' + esc(url) + '" alt="" style="width:100%;height:100%;object-fit:cover">';
        imgUpload.disabled = false; imgUpload.innerHTML = ico('upload', 16) + 'Choisir une photo';
      }).catch(function (err) {
        imgUpload.disabled = false; imgUpload.innerHTML = ico('upload', 16) + 'Choisir une photo';
        toast(err && err.message || 'Envoi impossible', true);
      });
      imgFile.value = '';
    };
    imgClear.onclick = function () {
      l.image = '';
      imgPreview.innerHTML = ico('camera', 20);
    };

    $('[data-save]', m.node).onclick = function () {
      var url = $('#f-url', m.node).value.trim();
      var title = $('#f-title', m.node).value.trim();
      if (!title) { toast('Le titre est obligatoire', true); $('#f-title', m.node).focus(); return; }
      if (!url) { toast('L’adresse est obligatoire', true); $('#f-url', m.node).focus(); return; }

      l.url = url; l.title = title;
      l.subtitle = $('#f-sub', m.node).value.trim();
      l.badge = $('#f-badge', m.node).value.trim();
      l.type = $('#f-type', m.node).value;
      l.icon = chosen || ICONS.guess(url).icon;
      l.brand = ICONS.brandColor(l.icon);
      l.featured = $('#f-feat', m.node).checked;
      l.visible = $('#f-vis', m.node).checked;
      l.showTitle = $('#f-showTitle', m.node).checked;
      l.schedule = { start: $('#f-start', m.node).value, end: $('#f-end', m.node).value };

      if (l.featured) P().links.forEach(function (x) { if (x.id !== l.id) x.featured = false; });

      if (isNew) {
        if (l.featured) P().links.unshift(l); else P().links.push(l);
      } else {
        var i = P().links.findIndex(function (x) { return x.id === l.id; });
        P().links[i] = l;
      }
      persist(); m.close(); render();
      toast(isNew ? 'Lien ajouté' : 'Lien mis à jour');
    };
  }

  function editHeader(id) {
    var isNew = !id;
    var h = isNew ? { id: window.Store.uid('h'), type: 'header', title: '', visible: true }
                  : P().links.filter(function (x) { return x.id === id; })[0];
    var m = modal(isNew ? 'Ajouter un intertitre' : 'Modifier l’intertitre',
      '<div class="field"><label for="h-title">Texte</label><input class="input" id="h-title" placeholder="Nos services" value="' + esc(h.title) + '"><span class="hint">Sert à regrouper vos liens par thème.</span></div>',
      '<span class="spacer"></span><button class="btn btn-quiet btn-sm" data-close>Annuler</button><button class="btn btn-primary btn-sm" data-save>Enregistrer</button>');
    $('[data-save]', m.node).onclick = function () {
      var v = $('#h-title', m.node).value.trim();
      if (!v) { toast('Le texte est obligatoire', true); return; }
      h.title = v;
      if (isNew) P().links.push(h);
      persist(); m.close(); render(); toast('Intertitre enregistré');
    };
  }

  /* ---------- Glisser-déposer ---------- */
  function wireDnD() {
    var list = $('#rows'); if (!list) return;
    var dragId = null;

    list.addEventListener('dragstart', function (e) {
      var handle = e.target.closest('.row-handle'); if (!handle) { e.preventDefault(); return; }
      var row = handle.closest('.row');
      dragId = row.getAttribute('data-id');
      row.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragId);
    });
    list.addEventListener('dragend', function () {
      dragId = null;
      $$('.row', list).forEach(function (r) { r.classList.remove('is-dragging', 'is-over'); });
    });
    list.addEventListener('dragover', function (e) {
      e.preventDefault();
      var row = e.target.closest('.row'); if (!row || row.getAttribute('data-id') === dragId) return;
      $$('.row', list).forEach(function (r) { r.classList.remove('is-over'); });
      row.classList.add('is-over');
    });
    list.addEventListener('drop', function (e) {
      e.preventDefault();
      var row = e.target.closest('.row'); if (!row || !dragId) return;
      var targetId = row.getAttribute('data-id');
      if (targetId === dragId) return;
      var arr = P().links;
      var from = arr.findIndex(function (x) { return x.id === dragId; });
      var to = arr.findIndex(function (x) { return x.id === targetId; });
      arr.splice(to, 0, arr.splice(from, 1)[0]);
      persist(); render(); toast('Ordre mis à jour');
    });
  }

  /* ============================================================
     Onglet APPARENCE
     ============================================================ */
  function tabDesign() {
    var t = P().theme;
    var presets = Object.keys(window.Store.PRESETS).map(function (k) {
      var p = window.Store.PRESETS[k];
      return '<button class="swatch' + (t.preset === k ? ' is-on' : '') + '" data-preset="' + k + '">' +
        '<i style="background:linear-gradient(135deg,' + p.primary + ',' + (p.primary2 || p.primary) + ')"></i>' +
        '<span>' + p.label + '</span></button>';
    }).join('');

    var socialRows = (P().socials || []).map(function (s, i) {
      return '<div class="inline" data-si="' + i + '" style="margin-bottom:10px">' +
        '<span class="row-ico" style="--brand:' + (ICONS.brandColor(s.platform) || 'var(--primary)') + '">' + ico(s.platform, 20) + '</span>' +
        '<div class="field"><input class="input" data-surl value="' + esc(s.url) + '" placeholder="https://…"></div>' +
        '<button class="btn-icon" data-sdel aria-label="Retirer">' + ico('trash', 18) + '</button></div>';
    }).join('');

    var platforms = ['instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'facebook', 'whatsapp', 'spotify', 'threads', 'pinterest', 'twitch', 'discord', 'telegram', 'snapchat', 'github'];

    return '' +
    '<div class="panel"><h3>Identité</h3><p class="hint">Ce que voient vos visiteurs en haut de page.</p>' +
      '<div class="stack">' +
        '<div class="grid2">' +
          '<div class="field"><label for="d-name">Nom affiché</label><input class="input" id="d-name" value="' + esc(P().name) + '"></div>' +
          '<div class="field"><label for="d-handle">Identifiant</label><input class="input" id="d-handle" value="' + esc(P().handle) + '" placeholder="@moncompte"></div>' +
        '</div>' +
        '<div class="field"><label for="d-bio">Bio</label><textarea class="textarea" id="d-bio" maxlength="200" placeholder="Une phrase qui dit ce que vous faites.">' + esc(P().bio) + '</textarea><span class="hint">200 caractères max.</span></div>' +
        '<div class="field"><label>Photo de profil / logo</label>' +
          '<div class="inline" style="align-items:center;flex-wrap:wrap">' +
            '<span class="avatar-fallback" id="d-avatarPreview" style="width:64px;height:64px;border-radius:50%;overflow:hidden;font-size:20px;flex:none"></span>' +
            '<button class="btn btn-ghost btn-sm" type="button" id="d-avatarUpload">' + ico('upload', 16) + 'Choisir un fichier</button>' +
            '<button class="btn btn-quiet btn-sm" type="button" id="d-avatarClear">Retirer</button>' +
            '<input type="file" id="d-avatarFile" accept="image/*" hidden>' +
          '</div>' +
          '<input class="input" id="d-avatar" value="' + esc(P().avatar) + '" placeholder="ou collez une URL d’image" style="margin-top:10px">' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="field"><label for="d-initials">Initiales de secours</label><input class="input" id="d-initials" maxlength="3" value="' + esc(P().initials) + '"></div>' +
          '<div class="field"><label for="d-tags">Étiquettes</label><input class="input" id="d-tags" value="' + esc((P().tags || []).join(', ')) + '" placeholder="Studio, Vidéo, Paris"><span class="hint">Séparées par des virgules.</span></div>' +
        '</div>' +
        '<div class="row-toggle"><div><p>Badge « vérifié »</p><small>Petite pastille bleue sur la photo.</small></div>' +
          '<label class="switch"><input type="checkbox" id="d-verified"' + (P().verified ? ' checked' : '') + '><span></span></label></div>' +
      '</div></div>' +

    '<div class="panel"><h3>Thème</h3><p class="hint">Une palette par client — chacun garde son identité.</p>' +
      '<div class="swatches" id="presets">' + presets + '</div>' +
      '<div class="grid2" style="margin-top:18px">' +
        '<div class="field"><label for="d-primary">Couleur principale</label><div class="inline"><input type="color" id="d-primary" value="' + esc(t.primary) + '"><input class="input" id="d-primaryHex" value="' + esc(t.primary) + '"></div></div>' +
        '<div class="field"><label for="d-accent">Couleur secondaire</label><div class="inline"><input type="color" id="d-accent" value="' + esc(t.accent) + '"><input class="input" id="d-accentHex" value="' + esc(t.accent) + '"></div></div>' +
      '</div>' +
      '<div class="field" style="margin-top:14px"><label>Style des cartes</label><div class="seg" id="cardStyle">' +
        ['soft:Douces', 'glass:Verre', 'outline:Contour', 'solid:Pleines'].map(function (o) {
          var v = o.split(':');
          return '<button data-v="' + v[0] + '" class="' + (t.card === v[0] ? 'is-on' : '') + '">' + v[1] + '</button>';
        }).join('') + '</div></div>' +
      '<div class="field" style="margin-top:14px"><label>Mode</label><div class="seg" id="modeSeg">' +
        '<button data-v="light" class="' + (t.mode !== 'dark' ? 'is-on' : '') + '">' + ico('sun', 16) + ' Clair</button>' +
        '<button data-v="dark" class="' + (t.mode === 'dark' ? 'is-on' : '') + '">' + ico('moon', 16) + ' Sombre</button>' +
      '</div></div>' +
      '<div class="field" style="margin-top:14px"><label for="d-radius">Arrondi des cartes — <b id="radiusVal">' + t.radius + '</b> px</label>' +
        '<input type="range" id="d-radius" min="0" max="40" value="' + t.radius + '"></div>' +
      '<div class="row-toggle"><div><p>Halos animés en fond</p><small>Ambiance colorée. Désactivez pour un rendu plus sobre.</small></div>' +
        '<label class="switch"><input type="checkbox" id="d-orbs"' + (t.orbs !== false ? ' checked' : '') + '><span></span></label></div>' +
    '</div>' +

    '<div class="panel"><h3>Réseaux sociaux</h3><p class="hint">Affichés en pastilles rondes sous la bio.</p>' +
      '<div id="socialList">' + (socialRows || '<p class="hint">Aucun réseau pour l’instant.</p>') + '</div>' +
      '<div class="inline" style="margin-top:12px">' +
        '<select class="select" id="newPlatform">' + platforms.map(function (p) { return '<option value="' + p + '">' + p + '</option>'; }).join('') + '</select>' +
        '<button class="btn btn-ghost btn-sm" id="addSocial">' + ico('plus', 18) + 'Ajouter</button>' +
      '</div>' +
    '</div>';
  }

  function wireDesign() {
    var t = P().theme;
    function live(id, fn) {
      var n = $('#' + id); if (!n) return;
      var evt = (n.type === 'checkbox' || n.type === 'range' || n.type === 'color' || n.tagName === 'SELECT') ? 'input' : 'input';
      n.addEventListener(evt, function () { fn(n); persist(); });
    }
    live('d-name', function (n) { P().name = n.value; paintPicker(); });
    live('d-handle', function (n) { P().handle = n.value; paintPicker(); });
    live('d-bio', function (n) { P().bio = n.value; });
    live('d-avatar', function (n) { P().avatar = n.value.trim(); paintPicker(); paintAvatarPreview(); });
    live('d-initials', function (n) { P().initials = n.value.toUpperCase(); paintPicker(); paintAvatarPreview(); });
    live('d-tags', function (n) { P().tags = n.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); });
    live('d-verified', function (n) { P().verified = n.checked; });
    live('d-orbs', function (n) { t.orbs = n.checked; });
    live('d-radius', function (n) { t.radius = +n.value; $('#radiusVal').textContent = n.value; });

    function syncColor(colorId, hexId, key) {
      var c = $('#' + colorId), h = $('#' + hexId);
      c.addEventListener('input', function () { h.value = c.value; t[key] = c.value; if (key === 'primary') t.primary2 = c.value; t.preset = 'custom'; persist(); });
      h.addEventListener('change', function () {
        if (!/^#[0-9a-f]{6}$/i.test(h.value)) { h.value = t[key]; return; }
        c.value = h.value; t[key] = h.value; if (key === 'primary') t.primary2 = h.value; t.preset = 'custom'; persist();
      });
    }
    syncColor('d-primary', 'd-primaryHex', 'primary');
    syncColor('d-accent', 'd-accentHex', 'accent');

    var pres = $('#presets');
    if (pres) pres.addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]'); if (!b) return;
      var k = b.getAttribute('data-preset'), p = window.Store.PRESETS[k];
      Object.assign(t, { preset: k, primary: p.primary, primary2: p.primary2, accent: p.accent, bg: p.bg, mode: p.mode || 'light' });
      persist(); render();
    });

    seg('cardStyle', function (v) { t.card = v; });
    seg('modeSeg', function (v) { t.mode = v; });
    function seg(id, fn) {
      var n = $('#' + id); if (!n) return;
      n.addEventListener('click', function (e) {
        var b = e.target.closest('[data-v]'); if (!b) return;
        $$('button', n).forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on'); fn(b.getAttribute('data-v')); persist();
      });
    }

    function paintAvatarPreview() {
      var p = P(); var av = $('#d-avatarPreview'); if (!av) return;
      av.innerHTML = p.avatar ? '<img src="' + esc(p.avatar) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : esc(p.initials || p.name.slice(0, 2).toUpperCase());
    }
    paintAvatarPreview();

    var avUpload = $('#d-avatarUpload'), avFile = $('#d-avatarFile'), avClear = $('#d-avatarClear');
    if (avUpload) avUpload.onclick = function () { avFile.click(); };
    if (avFile) avFile.onchange = function () {
      var file = avFile.files[0]; if (!file) return;
      avUpload.disabled = true; avUpload.textContent = 'Envoi…';
      uploadImage(file, 'avatar').then(function (url) {
        P().avatar = url; $('#d-avatar').value = url;
        paintAvatarPreview(); paintPicker(); persist();
        avUpload.disabled = false; avUpload.innerHTML = ico('upload', 16) + 'Choisir un fichier';
        toast('Photo mise à jour');
      }).catch(function (err) {
        avUpload.disabled = false; avUpload.innerHTML = ico('upload', 16) + 'Choisir un fichier';
        toast(err && err.message || 'Envoi impossible', true);
      });
      avFile.value = '';
    };
    if (avClear) avClear.onclick = function () {
      P().avatar = ''; $('#d-avatar').value = '';
      paintAvatarPreview(); paintPicker(); persist();
    };

    var list = $('#socialList');
    if (list) {
      list.addEventListener('input', function (e) {
        var inp = e.target.closest('[data-surl]'); if (!inp) return;
        P().socials[+inp.closest('[data-si]').getAttribute('data-si')].url = inp.value.trim();
        persist();
      });
      list.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sdel]'); if (!b) return;
        P().socials.splice(+b.closest('[data-si]').getAttribute('data-si'), 1);
        persist(); render();
      });
    }
    var add = $('#addSocial');
    if (add) add.onclick = function () {
      P().socials.push({ platform: $('#newPlatform').value, url: '' });
      persist(); render();
    };
  }

  /* ============================================================
     Onglet STATISTIQUES
     ============================================================ */
  function tabStats() {
    var st = window.Store.statsFor(P().id);
    var links = P().links.filter(function (l) { return l.type !== 'header'; });
    var max = Math.max.apply(null, [1].concat(links.map(function (l) { return st.links[l.id] || 0; })));
    var ctr = st.views ? (st.clicks / st.views * 100).toFixed(1) : '0.0';

    var days = [], today = new Date();
    for (var i = 13; i >= 0; i--) {
      var d = new Date(today); d.setDate(d.getDate() - i);
      var k = d.toISOString().slice(0, 10);
      days.push({ k: k, v: (st.days[k] || {}).clicks || 0 });
    }
    var dmax = Math.max.apply(null, [1].concat(days.map(function (d) { return d.v; })));

    var bars = links.length
      ? links.slice().sort(function (a, b) { return (st.links[b.id] || 0) - (st.links[a.id] || 0); }).map(function (l) {
          var v = st.links[l.id] || 0;
          return '<div class="bar-row"><div><div class="bar-label truncate">' + esc(l.title) + '</div>' +
            '<div class="bar-track"><i class="bar-fill" style="width:' + (v / max * 100) + '%;display:block"></i></div></div>' +
            '<div class="bar-val">' + v + '</div></div>';
        }).join('')
      : '<p class="hint">Aucun lien à mesurer.</p>';

    return '' +
      '<div class="stat-row">' +
        '<div class="stat"><span>Vues</span><b>' + st.views + '</b></div>' +
        '<div class="stat"><span>Clics</span><b>' + st.clicks + '</b></div>' +
        '<div class="stat"><span>Taux de clic</span><b>' + ctr + '%</b></div>' +
        '<div class="stat"><span>Clics / visite</span><b>' + (st.views ? (st.clicks / st.views).toFixed(2) : '0') + '</b></div>' +
      '</div>' +
      '<div class="panel"><h3>Clics sur 14 jours</h3><p class="hint">' + days[0].k + ' → ' + days[13].k + '</p>' +
        '<div class="spark">' + days.map(function (d) {
          return '<i class="' + (d.v === dmax && d.v > 0 ? 'hot' : '') + '" style="height:' + Math.max(3, d.v / dmax * 100) + '%" title="' + d.k + ' — ' + d.v + ' clic(s)"></i>';
        }).join('') + '</div></div>' +
      '<div class="panel"><h3>Répartition par lien</h3><p class="hint">Le lien le plus cliqué mérite la première place.</p>' +
        '<div class="bars">' + bars + '</div></div>' +
      '<div class="panel"><h3>Mesure côté serveur</h3><p class="hint">Ces chiffres sont mesurés côté serveur, tous visiteurs et tous appareils confondus.</p>' +
        '<div class="callout warn">' + ico('trash', 19) + '<span>Remettre les compteurs de ce profil à zéro.' +
        '<br><button class="btn btn-danger btn-sm" id="resetStats" style="margin-top:10px">Réinitialiser</button></span></div></div>';
  }

  function wireStats() {
    var r = $('#resetStats');
    if (r) r.onclick = function () {
      confirmBox('Réinitialiser', 'Les compteurs de vues et de clics de ce profil repartent à zéro.', function () {
        window.Store.resetStats(P().id).then(function () { render(); toast('Compteurs remis à zéro'); })
          .catch(function (err) { toast('Réinitialisation impossible : ' + (err && err.message || ''), true); });
      }, true);
    };
  }

  /* ============================================================
     Onglet CONTACTS (leads du formulaire public)
     ============================================================ */
  var LEADS_SCOPE = '*';
  var TX_LABELS = { achat: 'Achat', vente: 'Vente', location: 'Location' };
  var STATUS_COLS = [
    { key: 'new', label: 'Nouveau' },
    { key: 'contacted', label: 'Contacté' },
    { key: 'qualified', label: 'Qualifié' },
    { key: 'lost', label: 'Perdu' }
  ];

  function tabLeads() {
    var scopePicker = '<div class="field" style="max-width:320px;margin-bottom:18px">' +
      '<label for="leadsScope">Profil</label><select class="select" id="leadsScope">' +
        '<option value="*"' + (LEADS_SCOPE === '*' ? ' selected' : '') + '>Tous les profils</option>' +
        Object.keys(D.profiles).map(function (k) {
          var p = D.profiles[k];
          return '<option value="' + esc(p.id) + '"' + (LEADS_SCOPE === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>';
        }).join('') +
      '</select></div>';

    var leads = window.Store.leadsFor(LEADS_SCOPE);
    if (!leads.length) {
      return scopePicker + '<div class="empty"><p>Aucun message reçu pour l’instant.</p>' +
        '<p class="hint" style="margin-top:6px">Les demandes envoyées via le formulaire de contact de la page publique apparaîtront ici.</p></div>';
    }

    var board = '<div class="kanban" id="kanbanBoard">' + STATUS_COLS.map(function (col) {
      var items = leads.filter(function (l) { return (l.status || 'new') === col.key; });
      return '<div class="kanban-col">' +
        '<div class="kanban-col-head"><b>' + col.label + '</b><span class="kanban-count">' + items.length + '</span></div>' +
        '<div class="kanban-list" data-status="' + col.key + '">' +
          (items.length ? items.map(leadCardHtml).join('') : '<p class="hint" style="padding:10px">Aucun</p>') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';

    return scopePicker + board;
  }

  function leadCardHtml(l) {
    var date = new Date(l.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    var name = [l.first_name, l.last_name].filter(Boolean).join(' ') || l.name || 'Sans nom';
    var meta = [l.email, l.phone].filter(Boolean).join(' · ');
    var tx = l.transaction_type && TX_LABELS[l.transaction_type]
      ? '<span class="tag-mini">' + TX_LABELS[l.transaction_type] + '</span>' : '';
    var client = (LEADS_SCOPE === '*' && l.profiles) ? '<span class="tag-mini">' + esc(l.profiles.name) + '</span>' : '';
    var status = l.status || 'new';
    return '<div class="kanban-card" draggable="true" data-id="' + esc(l.id) + '">' +
      '<div class="kanban-card-top"><b>' + esc(name) + '</b>' + tx + client + '</div>' +
      '<div class="hint">' + esc(meta) + '</div>' +
      '<div class="hint">' + date + '</div>' +
      (l.message ? '<p class="t-body clamp-2" style="margin-top:6px">' + esc(l.message) + '</p>' : '') +
      '<div class="kanban-card-actions">' +
        '<select class="select" data-act="status" style="min-height:34px;font-size:12.5px">' +
          STATUS_COLS.map(function (col) { return '<option value="' + col.key + '"' + (col.key === status ? ' selected' : '') + '>' + col.label + '</option>'; }).join('') +
        '</select>' +
        '<button class="btn-icon" data-act="del" aria-label="Supprimer">' + ico('trash', 18) + '</button>' +
      '</div></div>';
  }

  function wireLeads() {
    var scope = $('#leadsScope');
    if (scope) scope.addEventListener('change', function () { LEADS_SCOPE = scope.value; render(); });

    var board = $('#kanbanBoard'); if (!board) return;
    var dragId = null;

    function leadById(id) { return window.Store.leadsFor(LEADS_SCOPE).filter(function (x) { return x.id === id; })[0]; }

    board.addEventListener('dragstart', function (e) {
      var card = e.target.closest('.kanban-card'); if (!card) { e.preventDefault(); return; }
      dragId = card.getAttribute('data-id');
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragId);
    });
    board.addEventListener('dragend', function () {
      dragId = null;
      $$('.kanban-card', board).forEach(function (c) { c.classList.remove('is-dragging'); });
      $$('.kanban-list', board).forEach(function (l) { l.classList.remove('is-over'); });
    });
    board.addEventListener('dragover', function (e) {
      var list = e.target.closest('.kanban-list'); if (!list) return;
      e.preventDefault();
      $$('.kanban-list', board).forEach(function (l) { l.classList.remove('is-over'); });
      list.classList.add('is-over');
    });
    board.addEventListener('drop', function (e) {
      var list = e.target.closest('.kanban-list'); if (!list || !dragId) return;
      e.preventDefault();
      var status = list.getAttribute('data-status');
      var lead = leadById(dragId);
      if (lead && (lead.status || 'new') !== status) {
        window.Store.updateLeadStatus(dragId, LEADS_SCOPE, status).then(function () { render(); });
      }
    });

    board.addEventListener('change', function (e) {
      var sel = e.target.closest('[data-act="status"]'); if (!sel) return;
      var id = sel.closest('.kanban-card').getAttribute('data-id');
      window.Store.updateLeadStatus(id, LEADS_SCOPE, sel.value).then(function () { render(); });
    });

    board.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act="del"]'); if (!b) return;
      var id = b.closest('.kanban-card').getAttribute('data-id');
      confirmBox('Supprimer', 'Ce message sera définitivement supprimé.', function () {
        window.Store.deleteLead(id, LEADS_SCOPE).then(function () { render(); toast('Message supprimé'); });
      }, true);
    });
  }

  function paintLeadsBadge() {
    var n = $('#leadsCount'); if (!n) return;
    var count = window.Store.leadsFor('*').filter(function (l) { return (l.status || 'new') === 'new'; }).length;
    n.textContent = count || '';
  }

  /* ============================================================
     Onglet RÉGLAGES
     ============================================================ */
  function tabSettings() {
    var c = P().contact || {}, a = P().analytics || {}, s = P().seo || {};
    return '' +
    '<div class="panel"><h3>Adresse publique</h3><p class="hint">L’identifiant sert d’adresse : <code>index.html?u=' + esc(P().slug) + '</code></p>' +
      '<div class="field"><label for="s-slug">Identifiant</label><input class="input" id="s-slug" value="' + esc(P().slug) + '"></div>' +
      '<div class="callout" style="margin-top:14px">' + ico('qr', 19) + '<span>Générez un QR code pointant vers ce profil : idéal pour un flyer, une vitrine ou une carte de visite.' +
      '<br><button class="btn btn-ghost btn-sm" id="showQr" style="margin-top:10px">' + ico('qr', 18) + 'Voir le QR code</button></span></div></div>' +

    '<div class="panel"><h3>Contact</h3>' +
      '<div class="grid2">' +
        '<div class="field"><label for="s-email">Email</label><input class="input" id="s-email" type="email" value="' + esc(c.email || '') + '"></div>' +
        '<div class="field"><label for="s-phone">Téléphone</label><input class="input" id="s-phone" value="' + esc(c.phone || '') + '"></div>' +
      '</div>' +
      '<div class="row-toggle"><div><p>Afficher le formulaire de contact</p><small>Vignette « Nous contacter » en bas de page, qui se déplie au clic. Les messages arrivent dans l’onglet Contacts.</small></div>' +
        '<label class="switch"><input type="checkbox" id="s-form"' + (c.showForm ? ' checked' : '') + '><span></span></label></div>' +
      '<div class="field" style="margin-top:12px"><label for="s-endpoint">Copier aussi vers <span class="hint">(facultatif)</span></label>' +
        '<input class="input" id="s-endpoint" value="' + esc(c.endpoint || '') + '" placeholder="https://formspree.io/f/xxxx">' +
        '<span class="hint">Chaque message est enregistré dans l’onglet Contacts. Renseignez une adresse ici pour recevoir aussi une copie via un service externe (Formspree, Zapier…).</span></div></div>' +

    '<div class="panel"><h3>Référencement &amp; partage</h3><p class="hint">Ce qui s’affiche quand on partage le lien sur WhatsApp, LinkedIn ou en message privé.</p>' +
      '<div class="stack">' +
        '<div class="field"><label for="s-title">Titre</label><input class="input" id="s-title" value="' + esc(s.title || '') + '" placeholder="' + esc(P().name) + ' — tous mes liens"></div>' +
        '<div class="field"><label for="s-desc">Description</label><textarea class="textarea" id="s-desc" maxlength="160" placeholder="Une phrase qui donne envie de cliquer.">' + esc(s.description || '') + '</textarea></div>' +
        '<div class="field"><label for="s-image">Image de partage (URL)</label><input class="input" id="s-image" value="' + esc(s.image || '') + '" placeholder="1200 × 630 px"></div>' +
      '</div></div>' +

    '<div class="panel"><h3>Outils d’analyse</h3><p class="hint">Facultatif. Les identifiants sont injectés dans la page exportée.</p>' +
      '<div class="stack">' +
        '<div class="field"><label for="s-plausible">Plausible — domaine</label><input class="input" id="s-plausible" value="' + esc(a.plausible || '') + '" placeholder="liens.monclient.fr"></div>' +
        '<div class="field"><label for="s-ga4">Google Analytics 4</label><input class="input" id="s-ga4" value="' + esc(a.ga4 || '') + '" placeholder="G-XXXXXXXXXX"></div>' +
        '<div class="field"><label for="s-pixel">Meta Pixel</label><input class="input" id="s-pixel" value="' + esc(a.metaPixel || '') + '" placeholder="123456789012345"></div>' +
      '</div></div>' +

    '<div class="panel"><h3>Livraison</h3><p class="hint">Exportez une page autonome à déposer chez le client (Netlify, Vercel, o2switch, OVH…). Cette page fonctionne sans connexion à Reely : les liens s’ouvrent normalement mais les nouveaux clics/messages ne remontent plus dans ce tableau de bord.</p>' +
      '<div class="inline" style="flex-wrap:wrap;gap:10px">' +
        '<button class="btn btn-primary btn-sm" id="exportHtml">' + ico('download', 18) + 'Page HTML autonome</button>' +
        '<button class="btn btn-ghost btn-sm" id="exportJson">' + ico('doc', 18) + 'Sauvegarde JSON</button>' +
        '<button class="btn btn-ghost btn-sm" id="importJson">' + ico('upload', 18) + 'Importer</button>' +
      '</div>' +
      '<div class="callout" style="margin-top:14px">' + ico('sparkle', 19) + '<span>La page exportée est un fichier unique : aucune dépendance, aucun serveur, aucun cookie. Renommez-la <code>index.html</code> et déposez-la sur l’hébergement du client.</span></div></div>' +

    '<div class="panel"><h3>Zone sensible</h3>' +
      '<div class="callout warn">' + ico('trash', 19) + '<span>Supprimer définitivement le profil <b>' + esc(P().name) + '</b> et tous ses liens.' +
      '<br><button class="btn btn-danger btn-sm" id="delProfile" style="margin-top:10px">Supprimer ce profil</button></span></div></div>';
  }

  function wireSettings() {
    function bind(id, fn) { var n = $('#' + id); if (n) n.addEventListener('input', function () { fn(n); persist(); }); }
    bind('s-email', function (n) { P().contact.email = n.value.trim(); });
    bind('s-phone', function (n) { P().contact.phone = n.value.trim(); });
    bind('s-form', function (n) { P().contact.showForm = n.checked; });
    bind('s-endpoint', function (n) { P().contact.endpoint = n.value.trim(); });
    bind('s-title', function (n) { P().seo.title = n.value; });
    bind('s-desc', function (n) { P().seo.description = n.value; });
    bind('s-image', function (n) { P().seo.image = n.value.trim(); });
    bind('s-plausible', function (n) { P().analytics.plausible = n.value.trim(); });
    bind('s-ga4', function (n) { P().analytics.ga4 = n.value.trim(); });
    bind('s-pixel', function (n) { P().analytics.metaPixel = n.value.trim(); });

    var slug = $('#s-slug');
    if (slug) slug.addEventListener('change', function () {
      var v = window.Store.slugify(slug.value);
      if (v === P().slug) { slug.value = v; return; }
      if (D.profiles[v]) { toast('Cet identifiant est déjà pris', true); slug.value = P().slug; return; }
      var old = P().slug, prof = P();
      delete D.profiles[old]; prof.slug = v; D.profiles[v] = prof; D.active = v;
      slug.value = v; persist(); render(); toast('Identifiant mis à jour');
    });

    var qr = $('#showQr');
    if (qr) qr.onclick = function () {
      var url = publicUrl();
      var svg = window.QR.svg(url, { size: 240, dark: P().theme.primary });
      var m = modal('QR code — ' + P().name,
        '<div class="qr-box" style="display:grid;place-items:center;padding:20px;background:#fff;border-radius:16px">' + svg + '</div>' +
        '<p class="hint" style="text-align:center;margin-top:12px;word-break:break-all">' + esc(url) + '</p>',
        '<span class="spacer"></span><button class="btn btn-quiet btn-sm" data-close>Fermer</button>' +
        '<button class="btn btn-primary btn-sm" data-dl>' + ico('download', 18) + 'Télécharger</button>');
      $('[data-dl]', m.node).onclick = function () { dl(svg, 'qr-' + P().slug + '.svg', 'image/svg+xml'); };
    };

    var eh = $('#exportHtml'); if (eh) eh.onclick = exportStandalone;
    var ej = $('#exportJson'); if (ej) ej.onclick = function () {
      dl(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profiles: D.profiles }, null, 2),
        'reely-links-sauvegarde.json', 'application/json');
      toast('Sauvegarde téléchargée');
    };
    var ij = $('#importJson'); if (ij) ij.onclick = function () {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'application/json,.json';
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var j;
          try { j = JSON.parse(r.result); } catch (e) { toast('Fichier illisible', true); return; }
          var incoming = j.profiles || j;
          var used = Object.keys(D.profiles);
          var n = 0;
          var chain = Promise.resolve();
          Object.keys(incoming).forEach(function (k) {
            chain = chain.then(function () {
              var src = incoming[k];
              var base = window.Store.slugify(src.slug || k);
              var slug = base, i = 1;
              while (used.indexOf(slug) !== -1) { i++; slug = base + '-' + i; }
              used.push(slug);
              var prof = window.Store.blankProfile(slug, src.name || k);
              ['handle', 'bio', 'avatar', 'initials', 'verified', 'tags', 'theme', 'seo', 'contact', 'analytics', 'socials']
                .forEach(function (field) { if (src[field] !== undefined) prof[field] = src[field]; });
              prof.links = (src.links || []).map(function (l) {
                var copy = Object.assign({}, l);
                copy.id = window.Store.uid(l.type === 'header' ? 'h' : 'l');
                return copy;
              });
              return window.Store.saveProfile(prof).then(function () { n++; });
            });
          });
          chain.then(function () { return window.Store.load(); }).then(function (data) {
            D = data; render(); toast(n + ' profil(s) importé(s)');
          }).catch(function (err) { toast('Import échoué : ' + (err && err.message || ''), true); });
        };
        r.readAsText(f);
      };
      inp.click();
    };

    var dp = $('#delProfile');
    if (dp) dp.onclick = function () {
      confirmBox('Supprimer le profil', 'Le profil « ' + P().name + ' » et ses ' + P().links.length + ' lien(s) seront perdus. Cette action est irréversible.', function () {
        var id = P().id, slug = P().slug;
        window.Store.deleteProfile(id).then(function () {
          delete D.profiles[slug];
          D.active = Object.keys(D.profiles)[0] || null;
          render(); toast('Profil supprimé');
        }).catch(function (err) { toast('Suppression impossible : ' + (err && err.message || ''), true); });
      }, true);
    };
  }

  function dl(content, name, type) {
    var blob = new Blob([content], { type: type + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  /* ---------- Export d'une page autonome ---------- */
  function exportStandalone() {
    var files = ['assets/theme.css', 'assets/profile.css', 'assets/icons.js', 'assets/store.js', 'assets/qr.js', 'assets/profile.js'];
    toast('Préparation du fichier…');
    Promise.all(files.map(function (f) {
      return fetch(f).then(function (r) { if (!r.ok) throw new Error(f); return r.text(); });
    })).then(function (parts) {
      var p = JSON.parse(JSON.stringify(P()));
      var a = p.analytics || {};
      var tracking = '';
      if (a.plausible) tracking += '<script defer data-domain="' + a.plausible + '" src="https://plausible.io/js/script.js"><\/script>';
      if (a.ga4) tracking += '<script async src="https://www.googletagmanager.com/gtag/js?id=' + a.ga4 + '"><\/script>' +
        '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' + a.ga4 + '");<\/script>';
      if (a.metaPixel) tracking += '<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?' +
        'n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";' +
        'n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}' +
        '(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","' + a.metaPixel + '");fbq("track","PageView");<\/script>';

      var title = (p.seo && p.seo.title) || (p.name + ' — tous mes liens');
      var html = '<!doctype html>\n<html lang="fr">\n<head>\n' +
        '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
        '<title>' + esc(title) + '</title>\n' +
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap">\n' +
        '<link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🔗</text></svg>">\n' +
        '<style>\n' + parts[0] + '\n' + parts[1] + '\n</style>\n' + tracking + '\n</head>\n' +
        '<body class="profile">\n<div id="app"></div>\n' +
        '<script>window.REELY_PROFILE = ' + JSON.stringify(p) + ';<\/script>\n' +
        '<script>' + parts[2] + '<\/script>\n' +
        '<script>' + parts[3] + '<\/script>\n' +
        '<script>' + parts[4] + '<\/script>\n' +
        '<script>' + parts[5] + '<\/script>\n' +
        '</body>\n</html>';

      dl(html, p.slug + '.html', 'text/html');
      toast('Page autonome exportée (' + Math.round(html.length / 1024) + ' Ko)');
    }).catch(function () {
      modal('Export impossible en accès direct',
        '<p class="t-body">Le navigateur bloque la lecture des fichiers du dossier quand la page est ouverte en <code>file://</code>.</p>' +
        '<p class="t-body" style="margin-top:12px">Lancez un petit serveur local depuis le dossier du projet, puis rouvrez <code>http://localhost:8000/admin.html</code> :</p>' +
        '<pre style="margin-top:12px;padding:14px;background:var(--surface-low);border-radius:12px;overflow:auto"><code>python3 -m http.server 8000</code></pre>' +
        '<p class="hint" style="margin-top:12px">La sauvegarde JSON, elle, fonctionne dans tous les cas.</p>',
        '<span class="spacer"></span><button class="btn btn-primary btn-sm" data-close>Compris</button>');
    });
  }

  /* ============================================================
     Coquille : navigation, sélecteur de profil, rendu
     ============================================================ */
  var TABS = {
    links:    { title: 'Liens',          icon: 'link',     render: tabLinks,    wire: wireDnD },
    leads:    { title: 'Contacts',       icon: 'mail',     render: tabLeads,    wire: wireLeads },
    design:   { title: 'Apparence',      icon: 'palette',  render: tabDesign,   wire: wireDesign },
    stats:    { title: 'Statistiques',   icon: 'chart',    render: tabStats,    wire: wireStats },
    settings: { title: 'Réglages',       icon: 'settings', render: tabSettings, wire: wireSettings }
  };

  function paintPicker() {
    var p = P(); if (!p) return;
    var av = $('#pickerAv');
    av.innerHTML = p.avatar ? '<img src="' + esc(p.avatar) + '" alt="">' : esc(p.initials || p.name.slice(0, 2).toUpperCase());
    av.className = 'picker-av' + (p.avatar ? '' : ' avatar-fallback');
    $('#pickerName').textContent = p.name;
    $('#pickerHandle').textContent = p.handle || ('@' + p.slug);
    $('#pickerMenu').innerHTML = Object.keys(D.profiles).map(function (k) {
      var x = D.profiles[k];
      return '<button class="picker-opt' + (k === D.active ? ' is-current' : '') + '" data-slug="' + esc(k) + '" role="option">' +
        '<span class="picker-av avatar-fallback" style="font-size:11px">' +
        (x.avatar ? '<img src="' + esc(x.avatar) + '" alt="">' : esc(x.initials || x.name.slice(0, 2).toUpperCase())) +
        '</span><span><b>' + esc(x.name) + '</b><br><small class="muted">' + x.links.length + ' lien(s)</small></span></button>';
    }).join('');
  }

  function renderEmpty() {
    $('#tabTitle').textContent = 'Bienvenue';
    $('#tabBody').innerHTML = '<div class="empty"><p>Vous n’avez pas encore de profil.</p>' +
      '<p class="hint" style="margin-top:6px">Cliquez sur « Nouveau profil client » dans le menu pour créer votre premier profil.</p></div>';
    $('#pickerName').textContent = 'Aucun profil';
    $('#pickerHandle').textContent = '';
    $('#pickerMenu').innerHTML = '';
    refreshPreview();
  }

  function render() {
    if (!P()) { renderEmpty(); return; }
    var t = TABS[TAB];
    $('#tabTitle').textContent = t.title;
    $('#tabBody').innerHTML = t.render();
    $$('#nav .nav-item').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === TAB); });
    paintPicker();
    paintLeadsBadge();
    if (t.wire) t.wire();
    refreshPreview();
  }

  function boot(session) {
    $('#brandMark').innerHTML = ico('link', 19);
    $('#burger').innerHTML = ico('grid');
    $('#pickerBtn').insertAdjacentHTML('beforeend', ico('grid', 16));
    $('#newProfile').innerHTML = ico('plus', 18) + 'Nouveau profil client';
    $('#signOut').innerHTML = ico('logout', 18) + 'Se déconnecter';
    $('#openPublic').innerHTML = ico('eye', 18) + 'Voir en ligne';
    $('#addLink').innerHTML = ico('plus', 18) + 'Ajouter un lien';
    $('#copyUrl').innerHTML = ico('copy', 15);
    $('#refreshPreview').innerHTML = ico('external', 18) + 'Ouvrir';
    $('#sessionHint').textContent = (session && session.user && session.user.email) || '';

    $$('#nav .nav-item').forEach(function (b) {
      var k = b.getAttribute('data-tab');
      b.innerHTML = ico(TABS[k].icon) + '<span>' + TABS[k].title + '</span>' +
        (k === 'links' ? '<span class="nav-count" id="navCount"></span>' : '') +
        (k === 'leads' ? '<span class="nav-count" id="leadsCount"></span>' : '');
      b.onclick = function () { TAB = k; render(); $('#side').classList.remove('is-open'); };
    });

    $('#addLink').onclick = function () { if (!P()) { toast('Créez d’abord un profil', true); return; } if (TAB !== 'links') { TAB = 'links'; render(); } editLink(null); };
    $('#openPublic').onclick = function () { if (!P()) return; window.open('index.html?u=' + encodeURIComponent(P().slug), '_blank', 'noopener'); };
    $('#refreshPreview').onclick = function () { if (!P()) return; window.open('index.html?u=' + encodeURIComponent(P().slug), '_blank', 'noopener'); };
    $('#copyUrl').onclick = function () {
      if (!P()) return;
      navigator.clipboard.writeText(publicUrl()).then(function () { toast('Adresse copiée'); },
        function () { toast('Copie refusée par le navigateur', true); });
    };
    $('#signOut').onclick = function () {
      window.Store.auth.signOut().then(function () { location.href = 'login.html'; });
    };

    var btn = $('#pickerBtn'), menu = $('#pickerMenu');
    btn.onclick = function () {
      var open = menu.hidden;
      menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    };
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.picker')) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
    menu.addEventListener('click', function (e) {
      var o = e.target.closest('[data-slug]'); if (!o) return;
      D.active = o.getAttribute('data-slug');
      menu.hidden = true; render();
    });

    $('#newProfile').onclick = function () {
      var m = modal('Nouveau profil client',
        '<div class="stack">' +
          '<div class="field"><label for="np-name">Nom du client</label><input class="input" id="np-name" placeholder="Maison Lune"></div>' +
          '<div class="field"><label for="np-slug">Identifiant public</label><input class="input" id="np-slug" placeholder="maison-lune"><span class="hint">Utilisé dans l’adresse de la page.</span></div>' +
          '<div class="field"><label for="np-email">Email du client <span class="hint">(facultatif)</span></label><input class="input" id="np-email" type="email" placeholder="client@exemple.fr"><span class="hint">Le client pourra créer son propre compte avec cet email sur la page de connexion pour gérer ce profil lui-même.</span></div>' +
          (Object.keys(D.profiles).length ? '<div class="field"><label for="np-copy">Partir de</label><select class="select" id="np-copy">' +
            '<option value="">Un profil vierge</option>' +
            Object.keys(D.profiles).map(function (k) { return '<option value="' + k + '">Une copie de ' + esc(D.profiles[k].name) + '</option>'; }).join('') +
          '</select></div>' : '') +
        '</div>',
        '<span class="spacer"></span><button class="btn btn-quiet btn-sm" data-close>Annuler</button><button class="btn btn-primary btn-sm" data-create>Créer</button>');

      $('#np-name', m.node).addEventListener('input', function () {
        var s = $('#np-slug', m.node);
        if (!s.dataset.touched) s.value = window.Store.slugify(this.value);
      });
      $('#np-slug', m.node).addEventListener('input', function () { this.dataset.touched = '1'; });

      $('[data-create]', m.node).onclick = function () {
        var name = $('#np-name', m.node).value.trim();
        if (!name) { toast('Le nom est obligatoire', true); return; }
        var slug = window.Store.slugify($('#np-slug', m.node).value || name);
        if (D.profiles[slug]) { toast('Cet identifiant existe déjà', true); return; }
        var email = $('#np-email', m.node).value.trim();
        var copySrc = $('#np-copy', m.node);
        var src = copySrc ? copySrc.value : '';
        var prof;
        if (src) {
          prof = JSON.parse(JSON.stringify(D.profiles[src]));
          prof.id = null; prof.ownerId = null;
          prof.links.forEach(function (l) { l.id = window.Store.uid(l.type === 'header' ? 'h' : 'l'); });
        } else {
          prof = window.Store.blankProfile(slug, name);
        }
        prof.slug = slug; prof.name = name; prof.handle = '@' + slug; prof.inviteEmail = email;
        prof.initials = name.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase() || 'ND';

        var btn = $('[data-create]', m.node); btn.disabled = true;
        window.Store.saveProfile(prof).then(function (saved) {
          D.profiles[slug] = saved; D.active = slug;
          m.close(); TAB = 'design'; render();
          toast(email ? 'Profil « ' + name + ' » créé — ' + email + ' peut créer son compte sur la page de connexion' : 'Profil « ' + name + ' » créé');
        }).catch(function (err) {
          btn.disabled = false;
          toast('Création impossible : ' + (err && err.message || ''), true);
        });
      };
    };

    $('#burger').onclick = function () {
      var s = $('#side');
      s.classList.add('is-open');
      var scrim = el('<div class="side-scrim"></div>');
      document.body.appendChild(scrim);
      scrim.onclick = function () { s.classList.remove('is-open'); scrim.remove(); };
    };

    $('#tabBody').addEventListener('click', function (e) {
      if (TAB !== 'links') return;
      var row = e.target.closest('.row'); if (!row) return;
      var id = row.getAttribute('data-id');
      var link = P().links.filter(function (x) { return x.id === id; })[0];
      if (!link) return;
      if (e.target.closest('[data-act="edit"]')) { link.type === 'header' ? editHeader(id) : editLink(id); }
      else if (e.target.closest('[data-act="del"]')) {
        confirmBox('Supprimer', '« ' + (link.title || 'Sans titre') + ' » sera retiré de la page.', function () {
          P().links = P().links.filter(function (x) { return x.id !== id; });
          persist(); render(); toast('Supprimé');
        }, true);
      }
    });
    $('#tabBody').addEventListener('change', function (e) {
      if (TAB !== 'links') return;
      var t = e.target.closest('[data-act="vis"]'); if (!t) return;
      var id = t.closest('.row').getAttribute('data-id');
      var link = P().links.filter(function (x) { return x.id === id; })[0];
      link.visible = t.checked;
      t.closest('.row').classList.toggle('is-hidden', !link.visible);
      persist();
    });
    document.addEventListener('click', function (e) {
      if (TAB === 'links' && e.target.closest('#addHeader')) editHeader(null);
    });

    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); if (P()) editLink(null); }
      if (e.key === 'p' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); $('#openPublic').click(); }
    });

    render();
  }

  function initApp(session) {
    if (!session) { location.href = 'login.html'; return; }
    window.Store.load().then(function (data) {
      D = data;
      window.Store.onStatsUpdate(function () { if (D && (TAB === 'links' || TAB === 'stats')) render(); });
      window.Store.onLeadsUpdate(function () { paintLeadsBadge(); if (D && TAB === 'leads') render(); });
      boot(session);
    }).catch(function (err) {
      document.body.innerHTML = '<p style="padding:60px;text-align:center">Erreur de chargement : ' + esc((err && err.message) || 'inconnue') + '</p>';
    });
  }

  window.Store.auth.getSession().then(initApp);
})();
