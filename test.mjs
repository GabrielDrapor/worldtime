import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
const core = /<script id="core">([\s\S]*?)<\/script>/.exec(html)[1];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(core + ';Object.assign(globalThis,{zonedMidnight,parts,offsetMs,rangeParts,offsetLabel,durationLabel,addDays,todayIn,zoneName,copyLine});', ctx);
const { zonedMidnight, offsetMs, rangeParts, offsetLabel, durationLabel, addDays, todayIn, zoneName, copyLine } = ctx;
const iso = t => new Date(t).toISOString();
// Midnights
assert.equal(iso(zonedMidnight('2026-11-13','Asia/Shanghai')), '2026-11-12T16:00:00.000Z');
assert.equal(iso(zonedMidnight('2026-11-01','America/Los_Angeles')), '2026-11-01T07:00:00.000Z'); // still PDT at 00:00
assert.equal(iso(zonedMidnight('2026-11-02','America/Los_Angeles')), '2026-11-02T08:00:00.000Z');
assert.equal(iso(zonedMidnight('2026-03-08','America/Los_Angeles')), '2026-03-08T08:00:00.000Z');
assert.equal(iso(zonedMidnight('2026-11-13','Asia/Kolkata')), '2026-11-12T18:30:00.000Z');
// Screenshot case: Shanghai Fri Nov 13 21:00-21:30
const a = Date.parse('2026-11-13T13:00:00Z'), b = a + 1800000;
assert.equal(rangeParts('America/Los_Angeles', a, b, true).text, 'Fri, Nov 13, 05:00 – 05:30');
assert.equal(rangeParts('America/New_York', a, b, false).text, 'Fri, Nov 13, 8:00am – 8:30am');
assert.equal(rangeParts('Europe/Berlin', a, b, true).text, 'Fri, Nov 13, 14:00 – 14:30');
assert.equal(rangeParts('Asia/Kolkata', a, b, true).text, 'Fri, Nov 13, 18:30 – 19:00');
// Cross-day range
assert.equal(rangeParts('Asia/Shanghai', Date.parse('2026-11-13T15:00:00Z'), Date.parse('2026-11-13T17:00:00Z'), true).text,
  'Fri, Nov 13, 23:00 – Sat, Nov 14, 01:00');
// Offsets relative to home
const t = zonedMidnight('2026-11-13','Asia/Shanghai');
assert.equal(offsetLabel(offsetMs('America/Los_Angeles', t) - offsetMs('Asia/Shanghai', t)), '-16');
assert.equal(offsetLabel(offsetMs('Asia/Kolkata', t) - offsetMs('Asia/Shanghai', t)), '-2.5');
assert.equal(offsetLabel(offsetMs('Asia/Kathmandu', t) - offsetMs('Asia/Shanghai', t)), '-2.25');
assert.equal(durationLabel(5), '2 hr 30 min'); assert.equal(durationLabel(1), '30 min');
assert.equal(addDays('2026-12-31', 1), '2027-01-01');
assert.equal(todayIn('Asia/Shanghai', Date.parse('2026-11-13T17:00:00Z')), '2026-11-14');
assert.equal(zoneName('America/Los_Angeles'), 'Los Angeles');
assert.equal(zoneName('UTC'), 'UTC');
// Copy-as-text lines (example from the user: Shanghai Wed 01:30-10:30)
const ca = Date.parse('2026-11-10T17:30:00Z'), cb = ca + 9 * 3600000;
assert.equal(copyLine('Shanghai', 'GMT+8', 'Asia/Shanghai', ca, cb, true), 'Shanghai (GMT+8): Wed, Nov 11 · 01:30 – 10:30');
assert.equal(copyLine('Los Angeles', 'PST', 'America/Los_Angeles', ca, cb, true), 'Los Angeles (PST): Tue, Nov 10 · 09:30 – 18:30');
assert.equal(copyLine('Berlin', 'GMT+1', 'Europe/Berlin', ca, cb, true), 'Berlin (GMT+1): Tue, Nov 10 · 18:30 – Wed 03:30');
assert.equal(copyLine('New York', 'EST', 'America/New_York', ca, cb, false), 'New York (EST): Tue, Nov 10 · 12:30pm – 9:30pm');
console.log('all tests passed');
