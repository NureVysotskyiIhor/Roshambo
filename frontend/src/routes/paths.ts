export const PATHS = {
  LOGIN: '/login',
  REGISTER: '/register',
  ROOMS_NEW: '/rooms/new',
  PROFILE: '/profile',
  ROOM: (code: string) => `/rooms/${code}`,
} as const;
