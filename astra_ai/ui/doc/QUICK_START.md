# 🚀 Quick Start Guide

## Step 1: Install Dependencies

### Install Python Dependencies
```bash
cd src\backend
pip install -r requirements.txt
cd ..\..
```

### Install Node Dependencies
```bash
npm install
```

## Step 2: Run the Application

### One-Command Startup (Easiest)
Double-click `START_NOVA.bat` or run:
```bash
npm start
```

This automatically starts:
- ✅ Nova AI Backend Server (Port 5000)
- ✅ React UI (Port 3002)

## Step 3: Access the App

Open your browser and go to:
```
http://localhost:3002
```

## 🆘 Troubleshooting

### Error: "Failed to fetch"
✅ Make sure both services are running (check the terminal output)
✅ Verify port 5000 is not blocked by firewall
✅ Check backend terminal for error messages

### Error: Python not found
✅ Update the Python path in `package.json` line 19:
```json
"server": "cd src/backend && \"YOUR_PYTHON_PATH\" server.py"
```

### Error: Missing packages
```bash
# Python packages
cd src\backend
pip install -r requirements.txt

# Node packages
npm install
```

## 📖 Full Documentation

For complete setup instructions, see [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
