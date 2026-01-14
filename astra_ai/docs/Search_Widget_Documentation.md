# Search Widget Documentation

## Overview
The Search Widget is a sophisticated, cyberpunk-themed component of the NOVA AI interface that provides users with an elegant way to perform searches and manage their search history. It features a futuristic design with glowing cyan accents and corner brackets, consistent with the overall NOVA AI aesthetic.

## Visual Design & Appearance

### Styling Elements
- **Position**: Positioned at top: 12vh, left: 6vh by default
- **Background**: Linear gradient with transparency (rgba(0, 200, 255, 0.2) to rgba(0, 150, 255, 0.15))
- **Border**: 1px solid cyan glow (rgba(0, 255, 255, 0.4))
- **Border Radius**: 8px (customizable: 0px = sharp, 15px = very rounded)
- **Shadow Effects**: 
  - Outer glow: 0 0 15px rgba(0, 255, 255, 0.3)
  - Inner glow: inset 0 0 10px rgba(0, 255, 255, 0.1)
- **Backdrop Filter**: 5px blur for glass effect
- **Animation**: Continuous glowing animation (`searchGlow` keyframe animation)

### Corner Brackets
- Custom CSS-generated corner brackets for futuristic look
- Top-left bracket: Positioned at (-4px, -4px) with right/bottom borders removed
- Bottom-right bracket: Positioned at (-4px, -4px) with left/top borders removed
- Top-right and bottom-left brackets for complete corner styling

### Responsive Behavior
- Maximum width: 90vw (responsive to screen size)
- Padding: 16px 20px 20px 20px
- Can be resized to any dimension (no min/max restrictions)

## Core Functionality

### Search Operations
- Performs intelligent searches based on user queries
- Detects search requests through keywords like "search", "find", "look up", "what is", "who is", etc.
- Extracts search queries from natural language input
- Displays search results in the widget content area
- Integrates with the main AI assistant to process search requests

### Content Display
- Shows search results in a scrollable content area
- Formats text with proper line breaks and word wrapping
- Maintains readable typography (13px font, 1.4 line height)
- Preserves original text formatting with `white-space: pre-wrap`
- Custom-styled scrollbars that match the theme
- Minimum content height of 60px for better presentation

### Tab Navigation System
- **Current Tab**: Shows the most recent search result
- **History Tab**: Displays past search queries and results
- Tab switching with visual active state indicators
- Smooth transitions between tabs

### Search History Management
- Stores up to 50 most recent searches
- Persists history in browser's localStorage
- Timestamps each search with date/time
- Allows users to revisit previous search results
- Shows preview snippets of search results
- Organized in a scrollable history panel

## Interactive Controls

### Widget Controls (Appear on Hover)
- **Make Bigger (⧨)**: Increases widget size
- **Make Smaller (⧩)**: Decreases widget size  
- **Close (⧬)**: Hides the widget
- Controls appear with a smooth slide-in animation
- Positioned at top-right corner of widget

### Content Controls
- **Copy Button**: Copies search content to clipboard with visual feedback
- Positioned outside content area for better accessibility
- Includes SVG icon for copy functionality

### Resize Handle
- Located at bottom-right corner for manual resizing
- Visual indicator with gradient pattern
- Changes appearance on hover for better UX

## Technical Features

### Animation Effects
- Continuous glowing animation (`searchGlow` keyframe animation)
- Smooth transitions for all interactive elements
- Loading animations during search operations
- Hover effects with scaling and brightness changes

### Performance Optimizations
- GPU-accelerated animations using `transform` properties
- Efficient rendering with virtual DOM concepts
- Smooth scrolling with `scroll-behavior: smooth`
- Proper cleanup of event listeners

### Accessibility Features
- Proper contrast ratios for readability
- Semantic HTML structure
- Keyboard navigation support
- Visual feedback for all interactions

### State Management
- Tracks current tab state (current/history)
- Manages loading states during searches
- Maintains content formatting across state changes
- Preserves widget position and size between sessions

## User Experience Features

### Interaction Model
- Hover controls that appear only when interacting with the widget
- Smooth transitions between states (show/hide, loading/content)
- Visual feedback for all user interactions
- Intuitive tab navigation between current results and history
- Persistent state across page reloads

### Visual Feedback
- Glowing effects for active elements
- Color changes on hover and click
- Loading indicators during processing
- Success/error states with appropriate styling
- Animation effects for new content

### Responsive Behavior
- Adapts to different screen sizes
- Maintains readability across devices
- Properly handles long content with scrolling
- Preserves functionality on mobile and desktop

## Integration Points

### AI Assistant Integration
- Works with the main AI assistant to process search requests
- Can be triggered by voice commands or text input
- Integrates with the chat interface to show search results
- Supports natural language processing for search queries

### Data Persistence
- Uses localStorage for search history
- Remembers widget position and size
- Preserves user preferences across sessions
- Handles data overflow gracefully

## Development Notes

### CSS Architecture
- Modular CSS with clear separation of concerns
- Custom properties for easy theming
- Responsive units (vh, vw, px) for flexible layouts
- Z-index management for proper layering

### JavaScript Implementation
- Event-driven architecture
- Asynchronous operations with proper error handling
- Memory-efficient data structures
- Clean event listener management

### Browser Compatibility
- Modern CSS features with appropriate fallbacks
- Cross-browser compatible JavaScript
- Responsive design for various screen sizes
- Touch-friendly controls for mobile devices

## Future Enhancements

### Potential Improvements
- Advanced search filtering options
- Export/search history functionality
- Integration with external search engines
- Rich media content support
- Advanced text formatting options
- Collaboration features for shared searches

## Conclusion

The Search Widget represents a sophisticated blend of form and function, combining a visually striking cyberpunk aesthetic with robust search functionality. Its modular design allows for easy customization and extension while maintaining the cohesive NOVA AI interface experience. The widget's attention to user experience, performance, and accessibility makes it a valuable component of the overall system.