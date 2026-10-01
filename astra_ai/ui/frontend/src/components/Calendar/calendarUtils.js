export const DAY_MS = 86400000;
export const pad = (number) => String(number).padStart(2, '0');
export const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const startOfDay = (value) => { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; };
export const addDays = (value, amount) => { const date = new Date(value); date.setDate(date.getDate() + amount); return date; };
export const addMonths = (value, amount) => { const date = new Date(value); date.setDate(1); date.setMonth(date.getMonth() + amount); return date; };
export const startOfWeek = (value, weekStartsOn = 1) => {
  const date = startOfDay(value);
  const difference = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -difference);
};
export const monthRange = (value, weekStartsOn = 1) => {
  const first = new Date(value.getFullYear(), value.getMonth(), 1);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
};
export const viewRange = (view, focus, weekStartsOn = 1) => {
  if (view === 'week') {
    const start = startOfWeek(focus, weekStartsOn);
    return { start, end: addDays(start, 7) };
  }
  if (view === 'year') return { start: new Date(focus.getFullYear(), 0, 1), end: new Date(focus.getFullYear() + 1, 0, 1) };
  if (view === 'agenda') return { start: startOfDay(focus), end: addDays(startOfDay(focus), 90) };
  const days = monthRange(focus, weekStartsOn);
  return { start: days[0], end: addDays(days[41], 1) };
};
export const toLocalInput = (value) => {
  const date = new Date(value);
  return `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
export const eventStartsOn = (event, day) => dateKey(new Date(event.start || event.start_at)) === dateKey(day);
export const formatTime = (value, hour12 = false) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12 }).format(new Date(value));
export const periodLabel = (view, focus) => {
  if (view === 'year') return String(focus.getFullYear());
  if (view === 'week') {
    const end = addDays(focus, 6);
    return `${focus.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  if (view === 'agenda') return `Agenda · ${focus.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
  return focus.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};
export const DEFAULT_CALENDARS = [
  { id: 'personal', name: 'Personal', color: '#63a8f2', visible: true },
  { id: 'focus', name: 'Focus', color: '#56d89b', visible: true },
];
