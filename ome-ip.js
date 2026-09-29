// ==UserScript==
// @name         ome-ip
// @license      GPL-3.0
// @namespace    https://github.com/EolnMsuk/ome-ip
// @version      3.0.2
// @description  Pro IP Tool for all omegle like sites
// @author       $eolnmsuk
// @match        https://ome.tv/*
// @match        https://omegleapp.me/*
// @match        https://nsfw.omegleapp.me/*
// @match        https://chatroulette.com/*
// @match        https://monkey.app/*
// @match        https://omegleweb.com/*
// @match        https://thundr.com/*
// @match        https://umingle.com/*
// @match        https://webcamtests.com/*
// @connect      ipwho.is
// @connect      cdn.jsdelivr.net
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
    
(function() {
    'use strict';

    // --- 1. CSS INJECTION ---
    const GLOBAL_CSS = `
        /* ... (Keep previous scrollbar styles) ... */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; cursor: pointer; }
        ::-webkit-scrollbar-thumb:hover { background: #666; }

        .ome-no-select { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
        .ome-grab { cursor: grab !important; }
        .ome-grab:active { cursor: grabbing !important; }

        /* Animations & Hover Effects */
        button, .clickable-badge, .icon-btn, .ip-copy-btn, .ome-next-btn, .ome-map-btn, .ome-vol-slider {
            transition: transform 0.1s ease, filter 0.1s ease, background-color 0.2s;
        }

        /* Button Wrapper */
        .ome-btn-wrapper {
            width: 32px; height: 32px; position: relative; flex-shrink: 0; z-index: 5;
        }
        .ome-btn-wrapper:hover {
            z-index: 100; /* Ensure active button floats above others */
        }

        /* [UPDATED] Status Toggle Button - Solid Background */
        .status-toggle-btn {
            position: absolute; top: 0; right: 0;
            width: 32px !important; height: 32px !important;
            transition: width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), border-color 0.2s, box-shadow 0.2s !important;
            overflow: hidden; white-space: nowrap; display: flex !important; align-items: center !important; justify-content: flex-start !important; padding: 0 !important;

            /* CHANGE: Set default to solid black */
            background-color: #000000;
        }

        .status-toggle-btn:hover { width: 120px !important; }

        /* ... (Keep rest of existing CSS below unchanged) ... */
        button:hover, .clickable-badge:hover, .icon-btn:hover, .ip-copy-btn:hover, .ome-next-btn:hover, .ome-map-btn:hover {
            filter: brightness(1.2); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        button:active, .clickable-badge:active, .icon-btn:active, .ip-copy-btn:active, .ome-next-btn:active, .ome-map-btn:active {
            transform: scale(0.95) translateY(0); filter: brightness(0.9); box-shadow: none;
        }
        .ome-vol-slider:hover { transform: none; filter: brightness(1.1); }
        .chat-disabled { pointer-events: none !important; opacity: 0.5 !important; }
        .ome-scroll-lock { overscroll-behavior: contain; }
        .resizable-win { resize: both; overflow: hidden; cursor: default; }

        .ome-text-outline { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, -1px 0 0 #000, 1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000; }
        .ome-text-outline-thick { text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -1px -2px 0 #000, 1px -2px 0 #000, -2px -1px 0 #000, 2px -1px 0 #000, -1px 2px 0 #000, 1px 2px 0 #000, -2px 1px 0 #000, 2px 1px 0 #000; }

        .ome-toast { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(255, 140, 0, 0.85); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; pointer-events: none; opacity: 0; transition: opacity 0.3s ease; z-index: 1000; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.5); border: 1px solid rgba(255, 255, 255, 0.2); }
        .ome-toast.show { opacity: 1; }

        .ome-toggle-track { position: relative; width: 50px; height: 24px; background-color: #333; border-radius: 12px; transition: background-color 0.2s; display: flex; align-items: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5); }
        .ome-toggle-knob { position: absolute; left: 2px; width: 20px; height: 20px; background-color: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 8px; color: #333; font-weight: bold; }

        input[type=range].ome-vol-slider { -webkit-appearance: none; width: 100%; height: 20px; background-color: transparent; background-image: linear-gradient(to right, #FFA500 0%, #FFA500 100%, rgba(255,255,255,0.3) 100%, rgba(255,255,255,0.3) 100%); background-size: 100% 4px; background-repeat: no-repeat; background-position: center; cursor: pointer; margin: 0; }
        input[type=range].ome-vol-slider:focus { outline: none; }
        input[type=range].ome-vol-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #FFA500; cursor: pointer; margin-top: -4px; box-shadow: 0 0 2px rgba(0,0,0,0.5); }
        input[type=range].ome-vol-slider::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: transparent; border-radius: 2px; }

        .ghost-btn-inactive { background-color: transparent !important; border-color: rgba(255,255,255,0.5) !important; opacity: 0.6; transition: opacity 0.2s, border-color 0.2s; }
        .ghost-btn-inactive:hover { opacity: 1; border-color: rgba(255,255,255,0.8) !important; }
        .ghost-btn-active { background-color: rgba(255,255,255,0.8) !important; border-color: #fff !important; box-shadow: 0 0 10px rgba(255,255,255,0.5); }

        body.ome-dark-mode { background-color: #000 !important; }
        body.ome-dark-mode *:not(#ip-log-window):not(#ip-log-window *):not(.resizable-win):not(.resizable-win *):not(.ome-toast):not(#ome-menu-dropdown):not(#ome-menu-dropdown *) { background-color: #000 !important; border-color: #333 !important; color: #ccc !important; }
        body.ome-dark-mode .watermark, body.ome-dark-mode [class*="watermark"], body.ome-dark-mode .logo, body.ome-dark-mode [class*="logo"]:not(.ome-no-select), body.ome-dark-mode .banner, body.ome-dark-mode .overlay-banner { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }

        .ome-selector-hover-hide { outline: 2px solid #FF0000 !important; background-color: rgba(255, 0, 0, 0.2) !important; cursor: crosshair !important; z-index: 99999999 !important; }
        .ome-selector-hover-blackout { outline: 2px solid #0000FF !important; background-color: rgba(0, 0, 255, 0.2) !important; cursor: crosshair !important; z-index: 99999999 !important; }
        .ome-selector-hover-unhide { outline: 2px solid #00FF00 !important; background-color: rgba(0, 255, 0, 0.2) !important; cursor: pointer !important; }
        .ome-visually-hidden { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
        .ome-blacked-out { background-color: #000 !important; color: #000 !important; border-color: #000 !important; background-image: none !important; }
        .ome-blacked-out * { background-color: #000 !important; color: #000 !important; opacity: 0 !important; }

        .ome-resize-handle { position: absolute; width: 16px; height: 16px; z-index: 99999990; background: transparent; }
        .ome-rh-nw { top: 0; left: 0; cursor: nw-resize; }
        .ome-rh-ne { top: 0; right: 0; cursor: ne-resize; }
        .ome-rh-sw { bottom: 0; left: 0; cursor: sw-resize; }
        .ome-rh-se { bottom: 0; right: 0; cursor: se-resize; }
        .ome-resize-handle:hover { background: rgba(255, 255, 255, 0.1); }

        @keyframes ome-jiggle { 0% { transform: rotate(0deg); } 25% { transform: rotate(10deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(-10deg); } 100% { transform: rotate(0deg); } }
        .ome-anim-jiggle { display: inline-block; animation: ome-jiggle 2s infinite ease-in-out; }

        /* v2.4: Stream Protection Badge — shows when face bypass + jitter are active on fake cam */
        .ome-stream-badge {
            position: fixed; bottom: 16px; right: 16px; z-index: 9999990;
            padding: 8px 14px; border-radius: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            font-size: 12px; font-weight: 600; color: #fff;
            display: flex; align-items: center; gap: 6px;
            pointer-events: none; user-select: none;
            transition: opacity 0.4s ease, transform 0.3s ease;
            box-shadow: 0 2px 16px rgba(0,0,0,0.4);
        }
        .ome-stream-badge.protected {
            background: linear-gradient(135deg, #16a34a, #15803d);
            box-shadow: 0 2px 20px rgba(22,163,74,0.5);
        }
        .ome-stream-badge.partial {
            background: linear-gradient(135deg, #d97706, #b45309);
            box-shadow: 0 2px 20px rgba(217,119,6,0.4);
        }
        .ome-stream-badge.hidden { opacity: 0; transform: translateY(10px); }
        @keyframes ome-pulse-dot {
            0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
            50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        .ome-stream-badge-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: #4ade80; animation: ome-pulse-dot 2s infinite;
        }
        .ome-stream-badge.partial .ome-stream-badge-dot {
            background: #fbbf24; animation-name: none;
        }

        .ome-icon-span { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background-color: transparent !important; }
        .ome-btn-label { font-size: 11px; font-weight: bold; color: #fff; opacity: 0; margin-left: -10px; transition: all 0.2s ease; pointer-events: none; white-space: nowrap; }
        .status-toggle-btn:hover .ome-btn-label { opacity: 1; margin-left: 2px; }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = GLOBAL_CSS;
    document.head.appendChild(styleEl);

    // --- CONFIGURATION ---
    const COUNTRIES_DATA = [
        { code: 'tv', name: 'Tuvalu', cont: 'OC' }, { code: 'nr', name: 'Nauru', cont: 'OC' }, { code: 'ki', name: 'Kiribati', cont: 'OC' },
        { code: 'mh', name: 'Marshall Islands', cont: 'OC' }, { code: 'pw', name: 'Palau', cont: 'OC' }, { code: 'fm', name: 'Micronesia', cont: 'OC' },
        { code: 'st', name: 'Sao Tome and Principe', cont: 'AF' }, { code: 'dm', name: 'Dominica', cont: 'NA' }, { code: 'to', name: 'Tonga', cont: 'OC' },
        { code: 'vc', name: 'St. Vincent & Grenadines', cont: 'NA' }, { code: 'kn', name: 'St. Kitts & Nevis', cont: 'NA' }, { code: 'ws', name: 'Samoa', cont: 'OC' },
        { code: 'vu', name: 'Vanuatu', cont: 'OC' }, { code: 'gd', name: 'Grenada', cont: 'NA' }, { code: 'sb', name: 'Solomon Islands', cont: 'OC' },
        { code: 'km', name: 'Comoros', cont: 'AF' }, { code: 'ag', name: 'Antigua & Barbuda', cont: 'NA' }, { code: 'gw', name: 'Guinea-Bissau', cont: 'AF' },
        { code: 'sc', name: 'Seychelles', cont: 'AF' }, { code: 'gm', name: 'Gambia', cont: 'AF' }, { code: 'sl', name: 'Sierra Leone', cont: 'AF' },
        { code: 'er', name: 'Eritrea', cont: 'AF' }, { code: 'cf', name: 'Central African Republic', cont: 'AF' }, { code: 'cv', name: 'Cabo Verde', cont: 'AF' },
        { code: 'bz', name: 'Belize', cont: 'NA' }, { code: 'lc', name: 'St. Lucia', cont: 'NA' }, { code: 'ls', name: 'Lesotho', cont: 'AF' },
        { code: 'bt', name: 'Bhutan', cont: 'AS' }, { code: 'lr', name: 'Liberia', cont: 'AF' }, { code: 'gy', name: 'Guyana', cont: 'SA' },
        { code: 'dj', name: 'Djibouti', cont: 'AF' }, { code: 'tl', name: 'Timor-Leste', cont: 'AS' }, { code: 'ar', name: 'Argentina', cont: 'SA' },
        { code: 'ht', name: 'Haiti', cont: 'NA' }, { code: 'rw', name: 'Rwanda', cont: 'AF' }, { code: 'gn', name: 'Guinea', cont: 'AF' },
        { code: 'bj', name: 'Benin', cont: 'AF' }, { code: 'tj', name: 'Tajikistan', cont: 'AS' }, { code: 'mw', name: 'Malawi', cont: 'AF' },
        { code: 'mr', name: 'Mauritania', cont: 'AF' }, { code: 'me', name: 'Montenegro', cont: 'EU' }, { code: 'mv', name: 'Maldives', cont: 'AS' },
        { code: 'tg', name: 'Togo', cont: 'AF' }, { code: 'bb', name: 'Barbados', cont: 'NA' }, { code: 'fj', name: 'Fiji', cont: 'OC' },
        { code: 'sz', name: 'Eswatini', cont: 'AF' }, { code: 'xk', name: 'Kosovo', cont: 'EU' }, { code: 'so', name: 'Somalia', cont: 'AF' },
        { code: 'zw', name: 'Zimbabwe', cont: 'AF' }, { code: 'cg', name: 'Congo (Rep)', cont: 'AF' }, { code: 'ni', name: 'Nicaragua', cont: 'NA' },
        { code: 'ne', name: 'Niger', cont: 'AF' }, { code: 'cy', name: 'Cyprus', cont: 'EU' }, { code: 'mg', name: 'Madagascar', cont: 'AF' },
        { code: 'mz', name: 'Mozambique', cont: 'AF' }, { code: 'md', name: 'Moldova', cont: 'EU' }, { code: 'mn', name: 'Mongolia', cont: 'AS' },
        { code: 'mt', name: 'Malta', cont: 'EU' }, { code: 'mk', name: 'North Macedonia', cont: 'EU' }, { code: 'am', name: 'Armenia', cont: 'AS' },
        { code: 'bf', name: 'Burkina Faso', cont: 'AF' }, { code: 'bs', name: 'Bahamas', cont: 'NA' }, { code: 'na', name: 'Namibia', cont: 'AF' },
        { code: 'al', name: 'Albania', cont: 'EU' }, { code: 'jm', name: 'Jamaica', cont: 'NA' }, { code: 'kg', name: 'Kyrgyzstan', cont: 'AS' },
        { code: 'bw', name: 'Botswana', cont: 'AF' }, { code: 'ga', name: 'Gabon', cont: 'AF' }, { code: 'ps', name: 'Palestine', cont: 'AS' },
        { code: 'ge', name: 'Georgia', cont: 'AS' }, { code: 'gq', name: 'Equatorial Guinea', cont: 'AF' }, { code: 'mu', name: 'Mauritius', cont: 'AF' },
        { code: 'ml', name: 'Mali', cont: 'AF' }, { code: 'la', name: 'Laos', cont: 'AS' }, { code: 'sn', name: 'Senegal', cont: 'AF' },
        { code: 'ba', name: 'Bosnia & Herzegovina', cont: 'EU' }, { code: 'ee', name: 'Estonia', cont: 'EU' }, { code: 'kh', name: 'Cambodia', cont: 'AS' },
        { code: 'hn', name: 'Honduras', cont: 'NA' }, { code: 'tt', name: 'Trinidad & Tobago', cont: 'NA' }, { code: 'zm', name: 'Zambia', cont: 'AF' },
        { code: 'is', name: 'Iceland', cont: 'EU' }, { code: 'sv', name: 'El Salvador', cont: 'NA' }, { code: 'lv', name: 'Latvia', cont: 'EU' },
        { code: 'ug', name: 'Uganda', cont: 'AF' }, { code: 'py', name: 'Paraguay', cont: 'SA' }, { code: 'bh', name: 'Bahrain', cont: 'AS' },
        { code: 'np', name: 'Nepal', cont: 'AS' }, { code: 'jo', name: 'Jordan', cont: 'AS' }, { code: 'tn', name: 'Tunisia', cont: 'AF' },
        { code: 'cm', name: 'Cameroon', cont: 'AF' }, { code: 'bo', name: 'Bolivia', cont: 'SA' }, { code: 'az', name: 'Azerbaijan', cont: 'AS' },
        { code: 'gh', name: 'Ghana', cont: 'AF' }, { code: 'lb', name: 'Lebanon', cont: 'AS' }, { code: 'tz', name: 'Tanzania', cont: 'AF' },
        { code: 'cr', name: 'Costa Rica', cont: 'NA' }, { code: 'si', name: 'Slovenia', cont: 'EU' }, { code: 'lt', name: 'Lithuania', cont: 'EU' },
        { code: 'rs', name: 'Serbia', cont: 'EU' }, { code: 'uz', name: 'Uzbekistan', cont: 'AS' }, { code: 'cd', name: 'DR Congo', cont: 'AF' },
        { code: 'uy', name: 'Uruguay', cont: 'SA' }, { code: 'hr', name: 'Croatia', cont: 'EU' }, { code: 'ci', name: 'Ivory Coast', cont: 'AF' },
        { code: 'mm', name: 'Myanmar', cont: 'AS' }, { code: 'by', name: 'Belarus', cont: 'EU' }, { code: 'pa', name: 'Panama', cont: 'NA' },
        { code: 'et', name: 'Ethiopia', cont: 'AF' }, { code: 'lk', name: 'Sri Lanka', cont: 'AS' }, { code: 'om', name: 'Oman', cont: 'AS' },
        { code: 'do', name: 'Dominican Republic', cont: 'NA' }, { code: 'lu', name: 'Luxembourg', cont: 'EU' }, { code: 'gt', name: 'Guatemala', cont: 'NA' },
        { code: 'bg', name: 'Bulgaria', cont: 'EU' }, { code: 'ke', name: 'Kenya', cont: 'AF' }, { code: 've', name: 'Venezuela', cont: 'SA' },
        { code: 'qa', name: 'Qatar', cont: 'AS' }, { code: 'ma', name: 'Morocco', cont: 'AF' }, { code: 'sk', name: 'Slovakia', cont: 'EU' },
        { code: 'kw', name: 'Kuwait', cont: 'AS' }, { code: 'ec', name: 'Ecuador', cont: 'SA' }, { code: 'pr', name: 'Puerto Rico', cont: 'NA' },
        { code: 'hu', name: 'Hungary', cont: 'EU' }, { code: 'ao', name: 'Angola', cont: 'AF' }, { code: 'pe', name: 'Peru', cont: 'SA' },
        { code: 'kz', name: 'Kazakhstan', cont: 'AS' }, { code: 'dz', name: 'Algeria', cont: 'AF' }, { code: 'nz', name: 'New Zealand', cont: 'OC' },
        { code: 'iq', name: 'Iraq', cont: 'AS' }, { code: 'ua', name: 'Ukraine', cont: 'EU' }, { code: 'gr', name: 'Greece', cont: 'EU' },
        { code: 'fi', name: 'Finland', cont: 'EU' }, { code: 'pt', name: 'Portugal', cont: 'EU' }, { code: 'cz', name: 'Czechia', cont: 'EU' },
        { code: 'ro', name: 'Romania', cont: 'EU' }, { code: 'co', name: 'Colombia', cont: 'SA' }, { code: 'cl', name: 'Chile', cont: 'SA' },
        { code: 'pk', name: 'Pakistan', cont: 'AS' }, { code: 'hk', name: 'Hong Kong', cont: 'AS' }, { code: 'dk', name: 'Denmark', cont: 'EU' },
        { code: 'sg', name: 'Singapore', cont: 'AS' }, { code: 'ph', name: 'Philippines', cont: 'AS' }, { code: 'vn', name: 'Vietnam', cont: 'AS' },
        { code: 'my', name: 'Malaysia', cont: 'AS' }, { code: 'za', name: 'South Africa', cont: 'AF' }, { code: 'bd', name: 'Bangladesh', cont: 'AS' },
        { code: 'eg', name: 'Egypt', cont: 'AF' }, { code: 'th', name: 'Thailand', cont: 'AS' }, { code: 'ie', name: 'Ireland', cont: 'EU' },
        { code: 'no', name: 'Norway', cont: 'EU' }, { code: 'il', name: 'Israel', cont: 'AS' }, { code: 'at', name: 'Austria', cont: 'EU' },
        { code: 'ng', name: 'Nigeria', cont: 'AF' }, { code: 'pl', name: 'Poland', cont: 'EU' }, { code: 'se', name: 'Sweden', cont: 'EU' },
        { code: 'be', name: 'Belgium', cont: 'EU' }, { code: 'tw', name: 'Taiwan', cont: 'AS' }, { code: 'ae', name: 'United Arab Emirates', cont: 'AS' },
        { code: 'tr', name: 'Turkey', cont: 'AS' }, { code: 'sa', name: 'Saudi Arabia', cont: 'AS' }, { code: 'ch', name: 'Switzerland', cont: 'EU' },
        { code: 'nl', name: 'Netherlands', cont: 'EU' }, { code: 'id', name: 'Indonesia', cont: 'AS' }, { code: 'mx', name: 'Mexico', cont: 'NA' },
        { code: 'es', name: 'Spain', cont: 'EU' }, { code: 'au', name: 'Australia', cont: 'OC' }, { code: 'kr', name: 'South Korea', cont: 'AS' },
        { code: 'ru', name: 'Russia', cont: 'EU' }, { code: 'ca', name: 'Canada', cont: 'NA' }, { code: 'br', name: 'Brazil', cont: 'SA' },
        { code: 'it', name: 'Italy', cont: 'EU' }, { code: 'fr', name: 'France', cont: 'EU' }, { code: 'uk', name: 'United Kingdom', cont: 'EU' },
        { code: 'in', name: 'India', cont: 'AS' }, { code: 'jp', name: 'Japan', cont: 'AS' }, { code: 'de', name: 'Germany', cont: 'EU' },
        { code: 'cn', name: 'China', cont: 'AS' }, { code: 'us', name: 'United States', cont: 'NA' }, { code: 'ye', name: 'Yemen', cont: 'AS' }
    ];

    const LANG_MAP = {
        'us': 'English', 'uk': 'English', 'ca': 'English', 'au': 'English', 'nz': 'English', 'ie': 'English', 'sg': 'English',
        'gb': 'English', 'jm': 'English', 'bb': 'English', 'tt': 'English', 'bs': 'English', 'gy': 'English', 'bz': 'English',
        'ag': 'English', 'dm': 'English', 'gd': 'English', 'kn': 'English', 'lc': 'English', 'vc': 'English',
        'fj': 'English', 'sb': 'English', 'pg': 'English', 'vu': 'English', 'ws': 'English', 'to': 'English',
        'fm': 'English', 'pw': 'English', 'mh': 'English', 'ki': 'English', 'nr': 'English', 'tv': 'English',
        'es': 'Spanish', 'mx': 'Spanish', 'ar': 'Spanish', 'co': 'Spanish', 'cl': 'Spanish', 'pe': 'Spanish',
        've': 'Spanish', 'ec': 'Spanish', 'gt': 'Spanish', 'cu': 'Spanish', 'bo': 'Spanish', 'do': 'Spanish',
        'hn': 'Spanish', 'py': 'Spanish', 'sv': 'Spanish', 'ni': 'Spanish', 'cr': 'Spanish', 'pr': 'Spanish',
        'pa': 'Spanish', 'uy': 'Spanish', 'gq': 'Spanish',
        'fr': 'French', 'be': 'French', 'ch': 'German', 'lu': 'French', 'mc': 'French', 'sn': 'French', 'mg': 'French',
        'ci': 'French', 'cm': 'French', 'ne': 'French', 'bf': 'French', 'ml': 'French', 'gn': 'French', 'td': 'French',
        'ht': 'French', 'cg': 'French', 'ga': 'French', 'dj': 'French', 'km': 'French', 'cd': 'French', 'cf': 'French',
        'tg': 'French', 'bj': 'French', 'rw': 'French',
        'de': 'German', 'at': 'German', 'li': 'German',
        'pt': 'Portuguese', 'br': 'Portuguese', 'ao': 'Portuguese', 'mz': 'Portuguese', 'gw': 'Portuguese',
        'cv': 'Portuguese', 'st': 'Portuguese',
        'ru': 'Russian', 'by': 'Russian', 'kz': 'Russian', 'kg': 'Russian', 'tj': 'Russian', 'md': 'Romanian',
        'it': 'Italian', 'sm': 'Italian', 'va': 'Italian',
        'cn': 'Chinese', 'tw': 'Chinese', 'hk': 'Chinese',
        'jp': 'Japanese',
        'kr': 'Korean',
        'in': 'Hindi',
        'pk': 'Urdu',
        'bd': 'Bengali',
        'id': 'Indonesian',
        'my': 'Malay',
        'ph': 'Tagalog',
        'vn': 'Vietnamese',
        'th': 'Thai',
        'la': 'Lao', 'kh': 'Khmer', 'mm': 'Burmese', 'mn': 'Mongolian', 'lk': 'Sinhala', 'mv': 'Dhivehi',
        'tr': 'Turkish',
        'sa': 'Arabic', 'eg': 'Arabic', 'ae': 'Arabic', 'iq': 'Arabic', 'dz': 'Arabic', 'ma': 'Arabic',
        'sd': 'Arabic', 'sy': 'Arabic', 'tn': 'Arabic', 'ye': 'Arabic', 'lb': 'Arabic', 'jo': 'Arabic',
        'ps': 'Arabic', 'mr': 'Arabic', 'ly': 'Arabic', 'kw': 'Arabic', 'om': 'Arabic', 'qa': 'Arabic', 'bh': 'Arabic',
        'ir': 'Persian', 'af': 'Persian',
        'pl': 'Polish',
        'ua': 'Ukrainian',
        'ro': 'Romanian',
        'nl': 'Dutch',
        'gr': 'Greek', 'cy': 'Greek',
        'cz': 'Czech',
        'hu': 'Hungarian',
        'se': 'Swedish',
        'no': 'Norwegian',
        'dk': 'Danish',
        'fi': 'Finnish',
        'sk': 'Slovak',
        'bg': 'Bulgarian',
        'rs': 'Serbian',
        'hr': 'Croatian',
        'lt': 'Lithuanian',
        'si': 'Slovenian',
        'lv': 'Latvian',
        'ee': 'Estonian',
        'il': 'Hebrew',
        'al': 'Albanian', 'xk': 'Albanian',
        'mk': 'Macedonian', 'ba': 'Bosnian', 'me': 'Montenegrin',
        'am': 'Armenian', 'ge': 'Georgian', 'az': 'Azerbaijani',
        'uz': 'Uzbek', 'tm': 'Turkmen',
        'so': 'Somali', 'et': 'Amharic', 'er': 'Tigrinya',
        'tz': 'Swahili', 'ke': 'Swahili', 'ug': 'Swahili',
        'ng': 'English', 'gh': 'English', 'sl': 'English', 'lr': 'English', 'gm': 'English',
        'zw': 'English', 'zm': 'English', 'mw': 'English', 'bw': 'English', 'na': 'English', 'sz': 'English', 'ls': 'English',
        'za': 'English', 'mu': 'English', 'sc': 'English',
        'np': 'Nepali', 'bt': 'Dzongkha', 'tl': 'Tetum', 'is': 'Icelandic', 'mt': 'Maltese'
    };

    const LANG_PRIORITY = [
        'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Turkish', 'Polish', 'Dutch'
    ];

    const CONTINENT_NAMES = {
        'AF': 'Africa', 'AS': 'Asia', 'EU': 'Europe',
        'NA': 'North America', 'SA': 'South America', 'OC': 'Oceania'
    };

    const DEFAULT_BLOCKED_COUNTRIES = [
        'ae', 'al', 'am', 'bd', 'dz', 'eg', 'gr', 'id', 'in', 'iq',
        'jo', 'ke', 'kw', 'lb', 'lk', 'ma', 'my', 'ng', 'np', 'ph',
        'pk', 'qa', 'sa', 'sc', 'tn', 'tr', 'ye'
    ];

	// [UPDATED] LOAD SETTINGS IMMEDIATELY (Synchronous)
    // [NEW] Precision geo-fence: state / province / subdivision filter. Bundled
    //   centroid database (capitals + geographic centers, ~radius in km).
    //   Lookup uses two signals: (1) name match against the partner region,
    //   (2) Haversine distance vs centroid using partner lat/lng. Either signal
    //   is sufficient — combined gives best accuracy for noisy IP geolocation.
    const RAW_REGIONS = [
        { id: "IN-AN", c: "IN", n: "Andaman and Nicobar Islands", lat: 11.62, lng: 92.73, r: 200 },
        { id: "IN-AP", c: "IN", n: "Andhra Pradesh",              lat: 15.91, lng: 79.74, r: 250 },
        { id: "IN-AR", c: "IN", n: "Arunachal Pradesh",            lat: 28.21, lng: 94.73, r: 300 },
        { id: "IN-AS", c: "IN", n: "Assam",                        lat: 26.20, lng: 92.93, r: 250 },
        { id: "IN-BR", c: "IN", n: "Bihar",                        lat: 25.78, lng: 85.77, r: 220 },
        { id: "IN-CG", c: "IN", n: "Chhattisgarh",                 lat: 21.27, lng: 81.86, r: 220 },
        { id: "IN-CH", c: "IN", n: "Chandigarh",                   lat: 30.73, lng: 76.78, r: 30  },
        { id: "IN-DH", c: "IN", n: "Dadra and Nagar Haveli and Daman and Diu", lat: 20.37, lng: 73.02, r: 60 },
        { id: "IN-DL", c: "IN", n: "Delhi",                        lat: 28.70, lng: 77.10, r: 50  },
        { id: "IN-GA", c: "IN", n: "Goa",                          lat: 15.30, lng: 74.00, r: 80  },
        { id: "IN-GJ", c: "IN", n: "Gujarat",                      lat: 22.26, lng: 71.19, r: 280 },
        { id: "IN-HR", c: "IN", n: "Haryana",                      lat: 29.06, lng: 76.09, r: 180 },
        { id: "IN-HP", c: "IN", n: "Himachal Pradesh",             lat: 31.10, lng: 77.17, r: 200 },
        { id: "IN-JK", c: "IN", n: "Jammu and Kashmir",            lat: 33.78, lng: 76.58, r: 220 },
        { id: "IN-JH", c: "IN", n: "Jharkhand",                    lat: 23.61, lng: 85.32, r: 200 },
        { id: "IN-KA", c: "IN", n: "Karnataka",                    lat: 14.51, lng: 75.74, r: 280 },
        { id: "IN-KL", c: "IN", n: "Kerala",                       lat: 10.85, lng: 76.27, r: 150 },
        { id: "IN-LA", c: "IN", n: "Ladakh",                       lat: 34.30, lng: 76.89, r: 250 },
        { id: "IN-LD", c: "IN", n: "Lakshadweep",                  lat: 10.57, lng: 72.64, r: 60  },
        { id: "IN-MP", c: "IN", n: "Madhya Pradesh",               lat: 23.81, lng: 78.04, r: 300 },
        { id: "IN-MH", c: "IN", n: "Maharashtra",                  lat: 19.20, lng: 75.74, r: 300 },
        { id: "IN-MN", c: "IN", n: "Manipur",                      lat: 24.66, lng: 93.91, r: 150 },
        { id: "IN-ML", c: "IN", n: "Meghalaya",                    lat: 25.50, lng: 91.36, r: 130 },
        { id: "IN-MZ", c: "IN", n: "Mizoram",                      lat: 23.45, lng: 92.98, r: 150 },
        { id: "IN-NL", c: "IN", n: "Nagaland",                     lat: 26.16, lng: 94.59, r: 130 },
        { id: "IN-OD", c: "IN", n: "Odisha",                       lat: 20.59, lng: 84.06, r: 240 },
        { id: "IN-PY", c: "IN", n: "Puducherry",                   lat: 11.93, lng: 79.83, r: 40  },
        { id: "IN-PB", c: "IN", n: "Punjab",                       lat: 30.85, lng: 75.85, r: 180 },
        { id: "IN-RJ", c: "IN", n: "Rajasthan",                    lat: 26.45, lng: 74.50, r: 350 },
        { id: "IN-SK", c: "IN", n: "Sikkim",                       lat: 27.59, lng: 88.51, r: 100 },
        { id: "IN-TN", c: "IN", n: "Tamil Nadu",                   lat: 10.79, lng: 78.30, r: 250 },
        { id: "IN-TG", c: "IN", n: "Telangana",                    lat: 17.86, lng: 78.94, r: 180 },
        { id: "IN-TR", c: "IN", n: "Tripura",                      lat: 23.94, lng: 91.99, r: 110 },
        { id: "IN-UP", c: "IN", n: "Uttar Pradesh",                lat: 26.85, lng: 80.95, r: 320 },
        { id: "IN-UT", c: "IN", n: "Uttarakhand",                  lat: 30.07, lng: 79.32, r: 180 },
        { id: "IN-WB", c: "IN", n: "West Bengal",                  lat: 23.40, lng: 87.86, r: 220 },
        { id: "US-AL", c: "US", n: "Alabama",              lat: 32.32, lng: -86.90,  r: 200 },
        { id: "US-AK", c: "US", n: "Alaska",               lat: 64.20, lng: -149.49, r: 800 },
        { id: "US-AZ", c: "US", n: "Arizona",              lat: 34.27, lng: -111.66, r: 350 },
        { id: "US-AR", c: "US", n: "Arkansas",             lat: 35.20, lng: -92.44,  r: 220 },
        { id: "US-CA", c: "US", n: "California",           lat: 36.78, lng: -119.42, r: 450 },
        { id: "US-CO", c: "US", n: "Colorado",             lat: 39.06, lng: -105.31, r: 300 },
        { id: "US-CT", c: "US", n: "Connecticut",          lat: 41.60, lng: -72.73,  r: 130 },
        { id: "US-DE", c: "US", n: "Delaware",             lat: 39.32, lng: -75.51,  r: 80  },
        { id: "US-FL", c: "US", n: "Florida",              lat: 28.43, lng: -82.45,  r: 320 },
        { id: "US-GA", c: "US", n: "Georgia",              lat: 32.83, lng: -83.50,  r: 230 },
        { id: "US-HI", c: "US", n: "Hawaii",               lat: 20.80, lng: -156.33, r: 350 },
        { id: "US-ID", c: "US", n: "Idaho",                lat: 44.06, lng: -114.41, r: 350 },
        { id: "US-IL", c: "US", n: "Illinois",             lat: 40.00, lng: -89.00,  r: 280 },
        { id: "US-IN", c: "US", n: "Indiana",              lat: 40.27, lng: -86.13,  r: 220 },
        { id: "US-IA", c: "US", n: "Iowa",                 lat: 41.88, lng: -93.10,  r: 230 },
        { id: "US-KS", c: "US", n: "Kansas",               lat: 38.50, lng: -98.00,  r: 280 },
        { id: "US-KY", c: "US", n: "Kentucky",             lat: 37.84, lng: -85.30,  r: 240 },
        { id: "US-LA", c: "US", n: "Louisiana",            lat: 31.00, lng: -92.00,  r: 240 },
        { id: "US-ME", c: "US", n: "Maine",                lat: 45.40, lng: -69.20,  r: 200 },
        { id: "US-MD", c: "US", n: "Maryland",             lat: 39.05, lng: -76.80,  r: 160 },
        { id: "US-MA", c: "US", n: "Massachusetts",        lat: 42.40, lng: -72.10,  r: 150 },
        { id: "US-MI", c: "US", n: "Michigan",             lat: 44.34, lng: -85.40,  r: 300 },
        { id: "US-MN", c: "US", n: "Minnesota",            lat: 46.00, lng: -94.00,  r: 320 },
        { id: "US-MS", c: "US", n: "Mississippi",          lat: 32.74, lng: -89.67,  r: 220 },
        { id: "US-MO", c: "US", n: "Missouri",             lat: 38.50, lng: -92.50,  r: 260 },
        { id: "US-MT", c: "US", n: "Montana",              lat: 47.05, lng: -110.00, r: 400 },
        { id: "US-NE", c: "US", n: "Nebraska",             lat: 41.50, lng: -99.50,  r: 280 },
        { id: "US-NV", c: "US", n: "Nevada",               lat: 39.00, lng: -117.00, r: 320 },
        { id: "US-NH", c: "US", n: "New Hampshire",        lat: 43.70, lng: -71.50,  r: 130 },
        { id: "US-NJ", c: "US", n: "New Jersey",           lat: 40.20, lng: -74.50,  r: 130 },
        { id: "US-NM", c: "US", n: "New Mexico",           lat: 34.40, lng: -106.00, r: 320 },
        { id: "US-NY", c: "US", n: "New York",             lat: 43.29, lng: -74.21,  r: 280 },
        { id: "US-NC", c: "US", n: "North Carolina",       lat: 35.50, lng: -79.50,  r: 250 },
        { id: "US-ND", c: "US", n: "North Dakota",         lat: 47.45, lng: -100.50, r: 280 },
        { id: "US-OH", c: "US", n: "Ohio",                 lat: 40.42, lng: -82.92,  r: 220 },
        { id: "US-OK", c: "US", n: "Oklahoma",             lat: 35.50, lng: -97.50,  r: 280 },
        { id: "US-OR", c: "US", n: "Oregon",               lat: 44.00, lng: -120.50, r: 280 },
        { id: "US-PA", c: "US", n: "Pennsylvania",         lat: 40.90, lng: -77.50,  r: 240 },
        { id: "US-RI", c: "US", n: "Rhode Island",         lat: 41.70, lng: -71.50,  r: 60  },
        { id: "US-SC", c: "US", n: "South Carolina",       lat: 33.80, lng: -80.90,  r: 200 },
        { id: "US-SD", c: "US", n: "South Dakota",         lat: 44.40, lng: -100.30, r: 280 },
        { id: "US-TN", c: "US", n: "Tennessee",            lat: 35.85, lng: -86.00,  r: 240 },
        { id: "US-TX", c: "US", n: "Texas",                lat: 31.96, lng: -99.90,  r: 500 },
        { id: "US-UT", c: "US", n: "Utah",                 lat: 39.30, lng: -111.50, r: 280 },
        { id: "US-VT", c: "US", n: "Vermont",              lat: 44.00, lng: -72.50,  r: 130 },
        { id: "US-VA", c: "US", n: "Virginia",             lat: 37.50, lng: -78.50,  r: 240 },
        { id: "US-WA", c: "US", n: "Washington",           lat: 47.40, lng: -120.50, r: 280 },
        { id: "US-WV", c: "US", n: "West Virginia",        lat: 38.50, lng: -80.50,  r: 200 },
        { id: "US-WI", c: "US", n: "Wisconsin",            lat: 44.50, lng: -89.50,  r: 260 },
        { id: "US-WY", c: "US", n: "Wyoming",              lat: 43.00, lng: -107.50, r: 320 },
        { id: "BR-AC", c: "BR", n: "Acre",            lat: -9.02,  lng: -70.81, r: 300 },
        { id: "BR-AL", c: "BR", n: "Alagoas",         lat: -9.57,  lng: -36.78, r: 150 },
        { id: "BR-AP", c: "BR", n: "Amapa",           lat:  1.41,  lng: -51.77, r: 250 },
        { id: "BR-AM", c: "BR", n: "Amazonas",        lat: -3.42,  lng: -65.86, r: 500 },
        { id: "BR-BA", c: "BR", n: "Bahia",           lat: -12.97, lng: -41.71, r: 350 },
        { id: "BR-CE", c: "BR", n: "Ceara",           lat: -5.33,  lng: -39.62, r: 250 },
        { id: "BR-DF", c: "BR", n: "Distrito Federal",lat: -15.83, lng: -47.93, r: 50  },
        { id: "BR-ES", c: "BR", n: "Espirito Santo",  lat: -19.18, lng: -40.31, r: 180 },
        { id: "BR-GO", c: "BR", n: "Goias",           lat: -15.95, lng: -49.26, r: 300 },
        { id: "BR-MA", c: "BR", n: "Maranhao",        lat: -5.42,  lng: -45.27, r: 350 },
        { id: "BR-MT", c: "BR", n: "Mato Grosso",     lat: -12.99, lng: -55.92, r: 400 },
        { id: "BR-MS", c: "BR", n: "Mato Grosso do Sul", lat: -20.51, lng: -54.54, r: 300 },
        { id: "BR-MG", c: "BR", n: "Minas Gerais",    lat: -18.51, lng: -44.55, r: 400 },
        { id: "BR-PA", c: "BR", n: "Para",            lat: -3.79,  lng: -52.48, r: 500 },
        { id: "BR-PB", c: "BR", n: "Paraiba",         lat: -7.24,  lng: -36.78, r: 180 },
        { id: "BR-PR", c: "BR", n: "Parana",          lat: -24.89, lng: -51.55, r: 280 },
        { id: "BR-PE", c: "BR", n: "Pernambuco",      lat: -8.38,  lng: -37.86, r: 220 },
        { id: "BR-PI", c: "BR", n: "Piaui",           lat: -7.72,  lng: -42.73, r: 300 },
        { id: "BR-RJ", c: "BR", n: "Rio de Janeiro",  lat: -22.18, lng: -42.66, r: 180 },
        { id: "BR-RN", c: "BR", n: "Rio Grande do Norte", lat: -5.84, lng: -36.61, r: 180 },
        { id: "BR-RS", c: "BR", n: "Rio Grande do Sul", lat: -30.17, lng: -53.50, r: 320 },
        { id: "BR-RO", c: "BR", n: "Rondonia",        lat: -10.91, lng: -62.96, r: 280 },
        { id: "BR-RR", c: "BR", n: "Roraima",         lat:  2.81,  lng: -61.66, r: 280 },
        { id: "BR-SC", c: "BR", n: "Santa Catarina",  lat: -27.45, lng: -50.95, r: 230 },
        { id: "BR-SP", c: "BR", n: "Sao Paulo",       lat: -22.19, lng: -48.79, r: 320 },
        { id: "BR-SE", c: "BR", n: "Sergipe",         lat: -10.57, lng: -37.45, r: 120 },
        { id: "BR-TO", c: "BR", n: "Tocantins",       lat: -10.17, lng: -48.33, r: 280 },
        { id: "MX-AGU", c: "MX", n: "Aguascalientes",       lat: 21.88, lng: -102.30, r: 80  },
        { id: "MX-BCN", c: "MX", n: "Baja California",      lat: 32.50, lng: -115.50, r: 320 },
        { id: "MX-BCS", c: "MX", n: "Baja California Sur",  lat: 25.50, lng: -111.50, r: 280 },
        { id: "MX-CAM", c: "MX", n: "Campeche",             lat: 19.00, lng: -90.50,  r: 200 },
        { id: "MX-CHP", c: "MX", n: "Chiapas",              lat: 16.50, lng: -92.50,  r: 280 },
        { id: "MX-CHH", c: "MX", n: "Chihuahua",            lat: 28.80, lng: -106.50, r: 420 },
        { id: "MX-CMX", c: "MX", n: "Ciudad de Mexico",     lat: 19.43, lng: -99.13,  r: 50  },
        { id: "MX-COA", c: "MX", n: "Coahuila",             lat: 27.30, lng: -102.00, r: 350 },
        { id: "MX-COL", c: "MX", n: "Colima",               lat: 19.10, lng: -103.90, r: 100 },
        { id: "MX-DUR", c: "MX", n: "Durango",              lat: 24.80, lng: -104.80, r: 320 },
        { id: "MX-GUA", c: "MX", n: "Guanajuato",           lat: 21.00, lng: -101.00, r: 220 },
        { id: "MX-GRO", c: "MX", n: "Guerrero",             lat: 17.50, lng: -99.80,  r: 280 },
        { id: "MX-HID", c: "MX", n: "Hidalgo",              lat: 20.50, lng: -99.00,  r: 150 },
        { id: "MX-JAL", c: "MX", n: "Jalisco",              lat: 20.50, lng: -103.50, r: 280 },
        { id: "MX-MEX", c: "MX", n: "Mexico",               lat: 19.50, lng: -99.50,  r: 280 },
        { id: "MX-MIC", c: "MX", n: "Michoacan",            lat: 19.50, lng: -101.50, r: 280 },
        { id: "MX-MOR", c: "MX", n: "Morelos",              lat: 18.80, lng: -99.00,  r: 100 },
        { id: "MX-NAY", c: "MX", n: "Nayarit",              lat: 22.00, lng: -105.00, r: 220 },
        { id: "MX-NLE", c: "MX", n: "Nuevo Leon",           lat: 25.50, lng: -99.80,  r: 200 },
        { id: "MX-OAX", c: "MX", n: "Oaxaca",               lat: 17.00, lng: -96.50,  r: 320 },
        { id: "MX-PUE", c: "MX", n: "Puebla",               lat: 18.80, lng: -98.00,  r: 200 },
        { id: "MX-QUE", c: "MX", n: "Queretaro",            lat: 20.80, lng: -99.80,  r: 130 },
        { id: "MX-ROO", c: "MX", n: "Quintana Roo",         lat: 19.50, lng: -88.00,  r: 250 },
        { id: "MX-SLP", c: "MX", n: "San Luis Potosi",      lat: 22.50, lng: -100.50, r: 280 },
        { id: "MX-SIN", c: "MX", n: "Sinaloa",              lat: 24.50, lng: -107.50, r: 280 },
        { id: "MX-SON", c: "MX", n: "Sonora",               lat: 29.50, lng: -110.50, r: 380 },
        { id: "MX-TAB", c: "MX", n: "Tabasco",              lat: 17.80, lng: -92.50,  r: 150 },
        { id: "MX-TAM", c: "MX", n: "Tamaulipas",           lat: 24.00, lng: -98.50,  r: 280 },
        { id: "MX-TLA", c: "MX", n: "Tlaxcala",             lat: 19.50, lng: -98.20,  r: 80  },
        { id: "MX-VER", c: "MX", n: "Veracruz",             lat: 19.50, lng: -96.50,  r: 320 },
        { id: "MX-YUC", c: "MX", n: "Yucatan",              lat: 20.80, lng: -89.00,  r: 200 },
        { id: "MX-ZAC", c: "MX", n: "Zacatecas",            lat: 23.00, lng: -102.50, r: 280 },
        { id: "CA-AB", c: "CA", n: "Alberta",           lat: 53.55, lng: -114.50, r: 500 },
        { id: "CA-BC", c: "CA", n: "British Columbia",  lat: 53.73, lng: -123.50, r: 500 },
        { id: "CA-MB", c: "CA", n: "Manitoba",          lat: 53.75, lng: -97.50,  r: 450 },
        { id: "CA-NB", c: "CA", n: "New Brunswick",     lat: 46.50, lng: -66.00,  r: 200 },
        { id: "CA-NL", c: "CA", n: "Newfoundland and Labrador", lat: 53.50, lng: -60.00, r: 450 },
        { id: "CA-NS", c: "CA", n: "Nova Scotia",       lat: 45.00, lng: -63.00,  r: 200 },
        { id: "CA-NT", c: "CA", n: "Northwest Territories", lat: 64.00, lng: -115.00, r: 600 },
        { id: "CA-NU", c: "CA", n: "Nunavut",           lat: 67.00, lng: -90.00,  r: 600 },
        { id: "CA-ON", c: "CA", n: "Ontario",           lat: 48.00, lng: -82.00,  r: 500 },
        { id: "CA-PE", c: "CA", n: "Prince Edward Island", lat: 46.30, lng: -63.20, r: 80 },
        { id: "CA-QC", c: "CA", n: "Quebec",            lat: 52.00, lng: -71.00,  r: 500 },
        { id: "CA-SK", c: "CA", n: "Saskatchewan",      lat: 53.00, lng: -106.00, r: 500 },
        { id: "CA-YT", c: "CA", n: "Yukon",             lat: 63.00, lng: -135.00, r: 400 },
        { id: "GB-ENG", c: "GB", n: "England",     lat: 52.50, lng: -1.50,  r: 280 },
        { id: "GB-NIR", c: "GB", n: "Northern Ireland", lat: 54.60, lng: -6.50, r: 120 },
        { id: "GB-SCT", c: "GB", n: "Scotland",    lat: 56.50, lng: -4.20,  r: 280 },
        { id: "GB-WLS", c: "GB", n: "Wales",       lat: 52.10, lng: -3.70,  r: 150 },
        { id: "DE-BW", c: "DE", n: "Baden-Wurttemberg", lat: 48.50, lng: 9.00,   r: 200 },
        { id: "DE-BY", c: "DE", n: "Bavaria",           lat: 48.79, lng: 11.49,  r: 250 },
        { id: "DE-BE", c: "DE", n: "Berlin",            lat: 52.52, lng: 13.40,  r: 50  },
        { id: "DE-BB", c: "DE", n: "Brandenburg",       lat: 52.40, lng: 13.50,  r: 200 },
        { id: "DE-HB", c: "DE", n: "Bremen",            lat: 53.08, lng: 8.80,   r: 50  },
        { id: "DE-HH", c: "DE", n: "Hamburg",           lat: 53.55, lng: 9.99,   r: 50  },
        { id: "DE-HE", c: "DE", n: "Hesse",             lat: 50.60, lng: 9.00,   r: 200 },
        { id: "DE-MV", c: "DE", n: "Mecklenburg-Vorpommern", lat: 53.80, lng: 12.50, r: 200 },
        { id: "DE-NI", c: "DE", n: "Lower Saxony",      lat: 52.80, lng: 9.50,   r: 250 },
        { id: "DE-NW", c: "DE", n: "North Rhine-Westphalia", lat: 51.50, lng: 7.50, r: 200 },
        { id: "DE-RP", c: "DE", n: "Rhineland-Palatinate", lat: 49.80, lng: 7.50, r: 180 },
        { id: "DE-SL", c: "DE", n: "Saarland",          lat: 49.40, lng: 6.80,   r: 80  },
        { id: "DE-SN", c: "DE", n: "Saxony",            lat: 51.00, lng: 13.50,  r: 200 },
        { id: "DE-ST", c: "DE", n: "Saxony-Anhalt",     lat: 51.80, lng: 11.50,  r: 200 },
        { id: "DE-SH", c: "DE", n: "Schleswig-Holstein",lat: 54.20, lng: 9.50,   r: 150 },
        { id: "DE-TH", c: "DE", n: "Thuringia",         lat: 50.90, lng: 11.00,  r: 150 },
        { id: "AU-NSW", c: "AU", n: "New South Wales", lat: -32.00, lng: 147.00, r: 400 },
        { id: "AU-VIC", c: "AU", n: "Victoria",        lat: -37.00, lng: 145.00, r: 250 },
        { id: "AU-QLD", c: "AU", n: "Queensland",      lat: -22.00, lng: 144.00, r: 700 },
        { id: "AU-WA",  c: "AU", n: "Western Australia", lat: -25.00, lng: 122.00, r: 800 },
        { id: "AU-SA",  c: "AU", n: "South Australia", lat: -30.00, lng: 136.00, r: 500 },
        { id: "AU-TAS", c: "AU", n: "Tasmania",        lat: -42.00, lng: 147.00, r: 200 },
        { id: "AU-ACT", c: "AU", n: "Australian Capital Territory", lat: -35.30, lng: 149.00, r: 80 },
        { id: "AU-NT",  c: "AU", n: "Northern Territory", lat: -19.00, lng: 133.00, r: 700 },
        { id: "JP-01", c: "JP", n: "Hokkaido",  lat: 43.06, lng: 141.35, r: 400 },
        { id: "JP-02", c: "JP", n: "Aomori",    lat: 40.82, lng: 140.74, r: 130 },
        { id: "JP-03", c: "JP", n: "Iwate",     lat: 39.72, lng: 141.15, r: 150 },
        { id: "JP-04", c: "JP", n: "Miyagi",    lat: 38.27, lng: 140.87, r: 130 },
        { id: "JP-05", c: "JP", n: "Akita",     lat: 39.72, lng: 140.10, r: 150 },
        { id: "JP-06", c: "JP", n: "Yamagata",  lat: 38.26, lng: 140.34, r: 130 },
        { id: "JP-07", c: "JP", n: "Fukushima", lat: 37.40, lng: 140.50, r: 180 },
        { id: "JP-08", c: "JP", n: "Ibaraki",   lat: 36.30, lng: 140.30, r: 150 },
        { id: "JP-09", c: "JP", n: "Tochigi",   lat: 36.55, lng: 139.88, r: 130 },
        { id: "JP-10", c: "JP", n: "Gunma",     lat: 36.40, lng: 139.10, r: 130 },
        { id: "JP-11", c: "JP", n: "Saitama",   lat: 35.95, lng: 139.65, r: 100 },
        { id: "JP-12", c: "JP", n: "Chiba",     lat: 35.60, lng: 140.10, r: 130 },
        { id: "JP-13", c: "JP", n: "Tokyo",     lat: 35.68, lng: 139.69, r: 80  },
        { id: "JP-14", c: "JP", n: "Kanagawa",  lat: 35.45, lng: 139.40, r: 80  },
        { id: "JP-15", c: "JP", n: "Niigata",   lat: 37.50, lng: 138.85, r: 200 },
        { id: "JP-16", c: "JP", n: "Toyama",    lat: 36.65, lng: 137.30, r: 100 },
        { id: "JP-17", c: "JP", n: "Ishikawa",  lat: 36.50, lng: 136.65, r: 100 },
        { id: "JP-18", c: "JP", n: "Fukui",     lat: 35.85, lng: 136.20, r: 100 },
        { id: "JP-19", c: "JP", n: "Yamanashi", lat: 35.60, lng: 138.50, r: 80  },
        { id: "JP-20", c: "JP", n: "Nagano",    lat: 36.20, lng: 138.10, r: 200 },
        { id: "JP-21", c: "JP", n: "Gifu",      lat: 35.80, lng: 137.00, r: 180 },
        { id: "JP-22", c: "JP", n: "Shizuoka",  lat: 35.00, lng: 138.30, r: 180 },
        { id: "JP-23", c: "JP", n: "Aichi",     lat: 35.10, lng: 137.10, r: 150 },
        { id: "JP-24", c: "JP", n: "Mie",       lat: 34.70, lng: 136.50, r: 150 },
        { id: "JP-25", c: "JP", n: "Shiga",     lat: 35.10, lng: 136.20, r: 80  },
        { id: "JP-26", c: "JP", n: "Kyoto",     lat: 35.20, lng: 135.75, r: 100 },
        { id: "JP-27", c: "JP", n: "Osaka",     lat: 34.70, lng: 135.50, r: 80  },
        { id: "JP-28", c: "JP", n: "Hyogo",     lat: 35.00, lng: 134.85, r: 150 },
        { id: "JP-29", c: "JP", n: "Nara",      lat: 34.40, lng: 135.85, r: 80  },
        { id: "JP-30", c: "JP", n: "Wakayama",  lat: 33.85, lng: 135.65, r: 120 },
        { id: "JP-31", c: "JP", n: "Tottori",   lat: 35.40, lng: 134.30, r: 100 },
        { id: "JP-32", c: "JP", n: "Shimane",   lat: 35.20, lng: 132.65, r: 150 },
        { id: "JP-33", c: "JP", n: "Okayama",   lat: 34.85, lng: 133.85, r: 130 },
        { id: "JP-34", c: "JP", n: "Hiroshima", lat: 34.50, lng: 132.85, r: 150 },
        { id: "JP-35", c: "JP", n: "Yamaguchi", lat: 34.20, lng: 131.55, r: 150 },
        { id: "JP-36", c: "JP", n: "Tokushima", lat: 34.00, lng: 134.20, r: 100 },
        { id: "JP-37", c: "JP", n: "Kagawa",    lat: 34.30, lng: 134.05, r: 80  },
        { id: "JP-38", c: "JP", n: "Ehime",     lat: 33.80, lng: 132.85, r: 150 },
        { id: "JP-39", c: "JP", n: "Kochi",     lat: 33.50, lng: 133.50, r: 150 },
        { id: "JP-40", c: "JP", n: "Fukuoka",   lat: 33.50, lng: 130.70, r: 130 },
        { id: "JP-41", c: "JP", n: "Saga",      lat: 33.25, lng: 130.30, r: 80  },
        { id: "JP-42", c: "JP", n: "Nagasaki",  lat: 32.85, lng: 129.85, r: 150 },
        { id: "JP-43", c: "JP", n: "Kumamoto",  lat: 32.65, lng: 130.75, r: 150 },
        { id: "JP-44", c: "JP", n: "Oita",      lat: 33.20, lng: 131.50, r: 150 },
        { id: "JP-45", c: "JP", n: "Miyazaki",  lat: 31.90, lng: 131.40, r: 150 },
        { id: "JP-46", c: "JP", n: "Kagoshima", lat: 31.50, lng: 130.50, r: 200 },
        { id: "JP-47", c: "JP", n: "Okinawa",   lat: 26.30, lng: 127.80, r: 130 },

    ];
    function normalizeRegionName(name) {
        if (!name || typeof name !== "string") return "";
        return name.toLowerCase().replace(/\bstate\b/g, "").replace(/[^a-z0-9]/g, "").trim();
    }

    const REGION_BY_NAME = {};
    const REGION_BY_COUNTRY = {};
    RAW_REGIONS.forEach(function(r) {
        var key = normalizeRegionName(r.n);
        if (!key) return;
        if (!REGION_BY_NAME[key]) REGION_BY_NAME[key] = [];
        REGION_BY_NAME[key].push(r);
        if (!REGION_BY_COUNTRY[r.c]) REGION_BY_COUNTRY[r.c] = {};
        REGION_BY_COUNTRY[r.c][r.id] = r;
    });

    function calculateHaversine(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.asin(Math.sqrt(a));
    }

    function matchGeoRegion(apiData) {
        if (!apiData) return null;
        var ccode = (apiData.country_code || "").toUpperCase();
        var candidates = [];
        var normName = normalizeRegionName(apiData.region);
        if (normName && REGION_BY_NAME[normName]) {
            candidates = REGION_BY_NAME[normName].filter(function(c) { return c.c === ccode; }).slice();
            if (candidates.length === 0 && ccode) {
                // ipwho.is returns region names without country prefix; if filtered to 0, 
                // fall back to any-country with same normalized name (rare, e.g. "Georgia").
                candidates = REGION_BY_NAME[normName].slice();
            }
        }
        var devLat = parseFloat(apiData.latitude);
        var devLng = parseFloat(apiData.longitude);
        var hasCoords = !isNaN(devLat) && !isNaN(devLng);
        var closest = null, minDist = Infinity;
        if (hasCoords && ccode && REGION_BY_COUNTRY[ccode]) {
            var countryRegions = REGION_BY_COUNTRY[ccode];
            for (var rid in countryRegions) {
                if (!Object.prototype.hasOwnProperty.call(countryRegions, rid)) continue;
                var r = countryRegions[rid];
                var d = calculateHaversine(devLat, devLng, r.lat, r.lng);
                if (d < minDist) { minDist = d; closest = r; }
            }
        }
        if (candidates.length === 1) return candidates[0]; // unique name => trust it
        if (closest && minDist <= closest.r * 1.5) return closest; // Haversine passes
        if (candidates.length > 0) return candidates[0]; // best-effort name match
        return null;
    }

    function loadSettings() {
        // 1. Core Toggles (Target: ON by default)
        ipBlockingEnabled = GM_getValue('ome_ip_blocking_enabled', false);

        // FIX: Changed default from true to false
        isDarkModeActive = GM_getValue('ome_dark_mode_active', false); 
        areWatermarksHidden = isDarkModeActive;

        isIPGrabbingEnabled = GM_getValue('ome_ip_grabbing', true);
        isReportProtectionEnabled = GM_getValue('ome_report_protection', false);
        isFaceProtectionEnabled = GM_getValue('ome_face_protection', false);
        isFingerprintSpoofingEnabled = GM_getValue('ome_fingerprint_spoofing', false);
        isAntiBotEnabled = GM_getValue('ome_anti_bot', false);

        // [NEW] Feature Toggles
        isThumbnailCaptureEnabled = GM_getValue('ome_thumb_capture', true);
        isReportSoundEnabled = GM_getValue('ome_report_sound', false);

        // 2. Core Toggles (Target: OFF by default)
        countryBlockingEnabled = GM_getValue('ome_country_blocking_enabled', false);
        FAKE_CONFIG.rawAudio = GM_getValue('ome_raw_audio', false);
        FAKE_CONFIG.spoofDeviceNames = GM_getValue('ome_spoof_devices', false);
        FAKE_CONFIG.forceRelay = GM_getValue('ome_force_relay', false);
        FAKE_CONFIG.udpStrict = GM_getValue('ome_udp_strict', false);
        FAKE_CONFIG.enabled = GM_getValue('ome_fake_cam_enabled', false);
        FAKE_CONFIG.antiBanFrames = GM_getValue('ome_antiban_frames', false);

        // [NEW] Resolution Logic
        const savedRes = GM_getValue('ome_cam_resolution', '640x480');
        const [w, h] = savedRes.split('x').map(Number);
        FAKE_CONFIG.canvasSize = { width: w || 640, height: h || 480 };

        // [SYNC LOGIC] Default One Device Modes to match Spoof Device Names
        const defaultOneMode = FAKE_CONFIG.spoofDeviceNames;

        FAKE_CONFIG.oneCameraMode = GM_getValue('ome_one_cam_mode', defaultOneMode);
        FAKE_CONFIG.oneInputMode = GM_getValue('ome_one_input_mode', defaultOneMode);
        FAKE_CONFIG.oneOutputMode = GM_getValue('ome_one_output_mode', defaultOneMode);

        FAKE_CONFIG.videoURL = GM_getValue('ome_fake_video_url', '');

        // 4. Device Labels (Keep existing logic)
        const loadLabels = (key, defaultArr) => {
             try {
                 const raw = GM_getValue(key, null);
                 const arr = raw ? JSON.parse(raw) : defaultArr;
                 return (Array.isArray(arr) && arr.length === 4) ? arr : defaultArr;
             } catch(e) { return defaultArr; }
         };
         FAKE_CONFIG.videoLabels = loadLabels('ome_video_labels', DEFAULT_VIDEO_LABELS);
         FAKE_CONFIG.audioInputLabels = loadLabels('ome_audio_input_labels', DEFAULT_AUDIO_INPUT_LABELS);
         FAKE_CONFIG.audioOutputLabels = loadLabels('ome_audio_output_labels', DEFAULT_AUDIO_OUTPUT_LABELS);

         try { customHiddenSelectors = new Set(JSON.parse(GM_getValue('ome_custom_hidden', '[]'))); } catch (e) { customHiddenSelectors = new Set(); }
         try { customBlackoutSelectors = new Set(JSON.parse(GM_getValue('ome_custom_blackout', '[]'))); } catch (e) { customBlackoutSelectors = new Set(); }

        // [NEW] Gender filter persistence
        try {
            genderFilterMode = GM_getValue('ome_gender_filter_mode', 'off');
            if (!['off', 'skip-women', 'skip-men'].includes(genderFilterMode)) genderFilterMode = 'off';
            useNameHeuristic = GM_getValue('ome_use_name_heuristic', false) === true;
            genderCache = JSON.parse(GM_getValue('ome_gender_cache', '{}'));
            if (!genderCache || typeof genderCache !== 'object') genderCache = {};
        } catch(e) { genderCache = {}; useNameHeuristic = false; }

         console.log("[Ome-IP] Settings Loaded (Safe Mode Defaults)");
    }

    // Global variables
    let currentIP = null;
    let isRelayIP = false;
    let currentRelayType = "";
    let currentApiData = null;
    let callTimerInterval = null;
    let callSeconds = 0;
    let globalVolume = 1.0;
    let myOwnIPData = null;
    let isThumbnailCaptureEnabled = true;
    let isReportSoundEnabled = true;

    // --- NEW GLOBALS FOR UI ---
    let isDarkModeActive = false;
    let customHiddenSelectors = new Set();
    let customBlackoutSelectors = new Set();
    let elementSelectorMode = null;
    let longPressTimer = null;
    let isMenuOpen = false;

    // --- NEW GLOBAL STATE ---
    let isStreetViewActive = false;
    let isUILocked = false; // [NEW] Task 4: Lock State

    // Status Counters
    let facesDetectedCount = 0;
    let reportsBlockedCount = 0;
    let areWatermarksHidden = true;
    let isWsProtectionActive = false;

    // [UPDATED] Task 2: DEFAULTS (Only IP Grab/Block ON by default)
    let isFaceProtectionEnabled = false;
    let isReportProtectionEnabled = false;
    let isIPGrabbingEnabled = true; // Default ON
    let isFingerprintSpoofingEnabled = false;
    // v2.3: Per-session fingerprint seed — rotates all canvas/WebGL fingerprints each page load
    let fingerprintSeed = Math.floor(Math.random() * 0xFFFFFFFF);
    let isAntiBotEnabled = false; // [NEW] Task 1: Anti-Bot Toggle
    let banDetected = false; // v2.4: Ban detection state — prevents duplicate modals

    // UI State
    let currentCountrySort = 'az';
    let countryBlockingEnabled = false;
    // [NEW] Precision geo-fence state (default OFF for privacy)
    let stateBlockingEnabled = false;
    // [NEW] Cycle modes for the unified geo-fence toggle dot. Drives both legacy flags.
    let geoFenceMode = 'off'; // 'off' | 'state' | 'country' | 'both'
    let footgunGuardHasFired = false;
    let stateBlockMode = "block"; // "block" | "allow" (whitelist)
    let blockedRegionsCache = new Set();
    // [NEW] Standalone CSV region filter (independent from precision geo-fence).
    //   Substring match against `currentApiData.region`. Works for any country
    //   ipwho.is returns a region for, even if not in the bundled RAW_REGIONS DB.
    // [NEW] Standalone CSV region filter (independent from precision geo-fence).
    //   Substring match against `currentApiData.region`. Works for any country
    //   ipwho.is returns a region for, even if not in the bundled RAW_REGIONS DB.
    //   Optional disambiguation: CSV may include "Region, ISO" (e.g. "New York, US")
    //   so a token like "new" does not false-positive match "New South Wales" (AU).
    let stateFilterCsvEnabled = false;
    let stateFilterCsvText = "";
    let stateFilterCsvTokens = new Set();
    let stateFilterCsvIsoByToken = new Map();
    function hydrateCsvTokens() {
        stateFilterCsvTokens.clear();
        stateFilterCsvIsoByToken.clear();
        if (!stateFilterCsvText) return;
        stateFilterCsvText.split(",").forEach(function(t) {
            const m = String(t || "").trim().match(/^(.+?)(?:,\s*([A-Za-z]{2}))?$/);
            if (!m) return;
            const tok = m[1].toLowerCase().replace(/[^a-z0-9]/g, "").trim();
            if (tok.length >= 3) {
                stateFilterCsvTokens.add(tok);
                if (m[2]) stateFilterCsvIsoByToken.set(tok, m[2].toUpperCase());
            }
        });
    }
    let ipBlockingEnabled = false; // SAFE MODE

    // [NEW] Gender filter state
    //   genderFilterMode: 'off' | 'skip-women' | 'skip-men'
    //   genderCache:        { "<ip>": "f" | "m" | "u" }
    //   useNameHeuristic:   opt-in best-effort name->gender parsing
    let genderFilterMode = 'off';
    let genderCache = {};
    let useNameHeuristic = false;
    // [NEW] Thumbnail-based gender classifier (webcam frame) - default ON, can be disabled
    let useThumbnailHeuristic = false; // [CORRECTED] opt-in: edit ome-ip.js to set true AND reinstall, OR (per-session override) set unsafeWindow.ome_ip_state.useThumbnailHeuristic = true in DevTools BEFORE the next partner connects (read at top of applyThumbnailHeuristicIfEnabled).
    // [NEW] face-api.js load state machine
    let faceApiState = "unloaded"; // unloaded | loading | ready | failed
    let thumbnailClassifyFailCount = 0;

    // [SHARED] Single source of truth for gender filter + tag UI. Add new modes here ONLY.
    //   - DATA keyed by MODE; code maps to genderCache values
    //   - dotIcon/dotLabel -> floating status dot icon + tooltip
    //   - dropdownLabel    -> settings panel <select> option text
    //   - icon/label/color/bg -> live-stats tag badge + pills
    //   - skipReasonLabel  -> word used in auto-skip reason strings
    // Helpers rely on `this` -- always call as GENDER.x(...), never destructure
    const GENDER = {
        MODES: ['off', 'skip-women', 'skip-men'],
        // Note: entryForCode('u') intentionally returns DATA['off'] (the
        // 'unknown' entry treated as 'no opinion'). Use hasCode() if you
        // need to distinguish 'u' as a real stored tag from 'missing'.
        DATA: {
            'off': {
                mode: 'off', code: 'u',
                dotIcon: '⊘', dotLabel: 'Off',
                dropdownLabel: 'Off (no skip)',
                icon: '?', label: '? Unknown',
                color: '#888888', bg: '#88888833',
                skipReasonLabel: 'unknown',
                tagName: 'Unknown'
            },
            'skip-women': {
                mode: 'skip-women', code: 'f',
                dotIcon: '♀', dotLabel: 'Skip Women',
                dropdownLabel: 'Skip Women',
                icon: '♀', label: '♀ Woman',
                color: '#FF66AA', bg: '#FF66AA33',
                skipReasonLabel: 'woman',
                tagName: 'Woman'
            },
            'skip-men': {
                mode: 'skip-men', code: 'm',
                dotIcon: '♂', dotLabel: 'Skip Men',
                dropdownLabel: 'Skip Men',
                icon: '♂', label: '♂ Man',
                color: '#66CCFF', bg: '#66CCFF33',
                skipReasonLabel: 'man',
                tagName: 'Man'
            }
        },
        entryForMode(mode) { return this.DATA[mode] || this.DATA['off']; },
        entryForCode(code) {
            for (const key of this.MODES)
                if (this.DATA[key].code === code) return this.DATA[key];
            return this.DATA['off'];
        },
        hasCode(code) {
            // Single-loop via entryForCode's off-fallback: for unknown code, entryForCode
            // returns DATA['off'] whose code is 'u'; the equality check correctly returns
            // false (unless the caller actually passed 'u'). For real codes ('f'/'m'/'u'),
            // the same entry is returned and the equality yields true.
            return this.entryForCode(code).code === code;
        },
        nameOf(code) {
            // Direct field read. Suitable for TAG-context call sites (applyTag toast).
            // For unknown codes, returns 'Unknown' (DATA['off'].tagName) -- the 'u' tag
            // is rendered as 'Unknown' even though the off entry represents "filter off".
            return this.entryForCode(code).tagName;
        },
        nextMode(cur) {
            const idx = this.MODES.indexOf(cur);
            if (idx === -1) return this.MODES[0];
            return this.MODES[(idx + 1) % this.MODES.length];
        },
        shouldSkipTag(mode, tag) {
            const w = this.DATA['skip-women'], m = this.DATA['skip-men'];
            return (mode === w.mode && tag === w.code)
                || (mode === m.mode && tag === m.code);
        },
        skipReasonFor(tag) {
            const e = this.entryForCode(tag);
            return 'Filtered Gender: ' + (e ? e.skipReasonLabel : 'unknown');
        }
    };
    let expandedContinents = new Set();
    let isWindowTransparent = false;
    let lastActiveTab = "tab-countries";

    // Skip Logic (v2.3 anti-detection: human-like randomized delays + rate limiter)
    let lastSkipTime = 0;
    const SKIP_DELAY_MIN = 2500;   // minimum ms between skips (was 1500 — too fast)
    const SKIP_DELAY_MAX = 9000;   // maximum ms between skips
    const SKIP_BURST_LIMIT = 4;    // max skips before forced cooldown
    let skipBurstCount = 0;
    let skipBurstWindowStart = 0;
    let fallbackMethod = 'esc1';
    const SKIP_STAY_CHANCE = 0.15; // 15% chance to stay on blocked match (looks human)

    // Editing State
    let isEditing = false;
    let editingIP = null;

    // Dev Logs
    let devLogs = [];
    const MAX_DEV_LOGS = 500;

    // Cache
    let ipHistoryCache = null;
    let blockedIPsCache = null;
    let blockedCountriesCache = null;
    let isDirty = false;
    let saveTimeout = null;

    const MAX_HISTORY_ITEMS = 1000;
    const KEEP_NEWEST_ITEMS = 500;

    // --- UTILITIES ---

    class VideoFrameManager {
        static async initialize() {
            // Create a canvas for fake frames to bypass "black screen" detection
            if (!window.fakeFrameCanvas) {
                window.fakeFrameCanvas = document.createElement('canvas');
                window.fakeFrameCanvas.width = 640;
                window.fakeFrameCanvas.height = 480;
            }
        }
        static getDynamicFrame() {
            // Creates a noisy frame to trick static image detection
            const canvas = document.createElement('canvas');
            canvas.width = 640; canvas.height = 480;
            const ctx = canvas.getContext('2d');

            // Fill with dark base
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, 640, 480);

            // Add subtle random noise (Anti-fingerprint for video feed)
            const imageData = ctx.getImageData(0, 0, 640, 480);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const val = 10 + Math.random() * 20; // Dark grey noise
                data[i] = val;     // R
                data[i+1] = val;   // G
                data[i+2] = val;   // B
                data[i+3] = 255;   // Alpha
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }
        static getDynamicFrameData() {
            return this.getDynamicFrame().toDataURL('image/jpeg', 0.85).split(';base64,')[1];
        }
    }

    class SessionDataCollector {
        static initialize() {
            // Hooks remote video metadata to ensure we grab session info as early as possible
            const observer = new MutationObserver((mutations) => {
                const remoteVideo = document.getElementById('remoteVideo') || document.querySelector('video:not(#localVideo)');
                if (remoteVideo && !remoteVideo.isHookedByUFix) {
                    this.augmentMetadataHook(remoteVideo);
                    remoteVideo.isHookedByUFix = true;
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        static augmentMetadataHook(remoteVideo) {
            const originalOnLoadedMetadata = remoteVideo.onloadedmetadata;
            remoteVideo.onloadedmetadata = (...args) => {
                if (typeof originalOnLoadedMetadata === 'function') originalOnLoadedMetadata.apply(remoteVideo, args);
                // This hook ensures the browser acknowledges the stream is active
                console.log("[Ome-IP] Stream metadata loaded - Session Active");
            };
        }
    }

	// --- ENHANCED FINGERPRINT SPOOFING (PERSISTENT) ---
    class EnhancedUserPersona {
        constructor() {
            // 1. Try to load saved persona from storage
            const savedData = GM_getValue('ome_persona_data', null);

            if (savedData) {
                // Load existing identity
                const data = JSON.parse(savedData);
                this.platform = data.platform;
                this.hardwareConcurrency = data.hardwareConcurrency;
                this.deviceMemory = data.deviceMemory;
                this.userAgent = data.userAgent;
                this.scrollLength = data.scrollLength;
                console.log("[Ome-IP] Loaded Saved Persona:", this.platform);
            } else {
                // Generate NEW identity
                const platforms = ["Win32", "MacIntel", "Linux x86_64"];
                this.platform = platforms[Math.floor(Math.random() * platforms.length)];
                // Realistic hardware stats
                this.hardwareConcurrency = [4, 8, 12, 16][Math.floor(Math.random() * 4)];
                this.deviceMemory = [8, 16, 32][Math.floor(Math.random() * 3)];
                this.userAgent = this.generateUserAgent();
                // Randomize scroll length to look like a real user session
                this.scrollLength = Math.floor(Math.random() * (40000 - 15000 + 1)) + 15000;
                
                // SAVE IT
                this.save();
                console.log("[Ome-IP] Generated New Persona:", this.platform);
            }
        }

        save() {
            GM_setValue('ome_persona_data', JSON.stringify({
                platform: this.platform,
                hardwareConcurrency: this.hardwareConcurrency,
                deviceMemory: this.deviceMemory,
                userAgent: this.userAgent,
                scrollLength: this.scrollLength
            }));
        }

        generateUserAgent() {
            const version = Math.floor(Math.random() * (115 - 105 + 1)) + 105;
            if (this.platform === 'Win32') {
                return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;
            } else if (this.platform === 'MacIntel') {
                return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;
            } else {
                return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;
            }
        }
    }

    const globalPersona = new EnhancedUserPersona();
    function initializeFingerprintBypasses() {
        if (!isFingerprintSpoofingEnabled) return;

        try {
            const spoofedProperties = {
                webdriver: { value: false },
                hardwareConcurrency: { value: globalPersona.hardwareConcurrency },
                deviceMemory: { value: globalPersona.deviceMemory },
                platform: { value: globalPersona.platform },
                userAgent: { value: globalPersona.userAgent },
                plugins: {
                    get: new Proxy(function () { return [1, 2, 3]; }, {
                        apply: (target, thisArg, args) => Reflect.apply(target, thisArg, args),
                        get: (target, prop) => prop === 'length' ? 3 : target[prop],
                        toString: () => 'function plugins() { [native code] }',
                    })
                }
            };

            const define = (obj, prop, descriptor) => {
                Object.defineProperty(obj, prop, {
                    ...descriptor,
                    configurable: false,
                    enumerable: true,
                });
            };

            for (const prop in spoofedProperties) {
                define(navigator, prop, spoofedProperties[prop]);
            }

            // --- Anti-Bot & Variance Bypasses ---
            const secureDefine = (prop, value) => Object.defineProperty(window, prop, { value, writable: false, configurable: true });

            secureDefine('calculateScrollLength', () => globalPersona.scrollLength);
            secureDefine('setGIFSelector', async () => crypto.randomUUID().replace(/-/g, ''));
            secureDefine('testGIF', async () => Math.random() * (150 - 50) + 50);
            secureDefine('bypass', true);

            // AFK Timer Bypass
            window.setAfk = () => { clearTimeout(window.afkTimer); };
            // Fake user activity to prevent timeouts
            setInterval(() => { if (window.lastUserActivity) window.lastUserActivity = Date.now(); }, 60000);

            console.log("[Ome-IP] Enhanced Fingerprint & Anti-Bot Bypasses Active");

            // --- v2.3 CANVAS FINGERPRINT ROTATION ---
            // Simple PRNG seeded by session (shared between canvas and WebGL hooks)
            function makeRng(s) {
                return function() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
            }

            // Canvas fingerprinting renders hidden text/shapes and hashes the output.
            // Different GPUs produce slightly different pixels. We intercept canvas
            // reads to inject per-session noise, making each session's fingerprint unique.
            (function hookCanvasFingerprint() {
                const seed = fingerprintSeed;
                // Capture native getContext BEFORE we override it
                const nativeGetContext = HTMLCanvasElement.prototype.getContext;
                const rng = makeRng(seed);
                // Track already-hooked contexts to prevent nested wrappers
                const hookedContexts = new WeakSet();

                // Hook 2D context fillText/strokeText to add imperceptible noise
                HTMLCanvasElement.prototype.getContext = function(...args) {
                    const ctx = nativeGetContext.apply(this, args);
                    if (ctx && args[0] === '2d' && !hookedContexts.has(ctx)) {
                        hookedContexts.add(ctx);
                        const origFillText = ctx.fillText;
                        const origStrokeText = ctx.strokeText;
                        const noiseOffset = rng() * 0.3 - 0.15; // ±0.15px noise
                        ctx.fillText = function(text, x, y, maxWidth) {
                            ctx.save();
                            ctx.translate(noiseOffset, noiseOffset);
                            ctx.globalAlpha = 0.999 + rng() * 0.002;
                            origFillText.call(ctx, text, x, y, maxWidth);
                            ctx.restore();
                        };
                        ctx.strokeText = function(text, x, y, maxWidth) {
                            ctx.save();
                            ctx.translate(noiseOffset, noiseOffset);
                            origStrokeText.call(ctx, text, x, y, maxWidth);
                            ctx.restore();
                        };
                    }
                    return ctx;
                };

                // Hook toDataURL/toBlob — use temp canvas to avoid corrupting original
                const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
                const origToBlob = HTMLCanvasElement.prototype.toBlob;
                HTMLCanvasElement.prototype.toDataURL = function(...args) {
                    const area = this.width * this.height;
                    // Only modify fingerprint-sized canvases (skip large photos/charts)
                    if (area > 0 && area < 500000) {
                        try {
                            const ctx = nativeGetContext.call(this, '2d');
                            if (ctx) {
                                const imgData = ctx.getImageData(0, 0, this.width, this.height);
                                const d = imgData.data;
                                for (let i = 0; i < d.length; i += 4) {
                                    const n = Math.floor(rng() * 3) - 1; // -1, 0, or +1
                                    d[i] = Math.min(255, Math.max(0, d[i] + n));
                                    d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
                                    d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
                                }
                                // Write to temp canvas to avoid corrupting the original
                                const tmp = document.createElement('canvas');
                                tmp.width = this.width;
                                tmp.height = this.height;
                                nativeGetContext.call(tmp, '2d').putImageData(imgData, 0, 0);
                                return origToDataURL.call(tmp, ...args);
                            }
                        } catch(e) { /* silently fall back if canvas is tainted */ }
                    }
                    return origToDataURL.apply(this, args);
                };
                HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
                    const area = this.width * this.height;
                    if (area > 0 && area < 500000) {
                        try {
                            const ctx = nativeGetContext.call(this, '2d');
                            if (ctx) {
                                const imgData = ctx.getImageData(0, 0, this.width, this.height);
                                const d = imgData.data;
                                for (let i = 0; i < d.length; i += 4) {
                                    const n = Math.floor(rng() * 3) - 1;
                                    d[i] = Math.min(255, Math.max(0, d[i] + n));
                                    d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
                                    d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
                                }
                                const tmp = document.createElement('canvas');
                                tmp.width = this.width;
                                tmp.height = this.height;
                                nativeGetContext.call(tmp, '2d').putImageData(imgData, 0, 0);
                                return origToBlob.call(tmp, callback, ...args);
                            }
                        } catch(e) { /* silently fall back */ }
                    }
                    return origToBlob.call(this, callback, ...args);
                };
                console.log("[Ome-IP] Canvas fingerprint rotation active");
            })();

            // --- v2.3 WEBGL FINGERPRINT ROTATION ---
            (function hookWebGLFingerprint() {
                const rng = makeRng(fingerprintSeed + 7777);

                // Platform-aware GPU renderer pools
                const platform = (globalPersona && globalPersona.platform) || 'Win32';
                const GPU_RENDERERS_WIN = [
                    'ANGLE (NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)',
                    'ANGLE (NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)',
                    'ANGLE (NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0)',
                    'ANGLE (AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0)',
                    'ANGLE (Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
                    'ANGLE (Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0)',
                ];
                const GPU_RENDERERS_MAC = [
                    'Apple M1', 'Apple M2', 'Apple M3', 'Apple M1 Pro',
                    'AMD Radeon Pro 5500M OpenGL Engine', 'AMD Radeon Pro 5300M OpenGL Engine',
                ];
                const GPU_RENDERERS_LINUX = [
                    'Mesa Intel(R) UHD Graphics 630 (CML GT2)',
                    'Mesa Intel(R) Iris(R) Xe Graphics (TGL GT2)',
                    'Mesa Intel(R) HD Graphics 620 (KBL GT2)',
                    'NVIDIA GeForce RTX 3060/PCIe/SSE2',
                    'AMD Radeon RX 6700 XT (navi22, LLVM 15.0.7, DRM 3.49)',
                ];
                const GPU_RENDERERS = platform === 'MacIntel' ? GPU_RENDERERS_MAC
                    : platform === 'Linux x86_64' ? GPU_RENDERERS_LINUX
                    : GPU_RENDERERS_WIN;

                const GPU_VENDORS_WIN = ['Google Inc. (NVIDIA)', 'Google Inc. (AMD)', 'Google Inc. (Intel)'];
                const GPU_VENDORS_MAC = ['Apple Inc.', 'Apple'];
                const GPU_VENDORS_LINUX = ['Intel Open Source Technology Center', 'NVIDIA Corporation', 'AMD'];
                const GPU_VENDORS = platform === 'MacIntel' ? GPU_VENDORS_MAC
                    : platform === 'Linux x86_64' ? GPU_VENDORS_LINUX
                    : GPU_VENDORS_WIN;

                const rendererIdx = Math.floor(rng() * GPU_RENDERERS.length);
                const vendorIdx = Math.floor(rng() * GPU_VENDORS.length);

                // Precompute extension drop decision once per session
                const dropDebugExt = rng() > 0.5;

                // Safe numeric params to add noise to (texture/size limits that vary between GPUs)
                const SAFE_NOISE_PARAMS = new Set([0x0D33, 0x0D35, 0x0D36, 0x0D37, 0x0D38]);

                const webglProto = WebGLRenderingContext.prototype;
                const webgl2Proto = (typeof WebGL2RenderingContext !== 'undefined') ? WebGL2RenderingContext.prototype : null;

                [webglProto, webgl2Proto].forEach(function(proto) {
                    if (!proto) return;
                    const origGetParam = proto.getParameter;
                    proto.getParameter = function(pname) {
                        const result = origGetParam.call(this, pname);
                        if (pname === 0x9245) return GPU_VENDORS[vendorIdx];
                        if (pname === 0x9246) return GPU_RENDERERS[rendererIdx];
                        // Only add noise to safe size/texture params that naturally vary
                        if (typeof result === 'number' && SAFE_NOISE_PARAMS.has(pname)) {
                            return result + (Math.floor(rng() * 3) - 1);
                        }
                        return result;
                    };

                    const origGetShaderPrecision = proto.getShaderPrecisionFormat;
                    if (origGetShaderPrecision) {
                        proto.getShaderPrecisionFormat = function(shaderType, precisionType) {
                            const fmt = origGetShaderPrecision.call(this, shaderType, precisionType);
                            if (fmt) {
                                const variation = Math.floor(rng() * 3) - 1;
                                return {
                                    rangeMin: fmt.rangeMin + variation,
                                    rangeMax: fmt.rangeMax + variation,
                                    precision: Math.max(1, fmt.precision + variation)
                                };
                            }
                            return fmt;
                        };
                    }

                    const origGetExt = proto.getExtension;
                    proto.getExtension = function(name) {
                        const dropExtensions = ['WEBGL_debug_renderer_info', 'WEBGL_debug_shaders'];
                        if (dropExtensions.indexOf(name) !== -1 && dropDebugExt) {
                            return null;
                        }
                        return origGetExt.call(this, name);
                    };
                });
                console.log("[Ome-IP] WebGL fingerprint rotation active");
            })();

        } catch (e) {
            console.log("[Ome-IP] Fingerprint init failed", e);
        }
    }


   function initializeCorePrivacyBypasses() { if (!isFingerprintSpoofingEnabled && !isAntiBotEnabled) return;
        // 1. BroadcastChannel Bypass (Stops multi-tab detection)
        if (window.BroadcastChannel) {
            const originalBC = window.BroadcastChannel;
            window.BroadcastChannel = new Proxy(originalBC, {
                construct(target, [name]) {
                    if (/^(tab|session|multitab-check)/i.test(name)) {
                        console.log(`[Ome-IP] Blocked BroadcastChannel: ${name}`);
                        // Return a dummy object that does nothing
                        return {
                            postMessage: () => { },
                            close: () => { },
                            onmessage: null,
                            onerror: null,
                            addEventListener: () => {}
                        };
                    }
                    return new target(name);
                }
            });
        }

        // 2. Eval & Proxy Hooks (Stops Penalty Flags)
        // This prevents the site from running code that sets 'isBlocked' variables
        const originalEval = window.eval;
        window.eval = (script) => {
            if (typeof script === 'string' && (script.includes('FaceOverlay') || script.includes('blocked'))) {
                console.log('[Ome-IP] 🛡️ Blocked Penalty Script execution');
                return null;
            }
            return originalEval(script);
        };

        // 3. Prevent 'blocked' property from being set to true
        let _blocked = false;
        try {
            Object.defineProperty(window, 'blocked', {
                get: () => false,
                set: (v) => { console.log("[Ome-IP] 🛡️ Prevented setting 'blocked' flag"); if (!banDetected) showBanRecoveryModal(); }
            });
        } catch(e) {} // Ignore if already defined

        // 4. Hook Session End/Skip (Clean state management)
        const wrap = (original, name) => function (...args) {
            return typeof original === 'function' ? original.apply(this, args) : undefined;
        };
        if (window.onEnd) window.onEnd = wrap(window.onEnd, 'onEnd');
        if (window.pressSkip) window.pressSkip = wrap(window.pressSkip, 'pressSkip');
    }

    // --- PORTED uHELPER FACE BYPASS (Smart Lazy-Load) ---
    function initializeGlobalFaceBypasses() {
        // v2.4: Multi-face images for realistic head rotation — 3 angles
        const DEFAULT_FACE_URLS = [
            "https://i.imgur.com/qVF5AOb.png",            // Front-facing (existing default)
            "https://i.imgur.com/ome-face-left.png",      // Slight left angle  — REPLACE with your image
            "https://i.imgur.com/ome-face-right.png"      // Slight right angle — REPLACE with your image
        ];
        const savedUrls = GM_getValue('ome_face_urls', '');
        const FACE_URLS = savedUrls ? savedUrls.split(',').map(u => u.trim()).filter(u => u.length > 5) : DEFAULT_FACE_URLS;
        
        const faceImages = FACE_URLS.map((url, i) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            // Don't set img.src here — only load when face protection is enabled
            return img;
        });
        
        let isFaceLoaded = false;
        // Track loading via a separate method instead of overwriting onload from map
        const markFaceLoaded = () => { isFaceLoaded = true; };
        faceImages[0].addEventListener('load', markFaceLoaded);
        // Handle already-cached images (use microtask delay for reliable naturalWidth)
        setTimeout(() => {
            if (faceImages[0].complete && faceImages[0].naturalWidth > 0) isFaceLoaded = true;
        }, 50);

        const loadFacesIfNeeded = () => {
            if (!faceImages[0].src && (isFaceProtectionEnabled || window.isFaceProtectionEnabled)) {
                FACE_URLS.forEach((url, i) => { faceImages[i].src = url; });
            }
        };
        
        // Allow users to update face URLs at runtime via console or settings
        window.setFaceUrls = function(urls) {
            if (!Array.isArray(urls) || urls.length === 0) return;
            GM_setValue('ome_face_urls', urls.join(','));
            urls.forEach((url, idx) => {
                if (idx < faceImages.length) {
                    faceImages[idx].src = url;
                }
            });
            window._omeFaceCycleState = null;
            showToast('Face URLs updated');
        };

        // Check at startup
        loadFacesIfNeeded();

        // Listen for toggle changes to load it later if needed
        window.addEventListener('ome-bypass-config', (e) => {
            if (e.detail.type === 'face' && e.detail.enabled) loadFacesIfNeeded();
        });

        const getFakeFrameData = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 640; canvas.height = 480;
            const ctx = canvas.getContext('2d');

            if (isFaceLoaded) {
                const faceImg = window._omeFaceImages ? window._omeFaceImages[0] : null;
                if (faceImg && faceImg.complete) ctx.drawImage(faceImg, 0, 0, 640, 480);
            } else {
                // Fallback (Dark Grey) if not loaded yet
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, 640, 480);
            }
            return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        };

        const originalCapture = window.captureFrameToBase64;
        Object.defineProperty(window, 'captureFrameToBase64', {
            get: () => {
                return isFaceProtectionEnabled ? () => getFakeFrameData() : originalCapture;
            },
            set: (val) => { }
        });

        const originalMakeCanvas = window.makeLocalCanvas;
        Object.defineProperty(window, 'makeLocalCanvas', {
            get: () => {
                return isFaceProtectionEnabled ? () => {
                    const c = document.createElement('canvas');
                    c.width = 640; c.height = 480;
                    if (isFaceLoaded) {
                        const fImg = window._omeFaceImages ? window._omeFaceImages[0] : null;
                        if (fImg && fImg.complete) c.getContext('2d').drawImage(fImg, 0, 0, 640, 480);
                    } else {
                        c.getContext('2d').fillStyle = "#222";
                        c.getContext('2d').fillRect(0, 0, 640, 480);
                    }
                    return c;
                } : originalMakeCanvas;
            },
            set: (val) => { }
        });

        const originalEval = window.eval;
        window.eval = function(str) {
            if (isFaceProtectionEnabled && typeof str === 'string' && str.includes('FaceOverlay')) {
                return null;
            }
            return originalEval.apply(this, arguments);
        };

        if (!window.isPenaltyProxyActive) {
            const penaltyHandler = {
                set: function(target, prop, value) {
                    if (isFaceProtectionEnabled && value === true && typeof prop === 'string' && prop.toLowerCase().includes('block')) {
                        return true; 
                    }
                    target[prop] = value;
                    return true;
                }
            };
            window.isPenaltyProxyActive = true;
        }

        console.log("[Ome-IP] Global Face Bypasses Initialized (Smart Load + Face Overlay)");
        // v2.4: Expose face images array globally for fake-cam canvas overlay
        window._omeFaceImages = faceImages;
        // Backward compat: also expose first face as _omeFaceImage
        window._omeFaceImage = faceImages[0];
    }

    // ============================================================
    // v2.4 BAN DETECTION & RECOVERY
    // ============================================================
    function initializeBanDetection() {
        // Multi-signal ban detection: DOM, URL, and WebSocket monitoring
        
        // 1. DOM MutationObserver — watch for ban-related page elements/text
        const banPatterns = [
            'you have been banned', 'your account has been suspended',
            'access denied', 'you are blocked', 'terms of service violation',
            'account suspended', 'banned from', 'not allowed to use',
            'you are banned', 'your ip has been', 'violation detected'
        ];
        
        let lastBanCheck = 0;
        const banObserver = new MutationObserver(() => {
            if (banDetected) return;
            // Debounce: only check every 800ms to avoid forced reflows on every DOM mutation
            const now = Date.now();
            if (now - lastBanCheck < 800) return;
            lastBanCheck = now;
            
            const body = document.body;
            if (!body) return;
            
            const text = (body.innerText || '').toLowerCase();
            for (const pattern of banPatterns) {
                if (text.includes(pattern)) {
                    console.log('[Ome-IP] 🚨 Ban detected via page content:', pattern);
                    showBanRecoveryModal();
                    return;
                }
            }
            
            // Check ban-related elements with visible text
            const banEls = body.querySelectorAll('[class*="ban"], [class*="block"], [class*="suspend"], [class*="restrict"], [id*="ban"], [id*="block"]');
            for (const el of banEls) {
                if (el.offsetParent !== null && el.innerText && el.innerText.length > 20) {
                    const elText = el.innerText.toLowerCase();
                    if (banPatterns.some(p => elText.includes(p))) {
                        console.log('[Ome-IP] 🚨 Ban detected via element:', el.className || el.id);
                        showBanRecoveryModal();
                        return;
                    }
                }
            }
        });
        
        const startObserving = () => {
            if (document.body) {
                banObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
                console.log('[Ome-IP] 🔍 Ban detection observer active');
            } else {
                setTimeout(startObserving, 200);
            }
        };
        startObserving();
        
        // 2. URL monitoring — detect ban page redirects
        const checkUrlForBan = () => {
            if (banDetected) return;
            const url = window.location.href.toLowerCase();
            if (url.includes('/ban') || url.includes('/block') || url.includes('/suspend') || url.includes('/restrict')) {
                console.log('[Ome-IP] 🚨 Ban detected via URL:', window.location.href);
                showBanRecoveryModal();
            }
        };
        checkUrlForBan();
        
        // 3. Monitor URL changes via popstate/hashchange
        window.addEventListener('popstate', checkUrlForBan);
        window.addEventListener('hashchange', checkUrlForBan);
        
        // 4. Hook history.pushState/replaceState to catch SPA navigation to ban pages
        const origPushState = history.pushState;
        const origReplaceState = history.replaceState;
        history.pushState = function(...args) {
            const result = origPushState.apply(this, args);
            checkUrlForBan();
            return result;
        };
        history.replaceState = function(...args) {
            const result = origReplaceState.apply(this, args);
            checkUrlForBan();
            return result;
        };
        
        console.log('[Ome-IP] 🛡️ Ban Detection & Recovery system active');
    }


    // --- THUMBNAIL UTILITY ---
    function captureVideoThumbnail() {
        const videos = Array.from(document.querySelectorAll('video'));
        const remoteVideo = videos.find(v => v.srcObject && v.videoWidth > 10 && v !== document.querySelector('#localVideo'));

        if (!remoteVideo) return null;

        try {
            const canvas = document.createElement('canvas');

            // [FIX] Dynamic Aspect Ratio to prevent squishing
            // We set a fixed width of 160px and calculate height based on the video source
            canvas.width = 160;
            if (remoteVideo.videoWidth && remoteVideo.videoHeight) {
                canvas.height = canvas.width * (remoteVideo.videoHeight / remoteVideo.videoWidth);
            } else {
                canvas.height = 90; // Fallback to 16:9 (160x90) if dimensions are missing
            }

            const ctx = canvas.getContext('2d');

            // Draw
            ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);

            // Compress heavily (JPEG 0.5 quality)
            return canvas.toDataURL('image/jpeg', 0.5);
        } catch (e) {
            return null;
        }
    }

    // --- CONFIGURATION ---
    // 1. Define the Requested Defaults
    const DEFAULT_VIDEO_LABELS = [
        "Integrated Camera",
        "USB Video Device",
        "Integrated Webcam",
        "Logi WebCam C920e"
    ];

    const DEFAULT_AUDIO_INPUT_LABELS = [
        "Microphone Array",
        "Yeti Stereo Microphone",
        "Internal Microphone",
        "Microphone (Realtek Audio)"
    ];

    const DEFAULT_AUDIO_OUTPUT_LABELS = [
        "Realtek High Definition Audio",
        "USB Audio Device",
        "USB Headset",
        "Logitech G Pro X Headset"
    ];

    const DEFAULT_CAM_NAME = DEFAULT_VIDEO_LABELS[0]; // Keep for compatibility

    // --- CONFIGURATION ---
    const FAKE_CONFIG = {
        enabled: false,
        forceRelay: false,
        spoofDeviceNames: false,
        oneCameraMode: false,
        oneInputMode: false,
        oneOutputMode: false,
        udpStrict: false,

        // [NEW] Features
        rawAudio: false,        // Default OFF (safe mode)
        antiBanFrames: false,   // Default OFF (safe mode)

        // PREFILLED DEFAULTS
        videoLabels: [...DEFAULT_VIDEO_LABELS],
        audioInputLabels: [...DEFAULT_AUDIO_INPUT_LABELS],
        audioOutputLabels: [...DEFAULT_AUDIO_OUTPUT_LABELS],

        videoURL: GM_getValue('ome_fake_video_url', ''),
        canvasSize: { width: 640, height: 480 },
        spoofedDevices: []
    };

    // --- FIX: Global variable to track the animation loop ---

    // [NEW] Local video file picker for fake-cam source.
    //   Reads any video file from the user's PC as a blob URL and sets
    //   FAKE_CONFIG.videoURL. Useful when the default remote URL is dead.
    //   Blob URLs are page-scoped; user must re-pick after each page load.
    function pickLocalFakeVideoFile() {
        return new Promise((resolve, reject) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "video/*";
            input.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;";
            input.addEventListener("change", () => {
                const file = input.files && input.files[0];
                try { input.remove(); } catch(_) {}
                if (!file) { resolve(null); return; }
                const MAX_BYTES = 200 * 1024 * 1024;  // 200MB cap to prevent browser freeze
                const btn = document.getElementById("ome-ip-local-video-btn");
                if (file.size > MAX_BYTES) {
                    if (btn) { btn.style.borderColor = "#ff0000"; btn.title = "File too large: " + (file.size / 1e6).toFixed(0) + "MB (max 200MB)"; }
                    alert("File too large (" + (file.size / 1e6).toFixed(0) + "MB). Maximum is 200MB - try compressing with ffmpeg first.");
                    reject(new Error("File too large"));
                    return;
                }
                // Visual feedback: orange = loading
                if (btn) { btn.style.borderColor = "#ffaa00"; btn.title = "Loading " + file.name + "..."; }
                const reader = new FileReader();
                reader.onload = () => {
                    const dataURL = reader.result;
                    // Cleanup any previous blob URL (best-effort)
                    try { if (FAKE_CONFIG.videoURL && FAKE_CONFIG.videoURL.startsWith("blob:")) URL.revokeObjectURL(FAKE_CONFIG.videoURL); } catch(_) {}
                    FAKE_CONFIG.videoURL = dataURL;
                    FAKE_CONFIG.pickedFilename = file.name;
                    try { GM_setValue("ome_picked_filename", file.name); } catch(_) {}
                    // Update state tracking
                    if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {};
                    unsafeWindow.ome_ip_state.videoURL = dataURL;
                    unsafeWindow.ome_ip_state.pickedFilename = file.name;
                    unsafeWindow.ome_ip_state.sourceType = "data";
                    unsafeWindow.ome_ip_state.lastChanged = Date.now();
                    updateButtonTooltips();
                    if (btn) { btn.style.borderColor = "#00FF00"; }
                    console.log("[Ome-IP] Picked local video (data URL):", file.name, "(" + (file.size / 1e6).toFixed(1) + "MB, " + dataURL.length + " chars)");
                    trySavePick(dataURL, file.name);
                    resolve({ dataURL: dataURL, filename: file.name });
                };
                reader.onerror = () => {
                    if (btn) { btn.style.borderColor = "#ff0000"; btn.title = "Error reading " + file.name; }
                    console.error("[Ome-IP] FileReader error:", reader.error);
                    reject(reader.error);
                };
                reader.readAsDataURL(file);
            }, { once: true });
            document.body.appendChild(input);
            input.click();
        });
    }
    unsafeWindow.ome_ip_pickLocalVideo = pickLocalFakeVideoFile;

    function clearLocalFakeVideoFile() {
        // Cleanup any previous blob URL (best-effort)
        try { if (FAKE_CONFIG.videoURL && FAKE_CONFIG.videoURL.startsWith("blob:")) URL.revokeObjectURL(FAKE_CONFIG.videoURL); } catch(_) {}
        // Reset to default (Google CDN test video)
        FAKE_CONFIG.videoURL = "";
        FAKE_CONFIG.pickedFilename = "";
        try { GM_setValue("ome_picked_filename", ""); } catch(_) {}
        try { GM_setValue("ome_picked_data_url", ""); } catch(_) {}
        try { GM_setValue("ome_picked_filename_cached", ""); } catch(_) {}
        // Update state tracking
        if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {};
        unsafeWindow.ome_ip_state.videoURL = FAKE_CONFIG.videoURL;
        unsafeWindow.ome_ip_state.pickedFilename = "";
        unsafeWindow.ome_ip_state.sourceType = "default";
        updateButtonTooltips();
        console.log("[Ome-IP] Cleared local video; reverted to default URL");
    }
    unsafeWindow.ome_ip_clearLocalVideo = clearLocalFakeVideoFile;
    // [NEW] Direct URL setter (used by the Set URL button and external callers).
    //   Persists http(s) URLs to GM so they survive hard-reloads.
    function setVideoURL(url, opts) {
        opts = opts || {};
        const prev = FAKE_CONFIG.videoURL;
        if (prev && prev.startsWith("blob:")) {
            try { URL.revokeObjectURL(prev); } catch (e) {}
        }
        FAKE_CONFIG.videoURL = url;
        if (!opts.skipPersist && !url.startsWith("blob:")) {
            GM_setValue("ome_fake_video_url", url);
        }
        if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {};
        unsafeWindow.ome_ip_state.videoURL = url;
        unsafeWindow.ome_ip_state.sourceType = url.startsWith("blob:") ? "blob" : (url.startsWith("http") ? "http" : "other");
        unsafeWindow.ome_ip_state.lastChanged = Date.now();
        updateButtonTooltips();
        console.log("[Ome-IP] Video URL set to:", url);
    }

    // [NEW] Update button tooltips based on current state
    function updateButtonTooltips() {
        const btn = document.getElementById("ome-ip-local-video-btn");
        if (!btn) return;
        const cur = (unsafeWindow.ome_ip_state && unsafeWindow.ome_ip_state.videoURL) || FAKE_CONFIG.videoURL;
        const fname = (unsafeWindow.ome_ip_state && unsafeWindow.ome_ip_state.pickedFilename) || "";
        if (cur && (cur.startsWith("data:") || cur.startsWith("blob:")) && fname) {
            btn.title = "Loaded: " + fname + " (right-click to reset)";
        } else if (cur && cur.startsWith("http")) {
            const disp = cur.length > 60 ? cur.slice(0, 60) + "..." : cur;
            btn.title = "Using URL: " + disp + " (right-click to reset)";
        } else {
            btn.title = "Click to pick a video file from your PC (right-click to reset)";
        }
    }

    // [NEW] Prompt for video URL (the Set URL button action)
    function setVideoURLByPrompt() {
        // [UPDATED] Always blank prompt (per user request). The input box
        // starts empty AND the prompt body no longer shows the current URL,
        // so the user can paste a new URL with no clutter and no need to
        // clear. To see the active URL, run `ome_ip_diagnose()` in DevTools
        // or hover the video-source button for its tooltip.
        const input = unsafeWindow.prompt(
            "Enter video URL (http://, https://, or blob:):\n\n" +
            "Examples:\n" +
            "  http://localhost:8765/fakevideo.mp4 (local server)\n" +
            "  https://example.com/video.mp4 (public URL)",
            ""
        );
        if (input === null) return false;
        const url = input.trim();
        if (!url) {
            clearVideoURL();
            return true;
        }
        if (!/^(https?:\/\/|blob:)/i.test(url)) {
            alert("Invalid URL. Must start with http://, https://, or blob:");
            return false;
        }
        setVideoURL(url);
        return true;
    }

    // [NEW] Clear video URL back to default
    function clearVideoURL() {
        setVideoURL("", { skipPersist: true });
        try { GM_setValue("ome_fake_video_url", ""); } catch (e) {}
        if (unsafeWindow.ome_ip_state) {
            unsafeWindow.ome_ip_state.videoURL = "";
            unsafeWindow.ome_ip_state.sourceType = "default";
        }
        updateButtonTooltips();
        console.log("[Ome-IP] Video URL reset to default");
    }

    // [NEW] Restore video URL from GM on script load (called after FAKE_CONFIG is defined)
    function restoreVideoURL() {
        try {
            const saved = GM_getValue("ome_fake_video_url", null);
            if (saved && typeof saved === "string" && saved.length > 0) {
                FAKE_CONFIG.videoURL = saved;
                if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {};
                unsafeWindow.ome_ip_state.videoURL = saved;
                unsafeWindow.ome_ip_state.sourceType = saved.startsWith("blob:") ? "blob" : "http";
                unsafeWindow.ome_ip_state.restored = true;
                console.log("[Ome-IP] Restored video URL from settings:", saved);
            }
        } catch (e) {
            console.warn("[Ome-IP] Failed to restore video URL:", e);
        }
    }

    // [NEW] Diagnostic helper - one-shot state snapshot for debugging
    async function diagnose() {
        const out = {};
        const btn = document.getElementById("ome-ip-local-video-btn");
        out.button = btn ? { title: btn.title, color: getComputedStyle(btn).backgroundColor } : "not found";
        out.state = unsafeWindow.ome_ip_state || "(not initialized)";
        const videos = document.querySelectorAll("video");
        out.videos = Array.from(videos).map((v, i) => ({
            i,
            src: v.src ? (v.src.length > 100 ? v.src.slice(0, 100) + "..." : v.src) : "(empty)",
            isBlob: v.src ? v.src.startsWith("blob:") : false,
            readyState: v.readyState,
            networkState: v.networkState,
            paused: v.paused,
            width: v.videoWidth,
            height: v.videoHeight,
            duration: isFinite(v.duration) ? v.duration : null,
            errorCode: v.error ? v.error.code : null,
            errorMsg: v.error ? v.error.message : null,
        }));
        const cur = (unsafeWindow.ome_ip_state && unsafeWindow.ome_ip_state.videoURL) || FAKE_CONFIG.videoURL;
        if (cur) {
            try {
                const method = cur.startsWith("blob:") ? "GET" : "HEAD";
                const r = await fetch(cur, { method });
                out.urlFetch = { status: r.status, ok: r.ok, type: r.headers.get("content-type"), size: r.headers.get("content-length") };
            } catch (e) {
                out.urlFetch = { error: e.message };
            }
        }
        console.log("[Ome-IP Diagnose]", out);
        try { out.thumbnailClassifier = { state: faceApiState, fails: thumbnailClassifyFailCount, ready: (faceApiState === "ready"), optIn: useThumbnailHeuristic }; } catch (_) {}
        return out;
    }

    // [NEW] Expose to window for console access
    unsafeWindow.ome_ip_setVideoURL = setVideoURL;
    unsafeWindow.ome_ip_clearVideoURL = clearVideoURL;
unsafeWindow.ome_ip_thumbnail_classify = applyThumbnailHeuristicIfEnabled;
unsafeWindow.ome_ip_thumbnail_state = function() { return { enabled: useThumbnailHeuristic, modelState: faceApiState, fails: thumbnailClassifyFailCount }; };
unsafeWindow.ome_ip_geofence_state = function() { return JSON.parse(JSON.stringify({ enabled: stateBlockingEnabled, mode: stateBlockMode, blocked: Array.from(blockedRegionsCache), dbSize: RAW_REGIONS.length })); };
unsafeWindow.ome_ip_csv_filter_state = function() { return { enabled: stateFilterCsvEnabled, tokens: Array.from(stateFilterCsvTokens), raw: stateFilterCsvText }; };
    unsafeWindow.ome_ip_diagnose = diagnose;

    // [NEW] Restore video URL on script load (runs after FAKE_CONFIG, before getUserMedia override)
    // [NEW] Save picked data URL to GM storage (survives reload). Browsers cap GM_setValue at ~5MB so we catch quota errors.
    function trySavePick(dataURL, filename) {
        try {
            GM_setValue("ome_picked_data_url", dataURL);
            GM_setValue("ome_picked_filename_cached", filename);
            console.log("[Ome-IP] Pick saved to GM (" + (dataURL.length / 1024 / 1024).toFixed(1) + "MB) - will survive reload");
        } catch (e) {
            const quota = e && ((e.name === "QuotaExceededError") || ((e.message || "").includes("Quota")) || ((e.code || 0) === 22));
            if (quota) {
                console.warn("[Ome-IP] Pick is too large for browser storage (~5MB max file size for persistence). Will NOT survive reload. Compress with ffmpeg first: ffmpeg -i input.mp4 -c:v libx264 -c:a aac -vf scale=480:-2 -b:v 500k output_small.mp4");
                // Still try to save the filename so user can see what was last picked
                try { GM_setValue("ome_picked_filename_cached", filename); } catch(_) {}
            } else {
                console.warn("[Ome-IP] Failed to save pick to GM:", e);
            }
        }
    }

    // [NEW] Restore picked data URL from GM storage on script load
    function restorePickedDataURL() {
        try {
            const saved = GM_getValue("ome_picked_data_url", null);
            if (saved && typeof saved === "string" && saved.length > 0 && saved.startsWith("data:")) {
                const fname = GM_getValue("ome_picked_filename_cached", "") || "";
                FAKE_CONFIG.videoURL = saved;
                FAKE_CONFIG.pickedFilename = fname;
                if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {};
                unsafeWindow.ome_ip_state.videoURL = saved;
                unsafeWindow.ome_ip_state.pickedFilename = fname;
                unsafeWindow.ome_ip_state.sourceType = "data";
                unsafeWindow.ome_ip_state.restored = true;
                console.log("[Ome-IP] Restored picked video from GM storage (" + (saved.length / 1024 / 1024).toFixed(1) + "MB): " + fname);
            }
        } catch (e) {
            console.warn("[Ome-IP] Failed to restore picked data URL:", e);
        }
    }

    // [NEW] Run restore on init (alongside restoreVideoURL for HTTP URLs)
    restorePickedDataURL();
    restoreVideoURL();


    // Make sure this is defined with your other globals at the top
    // let fakeCamAnimId = null;

    // --- [UPDATED] ROBUST STREAM PROCESSOR (Better Cleanup) ---
    async function createProcessedStream(sourceMedia, isFakeSource) {
        // Stop any existing animation loop first
        if (window.fakeCamAnimId) {
            cancelAnimationFrame(window.fakeCamAnimId);
            window.fakeCamAnimId = null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = FAKE_CONFIG.canvasSize.width;
        canvas.height = FAKE_CONFIG.canvasSize.height;
        const ctx = canvas.getContext('2d', { alpha: false });

        let videoElement;

        if (isFakeSource) {
            // Case 1: Fake Source (Video Element)
            videoElement = sourceMedia;
            // Attach to DOM for reliable autoplay
            videoElement.style.position = "absolute";
            videoElement.style.width = "1px";
            videoElement.style.height = "1px";
            videoElement.style.opacity = "0";
            videoElement.style.pointerEvents = "none";
            document.body.appendChild(videoElement);
            try { await videoElement.play(); } catch (e) {
                console.error("Fake video play error", e);
                // AbortError = video src changed or element removed mid-load — harmless,
                // the draw loop will keep retrying via __videoOk until readyState is ready.
                // NotSupportedError = bad codec — fatal, tell user.
                // No URL set — fatal.
                // For all others: show a warning toast but keep the canvas stream alive;
                // the gradient fallback will display until the video becomes ready.
                if (!FAKE_CONFIG.videoURL || FAKE_CONFIG.videoURL === "") {
                    showToast("⚠️ Re-pick your video file — storage was cleared (Edge Tracking Prevention)");
                    // Don't throw — keep canvas stream alive with gradient
                } else if (e && e.name === "NotSupportedError") {
                    showToast("Unsupported codec - drag file onto fixvideo.bat or use H.264+AAC 480p");
                    // Don't throw — keep canvas stream alive so site doesn't see "denied"
                } else if (e && e.name !== "AbortError") {
                    showToast("Fake-cam video error: " + (e.message || e.name));
                    // Don't throw — keep canvas stream alive
                }
                // AbortError: silent, video will retry naturally
            }
        } else {
            // Case 2: Real Source (Webcam Stream)
            videoElement = document.createElement('video');
            videoElement.srcObject = sourceMedia;
            videoElement.muted = true;
            videoElement.playsInline = true;
            await videoElement.play();
        }

        function draw() {
            // Only draw if the stream is active
            // [FIX] video-source validity: fall back to local synthetic frame if URL fails
            const __videoOk = (function() {
                if (!videoElement || typeof videoElement.readyState !== "number") return false;
                if (videoElement.readyState < 2) return false;
                if (videoElement.tagName === "VIDEO" && !videoElement.videoWidth) return false;
                return true;
            })();
            if (__videoOk && window.fakeCamAnimId) {
                    // v2.4: Update stream protection badge on every frame
                    updateStreamProtectionBadge();
                    if (FAKE_CONFIG.antiBanFrames) {
                        // Jitter Logic
                        const jX = (Math.random() - 0.5);
                        const jY = (Math.random() - 0.5);

                        if (Math.random() < 0.02) ctx.globalAlpha = 0.99;
                        else ctx.globalAlpha = 1.0;

                        ctx.drawImage(videoElement, jX, jY, canvas.width, canvas.height);
                    } else {
                        ctx.globalAlpha = 1.0;
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    }

                    // --- v2.4 FACE OVERLAY: Multi-face cycling with crossfade ---
                    // Cycles through 3 face angles (front, left, right) simulating natural head rotation
                    if (FAKE_CONFIG.enabled && isFaceProtectionEnabled && window._omeFaceImages && window._omeFaceImages.length >= 1) {
                        const faces = window._omeFaceImages;
                        
                        // Skip cycling if only 1 face available — just draw it directly
                        if (faces.length <= 1) {
                            const singleFace = faces[0];
                            if (singleFace && singleFace.complete && singleFace.naturalWidth > 0) {
                                const fX = Math.max(0, Math.min(canvas.width - 150, 4 + Math.sin(Date.now() / 3000) * 10));
                                const fY = Math.max(0, Math.min(canvas.height - 170, 4 + Math.cos(Date.now() / 2500) * 8));
                                if (!window._omeBlinkOffset) window._omeBlinkOffset = Math.floor(Math.random() * 4000);
                                const blinkCycle = ((Date.now() + window._omeBlinkOffset) % 4000) / 4000;
                                const faceAlpha = (blinkCycle > 0.92 && blinkCycle < 0.99) ? 0.25 : 0.92;
                                ctx.save();
                                ctx.globalAlpha = faceAlpha;
                                ctx.drawImage(singleFace, fX, fY, 150, 170);
                                ctx.restore();
                            }
                        } else {
                        if (!window._omeFaceCycleState) {
                            window._omeFaceCycleState = {
                                currentIdx: 0,
                                nextIdx: 1 % faces.length,
                                lastSwitchTime: performance.now(),
                                nextSwitchDelay: 2500 + Math.random() * 1000,
                                isCrossfading: false,
                                crossfadeStart: 0
                            };
                        }
                        const cycle = window._omeFaceCycleState;
                        const now = performance.now();
                        const CROSSFADE_MS = 300;
                        
                        if (!cycle.isCrossfading && (now - cycle.lastSwitchTime) >= cycle.nextSwitchDelay) {
                            cycle.isCrossfading = true;
                            cycle.crossfadeStart = now;
                        }
                        
                        if (cycle.isCrossfading && (now - cycle.crossfadeStart) >= CROSSFADE_MS) {
                            cycle.currentIdx = cycle.nextIdx;
                            cycle.nextIdx = (cycle.currentIdx + 1) % faces.length;
                            cycle.lastSwitchTime = now;
                            cycle.nextSwitchDelay = 2500 + Math.random() * 1000;
                            cycle.isCrossfading = false;
                        }
                        
                        const currentFace = faces[cycle.currentIdx];
                        const nextFace = faces[cycle.nextIdx];
                        if (currentFace && currentFace.complete && currentFace.naturalWidth > 0) {
                            const fX = Math.max(0, Math.min(canvas.width - 150, 4 + Math.sin(Date.now() / 3000) * 10));
                            const fY = Math.max(0, Math.min(canvas.height - 170, 4 + Math.cos(Date.now() / 2500) * 8));
                            const fW = 150;
                            const fH = 170;
                            if (!window._omeBlinkOffset) window._omeBlinkOffset = Math.floor(Math.random() * 4000);
                            const blinkCycle = ((Date.now() + window._omeBlinkOffset) % 4000) / 4000;
                            const targetOpacity = (blinkCycle > 0.92 && blinkCycle < 0.99) ? 0.25 : 0.92;
                            
                            ctx.save();
                            if (cycle.isCrossfading && nextFace && nextFace.complete && nextFace.naturalWidth > 0) {
                                const progress = (now - cycle.crossfadeStart) / CROSSFADE_MS;
                                ctx.globalAlpha = targetOpacity * (1 - progress);
                                ctx.drawImage(currentFace, fX, fY, fW, fH);
                                ctx.globalAlpha = targetOpacity * progress;
                                ctx.drawImage(nextFace, fX, fY, fW, fH);
                            } else {
                                ctx.globalAlpha = targetOpacity;
                                ctx.drawImage(currentFace, fX, fY, fW, fH);
                            }
                            ctx.restore();
                        }
                    }
                    }
            } else if (window.fakeCamAnimId) {
                ctx.globalAlpha = 1.0;
                const __t = Date.now() / 1000;
                const __w = canvas.width, __h = canvas.height;
                ctx.fillStyle = "#0a0a14"; ctx.fillRect(0, 0, __w, __h);
                const __r = 200 + Math.sin(__t * 0.7) * 100;
                const __cx = __w/2 + Math.cos(__t * 0.3) * 100;
                const __cy = __h/2 + Math.sin(__t * 0.4) * 80;
                try {
                    const __grad = ctx.createRadialGradient(__cx, __cy, 10, __cx, __cy, __r);
                    __grad.addColorStop(0, "rgba(80,120,220," + (0.4 + Math.sin(__t) * 0.2) + ")");
                    __grad.addColorStop(1, "rgba(10,10,20,0)");
                    ctx.fillStyle = __grad;
                    ctx.fillRect(0, 0, __w, __h);
                } catch(_e) {}
                // [FIX] Removed FAKE CAM text + timestamp. ome.tv applies transform:
                //   scaleX(-1) to the local preview, so any text drawn on the canvas
                //   appears mirrored to the user. The animated gradient alone is enough
                //   to signal that fake-cam is producing live frames. The toggle UI
                //   already shows fake-cam status.
                // No overlay: text would mirror under transform: scaleX(-1); the gradient IS the signal.
            }
            window.fakeCamAnimId = requestAnimationFrame(draw);
        }
        // Start the loop and save the ID globally
        window.fakeCamAnimId = requestAnimationFrame(draw);

        // [FIX] captureStream throws SecurityError on FIREFOX when the canvas
        // gets tainted by a cross-origin video that lacks CORS headers.
        // Bubble up so caller can fall back (e.g. to real camera). Cancel our
        // animation loop first to avoid leaking it on the failure path.
        let stream;
        try {
            stream = canvas.captureStream(30);
        } catch (err) {
            if (window.fakeCamAnimId) {
                cancelAnimationFrame(window.fakeCamAnimId);
                window.fakeCamAnimId = null;
            }
            throw new Error("Canvas tainted (CORS): " + (err.message || err));
        }
        const track = stream.getVideoTracks()[0];

        // --- ENHANCED CLEANUP LOGIC ---
        if (track) {
            const originalStop = track.stop.bind(track);
            track.stop = () => {
                // 1. Stop the Jitter Animation Loop
                if (window.fakeCamAnimId) {
                    cancelAnimationFrame(window.fakeCamAnimId);
                    window.fakeCamAnimId = null;
                }

                // 2. Cleanup The Source
                if (isFakeSource) {
                    // Stop the fake video file from playing/buffering in background
                    try {
                        videoElement.pause();
                        videoElement.src = "";
                        videoElement.load();
                        videoElement.remove(); // Remove from DOM memory
                    } catch(e) {}
                } else {
                    // Stop the Real Hardware Camera (Turn off the green light)
                    if (sourceMedia.getVideoTracks) {
                        sourceMedia.getVideoTracks().forEach(t => t.stop());
                    }
                    // Clean up the temporary video element used for processing
                    videoElement.srcObject = null;
                    videoElement.remove();
                }

                // 3. Stop the Canvas Stream Track
                originalStop();
            };
        }
        return stream;
    }

    // 2. Intercept getUserMedia (Audio & Video)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const originalGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    // [OME-IP FIX] Defensive wrapper for originalGUM. The override below calls
    //   originalGUM() in multiple scenarios (pass-through, audio-splice,
    //   anti-ban, spoof). Each scenario previously passed the FULL constraints
    //   object, which lit up the camera/mic permission prompt on ome.tv even
    //   when only mic was needed. Repeated prompts trained users into
    //   blocking them - and once blocked, the browser caches the denial and
    //   every subsequent reload throws NotAllowedError BEFORE the user even
    //   sees ome.tv. The wrapper below catches that error and emits a clear
    //   console message + a top-of-page banner telling the user the EXACT
    //   fix: open Site Settings, reset permissions for ome.tv, then reload.
    const __showPermissionBanner = () => {
        try {
            if (window.__omeIP_permissionBannerShown) return;
            window.__omeIP_permissionBannerShown = true;
            const banner = document.createElement("div");
            banner.id = "__ome-ip-permission-banner";
            banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:999999;padding:14px 20px;background:#b91c1c;color:#fff;font:600 14px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);cursor:pointer;";
            banner.innerHTML = "Ome-ip: ome.tv denied permission for camera/mic (browser-cached from a previous session). Click the lock icon in the URL bar → <u>Reset permissions</u> → reload this page. (This banner can be dismissed.)";
            banner.onclick = () => banner.remove();
            if (document.body) document.body.appendChild(banner);
            else document.addEventListener("DOMContentLoaded", () => document.body && document.body.appendChild(banner), { once: true });
            setTimeout(() => { try { banner.remove(); } catch(_){} }, 30000);
        } catch(_){}
    };
    async function __safeGUM(constraints) {
        try {
            return await originalGUM(constraints);
        } catch (e) {
            // [FIX] OverconstrainedError recovery: retry with deviceId/exact stripped
            if (e && e.name === "OverconstrainedError" && constraints && typeof constraints === "object") {
                try {
                    const stripped = {};
                    for (const k of Object.keys(constraints)) {
                        const v = constraints[k];
                        if (v && typeof v === "object" && !Array.isArray(v)) {
                            const { deviceId, exact, ...rest } = v;
                            stripped[k] = rest;
                        } else {
                            stripped[k] = v;
                        }
                    }
                    console.warn("[ome-ip] OverconstrainedError -> retrying without deviceId/exact", { original: constraints, stripped });
                    return await originalGUM(stripped);
                } catch (e2) { e = e2; }
            }
            const name = e && e.name ? e.name : "Error";
            if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
                console.error("[ome-ip] getUserMedia permission BLOCKED by browser cache.", {
                    errorName: name,
                    errorMessage: e && e.message,
                    requestedConstraints: constraints,
                    fix: 'Open ome.tv Site Settings (lock icon in URL bar) -> Reset permissions -> reload.'
                });
                try { __showPermissionBanner(); } catch(_){}
            } else {
                console.error("[ome-ip] getUserMedia unexpected error:", e, { requestedConstraints: constraints });
            }
            throw e;
        }
    }

            navigator.mediaDevices.getUserMedia = async function(constraints) {

                // Pass through if no features are active
                if (!FAKE_CONFIG.enabled && !FAKE_CONFIG.antiBanFrames && !FAKE_CONFIG.rawAudio && !FAKE_CONFIG.spoofDeviceNames) {
                    return __safeGUM(constraints);
                }

                // [NEW] Raw Audio Mode
                if (FAKE_CONFIG.rawAudio && constraints && constraints.audio) {
                    if (typeof constraints.audio !== 'object') constraints.audio = {};
                    constraints.audio.echoCancellation = false;
                    constraints.audio.noiseSuppression = false;
                    constraints.audio.autoGainControl = false;
                    console.log("[Ome-IP] Raw Audio Enabled (Processing Disabled)");
                }

                // SCENARIO 1: Fake Camera Enabled (Always processed)
                if (FAKE_CONFIG.enabled && constraints && constraints.video) {
                    console.log("[Ome-IP] Returning Fake Camera Stream");
                    let video; // declared outside try so catch can access it
                    try {
                        // [FIX] Check for empty URL BEFORE creating the video element.
                        // Edge Tracking Prevention can block GM storage, so the saved
                        // data: URL may not survive a page reload. In that case, skip
                        // creating a broken video element entirely and go straight to
                        // createProcessedStream with no source — the canvas gradient
                        // will show and the user gets a toast to re-pick their file.
                        // [FIX2] Also check ome_ip_state.videoURL as fallback — GUM may
                        // fire before restorePickedDataURL() has populated FAKE_CONFIG.
                        const _stateURL = (unsafeWindow.ome_ip_state && unsafeWindow.ome_ip_state.videoURL) || "";
                        if (_stateURL && !FAKE_CONFIG.videoURL) {
                            FAKE_CONFIG.videoURL = _stateURL;
                            console.log("[Ome-IP] Synced videoURL from ome_ip_state to FAKE_CONFIG");
                        }
                        if (!FAKE_CONFIG.videoURL || FAKE_CONFIG.videoURL.trim() === "") {
                            showToast("⚠️ Re-pick your video file — storage was cleared (Edge Tracking Prevention)");
                            // Pass null as source — createProcessedStream will run gradient-only
                            // We still need a valid stream so the site doesn't show "denied".
                            // Build a minimal canvas stream directly without a video element.
                            const _canvas = document.createElement('canvas');
                            _canvas.width = FAKE_CONFIG.canvasSize ? FAKE_CONFIG.canvasSize.width : 640;
                            _canvas.height = FAKE_CONFIG.canvasSize ? FAKE_CONFIG.canvasSize.height : 480;
                            const _ctx = _canvas.getContext('2d');
                            _ctx.fillStyle = "#0a0a14";
                            _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
                            _ctx.font = "bold 18px sans-serif";
                            _ctx.fillStyle = "#FFA500";
                            _ctx.textAlign = "center";
                            _ctx.fillText("Pick a video file to start fake cam", _canvas.width/2, _canvas.height/2);
                            const _stream = _canvas.captureStream(5);
                            if (constraints.audio) {
                                try {
                                    const _audio = await __safeGUM({ audio: constraints.audio });
                                    _audio.getAudioTracks().forEach(t => _stream.addTrack(t));
                                } catch(_) {}
                            }
                            return _stream;
                        }

                        video = document.createElement('video');
                        // [FIX] Set all attributes BEFORE assigning src so the browser
                        //   picks them up before the load starts (avoids autoplay block
                        //   from an unmuted element and ensures loop/playsInline work).
                        // [FIX] crossOrigin intentionally NOT set:
                        //   - data: URLs (local file picks) are same-origin — no CORS needed.
                        //   - HTTP(S) URLs without CORS headers: omitting crossOrigin lets
                        //     Chrome/Edge play and draw without tainting the canvas.
                        //   - Firefox with tainted canvas: captureStream() throws SecurityError,
                        //     caught below and bubbled up to the outer catch which falls back
                        //     to the real camera.
                        video.loop = true;
                        video.muted = true;
                        video.playsInline = true;

                        // [FIX] Edge blocks video.play() on data: URLs inside userscript
                        // sandboxes. Convert data: URL → Blob URL right before playback.
                        // Blob URLs are same-origin and always work in Edge/Chrome/Firefox.
                        let _blobUrlForPlay = null;
                        let _srcToUse = FAKE_CONFIG.videoURL;
                        if (_srcToUse && _srcToUse.startsWith("data:")) {
                            try {
                                const _mime = _srcToUse.substring(5, _srcToUse.indexOf(";"));
                                const _b64  = _srcToUse.substring(_srcToUse.indexOf(",") + 1);
                                const _bin  = atob(_b64);
                                const _arr  = new Uint8Array(_bin.length);
                                for (let _i = 0; _i < _bin.length; _i++) _arr[_i] = _bin.charCodeAt(_i);
                                const _blob = new Blob([_arr], { type: _mime || "video/mp4" });
                                _blobUrlForPlay = URL.createObjectURL(_blob);
                                _srcToUse = _blobUrlForPlay;
                                console.log("[Ome-IP] Converted data: URL → blob: URL for Edge compatibility");
                            } catch (_convErr) {
                                console.warn("[Ome-IP] data: → blob: conversion failed, using data: URL directly", _convErr);
                            }
                        }
                        video.src = _srcToUse;

                        // Revoke the blob URL after video is done (cleanup)
                        if (_blobUrlForPlay) {
                            video.addEventListener("emptied", () => { try { URL.revokeObjectURL(_blobUrlForPlay); } catch(_){} }, { once: true });
                        }

                        // Pass to processor as 'true' (isFakeSource)
                        const fakeStream = await createProcessedStream(video, true);

                        if (constraints.audio) {
                            try {
                                // [FIX] audio-only constraint so users don't see their
                                //   webcam permission prompt light up during fake-cam.
                                //   Root cause of "denied access on reload": blocking that
                                //   prompt persisted, then the unwrapped pass-through GUM
                                //   threw NotAllowedError on next visit.
                                const audioStream = await __safeGUM({ audio: constraints.audio });
                                audioStream.getAudioTracks().forEach(track => fakeStream.addTrack(track));
                            } catch(e) { console.error("Audio fetch failed", e); }
                        }

                        // [INDICATOR] Confirm fake cam stream is active
                        const _vtracks = fakeStream.getVideoTracks();
                        console.log("%c[Ome-IP] ✅ FAKE CAM ACTIVE — partner sees your fake video", "background:#1a4a1a;color:#00ff88;font-weight:bold;padding:2px 6px;border-radius:3px");
                        console.log("[Ome-IP] Stream tracks:", _vtracks.map(t => t.label + " | enabled=" + t.enabled + " | readyState=" + t.readyState).join(", "));
                        showToast("✅ Fake Cam active — partner sees your video");
                        return fakeStream;
                    } catch (err) {
                        if (video) video.remove(); // Clean up DOM-attached element
                        console.warn("%c[Ome-IP] ⚠️ FAKE CAM FAILED — falling back to REAL webcam", "background:#4a1a1a;color:#ff8888;font-weight:bold;padding:2px 6px;border-radius:3px", err);
                        showToast("⚠️ Fake cam failed — using real webcam");
                        return __safeGUM(constraints);
                    }
                }

                // SCENARIO 2: Real Camera + Anti-Ban Enabled
                else if (constraints && constraints.video && FAKE_CONFIG.antiBanFrames) {
                    console.log("[Ome-IP] Returning Real Webcam with Anti-Ban Jitter");
                    try {
                        const realStream = await __safeGUM(constraints);
                        const processedStream = await createProcessedStream(realStream, false);
                        const audioTracks = realStream.getAudioTracks();
                        if (audioTracks.length > 0) {
                            audioTracks.forEach(track => processedStream.addTrack(track));
                        }
                        return processedStream;
                    } catch (err) {
                        console.error("[Ome-IP] AntiBan processing failed, falling back to raw", err);
                        return __safeGUM(constraints);
                    }
                }

                // SCENARIO 3: Standard (Raw Stream) -> NOW WITH LABEL SPOOFING
                // This block runs when Fake Cam and Jitter are OFF.
                const stream = await __safeGUM(constraints);

                if (FAKE_CONFIG.spoofDeviceNames) {
                    stream.getTracks().forEach(track => {
                        // 1. Determine which label to use
                        let newLabel = track.label;
                        
                        if (track.kind === 'video') {
                            // Use the first label from your spoof list, or a generic fallback
                            newLabel = FAKE_CONFIG.videoLabels[0] || "Integrated Camera";
                        } else if (track.kind === 'audio') {
                            newLabel = FAKE_CONFIG.audioInputLabels[0] || "Default - Microphone";
                        }

                        // 2. Overwrite the read-only 'label' property
                        // We use Object.defineProperty because simply doing track.label = "x" won't work.
                        try {
                            Object.defineProperty(track, 'label', {
                                get: () => newLabel,
                                configurable: true
                            });
                            // console.log(`[Ome-IP] Spoofed Track Label: ${newLabel}`);
                        } catch (e) { 
                            console.error("[Ome-IP] Failed to spoof track label", e); 
                        }
                    });
                }
                
                return stream;
            };
            Object.defineProperty(navigator.mediaDevices.getUserMedia, 'toString', { value: () => 'function getUserMedia() { [native code] }', writable: true, configurable: true });
        } catch (e) { console.log("GUM Hook Failed"); }
    }


    // 3. Spoof Device Enumeration (Video + Audio Input + Audio Output)
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const originalEnumerate = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
        navigator.mediaDevices.enumerateDevices = async function() {

            // Pass through if no features are active
            if (!FAKE_CONFIG.enabled && !FAKE_CONFIG.spoofDeviceNames) {
                return originalEnumerate();
            }
            let devices = [];

            // STEP 1: Get Base List
            if (FAKE_CONFIG.enabled) {
                // Virtual Base List (If Fake Cam is ON)
                devices = [
                    { deviceId: "virt_mic_1", kind: "audioinput", label: "Virtual Mic", groupId: "virt_aud" },
                    { deviceId: "virt_mic_2", kind: "audioinput", label: "Virtual Mic 2", groupId: "virt_aud" },
                    { deviceId: "virt_spk_1", kind: "audiooutput", label: "Virtual Speaker", groupId: "virt_out" },
                    { deviceId: "virt_cam_1", kind: "videoinput", label: "Virtual Camera", groupId: "virt_vid" }
                ];
            } else {
                // Real Device List
                devices = await originalEnumerate();
            }

            // STEP 2: Apply "One Mode" Filters
            const filterDevices = (list, kind, isOneMode) => {
                if (!isOneMode) return list;
                let found = false;
                return list.filter(d => {
                    if (d.kind === kind) {
                        if (!found) { found = true; return true; } // Keep first
                        return false; // Discard rest
                    }
                    return true; // Keep other types
                });
            };

            devices = filterDevices(devices, 'videoinput', FAKE_CONFIG.oneCameraMode);
            devices = filterDevices(devices, 'audioinput', FAKE_CONFIG.oneInputMode);
            devices = filterDevices(devices, 'audiooutput', FAKE_CONFIG.oneOutputMode);

            // STEP 3: Apply Custom Labels
            if (FAKE_CONFIG.spoofDeviceNames) {
                let vidIdx = 0;
                let micIdx = 0;
                let spkIdx = 0;

                devices = devices.map(d => {
                    let newLabel = d.label;
                    let shouldSpoof = false;

                    if (d.kind === 'videoinput') {
                        newLabel = FAKE_CONFIG.videoLabels[vidIdx++] || DEFAULT_CAM_NAME;
                        shouldSpoof = true;
                    } else if (d.kind === 'audioinput') {
                        newLabel = FAKE_CONFIG.audioInputLabels[micIdx++] || "Default - Microphone";
                        shouldSpoof = true;
                    } else if (d.kind === 'audiooutput') {
                        newLabel = FAKE_CONFIG.audioOutputLabels[spkIdx++] || "Default - Speakers";
                        shouldSpoof = true;
                    }

                    if (shouldSpoof) {
                        if (!newLabel || newLabel.trim() === "") newLabel = d.label; // Fallback to original if empty
                        return {
                            deviceId: d.deviceId, kind: d.kind, label: newLabel, groupId: d.groupId,
                            toJSON: () => ({ ...d, label: newLabel, deviceId: d.deviceId, kind: d.kind })
                        };
                    }
                    return d;
                });
            }

            return devices;
        };
        Object.defineProperty(navigator.mediaDevices.enumerateDevices, 'toString', { value: () => 'function enumerateDevices() { [native code] }', writable: true, configurable: true });
    }

    // --- UNIFIED WEBSOCKET PROXY (FIXED) ---
    // Uses Strict JSON Parsing to avoid False Positives
    if (isReportProtectionEnabled) {
            const OriginalWebSocket = unsafeWindow.WebSocket;
    const UnifiedWebSocket = function(...args) {
        const socket = new OriginalWebSocket(...args);

        socket.addEventListener('message', (event) => {
            const data = event.data;

            if (typeof data === 'string') {
                try {
                    // Only process if it looks like JSON
                    if (data.startsWith('{') || data.startsWith('[')) {
                        const msg = JSON.parse(data);

                        // -------------------------------------------------
                        // 1. STRICT REPORT PROTECTION (JSON Mode)
                        // -------------------------------------------------
                        // Only trigger if the event is EXACTLY 'rimage' (Report Image)
                        // or if the server explicitly says 'banned': true
                        if (isReportProtectionEnabled) {
                            if (msg.event === 'rimage' || msg.banned === true || msg.event === 'ban') {
                                console.log("[Ome-IP] 🛡️ Blocked Report Signal:", msg);
                                
                                // Stop the event from reaching the site
                                event.stopImmediatePropagation();
                                event.stopPropagation();
                                
                                // Alert the UI
                                window.dispatchEvent(new CustomEvent('ome-bypass-event', { detail: { type: 'report' } }));
                                return; // Stop processing this message
                            }
                        }

                        // -------------------------------------------------
                        // 2. IP GRABBING LOGIC
                        // -------------------------------------------------
                        // Fallback IP Grabber (Signaling)
                        if (msg.event === 'conn' && msg.candidates) {
                            // [DEV LOG]
                            let info = "ID: " + (msg.id || "N/A");
                            if (msg.topics) info += " | Topics: " + msg.topics;
                            logDev("RTC", "Partner Data: " + info);

                            const srflx = msg.candidates.find(c => c && c.candidate && c.candidate.includes('typ srflx'));
                            if (srflx) {
                                const parts = srflx.candidate.split(' ');
                                let signalingIP = parts[4];
                                if (signalingIP && (signalingIP.includes('.') || signalingIP.includes(':'))) {
                                    console.log("[Ome-IP] Fallback IP Found via Signaling:", signalingIP);
                                    if (!currentIP || isRelayIP) {
                                        currentIP = signalingIP;
                                        isRelayIP = false;
                                        currentRelayType = "Direct";
                                        getLocation(currentIP);
                                        applyNameHeuristicIfEnabled(currentIP); // [NEW] opt-in name->gender guess
                                        setTimeout(() => { try { applyThumbnailHeuristicIfEnabled(currentIP); } catch (_) {} }, 1500); // [NEW] opt-in thumbnail->gender guess (lazy)
                                    }
                                }
                            }
                        }
                    }
                } catch(e) {
                    // Ignore JSON parse errors (non-JSON messages)
                }
            }
        });

        return socket;
    };

    // Masking to make it look native
    UnifiedWebSocket.prototype = OriginalWebSocket.prototype;
    Object.defineProperty(UnifiedWebSocket, 'name', { value: 'WebSocket' });
    Object.defineProperty(UnifiedWebSocket, 'toString', {
        value: function() { return OriginalWebSocket.toString(); },
        writable: true, configurable: true
    });

    unsafeWindow.WebSocket = UnifiedWebSocket;
    }

    // [NEW] Drag/resizable Region picker window. Opens automatically when the geo-fence
    //   dot enters "state" or "both" mode. Exposed as window.ome_ip_openGeoPicker for
    //   manual console access.
    function openGeoPicker() {
        let win = document.getElementById("ome-geo-picker");
        if (win) {
            // Refresh textarea + count in case stateFilterCsvText changed since last open
            // (e.g. user edited via the status-dot prompt).
            const __existingTa = win.querySelector("textarea");
            if (__existingTa) __existingTa.value = stateFilterCsvText || "";
            const __existingCount = win.querySelector(".ome-csv-tokens-count");
            // [NEW] Sync the Enable checkbox to current state
            const __existingEnable = win.querySelector(".ome-csv-enable");
            if (__existingEnable) __existingEnable.checked = !!stateFilterCsvEnabled;
            if (__existingCount) __existingCount.textContent = "Tokens: " + stateFilterCsvTokens.size + " valid";
            win.style.display = "flex";
            return;
        }

        win = document.createElement("div");
        win.id = "ome-geo-picker";
        win.className = "resizable-win ome-no-select";
        win.style.cssText = "position:fixed;top:18%;left:22%;width:280px;max-height:560px;background:#1a1a1a;border:1px solid #444;color:#fff;z-index:999999;padding:10px;border-radius:6px;display:flex;flex-direction:column;gap:8px;box-shadow:0 10px 30px rgba(0,0,0,0.8);font-family:sans-serif;font-size:12px;";

        const header = document.createElement("div");
        header.style.cssText = "font-weight:bold;cursor:grab;padding-bottom:6px;border-bottom:1px solid #333;font-size:13px;display:flex;justify-content:space-between;align-items:center;";
        const closeBtn = document.createElement("span");
        closeBtn.style.cssText = "cursor:pointer;color:#ff6666;font-size:14px;";
        closeBtn.title = "Close";
        closeBtn.textContent = "Close";
        header.appendChild(document.createElement("span")).textContent = "Region Picker";
        header.appendChild(closeBtn);
        closeBtn.onclick = function () { win.style.display = "none"; };

        // Drag the whole window by the header
        (function () {
            let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
            header.addEventListener("mousedown", function (e) {
                if (e.target === closeBtn) return;
                dragging = true; sx = e.clientX; sy = e.clientY;
                const cs = window.getComputedStyle(win);
                sl = parseFloat(cs.left) || 0; st = parseFloat(cs.top) || 0;
            });
            document.addEventListener("mousemove", function (e) {
                if (!dragging) return;
                win.style.left = (sl + (e.clientX - sx)) + "px";
                win.style.top  = (st + (e.clientY - sy)) + "px";
            });
            document.addEventListener("mouseup", function () { dragging = false; });
        })();

        const sel = document.createElement("select");
        sel.multiple = true;
        sel.size = 14;
        sel.style.cssText = "width:100%;background:#000;color:#ccc;border:1px solid #333;border-radius:4px;font-family:monospace;font-size:11px;outline:none;flex:1;";

        // Priority countries first (India is the user focus), then others
        const PRIORITY = ["IN", "US", "BR", "MX", "CA", "DE", "JP", "AU"];
        const groups = {};
        PRIORITY.forEach(function (c) {
            groups[c] = document.createElement("optgroup");
            groups[c].label = c + " Regions";
        });
        const others = document.createElement("optgroup");
        others.label = "Other Regions";

        (function () {
            const seen = new Set();
            function visit(r) {
                if (seen.has(r.id)) return;
                seen.add(r.id);
                const opt = document.createElement("option");
                opt.value = r.id;
                opt.textContent = "[" + r.id + "] " + r.n;
                if (blockedRegionsCache.has(r.id)) opt.selected = true;
                const grp = groups[r.c] || others;
                grp.appendChild(opt);
            }
            // Use runtime-built REGION_BY_COUNTRY index if present; fall back to RAW_REGIONS scan.
            if (typeof REGION_BY_COUNTRY !== "undefined" && REGION_BY_COUNTRY) {
                PRIORITY.forEach(function (c) {
                    Object.values(REGION_BY_COUNTRY[c] || {}).forEach(visit);
                });
                Object.keys(REGION_BY_COUNTRY).filter(function (c) { return PRIORITY.indexOf(c) < 0; })
                    .forEach(function (c) { Object.values(REGION_BY_COUNTRY[c]).forEach(visit); });
            } else {
                // Safe fallback: only emit regions for priority countries; integrity>coverage.
                if (typeof RAW_REGIONS !== "undefined") {
                    const prioSet = new Set(PRIORITY);
                    RAW_REGIONS.forEach(function (r) { if (prioSet.has(r.c)) visit(r); });
                }
            }
        })();

        PRIORITY.forEach(function (c) {
            if (groups[c].children.length > 0) sel.appendChild(groups[c]);
        });
        if (others.children.length > 0) sel.appendChild(others);

        const countLbl = document.createElement("span");
        function applySelections() {
            blockedRegionsCache.clear();
            Array.from(sel.selectedOptions).forEach(function (o) {
                blockedRegionsCache.add(o.value);
            });
            try { GM_setValue("ome_blocked_regions", JSON.stringify(Array.from(blockedRegionsCache))); } catch (_) {}
            try { if (typeof saveCoreSettings === "function") saveCoreSettings(); } catch (_) {}
            try { showToast("Geo Filter: " + blockedRegionsCache.size + " regions blocked"); } catch (_) {}
            try { if (typeof updateStatusDots === "function") updateStatusDots(); } catch (_) {}
            countLbl.textContent = "Selected: " + blockedRegionsCache.size;
        }
        sel.addEventListener("change", applySelections);

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex;gap:6px;justify-content:space-between;align-items:center;font-size:11px;color:#aaa;";
        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear";
        clearBtn.style.cssText = "padding:3px 8px;background:#222;color:#ccc;border:1px solid #555;border-radius:3px;cursor:pointer;";
        clearBtn.onclick = function () {
            Array.from(sel.options).forEach(function (o) { o.selected = false; });
            applySelections();
        };
        countLbl.textContent = "Selected: " + blockedRegionsCache.size;
        btnRow.appendChild(clearBtn);
        btnRow.appendChild(countLbl);

        win.appendChild(header);
        // [NEW] CSV list textarea: pre-fills with stateFilterCsvText, parses on change.
        const csvContainer = document.createElement("div");
        csvContainer.style.cssText = "display:flex;flex-direction:column;gap:4px;flex-shrink:0;margin-bottom:4px;";
        const csvLabel = document.createElement("div");
        csvLabel.textContent = "CSV list (optional, append country ISO to disambiguate)";
        csvLabel.style.cssText = "font-size:10px;color:#aaa;font-weight:bold;display:flex;justify-content:space-between;align-items:center;";
        const csvCountLbl = document.createElement("span");
        csvCountLbl.className = "ome-csv-tokens-count";
        csvCountLbl.style.cssText = "font-size:10px;color:#888;font-family:monospace;font-weight:normal;";
        const refreshCsvCount = function() { csvCountLbl.textContent = "Tokens: " + stateFilterCsvTokens.size + " valid"; };
        refreshCsvCount();
        csvLabel.appendChild(csvCountLbl);
        // [NEW] Enable/Disable checkbox - toggle the filter from inside the picker
        const csvEnableLbl = document.createElement("label");
        csvEnableLbl.style.cssText = "display:flex;align-items:center;gap:4px;cursor:pointer;font-weight:normal;color:#ccc;font-size:10px;margin-left:8px;";
        const csvEnableBox = document.createElement("input");
        csvEnableBox.type = "checkbox";
        csvEnableBox.checked = !!stateFilterCsvEnabled;
        csvEnableBox.className = "ome-csv-enable";
        csvEnableBox.addEventListener("change", function() {
            // [REVIEWER D] Guard against enabling with 0 tokens (mirrors status-dot path).
            if (csvEnableBox.checked && stateFilterCsvTokens.size === 0) {
                csvEnableBox.checked = false;
                try { showToast("CSV Filter: no valid tokens (3+ chars) - left OFF"); } catch (_) {}
                return;
            }
            stateFilterCsvEnabled = csvEnableBox.checked;
            try { if (typeof saveCoreSettings === "function") saveCoreSettings(); } catch (_) {}
            try { if (typeof updateStatusDots === "function") updateStatusDots(); } catch (_) {}
            try { showToast("CSV Filter " + (stateFilterCsvEnabled ? ("ON: " + stateFilterCsvTokens.size + " tokens") : "OFF")); } catch (_) {}
        });
        const csvEnableText = document.createElement("span");
        csvEnableText.textContent = "Enabled";
        csvEnableLbl.appendChild(csvEnableBox);
        csvEnableLbl.appendChild(csvEnableText);
        // Insert checkbox into the existing csvLabel row (between text and countLbl)
        csvLabel.insertBefore(csvEnableLbl, csvCountLbl);

        const csvBox = document.createElement("textarea");
        csvBox.placeholder = "Kerala, IN, New York, US, Bavaria";
        csvBox.value = stateFilterCsvText || "";
        csvBox.style.cssText = "width:100%;height:60px;background:#111;color:#0f0;border:1px solid #444;border-radius:4px;font-family:monospace;font-size:11px;padding:4px;resize:none;box-sizing:border-box;";
        csvBox.addEventListener("input", function() {
            // Debounce to avoid hammering GM_setValue on every keystroke.
            clearTimeout(window.__omeCsvDebounceTimer);
            window.__omeCsvDebounceTimer = setTimeout(function() {
                // Strip newlines to keep the underlying data model single-line CSV.
                stateFilterCsvText = csvBox.value.replace(/\r?\n/g, "");
                csvBox.value = stateFilterCsvText; // reflect the cleaned string back to the user
                hydrateCsvTokens();
                try { if (typeof saveCoreSettings === "function") saveCoreSettings(); } catch (_) {}
                refreshCsvCount();
                try { if (typeof updateStatusDots === "function") updateStatusDots(); } catch (_) {}
            }, 250);
        });
        csvContainer.appendChild(csvLabel);
        csvContainer.appendChild(csvBox);

        win.appendChild(csvContainer);

        win.appendChild(sel);
        win.appendChild(btnRow);
        document.body.appendChild(win);
    }
    unsafeWindow.ome_ip_openGeoPicker = openGeoPicker;

    function makeDraggable(triggerElement, movingElement) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        triggerElement.classList.add('ome-no-select');
        triggerElement.classList.add('ome-grab');

        const onMouseDown = (e) => {
            // EXCLUSIONS: Do not drag if clicking these elements
            if (['BUTTON', 'INPUT', 'TEXTAREA', 'A', 'IFRAME', 'SELECT', 'LABEL'].includes(e.target.tagName)) return;

            // Allow clicking the specific buttons we added
            if (e.target.closest('.icon-btn')) return;
            if (e.target.closest('.ip-copy-btn')) return;
            if (e.target.closest('#ome-menu-dropdown')) return;
            if (e.target.classList.contains('ome-vol-slider')) return;
            if (e.target.classList.contains('status-toggle-btn')) return;

            // Prevent drag if clicking the resizing corner
            const rect = movingElement.getBoundingClientRect();
            if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;

            if (e.button !== 0) return;

            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = movingElement.offsetLeft;
            initialTop = movingElement.offsetTop;
            triggerElement.style.cursor = 'grabbing';

            document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            movingElement.style.left = `${initialLeft + dx}px`;
            movingElement.style.top = `${initialTop + dy}px`;
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                triggerElement.style.cursor = '';
                document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'auto');
            }
        };

        triggerElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

	function makeResizable(div) {
        const createHandle = (cls, type) => {
            const h = document.createElement('div');
            h.className = `ome-resize-handle ${cls}`;
            div.appendChild(h);

            h.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Prevent drag logic
                e.preventDefault(); // Prevent text selection

                const startX = e.clientX;
                const startY = e.clientY;
                const startRect = div.getBoundingClientRect();
                const startW = startRect.width;
                const startH = startRect.height;
                const startTop = startRect.top;
                const startLeft = startRect.left;

                const onMove = (evt) => {
                    const dx = evt.clientX - startX;
                    const dy = evt.clientY - startY;

                    // Enforce Minimums (must match minWidth/minHeight in createLogWindow)
                    const minW = 320;
                    const minH = 280;

                    let newW = startW, newH = startH, newTop = startTop, newLeft = startLeft;

                    // East (Right)
                    if (type.includes('e')) {
                        newW = startW + dx;
                    }
                    // South (Bottom)
                    if (type.includes('s')) {
                        newH = startH + dy;
                    }
                    // West (Left) - Requires moving 'left' and changing 'width'
                    if (type.includes('w')) {
                        if (startW - dx >= minW) {
                            newW = startW - dx;
                            newLeft = startLeft + dx;
                        }
                    }
                    // North (Top) - Requires moving 'top' and changing 'height'
                    if (type.includes('n')) {
                        if (startH - dy >= minH) {
                            newH = startH - dy;
                            newTop = startTop + dy;
                        }
                    }

                    // Apply
                    if (newW >= minW) {
                        div.style.width = `${newW}px`;
                        if (type.includes('w')) div.style.left = `${newLeft}px`;
                    }
                    if (newH >= minH) {
                        div.style.height = `${newH}px`;
                        if (type.includes('n')) div.style.top = `${newTop}px`;
                    }
                };

                const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        };

        createHandle('ome-rh-nw', 'nw');
        createHandle('ome-rh-ne', 'ne');
        createHandle('ome-rh-sw', 'sw');
        createHandle('ome-rh-se', 'se');
    }


    // --- REPORT SOUND & WITTY REMARKS ---
    function triggerReportSound() {
        const lines = [
            "A user just reported you.",
            "Report detected. They probably couldn't handle the style.",
            "Snitch detected.",
            "Report blocked. I've filed it in the trash.",
            "Oof, someone is sensitive. Report ignored.",
            "Alert. We have a hater.",
            "They reported you. Jealousy is a disease."
        ];

        const text = lines[Math.floor(Math.random() * lines.length)];

        if ('speechSynthesis' in window) {
            // Cancel previous to avoid queue buildup
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 0.5; // 50% Volume
            utterance.rate = 1.0;

            // Try to find a male English voice
            const voices = window.speechSynthesis.getVoices();
            const maleVoice = voices.find(v => (v.lang.includes('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google US English'))));
            if (maleVoice) utterance.voice = maleVoice;

            window.speechSynthesis.speak(utterance);
        }
    }


    function showReportPopup() {
        const id = "ome-report-alert-overlay";
        if (document.getElementById(id)) return;

        const div = document.createElement("div");
        div.id = id;
        Object.assign(div.style, {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 0, 0, 0.9)",
            color: "white",
            padding: "20px 40px",
            borderRadius: "15px",
            border: "4px solid #fff",
            boxShadow: "0 0 50px rgba(255, 0, 0, 1)",
            zIndex: "100000100",
            textAlign: "center",
            fontFamily: "Impact, sans-serif",
            pointerEvents: "none"
        });

        div.innerHTML = `
            <div style="font-size: 48px; letter-spacing: 2px;">⚠️ REPORT DETECTED ⚠️</div>
            <div style="font-size: 24px; margin-top: 10px; font-family: sans-serif; font-weight: bold;">
                Block Intercepted. Skipping to Safety...
            </div>
        `;

        document.body.appendChild(div);

        // Remove the popup after 2 seconds
        setTimeout(() => {
            if (div) div.remove();
        }, 2000);
    }

    // v2.4: Stream Protection Badge — green dot when Face Bypass + Jitter active on fake cam
    let _lastBadgeState = '';
    function updateStreamProtectionBadge() {
        // Skip DOM updates if state hasn't changed (called every frame from draw loop)
        const newState = `${FAKE_CONFIG.enabled}_${!!window.fakeCamAnimId}_${isFaceProtectionEnabled}_${FAKE_CONFIG.antiBanFrames}`;
        if (newState === _lastBadgeState) return;
        _lastBadgeState = newState;
        
        const fakeCamActive = FAKE_CONFIG.enabled && window.fakeCamAnimId;
        const faceActive = isFaceProtectionEnabled && window._omeFaceImages && window._omeFaceImages.length >= 1;
        const jitterActive = FAKE_CONFIG.antiBanFrames;
        
        let badge = document.getElementById('ome-stream-protection-badge');
        
        // Create badge if it doesn't exist
        if (!badge && document.body) {
            badge = document.createElement('div');
            badge.id = 'ome-stream-protection-badge';
            badge.className = 'ome-stream-badge hidden';
            badge.innerHTML = '<span class="ome-stream-badge-dot"></span><span class="ome-stream-badge-text"></span>';
            document.body.appendChild(badge);
        }
        if (!badge) return;
        
        const dotEl = badge.querySelector('.ome-stream-badge-dot');
        const textEl = badge.querySelector('.ome-stream-badge-text');
        
        if (fakeCamActive && faceActive && jitterActive) {
            // All protections active — green
            badge.className = 'ome-stream-badge protected';
            if (dotEl) dotEl.style.display = '';
            if (textEl) textEl.textContent = '🛡️ Stream Protected';
        } else if (fakeCamActive && (faceActive || jitterActive)) {
            // Partial protection — amber
            badge.className = 'ome-stream-badge partial';
            const missing = [];
            if (!faceActive) missing.push('Face Bypass');
            if (!jitterActive) missing.push('Jitter');
            if (dotEl) dotEl.style.display = '';
            if (textEl) textEl.textContent = '⚠️ Enable: ' + missing.join(' + ');
        } else if (fakeCamActive) {
            // Fake cam on but nothing protecting — red warning
            badge.className = 'ome-stream-badge partial';
            if (dotEl) dotEl.style.display = 'none';
            if (textEl) textEl.textContent = '❌ Unprotected Stream';
        } else {
            // Fake cam off — hide
            badge.className = 'ome-stream-badge hidden';
        }
    }


    function updateStatusDots() {
        const ipDot = document.getElementById('status-dot-ipgrab');
        const faceDot = document.getElementById('status-dot-face');
        const reportDot = document.getElementById('status-dot-report');
        const countryDot = document.getElementById('status-dot-country');
        const ipBlockDot = document.getElementById('status-dot-ipblock');
        const camDot = document.getElementById('status-dot-camera');
        const relayDot = document.getElementById('status-dot-relay');
        const spoofDot = document.getElementById('status-dot-spoof');
        const fingerprintDot = document.getElementById('status-dot-fingerprint');
        const udpDot = document.getElementById('status-dot-udp');
        const ghostDot = document.getElementById('status-dot-ghost');
        const thumbsDot = document.getElementById('status-dot-thumbs'); // [NEW]
        const antiBanDot = document.getElementById('status-dot-antiban');
        const antiBotDot = document.getElementById('status-dot-antibot');
        const genderFilterDot = document.getElementById('status-dot-gender');

        const applyStyle = (el, isActive, type) => {
            if (!el) return;
            let color = isActive ? "#00FF00" : "#FF0000";
            let boxShadow = isActive ? `0 0 8px ${color}` : `0 0 3px ${color}`;
            let borderColor = color;
            let bgColor = isWindowTransparent ? "rgba(0,0,0,0.1)" : "#000000";

            if (type === 'ghost') {
                borderColor = isActive ? "#FFFFFF" : "#888";
                if (isActive) {
                    color = "#FFFFFF";
                    boxShadow = "0 0 15px #FFFFFF, 0 0 5px #FFFFFF";
                    bgColor = "rgba(255,255,255,0.2)";
                } else {
                    boxShadow = "none";
                }
            }

            if ((type === 'udp' || type === 'camera' || type === 'relay' || type === 'spoof' || type === 'antiban' || type === 'gender') && isActive) {
                color = "#FFD700";
                boxShadow = "0 0 10px #FFD700";
                borderColor = "#FFD700";
            }

            el.style.backgroundColor = bgColor;
            el.style.boxShadow = boxShadow;
            el.style.borderColor = borderColor;

            const iconSpan = el.querySelector(".ome-icon-span");
            if (iconSpan) {
                if (isActive) iconSpan.classList.add("ome-anim-jiggle");
                else iconSpan.classList.remove("ome-anim-jiggle");
            }

            // [NEW] CSV region filter dot - amber to distinguish from country-blocker.
            // This used to sit on `else if` of `if (iconSpan)`, but createToggleDot
            // always renders an icon span, so the branch was unreachable and no
            // build ever got the amber styling. Keep it a sibling `if`, and drive
            // the glow too - otherwise the dot keeps the default red/green shadow
            // and reads as broken next to an amber fill.
            if (type === "csv") {
                const amber = "#FFA500";
                el.style.backgroundColor = isActive ? amber : "rgba(255, 165, 0, 0.2)";
                el.style.borderColor = isActive ? amber : "rgba(255, 165, 0, 0.5)";
                el.style.boxShadow = isActive ? `0 0 8px ${amber}` : `0 0 3px ${amber}`;
            }

            if (type === 'ipgrab') el.title = isActive ? "IP Grabbing: ON" : "IP Grabbing: OFF";
            if (type === 'face') el.title = isActive ? `Face Bypass: Active (${facesDetectedCount})` : "Face Bypass: DISABLED";
            if (type === 'report') el.title = isActive ? `Report Protection: Active (${reportsBlockedCount})` : "Report Protection: DISABLED";
            if (type === 'country') el.title = isActive ? "Country Blocking: ON" : "Country Blocking: OFF";
            if (type === 'ipblock') el.title = isActive ? "IP Blocking: ON" : "IP Blocking: OFF";
            if (type === 'camera') el.title = isActive ? "Fake Cam: ON" : "Fake Cam: OFF";
            if (type === 'relay') el.title = isActive ? "Force Relay: ON" : "Force Relay: OFF";
            if (type === 'spoof') el.title = isActive ? "Device Labeling: ON" : "Device Labeling: OFF";
            if (type === 'fingerprint') el.title = isActive ? "Fingerprint Spoofing: ON" : "Fingerprint Spoofing: OFF";
            if (type === 'udp') el.title = isActive ? "UDP Only: ON" : "UDP Only: OFF";
            if (type === 'ghost') el.title = isActive ? "Ghost Mode: ON" : "Ghost Mode: OFF";
            if (type === 'thumbs') el.title = isActive ? "Thumbnail History: ON" : "Thumbnail History: OFF";
            if (type === 'antiban') el.title = isActive ? "Anti-Ban Frames: ON (Dynamic Jitter)" : "Anti-Ban Frames: OFF (Static)";
            if (type === 'antibot') el.title = isActive ? "Anti-Bot Bypass: ON" : "Anti-Bot Bypass: OFF";
        };

        applyStyle(ipDot, isIPGrabbingEnabled, 'ipgrab');
        applyStyle(faceDot, isFaceProtectionEnabled, 'face');
        applyStyle(reportDot, isReportProtectionEnabled, 'report');
        applyStyle(countryDot, countryBlockingEnabled, 'country');
        applyStyle(ipBlockDot, ipBlockingEnabled, 'ipblock');
        applyStyle(camDot, FAKE_CONFIG.enabled, 'camera');
        applyStyle(relayDot, FAKE_CONFIG.forceRelay, 'relay');
        applyStyle(spoofDot, FAKE_CONFIG.spoofDeviceNames, 'spoof');
        applyStyle(fingerprintDot, isFingerprintSpoofingEnabled, 'fingerprint');
        applyStyle(udpDot, FAKE_CONFIG.udpStrict, 'udp');
        applyStyle(ghostDot, isWindowTransparent, 'ghost');
        applyStyle(thumbsDot, isThumbnailCaptureEnabled, 'thumbs'); // [NEW]
        applyStyle(antiBanDot, FAKE_CONFIG.antiBanFrames, 'antiban');
        applyStyle(antiBotDot, isAntiBotEnabled, 'antibot');
        applyStyle(genderFilterDot, genderFilterMode !== 'off', 'gender');
        const stateDot = document.getElementById("status-dot-state");
        // [NEW] Drive dot color, icon, label off the unified geoFenceMode
        applyStyle(stateDot, geoFenceMode !== 'off', 'country');
        if (stateDot) {
            const dotIcon = stateDot.querySelector('.ome-icon-span');
            const GEO_ICONS = { 'off': '🛡️', 'state': '📍', 'country': '🌐', 'both': '📍🌐' };
            const GEO_LABELS = { 'off': 'OFF', 'state': 'Region', 'country': 'Country', 'both': 'Both' };
            if (dotIcon) dotIcon.textContent = GEO_ICONS[geoFenceMode] || '🛡️';
            stateDot.title = 'Geo Filter: ' + (GEO_LABELS[geoFenceMode] || 'OFF')
                + ((geoFenceMode === 'state' || geoFenceMode === 'both')
                    ? ' (' + blockedRegionsCache.size + ' regions)' : '');
        }
        if (genderFilterDot) {
            // GENDER (defined at IIFE top) is the single source of truth.
            const entry = GENDER.entryForMode(genderFilterMode);
            const gfIcon = genderFilterDot.querySelector('.ome-icon-span');
            if (gfIcon) gfIcon.textContent = entry.dotIcon;
            genderFilterDot.title = "Gender Filter: " + entry.dotLabel;
        }

        // [NEW] CSV filter dot. This block used to be nested inside
        // `if (genderFilterDot)`, so CSV refresh silently depended on the gender
        // dot existing on the page. They are independent controls - keep them
        // independent.
        const csvDot = document.getElementById("status-dot-csv-state");
        if (csvDot) {
            applyStyle(csvDot, stateFilterCsvEnabled, "csv");
            const csvIcon = csvDot.querySelector(".ome-icon-span");
            if (csvIcon) csvIcon.textContent = stateFilterCsvEnabled ? "\uD83D\uDCDD" : "\uD83D\uDCC4";
            csvDot.title = stateFilterCsvEnabled
                ? "CSV Filter ON: " + stateFilterCsvTokens.size + " tokens (click to disable)"
                : "CSV Filter OFF (click to enable & edit)";
        }

        updateAdvToggleVisual("adv-toggle-ip-grab", isIPGrabbingEnabled);
        updateAdvToggleVisual("adv-toggle-face-bypass", isFaceProtectionEnabled);
        updateAdvToggleVisual("adv-toggle-report-prot", isReportProtectionEnabled);
        updateAdvToggleVisual("adv-toggle-country-block", countryBlockingEnabled);
        updateAdvToggleVisual("adv-toggle-ip-block", ipBlockingEnabled);
        updateAdvToggleVisual("adv-toggle-fake-cam", FAKE_CONFIG.enabled);
        updateAdvToggleVisual("adv-toggle-force-relay", FAKE_CONFIG.forceRelay);
        updateAdvToggleVisual("adv-toggle-device-spoof", FAKE_CONFIG.spoofDeviceNames);
        updateAdvToggleVisual("adv-toggle-fingerprint", isFingerprintSpoofingEnabled);
        updateAdvToggleVisual("adv-toggle-udp-strict", FAKE_CONFIG.udpStrict);
        updateAdvToggleVisual("adv-toggle-raw-audio", FAKE_CONFIG.rawAudio);
        updateAdvToggleVisual("adv-toggle-antiban", FAKE_CONFIG.antiBanFrames);
        updateAdvToggleVisual("adv-toggle-antibot", isAntiBotEnabled);
        updateAdvToggleVisual("adv-toggle-thumbs", isThumbnailCaptureEnabled); // [NEW] Sync

        updateSettingSwitch("setting-toggle-ip", ipBlockingEnabled, "🛡️ IP Blocking");
        updateSettingSwitch("setting-toggle-country", countryBlockingEnabled, "🌍 Country Blocking");
    }

    function safe(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function logDev(type, msg) {
        const time = new Date().toLocaleTimeString();
        const entry = { time, type, msg };
        devLogs.push(entry);
        if (devLogs.length > MAX_DEV_LOGS) devLogs.shift();

        // FIX: Only update DOM if the window exists and is visible
        const win = document.getElementById("dev-console-win");
        if (win && win.style.display !== "none") {
            updateDevConsole();
        }
    }

    // v2.4: Ban Recovery Modal — shown when a ban is detected
    function showBanRecoveryModal() {
        if (banDetected || !document.body) return; // Only show once per session; also guard against early calls before DOM ready
        banDetected = true;
        GM_setValue('ome_ban_detected_at', Date.now());
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'ome-ban-recovery-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.78)', zIndex: '9999998',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            backdropFilter: 'blur(4px)', animation: 'omeFadeIn 0.3s ease'
        });
        
        // Create modal card
        const modal = document.createElement('div');
        Object.assign(modal.style, {
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '16px', padding: '32px 28px 24px',
            maxWidth: '460px', width: '92%', color: '#e0e0e0',
            boxShadow: '0 4px 60px rgba(231,76,60,0.35), 0 0 0 1px rgba(231,76,60,0.25)',
            textAlign: 'center',
            animation: 'omeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        });
        
        modal.innerHTML = `
            <div style="font-size:48px;margin-bottom:8px;line-height:1">🚫</div>
            <h2 style="margin:0 0 6px;color:#e74c3c;font-size:21px;font-weight:700;letter-spacing:-0.3px">Access Restricted</h2>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.65;color:#a0a0b8">
                The site appears to have banned or restricted your access.<br>
                Use the options below to get back online and avoid future bans.
            </p>
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
                <button id="ome-clear-data-btn" style="
                    padding:12px 16px;border-radius:10px;border:none;cursor:pointer;
                    font-size:14px;font-weight:600;color:#fff;transition:all 0.2s;
                    background:linear-gradient(135deg,#e74c3c,#c0392b);
                    box-shadow:0 2px 12px rgba(231,76,60,0.3);
                ">🧹 Clear Site Data &amp; Reload</button>
                <button id="ome-vpn-instructions-btn" style="
                    padding:12px 16px;border-radius:10px;border:none;cursor:pointer;
                    font-size:14px;font-weight:600;color:#fff;transition:all 0.2s;
                    background:linear-gradient(135deg,#3498db,#2980b9);
                    box-shadow:0 2px 12px rgba(52,152,219,0.3);
                ">🔒 VPN Tips: Switch Server</button>
                <button id="ome-dismiss-ban-btn" style="
                    padding:10px 16px;border-radius:10px;border:1px solid #444;
                    cursor:pointer;font-size:13px;font-weight:500;
                    color:#999;background:transparent;transition:all 0.2s;
                ">✕ Dismiss</button>
            </div>
            <div id="ome-ban-tips" style="display:none;text-align:left;background:rgba(255,255,255,0.04);
                border-radius:10px;padding:14px 16px;margin-top:8px;font-size:12px;line-height:1.7;color:#b0b0c0">
                <strong style="color:#3498db">VPN Tips to get unbanned:</strong><br>
                1. Disconnect your VPN entirely<br>
                2. Connect to a <strong>different</strong> VPN server (different country/region)<br>
                3. If using a residential VPN, rotate to a new IP<br>
                4. Close ALL browser windows before reconnecting<br>
                5. Wait 5-10 minutes before trying again<br>
                <br><strong style="color:#e74c3c">Also recommended:</strong> Clear site data + enable <em>all</em> anti-detection toggles (Anti-Bot, Face Bypass, Fake Cam with face overlay)
            </div>
        `;
        
        overlay.appendChild(modal);
        
        // Inject keyframe animations if not already present
        if (!document.getElementById('ome-ban-animations')) {
            const style = document.createElement('style');
            style.id = 'ome-ban-animations';
            style.textContent = `
                @keyframes omeFadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes omeSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
                #ome-clear-data-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
                #ome-clear-data-btn:active { transform:scale(0.97); }
                #ome-vpn-instructions-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
                #ome-vpn-instructions-btn:active { transform:scale(0.97); }
                #ome-dismiss-ban-btn:hover { color:#ccc; border-color:#666; background:rgba(255,255,255,0.05); }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
        
        // Button handlers
        document.getElementById('ome-clear-data-btn').onclick = () => {
            // Clear all site data
            try { localStorage.clear(); } catch(_) {}
            try { sessionStorage.clear(); } catch(_) {}
            try {
                // Clear cookies for this domain
                document.cookie.split(';').forEach(c => {
                    const eqPos = c.indexOf('=');
                    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
                    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
                });
            } catch(_) {}
            // Clear IndexedDB (async — reload after all deletions complete or 2s max)
            try {
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        const deletions = dbs.map(db => new Promise(resolve => {
                            try { 
                                const req = window.indexedDB.deleteDatabase(db.name);
                                req.onsuccess = req.onerror = () => resolve();
                            } catch(_) { resolve(); }
                        }));
                        Promise.all(deletions).then(() => { window.location.reload(true); });
                    });
                    // Safety timeout: reload even if async deletions hang
                    setTimeout(() => { window.location.reload(true); }, 2500);
                } else {
                    setTimeout(() => { window.location.reload(true); }, 400);
                }
            } catch(_) {
                setTimeout(() => { window.location.reload(true); }, 400);
            }
        };
        
        document.getElementById('ome-vpn-instructions-btn').onclick = function() {
            const tips = document.getElementById('ome-ban-tips');
            if (tips.style.display === 'none' || !tips.style.display) {
                tips.style.display = 'block';
                this.textContent = '🔒 Hide VPN Tips';
            } else {
                tips.style.display = 'none';
                this.textContent = '🔒 VPN Tips: Switch Server';
            }
        };
        
        document.getElementById('ome-dismiss-ban-btn').onclick = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.25s ease';
            setTimeout(() => overlay.remove(), 250);
        };
        
        // Also dismiss on overlay background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.25s ease';
                setTimeout(() => overlay.remove(), 250);
            }
        });
    }

    function showToast(msg, parentWin = null, bgColor = null) {
        const win = parentWin || document.getElementById("ip-log-window");
        if (!win) return;
        let toast = win.querySelector('.ome-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'ome-toast ome-no-select';
            win.appendChild(toast);
        }
        toast.innerText = msg;
        // Apply custom color if provided, else default orange
        toast.style.backgroundColor = bgColor || "rgba(255, 140, 0, 0.85)";

        toast.classList.add('show');
        // Reset color after hide to prevent stuck colors
        setTimeout(() => {
            toast.classList.remove('show');
        }, 1500);
    }

    // --- FETCH OWN IP (Fixed with GM_xmlhttpRequest) ---
    function fetchOwnIP() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://ipwho.is/",
            onload: function(response) {
                try {
                    const json = JSON.parse(response.responseText);
                    if (json.success) {
                        myOwnIPData = {
                            ip: json.ip,
                            country_code: json.country_code,
                            country: json.country,
                            region: json.region || json.city,
                            city: json.city
                        };
                        logDev("SYS", `Own IP Fetched: ${json.ip}`);
                        const headerContent = document.getElementById("ome-settings-header-content");
                        if(headerContent) updateSettingsHeaderDisplay(headerContent);
                    } else {
                        logDev("ERR", "Own IP Fetch Failed");
                    }
                } catch (e) {
                    logDev("ERR", "Own IP Parse Error");
                }
            },
            onerror: function() {
                myOwnIPData = { ip: "Unavailable", country_code: "un", region: "Net Error" };
                const headerContent = document.getElementById("ome-settings-header-content");
                if(headerContent) updateSettingsHeaderDisplay(headerContent);
            }
        });
    }

    // --- STORAGE LOGIC ---

    function checkAndPruneStorage() {
        if (!ipHistoryCache) return;

        const keys = Object.keys(ipHistoryCache);

        // PERFORMANCE FIX: Only run the heavy sort/prune if we are OVER the limit.
        // Otherwise, skip this entirely to make saving instant.
        if (keys.length > MAX_HISTORY_ITEMS) {
            const sortedEntries = Object.entries(ipHistoryCache).sort(([,a], [,b]) => (b.lastSeen || 0) - (a.lastSeen || 0));
            const keepEntries = sortedEntries.slice(0, KEEP_NEWEST_ITEMS);

            // Rebuild object
            ipHistoryCache = {};
            keepEntries.forEach(([ip, data]) => ipHistoryCache[ip] = data);
            isDirty = true;
        }

        // Check screenshots separately (Only if we have a lot of items)
        if (keys.length > 50) {
            const entriesWithThumbs = Object.entries(ipHistoryCache).filter(([, data]) => data.thumb);
            const MAX_SCREENSHOTS = 50;

            if (entriesWithThumbs.length > MAX_SCREENSHOTS) {
                // Sort only the thumbs (smaller list)
                entriesWithThumbs.sort(([,a], [,b]) => (b.lastSeen || 0) - (a.lastSeen || 0));
                const toRemove = entriesWithThumbs.slice(MAX_SCREENSHOTS);

                toRemove.forEach(([ip]) => {
                    delete ipHistoryCache[ip].thumb;
                });
                isDirty = true;
                console.log(`[Ome-IP] Pruned ${toRemove.length} old screenshots.`);
            }
        }
    }

    function loadData() {
        // --- 1. Load History ---
        if (!ipHistoryCache) {
            try { ipHistoryCache = JSON.parse(GM_getValue('ome_ip_history', '{}')); }
            catch (e) { ipHistoryCache = {}; }
        }

        // --- 2. Load Blocked IPs ---
        if (!blockedIPsCache) {
            try { blockedIPsCache = new Set(JSON.parse(GM_getValue('ome_blocked_ips', '[]'))); }
            catch (e) { blockedIPsCache = new Set(); }
        }

        // --- 3. Load Blocked Countries ---
        if (!blockedCountriesCache) {
            const rawCountries = GM_getValue('ome_blocked_countries', null);
            if (rawCountries === null) {
                blockedCountriesCache = new Set(DEFAULT_BLOCKED_COUNTRIES);
            } else {
                try { blockedCountriesCache = new Set(JSON.parse(rawCountries)); }
                catch (e) { blockedCountriesCache = new Set(); }
            }
        }

        // REMOVE ALL THE FAKE_CONFIG / LABEL LOADING CODE FROM HERE
        // IT IS ALREADY HANDLED IN loadSettings()

        return { history: ipHistoryCache, blockedIPs: blockedIPsCache, blockedCountries: blockedCountriesCache };
    }

    function queueSave() {
        isDirty = true;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(forceSave, 2000);
        // v2.4: Refresh stream protection badge when toggles change
        updateStreamProtectionBadge();
    }

    // --- OPTIMIZED STORAGE LOGIC ---

    // 1. Lightweight saver for toggles (Runs instantly)
    function saveCoreSettings() {
        GM_setValue('ome_country_blocking_enabled', countryBlockingEnabled);
        GM_setValue('ome_state_blocking_enabled', stateBlockingEnabled);
        GM_setValue('ome_state_block_mode', stateBlockMode);
        GM_setValue('ome_blocked_regions', JSON.stringify(Array.from(blockedRegionsCache)));
        // [NEW] CSV region filter persistence
        GM_setValue("ome_state_filter_csv_enabled", stateFilterCsvEnabled);
        GM_setValue("ome_state_filter_csv_text", stateFilterCsvText);
        // [FIX 4] Footgun guard - never persist allow-mode with empty cache. Coerces
        //   silently after the first launch-warning so the user understands why their toggle snapped back.
        if (stateBlockMode === "allow" && blockedRegionsCache.size === 0) {
            stateBlockMode = "block";
            if (!footgunGuardHasFired) {
                console.warn("[Ome-IP] stateBlockMode=allow saved with empty cache - auto-coerced to block to prevent global skip (one-time warning, won't repeat this session)");
                footgunGuardHasFired = true;
            }
        }
        GM_setValue('ome_ip_blocking_enabled', ipBlockingEnabled);
        GM_setValue('ome_dark_mode_active', isDarkModeActive);
        GM_setValue('ome_ip_grabbing', isIPGrabbingEnabled);
        GM_setValue('ome_face_protection', isFaceProtectionEnabled);
        GM_setValue('ome_report_protection', isReportProtectionEnabled);
        GM_setValue('ome_force_relay', FAKE_CONFIG.forceRelay);
        GM_setValue('ome_fake_cam_enabled', FAKE_CONFIG.enabled);
        GM_setValue('ome_spoof_devices', FAKE_CONFIG.spoofDeviceNames);
        GM_setValue('ome_fingerprint_spoofing', isFingerprintSpoofingEnabled);
        GM_setValue('ome_anti_bot', isAntiBotEnabled);

        // [FIXED] Added missing keys so they save correctly
        GM_setValue('ome_raw_audio', FAKE_CONFIG.rawAudio);
        GM_setValue('ome_antiban_frames', FAKE_CONFIG.antiBanFrames);
        GM_setValue('ome_udp_strict', FAKE_CONFIG.udpStrict);

        // [NEW] Gender filter persistence
        GM_setValue('ome_gender_filter_mode', genderFilterMode);
        GM_setValue('ome_use_name_heuristic', useNameHeuristic);
        GM_setValue('ome_use_thumbnail_heuristic', useThumbnailHeuristic);
    }

    // 2. Heavy saver for History/Lists
    function forceSave() {
        // Save core settings first (Fast)
        saveCoreSettings();

        // Only save heavy data objects if they have changed (isDirty)
        if (isDirty) {
            checkAndPruneStorage();
            if (ipHistoryCache) GM_setValue('ome_ip_history', JSON.stringify(ipHistoryCache));
            if (blockedIPsCache) GM_setValue('ome_blocked_ips', JSON.stringify([...blockedIPsCache]));
            if (blockedCountriesCache) GM_setValue('ome_blocked_countries', JSON.stringify([...blockedCountriesCache]));
            GM_setValue('ome_custom_hidden', JSON.stringify([...customHiddenSelectors]));
            GM_setValue('ome_custom_blackout', JSON.stringify([...customBlackoutSelectors]));
            // [NEW] Gender cache (heavy)
            if (genderCache) GM_setValue('ome_gender_cache', JSON.stringify(genderCache));
            isDirty = false;
        }
    }

    // [NEW] Task 2: Reset Settings Only (Keeps Data)
    function resetSettingsOnly() {
        if (!confirm("Reset ALL Settings to Defaults?\n(History, Blocked IPs, and Notes will be SAFE)")) return;

        // [ON by Default]
        ipBlockingEnabled = false;
        
        // FIX: Changed from true to false
        isDarkModeActive = false;
        areWatermarksHidden = false;

        isIPGrabbingEnabled = true;
        isFaceProtectionEnabled = false;
        isReportProtectionEnabled = false;
        isFingerprintSpoofingEnabled = false;
        isAntiBotEnabled = false;

        // [OFF by Default]
        countryBlockingEnabled = false;
        FAKE_CONFIG.enabled = false;     // Fake Cam
        FAKE_CONFIG.udpStrict = false;   // UDP Only
        FAKE_CONFIG.forceRelay = false;
        FAKE_CONFIG.spoofDeviceNames = false;
        FAKE_CONFIG.rawAudio = false;
        FAKE_CONFIG.antiBanFrames = false;

        // One Mode (Synced to Spoof)
        FAKE_CONFIG.oneCameraMode = false;
        FAKE_CONFIG.oneInputMode = false;
        FAKE_CONFIG.oneOutputMode = false;

        // Save to Storage
        saveCoreSettings();
        GM_setValue('ome_one_cam_mode', false);
        GM_setValue('ome_one_input_mode', false);
        GM_setValue('ome_one_output_mode', false);
        GM_setValue('ome_ghost_mode', false);
        // [NEW] Reset gender filter settings (keeps genderCache data intact)
        genderFilterMode = 'off';
        useNameHeuristic = false;
        GM_setValue('ome_gender_filter_mode', 'off');
        GM_setValue('ome_use_name_heuristic', false);

        // Update UI
        updateMasterToggles();
        
        // FIX: Apply the new 'false' state
        toggleWatermarks(false);
        updateStatusDots();

        showToast("Settings Reset to New Defaults");
        setTimeout(() => location.reload(), 1000);
    }

    function clearAllData() {
        if (!confirm("⚠️ DANGER: CLEAR ALL DATA? ⚠️\n\nThis will wipe:\n- All Blocked IPs\n- All History/Notes\n- Custom Hidden Elements\n- All Settings Back to Default\n\nThis cannot be undone.")) return;

        // 1. Reset Storage Objects
        ipHistoryCache = {};
        blockedIPsCache = new Set();
        blockedCountriesCache = new Set(DEFAULT_BLOCKED_COUNTRIES);
        customHiddenSelectors = new Set();
        customBlackoutSelectors = new Set();
        genderCache = {}; // [NEW] wipe gender tags too

        // 2. Reset Config Defaults
        ipBlockingEnabled = false;
        
        // FIX: Changed from true to false
        isDarkModeActive = false;
        
        currentCountrySort = 'az';
        isWindowTransparent = false;

        isIPGrabbingEnabled = true;
        isFaceProtectionEnabled = false;
        isReportProtectionEnabled = false;
        isFingerprintSpoofingEnabled = false;
        isAntiBotEnabled = false;

        // [OFF Defaults]
        countryBlockingEnabled = false;
        FAKE_CONFIG.enabled = false;
        FAKE_CONFIG.udpStrict = false;
        FAKE_CONFIG.forceRelay = false;
        FAKE_CONFIG.spoofDeviceNames = false;
        FAKE_CONFIG.rawAudio = false;
        FAKE_CONFIG.antiBanFrames = false;

        FAKE_CONFIG.oneCameraMode = false;
        FAKE_CONFIG.oneInputMode = false;
        FAKE_CONFIG.oneOutputMode = false;

        FAKE_CONFIG.videoURL = '';

        // RESET LABELS
        FAKE_CONFIG.videoLabels = [...DEFAULT_VIDEO_LABELS];
        FAKE_CONFIG.audioInputLabels = [...DEFAULT_AUDIO_INPUT_LABELS];
        FAKE_CONFIG.audioOutputLabels = [...DEFAULT_AUDIO_OUTPUT_LABELS];

        // 3. Save to Memory (WIPE EVERYTHING)
        GM_setValue('ome_custom_blackout', '[]');
        GM_setValue('ome_ip_history', '{}');
        GM_setValue('ome_blocked_ips', '[]');
        GM_setValue('ome_blocked_countries', JSON.stringify([...blockedCountriesCache]));
        GM_setValue('ome_custom_hidden', '[]');

        // SAVE NEW DEFAULTS
        GM_setValue('ome_country_blocking_enabled', false);
        GM_setValue('ome_ip_blocking_enabled', false);
        
        // FIX: Explicitly save false
        GM_setValue('ome_dark_mode_active', false);
        
        GM_setValue('ome_ghost_mode', false);

        GM_setValue('ome_ip_grabbing', true);
        GM_setValue('ome_face_protection', false);
        GM_setValue('ome_report_protection', false);
        GM_setValue('ome_fingerprint_spoofing', false);
        GM_setValue('ome_anti_bot', false);

        GM_setValue('ome_fake_cam_enabled', false); // Exception
        GM_setValue('ome_udp_strict', false);       // Exception

        GM_setValue('ome_force_relay', false);
        GM_setValue('ome_spoof_devices', false);
        GM_setValue('ome_fake_video_url', FAKE_CONFIG.videoURL);

        GM_setValue('ome_raw_audio', false);
        GM_setValue('ome_antiban_frames', false);

        GM_setValue('ome_one_cam_mode', false);
        GM_setValue('ome_one_input_mode', false);
        GM_setValue('ome_one_output_mode', false);

        GM_setValue('ome_video_labels', JSON.stringify(FAKE_CONFIG.videoLabels));
        GM_setValue('ome_audio_input_labels', JSON.stringify(FAKE_CONFIG.audioInputLabels));
        GM_setValue('ome_audio_output_labels', JSON.stringify(FAKE_CONFIG.audioOutputLabels));
        GM_setValue('ome_gender_cache', '{}');
        GM_setValue('ome_gender_filter_mode', 'off');
        GM_setValue('ome_use_name_heuristic', false);

        // 4. Update UI
        isDirty = false;
        updateMasterToggles();
        
        // FIX: Apply the new 'false' state
        toggleWatermarks(false);
        refreshStatsWindowDisplay(currentIP, null, currentApiData);

        alert("✅ All Data Cleared & Reset to New Defaults.");
        location.reload();
    }

    // --- SMART SKIP LOGIC ---
    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    function pressEscape() {
        // Only dispatch to the active element (or body).
        // The event will bubble up naturally, so we don't need to dispatch to document as well.
        const target = document.activeElement || document.body;

        const down = new KeyboardEvent('keydown', {
            key: 'Escape', code: 'Escape',
            keyCode: 27, which: 27,
            bubbles: true, cancelable: true, composed: true
        });
        target.dispatchEvent(down);

        const up = new KeyboardEvent('keyup', {
            key: 'Escape', code: 'Escape',
            keyCode: 27, which: 27,
            bubbles: true, cancelable: true, composed: true
        });
        target.dispatchEvent(up);
    }

    function getSiteType() {
        const host = window.location.hostname;
        if (host.includes('ome.tv')) return 'ometv';
        if (host.includes('umingle')) return 'umingle';
        if (host.includes('omegleapp')) return 'omegleapp';
        if (host.includes('omegleweb')) return 'omegleweb'; // <--- ADDED THIS
        return 'other';
    }

    async function clickGenericNextBtn() {
        const site = getSiteType();

        // 1. Ome.tv Specific XPath Logic
        if (site === 'ometv') {
            const xpathResult = document.evaluate(
                "//div[contains(@class, 'btn') and .//span[@data-tr='next']]",
                document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
            );
            const btn = xpathResult.singleNodeValue;
            if (btn) {
                btn.click();
                return;
            }
        }

        // 2. Generic Fallback
        const selectors = [
            '.buttons__button.start',
            'button.next-btn',
            '.chat__header-btn',
            '.btn-new-chat',
            'button[class*="next"]',
            'button[class*="skip"]',
            'button[class*="start"]',
            '.roulette-controls .start-btn'
        ];

        let btn = null;
        for (let s of selectors) {
            btn = document.querySelector(s);
            if (btn && btn.offsetParent) break;
        }

        if (!btn) {
            const allBtns = Array.from(document.querySelectorAll('button, .btn, div[role="button"]'));
            btn = allBtns.find(el => {
                if (el.offsetParent === null) return false;
                const t = el.innerText.toLowerCase();
                return t === 'start' || t === 'next' || t === 'skip' || t === 'really?';
            });
        }

        if (btn) btn.click();
        else logDev("ERR", "No Skip Button Found");
    }

    async function performSmartSkip(reason) {
        // [NEW] Prevent Auto-Skipping if IP Grabber is OFF
        // We allow "Manual" reasons (Buttons) to pass through.
        if (!isIPGrabbingEnabled && !reason.startsWith("Manual")) {
            return;
        }

        let now = Date.now();

        // --- v2.3 Anti-Detection: Burst rate limiter ---
        // Reset burst window every 60 seconds
        if (now - skipBurstWindowStart > 60000) {
            skipBurstCount = 0;
            skipBurstWindowStart = now;
        }
        // Only count non-Manual skips toward the burst limit
        if (!reason.startsWith("Manual")) {
            skipBurstCount++;
        }
        // If we've skipped too many in 60s, force a long cooldown
        const burstPenalty = skipBurstCount > SKIP_BURST_LIMIT
            ? (skipBurstCount - SKIP_BURST_LIMIT) * 4000 + Math.random() * 3000
            : 0;

        // --- v2.3 Anti-Detection: Occasional "stay" behavior ---
        // Don't skip every blocked person — real humans sometimes pause
        if (!reason.startsWith("Manual") && Math.random() < SKIP_STAY_CHANCE) {
            logDev("SKIP", `HUMAN-DELAY: Staying on blocked ${reason} (${getSiteType()})`);
            const stayTime = 4000 + Math.random() * 12000; // stay 4-16 seconds
            await delay(stayTime);
            logDev("SKIP", `Continuing after stay delay for ${reason}`);
            now = Date.now(); // refresh timestamp after stay
        }

        // --- v2.3 Anti-Detection: Randomized human-like delay ---
        // Manual skips (user clicking Next) use a much shorter delay range
        const isManual = reason.startsWith("Manual");
        const minDelay = isManual ? 300 : SKIP_DELAY_MIN;
        const maxDelay = isManual ? 1500 : SKIP_DELAY_MAX;
        const randomDelay = minDelay + Math.random() * (maxDelay - minDelay);
        const effectiveDelay = Math.max(randomDelay, burstPenalty);
        const timeSinceLast = now - lastSkipTime;
        lastSkipTime = now;

        if (timeSinceLast < effectiveDelay) {
            const waitTime = effectiveDelay - timeSinceLast;
            logDev("SKIP", `Waiting ${Math.round(waitTime)}ms (human delay)`);
            await delay(waitTime);
        }

        logDev("SKIP", `${reason} (${getSiteType()})`);

        const site = getSiteType();

        // 1. Ome.tv (Click Logic)
        if (site === 'ometv') { await clickGenericNextBtn(); return; }

        // 2. Umingle (Double Escape Logic)
        // Presses ESC once to disconnect, waits 150ms, then presses again to find new partner
        if (site === 'umingle') {
            pressEscape();
            await delay(150);
            pressEscape();
            return;
        }

        // 3. OmegleApp & OmegleWeb (Single Escape Logic)
        if (site === 'omegleapp' || site === 'omegleweb') {
            pressEscape();
            return;
        }

        // 4. Fallback for unknown sites
        await performFallbackSkip();
    }

    async function performFallbackSkip() {
        const isChatEnded = () => {
            const startBtn = document.querySelector('.buttons__button.start, .btn-new-chat, button.newbtn');
            const stopBtn = document.querySelector('.buttons__button.stop, button.disconnectbtn');
            if (startBtn && startBtn.offsetParent) return true;
            if (stopBtn && stopBtn.offsetParent) return false;
            return true;
        };

        const doEsc = async (times) => {
            pressEscape();
            if(times > 1) { await delay(1000 + Math.random()*200); pressEscape(); }
        };
        const doClick = async (times) => {
            await clickGenericNextBtn();
            if(times > 1) { await delay(1000 + Math.random()*200); await clickGenericNextBtn(); }
        };

        let attempt = fallbackMethod;
        logDev("SKIP", `Fallback Strategy: ${attempt}`);

        if (attempt === 'esc1') {
            await doEsc(1); await delay(600);
            if (!isChatEnded()) { logDev("SKIP", "Fallback: ESCx1 failed, upgrading to ESCx2"); fallbackMethod = 'esc2'; await doEsc(1); }
        }
        else if (attempt === 'esc2') {
            await doEsc(2); await delay(600);
            if (!isChatEnded()) { logDev("SKIP", "Fallback: ESCx2 failed, upgrading to Clickx1"); fallbackMethod = 'click1'; await doClick(1); }
        }
        else if (attempt === 'click1') {
            await doClick(1); await delay(600);
            if (!isChatEnded()) { logDev("SKIP", "Fallback: Clickx1 failed, upgrading to Clickx2"); fallbackMethod = 'click2'; await doClick(1); }
        }
        else if (attempt === 'click2') {
            await doClick(2);
        }
    }

    // [NEW] Gender tagging helpers
    function getStoredGender(ip) {
        if (!ip || !genderCache) return null;
        return genderCache[ip] || null;
    }
    function setStoredGender(ip, gender) {
        if (!ip) return;
        if (!genderCache) genderCache = {};
        if (gender === null || gender === '') {
            delete genderCache[ip];
        } else {
            genderCache[ip] = gender; // 'f' | 'm' | 'u'
        }
        isDirty = true;
        queueSave();
    }
    function getGenderStats() {
        const s = { f: 0, m: 0, u: 0 };
        if (!genderCache) return s;
        for (const k in genderCache) {
            const v = genderCache[k];
            if (v === 'f') s.f++;
            else if (v === 'm') s.m++;
            else s.u++;
        }
        return s;
    }

    // [NEW] Simple Western-first-name heuristic for partner display names
    // Lists are intentionally small (English/Western names). Non-Western or
    // non-first names will not match -> heuristic silently does nothing
    // (manual tagging still works via the 👩/👨/❓ buttons).
    const NAMES_FEMALE = "mary anna sarah jessica jennifer linda elizabeth susan megan nicole amanda emily ashley samantha olivia emma sophia mia isabella charlotte amelia harper evelyn abigail ella claire luna hannah lily caroline savannah audrey aria elena gabriella naomi maya laura grace chloe penelope riley layla lillian zoey nora katie amelia jasmine madison emma sofia alexa mia eliana laura victoria isabelle autumn sophia caroline".split(/\s+/);
    const NAMES_MALE   = "john mike david james robert michael william richard joseph thomas charles christopher daniel matthew anthony mark donald steven paul andrew joshua kenneth kevin brian george timothy ronald edward jason jeffrey ryan jacob gary nicholas eric jonathan stephen larry justin scott brandon benjamin samuel raymond gregory frank alexander patrick jack dennis jerry tyler aaron jose adam nathan henry peter sam liam noah ethan mason logan lucas jackson oliver carter jayden luke gabriel anthony isaac grayson julian levi aiden jameson caleb connor asher kingston".split(/\s+/);
    const NAME_SET_F = new Set(NAMES_FEMALE);
    const NAME_SET_M = new Set(NAMES_MALE);

    // [NEW] Lazy-load face-api.js and its gender-detection models. Only called once per
    // page lifetime (state machine prevents re-attempts). On failure falls back to the
    // name heuristic and skips silently for the rest of the session.
    async function loadFaceApiLazy() {
        if (faceApiState !== "unloaded") return faceApiState;
        faceApiState = "loading";
        try {
            if (typeof unsafeWindow.faceapi === "undefined") {
                await new Promise((resolve, reject) => {
                    const s = document.createElement("script");
                    s.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js";
                    s.onload = () => resolve();
                    s.onerror = () => reject(new Error("face-api script tag failed"));
                    document.head.appendChild(s);
                });
            }
            const url = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";
            await unsafeWindow.faceapi.nets.tinyFaceDetector.loadFromUri(url);
            await unsafeWindow.faceapi.nets.ageGenderNet.loadFromUri(url);
            faceApiState = "ready";
            logDev("GEN", "Thumbnail gender classifier loaded (face-api v1.7.12)");
        } catch (e) {
            faceApiState = "failed";
            thumbnailClassifyFailCount++;
            logDev("GEN", "Thumbnail classifier load failed: " + (e && e.message ? e.message : String(e)));
            console.warn("[Ome-IP] Thumbnail gender classifier disabled this session (face-api load failed)", e);
        }
        return faceApiState;
    }

    // [NEW] Classify partner gender from the live webcam stream via face-api.js.
    // Skips silently if: thumbnail heuristic disabled, mode off, no IP, already cached,
    // model failed, video not yet streaming, or no face found. Falls back to the existing
    // name heuristic (which is unchanged) for any failure path.
    async function applyThumbnailHeuristicIfEnabled(ip) {
        try {
            // [FIX B] per-session override: honor unsafeWindow.ome_ip_state.useThumbnailHeuristic flip
            try { if (unsafeWindow.ome_ip_state && unsafeWindow.ome_ip_state.useThumbnailHeuristic === true) useThumbnailHeuristic = true; } catch (_) {}
            if (!ip) return;
            if (!useThumbnailHeuristic) return; // [FIX 3a] early opt-out
            if (genderFilterMode === "off") return;
            if (genderCache[ip]) return; // already classified, keep cache wins

            const ready = await loadFaceApiLazy();
            if (ready !== "ready") return; // silent fallback
            // [FIX 3b] re-check opt-out after model load
            if (!useThumbnailHeuristic) { logDev("GEN", "Thumbnail heuristic: toggled OFF mid-load — skipping"); return; }
            // [FIX 3c] snapshot original IP for late re-verification
            const ipSnapshot = ip;
            const t0 = Date.now();

            const vid = document.querySelector("video:not(#localVideo)");
            if (!vid || vid.readyState < 2 || (vid.videoWidth|0) < 32) return;
            if (vid.currentTime < 0.3) {
                await new Promise(r => setTimeout(r, 350));
            }
            // [FIX 2] re-verify the partner IP still matches at commit time
            if (typeof currentIP !== "string" || currentIP !== ipSnapshot) {
                logDev("GEN", `Thumbnail heuristic aborted: currentIP changed (was ${ipSnapshot}, now ${currentIP})`);
                return;
            }

            const fa = unsafeWindow.faceapi;
            const opts = new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
            let male = 0, female = 0, hits = 0;
            for (let frame = 0; frame < 3; frame++) {
                // [FIX 3d] opt-out gate every iteration
                if (!useThumbnailHeuristic) return;
                try {
                    // [FIX A] explicit per-frame dispose: tear down TF.js tensors to limit heap growth
                    // [FIX A] teardown previous result before next iteration to limit heap growth
                    try { if (prevDet && typeof fa !== "undefined" && fa.tf) { try { fa.tf.dispose(prevDet); } catch (_) {} try { fa.tf.disposeVariables(); } catch (_) {} } } catch (_) {}
                    var det = await fa.detectSingleFace(vid, opts).withAgeAndGender();
                    var prevDet = det;
                    if (det && det.gender && det.genderProbability > 0.55) {
                        hits++;
                        if (det.gender === "male") male++;
                        else if (det.gender === "female") female++;
                    }
                } catch (_) { /* per-frame failure is non-fatal */ }
                await new Promise(r => setTimeout(r, 280));
            }

            if (hits < 2) {
                logDev("GEN", `Thumbnail heuristic inconclusive for ${ip} (hits=${hits}, elapsed=${Date.now()-t0}ms); leaving cache untouched`);
                return;
            }
            const tag = male > female ? "m" : "f";

            // [FIX 2b] final re-verification before writing
            if (typeof currentIP !== "string" || currentIP !== ipSnapshot) {
                logDev("GEN", `Thumbnail heuristic: skip write — currentIP changed (was ${ipSnapshot}, now ${currentIP})`);
                return;
            }

            try { setStoredGender(ipSnapshot, tag); } catch (_) {}
            genderCache[ipSnapshot] = tag;
            logDev("GEN", `Thumbnail heuristic: ${ipSnapshot} -> ${tag} (m=${male}/f=${female}/hits=${hits}, elapsed=${Date.now()-t0}ms)`);

            // [FIX A] final tear-down after all frames classified
            try { if (typeof fa !== "undefined" && fa.tf) { try { fa.tf.disposeVariables(); } catch (_) {} } } catch (_) {}
            // [FIX 5] SOURCE flagged separately; reason text matches existing prefix
            try { if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {}; unsafeWindow.ome_ip_state.genderSource = "cam"; } catch (_) {}
            if ((genderFilterMode === "skip-women" && tag === "f") ||
                (genderFilterMode === "skip-men"  && tag === "m")) {
                const reason = tag === "f" ? "Filtered Gender: woman" : "Filtered Gender: man";
                logDev("GEN", `Auto-skip ${ipSnapshot} due to thumbnail heuristic (${tag})`);
                try { performSmartSkip(reason); } catch (_) {}
            }
        } catch (e) {
            logDev("GEN", "applyThumbnailHeuristicIfEnabled error: " + (e && e.message ? e.message : String(e)));
        }
    }

    function guessGenderFromName(rawName) {
        if (!rawName) return null;
        // Strip numbers/punctuation, lowercase, then take the first alphabetic token
        const cleaned = String(rawName).toLowerCase().replace(/[^a-z]/g, ' ').trim().split(/\s+/);
        for (const tok of cleaned) {
            if (NAME_SET_F.has(tok)) return 'f';
            if (NAME_SET_M.has(tok)) return 'm';
        }
        return null;
    }
    function extractOmeTvUsername() {
        // Best-effort DOM probe for the partner display name on ome.tv-family sites.
        // Returns null if the name isn't exposed at this moment.
        try {
            const selectors = [
                '[data-tr="partner-name"]',
                '.video-info__name',
                '.partner-name',
                '[class*="partner"] [class*="name"]',
                '.strangermsg',
                '.header__name'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent) {
                    const t = el.textContent.trim();
                    if (t && t.length > 0 && t.length < 32) return t;
                }
            }
        } catch(e) { /* ignore */ }
        return null;

    // [NEW] Deferred state-fence skip decision. Called from inside getLocation's success
    //   handler so it fires after currentApiData is populated. Without this, the synchronous
    //   check inside checkAndSkipIfBlocked runs ~150-500ms before ipwhois returns and the
    //   state-fence branch silently falls through. Re-verifies currentIP to defend against
    //   quickly-cycling partnerships (where apiData could belong to a different match).
    function tryStateFenceSkip(apiData, ipSnapshot) {
        try {
            // [FIX 1] Snapshot is the FIRST guard - everything below is protected from
            //   stale apiData when the partner has cycled (a previously-pending getLocation
            //   resolving for a now-gone IP would otherwise still fire performSmartSkip).
            if (typeof currentIP !== "string" || currentIP !== ipSnapshot) return;
            if (!apiData) return;
            if (!stateBlockingEnabled) return;
            if (blockedRegionsCache.size === 0) return;

            const matched = matchGeoRegion(apiData);
            if (!matched) {
                if (stateBlockMode === "allow") {
                    try { performSmartSkip("Region Unverified (Allow-mode)"); } catch (_) {}
                }
                return;
            }

            const inSet = blockedRegionsCache.has(matched.id);
            const shouldSkip = (stateBlockMode === "allow") ? !inSet : inSet;
            if (!shouldSkip) return;

            const reason = stateBlockMode === "allow"
                ? "Region Not Whitelisted: " + matched.n
                : "Filtered Region: " + matched.n + ", " + matched.c;
            logDev("GEN", "State-fence skip: " + matched.id + " mode=" + stateBlockMode + " reason=" + reason);
            try { performSmartSkip(reason); } catch (_) {}
        } catch (e) {
            logDev("GEN", "tryStateFenceSkip error: " + (e && e.message || e));
        }
    }

    // [NEW] Standalone CSV region filter - sibling to tryStateFenceSkip.
    //   Substring match against `currentApiData.region`. Independent from
    //   precision geo-fence. Race-safety via currentIP === ipSnapshot guard.
    function tryCSVFenceSkip(apiData, ipSnapshot) {
        try {
            if (!stateFilterCsvEnabled) return;
            if (stateFilterCsvTokens.size === 0) return;
            if (typeof currentIP !== "string" || currentIP !== ipSnapshot) return;
            if (!apiData || !apiData.region) return;
            const normRegion = normalizeRegionName(apiData.region);
            if (!normRegion) return;
            const partnerIso = (apiData.country_code || "").toUpperCase();
            for (const tok of stateFilterCsvTokens) {
                if (normRegion.indexOf(tok) < 0) continue;
                const isoHint = stateFilterCsvIsoByToken.get(tok);
                if (isoHint && partnerIso !== isoHint) continue;
                try {
                    performSmartSkip("Filtered Region (CSV): " + apiData.region + ", " + partnerIso);
                } catch (_) {}
                return;
            }
        } catch (_) {}
    }

    }
    function applyNameHeuristicIfEnabled(ip) {
        if (!useNameHeuristic || !ip) return;
        if (genderCache[ip]) return; // already manually tagged
        const rawName = extractOmeTvUsername();
        if (!rawName) return;
        const guess = guessGenderFromName(rawName);
        if (guess) {
            genderCache[ip] = guess;
            isDirty = true;
            queueSave();
            logDev("GEN", `Heuristic: ${ip} -> ${guess} (from '"'${rawName}'"')`);
            // If filter is set and this partner matches, skip them now
            if ((genderFilterMode === 'skip-women' && guess === 'f') ||
                (genderFilterMode === 'skip-men'  && guess === 'm')) {
                logDev("GEN", `Auto-skip ${ip} due to heuristic match (${guess})`);
                performSmartSkip(guess === 'f' ? "Filtered Gender: woman" : "Filtered Gender: man");
            }
        }
    }

    function checkAndSkipIfBlocked(ip, countryCode) {
        // [NEW] Exit immediately if IP Grabber is OFF
        if (!isIPGrabbingEnabled) return;

        if (isRelayIP) return;
        const { blockedIPs, blockedCountries } = loadData();
        let shouldSkip = false, reason = "";

        if (ipBlockingEnabled && ip && blockedIPs.has(ip)) { shouldSkip = true; reason = "Blocked IP"; }
        else if (countryBlockingEnabled && countryCode && blockedCountries.has(countryCode.toLowerCase())) { shouldSkip = true; reason = `Blocked Country (${countryCode})`; }
        else if (genderFilterMode !== 'off' && ip && genderCache[ip]) {
            const tag = genderCache[ip];
            // GENDER (defined at IIFE top) is the single source of truth.
            if (GENDER.shouldSkipTag(genderFilterMode, tag)) {
                shouldSkip = true;
                reason = GENDER.skipReasonFor(tag);
            }
        }

        if (shouldSkip) {
            const contentArea = document.getElementById("ip-stats-area");
            if (contentArea) contentArea.innerHTML += `<br><span style="color:red; font-weight:bold;">🚫 AUTO-SKIPPING (${reason})...</span>`;
            performSmartSkip(reason);
        }
    }

    // --- VOLUME CONTROL ---
    function updateVolume(val) {
        globalVolume = val;
        const media = document.querySelectorAll('video, audio');
        media.forEach(m => m.volume = globalVolume);
        const slider = document.querySelector('.ome-vol-slider');
        if (slider) {
            const pct = val * 100;
            slider.style.backgroundImage = `linear-gradient(to right, #FFA500 0%, #FFA500 ${pct}%, rgba(255,255,255,0.3) ${pct}%, rgba(255,255,255,0.3) 100%)`;
        }
    }

    // --- WATERMARK TOGGLE ---
    function toggleWatermarks(forceState = null) {
        areWatermarksHidden = forceState !== null ? forceState : !areWatermarksHidden;
        isDarkModeActive = areWatermarksHidden;
        GM_setValue('ome_dark_mode_active', isDarkModeActive);

        // Visual update for menu button (Request #5: White/Grey Glow logic)
        const wmBtn = document.getElementById("watermark-toggle-btn");
        if (wmBtn) {
            wmBtn.style.borderColor = isDarkModeActive ? "#FFFFFF" : "#888";
            wmBtn.style.boxShadow = isDarkModeActive ? "0 0 10px rgba(255,255,255,0.8)" : "none";
            // Also ensure opacity is correct if not in ghost mode
            if (!isWindowTransparent) wmBtn.style.opacity = isDarkModeActive ? "1" : "0.7";
        }

        if (areWatermarksHidden) {
            document.body.classList.add('ome-hide-watermarks');
            document.body.classList.add('ome-dark-mode');

            if (!isWindowTransparent) {
                const win = document.getElementById("ip-log-window");
                if (win) win.style.backgroundColor = "rgba(0,0,0,0.95)";
            }
        } else {
            document.body.classList.remove('ome-hide-watermarks');
            document.body.classList.remove('ome-dark-mode');

            if (!isWindowTransparent) {
                const win = document.getElementById("ip-log-window");
                if (win) win.style.backgroundColor = "rgba(0,0,0,0.85)";
            }
        }
        showToast(`Dark Mode: ${areWatermarksHidden ? "ON" : "OFF"}`);
    }

    function applyCustomHides() {
        // 1. If in "Unhide" mode, do nothing to avoid fighting selection
        if (elementSelectorMode === 'unhide') return;

        // 2. Helper to toggle class efficiently
        const enforceClass = (selector, className) => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    // PERFORMANCE FIX: Only touch the DOM if necessary
                    if (!el.classList.contains(className)) {
                        el.classList.add(className);
                    }
                });
            } catch(e) {}
        };

        // 3. Apply Hides
        customHiddenSelectors.forEach(sel => enforceClass(sel, 'ome-visually-hidden'));
        customBlackoutSelectors.forEach(sel => enforceClass(sel, 'ome-blacked-out'));

        // Note: We no longer "clean up" every cycle because it causes flashing/lag.
        // We only clean up when the user clicks "Unhide" or "Clear All".
    }

    // --- ELEMENT SELECTOR LOGIC ---
    function startSelector(mode) {
        if (elementSelectorMode) exitSelectorMode();
        elementSelectorMode = mode;

        if (mode === 'unhide') {
            showToast("Select element to UNHIDE (Green)");
            // Show hidden elements temporarily for selection
            customHiddenSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    el.classList.add('ome-selector-hover-unhide'); // Use class for highlight
                    el.classList.remove('ome-visually-hidden'); // Reveal
                });
            });
            customBlackoutSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    el.classList.add('ome-selector-hover-unhide');
                    el.classList.remove('ome-blacked-out');
                });
            });
        } else if (mode === 'hide') {
            showToast("Select element to HIDE (Red - Keeps Space)");
            document.body.style.cursor = "crosshair";
        } else if (mode === 'blackout') {
            showToast("Select element to BLACK OUT (Blue)");
            document.body.style.cursor = "crosshair";
        }

        document.addEventListener('mouseover', handleSelectorHover);
        document.addEventListener('click', handleSelectorClick, true);
    }

    function handleSelectorHover(e) {
        if (!elementSelectorMode || elementSelectorMode === 'unhide') return;
        e.stopPropagation();
        const target = e.target;
        if (target.closest('#ip-log-window') || target.closest('#ome-menu-dropdown')) return;

        // Clean up old highlights
        document.querySelectorAll('.ome-selector-hover-hide, .ome-selector-hover-blackout').forEach(el => {
            el.classList.remove('ome-selector-hover-hide');
            el.classList.remove('ome-selector-hover-blackout');
        });

        if (elementSelectorMode === 'hide') target.classList.add('ome-selector-hover-hide');
        if (elementSelectorMode === 'blackout') target.classList.add('ome-selector-hover-blackout');
    }

    function handleSelectorClick(e) {
        if (!elementSelectorMode) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();

        const target = e.target;
        // Don't allow selecting the interface window itself
        if (target.closest('#ip-log-window') || target.closest('#ome-menu-dropdown')) {
            exitSelectorMode(); return;
        }

        if (elementSelectorMode === 'hide') {
            const selector = generateCssPath(target);
            if(confirm(`Hide Element?\nSelector: ${selector}`)) {
                customHiddenSelectors.add(selector);
                applyCustomHides(); // Immediate update
            }
        } else if (elementSelectorMode === 'blackout') {
            const selector = generateCssPath(target);
            if(confirm(`Black Out Element?\nSelector: ${selector}`)) {
                customBlackoutSelectors.add(selector);
                applyCustomHides(); // Immediate update
            }
        } else if (elementSelectorMode === 'unhide') {
            // Robust Unhide: Check target and all parents
            let found = false;
            let el = target;

            // Traverse up the DOM tree from the clicked element
            while (el && el !== document.body) {
                // 1. Check Custom Hidden Selectors
                customHiddenSelectors.forEach(sel => {
                    try {
                        if (el.matches && el.matches(sel)) {
                            customHiddenSelectors.delete(sel);
                            found = true;
                            // Force remove class immediately
                            el.classList.remove('ome-visually-hidden');
                        }
                    } catch(err) {
                        // If a selector is bad, ignore it and keep checking others
                        console.warn("Invalid selector found and ignored:", sel);
                    }
                });

                // 2. Check Custom Blackout Selectors
                customBlackoutSelectors.forEach(sel => {
                    try {
                        if (el.matches && el.matches(sel)) {
                            customBlackoutSelectors.delete(sel);
                            found = true;
                            // Force remove class immediately
                            el.classList.remove('ome-blacked-out');
                        }
                    } catch(err) {
                        console.warn("Invalid selector found and ignored:", sel);
                    }
                });

                el = el.parentElement;
            }

            if(found) {
                // We don't need to call applyCustomHides() here because that only ADDS classes.
                // We just removed the classes manually above and deleted the rule from the set.
                showToast("Element Unhidden");
            } else {
                showToast("No saved rule found for this element");
            }
        }

        exitSelectorMode();
        queueSave();
    }

    // [REPLACE THE ENTIRE generateCssPath FUNCTION WITH THIS]
    function generateCssPath(el) {
        if (!(el instanceof Element)) return;

        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();

            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break; // IDs are unique, we can stop here
            } else {
                let sibling = el;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() == selector) nth++;
                }

                // Add classes if available, but filter out common generic/dynamic ones
                if (el.className && typeof el.className === 'string') {
                    const validClasses = el.className.split(/\s+/)
                    .filter(c => c && !c.includes('ome-') && !c.includes('active') && !c.includes('hover') && !c.match(/^\d/));

                    if (validClasses.length > 0) {
                        selector += '.' + validClasses.join('.');
                    }
                }

                if (nth > 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }

    function exitSelectorMode() {
        elementSelectorMode = null;
        document.body.style.cursor = "default";
        document.removeEventListener('mouseover', handleSelectorHover);
        document.removeEventListener('click', handleSelectorClick, true);

        // Remove all highlight classes
        document.querySelectorAll('.ome-selector-hover-hide, .ome-selector-hover-blackout, .ome-selector-hover-unhide').forEach(el => {
            el.classList.remove('ome-selector-hover-hide');
            el.classList.remove('ome-selector-hover-blackout');
            el.classList.remove('ome-selector-hover-unhide');
        });

        // FORCE re-application of hides immediately
        applyCustomHides();
    }

    function unhideAllElements() {
        if (!confirm("Unhide ALL custom hidden elements?\nThis will clear all your saved hides.")) return;

        // 1. Clear the storage sets
        customHiddenSelectors.clear();
        customBlackoutSelectors.clear();

        // 2. FORCE REMOVE classes from all elements currently in the DOM
        const hiddenEls = document.querySelectorAll('.ome-visually-hidden');
        hiddenEls.forEach(el => el.classList.remove('ome-visually-hidden'));

        const blackoutEls = document.querySelectorAll('.ome-blacked-out');
        blackoutEls.forEach(el => el.classList.remove('ome-blacked-out'));

        // 3. Save the empty state
        queueSave();
        showToast("All elements unhidden");
    }

    // --- UI CREATION ---
    function createLogWindow() {
        if (document.getElementById("ip-log-window")) return;

        const win = document.createElement("div");
        win.id = "ip-log-window";
        win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            // CHANGED: Updated default Top/Left and Width/Height
            position: "fixed",
            top: "401px",       // Was "120px"
            left: "316px",      // Was "10px"
            width: "565px",     // Was "480px"
            height: "482px",    // Added explicit height (optional, but good for consistency)

            minWidth: "320px", minHeight: "280px", // Ensure these don't conflict
            backgroundColor: "rgba(0,0,0,0.85)",
            fontWeight: "bold", fontFamily: "monospace", borderRadius: "12px", border: "1px solid #444",
            backdropFilter: "blur(5px)", boxShadow: "0 4px 15px rgba(0,0,0,0.9)",
            display: "flex", flexDirection: "column", zIndex: "99999970", resize: "none"
        });

        // --- [NEW] Task 4: Lock Button (Top Middle) ---
        const lockBtn = document.createElement("div");
        lockBtn.id = "ome-ui-lock-btn";
        lockBtn.innerHTML = "🔓";
        lockBtn.title = "Lock/Unlock Toggles";
        Object.assign(lockBtn.style, {
            position: "absolute", top: "5px", left: "50%", transform: "translateX(-50%)",
            width: "24px", height: "24px", borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid #555",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", zIndex: "50", transition: "all 0.2s"
        });
        lockBtn.onclick = () => {
            isUILocked = !isUILocked;
            lockBtn.innerHTML = isUILocked ? "🔒" : "🔓";
            lockBtn.style.backgroundColor = isUILocked ? "rgba(255, 0, 0, 0.3)" : "rgba(0,0,0,0.5)";
            lockBtn.style.borderColor = isUILocked ? "#FF0000" : "#555";
            showToast(isUILocked ? "Controls Locked" : "Controls Unlocked", win);
        };
        win.appendChild(lockBtn);

        const mainHeaderContainer = document.createElement("div");
        Object.assign(mainHeaderContainer.style, {
            position: "absolute", top: "8px", right: "8px",
            display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end",
            zIndex: "20", pointerEvents: "none"
        });

        // Helper: Creates a Wrapper <div> containing the absolute button
        const createToggleDot = (id, getVal, emoji, label, onToggle, fontSize = "14px", noExpand = false) => {
            const wrapper = document.createElement("div");
            wrapper.className = "ome-btn-wrapper";

            const dot = document.createElement("div");
            dot.id = id;
            dot.className = "status-toggle-btn ome-no-select";

            const iconSpan = document.createElement("span");
            iconSpan.innerText = emoji;
            iconSpan.className = "ome-icon-span";
            iconSpan.style.fontSize = fontSize;
            dot.appendChild(iconSpan);

            const labelSpan = document.createElement("span"); labelSpan.innerText = label; labelSpan.className = "ome-btn-label";
            dot.appendChild(labelSpan);

            Object.assign(dot.style, {
                borderRadius: "16px", backgroundColor: "rgba(0,0,0,0.5)",
                border: "1px solid #444", cursor: "pointer", fontSize: "14px", color: "#fff", fontWeight: "bold", pointerEvents: "auto"
            });

            if (noExpand) {
                dot.style.width = "32px"; dot.style.transition = "none";
                dot.style.setProperty("width", "32px", "important"); labelSpan.style.display = "none";
            }

            dot.onclick = (e) => {
                e.stopPropagation();
                // [NEW] Task 4: Lock Check
                if (isUILocked) {
                    lockBtn.style.transform = "translateX(-50%) scale(1.2)";
                    setTimeout(() => lockBtn.style.transform = "translateX(-50%) scale(1)", 200);
                    return;
                }

                onToggle();
                saveCoreSettings();
                updateStatusDots();
                const newState = getVal();
                showToast(`${label}: ${newState ? "ON" : "OFF"}`, win, newState ? "rgba(0,150,0,0.8)" : null);
            };
            wrapper.appendChild(dot);
            return wrapper;
        };

        const rowStyle = { display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end", pointerEvents: "auto" };

        // --- [NEW] Task 6: New Grid Layout ---

        // --- [UPDATED] Grid Layout ---

        // ROW 1: UDP Only | Relay | Device Spoof
        const row1 = document.createElement("div"); Object.assign(row1.style, rowStyle);
        row1.appendChild(createToggleDot("status-dot-udp", () => FAKE_CONFIG.udpStrict, "⚠️", "UDP Only", () => {
            if (!FAKE_CONFIG.udpStrict) {
                if (confirm("⚠️ WARNING: UDP Strict Mode\n\nThis blocks all non-P2P connections.\nSome sites may break if they require relay servers.\n\nEnable?")) {
                    FAKE_CONFIG.udpStrict = true; 
                    GM_setValue('ome_udp_strict', true);
                }
            } else {
                if (confirm("⚠️ DISABLE UDP PROTECTION?\n\nDisabling Strict UDP may allow sites to route you through Relay servers (hiding IP).\n\nDisable anyway?")) {
                    FAKE_CONFIG.udpStrict = false; 
                    GM_setValue('ome_udp_strict', false);
                }
            }
        }));
        row1.appendChild(createToggleDot("status-dot-relay", () => FAKE_CONFIG.forceRelay, "🖧", "Relay", () => {
            if (FAKE_CONFIG.forceRelay) {
                if (!confirm("⚠️ DISABLE RELAY FORCE?\n\nYour real IP might be exposed if a direct connection is established.\n\nDisable anyway?")) return;
            }
            FAKE_CONFIG.forceRelay = !FAKE_CONFIG.forceRelay; 
            GM_setValue('ome_force_relay', FAKE_CONFIG.forceRelay);
        }, "22px"));
        row1.appendChild(createToggleDot("status-dot-spoof", () => FAKE_CONFIG.spoofDeviceNames, "🏷️", "Device Spoof", () => {
            if (FAKE_CONFIG.spoofDeviceNames) {
                if (!confirm("⚠️ DISABLE SPOOFING?\n\nReal device labels will be visible to the site.\n\nDisable anyway?")) return;
            }
            const newState = !FAKE_CONFIG.spoofDeviceNames;
            FAKE_CONFIG.spoofDeviceNames = newState;
            GM_setValue('ome_spoof_devices', newState);

            FAKE_CONFIG.oneCameraMode = newState;
            FAKE_CONFIG.oneInputMode = newState;
            FAKE_CONFIG.oneOutputMode = newState;
            GM_setValue('ome_one_cam_mode', newState);
            GM_setValue('ome_one_input_mode', newState);
            GM_setValue('ome_one_output_mode', newState);

            updateAdvToggleVisual("adv-toggle-device-spoof", newState);
            if (newState === true) createAdvancedSettingsWindow("adv-toggle-device-spoof");
        }));
        mainHeaderContainer.appendChild(row1);

        // ROW 2: Fake Cam | Jitter | Fingerprint
        const row2 = document.createElement("div"); Object.assign(row2.style, rowStyle);
        row2.appendChild(createToggleDot("status-dot-camera", () => FAKE_CONFIG.enabled, "🎬", "Fake Cam.mp4", () => {
            if (!FAKE_CONFIG.enabled) {
                if (confirm("⚠️ WARNING: Fake Camera Mode\n\nThis will override your video input with the configured MP4 loop.\n\nContinue?")) {
                    FAKE_CONFIG.enabled = true; 
                    GM_setValue('ome_fake_cam_enabled', true);
                    createAdvancedSettingsWindow("adv-toggle-fake-cam");
                    // v2.3: Auto-enable Face Bypass + Anti-Ban Jitter when Fake Camera turns on
                    // This prevents "irrelevant image" bans from the site's AI
                    if (!isFaceProtectionEnabled) {
                        isFaceProtectionEnabled = true;
                        GM_setValue('ome_face_protection', true);
                        window.dispatchEvent(new CustomEvent('ome-bypass-config', { detail: { type: 'face', enabled: true } }));
                        showToast("🎭 Face Bypass auto-enabled to prevent bans");
                    }
                    if (!FAKE_CONFIG.antiBanFrames) {
                        FAKE_CONFIG.antiBanFrames = true;
                        GM_setValue('ome_antiban_frames', true);
                        showToast("🌀 Anti-Ban Jitter auto-enabled");
                    }
                    updateStatusDots();
                }
            } else {
                FAKE_CONFIG.enabled = false; 
                GM_setValue('ome_fake_cam_enabled', false);
            }
        }));
        row2.appendChild(createToggleDot("status-dot-antiban", () => FAKE_CONFIG.antiBanFrames, "🛡️", "Jitter", () => {
            FAKE_CONFIG.antiBanFrames = !FAKE_CONFIG.antiBanFrames; 
            GM_setValue('ome_antiban_frames', FAKE_CONFIG.antiBanFrames);
        }));
        row2.appendChild(createToggleDot("status-dot-fingerprint", () => isFingerprintSpoofingEnabled, "🧬", "Fingerprint", () => {
            isFingerprintSpoofingEnabled = !isFingerprintSpoofingEnabled; GM_setValue('ome_fingerprint_spoofing', isFingerprintSpoofingEnabled);
            showToast("Reload required to apply");
        }));
        mainHeaderContainer.appendChild(row2);

        // ROW 3: Report Bypass | Face Bypass | Anti-Bot
        const row3 = document.createElement("div"); Object.assign(row3.style, rowStyle);
        row3.appendChild(createToggleDot("status-dot-report", () => isReportProtectionEnabled, "🖕", "Report Bypass", () => {
            isReportProtectionEnabled = !isReportProtectionEnabled; 
            GM_setValue('ome_report_protection', isReportProtectionEnabled);
            window.dispatchEvent(new CustomEvent('ome-bypass-config', { detail: { type: 'report', enabled: isReportProtectionEnabled } }));
            
            // Sync logic for hiding/showing Report Sounds in Advanced
            const soundRow = document.getElementById("adv-toggle-rep-sound");
            if (soundRow) soundRow.style.display = isReportProtectionEnabled ? "flex" : "none";
        }));
        row3.appendChild(createToggleDot("status-dot-face", () => isFaceProtectionEnabled, "🎭", "Face Bypass", () => {
            isFaceProtectionEnabled = !isFaceProtectionEnabled; GM_setValue('ome_face_protection', isFaceProtectionEnabled);
            window.dispatchEvent(new CustomEvent('ome-bypass-config', { detail: { type: 'face', enabled: isFaceProtectionEnabled } }));
        }));
        row3.appendChild(createToggleDot("status-dot-antibot", () => isAntiBotEnabled, "🤖", "Anti-Bot", () => {
            isAntiBotEnabled = !isAntiBotEnabled; GM_setValue('ome_anti_bot', isAntiBotEnabled);
            showToast("Anti-Bot: Reload to Apply changes");
        }));
        mainHeaderContainer.appendChild(row3);

        // ROW 4: Country Block | Images | IP Block
        const row4 = document.createElement("div"); Object.assign(row4.style, rowStyle);
        row4.appendChild(createToggleDot("status-dot-country", () => countryBlockingEnabled, "🌍", "Country Block", () => {
            countryBlockingEnabled = !countryBlockingEnabled;
            if (countryBlockingEnabled && !isIPGrabbingEnabled) {
                isIPGrabbingEnabled = true; GM_setValue('ome_ip_grabbing', true); showToast("IP Grabber Auto-Enabled");
            }
            saveCoreSettings(); updateStatusDots(); updateAdvToggleVisual("adv-toggle-country-block", countryBlockingEnabled);
        }));
        row4.appendChild(createToggleDot("status-dot-thumbs", () => isThumbnailCaptureEnabled, "🖼️", "Images", () => {
            isThumbnailCaptureEnabled = !isThumbnailCaptureEnabled;
            GM_setValue('ome_thumb_capture', isThumbnailCaptureEnabled);
            updateStatusDots();
            updateAdvToggleVisual("adv-toggle-thumbs", isThumbnailCaptureEnabled);
            showToast(`Thumbnails: ${isThumbnailCaptureEnabled ? "ON" : "OFF"}`);
        }));
        row4.appendChild(createToggleDot("status-dot-ipblock", () => ipBlockingEnabled, "🛡️", "IP Block", () => {
            ipBlockingEnabled = !ipBlockingEnabled;
            if (ipBlockingEnabled && !isIPGrabbingEnabled) {
                isIPGrabbingEnabled = true; GM_setValue('ome_ip_grabbing', true); showToast("IP Grabber Auto-Enabled");
            }
            saveCoreSettings(); updateStatusDots(); updateAdvToggleVisual("adv-toggle-ip-block", ipBlockingEnabled);
        }));
        // GENDER (defined at IIFE top) is the single source of truth for the
        // status dot's icon, label, and cycle order.
        const initialGender = GENDER.entryForMode(genderFilterMode);
        row4.appendChild(createToggleDot(
            "status-dot-state",
            () => stateBlockingEnabled,
            "\uD83D\uDCCD", // Pin emoji
            "State Geo-Fence: " + (stateBlockingEnabled ? "ON" : "OFF"),
            () => {
                // [NEW] Cycle off -> state -> country -> both -> off
                const MODES = ['off', 'state', 'country', 'both'];
                geoFenceMode = MODES[(MODES.indexOf(geoFenceMode) + 1) % MODES.length];
                stateBlockingEnabled = (geoFenceMode === 'state' || geoFenceMode === 'both');
                countryBlockingEnabled = (geoFenceMode === 'country' || geoFenceMode === 'both');
                GM_setValue('ome_geo_fence_mode', geoFenceMode);
                saveCoreSettings();
                const LABELS = {
                    'off': 'OFF',
                    'state': 'Region-only (' + blockedRegionsCache.size + ')',
                    'country': 'Country-only',
                    'both': 'Both (region + country)'
                };
                showToast('Geo Filter: ' + LABELS[geoFenceMode]);
                updateStatusDots();
                // Auto-open picker when a region-aware mode is activated
                if (geoFenceMode === 'state' || geoFenceMode === 'both') {
                    if (typeof openGeoPicker === 'function') openGeoPicker();
                }
            }
        ));
        row4.appendChild(createToggleDot(
            "status-dot-gender",
            () => genderFilterMode !== 'off',
            initialGender.dotIcon,
            "Gender Filter: " + initialGender.dotLabel,
            () => {
                genderFilterMode = GENDER.nextMode(genderFilterMode);
                saveCoreSettings();
                // Keep the settings-panel dropdown in sync (if it has been built).
                const sel = document.getElementById('ome-gender-filter-select');
                if (sel) sel.value = genderFilterMode;
                if (typeof window.__omeGenderStatsUpdate === 'function') {
                    window.__omeGenderStatsUpdate();
                }
                showToast("Gender Filter: " + GENDER.entryForMode(genderFilterMode).dotLabel);
                updateStatusDots();
            }
        ));
        row4.appendChild(createToggleDot("status-dot-csv-state", function() { return stateFilterCsvEnabled; }, stateFilterCsvEnabled ? "📝" : "📄", "CSV Filter", function() {
            if (!stateFilterCsvEnabled) {
                if (!stateFilterCsvText) {
                    // First-ever enable: prompt for the list
                    const ans = unsafeWindow.prompt("CSV regions to skip (comma-separated, e.g. Kerala, Tamil Nadu, Karnataka).\n\nOptional: append country ISO to disambiguate (e.g. 'New York, US').", "");
                    if (ans === null) return;
                    stateFilterCsvText = ans;
                }
                hydrateCsvTokens();
                if (stateFilterCsvTokens.size === 0) {
                    try { showToast("CSV Filter: no valid tokens (3+ chars) - left OFF"); } catch (_) {}
                    stateFilterCsvEnabled = false;
                } else {
                    stateFilterCsvEnabled = true;
                    try { showToast("CSV Filter ON: " + stateFilterCsvTokens.size + " tokens"); } catch (_) {}
                }
            } else {
                stateFilterCsvEnabled = false;
                try { showToast("CSV Filter OFF"); } catch (_) {}
            }
            try { if (typeof saveCoreSettings === "function") saveCoreSettings(); } catch (_) {}
            try { if (typeof updateStatusDots === "function") updateStatusDots(); } catch (_) {}
        }));
        mainHeaderContainer.appendChild(row4);

        // ROW 5: Ghost | IP Grabber | Eye (Menu)
        const row5 = document.createElement("div"); Object.assign(row5.style, rowStyle);
        row5.appendChild(createToggleDot("status-dot-ghost", () => isWindowTransparent, "👻", "Ghost Mode", () => {
            toggleGhostMode(win);
        }, "14px", true));

        row5.appendChild(createToggleDot("status-dot-ipgrab", () => isIPGrabbingEnabled, "📡", "IP Grabber", () => {
            isIPGrabbingEnabled = !isIPGrabbingEnabled; 
            GM_setValue('ome_ip_grabbing', isIPGrabbingEnabled);
            if (isIPGrabbingEnabled) {
                 createAdvancedSettingsWindow("adv-toggle-ip-grab");
            } else {
                if(ipBlockingEnabled || countryBlockingEnabled || isThumbnailCaptureEnabled) {
                    ipBlockingEnabled = false; 
                    countryBlockingEnabled = false; 
                    isThumbnailCaptureEnabled = false;
                    GM_setValue('ome_thumb_capture', false);
                    showToast("Blockers & History Disabled (Requires Grabber)");
                    updateStatusDots(); 
                    updateAdvToggleVisual("adv-toggle-thumbs", false);
                    updateAdvToggleVisual("adv-toggle-ip-block", false);
                    updateAdvToggleVisual("adv-toggle-country-block", false);
                }
            }
        }));

        const wmWrapper = document.createElement("div");
        wmWrapper.className = "ome-btn-wrapper";
        const wmInner = document.createElement("div");
        wmInner.style.cssText = "position:absolute; top:0; right:0; width:32px; height:32px; display:flex; alignItems:center; justify-content:center; pointerEvents:auto;";
        const wmBtn = document.createElement("div"); wmBtn.id = "watermark-toggle-btn"; wmBtn.className = "icon-btn ome-no-select";
        Object.assign(wmBtn.style, { width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #888", backgroundColor: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" });

        const menu = document.createElement("div"); menu.id = "ome-menu-dropdown";
        Object.assign(menu.style, { display: "none", position: "absolute", top: "40px", right: "0", backgroundColor: "rgba(0,0,0,0.95)", border: "1px solid #555", borderRadius: "6px", width: "160px", zIndex: "999999", padding: "4px" });
        const createMenuItem = (txt, color, action) => {
            const item = document.createElement("div"); item.innerText = txt;
            Object.assign(item.style, { padding: "8px", color: color, cursor: "pointer", fontSize: "11px", borderBottom: "1px solid #333" });
            item.onclick = (e) => { e.stopPropagation(); menu.style.display = "none"; action(); };
            return item;
        };
        menu.appendChild(createMenuItem("1. Toggle Dark/Hide", "#FF4444", () => toggleWatermarks()));
        menu.appendChild(createMenuItem("2. Select to Hide", "#FFFFFF", () => startSelector('hide')));
        menu.appendChild(createMenuItem("3. Select to Unhide", "#00FF00", () => startSelector('unhide')));
        menu.appendChild(createMenuItem("4. Unhide ALL Elements", "#FFA500", () => unhideAllElements()));

        wmBtn.onmousedown = () => wmBtn.style.transform = "scale(0.95)"; wmBtn.onmouseup = () => wmBtn.style.transform = "scale(1)";
        const wmSpan = document.createElement("span"); wmSpan.innerText = "👁️"; wmSpan.className = "ome-icon-span"; wmBtn.appendChild(wmSpan);
        wmBtn.onclick = (e) => { e.stopPropagation(); menu.style.display = (menu.style.display === "block") ? "none" : "block"; };
        let menuTimer = null;
        wmInner.onmouseleave = () => { menuTimer = setTimeout(() => { menu.style.display = "none"; }, 500); };
        wmInner.onmouseenter = () => { if(menuTimer) clearTimeout(menuTimer); };

        wmInner.appendChild(wmBtn); wmInner.appendChild(menu);
        wmWrapper.appendChild(wmInner);
        row5.appendChild(wmWrapper);

        mainHeaderContainer.appendChild(row5);

        // --- FOOTER: JRNL, CMD ---
        const footerRow = document.createElement("div");
        Object.assign(footerRow.style, { display: "flex", justifyContent: "flex-end", pointerEvents: "auto", marginTop: "4px" });

        const jrnlBtn = document.createElement("div"); jrnlBtn.id = "jrnl-btn"; jrnlBtn.className = "clickable-badge ome-no-select"; jrnlBtn.innerText = "Jornal";
        Object.assign(jrnlBtn.style, { fontSize: "13px", padding: "6px 12px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", border: "1px solid #FFD700", backgroundColor: "rgba(255, 215, 0, 0.2)", color: "#FFD700", textAlign: "center", minWidth: "50px", marginRight: "6px" });
        jrnlBtn.onclick = (e) => { e.stopPropagation(); createNotesListWindow(); };
        footerRow.appendChild(jrnlBtn);

        const cmdBtn = document.createElement("div"); cmdBtn.id = "cmd-btn"; cmdBtn.className = "clickable-badge ome-no-select"; cmdBtn.innerText = "CMD";
        Object.assign(cmdBtn.style, { fontSize: "13px", padding: "6px 12px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", border: "1px solid #00FF00", backgroundColor: "rgba(0, 100, 0, 0.2)", color: "#00FF00", textAlign: "center", minWidth: "50px" });
        cmdBtn.onclick = (e) => { e.stopPropagation(); toggleDevConsole(); };
        footerRow.appendChild(cmdBtn);
        mainHeaderContainer.appendChild(footerRow);

        win.appendChild(mainHeaderContainer);

        // Content
        const content = document.createElement("div"); content.id = "ip-stats-area"; content.className = "ome-no-select";
        content.style.padding = "10px 15px"; content.style.flex = "1"; content.style.overflow = "hidden"; content.style.marginTop = "5px";
        content.innerHTML = "<span style='color:#ccc;'>⏳ Waiting...</span>";
        win.appendChild(content);

        // Controls Area (Edit, Map, Settings, Volume)
        const controls = document.createElement("div"); controls.id = "ip-controls-area";
        Object.assign(controls.style, { padding: "10px", borderTop: "1px solid #333", backgroundColor: "rgba(30,30,30,0.5)", display: "flex", flexDirection: "column", gap: "8px" });

        const row = document.createElement("div"); row.style.display = "flex"; row.style.gap = "8px";
        const createCtrlBtn = (id, txt, bg, border, action) => {
            const b = document.createElement("button"); b.id = id; b.innerText = txt; b.className = "ome-no-select";
            Object.assign(b.style, { flex: "1", padding: "8px", backgroundColor: bg, color: "#FFFFFF", border: border, borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", backdropFilter: "blur(5px)" });
            b.onclick = action; return b;
        };

        // [CHANGED] Capture the Note button and hide it by default
        const noteBtn = createCtrlBtn("ip-btn-edit", "✏️ Note", "rgba(255, 215, 0, 0.3)", "1px solid rgba(218, 165, 32, 0.8)", () => { if (currentIP) openNoteEditor(currentIP); });
        noteBtn.style.display = "none"; // Hide initially
        row.appendChild(noteBtn);

        const mapBtn = createCtrlBtn("ome-map-btn-ctrl", "🗺️ MAP", "#2196F3", "1px solid #64B5F6", (e) => { e.stopPropagation(); createMapWindow(); }); mapBtn.style.backgroundColor = "#6495ED"; mapBtn.style.display = "none";
        row.appendChild(mapBtn);
        row.appendChild(createCtrlBtn("ip-btn-settings", "⚙️ Settings", "rgba(0, 0, 0, 0.5)", "1px solid rgba(80, 80, 80, 0.8)", toggleSettingsWindow));
        controls.appendChild(row);

        const volContainer = document.createElement("div"); volContainer.style.display = "flex"; volContainer.style.alignItems = "center"; volContainer.style.gap = "5px"; volContainer.style.marginTop = "2px";
        const volLabel = document.createElement("span"); volLabel.innerText = "🔊"; volLabel.style.fontSize = "12px";
        const volSlider = document.createElement("input"); volSlider.type = "range"; volSlider.min = "0"; volSlider.max = "1"; volSlider.step = "0.01"; volSlider.value = "1.0"; volSlider.className = "ome-vol-slider";
        volSlider.oninput = (e) => { e.stopPropagation(); updateVolume(parseFloat(e.target.value)); };
        volContainer.appendChild(volLabel); volContainer.appendChild(volSlider);
        controls.appendChild(volContainer);

        const fr = document.createElement("div"); Object.assign(fr.style, { display: "flex", gap: "8px", marginTop: "4px" });
        const blockBtn = document.createElement("button"); blockBtn.id = "btn-block-skip"; blockBtn.className = "ome-no-select"; blockBtn.innerHTML = "🚫 BLOCK IP"; blockBtn.style.display = "none";
        Object.assign(blockBtn.style, { flex: "1", padding: "10px", backgroundColor: "rgba(139, 0, 0, 0.3)", color: "#fff", border: "1px solid rgba(255, 68, 68, 0.8)", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" });
        blockBtn.onclick = () => { if (isRelayIP || !currentIP) return; loadData().blockedIPs.add(currentIP); queueSave(); performSmartSkip("Manual Block"); blockBtn.innerText = "BLOCKED!"; setTimeout(() => { blockBtn.innerHTML = "🚫 BLOCK IP"; }, 1000); };
        const nextBtn = document.createElement("button"); nextBtn.id = "ome-next-btn-footer"; nextBtn.innerText = "SKIP ⏭"; nextBtn.className = "ome-next-btn ome-no-select";
        Object.assign(nextBtn.style, { flex: "1", padding: "10px", backgroundColor: "#00AA00", color: "#FFF", border: "1px solid #00FF00", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" });
        nextBtn.onclick = (e) => { e.stopPropagation(); performSmartSkip("Manual Next"); };
        fr.appendChild(blockBtn); fr.appendChild(nextBtn);
        controls.appendChild(fr);

        win.appendChild(controls);
        document.body.appendChild(win);
        makeDraggable(win, win); makeResizable(win); updateStatusDots();
        if (areWatermarksHidden) document.body.classList.add('ome-hide-watermarks');
        sandboxWindowEvents(win);
    }

    function toggleGhostMode(win) {
        // Toggle the state
        isWindowTransparent = !isWindowTransparent;

        // [FIX] Save state to storage
        GM_setValue('ome_ghost_mode', isWindowTransparent);

        // Selectors
        const ghostBtn = document.getElementById("status-dot-ghost"); // [UPDATED] Selector for new dot button
        const copyBtns = document.querySelectorAll(".ip-copy-btn");
        const nextBtn = document.querySelector(".ome-next-btn");
        const mapBtn = document.getElementById("ome-map-btn-ctrl");
        const statsArea = document.getElementById("ip-stats-area");
        const wmBtn = document.getElementById("watermark-toggle-btn");
        const volSlider = document.querySelector(".ome-vol-slider");
        const volIcon = volSlider ? volSlider.previousElementSibling : null;

        const dimmedElements = document.querySelectorAll(
            ".clickable-badge, #ip-btn-edit, #ip-btn-settings, #btn-block-skip, #cmd-btn, #jrnl-btn"
        );
        const circleToggles = document.querySelectorAll(".status-toggle-btn");

        // Toggle Ghost Dance (Animation on the button icon)
        if (ghostBtn) {
            const ghostSpan = ghostBtn.querySelector('.ome-icon-span');
            if (ghostSpan) {
                if (isWindowTransparent) ghostSpan.classList.add('ome-anim-jiggle');
                else ghostSpan.classList.remove('ome-anim-jiggle');
            }
        }

        if (isWindowTransparent) {
            // --- GHOST MODE ACTIVE ---
            win.style.setProperty("background-color", "rgba(0,0,0,0.15)", "important");
            win.style.backdropFilter = "none";
            win.style.boxShadow = "none";

            const controlsArea = document.getElementById("ip-controls-area");
            if (controlsArea) controlsArea.style.backgroundColor = "transparent";

            // Dim Utility Buttons
            if (wmBtn) {
                wmBtn.style.opacity = "0.3";
                wmBtn.style.boxShadow = "none";
                // [FIX] Changed from Red (#FF0000) to White (#FFFFFF)
                wmBtn.style.borderColor = isDarkModeActive ? "#FFFFFF" : "transparent";
            }
            if (volSlider) volSlider.style.opacity = "0.3";
            if (volIcon) volIcon.style.opacity = "0.3";
            if (mapBtn) { mapBtn.style.opacity = "0.3"; mapBtn.style.boxShadow = "none"; }

            dimmedElements.forEach(el => {
                el.style.opacity = "0.3";
                el.style.filter = "grayscale(80%)";
                el.style.boxShadow = "none";
            });

            circleToggles.forEach(el => {
                // Skip the Ghost button itself so it stays visible
                if (el !== ghostBtn) {
                    el.style.opacity = "0.4";
                    el.style.backgroundColor = "transparent";
                    el.style.filter = "none";
                }
            });

            if (ghostBtn) {
                // Ghost button highlights when active
                ghostBtn.style.backgroundColor = "rgba(255,255,255,0.2)";
                ghostBtn.style.borderColor = "#FFFFFF";
                ghostBtn.style.boxShadow = "0 0 15px #FFFFFF, 0 0 5px #FFFFFF";
                ghostBtn.style.opacity = "1";
            }

            copyBtns.forEach(btn => {
                btn.style.background = "transparent";
                btn.style.border = "1px solid rgba(255,255,255,0.2)";
                btn.style.color = "rgba(255,255,255,0.5)";
            });

            if (nextBtn) {
                nextBtn.style.backgroundColor = "rgba(0, 170, 0, 0.2)";
                nextBtn.style.border = "1px solid rgba(0, 255, 0, 0.2)";
                nextBtn.style.color = "rgba(255,255,255,0.5)";
                nextBtn.style.boxShadow = "none";
            }

            if (statsArea) {
                statsArea.style.opacity = "1";
                statsArea.style.filter = "none";
                statsArea.querySelectorAll('*').forEach(el => {
                    el.style.textShadow = "1px 1px 2px #000, -1px -1px 2px #000";
                });
                statsArea.querySelectorAll('.ome-text-outline').forEach(el => {
                    el.classList.remove('ome-text-outline');
                    el.classList.add('ome-text-outline-thick');
                });
            }

        } else {
            // --- NORMAL MODE ---
            win.style.backgroundColor = "rgba(0,0,0,0.85)";
            win.style.backdropFilter = "blur(5px)";
            win.style.boxShadow = "0 4px 15px rgba(0,0,0,0.9)";

            const controlsArea = document.getElementById("ip-controls-area");
            if (controlsArea) controlsArea.style.backgroundColor = "rgba(30,30,30,0.5)";

            dimmedElements.forEach(el => {
                el.style.opacity = "1";
                el.style.filter = "none";
            });

            circleToggles.forEach(el => {
                el.style.opacity = "1";
                el.style.backgroundColor = "rgba(0,0,0,0.5)";
                el.style.filter = "none";
            });

            updateStatusDots(); // Refreshes the specific colors of the toggle buttons

            if (wmBtn) {
                // [FIX] Ensure Normal Mode opacity is 1 (or 0.7 if you prefer slightly dim)
                wmBtn.style.opacity = "1";
                if (isDarkModeActive) {
                     // [FIX] Changed from Red (#FF0000) to White (#FFFFFF)
                     wmBtn.style.borderColor = "#FFFFFF";
                     wmBtn.style.boxShadow = "0 0 10px rgba(255,255,255,0.8)";
                } else {
                     wmBtn.style.borderColor = "#888";
                     wmBtn.style.boxShadow = "0 0 3px #888";
                }
            }
            if (volSlider) volSlider.style.opacity = "1";
            if (volIcon) volIcon.style.opacity = "1";
            if (mapBtn) { mapBtn.style.opacity = "1"; mapBtn.style.boxShadow = "none"; }

            // Ghost button returns to normal state
            if (ghostBtn) {
                ghostBtn.style.backgroundColor = "rgba(0,0,0,0.5)";
                ghostBtn.style.borderColor = "#888";
                ghostBtn.style.boxShadow = "0 0 3px #888";
            }

            copyBtns.forEach(btn => {
                btn.style.background = "#000";
                btn.style.border = "1px solid #777";
                btn.style.color = "#eee";
            });

            if (nextBtn) {
                nextBtn.style.backgroundColor = "#00AA00";
                nextBtn.style.border = "1px solid #00FF00";
                nextBtn.style.color = "#FFF";
                nextBtn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.5)";
            }

            if (statsArea) {
                statsArea.querySelectorAll('.ome-text-outline-thick').forEach(el => {
                    el.classList.remove('ome-text-outline-thick');
                    el.classList.add('ome-text-outline');
                });
            }
        }
    }

    function updateMasterToggles() {
        // 1. Update Simple Settings Window
        updateSettingSwitch("setting-toggle-ip", ipBlockingEnabled, "🛡️ IP Blocking");
        updateSettingSwitch("setting-toggle-country", countryBlockingEnabled, "🌍 Country Blocking");

        // 2. Update Block Button Visibility
        const blockBtn = document.getElementById("btn-block-skip");
        if (blockBtn) {
            if (!ipBlockingEnabled || !currentIP || isRelayIP) blockBtn.style.display = 'none';
            else blockBtn.style.display = 'block';
        }

        // 3. Update Tabs if Settings Window is open
        const settingsWin = document.getElementById("ome-settings-window");
        if (settingsWin && settingsWin.style.display === "flex") {
            switchTab(lastActiveTab);
        }

        // 4. Update Status Dots (The new circles)
        updateStatusDots();
    }

    function updateSettingSwitch(id, isEnabled, labelText) {
        const btn = document.getElementById(id);
        if (!btn) return;
        const bgColor = isEnabled ? "#00E000" : "#FF0000"; // Red when OFF
        const trackColor = isEnabled ? "#00E000" : "#A00000"; // Dark Red Track
        const switchPos = isEnabled ? "26px" : "2px";
        const switchText = isEnabled ? "ON" : "OFF";

        btn.style.backgroundColor = isEnabled ? "rgba(0, 100, 0, 0.3)" : "rgba(100, 0, 0, 0.3)";
        btn.style.border = `1px solid ${bgColor}`;
        btn.innerHTML = `<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;"><span style="color: white; font-weight: bold; font-size: 14px;">${labelText}</span><div class="ome-toggle-track" style="background-color: ${trackColor};"><div class="ome-toggle-knob" style="transform: translateX(${switchPos});">${switchText}</div></div></div>`;
    }

    // --- MAP WINDOW ---
    function createMapWindow() {
        if (!currentApiData || !currentApiData.latitude || !currentApiData.longitude) {
            showToast("No Location Data Available");
            return;
        }

        let win = document.getElementById("ome-map-window");
        if (win) {
            if (win.style.display === "flex") {
                win.style.display = "none";
                const container = win.querySelector("#ome-map-container");
                if(container) container.innerHTML = "";
                // Reset State on Close
                isStreetViewActive = false;
            } else {
                win.style.display = "flex";
                isStreetViewActive = false; // Reset to map on re-open
                updateMapContent(win, currentApiData);
            }
            return;
        }

        win = document.createElement("div");
        win.id = "ome-map-window";
        win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            position: "fixed", top: "150px", left: "500px", width: "500px", height: "450px",
            backgroundColor: "rgba(17, 17, 17, 0.95)", backdropFilter: "blur(10px)", color: "#FFF",
            zIndex: "99999980",
            borderRadius: "10px", border: "1px solid #444",
            display: "flex", flexDirection: "column", boxShadow: "0 10px 50px rgba(0,0,0,1)"
        });

        const header = document.createElement("div");
        Object.assign(header.style, { padding: "8px", backgroundColor: "rgba(34, 34, 34, 0.8)", borderBottom: "1px solid #444", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "default" });
        header.innerHTML = "<span style='font-weight:bold; font-size:14px;'>🗺️ Partner Location</span>";

        const closeBtn = document.createElement("button"); closeBtn.innerText = "✖";
        // [FIX] Increased padding
        Object.assign(closeBtn.style, { background: "none", border: "none", color: "white", fontSize: "16px", cursor: "pointer", padding: "0 10px" });
        closeBtn.onclick = () => {
            win.style.display = "none";
            const container = win.querySelector("#ome-map-container");
            if(container) container.innerHTML = "";
            isStreetViewActive = false; // Reset lock
        };
        header.appendChild(closeBtn);
        win.appendChild(header);

        const mapContainer = document.createElement("div");
        mapContainer.id = "ome-map-container";
        Object.assign(mapContainer.style, { flex: "1", position: "relative", backgroundColor: "#000" });
        win.appendChild(mapContainer);

        document.body.appendChild(win);
        makeDraggable(header, win);

        updateMapContent(win, currentApiData);
    }

    function updateMapContent(win, data) {
        const container = win.querySelector("#ome-map-container");
        if(!container) return;

        // Cleanup Footer
        const existingBtnContainer = win.querySelector("#ome-map-btn-wrapper");
        if (existingBtnContainer) existingBtnContainer.remove();

        container.innerHTML = "";
        const lat = data.latitude;
        const lon = data.longitude;

        if (isStreetViewActive) {
            // --- STREET VIEW MODE ---
            const iframe = document.createElement("iframe");
            iframe.width = "100%";
            iframe.height = "100%";
            iframe.style.border = "0";
            iframe.loading = "lazy";
            // FIXED: Added '$' before {lat}
            iframe.src = `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lon}&cbp=11,0,0,0,0&output=svembed`;
            iframe.style.pointerEvents = "auto";
            container.appendChild(iframe);

            const closeSVBtn = document.createElement("button");
            closeSVBtn.innerText = "✖";
            Object.assign(closeSVBtn.style, {
                position: "absolute", top: "10px", right: "10px",
                backgroundColor: "rgba(0,0,0,0.7)", color: "#fff", border: "1px solid #fff",
                borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer",
                fontWeight: "bold", zIndex: "10", fontSize: "14px"
            });
            closeSVBtn.onclick = () => {
                isStreetViewActive = false;
                updateMapContent(win, data);
            };
            container.appendChild(closeSVBtn);

        } else {
            // --- STANDARD MAP MODE ---
            const iframe = document.createElement("iframe");
            iframe.width = "100%";
            iframe.height = "100%";
            iframe.style.border = "0";
            iframe.loading = "lazy";
            // FIXED: Added '$' before {lat}
            iframe.src = `https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`;
            iframe.style.pointerEvents = "auto";
            container.appendChild(iframe);
        }

        // --- FOOTER BUTTON (Toggle) ---
        const btnContainer = document.createElement("div");
        btnContainer.id = "ome-map-btn-wrapper";
        Object.assign(btnContainer.style, { padding: "8px", background: "#222", textAlign: "center", borderTop: "1px solid #444" });

        const svBtn = document.createElement("button");
        if (isStreetViewActive) {
            svBtn.innerText = "🔙 Return to Map";
            Object.assign(svBtn.style, {
                display: "inline-block", padding: "6px 12px", background: "#555", color: "#fff",
                borderRadius: "4px", fontWeight: "bold", fontSize: "12px",
                border: "1px solid #777", cursor: "pointer"
            });
        } else {
            svBtn.innerText = "🚶 Open Street View";
            Object.assign(svBtn.style, {
                display: "inline-block", padding: "6px 12px", background: "#E6C200", color: "#000",
                borderRadius: "4px", fontWeight: "bold", fontSize: "12px",
                border: "1px solid #C4A600", cursor: "pointer"
            });
        }

        svBtn.onclick = () => {
            isStreetViewActive = !isStreetViewActive;
            updateMapContent(win, data);
        };

        btnContainer.appendChild(svBtn);
        container.parentElement.appendChild(btnContainer);
        makeDraggable(btnContainer, win);
    }

    // --- DEV CONSOLE ---
    function createDevWindow() {
        if (document.getElementById("dev-console-win")) return;
        const win = document.createElement("div");
        win.id = "dev-console-win"; win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            position: "fixed", top: "150px", left: "500px", width: "450px", height: "300px", backgroundColor: "#000", border: "1px solid #0f0", color: "#0f0", fontFamily: "monospace", fontSize: "11px", display: "none", flexDirection: "column",
            zIndex: "100000050"
        });

        const header = document.createElement("div");
        Object.assign(header.style, { padding: "5px", backgroundColor: "#002200", borderBottom: "1px solid #0f0", cursor: "default", display: "flex", justifyContent: "space-between", alignItems: "center" });

        const titleSection = document.createElement("div");
        titleSection.style.display = "flex"; titleSection.style.alignItems = "center"; titleSection.style.gap = "10px";
        const title = document.createElement("span"); title.innerText = "Console"; title.style.fontWeight = "bold";
        titleSection.appendChild(title);

        const btnSection = document.createElement("div");
        btnSection.style.display = "flex"; btnSection.style.gap = "5px";

        const copyLogBtn = document.createElement("button");
        copyLogBtn.innerText = "Copy Log";
        copyLogBtn.className = "copy-btn";
        Object.assign(copyLogBtn.style, { cursor: "pointer", background: "#004400", border: "1px solid #0f0", color: "#0f0", fontSize: "10px", padding: "2px 5px" });
        copyLogBtn.onclick = () => {
            const txt = devLogs.map(l => `[${l.time}] [${l.type}] ${l.msg}`).join("\n");
            navigator.clipboard.writeText(txt).then(() => showToast("Log Copied", win));
        };

        const copyErrBtn = document.createElement("button");
        copyErrBtn.innerText = "Copy Err";
        copyErrBtn.className = "copy-btn";
        Object.assign(copyErrBtn.style, { cursor: "pointer", background: "#440000", border: "1px solid #f00", color: "#f99", fontSize: "10px", padding: "2px 5px" });
        copyErrBtn.onclick = () => {
            const txt = devLogs.filter(l => l.type === 'ERR' || l.type === 'API' || l.msg.includes('Error') || l.msg.includes('Fail')).map(l => `[${l.time}] [${l.type}] ${l.msg}`).join("\n");
            if(!txt) { showToast("No Errors found", win); return; }
            navigator.clipboard.writeText(txt).then(() => showToast("Errors Copied", win));
        };

        const clearBtn = document.createElement("button");
        clearBtn.innerText = "Clear";
        clearBtn.className = "copy-btn";
        Object.assign(clearBtn.style, { cursor: "pointer", background: "#444400", border: "1px solid #ff0", color: "#ff0", fontSize: "10px", padding: "2px 5px" });
        clearBtn.onclick = () => {
            devLogs = [];
            updateDevConsole();
            showToast("Log Cleared", win);
        };

        const closeBtn = document.createElement("button");
        closeBtn.innerText = "X"; closeBtn.className = "close-btn";
        // INCREASED PADDING and FONT SIZE here
        Object.assign(closeBtn.style, { cursor: "pointer", background: "#440000", border: "1px solid #f00", color: "#fff", fontWeight: "bold", marginLeft: "5px", padding: "2px 15px", fontSize: "12px" });
        closeBtn.onclick = toggleDevConsole;

        btnSection.appendChild(copyLogBtn);
        btnSection.appendChild(copyErrBtn);
        btnSection.appendChild(clearBtn);
        btnSection.appendChild(closeBtn);

        header.appendChild(titleSection);
        header.appendChild(btnSection);
        win.appendChild(header);

        const logs = document.createElement("div"); logs.id = "dev-logs-container";
        Object.assign(logs.style, { flex: "1", overflowY: "auto", padding: "5px", whiteSpace: "pre-wrap" });
        win.appendChild(logs);

        document.body.appendChild(win);
        makeDraggable(header, win);
        makeDraggable(logs, win);
    }

    function toggleDevConsole() {
        createDevWindow();
        const win = document.getElementById("dev-console-win");
        win.style.display = win.style.display === "none" ? "flex" : "none";
        updateDevConsole();
    }

    function updateDevConsole() {
        const container = document.getElementById("dev-logs-container");
        // FIX: Double check visibility to prevent background rendering
        if (!container || container.offsetParent === null) return;

        // --- FILTER LOGIC ---
        // Only show 'RTC' (Sniffed Data) and 'IP' (The Detected Target)
        // This removes 'SYS', 'API', 'ERR', etc.
        const visibleTypes = ['IP', 'SYS', 'API', 'ERR', 'RTC', 'SKIP'];

        const filteredLogs = devLogs.filter(l => visibleTypes.includes(l.type));

        // Join and display
        container.textContent = filteredLogs.map(l => `[${l.time}] [${l.type}] ${l.msg}`).join("\n");
        container.scrollTop = container.scrollHeight;
    }

    // --- SETTINGS WINDOW ---

    function updateSettingsHeaderDisplay(container) {
        if (!myOwnIPData) {
            container.innerHTML = "<span style='font-size:12px; color:#aaa;'>Fetching own IP...</span>";
            return;
        }
        const cc = myOwnIPData.country_code ? myOwnIPData.country_code.toLowerCase() : "un";
        const region = myOwnIPData.region || myOwnIPData.country || "Unknown";

        const toggleBlur = "this.style.filter = this.style.filter === 'none' ? 'blur(5px)' : 'none'";

        container.innerHTML = `
            <div onclick="${toggleBlur}" title="Click to reveal/hide" style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:4px; border:1px solid #444; cursor:pointer; filter: blur(5px); transition: filter 0.3s;">
                <img src="https://flagcdn.com/h20/${cc}.png" style="height:14px; width:auto;">
                <span style="font-size:13px; font-weight:bold; color:#00FF00;">${myOwnIPData.ip}</span>
                <span style="font-size:12px; color:#ddd; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">(${region})</span>
            </div>
        `;
    }

    // --- SETTINGS WINDOW ---
    function createSettingsWindow() {
        if (document.getElementById("ome-settings-window")) return;
        const win = document.createElement("div"); win.id = "ome-settings-window"; win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", width: "500px", height: "650px", backgroundColor: "rgba(17, 17, 17, 0.95)", backdropFilter: "blur(10px)", color: "#FFF",
            zIndex: "99999999",
            borderRadius: "10px", border: "1px solid #444", display: "none", flexDirection: "column", boxShadow: "0 10px 50px rgba(0,0,0,1)"
        });

        const header = document.createElement("div");
        Object.assign(header.style, { padding: "10px", backgroundColor: "rgba(34, 34, 34, 0.8)", borderBottom: "1px solid #444", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "default" });

        const headerLeft = document.createElement("div");
        headerLeft.style.display = "flex"; headerLeft.style.alignItems = "center"; headerLeft.style.gap = "15px";

        const title = document.createElement("span");
        title.innerHTML = "⚙️ Settings";
        title.style.fontWeight = "bold"; title.style.fontSize = "18px";
        headerLeft.appendChild(title);

        header.appendChild(headerLeft);

        const closeBtn = document.createElement("button"); closeBtn.innerText = "✖";
        Object.assign(closeBtn.style, { background: "none", border: "none", color: "white", fontSize: "18px", cursor: "pointer", padding: "0 15px", height: "100%" });
        closeBtn.onclick = toggleSettingsWindow;
        header.appendChild(closeBtn); win.appendChild(header);

        const masterControls = document.createElement("div");
        masterControls.style.display = "flex"; masterControls.style.padding = "10px"; masterControls.style.gap = "10px"; masterControls.style.borderBottom = "1px solid #333";
        const createToggle = (id, action) => {
            const btn = document.createElement("div"); btn.id = id;
            Object.assign(btn.style, { flex: "1", padding: "8px", borderRadius: "5px", cursor: "pointer", userSelect: "none", transition: "all 0.2s" });
            btn.onclick = action; return btn;
        };
        masterControls.appendChild(createToggle("setting-toggle-country", () => {
            countryBlockingEnabled = !countryBlockingEnabled;
            // [NEW] Auto-Enable Grabber
            if (countryBlockingEnabled && !isIPGrabbingEnabled) {
                isIPGrabbingEnabled = true;
                GM_setValue('ome_ip_grabbing', true);
                showToast("IP Grabber Auto-Enabled");
            }
            updateMasterToggles(); queueSave();
        }));

        masterControls.appendChild(createToggle("setting-toggle-ip", () => {
            ipBlockingEnabled = !ipBlockingEnabled;
            // [NEW] Auto-Enable Grabber
            if (ipBlockingEnabled && !isIPGrabbingEnabled) {
                isIPGrabbingEnabled = true;
                GM_setValue('ome_ip_grabbing', true);
                showToast("IP Grabber Auto-Enabled");
            }
            updateMasterToggles(); queueSave();
        }));
        win.appendChild(masterControls);

        // [NEW] GENDER FILTER SECTION (Off / Skip Women / Skip Men + heuristic + stats)
        (function buildGenderFilterUi() {
            const wrap = document.createElement("div");
            Object.assign(wrap.style, {
                padding: "10px 12px",
                borderBottom: "1px solid #333",
                background: "rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
            });

            // Title row
            const title = document.createElement("div");
            title.innerText = "👥 Gender Filter";
            title.style.fontSize = "12px";
            title.style.color = "#fff";
            title.style.fontWeight = "bold";
            wrap.appendChild(title);

            // Filter mode dropdown
            const modeRow = document.createElement("div");
            Object.assign(modeRow.style, {
                display: "flex", alignItems: "center", gap: "8px"
            });
            const modeLabel = document.createElement("span");
            modeLabel.innerText = "Mode:";
            modeLabel.style.fontSize = "11px";
            modeLabel.style.color = "#aaa";
            modeLabel.style.minWidth = "40px";
            const modeSelect = document.createElement("select");
            modeSelect.id = "ome-gender-filter-select";   // allow status dot click to sync
            Object.assign(modeSelect.style, {
                flex: "1", padding: "4px 6px", borderRadius: "4px",
                border: "1px solid #555", background: "#111", color: "#00FF88",
                fontSize: "12px", fontFamily: "monospace"
            });
            // GENDER (defined at IIFE top) is the single source of truth for the dropdown.
            const opts = GENDER.MODES.map(mode => {
                const e = GENDER.entryForMode(mode);
                return { v: mode, t: e.dropdownLabel };
            });
            opts.forEach(o => {
                const op = document.createElement("option");
                op.value = o.v; op.textContent = o.t;
                if (o.v === genderFilterMode) op.selected = true;
                modeSelect.appendChild(op);
            });
            modeSelect.onchange = () => {
                const prev = genderFilterMode;
                genderFilterMode = modeSelect.value;
                queueSave();
                updateGenderStatsLine();
                // Only toast on actual change to avoid spam while exploring the dropdown.
                if (prev !== genderFilterMode) {
                    showToast("Gender Filter: " + GENDER.entryForMode(genderFilterMode).dotLabel);
                }
            };
            modeRow.appendChild(modeLabel);
            modeRow.appendChild(modeSelect);
            wrap.appendChild(modeRow);

            // Heuristic checkbox row
            const heurRow = document.createElement("div");
            Object.assign(heurRow.style, {
                display: "flex", alignItems: "center", gap: "8px"
            });
            const heurLabel = document.createElement("label");
            heurLabel.style.fontSize = "11px";
            heurLabel.style.color = "#aaa";
            heurLabel.style.display = "flex";
            heurLabel.style.alignItems = "center";
            heurLabel.style.gap = "6px";
            heurLabel.style.cursor = "pointer";
            const heurCb = document.createElement("input");
            heurCb.type = "checkbox";
            heurCb.checked = useNameHeuristic;
            heurCb.onchange = () => {
                useNameHeuristic = heurCb.checked;
                queueSave();
                showToast("Name heuristic: " + (useNameHeuristic ? "ON" : "OFF"));
            };
            const heurText = document.createElement("span");
            heurText.innerText = 'Use name heuristic for new IPs';
            heurText.title = 'Best-effort: parses ome.tv partner display name against ~100 Western female/male first names. Opt-in. Non-matching names are NOT cached.';
            heurLabel.appendChild(heurCb);
            heurLabel.appendChild(heurText);
            heurRow.appendChild(heurLabel);
            wrap.appendChild(heurRow);

            // Live stats line
            const statsLine = document.createElement("div");
            statsLine.style.fontSize = "11px";
            statsLine.style.color = "#888";
            statsLine.style.fontFamily = "monospace";
            statsLine.style.marginTop = "2px";
            function updateGenderStatsLine() {
                const s = getGenderStats();
                const f = s.f || 0, m = s.m || 0, u = s.u || 0;
                // Exact format requested by user: "Tagged: 7 women, 12 men, 3 unknown"
                statsLine.innerText = `Tagged: ${f} women, ${m} men, ${u} unknown`;
            }
            updateGenderStatsLine();
            // Expose updater so other UI (tag buttons / heuristic) can refresh the line
            window.__omeGenderStatsUpdate = updateGenderStatsLine;
            wrap.appendChild(statsLine);

            masterControls.appendChild(wrap);
        })();

        const tabContainer = document.createElement("div"); Object.assign(tabContainer.style, { display: "flex", position: "relative" });
        const createTab = (text, id) => {
            const tab = document.createElement("div"); tab.innerText = text; tab.dataset.target = id;
            Object.assign(tab.style, { flex: "1", padding: "10px", textAlign: "center", cursor: "pointer", border: "1px solid transparent", position: "relative" });
            tab.onclick = () => switchTab(id); return tab;
        };
        tabContainer.appendChild(createTab("Blocked Countries", "tab-countries"));
        tabContainer.appendChild(createTab("Blocked IPs", "tab-ips"));
        win.appendChild(tabContainer);

        const content = document.createElement("div"); content.id = "settings-content";
        content.className = "ome-scroll-lock";
        content.style.flex = "1"; content.style.overflowY = "auto";
        win.appendChild(content);

        // [REQ 4] Bigger Emoji Button for Advanced Settings
        const floatAdvBtn = document.createElement("div");
        floatAdvBtn.innerHTML = "🛠️";
        floatAdvBtn.title = "Advanced Settings";
        Object.assign(floatAdvBtn.style, {
            position: "absolute", bottom: "20px", right: "20px",
            // Increased Size
            width: "60px", height: "60px", borderRadius: "14px",
            backgroundColor: "rgba(50, 50, 50, 0.9)", border: "2px solid #666",
            color: "#fff", fontSize: "30px", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: "100", boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
            transition: "transform 0.1s, background-color 0.2s"
        });
        floatAdvBtn.onmouseover = () => { floatAdvBtn.style.backgroundColor = "rgba(70, 70, 70, 1)"; };
        floatAdvBtn.onmouseout = () => { floatAdvBtn.style.backgroundColor = "rgba(50, 50, 50, 0.9)"; };
        floatAdvBtn.onmousedown = () => { floatAdvBtn.style.transform = "scale(0.95)"; };
        floatAdvBtn.onmouseup = () => { floatAdvBtn.style.transform = "scale(1)"; };
        floatAdvBtn.onclick = () => createAdvancedSettingsWindow();
        win.appendChild(floatAdvBtn);

        document.body.appendChild(win);
        makeDraggable(header, win); updateMasterToggles();
        sandboxWindowEvents(win);
    }

    document.addEventListener('mousedown', (e) => {
        // 1. Regular Settings Window
        const settings = document.getElementById('ome-settings-window');
        const openBtn = document.getElementById('ip-btn-settings');
        if (settings && settings.style.display === 'flex') {
            if (!settings.contains(e.target) && e.target !== openBtn) toggleSettingsWindow();
        }

        // 2. Advanced Settings Window (Close on click outside)
        const advSettings = document.getElementById('ome-adv-settings-window');
        // We need to check if we are clicking the "Advanced Settings" button inside the normal settings window,
        // otherwise it will close immediately after opening.
        // But since that button is inside 'settings-content', we can check if the click is inside 'ome-settings-window'

        if (advSettings && advSettings.style.display === 'flex') {
            const insideAdv = advSettings.contains(e.target);
            // Check if we clicked inside the Regular Settings window (where the Open button is)
            const insideRegular = settings && settings.contains(e.target);

            // Point 9: Close if clicking outside Advanced Window AND outside Regular Settings Window
            // (Assuming you want it to stay open if you click back to the main settings, but usually 'outside' means anywhere else)
            // Let's implement strict "Clicking Main Window or Website closes it"

            if (!insideAdv && !insideRegular) {
                advSettings.style.display = "none";
            }
        }
    });

    function toggleSettingsWindow() {
        const win = document.getElementById("ome-settings-window");
        if (!win) { createSettingsWindow(); document.getElementById("ome-settings-window").style.display = "flex"; switchTab(lastActiveTab); }
        else {
            win.style.display = win.style.display === "none" ? "flex" : "none";
            if (win.style.display === "flex") { updateMasterToggles(); switchTab(lastActiveTab); }
        }
    }

    function switchTab(tabId) {
        lastActiveTab = tabId;
        const content = document.getElementById("settings-content");
        const tabs = document.querySelectorAll("#ome-settings-window > div:nth-child(3) > div");

        // Determine Border Colors
        const ipColor = ipBlockingEnabled ? '#00FF00' : '#FF0000';
        const countryColor = countryBlockingEnabled ? '#00FF00' : '#FF0000';

        // Active Color for Content Box
        let activeBorderColor = '#FF4444';
        if (tabId === 'tab-ips') activeBorderColor = ipColor;
        else if (tabId === 'tab-countries') activeBorderColor = countryColor;

        if (content) {
            // CHANGED: Reduced to 2px to be thinner
            content.style.border = `2px solid ${activeBorderColor}`;
            content.style.borderRadius = "0 0 10px 10px";
            content.style.zIndex = "5";
            content.style.position = "relative";
            content.style.marginTop = "0px";
        }

        tabs.forEach(t => {
            const isActive = t.dataset.target === tabId;
            const isIpTab = t.dataset.target === 'tab-ips';

            const myStateColor = isIpTab ? ipColor : countryColor;
            const myDullColor = isIpTab ? (ipBlockingEnabled ? "#006600" : "#660000") : (countryBlockingEnabled ? "#006600" : "#660000");

            if (isActive) {
                // Active: Overlap the content border
                Object.assign(t.style, {
                    backgroundColor: "rgba(17, 17, 17, 0.95)",
                    color: "#fff",
                    fontWeight: "bold",
                    // CHANGED: Reduced to 2px
                    borderTop: `2px solid ${myStateColor}`,
                    borderLeft: `2px solid ${myStateColor}`,
                    borderRight: `2px solid ${myStateColor}`,
                    borderBottom: "none", // Open bottom
                    zIndex: "10",
                    // CHANGED: Adjusted margin to -2px to match new border thickness
                    marginBottom: "-2px",
                    paddingBottom: "12px",
                    borderRadius: "10px 10px 0 0",
                    position: "relative"
                });
            } else {
                // Inactive
                Object.assign(t.style, {
                    backgroundColor: "transparent",
                    color: "#888",
                    fontWeight: "normal",
                    borderTop: `2px solid ${myDullColor}`,
                    borderLeft: `2px solid ${myDullColor}`,
                    borderRight: `2px solid ${myDullColor}`,
                    // CHANGED: Match the 2px content border
                    borderBottom: `2px solid ${activeBorderColor}`,
                    zIndex: "1",
                    marginBottom: "0px",
                    paddingBottom: "10px",
                    borderRadius: "10px 10px 0 0",
                    position: "relative"
                });
            }
        });

        if (tabId === "tab-ips") renderBlockedIPs();
        if (tabId === "tab-countries") renderBlockedCountries();
    }

    // Replace your existing createCountryControlRow function with this:
    function createCountryControlRow(container, list) {
        const row = document.createElement("div");
        Object.assign(row.style, {
            display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center",
            padding: "0 5px", position: "relative", height: "36px"
        });

        // 1. SELECT ALL BUTTON
        const selectAllBtn = document.createElement("button");
        // [REQ 8] Space after emoji
        selectAllBtn.innerText = "☑  ALL";
        selectAllBtn.title = "Select / Deselect All";
        Object.assign(selectAllBtn.style, {
            // [REQ 8] Grey checkbox style
            width: "70px", padding: "8px", backgroundColor: "#444", color: "#eee",
            border: "1px solid #666", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", textAlign: "center"
        });

        selectAllBtn.onclick = () => {
            const { blockedCountries } = loadData();
            if (list) {
                const allCodes = list.map(c => c.code);
                const allSel = allCodes.every(c => blockedCountries.has(c));
                allCodes.forEach(c => allSel ? blockedCountries.delete(c) : blockedCountries.add(c));
                queueSave();
                renderBlockedCountries();
            }
        };

        // 2. DEFAULT BUTTON (WITH CONFIRMATION)
        const defaultBtn = document.createElement("button");
        defaultBtn.innerText = "↺ Defaults";
        Object.assign(defaultBtn.style, {
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            width: "140px", padding: "8px", backgroundColor: "#0056b3", color: "white",
            border: "1px solid #004494", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px"
        });

        defaultBtn.onclick = () => {
            if (confirm("Reset Country Blocks to Defaults?")) {
                if (typeof blockedCountriesCache !== 'undefined') {
                    blockedCountriesCache = new Set(DEFAULT_BLOCKED_COUNTRIES);
                    queueSave();
                    renderBlockedCountries();
                    showToast("Countries reset to Default");
                } else {
                    loadData();
                    blockedCountriesCache = new Set(DEFAULT_BLOCKED_COUNTRIES);
                    queueSave();
                    renderBlockedCountries();
                }
            }
        };

        row.appendChild(selectAllBtn);
        row.appendChild(defaultBtn);
        container.appendChild(row);
    }

    function renderBlockedCountries() {
        const container = document.getElementById("settings-content"); container.innerHTML = ""; Object.assign(container.style, { padding: "10px" });
        const controlRow = document.createElement("div");
        Object.assign(controlRow.style, { display: "flex", gap: "10px", marginBottom: "15px" });

        const createSortBtn = (label, sortType, activeEmoji) => {
            const isActive = currentCountrySort === sortType;
            const btnText = isActive ? `${activeEmoji} ${label}` : label;

            const btn = document.createElement("button"); btn.innerText = btnText;

            Object.assign(btn.style, {
                flex: 1, padding: "8px", cursor: "pointer",
                border: "1px solid #444",
                backgroundColor: isActive ? "#FFC107" : "rgba(51, 51, 51, 0.5)",
                color: isActive ? "#000" : "#ccc",
                transition: "all 0.2s"
            });

            if (isActive) {
                btn.style.fontWeight = "normal";
                // CHANGED: Removed the outline class and explicitly cleared text-shadows
                btn.classList.remove("ome-text-outline");
                btn.style.textShadow = "none";

                btn.style.boxShadow = "0 0 8px rgba(255, 193, 7, 0.5)";
                btn.style.border = "1px solid #FFD54F";
            }
            btn.onclick = () => { currentCountrySort = sortType; renderBlockedCountries(); };
            return btn;
        };

        controlRow.appendChild(createSortBtn("Continent", "continents", "🌍"));
        controlRow.appendChild(createSortBtn("Name A-Z", "az", "🔤"));
        controlRow.appendChild(createSortBtn("Language", "lang", "🗣️"));
        container.appendChild(controlRow);

        const contentDiv = document.createElement("div"); container.appendChild(contentDiv);
        if (currentCountrySort === 'continents') renderContinentsList(contentDiv);
        else renderFlatCountryList(contentDiv);
    }

    function renderContinentsList(container) {
        createCountryControlRow(container, COUNTRIES_DATA);

        const { blockedCountries } = loadData();
        ['AF', 'AS', 'EU', 'NA', 'OC', 'SA'].forEach(contCode => {
            const block = document.createElement("div");
            const header = document.createElement("div");
            Object.assign(header.style, { display: "flex", alignItems: "center", padding: "12px", cursor: "pointer", backgroundColor: "rgba(26, 26, 26, 0.5)", border: "1px solid #333", marginBottom: "2px" });

            const countries = COUNTRIES_DATA.filter(c => c.cont === contCode).sort((a,b)=>a.name.localeCompare(b.name));
            const blocked = countries.filter(c => blockedCountries.has(c.code));
            const isFull = blocked.length === countries.length && countries.length > 0;
            const isPartial = blocked.length > 0 && blocked.length < countries.length;

            const check = document.createElement("input"); check.type = "checkbox"; check.checked = isFull; check.style.marginRight = "10px";
            check.indeterminate = isPartial;
            check.onclick = (e) => { e.stopPropagation(); const target = !isFull; countries.forEach(c => target ? blockedCountries.add(c.code) : blockedCountries.delete(c.code)); queueSave(); renderBlockedCountries(); };

            const title = document.createElement("span"); title.innerText = CONTINENT_NAMES[contCode]; title.style.flex = "1";
            const arrow = document.createElement("span"); arrow.innerText = expandedContinents.has(contCode) ? "▲" : "▼";

            header.appendChild(check); header.appendChild(title); header.appendChild(arrow);
            header.onclick = () => { if (expandedContinents.has(contCode)) expandedContinents.delete(contCode); else expandedContinents.add(contCode); renderBlockedCountries(); };
            block.appendChild(header);

            if (expandedContinents.has(contCode)) {
                countries.forEach(c => {
                    const r = document.createElement("div");
                    const isB = blockedCountries.has(c.code);
                    Object.assign(r.style, { display: "flex", padding: "5px 5px 5px 25px", borderBottom: "1px solid #222", cursor: "pointer", backgroundColor: isB ? "rgba(42, 21, 21, 0.5)" : "transparent", alignItems: "center" });

                    const cb = document.createElement("input"); cb.type="checkbox"; cb.checked=isB; cb.style.marginRight="10px";

                    const nm = document.createElement("span");
                    nm.innerText = c.name;
                    if(isB) nm.style.color="#ff6666";

                    const fl = document.createElement("img"); fl.src = `https://flagcdn.com/h20/${c.code}.png`; fl.style.marginRight = "8px"; fl.style.width = "20px"; // Margin Right now

                    const blockedIcon = document.createElement("span");
                    blockedIcon.innerText = isB ? " 🚫" : "";
                    blockedIcon.style.marginLeft = "6px";

                    const tog = () => { if(blockedCountries.has(c.code)) blockedCountries.delete(c.code); else blockedCountries.add(c.code); queueSave(); renderBlockedCountries(); };
                    cb.onclick=(e)=>{e.stopPropagation(); tog();}; r.onclick=tog;

                    // FIXED ORDER: Checkbox -> Flag -> Name -> Block Icon
                    r.appendChild(cb);
                    r.appendChild(fl); // Flag first
                    r.appendChild(nm); // Name second
                    r.appendChild(blockedIcon);

                    block.appendChild(r);
                });
            }
            container.appendChild(block);
        });
    }

    function renderFlatCountryList(container) {
        let displayList = [...COUNTRIES_DATA];
        if (currentCountrySort === "az") {
            displayList.sort((a, b) => a.name.localeCompare(b.name));
        } else if (currentCountrySort === "lang") {
            displayList.sort((a, b) => {
                const langA = LANG_MAP[a.code] || "Other";
                const langB = LANG_MAP[b.code] || "Other";
                const idxA = LANG_PRIORITY.indexOf(langA);
                const idxB = LANG_PRIORITY.indexOf(langB);
                if (idxA !== -1 && idxB !== -1) { if (idxA !== idxB) return idxA - idxB; return a.name.localeCompare(b.name); }
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                if (langA !== langB) return langA.localeCompare(langB);
                return a.name.localeCompare(b.name);
            });
        }

        createCountryControlRow(container, displayList);
        const { blockedCountries } = loadData();
        displayList.forEach(country => {
            const row = document.createElement("div");
            Object.assign(row.style, { display: "flex", alignItems: "center", padding: "6px", borderBottom: "1px solid #222", cursor: "pointer" });
            const isBlocked = blockedCountries.has(country.code);
            if (isBlocked) row.style.backgroundColor = "rgba(42, 21, 21, 0.5)";

            const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = isBlocked; checkbox.style.marginRight = "10px";
            const toggle = () => { if (blockedCountries.has(country.code)) blockedCountries.delete(country.code); else blockedCountries.add(country.code); queueSave(); renderBlockedCountries(); };
            checkbox.onclick = (e) => { e.stopPropagation(); toggle(); }; row.onclick = toggle;

            const flag = document.createElement("img"); flag.src = `https://flagcdn.com/h20/${country.code}.png`; flag.style.marginLeft = "8px"; flag.style.width = "20px"; flag.style.marginRight = "8px";

            // CHANGED: Added emoji logic here
            const name = document.createElement("span");
            name.innerText = country.name + (isBlocked ? " 🚫" : "");
            if(isBlocked) name.style.color = "#ff6666";

            row.appendChild(checkbox);
            if (currentCountrySort === "lang") {
                const langSpan = document.createElement("span");
                langSpan.innerText = `[${LANG_MAP[country.code] || "Other"}]`;
                langSpan.style.color = "#aaa"; langSpan.style.fontSize = "12px"; langSpan.style.marginRight = "8px";
                row.appendChild(langSpan);
            }
            row.appendChild(flag);
            row.appendChild(name);
            container.appendChild(row);
        });
    }

    function renderBlockedIPs() {
        const container = document.getElementById("settings-content");
        container.innerHTML = "";
        Object.assign(container.style, { padding: "10px", position: "relative", minHeight: "300px" });

        const bgInfo = document.createElement("div");
        Object.assign(bgInfo.style, {
            position: "absolute", top: "50%", transform: "translateY(-50%)", left: "0", width: "100%",
            textAlign: "center", zIndex: "0", pointerEvents: "none",
            color: "rgba(255, 255, 255, 0.08)", fontSize: "14px", fontWeight: "bold", lineHeight: "1.6",
            fontFamily: "monospace", textTransform: "uppercase"
        });
        bgInfo.innerHTML = `<div style="display: inline-block; text-align: left;"><div>Support: github.com/EolnMsuk</div><div>Discord: discord.gg/omeglestream</div><div>Donate: $eolnmsuk</div></div>`;
        container.appendChild(bgInfo);

        const btnRow = document.createElement("div");
        Object.assign(btnRow.style, { display: "flex", gap: "10px", marginBottom: "15px", position: "relative", zIndex: "10" });

        const clearBtn = document.createElement("button"); clearBtn.innerText = "🗑️ Clear All Blocked IPs";
        Object.assign(clearBtn.style, { flex: "1", padding: "8px", backgroundColor: "#cc7000", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" });
        clearBtn.onclick = () => { if(confirm("Clear IPs?")) { loadData().blockedIPs.clear(); queueSave(); renderBlockedIPs(); } };

        btnRow.appendChild(clearBtn);
        container.appendChild(btnRow);

        const list = document.createElement("div");
        Object.assign(list.style, { position: "relative", zIndex: "5", display: "flex", flexDirection: "column", gap: "5px" });

        const { blockedIPs, history } = loadData();

        if (blockedIPs.size === 0) list.innerHTML = "<div style='color:#666; text-align:center;'>No IPs blocked yet.</div>";
        else {
            Array.from(blockedIPs).reverse().forEach(ip => {
                const data = history[ip] || {};

                const item = document.createElement("div");
                Object.assign(item.style, {
                    background: "rgba(26, 26, 26, 0.95)",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    overflow: "hidden"
                });

                // --- HEADER (The Bar) ---
                const head = document.createElement("div");
                Object.assign(head.style, {
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px", cursor: "pointer", transition: "background 0.2s"
                });
                head.onmouseover = () => { if(head.dataset.expanded !== "true") head.style.backgroundColor = "rgba(50,50,50,0.5)"; };
                head.onmouseout = () => { if(head.dataset.expanded !== "true") head.style.backgroundColor = "transparent"; };

                const leftSide = document.createElement("div");
                Object.assign(leftSide.style, { display: "flex", alignItems: "center", flex: "1" });

                // 1. Flag
                if (data.wc) {
                    const flag = document.createElement("img");
                    flag.src = `https://flagcdn.com/h20/${data.wc.toLowerCase()}.png`;
                    Object.assign(flag.style, { marginRight: "10px", width: "20px", height: "auto" });
                    leftSide.appendChild(flag);
                }

                // 2. IP Text (Click to Copy + Toast)
                const ipText = document.createElement("span");
                ipText.innerText = ip;
                ipText.title = "Click to Copy IP";
                Object.assign(ipText.style, {
                    fontWeight: "bold",
                    color: "#ccc",
                    cursor: "copy",
                    marginRight: "10px",
                    borderBottom: "1px dotted #666"
                });

                ipText.onclick = (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(ip).then(() => {
                        // Use existing toast system, centered in settings window if possible
                        showToast("IP Copied to Clipboard!", document.getElementById('ome-settings-window'));
                    });
                    ipText.style.color = "#00FF00";
                    setTimeout(() => ipText.style.color = "#ccc", 300);
                };
                leftSide.appendChild(ipText);

                // Delete Button (X)
                const delBtn = document.createElement("button"); delBtn.innerText = "❌";
                Object.assign(delBtn.style, { background: "none", border: "none", cursor: "pointer", paddingLeft: "15px", fontSize: "14px", color: "#FF4444" });
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    blockedIPs.delete(ip);
                    queueSave();
                    renderBlockedIPs();
                };

                head.appendChild(leftSide);
                head.appendChild(delBtn);
                item.appendChild(head);

                // --- EXPANDED BODY (Thumbnail + Note) ---
                const body = document.createElement("div");
                Object.assign(body.style, {
                    display: "none", padding: "10px", borderTop: "1px solid #333", background: "rgba(0,0,0,0.3)"
                });

                // 1. Thumbnail
                if (data.thumb) {
                    const img = document.createElement("img");
                    img.src = data.thumb;
                    Object.assign(img.style, {
                        display: "block", maxWidth: "150px", borderRadius: "4px",
                        border: "1px solid #555", marginBottom: "10px", cursor: "pointer"
                    });
                    img.onclick = () => {
                        const w = window.open();
                        w.document.write(`<body style='margin:0; background:#111; display:flex; justify-content:center; align-items:center; height:100vh;'><img src='${data.thumb}' style='max-width:100%; max-height:100%; box-shadow:0 0 20px #000;'></body>`);
                    };
                    body.appendChild(img);
                } else {
                    const noImg = document.createElement("div");
                    noImg.innerText = "No image saved for this user.";
                    Object.assign(noImg.style, { fontSize: "11px", color: "#666", marginBottom: "10px", fontStyle: "italic" });
                    body.appendChild(noImg);
                }

                // 2. Note Input
                const noteInput = document.createElement("input");
                noteInput.type = "text";
                noteInput.placeholder = "Add a note...";
                noteInput.value = data.note || "";
                Object.assign(noteInput.style, {
                    width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #444",
                    background: "#222", color: "#fff", fontSize: "12px", boxSizing: "border-box", marginBottom: "6px"
                });

                const saveNoteBtn = document.createElement("button");
                saveNoteBtn.innerText = "💾 Save Info";
                Object.assign(saveNoteBtn.style, {
                    padding: "4px 10px", backgroundColor: "#28a745", color: "white",
                    border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px"
                });
                saveNoteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (!history[ip]) history[ip] = { count: 1, lastSeen: Date.now() };
                    history[ip].note = noteInput.value.trim();
                    queueSave();
                    showToast("Info Saved", document.getElementById('ome-settings-window'));
                };

                body.appendChild(noteInput);
                body.appendChild(saveNoteBtn);

                head.onclick = () => {
                    const isHidden = body.style.display === "none";
                    body.style.display = isHidden ? "block" : "none";
                    head.dataset.expanded = isHidden ? "true" : "false";
                    head.style.backgroundColor = isHidden ? "rgba(255, 255, 255, 0.05)" : "transparent";
                };

                item.appendChild(body);
                list.appendChild(item);
            });
        }
        container.appendChild(list);
    }

    // --- NEW HELPER: Sync Advanced Settings Toggles ---
    function updateAdvToggleVisual(id, isActive) {
        const el = document.getElementById(id);
        if (!el) return;

        const track = el.querySelector('.ome-toggle-track');
        const knob = el.querySelector('.ome-toggle-knob');

        if (track) track.style.backgroundColor = isActive ? "#00E000" : "#A00000"; // Red when OFF
        // [FIX] Adjusted translateX from 26px to 18px so it doesn't go too far right
        if (knob) knob.style.transform = isActive ? "translateX(18px)" : "translateX(2px)";
    }

    // [FIX] Accept targetId parameter for scrolling
    // [FIXED ORDER] Advanced Settings Window
    function createAdvancedSettingsWindow(targetId = null) {
        if (document.getElementById("ome-adv-settings-window")) {
            const w = document.getElementById("ome-adv-settings-window");
            w.style.display = w.style.display === "none" ? "flex" : "none";
            if(w.style.display === "flex") {
                updateMasterToggles();
                updateStatusDots();

                // Refresh URL field visibility
                const urlField = document.getElementById("fake-cam-url-row");
                if (urlField) urlField.style.display = FAKE_CONFIG.enabled ? "flex" : "none";

                // Refresh Resolution field visibility
                const resField = document.getElementById("fake-cam-res-row");
                if (resField) resField.style.display = FAKE_CONFIG.enabled ? "flex" : "none";

                // Refresh Spoof visibility
                const lists = document.getElementById("adv-device-lists-container");
                if(lists) lists.style.display = FAKE_CONFIG.spoofDeviceNames ? "block" : "none";

                // Refresh IP Grabber Sub-options
                const grabberSub = document.getElementById("grabber-sub-options");
                if(grabberSub) grabberSub.style.display = isIPGrabbingEnabled ? "block" : "none";

                // Refresh Report Sounds visibility
                const repSoundRow = document.getElementById("adv-toggle-rep-sound");
                if(repSoundRow) repSoundRow.style.display = isReportProtectionEnabled ? "flex" : "none";

                const c = w.querySelector('.ome-scroll-lock');
                if (c) {
                    if (targetId) {
                        const el = document.getElementById(targetId);
                        if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                    } else {
                        c.scrollTop = 0;
                    }
                }
            }
            return;
        }

        const win = document.createElement("div"); win.id = "ome-adv-settings-window"; win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", width: "420px", maxHeight: "550px",
            backgroundColor: "rgba(20, 20, 25, 0.98)", backdropFilter: "blur(12px)", color: "#FFF",
            zIndex: "100000010",
            borderRadius: "12px", border: "1px solid #555",
            display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.8)", paddingBottom: "10px"
        });

        const header = document.createElement("div");
        Object.assign(header.style, { padding: "12px 15px", borderBottom: "1px solid #444", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom, rgba(40,40,40,0.5), transparent)", borderRadius: "12px 12px 0 0", flexShrink: "0" });
        header.innerHTML = "<span style='font-size:15px; font-weight:bold; color:#ccc;'>🛠️ Advanced Options</span>";
        const closeBtn = document.createElement("button"); closeBtn.innerText = "✖";
        Object.assign(closeBtn.style, { background: "none", border: "none", color: "#aaa", fontSize: "16px", cursor: "pointer", padding: "0 10px" });
        closeBtn.onclick = () => win.style.display = "none";
        header.appendChild(closeBtn);
        win.appendChild(header);

        const content = document.createElement("div");
        content.className = "ome-scroll-lock";
        Object.assign(content.style, { padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", flex: "1", minHeight: "0" });

        // --- STYLING HELPERS ---
        const sectionTitle = (t) => `<div style='font-size:10px; color:#888; margin: 15px 0 5px 4px; text-transform:uppercase; letter-spacing:1px; font-weight:bold;'>${t}</div>`;

        const createGroup = () => {
            const g = document.createElement("div");
            Object.assign(g.style, {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #333",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                flexShrink: "0"
            });
            return g;
        };

        const rowStyle = {
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 12px",
            background: "transparent",
            borderBottom: "1px solid #333",
            cursor: "pointer",
            transition: "background 0.2s",
            minHeight: "40px"
        };
        const rowHover = (el) => {
            el.onmouseover = () => el.style.background = "rgba(255,255,255,0.08)";
            el.onmouseout = () => el.style.background = "transparent";
        };

        const createToggleRow = (id, label, icon, isEnabled, onToggle) => {
            const div = document.createElement("div"); div.id = id;
            Object.assign(div.style, rowStyle);
            rowHover(div);

            const left = document.createElement("div"); left.style.display="flex"; left.style.alignItems="center";
            left.innerHTML = `<span style="font-size:18px; margin-right:12px; width:20px; text-align:center;">${icon}</span><span style="font-size:13px; font-weight:bold; color:#eee;">${label}</span>`;

            const tBtn = document.createElement("div"); tBtn.className = "ome-toggle-track";
            tBtn.style.backgroundColor = isEnabled ? "#00E000" : "#A00000";
            tBtn.style.width = "40px"; tBtn.style.height = "20px";

            tBtn.innerHTML = `<div class="ome-toggle-knob" style="transition: transform 0.2s; width:16px; height:16px; top:2px; transform: ${isEnabled ? 'translateX(18px)' : 'translateX(2px)'}"></div>`;

            div.onclick = onToggle; div.appendChild(left); div.appendChild(tBtn);
            return div;
        };

        const createOptBtn = (text, icon, color, action, desc) => {
            const b = document.createElement("div");
            Object.assign(b.style, rowStyle);
            rowHover(b);
            b.onclick = action;

            const ico = document.createElement("div"); ico.innerText = icon;
            Object.assign(ico.style, { fontSize: "18px", marginRight: "12px", width: "20px", textAlign: "center" });

            const txtDiv = document.createElement("div"); txtDiv.style.flex = "1";
            txtDiv.innerHTML = `<div style="font-weight:bold; font-size:13px; color:${color};">${text}</div><div style="font-size:10px; color:#888; margin-top:2px;">${desc}</div>`;

            const arrow = document.createElement("div");
            arrow.innerHTML = "›";
            arrow.style.color = "#555"; arrow.style.fontSize = "18px"; arrow.style.fontWeight = "bold";

            b.appendChild(ico); b.appendChild(txtDiv); b.appendChild(arrow);
            return b;
        };

        // 1. IP HEADER
        const ipSection = document.createElement("div");
        const ownIpContainer = document.createElement("div"); ownIpContainer.id = "ome-settings-header-content";
        Object.assign(ownIpContainer.style, { padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", border: "1px solid #444", display:"flex", justifyContent:"center", alignItems:"center", marginBottom: "5px", flexShrink: "0" });
        if(myOwnIPData) updateSettingsHeaderDisplay(ownIpContainer); else ownIpContainer.innerHTML = "<span style='color:#666;'>Fetching data...</span>";
        ipSection.appendChild(ownIpContainer); content.appendChild(ipSection);

        // 2. MAIN SETTINGS GROUP
        const mainHeader = document.createElement("div");
        mainHeader.innerHTML = sectionTitle("Main Settings");
        content.appendChild(mainHeader);

        const mainGroup = createGroup();

        // --- 1. IP Grabber (Parent) ---
        mainGroup.appendChild(createToggleRow("adv-toggle-ip-grab", "IP Grabber", "📡", isIPGrabbingEnabled, () => {
            isIPGrabbingEnabled = !isIPGrabbingEnabled;
            GM_setValue('ome_ip_grabbing', isIPGrabbingEnabled);
            updateStatusDots();

            const sub = document.getElementById("grabber-sub-options");
            if (sub) sub.style.display = isIPGrabbingEnabled ? "block" : "none";

            if (!isIPGrabbingEnabled) {
                // Turning off grabber disables children
                ipBlockingEnabled = false;
                countryBlockingEnabled = false;
                isThumbnailCaptureEnabled = false;
                GM_setValue('ome_thumb_capture', false);

                updateMasterToggles();
                updateAdvToggleVisual("adv-toggle-ip-block", false);
                updateAdvToggleVisual("adv-toggle-country-block", false);
                updateAdvToggleVisual("adv-toggle-thumbs", false);
                showToast("Blockers & History Disabled");
            }
        }));

        // Nested Sub-options for IP Grabber
        const grabberSub = document.createElement("div");
        grabberSub.id = "grabber-sub-options";
        grabberSub.style.display = isIPGrabbingEnabled ? "block" : "none";
        grabberSub.style.backgroundColor = "rgba(0,0,0,0.2)";
        grabberSub.style.borderBottom = "1px solid #333";

        // Country Blocking
        grabberSub.appendChild(createToggleRow("adv-toggle-country-block", "Country Blocking", "🌍", countryBlockingEnabled, () => {
            countryBlockingEnabled = !countryBlockingEnabled;
            updateMasterToggles(); saveCoreSettings(); updateAdvToggleVisual("adv-toggle-country-block", countryBlockingEnabled);
        }));

        // IP Blocking
        grabberSub.appendChild(createToggleRow("adv-toggle-ip-block", "IP Blocking", "🛡️", ipBlockingEnabled, () => {
            ipBlockingEnabled = !ipBlockingEnabled;
            updateMasterToggles(); saveCoreSettings(); updateAdvToggleVisual("adv-toggle-ip-block", ipBlockingEnabled);
        }));

        // Thumbnail History
        grabberSub.appendChild(createToggleRow("adv-toggle-thumbs", "Thumbnail History", "🖼️", isThumbnailCaptureEnabled, () => {
            isThumbnailCaptureEnabled = !isThumbnailCaptureEnabled;
            GM_setValue('ome_thumb_capture', isThumbnailCaptureEnabled);
            updateStatusDots();
            updateAdvToggleVisual("adv-toggle-thumbs", isThumbnailCaptureEnabled);
        }));

        // Style the nested items
        Array.from(grabberSub.children).forEach(c => {
            c.style.paddingLeft = "30px";
            c.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        });
        mainGroup.appendChild(grabberSub);

        // --- 2. Fingerprint ---
        mainGroup.appendChild(createToggleRow("adv-toggle-fingerprint", "Fingerprint Spoofing", "🧬", isFingerprintSpoofingEnabled, () => {
            if (isFingerprintSpoofingEnabled) {
                if (!confirm("⚠️ DISABLE FINGERPRINTING?\n\nYour real browser fingerprint will be visible.\n\nDisable anyway?")) return;
            }
            isFingerprintSpoofingEnabled = !isFingerprintSpoofingEnabled;
            GM_setValue('ome_fingerprint_spoofing', isFingerprintSpoofingEnabled);
            updateStatusDots();
            
            // Toggle visibility of the reset button immediately
            const resetBtn = document.getElementById('adv-btn-reset-persona');
            if (resetBtn) resetBtn.style.display = isFingerprintSpoofingEnabled ? 'flex' : 'none';

            showToast("Reload required to apply");
        }));

        // [NEW] Reset Persona Button (Nested under Fingerprint)
        const resetPersonaBtn = createOptBtn("Reset Persona Data", "↻", "#0099FF", () => {
            if(confirm("Generate NEW Device Fingerprint?\n\nThis will randomize your UserAgent, Hardware stats, and behavior patterns.\n\nPage will reload.")) {
                GM_setValue('ome_persona_data', null); // Clear saved data
                location.reload(); // Reload to generate new
            }
        }, "Generate new random identity");
        
        resetPersonaBtn.id = 'adv-btn-reset-persona'; // Assign ID for toggling
        resetPersonaBtn.style.paddingLeft = "30px";
        resetPersonaBtn.style.backgroundColor = "rgba(0,0,0,0.2)";
        resetPersonaBtn.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        // Hide if parent toggle is off
        if (!isFingerprintSpoofingEnabled) resetPersonaBtn.style.display = 'none';

        mainGroup.appendChild(resetPersonaBtn);

        // --- 3. Anti-Bot ---
        mainGroup.appendChild(createToggleRow("adv-toggle-antibot", "Anti-Bot Bypass (Variance)", "🤖", isAntiBotEnabled, () => {
            if (isAntiBotEnabled) {
                 if (!confirm("⚠️ DISABLE ANTI-BOT?\n\nDisabling this significantly increases the chance of captcha bans.\n\nDisable anyway?")) return;
            }
            isAntiBotEnabled = !isAntiBotEnabled;
            GM_setValue('ome_anti_bot', isAntiBotEnabled);
            updateStatusDots();
            showToast("Reload required to apply");
        }));

        // --- 4. Request Relay ---
        mainGroup.appendChild(createToggleRow("adv-toggle-force-relay", "Request Relay", "🖧", FAKE_CONFIG.forceRelay, () => {
            if (FAKE_CONFIG.forceRelay) {
                if (!confirm("⚠️ DISABLE RELAY FORCE?\n\nYour real IP might be exposed if a direct connection is established.\n\nDisable anyway?")) return;
            }
            FAKE_CONFIG.forceRelay = !FAKE_CONFIG.forceRelay;
            GM_setValue('ome_force_relay', FAKE_CONFIG.forceRelay);
            updateStatusDots();
        }));

        // --- 5. UDP Only ---
        mainGroup.appendChild(createToggleRow("adv-toggle-udp-strict", "UDP Only", "⚠️", FAKE_CONFIG.udpStrict, () => {
            if (FAKE_CONFIG.udpStrict) {
                if (!confirm("⚠️ DISABLE UDP PROTECTION?\n\nDisabling Strict UDP may allow sites to route you through Relay servers (hiding IP).\n\nDisable anyway?")) return;
            }
            FAKE_CONFIG.udpStrict = !FAKE_CONFIG.udpStrict;
            GM_setValue('ome_udp_strict', FAKE_CONFIG.udpStrict);
            updateStatusDots();
            showToast(FAKE_CONFIG.udpStrict ? "UDP Only: ON" : "UDP Only: OFF");
        }));

        // --- 6. Face Bypass ---
        mainGroup.appendChild(createToggleRow("adv-toggle-face-bypass", "Face Bypass", "🎭", isFaceProtectionEnabled, () => {
            isFaceProtectionEnabled = !isFaceProtectionEnabled; GM_setValue('ome_face_protection', isFaceProtectionEnabled); window.dispatchEvent(new CustomEvent('ome-bypass-config', { detail: { type: 'face', enabled: isFaceProtectionEnabled } })); updateStatusDots();
        }));

        // --- 7. Report Protection (Parent) ---
        mainGroup.appendChild(createToggleRow("adv-toggle-report-prot", "Report Protection", "🛡️", isReportProtectionEnabled, () => {
            isReportProtectionEnabled = !isReportProtectionEnabled; 
            GM_setValue('ome_report_protection', isReportProtectionEnabled);
            window.dispatchEvent(new CustomEvent('ome-bypass-config', { detail: { type: 'report', enabled: isReportProtectionEnabled } }));
            updateStatusDots();
            
            // Toggle visibility of the nested sound option
            const soundRow = document.getElementById("adv-toggle-rep-sound");
            if (soundRow) soundRow.style.display = isReportProtectionEnabled ? "flex" : "none";
        }));

        // Report Sounds (Nested/Conditional)
        const reportSoundRow = createToggleRow("adv-toggle-rep-sound", "Report Sounds", "🔊", isReportSoundEnabled, () => {
            isReportSoundEnabled = !isReportSoundEnabled;
            GM_setValue('ome_report_sound', isReportSoundEnabled);
            updateAdvToggleVisual("adv-toggle-rep-sound", isReportSoundEnabled);
            showToast(`Report Alerts: ${isReportSoundEnabled ? "Sound ON" : "Silent (Visual Only)"}`);
        });
        
        reportSoundRow.id = "adv-toggle-rep-sound"; // ID for targeting

        // --- STYLING TO MATCH IP GRABBER SUBMENU ---
        reportSoundRow.style.display = isReportProtectionEnabled ? "flex" : "none"; // Initial State
        reportSoundRow.style.backgroundColor = "rgba(0,0,0,0.2)";                   // MATCHES IP GRABBER
        reportSoundRow.style.paddingLeft = "30px";                                  // MATCHES IP GRABBER
        reportSoundRow.style.borderBottom = "1px solid rgba(255,255,255,0.05)";     // MATCHES IP GRABBER
        
        mainGroup.appendChild(reportSoundRow);
        content.appendChild(mainGroup);


        // 3. OTHER (BETA) GROUP
        const betaHeader = document.createElement("div"); betaHeader.innerHTML = sectionTitle("Other (beta)");
        content.appendChild(betaHeader);

        const betaGroup = createGroup();

        // --- 1. Raw Audio ---
        betaGroup.appendChild(createToggleRow("adv-toggle-raw-audio", "Raw Audio (beta)", "🎤", FAKE_CONFIG.rawAudio, () => {
            FAKE_CONFIG.rawAudio = !FAKE_CONFIG.rawAudio;
            GM_setValue('ome_raw_audio', FAKE_CONFIG.rawAudio);
            updateStatusDots();
            showToast("Reload required to apply");
        }));

        // --- 2. Jitter Bot ---
        betaGroup.appendChild(createToggleRow("adv-toggle-antiban", "Jitter Bot (beta)", "🛡️", FAKE_CONFIG.antiBanFrames, () => {
            FAKE_CONFIG.antiBanFrames = !FAKE_CONFIG.antiBanFrames;
            GM_setValue('ome_antiban_frames', FAKE_CONFIG.antiBanFrames);
            updateStatusDots();
        }));

        // --- 3. Fake Camera (Parent) ---
        betaGroup.appendChild(createToggleRow("adv-toggle-fake-cam", "Fake Camera (beta)", "📷", FAKE_CONFIG.enabled, () => {
            FAKE_CONFIG.enabled = !FAKE_CONFIG.enabled;
            GM_setValue('ome_fake_cam_enabled', FAKE_CONFIG.enabled);
            updateStatusDots();
            
            // Toggle visibility of nested items
            const urlRow = document.getElementById("fake-cam-url-row");
            if(urlRow) urlRow.style.display = FAKE_CONFIG.enabled ? "flex" : "none";
            const resRow = document.getElementById("fake-cam-res-row");
            if(resRow) resRow.style.display = FAKE_CONFIG.enabled ? "flex" : "none";
        }));

        // Video Preview (defined FIRST so the URL handler can reference it)
        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = 160;
        previewCanvas.height = 90;
        Object.assign(previewCanvas.style, {
            width: "160px", height: "90px", marginTop: "6px", borderRadius: "4px",
            border: "1px solid #444", background: "#000", display: "block",
            alignSelf: "flex-start"
        });

        const previewVideo = document.createElement("video");
        previewVideo.muted = true;
        previewVideo.playsInline = true;
        previewVideo.style.display = "none";
        previewVideo.preload = "metadata"; // Faster preview feedback

        // Helper to print status text into the 160x90 preview canvas
        const drawPreviewStatus = (line1, line2, color) => {
            try {
                const cx = previewCanvas.getContext('2d');
                cx.fillStyle = '#111';
                cx.fillRect(0, 0, 160, 90);
                cx.fillStyle = color || '#555';
                cx.font = '10px sans-serif';
                cx.textAlign = 'center';
                if (line1) cx.fillText(line1, 80, line2 ? 40 : 48);
                if (line2) cx.fillText(line2, 80, 56);
            } catch(e) { /* canvas missing, very early failure */ }
        };

        // Initial placeholder
        drawPreviewStatus('Paste URL to preview', '', '#555');

        // Track the current local-file blob URL so we can revoke it on replacement
        // (prevents memory leak when user picks multiple files in one session)
        let currentBlobUrl = null;

        // Helper: revoke the previous blob URL if any. Safe to call multiple times.
        const revokeBlob = () => {
            if (currentBlobUrl) {
                try { URL.revokeObjectURL(currentBlobUrl); } catch(e) {}
                currentBlobUrl = null;
            }
        };

        // Fake Cam: URL Input
        const urlRow = document.createElement("div");
        urlRow.id = "fake-cam-url-row";
        Object.assign(urlRow.style, {
            display: FAKE_CONFIG.enabled ? "flex" : "none",
            flexDirection: "column",
            padding: "10px",
            background: "rgba(0,0,0,0.3)",
            borderBottom: "1px solid #333"
        });
        const urlLabel = document.createElement("span");
        urlLabel.innerText = "Custom Video URL (.mp4):";
        urlLabel.style.fontSize = "11px"; urlLabel.style.color = "#aaa"; urlLabel.style.marginBottom = "6px";

        // Wrapper row for [input] [paste] [file] in horizontal flex
        const inputRow = document.createElement("div");
        Object.assign(inputRow.style, {
            display: "flex", gap: "6px", alignItems: "center", width: "100%"
        });

        const urlInput = document.createElement("input");
        urlInput.type = "text";
        // Never display a dead blob: URL from a previous session (blobs die on reload)
        urlInput.value = (FAKE_CONFIG.videoURL && !FAKE_CONFIG.videoURL.startsWith("blob:"))
            ? FAKE_CONFIG.videoURL
            : "";
        Object.assign(urlInput.style, {
            flex: "1", minWidth: "0", padding: "6px", borderRadius: "4px", border: "1px solid #555",
            background: "#111", color: "#00FF00", fontSize:"12px", boxSizing: "border-box"
        });
        urlInput.placeholder = "Paste URL, pick file, or drop .mp4";

        // [NEW] Helper styles for the small action buttons (reused by paste + file)
        const styleIconBtn = (btn) => {
            Object.assign(btn.style, {
                padding: "6px 9px", borderRadius: "4px", border: "1px solid #3a6a3a",
                background: "#1a3a1a", color: "#00FF88", fontSize: "13px",
                cursor: "pointer", flexShrink: "0", transition: "transform 0.1s ease, background 0.2s, box-shadow 0.2s"
            });
            btn.onmouseenter = () => {
                btn.style.background = "#2a4a2a";
                btn.style.transform = "translateY(-1px)";
                btn.style.boxShadow = "0 2px 8px rgba(0,255,136,0.3)";
            };
            btn.onmouseleave = () => {
                btn.style.background = "#1a3a1a";
                btn.style.transform = "";
                btn.style.boxShadow = "";
            };
            btn.onmousedown = () => { btn.style.transform = "scale(0.95)"; };
            btn.onmouseup = () => { btn.style.transform = "translateY(-1px)"; };
        };

        // [NEW] 📋 PASTE button - read clipboard text and put it in the URL field
        const pasteBtn = document.createElement("button");
        pasteBtn.innerText = "📋";
        pasteBtn.title = "Paste URL from clipboard (must be a video URL)";
        styleIconBtn(pasteBtn);
        pasteBtn.onclick = async () => {
            try {
                const txt = await navigator.clipboard.readText();
                const trimmed = (txt || "").trim();
                if (!trimmed) {
                    showToast("Clipboard empty");
                    return;
                }
                urlInput.value = trimmed;
                // Dispatch input event so the existing oninput handler runs the validation + preview load
                urlInput.dispatchEvent(new Event("input", { bubbles: true }));
                showToast("Pasted from clipboard");
            } catch(e) {
                showToast("Clipboard read denied (browser permission)");
            }
        };

        // [NEW] 📁 FILE picker button + hidden <input type="file">
        const fileBtn = document.createElement("button");
        fileBtn.innerText = "📁";
        fileBtn.title = "Pick a local .mp4 file";
        styleIconBtn(fileBtn);

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "video/*,video/mp4,.mp4,.webm,.ogg,.mov";
        fileInput.style.display = "none";
        fileBtn.onclick = () => fileInput.click();

        // [NEW] Helper: load a Local File as a blob URL into input + preview.
        // Blob URLs are SAME-ORIGIN, so canvas.captureStream() works in ALL browsers
        // (even Firefox). This bypasses all CORS issues with public hosts.
const loadLocalFile = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("video/")) {
        showToast("Not a video file");
        drawPreviewStatus("Not a video file", file.type || "unknown type", "#f44");
        return;
    }
    const MAX_BYTES = 200 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
        showToast("File too large: " + (file.size/1048576).toFixed(0) + "MB (max 200MB)");
        drawPreviewStatus("File too large", (file.size/1048576).toFixed(0) + "MB exceeds 200MB", "#f44");
        return;
    }
    // Cleanup any previous blob URL (best-effort)
    try { revokeBlob(); } catch(_) {}
    showToast("Loading " + file.name + "...");
    drawPreviewStatus("Loading " + file.name, (file.size/1048576).toFixed(1) + "MB", "#FFA500");
    const reader = new FileReader();
    reader.onload = () => {
        const dataURL = reader.result;
        // [NEW] Use data: URL instead of blob: URL — survives page reloads
        currentBlobUrl = null;  // (legacy unused, kept for backward-compat with other refs)
        FAKE_CONFIG.videoURL = dataURL;
        FAKE_CONFIG.pickedFilename = file.name;
        try { GM_setValue("ome_picked_filename", file.name); } catch(_) {}
        // Update state tracking (consistent with new floating picker)
        if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {};
        unsafeWindow.ome_ip_state.videoURL = dataURL;
        unsafeWindow.ome_ip_state.pickedFilename = file.name;
        unsafeWindow.ome_ip_state.sourceType = "data";
        unsafeWindow.ome_ip_state.lastChanged = Date.now();
        // Show human-readable label in the input (actual src is the data URL)
        urlInput.value = "\uD83D\uDCC1 " + file.name;
        showToast("Loaded " + file.name + " (" + (file.size/1048576).toFixed(1) + " MB)");
        logDev("CAM", "Local video loaded: " + file.name + " (" + (file.size/1048576).toFixed(1) + " MB)");
        trySavePick(dataURL, file.name);
        // Trigger preview load (data URLs don't need crossOrigin attribute)
        try { previewVideo.removeAttribute("crossOrigin"); previewVideo.src = ""; previewVideo.load(); } catch(e) {}
        drawPreviewStatus("Preview ready", file.name, "#0a4a0a");
        setMeta("");
        previewVideo.src = dataURL;
    };
    reader.onerror = () => {
        showToast("Error reading file");
        drawPreviewStatus("Error reading file", "", "#f44");
        console.error("[Ome-IP] FileReader error:", reader.error);
    };
    reader.readAsDataURL(file);
};

        fileInput.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            loadLocalFile(file);
            // Reset so picking the SAME file again still fires change
            e.target.value = '';
        };

        inputRow.appendChild(urlInput);
        inputRow.appendChild(pasteBtn);
        inputRow.appendChild(fileBtn);

        // [FIX] oninput (not onchange): paste/typing triggers instantly
        // Old onchange only fired on blur, so pasted URLs that the user accepted
        // (Enter, click, etc.) never registered.
        urlInput.oninput = (e) => {
            const newUrl = (e.target.value || '').trim();
            FAKE_CONFIG.videoURL = newUrl;

            // If the user just edited away from a "📁 filename" label, the
            // previous blob URL is now orphaned - revoke it.
            if (!newUrl.startsWith("📁") && currentBlobUrl) {
                revokeBlob();
            }

            // Persist only HTTP(S) URLs. blob: URLs die on page reload, so saving
            // them would just leave a dead reference for next session.
            if (/^https?:\/\//i.test(newUrl)) {
                GM_setValue('ome_fake_video_url', newUrl);
            }

            if (!newUrl || newUrl.startsWith("📁")) {
                drawPreviewStatus('Pick file / paste URL', 'to preview', '#555');
                return;
            }
            if (!/^https?:\/\//i.test(newUrl) && !newUrl.startsWith("blob:")) {
                drawPreviewStatus('Invalid URL', 'must start with http(s)://', '#f44');
                return;
            }

            // [FIX] Show "Loading..." text BEFORE the request (instant feedback).
            drawPreviewStatus('Loading preview...', '', '#FFA500');
            setMeta(''); // [NEW] clear badge while loading new

            // [FIX] Do NOT set crossOrigin on the preview. Many hosts (Discord CDN,
            // direct MP4 links, Catbox, etc.) don't send CORS headers, so
            // crossOrigin='anonymous' causes the browser to REJECT the entire load
            // silently. For the preview we just want to draw the frame; we don't
            // need CORS. The separate streaming video in createProcessedStream()
            // keeps crossOrigin so canvas.captureStream() works (that one needs it).
            // NOTE: blob: URLs are same-origin, so they're fine here too.
            previewVideo.removeAttribute('crossOrigin');

            // Force a reload by clearing src first
            try { previewVideo.src = ''; previewVideo.load(); } catch(e) {}
            previewVideo.src = newUrl;
        };
        urlRow.appendChild(urlLabel);
        urlRow.appendChild(inputRow);
        urlRow.appendChild(fileInput); // hidden but accessible for .click()

        // ============================================================
        // [NEW] DRAG & DROP: drop a .mp4 file onto the URL row
        // ============================================================
        const showDragHighlight = () => {
            urlRow.style.outline = "2px dashed #00FF88";
            urlRow.style.outlineOffset = "-2px";
            urlRow.style.background = "rgba(0, 255, 136, 0.08)";
        };
        const hideDragHighlight = () => {
            urlRow.style.outline = "";
            urlRow.style.outlineOffset = "";
            urlRow.style.background = "rgba(0,0,0,0.3)";
        };

        urlRow.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
            showDragHighlight();
        });
        urlRow.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        });
        urlRow.addEventListener('dragleave', (e) => {
            // dragleave fires when entering a child too; only hide when leaving urlRow itself
            if (e.target === urlRow) hideDragHighlight();
        });
        urlRow.addEventListener('drop', (e) => {
            e.preventDefault();
            hideDragHighlight();
            const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) loadLocalFile(file);
        });

        // [NEW] Duration / Resolution metadata badge
        const previewMeta = document.createElement('div');
        Object.assign(previewMeta.style, {
            fontSize: '10px', color: '#aaa', marginTop: '4px',
            alignSelf: 'flex-start' // match drawPreviewStatus style for UI consistency
        });
        const setMeta = (text) => { previewMeta.innerText = text || ''; };

        // [NEW] Friendly file-size formatter (1024 powers - KB/MB/GB).
        // Used in loadLocalFile's toast/log AND appended to the metadata badge.
        const fmtFileSize = (bytes) => {
            if (bytes == null || bytes < 0) return '';
            if (bytes < 1024)               return bytes + ' B';
            if (bytes < 1048576)            return (bytes / 1024).toFixed(2) + ' KB';
            if (bytes < 1073741824)         return (bytes / 1048576).toFixed(1) + ' MB';
            return (bytes / 1073741824).toFixed(2) + ' GB';
        };

        // [FIX] Round the WHOLE duration to whole seconds first, then build the
        // string with Math.floor for all sub-units. Prevents boundary bugs like
        // 119.7s producing "1m 60s" or 59.7s producing "0m 60s".
        const fmtDuration = (sec) => {
            if (sec < 60)    return sec + 's';
            if (sec < 3600)  return Math.floor(sec/60) + 'm ' + (sec % 60) + 's';
            return Math.floor(sec/3600) + 'h ' + Math.floor((sec % 3600)/60) + 'm';
        };

        previewVideo.onloadedmetadata = () => {
            // [NEW] Show duration + resolution so user can verify the right
            // file is loaded without starting a chat.
            const w = previewVideo.videoWidth || 0;
            const h = previewVideo.videoHeight || 0;
            const dur = previewVideo.duration;
            let durStr = '?';
            if (isFinite(dur) && dur > 0) {
                durStr = fmtDuration(Math.round(dur));
            }
            setMeta((w && h) ? durStr + ' · ' + w + '×' + h : durStr);

            // Seek halfway into the video (or to 1s for very long clips) to grab a frame
            const seekTo = (isFinite(dur) && dur > 0) ? Math.min(1, dur / 2) : 1;
            previewVideo.currentTime = seekTo;
        };
        previewVideo.onseeked = () => {
            try {
                const pctx2 = previewCanvas.getContext('2d');
                pctx2.drawImage(previewVideo, 0, 0, 160, 90);
                logDev("CAM", "Preview frame captured for: " + (FAKE_CONFIG.videoURL || ''));
            } catch(e) {
                logDev("ERR", "Preview draw failed: " + e.message);
                drawPreviewStatus('Preview draw failed', (e.message || '').substring(0, 22), '#f44');
            }
        };
        previewVideo.onerror = () => {
            // [FIX] Show SPECIFIC error reason (Network / Decode / Format) so
            // user knows whether it's a CORS problem, a 404, or a bad format.
            const err = previewVideo.error;
            let reason = 'Unknown error';
            if (err) {
                if (err.code === 1)      reason = 'Aborted';
                else if (err.code === 2) reason = 'Network error';
                else if (err.code === 3) reason = 'Decode error';
                else if (err.code === 4) reason = 'Format not supported';
            }
            logDev("ERR", "Preview failed [" + reason + "]: " + (FAKE_CONFIG.videoURL || ''));
            drawPreviewStatus('Failed to load', reason, '#f44');
            setMeta(''); // [NEW] clear badge on error
        };
        urlRow.appendChild(previewCanvas);
        urlRow.appendChild(previewMeta);
        urlRow.appendChild(previewVideo);

        betaGroup.appendChild(urlRow);

        // Fake Cam: Resolution Select
        const resRow = document.createElement("div");
        resRow.id = "fake-cam-res-row";
        Object.assign(resRow.style, {
            display: FAKE_CONFIG.enabled ? "flex" : "none",
            alignItems: "center", justifyContent: "space-between",
            padding: "10px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid #333"
        });
        const resLabel = document.createElement("span");
        resLabel.innerText = "Camera Resolution:";
        resLabel.style.fontSize = "12px"; resLabel.style.color = "#ccc";
        const resSelect = document.createElement("select");
        Object.assign(resSelect.style, {
            padding: "4px", borderRadius: "4px", background: "#222", color: "#fff", border: "1px solid #555"
        });
        const resolutions = ["640x480", "1280x720", "1920x1080", "320x240"];
        resolutions.forEach(res => {
            const opt = document.createElement("option");
            opt.value = res;
            opt.innerText = res;
            if (`${FAKE_CONFIG.canvasSize.width}x${FAKE_CONFIG.canvasSize.height}` === res) opt.selected = true;
            resSelect.appendChild(opt);
        });
        resSelect.onchange = (e) => {
            const val = e.target.value;
            const [w, h] = val.split('x').map(Number);
            FAKE_CONFIG.canvasSize = { width: w, height: h };
            GM_setValue('ome_cam_resolution', val);
            if (window.fakeFrameCanvas) {
                window.fakeFrameCanvas.width = w;
                window.fakeFrameCanvas.height = h;
            }
            showToast(`Resolution set to ${val} (Reload to apply)`);
        };
        resRow.appendChild(resLabel);
        resRow.appendChild(resSelect);
        betaGroup.appendChild(resRow);

        content.appendChild(betaGroup);


        // 4. DEVICE CONFIG GROUP
        const devHeader = document.createElement("div"); devHeader.innerHTML = sectionTitle("Device Configurations");
        content.appendChild(devHeader);

        const devGroup = createGroup();

        // SPOOF TOGGLE (Warning on OFF)
        const spoofToggle = createToggleRow("adv-toggle-device-spoof", "Spoof Device Names", "🏷️", FAKE_CONFIG.spoofDeviceNames, () => {
            if (FAKE_CONFIG.spoofDeviceNames) {
                if (!confirm("⚠️ DISABLE SPOOFING?\n\nReal device labels will be visible to the site.\n\nDisable anyway?")) return;
            }
            const newState = !FAKE_CONFIG.spoofDeviceNames;
            FAKE_CONFIG.spoofDeviceNames = newState;
            GM_setValue('ome_spoof_devices', newState);

            // Sync One Mode
            FAKE_CONFIG.oneCameraMode = newState;
            FAKE_CONFIG.oneInputMode = newState;
            FAKE_CONFIG.oneOutputMode = newState;
            GM_setValue('ome_one_cam_mode', newState);
            GM_setValue('ome_one_input_mode', newState);
            GM_setValue('ome_one_output_mode', newState);

            updateStatusDots();

            // Update List visibility
            const lists = document.getElementById("adv-device-lists-container");
            if(lists) {
                lists.style.display = newState ? "block" : "none";
                updateAdvToggleVisual("adv-toggle-one-cam", newState);
                updateAdvToggleVisual("adv-toggle-one-mic", newState);
                updateAdvToggleVisual("adv-toggle-one-spk", newState);

                const camRow = document.getElementById("adv-toggle-one-cam");
                if (camRow) camRow.querySelector('span:nth-child(2)').innerText = newState ? "One Camera Mode" : "Multi Camera Mode";
                const micRow = document.getElementById("adv-toggle-one-mic");
                if (micRow) micRow.querySelector('span:nth-child(2)').innerText = newState ? "One Input Mode" : "Multi Input Mode";
                const spkRow = document.getElementById("adv-toggle-one-spk");
                if (spkRow) spkRow.querySelector('span:nth-child(2)').innerText = newState ? "One Output Mode" : "Multi Output Mode";

                lists.querySelectorAll('.multi-input-row').forEach(row => {
                    const parent = row.parentElement;
                    const index = Array.from(parent.children).indexOf(row);
                    if (index > 0) row.style.display = newState ? 'none' : 'block';
                });
            }

            showToast(`Spoofing & One Mode: ${newState ? "ON" : "OFF"}`);
        });
        spoofToggle.style.borderBottom = "1px solid #333";
        devGroup.appendChild(spoofToggle);

        // Lists Container
        const listsContainer = document.createElement("div");
        listsContainer.id = "adv-device-lists-container";
        listsContainer.style.display = FAKE_CONFIG.spoofDeviceNames ? "block" : "none";
        listsContainer.style.padding = "10px";
        listsContainer.style.background = "rgba(0,0,0,0.2)";

        const createLabelSection = (title, icon, dataArray, storageKey, toggleId, toggleLabel, isOneMode, toggleStorageKey, togglePropName, typeName) => {
            const container = document.createElement("div");
            Object.assign(container.style, { background: "rgba(255,255,255,0.05)", borderRadius: "6px", border: "1px solid #333", padding: "10px", marginBottom: "10px" });

            const topRow = createToggleRow(toggleId, isOneMode ? `One ${typeName} Mode` : `Multi ${typeName} Mode`, icon, isOneMode, () => {
                const newState = !FAKE_CONFIG[togglePropName];
                FAKE_CONFIG[togglePropName] = newState;
                GM_setValue(toggleStorageKey, newState);
                updateAdvToggleVisual(toggleId, newState);

                const rows = container.querySelectorAll('.multi-input-row');
                rows.forEach((r, idx) => { if(idx > 0) r.style.display = newState ? 'none' : 'block'; });

                const labelSpan = topRow.querySelector('span:nth-child(2)');
                if(labelSpan) labelSpan.innerText = newState ? `One ${typeName} Mode` : `Multi ${typeName} Mode`;

                showToast(`${toggleLabel}: ${newState ? "ON" : "OFF"}`);
            });
            topRow.style.borderBottom = "none";
            topRow.style.padding = "0 0 8px 0";

            container.appendChild(topRow);
            const inputWrapper = document.createElement("div");
            for(let i=0; i<4; i++) {
                const row = document.createElement("div");
                row.className = "multi-input-row";
                if (isOneMode && i > 0) row.style.display = "none";
                Object.assign(row.style, { marginBottom: "6px" });
                const lbl = document.createElement("div"); lbl.innerText = `${title} ${i+1}:`;
                Object.assign(lbl.style, { fontSize:"10px", color:"#888", marginBottom:"2px", fontWeight:"bold" });
                const inp = document.createElement("input"); inp.type = "text"; inp.value = dataArray[i] || ""; inp.placeholder = "Leave empty to skip";
                Object.assign(inp.style, { width: "100%", padding: "5px", borderRadius: "4px", border: "1px solid #555", background: "#111", color: "#00FF00", fontSize:"12px", boxSizing:"border-box" });
                inp.onchange = (e) => { dataArray[i] = e.target.value; GM_setValue(storageKey, JSON.stringify(dataArray)); };
                row.appendChild(lbl); row.appendChild(inp); inputWrapper.appendChild(row);
            }
            container.appendChild(inputWrapper);
            return container;
        };

        listsContainer.appendChild(createLabelSection("Camera", "📷", FAKE_CONFIG.videoLabels, 'ome_video_labels', "adv-toggle-one-cam", "One Camera Mode", FAKE_CONFIG.oneCameraMode, 'ome_one_cam_mode', 'oneCameraMode', 'Camera'));
        listsContainer.appendChild(createLabelSection("Mic", "🎤", FAKE_CONFIG.audioInputLabels, 'ome_audio_input_labels', "adv-toggle-one-mic", "One Input Mode", FAKE_CONFIG.oneInputMode, 'ome_one_input_mode', 'oneInputMode', 'Input'));
        listsContainer.appendChild(createLabelSection("Speaker", "🔊", FAKE_CONFIG.audioOutputLabels, 'ome_audio_output_labels', "adv-toggle-one-spk", "One Output Mode", FAKE_CONFIG.oneOutputMode, 'ome_one_output_mode', 'oneOutputMode', 'Output'));

        devGroup.appendChild(listsContainer);
        content.appendChild(devGroup);

        // 5. TOOLS & UI GROUP
        const uiHeader = document.createElement("div"); uiHeader.innerHTML = sectionTitle("Tools & UI");
        content.appendChild(uiHeader);

        const uiGroup = createGroup();
        uiGroup.appendChild(createOptBtn("Saved Screenshots", "📸", "#00FFFF", () => { createScreenshotHistoryWindow(); }, "View Captured Thumbs"));
        uiGroup.appendChild(createOptBtn("Saved Notes", "📝", "#FFD700", () => { createNotesListWindow(); }, "Manage IP Notes"));
        uiGroup.appendChild(createOptBtn("Dev Console", "📟", "#00FF00", toggleDevConsole, "Logs"));
        uiGroup.appendChild(createOptBtn("Unhide ALL", "🟧", "#FFA500", unhideAllElements, "Reset hidden"));
        uiGroup.appendChild(createOptBtn("Toggle Dark Mode", "👁️", "#FF4444", () => toggleWatermarks(), "Hide watermarks"));
        uiGroup.appendChild(createOptBtn("Toggle Ghost Mode", "👻", "#FFFFFF", () => toggleGhostMode(document.getElementById("ip-log-window")), "Transparent"));

        uiGroup.lastChild.style.borderBottom = "none";
        content.appendChild(uiGroup);

        // 6. DANGER GROUP
        const dangerHeader = document.createElement("div"); dangerHeader.innerHTML = sectionTitle("Danger Zone");
        content.appendChild(dangerHeader);

        const dangerGroup = createGroup();

        const resetBtn = document.createElement("div");
        Object.assign(resetBtn.style, rowStyle);
        rowHover(resetBtn);
        resetBtn.onclick = resetSettingsOnly;
        resetBtn.innerHTML = `
            <div style="font-size:18px; margin-right:12px; width:20px; text-align:center;">↻</div>
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:13px; color:#0099FF;">Reset Settings</div>
                <div style="font-size:10px; color:#888; margin-top:2px;">Keeps History, Blocks & Notes safe</div>
            </div>
            <div style="color:#555; font-size:16px;">›</div>
        `;
        dangerGroup.appendChild(resetBtn);

        dangerGroup.appendChild(createOptBtn("Reset All Data", "⚠️", "#FF4444", clearAllData, "Wipe everything"));
        dangerGroup.lastChild.style.borderBottom = "none";
        content.appendChild(dangerGroup);

        // 6.5. DIAGNOSTICS
        const diagHeader = document.createElement("div"); diagHeader.innerHTML = sectionTitle("Diagnostics");
        content.appendChild(diagHeader);

        const diagGroup = createGroup();

        // Test result display area (hidden by default)
        const testResult = document.createElement("div");
        testResult.id = "diag-test-result";
        Object.assign(testResult.style, {
            display: "none", padding: "10px", marginBottom: "0",
            background: "rgba(0,0,0,0.4)", borderBottom: "1px solid #333",
            fontSize: "11px", color: "#ccc", lineHeight: "1.6",
            fontFamily: "monospace", wordBreak: "break-all"
        });
        const updateTestDisplay = (html, bgColor) => {
            testResult.style.display = "block";
            testResult.style.background = bgColor || "rgba(0,0,0,0.4)";
            testResult.innerHTML = html;
        };

        const testApiBtn = createOptBtn("Test Location API", "🌐", "#00FF88", () => {
            const now = Date.now();
            updateTestDisplay("<span style='color:#FFA500;'>⏳ Testing ipwho.is API... Please wait</span>", "rgba(255,140,0,0.15)");
            
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://ipwho.is/",
                timeout: 8000,
                onload: function(response) {
                    try {
                        const json = JSON.parse(response.responseText);
                        const elapsed = ((Date.now() - now) / 1000).toFixed(1);
                        if (json.success) {
                            const html = `
                                <div style='color:#00FF88; font-weight:bold; margin-bottom:4px;'>✅ API is working (${elapsed}s)</div>
                                <div>Your IP: <b style='color:#fff;'>${json.ip}</b></div>
                                <div>Country: <b style='color:#fff;'>${json.country}</b> (${json.country_code})</div>
                                <div>City: <b style='color:#fff;'>${json.city || 'N/A'}</b></div>
                                <div>Region: <b style='color:#fff;'>${json.region || 'N/A'}</b></div>
                                <div>ISP: <b style='color:#fff;'>${json.connection ? json.connection.isp : 'N/A'}</b></div>
                                <div style='margin-top:4px; font-size:10px; color:#888;'>Partner IP location will use the same API.</div>
                            `;
                            updateTestDisplay(html, "rgba(0,255,136,0.08)");
                        } else {
                            updateTestDisplay(`<div style='color:#FF4444; font-weight:bold;'>❌ API returned error</div><div style='color:#ccc;'>${json.message || 'Unknown error'}</div><div style='font-size:10px; color:#888; margin-top:4px;'>This means partner locations won't resolve either.</div>`, "rgba(255,0,0,0.1)");
                        }
                    } catch(e) {
                        updateTestDisplay(`<div style='color:#FF4444; font-weight:bold;'>❌ Parse error</div><div style='color:#ccc;'>${e.message}</div>`, "rgba(255,0,0,0.1)");
                    }
                },
                onerror: function() {
                    updateTestDisplay(`<div style='color:#FF4444; font-weight:bold;'>❌ Network error</div><div style='color:#ccc;'>Could not reach ipwho.is. Check your internet or the API may be down.</div>`, "rgba(255,0,0,0.1)");
                },
                ontimeout: function() {
                    updateTestDisplay(`<div style='color:#FFA500; font-weight:bold;'>⏱️ Request timed out</div><div style='color:#ccc;'>ipwho.is took too long to respond (8s limit).</div>`, "rgba(255,140,0,0.15)");
                }
            });
        }, "Verify ipwho.is API is reachable");

        // IP input + Test button for arbitrary IP lookup
        const ipInputRow = document.createElement("div");
        Object.assign(ipInputRow.style, {
            display: "flex", gap: "6px", alignItems: "center",
            padding: "8px 12px", borderBottom: "1px solid #333"
        });
        const ipInput = document.createElement("input");
        ipInput.type = "text";
        ipInput.placeholder = "Enter IP (e.g. 8.8.8.8)";
        Object.assign(ipInput.style, {
            flex: "1", padding: "6px 8px", borderRadius: "4px",
            border: "1px solid #555", background: "#111", color: "#00FF88",
            fontSize: "12px", boxSizing: "border-box"
        });
        ipInput.onkeydown = (e) => { if (e.key === "Enter") testIpBtn.click(); };

        const testIpBtn = document.createElement("div");
        Object.assign(testIpBtn.style, {
            padding: "6px 12px", borderRadius: "4px", cursor: "pointer",
            background: "#1a3a1a", border: "1px solid #3a6a3a",
            color: "#00FF88", fontSize: "12px", fontWeight: "bold",
            whiteSpace: "nowrap", flexShrink: "0", userSelect: "none"
        });
        testIpBtn.innerText = "Test IP";
        testIpBtn.onclick = () => {
            const ip = ipInput.value.trim();
            if (!ip) { updateTestDisplay("<span style='color:#FFA500;'>Enter an IP address first</span>", "rgba(255,140,0,0.15)"); return; }
            if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) { updateTestDisplay("<span style='color:#FF4444;'>Invalid IP format. Use e.g. 8.8.8.8</span>", "rgba(255,0,0,0.1)"); return; }
            const now = Date.now();
            updateTestDisplay(`<span style='color:#FFA500;'>⏳ Looking up ${ip}... Please wait</span>`, "rgba(255,140,0,0.15)");
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://ipwho.is/" + ip,
                timeout: 8000,
                onload: function(response) {
                    try {
                        const json = JSON.parse(response.responseText);
                        const elapsed = ((Date.now() - now) / 1000).toFixed(1);
                        if (json.success) {
                            const html = `
                                <div style='color:#00FF88; font-weight:bold; margin-bottom:4px;'>✅ Resolved in ${elapsed}s</div>
                                <div>IP: <b style='color:#fff;'>${json.ip}</b></div>
                                <div>Country: <b style='color:#fff;'>${json.country}</b> (${json.country_code})</div>
                                <div>City: <b style='color:#fff;'>${json.city || 'N/A'}</b></div>
                                <div>Region: <b style='color:#fff;'>${json.region || 'N/A'}</b></div>
                                <div>ISP: <b style='color:#fff;'>${json.connection ? json.connection.isp : 'N/A'}</b></div>
                            `;
                            updateTestDisplay(html, "rgba(0,255,136,0.08)");
                        } else {
                            updateTestDisplay(`<div style='color:#FF4444; font-weight:bold;'>❌ API error</div><div style='color:#ccc;'>${json.message || 'Unknown'}</div>`, "rgba(255,0,0,0.1)");
                        }
                    } catch(e) {
                        updateTestDisplay(`<div style='color:#FF4444; font-weight:bold;'>❌ Parse error</div><div style='color:#ccc;'>${e.message}</div>`, "rgba(255,0,0,0.1)");
                    }
                },
                onerror: function() {
                    updateTestDisplay(`<div style='color:#FF4444; font-weight:bold;'>❌ Network error</div><div style='color:#ccc;'>Could not reach ipwho.is.</div>`, "rgba(255,0,0,0.1)");
                },
                ontimeout: function() {
                    updateTestDisplay(`<div style='color:#FFA500; font-weight:bold;'>⏱️ Timed out (8s)</div>`, "rgba(255,140,0,0.15)");
                }
            });
        };
        testIpBtn.onmouseover = () => { testIpBtn.style.background = '#2a4a2a'; };
        testIpBtn.onmouseout = () => { testIpBtn.style.background = '#1a3a1a'; };
        ipInputRow.appendChild(ipInput);
        ipInputRow.appendChild(testIpBtn);

        diagGroup.appendChild(testResult);
        diagGroup.appendChild(testApiBtn);
        diagGroup.appendChild(ipInputRow);
        diagGroup.lastChild.style.borderBottom = "none";
        content.appendChild(diagGroup);

        // 7. FOOTER LINKS
        const footerGroup = createGroup();
        Object.assign(footerGroup.style, { marginTop: "20px" });

        const createLinkRow = (text, icon, color, url) => {
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            Object.assign(a.style, rowStyle);
            a.style.textDecoration = "none";
            rowHover(a);

            const ico = document.createElement("div"); ico.innerText = icon;
            Object.assign(ico.style, { fontSize: "18px", marginRight: "12px", width: "20px", textAlign: "center" });

            const txt = document.createElement("div");
            txt.innerText = text;
            Object.assign(txt.style, { fontWeight: "bold", fontSize: "13px", color: color, flex: "1" });

            const arrow = document.createElement("div");
            arrow.innerHTML = "↗";
            arrow.style.color = "#555"; arrow.style.fontSize = "16px";

            a.appendChild(ico); a.appendChild(txt); a.appendChild(arrow);
            return a;
        };

        footerGroup.appendChild(createLinkRow("GitHub (ome-ip)", "💻", "#666", "https://github.com/EolnMsuk"));
        footerGroup.appendChild(createLinkRow("Discord (OmegleStream)", "💬", "#7289da", "https://discord.gg/omeglestream"));
        footerGroup.appendChild(createLinkRow("Donate ($eolnmsuk)", "💸", "#00D632", "https://cash.app/$eolnmsuk"));
        footerGroup.lastChild.style.borderBottom = "none";
        content.appendChild(footerGroup);

        win.appendChild(content); document.body.appendChild(win); makeDraggable(header, win); sandboxWindowEvents(win);

        if (targetId) {
             const el = document.getElementById(targetId);
             if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        } else {
             content.scrollTop = 0;
        }
    }

    // [REQ 9] NEW NOTES LIST WINDOW
    function createNotesListWindow() {
        if (document.getElementById("ome-notes-list-window")) {
            const w = document.getElementById("ome-notes-list-window");
            w.style.display = w.style.display === "none" ? "flex" : "none";
            if(w.style.display === "flex") renderNotesList();
            return;
        }

        const win = document.createElement("div"); win.id = "ome-notes-list-window"; win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            position: "fixed", top: "150px", left: "200px", width: "400px", height: "500px",
            backgroundColor: "rgba(17, 17, 17, 0.98)", backdropFilter: "blur(10px)", color: "#FFF",
            zIndex: "100000020",
            borderRadius: "12px", border: "1px solid #555",
            display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.8)"
        });

        // Header
        const header = document.createElement("div");
        Object.assign(header.style, { padding: "12px", borderBottom: "1px solid #444", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(34,34,34,0.8)", borderRadius: "12px 12px 0 0" });
        header.innerHTML = "<span style='font-size:14px; font-weight:bold;'>📝 Saved Notes</span>";

        const headerBtns = document.createElement("div"); headerBtns.style.display = "flex"; headerBtns.style.gap = "8px";

        // Copy All Button
        const copyAllBtn = document.createElement("button"); copyAllBtn.innerText = "📋 Copy All";
        Object.assign(copyAllBtn.style, { padding: "4px 8px", background: "#007BFF", border: "none", borderRadius: "4px", color: "white", fontSize: "11px", cursor: "pointer" });
        copyAllBtn.onclick = () => {
            const { history } = loadData();
            const entries = Object.entries(history).filter(([ip, data]) => data.note && data.note.trim());
            if(entries.length === 0) return showToast("No notes to copy", win);
            const txt = entries.map(([ip, data]) => `IP: ${ip}\nNote: ${data.note}\n`).join("\n---\n");
            navigator.clipboard.writeText(txt).then(() => showToast("All Notes Copied", win));
        };

        // Delete All Button
        const delAllBtn = document.createElement("button"); delAllBtn.innerText = "🗑️ Del All";
        Object.assign(delAllBtn.style, { padding: "4px 8px", background: "#DC3545", border: "none", borderRadius: "4px", color: "white", fontSize: "11px", cursor: "pointer" });
        delAllBtn.onclick = () => {
            if(!confirm("Delete ALL notes? This removes notes from IPs but keeps IP history.")) return;
            const { history } = loadData();
            let count = 0;
            Object.keys(history).forEach(ip => {
                if(history[ip].note) { delete history[ip].note; count++; }
            });
            queueSave(); renderNotesList();
            showToast(`${count} Notes Deleted`, win);
        };

        const closeBtn = document.createElement("button"); closeBtn.innerText = "✖";
        Object.assign(closeBtn.style, { background: "none", border: "none", color: "#aaa", fontSize: "16px", cursor: "pointer", marginLeft: "10px" });
        closeBtn.onclick = () => win.style.display = "none";

        headerBtns.appendChild(copyAllBtn);
        headerBtns.appendChild(delAllBtn);
        headerBtns.appendChild(closeBtn);
        header.appendChild(headerBtns);
        win.appendChild(header);

        // Content
        const content = document.createElement("div"); content.id = "ome-notes-list-content";
        content.className = "ome-scroll-lock";
        Object.assign(content.style, { padding: "10px", overflowY: "auto", flex: "1", display: "flex", flexDirection: "column", gap: "8px" });
        win.appendChild(content);

        document.body.appendChild(win);
        makeDraggable(header, win);
        makeResizable(win);
        sandboxWindowEvents(win);
        renderNotesList();
    }

    function renderNotesList() {
        const container = document.getElementById("ome-notes-list-content");
        if(!container) return;
        container.innerHTML = "";

        const { history, blockedIPs } = loadData();
        const entries = Object.entries(history).filter(([ip, data]) => data.note && data.note.trim() !== "");

        if(entries.length === 0) {
            container.innerHTML = "<div style='text-align:center; color:#666; padding:20px;'>No saved notes found.</div>";
            return;
        }

        // Sort newest first based on lastSeen
        entries.sort((a,b) => (b[1].lastSeen || 0) - (a[1].lastSeen || 0));

        entries.forEach(([ip, data]) => {
            const item = document.createElement("div");
            Object.assign(item.style, {
                background: "rgba(255,255,255,0.05)",
                borderRadius: "6px",
                border: "1px solid #333",
                overflow: "hidden",
                flexShrink: "0"
            });

            // Item Header
            const head = document.createElement("div");
            Object.assign(head.style, { padding: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: "rgba(255,255,255,0.1)" });

            const titleDiv = document.createElement("div");
            const flagSrc = data.wc ? `https://flagcdn.com/h20/${data.wc.toLowerCase()}.png` : "";
            const flagImg = flagSrc ? `<img src="${flagSrc}" style="width:16px; margin-right:6px; vertical-align:middle;">` : "";
            titleDiv.innerHTML = `${flagImg}<span style="font-weight:bold; font-family:monospace; color:#00FF00;">${ip}</span>`;

            const actionsDiv = document.createElement("div"); actionsDiv.style.display = "flex"; actionsDiv.style.gap = "5px";

            // Edit Note Button (NEW)
            const editBtn = document.createElement("button"); editBtn.innerText = "✏️";
            Object.assign(editBtn.style, { border:"none", background:"transparent", cursor:"pointer", fontSize:"14px" });
            editBtn.title = "Edit Note";
            editBtn.onclick = (e) => {
                e.stopPropagation();
                openNoteEditor(ip);
            };

            // Delete Note Button
            const delBtn = document.createElement("button"); delBtn.innerText = "🗑️";
            Object.assign(delBtn.style, { border:"none", background:"transparent", cursor:"pointer", fontSize:"14px" });
            delBtn.title = "Delete Note";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if(confirm("Delete this note?")) {
                    delete history[ip].note; queueSave(); renderNotesList();
                    if(currentIP === ip) refreshStatsWindowDisplay(ip, history[ip], currentApiData);
                }
            };

            actionsDiv.appendChild(editBtn); // Add Edit Button
            actionsDiv.appendChild(delBtn);
            head.appendChild(titleDiv);
            head.appendChild(actionsDiv);

            // Note Body (Default Expanded)
            const body = document.createElement("div");
            Object.assign(body.style, {
                display: "block",
                padding: "10px", fontSize: "13px", color: "#ddd", borderTop: "1px solid #333", wordBreak: "break-word", whiteSpace: "pre-wrap"
            });

            // 1. Thumbnail (If exists)
            if (data.thumb) {
                const img = document.createElement("img");
                img.src = data.thumb;
                Object.assign(img.style, {
                    display: "block", maxWidth: "100%", maxHeight: "120px", borderRadius: "4px",
                    border: "1px solid #444", marginBottom: "8px", cursor: "pointer"
                });
                img.onclick = () => {
                    const w = window.open();
                    w.document.write(`<body style='margin:0; background:#111; display:flex; justify-content:center; align-items:center; height:100vh;'><img src='${data.thumb}' style='max-width:100%; max-height:100%; box-shadow:0 0 20px #000;'></body>`);
                };
                body.appendChild(img);
            }

            // 2. Note Text
            const noteTxt = document.createElement("div");
            noteTxt.innerHTML = safe(data.note);
            noteTxt.style.marginBottom = "10px";
            body.appendChild(noteTxt);

            // 3. Action Buttons Row
            const btnRow = document.createElement("div");
            btnRow.style.display = "flex"; btnRow.style.gap = "8px";

            // Copy Note
            const copyBtn = document.createElement("button");
            copyBtn.innerText = "Copy Note";
            Object.assign(copyBtn.style, { padding:"4px 8px", background:"#444", border:"none", borderRadius:"3px", color:"#fff", fontSize:"10px", cursor:"pointer" });
            copyBtn.onclick = (e) => { e.stopPropagation(); navigator.clipboard.writeText(data.note).then(() => showToast("Note Copied")); };

            // Block/Unblock IP Button
            const blockBtn = document.createElement("button");

            const updateBtnVisuals = () => {
                const isNowBlocked = blockedIPs.has(ip);
                blockBtn.innerText = isNowBlocked ? "✅ Unblock" : "🚫 Block IP";
                Object.assign(blockBtn.style, {
                    padding:"4px 8px",
                    background: isNowBlocked ? "#28a745" : "#A00000",
                    border: isNowBlocked ? "1px solid #20c997" : "1px solid #FF0000",
                    borderRadius:"3px", color:"#fff", fontSize:"10px", cursor: "pointer", minWidth: "60px"
                });
            };

            updateBtnVisuals();

            blockBtn.onclick = (e) => {
                e.stopPropagation();
                if (blockedIPs.has(ip)) {
                    blockedIPs.delete(ip);
                    showToast(`Unblocked ${ip}`);
                } else {
                    blockedIPs.add(ip);
                    showToast(`Blocked ${ip}`);
                }
                queueSave();
                updateBtnVisuals();

                const settingsWin = document.getElementById("ome-settings-window");
                if (settingsWin && settingsWin.style.display === "flex" && lastActiveTab === "tab-ips") {
                    renderBlockedIPs();
                }
            };

            btnRow.appendChild(copyBtn);
            btnRow.appendChild(blockBtn);
            body.appendChild(btnRow);

            head.onclick = () => {
                const isOpen = body.style.display === "block";
                body.style.display = isOpen ? "none" : "block";
                head.style.background = isOpen ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.15)";
            };

            item.appendChild(head);
            item.appendChild(body);
            container.appendChild(item);
        });
    }

    // --- SCREENSHOT HISTORY WINDOW ---
    function createScreenshotHistoryWindow() {
        if (document.getElementById("ome-screenshot-history-window")) {
            const w = document.getElementById("ome-screenshot-history-window");
            w.style.display = w.style.display === "none" ? "flex" : "none";
            if(w.style.display === "flex") renderScreenshotHistory();
            return;
        }

        const win = document.createElement("div"); win.id = "ome-screenshot-history-window"; win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            position: "fixed", top: "150px", left: "250px", width: "420px", height: "550px",
            backgroundColor: "rgba(17, 17, 17, 0.98)", backdropFilter: "blur(10px)", color: "#FFF",
            zIndex: "100000025",
            borderRadius: "12px", border: "1px solid #555",
            display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.8)"
        });

        const header = document.createElement("div");
        Object.assign(header.style, { padding: "12px", borderBottom: "1px solid #444", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(34,34,34,0.8)", borderRadius: "12px 12px 0 0" });
        header.innerHTML = "<span style='font-size:14px; font-weight:bold;'>📸 Saved Screenshots</span>";

        const headerBtns = document.createElement("div"); headerBtns.style.display = "flex"; headerBtns.style.gap = "8px";

        const delAllBtn = document.createElement("button"); delAllBtn.innerText = "🗑️ Del All";
        Object.assign(delAllBtn.style, { padding: "4px 8px", background: "#DC3545", border: "none", borderRadius: "4px", color: "white", fontSize: "11px", cursor: "pointer" });
        delAllBtn.onclick = () => {
            if(!confirm("Delete ALL screenshots? This cannot be undone.")) return;
            const { history } = loadData();
            let count = 0;
            Object.keys(history).forEach(ip => {
                if(history[ip].thumb) { delete history[ip].thumb; count++; }
            });
            queueSave(); renderScreenshotHistory();
            showToast(`${count} Screenshots Deleted`, win);
        };

        const closeBtn = document.createElement("button"); closeBtn.innerText = "✖";
        Object.assign(closeBtn.style, { background: "none", border: "none", color: "#aaa", fontSize: "16px", cursor: "pointer", marginLeft: "10px" });
        closeBtn.onclick = () => win.style.display = "none";

        headerBtns.appendChild(delAllBtn);
        headerBtns.appendChild(closeBtn);
        header.appendChild(headerBtns);
        win.appendChild(header);

        const content = document.createElement("div"); content.id = "ome-screenshot-list-content";
        content.className = "ome-scroll-lock";
        Object.assign(content.style, { padding: "10px", overflowY: "auto", flex: "1", display: "flex", flexDirection: "column", gap: "8px" });
        win.appendChild(content);

        document.body.appendChild(win);
        makeDraggable(header, win);
        makeResizable(win);
        sandboxWindowEvents(win);
        renderScreenshotHistory();
    }

    function renderScreenshotHistory() {
        const container = document.getElementById("ome-screenshot-list-content");
        if(!container) return;
        container.innerHTML = "";

        const { history, blockedIPs } = loadData();
        const entries = Object.entries(history).filter(([ip, data]) => data.thumb);

        if(entries.length === 0) {
            container.innerHTML = "<div style='text-align:center; color:#666; padding:20px;'>No screenshots saved yet.<br><br><span style='font-size:11px'>Thumbnails are captured automatically 2.5s after connection.</span></div>";
            return;
        }

        entries.sort((a,b) => (b[1].lastSeen || 0) - (a[1].lastSeen || 0));

        entries.forEach(([ip, data]) => {
            const item = document.createElement("div");
            Object.assign(item.style, {
                background: "rgba(255,255,255,0.05)",
                borderRadius: "6px",
                border: "1px solid #333",
                overflow: "hidden",
                flexShrink: "0"
            });

            const head = document.createElement("div");
            Object.assign(head.style, { padding: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.1)" });

            const titleDiv = document.createElement("div");
            const flagSrc = data.wc ? `https://flagcdn.com/h20/${data.wc.toLowerCase()}.png` : "";
            const flagImg = flagSrc ? `<img src="${flagSrc}" style="width:16px; margin-right:6px; vertical-align:middle;">` : "";
            const dateStr = data.lastSeen ? new Date(data.lastSeen).toLocaleDateString() : "";
            titleDiv.innerHTML = `${flagImg}<span style="font-weight:bold; font-family:monospace; color:#00FFFF;">${ip}</span> <span style="font-size:10px; color:#aaa; margin-left:5px;">(${dateStr})</span>`;

            const actionsDiv = document.createElement("div"); actionsDiv.style.display = "flex"; actionsDiv.style.gap = "5px";

            // Edit Note Button
            const editBtn = document.createElement("button"); editBtn.innerText = "✏️";
            Object.assign(editBtn.style, { border:"none", background:"transparent", cursor:"pointer", fontSize:"14px" });
            editBtn.title = "Add/Edit Note";
            editBtn.onclick = (e) => {
                e.stopPropagation();
                openNoteEditor(ip);
            };

            // Delete Screenshot Button
            const delBtn = document.createElement("button"); delBtn.innerText = "🗑️";
            Object.assign(delBtn.style, { border:"none", background:"transparent", cursor:"pointer", fontSize:"14px" });
            delBtn.title = "Delete Screenshot";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if(confirm("Delete this screenshot?")) {
                    delete history[ip].thumb; queueSave(); renderScreenshotHistory();
                    if(currentIP === ip) refreshStatsWindowDisplay(ip, history[ip], currentApiData);
                }
            };

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(delBtn);
            head.appendChild(titleDiv);
            head.appendChild(actionsDiv);

            const body = document.createElement("div");
            Object.assign(body.style, { padding: "8px", background: "#000", textAlign: "center", borderTop: "1px solid #333", display: "flex", flexDirection: "column", gap: "8px" });

            // Image
            const img = document.createElement("img");
            img.src = data.thumb;
            Object.assign(img.style, { maxWidth: "100%", maxHeight: "200px", borderRadius: "4px", border: "1px solid #444", cursor: "pointer", alignSelf: "center" });
            img.onclick = () => {
                const w = window.open();
                w.document.write(`<body style='margin:0; background:#111; display:flex; justify-content:center; align-items:center; height:100vh;'><img src='${data.thumb}' style='max-width:100%; max-height:100%; box-shadow:0 0 20px #000;'></body>`);
                w.document.close();
            };
            body.appendChild(img);

            // Show Note if exists
            if (data.note) {
                const noteDiv = document.createElement("div");
                noteDiv.innerHTML = `<span style="color:#FFD700; font-weight:bold;">Note:</span> ${safe(data.note)}`;
                Object.assign(noteDiv.style, { fontSize: "12px", color: "#ddd", textAlign: "left", padding: "5px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" });
                body.appendChild(noteDiv);
            }

            // Block/Unblock Button
            const blockBtn = document.createElement("button");
            const updateBtnVisuals = () => {
                const isNowBlocked = blockedIPs.has(ip);
                blockBtn.innerText = isNowBlocked ? "✅ Unblock IP" : "🚫 Block IP";
                Object.assign(blockBtn.style, {
                    padding:"6px 12px",
                    width: "100%",
                    background: isNowBlocked ? "#28a745" : "#A00000",
                    border: isNowBlocked ? "1px solid #20c997" : "1px solid #FF0000",
                    borderRadius:"3px", color:"#fff", fontSize:"12px", cursor: "pointer", fontWeight: "bold"
                });
            };
            updateBtnVisuals();
            blockBtn.onclick = (e) => {
                e.stopPropagation();
                if (blockedIPs.has(ip)) {
                    blockedIPs.delete(ip);
                    showToast(`Unblocked ${ip}`);
                } else {
                    blockedIPs.add(ip);
                    showToast(`Blocked ${ip}`);
                }
                queueSave();
                updateBtnVisuals();
            };
            body.appendChild(blockBtn);

            item.appendChild(head);
            item.appendChild(body);
            container.appendChild(item);
        });
    }


    // --- NOTE WINDOW ---

    function createNoteWindow() {
        if (document.getElementById("note-input-window")) return;
        const win = document.createElement("div"); win.id = "note-input-window"; win.className = "ome-no-select resizable-win";
        Object.assign(win.style, {
            position: "fixed", top: "400px", left: "10px", width: "300px", backgroundColor: "rgba(60, 60, 0, 0.85)", backdropFilter: "blur(10px)", color: "#FFFFFF",
            // [FIX] Increased Z-Index to sit above the Notes List Window
            zIndex: "100000030",
            borderRadius: "10px", border: "2px solid rgba(255, 215, 0, 0.5)", display: "none", flexDirection: "column", padding: "10px"
        });

        const header = document.createElement("div"); header.id = "note-window-header";
        Object.assign(header.style, { marginBottom: "8px", fontSize: "12px", color: "#eee", cursor: "default", padding: "6px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "6px", textAlign: "center", fontWeight: "bold" });
        win.appendChild(header);

        const textarea = document.createElement("textarea"); textarea.id = "note-textarea";
        Object.assign(textarea.style, { width: "100%", flex: "1", backgroundColor: "rgba(0,0,0,0.2)", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "4px", padding: "8px", fontSize: "14px", resize: "none", marginBottom: "8px", fontFamily: "sans-serif", outline: "none", userSelect: "text" });
        textarea.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNoteAction(); } });
        textarea.onmousedown = (e) => e.stopPropagation();
        win.appendChild(textarea);

        const btnRow = document.createElement("div"); btnRow.style.display = "flex"; btnRow.style.justifyContent = "space-between";
        const cancelBtn = document.createElement("button"); cancelBtn.innerText = "Cancel"; Object.assign(cancelBtn.style, { backgroundColor: "rgba(255, 255, 255, 0.1)", color: "#ccc", border: "none", borderRadius: "4px", padding: "6px 12px", cursor: "pointer" });
        cancelBtn.onclick = closeNoteEditor; cancelBtn.onmousedown = (e) => e.stopPropagation();
        const saveBtn = document.createElement("button"); saveBtn.innerText = "Done"; Object.assign(saveBtn.style, { backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", padding: "6px 12px", cursor: "pointer", fontWeight: "bold" });
        saveBtn.onclick = saveNoteAction; saveBtn.onmousedown = (e) => e.stopPropagation();
        btnRow.appendChild(cancelBtn); btnRow.appendChild(saveBtn); win.appendChild(btnRow);

        document.body.appendChild(win);
        makeDraggable(header, win);
        makeDraggable(win, win);
        sandboxWindowEvents(win);
    }

    function toggleChatInputDisability(disable) {
        const chatInputs = document.querySelectorAll('.chat__textarea, #chat-text, .chat__textfield, textarea:not(#note-textarea)');
        chatInputs.forEach(el => {
            if (disable) {
                el.classList.add('chat-disabled');
                el.setAttribute('tabindex', '-1');
                el.setAttribute('readonly', 'true');
            }
            else {
                el.classList.remove('chat-disabled');
                el.removeAttribute('tabindex');
                el.removeAttribute('readonly');
            }
        });
    }

    // [FIX 4] AGGRESSIVE FOCUS PROTECTION
    // 1. Trap focus inside our windows when they are open
    // 2. Intercept site attempts to steal focus (focus hijacking)

    // Override the native .focus() method on HTML elements
    const nativeFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function(...args) {
        // If Note Editor is open, deny focus to anything else
        if (isEditing) {
            const noteArea = document.getElementById('note-textarea');
            // Allow focus only if it's our note area or buttons inside our window
            if (this === noteArea || this.closest('#note-input-window')) {
                return nativeFocus.apply(this, args);
            }
            // Deny focus to site elements (chat box)
            return;
        }

        // If Settings Window is open, deny focus to site elements (prevent glitching)
        const settingsWin = document.getElementById('ome-settings-window');
        if (settingsWin && settingsWin.style.display === 'flex') {
            if (this.closest('#ome-settings-window')) {
                return nativeFocus.apply(this, args);
            }
            // Optional: Allow chat focus if you still want to type while settings are open,
            // but usually blocking it prevents the "glitch/close" behavior.
            // return; // Uncomment to strict block
        }

        return nativeFocus.apply(this, args);
    };

    // Existing event listener to catch bubbling focus events
    window.addEventListener('focus', function(e) {
        if (isEditing) {
            const target = e.target;
            // If focus lands on something that isn't our note window
            if (target && !target.closest('#note-input-window')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const noteInput = document.getElementById('note-textarea');
                if (noteInput) {
                    nativeFocus.call(noteInput); // Use native to avoid recursion
                }
            }
        }
    }, true);

    // Stop Key events from bubbling to the site when typing in our windows
    const stopPropagation = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    };

    function sandboxWindowEvents(win) {
        if (!win) return;

        // Removed 'mouseup' from this list so the drag-stop event can reach the document
        ['keydown', 'keyup', 'keypress', 'mousedown', 'click'].forEach(evt => {
            win.addEventListener(evt, (e) => {
                // CHANGED: Allow Escape key to pass through to the website
                // This lets you skip using the keyboard even if the IP window is focused
                if (e.key === 'Escape') return;

                e.stopPropagation();
            });
        });
    }

    function openNoteEditor(ip) {
        isEditing = true; editingIP = ip;
        const win = document.getElementById("note-input-window");
        const header = document.getElementById("note-window-header");
        const textarea = document.getElementById("note-textarea");
        const { history } = loadData();
        textarea.value = (history[ip] && history[ip].note) ? history[ip].note : "";
        header.innerHTML = `Note for: <span style="user-select:none">${ip}</span>`;
        win.style.display = "flex";
        toggleChatInputDisability(true);
        setTimeout(() => textarea.focus(), 50);
    }

    function closeNoteEditor() {
        isEditing = false; editingIP = null;
        toggleChatInputDisability(false);
        document.getElementById("note-input-window").style.display = "none";
    }

    function saveNoteAction() {
        if (!editingIP) return;
        const textarea = document.getElementById("note-textarea");
        const newText = textarea.value.trim();
        const { history } = loadData();
        if (!history[editingIP]) history[editingIP] = { count: 1, lastSeen: Date.now() };

        if (newText === "") delete history[editingIP].note;
        else history[editingIP].note = newText;

        queueSave();

        // Update Main Stats Window if we are currently connected to this IP
        if (currentIP === editingIP) refreshStatsWindowDisplay(currentIP, history[currentIP], currentApiData);

        // [FIX] Update the Saved Notes List Window if it is open
        const notesWin = document.getElementById("ome-notes-list-window");
        if (notesWin && notesWin.style.display === "flex") {
            renderNotesList();
        }

        closeNoteEditor();
    }

    // --- MAIN DISPLAY LOGIC ---

    function refreshStatsWindowDisplay(ip, userData, apiData = null) {
        const contentArea = document.getElementById("ip-stats-area");
        if (!contentArea) return;

        const blockBtn = document.getElementById("btn-block-skip");
        const editBtn = document.getElementById("ip-btn-edit");
        const mapBtn = document.getElementById("ome-map-btn-ctrl");
        const footerNextBtn = document.getElementById("ome-next-btn-footer");

        if (blockBtn) {
            if (!ipBlockingEnabled || isRelayIP || !ip) { blockBtn.style.display = "none"; if(footerNextBtn) footerNextBtn.style.flex = "100%"; }
            else { blockBtn.style.display = "block"; blockBtn.style.flex = "1"; if(footerNextBtn) footerNextBtn.style.flex = "1"; }
        }

        if (mapBtn) mapBtn.style.display = (isRelayIP || !ip) ? "none" : "block";
        if (editBtn) editBtn.style.display = !ip ? "none" : "block";

        const count = userData ? userData.count : 1;
        const noteText = userData ? userData.note : "";

        // Logic for Note
        const noteHtml = noteText ? `<div class="ome-yellow-note" style="margin: 6px 0; padding: 5px; background: rgba(255,255,0,0.3); border-left: 3px solid yellow; color: #fff; font-size: 13px; text-shadow: none !important; width: fit-content; max-width: 100%; word-wrap: break-word;">${safe(noteText)}</div>` : "";

        // [CHANGED] Logic for Thumbnail - Added ID, removed inline onclick
        // Added margin-bottom to separate it from the IP box below it
        const thumbUrl = userData ? userData.thumb : null;
        const thumbHtml = thumbUrl ? `<img src="${thumbUrl}" id="ome-main-thumb" style="display:block; margin: 5px 0 10px 0; border:1px solid #555; border-radius:4px; width:120px; height:auto; cursor:pointer;" title="Click to Open Saved Screenshots" alt="User Thumbnail">` : "";

        const copyBtnStyle = isWindowTransparent ? "border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: rgba(255,255,255,0.8); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; padding: 2px 6px; font-weight: bold;" : "border-radius: 4px; border: 1px solid #777; background: #000; color: #eee; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; padding: 2px 6px; font-weight: bold;";
        const copyBtn = `<div class="ome-no-select ip-copy-btn" style="${copyBtnStyle}" title="Copy IP" onclick="window.navigator.clipboard.writeText('${ip}').then(() => { const win=document.getElementById('ip-log-window'); if(!win)return; let t=win.querySelector('.ome-toast'); if(!t){t=document.createElement('div'); t.className='ome-toast ome-no-select'; win.appendChild(t);} t.innerText='Copied IP to clipboard!'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1500); })">Copy</div>`;
        const ipWrapperStyle = "display: inline-flex; align-items: center; gap: 8px; border: 1px solid #666; padding: 3px 6px; border-radius: 4px; background-color: rgba(0,0,0,0.4); max-width: 100%; box-sizing: border-box; flex-wrap: wrap; width: fit-content; margin-top: 5px;";
        const blurStyle = "filter: blur(3px); cursor: pointer; transition: 0.2s; user-select: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; display: inline-block; vertical-align: middle;";
        const toggleScript = "this.style.filter = this.style.filter === 'none' ? 'blur(3px)' : 'none'";
        const fontStyle = "font-family: system-ui, sans-serif; line-height: 1.3;";
        const outlineClass = isWindowTransparent ? "ome-text-outline-thick" : "ome-text-outline";

        let html = "";

        if (isRelayIP) {
            const isp = apiData && apiData.connection ? apiData.connection.isp : "Unknown ISP";
            const loc = apiData ? `${apiData.city||""}, ${apiData.region||""}` : "Unknown Location";
            html = `
                <div style="${fontStyle}" class="${outlineClass}">
                    <div style="font-size: 16px; font-weight: 700; color: #FF4444; margin-bottom: 2px;">⚠️ Relay IP Detected</div>
                    <div style="font-size: 13px; font-weight: bold; color: #FF0000; margin-bottom: 5px;">Reason: TURN Server / Proxy</div>
                    <div style="font-size: 14px; font-weight:bold; color: #FF7777; margin-bottom: 2px;">${safe(loc)}</div>
                    <div style="font-size: 12px; color: #FF7777; margin-bottom: 5px;">${safe(isp)}</div>

                    ${noteHtml}

                    <div style="font-size: 18px; color: #aaa; margin-bottom: 5px;">
                        Seen ${count} ${count===1?"time":"times"} <span style="color:#888">  •  <span id='ip-call-timer'>${formatTime(callSeconds)}</span></span>
                    </div>

                    ${thumbHtml}

                    <div style="${ipWrapperStyle}">
                         <span title="Click to reveal" onclick="${toggleScript}" style="color:#FF9536; font-size: 16px; ${blurStyle}">${safe(ip)}</span> ${copyBtn}
                    </div>
                </div>`;
        } else if (apiData) {
            const countryCode = apiData.country_code ? apiData.country_code.toLowerCase() : "un";
            const lang = LANG_MAP[countryCode] || "Unknown";

            const headerRow = `
                <div style="margin-bottom: 5px;">
                    <div style="font-size: 10px; color: #bbb; font-weight: bold; margin-bottom: 2px; opacity: 0.8; text-transform: uppercase;">${lang}</div>
                    <div style="display: flex; align-items: center;">
                        <img src="https://flagcdn.com/h24/${countryCode}.png" draggable="false" style="height: 16px; width: auto; margin-right: 8px; filter: drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000);" alt="">
                        <span style="font-size: 16px; font-weight: 600; color: #fff;">${safe(apiData.country || "Unknown")}</span>
                    </div>
                </div>
            `;
            html = `
                <div style="${fontStyle}" class="${outlineClass}">
                    ${headerRow}
                    <div style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 2px;">
                        ${safe(apiData.city)}, ${safe(apiData.region)}
                    </div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                        ${safe(apiData.connection ? apiData.connection.isp : "")}
                    </div>

                    ${noteHtml}

                    <div style="font-size: 18px; color: #aaa; margin-bottom: 5px;">
                        Seen ${count} ${count===1?"time":"times"} <span style="color:#888">  •  <span id='ip-call-timer'>${formatTime(callSeconds)}</span></span>
                    </div>

                    ${thumbHtml}

                     <div style="${ipWrapperStyle}">
                         <span title="Click to reveal" onclick="${toggleScript}" style="color:#FF9536; font-size: 16px; ${blurStyle}">${safe(ip)}</span> ${copyBtn}
                    </div>
                </div>`;
        } else {
            html = `<div style="${fontStyle}" class="${outlineClass}"> <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 8px;">⏳ Fetching...</div> <div style="margin-top: 4px;"> <span title="Click to reveal" onclick="${toggleScript}" style="color:#FF9536; font-size: 18px; ${blurStyle}">${ip||""}</span> </div> </div>`;
        }
        // [NEW] Gender tag row (badge + tag pills + remove) - inserted before render
        try {
            const curTag = currentIP ? getStoredGender(currentIP) : null;

            // Tag styling now lives in the shared GENDER const at IIFE top.

            const tagPillStyle = (color, bg) =>
                `padding:3px 7px; border:1px solid ${color}; border-radius:4px; ` +
                `background:${bg}; color:${color}; font-size:13px; font-family:sans-serif; ` +
                `cursor:pointer; margin-right:4px; user-select:none;`;

            const renderBadge = (cur) => {
                // Gate null AND unknown codes (defensive: legacy sessionStorage
                // entries from older schema could leak invalid values).
                if (!cur || !GENDER.hasCode(cur)) return '';
                const p = GENDER.entryForCode(cur);
                return `<span style="padding:3px 8px; border:1px solid ${p.color}; border-radius:4px; ` +
                       `background:${p.color}33; color:${p.color}; font-size:11px; font-weight:bold; ` +
                       `margin-right:6px;" title="Tagged as ${p.label}">${p.label}</span>`;
            };

            const tagBadge = renderBadge(curTag);
            const removePill = curTag
                ? `<span id="gender-row-rm" style="${tagPillStyle('#FF4444', 'rgba(255,68,68,0.10)')}" title="Clear tag">✕</span>`
                : '';

            // Multi-button layout: icon | label
            // Tag pill render order: f (Woman), m (Man), u (Unknown). Hard-coded on purpose so display order survives DATA re-shuffle.
            const tagPills = ['f', 'm', 'u'].map(g => {
                const p = GENDER.entryForCode(g);
                // Strong visual selection indicator so the active stored tag is
                // unmistakable: outer glow + filled background + inverted text.
                // selStyle is appended AFTER tagPillStyle so its `background` &
                // `color` props override the defaults.
                const isActive = (curTag === g);
                const selStyle = isActive
                    ? ` box-shadow: 0 0 0 2px ${p.color}; background: ${p.color}66; color: #fff;`
                    : '';
                return `<span id="gender-row-${g}" data-gender="${g}" ` +
                       `style="${tagPillStyle(p.color, p.bg)}${selStyle}" ` +
                       `title="${isActive ? 'Currently tagged as' : 'Tag current partner as'} ${p.label.trim()}">${p.icon}</span>`;
            }).join('');

            html +=
                `<div id="gender-tag-row" style="margin-top:8px; padding-top:6px; border-top:1px solid #333; ` +
                `display:flex; align-items:center; flex-wrap:wrap; gap:4px;">` +
                `<span style="font-size:11px; color:#888; margin-right:4px;">Tag:</span>` +
                tagBadge + tagPills + removePill +
                `</div>`;
        } catch(e) { /* never break the stats window */ }

        contentArea.innerHTML = html;

        // [NEW] Wire tag buttons after re-render
        try {
            const applyTag = (gender) => {
                if (!currentIP) { showToast("No IP to tag yet"); return; }
                setStoredGender(currentIP, gender);
                if (window.__omeGenderStatsUpdate) window.__omeGenderStatsUpdate();
                showToast("Tagged as " + GENDER.nameOf(gender));
                // If the new tag matches an active skip filter, skip the current partner.
                if (GENDER.shouldSkipTag(genderFilterMode, gender)) {
                    performSmartSkip(GENDER.skipReasonFor(gender));
                }
                refreshStatsWindowDisplay(currentIP, isRelayIP, currentApiData);
            };
            // Click handlers match tagPills render order: f, m, u.
            ['f', 'm', 'u'].forEach(g => {
                const el = document.getElementById('gender-row-' + g);
                if (el) el.onclick = (ev) => { ev.stopPropagation(); applyTag(g); };
            });
            const rmEl = document.getElementById('gender-row-rm');
            if (rmEl) rmEl.onclick = (ev) => {
                ev.stopPropagation();
                if (!currentIP) return;
                setStoredGender(currentIP, null);
                if (window.__omeGenderStatsUpdate) window.__omeGenderStatsUpdate();
                showToast("Tag cleared");
                refreshStatsWindowDisplay(currentIP, isRelayIP, currentApiData);
            };
        } catch(e) { /* silently swallow wiring errors */ }

        // [NEW] Attach Event Listener to the Thumbnail after HTML injection
        const thumbEl = document.getElementById("ome-main-thumb");
        if (thumbEl) {
            thumbEl.onclick = (e) => {
                e.stopPropagation();
                createScreenshotHistoryWindow();
            };
        }
    }

    // --- WEBRTC (Stealth Mode + Active IP Detection) ---
    if (FAKE_CONFIG.forceRelay || FAKE_CONFIG.udpStrict) { const NativeRTCPeerConnection = window.RTCPeerConnection;

    const HookedRTCPeerConnection = function(...args) {
        // Force Relay Logic
        if (FAKE_CONFIG.forceRelay) {
            if (!args.length) args[0] = {};
            args[0].iceTransportPolicy = 'relay';
        }

        const pc = new NativeRTCPeerConnection(...args);

        pc.addEventListener('connectionstatechange', async () => {
            if (pc.connectionState === 'connected') {
                try {
                    // Poll for stats multiple times (uHelper Logic)
                    // This fixes cases where the IP isn't ready immediately upon connection
                    let attempts = 0;
                    const maxAttempts = 10;

                    const checkStats = async () => {
                        const stats = await pc.getStats();
                        let found = false;

                        for (const stat of stats.values()) {
                            if (stat.type === 'candidate-pair' && stat.state === 'succeeded' && stat.remoteCandidateId) {
                                const remoteCandidate = stats.get(stat.remoteCandidateId);
                                if (remoteCandidate && remoteCandidate.ip) {
                                    console.log(`[Ome-IP] Active Connection (Attempt ${attempts+1}): ${remoteCandidate.ip}`);

                                    // Logic: Keep Direct IP if we have it, don't overwrite with Relay
                                    if (currentRelayType === "Direct" && remoteCandidate.candidateType === 'relay') {
                                        return;
                                    }

                                    currentIP = remoteCandidate.ip;
                                    isRelayIP = (remoteCandidate.candidateType === 'relay');
                                    currentRelayType = isRelayIP ? "Relay" : "Direct";
                                    getLocation(currentIP);
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (!found && attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkStats, 200); // Retry every 200ms
                        }
                    };
                    checkStats();

                } catch (e) { console.error("[Ome-IP] getStats failed", e); }
            }
        });

        return pc;
    };

    HookedRTCPeerConnection.prototype = NativeRTCPeerConnection.prototype;
    Object.defineProperty(HookedRTCPeerConnection, 'name', { value: 'RTCPeerConnection' });
    Object.defineProperty(HookedRTCPeerConnection, 'toString', { value: function() { return NativeRTCPeerConnection.toString(); }, writable: true, configurable: true });
    window.RTCPeerConnection = HookedRTCPeerConnection; }

    // --- Hook addIceCandidate with Native Masking ---
    const nativeAddIceCandidate = window.RTCPeerConnection.prototype.addIceCandidate;

    const hookedAddIceCandidate = function(iceCandidate, ...args) {
        // [NEW] STRICT UDP ENFORCEMENT (Controlled by UDP ONLY button)
        // If strict mode is on, we aggressively block any candidate that isn't a Relay.
        // This ensures the connection fails if a direct P2P connection is attempted.
        if (FAKE_CONFIG.udpStrict && iceCandidate && iceCandidate.candidate) {
            // Check if the candidate string contains 'typ relay'
            if (!iceCandidate.candidate.includes("typ relay")) {
                return; // Drop it silently (Block P2P)
            }
        }

        // 1. Check if IP Grabbing is globally enabled
        if (!isIPGrabbingEnabled) {
            if (typeof nativeAddIceCandidate !== 'undefined') {
                return nativeAddIceCandidate.apply(this, [iceCandidate, ...args]);
            }
            return;
        }

        if (iceCandidate && iceCandidate.candidate) {
            try {
                const rawCandidate = iceCandidate.candidate;
                const parts = rawCandidate.split(' ');

                // Robust Relay Parsing: Find 'typ' keyword dynamically
                let typeField = "host"; // Default
                const typeIndex = parts.indexOf("typ");
                if (typeIndex !== -1 && parts.length > typeIndex + 1) {
                    typeField = parts[typeIndex + 1];
                }
                // Fallback to index 7 if 'typ' not found (legacy behavior)
                else if (parts.length >= 8) {
                    typeField = parts[7];
                }

                // Regex Definitions
                const ipv4Regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                const ipv6Regex = /([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){0,7}::[a-f0-9]{0,4})/;
                const privateIpRegex = /^(10\.|192\.168\.|192\.0\.0\.|172\.(1[6-9]|2\d|3[0-1])\.|127\.|100\.)/;

                let incomingIP = null;
                let isIncomingV6 = false;

                // Robust IP Extraction
                for (let part of parts) {
                    if (ipv4Regex.test(part) && !part.includes(":")) {
                        incomingIP = part;
                        isIncomingV6 = false;
                        break;
                    }
                    else if (ipv6Regex.test(part)) {
                        incomingIP = part;
                        isIncomingV6 = true;
                        break;
                    }
                }

                // Check for Stripped (.local)
                if (!incomingIP && rawCandidate.includes(".local")) {
                    // Stripped/mDNS candidate ignored
                }

                // --- PREFERENCE LOGIC ---
                if (incomingIP && !privateIpRegex.test(incomingIP)) {

                    const currentIsV4 = currentIP && ipv4Regex.test(currentIP);

                    // RULE 1: If we already have an IPv4, ignore any incoming IPv6
                    if (currentIsV4 && isIncomingV6) {
                        if (typeof nativeAddIceCandidate !== 'undefined') {
                            return nativeAddIceCandidate.apply(this, [iceCandidate, ...args]);
                        }
                        return;
                    }

                    // RULE 2: If we are upgrading from IPv6 to IPv4, or it's a new IP
                    const isUpgrade = (!currentIsV4 && !isIncomingV6);
                    const isNew = (currentIP !== incomingIP);

                    if (isUpgrade || isNew) {
                        const isRelay = (typeField === "relay");
                        const isSrflx = (typeField === "srflx");
                        const isHost = (typeField === "host");
                        const isDirect = isSrflx || (isHost && !isRelay);

                        let shouldUpdate = false;

                        if (isDirect) {
                            shouldUpdate = true;
                        } else if (isRelay) {
                            if (!currentIP || isRelayIP || isUpgrade) {
                                shouldUpdate = true;
                            }
                        }

                        if (shouldUpdate) {
                            currentIP = incomingIP;
                            isRelayIP = isRelay;
                            currentRelayType = isRelay ? "Relay" : "Direct";
                            getLocation(incomingIP);
                        }
                    }
                }
            } catch (e) {
                // Keep silent on errors to prevent console spam
            }
        }

        if (typeof nativeAddIceCandidate !== 'undefined') {
            return nativeAddIceCandidate.apply(this, [iceCandidate, ...args]);
        }
    };

    // Mask the method to look native
    Object.defineProperty(hookedAddIceCandidate, 'toString', {
        value: function() { return nativeAddIceCandidate.toString(); },
        writable: true,
        configurable: true
    });

    window.RTCPeerConnection.prototype.addIceCandidate = hookedAddIceCandidate;

    // [REPLACE YOUR EXISTING getLocation FUNCTION WITH THIS]
    function getLocation(ip) {
        fallbackMethod = 'esc1'; // Reset skip logic

        let retryTimer = null; // Declared here so the cleanup below can reference it

        if (callTimerInterval) clearInterval(callTimerInterval);
        if (retryTimer) clearTimeout(retryTimer);
        callSeconds = 0;
        currentApiData = null;

        logDev("IP", `Target Found: ${ip}`);

        let { history } = loadData();
        if (!history) history = {};

        let count = (history[ip]) ? history[ip].count + 1 : 1;
        history[ip] = {
            count: count,
            lastSeen: Date.now(),
            note: (history[ip] && history[ip].note) ? history[ip].note : "",
            wc: (history[ip] && history[ip].wc) ? history[ip].wc : null,
            thumb: (history[ip] && history[ip].thumb) ? history[ip].thumb : null
        };
        queueSave();
        refreshStatsWindowDisplay(ip, history[ip]);
        checkAndSkipIfBlocked(ip, null); // Check IP block immediately

        // Thumbnail Trigger
        if (isThumbnailCaptureEnabled) {
            setTimeout(() => {
                if (currentIP !== ip) return;
                const thumbData = captureVideoThumbnail();
                if (thumbData) {
                    history[ip].thumb = thumbData;
                    queueSave();
                    refreshStatsWindowDisplay(ip, history[ip], currentApiData);
                }
            }, 2500);
        }

        callTimerInterval = setInterval(() => {
            callSeconds++;
            const t = document.getElementById('ip-call-timer');
            if (t) t.innerText = `${formatTime(callSeconds)}`;
            updateVolume(globalVolume);
        }, 1000);

        // --- HYBRID FETCHER: "Do Both" Logic ---
        const apiUrl = `https://ipwho.is/${ip}`;

        // 1. Define Success Handler (Used by both methods)
        const handleSuccess = (json) => {
            if (currentIP !== ip) return; // Too late
            if (json.success) {
                const normalizedData = {
                    success: true,
                    ip: json.ip,
                    country_code: json.country_code,
                    country: json.country,
                    region: json.region,
                    city: json.city,
                    latitude: json.latitude,
                    longitude: json.longitude,
                    connection: { isp: json.connection ? json.connection.isp : "Unknown" }
                };
                currentApiData = normalizedData;
                // [NEW] Wire both fence-skip paths (race-safe via ipSnapshot guard).
                tryStateFenceSkip(normalizedData, ip);
                tryCSVFenceSkip(normalizedData, ip);
                if (history[ip]) { history[ip].wc = normalizedData.country_code; queueSave(); }
                refreshStatsWindowDisplay(ip, history[ip], normalizedData);
                checkAndSkipIfBlocked(ip, normalizedData.country_code);
                logDev("API", `Details: ${normalizedData.city}, ${normalizedData.region}`);
                
                const mapWin = document.getElementById("ome-map-window");
                if (mapWin && mapWin.style.display === "flex" && !isStreetViewActive) {
                    updateMapContent(mapWin, currentApiData);
                }
            } else {
                logDev("API", `Failed: ${json.message}`);
            }
        };

        // 2. Use GM_xmlhttpRequest with auto-retry (1 retry, 2s delay)
        let retryCount = 0;
        const maxRetries = 1;
        const doFetchLocation = () => {
            logDev("API", `Fetching location for ${ip}...` + (retryCount > 0 ? " (retry " + retryCount + ")" : ""));
            GM_xmlhttpRequest({
                method: "GET",
                url: apiUrl,
                timeout: 8000,
                onload: function(response) {
                    try {
                        handleSuccess(JSON.parse(response.responseText));
                    } catch(e) { logDev("API", "Parse Error: " + e.message); }
                },
                onerror: function() {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        logDev("API", "Net Error, retrying in 2s...");
                        retryTimer = setTimeout(doFetchLocation, 2000);
                    } else {
                        logDev("API", "Net Error fetching location (after retry)");
                    }
                },
                ontimeout: function() {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        logDev("API", "Timed out, retrying in 2s...");
                        retryTimer = setTimeout(doFetchLocation, 2000);
                    } else {
                        logDev("API", "Location API timed out (after retry)");
                    }
                }
            });
        };
        doFetchLocation();
    }

    // --- ADVANCED INJECTION (Fixes Sandbox Logic Failure) ---
    function installPlatformBypasses() {
        // We create a config object to pass your settings into the real page
        const injectionConfig = {
            face: isFaceProtectionEnabled,
            report: isReportProtectionEnabled,
            antibot: isAntiBotEnabled,
            fingerprint: isFingerprintSpoofingEnabled,
            // Pass the random persona data for consistency
            hardwareConcurrency: globalPersona.hardwareConcurrency,
            deviceMemory: globalPersona.deviceMemory,
            userAgent: globalPersona.userAgent,
            platform: globalPersona.platform
        };

        const script = document.createElement('script');
        script.textContent = `(function(config) {
            console.log("[Ome-IP] Injecting Protections into Main World...");

            // 1. GLOBAL VARIABLES (Anti-Bot Bypasses)
            // The site checks these specific variables to see if you are human.
            if (config.antibot) {
                // Force specific values to prevent variance checks from flagging you
                window.calculateVariance = function() { return 1200 + (Math.random() * 200); };
                window.calculateScrollLength = function() { return 2000 + Math.floor(Math.random() * 10000); };
                window.testGIF = async function() { return 100; };
                window.bypass = true;

                // Prevent site from setting "blocked" flags
                Object.defineProperty(window, 'blocked', {
                    get: () => false,
                    set: (v) => { console.log("[Ome-IP] 🛡️ Blocked attempt to set 'window.blocked'"); }
                });
            }

            // 2. NAVIGATOR SPOOFING (Fingerprint Bypasses)
            // We use Object.defineProperty because 'navigator' is often read-only
            if (config.fingerprint) {
                const spoofProp = (prop, value) => {
                    try {
                        Object.defineProperty(navigator, prop, {
                            get: () => value,
                            configurable: true
                        });
                    } catch(e) { console.log("Failed to spoof " + prop); }
                };

                spoofProp('webdriver', false); // CRITICAL: Hides automation status
                spoofProp('hardwareConcurrency', config.hardwareConcurrency);
                spoofProp('deviceMemory', config.deviceMemory);
                spoofProp('platform', config.platform);
                spoofProp('userAgent', config.userAgent);
            }

            // 3. WORKER HOOK (Face Protection)
            const NativeWorker = window.Worker;
            class StealthWorker extends NativeWorker {
                constructor(scriptURL, options) {
                    const urlStr = String(scriptURL);
                    if (config.face && (urlStr.includes('vision') || urlStr.includes('face') || urlStr.includes('wasm'))) {
                        window.dispatchEvent(new CustomEvent('ome-bypass-event', { detail: { type: 'face' } }));
                        console.log("[Ome-IP] 🎭 Blocked Face Detection Worker:", urlStr);

                        // Create a dummy worker to keep the site happy
                        const dummyCode = "self.onmessage = function(e) { setTimeout(() => { self.postMessage({ action: 'faceDetections', faces: 1 }); }, 50); };";
                        const blob = new Blob([dummyCode], { type: 'application/javascript' });
                        super(URL.createObjectURL(blob), options);
                    } else {
                        super(scriptURL, options);
                    }
                }
            }
            if (config.face) window.Worker = StealthWorker;

        })(${JSON.stringify(injectionConfig)});`;

        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    // CALL IMMEDIATELY - DO NOT WAIT FOR INIT
    window.addEventListener('ome-bypass-event', (e) => {
        if (e.detail.type === 'ws-ready') {
            isWsProtectionActive = true;
            // If UI exists, update it immediately
            const dot = document.getElementById('status-dot-report');
            if (dot) {
                dot.style.backgroundColor = "#00FF00";
                dot.style.boxShadow = "0 0 8px #00FF00";
                dot.title = "Report Protection: Active & Ready";
            }
        }
    });

	// --- 3. ANTI-BOT & FINGERPRINT BYPASSES ---
    function initializeAntiBotBypasses() {
        // [NEW] Task 1: Check toggle before running
        if (!isAntiBotEnabled) {
            console.log("[Ome-IP] Anti-Bot Bypass Disabled via Settings");
            return;
        }

        try {
            // 1. Variance Bypass
            let noiseSeed = Math.random();
            const getNoise = () => {
                let x = Math.sin(noiseSeed) * 10000;
                noiseSeed += 0.1;
                return x - Math.floor(x);
            };
            const calcVariance = () => 1000 + (getNoise() * 500);

            // 2. Pre-Connection Bypasses
            Object.defineProperty(window, 'calculateVariance', { value: calcVariance, writable: false });
            Object.defineProperty(window, 'calculateScrollLength', { value: () => Math.floor(Math.random() * (40000 - 15000 + 1)) + 15000, writable: false });
            Object.defineProperty(window, 'setGIFSelector', { value: async () => crypto.randomUUID().replace(/-/g, ''), writable: false });
            Object.defineProperty(window, 'testGIF', { value: async () => Math.random() * (150 - 50) + 50, writable: false });
            Object.defineProperty(window, 'bypass', { value: true, writable: false });

            console.log("[Ome-IP] Anti-Bot Variance & GIF Tests Bypassed");
        } catch (e) {
            console.log("[Ome-IP] Anti-Bot Init Failed (Already declared?)", e);
        }
    }

    // --- OBSERVER ---
    function initMasterObserver() {
        // 1. Body Observer: Only watches the body tag for 'ome-dark-mode' class changes.
        // subtree: false prevents checking every single element's attributes (Massive Perf Gain)
        const bodyObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'class') {
                    const hasClass = document.body.classList.contains('ome-dark-mode');
                    // Prevent fighting: If we think it should be dark, but it isn't, re-apply.
                    if (isDarkModeActive && !hasClass) {
                        document.body.classList.add('ome-dark-mode');
                    }
                }
            }
        });
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: false });

        // 2. DOM Observer: Watches for new elements (Disconnects) but IGNORES attributes.
        // This allows applyCustomHides() to change classes without triggering this observer again.
        const domObserver = new MutationObserver((mutations) => {
            let shouldApplyHides = false;

            for (const m of mutations) {
                if (m.type === 'childList' && m.addedNodes.length > 0) {
                    shouldApplyHides = true;

                    // Check for OmegleApp disconnects
                    if (window.location.hostname.includes("omegleapp.me")) {
                         m.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                if (checkOANode(node)) triggerOASkip();
                                else if (node.querySelector && node.querySelector('.socialLink')) {
                                    if (checkOANode(node.querySelector('.socialLink'))) triggerOASkip();
                                }
                            }
                        });
                    }
                }
            }

            // Debounce the hide application to prevent spamming
            if (shouldApplyHides) {
                if (window._hideTimeout) clearTimeout(window._hideTimeout);
                window._hideTimeout = setTimeout(applyCustomHides, 200);
            }
        });

        // Observe structure only (childList), NOT attributes
        domObserver.observe(document.body, { childList: true, subtree: true });

        logDev("SYS", "Master Observer Started (Optimized)");
    }



    // --- OMEGLEWEB.COM SPECIFIC DISCONNECT MONITOR ---
    let owDisconnectSkipLock = false;

    function initOmegleWebMonitor() {
        // Run only on omegleweb domains
        const host = window.location.hostname;
        if (!host.includes("omegleweb.com")) return;

        logDev("SYS", "OmegleWeb Disconnect Monitor Started");

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (checkOWNode(node)) triggerOWSkip();
                        }
                    });
                }
            }
        });

        const chatBox = document.querySelector('.chat') || document.body;
        observer.observe(chatBox, { childList: true, subtree: true });
    }

    function checkOWNode(node) {
        // Target: <div class="message message-disconnect"><span class="strange">Stranger has disconnected...</span></div>

        // Check if the node itself is the message div
        if (node.classList.contains('message') && node.classList.contains('message-disconnect')) {
            // It is a disconnect message, now check if it's the "Stranger"
            const span = node.querySelector('.strange');
            if (span && span.textContent.includes('Stranger has disconnected')) {
                return true;
            }
            // Fallback: Check text content directly if span is missing
            if (node.textContent.includes('Stranger has disconnected')) {
                return true;
            }
        }
        return false;
    }

    function triggerOWSkip() {
        // [NEW] Exit if IP Grabber is OFF
        if (!isIPGrabbingEnabled) return;

        if (owDisconnectSkipLock) return;
        owDisconnectSkipLock = true;

        // Human-like delay (800ms - 1.2s)
        const delayMs = 800 + (Math.floor(Math.random() * 400));

        const stats = document.getElementById("ip-stats-area");
        if(stats) stats.insertAdjacentHTML('beforeend', `<br><span style="color:cyan; font-size:10px;">↪ OmegleWeb Skip in ${(delayMs/1000).toFixed(2)}s...</span>`);

        setTimeout(() => {
            performSmartSkip("OmegleWeb Disconnect");
            // Unlock after 2s
            setTimeout(() => { owDisconnectSkipLock = false; }, 2000);
        }, delayMs);
    }


    // --- OMEGLEAPP.ME SPECIFIC DISCONNECT MONITOR ---
    let oaDisconnectSkipLock = false;

    function initOmegleAppMonitor() {
        // STRICT CHECK: Only run this on omegleapp.me domains
        const host = window.location.hostname;
        if (!host.includes("omegleapp.me")) return;

        logDev("SYS", "OmegleApp Disconnect Monitor Started");

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            // Check if the added node IS the link
                            if (checkOANode(node)) triggerOASkip();
                            // Check if the node CONTAINS the link (if a parent wrapper was added)
                            else if (node.querySelector && node.querySelector('.socialLink')) {
                                if (checkOANode(node.querySelector('.socialLink'))) triggerOASkip();
                            }
                        }
                    });
                }
            }
        });

        // Observe body for added chat messages
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function checkOANode(node) {
        // Look for wrapper classes usually associated with messages
        if (node.classList.contains('link') || node.classList.contains('text_msg') || node.classList.contains('socialLink')) {
            const txt = node.textContent || node.innerText || "";
            // Check for YOU disconnected OR STRANGER disconnected
            if (txt.includes('You have disconnected!') || txt.includes('Stranger has disconnected!')) {
                return true;
            }
        }
        return false;
    }

    function triggerOASkip() {
        // [NEW] Exit if IP Grabber is OFF
        if (!isIPGrabbingEnabled) return;

        if (oaDisconnectSkipLock) return;
        oaDisconnectSkipLock = true;

        // Random delay: 1000ms base + (50ms to 500ms jitter)
        const delayMs = 1000 + (Math.floor(Math.random() * 450) + 50);

        const stats = document.getElementById("ip-stats-area");
        if(stats) stats.insertAdjacentHTML('beforeend', `<br><span style="color:orange; font-size:10px;">↪ Auto-skipping in ${(delayMs/1000).toFixed(2)}s...</span>`);

        setTimeout(() => {
            performSmartSkip("OmegleApp Disconnect");
            // Unlock after 2 seconds to allow next chat skipping
            setTimeout(() => { oaDisconnectSkipLock = false; }, 2000);
        }, delayMs);
    }


    // --- SPLIT INITIALIZATION (Stealth vs UI) ---

    // 1. IMMEDIATE EXECUTION (Stealth)
    // Runs instantly at 'document-start' to beat site detection scripts.
    try {
        loadSettings(); // Load config from storage immediately

        // Inject the bypasses into the Main World NOW
        installPlatformBypasses();

        // Also run the sandbox-level hooks just in case        initializeFingerprintBypasses();
            initializeCorePrivacyBypasses();
            initializeBanDetection();

        console.log("[Ome-IP] 🥷 Stealth Modules Injected Immediately");
    } catch(e) {
        console.error("[Ome-IP] Critical Stealth Init Error:", e);
    }

    // 2. DELAYED EXECUTION (UI & DOM)
    // Runs only after the page is ready to accept buttons/windows.
    const initUI = () => {
        try {
            // Data Loading
            loadData();
            fetchOwnIP();

            // UI Creation
            createLogWindow();
            createNoteWindow();

            // Inject CSS
            const style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = `.chat-container { background-color: transparent !important; }`;
            document.head.appendChild(style);

            // Event Listeners
            window.addEventListener("beforeunload", forceSave);
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === 'hidden') forceSave();
            });

            // --- MODIFIED EVENT LISTENER ---
            window.addEventListener('ome-bypass-event', (e) => {
                if (e.detail.type === 'face') {
                    facesDetectedCount++;
                    updateStatusDots();
                } 
                else if (e.detail.type === 'report') {
                    reportsBlockedCount++;
                    updateStatusDots();

                    // 1. Set the flag so the NEXT page knows why we are there
                    GM_setValue('ome_was_reported', true);

                    // 2. Play sound if enabled (optional, might cut off due to redirect)
                    if (isReportSoundEnabled) {
                        triggerReportSound();
                    }
                    
                    // (Code below this point usually won't run because the browser is already leaving)
                    showReportPopup();

                } else if (e.detail.type === 'ws-ready') {
                    isWsProtectionActive = true;
                    const dot = document.getElementById('status-dot-report');
                    if (dot) {
                        dot.style.backgroundColor = "#00FF00";
                        dot.style.boxShadow = "0 0 8px #00FF00";
                        dot.title = "Report Protection: Active & Ready";
                    }
                }
            });

            // Start Observers
            initMasterObserver();
            initOmegleAppMonitor();
            initOmegleWebMonitor();

            // Restore State
            if (isDarkModeActive) setTimeout(() => toggleWatermarks(true), 500);
            const savedGhost = GM_getValue('ome_ghost_mode', false);
            if (savedGhost) setTimeout(() => {
                const win = document.getElementById("ip-log-window");
                if (win) toggleGhostMode(win);
            }, 600);

            logDev("SYS", "UI Initialized");
            logDev("SYS", `Resolution: ${window.screen.width}x${window.screen.height}`);

        } catch (e) {
            console.error("[Ome-IP] UI Init Error:", e);
        }
    };

    // Only wait for DOM for the UI parts
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initUI);
    } else {
        initUI();
    }

    // [NEW] Local video button - small floating picker, always visible.
    //   Click = pick a local video file, right-click = clear.
    // [REWRITTEN] Floating button wrapper containing \uD83D\uDCC1 (pick) and \uD83D\uDD17 (URL) buttons
    function ensureLocalVideoButton() {
        if (document.getElementById("ome-ip-local-video-wrap")) return;

        const wrap = document.createElement("div");
        wrap.id = "ome-ip-local-video-wrap";
        wrap.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483646;display:flex;gap:8px;align-items:flex-end;";

        // \uD83D\uDCC1 Pick local file button
        const btn = document.createElement("button");
        btn.id = "ome-ip-local-video-btn";
        btn.style.cssText = "width:40px;height:40px;border-radius:50%;background:#1a1a1a;border:2px solid #ff8c00;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:system-ui;box-shadow:0 2px 8px rgba(0,0,0,0.4);transition:transform 0.1s,border-color 0.2s,background 0.2s;";
        btn.innerHTML = '<span style="font-size:18px;line-height:1;">&#128193;</span>';
        btn.addEventListener("click", async () => {
            const r = await pickLocalFakeVideoFile();
            if (r) {
                btn.style.background = "#0a4a0a";
                btn.style.borderColor = "#00FF00";
                if (!unsafeWindow.ome_ip_state) unsafeWindow.ome_ip_state = {};
                unsafeWindow.ome_ip_state.pickedFilename = r.filename;
                unsafeWindow.ome_ip_state.videoURL = r.blobURL;
                unsafeWindow.ome_ip_state.sourceType = "blob";
                updateButtonTooltips();
            }
        });
        btn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            clearLocalFakeVideoFile();
            btn.style.background = "#1a1a1a";
            btn.style.borderColor = "#ff8c00";
            if (unsafeWindow.ome_ip_state) {
                unsafeWindow.ome_ip_state.pickedFilename = "";
                unsafeWindow.ome_ip_state.videoURL = "";
                unsafeWindow.ome_ip_state.sourceType = "default";
            }
            updateButtonTooltips();
        });
        btn.addEventListener("mouseenter", () => { btn.style.transform = "scale(1.1)"; btn.style.borderColor = "#fff"; });
        btn.addEventListener("mouseleave", () => {
            btn.style.transform = "scale(1)";
            const cur = (unsafeWindow.ome_ip_state && unsafeWindow.ome_ip_state.videoURL) || FAKE_CONFIG.videoURL;
            if (cur && (cur.startsWith("data:") || cur.startsWith("blob:"))) {
                btn.style.borderColor = "#00FF00";
            } else {
                btn.style.borderColor = "#ff8c00";
            }
        });
        wrap.appendChild(btn);

        // \uD83D\uDD17 Set URL button
        const urlBtn = document.createElement("button");
        urlBtn.id = "ome-ip-url-btn";
        urlBtn.style.cssText = "width:40px;height:40px;border-radius:50%;background:#1a1a1a;border:2px solid #4a9eff;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:system-ui;box-shadow:0 2px 8px rgba(0,0,0,0.4);transition:transform 0.1s,border-color 0.2s,background 0.2s;";
        urlBtn.innerHTML = '<span style="font-size:18px;line-height:1;">&#128279;</span>';
        urlBtn.title = "Set fake-cam video URL (http://, https://, or local server) - right-click to reset";
        urlBtn.addEventListener("click", setVideoURLByPrompt);
        urlBtn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            clearVideoURL();
        });
        urlBtn.addEventListener("mouseenter", () => { urlBtn.style.transform = "scale(1.1)"; urlBtn.style.borderColor = "#fff"; });
        urlBtn.addEventListener("mouseleave", () => { urlBtn.style.transform = "scale(1)"; urlBtn.style.borderColor = "#4a9eff"; });
        wrap.appendChild(urlBtn);

        if (document.body) document.body.appendChild(wrap);
        else document.addEventListener("DOMContentLoaded", () => document.body.appendChild(wrap), { once: true });

        // Set initial tooltips based on current state
        updateButtonTooltips();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureLocalVideoButton, { once: true });
    } else {
        ensureLocalVideoButton();
    }

})();



