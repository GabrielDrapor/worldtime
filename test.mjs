import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const core = /<script id="core">([\s\S]*?)<\/script>/.exec(html)[1];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(core + ';Object.assign(globalThis,{zonedMidnight,parts,offsetMs,rangeParts,offsetLabel,durationLabel,addDays,todayIn});', ctx);
const { zonedMidnight, offsetMs, rangeParts, offsetLabel, durationLabel, addDays, todayIn } = ctx;
const iso = t => new Date(t).toISOString();
// Midnights
assert.equal(iso(zonedMidnight('2026-11-13','Asia/Shanghai')), '2026-11-12T16:00:00.000Z');
assert.equal(iso(zonedMidnight('2026-11-01','America/Los_Angeles')), '2026-11-01T07:00:00.000Z'); // still PDT at 00:00
assert.equal(iso(zonedMidnight('2026-11-02','America/Los_Angeles')), '2026-11-02T08:00:00.000Z');
assert.equal(iso(zonedMidnight('2026-03-08','America/Los_Angeles')), '2026-03-08T08:00:00.000Z');
assert.equal(iso(zonedMidnight('2026-11-13','Asia/Kolkata')), '2026-11-12T18:30:00.000Z');
// Screenshot case: Shanghai Fri Nov 13 21:00-21:30
const a = Date.parse('2026-11-13T13:00:00Z'), b = a + 1800000;
assert.equal(rangeParts('America/Los_Angeles', a, b, true).text, '11月13日 周五 05:00 – 05:30');
assert.equal(rangeParts('America/New_York', a, b, false).text, '11月13日 周五 8:00am – 8:30am');
assert.equal(rangeParts('Europe/Berlin', a, b, true).text, '11月13日 周五 14:00 – 14:30');
assert.equal(rangeParts('Asia/Kolkata', a, b, true).text, '11月13日 周五 18:30 – 19:00');
// Cross-day range
assert.equal(rangeParts('Asia/Shanghai', Date.parse('2026-11-13T15:00:00Z'), Date.parse('2026-11-13T17:00:00Z'), true).text,
  '11月13日 周五 23:00 – 11月14日 周六 01:00');
// Offsets relative to home
const t = zonedMidnight('2026-11-13','Asia/Shanghai');
assert.equal(offsetLabel(offsetMs('America/Los_Angeles', t) - offsetMs('Asia/Shanghai', t)), '-16');
assert.equal(offsetLabel(offsetMs('Asia/Kolkata', t) - offsetMs('Asia/Shanghai', t)), '-2.5');
assert.equal(offsetLabel(offsetMs('Asia/Kathmandu', t) - offsetMs('Asia/Shanghai', t)), '-2.25');
assert.equal(durationLabel(5), '2 小时 30 分钟'); assert.equal(durationLabel(1), '30 分钟');
assert.equal(addDays('2026-12-31', 1), '2027-01-01');
assert.equal(todayIn('Asia/Shanghai', Date.parse('2026-11-13T17:00:00Z')), '2026-11-14');
console.log('all tests passed');
