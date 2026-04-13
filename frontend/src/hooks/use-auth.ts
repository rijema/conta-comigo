import { useContext } from 'react';

export function useAuth() {
  return {
    user: null,
    login: async (email: string, password: string) => {},
    logout: () => {},
    isLoading: false,
  };
}
