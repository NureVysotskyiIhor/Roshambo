import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { authStore } from '../store/auth.store';
import { userKeys } from './users.queries';

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
