import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee } from './employees';

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
  /** Mã phiên do /api/login cấp; null khi đăng nhập chế độ offline (không có API). */
  token: string | null;
  login: (user: AuthUser) => void;
  loginAsEmployee: (emp: Employee, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: (user) => set({ user, isAuthenticated: true }),
      loginAsEmployee: (emp, token = null) =>
        set({
          token,
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
      logout: () => set({ user: null, isAuthenticated: false, token: null }),
    }),
    {
      name: 'vugia-auth-storage',
      version: 2,
      // Phiên cũ (trước khi có đăng nhập qua server) không có token: buộc đăng nhập lại một lần.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<AuthState>;
        return p.token ? (p as AuthState) : ({ user: null, isAuthenticated: false, token: null } as unknown as AuthState);
      },
    },
  ),
);

export function currentUserId() {
  return useAuthStore.getState().user?.id ?? 'emp-admin';
}
