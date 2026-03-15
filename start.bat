@echo off
start cmd /k "cd C:\Users\hunte\OneDrive\Desktop\YT Manager\backend && venv\scripts\activate && uvicorn main:app --reload --port 8000"
start cmd /k "cd frontend && npm run dev"