import { create } from 'zustand';
import type { UserResponseDto } from '@roshambo/shared';

interface AuthState {
  user: UserResponseDto | null;
  setUser: (user: UserResponseDto) => void;
  clearUser: () => void;
}

export const authStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
