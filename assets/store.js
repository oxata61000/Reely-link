/* ============================================================
   Reely Links — Modèle de données + persistance
   Multi-profils, multi-comptes : un profil = un compte (Reely ou
   un client). Stockage : Supabase (Postgres + Auth + RLS).
   Toutes les opérations de données renvoient des Promises.
   ============================================================ */
(function (global) {
  'use strict';

  var cfg = global.REELY_SUPABASE;
  var _sb = null;
  // Initialisation paresseuse : une page HTML exportée en autonome (voir
  // exportStandalone() dans admin.js) embarque store.js sans le SDK Supabase
  // ni la config — elle n'en a pas besoin puisque window.REELY_PROFILE
  // court-circuite déjà toute lecture réseau côté profile.js.
  function sb() {
    if (!_sb) {
      if (!cfg || !global.supabase) throw new Error('Supabase non configuré sur cette page.');
      _sb = global.supabase.createClient(cfg.url, cfg.anonKey);
    }
    return _sb;
  }

  /* ---------- Thèmes prêts à l'emploi ---------- */
  var PRESETS = {
    indigo:   { label: 'Indigo & Sage', primary: '#4648d4', primary2: '#6063ee', accent: '#7fbf9e', bg: 'linear-gradient(160deg,#eef1ff 0%,#f9f9ff 45%,#e9f7f0 100%)' },
    noir:     { label: 'Noir & Or',     primary: '#c8a24a', primary2: '#e0bd6a', accent: '#8b7333', bg: 'linear-gradient(160deg,#101014 0%,#17171d 60%,#0d0d10 100%)', mode: 'dark' },
    corail:   { label: 'Corail',        primary: '#e4572e', primary2: '#f47f52', accent: '#f4b942', bg: 'linear-gradient(160deg,#fff2ec 0%,#fffaf7 50%,#fdf0e0 100%)' },
    ocean:    { label: 'Océan',         primary: '#0b7fa8', primary2: '#12a1c9', accent: '#4fd1c5', bg: 'linear-gradient(160deg,#e6f6fb 0%,#f7fdff 50%,#e3f6f2 100%)' },
    forest:   { label: 'Forêt',         primary: '#2f6b4f', primary2: '#3f8a66', accent: '#a8c686', bg: 'linear-gradient(160deg,#eaf3ed 0%,#f8fbf9 55%,#f0f4e6 100%)' },
    violet:   { label: 'Violet néon',   primary: '#8b5cf6', primary2: '#a78bfa', accent: '#22d3ee', bg: 'linear-gradient(160deg,#14101f 0%,#1c1630 60%,#0f0d18 100%)', mode: 'dark' },
    rose:     { label: 'Rose poudré',   primary: '#c2477a', primary2: '#dd6e9c', accent: '#f0a3b6', bg: 'linear-gradient(160deg,#fdeef4 0%,#fff9fb 50%,#f7eaf2 100%)' },
    mono:     { label: 'Monochrome',    primary: '#111827', primary2: '#374151', accent: '#9ca3af', bg: '#f4f4f5' }
  };

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  }

  function defaultTheme(preset) {
    var p = PRESETS[preset] || PRESETS.indigo;
    return {
      preset: preset || 'indigo',
      primary: p.primary,
      primary2: p.primary2,
      accent: p.accent,
      bg: p.bg,
      mode: p.mode || 'light',
      card: 'soft',
      radius: 28,
      orbs: true,
      font: 'Montserrat'
    };
  }

  function blankProfile(slug, name) {
    return {
      id: null,
      slug: slug,
      name: name || 'Nouveau profil',
      handle: '@' + slug,
      bio: '',
      avatar: '',
      initials: (name || 'NP').slice(0, 2).toUpperCase(),
      verified: false,
      tags: [],
      theme: defaultTheme('indigo'),
      seo: { title: '', description: '', image: '' },
      contact: { email: '', phone: '', showForm: false, endpoint: '' },
      analytics: { plausible: '', ga4: '', metaPixel: '' },
      socials: [],
      inviteEmail: '',
      ownerId: null,
      links: []
    };
  }

  /* ---------- Règles métier (pures, inchangées) ---------- */
  function isLive(link, now) {
    if (!link.visible) return false;
    var t = (now || new Date()).getTime();
    var s = link.schedule || {};
    if (s.start && t < new Date(s.start).getTime()) return false;
    if (s.end && t > new Date(s.end).getTime()) return false;
    return true;
  }

  function slugify(str) {
    return String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'profil';
  }

  /* ---------- Mapping lignes SQL <-> objets applicatifs ---------- */
  function mapLinkRow(row) {
    return {
      id: row.id, type: row.type, title: row.title || '', subtitle: row.subtitle || '',
      url: row.url || '', icon: row.icon || '', brand: row.brand || null,
      featured: !!row.featured, visible: row.visible !== false, badge: row.badge || '',
      image: row.image || '', showTitle: row.show_title !== false,
      schedule: { start: row.schedule_start || '', end: row.schedule_end || '' },
      clicks: 0
    };
  }

  function mapProfileRow(row) {
    var linkRows = (row.links || []).slice().sort(function (a, b) { return a.position - b.position; });
    return {
      id: row.id, slug: row.slug, name: row.name, handle: row.handle || '', bio: row.bio || '',
      avatar: row.avatar || '', initials: row.initials || '', verified: !!row.verified,
      tags: row.tags || [], theme: row.theme || defaultTheme(), seo: row.seo || {},
      contact: row.contact || {}, analytics: row.analytics || {}, socials: row.socials || [],
      inviteEmail: row.invite_email || '', ownerId: row.owner_id,
      links: linkRows.map(mapLinkRow)
    };
  }

  /* ---------- Authentification ---------- */
  function signIn(email, password) { return sb().auth.signInWithPassword({ email: email, password: password }); }
  function signUp(email, password) { return sb().auth.signUp({ email: email, password: password }); }
  function signOut() { return sb().auth.signOut(); }
  function getSession() { return sb().auth.getSession().then(function (r) { return r.data.session; }); }
  function getUser() { return sb().auth.getUser().then(function (r) { return r.data.user; }); }
  function onAuthChange(fn) { sb().auth.onAuthStateChange(function (event, session) { fn(session); }); }
  function resetPassword(email, redirectTo) { return sb().auth.resetPasswordForEmail(email, { redirectTo: redirectTo }); }
  function updatePassword(password) { return sb().auth.updateUser({ password: password }); }

  /* ---------- Fichiers (logo, photos de liens) ---------- */
  var MEDIA_BUCKET = 'media';
  function uploadFile(profileId, file, prefix) {
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    var path = profileId + '/' + (prefix || 'file') + '-' + Date.now() + '.' + ext;
    return sb().storage.from(MEDIA_BUCKET).upload(path, file, { upsert: true, cacheControl: '3600' })
      .then(function (res) {
        if (res.error) throw res.error;
        return sb().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
      });
  }

  /* ---------- Profils + liens ---------- */
  function load() {
    return sb().from('profiles').select('*, links(*)').order('created_at').then(function (res) {
      if (res.error) throw res.error;
      var profiles = {};
      (res.data || []).forEach(function (row) {
        var p = mapProfileRow(row);
        profiles[p.slug] = p;
      });
      var slugs = Object.keys(profiles);
      return { profiles: profiles, active: slugs[0] || null };
    });
  }

  function getPublicProfile(slug) {
    return sb().from('profiles').select('*, links(*)').eq('slug', slug).maybeSingle().then(function (res) {
      if (res.error || !res.data) return null;
      return mapProfileRow(res.data);
    });
  }

  function syncLinks(profileId, links) {
    return sb().from('links').select('id').eq('profile_id', profileId).then(function (existing) {
      if (existing.error) throw existing.error;
      var existingIds = (existing.data || []).map(function (r) { return r.id; });
      var keepIds = links.map(function (l) { return l.id; });
      var toDelete = existingIds.filter(function (id) { return keepIds.indexOf(id) === -1; });
      var rows = links.map(function (l, i) {
        return {
          id: l.id, profile_id: profileId, position: i, type: l.type,
          title: l.title || '', subtitle: l.subtitle || '', url: l.url || '',
          icon: l.icon || '', brand: l.brand || null,
          featured: !!l.featured, visible: l.visible !== false, badge: l.badge || '',
          image: l.image || null, show_title: l.showTitle !== false,
          schedule_start: (l.schedule && l.schedule.start) || null,
          schedule_end: (l.schedule && l.schedule.end) || null
        };
      });
      var tasks = [];
      if (rows.length) tasks.push(sb().from('links').upsert(rows));
      if (toDelete.length) tasks.push(sb().from('links').delete().in('id', toDelete));
      return Promise.all(tasks);
    }).then(function (results) {
      (results || []).forEach(function (r) { if (r && r.error) throw r.error; });
    });
  }

  function saveProfile(profile) {
    return getUser().then(function (user) {
      var row = {
        slug: profile.slug, name: profile.name, handle: profile.handle, bio: profile.bio,
        avatar: profile.avatar, initials: profile.initials, verified: !!profile.verified,
        tags: profile.tags || [], theme: profile.theme, seo: profile.seo || {},
        contact: profile.contact || {}, analytics: profile.analytics || {}, socials: profile.socials || [],
        invite_email: profile.inviteEmail || null,
        updated_at: new Date().toISOString()
      };
      var q;
      if (profile.id) {
        q = sb().from('profiles').update(row).eq('id', profile.id).select().single();
      } else {
        row.owner_id = profile.inviteEmail ? null : (user && user.id) || null;
        q = sb().from('profiles').insert(row).select().single();
      }
      return q.then(function (res) {
        if (res.error) throw res.error;
        profile.id = res.data.id;
        profile.ownerId = res.data.owner_id;
        return syncLinks(profile.id, profile.links || []);
      }).then(function () { return profile; });
    });
  }

  function deleteProfile(profileId) {
    return sb().from('profiles').delete().eq('id', profileId).then(function (res) {
      if (res.error) throw res.error;
    });
  }

  /* ---------- Statistiques (cache local + rafraîchissement réseau) ---------- */
  var statsCache = {}, statsLoading = {}, statsListeners = [];
  function onStatsUpdate(fn) { statsListeners.push(fn); }
  function notifyStats() { statsListeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function emptyStats() { return { views: 0, clicks: 0, links: {}, days: {} }; }

  function statsFor(profileId) {
    if (!profileId) return emptyStats();
    if (!statsCache[profileId] && !statsLoading[profileId]) refreshStats(profileId);
    return statsCache[profileId] || emptyStats();
  }

  function refreshStats(profileId) {
    statsLoading[profileId] = true;
    return sb().from('link_events').select('kind, link_id, created_at').eq('profile_id', profileId)
      .then(function (res) {
        statsLoading[profileId] = false;
        if (res.error) { console.warn(res.error); return; }
        var s = emptyStats();
        (res.data || []).forEach(function (e) {
          var day = String(e.created_at).slice(0, 10);
          s.days[day] = s.days[day] || { views: 0, clicks: 0 };
          if (e.kind === 'view') { s.views++; s.days[day].views++; }
          else { s.clicks++; s.days[day].clicks++; if (e.link_id) s.links[e.link_id] = (s.links[e.link_id] || 0) + 1; }
        });
        statsCache[profileId] = s;
        notifyStats();
      });
  }

  function resetStats(profileId) {
    return sb().from('link_events').delete().eq('profile_id', profileId).then(function (res) {
      if (res.error) throw res.error;
      delete statsCache[profileId];
      notifyStats();
    });
  }

  function bump(profileId, kind, linkId) {
    // Pas de télémétrie possible sur une page exportée en autonome (pas de SDK/config Supabase) : no-op silencieux.
    if (!profileId || !cfg || !global.supabase) return Promise.resolve();
    return sb().from('link_events').insert({ profile_id: profileId, link_id: linkId || null, kind: kind })
      .then(function (res) { if (res.error) console.warn(res.error); });
  }

  /* ---------- Contacts (leads) ---------- */
  var leadsCache = {}, leadsLoading = {}, leadsListeners = [];
  function onLeadsUpdate(fn) { leadsListeners.push(fn); }
  function notifyLeads() { leadsListeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  function leadsFor(profileId) {
    if (!profileId) return [];
    if (!leadsCache[profileId] && !leadsLoading[profileId]) refreshLeads(profileId);
    return leadsCache[profileId] || [];
  }

  function refreshLeads(profileId) {
    leadsLoading[profileId] = true;
    return sb().from('leads').select('*').eq('profile_id', profileId).order('created_at', { ascending: false })
      .then(function (res) {
        leadsLoading[profileId] = false;
        if (res.error) { console.warn(res.error); return; }
        leadsCache[profileId] = res.data || [];
        notifyLeads();
      });
  }

  function addLead(profileId, lead) {
    // Sur une page exportée en autonome (pas de SDK/config Supabase), rejette proprement
    // pour laisser profile.js basculer sur son repli mailto:.
    if (!cfg || !global.supabase) return Promise.reject(new Error('Supabase non configuré sur cette page.'));
    return sb().from('leads').insert({ profile_id: profileId, name: lead.name, email: lead.email, message: lead.message })
      .then(function (res) { if (res.error) throw res.error; });
  }

  function markLeadRead(leadId, profileId, isRead) {
    return sb().from('leads').update({ is_read: isRead }).eq('id', leadId)
      .then(function (res) { if (res.error) throw res.error; return refreshLeads(profileId); });
  }

  function deleteLead(leadId, profileId) {
    return sb().from('leads').delete().eq('id', leadId)
      .then(function (res) { if (res.error) throw res.error; return refreshLeads(profileId); });
  }

  global.Store = {
    PRESETS: PRESETS,
    uid: uid, blankProfile: blankProfile, defaultTheme: defaultTheme,
    isLive: isLive, slugify: slugify,

    auth: {
      signIn: signIn, signUp: signUp, signOut: signOut,
      getSession: getSession, getUser: getUser, onAuthChange: onAuthChange,
      resetPassword: resetPassword, updatePassword: updatePassword
    },

    load: load, getPublicProfile: getPublicProfile,
    saveProfile: saveProfile, deleteProfile: deleteProfile, uploadFile: uploadFile,
    createProfile: function (opts) {
      var p = blankProfile(opts.slug, opts.name);
      p.inviteEmail = opts.inviteEmail || '';
      return saveProfile(p);
    },

    bump: bump, statsFor: statsFor, resetStats: resetStats, onStatsUpdate: onStatsUpdate,
    leadsFor: leadsFor, addLead: addLead, markLeadRead: markLeadRead, deleteLead: deleteLead, onLeadsUpdate: onLeadsUpdate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.Store;
})(typeof window !== 'undefined' ? window : this);
