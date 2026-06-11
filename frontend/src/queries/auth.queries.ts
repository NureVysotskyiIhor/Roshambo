import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import { authStore } from '../store/auth.store';
import { userKeys } from './users.queries';

export function useGetMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const user = await usersApi.getMe();
        authStore.getState().setUser(user);
        return user;
      } catch {
        authStore.getState().clearUser();
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });
}

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      authStore.getState().setUser(user);
      qc.setQueryData(userKeys.me(), user);
    },
  });
};

export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => {
      authStore.getState().setUser(user);
      qc.setQueryData(userKeys.me(), user);
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      authStore.getState().clearUser();
      qc.clear();
    },
  });
};
