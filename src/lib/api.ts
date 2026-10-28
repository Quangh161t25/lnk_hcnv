import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

/** Lỗi do API trả về (kèm mã HTTP). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let sessionExpiredShown = false;

/**
 * Gọi API phía server (thư mục /api trên Vercel), tự gắn mã phiên đăng nhập.
 * Trả `null` khi không có API (vd. chạy `vite dev` không kèm serverless function) để nơi gọi dùng dữ liệu cục bộ.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const token = useAuthStore.getState().token;
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
    });
  } catch {
    return null;
  }
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) return null;
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    const message = body.error ?? `Lỗi ${res.status}`;
    // Phiên hết hạn / chưa đăng nhập qua server: đưa người dùng về trang đăng nhập.
    if (res.status === 401 && useAuthStore.getState().isAuthenticated) {
      if (!sessionExpiredShown) {
        sessionExpiredShown = true;
        toast.error(message);
        setTimeout(() => (sessionExpiredShown = false), 3000);
      }
      useAuthStore.getState().logout();
    }
    throw new ApiError(message, res.status);
  }
  return body;
}
