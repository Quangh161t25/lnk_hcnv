import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from './api';

/** Tên bảng phía server (xem api/_lib/tables.js). */
export type SheetTableName = 'employees' | 'departments' | 'positions' | 'jobLevels' | 'branches' | 'roles';

/** Nơi dữ liệu đang được đọc/ghi: Google Sheet hay bộ nhớ trình duyệt (khi không có API). */
export type DataSource = 'sheet' | 'local';

const localKey = (name: string) => `lnk-hcns:table:${name}`;
function readLocal<T>(name: string): T[] | null {
  try {
    const raw = localStorage.getItem(localKey(name));
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}
function writeLocal<T>(name: string, rows: T[]) {
  try {
    localStorage.setItem(localKey(name), JSON.stringify(rows));
  } catch {
    /* bộ nhớ trình duyệt bị chặn: bỏ qua */
  }
}

async function load<T>(name: SheetTableName, seed: T[]): Promise<{ rows: T[]; source: DataSource }> {
  const res = await apiFetch<{ rows: T[] }>(`/api/table?name=${name}`);
  if (res) return { rows: res.rows, source: 'sheet' };
  return { rows: readLocal<T>(name) ?? seed, source: 'local' };
}

/**
 * Một bảng dữ liệu lưu trên Google Sheet. Dùng giống `useState`: `setRows(prev => ...)` cập nhật ngay trên giao diện
 * rồi ghi cả bảng lên Sheet; nếu ghi lỗi thì báo lỗi và tải lại dữ liệu thật từ Sheet.
 */
export function useSheetTable<T>(name: SheetTableName, seed: T[]) {
  const qc = useQueryClient();
  const queryKey = ['sheet-table', name];
  const query = useQuery({ queryKey, queryFn: () => load(name, seed), staleTime: 30 * 1000 });
  const [rows, setLocalRows] = useState<T[]>(() => (query.data?.rows as T[] | undefined) ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (query.data) setLocalRows(query.data.rows);
  }, [query.data]);

  const source = query.data?.source;
  const setRows = useCallback(
    (action: SetStateAction<T[]>) => {
      const next = typeof action === 'function' ? (action as (p: T[]) => T[])(rowsRef.current) : action;
      setLocalRows(next);
      if (source !== 'sheet') {
        writeLocal(name, next);
        qc.setQueryData(['sheet-table', name], { rows: next, source: 'local' as DataSource });
        return;
      }
      setIsSaving(true);
      apiFetch<{ rows: T[] }>(`/api/table?name=${name}`, { method: 'PUT', body: JSON.stringify({ rows: next }) })
        .then((res) => {
          if (res) qc.setQueryData(['sheet-table', name], { rows: res.rows, source: 'sheet' as DataSource });
        })
        .catch((e: Error) => {
          toast.error(`Chưa lưu được lên Google Sheet: ${e.message}`);
          qc.invalidateQueries({ queryKey: ['sheet-table', name] });
        })
        .finally(() => setIsSaving(false));
    },
    [name, qc, source],
  );

  return { rows, setRows, isLoading: query.isLoading, isSaving, source, reload: query.refetch };
}
