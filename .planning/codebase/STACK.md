# STACK

## Backend (Python 3)

| Category | Library / Tool | Version |
|---|---|---|
| **Framework** | FastAPI | 0.110.1 |
| **ASGI Server** | uvicorn | 0.25.0 |
| **Database Driver** | motor (async MongoDB driver) | 3.3.1 |
| **DB Layer** | pymongo | 4.5.0 |
| **Auth - Hashing** | bcrypt | 4.1.3 |
| **Auth - Tokens** | PyJWT | 2.12.1 |
| **Auth - JWT utils** | python-jose | 3.5.0 |
| **Auth - Password lib** | passlib | 1.7.4 |
| **Validation** | pydantic | 2.12.5 |
| **HTTP** | starlette | 0.37.2 |
| **HTTP Client** | httpx | 0.28.1, requests | 2.32.5 |
| **Multipart** | python-multipart | 0.0.22 |
| **Env Vars** | python-dotenv | 1.2.2 |
| **Cloud/SDK** | boto3 | 1.42.75 |
| **Cloud** | Google AI SDKs | google-generativeai 0.8.6, google-genai 1.68.0, google-ai-generativelanguage 0.6.15 |
| **Cloud** | Google API client | google-api-python-client 2.193.0, google-auth 2.49.1 |
| **AI/ML** | openai | 1.99.9 |
| **AI/ML** | LiteLLM | 1.80.0 |
| **AI/ML** | tiktoken | 0.12.0 |
| **AI/ML** | tokenizers | 0.22.2 |
| **AI/ML** | huggingface_hub | 1.7.2 |
| **Integrations** | emergentintegrations | 0.1.0 |
| **Payments** | stripe | 14.4.1 |
| **Data** | numpy | 2.4.3 |
| **Data** | pandas | 3.0.1 |
| **Data** | pillow (PIL) | 12.1.1 |
| **Utils** | tenacity (retry) | 9.1.4 |
| **Utils** | websockets | 16.0 |
| **Utils** | PyYAML | 6.0.3 |
| **Utils** | jq | 1.11.0 |
| **Utils** | s5cmd | 0.2.0 |
| **CLI** | typer | 0.24.1 |
| **CLI** | rich | 14.3.3 |

### Testing

| Tool | Version |
|---|---|
| pytest | 9.0.2 |

Test files in `backend/tests/`:
- `conftest.py` -- session-scoped admin login fixture via HTTP to the running server; `EXPO_PUBLIC_BACKEND_URL` env var required
- `test_auth.py`
- `test_exercises.py`
- `test_health.py`
- `test_nutrition.py`
- `test_progress.py`
- `test_scan.py`
- `test_workouts.py`

Tests are **integration-level** (HTTP against running server), not unit tests.

### Linting & Formatting

| Tool | Version |
|---|---|
| black | 26.3.1 |
| flake8 | 7.3.0 |
| isort | 8.0.1 |
| mypy | 1.19.1 |

---

## Frontend (React Native / Expo)

| Category | Library / Tool | Version |
|---|---|---|
| **Framework** | Expo SDK | 54.0.33 |
| **Runtime** | React | 19.1.0 |
| **Platform** | React Native | 0.81.5 |
| **Routing** | expo-router | ~6.0.22 |
| **Navigation** | @react-navigation/native | ^7.1.6 |
| **Navigation** | @react-navigation/bottom-tabs | ^7.3.10 |
| **Navigation** | @react-navigation/native-stack | ^7.3.10 |
| **HTTP Client** | axios | ^1.14.0 |
| **Storage** | @react-native-async-storage/async-storage | 2.2.0 |
| **Camera** | expo-camera | ^55.0.13 |
| **Icons** | @expo/vector-icons | ^15.0.3 |
| **Icons** | lucide-react-native | ^1.7.0 |
| **UI** | react-native-gesture-handler | ~2.28.0 |
| **UI** | react-native-reanimated | ~4.1.1 |
| **UI** | react-native-safe-area-context | ~5.6.0 |
| **UI** | react-native-screens | ~4.16.0 |
| **UI** | react-native-svg | 15.12.1 |
| **UI** | react-native-webview | 13.15.0 |
| **UI** | react-native-worklets | 0.5.1 |
| **Env Vars** | react-native-dotenv | ^3.4.11 |
| **Web** | react-native-web | ^0.21.0 |
| **Web** | react-dom | 19.1.0 |
| **Tunneling** | @expo/ngrok | ^4.1.3 |

### Expo Modules

expo-blur ~15.0.8, expo-constants ~18.0.13, expo-font ~14.0.11, expo-haptics ~15.0.8, expo-image ~3.0.11, expo-linking ~8.0.11, expo-splash-screen ~31.0.13, expo-status-bar ~3.0.9, expo-symbols ~1.0.8, expo-system-ui ~6.0.9, expo-web-browser ~15.0.10

### Dev Tools

| Tool | Version |
|---|---|
| TypeScript | ~5.9.3 |
| ESLint | ^9.25.0 |
| eslint-config-expo | ~10.0.0 |
| @babel/core | ^7.25.2 |
| Metro (bundler) | via expo (metro.config.js present) |

### Frontend Route Structure (file-based routing via expo-router)

```
app/index.tsx                         -- root redirect
app/(auth)/login.tsx                  -- login screen
app/(auth)/register.tsx               -- registration screen
app/(tabs)/index.tsx                  -- dashboard home
app/(tabs)/activity.tsx               -- workout activity
app/(tabs)/health.tsx                 -- health reports
app/(tabs)/nutrition.tsx              -- meal tracking
app/(tabs)/profile.tsx                -- user profile
```

### Package Manager

yarn 1.22.22
