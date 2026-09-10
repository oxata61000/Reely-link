/* ============================================================
   Reely Links — Écran de connexion / inscription
   ============================================================ */
(function () {
  'use strict';

  var body = document.getElementById('authBody');
  var hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  var qs = new URLSearchParams(location.search);
  var oauthError = hash.get('error_description') || qs.get('error_description');
  var HCAPTCHA_SITEKEY = window.REELY_HCAPTCHA_SITEKEY || '';

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

  /* ---------- Captcha (hCaptcha) — inactif tant qu'aucune clé n'est configurée ---------- */
  var hcaptchaReady = null;
  function loadHcaptcha() {
    if (!HCAPTCHA_SITEKEY) return Promise.resolve(false);
    if (hcaptchaReady) return hcaptchaReady;
    hcaptchaReady = new Promise(function (resolve) {
      if (window.hcaptcha) { resolve(true); return; }
      var s = document.createElement('script');
      s.src = 'https://js.hcaptcha.com/1/api.js';
      s.async = true; s.defer = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
    return hcaptchaReady;
  }
  function captchaToken() {
    return (HCAPTCHA_SITEKEY && window.hcaptcha) ? window.hcaptcha.getResponse() : '';
  }
  function resetCaptcha() {
    if (HCAPTCHA_SITEKEY && window.hcaptcha) { try { window.hcaptcha.reset(); } catch (e) {} }
  }

  /* ---------- Double authentification (TOTP) — challenge à la connexion ---------- */
  function proceedAfterAuth() {
    window.Store.auth.mfaLevel().then(function (res) {
      var levels = res && res.data;
      if (levels && levels.nextLevel === 'aal2' && levels.currentLevel !== 'aal2') {
        renderMfaChallenge();
      } else {
        location.href = 'admin.html';
      }
    }).catch(function () { location.href = 'admin.html'; });
  }

  function renderMfaChallenge() {
    body.innerHTML =
      '<p class="t-body" style="margin-bottom:16px">Entrez le code à 6 chiffres de votre application d’authentification.</p>' +
      '<form class="stack" id="mfaForm">' +
        '<div class="field"><input class="input mfa-code" id="mfa-code" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="000000" required></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Vérifier</button>' +
      '</form>' +
      '<p class="auth-msg" id="authMsg"></p>';

    var codeInput = document.getElementById('mfa-code');
    codeInput.focus();

    document.getElementById('mfaForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var code = codeInput.value.trim();
      var btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; msg('');

      window.Store.auth.mfaListFactors().then(function (res) {
        var factor = res.data && res.data.totp && res.data.totp.filter(function (f) { return f.status === 'verified'; })[0];
        if (!factor) { btn.disabled = false; msg('Aucun facteur de sécurité actif.', 'err'); return; }
        return window.Store.auth.mfaChallenge(factor.id).then(function (ch) {
          if (ch.error) throw ch.error;
          return window.Store.auth.mfaVerify(factor.id, ch.data.id, code);
        });
      }).then(function (res) {
        btn.disabled = false;
        if (res && res.error) { msg('Code invalide, réessayez.', 'err'); codeInput.value = ''; codeInput.focus(); return; }
        location.href = 'admin.html';
      }).catch(function (err) {
        btn.disabled = false;
        msg((err && err.message) || 'Code invalide, réessayez.', 'err');
      });
    });
  }

  /* ---------- Réinitialisation de mot de passe ou 1ère connexion (lien reçu par email) ---------- */
  if (hash.get('type') === 'recovery' || hash.get('type') === 'invite') {
    renderRecovery(hash.get('type') === 'invite');
  } else {
    window.Store.auth.getSession().then(function (session) {
      if (session) { proceedAfterAuth(); return; }
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
        (HCAPTCHA_SITEKEY ? '<div class="h-captcha" data-sitekey="' + esc(HCAPTCHA_SITEKEY) + '"></div>' : '') +
        '<button class="btn btn-primary btn-block" type="submit">Se connecter</button>' +
      '</form>' +
      '<p class="auth-msg" id="authMsg">' + (oauthError ? esc(decodeURIComponent(oauthError.replace(/\+/g, ' '))) : '') + '</p>' +
      '<p class="hint" style="text-align:center;margin-top:10px">Pas encore de compte ? Votre agence vous envoie une invitation par email.</p>' +
      '<div class="auth-foot"><button id="forgot" type="button">Mot de passe oublié ?</button></div>';

    if (oauthError) document.getElementById('authMsg').className = 'auth-msg err';
    if (HCAPTCHA_SITEKEY) loadHcaptcha();

    document.getElementById('googleBtn').onclick = function () {
      window.Store.auth.signInWithGoogle(location.origin + location.pathname);
    };

    document.getElementById('authForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('a-email').value.trim();
      var pass = document.getElementById('a-pass').value;
      var btn = e.target.querySelector('button[type="submit"]');

      if (HCAPTCHA_SITEKEY && !captchaToken()) { msg('Merci de valider le captcha.', 'err'); return; }

      btn.disabled = true; msg('');
      window.Store.auth.signIn(email, pass, captchaToken()).then(function (res) {
        btn.disabled = false;
        resetCaptcha();
        if (res.error) { msg(translate(res.error.message), 'err'); return; }
        proceedAfterAuth();
      });
    });

    var forgot = document.getElementById('forgot');
    if (forgot) forgot.onclick = function () {
      var email = (document.getElementById('a-email').value || '').trim();
      if (!email) { msg('Entrez d’abord votre email ci-dessus.', 'err'); return; }
      if (HCAPTCHA_SITEKEY && !captchaToken()) { msg('Merci de valider le captcha.', 'err'); return; }
      window.Store.auth.resetPassword(email, location.origin + location.pathname, captchaToken()).then(function (res) {
        resetCaptcha();
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
        setTimeout(proceedAfterAuth, 1200);
      });
    });
  }

  function translate(m) {
    if (/invalid login credentials/i.test(m)) return 'Email ou mot de passe incorrect.';
    if (/already registered/i.test(m)) return 'Un compte existe déjà avec cet email.';
    if (/password should be at least/i.test(m)) return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (/captcha/i.test(m)) return 'Vérification anti-robot invalide, réessayez.';
    return m;
  }
})();
