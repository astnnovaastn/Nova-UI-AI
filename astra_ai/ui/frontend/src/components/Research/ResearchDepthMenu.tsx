import React, {useEffect, useId, useRef, useState} from 'react';
import './ResearchDepthMenu.css';

const options = [
  {value: 'quick', title: 'Quick', description: 'A focused answer, faster.'},
  {value: 'detailed', title: 'Detailed', description: 'A thorough review of sources.'},
];

function DepthIcon({quick = false}: {quick?: boolean}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {quick ? <path d="m13 3-9 11h7l-1 7 10-12h-7l1-6Z"/> : <><path d="M4 6h4m4 0h8M4 12h10m4 0h2M4 18h2m4 0h10"/><path d="M8 3v6m6 0v6m-8 0v6"/></>}
  </svg>;
}

export function ResearchDepthMenu({value, onChange}: {value: string; onChange: (value: string) => void}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = options.find(option => option.value === value) || options[1];

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (open) root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function navigate(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') || []);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  return <div ref={root} className="aegis-depth-menu" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className="aegis-depth-trigger"
      aria-label={`Research depth: ${selected.title}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => setOpen(!open)} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          setOpen(true);
        }
      }}>
      <DepthIcon quick={selected.value === 'quick'}/>
      <span>{selected.title}</span>
      <svg className="aegis-depth-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 6.5 3 3 3-3"/></svg>
    </button>
    {open && <div className="aegis-depth-popover">
      <span className="aegis-depth-heading" id={`${id}-label`}>Research depth</span>
      <div id={id} role="menu" aria-labelledby={`${id}-label`} onKeyDown={navigate}>
        {options.map(option => <button type="button" className="aegis-depth-option" key={option.value}
          role="menuitemradio" aria-checked={value === option.value} tabIndex={-1}
          onClick={() => {onChange(option.value); close();}}>
          <DepthIcon quick={option.value === 'quick'}/>
          <span className="aegis-depth-copy"><strong>{option.title}</strong><small>{option.description}</small></span>
          <svg className="aegis-depth-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" visibility={value === option.value ? 'visible' : 'hidden'}><path d="m3.5 8 3 3 6-6"/></svg>
        </button>)}
      </div>
    </div>}
  </div>;
}
