# TESTING - Fitie

## Test Framework

**pytest** (v9.0.2) is the sole test framework. Tests are backend API integration tests that hit a live running server.

- Test runner: `pytest`
- HTTP client: `requests` library (Python `requests.Session`)
- No mocks -- all tests are live integration tests against a running backend

## Test Location

All tests live in `backend/tests/`:

```
backend/tests/
  __init__.py
  conftest.py          # Shared fixtures
  test_auth.py         # Auth endpoint tests (6 tests)
  test_exercises.py    # Exercise endpoint tests (6 tests)
  test_health.py       # Health endpoint tests (3 tests)
  test_nutrition.py    # Nutrition endpoint tests (5 tests)
  test_progress.py     # Progress tracking tests (4 tests)
  test_scan.py         # Scan/machine detection tests (2 tests)
  test_workouts.py     # Workout endpoint tests (5 tests)
```

**Total: 31 tests across 7 test modules.**

## Test Organization

Tests follow a consistent pattern:

1. **One test class per API domain** (e.g., `TestAuth`, `TestWorkouts`, `TestExercises`)
2. **Class-based** -- each test file contains a single test class with multiple test methods
3. **Method naming**: `test_<action>_<subject>` or `test_<subject>_requires_auth`
4. **Docstrings**: Every test method has a triple-quoted docstring describing what it tests and the endpoint (e.g., `"""Test POST /api/meals"""`)

### Auth tests (test_auth.py)
- `test_register_new_user` -- registers a user with UUID-suffixed email
- `test_register_duplicate_email` -- verifies 400 on duplicate registration
- `test_login_success` -- logs in as admin user
- `test_login_invalid_credentials` -- verifies 401 on wrong password
- `test_get_me_authenticated` -- verifies `/auth/me` returns user without password hash or MongoDB `_id`
- `test_get_me_unauthenticated` -- verifies `/auth/me` returns 401 without token

### Exercise tests (test_exercises.py)
- `test_get_all_exercises` -- verifies exactly 23 exercises returned
- `test_get_exercises_by_muscle_group` -- filters by muscle group
- `test_get_exercises_by_equipment` -- filters by equipment type
- `test_get_muscle_groups` -- lists all muscle groups
- `test_get_single_exercise` -- fetches exercise by ID
- `test_get_nonexistent_exercise` -- verifies 404 for invalid ID

### Workout tests (test_workouts.py)
- `test_start_workout` -- starts a workout with exercise IDs
- `test_complete_workout` -- starts then completes a workout
- `test_get_workout_history` -- retrieves workout history
- `test_get_active_workout` -- fetches current active workout
- `test_workout_requires_auth` -- verifies 401 without auth

### Nutrition tests (test_nutrition.py)
- `test_log_meal` -- logs a meal with full macros
- `test_get_todays_meals` -- logs then retrieves today's meals with totals
- `test_search_foods` -- searches food database
- `test_get_meal_history` -- retrieves meal history with days param
- `test_meal_requires_auth` -- verifies 401 without auth

### Progress tests (test_progress.py)
- `test_log_weight` -- logs a weight entry
- `test_get_weight_history` -- logs weights then retrieves history
- `test_get_progress_stats` -- verifies stats structure (total_workouts, streak, etc.)
- `test_progress_requires_auth` -- verifies 401 without auth

### Health tests (test_health.py)
- `test_upload_health_report` -- uploads a health report, verifies AI insights returned
- `test_get_health_reports` -- uploads then retrieves reports
- `test_health_requires_auth` -- verifies 401 without auth

### Scan tests (test_scan.py)
- `test_scan_detect` -- tests machine detection endpoint (simulated)
- `test_scan_requires_auth` -- verifies 401 without auth

## Shared Fixtures (conftest.py)

All fixtures are in `backend/tests/conftest.py`:

| Fixture | Scope | Description |
|---------|-------|-------------|
| `base_url` | session | Reads `EXPO_PUBLIC_BACKEND_URL` from env, strips trailing slash |
| `api_client` | function | Fresh `requests.Session` with `Content-Type: application/json` |
| `admin_token` | session | Logs in as `admin@fitie.com` / `admin123`, returns JWT token. Skips tests if login fails. |
| `auth_headers` | function | Returns `{"Authorization": "Bearer {token}"}` headers |

## Test Execution

### How to run
```bash
# From the backend directory or repo root:
pytest

# Or explicitly:
cd backend
python -m pytest tests/

# Allowing skips (if admin login fails, tests using admin_token will skip):
pytest --continue-on-collection-errors
```

### Environment requirements
- `EXPO_PUBLIC_BACKEND_URL` must be set in the environment (tests fail without it)
- Backend server must be running and accessible
- Admin user (`admin@fitie.com` / `admin123`) must exist in the database
- MongoDB must be running with the configured database

### Test Report Output
- pytest generates JUnit XML reports to `test_reports/pytest/pytest_results.xml`
- Report includes: test class names, test names, execution times, pass/fail/skip status

### Latest Test Run Results (from pytest_results.xml)
- **31 tests, 0 failures, 0 errors, 0 skipped** -- all passing
- Total execution time: ~4.9 seconds
- Individual test times range from ~0.09s to ~0.5s
- Auth tests are slightly slower due to registration/login overhead

## Testing Patterns

### Assertions
- All tests assert `response.status_code` first, then check response body structure
- Common pattern: `assert response.status_code == 200, f"<operation> failed: {response.text}"`
- Response body assertions check for key presence (`"id" in data`) and value equality
- MongoDB `_id` is explicitly verified as absent (`"_id" in data` asserts False)
- Password hash is verified absent in auth responses
- Type checks: `isinstance(data, list)`, type checks for numeric fields

### Auth Testing
- Every protected endpoint has a `*_requires_auth` test that verifies 401 without token
- Authenticated tests use the `auth_headers` fixture (admin token)
- Unauthenticated tests omit the headers entirely

### Test Data Management
- Uses UUID-suffixed emails for registrations to avoid conflicts: `f"test_{uuid.uuid4().hex[:8]}@fitie.com"`
- Cross-test data sharing via `pytest.<attribute>` (e.g., `pytest.workout_id = data["id"]`)
- Tests are ordered to create data needed by subsequent tests within the same class
- Each test class is independent - no cross-class data dependencies

### What IS tested
- All REST API endpoints (CRUD operations)
- Authentication enforcement (401 on protected routes)
- Response schemas and field presence
- Error cases (400 for duplicates, 404 for missing resources, 401 for unauthed)
- Filtering and query parameters
- Data type validation in responses

### What is NOT tested
- No unit tests (no mocking, no isolated function tests)
- No frontend tests
- No database-level tests
- No performance or load tests
- No security tests beyond basic auth enforcement
- No test isolation (tests share state via the running server and database)
- No frontend unit/integration tests
- No E2E tests against the React Native app
