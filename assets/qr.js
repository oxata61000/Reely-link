/* ============================================================
   Reely Links — Générateur de QR code (mode octet, niveau M)
   Zéro dépendance, zéro appel réseau. Versions 1 à 10 (≤ 213 car.)
   Usage : QR.svg('https://…', { size: 220, dark: '#111', light: '#fff' })
   ============================================================ */
(function (global) {
  'use strict';

  /* ---- Tables (niveau de correction M) ---- */
  //           v:  1   2   3    4    5    6    7    8    9    10
  var TOTAL  = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
  var ECPB   = [0, 10, 16, 26,  18,  24,  16,  18,  22,  22,  26]; // EC par bloc
  var BLOCKS = [0,  1,  1,  1,   2,   2,   4,   4,   4,   5,   5]; // nb de blocs
  var ALIGN  = [[], [], [6,18], [6,22], [6,26], [6,30], [6,34],
                [6,22,38], [6,24,42], [6,26,46], [6,28,50]];

  /* ---- Arithmétique GF(256) ---- */
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    for (var i = 0, x = 1; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1; if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  function rsGenerator(deg) {
    var poly = [1];
    for (var i = 0; i < deg; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gmul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenerator(ecLen);
    var res = new Array(ecLen).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res[0];
      res.shift(); res.push(0);
      if (factor !== 0) for (var j = 0; j < ecLen; j++) res[j] ^= gmul(gen[j + 1], factor);
    }
    return res;
  }

  /* ---- BCH pour les infos de format / version ---- */
  function bchFormat(data) {
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >>> 9) & 1) * 0x537);
    return rem & 0x3ff;
  }
  function bchVersion(v) {
    var rem = v;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ (((rem >>> 11) & 1) * 0x1f25);
    return rem & 0xfff;
  }
  /** Séquence des 15 positions de l'info de format, copie 1 (bit 14 en premier). */
  function fmtSeq1() {
    var s = [], i;
    for (i = 0; i <= 5; i++) s.push([8, i]);
    s.push([8, 7], [8, 8], [7, 8]);
    for (i = 5; i >= 0; i--) s.push([i, 8]);
    return s;
  }
  /** Séquence des 15 positions de l'info de format, copie 2 (bit 14 en premier). */
  function fmtSeq2(n) {
    var s = [], i;
    for (i = 0; i < 7; i++) s.push([n - 1 - i, 8]);
    for (i = 0; i < 8; i++) s.push([8, n - 8 + i]);
    return s;
  }

  /* ---- Encodage des données ---- */
  function toBytes(str) {
    var out = [], enc = unescape(encodeURIComponent(str));
    for (var i = 0; i < enc.length; i++) out.push(enc.charCodeAt(i) & 0xff);
    return out;
  }

  function pickVersion(len) {
    for (var v = 1; v <= 10; v++) {
      var dataCw = TOTAL[v] - ECPB[v] * BLOCKS[v];
      var header = 4 + (v < 10 ? 8 : 16);
      if (dataCw * 8 - header >= len * 8) return v;
    }
    throw new Error('QR : contenu trop long (max ~213 caractères)');
  }

  function buildCodewords(bytes, version) {
    var dataCw = TOTAL[version] - ECPB[version] * BLOCKS[version];
    var bits = [];
    function push(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); }

    push(0b0100, 4);                               // mode octet
    push(bytes.length, version < 10 ? 8 : 16);     // compteur
    bytes.forEach(function (b) { push(b, 8); });

    var cap = dataCw * 8;
    for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);  // terminateur
    while (bits.length % 8) bits.push(0);                           // alignement octet

    var cw = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      cw.push(b);
    }
    var pad = [0xEC, 0x11], pi = 0;
    while (cw.length < dataCw) cw.push(pad[pi++ % 2]);

    // Découpage en blocs (les blocs « longs » sont en fin de série)
    var nb = BLOCKS[version], ecLen = ECPB[version];
    var shortLen = Math.floor(dataCw / nb), longCount = dataCw % nb;
    var dataBlocks = [], ecBlocks = [], pos = 0;
    for (var b2 = 0; b2 < nb; b2++) {
      var len = shortLen + (b2 >= nb - longCount ? 1 : 0);
      var blk = cw.slice(pos, pos + len); pos += len;
      dataBlocks.push(blk);
      ecBlocks.push(rsEncode(blk, ecLen));
    }

    // Entrelacement
    var out = [], maxLen = Math.max.apply(null, dataBlocks.map(function (d) { return d.length; }));
    for (var i2 = 0; i2 < maxLen; i2++)
      for (var b3 = 0; b3 < nb; b3++)
        if (i2 < dataBlocks[b3].length) out.push(dataBlocks[b3][i2]);
    for (var i3 = 0; i3 < ecLen; i3++)
      for (var b4 = 0; b4 < nb; b4++) out.push(ecBlocks[b4][i3]);

    return out;
  }

  /* ---- Construction de la matrice ---- */
  function buildMatrix(codewords, version) {
    var n = version * 4 + 17;
    var m = [], reserved = [];
    for (var i = 0; i < n; i++) { m.push(new Array(n).fill(0)); reserved.push(new Array(n).fill(false)); }

    function set(r, c, v) { m[r][c] = v ? 1 : 0; reserved[r][c] = true; }

    function finder(r0, c0) {
      for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
        var rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
        var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                 (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                 (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        set(rr, cc, on);
      }
    }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);

    // Motifs de synchronisation
    for (var i2 = 8; i2 < n - 8; i2++) { set(6, i2, i2 % 2 === 0); set(i2, 6, i2 % 2 === 0); }

    // Motifs d'alignement
    var ac = ALIGN[version];
    for (var a = 0; a < ac.length; a++) for (var b = 0; b < ac.length; b++) {
      var ar = ac[a], bc = ac[b];
      if ((ar <= 8 && bc <= 8) || (ar <= 8 && bc >= n - 9) || (ar >= n - 9 && bc <= 8)) continue;
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++)
        set(ar + dr, bc + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }

    set(n - 8, 8, 1); // module sombre

    // Réservation des zones d'information de format
    for (var k = 0; k < 9; k++) {
      if (!reserved[8][k]) reserved[8][k] = true;
      if (!reserved[k][8]) reserved[k][8] = true;
    }
    for (var k2 = 0; k2 < 8; k2++) { reserved[8][n - 1 - k2] = true; reserved[n - 1 - k2][8] = true; }

    // Information de version (v ≥ 7)
    if (version >= 7) {
      var vbits = (version << 12) | bchVersion(version);
      for (var i3 = 0; i3 < 18; i3++) {
        var bit = (vbits >> i3) & 1;
        var r1 = Math.floor(i3 / 3), c1 = n - 11 + (i3 % 3);
        set(r1, c1, bit); set(c1, r1, bit);
      }
    }

    // Placement des données en zigzag
    var bitIdx = 0, total = codewords.length * 8;
    function nextBit() {
      if (bitIdx >= total) return 0;
      var b = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
      bitIdx++; return b;
    }
    var up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col = 5;
      for (var s = 0; s < n; s++) {
        var row = up ? n - 1 - s : s;
        for (var d = 0; d < 2; d++) {
          var cc2 = col - d;
          if (!reserved[row][cc2]) { m[row][cc2] = nextBit(); }
        }
      }
      up = !up;
    }
    return { m: m, reserved: reserved, n: n };
  }

  function maskFn(k) {
    return [
      function (r, c) { return (r + c) % 2 === 0; },
      function (r) { return r % 2 === 0; },
      function (r, c) { return c % 3 === 0; },
      function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
      function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
      function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
      function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
    ][k];
  }

  function applyFormat(m, n, mask) {
    var fmt = (0 << 3) | mask;                              // 00 = niveau M
    var val = ((fmt << 10) | bchFormat(fmt)) ^ 0x5412;      // 15 bits
    var s1 = fmtSeq1(), s2 = fmtSeq2(n);
    for (var i = 0; i < 15; i++) {
      var bit = (val >> (14 - i)) & 1;                      // bit 14 placé en premier
      m[s1[i][0]][s1[i][1]] = bit;
      m[s2[i][0]][s2[i][1]] = bit;
    }
    m[n - 8][8] = 1;                                        // module sombre
  }

  function penalty(m, n) {
    var score = 0, r, c, i, run, dark = 0;
    // Règle 1 : séries de 5+
    for (r = 0; r < n; r++) {
      run = 1;
      for (c = 1; c < n; c++) {
        if (m[r][c] === m[r][c - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
    for (c = 0; c < n; c++) {
      run = 1;
      for (r = 1; r < n; r++) {
        if (m[r][c] === m[r - 1][c]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
    // Règle 2 : blocs 2×2
    for (r = 0; r < n - 1; r++) for (c = 0; c < n - 1; c++) {
      var v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
    // Règle 3 : motif 1:1:3:1:1
    var pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], rev = pat.slice().reverse();
    function match(arr, at, p) {
      for (var k = 0; k < p.length; k++) if (arr[at + k] !== p[k]) return false;
      return true;
    }
    for (r = 0; r < n; r++) {
      var rowArr = m[r];
      for (c = 0; c + 11 <= n; c++) if (match(rowArr, c, pat) || match(rowArr, c, rev)) score += 40;
    }
    for (c = 0; c < n; c++) {
      var colArr = []; for (r = 0; r < n; r++) colArr.push(m[r][c]);
      for (r = 0; r + 11 <= n; r++) if (match(colArr, r, pat) || match(colArr, r, rev)) score += 40;
    }
    // Règle 4 : équilibre clair / sombre
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (m[r][c]) dark++;
    var pct = dark * 100 / (n * n);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return score;
  }

  /** Renvoie la matrice de modules (tableau 2D de 0/1). */
  function matrix(text) {
    var bytes = toBytes(text);
    var version = pickVersion(bytes.length);
    var cw = buildCodewords(bytes, version);
    var built = buildMatrix(cw, version);
    var n = built.n, reserved = built.reserved;

    var best = null, bestScore = Infinity;
    for (var k = 0; k < 8; k++) {
      var mm = built.m.map(function (row) { return row.slice(); });
      var fn = maskFn(k);
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++)
        if (!reserved[r][c] && fn(r, c)) mm[r][c] ^= 1;
      applyFormat(mm, n, k);
      var s = penalty(mm, n);
      if (s < bestScore) { bestScore = s; best = mm; }
    }
    return best;
  }

  /** Renvoie un SVG prêt à insérer. */
  function svg(text, opts) {
    opts = opts || {};
    var m = matrix(text), n = m.length;
    var quiet = opts.quiet == null ? 4 : opts.quiet;
    var total = n + quiet * 2;
    var size = opts.size || 220;
    var dark = opts.dark || '#111c2d';
    var light = opts.light || '#ffffff';

    var path = '';
    for (var r = 0; r < n; r++) {
      var c = 0;
      while (c < n) {
        if (!m[r][c]) { c++; continue; }
        var start = c;
        while (c < n && m[r][c]) c++;
        path += 'M' + (start + quiet) + ' ' + (r + quiet) + 'h' + (c - start) + 'v1h-' + (c - start) + 'z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
           '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
           '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>' +
           '<path d="' + path + '" fill="' + dark + '"/></svg>';
  }

  global.QR = { matrix: matrix, svg: svg };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.QR;
})(typeof window !== 'undefined' ? window : this);
