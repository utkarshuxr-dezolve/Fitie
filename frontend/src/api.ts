import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { name?: string; age?: number; weight?: number; height?: number; goal?: string; activity_level?: string }) =>
    api.put('/user/profile', data),
};

// Exercises
export const exerciseAPI = {
  getAll: (params?: { muscle_group?: string; equipment?: string }) =>
    api.get('/exercises', { params }),
  getOne: (id: string) => api.get(`/exercises/${id}`),
  getMuscleGroups: () => api.get('/muscle-groups'),
  getEquipment: () => api.get('/equipment'),
};

// Workouts
export const workoutAPI = {
  start: (data: { exercise_ids: string[]; plan_name?: string }) =>
    api.post('/workouts/start', data),
  complete: (id: string, data: { duration_minutes: number; calories_burned?: number; notes?: string }) =>
    api.post(`/workouts/${id}/complete`, data),
  cancel: (id: string) => api.post(`/workouts/${id}/cancel`),
  getHistory: (limit?: number) => api.get('/workouts/history', { params: { limit } }),
  getActive: () => api.get('/workouts/active'),
  getPlans: () => api.get('/workout-plans'),
};

// Nutrition
export const nutritionAPI = {
  logMeal: (data: { food_name: string; calories: number; protein?: number; carbs?: number; fat?: number; meal_type?: string }) =>
    api.post('/meals', data),
  getToday: () => api.get('/meals/today'),
  getHistory: (days?: number) => api.get('/meals/history', { params: { days } }),
  searchFoods: (q: string) => api.get('/foods/search', { params: { q } }),
};

// Health
export const healthAPI = {
  uploadReport: (data: { report_type: string; data: Record<string, unknown> }) =>
    api.post('/health/report', data),
  getReports: () => api.get('/health/reports'),
};

// Progress
export const progressAPI = {
  logWeight: (data: { weight: number; date?: string }) =>
    api.post('/progress/weight', data),
  getWeightHistory: (days?: number) => api.get('/progress/weight', { params: { days } }),
  getStats: () => api.get('/progress/stats'),
};

// AI
export const aiAPI = {
  chat: (data: { message: string; context?: string }) =>
    api.post('/ai/chat', data),
};

// Scan
export const scanAPI = {
  detect: () => api.post('/scan/detect'),
};

export default api;
