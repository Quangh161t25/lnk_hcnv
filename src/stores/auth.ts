import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_EMPLOYEES, type Employee } from './employees';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member';
  avatar_url?: string | null;
  department?: string;
  position?: string;
  employee_code?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  loginAsEmployee: (emp: Employee) => void;
  logout: () => void;
}

const DEFAULT_ADMIN = INITIAL_EMPLOYEES[0];

const INITIAL_USER: AuthUser = {
  id: DEFAULT_ADMIN.id,
  email: DEFAULT_ADMIN.email,
  full_name: DEFAULT_ADMIN.ho_ten,
  role: DEFAULT_ADMIN.vai_tro,
  avatar_url: DEFAULT_ADMIN.avatar_url,
  department: DEFAULT_ADMIN.phong_ban,
  position: DEFAULT_ADMIN.chuc_vu,
  employee_code: DEFAULT_ADMIN.ma_nv,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: INITIAL_USER,
      isAuthenticated: true,
      login: (user) => set({ user, isAuthenticated: true }),
      loginAsEmployee: (emp) =>
        set({
          user: {
            id: emp.id,
            email: emp.email,
            full_name: emp.ho_ten,
            role: emp.vai_tro,
            avatar_url: emp.avatar_url,
            department: emp.phong_ban,
            position: emp.chuc_vu,
            employee_code: emp.ma_nv,
          },
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'vugia-auth-storage' },
  ),
);

export function currentUserId() {
  return useAuthStore.getState().user?.id ?? 'emp-admin';
}
