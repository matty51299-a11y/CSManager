import { CAREER_START_DATE, compareDate, formatDate, parseDate } from './calendarDates.js';

export function getCurrentDate(state) { return state?.currentDate || CAREER_START_DATE; }
export function setCurrentDate(state, date) { return { ...state, currentDate: date }; }
export function toISODate(date) { return date.toISOString().slice(0, 10); }
export function advanceOneDay(date) { const d = parseDate(date); d.setUTCDate(d.getUTCDate() + 1); return toISODate(d); }
export function advanceToDate(state, date) { return setCurrentDate(state, date); }
export function getDaysUntil(from, to) { return Math.round((parseDate(to) - parseDate(from)) / 86400000); }
export function isSameDay(a, b) { return a === b; }
export function isBefore(a, b) { return compareDate(a, b) < 0; }
export function isAfter(a, b) { return compareDate(a, b) > 0; }
export function formatGameDate(date) { return formatDate(date); }
export function getDayEvents(state, date = getCurrentDate(state)) { return (state.calendarEvents || []).filter((event) => event.date === date && !event.resolved); }
export function getNextBlockingEvent(state, date = getCurrentDate(state)) {
  return (state.calendarEvents || [])
    .filter((event) => !event.resolved && event.blocksProgression && compareDate(event.date, date) >= 0)
    .sort((a, b) => compareDate(a.date, b.date) || (b.priority || 0) - (a.priority || 0))[0] || null;
}
