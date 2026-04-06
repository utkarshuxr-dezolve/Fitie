# INTEGRATIONS

## Database

| Service | Details |
|---|---|
| **MongoDB** | Async via `motor` 3.3.1 / `pymongo` 4.5.0 |
| **Connection Source** | `MONGO_URL` and `DB_NAME` environment variables |
| **Collections** | `users`, `exercises`, `workouts`, `workout_plans`, `meals`, `foods`, `weight_logs`, `health_reports` |
| **Indexes** | `users.email` -- unique (created on startup) |

Backend (`backend/server.py`):
- All DB operations are async using `motor.motor_asyncio.AsyncIOMotorClient`
- Seed functions run on startup to populate default exercises (20), foods (18), and workout plans (3)

---

## Authentication

| Aspect | Details |
|---|---|
| **Method** | Custom JWT (HS256 algorithm) |
| **Secret** | `JWT_SECRET` environment variable |
| **Access Token** | 60-minute expiry, stored in cookie (`httponly`, `samesite=lax`, `secure=false`) AND in `Authorization: Bearer` header (frontend sends via Bearer) |
| **Refresh Token** | 7-day expiry, cookie-based |
| **Password Hashing** | `bcrypt` with salt |
| **Admin Account** | Seeded on startup; email from `ADMIN_EMAIL` env var (default `admin@fitie.com`), password from `ADMIN_PASSWORD` env var (default `admin123`) |
| **Token Storage (Frontend)** | `AsyncStorage` key `token` (set after login/register from response JSON `token` field) |

There is **no OAuth provider**. Auth is purely email/password with self-issued JWTs. Cookie auth and Bearer token auth are both accepted by the backend, but the frontend exclusively uses `Authorization: Bearer`.

---

## External APIs / HTTP Endpoints

### AI Chat (OpenAI via LiteLLM)

| Field | Details |
|---|---|
| **Provider** | Emergent Integrations LLM proxy (`emergentintegrations.llm.chat.LlmChat`) |
| **Model** | `gpt-4o-mini` (OpenAI) |
| **API Key** | `EMERGENT_LLM_KEY` environment variable |
| **Session IDs** | Format: `fitie-{user_id}-{context}` |
| **System Prompts** | Four contexts: `general`, `workout`, `nutrition`, `health` |
| **Fallback** | If the LLM call fails, hardcoded fallback responses are returned per context |
| **Word Limit** | System prompts instruct the model to keep responses under 150 words |

### Payments (Stripe)

| Field | Details |
|---|---|
| **Library** | stripe 14.4.1 |
| **Usage** | Imported but **no Stripe endpoints or logic found** in `server.py`. The dependency is present but not yet wired into any route. |

### AWS S3 (boto3)

| Field | Details |
|---|---|
| **Library** | boto3 1.42.75 |
| **Usage** | Installed but **no S3 client or buckets configured** in `server.py`. S3-related config references found in `emergent.yml` and `emergent.yml` but no active integration in application code yet. |

### Google AI / Gemini

| Field | Details |
|---|---|
| **Libraries** | google-generativeai, google-genai, google-ai-generativelanguage |
| **Usage** | **Installed but not referenced** in `server.py` or any frontend file. SDK available but not wired up. |

### Machine/Equipment Scan

| Field | Details |
|---|---|
| **Endpoint** | `POST /api/scan/detect` |
| **Implementation** | Simulated -- returns a random entry from a hardcoded list of 6 machine types |
| **Camera** | `expo-camera` (^55.0.13) is installed on frontend but **no camera capture or image upload** is wired to the scan endpoint in the current source files |
| **Future intent** | Placeholder for real equipment detection via camera |

---

## CORS

| Setting | Value |
|---|---|
| `allow_origins` | `["*"]` |
| `allow_credentials` | `True` |
| `allow_methods` | `["*"]` |
| `allow_headers` | `["*"]` |

CORS is wide open (all origins, methods, headers) with credentials allowed.

---

## Full API Endpoint Inventory

All routes share `POST` prefix `/api`. Authentication required unless noted.

| Method | Path | Auth? | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | User registration + issue tokens |
| POST | `/api/auth/login` | No | User login + issue tokens |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/logout` | No | Clear auth cookies |
| PUT | `/api/user/profile` | Yes | Update profile |
| GET | `/api/user/profile` | Yes | Get profile |
| GET | `/api/exercises` | No | List exercises (filter by muscle_group/equipment) |
| GET | `/api/exercises/{id}` | No | Get single exercise |
| GET | `/api/muscle-groups` | No | Distinct muscle groups |
| GET | `/api/equipment` | No | Distinct equipment types |
| POST | `/api/workouts/start` | Yes | Create a workout session |
| POST | `/api/workouts/{id}/complete` | Yes | Complete workout (+streak update) |
| GET | `/api/workouts/history` | Yes | Completed workouts |
| GET | `/api/workouts/active` | Yes | Current active workout |
| GET | `/api/workout-plans` | Yes | Default + user workout plans |
| POST | `/api/meals` | Yes | Log a meal |
| GET | `/api/meals/today` | Yes | Today's meals + calorie totals |
| GET | `/api/meals/history` | Yes | Meal history (default 7 days) |
| GET | `/api/foods/search` | No | Search foods by name (regex) |
| POST | `/api/health/report` | Yes | Submit health report (simulated analysis) |
| GET | `/api/health/reports` | Yes | User's health reports |
| POST | `/api/progress/weight` | Yes | Log weight (+ update user profile) |
| GET | `/api/progress/weight` | Yes | Weight history (default 30 days) |
| GET | `/api/progress/stats` | Yes | Dashboard stats summary |
| POST | `/api/ai/chat` | Yes | AI fitness chat (GPT-4o-mini) |
| POST | `/api/scan/detect` | Yes | Simulated equipment detection |

---

## Frontend Backend Connection

| Config | Value |
|---|---|
| **Env Var** | `EXPO_PUBLIC_BACKEND_URL` |
| **Client** | Axios instance with base URL `${EXPO_PUBLIC_BACKEND_URL}/api` |
| **Timeout** | 15 seconds |
| **Auth Interceptor** | Reads token from AsyncStorage, attaches as `Authorization: Bearer <token>` |
| **Modules** | `authAPI`, `userAPI`, `exerciseAPI`, `workoutAPI`, `nutritionAPI`, `healthAPI`, `progressAPI`, `aiAPI`, `scanAPI` |

---

## Environment Variables

**Required at runtime:**
- `MONGO_URL` -- MongoDB connection string
- `DB_NAME` -- MongoDB database name
- `JWT_SECRET` -- JWT signing secret

**Optional:**
- `EXPO_PUBLIC_BACKEND_URL` -- Backend base URL (used by frontend and test conftest)
- `EMERGENT_LLM_KEY` -- API key for LLM/Chat integration
- `ADMIN_EMAIL` -- Admin seed email (default: `admin@fitie.com`)
- `ADMIN_PASSWORD` -- Admin seed password (default: `admin123`)

---

## Summary of Actual vs Planned Integrations

| Status | Integration |
|---|---|
| ACTIVE | MongoDB (async motor) |
| ACTIVE | JWT auth (self-signed HS256) |
| ACTIVE | OpenAI GPT-4o-mini via Emergent Integrations LLM proxy |
| PLANNED/UNUSED | Stripe (package installed, no endpoints) |
| PLANNED/UNUSED | AWS S3 / boto3 (package installed, no usage) |
| PLANNED/UNUSED | Google Gemini AI (packages installed, no usage) |
| PLANNED/UNUSED | Camera-based equipment scanning (expo-camera installed, scan endpoint is simulated) |
