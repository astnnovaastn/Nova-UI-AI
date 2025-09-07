@echo off
echo Setting up Astra AI with Python 3.12...
echo.

REM Navigate to project directory
cd /d "C:\Users\afian\OneDrive\Desktop\Astra_ai"

REM Remove old virtual environment
echo Removing old virtual environment...
rmdir /s /q .venv 2>nul

REM Create new virtual environment with Python 3.12
echo Creating new virtual environment with Python 3.12...
C:\Python312\python.exe -m venv .venv

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Verify Python version
echo Checking Python version...
python --version

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install core dependencies
echo Installing core dependencies...
pip install groq python-dotenv requests numpy sqlalchemy psutil python-dateutil colorama rich flask flask-cors watchdog

REM Test groq installation
echo Testing Groq installation...
python -c "import groq; print('✅ Groq version:', groq.__version__); print('✅ Client available:', hasattr(groq, 'Client'))"

echo.
echo ✅ Setup complete! You can now run:
echo python astra_ai/core/nova_ai.py --mode terminal --api-key "your_groq_api_key"
echo.
pause
