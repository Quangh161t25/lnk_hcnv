import { useEffect, useMemo, useState } from 'react';
import { AlarmClock, Building2, Info, Save, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { useSheetTable } from '@/lib/sheetTable';
import { useAuthStore } from '@/stores/auth';
import { useEmployeeStore } from '@/stores/employees';
import { useTabParam } from '@/modules/shared/useTabParam';
import { pullEmployees } from '@/services/employeesSheet';
import departmentsSeed from '@/data/departments.json';
import { currentPeriod, periodLabel, periodRange, type LoaiKy } from '../ke-hoach/data';
import { deadlineOf, useDeadlines, type DeadlineRule } from '../deadlines';

const TABS = ['hannop', 'nguoiduyet'] as const;
type Tab = (typeof TABS)[number];

interface Department {
  id: string;
  ma_phong_ban: string;
  ten_phong_ban: string;
  cap_do: number;
  cha_id: string | null;
  truong_phong?: string;
  trang_thai: string;
}

const input = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60';
const th = 'px-3 py-2.5 text-left text-xs font-semibold text-foreground/80 whitespace-nowrap';
const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function ReadOnlyNote({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) return null;
  return (
    <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      <Info size={14} className="shrink-0 mt-0.5" /> Chỉ quản trị viên được thay đổi thiết lập. Bạn đang xem ở chế độ chỉ đọc.
    </div>
  );
}

/** Tab "Hạn nộp": hạn nộp từng loại kế hoạch / báo cáo. */
function HanNopTab({ isAdmin }: { isAdmin: boolean }) {
  const table = useDeadlines();
  const [draft, setDraft] = useState<DeadlineRule[] | null>(null);
  const rows = draft ?? table.rules;
  const dirty = draft != null;
  const set = (id: string, patch: Partial<DeadlineRule>) => setDraft(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const example = (r: DeadlineRule) => {
    const loaiKy = r.id.split('_')[1] as LoaiKy;
    const cur = currentPeriod(loaiKy);
    const range = periodRange(loaiKy, cur.nam, cur.so_ky);
    const d = deadlineOf(r, range);
    return d ? `${periodLabel({ loai_ky: loaiKy, ...cur })}: hạn ${d.format('HH:mm')} ${WEEKDAY[d.day()]}, ${d.format('DD/MM/YYYY')}` : '';
  };

  const save = () => {
    if (!draft) return;
    if (draft.some((r) => !/^\d{1,2}:\d{2}$/.test(r.gio))) return toast.error('Giờ phải có dạng HH:mm, ví dụ 17:00');
    table.setRows(draft);
    setDraft(null);
    toast.success('Đã lưu thiết lập hạn nộp');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 border-b border-border">
        <p className="text-xs text-muted-foreground max-w-2xl">
          Hạn nộp = <b>mốc</b> (ngày đầu hoặc cuối kỳ) + <b>số ngày lệch</b>, tính đến <b>giờ</b> đã đặt. "Nộp" là lúc bấm <b>Gửi duyệt</b>. Dòng không bắt buộc sẽ không bị tính là "chưa nộp".
        </p>
        <div className="flex items-center gap-2">
          <DataSourceBadge source={table.source} tab="24. BCKH_HanNop" isLoading={table.isLoading} isSaving={table.isSaving} />
          {isAdmin && (
            <>
              {dirty && (
                <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                  Hủy thay đổi
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={!dirty} className="gap-1.5">
                <Save size={14} /> Lưu
              </Button>
            </>
          )}
        </div>
      </div>
      <ReadOnlyNote isAdmin={isAdmin} />
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-3 sm:p-4">
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className={th}>Áp dụng cho</th>
                <th className={th}>Mốc</th>
                <th className={th}>Lệch ngày</th>
                <th className={th}>Giờ</th>
                <th className={th}>Bắt buộc nhân viên</th>
                <th className={th}>Bắt buộc phòng ban</th>
                <th className={`${th} min-w-[260px]`}>Ví dụ kỳ hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                    {r.ten}
                    {r.ghi_chu ? <span className="block text-xs font-normal text-muted-foreground">{r.ghi_chu}</span> : null}
                  </td>
                  <td className="px-3 py-2 min-w-[120px]">
                    <select className={input} value={r.moc} disabled={!isAdmin} onChange={(e) => set(r.id, { moc: e.target.value as DeadlineRule['moc'] })}>
                      <option value="dau_ky">Đầu kỳ</option>
                      <option value="cuoi_ky">Cuối kỳ</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 w-24">
                    <input className={input} type="number" min={-31} max={31} value={r.lech_ngay} disabled={!isAdmin} onChange={(e) => set(r.id, { lech_ngay: Number(e.target.value) })} />
                  </td>
                  <td className="px-3 py-2 w-28">
                    <input className={input} type="time" value={r.gio} disabled={!isAdmin} onChange={(e) => set(r.id, { gio: e.target.value })} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" className="w-4 h-4 accent-primary" checked={r.bat_buoc_ca_nhan} disabled={!isAdmin} onChange={(e) => set(r.id, { bat_buoc_ca_nhan: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" className="w-4 h-4 accent-primary" checked={r.bat_buoc_phong_ban} disabled={!isAdmin} onChange={(e) => set(r.id, { bat_buoc_phong_ban: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{example(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Tab "Người duyệt": trưởng phòng của từng phòng ban (ghi vào cột "Trưởng phòng (Mã NV)" của tab 2). */
function NguoiDuyetTab({ isAdmin }: { isAdmin: boolean }) {
  const table = useSheetTable<Department>('departments', departmentsSeed as Department[]);
  const employees = useEmployeeStore((s) => s.employees);
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const options = useMemo(() => [{ label: '(Chưa chỉ định)', value: '' }, ...employees.filter((e) => e.trang_thai !== 'da_nghi_viec').map((e) => ({ label: `${e.ho_ten} (${e.ma_nv})`, value: e.ma_nv }))], [employees]);
  const ordered = useMemo(() => {
    const out: Department[] = [];
    const walk = (parent: string | null) =>
      table.rows
        .filter((d) => (d.cha_id ?? null) === parent)
        .sort((a, b) => a.ma_phong_ban.localeCompare(b.ma_phong_ban))
        .forEach((d) => {
          out.push(d);
          walk(d.id);
        });
    walk(null);
    // Phòng có cha không tồn tại vẫn hiện ở cuối.
    for (const d of table.rows) if (!out.includes(d)) out.push(d);
    return out;
  }, [table.rows]);
  const headOf = (d: Department) => (draft && d.id in draft ? draft[d.id] : (d.truong_phong ?? ''));
  const inherited = (d: Department): string => {
    let p = table.rows.find((x) => x.id === d.cha_id);
    while (p) {
      const h = headOf(p);
      if (h) return h;
      p = table.rows.find((x) => x.id === p!.cha_id);
    }
    return '';
  };
  const nameOf = (ma: string) => employees.find((e) => e.ma_nv === ma)?.ho_ten ?? ma;
  const assigned = ordered.filter((d) => headOf(d)).length;

  const save = () => {
    if (!draft) return;
    table.setRows((prev) => prev.map((d) => (d.id in draft ? { ...d, truong_phong: draft[d.id] } : d)));
    setDraft(null);
    toast.success('Đã lưu người duyệt');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 border-b border-border">
        <p className="text-xs text-muted-foreground max-w-2xl">
          Trưởng phòng duyệt kế hoạch / báo cáo của phòng mình <b>và các nhóm con</b>; không tự duyệt bản của chính mình. Đã chỉ định {assigned}/{ordered.length} phòng.
        </p>
        <div className="flex items-center gap-2">
          <DataSourceBadge source={table.source} tab="2. CoCau_PhongBan" isLoading={table.isLoading} isSaving={table.isSaving} />
          {isAdmin && (
            <>
              {draft && (
                <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                  Hủy thay đổi
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={!draft} className="gap-1.5">
                <Save size={14} /> Lưu
              </Button>
            </>
          )}
        </div>
      </div>
      <ReadOnlyNote isAdmin={isAdmin} />
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-3 sm:p-4">
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className={th}>Phòng ban</th>
                <th className={`${th} min-w-[280px]`}>Trưởng phòng / người duyệt</th>
                <th className={th}>Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordered.map((d) => {
                const head = headOf(d);
                const inh = head ? '' : inherited(d);
                return (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2" style={{ paddingLeft: 12 + (d.cap_do - 1) * 20 }}>
                      <span className="flex items-center gap-2">
                        <Building2 size={14} className={d.cap_do === 1 ? 'text-primary' : 'text-muted-foreground'} />
                        <span className={d.cap_do === 1 ? 'font-semibold' : ''}>{d.ten_phong_ban}</span>
                        <span className="text-xs text-muted-foreground font-mono">{d.ma_phong_ban}</span>
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      {isAdmin ? (
                        <Select options={options} value={head} onChange={(v) => setDraft({ ...(draft ?? {}), [d.id]: v })} placeholder="Chọn trưởng phòng" dropdownInPortal />
                      ) : (
                        <span>{head ? nameOf(head) : '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{inh ? `Đang do ${nameOf(inh)} (phòng cấp trên) duyệt` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Báo cáo & Kế hoạch › Thiết lập. */
export default function ThietLapPage() {
  const [tab, setTab] = useTabParam<Tab>(TABS, 'hannop');
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  useEffect(() => {
    pullEmployees().catch(() => undefined);
  }, []);
  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab>
          tabs={[
            { id: 'hannop', label: 'Hạn nộp', icon: AlarmClock },
            { id: 'nguoiduyet', label: 'Người duyệt', icon: UserCheck },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">{tab === 'hannop' ? <HanNopTab isAdmin={isAdmin} /> : <NguoiDuyetTab isAdmin={isAdmin} />}</div>
    </div>
  );
}
