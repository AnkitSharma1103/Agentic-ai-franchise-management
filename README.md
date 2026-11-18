@'
# Agentic AI for Franchise Management System with Performance Monitoring Assistance

> **Infosys Springboard Internship Project**

An **Agentic AI-powered Franchise Management & Performance Monitoring Platform** built for niche businesses (demonstrated with **Salon Franchises**). It combines a multi-role React web portal with a FastAPI + Machine Learning + Google Gemini backend to track branch operations, forecast sales, detect revenue anomalies, calculate staff payroll, and answer owner queries via an interactive AI Chatbot.

## Repository Structure

```text
Agentic-ai-franchise-management/
├── .gitignore
├── README.md
├── start_backend.bat         # 1-click Windows launcher for FastAPI + AI Backend
├── start_frontend.bat        # 1-click Windows launcher for React Vite Frontend
├── backend/
│   ├── .env.example          # Environment variable template (GEMINI_API_KEY)
│   ├── __init__.py
│   ├── agents.py             # ML Sales Anomaly, Payroll Agent & Gemini Chatbot
│   ├── auth.py               # 4-Role Authentication API
│   ├── main.py               # FastAPI server entrypoint
│   └── requirements.txt
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        └── pages/AIAgents/AiAgents.jsx

Milestone 1 — Completed Work
Monorepo & GitHub Setup: Structured frontend/ (React 18 + Vite + Tailwind CSS + Recharts) and backend/ (FastAPI + Python) with .gitignore, .env.example templates, and 1-click launch scripts.

4-Role Authentication & Salon Portal: Implemented Brand/Company Owner, Franchise Owner, Store Manager, and Staff/Worker login flows alongside multi-branch Salon demo dashboards (Branches, Sales, Employees, Inventory, Customers, Appointments).

FastAPI Backend & 4-Role Auth API: Built modular /api/v1 REST endpoints with interactive Swagger documentation (/docs).

2 Live AI/ML Agents + Chatbot:

AI Sales Analyst (Scikit-Learn): Linear Regression next-day revenue forecasting and >20% drop anomaly detection.

AI Salon Payroll Agent: Deterministic monthly salary calculation using attendance ratios and performance bonuses.

Gemini-Powered AI Chatbot (/api/v1/ai/chat): Integrated Google Gemini (gemini-2.5-flash) tool-calling directly into the frontend AI Agents page (/ai-agents).
