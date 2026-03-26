# 🚀 ONE-COMMAND STARTUP GUIDE

Get your Astra AI React UI running in seconds!

## ⚡ Quick Start (Choose Your Operating System)

### 🪟 Windows Users

**Option 1: Batch File (Easiest)**
```bash
cd astra_ai\ui
start.bat
```

**Option 2: PowerShell**
```powershell
cd astra_ai\ui
.\start.ps1
```

**Option 3: Command Prompt**
```cmd
cd astra_ai\ui
npm install
npm start
```

---

### 🍎 macOS / 🐧 Linux Users

```bash
cd astra_ai/ui
chmod +x start.sh
./start.sh
```

Or directly:
```bash
cd astra_ai/ui
npm install
npm start
```

---

## 🎯 What Happens After You Run the Command

1. ✅ Checks for Node.js and npm
2. ✅ Installs dependencies (first time only)
3. ✅ Starts the development server
4. ✅ **Automatically opens your browser** at `http://localhost:3000`
5. ✅ You see your fully functional Astra AI React UI

---

## 📋 What You'll See

When the server starts, you'll see:

```
🚀 Your Astra AI React UI is starting...

Compiled successfully!

Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

Your browser will automatically open showing:
- 🎨 NOVA core interface (animated circles in center)
- 💬 Chat system (with floating button)
- 🔍 Search widget (top-left)
- 📰 News widget (top-right)
- 📝 Notepad widget (left side) - **Fully functional!**
- Plus 6 more interactive widgets

---

## 🛠️ Prerequisites

Make sure you have these installed:

- **Node.js** (v16+): [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

Check if installed:
```bash
node --version
npm --version
```

---

## 🔄 Common Commands

Once inside the UI folder (`astra_ai/ui`):

```bash
npm start                # Start development server (auto-opens browser)
npm run build            # Create production build
npm test                 # Run tests
npm cache clean --force  # Clear npm cache (if having issues)
```

---

## 🎨 First-Time Setup (Only Once)

If you run the startup scripts, this is automatic. But if running manually:

```bash
cd astra_ai/ui
npm install              # Install all dependencies
npm start                # Start the server
```

---

## 📂 File Structure

```
astra_ai/ui/
├── start.bat          ← Windows users click this
├── start.ps1          ← PowerShell users run this
├── start.sh           ← Mac/Linux users run this
├── package.json       ← Dependencies & scripts
├── src/
│   ├── App.jsx       ← Main React component
│   └── components/   ← 11 interactive widgets
├── public/
│   └── index.html    ← React mount point
└── README.md         ← Full documentation
```

---

## ✅ Verification Steps

After startup, verify everything is working:

1. **Browser opened automatically?** ✓
2. **Page loads at http://localhost:3000?** ✓
3. **NOVA core visible in center?** ✓ (animated circles)
4. **Widgets appear around edges?** ✓
5. **Notepad opens and creates notes?** ✓ (try it!)
6. **Chat button appears?** ✓ (bottom-right)

If all checked, you're ready to develop! 🎉

---

## 🆘 Troubleshooting

### "npm not found"
→ Install Node.js from https://nodejs.org/

### "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### "Dependencies won't install"
```bash
cd astra_ai/ui
rm -rf node_modules package-lock.json
npm install
```

### "Page doesn't load"
1. Check console for errors (F12)
2. Try hard refresh (Ctrl+Shift+R)
3. Restart the server (Ctrl+C, then npm start)

---

## 📚 Next Steps

Once running:

1. **Explore the UI**
   - Open DevTools (F12)
   - Try the Notepad widget
   - Click the chat button

2. **Read the Documentation**
   - `QUICK_START_REACT.md` - 5-minute guide
   - `WIDGET_IMPLEMENTATION_GUIDE.md` - Feature implementation
   - `astra_ai/ui/README.md` - Complete reference

3. **Start Developing**
   - Edit `src/components/*/` files
   - Changes auto-reload in browser
   - No need to restart the server

4. **Add Your Features**
   - Implement Chat AI (Gemini API)
   - Add Calculator logic
   - Setup voice recognition
   - See `WIDGET_IMPLEMENTATION_GUIDE.md`

---

## 🚢 Production Deployment

When ready to deploy:

```bash
cd astra_ai/ui
npm run build
```

This creates an optimized `build/` folder ready for:
- Netlify
- Vercel
- GitHub Pages
- Your own server

---

## 🎯 Your Astra AI React UI is Ready!

You've got:
- ✅ 11 interactive widgets
- ✅ Professional neon design
- ✅ Smooth animations
- ✅ Full documentation
- ✅ One-command startup

**Ready to launch?** Just run:

### Windows:
```
cd astra_ai\ui && start.bat
```

### Mac/Linux:
```
cd astra_ai/ui && ./start.sh
```

### Or anywhere:
```
cd astra_ai/ui && npm start
```

---

**See you in the browser! 🚀**

For full documentation, see `DOCUMENTATION_INDEX.md`

Last Updated: December 2024
Status: 🟢 Ready to Run
