# Fitie Directory Structure

## Top-Level Layout

```
Fitie/
├── README.md                  -- Project readme (minimal, 30 bytes)
├── .gitignore                 -- Ignores node_modules, .env, .git, build artifacts
├── .gitconfig                 -- Local git config
├── design_guidelines.json     -- App design contract / style guidelines
├── test_result.md             -- Latest test run results
│
├── backend/                   -- Python FastAPI server
├── frontend/                  -- React Native / Expo app
├── tests/                     -- Root-level integration tests (empty __init__ placeholder)
├── test_reports/              -- Test output reports
│
├── .planning/                 -- GSD project management data
├── .emergent/                 -- Emergent platform config
└── memory/                    -- Platform memory/context files
```

## Backend (`/backend/`)

Single-file FastAPI application with co-located tests.

```
backend/
├── server.py             -- Entire application: models, routes, seed data, MongoDB
│                           -- 684 lines. All routes defined as async functions on a
│                           -- single APIRouter with prefix "/api". CORS middleware
│                           -- allows all origins with credentials.
│
├── requirements.txt      -- Python dependencies:
│                           --   fastapi, uvicorn, motor, pydantic,
│                           --   python-dotenv, bcrypt, pyjwt
│
└── tests/                -- Backend integration tests
    ├── conftest.py       -- Pytest fixtures: test app, async test client, DB setup
    ├── test_auth.py      -- Auth endpoint tests (login, register, logout, /me)
    ├── test_exercises.py -- Exercise listing and filtering tests
    ├── test_workouts.py  -- Workout start/complete/history tests
    ├── test_nutrition.py -- Meal logging and search tests
    ├── test_health.py    -- Health report upload and retrieval tests
    ├── test_progress.py  -- Weight logging and stats tests
    └── test_scan.py      -- Machine detection endpoint tests
```

## Frontend (`/frontend/`)

Expo (React Native) app with file-based routing via `expo-router`.

```
frontend/
├── app.json                    -- Expo config: name, slug, scheme, plugins, platform config
├── package.json                -- Dependencies: Expo, expo-router, react-native, axios,
│                                 AsyncStorage, etc.
├── tsconfig.json               -- Extends expo/tsconfig, sets path alias @/*
├── eslint.config.js            -- ESLint config for .ts/.tsx files
├── metro.config.js             -- Metro bundler config (symlink resolution)
├── README.md                   -- Frontend setup instructions
│
├── app/                        -- File-based routing (expo-router)
│   ├── _layout.tsx             -- Root layout: wraps app in AuthProvider, Stack navigator
│   ├── index.tsx               -- Entry point: redirects to (tabs) or (auth)/login
│   ├── +html.tsx               -- HTML shell for web support
│   │
│   ├── (auth)/                  -- Auth route group: login/register, not in tab stack
│   │   ├── _layout.tsx          -- Stack with hidden headers
│   │   ├── login.tsx            -- Login screen (email + password)
│   │   └── register.tsx         -- Registration screen (email + password + name)
│   │
│   └── (tabs)/                  -- Tab route group: 5 main app screens
│       ├── _layout.tsx          -- Tab navigator: icon bar with 5 tabs
│       ├── index.tsx            -- Dashboard/tab 1: stats overview, greeting
│       ├── activity.tsx         -- Activity/tab 2: exercises, workout plans, active workout
│       ├── health.tsx           -- Health/tab 3: AI chat, health reports, scan machine
│       ├── nutrition.tsx        -- Nutrition/tab 4: meal logging, daily totals, food search
│       └── profile.tsx          -- Profile/tab 5: user info, weight log, workout history
│
├── src/                        -- Shared code (non-route components)
│   ├── api.ts                  -- Axios-based API client. Exports namespaced API modules:
│   │                             authAPI, userAPI, exerciseAPI, workoutAPI,
│   │                             nutritionAPI, healthAPI, progressAPI, aiAPI, scanAPI
│   │                             Request interceptor injects Bearer token from AsyncStorage.
│   │
│   ├── AuthContext.tsx         -- React Context for auth state. Manages:
│   │                             user object, loading flag, login/register/logout functions.
│   │                             Persists token in AsyncStorage.
│   │
│   └── theme.ts                -- Design tokens: color palette (primary, accent,
│                                 background, text, card, success, warning, error, etc.)
│
├── assets/                     -- Static assets
│   ├── fonts/
│   │   └── SpaceMono-Regular.ttf  -- Monospace font
│   └── images/
│       ├── adaptive-icon.png   -- Adaptive launcher icon
│       ├── app-image.png       -- App store asset
│       ├── favicon.png         -- Web favicon
│       ├── icon.png            -- Standard launcher icon
│       ├── partial-react-logo.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       └── splash-image.png
│
└── scripts/
    └── reset-project.js        -- Scaffold utility to reset project structure
```

## Key Design Decisions

- **Single-file backend**: All 684 lines of `server.py` define the entire API -- models (Pydantic), routes, DB seeding, and utility functions live in one module. No service/repo layer separation.
- **Flat frontend**: No component subdirectories under screens. Each tab screen is a single `.tsx` file that imports directly from `src/` (api, AuthContext, theme). No intermediate UI component library.
- **Auth via AsyncStorage + Bearer**: Frontend stores the JWT token in `AsyncStorage` and injects it via an Axios request interceptor. Backend accepts this Bearer token and also supports cookie-based auth for web.
- **Route groups**: `(auth)` and `(tabs)` are Expo route groups -- they share the parent layout but `(auth)` screens are not part of the tab navigator, while `(tabs)` screens are always accessible after login.
