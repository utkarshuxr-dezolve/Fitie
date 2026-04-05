// Fitie Design System - Inspired by FitBuddy reference
export const colors = {
  primary: '#0057FF',
  primaryDark: '#0046CC',
  primaryLight: '#4E95FF',
  primaryBg: '#EBF2FF',
  primaryBgSoft: '#F5F8FF',
  
  background: '#FFFFFF',
  surface: '#F5F8FF',
  surfaceBlue: '#E8F0FE',
  surfaceDark: '#1A1F36',

  border: '#E2E8F0',
  borderLight: '#EDF2F7',

  textMain: '#1A1F36',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textBlue: '#0057FF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  cardWhite: '#FFFFFF',
  cardBlue: '#F0F5FF',
  cardBlueDark: '#0057FF',
  
  tabActive: '#0057FF',
  tabInactive: '#94A3B8',
  tabBg: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 20,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, fontWeight: '500' as const },
  bodySm: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  stat: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
};
