import React from 'react';
const shapes={
 back:'M14 6l-6 6 6 6 M8 12h12',close:'M6 6l12 12 M18 6L6 18',
 refresh:'M4 10a8 8 0 1 1 1 7 M4 4v6h6',plus:'M12 5v14 M5 12h14',
 filter:'M4 7h16 M7 12h10 M10 17h4',overview:'M5 5h14v14H5z M8 9h8 M8 13h5',
 evidence:'M8 3h8l4 4v14H4V3h4 M14 3v5h6 M8 12h8 M8 16h5',
 history:'M4 10a8 8 0 1 1 1 7 M4 4v6h6 M12 7v5l3 2',
 connections:'M7 7l10 10 M7 17L17 7 M4 4h6v6H4z M14 14h6v6h-6z M4 14h6v6H4z M14 4h6v6h-6z',
 expand:'M8 4H4v4 M16 4h4v4 M4 16v4h4 M20 16v4h-4',
 collapse:'M4 8h4V4 M20 8h-4V4 M8 20v-4H4 M16 20v-4h4',
 edit:'M4 16l-1 5 5-1L20 8l-5-5L4 16z M12 6l5 5',
 forget:'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
 restore:'M4 10a8 8 0 1 1 1 7 M4 4v6h6',
};
export default function MemoryGlyph({name,size=16}){return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path d={shapes[name]||shapes.overview} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
