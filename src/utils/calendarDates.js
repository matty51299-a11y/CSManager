export const CAREER_START_DATE = '2026-01-01';
export const FALLBACK_EVENT_DATES = {
  'BLAST Bounty Season 1': ['2026-01-13', '2026-01-25'],
  'IEM Katowice': ['2026-01-28', '2026-02-08'],
  'ESL Pro League Season 1': ['2026-02-24', '2026-03-15'],
  'PGL Masters Spring': ['2026-03-23', '2026-04-05'],
  'BLAST Rivals Season 1': ['2026-04-27', '2026-05-03'],
  'Counter-Strike Major 1': ['2026-06-02', '2026-06-21'],
  'Major 1': ['2026-06-02', '2026-06-21'],
  'Summer Transfer Window': ['2026-06-22', '2026-07-20'],
  'Player Break': ['2026-06-22', '2026-07-20'],
  'Esports World Cup': ['2026-08-10', '2026-08-23'],
  'BLAST Open Fall': ['2026-08-24', '2026-09-06'],
  'BLAST Open Season 2': ['2026-08-24', '2026-09-06'],
  'StarLadder StarSeries': ['2026-09-14', '2026-09-27'],
  'StarSeries Fall': ['2026-09-14', '2026-09-27'],
  'ESL Pro League Season 2': ['2026-09-28', '2026-10-18'],
  'IEM Masters Fall': ['2026-10-26', '2026-11-08'],
  'PGL Masters Autumn': ['2026-10-26', '2026-11-08'],
  'IEM Beijing': ['2026-11-09', '2026-11-22'],
  'BLAST Rivals Season 2': ['2026-11-23', '2026-11-29'],
  'Counter-Strike Major 2': ['2026-12-01', '2026-12-20'],
  'Major 2': ['2026-12-01', '2026-12-20'],
  'End of Season Awards': ['2026-12-21', '2026-12-31'],
};
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export function parseDate(value) { return new Date(`${value}T00:00:00Z`); }
export function formatDate(value) { const d = parseDate(value); return `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
export function monthNameFromDate(value) { return monthNames[parseDate(value).getUTCMonth()]; }
export function dateInRange(date, start, end) { const d=parseDate(date); return d>=parseDate(start)&&d<=parseDate(end); }
export function enrichEventsWithDates(events = []) {
  return events.map((event, index) => {
    const fallback = FALLBACK_EVENT_DATES[event.name] || [`2026-${String(Math.min(12, index + 1)).padStart(2,'0')}-01`, `2026-${String(Math.min(12, index + 1)).padStart(2,'0')}-07`];
    const startDate = event.startDate || event.start || fallback[0];
    const endDate = event.endDate || event.end || fallback[1];
    return { ...event, startDate, endDate, month: event.month === 'Rolling' ? monthNameFromDate(startDate) : (event.month || monthNameFromDate(startDate)) };
  }).sort((a,b)=>parseDate(a.startDate)-parseDate(b.startDate));
}
export function compareDate(a,b){ return parseDate(a)-parseDate(b); }

export function addDays(value, days) { const d = parseDate(value); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
