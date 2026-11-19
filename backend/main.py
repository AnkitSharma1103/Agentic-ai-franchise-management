from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import auth_router
from agents import ai_router

app = FastAPI(title="Salon FranchiseOps Agentic AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ai_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Salon FranchiseOps Agentic AI Backend",
        "docs": "/docs",
    }


@app.get("/api/v1/health")
def health_check():
    return {"status": "online", "niche": "Salon Franchise Management System"}
