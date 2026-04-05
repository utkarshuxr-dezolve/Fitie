from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        user["id"] = user_id
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# App setup
app = FastAPI()
api = APIRouter(prefix="/api")

# ─── MODELS ───
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str

class LoginInput(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[str] = None
    activity_level: Optional[str] = None

class MealInput(BaseModel):
    food_name: str
    calories: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    meal_type: str = "snack"
    serving_size: Optional[str] = None

class WorkoutInput(BaseModel):
    exercise_ids: List[str]
    plan_name: Optional[str] = None

class WorkoutCompleteInput(BaseModel):
    duration_minutes: int
    calories_burned: float = 0
    notes: Optional[str] = None

class WeightLogInput(BaseModel):
    weight: float
    date: Optional[str] = None

class HealthReportInput(BaseModel):
    report_type: str
    data: dict

class AIChatInput(BaseModel):
    message: str
    context: Optional[str] = "general"

# ─── AUTH ENDPOINTS ───
@api.post("/auth/register")
async def register(inp: RegisterInput, response: Response):
    email = inp.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    hashed = hash_password(inp.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": inp.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "age": None, "weight": None, "height": None,
        "goal": "general_fitness",
        "activity_level": "moderate",
        "streak": 0, "last_active": None
    }
    result = await db.users.insert_one(user_doc)
    uid = str(result.inserted_id)
    at = create_access_token(uid, email)
    rt = create_refresh_token(uid)
    response.set_cookie("access_token", at, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie("refresh_token", rt, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": email, "name": inp.name, "token": at}

@api.post("/auth/login")
async def login(inp: LoginInput, response: Response):
    email = inp.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    uid = str(user["_id"])
    at = create_access_token(uid, email)
    rt = create_refresh_token(uid)
    response.set_cookie("access_token", at, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie("refresh_token", rt, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": email, "name": user.get("name", ""), "token": at}

@api.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

# ─── USER PROFILE ───
@api.put("/user/profile")
async def update_profile(inp: UserProfileUpdate, request: Request):
    user = await get_current_user(request)
    update = {k: v for k, v in inp.dict().items() if v is not None}
    if update:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])}, {"password_hash": 0})
    updated_id = str(updated.pop("_id"))
    updated["id"] = updated_id
    return updated

@api.get("/user/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    return user

# ─── EXERCISES ───
@api.get("/exercises")
async def get_exercises(muscle_group: Optional[str] = None, equipment: Optional[str] = None):
    query = {}
    if muscle_group:
        query["muscle_group"] = muscle_group
    if equipment:
        query["equipment"] = equipment
    exercises = await db.exercises.find(query, {"_id": 0}).to_list(200)
    return exercises

@api.get("/exercises/{exercise_id}")
async def get_exercise(exercise_id: str):
    ex = await db.exercises.find_one({"id": exercise_id}, {"_id": 0})
    if not ex:
        raise HTTPException(404, "Exercise not found")
    return ex

@api.get("/muscle-groups")
async def get_muscle_groups():
    groups = await db.exercises.distinct("muscle_group")
    return groups

@api.get("/equipment")
async def get_equipment():
    equip = await db.exercises.distinct("equipment")
    return equip

# ─── WORKOUTS ───
@api.post("/workouts/start")
async def start_workout(inp: WorkoutInput, request: Request):
    user = await get_current_user(request)
    exercises = []
    for eid in inp.exercise_ids:
        ex = await db.exercises.find_one({"id": eid}, {"_id": 0})
        if ex:
            exercises.append(ex)
    workout = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "exercises": exercises,
        "plan_name": inp.plan_name or "Custom Workout",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "duration_minutes": 0,
        "calories_burned": 0,
        "status": "active"
    }
    await db.workouts.insert_one(workout)
    workout.pop("_id", None)
    return workout

@api.post("/workouts/{workout_id}/complete")
async def complete_workout(workout_id: str, inp: WorkoutCompleteInput, request: Request):
    user = await get_current_user(request)
    result = await db.workouts.find_one_and_update(
        {"id": workout_id, "user_id": user["id"]},
        {"$set": {
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": inp.duration_minutes,
            "calories_burned": inp.calories_burned,
            "status": "completed",
            "notes": inp.notes
        }},
        return_document=True
    )
    if not result:
        raise HTTPException(404, "Workout not found")
    # Update streak
    today = datetime.now(timezone.utc).date().isoformat()
    user_data = await db.users.find_one({"_id": ObjectId(user["id"])})
    last_active = user_data.get("last_active")
    streak = user_data.get("streak", 0)
    if last_active != today:
        yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
        if last_active == yesterday:
            streak += 1
        else:
            streak = 1
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"streak": streak, "last_active": today}})
    result.pop("_id", None)
    return result

@api.get("/workouts/history")
async def get_workout_history(request: Request, limit: int = 20):
    user = await get_current_user(request)
    workouts = await db.workouts.find(
        {"user_id": user["id"], "status": "completed"},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(limit)
    return workouts

@api.get("/workouts/active")
async def get_active_workout(request: Request):
    user = await get_current_user(request)
    workout = await db.workouts.find_one(
        {"user_id": user["id"], "status": "active"},
        {"_id": 0}
    )
    return workout

# ─── WORKOUT PLANS ───
@api.get("/workout-plans")
async def get_workout_plans(request: Request):
    user = await get_current_user(request)
    plans = await db.workout_plans.find(
        {"$or": [{"user_id": user["id"]}, {"is_default": True}]},
        {"_id": 0}
    ).to_list(50)
    return plans

# ─── NUTRITION / MEALS ───
@api.post("/meals")
async def log_meal(inp: MealInput, request: Request):
    user = await get_current_user(request)
    meal = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "food_name": inp.food_name,
        "calories": inp.calories,
        "protein": inp.protein,
        "carbs": inp.carbs,
        "fat": inp.fat,
        "meal_type": inp.meal_type,
        "serving_size": inp.serving_size,
        "logged_at": datetime.now(timezone.utc).isoformat(),
        "date": datetime.now(timezone.utc).date().isoformat()
    }
    await db.meals.insert_one(meal)
    meal.pop("_id", None)
    return meal

@api.get("/meals/today")
async def get_todays_meals(request: Request):
    user = await get_current_user(request)
    today = datetime.now(timezone.utc).date().isoformat()
    meals = await db.meals.find(
        {"user_id": user["id"], "date": today},
        {"_id": 0}
    ).to_list(100)
    totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    for m in meals:
        totals["calories"] += m.get("calories", 0)
        totals["protein"] += m.get("protein", 0)
        totals["carbs"] += m.get("carbs", 0)
        totals["fat"] += m.get("fat", 0)
    return {"meals": meals, "totals": totals, "date": today}

@api.get("/meals/history")
async def get_meal_history(request: Request, days: int = 7):
    user = await get_current_user(request)
    start = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    meals = await db.meals.find(
        {"user_id": user["id"], "date": {"$gte": start}},
        {"_id": 0}
    ).sort("logged_at", -1).to_list(500)
    return meals

@api.get("/foods/search")
async def search_foods(q: str):
    foods = await db.foods.find(
        {"name": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).to_list(20)
    return foods

# ─── HEALTH ───
@api.post("/health/report")
async def upload_health_report(inp: HealthReportInput, request: Request):
    user = await get_current_user(request)
    # Simulate AI analysis
    insights = generate_health_insights(inp.report_type, inp.data)
    report = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "report_type": inp.report_type,
        "data": inp.data,
        "insights": insights,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.health_reports.insert_one(report)
    report.pop("_id", None)
    return report

@api.get("/health/reports")
async def get_health_reports(request: Request):
    user = await get_current_user(request)
    reports = await db.health_reports.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return reports

def generate_health_insights(report_type: str, data: dict) -> dict:
    """Simulate AI health insights"""
    insights = {
        "summary": "Your health metrics are within normal range.",
        "key_metrics": [],
        "risk_indicators": [],
        "recommendations": []
    }
    if report_type == "blood_work":
        insights["key_metrics"] = [
            {"name": "Hemoglobin", "value": data.get("hemoglobin", "14.2 g/dL"), "status": "normal"},
            {"name": "Cholesterol", "value": data.get("cholesterol", "185 mg/dL"), "status": "normal"},
            {"name": "Blood Sugar", "value": data.get("blood_sugar", "95 mg/dL"), "status": "normal"},
            {"name": "Vitamin D", "value": data.get("vitamin_d", "28 ng/mL"), "status": "low"}
        ]
        insights["risk_indicators"] = [{"indicator": "Vitamin D slightly low", "severity": "mild"}]
        insights["recommendations"] = [
            "Consider Vitamin D supplementation (1000-2000 IU daily)",
            "Increase sun exposure (15 min daily)",
            "Include fatty fish in your diet"
        ]
    elif report_type == "general_checkup":
        insights["key_metrics"] = [
            {"name": "BMI", "value": data.get("bmi", "23.5"), "status": "normal"},
            {"name": "Blood Pressure", "value": data.get("bp", "120/80"), "status": "normal"},
            {"name": "Heart Rate", "value": data.get("hr", "72 bpm"), "status": "normal"}
        ]
        insights["recommendations"] = [
            "Maintain current exercise routine",
            "Stay hydrated with 8-10 glasses of water daily",
            "Schedule follow-up in 6 months"
        ]
    else:
        insights["summary"] = "Report analyzed. Results appear normal."
        insights["recommendations"] = ["Consult with your healthcare provider for detailed interpretation."]
    return insights

# ─── PROGRESS ───
@api.post("/progress/weight")
async def log_weight(inp: WeightLogInput, request: Request):
    user = await get_current_user(request)
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "weight": inp.weight,
        "date": inp.date or datetime.now(timezone.utc).date().isoformat(),
        "logged_at": datetime.now(timezone.utc).isoformat()
    }
    await db.weight_logs.insert_one(entry)
    entry.pop("_id", None)
    # Also update user profile weight
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"weight": inp.weight}})
    return entry

@api.get("/progress/weight")
async def get_weight_history(request: Request, days: int = 30):
    user = await get_current_user(request)
    start = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    entries = await db.weight_logs.find(
        {"user_id": user["id"], "date": {"$gte": start}},
        {"_id": 0}
    ).sort("date", 1).to_list(100)
    return entries

@api.get("/progress/stats")
async def get_progress_stats(request: Request):
    user = await get_current_user(request)
    uid = user["id"]
    today = datetime.now(timezone.utc).date().isoformat()
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).date().isoformat()

    # Workout stats
    total_workouts = await db.workouts.count_documents({"user_id": uid, "status": "completed"})
    week_workouts = await db.workouts.count_documents({"user_id": uid, "status": "completed", "completed_at": {"$gte": week_start}})
    
    # Today's nutrition
    today_meals = await db.meals.find({"user_id": uid, "date": today}).to_list(100)
    today_cals = sum(m.get("calories", 0) for m in today_meals)
    
    # Streak
    streak = user.get("streak", 0)
    
    # Recent weight
    latest_weight = await db.weight_logs.find_one(
        {"user_id": uid}, sort=[("date", -1)], projection={"_id": 0}
    )

    return {
        "total_workouts": total_workouts,
        "week_workouts": week_workouts,
        "today_calories": round(today_cals),
        "streak": streak,
        "current_weight": latest_weight.get("weight") if latest_weight else user.get("weight"),
        "goal": user.get("goal", "general_fitness")
    }

# ─── AI CHAT (GPT-4o-mini) ───
@api.post("/ai/chat")
async def ai_chat(inp: AIChatInput, request: Request):
    user = await get_current_user(request)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        
        system_msgs = {
            "general": "You are Fitie, a friendly AI fitness companion. Give concise, practical fitness advice. Keep responses under 150 words.",
            "workout": "You are Fitie's workout advisor. Suggest exercises, form tips, and workout plans. Keep responses under 150 words.",
            "nutrition": "You are Fitie's nutrition coach. Suggest meals, track macros, and give dietary advice. Keep responses under 150 words.",
            "health": "You are Fitie's health advisor. Interpret health data and give wellness recommendations. Keep responses under 150 words."
        }
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"fitie-{user['_id']}-{inp.context}",
            system_message=system_msgs.get(inp.context, system_msgs["general"])
        )
        chat.with_model("openai", "gpt-4o-mini")
        
        msg = UserMessage(text=inp.message)
        response = await chat.send_message(msg)
        return {"response": response, "context": inp.context}
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        # Fallback responses
        fallbacks = {
            "workout": "Try starting with compound exercises like squats, deadlifts, and bench press. Aim for 3 sets of 8-12 reps.",
            "nutrition": "Focus on protein-rich foods, complex carbs, and healthy fats. Aim for balanced meals every 3-4 hours.",
            "health": "Regular exercise, balanced nutrition, and adequate sleep are the pillars of good health.",
            "general": "Stay consistent with your workouts and nutrition. Small daily improvements lead to big results!"
        }
        return {"response": fallbacks.get(inp.context, fallbacks["general"]), "context": inp.context}

# ─── SCAN MACHINE (Simulated) ───
@api.post("/scan/detect")
async def detect_machine(request: Request):
    """Simulate machine/equipment detection from camera"""
    await get_current_user(request)
    # Simulate detection - return a random equipment
    import random
    machines = [
        {"name": "Lat Pulldown Machine", "equipment": "lat_pulldown", "confidence": 0.92},
        {"name": "Cable Crossover Machine", "equipment": "cable_machine", "confidence": 0.88},
        {"name": "Leg Press Machine", "equipment": "leg_press", "confidence": 0.95},
        {"name": "Smith Machine", "equipment": "smith_machine", "confidence": 0.90},
        {"name": "Chest Press Machine", "equipment": "chest_press", "confidence": 0.87},
        {"name": "Rowing Machine", "equipment": "rowing_machine", "confidence": 0.93},
    ]
    detected = random.choice(machines)
    # Get exercises for this equipment
    exercises = await db.exercises.find(
        {"equipment": detected["equipment"]},
        {"_id": 0}
    ).to_list(10)
    return {"detected": detected, "exercises": exercises}

# ─── SEED DATA ───
async def seed_exercises():
    count = await db.exercises.count_documents({})
    if count > 0:
        return
    exercises = [
        # Chest
        {"id": "bench-press", "name": "Bench Press", "muscle_group": "chest", "equipment": "barbell", "difficulty": "intermediate", "description": "Classic chest builder", "instructions": ["Lie on bench", "Grip bar shoulder-width", "Lower to chest", "Press up"], "calories_per_min": 8},
        {"id": "chest-press-machine", "name": "Chest Press Machine", "muscle_group": "chest", "equipment": "chest_press", "difficulty": "beginner", "description": "Machine-guided chest press", "instructions": ["Adjust seat height", "Grip handles", "Push forward", "Control return"], "calories_per_min": 6},
        {"id": "cable-fly", "name": "Cable Fly", "muscle_group": "chest", "equipment": "cable_machine", "difficulty": "intermediate", "description": "Cable isolation for chest", "instructions": ["Set pulleys high", "Step forward", "Bring hands together", "Squeeze chest"], "calories_per_min": 5},
        {"id": "push-ups", "name": "Push Ups", "muscle_group": "chest", "equipment": "bodyweight", "difficulty": "beginner", "description": "Bodyweight chest exercise", "instructions": ["Plank position", "Lower chest to floor", "Push back up", "Keep core tight"], "calories_per_min": 7},
        # Back
        {"id": "lat-pulldown", "name": "Lat Pulldown", "muscle_group": "back", "equipment": "lat_pulldown", "difficulty": "beginner", "description": "Wide grip pulldown for lats", "instructions": ["Grip bar wide", "Pull to chest", "Squeeze lats", "Control return"], "calories_per_min": 6},
        {"id": "seated-row", "name": "Seated Cable Row", "muscle_group": "back", "equipment": "cable_machine", "difficulty": "beginner", "description": "Seated row for mid-back", "instructions": ["Sit upright", "Pull handle to torso", "Squeeze shoulder blades", "Return slowly"], "calories_per_min": 6},
        {"id": "deadlift", "name": "Deadlift", "muscle_group": "back", "equipment": "barbell", "difficulty": "advanced", "description": "Full body posterior chain", "instructions": ["Stand over bar", "Grip bar", "Drive through heels", "Stand tall"], "calories_per_min": 10},
        {"id": "pull-ups", "name": "Pull Ups", "muscle_group": "back", "equipment": "bodyweight", "difficulty": "intermediate", "description": "Bodyweight back exercise", "instructions": ["Grip bar overhand", "Pull chin over bar", "Lower slowly", "Full extension"], "calories_per_min": 8},
        # Legs
        {"id": "squat", "name": "Barbell Squat", "muscle_group": "legs", "equipment": "barbell", "difficulty": "intermediate", "description": "King of leg exercises", "instructions": ["Bar on traps", "Feet shoulder-width", "Squat to parallel", "Drive up"], "calories_per_min": 9},
        {"id": "leg-press", "name": "Leg Press", "muscle_group": "legs", "equipment": "leg_press", "difficulty": "beginner", "description": "Machine-guided leg press", "instructions": ["Sit in machine", "Feet shoulder-width", "Lower weight", "Press up"], "calories_per_min": 7},
        {"id": "lunges", "name": "Walking Lunges", "muscle_group": "legs", "equipment": "bodyweight", "difficulty": "beginner", "description": "Walking lunge movement", "instructions": ["Step forward", "Lower back knee", "Push through front heel", "Alternate legs"], "calories_per_min": 7},
        {"id": "leg-curl", "name": "Leg Curl", "muscle_group": "legs", "equipment": "machine", "difficulty": "beginner", "description": "Hamstring isolation", "instructions": ["Lie face down", "Curl weight up", "Squeeze hamstrings", "Lower slowly"], "calories_per_min": 5},
        # Shoulders
        {"id": "overhead-press", "name": "Overhead Press", "muscle_group": "shoulders", "equipment": "barbell", "difficulty": "intermediate", "description": "Standing overhead press", "instructions": ["Bar at shoulders", "Press overhead", "Lock out arms", "Lower controlled"], "calories_per_min": 7},
        {"id": "lateral-raise", "name": "Lateral Raise", "muscle_group": "shoulders", "equipment": "dumbbell", "difficulty": "beginner", "description": "Side delt isolation", "instructions": ["Arms at sides", "Raise to shoulder height", "Control descent", "Light weight"], "calories_per_min": 4},
        {"id": "face-pull", "name": "Face Pull", "muscle_group": "shoulders", "equipment": "cable_machine", "difficulty": "beginner", "description": "Rear delt and rotator cuff", "instructions": ["Rope at face height", "Pull to face", "Spread rope apart", "Squeeze rear delts"], "calories_per_min": 4},
        # Arms
        {"id": "bicep-curl", "name": "Bicep Curl", "muscle_group": "arms", "equipment": "dumbbell", "difficulty": "beginner", "description": "Classic bicep builder", "instructions": ["Stand tall", "Curl weights up", "Squeeze biceps", "Lower slowly"], "calories_per_min": 4},
        {"id": "tricep-pushdown", "name": "Tricep Pushdown", "muscle_group": "arms", "equipment": "cable_machine", "difficulty": "beginner", "description": "Cable tricep isolation", "instructions": ["Grip bar overhand", "Push down", "Squeeze triceps", "Control return"], "calories_per_min": 4},
        {"id": "hammer-curl", "name": "Hammer Curl", "muscle_group": "arms", "equipment": "dumbbell", "difficulty": "beginner", "description": "Neutral grip curls", "instructions": ["Neutral grip", "Curl up", "Keep elbows still", "Lower controlled"], "calories_per_min": 4},
        # Core
        {"id": "plank", "name": "Plank", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "beginner", "description": "Core stability exercise", "instructions": ["Forearms on ground", "Body straight", "Engage core", "Hold position"], "calories_per_min": 5},
        {"id": "russian-twist", "name": "Russian Twist", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "beginner", "description": "Rotational core exercise", "instructions": ["Sit, lean back slightly", "Feet off floor", "Twist side to side", "Control movement"], "calories_per_min": 6},
        # Smith Machine
        {"id": "smith-squat", "name": "Smith Machine Squat", "muscle_group": "legs", "equipment": "smith_machine", "difficulty": "beginner", "description": "Guided squat on smith", "instructions": ["Bar on traps", "Feet slightly forward", "Squat down", "Press up"], "calories_per_min": 7},
        {"id": "smith-bench", "name": "Smith Machine Bench Press", "muscle_group": "chest", "equipment": "smith_machine", "difficulty": "beginner", "description": "Guided bench press", "instructions": ["Lie on bench", "Unrack bar", "Lower to chest", "Press up"], "calories_per_min": 6},
        # Rowing machine
        {"id": "rowing", "name": "Rowing Machine", "muscle_group": "back", "equipment": "rowing_machine", "difficulty": "beginner", "description": "Full body cardio", "instructions": ["Sit on rower", "Drive with legs", "Pull handle to chest", "Return forward"], "calories_per_min": 10},
    ]
    await db.exercises.insert_many(exercises)
    logger.info(f"Seeded {len(exercises)} exercises")

async def seed_foods():
    count = await db.foods.count_documents({})
    if count > 0:
        return
    foods = [
        {"id": "chicken-breast", "name": "Chicken Breast (100g)", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "category": "protein"},
        {"id": "brown-rice", "name": "Brown Rice (100g)", "calories": 112, "protein": 2.3, "carbs": 24, "fat": 0.8, "category": "carbs"},
        {"id": "broccoli", "name": "Broccoli (100g)", "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "category": "vegetable"},
        {"id": "salmon", "name": "Salmon Fillet (100g)", "calories": 208, "protein": 20, "carbs": 0, "fat": 13, "category": "protein"},
        {"id": "sweet-potato", "name": "Sweet Potato (100g)", "calories": 86, "protein": 1.6, "carbs": 20, "fat": 0.1, "category": "carbs"},
        {"id": "eggs", "name": "Whole Eggs (2 large)", "calories": 143, "protein": 12.6, "carbs": 0.7, "fat": 9.5, "category": "protein"},
        {"id": "oatmeal", "name": "Oatmeal (100g)", "calories": 68, "protein": 2.4, "carbs": 12, "fat": 1.4, "category": "carbs"},
        {"id": "banana", "name": "Banana (1 medium)", "calories": 105, "protein": 1.3, "carbs": 27, "fat": 0.4, "category": "fruit"},
        {"id": "greek-yogurt", "name": "Greek Yogurt (150g)", "calories": 100, "protein": 17, "carbs": 6, "fat": 0.7, "category": "dairy"},
        {"id": "almonds", "name": "Almonds (30g)", "calories": 164, "protein": 6, "carbs": 6, "fat": 14, "category": "nuts"},
        {"id": "avocado", "name": "Avocado (half)", "calories": 160, "protein": 2, "carbs": 9, "fat": 15, "category": "fat"},
        {"id": "spinach", "name": "Spinach (100g)", "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "category": "vegetable"},
        {"id": "whey-protein", "name": "Whey Protein Shake", "calories": 120, "protein": 24, "carbs": 3, "fat": 1, "category": "supplement"},
        {"id": "pasta", "name": "Whole Wheat Pasta (100g)", "calories": 131, "protein": 5.3, "carbs": 27, "fat": 1.2, "category": "carbs"},
        {"id": "tofu", "name": "Tofu (100g)", "calories": 76, "protein": 8, "carbs": 1.9, "fat": 4.8, "category": "protein"},
        {"id": "apple", "name": "Apple (1 medium)", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "category": "fruit"},
        {"id": "tuna", "name": "Tuna Can (100g)", "calories": 116, "protein": 26, "carbs": 0, "fat": 0.8, "category": "protein"},
        {"id": "cottage-cheese", "name": "Cottage Cheese (100g)", "calories": 98, "protein": 11, "carbs": 3.4, "fat": 4.3, "category": "dairy"},
    ]
    await db.foods.insert_many(foods)
    logger.info(f"Seeded {len(foods)} foods")

async def seed_workout_plans():
    count = await db.workout_plans.count_documents({})
    if count > 0:
        return
    plans = [
        {
            "id": "beginner-full-body",
            "name": "Beginner Full Body",
            "description": "Perfect for gym beginners. 3 days/week full body routine.",
            "difficulty": "beginner",
            "duration_weeks": 4,
            "days_per_week": 3,
            "exercises": ["squat", "bench-press", "lat-pulldown", "overhead-press", "plank"],
            "is_default": True
        },
        {
            "id": "push-pull-legs",
            "name": "Push Pull Legs",
            "description": "Classic PPL split for intermediate lifters.",
            "difficulty": "intermediate",
            "duration_weeks": 8,
            "days_per_week": 6,
            "exercises": ["bench-press", "overhead-press", "tricep-pushdown", "deadlift", "lat-pulldown", "bicep-curl", "squat", "leg-press", "leg-curl"],
            "is_default": True
        },
        {
            "id": "home-workout",
            "name": "Home Bodyweight",
            "description": "No equipment needed. Perfect for home workouts.",
            "difficulty": "beginner",
            "duration_weeks": 4,
            "days_per_week": 4,
            "exercises": ["push-ups", "pull-ups", "lunges", "plank", "russian-twist"],
            "is_default": True
        }
    ]
    await db.workout_plans.insert_many(plans)
    logger.info(f"Seeded {len(plans)} workout plans")

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@fitie.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
            "age": None, "weight": None, "height": None,
            "goal": "general_fitness", "activity_level": "moderate",
            "streak": 0, "last_active": None
        })
        logger.info("Admin user seeded")

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_admin()
    await seed_exercises()
    await seed_foods()
    await seed_workout_plans()
    logger.info("Database seeded and indexes created")

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
