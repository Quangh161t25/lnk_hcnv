import dayjs from 'dayjs';
import { useSheetTable } from '@/lib/sheetTable';
import deadlineSeed from '@/data/bckhDeadlines.json';
import type { LoaiKy } from './ke-hoach/data';
import type { WorkflowDoc } from './workflowData';

/** Thiết lập hạn nộp (tab "24. BCKH_HanNop"). */
export interface DeadlineRule {
  id: string;
  ten: string;
  moc: 'dau_ky' | 'cuoi_ky';
  lech_ngay: number;
  gio: string;
  bat_buoc_ca_nhan: boolean;
  bat_buoc_phong_ban: boolean;
  ghi_chu: string;
}

export type DocKind = 'kh' | 'bc';
export const ruleId = (kind: DocKind, loaiKy: LoaiKy) => `${kind}_${loaiKy}`;

export function useDeadlines() {
  const table = useSheetTable<DeadlineRule>('deadlines', deadlineSeed as DeadlineRule[]);
  const rules = table.rows.length ? table.rows : (deadlineSeed as DeadlineRule[]);
  const find = (kind: DocKind, loaiKy: LoaiKy) => rules.find((r) => r.id === ruleId(kind, loaiKy));
  return { ...table, rules, find };
}

/** Thời điểm hết hạn nộp của một kỳ. */
export function deadlineOf(rule: DeadlineRule | undefined, range: { tu_ngay: string; den_ngay: string }) {
  if (!rule) return null;
  const [h, m] = String(rule.gio || '17:00').split(':').map((x) => Number(x) || 0);
  return dayjs(rule.moc === 'dau_ky' ? range.tu_ngay : range.den_ngay)
    .add(Number(rule.lech_ngay) || 0, 'day')
    .hour(h)
    .minute(m)
    .second(0);
}

export type SubmitState = 'dung_han' | 'muon' | 'chua_nop' | 'qua_han' | 'chua_den_han';

export const SUBMIT_LABEL: Record<SubmitState, string> = {
  dung_han: 'Đúng hạn',
  muon: 'Nộp muộn',
  qua_han: 'Quá hạn, chưa nộp',
  chua_nop: 'Chưa nộp',
  chua_den_han: 'Chưa đến hạn',
};

export const SUBMIT_COLOR: Record<SubmitState, string> = {
  dung_han: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  muon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  qua_han: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  chua_nop: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  chua_den_han: 'bg-muted text-muted-foreground border-border',
};

/**
 * Tình trạng nộp so với hạn: "nộp" = đã bấm Gửi duyệt (có thời điểm gửi). Bản nháp coi như chưa nộp.
 * Không có hạn (chưa thiết lập) thì đã gửi = đúng hạn.
 */
export function submitState(doc: Pick<WorkflowDoc<unknown>, 'tg_gui'> | undefined, deadline: dayjs.Dayjs | null, now = dayjs()): SubmitState {
  if (doc?.tg_gui) return deadline && dayjs(doc.tg_gui).isAfter(deadline) ? 'muon' : 'dung_han';
  if (deadline && now.isAfter(deadline)) return 'qua_han';
  return deadline ? 'chua_den_han' : 'chua_nop';
}

/** "trễ 1 ngày 3 giờ" */
export function lateBy(sentAt: string | undefined, deadline: dayjs.Dayjs | null) {
  if (!sentAt || !deadline) return '';
  const mins = dayjs(sentAt).diff(deadline, 'minute');
  if (mins <= 0) return '';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  return `trễ ${d ? `${d} ngày ` : ''}${h ? `${h} giờ` : d ? '' : `${mins} phút`}`.trim();
}
