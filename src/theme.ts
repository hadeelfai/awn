export const colors = {
  bg: '#F3F7F4',
  bgMint: '#E7F3EE',
  surface: '#FFFFFF',
  surfaceMuted: '#F7FBFA',
  ink: '#14332C',
  inkMuted: '#4E6A62',
  inkSoft: '#7A938C',
  teal: '#128C82',
  tealDeep: '#0F6E66',
  tealDark: '#164A43',
  tealBright: '#1AA3A0',
  mint: '#D8EFEA',
  mintStrong: '#C4E6DE',
  border: '#D7E5E0',
  danger: '#B42318',
  dangerSoft: '#FDECEC',
  warning: '#B54708',
  warningSoft: '#FEF4E6',
  success: '#067647',
  successSoft: '#E7F8EF',
  info: '#175CD3',
  infoSoft: '#E8F1FF',
  overlay: 'rgba(10, 28, 24, 0.45)',
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
