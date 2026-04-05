# Fitie - AI-Powered Fitness Companion

## Product Overview
Fitie is an all-in-one fitness companion app that combines workouts, nutrition, health insights, and progress tracking into a unified mobile experience. It acts as a personal trainer, nutrition coach, health interpreter, and behavior companion.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), Expo Router, lucide-react-native icons
- **Backend**: FastAPI (Python), Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o-mini via Emergent LLM Key
- **Auth**: JWT (Bearer token) with bcrypt password hashing

## Core Features

### 1. Authentication
- Email/password registration & login
- JWT token-based auth with Bearer header
- Admin seeding on startup

### 2. Home Dashboard
- Daily overview with calorie count, workout count, streak
- Quick actions (Scan Machine, Start Workout, Log Meal)
- Macro breakdown progress bars
- Recent workouts list

### 3. Activity (Workout System)
- 23 seeded exercises across 7 muscle groups
- Muscle group filtering
- Equipment-based filtering
- 3 preset workout plans (Beginner Full Body, Push Pull Legs, Home Bodyweight)
- Machine scanning (simulated AI detection)
- Active workout tracking with timer
- Workout completion with calorie calculation
- Streak tracking

### 4. Nutrition System
- Meal logging (search from 18 seeded foods or manual entry)
- Daily calorie tracking with visual ring
- Macro breakdown (protein, carbs, fat)
- Meal type categorization (breakfast, lunch, dinner, snack)
- Food search with auto-complete

### 5. Health Intelligence
- Health report upload (Blood Work, General Checkup, Vitamin Panel)
- Simulated AI analysis with insights
- Key metrics display with status indicators
- Risk indicator alerts
- Personalized recommendations

### 6. Progress & Behavior
- Weight logging and trend chart
- Workout history
- Weekly/total workout stats
- Consistency streaks

### 7. User Profile
- Editable profile (name, age, weight, height)
- Goal selection (weight loss, muscle gain, general fitness, endurance, flexibility)
- Activity level setting
- Visual stats summary

## API Endpoints
All endpoints prefixed with `/api`

### Auth
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - Logout

### Exercises & Workouts
- GET `/api/exercises` - List exercises (filter by muscle_group, equipment)
- GET `/api/muscle-groups` - List muscle groups
- GET `/api/equipment` - List equipment types
- GET `/api/workout-plans` - List workout plans
- POST `/api/workouts/start` - Start workout
- POST `/api/workouts/{id}/complete` - Complete workout
- GET `/api/workouts/history` - Workout history
- GET `/api/workouts/active` - Active workout

### Nutrition
- POST `/api/meals` - Log a meal
- GET `/api/meals/today` - Today's meals + totals
- GET `/api/meals/history` - Meal history
- GET `/api/foods/search` - Search foods

### Health
- POST `/api/health/report` - Upload health report
- GET `/api/health/reports` - Get health reports

### Progress
- POST `/api/progress/weight` - Log weight
- GET `/api/progress/weight` - Weight history
- GET `/api/progress/stats` - Progress stats

### AI
- POST `/api/ai/chat` - AI chat (workout, nutrition, health, general)

### Scan
- POST `/api/scan/detect` - Simulated machine detection

## Design System
- **Primary**: #4A7C59 (Muted Olive Green)
- **Background**: #FFFFFF
- **Surface**: #F9FAFB
- **Border**: #E5E7EB
- **Text**: #111827 (main), #6B7280 (muted)
- **Spacing**: 8pt grid (8, 16, 24, 32, 48)
- **Radius**: 8, 12, 16, 24
- **Icons**: lucide-react-native

## MOCKED Features
- Machine scanning (returns simulated detection results)
- Health report AI analysis (pre-generated insights)
- AI chat has fallback responses when API fails

## Monetization Opportunity
- Freemium model: Basic tracking free, Premium for AI coaching, personalized plans, advanced health analysis
- Subscription tiers: $9.99/month for Premium
