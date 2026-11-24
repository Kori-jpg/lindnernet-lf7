/* LindnerNet – Intranet der Lindner Bürowelt am Main KG (Modellunternehmen für den Unterricht).
   Keine Konten, kein Tracking: Kürzel und Lernstand bleiben im Browser. Inhalte werden erst mit dem Code der Stunde entschlüsselt. */
(function () {
  'use strict';

  var SITE = (document.documentElement.getAttribute('data-bundles') || 'lf7').split(',')[0];
  /* Eigene Schlüssel je Seite: LF 7 und LF 8 liegen auf derselben Adresse (kori-jpg.github.io) und teilen sich den Speicher. */
  var K_USER = 'lb' + SITE.replace(/\D/g, '') + '_user', K_CODE = 'lb' + SITE.replace(/\D/g, '') + '_code';
  var app = document.getElementById('app');
  var side = document.getElementById('side');
  var topbar = document.getElementById('topbar');
  var tabs = document.getElementById('tabs');
  var foot = document.getElementById('foot');
  var bundle = null, SH = null;

  /* ---------- Hilfen ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat/gesperrt */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } }
  };

  function h(tag, attrs) {
    var el = document.createElement(tag), i, k;
    if (attrs) for (k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === 'class') el.className = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') el.appendChild(rich(attrs[k]));
      else el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    for (i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  /* **fett** sicher in Knoten umwandeln (kein innerHTML) */
  function rich(text) {
    var f = document.createDocumentFragment();
    String(text).split(/(\*\*[^*]+\*\*)/g).forEach(function (part) {
      if (/^\*\*[^*]+\*\*$/.test(part)) f.appendChild(h('strong', null, part.slice(2, -2)));
      else if (part) f.appendChild(document.createTextNode(part));
    });
    return f;
  }
  function paras(body) {
    return (Array.isArray(body) ? body : [body]).map(function (p) {
      if (Array.isArray(p)) return h('ul', { class: 'clean' }, p.map(function (li) { return h('li', { html: li }); }));
      return h('p', { html: p });
    });
  }
  function initials(name) { return name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ul(items) { return h('ul', { class: 'clean' }, items.map(function (x) { return h('li', null, x); })); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i'); }

  /* ---------- Icons (eigene Strichzeichnungen, als SVG-Knoten) ---------- */
  var ICONS = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3',
    briefcase: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
    book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 19v2H6',
    users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8',
    cap: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6',
    mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
    calendar: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
    building: 'M5 21V4h10v17M15 9h4v12M3 21h18M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z',
    userplus: 'M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a7 7 0 0 1 14 0M19 7v6M16 10h6',
    idcard: 'M3 5h18v14H3zM8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.5 16a3 3 0 0 1 5 0M14 10h4M14 14h4',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    euro: 'M17 6.5a6.5 6.5 0 1 0 0 11M4 10.5h9M4 13.5h9',
    file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
    scale: 'M12 4v16M7 20h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z',
    trending: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
    chat: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
    alert: 'M12 3l10 18H2zM12 10v5M12 18v.01',
    compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
    lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
    logout: 'M10 4H5v16h5M14 8l4 4-4 4M9 12h9',
    shield: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    chevron: 'M9 6l6 6-6 6',
    folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
    key: 'M8 15a4 4 0 1 1 3.5-6H21v3h-2v3h-3v-3h-4.5A4 4 0 0 1 8 15z',
    cards: 'M4 7h12v13H4zM8 4h12v13'
  };
  ICONS.handshake = ICONS.briefcase;
  function icon(name, cls) {
    var NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true');
    p.setAttribute('d', ICONS[name] || ICONS.file); s.appendChild(p); return s;
  }

  /* ---------- Entschlüsselung ---------- */
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function decrypt(enc, code) {
    var te = new TextEncoder();
    return crypto.subtle.importKey('raw', te.encode(normCode(code)), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(enc.salt), iterations: enc.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    }).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enc.iv) }, key, b64(enc.ct));
    }).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }
  function deriveKey(code, salt, iter) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(normCode(code)), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(salt), iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    });
  }
  function gcmOpen(key, box) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(box.iv) }, key, b64(box.ct)).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); }); }
  var LOGIN = null;
  function loginFile() {
    if (LOGIN) return Promise.resolve(LOGIN);
    return fetch('content/' + SITE + '.enc.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('fetch'); return r.json(); }).then(function (e) { LOGIN = e; return e; });
  }
  /* Prüft einen Code gegen alle Fächer der Anmeldedatei. Ergebnis: { k, units } oder null */
  function openSlot(code) {
    return loginFile().then(function (enc) {
      return deriveKey(code, enc.salt, enc.iter).then(function (key) {
        var i = 0;
        function next() { if (i >= enc.slots.length) return null; return gcmOpen(key, enc.slots[i++]).then(null, next); }
        return next();
      });
    });
  }
  /* Anmeldung: Code öffnet ein Fach, das Fach den Grundinhalt. Ergebnis: { data, units } oder null */
  function unlock(code) {
    return openSlot(code).then(function (slot) {
      if (!slot) return null;
      return crypto.subtle.importKey('raw', b64(slot.k), 'AES-GCM', false, ['decrypt'])
        .then(function (key) { return gcmOpen(key, LOGIN); })
        .then(function (data) { return { data: data, units: slot.units || [] }; });
    }).then(null, function () { return null; });
  }
  function normUser(k) { return String(k || '').toUpperCase().replace(/[^A-ZÄÖÜ]/g, ''); }
  /* Früheren Lernstand (vor dem Kürzel-Login) einmalig auf das erste Kürzel dieses Geräts übernehmen */
  function migrate(id) {
    var flag = 'ln_migr_' + SITE.replace(/\D/g, ''), re = new RegExp(SITE + '(?=_|$)');
    if (LS.get(flag, 0)) return;
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (re.test(k) && k.indexOf('@') < 0) keys.push(k); }
      keys.forEach(function (k) { var n = k.replace(re, id); if (localStorage.getItem(n) == null) localStorage.setItem(n, localStorage.getItem(k)); localStorage.removeItem(k); });
    } catch (e) { /* egal */ }
    LS.set(flag, 1);
  }
  function addUnits(list) {
    var l = LS.get(ckey(), []);
    (list || []).forEach(function (u) { if (!l.some(function (x) { return x.f === u.f; })) l.push({ c: u.c, f: u.f }); });
    LS.set(ckey(), l);
  }
  function setBundle(data, user) {
    bundle = data; SH = data ? data.shared : null;
    if (!data) return;
    bundle.kuerzel = user; bundle.id = SITE + '@' + user;
    ['mails', 'chat', 'ablage', 'tools', 'news', 'termine', 'units'].forEach(function (k) { if (!bundle[k]) bundle[k] = []; });
    bundle._applied = {}; bundle.stunden = []; bundle.fileStunde = {};
    tagStunde(bundle, bundle.stunde || { id: 'basis', t: 'Grundlagen' });
  }

  /* ---------- Stunden und Modus (Unterricht / Üben) ---------- */
  function tagStunde(u, st) {
    if (!bundle.stunden.some(function (x) { return x.id === st.id; })) bundle.stunden.push(st);
    function tag(x) { if (x && !x._s) x._s = st.id; }
    ['mails', 'tools', 'news', 'termine', 'modules'].forEach(function (k) { (u[k] || []).forEach(tag); });
    (u.chat || []).forEach(function (c) { (c.msgs || []).forEach(tag); });
    (u.ablage || []).forEach(function (o) { (o.docs || []).forEach(tag); });
  }
  function modus() { return LS.get('ln_mode_' + bundle.id, { m: 'ue', s: null }); }
  function setModus(m, sid) { var o = modus(); o.m = m; if (sid !== undefined) o.s = sid; LS.set('ln_mode_' + bundle.id, o); }
  function aktStunde() { var o = modus(); return bundle.stunden.filter(function (x) { return x.id === o.s; })[0] || null; }
  function unterricht() { return modus().m === 'u' && !!aktStunde(); }
  /* Gehört ein Eintrag zur gewählten Stunde? Im Übungsmodus gilt alles. */
  function inS(x) { return !unterricht() || (x && x._s === modus().s); }
  function chatsS() { return bundle.chat.filter(function (c) { return !unterricht() || c.msgs.some(inS); }); }
  function stundeLabel(st) { return st.t + (st.d ? ' (' + st.d + ')' : ''); }
  function modusBar() {
    var st = aktStunde(), u = unterricht();
    return h('a', { class: 'modebar ' + (u ? 'm-u' : 'm-ue'), href: '#/code' }, icon(u ? 'briefcase' : 'cap'),
      h('span', null, h('b', null, u ? 'Unterricht: ' + st.t : 'Üben: alles, was du freigeschaltet hast'), h('span', null, u ? 'Du siehst nur, was zu dieser Stunde gehört.' : 'Neuer Code oder zurück zum Unterricht? Hier entlang.')),
      h('span', { class: 'modebar-go' }, 'Code & Modus', icon('chevron')));
  }

  /* ---------- Lernstand (nur lokal) ---------- */
  function pkey() { return 'lb_p_' + bundle.id; }
  function prog() { return LS.get(pkey(), { done: {}, notes: {} }); }
  function setDone(modId, idx, pts, max) { var p = prog(); var k = modId + ':' + idx; var old = p.done[k]; if (!old || pts >= old.pts) p.done[k] = { pts: pts, max: max }; LS.set(pkey(), p); }
  function isDone(modId, idx) { return !!prog().done[modId + ':' + idx]; }
  function modProgress(m) { var p = prog(), n = 0; m.steps.forEach(function (s, i) { if (p.done[m.id + ':' + i]) n++; }); return n / m.steps.length; }
  function badgeCount() { return openTasks().length + unreadMails().length + unreadChat(); }
  function totalPoints() { var p = prog(), t = 0, k; for (k in p.done) t += p.done[k].pts || 0; return t; }
  // Lernpfad: Einträge mit Datum (d) werden automatisch erledigt bzw. aktuell, feste Angaben (s) haben Vorrang.
  function roadList() {
    var t = todayIso(), now = false;
    return bundle.road.map(function (r) {
      var st = r.s;
      if (!st && r.d) { if (r.d < t) st = 'done'; else if (!now) { st = 'now'; now = true; } }
      else if (st === 'now') now = true;
      return { t: r.t, s: st };
    });
  }
  function locked(m) { return !bundle.lehrer && m.ab && Date.now() < Date.parse(m.ab); }
  function mod(id) { return bundle.modules.filter(function (x) { return x.id === id; })[0]; }
  // Abgeschlossen: Die Stunde ist gehalten (bis-Datum vorbei). Der Auftrag bleibt zum Wiederholen, zählt aber nicht mehr als offen.
  function archived(m) { return !!m.bis && todayIso() > m.bis; }
  function openTasks() { return bundle.modules.filter(function (m) { return inS(m) && !locked(m) && !archived(m) && modProgress(m) < 1; }); }
  function seenNews() { return LS.get('ln_news_' + bundle.id, {}); }
  function markNews(id) { var s = seenNews(); if (!s[id]) { s[id] = 1; LS.set('ln_news_' + bundle.id, s); } }

  /* ---------- Datum ---------- */
  var WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  function dparts(iso) { var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return d; }
  function fmtDate(iso) { return dparts(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  function fmtShort(iso) { var d = dparts(iso); return WT[d.getDay()] + ' ' + ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.'; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function termine() { return SH.termine.concat((bundle.termine || []).filter(inS)).sort(function (a, b) { return (a.d + a.z).localeCompare(b.d + b.z); }); }

  /* ---------- Personen ---------- */
  function person(nr) { return SH.personen.filter(function (p) { return p.nr === nr; })[0]; }
  function pname(p) { return p.vor + ' ' + p.nach; }
  function abt(id) { return SH.abteilungen.filter(function (a) { return a.id === id; })[0]; }
  var STATUS = { da: 'im Haus', mobil: 'mobiles Arbeiten', aussen: 'Außentermin', weg: 'abwesend' };
  function avatar(p, cls) { return h('span', { class: 'av a-' + p.abt + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' }, p.vor[0] + p.nach[0]); }
  function personRow(p, extra) {
    return h('a', { class: 'prow', href: '#/person/' + p.nr }, avatar(p),
      h('span', { class: 'prow-t' }, h('b', null, pname(p)), h('span', null, extra || p.fn)),
      h('span', { class: 'st st-' + p.st }, STATUS[p.st]));
  }

  /* ---------- Rahmen: Seitenleiste, Kopfzeile, Handy-Leiste ---------- */
  var NAV = [
    { r: '', n: 'Start', k: 'Start', i: 'home' },
    { r: 'aktuelles', n: 'Aktuelles', k: 'Aktuelles', i: 'news' },
    { r: 'arbeitsplatz', n: 'Mein Arbeitsplatz', k: 'Arbeit', i: 'briefcase' },
    { r: 'wissen', n: 'Wissen & Vorlagen', k: 'Wissen', i: 'book' },
    { r: 'unternehmen', n: 'Unternehmen', k: 'Firma', i: 'building' },
    { r: 'akademie', n: 'Akademie', k: 'Akademie', i: 'cap' },
    { r: 'code', n: 'Code & Modus', k: 'Code', i: 'key' }
  ];
  var SECTION = { mail: 'arbeitsplatz', tool: 'arbeitsplatz', doc: 'arbeitsplatz', news: 'aktuelles', postfach: 'arbeitsplatz', app: 'arbeitsplatz', m: 'arbeitsplatz', wiki: 'wissen', person: 'unternehmen', kollegen: 'unternehmen', leitbild: 'unternehmen', lindner: 'unternehmen' };
  function navLinks(sec, short) {
    var open = badgeCount();
    return NAV.map(function (it) {
      var on = it.r === sec;
      return h('a', { href: '#/' + it.r, class: on ? 'on' : null, 'aria-current': on ? 'page' : null },
        h('span', { class: 'ni' }, icon(it.i), it.r === 'arbeitsplatz' && open ? h('span', { class: 'badge', 'aria-label': open + ' offene Aufträge' }, String(open)) : null),
        h('span', { class: 'nl' }, short ? it.k : it.n));
    });
  }
  function searchForm(q) {
    var inp = h('input', { type: 'search', placeholder: 'Suchen …', 'aria-label': 'LindnerNet durchsuchen', value: q || '' });
    return h('form', { class: 'sform', role: 'search', onsubmit: function (e) { e.preventDefault(); var v = inp.value.trim(); if (v) location.hash = '#/suche/' + encodeURIComponent(v); } }, icon('search'), inp);
  }
  function renderChrome(route) {
    var first = route.split('/')[0], sec = SECTION[first] || first, q = first === 'suche' ? decodeURIComponent(route.slice(6)) : '';
    side.textContent = ''; topbar.textContent = ''; tabs.textContent = ''; foot.textContent = '';
    document.body.className = bundle ? '' : 'anon';
    if (!bundle) {
      add(foot, [h('p', null, 'LindnerNet ist ein Lernangebot zum Unterricht. Die Lindner Bürowelt am Main KG ist ein Modellunternehmen: Alle Namen, Personen und Daten sind frei erfunden.'),
        h('p', null, 'Diese Seite braucht keinen Namen und kein Konto. Dein Kürzel bleibt nur auf diesem Gerät.')]);
      return;
    }
    add(side, [
      h('a', { class: 'side-logo', href: '#/', 'aria-label': 'LindnerNet Startseite' }, h('img', { src: 'assets/logo_kurz_weiss.png', alt: '' }), h('span', null, 'LindnerNet')),
      h('nav', { class: 'side-nav', 'aria-label': 'Hauptnavigation' }, navLinks(sec, false)),
      h('div', { class: 'side-foot' }, h('a', { href: '#/datenschutz' }, icon('shield'), 'Datenschutz & Nutzung'))
    ]);
    add(topbar, [
      h('a', { class: 'top-logo', href: '#/', 'aria-label': 'LindnerNet Startseite' }, h('img', { src: 'assets/logo_kurz_weiss.png', alt: '' })),
      searchForm(q),
      h('a', { class: 'me', href: '#/ich', 'aria-label': 'Mein Profil: ' + bundle.user.stelle }, h('span', { class: 'me-t' }, h('b', null, bundle.user.stelle), h('span', null, abt(bundle.user.abt).name)), h('span', { class: 'av a-' + bundle.user.abt }, bundle.kuerzel))
    ]);
    add(tabs, navLinks(sec, true));
    add(foot, [h('p', null, 'LindnerNet · Modellunternehmen für den Unterricht. Alle Namen, Personen und Daten sind frei erfunden.'),
      h('p', null, h('a', { href: '#/datenschutz' }, 'Datenschutz & Nutzung'), ' · ', h('a', { href: '#/unternehmen' }, 'Über Lindner'))]);
  }

  function go() {
    var route = location.hash.replace(/^#\/?/, ''), parts = route.split('/');
    if (!bundle) { renderChrome(''); app.textContent = ''; viewLogin(); window.scrollTo(0, 0); return; }
    renderChrome(route);
    app.textContent = '';
    document.body.classList.toggle('lehrer', !!bundle.lehrer);
    document.body.classList.toggle('beamer', !!(bundle.lehrer && LS.get('ln_beamer', 0)));
    if (bundle.lehrer) add(app, h('div', { class: 'lbar' }, h('span', null, icon('key'), h('b', null, 'Lehrermodus'), ' · alle Inhalte sichtbar'),
      h('button', { type: 'button', class: 'chip', onclick: function () { LS.set('ln_beamer', LS.get('ln_beamer', 0) ? 0 : 1); go(); } }, LS.get('ln_beamer', 0) ? 'Normale Schrift' : 'Beamer-Schrift'),
      h('button', { type: 'button', class: 'chip', onclick: endLehrer }, 'Beenden')));
    switch (parts[0]) {
      case 'aktuelles': viewAktuelles(); break;
      case 'news': viewNews(parts[1]); break;
      case 'arbeitsplatz': viewArbeitsplatz(); break;
      case 'postfach': viewPostfach(); break;
      case 'app': viewApp(parts[1]); break;
      case 'm': viewModule(parts[1], parseInt(parts[2] || '0', 10)); break;
      case 'wissen': if (parts[1] === 'karten') viewKarten(); else viewWissen(); break;
      case 'glossar': viewWissen(); break;
      case 'wiki': viewWiki(parts[1], parseInt(parts[2] || '0', 10)); break;
      case 'kollegen': viewKollegen(parts[1]); break;
      case 'person': viewPerson(parseInt(parts[1], 10)); break;
      case 'unternehmen': case 'lindner': viewUnternehmen(); break;
      case 'leitbild': viewLeitbild(); break;
      case 'akademie': viewAkademie(); break;
      case 'code': viewCode(); break;
      case 'suche': viewSuche(decodeURIComponent(route.slice(6))); break;
      case 'datenschutz': viewDatenschutz(); break;
      case 'ich': viewIch(); break;
      case 'mail': viewMail(parts[1]); break;
      case 'tool': viewTool(parts[1]); break;
      case 'doc': viewDoc(parts[1]); break;
      default: viewStart();
    }
    window.scrollTo(0, 0);
  }
  function crumb(items) {
    var el = h('p', { class: 'crumb' });
    items.forEach(function (it, i) { if (i) add(el, ' › '); add(el, it[1] ? h('a', { href: it[1] }, it[0]) : h('span', null, it[0])); });
    return el;
  }
  function head(title, sub) { return h('div', { class: 'phead' }, h('h1', null, title), sub ? h('p', { class: 'muted' }, sub) : null); }

  /* ---------- Anmeldung ---------- */
  var UEBUNGSCODE = 'UEBEN';
  function viewLogin() {
    var user = h('input', { type: 'text', name: 'username', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: '3', placeholder: 'z. B. ABC', 'aria-label': 'Benutzername: dein Kürzel aus drei Buchstaben', required: true, value: LS.get(K_USER, '') || null });
    var input = h('input', { type: 'text', name: 'code', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Code der Stunde', 'aria-label': 'Passwort: Code der Stunde', required: true });
    var msg = h('div', { role: 'status', 'aria-live': 'polite' });
    var btn = h('button', { class: 'btn', type: 'submit' }, 'Anmelden');
    function bad(t) { msg.textContent = ''; add(msg, h('p', { class: 'msg bad' }, t)); }
    var form = h('form', { class: 'login-form', onsubmit: function (e) {
      e.preventDefault();
      var k = normUser(user.value);
      if (k.length !== 3) { bad('Dein Benutzername ist ein Kürzel aus genau drei Buchstaben, zum Beispiel ABC.'); user.focus(); return; }
      if (!window.crypto || !crypto.subtle) { bad('Dieser Browser kann LindnerNet nicht öffnen. Bitte nutze einen aktuellen Browser und die Adresse mit https.'); return; }
      btn.disabled = true; btn.textContent = 'Prüfe …'; msg.textContent = '';
      unlock(input.value).then(function (r) {
        if (!r) { btn.disabled = false; btn.textContent = 'Anmelden'; bad('Dieser Code passt nicht. Bitte prüfe die Schreibweise oder frage deine Lehrkraft.'); return; }
        btn.textContent = 'Lade Stunde …';
        setBundle(r.data, k); migrate(bundle.id);
        LS.set(K_USER, k); LS.set(K_CODE, normCode(input.value));
        // Erst nach dem Laden der Stunden-Einheiten anzeigen, sonst blitzt kurz der Übungsmodus auf
        useCode(r).then(function () { if (location.hash === '#/' || !location.hash) go(); else location.hash = '#/'; });
      });
    } },
      h('label', { class: 'fld' }, h('span', null, 'Benutzername'), user, h('small', null, 'Dein Kürzel aus drei Buchstaben. Kein echter Name nötig.')),
      h('label', { class: 'fld' }, h('span', null, 'Passwort'), input, h('small', null, 'Den Code der Stunde bekommst du von deiner Lehrkraft.')),
      btn);
    add(app, h('div', { class: 'login' },
      h('img', { class: 'login-logo', src: 'assets/logo_weiss.png', alt: 'Lindner Bürowelt am Main KG' }),
      h('div', { class: 'login-card' },
        h('div', { class: 'kicker' }, 'Intranet'), h('h1', null, 'LindnerNet'),
        form, msg),
      h('div', { class: 'login-ueben' }, icon('key'),
        h('div', null, h('b', null, 'Nur üben?'), h('span', null, 'Mit dem Code ', h('code', null, UEBUNGSCODE), ' kommst du jederzeit zu den Übungen.')),
        h('button', { class: 'btn sec', type: 'button', onclick: function () { input.value = UEBUNGSCODE; (user.value ? btn : user).focus(); } }, 'Einsetzen'))));
  }

  /* ---------- Bausteine ---------- */
  function appDef(id) { return bundle.apps.filter(function (a) { return a.id === id; })[0]; }
  function appActive(a) { return !a.ab; }
  var SHARED_APPS = [
    { href: '#/aktuelles', name: 'News', icon: 'news', farbe: 'rot' },
    { href: '#/aktuelles', name: 'Kalender', icon: 'calendar', farbe: 'tuerkis', anchor: 'kalender' },
    { href: '#/kollegen', name: 'Personen', icon: 'users', farbe: 'lila' },
    { href: '#/unternehmen', name: 'Unternehmen', icon: 'building', farbe: 'navy' },
    { href: '#/leitbild', name: 'Leitbild', icon: 'star', farbe: 'orange', nur: 'leitbild' },
    { href: '#/wissen', name: 'Wiki', icon: 'book', farbe: 'gruen' },
    { href: '#/akademie', name: 'Akademie', icon: 'cap', farbe: 'orange' }
  ];
  function tile(href, name, ic, farbe, opt) {
    opt = opt || {};
    return h('a', { class: 'tile' + (opt.ab ? ' off' : ''), href: href },
      h('span', { class: 'tile-i c-' + farbe }, icon(ic), opt.badge ? h('span', { class: 'badge' }, String(opt.badge)) : null),
      h('span', { class: 'tile-n' }, name),
      opt.ab ? h('span', { class: 'tile-ab' }, 'ab ' + opt.ab) : null);
  }
  function roleTiles() {
    var open = openTasks().length + unreadMails().length;
    return bundle.apps.map(function (a) {
      var n = 0;
      if (a.id === 'postfach') n = open;
      else if (a.id === 'chat') n = unreadChat();
      else (a.mods || []).forEach(function (id) { var m = mod(id); if (m && inS(m) && !locked(m) && modProgress(m) < 1) n++; });
      return tile(a.id === 'postfach' ? '#/postfach' : '#/app/' + a.id, a.name, a.icon, a.farbe, { ab: a.ab, badge: n });
    });
  }
  function sharedTiles() { return SHARED_APPS.filter(function (a) { return !a.nur || SH.firma[a.nur]; }).map(function (a) { return tile(a.href, a.name, a.icon, a.farbe); }); }
  function taskRow(m) {
    var meta = (bundle.post || {})[m.id] || {}, von = meta.von ? person(meta.von) : null;
    if (locked(m)) {
      return h('div', { class: 'trow locked' }, h('span', { class: 'av a-none', 'aria-hidden': 'true' }, icon('lock')),
        h('span', { class: 'trow-t' }, h('b', null, 'Neuer Auftrag angekündigt'), h('span', null, 'Erscheint am ' + fmtDate(m.ab) + ' im Postfach.')));
    }
    var pr = modProgress(m), arch = archived(m), state = pr >= 1 ? ['erledigt', 'g'] : arch ? ['zum Wiederholen', ''] : pr > 0 ? ['in Arbeit', 'o'] : ['neu', 'n'];
    return h('a', { class: 'trow' + (pr === 0 && !arch ? ' unread' : ''), href: '#/m/' + m.id },
      von ? avatar(von) : h('span', { class: 'av a-none', 'aria-hidden': 'true' }, icon('mail')),
      h('span', { class: 'trow-t' },
        h('span', { class: 'trow-from' }, von ? pname(von) : 'Lindner Bürowelt', meta.d ? h('time', null, fmtShort(meta.d)) : null),
        h('b', null, meta.betreff || m.title), h('span', null, m.intro),
        h('span', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pr * 100)), 'aria-label': 'Fortschritt' }, h('i', { style: 'width:' + Math.round(pr * 100) + '%' }))),
      h('span', { class: 'pill ' + state[1] }, state[0]));
  }
  function lsRow(m) {
    var pr = modProgress(m), n = m.steps.filter(function (s) { return INTERACTIVE[s.t] && s.t !== 'reflect'; }).length;
    return h('a', { class: 'lrow', href: '#/m/' + m.id }, h('span', { class: 'lrow-i ls-i' }, m.icon || icon('folder')),
      h('span', { class: 'lrow-t' }, h('b', null, m.thema || m.title), h('span', null, (m.std ? m.std + ' · ' : '') + '„' + m.title + '“' + (n ? ' · ' + n + (n === 1 ? ' Übung' : ' Übungen') : ''))),
      pr >= 1 ? h('span', { class: 'pill g' }, 'erledigt') : icon('chevron'));
  }

  function newsCard(n, big) {
    var von = person(n.von), neu = !seenNews()[n.id];
    return h('a', { class: 'ncard' + (big ? ' big' : ''), href: '#/news/' + n.id },
      h('span', { class: 'ncard-m' }, h('span', { class: 'kat' }, n.kat), h('time', null, fmtDate(n.d)), neu ? h('span', { class: 'pill n' }, 'neu') : null),
      h('b', null, n.titel), h('span', { class: 'ncard-t' }, n.teaser),
      h('span', { class: 'ncard-a' }, avatar(von, 'sm'), pname(von)));
  }
  function eventList(max) {
    var t = todayIso(), list = termine().filter(function (e) { return e.d >= t; });
    if (max) list = list.slice(0, max);
    if (!list.length) return h('p', { class: 'muted' }, 'Keine anstehenden Termine.');
    return h('ul', { class: 'events' }, list.map(function (e) {
      var d = dparts(e.d);
      return h('li', null, h('span', { class: 'ev-d' }, h('b', null, ('0' + d.getDate()).slice(-2)), d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')),
        h('span', { class: 'ev-t' }, h('b', null, e.t), h('span', null, [WT[d.getDay()], e.z ? e.z + ' Uhr' : null, e.o || null].filter(Boolean).join(' · '))));
    }));
  }
  function section(title, more, body) {
    return h('section', { class: 'sec' }, h('div', { class: 'sec-h' }, h('h2', null, title), more ? h('a', { href: more[1] }, more[0], icon('chevron')) : null), body);
  }

  /* ---------- Start ---------- */
  function viewStart() {
    var hr = new Date().getHours(), gruss = hr < 11 ? 'Guten Morgen!' : hr < 17 ? 'Guten Tag!' : 'Guten Abend!';
    var open = inbox().filter(function (x) { return x.neu; }), chef = person(bundle.user.chef), gfp = person(SH.gf.von);
    var heute = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    add(app, modusBar());
    add(app, h('section', { class: 'greet' },
      h('div', null, h('p', { class: 'greet-d' }, heute), h('h1', null, gruss),
        h('p', null, open.length ? (open.length === 1 ? 'Du hast 1 neue Nachricht oder offenen Auftrag.' : 'Du hast ' + open.length + ' neue Nachrichten und offene Aufträge.') : 'Alles erledigt. Stark!', ' ', bundle.user.hinweis)),
      open.length ? h('div', { class: 'greet-tasks' }, open.slice(0, 3).map(function (x) {
        return h('a', { href: x.href }, icon('mail'), h('span', null, h('b', null, x.betreff), h('span', null, 'von ' + (x.von ? pname(person(x.von)) : pname(chef)))), icon('chevron'));
      })) : null));
    if (unreadChat()) add(app, h('a', { class: 'chatping', href: '#/app/chat' }, avatar(person(chatsS()[0].mit), 'sm'), h('span', null, h('b', null, pname(person(chatsS()[0].mit)) + ' im Chat'), h('span', null, lastMsg().x)), h('span', { class: 'badge' }, String(unreadChat()))));

    if (!LS.get('ln_tour', 0)) {
      var tour = h('section', { class: 'tour' }, h('h2', null, 'Neu im LindnerNet? So findest du dich zurecht'),
        h('ol', null,
          h('li', null, h('b', null, 'Mein Arbeitsplatz: '), 'Hier liegen deine Aufträge. Eine rote Zahl zeigt, was noch offen ist.'),
          h('li', null, h('b', null, 'Wissen & Vorlagen: '), 'Nachschlagen wie im echten Betrieb: Leitfäden, Fachbegriffe, Lernkarten.'),
          h('li', null, h('b', null, 'Unternehmen: '), 'Wer wir sind: Steckbrief, Leitbild, Kolleginnen und Kollegen.'),
          h('li', null, h('b', null, 'Akademie: '), 'Üben für Schulaufgabe und Abschlussprüfung, mit Tipps auf Abruf. Dein Lernstand bleibt nur auf diesem Gerät.')),
        h('button', { class: 'btn sec', type: 'button', onclick: function () { LS.set('ln_tour', 1); tour.remove(); } }, 'Verstanden'));
      add(app, tour);
    }

    add(app, h('section', { class: 'gf' },
      h('img', { src: SH.gf.bild, alt: SH.gf.bildtext }),
      h('div', { class: 'gf-b' }, h('div', { class: 'kicker' }, 'Aus der Geschäftsführung'), h('h2', null, SH.gf.titel), h('p', null, SH.gf.text),
        h('a', { class: 'gf-a', href: '#/person/' + gfp.nr }, avatar(gfp, 'sm'), h('span', null, h('b', null, pname(gfp)), ' · ' + gfp.fn)))));

    add(app, section('Aktuelles', ['Alle News', '#/aktuelles'], h('div', { class: 'ngrid' }, allNews().slice(0, 3).map(function (n) { return newsCard(n); }))));
    add(app, section('Meine Apps', ['Mein Arbeitsplatz', '#/arbeitsplatz'], h('div', { class: 'tiles' }, roleTiles())));
    add(app, section('Lindner allgemein', null, h('div', { class: 'tiles' }, sharedTiles())));

    add(app, h('div', { class: 'cols' },
      section('Nächste Termine', ['Kalender', '#/aktuelles'], h('div', { class: 'card' }, eventList(4))),
      section('Neu bei Lindner & Jubiläen', null, h('div', { class: 'card' },
        h('ul', { class: 'social' }, SH.neu.map(function (x) { var p = person(x.nr); return h('li', null, h('a', { href: '#/person/' + p.nr }, avatar(p, 'sm'), h('span', null, h('b', null, pname(p)), h('span', null, 'Willkommen · ' + x.t)))); }),
          SH.jubilaeen.map(function (x) { var p = person(x.nr); return h('li', null, h('a', { href: '#/person/' + p.nr }, avatar(p, 'sm'), h('span', null, h('b', null, pname(p)), h('span', null, 'Jubiläum · ' + x.t)))); })),
        h('p', { class: 'small muted', style: 'margin:10px 0 0' }, 'Veröffentlicht mit Einwilligung der genannten Personen.')))));
  }

  /* ---------- Aktuelles ---------- */
  function viewAktuelles() {
    add(app, head('Aktuelles', 'Neuigkeiten und Termine aus dem Haus'));
    add(app, h('div', { class: 'ngrid two' }, allNews().map(function (n, i) { return newsCard(n, i === 0); })));
    add(app, section('Kalender', null, h('div', { class: 'card', id: 'kalender' }, eventList(0))));
  }
  function viewNews(id) {
    var n = allNews().filter(function (x) { return x.id === id; })[0];
    if (!n) { location.hash = '#/aktuelles'; return; }
    markNews(id);
    var von = person(n.von);
    add(app, [crumb([['Aktuelles', '#/aktuelles'], [n.kat]]),
      h('article', { class: 'card article' }, h('div', { class: 'ncard-m' }, h('span', { class: 'kat' }, n.kat), h('time', null, fmtDate(n.d))), h('h1', null, n.titel),
        h('p', { class: 'lead' }, n.teaser), paras(n.text),
        h('a', { class: 'gf-a', href: '#/person/' + von.nr }, avatar(von, 'sm'), h('span', null, h('b', null, pname(von)), ' · ' + von.fn))),
      h('a', { class: 'btn sec', href: '#/aktuelles' }, '← Alle News')]);
  }

  /* ---------- Mein Arbeitsplatz ---------- */
  function viewArbeitsplatz() {
    add(app, head('Mein Arbeitsplatz', bundle.user.stelle + ' · ' + abt(bundle.user.abt).name));
    var akt = inbox().filter(function (x) { return !x.arch; }), alt = bundle.modules.filter(function (m) { return inS(m) && !locked(m) && archived(m); }).reverse();
    add(app, section('Aktuell im Postfach', ['Alle Nachrichten', '#/postfach'], h('div', { class: 'card list' }, akt.length ? akt.map(function (x) { return x.row(); }) : h('p', { class: 'muted' }, 'Gerade liegt kein neuer Auftrag vor. Unten kannst du abgeschlossene Lernsituationen wiederholen.'))));
    if (alt.length) add(app, section('Abgeschlossen – zum Wiederholen', ['Akademie', '#/akademie'], h('div', { class: 'card list' }, alt.map(lsRow))));
    add(app, section('Meine Apps', null, h('div', { class: 'tiles' }, roleTiles())));
    var tl = visibleTools();
    if (tl.length) add(app, section('Werkzeuge', null, h('div', { class: 'card list' }, tl.map(toolRow))));
    add(app, modusBar());
    add(app, h('p', { class: 'small muted' }, 'Graue Apps werden im Lauf des Schuljahres freigeschaltet. Die Kalenderwoche (KW) steht darunter.'));
  }
  function viewPostfach() {
    var a = appDef('postfach');
    add(app, [crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], [a.name]]), head(a.name, a.info),
      modusBar(), h('div', { class: 'card list' }, inboxRows())]);
  }
  function wikiFor(modIds) {
    return (bundle.wiki || []).filter(function (w) { var m = mod(w.m); return m && !locked(m) && (!modIds || modIds.indexOf(w.m) >= 0); });
  }
  function wikiRow(w) {
    var s = mod(w.m).steps[w.s];
    return h('a', { class: 'lrow', href: '#/wiki/' + w.m + '/' + w.s }, h('span', { class: 'lrow-i' }, icon('file')), h('span', { class: 'lrow-t' }, h('b', null, s.title), h('span', null, 'Leitfaden · ' + mod(w.m).title)), icon('chevron'));
  }
  function viewApp(id) {
    var a = appDef(id);
    if (!a) { location.hash = '#/arbeitsplatz'; return; }
    if (a.id === 'postfach') { location.hash = '#/postfach'; return; }
    if (a.id === 'chat' || a.id === 'ablage') { add(app, crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], [a.name]])); (a.id === 'chat' ? viewChat : viewAblage)(a); return; }
    add(app, [crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], [a.name]]),
      h('div', { class: 'apphead' }, h('span', { class: 'tile-i c-' + a.farbe }, icon(a.icon)), h('div', null, h('h1', null, a.name), h('p', { class: 'muted' }, a.info)))]);
    if (!appActive(a)) {
      add(app, h('div', { class: 'card empty' }, icon('lock'), h('h2', null, 'Wird ab ' + a.ab + ' freigeschaltet'),
        h('p', { class: 'muted' }, 'Diese App brauchst du erst später im Schuljahr. Deine aktuellen Aufträge findest du im Postfach.'), h('a', { class: 'btn', href: '#/postfach' }, 'Zum Postfach')));
      return;
    }
    var mods = (a.mods || []).map(mod).filter(Boolean).filter(inS);
    var mails = bundle.mails.filter(inS).filter(function (m) { return (m.att || []).some(function (t) { var tt = toolDef(t.tool); return tt && tt.app === a.id; }); });
    add(app, section('Aufträge', null, h('div', { class: 'card list' }, mails.map(mailRow), mods.map(taskRow))));
    var tl = visibleTools().filter(function (t) { return t.app === a.id; });
    if (tl.length) add(app, section('Werkzeuge', null, h('div', { class: 'card list' }, tl.map(toolRow))));
    var w = wikiFor(a.mods || []);
    if (w.length) add(app, section('Nachschlagen', ['Wissen & Vorlagen', '#/wissen'], h('div', { class: 'card list' }, w.map(wikiRow))));
  }

  /* ---------- Auftrag (Modul) ---------- */
  function viewModule(id, idx) {
    var m = mod(id);
    if (!m || locked(m)) { location.hash = '#/postfach'; return; }
    if (isNaN(idx) || idx < 0 || idx >= m.steps.length) idx = 0;
    var s = m.steps[idx];
    add(app, crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], ['Postfach', '#/postfach'], [m.title]]));
    add(app, h('div', { class: 'stepper', 'aria-hidden': 'true' }, m.steps.map(function (_, i) { return h('i', { class: i === idx ? 'cur' : (isDone(m.id, i) ? 'done' : null) }); })));
    var box = h('section', { class: 'card' }, h('div', { class: 'kicker' }, 'Schritt ' + (idx + 1) + ' von ' + m.steps.length + (s.k ? ' · ' + s.k : '')), s.title ? h('h2', null, s.title) : null, s.lead ? h('p', { html: s.lead }) : null);
    add(app, box);
    var done = function (pts, max) { setDone(m.id, idx, pts || 0, max || 0); };
    (RENDER[s.t] || RENDER.info)(s, box, done, m.id + ':' + idx);
    if (!INTERACTIVE[s.t]) done(0, 0);
    add(app, h('div', { class: 'stepnav' },
      idx > 0 ? h('a', { class: 'btn sec', href: '#/m/' + m.id + '/' + (idx - 1) }, '← Zurück') : h('span'),
      idx < m.steps.length - 1 ? h('a', { class: 'btn', href: '#/m/' + m.id + '/' + (idx + 1) }, 'Weiter →') : h('a', { class: 'btn', href: '#/postfach' }, 'Fertig ✓')));
  }

  var INTERACTIVE = { quiz: 1, sort: 1, calc: 1, reflect: 1 };
  var RENDER = {
    mail: function (s, box) {
      if (s.review) add(box, h('div', { class: 'review' }, h('div', { class: 'small muted' }, s.review.head), h('div', null, h('strong', null, s.review.name), ' ', h('span', { class: 'stars', 'aria-label': s.review.stars + ' von 5 Sternen' }, '★★★★★'.slice(0, s.review.stars), h('span', null, '★★★★★'.slice(s.review.stars))), ' ', h('span', { class: 'small muted' }, s.review.when)), h('p', { style: 'margin:.4em 0 0' }, s.review.text)));
      add(box, h('div', { class: 'mail' },
        h('div', { class: 'mail-h' }, h('div', { class: 'ava', 'aria-hidden': 'true' }, initials(s.from)), h('div', null, h('b', null, s.from), s.role ? ' · ' + s.role : null, h('div', { class: 'meta' }, 'An: ' + s.to + ' · ' + s.date))),
        h('div', { class: 'mail-s' }, s.subject), h('div', { class: 'mail-b' }, paras(s.body)),
        h('div', { class: 'mail-f' }, 'Gesendet über das Postfach der Lindner Bürowelt am Main KG · interne Nachricht')));
      (s.att || []).forEach(function (a) { add(box, attachment(a)); });
    },
    chat: function (s, box) {
      var talk = [h('div', { class: 'callbar' }, h('span', { 'aria-hidden': 'true' }, s.icon || '📞'), s.bar),
        h('div', { class: 'chat' }, s.lines.map(function (l) { return h('div', { class: 'bub' + (l.r ? ' r' : '') }, h('small', null, l.w), l.x); }))];
      if (s.fold) add(box, h('details', { class: 'att talk' }, h('summary', null, '📞 Gespräch nachlesen'), h('div', { class: 'att-b' }, talk)));
      else add(box, talk);
      if (s.task) add(box, h('p', { class: 'why', html: s.task }));
    },
    info: function (s, box) {
      (s.items || []).forEach(function (it) {
        add(box, h('div', { class: 'info' }, h('h3', null, it.h), it.sub ? h('div', { class: 'sub' }, it.sub) : null, it.p ? paras(it.p) : null, it.ex ? h('div', { class: 'ex' }, it.ex) : null));
      });
      if (s.scheme) add(box, scheme(s.scheme));
      if (s.merk) add(box, h('div', { class: 'merk', html: s.merk }));
      (s.att || []).forEach(function (a) { add(box, attachment(a)); });
    },
    // Gestufte Hilfe: Tipp 1 (Hinweis oder zwei falsche Antworten weg), Tipp 2 (Nachschlagen), zweiter Versuch nach einem Fehler.
    // Volle Punkte gibt es nur ohne Hilfe im ersten Versuch, sonst einen halben Punkt.
    quiz: function (s, box, done) {
      var answered = 0, right = 0, res = h('div', { role: 'status', 'aria-live': 'polite' });
      s.qs.forEach(function (q, qi) {
        var st = { tips: 0, tries: 0, over: false }, fb = h('div', { 'aria-live': 'polite' }), tipBox = h('div');
        var btns = q.a.map(function (txt, ai) {
          return h('button', { class: 'opt', type: 'button', onclick: function () {
            if (st.over) return;
            if (ai === q.c) finish(true);
            else if (st.tries === 0 && q.a.length > 2) {
              st.tries = 1; btns[ai].classList.add('bad'); btns[ai].disabled = true; fb.textContent = '';
              add(fb, h('div', { class: 'fb bad' }, 'Noch nicht ganz. Du hast einen zweiten Versuch.'));
              if (st.tips === 0) { st.tips = 1; }
              paintTips();
            } else { btns[ai].classList.add('bad'); finish(false); }
          } }, txt);
        });
        function finish(ok) {
          st.over = true; fb.textContent = '';
          btns.forEach(function (b, bi) { b.disabled = true; if (bi === q.c) b.classList.add('ok'); });
          var pts = ok ? (st.tips || st.tries ? 0.5 : 1) : 0; right += pts;
          add(fb, h('div', { class: 'why' }, h('strong', null, ok ? (pts === 1 ? 'Richtig. ' : 'Richtig, mit Hilfe. ') : 'Die richtige Antwort ist markiert. '), q.why ? rich(q.why) : null));
          paintTips();
          if (++answered === s.qs.length) { done(right, s.qs.length); add(res, result(right, s.qs.length, function () { go(); })); }
        }
        function paintTips() { helpSteps(tipBox, st, { tip: q.tip, help: q.help || s.help, joker: function () { joker(btns, q.c); } }, paintTips); }
        add(box, h('div', { class: 'q' }, h('p', null, (qi + 1) + '. ', rich(q.q)), q.ctx ? h('div', { class: 'ex', style: 'margin-bottom:8px' }, q.ctx) : null, h('div', { class: 'opts' }, btns), tipBox, fb));
        paintTips();
      });
      add(box, res);
    },
    sort: function (s, box, done) {
      var items = shuffle(s.items), i = 0, right = 0;
      var area = h('div', { 'aria-live': 'polite' });
      add(box, area);
      function show() {
        area.textContent = '';
        if (i >= items.length) { done(right, items.length); add(area, result(right, items.length, function () { go(); })); return; }
        var it = items[i], fb = h('div'), tipBox = h('div'), st = { tips: 0, tries: 0, over: false };
        var btns = s.buckets.map(function (b, bi) {
          return h('button', { class: 'opt', type: 'button', onclick: function () {
            if (st.over) return;
            var ok = bi === it.b;
            if (!ok && st.tries === 0 && s.buckets.length > 2) {
              st.tries = 1; btns[bi].classList.add('bad'); btns[bi].disabled = true; fb.textContent = '';
              add(fb, h('div', { class: 'fb bad' }, 'Noch nicht ganz. Du hast einen zweiten Versuch.'));
              if (st.tips === 0) st.tips = 1;
              paintTips(); return;
            }
            st.over = true; fb.textContent = '';
            btns.forEach(function (x, xi) { x.disabled = true; if (xi === it.b) x.classList.add('ok'); });
            var pts = ok ? (st.tips || st.tries ? 0.5 : 1) : 0; right += pts; if (!ok) btns[bi].classList.add('bad');
            add(fb, h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') }, ok ? (pts === 1 ? 'Richtig!' : 'Richtig, mit Hilfe.') : 'Richtig wäre: ' + s.buckets[it.b], it.why ? ' ' + it.why : ''));
            add(fb, h('button', { class: 'btn', type: 'button', onclick: function () { i++; show(); } }, i === items.length - 1 ? 'Auswertung' : 'Nächste Karte →'));
            paintTips();
          } }, b);
        });
        function paintTips() { helpSteps(tipBox, st, { tip: it.tip, help: it.help || s.help, joker: function () { joker(btns, it.b); } }, paintTips); }
        add(area, [h('p', { class: 'small muted' }, 'Karte ' + (i + 1) + ' von ' + items.length), h('div', { class: 'sortcard' }, it.x), h('div', { class: 'buckets' }, btns), tipBox, fb]);
        paintTips();
      }
      show();
    },
    calc: function (s, box, done) {
      var ci = 0, area = h('div'); add(box, area);
      function show() {
        area.textContent = '';
        var c = s.cases[ci];
        var sol = { brutto: c.brutto, ist: c.ist, diff: c.brutto - c.ist, ab: c.ab, zu: c.zu, netto: c.brutto - c.ist + c.ab - c.zu };
        var fields = [['brutto', 'Bruttopersonalbedarf (Stellenplan)'], ['ist', '− Ist-Personalbestand'], ['diff', '= Unterdeckung (+) / Überdeckung (−)'], ['ab', '+ Abgänge'], ['zu', '− Zugänge'], ['netto', '= Nettopersonalbedarf']];
        var inputs = {}, fb = h('div', { role: 'status', 'aria-live': 'polite' });
        add(area, [
          s.cases.length > 1 ? h('p', null, h('span', { class: 'pill' }, 'Fall ' + (ci + 1) + ' von ' + s.cases.length), c.tag ? h('span', { class: 'pill o' }, c.tag) : null) : null,
          h('div', { class: 'note' }, h('strong', null, c.title), h('ul', { class: 'clean' }, c.lines.map(function (l) { return h('li', null, l); }))),
          h('form', { class: 'calc', onsubmit: function (e) {
            e.preventDefault(); var ok = 0; fb.textContent = '';
            fields.forEach(function (f) { var good = String(inputs[f[0]].value).trim() !== '' && Number(inputs[f[0]].value) === sol[f[0]]; inputs[f[0]].className = good ? 'ok' : 'bad'; if (good) ok++; });
            done(ok === fields.length ? 3 : 0, 3);
            if (ok === fields.length) add(fb, h('div', { class: 'fb ok' }, 'Alles richtig!'));
            else add(fb, [h('div', { class: 'fb bad' }, ok + ' von ' + fields.length + ' Feldern stimmen. Prüfe die rot markierten Felder.' + (c.hint ? ' Tipp: ' + c.hint : '')),
              h('button', { class: 'btn ghost', type: 'button', onclick: function () { fields.forEach(function (f) { inputs[f[0]].value = sol[f[0]]; inputs[f[0]].className = 'ok'; }); } }, 'Lösung anzeigen')]);
          } }, fields.map(function (f) { inputs[f[0]] = h('input', { type: 'number', inputmode: 'numeric', 'aria-label': f[1] }); return h('label', null, h('span', null, f[1]), inputs[f[0]]); }),
            h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn', type: 'submit' }, 'Prüfen'),
              s.cases.length > 1 ? h('button', { class: 'btn sec', type: 'button', onclick: function () { ci = (ci + 1) % s.cases.length; show(); } }, 'Nächster Fall') : null)),
          fb]);
      }
      show();
    },
    reflect: function (s, box, done, key) {
      var p = prog(), ta = h('textarea', { 'aria-label': s.title || 'Deine Antwort', placeholder: s.ph || '' }), saved = h('span', { class: 'small muted', role: 'status' });
      ta.value = p.notes[key] || '';
      ta.addEventListener('input', function () { var q = prog(); q.notes[key] = ta.value; LS.set(pkey(), q); saved.textContent = ' Gespeichert auf diesem Gerät.'; if (ta.value.trim().length > 15) done(1, 1); });
      if (s.chips) add(box, h('div', { style: 'margin-bottom:10px' }, s.chips.map(function (c) { return h('span', { class: 'pill' }, c); })));
      add(box, [ta, h('p', { class: 'small muted', style: 'margin-top:8px' }, 'Deine Antwort wird nicht gesendet. Sie bleibt nur in diesem Browser, damit du sie im Unterricht vorlesen kannst.', saved)]);
    }
  };

  // Nimmt die Hälfte der falschen Antworten aus dem Spiel.
  function joker(btns, c) {
    var wrong = [], open = 0;
    btns.forEach(function (b, i) { if (!b.disabled) { open++; if (i !== c) wrong.push(b); } });
    shuffle(wrong).slice(0, Math.max(1, Math.floor(wrong.length / 2))).forEach(function (b) { if (open > 2) { b.disabled = true; b.classList.add('gone'); open--; } });
  }
  // Zeigt die bisher geholten Tipps und den Knopf für den nächsten. o: { tip: Text, help: { m, s } Verweis auf einen Wissens-Schritt, joker: Funktion }
  function helpSteps(el, st, o, repaint) {
    var hm = o.help ? mod(o.help.m) : null, hs = hm ? hm.steps[o.help.s] : null, max = hs ? 2 : 1;
    el.textContent = '';
    if (st.tips >= 1) {
      if (!st.jok && !o.tip) { st.jok = 1; o.joker(); }
      add(el, h('div', { class: 'tip' }, h('b', null, 'Tipp 1: '), o.tip ? rich(o.tip) : 'Ein Teil der falschen Antworten ist jetzt ausgegraut.'));
    }
    if (st.tips >= 2 && hs) add(el, h('details', { class: 'tip', open: 'open' }, h('summary', null, h('b', null, 'Tipp 2: '), 'Nachschlagen – ' + hs.title),
      h('div', { class: 'tip-b' }, (hs.items || []).map(function (it) { return h('div', { class: 'tip-i' }, h('b', null, it.h + ': '), h('span', { html: Array.isArray(it.p) ? it.p.join(' ') : (it.p || '') }), it.ex ? h('em', null, ' ' + it.ex) : null); }))));
    if (!st.over && st.tips < max) add(el, h('button', { type: 'button', class: 'btn ghost tipbtn', onclick: function () { st.tips++; repaint(); } }, '💡 ', st.tips ? 'Noch einen Tipp' : 'Tipp anzeigen', ' (' + (st.tips + 1) + ' von ' + max + ')'));
  }
  function attachment(a) {
    return h('details', { class: 'att' }, h('summary', null, '📎 ', a.name),
      h('div', { class: 'att-b' }, a.pre ? h('pre', { class: 'doc' }, a.pre) : null, a.quote ? h('p', null, h('em', null, a.quote)) : null, a.body ? paras(a.body) : null));
  }
  function scheme(rows) {
    return h('table', { class: 'scheme' }, h('tbody', null, rows.map(function (r) { return h('tr', { class: r[2] ? 'sum' : null }, h('td', null, r[0]), h('td', null, r[1])); })));
  }
  function result(right, total, again) {
    var pct = right / total, text = pct === 1 ? 'Stark, alles richtig!' : pct >= 0.7 ? 'Gut gemacht!' : 'Schau dir die Erklärungen noch einmal an.';
    return h('div', { class: 'score' }, h('b', null, String(right).replace('.', ',') + ' / ' + total), h('p', null, text), h('button', { class: 'btn sec', type: 'button', onclick: again }, 'Noch einmal'));
  }


  /* ---------- Freischalt-Codes (Stunden-Codes und Lehrermodus) ---------- */
  function ckey() { return 'ln_codes_' + bundle.id; }
  function applyUnit(u) {
    if (!u || (u.key && bundle._applied[u.key])) return;
    if (u.key) bundle._applied[u.key] = 1;
    tagStunde(u, u.stunde || { id: u.key || 'einheit', t: 'Stunde' });
    (u.mails || []).forEach(function (m) { bundle.mails.push(m); });
    (u.tools || []).forEach(function (t) { bundle.tools.push(t); });
    (u.news || []).forEach(function (n) { bundle.news.push(n); });
    (u.termine || []).forEach(function (t) { bundle.termine.push(t); });
    (u.chat || []).forEach(function (c) {
      var ex = bundle.chat.filter(function (x) { return x.id === c.id; })[0];
      if (ex) ex.msgs = ex.msgs.concat(c.msgs); else bundle.chat.push({ id: c.id, mit: c.mit, msgs: c.msgs.slice() });
    });
    (u.ablage || []).forEach(function (o) {
      var ex = bundle.ablage.filter(function (x) { return x.ordner === o.ordner; })[0];
      if (ex) ex.docs = ex.docs.concat(o.docs); else bundle.ablage.push({ ordner: o.ordner, docs: o.docs.slice() });
    });
  }
  function applyData(d, f) {
    if (d.lehrer) { bundle.lehrer = true; (d.units || []).forEach(applyUnit); }
    else { applyUnit(d); if (f && d.stunde) bundle.fileStunde[f] = d.stunde.id; }
  }
  function fetchEnc(file) { return fetch('content/' + file + '.enc.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('fetch'); return r.json(); }); }
  function tryCode(code, files) {
    var i = 0;
    function next() {
      if (i >= files.length) return Promise.resolve(null);
      var f = files[i++];
      return fetchEnc(f).then(function (enc) { return decrypt(enc, code); }).then(function (d) { return { f: f, d: d }; }, function () { return next(); });
    }
    return next();
  }
  function unitFiles() { return bundle.units.concat(bundle.lehrerFile ? [bundle.lehrerFile] : []); }
  function loadUnits() {
    var list = LS.get(ckey(), []), chain = Promise.resolve();
    list.forEach(function (e) {
      chain = chain.then(function () { return tryCode(e.c, [e.f]); }).then(function (r) { if (r) applyData(r.d, r.f); });
    });
    return chain.then(null, function () { /* offline ohne Kopie: weiter ohne Einheit */ });
  }
  function endLehrer() {
    LS.set(ckey(), LS.get(ckey(), []).filter(function (e) { return e.f !== bundle.lehrerFile; }));
    LS.del('ln_beamer'); location.hash = '#/'; location.reload();
  }
  /* Code anwenden: neue Einheiten laden, dann die Stunde des Codes zeigen (Übungscode: Übungsmodus) */
  function useCode(r) {
    var have = LS.get(ckey(), []), neu = (r.units || []).filter(function (u) { return !have.some(function (x) { return x.f === u.f; }); });
    addUnits(neu);
    return loadUnits().then(function () {
      var last = (r.units || []).filter(function (u) { return u.f !== bundle.lehrerFile; }).slice(-1)[0];
      var sid = last ? bundle.fileStunde[last.f] : null, lehrer = (r.units || []).some(function (u) { return u.f === bundle.lehrerFile; });
      if (sid) setModus('u', sid); else setModus('ue');
      return { neu: neu.length, lehrer: lehrer, st: aktStunde() };
    });
  }
  function codeBox() {
    var input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Code', 'aria-label': 'Code der heutigen Stunde' });
    var msg = h('div', { role: 'status', 'aria-live': 'polite' }), btn = h('button', { class: 'btn', type: 'submit' }, 'Los');
    return h('section', { class: 'codebox' }, icon('key'),
      h('div', null, h('b', null, 'Code der heutigen Stunde'), h('span', null, 'Gib den Code ein, den deine Lehrkraft nennt. Dann siehst du genau das, was ihr heute braucht.'),
        h('form', { class: 'code-form', onsubmit: function (e) {
          e.preventDefault(); var c = normCode(input.value); if (!c) return;
          msg.textContent = '';
          btn.disabled = true; btn.textContent = 'Prüfe …';
          openSlot(c).then(null, function () { return null; }).then(function (r) {
            if (!r) { btn.disabled = false; btn.textContent = 'Los'; add(msg, h('p', { class: 'msg bad' }, 'Dieser Code passt nicht. Prüfe die Schreibweise.')); return; }
            useCode(r).then(function (x) { location.hash = x.lehrer ? '#/arbeitsplatz' : '#/'; go(); });
          });
        } }, input, btn), msg));
  }
  function viewCode() {
    var u = unterricht(), st = aktStunde() || bundle.stunden[bundle.stunden.length - 1];
    function seg(val, label, sub, dis) {
      var on = (val === 'u') === u;
      return h('button', { type: 'button', class: 'seg' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', disabled: dis || null,
        onclick: function () { if (val === 'u') setModus('u', st.id); else setModus('ue'); go(); } }, h('b', null, label), h('span', null, sub));
    }
    add(app, [head('Code & Modus', 'Code der Stunde eingeben und zwischen Unterricht und Üben wechseln'),
      codeBox(),
      section('Modus', null, h('div', { class: 'segs', role: 'group', 'aria-label': 'Modus wählen' },
        seg('u', 'Unterricht', st ? st.t : 'Erst einen Stunden-Code eingeben', !st),
        seg('ue', 'Üben', 'Alles, was du freigeschaltet hast, dazu die Akademie'))),
      section('Deine Stunden', null, h('div', { class: 'card list' }, bundle.stunden.slice().reverse().map(function (x) {
        var akt = u && st && st.id === x.id;
        return h('button', { type: 'button', class: 'lrow srow' + (akt ? ' on' : ''), onclick: function () { setModus('u', x.id); location.hash = '#/'; } },
          h('span', { class: 'lrow-i' }, icon(akt ? 'check' : 'calendar')),
          h('span', { class: 'lrow-t' }, h('b', null, x.t), h('span', null, (x.d || '') + (akt ? (x.d ? ' · ' : '') + 'wird gerade gezeigt' : ''))),
          icon('chevron'));
      }))),
      h('p', { class: 'small muted' }, 'Im Unterricht siehst du nur Nachrichten, Aufträge, Ablage und Werkzeuge der gewählten Stunde. Beim Üben siehst du alles, was du bisher freigeschaltet hast. Dein Lernstand bleibt in beiden Modi gleich.')]);
  }



  /* ---------- Postfach: Mails und Aufträge ---------- */
  function seen(kind) { return LS.get('ln_' + kind + '_' + bundle.id, {}); }
  function markSeen(kind, id, val) { var s = seen(kind); if (s[id] !== (val || 1)) { s[id] = val || 1; LS.set('ln_' + kind + '_' + bundle.id, s); } }
  function unreadMails() { var s = seen('mail'); return bundle.mails.filter(function (m) { return inS(m) && !s[m.id]; }); }
  function unreadChat() { var s = seen('chat'), n = 0; chatsS().forEach(function (c) { n += Math.max(0, c.msgs.length - (s[c.id] || 0)); }); return n; }
  function lastMsg() { var c = chatsS()[0]; return c.msgs[c.msgs.length - 1]; }
  function allNews() { return SH.news.concat(bundle.news.filter(inS)).sort(function (a, b) { return b.d.localeCompare(a.d); }); }
  function inbox() {
    var s = seen('mail'), items = bundle.mails.filter(inS).map(function (m) { return { d: m.d + (m.z || ''), neu: !s[m.id], von: m.von, betreff: m.betreff, href: '#/mail/' + m.id, row: function () { return mailRow(m); } }; });
    bundle.modules.filter(inS).forEach(function (m) {
      var meta = (bundle.post || {})[m.id] || {};
      items.push({ arch: !locked(m) && archived(m), d: (meta.d || '') + '99', neu: !locked(m) && !archived(m) && modProgress(m) < 1, von: meta.von, betreff: meta.betreff || m.title, href: '#/m/' + m.id, row: function () { return taskRow(m); } });
    });
    return items.sort(function (a, b) { return b.d.localeCompare(a.d); });
  }
  function inboxRows() { return inbox().map(function (x) { return x.row(); }); }
  function mailRow(m) {
    var von = person(m.von), neu = !seen('mail')[m.id];
    return h('a', { class: 'trow' + (neu ? ' unread' : ''), href: '#/mail/' + m.id }, avatar(von),
      h('span', { class: 'trow-t' }, h('span', { class: 'trow-from' }, pname(von), h('time', null, fmtShort(m.d) + (m.z ? ', ' + m.z : ''))),
        h('b', null, m.betreff), h('span', null, (m.att || []).length ? '📎 ' + m.att.map(function (a) { return a.name; }).join(', ') : '')),
      neu ? h('span', { class: 'pill n' }, 'neu') : null);
  }
  function viewMail(id) {
    var m = bundle.mails.filter(function (x) { return x.id === id; })[0];
    if (!m) { location.hash = '#/postfach'; return; }
    markSeen('mail', id);
    var von = person(m.von);
    add(app, [crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], ['Postfach', '#/postfach'], [m.betreff]]),
      h('div', { class: 'card' }, h('div', { class: 'mail' },
        h('div', { class: 'mail-h' }, avatar(von), h('div', null, h('b', null, pname(von)), ' · ' + von.fn, h('div', { class: 'meta' }, 'An: ' + m.an + (m.cc ? ' · Cc: ' + m.cc : '') + ' · ' + fmtShort(m.d) + (m.z ? ', ' + m.z : '')))),
        h('div', { class: 'mail-s' }, m.betreff), h('div', { class: 'mail-b' }, paras(m.body)),
        (m.att || []).length ? h('div', { class: 'mail-att' }, m.att.map(function (a) {
          return h('a', { class: 'attfile', href: a.tool ? '#/tool/' + a.tool : '#/doc/' + a.doc }, h('span', { class: 'lrow-i' }, icon('file')), h('span', { class: 'lrow-t' }, h('b', null, a.name), h('span', null, 'Anhang öffnen')), icon('chevron'));
        })) : null,
        h('div', { class: 'mail-f' }, 'Interne Nachricht · Lindner Bürowelt am Main KG'))),
      h('a', { class: 'btn sec', href: '#/postfach' }, '← Postfach')]);
  }

  /* ---------- Chat ---------- */
  function viewChat(a) {
    add(app, h('div', { class: 'apphead' }, h('span', { class: 'tile-i c-' + a.farbe }, icon(a.icon)), h('div', null, h('h1', null, a.name), h('p', { class: 'muted' }, a.info))));
    if (!chatsS().length) { add(app, h('div', { class: 'card empty' }, icon('chat'), h('h2', null, 'Noch keine Nachrichten'), h('p', { class: 'muted' }, 'Sobald dir jemand schreibt, erscheint es hier.'))); return; }
    chatsS().forEach(function (c) {
      var p = person(c.mit), lastDay = '';
      var box = h('div', { class: 'card chatwin' }, h('div', { class: 'chat-h' }, avatar(p), h('span', null, h('b', null, pname(p)), h('span', { class: 'st st-' + p.st }, STATUS[p.st]))));
      var list = h('div', { class: 'chat' });
      c.msgs.forEach(function (m) {
        if (m.d !== lastDay) { lastDay = m.d; add(list, h('div', { class: 'chat-day' }, fmtShort(m.d))); }
        add(list, h('div', { class: 'bub' + (m.von === 'ich' ? ' r' : '') }, m.x, h('small', { class: 'chat-t' }, m.z)));
      });
      add(box, [list, h('p', { class: 'small muted', style: 'margin:10px 0 0' }, 'Antworten gibst du im Unterricht, nicht hier im Chat.')]);
      add(app, box);
      markSeen('chat', c.id, c.msgs.length);
    });
  }

  /* ---------- Ablage ---------- */
  function allDocs() { var r = []; bundle.ablage.forEach(function (o) { o.docs.forEach(function (d) { r.push({ o: o.ordner, d: d }); }); }); return r; }
  function docRow(d) {
    return h('a', { class: 'lrow', href: '#/doc/' + d.id }, h('span', { class: 'lrow-i doc-' + (d.art || 'PDF').toLowerCase() }, h('span', { class: 'doc-art' }, d.art || 'PDF')),
      h('span', { class: 'lrow-t' }, h('b', null, d.titel), d.info ? h('span', null, d.info) : null), icon('chevron'));
  }
  function viewAblage(a) {
    add(app, h('div', { class: 'apphead' }, h('span', { class: 'tile-i c-' + a.farbe }, icon(a.icon)), h('div', null, h('h1', null, a.name), h('p', { class: 'muted' }, a.info))));
    var ordner = bundle.ablage.map(function (o) { return { ordner: o.ordner, docs: o.docs.filter(inS) }; }).filter(function (o) { return o.docs.length; });
    if (!ordner.length) { add(app, h('div', { class: 'card empty' }, icon('folder'), h('h2', null, unterricht() ? 'Für diese Stunde liegt nichts in der Ablage' : 'Die Ablage ist noch leer'), h('p', { class: 'muted' }, 'Dokumente erscheinen hier, sobald du sie für einen Auftrag brauchst.'))); return; }
    ordner.forEach(function (o) {
      add(app, section(o.ordner, null, h('div', { class: 'card list' }, o.docs.map(docRow))));
    });
    add(app, h('p', { class: 'small muted' }, icon('shield'), ' Die Ablage enthält nur Unterlagen, die für deinen Auftrag freigegeben sind. Personalakten sieht nur, wer sie für seine Arbeit braucht.'));
  }
  function viewDoc(id) {
    var x = allDocs().filter(function (e) { return e.d.id === id; })[0];
    if (!x) { location.hash = '#/app/ablage'; return; }
    var d = x.d;
    add(app, [crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], ['Ablage', '#/app/ablage'], [d.titel]]),
      h('article', { class: 'card paper' }, h('div', { class: 'kicker' }, x.o), h('h1', null, d.titel), d.info ? h('p', { class: 'muted' }, d.info) : null,
        d.pre ? h('pre', { class: 'doc' }, d.pre) : null, d.body ? paras(d.body) : null),
      h('a', { class: 'btn sec', href: '#/app/ablage' }, '← Ablage')]);
  }

  /* ---------- Werkzeuge ---------- */
  function toolDef(id) { return bundle.tools.filter(function (t) { return t.id === id; })[0]; }
  function toolState(id) { return LS.get('ln_t_' + bundle.id + '_' + id, {}); }
  function setToolState(id, st) { LS.set('ln_t_' + bundle.id + '_' + id, st); }
  function toolLocked(t) { return !bundle.lehrer && t.nach && !toolState(t.nach).done; }
  function visibleTools() { return bundle.tools.filter(inS); }
  var TOOLICON = { detektiv: 'search', quiz: 'check', check: 'file' };
  function toolRow(t) {
    var st = toolState(t.id), d = prog().done['tool:' + t.id], lock = toolLocked(t);
    var pill = lock ? h('span', { class: 'pill' }, 'nach Level 1') : d ? h('span', { class: 'pill ' + (d.max && d.pts >= d.max ? 'g' : 'o') }, d.max ? d.pts + ' / ' + d.max : 'erledigt') : st.started ? h('span', { class: 'pill o' }, 'in Arbeit') : h('span', { class: 'pill n' }, 'neu');
    return h('a', { class: 'lrow' + (lock ? ' off' : ''), href: '#/tool/' + t.id }, h('span', { class: 'lrow-i' }, icon(lock ? 'lock' : TOOLICON[t.typ] || 'file')),
      h('span', { class: 'lrow-t' }, h('b', null, t.titel), h('span', null, t.kurz)), pill);
  }
  function viewTool(id) {
    var t = toolDef(id);
    if (!t) { location.hash = '#/arbeitsplatz'; return; }
    var a = appDef(t.app);
    add(app, crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], a ? [a.name, '#/app/' + a.id] : ['Werkzeuge'], [t.titel]]));
    if (toolLocked(t)) {
      add(app, h('div', { class: 'card empty' }, icon('lock'), h('h2', null, 'Erst Level 1 abschließen'), h('p', { class: 'muted' }, 'Level 2 wird frei, sobald du die Prüfung in Level 1 abgeschlossen hast.'), h('a', { class: 'btn', href: '#/tool/' + t.nach }, 'Zu Level 1')));
      return;
    }
    var box = h('section', { class: 'card' }, h('div', { class: 'kicker' }, t.typ === 'detektiv' ? 'Werkzeug · Level ' + t.stufe : t.typ === 'quiz' ? 'Prüfungstraining' : 'Checkliste'), h('h1', { class: 'h2' }, t.titel));
    add(app, box);
    if (t.typ === 'detektiv') detektiv(t, box);
    else if (t.typ === 'quiz') { add(box, h('p', { class: 'muted' }, t.kurz)); RENDER.quiz(t, box, function (pts, max) { setDone('tool', t.id, pts, max); }); }
    else if (t.typ === 'check') checkliste(t, box);
  }

  function checkliste(t, box) {
    var st = toolState(t.id); st.c = st.c || {};
    function save() { st.started = 1; setToolState(t.id, st); }
    add(box, h('p', { class: 'muted' }, t.kurz));
    add(box, h('ul', { class: 'checks' }, t.items.map(function (x, i) {
      var cb = h('input', { type: 'checkbox', id: 'c' + i, onchange: function () { st.c[i] = cb.checked; save(); } }); cb.checked = !!st.c[i];
      return h('li', null, h('label', { for: 'c' + i }, cb, h('span', null, x)));
    })));
    var res = h('div', { role: 'status' });
    add(box, [h('p', { style: 'margin-top:14px' }, h('b', null, t.frage)), h('div', { class: 'opts' }, ['Ja, so kann sie raus', 'Ja, mit kleinen Änderungen', 'Nein, so nicht'].map(function (l, i) {
      return h('button', { type: 'button', class: 'opt' + (st.v === i ? ' sel' : ''), onclick: function () { st.v = i; save(); setDone('tool', t.id, 0, 0); viewToolRefresh(); } }, l);
    })), res,
      h('button', { type: 'button', class: 'btn ghost', onclick: function () { setToolState(t.id, {}); viewToolRefresh(); } }, 'Für die nächste Anzeige leeren')]);
  }
  function viewToolRefresh() { var y = window.scrollY; go(); window.scrollTo(0, y); }

  /* ---------- Anzeigen-Detektiv ---------- */
  var AGG = [['herkunft', 'Ethnische Herkunft'], ['geschlecht', 'Geschlecht'], ['religion', 'Religion / Weltanschauung'], ['behinderung', 'Behinderung'], ['alter', 'Alter'], ['identitaet', 'Sexuelle Identität']];
  var OTHER = [['profil', 'Passt nicht zum Profil'], ['ok', 'Zulässig']];
  var CATN = {}; AGG.concat(OTHER).forEach(function (c) { CATN[c[0]] = c[1]; });
  function isAgg(k) { return AGG.some(function (c) { return c[0] === k; }); }
  function spots(t) { var r = []; t.teile.forEach(function (p) { (p.s || []).forEach(function (s) { r.push(s); }); }); return r; }

  function detektiv(t, box) {
    var st = toolState(t.id); st.m = st.m || {}; st.neu = st.neu || {}; st.tips = st.tips || 0;
    var all = spots(t);
    function save() { st.started = 1; setToolState(t.id, st); }
    if (st.done || st.show) { detektivResult(t, box, st, all); return; }
    add(box, h('p', null, t.auftrag));

    var sheet = null;
    function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
    function openSheet(i, el) {
      closeSheet();
      function pick(k) { if (k) st.m[i] = k; else delete st.m[i]; save(); closeSheet(); paintAd(); paintList(); }
      sheet = h('div', { class: 'sheet-bg', onclick: function (e) { if (e.target === sheet) closeSheet(); } },
        h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Stelle zuordnen' },
          h('p', { class: 'sheet-q' }, '„' + all[i].x + '“'),
          h('p', { class: 'sheet-l' }, 'Verstoß gegen das AGG wegen …'),
          h('div', { class: 'sheet-g' }, AGG.map(function (c) { return h('button', { type: 'button', class: 'opt' + (st.m[i] === c[0] ? ' sel' : ''), onclick: function () { pick(c[0]); } }, c[1]); })),
          h('p', { class: 'sheet-l' }, 'Kein AGG-Verstoß'),
          h('div', { class: 'sheet-g two' }, OTHER.map(function (c) { return h('button', { type: 'button', class: 'opt' + (st.m[i] === c[0] ? ' sel' : ''), onclick: function () { pick(c[0]); } }, c[1]); })),
          h('div', { class: 'row', style: 'margin-top:10px' }, st.m[i] ? h('button', { type: 'button', class: 'btn ghost', onclick: function () { pick(null); } }, 'Markierung entfernen') : null,
            h('button', { type: 'button', class: 'btn sec', onclick: closeSheet }, 'Abbrechen'))));
      document.body.appendChild(sheet);
      var first = sheet.querySelector('button'); if (first) first.focus();
    }

    var ad = h('div', { class: 'ad' });
    function paintAd() {
      ad.textContent = ''; var gi = 0;
      add(ad, h('div', { class: 'ad-h' }, h('img', { src: 'assets/logo_kurz_farbig.png', alt: '' }), h('span', null, t.kopf.medium)));
      t.teile.forEach(function (p) {
        if (!p.s) { add(ad, h(p.h === 'h3' ? 'h3' : 'p', null, p.x)); return; }
        var nodes = p.s.map(function (s) {
          var i = gi++, k = st.m[i];
          return h('span', { class: 'spot' + (k ? (k === 'ok' ? ' m-ok' : k === 'profil' ? ' m-pr' : ' m-agg') : ''), role: 'button', tabindex: '0', 'aria-label': s.x + (k ? ', markiert: ' + CATN[k] : ''),
            onclick: function (e) { openSheet(i, e.currentTarget); }, onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSheet(i); } } }, s.x, k ? h('em', { class: 'spot-tag' }, CATN[k]) : null);
        });
        if (p.h === 'ul') add(ad, h('ul', null, nodes.map(function (n) { return h('li', null, n); })));
        else if (p.h === 'titel') add(ad, h('h2', { class: 'ad-t' }, nodes));
        else add(ad, h('p', null, nodes.reduce(function (acc, n, j) { if (j) acc.push(' '); acc.push(n); return acc; }, [])));
      });
      add(ad, h('div', { class: 'ad-f' }, t.kopf.firma + ' · ' + t.kopf.ort));
    }
    var list = h('div'), count = h('p', { class: 'small muted', role: 'status' });
    function paintList() {
      list.textContent = '';
      var marked = Object.keys(st.m).map(Number).sort(function (a, b) { return a - b; });
      var bad = marked.filter(function (i) { return st.m[i] !== 'ok'; });
      count.textContent = marked.length ? marked.length + (marked.length === 1 ? ' Stelle markiert' : ' Stellen markiert') + ', davon ' + bad.length + ' als Problem.' : 'Noch nichts markiert. Tippe in der Anzeige auf eine Stelle.';
      if (!bad.length) return;
      add(list, h('h2', { class: 'h3' }, 'Deine Neuformulierungen'));
      add(list, h('p', { class: 'small muted' }, 'Schreib zu jeder Problemstelle, wie es richtig heißen könnte.'));
      bad.forEach(function (i) {
        var ta = h('textarea', { rows: 2, 'aria-label': 'Neuformulierung für: ' + all[i].x, placeholder: 'So würden wir es schreiben …', oninput: function () { st.neu[i] = ta.value; save(); } });
        ta.value = st.neu[i] || '';
        add(list, h('div', { class: 'rew' }, h('p', null, h('s', null, all[i].x), ' ', h('span', { class: 'pill ' + (st.m[i] === 'profil' ? '' : 'n') }, CATN[st.m[i]])), ta));
      });
    }
    var tipBox = h('div');
    function paintTips() {
      tipBox.textContent = '';
      t.tipps.slice(0, st.tips).forEach(function (x, i) { add(tipBox, h('div', { class: 'tip' }, h('b', null, 'Tipp ' + (i + 1) + ': '), x)); });
      if (st.tips < t.tipps.length) add(tipBox, h('button', { type: 'button', class: 'btn ghost', onclick: function () { st.tips++; save(); paintTips(); } }, st.tips ? 'Noch einen Tipp' : 'Tipp anzeigen', ' (' + (st.tips + 1) + ' von ' + t.tipps.length + ')'));
    }
    paintAd(); paintList(); paintTips();
    add(box, [ad, count, tipBox, list,
      h('div', { class: 'row', style: 'margin-top:16px' },
        h('button', { type: 'button', class: 'btn', onclick: function () {
          var miss = Object.keys(st.m).filter(function (i) { return st.m[i] !== 'ok' && !(st.neu[i] || '').trim(); }).length;
          if (miss && !confirm(miss + (miss === 1 ? ' Stelle hat' : ' Stellen haben') + ' noch keine Neuformulierung. Trotzdem abschließen?')) return;
          st.done = 1; save(); var r = score(all, st); setDone('tool', t.id, r.right, r.total); viewToolRefresh();
        } }, 'Prüfung abschließen'),
        bundle.lehrer ? h('button', { type: 'button', class: 'btn sec', onclick: function () { st.show = 1; setToolState(t.id, st); viewToolRefresh(); } }, 'Auflösung zeigen (Lehrkraft)') : null)]);
  }
  function score(all, st) {
    var r = { right: 0, half: 0, total: 0, traps: 0, trapsOk: 0, fals: 0 };
    all.forEach(function (s, i) {
      var m = st.m[i];
      if (s.k && s.k !== 'ok') { r.total++; if (m === s.k) r.right++; else if (isAgg(s.k) && isAgg(m)) r.half++; }
      else if (s.k === 'ok') { r.traps++; if (!m || m === 'ok') r.trapsOk++; }
      else if (m && m !== 'ok') r.fals++;
    });
    return r;
  }
  function detektivResult(t, box, st, all) {
    var solo = st.show && !st.done, r = score(all, st);
    if (!solo) {
      add(box, h('div', { class: 'score' }, h('b', null, r.right + ' / ' + r.total), h('p', null, 'Problemstellen richtig erkannt' + (r.half ? ', dazu ' + r.half + ' erkannt, aber mit falschem Merkmal' : '') + '.'),
        h('p', { class: 'small muted' }, 'Zulässige Stellen richtig gelassen: ' + r.trapsOk + ' von ' + r.traps + (r.fals ? ' · Fehlalarme: ' + r.fals : ''))));
    } else add(box, h('p', { class: 'muted' }, 'Auflösung für den Beamer. Rot: AGG-Verstoß · Lila: passt nicht zum Profil · Grün: zulässig.'));
    var gi = 0, ad = h('div', { class: 'ad solved' }, h('div', { class: 'ad-h' }, h('img', { src: 'assets/logo_kurz_farbig.png', alt: '' }), h('span', null, t.kopf.medium)));
    t.teile.forEach(function (p) {
      if (!p.s) { add(ad, h(p.h === 'h3' ? 'h3' : 'p', null, p.x)); return; }
      var nodes = p.s.map(function (s) {
        var i = gi++, cls = s.k ? (s.k === 'ok' ? 'r-ok' : s.k === 'profil' ? 'r-pr' : 'r-agg') : '';
        return h('span', { class: 'spot ' + cls }, s.x, s.k ? h('em', { class: 'spot-tag' }, CATN[s.k]) : null);
      });
      if (p.h === 'ul') add(ad, h('ul', null, nodes.map(function (n) { return h('li', null, n); })));
      else if (p.h === 'titel') add(ad, h('h2', { class: 'ad-t' }, nodes));
      else add(ad, h('p', null, nodes.reduce(function (acc, n, j) { if (j) acc.push(' '); acc.push(n); return acc; }, [])));
    });
    add(box, ad);
    add(box, h('h2', { class: 'h3' }, 'Die Stellen im Einzelnen'));
    all.forEach(function (s, i) {
      var m = st.m[i];
      if (!s.k && !(m && m !== 'ok')) return;
      var verdict = solo ? null : !s.k ? ['Fehlalarm', 'bad'] : s.k === 'ok' ? (!m || m === 'ok' ? ['richtig gelassen', 'ok'] : ['Falle: zulässig', 'bad']) : m === s.k ? ['richtig', 'ok'] : isAgg(s.k) && isAgg(m) ? ['Verstoß erkannt, anderes Merkmal', 'half'] : ['übersehen', 'bad'];
      add(box, h('div', { class: 'sol ' + (s.k === 'ok' ? 'sol-ok' : s.k === 'profil' ? 'sol-pr' : s.k ? 'sol-agg' : '') },
        h('p', { class: 'sol-q' }, '„' + s.x + '“'),
        h('p', null, h('b', null, s.k ? CATN[s.k] + (isAgg(s.k) ? ' (Merkmal nach § 1 AGG)' : '') : 'Unauffällige Stelle'), s.p ? ' · ' + s.p : '', verdict ? h('span', { class: 'v v-' + verdict[1] }, verdict[0]) : null),
        s.w ? h('p', null, s.w) : h('p', null, 'Diese Formulierung ist in Ordnung.'),
        !solo && st.neu[i] ? h('p', { class: 'mine' }, h('b', null, 'Deine Formulierung: '), st.neu[i]) : null,
        s.neu ? h('p', { class: 'sugg' }, h('b', null, 'Ein Vorschlag: '), s.neu) : null));
    });
    add(box, h('div', { class: 'row', style: 'margin-top:14px' },
      h('button', { type: 'button', class: 'btn sec', onclick: function () { if (solo || confirm('Neu anfangen? Deine Markierungen und Formulierungen werden gelöscht.')) { setToolState(t.id, {}); viewToolRefresh(); } } }, solo ? 'Auflösung schließen' : 'Noch einmal prüfen'),
      t.id === 'detektiv1' && toolDef('detektiv2') && !solo ? h('a', { class: 'btn', href: '#/tool/detektiv2' }, 'Weiter zu Level 2') : null));
  }

  /* ---------- Wissen & Vorlagen ---------- */
  function viewWiki(mid, idx) {
    var m = mod(mid), s = m && !locked(m) ? m.steps[idx] : null;
    if (!s) { location.hash = '#/wissen'; return; }
    var box = h('article', { class: 'card' }, h('div', { class: 'kicker' }, 'Leitfaden'), h('h1', null, s.title), s.lead ? h('p', { html: s.lead }) : null);
    add(app, [crumb([['Wissen & Vorlagen', '#/wissen'], [s.title]]), box]);
    RENDER.info(s, box);
    add(app, h('div', { class: 'row' }, h('a', { class: 'btn sec', href: '#/wissen' }, '← Wissen & Vorlagen'), h('a', { class: 'btn ghost', href: '#/m/' + mid + '/' + idx }, 'Im Auftrag „' + m.title + '“ öffnen')));
  }
  function viewWissen() {
    var terms = bundle.glossary.slice().sort(function (a, b) { return a.b.localeCompare(b.b, 'de'); });
    var list = h('dl', { class: 'gl' });
    function draw(filter) {
      list.textContent = '';
      var f = norm(filter), hits = terms.filter(function (t) { return !f || norm(t.b + ' ' + t.d).indexOf(f) >= 0; });
      hits.forEach(function (t) { add(list, h('div', null, h('dt', null, t.b), h('dd', null, t.d))); });
      if (!hits.length) add(list, h('p', { class: 'muted' }, 'Kein Begriff gefunden.'));
    }
    var s = h('input', { class: 'search', type: 'search', placeholder: 'Begriff suchen …', 'aria-label': 'Begriff suchen', oninput: function () { draw(s.value); } });
    var w = wikiFor(null);
    add(app, head('Wissen & Vorlagen', 'Nachschlagen wie im Betrieb: Leitfäden, Regeln und Fachbegriffe'));
    add(app, section('Leitfäden', null, h('div', { class: 'card list' }, w.length ? w.map(wikiRow) : h('p', { class: 'muted' }, 'Leitfäden erscheinen hier mit deinen Aufträgen.'),
      h('a', { class: 'lrow', href: '#/unternehmen' }, h('span', { class: 'lrow-i' }, icon('building')), h('span', { class: 'lrow-t' }, h('b', null, 'So arbeiten wir bei Lindner'), h('span', null, 'Arbeitszeit, Urlaub, Betriebsrat, Unternehmensdaten')), icon('chevron')))));
    add(app, section('Wiki: Fachbegriffe', ['Als Lernkarten üben', '#/wissen/karten'], [s, list]));
    draw('');
  }
  function viewKarten() {
    var deck = shuffle(bundle.glossary), i = 0, back = false;
    var card = h('button', { class: 'flash', type: 'button', 'aria-live': 'polite', onclick: function () { back = !back; paint(); } });
    var count = h('p', { class: 'small muted', style: 'text-align:center' });
    function paint() { card.className = 'flash' + (back ? ' back' : ''); card.textContent = back ? deck[i].d : deck[i].b; count.textContent = 'Karte ' + (i + 1) + ' von ' + deck.length + ' · Tippe zum Umdrehen'; }
    paint();
    add(app, [crumb([['Wissen & Vorlagen', '#/wissen'], ['Lernkarten']]), head('Lernkarten', 'Fachbegriffe aus ' + bundle.short), card, count, h('div', { class: 'stepnav' },
      h('button', { class: 'btn sec', type: 'button', onclick: function () { i = (i - 1 + deck.length) % deck.length; back = false; paint(); } }, '← Zurück'),
      h('button', { class: 'btn', type: 'button', onclick: function () { i = (i + 1) % deck.length; back = false; paint(); } }, 'Nächste →'))]);
  }

  /* ---------- Kolleginnen & Kollegen ---------- */
  function viewKollegen(sub) {
    var cur = sub && abt(sub) ? sub : '', q = '';
    var list = h('div', { class: 'card list' }), chips = h('div', { class: 'chips' });
    var inp = h('input', { class: 'search', type: 'search', placeholder: 'Name oder Aufgabe suchen …', 'aria-label': 'Personen suchen', oninput: function () { q = inp.value; draw(); } });
    function draw() {
      list.textContent = ''; chips.textContent = '';
      add(chips, [['', 'Alle']].concat(SH.abteilungen.map(function (a) { return [a.id, a.name]; })).map(function (c) {
        return h('button', { type: 'button', class: 'chip' + (c[0] === cur ? ' on' : ''), 'aria-pressed': c[0] === cur ? 'true' : 'false', onclick: function () { cur = c[0]; draw(); } }, c[1]);
      }));
      var f = norm(q), hits = SH.personen.filter(function (p) { return (!cur || p.abt === cur) && (!f || norm(pname(p) + ' ' + p.fn + ' ' + abt(p.abt).name).indexOf(f) >= 0); });
      add(list, hits.length ? hits.map(function (p) { return personRow(p); }) : h('p', { class: 'muted' }, 'Niemand gefunden.'));
    }
    add(app, [crumb([['Unternehmen', '#/unternehmen'], ['Kolleginnen & Kollegen']]), firmaNav('kollegen'), head('Kolleginnen & Kollegen', SH.personen.length + ' Beschäftigte in ' + (SH.abteilungen.length - 2) + ' Abteilungen'),
      h('div', { class: 'orgchart' }, SH.abteilungen.map(function (a) {
        var l = person(a.leitung), n = SH.personen.filter(function (p) { return p.abt === a.id; }).length;
        return h('button', { type: 'button', class: 'orgbox a-' + a.id, onclick: function () { cur = a.id; draw(); list.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, h('b', null, a.name), h('span', null, (a.id === 'az' ? 'Ausbilder: ' : a.id === 'gf' ? '' : 'Leitung: ') + pname(l)), h('span', { class: 'small' }, n + (n === 1 ? ' Person' : ' Personen')));
      })),
      inp, chips, list,
      h('p', { class: 'small muted' }, icon('shield'), ' Der Status zeigt nur, ob jemand erreichbar ist. Den Grund einer Abwesenheit sieht hier niemand: Das sind persönliche Daten, die nur die Personalabteilung kennen darf.'),
      ]);
    draw();
  }
  function viewPerson(nr) {
    var p = person(nr);
    if (!p) { location.hash = '#/kollegen'; return; }
    var a = abt(p.abt), chef = person(a.leitung);
    add(app, [crumb([['Unternehmen', '#/unternehmen'], ['Kolleginnen & Kollegen', '#/kollegen'], [a.name, '#/kollegen/' + a.id], [pname(p)]]),
      h('div', { class: 'card profile' }, avatar(p, 'xl'),
        h('div', null, h('h1', null, pname(p)), h('p', { class: 'muted' }, p.fn), h('span', { class: 'st st-' + p.st }, STATUS[p.st])),
        h('dl', { class: 'facts' },
          h('div', null, h('dt', null, 'Abteilung'), h('dd', null, a.name)),
          h('div', null, h('dt', null, 'Durchwahl'), h('dd', null, '06021 4477-' + String(p.nr).slice(1))),
          h('div', null, h('dt', null, 'Bei Lindner seit'), h('dd', null, String(p.seit))),
          chef.nr !== p.nr ? h('div', null, h('dt', null, p.abt === 'az' ? 'Ausbilder' : 'Vorgesetzt'), h('dd', null, h('a', { href: '#/person/' + chef.nr }, pname(chef)))) : null)),
      (SH.steckbrief || {})[p.nr] ? h('div', { class: 'card' }, h('h2', null, 'Steckbrief'), paras(SH.steckbrief[p.nr])) : null,
      h('p', { class: 'small muted' }, icon('shield'), ' Im Verzeichnis stehen nur dienstliche Angaben. Geburtsdatum, Entgelt oder Fehlzeiten gehören in die Personalakte und sind nur für die Personalabteilung sichtbar.')]);
    var team = SH.personen.filter(function (x) { return x.abt === p.abt && x.nr !== p.nr; });
    if (team.length) add(app, section('Im selben Team', null, h('div', { class: 'card list' }, team.map(function (x) { return personRow(x); }))));
  }
  function firmaNav(cur) {
    var items = [['unternehmen', 'Über uns', '#/unternehmen']];
    if (SH.firma.leitbild) items.push(['leitbild', 'Unser Leitbild', '#/leitbild']);
    items.push(['kollegen', 'Kolleginnen & Kollegen', '#/kollegen']);
    return h('nav', { class: 'chips subnav', 'aria-label': 'Unternehmen' }, items.map(function (it) {
      return h('a', { class: 'chip' + (it[0] === cur ? ' on' : ''), href: it[2], 'aria-current': it[0] === cur ? 'page' : null }, it[1]);
    }));
  }
  function viewUnternehmen() {
    var F = SH.firma, gfp = person(SH.gf.von);
    add(app, [firmaNav('unternehmen'),
      h('section', { class: 'fhero' }, h('img', { class: 'fhero-bg', src: SH.gf.bild, alt: SH.gf.bildtext }),
        h('div', { class: 'fhero-t' }, h('img', { src: 'assets/logo_weiss.png', alt: F.name }), h('p', null, '„' + F.claim + '“'))),
      h('div', { class: 'stats' }, F.facts.map(function (f) { return h('div', { class: 'stat' }, h('b', null, f[0]), h('span', null, f[1])); })),
      F.leitbild ? h('a', { class: 'lbteaser', href: '#/leitbild' }, h('span', { class: 'lrow-i' }, icon('star')),
        h('span', { class: 'lrow-t' }, h('b', null, 'Unser Leitbild und unsere Ziele'), h('span', null, 'Sechs Leitsätze: So arbeiten wir – und das dürfen Kunden von uns erwarten.')), icon('chevron')) : null,
      h('div', { class: 'grid' },
        h('div', { class: 'card' }, h('h2', null, 'Steckbrief'), ul(F.steckbrief)),
        h('div', { class: 'card' }, h('h2', null, 'Unser Sortiment'), ul(F.sortiment)),
        h('div', { class: 'card' }, h('h2', null, 'Unsere Kunden'), ul(F.kunden)),
        h('div', { class: 'card' }, h('h2', null, 'Wichtige Geschäftspartner'), ul(F.partner))),
      h('div', { class: 'card' }, h('h2', null, 'So arbeiten wir bei Lindner'), ul(F.regeln)),
      section('Unser Team', ['Alle ' + SH.personen.length + ' Kolleginnen & Kollegen', '#/kollegen'],
        h('div', { class: 'card list' }, [gfp].concat(SH.abteilungen.filter(function (a) { return a.id !== 'gf' && a.id !== 'az'; }).map(function (a) { return person(a.leitung); })).map(function (p) { return personRow(p); })))]);
  }
  var LB_ICONS = ['users', 'handshake', 'check', 'scale', 'idcard', 'star'];
  function viewLeitbild() {
    var F = SH.firma, L = F.leitbild;
    if (!L) { location.hash = '#/unternehmen'; return; }
    var sel = -1, detail = h('div', { class: 'lb-detail', role: 'status', 'aria-live': 'polite' });
    var cols = L.saetze.map(function (x, i) {
      return h('button', { type: 'button', class: 'lb-col', 'aria-expanded': 'false', onclick: function () { sel = sel === i ? -1 : i; paint(); } },
        h('span', { class: 'lb-n' }, String(i + 1)), h('span', { class: 'lb-i' }, icon(LB_ICONS[i % LB_ICONS.length])), h('span', { class: 'lb-t' }, x[0].replace(/\.$/, '')));
    });
    function paint() {
      cols.forEach(function (c, i) { c.classList.toggle('on', i === sel); c.setAttribute('aria-expanded', i === sel ? 'true' : 'false'); });
      detail.textContent = '';
      if (sel < 0) add(detail, h('p', { class: 'muted small', style: 'margin:0;text-align:center' }, 'Tippe auf eine Säule, um den Leitsatz zu lesen.'));
      else add(detail, [h('h3', null, (sel + 1) + '  ' + L.saetze[sel][0]), h('p', { style: 'margin:0' }, L.saetze[sel][1])]);
    }
    add(app, [firmaNav('leitbild'), head('Unser Leitbild', F.name), h('p', null, L.intro),
      h('div', { class: 'lbhaus' },
        h('div', { class: 'lb-dach' }, h('span', null, '„' + F.claim + '“')),
        h('div', { class: 'lb-balken' }, 'Unsere sechs Leitsätze'),
        h('div', { class: 'lb-cols' }, cols), detail,
        h('div', { class: 'lb-fund' }, h('h2', null, 'Unser Fundament: Ziele für ' + L.jahr), ul(L.ziele))),
      h('p', { class: 'small muted', style: 'text-align:right' }, L.von),
      h('details', { class: 'att' }, h('summary', null, icon('file'), ' Alle Leitsätze als Liste lesen'),
        h('div', { class: 'att-b' }, L.saetze.map(function (x, i) { return h('div', { class: 'info' }, h('h3', null, (i + 1) + '  ' + x[0]), paras(x[1])); })))]);
    paint();
  }

  /* ---------- Akademie ---------- */
  function viewAkademie() {
    var p = prog(), rows = [];
    bundle.modules.forEach(function (m) {
      if (locked(m)) return;
      m.steps.forEach(function (s, i) {
        if (s.t !== 'quiz' && s.t !== 'sort' && s.t !== 'calc') return;
        var d = p.done[m.id + ':' + i];
        rows.push(h('a', { class: 'lrow', href: '#/m/' + m.id + '/' + i }, h('span', { class: 'lrow-i' }, icon(s.t === 'calc' ? 'chart' : s.t === 'sort' ? 'cards' : 'check')),
          h('span', { class: 'lrow-t' }, h('b', null, s.title), h('span', null, (s.t === 'quiz' ? 'Quiz' : s.t === 'sort' ? 'Kartenspiel' : 'Rechnen') + ' · ' + m.title)),
          d ? h('span', { class: 'pill ' + (d.max && d.pts >= d.max ? 'g' : 'o') }, d.max ? String(d.pts).replace('.', ',') + ' / ' + d.max : 'geübt') : h('span', { class: 'pill n' }, 'offen')));
      });
    });
    visibleTools().forEach(function (t) { if (t.typ === 'quiz' || t.typ === 'detektiv') rows.unshift(toolRow(t)); });
    add(app, [head('Akademie', 'Üben für Schulaufgabe und Abschlussprüfung'),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', null, String(totalPoints()).replace('.', ',')), h('span', null, 'Punkte auf diesem Gerät')),
        h('div', { class: 'stat' }, h('b', null, bundle.modules.filter(function (m) { return !locked(m) && modProgress(m) >= 1; }).length + ' / ' + bundle.modules.filter(function (m) { return !locked(m); }).length), h('span', null, 'Aufträge erledigt')),
        h('div', { class: 'stat' }, h('b', null, String(bundle.glossary.length)), h('span', null, 'Fachbegriffe im Wiki'))),
      section('Unser Weg durch ' + bundle.short, null, h('div', { class: 'card' }, h('p', { class: 'muted small' }, bundle.title),
        h('ol', { class: 'road' }, roadList().map(function (r) { return h('li', { class: r.s || null }, (r.s === 'done' ? '✓ ' : '') + r.t); })))),
      section('Prüfungstraining', null, h('div', { class: 'card list' }, rows.length ? rows : h('p', { class: 'muted' }, 'Übungen erscheinen hier mit deinen Aufträgen.'),
        h('a', { class: 'lrow', href: '#/wissen/karten' }, h('span', { class: 'lrow-i' }, icon('cards')), h('span', { class: 'lrow-t' }, h('b', null, 'Lernkarten'), h('span', null, 'Fachbegriffe wiederholen')), icon('chevron')))),
      h('p', { class: 'small muted' }, 'Dein Lernstand wird nicht übertragen. Er liegt nur im Browser dieses Geräts.')]);
  }

  /* ---------- Suche ---------- */
  function viewSuche(q) {
    var f = norm(q), any = false;
    function has() { return norm(Array.prototype.join.call(arguments, ' ')).indexOf(f) >= 0; }
    function group(title, rows) { if (!rows.length) return; any = true; add(app, section(title, null, h('div', { class: 'card list' }, rows))); }
    function row(href, ic, a, b) { return h('a', { class: 'lrow', href: href }, h('span', { class: 'lrow-i' }, icon(ic)), h('span', { class: 'lrow-t' }, h('b', null, a), h('span', null, b)), icon('chevron')); }
    add(app, head('Suche', 'Ergebnisse für „' + q + '“'));
    if (f.length < 2) { add(app, h('p', { class: 'muted' }, 'Bitte gib mindestens zwei Zeichen ein.')); return; }
    group('Personen', SH.personen.filter(function (p) { return has(pname(p), p.fn, abt(p.abt).name); }).map(function (p) { return personRow(p); }));
    group('Aufträge', bundle.modules.filter(function (m) { return !locked(m) && has(m.title, m.intro, ((bundle.post || {})[m.id] || {}).betreff); }).map(taskRow));
    group('Apps', bundle.apps.filter(function (a) { return has(a.name, a.info); }).map(function (a) { return row(a.id === 'postfach' ? '#/postfach' : '#/app/' + a.id, a.icon, a.name, a.ab ? 'ab ' + a.ab : a.info); }));
    group('Leitfäden', wikiFor(null).filter(function (w) { return has(mod(w.m).steps[w.s].title); }).map(wikiRow));
    group('News', allNews().filter(function (n) { return has(n.titel, n.teaser, n.text.join(' ')); }).map(function (n) { return row('#/news/' + n.id, 'news', n.titel, n.kat + ' · ' + fmtDate(n.d)); }));
    group('Termine', termine().filter(function (e) { return has(e.t, e.o); }).map(function (e) { return row('#/aktuelles', 'calendar', e.t, fmtShort(e.d) + (e.z ? ' · ' + e.z + ' Uhr' : '')); }));
    var gl = bundle.glossary.filter(function (t) { return has(t.b, t.d); });
    if (gl.length) { any = true; add(app, section('Wiki: Fachbegriffe', null, h('dl', { class: 'gl' }, gl.map(function (t) { return h('div', null, h('dt', null, t.b), h('dd', null, t.d)); })))); }
    if (!any) add(app, h('div', { class: 'card empty' }, icon('search'), h('h2', null, 'Nichts gefunden'), h('p', { class: 'muted' }, 'Versuche es mit einem anderen Wort, zum Beispiel einem Namen oder einem Fachbegriff.')));
  }

  /* ---------- Profil und Datenschutz ---------- */
  function logout() { LS.del(K_CODE); LS.del(K_USER); setBundle(null); location.hash = '#/'; go(); }
  function viewIch() {
    var chef = person(bundle.user.chef);
    add(app, [head('Mein Profil'),
      h('div', { class: 'card profile' }, h('span', { class: 'av xl a-' + bundle.user.abt }, bundle.kuerzel),
        h('div', null, h('h1', null, bundle.user.stelle), h('p', { class: 'muted' }, bundle.user.hinweis)),
        h('dl', { class: 'facts' },
          h('div', null, h('dt', null, 'Abteilung'), h('dd', null, abt(bundle.user.abt).name)),
          h('div', null, h('dt', null, 'Vorgesetzt'), h('dd', null, h('a', { href: '#/person/' + chef.nr }, pname(chef)))),
          h('div', null, h('dt', null, 'Zugang'), h('dd', null, 'Kürzel ' + bundle.kuerzel + ' · ohne Namen, ohne Konto')))),
      h('div', { class: 'card' }, h('h2', null, 'Dieses Gerät'),
        h('p', { class: 'muted' }, 'Dein Lernstand und deine Notizen liegen nur im Browser dieses Geräts. Niemand sonst kann sie sehen, auch deine Lehrkraft nicht.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn sec', type: 'button', onclick: logout }, 'Abmelden'),
          h('button', { class: 'btn ghost', type: 'button', onclick: function () { if (confirm('Lernstand und Notizen auf diesem Gerät wirklich löschen?')) { LS.del(pkey()); LS.del('ln_news_' + bundle.id); LS.del('ln_tour'); go(); } } }, 'Lernstand löschen')))]);
  }
  function viewDatenschutz() {
    add(app, [head('Datenschutz & Nutzung', 'Kurz und ehrlich: Was LindnerNet speichert und was nicht'),
      h('div', { class: 'card' }, h('h2', null, 'Was LindnerNet ist'),
        h('p', null, 'LindnerNet ist ein Lernangebot zum Unterricht. Die Lindner Bürowelt am Main KG gibt es nicht wirklich. Alle Personen, Namen, Nachrichten und Zahlen sind frei erfunden.')),
      h('div', { class: 'card' }, h('h2', null, 'Was nicht gespeichert wird'),
        ul(['Kein Name, keine E-Mail-Adresse, kein Konto.', 'Keine Auswertung, wer was wann anklickt. Es gibt kein Tracking und keine Werbung.', 'Deine Antworten und Notizen werden nicht gesendet. Auch deine Lehrkraft sieht sie nicht.'])),
      h('div', { class: 'card' }, h('h2', null, 'Was auf deinem Gerät liegt'),
        ul(['Dein Kürzel und der letzte Code, damit du dich nicht jedes Mal neu anmelden musst. Das Kürzel wird nirgendwohin gesendet.', 'Dein Lernstand, deine Punkte und deine Notizen.', 'Mit „Abmelden“ und „Lernstand löschen“ unter „Mein Profil“ entfernst du alles wieder.']),
        h('a', { class: 'btn sec', href: '#/ich' }, 'Mein Profil öffnen')),
      h('div', { class: 'card' }, h('h2', null, 'Technik'),
        h('p', null, 'Die Seite liegt bei GitHub Pages. Wie bei jeder Website verarbeitet der Anbieter beim Abruf technische Daten wie die IP-Adresse. Die Inhalte sind verschlüsselt und werden erst mit dem Code der Stunde auf deinem Gerät lesbar.')),
      h('div', { class: 'card' }, h('h2', null, 'Wie im echten Betrieb'),
        h('p', null, 'Auch im LindnerNet gilt: Jede Rolle sieht nur, was sie für ihre Arbeit braucht. Im Personenverzeichnis stehen deshalb nur dienstliche Angaben, und bei Abwesenheiten steht kein Grund.'))]);
  }

  /* ---------- Los ---------- */
  window.addEventListener('hashchange', go);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(function () { /* ohne Offline-Modus weiter */ });
  var saved = LS.get(K_CODE, null), savedUser = normUser(LS.get(K_USER, ''));
  if (saved && savedUser.length === 3 && window.crypto && crypto.subtle) {
    unlock(saved).then(function (r) { if (r) { setBundle(r.data, savedUser); return loadUnits().then(go); } LS.del(K_CODE); go(); }, function () { go(); });
  } else go();
})();
