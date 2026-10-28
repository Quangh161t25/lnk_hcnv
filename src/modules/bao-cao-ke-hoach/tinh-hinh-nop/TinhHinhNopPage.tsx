import { useEffect, useMemo, useState } from 'react';
import { AlarmClock, Building2, CalendarRange, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Clock, FileDown, Info, Percent, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import { exportToExcel } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Feedback';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { BarChartBox, ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import { useSheetTable } from '@/lib/sheetTable';
import { useAuthStore } from '@/stores/auth';
import { useEmployeeStore } from '@/stores/employees';
import { pullEmployees } from '@/services/employeesSheet';
import departmentsSeed from '@/data/departments.json';
import { LOAI_KY_LABEL, currentPeriod, periodCount, periodLabel, periodRange, statusLabel, usePlans, type LoaiKy } from '../ke-hoach/data';
import { useReports } from '../bao-cao/data';
import { CompletionBar } from '../bao-cao/BaoCaoDetail';
import { SUBMIT_COLOR, SUBMIT_LABEL, deadlineOf, lateBy, submitState, useDeadlines, type DocKind, type SubmitState } from '../deadlines';
import type { WorkflowDoc } from '../workflowData';

interface Department {
  id: string;
  ma_phong_ban: string;
  ten_phong_ban: string;
  truong_phong?: string;
}

type Doc = WorkflowDoc<unknown> & { phan_tram?: number };

interface Row {
  key: string;
  ma: string;
  ten: string;
  phong_ban: string;
  doc?: Doc;
  state: SubmitState;
}

const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const th = 'px-3 py-2 text-left text-xs font-semibold text-foreground/80 whitespace-nowrap';

function shift(loaiKy: LoaiKy, nam: number, soKy: number, delta: number) {
  let n = nam;
  let k = soKy + delta;
  while (k < 1) {
    n -= 1;
    k += periodCount(loaiKy, n);
  }
  while (k > periodCount(loaiKy, n)) {
    k -= periodCount(loaiKy, n);
    n += 1;
  }
  return { nam: n, so_ky: k };
}

/** Bản phù hợp nhất của một người / phòng trong kỳ: ưu tiên bản đã gửi sớm nhất. */
function pick(docs: Doc[]) {
  const sent = docs.filter((d) => d.tg_gui).sort((a, b) => String(a.tg_gui).localeCompare(String(b.tg_gui)));
  return sent[0] ?? docs[0];
}

function StateBadge({ state }: { state: SubmitState }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${SUBMIT_COLOR[state]}`}>{SUBMIT_LABEL[state]}</span>;
}

function RowsTable({ title, icon, rows, kind, nameHeader, deadline }: { title: string; icon: React.ReactNode; rows: Row[]; kind: DocKind; nameHeader: string; deadline: dayjs.Dayjs | null }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">({rows.length})</span>
      </div>
      <div className="overflow-x-auto max-h-[460px] custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border sticky top-0">
            <tr>
              <th className={`${th} min-w-[190px]`}>{nameHeader}</th>
              <th className={th}>Tình trạng nộp</th>
              <th className={th}>Gửi lúc</th>
              <th className={th}>Duyệt</th>
              {kind === 'bc' && <th className={`${th} min-w-[130px]`}>Hoàn thành</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Không có đối tượng phải nộp
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <span className="font-medium text-foreground whitespace-nowrap">{r.ten}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.ma}
                      {r.phong_ban ? ` · ${r.phong_ban}` : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <StateBadge state={r.state} />
                    {r.state === 'muon' && r.doc?.tg_gui ? <span className="block text-[11px] text-amber-600 mt-0.5">{lateBy(r.doc.tg_gui, deadline)}</span> : null}
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground whitespace-nowrap">{r.doc?.tg_gui ? formatDateTime(r.doc.tg_gui) : r.doc ? 'Đang soạn (nháp)' : '—'}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{r.doc ? statusLabel(r.doc.trang_thai) : '—'}</td>
                  {kind === 'bc' && <td className="px-3 py-2">{r.doc?.tg_gui ? <CompletionBar value={r.doc.phan_tram ?? 0} /> : <span className="text-xs text-muted-foreground">—</span>}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Báo cáo & Kế hoạch › Tình hình nộp: ai đã nộp đúng hạn / muộn / chưa nộp trong từng kỳ. */
export default function TinhHinhNopPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [kind, setKind] = useState<DocKind>('bc');
  const [loaiKy, setLoaiKy] = useState<LoaiKy>('tuan');
  const [period, setPeriod] = useState(() => currentPeriod('tuan'));
  const [stateF, setStateF] = useState<string[]>([]);
  const { plans, me, isLoading: lp } = usePlans();
  const { reports, isLoading: lr } = useReports();
  const { rows: departments } = useSheetTable<Department>('departments', departmentsSeed as Department[]);
  const employees = useEmployeeStore((s) => s.employees);
  const { find } = useDeadlines();
  const ready = useChartReady();

  useEffect(() => {
    pullEmployees().catch(() => undefined);
  }, []);
  useEffect(() => {
    setPeriod(currentPeriod(loaiKy));
  }, [loaiKy]);
  useEffect(() => {
    if (kind === 'bc' && loaiKy === 'quy') setLoaiKy('thang');
  }, [kind, loaiKy]);

  const docs = (kind === 'kh' ? plans : reports) as Doc[];
  const rule = find(kind, loaiKy);

  /** Tính danh sách phải nộp + tình trạng cho một kỳ. */
  const evaluate = (nam: number, soKy: number) => {
    const range = periodRange(loaiKy, nam, soKy);
    const deadline = deadlineOf(rule, range);
    const inPeriod = docs.filter((d) => d.loai_ky === loaiKy && d.tu_ngay === range.tu_ngay);
    const people: Row[] = rule?.bat_buoc_ca_nhan
      ? employees
          .filter((e) => e.trang_thai !== 'da_nghi_viec' && (!e.ngay_vao_lam || e.ngay_vao_lam <= range.den_ngay))
          .filter((e) => isAdmin || e.ma_nv.toLowerCase() === (me?.ma_nv ?? user?.employee_code ?? '').toLowerCase())
          .map((e) => {
            const doc = pick(inPeriod.filter((d) => d.loai === 'ca_nhan' && d.nguoi_lap.toLowerCase() === e.ma_nv.toLowerCase()));
            return { key: e.ma_nv, ma: e.ma_nv, ten: e.ho_ten, phong_ban: e.phong_ban, doc, state: submitState(doc, deadline) };
          })
      : [];
    const depts: Row[] = rule?.bat_buoc_phong_ban
      ? departments
          .filter((d) => String(d.truong_phong ?? '').trim())
          .filter((d) => isAdmin || me?.quan_ly.includes(d.id))
          .map((d) => {
            const doc = pick(inPeriod.filter((x) => x.loai === 'phong_ban' && x.phong_ban_id === d.id));
            return { key: d.id, ma: d.ma_phong_ban, ten: d.ten_phong_ban, phong_ban: `Trưởng phòng: ${employees.find((e) => e.ma_nv === d.truong_phong)?.ho_ten ?? d.truong_phong}`, doc, state: submitState(doc, deadline) };
          })
      : [];
    return { range, deadline, people, depts };
  };

  const cur = useMemo(() => evaluate(period.nam, period.so_ky), [period, docs, employees, departments, rule, isAdmin, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = [...cur.people, ...cur.depts];
  const count = (s: SubmitState[]) => all.filter((r) => s.includes(r.state)).length;
  const due = all.filter((r) => r.state !== 'chua_den_han' || r.doc?.tg_gui).length;
  const onTimeRate = due ? Math.round((count(['dung_han']) / due) * 100) : 0;
  const filterRows = (rows: Row[]) => (stateF.length ? rows.filter((r) => stateF.includes(r.state)) : rows);

  // Xu hướng tỷ lệ đúng hạn 8 kỳ gần nhất (chỉ kỳ đã qua hạn).
  const trend = useMemo(() => {
    const out: { name: string; value: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const p = shift(loaiKy, period.nam, period.so_ky, -i);
      const e = evaluate(p.nam, p.so_ky);
      if (!e.deadline || dayjs().isBefore(e.deadline)) continue;
      const rows = [...e.people, ...e.depts];
      if (!rows.length) continue;
      out.push({ name: periodLabel({ loai_ky: loaiKy, ...p }), value: Math.round((rows.filter((r) => r.state === 'dung_han').length / rows.length) * 100) });
    }
    return out;
  }, [period, docs, employees, departments, rule, isAdmin, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportMissing = () => {
    const rows = all.filter((r) => r.state !== 'dung_han');
    if (!rows.length) return toast.info('Không có ai nộp muộn hoặc chưa nộp');
    exportToExcel(
      rows.map((r) => ({
        Loại: cur.people.includes(r) ? 'Nhân viên' : 'Phòng ban',
        Mã: r.ma,
        Tên: r.ten,
        'Phòng ban / Trưởng phòng': r.phong_ban,
        'Tình trạng': SUBMIT_LABEL[r.state],
        'Gửi lúc': r.doc?.tg_gui ? formatDateTime(r.doc.tg_gui) : '',
        'Trễ hạn': lateBy(r.doc?.tg_gui, cur.deadline),
      })),
      `tinh_hinh_nop_${kind === 'kh' ? 'ke_hoach' : 'bao_cao'}_${periodLabel({ loai_ky: loaiKy, ...period }).replace(/[^\dA-Za-z]+/g, '_')}`,
    );
  };

  const stateOptions = (Object.keys(SUBMIT_LABEL) as SubmitState[]).map((s) => ({ label: SUBMIT_LABEL[s], value: s, count: all.filter((r) => r.state === s).length }));
  const kyList: LoaiKy[] = kind === 'kh' ? ['tuan', 'thang', 'quy'] : ['tuan', 'thang'];
  const seg = (active: boolean) => cn('h-8 px-3 rounded-lg border text-xs font-medium transition-colors', active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted/50');
  const dl = cur.deadline;

  if (lp || lr) return <div className="flex-1 flex items-center justify-center py-20"><Spinner text="Đang tải dữ liệu..." /></div>;

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="shrink-0 flex flex-wrap items-center gap-2 p-3 sm:px-4 border-b border-border">
          <div className="flex gap-1">
            <button type="button" className={seg(kind === 'bc')} onClick={() => setKind('bc')}>Báo cáo</button>
            <button type="button" className={seg(kind === 'kh')} onClick={() => setKind('kh')}>Kế hoạch</button>
          </div>
          <span className="w-px h-6 bg-border" />
          <div className="flex gap-1">
            {kyList.map((k) => (
              <button key={k} type="button" className={seg(loaiKy === k)} onClick={() => setLoaiKy(k)}>
                {LOAI_KY_LABEL[k]}
              </button>
            ))}
          </div>
          <span className="w-px h-6 bg-border" />
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded-lg border border-border hover:bg-muted" onClick={() => setPeriod((p) => shift(loaiKy, p.nam, p.so_ky, -1))} aria-label="Kỳ trước">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold min-w-[200px] text-center">
              <CalendarRange size={14} className="inline mr-1 text-primary" />
              {periodLabel({ loai_ky: loaiKy, ...period }, true)}
            </span>
            <button type="button" className="p-1.5 rounded-lg border border-border hover:bg-muted" onClick={() => setPeriod((p) => shift(loaiKy, p.nam, p.so_ky, 1))} aria-label="Kỳ sau">
              <ChevronRight size={16} />
            </button>
            <button type="button" className="ml-1 text-xs text-primary hover:underline" onClick={() => setPeriod(currentPeriod(loaiKy))}>
              Kỳ này
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <MultiSelectFilter options={stateOptions} value={stateF} onChange={setStateF} placeholder="Tình trạng" icon={CircleAlert} className="w-[150px]" hideZeroCount={false} />
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportMissing}>
              <FileDown size={14} /> Xuất DS chưa / trễ
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4">
          {!isAdmin && (
            <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-400">
              <Info size={14} className="shrink-0 mt-0.5" /> Bạn đang xem tình hình nộp của bản thân{me?.quan_ly.length ? ' và các phòng mình quản lý' : ''}. Quản trị viên xem được toàn bộ công ty.
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <AlarmClock size={16} className="text-primary" />
            {rule && dl ? (
              <span>
                Hạn nộp {rule.ten.toLowerCase()}: <b>{dl.format('HH:mm')} {WEEKDAY[dl.day()]}, {dl.format('DD/MM/YYYY')}</b>
                {dayjs().isBefore(dl) ? <span className="text-muted-foreground"> · còn {dl.diff(dayjs(), 'hour') >= 24 ? `${Math.floor(dl.diff(dayjs(), 'hour') / 24)} ngày` : `${dl.diff(dayjs(), 'hour')} giờ`}</span> : <span className="text-rose-600"> · đã qua hạn</span>}
              </span>
            ) : (
              <span className="text-muted-foreground">Chưa thiết lập hạn nộp cho loại này (Thiết lập › Hạn nộp).</span>
            )}
            {rule && !rule.bat_buoc_ca_nhan && !rule.bat_buoc_phong_ban ? <span className="text-amber-600 text-xs">— loại này đang không bắt buộc với ai</span> : null}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <StatCard label="Phải nộp" value={all.length} icon={Users} primary className="col-span-2 sm:col-span-1" />
            <StatCard label="Đúng hạn" value={count(['dung_han'])} icon={CircleCheck} colorClass={SUBMIT_COLOR.dung_han} />
            <StatCard label="Nộp muộn" value={count(['muon'])} icon={Clock} colorClass={SUBMIT_COLOR.muon} />
            <StatCard label={dl && dayjs().isBefore(dl) ? 'Chưa nộp (chưa đến hạn)' : 'Chưa nộp'} value={count(['qua_han', 'chua_nop', 'chua_den_han'])} icon={CircleAlert} colorClass={SUBMIT_COLOR.qua_han} />
            <StatCard label="Tỷ lệ đúng hạn" value={`${onTimeRate}%`} icon={Percent} colorClass="bg-cyan-500/10 text-cyan-700 border-cyan-500/20" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <RowsTable title={`Nhân viên — ${kind === 'kh' ? 'kế hoạch' : 'báo cáo'} cá nhân`} icon={<Users size={14} className="text-primary" />} rows={filterRows(cur.people)} kind={kind} nameHeader="Nhân viên" deadline={dl} />
            <RowsTable title={`Phòng ban — ${kind === 'kh' ? 'kế hoạch' : 'báo cáo'} phòng ban`} icon={<Building2 size={14} className="text-primary" />} rows={filterRows(cur.depts)} kind={kind} nameHeader="Phòng ban (đã có trưởng phòng)" deadline={dl} />
          </div>

          {ready && trend.length > 1 && (
            <ChartCard title={`Tỷ lệ nộp đúng hạn ${trend.length} kỳ gần nhất (%)`} icon={<TrendingUp size={14} className="text-primary" />}>
              <BarChartBox data={trend} seriesName="% đúng hạn" />
            </ChartCard>
          )}
        </div>
      </div>
    </div>
  );
}
