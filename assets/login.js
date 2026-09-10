/* ============================================================
   Reely Links — Écran de connexion / inscription
   ============================================================ */
(function () {
  'use strict';

  var body = document.getElementById('authBody');
  var hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  var qs = new URLSearchParams(location.search);
  var oauthError = hash.get('error_description') || qs.get('error_description');

  var GOOGLE_ICON = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-4z"/>' +
    '<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"/>' +
    '<path fill="#4CAF50" d="M24 45c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.4-4.6 2.2-7.5 2.2-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 40.5 16.3 45 24 45z"/>' +
    '<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41 35.9 45 30.6 45 24c0-1.4-.1-2.7-.4-3.5z"/>' +
  '</svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function msg(text, kind) {
    var n = document.getElementById('authMsg');
    if (!n) return;
    n.textContent = text || '';
    n.className = 'auth-msg' + (kind ? ' ' + kind : '');
  }

  /* ---------- Réinitialisation de mot de passe ou 1ère connexion (lien reçu par email) ---------- */
  if (hash.get('type') === 'recovery' || hash.get('type') === 'invite') {
    renderRecovery(hash.get('type') === 'invite');
  } else {
    window.Store.auth.getSession().then(function (session) {
      if (session) { location.href = 'admin.html'; return; }
      render();
    });
  }

  function render() {
    body.innerHTML =
      '<button class="btn btn-ghost btn-block" type="button" id="googleBtn" style="gap:10px">' + GOOGLE_ICON + 'Se connecter avec Google</button>' +
      '<div class="auth-divider"><span>ou</span></div>' +
      '<form class="stack" id="authForm">' +
        '<div class="field"><label for="a-email">Email</label><input class="input" id="a-email" type="email" required autocomplete="email"></div>' +
        '<div class="field"><label for="a-pass">Mot de passe</label><input class="input" id="a-pass" type="password" required minlength="6" autocomplete="current-password"></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Se connecter</button>' +
      '</form>' +
      '<p class="auth-msg" id="authMsg">' + (oauthError ? esc(decodeURIComponent(oauthError.replace(/\+/g, ' '))) : '') + '</p>' +
      '<p class="hint" style="text-align:center;margin-top:10px">Pas encore de compte ? Votre agence vous envoie une invitation par email.</p>' +
      '<div class="auth-foot"><button id="forgot" type="button">Mot de passe oublié ?</button></div>';

    if (oauthError) document.getElementById('authMsg').className = 'auth-msg err';

    document.getElementById('googleBtn').onclick = function () {
      window.Store.auth.signInWithGoogle(location.origin + location.pathname);
    };

    document.getElementById('authForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('a-email').value.trim();
      var pass = document.getElementById('a-pass').value;
      var btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; msg('');

      window.Store.auth.signIn(email, pass).then(function (res) {
        btn.disabled = false;
        if (res.error) { msg(translate(res.error.message), 'err'); return; }
        location.href = 'admin.html';
      });
    });

    var forgot = document.getElementById('forgot');
    if (forgot) forgot.onclick = function () {
      var email = (document.getElementById('a-email').value || '').trim();
      if (!email) { msg('Entrez d’abord votre email ci-dessus.', 'err'); return; }
      window.Store.auth.resetPassword(email, location.origin + location.pathname).then(function (res) {
        if (res.error) { msg(translate(res.error.message), 'err'); return; }
        msg('Email de réinitialisation envoyé.', 'ok');
      });
    };
  }

  function renderRecovery(isInvite) {
    body.innerHTML =
      '<p class="t-body" style="margin-bottom:16px">' + (isInvite ? 'Bienvenue ! Choisissez votre mot de passe pour activer votre compte.' : 'Choisissez un nouveau mot de passe.') + '</p>' +
      '<form class="stack" id="recForm">' +
        '<div class="field"><label for="r-pass">Nouveau mot de passe</label><input class="input" id="r-pass" type="password" required minlength="6" autocomplete="new-password"></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Enregistrer</button>' +
      '</form>' +
      '<p class="auth-msg" id="authMsg"></p>';

    document.getElementById('recForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var pass = document.getElementById('r-pass').value;
      window.Store.auth.updatePassword(pass).then(function (res) {
        if (res.error) { msg(translate(res.error.message), 'err'); return; }
        msg('Mot de passe mis à jour. Redirection…', 'ok');
        setTimeout(function () { location.href = 'admin.html'; }, 1200);
      });
    });
  }

  function translate(m) {
    if (/invalid login credentials/i.test(m)) return 'Email ou mot de passe incorrect.';
    if (/already registered/i.test(m)) return 'Un compte existe déjà avec cet email.';
    if (/password should be at least/i.test(m)) return 'Le mot de passe doit contenir au moins 6 caractères.';
    return m;
  }
})();
