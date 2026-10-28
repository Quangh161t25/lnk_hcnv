import { useMemo } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useEmployeeStore } from '@/stores/employees';
import { createWorkflowData, type WorkflowDoc } from '../workflowData';

dayjs.extend(isoWeek);

/* ---------- Kiểu dữ liệu (khớp api/plans.js) ---------- */

export type LoaiKeHoach = 'ca_nhan' | 'phong_ban';
export type LoaiKy = 'tuan' | 'thang' | 'quy';
export { TRANG_THAI, type TrangThai, type Me } from '../workflowData';
export const UU_TIEN = ['Cao', 'Trung bình', 'Thấp'] as const;

export interface PlanItem {
  id?: string;
  ten_viec: string;
  muc_tieu: string;
  phu_trach: string;
  han: string;
  uu_tien: string;
  trong_so: number;
  ghi_chu: string;
  nguon_id?: string;
}

export interface Plan extends WorkflowDoc<PlanItem> {
  muc_tieu: string;
}

export interface PlanInput {
  id?: string;
  tieu_de: string;
  loai: LoaiKeHoach;
  loai_ky: LoaiKy;
  nam: number;
  so_ky: number;
  tu_ngay: string;
  den_ngay: string;
  phong_ban_id: string;
  ten_phong_ban?: string;
  muc_tieu: string;
}


/* ---------- Kỳ kế hoạch ---------- */

export const LOAI_KY_LABEL: Record<LoaiKy, string> = { tuan: 'Tuần', thang: 'Tháng', quy: 'Quý' };
export const LOAI_LABEL: Record<LoaiKeHoach, string> = { ca_nhan: 'Cá nhân', phong_ban: 'Phòng ban' };

export function periodCount(loaiKy: LoaiKy, nam: number) {
  // Ngày 28/12 luôn nằm trong tuần ISO cuối cùng của năm (52 hoặc 53).
  return loaiKy === 'tuan' ? dayjs(`${nam}-12-28`).isoWeek() : loaiKy === 'thang' ? 12 : 4;
}

/** Ngày đầu/cuối của kỳ (tuần theo chuẩn ISO, bắt đầu thứ Hai). */
export function periodRange(loaiKy: LoaiKy, nam: number, soKy: number) {
  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;
  if (loaiKy === 'tuan') {
    start = dayjs(`${nam}-01-04`).isoWeek(soKy).isoWeekday(1);
    end = start.add(6, 'day');
  } else if (loaiKy === 'thang') {
    start = dayjs(`${nam}-${String(soKy).padStart(2, '0')}-01`);
    end = start.endOf('month');
  } else {
    start = dayjs(`${nam}-${String((soKy - 1) * 3 + 1).padStart(2, '0')}-01`);
    end = start.add(2, 'month').endOf('month');
  }
  return { tu_ngay: start.format('YYYY-MM-DD'), den_ngay: end.format('YYYY-MM-DD') };
}

export function currentPeriod(loaiKy: LoaiKy) {
  const d = dayjs();
  if (loaiKy === 'tuan') return { nam: d.isoWeekYear(), so_ky: d.isoWeek() };
  if (loaiKy === 'thang') return { nam: d.year(), so_ky: d.month() + 1 };
  return { nam: d.year(), so_ky: Math.floor(d.month() / 3) + 1 };
}

export function periodLabel(p: Pick<Plan, 'loai_ky' | 'nam' | 'so_ky'>, withRange = false, range?: { tu_ngay: string; den_ngay: string }) {
  const base = p.loai_ky === 'tuan' ? `Tuần ${p.so_ky}/${p.nam}` : p.loai_ky === 'thang' ? `Tháng ${p.so_ky}/${p.nam}` : `Quý ${p.so_ky}/${p.nam}`;
  if (!withRange) return base;
  const r = range ?? periodRange(p.loai_ky, p.nam, p.so_ky);
  return `${base} (${dayjs(r.tu_ngay).format('DD/MM')} – ${dayjs(r.den_ngay).format('DD/MM')})`;
}

/** Khóa sắp xếp kỳ: mới nhất trước. */
export const periodSortKey = (p: Pick<Plan, 'tu_ngay' | 'loai_ky'>) => `${p.tu_ngay}|${p.loai_ky}`;

export function statusColor(s: string) {
  if (s === 'Đã duyệt') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (s === 'Đã gửi') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  if (s === 'Trả lại') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  return 'bg-muted text-muted-foreground border-border';
}
export const statusLabel = (s: string) => (s === 'Đã gửi' ? 'Chờ duyệt' : s);

/** Tên nhân viên theo mã (từ danh sách nhân viên đã tải). */
export function useEmployeeName() {
  const employees = useEmployeeStore((s) => s.employees);
  return useMemo(() => {
    const map = new Map(employees.map((e) => [e.ma_nv.toLowerCase(), e.ho_ten]));
    return (maNv?: string | null) => (maNv ? (map.get(maNv.toLowerCase()) ?? maNv) : '');
  }, [employees]);
}

/* ---------- Truy xuất dữ liệu ---------- */

const planData = createWorkflowData<Plan, PlanItem, PlanInput>({ endpoint: '/api/plans', listKey: 'plans', localKey: 'lnk-hcns:plans', idPrefix: 'KH', noun: 'kế hoạch' });

export function usePlans() {
  const { docs, ...rest } = planData.useDocs();
  return { plans: docs, ...rest };
}

export const usePlanAction = planData.useDocAction;
