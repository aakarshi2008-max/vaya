@echo off
setlocal
cd /d "%~dp0"

echo ==========================================================
echo   JULIE Voice RAG - Full Local Stack (HH Goa 2026 Task 2)
echo ==========================================================
echo.

echo [1/3] Starting Unified Python Vector + FastEmbed Service on port 8081...
start "Julie Python Vector Service" cmd /k "cd /d ""%~dp0"" && python -m uvicorn backend.embed_service:app --host 127.0.0.1 --port 8081"

timeout /t 4 /nobreak > nul

echo [2/3] Starting Fastify API on port 8787...
start "Julie Fastify API" cmd /k "cd /d ""%~dp0"" && node server/index.mjs"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Vite Frontend on port 5173...
start "Julie Vite Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo.
echo ==========================================================
echo   All 3 services launched successfully:
echo.
echo   Frontend:    http://localhost:5173
echo   Fastify API: http://localhost:8787/health
echo   Vector & STT: http://localhost:8081/health
echo ==========================================================
echo.
pause
endlocal
