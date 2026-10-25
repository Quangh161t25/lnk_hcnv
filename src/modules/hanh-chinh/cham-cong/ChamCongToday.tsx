import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Globe, LogIn, LogOut, Search, UserCheck, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { t } from '@/lib/i18n';
import {
  ATTENDANCE_STATUS_BADGE,
  ATTENDANCE_STATUS_LABELS,
  useCheckInAction,
  useRealtimeAttendance,
} from './data';

export function ChamCongToday() {
  const { data: list = [] } = useRealtimeAttendance();
  const checkInMut = useCheckInAction();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateString = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Current user demo record
  const myRecord = list.find((i) => i.id === 'rt-1');
  const isCheckedIn = Boolean(myRecord?.check_in);
  const isCheckedOut = Boolean(myRecord?.check_out);

  // Stats
  const total = list.length;
  const present = list.filter((i) => i.status === 'present').length;
  const late = list.filter((i) => i.status === 'late').length;
  const absent = list.filter((i) => i.status === 'absent').length;

  const filteredList = useMemo(() => {
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (i) =>
        i.user_name.toLowerCase().includes(q) ||
        i.department_name.toLowerCase().includes(q) ||
        i.branch_name.toLowerCase().includes(q)
    );
  }, [list, searchTerm]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
      {/* Realtime Check-in Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clock & Action Card */}
        <div className="md:col-span-2 rounded-xl border border-border bg-gradient-to-r from-card to-primary/5 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Clock size={18} />
              </span>
              <h3 className="text-base font-semibold text-foreground">{t('attendance.today.title')}</h3>
            </div>
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-3xl sm:text-4xl font-bold font-mono text-primary tracking-tight">
                {timeString}
              </span>
            </div>
            <p className="text-xs text-muted-foreground capitalize">{dateString}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground justify-center sm:justify-start pt-1">
              <span className="inline-flex items-center gap-1">
                <Globe size={13} className="text-muted-foreground" />
                IP: <strong className="text-foreground font-mono">113.190.234.12</strong> (Mạng văn phòng)
              </span>
              <span>•</span>
              <span>Ca: <strong>08:00 - 17:30</strong></span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full sm:w-auto">
            {!isCheckedIn ? (
              <Button
                size="lg"
                disabled={checkInMut.isPending}
                onClick={() => checkInMut.mutate({ isCheckOut: false })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md gap-2 h-11 px-6"
              >
                <LogIn size={18} />
                {checkInMut.isPending ? t('common.saving') : t('attendance.today.checkIn')}
              </Button>
            ) : !isCheckedOut ? (
              <div className="flex flex-col gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-medium text-center">
                  Đã vào lúc: {myRecord?.check_in}
                </div>
                <Button
                  size="lg"
                  disabled={checkInMut.isPending}
                  onClick={() => checkInMut.mutate({ isCheckOut: true })}
                  className="bg-primary hover:bg-primary/90 text-white font-medium shadow-md gap-2 h-11 px-6"
                >
                  <LogOut size={18} />
                  {checkInMut.isPending ? t('common.saving') : t('attendance.today.checkOut')}
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted/60 border border-border text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={16} />
                  <span>Hoàn thành ca hôm nay</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Vào: {myRecord?.check_in} • Ra: {myRecord?.check_out}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Chips */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-xs">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users size={14} /> Tổng nhân sự
            </span>
            <span className="text-2xl font-bold font-mono text-foreground mt-2">{total}</span>
            <span className="text-[11px] text-muted-foreground">Đã khai báo ca</span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-xs">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <UserCheck size={14} /> Đúng giờ
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-600 mt-2">{present}</span>
            <span className="text-[11px] text-emerald-600/80">Có mặt tại chỗ</span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-xs">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Clock size={14} /> Đi muộn
            </span>
            <span className="text-2xl font-bold font-mono text-amber-600 mt-2">{late}</span>
            <span className="text-[11px] text-amber-600/80">Check-in sau 08:30</span>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col justify-between shadow-xs">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle size={14} /> Chưa vào
            </span>
            <span className="text-2xl font-bold font-mono text-rose-600 mt-2">{absent}</span>
            <span className="text-[11px] text-rose-600/80">Chưa check-in</span>
          </div>
        </div>
      </div>

      {/* Realtime Attendance Table */}
      <div className="flex-1 min-h-[300px] flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap bg-muted/20">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Trạng thái chấm công theo thời gian thực</h4>
            <p className="text-xs text-muted-foreground">Theo dõi giờ vào/ra của nhân viên trong ngày</p>
          </div>
          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhân viên, phòng ban..."
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Chi nhánh</th>
                <th className="py-3 px-4">Giờ vào</th>
                <th className="py-3 px-4">Giờ ra</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredList.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{row.user_name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{row.department_name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{row.branch_name}</td>
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    {row.check_in || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {row.check_out || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${ATTENDANCE_STATUS_BADGE[row.status] || ''}`}>
                      {ATTENDANCE_STATUS_LABELS[row.status] || row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
