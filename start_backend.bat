@echo off
cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
echo Starting FastAPI + AI Backend on http://localhost:8000/docs ...
uvicorn main:app --reload --port 8000
pause