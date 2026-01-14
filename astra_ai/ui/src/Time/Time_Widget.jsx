import React, { useState, useEffect, useRef } from 'react';
import './Time_Widget.css';

/**
 * TimeWidget Component
 * 
 * Advanced time widget with improved dragging from splash_screen.html.
 * Features:
 * - Real-time clock with timezone support
 * - Smooth GPU-accelerated dragging
 * - 4-step scaling system (small, normal, large, xlarge)
 * - Glassmorphism design with corner accents
 * - Location-based time display
 */
const TimeWidget = ({ onClose, initialPosition = { x: 100, y: 100 }, location = "Local Time" }) => {
    const [time, setTime] = useState(new Date());
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, left: 0, top: 0 });

    // Animation states
    const [isFlashing, setIsFlashing] = useState(false);
    const [isTicking, setIsTicking] = useState(false);

    const widgetRef = useRef(null);

    // Widget Size Management (matching splash_screen.html logic)
    const WIDGET_SCALES = [0.8, 1, 1.2, 1.5]; // small, normal, large, xlarge
    const [scaleIndex, setScaleIndex] = useState(1); // Default to index 1 (Normal / 1.0)

    const handleIncreaseSize = () => {
        setScaleIndex(prev => Math.min(prev + 1, WIDGET_SCALES.length - 1));
    };

    const handleDecreaseSize = () => {
        setScaleIndex(prev => Math.max(prev - 1, 0));
    };

    const currentScale = WIDGET_SCALES[scaleIndex];

    // Initial Flash when location changes or component mounts
    useEffect(() => {
        setIsFlashing(true);
        const timer = setTimeout(() => setIsFlashing(false), 800);
        return () => clearTimeout(timer);
    }, [location]);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());

            // Subtle tick animation each second
            setIsTicking(true);
            setTimeout(() => setIsTicking(false), 200);

        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Advanced Dragging Logic from splash_screen.html
    const handleMouseDown = (e) => {
        // Prevent dragging if clicking on controls or resize handle
        if (e.target.closest('.widget-controls') ||
            e.target.closest('.resize-handle') ||
            e.target.closest('.widget-control-btn')) {
            return;
        }

        if (widgetRef.current) {
            const rect = widgetRef.current.getBoundingClientRect();

            // Check if clicking in resize corner (bottom-right 25px area)
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const cornerSize = 25;

            if (clickX > rect.width - cornerSize && clickY > rect.height - cornerSize) {
                return; // Don't drag if in resize corner
            }

            setDragStart({
                x: e.clientX,
                y: e.clientY,
                left: rect.left,
                top: rect.top
            });
            setIsDragging(true);

            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            e.preventDefault();

            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            // Apply bounds checking
            const newLeft = Math.max(0, Math.min(window.innerWidth - 150, dragStart.left + deltaX));
            const newTop = Math.max(0, Math.min(window.innerHeight - 100, dragStart.top + deltaY));

            setPosition({ x: newLeft, y: newTop });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.userSelect = '';

            // Save position to localStorage
            if (widgetRef.current) {
                const savedPos = {
                    x: position.x,
                    y: position.y,
                    scaleIndex: scaleIndex
                };
                localStorage.setItem('timeWidget_position', JSON.stringify(savedPos));
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, position.x, position.y, scaleIndex]);

    // Load saved position on mount
    useEffect(() => {
        const saved = localStorage.getItem('timeWidget_position');
        if (saved) {
            try {
                const savedPos = JSON.parse(saved);
                setPosition({ x: savedPos.x, y: savedPos.y });
                if (savedPos.scaleIndex !== undefined) {
                    setScaleIndex(savedPos.scaleIndex);
                }
            } catch (e) {
                console.warn('Failed to load time widget position:', e);
            }
        }
    }, []);

    // Helper to determine TimeZone based on location string
    const getTimeZone = (loc) => {
        const normalized = loc.toLowerCase();
        if (normalized.includes('italy') || normalized.includes('rome') || normalized.includes('como')) return 'Europe/Rome';
        if (normalized.includes('london') || normalized.includes('uk') || normalized.includes('britain')) return 'Europe/London';
        if (normalized.includes('new york') || normalized.includes('nyc')) return 'America/New_York';
        if (normalized.includes('tokyo') || normalized.includes('japan')) return 'Asia/Tokyo';
        if (normalized.includes('california') || normalized.includes('los angeles') || normalized.includes('usa')) return 'America/Los_Angeles';
        if (normalized.includes('paris') || normalized.includes('france')) return 'Europe/Paris';
        if (normalized.includes('berlin') || normalized.includes('germany')) return 'Europe/Berlin';

        // Default to local system time if no match
        return undefined;
    };

    // Format Time with TimeZone support
    const formatTime = (date) => {
        const timeZone = getTimeZone(location);
        try {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: timeZone
            });
        } catch (error) {
            // Fallback if timezone is invalid
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        }
    };

    return (
        <div
            ref={widgetRef}
            className={`time-display ${isDragging ? 'widget-dragging' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: 'top left',
                willChange: isDragging ? 'transform' : 'auto',
                pointerEvents: 'auto'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Corner Brackets */}
            <div className="corner-top-right"></div>
            <div className="corner-bottom-left"></div>

            {/* Widget Controls */}
            <div className="widget-controls">
                <div className="widget-control-btn" onClick={handleIncreaseSize} title="Make Bigger">⧨</div>
                <div className="widget-control-btn" onClick={handleDecreaseSize} title="Make Smaller">⧩</div>
                <div className="widget-control-btn" onClick={onClose} title="Close">⧬</div>
            </div>

            {/* Resize Handle (Visual only for now, functionality via buttons) */}
            <div className="resize-handle"></div>

            {/* Content */}
            <div className="time-label">TIME</div>
            <div className={`time-value ${isFlashing ? 'flash' : ''} ${isTicking ? 'tick' : ''}`}>
                {formatTime(time)}
            </div>
            <div className="time-location">{location}</div>
        </div>
    );
};

export default TimeWidget;