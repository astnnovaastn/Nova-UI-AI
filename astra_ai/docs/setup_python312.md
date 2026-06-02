# Astra AI Setup with Python 3.12 - Complete Guide

## Step 1: Install Python 3.12

1. **Download Python 3.12:**
   - Go to https://www.python.org/downloads/
   - Download Python 3.12.x (latest stable version)
   - Choose "Windows installer (64-bit)" for your system

2. **Install Python 3.12:**
   - Run the installer
   - ✅ **IMPORTANT**: Check "Add Python to PATH"
   - Choose "Customize installation"
   - Check all optional features
   - In Advanced Options, check "Add Python to environment variables"
   - Install to a location like `C:\Python312\`

## Step 2: Remove Current Virtual Environment

```powershell
# Navigate to your project directory
cd "C:\Users\afian\OneDrive\Desktop\Astra_ai"

# Remove the current virtual environment
Remove-Item -Recurse -Force .venv
```

## Step 3: Create New Virtual Environment with Python 3.12

```powershell
# Create new virtual environment with Python 3.12
C:\Python312\python.exe -m venv .venv

# Activate the virtual environment
.venv\Scripts\Activate.ps1

# Verify Python version
python --version
# Should show: Python 3.12.x
```

## Step 4: Install Dependencies

```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Install core dependencies
pip install groq python-dotenv requests numpy sqlalchemy psutil python-dateutil colorama rich flask flask-cors watchdog

# Install additional dependencies from requirements.txt
pip install -r requirements.txt

# Install memory-specific dependencies
pip install -r requirements_memory.txt
```

## Step 5: Test the Installation

```powershell
# Test imports
python -c "import groq; print('Groq version:', groq.__version__); print('Client available:', hasattr(groq, 'Client'))"

# Run the application
python astra_ai/core/nova_ai.py --mode terminal
```

## Step 6: Configure API Key

1. **Create a .env file in the project root:**
```
GROQ_API_KEY=your_actual_groq_api_key_here
```

2. **Or set it as environment variable:**
```powershell
$env:GROQ_API_KEY="your_actual_groq_api_key_here"
```

3. **Or pass it directly when running:**
```powershell
python astra_ai/core/nova_ai.py --mode terminal --api-key "your_actual_groq_api_key_here"
```

## Expected Results

After following these steps, you should see:
- ✅ Real Groq API connection (not mock)
- ✅ Actual AI responses to your inputs
- ✅ All features working properly
- ✅ No compatibility issues

## Troubleshooting

If you encounter issues:
1. Make sure Python 3.12 is in your PATH
2. Verify the virtual environment is activated (you should see `(.venv)` in your prompt)
3. Check that your Groq API key is valid
4. Try running with `--debug` flag for more information
