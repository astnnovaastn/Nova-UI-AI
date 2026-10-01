import React, { useEffect, useMemo, useRef, useState } from 'react';
import './NotesWidget.css';

const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:8340').replace(/\/$/, '');

const Icon = ({ name, size = 16, strokeWidth = 2 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const glyphs = {
    note: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h4" /></>),
    brain: (<><path d="M9.5 3.5a3.5 3.5 0 0 0-3.41 4.33A3.5 3.5 0 0 0 6 14.5V16a3 3 0 0 0 3 3h.5" /><path d="M14.5 3.5a3.5 3.5 0 0 1 3.41 4.33A3.5 3.5 0 0 1 18 14.5V16a3 3 0 0 1-3 3h-.5" /><path d="M12 7v10" /><path d="M9 14c.76.64 1.62 1 3 1s2.24-.36 3-1" /></>),
    plus: (<><path d="M12 5v14" /><path d="M5 12h14" /></>),
    minus: (<><path d="M5 12h14" /></>),
    copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>),
    edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z" /></>),
    trash: (<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>),
    import: (<><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M4 21h16" /></>),
    fileText: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h6" /></>),
    download: (<><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M4 21h16" /></>),
    close: (<><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>),
    bold: (<><path d="M7 5h6a3 3 0 0 1 0 6H7z" /><path d="M7 11h7a4 4 0 0 1 0 8H7z" /></>),
    italic: (<><path d="M14 4h-4" /><path d="M14 20h-4" /><path d="M15 4L9 20" /></>),
    heading: (<><path d="M6 5v14" /><path d="M18 5v14" /><path d="M6 12h12" /></>),
    list: (<><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></>),
    sparkles: (<><path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" /></>),
    bookmark: (<><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z" /></>),
    info: (<><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></>),
    check: (<><path d="M20 6L9 17l-5-5" /></>),
    alert: (<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></>),
  };

  return <svg {...common}>{glyphs[name] || glyphs.note}</svg>;
};

const apiJson = async (url, options = {}) => {
  const requestUrl = /^https?:\/\//i.test(url) ? url : `${API_HOST}${url.startsWith('/') ? url : `/${url}`}`;
  const response = await fetch(requestUrl, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const payload = await response.json();
      message = payload?.error || payload?.detail || message;
    } catch {
      // Ignore parse failures.
    }
    throw new Error(message);
  }
  return response.json();
};

const summaryLengthLabel = (value) => ({
  1: 'very brief',
  2: 'concise',
  3: 'balanced',
  4: 'detailed',
  5: 'comprehensive',
}[value] || 'balanced');

const extractSummaryTags = (content, type) => {
  const lowered = String(content || '').toLowerCase();
  const tags = [type || 'single-note'];
  if (lowered.includes('project') || lowered.includes('task')) tags.push('project');
  if (lowered.includes('meeting')) tags.push('meeting');
  if (lowered.includes('idea')) tags.push('ideas');
  return [...new Set(tags)];
};

const buildSummaryPrompt = (summaryType, summaryLength, customPrompt, notesText) => {
  const lengthLabel = summaryLengthLabel(summaryLength);
  if (summaryType === 'bullet') {
    return `Create a ${lengthLabel} bullet-point summary of these notes:\n\n${notesText}`;
  }
  if (summaryType === 'timeline') {
    return `Create a ${lengthLabel} timeline from these notes:\n\n${notesText}`;
  }
  if (summaryType === 'themes') {
    return `Identify the main themes in these notes with a ${lengthLabel} explanation:\n\n${notesText}`;
  }
  if (summaryType === 'custom' && customPrompt.trim()) {
    return `${customPrompt.trim()}\n\n${notesText}`;
  }
  return `Provide a ${lengthLabel} summary of these notes with key points and action items:\n\n${notesText}`;
};

const improveNotePrompt = (content) => (
  `Improve the following note. Keep its meaning, fix clarity and grammar, ` +
  `and return only the revised note text.\n\n${content}`
);

const buildDefaultNoteAiInstruction = (mode) => {
  if (mode === 'summary') return 'Summarize this note with key points and additional helpful context.';
  if (mode === 'improve') return 'Improve this note for clarity, grammar, structure, and completeness.';
  return 'Help me with this note using its saved context.';
};

const applyNotesPayload = (payload, setNotes, setSummaries) => {
  if (Array.isArray(payload?.notes)) setNotes(payload.notes);
  if (Array.isArray(payload?.summaries)) setSummaries(payload.summaries);
};

const NotesWidget = ({
  onClose,
  aiConnected = false,
  aiCommand = null,
  onCommandResult,
}) => {
  const [notes, setNotes] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [currentTab, setCurrentTab] = useState('view');
  const [reviewedNoteId, setReviewedNoteId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('');
  const [editingNoteId, setEditingNoteId] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [dualPaneView, setDualPaneView] = useState(false);
  const [currentAISummary, setCurrentAISummary] = useState('');
  const [summaryType, setSummaryType] = useState('comprehensive');
  const [summaryLength, setSummaryLength] = useState(3);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiPanelVisible, setAiPanelVisible] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatingNoteId, setGeneratingNoteId] = useState('');
  const [selectedAiNoteId, setSelectedAiNoteId] = useState('');
  const [selectedAiNotePrompt, setSelectedAiNotePrompt] = useState('');
  const [selectedAiMode, setSelectedAiMode] = useState('chat');
  const [selectedAiResponse, setSelectedAiResponse] = useState('');
  const [selectedAiUpdatedNote, setSelectedAiUpdatedNote] = useState('');
  const [selectedAiConversation, setSelectedAiConversation] = useState([]);
  const [isSelectedAiLoading, setIsSelectedAiLoading] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);

  const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
  const [widgetSize, setWidgetSize] = useState({ width: 600, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);

  const textareaRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const handledCommandIdsRef = useRef(new Set());

  const filteredNotes = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();
    if (!lowered) return notes;
    return notes.filter((note) => {
      const haystack = `${note.content || ''} ${note.category || ''} ${note.preview || ''} ${note.dateCreated || ''}`.toLowerCase();
      return haystack.includes(lowered);
    });
  }, [notes, searchTerm]);

  const filteredSummaries = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();
    if (!lowered) return summaries;
    return summaries.filter((summary) => {
      const haystack = `${summary.content || ''} ${summary.type || ''} ${(summary.tags || []).join(' ')} ${summary.date || ''}`.toLowerCase();
      return haystack.includes(lowered);
    });
  }, [summaries, searchTerm]);

  const selectedAiNote = useMemo(
    () => notes.find((note) => note.id === selectedAiNoteId) || null,
    [notes, selectedAiNoteId],
  );
  const reviewedNote = useMemo(
    () => notes.find((note) => note.id === reviewedNoteId) || null,
    [notes, reviewedNoteId],
  );
  const editingNote = useMemo(
    () => notes.find((note) => note.id === editingNoteId) || null,
    [notes, editingNoteId],
  );
  const draftDirty = editingNote
    ? newNoteContent !== String(editingNote.content || '') || newNoteCategory !== String(editingNote.category || '')
    : Boolean(newNoteContent || newNoteCategory);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('aegisWidgetSemanticState', { detail: {
        widget: 'notes',
        state: {
          active_tab: currentTab,
          draft: String(newNoteContent || '').slice(0, 600),
          category: String(newNoteCategory || '').slice(0, 100),
          dirty: draftDirty,
          selected_note_id: editingNoteId || selectedAiNoteId || null,
          reviewed_note_id: reviewedNoteId || null,
          ai_workspace: {
            visible: currentTab === 'ai-summaries',
            panel_open: aiPanelVisible,
            mode: selectedAiMode,
            generating: aiGenerating || isSelectedAiLoading,
            has_response: Boolean(selectedAiResponse || currentAISummary),
            has_pending_update: Boolean(selectedAiUpdatedNote),
          },
        },
      }}));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [currentTab, newNoteContent, newNoteCategory, draftDirty, editingNoteId, selectedAiNoteId, reviewedNoteId, aiPanelVisible, selectedAiMode, aiGenerating, isSelectedAiLoading, selectedAiResponse, currentAISummary, selectedAiUpdatedNote]);

  const showNotification = (message, type = 'info', duration = 4000) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ show: true, type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, duration);
  };

  const emitCommandResult = (command, status, detail, metadata = {}) => {
    if (!command?.request_id || !onCommandResult) return;
    onCommandResult({
      widget: 'notes',
      command: command.command,
      request_id: command.request_id,
      status,
      detail,
      ...metadata,
    });
  };

  const loadState = async () => {
    setIsLoadingState(true);
    try {
      const payload = await apiJson('/api/notes/state');
      applyNotesPayload(payload, setNotes, setSummaries);
      return true;
    } catch (error) {
      showNotification(error.message || 'Failed to load notes', 'error');
      return false;
    } finally {
      setIsLoadingState(false);
    }
  };

  const switchTab = (tab) => {
    setCurrentTab(tab);
    setDualPaneView(false);
    setSearchTerm('');
  };

  useEffect(() => {
    loadState();
    const initialWidth = 520;
    const initialHeight = Math.max(560, window.innerHeight - 70);
    setWidgetPos({
      x: 10,
      y: 10,
    });
    setWidgetSize({
      width: initialWidth,
      height: initialHeight,
    });
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMouseMove = (event) => {
      setWidgetPos({
        x: Math.max(10, Math.min(window.innerWidth - widgetSize.width - 10, event.clientX - dragOffset.x)),
        y: Math.max(10, Math.min(window.innerHeight - widgetSize.height - 10, event.clientY - dragOffset.y)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragOffset, isDragging, widgetSize.height, widgetSize.width]);

  useEffect(() => {
    if (!isResizing) return undefined;
    const handleMouseMove = (event) => {
      setWidgetSize({
        width: Math.max(420, Math.min(window.innerWidth - 20, resizeStartRef.current.width + (event.clientX - resizeStartRef.current.x))),
        height: Math.max(420, Math.min(window.innerHeight - 20, resizeStartRef.current.height + (event.clientY - resizeStartRef.current.y))),
      });
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleDragStart = (event) => {
    if (
      event.target.closest('.widget-controls')
      || event.target.closest('.resize-handle')
      || event.target.closest('input')
      || event.target.closest('textarea')
      || event.target.closest('button')
      || event.target.closest('.notepad-nav-tab')
    ) {
      return;
    }
    setIsDragging(true);
    setDragOffset({
      x: event.clientX - widgetPos.x,
      y: event.clientY - widgetPos.y,
    });
  };

  const handleResizeStart = (event) => {
    event.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: widgetSize.width,
      height: widgetSize.height,
    };
  };

  const increaseWidgetSize = () => {
    setWidgetSize((prev) => ({ width: prev.width + 80, height: prev.height + 80 }));
  };

  const decreaseWidgetSize = () => {
    setWidgetSize((prev) => ({ width: Math.max(420, prev.width - 80), height: Math.max(340, prev.height - 80) }));
  };

  const resetDraft = () => {
    setEditingNoteId('');
    setNewNoteCategory('');
    setNewNoteContent('');
  };

  const resetSelectedAiWorkspace = () => {
    setSelectedAiNotePrompt('');
    setSelectedAiMode('chat');
    setSelectedAiResponse('');
    setSelectedAiUpdatedNote('');
    setSelectedAiConversation([]);
    setIsSelectedAiLoading(false);
  };

  const openNoteForEditing = (note) => {
    setEditingNoteId(note.id);
    setNewNoteContent(note.content || '');
    setNewNoteCategory(note.category || '');
    switchTab('add');
    showNotification('Note loaded for editing', 'info');
  };

  const saveDraft = async (overrideContent = null, overrideCategory = null) => {
    const content = String(overrideContent ?? newNoteContent).trim();
    const category = String(overrideCategory ?? newNoteCategory).trim();
    if (!content) {
      showNotification('Please write something before saving.', 'warning');
      return null;
    }
    try {
      let saved;
      if (editingNoteId) {
        saved = await apiJson(`/api/notes/${editingNoteId}`, {
          method: 'PUT',
          body: JSON.stringify({ content, category }),
        });
      } else {
        saved = await apiJson('/api/notes', {
          method: 'POST',
          body: JSON.stringify({ content, category }),
        });
      }
      applyNotesPayload(saved, setNotes, setSummaries);
      resetDraft();
      switchTab('view');
      showNotification(editingNoteId ? 'Note updated' : 'Note saved', 'success');
      return saved?.note || null;
    } catch (error) {
      showNotification(error.message || 'Failed to save note', 'error');
      return null;
    }
  };

  const deleteNote = async (noteId, confirmDelete = true) => {
    if (confirmDelete && !window.confirm('Delete this note permanently?')) {
      return false;
    }
    try {
      const payload = await apiJson(`/api/notes/${noteId}`, { method: 'DELETE' });
      applyNotesPayload(payload, setNotes, setSummaries);
      if (editingNoteId === noteId) resetDraft();
      if (selectedAiNoteId === noteId) {
        setSelectedAiNoteId('');
        resetSelectedAiWorkspace();
      }
      showNotification('Note deleted', 'success');
      return true;
    } catch (error) {
      showNotification(error.message || 'Failed to delete note', 'error');
      return false;
    }
  };

  const clearAllNotes = async () => {
    if (!notes.length) return;
    if (!window.confirm('Delete all saved notes? This cannot be undone.')) return;
    try {
      const payload = await apiJson('/api/notes/clear', { method: 'POST', body: JSON.stringify({}) });
      applyNotesPayload(payload, setNotes, setSummaries);
      resetDraft();
      setSelectedAiNoteId('');
      resetSelectedAiWorkspace();
      showNotification('All notes cleared', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to clear notes', 'error');
    }
  };

  const copyNote = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      showNotification('Copied to clipboard', 'success');
    } catch {
      showNotification('Failed to copy text', 'error');
    }
  };

  const exportNotes = () => {
    if (!notes.length) return;
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_export_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Notes exported', 'success');
  };

  const exportNotesToTxt = () => {
    if (!notes.length) return;
    const text = notes.map((note) => `[${note.dateCreated}] ${note.category ? `[${note.category}] ` : ''}${note.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_export_${new Date().toISOString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('TXT export created', 'success');
  };

  const importTextFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json';
    input.onchange = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const content = String(readerEvent.target?.result || '');
        if (!content) return;
        if (file.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed)) throw new Error('Invalid JSON note format');
            for (const item of parsed) {
              const noteContent = String(item?.content || '').trim();
              const noteCategory = String(item?.category || '').trim();
              if (noteContent) {
                await apiJson('/api/notes', {
                  method: 'POST',
                  body: JSON.stringify({ content: noteContent, category: noteCategory }),
                });
              }
            }
            await loadState();
            showNotification('JSON notes imported', 'success');
          } catch (error) {
            showNotification(error.message || 'Invalid JSON file', 'error');
          }
          return;
        }
        setNewNoteContent(content);
        switchTab('add');
        showNotification('Text imported into draft', 'info');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDraftPaste = async (event) => {
    const clipboardText = event.clipboardData?.getData('text') || '';
    const pastedText = clipboardText.trim();
    if (pastedText) {
      showNotification('Text pasted into note draft', 'success');
    } else {
      showNotification('Content pasted into note draft', 'success');
    }
  };

  const requestNotesAi = async ({
    mode = 'chat',
    noteId = '',
    noteContent = '',
    category = '',
    instruction = '',
    conversation = [],
  }) => {
    const payload = await apiJson('/api/notes/ai', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        note_id: noteId,
        draft_content: noteContent,
        category,
        instruction,
        conversation,
      }),
    });
    return payload;
  };

  const saveAISummary = async () => {
    if (!currentAISummary.trim()) return;
    try {
      const payload = await apiJson('/api/notes/summaries', {
        method: 'POST',
        body: JSON.stringify({
          content: currentAISummary,
          type: summaryType || 'single-note',
          tags: extractSummaryTags(currentAISummary, summaryType || 'single-note'),
        }),
      });
      applyNotesPayload(payload, setNotes, setSummaries);
      setDualPaneView(false);
      showNotification('Summary saved', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to save summary', 'error');
    }
  };

  const openSelectedNoteAiWorkspace = (note, mode = 'chat') => {
    if (!note?.id) return;
    setSelectedAiNoteId(note.id);
    setSelectedAiMode(mode);
    setSelectedAiNotePrompt('');
    setSelectedAiResponse('');
    setSelectedAiUpdatedNote('');
    setSelectedAiConversation([]);
    switchTab('ai-summaries');
  };

  const runSelectedNoteAi = async ({
    note = selectedAiNote,
    mode = selectedAiMode,
    instruction = selectedAiNotePrompt,
    addUserTurn = true,
  } = {}) => {
    const activeNote = note || selectedAiNote;
    if (!activeNote?.content?.trim()) {
      showNotification('Select a saved note first.', 'warning');
      return null;
    }

    const finalMode = mode || 'chat';
    const finalInstruction = String(instruction || '').trim() || buildDefaultNoteAiInstruction(finalMode);
    const nextConversation = addUserTurn
      ? [...selectedAiConversation, { role: 'user', content: finalInstruction }]
      : selectedAiConversation;

    setSelectedAiMode(finalMode);
    setIsSelectedAiLoading(true);
    try {
      const payload = await requestNotesAi({
        mode: finalMode,
        noteId: activeNote.id,
        category: activeNote.category || '',
        instruction: finalInstruction,
        conversation: nextConversation,
      });

      const assistantResponse = String(payload?.assistant_response || payload?.summary_text || '').trim();
      const updatedNote = String(payload?.updated_note || '').trim();

      setSelectedAiResponse(assistantResponse);
      setSelectedAiUpdatedNote(updatedNote);
      setCurrentAISummary(String(payload?.summary_text || assistantResponse || ''));
      setSelectedAiConversation([
        ...nextConversation,
        { role: 'assistant', content: assistantResponse || updatedNote || 'No response returned.' },
      ]);
      showNotification('Notes AI response ready', 'success');
      return payload;
    } catch (error) {
      showNotification(error.message || 'Notes AI request failed', 'error');
      return null;
    } finally {
      setIsSelectedAiLoading(false);
    }
  };

  const applyAiUpdateToSavedNote = async () => {
    if (!selectedAiNote?.id || !selectedAiUpdatedNote.trim()) {
      showNotification('No AI-updated note text to apply.', 'warning');
      return;
    }
    try {
      const payload = await apiJson(`/api/notes/${selectedAiNote.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: selectedAiUpdatedNote.trim(),
          category: selectedAiNote.category || '',
        }),
      });
      applyNotesPayload(payload, setNotes, setSummaries);
      setSelectedAiUpdatedNote('');
      showNotification('Saved note updated from AI result', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to apply AI note update', 'error');
    }
  };

  const summarizeSingleNote = async (noteId) => {
    const note = notes.find((entry) => entry.id === noteId);
    if (!note) return;
    setGeneratingNoteId(noteId);
    try {
      openSelectedNoteAiWorkspace(note, 'summary');
      await runSelectedNoteAi({
        note,
        mode: 'summary',
        instruction: 'Summarize this note with key points, useful context, and action items.',
      });
    } catch (error) {
      showNotification(error.message || 'Failed to summarize note', 'error');
    } finally {
      setGeneratingNoteId('');
    }
  };

  const generateSummary = async () => {
    if (!notes.length) {
      showNotification('No notes to summarize', 'warning');
      return;
    }
    setAiGenerating(true);
    try {
      const notesText = notes.map((note) => `[${note.dateCreated}] ${note.content}`).join('\n');
      const payload = await requestNotesAi({
        mode: 'summary',
        noteContent: notesText,
        instruction: buildSummaryPrompt(summaryType, summaryLength, customPrompt, notesText),
      });
      const content = String(payload?.summary_text || payload?.assistant_response || '').trim();
      setCurrentAISummary(content || 'Summary unavailable');
      setDualPaneView(true);
      showNotification('Summary generated', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to generate summary', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const improveNote = async (note) => {
    if (!note?.content?.trim()) return null;
    const payload = await requestNotesAi({
      mode: 'improve',
      noteId: note.id || '',
      noteContent: note.content,
      category: note.category || '',
      instruction: improveNotePrompt(note.content),
    });
    const improvedContent = String(payload?.updated_note || payload?.assistant_response || '').trim();
    if (!improvedContent) return null;
    if (note.id) {
      const payload = await apiJson(`/api/notes/${note.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: improvedContent,
          category: note.category || '',
        }),
      });
      applyNotesPayload(payload, setNotes, setSummaries);
      return payload.note;
    }
    setNewNoteContent(improvedContent);
    return { ...note, content: improvedContent };
  };

  const insertMarkdown = (syntax) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = newNoteContent.slice(start, end);
    let insertion = selected || 'text';
    if (syntax === 'bold') insertion = `**${selected || 'bold'}**`;
    if (syntax === 'italic') insertion = `*${selected || 'italic'}*`;
    if (syntax === 'list') insertion = `\n- ${selected || 'item'}`;
    if (syntax === 'h1') insertion = `\n# ${selected || 'Header'}`;
    const updated = `${newNoteContent.slice(0, start)}${insertion}${newNoteContent.slice(end)}`;
    setNewNoteContent(updated);
    textareaRef.current.focus();
  };

  const findNoteByQuery = async (query, noteId = '') => {
    const explicitId = String(noteId || '').trim();
    if (explicitId) {
      const localMatch = notes.find((item) => String(item?.id || '') === explicitId);
      if (localMatch) return localMatch;
    }
    const cleaned = String(query || '').trim();
    if (!cleaned) return null;
    const payload = await apiJson(`/api/notes/match?query=${encodeURIComponent(cleaned)}`);
    return payload?.note || null;
  };

  const copyDraft = async () => {
    const draft = String(newNoteContent || '').trim();
    if (!draft) {
      showNotification('No draft content to copy', 'warning');
      return false;
    }
    await copyNote(draft);
    return true;
  };

  const pasteIntoDraft = async (textToPaste = '') => {
    const explicitText = String(textToPaste || '').trim();
    let pastedText = explicitText;

    if (!pastedText) {
      try {
        pastedText = String(await navigator.clipboard.readText() || '').trim();
      } catch {
        showNotification('Clipboard paste is not available right now', 'error');
        return false;
      }
    }

    if (!pastedText) {
      showNotification('No text available to paste', 'warning');
      return false;
    }

    switchTab('add');
    setNewNoteContent((prev) => `${prev}${prev ? '\n' : ''}${pastedText}`.trim());
    showNotification('Text pasted into note draft', 'success');
    return true;
  };

  useEffect(() => {
    if (!aiCommand?.command) return;
    const commandId = `${aiCommand.request_id || 'no-request'}:${aiCommand.command}:${aiCommand.issuedAt || ''}`;
    if (handledCommandIdsRef.current.has(commandId)) return;
    handledCommandIdsRef.current.add(commandId);

    const runCommand = async () => {
      try {
        const command = aiCommand.command;
        if (command === 'open') {
          emitCommandResult(aiCommand, 'completed', 'Notes widget opened.');
          return;
        }
        if (command === 'show_view') {
          switchTab('view');
          emitCommandResult(aiCommand, 'completed', 'Notes list opened.');
          return;
        }
        if (command === 'review_note') {
          const note = await findNoteByQuery(aiCommand.query, aiCommand.note_id);
          if (!note) {
            emitCommandResult(aiCommand, 'failed', 'No matching note found.');
            return;
          }
          setReviewedNoteId(note.id);
          switchTab('review');
          emitCommandResult(aiCommand, 'completed', 'Matching note opened in Review Notes.', { note_id: note.id });
          return;
        }
        if (command === 'clear_review') {
          setReviewedNoteId('');
          switchTab('review');
          emitCommandResult(aiCommand, 'completed', 'Review Notes selection cleared.');
          return;
        }
        if (command === 'edit_reviewed_note') {
          const note = await findNoteByQuery(aiCommand.query, aiCommand.note_id || reviewedNoteId);
          if (!note) {
            emitCommandResult(aiCommand, 'failed', 'No reviewed note is currently selected.');
            return;
          }
          setReviewedNoteId(note.id);
          openNoteForEditing(note);
          emitCommandResult(aiCommand, 'completed', 'Reviewed note opened for editing.', { note_id: note.id });
          return;
        }
        if (command === 'show_note') {
          const note = await findNoteByQuery(aiCommand.query, aiCommand.note_id);
          if (!note) {
            emitCommandResult(aiCommand, 'failed', 'No matching note found.');
            return;
          }
          openNoteForEditing(note);
          emitCommandResult(aiCommand, 'completed', 'Matching note opened in the editor.', { note_id: note.id });
          return;
        }
        if (command === 'refresh_state') {
          const refreshed = await loadState();
          emitCommandResult(aiCommand, refreshed ? 'completed' : 'failed', refreshed ? 'Notes widget refreshed from the backend.' : 'Notes widget refresh failed.');
          return;
        }
        if (command === 'show_add') {
          switchTab('add');
          emitCommandResult(aiCommand, 'completed', 'Note editor opened.');
          return;
        }
        if (command === 'show_ai_summaries') {
          const note = aiCommand.query ? await findNoteByQuery(aiCommand.query) : null;
          if (note) {
            openSelectedNoteAiWorkspace(note, 'summary');
          } else {
            switchTab('ai-summaries');
          }
          emitCommandResult(aiCommand, 'completed', 'AI summaries view opened.');
          return;
        }
        if (command === 'set_draft') {
          switchTab('add');
          setEditingNoteId('');
          setNewNoteContent(String(aiCommand.prompt || ''));
          setNewNoteCategory(String(aiCommand.category || ''));
          emitCommandResult(aiCommand, 'completed', 'Note draft updated.');
          return;
        }
        if (command === 'append_draft') {
          switchTab('add');
          setNewNoteContent((prev) => `${prev}${prev && aiCommand.prompt ? '\n' : ''}${String(aiCommand.prompt || '')}`.trim());
          if (aiCommand.category) setNewNoteCategory(String(aiCommand.category));
          emitCommandResult(aiCommand, 'completed', 'Note draft extended.');
          return;
        }
        if (command === 'clear_draft') {
          resetDraft();
          switchTab('add');
          emitCommandResult(aiCommand, 'completed', 'Note draft cleared.');
          return;
        }
        if (command === 'copy_draft') {
          const copied = await copyDraft();
          emitCommandResult(aiCommand, copied ? 'completed' : 'failed', copied ? 'Draft copied.' : 'Unable to copy draft.');
          return;
        }
        if (command === 'paste_into_draft') {
          const pasted = await pasteIntoDraft(aiCommand.prompt || '');
          emitCommandResult(aiCommand, pasted ? 'completed' : 'failed', pasted ? 'Text pasted into draft.' : 'Unable to paste into draft.');
          return;
        }
        if (command === 'save_note') {
          const saved = await saveDraft(aiCommand.prompt || newNoteContent, aiCommand.category || newNoteCategory);
          emitCommandResult(
            aiCommand,
            saved ? 'completed' : 'failed',
            saved ? 'Note saved.' : 'Unable to save note.',
            saved ? { note_id: saved.id } : {},
          );
          return;
        }
        if (command === 'open_note') {
          const note = await findNoteByQuery(aiCommand.query, aiCommand.note_id);
          if (!note) {
            emitCommandResult(aiCommand, 'failed', 'No matching note found.');
            return;
          }
          openNoteForEditing(note);
          emitCommandResult(aiCommand, 'completed', 'Matching note opened.');
          return;
        }
        if (command === 'delete_note') {
          const note = await findNoteByQuery(aiCommand.query, aiCommand.note_id);
          if (!note) {
            emitCommandResult(aiCommand, 'failed', 'No matching note found.');
            return;
          }
          const deleted = await deleteNote(note.id, false);
          emitCommandResult(aiCommand, deleted ? 'completed' : 'failed', deleted ? 'Note deleted.' : 'Unable to delete note.');
          return;
        }
        if (command === 'copy_note') {
          const note = await findNoteByQuery(aiCommand.query, aiCommand.note_id);
          if (!note?.content) {
            emitCommandResult(aiCommand, 'failed', 'No matching note found.');
            return;
          }
          await copyNote(note.content);
          emitCommandResult(aiCommand, 'completed', 'Note copied.');
          return;
        }
        if (command === 'open_ai_chat') {
          const note = await findNoteByQuery(aiCommand.query);
          if (!note) {
            emitCommandResult(aiCommand, 'failed', 'No matching note found.');
            return;
          }
          openSelectedNoteAiWorkspace(note, 'chat');
          emitCommandResult(aiCommand, 'completed', 'AI chat opened for note.');
          return;
        }
        if (command === 'improve_note') {
          const note = aiCommand.query
            ? await findNoteByQuery(aiCommand.query)
            : (editingNoteId ? notes.find((entry) => entry.id === editingNoteId) : { id: '', content: newNoteContent, category: newNoteCategory });
          if (!note?.content?.trim()) {
            emitCommandResult(aiCommand, 'failed', 'No note content available to improve.');
            return;
          }
          const improved = await improveNote(note);
          if (!improved) {
            emitCommandResult(aiCommand, 'failed', 'Unable to improve note.');
            return;
          }
          if (!improved.id) {
            switchTab('add');
            setNewNoteCategory(improved.category || '');
            setNewNoteContent(improved.content || '');
          }
          emitCommandResult(aiCommand, 'completed', 'Note improved with AI.');
          return;
        }
        if (command === 'apply_ai_update') {
          if (!selectedAiUpdatedNote.trim()) {
            emitCommandResult(aiCommand, 'failed', 'No AI-updated note text is available to apply.');
            return;
          }
          await applyAiUpdateToSavedNote();
          emitCommandResult(aiCommand, 'completed', 'AI update applied to note.');
          return;
        }
        if (command === 'export_txt') {
          exportNotesToTxt();
          emitCommandResult(aiCommand, 'completed', 'TXT export created.');
          return;
        }
        if (command === 'export_json') {
          exportNotes();
          emitCommandResult(aiCommand, 'completed', 'JSON export created.');
          return;
        }
        if (command === 'clear_all_notes') {
          if (!notes.length) {
            emitCommandResult(aiCommand, 'completed', 'There were no saved notes to clear.');
            return;
          }
          const payload = await apiJson('/api/notes/clear', { method: 'POST', body: JSON.stringify({}) });
          applyNotesPayload(payload, setNotes, setSummaries);
          resetDraft();
          setSelectedAiNoteId('');
          resetSelectedAiWorkspace();
          showNotification('All notes cleared', 'success');
          emitCommandResult(aiCommand, 'completed', 'All saved notes cleared.');
          return;
        }
        if (command === 'import_notes') {
          importTextFile();
          emitCommandResult(aiCommand, 'completed', 'Import picker opened.');
          return;
        }
      } catch (error) {
        emitCommandResult(aiCommand, 'failed', error.message || 'Notes widget command failed.');
      }
    };

    runCommand();
  }, [aiCommand, editingNoteId, newNoteCategory, newNoteContent, notes, reviewedNoteId]);

  return (
    <div
      data-aegis-widget="notes"
      className={`notepad-widget ${aiConnected ? 'ai-connected' : ''}`}
      style={{
        left: `${widgetPos.x}px`,
        top: `${widgetPos.y}px`,
        width: `${widgetSize.width}px`,
        height: `${widgetSize.height}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        display: 'flex',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleDragStart}
    >
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>
      <div className="resize-handle" onMouseDown={handleResizeStart}></div>

      <div className="widget-controls">
        <div className="widget-control-btn" onClick={increaseWidgetSize} title="Make Bigger">+</div>
        <div className="widget-control-btn" onClick={decreaseWidgetSize} title="Make Smaller">-</div>
        <div className="widget-control-btn" onClick={onClose} title="Close">x</div>
      </div>

      <div className={`notepad-notification ${notification.show ? 'show' : ''} ${notification.type}`}>
        <div className="notification-content">
          <div className="notification-icon">
            {notification.type === 'success'
              ? <Icon name="check" size={14} />
              : notification.type === 'error'
                ? <Icon name="alert" size={14} />
                : <Icon name="info" size={14} />}
          </div>
          <div className="notification-message">{notification.message}</div>
          <button className="notification-close" onClick={() => setNotification((prev) => ({ ...prev, show: false }))}>
            <Icon name="close" size={14} />
          </button>
        </div>
        {notification.show && <div className="notification-progress"></div>}
      </div>

      <div className="notepad-header">
        <div className="notepad-title">
          <div className="notepad-logo"><Icon name="note" size={18} strokeWidth={2.2} /></div>
          <div className="notepad-brand">Notepad</div>
        </div>
        <div className="notepad-header-actions">
          <div className="notepad-status">
            <div className="notepad-status-indicator"></div>
            <span>Active</span>
          </div>
          <button className="notepad-header-close" type="button" onClick={onClose} aria-label="Close notepad">
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      <nav className="notepad-nav" aria-label="Notes sections">
        <button type="button" className={`notepad-nav-tab ${currentTab === 'view' ? 'active' : ''}`} aria-current={currentTab === 'view' ? 'page' : undefined} onClick={() => switchTab('view')}>
          <Icon name="note" size={13} /> <span>View Notes</span>
        </button>
        <button type="button" className={`notepad-nav-tab ${currentTab === 'review' ? 'active' : ''}`} aria-current={currentTab === 'review' ? 'page' : undefined} onClick={() => switchTab('review')}>
          <Icon name="info" size={13} /> <span>Review Notes</span>
        </button>
        <button type="button" className={`notepad-nav-tab ${currentTab === 'add' ? 'active' : ''}`} aria-current={currentTab === 'add' ? 'page' : undefined} onClick={() => switchTab('add')}>
          <Icon name={editingNoteId ? 'edit' : 'plus'} size={13} /> <span>{editingNoteId ? 'Edit Note' : 'Add Note'}</span>
        </button>
        <button type="button" className={`notepad-nav-tab ${currentTab === 'ai-summaries' ? 'active' : ''}`} aria-current={currentTab === 'ai-summaries' ? 'page' : undefined} onClick={() => switchTab('ai-summaries')}>
          <Icon name="brain" size={13} /> <span>AI Summaries</span>
        </button>
      </nav>

      {currentTab !== 'add' && !dualPaneView && (
        <div className="notepad-search">
          <input
            type="text"
            className="notepad-search-input"
            placeholder={currentTab === 'ai-summaries' ? 'Search summaries...' : 'Search notes...'}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      )}

      {dualPaneView ? (
        <div className="notepad-dual-pane" style={{ display: 'flex' }}>
          <div className="dual-pane-header">
            <div className="dual-pane-title">
              <Icon name="brain" size={15} /> AI Summary View
            </div>
            <button className="dual-pane-close" onClick={() => setDualPaneView(false)}>
              <Icon name="close" size={14} />
            </button>
          </div>
          <div className="dual-pane-content">
            <div className="dual-pane-left">
              <div className="pane-label"><Icon name="note" size={14} /> Your Notes</div>
              <div className="pane-content">
                {(generatingNoteId ? notes.filter((note) => note.id === generatingNoteId) : filteredNotes).map((note) => (
                  <div key={note.id} style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', color: '#fcd34d', marginBottom: '4px' }}>{note.dateCreated}</div>
                    <div>{note.content}</div>
                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="dual-pane-divider"></div>
            <div className="dual-pane-right">
              <div className="pane-label">
                <Icon name="sparkles" size={14} /> AI Summary
                <div className="ai-summary-controls">
                  <button className="ai-summary-btn" onClick={() => copyNote(currentAISummary)}>
                    <Icon name="copy" size={14} />
                  </button>
                  <button className="ai-summary-btn" onClick={saveAISummary}>
                    <Icon name="bookmark" size={14} />
                  </button>
                </div>
              </div>
              <div className="pane-content">{currentAISummary}</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {currentTab === 'review' && (
            <div className="notepad-content-area notepad-review-area">
              {!reviewedNote ? (
                <div className="notepad-empty">
                  <div className="notepad-empty-icon"><Icon name="info" size={40} /></div>
                  <h3>No Note Selected</h3>
                  <p>Ask Aegis to review a saved note, or select Review from a note card.</p>
                </div>
              ) : (
                <article className="notepad-review-card">
                  <div className="notepad-meta">
                    <div><span className="notepad-time">{reviewedNote.dateCreated}</span>{reviewedNote.category ? <span className="notepad-tag">{reviewedNote.category}</span> : null}</div>
                    <span className="notepad-id">ID: {String(reviewedNote.id).slice(-4)}</span>
                  </div>
                  <div className="notepad-review-content">{reviewedNote.content}</div>
                  <div className="notepad-actions">
                    <button className="notepad-action-btn" onClick={() => openNoteForEditing(reviewedNote)}><Icon name="edit" size={14} /> <span>Edit Note</span></button>
                    <button className="notepad-action-btn" onClick={() => copyNote(reviewedNote.content)}><Icon name="copy" size={14} /> <span>Copy</span></button>
                    <button className="notepad-action-btn" onClick={() => { setReviewedNoteId(''); switchTab('review'); }}><Icon name="close" size={14} /> <span>Clear Review</span></button>
                  </div>
                </article>
              )}
            </div>
          )}

          {currentTab === 'view' && (
          <div className="notepad-content-area">
              <div className="notepad-view-toolbar">
                <button className="notepad-action-btn summarize-single-btn" onClick={() => setAiPanelVisible((prev) => !prev)}>
                  <Icon name="brain" size={14} /> <span>{aiPanelVisible ? 'Hide AI Tools' : 'AI Tools'}</span>
                </button>
              </div>

              {aiPanelVisible && (
                <div className="notepad-ai-panel">
                  <div className="notepad-ai-options">
                    {['comprehensive', 'bullet', 'timeline', 'themes', 'custom'].map((type) => (
                      <button
                        key={type}
                        className={`notepad-action-btn ${summaryType === type ? 'active' : ''}`}
                        style={{ borderColor: summaryType === type ? '#facc15' : '' }}
                        onClick={() => setSummaryType(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  {summaryType === 'custom' && (
                    <textarea
                      className="notepad-add-note-textarea"
                      style={{ minHeight: '60px', marginBottom: '8px' }}
                      placeholder="Enter custom summary instruction..."
                      value={customPrompt}
                      onChange={(event) => setCustomPrompt(event.target.value)}
                    />
                  )}
                  <div className="notepad-ai-length-row">
                    <span className="notepad-ai-length-label">Length: {summaryLengthLabel(summaryLength)}</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={summaryLength}
                      onChange={(event) => setSummaryLength(parseInt(event.target.value, 10))}
                      style={{ accentColor: '#facc15' }}
                    />
                    <button className="notepad-action-btn summarize-single-btn" onClick={generateSummary} disabled={aiGenerating}>
                      <Icon name="sparkles" size={14} /> <span>{aiGenerating ? 'Generating...' : 'Generate Summary'}</span>
                    </button>
                  </div>
                </div>
              )}

              {isLoadingState ? (
                <div className="notepad-empty notepad-loading">
                  <h3>Loading notes...</h3>
                  <p>Reading saved notes from the backend.</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="notepad-empty">
                  <div className="notepad-empty-icon"><Icon name="note" size={44} strokeWidth={1.8} /></div>
                  <h3>No Notes Yet</h3>
                  <p>Write a note and it will stay available in the widget and backend history.</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                    <article key={note.id} className="notepad-item notepad-history-card">
                      <div className="notepad-history-meta">
                      <div className="notepad-history-meta-left">
                        <time>{note.dateCreated}</time>
                        <span className="notepad-history-model">{note.category || 'NOTE'}</span>
                      </div>
                      <span className="notepad-history-id">ID: {String(note.id).slice(-4)}</span>
                    </div>
                    <div className="notepad-history-main">
                      <div className="notepad-history-copy">
                        {note.category ? <strong className="notepad-history-category">{note.category}</strong> : null}
                        <span className="notepad-history-preview">{note.preview || note.content}</span>
                      </div>
                    </div>
                    <div className="notepad-history-actions" aria-label={`Actions for ${note.category || 'note'}`}>
                      <button className="notepad-action-btn" title="Ask AI about note" aria-label="Ask AI about note" onClick={() => openSelectedNoteAiWorkspace(note, 'chat')}>
                        <Icon name="sparkles" size={14} />
                        <span>AI</span>
                      </button>
                      <button className="notepad-action-btn" title="Edit note" aria-label="Edit note" onClick={() => openNoteForEditing(note)}>
                        <Icon name="edit" size={14} />
                        <span>Edit</span>
                      </button>
                      <button className="notepad-action-btn" title="Review note" aria-label="Review note" onClick={() => { setReviewedNoteId(note.id); switchTab('review'); }}>
                        <Icon name="info" size={14} />
                        <span>Review</span>
                      </button>
                      <button className="notepad-action-btn" title="Copy note" aria-label="Copy note" onClick={() => copyNote(note.content)}>
                        <Icon name="copy" size={14} />
                        <span>Copy</span>
                      </button>
                      <button className="notepad-action-btn danger" title="Delete note" aria-label="Delete note" onClick={() => deleteNote(note.id)}>
                        <Icon name="trash" size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {currentTab === 'add' && (
            <div className="notepad-add-note-form">
              <div className="notepad-input-group">
                <label className="notepad-input-label">Category / Tags:</label>
                <input
                  type="text"
                  className="notepad-text-input"
                  placeholder="e.g. Work, Ideas, Project A"
                  value={newNoteCategory}
                  onChange={(event) => setNewNoteCategory(event.target.value)}
                />
              </div>
              <div className="markdown-toolbar">
                <button className="markdown-btn" onClick={() => insertMarkdown('bold')} title="Bold"><Icon name="bold" size={14} /></button>
                <button className="markdown-btn" onClick={() => insertMarkdown('italic')} title="Italic"><Icon name="italic" size={14} /></button>
                <button className="markdown-btn" onClick={() => insertMarkdown('h1')} title="Heading"><Icon name="heading" size={14} /></button>
                <button className="markdown-btn" onClick={() => insertMarkdown('list')} title="List"><Icon name="list" size={14} /></button>
              </div>
              <textarea
                ref={textareaRef}
                className="notepad-add-note-textarea"
                value={newNoteContent}
                onChange={(event) => setNewNoteContent(event.target.value)}
                onPaste={handleDraftPaste}
                placeholder="Write your note here... supports basic Markdown"
                style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}
              />
              <div className="notepad-add-note-controls">
                <div className="notepad-char-count">{newNoteContent.length} chars</div>
                <div className="notepad-inline-actions">
                  <button className="notepad-action-btn" onClick={async () => {
                    try {
                      const improved = await improveNote({ id: editingNoteId, content: newNoteContent, category: newNoteCategory });
                      if (improved?.content) {
                        setNewNoteContent(improved.content);
                        showNotification('Draft improved with AI', 'success');
                      }
                    } catch (error) {
                      showNotification(error.message || 'Failed to improve draft', 'error');
                    }
                  }}>
                    <Icon name="sparkles" size={14} /> <span>AI Fix</span>
                  </button>
                  <button className="notepad-action-btn" onClick={() => { resetDraft(); }}>
                    <Icon name="trash" size={14} /> <span>Clear</span>
                  </button>
                  <button className="notepad-action-btn" onClick={copyDraft}>
                    <Icon name="copy" size={14} /> <span>Copy Draft</span>
                  </button>
                  <button className="notepad-add-note-btn" onClick={() => saveDraft()}>
                    <Icon name="bookmark" size={14} /> <span>{editingNoteId ? 'Update Note' : 'Save Note'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'ai-summaries' && (
            <div className="notepad-content-area">
              {selectedAiNote ? (
                <div className="notes-ai-workspace">
                  <div className="notes-ai-context-card">
                    <div className="notepad-meta">
                      <div>
                        <span className="notepad-time" style={{ marginRight: '8px' }}>{selectedAiNote.dateCreated}</span>
                        {selectedAiNote.category ? <span className="notepad-tag">{selectedAiNote.category}</span> : null}
                      </div>
                      <span className="notepad-id">ID: {String(selectedAiNote.id).slice(-4)}</span>
                    </div>
                    <div className="notes-ai-context-title">
                      <Icon name="note" size={15} /> <span>Selected Note Context</span>
                    </div>
                    <div className="notes-ai-context-body">{selectedAiNote.content}</div>
                  </div>

                  <div className="notes-ai-chat-card">
                    <div className="notes-ai-chat-header">
                      <div className="notes-ai-context-title">
                        <Icon name="brain" size={15} /> <span>GPT-4o Notes Assistant</span>
                      </div>
                      <div className="notes-ai-quick-actions">
                        <button className="notepad-action-btn summarize-single-btn" onClick={() => runSelectedNoteAi({ mode: 'summary', instruction: buildDefaultNoteAiInstruction('summary') })} disabled={isSelectedAiLoading}>
                          <Icon name="brain" size={14} /> <span>Summarize</span>
                        </button>
                        <button className="notepad-action-btn" onClick={() => runSelectedNoteAi({ mode: 'improve', instruction: buildDefaultNoteAiInstruction('improve') })} disabled={isSelectedAiLoading}>
                          <Icon name="sparkles" size={14} /> <span>Improve</span>
                        </button>
                      </div>
                    </div>

                    <div className="notes-ai-thread">
                      {selectedAiConversation.length === 0 ? (
                        <div className="notes-ai-placeholder">
                          Select an action or ask GPT-4o to improve, expand, explain, or rewrite this saved note.
                        </div>
                      ) : (
                        selectedAiConversation.map((entry, index) => (
                          <div key={`${entry.role}-${index}`} className={`notes-ai-message ${entry.role === 'assistant' ? 'assistant' : 'user'}`}>
                            <div className="notes-ai-message-role">{entry.role === 'assistant' ? 'GPT-4o' : 'You'}</div>
                            <div className="notes-ai-message-body">{entry.content}</div>
                          </div>
                        ))
                      )}
                    </div>

                    {selectedAiUpdatedNote ? (
                      <div className="notes-ai-updated-note">
                        <div className="notes-ai-context-title">
                          <Icon name="edit" size={15} /> <span>Suggested Updated Note</span>
                        </div>
                        <div className="notes-ai-context-body">{selectedAiUpdatedNote}</div>
                        <div className="notepad-actions summary-actions">
                          <button className="notepad-action-btn" onClick={() => copyNote(selectedAiUpdatedNote)}>
                            <Icon name="copy" size={14} /> <span>Copy Update</span>
                          </button>
                          <button className="notepad-add-note-btn" onClick={applyAiUpdateToSavedNote}>
                            <Icon name="bookmark" size={14} /> <span>Apply To Note</span>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="notes-ai-prompt-box">
                      <textarea
                        className="notepad-add-note-textarea notes-ai-input"
                        value={selectedAiNotePrompt}
                        onChange={(event) => setSelectedAiNotePrompt(event.target.value)}
                        placeholder="Ask GPT-4o to add context, fix errors, improve structure, or rewrite this saved note..."
                      />
                      <div className="notepad-actions summary-actions">
                        <button className="notepad-action-btn" onClick={() => setSelectedAiNotePrompt('')}>
                          <Icon name="trash" size={14} /> <span>Clear Prompt</span>
                        </button>
                        <button className="notepad-add-note-btn" onClick={() => runSelectedNoteAi({ mode: 'chat', instruction: selectedAiNotePrompt || buildDefaultNoteAiInstruction('chat') })} disabled={isSelectedAiLoading}>
                          <Icon name="sparkles" size={14} /> <span>{isSelectedAiLoading ? 'Working...' : 'Send To GPT-4o'}</span>
                        </button>
                      </div>
                    </div>

                    {(currentAISummary || selectedAiResponse) ? (
                      <div className="notepad-actions summary-actions">
                        <button className="notepad-action-btn" onClick={() => copyNote(selectedAiResponse || currentAISummary)}>
                          <Icon name="copy" size={14} /> <span>Copy Reply</span>
                        </button>
                        <button className="notepad-action-btn summarize-single-btn" onClick={saveAISummary} disabled={!currentAISummary}>
                          <Icon name="bookmark" size={14} /> <span>Save Summary</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="notes-ai-saved-summaries">
                <div className="notes-ai-context-title">
                  <Icon name="brain" size={15} /> <span>Saved AI Summaries</span>
                </div>
                {filteredSummaries.length === 0 ? (
                  <div className="notepad-empty">
                    <div className="notepad-empty-icon summary"><Icon name="brain" size={44} strokeWidth={1.8} /></div>
                    <h3>No AI Summaries</h3>
                    <p>Generate a note summary from View Notes, then save it here.</p>
                  </div>
                ) : (
                  filteredSummaries.map((summary) => (
                    <div key={summary.id} className="notepad-item" style={{ borderColor: '#facc15' }}>
                      <div className="notepad-meta">
                        <span className="notepad-time">{summary.date}</span>
                        <span className="notepad-id" style={{ background: '#facc15', color: '#1a1606' }}>{summary.type}</span>
                      </div>
                      <div className="notepad-preview" style={{ whiteSpace: 'pre-wrap' }}>{summary.content}</div>
                      {Array.isArray(summary.tags) && summary.tags.length ? (
                        <div style={{ marginTop: '8px' }}>
                          {summary.tags.map((tag) => (
                            <span
                              key={tag}
                              className="notepad-tag"
                              style={{ borderColor: '#facc15', background: 'rgba(250,204,21,0.12)', color: '#fde68a' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="notepad-actions summary-actions">
                        <button className="notepad-action-btn" onClick={() => copyNote(summary.content)}>
                          <Icon name="copy" size={14} /> <span>Copy</span>
                        </button>
                        <button className="notepad-action-btn danger" onClick={async () => {
                          try {
                            const payload = await apiJson(`/api/notes/summaries/${summary.id}`, { method: 'DELETE' });
                            applyNotesPayload(payload, setNotes, setSummaries);
                            showNotification('Summary deleted', 'success');
                          } catch (error) {
                            showNotification(error.message || 'Failed to delete summary', 'error');
                          }
                        }}>
                          <Icon name="trash" size={14} /> <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="notepad-footer">
        <div className="notepad-count">{notes.length} notes</div>
        <div className="notepad-controls">
          <button type="button" className="notepad-control-btn import-btn" onClick={importTextFile} title="Import">
            <Icon name="import" size={15} />
          </button>
          <button type="button" className="notepad-control-btn export-txt-btn" onClick={exportNotesToTxt} title="Export TXT">
            <Icon name="fileText" size={15} />
          </button>
          <button type="button" className="notepad-control-btn export-btn" onClick={exportNotes} title="Export JSON">
            <Icon name="download" size={15} />
          </button>
          <button type="button" className="notepad-control-btn" onClick={clearAllNotes} title="Clear All">
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesWidget;
