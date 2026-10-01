import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Calendar_widget.css';
import { calendarApi } from './calendarApi';
import {
  DEFAULT_CALENDARS, addDays, addMonths, dateKey, eventStartsOn, formatTime,
  monthRange, periodLabel, startOfDay, startOfWeek, toLocalInput, viewRange,
} from './calendarUtils';

const VIEWS = ['week', 'month', 'year', 'agenda'];
const CALENDAR_GEOMETRY_VERSION = 2;
const CALENDAR_MIN_SIZE = { width: 500, height: 400 };
const clampCalendarSize = (size) => {
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight;
  return {
    width: Math.round(Math.max(CALENDAR_MIN_SIZE.width, Math.min(Number(size?.width) || 540, Math.max(CALENDAR_MIN_SIZE.width, viewportWidth - 68)))),
    height: Math.round(Math.max(CALENDAR_MIN_SIZE.height, Math.min(Number(size?.height) || 440, Math.max(CALENDAR_MIN_SIZE.height, viewportHeight - 48)))),
  };
};
const ICONS = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4m8-4v4M3 10h18M7 14h2m3 0h2m3 0h1M7 18h2m3 0h2"/><rect x="16.5" y="16.5" width="2.5" height="2.5" rx=".5" className="cal-icon-today"/></>,
  chevronLeft: <path d="m15 18-6-6 6-6"/>, chevronRight: <path d="m9 18 6-6-6-6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>, minus: <path d="M5 12h14"/>,
  plus: <path d="M12 5v14M5 12h14"/>, settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.38.36.72.6 1 .3.3.7.45 1.1.45H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></>,
  sync: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5M6.1 9A7 7 0 0 1 18 6l2 2M18 15a7 7 0 0 1-12 3l-2-2"/></>,
  tag: <><path d="M20 13 13 20l-9-9V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.5"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  spark: <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Zm7 14 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>,
  dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  check: <path d="m5 12 4 4L19 6"/>, trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7"/></>,
  upload: <><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M4 14v6h16v-6"/></>,
  download: <><path d="M12 4v12m-4-4 4 4 4-4"/><path d="M4 20h16"/></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
};

const parseTags = (value) => [...new Map(String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => [tag.toLocaleLowerCase(), tag])).values()].slice(0, 30);
const validWebUrl = (value) => {
  try { const url = new URL(String(value || '').trim()); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
};
const validTimezone = (value) => {
  try { Intl.DateTimeFormat(undefined, { timeZone: value }).format(); return true; }
  catch { return false; }
};
const validateEventDraft = (draft) => {
  const errors = {};
  if (!draft.title?.trim()) errors.title = 'Add a title for this event.';
  else if (draft.title.trim().length > 240) errors.title = 'Keep the title to 240 characters or fewer.';
  if (!draft.all_day) {
    const start = new Date(draft.start); const end = new Date(draft.end);
    if (!draft.start || Number.isNaN(start.getTime())) errors.start = 'Choose a valid start time.';
    if (!draft.end || Number.isNaN(end.getTime())) errors.end = 'Choose a valid end time.';
    else if (!errors.start && end <= start) errors.end = 'The end must be after the start.';
  }
  if (!validTimezone(draft.timezone)) errors.timezone = 'Use a valid IANA timezone, such as Europe/Rome.';
  return errors;
};
const buildEventPayload = (draft) => ({
  title: draft.title.trim(), calendar_id: draft.calendar_id, all_day: Boolean(draft.all_day),
  start: draft.all_day ? draft.start : new Date(draft.start).toISOString(),
  end: draft.all_day ? draft.end : new Date(draft.end).toISOString(),
  timezone: draft.timezone, recurrence: draft.recurrence, importance: draft.importance,
  location: draft.location?.trim() || '', description: draft.description?.trim() || '',
  tags: parseTags(draft.tags), color: draft.color || '',
  reminder_minutes: [Number(draft.reminders)], reminder_channels: draft.reminder_channels,
});

function Icon({ name, size = 18 }) {
  return <svg className="cal-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
}

function IconButton({ icon, label, className = '', ...props }) {
  return <button type="button" className={`cal-icon-button ${className}`} aria-label={label} title={label} {...props}><Icon name={icon}/></button>;
}

const emptyDraft = (day, calendarId) => {
  const start = new Date(day); start.setHours(9, 0, 0, 0);
  const end = new Date(start); end.setHours(10);
  return { title: '', start: toLocalInput(start), end: toLocalInput(end), all_day: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome', calendar_id: calendarId, location: '', description: '', recurrence: 'none', reminders: '15', reminder_channels: ['in_app'], tags: '', importance: 'normal', color: '' };
};

function MonthView({ focus, selected, events, calendars, weekStartsOn, onSelect, onEdit, onCreate, onMove }) {
  const days = monthRange(focus, weekStartsOn);
  const weekNames = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date(2024, 0, 8), weekStartsOn), i).toLocaleDateString(undefined, { weekday: 'short' }));
  return <div className="cal-month" role="grid" aria-label={periodLabel('month', focus)}>
    <div className="cal-weekdays" role="row">{weekNames.map((name) => <div role="columnheader" key={name}>{name}</div>)}</div>
    <div className="cal-month-grid">{days.map((day) => {
      const items = events.filter((event) => eventStartsOn(event, day));
      const outside = day.getMonth() !== focus.getMonth();
      const today = dateKey(day) === dateKey(new Date());
      return <div key={dateKey(day)} role="gridcell" aria-selected={dateKey(selected) === dateKey(day)} className={`cal-day${outside ? ' is-outside' : ''}${today ? ' is-today' : ''}${dateKey(selected) === dateKey(day) ? ' is-selected' : ''}`} onClick={() => onSelect(day)} onDoubleClick={() => onCreate(day)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/astra-calendar-event'); if (id) onMove(id, day, true); }}>
        <button type="button" className="cal-day-number" onClick={(event) => { event.stopPropagation(); onSelect(day); }} aria-label={day.toLocaleDateString()}>{day.getDate()}</button>
        <div className="cal-day-events">{items.slice(0, 3).map((event) => {
          const calendar = calendars.find((entry) => entry.id === event.calendar_id);
          return <button type="button" draggable={!event.series_id} className="cal-event-chip" key={event.id} style={{ '--event-color': event.color || calendar?.color || '#63a8f2' }} onDragStart={(drag) => { drag.stopPropagation(); drag.dataTransfer.effectAllowed = 'move'; drag.dataTransfer.setData('text/astra-calendar-event', event.id); }} onClick={(click) => { click.stopPropagation(); onEdit(event); }}><span>{event.all_day ? '' : formatTime(event.start)}</span>{event.title}</button>;
        })}{items.length > 3 && <button type="button" className="cal-more" onClick={(event) => { event.stopPropagation(); onSelect(day); }}>+{items.length - 3} more</button>}</div>
      </div>;
    })}</div>
  </div>;
}

function WeekView({ focus, selected, events, calendars, weekStartsOn, onSelect, onEdit, onCreate, onMove }) {
  const start = startOfWeek(focus, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const timed = events.filter((event) => !event.all_day);
  return <div className="cal-week" role="grid" aria-label="Week calendar">
    <div className="cal-week-head"><span className="cal-zone">LOCAL</span>{days.map((day) => <button type="button" key={dateKey(day)} className={dateKey(day) === dateKey(selected) ? 'active' : ''} onClick={() => onSelect(day)}><small>{day.toLocaleDateString(undefined, { weekday: 'short' })}</small><strong>{day.getDate()}</strong></button>)}</div>
    <div className="cal-all-day"><span>ALL DAY</span>{days.map((day) => <div key={dateKey(day)}>{events.filter((event) => event.all_day && eventStartsOn(event, day)).map((event) => <button type="button" key={event.id} onClick={() => onEdit(event)}>{event.title}</button>)}</div>)}</div>
    <div className="cal-week-scroll"><div className="cal-time-axis">{hours.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}:00</span>)}</div><div className="cal-week-columns">{days.map((day) => <div key={dateKey(day)} className="cal-week-column" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/astra-calendar-event'); if (!id) return; const bounds = event.currentTarget.getBoundingClientRect(); const target = new Date(day); const minutes = Math.max(0, Math.min(1430, Math.round(((event.clientY - bounds.top) / 48 * 60) / 15) * 15)); target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0); onMove(id, target, false); }} onDoubleClick={(event) => { const draftDay = new Date(day); draftDay.setHours(Math.max(0, Math.min(23, Math.floor(event.nativeEvent.offsetY / 48)))); onCreate(draftDay); }}>{hours.map((hour) => <i key={hour}/>) }{timed.filter((event) => eventStartsOn(event, day)).map((event) => {
          const startAt = new Date(event.start); const endAt = new Date(event.end);
          const top = (startAt.getHours() + startAt.getMinutes() / 60) * 48;
          const height = Math.max(24, ((endAt - startAt) / 3600000) * 48);
          const calendar = calendars.find((entry) => entry.id === event.calendar_id);
          return <button type="button" draggable={!event.series_id} className="cal-week-event" style={{ top, height, '--event-color': event.color || calendar?.color || '#63a8f2' }} key={event.id} onDragStart={(drag) => { drag.dataTransfer.effectAllowed = 'move'; drag.dataTransfer.setData('text/astra-calendar-event', event.id); }} onClick={() => onEdit(event)}><strong>{event.title}</strong><span>{formatTime(event.start)}–{formatTime(event.end)}</span></button>;
        })}</div>)}</div></div>
  </div>;
}

function YearView({ focus, events, weekStartsOn, onDrill }) {
  return <div className="cal-year" aria-label={`${focus.getFullYear()} calendar`}>{Array.from({ length: 12 }, (_, month) => {
    const monthDate = new Date(focus.getFullYear(), month, 1);
    const days = monthRange(monthDate, weekStartsOn);
    return <section key={month}><button type="button" className="cal-mini-title" onClick={() => onDrill(monthDate)}>{monthDate.toLocaleDateString(undefined, { month: 'long' })}</button><div className="cal-mini-weekdays"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div className="cal-mini-grid">{days.map((day) => <button type="button" key={dateKey(day)} disabled={day.getMonth() !== month} className={`${dateKey(day) === dateKey(new Date()) ? 'today' : ''}${events.some((event) => eventStartsOn(event, day)) ? ' has-event' : ''}`} onClick={() => onDrill(day)}>{day.getMonth() === month ? day.getDate() : ''}</button>)}</div></section>;
  })}</div>;
}

function AgendaView({ focus, events, onEdit, onLoadMore }) {
  const grouped = events.reduce((map, event) => { const key = dateKey(new Date(event.start)); (map[key] ||= []).push(event); return map; }, {});
  const groups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  return <div className="cal-agenda">{groups.length === 0 ? <EmptyState icon="layers" title="Your horizon is clear" text="Create an event or use Quick Add to shape the days ahead."/> : groups.map(([key, items]) => <section key={key}><header><time>{new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</time><span>{items.length} event{items.length === 1 ? '' : 's'}</span></header>{items.map((event) => <button type="button" key={event.id} onClick={() => onEdit(event)}><time>{event.all_day ? 'All day' : formatTime(event.start)}</time><i style={{ background: event.color || '#63a8f2' }}/><span><strong>{event.title}</strong><small>{event.location || 'No location'}</small></span><Icon name="chevronRight" size={16}/></button>)}</section>)}<button type="button" className="cal-load-more" onClick={onLoadMore}>Load 90 more days</button></div>;
}

function EmptyState({ icon = 'calendar', title, text }) {
  return <div className="cal-empty"><span><Icon name={icon} size={24}/></span><strong>{title}</strong><p>{text}</p></div>;
}

function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    ref.current?.focus();
    const key = (event) => { if (event.key === 'Escape') onCloseRef.current?.(); };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      previouslyFocused?.focus?.();
    };
  }, []);
  return <div className="cal-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCloseRef.current?.()}><section className={`cal-modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cal-modal-title" tabIndex={-1} ref={ref}><header><div><span className="cal-kicker">ASTRA CALENDAR</span><h2 id="cal-modal-title">{title}</h2></div><IconButton icon="close" label="Close dialog" onClick={() => onCloseRef.current?.()}/></header>{children}</section></div>;
}

function QuickReview({ draft, calendars, onChange, onCancel, onCommit, saving }) {
  return <Modal title="Review Quick Add" onClose={onCancel}><div className="cal-review"><div className="cal-confidence"><Icon name="spark"/><span><strong>{Math.round((draft.confidence ?? .9) * 100)}% confidence</strong><small>Review before this enters your calendar</small></span></div>{draft.assumptions?.length > 0 && <div className="cal-assumptions">{draft.assumptions.map((item) => <span key={item}>{item}</span>)}</div>}<label className="cal-field"><span>Title</span><input value={draft.title || ''} onChange={(e) => onChange({ title: e.target.value })}/></label><div className="cal-form-grid"><label className="cal-field"><span>Starts</span><input type="datetime-local" value={toLocalInput(draft.start)} onChange={(e) => onChange({ start: new Date(e.target.value).toISOString() })}/></label><label className="cal-field"><span>Ends</span><input type="datetime-local" value={toLocalInput(draft.end)} onChange={(e) => onChange({ end: new Date(e.target.value).toISOString() })}/></label></div><label className="cal-field"><span>Calendar</span><select value={draft.calendar_id || calendars[0]?.id} onChange={(e) => onChange({ calendar_id: e.target.value })}>{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select></label><footer><button type="button" className="cal-secondary" onClick={onCancel}>Keep editing</button><button type="button" className="cal-primary" disabled={saving || !draft.title?.trim()} onClick={onCommit}>{saving ? 'Adding…' : 'Add to calendar'}</button></footer></div></Modal>;
}

function EventEditorV2({ draft, calendars, templates, onChange, onCancel, onSave, onDelete, onApplyTemplate, onSaveTemplate, onSuggestTime, saving, submitError }) {
  const [errors, setErrors] = useState({});
  const [tagText, setTagText] = useState('');
  const refs = { title: useRef(null), start: useRef(null), end: useRef(null), timezone: useRef(null) };
  const tags = parseTags(draft.tags);
  const locationUrl = validWebUrl(draft.location);
  const commitTag = (value = tagText) => {
    onChange({ tags: parseTags([...tags, ...String(value).split(',')].join(',')).join(', ') });
    setTagText('');
  };
  const removeTag = (tag) => onChange({ tags: tags.filter((item) => item.toLocaleLowerCase() !== tag.toLocaleLowerCase()).join(', ') });
  const toggleChannel = (channel) => onChange({ reminder_channels: draft.reminder_channels.includes(channel) ? draft.reminder_channels.filter((value) => value !== channel) : [...draft.reminder_channels, channel] });
  const submit = () => {
    const next = validateEventDraft(draft); setErrors(next);
    const first = Object.keys(next)[0]; refs[first]?.current?.focus();
    if (!first) onSave(buildEventPayload(draft));
  };
  return <Modal title={draft.id ? 'Edit event' : 'New event'} onClose={onCancel} wide>
    <form className="cal-event-form cal-event-form-v2" noValidate onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <div className="cal-editor-tools">
        <label><span>Template</span><select aria-label="Event template" defaultValue="" onChange={(event) => { const template = templates.find((item) => item.id === event.target.value); if (template) onApplyTemplate(template.payload); event.target.value = ''; }}><option value="">Choose a template…</option>{templates.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></label>
        <button type="button" onClick={onSaveTemplate}>Save template</button><button type="button" onClick={onSuggestTime}>Find free time</button>
      </div>
      {(submitError || Object.values(errors).some(Boolean)) && <div className="cal-form-error" role="alert">{submitError || 'Check the highlighted fields and try again.'}</div>}
      <fieldset className="cal-editor-section"><legend>Event</legend>
        <label className={`cal-field cal-field-title${errors.title ? ' has-error' : ''}`}><span>Event title</span><input ref={refs.title} maxLength={240} autoFocus value={draft.title} aria-invalid={Boolean(errors.title)} onChange={(event) => { onChange({ title: event.target.value }); setErrors((current) => ({ ...current, title: '' })); }} placeholder="What is happening?"/>{errors.title && <small>{errors.title}</small>}</label>
      </fieldset>
      <fieldset className="cal-editor-section"><legend>Schedule</legend>
        <div className="cal-form-grid"><label className={`cal-field${errors.start ? ' has-error' : ''}`}><span>Starts</span><input ref={refs.start} type="datetime-local" value={draft.start} disabled={draft.all_day} aria-invalid={Boolean(errors.start)} onChange={(event) => onChange({ start: event.target.value })}/>{errors.start && <small>{errors.start}</small>}</label><label className={`cal-field${errors.end ? ' has-error' : ''}`}><span>Ends</span><input ref={refs.end} type="datetime-local" value={draft.end} disabled={draft.all_day} aria-invalid={Boolean(errors.end)} onChange={(event) => onChange({ end: event.target.value })}/>{errors.end && <small>{errors.end}</small>}</label></div>
        <label className="cal-check"><input type="checkbox" checked={draft.all_day} onChange={(event) => onChange({ all_day: event.target.checked })}/><span>All-day event</span></label>
        <div className="cal-form-grid">
          <label className="cal-field"><span>Calendar</span><select value={draft.calendar_id} onChange={(event) => onChange({ calendar_id: event.target.value })}>{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select></label>
          <label className={`cal-field${errors.timezone ? ' has-error' : ''}`}><span>Timezone</span><input ref={refs.timezone} value={draft.timezone} aria-invalid={Boolean(errors.timezone)} onChange={(event) => onChange({ timezone: event.target.value })}/>{errors.timezone && <small>{errors.timezone}</small>}</label>
          <label className="cal-field"><span>Repeats</span><select value={draft.recurrence} onChange={(event) => onChange({ recurrence: event.target.value })}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
          <label className="cal-field"><span>Importance</span><select value={draft.importance} onChange={(event) => onChange({ importance: event.target.value })}><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        </div>
      </fieldset>
      <fieldset className="cal-editor-section"><legend>Details</legend>
        <label className="cal-field"><span>Location or meeting link</span><div className="cal-location-field"><input value={draft.location} onChange={(event) => onChange({ location: event.target.value })} placeholder="Add a place or https:// link"/>{locationUrl && <a href={locationUrl} target="_blank" rel="noopener noreferrer">Open link</a>}</div></label>
        <label className="cal-field"><span>Notes</span><textarea rows="3" value={draft.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="Details, preparation, or context"/></label>
        <label className="cal-field"><span>Tags</span><div className="cal-tag-editor">{tags.map((tag) => <button type="button" key={tag.toLocaleLowerCase()} aria-label={`Remove ${tag} tag`} onClick={() => removeTag(tag)}>{tag}<Icon name="close" size={11}/></button>)}<input aria-label="Add tags" value={tagText} onChange={(event) => event.target.value.includes(',') ? commitTag(event.target.value) : setTagText(event.target.value)} onBlur={() => tagText.trim() && commitTag()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); commitTag(); } else if (event.key === 'Backspace' && !tagText && tags.length) removeTag(tags.at(-1)); }} placeholder={tags.length ? 'Add another…' : 'Type a tag, then press Enter'}/></div><small>{tags.length}/30 tags</small></label>
      </fieldset>
      <fieldset className="cal-editor-section"><legend>Reminder</legend><div className="cal-form-grid"><label className="cal-field"><span>When</span><select value={draft.reminders} onChange={(event) => onChange({ reminders: event.target.value })}><option value="0">At start</option><option value="5">5 minutes before</option><option value="15">15 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select></label><fieldset className="cal-channels"><legend>Channels</legend>{[['in_app','In Astra'],['system','System']].map(([value, label]) => <label key={value}><input type="checkbox" checked={draft.reminder_channels.includes(value)} onChange={() => toggleChannel(value)}/><span>{label}</span></label>)}</fieldset></div></fieldset>
      <footer>{draft.id && <button type="button" className="cal-danger" onClick={onDelete}><Icon name="trash" size={15}/> Delete</button>}<span/><button type="button" className="cal-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="cal-primary" disabled={saving}>{saving ? 'Saving…' : 'Save event'}</button></footer>
    </form>
  </Modal>;
}

function Settings({ calendars, preferences, syncStatus, onClose, onCreate, onUpdate, onDelete, onPreferences, onSync, onImport, importPreview, onCommitImport, notice }) {
  const [draft, setDraft] = useState({ name: '', color: '#8b7cf6' });
  const [caldav, setCaldav] = useState({ url: '', username: '', password: '' });
  const [caldavMessage, setCaldavMessage] = useState('');
  const [timezoneDraft, setTimezoneDraft] = useState('');
  const [timezoneError, setTimezoneError] = useState('');
  const fileRef = useRef(null);
  return <Modal title="Calendar settings" onClose={onClose} wide><div className="cal-settings">
    {notice && <div className="cal-inline-notice" role="status">{notice}</div>}
    <section><h3>Your calendars</h3><div className="cal-calendar-list">{calendars.map((calendar) => <div className="cal-calendar-row" key={calendar.id}><label className="cal-visibility"><input type="checkbox" checked={calendar.visible !== false} onChange={(e) => onUpdate(calendar.id, { visible: e.target.checked })}/><span style={{ '--calendar-color': calendar.color }}/><em className="sr-only">Show {calendar.name}</em></label><input aria-label={`${calendar.name} name`} value={calendar.name} onChange={(e) => onUpdate(calendar.id, { name: e.target.value }, true)} onBlur={(e) => onUpdate(calendar.id, { name: e.target.value })}/><input className="cal-color" aria-label={`${calendar.name} color`} type="color" value={calendar.color} onChange={(e) => onUpdate(calendar.id, { color: e.target.value })}/><a className="cal-small-button" href={calendarApi.exportUrl(calendar.id)} download><Icon name="download" size={14}/><span className="sr-only">Export {calendar.name}</span></a><IconButton icon="trash" label={`Delete ${calendar.name}`} className="danger" onClick={() => onDelete(calendar.id)}/></div>)}</div>
      <form className="cal-new-calendar" onSubmit={(event) => { event.preventDefault(); if (!draft.name.trim()) return; onCreate(draft); setDraft({ name: '', color: '#8b7cf6' }); }}><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="New calendar name" aria-label="New calendar name"/><input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} aria-label="New calendar color"/><button type="submit" className="cal-primary" disabled={!draft.name.trim()}><Icon name="plus" size={15}/> Save calendar</button></form>
    </section>
    <section><h3>Import & export</h3><p>Bring in standard .ics files, preview changes, or create a portable backup.</p><div className="cal-setting-actions"><input ref={fileRef} type="file" accept=".ics,text/calendar" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}/><button type="button" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15}/> Preview .ics</button><a href={calendarApi.exportUrl()} download><Icon name="download" size={15}/> Export all</a></div>{importPreview && <div className="cal-import-preview"><strong>{importPreview.events?.length ?? importPreview.event_count ?? 0} events ready</strong><span>{importPreview.warnings?.length || 0} warnings</span><button type="button" className="cal-primary" onClick={onCommitImport}>Import events</button></div>}</section>
    <section><h3>Calendar behavior</h3><div className="cal-segments"><button type="button" className={preferences.week_starts_on === 1 ? 'active' : ''} onClick={() => onPreferences({ week_starts_on: 1 })}>Monday</button><button type="button" className={preferences.week_starts_on === 0 ? 'active' : ''} onClick={() => onPreferences({ week_starts_on: 0 })}>Sunday</button></div><label className="cal-check"><input type="checkbox" checked={preferences.hour12 || false} onChange={(e) => onPreferences({ hour12: e.target.checked })}/><span>Use 12-hour time</span></label><div className="cal-timezone-settings"><span className="cal-kicker">PINNED TIMEZONES</span><div>{(preferences.pinned_timezones || []).map((zone) => <button type="button" key={zone} title={`Remove ${zone}`} onClick={() => onPreferences({ pinned_timezones: preferences.pinned_timezones.filter((item) => item !== zone) })}>{zone}<Icon name="close" size={12}/></button>)}</div><form onSubmit={(event) => { event.preventDefault(); const zone = timezoneDraft.trim(); if (!validTimezone(zone)) { setTimezoneError('Use an IANA timezone such as America/New_York.'); return; } onPreferences({ pinned_timezones: [...new Set([...(preferences.pinned_timezones || []), zone])] }); setTimezoneDraft(''); setTimezoneError(''); }}><input aria-label="Add pinned timezone" value={timezoneDraft} onChange={(event) => { setTimezoneDraft(event.target.value); setTimezoneError(''); }} placeholder="America/New_York"/><button type="submit"><Icon name="plus" size={12}/> Add timezone</button></form>{timezoneError && <small role="alert">{timezoneError}</small>}</div></section>
    <section><div className="cal-section-heading"><div><h3>CalDAV sync</h3><p>{syncStatus?.last_synced_at ? `Last synced ${new Date(syncStatus.last_synced_at).toLocaleString()}` : 'Connect a CalDAV server to keep calendars in step.'}</p></div><span className={`cal-status-dot ${syncStatus?.state || 'idle'}`}>{syncStatus?.state || 'Not connected'}</span></div><div className="cal-form-grid"><label className="cal-field"><span>Server URL</span><input value={caldav.url} onChange={(e) => setCaldav({ ...caldav, url: e.target.value })} placeholder="https://calendar.example.com"/></label><label className="cal-field"><span>Username</span><input value={caldav.username} onChange={(e) => setCaldav({ ...caldav, username: e.target.value })}/></label></div><label className="cal-field"><span>Password or app token</span><input type="password" value={caldav.password} onChange={(e) => setCaldav({ ...caldav, password: e.target.value })}/></label><p>Credentials stay in this Astra session and are never written into the calendar database.</p><div className="cal-setting-actions"><button type="button" onClick={async () => { setCaldavMessage('Testing connection…'); try { const result = await calendarApi.testCalDav(caldav); setCaldavMessage(`Connected · ${result.calendar_count || 0} calendars found`); } catch (error) { setCaldavMessage(error.message); } }}>Test connection</button><button type="button" onClick={async () => { setCaldavMessage('Connecting securely…'); try { const result = await calendarApi.connectCalDav(caldav); setCaldavMessage(`Saved for this session · ${result.calendars?.length || 0} calendars found`); } catch (error) { setCaldavMessage(error.message); } }}>Connect & save</button><button type="button" className="cal-primary" onClick={onSync}><Icon name="sync" size={15}/> Sync now</button></div>{caldavMessage && <p className="cal-inline-notice" role="status">{caldavMessage}</p>}</section>
    <section><h3>Reminders</h3><p>Every reminder appears inside Astra. System alerts ask for browser or desktop permission only when you enable them.</p><div className="cal-toggle-stack"><label className="cal-check"><input type="checkbox" checked={preferences.system_notifications || false} onChange={async (e) => { if (e.target.checked && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); onPreferences({ system_notifications: e.target.checked }); }}/><span>Browser / desktop notifications</span></label></div></section>
  </div></Modal>;
}

export default function CalendarWidget({ onClose, onMinimize, command, onCommandResult }) {
  const initial = JSON.parse(localStorage.getItem('astra-calendar-state') || '{}');
  const [view, setView] = useState(VIEWS.includes(initial.view) ? initial.view : 'month');
  const [focus, setFocus] = useState(initial.focus ? new Date(initial.focus) : new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState(DEFAULT_CALENDARS);
  const [preferences, setPreferences] = useState({ week_starts_on: 1, hour12: false, system_notifications: false });
  const [status, setStatus] = useState('loading');
  const [syncStatus, setSyncStatus] = useState({ state: 'idle', queued: 0 });
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeSmartFilter, setActiveSmartFilter] = useState('');
  const [quickText, setQuickText] = useState('');
  const [quickReview, setQuickReview] = useState(null);
  const [editor, setEditor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [agendaDays, setAgendaDays] = useState(90);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [smartViews, setSmartViews] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [importPreview, setImportPreview] = useState(null);
  const [inspectorHeight, setInspectorHeight] = useState(Number(initial.inspectorHeight) || 155);
  const [windowOffset, setWindowOffset] = useState(initial.windowOffset || { x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState(() => clampCalendarSize(initial.geometry_version === CALENDAR_GEOMETRY_VERSION ? initial.windowSize : null));
  const widgetRef = useRef(null);
  const observedSizeRef = useRef(null);
  const searchRef = useRef(null); const abortRef = useRef(null); const searchAbortRef = useRef(null); const resizeRef = useRef(null); const filterRef = useRef(null);
  const dragRef = useRef(null);
  const seenRemindersRef = useRef(new Set());
  const eventsRef = useRef([]);
  const processedCommandIdsRef = useRef(new Map());

  const visibleCalendars = useMemo(() => calendars.filter((calendar) => calendar.visible !== false).map((calendar) => calendar.id), [calendars]);
  const filteredEvents = useMemo(() => events.filter((event) => {
    if (!visibleCalendars.includes(event.calendar_id)) return false;
    if (activeSmartFilter === 'high') return ['high', 'critical'].includes(event.importance);
    if (activeSmartFilter === 'critical') return event.importance === 'critical';
    if (activeSmartFilter === 'upcoming') return new Date(event.end) >= startOfDay(new Date());
    return true;
  }), [events, visibleCalendars, activeSmartFilter]);
  const selectedEvents = useMemo(() => filteredEvents.filter((event) => eventStartsOn(event, selected)).sort((a, b) => new Date(a.start) - new Date(b.start)), [filteredEvents, selected]);
  const nextEvent = useMemo(() => filteredEvents.filter((event) => new Date(event.end) >= new Date()).sort((a, b) => new Date(a.start) - new Date(b.start))[0], [filteredEvents]);

  const showToast = useCallback((message, action) => { setToast({ message, action }); window.setTimeout(() => setToast(null), 5000); }, []);
  const load = useCallback(async () => {
    abortRef.current?.abort(); abortRef.current = new AbortController(); setStatus('loading');
    const range = viewRange(view, focus, preferences.week_starts_on);
    if (view === 'agenda') range.end = addDays(range.start, agendaDays);
    try {
      const eventData = await calendarApi.events({ start: range.start.toISOString(), end: range.end.toISOString(), calendars: visibleCalendars, signal: abortRef.current.signal });
      setEvents(Array.isArray(eventData) ? eventData : eventData?.items || []);
      setStatus('ready'); setNotice('');
    } catch (error) {
      if (error.code === 'aborted') return;
      setStatus(navigator.onLine ? 'error' : 'offline');
      setNotice(error.message);
    }
  }, [view, focus, preferences.week_starts_on, visibleCalendars.join('|'), agendaDays]);

  useEffect(() => {
    calendarApi.calendars().then((data) => Array.isArray(data) && data.length && setCalendars(data)).catch(() => {});
    calendarApi.preferences().then((data) => data && setPreferences((current) => ({ ...current, ...data }))).catch(() => {});
    calendarApi.syncStatus().then(setSyncStatus).catch(() => {});
    calendarApi.templates().then(setTemplates).catch(() => {});
    calendarApi.smartViews().then(setSmartViews).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const term = query.trim();
    searchAbortRef.current?.abort();
    if (term.length < 2) { setSearchResults([]); setSearching(false); return undefined; }
    const controller = new AbortController(); searchAbortRef.current = controller; setSearching(true);
    const timer = window.setTimeout(() => {
      calendarApi.events({ query: term, calendars: visibleCalendars, signal: controller.signal })
        .then((items) => setSearchResults(Array.isArray(items) ? items : items?.items || []))
        .catch((error) => { if (error.code !== 'timeout') setNotice(error.message); })
        .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, visibleCalendars.join('|')]);
  useEffect(() => {
    if (!filterOpen) return undefined;
    const close = (event) => { if (!filterRef.current?.contains(event.target) && !event.target.closest('[data-calendar-filter-trigger]')) setFilterOpen(false); };
    const key = (event) => event.key === 'Escape' && setFilterOpen(false);
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', key); };
  }, [filterOpen]);
  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => {
    const node = widgetRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width); const height = Math.round(entry.contentRect.height);
      if (width < 1 || height < 1) return;
      // The first measurement is layout initialization, not a user resize.
      // Ignoring it prevents CSS constraints from overwriting persisted size.
      if (!observedSizeRef.current) { observedSizeRef.current = { width, height }; return; }
      if (observedSizeRef.current.width === width && observedSizeRef.current.height === height) return;
      observedSizeRef.current = { width, height };
      const next = clampCalendarSize({ width, height });
      setWindowSize((current) => current.width === next.width && current.height === next.height ? current : next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // Publish a bounded, structured snapshot so the AI can reason about the
  // calendar without scraping the DOM or relying on screenshots.
  useEffect(() => {
    const compact = (event) => ({
      id: event.id, title: event.title, start: event.start, end: event.end,
      all_day: Boolean(event.all_day), calendar_id: event.calendar_id,
      importance: event.importance || 'normal', location: event.location || '',
      notes: event.notes || '', tags: Array.isArray(event.tags) ? event.tags.slice(0, 20) : [],
      recurrence: event.recurrence || 'none', reminders: event.reminders || [],
    });
    const range = viewRange(view, focus, preferences.week_starts_on);
    if (view === 'agenda') range.end = addDays(range.start, agendaDays);
    window.dispatchEvent(new CustomEvent('aegisWidgetSemanticState', { detail: {
      widget: 'calendar', state: {
        open: true, focused: document.activeElement?.closest?.('[data-widget-id="calendar"]') != null,
        view, displayed_range: { start: range.start.toISOString(), end: range.end.toISOString() },
        displayed_month: focus.getMonth() + 1, displayed_year: focus.getFullYear(),
        selected_date: dateKey(selected), active_dialog: editor ? 'event_editor' : quickReview ? 'quick_review' : settingsOpen ? 'settings' : filterOpen ? 'filters' : null,
        filters_panel_open: filterOpen, settings_open: settingsOpen, query,
        active_smart_filter: activeSmartFilter || null, visible_calendars: visibleCalendars,
        multi_select: bulkMode, selected_event_ids: selectedIds, status, sync_status: syncStatus,
        selected_day_events: selectedEvents.slice(0, 50).map(compact), events: filteredEvents.slice(0, 100).map(compact),
      }, updated_at: new Date().toISOString(),
    }}));
  }, [view, focus, selected, editor, quickReview, settingsOpen, filterOpen, query, activeSmartFilter, visibleCalendars.join('|'), bulkMode, selectedIds.join('|'), status, syncStatus, selectedEvents, filteredEvents, preferences.week_starts_on, agendaDays]);
  useEffect(() => { localStorage.setItem('astra-calendar-state', JSON.stringify({ geometry_version: CALENDAR_GEOMETRY_VERSION, view, focus: focus.toISOString(), inspectorHeight, windowOffset, windowSize })); }, [view, focus, inspectorHeight, windowOffset, windowSize]);
  useEffect(() => {
    const online = async () => { setStatus('ready'); const result = await calendarApi.flushOfflineOutbox(); setSyncStatus((current) => ({ ...current, queued: result.queued })); await load(); };
    const offline = () => setStatus('offline');
    const queueChanged = (event) => setSyncStatus((current) => ({ ...current, queued: event.detail?.outbox?.length || 0 }));
    setSyncStatus((current) => ({ ...current, queued: calendarApi.offlineQueueSize() }));
    window.addEventListener('online', online); window.addEventListener('offline', offline); window.addEventListener('astra:calendar-offline-change', queueChanged);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); window.removeEventListener('astra:calendar-offline-change', queueChanged); };
  }, [load]);
  useEffect(() => {
    if (!window.EventSource || !navigator.onLine) return undefined;
    const stream = new EventSource(calendarApi.changesUrl);
    stream.addEventListener('calendar-change', load);
    return () => { stream.removeEventListener('calendar-change', load); stream.close(); };
  }, [load]);
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const due = await calendarApi.dueReminders();
        for (const reminder of due || []) {
          if (cancelled || seenRemindersRef.current.has(reminder.id)) continue;
          seenRemindersRef.current.add(reminder.id);
          setToast({ message: `Reminder: ${reminder.title}`, action: 'snooze', reminderId: reminder.id });
          if (preferences.system_notifications && reminder.channels?.includes('system') && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(reminder.title || 'Calendar reminder', { body: reminder.location || 'An Astra Calendar event is due.', tag: `astra-calendar-${reminder.id}` });
          }
          await calendarApi.acknowledgeReminder(reminder.id);
        }
      } catch { /* Reminder polling retries on the next interval. */ }
    };
    poll(); const timer = window.setInterval(poll, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [preferences.system_notifications]);

  const navigate = useCallback((direction) => {
    setFocus((current) => view === 'year' ? new Date(current.getFullYear() + direction, current.getMonth(), 1) : view === 'week' ? addDays(current, direction * 7) : view === 'agenda' ? addDays(current, direction * 30) : addMonths(current, direction));
  }, [view]);
  const today = useCallback(() => { const now = new Date(); setFocus(now); setSelected(now); }, []);
  const startCreate = useCallback((day = selected) => { setEditorError(''); setEditor(emptyDraft(day, calendars[0]?.id || 'personal')); }, [selected, calendars]);
  const startEdit = useCallback((event) => { setEditorError(''); setEditor({ ...event, id: event.series_id || event.id, original_occurrence_id: event.series_id ? event.id : null, start: toLocalInput(event.start), end: toLocalInput(event.end), reminder_channels: event.reminder_channels || ['in_app'], reminders: String(event.reminders?.[0]?.minutes_before ?? event.reminders ?? 15), tags: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags || '', recurrence: event.recurrence || 'none', timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, importance: event.importance || 'normal' }); }, []);

  const saveEvent = async (validatedPayload) => {
    const draftStart = new Date(validatedPayload.start); const draftEnd = new Date(validatedPayload.end);
    const conflict = events.find((item) => item.id !== editor.id && item.calendar_id === editor.calendar_id && new Date(item.start) < draftEnd && new Date(item.end) > draftStart);
    if (conflict && !window.confirm(`This overlaps “${conflict.title}”. Save it anyway?`)) return;
    setEventSaving(true); setEditorError(''); const previous = editor.id ? events.find((item) => item.id === (editor.original_occurrence_id || editor.id)) : null;
    const payload = { ...validatedPayload };
    try {
      const saved = editor.id ? await calendarApi.updateEvent(editor.id, payload, editor.version) : await calendarApi.createEvent(payload);
      if (editor.original_occurrence_id) await load();
      else setEvents((current) => editor.id ? current.map((event) => event.id === editor.id ? saved : event) : [...current, saved]);
      setHistory((items) => [...items.slice(-19), { type: editor.id ? 'update' : 'create', previous, saved }]); setSelected(new Date(saved.start)); setEditor(null); showToast(editor.id ? 'Event updated' : 'Event created', 'undo');
    } catch (error) { setEditorError(error.message || 'The event could not be saved. Try again.'); } finally { setEventSaving(false); }
  };
  const deleteEvent = async () => { if (!editor?.id || !window.confirm(`Delete “${editor.title}”?`)) return; setBusy(true); try { await calendarApi.deleteEvent(editor.id); const removed = events.find((event) => event.id === (editor.original_occurrence_id || editor.id)); if (editor.original_occurrence_id) await load(); else setEvents((current) => current.filter((event) => event.id !== editor.id)); setHistory((items) => [...items.slice(-19), { type: 'delete', previous: removed }]); setEditor(null); showToast('Event deleted', 'undo'); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const undo = async () => { const action = history.at(-1); if (!action) return; try { if (action.type === 'create') { await calendarApi.deleteEvent(action.saved.id); setEvents((items) => items.filter((event) => event.id !== action.saved.id)); } else if (action.type === 'delete') { const restored = await calendarApi.createEvent(action.previous); setEvents((items) => [...items, restored]); } else { const restored = await calendarApi.updateEvent(action.previous.id, action.previous, action.saved.version); setEvents((items) => items.map((event) => event.id === restored.id ? restored : event)); } setHistory((items) => items.slice(0, -1)); setToast(null); } catch (error) { showToast(error.message); } };

  const parseQuick = async () => { if (!quickText.trim()) return; setBusy(true); try { const parsed = await calendarApi.parseQuickAdd(quickText.trim()); setQuickReview({ ...parsed, calendar_id: parsed.calendar_id || calendars[0]?.id }); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const commitQuick = async () => { setBusy(true); try { const saved = await calendarApi.commitQuickAdd(quickReview.draft_id, quickReview); setEvents((items) => [...items, saved]); setQuickReview(null); setQuickText(''); showToast('Quick Add saved'); } catch (error) { setNotice(error.message); } finally { setBusy(false); } };
  const runSync = async () => { setSyncStatus((current) => ({ ...current, state: 'syncing' })); try { const result = await calendarApi.sync(); setSyncStatus(result || { state: 'synced', queued: 0, last_synced_at: new Date().toISOString() }); showToast('Calendars are in sync'); await load(); return true; } catch (error) { setSyncStatus((current) => ({ ...current, state: 'error' })); setNotice(error.message); return false; } };
  const createCalendar = async (draft) => { try { const saved = await calendarApi.createCalendar(draft); setCalendars((items) => [...items, saved]); showToast('Calendar saved'); } catch (error) { setNotice(error.message); } };
  const updateCalendar = async (id, patch, defer = false) => {
    const previous = calendars.find((entry) => entry.id === id);
    setCalendars((items) => items.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
    if (defer) return previous ? { ...previous, ...patch } : null;
    try {
      const saved = await calendarApi.updateCalendar(id, patch, previous?.version);
      setCalendars((items) => items.map((entry) => entry.id === id ? saved : entry)); return saved;
    } catch (error) {
      if (previous) setCalendars((items) => items.map((entry) => entry.id === id ? previous : entry));
      setNotice(error.message); return null;
    }
  };
  const deleteCalendar = async (id) => { const target = calendars.find((calendar) => calendar.id === id); if (!target || !window.confirm(`Delete “${target.name}” and its events?`)) return; try { await calendarApi.deleteCalendar(id); setCalendars((items) => items.filter((calendar) => calendar.id !== id)); showToast('Calendar deleted'); } catch (error) { setNotice(error.message); } };
  const updatePreferences = async (patch) => { setPreferences((current) => ({ ...current, ...patch })); try { await calendarApi.updatePreferences(patch); } catch (error) { setNotice(error.message); } };
  const previewImport = async (file) => { try { setImportPreview(await calendarApi.importPreview(file, calendars[0]?.id)); } catch (error) { setNotice(error.message); } };
  const commitImport = async () => { try { const result = await calendarApi.importCommit(importPreview.preview_id || importPreview.import_id, calendars[0]?.id); setImportPreview(null); showToast(`${result.imported || 0} events imported`); await load(); } catch (error) { setNotice(error.message); } };
  const saveTemplate = async () => { const name = window.prompt('Template name'); if (!name?.trim()) return; try { const saved = await calendarApi.saveTemplate(name.trim(), { ...editor, id: undefined, title: editor.title || '', start: undefined, end: undefined }); setTemplates((items) => [...items.filter((item) => item.id !== saved.id && item.name !== saved.name), saved]); showToast('Event template saved'); } catch (error) { setNotice(error.message); } };
  const suggestTime = async () => { try { const choices = await calendarApi.suggestedTimes(editor); if (!choices?.length) { showToast('No free time was found in working hours'); return; } setEditor((current) => ({ ...current, start: toLocalInput(choices[0].start), end: toLocalInput(choices[0].end) })); showToast('Moved to the next free time'); } catch (error) { setNotice(error.message); } };
  const saveSmartView = async () => { const name = window.prompt('Smart view name'); if (!name?.trim()) return; try { const saved = await calendarApi.saveSmartView(name.trim(), { query, view, calendar_ids: visibleCalendars, importance: activeSmartFilter }); setSmartViews((items) => [...items.filter((item) => item.id !== saved.id && item.name !== saved.name), saved]); showToast('Smart view saved'); } catch (error) { setNotice(error.message); } };
  const applySmartView = (smartView) => {
    const filters = smartView.filters || {};
    setQuery(filters.query || '');
    setActiveSmartFilter(filters.importance || '');
    if (Array.isArray(filters.calendar_ids)) {
      setCalendars((items) => items.map((calendar) => ({ ...calendar, visible: filters.calendar_ids.includes(calendar.id) })));
    }
    if (VIEWS.includes(filters.view)) setView(filters.view);
    setFilterOpen(false);
  };
  const deleteSelectedEvents = async () => { if (!selectedIds.length || !window.confirm(`Delete ${selectedIds.length} selected events?`)) return; try { for (const id of selectedIds) await calendarApi.deleteEvent(id); setEvents((items) => items.filter((item) => !selectedIds.includes(item.id))); setSelectedIds([]); setBulkMode(false); showToast('Selected events deleted'); } catch (error) { setNotice(error.message); } };
  const moveEvent = async (id, targetDay, preserveTime) => {
    const current = events.find((event) => event.id === id); if (!current) return;
    const previous = { ...current }; const target = new Date(targetDay);
    let patch;
    if (current.all_day) {
      const dayCount = Math.max(1, Math.round((new Date(current.end) - new Date(current.start)) / 86400000));
      patch = { ...current, start: dateKey(target), end: dateKey(addDays(target, dayCount)), start_date: dateKey(target), end_date: dateKey(addDays(target, dayCount)) };
    } else {
      const oldStart = new Date(current.start); const duration = Math.max(900000, new Date(current.end) - oldStart);
      if (preserveTime) target.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
      patch = { ...current, start: target.toISOString(), end: new Date(target.getTime() + duration).toISOString() };
    }
    setEvents((items) => items.map((event) => event.id === id ? { ...event, ...patch, _pending: true } : event));
    try { const saved = await calendarApi.updateEvent(id, patch, current.version); setEvents((items) => items.map((event) => event.id === id ? saved : event)); setHistory((items) => [...items.slice(-19), { type: 'update', previous, saved }]); showToast('Event moved', 'undo'); }
    catch (error) { setEvents((items) => items.map((event) => event.id === id ? previous : event)); setNotice(error.message); }
  };

  const dispatchCommand = useCallback(async (detail) => {
    const action = detail?.action || detail?.command;
    const requestId = String(detail?.request_id || '').trim();
    if (requestId) {
      const now = Date.now();
      for (const [id, timestamp] of processedCommandIdsRef.current) if (now - timestamp > 120000) processedCommandIdsRef.current.delete(id);
      if (processedCommandIdsRef.current.has(requestId)) return;
      processedCommandIdsRef.current.set(requestId, now);
    }
    const report = (status, message, data = {}) => onCommandResult?.({
      protocol_version: 2, widget: 'calendar', command: action,
      request_id: detail?.request_id, status, detail: message, data,
    });
    try {
      const normalized = String(action || '').toLowerCase().replace(/[-\s]/g, '_');
      if (normalized === 'close') { onClose?.(); report('completed', 'Calendar closed.'); }
      else if (normalized === 'minimize') { onMinimize?.(); report('completed', 'Calendar minimized.'); }
      else if (normalized === 'today' || normalized === 'go_to_today') { today(); report('completed', 'Calendar moved to today.'); }
      else if (normalized === 'navigate' || normalized === 'previous' || normalized === 'next') {
        const direction = normalized === 'previous' ? -1 : normalized === 'next' ? 1 : (Number(detail.direction) || 0);
        if (![-1, 1].includes(direction)) throw new Error('Calendar navigation direction must be previous or next.');
        navigate(direction); report('completed', `Calendar moved ${direction < 0 ? 'backward' : 'forward'}.`, { direction });
      }
      else if (normalized === 'set_view' || normalized === 'view') {
        if (!VIEWS.includes(detail.view)) throw new Error(`Unsupported calendar view: ${detail.view || 'missing'}.`);
        setView(detail.view); report('completed', `Calendar switched to ${detail.view} view.`, { view: detail.view });
      }
      else if (normalized === 'go_to_date' || normalized === 'select_date') {
        const target = new Date(detail.date || detail.selected_date); if (Number.isNaN(target.getTime())) throw new Error('A valid calendar date is required.');
        setFocus(target); setSelected(target); report('completed', `Calendar selected ${dateKey(target)}.`, { date: dateKey(target) });
      }
      else if (action === 'sync') {
        report('working', 'Synchronizing calendars.');
        const synced = await runSync();
        report(synced ? 'completed' : 'failed', synced ? 'Calendars synchronized.' : 'Calendar synchronization failed.');
      }
      else if (normalized === 'open' || normalized === 'show' || normalized === 'focus') {
        if (VIEWS.includes(detail.view)) setView(detail.view);
        if (detail.date) { const target = new Date(detail.date); setFocus(target); setSelected(target); }
        report('completed', 'Calendar view opened.', { view: detail.view, date: detail.date });
      }
      else if (normalized === 'new_event' || normalized === 'open_new_event') {
        const draft = emptyDraft(detail.start ? new Date(detail.start) : selected, detail.calendar_id || calendars[0]?.id);
        setEditor({ ...draft, ...detail, title: detail.title || detail.text || '' });
        report('completed', 'Event editor opened with the supplied details.', { mode: 'draft' });
      }
      else if (normalized === 'create_event') {
        console.info('[WIDGET CMD]', { request_id: requestId, stage: 'calendar received', action: normalized });
        report('working', 'Creating the calendar event.');
        const fields = detail.event || detail.payload || detail;
        const { protocol_version, request_id, source, connection_id, issuedAt, command, action: ignoredAction, ...payload } = fields;
        const requestedCalendar = String(payload.calendar_id || payload.calendar || '').trim();
        // Always resolve against the server list for AI commands. The initial
        // UI defaults use friendly IDs ("personal"), while the API may use a
        // persisted UUID; sending the optimistic ID produces CALENDAR_NOT_FOUND.
        let serverCalendars = calendars;
        try {
          const loaded = await calendarApi.calendars();
          if (Array.isArray(loaded) && loaded.length) { serverCalendars = loaded; setCalendars(loaded); }
        } catch { /* the existing state remains a safe fallback */ }
        let serverPreferences = preferences;
        try { serverPreferences = { ...preferences, ...(await calendarApi.preferences()) }; } catch { /* defaults remain */ }
        const matchedCalendar = serverCalendars.find((calendar) => String(calendar.id) === requestedCalendar || String(calendar.name || '').toLowerCase() === requestedCalendar.toLowerCase());
        payload.calendar_id = matchedCalendar?.id || serverPreferences.default_calendar_id || serverCalendars[0]?.id;
        delete payload.calendar;
        if (!payload.calendar_id) throw new Error('No calendar is available for this event.');
        payload.description = payload.description ?? payload.notes ?? '';
        delete payload.notes;
        if (typeof payload.tags === 'string') payload.tags = payload.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        if (payload.reminder && !payload.reminder_minutes) { payload.reminder_minutes = [Number(payload.reminder.offset_minutes ?? payload.reminder.minutes_before ?? 15)]; payload.reminder_channels = payload.reminder.channels || ['in_app']; }
        delete payload.reminder;
        if (!payload.all_day) {
          for (const key of ['start', 'end']) {
            if (payload[key] && !/[zZ]|[+-]\d\d:?\d\d$/.test(String(payload[key]))) {
              const parsed = new Date(payload[key]); if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${key} datetime.`); payload[key] = parsed.toISOString();
            }
          }
        }
        console.info('[WIDGET CMD]', { request_id: requestId, stage: 'calendar POST payload', action: normalized, payload });
        const saved = await calendarApi.createEvent(payload, requestId || undefined);
        setEvents((items) => [...items, saved]); setSelected(new Date(saved.start)); showToast('Astra created the event');
        report('completed', 'Calendar event created.', { event: saved, event_id: saved.id });
      }
      else if (normalized === 'update_event') {
        const id = detail.event_id || detail.id; const current = eventsRef.current.find((event) => event.id === id);
        if (!current) throw new Error('Astra could not find that event to update.');
        const { protocol_version, request_id, source, connection_id, issuedAt, command, action: ignoredAction, event_id, id: ignoredId, ...eventFields } = detail;
        const patch = detail.patch || detail.event || eventFields;
        report('working', 'Updating the calendar event.');
        const saved = await calendarApi.updateEvent(id, patch, current.version);
        setEvents((items) => items.map((event) => event.id === id ? saved : event));
        showToast('Astra updated the event');
        report('completed', 'Calendar event updated.', { event_id: saved.id || id });
      }
      else if (normalized === 'move_event' || normalized === 'reschedule_event') {
        const id = detail.event_id || detail.id; const target = detail.target_date || detail.date || detail.start;
        if (!id || !target) throw new Error('Move requires event_id and target_date.');
        const current = eventsRef.current.find((event) => event.id === id); if (!current) throw new Error('Astra could not find that event to move.');
        report('working', 'Moving the calendar event.');
        const targetDay = new Date(target); if (Number.isNaN(targetDay.getTime())) throw new Error('A valid target date is required.');
        const oldStart = new Date(current.start); const duration = Math.max(900000, new Date(current.end) - oldStart); if (!current.all_day && detail.preserve_time !== false) targetDay.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
        const patch = current.all_day ? { start: dateKey(targetDay), end: dateKey(addDays(targetDay, Math.max(1, Math.round((new Date(current.end) - oldStart) / 86400000)))) } : { start: targetDay.toISOString(), end: new Date(targetDay.getTime() + duration).toISOString() };
        const saved = await calendarApi.updateEvent(id, patch, current.version); setEvents((items) => items.map((event) => event.id === id ? saved : event)); showToast('Astra moved the event');
        report('completed', 'Calendar event moved.', { event: saved, event_id: id });
      }
      else if (normalized === 'delete_event') {
        const id = detail.event_id || detail.id; const current = eventsRef.current.find((event) => event.id === id);
        if (!current) throw new Error('Astra could not find that event to delete.');
        if (!detail.confirm) { report('failed', 'Confirmation is required before deleting a calendar event.', { confirmation_required: true, event: current }); return; }
        report('working', 'Deleting the calendar event.');
        await calendarApi.deleteEvent(id, detail.scope || 'series', current.version);
        setEvents((items) => items.filter((event) => event.id !== id));
        showToast('Astra deleted the event');
        report('completed', 'Calendar event deleted.', { event_id: id });
      }
      else if (normalized === 'search' || normalized === 'search_events') { setQuery(detail.query || ''); searchRef.current?.focus(); report('completed', 'Calendar search updated.', { query: detail.query || '' }); }
      else if (normalized === 'open_filters') { setSettingsOpen(false); setFilterOpen(true); report('completed', 'Calendar filters opened.'); }
      else if (normalized === 'close_filters') { setFilterOpen(false); report('completed', 'Calendar filters closed.'); }
      else if (normalized === 'clear_filters') { setQuery(''); setActiveSmartFilter(''); const results = await Promise.all(calendars.filter((calendar) => calendar.visible === false).map((calendar) => updateCalendar(calendar.id, { visible: true }))); if (results.some((result) => !result)) throw new Error('One or more calendar visibility updates failed.'); setFilterOpen(false); report('completed', 'Calendar filters cleared.'); }
      else if (normalized === 'set_filter' || normalized === 'set_filters') { setActiveSmartFilter(detail.smart_view || detail.importance || ''); if (Array.isArray(detail.calendar_ids)) { const results = await Promise.all(calendars.map((calendar) => updateCalendar(calendar.id, { visible: detail.calendar_ids.includes(calendar.id) }))); if (results.some((result) => !result)) throw new Error('One or more calendar visibility updates failed.'); } if (detail.query != null) setQuery(detail.query); setFilterOpen(true); report('completed', 'Calendar filters updated.'); }
      else if (normalized === 'set_calendar_visibility') { const ids = detail.calendar_ids || []; const results = await Promise.all(calendars.map((calendar) => updateCalendar(calendar.id, { visible: ids.includes(calendar.id) }))); if (results.some((result) => !result)) throw new Error('One or more calendar visibility updates failed.'); report('completed', 'Calendar visibility updated.', { visible_calendars: ids }); }
      else if (normalized === 'get_state' || normalized === 'read_context' || normalized === 'list_events') { report('completed', 'Calendar state read.', { view, date: dateKey(selected), events: filteredEvents.slice(0, 100), filters: { query, active_smart_filter: activeSmartFilter, visible_calendars: visibleCalendars } }); }
      else if (normalized === 'quick_add') { const text = detail.text || detail.query; if (!text?.trim()) throw new Error('Quick Add text is required.'); setBusy(true); const parsed = await calendarApi.parseQuickAdd(text.trim()); const draft = { ...parsed, calendar_id: parsed.calendar_id || calendars[0]?.id }; if (detail.confirm && draft.draft_id) { const saved = await calendarApi.commitQuickAdd(draft.draft_id, draft); setEvents((items) => [...items, saved]); setQuickReview(null); setQuickText(''); showToast('Astra saved the event'); setBusy(false); report('completed', 'Quick Add event created.', { event: saved, event_id: saved.id }); } else { setQuickReview(draft); setBusy(false); report('completed', 'Quick Add parsed; review is open.', { draft, confirmation_required: true }); } }
      else if (normalized === 'open_settings') { setFilterOpen(false); setSettingsOpen(true); report('completed', 'Calendar settings opened.'); }
      else if (normalized === 'close_settings') { setSettingsOpen(false); report('completed', 'Calendar settings closed.'); }
      else if (normalized === 'apply_smart_view') { const target = smartViews.find((item) => (detail.smart_view_id && item.id === detail.smart_view_id) || (detail.name && item.name.toLowerCase() === String(detail.name).toLowerCase())); if (!target) throw new Error('Saved calendar view was not found.'); applySmartView(target); report('completed', 'Saved calendar view applied.', { smart_view: target }); }
      else if (normalized === 'save_smart_view') { const name = String(detail.name || '').trim(); if (!name) throw new Error('A name is required for a saved calendar view.'); const saved = await calendarApi.saveSmartView(name, { query, view, calendar_ids: visibleCalendars, importance: activeSmartFilter }); setSmartViews((items) => [...items.filter((item) => item.id !== saved.id && item.name !== saved.name), saved]); report('completed', 'Calendar view saved.', { smart_view: saved }); }
      else if (normalized === 'find_free_time') { const draft = editor || { start: detail.start || new Date().toISOString(), end: detail.end || new Date(Date.now() + 3600000).toISOString(), calendar_id: detail.calendar_id || calendars[0]?.id }; const choices = await calendarApi.suggestedTimes(draft); report('completed', choices?.length ? 'Free time suggestions found.' : 'No free time was found.', { choices: choices || [] }); }
      else if (normalized === 'save_template') { const name = String(detail.name || '').trim(); if (!name) throw new Error('A template name is required.'); const payload = detail.payload || (editor ? { ...editor, id: undefined, start: undefined, end: undefined } : {}); const saved = await calendarApi.saveTemplate(name, payload); setTemplates((items) => [...items.filter((item) => item.id !== saved.id && item.name !== saved.name), saved]); report('completed', 'Calendar event template saved.', { template: saved }); }
      else if (normalized === 'apply_template') { const target = templates.find((item) => (detail.template_id && item.id === detail.template_id) || (detail.name && item.name.toLowerCase() === String(detail.name).toLowerCase())); if (!target) throw new Error('Calendar template was not found.'); if (!editor) startCreate(selected); setEditor((current) => ({ ...(current || emptyDraft(selected, calendars[0]?.id)), ...target.payload, id: current?.id || null, start: current?.start || toLocalInput(selected), end: current?.end || toLocalInput(new Date(selected.getTime() + 3600000)) })); report('completed', 'Calendar template applied.', { template: target }); }
      else if (normalized === 'open_dialog') { const dialog = String(detail.dialog || '').toLowerCase(); if (dialog === 'filters') setFilterOpen(true); else if (dialog === 'settings') setSettingsOpen(true); else if (dialog === 'new_event' || dialog === 'event_editor') startCreate(selected); else throw new Error(`Unsupported Calendar dialog: ${dialog || 'missing'}.`); report('completed', `${dialog} dialog opened.`); }
      else report('failed', `Unsupported Calendar command: ${action || 'unknown'}.`);
    } catch (error) {
      const message = error?.message || 'Calendar command failed.';
      setNotice(message);
      report('failed', message, { error: { code: error?.code || 'CALENDAR_COMMAND_FAILED', http_status: error?.status || 0, details: error?.details || null } });
    }
  }, [today, navigate, selected, calendars, preferences.default_calendar_id, filteredEvents, query, activeSmartFilter, visibleCalendars, updateCalendar, runSync, showToast, onClose, onMinimize, onCommandResult, smartViews, templates, editor, applySmartView, startCreate]);
  const dispatchCommandRef = useRef(dispatchCommand);
  useEffect(() => { dispatchCommandRef.current = dispatchCommand; }, [dispatchCommand]);
  useEffect(() => { if (command) dispatchCommandRef.current(command); }, [command]);
  useEffect(() => { const listener = (event) => dispatchCommandRef.current(event.detail); window.addEventListener('astra:calendar-command', listener); return () => window.removeEventListener('astra:calendar-command', listener); }, []);
  useEffect(() => { const keys = (event) => { if (event.target.closest('input,textarea,select,[contenteditable]')) return; if (event.key === 'ArrowLeft') navigate(-1); else if (event.key === 'ArrowRight') navigate(1); else if (event.key.toLowerCase() === 'n') startCreate(); else if (event.key === '/') { event.preventDefault(); searchRef.current?.focus(); } else if (event.key.toLowerCase() === 't') today(); else if (/^[1-4]$/.test(event.key)) setView(VIEWS[Number(event.key) - 1]); else if (event.key.toLowerCase() === 's') runSync(); else if (event.key === '?') setShortcutsOpen(true); else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') undo(); }; window.addEventListener('keydown', keys); return () => window.removeEventListener('keydown', keys); }, [navigate, startCreate, today, history]);

  const period = view === 'week' ? startOfWeek(focus, preferences.week_starts_on) : focus;
  const hiddenCalendarCount = calendars.filter((calendar) => calendar.visible === false).length;
  const activeFilterCount = hiddenCalendarCount + (activeSmartFilter ? 1 : 0);
  return <section ref={widgetRef} className="calendar-widget" data-widget-id="calendar" data-aegis-widget="calendar" aria-label="Calendar widget" style={{ '--cal-x': `${windowOffset.x}px`, '--cal-y': `${windowOffset.y}px`, width: `${windowSize.width}px`, height: `${windowSize.height}px` }}>
    <div className="cal-atmosphere" aria-hidden="true"/>
    <header className="cal-titlebar" onPointerDown={(event) => { if (event.target.closest('button')) return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, origin: windowOffset }; }} onPointerMove={(event) => { if (!dragRef.current || window.innerWidth <= 680) return; const maxX = Math.max(0, window.innerWidth / 2 - 180); const maxY = Math.max(0, window.innerHeight / 2 - 120); setWindowOffset({ x: Math.max(-maxX, Math.min(maxX, dragRef.current.origin.x + event.clientX - dragRef.current.x)), y: Math.max(-maxY, Math.min(maxY, dragRef.current.origin.y + event.clientY - dragRef.current.y)) }); }} onPointerUp={(event) => { dragRef.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}><div className="cal-brand"><span className="cal-brand-mark"><Icon name="calendar"/></span><div><span className="cal-kicker">ORBITAL TIME CONSOLE</span><h1>Calendar</h1></div></div><div className="cal-window-actions"><IconButton icon="minus" label="Minimize calendar" onClick={onMinimize}/><IconButton icon="close" label="Close calendar" className="close" onClick={onClose}/></div></header>
    <div className="cal-toolbar"><div className="cal-nav"><IconButton icon="chevronLeft" label="Previous period" onClick={() => navigate(-1)}/><button type="button" className="cal-today" onClick={today}>Today</button><strong>{periodLabel(view, period)}</strong><IconButton icon="chevronRight" label="Next period" onClick={() => navigate(1)}/></div><div className="cal-view-tabs" role="tablist" aria-label="Calendar view">{VIEWS.map((name, index) => <button type="button" role="tab" aria-selected={view === name} key={name} className={view === name ? 'active' : ''} onClick={() => setView(name)}><span>{index + 1}</span>{name}</button>)}</div><div className="cal-tools"><IconButton icon="settings" label="Calendar settings" onClick={() => { setFilterOpen(false); setSettingsOpen(true); }}/><IconButton icon="sync" label="Sync calendars" className={syncStatus.state === 'syncing' ? 'is-spinning' : ''} onClick={runSync}/><span className="cal-filter-trigger"><IconButton icon="tag" label="Filters and smart views" data-calendar-filter-trigger aria-expanded={filterOpen} aria-controls="calendar-filter-panel" className={filterOpen || activeFilterCount ? 'active' : ''} onClick={() => setFilterOpen((open) => !open)}/>{activeFilterCount > 0 && <i aria-label={`${activeFilterCount} active calendar filters`}/>}</span><button type="button" className="cal-new" onClick={() => startCreate()}><Icon name="plus" size={16}/> New</button></div></div>
    {filterOpen && <aside className="cal-filter-panel" id="calendar-filter-panel" ref={filterRef} aria-label="Calendar filters">
      <header className="cal-filter-header"><span className="cal-filter-emblem"><Icon name="tag" size={17}/></span><span><strong>Calendar filters</strong><small>Shape what appears in your orbit.</small></span><em className={activeFilterCount ? 'active' : ''}>{activeFilterCount ? `${activeFilterCount} active` : 'All events'}</em></header>
      <section className="cal-filter-group" aria-labelledby="visible-calendars-heading"><div className="cal-filter-heading"><span><Icon name="calendar" size={14}/><h3 id="visible-calendars-heading">Visible calendars</h3></span><small>{visibleCalendars.length}/{calendars.length} shown</small></div><div className="cal-filter-options">{calendars.map((calendar) => { const visible = calendar.visible !== false; return <button type="button" className={visible ? 'active' : ''} aria-pressed={visible} key={calendar.id} onClick={() => updateCalendar(calendar.id, { visible: !visible })}><i className="cal-calendar-swatch" style={{ '--calendar-color': calendar.color }}/><span><strong>{calendar.name}</strong><small>{visible ? 'Visible on calendar' : 'Hidden from view'}</small></span><span className="cal-filter-check"><Icon name="check" size={12}/></span></button>; })}</div></section>
      <section className="cal-filter-group" aria-labelledby="smart-views-heading"><div className="cal-filter-heading"><span><Icon name="spark" size={14}/><h3 id="smart-views-heading">Smart views</h3></span><small>Fast focus</small></div><div className="cal-smart-grid"><button type="button" className={activeSmartFilter === 'high' ? 'active' : ''} aria-pressed={activeSmartFilter === 'high'} onClick={() => setActiveSmartFilter((value) => value === 'high' ? '' : 'high')}><span className="cal-smart-mark">!</span><span><strong>High priority</strong><small>Important work only</small></span><Icon name="check" size={12}/></button><button type="button" className={activeSmartFilter === 'upcoming' ? 'active' : ''} aria-pressed={activeSmartFilter === 'upcoming'} onClick={() => { setActiveSmartFilter((value) => value === 'upcoming' ? '' : 'upcoming'); today(); setView('agenda'); }}><span className="cal-smart-mark"><Icon name="clock" size={13}/></span><span><strong>Today & ahead</strong><small>Your next horizon</small></span><Icon name="check" size={12}/></button>{smartViews.map((smartView) => <button type="button" key={smartView.id} onClick={() => applySmartView(smartView)}><span className="cal-smart-mark"><Icon name="layers" size={12}/></span><span><strong>{smartView.name}</strong><small>Saved view</small></span><Icon name="chevronRight" size={12}/></button>)}</div></section>
      <footer className="cal-filter-actions"><button type="button" onClick={saveSmartView}><Icon name="plus" size={13}/><span><strong>Save current view</strong><small>Keep this setup</small></span></button><button type="button" className={bulkMode ? 'active' : ''} aria-pressed={bulkMode} onClick={() => { setBulkMode((value) => !value); setSelectedIds([]); }}><Icon name="check" size={13}/><span><strong>Select multiple</strong><small>Bulk event actions</small></span></button><button type="button" className="cal-clear-filters" onClick={() => { setQuery(''); setActiveSmartFilter(''); calendars.filter((calendar) => calendar.visible === false).forEach((calendar) => updateCalendar(calendar.id, { visible: true })); setFilterOpen(false); }}><Icon name="close" size={13}/>Clear filters</button></footer>
    </aside>}
    <form className="cal-quick-add" onSubmit={(event) => { event.preventDefault(); parseQuick(); }}><span><Icon name="spark" size={17}/></span><input value={quickText} onChange={(e) => setQuickText(e.target.value)} aria-label="Quick Add event" placeholder="Quick Add — describe an event in your own words"/><button type="submit" disabled={busy || !quickText.trim()}>{busy ? 'Reading…' : 'Review'}</button><kbd>↵</kbd></form>
    <div className="cal-focus-ribbon"><span className="cal-kicker">TODAY FOCUS</span>{nextEvent ? <><i style={{ background: nextEvent.color || '#63a8f2' }}/><strong>{nextEvent.title}</strong><time>{formatTime(nextEvent.start, preferences.hour12)}</time>{nextEvent.location && <small>{nextEvent.location}</small>}<button type="button" onClick={() => startEdit(nextEvent)}>Open</button></> : <p>No upcoming events · your next block is open</p>}<span className={`cal-connection ${status}`}><i/>{status === 'offline' ? 'Offline' : syncStatus.queued ? `${syncStatus.queued} queued` : 'Local first'}</span></div>
    {(preferences.pinned_timezones || []).length > 0 && <div className="cal-timezone-deck" aria-label="Pinned timezones">{preferences.pinned_timezones.map((zone) => <div key={zone}><span>{zone.split('/').at(-1)?.replaceAll('_', ' ')}</span><strong>{new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', timeZone: zone, hour12: preferences.hour12 }).format(new Date())}</strong></div>)}</div>}
    {bulkMode && <div className="cal-bulk-bar" role="toolbar" aria-label="Bulk event actions"><strong>{selectedIds.length} selected</strong><span>Select events in the day inspector</span><button type="button" disabled={!selectedIds.length} onClick={deleteSelectedEvents}><Icon name="trash" size={14}/> Delete</button><button type="button" onClick={() => { setBulkMode(false); setSelectedIds([]); }}>Done</button></div>}
    {notice && <div className="cal-error" role="alert"><span>{notice}</span><button type="button" onClick={() => { setNotice(''); load(); }}>Retry</button><IconButton icon="close" label="Dismiss error" onClick={() => setNotice('')}/></div>}
    <main className={`cal-surface is-${view}`} aria-busy={status === 'loading'}>{status === 'loading' && events.length === 0 ? <div className="cal-loading"><i/><i/><i/><span>Plotting your calendar…</span></div> : <>{view === 'month' && <MonthView focus={focus} selected={selected} events={filteredEvents} calendars={calendars} weekStartsOn={preferences.week_starts_on} onSelect={setSelected} onEdit={startEdit} onCreate={startCreate} onMove={moveEvent}/>} {view === 'week' && <WeekView focus={focus} selected={selected} events={filteredEvents} calendars={calendars} weekStartsOn={preferences.week_starts_on} onSelect={setSelected} onEdit={startEdit} onCreate={startCreate} onMove={moveEvent}/>} {view === 'year' && <YearView focus={focus} events={filteredEvents} weekStartsOn={preferences.week_starts_on} onDrill={(day) => { setFocus(day); setSelected(day); setView('month'); }}/>} {view === 'agenda' && <AgendaView focus={focus} events={filteredEvents} onEdit={startEdit} onLoadMore={() => setAgendaDays((days) => days + 90)}/>}</>}</main>
    <div className="cal-splitter" role="separator" aria-label="Resize day inspector" aria-orientation="horizontal" aria-valuemin="110" aria-valuemax="320" aria-valuenow={inspectorHeight} tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowUp') setInspectorHeight((h) => Math.min(320, h + 10)); if (e.key === 'ArrowDown') setInspectorHeight((h) => Math.max(110, h - 10)); }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); resizeRef.current = { y: e.clientY, height: inspectorHeight }; }} onPointerMove={(e) => { if (!resizeRef.current) return; setInspectorHeight(Math.max(110, Math.min(320, resizeRef.current.height + resizeRef.current.y - e.clientY))); }} onPointerUp={(e) => { resizeRef.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }}><i/></div>
    <section className="cal-inspector" style={{ height: inspectorHeight }} aria-labelledby="selected-day-heading">
      <div className="cal-search"><Icon name="search" size={16}/><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search every event, place, and tag…" aria-label="Search calendar events"/>{searching && <span className="cal-searching">Searching…</span>}{query && <button type="button" onClick={() => setQuery('')}>Clear</button>}<kbd>/</kbd></div>
      {query.trim().length >= 2 ? <div className="cal-search-results" aria-live="polite"><header><span className="cal-kicker">GLOBAL RESULTS</span><strong>{searchResults.length} found</strong></header>{!searching && searchResults.length === 0 ? <p>No events match “{query.trim()}”.</p> : searchResults.map((event) => <button type="button" key={event.id} onClick={() => { const day = new Date(event.start); setFocus(day); setSelected(day); setQuery(''); startEdit(event); }}><Icon name="calendar" size={15}/><span><strong>{event.title}</strong><small>{new Date(event.start).toLocaleDateString()} · {event.location || 'No location'}</small></span><Icon name="chevronRight" size={14}/></button>)}</div> : <>
        <header><div><span className="cal-kicker">SELECTED DAY</span><h2 id="selected-day-heading">{selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}{dateKey(selected) === dateKey(new Date()) && <em>Today</em>}</h2></div><IconButton icon="plus" label="Add event on selected day" className="round" onClick={() => startCreate(selected)}/></header>
        <div className="cal-selected-list">{selectedEvents.length === 0 ? <p className="cal-no-events">No events · double-click the calendar or press N to create one.</p> : selectedEvents.map((event) => <button type="button" key={event.id} className={selectedIds.includes(event.id) ? 'selected' : ''} aria-pressed={bulkMode ? selectedIds.includes(event.id) : undefined} onClick={() => bulkMode ? setSelectedIds((items) => items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id]) : startEdit(event)}><i style={{ background: event.color || calendars.find((c) => c.id === event.calendar_id)?.color }}/><time>{event.all_day ? 'All day' : formatTime(event.start, preferences.hour12)}</time><strong>{event.title}</strong><small>{event.location}</small><Icon name={bulkMode && selectedIds.includes(event.id) ? 'check' : 'chevronRight'} size={15}/></button>)}</div>
      </>}
    </section>
    <button type="button" className="cal-help-button" onClick={() => setShortcutsOpen(true)} aria-label="Show keyboard shortcuts">?</button>
    {toast && <div className="cal-toast" role="status"><Icon name="check" size={16}/><span>{toast.message}</span>{toast.action === 'undo' && <button type="button" onClick={undo}>Undo</button>}{toast.action === 'snooze' && <button type="button" onClick={async () => { await calendarApi.snoozeReminder(toast.reminderId, 10); seenRemindersRef.current.delete(toast.reminderId); setToast(null); }}>Snooze 10m</button>}<IconButton icon="close" label="Dismiss notification" onClick={() => setToast(null)}/></div>}
    {editor && <EventEditorV2 draft={editor} calendars={calendars} templates={templates} onChange={(patch) => { setEditorError(''); setEditor((current) => ({ ...current, ...patch })); }} onCancel={() => { setEditorError(''); setEditor(null); }} onSave={saveEvent} onDelete={deleteEvent} onApplyTemplate={(payload) => setEditor((current) => ({ ...current, ...payload, id: current.id, start: current.start, end: current.end, calendar_id: payload.calendar_id || current.calendar_id }))} onSaveTemplate={saveTemplate} onSuggestTime={suggestTime} saving={eventSaving} submitError={editorError}/>}
    {quickReview && <QuickReview draft={quickReview} calendars={calendars} onChange={(patch) => setQuickReview((current) => ({ ...current, ...patch }))} onCancel={() => setQuickReview(null)} onCommit={commitQuick} saving={busy}/>}
    {settingsOpen && <Settings calendars={calendars} preferences={preferences} syncStatus={syncStatus} notice={notice} onClose={() => setSettingsOpen(false)} onCreate={createCalendar} onUpdate={updateCalendar} onDelete={deleteCalendar} onPreferences={updatePreferences} onSync={runSync} onImport={previewImport} importPreview={importPreview} onCommitImport={commitImport}/>}
    {shortcutsOpen && <Modal title="Keyboard map" onClose={() => setShortcutsOpen(false)}><div className="cal-shortcuts">{[['← / →','Previous / next period'],['T','Today'],['N','New event'],['/','Search'],['1—4','Switch calendar view'],['S','Sync now'],['⌘ Z','Undo last action'],['?','Keyboard map']].map(([key, label]) => <div key={key}><kbd>{key}</kbd><span>{label}</span></div>)}</div></Modal>}
  </section>;
}
