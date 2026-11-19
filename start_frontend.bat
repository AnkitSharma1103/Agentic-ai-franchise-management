@echo off
cd frontend
if not exist node_modules (
    echo Installing frontend packages...
    call npm install
)
echo Starting React Vite Frontend on http://localhost:5173 ...
call npm run dev
pause