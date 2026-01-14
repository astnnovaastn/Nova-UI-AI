# Astra AI - React UI Implementation

Complete React conversion of the NOVA splash screen with all 11 interactive widgets integrated into a modular, scalable architecture.

## Project Structure

```
astra_ai/ui/
├── public/
│   └── index.html              # React DOM mount point
├── src/
│   ├── components/
│   │   ├── NovaCore/           # Animated NOVA interface with voice reactivity
│   │   │   ├── NovaCore.jsx
│   │   │   └── NovaCore.css
│   │   ├── Chat/               # Chat system with floating button
│   │   │   ├── ModernChat.jsx
│   │   │   ├── ModernChat.css
│   │   │   ├── FloatingChatButton.jsx
│   │   │   └── FloatingChatButton.css
│   │   ├── Search/             # Search widget (cyan theme)
│   │   │   ├── SearchWidget.jsx
│   │   │   └── SearchWidget.css
│   │   ├── News/               # News widget (orange theme)
│   │   │   ├── NewsWidget.jsx
│   │   │   └── NewsWidget.css
│   │   ├── Notes/              # Notes widget (green theme)
│   │   │   ├── NotesWidget.jsx
│   │   │   └── NotesWidget.css
│   │   ├── TicTacToe/          # Game widget (pink theme)
│   │   │   ├── TicTacToeWidget.jsx
│   │   │   └── TicTacToeWidget.css
│   │   ├── Camera/             # Camera widget (orange theme)
│   │   │   ├── CameraWidget.jsx
│   │   │   └── CameraWidget.css
│   │   ├── Calculator/         # Calculator widget (purple theme)
│   │   │   ├── CalculatorWidget.jsx
│   │   │   └── CalculatorWidget.css
│   │   ├── ObjectIdentification/  # Object ID widget (cyan theme)
│   │   │   ├── ObjectIdentificationWidget.jsx
│   │   │   └── ObjectIdentificationWidget.css
│   │   ├── Task/               # Task widget (green theme)
│   │   │   ├── TaskWidget.jsx
│   │   │   └── TaskWidget.css
│   │   └── AIEye/              # AI Eye widget (red theme)
│   │       ├── AIEyeWidget.jsx
│   │       └── AIEyeWidget.css
│   ├── App.jsx                 # Main app component (widget orchestration)
│   ├── App.css                 # Global styles and CSS variables
│   ├── index.jsx               # React 18 entry point
│   └── index.css               # Base styles
├── package.json                # Dependencies and scripts
└── .gitignore                  # Git ignore rules
```

## Widget Overview

### 1. **NovaCore** - Voice-Reactive Interface
- Animated concentric circles with neon glow
- Voice reactivity simulation with intensity levels
- Real-time animation responsiveness
- Positioned: Center screen

### 2. **ModernChat** - AI Chat System
- Full message history management
- Typing indicator animation
- Auto-scroll to latest message
- Floating trigger button
- Position: Right side, toggleable

### 3. **SearchWidget** - Search Functionality
- Neon cyan borders with glow effects
- Corner bracket decoration
- Position: Top-left (12vh, 6vh)
- Theme: Cyan (#00FFFF)

### 4. **NewsWidget** - News Feed
- Neon orange borders
- Real-time news integration ready
- Position: Top-right (12vh, 6vh)
- Theme: Orange (#FF9500)

### 5. **NotesWidget** - Notes Management
- Quick notes and reminders
- Scrollable content area
- Position: Center (15vh)
- Theme: Green (#00FF88)

### 6. **TicTacToeWidget** - Game Playing
- AI opponent with difficulty modes
- Game statistics tracking
- Position: Bottom-left (12vh, 6vh)
- Theme: Pink (#FF1493)

### 7. **CameraWidget** - Camera Integration
- Real-time camera feed (ready for implementation)
- Image capture capabilities
- Position: Top-right (12vh, 6vh)
- Theme: Orange (#FFA500)

### 8. **CalculatorWidget** - Scientific Calculator
- Basic and scientific modes
- Expression evaluation
- Position: Bottom-right (12vh, 6vh)
- Theme: Purple (#8A2BE2)

### 9. **ObjectIdentificationWidget** - AI Vision
- Object recognition and analysis
- Image classification
- Position: Center (32vh)
- Theme: Cyan (#00FFC8)

### 10. **TaskWidget** - Task Management
- Todo list with priorities
- Task categorization
- Position: Center-bottom (12vh)
- Theme: Green (#00FF88)

### 11. **AIEyeWidget** - Advanced Vision
- AI-powered image analysis
- Real-time video analysis
- Position: Center (32vh)
- Theme: Red (#FF6464)

## Design System

### Color Palette
```css
--primary-cyan: #00FFFF
--primary-orange: #FF9500
--primary-green: #00FF88
--primary-purple: #8A2BE2
--bg-dark: #0C294F
--bg-darker: #061D3B
--bg-darkest: #041529
```

### Typography
- Font: Orbitron (Google Fonts)
- Size: 14-24px depending on context
- Weight: 400-700

### Animations
- Glowing box-shadow effects (3-4s cycles)
- Framer-motion slide/fade transitions
- Voice-reactive ring pulsing
- Particle effects on interactions

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager
- Python 3.8+ (for backend services)

### Installation Steps

```bash
# Navigate to the UI folder
cd astra_ai/ui

# Install all dependencies
npm install

# Start the development server
npm start
```

The app will open at `http://localhost:3000`

### Available Scripts

```bash
npm start        # Start dev server (port 3000)
npm run build    # Build for production
npm test         # Run test suite
npm run eject    # Eject from create-react-app (irreversible)
```

## Dependencies

### Core Framework
- **react** (18.2.0) - UI framework
- **react-dom** (18.2.0) - DOM rendering
- **react-scripts** (5.0.1) - Build tools

### Animation & UI
- **framer-motion** (10.16.4) - Advanced animations
- **axios** (1.6.0) - HTTP client for API calls

### State Management
- **zustand** (4.4.0) - Lightweight state management

### Other
- **FontAwesome** (6.4.0) - Icon library (CDN)
- **Google Fonts** - Orbitron font family

## Configuration

### CSS Variables
All colors are centralized in [App.css](App.css#L10-L20). To customize colors, modify:

```css
:root {
  --primary-cyan: #00FFFF;
  --primary-orange: #FF9500;
  --primary-green: #00FF88;
  --primary-purple: #8A2BE2;
  --bg-dark: #0C294F;
  --bg-darker: #061D3B;
  --bg-darkest: #041529;
}
```

### Environment Variables
Create `.env` file in the UI folder:

```env
REACT_APP_GEMINI_API_KEY=your_api_key_here
REACT_APP_NOVA_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

## Implementation Status

### ✅ Completed
- [x] React project scaffold
- [x] Global styling system
- [x] NOVA core interface with voice animations
- [x] Chat system with messages and typing indicator
- [x] Floating chat button
- [x] All 11 widget shells with proper styling
- [x] CSS variables and theme system
- [x] Responsive design layout
- [x] Framer-motion animations

### 🔄 In Progress
- [ ] Chat AI integration (Gemini API)
- [ ] TicTacToe game AI logic
- [ ] Calculator scientific functions
- [ ] Camera feed integration

### ⏳ Pending
- [ ] Voice recognition (Web Audio API)
- [ ] Drag & drop widget functionality
- [ ] State persistence (localStorage)
- [ ] Zustand store setup
- [ ] API service integration
- [ ] Testing suite

## Development Workflow

1. **Component Creation**
   - Create folder in `src/components/[WidgetName]/`
   - Create `[WidgetName].jsx` (functional component)
   - Create `[WidgetName].css` (styles)
   - Export from component index

2. **Styling**
   - Use CSS variables for colors
   - Follow the neon aesthetic with glowing borders
   - Add corner bracket decorations where appropriate
   - Include animation keyframes

3. **State Management**
   - Use `useState` for local component state
   - Use Zustand for global app state (coming soon)
   - Use `useRef` for DOM access
   - Use `useEffect` for side effects

4. **Adding New Dependencies**
   ```bash
   npm install package-name
   # Update package.json automatically
   ```

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires CSS Grid, Flexbox, and ES6+ support.

## Troubleshooting

### Port Already in Use
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Module Not Found
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CSS Not Loading
- Check file paths are relative (`./components/...`)
- Ensure CSS files are in the same folder as JSX
- Clear browser cache (Ctrl+Shift+Delete)

## Performance Tips

1. **Code Splitting**: Widgets load on-demand
2. **Lazy Loading**: Use `React.lazy()` for heavy components
3. **Memoization**: Wrap expensive components with `React.memo()`
4. **CSS Optimization**: Combine animations to reduce repaints

## Next Steps

1. **Setup Zustand Store** for centralized state
2. **Create Services** for API integration
3. **Implement Voice Recognition** using Web Audio API
4. **Add Drag & Drop** functionality
5. **Connect to Backend APIs** (Gemini, Nova AI server)
6. **Add Testing** with Jest and React Testing Library
7. **Optimize Performance** with code splitting
8. **Deploy** to production environment

## Resources

- [React Documentation](https://react.dev)
- [Framer Motion Guide](https://www.framer.com/motion/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [MDN Web Docs](https://developer.mozilla.org/)

## License

This project is part of the Astra AI system. See LICENSE file for details.

---

**Created**: 2024
**Last Updated**: November 2024
**Status**: Active Development
