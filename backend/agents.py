
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from sklearn.linear_model import LinearRegression

ai_router = APIRouter(prefix="/api/v1/ai", tags=["Salon AI Agents & Chatbot"])

# Basic 7-day sales (INR) for 2 Salon Outlets
SALON_BRANCH_SALES = {
    "Park Street Salon": [22000, 23500, 24000, 25200, 26000, 27500, 28800],
    "Salt Lake Salon": [19000, 20000, 19500, 21000, 20500, 21500, 12000],  # Drop on Day 7
}

# Basic Salon Staff Data
SALON_STAFF = [
    {"name": "Aarav Sharma", "role": "Salon Manager", "base": 30000, "days": 29, "score": 92},
    {"name": "Priya Verma", "role": "Senior Hair Stylist", "base": 24000, "days": 28, "score": 88},
    {"name": "Rohan Das", "role": "Spa Therapist", "base": 18000, "days": 25, "score": 78},
]


class ChatInput(BaseModel):
    prompt: str


def run_salon_sales_ml():
    results = []
    for branch, sales in SALON_BRANCH_SALES.items():
        X = np.arange(1, len(sales) + 1).reshape(-1, 1)
        model = LinearRegression().fit(X, sales)
        forecast = round(float(model.predict([[len(sales) + 1]])[0]), 2)

        avg_prev = float(np.mean(sales[:-1]))
        drop_pct = round(((avg_prev - sales[-1]) / avg_prev) * 100, 1)
        anomaly = drop_pct > 20.0

        results.append({
            "branch": branch,
            "total_7d_revenue_inr": sum(sales),
            "latest_day_inr": sales[-1],
            "ml_next_day_forecast_inr": forecast,
            "anomaly_detected": anomaly,
            "status": f"ANOMALY ALERT ({drop_pct}% drop)" if anomaly else "Healthy Growth",
        })
    return results


def run_salon_payroll_agent():
    results = []
    for s in SALON_STAFF:
        pro_rata = (s["base"] / 30.0) * s["days"]
        bonus = (s["base"] * 0.05) if s["score"] >= 85 else 0.0
        results.append({
            "staff_name": s["name"],
            "role": s["role"],
            "days_present": f"{s['days']}/30",
            "performance_score": s["score"],
            "performance_bonus_inr": round(bonus, 2),
            "net_payout_inr": round(pro_rata + bonus, 2),
        })
    return results


@ai_router.get("/overview")
def salon_ai_overview():
    return {
        "niche": "Salon Franchise",
        "sales_ml": run_salon_sales_ml(),
        "payroll": run_salon_payroll_agent(),
    }


@ai_router.post("/chat")
def salon_chatbot(data: ChatInput):
    sales = run_salon_sales_ml()
    payroll = run_salon_payroll_agent()
    q = data.prompt.lower()

    if any(k in q for k in ["salary", "payroll", "staff", "stylist"]):
        reply = "Salon AI Payroll Agent:\n" + "\n".join(
            f"• {p['staff_name']} ({p['role']}): Attendance {p['days_present']} | Score {p['performance_score']}% -> Net Salary: ₹{p['net_payout_inr']:,}"
            for p in payroll
        )
    else:
        reply = "Salon AI Sales Analyst (Scikit-Learn):\n" + "\n".join(
            f"• {s['branch']}: 7-Day Sales ₹{s['total_7d_revenue_inr']:,} | Next-Day Forecast ₹{s['ml_next_day_forecast_inr']:,} | {s['status']}"
            for s in sales
        )
    return {"reply": reply, "sales_ml": sales, "payroll": payroll}