/* ============================================================
   Reely Links — Bibliothèque d'icônes SVG (aucune dépendance)
   Usage : ICONS.svg('instagram')  →  '<svg …></svg>'
   ============================================================ */
(function (global) {
  'use strict';

  // Icônes d'interface — tracé (stroke), grille 24
  var STROKE = {
    link:      '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    globe:     '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>',
    mail:      '<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="m3.5 7 7.4 5.2a2 2 0 0 0 2.2 0L20.5 7"/>',
    phone:     '<path d="M6.6 3.5h3l1.5 3.8-1.9 1.4a12 12 0 0 0 5.1 5.1l1.4-1.9 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>',
    calendar:  '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    cart:      '<path d="M5 7h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 4H2.5"/><circle cx="9" cy="21" r="1.2"/><circle cx="17" cy="21" r="1.2"/>',
    download:  '<path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    star:      '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
    play:      '<circle cx="12" cy="12" r="9"/><path d="M10 8.5 16 12l-6 3.5z"/>',
    camera:    '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.3-2h6.8l1.3 2h1.8A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.6"/>',
    palette:   '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-1.8s-.9-1.4-.9-2.3c0-.8.6-1.4 1.5-1.4H17a4.4 4.4 0 0 0 4.3-4.5C21.3 6.5 17.2 3 12 3Z"/><circle cx="7.8" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.4" cy="7.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
    briefcase: '<rect x="2.5" y="7" width="19" height="13" rx="3"/><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7M2.5 12.5h19"/>',
    chat:      '<path d="M21 12.5a7.5 7.5 0 0 1-10.9 6.7L4 21l1.8-5.1A7.5 7.5 0 1 1 21 12.5Z"/>',
    doc:       '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h4"/>',
    music:     '<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    pin:       '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    sparkle:   '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.5 15.5 19.4 18l2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9z"/>',
    arrowRight:'<path d="M5 12h14m0 0-6-6m6 6-6 6"/>',
    check:     '<path d="m5 12.5 4.5 4.5L19 7"/>',
    close:     '<path d="M6 6l12 12M18 6 6 18"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    edit:      '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14.5 5.5l4 4"/>',
    trash:     '<path d="M4 7h16M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M6.5 7 7.6 19a2 2 0 0 0 2 1.8h4.8a2 2 0 0 0 2-1.8L17.5 7"/><path d="M10.5 11v6M13.5 11v6"/>',
    drag:      '<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
    eye:       '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.2"/>',
    eyeOff:    '<path d="M4 4l16 16"/><path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4.1M6.6 7.9A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.7-.5"/><path d="M9.9 10.2a3.2 3.2 0 0 0 4.3 4.4"/>',
    chart:     '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7.1 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.3 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 16.9 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    share:     '<circle cx="18" cy="5.5" r="2.8"/><circle cx="6" cy="12" r="2.8"/><circle cx="18" cy="18.5" r="2.8"/><path d="m8.5 10.7 7-3.4M8.5 13.3l7 3.4"/>',
    qr:        '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 21h1M21 14h-1"/>',
    copy:      '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 5.5A2 2 0 0 0 13.5 3.5h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2"/>',
    user:      '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    users:     '<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.6 3.6 0 0 1 0 6.9M17.5 14.4a6.5 6.5 0 0 1 4 6.1"/>',
    logout:    '<path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9"/>',
    search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bell:      '<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    upload:    '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    lock:      '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    moon:      '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    sun:       '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    grid:      '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    external:  '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    heading:   '<path d="M6 4v16M18 4v16M6 12h12"/>',
    contact:   '<rect x="2.5" y="5" width="19" height="14" rx="3"/><circle cx="9" cy="11" r="2.4"/><path d="M5.5 16.4a3.8 3.8 0 0 1 7 0M15 10h4M15 14h2.5"/>'
  };

  // Icônes de marque — aplat (fill), grille 24
  var BRAND = {
    instagram: '<rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.6" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="17.5" cy="6.5" r="1.3"/>',
    youtube:   '<path d="M19.8 5.4c.9.2 1.5.9 1.8 1.8.4 1.6.4 4.8.4 4.8s0 3.3-.4 4.8c-.3.9-.9 1.5-1.8 1.8-1.6.4-7.8.4-7.8.4s-6.3 0-7.8-.4a2.5 2.5 0 0 1-1.8-1.8C2 15.3 2 12 2 12s0-3.3.4-4.8A2.5 2.5 0 0 1 4.2 5.4C5.7 5 12 5 12 5s6.3 0 7.8.4ZM15.2 12 10 15V9l5.2 3Z" fill-rule="evenodd"/>',
    tiktok:    '<path d="M16.1 2h-3.2v13.4a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .8.1V9.5a6 6 0 0 0-.8-.1 6 6 0 1 0 6 6V8.9a7 7 0 0 0 4.1 1.3V7a4.1 4.1 0 0 1-4.2-4Z"/>',
    x:         '<path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.1 21H2l7.3-8.3L2.3 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.1h1.7L7.4 4.8H5.6l11.1 14.3Z"/>',
    twitter:   '<path d="M23.95 4.57a10 10 0 0 1-2.82.77 4.96 4.96 0 0 0 2.16-2.72c-.95.55-2 .96-3.13 1.18a4.92 4.92 0 0 0-8.38 4.49A13.97 13.97 0 0 1 1.64 3.16a4.82 4.82 0 0 0-.67 2.48c0 1.7.87 3.21 2.19 4.1a4.9 4.9 0 0 1-2.23-.62v.06a4.92 4.92 0 0 0 3.95 4.83 4.99 4.99 0 0 1-2.21.08 4.94 4.94 0 0 0 4.6 3.42 9.87 9.87 0 0 1-6.1 2.1c-.4 0-.78 0-1.17-.06a13.99 13.99 0 0 0 7.56 2.21c9.05 0 14-7.5 14-13.99v-.63A9.94 9.94 0 0 0 24 4.59Z"/>',
    linkedin:  '<path d="M4.9 3.5a2.4 2.4 0 1 1 0 4.9 2.4 2.4 0 0 1 0-4.9Z"/><rect x="2.7" y="9.4" width="4.5" height="11.1" rx="0.6"/><path d="M9.6 9.4h4.3v1.6a4.6 4.6 0 0 1 4-2c3 0 4.6 1.9 4.6 5.5v6h-4.5v-5.3c0-1.5-.6-2.6-1.9-2.6-1.1 0-1.7.7-2 1.4-.1.3-.1.6-.1 1v5.5H9.6Z"/>',
    facebook:  '<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12Z"/>',
    whatsapp:  '<path d="M12 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5-1.5A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .9.9-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.6 0a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2a.6.6 0 0 0 0-.6l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.6 4c1.9.7 2.3.6 2.7.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z"/>',
    spotify:   '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.4 14.5a.8.8 0 0 1-1.1.3 12 12 0 0 0-6-1.5 12.4 12.4 0 0 0-2.6.3.8.8 0 1 1-.4-1.5 14 14 0 0 1 3-.3 13.6 13.6 0 0 1 6.8 1.7.8.8 0 0 1 .3 1Zm1.3-3a1 1 0 0 1-1.3.3 15 15 0 0 0-7.4-1.8 15.3 15.3 0 0 0-3.4.4 1 1 0 0 1-.5-1.9 17.2 17.2 0 0 1 3.9-.4 17 17 0 0 1 8.4 2.1 1 1 0 0 1 .3 1.3Zm.2-3.2A18.4 18.4 0 0 0 9.4 8.2a19 19 0 0 0-3.8.4 1.2 1.2 0 0 1-.6-2.3 21.3 21.3 0 0 1 4.4-.5 20.8 20.8 0 0 1 9.5 2.2 1.2 1.2 0 0 1-1.1 2.1Z"/>',
    github:    '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/>',
    telegram:  '<path d="M21.9 4.3 18.7 19.6c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.3-.1-.5-.6-.2L6.2 13.3l-4.8-1.5c-1-.3-1.1-1 .2-1.5l18.8-7.3c.9-.3 1.6.2 1.5 1.3Z"/>',
    pinterest: '<path d="M12 2a10 10 0 0 0-3.6 19.3 9.6 9.6 0 0 1 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.3 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8a4.8 4.8 0 0 0-5 4.8c0 .9.3 1.5.7 2 .2.2.2.3.1.6l-.2.8c-.1.3-.3.4-.6.2-1.4-.6-2.1-2.2-2.1-4.1 0-3.1 2.6-6.8 7.7-6.8 4.1 0 6.8 3 6.8 6.1 0 4.2-2.3 7.4-5.8 7.4-1.2 0-2.3-.6-2.6-1.4l-.7 2.8c-.3 1-.9 2-1.4 2.7A10 10 0 1 0 12 2Z"/>',
    twitch:    '<path d="M4.3 2 2.5 6.4v14.1h5V24h2.8l3.4-3.5h4.1L23 15V2Zm16.9 12.2-3 3.1h-5l-2.6 2.7v-2.7H6.2V3.9h15Z"/><path d="M18.6 7.2h-1.9v5.6h1.9zM13.4 7.2h-1.9v5.6h1.9z"/>',
    discord:   '<path d="M19.5 5.3A16.3 16.3 0 0 0 15.4 4l-.3.5a12.6 12.6 0 0 1 3.6 1.8 15.9 15.9 0 0 0-13.4 0A12.6 12.6 0 0 1 8.9 4.5L8.6 4a16.4 16.4 0 0 0-4.1 1.3C1.9 9.2 1.2 13 1.5 16.8A16.5 16.5 0 0 0 6.6 19.4l1-1.5a10.7 10.7 0 0 1-1.7-.8l.4-.3a11.8 11.8 0 0 0 10.1 0l.4.3a10.7 10.7 0 0 1-1.7.8l1 1.5a16.4 16.4 0 0 0 5.1-2.6c.4-4.4-.7-8.2-1.7-11.5ZM8.4 14.6c-1 0-1.8-.9-1.8-2.1s.8-2.1 1.8-2.1 1.9.9 1.8 2.1c0 1.2-.8 2.1-1.8 2.1Zm7.2 0c-1 0-1.8-.9-1.8-2.1s.8-2.1 1.8-2.1 1.9.9 1.8 2.1c0 1.2-.8 2.1-1.8 2.1Z"/>',
    threads:   '<path d="M17.1 11.2a7 7 0 0 0-.3-.2c-.2-3.2-2-5-4.9-5a5 5 0 0 0-4.3 2.2l1.6 1.1A3 3 0 0 1 12 7.9c1 0 1.8.3 2.3.9a3 3 0 0 1 .6 1.5 11 11 0 0 0-2.4-.2c-2.7.1-4.4 1.6-4.3 3.7a3.3 3.3 0 0 0 1.4 2.6 4.2 4.2 0 0 0 2.5.7c1.4 0 2.4-.5 3.2-1.4a5.6 5.6 0 0 0 1.1-2.5 3 3 0 0 1 1.4 2.7c0 1.9-1.6 4-5.8 4-3.7 0-6.3-2.6-6.3-7.1S8.3 5.6 12 5.6c3 0 5.1 1.4 6 3.6l1.9-.6C18.7 5.5 15.9 3.7 12 3.7 7.1 3.7 3.7 7 3.7 12S7.1 20.3 12 20.3c4.4 0 7.7-2.5 7.7-5.9a4.6 4.6 0 0 0-2.6-3.2Zm-4.9 4c-.9 0-1.9-.4-2-1.4 0-.8.6-1.7 2.5-1.8h.5a8.6 8.6 0 0 1 1.7.2c-.2 2.1-1.2 3-2.7 3Z"/>',
    snapchat:  '<path d="M12 2c2.7 0 4.6 2 4.7 4.7v2.1c.4.2.9.1 1.4-.1.6-.3 1.4.1 1.4.8 0 .6-.6.9-1.3 1.2-.6.2-1.1.4-1.1.9 0 .8 2 3.4 4 4 .4.1.6.4.5.8-.2.7-1.5 1.1-2.6 1.3-.2 0-.3.3-.4.7 0 .3-.1.6-.5.6h-.6a4.7 4.7 0 0 0-2.2.4c-.7.4-1.5 1.3-3.3 1.3s-2.6-.9-3.3-1.3a4.7 4.7 0 0 0-2.2-.4h-.6c-.4 0-.5-.3-.5-.6-.1-.4-.2-.7-.4-.7-1.1-.2-2.4-.6-2.6-1.3-.1-.4.1-.7.5-.8 2-.6 4-3.2 4-4 0-.5-.5-.7-1.1-.9-.7-.3-1.3-.6-1.3-1.2 0-.7.8-1.1 1.4-.8.5.2 1 .3 1.4.1V6.7C7.4 4 9.3 2 12 2Z"/>'
  };

  // Correspondance domaine → icône + couleur de marque
  var DOMAINS = [
    [/instagram\.com/i,        'instagram', '#E1306C'],
    [/(youtube\.com|youtu\.be)/i,'youtube', '#FF0000'],
    [/tiktok\.com/i,           'tiktok',    '#000000'],
    [/(twitter\.com|x\.com)/i, 'x',         '#000000'],
    [/linkedin\.com/i,         'linkedin',  '#0A66C2'],
    [/facebook\.com/i,         'facebook',  '#1877F2'],
    [/(wa\.me|whatsapp\.com)/i,'whatsapp',  '#25D366'],
    [/spotify\.com/i,          'spotify',   '#1DB954'],
    [/github\.com/i,           'github',    '#181717'],
    [/t\.me|telegram/i,        'telegram',  '#26A5E4'],
    [/pinterest\./i,           'pinterest', '#BD081C'],
    [/twitch\.tv/i,            'twitch',    '#9146FF'],
    [/discord\.(gg|com)/i,     'discord',   '#5865F2'],
    [/threads\.(net|com)/i,    'threads',   '#000000'],
    [/snapchat\.com/i,         'snapchat',  '#FFFC00'],
    [/^mailto:/i,              'mail',      null],
    [/^tel:/i,                 'phone',     null],
    [/(calendly\.com|cal\.com)/i,'calendar',  '#006BFF'],
    [/(shopify|etsy\.com|amazon\.)/i,'cart', null],
    [/(notion\.so|docs\.google)/i,'doc',     null],
    [/\.pdf(\?|#|$)/i,         'doc',       null],
    [/(maps\.google|goo\.gl\/maps)/i,'pin',  null]
  ];

  var ICONS = {
    stroke: STROKE,
    brand: BRAND,

    /** Renvoie le markup SVG complet d'une icône. */
    svg: function (name, size) {
      var s = size || 24;
      if (BRAND[name]) {
        return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="currentColor" aria-hidden="true">' + BRAND[name] + '</svg>';
      }
      var body = STROKE[name] || STROKE.link;
      return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
             'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
    },

    /** Devine l'icône et la couleur de marque à partir d'une URL. */
    guess: function (url) {
      var u = String(url || '');
      for (var i = 0; i < DOMAINS.length; i++) {
        if (DOMAINS[i][0].test(u)) return { icon: DOMAINS[i][1], brand: DOMAINS[i][2] };
      }
      return { icon: 'globe', brand: null };
    },

    brandColor: function (name) {
      for (var i = 0; i < DOMAINS.length; i++) if (DOMAINS[i][1] === name) return DOMAINS[i][2];
      return null;
    },

    /** Liste des noms disponibles, pour le sélecteur d'icônes de l'admin. */
    names: function () {
      return Object.keys(BRAND).concat(Object.keys(STROKE));
    }
  };

  global.ICONS = ICONS;
  if (typeof module !== 'undefined' && module.exports) module.exports = ICONS;
})(typeof window !== 'undefined' ? window : this);
