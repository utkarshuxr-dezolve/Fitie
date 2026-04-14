// Fitie Design System — matching design_guidelines.json
export const colors = {
  // Green-based palette per design spec
  primary: '#4A7C59',
  primaryDark: '#37603F',
  primaryLight: '#5B8A6B',
  primaryBg: '#EBF3ED',
  primaryBgSoft: '#F2F7F3',

  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceBlue: '#F3F4F6',
  surfaceDark: '#1A1F36',

  border: '#E5E7EB',
  borderLight: '#EDF2F7',

  textMain: '#111827',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textBlue: '#4A7C59',

  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',

  purple: '#8B5CF6',
  pink: '#EC4899',

  warningBg: '#FFFBEB',
  infoBg: '#F5F3FF',
  pinkBg: '#FDF2F8',
  successBg: '#F0FDF4',
  errorBg: '#FEF2F2',
  warningText: '#B45309',

  cardWhite: '#FFFFFF',
  cardBlue: '#F9FAFB',
  cardBlueDark: '#37603F',

  tabActive: '#4A7C59',
  tabInactive: '#9CA3AF',
  tabBg: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 24, // matches design spec screen_padding
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 12, // design spec border_radius: 12 for buttons/inputs
  lg: 16, // design spec cards border_radius: 16
  xl: 18,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, fontWeight: '500' as const },
  bodySm: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  stat: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
  display: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1 },
  statNum: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
};
