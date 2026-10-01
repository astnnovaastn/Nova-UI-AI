import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './themewidget.css';
import {
  BUILTIN_THEMES, DEFAULT_THEME_ID, FONT_OPTIONS, PATTERN_OPTIONS, TOKEN_RANGES, accessibleText, applyTheme,
  contrastRatio, downloadJson, generateHarmonyColors, hexToHsl, installCustomFonts, normalizeTheme, parseColorInput, themeApi,
} from './theme.js';
import { orbThemes } from '../../orb-themes';

const COLOR_FIELDS = [
  ['bg', 'Canvas'], ['fg', 'Text'], ['panel', 'Panel'], ['border', 'Border'], ['accent', 'Accent'],
];
const RANGE_FIELDS = [
  ['uiScale', 'UI scale', '%'], ['spacing', 'Spacing', '×'], ['radius', 'Corner radius', 'px'], ['borderWidth', 'Border width', 'px'],
  ['panelOpacity', 'Panel opacity', ''], ['blur', 'Backdrop blur', 'px'], ['shadow', 'Shadow depth', ''], ['glow', 'Accent glow', ''],
];
const WIDGETS = ['search', 'news', 'weather', 'task', 'calendar', 'notes', 'image', 'calculator', 'tictactoe', 'chat'];
const WIDGET_LABELS = { search: 'Search', news: 'News', weather: 'Weather', task: 'Tasks', calendar: 'Calendar', notes: 'Notes', image: 'Image', calculator: 'Calculator', tictactoe: 'Tic-tac-toe', chat: 'Chat' };
const API_STATUS = { idle: 'Saved', saving: 'Saving…', saved: 'Saved', offline: 'Offline', error: 'Save failed' };

const clone = (value) => JSON.parse(JSON.stringify(value));
const uniqueName = (name, themes) => {
  const names = new Set(themes.map((theme) => theme.name.toLowerCase()));
  let candidate = `${name} Custom`, number = 2;
  while (names.has(candidate.toLowerCase())) candidate = `${name} Custom ${number++}`;
  return candidate;
};

function Icon({ name }) {
  const paths = {
    palette: <><circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7" r="1"/><path d="M13 21a3 3 0 0 1 3-5h3"/></>,
    undo: <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6"/>, redo: <path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6"/>,
    check: <path d="m5 12 4 4L19 6"/>, copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5H5v11h3"/></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M5 20h14"/></>, trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.palette}</svg>;
}

function ColorControl({ name, label, value, recent, onChange, onRecent, onReset }) {
  const ratio = name === 'fg' ? contrastRatio(value, document.documentElement.style.getPropertyValue('--bg') || '#282c34') : null;
  const [mode, setMode] = useState('HEX');
  const rgb = value.slice(1).match(/../g).map((v) => parseInt(v, 16)).join(' ');
  const formatted = mode === 'HEX' ? value : mode === 'RGB' ? rgb : hexToHsl(value);
  const [entry, setEntry] = useState(formatted);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setEntry(formatted); setInvalid(false); }, [formatted]);
  const commit = () => { const parsed = parseColorInput(entry, mode); if (parsed) { setInvalid(false); onChange(parsed); } else { setInvalid(true); } };
  const nextMode = mode === 'HEX' ? 'RGB' : mode === 'RGB' ? 'HSL' : 'HEX';
  return <div className="studio-color-control">
    <div className="studio-control-label"><span>{label}</span>{ratio && <small className={ratio >= 4.5 ? 'pass' : 'fail'}>{ratio.toFixed(2)}:1 {ratio >= 4.5 ? 'AA' : 'Low'}</small>}</div>
    <div className="studio-color-entry">
      <label className="studio-swatch" style={{ '--swatch': value }}><span className="sr-only">Choose {label} color</span><input type="color" value={value} onChange={(e) => onChange(e.target.value)} /></label>
      <button type="button" className="studio-mode" onClick={() => setMode(nextMode)} aria-label={`Switch ${label} editor to ${nextMode}`}>{mode}</button>
      <input className={invalid ? 'is-invalid' : ''} aria-invalid={invalid} aria-label={`${label} ${mode} value`} value={entry} onChange={(e) => { setEntry(e.target.value); setInvalid(false); }} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />
      <button type="button" className="studio-icon-button" onClick={() => navigator.clipboard?.writeText(value)} aria-label={`Copy ${label}`}><Icon name="copy" /></button>
      <button type="button" className="studio-reset-token" onClick={onReset} aria-label={`Reset ${label}`}>↺</button>
    </div>
    {recent.length > 0 && <div className="studio-recents" aria-label="Recent colors">{recent.slice(0, 6).map((color) => <button type="button" key={color} style={{ background: color }} onClick={() => onRecent(color)} aria-label={`Use ${color}`} />)}</div>}
  </div>;
}

function ThemeCard({ theme, active, isDefault, onApply, onDefault, onEdit, onDuplicate, onRename, onExport, onDelete }) {
  const colors = theme.tokens;
  return <article className={`studio-theme-card${active ? ' is-active' : ''}`}>
    <button className="studio-card-main" type="button" onClick={onApply} aria-label={`Apply ${theme.name}`}>
      <span className="studio-palette">{['bg', 'panel', 'border', 'accent', 'fg'].map((key) => <i key={key} style={{ background: colors[key] }} />)}</span>
      <span className="studio-card-copy"><strong>{theme.name}</strong><small>{theme.builtin ? 'Astra preset' : 'Custom JSON'}</small></span>
      <span className="studio-badges">{active && <em>Active</em>}{isDefault && <em className="default">Default</em>}</span>
    </button>
    <div className="studio-card-actions">
      <button type="button" onClick={onDefault} disabled={isDefault}>{isDefault ? 'Startup default' : 'Set default'}</button>
      <button type="button" onClick={onEdit}>Edit</button>
      <button type="button" onClick={onDuplicate}>Duplicate</button>
      {!theme.builtin && <><button type="button" onClick={onRename}>Rename</button><button type="button" onClick={onExport}>Export</button><button type="button" className="danger" onClick={onDelete}>Delete</button></>}
    </div>
  </article>;
}

export default function ThemeWidget({ onClose, onMinimize }) {
  const fallback = Object.values(BUILTIN_THEMES);
  const [library, setLibrary] = useState({ builtins: fallback, custom: [], defaultThemeId: DEFAULT_THEME_ID, maxCustomThemes: 100 });
  const [active, setActive] = useState(normalizeTheme(JSON.parse(localStorage.getItem('astra-active-theme-v2') || 'null')));
  const [draft, setDraft] = useState(active);
  const [tab, setTab] = useState('themes');
  const [section, setSection] = useState('colors');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [notice, setNotice] = useState('');
  const [recent, setRecent] = useState([]);
  const [customFonts, setCustomFonts] = useState([]);
  const [harmony, setHarmony] = useState({ type: 'complementary', appearance: 'dark' });
  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSource, setCreateSource] = useState(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState('search');
  const [previewActive, setPreviewActive] = useState(false);
  const [history, setHistory] = useState([active]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [position, setPosition] = useState({ x: Math.max(12, window.innerWidth - 760), y: 24 });
  const [size, setSize] = useState({ width: Math.min(720, window.innerWidth - 24), height: Math.min(820, window.innerHeight - 48) });
  const shellRef = useRef(null), drag = useRef(null), resize = useRef(null), saveTimer = useRef(null), requestVersion = useRef(0), fileRef = useRef(null);
  const allThemes = useMemo(() => [...library.builtins, ...library.custom], [library]);
  const defaults = BUILTIN_THEMES[draft.baseThemeId || (draft.builtin ? draft.id : DEFAULT_THEME_ID)]?.tokens || BUILTIN_THEMES.dark.tokens;
  const filtered = allThemes.filter((theme) => theme.name.toLowerCase().includes(query.toLowerCase()));

  const refresh = async () => {
    try { setLibrary(await themeApi.list()); } catch { setStatus('offline'); }
  };
  useEffect(() => { refresh(); themeApi.fonts().then(async (fonts) => { setCustomFonts(fonts || []); await installCustomFonts(fonts || []); }).catch(() => {}); }, []);

  const startDrag = (event) => {
    if (event.target.closest('button,input,select')) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX - position.x, y: event.clientY - position.y };
  };
  const moveDrag = (event) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    event.preventDefault();
    const next = { x: Math.max(0, Math.min(window.innerWidth - 180, event.clientX - drag.current.x)), y: Math.max(0, Math.min(window.innerHeight - 80, event.clientY - drag.current.y)) };
    drag.current.next = next;
    if (shellRef.current) { shellRef.current.style.left = `${next.x}px`; shellRef.current.style.top = `${next.y}px`; }
  };
  const endDrag = (event) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (drag.current.next) setPosition(drag.current.next);
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const startResize = (event) => {
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resize.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, w: size.width, h: size.height };
  };
  const moveResize = (event) => {
    if (resize.current?.pointerId !== event.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    const next = { width: Math.max(520, Math.min(window.innerWidth - 24, resize.current.w + event.clientX - resize.current.x)), height: Math.max(560, Math.min(window.innerHeight - 24, resize.current.h + event.clientY - resize.current.y)) };
    resize.current.next = next;
    if (shellRef.current) { shellRef.current.style.width = `${next.width}px`; shellRef.current.style.height = `${next.height}px`; }
  };
  const endResize = (event) => {
    if (resize.current?.pointerId !== event.pointerId) return;
    if (resize.current.next) setSize(resize.current.next);
    resize.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const selectDraft = (theme) => { const normalized = normalizeTheme(theme); setActive(normalized); setDraft(clone(normalized)); applyTheme(normalized); };
  const applyAndTrack = (next) => {
    const normalized = normalizeTheme(next); setDraft(normalized); if (!createMode) setActive(normalized); applyTheme(normalized);
    setHistory((old) => [...old.slice(0, historyIndex + 1), clone(normalized)].slice(-40)); setHistoryIndex((index) => Math.min(index + 1, 39));
    if (!createMode) scheduleSave(normalized); else setStatus('idle');
  };
  const ensureCustom = async (source = draft) => {
    if (!source.builtin) return source;
    setStatus('saving');
    const created = await themeApi.create({ name: uniqueName(source.name, allThemes), baseThemeId: source.id, tokens: source.tokens, orb: source.orb, widgetOverrides: source.widgetOverrides });
    await refresh(); selectDraft(created); setStatus('saved'); return created;
  };
  const scheduleSave = (next) => {
    clearTimeout(saveTimer.current);
    const version = ++requestVersion.current;
    saveTimer.current = setTimeout(async () => {
      try {
        const target = await ensureCustom(next); setStatus('saving');
        const saved = await themeApi.update(target.id, { tokens: next.tokens, orb: next.orb, widgetOverrides: next.widgetOverrides });
        if (version === requestVersion.current) { setDraft(saved); setActive(saved); setStatus('saved'); await refresh(); }
      } catch (error) { setStatus(navigator.onLine ? 'error' : 'offline'); setNotice(error.message); }
    }, 250);
  };
  const editTokens = async (patch) => {
    let target = draft;
    if (!createMode && target.builtin) { try { target = await ensureCustom(target); } catch (error) { setNotice(error.message); return; } }
    applyAndTrack({ ...target, tokens: { ...target.tokens, ...patch } });
  };
  const editTheme = async (patch) => {
    let target = draft;
    if (!createMode && target.builtin) { try { target = await ensureCustom(target); } catch (error) { setNotice(error.message); return; } }
    applyAndTrack({ ...target, ...patch });
  };
  const moveHistory = (delta) => {
    const index = historyIndex + delta; if (index < 0 || index >= history.length) return;
    const item = clone(history[index]); setHistoryIndex(index); setDraft(item); if (!createMode) setActive(item); applyTheme(item); if (!createMode) scheduleSave(item);
  };
  const setDefault = async (theme) => { try { await themeApi.setDefault(theme.id); setLibrary((old) => ({ ...old, defaultThemeId: theme.id })); setNotice(`${theme.name} will load at startup.`); } catch (error) { setNotice(error.message); } };
  const duplicate = async (theme) => { try { const item = await themeApi.duplicate(theme.id); await refresh(); selectDraft(item); setTab('customize'); } catch (error) { setNotice(error.message); } };
  const rename = async (theme) => { const name = window.prompt('Theme name', theme.name)?.trim(); if (!name) return; try { await themeApi.update(theme.id, { name }); await refresh(); } catch (error) { setNotice(error.message); } };
  const remove = async (theme) => {
    const isDefault = library.defaultThemeId === theme.id;
    const prompt = isDefault ? `“${theme.name}” is your startup default. Delete it and use Dark as the new default?` : `Delete “${theme.name}”? This cannot be undone.`;
    if (!window.confirm(prompt)) return;
    try { await themeApi.remove(theme.id, isDefault ? DEFAULT_THEME_ID : undefined); if (active.id === theme.id) selectDraft(BUILTIN_THEMES.dark); await refresh(); setNotice(isDefault ? 'Theme deleted. Dark is now the startup default.' : 'Theme deleted.'); } catch (error) { setNotice(error.message); }
  };
  const exportTheme = async (theme) => { try { downloadJson(await themeApi.export(theme.id), `astra-${theme.name.toLowerCase().replace(/\W+/g, '-')}.json`); } catch (error) { setNotice(error.message); } };
  const importFile = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { await themeApi.import(JSON.parse(await file.text())); await refresh(); setNotice('Theme imported.'); } catch (error) { setNotice(`Import failed: ${error.message}`); } event.target.value = ''; };
  const onColor = (key, color) => { setRecent((values) => [color, ...values.filter((v) => v !== color)].slice(0, 12)); editTokens({ [key]: color }); };
  const beginCreate = () => {
    clearTimeout(saveTimer.current);
    const source = clone(active); setCreateSource(source); setCreateName(''); setCreateMode(true); setStatus('idle');
    const next = normalizeTheme({ ...clone(source), id: 'unsaved-draft', name: 'Untitled theme', builtin: false, baseThemeId: source.builtin ? source.id : source.baseThemeId });
    setDraft(next); setHistory([next]); setHistoryIndex(0); applyTheme(next); setTab('customize');
  };
  const cancelCreate = () => { if (createSource) selectDraft(createSource); setCreateMode(false); setCreateName(''); setCreateSource(null); setNotice('Unsaved theme discarded.'); };
  const saveCreate = async () => {
    const name = createName.trim();
    if (!name || name.length > 80 || /[\x00-\x1f]/.test(name)) { setNotice('Enter a valid theme name (1–80 characters).'); return; }
    if (allThemes.some((theme) => theme.name.toLowerCase() === name.toLowerCase())) { setNotice('A theme with that name already exists.'); return; }
    if (createSaving) return;
    setCreateSaving(true); setStatus('saving');
    try {
      const saved = await themeApi.create({ name, baseThemeId: draft.baseThemeId, tokens: draft.tokens, orb: draft.orb, widgetOverrides: draft.widgetOverrides });
      setCreateMode(false); setCreateName(''); setCreateSource(null); selectDraft(saved); await refresh(); setStatus('saved'); setNotice(`${name} saved.`);
    } catch (error) { setStatus('error'); setNotice(error.message); }
    finally { setCreateSaving(false); }
  };
  const updateWidgetField = (key, value) => editTheme({ widgetOverrides: { ...draft.widgetOverrides, [selectedWidget]: { ...(draft.widgetOverrides[selectedWidget] || {}), [key]: value } } });
  const resetWidgetField = (key) => { const fields = { ...(draft.widgetOverrides[selectedWidget] || {}) }; delete fields[key]; const overrides = { ...draft.widgetOverrides }; if (Object.keys(fields).length) overrides[selectedWidget] = fields; else delete overrides[selectedWidget]; editTheme({ widgetOverrides: overrides }); };
  const contrast = contrastRatio(draft.tokens.fg, draft.tokens.bg);

  return createPortal(<aside ref={shellRef} data-aegis-widget="theme" className="theme-studio-shell" style={{ left: position.x, top: position.y, width: size.width, height: size.height }} aria-label="Astra Appearance Studio">
    <div className="theme-studio">
      <header className="studio-header" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <span className="studio-mark"><Icon name="palette" /></span><div><p>ASTRA CONTROL SURFACE</p><h2>Appearance Studio</h2></div>
        <div className={`studio-save-status is-${status}`}><i />{createMode && status === 'idle' ? 'Unsaved' : API_STATUS[status]}{(status === 'error' || status === 'offline') && <button onClick={createMode ? saveCreate : () => scheduleSave(draft)}>Retry</button>}</div>
        <button className="studio-window" onClick={onMinimize} aria-label="Minimize Appearance Studio">—</button><button className="studio-window close" onClick={onClose} aria-label="Close Appearance Studio">×</button>
      </header>
      <nav className="studio-tabs" aria-label="Theme studio sections"><button className={tab === 'themes' ? 'active' : ''} onClick={() => setTab('themes')}>Theme library</button><button className={tab === 'customize' ? 'active' : ''} onClick={() => setTab('customize')}>Customize</button></nav>
      {notice && <div className="studio-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
      {tab === 'themes' ? <main className="studio-library">
        <div className="studio-library-toolbar"><label><span className="sr-only">Search themes</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search built-in and custom themes…" /></label><button className="studio-primary" onClick={beginCreate}>+ New theme</button><button onClick={() => fileRef.current.click()}>Import</button><button onClick={async () => downloadJson(await themeApi.export(), 'astra-themes.json')}>Export all</button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importFile}/></div>
        <div className="studio-library-meta"><span>{library.custom.length} / {library.maxCustomThemes} custom themes</span><span>Apply and startup default are separate</span></div>
        <div className="studio-card-list">{filtered.map((theme) => <ThemeCard key={theme.id} theme={theme} active={active.id === theme.id} isDefault={library.defaultThemeId === theme.id} onApply={() => selectDraft(theme)} onDefault={() => setDefault(theme)} onEdit={() => { selectDraft(theme); setTab('customize'); }} onDuplicate={() => duplicate(theme)} onRename={() => rename(theme)} onExport={() => exportTheme(theme)} onDelete={() => remove(theme)} />)}</div>
      </main> : <main className="studio-editor">
        <aside className="studio-editor-nav"><div className="studio-current"><span>{createMode ? 'CREATING' : 'EDITING'}</span><strong>{createMode ? (createName || 'Untitled theme') : draft.name}</strong><small>{createMode ? 'Unsaved · preview only' : draft.builtin ? 'Preset · edits create a copy' : 'Custom · autosaved'}</small></div>{[['colors','Colors'],['layout','Layout'],['effects','Effects'],['orb','Orb'],['widgets','Widgets']].map(([id,label]) => <button key={id} className={section === id ? 'active' : ''} onClick={(event) => { setSection(id); event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }}>{label}</button>)}</aside>
        <section className="studio-editor-body">
          {createMode && <div className="studio-creator" role="region" aria-label="Create new theme"><div><span>CREATE NEW THEME</span><strong>Unsaved draft</strong><small>Based on {createSource?.name || 'current theme'} · no JSON exists yet</small></div><label><span>Name</span><input value={createName} maxLength={80} autoFocus onChange={(event) => setCreateName(event.target.value)} placeholder="My Astra theme" /></label><button type="button" className="studio-primary" onClick={saveCreate} disabled={createSaving}>{createSaving ? 'Saving…' : 'Save theme'}</button><button type="button" onClick={cancelCreate} disabled={createSaving}>Cancel</button></div>}
          <div className="studio-editor-toolbar"><div><button onClick={() => moveHistory(-1)} disabled={historyIndex <= 0} aria-label="Undo"><Icon name="undo" /></button><button onClick={() => moveHistory(1)} disabled={historyIndex >= history.length - 1} aria-label="Redo"><Icon name="redo" /></button></div><button onClick={() => editTokens(defaults)}>Reset all</button></div>
          <div className={`studio-preview preview-pattern-${draft.tokens.pattern}${previewActive ? ' is-actioned' : ''}`} style={{ '--preview-bg': draft.tokens.bg, '--preview-panel': draft.tokens.panel, '--preview-fg': draft.tokens.fg, '--preview-accent': draft.tokens.accent, '--preview-border': draft.tokens.border, '--preview-radius': `${draft.tokens.radius}px`, '--preview-pattern': draft.tokens.patternColor || draft.tokens.fg, '--preview-opacity': draft.tokens.panelOpacity }}><div className="preview-pattern-layer"/><div className="preview-rail"><i/><i/><i/></div><div className="preview-panel"><span>{previewActive ? 'ACTION CONFIRMED' : 'ASTRA'}</span><strong>Live interface preview</strong><p>{previewActive ? 'The local preview interaction is working.' : `${draft.tokens.pattern} atmosphere · ${draft.tokens.density} density`}</p><button type="button" aria-pressed={previewActive} onClick={() => setPreviewActive((value) => !value)}>{previewActive ? 'Reset demo' : 'Action'}</button></div><div className="preview-orb" title={`Orb preset: ${draft.orb.preset}`} /></div>
          {section === 'colors' && <div className="studio-section"><div className="studio-section-title"><div><span>01 / PALETTE</span><h3>Semantic colors</h3></div><div className={`studio-contrast ${contrast >= 4.5 ? 'pass' : 'fail'}`}><strong>{contrast.toFixed(2)}:1</strong><span>Text contrast</span>{contrast < 4.5 && <button onClick={() => editTokens({ fg: accessibleText(draft.tokens.bg) })}>Auto fix</button>}</div></div><div className="studio-harmony"><label>Harmony<select value={harmony.type} onChange={(e) => setHarmony((old) => ({ ...old, type: e.target.value }))}><option>complementary</option><option>analogous</option><option>triadic</option><option>monochromatic</option></select></label><label>Appearance<select value={harmony.appearance} onChange={(e) => setHarmony((old) => ({ ...old, appearance: e.target.value }))}><option>dark</option><option>light</option></select></label><button onClick={() => editTokens(generateHarmonyColors(draft.tokens.accent, harmony.type, harmony.appearance))}>Generate & apply</button></div><div className="studio-color-grid">{COLOR_FIELDS.map(([key,label]) => <ColorControl key={key} name={key} label={label} value={draft.tokens[key]} recent={recent} onChange={(color) => onColor(key,color)} onRecent={(color) => onColor(key,color)} onReset={() => editTokens({ [key]: defaults[key] })}/>)}</div></div>}
          {section === 'layout' && <div className="studio-section"><div className="studio-section-title"><div><span>02 / GEOMETRY</span><h3>Layout & typography</h3></div><button onClick={() => editTokens({ font: defaults.font, density: defaults.density, borderStyle: defaults.borderStyle, ...Object.fromEntries(RANGE_FIELDS.slice(0, 5).map(([key]) => [key, defaults[key]])) })}>Reset section</button></div><div className="studio-field-grid"><label>Typeface<select value={draft.tokens.font} onChange={(e) => editTokens({ font: e.target.value })}><optgroup label="Built in">{Object.keys(FONT_OPTIONS).map((font) => <option key={font}>{font}</option>)}</optgroup>{customFonts.length > 0 && <optgroup label="Custom fonts">{customFonts.map((font) => <option value={font.name} key={`${font.name}-${font.file}`}>{font.name}</option>)}</optgroup>}</select></label><label>Density<select value={draft.tokens.density} onChange={(e) => editTokens({ density: e.target.value })}><option>compact</option><option>comfortable</option><option>spacious</option></select></label><label>Border style<select value={draft.tokens.borderStyle} onChange={(e) => editTokens({ borderStyle: e.target.value })}><option>solid</option><option>dashed</option><option>double</option><option>none</option></select></label>{RANGE_FIELDS.slice(0,5).map(([key,label,suffix]) => <label key={key}>{label}<output>{draft.tokens[key]}{suffix}</output><input type="range" min={TOKEN_RANGES[key][0]} max={TOKEN_RANGES[key][1]} step={TOKEN_RANGES[key][2]} value={draft.tokens[key]} onChange={(e) => editTokens({ [key]: Number(e.target.value) })}/></label>)}</div></div>}
          {section === 'effects' && <div className="studio-section"><div className="studio-section-title"><div><span>03 / ATMOSPHERE</span><h3>Glass, depth & motion</h3></div><button onClick={() => editTokens({ pattern: defaults.pattern, patternColor: defaults.patternColor, patternIntensity: defaults.patternIntensity, patternSize: defaults.patternSize, motion: defaults.motion, frosted: defaults.frosted, ...Object.fromEntries(RANGE_FIELDS.slice(5).map(([key]) => [key, defaults[key]])) })}>Reset section</button></div><div className="studio-pattern-grid" role="radiogroup" aria-label="Background pattern">{PATTERN_OPTIONS.map((pattern) => <button type="button" role="radio" aria-checked={draft.tokens.pattern === pattern} className={`studio-pattern-card pattern-${pattern}${draft.tokens.pattern === pattern ? ' active' : ''}`} key={pattern} onClick={() => editTokens({ pattern })}><i/><strong>{pattern.replace('-', ' ')}</strong></button>)}</div><div className="studio-field-grid studio-effect-controls"><label>Motion<select value={draft.tokens.motion} onChange={(e) => editTokens({ motion: e.target.value })}><option>full</option><option>reduced</option><option>none</option></select></label><label className="studio-checkbox"><input type="checkbox" checked={draft.tokens.frosted} onChange={(e) => editTokens({ frosted: e.target.checked })}/> Frosted glass</label>{!['none','dots'].includes(draft.tokens.pattern) && <><label>Pattern color<input type="color" value={draft.tokens.patternColor || draft.tokens.fg} onChange={(e) => editTokens({ patternColor: e.target.value })}/></label><label>Pattern intensity<output>{draft.tokens.patternIntensity}</output><input type="range" min="0" max="1" step=".05" value={draft.tokens.patternIntensity} onChange={(e) => editTokens({ patternIntensity: Number(e.target.value) })}/></label><label>Pattern size<output>{draft.tokens.patternSize}×</output><input type="range" min=".2" max="3" step=".1" value={draft.tokens.patternSize} onChange={(e) => editTokens({ patternSize: Number(e.target.value) })}/></label></>}{RANGE_FIELDS.slice(5).map(([key,label,suffix]) => <label key={key}>{label}<output>{draft.tokens[key]}{suffix}</output><input type="range" min={TOKEN_RANGES[key][0]} max={TOKEN_RANGES[key][1]} step={TOKEN_RANGES[key][2]} value={draft.tokens[key]} onChange={(e) => editTokens({ [key]: Number(e.target.value) })}/></label>)}</div></div>}
          {section === 'orb' && <div className="studio-section"><div className="studio-section-title"><div><span>04 / ORB</span><h3>Core visualization</h3></div></div><div className="studio-orb-editor"><div className="studio-orb-demo" style={{ '--orb-color': draft.orb.mode === 'custom' ? draft.orb.color : (orbThemes.find((item) => item.name === draft.orb.preset)?.orbColor || draft.tokens.accent) }}><i/><i/><i/></div><div><div className="studio-field-grid"><label>Color mode<select value={draft.orb.mode} onChange={(e) => editTheme({ orb: { ...draft.orb, mode: e.target.value } })}><option value="sync">Preset / accent sync</option><option value="custom">Custom color wins</option></select></label>{draft.orb.mode === 'custom' && <label>Orb color<input type="color" value={draft.orb.color} onChange={(e) => editTheme({ orb: { ...draft.orb, color: e.target.value } })}/></label>}</div><div className="studio-orb-presets" role="radiogroup" aria-label="Orb preset">{orbThemes.map((theme) => <button type="button" role="radio" aria-checked={draft.orb.preset === theme.name} aria-label={`Use ${theme.label} Orb preset`} title={theme.label} className={draft.orb.preset === theme.name ? 'active' : ''} key={theme.name} onClick={() => editTheme({ orb: { ...draft.orb, preset: theme.name } })}><i style={{ background: theme.orbColor }}/><span>{theme.label}</span></button>)}</div></div></div></div>}
          {section === 'widgets' && <div className="studio-section"><div className="studio-section-title"><div><span>05 / OVERRIDES</span><h3>Per-widget identity</h3></div><button onClick={() => editTheme({ widgetOverrides: {} })}>Clear all</button></div><div className="studio-widget-picker" role="tablist" aria-label="Choose widget">{WIDGETS.map((widget) => <button type="button" role="tab" aria-selected={selectedWidget === widget} className={selectedWidget === widget ? 'active' : ''} key={widget} title={WIDGET_LABELS[widget]} onClick={(event) => { setSelectedWidget(widget); event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }}>{WIDGET_LABELS[widget]}{draft.widgetOverrides[widget] && <i/>}</button>)}</div><div className="studio-widget-editor"><div><span>SELECTED WIDGET</span><h4>{WIDGET_LABELS[selectedWidget]}</h4><p>Each field can inherit the global theme independently.</p></div>{['accent','surface','border','text'].map((key) => { const inherited = !draft.widgetOverrides[selectedWidget]?.[key]; const fallback = draft.tokens[key === 'surface' ? 'panel' : key === 'text' ? 'fg' : key]; return <label key={key}><span>{key}<em>{inherited ? 'Global' : 'Override'}</em></span><input type="color" value={draft.widgetOverrides[selectedWidget]?.[key] || fallback} onChange={(e) => updateWidgetField(key, e.target.value)}/><button type="button" disabled={inherited} onClick={() => resetWidgetField(key)}>Inherit</button></label>; })}<button type="button" className="studio-reset-widget" onClick={() => { const next = { ...draft.widgetOverrides }; delete next[selectedWidget]; editTheme({ widgetOverrides: next }); }}>Reset {WIDGET_LABELS[selectedWidget]}</button></div></div>}
        </section>
      </main>}
      <button className="studio-resize" aria-label="Resize Appearance Studio" onPointerDown={startResize} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} />
    </div>
  </aside>, document.body);
}
