// Standalone smoke test for the GENDER const in ome-ip.js.
// Uses vm module so the loaded const is visible in this script's scope.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const P = path.resolve(__dirname, '..', 'ome-ip.js');
if (!fs.existsSync(P)) { console.log('FAIL: not found ' + P); process.exit(1); }

const src = fs.readFileSync(P, 'utf8');
const m = src.match(/const GENDER = \{([\s\S]*?)\n    \};/);
if (!m) { console.log('FAIL: GENDER const not found'); process.exit(1); }

// Strip "const " so we can assign into our shared context via var.
const code = 'var GENDER = {' + m[1] + '\n    };\n';
const ctx = vm.createContext({});
vm.runInContext(code, ctx);
// Promote GENDER out so the rest of this script can reference it.
const GENDER = vm.runInContext('GENDER', ctx);

const tests = [];
function t(name, got, want) { tests.push({name, got, want, ok: got === want}); }

// entryForMode always valid
t('entryForMode("off").code',           GENDER.entryForMode('off').code,           'u');
t('entryForMode("skip-women").code',   GENDER.entryForMode('skip-women').code,   'f');
t('entryForMode("skip-men").code',     GENDER.entryForMode('skip-men').code,     'm');
t('entryForMode("bogus").code',        GENDER.entryForMode('bogus').code,        'u');

// entryForCode always valid
t('entryForCode("f").mode',            GENDER.entryForCode('f').mode,            'skip-women');
t('entryForCode("m").mode',            GENDER.entryForCode('m').mode,            'skip-men');
t('entryForCode("u").mode',            GENDER.entryForCode('u').mode,            'off');
t('entryForCode("xyz").mode',          GENDER.entryForCode('xyz').mode,          'off');

// nextMode cycle
t('nextMode("off")',                   GENDER.nextMode('off'),                   'skip-women');
t('nextMode("skip-women")',            GENDER.nextMode('skip-women'),            'skip-men');
t('nextMode("skip-men")',              GENDER.nextMode('skip-men'),              'off');
t('nextMode("unknown")',               GENDER.nextMode('unknown'),               'off');

// shouldSkipTag
t('shouldSkipTag(skip-women, f)',       GENDER.shouldSkipTag('skip-women', 'f'),  true);
t('shouldSkipTag(skip-women, m)',       GENDER.shouldSkipTag('skip-women', 'm'),  false);
t('shouldSkipTag(skip-men, m)',         GENDER.shouldSkipTag('skip-men', 'm'),    true);
t('shouldSkipTag(skip-men, f)',         GENDER.shouldSkipTag('skip-men', 'f'),    false);
t('shouldSkipTag(off, f)',              GENDER.shouldSkipTag('off', 'f'),         false);
t('shouldSkipTag(off, m)',              GENDER.shouldSkipTag('off', 'm'),         false);
t('shouldSkipTag(off, u)',              GENDER.shouldSkipTag('off', 'u'),         false);

// skipReasonFor
t('skipReasonFor("f")',                GENDER.skipReasonFor('f'),                'Filtered Gender: woman');
t('skipReasonFor("m")',                GENDER.skipReasonFor('m'),                'Filtered Gender: man');
t('skipReasonFor("u")',                GENDER.skipReasonFor('u'),                'Filtered Gender: unknown');
t('skipReasonFor("xyz")',              GENDER.skipReasonFor('xyz'),              'Filtered Gender: unknown');

// label/strip (applyTag logic)
t('applyTag labelShort(f)',             GENDER.entryForCode('f').label.split(' ').slice(1).join(' '), 'Woman');
t('applyTag labelShort(m)',             GENDER.entryForCode('m').label.split(' ').slice(1).join(' '), 'Man');
t('applyTag labelShort(u)',             GENDER.entryForCode('u').label.split(' ').slice(1).join(' '), 'Unknown');

// dot / dropdown labels (toast + dropdown)
t('entryForMode(off).dotLabel',          GENDER.entryForMode('off').dotLabel,         'Off');
t('entryForMode(skip-women).dotLabel',  GENDER.entryForMode('skip-women').dotLabel,  'Skip Women');
t('entryForMode(skip-men).dotLabel',    GENDER.entryForMode('skip-men').dotLabel,    'Skip Men');

t('entryForMode(off).dropdownLabel',           GENDER.entryForMode('off').dropdownLabel,         'Off (no skip)');
t('entryForMode(skip-women).dropdownLabel',   GENDER.entryForMode('skip-women').dropdownLabel, 'Skip Women');
t('entryForMode(skip-men).dropdownLabel',     GENDER.entryForMode('skip-men').dropdownLabel,   'Skip Men');

// hasCode (v15)
t('hasCode("f")',                  GENDER.hasCode('f'),    true);
t('hasCode("m")',                  GENDER.hasCode('m'),    true);
t('hasCode("u")',                  GENDER.hasCode('u'),    true);
t('hasCode("xyz")',                GENDER.hasCode('xyz'),  false);
t('hasCode("")',                   GENDER.hasCode(''),     false);
t('hasCode(null)',                 GENDER.hasCode(null),   false);

// nameOf (v15)
t('nameOf("f")',                   GENDER.nameOf('f'),   'Woman');
t('nameOf("m")',                   GENDER.nameOf('m'),   'Man');
t('nameOf("u")',                   GENDER.nameOf('u'),   'Unknown');
t('nameOf("xyz")',                 GENDER.nameOf('xyz'), 'Unknown');

let pass = 0, fail = 0;
for (const r of tests) {
    if (r.ok) { pass++; console.log('PASS ' + r.name); }
    else      { fail++; console.log('FAIL ' + r.name + ' -- got ' + JSON.stringify(r.got) + ' want ' + JSON.stringify(r.want)); }
}
console.log('--- ' + pass + ' pass, ' + fail + ' fail ---');
process.exit(fail === 0 ? 0 : 2);
