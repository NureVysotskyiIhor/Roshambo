import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { authStore } from '../store/auth.store';

export const userKeys = {
  me: () => ['users', 'me'] as const,
};

export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (user) => {
      authStore.getState().setUser(user);
      qc.setQueryData(userKeys.me(), user);
    },
  });
};
