import dayjs from 'dayjs';
import { createWorkflowData, type WorkflowDoc } from '../workflowData';
import { periodRange, type LoaiKy } from '../ke-hoach/data';

/* ---------- Kiểu dữ liệu (khớp api/reports.js) ---------- */

export type Phan = 'A' | 'B' | 'C' | 'D';

export interface ReportItem {
  id?: string;
  phan: Phan;
  /** A: tên việc · B: vấn đề · C: đầu việc kỳ sau · D: đề xuất */
  noi_dung: string;
  /** A: kết quả / chỉ số · B: biện pháp · C: mục tiêu · D: nội dung trình bày */
  ket_qua: string;
  phan_tram?: number | null;
  trong_so?: number | null;
  phu_trach?: string;
  han?: string;
  da_xu_ly?: boolean;
  ghi_chu?: string;
  /** A: mã đầu việc của kế hoạch đối chiếu */
  nguon_id?: string;
}

export interface Report extends WorkflowDoc<ReportItem> {
  tom_tat: string;
  ke_hoach_id: string;
  /** % hoàn thành (trung bình phần A, có trọng số) */
  phan_tram: number;
}

export interface ReportInput {
  id?: string;
  tieu_de: string;
  loai: 'ca_nhan' | 'phong_ban';
  loai_ky: 'tuan' | 'thang';
  nam: number;
  so_ky: number;
  tu_ngay: string;
  den_ngay: string;
  phong_ban_id: string;
  ten_phong_ban?: string;
  tom_tat: string;
  ke_hoach_id: string;
}

export const SECTIONS: { key: Phan; title: string; hint: string }[] = [
  { key: 'A', title: 'A. Công việc trong kỳ và kết quả', hint: 'Việc đã làm, kết quả / chỉ số đạt được và mức hoàn thành.' },
  { key: 'B', title: 'B. Vấn đề phát sinh và biện pháp', hint: 'Khó khăn, vướng mắc và cách xử lý.' },
  { key: 'C', title: 'C. Kế hoạch công việc tiếp theo', hint: 'Đầu việc kỳ sau — có thể tạo thành kế hoạch kỳ sau.' },
  { key: 'D', title: 'D. Đề xuất cải tiến', hint: 'Ý tưởng, đề xuất cải tiến quy trình / công việc.' },
];

/** % hoàn thành = trung bình phần A, có trọng số nếu đã nhập trọng số (giống server). */
export function completion(items: Pick<ReportItem, 'phan' | 'phan_tram' | 'trong_so'>[]) {
  const a = items.filter((i) => i.phan === 'A');
  if (!a.length) return 0;
  const p = (v: unknown) => Math.max(0, Math.min(100, Number(v) || 0));
  const w = a.reduce((s, i) => s + (Number(i.trong_so) || 0), 0);
  const v = w > 0 ? a.reduce((s, i) => s + p(i.phan_tram) * (Number(i.trong_so) || 0), 0) / w : a.reduce((s, i) => s + p(i.phan_tram), 0) / a.length;
  return Math.round(v);
}

export function completionColor(v: number) {
  return v >= 90 ? 'bg-emerald-500' : v >= 70 ? 'bg-sky-500' : v >= 50 ? 'bg-amber-500' : 'bg-rose-500';
}

/** Kỳ ngay sau (để tạo kế hoạch kỳ sau từ phần C). */
export function nextPeriod(loaiKy: LoaiKy, nam: number, soKy: number) {
  const { den_ngay } = periodRange(loaiKy, nam, soKy);
  const d = dayjs(den_ngay).add(1, 'day');
  if (loaiKy === 'tuan') return { nam: d.isoWeekYear(), so_ky: d.isoWeek() };
  if (loaiKy === 'thang') return { nam: d.year(), so_ky: d.month() + 1 };
  return { nam: d.year(), so_ky: Math.floor(d.month() / 3) + 1 };
}

const reportData = createWorkflowData<Report, ReportItem, ReportInput>({
  endpoint: '/api/reports',
  listKey: 'reports',
  localKey: 'lnk-hcns:reports',
  idPrefix: 'BC',
  noun: 'báo cáo',
  enrichLocal: (doc) => ({ phan_tram: completion(doc.items) }),
});

export function useReports() {
  const { docs, ...rest } = reportData.useDocs();
  return { reports: docs, ...rest };
}

export const useReportAction = reportData.useDocAction;
