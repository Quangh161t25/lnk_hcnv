import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useEmployeeStore } from '@/stores/employees';
import type { DataSource } from '@/lib/sheetTable';

/** Trạng thái chung của tài liệu có luồng duyệt (Kế hoạch, Báo cáo). */
export const TRANG_THAI = ['Nháp', 'Đã gửi', 'Đã duyệt', 'Trả lại'] as const;
export type TrangThai = (typeof TRANG_THAI)[number];

export interface Me {
  ma_nv: string;
  role: 'admin' | 'member';
  /** ID các phòng ban mình là trưởng phòng (kèm nhóm con). */
  quan_ly: string[];
}

/** Các trường chung mà server trả về cho mỗi tài liệu. */
export interface WorkflowDoc<TItem> {
  id: string;
  tieu_de: string;
  loai: 'ca_nhan' | 'phong_ban';
  loai_ky: 'tuan' | 'thang' | 'quy';
  nam: number;
  so_ky: number;
  tu_ngay: string;
  den_ngay: string;
  phong_ban_id: string;
  ten_phong_ban?: string;
  nguoi_lap: string;
  ten_nguoi_lap: string;
  trang_thai: TrangThai;
  nguoi_duyet?: string;
  y_kien_duyet?: string;
  tg_gui?: string;
  tg_duyet?: string;
  tg_tao: string;
  tg_cap_nhat: string;
  items: TItem[];
  quyen: { sua: boolean; duyet: boolean };
}

export type WorkflowAction<TInput, TItem> =
  | { action: 'save'; doc: TInput; items: TItem[] }
  | { action: 'submit' | 'delete'; id: string }
  | { action: 'approve' | 'return'; id: string; comment?: string };

interface Config<TDoc> {
  /** Đường dẫn API, vd. /api/plans */
  endpoint: string;
  /** Khóa danh sách trong phản hồi, vd. "plans" */
  listKey: string;
  /** Khóa lưu trên trình duyệt khi chạy offline */
  localKey: string;
  idPrefix: string;
  noun: string;
  /** Bổ sung trường tính toán khi lưu offline (vd. % hoàn thành). */
  enrichLocal?: (doc: TDoc) => Partial<TDoc>;
}

/** Tạo bộ hook đọc/ghi cho một loại tài liệu: qua API (server kiểm tra quyền) hoặc lưu trên trình duyệt khi offline. */
export function createWorkflowData<TDoc extends WorkflowDoc<TItem>, TItem extends { id?: string }, TInput extends { id?: string }>(cfg: Config<TDoc>) {
  const KEY = [cfg.listKey];
  type Response = { docs: TDoc[]; me: Me; id?: string };

  const localMe = (): Me => ({ ma_nv: useAuthStore.getState().user?.employee_code ?? 'VG001', role: 'admin', quan_ly: [] });
  const readLocal = (): TDoc[] => {
    try {
      return JSON.parse(localStorage.getItem(cfg.localKey) ?? '[]') as TDoc[];
    } catch {
      return [];
    }
  };
  const writeLocal = (docs: TDoc[]) => {
    try {
      localStorage.setItem(cfg.localKey, JSON.stringify(docs));
    } catch {
      /* bỏ qua */
    }
  };
  const withPerms = (docs: TDoc[]) => docs.map((d) => ({ ...d, quyen: { sua: d.trang_thai === 'Nháp' || d.trang_thai === 'Trả lại', duyet: d.trang_thai === 'Đã gửi' } }));

  function localAction(body: WorkflowAction<TInput, TItem>): Response {
    const me = localMe();
    let docs = readLocal();
    const nowIso = new Date().toISOString();
    let id = 'id' in body ? body.id : '';
    if (body.action === 'save') {
      const old = docs.find((d) => d.id === body.doc.id);
      id = old?.id ?? `${cfg.idPrefix}-${Date.now()}`;
      const name = useEmployeeStore.getState().employees.find((e) => e.ma_nv === me.ma_nv)?.ho_ten ?? me.ma_nv;
      let doc = {
        ...(old ?? { nguoi_lap: me.ma_nv, ten_nguoi_lap: name, trang_thai: 'Nháp', tg_tao: nowIso }),
        ...body.doc,
        id,
        items: body.items.map((i, k) => ({ ...i, id: i.id ?? `${id}-${k + 1}` })),
        tg_cap_nhat: nowIso,
      } as unknown as TDoc;
      doc = { ...doc, ...(cfg.enrichLocal?.(doc) ?? {}) };
      docs = old ? docs.map((d) => (d.id === id ? doc : d)) : [doc, ...docs];
    } else if (body.action === 'delete') {
      docs = docs.filter((d) => d.id !== id);
    } else {
      const next: Record<string, TrangThai> = { submit: 'Đã gửi', approve: 'Đã duyệt', return: 'Trả lại' };
      docs = docs.map((d) =>
        d.id === id
          ? {
              ...d,
              trang_thai: next[body.action],
              ...(body.action === 'submit' ? { tg_gui: nowIso } : { nguoi_duyet: me.ma_nv, y_kien_duyet: 'comment' in body ? (body.comment ?? '') : '', tg_duyet: nowIso }),
              tg_cap_nhat: nowIso,
            }
          : d,
      );
    }
    writeLocal(docs);
    return { docs: withPerms(docs), me, id };
  }

  async function fetchDocs(): Promise<Response & { source: DataSource }> {
    const res = await apiFetch<Record<string, unknown> & { me: Me }>(cfg.endpoint);
    if (res) return { docs: res[cfg.listKey] as TDoc[], me: res.me, source: 'sheet' };
    return { docs: withPerms(readLocal()), me: localMe(), source: 'local' };
  }

  function useDocs() {
    const q = useQuery({ queryKey: KEY, queryFn: fetchDocs, staleTime: 30 * 1000 });
    return { docs: q.data?.docs ?? [], me: q.data?.me, source: q.data?.source, isLoading: q.isLoading, isError: q.isError, reload: q.refetch };
  }

  const SUCCESS: Record<string, string> = {
    save: `Đã lưu ${cfg.noun}`,
    submit: `Đã gửi ${cfg.noun} chờ duyệt`,
    approve: `Đã duyệt ${cfg.noun}`,
    return: `Đã trả lại ${cfg.noun}`,
    delete: `Đã xóa ${cfg.noun}`,
  };

  /** Mọi thao tác ghi đi qua API (server kiểm tra quyền); offline thì lưu trên trình duyệt. */
  function useDocAction(onDone?: (res: Response) => void) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (body: WorkflowAction<TInput, TItem>) => {
        const res = await apiFetch<Record<string, unknown> & { me: Me; id?: string }>(cfg.endpoint, { method: 'POST', body: JSON.stringify(body) });
        if (!res) return { res: localAction(body), source: 'local' as DataSource };
        return { res: { docs: res[cfg.listKey] as TDoc[], me: res.me, id: res.id }, source: 'sheet' as DataSource };
      },
      onSuccess: ({ res, source }, body) => {
        qc.setQueryData(KEY, { ...res, source });
        toast.success(SUCCESS[body.action]);
        onDone?.(res);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return { useDocs, useDocAction };
}
