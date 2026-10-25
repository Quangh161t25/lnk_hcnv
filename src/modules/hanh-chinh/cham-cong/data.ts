import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createMockTable } from '@/lib/mockService';
import { t } from '@/lib/i18n';

export interface RealtimeAttendance {
  id: string;
  user_id: string;
  user_name: string;
  department_name: string;
  branch_name: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'checked_out' | 'late';
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  user_name: string;
  department_name: string;
  date: string;
  shift: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  ot_hours: number;
  status: 'dung_gio' | 'di_muon' | 've_som' | 'nghi_phep' | 'khong_phep';
  ip_address?: string;
  location?: string;
}

export interface AttendanceSummary {
  id: string;
  user_id: string;
  user_name: string;
  department_name: string;
  month: string; // e.g. "2025-02"
  cong_chuan: number;
  cong_thuc_te: number;
  nghi_phep: number;
  nghi_khong_luong: number;
  di_muon: number;
  ve_som: number;
  gio_ot: number;
}

const INITIAL_REALTIME: RealtimeAttendance[] = [
  { id: 'rt-1', user_id: 'u-1', user_name: 'Nguyễn Văn Quản Trị', department_name: 'Ban Giám Đốc', branch_name: 'Trụ sở chính Hà Nội', check_in: '08:02:15', check_out: null, status: 'present' },
  { id: 'rt-2', user_id: 'u-2', user_name: 'Trần Minh Quân', department_name: 'Phòng Công nghệ', branch_name: 'Trụ sở chính Hà Nội', check_in: '08:15:20', check_out: null, status: 'present' },
  { id: 'rt-3', user_id: 'u-3', user_name: 'Lê Hoàng Nam', department_name: 'Phòng Marketing', branch_name: 'Chi nhánh TP.HCM', check_in: '08:42:10', check_out: null, status: 'late' },
  { id: 'rt-4', user_id: 'u-4', user_name: 'Vũ Thị Hồng', department_name: 'Phòng Tài chính Kế toán', branch_name: 'Trụ sở chính Hà Nội', check_in: '07:55:04', check_out: '12:05:00', status: 'checked_out' },
  { id: 'rt-5', user_id: 'u-5', user_name: 'Đặng Quốc Huy', department_name: 'Phòng Kinh doanh', branch_name: 'Trụ sở chính Hà Nội', check_in: '08:00:30', check_out: null, status: 'present' },
  { id: 'rt-6', user_id: 'u-6', user_name: 'Hoàng Lan Anh', department_name: 'Phòng Hành chính Nhân sự', branch_name: 'Trụ sở chính Hà Nội', check_in: null, check_out: null, status: 'absent' },
  { id: 'rt-7', user_id: 'u-7', user_name: 'Nguyễn Văn An', department_name: 'Phòng Công nghệ', branch_name: 'Trụ sở chính Hà Nội', check_in: '08:05:12', check_out: null, status: 'present' },
];

const INITIAL_LOGS: AttendanceLog[] = [
  { id: 'log-1', user_id: 'u-1', user_name: 'Nguyễn Văn Quản Trị', department_name: 'Ban Giám Đốc', date: '2025-02-24', shift: 'Hành chính (08:00 - 17:30)', check_in: '08:00:10', check_out: '17:35:20', work_hours: 8, ot_hours: 0, status: 'dung_gio', ip_address: '113.190.234.12' },
  { id: 'log-2', user_id: 'u-2', user_name: 'Trần Minh Quân', department_name: 'Phòng Công nghệ', date: '2025-02-24', shift: 'Hành chính (08:00 - 17:30)', check_in: '08:12:00', check_out: '19:30:00', work_hours: 8, ot_hours: 2, status: 'dung_gio', ip_address: '113.190.234.12' },
  { id: 'log-3', user_id: 'u-3', user_name: 'Lê Hoàng Nam', department_name: 'Phòng Marketing', date: '2025-02-24', shift: 'Hành chính (08:00 - 17:30)', check_in: '08:35:40', check_out: '17:30:10', work_hours: 7.5, ot_hours: 0, status: 'di_muon', ip_address: '14.161.45.88' },
  { id: 'log-4', user_id: 'u-4', user_name: 'Vũ Thị Hồng', department_name: 'Phòng Tài chính Kế toán', date: '2025-02-24', shift: 'Hành chính (08:00 - 17:30)', check_in: '07:58:20', check_out: '17:30:00', work_hours: 8, ot_hours: 0, status: 'dung_gio', ip_address: '113.190.234.12' },
  { id: 'log-5', user_id: 'u-5', user_name: 'Đặng Quốc Huy', department_name: 'Phòng Kinh doanh', date: '2025-02-24', shift: 'Hành chính (08:00 - 17:30)', check_in: '08:02:10', check_out: '18:30:00', work_hours: 8, ot_hours: 1, status: 'dung_gio', ip_address: '113.190.234.12' },
  { id: 'log-6', user_id: 'u-6', user_name: 'Hoàng Lan Anh', department_name: 'Phòng Hành chính Nhân sự', date: '2025-02-24', shift: 'Hành chính (08:00 - 17:30)', check_in: null, check_out: null, work_hours: 0, ot_hours: 0, status: 'nghi_phep' },
  { id: 'log-7', user_id: 'u-7', user_name: 'Nguyễn Văn An', department_name: 'Phòng Công nghệ', date: '2025-02-24', shift: 'Hành chính (08:00 - 17:30)', check_in: '08:04:15', check_out: '17:32:00', work_hours: 8, ot_hours: 0, status: 'dung_gio', ip_address: '113.190.234.12' },
];

const INITIAL_SUMMARY: AttendanceSummary[] = [
  { id: 'sm-1', user_id: 'u-1', user_name: 'Nguyễn Văn Quản Trị', department_name: 'Ban Giám Đốc', month: '2025-02', cong_chuan: 22, cong_thuc_te: 22, nghi_phep: 0, nghi_khong_luong: 0, di_muon: 0, ve_som: 0, gio_ot: 5 },
  { id: 'sm-2', user_id: 'u-2', user_name: 'Trần Minh Quân', department_name: 'Phòng Công nghệ', month: '2025-02', cong_chuan: 22, cong_thuc_te: 22, nghi_phep: 0, nghi_khong_luong: 0, di_muon: 1, ve_som: 0, gio_ot: 12 },
  { id: 'sm-3', user_id: 'u-3', user_name: 'Lê Hoàng Nam', department_name: 'Phòng Marketing', month: '2025-02', cong_chuan: 22, cong_thuc_te: 21, nghi_phep: 1, nghi_khong_luong: 0, di_muon: 3, ve_som: 0, gio_ot: 2 },
  { id: 'sm-4', user_id: 'u-4', user_name: 'Vũ Thị Hồng', department_name: 'Phòng Tài chính Kế toán', month: '2025-02', cong_chuan: 22, cong_thuc_te: 22, nghi_phep: 0, nghi_khong_luong: 0, di_muon: 0, ve_som: 0, gio_ot: 4 },
  { id: 'sm-5', user_id: 'u-5', user_name: 'Đặng Quốc Huy', department_name: 'Phòng Kinh doanh', month: '2025-02', cong_chuan: 22, cong_thuc_te: 21.5, nghi_phep: 0.5, nghi_khong_luong: 0, di_muon: 1, ve_som: 0, gio_ot: 8 },
  { id: 'sm-6', user_id: 'u-6', user_name: 'Hoàng Lan Anh', department_name: 'Phòng Hành chính Nhân sự', month: '2025-02', cong_chuan: 22, cong_thuc_te: 20, nghi_phep: 2, nghi_khong_luong: 0, di_muon: 0, ve_som: 0, gio_ot: 0 },
  { id: 'sm-7', user_id: 'u-7', user_name: 'Nguyễn Văn An', department_name: 'Phòng Công nghệ', month: '2025-02', cong_chuan: 22, cong_thuc_te: 22, nghi_phep: 0, nghi_khong_luong: 0, di_muon: 1, ve_som: 0, gio_ot: 6 },
];

const realtimeTable = createMockTable<RealtimeAttendance>('attendance-realtime', INITIAL_REALTIME, 200);
const logsTable = createMockTable<AttendanceLog>('attendance-logs', INITIAL_LOGS, 250);
const summaryTable = createMockTable<AttendanceSummary>('attendance-summary', INITIAL_SUMMARY, 250);

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Có mặt',
  absent: 'Vắng mặt',
  checked_out: 'Đã check-out',
  late: 'Đi muộn',
  dung_gio: 'Đúng giờ',
  di_muon: 'Đi muộn',
  ve_som: 'Về sớm',
  nghi_phep: 'Nghỉ phép',
  khong_phep: 'Nghỉ không phép',
};

export const ATTENDANCE_STATUS_BADGE: Record<string, string> = {
  present: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  absent: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
  checked_out: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
  late: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  dung_gio: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  di_muon: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  ve_som: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
  nghi_phep: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  khong_phep: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
};

export function useRealtimeAttendance() {
  return useQuery({
    queryKey: ['attendance-realtime'],
    queryFn: () => realtimeTable.getAll(),
  });
}

export function useAttendanceLogs() {
  return useQuery({
    queryKey: ['attendance-logs'],
    queryFn: () => logsTable.getAll({ orderBy: 'date', ascending: false }),
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: ['attendance-summary'],
    queryFn: () => summaryTable.getAll(),
  });
}

export function useCheckInAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ isCheckOut }: { isCheckOut: boolean }) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const userRec = await realtimeTable.getById('rt-1');
      if (userRec) {
        if (isCheckOut) {
          await realtimeTable.update('rt-1', {
            check_out: timeStr,
            status: 'checked_out',
          });
        } else {
          await realtimeTable.update('rt-1', {
            check_in: timeStr,
            status: now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30) ? 'late' : 'present',
          });
        }
      }
      return { timeStr, isCheckOut };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['attendance-realtime'] });
      qc.invalidateQueries({ queryKey: ['attendance-logs'] });
      toast.success(
        data.isCheckOut
          ? `Check-out thành công lúc ${data.timeStr}`
          : `Check-in thành công lúc ${data.timeStr}`
      );
    },
    onError: () => toast.error(t('common.error')),
  });
}
