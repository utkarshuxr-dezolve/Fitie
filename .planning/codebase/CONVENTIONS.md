# CONVENTIONS - Fitie Codebase

## Project Structure

```
Fitie/
  backend/
    server.py            # Single-file FastAPI backend
    requirements.txt     # Python dependencies
    tests/               # pytest test files
  frontend/
    src/
      api.ts             # Axios API client module
      AuthContext.tsx    # React auth context + provider
      theme.ts           # Design system tokens
    package.json
    eslint.config.js
    tsconfig.json
```

## Naming Conventions

### Backend (Python / FastAPI)
- **Files**: `snake_case.py` (e.g. `server.py`, `test_auth.py`)
- **Classes**: `PascalCase` (e.g. `TestAuth`, `RegisterInput`, `BaseModel`)
- **Functions**: `snake_case` (e.g. `hash_password`, `create_access_token`, `get_current_user`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g. `JWT_ALGORITHM`, `MONGO_URL`)
- **Pydantic models**: `PascalCase` ending in `Input` or similar (e.g. `RegisterInput`)

### Frontend (TypeScript / React Native)
- **Files**: `camelCase.ts` / `PascalCase.tsx` (e.g. `api.ts`, `AuthContext.tsx`, `theme.ts`)
- **Components/Providers**: `PascalCase` (e.g. `AuthProvider`)
- **Hooks**: `camelCase` prefixed with `use` (e.g. `useAuth`)
- **API modules**: Grouped by domain as plain objects (e.g. `authAPI`, `userAPI`, `exerciseAPI`)
- **Constants/enums**: Not used; flat exported objects (e.g. `colors`, `spacing`, `radius`)

## File Organization

### Frontend (`src/`)
- Flat structure under `src/` -- no nested directories.
- `theme.ts` exports the entire design system as named constants: `colors`, `spacing`, `radius`, `shadows`, `typography`.
- `api.ts` is a single module that creates an axios instance and exports all API clients as grouped objects.
- `AuthContext.tsx` contains the full auth context, provider component, and custom hook in one file.
- Path alias `@/*` maps to `./` (project root) via tsconfig.

### Backend
- Single-file architecture: all routes, models, and handlers in `server.py`.
- Tests live in `backend/tests/` with one test class per domain module.

## TypeScript Configuration

- `strict: true` enabled in `tsconfig.json`.
- Uses Expo's base config (`extends: "expo/tsconfig.base"`).
- Includes all `.ts` and `.tsx` files plus `.expo/types/**/*.ts`.

## ESLint Configuration

- Uses `eslint-config-expo` flat config (`eslint-config-expo/flat`).
- Ignores `dist/*`.
- No additional custom rules defined.

## Error Handling Patterns

### Backend
- Uses FastAPI's `HTTPException` with explicit status codes and detail strings (e.g. `HTTPException(status_code=401, detail="Not authenticated")`).
- JWT errors: `ExpiredSignatureError` and `InvalidTokenError` caught separately, both return 401.
- Password excluded from user objects via `user.pop("password_hash", None)` and `user.pop("_id", None)`.
- Structured logging: `logging.basicConfig` with format `'%(asctime)s - %(name)s - %(levelname)s - %(message)s'`.

### Frontend
- API client uses axios with automatic token injection via request interceptor (`api.interceptors.request.use`).
- Token retrieved from `AsyncStorage` on each request; attached as `Bearer ${token}`.
- Timeout set to 15000ms.
- Auth context wraps API calls in `try/catch`, silently swallowing errors in `logout` and `checkAuth` (catch blocks clear stale tokens or do nothing).
- `api.ts` uses `any` for untyped response payloads (e.g. `updateProfile: (data: any)`).

## Shared Types / Interfaces (Frontend)

### AuthContext.tsx
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;  // index signature for extra fields
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### api.ts -- typed request payloads (examples)
```typescript
// Auth
{ email: string; password: string; name: string }
{ email: string; password: string }

// Workouts
{ exercise_ids: string[]; plan_name?: string }
{ duration_minutes: number; calories_burned?: number; notes?: string }

// Nutrition
{ food_name: string; calories: number; protein?: number; carbs?: number; fat?: number; meal_type?: string }

// Exercises (query params)
{ muscle_group?: string; equipment?: string }
```

## Design System (theme.ts)

### Colors
- Primary palette centered on blue (`#0057FF`).
- Semantic tokens: `success` (green `#10B981), `warning` (amber `#F59E0B`), `error` (red `#EF4444`).
- Text tokens: `textMain`, `textSecondary`, `textMuted`, `textInverse`, `textBlue`.
- Surface tokens: `background`, `surface`, `surfaceBlue`, `surfaceDark`.

### Spacing scale: `xs(4) | sm(8) | md(16) | lg(24) | xl(32) | xxl(48) | screen(20)`

### Radius scale: `xs(6) | sm(10) | md(14) | lg(18) | xl(24) | full(999)`

### Typography: `h1(28/800) | h2(22/700) | h3(18/600) | body(15/400) | bodyMd(14/500) | bodySm(13/400) | label(11/700, uppercase) | stat(36/800)`

### Shadows: Three presets (`card`, `cardLight`, `button`) with blue-tinted shadow color.
