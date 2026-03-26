import React, { useState, useEffect, useRef } from 'react';

/**
 * EnhancedDraggableWidget
 * 
 * A wrapper component that provides advanced draggable and resizable functionality
 * similar to the original Astra AI splash_screen.html implementation.
 * 
 * Features:
 * - Smooth GPU-accelerated dragging
 * - Resizable with handle
 * - Dynamic size scaling
 * - Position persistence (localStorage)
 * - Boundary checking
 */
const EnhancedDraggableWidget = ({
    children,
    id,
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 300, height: 200 },
    minSize = { width: 150, height: 100 },
    title = "Widget",
    onClose = null,
    className = "",
    isVisible = true,
    enableResizing = true,
    externalSize = null // New prop for external size changes
}) => {
    // State for position and size
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Refs for logic
    const widgetRef = useRef(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const startResize = useRef({ x: 0, y: 0, width: 0, height: 0 });

    // Load saved position from localStorage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem(`widget_${id}_config`);
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.position) setPosition(config.position);
                if (config.size) setSize(config.size);
            } catch (e) {
                console.warn(`Failed to load config for widget ${id}`, e);
            }
        }
    }, [id]);

    // Save config when it changes
    useEffect(() => {
        if (!isDragging && !isResizing) {
            localStorage.setItem(`widget_${id}_config`, JSON.stringify({ position, size }));
        }
    }, [position, size, id, isDragging, isResizing]);

    // Update size when props change
    useEffect(() => {
        setSize(initialSize);
    }, [initialSize]);

    // Update size when external size prop changes
    useEffect(() => {
        if (externalSize) {
            setSize(externalSize);
        }
    }, [externalSize]);

    // --- Drag Logic ---
    const handleMouseDown = (e) => {
        // Ignore if clicking on interactive elements or resize handle
        if (e.target.closest('button') ||
            e.target.closest('input') ||
            e.target.closest('.resize-handle') ||
            e.target.closest('.no-drag')) {
            return;
        }

        setIsDragging(true);

        // Calculate offset relative to the widget's top-left corner
        const rect = widgetRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Disable selection
        document.body.style.userSelect = 'none';
    };

    // --- Resize Logic ---
    const handleResizeStart = (e) => {
        e.stopPropagation(); // Prevent drag
        setIsResizing(true);
        startResize.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'se-resize';
    };

    // --- Global Mouse Move/Up Handlers ---
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                // Calculate new position
                let newX = e.clientX - dragOffset.current.x;
                let newY = e.clientY - dragOffset.current.y;

                // Allow widget to be dragged anywhere on screen
                // Only prevent dragging completely off-screen by a small margin
                const margin = 20;
                newX = Math.max(-size.width + margin, Math.min(newX, window.innerWidth - margin));
                newY = Math.max(-size.height + margin, Math.min(newY, window.innerHeight - margin));

                setPosition({ x: newX, y: newY });
            } else if (isResizing) {
                // Calculate delta
                const deltaX = e.clientX - startResize.current.x;
                const deltaY = e.clientY - startResize.current.y;

                // Apply new size
                const newWidth = Math.max(minSize.width, startResize.current.width + deltaX);
                const newHeight = Math.max(minSize.height, startResize.current.height + deltaY);

                setSize({ width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            if (isDragging || isResizing) {
                setIsDragging(false);
                setIsResizing(false);
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, minSize]);

    if (!isVisible) return null;

    // Dynamic Scale Calculation (Simulating applyDynamicTextScaling)
    // This calculates a scale factor based on how much larger/smaller the widget is compared to base
    const baseWidth = 300;
    const scaleFactor = Math.min(Math.max((size.width / baseWidth), 0.7), 1.5);

    return (
        <div
            ref={widgetRef}
            id={id}
            className={`enhanced-widget ${className}`}
            style={{
                position: 'absolute',
                top: position.y,
                left: position.x,
                width: size.width,
                height: size.height,
                // Apply dynamic scale css variable for children to use
                '--scale-factor': scaleFactor,
                zIndex: isDragging ? 1000 : 100, // Pop to front when dragging
                transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s ease',
                cursor: isDragging ? 'move' : 'default'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Visual Header/Handle Area */}
            {/* Note: The user can click anywhere on the widget background to drag, 
          unless specific children stopPropagation or are buttons */}

            {/* Corner Brackets (Aesthetic) */}
            <div className="widget-corner top-left"></div>
            <div className="widget-corner top-right"></div>
            <div className="widget-corner bottom-left"></div>
            <div className="widget-corner bottom-right"></div>

            {children}

            {/* Resize Handle */}
            {enableResizing && (
                <div
                    className="resize-handle"
                    onMouseDown={handleResizeStart}
                ></div>
            )}

            {/* Close Button (Optional Overlay) */}
            {onClose && (
                <button
                    className="widget-close-overlay no-drag"
                    onClick={onClose}
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default EnhancedDraggableWidget;
