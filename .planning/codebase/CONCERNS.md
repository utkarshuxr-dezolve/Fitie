# CONCERNS — Fitie Codebase Audit

## CRITICAL — Security

### C1. Hardcoded admin credentials with weak defaults (server.py:646-648)
`seed_admin()` falls back to `admin@fitie.com` / `admin123` when `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars are absent. The password `admin123` passes through `hash_password()` but the default is still well-known. The same hardcoded admin credentials appear in `conftest.py:25-27` and `test_auth.py:37-38`. If the server starts without these env vars, the admin account is trivially guessable.

### C2. CORS allows all origins with credentials (server.py:677-683)
```python
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], ...)
```
CORS with `allow_origins=["*"]` and `allow_credentials=True` is a security anti-pattern. Browsers may reject this combination, but it also signals that the production endpoint list is not configured. Origins should be explicitly listed (e.g., `["http://localhost:8081"]` for Expo dev).

### C3. Cookies set with `secure=False` (server.py:146-147, 159-160)
Cookies on `access_token` and `refresh_token` are set with `secure=False`. In production on HTTPS this should be `secure=True`. The `httponly` flag is correctly set (good), but `samesite="lax"` should be `"strict"` for production.

### C4. No rate limiting on auth endpoints (server.py:125-161)
The `/auth/register`, `/auth/login` endpoints have no rate limiting or brute-force protection. An attacker can attempt unlimited password guesses.

### C5. No password strength enforcement on the backend (server.py:125-148)
The frontend enforces "min 6 chars" (`register.tsx:20`), but the backend's `RegisterInput` model has no password validation — a single-character password would be accepted.

### C6. JWT secret relies entirely on `JWT_SECRET` env var (server.py:31)
If `JWT_SECRET` is missing, the server crashes on first token creation — but there is no validation at startup that this variable is set. Missing secrets should fail fast with a clear error.

### C7. No input validation on `HealthReportInput.data` (server.py:117-118)
The `data` field is `dict` with no schema restriction. Any arbitrary JSON is accepted and persisted to MongoDB, opening a potential injection vector if the data is later processed blindly.

### C8. Food search endpoint is unauthenticated and uses unsanitized regex (server.py:349-355, 352)
```python
query = {"name": {"$regex": q, "$options": "i"}}
```
No auth required; the `q` parameter flows directly into a `$regex`. While PyMongo driver-level protections prevent most NoSQL injection, unescaped regex special chars in user input can cause ReDoS or errors.

---

## HIGH — Data Integrity & Correctness

### C9. `user['_id']` reference fails in AI chat after profile scrub (server.py:497)
In `/ai/chat`, `get_current_user` strips `user["_id"]` from the returned dict (line 63: `user.pop("_id", None)`), but the AI handler accesses `user['_id']` directly (line 497), which will always raise `KeyError`. The endpoint therefore always hits the `except Exception` fallback.

### C10. No ownership verification on AI chat session (server.py:498)
The `session_id` string is built from `user['_id']` which as noted above is missing. Even if fixed, any other code path using `session_id` needs to ensure cross-user isolation.

### C11. Calorie goal hardcoded to 2200 in frontend (nutrition.tsx:53)
```python
const goal = 2200;
```
No user customization or backend-derived goal. This will be wrong for many users.

### C12. Exercise lookup by string ID (workouts/start, server.py:224-226)
Exercises are looked up with `{"id": eid}` (a custom string field, not `_id`), but this field is not indexed. Concurrent or large-scale queries will be slow.

### C13. `MealInput.calories` accepts negative values
Pydantic model `calories: float` has no `Field(ge=0)`. Negative or absurd calorie values would be accepted and stored.

### C14. WeightLogInput allows any float (no range validation)
A weight of `0`, `-50`, or `9999` would be accepted and written to the DB.

### C15. `update_profile` uses `inp.dict()` instead of `inp.model_dump()` (server.py:178)
Pydantic v2 deprecated `.dict()`. Works but generates warnings.

---

## MEDIUM — Error Handling & Reliability

### C16. No global exception handler
FastAPI has no custom exception handler. Uncaught Python exceptions return a 500 with a stack trace in the response body (default FastAPI debug behavior can expose internals).

### C17. `log_error` is imported but never used (server.py:8)
`logging.basicConfig` is set but `logger` is only used in `seed` functions and the AI chat fallback. No endpoint logs errors, making post-incident debugging difficult.

### C18. AI chat catches all exceptions and hides the real error (server.py:505-514)
Any failure (network, API key, model error) silently returns a generic fallback. The user has no indication that AI is not working.

### C19. `detect_machine` imports `random` inside the function (server.py:522)
Minor inefficiency, but also signals this endpoint is a simulation stub with no path to a real camera/ML integration.

### C20. `complete_workout` doesn't verify workout belongs to user before completing (partial)
The query includes `user_id: user["id"]` (line 247), which is good, but an already-completed workout can be "completed" again, overwriting timestamps and metrics.

---

## MEDIUM — Testing Gaps

### C21. No test for `/user/profile` endpoints (GET and PUT)
`test_user_profile.py` does not exist. Profile read/update are untested.

### C22. No test for `/ai/chat`
`test_ai.py` does not exist. The AI endpoint has no coverage.

### C23. Auth missing: no test for expired token, invalid token format, or refresh token
Only basic 401/no-token is tested. Edge cases in JWT handling are not covered.

### C24. No test for `/workout-plans` endpoint
The `GET /api/workout-plans` route (server.py:293-299) has no test.

### C25. No test for `/auth/logout`
The logout endpoint is not tested.

### C26. Tests require a live running server
The test fixtures use `requests.Session()` against `EXPO_PUBLIC_BACKEND_URL` (conftest.py:8). There is no `httpx.AsyncClient` + `TestClient` for unit-level testing. Tests cannot run without network and a seeded database.

### C27. Duplicate test meals across test runs
Tests don't clean up between runs (no database teardown fixture), so `get_todays_meals` asserts like `len(data["meals"]) >= 2` grow stale over time.

---

## LOW — Code Quality & Maintenance

### C28. No `.env` example file
No `.env.example` or `.env.sample` exists. Developers must guess required environment variables: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `EMERGENT_LLM_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EXPO_PUBLIC_BACKEND_URL`.

### C29. `.gitignore` has duplicate and malformed entries (root `.gitignore`:82-89)
```
android-sdk/-e 
# Environment files
*.env
*.env.*
-e 
# Environment files
*.env
*.env.*
```
Lines 82 and 86 contain `-e` which are invalid ignore patterns. The `*.env` block is duplicated twice.

### C30. Frontend `.gitignore` omits `*.env` — only has `.env*.local` (frontend/.gitignore:34)
A plain `.env` file in the frontend directory would be committed.

### C31. No frontend test infrastructure
No `__tests__/` or `.test.tsx` files exist in the frontend. No Jest, React Native Testing Library, or Detox setup.

### C32. `data: any` used in multiple API functions (api.ts)
`updateProfile(data: any)`, `uploadReport(data: { report_type: string; data: any })` — loses TypeScript safety.

### C33. No error boundary or global error handling on the frontend
Axios errors in API calls are caught locally with `catch { Alert.alert('Error', '...') }` or silently swallowed in `AuthContext:43` (`catch { await AsyncStorage.removeItem('token'); }`). Network errors surface as generic alerts with no retry mechanism.

### C34. Commit messages are auto-generated (git log)
All commits are "Auto-generated changes" or "auto-commit for <uuid>". No meaningful commit history for human review.

### C35. Large dependency lock
`requirements.txt` pins 124 packages including heavy ones like `google-genai`, `google-ai-generativelanguage`, `litellm`, `pandas`, `stripe`, `boto3` that are not imported in `server.py`. This suggests copy-pasted requirements rather than minimal dependency management.
