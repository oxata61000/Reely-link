/* ============================================================
   Reely Links — Écran de connexion / inscription
   ============================================================ */
(function () {
  'use strict';

  var body = document.getElementById('authBody');
  var hash = new URLSearchParams(location.hash.replace(/^#/, ''));

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
      '<form class="stack" id="authForm">' +
        '<div class="field"><label for="a-email">Email</label><input class="input" id="a-email" type="email" required autocomplete="email"></div>' +
        '<div class="field"><label for="a-pass">Mot de passe</label><input class="input" id="a-pass" type="password" required minlength="6" autocomplete="current-password"></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Se connecter</button>' +
      '</form>' +
      '<p class="auth-msg" id="authMsg"></p>' +
      '<p class="hint" style="text-align:center;margin-top:10px">Pas encore de compte ? Votre agence vous envoie une invitation par email.</p>' +
      '<div class="auth-foot"><button id="forgot" type="button">Mot de passe oublié ?</button></div>';

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
