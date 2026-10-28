import { useEmployeeStore, type Employee } from '@/stores/employees';
import { apiFetch } from '@/lib/api';
import type { DataSource } from '@/lib/sheetTable';

/** Dòng nhân viên trả về từ /api (tab "1. NhanSu_DanhSach"); không có id/ảnh đại diện. */
type SheetEmployee = Omit<Employee, 'id' | 'avatar_url'>;

const avatarFor = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

/** Gộp danh sách từ Sheet vào kho trên trình duyệt, giữ nguyên id/ảnh đại diện đã có (khớp theo Mã NV hoặc email). */
export function mergeSheetEmployees(rows: SheetEmployee[]): Employee[] {
  const current = useEmployeeStore.getState().employees;
  const merged = rows.map((se) => {
    const old = current.find((e) => e.ma_nv.toLowerCase() === se.ma_nv.toLowerCase() || e.email.toLowerCase() === se.email.toLowerCase());
    return { ...old, ...se, id: old?.id ?? `emp-${se.ma_nv}`, avatar_url: old?.avatar_url ?? avatarFor(se.ho_ten) } as Employee;
  });
  useEmployeeStore.setState({ employees: merged });
  return merged;
}

/** Tải danh sách nhân viên từ Google Sheet (qua API). Trả 'local' nếu không có API. */
export async function pullEmployees(): Promise<DataSource> {
  const res = await apiFetch<{ rows: SheetEmployee[] }>('/api/table?name=employees');
  if (!res) return 'local';
  mergeSheetEmployees(res.rows);
  return 'sheet';
}

/** Ghi toàn bộ danh sách nhân viên lên Sheet (chỉ quản trị viên). Trả 'local' nếu không có API. */
export async function pushEmployees(list: Employee[]): Promise<DataSource> {
  const rows: SheetEmployee[] = list.map(({ id: _id, avatar_url: _avatar, ...rest }) => rest);
  const res = await apiFetch<{ rows: SheetEmployee[] }>('/api/table?name=employees', { method: 'PUT', body: JSON.stringify({ rows }) });
  if (!res) return 'local';
  mergeSheetEmployees(res.rows);
  return 'sheet';
}

/** Đăng nhập tại server. Trả null nếu không có API (dùng kiểm tra offline). */
export async function loginWithSheet(account: string, password: string): Promise<{ employee: Employee; token: string } | null> {
  const res = await apiFetch<{ token: string; employee: SheetEmployee }>('/api/login', { method: 'POST', body: JSON.stringify({ account, password }) });
  if (!res) return null;
  const current = useEmployeeStore.getState().employees;
  const old = current.find((e) => e.ma_nv.toLowerCase() === res.employee.ma_nv.toLowerCase());
  const employee: Employee = { ...old, ...res.employee, id: old?.id ?? `emp-${res.employee.ma_nv}`, avatar_url: old?.avatar_url ?? avatarFor(res.employee.ho_ten) };
  if (!old) useEmployeeStore.setState({ employees: [employee, ...current] });
  return { employee, token: res.token };
}
