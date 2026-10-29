import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from './api';
import { useAuthStore } from '@/stores/auth';

/** Quyền trên một module (khớp api/_lib/permissions.js). */
export interface ModulePerm {
  xem: boolean;
  them: boolean;
  sua: boolean;
  xoa: boolean;
}
export type PermAction = keyof ModulePerm;
export const FULL: ModulePerm = { xem: true, them: true, sua: true, xoa: true };
export const PERM_ACTIONS: { key: PermAction; label: string }[] = [
  { key: 'xem', label: 'Xem' },
  { key: 'them', label: 'Thêm' },
  { key: 'sua', label: 'Sửa' },
  { key: 'xoa', label: 'Xóa' },
];

/** Dòng trong tab "25. PhanQuyen_NhanVien" (ma_nv "*" = mặc định cho mọi nhân viên). */
export interface PermRow extends ModulePerm {
  ma_nv: string;
  ho_ten: string;
  module: string;
  ten_module: string;
}

interface PermResponse {
  isAdmin: boolean;
  mine: Record<string, ModulePerm>;
  rows?: PermRow[];
}

export const PERM_KEY = ['permissions'];

/** Quyền hiệu lực: dòng riêng → dòng mặc định "*" → toàn quyền. */
export function effectivePerm(rows: PermRow[], maNv: string, module: string): ModulePerm {
  const me = maNv.toLowerCase();
  const src = rows.find((r) => r.ma_nv.toLowerCase() === me && r.module === module) ?? rows.find((r) => r.ma_nv === '*' && r.module === module);
  return src ? { xem: src.xem, them: src.them, sua: src.sua, xoa: src.xoa } : { ...FULL };
}

/**
 * Quyền của người đang đăng nhập. Không có API (chạy offline) hoặc là quản trị viên → toàn quyền.
 * Module không có trong bảng quyền → toàn quyền (giống server).
 */
export function usePermissions() {
  const loggedIn = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const q = useQuery({
    queryKey: PERM_KEY,
    queryFn: async () => (await apiFetch<PermResponse>('/api/permissions')) ?? { isAdmin: true, mine: {} },
    enabled: loggedIn,
    staleTime: 60 * 1000,
  });
  const isAdmin = role === 'admin' || !!q.data?.isAdmin;
  const can = useCallback(
    (module: string, action: PermAction = 'xem') => {
      if (isAdmin || !q.data) return true;
      return (q.data.mine[module.replace(/^\//, '')] ?? FULL)[action];
    },
    [isAdmin, q.data],
  );
  return { can, isAdmin, isLoading: q.isLoading, data: q.data };
}

/* ---------- Quyền của module đang mở (dùng trong các thành phần dùng chung) ---------- */

const ModulePermContext = createContext<ModulePerm>(FULL);

/** Quyền của module đang hiển thị; ngoài module (vd. trang chủ) → toàn quyền. */
export const useModulePerm = () => useContext(ModulePermContext);

const NO_PERMISSION: Record<Exclude<PermAction, 'xem'>, string> = {
  them: 'Bạn không có quyền thêm mới trong module này',
  sua: 'Bạn không có quyền sửa trong module này',
  xoa: 'Bạn không có quyền xóa trong module này',
};

/** Nhận diện nút Thêm / Sửa / Xóa theo nhãn (dùng làm lưới an toàn cho các trang tự vẽ nút). */
function actionOf(el: HTMLElement): Exclude<PermAction, 'xem'> | null {
  const label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '').trim().split('\n')[0].trim().toLowerCase();
  if (!label) return null;
  if (/^xóa (bộ lọc|chọn|\d+ bộ lọc|lọc)/.test(label) || label === 'xóa chọn') return null;
  if (/^(xóa|xoá)(\s|$)/.test(label) || label === 'xóa tất cả' || label === 'xóa nhiều') return 'xoa';
  if (/^(sửa|chỉnh sửa)(\s|$)/.test(label)) return 'sua';
  if (/^(thêm|tạo|lập|thêm mới)(\s|$)/.test(label)) return 'them';
  return null;
}

/**
 * Bọc trang của một module: cung cấp quyền cho các thành phần dùng chung và chặn bấm các nút
 * Thêm / Sửa / Xóa khi không có quyền (kể cả nút do trang tự vẽ).
 */
export function ModulePermissionScope({ perm, children }: { perm: ModulePerm; children: ReactNode }) {
  const full = perm.them && perm.sua && perm.xoa;
  return (
    <ModulePermContext.Provider value={perm}>
      <div
        className="contents"
        onClickCapture={
          full
            ? undefined
            : (e) => {
                // Chỉ xét <button> thật: thẻ/dòng bấm để xem chi tiết (role="button") có nhãn là tiêu đề bản ghi.
                const el = (e.target as HTMLElement).closest('button') as HTMLElement | null;
                if (!el) return;
                const action = actionOf(el);
                if (action && !perm[action]) {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.error(NO_PERMISSION[action]);
                }
              }
        }
      >
        {children}
      </div>
    </ModulePermContext.Provider>
  );
}
