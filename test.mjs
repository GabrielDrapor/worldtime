import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
const core = /<script id="core">([\s\S]*?)<\/script>/.exec(html)[1];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(core + ';Object.assign(globalThis,{zonedMidnight,parts,offsetMs,rangeParts,offsetLabel,durationLabel,addDays,todayIn,zoneName,copyRows});', ctx);
const { zonedMidnight, offsetMs, rangeParts, offsetLabel, durationLabel, addDays, todayIn, zoneName, copyRows } = ctx;
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
const zs = [['Shanghai','GMT+8','Asia/Shanghai'],['Los Angeles','PST','America/Los_Angeles'],['Berlin','GMT+1','Europe/Berlin']]
  .map(([name, abbrev, tz]) => ({ name, abbrev, tz }));
assert.deepEqual([...copyRows(zs, ca, cb, true)], [
  'Shanghai (GMT+8)   Wed, Nov 11  01:30 – 10:30',
  'Los Angeles (PST)  Tue, Nov 10  09:30 – 18:30',
  'Berlin (GMT+1)     Tue, Nov 10  18:30 – Wed 03:30']);
// 12-hour: start times right-aligned; one-digit day padded
const ny = [{ name: 'New York', abbrev: 'EST', tz: 'America/New_York' }, { name: 'Shanghai', abbrev: 'GMT+8', tz: 'Asia/Shanghai' }];
const da = Date.parse('2026-11-09T14:00:00Z');
assert.deepEqual([...copyRows(ny, da, da + 3600000, false)], [
  'New York (EST)    Mon, Nov 9   9:00am – 10:00am',
  'Shanghai (GMT+8)  Mon, Nov 9  10:00pm – 11:00pm']);
// Different date widths ("Nov 9" vs "Nov 10") get padded
const db = Date.parse('2026-11-09T16:00:00Z');
assert.deepEqual([...copyRows(ny, db, db + 3600000, false)], [
  'New York (EST)    Mon, Nov 9   11:00am – 12:00pm',
  'Shanghai (GMT+8)  Tue, Nov 10  12:00am – 1:00am']);
console.log('all tests passed');
