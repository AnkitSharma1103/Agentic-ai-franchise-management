from fastapi import APIRouter
from pydantic import BaseModel

auth_router = APIRouter(prefix="/api/v1/auth", tags=["Salon 4-Role Auth"])

SALON_ROLES = {
    "COMPANY_OWNER": {"title": "Salon Brand Owner", "route": "/dashboard"},
    "FRANCHISE_OWNER": {"title": "Salon Franchise Owner", "route": "/dashboard"},
    "MANAGER": {"title": "Salon Branch Manager", "route": "/manager-dashboard"},
    "STAFF": {"title": "Salon Stylist / Staff", "route": "/employees"},
}


class LoginInput(BaseModel):
    email: str
    role: str = "FRANCHISE_OWNER"


@auth_router.get("/roles")
def get_roles():
    return {"niche": "Salon Franchise", "roles": SALON_ROLES}


@auth_router.post("/login")
def salon_login(data: LoginInput):
    role_key = data.role.upper() if data.role.upper() in SALON_ROLES else "FRANCHISE_OWNER"
    return {
        "token": f"salon-jwt-{role_key.lower()}",
        "user": {
            "email": data.email,
            "role": role_key,
            "title": SALON_ROLES[role_key]["title"],
            "redirect_to": SALON_ROLES[role_key]["route"],
        },
    }