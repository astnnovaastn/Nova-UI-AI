# Astra AI UI Logic Analysis
**Source File:** `astra_ai/ui/splash_screen.html`
**Analysis Date:** 2025-12-29

## 1. Global System Logic
### Initialization
- **Components:** The system initializes via `DOMContentLoaded` and `window.onload`.
- **Key Functions:**
    - `initializeDragAndResize()`: Sets up the interaction model.
    - `loadHistory()`: Loads search and news history from `localStorage`.
    - `initializeModernChat()`: Sets up the floating chat interface.
    - Desktop environment checks are performed to enable file-system specific features (like Notepad storage).

### Interaction Model (Drag & Resize)
- **Implementation:** Custom logic in `dragState` object tracking mouse events (`mousedown`, `mousemove`, `mouseup`).
- **Features:**
    - Draggable widgets (`.widget-draggable`).
    - Resizable widgets via corner handle or edge dragging.
    - **Smart Scaling:** `applyDynamicTextScaling(widget, width, height)` dynamically adjusts font sizes, padding, margins, and element sizes based on the widget's dimensions to ensure content remains readable and aesthetic at any size.
- **Persistence:** Widget positions and sizes are saved to `localStorage`.

### Notification System
- **Function:** `showNotification(message, type, duration)`
- **Types:** Success, Error, Warning, Info.
- **UI:** Floating toasts with icons and progress bars.

## 2. Widget Breakdown

### 🕒 Time Widget
- **Logic:** `updateClock()`, `displayTimeForLocation()`.
- **Features:**
    - Real-time updates.
    - Support for multiple locations (e.g., "Como, Italy").
    - Visual effects (neon glow, pulsing separators).

### 🌤️ Weather Widget
- **Logic:** `getWeatherForLocation()`, `updateWeatherDisplay()`.
- **Features:**
    - Fetches data from AI Backend or direct API.
    - **Fallback:** Logic to extract weather info from text descriptions if structured data fails.
    - **Visuals:** Dynamic scaling of temperature, icons, and details.
    - **Auto-Update:** Refreshes every 5 minutes.

### 🔍 Search Widget
- **Logic:** `sendSearchRequestToAI()`, `updateSearchWidget()`.
- **Features:**
    - **Tabs:** "Current Result" vs "History".
    - **Image Integration:** Fetches relevant images via `Picsum` using semantic seeds derived from query keywords (`extractKeywordsFromQuery`).
    - **History:** Saved to `localStorage`.

### 📰 News Widget
- **Logic:** `sendNewsRequestToAI()`, `renderNewsArticles()`.
- **Features:**
    - **Structure:** Parses "HEADLINE:", "SOURCE:", "TIME:" formats.
    - **Tabs:** "Latest News" vs "History".
    - **Time:** dedicated "Italy Time" display in header.
    - **images:** Keyword-based image fetching for articles.

### 📝 Notepad Widget
- **Logic:** `loadNotepadNotes()`, `saveNotepadNote()`, `summarizeSingleNote()`.
- **Storage:** Hybrid approach. uses `fetch` to local API (`/api/notepad/load/save`) for desktop file persistence, falls back to `localStorage` if offline.
- **Features:**
    - **Tabs:** View, Add, AI Summaries.
    - **Editor:** Character/word/line counts, keyboard shortcuts (Ctrl+S).
    - **AI:** Summarization of single notes or all notes.
    - **Import/Export:** .txt and .json support.

### 👁️ Camera / AI Eye Widget
- **Logic:** `CameraWidget` class.
- **AI Integration:** **Direct Gemini Integration** (`gemini-1.5-flash`) embedded in frontend for low-latency vision.
- **Features:**
    - **Permissions:** Robust state handling (Granted/Denied/Prompt) with user guidance.
    - **Modes:** Capture, Record, Auto-Start.
    - **Analysis:** "What do you see?" functionality handling both general scene analysis and specific object identification.

### 📦 Object Identification Widget
- **Logic:** `showObjectWidget()`, `displayObjectResults()`.
- **Workflow:**
    1. Camera captures image.
    2. Gemini identifies object.
    3. Nova AI is queried for deeper details (nutritional info, pricing, history).
    4. Results displayed in dual-pane view (Identification + Deep Info).
- **History:** Tracks previously identified objects.

### 🎮 Tic-Tac-Toe Widget
- **Logic:** Minimax algorithm for "Impossible" mode.
- **Features:** 2-player or vs AI.

## 3. Integration Points
- **Nova AI Backend (`api_port`):** Used for Search, News, Notepad storage, and deep object lookup. Primary interface for complex queries.
- **Direct Gemini API:** Used strictly within `CameraWidget` for real-time vision to reduce latency.
- **LocalStorage:** Used for widget positions, history (search/news/objects), and fallback storage.
