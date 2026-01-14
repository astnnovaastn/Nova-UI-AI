# 🚀 Quick Start Guide - Astra AI React UI

Get your React UI running in 5 minutes!

## ⚡ 5-Minute Setup

### 🪟 Windows Users (EASIEST)

**Double-click to start:**
```
astra_ai/ui/start.bat
```
That's it! Everything else is automatic. ✓

**OR from PowerShell:**
```powershell
cd astra_ai\ui
.\start.ps1
```

### 🍎 Mac / 🐧 Linux Users

```bash
cd astra_ai/ui
chmod +x start.sh
./start.sh
```

### 📝 Manual Setup (All Systems)

If you prefer to run commands manually:

```bash
cd astra_ai/ui
npm install        # Install dependencies
npm start          # Start development server
```

The browser automatically opens at `http://localhost:3000`

You should see:
- ✅ Deep blue gradient background with dot grid
- ✅ NOVA core interface (concentric circles in center)
- ✅ Chat button in bottom-right
- ✅ Search widget (top-left, cyan)
- ✅ News widget (top-right, orange)
- ✅ Notepad widget (left side, green)

## 📦 What's Included

### 11 Interactive Widgets
1. **NOVA Core** - Voice-reactive animated interface
2. **Chat** - Full chat system with floating button
3. **Search** - Search functionality (cyan theme)
4. **News** - News feed integration (orange theme)
5. **Notepad** - Note taking with create/edit/delete
6. **TicTacToe** - Game widget (pink theme)
7. **Camera** - Camera integration (orange theme)
8. **Calculator** - Scientific calculator (purple theme)
9. **Object Identification** - Image recognition (cyan theme)
10. **Task** - Task management (green theme)
11. **AI Eye** - Advanced vision analysis (red theme)

## 🎨 Design Features

- **Neon Cyberpunk Aesthetic**: Glowing borders, dark background
- **Voice-Reactive Animations**: NOVA interface responds to voice
- **Smooth Transitions**: Framer-motion animations throughout
- **Responsive Layout**: Works on different screen sizes
- **CSS Variables**: Easy theme customization

## 📝 Default Widgets Visible

When you start, these widgets are visible:
- ✅ Search Widget (top-left)
- ✅ News Widget (top-right)
- ✅ Notepad Widget (left-center) - Functional!
- ❌ Others are hidden (toggle in future)

## 🛠️ Common Tasks

### Enable/Disable Widgets
Edit `src/App.jsx` and modify the `widgets` state:
```jsx
const [widgets, setWidgets] = useState({
  search: true,      // Show Search
  news: true,        // Show News
  notepad: true,     // Show Notepad
  tictactoe: true,   // Show TicTacToe
  camera: false,     // Hide Camera
  calculator: false, // Hide Calculator
  objectidentification: false,
  task: false,
  aieye: false,
});
```

### Customize Colors
Edit `src/App.css` and modify CSS variables:
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

### Add API Integration
1. Create `.env` file:
```env
REACT_APP_GEMINI_API_KEY=your_key_here
REACT_APP_NOVA_API_URL=http://localhost:5000
```

2. Use in components:
```jsx
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
```

## 📂 Folder Structure

```
ui/
├── public/           # Static files, HTML mount point
├── src/
│   ├── components/   # All 11 widget components
│   ├── App.jsx       # Main app container
│   ├── App.css       # Global styles
│   └── index.jsx     # React entry point
├── package.json      # Dependencies
└── README.md         # Full documentation
```

## 🔧 Development Tips

### Make Changes Without Restarting
The dev server has hot reload enabled. Just save files and changes appear automatically.

### Debug in Browser
Open Chrome DevTools (F12) to:
- Inspect components with React DevTools
- Check console for errors
- View network requests

### Check Performance
Open Chrome Performance tab to see:
- Frame rate
- Component rendering time
- Animation smoothness

## 🚢 Production Build

When ready to deploy:
```bash
npm run build
```

Creates optimized `build/` folder ready for hosting.

## 🐛 Troubleshooting

### Port 3000 Already in Use?
```bash
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies Won't Install?
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
```

### Changes Not Showing?
1. Save the file
2. Wait 2-3 seconds for compilation
3. Refresh browser (Ctrl+R)
4. Check console for errors (F12)

### Styles Not Applied?
1. Check file paths are correct
2. Verify CSS file is imported
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart dev server (Ctrl+C, then `npm start`)

## 📚 Next Steps

1. **Implement Notepad Features** ✓ (Already functional!)
2. **Add Chat AI Integration** (Gemini API)
3. **Create TicTacToe Game Logic**
4. **Integrate Camera Feed**
5. **Build Calculator Functions**
6. **Add Voice Recognition**
7. **Connect to Nova AI Server**
8. **Deploy to Production**

## 💡 Architecture Overview

```
App.jsx (Main Container)
├── NovaCore (Voice-Reactive Interface)
├── ModernChat (Chat System)
│   └── FloatingChatButton (Trigger)
├── SearchWidget
├── NewsWidget
├── NotepadWidget ✓ (Functional)
├── TicTacToeWidget
├── CameraWidget
├── CalculatorWidget
├── ObjectIdentificationWidget
├── TaskWidget
└── AIEyeWidget
```

## 🎯 Widget Details

### Notepad Widget (FULLY FUNCTIONAL)
- ✅ Create new notes
- ✅ Edit note titles
- ✅ Edit note content
- ✅ Delete notes
- ✅ List all notes
- ✅ Auto-date notes

**How to use:**
1. Click the "+" button to create a new note
2. Click on a note to select it
3. Click the title to edit it
4. Edit content in the textarea
5. Click the trash icon to delete

### Chat Widget (PARTIALLY FUNCTIONAL)
- ✅ Send messages
- ✅ View chat history
- ✅ Typing indicator
- ✅ Floating button toggle
- ⏳ AI responses (needs API key)

## 🔗 Useful Resources

- [React 18 Docs](https://react.dev)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Axios Docs](https://axios-http.com/)

## 📞 Support

For issues or questions:
1. Check the full [README.md](README.md)
2. Look for error messages in browser console (F12)
3. Review the troubleshooting section above

## 🎉 Success Checklist

- [ ] Ran `npm install`
- [ ] Ran `npm start`
- [ ] Browser opened at localhost:3000
- [ ] See NOVA core in center
- [ ] See Search widget (top-left, cyan)
- [ ] See News widget (top-right, orange)
- [ ] See Notepad widget (left-center, green)
- [ ] Notepad creates new notes
- [ ] Chat button appears (bottom-right)

**If all checked, you're ready to develop! 🚀**

---

**Last Updated**: November 2024
**Status**: Ready for Development
**Version**: React 18.2.0
