import React, { useState, useEffect, useRef } from 'react';
import './ImageWidget.css';

const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:8340').replace(/\/$/, '');
const IMAGE_API_ENDPOINT = `${API_HOST}/api/generate-image`;
const IMAGE_GALLERY_ENDPOINT = `${API_HOST}/api/images/backup/index`;
const IMAGE_WIDGET_STORAGE_KEY = 'astra-image-widget-geometry-v1';
const DEFAULT_IMAGE_SIZE = { width: 440, height: 640 };

const readGeometry = () => {
  if (typeof window === 'undefined') return { pos: { x: 52, y: 120 }, size: DEFAULT_IMAGE_SIZE };
  try {
    const saved = JSON.parse(window.localStorage.getItem(IMAGE_WIDGET_STORAGE_KEY) || 'null');
    if (saved?.size?.width && saved?.size?.height && saved?.pos) return saved;
  } catch { /* ignore malformed persisted geometry */ }
  return {
    pos: { x: 52, y: Math.max(24, Math.round((window.innerHeight - DEFAULT_IMAGE_SIZE.height) / 2)) },
    size: { ...DEFAULT_IMAGE_SIZE },
  };
};

const formatImageDate = (timestamp) => {
  if (!timestamp) return '';

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const ImageResultViewer = ({
  src,
  promptText,
  image,
  fitMode = 'contain',
  isLoading = false,
  error = null,
  onBackToGallery,
  onDelete,
}) => (
  <section className="image-result-viewer" aria-label="Generated image result">
    {onBackToGallery && (
      <button type="button" className="gallery-back-btn image-result-back" onClick={onBackToGallery}>
        <span aria-hidden="true">←</span> Gallery
      </button>
    )}
    <div className="image-result-art" data-result-state={isLoading ? 'loading' : error ? 'error' : src ? 'ready' : 'empty'}>
      {isLoading && (
        <div className="image-loading-overlay">
          <div className="cube-loader"><div className="cube cube1"/><div className="cube cube2"/><div className="cube cube4"/><div className="cube cube3"/></div>
          <p className="loading-message">Generating Vision...</p>
        </div>
      )}
      {error && !isLoading && <div className="image-error"><p>{error}</p></div>}
      {!isLoading && !error && src && (
        <img className="image-result-artwork" src={src} alt={promptText || 'AI generated image'} style={{ objectFit: fitMode }} />
      )}
      {!isLoading && !error && !src && (
        <div className="image-empty-void">
          <span className="image-empty-icon" aria-hidden="true">✦</span>
          <strong>Ready to create</strong>
          <span>Describe an image below to begin.</span>
        </div>
      )}
    </div>
    {(promptText || image) && (
      <div className="image-result-details">
        <div className="image-result-details-label">Prompt</div>
        <p className="image-result-prompt">{promptText || 'Untitled generated image'}</p>
        {image && <div className="image-result-meta"><span>{image.display_number ? `Image #${image.display_number}` : image.id || ''}</span><span>{formatImageDate(image.timestamp || image.created_at)}</span></div>}
        {onDelete && <button type="button" className="gallery-delete-btn" onClick={onDelete}>Delete image</button>}
      </div>
    )}
  </section>
);

const ImageWidget = ({ onClose, isVisible = true, aiCommand = null, onCommandResult }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('create');
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState(null);
  const [fitMode, setFitMode] = useState('contain');

  // Keep the image workspace beside the launcher and preserve user geometry
  // across close/open and application restarts.
  const [geometry, setGeometry] = useState(readGeometry);
  const widgetPos = geometry.pos;
  const widgetSize = geometry.size;
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const widgetRef = useRef(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const inputRef = useRef(null);
  const galleryScrollRef = useRef(null);
  const handledCommandIdsRef = useRef(new Set());

  useEffect(() => {
    try { window.localStorage.setItem(IMAGE_WIDGET_STORAGE_KEY, JSON.stringify(geometry)); } catch { /* storage may be unavailable */ }
  }, [geometry]);

  // Keep the AI's context synchronized with the actual image workspace.  The
  // protocol debounces this event, so it is safe to emit on meaningful state
  // changes rather than making the backend infer state from the DOM.
  useEffect(() => {
    const selected = selectedGalleryImage;
    window.dispatchEvent(new CustomEvent('aegisWidgetSemanticState', { detail: {
      widget: 'image',
      state: {
        available: true,
        open: isVisible,
        focused: document.activeElement && widgetRef.current?.contains(document.activeElement) === true,
        view: activeView,
        prompt: prompt.slice(0, 2000),
        image_prompt: imagePrompt.slice(0, 2000),
        generation: { status: isLoading ? 'generating' : (error ? 'failed' : 'idle'), error: error || null },
        fit_mode: fitMode,
        selected_image_id: selected?.id || null,
        selected_image_number: selected?.display_number || null,
        gallery: {
          open: activeView === 'gallery',
          count: galleryImages.length,
          images: galleryImages.slice(0, 50).map((item, index) => ({
            id: item.id,
            number: item.display_number || index + 1,
            prompt: (item.prompt || '').slice(0, 240),
            timestamp: item.timestamp || item.created_at || null,
            url: item.image_url || item.url || item.uri || item.file_url || (item.id ? `${API_HOST}/api/images/backup/file/${encodeURIComponent(item.id)}` : null),
          })),
        },
      },
    }}));
  }, [isVisible, activeView, prompt, imagePrompt, isLoading, error, selectedGalleryImage, galleryImages, fitMode]);

  // Layout sizing on mount or window resize
  useEffect(() => {
    const handleResize = () => {
      const margin = 20;
      setGeometry(prev => ({ ...prev, pos: { x: Math.max(8, Math.min(prev.pos.x, window.innerWidth - 120)), y: Math.max(8, Math.min(prev.pos.y, window.innerHeight - 120)) }, size: { ...prev.size, height: Math.min(prev.size.height, window.innerHeight - (margin * 2)) } }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag listeners
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      setGeometry((prev) => ({ ...prev, pos: { x: Math.max(8, e.clientX - dragOffset.x), y: Math.max(8, e.clientY - dragOffset.y) } }));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragOffset]);

  // Resize listeners
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e) => {
      setGeometry((prev) => ({ ...prev, size: { width: Math.max(360, resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x)), height: Math.max(420, resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y)) } }));
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  const handleDragStart = (e) => {
    // Prevent dragging if interacting with close button, inputs, or resize handle
    if (e.target.closest('.image-header-actions') || 
        e.target.closest('.resize-handle') || 
        e.target.closest('button') || 
        e.target.closest('textarea')) {
      return;
    }
    
    setIsDragging(true);
    setDragOffset({ x: e.clientX - widgetPos.x, y: e.clientY - widgetPos.y });
  };

  const reportCommandResult = (command, status, detail) => {
    if (!command?.request_id || !onCommandResult) return;
    onCommandResult({
      widget: 'image',
      command: command.command,
      request_id: command.request_id,
      status,
      detail,
    });
  };

  const handleGenerate = async (requestedPrompt = prompt, command = null) => {
    const trimmed = typeof requestedPrompt === 'string' ? requestedPrompt.trim() : prompt.trim();
    if (!trimmed) {
      reportCommandResult(command, 'failed', 'Image prompt is empty.');
      return;
    }
    if (isLoading) {
      reportCommandResult(command, 'failed', 'An image is already being generated.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(IMAGE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid response from image API: ${text}`);
      }

      if (!res.ok) {
        const message = data?.detail || data?.error || res.statusText || 'Image generation failed';
        throw new Error(message);
      }

      if (!data || (!data.success && !data.image)) {
        const message = data?.error || 'Image generation server returned no image.';
        throw new Error(message);
      }

      const imageValue = data.image || data?.image_url || data?.uri;
      if (!imageValue) {
        throw new Error('Image generation returned an empty image.');
      }

      setImageUrl(imageValue);
      setImagePrompt(trimmed);
      setPrompt('');
      setActiveView('result');
      // The API returns the persisted backup id when the provider supports
      // persistence.  Keep it as the current selection so later commands can
      // refer to "the last image" without guessing from its prompt.
      if (data.backup_id) {
        setSelectedGalleryImage({
          id: data.backup_id,
          prompt: trimmed,
          timestamp: data.created_at || new Date().toISOString(),
          image_url: typeof imageValue === 'string' && imageValue.startsWith('http') ? imageValue : null,
        });
        // Refresh the persisted index so the new image is immediately
        // addressable by gallery number/ID for subsequent AI commands.
        await loadGalleryImages();
      }
      reportCommandResult(command, 'completed', {
        message: 'Image generation completed.',
        image: { id: data.backup_id || null, url: imageValue, prompt: trimmed },
      });
    } catch (err) {
      console.error('[ImageWidget] generate error:', err);
      const message = err?.message || 'Connection to generation servers failed.';
      setError(message);
      reportCommandResult(command, 'failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGalleryImages = async () => {
    setIsGalleryLoading(true);
    setGalleryError(null);

    try {
      const res = await fetch(IMAGE_GALLERY_ENDPOINT);
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.detail || data?.error || 'Unable to load generated images.');
      }

      const images = Array.isArray(data.images) ? [...data.images] : [];
      images.sort((left, right) => (right.timestamp || '').localeCompare(left.timestamp || ''));
      setGalleryImages(images);
      return images;
    } catch (err) {
      console.error('[ImageWidget] gallery error:', err);
      setGalleryError(err?.message || 'Unable to load generated images.');
      return null;
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleGalleryToggle = () => {
    if (activeView === 'gallery') {
      setActiveView('create');
      setSelectedGalleryImage(null);
      return;
    }

    setActiveView('gallery');
    setSelectedGalleryImage(null);
    loadGalleryImages();
  };

  const getStoredImageUrl = (item) => {
    const direct = item?.image_url || item?.url || item?.image || item?.uri || item?.file_url;
    if (typeof direct === 'string' && direct.startsWith('/')) return `${API_HOST}${direct}`;
    if (typeof direct === 'string' && direct.length > 0) return direct;
    return `${API_HOST}/api/images/backup/file/${encodeURIComponent(item.id)}`;
  };

  const selectGalleryImage = (item, command = null) => {
    if (!item) {
      reportCommandResult(command, 'failed', 'Image was not found in the gallery.');
      return;
    }
    setSelectedGalleryImage(item);
    setActiveView('result');
    reportCommandResult(command, 'completed', {
      message: 'Saved image selected.',
      image: { id: item.id, number: item.display_number || null, prompt: item.prompt || '' },
    });
  };

  const deleteGalleryImage = async (item, command = null) => {
    if (!item?.id) {
      reportCommandResult(command, 'failed', 'A stable image ID is required.');
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/api/images/backup/file/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.detail || body?.error || `Image deletion failed (${res.status})`);
      if (selectedGalleryImage?.id === item.id) setSelectedGalleryImage(null);
      setGalleryImages((current) => current.filter((candidate) => candidate.id !== item.id));
      reportCommandResult(command, 'completed', { message: 'Saved image deleted.', image_id: item.id });
    } catch (err) {
      reportCommandResult(command, 'failed', err?.message || 'Unable to delete saved image.');
    }
  };

  useEffect(() => {
    if (!aiCommand?.command) return;

    const commandId = aiCommand.request_id || `${aiCommand.command}-${aiCommand.issuedAt || ''}`;
    if (handledCommandIdsRef.current.has(commandId)) return;
    handledCommandIdsRef.current.add(commandId);

    const executeCommand = async () => {
      reportCommandResult(aiCommand, 'accepted', `Executing ${aiCommand.command}.`);

      if (aiCommand.command === 'open') {
        setActiveView('create');
        setSelectedGalleryImage(null);
        window.setTimeout(() => inputRef.current?.focus(), 0);
        reportCommandResult(aiCommand, 'completed', 'Image widget opened.');
        return;
      }

      if (aiCommand.command === 'show_gallery') {
        setActiveView('gallery');
        setSelectedGalleryImage(null);
        const loaded = await loadGalleryImages();
        reportCommandResult(aiCommand, loaded ? 'completed' : 'failed', loaded ? 'Generated image gallery opened.' : 'Generated image gallery could not be loaded.');
        return;
      }

      if (aiCommand.command === 'close_gallery' || aiCommand.command === 'back_to_create') {
        setActiveView('create');
        setSelectedGalleryImage(null);
        reportCommandResult(aiCommand, 'completed', 'Image gallery closed.');
        return;
      }

      if (aiCommand.command === 'focus' || aiCommand.command === 'focus_prompt') {
        setActiveView('create');
        window.setTimeout(() => inputRef.current?.focus(), 0);
        reportCommandResult(aiCommand, 'completed', 'Image widget focused.');
        return;
      }

      if (aiCommand.command === 'refresh_gallery') {
        const refreshed = await loadGalleryImages();
        reportCommandResult(aiCommand, refreshed ? 'completed' : 'failed', refreshed ? { message: 'Gallery refreshed.', count: refreshed.length } : 'Gallery could not be refreshed.');
        return;
      }

      if (aiCommand.command === 'set_fit_mode') {
        const next = ['contain', 'cover', 'fill'].includes(aiCommand.fit_mode) ? aiCommand.fit_mode : 'contain';
        setFitMode(next);
        reportCommandResult(aiCommand, 'completed', `Image fit mode set to ${next}.`);
        return;
      }

      if (aiCommand.command.startsWith('scroll_gallery_')) {
        const node = galleryScrollRef.current;
        if (node) {
          if (aiCommand.command === 'scroll_gallery_top') node.scrollTo({ top: 0, behavior: 'smooth' });
          else if (aiCommand.command === 'scroll_gallery_bottom') node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
          else node.scrollBy({ top: aiCommand.command === 'scroll_gallery_up' ? -260 : 260, behavior: 'smooth' });
        }
        reportCommandResult(aiCommand, 'completed', 'Image gallery scroll position updated.');
        return;
      }

      if (aiCommand.command === 'search_gallery') {
        const images = galleryImages.length > 0 ? galleryImages : (await loadGalleryImages() || []);
        const query = String(aiCommand.query || '').trim().toLowerCase();
        const matches = query ? images.filter((item) => String(item.prompt || '').toLowerCase().includes(query)) : images;
        reportCommandResult(aiCommand, matches.length ? 'completed' : 'failed', matches.length ? { message: 'Gallery search completed.', matches: matches.slice(0, 10).map((item) => ({ id: item.id, number: item.display_number, prompt: item.prompt })) } : 'No saved image matched that query.');
        return;
      }

      if (aiCommand.command === 'clear_prompt') {
        setPrompt('');
        reportCommandResult(aiCommand, 'completed', 'Image prompt cleared.');
        return;
      }

      if (aiCommand.command === 'append_prompt' && typeof aiCommand.prompt === 'string') {
        setPrompt((current) => `${current}${current.trim() ? ' ' : ''}${aiCommand.prompt.trim()}`);
        reportCommandResult(aiCommand, 'completed', 'Image prompt updated.');
        return;
      }

      if (aiCommand.command === 'open_gallery_image' || aiCommand.command === 'select_saved_image' || aiCommand.command === 'select_latest') {
        const loadedImages = galleryImages.length > 0 ? galleryImages : (await loadGalleryImages() || []);
        if (!loadedImages.length) {
          reportCommandResult(aiCommand, 'failed', 'Generated image gallery could not be loaded.');
          return;
        }
        const images = loadedImages;
        const item = aiCommand.command === 'select_latest'
          ? images[0]
          : aiCommand.image_id
          ? images.find((candidate) => candidate.id === aiCommand.image_id)
          : aiCommand.query
            ? images.find((candidate) => String(candidate.prompt || '').toLowerCase().includes(aiCommand.query.toLowerCase()))
            : images.find((candidate, index) => (candidate.display_number || index + 1) === Number(aiCommand.image_number));
        selectGalleryImage(item, aiCommand);
        return;
      }

      if (aiCommand.command === 'delete_saved_image' || aiCommand.command === 'delete_image') {
        const images = galleryImages.length > 0 ? galleryImages : (await loadGalleryImages() || []);
        const item = aiCommand.image_id
          ? images.find((candidate) => candidate.id === aiCommand.image_id)
          : aiCommand.query
            ? images.find((candidate) => String(candidate.prompt || '').toLowerCase().includes(aiCommand.query.toLowerCase()))
            : images.find((candidate, index) => (candidate.display_number || index + 1) === Number(aiCommand.image_number));
        await deleteGalleryImage(item, aiCommand);
        return;
      }

      if (aiCommand.command === 'set_prompt' && aiCommand.prompt) {
        setActiveView('create');
        setSelectedGalleryImage(null);
        setPrompt(aiCommand.prompt);
        window.setTimeout(() => inputRef.current?.focus(), 0);
        reportCommandResult(aiCommand, 'completed', 'Image prompt entered.');
        return;
      }

      if ((aiCommand.command === 'generate' && (aiCommand.prompt || prompt)) || aiCommand.command === 'regenerate_last') {
        setActiveView('create');
        setSelectedGalleryImage(null);
        const generationPrompt = aiCommand.command === 'regenerate_last' ? imagePrompt : (aiCommand.prompt || prompt);
        setPrompt(generationPrompt);
        await handleGenerate(generationPrompt, aiCommand);
        return;
      }

      reportCommandResult(aiCommand, 'failed', 'Image widget command was missing required data.');
    };

    executeCommand();
  }, [aiCommand]);

  if (!isVisible) return null;

  return (
    <div
      ref={widgetRef}
      data-aegis-widget="image"
      className={`image-widget ${isDragging ? 'widget-dragging' : ''} ${isResizing ? 'widget-resizing' : ''}`}
      style={{
        left: `${widgetPos.x}px`,
        top: `${widgetPos.y}px`,
        width: `${widgetSize.width}px`,
        height: `${widgetSize.height}px`,
      }}
    >
      <div className="image-header" onMouseDown={handleDragStart}>
        <div className="image-header-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="brand-text">G-Image</span>
        </div>
        <div className="image-header-actions">
          <button
            className={`gallery-toggle-btn ${activeView === 'gallery' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleGalleryToggle(); }}
            title={activeView === 'gallery' ? 'Back to generator' : 'Generated images'}
            aria-label={activeView === 'gallery' ? 'Back to generator' : 'Open generated images gallery'}
          >
            {activeView === 'gallery' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            )}
          </button>
          <button className="close-btn" onClick={(e) => { e.stopPropagation(); onClose && onClose(); }} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {activeView === 'gallery' ? (
        <div className="gallery-view" onMouseDown={(e) => e.stopPropagation()}>
          <div className="gallery-heading">
            <div>
              <div className="gallery-eyebrow">Image Scene</div>
              <h2>{selectedGalleryImage ? 'Preview' : 'Generated Images'}</h2>
            </div>
            {!selectedGalleryImage && !isGalleryLoading && (
              <span className="gallery-count">{galleryImages.length}</span>
            )}
          </div>

          <div className="gallery-scroll-area" ref={galleryScrollRef}>
              {isGalleryLoading && (
                <div className="gallery-status">Loading generated images...</div>
              )}

              {galleryError && !isGalleryLoading && (
                <div className="gallery-status gallery-status-error">
                  <p>{galleryError}</p>
                  <button type="button" onClick={loadGalleryImages}>Try again</button>
                </div>
              )}

              {!isGalleryLoading && !galleryError && galleryImages.length === 0 && (
                <div className="gallery-status">Images created with the AI will appear here.</div>
              )}

              {!isGalleryLoading && !galleryError && galleryImages.length > 0 && (
                <div className="gallery-grid">
                  {galleryImages.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="gallery-card"
                      onClick={() => selectGalleryImage(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          selectGalleryImage(item);
                        }
                      }}
                      aria-label={`Open image ${item.display_number || galleryImages.indexOf(item) + 1}`}
                      title={item.prompt || 'View generated image'}
                    >
                      <img
                        src={getStoredImageUrl(item)}
                        alt={item.prompt || 'AI generated image'}
                        loading="lazy"
                        onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
                      />
                      <span className="gallery-card-caption">
                        <strong>#{item.display_number || galleryImages.indexOf(item) + 1}</strong>
                        {item.prompt || 'Untitled image'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>
      ) : (
        <>
          <div className="image-content-wrapper image-result-scroll">
            <ImageResultViewer
              src={selectedGalleryImage ? getStoredImageUrl(selectedGalleryImage) : imageUrl}
              promptText={selectedGalleryImage?.prompt || imagePrompt}
              image={selectedGalleryImage}
              fitMode={fitMode}
              isLoading={isLoading}
              error={error}
              onBackToGallery={selectedGalleryImage ? () => setActiveView('gallery') : undefined}
              onDelete={selectedGalleryImage ? () => deleteGalleryImage(selectedGalleryImage) : undefined}
            />
          </div>

          <div className="image-input-section" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pill-input-bar">
              <button type="button" className="pill-icon-btn attachment-btn" title="Add">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              
              <textarea
                ref={inputRef}
                autoFocus
                placeholder="Chiedi qualsiasi cosa"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />

              <div className="pill-actions-right">
                <button type="button" className="pill-icon-btn mic-btn" title="Voice Input">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
                
                <button 
                  type="button"
                  className={`generate-circle-btn ${isLoading ? 'loading' : ''}`} 
                  onClick={() => handleGenerate()} 
                  disabled={isLoading || !prompt.trim()}
                  title="Generate"
                >
                  {isLoading ? (
                    <div className="mini-spinner"></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10L3 14" />
                      <path d="M7 6L7 18" />
                      <path d="M11 3L11 21" />
                      <path d="M15 8L15 16" />
                      <path d="M19 11L19 13" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="resize-handle" onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = { x: e.clientX, y: e.clientY, width: widgetSize.width, height: widgetSize.height };
      }}></div>
    </div>
  );

};

export default ImageWidget;
