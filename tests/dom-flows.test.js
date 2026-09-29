/**
 * tests/dom-flows.test.js
 *
 * jsdom-based regression test for two user-visible flows in ome-ip.js:
 *   Flow 1 — Gender status-dot click cycle (off → skip-women → skip-men → off)
 *   Flow 2 — Tag-pill click applies active selection visual + persists tag
 *
 * SELF-HEALING LINE RANGES.
 *   ome-ip.js has hard-coded block boundaries. Static line numbers rot as the
 *   source grows. We derive each range's start + end dynamically:
 *     - START: regex that matches a UNIQUE line in ome-ip.js. An optional
 *       `disambiguator` (next non-blank line matches another regex) filters
 *       false positives — e.g., 29 `try {` blocks exist in ome-ip.js, so
 *       RENDER_PILLS vs APPLY_TAG disambiguate by which first-statement
 *       (curTag? vs applyTag?) appears inside the try body.
 *     - END: a string/template-aware brace walker. Tracks { / } outside of
 *       strings, template literals, line comments, and block comments.
 *       Returns the line where depth first returns to 0 AFTER being > 0.
 *       Tolerates both inline `} catch(e) {}` AND split `} / catch (e) {}`
 *       styles by checking the next non-blank line for `catch`/`finally`
 *       continuation before declaring the block closed.
 *
 * eval-with-env plumbing: `const` inside `window.eval()` is lexically scoped
 * to that eval call and is NOT visible to subsequent evals. So we wrap each
 * extracted block with `var <import> = window.<prop>;` (hoisting) and
 * `window.<prop> = <export>;` (capture-for-next-eval) sentinels.
 *
 * DEBUGGING: if a test fails with `ANCHORS drifted`, update the start regex
 * in the `ANCHORS` table to match the new source.
 *
 * Usage: `node tests/dom-flows.test.js` (also `npm test`).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const OME_IP_JS = path.resolve(__dirname, '..', 'ome-ip.js');
const SRC_LF = fs.readFileSync(OME_IP_JS, 'utf8').replace(/\r\n/g, '\n');
const LINES = SRC_LF.split('\n');

// ============================================================
// Anchor table. Update regexes if ome-ip.js restructures.
// ============================================================

const ANCHORS = {
    GENDER: {
        // `const GENDER = { MODES, entryForMode, ... };` at IIFE top.
        start:         /^\s*const\s+GENDER\s*=\s*\{/,
        disambiguator: null
    },
    UPDATE_STATUS: {
        // `function updateStatusDots() { ... }`.
        start:         /^\s*function\s+updateStatusDots\s*\(\s*\)\s*\{/,
        disambiguator: null
    },
    CREATE_DOT: {
        // `const createToggleDot = (...) => { ... };` arrow.
        start:         /^\s*const\s+createToggleDot\s*=\s*\(/,
        disambiguator: null
    },
    RENDER_PILLS: {
        // 29 `try {` blocks exist; this one opens the gender-tag render.
        // Body's first statement is `const curTag = currentIP ? getStoredGender(currentIP) : null;`.
        start:         /^\s*try\s*\{\s*$/,
        disambiguator: /^\s*const\s+curTag\s*=\s*currentIP\s*\?/
    },
    APPLY_TAG: {
        // Second `try {` near L5758; body starts with `const applyTag = (gender) => {`.
        start:         /^\s*try\s*\{\s*$/,
        disambiguator: /^\s*const\s+applyTag\s*=\s*\(/
    },
    FAKE_CONFIG: {
        // `const FAKE_CONFIG = { enabled, forceRelay, ..., videoURL };` near L860.
        start:         /^\s*const\s+FAKE_CONFIG\s*=\s*\{/,
        disambiguator: null
    },
    GUM_OVERRIDE: {
        // `if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {` near L997.
        // Tension: ome-ip.js also has `if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)`
        // — disambiguator (next-line `try {`) filters to the getUserMedia override.
        start:         /^\s*if\s*\(\s*navigator\s*\.\s*mediaDevices\s*&&\s*navigator\s*\.\s*mediaDevices\s*\.\s*getUserMedia\s*\)/,
        disambiguator: /^\s*try\s*\{\s*$/
    }
};

// Minimum range size (lines) per anchor — soft sanity. A block smaller than
// this likely means the walker truncated or grabbed the wrong one. Set
// generously LOW so benign refactors that simplify a block don't trip; the
// purpose is to catch walker-stuck or wrong-block grabs, not size growth.
const MIN_RANGE_LINES = {
    GENDER:         20,
    UPDATE_STATUS:  30,
    CREATE_DOT:     25,
    RENDER_PILLS:   25,
    APPLY_TAG:      10,
    FAKE_CONFIG:    15,
    GUM_OVERRIDE:   40
};

// ============================================================
// String/template-aware helpers.
// ============================================================

// Replace chars in strings + comments with spaces so column positions stay
// stable for downstream brace counting. State machine: inStr toggles on
// ' " ` (with \ escapes inside) and back off on the matching quote. Line
// comments consume the rest of the line. Block comments consume until */.
//
// FOOTGUN: once we enter a template literal (`), every char inside (including
// the contents of any `${ ... }` interpolation) is treated as a space. If a
// future refactor introduces an OBJECT LITERAL or arrow body inside `${...}`
// (e.g., `` `${condition ? { style: 'bold' } : ''}` ``), the brace walker
// will silently under-count — those inner braces are real JS scopes hidden
// by the inStr='`' state. The walker-stuck cap in walkBraceClose() is the
// safety net that converts this silent miscount into a loud failure.
function stripStringsAndComments(line) {
    let out = '';
    let inStr = null;  // ' " ` or null
    let i = 0;
    while (i < line.length) {
        const c = line[i];
        if (inStr) {
            if (c === '\\' && i + 1 < line.length) {
                out += '  '; i += 2; continue;
            }
            out += ' ';
            if (c === inStr) inStr = null;
            i++;
            continue;
        }
        if (c === '/' && line[i + 1] === '/') {
            // line comment: pad rest of line
            while (out.length < line.length) out += ' ';
            break;
        }
        if (c === '/' && line[i + 1] === '*') {
            out += '  ';
            i += 2;
            while (i < line.length) {
                if (line[i] === '*' && line[i + 1] === '/') {
                    out += '  '; i += 2; break;
                }
                out += (line[i] === '\t') ? '\t' : ' ';
                i++;
            }
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            inStr = c;
            out += ' ';
            i++;
            continue;
        }
        out += c;
        i++;
    }
    return out;
}

// First non-blank LINES entry starting at 0-based index `from`.
function nextNonBlankFrom(from) {
    for (let i = from; i < LINES.length; i++) {
        if (LINES[i].trim() !== '') return LINES[i];
    }
    return '';
}

// Walk braces starting from 1-indexed `startLine`. Returns 1-indexed line
// where brace depth first returns to 0 AFTER being > 0. Tolerates try/catch
// /finally continuation: a `}` followed by a non-blank line matching
// `^\s*(catch|finally)\b` is NOT the block end — we keep walking until the
// catch/finally body also closes.
//
// SAFETY CAP: if the walker hasn't returned within WALKER_MAX_LINES, throw
// with a pointer to the template-literal-nested-brace footgun documented in
// stripStringsAndComments(). This converts a "silent miscount" into a
// loud, actionable failure.
const WALKER_MAX_LINES = 600;
function walkBraceClose(startLine) {
    let depth = 0;
    let opened = false;
    for (let i = startLine - 1; i < LINES.length; i++) {
        if (i - (startLine - 1) > WALKER_MAX_LINES) {
            throw new Error('walkBraceClose: walker did not close within '
                + WALKER_MAX_LINES + ' lines after L' + startLine
                + '. Likely cause: template literal contains nested JS braces '
                + 'inside ${...} which stripStringsAndComments() hides. '
                + 'See the FOOTGUN comment.');
        }
        const cleaned = stripStringsAndComments(LINES[i]);
        const before = depth;
        for (let j = 0; j < cleaned.length; j++) {
            const ch = cleaned[j];
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
        }
        if (opened && depth < before && depth === 0) {
            // depth just dropped to 0. Is the next non-blank line a
            // catch/finally continuation?
            const follow = nextNonBlankFrom(i + 1);
            if (!/^\s*(catch|finally)\b/.test(follow)) {
                return i + 1;
            }
            // else: try continues into catch/finally; keep walking.
        }
        if (depth > 0) opened = true;
    }
    throw new Error('walkBraceClose: no close after L' + startLine + ' (depth=' + depth + ')');
}

// ============================================================
// Discovery — populate DISCOVERED table at module load.
// ============================================================

const DISCOVERED = {};
for (const [k, a] of Object.entries(ANCHORS)) {
    let start = -1;
    for (let i = 0; i < LINES.length; i++) {
        if (!a.start.test(LINES[i])) continue;
        if (a.disambiguator && !a.disambiguator.test(nextNonBlankFrom(i + 1))) continue;
        start = i + 1;
        break;
    }
    if (start === -1) {
        throw new Error('ANCHORS.' + k
            + ': start regex matched nowhere in ome-ip.js. '
            + 'Likely refactor — update start regex in ANCHORS table.');
    }
    const end = walkBraceClose(start);
    const size = end - start + 1;
    if (size < MIN_RANGE_LINES[k]) {
        throw new Error('ANCHORS.' + k + ': discovered block too small (' + size
            + ' lines < MIN=' + MIN_RANGE_LINES[k] + '). '
            + 'Walker truncated or grabbed the wrong block.');
    }
    DISCOVERED[k] = { start, end, size, name: k };
}

// Optional: report discovery once so maintainers can spot drift.
function reportDiscoveredRanges() {
    const lines = ['DISCOVERED line ranges:'];
    for (const [k, r] of Object.entries(DISCOVERED)) {
        lines.push('  ' + k.padEnd(14) + '  L' + r.start + '-' + r.end + '  (' + r.size + ' lines)');
    }
    return lines.join('\n');
}

// Memoize extracted source (sorted by NAME so order is stable across runs).
const _CACHED = {};
const NAME_ORDER = Object.keys(DISCOVERED);
function extractRange(r) {
    if (!_CACHED[r.name]) _CACHED[r.name] = LINES.slice(r.start - 1, r.end).join('\n');
    return _CACHED[r.name];
}

// Verify each anchor regex still matches at least one line — fail loud on
// refactor. Cheap pre-flight before any behavior test or parse check.
function assertAnchorsPresent() {
    const errors = [];
    for (const [k, a] of Object.entries(ANCHORS)) {
        let matched = false;
        for (let i = 0; i < LINES.length; i++) {
            if (!a.start.test(LINES[i])) continue;
            if (a.disambiguator && !a.disambiguator.test(nextNonBlankFrom(i + 1))) continue;
            matched = true;
            break;
        }
        if (!matched) {
            errors.push('  - ' + k
                + ': anchor regex matched nowhere in ome-ip.js');
        }
    }
    if (errors.length > 0) {
        throw new Error('ANCHORS drifted in ome-ip.js. Update ANCHORS table:\n'
            + errors.join('\n'));
    }
}

// Parse-check each extracted block before behavior tests. Future drift that
// produces parse errors (e.g., walker truncated mid-statement) fails HERE
// with a clear range pointer, instead of inside `window.eval()` as a
// confusing SyntaxError.
function assertSourceParses() {
    const errors = [];
    for (const k of NAME_ORDER) {
        const r = DISCOVERED[k];
        const src = extractRange(r);
        try {
            // `new Function(src)` only parses — it does NOT run, so undefined
            // identifiers don't matter here. Mirrors what window.eval() will
            // parse next step.
            // eslint-disable-next-line no-new-func
            new Function(src);
        } catch (e) {
            errors.push('  - ' + k + ' (L' + r.start + '-' + r.end + '): ' + e.message);
        }
    }
    if (errors.length > 0) {
        throw new Error('ome-ip.js extracted blocks fail to parse:\n' + errors.join('\n'));
    }
}

// eval-with-env helper: pre-declares imports as var (window-visible) and
// post-declares exports to window via suffix lines so they survive across
// separate window.eval() calls.
function evalBlock(window, src, envOpts) {
    envOpts = envOpts || {};
    const imports = envOpts.imports || {};
    const exports = envOpts.exports || {};
    const pre = Object.entries(imports)
        .map(([name, prop]) => 'var ' + name + ' = window.' + prop + ';')
        .join('\n');
    const post = Object.entries(exports)
        .map(([name, prop]) => 'window.' + prop + ' = ' + name + ';')
        .join('\n');
    // Capture import references BEFORE eval. If the same binding appears
    // in both imports and exports, the post-fixup overwrites window[prop];
    // capturing want-then ensures the guard sees the original reference
    // and detects any var redeclaration inside the eval'd block.
    const originalImports = {};
    for (const [name, prop] of Object.entries(imports)) {
        originalImports[name] = window[prop];
    }
    window.eval(pre + '\n' + src + '\n' + post);
    // VAR-SHADOW GUARD: re-read each imported binding from window scope and
    // assert it still matches the original reference. A `var X = ...` inside
    // the eval'd source would re-declare X in window scope and break the
    // identity-by-reference relationship with the prefix-binding.
    for (const [name, want] of Object.entries(originalImports)) {
        const got = window.eval(String(name));
        if (want !== got) {
            throw new Error('evalBlock shadow detected: import \'' + name +
                '\' was reassigned inside the eval\'d block (want=' +
                String(want) + ', got=' + String(got) +
                '). Likely a `var ' + name +
                '` re-declaration in the extracted source. ' +
                'Narrow the ANCHORS range or update the disambiguator.');
        }
    }
}

// Tiny dependency-free test harness.
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function assert(cond, msg) { if (!cond) throw new Error('Assertion failed: ' + msg); }
function assertEq(actual, expected, label) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error('[' + label + '] expected ' + JSON.stringify(expected)
            + ', got ' + JSON.stringify(actual));
    }
}

// createToggleDot returns a WRAPPER div; the actual dot (the one with the id)
// is nested as `.status-toggle-btn` inside. This helper extracts it.
function innerDotOf(wrapper) {
    return wrapper && wrapper.querySelector('.status-toggle-btn');
}

// Build a fresh jsdom window with the surgical harness pre-loaded.
function buildHarness() {
    const dom = new JSDOM(
        '<!DOCTYPE html><html><head></head><body>' +
        '<div id="main-header-container"></div>' +
        '<div id="ip-log-window"></div>' +
        '<select id="ome-gender-filter-select">' +
        '<option value="off">Off</option>' +
        '<option value="skip-women">Skip Women</option>' +
        '<option value="skip-men">Skip Men</option>' +
        '</select>' +
        '</body></html>',
        { url: 'https://ome.tv/', runScripts: 'outside-only',
          pretendToBeVisual: false, virtualConsole: new VirtualConsole() }
    );
    const { window } = dom;

    // IIFE-internal stubs. `var` declarations inside window.eval become
    // window-scoped. `win` is referenced by createToggleDot's hardcoded
    // onClick at ome-ip.js L2566 — must be defined or clicking throws.
    window.eval(
        'var fakeStore = {};' +
        // Expose the store so tests can seed an existing tag *before* the eval'd
        // block re-declares `const curTag = currentIP ? getStoredGender(currentIP) : null`.
        'window.__fakeStore = fakeStore;' +
        'var setStoredGender = function(ip, code) {' +
        '    if (ip) fakeStore[ip] = code;' +
        '    window.__lastStoredGender = [ip, code];' +
        '};' +
        'var getStoredGender = function(ip) {' +
        '    return ip ? (fakeStore[ip] || null) : null;' +
        '};' +
        'var saveCoreSettings = function() {};' +
        'var performSmartSkip = function(reason) { window.__lastSkipReason = reason; };' +
        'var refreshStatsWindowDisplay = function(ip, relay, api) {' +
        '    window.__lastRefreshArgs = [ip, relay, api];' +
        '};' +
        'var showToast = function(msg) { window.__lastToast = msg; };' +
        'var updateAdvToggleVisual = function() {};' +
        'var genderFilterMode = "off";' +
        'var isWindowTransparent = false;' +
        'var currentIP = null;' +
        'var isRelayIP = false;' +
        'var currentApiData = null;' +
        // createToggleDot's onClick closure references `win` (the chat-panel
        // window variable). Stub it to the harness window so click tests
        // don't throw ReferenceError on bare `win`.
        'var win = window;' +
        // isUILocked referenced by createToggleDot onClick (L2556).
        'var isUILocked = false;' +
        'var lockBtn = null;' +
        'var tagPillStyle = function(color, bg) {' +
        '    return "padding:3px 7px; border:1px solid " + color' +
        '        + "; border-radius:4px; font-size:13px; cursor:pointer; margin-right:3px;";' +
        '};' +
        // ----- FLOW 3 (fake-cam) STUBS ----- +
        // FAKE_CONFIG def (L874-L876) spreads these into default arrays.
        'var DEFAULT_VIDEO_LABELS = ["Camera 1", "Camera 2", "Camera 3"];' +
        'var DEFAULT_AUDIO_INPUT_LABELS = ["Microphone 1", "Microphone 2"];' +
        'var DEFAULT_AUDIO_OUTPUT_LABELS = ["Speaker 1"];' +
        // Tampermonkey GM_* persistence (FAKE_CONFIG def + click handlers use these).
        'var GM_setValue = function(k, v) {' +
        '    window.__gmStore = window.__gmStore || {};' +
        '    window.__gmStore[k] = v;' +
        '};' +
        'var GM_getValue = function(k, dflt) {' +
        '    return (window.__gmStore && window.__gmStore[k]) || dflt;' +
        '};' +
        // jsdom's `window.confirm` returns false by default; the L2622 click
        // handler gates the fake-cam-enable path on confirm() returning true.
        'window.confirm = function() { return true; };' +
        // Spy on navigator.mediaDevices.getUserMedia. The override at L997-L1080
        // binds the original at eval time, so our spy becomes the `originalGUM`.
        // We make navigator.mediaDevices configurable+writable so the override's
        // re-assignment to it lands cleanly.
        'window.__streamTracks = [' +
        '    { kind: "video", label: "Real Camera Vendor" },' +
        '    { kind: "audio", label: "Real Mic Vendor" }' +
        '];' +
        'var __navMediaDevices = {' +
        '    getUserMedia: function(c) {' +
        '        window.__lastGUMCall = c;' +
        '        ' +
        '        ' +
        '        ' +
        '        return Promise.resolve({' +
        '            getTracks: function() { return window.__streamTracks; },' +
        '            getVideoTracks: function() { return window.__streamTracks.filter(function(t) { return t.kind === "video"; }); },' +
        '            getAudioTracks: function() { return window.__streamTracks.filter(function(t) { return t.kind === "audio"; }); }' +
        '        });' +
        '    },' +
        '    enumerateDevices: function() { return Promise.resolve([]); }' +
        '};' +
        'Object.defineProperty(navigator, "mediaDevices", {' +
        '    value: __navMediaDevices,' +
        '    writable: true,' +
        '    configurable: true' +
        '});' +
        // createProcessedStream (L888) is referenced by the override when fake-cam
        // or antiBan engages. Stub it to capture (source, isFake) for assertions
        // and return a stream with `addTrack` so antiBan's audio-track splice
        // (L1052-L1056) lands cleanly instead of throwing TypeError.
        'var createProcessedStream = function(source, isFake) {' +
        '    window.__lastCreateProcessedStreamArgs = [source, isFake];' +
        '    return Promise.resolve({' +
        '        getTracks: function() { return []; },' +
        '        getVideoTracks: function() { return []; },' +
        '        getAudioTracks: function() { return []; },' +
        '        addTrack: function(track) { window.__lastAddedTrack = track; }' +
        '    });' +
        '};' +
        // Used by L2627 click handler when fake-cam is enabled.
        'var createAdvancedSettingsWindow = function(id) {' +
        '    window.__lastAdvWinCall = id;' +
        '};'
    );

    // Surgical evals.
    evalBlock(window, extractRange(DISCOVERED.GENDER),
        { exports: { GENDER: '__omeGENDER' } });
    evalBlock(window, extractRange(DISCOVERED.FAKE_CONFIG),
        // GM_getValue stub defined in initial eval is captured for FAKE_CONFIG
        // def execution (it reads GM_getValue for ome_fake_video_url).
        { exports: { FAKE_CONFIG: '__omeFAKE_CONFIG' } });
    evalBlock(window, extractRange(DISCOVERED.CREATE_DOT),
        { imports: { GENDER: '__omeGENDER' },
          exports: { createToggleDot: '__omeCreateToggleDot' } });
    evalBlock(window, extractRange(DISCOVERED.UPDATE_STATUS),
        { imports: { GENDER: '__omeGENDER' },
          exports: { updateStatusDots: '__omeUpdateStatusDots' } });

    return { dom, window };
}

// Render tag pills into a fresh contentArea div.
function renderPillsHtml(window, mode, ip, curTag) {
    window.eval(
        'var contentArea = document.createElement("div");' +
        'contentArea.id = "ip-stats-content";' +
        'document.body.appendChild(contentArea);' +
        'var html = "<div>";' +
        'var genderFilterMode = ' + JSON.stringify(mode) + ';' +
        'var currentIP = ' + JSON.stringify(ip) + ';' +
        'var curTag = ' + JSON.stringify(curTag) + ';'
    );
    evalBlock(window, extractRange(DISCOVERED.RENDER_PILLS),
        { imports: { GENDER: '__omeGENDER' } });
    window.eval(
        'var ca = document.getElementById("ip-stats-content");' +
        'ca.innerHTML = (typeof html !== "undefined" ? html : "") + "</div>";'
    );
    return window.document.getElementById('ip-stats-content');
}

// ======================================================================
// FLOW 1 — status-dot click cycle
// ======================================================================

test('flow 1: GENDER exposes MODES + entryForMode route table', () => {
    const { window } = buildHarness();
    const GENDER = window.__omeGENDER;
    assert(GENDER && Array.isArray(GENDER.MODES) && GENDER.MODES.length === 3, 'GENDER.MODES length 3');
    assertEq(GENDER.entryForMode('off').code, 'u', 'off→u');
    assertEq(GENDER.entryForMode('skip-women').code, 'f', 'skip-women→f');
    assertEq(GENDER.entryForMode('skip-men').code, 'm', 'skip-men→m');
});

test('flow 1: createToggleDot builds gender wrapper with inner dot', () => {
    const { window } = buildHarness();
    const GENDER = window.__omeGENDER;
    const createToggleDot = window.__omeCreateToggleDot;
    const wrapper = createToggleDot(
        'status-dot-gender', () => false,
        GENDER.entryForMode('off').dotIcon,
        'Gender Filter: ' + GENDER.entryForMode('off').dotLabel,
        () => {}
    );
    assert(wrapper, 'createToggleDot returns a wrapper element');
    const dot = innerDotOf(wrapper);
    assert(dot, 'wrapper contains inner .status-toggle-btn');
    assert(dot.id === 'status-dot-gender', 'inner dot id matches; got: ' + dot.id);
});

test('flow 1: 3 clicks cycle off → skip-women → skip-men → off', () => {
    const { window } = buildHarness();
    const GENDER = window.__omeGENDER;
    const createToggleDot = window.__omeCreateToggleDot;
    let mode = 'off';
    function refreshView(dot) {
        dot.title = 'Gender Filter: ' + GENDER.entryForMode(mode).dotLabel;
        const iconSpan = dot.querySelector('.ome-icon-span');
        if (iconSpan) iconSpan.textContent = GENDER.entryForMode(mode).dotIcon;
    }
    const wrapper = createToggleDot(
        'status-dot-gender', () => mode !== 'off',
        GENDER.entryForMode('off').dotIcon,
        'Gender Filter: ' + GENDER.entryForMode('off').dotLabel,
        () => { mode = GENDER.nextMode(mode); }
    );
    const dot = innerDotOf(wrapper);
    window.document.body.appendChild(wrapper);
    refreshView(dot);

    for (const want of ['skip-women', 'skip-men', 'off']) {
        dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        refreshView(dot);
        assert(dot.title.includes(GENDER.entryForMode(want).dotLabel),
            'expected title to contain ' + want + ' label, got "' + dot.title + '"');
    }
    assertEq(mode, 'off', 'mode back to off after 3 clicks');
});

test('flow 1: cycle syncs dropdown after each click', () => {
    const { window } = buildHarness();
    const GENDER = window.__omeGENDER;
    const createToggleDot = window.__omeCreateToggleDot;
    let mode = 'off';
    const wrapper = createToggleDot(
        'status-dot-gender', () => mode !== 'off',
        GENDER.entryForMode('off').dotIcon, 'Gender Filter: Off',
        () => {
            mode = GENDER.nextMode(mode);
            const sel = window.document.getElementById('ome-gender-filter-select');
            if (sel) sel.value = mode;
        }
    );
    const dot = innerDotOf(wrapper);
    window.document.body.appendChild(wrapper);
    const sel = window.document.getElementById('ome-gender-filter-select');

    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(sel.value, 'skip-women', 'after 1st click');
    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(sel.value, 'skip-men', 'after 2nd click');
    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(sel.value, 'off', 'after 3rd click');
});

// ======================================================================
// FLOW 2 — tag-pill click selection visual
// ======================================================================

test('flow 2: renderBadge + tagPills build 3 pills + active selStyle', () => {
    const { window } = buildHarness();
    const GENDER = window.__omeGENDER;
    // Seed fakeStore BEFORE renderPillsHtml: the eval'd block at ome-ip.js
    // L5706 redeclares `const curTag = getStoredGender(currentIP)`, which
    // shadows any harness-side `var curTag`. Realistic production path:
    // user previously tagged this IP, so its stored code is 'f'.
    window.__fakeStore['203.0.113.7'] = 'f';
    renderPillsHtml(window, 'off', '203.0.113.7', 'f');
    const f = window.document.getElementById('gender-row-f');
    const m = window.document.getElementById('gender-row-m');
    const u = window.document.getElementById('gender-row-u');
    assert(f && m && u, 'three pills rendered');
    const fStyle = (f.getAttribute('style') || '');
    assert(fStyle.indexOf('box-shadow') >= 0,
        'f pill should carry selStyle box-shadow (curTag=f); style="' + fStyle + '"');
    assert((m.getAttribute('style') || '').indexOf('box-shadow') < 0,
        'm pill should NOT carry box-shadow when curTag=f');
    assert((u.getAttribute('style') || '').indexOf('box-shadow') < 0,
        'u pill should NOT carry box-shadow when curTag=f');
    assert(GENDER.hasCode('f') && GENDER.hasCode('m') && GENDER.hasCode('u'),
        'GENDER.hasCode returns true for f/m/u');
});

test('flow 2: clicking pill f persists tag + applies selStyle to f only', () => {
    const { window } = buildHarness();
    const GENDER = window.__omeGENDER;
    // Initial render with no curTag.
    renderPillsHtml(window, 'off', '203.0.113.7', null);
    const f0 = window.document.getElementById('gender-row-f');
    assert(f0, '#gender-row-f exists after initial render');
    assert((f0.getAttribute('style') || '').indexOf('box-shadow') < 0,
        'no selStyle on f before click (curTag=null)');

    // Set state into eval scope + applyTag + click wiring.
    window.eval(
        'var curTag = null;' +
        'var currentIP = "203.0.113.7";' +
        'var isRelayIP = false;' +
        'var genderFilterMode = "off";' +
        'var currentApiData = null;'
    );
    evalBlock(window, extractRange(DISCOVERED.APPLY_TAG),
        { imports: { GENDER: '__omeGENDER' } });

    // Click pill f → applyTag('f') → setStoredGender + toast.
    const pillF = window.document.getElementById('gender-row-f');
    pillF.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    const stored = window.__lastStoredGender;
    assert(stored && stored[0] === '203.0.113.7' && stored[1] === 'f',
        'setStoredGender called with the right args; got ' + JSON.stringify(stored));
    assert(window.__lastToast && window.__lastToast.indexOf('Woman') >= 0,
        'toast should mention "Woman"; got ' + window.__lastToast);

    // Re-render with new curTag, mode pinned to 'off' literal (hermetic).
    renderPillsHtml(window, 'off', '203.0.113.7', window.getStoredGender('203.0.113.7'));
    const f = window.document.getElementById('gender-row-f');
    const m = window.document.getElementById('gender-row-m');
    const u = window.document.getElementById('gender-row-u');
    assert(f && m && u, 'pills present after re-render');
    assert((f.getAttribute('style') || '').indexOf('box-shadow') >= 0,
        'f should carry box-shadow after click + re-render');
    assert((m.getAttribute('style') || '').indexOf('box-shadow') < 0,
        'm should NOT carry box-shadow after click on f');
    assert((u.getAttribute('style') || '').indexOf('box-shadow') < 0,
        'u should NOT carry box-shadow after click on f');
});

// ======================================================================
// FLOW 3 — fake-camera
// ======================================================================

test('flow 3: FAKE_CONFIG exposes expected fields', () => {
    const { window } = buildHarness();
    const FAKE = window.__omeFAKE_CONFIG;
    assert(FAKE && typeof FAKE === 'object', 'FAKE_CONFIG is an object');
    assert(typeof FAKE.enabled === 'boolean', 'FAKE_CONFIG.enabled is boolean');
    assertEq(FAKE.videoURL, '',
        'default fake video URL (empty)');
    assert(Array.isArray(FAKE.videoLabels), 'videoLabels is array');
    assert(typeof FAKE.canvasSize === 'object' && FAKE.canvasSize.width === 640,
        'canvasSize defaults');
});

test('flow 3: getUserMedia override is installed and routes through original', async () => {
    const { window } = buildHarness();
    const originalGUM = window.navigator.mediaDevices.getUserMedia;
    assert(typeof originalGUM === 'function', 'pre-eval: spy is callable');

    // Eval the override. Imports FAKE_CONFIG (var rebind) + createProcessedStream
    // (already window-scoped from initial eval).
    evalBlock(window, extractRange(DISCOVERED.GUM_OVERRIDE), {
        imports: {
            FAKE_CONFIG: '__omeFAKE_CONFIG',
            createProcessedStream: 'createProcessedStream'
        }
    });

    const overriddenGUM = window.navigator.mediaDevices.getUserMedia;
    assert(overriddenGUM !== originalGUM,
        'override REPLACED the original getUserMedia');

    // With FAKE_CONFIG.enabled = false (default), override path is the
    // pass-through at L1003-L1004 → calls our spy → captures __lastGUMCall.
    // Direct call (no .call(thisArg, ...)) because the override body never
    // references `this` — it always uses `originalGUM(constraints)`.
    await overriddenGUM({ video: true });
    assert(window.__lastGUMCall, 'pass-through captured the call');
    assert(window.__lastGUMCall.video,
        'video constraint preserved through override');
});

test('flow 3: status-dot-camera click toggles FAKE_CONFIG.enabled through confirm', () => {
    const { window } = buildHarness();
    const FAKE = window.__omeFAKE_CONFIG;
    const createToggleDot = window.__omeCreateToggleDot;

    // Mirror ome-ip.js L2622-L2633 click handler logic. We inject this as the
    // toggle's onClick instead of extracting the row2 builder (which would
    // force extraction of a long inline DOM setup).
    const handler = () => {
        if (!FAKE.enabled) {
            if (window.confirm('WARNING: Fake Camera Mode')) {
                FAKE.enabled = true;
                window.GM_setValue('ome_fake_cam_enabled', true);
                window.createAdvancedSettingsWindow('adv-toggle-fake-cam');
            }
        } else {
            FAKE.enabled = false;
            window.GM_setValue('ome_fake_cam_enabled', false);
        }
    };

    const wrapper = createToggleDot(
        'status-dot-camera', () => FAKE.enabled,
        '\u2753', 'Fake Cam', handler
    );
    const dot = innerDotOf(wrapper);
    window.document.body.appendChild(wrapper);

    assertEq(FAKE.enabled, false, 'initial: disabled');
    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(FAKE.enabled, true, 'after 1st click: enabled (confirm accepted)');
    assertEq(window.__gmStore['ome_fake_cam_enabled'], true,
        'GM_setValue persisted true');
    assertEq(window.__lastAdvWinCall, 'adv-toggle-fake-cam',
        'createAdvancedSettingsWindow invoked once');

    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(FAKE.enabled, false,
        'after 2nd click: disabled (no confirm needed)');
    assertEq(window.__gmStore['ome_fake_cam_enabled'], false,
        'GM_setValue persisted false');
});

// ======================================================================
// FLOW 4 — anti-ban frames
// ======================================================================

test('flow 4: status-dot-antiban click toggles FAKE_CONFIG.antiBanFrames', () => {
    const { window } = buildHarness();
    const FAKE = window.__omeFAKE_CONFIG;
    const createToggleDot = window.__omeCreateToggleDot;

    // Mirror ome-ip.js L4334-L4338 click handler (betaGroup "Jitter Bot"
    // toggle). No confirm() - straight flip + persist + redraw.
    const handler = () => {
        FAKE.antiBanFrames = !FAKE.antiBanFrames;
        window.GM_setValue('ome_antiban_frames', FAKE.antiBanFrames);
        window.updateStatusDots();
    };

    const wrapper = createToggleDot(
        'status-dot-antiban', () => FAKE.antiBanFrames,
        '\u2753', 'AntiBan', handler
    );
    const dot = innerDotOf(wrapper);
    window.document.body.appendChild(wrapper);

    assertEq(FAKE.antiBanFrames, false, 'initial: antiBan OFF');
    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(FAKE.antiBanFrames, true, 'after 1st click: antiBan ON');
    assertEq(window.__gmStore['ome_antiban_frames'], true,
        'GM_setValue persisted true');
    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(FAKE.antiBanFrames, false, 'after 2nd click: antiBan OFF');
});

test('flow 4: getUserMedia SCENARIO 2 engages createProcessedStream for antiBan', async () => {
    const { window } = buildHarness();
    const FAKE = window.__omeFAKE_CONFIG;

    evalBlock(window, extractRange(DISCOVERED.GUM_OVERRIDE), {
        imports: {
            FAKE_CONFIG: '__omeFAKE_CONFIG',
            createProcessedStream: 'createProcessedStream'
        }
    });

    // Set ONLY antiBanFrames=true (fake-cam/spoof/rawAudio off \u2192 SCENARIO 2 branch).
    FAKE.enabled = false;
    FAKE.antiBanFrames = true;
    FAKE.spoofDeviceNames = false;
    FAKE.rawAudio = false;

    const overriddenGUM = window.navigator.mediaDevices.getUserMedia;
    await overriddenGUM({ video: true, audio: true });

    // Override calls createProcessedStream(realStream, false) \u2192 stub captures args.
    const cpsArgs = window.__lastCreateProcessedStreamArgs;
    assert(cpsArgs, 'createProcessedStream was invoked by the override');
    assertEq(cpsArgs[1], false,
        'isFakeSource=false (SCENARIO 2 = real cam + jitter)');

    // Override splices audio tracks from realStream onto processedStream;
    // our addTrack stub captures the spliced track.
    const added = window.__lastAddedTrack;
    assert(added, 'processedStream.addTrack(audioTrack) was called');
    assertEq(added.kind, 'audio',
        'spliced track is the audio one (per L1054-L1056)');
});

// ======================================================================
// FLOW 5 \u2014 spoof device names
// ======================================================================

test('flow 5: status-dot-device-spoof click toggles FAKE_CONFIG.spoofDeviceNames', () => {
    const { window } = buildHarness();
    const FAKE = window.__omeFAKE_CONFIG;
    const createToggleDot = window.__omeCreateToggleDot;

    // Mirror ome-ip.js L2610-L2617 click handler (row1 "Device Spoofing" dot).
    // Straight flip + persist; the row1 handler also calls updateAdvToggleVisual
    // + createAdvancedSettingsWindow but those are out-of-scope for our assertion.
    const handler = () => {
        FAKE.spoofDeviceNames = !FAKE.spoofDeviceNames;
        window.GM_setValue('ome_spoof_devices', FAKE.spoofDeviceNames);
    };

    const wrapper = createToggleDot(
        'status-dot-device-spoof', () => FAKE.spoofDeviceNames,
        '\u2753', 'Device Spoofing', handler
    );
    const dot = innerDotOf(wrapper);
    window.document.body.appendChild(wrapper);

    assertEq(FAKE.spoofDeviceNames, false, 'initial: spoof OFF');
    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(FAKE.spoofDeviceNames, true, 'after 1st click: spoof ON');
    assertEq(window.__gmStore['ome_spoof_devices'], true,
        'GM_setValue persisted true');
    dot.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assertEq(FAKE.spoofDeviceNames, false, 'after 2nd click: spoof OFF');
});

test('flow 5: getUserMedia SCENARIO 3 overwrites track labels when spoof on', async () => {
    const { window } = buildHarness();
    const FAKE = window.__omeFAKE_CONFIG;

    evalBlock(window, extractRange(DISCOVERED.GUM_OVERRIDE), {
        imports: {
            FAKE_CONFIG: '__omeFAKE_CONFIG',
            createProcessedStream: 'createProcessedStream'
        }
    });

    // ONLY spoofDeviceNames=true (fake-cam/antiBan/rawAudio off \u2192 SCENARIO 3).
    FAKE.enabled = false;
    FAKE.antiBanFrames = false;
    FAKE.spoofDeviceNames = true;
    FAKE.rawAudio = false;

    const overriddenGUM = window.navigator.mediaDevices.getUserMedia;
    const returnedStream = await overriddenGUM({ video: true, audio: true });

    // Override iterates returned tracks and defines a getter on each track's
    // `label` property that returns the spoofed value (L1068-L1086).
    const tracks = returnedStream.getTracks();
    assert(tracks.length === 2, 'returned 2 tracks (video + audio from spy)');

    const videoTrack = tracks.find(t => t.kind === 'video');
    const audioTrack = tracks.find(t => t.kind === 'audio');
    assert(videoTrack && audioTrack, 'one video + one audio track returned');

    // Spoofed labels come from FAKE_CONFIG.videoLabels[0] / audioInputLabels[0].
    // FAKE_CONFIG def spreads DEFAULT_VIDEO_LABELS at eval-time, so the first
    // entry is 'Camera 1' / 'Microphone 1'.
    assertEq(videoTrack.label, 'Camera 1',
        'video track label is spoofed to "Camera 1" (DEFAULT_VIDEO_LABELS[0])');
    assertEq(audioTrack.label, 'Microphone 1',
        'audio track label is spoofed to "Microphone 1" (DEFAULT_AUDIO_INPUT_LABELS[0])');
});

// ----------------------------------------------------------------------
// Run all tests.
// ----------------------------------------------------------------------

(async function run() {
    assertAnchorsPresent();
    assertSourceParses();
    // Maintainer-friendly: print discovered ranges when DEBUG_TEST_RANGES=1.
    // CI logs stay clean by default; local devs set the env var to inspect.
    if (process.env.DEBUG_TEST_RANGES === '1') {
        console.log(reportDiscoveredRanges());
        console.log();
    }
    const t0 = Date.now();
    let pass = 0, fail = 0;
    const failures = [];
    for (const t of tests) {
        try {
            await t.fn();
            pass += 1;
            console.log('  PASS  ' + t.name);
        } catch (e) {
            fail += 1;
            failures.push({ name: t.name, err: e });
            console.log('  FAIL  ' + t.name);
            console.log('        ' + e.message);
        }
    }
    const ms = Date.now() - t0;
    console.log('\n  ' + (fail === 0 ? 'OK ' : 'X  ') + pass + ' pass, '
        + fail + ' fail, ' + tests.length + ' total  (' + ms + 'ms)');
    if (fail > 0) {
        console.log('\n=== Failures ===');
        for (const f of failures) console.log('  - ' + f.name + ':\n    ' + f.err.message);
        process.exit(1);
    }
})();
