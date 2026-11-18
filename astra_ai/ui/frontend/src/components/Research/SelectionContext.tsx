import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { conversationSnapshot, updateUiContext } from '../../conversation';
import './SelectionContext.css';
export type Passage = {
    id: string;
    page_id: string;
    revision: string;
    text: string;
    origin: Record<string, string>;
    kind: string;
};
export function PassageCard({ card, onRemove }: {card: Passage; onRemove?: () => void}) {
    const dialog=useRef<HTMLDialogElement>(null);
    const label = card.origin.kind === 'live_browser_tab' ? 'Live tab' : card.origin.kind === 'saved_source' ? 'Saved source' : 'Selected passage';
    return <aside className="aegis-passage-card" aria-label={label}>
      <button type="button" className="aegis-passage-preview" onClick={()=>dialog.current?.showModal()} aria-label={`Inspect ${label.toLowerCase()}`}>
        <span>{card.origin.title || card.text}</span><small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M8 8h8v8H8z"/></svg>{label}</small>
      </button>
      {onRemove&&<button type="button" className="aegis-passage-remove" aria-label={`Remove ${label.toLowerCase()}`} onClick={onRemove}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18"/></svg></button>}
      <dialog ref={dialog} className="aegis-passage-dialog" aria-label={label}><header><strong>{card.origin.title || label}</strong><button type="button" aria-label="Close selected passage" onClick={()=>dialog.current?.close()}>Close</button></header><blockquote>{card.text}</blockquote></dialog>
    </aside>;
}
export function SelectionPill({ page, revision, onAttach }: {
    page: string;
    revision: string;
    onAttach: (card: Passage) => void;
}) {
    const current = useRef({ page, revision });
    current.current = { page, revision };
    const [pick, setPick] = useState<{
        text: string;
        x: number;
        y: number;
        source: string;
        page: string;
        revision: string;
    } | null>(null), [error, setError] = useState('');
    useEffect(() => {
        setPick(null);
        setError('');
        const capture = () => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.rangeCount !== 1) {
                setPick(null);
                return;
            }
            const range = selection.getRangeAt(0), element = range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
            const surface = element?.closest('.research-prose, .research-source-article');
            if (!surface || element?.closest('button,a,.research-citation')) {
                setPick(null);
                return;
            }
            const copy = range.cloneContents();
            copy.querySelectorAll('button,[data-citation],.research-citation,.research-citation-chip,figcaption,img,video,iframe,svg').forEach(n => n.remove());
            copy.querySelectorAll('a').forEach(n => n.replaceWith(document.createTextNode(n.textContent || '')));
            copy.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,tr,td,th').forEach(n => n.append(document.createTextNode('\n')));
            const text = (copy.textContent || '').replace(/https?:\/\/[^\s<>()]+/g, '').trim();
            if (!text) {
                setPick(null);
                return;
            }
            if (text.length > 64000) {
                setError('Select up to 64,000 characters. This passage is larger.');
                setPick(null);
                return;
            }
            const rect = range.getBoundingClientRect();
            setError('');
            setPick({ text, page, revision, x: Math.max(8, Math.min(innerWidth - 128, rect.left)), y: Math.max(8, Math.min(innerHeight - 50, rect.top - 42)), source: surface.getAttribute('data-source-id') || '' });
        };
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') {
            setPick(null);
            setError('');
        } };
        const dismiss=()=>setPick(null);
        document.addEventListener('scroll',dismiss,true);window.addEventListener('resize',dismiss);
        document.addEventListener('mouseup', capture);
        document.addEventListener('keyup', capture);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('scroll',dismiss,true);window.removeEventListener('resize',dismiss);document.removeEventListener('mouseup', capture); document.removeEventListener('keyup', capture); document.removeEventListener('keydown', escape); };
    }, [page, revision]);
    async function attach() { if (!pick || pick.page !== page || pick.revision !== revision)
        return; try {
        const response = await fetch('/api/research/' + pick.page + '/selections', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Nova-Client': conversationSnapshot().clientId }, body: JSON.stringify({ revision: pick.revision, text: pick.text, origin: pick.source ? { source_id: pick.source } : {} }) });
        const data = await response.json();
        if (!response.ok)
            throw Error(data.detail || 'Could not attach this passage.');
        if (current.current.page !== pick.page || current.current.revision !== pick.revision)
            return;
        onAttach(data);
        updateUiContext({ active_selection_id: data.id });
        setPick(null);
        const composer = document.querySelector<HTMLTextAreaElement>('.aegis-work-stage .bar-dock textarea');
        if (composer?.offsetParent) composer.focus();
        else document.querySelector<HTMLTextAreaElement>('.research-central-composer textarea, .research-workspace .bar-dock textarea')?.focus();
    }
    catch (e: any) {
        setError(e.message);
    } }
    return createPortal(<>{pick && <button className="aegis-selection-pill" style={{ left: pick.x, top: pick.y }} onMouseDown={e => e.preventDefault()} onClick={() => void attach()}>Ask Aegis <span aria-hidden="true">↗</span></button>}{error && <div className="aegis-selection-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss selection message">×</button></div>}</>, document.body);
}
