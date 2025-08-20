@echo off
echo Checking for existing processes on port 8787...

REM Find and kill existing process on port 8787
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8787') do (
    if not "%%a"=="0" (
        echo Found existing process on port 8787: %%a
        echo Killing existing process...
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo Port 8787 cleared
echo Starting backend server...
npm run dev
