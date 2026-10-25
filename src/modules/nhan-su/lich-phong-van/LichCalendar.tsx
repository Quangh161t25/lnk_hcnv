import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/lib/format';
import { t } from '@/lib/i18n';
import { LPV_TRANG_THAI, useLichPhongVan, type LichPhongVan } from '../tuyen-dung/data';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
const EVENT_COLOR: Record<string, string> = {
  [LPV_TRANG_THAI[0]]: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
  [LPV_TRANG_THAI[1]]: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
  [LPV_TRANG_THAI[2]]: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/25',
  [LPV_TRANG_THAI[3]]: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
};

function toDayKey(v?: string | null) {
  if (!v) return '';
  const d = dayjs(v);
  if (d.isValid()) return d.format('YYYY-MM-DD');
  const s = v.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : v;
}

/** Tab "Lịch": lưới tháng (bắt đầu thứ Hai), mỗi buổi PV là một nút màu theo trạng thái. */
export function LichCalendar({ onViewDetail }: { onViewDetail: (row: LichPhongVan) => void }) {
  const { data: rows = [], isLoading } = useLichPhongVan();
  const [month, setMonth] = useState(() => dayjs());
  const ym = month.format('YYYY-MM');
  const today = dayjs().format('YYYY-MM-DD');

  const byDay = useMemo(() => {
    const m = new Map<string, LichPhongVan[]>();
    rows.forEach((r) => {
      const k = toDayKey(r.ngay);
      if (!k) return;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    });
    return m;
  }, [rows]);

  const cells = useMemo(() => {
    const start = month.startOf('month');
    const end = month.endOf('month');
    const lead = (start.day() - 1 + 7) % 7;
    const out: { date: string; current: boolean; day: number }[] = [];
    for (let i = 0; i < lead; i++) {
      const d = start.subtract(lead - i, 'day');
      out.push({ date: d.format('YYYY-MM-DD'), current: false, day: d.date() });
    }
    for (let i = 1; i <= end.date(); i++) out.push({ date: `${ym}-${String(i).padStart(2, '0')}`, current: true, day: i });
    const trail = 42 - out.length;
    for (let i = 1; i <= trail; i++) {
      const d = end.add(i, 'day');
      out.push({ date: d.format('YYYY-MM-DD'), current: false, day: d.date() });
    }
    return out;
  }, [month, ym]);

  const hasInMonth = useMemo(() => rows.some((r) => toDayKey(r.ngay).startsWith(ym)), [rows, ym]);

  if (isLoading) return <div className="flex items-center justify-center py-16 text-muted-foreground">{t('common.loading')}</div>;

  const empty = rows.length === 0;
  const title = month.format('MMMM YYYY');
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(dayjs())}
            className="p-2 rounded-lg border border-border hover:bg-muted/60 text-foreground text-sm font-medium"
            aria-label={t('lichPhongVan.calendar.today')}
          >
            {t('lichPhongVan.calendar.today')}
          </button>
          <button type="button" onClick={() => setMonth((m) => m.subtract(1, 'month'))} className="p-2 rounded-lg border border-border hover:bg-muted/60 text-foreground" aria-label={t('lichPhongVan.calendar.prevMonth')}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => setMonth((m) => m.add(1, 'month'))} className="p-2 rounded-lg border border-border hover:bg-muted/60 text-foreground" aria-label={t('lichPhongVan.calendar.nextMonth')}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-[320px] rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 shrink-0">
          {WEEKDAYS.map((d) => (
            <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground border-r border-border last:border-r-0">
              {dayjs().day(d).format('dd')}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-0">
          {cells.map(({ date, current, day }) => {
            const events = byDay.get(date) ?? [];
            const isToday = date === today;
            return (
              <div key={date} className={cn('min-h-[80px] p-1.5 border-b border-r border-border last:border-r-0 flex flex-col', !current && 'bg-muted/20', isToday && 'bg-primary/10 border-primary/30 ring-inset')}>
                <span className={cn('text-xs font-medium tabular-nums', current ? 'text-foreground' : 'text-muted-foreground', isToday && 'font-bold text-primary')}>{day}</span>
                <div className="flex-1 overflow-y-auto space-y-1 mt-1 min-h-0">
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onViewDetail(ev)}
                      className={cn('w-full text-left px-2 py-1 rounded text-xs border truncate', EVENT_COLOR[ev.trang_thai] ?? EVENT_COLOR[LPV_TRANG_THAI[0]])}
                      title={`${ev.ten_ung_vien ?? '—'} – ${t('lichPhongVan.detail.lichColVong')} ${ev.so_vong} ${ev.gio}`}
                    >
                      <span className="truncate block">
                        {ev.ten_ung_vien ?? '—'} · V{ev.so_vong}
                      </span>
                      <span className="text-xs opacity-80">{ev.gio}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {empty && (
        <div className="mt-4 p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <CalendarDays size={32} className="opacity-60" />
          <p className="font-medium">{t('lichPhongVan.calendar.emptyMonth')}</p>
          <p className="text-xs">{t('lichPhongVan.calendar.emptyMonthHint')}</p>
        </div>
      )}
      {!empty && !hasInMonth && (
        <div className="mt-4 p-3 rounded-lg border border-dashed border-border bg-muted/10 text-center text-xs text-muted-foreground">{t('lichPhongVan.calendar.emptyMonth')}</div>
      )}
    </div>
  );
}
