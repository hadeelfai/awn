export const colors = {

  // Backgrounds
  bg: '#f8f8f8',
  bgMint: '#E6F4F5',

  surface: '#FFFFFF',
  surfaceMuted: '#F7FBFC',

  // Text
  ink: '#12343B',
  inkMuted: '#4E6870',
  inkSoft: '#7A9299',

  // Primary — Blue/Turquoise
  teal: '#159A9C',
  tealDeep: '#087F86',
  tealDark: '#15505A',
  tealBright: '#20B8BA',

  // Secondary / soft turquoise
  mint: '#D7EFF0',
  mintStrong: '#BFE4E6',

  // Borders
  border: '#D5E6E9',

  // Status
  danger: '#B42318',
  dangerSoft: '#FDECEC',

  warning: '#B54708',
  warningSoft: '#FEF4E6',

  success: '#087A68',
  successSoft: '#E5F7F3',

  info: '#1769AA',
  infoSoft: '#E7F2FC',

  overlay: 'rgba(10, 38, 45, 0.45)',

  mapLand: '#D9EBE4',
  mapRoad: '#F7FFFC',
  mapWater: '#C5DDE8',
};

export const highContrastColors = {
  ...colors,
  bg: '#FFFFFF',
  ink: '#04110E',
  inkMuted: '#1B2E29',
  teal: '#0B5C55',
  tealDark: '#062E2A',
  border: '#1B3A34',
};

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#0F3B34',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#0F3B34',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
