import React, { useState, useEffect, useRef } from 'react';
import './NotesWidget.css';

// Hidden Notepad Access Button Component
export const HiddenNotepadAccessButton = ({ onOpen }) => {
  return (
    <div className="hidden-notepad-access" id="hiddenNotepadAccess" title="Click to open Notepad">
      <div className="notepad-access-icon" onClick={onOpen}>
        <i className="fa-solid fa-sticky-note"></i>
      </div>
    </div>
  );
};

const NotesWidget = ({ onClose }) => {
  // State management
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [currentTab, setCurrentTab] = useState('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState(''); // New Category State
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [dualPaneView, setDualPaneView] = useState(false);
  const [currentAISummary, setCurrentAISummary] = useState('');
  const [aiSummaries, setAISummaries] = useState([]);

  // Advanced AI Summary State
  const [summaryType, setSummaryType] = useState('comprehensive');
  const [summaryLength, setSummaryLength] = useState(3);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiPanelVisible, setAiPanelVisible] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatingNoteId, setGeneratingNoteId] = useState(null); // Track specific note being summarized

  // Widget dragging and resizing state
  const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
  const [widgetSize, setWidgetSize] = useState({ width: 600, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);

  const textareaRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const widgetRef = useRef(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Load notes from localStorage on component mount
  useEffect(() => {
    loadNotes();

    // Set initial position to centerish
    setWidgetPos({
      x: window.innerWidth / 2 - 300,
      y: window.innerHeight * 0.15
    });
  }, []);

  // Automatic Persistence: Save notes whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notepad_notes', JSON.stringify(notes));
    }
  }, [notes]);

  // Filter notes whenever notes or search term changes
  useEffect(() => {
    if (currentTab === 'view') {
      const filtered = searchTerm
        ? notes.filter(note =>
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.dateCreated.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (note.category && note.category.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : notes;
      setFilteredNotes(filtered);
    }
  }, [notes, searchTerm, currentTab]);

  // Dragging functionality
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setWidgetPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Resizing functionality
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(400, resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x));
      const newHeight = Math.max(300, resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y));

      setWidgetSize({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleDragStart = (e) => {
    if (e.target.closest('.widget-controls') || e.target.closest('.resize-handle') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('button') || e.target.closest('.notepad-nav-tab')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - widgetPos.x,
      y: e.clientY - widgetPos.y,
    });
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: widgetSize.width,
      height: widgetSize.height,
    };
  };

  const increaseWidgetSize = () => {
    setWidgetSize({
      width: widgetSize.width + 100,
      height: widgetSize.height + 100,
    });
  };

  const decreaseWidgetSize = () => {
    setWidgetSize({
      width: Math.max(widgetSize.width - 100, 400),
      height: Math.max(widgetSize.height - 100, 300),
    });
  };

  const loadNotes = () => {
    try {
      const savedNotes = localStorage.getItem('notepad_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }

      const savedSummaries = localStorage.getItem('ai_summaries');
      if (savedSummaries) {
        setAISummaries(JSON.parse(savedSummaries));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      showNotification('Error loading notes', 'error');
    }
  };

  const saveNotesToStorage = (updatedNotes) => {
    localStorage.setItem('notepad_notes', JSON.stringify(updatedNotes));
  };

  const addNote = async () => {
    if (!newNoteContent.trim()) {
      showNotification('Please write something before saving!', 'warning');
      return;
    }

    const now = new Date();
    const newNote = {
      id: Date.now().toString(),
      content: newNoteContent,
      category: newNoteCategory.trim(), // Save Category
      timestamp: now.toISOString(),
      dateCreated: now.toLocaleString(),
      preview: newNoteContent.substring(0, 120) + (newNoteContent.length > 120 ? '...' : ''),
      wordCount: newNoteContent.split(/\s+/).filter(word => word.length > 0).length,
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    // Note: useEffect handles localStorage save now, but explicit save keeps sync immediate
    saveNotesToStorage(updatedNotes);

    setNewNoteContent('');
    setNewNoteCategory('');
    setCurrentTab('view');
    setSearchTerm('');
    showNotification(`Note saved successfully!`, 'success');
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      showNotification('Note deleted successfully', 'success');
    }
  };

  const editNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setNewNoteContent(note.content);
      setNewNoteCategory(note.category || '');
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      setCurrentTab('add');
      setSearchTerm('');
      showNotification('Note loaded for editing', 'info');
    }
  };

  const copyNote = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      try {
        await navigator.clipboard.writeText(note.content);
        showNotification('Note copied to clipboard!', 'success');
      } catch (err) {
        showNotification('Failed to copy note', 'error');
      }
    }
  };

  const clearAllNotes = () => {
    if (notes.length === 0) return;
    if (window.confirm('Delete all notes? This cannot be undone.')) {
      setNotes([]);
      saveNotesToStorage([]);
      showNotification('All notes cleared', 'success');
    }
  };

  const exportNotes = () => {
    if (notes.length === 0) return;
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_export_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Notes exported successfully', 'success');
  };

  const exportNotesToTxt = () => {
    if (notes.length === 0) return;
    const txt = notes.map(n => `[${n.dateCreated}] ${n.category ? `[${n.category}]` : ''}\n${n.content}\n---`).join('\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_export_${new Date().toISOString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Notes exported as TXT', 'success');
  };

  const importTextFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (content) {
          if (file.name.endsWith('.json')) {
            try {
              const imported = JSON.parse(content);
              if (Array.isArray(imported)) {
                setNotes([...imported, ...notes]);
                showNotification('JSON notes imported.', 'success');
              }
            } catch { showNotification('Invalid JSON file', 'error'); }
          } else {
            setNewNoteContent(content);
            setCurrentTab('add');
            setSearchTerm('');
            showNotification('File imported. Review and save.', 'info');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const showNotification = (message, type = 'info', duration = 4000) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ show: true, type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, duration);
  };

  // AI Functions
  const extractSummaryTags = (content, type) => {
    const tags = [type];
    if (content.toLowerCase().includes('project') || content.toLowerCase().includes('task')) tags.push('project');
    if (content.toLowerCase().includes('meeting')) tags.push('meeting');
    if (content.toLowerCase().includes('idea')) tags.push('ideas');
    return tags;
  };

  const summarizeSingleNote = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    setGeneratingNoteId(noteId);
    showNotification('Generating summary for note...', 'info');

    try {
      const prompt = `Please provide a comprehensive summary of the following note. Focus on key points and action items.\n\nNote (${note.dateCreated}): ${note.content}`;
      const urlParams = new URLSearchParams(window.location.search);
      const apiPort = urlParams.get('api_port') || '5001';
      const apiBaseUrl = `http://${window.location.hostname}:${apiPort}`;

      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          conversation_id: 'notepad-summary-single-' + Date.now()
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      setCurrentAISummary(data.response || "Summary unavailable");
      setDualPaneView(true);
      showNotification('Summary generated!', 'success');

    } catch (e) {
      console.error(e);
      showNotification('Failed to generate summary', 'error');
    } finally {
      setGeneratingNoteId(null);
    }
  };

  const generateSummary = async () => {
    if (notes.length === 0) {
      showNotification('No notes to summarize', 'warning');
      return;
    }

    setAiGenerating(true);
    showNotification('Generating AI Summary...', 'info');

    try {
      const notesText = notes.map(n => `[${n.dateCreated}] ${n.content}`).join('\n');

      let prompt = '';
      const lengthDesc = { 1: 'very brief', 2: 'concise', 3: 'moderate', 4: 'detailed', 5: 'comprehensive' }[summaryLength];

      switch (summaryType) {
        case 'bullet': prompt = `Create a ${lengthDesc} bullet-point summary of these notes:`; break;
        case 'timeline': prompt = `Create a ${lengthDesc} timeline of events from these notes:`; break;
        case 'themes': prompt = `Analyze key themes in these notes (${lengthDesc}):`; break;
        case 'custom': prompt = customPrompt || `Summarize these notes (${lengthDesc}):`; break;
        default: prompt = `Provide a ${lengthDesc} comprehensive summary of these notes:`;
      }

      // Dynamic API Port
      const urlParams = new URLSearchParams(window.location.search);
      const apiPort = urlParams.get('api_port') || '5001';
      const apiBaseUrl = `http://${window.location.hostname}:${apiPort}`;

      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${prompt}\n\n${notesText}`,
          conversation_id: 'notepad-summary-' + Date.now()
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      setCurrentAISummary(data.response || "AI Summary Generation Failed or Mock Response");
      setDualPaneView(true);
      setAiGenerating(false);
      showNotification('Summary generated!', 'success');

    } catch (e) {
      console.error(e);
      setAiGenerating(false);
      showNotification('Failed to generate summary', 'error');
    }
  };

  const saveAISummary = () => {
    if (!currentAISummary) return;
    const newSummary = {
      id: Date.now().toString(),
      content: currentAISummary,
      date: new Date().toLocaleString(),
      type: summaryType || 'single-note',
      tags: extractSummaryTags(currentAISummary, summaryType || 'single-note')
    };
    const updated = [newSummary, ...aiSummaries];
    setAISummaries(updated);
    localStorage.setItem('ai_summaries', JSON.stringify(updated));
    showNotification('Summary saved', 'success');
    setDualPaneView(false);
  };

  const updateLengthValue = () => {
    const labels = { 1: 'Short', 2: 'Concise', 3: 'Medium', 4: 'Detailed', 5: 'Long' };
    return labels[summaryLength] || 'Medium';
  };

  const insertMarkdown = (syntax) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = newNoteContent;
    const before = text.substring(0, start);
    const sel = text.substring(start, end);
    const after = text.substring(end);

    let insertion = '';
    if (syntax === 'bold') insertion = `**${sel || 'bold'}**`;
    if (syntax === 'italic') insertion = `*${sel || 'italic'}*`;
    if (syntax === 'list') insertion = `\n- ${sel || 'item'}`;
    if (syntax === 'h1') insertion = `\n# ${sel || 'Header'}`;

    const newText = before + insertion + after;
    setNewNoteContent(newText);
    // Ideally move cursor inside, skipping for brevity
    textareaRef.current.focus();
  };

  const handleSwitchTab = (tab) => {
    setCurrentTab(tab);
    setDualPaneView(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={widgetRef}
      className="notepad-widget"
      style={{
        left: `${widgetPos.x}px`,
        top: `${widgetPos.y}px`,
        width: `${widgetSize.width}px`,
        height: `${widgetSize.height}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        display: 'flex'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>

      {/* Resize Handle */}
      <div className="resize-handle" onMouseDown={handleResizeStart}></div>

      {/* Widget Controls */}
      <div className="widget-controls">
        <div className="widget-control-btn" onClick={increaseWidgetSize} title="Make Bigger">⧨</div>
        <div className="widget-control-btn" onClick={decreaseWidgetSize} title="Make Smaller">⧩</div>
        <div className="widget-control-btn" onClick={onClose} title="Close">⧬</div>
      </div>

      {/* Notification System */}
      <div className={`notepad-notification ${notification.show ? 'show' : ''} ${notification.type}`}>
        <div className="notification-content">
          <div className="notification-icon">
            <i className={`fa-solid fa-${notification.type === 'success' ? 'check' : notification.type === 'error' ? 'times' : 'info'}`}></i>
          </div>
          <div className="notification-message">{notification.message}</div>
          <button className="notification-close" onClick={() => setNotification({ ...notification, show: false })}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        {notification.show && <div className="notification-progress"></div>}
      </div>

      {/* Header */}
      <div className="notepad-header">
        <div className="notepad-title">
          <div className="notepad-logo"><i className="fa-solid fa-book-open"></i></div>
          <div className="notepad-brand">Notepad Manager</div>
        </div>
        <div className="notepad-status">
          <div className="notepad-status-indicator"></div>
          <span>Active</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="notepad-nav">
        <div className={`notepad-nav-tab ${currentTab === 'view' ? 'active' : ''}`} onClick={() => handleSwitchTab('view')}>View Notes</div>
        <div className={`notepad-nav-tab ${currentTab === 'add' ? 'active' : ''}`} onClick={() => handleSwitchTab('add')}>Add Note</div>
        <div className={`notepad-nav-tab ${currentTab === 'ai-summaries' ? 'active' : ''}`} onClick={() => handleSwitchTab('ai-summaries')}>
          <i className="fa-solid fa-brain"></i> AI Summaries
        </div>
      </div>

      {/* Search Bar (Only in View Tab within main flow) */}
      {currentTab === 'view' && !dualPaneView && (
        <div className="notepad-search">
          <input
            type="text"
            className="notepad-search-input"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Main Content Area */}

      {dualPaneView ? (
        <div className="notepad-dual-pane" style={{ display: 'flex' }}>
          <div className="dual-pane-header">
            <div className="dual-pane-title">
              <i className="fa-solid fa-brain"></i> AI Summary View
            </div>
            <button className="dual-pane-close" onClick={() => setDualPaneView(false)}><i className="fa-solid fa-times"></i></button>
          </div>
          <div className="dual-pane-content">
            <div className="dual-pane-left">
              <div className="pane-label"><i className="fa-solid fa-sticky-note"></i> Your Notes</div>
              <div className="pane-content">
                {/* If it's a single note summary, only show that note, otherwise filtered notes */}
                {generatingNoteId ? notes.filter(n => n.id === generatingNoteId).map(note => (
                  <div key={note.id} style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', color: '#00CCFF', marginBottom: '4px' }}>{note.dateCreated}</div>
                    <div>{note.content}</div>
                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                  </div>
                )) : filteredNotes.map(note => (
                  <div key={note.id} style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', color: '#00CCFF', marginBottom: '4px' }}>{note.dateCreated}</div>
                    <div>{note.content}</div>
                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="dual-pane-divider"></div>
            <div className="dual-pane-right">
              <div className="pane-label">
                <i className="fa-solid fa-magic-wand-sparkles"></i> AI Summary
                <div className="ai-summary-controls">
                  <button className="ai-summary-btn" onClick={() => navigator.clipboard.writeText(currentAISummary)}><i className="fa-solid fa-copy"></i></button>
                  <button className="ai-summary-btn" onClick={saveAISummary}><i className="fa-solid fa-bookmark"></i></button>
                </div>
              </div>
              <div className="pane-content">{currentAISummary}</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {currentTab === 'view' && (
            <div className="notepad-content-area">
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="notepad-action-btn summarize-single-btn" onClick={() => setAiPanelVisible(!aiPanelVisible)}>
                  <i className="fa-solid fa-brain"></i> {aiPanelVisible ? 'Hide AI Tools' : 'AI Tools'}
                </button>
              </div>

              {aiPanelVisible && (
                <div style={{ background: 'rgba(255,136,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,136,0,0.2)' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {['comprehensive', 'bullet', 'timeline', 'themes', 'custom'].map(t => (
                      <button
                        key={t}
                        className={`notepad-action-btn ${summaryType === t ? 'active' : ''}`}
                        style={{ borderColor: summaryType === t ? '#FF8800' : '' }}
                        onClick={() => setSummaryType(t)}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  {summaryType === 'custom' && (
                    <textarea
                      className="notepad-add-note-textarea"
                      style={{ minHeight: '60px', marginBottom: '8px' }}
                      placeholder="Enter custom prompt..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>Length: {updateLengthValue()}</span>
                    <input
                      type="range" min="1" max="5"
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(parseInt(e.target.value))}
                      style={{ accentColor: '#FF8800' }}
                    />
                    <button className="notepad-action-btn summarize-single-btn" onClick={generateSummary} disabled={aiGenerating}>
                      {aiGenerating ? 'Generating...' : 'Generate Summary'}
                    </button>
                  </div>
                </div>
              )}

              {filteredNotes.length === 0 ? (
                <div className="notepad-empty">
                  <i className="fa-solid fa-sticky-note" style={{ fontSize: '48px', marginBottom: '16px', color: 'rgba(0, 255, 136, 0.4)' }}></i>
                  <h3>No Notes Yet</h3>
                  <p>Click "Add Note" to create your first note!</p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div key={note.id} className="notepad-item">
                    <div className="notepad-meta">
                      <div>
                        <span className="notepad-time" style={{ marginRight: '8px' }}>{note.dateCreated}</span>
                        {note.category && <span className="notepad-tag">{note.category}</span>}
                      </div>
                      <span className="notepad-id">ID: {note.id.slice(-4)}</span>
                    </div>
                    <div className="notepad-preview">{note.preview}</div>
                    <div className="notepad-actions">
                      <button
                        className={`notepad-action-btn summarize-single-btn ${generatingNoteId === note.id ? 'loading' : ''}`}
                        onClick={() => summarizeSingleNote(note.id)}
                        disabled={generatingNoteId === note.id}
                      >
                        <i className="fa-solid fa-magic-wand-sparkles"></i> Summarize
                      </button>
                      <button className="notepad-action-btn" onClick={() => editNote(note.id)}>
                        <i className="fa-solid fa-edit"></i> Edit
                      </button>
                      <button className="notepad-action-btn" onClick={() => copyNote(note.id)}>
                        <i className="fa-solid fa-copy"></i> Copy
                      </button>
                      <button className="notepad-action-btn danger" onClick={() => deleteNote(note.id)}>
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
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
                  onChange={(e) => setNewNoteCategory(e.target.value)}
                />
              </div>
              <div className="markdown-toolbar">
                <button className="markdown-btn" onClick={() => insertMarkdown('bold')} title="Bold"><i className="fa-solid fa-bold"></i></button>
                <button className="markdown-btn" onClick={() => insertMarkdown('italic')} title="Italic"><i className="fa-solid fa-italic"></i></button>
                <button className="markdown-btn" onClick={() => insertMarkdown('h1')} title="Heading"><i className="fa-solid fa-heading"></i></button>
                <button className="markdown-btn" onClick={() => insertMarkdown('list')} title="List"><i className="fa-solid fa-list-ul"></i></button>
              </div>
              <textarea
                ref={textareaRef}
                className="notepad-add-note-textarea"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your note here... supports basic Markdown"
                style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}
              />
              <div className="notepad-add-note-controls">
                <div className="notepad-char-count">{newNoteContent.length} chars</div>
                <button className="notepad-add-note-btn" onClick={addNote}>Save Note</button>
              </div>
            </div>
          )}

          {currentTab === 'ai-summaries' && (
            <div className="notepad-content-area">
              <div className="notepad-search" style={{ padding: '0 0 12px 0', borderBottom: '1px solid rgba(0,255,136,0.2)', marginBottom: '12px' }}>
                <input
                  type="text"
                  className="notepad-search-input"
                  placeholder="Search summaries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                  {['All', 'single-note', 'comprehensive', 'bullet'].map(filter => (
                    <button
                      key={filter}
                      className="notepad-action-btn"
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        opacity: (searchTerm.toLowerCase() === filter.toLowerCase() || (filter === 'All' && searchTerm === '')) ? 1 : 0.6
                      }}
                      onClick={() => setSearchTerm(filter === 'All' ? '' : filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {aiSummaries.length === 0 ? (
                <div className="notepad-empty">
                  <i className="fa-solid fa-brain" style={{ fontSize: '48px', marginBottom: '16px', color: 'rgba(255, 136, 0, 0.4)' }}></i>
                  <h3>No AI Summaries</h3>
                  <p>Generate summaries from the View Notes tab.</p>
                </div>
              ) : (
                aiSummaries
                  .filter(s =>
                    !searchTerm ||
                    s.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (s.type && s.type.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(s => (
                    <div key={s.id} className="notepad-item" style={{ borderColor: '#FF8800' }}>
                      <div className="notepad-meta">
                        <span className="notepad-time">{s.date}</span>
                        <span className="notepad-id" style={{ background: '#FF8800' }}>{s.type}</span>
                      </div>
                      <div className="notepad-preview" style={{ whiteSpace: 'pre-wrap' }}>{s.content}</div>
                      {s.tags && (
                        <div style={{ marginTop: '8px' }}>
                          {s.tags.map(tag => <span key={tag} className="notepad-tag" style={{ borderColor: '#FF8800', background: 'rgba(255,136,0,0.1)', color: '#FF8800' }}>{tag}</span>)}
                        </div>
                      )}
                      <div className="notepad-actions" style={{ marginTop: '8px' }}>
                        <button className="notepad-action-btn" onClick={() => { navigator.clipboard.writeText(s.content); showNotification('Copied', 'success') }}>Copy</button>
                        <button className="notepad-action-btn danger" onClick={() => {
                          const up = aiSummaries.filter(x => x.id !== s.id);
                          setAISummaries(up);
                          localStorage.setItem('ai_summaries', JSON.stringify(up));
                        }}>Delete</button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </>
      )}

      {/* Footer Controls */}
      <div className="notepad-footer">
        <div className="notepad-count">{notes.length} notes</div>
        <div className="notepad-controls">
          <div className="notepad-control-btn import-btn" onClick={importTextFile} title="Import"><i className="fa-solid fa-file-import"></i></div>
          <div className="notepad-control-btn export-txt-btn" onClick={exportNotesToTxt} title="Export TXT"><i className="fa-solid fa-file-lines"></i></div>
          <div className="notepad-control-btn export-btn" onClick={exportNotes} title="Export JSON"><i className="fa-solid fa-download"></i></div>
          <div className="notepad-control-btn" onClick={clearAllNotes} title="Clear All"><i className="fa-solid fa-trash"></i></div>
        </div>
      </div>

    </div>
  );
};

export default NotesWidget;