/* ============================================================
   Reely Links — Rendu de la page publique
   Source des données, par ordre de priorité :
     1. window.REELY_PROFILE  (page exportée autonome)
     2. ?u=<slug>              (lecture publique Supabase)
   En mode aperçu (?preview=1), le profil peut aussi être mis à
   jour en direct par le gestionnaire via postMessage, sans
   recharger la page ni refaire une requête réseau à chaque frappe.
   ============================================================ */
(function () {
  'use strict';

  var qs = new URLSearchParams(location.search);
  var isPreview = qs.get('preview') === '1';
  var root = document.getElementById('app');
  var P = null;

  /* ---------- Résolution du profil ---------- */
  function resolve() {
    if (window.REELY_PROFILE) return Promise.resolve(window.REELY_PROFILE);
    var slug = qs.get('u');
    if (!slug) return Promise.resolve(null);
    return window.Store.getPublicProfile(slug);
  }

  /* ---------- Utilitaires ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
  function safeUrl(u) {
    var s = String(u || '').trim();
    return /^(https?:|mailto:|tel:|#|\/)/i.test(s) ? s : 'https://' + s.replace(/^\/+/, '');
  }
  function hostOf(u) {
    try { return new URL(safeUrl(u)).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  /* ---------- Application du thème ---------- */
  function applyTheme(t) {
    var r = document.documentElement, b = document.body;
    r.style.setProperty('--primary', t.primary);
    r.style.setProperty('--primary-container', t.primary2 || t.primary);
    r.style.setProperty('--accent', t.accent || t.primary);
    r.style.setProperty('--card-radius', (t.radius || 28) + 'px');
    b.style.setProperty('--page-bg', t.bg || '');
    r.setAttribute('data-mode', t.mode === 'dark' ? 'dark' : 'light');
    b.setAttribute('data-card', t.card || 'soft');
    b.setAttribute('data-bg', t.orbs === false ? 'plain' : 'orbs');
    if (t.font && t.font !== 'Montserrat') r.style.setProperty('--font-display', "'" + t.font + "', " + "var(--font-body)");
  }

  /* ---------- Métadonnées / SEO ---------- */
  function applyMeta() {
    var title = (P.seo && P.seo.title) || (P.name + ' — tous mes liens');
    var desc = (P.seo && P.seo.description) || P.bio || ('Retrouvez tous les liens de ' + P.name + '.');
    document.title = title;
    function meta(attr, key, val) {
      var m = document.head.querySelector('meta[' + attr + '="' + key + '"]');
      if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
      m.setAttribute('content', val);
    }
    meta('name', 'description', desc);
    meta('property', 'og:title', title);
    meta('property', 'og:description', desc);
    meta('property', 'og:type', 'profile');
    meta('property', 'og:url', location.href);
    meta('name', 'twitter:card', 'summary_large_image');
    var img = (P.seo && P.seo.image) || P.avatar;
    if (img) { meta('property', 'og:image', img); meta('name', 'twitter:image', img); }
    meta('name', 'theme-color', P.theme.primary);

    var ld = document.head.querySelector('script[data-ld]');
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.setAttribute('data-ld', '1'); document.head.appendChild(ld); }
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Person',
      name: P.name, description: desc, image: P.avatar || undefined,
      url: location.href,
      sameAs: (P.socials || []).map(function (s) { return s.url; }).filter(Boolean)
    });
  }

  /* ---------- Suivi des clics ---------- */
  function track(kind, link) {
    if (isPreview) return;
    try { window.Store.bump(P.id, kind, link && link.id); } catch (e) {}
    var name = kind === 'view' ? 'pageview' : 'link_click';
    var props = link ? { link: link.title, url: link.url } : {};
    if (window.plausible) window.plausible(name, { props: props });
    if (window.gtag) window.gtag('event', name, props);
    if (window.fbq && kind !== 'view') window.fbq('trackCustom', 'LinkClick', props);
  }

  /* ---------- Blocs de rendu ---------- */
  function renderHead() {
    var av = P.avatar
      ? '<img src="' + esc(P.avatar) + '" alt="' + esc(P.name) + '" loading="eager" decoding="async" width="128" height="128">'
      : '<div class="avatar-fallback" style="width:100%;height:100%">' + esc(P.initials || P.name.slice(0, 2).toUpperCase()) + '</div>';
    var badge = P.verified ? '<span class="p-verified" title="Compte vérifié">' + ICONS.svg('check', 15) + '</span>' : '';
    var tags = (P.tags || []).map(function (t, i) {
      return '<span class="chip' + (i % 2 ? '' : ' chip-primary') + '">' + esc(t) + '</span>';
    }).join('');
    var socials = (P.socials || []).filter(function (s) { return s.url; }).map(function (s) {
      var brand = ICONS.brandColor(s.platform);
      return '<a class="p-social" href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener me"' +
             ' aria-label="' + esc(s.platform) + '" data-social="' + esc(s.platform) + '"' +
             (brand ? ' style="--brand:' + brand + '"' : '') + '>' + ICONS.svg(s.platform, 21) + '</a>';
    }).join('');

    return '<header class="p-head">' +
      '<div class="p-avatar">' + av + badge + '</div>' +
      '<h1 class="t-display p-name">' + esc(P.name) + '</h1>' +
      (P.handle ? '<p class="p-handle">' + esc(P.handle) + '</p>' : '') +
      (P.bio ? '<p class="p-bio">' + esc(P.bio) + '</p>' : '') +
      (tags ? '<div class="p-tags">' + tags + '</div>' : '') +
      (socials ? '<nav class="p-socials" aria-label="Réseaux sociaux">' + socials + '</nav>' : '') +
      '</header>';
  }

  function renderLink(l, i) {
    if (l.type === 'header') {
      return '<div class="p-sep"><span>' + esc(l.title) + '</span></div>';
    }
    if (l.type === 'embed') {
      var yt = String(l.url).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      if (yt) {
        return '<div class="p-embed p-embed-yt" style="--i:' + i + '">' +
          '<iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '" title="' + esc(l.title) +
          '" loading="lazy" allowfullscreen allow="accelerometer;clipboard-write;encrypted-media;picture-in-picture"></iframe></div>';
      }
      var sp = String(l.url).match(/spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
      if (sp) {
        return '<div class="p-embed" style="--i:' + i + '">' +
          '<iframe src="https://open.spotify.com/embed/' + sp[1] + '/' + sp[2] +
          '" height="152" title="' + esc(l.title) + '" loading="lazy" allow="encrypted-media"></iframe></div>';
      }
    }

    var g = ICONS.guess(l.url);
    var icon = l.icon || g.icon;
    var brand = l.brand || ICONS.brandColor(icon) || g.brand;
    var sub = l.subtitle || hostOf(l.url);
    var badge = l.badge
      ? '<span class="p-badge' + (/complet|limit|dernier|bientôt/i.test(l.badge) ? ' is-hot' : '') + '">' + esc(l.badge) + '</span>'
      : '';
    var iconHtml = /^https?:\/\//.test(icon) ? '<img src="' + esc(icon) + '" alt="">' : ICONS.svg(icon, 26);

    return '<a class="p-link' + (l.featured ? ' is-featured' : '') + '" href="' + esc(safeUrl(l.url)) + '"' +
      ' target="_blank" rel="noopener" data-id="' + esc(l.id) + '" style="--i:' + i + (brand && !l.featured ? ';--brand:' + brand : '') + '">' +
      '<span class="p-ico">' + iconHtml + '</span>' +
      '<span class="p-link-body">' +
        '<span class="p-link-title">' + esc(l.title) + badge + '</span>' +
        (sub ? '<span class="p-link-sub clamp-1">' + esc(sub) + '</span>' : '') +
      '</span>' +
      '<span class="p-go">' + ICONS.svg('arrowRight', 19) + '</span>' +
    '</a>';
  }

  function renderLinks() {
    var now = new Date();
    var live = (P.links || []).filter(function (l) { return window.Store.isLive(l, now); });
    live = live.filter(function (l, i) {
      if (l.type !== 'header') return true;
      for (var j = i + 1; j < live.length; j++) {
        if (live[j].type === 'header') return false;
        return true;
      }
      return false;
    });
    if (!live.length) return '<p class="muted" style="text-align:center;margin-top:40px">Aucun lien publié pour le moment.</p>';
    return '<div class="p-links">' + live.map(renderLink).join('') + '</div>';
  }

  function renderContact() {
    var c = P.contact || {};
    if (!c.showForm) return '';
    return '<section class="p-contact">' +
      '<h2 class="t-head-lg" style="font-size:26px">Écrivez-nous</h2>' +
      '<p class="muted" style="margin-top:6px">Une question, un projet ? On répond sous 24 h.</p>' +
      '<form class="p-form" id="contactForm" novalidate>' +
        '<div class="p-form-row">' +
          '<div class="field"><label for="cf-name">Nom</label><input class="input" id="cf-name" name="name" required placeholder="Camille Dupont"></div>' +
          '<div class="field"><label for="cf-mail">Email</label><input class="input" id="cf-mail" name="email" type="email" required placeholder="camille@exemple.fr"></div>' +
        '</div>' +
        '<div class="field"><label for="cf-msg">Message</label><textarea class="textarea" id="cf-msg" name="message" required placeholder="Parlez-nous de votre projet…"></textarea></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Envoyer' + ICONS.svg('arrowRight', 20) + '</button>' +
        '<p class="hint" id="cf-status" role="status" aria-live="polite"></p>' +
      '</form>' +
    '</section>';
  }

  function renderFoot() {
    var c = P.contact || {};
    var bits = [];
    if (c.email) bits.push('<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>');
    if (c.phone) bits.push('<a href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">' + esc(c.phone) + '</a>');
    return '<footer class="p-foot">' +
      (bits.length ? '<p class="t-label">' + bits.join(' · ') + '</p>' : '') +
      '<p class="t-label-sm muted">Propulsé par <strong>Reely Links</strong></p>' +
    '</footer>';
  }

  function renderDock() {
    var c = P.contact || {};
    var cta = c.email
      ? '<button class="dock-cta" data-act="contact">' + ICONS.svg('mail', 18) + 'Contact</button>'
      : '';
    return '<div class="p-dock" role="toolbar" aria-label="Actions">' +
      '<button data-act="share" aria-label="Partager ce profil" title="Partager">' + ICONS.svg('share', 20) + '</button>' +
      '<button data-act="qr" aria-label="Afficher le QR code" title="QR code">' + ICONS.svg('qr', 20) + '</button>' +
      '<button data-act="vcard" aria-label="Ajouter aux contacts" title="Ajouter aux contacts">' + ICONS.svg('contact', 20) + '</button>' +
      cta +
    '</div>';
  }

  /* ---------- Feuilles / modales ---------- */
  function sheet(title, bodyHtml) {
    var back = el('<div class="sheet-backdrop"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<div class="sheet-head"><h2 class="t-head-md">' + esc(title) + '</h2>' +
      '<button class="btn-icon" data-close aria-label="Fermer">' + ICONS.svg('close', 20) + '</button></div>' +
      bodyHtml + '</div></div>');
    document.body.appendChild(back);
    function close() { back.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    back.addEventListener('click', function (e) { if (e.target === back || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    var f = back.querySelector('button, a, input');
    if (f) f.focus();
    return { node: back, close: close };
  }

  function toast(msg) {
    var host = document.querySelector('.toast-host') || (function () {
      var h = el('<div class="toast-host"></div>'); document.body.appendChild(h); return h;
    })();
    var t = el('<div class="toast">' + ICONS.svg('check', 18) + '<span>' + esc(msg) + '</span></div>');
    host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 250); }, 2200);
  }

  function shareSheet() {
    var url = location.href.split('?')[0] + (window.REELY_PROFILE ? '' : '?u=' + P.slug);
    if (navigator.share) {
      navigator.share({ title: P.name, text: P.bio || '', url: url }).catch(function () {});
      return;
    }
    sheet('Partager', '<div class="copy-row"><input class="input" value="' + esc(url) + '" readonly id="shareUrl">' +
      '<button class="btn btn-primary btn-sm" id="copyBtn">' + ICONS.svg('copy', 18) + 'Copier</button></div>');
    document.getElementById('copyBtn').onclick = function () {
      var i = document.getElementById('shareUrl'); i.select();
      navigator.clipboard.writeText(i.value).then(function () { toast('Lien copié'); });
    };
  }

  function qrSheet() {
    var url = location.href.split('?')[0] + (window.REELY_PROFILE ? '' : '?u=' + P.slug);
    var svg = window.QR ? window.QR.svg(url, { size: 240, dark: P.theme.primary, light: '#ffffff' }) : '';
    var s = sheet('QR code', '<div class="qr-box">' + svg + '</div>' +
      '<p class="hint" style="text-align:center;margin-bottom:16px">À imprimer sur vos flyers, vitrines ou cartes de visite.</p>' +
      '<button class="btn btn-ghost btn-block" id="dlQr">' + ICONS.svg('download', 20) + 'Télécharger le SVG</button>');
    document.getElementById('dlQr').onclick = function () {
      var blob = new Blob([svg], { type: 'image/svg+xml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'qr-' + P.slug + '.svg'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    };
  }

  function vcard() {
    var c = P.contact || {};
    var lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + P.name, 'N:;' + P.name + ';;;'];
    if (c.email) lines.push('EMAIL;TYPE=INTERNET:' + c.email);
    if (c.phone) lines.push('TEL;TYPE=CELL:' + c.phone);
    if (P.bio) lines.push('NOTE:' + P.bio.replace(/\n/g, ' '));
    lines.push('URL:' + location.href.split('?')[0]);
    (P.socials || []).forEach(function (s) { if (s.url) lines.push('X-SOCIALPROFILE;TYPE=' + s.platform + ':' + s.url); });
    lines.push('END:VCARD');
    var blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = window.Store.slugify(P.name) + '.vcf'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Fiche contact téléchargée');
  }

  /* ---------- Montage ---------- */
  function mount() {
    if (!P) { root.innerHTML = '<p style="padding:40px;text-align:center">Profil introuvable.</p>'; return; }
    applyTheme(P.theme);
    applyMeta();
    root.innerHTML =
      '<div class="bg-orbs" aria-hidden="true"><i></i><i></i></div>' +
      '<div class="shell">' + renderHead() + renderLinks() + renderContact() + renderFoot() + '</div>' +
      renderDock() +
      (isPreview ? '<div class="preview-flag">Aperçu</div>' : '');
    track('view');
  }

  // Délégation d'événements sur #app : attachée une seule fois, survit aux
  // remontages déclenchés par le postMessage de l'aperçu admin.
  root.addEventListener('click', function (e) {
    if (!P) return;
    var a = e.target.closest('.p-link');
    if (a) {
      var id = a.getAttribute('data-id');
      var link = (P.links || []).filter(function (l) { return l.id === id; })[0];
      track('click', link);
      if (isPreview) e.preventDefault();
      return;
    }
    var s = e.target.closest('[data-social]');
    if (s) { track('click', { id: 'social:' + s.getAttribute('data-social'), title: s.getAttribute('data-social'), url: s.href }); if (isPreview) e.preventDefault(); }

    var b = e.target.closest('[data-act]');
    if (b) {
      var act = b.getAttribute('data-act');
      if (act === 'share') shareSheet();
      else if (act === 'qr') qrSheet();
      else if (act === 'vcard') vcard();
      else if (act === 'contact') {
        var form = document.getElementById('contactForm');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else location.href = 'mailto:' + (P.contact.email || '');
      }
    }
  });

  root.addEventListener('submit', function (e) {
    if (!P || e.target.id !== 'contactForm') return;
    e.preventDefault();
    var form = e.target;
    var status = document.getElementById('cf-status');
    var fd = new FormData(form);
    if (!fd.get('name') || !fd.get('email') || !fd.get('message')) {
      status.textContent = 'Merci de remplir tous les champs.'; status.style.color = 'var(--error)'; return;
    }
    var lead = { name: fd.get('name'), email: fd.get('email'), message: fd.get('message') };
    status.textContent = 'Envoi en cours…'; status.style.color = '';
    window.Store.addLead(P.id, lead).then(function () {
      form.reset(); status.textContent = 'Message envoyé, merci !'; status.style.color = 'var(--success)';
      var endpoint = (P.contact && P.contact.endpoint) || '';
      if (endpoint) fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).catch(function () {});
    }).catch(function () {
      var body = 'De : ' + lead.name + ' <' + lead.email + '>\n\n' + lead.message;
      location.href = 'mailto:' + (P.contact.email || '') +
        '?subject=' + encodeURIComponent('Contact via ' + P.name) + '&body=' + encodeURIComponent(body);
      status.textContent = "L'envoi a échoué. Votre logiciel de messagerie va s'ouvrir."; status.style.color = 'var(--error)';
    });
  });

  if (isPreview) {
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'reely-preview-update') { P = e.data.profile; mount(); }
    });
  }

  resolve().then(function (profile) { P = profile; mount(); });
})();
